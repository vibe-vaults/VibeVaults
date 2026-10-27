/**
 * Main Responsibility: The five MCP tools (list_projects, list_feedback, get_feedback,
 * reply_to_feedback, update_feedback_status). Every call runs the same chain, in this order:
 * per-user rate limit, the connection's read-only switch (writes), the connection's workspace
 * scope, RLS through a user-scoped client, then the owner-derived access gate (paused workspace or
 * a plan without `mcpAccess`). Replies and status changes go through `feedback-service` so they
 * notify exactly like the dashboard.
 *
 * Sensitive Dependencies:
 * - `mcp/auth.ts` (session from the verified token) and `mcp/format.ts` (untrusted-text fencing and
 *   the metadata whitelist). Never return `feedbacks.metadata` whole.
 * - `tier-helpers` (`getWorkspaceAccess`, `checkMcpAccess`): gate on the workspace OWNER, never the viewer.
 * - Screenshots are fetched server-side only from our own public attachments bucket (no SSRF).
 */

import type { McpServer } from '@modelcontextprotocol/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { createActionRateLimiter } from '@/lib/action-rate-limit';
import { FEEDBACK_STATUSES, sendAgencyReplyCore, updateFeedbackStatusCore } from '@/lib/feedback-service';
import { checkMcpAccess, getWorkspaceAccess } from '@/lib/tier-helpers';
import { createUserClient, type McpSession } from './auth';
import { UNTRUSTED_NOTICE, fence, preview, projectMetadata, projectReplyPin } from './format';

const OPEN_STATUSES = ['open', 'in progress', 'in review'] as const;
const MAX_REPLY_CHARS = 5000;
const MAX_SCREENSHOTS = 3;
const MAX_SCREENSHOT_BYTES = 1024 * 1024;
const INLINE_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const NOT_FOUND = 'Feedback not found, or this connection has no access to it.';

const isRateLimited = createActionRateLimiter(60_000);
const CALLS_PER_MINUTE = 60;

type Content = { type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string };
type ToolResult = { content: Content[]; isError?: boolean };
type ToolContext = { http?: { authInfo?: { extra?: Record<string, unknown> } } };

const ok = (value: unknown, extra: Content[] = []): ToolResult => ({
    content: [{ type: 'text', text: JSON.stringify(value) }, ...extra],
});
const fail = (message: string): ToolResult => ({ isError: true, content: [{ type: 'text', text: message }] });

function appUrl() {
    return (process.env.NEXT_PUBLIC_APP_URL ?? 'https://vibe-vaults.com').replace(/\/+$/, '');
}
const dashboardUrl = (feedbackId: string) => `${appUrl()}/dashboard/feedback/${feedbackId}`;

/** Wraps a tool with the rate limit, the read-only switch and a ready user-scoped client. */
function tool<A>(
    name: string,
    opts: { write: boolean },
    fn: (args: A, s: McpSession, supabase: SupabaseClient) => Promise<ToolResult>,
) {
    return async (args: A, ctx: ToolContext): Promise<ToolResult> => {
        const session = ctx.http?.authInfo?.extra?.session as McpSession | undefined;
        if (!session) return fail('Not authenticated.');
        if (isRateLimited(`${session.userId}:${name}`, CALLS_PER_MINUTE)) {
            return fail('Too many requests. Wait a minute and try again.');
        }
        if (opts.write && !session.connection.write_enabled) {
            return fail('This connection is read-only. Turn on write access for it in VibeVaults under Account > AI agents.');
        }
        try {
            return await fn(args, session, createUserClient(session.token));
        } catch (e) {
            console.error(`VibeVaults MCP: ${name} failed`, e);
            return fail('Something went wrong on the VibeVaults side. Try again in a moment.');
        }
    };
}

/** Scope narrowing first, then the owner-derived gate. Null means proceed. */
async function authorizeWorkspace(s: McpSession, workspaceId: string): Promise<string | null> {
    const scope = s.connection.workspace_ids;
    if (scope && !scope.includes(workspaceId)) return NOT_FOUND;
    return checkMcpAccess(workspaceId, s.userId);
}

type FeedbackProject = { id: string; name: string; workspace_id: string; website_url: string | null };

/** RLS lookup of a feedback item plus its project; null when the user cannot see it. */
async function findFeedback(supabase: SupabaseClient, id: string) {
    const { data } = await supabase
        .from('feedbacks')
        .select('id, content, sender, status, created_at, metadata, projects!inner(id, name, workspace_id, website_url)')
        .eq('id', id)
        .maybeSingle();
    if (!data) return null;
    return { ...data, project: data.projects as unknown as FeedbackProject };
}

const feedbackIdFrom = (input: string) => input.match(UUID_RE)?.[0] ?? null;

/** Fetches a screenshot, but only from our own public attachments bucket. */
async function fetchScreenshot(fileUrl: string, mimeType: string, size: number): Promise<Content | null> {
    const bucketPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/feedback-attachments/`;
    if (!fileUrl.startsWith(bucketPrefix) || !INLINE_IMAGE_TYPES.includes(mimeType) || size > MAX_SCREENSHOT_BYTES) return null;
    try {
        const res = await fetch(fileUrl, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return null;
        const bytes = Buffer.from(await res.arrayBuffer());
        if (bytes.length > MAX_SCREENSHOT_BYTES) return null;
        return { type: 'image', data: bytes.toString('base64'), mimeType };
    } catch {
        return null;
    }
}

export function registerTools(server: McpServer) {
    server.registerTool(
        'list_projects',
        {
            title: 'List workspaces and projects',
            description:
                'Lists the VibeVaults workspaces this connection can see, with their projects and how many reports are open, in progress and in review. ' +
                'A workspace marked paused has an inactive subscription and cannot be read or changed. Call this first to get project ids.',
            inputSchema: z.object({}),
            annotations: { readOnlyHint: true, openWorldHint: false },
        },
        tool<Record<string, never>>('list_projects', { write: false }, async (_args, s, supabase) => {
            const { data: memberships } = await supabase
                .from('workspace_members')
                .select('role, workspaces(id, name)')
                .eq('user_id', s.userId);

            const scope = s.connection.workspace_ids;
            const workspaces = (memberships ?? [])
                .map((m) => ({ role: m.role as string, ws: m.workspaces as unknown as { id: string; name: string } | null }))
                .filter((m): m is { role: string; ws: { id: string; name: string } } => !!m.ws && (!scope || scope.includes(m.ws.id)));

            const access = await Promise.all(workspaces.map((m) => getWorkspaceAccess(m.ws.id)));
            const liveIds = workspaces.filter((_, i) => access[i].ok).map((m) => m.ws.id);

            const { data: projects } = liveIds.length
                ? await supabase.from('projects').select('id, name, website_url, workspace_id').in('workspace_id', liveIds)
                : { data: [] };
            const projectIds = (projects ?? []).map((p) => p.id);
            const { data: rows } = projectIds.length
                ? await supabase.from('feedbacks').select('project_id, status').in('project_id', projectIds).neq('status', 'completed').limit(10000)
                : { data: [] };

            const counts = new Map<string, Record<string, number>>();
            for (const r of rows ?? []) {
                const c = counts.get(r.project_id) ?? {};
                c[r.status] = (c[r.status] ?? 0) + 1;
                counts.set(r.project_id, c);
            }

            return ok({
                workspaces: workspaces.map((m, i) => ({
                    id: m.ws.id,
                    name: m.ws.name,
                    your_role: m.role,
                    paused: !access[i].ok,
                    projects: (projects ?? [])
                        .filter((p) => p.workspace_id === m.ws.id)
                        .map((p) => ({
                            id: p.id,
                            name: p.name,
                            website_url: p.website_url,
                            reports: { open: 0, 'in progress': 0, 'in review': 0, ...counts.get(p.id) },
                        })),
                })),
            });
        }),
    );

    server.registerTool(
        'list_feedback',
        {
            title: 'List feedback reports',
            description:
                'Lists feedback reports for one project, newest first. Defaults to open, in progress and in review (completed reports are hidden unless requested). ' +
                'Use get_feedback for the full context of one report. ' + UNTRUSTED_NOTICE,
            inputSchema: z.object({
                project_id: z.string().describe('Project id from list_projects.'),
                status: z.array(z.enum(FEEDBACK_STATUSES)).optional().describe('Statuses to include. Default: open, in progress, in review.'),
                page: z.string().max(300).optional().describe('Only reports from this page: a path such as /pricing, or a full URL without query string.'),
                pinned_only: z.boolean().optional().describe('Only reports pinned to an element on the page.'),
                limit: z.number().int().min(1).max(100).optional().describe('Default 25, max 100.'),
                cursor: z.string().optional().describe('next_cursor from the previous call.'),
            }),
            annotations: { readOnlyHint: true, openWorldHint: false },
        },
        tool<{ project_id: string; status?: string[]; page?: string; pinned_only?: boolean; limit?: number; cursor?: string }>(
            'list_feedback',
            { write: false },
            async (args, s, supabase) => {
                const { data: project } = await supabase.from('projects').select('id, name, workspace_id').eq('id', args.project_id).maybeSingle();
                if (!project) return fail('Project not found, or this connection has no access to it.');
                const blocked = await authorizeWorkspace(s, project.workspace_id);
                if (blocked) return fail(blocked);

                const limit = args.limit ?? 25;
                let query = supabase
                    .from('feedbacks')
                    .select('id, content, sender, status, created_at, anchor: metadata->anchor, page_key: metadata->>page_key, feedback_replies(count), feedback_attachments!feedback_attachments_feedback_id_fkey(count)')
                    .eq('project_id', project.id)
                    .in('status', args.status?.length ? args.status : [...OPEN_STATUSES])
                    .order('created_at', { ascending: false })
                    .limit(limit + 1);

                if (args.cursor) query = query.lt('created_at', args.cursor);
                if (args.pinned_only) query = query.not('metadata->anchor', 'is', null);
                if (args.page) {
                    const pattern = args.page.split('?')[0].replace(/[\\%_]/g, (c) => `\\${c}`);
                    query = args.page.startsWith('/') ? query.ilike('metadata->>page_key', `%${pattern}`) : query.ilike('metadata->>page_key', pattern);
                }

                const { data, error } = await query;
                if (error) return fail('Could not load feedback.');

                const page = (data ?? []).slice(0, limit);
                const count = (rel: unknown) => (Array.isArray(rel) ? ((rel[0] as { count?: number } | undefined)?.count ?? 0) : 0);
                return ok({
                    project: { id: project.id, name: project.name },
                    notice: UNTRUSTED_NOTICE,
                    feedback: page.map((f) => ({
                        id: f.id,
                        status: f.status,
                        created_at: f.created_at,
                        sender: f.sender,
                        content_preview: preview(f.content),
                        page_key: (f as { page_key?: string | null }).page_key ?? null,
                        pinned: !!(f as { anchor?: unknown }).anchor,
                        reply_count: count(f.feedback_replies),
                        attachment_count: count(f.feedback_attachments),
                        dashboard_url: dashboardUrl(f.id),
                    })),
                    next_cursor: (data ?? []).length > limit ? page[page.length - 1].created_at : null,
                });
            },
        ),
    );

    server.registerTool(
        'get_feedback',
        {
            title: 'Get one feedback report',
            description:
                'Returns everything known about one report: the text, the pinned element (selector, how far to trust it, offset), page URL, browser, console output, failed network requests, the reply thread, attachments, and up to 3 screenshots as images. ' +
                'Accepts a report id or a VibeVaults dashboard link. ' + UNTRUSTED_NOTICE,
            inputSchema: z.object({
                feedback: z.string().max(500).describe('Report id, or a dashboard URL like https://vibe-vaults.com/dashboard/feedback/<id>.'),
                include_screenshots: z.boolean().optional().describe('Attach screenshots as images. Default true.'),
            }),
            annotations: { readOnlyHint: true, openWorldHint: false },
        },
        tool<{ feedback: string; include_screenshots?: boolean }>('get_feedback', { write: false }, async (args, s, supabase) => {
            const id = feedbackIdFrom(args.feedback);
            if (!id) return fail('Provide a report id or a dashboard link containing one.');

            const feedback = await findFeedback(supabase, id);
            if (!feedback) return fail(NOT_FOUND);
            const blocked = await authorizeWorkspace(s, feedback.project.workspace_id);
            if (blocked) return fail(blocked);

            const [{ data: replies }, { data: attachments }] = await Promise.all([
                supabase.from('feedback_replies').select('id, content, author_role, author_name, created_at, metadata').eq('feedback_id', id).order('created_at'),
                supabase.from('feedback_attachments').select('id, reply_id, file_name, file_url, file_size, mime_type').eq('feedback_id', id),
            ]);

            const files = attachments ?? [];
            const images: Content[] = [];
            if (args.include_screenshots !== false) {
                for (const f of files.filter((a) => !a.reply_id).slice(0, MAX_SCREENSHOTS)) {
                    const img = await fetchScreenshot(f.file_url, f.mime_type, f.file_size);
                    if (img) images.push(img);
                }
            }

            const asAttachment = (a: (typeof files)[number]) => ({ name: a.file_name, type: a.mime_type, size_bytes: a.file_size, url: a.file_url });
            return ok(
                {
                    notice: UNTRUSTED_NOTICE,
                    id: feedback.id,
                    status: feedback.status,
                    created_at: feedback.created_at,
                    dashboard_url: dashboardUrl(feedback.id),
                    project: { id: feedback.project.id, name: feedback.project.name, website_url: feedback.project.website_url },
                    sender: feedback.sender,
                    content: fence(feedback.content),
                    ...projectMetadata(feedback.metadata),
                    attachments: files.filter((a) => !a.reply_id).map(asAttachment),
                    screenshots_included: images.length,
                    thread: (replies ?? []).map((r) => ({
                        id: r.id,
                        author_role: r.author_role,
                        author_name: r.author_name,
                        created_at: r.created_at,
                        // Team replies are our customer's own words; everyone else's are untrusted.
                        content: r.author_role === 'agency' ? r.content : fence(r.content),
                        ...projectReplyPin(r.metadata),
                        attachments: files.filter((a) => a.reply_id === r.id).map(asAttachment),
                    })),
                },
                images,
            );
        }),
    );

    server.registerTool(
        'reply_to_feedback',
        {
            title: 'Reply to a feedback report',
            description:
                'Posts a reply on a report, under the connected user\'s name. The client is notified by email exactly as if the user had replied in the dashboard, so write for the client. ' +
                'Requires a connection with write access.',
            inputSchema: z.object({
                feedback_id: z.string().describe('Report id.'),
                content: z.string().min(1).max(MAX_REPLY_CHARS).describe('The reply text, 1 to 5000 characters.'),
            }),
            annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
        },
        tool<{ feedback_id: string; content: string }>('reply_to_feedback', { write: true }, async (args, s, supabase) => {
            const id = feedbackIdFrom(args.feedback_id);
            if (!id) return fail('Provide a valid report id.');
            const feedback = await findFeedback(supabase, id);
            if (!feedback) return fail(NOT_FOUND);
            const blocked = await authorizeWorkspace(s, feedback.project.workspace_id);
            if (blocked) return fail(blocked);

            const metadata = { via: 'mcp', ...(s.connection.ai_marker ? { ai_assisted: true } : {}) };
            const result = await sendAgencyReplyCore(supabase, { id: s.userId, email: s.email }, id, args.content.trim(), metadata);
            if (result.error) return fail(result.error);
            return ok({ reply_id: result.replyId, feedback_id: id, dashboard_url: dashboardUrl(id) });
        }),
    );

    server.registerTool(
        'update_feedback_status',
        {
            title: 'Change a report\'s status',
            description:
                'Sets a report to open, in progress, in review or completed. Note: completed reports disappear from the client\'s widget. ' +
                'Requires a connection with write access.',
            inputSchema: z.object({
                feedback_id: z.string().describe('Report id.'),
                status: z.enum(FEEDBACK_STATUSES),
            }),
            annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        },
        tool<{ feedback_id: string; status: string }>('update_feedback_status', { write: true }, async (args, s, supabase) => {
            const id = feedbackIdFrom(args.feedback_id);
            if (!id) return fail('Provide a valid report id.');
            const feedback = await findFeedback(supabase, id);
            if (!feedback) return fail(NOT_FOUND);
            const blocked = await authorizeWorkspace(s, feedback.project.workspace_id);
            if (blocked) return fail(blocked);

            const result = await updateFeedbackStatusCore(supabase, { id: s.userId, email: s.email }, id, args.status);
            if (result.error) return fail(result.error);
            return ok({ feedback_id: id, status: args.status });
        }),
    );
}

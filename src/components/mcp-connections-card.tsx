'use client';

/**
 * Main Responsibility: The "AI agents (MCP)" card on /dashboard/account. Shows the server URL and
 * setup snippets for the common AI tools, lists the user's connections, and lets them change a
 * connection's settings (read/write, AI-assisted marker, workspace scope) or disconnect it.
 *
 * Sensitive Dependencies:
 * - Refreshes the server data when the tab becomes visible, because connections are approved in
 *   another tab and nothing else tells this page.
 * - src/actions/mcp-connections.ts: settings save on toggle (reverting if the write fails);
 *   Disconnect is an exit and stays available to a locked-out account.
 * - The server URL and the snippets must match the real endpoint and what `/docs/ai-agents`
 *   tells people; they are hand-written couplings.
 * - Rendered on /dashboard/account, which is excluded from the workspace paywall.
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Check, Copy, Loader2, Plug } from 'lucide-react';
import {
    disconnectMcpConnection,
    updateMcpConnection,
    type McpConnectionPatch,
} from '@/actions/mcp-connections';
import { reportClientError } from '@/lib/client-error-logging';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface McpConnectionView {
    client_id: string;
    client_name: string | null;
    write_enabled: boolean;
    ai_marker: boolean;
    workspace_ids: string[] | null;
    last_used_at: string | null;
}

interface WorkspaceOption {
    id: string;
    name: string;
}

const ALL_WORKSPACES = 'all';

function CopyBlock({ label, text }: { label: string; text: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div>
            <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
            <div className="flex gap-2">
                <Input value={text} readOnly aria-label={label} className="bg-white font-mono text-sm" />
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={copy}
                            className="shrink-0 bg-white cursor-pointer"
                            aria-label={`Copy ${label}`}
                        >
                            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{copied ? 'Copied!' : `Copy ${label}`}</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </div>
    );
}

function ConnectionRow({
    connection,
    workspaces,
}: {
    connection: McpConnectionView;
    workspaces: WorkspaceOption[];
}) {
    const [state, setState] = useState(connection);
    const [saving, setSaving] = useState(false);
    const [disconnected, setDisconnected] = useState(false);

    const save = async (patch: McpConnectionPatch) => {
        const previous = state;
        setState({ ...state, ...patch });
        setSaving(true);
        try {
            const result = await updateMcpConnection(state.client_id, patch);
            if (result.error) throw new Error(result.error);
        } catch (error) {
            setState(previous);
            const message = reportClientError(error, 'mcp-connection-update', { patch });
            alert(`Failed to save: ${message}`);
        } finally {
            setSaving(false);
        }
    };

    const disconnect = async () => {
        try {
            const result = await disconnectMcpConnection(state.client_id);
            if (result.error) throw new Error(result.error);
            setDisconnected(true);
        } catch (error) {
            const message = reportClientError(error, 'mcp-connection-disconnect');
            alert(`Failed to disconnect: ${message}`);
        }
    };

    if (disconnected) return null;

    const name = state.client_name || 'Unnamed AI tool';
    const scope = state.workspace_ids?.[0] ?? ALL_WORKSPACES;
    const switchId = `mcp-write-${state.client_id}`;
    const markerId = `mcp-marker-${state.client_id}`;

    return (
        <div className="rounded-lg border border-gray-200 p-4 space-y-4" data-testid="mcp-connection">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="font-medium text-gray-900 truncate flex items-center gap-2">
                        <Plug className="w-4 h-4 shrink-0 text-gray-500" />
                        {name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {state.last_used_at
                            ? `Last used ${new Date(state.last_used_at).toLocaleString()}`
                            : 'Not used yet'}
                    </p>
                </div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="cursor-pointer shrink-0">Disconnect</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Disconnect {name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                                It loses access right away. You can connect it again later from the tool itself.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={disconnect} className="cursor-pointer" variant="destructive">
                                Disconnect
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                    <Label htmlFor={switchId}>Allow replying and changing status</Label>
                    <p className="text-sm text-gray-500">
                        {state.write_enabled ? 'Read and write.' : 'Read only. It cannot reply or change status.'}
                    </p>
                </div>
                <Switch id={switchId} checked={state.write_enabled} disabled={saving} onCheckedChange={(v) => save({ write_enabled: v })} />
            </div>

            <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                    <Label htmlFor={markerId}>Mark replies as AI-assisted</Label>
                    <p className="text-sm text-gray-500">Clients see that the reply was written with AI help.</p>
                </div>
                <Switch id={markerId} checked={state.ai_marker} disabled={saving} onCheckedChange={(v) => save({ ai_marker: v })} />
            </div>

            <div className="flex items-center justify-between gap-4">
                <Label>Workspaces</Label>
                <Select
                    value={scope}
                    disabled={saving}
                    onValueChange={(v) => save({ workspace_ids: v === ALL_WORKSPACES ? null : [v] })}
                >
                    <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_WORKSPACES}>All my workspaces</SelectItem>
                        {workspaces.map((w) => (
                            <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {saving && (
                <p className="text-sm text-gray-500 flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
                </p>
            )}
        </div>
    );
}

export function McpConnectionsCard({
    serverUrl,
    connections,
    workspaces,
}: {
    serverUrl: string;
    connections: McpConnectionView[];
    workspaces: WorkspaceOption[];
}) {
    // A connection is approved in another tab, so this page cannot know it happened. Re-fetch the
    // server data whenever the tab becomes visible again instead of making the user press F5.
    const router = useRouter();
    useEffect(() => {
        const refresh = () => {
            if (document.visibilityState === 'visible') router.refresh();
        };
        document.addEventListener('visibilitychange', refresh);
        return () => document.removeEventListener('visibilitychange', refresh);
    }, [router]);

    const claudeCode = `claude mcp add --scope user --transport http vibevaults ${serverUrl}`;
    const cursor = JSON.stringify({ mcpServers: { vibevaults: { url: serverUrl } } });

    return (
        <Card className="shadow-sm border-gray-200" id="ai-agents">
            <CardHeader>
                <CardTitle className="font-semibold text-gray-900 flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    AI agents (MCP)
                </CardTitle>
                <CardDescription>
                    Let an AI tool such as Claude or Cursor read your clients&apos; feedback and, if you allow it,
                    reply and change status. New connections are read only.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-3">
                    <CopyBlock label="Server URL" text={serverUrl} />
                    <CopyBlock label="Claude Code" text={claudeCode} />
                    <CopyBlock label="Cursor (mcp.json)" text={cursor} />
                    <p className="text-sm text-gray-500">
                        Claude Desktop: Settings, Connectors, Add custom connector, then paste the server URL. Each tool
                        opens a VibeVaults page where you approve the connection.
                    </p>
                </div>

                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700">Connected tools</h3>
                    {connections.length === 0 ? (
                        <p className="text-sm text-gray-500 rounded-lg border border-dashed border-gray-200 p-4">
                            Nothing connected yet.
                        </p>
                    ) : (
                        connections.map((c) => <ConnectionRow key={c.client_id} connection={c} workspaces={workspaces} />)
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

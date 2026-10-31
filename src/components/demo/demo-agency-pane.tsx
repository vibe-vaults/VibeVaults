"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Bell, ExternalLink, LayoutDashboard, MessageSquare, Settings, Users } from "lucide-react";
import { toast } from "sonner";
import { Wordmark } from "@/components/landing/wordmark";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { FeedbackList } from "@/components/feedback-list";
import { FeedbackDetailView } from "@/components/feedback-detail-view";
import type { FeedbackDetailBackend } from "@/lib/feedback-detail-backend";
import { DemoGuideCard } from "./demo-guide-card";
import { DemoFinale } from "./demo-finale";
import { useDemoRevision, useDemoStage, type DemoBackend } from "./demo-tour";

/**
 * Main Responsibility: The agency half of /demo: a stand-in for the real
 * dashboard's Feedback page (sidebar, card list, detail with thread, status
 * and reply box) reading and writing the same in-browser sandbox the widget
 * in the left pane uses. A pin dropped on the bakery lands here as a toast
 * and a card; a reply or status change made here shows up in the widget.
 *
 * Sensitive Dependencies:
 * - The list and the detail ARE the dashboard's components (`FeedbackList`,
 *   `FeedbackDetailView`), fed through `FeedbackDetailBackend`. Do not fork
 *   their markup into the demo: the point of this pane is to show the real
 *   product, and a copy would drift.
 * - Nothing here may import Supabase or server actions (it would ship them in
 *   the /demo bundle and, worse, could reach the real API). The type-only
 *   import of `FeedbackDetailBackend` is the contract.
 * - The sidebar is decorative apart from Feedback: the demo has no other
 *   pages. `collapsible="none"` keeps it a plain column inside the pane (the
 *   default mode is fixed to the viewport's left edge).
 */

function demoDetailBackend(b: DemoBackend): FeedbackDetailBackend {
  return {
    currentUserName: async () => b.agency.name,
    fetchReplies: async (id) => b.agency.replies(id),
    fetchAttachments: async (id) => b.agency.attachments(id),
    subscribe: (_id, onChange) => b.subscribe(() => onChange("all")),
    sendReply: (id, content, files) => b.agency.reply(id, content, files),
    setStatus: async (id, status) => b.agency.setStatus(id, status),
    deleteFeedback: async (id) => b.agency.remove(id),
  };
}

const PROJECT = { name: "Crumb & Co. website", url: "crumbandco.com" };
const NAV = [
  { icon: LayoutDashboard, label: "Overview" },
  { icon: MessageSquare, label: "Feedback", active: true },
  { icon: Settings, label: "Project Settings" },
];

function DemoSidebar({ unread }: { unread: number }) {
  return (
    <Sidebar collapsible="none" className="border-r border-gray-200 bg-white">
      <SidebarHeader className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between px-2">
          <Wordmark href={null} className="text-xl" />
          <span className="relative grid h-8 w-8 place-items-center rounded-full text-gray-500" aria-label={`${unread} unread notifications`}>
            <Bell className="h-4 w-4" aria-hidden />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-white px-2 py-4 gap-6">
        <div className="flex flex-col gap-2">
          <p className="px-4 text-xs font-semibold text-gray-900">Pixel &amp; Pine</p>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="font-medium cursor-default">
                <Users className="w-4 h-4" /> <span>Users</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
        <div className="flex flex-col gap-2">
          <p className="px-4 text-xs font-semibold text-gray-900">{PROJECT.name}</p>
          <span className="flex items-center gap-1.5 px-4 py-1 text-xs text-muted-foreground truncate">
            <ExternalLink className="w-3 h-3 shrink-0" />
            <span className="truncate">{PROJECT.url}</span>
          </span>
          <SidebarMenu>
            {NAV.map(({ icon: Icon, label, active }) => (
              <SidebarMenuItem key={label}>
                <SidebarMenuButton isActive={active} className="font-medium cursor-default">
                  <Icon className="w-4 h-4" /> <span>{label}</span>
                  {active && unread > 0 && (
                    <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">{unread}</span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      </SidebarContent>
      <SidebarFooter className="bg-white border-t border-gray-100 p-4">
        <div className="flex items-center gap-2 px-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">D</span>
          <div className="min-w-0 text-sm">
            <p className="truncate font-medium">Dani</p>
            <p className="truncate text-xs text-gray-500">dani@pixelandpine.studio</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export function DemoAgencyPane({
  backend,
  visible,
  onStartOver,
  onReveal,
}: {
  backend: DemoBackend;
  /** False while a phone shows the client tab: notifications wait until then. */
  visible: boolean;
  onStartOver: () => void;
  /** Bring this pane into view (the phone layout shows one pane at a time). */
  onReveal: () => void;
}) {
  const stage = useDemoStage(backend);
  const revision = useDemoRevision(backend);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [seen, setSeen] = useState<Set<string>>(() => new Set(backend.agency.list().map((f) => f.id)));
  const detailBackend = useMemo(() => demoDetailBackend(backend), [backend]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `revision` is the change signal
  const items = useMemo(() => backend.agency.list(), [backend, revision]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `revision` is the change signal
  const selected = useMemo(() => (selectedId ? backend.agency.get(selectedId) : null), [backend, selectedId, revision]);
  const tourId = backend.tourFeedbackId();
  const unread = items.filter((f) => !seen.has(f.id)).length;

  const open = (id: string) => {
    setSelectedId(id);
    setSeen((prev) => new Set(prev).add(id));
    backend.agency.open(id);
    onReveal();
  };
  const openRef = useRef(open);
  useEffect(() => { openRef.current = open; });

  // The real dashboard's notification for a new report, same wording as the
  // `notify_new_feedback` trigger, bottom-right like GlobalNotificationProvider.
  // Held back while the pane is off screen (phone, client tab): fired over
  // the client's view it would cover the widget's own "Feedback pinned"
  // confirmation, and it belongs to the agency anyway. It shows as soon as
  // the view follows the run over here.
  const known = useRef(new Set(items.map((f) => f.id)));
  useEffect(() => {
    // Leaving the agency view takes its notifications with it.
    if (!visible) { toast.dismiss(); return; }
    for (const f of items) {
      if (known.current.has(f.id)) continue;
      known.current.add(f.id);
      toast("New Feedback", {
        description: `New feedback received from ${f.sender}`,
        action: { label: "View", onClick: () => openRef.current(f.id) },
        duration: 8000,
      });
    }
  }, [items, visible]);

  // A report deleted from under the detail view falls back to the list.
  const showDetail = !!selected;

  const guide = (
    <DemoGuideCard side="agency" stage={stage} onStartOver={onStartOver} finale={<DemoFinale />} className="mb-6" />
  );
  // Step 3 ("reply") is pointed at from right above the reply box.
  const guideAtReply = showDetail && selected?.id === tourId && stage === 2;

  return (
    <SidebarProvider defaultOpen className="min-h-0 h-full !bg-gray-50" style={{ "--sidebar-width": "14rem" } as React.CSSProperties}>
      <div className="@container/agency flex h-full w-full min-w-0">
        <div className="hidden @[760px]/agency:flex h-full">
          <DemoSidebar unread={unread} />
        </div>
        <main className="flex-1 min-w-0 overflow-y-auto bg-gray-50" data-demo-pane="agency">
          <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-white px-4 py-3 @[760px]/agency:hidden">
            <Wordmark href={null} className="text-lg" />
            <span className="relative grid h-8 w-8 place-items-center text-gray-500">
              <Bell className="h-4 w-4" aria-hidden />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unread}</span>
              )}
            </span>
          </div>
          <div className="p-5 @[560px]/agency:p-8">
            {showDetail && selected ? (
              <div className="max-w-3xl mx-auto">
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6 group cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  Back to Feedback
                </button>
                {!guideAtReply && guide}
                <FeedbackDetailView
                  key={selected.id}
                  feedback={selected}
                  mode="edit"
                  backend={detailBackend}
                  onDeleted={() => setSelectedId(null)}
                  replySlot={guideAtReply ? guide : undefined}
                />
              </div>
            ) : (
              <>
                <h1 className="font-serif text-4xl leading-[1.1] tracking-tight text-gray-900 flex items-baseline flex-wrap gap-x-3 gap-y-1 mb-6">
                  Feedback <span className="font-sans text-xl text-gray-400 font-normal">/ {PROJECT.name}</span>
                </h1>
                {guide}
                <FeedbackList feedbackItems={items} onOpen={open} highlightId={stage === 1 ? tourId : null} />
              </>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

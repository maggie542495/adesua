import "server-only";
import { createClient } from "@/lib/supabase/server";

export type DashboardStats = {
  enquiries: {
    total: number;
    new: number;
    inProgress: number;
    awaitingResponse: number;
    resolved: number;
    archived: number;
  };
  content: {
    publishedArticles: number;
    draftArticles: number;
    publishedPages: number;
    publishedServices: number;
    collectivePublished: number;
  };
  media: {
    total: number;
    featured: number;
  };
  chatbot: {
    activeConversations: number;
    escalated: number;
  };
  email: {
    unreadInbox: number;
    drafts: number;
  };
  recentEnquiries: {
    id: string;
    name: string;
    email: string;
    category: string;
    status: string;
    created_at: string;
  }[];
  recentAudit: {
    id: string;
    action: string;
    resource_type: string;
    actor_email: string | null;
    created_at: string;
  }[];
};

async function countWhere(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  filters: { column: string; value: string | boolean }[],
): Promise<number> {
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  for (const f of filters) {
    query = query.eq(f.column, f.value);
  }
  const { count, error } = await query;
  if (error) throw new Error(`count ${table}: ${error.message}`);
  return count ?? 0;
}

/** Real database counts for the dashboard — no fabricated analytics. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const [
    enqTotal,
    enqNew,
    enqProgress,
    enqAwaiting,
    enqResolved,
    enqArchived,
    articlesPublished,
    articlesDraft,
    pagesPublished,
    servicesPublished,
    collectivePublished,
    mediaTotal,
    mediaFeatured,
    chatActive,
    chatEscalated,
    inboxUnread,
    drafts,
  ] = await Promise.all([
    countWhere(supabase, "enquiries", []),
    countWhere(supabase, "enquiries", [{ column: "status", value: "new" }]),
    countWhere(supabase, "enquiries", [{ column: "status", value: "in_progress" }]),
    countWhere(supabase, "enquiries", [{ column: "status", value: "awaiting_response" }]),
    countWhere(supabase, "enquiries", [{ column: "status", value: "resolved" }]),
    countWhere(supabase, "enquiries", [{ column: "status", value: "archived" }]),
    countWhere(supabase, "articles", [{ column: "status", value: "published" }]),
    countWhere(supabase, "articles", [{ column: "status", value: "draft" }]),
    countWhere(supabase, "pages", [{ column: "status", value: "published" }]),
    countWhere(supabase, "services", [{ column: "status", value: "published" }]),
    countWhere(supabase, "collective_entries", [{ column: "status", value: "published" }]),
    countWhere(supabase, "media_assets", []),
    countWhere(supabase, "media_assets", [{ column: "is_featured", value: true }]),
    countWhere(supabase, "chatbot_conversations", [{ column: "status", value: "active" }]),
    countWhere(supabase, "chatbot_conversations", [{ column: "status", value: "escalated" }]),
    countWhere(supabase, "email_messages", [
      { column: "folder", value: "inbox" },
      { column: "is_read", value: false },
    ]),
    countWhere(supabase, "email_drafts", [{ column: "status", value: "draft" }]),
  ]);

  const [recentEnqRes, recentAuditRes] = await Promise.all([
    supabase
      .from("enquiries")
      .select("id, name, email, category, status, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("audit_logs")
      .select("id, action, resource_type, actor_email, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  if (recentEnqRes.error) throw new Error(recentEnqRes.error.message);
  if (recentAuditRes.error) throw new Error(recentAuditRes.error.message);

  return {
    enquiries: {
      total: enqTotal,
      new: enqNew,
      inProgress: enqProgress,
      awaitingResponse: enqAwaiting,
      resolved: enqResolved,
      archived: enqArchived,
    },
    content: {
      publishedArticles: articlesPublished,
      draftArticles: articlesDraft,
      publishedPages: pagesPublished,
      publishedServices: servicesPublished,
      collectivePublished,
    },
    media: { total: mediaTotal, featured: mediaFeatured },
    chatbot: { activeConversations: chatActive, escalated: chatEscalated },
    email: { unreadInbox: inboxUnread, drafts },
    recentEnquiries: recentEnqRes.data ?? [],
    recentAudit: recentAuditRes.data ?? [],
  };
}

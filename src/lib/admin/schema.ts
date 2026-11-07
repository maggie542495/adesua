/**
 * The admin's single source of truth.
 *
 * Every table in `public` is described once here — where it sits in the
 * sidebar, which column identifies a record, which columns are worth showing,
 * and what kind of input each field needs. The list and editor screens are
 * generic and read this registry, so adding a table (or a column) is a
 * one-place change rather than a new page.
 */
import type { Database } from "@/types/database";

export type TableName = keyof Database["public"]["Tables"];

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "select"
  | "datetime"
  | "json"
  | "email"
  | "url";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  /** Choices for `select`. */
  options?: readonly string[];
  required?: boolean;
  /** Never rendered in the editor (ids, hashes, server-set timestamps). */
  readOnly?: boolean;
  /** Excluded from the create form but editable afterwards. */
  createOnly?: boolean;
  updateOnly?: boolean;
  help?: string;
  span?: 1 | 2;
}

export interface TableDef {
  table: TableName;
  label: string;
  plural: string;
  group: AdminGroup;
  /** Column shown as the record's name in lists and breadcrumbs. */
  primary: string;
  /** Columns shown in the list view. */
  columns: readonly string[];
  /** Columns the search box matches against. */
  searchable: readonly string[];
  orderBy: string;
  ascending?: boolean;
  description?: string;
  /** Minimum role allowed to write. Everyone signed in can read. */
  writeRole?: "editor" | "administrator" | "owner";
}

export type AdminGroup =
  | "Enquiries"
  | "Content"
  | "Email"
  | "Automation"
  | "Chatbot"
  | "Site & media"
  | "Team & access"
  | "System";

const status: readonly string[] = [
  "new",
  "in_progress",
  "awaiting_response",
  "resolved",
  "archived",
];

const contentStatus: readonly string[] = [
  "draft",
  "published",
  "scheduled",
  "unpublished",
];

const auditFields: FieldDef[] = [
  { name: "id", label: "ID", type: "text", readOnly: true },
  { name: "created_at", label: "Created", type: "datetime", readOnly: true },
  { name: "updated_at", label: "Updated", type: "datetime", readOnly: true },
];

export const tableDefs: readonly TableDef[] = [
  // ── Enquiries ──────────────────────────────────────────────────────────
  {
    table: "enquiries",
    label: "Enquiry",
    plural: "Enquiries",
    group: "Enquiries",
    primary: "name",
    columns: ["name", "email", "category", "status", "source", "created_at"],
    searchable: ["name", "email", "subject", "message"],
    orderBy: "created_at",
    ascending: false,
    description: "Everything submitted through the website contact form.",
  },
  {
    table: "enquiry_notes",
    label: "Enquiry note",
    plural: "Enquiry notes",
    group: "Enquiries",
    primary: "note",
    columns: ["enquiry_id", "author_id", "note", "created_at"],
    searchable: ["note"],
    orderBy: "created_at",
    ascending: false,
  },
  {
    table: "enquiry_assignments",
    label: "Assignment",
    plural: "Enquiry assignments",
    group: "Enquiries",
    primary: "enquiry_id",
    columns: ["enquiry_id", "assigned_to", "created_at"],
    searchable: [],
    orderBy: "created_at",
    ascending: false,
  },

  // ── Content ────────────────────────────────────────────────────────────
  {
    table: "articles",
    label: "Article",
    plural: "Insights",
    group: "Content",
    primary: "title",
    columns: ["title", "status", "category_id", "published_at", "updated_at"],
    searchable: ["title", "excerpt", "slug"],
    orderBy: "updated_at",
    ascending: false,
  },
  {
    table: "article_categories",
    label: "Category",
    plural: "Article categories",
    group: "Content",
    primary: "name",
    columns: ["name", "slug", "description"],
    searchable: ["name", "slug"],
    orderBy: "name",
    ascending: true,
  },
  {
    table: "services",
    label: "Service",
    plural: "Services",
    group: "Content",
    primary: "title",
    columns: ["title", "pathway", "status", "sort_order"],
    searchable: ["title", "summary", "slug"],
    orderBy: "sort_order",
    ascending: true,
  },
  {
    table: "pages",
    label: "Page",
    plural: "Pages",
    group: "Content",
    primary: "title",
    columns: ["title", "slug", "status", "updated_at"],
    searchable: ["title", "slug", "description"],
    orderBy: "slug",
    ascending: true,
  },
  {
    table: "page_sections",
    label: "Section",
    plural: "Page sections",
    group: "Content",
    primary: "title",
    columns: ["title", "entry_type", "status", "sort_order"],
    searchable: ["title", "summary", "slug"],
    orderBy: "sort_order",
    ascending: true,
  },
  {
    table: "collective_entries",
    label: "Collective entry",
    plural: "Collectives",
    group: "Content",
    primary: "title",
    columns: ["title", "status", "sort_order", "updated_at"],
    searchable: ["title", "summary", "slug"],
    orderBy: "sort_order",
    ascending: true,
  },
  {
    table: "homepage_content",
    label: "Homepage block",
    plural: "Homepage",
    group: "Content",
    primary: "id",
    columns: ["hero_eyebrow", "hero_headline", "updated_at"],
    searchable: ["hero_headline", "hero_eyebrow"],
    orderBy: "updated_at",
    ascending: false,
    description: "Hero copy and featured image for the landing page.",
  },

  // ── Email ──────────────────────────────────────────────────────────────
  {
    table: "email_accounts",
    label: "Mail account",
    plural: "Mail accounts",
    group: "Email",
    primary: "email",
    columns: ["email", "provider", "is_active", "created_at"],
    searchable: ["email", "provider"],
    orderBy: "created_at",
    ascending: false,
    writeRole: "administrator",
  },
  {
    table: "email_messages",
    label: "Message",
    plural: "Mailbox",
    group: "Email",
    primary: "subject",
    columns: ["subject", "from_email", "folder", "is_read", "received_at"],
    searchable: ["subject", "from_email", "preview_text"],
    orderBy: "received_at",
    ascending: false,
  },
  {
    table: "email_drafts",
    label: "Draft",
    plural: "Drafts",
    group: "Email",
    primary: "subject",
    columns: ["subject", "updated_at"],
    searchable: ["subject", "body_text"],
    orderBy: "updated_at",
    ascending: false,
  },
  {
    table: "email_attachments",
    label: "Attachment",
    plural: "Attachments",
    group: "Email",
    primary: "file_name",
    columns: ["file_name", "message_id", "size_bytes", "created_at"],
    searchable: ["file_name"],
    orderBy: "created_at",
    ascending: false,
  },
  {
    table: "email_send_log",
    label: "Send event",
    plural: "Send log",
    group: "Email",
    primary: "id",
    columns: ["status", "message_id", "provider_message_id", "created_at"],
    searchable: ["provider_message_id"],
    orderBy: "created_at",
    ascending: false,
  },

  // ── Automation ─────────────────────────────────────────────────────────
  {
    table: "automation_rules",
    label: "Rule",
    plural: "Automation rules",
    group: "Automation",
    primary: "name",
    columns: ["name", "trigger_event", "is_active", "created_at"],
    searchable: ["name", "trigger_event"],
    orderBy: "created_at",
    ascending: false,
    writeRole: "administrator",
  },
  {
    table: "automation_runs",
    label: "Run",
    plural: "Automation runs",
    group: "Automation",
    primary: "id",
    columns: ["rule_id", "status", "started_at", "finished_at"],
    searchable: [],
    orderBy: "started_at",
    ascending: false,
  },

  // ── Chatbot ────────────────────────────────────────────────────────────
  {
    table: "chatbot_conversations",
    label: "Conversation",
    plural: "Zee conversations",
    group: "Chatbot",
    primary: "id",
    columns: ["visitor_name", "visitor_email", "status", "created_at"],
    searchable: ["visitor_name", "visitor_email"],
    orderBy: "created_at",
    ascending: false,
    description: "Threads started with the site assistant.",
  },
  {
    table: "chatbot_messages",
    label: "Message",
    plural: "Zee messages",
    group: "Chatbot",
    primary: "content",
    columns: ["conversation_id", "role", "content", "created_at"],
    searchable: ["content"],
    orderBy: "created_at",
    ascending: false,
  },
  {
    table: "ai_usage_logs",
    label: "AI event",
    plural: "AI usage",
    group: "Chatbot",
    primary: "id",
    columns: ["model", "tokens_in", "tokens_out", "created_at"],
    searchable: ["model"],
    orderBy: "created_at",
    ascending: false,
  },

  // ── Site & media ───────────────────────────────────────────────────────
  {
    table: "site_settings",
    label: "Setting",
    plural: "Site settings",
    group: "Site & media",
    primary: "key",
    columns: ["key", "value", "updated_at"],
    searchable: ["key"],
    orderBy: "key",
    ascending: true,
    writeRole: "administrator",
  },
  {
    table: "media_assets",
    label: "Media asset",
    plural: "Media library",
    group: "Site & media",
    primary: "file_name",
    columns: ["file_name", "mime_type", "size_bytes", "created_at"],
    searchable: ["file_name", "alt_text"],
    orderBy: "created_at",
    ascending: false,
  },

  // ── Team & access ──────────────────────────────────────────────────────
  {
    table: "admin_profiles",
    label: "Team member",
    plural: "Team & roles",
    group: "Team & access",
    primary: "email",
    columns: ["email", "full_name", "role", "status", "last_login_at"],
    searchable: ["email", "full_name"],
    orderBy: "created_at",
    ascending: false,
    writeRole: "owner",
  },
  {
    table: "admin_invitations",
    label: "Invitation",
    plural: "Invitations",
    group: "Team & access",
    primary: "email",
    columns: ["email", "role", "expires_at", "accepted_at"],
    searchable: ["email"],
    orderBy: "created_at",
    ascending: false,
    writeRole: "owner",
  },
  {
    table: "notifications",
    label: "Notification",
    plural: "Notifications",
    group: "Team & access",
    primary: "title",
    columns: ["title", "kind", "is_read", "created_at"],
    searchable: ["title", "body"],
    orderBy: "created_at",
    ascending: false,
  },
  {
    table: "push_subscriptions",
    label: "Push subscription",
    plural: "Push subscriptions",
    group: "Team & access",
    primary: "id",
    columns: ["user_id", "endpoint", "created_at"],
    searchable: [],
    orderBy: "created_at",
    ascending: false,
  },

  // ── System ─────────────────────────────────────────────────────────────
  {
    table: "audit_logs",
    label: "Audit entry",
    plural: "Audit log",
    group: "System",
    primary: "action",
    columns: ["action", "resource_type", "actor_id", "created_at"],
    searchable: ["action", "resource_type"],
    orderBy: "created_at",
    ascending: false,
  },
] as const;

export const tableDefBySlug = new Map<string, TableDef>(
  tableDefs.map((def) => [def.table, def]),
);

export const adminGroups: readonly AdminGroup[] = [
  "Enquiries",
  "Content",
  "Email",
  "Automation",
  "Chatbot",
  "Site & media",
  "Team & access",
  "System",
];

export function tablesInGroup(group: AdminGroup): readonly TableDef[] {
  return tableDefs.filter((def) => def.group === group);
}

export const statusOptions = status;
export const contentStatusOptions = contentStatus;
export { auditFields };

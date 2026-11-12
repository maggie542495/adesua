/**
 * The admin's single source of truth.
 *
 * Every table in `public` is described once here — where it sits in the
 * sidebar, which column identifies a record, which columns are worth showing,
 * and what kind of input each field needs. The list and editor screens are
 * generic and read this registry, so adding a table (or a column) is a
 * one-place change rather than a new page.
 */
import type { LucideIcon } from "lucide-react";
import {
  AtSign,
  Bell,
  Cpu,
  FilePen,
  FileStack,
  FileText,
  FolderTree,
  Handshake,
  Home,
  Image,
  Images,
  Inbox,
  LayoutList,
  Mail,
  MessageCircle,
  MessagesSquare,
  Paperclip,
  PlayCircle,
  ScrollText,
  Send,
  Settings,
  Smartphone,
  Sparkles,
  StickyNote,
  UserCheck,
  UserPlus,
  Users,
  Workflow,
} from "lucide-react";
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
  /** Shown in the sidebar — and the only thing visible when it is collapsed. */
  icon: LucideIcon;
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
  /**
   * Explicit editor fields. Without this the editor infers inputs from a live
   * row — fine for simple tables, but a new article needs its body, slug and
   * SEO fields even when the table is empty.
   */
  fields?: readonly FieldDef[];
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

/**
 * `gallery_items.status` has a narrower check constraint than articles — it
 * allows archived, and rejects scheduled and unpublished. Offering the article
 * list here meant a perfectly ordinary pick could fail on save.
 */
const galleryStatus: readonly string[] = ["draft", "published", "archived"];

/** The values the contact form and Zee actually write into `category`. */
const enquiryCategories: readonly string[] = [
  "coaching",
  "consulting",
  "speaking",
  "writing",
  "other",
];

const pathways: readonly string[] = ["personal-growth", "professional-impact"];

/** Matches the `gallery_categories` site setting and the public gallery filter. */
const galleryCategories: readonly string[] = [
  "Professional",
  "Workshop",
  "Speaking",
  "Team",
  "Portrait",
  "Consulting",
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
    icon: Inbox,
    primary: "name",
    columns: ["name", "email", "category", "status", "source", "created_at"],
    searchable: ["name", "email", "subject", "message"],
    orderBy: "created_at",
    ascending: false,
    description: "Everything submitted through the website contact form.",
    /**
     * Declared rather than derived. The editor used to infer inputs from a live
     * row, which turned `status`, `category` and `pathway` into free-text boxes
     * (so a typo silently left an enquiry in a state nothing else understood)
     * and showed every column as an editable field of equal weight — including
     * ids, hashes and timestamps nobody should be typing into.
     */
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "phone", label: "Phone", type: "text" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: status,
        help: "Where this enquiry has got to.",
      },
      {
        name: "category",
        label: "Enquiry type",
        type: "select",
        options: enquiryCategories,
      },
      {
        name: "pathway",
        label: "Pathway",
        type: "select",
        options: pathways,
        help: "Personal Growth or Professional Impact.",
      },
      { name: "subject", label: "Subject", type: "text", span: 2 },
      { name: "message", label: "Message", type: "textarea", span: 2, required: true },
      {
        name: "source",
        label: "Came via",
        type: "text",
        readOnly: true,
        help: "Recorded when the enquiry arrived: contact-form, zee-assistant, and so on.",
      },
      { name: "is_spam", label: "Mark as spam", type: "boolean" },
      {
        name: "responded_at",
        label: "Responded",
        type: "datetime",
        readOnly: true,
        help: "Stamped automatically when a reply is sent.",
      },
      {
        name: "resolved_at",
        label: "Resolved",
        type: "datetime",
        readOnly: true,
        help: "Stamped automatically when the status is set to resolved.",
      },
      {
        name: "assigned_to",
        label: "Assigned to",
        type: "text",
        help: "Admin profile ID, from Team & access. Optional.",
      },
      { name: "id", label: "Reference", type: "text", readOnly: true, span: 2, help: "Quote this when asking about the enquiry." },
      { name: "created_at", label: "Received", type: "datetime", readOnly: true },
      { name: "updated_at", label: "Last updated", type: "datetime", readOnly: true },
    ],
  },
  {
    table: "enquiry_notes",
    label: "Enquiry note",
    plural: "Enquiry notes",
    group: "Enquiries",
    icon: StickyNote,
    primary: "body",
    columns: ["enquiry_id", "body", "is_internal", "created_at"],
    searchable: ["body"],
    orderBy: "created_at",
    ascending: false,
    description:
      "The thread against each enquiry: replies sent to the visitor and notes kept for the studio.",
  },
  {
    table: "enquiry_assignments",
    label: "Assignment",
    plural: "Enquiry assignments",
    group: "Enquiries",
    icon: UserCheck,
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
    icon: FileText,
    primary: "title",
    columns: ["title", "status", "category_id", "published_at", "updated_at"],
    searchable: ["title", "excerpt", "slug"],
    orderBy: "updated_at",
    ascending: false,
    description:
      "Long-form writing. The body is Markdown — headings, lists, quotes, links and images all render on the public page.",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, span: 2 },
      {
        name: "slug",
        label: "Slug",
        type: "text",
        help: "The URL: /insights/your-slug. Lowercase, hyphens, no spaces.",
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: contentStatus,
        help: "Publishing stamps the date automatically.",
      },
      { name: "excerpt", label: "Excerpt", type: "textarea", span: 2, help: "One or two sentences shown on cards and in search results." },
      {
        name: "body",
        label: "Body (Markdown)",
        type: "textarea",
        span: 2,
        help: "## Heading · **bold** · *italic* · - list · > quote · [link](url) · ![alt](image-url)",
      },
      { name: "category_id", label: "Category ID", type: "text", help: "Copy the ID from Article categories." },
      { name: "cover_image_path", label: "Cover image", type: "text", help: "e.g. /brand/portrait-black-blazer.jpg or a storage path." },
      { name: "is_featured", label: "Featured", type: "boolean" },
      { name: "reading_time_minutes", label: "Reading time (minutes)", type: "number", help: "Calculated from the body when left empty." },
      { name: "published_at", label: "Published at", type: "datetime" },
      { name: "seo_title", label: "SEO title", type: "text" },
      { name: "seo_description", label: "SEO description", type: "textarea", span: 2 },
      { name: "seo_image_path", label: "SEO image", type: "text" },
    ],
  },
  {
    table: "article_categories",
    label: "Category",
    plural: "Article categories",
    group: "Content",
    icon: FolderTree,
    primary: "name",
    columns: ["name", "slug", "description"],
    searchable: ["name", "slug"],
    orderBy: "name",
    ascending: true,
  },
  {
    table: "gallery_items",
    label: "Gallery item",
    plural: "Gallery",
    group: "Content",
    icon: Image,
    primary: "title",
    columns: ["title", "category", "status", "is_featured", "sort_order", "updated_at"],
    searchable: ["title", "description", "alt_text", "category"],
    orderBy: "sort_order",
    ascending: true,
    description:
      "Photographs of coaching, workshops, speaking and team work. Published items appear on the public gallery.",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, span: 2 },
      {
        name: "image_path",
        label: "Image path or URL",
        type: "text",
        required: true,
        span: 2,
        help: "e.g. /brand/portrait-green-dress-seated.jpg, or a storage path like gallery/workshop-2025.jpg.",
      },
      {
        name: "alt_text",
        label: "Alt text",
        type: "text",
        span: 2,
        help: "Describe the photograph for screen readers. Falls back to the title.",
      },
      { name: "description", label: "Caption", type: "textarea", span: 2 },
      {
        name: "category",
        label: "Category",
        type: "select",
        options: galleryCategories,
      },
      { name: "status", label: "Status", type: "select", options: galleryStatus },
      { name: "is_featured", label: "Featured", type: "boolean", help: "Featured images lead the public grid." },
      { name: "sort_order", label: "Order", type: "number", help: "Lower numbers appear first." },
    ],
  },
  {
    table: "services",
    label: "Service",
    plural: "Services",
    group: "Content",
    icon: Sparkles,
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
    icon: FileStack,
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
    icon: LayoutList,
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
    icon: Handshake,
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
    icon: Home,
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
    icon: AtSign,
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
    icon: Mail,
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
    icon: FilePen,
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
    icon: Paperclip,
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
    icon: Send,
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
    icon: Workflow,
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
    icon: PlayCircle,
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
    icon: MessagesSquare,
    primary: "name",
    columns: ["name", "email", "status", "enquiry_id", "last_message_at"],
    searchable: ["name", "email"],
    orderBy: "started_at",
    ascending: false,
    description:
      "Threads started with the site assistant. Name and email are what Zee captured from the visitor.",
    /**
     * Declared because deriving would expose `session_token` and `visitor_key`
     * as editable text and put the browser's random key in the editor. The
     * columns are `name` and `email` — not `visitor_name`/`visitor_email`,
     * which is what this registry used to claim, so the list silently rendered
     * blank until it was corrected here.
     */
    fields: [
      { name: "name", label: "Visitor name", type: "text", help: "Captured by Zee in conversation." },
      { name: "email", label: "Visitor email", type: "email", help: "Captured by Zee in conversation." },
      { name: "phone", label: "Phone", type: "text" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: ["active", "completed", "escalated", "abandoned"],
      },
      {
        name: "enquiry_id",
        label: "Enquiry",
        type: "text",
        readOnly: true,
        help: "The enquiry Zee created once the visitor left an email.",
      },
      { name: "pathway_interest", label: "Pathway interest", type: "text", readOnly: true },
      { name: "consent_contact", label: "Agreed to be contacted", type: "boolean" },
      { name: "started_at", label: "Started", type: "datetime", readOnly: true },
      { name: "last_message_at", label: "Last message", type: "datetime", readOnly: true },
      { name: "ended_at", label: "Ended", type: "datetime", readOnly: true },
      { name: "id", label: "Reference", type: "text", readOnly: true },
      { name: "created_at", label: "Created", type: "datetime", readOnly: true },
    ],
  },
  {
    table: "chatbot_messages",
    label: "Message",
    plural: "Zee messages",
    group: "Chatbot",
    icon: MessageCircle,
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
    icon: Cpu,
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
    icon: Settings,
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
    icon: Images,
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
    icon: Users,
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
    icon: UserPlus,
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
    icon: Bell,
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
    icon: Smartphone,
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
    icon: ScrollText,
    primary: "action",
    // `actor_id` is a uuid nobody can read at a glance; the email is the same
    // fact in a form a person can use.
    columns: ["action", "resource_type", "actor_email", "created_at"],
    searchable: ["action", "resource_type", "actor_email", "resource_id"],
    orderBy: "created_at",
    ascending: false,
    fields: [
      { name: "action", label: "Action", type: "text", readOnly: true },
      { name: "resource_type", label: "Resource", type: "text", readOnly: true },
      { name: "resource_id", label: "Resource id", type: "text", readOnly: true },
      { name: "actor_email", label: "Actor", type: "text", readOnly: true },
      { name: "metadata", label: "Detail", type: "json", readOnly: true, span: 2 },
      { name: "ip_hash", label: "Origin hash", type: "text", readOnly: true },
      { name: "created_at", label: "When", type: "datetime", readOnly: true },
    ],
    description:
      "Every privileged change made in the studio, newest first. Written automatically and never editable.",
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

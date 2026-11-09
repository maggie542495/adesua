import { connection } from "next/server";
import { notFound } from "next/navigation";
import { ArticleEditor } from "@/components/admin/article-editor";
import { deleteArticle, updateArticle } from "@/lib/admin/article-actions";
import { tableDefBySlug } from "@/lib/admin/schema";
import { getRow } from "@/lib/admin/data";
import { getArticleCategories } from "@/repositories/article-repository";
import { requireAdmin } from "@/lib/auth/session";
import { roleAtLeast } from "@/lib/auth/roles";

export const instant = false;

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}

export default async function EditArticlePage({ params, searchParams }: PageProps) {
  await connection();

  const { id } = await params;
  const { saved, error } = await searchParams;

  const def = tableDefBySlug.get("articles");
  if (!def) notFound();

  const session = await requireAdmin("editor");
  const { row } = await getRow(def, id);

  if (!row) notFound();

  const categories = await getArticleCategories();
  const canDelete = roleAtLeast(session.profile.role, "administrator");

  return (
    <div className="space-y-6">
      {saved && (
        <p
          role="status"
          className="rounded-lg border border-gold-400/50 bg-gold-500/10 px-4 py-3 text-sm text-gold-800"
        >
          Article created. You can keep editing it here.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <ArticleEditor
        action={updateArticle.bind(null, id)}
        deleteAction={canDelete ? deleteArticle.bind(null, id) : undefined}
        article={row}
        categories={categories}
        isNew={false}
        listPath="/admin/articles"
      />
    </div>
  );
}

import { connection } from "next/server";
import { ArticleEditor } from "@/components/admin/article-editor";
import { createArticle } from "@/lib/admin/article-actions";
import { getArticleCategories } from "@/repositories/article-repository";
import { requireAdmin } from "@/lib/auth/session";

export const instant = false;

/**
 * The article editor owns this route. It sits at a static `articles` segment so
 * it takes precedence over the generic `[table]/new` form, which has no idea
 * what a Markdown body, a slug or a cover image are.
 */
export default async function NewArticlePage() {
  await connection();
  await requireAdmin("editor");

  const categories = await getArticleCategories();

  return (
    <ArticleEditor
      action={createArticle}
      categories={categories}
      article={null}
      isNew
      listPath="/admin/articles"
    />
  );
}

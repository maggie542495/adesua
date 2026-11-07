import { cn } from "@/lib/utils";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

/** Top of every inner page — calmer than the homepage hero. Server component with CSS entrance. */
export function PageHero({ eyebrow, title, description, children, className }: PageHeroProps) {
  return (
    <header
      className={cn(
        "section-band relative overflow-hidden border-b border-border bg-gradient-to-b from-blush-100 via-ivory-100 to-ivory-200 pb-14 pt-16 md:pb-20 md:pt-24",
        className,
      )}
    >
      <div
        aria-hidden
        className="abf-float absolute -right-16 -top-16 size-64 rounded-full bg-gradient-to-br from-gold-200 to-gold-100 opacity-70 blur-3xl"
      />
      <div
        aria-hidden
        className="abf-float absolute -bottom-24 -left-20 size-72 rounded-full bg-gradient-to-br from-mauve-200 to-blush-300 opacity-60 blur-3xl"
        style={{ animationDelay: "1.5s" }}
      />

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        {eyebrow && (
          <p className="abf-fade-up text-eyebrow mb-3">{eyebrow}</p>
        )}
        <h1 className="abf-fade-up abf-delay-1 text-h1 text-plum-500">{title}</h1>
        {description && (
          <p className="abf-fade-up abf-delay-2 text-lead mt-5">{description}</p>
        )}
        {children && <div className="abf-fade-up abf-delay-3 mt-8">{children}</div>}
      </div>
    </header>
  );
}

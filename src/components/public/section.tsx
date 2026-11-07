import { cn } from "@/lib/utils";

type SectionTone = "default" | "tint" | "dark" | "muted";

interface SectionProps {
  tone?: SectionTone;
  width?: "wide" | "prose";
  id?: string;
  className?: string;
  children: React.ReactNode;
}

const toneClasses: Record<SectionTone, string> = {
  default: "",
  tint: "bg-gradient-to-b from-blush-100 via-ivory-100 to-ivory-200",
  muted: "bg-ivory-100 border-y border-border",
  // Uses the invariant band tokens: this surface is dark in *both* themes,
  // so its text must stay light in both.
  dark: "relative overflow-hidden bg-gradient-to-br from-band via-band-2 to-band-3 text-on-band",
};

export function Section({
  tone = "default",
  width = "wide",
  id,
  className,
  children,
}: SectionProps) {
  return (
    <section id={id} className={cn("section-y section-band overflow-x-hidden", toneClasses[tone], className)}>
      <div
        className={cn(
          "relative px-4 sm:px-6 lg:px-8 mx-auto",
          width === "wide" ? "max-w-[95vw] lg:max-w-7xl" : "max-w-3xl",
        )}
      >
        {children}
      </div>
    </section>
  );
}

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "default" | "inverse";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  tone = "default",
  className,
}: SectionHeadingProps) {
  const inverse = tone === "inverse";

  return (
    <div
      className={cn(
        "mb-10 md:mb-14",
        align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl",
        className,
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            "text-eyebrow mb-3",
            inverse ? "text-gold-300" : "text-gold-700",
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          "text-h2",
          inverse ? "text-on-band" : "text-plum-500",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed md:text-lg",
            inverse ? "text-on-band/85" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

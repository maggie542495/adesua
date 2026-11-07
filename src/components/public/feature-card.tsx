import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollFocus } from "@/components/public/scroll-focus";

interface IconTileProps {
  children: React.ReactNode;
  className?: string;
}

/** Plum gradient tile that holds a lucide icon. */
export function IconTile({ children, className }: IconTileProps) {
  return (
    <div
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-plum-500 to-plum-600 text-ivory-200 shadow-lg shadow-plum-500/30 transition-transform duration-500 [&_svg]:size-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export const cardMotion =
  "h-full rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-500 active:scale-[0.98] hover:-translate-y-1.5 hover:border-gold-300 hover:shadow-xl hover:shadow-plum-700/12 data-[focused=true]:-translate-y-1.5 data-[focused=true]:border-gold-300 data-[focused=true]:shadow-xl data-[focused=true]:shadow-plum-700/12";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
  className?: string;
}

export function FeatureCard({ icon: Icon, title, description, className }: FeatureCardProps) {
  return (
    <ScrollFocus tilt className={cn(cardMotion, "group", className)}>
      <IconTile className="mb-4 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110 group-data-[focused=true]:-rotate-6 group-data-[focused=true]:scale-110">
        <Icon aria-hidden />
      </IconTile>
      <h3 className="mb-2 font-display text-xl font-medium text-plum-500">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </ScrollFocus>
  );
}

interface NumberedItemProps {
  number: number;
  title: string;
  description?: string;
  className?: string;
}

export function NumberedItem({ number, title, description, className }: NumberedItemProps) {
  return (
    <ScrollFocus tilt className={cn(cardMotion, "group", className)}>
      <div className="mb-4 flex size-11 items-center justify-center rounded-full border border-gold-300 bg-blush-100 font-display text-lg font-medium text-plum-600 transition-all duration-500 group-hover:rotate-[360deg] group-hover:scale-110 group-hover:bg-plum-500 group-hover:text-ivory-200 group-data-[focused=true]:rotate-[360deg] group-data-[focused=true]:scale-110 group-data-[focused=true]:bg-plum-500 group-data-[focused=true]:text-ivory-200">
        {number}
      </div>
      <h3 className="text-lg font-semibold leading-snug text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
    </ScrollFocus>
  );
}

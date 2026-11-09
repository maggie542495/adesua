import { StaggerGroup, StaggerItem } from "@/components/public/reveal";

export interface Metric {
  readonly value: string;
  readonly label: string;
  readonly detail?: string;
}

interface MetricsBandProps {
  metrics: readonly Metric[];
  className?: string;
}

/**
 * The proof band under the hero.
 *
 * Figures come from `siteConfig.metrics` and are hidden entirely when empty, so
 * a site without confirmed numbers shows nothing rather than something invented.
 */
export function MetricsBand({ metrics, className = "" }: MetricsBandProps) {
  if (metrics.length === 0) return null;

  return (
    <section
      aria-label="At a glance"
      className={`relative border-b border-border bg-background ${className}`}
    >
      <div className="container-site">
        <StaggerGroup
          className="grid grid-cols-2 gap-y-10 py-14 md:py-16 lg:grid-cols-4 lg:gap-y-0"
          stagger={0.09}
        >
          {metrics.map((metric, index) => (
            <StaggerItem key={metric.label}>
              <div
                className={`relative flex flex-col px-1 lg:px-8 ${
                  index > 0 ? "lg:border-l lg:border-border" : ""
                } ${index % 2 === 1 ? "border-l border-border pl-5 lg:pl-8" : ""}`}
              >
                <span className="font-display text-[clamp(2.5rem,5vw,3.75rem)] leading-none tracking-[-0.03em] text-plum-500">
                  {metric.value}
                </span>
                <span
                  aria-hidden
                  className="mt-4 h-px w-8 bg-gold-500"
                />
                <span className="mt-4 text-sm font-semibold uppercase tracking-[0.14em] text-charcoal-700">
                  {metric.label}
                </span>
                {metric.detail && (
                  <span className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {metric.detail}
                  </span>
                )}
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}

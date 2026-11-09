import { Award, Building2, MapPin } from "lucide-react";
import { experience } from "@/content/experience";
import { Reveal } from "@/components/public/reveal";

/**
 * Career history, rendered from `src/content/experience.ts`.
 *
 * Server component — the whole timeline is in the initial HTML so it is
 * readable and indexable without JavaScript.
 */
export function ExperienceTimeline() {
  return (
    <div className="mt-12 space-y-14">
      {experience.map((employer) => (
        <Reveal key={employer.company}>
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border pb-4">
              <h3 className="flex items-center gap-2.5 font-display text-2xl font-medium text-plum-500">
                <Building2 className="size-5 text-gold-600" aria-hidden />
                {employer.company}
              </h3>
              <p className="text-caption">{employer.tenure}</p>
            </div>

            <ol className="mt-8 space-y-10 border-l border-border pl-6 sm:pl-8">
              {employer.roles.map((role) => (
                <li key={`${role.title}-${role.period}`} className="relative">
                  <span
                    className="absolute -left-[1.9rem] top-2 size-2.5 rounded-full bg-gold-500 ring-4 ring-background sm:-left-[2.4rem]"
                    aria-hidden
                  />
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <h4 className="font-display text-lg font-medium text-charcoal-800">
                      {role.title}
                    </h4>
                    <p className="text-caption">{role.period}</p>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-caption">
                    <MapPin className="size-3.5" aria-hidden />
                    {role.location}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-charcoal-700">
                    {role.summary}
                  </p>
                  <ul className="mt-4 space-y-2.5">
                    {role.highlights.map((highlight) => (
                      <li
                        key={highlight.slice(0, 48)}
                        className="flex items-start gap-3 text-sm leading-relaxed text-charcoal-700"
                      >
                        <span
                          className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-plum-500/50"
                          aria-hidden
                        />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                  {role.recognition && (
                    <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-blush-300/60 px-3.5 py-1.5 text-xs font-semibold text-plum-500">
                      <Award className="size-3.5" aria-hidden />
                      {role.recognition}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

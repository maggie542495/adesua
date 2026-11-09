"use client";

import { useEffect, useRef } from "react";

/**
 * The header checkbox for a list's bulk actions.
 *
 * It cannot be a controlled input over server-rendered rows, so it reaches
 * into its own form and flips the row checkboxes directly — scoped to the
 * closest form so two lists on one page can never tick each other's rows. It
 * also reads the row checkboxes back so it shows a partial tick when the admin
 * has ticked some of them by hand.
 *
 * Deliberately uncontrolled: `indeterminate` is a DOM property rather than an
 * attribute, so the state lives on the element itself where React's rules
 * cannot disagree with it.
 */
export function SelectAllCheckbox({ label }: { label: string }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = ref.current;
    const form = input?.closest("form");
    if (!input || !form) return;

    const sync = () => {
      const boxes = Array.from(
        form.querySelectorAll<HTMLInputElement>('input[name="ids"]'),
      );
      const checked = boxes.filter((box) => box.checked).length;
      input.checked = boxes.length > 0 && checked === boxes.length;
      input.indeterminate = checked > 0 && checked < boxes.length;
    };

    const onChange = (event: Event) => {
      const target = event.target as HTMLInputElement | null;
      if (target?.name === "ids") sync();
    };

    form.addEventListener("change", onChange);
    sync();

    return () => form.removeEventListener("change", onChange);
  }, []);

  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={label}
      onChange={(event) => {
        const input = event.currentTarget;
        const form = input.closest("form");
        if (!form) return;
        form.querySelectorAll<HTMLInputElement>('input[name="ids"]').forEach((box) => {
          box.checked = input.checked;
        });
        input.indeterminate = false;
      }}
      className="size-4 rounded border-border text-plum-500 focus:ring-gold-500"
    />
  );
}
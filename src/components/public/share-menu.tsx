"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Check, Copy, Mail, Share2, X } from "lucide-react";
import { Linkedin, Whatsapp, XMark } from "@/components/ui/brand-icons";
import { cn } from "@/lib/utils";

interface ShareMenuProps {
  title: string;
  /** Absolute URL — a relative one cannot be shared off-site. */
  url: string;
}

type Status = "copied" | "error" | null;

// A capability read, not state: the browser either has a share sheet or it does
// not, and the server never knows either way.
const subscribeToNothing = () => () => {};
const hasNativeShare = () => typeof navigator.share === "function";
const noNativeShareOnServer = () => false;

async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Falls through to the legacy path below.
  }

  // Plain http pages get no Clipboard API, so keep a fallback.
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  const copied = document.execCommand("copy");
  field.remove();
  return copied;
}

// A foreground wash rather than a muted surface: `--muted` and `--card` are the
// same colour in dark mode, so a muted hover would vanish there.
const networkClass =
  "flex items-center gap-2.5 rounded-xl border border-border bg-background/60 px-3 py-3 text-xs font-semibold text-foreground transition hover:border-gold-400 hover:bg-foreground/5";
const networkIcon = "size-4 shrink-0 text-gold-700";

export function ShareMenu({ title, url }: ShareMenuProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const [status, setStatus] = useState<Status>(null);
  const canNativeShare = useSyncExternalStore(
    subscribeToNothing,
    hasNativeShare,
    noNativeShareOnServer,
  );

  useEffect(() => {
    if (!status) return;
    const timer = window.setTimeout(() => setStatus(null), 2500);
    return () => window.clearTimeout(timer);
  }, [status]);

  useEffect(() => () => {
    document.body.style.overflow = "";
  }, []);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const networks = [
    {
      label: "X",
      href: `https://x.com/intent/post?text=${encodedTitle}&url=${encodedUrl}`,
      Icon: XMark,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      Icon: Linkedin,
    },
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
      Icon: Whatsapp,
    },
    { label: "Email", href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`, Icon: Mail },
  ];

  function open() {
    setStatus(null);
    dialog.current?.showModal();
    document.body.style.overflow = "hidden";
  }

  function close() {
    dialog.current?.close();
  }

  function handleClose() {
    document.body.style.overflow = "";
  }

  function handleBackdropClick(event: React.MouseEvent<HTMLDialogElement>) {
    if (event.target === dialog.current) close();
  }

  async function handleCopy() {
    setStatus((await copyText(url)) ? "copied" : "error");
  }

  async function handleNativeShare() {
    close();
    try {
      await navigator.share({ title, url });
    } catch {
      // The sheet was dismissed, which is not a failure worth reporting.
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-plum-600 transition hover:border-gold-400 hover:text-gold-700"
      >
        <Share2 className="size-3.5" aria-hidden />
        Share
      </button>

      {/* Native dialog: it sits in the top layer, so no ancestor overflow or
          stacking context can clip it. */}
      <dialog
        ref={dialog}
        aria-labelledby={headingId}
        onClose={handleClose}
        onClick={handleBackdropClick}
        className="bottom-0 top-auto m-0 max-h-[88dvh] w-full max-w-none overflow-y-auto rounded-t-3xl border border-border bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-black/55 backdrop:backdrop-blur-sm sm:inset-y-0 sm:m-auto sm:max-w-md sm:rounded-2xl"
      >
        <div className="abf-fade-up">
          <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-gold-700">
                Share this insight
              </p>
              <h2
                id={headingId}
                className="mt-1 line-clamp-2 font-display text-lg leading-snug text-foreground"
              >
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close share dialog"
              className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-gold-400 hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
          </header>

          <div className="space-y-4 px-5 py-5">
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={url}
                aria-label="Article link"
                onFocus={(event) => event.currentTarget.select()}
                className="min-w-0 flex-1 truncate rounded-lg border border-input bg-background/60 px-3 py-2 text-xs text-foreground"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gold-500 px-3 py-2 text-xs font-semibold text-ink transition hover:bg-gold-600 hover:text-ivory-200"
              >
                {status === "copied" ? (
                  <Check className="size-3.5" aria-hidden />
                ) : (
                  <Copy className="size-3.5" aria-hidden />
                )}
                {status === "copied" ? "Copied" : "Copy"}
              </button>
            </div>

            <p role="status" aria-live="polite" className="min-h-4 text-[0.68rem] text-muted-foreground">
              {status === "error" ? "Couldn't copy. Select the link and copy it by hand." : ""}
            </p>

            <div className="grid grid-cols-2 gap-2">
              {networks.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target={label === "Email" ? undefined : "_blank"}
                  rel={label === "Email" ? undefined : "noopener noreferrer"}
                  onClick={close}
                  className={cn(networkClass)}
                >
                  <Icon className={networkIcon} />
                  {label}
                </a>
              ))}
            </div>

            {canNativeShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-plum-500/30 bg-plum-500 px-3 py-3 text-xs font-semibold text-ivory-200 transition hover:bg-plum-600"
              >
                <Share2 className="size-4" aria-hidden />
                Share with another app
              </button>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}

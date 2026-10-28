"use client";

import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";

function modalControls(element: HTMLDialogElement) {
  return [
    ...element.querySelectorAll<HTMLElement>(
      "button, input, select, textarea, a[href], [tabindex]",
    ),
  ].filter(
    (node) =>
      node.tabIndex >= 0 &&
      !node.matches(":disabled") &&
      node.getClientRects().length,
  );
}

function showModal(element: HTMLDialogElement) {
  element.showModal();
  // Let the fallback details container become visible before focusing.
  requestAnimationFrame(() => {
    if (!element.open) return;
    const controls = modalControls(element);
    (
      controls.find((node) => node.matches("input, select, textarea")) ??
      controls[0]
    )?.focus();
  });
}

export function ActionModal({
  title,
  triggerLabel,
  children,
  dialogRef,
  busy = false,
  defaultOpen = false,
}: {
  title: string;
  triggerLabel: string;
  children: ReactNode;
  dialogRef?: RefObject<HTMLDialogElement | null>;
  busy?: boolean;
  defaultOpen?: boolean;
}) {
  const id = useId();
  const details = useRef<HTMLDetailsElement>(null);
  const internalDialog = useRef<HTMLDialogElement>(null);
  const dialog = dialogRef ?? internalDialog;
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    // Upgrade the same form DOM; a draft entered before hydration survives.
    const expanded = details.current?.open;
    element.close();
    element.setAttribute("data-enhanced", "");
    if (expanded) showModal(element);
  }, [dialog]);
  return (
    <details ref={details} open={defaultOpen} className="action-modal mt-5">
      <summary
        role="button"
        aria-haspopup="dialog"
        aria-controls={id}
        className="inline-block cursor-pointer list-none rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground hover:bg-primary-hover"
        onClick={(event) => {
          if (!dialog.current?.hasAttribute("data-enhanced")) return;
          event.preventDefault();
          if (details.current) details.current.open = true;
          showModal(dialog.current);
        }}
      >
        {triggerLabel}
      </summary>
      <dialog
        ref={dialog}
        id={id}
        open
        aria-labelledby={`${id}-title`}
        className="action-dialog rounded-xl border border-border bg-surface text-foreground shadow-xl"
        onKeyDown={(event) => {
          if (event.key !== "Tab" || !event.currentTarget.matches(":modal"))
            return;
          const controls = modalControls(event.currentTarget);
          const first = controls[0];
          const last = controls.at(-1);
          if (!first || !last) {
            event.preventDefault();
            return;
          }
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
        onCancel={(event) => {
          if (busy) event.preventDefault();
        }}
        onClose={() => {
          if (!dialog.current?.open && details.current)
            details.current.open = false;
        }}
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border p-4 sm:px-6">
          <h2 id={`${id}-title`} className="text-xl font-bold">
            {title}
          </h2>
          <button
            type="button"
            data-modal-close
            disabled={busy}
            onClick={() => dialog.current?.close()}
            className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-primary hover:bg-secondary disabled:opacity-60"
            aria-label={`Fechar ${title}`}
          >
            Fechar
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6">
          {children}
        </div>
      </dialog>
    </details>
  );
}

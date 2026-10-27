"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useEffect,
  useRef,
  startTransition,
  useOptimistic,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { dashboardView, dashboardViews } from "./filters";

export function DashboardWorkspace({
  filters,
  panels,
}: {
  filters: ReactNode;
  panels: ReactNode[];
}) {
  const search = useSearchParams();
  const [active, setActive] = useOptimistic(dashboardView(search.get("visao")));
  const tabs = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    for (const link of tabs.current?.querySelectorAll<HTMLAnchorElement>(
      "[role=tab]",
    ) ?? [])
      link.tabIndex = link.id === `tab-${active}` ? 0 : -1;
  }, [active]);
  function activate(id: string) {
    if (id === active) return;
    const form = root.current?.querySelector("form");
    startTransition(() => {
      setActive(dashboardView(id));
      if (root.current) root.current.dataset.view = id;
      if (form?.getAttribute("aria-busy") === "true") {
        // Submit the latest filters and view together; a push preserves Back.
        form.dataset.navigation = "push";
        form.requestSubmit();
      } else {
        const query = new URLSearchParams(window.location.search);
        query.set("visao", id);
        window.history.pushState(null, "", `/painel?${query}`);
      }
    });
  }
  function navigate(event: KeyboardEvent<HTMLAnchorElement>, index: number) {
    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? dashboardViews.length - 1
          : (index +
              (event.key === "ArrowRight" ? 1 : -1) +
              dashboardViews.length) %
            dashboardViews.length;
    const view = dashboardViews[next];
    activate(view.id);
    document.getElementById(`tab-${view.id}`)?.focus();
  }
  return (
    <div ref={root} className="dashboard mt-5" data-view={active}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          ref={tabs}
          role="tablist"
          aria-label="Visualizações do painel"
          className="grid w-full grid-cols-2 gap-1 rounded-xl bg-secondary p-1 sm:flex sm:w-auto"
        >
          {dashboardViews.map((view, index) => {
            const query = new URLSearchParams(search.toString());
            query.set("visao", view.id);
            return (
              <a
                key={view.id}
                id={`tab-${view.id}`}
                href={`/painel?${query}`}
                role="tab"
                aria-selected={active === view.id}
                aria-controls={`panel-${view.id}`}
                tabIndex={0}
                onKeyDown={(event) => navigate(event, index)}
                onClick={(event) => {
                  if (
                    event.ctrlKey ||
                    event.metaKey ||
                    event.shiftKey ||
                    event.altKey
                  )
                    return;
                  event.preventDefault();
                  activate(view.id);
                }}
                className={`rounded-lg px-4 py-3 text-center text-sm font-semibold ${active === view.id ? "bg-surface text-primary shadow-sm" : "text-muted hover:text-foreground"}`}
              >
                {view.label}
              </a>
            );
          })}
        </div>
        <Link
          href="/simulador"
          className="text-sm font-semibold text-primary underline underline-offset-4"
        >
          Simular receita e margem
        </Link>
      </div>
      {filters}
      {dashboardViews.map((view, index) => (
        <div
          key={view.id}
          id={`panel-${view.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${view.id}`}
          tabIndex={0}
          hidden={active !== view.id}
          className="mt-5"
        >
          {panels[index]}
        </div>
      ))}
    </div>
  );
}

import { toast } from "sonner";

/**
 * Mock "jump to section" — scrolls the editor canvas to the first heading or
 * paragraph whose text contains the section label, and briefly highlights it.
 * Falls back to a toast if nothing is found.
 */
export const jumpToSection = (label: string) => {
  const cleaned = label.replace(/^§\s*\d+(\.\d+)?\s*/, "").trim().toLowerCase();
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>(
      ".editor-canvas h1, .editor-canvas h2, .editor-canvas h3, .editor-canvas p, [data-section]"
    )
  );

  const target =
    candidates.find((el) =>
      (el.dataset.section || el.textContent || "").toLowerCase().includes(cleaned)
    ) || candidates[0];

  if (!target) {
    toast(`Jump to ${label}`, { description: "Section not found in this view" });
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "center" });
  const prev = target.style.transition;
  const prevBg = target.style.backgroundColor;
  target.style.transition = "background-color 600ms ease";
  target.style.backgroundColor = "hsl(var(--primary) / 0.18)";
  setTimeout(() => {
    target.style.backgroundColor = prevBg;
    setTimeout(() => {
      target.style.transition = prev;
    }, 700);
  }, 1200);
};

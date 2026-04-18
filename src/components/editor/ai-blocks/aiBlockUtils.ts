import { toast } from "sonner";

const SECTION_COLORS: Record<string, string> = {
  Critical: "hsl(var(--destructive))",
  Medium: "rgb(245 158 11)", // amber-500
  Low: "rgb(14 165 233)", // sky-500
  Info: "hsl(var(--muted-foreground))",
};

/**
 * Find the matching section element in the editor canvas, scroll to it
 * and briefly highlight it.
 */
export const jumpToSection = (label: string) => {
  const target = findSectionElement(label);
  if (!target) {
    toast(`Jump to ${label}`, { description: "Section not found in this view" });
    return;
  }
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  const prevBg = target.style.backgroundColor;
  const prevTransition = target.style.transition;
  target.style.transition = "background-color 600ms ease";
  target.style.backgroundColor = "hsl(var(--primary) / 0.18)";
  setTimeout(() => {
    target.style.backgroundColor = prevBg;
    setTimeout(() => {
      target.style.transition = prevTransition;
    }, 700);
  }, 1200);
};

/**
 * Find a section element by fuzzy label match (e.g. "§3 Payment Terms",
 * "Section 5: Termination", "End of document").
 */
export const findSectionElement = (label: string): HTMLElement | null => {
  const cleaned = label
    .replace(/^§\s*/, "")
    .replace(/^section\s+/i, "")
    .replace(/^\d+(\.\d+)?[:.\s]+/, "")
    .trim()
    .toLowerCase();

  // Prefer data-comment-section attribute (matches Section X: Foo format)
  const sections = Array.from(
    document.querySelectorAll<HTMLElement>("[data-comment-section]")
  );
  const exact = sections.find((el) =>
    (el.dataset.commentSection || "").toLowerCase().includes(cleaned)
  );
  if (exact) return exact;

  // Fallback to headings/paragraphs
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>("h1, h2, h3, p")
  );
  return (
    candidates.find((el) =>
      (el.textContent || "").toLowerCase().includes(cleaned)
    ) || null
  );
};

/**
 * Inject a small colored dot in the left margin next to a section, used as
 * a "review pin" so the user can see where each AI suggestion lives.
 */
export const addMarginPin = (sectionLabel: string, severity: string, pinId: string) => {
  const el = findSectionElement(sectionLabel);
  if (!el) return;

  // Find the nearest paragraph/heading container (so the pin sits beside the line)
  const host = el.closest("p, h1, h2, h3, li, div") as HTMLElement | null;
  if (!host) return;

  // Avoid duplicate pins
  if (host.querySelector(`[data-pin-id="${pinId}"]`)) return;

  const computed = getComputedStyle(host);
  if (computed.position === "static") {
    host.style.position = "relative";
  }

  const dot = document.createElement("span");
  dot.dataset.pinId = pinId;
  dot.dataset.aiPin = "true";
  dot.style.position = "absolute";
  dot.style.left = "-18px";
  dot.style.top = "8px";
  dot.style.width = "8px";
  dot.style.height = "8px";
  dot.style.borderRadius = "9999px";
  dot.style.background = SECTION_COLORS[severity] || SECTION_COLORS.Info;
  dot.style.boxShadow = `0 0 0 2px hsl(var(--background)), 0 0 0 3px ${SECTION_COLORS[severity] || SECTION_COLORS.Info}33`;
  dot.style.transition = "opacity 200ms ease";
  dot.style.opacity = "0";
  host.appendChild(dot);
  requestAnimationFrame(() => {
    dot.style.opacity = "1";
  });
};

export const removeMarginPin = (pinId: string) => {
  const dot = document.querySelector<HTMLElement>(`[data-pin-id="${pinId}"]`);
  if (!dot) return;
  dot.style.opacity = "0";
  setTimeout(() => dot.remove(), 250);
};

/**
 * Mock-apply an edit to the canvas by replacing the first occurrence of
 * `oldText` inside the matching section with `newText`. Returns true on success.
 */
export const applyEditToCanvas = (
  sectionLabel: string,
  oldText: string | undefined,
  newText: string
): boolean => {
  const section = findSectionElement(sectionLabel);
  if (!section) return false;

  // Walk text nodes inside the section's parent paragraph
  const host = section.closest("p, li, div") as HTMLElement | null;
  if (!host) return false;

  if (oldText && oldText.trim()) {
    const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = node.nodeValue || "";
      const idx = text.indexOf(oldText);
      if (idx >= 0) {
        const before = text.slice(0, idx);
        const after = text.slice(idx + oldText.length);
        const parent = node.parentNode!;
        const beforeNode = document.createTextNode(before);
        const afterNode = document.createTextNode(after);
        const mark = document.createElement("span");
        mark.textContent = newText;
        mark.style.background = "hsl(142 76% 36% / 0.18)";
        mark.style.borderRadius = "2px";
        mark.style.padding = "0 2px";
        mark.style.transition = "background-color 1200ms ease";
        parent.insertBefore(beforeNode, node);
        parent.insertBefore(mark, node);
        parent.insertBefore(afterNode, node);
        parent.removeChild(node);
        // Fade highlight after 2s
        setTimeout(() => {
          mark.style.background = "transparent";
        }, 2000);
        return true;
      }
    }
  }

  // No oldText match → append the new text as an inserted clause at end of host
  const ins = document.createElement("span");
  ins.textContent = ` ${newText}`;
  ins.style.background = "hsl(142 76% 36% / 0.18)";
  ins.style.borderRadius = "2px";
  ins.style.padding = "0 2px";
  ins.style.transition = "background-color 1500ms ease";
  host.appendChild(ins);
  setTimeout(() => {
    ins.style.background = "transparent";
  }, 2500);
  return true;
};

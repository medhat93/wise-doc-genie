// Tiny window event bus for AI surfaces (slash command, selection menu,
// canvas overlay) to talk to the AI side panel without prop-drilling.

export type AiUserAction = {
  /** Verb shown as the intent chip on the user message bubble */
  intent?: "Ask" | "Draft" | "Review" | "Use playbook" | "Summarize" | "Slash" | "Selection";
  /** The user-visible message to post to the chat */
  prompt: string;
  /** Optional quoted selection shown above the bubble */
  selectedText?: string;
  /**
   * Custom kind — used by AI panel to seed a particular mock response.
   * e.g. "draft-clause", "make-stricter", "compare-playbook".
   */
  kind?: string;
  /** Free-form payload for the AI panel to use when crafting its mock reply */
  payload?: Record<string, unknown>;
};

export type AiCanvasSummary = {
  layout: "outline" | "risk" | "comparison" | "extracted";
  label: string;
};

export const AI_EVENTS = {
  USER_ACTION: "signit-ai:user-action",
  OPEN_CANVAS: "signit-ai:open-canvas",
  CANVAS_SUMMARY: "signit-ai:canvas-summary",
} as const;

export const dispatchAiUserAction = (action: AiUserAction) => {
  window.dispatchEvent(new CustomEvent(AI_EVENTS.USER_ACTION, { detail: action }));
};

export const dispatchOpenCanvas = (layout?: AiCanvasSummary["layout"]) => {
  window.dispatchEvent(new CustomEvent(AI_EVENTS.OPEN_CANVAS, { detail: { layout } }));
};

export const dispatchCanvasSummary = (summary: AiCanvasSummary) => {
  window.dispatchEvent(new CustomEvent(AI_EVENTS.CANVAS_SUMMARY, { detail: summary }));
};

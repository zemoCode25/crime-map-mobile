/**
 * Status definitions with color palette.
 * Each status has a dark and light variant of the same color family.
 */
export const STATUSES = [
  { value: "open", label: "Open", dark: "#B91C1C", light: "#FCA5A5" }, // red
  {
    value: "under investigation",
    label: "Under Investigation",
    dark: "#C2410C",
    light: "#FDBA74",
  }, // orange
  {
    value: "case settled",
    label: "Case Settled",
    dark: "#15803D",
    light: "#86EFAC",
  }, // green
  { value: "lupon", label: "Lupon", dark: "#0F766E", light: "#5EEAD4" }, // teal
  {
    value: "direct filing",
    label: "Direct Filing",
    dark: "#4338CA",
    light: "#A5B4FC",
  }, // indigo
  {
    value: "for record",
    label: "For Record",
    dark: "#B45309",
    light: "#FCD34D",
  }, // amber
  { value: "turn-over", label: "Turn-Over", dark: "#0E7490", light: "#67E8F9" }, // cyan
] as const;

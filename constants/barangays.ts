/**
 * Barangay definitions for Muntinlupa City.
 */
export const BARANGAYS = [
  { value: "poblacion", label: "Poblacion" },
  { value: "tunasan", label: "Tunasan" },
  { value: "putatan", label: "Putatan" },
  { value: "bayanan", label: "Bayanan" },
  { value: "alabang", label: "Alabang" },
  { value: "ayala alabang", label: "Ayala Alabang" },
  { value: "buli", label: "Buli" },
  { value: "cupang", label: "Cupang" },
  { value: "sucat", label: "Sucat" },
] as const;

export type BarangayValue = (typeof BARANGAYS)[number]["value"];

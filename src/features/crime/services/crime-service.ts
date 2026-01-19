import { supabase } from "@/src/lib/supabase";
import { Tables } from "@/types/supabase";

// Type aliases for cleaner code
export type CrimeCase = Tables<"crime_case">;
export type CrimeType = Tables<"crime-type">;
export type Location = Tables<"location">;

// Crime case with joined relations
export interface CrimeCaseWithRelations extends CrimeCase {
  location: Location | null;
  crime_type_info: CrimeType | null;
}

// Fetch crime cases with related data
export async function getCrimeCases(): Promise<CrimeCaseWithRelations[]> {
  const { data, error } = await supabase
    .from("crime_case")
    .select(
      `
      *,
      location (*),
      crime_type_info:crime-type (*)
    `,
    )
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as CrimeCaseWithRelations[];
}

// Fetch a single crime case by ID
export async function getCrimeCaseById(id: number): Promise<CrimeCaseWithRelations | null> {
  const { data, error } = await supabase
    .from("crime_case")
    .select(
      `
      *,
      location (*),
      crime_type_info:crime-type (*)
    `,
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as CrimeCaseWithRelations | null;
}

// Fetch all crime types (for filters)
export async function getCrimeTypes() {
  const { data, error } = await supabase
    .from("crime-type")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}

import { supabase } from "@/src/lib/supabase";
import { Tables } from "@/types/supabase";

// Type aliases for cleaner code
export type CrimeCase = Tables<"crime_case">;
export type CrimeType = Tables<"crime-type">;
export type Location = Tables<"location">;

// Fetch crime cases with related data
export async function getCrimeCases() {
  const { data, error } = await supabase
    .from("crime_case")
    .select(
      `
      *,
      location (*),
      crime-type (*)
    `,
    )
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// Fetch a single crime case by ID
export async function getCrimeCaseById(id: number) {
  const { data, error } = await supabase
    .from("crime_case")
    .select(
      `
      *,
      location (*),
      crime-type (*)
    `,
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
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

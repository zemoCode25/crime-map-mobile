import { supabase } from "@/src/lib/supabase";
import type { Tables } from "@/types/supabase";

export type Hotline = Tables<"hotline">;

export async function getHotlines(): Promise<Hotline[]> {
  const { data, error } = await supabase
    .from("hotline")
    .select("*")
    .order("label", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Hotline[];
}

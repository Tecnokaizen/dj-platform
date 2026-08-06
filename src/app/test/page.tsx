import { createClient } from "@/lib/supabase/server";

export default async function TestPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.from("_prueba").select("*");

  return (
    <main style={{ padding: 40 }}>
      <h1>Conexión Supabase</h1>

      <pre>{JSON.stringify({ data, error }, null, 2)}</pre>
    </main>
  );
}
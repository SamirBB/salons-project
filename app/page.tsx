import { supabase } from "@/lib/supabase";

export default async function Home() {
  const { data, error } = await supabase.from("test_items").select("*");

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Salon app radi</h1>

      {error ? (
        <p className="mt-4">Greška: {error.message}</p>
      ) : (
        <pre className="mt-4 whitespace-pre-wrap">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </main>
  );
}
import { getKV } from "@/lib/server/kv";

// The client probes this once on load: if it answers { kv: true } the shared
// Cloudflare backend is live; otherwise the client uses its localStorage store.
export async function GET() {
  const kv = await getKV();
  if (!kv) {
    return Response.json({ kv: false }, { status: 503 });
  }
  return Response.json({ kv: true });
}

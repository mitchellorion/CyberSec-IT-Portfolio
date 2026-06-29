import type { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const target = `https://api.flip.gg/api/${path.join("/")}${request.nextUrl.search}`;

  const res = await fetch(target, {
    headers: { "User-Agent": "flipstats/1.0" },
  });

  const body = await res.arrayBuffer();

  return new Response(body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/json",
      "Cache-Control": "public, max-age=10",
    },
  });
}

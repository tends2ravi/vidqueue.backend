import { NextResponse } from "next/server";

function corsHeaders(req) {
  const origin = req.headers.get("origin") || "";
  const allowed = process.env.ALLOWED_ORIGIN || "";
  const allowOrigin = origin === allowed ? origin : allowed;

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
  };
}

export async function OPTIONS(req) {
  return new Response(null, { status: 200, headers: corsHeaders(req) });
}

// POST { publish_id }
export async function POST(req) {
  const headers = corsHeaders(req);
  const token = req.cookies.get("tt_access_token")?.value;
  if (!token) return NextResponse.json({ error: "not_authenticated" }, { status: 401, headers });

  const { publish_id } = await req.json();
  if (!publish_id) return NextResponse.json({ error: "missing_publish_id" }, { status: 400, headers });

  const url = "https://open.tiktokapis.com/v2/post/publish/status/fetch/";
  const r = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({ publish_id }),
  });

  const data = await r.json();
  return NextResponse.json(data, { status: r.status, headers });
}

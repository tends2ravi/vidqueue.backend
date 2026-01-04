import { NextResponse } from "next/server";

function corsHeaders(req) {
  const origin = req.headers.get("origin") || "";
  const allowed = process.env.ALLOWED_ORIGIN || "https://vidqueue.online";
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

export async function POST(req) {
  const headers = corsHeaders(req);
  const token = req.cookies.get("tt_access_token")?.value;

  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });

  const body = await req.json();
  // Pass the data straight to TikTok
  const r = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      post_info: body.post_info,
      source_info: {
        source: "PULL_FROM_URL",
        video_url: body.video_url 
      }
    }),
  });

  const data = await r.json();
  return NextResponse.json(data, { status: r.status, headers });
}
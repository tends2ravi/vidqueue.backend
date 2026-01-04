import { NextResponse } from "next/server";

function corsHeaders(req) {
  const origin = req.headers.get("origin") || "";
  const allowed = process.env.ALLOWED_ORIGIN || "https://vidqueue.online";
  // If origin matches allowed, return it, otherwise return allowed
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
  try {
    const { code, code_verifier, redirect_uri } = await req.json();

    const form = new URLSearchParams();
    form.set("client_key", process.env.TIKTOK_CLIENT_KEY);
    form.set("client_secret", process.env.TIKTOK_CLIENT_SECRET);
    form.set("code", code);
    form.set("grant_type", "authorization_code");
    form.set("redirect_uri", redirect_uri);
    form.set("code_verifier", code_verifier);

    const r = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });

    const data = await r.json();

    if (!r.ok || !data.access_token) {
      return NextResponse.json({ error: data }, { status: 400, headers });
    }

    // Set HttpOnly Cookie
    const res = NextResponse.json({ ok: true }, { headers });
    res.cookies.set("tt_access_token", data.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "None", // Required for Cross-Site (Frontend -> Backend)
      path: "/",
      maxAge: data.expires_in,
    });

    return res;
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500, headers });
  }
}
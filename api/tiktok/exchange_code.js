import { serialize } from 'cookie';
// DELETED: import fetch from 'node-fetch'; <--- Node 18 has this built-in!

export default async function handler(req, res) {
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Origin', 'https://vidqueue.online');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Check Env Vars
    if (!process.env.TIKTOK_CLIENT_KEY || !process.env.TIKTOK_CLIENT_SECRET) {
      throw new Error("Missing Environment Variables");
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { code, code_verifier, redirect_uri } = body;

    // 2. Call TikTok (Using Global Fetch)
    const params = new URLSearchParams();
    params.append('client_key', process.env.TIKTOK_CLIENT_KEY);
    params.append('client_secret', process.env.TIKTOK_CLIENT_SECRET);
    params.append('code', code);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', redirect_uri);
    params.append('code_verifier', code_verifier);

    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return res.status(400).json({ error: tokenData });
    }

    // 3. Set Cookie
    const cookieSerialized = serialize('tt_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: tokenData.expires_in,
      path: '/',
    });

    res.setHeader('Set-Cookie', cookieSerialized);
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
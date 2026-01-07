import { parse } from 'cookie';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://vidqueue.online');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // CHECK THIS HEADER: It must say "v4-Personal-Account-Fix"
  res.setHeader('X-Backend-Version', 'v4-Personal-Account-Fix');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const cookies = parse(req.headers.cookie || '');
  const accessToken = cookies.tt_access_token;

  if (!accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { video_url } = body;

  // --- v4 PAYLOAD: STRICT PRIVATE ---
  // This matches the official TikTok documentation for "Private Video" exactly.
  const payload = {
    post_info: {
      title: "VidQueue Verification Demo",
      privacy_level: 'SELF_ONLY', // Strict Private
      
      // REQUIRED: You must explicitly disable these for Private posts
      disable_comment: true,
      disable_duet: true,
      disable_stitch: true,
      
      // REQUIRED: Commercial must be false
      brand_content_toggle: false,
      brand_organic_toggle: false,
      
      video_cover_timestamp_ms: 1000
    },
    source_info: {
      source: "PULL_FROM_URL",
      video_url: video_url
    }
  };

  try {
    const response = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (data.error && data.error.code !== 0) {
      console.error("TikTok Error:", JSON.stringify(data));
      return res.status(400).json({ 
        error: data.error.message, 
        tiktok_code: data.error.code,
        payload_debug: payload
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
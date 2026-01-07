import { parse } from 'cookie';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://vidqueue.online');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Debug Header to confirm update
  res.setHeader('X-Backend-Version', 'Final-Atomic-v3');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const cookies = parse(req.headers.cookie || '');
  const accessToken = cookies.tt_access_token;

  if (!accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { video_url } = body;

  // --- FINAL ATOMIC PAYLOAD ---
  // 1. No title (optional)
  // 2. No interaction settings (defaults are fine)
  // 3. No brand toggles (strictly forbidden for private)
  // 4. SELF_ONLY privacy (Strict requirement)
  const atomicPayload = {
    post_info: {
      privacy_level: 'SELF_ONLY' 
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
      body: JSON.stringify(atomicPayload)
    });

    const data = await response.json();
    
    // Log the EXACT error from TikTok for debugging
    if (data.error && data.error.code !== 0) {
      console.error("TikTok Error:", JSON.stringify(data));
      return res.status(400).json({ 
        error: data.error.message, 
        tiktok_code: data.error.code
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
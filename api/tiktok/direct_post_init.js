import { parse } from 'cookie';

export default async function handler(req, res) {
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Origin', 'https://vidqueue.online');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // 2. DEBUG HEADER: Use this to verify the new code is running!
  res.setHeader('X-Backend-Version', 'Bare-Metal-Fix-v1');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const cookies = parse(req.headers.cookie || '');
  const accessToken = cookies.tt_access_token;

  if (!accessToken) {
    return res.status(401).json({ error: 'Not authenticated (Missing Cookie)' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { video_url } = body;

  // 3. THE BARE METAL PAYLOAD
  // We strip everything else. Just "Private" and "Video Source".
  const safePayload = {
    post_info: {
      // The ONLY field that matters for the audit error
      privacy_level: 'SELF_ONLY', 
      
      // Explicitly disable commercial content to be safe
      brand_content_toggle: false,
      brand_organic_toggle: false
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
      body: JSON.stringify(safePayload)
    });

    const data = await response.json();
    
    // Check for errors
    if (data.error && data.error.code !== 0) {
      console.error("TikTok Init Error:", JSON.stringify(data));
      // Return the full TikTok error for debugging
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
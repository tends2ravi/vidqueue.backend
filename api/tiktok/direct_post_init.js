import { parse } from 'cookie';
// Note: fetch is native in Node 18+

export default async function handler(req, res) {
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Origin', 'https://vidqueue.online');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 2. Auth Check
  const cookies = parse(req.headers.cookie || '');
  const accessToken = cookies.tt_access_token;

  if (!accessToken) {
    return res.status(401).json({ error: 'Not authenticated (Missing Cookie)' });
  }

  // 3. Prepare Body
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { post_info, video_url } = body;

  // --- NUCLEAR AUDIT FIX ---
  // We completely ignore the frontend "post_info" for risky fields
  // and construct a perfectly safe payload for the verification video.
  const safePayload = {
    post_info: {
      title: post_info.title || "VidQueue Audit Demo",
      
      // FORCE PRIVATE (Required for unaudited apps)
      privacy_level: 'SELF_ONLY', 
      
      // FORCE COMMERCIAL OFF (Required when Private)
      brand_content_toggle: false,
      brand_organic_toggle: false,

      // Default interactions
      disable_comment: post_info.disable_comment ?? false,
      disable_duet: true, // Private posts can't be duetted anyway
      disable_stitch: true,
      video_cover_timestamp_ms: 1000
    },
    source_info: {
      source: "PULL_FROM_URL",
      video_url: video_url
    }
  };
  // -------------------------

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
    
    // Check for errors from TikTok
    if (data.error && data.error.code !== 0) {
      console.error("TikTok Init Error:", JSON.stringify(data));
      // Send the exact error back to the frontend UI
      return res.status(400).json({ error: data.error.message || "TikTok API Error" });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
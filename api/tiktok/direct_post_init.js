import { parse } from 'cookie';

export default async function handler(req, res) {
  // 1. Standard Headers
  res.setHeader('Access-Control-Allow-Origin', 'https://vidqueue.online');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Debug Header: Look for this in Network Tab to confirm update
  res.setHeader('X-Backend-Version', 'Super-Atomic-v7');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const cookies = parse(req.headers.cookie || '');
  const accessToken = cookies.tt_access_token;

  if (!accessToken) return res.status(401).json({ error: 'Not authenticated' });

  // 2. Get Video Size
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { video_size } = body;

  if (!video_size) {
    return res.status(400).json({ error: 'Missing video_size' });
  }

  // 3. SUPER ATOMIC PAYLOAD
  // We remove EVERYTHING except the privacy level.
  // No title. No comments toggle. No brand toggle.
  // We let TikTok apply the user's default account settings.
  const payload = {
    post_info: {
      privacy_level: 'SELF_ONLY' 
    },
    source_info: {
      source: "FILE_UPLOAD",
      video_size: video_size,
      chunk_size: video_size,
      total_chunk_count: 1
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
      console.error("TikTok Init Error:", JSON.stringify(data));
      // Return details for debugging
      return res.status(400).json({ 
        error: data.error.message, 
        tiktok_code: data.error.code,
        sent_payload: payload 
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
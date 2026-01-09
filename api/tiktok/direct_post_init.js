import { parse } from 'cookie';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://vidqueue.online');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Debug Header: Look for v10
  res.setHeader('X-Backend-Version', 'NoTitle-ScopeFix-v10');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const cookies = parse(req.headers.cookie || '');
  const accessToken = cookies.tt_access_token;

  if (!accessToken) return res.status(401).json({ error: 'Not authenticated' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { video_size } = body;

  if (!video_size) return res.status(400).json({ error: 'Missing video_size' });

  // 3. THE CLEANEST PAYLOAD POSSIBLE
  // No Title. No Defaults. Just Privacy + Disables.
  const payload = {
    post_info: {
      // REMOVED: title (Sending no caption is safer for audit)
      privacy_level: 'SELF_ONLY',
      
      disable_comment: true,
      disable_duet: true,
      disable_stitch: true,
      
      brand_content_toggle: false,
      brand_organic_toggle: false
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
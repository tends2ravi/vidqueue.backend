import { parse } from 'cookie';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://vidqueue.online');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Debug Header: Confirm this version is running
  res.setHeader('X-Backend-Version', 'FileUpload-v5');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const cookies = parse(req.headers.cookie || '');
  const accessToken = cookies.tt_access_token;

  if (!accessToken) return res.status(401).json({ error: 'Not authenticated' });

  // 1. FILE UPLOAD PAYLOAD
  // We strictly request FILE_UPLOAD mode.
  const payload = {
    post_info: {
      title: "VidQueue Verification",
      privacy_level: 'SELF_ONLY', // Strict Private
      disable_comment: true,
      disable_duet: true,
      disable_stitch: true,
      brand_content_toggle: false,
      brand_organic_toggle: false
    },
    source_info: {
      source: "FILE_UPLOAD",
      video_size: 0, // 0 allows TikTok to accept any size initially
      chunk_size: 10000000, // 10MB chunk size
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
      return res.status(400).json({ error: data.error.message, tiktok_code: data.error.code });
    }

    // Success! Return the upload_url to the frontend
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
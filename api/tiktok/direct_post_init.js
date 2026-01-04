// DELETED: import fetch from 'node-fetch'; 

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', 'https://vidqueue.online');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  
    if (req.method === 'OPTIONS') return res.status(200).end();
  
    const accessToken = req.cookies['tt_access_token'];
    if (!accessToken) return res.status(401).json({ error: 'Not authenticated' });
  
    // Handle body parsing safely
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { post_info, video_url } = body;
  
    try {
      const response = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8'
        },
        body: JSON.stringify({
          post_info,
          source_info: {
            source: "PULL_FROM_URL",
            video_url: video_url
          }
        })
      });
  
      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { video_id } = req.query;

    if (!video_id) {
        return res.status(400).json({ status: false, message: "Invalid or missing video_id" });
    }

    const ytUrl = `https://www.youtube.com/watch?v=${video_id}`;
    let lastError = "";

    // Hidden Developer APIs (Highly active for Bots)
    const apis = [
        `https://api.siputzx.my.id/api/d/ytmp4?url=${encodeURIComponent(ytUrl)}`,
        `https://api.ryzendesu.vip/api/downloader/ytmp4?url=${encodeURIComponent(ytUrl)}`
    ];

    for (const apiUrl of apis) {
        try {
            const response = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) });
            const data = await response.json();

            let downloadUrl = "";
            let videoTitle = "YouTube Video Ready";

            // Parsing different API response structures
            if (data?.data?.dl) {
                downloadUrl = data.data.dl;
                videoTitle = data.data.title || videoTitle;
            } else if (data?.url) {
                downloadUrl = data.url;
            }

            // Agar link mil gaya to fauran return kar do
            if (downloadUrl) {
                return res.status(200).json({
                    status: true,
                    title: videoTitle,
                    thumb: `https://i.ytimg.com/vi/${video_id}/maxresdefault.jpg`,
                    link: [
                        { quality: 'HD Video (MP4)', link: downloadUrl }
                    ]
                });
            }
        } catch (error) {
            lastError = error.message;
            continue; // Move to the next API if this one fails
        }
    }

    // Agar tamam APIs block ho chuki hon
    return res.status(500).json({ 
        status: false, 
        message: "API Blocked. Vercel IPs restricted by YouTube.", 
        error: lastError 
    });
}

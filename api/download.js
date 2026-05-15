export default async function handler(req, res) {
    // 1. CORS Headers (Zaroori hain taake frontend server se block na ho)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 2. Handle Preflight Request (Vercel par CORS errors se bachne ke liye)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { video_id } = req.query;

    if (!video_id) {
        return res.status(400).json({ status: false, message: "Invalid or missing video_id" });
    }

    try {
        const ytUrl = `https://www.youtube.com/watch?v=${video_id}`;
        
        // 3. Cobalt Tools API Call (100% Free, No API Key needed)
        const response = await fetch('https://api.cobalt.tools/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                // Yeh headers Cobalt ko block karne se rokte hain
                'Origin': 'https://cobalt.tools', 
                'Referer': 'https://cobalt.tools/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            body: JSON.stringify({
                url: ytUrl,
                videoQuality: "1080", // Maximum quality fetch karega
                filenamePattern: "classic"
            })
        });

        // 4. Response Parse Karna
        const data = await response.json();

        // Agar Cobalt API ki taraf se koi block ya error aaye
        if (data.status === 'error' || data.error) {
            return res.status(500).json({ 
                status: false, 
                message: data.text || "Cobalt API blocked the request." 
            });
        }

        // 5. Frontend ke liye Format Prepare Karna
        const links = [];
        
        // Cobalt API success par directly 'url' return karti hai
        if (data.url) {
            links.push({
                quality: 'MP4 Download (Video + Audio)',
                link: data.url
            });
        }

        // 6. Final JSON Response
        return res.status(200).json({
            status: true,
            title: "Video Ready to Download", 
            thumb: `https://i.ytimg.com/vi/${video_id}/maxresdefault.jpg`,
            link: links
        });

    } catch (error) {
        console.error("Server API Error:", error);
        return res.status(500).json({ 
            status: false, 
            message: "Vercel Server Error: Extraction Failed.", 
            error: error.message 
        });
    }
}

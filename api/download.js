export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { video_id } = req.query;

    if (!video_id) {
        return res.status(400).json({ status: false, message: "Invalid or missing video_id" });
    }

    try {
        const ytUrl = `https://www.youtube.com/watch?v=${video_id}`;
        
        // Cobalt API ka Open-Source Endpoint (No API Key Required)
        const response = await fetch('https://api.cobalt.tools/api/json', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: ytUrl,
                vQuality: "1080" // Highest quality manga rahe hain
            })
        });

        const data = await response.json();

        // Agar Cobalt ki taraf se koi error aaye
        if (data.status === 'error') {
            return res.status(500).json({ status: false, message: data.text });
        }

        // Frontend ke liye array format tayar karna
        const links = [];
        
        if (data.url) {
            links.push({
                quality: 'Download Video (MP4)',
                link: data.url
            });
        }

        // Response wapas apne frontend ko bhejna
        return res.status(200).json({
            status: true,
            title: "Video Ready to Download", 
            thumb: `https://i.ytimg.com/vi/${video_id}/maxresdefault.jpg`,
            link: links
        });

    } catch (error) {
        console.error("Extraction Error:", error);
        return res.status(500).json({ 
            status: false, 
            message: "Failed to extract video. Please try again.", 
            error: error.message 
        });
    }
}

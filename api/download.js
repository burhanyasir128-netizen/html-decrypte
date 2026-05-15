export default async function handler(req, res) {
    // 1. CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { video_id } = req.query;

    if (!video_id) {
        return res.status(400).json({ status: false, message: "Invalid or missing video_id" });
    }

    // 2. High-Uptime Public Invidious Instances (No API Key Required)
    const instances = [
        "https://inv.tux.pizza",
        "https://invidious.nerdvpn.de",
        "https://invidious.slipfox.xyz"
    ];

    let lastError = "";

    // 3. Auto-Fallback Loop (Agar ek server fail ho to doosra try karega)
    for (const instance of instances) {
        try {
            const apiUrl = `${instance}/api/v1/videos/${video_id}`;
            
            const response = await fetch(apiUrl, {
                headers: { 'Accept': 'application/json' },
                // Agar 5 seconds tak response na aaye to doosre server par shift ho jao
                signal: AbortSignal.timeout(5000) 
            });

            if (!response.ok) continue; // Server band ho to loop agay barhao

            const data = await response.json();

            // Agar format array mojood nahi hai to agla server try karo
            if (!data.formatStreams || data.formatStreams.length === 0) continue;

            const links = [];
            
            // Sirf MP4 formats ko filter karna
            data.formatStreams.forEach(stream => {
                if (stream.container === 'mp4') {
                    links.push({
                        quality: stream.qualityLabel || stream.resolution || 'MP4 Quality',
                        link: stream.url // Yeh direct proxy download link hai
                    });
                }
            });

            // Agar links mil gaye hain, to fauran frontend ko bhej do aur loop rok do
            if (links.length > 0) {
                return res.status(200).json({
                    status: true,
                    title: data.title || "Video Ready", 
                    thumb: `https://i.ytimg.com/vi/${video_id}/maxresdefault.jpg`,
                    link: links
                });
            }

        } catch (error) {
            lastError = error.message;
            continue; // Network error aane par code crash nahi hoga, agla server try karega
        }
    }

    // 4. Agar teeno servers fail ho jayen (Worst case scenario)
    return res.status(500).json({ 
        status: false, 
        message: "All extraction nodes are currently busy. Please try again in a few minutes.", 
        error: lastError 
    });
}

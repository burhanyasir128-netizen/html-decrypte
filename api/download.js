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

    // 2. Piped API Instances (More stable than Invidious)
    const instances = [
        "https://pipedapi.kavin.rocks",
        "https://pipedapi.tokhmi.xyz",
        "https://pipedapi.syncpundit.io"
    ];

    let lastError = "";

    // 3. Auto-Fallback Loop for Piped API
    for (const instance of instances) {
        try {
            const apiUrl = `${instance}/streams/${video_id}`;
            
            const response = await fetch(apiUrl, {
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(6000) // 6 second timeout
            });

            if (!response.ok) continue;

            const data = await response.json();

            if (!data.videoStreams || data.videoStreams.length === 0) continue;

            const links = [];
            
            // Piped mein videoOnly: false ka matlab hai ismein Video + Audio dono hain
            const combinedStreams = data.videoStreams.filter(stream => stream.videoOnly === false && stream.mimeType.includes('mp4'));

            // Agar combined na mile to normal video streams utha lo
            const streamsToUse = combinedStreams.length > 0 ? combinedStreams : data.videoStreams.filter(s => s.mimeType.includes('mp4'));

            streamsToUse.forEach(stream => {
                links.push({
                    quality: stream.quality || 'MP4 Quality',
                    link: stream.url 
                });
            });

            if (links.length > 0) {
                return res.status(200).json({
                    status: true,
                    title: "YouTube Video Ready", 
                    thumb: `https://i.ytimg.com/vi/${video_id}/maxresdefault.jpg`,
                    link: links
                });
            }

        } catch (error) {
            lastError = error.message;
            continue; // Next server try karega
        }
    }

    // 4. Agar tamam free proxies fail ho jayen
    return res.status(500).json({ 
        status: false, 
        message: "Free proxies are blocked by YouTube. For production use, a paid API is recommended.", 
        error: lastError 
    });
}

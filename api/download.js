export default async function handler(req, res) {
    // CORS Headers taake frontend block na ho
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { video_id } = req.query;

    if (!video_id) {
        return res.status(400).json({ status: false, message: "Invalid or missing video_id" });
    }

    // Aapka RapidAPI Endpoint aur Video ID
    const url = `https://ytstream-download-youtube-videos.p.rapidapi.com/dl?id=${video_id}`;
    
    const options = {
        method: 'GET',
        headers: {
            // Aapki RapidAPI Key
            'x-rapidapi-key': '2e759a19c7msh1c675fa9484c71dp143b37jsn269390b5f3c4',
            'x-rapidapi-host': 'ytstream-download-youtube-videos.p.rapidapi.com'
        }
    };

    try {
        // RapidAPI ko request bhejna
        const response = await fetch(url, options);
        const data = await response.json();

        // Frontend ke mutabiq Data ko format karna
        const links = [];
        let videoTitle = data.title || "Video Ready for Download";
        let videoThumb = data.thumbnail || data.thumb || `https://i.ytimg.com/vi/${video_id}/maxresdefault.jpg`;

        /* 
         * RapidAPI alag alag structures mein data return karti hai.
         * Hum automatically formats ya links dhoondh kar frontend ke liye prepare kar lenge.
         */
        if (data.formats && Array.isArray(data.formats)) {
            data.formats.forEach(format => {
                if (format.url) {
                    links.push({
                        quality: format.qualityLabel || format.quality || 'Download',
                        link: format.url
                    });
                }
            });
        } else if (data.link && Array.isArray(data.link)) {
            data.link.forEach(format => {
                links.push({
                    quality: format.quality || 'Download',
                    link: format.link || format.url
                });
            });
        } else if (data.url || data.link) {
            // Agar API sirf ek direct link de rahi ho
            links.push({
                quality: 'HD Video (MP4)',
                link: data.url || data.link
            });
        } else if (data.data) {
             // Kuch APIs data object ke andar links rakhti hain
             if(data.data.url) links.push({ quality: 'Video', link: data.data.url });
        }

        // Agar links mil gaye to frontend ko clean JSON response bhejein
        if (links.length > 0) {
            return res.status(200).json({
                status: true,
                title: videoTitle,
                thumb: videoThumb,
                link: links
            });
        } else {
            // Debugging ke liye agar response structure samajh na aaye
            return res.status(200).json({
                status: false,
                message: "API structure parsed differently. Check raw data.",
                raw_data: data 
            });
        }

    } catch (error) {
        console.error("RapidAPI Error:", error);
        return res.status(500).json({ 
            status: false, 
            message: "Failed to connect to RapidAPI.", 
            error: error.message 
        });
    }
}

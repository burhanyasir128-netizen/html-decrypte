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

    // 2. RapidAPI Endpoint configuration
    const url = `https://ytstream-download-youtube-videos.p.rapidapi.com/dl?id=${video_id}`;
    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': '2e759a19c7msh1c675fa9484c71dp143b37jsn269390b5f3c4',
            'x-rapidapi-host': 'ytstream-download-youtube-videos.p.rapidapi.com'
        }
    };

    try {
        const response = await fetch(url, options);
        const data = await response.json();

        let videoTitle = data.title || "Video Ready for Download";
        let links = [];
        
        // 3. Extract Thumbnail Safely
        let videoThumb = `https://i.ytimg.com/vi/${video_id}/hqdefault.jpg`; 
        if (data.thumbnail && Array.isArray(data.thumbnail) && data.thumbnail.length > 0) {
            videoThumb = data.thumbnail[data.thumbnail.length - 1].url; // Highest resolution thumbnail
        } else if (typeof data.thumbnail === 'string') {
            videoThumb = data.thumbnail;
        }

        // 4. Extract Combined Formats (Video + Audio) - Usually 360p & 720p
        if (data.formats && Array.isArray(data.formats)) {
            data.formats.forEach(format => {
                if (format.url) {
                    let quality = format.qualityLabel || format.quality || '360p';
                    links.push({
                        quality: `${quality} (Video + Audio)`,
                        link: format.url
                    });
                }
            });
        }

        // 5. Extract Adaptive Formats (High Res Video Only OR Audio Only)
        if (data.adaptiveFormats && Array.isArray(data.adaptiveFormats)) {
            data.adaptiveFormats.forEach(format => {
                if (format.url) {
                    if (format.mimeType && format.mimeType.includes('audio')) {
                        links.push({
                            quality: `Audio Only (MP3/M4A)`,
                            link: format.url
                        });
                    } else if (format.mimeType && format.mimeType.includes('video')) {
                        let quality = format.qualityLabel || format.quality || 'HD';
                        links.push({
                            quality: `${quality} (Video Only)`,
                            link: format.url
                        });
                    }
                }
            });
        }

        // 6. Remove Duplicates based on Quality string
        const uniqueLinks = Array.from(new Map(links.map(item => [item.quality, item])).values());

        if (uniqueLinks.length > 0) {
            return res.status(200).json({
                status: true,
                title: videoTitle,
                thumb: videoThumb,
                link: uniqueLinks
            });
        } else {
            return res.status(500).json({
                status: false,
                message: "No download links extracted from the API."
            });
        }

    } catch (error) {
        return res.status(500).json({ 
            status: false, 
            message: "Failed to connect to RapidAPI. Please check your API Key or Network.", 
            error: error.message 
        });
    }
}

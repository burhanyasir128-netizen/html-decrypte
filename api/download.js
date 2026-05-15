export default async function handler(req, res) {
    // CORS headers taake frontend easily access kar sake
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    // URL se video_id nikalna (e.g., /api/download?video_id=XXXX)
    const { video_id } = req.query;

    if (!video_id) {
        return res.status(400).json({ status: false, message: "Invalid or missing video_id" });
    }

    // RapidAPI ka endpoint
    const apiUrl = `https://youtube-video-download-info.p.rapidapi.com/dl?id=${video_id}`;
    
    const options = {
        method: 'GET',
        headers: {
            // Aapko RapidAPI account bana kar key yahan dalni hogi
            'X-RapidAPI-Key': 'YOUR_API_KEY_HERE', 
            'X-RapidAPI-Host': 'youtube-video-download-info.p.rapidapi.com'
        }
    };

    try {
        // Third-party API ko call karna
        const apiResponse = await fetch(apiUrl, options);
        const data = await apiResponse.json();

        // Data directly frontend ko return karna
        return res.status(200).json(data);
    } catch (error) {
        // Error handling
        return res.status(500).json({ 
            status: false, 
            message: "API Connection Failed", 
            error: error.message 
        });
    }
}

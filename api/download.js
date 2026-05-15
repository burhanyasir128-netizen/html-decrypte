const ytdl = require('@distube/ytdl-core');

export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { video_id } = req.query;

    if (!video_id) {
        return res.status(400).json({ status: false, message: "Invalid or missing video_id" });
    }

    try {
        const videoUrl = `https://www.youtube.com/watch?v=${video_id}`;
        
        // ytdl-core ko use karke video ki details fetch karna
        const info = await ytdl.getInfo(videoUrl);

        // Title aur highest quality Thumbnail nikalna
        const title = info.videoDetails.title;
        const thumbnails = info.videoDetails.thumbnails;
        const thumb = thumbnails[thumbnails.length - 1].url;

        // Sirf aisi videos filter karna jin mein Video aur Audio dono hon (MP4 format)
        const formats = ytdl.filterFormats(info.formats, 'videoandaudio');
        
        // Ek clean array banana jo frontend ko samajh aaye
        const links = formats.map(format => {
            return {
                quality: format.qualityLabel || 'Standard Quality',
                link: format.url // Yeh direct Google Video server ka download link hai
            };
        });

        // Agar combined audio/video na mile, to sirf audio ka link add karna
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
        if (audioFormats.length > 0) {
            links.push({
                quality: 'Audio Only (MP3/M4A)',
                link: audioFormats[0].url
            });
        }

        // Response wapas frontend ko bhejna
        return res.status(200).json({
            status: true,
            title: title,
            thumb: thumb,
            link: links
        });

    } catch (error) {
        console.error("YTDL Error:", error);
        return res.status(500).json({ 
            status: false, 
            message: "Extraction failed. YouTube might have blocked the request.", 
            error: error.message 
        });
    }
}

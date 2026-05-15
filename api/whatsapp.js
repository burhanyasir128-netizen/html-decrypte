export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { phone } = req.query;

    if (!phone) {
        return res.status(400).json({ status: false, message: "Please provide a phone number." });
    }

    const url = `https://whatsapp-data.p.rapidapi.com/bizname?phone=${phone}`;
    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': '2e759a19c7msh1c675fa9484c71dp143b37jsn269390b5f3c4',
            'x-rapidapi-host': 'whatsapp-data.p.rapidapi.com'
        }
    };

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        
        // Data ko directly frontend par bhej dein
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ 
            status: false, 
            message: "Failed to connect to WhatsApp API.", 
            error: error.message 
        });
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ status: false, message: 'Metode tidak diizinkan.' });
    }

    const { action, params } = req.body; 
    
    const apiKey = process.env.API_KEY; 
    const baseUrl = 'https://api.neoxr.eu/api';

    if (!apiKey) {
        return res.status(500).json({ status: false, message: 'Sistem Error: API Key belum diatur di Vercel.' });
    }

    try {
        const query = new URLSearchParams({
            ...params,
            apikey: apiKey
        }).toString();

        const apiUrl = `${baseUrl}/${action}?${query}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        res.status(200).json(data);
    } catch (error) {
        console.error("Error API:", error);
        res.status(500).json({ status: false, message: 'Gagal terhubung ke server utama.' });
    }
}

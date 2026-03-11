export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ status: false, message: 'Metode tidak diizinkan.' });
    }

    const { action, params, fileData } = req.body; 
    const apiKey = process.env.API_KEY; 
    const baseUrl = 'https://api.neoxr.eu/api';

    if (!apiKey) {
        return res.status(500).json({ status: false, message: 'Sistem Error: API Key belum diatur di Vercel.' });
    }

    try {
        let finalParams = { ...params, apikey: apiKey };

        // VERCEL MENGUNGGAH FILE KE TMPFILES
        if (fileData && fileData.base64) {
            const base64Data = fileData.base64.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            
            const formData = new FormData();
            formData.append('file', new Blob([buffer], { type: fileData.mimeType }), fileData.fileName);

            const uploadRes = await fetch('https://tmpfiles.org/api/v1/upload', {
                method: 'POST',
                body: formData
            });

            if (!uploadRes.ok) throw new Error('Gagal mengunggah file ke server CDN sementara.');
            const uploadJson = await uploadRes.json();
            
            if (uploadJson.status !== 'success') {
                throw new Error('File ditolak oleh server CDN sementara.');
            }

            // Ubah link web tmpfiles menjadi Direct Link (tambah /dl/)
            const uploadedUrl = uploadJson.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');

            // Tambahkan photo-editor ke daftar yang butuh link gambar
            if (action === 'upscale' || action === 'nobg' || action === 'photo-editor') finalParams.image = uploadedUrl;
            if (action === 'noice-reducer') finalParams.file = uploadedUrl;
        }

        const query = new URLSearchParams(finalParams).toString();
        const apiUrl = `${baseUrl}/${action}?${query}`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();

        res.status(200).json(data);
    } catch (error) {
        console.error("Error API:", error);
        res.status(500).json({ status: false, message: error.message || 'Gagal terhubung ke server utama.' });
    }
}

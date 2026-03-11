export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ status: false, message: 'Metode tidak diizinkan.' });
    }

    // Sekarang kita juga menerima fileData dari frontend
    const { action, params, fileData } = req.body; 
    
    const apiKey = process.env.API_KEY; 
    const baseUrl = 'https://api.neoxr.eu/api';

    if (!apiKey) {
        return res.status(500).json({ status: false, message: 'Sistem Error: API Key belum diatur di Vercel.' });
    }

    try {
        let finalParams = { ...params, apikey: apiKey };

        // JIKA ADA FILE, VERCEL YANG AKAN MENGUNGGAHNYA KE CATBOX
        if (fileData && fileData.base64) {
            // Ubah Base64 kembali menjadi file fisik (Buffer)
            const base64Data = fileData.base64.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            
            const formData = new FormData();
            formData.append('reqtype', 'fileupload');
            formData.append('fileToUpload', new Blob([buffer], { type: fileData.mimeType }), fileData.fileName);

            // Vercel (bukan HP kamu) yang melakukan upload, dijamin tidak kena blokir ISP!
            const uploadRes = await fetch('https://catbox.moe/user/api.php', {
                method: 'POST',
                body: formData
            });

            if (!uploadRes.ok) throw new Error('Gagal mengunggah file di sisi server.');
            const uploadedUrl = await uploadRes.text();

            // Masukkan URL catbox yang berhasil dibuat ke dalam parameter API NeoXR
            if (action === 'upscale' || action === 'nobg') finalParams.image = uploadedUrl;
            if (action === 'noice-reducer') finalParams.file = uploadedUrl;
        }

        // Lanjut panggil API NeoXR seperti biasa
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

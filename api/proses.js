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

            const uploadedUrl = uploadJson.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');

            if (action === 'upscale' || action === 'nobg' || action === 'photo-editor') finalParams.image = uploadedUrl;
            if (action === 'noice-reducer') finalParams.file = uploadedUrl;
        }

        const query = new URLSearchParams(finalParams).toString();
        const apiUrl = `${baseUrl}/${action}?${query}`;
        
        const response = await fetch(apiUrl);
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            return res.status(500).json({ 
                status: false, 
                message: 'Input tidak valid atau server tujuan menolak permintaan (Bukan JSON).' 
            });
        }

        const data = await response.json();

        // RE-UPLOAD HASIL GAMBAR AI KE TMPFILES AGAR BISA DIBUKA DI BROWSER
        // Ini agar link yang diterima frontend bisa langsung dibuka Chrome untuk download
        const isImageAction = ['upscale', 'nobg', 'photo-editor'].includes(action);
        if (isImageAction && data.status && data.url && data.url.startsWith('http')) {
            try {
                const imgRes = await fetch(data.url);
                if (imgRes.ok) {
                    const imgBuffer = await imgRes.arrayBuffer();
                    const imgMime = imgRes.headers.get('content-type') || 'image/png';
                    const ext = imgMime.includes('png') ? 'png' : 'jpg';

                    const reUploadForm = new FormData();
                    reUploadForm.append('file', new Blob([imgBuffer], { type: imgMime }), `Moonlight_result.${ext}`);

                    const reUploadRes = await fetch('https://tmpfiles.org/api/v1/upload', {
                        method: 'POST',
                        body: reUploadForm
                    });
                    const reUploadJson = await reUploadRes.json();

                    if (reUploadJson.status === 'success') {
                        // Ganti URL neoxr dengan URL tmpfiles yang bisa diakses publik
                        data.url = reUploadJson.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
                    }
                }
            } catch (reUploadErr) {
                // Kalau re-upload gagal, biarkan URL asli (tidak fatal)
                console.warn('Re-upload gagal:', reUploadErr.message);
            }
        }

        res.status(200).json(data);
        
    } catch (error) {
        console.error("Error API:", error);
        res.status(500).json({ status: false, message: error.message || 'Gagal terhubung ke server utama.' });
    }
}

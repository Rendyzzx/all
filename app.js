let currentPlatform = 'tiktok';
const COOLDOWN_TIME = 15000;
let toastTimeout; 

window.onload = function () {
    setPlatform('youtube');
    openModal();
};

// ============================================================
// TOAST NOTIFICATION FUNCTION
// ============================================================
function showToast(message, type = 'error') {
    const toast = document.getElementById("toast");
    const toastIcon = document.getElementById("toastIcon");
    const toastMessage = document.getElementById("toastMessage");

    toast.className = "toast";
    toastIcon.className = "";

    toast.classList.add(type);
    if (type === 'error') toastIcon.className = 'fas fa-exclamation-circle';
    else if (type === 'success') toastIcon.className = 'fas fa-check-circle';
    else if (type === 'info') toastIcon.className = 'fas fa-info-circle';

    toastMessage.innerText = message;
    toast.classList.add("show");

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(function(){
        toast.classList.remove("show");
    }, 3000);
}

// ============================================================
// FORCE DOWNLOAD FUNCTION (Agar tidak pindah halaman)
// ============================================================
async function forceDownload(url, filename) {
    try {
        showToast("Sedang mengunduh file, mohon tunggu...", "info");
        
        // Mengambil data file secara diam-diam di latar belakang
        const response = await fetch(url);
        if (!response.ok) throw new Error("Gagal mengambil file");
        
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Membuat elemen link sementara untuk memicu unduhan
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Bersihkan memori
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
        
        showToast("File berhasil disimpan!", "success");
    } catch (error) {
        console.error(error);
        // Jika server gambar memblokir unduhan langsung (CORS), buka di tab baru sebagai cadangan
        window.open(url, '_blank');
        showToast("Membuka di tab baru (Browser memblokir unduhan langsung)", "info");
    }
}

function openModal() { document.getElementById('featuresModal').style.display = 'flex'; }
function closeModal() { document.getElementById('featuresModal').style.display = 'none'; }
window.onclick = function (event) { if (event.target == document.getElementById('featuresModal')) closeModal(); };

function checkCooldown() {
    const lastAction = localStorage.getItem('lastMoonlightAction');
    if (lastAction) {
        const now = Date.now();
        const diff = now - parseInt(lastAction);
        if (diff < COOLDOWN_TIME) {
            const sisa = Math.ceil((COOLDOWN_TIME - diff) / 1000);
            showToast(`Sistem Anti-Spam: Harap tunggu ${sisa} detik sebelum menggunakan layanan ini lagi.`, 'info');
            return false;
        }
    }
    return true;
}

function setCooldown() {
    localStorage.setItem('lastMoonlightAction', Date.now());
}

function setPlatform(platform) {
    currentPlatform = platform;

    const title = document.getElementById('mainTitle');
    const urlContainer = document.getElementById('urlInputContainer');
    const textContainer = document.getElementById('textInputContainer');
    const nominalContainer = document.getElementById('nominalContainer');
    const customAmountContainer = document.getElementById('customAmountContainer');
    const providerContainer = document.getElementById('providerContainer');
    const ytFormatContainer = document.getElementById('ytFormatContainer');
    const timeInputsContainer = document.getElementById('timeInputsContainer');
    const providerSelect = document.getElementById('pulsaProvider');
    const catboxHelper = document.getElementById('catboxHelper');
    const contactContainer = document.getElementById('contactContainer');
    const fileContainer = document.getElementById('fileInputContainer');
    const mediaFile = document.getElementById('mediaFile');
    const btn = document.getElementById('mainBtn');

    urlContainer.style.display = 'none'; textContainer.style.display = 'none'; nominalContainer.style.display = 'none'; customAmountContainer.style.display = 'none'; providerContainer.style.display = 'none'; ytFormatContainer.style.display = 'none'; timeInputsContainer.style.display = 'none'; catboxHelper.style.display = 'none'; contactContainer.style.display = 'none'; document.getElementById('resultCard').style.display = 'none'; fileContainer.style.display = 'none'; btn.style.display = 'flex';

    if (platform === 'kontak') { title.innerHTML = "Hubungi Owner"; contactContainer.style.display = 'flex'; btn.style.display = 'none'; }
    else if (platform === 'pulsa') { title.innerHTML = "Isi Ulang Pulsa"; document.getElementById('mediaUrl').placeholder = "Masukkan Nomor HP (0812...)"; providerSelect.innerHTML = `<option value="pulsa-axis">AXIS</option><option value="pulsa-indosat">INDOSAT (IM3)</option><option value="pulsa-telkomsel">TELKOMSEL</option><option value="pulsa-tri">TRI (3)</option><option value="pulsa-xl">XL AXIATA</option>`; urlContainer.style.display = 'flex'; providerContainer.style.display = 'flex'; nominalContainer.style.display = 'flex'; btn.innerHTML = 'Buat Tagihan Pembayaran'; }
    else if (platform === 'topup') { title.innerHTML = "Topup E-Wallet"; document.getElementById('mediaUrl').placeholder = "Masukkan Nomor Akun (0812...)"; providerSelect.innerHTML = `<option value="topup-dana">DANA</option><option value="topup-gopay">GOPAY</option><option value="topup-ovo">OVO</option><option value="topup-shopeepay">SHOPEEPAY</option>`; urlContainer.style.display = 'flex'; providerContainer.style.display = 'flex'; customAmountContainer.style.display = 'flex'; btn.innerHTML = 'Buat Tagihan Pembayaran'; }
    else if (platform === 'youtube') { title.innerHTML = "Unduh YouTube"; document.getElementById('mediaUrl').placeholder = "Tempel tautan video YouTube di sini..."; urlContainer.style.display = 'flex'; ytFormatContainer.style.display = 'flex'; btn.innerHTML = 'Download Sekarang'; }
    else if (platform === 'tiktok') { title.innerHTML = "Unduh Video TikTok"; document.getElementById('mediaUrl').placeholder = "Tempel tautan video TikTok di sini..."; urlContainer.style.display = 'flex'; btn.innerHTML = 'Download Sekarang'; }
    else if (platform === 'ig') { title.innerHTML = "Unduh Media Instagram"; document.getElementById('mediaUrl').placeholder = "Tempel tautan Post/Reels IG di sini..."; urlContainer.style.display = 'flex'; btn.innerHTML = 'Download Sekarang'; }
    else if (platform === 'facebook') { title.innerHTML = "Unduh Video Facebook"; document.getElementById('mediaUrl').placeholder = "Tempel tautan video/Reels Facebook..."; urlContainer.style.display = 'flex'; btn.innerHTML = 'Download Sekarang'; }
    else if (platform === 'twitter') { title.innerHTML = "Unduh Media Twitter (X)"; document.getElementById('mediaUrl').placeholder = "Tempel tautan postingan Twitter (X)..."; urlContainer.style.display = 'flex'; btn.innerHTML = 'Download Sekarang'; }
    else if (platform === 'terabox') { title.innerHTML = "TeraBox Downloader"; document.getElementById('mediaUrl').placeholder = "Tempel tautan file TeraBox di sini..."; urlContainer.style.display = 'flex'; btn.innerHTML = 'Buka File TeraBox'; }
    else if (platform === 'pin') { title.innerHTML = "Unduh Media Pinterest"; document.getElementById('mediaUrl').placeholder = "Tempel tautan Pin dari Pinterest di sini..."; urlContainer.style.display = 'flex'; btn.innerHTML = 'Download Sekarang'; }
    else if (platform === 'spotify') { title.innerHTML = "Unduh Musik Spotify"; document.getElementById('mediaUrl').placeholder = "Tempel tautan lagu Spotify di sini..."; urlContainer.style.display = 'flex'; btn.innerHTML = 'Download Sekarang'; }
    else if (platform === 'lirik') { title.innerHTML = "Pencarian Lirik Lagu"; document.getElementById('mediaUrl').placeholder = "Ketik judul lagu (contoh: Komang)..."; urlContainer.style.display = 'flex'; btn.innerHTML = 'Cari Lirik Sekarang'; }
    else if (platform === 'ss-web') { title.innerHTML = "Screenshot Website"; document.getElementById('mediaUrl').placeholder = "Masukkan URL web (https://...)"; urlContainer.style.display = 'flex'; btn.innerHTML = 'Ambil Screenshot'; }
    else if (platform === 'yt-transcript') { title.innerHTML = "YouTube Transcript"; document.getElementById('mediaUrl').placeholder = "Tempel tautan video YouTube di sini..."; urlContainer.style.display = 'flex'; btn.innerHTML = 'Ekstrak Teks Sekarang'; }
    else if (platform === 'ai-detector') { title.innerHTML = "AI Text Detector"; document.getElementById('textContent').placeholder = "Tempel artikel atau teks di sini..."; textContainer.style.display = 'flex'; btn.innerHTML = 'Deteksi Teks Sekarang'; }
    else if (platform === 'iqc') { title.innerHTML = "iPhone Quoted"; document.getElementById('textContent').placeholder = "Ketik atau tempel teks pesan di sini..."; textContainer.style.display = 'flex'; timeInputsContainer.style.display = 'flex'; btn.innerHTML = 'Buat Kutipan iPhone'; }
    else if (platform === 'nulis') { title.innerHTML = "Nulis Otomatis"; document.getElementById('textContent').placeholder = "Ketik atau tempel teks yang ingin ditulis tangan..."; textContainer.style.display = 'flex'; btn.innerHTML = 'Mulai Nulis'; }
    
    else if (platform === 'hd-foto') { title.innerHTML = "HD Foto (Upscaler)"; fileContainer.style.display = 'flex'; mediaFile.accept = "image/*"; catboxHelper.innerHTML = `<i class="fas fa-info-circle" style="color: var(--primary); margin-right: 5px;"></i> Pilih foto dari galerimu. Sistem akan memprosesnya secara otomatis. (Maksimal 4MB)`; catboxHelper.style.display = 'block'; btn.innerHTML = 'Tingkatkan Kualitas Foto'; }
    else if (platform === 'remove-bg') { title.innerHTML = "Hapus Background"; fileContainer.style.display = 'flex'; mediaFile.accept = "image/*"; catboxHelper.innerHTML = `<i class="fas fa-info-circle" style="color: var(--primary); margin-right: 5px;"></i> Pilih foto dari galerimu. Sistem akan memprosesnya secara otomatis. (Maksimal 4MB)`; catboxHelper.style.display = 'block'; btn.innerHTML = 'Hapus Background Gambar'; }
    else if (platform === 'noise-reduce') { title.innerHTML = "Audio Noise Reduce"; fileContainer.style.display = 'flex'; mediaFile.accept = "audio/*"; catboxHelper.innerHTML = `<i class="fas fa-info-circle" style="color: var(--primary); margin-right: 5px;"></i> Pilih file audio dari perangkatmu. Sistem akan membersihkannya otomatis. (Maksimal 4MB)`; catboxHelper.style.display = 'block'; btn.innerHTML = 'Bersihkan Suara Audio'; }
    else if (platform === 'photo-editor') { 
        title.innerHTML = "Photo Editor AI"; 
        fileContainer.style.display = 'flex'; mediaFile.accept = "image/*"; 
        urlContainer.style.display = 'flex';
        document.getElementById('mediaUrl').placeholder = "Ketik perintah edit (contoh: ubah baju jadi merah)...";
        catboxHelper.innerHTML = `<i class="fas fa-info-circle" style="color: var(--primary); margin-right: 5px;"></i> Pilih foto, lalu ketik perintah yang ingin kamu ubah pada foto tersebut.`; 
        catboxHelper.style.display = 'block'; 
        btn.innerHTML = 'Edit Foto Sekarang'; 
    }
    
    else if (platform === 'roblox-stalk') { title.innerHTML = "Roblox Stalk"; document.getElementById('mediaUrl').placeholder = "Masukkan username Roblox..."; urlContainer.style.display = 'flex'; btn.innerHTML = 'Cari Player'; }
    else if (platform === 'dc-stalk') { title.innerHTML = "Discord Stalk"; document.getElementById('mediaUrl').placeholder = "Masukkan ID Discord (angka)..."; urlContainer.style.display = 'flex'; btn.innerHTML = 'Cari User'; }
    else if (platform === 'tt-stalk') { title.innerHTML = "TikTok Stalk"; document.getElementById('mediaUrl').placeholder = "Masukkan username TikTok (tanpa @)..."; urlContainer.style.display = 'flex'; btn.innerHTML = 'Cari Akun'; }
    else if (platform === 'tw-stalk') { title.innerHTML = "Twitter Stalk"; document.getElementById('mediaUrl').placeholder = "Masukkan username Twitter (tanpa @)..."; urlContainer.style.display = 'flex'; btn.innerHTML = 'Cari Akun'; }
    else if (platform === 'gh-stalk') { title.innerHTML = "GitHub Stalk"; document.getElementById('mediaUrl').placeholder = "Masukkan username GitHub..."; urlContainer.style.display = 'flex'; btn.innerHTML = 'Cari Developer'; }
    else if (platform === 'ig-stalk') { title.innerHTML = "Instagram Stalk"; document.getElementById('mediaUrl').placeholder = "Masukkan username Instagram (tanpa @)..."; urlContainer.style.display = 'flex'; btn.innerHTML = 'Cari Akun IG'; }
    else if (platform === 'th-stalk') { title.innerHTML = "Threads Stalk"; document.getElementById('mediaUrl').placeholder = "Masukkan username Threads (tanpa @)..."; urlContainer.style.display = 'flex'; btn.innerHTML = 'Cari Akun Threads'; }

    document.getElementById('mediaUrl').value = '';
    document.getElementById('textContent').value = '';
    document.getElementById('mediaFile').value = '';
    if (document.getElementById('customAmount')) document.getElementById('customAmount').value = '';
    
    const formGroup = document.querySelector('.form-group');
    const mainTitleEl = document.getElementById('mainTitle');
    formGroup.style.animation = 'none';
    mainTitleEl.style.animation = 'none';
    setTimeout(() => {
        formGroup.style.animation = '';
        mainTitleEl.style.animation = '';
    }, 10);
    
    closeModal();
}

async function pasteToInput(elementId) { const inputEl = document.getElementById(elementId); try { if (!navigator.clipboard || !navigator.clipboard.readText) { throw new Error("Browser tidak mendukung baca clipboard otomatis."); } const text = await navigator.clipboard.readText(); if (text) { inputEl.value = text; } } catch (err) { inputEl.focus(); showToast('Browser memblokir tempel otomatis. Silakan Tahan Layar > Tempel.', 'info'); } }
function copyTranscript() { const textToCopy = document.getElementById('ytTranscriptText').innerText; navigator.clipboard.writeText(textToCopy).then(() => { const btn = document.getElementById('copyTranscriptBtn'); btn.innerHTML = '<i class="fas fa-check"></i> Tersalin'; btn.style.background = '#10b981'; setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy"></i> Salin Teks ke Clipboard'; btn.style.background = 'var(--primary)'; }, 2000); }).catch(() => { showToast('Gagal menyalin teks. Silakan salin manual.', 'error'); }); }
function copyLirik() { const textToCopy = document.getElementById('lirikText').innerText; navigator.clipboard.writeText(textToCopy).then(() => { const btn = document.getElementById('copyLirikBtn'); btn.innerHTML = '<i class="fas fa-check"></i> Tersalin'; btn.style.background = '#10b981'; setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy"></i> Salin Lirik ke Clipboard'; btn.style.background = 'var(--primary)'; }, 2000); }).catch(() => { showToast('Gagal menyalin teks. Silakan salin manual.', 'error'); }); }

async function fetchLirik(url) {
    const loading = document.getElementById('loading');
    const loadingText = document.getElementById('loadingText');
    loading.style.display = 'block'; loadingText.innerText = "Mengambil teks lirik...";
    try {
        const res = await fetch(`/api/proses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'lyric', params: { q: url } }) });
        const json = await res.json();
        if (json.status === true) {
            document.getElementById('lirikList').style.display = 'none';
            document.getElementById('lirikTitle').innerText = json.data.title;
            document.getElementById('lirikText').innerText = json.data.lyric;
            document.getElementById('lirikContentWrapper').style.display = 'block';
        } else { showToast("Gagal memuat lirik dari server.", "error"); }
    } catch (error) { showToast("Gangguan jaringan. Periksa koneksi internetmu.", "error"); } finally { loading.style.display = 'none'; }
}

async function processAction() {
    if (!checkCooldown()) return;

    const mainBtn = document.getElementById('mainBtn');
    const loading = document.getElementById('loading');
    const loadingText = document.getElementById('loadingText');
    const resultCard = document.getElementById('resultCard');
    const downloaderResult = document.getElementById('downloaderResult');
    const aiResult = document.getElementById('aiResult');
    const ssWebResult = document.getElementById('ssWebResult');
    const iqcResult = document.getElementById('iqcResult');
    const nulisResult = document.getElementById('nulisResult');
    const ytTranscriptResult = document.getElementById('ytTranscriptResult');
    const invoiceResult = document.getElementById('invoiceResult');
    const hdFotoResult = document.getElementById('hdFotoResult');
    const audioResult = document.getElementById('audioResult');
    const removeBgResult = document.getElementById('removeBgResult');
    const lirikResult = document.getElementById('lirikResult');
    const stalkResult = document.getElementById('stalkResult');
    const photoEditorResult = document.getElementById('photoEditorResult');
    const actionBtns = document.getElementById('actionBtns');

    let inputData = "";
    let amountData = "";
    let providerData = "";
    let phoneTime = "";
    let chatTime = "";
    let ytType = "";
    let ytQuality = "";

    if (currentPlatform === 'ai-detector' || currentPlatform === 'iqc' || currentPlatform === 'nulis') {
        inputData = document.getElementById('textContent').value.trim();
        if (!inputData) return showToast("Harap isi teks terlebih dahulu.", "error");
        if (currentPlatform === 'iqc') {
            phoneTime = document.getElementById('phoneTime').value;
            chatTime = document.getElementById('chatTime').value;
            if (!phoneTime || !chatTime) return showToast("Harap atur waktu terlebih dahulu.", "error");
        }
    } else if (currentPlatform === 'pulsa' || currentPlatform === 'topup') {
        inputData = document.getElementById('mediaUrl').value.trim();
        providerData = document.getElementById('pulsaProvider').value;
        if (currentPlatform === 'pulsa') { amountData = document.getElementById('pulsaNominal').value; } 
        else { amountData = document.getElementById('customAmount').value; if (!amountData || parseInt(amountData) < 10000) return showToast("Masukkan nominal yang valid (Minimal Rp 10.000).", "error"); }
        if (!inputData || inputData.length < 9) return showToast("Masukkan Nomor HP/Akun yang valid.", "error");
    } else if (currentPlatform === 'youtube') {
        inputData = document.getElementById('mediaUrl').value.trim();
        if (!inputData) return showToast("Harap isi kolom input URL terlebih dahulu.", "error");
        const formatVal = document.getElementById('ytFormat').value.split('|');
        ytType = formatVal[0]; ytQuality = formatVal[1];
    } else if (['hd-foto', 'noise-reduce', 'remove-bg', 'photo-editor'].includes(currentPlatform)) {
        const fileInput = document.getElementById('mediaFile');
        if (fileInput.files.length === 0) return showToast("Harap pilih file terlebih dahulu dari perangkatmu.", "error");
        
        if (fileInput.files[0].size > 4 * 1024 * 1024) {
            return showToast("Ukuran file terlalu besar! Maksimal ukuran file adalah 4MB.", "error");
        }
        
        if (currentPlatform === 'photo-editor') {
            inputData = document.getElementById('mediaUrl').value.trim();
            if (!inputData) return showToast("Harap ketik perintah edit (prompt) di kolom teks.", "error");
        }
    } else if (currentPlatform === 'lirik') {
        inputData = document.getElementById('mediaUrl').value.trim();
        if (!inputData) return showToast("Harap masukkan judul lagu terlebih dahulu.", "error");
    } else {
        inputData = document.getElementById('mediaUrl').value.trim();
        if (!inputData) return showToast("Harap isi kolom input terlebih dahulu.", "error");
    }

    setCooldown();
    mainBtn.disabled = true; mainBtn.innerHTML = "Memproses...";
    loading.style.display = 'block'; loadingText.innerText = "Memproses permintaan...";
    resultCard.style.display = 'none'; downloaderResult.style.display = 'none'; aiResult.style.display = 'none'; ssWebResult.style.display = 'none'; iqcResult.style.display = 'none'; nulisResult.style.display = 'none'; ytTranscriptResult.style.display = 'none'; invoiceResult.style.display = 'none'; hdFotoResult.style.display = 'none'; audioResult.style.display = 'none'; removeBgResult.style.display = 'none'; lirikResult.style.display = 'none'; stalkResult.style.display = 'none';
    if(photoEditorResult) photoEditorResult.style.display = 'none';

    try {
        let finalInputData = inputData;
        let fileBase64Obj = null;

        if (['hd-foto', 'remove-bg', 'noise-reduce', 'photo-editor'].includes(currentPlatform)) {
            const fileInput = document.getElementById('mediaFile');
            loadingText.innerText = "Menyiapkan file untuk diproses (Mohon tunggu)...";
            
            const file = fileInput.files[0];
            const base64String = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(new Error("Gagal membaca file dari HP-mu."));
                reader.readAsDataURL(file);
            });
            
            fileBase64Obj = { base64: base64String, fileName: file.name, mimeType: file.type };
            finalInputData = inputData; 
        }

        let action = '';
        let params = {};

        if (currentPlatform === 'pulsa' || currentPlatform === 'topup') { action = providerData; params = { number: finalInputData, amount: amountData }; }
        else if (currentPlatform === 'youtube') { action = 'youtube'; params = { url: finalInputData, type: ytType, quality: ytQuality }; }
        else if (currentPlatform === 'tiktok') { action = 'snaptik-v2'; params = { url: finalInputData }; }
        else if (currentPlatform === 'ig') { action = 'ig'; params = { url: finalInputData }; }
        else if (currentPlatform === 'facebook') { action = 'fb'; params = { url: finalInputData }; }
        else if (currentPlatform === 'twitter') { action = 'twitter'; params = { url: finalInputData }; }
        else if (currentPlatform === 'terabox') { action = 'terabox'; params = { url: finalInputData }; }
        else if (currentPlatform === 'pin') { action = 'pin'; params = { url: finalInputData }; }
        else if (currentPlatform === 'spotify') { action = 'spotify'; params = { url: finalInputData }; }
        else if (currentPlatform === 'ss-web') { action = 'ss'; params = { url: finalInputData, device: 'desktop' }; }
        else if (currentPlatform === 'yt-transcript') { action = 'transcript'; params = { url: finalInputData }; }
        else if (currentPlatform === 'ai-detector') { action = 'ai-detector'; params = { text: finalInputData }; }
        else if (currentPlatform === 'iqc') { action = 'iqc'; params = { text: finalInputData, time: phoneTime, chat_time: chatTime }; }
        else if (currentPlatform === 'nulis') { action = 'nulis'; params = { text: finalInputData }; }
        else if (currentPlatform === 'hd-foto') { action = 'upscale'; params = { image: "" }; }
        else if (currentPlatform === 'noise-reduce') { action = 'noice-reducer'; params = { file: "" }; }
        else if (currentPlatform === 'remove-bg') { action = 'nobg'; params = { image: "" }; }
        else if (currentPlatform === 'photo-editor') { action = 'photo-editor'; params = { image: "", q: finalInputData }; }
        else if (currentPlatform === 'lirik') { action = 'lyric'; params = { q: finalInputData }; }
        else if (currentPlatform === 'roblox-stalk') { action = 'roblox-stalk'; params = { username: finalInputData }; }
        else if (currentPlatform === 'dc-stalk') { action = 'dcstalk'; params = { id: finalInputData }; }
        else if (currentPlatform === 'tt-stalk') { action = 'ttstalk'; params = { username: finalInputData }; }
        else if (currentPlatform === 'tw-stalk') { action = 'twstalk'; params = { username: finalInputData }; }
        else if (currentPlatform === 'gh-stalk') { action = 'ghstalk'; params = { username: finalInputData }; }
        else if (currentPlatform === 'ig-stalk') { action = 'igstalk'; params = { username: finalInputData }; }
        else if (currentPlatform === 'th-stalk') { action = 'thstalk'; params = { username: finalInputData }; }

        if (['hd-foto', 'remove-bg', 'noise-reduce', 'photo-editor'].includes(currentPlatform)) {
            loadingText.innerHTML = `Sedang diproses oleh AI, harap tunggu... <i class="fas fa-sparkles" style="color: #fbbf24;"></i>`;
        }

        const response = await fetch('/api/proses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: action, params: params, fileData: fileBase64Obj })
        });
        
        const json = await response.json();

        if (json.status === true) {
            showToast("Berhasil memproses permintaan!", "success");
            const data = json.data;

            if (currentPlatform === 'pulsa' || currentPlatform === 'topup') {
                invoiceResult.style.display = 'block';
                document.getElementById('invoiceId').innerText = `Order ID: ${data.code}`;
                document.getElementById('invService').innerText = `${data.product.service} - ${data.product.type}`;
                document.getElementById('invNumber').innerText = data.number;
                document.getElementById('invExpired').innerText = data.expired_at;
                document.getElementById('invPrice').innerText = data.price_format;
                let qrData = data.qr_image;
                if (!qrData.startsWith('data:image')) qrData = `data:image/png;base64,${qrData}`;
                document.getElementById('invQrImage').src = qrData;
            }
            else if (['roblox-stalk', 'dc-stalk', 'tt-stalk', 'tw-stalk', 'gh-stalk', 'ig-stalk', 'th-stalk'].includes(currentPlatform)) {
                stalkResult.style.display = 'block';
                const avatarImg = document.getElementById('stalkAvatar');
                const nameEl = document.getElementById('stalkName');
                const userEl = document.getElementById('stalkUsername');
                const bioEl = document.getElementById('stalkBio');
                const gridEl = document.getElementById('stalkStatsGrid');
                const extraEl = document.getElementById('stalkExtra');
                const badgeCon = document.getElementById('stalkBadgeContainer');
                const badgeList = document.getElementById('stalkBadgeList');
                
                gridEl.innerHTML = ''; extraEl.innerHTML = ''; bioEl.innerText = '';
                if(badgeCon) badgeCon.style.display = 'none';
                
                if (currentPlatform === 'roblox-stalk') {
                    avatarImg.src = data.avatar;
                    nameEl.innerText = data.displayName || data.name;
                    userEl.innerText = `@${data.name}`;
                    if(data.description) bioEl.innerText = data.description;
                    
                    gridEl.innerHTML = `
                        <div class="ai-stat-box"><h4>${data.friends}</h4><p>Teman</p></div>
                        <div class="ai-stat-box"><h4>${data.followers}</h4><p>Followers</p></div>
                        <div class="ai-stat-box"><h4>${data.followings}</h4><p>Followings</p></div>
                        <div class="ai-stat-box"><h4>${data.badges ? data.badges.length : 0}</h4><p>Badges</p></div>
                    `;
                    extraEl.innerHTML = `<strong>ID:</strong> ${data.id}<br><strong>Dibuat:</strong> ${new Date(data.created).toLocaleDateString()}<br><strong>Banned:</strong> ${data.isBanned ? 'Ya' : 'Tidak'}`;

                    if (data.badges && data.badges.length > 0 && badgeCon && badgeList) {
                        badgeCon.style.display = 'block';
                        badgeList.innerHTML = '';
                        data.badges.forEach(badge => {
                            badgeList.innerHTML += `
                                <div style="display: flex; gap: 12px; align-items: center; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid var(--border-color); text-align: left;">
                                    <div>
                                        <div style="color:#fff; font-weight:600; font-size:14px;">${badge.name}</div>
                                        <div style="color:var(--text-muted); font-size:12px; margin-top:4px;">Game ID: ${badge.awarder.id}</div>
                                        <div style="color:var(--text-muted); font-size:12px;">Win Rate: ${(badge.statistics.winRatePercentage * 100).toFixed(1)}%</div>
                                    </div>
                                </div>
                            `;
                        });
                    }
                }
                else if (currentPlatform === 'gh-stalk') {
                    avatarImg.src = data.avatar_url;
                    nameEl.innerText = data.name || data.login;
                    userEl.innerText = `@${data.login}`;
                    if(data.bio && data.bio !== '.') bioEl.innerText = data.bio;
                    
                    gridEl.innerHTML = `
                        <div class="ai-stat-box"><h4>${data.followers}</h4><p>Followers</p></div>
                        <div class="ai-stat-box"><h4>${data.following}</h4><p>Following</p></div>
                        <div class="ai-stat-box" style="grid-column: span 2;"><h4>${data.public_repos}</h4><p>Public Repositories</p></div>
                    `;
                    extraEl.innerHTML = `
                        <strong>ID:</strong> ${data.id}<br>
                        <strong>Dibuat:</strong> ${new Date(data.created_at).toLocaleDateString()}<br>
                        <strong>Tipe:</strong> ${data.type}<br>
                        ${data.blog ? `<strong>Blog:</strong> <a href="${data.blog}" target="_blank" style="color:var(--primary);">${data.blog}</a>` : ''}
                    `;
                }
                else if (currentPlatform === 'ig-stalk') {
                    avatarImg.src = data.photo;
                    nameEl.innerText = data.name;
                    userEl.innerText = `@${data.username}`;
                    if(data.about) bioEl.innerText = data.about;
                    
                    gridEl.innerHTML = `
                        <div class="ai-stat-box"><h4>${data.follower.toLocaleString()}</h4><p>Followers</p></div>
                        <div class="ai-stat-box"><h4>${data.following.toLocaleString()}</h4><p>Following</p></div>
                        <div class="ai-stat-box" style="grid-column: span 2;"><h4>${data.post.toLocaleString()}</h4><p>Posts</p></div>
                    `;
                    extraEl.innerHTML = `<strong>ID:</strong> ${data.id}<br><strong>Private:</strong> ${data.private ? 'Ya' : 'Tidak'}`;
                }
                else if (currentPlatform === 'th-stalk') {
                    let picUrl = data.profile_pic_url;
                    if(!picUrl && data.hd_profile_pic_versions && data.hd_profile_pic_versions.length > 0) {
                        picUrl = data.hd_profile_pic_versions[0].url;
                    }
                    avatarImg.src = picUrl || '';
                    nameEl.innerText = data.full_name;
                    userEl.innerText = `@${data.username}`;
                    if(data.biography) bioEl.innerText = data.biography;
                    
                    gridEl.innerHTML = `
                        <div class="ai-stat-box" style="grid-column: span 2;"><h4>${data.follower_count.toLocaleString()}</h4><p>Followers</p></div>
                    `;
                    extraEl.innerHTML = `<strong>ID:</strong> ${data.pk}<br><strong>Verified:</strong> ${data.is_verified ? 'Ya' : 'Tidak'}`;
                }
                else if (currentPlatform === 'dc-stalk') {
                    avatarImg.src = data.avatar_url;
                    nameEl.innerText = data.global_name || data.username;
                    userEl.innerText = `@${data.username}`;
                    
                    gridEl.innerHTML = `
                        <div class="ai-stat-box" style="grid-column: span 2;"><h4>${data.id}</h4><p>User ID</p></div>
                        <div class="ai-stat-box"><h4>${data.discriminator}</h4><p>Discriminator</p></div>
                    `;
                    extraEl.innerHTML = `<strong>Dibuat:</strong> ${new Date(data.created_at).toLocaleString()}`;
                }
                else if (currentPlatform === 'tt-stalk') {
                    avatarImg.src = data.photo;
                    nameEl.innerText = data.name;
                    userEl.innerText = `@${data.username}`;
                    if(data.bio) bioEl.innerText = data.bio;
                    
                    gridEl.innerHTML = `
                        <div class="ai-stat-box"><h4>${data.followers.toLocaleString()}</h4><p>Followers</p></div>
                        <div class="ai-stat-box"><h4>${data.following.toLocaleString()}</h4><p>Following</p></div>
                        <div class="ai-stat-box"><h4>${data.likes.toLocaleString()}</h4><p>Likes</p></div>
                        <div class="ai-stat-box"><h4>${data.posts.toLocaleString()}</h4><p>Posts</p></div>
                    `;
                    extraEl.innerHTML = `<strong>ID:</strong> ${data.id}<br><strong>Verified:</strong> ${data.verified ? 'Ya' : 'Tidak'}<br><strong>Private:</strong> ${data.private ? 'Ya' : 'Tidak'}`;
                }
                else if (currentPlatform === 'tw-stalk') {
                    avatarImg.src = data.photo;
                    nameEl.innerText = data.name;
                    userEl.innerText = data.username;
                    
                    gridEl.innerHTML = `
                        <div class="ai-stat-box"><h4>${data.followers}</h4><p>Followers</p></div>
                        <div class="ai-stat-box"><h4>${data.followings}</h4><p>Following</p></div>
                        <div class="ai-stat-box"><h4>${data.likes}</h4><p>Likes</p></div>
                        <div class="ai-stat-box"><h4>${data.tweets}</h4><p>Tweets</p></div>
                    `;
                    extraEl.innerHTML = `<strong>Status:</strong> ${data.joined}<br><strong>Private:</strong> ${data.private ? 'Ya' : 'Tidak'}`;
                }
            }
            else if (currentPlatform === 'lirik') {
                lirikResult.style.display = 'block';
                const listContainer = document.getElementById('lirikList');
                const lirikContentWrapper = document.getElementById('lirikContentWrapper');
                document.getElementById('lirikTitle').innerText = "Pilih Versi Lagu:";
                listContainer.style.display = 'flex';
                lirikContentWrapper.style.display = 'none';
                listContainer.innerHTML = '';
                data.forEach(item => {
                    listContainer.innerHTML += `<button class="btn-secondary" onclick="fetchLirik('${item.url}')" style="text-align:left; justify-content:flex-start;"><i class="fas fa-music" style="color:var(--primary);"></i> ${item.title}</button>`;
                });
            }
            // =========================================================
            // MENGGUNAKAN FUNGSI forceDownload() UNTUK TOMBOL-TOMBOL AI
            // =========================================================
            else if (currentPlatform === 'photo-editor') {
                photoEditorResult.style.display = 'block';
                document.getElementById('photoEditorInfo').innerText = `Ukuran File: ${data.size}`;
                document.getElementById('photoEditorImage').src = data.url;
                document.getElementById('photoEditorActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${data.url}', 'Moonlight_EditAI.jpg')"><i class="fas fa-download"></i> Simpan Hasil Edit</button>`;
            }
            else if (currentPlatform === 'hd-foto') {
                hdFotoResult.style.display = 'block';
                document.getElementById('hdFotoInfo').innerText = `Ukuran File Baru: ${data.size}`;
                document.getElementById('hdImageResult').src = data.url;
                document.getElementById('hdActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${data.url}', 'Moonlight_HDFoto.jpg')"><i class="fas fa-download"></i> Simpan Foto HD</button>`;
            }
            else if (currentPlatform === 'remove-bg') {
                removeBgResult.style.display = 'block';
                document.getElementById('removeBgImage').src = data.no_background;
                document.getElementById('removeBgActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${data.no_background}', 'Moonlight_Transparan.png')"><i class="fas fa-download"></i> Simpan Gambar Transparan</button>`;
            }
            else if (currentPlatform === 'noise-reduce') {
                audioResult.style.display = 'block';
                document.getElementById('audioPlayer').src = data.url;
                document.getElementById('audioActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${data.url}', 'Moonlight_CleanAudio.mp3')"><i class="fas fa-download"></i> Simpan Audio Bersih</button>`;
            }
            else if (currentPlatform === 'ss-web') {
                ssWebResult.style.display = 'block';
                document.getElementById('ssWebImage').src = data.url;
                document.getElementById('ssWebActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${data.url}', 'Moonlight_Screenshot.jpg')"><i class="fas fa-download"></i> Simpan Screenshot</button>`;
            }
            else if (currentPlatform === 'iqc') {
                iqcResult.style.display = 'block';
                document.getElementById('iqcImage').src = data.url;
                document.getElementById('iqcActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${data.url}', 'Moonlight_Quote.png')"><i class="fas fa-download"></i> Simpan Gambar Kutipan</button>`;
            }
            else if (currentPlatform === 'nulis') {
                nulisResult.style.display = 'block';
                document.getElementById('nulisImage').src = data.url;
                document.getElementById('nulisActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${data.url}', 'Moonlight_Catatan.jpg')"><i class="fas fa-download"></i> Simpan Gambar Tulisan</button>`;
            }
            else if (currentPlatform === 'ai-detector') {
                aiResult.style.display = 'block';
                const badge = document.getElementById('aiFeedbackBadge');
                badge.innerText = data.feedback || "Selesai Dianalisis";
                badge.className = "ai-feedback-badge";
                if (data.isHuman > 70) badge.classList.add("ai-human");
                else if (data.fakePercentage > 50) badge.classList.add("ai-fake");
                else badge.classList.add("ai-mixed");
                document.getElementById('aiScoreHuman').innerText = `${data.isHuman}%`;
                document.getElementById('aiScoreFake').innerText = `${data.fakePercentage}%`;
                setTimeout(() => {
                    document.getElementById('barHuman').style.width = `${data.isHuman}%`;
                    document.getElementById('barFake').style.width = `${data.fakePercentage}%`;
                }, 100);
            }
            else if (currentPlatform === 'yt-transcript') {
                ytTranscriptResult.style.display = 'block';
                document.getElementById('ytTranscriptText').innerText = data.text || "Tidak ada transcript.";
            }
            else {
                downloaderResult.style.display = 'block';
                const profileSec = document.getElementById('profileSection');
                const captionText = document.getElementById('videoCaption');
                const thumbCon = document.getElementById('thumbnailContainer');
                const thumbImg = document.getElementById('videoThumbnail');
                const thumbFallback = document.getElementById('thumbnailFallback');
                actionBtns.innerHTML = '';

                if (currentPlatform === 'facebook') {
                    profileSec.style.display = 'none'; captionText.style.display = 'none'; thumbCon.style.display = 'none';
                    data.forEach((item) => { actionBtns.innerHTML += `<a href="${item.url}" class="btn-primary btn-fb" target="_blank"><i class="fas fa-video"></i> Download Video (${item.quality})</a>`; });
                }
                else if (currentPlatform === 'twitter') {
                    profileSec.style.display = 'none'; captionText.style.display = 'none'; thumbCon.style.display = 'none';
                    data.forEach((item, index) => {
                        let typeText = item.type === "mp4" ? "Video" : "Gambar";
                        let icon = item.type === "mp4" ? "fa-video" : "fa-image";
                        actionBtns.innerHTML += `<a href="${item.url}" class="btn-primary btn-tw" target="_blank"><i class="fas ${icon}"></i> Download ${typeText} ${index + 1}</a>`;
                    });
                }
                else if (currentPlatform === 'terabox') {
                    profileSec.style.display = 'none'; captionText.style.display = 'block';
                    const teraItem = data[0];
                    captionText.innerHTML = `<div style="margin-bottom: 8px;"><strong>Nama File:</strong> ${teraItem.server_filename}</div><div><strong>Ukuran:</strong> ${teraItem.size}</div>`;
                    thumbCon.style.display = 'flex';
                    if (teraItem.thumbs && teraItem.thumbs.url3) { thumbImg.src = teraItem.thumbs.url3; thumbImg.onload = () => { thumbImg.style.display = "block"; thumbFallback.style.display = "none"; }; thumbImg.onerror = () => { thumbImg.style.display = "none"; thumbFallback.style.display = "flex"; }; } else { thumbImg.style.display = "none"; thumbFallback.style.display = "flex"; }
                    actionBtns.innerHTML = `<a href="${teraItem.dlink}" class="btn-primary" target="_blank"><i class="fas fa-cloud-download-alt"></i> Download File</a>`;
                }
                else if (currentPlatform === 'youtube') {
                    profileSec.style.display = 'none'; captionText.style.display = 'block';
                    captionText.innerHTML = `<div style="margin-bottom: 8px;"><strong>Judul:</strong> ${json.title}</div><div style="margin-bottom: 8px;"><strong>Channel:</strong> ${json.channel}</div><div style="margin-bottom: 8px;"><strong>Durasi:</strong> ${json.fduration}</div><div style="margin-bottom: 8px;"><strong>Kualitas:</strong> ${data.quality}</div><div><strong>Ukuran File:</strong> ${data.size}</div>`;
                    thumbCon.style.display = 'flex'; thumbImg.src = json.thumbnail;
                    thumbImg.onload = () => { thumbImg.style.display = "block"; thumbFallback.style.display = "none"; }; thumbImg.onerror = () => { thumbImg.style.display = "none"; thumbFallback.style.display = "flex"; };
                    actionBtns.innerHTML = `<a href="${data.url}" class="btn-yt" target="_blank"><i class="fas fa-download"></i> Download ${data.extension.toUpperCase()}</a>`;
                }
                else if (currentPlatform === 'spotify') {
                    profileSec.style.display = 'none'; captionText.style.display = 'block';
                    captionText.innerHTML = `<strong>Judul:</strong> ${data.title}<br><strong>Artis:</strong> ${data.artist.name}<br><strong>Durasi:</strong> ${data.duration}`;
                    thumbCon.style.display = 'flex'; thumbImg.src = data.thumbnail;
                    thumbImg.onload = () => { thumbImg.style.display = "block"; thumbFallback.style.display = "none"; }; thumbImg.onerror = () => { thumbImg.style.display = "none"; thumbFallback.style.display = "flex"; };
                    actionBtns.innerHTML = `<a href="${data.url}" class="btn-primary" style="background:#1db954;" target="_blank"><i class="fab fa-spotify"></i> Download MP3</a>`;
                }
                else if (currentPlatform === 'tiktok') {
                    profileSec.style.display = 'none'; captionText.style.display = 'none';
                    if (data.photo && data.photo.length > 0) {
                        thumbCon.style.display = 'flex'; thumbImg.src = data.photo[0];
                        thumbImg.onload = () => { thumbImg.style.display = "block"; thumbFallback.style.display = "none"; }; thumbImg.onerror = () => { thumbImg.style.display = "none"; thumbFallback.style.display = "flex"; };
                        data.photo.forEach((imgUrl, index) => { actionBtns.innerHTML += `<a href="${imgUrl}" class="btn-primary" target="_blank"><i class="fas fa-image"></i> Download Foto ${index + 1}</a>`; });
                        if (data.audio) { actionBtns.innerHTML += `<a href="${data.audio}" class="btn-secondary" target="_blank"><i class="fas fa-music"></i> Download Audio</a>`; }
                    } else {
                        thumbCon.style.display = 'none';
                        if (data.video) { actionBtns.innerHTML += `<a href="${data.video}" class="btn-primary" target="_blank"><i class="fas fa-video"></i> Download Video</a>`; }
                        if (data.videoHD) { actionBtns.innerHTML += `<a href="${data.videoHD}" class="btn-primary" target="_blank"><i class="fas fa-video"></i> Download Video (HD)</a>`; }
                        if (data.audio) { actionBtns.innerHTML += `<a href="${data.audio}" class="btn-secondary" target="_blank"><i class="fas fa-music"></i> Download Audio</a>`; }
                    }
                }
                else if (currentPlatform === 'ig') {
                    profileSec.style.display = 'none'; captionText.style.display = 'none'; thumbCon.style.display = 'none';
                    data.forEach((item, index) => { let typeText = item.type === "mp4" ? "Video" : "Gambar"; actionBtns.innerHTML += `<a href="${item.url}" class="btn-primary" target="_blank">Download ${typeText} ${index + 1}</a>`; });
                }
                else if (currentPlatform === 'pin') {
                    profileSec.style.display = 'none'; captionText.style.display = 'none'; thumbCon.style.display = 'none';
                    actionBtns.innerHTML = `<a href="${data.url}" class="btn-primary" target="_blank">Download Media (${data.size})</a>`;
                }
            }
            resultCard.style.display = 'block';
        }
        else {
            let pesanErrorAPI = json.msg || json.message || "Terjadi kesalahan pada sistem.";
            showToast("Info sistem: " + pesanErrorAPI, "error");
        }
    } catch (error) {
        console.error(error);
        showToast(error.message, "error");
    } finally {
        loading.style.display = 'none';
        mainBtn.disabled = false;
        if (currentPlatform === 'pulsa' || currentPlatform === 'topup') mainBtn.innerHTML = "Buat Tagihan Pembayaran";
        else if (currentPlatform === 'ss-web') mainBtn.innerHTML = "Ambil Screenshot";
        else if (currentPlatform === 'yt-transcript') mainBtn.innerHTML = "Ekstrak Teks Sekarang";
        else if (currentPlatform === 'ai-detector') mainBtn.innerHTML = "Deteksi Teks Sekarang";
        else if (currentPlatform === 'iqc') mainBtn.innerHTML = "Buat Kutipan iPhone";
        else if (currentPlatform === 'nulis') mainBtn.innerHTML = "Mulai Nulis";
        else if (currentPlatform === 'hd-foto') mainBtn.innerHTML = "Tingkatkan Kualitas Foto";
        else if (currentPlatform === 'remove-bg') mainBtn.innerHTML = "Hapus Background Gambar";
        else if (currentPlatform === 'noise-reduce') mainBtn.innerHTML = "Bersihkan Suara Audio";
        else if (currentPlatform === 'photo-editor') mainBtn.innerHTML = "Edit Foto Sekarang";
        else if (currentPlatform === 'lirik') mainBtn.innerHTML = "Cari Lirik Sekarang";
        else if (currentPlatform === 'terabox') mainBtn.innerHTML = "Buka File TeraBox";
        else if (['roblox-stalk', 'dc-stalk', 'tt-stalk', 'tw-stalk', 'gh-stalk', 'ig-stalk', 'th-stalk'].includes(currentPlatform)) mainBtn.innerHTML = "Cari Sekarang";
        else mainBtn.innerHTML = "Download Sekarang";
    }
}

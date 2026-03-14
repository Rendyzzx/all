const API_BASE = "/api/proses";

let currentPlatform = 'tiktok';
const COOLDOWN_TIME = 15000;
let toastTimeout; 
let historyList = JSON.parse(localStorage.getItem('moonlight_history')) || [];
let offlineQueue = JSON.parse(localStorage.getItem('moonlight_queue')) || [];

const _imgStore = {};

let gameInterval;
let scoreInterval;
let gameScore = 0;
let isJumping = false;

// ==========================================
// LOGIKA CAROUSEL KATEGORI (5 HALAMAN)
// ==========================================
let currentCatIndex = 0;
const categoryTitles = ["Downloader Media", "Tools", "AI", "Stalker / Checker", "Digital & Info"];
const totalCategories = 5;

function updateCategoryUI() {
    const titleEl = document.getElementById('catTitle');
    if (titleEl) {
        titleEl.innerText = categoryTitles[currentCatIndex];
    }
    
    for (let i = 0; i < totalCategories; i++) {
        const page = document.getElementById('cat-page-' + i);
        if (page) {
            if (i === currentCatIndex) {
                page.classList.add('active');
            } else {
                page.classList.remove('active');
            }
        }
    }
    
    const dots = document.querySelectorAll('.cat-dot');
    dots.forEach((dot, index) => {
        if (index === currentCatIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

function nextCat() {
    currentCatIndex = (currentCatIndex + 1) % totalCategories;
    if (navigator.vibrate) {
        navigator.vibrate(20); 
    }
    updateCategoryUI();
}

function prevCat() {
    currentCatIndex = (currentCatIndex - 1 + totalCategories) % totalCategories;
    if (navigator.vibrate) {
        navigator.vibrate(20);
    }
    updateCategoryUI();
}

function goToCat(index) {
    currentCatIndex = index;
    if (navigator.vibrate) {
        navigator.vibrate(20);
    }
    updateCategoryUI();
}
// ==========================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    });
}

window.onload = function () {
    setTimeout(() => {
        const splash = document.getElementById('splashScreen');
        if (splash) {
            splash.classList.add('splash-hidden');
        }
    }, 1500);

    setPlatform('youtube');
    renderHistory();
    updateCategoryUI(); 
    
    if (!navigator.onLine) {
        handleOffline();
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    document.querySelectorAll('.bnav-item').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const defaultBtn = document.getElementById('bnav-all');
    if (defaultBtn) {
        defaultBtn.classList.add('active');
    }
};

function handleOffline() {
    const indicator = document.getElementById('offlineIndicator');
    if (indicator) {
        indicator.style.display = 'block';
    }
    showToast("Mode Offline Aktif. Permintaan akan masuk antrean.", "info");
}

function handleOnline() {
    const indicator = document.getElementById('offlineIndicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
    showToast("Internet terhubung! Memproses antrean...", "success");
    
    setTimeout(() => {
        processQueue();
    }, 1500);
}

function processQueue() {
    if (offlineQueue.length > 0) {
        const task = offlineQueue.shift();
        localStorage.setItem('moonlight_queue', JSON.stringify(offlineQueue));
        
        setPlatform(task.platform);
        
        setTimeout(() => {
            const mediaUrlInput = document.getElementById('mediaUrl');
            if (mediaUrlInput) {
                mediaUrlInput.value = task.url || '';
            }
            
            const textContentInput = document.getElementById('textContent');
            if (textContentInput) {
                textContentInput.value = task.text || '';
            }
            
            processAction(true);
        }, 500);
    }
}

function extractColorAndApply(imageSrc) {
    if (!imageSrc) return;
    
    let finalSrc = imageSrc;
    if (imageSrc.length > 1000 && !imageSrc.startsWith('http') && !imageSrc.startsWith('data:image')) {
        finalSrc = 'data:image/png;base64,' + imageSrc;
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";
    
    img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        canvas.width = 50;
        canvas.height = 50;
        
        ctx.drawImage(img, 0, 0, 50, 50);
        
        try {
            const data = ctx.getImageData(0, 0, 50, 50).data;
            let r = 0, g = 0, b = 0;
            let count = 0;
            
            for (let i = 0; i < data.length; i += 16) {
                r += data[i];
                g += data[i+1];
                b += data[i+2];
                count++;
            }
            
            r = Math.floor(r / count);
            g = Math.floor(g / count);
            b = Math.floor(b / count);
            
            document.documentElement.style.setProperty('--ambient-glow', `rgba(${r}, ${g}, ${b}, 0.5)`);
        } catch(e) {
            document.documentElement.style.setProperty('--ambient-glow', 'rgba(15, 23, 42, 0)');
        }
    };
    
    img.onerror = function() {
        document.documentElement.style.setProperty('--ambient-glow', 'rgba(15, 23, 42, 0)');
    };
    
    img.src = finalSrc;
}

function applyDynamicTheme(platform) {
    const root = document.documentElement;
    let primary = '#2563eb';
    let hover = '#1d4ed8';
    
    const aiImageTools = ['hd-foto', 'remove-bg', 'noise-reduce', 'photo-editor', 'ai-detector', 'ai-anime', 'genimg', 'ai-real', 'waifu', 'koros'];
    const aiChatTools = ['gpt4', 'claude', 'gemini', 'bard', 'blackbox', 'felo', 'perplexity'];
    
    if (['youtube', 'yt-transcript', 'pin', 'tts'].includes(platform)) { 
        primary = '#ef4444'; 
        hover = '#dc2626'; 
    } else if (['tiktok', 'tt-stalk', 'shortlink'].includes(platform)) { 
        primary = '#06b6d4'; 
        hover = '#0891b2'; 
    } else if (['ig', 'ig-stalk'].includes(platform)) { 
        primary = '#d946ef'; 
        hover = '#c026d3'; 
    } else if (platform === 'facebook') { 
        primary = '#1877f2'; 
        hover = '#1462cb'; 
    } else if (['twitter', 'tw-stalk', 'th-stalk'].includes(platform)) { 
        primary = '#475569'; 
        hover = '#334155'; 
    } else if (['spotify', 'lirik', 'qr-gen'].includes(platform)) { 
        primary = '#10b981'; 
        hover = '#059669'; 
    } else if (aiImageTools.includes(platform)) { 
        primary = '#8b5cf6'; 
        hover = '#7c3aed'; 
    } else if (aiChatTools.includes(platform)) { 
        primary = '#14b8a6'; 
        hover = '#0d9488'; 
    } else if (['pulsa', 'topup', 'roblox-stalk'].includes(platform)) { 
        primary = '#10b981'; 
        hover = '#059669'; 
    } else if (['nulis', 'iqc', 'ss-web', 'dc-stalk', 'gh-stalk'].includes(platform)) { 
        primary = '#f59e0b'; 
        hover = '#d97706'; 
    }

    root.style.setProperty('--primary', primary);
    root.style.setProperty('--primary-hover', hover);
    root.style.setProperty('--ambient-glow', 'rgba(15, 23, 42, 0)');
}

function setPlatform(platform) {
    if (navigator.vibrate) {
        navigator.vibrate(15);
    }
    currentPlatform = platform;
    applyDynamicTheme(platform);

    const title = document.getElementById('mainTitle');
    const urlCont = document.getElementById('urlInputContainer');
    const textCont = document.getElementById('textInputContainer');
    const fileCont = document.getElementById('fileInputContainer');
    const nominalCont = document.getElementById('nominalContainer');
    const customAmountCont = document.getElementById('customAmountContainer');
    const providerCont = document.getElementById('providerContainer');
    const ytFormatCont = document.getElementById('ytFormatContainer');
    const timeInputsCont = document.getElementById('timeInputsContainer');
    const catboxHelper = document.getElementById('catboxHelper');
    const contactCont = document.getElementById('contactContainer');
    const btn = document.getElementById('mainBtn');
    
    const allContainers = [
        urlCont, textCont, fileCont, nominalCont, customAmountCont, 
        providerCont, ytFormatCont, timeInputsCont, catboxHelper, contactCont
    ];
    
    allContainers.forEach(el => {
        if (el) {
            el.style.display = 'none';
        }
    });
    
    const resultCard = document.getElementById('resultCard');
    if (resultCard) {
        resultCard.style.display = 'none'; 
    }
    
    if (btn) {
        btn.style.display = 'flex';
    }

    if (platform === 'kontak') { 
        title.innerHTML = "Hubungi Owner"; 
        contactCont.style.display = 'flex'; 
        btn.style.display = 'none'; 
    } else if (platform === 'pulsa') { 
        title.innerHTML = "Isi Ulang Pulsa"; 
        document.getElementById('mediaUrl').placeholder = "Masukkan Nomor HP (0812...)"; 
        document.getElementById('pulsaProvider').innerHTML = `
            <option value="pulsa-axis">AXIS</option>
            <option value="pulsa-indosat">INDOSAT (IM3)</option>
            <option value="pulsa-telkomsel">TELKOMSEL</option>
            <option value="pulsa-tri">TRI (3)</option>
            <option value="pulsa-xl">XL AXIATA</option>
        `;
        urlCont.style.display = 'flex'; 
        providerCont.style.display = 'flex'; 
        nominalCont.style.display = 'flex'; 
        btn.innerHTML = 'Buat Tagihan'; 
    } else if (platform === 'topup') { 
        title.innerHTML = "Topup E-Wallet"; 
        document.getElementById('mediaUrl').placeholder = "Masukkan Nomor Akun (0812...)"; 
        document.getElementById('pulsaProvider').innerHTML = `
            <option value="topup-dana">DANA</option>
            <option value="topup-gopay">GOPAY</option>
            <option value="topup-ovo">OVO</option>
            <option value="topup-shopeepay">SHOPEEPAY</option>
        `;
        urlCont.style.display = 'flex'; 
        providerCont.style.display = 'flex'; 
        customAmountCont.style.display = 'flex'; 
        btn.innerHTML = 'Buat Tagihan'; 
    } else if (platform === 'youtube') { 
        title.innerHTML = "Unduh YouTube"; 
        document.getElementById('mediaUrl').placeholder = "Tempel tautan video YouTube di sini..."; 
        urlCont.style.display = 'flex'; 
        ytFormatCont.style.display = 'flex'; 
        btn.innerHTML = 'Download Sekarang'; 
    } else if (platform === 'tiktok') { 
        title.innerHTML = "Unduh Video TikTok"; 
        document.getElementById('mediaUrl').placeholder = "Tempel tautan video TikTok di sini..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Download Sekarang'; 
    } else if (platform === 'ig') { 
        title.innerHTML = "Unduh Media Instagram"; 
        document.getElementById('mediaUrl').placeholder = "Tempel tautan Post/Reels IG di sini..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Download Sekarang'; 
    } else if (platform === 'facebook') { 
        title.innerHTML = "Unduh Video Facebook"; 
        document.getElementById('mediaUrl').placeholder = "Tempel tautan video/Reels Facebook..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Download Sekarang'; 
    } else if (platform === 'twitter') { 
        title.innerHTML = "Unduh Media Twitter (X)"; 
        document.getElementById('mediaUrl').placeholder = "Tempel tautan postingan Twitter (X)..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Download Sekarang'; 
    } else if (platform === 'terabox') { 
        title.innerHTML = "TeraBox Downloader"; 
        document.getElementById('mediaUrl').placeholder = "Tempel tautan file TeraBox di sini..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Buka File TeraBox'; 
    } else if (platform === 'pin') { 
        title.innerHTML = "Unduh Media Pinterest"; 
        document.getElementById('mediaUrl').placeholder = "Tempel tautan Pin dari Pinterest di sini..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Download Sekarang'; 
    } else if (platform === 'spotify') { 
        title.innerHTML = "Unduh Musik Spotify"; 
        document.getElementById('mediaUrl').placeholder = "Tempel tautan lagu Spotify di sini..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Download Sekarang'; 
    } else if (platform === 'lirik') { 
        title.innerHTML = "Pencarian Lirik Lagu"; 
        document.getElementById('mediaUrl').placeholder = "Ketik judul lagu (contoh: Komang)..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Cari Lirik Sekarang'; 
    } else if (platform === 'ss-web') { 
        title.innerHTML = "Screenshot Website"; 
        document.getElementById('mediaUrl').placeholder = "Masukkan URL web (https://...)"; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Ambil Screenshot'; 
    } else if (platform === 'yt-transcript') { 
        title.innerHTML = "YouTube Transcript"; 
        document.getElementById('mediaUrl').placeholder = "Tempel tautan video YouTube di sini..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Ekstrak Teks Sekarang'; 
    } else if (platform === 'qr-gen') { 
        title.innerHTML = "Buat QR Code"; 
        document.getElementById('textContent').placeholder = "Ketik link atau teks rahasia di sini..."; 
        textCont.style.display = 'flex'; 
        btn.innerHTML = 'Generate QR Code'; 
    } else if (platform === 'shortlink') { 
        title.innerHTML = "Pemendek URL (Shortlink)"; 
        document.getElementById('mediaUrl').placeholder = "Tempel tautan panjang yang ingin dipendekkan..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Pendekkan Tautan'; 
    } else if (platform === 'tts') { 
        title.innerHTML = "Text to Speech AI"; 
        document.getElementById('textContent').placeholder = "Ketik teks yang ingin dibacakan AI (Maks 200 huruf)..."; 
        textCont.style.display = 'flex'; 
        btn.innerHTML = 'Ubah ke Suara'; 
    } else if (['ai-anime', 'genimg', 'ai-real', 'waifu'].includes(platform)) { 
        title.innerHTML = "Generate Image AI"; 
        document.getElementById('textContent').placeholder = "Ketik prompt / perintah (bahasa inggris)..."; 
        textCont.style.display = 'flex'; 
        btn.innerHTML = 'Generate Gambar'; 
    } else if (['gpt4', 'claude', 'gemini', 'bard', 'blackbox', 'felo', 'perplexity'].includes(platform)) { 
        title.innerHTML = "AI Chatbot Assistant"; 
        document.getElementById('textContent').placeholder = "Ketik pertanyaan atau tugasmu di sini..."; 
        textCont.style.display = 'flex'; 
        btn.innerHTML = 'Tanya AI'; 
    } else if (platform === 'koros') { 
        title.innerHTML = "Koros Vision AI"; 
        fileCont.style.display = 'flex'; 
        document.getElementById('mediaFile').accept = "image/*";
        urlCont.style.display = 'flex';
        document.getElementById('mediaUrl').placeholder = "Ketik pertanyaan tentang gambar ini...";
        catboxHelper.innerHTML = `<i class="fas fa-info-circle"></i> Pilih foto lalu tanyakan sesuatu pada AI.`; 
        catboxHelper.style.display = 'block'; 
        btn.innerHTML = 'Tanya Koros'; 
    } else if (platform === 'ai-detector') { 
        title.innerHTML = "AI Text Detector"; 
        document.getElementById('textContent').placeholder = "Tempel artikel atau teks di sini..."; 
        textCont.style.display = 'flex'; 
        btn.innerHTML = 'Deteksi Teks Sekarang'; 
    } else if (platform === 'iqc') { 
        title.innerHTML = "iPhone Quoted"; 
        document.getElementById('textContent').placeholder = "Ketik atau tempel teks pesan di sini..."; 
        textCont.style.display = 'flex'; 
        timeInputsCont.style.display = 'flex'; 
        btn.innerHTML = 'Buat Kutipan iPhone'; 
    } else if (platform === 'nulis') { 
        title.innerHTML = "Nulis Otomatis"; 
        document.getElementById('textContent').placeholder = "Ketik atau tempel teks yang ingin ditulis tangan..."; 
        textCont.style.display = 'flex'; 
        btn.innerHTML = 'Mulai Nulis'; 
    } else if (['hd-foto', 'remove-bg', 'noise-reduce'].includes(platform)) { 
        if (platform === 'hd-foto') title.innerHTML = 'HD Foto Upscaler';
        else if (platform === 'remove-bg') title.innerHTML = 'Hapus Background';
        else title.innerHTML = 'Audio Noise Reduce';
        
        fileCont.style.display = 'flex'; 
        const mediaFileInput = document.getElementById('mediaFile');
        if (platform === 'noise-reduce') {
            mediaFileInput.accept = "audio/*";
        } else {
            mediaFileInput.accept = "image/*";
        }
        
        catboxHelper.innerHTML = `<i class="fas fa-info-circle"></i> Pilih file dari perangkat. (Maksimal 4MB)`; 
        catboxHelper.style.display = 'block'; 
        btn.innerHTML = 'Proses AI'; 
    } else if (platform === 'photo-editor') { 
        title.innerHTML = "Photo Editor AI"; 
        fileCont.style.display = 'flex'; 
        document.getElementById('mediaFile').accept = "image/*";
        urlCont.style.display = 'flex';
        document.getElementById('mediaUrl').placeholder = "Ketik perintah edit...";
        catboxHelper.innerHTML = `<i class="fas fa-info-circle"></i> Pilih foto, lalu ketik perintah. (Maksimal 4MB)`; 
        catboxHelper.style.display = 'block'; 
        btn.innerHTML = 'Edit Foto Sekarang'; 
    } else if (platform === 'roblox-stalk') { 
        title.innerHTML = "Roblox Stalk"; 
        document.getElementById('mediaUrl').placeholder = "Masukkan username Roblox..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Cari Player'; 
    } else if (platform === 'dc-stalk') { 
        title.innerHTML = "Discord Stalk"; 
        document.getElementById('mediaUrl').placeholder = "Masukkan ID Discord (angka)..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Cari User'; 
    } else if (platform === 'tt-stalk') { 
        title.innerHTML = "TikTok Stalk"; 
        document.getElementById('mediaUrl').placeholder = "Masukkan username TikTok..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Cari Akun'; 
    } else if (platform === 'tw-stalk') { 
        title.innerHTML = "Twitter Stalk"; 
        document.getElementById('mediaUrl').placeholder = "Masukkan username Twitter..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Cari Akun'; 
    } else if (platform === 'gh-stalk') { 
        title.innerHTML = "GitHub Stalk"; 
        document.getElementById('mediaUrl').placeholder = "Masukkan username GitHub..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Cari Developer'; 
    } else if (platform === 'ig-stalk') { 
        title.innerHTML = "Instagram Stalk"; 
        document.getElementById('mediaUrl').placeholder = "Masukkan username Instagram..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Cari Akun IG'; 
    } else if (platform === 'th-stalk') { 
        title.innerHTML = "Threads Stalk"; 
        document.getElementById('mediaUrl').placeholder = "Masukkan username Threads..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Cari Akun Threads'; 
    }

    const mediaUrlInput = document.getElementById('mediaUrl'); 
    if (mediaUrlInput) mediaUrlInput.value = '';
    
    const textContentInput = document.getElementById('textContent'); 
    if (textContentInput) textContentInput.value = '';
    
    const mediaFileInput = document.getElementById('mediaFile'); 
    if (mediaFileInput) mediaFileInput.value = '';
    
    const customAmountInput = document.getElementById('customAmount'); 
    if (customAmountInput) customAmountInput.value = '';
    
    const formGroup = document.querySelector('.form-group');
    const mainTitleEl = document.getElementById('mainTitle');
    
    if (formGroup && mainTitleEl) {
        formGroup.style.animation = 'none';
        mainTitleEl.style.animation = 'none';
        setTimeout(() => { 
            formGroup.style.animation = ''; 
            mainTitleEl.style.animation = ''; 
        }, 10);
    }

    if (typeof FITUR !== 'undefined' && btn && platform !== 'kontak') {
        if (FITUR[platform] === false) {
            btn.innerHTML = '<i class="fas fa-tools"></i> Sedang Maintenance';
            btn.disabled = true;
            btn.style.background = '#475569';
            btn.style.color = '#94a3b8';
            showToast("Maaf, fitur ini sedang dalam pemeliharaan.", "info");
        } else {
            btn.disabled = false;
            btn.style.background = '';
            btn.style.color = '';
        }
    }
    
    closeModal();
}

document.getElementById('mediaFile').addEventListener('change', function(event) {
    if (event.target.files && event.target.files[0]) {
        const file = event.target.files[0];
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                extractColorAndApply(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }
});

async function pasteToInput(elementId) { 
    try { 
        const text = await navigator.clipboard.readText(); 
        const inputElement = document.getElementById(elementId);
        if (inputElement) {
            inputElement.value = text; 
        }
    } catch (err) { 
        showToast('Gunakan Tahan Layar > Tempel secara manual.', 'info'); 
    } 
}

function copyTranscript() { 
    const textElement = document.getElementById('ytTranscriptText');
    if (!textElement) return;
    
    navigator.clipboard.writeText(textElement.innerText).then(() => { 
        const btn = document.getElementById('copyTranscriptBtn'); 
        if (btn) { 
            btn.innerHTML = 'Tersalin'; 
            setTimeout(() => { 
                btn.innerHTML = 'Salin Teks ke Clipboard'; 
            }, 2000); 
        }
    }); 
}

function copyLirik() { 
    const lirikElement = document.getElementById('lirikText');
    if (!lirikElement) return;
    
    navigator.clipboard.writeText(lirikElement.innerText).then(() => { 
        const btn = document.getElementById('copyLirikBtn'); 
        if (btn) { 
            btn.innerHTML = 'Tersalin'; 
            setTimeout(() => { 
                btn.innerHTML = 'Salin Lirik ke Clipboard'; 
            }, 2000); 
        }
    }); 
}

function copyShortlink() { 
    const shortlinkEl = document.getElementById('shortlinkText');
    if (!shortlinkEl) return;
    
    navigator.clipboard.writeText(shortlinkEl.value).then(() => { 
        const btn = document.getElementById('copyShortlinkBtn'); 
        if (btn) { 
            btn.innerHTML = '<i class="fas fa-check"></i> Tersalin'; 
            setTimeout(() => { 
                btn.innerHTML = '<i class="fas fa-copy"></i> Salin Link'; 
            }, 2000); 
        }
    }); 
}

function copyAiChat() { 
    const chatEl = document.getElementById('aiChatText');
    if (!chatEl) return;
    
    navigator.clipboard.writeText(chatEl.innerText).then(() => { 
        const btn = document.getElementById('copyAiChatBtn'); 
        if (btn) { 
            btn.innerHTML = '<i class="fas fa-check"></i> Tersalin'; 
            setTimeout(() => { 
                btn.innerHTML = '<i class="fas fa-copy"></i> Salin Jawaban'; 
            }, 2000); 
        }
    }); 
}

async function fetchLirik(url) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    const miniGame = document.getElementById('miniGame');
    
    if (loadingOverlay) loadingOverlay.style.display = 'block'; 
    if (miniGame) miniGame.style.display = 'none';
    if (loadingText) loadingText.innerText = "Mengambil lirik...";
    
    try {
        const payload = { action: 'lyric', params: { q: url } };
        const res = await fetch(API_BASE, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        });
        const json = await res.json();
        
        if (json.status === true) {
            const listContainer = document.getElementById('lirikList');
            if (listContainer) listContainer.style.display = 'none';
            
            const lirikTitleEl = document.getElementById('lirikTitle') || document.querySelector('#lirikResult h3');
            if (lirikTitleEl) lirikTitleEl.innerText = json.data.title || "Lirik Lagu";
            
            const lirikText = document.getElementById('lirikText');
            if (lirikText) lirikText.innerText = json.data.lyric || "Lirik tidak tersedia.";
            
            const lirikWrapper = document.getElementById('lirikContentWrapper');
            if (lirikWrapper) lirikWrapper.style.display = 'block';
        } else { 
            showToast("Gagal memuat lirik.", "error"); 
        }
    } catch (error) { 
        showToast("Gangguan jaringan.", "error"); 
    } finally { 
        if (loadingOverlay) loadingOverlay.style.display = 'none'; 
    }
}

function showToast(message, type = 'error') {
    const toast = document.getElementById("toast");
    const toastIcon = document.getElementById("toastIcon");
    const toastMessage = document.getElementById("toastMessage");

    if (!toast || !toastIcon || !toastMessage) return;

    toast.className = "toast"; 
    toastIcon.className = ""; 
    toast.classList.add(type);
    
    if (type === 'error') {
        toastIcon.className = 'fas fa-exclamation-circle';
    } else if (type === 'success') {
        toastIcon.className = 'fas fa-check-circle';
    } else if (type === 'info') {
        toastIcon.className = 'fas fa-info-circle';
    }

    toastMessage.innerText = message; 
    toast.classList.add("show");
    
    if (navigator.vibrate) {
        navigator.vibrate(type === 'error' ? [50, 50, 50] : 30);
    }

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(function(){ 
        toast.classList.remove("show"); 
    }, 3000);
}

function saveToHistory(title, link) {
    if (!link || typeof link !== 'string' || link.trim() === '') return;
    
    let finalLink = link;
    if (link.length > 1000 && !link.startsWith('http') && !link.startsWith('data:image')) {
        finalLink = 'data:image/png;base64,' + link;
    }

    const newItem = {
        id: Date.now(), 
        title: title, 
        link: finalLink,
        date: new Date().toLocaleString('id-ID', { 
            day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' 
        })
    };
    
    historyList.unshift(newItem);
    if (historyList.length > 10) {
        historyList.pop(); 
    }
    
    localStorage.setItem('moonlight_history', JSON.stringify(historyList));
    renderHistory();
}

function renderHistory() {
    const container = document.getElementById('historyListContainer');
    if (!container) return;

    if (historyList.length === 0) {
        container.innerHTML = `<div class="history-empty"><i class="fas fa-folder-open" style="font-size:32px; margin-bottom:12px; color:#475569;"></i><br>Belum ada riwayat unduhan.</div>`;
        return;
    }

    container.innerHTML = '';
    historyList.forEach(item => {
        container.innerHTML += `
            <div class="history-item">
                <div class="history-info">
                    <h4>${item.title}</h4>
                    <p>${item.date}</p>
                </div>
                <div class="history-actions">
                    <button onclick="forceDownload('${item.link}', 'Moonlight_History_${item.id}')">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            </div>`;
    });
}

function clearHistory() {
    if (confirm("Yakin ingin menghapus semua riwayat?")) {
        historyList = [];
        localStorage.removeItem('moonlight_history');
        renderHistory();
        showToast("Riwayat berhasil dibersihkan", "success");
    }
}

function openHistory() { 
    if (navigator.vibrate) navigator.vibrate(15);
    renderHistory(); 
    const modal = document.getElementById('historyModal');
    if (modal) modal.style.display = 'flex'; 
}

function closeHistory() { 
    const modal = document.getElementById('historyModal');
    if (modal) modal.style.display = 'none'; 
}

async function forceDownload(url, filename) {
    if (!url) return showToast("URL tidak valid", "error");
    if (navigator.vibrate) navigator.vibrate(20);

    const isBase64 = url.startsWith('data:image') || (url.length > 500 && !url.startsWith('http'));

    if (isBase64) {
        try {
            showToast("Memproses file...", "info");
            const res = await fetch('/api/proses', {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'upload-only', 
                    params: {}, 
                    fileData: { 
                        base64: url.startsWith('data:') ? url : 'data:image/png;base64,' + url, 
                        mimeType: 'image/png', 
                        fileName: filename || 'Moonlight.png' 
                    } 
                })
            });
            const json = await res.json();
            if (json.url) url = json.url;
        } catch(e) { }
    }

    showToast("Membuka untuk download...", "info");
    window.location.href = url;
}

function openPip(url) {
    const overlay = document.getElementById('pipOverlay');
    const video = document.getElementById('pipVideo');
    if (overlay && video) {
        video.src = url; 
        overlay.style.display = 'block'; 
        video.play();
    }
}

function closePip() {
    const video = document.getElementById('pipVideo');
    const overlay = document.getElementById('pipOverlay');
    if (video) video.pause();
    if (overlay) overlay.style.display = 'none';
}

function openCategory(catIndexOrCurrent, btnId) {
    if (navigator.vibrate) navigator.vibrate(15);
    
    document.querySelectorAll('.bnav-item').forEach(btn => { 
        btn.classList.remove('active'); 
    });
    
    if (btnId) {
        const targetBtn = document.getElementById(btnId);
        if (targetBtn) targetBtn.classList.add('active');
    }

    const modal = document.getElementById('featuresModal');
    if (modal) modal.style.display = 'flex';

    if (catIndexOrCurrent !== 'current') {
        goToCat(parseInt(catIndexOrCurrent));
    } else {
        updateCategoryUI();
    }
}

function closeModal() { 
    const modal = document.getElementById('featuresModal');
    if (modal) modal.style.display = 'none'; 
    
    document.querySelectorAll('.bnav-item').forEach(btn => { 
        btn.classList.remove('active'); 
    });
    
    const defaultBtn = document.getElementById('bnav-all');
    if (defaultBtn) defaultBtn.classList.add('active');
}

window.onclick = function (event) { 
    const featuresModal = document.getElementById('featuresModal');
    const historyModal = document.getElementById('historyModal');
    
    if (event.target == featuresModal) closeModal(); 
    if (event.target == historyModal) closeHistory(); 
};

function checkCooldown() {
    const lastAction = localStorage.getItem('lastMoonlightAction');
    if (lastAction) {
        const diff = Date.now() - parseInt(lastAction, 10);
        if (diff < COOLDOWN_TIME) {
            const remaining = Math.ceil((COOLDOWN_TIME - diff) / 1000);
            showToast(`Tunggu ${remaining} detik.`, 'info');
            return false;
        }
    }
    return true;
}

function setCooldown() { 
    localStorage.setItem('lastMoonlightAction', Date.now().toString()); 
}

function moonJump() {
    const player = document.getElementById('moonPlayer');
    if (player && !isJumping) {
        isJumping = true;
        player.classList.add('anim-jump');
        
        if (navigator.vibrate) navigator.vibrate(30);
        
        setTimeout(() => { 
            player.classList.remove('anim-jump'); 
            isJumping = false; 
        }, 500); 
    }
}

function startGameLoop() {
    const player = document.getElementById('moonPlayer');
    const obstacle = document.getElementById('meteorObstacle');
    const scoreEl = document.getElementById('gameScore');
    
    if (!player || !obstacle || !scoreEl) return;
    
    clearInterval(gameInterval); 
    clearInterval(scoreInterval);
    
    obstacle.style.animation = "none"; 
    void obstacle.offsetWidth; 
    
    gameScore = 0; 
    scoreEl.innerText = `Skor: 0`; 
    scoreEl.style.color = 'var(--primary)';
    
    obstacle.style.animation = `obstacleMove 1.2s infinite linear`;
    
    scoreInterval = setInterval(() => {
        gameScore += 10; 
        scoreEl.innerText = `Skor: ${gameScore}`;
    }, 100);

    gameInterval = setInterval(() => {
        const playerRect = player.getBoundingClientRect();
        const obstacleRect = obstacle.getBoundingClientRect();
        
        if (
            playerRect.left < obstacleRect.right && 
            playerRect.right > obstacleRect.left && 
            playerRect.top < obstacleRect.bottom && 
            playerRect.bottom > obstacleRect.top
        ) {
            obstacle.style.animation = "none"; 
            obstacle.style.left = (obstacleRect.left - playerRect.left + 30) + "px"; 
            
            clearInterval(gameInterval); 
            clearInterval(scoreInterval);
            
            scoreEl.innerText = `Skor Akhir: ${gameScore} | Memuat ulang...`; 
            scoreEl.style.color = '#ef4444';
            
            if (navigator.vibrate) navigator.vibrate([50,50,50]);
            
            setTimeout(() => {
                const overlay = document.getElementById('loadingOverlay');
                if (overlay && overlay.style.display === 'block') {
                    startGameLoop();
                }
            }, 1500);
        }
    }, 30);
}

function stopGameLoop() {
    clearInterval(gameInterval); 
    clearInterval(scoreInterval);
    const obstacle = document.getElementById('meteorObstacle');
    if (obstacle) {
        obstacle.style.animation = "none";
    }
}

async function processAction(isFromQueue = false) {
    if (navigator.vibrate) navigator.vibrate(20);
    
    if (typeof FITUR !== 'undefined' && FITUR[currentPlatform] === false) {
        return showToast("Fitur ini sedang dalam pemeliharaan.", "error");
    }

    const mainBtn = document.getElementById('mainBtn');
    
    let mediaUrlInput = document.getElementById('mediaUrl'); 
    let urlVal = mediaUrlInput ? mediaUrlInput.value.trim() : "";
    
    let textContentInput = document.getElementById('textContent'); 
    let textVal = textContentInput ? textContentInput.value.trim() : "";
    
    let phoneTime = ""; 
    let chatTime = ""; 
    let ytType = ""; 
    let ytQuality = ""; 
    let providerData = ""; 
    let amountData = "";
    
    if (['roblox-stalk', 'dc-stalk', 'tt-stalk', 'tw-stalk', 'gh-stalk', 'ig-stalk', 'th-stalk'].includes(currentPlatform)) {
        if (urlVal.startsWith('@')) {
            urlVal = urlVal.substring(1);
        }
    }

    if (['ai-detector', 'iqc', 'nulis', 'qr-gen', 'tts', 'ai-anime', 'blackbox', 'gpt4', 'claude', 'genimg', 'bard', 'gemini', 'ai-real', 'waifu', 'felo', 'perplexity'].includes(currentPlatform)) {
        if (!textVal) return showToast("Harap isi teks terlebih dahulu.", "error");
        
        if (currentPlatform === 'iqc') {
            phoneTime = document.getElementById('phoneTime').value; 
            chatTime = document.getElementById('chatTime').value;
            if (!phoneTime || !chatTime) return showToast("Atur waktu terlebih dahulu.", "error");
        }
    } else if (currentPlatform === 'pulsa' || currentPlatform === 'topup') {
        providerData = document.getElementById('pulsaProvider').value;
        if (currentPlatform === 'pulsa') { 
            amountData = document.getElementById('pulsaNominal').value; 
        } else { 
            amountData = document.getElementById('customAmount').value; 
            if (!amountData || parseInt(amountData, 10) < 10000) {
                return showToast("Masukkan nominal minimal Rp 10.000.", "error"); 
            }
        }
        if (!urlVal || urlVal.length < 9) {
            return showToast("Masukkan Nomor yang valid.", "error");
        }
    } else if (currentPlatform === 'youtube') {
        if (!urlVal) return showToast("Harap isi URL terlebih dahulu.", "error");
        const formatVal = document.getElementById('ytFormat').value.split('|'); 
        ytType = formatVal[0]; 
        ytQuality = formatVal[1];
    } else if (['hd-foto', 'remove-bg', 'noise-reduce', 'photo-editor', 'koros'].includes(currentPlatform)) {
        const fileInput = document.getElementById('mediaFile');
        if (!fileInput || fileInput.files.length === 0) {
            return showToast("Harap pilih file terlebih dahulu.", "error");
        }
        if (fileInput.files[0].size > 4 * 1024 * 1024) {
            return showToast("Maksimal ukuran file adalah 4MB.", "error");
        }
        if (currentPlatform === 'photo-editor' && !urlVal) {
            return showToast("Harap ketik perintah edit.", "error");
        }
        if (currentPlatform === 'koros' && !urlVal) {
            return showToast("Harap ketik pertanyaan untuk gambar ini.", "error");
        }
    } else if (currentPlatform === 'shortlink' && !urlVal) { 
        return showToast("Harap masukkan URL tautan.", "error");
    } else if (currentPlatform === 'lirik' && !urlVal) { 
        return showToast("Harap masukkan judul lagu.", "error");
    } else if (!['hd-foto', 'remove-bg', 'noise-reduce'].includes(currentPlatform) && !urlVal && !textVal) {
        return showToast("Harap isi kolom terlebih dahulu.", "error");
    }

    if (!navigator.onLine && currentPlatform !== 'kontak') {
        offlineQueue.push({ platform: currentPlatform, url: urlVal, text: textVal });
        localStorage.setItem('moonlight_queue', JSON.stringify(offlineQueue));
        showToast("Disimpan ke antrean offline", "info"); 
        return;
    }

    if (!isFromQueue) { 
        if (!checkCooldown()) return; 
        setCooldown(); 
    }

    if (mainBtn) { 
        mainBtn.disabled = true; 
        mainBtn.innerHTML = "Memproses..."; 
    }
    
    const loadingOverlay = document.getElementById('loadingOverlay'); 
    if (loadingOverlay) loadingOverlay.style.display = 'block'; 
    
    const resultCard = document.getElementById('resultCard'); 
    if (resultCard) resultCard.style.display = 'none'; 
    
    document.querySelectorAll('#resultCard > div').forEach(el => { 
        el.style.display = 'none'; 
    });

    const aiTools = ['hd-foto', 'remove-bg', 'noise-reduce', 'photo-editor', 'ai-anime', 'blackbox', 'gpt4', 'claude', 'genimg', 'bard', 'gemini', 'ai-real', 'waifu', 'felo', 'perplexity', 'koros'];
    const miniGame = document.getElementById('miniGame'); 
    const loadingText = document.getElementById('loadingText');
    
    if (aiTools.includes(currentPlatform)) {
        if (miniGame) miniGame.style.display = 'block';
        if (loadingText) loadingText.innerHTML = `Memproses AI, silakan main bentar...`; 
        startGameLoop();
    } else {
        if (miniGame) miniGame.style.display = 'none';
        if (loadingText) loadingText.innerText = "Memproses permintaan...";
    }

    if (['qr-gen', 'shortlink', 'tts'].includes(currentPlatform)) {
        setTimeout(async () => {
            const mainResultCard = document.getElementById('resultCard');
            if (mainResultCard) mainResultCard.style.display = 'block';

            if (currentPlatform === 'qr-gen') {
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(textVal)}`;
                document.getElementById('qrResult').style.display = 'block';
                document.getElementById('qrImage').src = qrUrl;
                document.getElementById('qrActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${qrUrl}', 'Moonlight_QRCode.png')"><i class="fas fa-download"></i> Simpan QR Code</button>`;
                saveToHistory(`QR Code`, qrUrl); 
                showToast("Berhasil membuat QR Code!", "success");
            } 
            else if (currentPlatform === 'shortlink') {
                try {
                    const res = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(urlVal)}`);
                    const json = await res.json();
                    if (json.shorturl) {
                        document.getElementById('shortlinkResult').style.display = 'block';
                        document.getElementById('shortlinkText').value = json.shorturl;
                        saveToHistory(`Shortlink`, json.shorturl); 
                        showToast("Tautan berhasil dipendekkan!", "success");
                    } else {
                        throw new Error("Invalid");
                    }
                } catch(e) {
                    if (mainResultCard) mainResultCard.style.display = 'none';
                    showToast("Gagal memendekkan tautan. Pastikan format URL benar.", "error");
                }
            }
            else if (currentPlatform === 'tts') {
                const safeText = textVal.substring(0, 200);
                const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=id&client=tw-ob&q=${encodeURIComponent(safeText)}`;
                document.getElementById('ttsResult').style.display = 'block';
                document.getElementById('ttsPlayer').src = ttsUrl;
                document.getElementById('ttsActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${ttsUrl}', 'Moonlight_Voice.mp3')"><i class="fas fa-download"></i> Simpan Suara</button>`;
                saveToHistory(`Suara TTS`, ttsUrl); 
                showToast("Berhasil memproses suara!", "success");
            }
            
            if (loadingOverlay) loadingOverlay.style.display = 'none';
            if (mainBtn) {
                mainBtn.disabled = false;
                mainBtn.innerHTML = currentPlatform === 'qr-gen' ? 'Generate QR Code' : currentPlatform === 'shortlink' ? 'Pendekkan Tautan' : 'Ubah ke Suara';
            }
        }, 1000);
        return; 
    }

    try {
        let finalInputData = urlVal || textVal; 
        let fileBase64Obj = null;

        if (['hd-foto', 'remove-bg', 'noise-reduce', 'photo-editor', 'koros'].includes(currentPlatform)) {
            const file = document.getElementById('mediaFile').files[0];
            const base64String = await new Promise((resolve, reject) => { 
                const reader = new FileReader(); 
                reader.onload = () => resolve(reader.result); 
                reader.onerror = () => reject(new Error("Gagal membaca file")); 
                reader.readAsDataURL(file); 
            });
            fileBase64Obj = { 
                base64: base64String, 
                fileName: file.name, 
                mimeType: file.type 
            };
            finalInputData = urlVal; 
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
        else if (currentPlatform === 'ai-anime') { action = 'ai-anime'; params = { q: finalInputData }; }
        else if (currentPlatform === 'blackbox') { action = 'blackbox'; params = { q: finalInputData }; }
        else if (currentPlatform === 'gpt4') { action = 'gpt4'; params = { q: finalInputData }; }
        else if (currentPlatform === 'claude') { action = 'claude'; params = { q: finalInputData }; }
        else if (currentPlatform === 'genimg') { action = 'genimg'; params = { prompt: finalInputData }; }
        else if (currentPlatform === 'bard') { action = 'bard'; params = { q: finalInputData }; }
        else if (currentPlatform === 'gemini') { action = 'gemini-chat'; params = { q: finalInputData }; }
        else if (currentPlatform === 'ai-real') { action = 'ai-real'; params = { q: finalInputData }; }
        else if (currentPlatform === 'waifu') { action = 'waifudiff'; params = { q: finalInputData }; }
        else if (currentPlatform === 'felo') { action = 'felo'; params = { q: finalInputData }; }
        else if (currentPlatform === 'perplexity') { action = 'perplexity'; params = { q: finalInputData }; }
        else if (currentPlatform === 'koros') { action = 'koros'; params = { image: "", q: finalInputData }; }

        const payload = { action: action, params: params };
        if (fileBase64Obj) {
            payload.fileData = fileBase64Obj;
        }

        const response = await fetch(API_BASE, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        });
        
        const json = await response.json();

        if (json.status === true) {
            showToast("Sukses!", "success");
            const data = json.data || json;
            const mainResultCard = document.getElementById('resultCard');
            if (mainResultCard) mainResultCard.style.display = 'block';

            if (['ai-anime', 'genimg', 'ai-real', 'waifu'].includes(currentPlatform)) {
                document.getElementById('aiImageResult').style.display = 'block';
                let imgSrc = data.url;
                if (imgSrc && imgSrc.length > 1000 && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:image')) {
                    imgSrc = 'data:image/png;base64,' + imgSrc;
                }
                document.getElementById('aiGeneratedImage').src = imgSrc;
                document.getElementById('aiImageActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${imgSrc}', 'Moonlight_AIGen.jpg')"><i class="fas fa-download"></i> Simpan Gambar</button>`;
                saveToHistory(`${currentPlatform.toUpperCase()} Image`, imgSrc);
                extractColorAndApply(imgSrc);
            }
            else if (['blackbox', 'gpt4', 'claude', 'bard', 'gemini', 'felo', 'perplexity', 'koros'].includes(currentPlatform)) {
                document.getElementById('aiChatResult').style.display = 'block';
                // Koros menggunakan format data.result, yang lain menggunakan data.message
                let chatResponse = data.message || data.result || "Tidak ada respon dari AI.";
                
                chatResponse = chatResponse.replace(/\*\*/g, '');
                
                document.getElementById('aiChatText').innerText = chatResponse;
                saveToHistory(`Chat ${currentPlatform.toUpperCase()}`, "Teks Percakapan AI");
            }
            else if (currentPlatform === 'pulsa' || currentPlatform === 'topup') {
                document.getElementById('invoiceResult').style.display = 'block';
                document.getElementById('invoiceId').innerText = `Order ID: ${data.code}`;
                document.getElementById('invService').innerText = `${data.product.service} - ${data.product.type}`;
                document.getElementById('invNumber').innerText = data.number;
                document.getElementById('invExpired').innerText = data.expired_at;
                document.getElementById('invPrice').innerText = data.price_format;
                
                let qrData = data.qr_image; 
                if (!qrData.startsWith('data:image')) {
                    qrData = `data:image/png;base64,${qrData}`;
                }
                document.getElementById('invQrImage').src = qrData;
            }
            else if (['roblox-stalk', 'dc-stalk', 'tt-stalk', 'tw-stalk', 'gh-stalk', 'ig-stalk', 'th-stalk'].includes(currentPlatform)) {
                document.getElementById('stalkResult').style.display = 'block';
                const avatarImg = document.getElementById('stalkAvatar'); 
                const nameEl = document.getElementById('stalkName'); 
                const userEl = document.getElementById('stalkUsername'); 
                const bioEl = document.getElementById('stalkBio'); 
                const gridEl = document.getElementById('stalkStatsGrid'); 
                const extraEl = document.getElementById('stalkExtra'); 
                
                gridEl.innerHTML = ''; 
                extraEl.innerHTML = ''; 
                if (bioEl) bioEl.innerText = ''; 
                
                const profilePic = data.photo || data.avatar || data.avatar_url || data.profile_pic_url || (data.hd_profile_pic_versions && data.hd_profile_pic_versions[0].url) || 'https://i.ibb.co/30Z1W4z/user.png';
                avatarImg.src = profilePic; 
                extractColorAndApply(profilePic);
                
                nameEl.innerText = data.name || data.displayName || data.full_name || data.global_name || data.login || 'User Ditemukan';
                
                let unameStr = data.username || data.login || finalInputData;
                if (!unameStr.toString().startsWith('@') && currentPlatform !== 'dc-stalk') {
                    unameStr = '@' + unameStr;
                }
                userEl.innerText = unameStr;
                
                if (bioEl && (data.about || data.bio || data.biography || data.description)) {
                    bioEl.innerText = data.about || data.bio || data.biography || data.description;
                }

                let gridHtml = ''; 
                let flw = data.follower ?? data.followers ?? data.follower_count;
                if (flw !== undefined) {
                    gridHtml += `<div class="ai-stat-box"><h4>${typeof flw === 'number' ? flw.toLocaleString() : flw}</h4><p>Followers</p></div>`;
                }
                
                let flwi = data.following ?? data.followings;
                if (flwi !== undefined) {
                    gridHtml += `<div class="ai-stat-box"><h4>${typeof flwi === 'number' ? flwi.toLocaleString() : flwi}</h4><p>Following</p></div>`;
                }
                
                if (currentPlatform === 'roblox-stalk' && data.friends !== undefined) {
                    gridHtml += `<div class="ai-stat-box"><h4>${data.friends.toLocaleString()}</h4><p>Teman</p></div>`;
                } else if (currentPlatform === 'gh-stalk' && data.public_repos !== undefined) {
                    gridHtml += `<div class="ai-stat-box"><h4>${data.public_repos}</h4><p>Repositori</p></div>`;
                } else if (currentPlatform === 'ig-stalk' && data.post !== undefined) {
                    gridHtml += `<div class="ai-stat-box"><h4>${data.post.toLocaleString()}</h4><p>Posts</p></div>`;
                } else if (currentPlatform === 'tt-stalk' && data.likes !== undefined) {
                    gridHtml += `<div class="ai-stat-box"><h4>${data.likes.toLocaleString()}</h4><p>Likes</p></div>`;
                } else if (currentPlatform === 'tw-stalk' && data.tweets !== undefined) {
                    gridHtml += `<div class="ai-stat-box"><h4>${data.tweets}</h4><p>Tweets</p></div>`;
                } else if (currentPlatform === 'dc-stalk') {
                    gridHtml = `<div class="ai-stat-box" style="grid-column: span 2;"><h4>${data.id}</h4><p>Discord ID</p></div>`;
                }
                
                gridEl.innerHTML = gridHtml || `<div class="ai-stat-box" style="grid-column: span 2;"><h4>-</h4><p>Tidak ada data statistik</p></div>`;

                let extraHtml = '';
                if (data.id && currentPlatform !== 'dc-stalk') extraHtml += `<strong>ID:</strong> ${data.id}<br>`;
                if (data.pk) extraHtml += `<strong>ID:</strong> ${data.pk}<br>`;
                if (data.type) extraHtml += `<strong>Tipe:</strong> ${data.type}<br>`;
                if (data.verified !== undefined || data.is_verified !== undefined) {
                    extraHtml += `<strong>Terverifikasi:</strong> ${(data.verified ?? data.is_verified) ? 'Ya ✅' : 'Tidak ❌'}<br>`;
                }
                if (data.private !== undefined) {
                    extraHtml += `<strong>Private Akun:</strong> ${data.private ? 'Ya 🔒' : 'Tidak 🔓'}<br>`;
                }
                if (data.isBanned !== undefined) {
                    extraHtml += `<strong>Banned:</strong> ${data.isBanned ? 'Ya 🚨' : 'Tidak'}<br>`;
                }
                if (data.joined) {
                    extraHtml += `<strong>${data.joined}</strong><br>`;
                } else if (data.created_at || data.created_utc) {
                    extraHtml += `<strong>Dibuat Pada:</strong> ${new Date(data.created_at || data.created_utc).toLocaleString('id-ID')}<br>`;
                }

                extraEl.innerHTML = extraHtml;
            }
            else if (currentPlatform === 'lirik') {
                document.getElementById('lirikResult').style.display = 'block'; 
                const listContainer = document.getElementById('lirikList'); 
                const lirikTitleEl = document.getElementById('lirikTitle') || document.querySelector('#lirikResult h3');
                
                if (lirikTitleEl) lirikTitleEl.innerText = "Pilih Versi Lagu:"; 
                
                listContainer.style.display = 'flex'; 
                document.getElementById('lirikContentWrapper').style.display = 'none'; 
                listContainer.innerHTML = '';
                
                if (Array.isArray(data)) {
                    data.forEach(item => { 
                        const safeUrl = item.url ? item.url.replace(/'/g, "\\'") : '';
                        listContainer.innerHTML += `<button class="btn-secondary" onclick="fetchLirik('${safeUrl}')"><i class="fas fa-music"></i> ${item.title}</button>`; 
                    });
                } else if (data && data.lyric) {
                    if (lirikTitleEl) lirikTitleEl.innerText = data.title || "Hasil Lirik";
                    listContainer.style.display = 'none';
                    document.getElementById('lirikText').innerText = data.lyric;
                    document.getElementById('lirikContentWrapper').style.display = 'block';
                }
            }
            else if (currentPlatform === 'photo-editor') {
                document.getElementById('photoEditorResult').style.display = 'block'; 
                const infoEl = document.getElementById('photoEditorInfo'); 
                if (infoEl) infoEl.innerText = `Ukuran: ${data.size || 'HD'}`; 
                
                let imgSrc = data.url; 
                if (imgSrc && imgSrc.length > 1000 && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:image')) {
                    imgSrc = 'data:image/png;base64,' + imgSrc;
                }
                _imgStore['photoEditor'] = imgSrc; 
                document.getElementById('photoEditorImage').src = imgSrc; 
                document.getElementById('photoEditorActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload(_imgStore['photoEditor'], 'Moonlight_EditAI.png')"><i class="fas fa-download"></i> Simpan Gambar</button>`;
                saveToHistory(`Edit AI`, imgSrc); 
                extractColorAndApply(imgSrc);
            }
            else if (currentPlatform === 'hd-foto') {
                document.getElementById('hdFotoResult').style.display = 'block'; 
                const infoEl = document.getElementById('hdFotoInfo'); 
                if (infoEl) infoEl.innerText = `Ukuran: ${data.size || 'HD'}`; 
                
                let imgSrc = data.url; 
                if (imgSrc && imgSrc.length > 1000 && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:image')) {
                    imgSrc = 'data:image/png;base64,' + imgSrc;
                }
                _imgStore['hdFoto'] = imgSrc; 
                document.getElementById('hdImageResult').src = imgSrc; 
                document.getElementById('hdActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload(_imgStore['hdFoto'], 'Moonlight_HDFoto.png')"><i class="fas fa-download"></i> Simpan Gambar HD</button>`;
                saveToHistory(`HD Foto`, imgSrc); 
                extractColorAndApply(imgSrc);
            }
            else if (currentPlatform === 'remove-bg') {
                document.getElementById('removeBgResult').style.display = 'block'; 
                let imgSrc = data.no_background || data.url || data.image; 
                if (imgSrc && imgSrc.length > 1000 && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:image')) {
                    imgSrc = 'data:image/png;base64,' + imgSrc;
                }
                _imgStore['removeBg'] = imgSrc; 
                document.getElementById('removeBgImage').src = imgSrc; 
                document.getElementById('removeBgActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload(_imgStore['removeBg'], 'Moonlight_NoBG.png')"><i class="fas fa-download"></i> Simpan Transparan</button>`;
                saveToHistory(`Hapus BG`, imgSrc); 
                extractColorAndApply(imgSrc);
            }
            else if (currentPlatform === 'noise-reduce') {
                document.getElementById('audioResult').style.display = 'block'; 
                let audioUrl = data.url; 
                document.getElementById('audioPlayer').src = audioUrl; 
                document.getElementById('audioActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${audioUrl}', 'Moonlight_CleanAudio.mp3')"><i class="fas fa-download"></i> Simpan Audio</button>`;
                saveToHistory(`Bersihkan Audio`, audioUrl);
            }
            else if (currentPlatform === 'ss-web') {
                document.getElementById('ssWebResult').style.display = 'block'; 
                let imgSrc = data.url; 
                if (imgSrc && imgSrc.length > 1000 && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:image')) {
                    imgSrc = 'data:image/png;base64,' + imgSrc;
                }
                document.getElementById('ssWebImage').src = imgSrc; 
                document.getElementById('ssWebActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${imgSrc}', 'Moonlight_Screenshot.png')"><i class="fas fa-download"></i> Simpan Screenshot</button>`;
                extractColorAndApply(imgSrc);
            }
            else if (currentPlatform === 'iqc') {
                document.getElementById('iqcResult').style.display = 'block'; 
                let imgSrc = data.url; 
                if (imgSrc && imgSrc.length > 1000 && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:image')) {
                    imgSrc = 'data:image/png;base64,' + imgSrc;
                }
                document.getElementById('iqcImage').src = imgSrc; 
                document.getElementById('iqcActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${imgSrc}', 'Moonlight_Kutipan.png')"><i class="fas fa-download"></i> Simpan Kutipan</button>`;
                extractColorAndApply(imgSrc);
            }
            else if (currentPlatform === 'nulis') {
                document.getElementById('nulisResult').style.display = 'block'; 
                let imgSrc = data.url; 
                if (imgSrc && imgSrc.length > 1000 && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:image')) {
                    imgSrc = 'data:image/png;base64,' + imgSrc;
                }
                document.getElementById('nulisImage').src = imgSrc; 
                document.getElementById('nulisActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${imgSrc}', 'Moonlight_Nulis.png')"><i class="fas fa-download"></i> Simpan Buku</button>`;
                extractColorAndApply(imgSrc);
            }
            else if (currentPlatform === 'ai-detector') {
                document.getElementById('aiResult').style.display = 'block'; 
                const badge = document.getElementById('aiFeedbackBadge'); 
                badge.innerText = data.feedback || "Selesai Dianalisis"; 
                badge.className = "ai-feedback-badge"; 
                
                if (data.isHuman > 70) {
                    badge.classList.add("ai-human"); 
                } else if (data.fakePercentage > 50) {
                    badge.classList.add("ai-fake"); 
                } else {
                    badge.classList.add("ai-mixed"); 
                }
                
                document.getElementById('aiScoreHuman').innerText = `${data.isHuman}%`; 
                document.getElementById('aiScoreFake').innerText = `${data.fakePercentage}%`; 
                
                setTimeout(() => { 
                    document.getElementById('barHuman').style.width = `${data.isHuman}%`; 
                    document.getElementById('barFake').style.width = `${data.fakePercentage}%`; 
                }, 100);
            }
            else if (currentPlatform === 'yt-transcript') {
                document.getElementById('ytTranscriptResult').style.display = 'block'; 
                document.getElementById('ytTranscriptText').innerText = data.text || "Tidak ada transcript.";
            }
            else {
                document.getElementById('downloaderResult').style.display = 'block'; 
                const profileSec = document.getElementById('profileSection'); 
                const captionText = document.getElementById('videoCaption'); 
                const thumbCon = document.getElementById('thumbnailContainer'); 
                const thumbImg = document.getElementById('videoThumbnail'); 
                const thumbFallback = document.getElementById('thumbnailFallback'); 
                const actionBtns = document.getElementById('actionBtns'); 
                
                actionBtns.innerHTML = '';

                if (currentPlatform === 'facebook') { 
                    profileSec.style.display = 'none'; 
                    captionText.style.display = 'none'; 
                    thumbCon.style.display = 'none'; 
                    data.forEach((item) => { 
                        actionBtns.innerHTML += `<button class="btn-primary" onclick="forceDownload('${item.url}', 'FB.mp4')"><i class="fas fa-video"></i> Download Video (${item.quality})</button>`; 
                    }); 
                } else if (currentPlatform === 'twitter') { 
                    profileSec.style.display = 'none'; 
                    captionText.style.display = 'none'; 
                    thumbCon.style.display = 'none'; 
                    data.forEach((item, i) => { 
                        let typeText = item.type === "mp4" ? "Video" : "Gambar"; 
                        let icon = item.type === "mp4" ? "fa-video" : "fa-image"; 
                        actionBtns.innerHTML += `<button class="btn-primary" onclick="forceDownload('${item.url}', 'X_${i}.mp4')"><i class="fas ${icon}"></i> Download ${typeText} ${i + 1}</button>`; 
                    }); 
                } else if (currentPlatform === 'terabox') { 
                    profileSec.style.display = 'none'; 
                    captionText.style.display = 'block'; 
                    captionText.innerHTML = `<strong>File:</strong> ${data[0].server_filename}<br><strong>Size:</strong> ${data[0].size}`; 
                    thumbCon.style.display = 'none'; 
                    actionBtns.innerHTML = `<button class="btn-primary" onclick="forceDownload('${data[0].dlink}', '${data[0].server_filename}')"><i class="fas fa-download"></i> Download File</button>`; 
                } else if (currentPlatform === 'youtube') { 
                    profileSec.style.display = 'none'; 
                    captionText.style.display = 'block'; 
                    captionText.innerHTML = `<strong>Judul:</strong> ${json.title}<br><strong>Channel:</strong> ${json.channel}<br><strong>Kualitas:</strong> ${data.quality}`; 
                    thumbCon.style.display = 'flex'; 
                    thumbImg.src = json.thumbnail; 
                    
                    thumbImg.onload = () => { 
                        thumbImg.style.display = "block"; 
                        thumbFallback.style.display = "none"; 
                    }; 
                    
                    let vidHtml = `<button class="btn-primary" onclick="forceDownload('${data.url}', 'YT.${data.extension}')"><i class="fas fa-download"></i> Download ${data.extension.toUpperCase()}</button>`;
                    if (data.extension === 'mp4') {
                        vidHtml = `<button class="btn-secondary" onclick="openPip('${data.url}')"><i class="fas fa-play"></i> Pratinjau PiP</button>` + vidHtml;
                    }
                    actionBtns.innerHTML = vidHtml; 
                    saveToHistory(`YouTube: ${json.title}`, data.url); 
                    extractColorAndApply(json.thumbnail);
                } else if (currentPlatform === 'spotify') { 
                    profileSec.style.display = 'none'; 
                    captionText.style.display = 'block'; 
                    captionText.innerHTML = `<strong>Judul:</strong> ${data.title}<br><strong>Artis:</strong> ${data.artist.name}`; 
                    thumbCon.style.display = 'flex'; 
                    thumbImg.src = data.thumbnail; 
                    
                    thumbImg.onload = () => { 
                        thumbImg.style.display = "block"; 
                        thumbFallback.style.display = "none"; 
                    }; 
                    
                    actionBtns.innerHTML = `<button class="btn-primary" onclick="forceDownload('${data.url}', 'Spotify.mp3')"><i class="fas fa-music"></i> Download MP3</button>`; 
                    saveToHistory(`Spotify: ${data.title}`, data.url); 
                    extractColorAndApply(data.thumbnail);
                } else if (currentPlatform === 'tiktok') { 
                    profileSec.style.display = 'none'; 
                    captionText.style.display = 'none'; 
                    
                    if (data.photo && data.photo.length > 0) { 
                        thumbCon.style.display = 'flex'; 
                        thumbImg.src = data.photo[0]; 
                        thumbImg.style.display = "block"; 
                        thumbFallback.style.display = "none"; 
                        
                        data.photo.forEach((img, i) => { 
                            actionBtns.innerHTML += `<button class="btn-primary" onclick="forceDownload('${img}', 'TikTok_${i}.jpg')"><i class="fas fa-image"></i> Download Foto ${i+1}</button>`; 
                        }); 
                        if (data.audio) {
                            actionBtns.innerHTML += `<button class="btn-secondary" onclick="forceDownload('${data.audio}', 'TikTokAudio.mp3')"><i class="fas fa-music"></i> Download Audio</button>`; 
                        }
                        saveToHistory(`TikTok Slide (Foto)`, data.photo[0]); 
                        extractColorAndApply(data.photo[0]);
                    } else { 
                        thumbCon.style.display = 'none'; 
                        if (data.video) { 
                            actionBtns.innerHTML += `<button class="btn-secondary" onclick="openPip('${data.video}')"><i class="fas fa-play"></i> Pratinjau PiP</button>`; 
                            actionBtns.innerHTML += `<button class="btn-primary" onclick="forceDownload('${data.video}', 'TikTok.mp4')"><i class="fas fa-video"></i> Download Video</button>`; 
                        } 
                        if (data.videoHD) {
                            actionBtns.innerHTML += `<button class="btn-primary" onclick="forceDownload('${data.videoHD}', 'TikTokHD.mp4')"><i class="fas fa-video"></i> Download Video HD</button>`; 
                        }
                        if (data.audio) {
                            actionBtns.innerHTML += `<button class="btn-secondary" onclick="forceDownload('${data.audio}', 'TikTokAudio.mp3')"><i class="fas fa-music"></i> Download Audio</button>`; 
                        }
                        if (data.video || data.videoHD) {
                            saveToHistory(`Video TikTok`, data.video || data.videoHD); 
                        }
                    } 
                } else if (currentPlatform === 'ig') { 
                    profileSec.style.display = 'none'; 
                    captionText.style.display = 'none'; 
                    thumbCon.style.display = 'none'; 
                    
                    data.forEach((item, i) => { 
                        if (item.type === 'mp4') {
                            actionBtns.innerHTML += `<button class="btn-secondary" onclick="openPip('${item.url}')"><i class="fas fa-play"></i> Pratinjau PiP ${i+1}</button>`;
                        }
                        actionBtns.innerHTML += `<button class="btn-primary" onclick="forceDownload('${item.url}', 'IG_${i}.mp4')"><i class="fas fa-download"></i> Download File ${i+1}</button>`; 
                    }); 
                    if (data.length > 0) {
                        saveToHistory(`Media Instagram`, data[0].url); 
                    }
                } else if (currentPlatform === 'pin') { 
                    profileSec.style.display = 'none'; 
                    captionText.style.display = 'none'; 
                    thumbCon.style.display = 'none'; 
                    
                    actionBtns.innerHTML = `<button class="btn-primary" onclick="forceDownload('${data.url}', 'Pinterest.jpg')"><i class="fas fa-download"></i> Download Media</button>`; 
                    saveToHistory(`Pinterest Media`, data.url); 
                }
            }
        } else {
            showToast(json.message || json.msg || "Gagal memproses data dari server.", "error");
        }
    } catch (error) {
        console.error(error); 
        showToast("Terjadi kesalahan sistem atau koneksi.", "error");
    } finally {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        
        stopGameLoop(); 
        
        if (mainBtn && (typeof FITUR === 'undefined' || FITUR[currentPlatform] !== false)) {
            mainBtn.disabled = false;
            
            if (currentPlatform === 'pulsa' || currentPlatform === 'topup') {
                mainBtn.innerHTML = "Buat Tagihan Pembayaran";
            } else if (currentPlatform === 'ss-web') {
                mainBtn.innerHTML = "Ambil Screenshot";
            } else if (currentPlatform === 'yt-transcript') {
                mainBtn.innerHTML = "Ekstrak Teks Sekarang";
            } else if (currentPlatform === 'ai-detector') {
                mainBtn.innerHTML = "Deteksi Teks Sekarang";
            } else if (currentPlatform === 'iqc') {
                mainBtn.innerHTML = "Buat Kutipan iPhone";
            } else if (currentPlatform === 'nulis') {
                mainBtn.innerHTML = "Mulai Nulis";
            } else if (['hd-foto', 'ai-anime', 'genimg', 'ai-real', 'waifu'].includes(currentPlatform)) {
                mainBtn.innerHTML = "Generate Gambar";
            } else if (currentPlatform === 'remove-bg') {
                mainBtn.innerHTML = "Hapus Background Gambar";
            } else if (currentPlatform === 'noise-reduce') {
                mainBtn.innerHTML = "Bersihkan Suara Audio";
            } else if (currentPlatform === 'photo-editor') {
                mainBtn.innerHTML = "Edit Foto Sekarang";
            } else if (currentPlatform === 'lirik') {
                mainBtn.innerHTML = "Cari Lirik Sekarang";
            } else if (currentPlatform === 'terabox') {
                mainBtn.innerHTML = "Buka File TeraBox";
            } else if (['roblox-stalk', 'dc-stalk', 'tt-stalk', 'tw-stalk', 'gh-stalk', 'ig-stalk', 'th-stalk'].includes(currentPlatform)) {
                mainBtn.innerHTML = "Cari Sekarang";
            } else if (currentPlatform === 'qr-gen') {
                mainBtn.innerHTML = "Generate QR Code";
            } else if (currentPlatform === 'shortlink') {
                mainBtn.innerHTML = "Pendekkan Tautan";
            } else if (['tts', 'gpt4', 'claude', 'bard', 'gemini', 'blackbox', 'felo', 'perplexity', 'koros'].includes(currentPlatform)) {
                mainBtn.innerHTML = "Tanya AI";
            } else {
                mainBtn.innerHTML = "Download Sekarang";
            }
        }
    }
}

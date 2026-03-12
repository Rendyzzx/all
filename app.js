const API_BASE = "/api/proses";

let currentPlatform = 'tiktok';
const COOLDOWN_TIME = 15000;
let toastTimeout; 
let historyList = JSON.parse(localStorage.getItem('moonlight_history')) || [];
let offlineQueue = JSON.parse(localStorage.getItem('moonlight_queue')) || [];

let gameInterval;
let scoreInterval;
let gameScore = 0;
let isJumping = false;

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
    
    const aiTools = [
        'hd-foto', 
        'remove-bg', 
        'noise-reduce', 
        'photo-editor', 
        'ai-detector'
    ];
    
    if (['youtube', 'yt-transcript', 'pin'].includes(platform)) { 
        primary = '#ef4444'; 
        hover = '#dc2626'; 
    } else if (['tiktok', 'tt-stalk'].includes(platform)) { 
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
    } else if (['spotify', 'lirik'].includes(platform)) { 
        primary = '#1db954'; 
        hover = '#1aa34a'; 
    } else if (platform === 'terabox') { 
        primary = '#eab308'; 
        hover = '#ca8a04'; 
    } else if (aiTools.includes(platform)) { 
        primary = '#8b5cf6'; 
        hover = '#7c3aed'; 
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
        urlCont, 
        textCont, 
        fileCont, 
        nominalCont, 
        customAmountCont, 
        providerCont, 
        ytFormatCont, 
        timeInputsCont, 
        catboxHelper, 
        contactCont
    ];
    
    allContainers.forEach(el => {
        if (el) el.style.display = 'none';
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
        document.getElementById('mediaUrl').placeholder = "Masukkan username TikTok (tanpa @)..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Cari Akun'; 
    } else if (platform === 'tw-stalk') { 
        title.innerHTML = "Twitter Stalk"; 
        document.getElementById('mediaUrl').placeholder = "Masukkan username Twitter (tanpa @)..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Cari Akun'; 
    } else if (platform === 'gh-stalk') { 
        title.innerHTML = "GitHub Stalk"; 
        document.getElementById('mediaUrl').placeholder = "Masukkan username GitHub..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Cari Developer'; 
    } else if (platform === 'ig-stalk') { 
        title.innerHTML = "Instagram Stalk"; 
        document.getElementById('mediaUrl').placeholder = "Masukkan username Instagram (tanpa @)..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Cari Akun IG'; 
    } else if (platform === 'th-stalk') { 
        title.innerHTML = "Threads Stalk"; 
        document.getElementById('mediaUrl').placeholder = "Masukkan username Threads (tanpa @)..."; 
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
    
    const textToCopy = textElement.innerText; 
    navigator.clipboard.writeText(textToCopy).then(() => { 
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
    
    const textToCopy = lirikElement.innerText; 
    navigator.clipboard.writeText(textToCopy).then(() => { 
        const btn = document.getElementById('copyLirikBtn'); 
        if (btn) {
            btn.innerHTML = 'Tersalin'; 
            setTimeout(() => { 
                btn.innerHTML = 'Salin Lirik ke Clipboard'; 
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
        const payload = {
            action: 'lyric', 
            params: { q: url }
        };
        
        const res = await fetch(API_BASE, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        });
        
        const json = await res.json();
        
        if (json.status === true) {
            const listContainer = document.getElementById('lirikList');
            if (listContainer) listContainer.style.display = 'none';
            
            const lirikTitle = document.getElementById('lirikTitle');
            if (lirikTitle) lirikTitle.innerText = json.data.title;
            
            const lirikText = document.getElementById('lirikText');
            if (lirikText) lirikText.innerText = json.data.lyric;
            
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
            day: 'numeric', 
            month: 'short', 
            hour: '2-digit', 
            minute:'2-digit'
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
        container.innerHTML = `
            <div class="history-empty">
                <i class="fas fa-folder-open" style="font-size:32px; margin-bottom:12px; color:#475569;"></i><br>
                Belum ada riwayat unduhan.
            </div>
        `;
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
            </div>
        `;
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
    renderHistory(); 
    const modal = document.getElementById('historyModal');
    if (modal) modal.style.display = 'flex'; 
}

function closeHistory() { 
    const modal = document.getElementById('historyModal');
    if (modal) modal.style.display = 'none'; 
}


// =========================================================================
// =========================================================================
// FUNGSI DOWNLOAD - BUKA DI BROWSER EKSTERNAL (SAMA SEPERTI FITUR DOWNLOADER)
// =========================================================================
async function forceDownload(url, filename) {
    if (!url) return showToast("URL tidak valid", "error");

    const isBase64 = url.startsWith('data:image') || (url.length > 500 && !url.startsWith('http'));

    // Kalau base64, konversi dulu ke blob lalu buat object URL
    if (isBase64) {
        try {
            let finalBase64 = url.startsWith('data:image') ? url : 'data:image/png;base64,' + url;
            const arr = finalBase64.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) { u8arr[n] = bstr.charCodeAt(n); }
            const blob = new Blob([u8arr], { type: mime });
            const objectUrl = URL.createObjectURL(blob);
            window.open(objectUrl, '_blank');
        } catch (e) {
            window.open(url, '_blank');
        }
        return;
    }

    // URL biasa (gambar AI, video, dll) — langsung buka di browser
    // Browser akan handle download ke galeri/folder download
    window.open(url, '_blank');
}
// =========================================================================


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
    if (video) {
        video.pause();
    }
    if (overlay) {
        overlay.style.display = 'none';
    }
}

function openCategory(catId, btnId) {
    document.querySelectorAll('.bnav-item').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (btnId) {
        const targetBtn = document.getElementById(btnId);
        if (targetBtn) targetBtn.classList.add('active');
    }

    const modal = document.getElementById('featuresModal');
    if (modal) modal.style.display = 'flex';

    if (catId !== 'all') {
        setTimeout(() => {
            const catEl = document.getElementById(catId);
            const modalContent = document.querySelector('.modal-content');
            if (catEl && modalContent) {
                modalContent.scrollTo({ top: catEl.offsetTop - 24, behavior: 'smooth' });
            }
        }, 50);
    } else {
        setTimeout(() => {
            const modalContent = document.querySelector('.modal-content');
            if (modalContent) {
                modalContent.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 50);
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
    
    if (event.target == featuresModal) {
        closeModal(); 
    }
    if (event.target == historyModal) {
        closeHistory(); 
    }
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
    const mainBtn = document.getElementById('mainBtn');
    
    const mediaUrlInput = document.getElementById('mediaUrl');
    const urlVal = mediaUrlInput ? mediaUrlInput.value.trim() : "";
    
    const textContentInput = document.getElementById('textContent');
    const textVal = textContentInput ? textContentInput.value.trim() : "";
    
    let phoneTime = ""; 
    let chatTime = ""; 
    let ytType = ""; 
    let ytQuality = ""; 
    let providerData = ""; 
    let amountData = "";
    
    if (currentPlatform === 'ai-detector' || currentPlatform === 'iqc' || currentPlatform === 'nulis') {
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
                return showToast("Masukkan nominal yang valid (Minimal Rp 10.000).", "error"); 
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
    } else if (['hd-foto', 'remove-bg', 'noise-reduce', 'photo-editor'].includes(currentPlatform)) {
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
    } else if (currentPlatform === 'lirik' && !urlVal) {
        return showToast("Harap masukkan judul lagu.", "error");
    } else if (!['hd-foto', 'remove-bg', 'noise-reduce'].includes(currentPlatform) && !urlVal && !textVal) {
        return showToast("Harap isi kolom terlebih dahulu.", "error");
    }

    if (!navigator.onLine && currentPlatform !== 'kontak') {
        offlineQueue.push({ 
            platform: currentPlatform, 
            url: urlVal, 
            text: textVal 
        });
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

    const aiTools = ['hd-foto', 'remove-bg', 'noise-reduce', 'photo-editor'];
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

    try {
        let finalInputData = urlVal || textVal;
        let fileBase64Obj = null;

        if (aiTools.includes(currentPlatform)) {
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
        
        if (currentPlatform === 'pulsa' || currentPlatform === 'topup') { 
            action = providerData; 
            params = { number: finalInputData, amount: amountData }; 
        } else if (currentPlatform === 'youtube') { 
            action = 'youtube'; 
            params = { url: finalInputData, type: ytType, quality: ytQuality }; 
        } else if (currentPlatform === 'tiktok') { 
            action = 'snaptik-v2'; 
            params = { url: finalInputData }; 
        } else if (currentPlatform === 'ig') { 
            action = 'ig'; 
            params = { url: finalInputData }; 
        } else if (currentPlatform === 'facebook') { 
            action = 'fb'; 
            params = { url: finalInputData }; 
        } else if (currentPlatform === 'twitter') { 
            action = 'twitter'; 
            params = { url: finalInputData }; 
        } else if (currentPlatform === 'terabox') { 
            action = 'terabox'; 
            params = { url: finalInputData }; 
        } else if (currentPlatform === 'pin') { 
            action = 'pin'; 
            params = { url: finalInputData }; 
        } else if (currentPlatform === 'spotify') { 
            action = 'spotify'; 
            params = { url: finalInputData }; 
        } else if (currentPlatform === 'ss-web') { 
            action = 'ss'; 
            params = { url: finalInputData, device: 'desktop' }; 
        } else if (currentPlatform === 'yt-transcript') { 
            action = 'transcript'; 
            params = { url: finalInputData }; 
        } else if (currentPlatform === 'ai-detector') { 
            action = 'ai-detector'; 
            params = { text: finalInputData }; 
        } else if (currentPlatform === 'iqc') { 
            action = 'iqc'; 
            params = { text: finalInputData, time: phoneTime, chat_time: chatTime }; 
        } else if (currentPlatform === 'nulis') { 
            action = 'nulis'; 
            params = { text: finalInputData }; 
        } else if (currentPlatform === 'hd-foto') { 
            action = 'upscale'; 
            params = { image: "" }; 
        } else if (currentPlatform === 'noise-reduce') { 
            action = 'noice-reducer'; 
            params = { file: "" }; 
        } else if (currentPlatform === 'remove-bg') { 
            action = 'nobg'; 
            params = { image: "" }; 
        } else if (currentPlatform === 'photo-editor') { 
            action = 'photo-editor'; 
            params = { image: "", q: finalInputData }; 
        } else if (currentPlatform === 'lirik') { 
            action = 'lyric'; 
            params = { q: finalInputData }; 
        } else if (currentPlatform === 'roblox-stalk') { 
            action = 'roblox-stalk'; 
            params = { username: finalInputData }; 
        } else if (currentPlatform === 'dc-stalk') { 
            action = 'dcstalk'; 
            params = { id: finalInputData }; 
        } else if (currentPlatform === 'tt-stalk') { 
            action = 'ttstalk'; 
            params = { username: finalInputData }; 
        } else if (currentPlatform === 'tw-stalk') { 
            action = 'twstalk'; 
            params = { username: finalInputData }; 
        } else if (currentPlatform === 'gh-stalk') { 
            action = 'ghstalk'; 
            params = { username: finalInputData }; 
        } else if (currentPlatform === 'ig-stalk') { 
            action = 'igstalk'; 
            params = { username: finalInputData }; 
        } else if (currentPlatform === 'th-stalk') { 
            action = 'thstalk'; 
            params = { username: finalInputData }; 
        }

        const payload = {
            action: action, 
            params: params
        };
        
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
            const data = json.data;
            
            const mainResultCard = document.getElementById('resultCard');
            if (mainResultCard) mainResultCard.style.display = 'block';

            if (currentPlatform === 'pulsa' || currentPlatform === 'topup') {
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
                bioEl.innerText = ''; 
                
                if (currentPlatform === 'roblox-stalk') {
                    avatarImg.src = data.avatar; 
                    nameEl.innerText = data.displayName || data.name; 
                    userEl.innerText = `@${data.name}`; 
                    if(data.description) bioEl.innerText = data.description;
                    
                    gridEl.innerHTML = `
                        <div class="ai-stat-box"><h4>${data.friends}</h4><p>Teman</p></div>
                        <div class="ai-stat-box"><h4>${data.followers}</h4><p>Followers</p></div>
                        <div class="ai-stat-box"><h4>${data.followings}</h4><p>Followings</p></div>
                    `;
                    extraEl.innerHTML = `<strong>ID:</strong> ${data.id}<br><strong>Banned:</strong> ${data.isBanned ? 'Ya' : 'Tidak'}`;
                    extractColorAndApply(data.avatar);
                }
                else if (currentPlatform === 'gh-stalk') {
                    avatarImg.src = data.avatar_url; 
                    nameEl.innerText = data.name || data.login; 
                    userEl.innerText = `@${data.login}`; 
                    if(data.bio && data.bio !== '.') bioEl.innerText = data.bio;
                    
                    gridEl.innerHTML = `
                        <div class="ai-stat-box"><h4>${data.followers}</h4><p>Followers</p></div>
                        <div class="ai-stat-box"><h4>${data.following}</h4><p>Following</p></div>
                    `;
                    extraEl.innerHTML = `<strong>ID:</strong> ${data.id}<br><strong>Tipe:</strong> ${data.type}`;
                    extractColorAndApply(data.avatar_url);
                }
                else if (currentPlatform === 'ig-stalk') {
                    avatarImg.src = data.photo; 
                    nameEl.innerText = data.name; 
                    userEl.innerText = `@${data.username}`; 
                    if(data.about) bioEl.innerText = data.about;
                    
                    gridEl.innerHTML = `
                        <div class="ai-stat-box"><h4>${data.follower.toLocaleString()}</h4><p>Followers</p></div>
                        <div class="ai-stat-box"><h4>${data.following.toLocaleString()}</h4><p>Following</p></div>
                    `;
                    extraEl.innerHTML = `<strong>ID:</strong> ${data.id}<br><strong>Private:</strong> ${data.private ? 'Ya' : 'Tidak'}`;
                    extractColorAndApply(data.photo);
                }
                else if (currentPlatform === 'th-stalk') {
                    let picUrl = data.profile_pic_url || (data.hd_profile_pic_versions ? data.hd_profile_pic_versions[0].url : '');
                    avatarImg.src = picUrl; 
                    nameEl.innerText = data.full_name; 
                    userEl.innerText = `@${data.username}`; 
                    if(data.biography) bioEl.innerText = data.biography;
                    
                    gridEl.innerHTML = `<div class="ai-stat-box" style="grid-column: span 2;"><h4>${data.follower_count.toLocaleString()}</h4><p>Followers</p></div>`;
                    extraEl.innerHTML = `<strong>ID:</strong> ${data.pk}<br><strong>Verified:</strong> ${data.is_verified ? 'Ya' : 'Tidak'}`;
                    extractColorAndApply(picUrl);
                }
                else if (currentPlatform === 'dc-stalk') {
                    avatarImg.src = data.avatar_url; 
                    nameEl.innerText = data.global_name || data.username; 
                    userEl.innerText = `@${data.username}`;
                    
                    gridEl.innerHTML = `<div class="ai-stat-box" style="grid-column: span 2;"><h4>${data.id}</h4><p>User ID</p></div>`;
                    extraEl.innerHTML = `<strong>Dibuat:</strong> ${new Date(data.created_at).toLocaleString()}`;
                    extractColorAndApply(data.avatar_url);
                }
                else if (currentPlatform === 'tt-stalk') {
                    avatarImg.src = data.photo; 
                    nameEl.innerText = data.name; 
                    userEl.innerText = `@${data.username}`; 
                    if(data.bio) bioEl.innerText = data.bio;
                    
                    gridEl.innerHTML = `
                        <div class="ai-stat-box"><h4>${data.followers.toLocaleString()}</h4><p>Followers</p></div>
                        <div class="ai-stat-box"><h4>${data.following.toLocaleString()}</h4><p>Following</p></div>
                    `;
                    extraEl.innerHTML = `<strong>ID:</strong> ${data.id}<br><strong>Verified:</strong> ${data.verified ? 'Ya' : 'Tidak'}`;
                    extractColorAndApply(data.photo);
                }
                else if (currentPlatform === 'tw-stalk') {
                    avatarImg.src = data.photo; 
                    nameEl.innerText = data.name; 
                    userEl.innerText = data.username;
                    
                    gridEl.innerHTML = `
                        <div class="ai-stat-box"><h4>${data.followers}</h4><p>Followers</p></div>
                        <div class="ai-stat-box"><h4>${data.followings}</h4><p>Following</p></div>
                    `;
                    extraEl.innerHTML = `<strong>Status:</strong> ${data.joined}`;
                    extractColorAndApply(data.photo);
                }
            }
            else if (currentPlatform === 'lirik') {
                document.getElementById('lirikResult').style.display = 'block'; 
                const listContainer = document.getElementById('lirikList'); 
                document.getElementById('lirikTitle').innerText = "Pilih Versi Lagu:"; 
                listContainer.style.display = 'flex'; 
                document.getElementById('lirikContentWrapper').style.display = 'none'; 
                listContainer.innerHTML = '';
                
                data.forEach(item => { 
                    listContainer.innerHTML += `<button class="btn-secondary" onclick="fetchLirik('${item.url}')"><i class="fas fa-music"></i> ${item.title}</button>`; 
                });
            }
            else if (currentPlatform === 'photo-editor') {
                document.getElementById('photoEditorResult').style.display = 'block'; 
                document.getElementById('photoEditorInfo').innerText = `Ukuran: ${data.size || 'HD'}`; 
                
                let imgSrc = data.url;
                if (imgSrc && imgSrc.length > 1000 && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:image')) {
                    imgSrc = 'data:image/png;base64,' + imgSrc;
                }
                
                document.getElementById('photoEditorImage').src = imgSrc; 
                document.getElementById('photoEditorActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${imgSrc}', 'Moonlight_EditAI.png')"><i class="fas fa-download"></i> Simpan Gambar</button>`;
                saveToHistory(`Edit AI`, imgSrc);
                extractColorAndApply(imgSrc);
            }
            else if (currentPlatform === 'hd-foto') {
                document.getElementById('hdFotoResult').style.display = 'block'; 
                document.getElementById('hdFotoInfo').innerText = `Ukuran: ${data.size || 'HD'}`; 
                
                let imgSrc = data.url;
                if (imgSrc && imgSrc.length > 1000 && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:image')) {
                    imgSrc = 'data:image/png;base64,' + imgSrc;
                }
                
                document.getElementById('hdImageResult').src = imgSrc; 
                document.getElementById('hdActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${imgSrc}', 'Moonlight_HDFoto.png')"><i class="fas fa-download"></i> Simpan Gambar HD</button>`;
                saveToHistory(`HD Foto`, imgSrc);
                extractColorAndApply(imgSrc);
            }
            else if (currentPlatform === 'remove-bg') {
                document.getElementById('removeBgResult').style.display = 'block'; 
                
                let imgSrc = data.no_background || data.url || data.image;
                if (imgSrc && imgSrc.length > 1000 && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:image')) {
                    imgSrc = 'data:image/png;base64,' + imgSrc;
                }
                
                document.getElementById('removeBgImage').src = imgSrc; 
                document.getElementById('removeBgActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${imgSrc}', 'Moonlight_NoBG.png')"><i class="fas fa-download"></i> Simpan Transparan</button>`;
                saveToHistory(`Hapus BG`, imgSrc);
                extractColorAndApply(imgSrc);
            }
            else if (currentPlatform === 'noise-reduce') {
                document.getElementById('audioResult').style.display = 'block'; 
                document.getElementById('audioPlayer').src = data.url; 
                document.getElementById('audioActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${data.url}', 'Moonlight_CleanAudio.mp3')"><i class="fas fa-download"></i> Simpan Audio</button>`;
                saveToHistory(`Bersihkan Audio`, data.url);
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
                }
                else if (currentPlatform === 'twitter') { 
                    profileSec.style.display = 'none'; 
                    captionText.style.display = 'none'; 
                    thumbCon.style.display = 'none'; 
                    data.forEach((item, i) => { 
                        let typeText = item.type === "mp4" ? "Video" : "Gambar"; 
                        let icon = item.type === "mp4" ? "fa-video" : "fa-image"; 
                        actionBtns.innerHTML += `<button class="btn-primary" onclick="forceDownload('${item.url}', 'X_${i}.mp4')"><i class="fas ${icon}"></i> Download ${typeText} ${i + 1}</button>`; 
                    }); 
                }
                else if (currentPlatform === 'terabox') { 
                    profileSec.style.display = 'none'; 
                    captionText.style.display = 'block'; 
                    captionText.innerHTML = `<strong>File:</strong> ${data[0].server_filename}<br><strong>Size:</strong> ${data[0].size}`; 
                    thumbCon.style.display = 'none'; 
                    actionBtns.innerHTML = `<button class="btn-primary" onclick="forceDownload('${data[0].dlink}', '${data[0].server_filename}')"><i class="fas fa-download"></i> Download File</button>`; 
                }
                else if (currentPlatform === 'youtube') { 
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
                }
                else if (currentPlatform === 'spotify') { 
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
                }
                else if (currentPlatform === 'tiktok') { 
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
                }
                else if (currentPlatform === 'ig') { 
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
                }
                else if (currentPlatform === 'pin') { 
                    profileSec.style.display = 'none'; 
                    captionText.style.display = 'none'; 
                    thumbCon.style.display = 'none'; 
                    
                    actionBtns.innerHTML = `<button class="btn-primary" onclick="forceDownload('${data.url}', 'Pinterest.jpg')"><i class="fas fa-download"></i> Download Media</button>`; 
                    saveToHistory(`Pinterest Media`, data.url); 
                }
            }
        }
        else {
            showToast(json.msg || "Gagal memproses data dari server.", "error");
        }
    } catch (error) {
        console.error(error);
        showToast("Terjadi kesalahan sistem atau koneksi.", "error");
    } finally {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        
        stopGameLoop(); 
        
        if (mainBtn) {
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
            } else if (currentPlatform === 'hd-foto') {
                mainBtn.innerHTML = "Tingkatkan Kualitas Foto";
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
            } else {
                mainBtn.innerHTML = "Download Sekarang";
            }
        }
    }
}

let currentPlatform = 'tiktok';
const COOLDOWN_TIME = 15000;
let toastTimeout; 

// ==========================================
// INISIALISASI SAAT WEB DIMUAT
// ==========================================
window.onload = function () {
    // 1. Hilangkan Splash Screen setelah 1.5 detik
    setTimeout(() => {
        const splash = document.getElementById('splashScreen');
        if (splash) {
            splash.classList.add('splash-hidden');
        }
    }, 1500);

    // 2. Set menu default
    setPlatform('youtube');
    
    // 3. Set status aktif pada Navigasi Bawah (Semua)
    document.querySelectorAll('.bnav-item').forEach(btn => btn.classList.remove('active'));
    const defaultBtn = document.getElementById('bnav-all');
    if(defaultBtn) defaultBtn.classList.add('active');
};

// ==========================================
// TOAST NOTIFICATION
// ==========================================
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

// ==========================================
// FITUR RIWAYAT (HISTORY) - LOCAL STORAGE
// ==========================================
function saveToHistory(title, link) {
    if(!link || typeof link !== 'string' || link.trim() === '') return;
    let history = JSON.parse(localStorage.getItem('moonlightHistory')) || [];
    
    const newItem = {
        id: Date.now(),
        title: title,
        link: link,
        date: new Date().toLocaleString('id-ID', {day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit'})
    };
    
    history.unshift(newItem);
    if (history.length > 10) history.pop(); 
    localStorage.setItem('moonlightHistory', JSON.stringify(history));
}

function renderHistory() {
    const container = document.getElementById('historyListContainer');
    let history = JSON.parse(localStorage.getItem('moonlightHistory')) || [];
    
    if (history.length === 0) {
        container.innerHTML = `
            <div class="history-empty">
                <i class="fas fa-folder-open" style="font-size:32px; margin-bottom:12px; color:#475569;"></i><br>
                Belum ada riwayat unduhan.
            </div>`;
        return;
    }

    container.innerHTML = '';
    history.forEach(item => {
        container.innerHTML += `
            <div class="history-item">
                <div class="history-info">
                    <h4>${item.title}</h4>
                    <p>${item.date}</p>
                </div>
                <div class="history-actions">
                    <button onclick="forceDownload('${item.link}', 'Moonlight_History_${item.id}')" title="Download Ulang">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            </div>
        `;
    });
}

function clearHistory() {
    if(confirm("Yakin ingin menghapus semua riwayat?")) {
        localStorage.removeItem('moonlightHistory');
        renderHistory();
        showToast("Riwayat berhasil dibersihkan", "success");
    }
}

function openHistory() {
    renderHistory();
    document.getElementById('historyModal').style.display = 'flex';
}
function closeHistory() { 
    document.getElementById('historyModal').style.display = 'none'; 
}

// ==========================================
// FORCE DOWNLOAD (Agar Tidak Pindah Tab)
// ==========================================
async function forceDownload(url, filename) {
    try {
        showToast("Sedang mengunduh file...", "info");
        const response = await fetch(url);
        if (!response.ok) throw new Error("Gagal mengambil file");
        
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
        
        showToast("Disimpan ke galeri!", "success");
    } catch (error) {
        window.open(url, '_blank');
        showToast("Membuka di tab baru (Server memblokir unduhan instan)", "info");
    }
}

// ==========================================
// MODAL & NAVIGATION CONTROL
// ==========================================
function openCategory(catId, btnId) {
    document.querySelectorAll('.bnav-item').forEach(btn => btn.classList.remove('active'));
    if (btnId) {
        const activeBtn = document.getElementById(btnId);
        if(activeBtn) activeBtn.classList.add('active');
    }

    const modal = document.getElementById('featuresModal');
    modal.style.display = 'flex';

    if (catId !== 'all') {
        setTimeout(() => {
            const catEl = document.getElementById(catId);
            const modalContent = document.querySelector('.modal-content');
            if(catEl && modalContent) {
                modalContent.scrollTo({ top: catEl.offsetTop - 24, behavior: 'smooth' });
            }
        }, 50);
    } else {
        setTimeout(() => {
            const modalContent = document.querySelector('.modal-content');
            if(modalContent) {
                modalContent.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 50);
    }
}

function closeModal() { 
    document.getElementById('featuresModal').style.display = 'none'; 
    document.querySelectorAll('.bnav-item').forEach(btn => btn.classList.remove('active'));
    const defaultBtn = document.getElementById('bnav-all');
    if(defaultBtn) defaultBtn.classList.add('active');
}

window.onclick = function (event) { 
    if (event.target == document.getElementById('featuresModal')) closeModal(); 
    if (event.target == document.getElementById('historyModal')) closeHistory(); 
};

// ==========================================
// ANTI SPAM (COOLDOWN)
// ==========================================
function checkCooldown() {
    const lastAction = localStorage.getItem('lastMoonlightAction');
    if (lastAction) {
        const diff = Date.now() - parseInt(lastAction);
        if (diff < COOLDOWN_TIME) {
            showToast(`Tunggu ${Math.ceil((COOLDOWN_TIME - diff) / 1000)} detik lagi.`, 'info');
            return false;
        }
    }
    return true;
}

function setCooldown() {
    localStorage.setItem('lastMoonlightAction', Date.now());
}

// ==========================================
// EFEK WARNA BUNGLON (DYNAMIC THEME)
// ==========================================
function applyDynamicTheme(platform) {
    const root = document.documentElement;
    let primary = '#2563eb'; // Biru Moonlight Default
    let hover = '#1d4ed8';

    const aiTools = ['hd-foto', 'remove-bg', 'noise-reduce', 'photo-editor', 'ai-detector'];
    
    if (platform === 'youtube' || platform === 'yt-transcript' || platform === 'pin') { 
        primary = '#ef4444'; hover = '#dc2626'; // Merah
    } 
    else if (platform === 'tiktok' || platform === 'tt-stalk') { 
        primary = '#06b6d4'; hover = '#0891b2'; // Sian (Cyan)
    } 
    else if (platform === 'ig' || platform === 'ig-stalk') { 
        primary = '#d946ef'; hover = '#c026d3'; // Pink/Magenta
    } 
    else if (platform === 'facebook') { 
        primary = '#1877f2'; hover = '#1462cb'; // Biru FB
    } 
    else if (platform === 'twitter' || platform === 'tw-stalk' || platform === 'th-stalk') { 
        primary = '#475569'; hover = '#334155'; // Abu-abu Gelap (Slate)
    } 
    else if (platform === 'spotify' || platform === 'lirik') { 
        primary = '#1db954'; hover = '#1aa34a'; // Hijau Spotify
    } 
    else if (platform === 'terabox') { 
        primary = '#eab308'; hover = '#ca8a04'; // Kuning
    } 
    else if (aiTools.includes(platform)) { 
        primary = '#8b5cf6'; hover = '#7c3aed'; // Ungu Magis AI
    } 
    else if (platform === 'pulsa' || platform === 'topup' || platform === 'roblox-stalk') { 
        primary = '#10b981'; hover = '#059669'; // Hijau Emerald
    } 
    else if (platform === 'nulis' || platform === 'iqc' || platform === 'ss-web') { 
        primary = '#f59e0b'; hover = '#d97706'; // Kuning Amber
    }

    // Suntikkan warna baru ke CSS secara instan
    root.style.setProperty('--primary', primary);
    root.style.setProperty('--primary-hover', hover);
}

// ==========================================
// SETTING TAMPILAN BERDASARKAN FITUR
// ==========================================
function setPlatform(platform) {
    currentPlatform = platform;
    
    // Ganti Warna Tema Terlebih Dahulu
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
    
    // Reset Tampilan
    urlCont.style.display = 'none'; 
    textCont.style.display = 'none'; 
    fileCont.style.display = 'none'; 
    nominalCont.style.display = 'none';
    customAmountCont.style.display = 'none';
    providerCont.style.display = 'none';
    ytFormatCont.style.display = 'none';
    timeInputsCont.style.display = 'none';
    catboxHelper.style.display = 'none';
    contactCont.style.display = 'none';
    document.getElementById('resultCard').style.display = 'none'; 
    btn.style.display = 'flex';

    if (platform === 'kontak') { 
        title.innerHTML = "Hubungi Owner"; 
        contactCont.style.display = 'flex'; 
        btn.style.display = 'none'; 
    }
    else if (platform === 'pulsa') { 
        title.innerHTML = "Isi Ulang Pulsa"; 
        document.getElementById('mediaUrl').placeholder = "Masukkan Nomor HP (0812...)"; 
        document.getElementById('pulsaProvider').innerHTML = `<option value="pulsa-axis">AXIS</option><option value="pulsa-indosat">INDOSAT (IM3)</option><option value="pulsa-telkomsel">TELKOMSEL</option><option value="pulsa-tri">TRI (3)</option><option value="pulsa-xl">XL AXIATA</option>`; 
        urlCont.style.display = 'flex'; 
        providerCont.style.display = 'flex'; 
        nominalCont.style.display = 'flex'; 
        btn.innerHTML = 'Buat Tagihan'; 
    }
    else if (platform === 'topup') { 
        title.innerHTML = "Topup E-Wallet"; 
        document.getElementById('mediaUrl').placeholder = "Masukkan Nomor Akun (0812...)"; 
        document.getElementById('pulsaProvider').innerHTML = `<option value="topup-dana">DANA</option><option value="topup-gopay">GOPAY</option><option value="topup-ovo">OVO</option><option value="topup-shopeepay">SHOPEEPAY</option>`; 
        urlCont.style.display = 'flex'; 
        providerCont.style.display = 'flex'; 
        customAmountCont.style.display = 'flex'; 
        btn.innerHTML = 'Buat Tagihan'; 
    }
    else if (platform === 'youtube') { 
        title.innerHTML = "Unduh YouTube"; 
        document.getElementById('mediaUrl').placeholder = "Tempel tautan video YouTube di sini..."; 
        urlCont.style.display = 'flex'; 
        ytFormatCont.style.display = 'flex'; 
        btn.innerHTML = 'Download Sekarang'; 
    }
    else if (platform === 'tiktok') { 
        title.innerHTML = "Unduh Video TikTok"; 
        document.getElementById('mediaUrl').placeholder = "Tempel tautan video TikTok di sini..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Download Sekarang'; 
    }
    else if (platform === 'ig') { 
        title.innerHTML = "Unduh Media Instagram"; 
        document.getElementById('mediaUrl').placeholder = "Tempel tautan Post/Reels IG di sini..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Download Sekarang'; 
    }
    else if (platform === 'facebook') { 
        title.innerHTML = "Unduh Video Facebook"; 
        document.getElementById('mediaUrl').placeholder = "Tempel tautan video/Reels Facebook..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Download Sekarang'; 
    }
    else if (platform === 'twitter') { 
        title.innerHTML = "Unduh Media Twitter (X)"; 
        document.getElementById('mediaUrl').placeholder = "Tempel tautan postingan Twitter (X)..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Download Sekarang'; 
    }
    else if (platform === 'terabox') { 
        title.innerHTML = "TeraBox Downloader"; 
        document.getElementById('mediaUrl').placeholder = "Tempel tautan file TeraBox di sini..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Buka File TeraBox'; 
    }
    else if (platform === 'pin') { 
        title.innerHTML = "Unduh Media Pinterest"; 
        document.getElementById('mediaUrl').placeholder = "Tempel tautan Pin dari Pinterest di sini..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Download Sekarang'; 
    }
    else if (platform === 'spotify') { 
        title.innerHTML = "Unduh Musik Spotify"; 
        document.getElementById('mediaUrl').placeholder = "Tempel tautan lagu Spotify di sini..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Download Sekarang'; 
    }
    else if (platform === 'lirik') { 
        title.innerHTML = "Pencarian Lirik Lagu"; 
        document.getElementById('mediaUrl').placeholder = "Ketik judul lagu (contoh: Komang)..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Cari Lirik Sekarang'; 
    }
    else if (platform === 'ss-web') { 
        title.innerHTML = "Screenshot Website"; 
        document.getElementById('mediaUrl').placeholder = "Masukkan URL web (https://...)"; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Ambil Screenshot'; 
    }
    else if (platform === 'yt-transcript') { 
        title.innerHTML = "YouTube Transcript"; 
        document.getElementById('mediaUrl').placeholder = "Tempel tautan video YouTube di sini..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Ekstrak Teks Sekarang'; 
    }
    else if (platform === 'ai-detector') { 
        title.innerHTML = "AI Text Detector"; 
        document.getElementById('textContent').placeholder = "Tempel artikel atau teks di sini..."; 
        textCont.style.display = 'flex'; 
        btn.innerHTML = 'Deteksi Teks Sekarang'; 
    }
    else if (platform === 'iqc') { 
        title.innerHTML = "iPhone Quoted"; 
        document.getElementById('textContent').placeholder = "Ketik atau tempel teks pesan di sini..."; 
        textCont.style.display = 'flex'; 
        timeInputsCont.style.display = 'flex'; 
        btn.innerHTML = 'Buat Kutipan iPhone'; 
    }
    else if (platform === 'nulis') { 
        title.innerHTML = "Nulis Otomatis"; 
        document.getElementById('textContent').placeholder = "Ketik atau tempel teks yang ingin ditulis tangan..."; 
        textCont.style.display = 'flex'; 
        btn.innerHTML = 'Mulai Nulis'; 
    }
    else if (platform === 'hd-foto') { 
        title.innerHTML = "HD Foto (Upscaler)"; 
        fileCont.style.display = 'flex'; 
        document.getElementById('mediaFile').accept = "image/*"; 
        catboxHelper.innerHTML = `<i class="fas fa-info-circle" style="color: var(--primary); margin-right: 5px;"></i> Pilih foto dari perangkat. Sistem akan memprosesnya otomatis. (Maksimal 4MB)`; 
        catboxHelper.style.display = 'block'; 
        btn.innerHTML = 'Tingkatkan Kualitas Foto'; 
    }
    else if (platform === 'remove-bg') { 
        title.innerHTML = "Hapus Background"; 
        fileCont.style.display = 'flex'; 
        document.getElementById('mediaFile').accept = "image/*"; 
        catboxHelper.innerHTML = `<i class="fas fa-info-circle" style="color: var(--primary); margin-right: 5px;"></i> Pilih foto dari perangkat. Sistem akan memprosesnya otomatis. (Maksimal 4MB)`; 
        catboxHelper.style.display = 'block'; 
        btn.innerHTML = 'Hapus Background Gambar'; 
    }
    else if (platform === 'noise-reduce') { 
        title.innerHTML = "Audio Noise Reduce"; 
        fileCont.style.display = 'flex'; 
        document.getElementById('mediaFile').accept = "audio/*"; 
        catboxHelper.innerHTML = `<i class="fas fa-info-circle" style="color: var(--primary); margin-right: 5px;"></i> Pilih file audio dari perangkat. Sistem akan membersihkannya otomatis. (Maksimal 4MB)`; 
        catboxHelper.style.display = 'block'; 
        btn.innerHTML = 'Bersihkan Suara Audio'; 
    }
    else if (platform === 'photo-editor') { 
        title.innerHTML = "Photo Editor AI"; 
        fileCont.style.display = 'flex'; 
        document.getElementById('mediaFile').accept = "image/*"; 
        urlCont.style.display = 'flex';
        document.getElementById('mediaUrl').placeholder = "Ketik perintah edit (contoh: ubah baju jadi merah)...";
        catboxHelper.innerHTML = `<i class="fas fa-info-circle" style="color: var(--primary); margin-right: 5px;"></i> Pilih foto, lalu ketik perintah yang ingin diubah. (Maksimal 4MB)`; 
        catboxHelper.style.display = 'block'; 
        btn.innerHTML = 'Edit Foto Sekarang'; 
    }
    else if (platform === 'roblox-stalk') { 
        title.innerHTML = "Roblox Stalk"; 
        document.getElementById('mediaUrl').placeholder = "Masukkan username Roblox..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Cari Player'; 
    }
    else if (platform === 'dc-stalk') { 
        title.innerHTML = "Discord Stalk"; 
        document.getElementById('mediaUrl').placeholder = "Masukkan ID Discord (angka)..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Cari User'; 
    }
    else if (platform === 'tt-stalk') { 
        title.innerHTML = "TikTok Stalk"; 
        document.getElementById('mediaUrl').placeholder = "Masukkan username TikTok (tanpa @)..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Cari Akun'; 
    }
    else if (platform === 'tw-stalk') { 
        title.innerHTML = "Twitter Stalk"; 
        document.getElementById('mediaUrl').placeholder = "Masukkan username Twitter (tanpa @)..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Cari Akun'; 
    }
    else if (platform === 'gh-stalk') { 
        title.innerHTML = "GitHub Stalk"; 
        document.getElementById('mediaUrl').placeholder = "Masukkan username GitHub..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Cari Developer'; 
    }
    else if (platform === 'ig-stalk') { 
        title.innerHTML = "Instagram Stalk"; 
        document.getElementById('mediaUrl').placeholder = "Masukkan username Instagram (tanpa @)..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Cari Akun IG'; 
    }
    else if (platform === 'th-stalk') { 
        title.innerHTML = "Threads Stalk"; 
        document.getElementById('mediaUrl').placeholder = "Masukkan username Threads (tanpa @)..."; 
        urlCont.style.display = 'flex'; 
        btn.innerHTML = 'Cari Akun Threads'; 
    }

    document.getElementById('mediaUrl').value = '';
    document.getElementById('textContent').value = '';
    document.getElementById('mediaFile').value = '';
    if (document.getElementById('customAmount')) document.getElementById('customAmount').value = '';
    
    // Animasi transisi yang smooth
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

// ==========================================
// FUNGSI UTILITIES (Teks, Lirik, dll)
// ==========================================
async function pasteToInput(elementId) { 
    try { 
        const text = await navigator.clipboard.readText(); 
        document.getElementById(elementId).value = text; 
    } catch (err) { 
        showToast('Browser memblokir tempel otomatis. Silakan Tahan Layar > Tempel.', 'info'); 
    } 
}

function copyTranscript() { 
    const textToCopy = document.getElementById('ytTranscriptText').innerText; 
    navigator.clipboard.writeText(textToCopy).then(() => { 
        const btn = document.getElementById('copyTranscriptBtn'); 
        btn.innerHTML = '<i class="fas fa-check"></i> Tersalin'; 
        btn.style.background = '#10b981'; 
        setTimeout(() => { 
            btn.innerHTML = '<i class="fas fa-copy"></i> Salin Teks ke Clipboard'; 
            btn.style.background = 'var(--primary)'; 
        }, 2000); 
    }).catch(() => { 
        showToast('Gagal menyalin teks. Silakan salin manual.', 'error'); 
    }); 
}

function copyLirik() { 
    const textToCopy = document.getElementById('lirikText').innerText; 
    navigator.clipboard.writeText(textToCopy).then(() => { 
        const btn = document.getElementById('copyLirikBtn'); 
        btn.innerHTML = '<i class="fas fa-check"></i> Tersalin'; 
        btn.style.background = '#10b981'; 
        setTimeout(() => { 
            btn.innerHTML = '<i class="fas fa-copy"></i> Salin Lirik ke Clipboard'; 
            btn.style.background = 'var(--primary)'; 
        }, 2000); 
    }).catch(() => { 
        showToast('Gagal menyalin teks. Silakan salin manual.', 'error'); 
    }); 
}

async function fetchLirik(url) {
    const loading = document.getElementById('loading');
    const loadingText = document.getElementById('loadingText');
    const menuBtn = document.getElementById('menuBtn');
    
    if(menuBtn) menuBtn.disabled = true;
    loading.style.display = 'block'; 
    loadingText.innerText = "Mengambil teks lirik...";
    
    try {
        const res = await fetch(`/api/proses`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ action: 'lyric', params: { q: url } }) 
        });
        const json = await res.json();
        
        if (json.status === true) {
            document.getElementById('lirikList').style.display = 'none';
            document.getElementById('lirikTitle').innerText = json.data.title;
            document.getElementById('lirikText').innerText = json.data.lyric;
            document.getElementById('lirikContentWrapper').style.display = 'block';
        } else { 
            showToast("Gagal memuat lirik dari server.", "error"); 
        }
    } catch (error) { 
        showToast("Gangguan jaringan. Periksa koneksi internet.", "error"); 
    } finally { 
        loading.style.display = 'none'; 
        if(menuBtn) menuBtn.disabled = false;
    }
}

// ==========================================
// FUNGSI UTAMA PROSES API (PROSES ACTION)
// ==========================================
async function processAction() {
    if (!checkCooldown()) return;

    const mainBtn = document.getElementById('mainBtn');
    const menuBtn = document.getElementById('menuBtn');
    const loading = document.getElementById('loading');
    const loadingText = document.getElementById('loadingText');
    const resultCard = document.getElementById('resultCard');

    let inputData = "";
    let amountData = "";
    let providerData = "";
    let phoneTime = "";
    let chatTime = "";
    let ytType = "";
    let ytQuality = "";

    // VALIDASI INPUT
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
        if (currentPlatform === 'pulsa') { 
            amountData = document.getElementById('pulsaNominal').value; 
        } else { 
            amountData = document.getElementById('customAmount').value; 
            if (!amountData || parseInt(amountData) < 10000) return showToast("Masukkan nominal yang valid (Minimal Rp 10.000).", "error"); 
        }
        if (!inputData || inputData.length < 9) return showToast("Masukkan Nomor HP/Akun yang valid.", "error");
    } else if (currentPlatform === 'youtube') {
        inputData = document.getElementById('mediaUrl').value.trim();
        if (!inputData) return showToast("Harap isi kolom input URL terlebih dahulu.", "error");
        const formatVal = document.getElementById('ytFormat').value.split('|');
        ytType = formatVal[0]; 
        ytQuality = formatVal[1];
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
    
    mainBtn.disabled = true; 
    mainBtn.innerHTML = "Memproses...";
    if(menuBtn) menuBtn.disabled = true;
    
    loading.style.display = 'block'; 
    loadingText.innerText = "Memproses permintaan...";
    resultCard.style.display = 'none'; 
    
    // Sembunyikan semua kontainer hasil sebelumnya
    document.querySelectorAll('#resultCard > div').forEach(el => el.style.display = 'none');

    try {
        let finalInputData = inputData;
        let fileBase64Obj = null;

        // Proses Konversi File ke Base64 untuk AI
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
            
            fileBase64Obj = { 
                base64: base64String, 
                fileName: file.name, 
                mimeType: file.type 
            };
            finalInputData = inputData; 
        }

        let action = '';
        let params = {};

        // Pengaturan Parameter sesuai Endpoint API
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

        // Panggil API Backend
        const response = await fetch('/api/proses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: action, params: params, fileData: fileBase64Obj })
        });
        
        const json = await response.json();

        if (json.status === true) {
            showToast("Berhasil memproses permintaan!", "success");
            const data = json.data;
            resultCard.style.display = 'block';

            if (currentPlatform === 'pulsa' || currentPlatform === 'topup') {
                document.getElementById('invoiceResult').style.display = 'block';
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
                document.getElementById('stalkResult').style.display = 'block';
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
                document.getElementById('lirikResult').style.display = 'block';
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
            else if (currentPlatform === 'photo-editor') {
                document.getElementById('photoEditorResult').style.display = 'block';
                document.getElementById('photoEditorInfo').innerText = `Ukuran File: ${data.size}`;
                document.getElementById('photoEditorImage').src = data.url;
                document.getElementById('photoEditorActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${data.url}', 'Moonlight_EditAI.jpg')"><i class="fas fa-download"></i> Simpan Hasil Edit</button>`;
                saveToHistory(`Edit AI: ${finalInputData}`, data.url);
            }
            else if (currentPlatform === 'hd-foto') {
                document.getElementById('hdFotoResult').style.display = 'block';
                document.getElementById('hdFotoInfo').innerText = `Ukuran File Baru: ${data.size}`;
                document.getElementById('hdImageResult').src = data.url;
                document.getElementById('hdActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${data.url}', 'Moonlight_HDFoto.jpg')"><i class="fas fa-download"></i> Simpan Foto HD</button>`;
                saveToHistory(`Hasil HD Foto`, data.url);
            }
            else if (currentPlatform === 'remove-bg') {
                document.getElementById('removeBgResult').style.display = 'block';
                document.getElementById('removeBgImage').src = data.no_background;
                document.getElementById('removeBgActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${data.no_background}', 'Moonlight_Transparan.png')"><i class="fas fa-download"></i> Simpan Gambar Transparan</button>`;
                saveToHistory(`Hasil Hapus BG`, data.no_background);
            }
            else if (currentPlatform === 'noise-reduce') {
                document.getElementById('audioResult').style.display = 'block';
                document.getElementById('audioPlayer').src = data.url;
                document.getElementById('audioActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${data.url}', 'Moonlight_CleanAudio.mp3')"><i class="fas fa-download"></i> Simpan Audio Bersih</button>`;
                saveToHistory(`Hasil Bersih Audio`, data.url);
            }
            else if (currentPlatform === 'ss-web') {
                document.getElementById('ssWebResult').style.display = 'block';
                document.getElementById('ssWebImage').src = data.url;
                document.getElementById('ssWebActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${data.url}', 'Moonlight_Screenshot.jpg')"><i class="fas fa-download"></i> Simpan Screenshot</button>`;
            }
            else if (currentPlatform === 'iqc') {
                document.getElementById('iqcResult').style.display = 'block';
                document.getElementById('iqcImage').src = data.url;
                document.getElementById('iqcActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${data.url}', 'Moonlight_Quote.png')"><i class="fas fa-download"></i> Simpan Gambar Kutipan</button>`;
            }
            else if (currentPlatform === 'nulis') {
                document.getElementById('nulisResult').style.display = 'block';
                document.getElementById('nulisImage').src = data.url;
                document.getElementById('nulisActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${data.url}', 'Moonlight_Catatan.jpg')"><i class="fas fa-download"></i> Simpan Gambar Tulisan</button>`;
            }
            else if (currentPlatform === 'ai-detector') {
                document.getElementById('aiResult').style.display = 'block';
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
                    profileSec.style.display = 'none'; captionText.style.display = 'none'; thumbCon.style.display = 'none';
                    data.forEach((item) => { 
                        actionBtns.innerHTML += `<button class="btn-primary" onclick="forceDownload('${item.url}', 'Moonlight_Facebook.mp4')"><i class="fas fa-video"></i> Download Video (${item.quality})</button>`; 
                    });
                }
                else if (currentPlatform === 'twitter') {
                    profileSec.style.display = 'none'; captionText.style.display = 'none'; thumbCon.style.display = 'none';
                    data.forEach((item, index) => {
                        let typeText = item.type === "mp4" ? "Video" : "Gambar";
                        let icon = item.type === "mp4" ? "fa-video" : "fa-image";
                        actionBtns.innerHTML += `<button class="btn-primary" onclick="forceDownload('${item.url}', 'Moonlight_Twitter_${index+1}.${item.type}')"><i class="fas ${icon}"></i> Download ${typeText} ${index + 1}</button>`;
                    });
                }
                else if (currentPlatform === 'terabox') {
                    profileSec.style.display = 'none'; captionText.style.display = 'block';
                    const teraItem = data[0];
                    captionText.innerHTML = `<div style="margin-bottom: 8px;"><strong>Nama File:</strong> ${teraItem.server_filename}</div><div><strong>Ukuran:</strong> ${teraItem.size}</div>`;
                    thumbCon.style.display = 'flex';
                    if (teraItem.thumbs && teraItem.thumbs.url3) { thumbImg.src = teraItem.thumbs.url3; thumbImg.onload = () => { thumbImg.style.display = "block"; thumbFallback.style.display = "none"; }; thumbImg.onerror = () => { thumbImg.style.display = "none"; thumbFallback.style.display = "flex"; }; } else { thumbImg.style.display = "none"; thumbFallback.style.display = "flex"; }
                    actionBtns.innerHTML = `<button class="btn-primary" onclick="forceDownload('${teraItem.dlink}', '${teraItem.server_filename}')"><i class="fas fa-cloud-download-alt"></i> Download File</button>`;
                }
                else if (currentPlatform === 'youtube') {
                    profileSec.style.display = 'none'; captionText.style.display = 'block';
                    captionText.innerHTML = `<div style="margin-bottom: 8px;"><strong>Judul:</strong> ${json.title}</div><div style="margin-bottom: 8px;"><strong>Channel:</strong> ${json.channel}</div><div style="margin-bottom: 8px;"><strong>Durasi:</strong> ${json.fduration}</div><div style="margin-bottom: 8px;"><strong>Kualitas:</strong> ${data.quality}</div><div><strong>Ukuran File:</strong> ${data.size}</div>`;
                    thumbCon.style.display = 'flex'; thumbImg.src = json.thumbnail;
                    thumbImg.onload = () => { thumbImg.style.display = "block"; thumbFallback.style.display = "none"; }; thumbImg.onerror = () => { thumbImg.style.display = "none"; thumbFallback.style.display = "flex"; };
                    
                    // Semuanya sekarang pakai class btn-primary karena warna diatur otomatis oleh Tema Bunglon
                    actionBtns.innerHTML = `<button class="btn-primary" onclick="forceDownload('${data.url}', 'Moonlight_YT.${data.extension}')"><i class="fas fa-download"></i> Download ${data.extension.toUpperCase()}</button>`;
                    saveToHistory(`YouTube: ${json.title}`, data.url);
                }
                else if (currentPlatform === 'spotify') {
                    profileSec.style.display = 'none'; captionText.style.display = 'block';
                    captionText.innerHTML = `<strong>Judul:</strong> ${data.title}<br><strong>Artis:</strong> ${data.artist.name}<br><strong>Durasi:</strong> ${data.duration}`;
                    thumbCon.style.display = 'flex'; thumbImg.src = data.thumbnail;
                    thumbImg.onload = () => { thumbImg.style.display = "block"; thumbFallback.style.display = "none"; }; thumbImg.onerror = () => { thumbImg.style.display = "none"; thumbFallback.style.display = "flex"; };
                    
                    // Pakai btn-primary, warna hijaunya disetting dari Tema Bunglon
                    actionBtns.innerHTML = `<button class="btn-primary" onclick="forceDownload('${data.url}', 'Moonlight_Spotify.mp3')"><i class="fab fa-spotify"></i> Download MP3</button>`;
                    saveToHistory(`Spotify: ${data.title}`, data.url);
                }
                else if (currentPlatform === 'tiktok') {
                    profileSec.style.display = 'none'; captionText.style.display = 'none';
                    if (data.photo && data.photo.length > 0) {
                        thumbCon.style.display = 'flex'; thumbImg.src = data.photo[0];
                        thumbImg.onload = () => { thumbImg.style.display = "block"; thumbFallback.style.display = "none"; }; thumbImg.onerror = () => { thumbImg.style.display = "none"; thumbFallback.style.display = "flex"; };
                        data.photo.forEach((imgUrl, index) => { 
                            actionBtns.innerHTML += `<button class="btn-primary" onclick="forceDownload('${imgUrl}', 'Moonlight_TikTok_${index+1}.jpg')"><i class="fas fa-image"></i> Download Foto ${index + 1}</button>`; 
                        });
                        if (data.audio) { 
                            actionBtns.innerHTML += `<button class="btn-secondary" onclick="forceDownload('${data.audio}', 'Moonlight_TikTok_Audio.mp3')"><i class="fas fa-music"></i> Download Audio</button>`; 
                        }
                        saveToHistory(`TikTok Slide (Foto)`, data.photo[0]);
                    } else {
                        thumbCon.style.display = 'none';
                        if (data.video) { 
                            actionBtns.innerHTML += `<button class="btn-primary" onclick="forceDownload('${data.video}', 'Moonlight_TikTok.mp4')"><i class="fas fa-video"></i> Download Video</button>`; 
                        }
                        if (data.videoHD) { 
                            actionBtns.innerHTML += `<button class="btn-primary" onclick="forceDownload('${data.videoHD}', 'Moonlight_TikTok_HD.mp4')"><i class="fas fa-video"></i> Download Video (HD)</button>`; 
                        }
                        if (data.audio) { 
                            actionBtns.innerHTML += `<button class="btn-secondary" onclick="forceDownload('${data.audio}', 'Moonlight_TikTok_Audio.mp3')"><i class="fas fa-music"></i> Download Audio</button>`; 
                        }
                        if (data.video || data.videoHD) {
                            saveToHistory(`Video TikTok`, data.video || data.videoHD);
                        }
                    }
                }
                else if (currentPlatform === 'ig') {
                    profileSec.style.display = 'none'; captionText.style.display = 'none'; thumbCon.style.display = 'none';
                    data.forEach((item, index) => { 
                        let typeText = item.type === "mp4" ? "Video" : "Gambar"; 
                        actionBtns.innerHTML += `<button class="btn-primary" onclick="forceDownload('${item.url}', 'Moonlight_IG_${index+1}.${item.type}')">Download ${typeText} ${index + 1}</button>`; 
                    });
                    if(data.length > 0) saveToHistory(`Media Instagram`, data[0].url);
                }
                else if (currentPlatform === 'pin') {
                    profileSec.style.display = 'none'; captionText.style.display = 'none'; thumbCon.style.display = 'none';
                    actionBtns.innerHTML = `<button class="btn-primary" onclick="forceDownload('${data.url}', 'Moonlight_Pinterest_Media')">Download Media (${data.size})</button>`;
                    saveToHistory(`Pinterest Media`, data.url);
                }
            }
        }
        else {
            let pesanErrorAPI = json.msg || json.message || "Gagal memproses data.";
            showToast("Info sistem: " + pesanErrorAPI, "error");
        }
    } catch (error) {
        console.error(error);
        showToast("Terjadi kesalahan sistem atau koneksi.", "error");
    } finally {
        loading.style.display = 'none';
        
        mainBtn.disabled = false;
        if(menuBtn) menuBtn.disabled = false;
        
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

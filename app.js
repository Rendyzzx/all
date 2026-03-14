const API_BASE = "/api/proses";

let currentPlatform = '';
const COOLDOWN_TIME = 15000;
let toastTimeout; 
let historyList = JSON.parse(localStorage.getItem('moonlight_history')) || [];
let offlineQueue = JSON.parse(localStorage.getItem('moonlight_queue')) || [];
const _imgStore = {};
let gameInterval;
let scoreInterval;
let gameScore = 0;
let isJumping = false;
let currentCatIndex = 0;

const categoryTitles = [
    "Media Downloader", 
    "Tools", 
    "AI", 
    "Stalk & Check", 
    "Entertainment & News", 
    "Digital & Info"
];
const totalCategories = 6;

function showHome() {
    if(navigator.vibrate) navigator.vibrate(10);
    const hour = new Date().getHours();
    let greeting = "Good Evening";
    if(hour >= 5 && hour < 12) greeting = "Good Morning";
    else if(hour >= 12 && hour < 17) greeting = "Good Afternoon";
    const greetEl = document.getElementById('greetingText');
    if(greetEl) greetEl.innerText = greeting;

    document.getElementById('homeDashboard').style.display = 'flex';
    document.getElementById('mainTitle').style.display = 'none';
    document.querySelector('.form-group').style.display = 'none';
    document.getElementById('resultCard').style.display = 'none';
    document.getElementById('loadingOverlay').style.display = 'none';
    
    document.documentElement.style.setProperty('--primary', '#2563eb');
    document.documentElement.style.setProperty('--primary-hover', '#1d4ed8');
    document.documentElement.style.setProperty('--ambient-glow', 'rgba(15, 23, 42, 0)');
    
    document.querySelectorAll('.bnav-item').forEach(btn => btn.classList.remove('active'));
    const defaultBtn = document.getElementById('bnav-all');
    if (defaultBtn) defaultBtn.classList.add('active');
    
    currentPlatform = '';
}

function updateCategoryUI() {
    const titleEl = document.getElementById('catTitle');
    if (titleEl) titleEl.innerText = categoryTitles[currentCatIndex];
    for (let i = 0; i < totalCategories; i++) {
        const page = document.getElementById('cat-page-' + i);
        if (page) {
            if (i === currentCatIndex) page.classList.add('active');
            else page.classList.remove('active');
        }
    }
    const dots = document.querySelectorAll('.cat-dot');
    dots.forEach((dot, index) => {
        if (index === currentCatIndex) dot.classList.add('active');
        else dot.classList.remove('active');
    });
}

function nextCat() {
    currentCatIndex = (currentCatIndex + 1) % totalCategories;
    if (navigator.vibrate) navigator.vibrate(20); 
    updateCategoryUI();
}

function prevCat() {
    currentCatIndex = (currentCatIndex - 1 + totalCategories) % totalCategories;
    if (navigator.vibrate) navigator.vibrate(20);
    updateCategoryUI();
}

function goToCat(index) {
    currentCatIndex = index;
    if (navigator.vibrate) navigator.vibrate(20);
    updateCategoryUI();
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    });
}

window.onload = function () {
    setTimeout(() => {
        const splash = document.getElementById('splashScreen');
        if (splash) splash.classList.add('splash-hidden');
    }, 2500);

    showHome();
    renderHistory();
    updateCategoryUI(); 
    
    if (!navigator.onLine) handleOffline();
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
};

function handleOffline() {
    const indicator = document.getElementById('offlineIndicator');
    if (indicator) indicator.style.display = 'block';
    showToast("Offline Mode Active. Requests will be queued.", "info");
}

function handleOnline() {
    const indicator = document.getElementById('offlineIndicator');
    if (indicator) indicator.style.display = 'none';
    showToast("Internet connected! Processing queue...", "success");
    setTimeout(() => { processQueue(); }, 1500);
}

function processQueue() {
    if (offlineQueue.length > 0) {
        const task = offlineQueue.shift();
        localStorage.setItem('moonlight_queue', JSON.stringify(offlineQueue));
        setPlatform(task.platform);
        setTimeout(() => {
            const mediaUrlInput = document.getElementById('mediaUrl');
            if (mediaUrlInput) mediaUrlInput.value = task.url || '';
            const textContentInput = document.getElementById('textContent');
            if (textContentInput) textContentInput.value = task.text || '';
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
        canvas.width = 50; canvas.height = 50;
        ctx.drawImage(img, 0, 0, 50, 50);
        try {
            const data = ctx.getImageData(0, 0, 50, 50).data;
            let r = 0, g = 0, b = 0, count = 0;
            for (let i = 0; i < data.length; i += 16) { r += data[i]; g += data[i+1]; b += data[i+2]; count++; }
            r = Math.floor(r / count); g = Math.floor(g / count); b = Math.floor(b / count);
            document.documentElement.style.setProperty('--ambient-glow', `rgba(${r}, ${g}, ${b}, 0.5)`);
        } catch(e) { document.documentElement.style.setProperty('--ambient-glow', 'rgba(15, 23, 42, 0)'); }
    };
    img.onerror = function() { document.documentElement.style.setProperty('--ambient-glow', 'rgba(15, 23, 42, 0)'); };
    img.src = finalSrc;
}

function applyDynamicTheme(platform) {
    const root = document.documentElement;
    let primary = '#2563eb';
    let hover = '#1d4ed8';
    
    const aiImageTools = ['hd-foto', 'remove-bg', 'noise-reduce', 'photo-editor', 'ai-detector', 'ai-anime', 'genimg', 'ai-real', 'waifu', 'koros'];
    const aiChatTools = ['gpt4', 'claude', 'gemini', 'bard', 'blackbox', 'felo', 'perplexity'];
    
    if (['youtube', 'yt-transcript', 'pin', 'tts'].includes(platform)) { primary = '#ef4444'; hover = '#dc2626'; } 
    else if (['tiktok', 'tt-stalk', 'shortlink'].includes(platform)) { primary = '#06b6d4'; hover = '#0891b2'; } 
    else if (['ig', 'ig-stalk'].includes(platform)) { primary = '#d946ef'; hover = '#c026d3'; } 
    else if (platform === 'facebook') { primary = '#1877f2'; hover = '#1462cb'; } 
    else if (['twitter', 'tw-stalk', 'th-stalk'].includes(platform)) { primary = '#475569'; hover = '#334155'; } 
    else if (['spotify', 'lirik', 'qr-gen'].includes(platform)) { primary = '#10b981'; hover = '#059669'; } 
    else if (aiImageTools.includes(platform)) { primary = '#8b5cf6'; hover = '#7c3aed'; } 
    else if (aiChatTools.includes(platform)) { primary = '#14b8a6'; hover = '#0d9488'; } 
    else if (['pulsa', 'topup', 'roblox-stalk'].includes(platform)) { primary = '#10b981'; hover = '#059669'; } 
    else if (['nulis', 'iqc', 'ss-web', 'dc-stalk', 'gh-stalk'].includes(platform)) { primary = '#f59e0b'; hover = '#d97706'; } 
    else if (['anime', 'anoboy', 'donghua', 'cnn', 'film'].includes(platform)) { primary = '#ef4444'; hover = '#dc2626'; }

    root.style.setProperty('--primary', primary);
    root.style.setProperty('--primary-hover', hover);
    root.style.setProperty('--ambient-glow', 'rgba(15, 23, 42, 0)');
}

function setPlatform(platform) {
    if (navigator.vibrate) navigator.vibrate(15);
    currentPlatform = platform;
    applyDynamicTheme(platform);

    document.getElementById('homeDashboard').style.display = 'none';
    const title = document.getElementById('mainTitle');
    title.style.display = 'block';
    const formGroup = document.querySelector('.form-group');
    formGroup.style.display = 'flex';

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
    
    [urlCont, textCont, fileCont, nominalCont, customAmountCont, providerCont, ytFormatCont, timeInputsCont, catboxHelper, contactCont].forEach(el => {
        if (el) el.style.display = 'none';
    });
    
    const resultCard = document.getElementById('resultCard');
    if (resultCard) resultCard.style.display = 'none'; 
    if (btn) btn.style.display = 'flex';

    if (platform === 'kontak') { 
        title.innerHTML = "Contact Owner"; contactCont.style.display = 'flex'; btn.style.display = 'none'; 
    } else if (platform === 'pulsa') { 
        title.innerHTML = "Top Up Mobile Credit"; document.getElementById('mediaUrl').placeholder = "Enter Phone Number (0812...)"; 
        document.getElementById('pulsaProvider').innerHTML = `<option value="pulsa-axis">AXIS</option><option value="pulsa-indosat">INDOSAT (IM3)</option><option value="pulsa-telkomsel">TELKOMSEL</option><option value="pulsa-tri">TRI (3)</option><option value="pulsa-xl">XL AXIATA</option>`;
        urlCont.style.display = 'flex'; providerCont.style.display = 'flex'; nominalCont.style.display = 'flex'; btn.innerHTML = 'Create Invoice'; 
    } else if (platform === 'topup') { 
        title.innerHTML = "E-Wallet Top Up"; document.getElementById('mediaUrl').placeholder = "Enter Account Number (0812...)"; 
        document.getElementById('pulsaProvider').innerHTML = `<option value="topup-dana">DANA</option><option value="topup-gopay">GOPAY</option><option value="topup-ovo">OVO</option><option value="topup-shopeepay">SHOPEEPAY</option>`;
        urlCont.style.display = 'flex'; providerCont.style.display = 'flex'; customAmountCont.style.display = 'flex'; btn.innerHTML = 'Create Invoice'; 
    } else if (platform === 'youtube') { 
        title.innerHTML = "Download YouTube"; document.getElementById('mediaUrl').placeholder = "Paste the YouTube video link here..."; 
        urlCont.style.display = 'flex'; ytFormatCont.style.display = 'flex'; btn.innerHTML = 'Download Now'; 
    } else if (['tiktok', 'ig', 'facebook', 'twitter', 'terabox', 'pin', 'spotify'].includes(platform)) {
        let pName = platform.charAt(0).toUpperCase() + platform.slice(1);
        if (platform === 'ig') pName = "Instagram"; if (platform === 'pin') pName = "Pinterest";
        title.innerHTML = `Download ${pName}`; document.getElementById('mediaUrl').placeholder = `Paste the ${pName} link here...`;
        urlCont.style.display = 'flex'; btn.innerHTML = 'Download Now';
    } else if (platform === 'lirik') { 
        title.innerHTML = "Song Lyrics Search"; document.getElementById('mediaUrl').placeholder = "Type song title (e.g., Perfect)..."; 
        urlCont.style.display = 'flex'; btn.innerHTML = 'Search Lyrics'; 
    } else if (platform === 'ss-web') { 
        title.innerHTML = "Website Screenshot"; document.getElementById('mediaUrl').placeholder = "Enter URL (https://...)"; 
        urlCont.style.display = 'flex'; btn.innerHTML = 'Take Screenshot'; 
    } else if (platform === 'yt-transcript') { 
        title.innerHTML = "YouTube Transcript"; document.getElementById('mediaUrl').placeholder = "Paste the YouTube video link here..."; 
        urlCont.style.display = 'flex'; btn.innerHTML = 'Extract Text Now'; 
    } else if (platform === 'qr-gen') { 
        title.innerHTML = "Create QR Code"; document.getElementById('textContent').placeholder = "Type link or secret text here..."; 
        textCont.style.display = 'flex'; btn.innerHTML = 'Generate QR Code'; 
    } else if (platform === 'shortlink') { 
        title.innerHTML = "URL Shortener"; document.getElementById('mediaUrl').placeholder = "Paste a long link to shorten..."; 
        urlCont.style.display = 'flex'; btn.innerHTML = 'Shorten Link'; 
    } else if (platform === 'tts') { 
        title.innerHTML = "Text to Speech AI"; document.getElementById('textContent').placeholder = "Type text to speak (Max 200 chars)..."; 
        textCont.style.display = 'flex'; btn.innerHTML = 'Convert to Voice'; 
    } else if (['ai-anime', 'genimg', 'ai-real', 'waifu'].includes(platform)) { 
        title.innerHTML = "Generate Image AI"; document.getElementById('textContent').placeholder = "Type prompt/command (in english)..."; 
        textCont.style.display = 'flex'; btn.innerHTML = 'Generate Image'; 
    } else if (['gpt4', 'claude', 'gemini', 'bard', 'blackbox', 'felo', 'perplexity'].includes(platform)) { 
        title.innerHTML = "AI Chatbot Assistant"; document.getElementById('textContent').placeholder = "Type your question or task here..."; 
        textCont.style.display = 'flex'; btn.innerHTML = 'Ask AI'; 
    } else if (platform === 'koros') { 
        title.innerHTML = "Koros Vision AI"; fileCont.style.display = 'flex'; document.getElementById('mediaFile').accept = "image/*";
        urlCont.style.display = 'flex'; document.getElementById('mediaUrl').placeholder = "Type a question about this image...";
        catboxHelper.innerHTML = `<i class="fas fa-info-circle"></i> Select a photo and ask AI something.`; catboxHelper.style.display = 'block'; btn.innerHTML = 'Ask AI'; 
    } else if (platform === 'ai-detector') { 
        title.innerHTML = "AI Text Detector"; document.getElementById('textContent').placeholder = "Paste article or text here..."; 
        textCont.style.display = 'flex'; btn.innerHTML = 'Detect Text Now'; 
    } else if (platform === 'iqc') { 
        title.innerHTML = "iPhone Quoted"; document.getElementById('textContent').placeholder = "Type or paste message text here..."; 
        textCont.style.display = 'flex'; timeInputsCont.style.display = 'flex'; btn.innerHTML = 'Create iPhone Quote'; 
    } else if (platform === 'nulis') { 
        title.innerHTML = "Auto Handwriting"; document.getElementById('textContent').placeholder = "Type or paste text for handwriting..."; 
        textCont.style.display = 'flex'; btn.innerHTML = 'Start Writing'; 
    } else if (['hd-foto', 'remove-bg', 'noise-reduce'].includes(platform)) { 
        if (platform === 'hd-foto') title.innerHTML = 'HD Photo Upscaler'; else if (platform === 'remove-bg') title.innerHTML = 'Remove Background'; else title.innerHTML = 'Audio Noise Reduce';
        fileCont.style.display = 'flex'; document.getElementById('mediaFile').accept = platform === 'noise-reduce' ? "audio/*" : "image/*";
        catboxHelper.innerHTML = `<i class="fas fa-info-circle"></i> Select file from device. (Max 4MB)`; catboxHelper.style.display = 'block'; btn.innerHTML = 'Process AI'; 
    } else if (platform === 'photo-editor') { 
        title.innerHTML = "Photo Editor AI"; fileCont.style.display = 'flex'; document.getElementById('mediaFile').accept = "image/*";
        urlCont.style.display = 'flex'; document.getElementById('mediaUrl').placeholder = "Type edit command...";
        catboxHelper.innerHTML = `<i class="fas fa-info-circle"></i> Select a photo, then type a command. (Max 4MB)`; catboxHelper.style.display = 'block'; btn.innerHTML = 'Edit Photo Now'; 
    } else if (['roblox-stalk', 'dc-stalk', 'tt-stalk', 'tw-stalk', 'gh-stalk', 'ig-stalk', 'th-stalk'].includes(platform)) {
        title.innerHTML = "Account Search"; document.getElementById('mediaUrl').placeholder = "Enter username or ID...";
        urlCont.style.display = 'flex'; btn.innerHTML = 'Search Account';
    } else if (['anime', 'anoboy', 'donghua', 'film'].includes(platform)) {
        let pName = platform === 'donghua' ? 'Donghua' : (platform === 'anime' ? 'Anime' : (platform === 'film' ? 'Movie' : 'Anoboy'));
        title.innerHTML = `Watch ${pName}`;
        document.getElementById('mediaUrl').placeholder = `Type ${platform === 'donghua' ? 'donghua' : (platform === 'film' ? 'movie' : 'anime')} title...`;
        urlCont.style.display = 'flex'; btn.innerHTML = `Search ${pName}`;
    } else if (platform === 'cnn') {
        title.innerHTML = "CNN Indonesia News"; document.getElementById('mediaUrl').placeholder = "Type search topic (optional)...";
        urlCont.style.display = 'flex'; btn.innerHTML = 'Read Latest News';
    }

    const mediaUrlInput = document.getElementById('mediaUrl'); if (mediaUrlInput) mediaUrlInput.value = '';
    const textContentInput = document.getElementById('textContent'); if (textContentInput) textContentInput.value = '';
    const mediaFileInput = document.getElementById('mediaFile'); if (mediaFileInput) mediaFileInput.value = '';
    const customAmountInput = document.getElementById('customAmount'); if (customAmountInput) customAmountInput.value = '';
    
    if (formGroup && title) {
        formGroup.style.animation = 'none'; title.style.animation = 'none';
        setTimeout(() => { formGroup.style.animation = ''; title.style.animation = ''; }, 10);
    }

    if (typeof FITUR !== 'undefined' && btn && platform !== 'kontak') {
        if (FITUR[platform] === false) {
            btn.innerHTML = '<i class="fas fa-tools"></i> Under Maintenance';
            btn.disabled = true; btn.style.background = '#475569'; btn.style.color = '#94a3b8';
            showToast("This feature is currently under maintenance.", "info");
        } else {
            btn.disabled = false; btn.style.background = ''; btn.style.color = '';
        }
    }
    closeModal();
}

document.getElementById('mediaFile').addEventListener('change', function(event) {
    if (event.target.files && event.target.files[0]) {
        const file = event.target.files[0];
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) { extractColorAndApply(e.target.result); };
            reader.readAsDataURL(file);
        }
    }
});

async function pasteToInput(elementId) { 
    try { 
        const text = await navigator.clipboard.readText(); 
        const inputElement = document.getElementById(elementId);
        if (inputElement) inputElement.value = text; 
    } catch (err) { showToast('Use Long Press > Paste manually.', 'info'); } 
}

function copyTranscript() { 
    const textElement = document.getElementById('ytTranscriptText');
    if (!textElement) return;
    navigator.clipboard.writeText(textElement.innerText).then(() => { 
        const btn = document.getElementById('copyTranscriptBtn'); 
        if (btn) { btn.innerHTML = 'Copied'; setTimeout(() => { btn.innerHTML = 'Copy Text'; }, 2000); }
    }); 
}

function copyLirik() { 
    const lirikElement = document.getElementById('lirikText');
    if (!lirikElement) return;
    navigator.clipboard.writeText(lirikElement.innerText).then(() => { 
        const btn = document.getElementById('copyLirikBtn'); 
        if (btn) { btn.innerHTML = 'Copied'; setTimeout(() => { btn.innerHTML = 'Copy Lyrics'; }, 2000); }
    }); 
}

function copyShortlink() { 
    const shortlinkEl = document.getElementById('shortlinkText');
    if (!shortlinkEl) return;
    navigator.clipboard.writeText(shortlinkEl.value).then(() => { 
        const btn = document.getElementById('copyShortlinkBtn'); 
        if (btn) { btn.innerHTML = '<i class="fas fa-check"></i> Copied'; setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy"></i> Copy Link'; }, 2000); }
    }); 
}

function copyAiChat() { 
    const chatEl = document.getElementById('aiChatText');
    if (!chatEl) return;
    navigator.clipboard.writeText(chatEl.innerText).then(() => { 
        const btn = document.getElementById('copyAiChatBtn'); 
        if (btn) { btn.innerHTML = '<i class="fas fa-check"></i> Copied'; setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy"></i> Copy Answer'; }, 2000); }
    }); 
}

async function fetchLirik(url) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    const miniGame = document.getElementById('miniGame');
    
    if (loadingOverlay) loadingOverlay.style.display = 'block'; 
    if (miniGame) miniGame.style.display = 'none';
    if (loadingText) loadingText.innerText = "Fetching lyrics...";
    
    try {
        const payload = { action: 'lyric', params: { q: url } };
        const res = await fetch(API_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const json = await res.json();
        
        if (json.status === true) {
            const listContainer = document.getElementById('lirikList');
            if (listContainer) listContainer.style.display = 'none';
            const lirikTitleEl = document.getElementById('lirikTitle') || document.querySelector('#lirikResult h3');
            if (lirikTitleEl) lirikTitleEl.innerText = json.data.title || "Song Lyrics";
            const lirikText = document.getElementById('lirikText');
            if (lirikText) lirikText.innerText = json.data.lyric || "Lyrics not available.";
            const lirikWrapper = document.getElementById('lirikContentWrapper');
            if (lirikWrapper) lirikWrapper.style.display = 'block';
        } else { showToast("Failed to load lyrics.", "error"); }
    } catch (error) { showToast("Network error.", "error"); } finally { if (loadingOverlay) loadingOverlay.style.display = 'none'; }
}

function showToast(message, type = 'error') {
    const toast = document.getElementById("toast");
    const toastIcon = document.getElementById("toastIcon");
    const toastMessage = document.getElementById("toastMessage");
    if (!toast || !toastIcon || !toastMessage) return;

    toast.className = "toast"; toastIcon.className = ""; toast.classList.add(type);
    if (type === 'error') toastIcon.className = 'fas fa-exclamation-circle';
    else if (type === 'success') toastIcon.className = 'fas fa-check-circle';
    else if (type === 'info') toastIcon.className = 'fas fa-info-circle';

    toastMessage.innerText = message; toast.classList.add("show");
    if (navigator.vibrate) navigator.vibrate(type === 'error' ? [50, 50, 50] : 30);
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(function() { toast.classList.remove("show"); }, 3000);
}

function saveToHistory(title, link) {
    if (!link || typeof link !== 'string' || link.trim() === '') return;
    let finalLink = link;
    if (link.length > 1000 && !link.startsWith('http') && !link.startsWith('data:image')) {
        finalLink = 'data:image/png;base64,' + link;
    }
    const newItem = { id: Date.now(), title: title, link: finalLink, date: new Date().toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' }) };
    historyList.unshift(newItem);
    if (historyList.length > 10) historyList.pop(); 
    localStorage.setItem('moonlight_history', JSON.stringify(historyList)); renderHistory();
}

function renderHistory() {
    const container = document.getElementById('historyListContainer');
    if (!container) return;
    if (historyList.length === 0) {
        container.innerHTML = `<div class="history-empty"><i class="fas fa-folder-open" style="font-size:32px; margin-bottom:12px; color:#475569;"></i><br>No download history yet.</div>`;
        return;
    }
    container.innerHTML = '';
    historyList.forEach(item => {
        container.innerHTML += `<div class="history-item"><div class="history-info"><h4>${item.title}</h4><p>${item.date}</p></div><div class="history-actions"><button onclick="forceDownload('${item.link}', 'Moonlight_History_${item.id}')"><i class="fas fa-download"></i></button></div></div>`;
    });
}

function clearHistory() {
    if (confirm("Are you sure you want to clear all history?")) { historyList = []; localStorage.removeItem('moonlight_history'); renderHistory(); showToast("History cleared successfully", "success"); }
}

function openHistory() { if (navigator.vibrate) navigator.vibrate(15); renderHistory(); const modal = document.getElementById('historyModal'); if (modal) modal.style.display = 'flex'; }
function closeHistory() { const modal = document.getElementById('historyModal'); if (modal) modal.style.display = 'none'; }

async function forceDownload(url, filename) {
    if (!url) return showToast("Invalid URL", "error");
    if (navigator.vibrate) navigator.vibrate(20);
    const isBase64 = url.startsWith('data:image') || (url.length > 500 && !url.startsWith('http'));
    if (isBase64) {
        try {
            showToast("Processing file...", "info");
            const res = await fetch('/api/proses', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'upload-only', params: {}, fileData: { base64: url.startsWith('data:') ? url : 'data:image/png;base64,' + url, mimeType: 'image/png', fileName: filename || 'Moonlight.png' } })
            });
            const json = await res.json();
            if (json.url) url = json.url;
        } catch(e) {}
    }
    showToast("Opening for download...", "info"); window.location.href = url;
}

function openPip(url) {
    const overlay = document.getElementById('pipOverlay'); const video = document.getElementById('pipVideo');
    if (overlay && video) { video.src = url; overlay.style.display = 'block'; video.play(); }
}

function closePip() { 
    const video = document.getElementById('pipVideo'); const overlay = document.getElementById('pipOverlay'); 
    if (video) video.pause(); if (overlay) overlay.style.display = 'none'; 
}

function openCategory(catIndexOrCurrent, btnId) {
    if (navigator.vibrate) navigator.vibrate(15);
    document.querySelectorAll('.bnav-item').forEach(btn => { btn.classList.remove('active'); });
    if (btnId) { const targetBtn = document.getElementById(btnId); if (targetBtn) targetBtn.classList.add('active'); }
    const modal = document.getElementById('featuresModal'); if (modal) modal.style.display = 'flex';
    if (catIndexOrCurrent !== 'current') goToCat(parseInt(catIndexOrCurrent)); else updateCategoryUI();
}

function closeModal() { 
    const modal = document.getElementById('featuresModal'); if (modal) modal.style.display = 'none'; 
    document.querySelectorAll('.bnav-item').forEach(btn => { btn.classList.remove('active'); });
    const defaultBtn = document.getElementById('bnav-all'); if (defaultBtn) defaultBtn.classList.add('active');
}

window.onclick = function (event) { 
    const featuresModal = document.getElementById('featuresModal'); const historyModal = document.getElementById('historyModal');
    if (event.target == featuresModal) closeModal(); 
    if (event.target == historyModal) closeHistory(); 
};

function checkCooldown() {
    const lastAction = localStorage.getItem('lastMoonlightAction');
    if (lastAction) {
        const diff = Date.now() - parseInt(lastAction, 10);
        if (diff < COOLDOWN_TIME) { const remaining = Math.ceil((COOLDOWN_TIME - diff) / 1000); showToast(`Wait ${remaining} seconds.`, 'info'); return false; }
    }
    return true;
}

function setCooldown() { localStorage.setItem('lastMoonlightAction', Date.now().toString()); }

function moonJump() {
    const player = document.getElementById('moonPlayer');
    if (player && !isJumping) {
        isJumping = true; player.classList.add('anim-jump'); if (navigator.vibrate) navigator.vibrate(30);
        setTimeout(() => { player.classList.remove('anim-jump'); isJumping = false; }, 500); 
    }
}

function startGameLoop() {
    const player = document.getElementById('moonPlayer'); const obstacle = document.getElementById('meteorObstacle'); const scoreEl = document.getElementById('gameScore');
    if (!player || !obstacle || !scoreEl) return;
    clearInterval(gameInterval); clearInterval(scoreInterval);
    obstacle.style.animation = "none"; void obstacle.offsetWidth; 
    gameScore = 0; scoreEl.innerText = `Score: 0`; scoreEl.style.color = 'var(--primary)';
    obstacle.style.animation = `obstacleMove 1.2s infinite linear`;
    scoreInterval = setInterval(() => { gameScore += 10; scoreEl.innerText = `Score: ${gameScore}`; }, 100);

    gameInterval = setInterval(() => {
        const playerRect = player.getBoundingClientRect(); const obstacleRect = obstacle.getBoundingClientRect();
        if (playerRect.left < obstacleRect.right && playerRect.right > obstacleRect.left && playerRect.top < obstacleRect.bottom && playerRect.bottom > obstacleRect.top) {
            obstacle.style.animation = "none"; obstacle.style.left = (obstacleRect.left - playerRect.left + 30) + "px"; 
            clearInterval(gameInterval); clearInterval(scoreInterval);
            scoreEl.innerText = `Final Score: ${gameScore} | Reloading...`; scoreEl.style.color = '#ef4444';
            if (navigator.vibrate) navigator.vibrate([50,50,50]);
            setTimeout(() => { const overlay = document.getElementById('loadingOverlay'); if (overlay && overlay.style.display === 'block') startGameLoop(); }, 1500);
        }
    }, 30);
}

function stopGameLoop() {
    clearInterval(gameInterval); clearInterval(scoreInterval);
    const obstacle = document.getElementById('meteorObstacle'); if (obstacle) obstacle.style.animation = "none";
}

function renderEntList(items, type) {
    document.querySelectorAll('#resultCard > div').forEach(el => { el.style.display = 'none'; });
    const resultCard = document.getElementById('resultCard'); resultCard.style.display = 'block';

    let html = `<h3 style="margin-bottom:16px; color:#fff; font-size:18px;">Select Article / Movie:</h3><div style="display:flex; flex-direction:column; gap:12px;">`;
    if (!Array.isArray(items) || items.length === 0) {
        html += `<div style="text-align:center; padding:40px 20px; background:#1e293b; border-radius:12px; border:1px solid var(--border-color);"><i class="fas fa-search-minus" style="font-size:40px; color:#ef4444; margin-bottom:16px;"></i><p style="color:#f8fafc; font-weight:600; margin:0; font-size: 16px;">Not Found</p><p style="color:var(--text-muted); font-size:13px; margin-top:8px;">Enter the correct name or try a different keyword.</p></div>`;
    } else {
        items.forEach(item => {
            let thumb = item.thumbnail || 'https://via.placeholder.com/150x200?text=No+Image';
            let showImg = !!item.thumbnail && type !== 'cnn' && type !== 'film'; 
            let tagsHtml = '';
            if (item.type) {
                tagsHtml = `<span style="font-size:11px; color:#fff; background:var(--primary); padding:4px 8px; border-radius:6px; align-self:flex-start; margin-bottom:12px; font-weight:600;">${item.type}</span>`;
            } else if (item.quality || item.rating) {
                tagsHtml = `<div style="display:flex; gap:6px; margin-bottom:12px;">${item.quality ? `<span style="font-size:11px; color:#fff; background:var(--primary); padding:4px 8px; border-radius:6px; font-weight:600;">${item.quality}</span>` : ''}${item.rating ? `<span style="font-size:11px; color:#fff; background:#f59e0b; padding:4px 8px; border-radius:6px; font-weight:600;"><i class="fas fa-star"></i> ${item.rating}</span>` : ''}</div>`;
            }
            html += `<div style="display:flex; background:#1e293b; border-radius:12px; overflow:hidden; border:1px solid var(--border-color);">${showImg ? `<img src="${thumb}" style="width:90px; object-fit:cover;">` : ''}<div style="padding:16px; flex:1; display:flex; flex-direction:column; justify-content:center;"><h4 style="font-size:14px; margin:0 0 8px 0; color:#fff;">${item.title}</h4>${tagsHtml}<button class="btn-primary" style="padding:10px; font-size:13px; width:100%; border-radius:8px;" onclick="fetchEntDetails('${item.url}', '${type}')"><i class="fas ${type==='cnn' ? 'fa-book-open' : 'fa-play'}"></i> ${type==='cnn' ? 'Read News' : 'Select This'}</button></div></div>`;
        });
    }
    html += `</div>`;
    let container = document.getElementById('entertainmentResult');
    container.innerHTML = html; container.style.display = 'block';
}

async function fetchEntDetails(url, type) {
    if (navigator.vibrate) navigator.vibrate(15);
    document.getElementById('loadingOverlay').style.display = 'block';
    document.getElementById('resultCard').style.display = 'none';

    let action = '';
    if (type === 'anime') action = 'anime-get';
    else if (type === 'anoboy') action = 'anoboy-get';
    else if (type === 'donghua') action = 'donghua-get';
    else if (type === 'film') action = 'film-get'; 
    else if (type === 'cnn') action = 'cnn';

    try {
        const res = await fetch(API_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: action, params: { url: url } }) });
        const json = await res.json();
        if (json.status) {
            let detailData = json.data;
            if (type === 'film') { detailData.stream = json.stream || []; detailData.download = json.download || []; }
            renderEntDetails(detailData, type);
        } else {
            showToast("Failed to fetch detail data.", "error"); document.getElementById('resultCard').style.display = 'block';
        }
    } catch(e) {
        showToast("Network error.", "error"); document.getElementById('resultCard').style.display = 'block';
    } finally { document.getElementById('loadingOverlay').style.display = 'none'; }
}

function renderEntDetails(data, type) {
    let container = document.getElementById('entertainmentResult');
    let html = `<button onclick="document.getElementById('mainBtn').click()" style="background:transparent; border:none; color:var(--primary); font-size:14px; margin-bottom:16px; cursor:pointer; display:flex; align-items:center; gap:6px; font-weight:600;"><i class="fas fa-arrow-left"></i> Back</button>`;
    
    if (type === 'cnn') {
        html += `<img src="${data.thumbnail}" style="width:100%; border-radius:12px; margin-bottom:16px;"><h3 style="margin-bottom:8px; font-size:18px; text-align:left; color:#fff;">${data.title}</h3><p style="font-size:12px; color:var(--text-muted); margin-bottom:20px;">By: ${data.author} | ${data.posted_at}</p><div style="font-size:14px; line-height:1.6; color:#cbd5e1; white-space:pre-wrap; background:#1e293b; padding:16px; border-radius:12px; margin-bottom:16px;">${data.content}</div><a href="${data.source}" target="_blank" class="btn-primary" style="margin-top:16px; text-align:center; display:block; text-decoration:none;"><i class="fas fa-external-link-alt"></i> Read Original Source</a>`;
    } else if (type === 'film') {
        html += `<div style="display:flex; gap:16px; margin-bottom:16px; align-items:flex-start;"><img src="${data.thumbnail}" style="width:110px; border-radius:12px; object-fit:cover; border:1px solid var(--border-color);"><div style="flex:1;"><h3 style="font-size:16px; margin:0 0 10px 0; text-align:left; color:#fff; line-height:1.3;">${data.title}</h3><p style="font-size:12px; color:var(--text-muted); margin:0 0 6px 0;"><strong>Rating:</strong> <i class="fas fa-star" style="color:#f59e0b;"></i> ${data.rating || 'N/A'}</p><p style="font-size:12px; color:var(--text-muted); margin:0 0 6px 0;"><strong>Quality:</strong> ${data.quality || '-'}</p><p style="font-size:12px; color:var(--text-muted); margin:0;"><strong>Genre:</strong> ${data.tags || '-'}</p></div></div><div style="font-size:12px; color:#cbd5e1; margin-bottom:24px; max-height:100px; overflow-y:auto; background:#1e293b; padding:12px; border-radius:12px; line-height:1.5;">${data.synopsis || 'No description available.'}</div>`;
        if (data.stream && data.stream.length > 0) {
            html += `<h4 style="margin-bottom:12px; color:var(--primary); font-size:15px;"><i class="fas fa-play-circle"></i> Watch Now</h4><div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:20px;">`;
            data.stream.forEach((s) => { html += `<a href="${s.url}" target="_blank" class="btn-primary" style="padding:10px 12px; flex:1; text-align:center; text-decoration:none; font-size:13px; border-radius:8px; min-width:45%;"><i class="fas fa-play"></i> ${s.server}</a>`; });
            html += `</div>`;
        }
        if (data.download && data.download.length > 0) {
            html += `<h4 style="margin-bottom:12px; color:var(--primary); font-size:15px;"><i class="fas fa-download"></i> Download Links</h4><div style="display:flex; flex-wrap:wrap; gap:8px;">`;
            data.download.forEach((d) => { html += `<a href="${d.url}" target="_blank" class="btn-secondary" style="padding:10px 12px; text-align:center; text-decoration:none; font-size:12px; border-radius:8px;"><i class="fas fa-link"></i> ${d.provider}</a>`; });
            html += `</div>`;
        }
    } else {
        let epList = data.episode || data.episodes || [];
        html += `<div style="display:flex; gap:16px; margin-bottom:16px; align-items:flex-start;"><img src="${data.thumbnail}" style="width:110px; border-radius:12px; object-fit:cover; border:1px solid var(--border-color);"><div style="flex:1;"><h3 style="font-size:16px; margin:0 0 10px 0; text-align:left; color:#fff; line-height:1.3;">${data.title}</h3><p style="font-size:12px; color:var(--text-muted); margin:0 0 6px 0;"><strong>Status:</strong> ${data.status || data.metadata?.status || 'Unknown'}</p><p style="font-size:12px; color:var(--text-muted); margin:0 0 6px 0;"><strong>Type:</strong> ${data.type || data.metadata?.type || '-'}</p><p style="font-size:12px; color:var(--text-muted); margin:0;"><strong>Eps:</strong> ${epList.length}</p></div></div><div style="font-size:12px; color:#cbd5e1; margin-bottom:24px; max-height:100px; overflow-y:auto; background:#1e293b; padding:12px; border-radius:12px; line-height:1.5;">${data.synopsis || data.description || 'No description available.'}</div><h4 style="margin-bottom:16px; color:#fff;">Select Episode:</h4><div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(85px, 1fr)); gap:8px;">`;
        epList.forEach(ep => {
            let epText = ep.episode || "EP"; let shortLabel = epText;
            if (type === 'anime') {
                if (epText.toLowerCase().includes('batch')) { shortLabel = "Batch"; } 
                else { let epMatch = epText.match(/(?:Episode|Eps)\s*(\d+(\.\d+)?)/i); if (epMatch) { shortLabel = "Eps " + epMatch[1]; } else if (epText.toLowerCase().includes('movie')) { shortLabel = "Movie"; } else { let parts = epText.split(/[-—]/); shortLabel = parts[parts.length - 1].trim(); if (shortLabel.length > 20) shortLabel = shortLabel.substring(0, 17) + "..."; } }
            } else {
                let numMatch = epText.match(/(\d+(\.\d+)?)/); if (numMatch && epText.length < 15) { shortLabel = "Eps " + numMatch[1]; } else if (epText.length > 15) { shortLabel = epText.substring(0, 12) + "..."; }
            }
            if (type === 'anime') {
                let epId = 'anime_ep_' + Math.random().toString(36).substr(2, 9); window[epId] = ep.link;
                html += `<button class="btn-secondary" style="padding:10px; font-size:13px; border-radius:8px; word-break:break-word; line-height:1.2;" onclick="renderAnimeLinks('${epId}', '${data.title} ${shortLabel}')">${shortLabel}</button>`;
            } else {
                html += `<button class="btn-secondary" style="padding:10px; font-size:13px; border-radius:8px; word-break:break-word; line-height:1.2;" onclick="fetchEntVideo('${ep.url}', '${type}')">${shortLabel}</button>`;
            }
        });
        html += `</div><div id="videoLinkContainer" style="margin-top:24px;"></div>`;
    }

    container.innerHTML = html;
    document.getElementById('resultCard').style.display = 'block';
    container.style.display = 'block';
}

function renderAnimeLinks(epId, titleLabel) {
    if (navigator.vibrate) navigator.vibrate(10);
    let links = window[epId] || [];
    let html = `<h4 style="margin-bottom:12px; color:var(--primary); font-size:15px;"><i class="fas fa-film"></i> Streaming & Download <br><span style="font-size:12px; color:var(--text-muted);">${titleLabel}</span></h4>`;
    links.forEach(q => {
        html += `<div style="margin-bottom:12px; background:#1e293b; padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,0.05);"><strong style="display:block; margin-bottom:10px; color:#fff; font-size:13px;">${q.quality}</strong><div style="display:flex; flex-wrap:wrap; gap:8px;">`;
        q.url.forEach(link => { html += `<a href="${link.url}" target="_blank" class="btn-primary" style="padding:8px 12px; font-size:12px; text-decoration:none; border-radius:8px; flex-grow:1; text-align:center;">${link.server}</a>`; });
        html += `</div></div>`;
    });
    const vCont = document.getElementById('videoLinkContainer'); vCont.innerHTML = html; vCont.scrollIntoView({behavior: 'smooth'});
}

async function fetchEntVideo(url, type) {
    if (navigator.vibrate) navigator.vibrate(10);
    const vCont = document.getElementById('videoLinkContainer');
    vCont.innerHTML = `<div style="text-align:center; padding:20px;"><i class="fas fa-spinner fa-spin" style="font-size:24px; color:var(--primary);"></i><p style="margin-top:10px; font-size:13px; color:var(--text-muted);">Preparing server...</p></div>`;
    vCont.scrollIntoView({behavior: 'smooth'});
    let action = type === 'anoboy' ? 'anoboy-episode' : 'donghua-episode';
    try {
        const res = await fetch(API_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: action, params: { url: url } }) });
        const json = await res.json();
        if (json.status) {
            let data = json.data;
            let html = `<h4 style="margin-bottom:12px; color:var(--primary); font-size:15px;"><i class="fas fa-play-circle"></i> Watch Now</h4>`;
            if (data.streaming && data.streaming.length > 0) {
                html += `<div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px;">`;
                data.streaming.forEach((s, idx) => { let serverName = s.server || `Server ${idx + 1}`; html += `<a href="${s.url}" target="_blank" class="btn-primary" style="padding:12px; flex:1; text-align:center; text-decoration:none; font-size:13px; border-radius:8px; min-width:45%;"><i class="fas fa-play"></i> Play (${serverName})</a>`; });
                html += `</div>`;
            }
            if (data.download) {
                if (typeof data.download === 'string') {
                    html += `<a href="${data.download}" target="_blank" class="btn-secondary" style="padding:12px; display:block; text-align:center; text-decoration:none; font-size:13px; border-radius:8px;"><i class="fas fa-download"></i> Download Video</a>`;
                } else {
                    html += `<div style="background:#1e293b; padding:16px; border-radius:12px; border:1px solid rgba(255,255,255,0.05);"><strong style="display:block; margin-bottom:10px; color:#fff; font-size:13px;">Download Servers:</strong><div style="display:flex; flex-wrap:wrap; gap:8px;">`;
                    for (let key in data.download) { html += `<a href="${data.download[key]}" target="_blank" class="btn-secondary" style="padding:8px 12px; font-size:12px; text-decoration:none; border-radius:8px;">${key}</a>`; }
                    html += `</div></div>`;
                }
            }
            vCont.innerHTML = html;
        } else { vCont.innerHTML = `<p style="color:#ef4444; text-align:center; padding:16px; background:rgba(239,68,68,0.1); border-radius:12px;">Failed to fetch video link.</p>`; }
    } catch (e) { vCont.innerHTML = `<p style="color:#ef4444; text-align:center; padding:16px; background:rgba(239,68,68,0.1); border-radius:12px;">Network error while loading server.</p>`; }
}

async function processAction(isFromQueue = false) {
    if (navigator.vibrate) navigator.vibrate(20);
    if (typeof FITUR !== 'undefined' && FITUR[currentPlatform] === false) return showToast("This feature is currently under maintenance.", "error");

    const mainBtn = document.getElementById('mainBtn');
    let mediaUrlInput = document.getElementById('mediaUrl'); let urlVal = mediaUrlInput ? mediaUrlInput.value.trim() : "";
    let textContentInput = document.getElementById('textContent'); let textVal = textContentInput ? textContentInput.value.trim() : "";
    let phoneTime = ""; let chatTime = ""; let ytType = ""; let ytQuality = ""; let providerData = ""; let amountData = "";
    
    if (['roblox-stalk', 'dc-stalk', 'tt-stalk', 'tw-stalk', 'gh-stalk', 'ig-stalk', 'th-stalk'].includes(currentPlatform)) { if (urlVal.startsWith('@')) urlVal = urlVal.substring(1); }

    if (['ai-detector', 'iqc', 'nulis', 'qr-gen', 'tts', 'ai-anime', 'blackbox', 'gpt4', 'claude', 'genimg', 'bard', 'gemini', 'ai-real', 'waifu', 'felo', 'perplexity'].includes(currentPlatform)) {
        if (!textVal) return showToast("Please enter text first.", "error");
        if (currentPlatform === 'iqc') {
            phoneTime = document.getElementById('phoneTime').value; chatTime = document.getElementById('chatTime').value;
            if (!phoneTime || !chatTime) return showToast("Set the time first.", "error");
        }
    } else if (currentPlatform === 'pulsa' || currentPlatform === 'topup') {
        providerData = document.getElementById('pulsaProvider').value;
        if (currentPlatform === 'pulsa') { amountData = document.getElementById('pulsaNominal').value; } 
        else { amountData = document.getElementById('customAmount').value; if (!amountData || parseInt(amountData, 10) < 10000) return showToast("Enter a minimum amount of 10,000.", "error"); }
        if (!urlVal || urlVal.length < 9) return showToast("Enter a valid number.", "error");
    } else if (currentPlatform === 'youtube') {
        if (!urlVal) return showToast("Please paste URL first.", "error");
        const formatVal = document.getElementById('ytFormat').value.split('|'); ytType = formatVal[0]; ytQuality = formatVal[1];
    } else if (['hd-foto', 'remove-bg', 'noise-reduce', 'photo-editor', 'koros'].includes(currentPlatform)) {
        const fileInput = document.getElementById('mediaFile');
        if (!fileInput || fileInput.files.length === 0) return showToast("Please select a file first.", "error");
        if (fileInput.files[0].size > 4 * 1024 * 1024) return showToast("Maximum file size is 4MB.", "error");
        if (currentPlatform === 'photo-editor' && !urlVal) return showToast("Type edit command.", "error");
        if (currentPlatform === 'koros' && !urlVal) return showToast("Type a question for this image.", "error");
    } else if (currentPlatform === 'shortlink' && !urlVal) { return showToast("Please enter URL link.", "error");
    } else if (currentPlatform === 'lirik' && !urlVal) { return showToast("Please enter song title.", "error");
    } else if (['anime', 'anoboy', 'donghua', 'film'].includes(currentPlatform) && !urlVal) { return showToast("Please type the title to search.", "error");
    } else if (!['hd-foto', 'remove-bg', 'noise-reduce', 'cnn'].includes(currentPlatform) && !urlVal && !textVal) { return showToast("Please fill in the input field.", "error"); }

    if (!navigator.onLine && currentPlatform !== 'kontak') {
        offlineQueue.push({ platform: currentPlatform, url: urlVal, text: textVal });
        localStorage.setItem('moonlight_queue', JSON.stringify(offlineQueue));
        showToast("Saved to offline queue", "info"); return;
    }

    if (!isFromQueue) { if (!checkCooldown()) return; setCooldown(); }

    if (mainBtn) { mainBtn.disabled = true; mainBtn.innerHTML = "Processing..."; }
    const loadingOverlay = document.getElementById('loadingOverlay'); if (loadingOverlay) loadingOverlay.style.display = 'block'; 
    const resultCard = document.getElementById('resultCard'); if (resultCard) resultCard.style.display = 'none'; 
    document.querySelectorAll('#resultCard > div').forEach(el => { el.style.display = 'none'; });

    const aiTools = ['hd-foto', 'remove-bg', 'noise-reduce', 'photo-editor', 'ai-anime', 'blackbox', 'gpt4', 'claude', 'genimg', 'bard', 'gemini', 'ai-real', 'waifu', 'felo', 'perplexity', 'koros'];
    const miniGame = document.getElementById('miniGame'); const loadingText = document.getElementById('loadingText');
    
    if (aiTools.includes(currentPlatform)) {
        if (miniGame) miniGame.style.display = 'block';
        if (loadingText) loadingText.innerHTML = `Processing AI, play for a bit...`; startGameLoop();
    } else {
        if (miniGame) miniGame.style.display = 'none';
        if (loadingText) loadingText.innerText = "Processing request...";
    }

    if (['qr-gen', 'shortlink', 'tts'].includes(currentPlatform)) {
        setTimeout(async () => {
            const mainResultCard = document.getElementById('resultCard'); if (mainResultCard) mainResultCard.style.display = 'block';
            if (currentPlatform === 'qr-gen') {
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(textVal)}`;
                document.getElementById('qrResult').style.display = 'block'; document.getElementById('qrImage').src = qrUrl;
                document.getElementById('qrActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${qrUrl}', 'Moonlight_QRCode.png')"><i class="fas fa-download"></i> Save QR Code</button>`;
                saveToHistory(`QR Code`, qrUrl); showToast("Successfully generated QR Code!", "success");
            } else if (currentPlatform === 'shortlink') {
                try {
                    const res = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(urlVal)}`); const json = await res.json();
                    if (json.shorturl) {
                        document.getElementById('shortlinkResult').style.display = 'block'; document.getElementById('shortlinkText').value = json.shorturl;
                        saveToHistory(`Shortlink`, json.shorturl); showToast("Link successfully shortened!", "success");
                    } else throw new Error("Invalid");
                } catch(e) { if (mainResultCard) mainResultCard.style.display = 'none'; showToast("Failed to shorten link. Ensure URL format is correct.", "error"); }
            } else if (currentPlatform === 'tts') {
                const safeText = textVal.substring(0, 200); const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(safeText)}`;
                document.getElementById('ttsResult').style.display = 'block'; document.getElementById('ttsPlayer').src = ttsUrl;
                document.getElementById('ttsActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${ttsUrl}', 'Moonlight_Voice.mp3')"><i class="fas fa-download"></i> Save Voice</button>`;
                saveToHistory(`Voice TTS`, ttsUrl); showToast("Successfully processed voice!", "success");
            }
            if (loadingOverlay) loadingOverlay.style.display = 'none';
            if (mainBtn) { 
                mainBtn.disabled = false; 
                if (currentPlatform === 'qr-gen') mainBtn.innerHTML = 'Generate QR Code'; 
                else if (currentPlatform === 'shortlink') mainBtn.innerHTML = 'Shorten Link'; 
                else if (currentPlatform === 'tts') mainBtn.innerHTML = 'Convert to Voice'; 
            }
        }, 1000);
        return; 
    }

    try {
        let finalInputData = urlVal || textVal; let fileBase64Obj = null; let uploadedFileUrl = ""; 
        if (['hd-foto', 'remove-bg', 'noise-reduce', 'photo-editor', 'koros'].includes(currentPlatform)) {
            const file = document.getElementById('mediaFile').files[0];
            const base64String = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error("Failed reading file")); reader.readAsDataURL(file); });
            fileBase64Obj = { base64: base64String, fileName: file.name, mimeType: file.type }; finalInputData = urlVal; 
            try {
                const upRes = await fetch(API_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'upload-only', params: {}, fileData: fileBase64Obj }) });
                const upJson = await upRes.json();
                if (upJson.url) { uploadedFileUrl = upJson.url; fileBase64Obj = null; }
            } catch(e) {}
        }

        let action = ''; let params = {};
        if (currentPlatform === 'pulsa' || currentPlatform === 'topup') { action = providerData; params = { number: finalInputData, amount: parseInt(amountData, 10) }; } 
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
        else if (currentPlatform === 'lirik') { action = 'lyric'; params = { q: finalInputData }; } 
        else if (currentPlatform === 'roblox-stalk') { action = 'roblox'; params = { username: finalInputData }; } 
        else if (currentPlatform === 'dc-stalk') { action = 'discord'; params = { id: finalInputData }; } 
        else if (currentPlatform === 'tt-stalk') { action = 'tiktokstalk'; params = { username: finalInputData }; } 
        else if (currentPlatform === 'tw-stalk') { action = 'twitterstalk'; params = { username: finalInputData }; } 
        else if (currentPlatform === 'gh-stalk') { action = 'github'; params = { username: finalInputData }; } 
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
        else if (currentPlatform === 'hd-foto') { action = 'upscale'; params = { image: uploadedFileUrl || "" }; } 
        else if (currentPlatform === 'noise-reduce') { action = 'noice-reducer'; params = { file: uploadedFileUrl || "" }; } 
        else if (currentPlatform === 'remove-bg') { action = 'nobg'; params = { image: uploadedFileUrl || "" }; } 
        else if (currentPlatform === 'photo-editor') { action = 'photo-editor'; params = { image: uploadedFileUrl || "", q: finalInputData }; } 
        else if (currentPlatform === 'koros') { action = 'koros'; params = { image: uploadedFileUrl || "", q: finalInputData }; } 
        else if (currentPlatform === 'anime') { action = 'anime'; params = { q: finalInputData }; } 
        else if (currentPlatform === 'anoboy') { action = 'anoboy'; params = { q: finalInputData }; } 
        else if (currentPlatform === 'donghua') { action = 'donghub'; params = { q: finalInputData }; } 
        else if (currentPlatform === 'cnn') { action = 'cnn'; params = finalInputData ? { q: finalInputData } : {}; } 
        else if (currentPlatform === 'film') { action = 'film'; params = { q: finalInputData }; }

        const payload = { action: action, params: params };
        if (fileBase64Obj) payload.fileData = fileBase64Obj;

        const response = await fetch(API_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const json = await response.json();

        if (json.status === true) {
            showToast("Success!", "success");
            const data = json.data || json;
            if (['anime', 'anoboy', 'donghua', 'cnn', 'film'].includes(currentPlatform)) { renderEntList(data, currentPlatform); return; }

            const mainResultCard = document.getElementById('resultCard');
            if (mainResultCard) mainResultCard.style.display = 'block';

            if (['ai-anime', 'genimg', 'ai-real', 'waifu'].includes(currentPlatform)) {
                document.getElementById('aiImageResult').style.display = 'block';
                let imgSrc = data.url; if (imgSrc && imgSrc.length > 1000 && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:image')) imgSrc = 'data:image/png;base64,' + imgSrc;
                document.getElementById('aiGeneratedImage').src = imgSrc; document.getElementById('aiImageActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${imgSrc}', 'Moonlight_AIGen.jpg')"><i class="fas fa-download"></i> Save Image</button>`;
                saveToHistory(`${currentPlatform.toUpperCase()} Image`, imgSrc); extractColorAndApply(imgSrc);
            }
            else if (['blackbox', 'gpt4', 'claude', 'bard', 'gemini', 'felo', 'perplexity', 'koros'].includes(currentPlatform)) {
                document.getElementById('aiChatResult').style.display = 'block';
                let chatResponse = data.message || data.result || "No response from AI."; chatResponse = chatResponse.replace(/\*\*/g, '');
                document.getElementById('aiChatText').innerText = chatResponse; saveToHistory(`Chat ${currentPlatform.toUpperCase()}`, "AI Conversation Text");
            }
            else if (currentPlatform === 'pulsa' || currentPlatform === 'topup') {
                document.getElementById('invoiceResult').style.display = 'block';
                const invId = document.getElementById('invoiceId'); if (invId) invId.innerText = `Order ID: ${data.code || '-'}`;
                const invNum = document.getElementById('invNumber'); if (invNum) invNum.innerText = data.number || finalInputData;
                const invPrice = document.getElementById('invPrice'); if (invPrice) invPrice.innerText = data.price_format || `Rp ${amountData}`;
                const invQr = document.getElementById('invQrImage');
                if (invQr && data.qr_image) {
                    let qrData = data.qr_image; if (!qrData.startsWith('data:image')) qrData = `data:image/png;base64,${qrData}`;
                    invQr.src = qrData; invQr.parentElement.style.display = 'block';
                } else if (invQr) { invQr.parentElement.style.display = 'none'; }
            }
            else if (['roblox-stalk', 'dc-stalk', 'tt-stalk', 'tw-stalk', 'gh-stalk', 'ig-stalk', 'th-stalk'].includes(currentPlatform)) {
                document.getElementById('stalkResult').style.display = 'block';
                const avatarImg = document.getElementById('stalkAvatar'); const nameEl = document.getElementById('stalkName'); const userEl = document.getElementById('stalkUsername'); const bioEl = document.getElementById('stalkBio'); const gridEl = document.getElementById('stalkStatsGrid'); const extraEl = document.getElementById('stalkExtra'); 
                gridEl.innerHTML = ''; extraEl.innerHTML = ''; if (bioEl) bioEl.innerText = ''; 
                const profilePic = data.photo || data.avatar || data.avatar_url || data.profile_pic_url || (data.hd_profile_pic_versions && data.hd_profile_pic_versions[0].url) || 'https://i.ibb.co/30Z1W4z/user.png';
                avatarImg.src = profilePic; extractColorAndApply(profilePic);
                nameEl.innerText = data.name || data.displayName || data.full_name || data.global_name || data.login || 'User Found';
                let unameStr = data.username || data.login || finalInputData; if (!unameStr.toString().startsWith('@') && currentPlatform !== 'dc-stalk') unameStr = '@' + unameStr; userEl.innerText = unameStr;
                if (bioEl && (data.about || data.bio || data.biography || data.description)) bioEl.innerText = data.about || data.bio || data.biography || data.description;
                let gridHtml = ''; let flw = data.follower ?? data.followers ?? data.follower_count; if (flw !== undefined) gridHtml += `<div class="ai-stat-box"><h4>${typeof flw === 'number' ? flw.toLocaleString() : flw}</h4><p>Followers</p></div>`; let flwi = data.following ?? data.followings; if (flwi !== undefined) gridHtml += `<div class="ai-stat-box"><h4>${typeof flwi === 'number' ? flwi.toLocaleString() : flwi}</h4><p>Following</p></div>`;
                if (currentPlatform === 'roblox-stalk' && data.friends !== undefined) gridHtml += `<div class="ai-stat-box"><h4>${data.friends.toLocaleString()}</h4><p>Friends</p></div>`; else if (currentPlatform === 'gh-stalk' && data.public_repos !== undefined) gridHtml += `<div class="ai-stat-box"><h4>${data.public_repos}</h4><p>Repositories</p></div>`; else if (currentPlatform === 'ig-stalk' && data.post !== undefined) gridHtml += `<div class="ai-stat-box"><h4>${data.post.toLocaleString()}</h4><p>Posts</p></div>`; else if (currentPlatform === 'tt-stalk' && data.likes !== undefined) gridHtml += `<div class="ai-stat-box"><h4>${data.likes.toLocaleString()}</h4><p>Likes</p></div>`; else if (currentPlatform === 'tw-stalk' && data.tweets !== undefined) gridHtml += `<div class="ai-stat-box"><h4>${data.tweets}</h4><p>Tweets</p></div>`; else if (currentPlatform === 'dc-stalk') gridHtml = `<div class="ai-stat-box" style="grid-column: span 2;"><h4>${data.id}</h4><p>Discord ID</p></div>`;
                gridEl.innerHTML = gridHtml || `<div class="ai-stat-box" style="grid-column: span 2;"><h4>-</h4><p>No statistics data</p></div>`;
                let extraHtml = ''; if (data.id && currentPlatform !== 'dc-stalk') extraHtml += `<strong>ID:</strong> ${data.id}<br>`; if (data.pk) extraHtml += `<strong>ID:</strong> ${data.pk}<br>`; if (data.type) extraHtml += `<strong>Type:</strong> ${data.type}<br>`; if (data.verified !== undefined || data.is_verified !== undefined) extraHtml += `<strong>Verified:</strong> ${(data.verified ?? data.is_verified) ? 'Yes ✅' : 'No ❌'}<br>`; if (data.private !== undefined) extraHtml += `<strong>Private Account:</strong> ${data.private ? 'Yes 🔒' : 'No 🔓'}<br>`; if (data.isBanned !== undefined) extraHtml += `<strong>Banned:</strong> ${data.isBanned ? 'Yes 🚨' : 'No'}<br>`; if (data.joined) extraHtml += `<strong>${data.joined}</strong><br>`; else if (data.created_at || data.created_utc) extraHtml += `<strong>Created At:</strong> ${new Date(data.created_at || data.created_utc).toLocaleString('en-US')}<br>`; extraEl.innerHTML = extraHtml;
            }
            else if (currentPlatform === 'lirik') {
                document.getElementById('lirikResult').style.display = 'block'; const listContainer = document.getElementById('lirikList'); const lirikTitleEl = document.getElementById('lirikTitle') || document.querySelector('#lirikResult h3');
                if (lirikTitleEl) lirikTitleEl.innerText = "Select Song Version:"; listContainer.style.display = 'flex'; document.getElementById('lirikContentWrapper').style.display = 'none'; listContainer.innerHTML = '';
                if (Array.isArray(data)) { data.forEach(item => { const safeUrl = item.url ? item.url.replace(/'/g, "\\'") : ''; listContainer.innerHTML += `<button class="btn-secondary" onclick="fetchLirik('${safeUrl}')"><i class="fas fa-music"></i> ${item.title}</button>`; }); } else if (data && data.lyric) { if (lirikTitleEl) lirikTitleEl.innerText = data.title || "Lyrics Result"; listContainer.style.display = 'none'; document.getElementById('lirikText').innerText = data.lyric; document.getElementById('lirikContentWrapper').style.display = 'block'; }
            }
            else if (currentPlatform === 'photo-editor') {
                document.getElementById('photoEditorResult').style.display = 'block'; let imgSrc = data.url; if (imgSrc && imgSrc.length > 1000 && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:image')) imgSrc = 'data:image/png;base64,' + imgSrc;
                _imgStore['photoEditor'] = imgSrc; document.getElementById('photoEditorImage').src = imgSrc; document.getElementById('photoEditorActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload(_imgStore['photoEditor'], 'Moonlight_EditAI.png')"><i class="fas fa-download"></i> Save Image</button>`; saveToHistory(`Edit AI`, imgSrc); extractColorAndApply(imgSrc);
            }
            else if (currentPlatform === 'hd-foto') {
                document.getElementById('hdFotoResult').style.display = 'block'; let imgSrc = data.url; if (imgSrc && imgSrc.length > 1000 && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:image')) imgSrc = 'data:image/png;base64,' + imgSrc;
                _imgStore['hdFoto'] = imgSrc; document.getElementById('hdImageResult').src = imgSrc; document.getElementById('hdActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload(_imgStore['hdFoto'], 'Moonlight_HDFoto.png')"><i class="fas fa-download"></i> Save HD Image</button>`; saveToHistory(`HD Photo`, imgSrc); extractColorAndApply(imgSrc);
            }
            else if (currentPlatform === 'remove-bg') {
                document.getElementById('removeBgResult').style.display = 'block'; let imgSrc = data.no_background || data.url || data.image; if (imgSrc && imgSrc.length > 1000 && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:image')) imgSrc = 'data:image/png;base64,' + imgSrc;
                _imgStore['removeBg'] = imgSrc; document.getElementById('removeBgImage').src = imgSrc; document.getElementById('removeBgActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload(_imgStore['removeBg'], 'Moonlight_NoBG.png')"><i class="fas fa-download"></i> Save Transparent</button>`; saveToHistory(`Remove BG`, imgSrc); extractColorAndApply(imgSrc);
            }
            else if (currentPlatform === 'noise-reduce') {
                document.getElementById('audioResult').style.display = 'block'; let audioUrl = data.url; document.getElementById('audioPlayer').src = audioUrl; document.getElementById('audioActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${audioUrl}', 'Moonlight_CleanAudio.mp3')"><i class="fas fa-download"></i> Save Audio</button>`; saveToHistory(`Clean Audio`, audioUrl);
            }
            else if (currentPlatform === 'ss-web') {
                document.getElementById('ssWebResult').style.display = 'block'; let imgSrc = data.url; if (imgSrc && imgSrc.length > 1000 && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:image')) imgSrc = 'data:image/png;base64,' + imgSrc;
                document.getElementById('ssWebImage').src = imgSrc; document.getElementById('ssWebActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${imgSrc}', 'Moonlight_Screenshot.png')"><i class="fas fa-download"></i> Save Screenshot</button>`; extractColorAndApply(imgSrc);
            }
            else if (currentPlatform === 'iqc') {
                document.getElementById('iqcResult').style.display = 'block'; let imgSrc = data.url; if (imgSrc && imgSrc.length > 1000 && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:image')) imgSrc = 'data:image/png;base64,' + imgSrc;
                document.getElementById('iqcImage').src = imgSrc; document.getElementById('iqcActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${imgSrc}', 'Moonlight_Quote.png')"><i class="fas fa-download"></i> Save Quote</button>`; extractColorAndApply(imgSrc);
            }
            else if (currentPlatform === 'nulis') {
                document.getElementById('nulisResult').style.display = 'block'; let imgSrc = data.url; if (imgSrc && imgSrc.length > 1000 && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:image')) imgSrc = 'data:image/png;base64,' + imgSrc;
                document.getElementById('nulisImage').src = imgSrc; document.getElementById('nulisActionBtns').innerHTML = `<button class="btn-primary" onclick="forceDownload('${imgSrc}', 'Moonlight_Writing.png')"><i class="fas fa-download"></i> Save Book</button>`; extractColorAndApply(imgSrc);
            }
            else if (currentPlatform === 'ai-detector') {
                document.getElementById('aiResult').style.display = 'block'; const badge = document.getElementById('aiFeedbackBadge'); badge.innerText = data.feedback || "Analysis Complete"; badge.className = "ai-feedback-badge"; 
                if (data.isHuman > 70) badge.classList.add("ai-human"); else if (data.fakePercentage > 50) badge.classList.add("ai-fake"); else badge.classList.add("ai-mixed"); 
                document.getElementById('aiScoreHuman').innerText = `${data.isHuman}%`; document.getElementById('aiScoreFake').innerText = `${data.fakePercentage}%`; 
                setTimeout(() => { document.getElementById('barHuman').style.width = `${data.isHuman}%`; document.getElementById('barFake').style.width = `${data.fakePercentage}%`; }, 100);
            }
            else if (currentPlatform === 'yt-transcript') { document.getElementById('ytTranscriptResult').style.display = 'block'; document.getElementById('ytTranscriptText').innerText = data.text || "No transcript available."; }
            else {
                document.getElementById('downloaderResult').style.display = 'block'; const profileSec = document.getElementById('profileSection'); const captionText = document.getElementById('videoCaption'); const thumbCon = document.getElementById('thumbnailContainer'); const thumbImg = document.getElementById('videoThumbnail'); const thumbFallback = document.getElementById('thumbnailFallback'); const actionBtns = document.getElementById('actionBtns'); actionBtns.innerHTML = '';
                if (currentPlatform === 'facebook') { profileSec.style.display = 'none'; captionText.style.display = 'none'; thumbCon.style.display = 'none'; data.forEach((item) => { actionBtns.innerHTML += `<button class="btn-primary" onclick="forceDownload('${item.url}', 'FB.mp4')"><i class="fas fa-video"></i> Download Video (${item.quality})</button>`; }); } 
                else if (currentPlatform === 'twitter') { profileSec.style.display = 'none'; captionText.style.display = 'none'; thumbCon.style.display = 'none'; data.forEach((item, i) => { let typeText = item.type === "mp4" ? "Video" : "Image"; let icon = item.type === "mp4" ? "fa-video" : "fa-image"; actionBtns.innerHTML += `<button class="btn-primary" onclick="forceDownload('${item.url}', 'X_${i}.mp4')"><i class="fas ${icon}"></i> Download ${typeText} ${i + 1}</button>`; }); } 
                else if (currentPlatform === 'terabox') { profileSec.style.display = 'none'; captionText.style.display = 'block'; captionText.innerHTML = `<strong>File:</strong> ${data[0].server_filename}<br><strong>Size:</strong> ${data[0].size}`; thumbCon.style.display = 'none'; actionBtns.innerHTML = `<button class="btn-primary" onclick="forceDownload('${data[0].dlink}', '${data[0].server_filename}')"><i class="fas fa-download"></i> Download File</button>`; } 
                else if (currentPlatform === 'youtube') { profileSec.style.display = 'none'; captionText.style.display = 'block'; captionText.innerHTML = `<strong>Title:</strong> ${json.title}<br><strong>Channel:</strong> ${json.channel}<br><strong>Quality:</strong> ${data.quality}`; thumbCon.style.display = 'flex'; thumbImg.src = json.thumbnail; thumbImg.onload = () => { thumbImg.style.display = "block"; thumbFallback.style.display = "none"; }; let vidHtml = `<button class="btn-primary" onclick="forceDownload('${data.url}', 'YT.${data.extension}')"><i class="fas fa-download"></i> Download ${data.extension.toUpperCase()}</button>`; if (data.extension === 'mp4') vidHtml = `<button class="btn-secondary" onclick="openPip('${data.url}')"><i class="fas fa-play"></i> Preview PiP</button>` + vidHtml; actionBtns.innerHTML = vidHtml; saveToHistory(`YouTube: ${json.title}`, data.url); extractColorAndApply(json.thumbnail); } 
                else if (currentPlatform === 'spotify') { profileSec.style.display = 'none'; captionText.style.display = 'block'; captionText.innerHTML = `<strong>Title:</strong> ${data.title}<br><strong>Artist:</strong> ${data.artist.name}`; thumbCon.style.display = 'flex'; thumbImg.src = data.thumbnail; thumbImg.onload = () => { thumbImg.style.display = "block"; thumbFallback.style.display = "none"; }; actionBtns.innerHTML = `<button class="btn-primary" onclick="forceDownload('${data.url}', 'Spotify.mp3')"><i class="fas fa-music"></i> Download MP3</button>`; saveToHistory(`Spotify: ${data.title}`, data.url); extractColorAndApply(data.thumbnail); } 
                else if (currentPlatform === 'tiktok') { profileSec.style.display = 'none'; captionText.style.display = 'none'; if (data.photo && data.photo.length > 0) { thumbCon.style.display = 'flex'; thumbImg.src = data.photo[0]; thumbImg.style.display = "block"; thumbFallback.style.display = "none"; data.photo.forEach((img, i) => { actionBtns.innerHTML += `<button class="btn-primary" onclick="forceDownload('${img}', 'TikTok_${i}.jpg')"><i class="fas fa-image"></i> Download Photo ${i+1}</button>`; }); if (data.audio) actionBtns.innerHTML += `<button class="btn-secondary" onclick="forceDownload('${data.audio}', 'TikTokAudio.mp3')"><i class="fas fa-music"></i> Download Audio</button>`; saveToHistory(`TikTok Slide (Photo)`, data.photo[0]); extractColorAndApply(data.photo[0]); } else { thumbCon.style.display = 'none'; if (data.video) { actionBtns.innerHTML += `<button class="btn-secondary" onclick="openPip('${data.video}')"><i class="fas fa-play"></i> Preview PiP</button>`; actionBtns.innerHTML += `<button class="btn-primary" onclick="forceDownload('${data.video}', 'TikTok.mp4')"><i class="fas fa-video"></i> Download Video</button>`; } if (data.videoHD) actionBtns.innerHTML += `<button class="btn-primary" onclick="forceDownload('${data.videoHD}', 'TikTokHD.mp4')"><i class="fas fa-video"></i> Download Video HD</button>`; if (data.audio) actionBtns.innerHTML += `<button class="btn-secondary" onclick="forceDownload('${data.audio}', 'TikTokAudio.mp3')"><i class="fas fa-music"></i> Download Audio</button>`; if (data.video || data.videoHD) saveToHistory(`TikTok Video`, data.video || data.videoHD); } } 
                else if (currentPlatform === 'ig') { profileSec.style.display = 'none'; captionText.style.display = 'none'; thumbCon.style.display = 'none'; data.forEach((item, i) => { if (item.type === 'mp4') actionBtns.innerHTML += `<button class="btn-secondary" onclick="openPip('${item.url}')"><i class="fas fa-play"></i> Preview PiP ${i+1}</button>`; actionBtns.innerHTML += `<button class="btn-primary" onclick="forceDownload('${item.url}', 'IG_${i}.mp4')"><i class="fas fa-download"></i> Download File ${i+1}</button>`; }); if (data.length > 0) saveToHistory(`Instagram Media`, data[0].url); } 
                else if (currentPlatform === 'pin') { profileSec.style.display = 'none'; captionText.style.display = 'none'; thumbCon.style.display = 'none'; actionBtns.innerHTML = `<button class="btn-primary" onclick="forceDownload('${data.url}', 'Pinterest.jpg')"><i class="fas fa-download"></i> Download Media</button>`; saveToHistory(`Pinterest Media`, data.url); }
            }
        } else {
            if (['anime', 'anoboy', 'donghua', 'film'].includes(currentPlatform)) renderEntList([], currentPlatform);
            else showToast(json.message || json.msg || "Failed to process data from server.", "error");
        }
    } catch (error) { console.error(error); showToast("System or connection error occurred.", "error"); } 
    finally {
        const loadingOverlay = document.getElementById('loadingOverlay'); if (loadingOverlay) loadingOverlay.style.display = 'none'; stopGameLoop(); 
        if (mainBtn && (typeof FITUR === 'undefined' || FITUR[currentPlatform] !== false)) {
            mainBtn.disabled = false;
            if (currentPlatform === 'pulsa' || currentPlatform === 'topup') mainBtn.innerHTML = "Create Invoice"; else if (currentPlatform === 'ss-web') mainBtn.innerHTML = "Take Screenshot"; else if (currentPlatform === 'yt-transcript') mainBtn.innerHTML = "Extract Text Now"; else if (currentPlatform === 'ai-detector') mainBtn.innerHTML = "Detect Text Now"; else if (currentPlatform === 'iqc') mainBtn.innerHTML = "Create iPhone Quote"; else if (currentPlatform === 'nulis') mainBtn.innerHTML = "Start Writing"; else if (['hd-foto', 'ai-anime', 'genimg', 'ai-real', 'waifu'].includes(currentPlatform)) mainBtn.innerHTML = "Generate Image"; else if (currentPlatform === 'remove-bg') mainBtn.innerHTML = "Remove Background"; else if (currentPlatform === 'noise-reduce') mainBtn.innerHTML = "Clean Audio"; else if (currentPlatform === 'photo-editor') mainBtn.innerHTML = "Edit Photo Now"; else if (currentPlatform === 'lirik') mainBtn.innerHTML = "Search Lyrics"; else if (currentPlatform === 'terabox') mainBtn.innerHTML = "Open TeraBox File"; else if (['roblox-stalk', 'dc-stalk', 'tt-stalk', 'tw-stalk', 'gh-stalk', 'ig-stalk', 'th-stalk'].includes(currentPlatform)) mainBtn.innerHTML = "Search Account"; else if (currentPlatform === 'qr-gen') mainBtn.innerHTML = "Generate QR Code"; else if (currentPlatform === 'shortlink') mainBtn.innerHTML = "Shorten Link"; else if (['tts', 'gpt4', 'claude', 'bard', 'gemini', 'blackbox', 'felo', 'perplexity', 'koros'].includes(currentPlatform)) mainBtn.innerHTML = "Ask AI"; else if (['anime', 'anoboy'].includes(currentPlatform)) mainBtn.innerHTML = "Search Anime"; else if (currentPlatform === 'donghua') mainBtn.innerHTML = "Search Donghua"; else if (currentPlatform === 'film') mainBtn.innerHTML = "Search Movie"; else if (currentPlatform === 'cnn') mainBtn.innerHTML = "Read Latest News"; else mainBtn.innerHTML = "Download Now";
        }
    }
}

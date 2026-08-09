// ============================================================
//  CẤU HÌNH & STATE
// ============================================================
const PASSWORD = 'bomaylaadmin';
const STORAGE_KEY = 'typingAppData';

const defaultData = {
    texts: [
        {
            id: 'text1',
            name: 'Văn bản mẫu',
            content: 'Đây là một văn bản mẫu để luyện gõ tiếng Việt.',
            secret: '',
            difficulty: 0
        }
    ],
    history: []
};

let appData = loadData();
let typingState = {
    textId: null,
    content: '',
    chars: [],
    currentIndex: 0,
    startTime: null,
    endTime: null,
    errors: 0,
    typedChars: [],
    charTimestamps: [],
    isFinished: false,
    timerInterval: null,
    wpmHistory: [],
    charSpans: [],
    lastResult: null
};

let started = false;
let publicTexts = [];

// ============================================================
//  DOM REFS
// ============================================================
const $ = id => document.getElementById(id);
const homeScreen = $('homeScreen');
const selectScreen = $('selectScreen');
const typingScreen = $('typingScreen');
const resultScreen = $('resultScreen');
const addScreen = $('addScreen');

const goTypingBtn = $('goTypingBtn');
const backHomeFromSelect = $('backHomeFromSelect');
const backHomeFromAdd = $('backHomeFromAdd');
const backHomeFromResult = $('backHomeFromResult');
const abortTypingBtn = $('abortTypingBtn');
const retryBtn = $('retryBtn');
const addTextBtn = $('addTextBtn');

const publicTextList = $('publicTextList');
const secretCodeInput = $('secretCodeInput');
const secretGoBtn = $('secretGoBtn');

const textDisplay = $('textDisplay');
const startNotice = $('startNotice');
const virtualCaret = $('virtualCaret');
const typingTitle = $('typingTitle');
const typingTimer = $('typingTimer');
const typingWpm = $('typingWpm');
const typingLpm = $('typingLpm');
const typingAccuracy = $('typingAccuracy');
const errorCount = $('errorCount');
const typedCount = $('typedCount');
const remainingCount = $('remainingCount');

const resultTextName = $('resultTextName');
const resultStats = $('resultStats');
const historyList = $('historyList');
const speedChart = $('speedChart');

const addTextForm = $('addTextForm');
const addName = $('addName');
const addContent = $('addContent');
const addSecret = $('addSecret');
const secretCodeGroup = $('secretCodeGroup');
const secretError = $('secretError');
const cancelAddBtn = $('cancelAddBtn');
const difficultySlider = $('difficultySlider');
const difficultyLabel = $('difficultyLabel');
const customSlider = $('customSlider');
const sliderThumb = $('sliderThumb');
const sliderTrack = customSlider ? customSlider.querySelector('.slider-track') : null;
const visibilityToggle = $('visibilityToggle');

const popupOverlay = $('passwordPopup');
const popupPassword = $('popupPassword');
const popupConfirm = $('popupConfirm');
const popupCancel = $('popupCancel');
const popupError = $('popupError');

const messagePopup = $('messagePopup');
const messageTitle = $('messageTitle');
const messageContent = $('messageContent');
const messageOkBtn = $('messageOkBtn');

const themeToggle = $('themeToggle');

let typingTextarea = null;
let displayContainer = null;

// ============================================================
//  HÀM TIỆN ÍCH
// ============================================================
function getDifficultyName(val) {
    const map = ['Dễ', 'Trung bình', 'Khó', 'Cực khó'];
    return map[val] || 'Dễ';
}

// ============================================================
//  LƯU TRỮ LỊCH SỬ (LOCALSTORAGE)
// ============================================================
function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (_) {}
    saveData({ history: [] });
    return { history: [] };
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    appData = data;
}

// ============================================================
//  LẤY BASE PATH CHO GITHUB PAGES
// ============================================================
function getBasePath() {
    const path = window.location.pathname;
    if (path === '/' || path === '') return '';
    const base = path.replace(/\/$/, '');
    return base;
}
const BASE = getBasePath();

// ============================================================
//  FETCH DỮ LIỆU TỪ GITHUB
// ============================================================
async function fetchPublicTexts() {
    try {
        const url = `${BASE}/public/texts.json`;
        console.log('📥 Fetching public texts:', url);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const list = await res.json();
        publicTexts = list;
        console.log('✅ Đã tải danh sách:', publicTexts);
        renderPublicTexts();
    } catch (e) {
        console.warn('❌ Không thể tải danh sách văn bản:', e);
        publicTexts = [];
        renderPublicTexts();
    }
}

async function fetchTextByFilename(filename) {
    try {
        const url = `${BASE}/public/${filename}`;
        console.log('📥 Fetching text:', url);
        const res = await fetch(url);
        if (!res.ok) throw new Error('Không tìm thấy file');
        const data = await res.json();
        console.log('✅ Đã tải văn bản:', data.name);
        return data;
    } catch (e) {
        console.warn('❌ Lỗi tải văn bản:', e);
        return null;
    }
}

async function fetchSecretText(code) {
    try {
        const url = `${BASE}/secret/${code}.json`;
        console.log('📥 Fetching secret:', url);
        const res = await fetch(url);
        if (!res.ok) throw new Error('Không tìm thấy văn bản bí mật');
        const data = await res.json();
        console.log('✅ Đã tải secret:', data.name);
        return data;
    } catch (e) {
        console.warn('❌ Lỗi tải secret:', e);
        return null;
    }
}

// ============================================================
//  THEME TOGGLE
// ============================================================
function toggleTheme() {
    const btn = document.getElementById('themeToggle');
    const rect = btn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const isDark = document.body.classList.contains('dark');
    const targetTheme = isDark ? 'light' : 'dark';
    const bgColor = targetTheme === 'dark' ? '#0f172a' : '#f5f7fa';

    const overlay = document.createElement('div');
    overlay.className = 'theme-transition-overlay';
    overlay.style.background = bgColor;
    overlay.style.clipPath = `circle(0% at ${x}px ${y}px)`;
    overlay.style.opacity = '1';
    document.body.appendChild(overlay);

    void overlay.offsetHeight;

    requestAnimationFrame(() => {
        overlay.style.clipPath = `circle(150% at ${x}px ${y}px)`;
    });

    const onExpandEnd = () => {
        overlay.removeEventListener('transitionend', onExpandEnd);

        if (targetTheme === 'dark') {
            document.body.classList.add('dark');
            btn.textContent = '☀️';
        } else {
            document.body.classList.remove('dark');
            btn.textContent = '🌙';
        }

        localStorage.setItem('theme', targetTheme);

        if (resultScreen.classList.contains('active') && typingState.lastResult) {
            drawChart(typingState.lastResult);
        }

        setTimeout(() => {
            overlay.style.opacity = '0';

            const onFadeEnd = () => {
                overlay.removeEventListener('transitionend', onFadeEnd);
                overlay.remove();
            };
            overlay.addEventListener('transitionend', onFadeEnd);
            setTimeout(() => {
                if (document.body.contains(overlay)) {
                    overlay.remove();
                }
            }, 800);
        }, 300);
    };

    overlay.addEventListener('transitionend', onExpandEnd);
    setTimeout(() => {
        if (document.body.contains(overlay)) {
            onExpandEnd();
        }
    }, 1200);
}

function loadTheme() {
    const theme = localStorage.getItem('theme');
    const btn = document.getElementById('themeToggle');
    if (theme === 'dark') {
        document.body.classList.add('dark');
        btn.textContent = '☀️';
    } else {
        document.body.classList.remove('dark');
        btn.textContent = '🌙';
    }
}
themeToggle.addEventListener('click', toggleTheme);

// ============================================================
//  POPUP MẬT KHẨU
// ============================================================
let isPopupClosing = false;

function openPopup() {
    isPopupClosing = false;
    popupOverlay.classList.add('active');
    popupPassword.value = '';
    popupError.style.display = 'none';
    popupPassword.focus();
    const box = popupOverlay.querySelector('.popup-box');
    box.style.animation = 'none';
    void box.offsetHeight;
    box.style.animation = 'popIn 0.2s ease';
}

function closePopup() {
    if (isPopupClosing) return;
    isPopupClosing = true;
    const box = popupOverlay.querySelector('.popup-box');
    box.style.animation = 'popOut 0.15s ease forwards';
    setTimeout(() => {
        popupOverlay.classList.remove('active');
        box.style.animation = '';
        isPopupClosing = false;
    }, 200);
}

function checkPassword() {
    if (popupPassword.value === PASSWORD) {
        closePopup();
        setTimeout(() => {
            showScreen('addScreen');
            addTextForm.reset();
            secretCodeGroup.classList.remove('open');
            secretError.hidden = true;
            const sliderVal = 0;
            difficultySlider.value = sliderVal;
            updateSliderUI(sliderVal);
            difficultyLabel.textContent = 'Dễ';
            if (visibilityToggle) {
                visibilityToggle.checked = false;
                document.querySelectorAll('.toggle-label').forEach(l => l.classList.remove('active'));
                const firstLabel = document.querySelector('.toggle-label:first-child');
                if (firstLabel) firstLabel.classList.add('active');
            }
        }, 250);
    } else {
        popupError.style.display = 'block';
        popupPassword.value = '';
        popupPassword.focus();
    }
}

// ============================================================
//  POPUP THÔNG BÁO TÙY CHỈNH
// ============================================================
function showMessage(title, content) {
    messageTitle.textContent = title;
    messageContent.textContent = content;
    messagePopup.classList.add('active');
}

messageOkBtn.addEventListener('click', function() {
    messagePopup.classList.remove('active');
});

messagePopup.addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.remove('active');
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        messagePopup.classList.remove('active');
    }
});

// ============================================================
//  ĐIỀU HƯỚNG MÀN HÌNH
// ============================================================
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
}

function showHome() {
    showScreen('homeScreen');
    closePopup();
}

function showSelect() {
    showScreen('selectScreen');
    fetchPublicTexts();
}

function showTyping(textId) {
    showScreen('typingScreen');
    const meta = publicTexts.find(t => t.id === textId);
    if (meta) {
        fetchTextByFilename(meta.filename).then(data => {
            if (data) {
                startTypingWithData(data);
            } else {
                showMessage('Lỗi', 'Không thể tải văn bản này.');
                showHome();
            }
        });
    } else {
        showMessage('Lỗi', 'Không tìm thấy văn bản.');
        showHome();
    }
}

function showResult() {
    showScreen('resultScreen');
    renderResult();
}

function showAdd() {
    openPopup();
}

// ============================================================
//  HIỂN THỊ DANH SÁCH VĂN BẢN CÔNG KHAI
// ============================================================
function renderPublicTexts() {
    const container = publicTextList;
    container.innerHTML = '';
    if (!publicTexts || publicTexts.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);">Chưa có văn bản công khai. Hãy thêm mới hoặc kiểm tra file texts.json.</p>';
        return;
    }
    publicTexts.forEach(t => {
        const diff = t.difficulty !== undefined ? t.difficulty : 0;
        const div = document.createElement('div');
        div.className = `text-item difficulty-${diff}`;
        const words = t.wordCount || 0;
        const diffName = getDifficultyName(diff);
        div.innerHTML = `
            <div class="name">${t.name}</div>
            <div class="meta">
                <span class="badge diff-${diff}">${diffName}</span>
                <span>${words} từ</span>
            </div>
        `;
        div.addEventListener('click', () => showTyping(t.id));
        container.appendChild(div);
    });
}

// ============================================================
//  MỞ VĂN BẢN BÍ MẬT
// ============================================================
async function openSecretText() {
    const code = secretCodeInput.value.trim();
    if (!code) {
        showMessage('Lỗi', 'Vui lòng nhập mã văn bản.');
        return;
    }
    const data = await fetchSecretText(code);
    if (data) {
        startTypingWithData(data);
    } else {
        showMessage('Không tìm thấy', 'Không tìm thấy văn bản với mã này.');
    }
    secretCodeInput.value = '';
}

// ============================================================
//  KHỞI TẠO GÕ VỚI DỮ LIỆU VĂN BẢN (ĐỒNG BỘ HOÀN TOÀN)
// ============================================================
function startTypingWithData(textData) {
    const content = textData.content;
    typingState.textId = textData.id || 'unknown';
    typingState.content = content;
    typingState.chars = content.split('');
    typingState.currentIndex = 0;
    typingState.startTime = null;
    typingState.endTime = null;
    typingState.errors = 0;
    typingState.typedChars = [];
    typingState.charTimestamps = [];
    typingState.isFinished = false;
    typingState.wpmHistory = [];
    typingState.charSpans = [];
    if (typingState.timerInterval) {
        clearInterval(typingState.timerInterval);
        typingState.timerInterval = null;
    }
    started = false;

    if (typingTextarea) {
        typingTextarea.remove();
        typingTextarea = null;
    }
    if (displayContainer) {
        displayContainer.remove();
        displayContainer = null;
    }

    // Reset textDisplay
    textDisplay.innerHTML = '';
    textDisplay.style.position = 'relative';
    textDisplay.style.padding = '0';
    textDisplay.style.background = 'var(--card-bg)';
    textDisplay.style.borderRadius = '16px';
    textDisplay.style.minHeight = '180px';
    textDisplay.style.overflow = 'hidden';
    textDisplay.style.height = 'auto';

    // --- Tạo container chính để chứa cả hai lớp ---
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 180px;
        overflow: auto;
    `;
    textDisplay.appendChild(wrapper);

    // --- DISPLAY CONTAINER (lớp hiển thị) ---
    displayContainer = document.createElement('div');
    displayContainer.className = 'display-container';
    Object.assign(displayContainer.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        padding: '28px 32px',
        boxSizing: 'border-box',
        fontFamily: "'Roboto Mono', monospace",
        fontSize: '1.5rem',
        lineHeight: '2.4',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        overflow: 'auto',
        pointerEvents: 'none',
        zIndex: '5',
        margin: '0',
        border: 'none',
        background: 'transparent'
    });
    wrapper.appendChild(displayContainer);

    // Thêm các span
    typingState.chars.forEach((ch, idx) => {
        const span = document.createElement('span');
        span.className = 'char dim';
        span.textContent = ch;
        if (ch === ' ') span.innerHTML = '&nbsp;';
        span.dataset.index = idx;
        displayContainer.appendChild(span);
    });
    typingState.charSpans = displayContainer.querySelectorAll('.char');

    // --- TEXTAREA (lớp nhập liệu trong suốt) ---
    typingTextarea = document.createElement('textarea');
    typingTextarea.className = 'typing-textarea';
    Object.assign(typingTextarea.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        padding: '28px 32px',
        boxSizing: 'border-box',
        border: 'none',
        outline: 'none',
        resize: 'none',
        background: 'transparent',
        fontFamily: "'Roboto Mono', monospace",
        fontSize: '1.5rem',
        lineHeight: '2.4',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        overflow: 'auto',
        color: 'transparent',
        caretColor: 'transparent',
        zIndex: '10',
        margin: '0'
    });
    typingTextarea.setAttribute('spellcheck', 'false');
    typingTextarea.setAttribute('autocomplete', 'off');
    typingTextarea.setAttribute('autocorrect', 'off');
    typingTextarea.setAttribute('autocapitalize', 'off');
    typingTextarea.disabled = false;
    wrapper.appendChild(typingTextarea);

    // Ẩn scrollbar của textarea
    const styleId = 'hide-textarea-scrollbar';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .typing-textarea::-webkit-scrollbar { width: 0; background: transparent; }
            .typing-textarea { scrollbar-width: none; }
        `;
        document.head.appendChild(style);
    }

    // --- CARET ẢO ---
    let caretEl = document.getElementById('virtualCaret');
    if (!caretEl) {
        caretEl = document.createElement('div');
        caretEl.id = 'virtualCaret';
        caretEl.className = 'virtual-caret';
        wrapper.appendChild(caretEl);
    } else {
        caretEl.classList.remove('hidden');
        // Đảm bảo caret nằm trong wrapper
        if (caretEl.parentNode !== wrapper) {
            wrapper.appendChild(caretEl);
        }
    }

    // --- START NOTICE ---
    let notice = document.getElementById('startNotice');
    if (!notice) {
        notice = document.createElement('div');
        notice.id = 'startNotice';
        notice.className = 'start-notice';
        notice.innerHTML = `<span class="start-message">⌨️ <strong>Bắt đầu gõ</strong> để tính thời gian</span>`;
        wrapper.appendChild(notice);
    } else {
        notice.classList.remove('hidden');
        if (notice.parentNode !== wrapper) {
            wrapper.appendChild(notice);
        }
    }

    // --- SỰ KIỆN ---
    typingTextarea.addEventListener('input', handleTextareaInput);
    textDisplay.addEventListener('click', () => {
        if (typingTextarea && !typingTextarea.disabled) {
            typingTextarea.focus();
        }
    });

    typingTextarea.addEventListener('paste', (e) => e.preventDefault());
    typingTextarea.addEventListener('copy', (e) => e.preventDefault());
    typingTextarea.addEventListener('cut', (e) => e.preventDefault());

    const diffName = getDifficultyName(textData.difficulty || 0);
    typingTitle.textContent = `${textData.name} (${diffName})`;
    updateStats();
    updateVirtualCaret();
    typingTextarea.focus();
}

// ============================================================
//  CÁC HÀM XỬ LÝ GÕ
// ============================================================
function startTypingSession() {
    if (started) return;
    started = true;

    const notice = document.getElementById('startNotice');
    if (notice) {
        notice.classList.add('hidden');
        setTimeout(() => notice.remove(), 400);
    }

    typingState.startTime = Date.now();
    typingState.timerInterval = setInterval(updateTimer, 100);
}

function handleTextareaInput() {
    if (typingState.isFinished) return;

    if (!started) {
        startTypingSession();
    }

    if (!typingState.startTime) {
        typingState.startTime = Date.now();
    }

    const inputText = typingTextarea.value;
    const typedLen = inputText.length;
    const chars = typingState.chars;
    const maxLen = Math.min(typedLen, chars.length);

    let newErrors = 0;
    let newTypedChars = [];

    for (let i = 0; i < maxLen; i++) {
        const expected = chars[i];
        const actual = inputText[i];
        const isCorrect = (actual === expected);
        newTypedChars.push(isCorrect);
        if (!isCorrect) newErrors++;
    }

    typingState.currentIndex = maxLen;
    typingState.errors = newErrors;
    typingState.typedChars = newTypedChars;

    const spans = typingState.charSpans;
    for (let i = 0; i < maxLen; i++) {
        const span = spans[i];
        const ch = inputText[i];
        span.textContent = ch;
        if (ch === ' ') span.innerHTML = '&nbsp;';
        const isCorrect = (ch === chars[i]);
        span.className = isCorrect ? 'char correct' : 'char wrong';
    }
    for (let i = maxLen; i < chars.length; i++) {
        const span = spans[i];
        span.textContent = chars[i];
        if (chars[i] === ' ') span.innerHTML = '&nbsp;';
        span.className = 'char dim';
    }

    if (typingState.charTimestamps.length < typedLen) {
        const now = Date.now() - typingState.startTime;
        while (typingState.charTimestamps.length < typedLen) {
            typingState.charTimestamps.push(now);
        }
    }

    updateStats();
    updateWpmHistory(Date.now() - typingState.startTime);
    updateVirtualCaret();

    if (typingState.currentIndex === chars.length) {
        finishTyping();
    }
}

function updateVirtualCaret() {
    const caretEl = document.getElementById('virtualCaret');
    if (!caretEl) return;
    const idx = typingState.currentIndex;
    const spans = typingState.charSpans;
    if (!spans || spans.length === 0 || idx >= spans.length) {
        caretEl.classList.add('hidden');
        return;
    }
    caretEl.classList.remove('hidden');
    const target = spans[idx];
    if (!target) return;
    const containerRect = textDisplay.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    caretEl.style.left = (targetRect.left - containerRect.left) + 'px';
    caretEl.style.top = (targetRect.top - containerRect.top) + 'px';
    caretEl.style.height = targetRect.height + 'px';
}

function updateTimer() {
    if (!typingState.startTime) return;
    const elapsed = Math.floor((Date.now() - typingState.startTime) / 1000);
    typingTimer.textContent = `⏱ ${elapsed}s`;

    const typed = typingState.currentIndex;
    if (typed > 0 && elapsed > 0) {
        const minutes = elapsed / 60;
        const wpm = Math.round((typed / 5) / minutes);
        const lpm = Math.round(typed / minutes);
        typingWpm.textContent = `⚡ ${wpm} WPM`;
        typingLpm.textContent = `⌨️ ${lpm} LPM`;
    }
    updateStats();
}

function updateStats() {
    const total = typingState.chars.length;
    const typed = typingState.currentIndex;
    typedCount.textContent = typed;
    remainingCount.textContent = total - typed;
    errorCount.textContent = typingState.errors;
    const totalTyped = typingState.typedChars.length;
    if (totalTyped > 0) {
        const correct = totalTyped - typingState.errors;
        const acc = Math.min(100, Math.round((correct / totalTyped) * 100));
        typingAccuracy.textContent = `🎯 ${acc}%`;
    } else {
        typingAccuracy.textContent = '🎯 100%';
    }
}

function updateWpmHistory(elapsed) {
    const windowMs = 3000;
    const recent = typingState.charTimestamps.filter(t => (elapsed - t) <= windowMs);
    if (recent.length > 0) {
        const wpm = Math.round((recent.length / 5) / (windowMs / 60000));
        typingState.wpmHistory.push({ time: elapsed, wpm });
    }
}

function finishTyping() {
    typingState.isFinished = true;
    typingState.endTime = Date.now();
    if (typingState.timerInterval) {
        clearInterval(typingState.timerInterval);
        typingState.timerInterval = null;
    }
    if (typingTextarea) {
        typingTextarea.removeEventListener('input', handleTextareaInput);
        typingTextarea.disabled = true;
    }
    const caretEl = document.getElementById('virtualCaret');
    if (caretEl) caretEl.classList.add('hidden');
    saveResult();
    showResult();
}

function abortTyping() {
    if (typingState.timerInterval) {
        clearInterval(typingState.timerInterval);
        typingState.timerInterval = null;
    }
    if (typingTextarea) {
        typingTextarea.removeEventListener('input', handleTextareaInput);
        typingTextarea.disabled = true;
    }
    const notice = document.getElementById('startNotice');
    if (notice) {
        notice.classList.add('hidden');
        setTimeout(() => notice.remove(), 400);
    }
    showHome();
}

// ============================================================
//  LƯU KẾT QUẢ – CHỈ GIỮ 5 LẦN GẦN NHẤT
// ============================================================
function saveResult() {
    const typed = typingState.currentIndex;
    if (typed === 0) return;
    const elapsed = (typingState.endTime - typingState.startTime) / 1000;
    if (elapsed === 0) return;
    const minutes = elapsed / 60;
    const wpm = Math.round((typed / 5) / minutes);
    const lpm = Math.round(typed / minutes);
    const totalTyped = typingState.typedChars.length;
    const correct = totalTyped - typingState.errors;
    const accuracy = totalTyped > 0 ? Math.min(100, Math.round((correct / totalTyped) * 100)) : 100;

    const record = {
        textId: typingState.textId,
        timestamp: Date.now(),
        wpm,
        lpm,
        accuracy,
        charTimes: typingState.charTimestamps.slice()
    };

    appData.history.push(record);

    const all = appData.history.filter(h => h.textId === typingState.textId);
    if (all.length > 5) {
        all.sort((a, b) => a.timestamp - b.timestamp);
        const keep = all.slice(-5);
        appData.history = appData.history.filter(h => h.textId !== typingState.textId);
        appData.history.push(...keep);
    }

    saveData(appData);
    typingState.lastResult = record;
}

// ============================================================
//  HIỂN THỊ KẾT QUẢ & BIỂU ĐỒ
// ============================================================
function renderResult() {
    const record = typingState.lastResult;
    if (!record) return;

    const text = publicTexts.find(t => t.id === typingState.textId);
    resultTextName.textContent = `📄 ${text ? text.name : 'Văn bản'}`;

    resultStats.innerHTML = `
        <div class="result-card"><div class="number">${record.wpm}</div><div class="label">WPM</div></div>
        <div class="result-card"><div class="number">${record.lpm}</div><div class="label">LPM</div></div>
        <div class="result-card"><div class="number">${record.accuracy}%</div><div class="label">Độ chính xác</div></div>
        <div class="result-card"><div class="number">${typingState.errors}</div><div class="label">Lỗi</div></div>
    `;

    drawChart(record);

    const history = appData.history.filter(h => h.textId === typingState.textId);
    historyList.innerHTML = '';
    if (history.length > 1) {
        const others = history.slice(0, -1).reverse();
        others.forEach((h, i) => {
            const date = new Date(h.timestamp).toLocaleString();
            const div = document.createElement('div');
            div.className = 'history-item';
            div.textContent = `#${i+1} ${h.wpm} WPM (${date})`;
            historyList.appendChild(div);
        });
    } else {
        historyList.innerHTML = '<span style="color:var(--text-muted);">Chưa có lần gõ trước.</span>';
    }
}

function drawChart(record) {
    const canvas = speedChart;
    const ctx = canvas.getContext('2d');
    const data = typingState.wpmHistory || [];
    const rect = canvas.parentElement.getBoundingClientRect();
    const width = rect.width || 600;
    const height = 200;
    canvas.width = width;
    canvas.height = height;

    const computedStyle = getComputedStyle(document.body);
    const textColor = computedStyle.getPropertyValue('--text').trim() || '#0f172a';
    const textMuted = computedStyle.getPropertyValue('--text-muted').trim() || '#64748b';
    const borderColor = computedStyle.getPropertyValue('--border').trim() || '#e2e8f0';

    if (data.length < 2) {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = textMuted;
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Chưa đủ dữ liệu', width/2, height/2);
        return;
    }

    const pad = { top: 20, bottom: 30, left: 40, right: 20 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;

    const times = data.map(d => d.time);
    const maxTime = Math.max(...times) || 1;
    const maxWpm = Math.max(...data.map(d => d.wpm), 10);

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + chartH);
    ctx.lineTo(pad.left + chartW, pad.top + chartH);
    ctx.stroke();

    ctx.strokeStyle = textColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    data.forEach((d, i) => {
        const x = pad.left + (d.time / maxTime) * chartW;
        const y = pad.top + chartH - (d.wpm / maxWpm) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = textMuted;
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    const step = Math.ceil(maxTime / 4 / 1000) * 1000;
    for (let t = 0; t <= maxTime; t += step) {
        const x = pad.left + (t / maxTime) * chartW;
        ctx.fillText((t/1000).toFixed(0)+'s', x, pad.top + chartH + 18);
    }
    ctx.textAlign = 'right';
    ctx.fillText(maxWpm + ' WPM', pad.left - 6, pad.top + 12);
    ctx.fillText('0', pad.left - 6, pad.top + chartH);
}

// ============================================================
//  THÊM VĂN BẢN - XUẤT JSON
// ============================================================
function handleAddText(e) {
    e.preventDefault();
    const name = addName.value.trim();
    const content = addContent.value.trim();
    const isSecret = visibilityToggle ? visibilityToggle.checked : false;
    let secret = addSecret.value.trim();
    const difficulty = parseInt(difficultySlider.value);

    if (!name || !content) {
        showMessage('Lỗi', 'Vui lòng điền tên và nội dung.');
        return;
    }

    if (isSecret) {
        if (!secret) {
            secretError.hidden = false;
            return;
        }
        secretError.hidden = true;
    } else {
        secret = '';
    }

    const newText = {
        id: 'text_' + Date.now(),
        name,
        content,
        secret,
        difficulty
    };

    const json = JSON.stringify(newText, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isSecret ? `${secret}.json` : `${name.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showMessage('Thành công', `Đã tạo file JSON. Bạn cần:
1. Đặt file vào thư mục ${isSecret ? 'secret/' : 'public/'}
2. ${isSecret ? '' : 'Thêm entry vào public/texts.json với filename tương ứng'}
3. Push lên GitHub.`);
    setTimeout(() => {
        showHome();
    }, 1000);
}

// ============================================================
//  CUSTOM SLIDER
// ============================================================
function updateSliderUI(val) {
    const max = 3;
    const percent = (val / max) * 100;
    if (sliderTrack) sliderTrack.style.width = percent + '%';
    if (sliderThumb) sliderThumb.style.left = percent + '%';
}

let isDragging = false;
function initSlider() {
    if (!customSlider) return;
    const slider = customSlider;
    const thumb = sliderThumb;

    function getValueFromEvent(e) {
        const rect = slider.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const percent = Math.min(1, Math.max(0, x / rect.width));
        return Math.round(percent * 3);
    }

    function setValue(val) {
        const clamped = Math.min(3, Math.max(0, val));
        difficultySlider.value = clamped;
        updateSliderUI(clamped);
        difficultyLabel.textContent = getDifficultyName(clamped);
    }

    thumb.addEventListener('mousedown', (e) => {
        isDragging = true;
        e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const val = getValueFromEvent(e);
        setValue(val);
    });
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    thumb.addEventListener('touchstart', (e) => {
        isDragging = true;
        e.preventDefault();
    });
    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const val = getValueFromEvent(e);
        setValue(val);
    });
    document.addEventListener('touchend', () => {
        isDragging = false;
    });

    slider.addEventListener('click', (e) => {
        if (e.target === thumb) return;
        const val = getValueFromEvent(e);
        setValue(val);
    });

    updateSliderUI(0);
}
initSlider();

// ============================================================
//  TOGGLE CÔNG KHAI / BÍ MẬT
// ============================================================
if (visibilityToggle) {
    visibilityToggle.addEventListener('change', function() {
        const labels = document.querySelectorAll('.toggle-label');
        if (this.checked) {
            if (labels[0]) labels[0].classList.remove('active');
            if (labels[1]) labels[1].classList.add('active');
            secretCodeGroup.classList.add('open');
        } else {
            if (labels[0]) labels[0].classList.add('active');
            if (labels[1]) labels[1].classList.remove('active');
            secretCodeGroup.classList.remove('open');
            secretError.hidden = true;
        }
    });
}

// ============================================================
//  SỰ KIỆN
// ============================================================
goTypingBtn.addEventListener('click', showSelect);
backHomeFromSelect.addEventListener('click', showHome);
backHomeFromAdd.addEventListener('click', showHome);
backHomeFromResult.addEventListener('click', showHome);
abortTypingBtn.addEventListener('click', abortTyping);
retryBtn.addEventListener('click', () => {
    if (typingState.textId) {
        const meta = publicTexts.find(t => t.id === typingState.textId);
        if (meta) {
            fetchTextByFilename(meta.filename).then(data => {
                if (data) startTypingWithData(data);
                else showHome();
            });
        } else {
            showMessage('Lỗi', 'Không thể thử lại văn bản bí mật.');
            showHome();
        }
    } else {
        showHome();
    }
});
addTextBtn.addEventListener('click', showAdd);
cancelAddBtn.addEventListener('click', showHome);

secretGoBtn.addEventListener('click', openSecretText);
secretCodeInput.addEventListener('keydown', e => { if (e.key === 'Enter') openSecretText(); });

addTextForm.addEventListener('submit', handleAddText);

popupConfirm.addEventListener('click', checkPassword);
popupCancel.addEventListener('click', closePopup);
popupPassword.addEventListener('keydown', e => { if (e.key === 'Enter') checkPassword(); });

window.addEventListener('resize', () => {
    if (typingScreen.classList.contains('active')) {
        updateVirtualCaret();
    }
});

// ============================================================
//  KHỞI ĐỘNG
// ============================================================
loadTheme();
showHome();
fetchPublicTexts();
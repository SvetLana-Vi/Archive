/* ============================================================
   ЛОГИКА САЙТА
   ============================================================ */

const STORY_DATA = {};
STORIES.forEach(s => {
    STORY_DATA[s.id] = {
        ...s,
        characters: CHARACTERS[s.id] || [],
        messages:   CHATS[s.id] || null
    };
});

const chatStoryList   = document.getElementById('chatStoryList');
const chatWindow      = document.getElementById('chatWindow');
const chatStoryTitle  = document.getElementById('chatStoryTitle');
const chatStoryDate   = document.getElementById('chatStoryDate');
const chatStorySub    = document.getElementById('chatStorySub');
const chatPartsNav    = document.getElementById('chatPartsNav');

const charStoriesGrid = document.getElementById('charStoriesGrid');
const charDetail      = document.getElementById('charDetail');
const charList        = document.getElementById('charList');
const charDetailTitle = document.getElementById('charDetailTitle');
const charDetailDate  = document.getElementById('charDetailDate');
const backToStories   = document.getElementById('backToStories');
const readChatBtn     = document.getElementById('readChatBtn');

const modal        = document.getElementById('modal');
const modalContent = document.getElementById('modalContent');
const modalClose   = document.getElementById('modalClose');

/* ============================================================
   СПИСОК ПЕРЕПИСОК
   ============================================================ */
function renderChatList(){
    chatStoryList.innerHTML = '';
    
    // Собираем все истории (старые + новые)
    const allStories = [...STORIES];
    if (typeof campStoryData !== 'undefined') allStories.push(campStoryData);

    allStories.forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'story-btn';
        btn.dataset.id = s.id;
        btn.innerHTML = `${s.title}<small>${s.date}</small>`;
        btn.addEventListener('click', () => loadStory(s.id, btn));
        chatStoryList.appendChild(btn);
    });
}

/* ============================================================
   СООБЩЕНИЯ
   ============================================================ */
function createMessage(msg){
    // Локации (Дом, Лагерь и т.д.)
    if (msg.type === 'location'){
        const div = document.createElement('div');
        div.className = 'message location';
        const span = document.createElement('span');
        span.className = 'text';
        span.textContent = msg.text;
        div.appendChild(span);
        return div;
    }

    // Системные
    if (msg.type === 'system'){
        const div = document.createElement('div');
        div.className = 'message system' + (msg.highlight ? ' highlight' : '');
        const span = document.createElement('span');
        span.className = 'text';
        span.textContent = msg.text;
        div.appendChild(span);
        return div;
    }

    const div = document.createElement('div');
    div.className = 'message ' + (msg.side || 'left');
    if (msg.variant) div.classList.add(msg.variant);

    const sender = document.createElement('span');
    sender.className = 'sender';
    sender.textContent = msg.sender;
    
    // ЦВЕТА ПЕРСОНАЖЕЙ
    const senderColors = {
        'Мама': '#20aff1',        // Желтый
        'Полина': '#20d15b',      // Розовый
        'Макс': '#ffe65cfb',        // Голубой
        'Мила': '#ca7514',        // Зеленый
        'Алик': '#4e31b8',        // Бирюзовый
        'Виктория': '#f30cf3',    // Светло-фиолетовый
        'Вожатая': '#00ffff',     // Оранжевый
        'Организатор': '#9c32f3'  // Фиолетовый (как ты просила)
    };
    
    if (senderColors[msg.sender]) {
        sender.style.color = senderColors[msg.sender];
        sender.style.textShadow = '0 0 10px ' + senderColors[msg.sender] + '55'; // Легкое свечение
    }
    
    div.appendChild(sender);

    // Картинка
    if (msg.type === 'image'){
        const img = document.createElement('img');
        img.className = 'msg-img';
        img.src = msg.src;
        img.alt = msg.text || 'Фото';
        img.loading = 'lazy';
        img.addEventListener('error', () => {
            img.remove();
            const fallback = document.createElement('span');
            fallback.className = 'msg-img-fallback';
            fallback.textContent = '[ФОТО НЕДОСТУПНО]';
            div.insertBefore(fallback, div.querySelector('.text'));
        });
        div.appendChild(img);
    }

    if (msg.text){
        const text = document.createElement('span');
        text.className = 'text';
        text.textContent = msg.text;
        div.appendChild(text);
    }

    if (msg.time){
        const time = document.createElement('span');
        time.className = 'time';
        time.textContent = msg.time;
        div.appendChild(time);
    }
    return div;
}

/* ============================================================
   ЗАГРУЗКА ИСТОРИИ (С ЧАСТЯМИ)
   ============================================================ */
let currentChatId = null;
let currentChatPart = 'part1';

function loadStory(id, btn){
    document.querySelectorAll('#chatStoryList .story-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    // Объединяем данные, чтобы подтянулись настройки частей
    let story = STORY_DATA[id];
    if (id === 'camp' && typeof campStoryData !== 'undefined') {
        story = { ...story, ...campStoryData }; 
    }
    
    if (!story) return;

    currentChatId = id;
    currentChatPart = 'part1'; // Всегда начинаем с первой части

    chatStoryTitle.textContent = story.title;
    chatStoryDate.textContent  = 'начата ' + story.date;
    chatStorySub.textContent   = 'чат: ' + (story.chatName || 'Anonym') + ' · без шифрования';

    // Рендер кнопок частей (если их больше 1)
    chatPartsNav.innerHTML = '';
    if (story.partsCount && story.partsCount > 1) {
        for (let i = 1; i <= story.partsCount; i++) {
            const pBtn = document.createElement('button');
            pBtn.className = 'part-btn' + (i === 1 ? ' active' : '');
            pBtn.textContent = 'Часть ' + i;
            pBtn.onclick = () => {
                chatPartsNav.querySelectorAll('.part-btn').forEach(b => b.classList.remove('active'));
                pBtn.classList.add('active');
                renderChatPart(id, 'part' + i);
            };
            chatPartsNav.appendChild(pBtn);
        }
    }

    renderChatPart(id, currentChatPart);
}

function renderChatPart(id, partName) {
    currentChatPart = partName;
    chatWindow.innerHTML = '';
    
    let messages = null;

    // Если это новая история (camp) — берем из campChats, иначе из старых CHATS
    if (id === 'camp' && typeof campChats !== 'undefined') {
        messages = campChats[partName];
    } else if (CHATS[id]) {
        messages = CHATS[id];
    }

    if (messages && messages.length) {
        const frag = document.createDocumentFragment();
        messages.forEach(msg => frag.appendChild(createMessage(msg)));
        chatWindow.appendChild(frag);
        chatWindow.scrollTop = 0;
    } else {
        const ph = document.createElement('div');
        ph.className = 'chat-placeholder';
        ph.innerHTML = `
            <div class="ph-title">// ЗАПИСЬ НЕ ВОССТАНОВЛЕНА</div>
            <div class="ph-sub">Ожидайте продолжения</div>
            <div class="ph-hint">Текст этой части переписки ещё не загружен в архив.<br>Попробуйте позже.</div>
        `;
        chatWindow.appendChild(ph);
    }
}

/* ============================================================
   ПЕРСОНАЖИ
   ============================================================ */
function renderCharStories(){
    charStoriesGrid.innerHTML = '';
    
    const allStories = [...STORIES];
    if (typeof campStoryData !== 'undefined') allStories.push(campStoryData);

    allStories.forEach(s => {
        let chars = [];
        if (s.id === 'camp' && typeof campCharacters !== 'undefined') {
            chars = campCharacters;
        } else if (CHARACTERS[s.id]) {
            chars = CHARACTERS[s.id];
        }
        
        const hasChars = chars.length > 0;
        const card = document.createElement('button');
        card.className = 'char-story-card';
        card.innerHTML = `
            <div class="csc-title">${s.title}</div>
            <div class="csc-date">${s.date}</div>
            <div class="csc-hint">${hasChars ? '→ персонажи' : '→ засекречено'}</div>
        `;
        card.addEventListener('click', () => openStoryChars(s.id));
        charStoriesGrid.appendChild(card);
    });
}

function openStoryChars(id){
    const story = STORY_DATA[id] || (typeof campStoryData !== 'undefined' && id === 'camp' ? campStoryData : null);
    if (!story) return;

    charStoriesGrid.style.display = 'none';
    charDetail.style.display = 'block';

    charDetailTitle.textContent = story.title;
    charDetailDate.textContent  = 'Начата: ' + story.date;
    charList.innerHTML = '';

    let chars = [];
    if (id === 'camp' && typeof campCharacters !== 'undefined') {
        chars = campCharacters;
    } else if (STORY_DATA[id]) {
        chars = STORY_DATA[id].characters;
    }

    if (chars.length){
        chars.forEach(ch => {
            const card = document.createElement('div');
            card.className = 'char';
            const avatarHtml = ch.avatarUrl
                ? `<img src="${ch.avatarUrl}" alt="${ch.name}" onerror="this.parentElement.textContent='${(ch.name || '?').charAt(0)}'">`
                : (ch.name || '?').charAt(0);
            card.innerHTML = `
                <div class="avatar">${avatarHtml}</div>
                <h3>${ch.name || '—'}</h3>
                <div class="role">${ch.role || ''}</div>
                <p>${ch.desc || ''}</p>
                <div class="status ${ch.statusClass || ''}">${ch.status || ''}</div>
            `;
            card.addEventListener('click', () => openCharacterDossier(ch));
            charList.appendChild(card);
        });
    } else if (id === 'camp') {
        // Специальная заглушка для незавершенной истории
        const ph = document.createElement('div');
        ph.className = 'char locked';
        ph.style.gridColumn = '1 / -1';
        ph.innerHTML = `
            <div class="avatar" style="animation:none; color:var(--red); font-size:32px;">⏳</div>
            <h3>ПЕРЕПИСКА НЕ ЗАВЕРШЕНА</h3>
            <div class="role">Досье временно недоступно</div>
            <p>Страшная переписка «Ночь ужасов в лагере» ещё не закончена. Досье персонажей появятся в архиве после публикации финальной части.</p>
            <div class="status unknown">ОЖИДАЙТЕ ПРОДОЛЖЕНИЯ</div>
        `;
        charList.appendChild(ph);
    } else {
        for (let i = 1; i <= 4; i++){
            const card = document.createElement('div');
            card.className = 'char locked';
            card.innerHTML = `
                <div class="avatar">?</div>
                <h3>ПЕРСОНАЖ #${i}</h3>
                <div class="role">Имя скрыто</div>
                <p>Досье засекречено. Информация появится позже.</p>
                <div class="status unknown">ДОСТУП ЗАСЕКРЕЧЕН</div>
            `;
            card.addEventListener('click', () => openLockedDossier(story.title, i));
            charList.appendChild(card);
        }
    }

    if (story.messages || (id === 'camp' && typeof campChats !== 'undefined' && campChats.part1)) {
        readChatBtn.style.display = 'inline-block';
        readChatBtn.onclick = () => {
            activateTab(document.querySelector('.tab[data-target="panel-chats"]'));
            const btn = document.querySelector(`#chatStoryList .story-btn[data-id="${id}"]`);
            if (btn) loadStory(id, btn);
        };
    } else {
        readChatBtn.style.display = 'none';
    }
}

backToStories.addEventListener('click', () => {
    charDetail.style.display = 'none';
    charStoriesGrid.style.display = 'grid';
});

/* ============================================================
   МОДАЛКА ДОСЬЕ
   ============================================================ */
function openModal(html){
    modalContent.innerHTML = html;
    modal.classList.add('active');
    modalContent.parentElement.scrollTop = 0;
}

function openLockedDossier(storyTitle, num){
    openModal(`
        <div class="dossier" style="padding:34px 28px;text-align:center;">
            <div class="modal-label">ДОСЬЕ · ${storyTitle}</div>
            <div class="modal-lock">🔒</div>
            <h3>ДОСТУП ЗАСЕКРЕЧЕН</h3>
            <p>Информация о персонаже #${num} будет добавлена в архив позже.</p>
        </div>
    `);
}

function openCharacterDossier(ch){
    const initial = (ch.name || '?').charAt(0);
    const avatarHtml = ch.avatarUrl
        ? `<img src="${ch.avatarUrl}" alt="${ch.name}" onerror="this.parentElement.textContent='${initial}'">`
        : `<span>${initial}</span>`;

    const infoHtml = (ch.info && ch.info.length)
        ? ch.info.map(i => `
            <div class="di-row">
                <span class="di-k">${i.label}</span>
                <span class="di-v">${i.value}</span>
            </div>`).join('')
        : '';

    openModal(`
        <div class="dossier">
            <div class="dossier-head">
                <div class="dossier-file-id">DOSSIER · <b>${ch.id || 'RTM-???'}</b></div>
                <div class="dossier-stamp">CLASSIFIED</div>
            </div>

            <div class="dossier-hero">
                <div class="dossier-avatar">${avatarHtml}</div>
                <h3 class="dossier-name">${ch.name}</h3>
                <div class="dossier-role">${ch.role || ''}</div>
            </div>

            <div class="dossier-body">
                <div class="block-label">Описание</div>
                <div class="dossier-desc">${ch.desc || '—'}</div>

                ${infoHtml ? `
                    <div class="block-label">Данные</div>
                    <div class="dossier-info">${infoHtml}</div>
                ` : ''}

                ${ch.note ? `<div class="dossier-note"><span class="dossier-note-label">⚠ Отметка аналитика</span>${ch.note}</div>` : ''}

                <div class="dossier-status-wrap">
                    <div class="dossier-status ${ch.statusClass || ''}">${ch.status || '—'}</div>
                </div>
            </div>
        </div>
    `);
}

modalClose.addEventListener('click', () => modal.classList.remove('active'));
modal.addEventListener('click', e => {
    if (e.target === modal) modal.classList.remove('active');
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') modal.classList.remove('active');
});

/* ============================================================
   ТАБЫ
   ============================================================ */
const tabs   = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

function activateTab(tab){
    if (!tab) return;
    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const panel = document.getElementById(tab.dataset.target);
    if (panel) panel.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
tabs.forEach(tab => tab.addEventListener('click', () => activateTab(tab)));

document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= tabs.length) activateTab(tabs[n - 1]);
});

/* ============================================================
   ФОНОВЫЙ ЗВУК
   ============================================================ */
let audioCtx = null;
let masterGain = null;
const soundBtn = document.getElementById('soundBtn');

if (soundBtn) {
    soundBtn.addEventListener('click', () => {
        if (!audioCtx){
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = audioCtx.createGain();
            masterGain.gain.value = 0;
            masterGain.connect(audioCtx.destination);
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 240;
            filter.connect(masterGain);
            [55, 55.7, 82.4].forEach(freq => {
                const osc = audioCtx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = freq;
                const g = audioCtx.createGain();
                g.gain.value = 0.05;
                osc.connect(g);
                g.connect(filter);
                osc.start();
            });
            const lfo = audioCtx.createOscillator();
            lfo.frequency.value = 0.07;
            const lfoGain = audioCtx.createGain();
            lfoGain.gain.value = 90;
            lfo.connect(lfoGain);
            lfoGain.connect(filter.frequency);
            lfo.start();
            masterGain.gain.linearRampToValueAtTime(0.10, audioCtx.currentTime + 2);
            soundBtn.classList.add('on');
            soundBtn.textContent = 'ЗВУК: ВКЛ';
            return;
        }
        if (soundBtn.classList.contains('on')){
            masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.6);
            soundBtn.classList.remove('on');
            soundBtn.textContent = 'ЗВУК: ВЫКЛ';
        } else {
            masterGain.gain.linearRampToValueAtTime(0.10, audioCtx.currentTime + 0.6);
            soundBtn.classList.add('on');
            soundBtn.textContent = 'ЗВУК: ВКЛ';
        }
    });
}

/* ============================================================
   СТАРТ
   ============================================================ */
window.addEventListener('DOMContentLoaded', () => {
    renderChatList();
    renderCharStories();
});

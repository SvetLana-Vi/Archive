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

/* ---------- DOM ---------- */
const chatStoryList   = document.getElementById('chatStoryList');
const chatWindow      = document.getElementById('chatWindow');
const chatStoryTitle  = document.getElementById('chatStoryTitle');
const chatStoryDate   = document.getElementById('chatStoryDate');
const chatStorySub    = document.getElementById('chatStorySub');

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
    STORIES.forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'story-btn';
        btn.dataset.id = s.id;
        btn.innerHTML = `${s.title}<small>${s.date}</small>`;
        btn.addEventListener('click', () => loadStory(s.id, btn));
        chatStoryList.appendChild(btn);
    });
}

/* ============================================================
   СОЗДАНИЕ СООБЩЕНИЙ
   ============================================================ */
function createMessage(msg){

    /* --- системное --- */
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
    div.appendChild(sender);

    /* --- картинка --- */
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

    /* --- видео --- */
    if (msg.type === 'video'){
        const videoWrapper = document.createElement('div');
        videoWrapper.className = 'msg-video-wrapper';
        videoWrapper.innerHTML = `
            <video src="${msg.src}" class="msg-video" preload="metadata"></video>
            <div class="msg-video-overlay">▶ СМОТРЕТЬ ВИДЕО</div>
        `;
        videoWrapper.addEventListener('click', () => openVideoModal(msg.src));
        div.appendChild(videoWrapper);
    }

    /* --- текст --- */
    if (msg.text){
        const text = document.createElement('span');
        text.className = 'text';
        text.textContent = msg.text;
        div.appendChild(text);
    }

    /* --- время --- */
    if (msg.time){
        const time = document.createElement('span');
        time.className = 'time';
        time.textContent = msg.time;
        div.appendChild(time);
    }

    return div;
}

/* ============================================================
   ЗАГРУЗКА ПЕРЕПИСКИ
   ============================================================ */
function loadStory(id, btn){
    document.querySelectorAll('#chatStoryList .story-btn')
        .forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const story = STORY_DATA[id];
    if (!story) return;

    /* шапка */
    chatStoryTitle.textContent = story.title;
    chatStoryDate.textContent  = 'начата ' + story.date;
    chatStorySub.textContent   = 'канал: ' + (story.chatName || 'Anonym') + ' · без шифрования';

    chatWindow.innerHTML = '';

    if (story.messages && story.messages.length){
        const frag = document.createDocumentFragment();
        story.messages.forEach(msg => frag.appendChild(createMessage(msg)));
        chatWindow.appendChild(frag);
        chatWindow.scrollTop = 0;
    } else {
        const ph = document.createElement('div');
        ph.className = 'chat-placeholder';
        ph.innerHTML = `
            <div class="ph-title">// ЗАПИСЬ НЕ ВОССТАНОВЛЕНА</div>
            <div class="ph-sub">${story.title}</div>
            <div class="ph-date">Начата: ${story.date}</div>
            <div class="ph-hint">Текст этой переписки ещё не загружен в архив.<br>Попробуйте позже.</div>
        `;
        chatWindow.appendChild(ph);
    }
}

/* ============================================================
   ПЕРСОНАЖИ
   ============================================================ */
function renderCharStories(){
    charStoriesGrid.innerHTML = '';
    STORIES.forEach(s => {
        const hasChars = STORY_DATA[s.id].characters.length > 0;
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
    const story = STORY_DATA[id];
    if (!story) return;

    charStoriesGrid.style.display = 'none';
    charDetail.style.display = 'block';

    charDetailTitle.textContent = story.title;
    charDetailDate.textContent  = 'Начата: ' + story.date;
    charList.innerHTML = '';

    if (story.characters.length){
        story.characters.forEach(ch => {
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

    if (story.messages && story.messages.length){
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
   МОДАЛКА
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

function openVideoModal(src){
    openModal(`
        <div style="padding: 10px; text-align: center;">
            <div class="modal-label" style="margin-bottom: 10px;">ВОСПРОИЗВЕДЕНИЕ ЗАПИСИ</div>
            <video src="${src}" controls autoplay style="width: 100%; border-radius: 4px; border: 1px solid var(--line); box-shadow: 0 0 20px rgba(255,43,61,0.2);"></video>
        </div>
    `);
}

function openVideoModal(src){
    openModal(`
        <div style="padding: 10px; text-align: center;">
            <div class="modal-label" style="margin-bottom: 10px;">ВОСПРОИЗВЕДЕНИЕ ЗАПИСИ</div>
            <div style="display: flex; justify-content: center; align-items: center; width: 100%;">
                <video src="${src}" controls autoplay style="
                    max-width: 100%; 
                    max-height: 70vh; 
                    object-fit: contain; 
                    border-radius: 4px; 
                    border: 1px solid var(--line); 
                    box-shadow: 0 0 20px rgba(255,43,61,0.2);
                "></video>
            </div>
        </div>
    `);
}
/* ============================================================
   СТАРТ
   ============================================================ */
window.addEventListener('DOMContentLoaded', () => {
    renderChatList();
    renderCharStories();
});

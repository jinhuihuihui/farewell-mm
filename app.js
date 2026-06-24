// ============================================================
//  app.js — 前端逻辑
// ============================================================

const CFG = window.CARD_CONFIG;
let currentUser = null;
let selectedColor = '#fff9c4';
let selectedPhotoFile = null;

const PIN_COLORS  = ['#f87171','#fb923c','#a78bfa','#34d399','#60a5fa','#f472b6','#fbbf24'];
const STICKERS = [
  `<svg width="34" height="34" viewBox="0 0 34 34"><path d="M17 30C17 30 3 21 3 12C3 7 7.5 4 12 4C14.5 4 16.2 5.5 17 7.2C17.8 5.5 19.5 4 22 4C26.5 4 31 7 31 12C31 21 17 30 17 30Z" fill="#ff8fab" stroke="#ff6b9d" stroke-width="1"/></svg>`,
  `<svg width="30" height="30" viewBox="0 0 30 30"><polygon points="15,2 18,11 28,11 20,17 23,27 15,21 7,27 10,17 2,11 12,11" fill="#ffe066" stroke="#ffc200" stroke-width="1"/></svg>`,
  `<svg width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="12" fill="#ffd6e0"/><circle cx="9" cy="12" r="5" fill="#ffb3c6"/><circle cx="21" cy="12" r="5" fill="#ffb3c6"/><circle cx="15" cy="21" r="5" fill="#ffb3c6"/><circle cx="15" cy="8" r="4" fill="#ff85a1"/></svg>`,
  `<svg width="28" height="36" viewBox="0 0 28 36"><ellipse cx="14" cy="10" rx="7" ry="9" fill="#a8e6cf"/><ellipse cx="7" cy="22" rx="7" ry="9" fill="#a8e6cf"/><ellipse cx="21" cy="22" rx="7" ry="9" fill="#a8e6cf"/><rect x="12" y="28" width="4" height="7" rx="2" fill="#8b6914"/></svg>`,
  `<svg width="34" height="22" viewBox="0 0 34 22"><path d="M3 18 Q3 4 17 4 Q31 4 31 18" fill="none" stroke="#60a5fa" stroke-width="3" stroke-linecap="round"/><path d="M7 18 Q7 8 17 8 Q27 8 27 18" fill="none" stroke="#34d399" stroke-width="3" stroke-linecap="round"/><path d="M11 18 Q11 12 17 12 Q23 12 23 18" fill="none" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/></svg>`,
  `<svg width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="8" fill="#ffd6a5"/><circle cx="15" cy="5" r="5" fill="#ffb347"/><circle cx="24" cy="10" r="5" fill="#ffb347"/><circle cx="24" cy="20" r="5" fill="#ffb347"/><circle cx="15" cy="25" r="5" fill="#ffb347"/><circle cx="6" cy="20" r="5" fill="#ffb347"/><circle cx="6" cy="10" r="5" fill="#ffb347"/></svg>`,
  `<svg width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="13" fill="#ffeaa7"/><circle cx="10" cy="12" r="2" fill="#fdcb6e"/><circle cx="20" cy="12" r="2" fill="#fdcb6e"/><path d="M9 19 Q15 24 21 19" fill="none" stroke="#fdcb6e" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  `<svg width="30" height="30" viewBox="0 0 30 30"><path d="M15 3 Q19 3 21 7 Q25 7 25 11 Q25 15 21 17 Q21 22 15 24 Q9 22 9 17 Q5 15 5 11 Q5 7 9 7 Q11 3 15 3Z" fill="#b5ead7" stroke="#78c9a6" stroke-width="1"/></svg>`,
  `<svg width="32" height="20" viewBox="0 0 32 20"><ellipse cx="16" cy="14" rx="14" ry="5" fill="#e0f2ff"/><ellipse cx="10" cy="10" rx="7" ry="5" fill="#fff"/><ellipse cx="18" cy="8" rx="9" ry="6" fill="#fff"/><ellipse cx="25" cy="11" rx="6" ry="4" fill="#fff"/></svg>`,
  `<svg width="26" height="34" viewBox="0 0 26 34"><path d="M13 32 Q2 22 2 13 Q2 4 13 4 Q24 4 24 13 Q24 22 13 32Z" fill="#fdcfe8" stroke="#f9a8d4" stroke-width="1"/><path d="M13 10 Q8 16 13 20 Q18 16 13 10Z" fill="#f9a8d4"/></svg>`,
];

// ============================================================
//  GOOGLE AUTH
// ============================================================
function handleGoogleLogin(response) {
  const payload = parseJwt(response.credential);
  const email = payload.email || '';

  if (!email.endsWith('@' + CFG.allowedDomain)) {
    showToast(`❌ 只允许 @${CFG.allowedDomain} 邮箱登录`);
    return;
  }

  currentUser = {
    name: payload.name,
    email: payload.email,
    avatar: payload.picture,
    token: response.credential,
  };

  document.getElementById('authBar').style.display  = 'none';
  document.getElementById('userBar').style.display  = '';
  document.getElementById('userAvatar').src         = currentUser.avatar;
  document.getElementById('userName').textContent   = currentUser.name;
  document.getElementById('composeSection').style.display = '';
  document.getElementById('loginPrompt').style.display   = 'none';
}

function logout() {
  currentUser = null;
  document.getElementById('authBar').style.display  = '';
  document.getElementById('userBar').style.display  = 'none';
  document.getElementById('composeSection').style.display = 'none';
  document.getElementById('loginPrompt').style.display   = '';
  google.accounts.id.disableAutoSelect();
}

function parseJwt(token) {
  const base64 = token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
  return JSON.parse(atob(base64));
}

// ============================================================
//  TABS
// ============================================================
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach((b,i) => b.classList.toggle('active', (i===0&&tab==='note')||(i===1&&tab==='photo')));
  document.getElementById('noteTab').style.display  = tab === 'note'  ? '' : 'none';
  document.getElementById('photoTab').style.display = tab === 'photo' ? '' : 'none';
}

// ============================================================
//  COLOR PICKER + CHAR COUNT
// ============================================================
function pickColor(el) {
  document.querySelectorAll('.sw').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  selectedColor = el.dataset.color;
}

document.addEventListener('DOMContentLoaded', () => {
  const box = document.getElementById('msgBox');
  if (box) {
    box.addEventListener('input', () => {
      document.getElementById('charCount').textContent = box.value.length;
    });
  }

  // Update Google Client ID from config
  const gsi = document.getElementById('g_id_onload');
  if (gsi) gsi.dataset.clientId = CFG.googleClientId;

  loadBoard();
});

// ============================================================
//  SUBMIT NOTE
// ============================================================
async function submitNote() {
  if (!currentUser) return showToast('请先登录');
  const msg = document.getElementById('msgBox').value.trim();
  if (!msg) return showToast('请写点什么 ✏️');

  const btn = document.querySelector('#noteTab .submit-btn');
  btn.disabled = true; btn.textContent = '提交中...';

  try {
    const res = await fetch(CFG.workerUrl + '/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: currentUser.token,
        message: msg,
        color: selectedColor,
        name: currentUser.name,
        avatar: currentUser.avatar,
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    document.getElementById('msgBox').value = '';
    document.getElementById('charCount').textContent = '0';
    showToast('留言成功！📌');
    loadBoard();
  } catch (e) {
    showToast('提交失败，请重试 😢');
    console.error(e);
  } finally {
    btn.disabled = false; btn.textContent = '贴上去 📌';
  }
}

// ============================================================
//  PHOTO UPLOAD
// ============================================================
function previewPhoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) return showToast('照片太大了，最大 5MB 📸');

  selectedPhotoFile = file;
  const reader = new FileReader();
  reader.onload = ev => {
    const prev = document.getElementById('photoPreview');
    prev.src = ev.target.result;
    prev.style.display = '';
    document.getElementById('captionInput').style.display = '';
    document.getElementById('photoSubmitBtn').style.display = '';
    document.getElementById('uploadArea').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

async function submitPhoto() {
  if (!currentUser || !selectedPhotoFile) return;
  const caption = document.getElementById('captionInput').value.trim();
  const btn = document.getElementById('photoSubmitBtn');
  btn.disabled = true; btn.textContent = '上传中...';

  try {
    // Convert to base64
    const base64 = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(',')[1]);
      r.onerror = rej;
      r.readAsDataURL(selectedPhotoFile);
    });

    const response = await fetch(CFG.workerUrl + '/api/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: currentUser.token,
        imageBase64: base64,
        mimeType: selectedPhotoFile.type,
        caption,
        name: currentUser.name,
      }),
    });
    if (!response.ok) throw new Error(await response.text());

    showToast('照片上传成功！🖼️');
    resetPhotoTab();
    loadBoard();
  } catch (e) {
    showToast('上传失败，请重试 😢');
    console.error(e);
  } finally {
    btn.disabled = false; btn.textContent = '上传照片 🖼️';
  }
}

function resetPhotoTab() {
  selectedPhotoFile = null;
  document.getElementById('photoInput').value = '';
  document.getElementById('photoPreview').style.display = 'none';
  document.getElementById('captionInput').style.display = 'none';
  document.getElementById('captionInput').value = '';
  document.getElementById('photoSubmitBtn').style.display = 'none';
  document.getElementById('uploadArea').style.display = '';
}

// ============================================================
//  LOAD BOARD
// ============================================================
async function loadBoard() {
  const board = document.getElementById('board');
  board.innerHTML = '<div class="board-loading">加载中... 🌸</div>';

  try {
    const res = await fetch(CFG.workerUrl + '/api/items');
    const data = await res.json();
    renderBoard(data.items || []);
  } catch (e) {
    board.innerHTML = '<div class="board-empty">暂时无法加载，请刷新试试 🌊</div>';
    console.error(e);
  }
}

// ============================================================
//  RENDER BOARD
// ============================================================
function renderBoard(items) {
  const board = document.getElementById('board');
  board.innerHTML = '';

  if (!items.length) {
    board.innerHTML = '<div class="board-empty">还没有留言，来第一个留言吧！✨</div>';
    return;
  }

  const BOARD_W = board.offsetWidth || 600;
  const COLS = window.innerWidth < 500 ? 2 : 3;
  const COL_W = (BOARD_W - 48) / COLS;
  const colTops = Array(COLS).fill(20);
  const placements = [];

  // Shuffle for variety
  const shuffled = [...items].sort(() => Math.random() - 0.5);

  shuffled.forEach((item, idx) => {
    const col = idx % COLS;
    const rot = (seededRand(idx * 17 + 3) - 0.5) * 13;
    const jitter = (seededRand(idx * 31 + 7) - 0.5) * 12;
    const isPhoto = item.type === 'photo';

    const W = isPhoto ? 115 : 130;
    const H = isPhoto ? 90  : 95;
    const x = col * COL_W + (COL_W - W) / 2 + jitter + 6;
    const y = colTops[col];

    const el = document.createElement('div');
    el.className = 'board-item';
    el.style.cssText = `left:${Math.max(4,x)}px;top:${y}px;width:${W}px;--rot:rotate(${rot}deg);transform:rotate(${rot}deg);z-index:${idx+1};`;

    const pinColor = PIN_COLORS[idx % PIN_COLORS.length];

    if (isPhoto) {
      el.innerHTML = `
        <div class="photo-card">
          <div class="pin" style="background:${pinColor}"></div>
          <img src="${item.url}" width="${W-14}" height="${H}" alt="${item.caption||''}"/>
          ${item.caption ? `<div class="photo-caption">${item.caption}</div>` : ''}
        </div>`;
      colTops[col] += H + (item.caption ? 54 : 42);
    } else {
      const date = new Date(item.createdAt).toLocaleDateString('zh-CN',{month:'long',day:'numeric'});
      el.innerHTML = `
        <div class="note-card" style="background:${item.color||'#fff9c4'};width:${W}px;">
          <div class="tape"></div>
          <div class="note-msg">${escapeHtml(item.message)}</div>
          <div class="note-meta">${escapeHtml(item.name)} · ${date}</div>
        </div>`;
      colTops[col] += H + 20;
    }

    board.appendChild(el);
    placements.push({ col, bottomY: colTops[col], x, W });
  });

  const maxH = Math.max(...colTops) + 50;
  board.style.minHeight = maxH + 'px';

  // Place stickers in gaps
  setTimeout(() => placeStickers(board, placements, COL_W, COLS, maxH), 60);
}

function placeStickers(board, placements, COL_W, COLS, maxH) {
  const gaps = [];
  for (let col = 0; col < COLS; col++) {
    const colItems = placements.filter(p => p.col === col);
    for (let i = 0; i < colItems.length - 1; i++) {
      const above = colItems[i];
      const below = colItems[i + 1];
      const gapTop = above.bottomY - 15;
      const gapH   = (below.bottomY - 80) - gapTop;
      if (gapH > 20) {
        gaps.push({
          x: col * COL_W + seededRand(col * 100 + i * 13) * COL_W * 0.55 + 4,
          y: gapTop + gapH * 0.1 + seededRand(col * 77 + i) * gapH * 0.6,
        });
      }
    }
  }

  // Always add corner stickers
  gaps.push({ x: 6, y: maxH - 55 });
  gaps.push({ x: (board.offsetWidth || 600) - 50, y: 8 });
  gaps.push({ x: (board.offsetWidth || 600) / 2 - 14, y: maxH - 48 });

  gaps.forEach((gap, i) => {
    const si  = (i * 4 + 3) % STICKERS.length;
    const rot = (seededRand(i * 53 + 11) - 0.5) * 32;
    const el  = document.createElement('div');
    el.className = 'sticker-el';
    el.style.cssText = `left:${gap.x}px;top:${gap.y}px;transform:rotate(${rot}deg);opacity:0.9;`;
    el.innerHTML = STICKERS[si];
    board.appendChild(el);
  });
}

// ============================================================
//  UTILS
// ============================================================
function seededRand(seed) {
  const s = (seed * 9301 + 49297) % 233280;
  return s / 233280;
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

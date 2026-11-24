// 공유 상태 + 공통 유틸
let rows = [];
let timer = null;
let running = false;
let currentIdx = 0;
let batchIdx = 0;
let collapsed = false;

let validRowsCache = [];
let paused = false;
let resumeFn = null;

function $(id) {
  return document.getElementById(id);
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function normalizeUrl(s) {
  return (!s.startsWith('http://') && !s.startsWith('https://')) ? 'https://' + s : s;
}

// 입력된 행 중 URL이 있는 것만 정규화해서 반환
function getValidRows() {
  return rows.map(r => {
    const u = r.url.trim();
    if (!u) return null;
    return { id: r.id, url: normalizeUrl(u), title: r.title || '' };
  }).filter(Boolean);
}

function setStatus(msg, cls) {
  const el = $('statusMsg');
  el.textContent = msg;
  el.className = cls || '';
}

// 링크 목록을 브라우저에 24시간 저장 / 불러오기
const STORAGE_KEY = 'autoclick:links';
const STORAGE_TTL = 24 * 60 * 60 * 1000; // 24시간

// 저장된 목록 읽기 (없거나 24시간 지났으면 null)
function readSaved() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!data || !Array.isArray(data.rows) || !data.rows.length) return null;
    if (Date.now() - data.savedAt > STORAGE_TTL) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch (e) {
    return null;
  }
}

// 현재 목록 저장. URL이 하나도 없으면 저장하지 않음
// (초기화를 눌러도 저장본은 남아서 불러오기로 되살릴 수 있음)
function saveLinks() {
  const list = rows
    .filter(r => r.url.trim())
    .map(r => ({ url: r.url.trim(), title: r.title || '' }));
  if (!list.length) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ rows: list, savedAt: Date.now() }));
  } catch (e) { /* 저장 불가(사생활 보호 모드 등) — 무시 */ }
  updateLoadButton();
}

// 링크 간격(초)은 기한 없이 계속 기억
const DELAY_KEY = 'autoclick:delay';

function saveDelay(v) {
  try { localStorage.setItem(DELAY_KEY, String(v)); } catch (e) {}
}

function restoreDelay() {
  let v = null;
  try { v = parseFloat(localStorage.getItem(DELAY_KEY)); } catch (e) {}
  const range = $('delayRange');
  if (v && v >= parseFloat(range.min) && v <= parseFloat(range.max)) {
    range.value = v;
    updateDelay();
  }
}

function formatRemaining(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? h + '시간 ' + m + '분' : m + '분';
}

// 저장본이 있으면 불러오기 버튼 표시
function updateLoadButton() {
  const btn = $('loadBtn');
  const data = readSaved();
  if (!data) { btn.style.display = 'none'; return; }
  btn.style.display = '';
  $('loadLabel').textContent = '불러오기 (' + data.rows.length + '개)';
  btn.title = formatRemaining(STORAGE_TTL - (Date.now() - data.savedAt)) + ' 뒤 자동 삭제';
}

function loadSaved() {
  const data = readSaved();
  if (!data) {
    setStatus('저장된 링크가 없거나 24시간이 지나 삭제됐습니다.', '');
    updateLoadButton();
    return;
  }
  stopAll();
  rows = data.rows.map((r, i) => ({ id: Date.now() + i + Math.random(), url: r.url, title: r.title }));
  batchIdx = 0;
  currentIdx = 0;
  renderRows();
  updateCount();
  $('progressWrap').style.display = 'none';
  setStatus(rows.length + '개 링크를 불러왔습니다.', 'success');
}

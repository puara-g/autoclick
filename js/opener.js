// 링크 열기: 순서대로 전체 / N개씩 묶음
const START_LABEL = '순서대로 전체 다 열기';
const RESUME_LABEL = '이어서 열기';
const BLOCK_MSG = '팝업이 차단됐어요 — 주소창 오른쪽 차단 아이콘에서 "항상 허용"을 고른 뒤 다시 누르면 막힌 링크부터 이어서 열려요.';

/*
 * 백그라운드에서도 멈추지 않는 타이머.
 * 새 탭으로 화면이 넘어가면 브라우저가 이 탭의 setTimeout을 크게 늦추는데,
 * Web Worker 안의 타이머는 그 영향을 받지 않음.
 */
const bgTimer = (() => {
  let worker = null;
  let seq = 0;
  const callbacks = {};
  try {
    const src = 'const t={};onmessage=e=>{const d=e.data;' +
      'if(d.clear){clearTimeout(t[d.id]);delete t[d.id];return;}' +
      't[d.id]=setTimeout(()=>{delete t[d.id];postMessage(d.id)},d.ms)}';
    worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
    worker.onmessage = e => {
      const fn = callbacks[e.data];
      delete callbacks[e.data];
      if (fn) fn();
    };
  } catch (e) {
    worker = null; // Worker를 못 쓰면 일반 타이머로
  }
  return {
    set(fn, ms) {
      if (!worker) return { native: setTimeout(fn, ms) };
      const id = ++seq;
      callbacks[id] = fn;
      worker.postMessage({ id, ms });
      return { id };
    },
    clear(h) {
      if (!h) return;
      if (h.native !== undefined) { clearTimeout(h.native); return; }
      delete callbacks[h.id];
      worker.postMessage({ id: h.id, clear: true });
    }
  };
})();

function getDelayMs() {
  return parseFloat($('delayRange').value) * 1000;
}

function nextDelay(delay) {
  const jitter = Math.random() * Math.min(delay * 0.5, 2000);
  return delay + jitter;
}

function setButtonsDisabled(disabled) {
  $('batchBtn').disabled = disabled;
  $('startBtn').disabled = disabled;
}

function setStartLabel(text) {
  $('startLabel').textContent = text;
}

function setProgress(done, total, label) {
  $('progressWrap').style.display = 'block';
  $('progressFill').style.width = Math.round((done / total) * 100) + '%';
  $('progressLabel').textContent = label;
}

// 링크 하나를 새 탭으로 열기. 팝업 차단으로 못 열면 false
function openLink(item) {
  setPill(item.id, 'active', '열기중');
  setInputState(item.id, 'active');

  let win = null;
  try { win = window.open(item.url, '_blank'); } catch (e) { win = null; }

  if (!win) {
    setPill(item.id, 'blocked', '차단');
    setInputState(item.id, '');
    return false;
  }
  try { win.opener = null; } catch (e) { /* 새 탭이 이 페이지를 건드리지 못하게 */ }

  setTimeout(() => {
    setPill(item.id, 'done', '완료');
    setInputState(item.id, 'done');
  }, 500);
  return true;
}

/* ---------- N개씩 한번에 열기 ---------- */
function updateBatchLabel() {
  $('batchLabel').textContent = $('batchSize').value + '개';
}

function reportBatchDone(chunkLen, total) {
  const remaining = total - batchIdx;
  if (remaining > 0) {
    setStatus(chunkLen + '개 완료. 남은 링크 ' + remaining + '개 — 버튼을 다시 누르세요.', 'info');
  } else {
    setStatus('모두 완료! ' + total + '개 링크를 열었습니다.', 'success');
    batchIdx = 0;
  }
}

function openBatch() {
  if (running) return; // 이미 진행 중이면 무시
  if (paused) stopAll(); // "순서대로" 쪽 이어서 열기 상태는 정리

  const validRows = getValidRows();
  if (validRows.length === 0) { setStatus('링크를 하나 이상 입력해주세요.', ''); return; }

  const size = parseInt($('batchSize').value);
  const chunk = validRows.slice(batchIdx, batchIdx + size);
  if (chunk.length === 0) {
    setStatus('모든 링크를 이미 열었습니다. 초기화 후 다시 시작하세요.', '');
    return;
  }

  running = true;
  setButtonsDisabled(true);

  const delay = getDelayMs();
  const total = validRows.length;
  let i = 0;

  function openNextInBatch() {
    if (!running) return;

    const item = chunk[i];
    const n = batchIdx + i;
    setProgress(n, total, (n + 1) + ' / ' + total);
    setStatus((n + 1) + ' / ' + total + ' — ' + (item.title || item.url), 'info');

    if (!openLink(item)) {
      // 막힌 링크부터 다음 클릭 때 다시 시작
      batchIdx += i;
      running = false;
      setButtonsDisabled(false);
      setStatus(BLOCK_MSG, '');
      return;
    }

    i++;
    if (i < chunk.length) {
      timer = bgTimer.set(openNextInBatch, nextDelay(delay));
    } else {
      batchIdx += chunk.length;
      setTimeout(() => {
        running = false;
        setButtonsDisabled(false);
        setProgress(batchIdx, total, batchIdx + ' / ' + total);
        reportBatchDone(chunk.length, total);
      }, 600);
    }
  }

  openNextInBatch();
}

/* ---------- 순서대로 전체 열기 ---------- */
function stopAll() {
  bgTimer.clear(timer);
  timer = null;
  running = false;
  paused = false;
  resumeFn = null;
  setButtonsDisabled(false);
  setStartLabel(START_LABEL);
}

// 차단돼서 멈춤 → 버튼이 "이어서 열기"로 바뀜
function pauseBlocked() {
  running = false;
  paused = true;
  setButtonsDisabled(false);
  setStartLabel(RESUME_LABEL);
  setStatus(BLOCK_MSG, '');
}

function startAll() {
  // 차단돼서 멈췄던 곳부터 이어서
  if (paused && resumeFn) {
    paused = false;
    running = true;
    setButtonsDisabled(true);
    setStartLabel(START_LABEL);
    resumeFn();
    return;
  }

  validRowsCache = getValidRows();
  if (validRowsCache.length === 0) {
    setStatus('링크를 하나 이상 입력해주세요.', '');
    return;
  }

  stopAll();
  running = true;
  currentIdx = 0;

  rows.forEach(r => { setPill(r.id, 'wait', '대기'); setInputState(r.id, ''); });
  setProgress(0, 1, '');
  setButtonsDisabled(true);

  const delay = getDelayMs();
  const total = validRowsCache.length;

  function openNext() {
    resumeFn = openNext;

    if (!running || currentIdx >= total) {
      if (running) finish(total);
      return;
    }

    const item = validRowsCache[currentIdx];
    setProgress(currentIdx, total, (currentIdx + 1) + ' / ' + total);
    setStatus((currentIdx + 1) + ' / ' + total + ' — ' + (item.title || item.url), 'info');

    if (!openLink(item)) {
      pauseBlocked(); // currentIdx는 그대로 → 이어서 열기 때 이 링크부터
      return;
    }

    currentIdx++;
    if (currentIdx < total) {
      timer = bgTimer.set(openNext, nextDelay(delay));
    } else {
      setTimeout(() => finish(total), 600);
    }
  }

  openNext();
}

function finish(count) {
  running = false;
  paused = false;
  resumeFn = null;
  setProgress(1, 1, count + ' / ' + count + ' 완료');
  setButtonsDisabled(false);
  setStartLabel(START_LABEL);
  setStatus('모두 완료! ' + count + '개 링크를 열었습니다.', 'success');
}

function clearAll() {
  stopAll();
  rows = [];
  renderRows();
  updateCount();
  batchIdx = 0;
  currentIdx = 0;
  $('progressWrap').style.display = 'none';
  $('progressFill').style.width = '0%';
  setStatus('', '');
}

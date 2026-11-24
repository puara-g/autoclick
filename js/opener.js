// 링크 열기: 순서대로 전체 / N개씩 묶음
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

function setProgress(done, total, label) {
  $('progressWrap').style.display = 'block';
  $('progressFill').style.width = Math.round((done / total) * 100) + '%';
  $('progressLabel').textContent = label;
}

// 링크 하나를 새 탭으로 열고 상태 표시
function openLink(item) {
  setPill(item.id, 'active', '열기중');
  setInputState(item.id, 'active');

  const a = document.createElement('a');
  a.href = item.url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => a.remove(), 300);

  setTimeout(() => {
    setPill(item.id, 'done', '완료');
    setInputState(item.id, 'done');
  }, 500);
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
  const validRows = getValidRows();
  if (validRows.length === 0) { setStatus('링크를 하나 이상 입력해주세요.', ''); return; }

  const size = parseInt($('batchSize').value);
  const chunk = validRows.slice(batchIdx, batchIdx + size);
  if (chunk.length === 0) {
    setStatus('모든 링크를 이미 열었습니다. 초기화 후 다시 시작하세요.', '');
    return;
  }
  if (running) return; // 이미 진행 중이면 무시

  running = true;
  setButtonsDisabled(true);

  const delay = getDelayMs();
  const total = validRows.length;
  let i = 0;

  function openNextInBatch() {
    if (!running || i >= chunk.length) {
      running = false;
      setButtonsDisabled(false);
      reportBatchDone(chunk.length, total);
      return;
    }

    const item = chunk[i];
    const n = batchIdx + i;
    setProgress(n, total, (n + 1) + ' / ' + total);
    setStatus((n + 1) + ' / ' + total + ' — ' + (item.title || item.url), 'info');
    openLink(item);

    i++;
    if (i < chunk.length) {
      timer = setTimeout(openNextInBatch, nextDelay(delay));
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
  if (timer) { clearTimeout(timer); timer = null; }
  running = false;
  paused = false;
  resumeFn = null;
  $('startBtn').disabled = false;
}

function startAll() {
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
  $('startBtn').disabled = true;

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
    openLink(item);

    currentIdx++;
    if (currentIdx < total) {
      timer = setTimeout(openNext, nextDelay(delay));
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
  $('startBtn').disabled = false;
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

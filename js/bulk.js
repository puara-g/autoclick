// 여러 링크 한꺼번에 붙여넣기
function isUrl(s) {
  return s.startsWith('http://') || s.startsWith('https://') || /^[\w-]+\.[\w]{2,}/.test(s);
}

function stripEmoji(s) {
  return s.replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
}

// URL이 아닌 줄은 바로 다음 URL의 제목으로 사용
function parseEntries(text) {
  const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean);
  const entries = [];
  let pendingTitle = '';
  for (const line of lines) {
    if (isUrl(line)) {
      entries.push({ url: normalizeUrl(line), title: stripEmoji(pendingTitle) });
      pendingTitle = '';
    } else {
      pendingTitle = line;
    }
  }
  return entries;
}

function onBulkPaste() {
  setTimeout(() => processBulkText($('bulkInput').value), 10);
}

function onBulkInput(el) {
  processBulkText(el.value);
}

function processBulkText(text) {
  const entries = parseEntries(text);
  const hint = $('pasteHint');
  const btn = $('applyBtn');
  if (entries.length > 0) {
    hint.textContent = entries.length + '개 링크 감지됨';
    hint.style.color = 'var(--accent)';
    btn.style.display = '';
  } else if (text.trim().length > 0) {
    hint.textContent = '유효한 링크를 찾지 못했습니다';
    hint.style.color = 'var(--text-dim)';
    btn.style.display = 'none';
  } else {
    hint.textContent = '';
    btn.style.display = 'none';
  }
}

function applyBulk() {
  const entries = parseEntries($('bulkInput').value);
  if (!entries.length) return;
  entries.forEach(e => addRow(e.url, e.title));
  $('bulkInput').value = '';
  $('pasteHint').textContent = '';
  $('applyBtn').style.display = 'none';
  setStatus(entries.length + '개 링크가 목록에 추가됐습니다.', 'success');
}

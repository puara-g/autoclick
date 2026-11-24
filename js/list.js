// 링크 목록: 추가 / 삭제 / 렌더링 / 접기
function updateDelay() {
  const v = parseFloat($('delayRange').value);
  $('delayOut').textContent = v % 1 === 0 ? v + '초' : v.toFixed(1) + '초';
}

function updateCount() {
  $('countInfo').textContent = '링크 ' + rows.length + '개';
}

function addRow(url, title) {
  const id = Date.now() + Math.random();
  rows.push({ id, url: url || '', title: title || '' });
  renderRows();
  updateCount();
  if (!url) {
    const inputs = document.querySelectorAll('.url-input');
    if (inputs.length) inputs[inputs.length - 1].focus();
  }
}

function removeRow(id) {
  rows = rows.filter(r => r.id !== id);
  renderRows();
  updateCount();
}

function updateCollapseUI() {
  const header = $('listHeader');
  const list = $('linkList');
  const arrow = $('collapseArrow');
  const iconText = $('collapseIconText');

  if (rows.length >= 7) {
    header.style.display = 'flex';
    $('listHeaderLabel').textContent = '링크 목록 ' + rows.length + '개';
    if (collapsed) {
      list.style.setProperty('display', 'none', 'important');
      arrow.style.transform = 'rotate(-90deg)';
      iconText.textContent = '펼치기';
    } else {
      list.style.removeProperty('display');
      arrow.style.transform = 'rotate(0deg)';
      iconText.textContent = '접기';
    }
  } else {
    header.style.display = 'none';
    list.style.removeProperty('display');
    collapsed = false;
  }
}

function toggleCollapse() {
  collapsed = !collapsed;
  updateCollapseUI();
}

function renderRows() {
  const list = $('linkList');
  list.innerHTML = '';
  rows.forEach((row, i) => {
    const div = document.createElement('div');
    div.className = 'link-row';
    div.id = 'row-' + row.id;
    div.innerHTML = `
      <span class="row-num">${String(i + 1).padStart(2, '0')}</span>
      <div style="flex:1;display:flex;flex-direction:column;gap:4px;">
        <input class="title-input" id="title-${row.id}" type="text" placeholder="제목 (선택)" value="${escapeHtml(row.title)}" data-id="${row.id}" oninput="syncTitle(this)" />
        <input class="url-input" id="input-${row.id}" type="url" placeholder="https://..." value="${escapeHtml(row.url)}" data-id="${row.id}" oninput="syncUrl(this)" />
      </div>
      <span class="status-pill pill-wait" id="pill-${row.id}">대기</span>
      <button class="btn-remove" onclick="removeRow(${row.id})" title="삭제">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    `;
    list.appendChild(div);
  });
  updateCollapseUI();
}

function syncUrl(el) {
  const row = rows.find(r => r.id === parseFloat(el.dataset.id));
  if (row) row.url = el.value.trim();
}

function syncTitle(el) {
  const row = rows.find(r => r.id === parseFloat(el.dataset.id));
  if (row) row.title = el.value;
}

function setPill(id, type, label) {
  const el = $('pill-' + id);
  if (!el) return;
  el.className = 'status-pill pill-' + type;
  el.textContent = label;
}

function setInputState(id, state) {
  const el = $('input-' + id);
  if (!el) return;
  el.classList.remove('active', 'done');
  if (state) el.classList.add(state);
}

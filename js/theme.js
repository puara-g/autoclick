// 밝게 / 어둡게 테마 전환
const ICON_MOON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13 8.5A5.5 5.5 0 016.5 2a5.5 5.5 0 100 11A5.5 5.5 0 0013 8.5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
const ICON_SUN = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3.5" stroke="currentColor" stroke-width="1.4"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M11.89 4.11l1.06-1.06M3.05 12.95l1.06-1.06" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;

function toggleTheme() {
  const isLight = document.body.classList.toggle('light');
  $('themeBtn').innerHTML = isLight ? ICON_MOON + ' 어둡게' : ICON_SUN + ' 밝게';
}

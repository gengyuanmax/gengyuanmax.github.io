(() => {
  const root = document.getElementById('home-editorial-v5');
  if (!root) return;
  const track = root.querySelector('.he-track');
  const viewport = root.querySelector('.he-window');
  const header = root.querySelector('.he-nav-shell');
  const shortcuts = root.querySelector('.he-shortcuts');
  const pages = Array.from(root.querySelectorAll('.he-page'));
  const buttons = Array.from(root.querySelectorAll('[data-area]'));
  const chapterLinks = Array.from(shortcuts.querySelectorAll('[data-chapter]'));
  const chapters = Array.from(root.querySelectorAll('.he-research-chapter'));
  const chapterIds = chapters.map(chapter => chapter.id);
  const pageIds = pages.map(page => page.id);
  const initialArea = Number(root.dataset.initialArea || 0);
  const state = { area: initialArea >= 0 && initialArea < pages.length ? initialArea : 0, cue: 'ink', grid: false, chapter: chapterIds[0] };
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let touch = null;
  let wheelTotal = 0;
  let lastWheel = 0;
  let lastTransition = 0;
  let scrollScheduled = false;
  let jumpTimer = null;

  function fit() {
    const height = pages[state.area].offsetHeight + 'px';
    if (viewport.style.height !== height) viewport.style.height = height;
    const headerHeight = header.offsetHeight + 'px';
    if (root.style.getPropertyValue('--he-header-height') !== headerHeight) root.style.setProperty('--he-header-height', headerHeight);
  }
  function markChapter(id) {
    if (!chapterIds.includes(id)) return;
    state.chapter = id;
    chapterLinks.forEach(link => {
      if (link.dataset.chapter === id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function render() {
    root.dataset.cue = state.cue;
    root.dataset.grid = String(state.grid);
    shortcuts.hidden = state.area !== 1;
    track.style.transform = 'translateX(-' + (state.area * 100) + '%)';
    pages.forEach((page, i) => { page.inert = i !== state.area; page.setAttribute('aria-hidden', String(i !== state.area)); });
    buttons.forEach((button, i) => {
      if (i === state.area) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    markChapter(state.chapter);
    requestAnimationFrame(fit);
  }
  function save() {
    window.openai?.setWidgetState?.({
      modelContent: { review: 'layout-review-v6', area: buttons[state.area].dataset.label, chapter: state.chapter, cue: state.cue, grid: state.grid, printParameters: 'unconfirmed' },
      privateContent: { area: state.area }
    })?.catch(() => {});
  }
  function recordHash(id) {
    if (!pageIds.includes(id) && !chapterIds.includes(id)) return;
    if (window.location.hash === '#' + id) return;
    try { window.history.pushState(null, '', '#' + id); } catch { /* A hosted review may prohibit history writes. */ }
  }
  function go(area, { scroll = true, history = true, persist = true } = {}) {
    if (!Number.isInteger(area) || area < 0 || area >= pages.length) return;
    if (jumpTimer !== null) { clearTimeout(jumpTimer); jumpTimer = null; }
    const changed = state.area !== area;
    state.area = area; render();
    if (history) recordHash(pageIds[area]);
    if (persist) save();
    if (changed && scroll) requestAnimationFrame(() => header.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'instant' }));
    root.querySelector('.he-announcement').textContent = buttons[area].dataset.label;
  }
  function jumpToChapter(id, { history = true, persist = true } = {}) {
    if (!chapterIds.includes(id)) return;
    const switching = state.area !== 1;
    go(1, { scroll: false, history: false, persist: false });
    markChapter(id);
    if (history) recordHash(id);
    if (persist) save();
    const target = document.getElementById(id);
    const jump = () => {
      jumpTimer = null; fit();
      target.scrollIntoView({ block: 'start', inline: 'nearest', behavior: reduceMotion() ? 'instant' : 'smooth' });
      root.querySelector('.he-announcement').textContent = chapterLinks.find(link => link.dataset.chapter === id).textContent.trim();
    };
    if (switching && !reduceMotion()) jumpTimer = setTimeout(jump, 500);
    else requestAnimationFrame(jump);
  }
  function applyHash() {
    let id;
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
    if (chapterIds.includes(id)) jumpToChapter(id, { history: false, persist: false });
    else if (pageIds.includes(id)) go(pageIds.indexOf(id), { history: false, persist: false });
  }
  function restore(snapshot) {
    if (snapshot?.modelContent?.review !== 'layout-review-v6') return;
    const { cue, grid, chapter } = snapshot.modelContent;
    const area = snapshot.privateContent?.area;
    if (['ink', 'dots'].includes(cue)) state.cue = cue;
    if (Number.isInteger(area) && area >= 0 && area < pages.length) state.area = area;
    if (chapterIds.includes(chapter)) state.chapter = chapter;
    state.grid = grid === true;
    render();
  }
  buttons.forEach((button, i) => {
    button.addEventListener('click', () => go(i));
    button.addEventListener('keydown', event => {
      const targets = { ArrowLeft: Math.max(0, i - 1), ArrowRight: Math.min(3, i + 1), Home: 0, End: 3 };
      if (!(event.key in targets)) return;
      event.preventDefault(); const next = targets[event.key]; buttons[next].focus(); go(next);
    });
  });
  root.querySelectorAll('[data-chapter], [data-jump]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      jumpToChapter(link.dataset.chapter || link.dataset.jump);
    });
  });
  viewport.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) { touch = null; return; }
    const first = event.touches[0]; touch = { x: first.clientX, y: first.clientY };
  }, { passive: true });
  viewport.addEventListener('touchend', event => {
    if (!touch || !event.changedTouches.length) return;
    const last = event.changedTouches[0]; const dx = last.clientX - touch.x; const dy = last.clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) go(state.area + (dx < 0 ? 1 : -1));
  }, { passive: true });
  viewport.addEventListener('touchcancel', () => { touch = null; }, { passive: true });
  viewport.addEventListener('wheel', event => {
    if (event.ctrlKey || Math.abs(event.deltaX) < 2 || Math.abs(event.deltaX) < Math.abs(event.deltaY) * 1.5) return;
    const step = Math.sign(event.deltaX); const next = state.area + step;
    if (next < 0 || next >= pages.length) return;
    event.preventDefault(); const now = performance.now();
    if (now - lastTransition < 650) return;
    if (now - lastWheel > 180 || Math.sign(wheelTotal) !== step) wheelTotal = 0;
    lastWheel = now; wheelTotal += event.deltaX;
    if (Math.abs(wheelTotal) > 90) { go(next); lastTransition = now; wheelTotal = 0; }
  }, { passive: false });
  window.addEventListener('scroll', () => {
    if (state.area !== 1 || scrollScheduled) return;
    scrollScheduled = true;
    requestAnimationFrame(() => {
      scrollScheduled = false;
      const edge = header.getBoundingClientRect().bottom + 90;
      let current = chapterIds[0];
      chapters.forEach(chapter => { if (chapter.getBoundingClientRect().top <= edge) current = chapter.id; });
      markChapter(current);
    });
  }, { passive: true });
  if (globalThis.ResizeObserver) {
    const observer = new ResizeObserver(fit); pages.forEach(page => observer.observe(page));
    observer.observe(header);
  }
  root.querySelectorAll('img').forEach(img => img.addEventListener('load', fit));
  window.addEventListener('resize', fit);
  window.addEventListener('hashchange', applyHash);
  window.addEventListener('popstate', applyHash);
  window.addEventListener('openai:set_globals', event => restore(event.detail?.globals?.widgetState));
  function reportFonts() {
    const names = ['Bricolage Grotesque', 'Inter', 'JetBrains Mono'];
    const faces = Array.from(document.fonts || []);
    const missing = names.filter(name => !faces.some(face => face.family.replaceAll('"', '').replaceAll("'", '') === name && face.status === 'loaded'));
    const status = root.querySelector('.he-font-status');
    status.hidden = !missing.length; status.textContent = missing.length ? '字体尚未加载：' + missing.join(' / ') : ''; fit();
  }
  render(); restore(window.openai?.widgetState); applyHash();
  if (document.fonts) {
    document.fonts.ready.then(reportFonts);
    document.fonts.addEventListener('loadingdone', reportFonts);
    document.fonts.addEventListener('loadingerror', reportFonts);
  }
  if (globalThis.Tweak) {
    const tweak = new Tweak({ container: root, onChange: () => { render(); save(); } });
    tweak.addSelect(state, 'cue', { label: 'Home 几何衔接', options: [{ label: '色块延续', value: 'ink' }, { label: '网点过渡', value: 'dots' }], reference: 'home.cue' });
    tweak.addToggle(state, 'grid', { label: '显示网格', reference: 'layout.grid' });
  }
})();

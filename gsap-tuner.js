/**
 * GSAP Animation Tuning Panel
 * Visual dev tool for tweaking scroll animations.
 * Activate: ?tuner or #tuner
 */
function __initGsapTuner() {
  'use strict';

  if (!window.gsap || !window.ScrollTrigger) return;
  const registry = window.__GSAP_TUNER_REGISTRY;
  if (!registry || !registry.length) return;

  // Snapshot initial values for diff export
  const initialValues = {};
  registry.forEach(entry => {
    initialValues[entry.id] = {};
    Object.keys(entry.params).forEach(key => {
      if (entry.params[key] != null) {
        initialValues[entry.id][key] = entry.params[key].value;
      }
    });
  });

  // Human-readable easing presets
  const EASING_PRESETS = [
    { label: 'Linear',        value: 'none' },
    { label: 'Smooth',        value: 'power1.out' },
    { label: 'Smooth (in)',   value: 'power1.in' },
    { label: 'Smooth (both)', value: 'power1.inOut' },
    { label: 'Gentle',        value: 'sine.out' },
    { label: 'Gentle (both)', value: 'sine.inOut' },
    { label: 'Punchy',        value: 'power2.out' },
    { label: 'Punchy (in)',   value: 'power2.in' },
    { label: 'Punchy (both)', value: 'power2.inOut' },
    { label: 'Snappy',        value: 'power3.out' },
    { label: 'Snappy (both)', value: 'power3.inOut' },
    { label: 'Dramatic',      value: 'power4.out' },
    { label: 'Dramatic (both)', value: 'power4.inOut' },
    { label: 'Overshoot',     value: 'back.out' },
    { label: 'Wind-up',       value: 'back.in' },
    { label: 'Elastic',       value: 'elastic.out' },
    { label: 'Bounce',        value: 'bounce.out' },
    { label: 'Expo',          value: 'expo.out' },
    { label: 'Circ',          value: 'circ.out' },
  ];

  // ===================== STYLES =====================
  const style = document.createElement('style');
  style.textContent = `
    .gt-panel {
      position: fixed; right: 0; top: 0; width: 360px; height: 100vh;
      background: rgba(18,18,18,0.97); color: #e0e0e0;
      font-family: 'Jost', sans-serif; font-size: 13px;
      z-index: 999999; overflow-y: auto; overflow-x: hidden;
      box-shadow: -4px 0 24px rgba(0,0,0,0.5);
      display: flex; flex-direction: column;
      scrollbar-width: thin; scrollbar-color: #444 transparent;
      transition: transform 0.35s cubic-bezier(0.4,0,0.2,1), height 0.35s cubic-bezier(0.4,0,0.2,1);
    }
    .gt-panel::-webkit-scrollbar { width: 5px; }
    .gt-panel::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }

    /* Desktop slide-out handle */
    @media (min-width: 601px) {
      .gt-panel.gt-hidden { transform: translateX(360px); }
    }
    .gt-handle {
      display: none; position: fixed; right: 0; top: 50%; transform: translateY(-50%);
      z-index: 999998; width: 28px; height: 72px;
      background: rgba(18,18,18,0.92); border-radius: 6px 0 0 6px;
      border: 1px solid #333; border-right: none;
      cursor: pointer; align-items: center; justify-content: center;
      color: #b98a67; font-size: 14px; writing-mode: vertical-rl;
      transition: background 0.2s, right 0.35s cubic-bezier(0.4,0,0.2,1);
      box-shadow: -2px 0 8px rgba(0,0,0,0.3);
    }
    .gt-handle:hover { background: rgba(40,40,40,0.95); }
    .gt-handle .gt-handle-icon { font-size: 16px; line-height: 1; }
    @media (min-width: 601px) { .gt-handle { display: flex; } }

    /* Mobile: bottom sheet layout */
    @media (max-width: 600px) {
      .gt-panel {
        top: auto; bottom: 0; left: 0; right: 0;
        width: 100%; height: var(--gt-panel-height, 35vh);
        border-radius: 16px 16px 0 0;
        box-shadow: 0 -4px 24px rgba(0,0,0,0.5);
      }
      .gt-panel.gt-dragging { transition: none; }
      .gt-panel.gt-collapsed {
        height: 64px !important; overflow: hidden;
        padding-bottom: env(safe-area-inset-bottom, 0);
      }
      .gt-panel.gt-collapsed .gt-body,
      .gt-panel.gt-collapsed .gt-footer { display: none; }
      .gt-collapse-btn { display: flex !important; }
      .gt-select { font-size: 16px; padding: 8px 10px; }
      .gt-slider { height: 10px; }
      .gt-slider::-webkit-slider-thumb { width: 44px; height: 44px; border-width: 3px; }
      .gt-slider::-moz-range-thumb { width: 44px; height: 44px; border-width: 3px; }
      .gt-stepper-btn { width: 36px; height: 36px; font-size: 18px; }
      .gt-stepper-input { width: 60px; height: 36px; font-size: 14px; }
      .gt-group-header { padding: 14px 16px; min-height: 48px; }
      .gt-row { min-height: 40px; padding: 6px 0; }
    }

    /* Drag handle — hidden element on desktop, visual grip inside header on mobile */
    .gt-drag-handle { display: none; }

    /* Collapse toggle button — hidden on desktop by default */
    .gt-collapse-btn {
      display: none; align-items: center; justify-content: center;
      background: none; border: none; color: #999; font-size: 20px;
      cursor: pointer; padding: 4px 8px; line-height: 1;
      transition: transform 0.3s; min-width: 44px; min-height: 44px;
    }
    .gt-collapse-btn:hover { color: #fff; }
    .gt-panel.gt-collapsed .gt-collapse-btn { transform: rotate(180deg); }

    /* Header */
    .gt-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; border-bottom: 1px solid #333;
      position: sticky; top: 0; background: rgba(18,18,18,0.98); z-index: 2;
    }
    @media (max-width: 600px) {
      .gt-header {
        padding: 6px 12px; height: 50px; box-sizing: border-box;
      }
      .gt-header h3 { font-size: 11px; }
      /* Grip: absolutely centered in header, near top — sticky already provides positioning context */
      .gt-header .gt-grip {
        position: absolute; left: 50%; top: 8px; transform: translateX(-50%);
        width: 32px; height: 4px; border-radius: 2px; background: #555;
      }
    }
    .gt-header h3 { font-size: 13px; font-weight: 600; margin: 0; letter-spacing: 1px; text-transform: uppercase; color: #999; }
    .gt-header-btns { display: flex; gap: 6px; }

    /* Buttons */
    .gt-btn {
      background: #333; color: #ccc; border: none; border-radius: 6px;
      padding: 6px 12px; font-size: 11px; font-family: 'Jost', sans-serif;
      cursor: pointer; transition: background 0.15s; font-weight: 500;
    }
    .gt-btn:hover { background: #555; color: #fff; }
    .gt-btn-accent { background: #b98a67; color: #1a1a1a; }
    .gt-btn-accent:hover { background: #cfa07a; }
    .gt-close { background: none; border: none; color: #666; font-size: 22px; cursor: pointer; padding: 4px 8px; line-height: 1; min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center; }
    .gt-close:hover { color: #fff; }

    /* Groups */
    .gt-body { flex: 1; padding: 4px 0; }
    .gt-group { border-bottom: 1px solid #222; }
    .gt-group-header {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 16px; cursor: pointer; user-select: none;
      transition: background 0.15s;
    }
    .gt-group-header:hover { background: rgba(255,255,255,0.03); }
    .gt-group.gt-selected { background: rgba(185,138,103,0.12); border-left: 3px solid #b98a67; }
    .gt-group.gt-selected .gt-group-title { color: #b98a67; }
    .gt-group-arrow { font-size: 9px; color: #555; transition: transform 0.2s; display: inline-block; width: 12px; }
    .gt-group.open .gt-group-arrow { transform: rotate(90deg); }
    .gt-group-title { font-size: 13px; font-weight: 500; color: #ddd; flex: 1; }
    .gt-group-badge {
      font-size: 9px; color: #888; background: #2a2a2a; padding: 2px 6px;
      border-radius: 3px; font-family: monospace;
    }
    .gt-group-body { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
    .gt-group.open .gt-group-body { max-height: 2000px; }
    .gt-group-content { padding: 4px 16px 14px; }

    /* Section divider within a group */
    .gt-section {
      font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 0.8px;
      padding: 10px 0 4px; margin-top: 6px;
    }
    .gt-section:first-child { margin-top: 0; padding-top: 4px; }

    /* Rows */
    .gt-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; min-height: 30px; }
    .gt-label { width: 100px; flex-shrink: 0; font-size: 12px; color: #888; }

    /* Slider */
    .gt-slider-wrap { flex: 1; display: flex; align-items: center; gap: 8px; }
    .gt-slider-track { flex: 1; position: relative; display: flex; align-items: center; }
    .gt-slider-track.gt-slider-symmetric::before {
      content: ''; position: absolute; left: 50%; top: 50%;
      transform: translate(-50%, -50%);
      width: 6px; height: 6px; border-radius: 50%;
      background: #666; pointer-events: none; z-index: 0;
    }
    .gt-slider {
      flex: 1; height: 4px; -webkit-appearance: none; appearance: none;
      background: #333; border-radius: 2px; outline: none;
    }
    .gt-slider::-webkit-slider-thumb {
      -webkit-appearance: none; width: 14px; height: 14px;
      background: #b98a67; border-radius: 50%; cursor: pointer; border: 2px solid #1a1a1a;
    }
    .gt-slider::-moz-range-thumb {
      width: 14px; height: 14px; background: #b98a67;
      border-radius: 50%; cursor: pointer; border: 2px solid #1a1a1a;
    }
    .gt-value {
      min-width: 40px; text-align: right; font-size: 12px; font-family: monospace;
      color: #b98a67; font-weight: 500;
    }

    /* Stepper (position X/Y) */
    .gt-stepper { display: flex; align-items: center; gap: 0; }
    .gt-stepper-btn {
      width: 26px; height: 26px; background: #2a2a2a; border: 1px solid #444;
      color: #ccc; font-size: 14px; cursor: pointer; display: flex;
      align-items: center; justify-content: center; font-family: monospace;
      transition: background 0.15s; line-height: 1;
    }
    .gt-stepper-btn:hover { background: #444; color: #fff; }
    .gt-stepper-btn:first-child { border-radius: 4px 0 0 4px; }
    .gt-stepper-btn:last-child { border-radius: 0 4px 4px 0; }
    .gt-stepper-input {
      width: 52px; height: 26px; background: #1a1a1a; border: 1px solid #444;
      border-left: none; border-right: none; color: #e0e0e0;
      font-size: 12px; font-family: monospace; text-align: center; outline: none;
    }
    .gt-stepper-input:focus { border-color: #b98a67; }
    .gt-stepper-unit { font-size: 11px; color: #555; margin-left: 4px; }

    /* Select / dropdown */
    .gt-select {
      flex: 1; background: #222; border: 1px solid #444; border-radius: 4px;
      color: #e0e0e0; font-size: 12px; font-family: 'Jost', sans-serif;
      padding: 4px 8px; outline: none; cursor: pointer;
    }
    .gt-select:focus { border-color: #b98a67; }

    /* Text input */
    .gt-text-input {
      flex: 1; background: #1a1a1a; border: 1px solid #444; border-radius: 4px;
      color: #e0e0e0; font-size: 12px; font-family: monospace;
      padding: 4px 8px; outline: none;
    }
    .gt-text-input:focus { border-color: #b98a67; }

    /* Checkbox toggle */
    .gt-toggle { display: flex; align-items: center; gap: 8px; }
    .gt-checkbox { accent-color: #b98a67; width: 14px; height: 14px; cursor: pointer; }
    .gt-checkbox-label { font-size: 12px; color: #888; }

    /* Info text */
    .gt-info { font-size: 11px; color: #555; font-style: italic; padding: 2px 0; }

    /* Replay */
    .gt-replay-btn {
      background: #2a2a2a; color: #888; border: 1px solid #3a3a3a; border-radius: 5px;
      padding: 5px 12px; font-size: 11px; cursor: pointer; margin-top: 8px;
      font-family: 'Jost', sans-serif; transition: all 0.15s;
    }
    .gt-replay-btn:hover { background: #3a3a3a; color: #ccc; border-color: #555; }

    /* Footer */
    .gt-footer {
      padding: 10px 16px; border-top: 1px solid #333;
      display: flex; gap: 8px; justify-content: space-between;
      position: sticky; bottom: 0; background: rgba(18,18,18,0.98); z-index: 2;
    }

    /* Toast */
    .gt-toast {
      position: fixed; bottom: 80px; right: 380px;
      background: #b98a67; color: #1a1a1a; padding: 8px 16px;
      border-radius: 6px; font-size: 12px; font-weight: 500;
      z-index: 999999; opacity: 0; transform: translateY(8px);
      transition: opacity 0.25s, transform 0.25s; pointer-events: none;
    }
    .gt-toast.show { opacity: 1; transform: translateY(0); }
    @media (max-width: 600px) {
      .gt-toast { right: auto; left: 50%; transform: translateX(-50%) translateY(8px); bottom: calc(var(--gt-panel-height, 35vh) + 16px); }
      .gt-toast.show { transform: translateX(-50%) translateY(0); }
    }

    /* Element outlines */
    .gt-highlight-outline { outline: 2px dashed #b98a67 !important; outline-offset: 4px !important; }
    .gt-active-outline { outline: 3px solid #b98a67 !important; outline-offset: 4px !important; }
    /* Lift the fixed layer above page frames so images are hittable, but keep layer itself
       as pointer-events:none so only the images (pointer-events:all) actually catch clicks. */
    .illumap-fixed-layer { z-index: 10 !important; }
    .illumap-img-fixed { pointer-events: all !important; }
  `;
  document.head.appendChild(style);

  // ===================== PANEL DOM =====================
  const panel = document.createElement('div');
  panel.className = 'gt-panel';

  const header = document.createElement('div');
  header.className = 'gt-header';
  header.innerHTML = `
    <h3>Animation Tuner</h3>
    <div class="gt-grip"></div>
    <div class="gt-header-btns">
      <button class="gt-collapse-btn" id="gtCollapse" title="Collapse/Expand">&#9660;</button>
    </div>
  `;
  panel.appendChild(header);

  const body = document.createElement('div');
  body.className = 'gt-body';
  panel.appendChild(body);

  const footer = document.createElement('div');
  footer.className = 'gt-footer';
  footer.innerHTML = `
    <div style="display:flex;gap:6px">
      <button class="gt-btn" id="gtReset">Reset All</button>
      <button class="gt-btn" id="gtCopyAll">Snapshot</button>
    </div>
    <button class="gt-btn gt-btn-accent" id="gtCopyChanges">Copy Changes</button>
  `;
  panel.appendChild(footer);

  const toast = document.createElement('div');
  toast.className = 'gt-toast';

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1800);
  }

  // ===================== CONTROL BUILDERS =====================

  function createSlider(param, onChange) {
    const wrap = document.createElement('div');
    wrap.className = 'gt-slider-wrap';
    const trackWrap = document.createElement('div');
    trackWrap.className = 'gt-slider-track';
    const isSymmetric = typeof param.min === 'number' && typeof param.max === 'number'
                      && param.min < 0 && param.max > 0 && param.min === -param.max;
    if (isSymmetric) trackWrap.classList.add('gt-slider-symmetric');
    const slider = document.createElement('input');
    slider.className = 'gt-slider';
    slider.type = 'range';
    slider.min = param.min ?? 0;
    slider.max = param.max ?? 100;
    slider.step = param.step ?? 1;
    slider.value = param.value;
    trackWrap.appendChild(slider);
    const valSpan = document.createElement('span');
    valSpan.className = 'gt-value';
    valSpan.textContent = fmtVal(param.value, param);
    if (param.unit) {
      const unitSpan = document.createElement('span');
      unitSpan.className = 'gt-stepper-unit';
      unitSpan.textContent = param.unit;
      wrap.appendChild(trackWrap);
      wrap.appendChild(valSpan);
      wrap.appendChild(unitSpan);
    } else {
      wrap.appendChild(trackWrap);
      wrap.appendChild(valSpan);
    }
    slider.addEventListener('input', () => {
      const v = parseFloat(slider.value);
      valSpan.textContent = fmtVal(v, param);
      onChange(v);
    });
    return { el: wrap, slider, valSpan, reset(v) { slider.value = v; valSpan.textContent = fmtVal(v, param); } };
  }

  function createStepper(param, onChange) {
    const wrap = document.createElement('div');
    wrap.className = 'gt-stepper';
    const step = param.step || 8;
    const minus = document.createElement('button');
    minus.className = 'gt-stepper-btn'; minus.textContent = '−';
    const input = document.createElement('input');
    input.className = 'gt-stepper-input'; input.type = 'number'; input.value = param.value;
    const plus = document.createElement('button');
    plus.className = 'gt-stepper-btn'; plus.textContent = '+';
    wrap.appendChild(minus); wrap.appendChild(input); wrap.appendChild(plus);
    if (param.unit) {
      const u = document.createElement('span');
      u.className = 'gt-stepper-unit'; u.textContent = param.unit;
      wrap.appendChild(u);
    }
    function fire(v) { input.value = v; onChange(v); }
    minus.addEventListener('click', () => fire(parseFloat(input.value) - step));
    plus.addEventListener('click', () => fire(parseFloat(input.value) + step));
    input.addEventListener('change', () => fire(parseFloat(input.value) || 0));
    return { el: wrap, input, reset(v) { input.value = v; } };
  }

  function createEasingSelect(param, onChange) {
    const sel = document.createElement('select');
    sel.className = 'gt-select';
    EASING_PRESETS.forEach(p => {
      const o = document.createElement('option');
      o.value = p.value; o.textContent = p.label;
      if (p.value === param.value) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener('change', () => onChange(sel.value));
    return { el: sel, reset(v) { sel.value = v; } };
  }

  function createTextInput(param, onChange) {
    const inp = document.createElement('input');
    inp.className = 'gt-text-input'; inp.type = 'text'; inp.value = param.value;
    inp.addEventListener('change', () => onChange(inp.value));
    return { el: inp, reset(v) { inp.value = v; } };
  }

  function fmtVal(v, param) {
    if (param.format === 'int') return String(Math.round(v));
    const step = param.step;
    if (step && step < 1) {
      const d = String(step).split('.')[1]?.length || 2;
      return Number(v).toFixed(d);
    }
    return String(Math.round(v * 100) / 100);
  }

  // ===================== BUILD GROUPS =====================
  const groupEls = {};
  let rebuildTimers = {};

  function debouncedRebuild(entry) {
    if (rebuildTimers[entry.id]) clearTimeout(rebuildTimers[entry.id]);
    rebuildTimers[entry.id] = setTimeout(() => {
      try {
        const p = {};
        Object.keys(entry.params).forEach(k => { if (entry.params[k] != null) p[k] = entry.params[k].value; });
        entry.rebuild(p);
        ScrollTrigger.refresh();
        // Update any info/computed displays in this group
        const ctrls = groupEls[entry.id]?.controls;
        if (ctrls) Object.values(ctrls).forEach(c => { if (c.update) c.update(); });
      } catch(e) { console.error('[Tuner]', entry.id, e); }
    }, 60);
  }

  registry.forEach(entry => {
    const group = document.createElement('div');
    group.className = 'gt-group';
    group.dataset.id = entry.id;

    const gh = document.createElement('div');
    gh.className = 'gt-group-header';
    gh.innerHTML = `
      <span class="gt-group-arrow">&#9654;</span>
      <span class="gt-group-title">${entry.label}</span>
      <span class="gt-group-badge">${entry.badge || ''}</span>
    `;
    group.appendChild(gh);

    const gb = document.createElement('div');
    gb.className = 'gt-group-body';
    const gc = document.createElement('div');
    gc.className = 'gt-group-content';
    gb.appendChild(gc);
    group.appendChild(gb);

    const controls = {};
    let currentSection = null;

    Object.keys(entry.params).forEach(key => {
      const param = entry.params[key];
      if (param == null) return; // skip undefined params (e.g. left/right conditional)

      // Section dividers
      if (param.section && param.section !== currentSection) {
        currentSection = param.section;
        const sec = document.createElement('div');
        sec.className = 'gt-section';
        sec.textContent = param.section;
        gc.appendChild(sec);
      }

      const row = document.createElement('div');
      row.className = 'gt-row';
      const label = document.createElement('span');
      label.className = 'gt-label';
      label.textContent = param.label || key;
      row.appendChild(label);

      function onParamChange(v) {
        entry.params[key].value = v;
        debouncedRebuild(entry);
      }

      let ctrl;
      switch (param.type) {
        case 'stepper':
          ctrl = createStepper(param, onParamChange);
          break;
        case 'easing':
          ctrl = createEasingSelect(param, onParamChange);
          break;
        case 'text':
          ctrl = createTextInput(param, onParamChange);
          break;
        case 'info':
          const info = document.createElement('span');
          info.className = 'gt-info';
          info.textContent = typeof param.compute === 'function' ? param.compute(entry.params) : String(param.value);
          ctrl = { el: info, update() { if (param.compute) info.textContent = param.compute(entry.params); } };
          break;
        default: // slider
          ctrl = createSlider(param, onParamChange);
          break;
      }

      row.appendChild(ctrl.el);
      gc.appendChild(row);
      controls[key] = ctrl;
    });

    // Replay button for one-shot animations
    if (entry.replay) {
      const btn = document.createElement('button');
      btn.className = 'gt-replay-btn';
      btn.textContent = '↻ Replay';
      btn.addEventListener('click', () => {
        const p = {};
        Object.keys(entry.params).forEach(k => { if (entry.params[k] != null) p[k] = entry.params[k].value; });
        entry.replay(p);
      });
      gc.appendChild(btn);
    }

    gh.addEventListener('click', () => group.classList.toggle('open'));

    body.appendChild(group);
    groupEls[entry.id] = { container: group, controls };
  });

  // ===================== ELEMENT CLICK-TO-SELECT =====================
  const selectorMap = new Map();
  const isMobile = window.innerWidth <= 600;
  registry.forEach(entry => {
    try {
      document.querySelectorAll(entry.selector).forEach(el => selectorMap.set(el, entry.id));
    } catch(e) {}
  });

  // Element selection — hover+click on desktop, tap on mobile
  if (!isMobile) {
    document.addEventListener('mouseover', e => {
      const el = findReg(e.target);
      if (el) el.classList.add('gt-highlight-outline');
    }, true);
    document.addEventListener('mouseout', e => {
      const el = findReg(e.target);
      if (el) el.classList.remove('gt-highlight-outline');
    }, true);
  }
  // Click/tap to select — works on both desktop and mobile
  function handleSelect(e) {
    const el = findReg(e.target);
    if (el) {
      e.preventDefault(); e.stopPropagation();
      const id = selectorMap.get(el);
      if (id && groupEls[id]) {
        document.querySelectorAll('.gt-active-outline').forEach(a => a.classList.remove('gt-active-outline'));
        el.classList.add('gt-active-outline');
        el.classList.remove('gt-highlight-outline');
        // Highlight in panel
        document.querySelectorAll('.gt-group.gt-selected').forEach(g => g.classList.remove('gt-selected'));
        groupEls[id].container.classList.add('open', 'gt-selected');
        // Expand panel if collapsed (mobile bottom sheet)
        panel.classList.remove('gt-collapsed');
        // Scroll to the group inside the panel
        setTimeout(() => {
          const group = groupEls[id].container;
          // Calculate offset relative to the panel's scroll area
          let top = 0, el = group;
          while (el && el !== panel) { top += el.offsetTop; el = el.offsetParent; }
          // Subtract header height so group sits just below it
          const headerH = header.offsetHeight || 50;
          panel.scrollTo({ top: Math.max(0, top - headerH), behavior: 'smooth' });
        }, 100);
      }
    }
  }
  document.addEventListener('click', handleSelect, true);

  function findReg(target) {
    let el = target;
    while (el && el !== document.body) {
      if (selectorMap.has(el)) return el;
      el = el.parentElement;
    }
    return null;
  }

  // ===================== EXPORT =====================
  function getPageName() {
    return (location.pathname.split('/').pop() || 'index.html').replace('.html', '.astro');
  }

  function buildChangesText() {
    const lines = [`GSAP TUNING — ${getPageName()}`, '='.repeat(36), ''];
    let hasChanges = false;
    registry.forEach(entry => {
      const diffs = [];
      Object.keys(entry.params).forEach(key => {
        const p = entry.params[key];
        if (p == null || p.type === 'info') return;
        const init = initialValues[entry.id][key];
        if (init == null || String(init) !== String(p.value)) {
          diffs.push(`  ${p.label || key}: ${init} → ${p.value}`);
        }
      });
      if (diffs.length) {
        hasChanges = true;
        lines.push(`[${entry.id}] ${entry.label}`);
        lines.push(`  selector: ${entry.selector}`);
        lines.push(...diffs);
        lines.push('');
      }
    });
    return hasChanges ? lines.join('\n') : null;
  }

  function buildSnapshotText() {
    const lines = [`GSAP SNAPSHOT — ${getPageName()}`, '='.repeat(36), ''];
    registry.forEach(entry => {
      lines.push(`[${entry.id}] ${entry.label}`);
      Object.keys(entry.params).forEach(key => {
        const p = entry.params[key];
        if (p == null) return;
        const val = p.type === 'info' && p.compute ? p.compute(entry.params) : p.value;
        lines.push(`  ${p.label || key}: ${val}`);
      });
      lines.push('');
    });
    return lines.join('\n');
  }

  async function copyToClipboard(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch { const t = document.createElement('textarea'); t.value = text; t.style.cssText = 'position:fixed;left:-9999px'; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); return true; }
  }

  // ===================== BUTTON HANDLERS =====================
  footer.querySelector('#gtCopyChanges').addEventListener('click', async () => {
    const text = buildChangesText();
    if (!text) { showToast('No changes yet'); return; }
    await copyToClipboard(text);
    showToast('Copied!');
  });

  footer.querySelector('#gtCopyAll').addEventListener('click', async () => {
    await copyToClipboard(buildSnapshotText());
    showToast('Snapshot copied!');
  });

  // Desktop close via handle (no close button)
  var gtCloseBtn = header.querySelector('#gtClose');
  if (gtCloseBtn) {
    gtCloseBtn.addEventListener('click', () => {
      if (window.innerWidth > 600) setHidden(true);
      else panel.style.display = 'none';
      document.querySelectorAll('.gt-active-outline, .gt-highlight-outline').forEach(el =>
        el.classList.remove('gt-active-outline', 'gt-highlight-outline'));
    });
  }

  footer.querySelector('#gtReset').addEventListener('click', () => {
    registry.forEach(entry => {
      Object.keys(entry.params).forEach(key => {
        const p = entry.params[key];
        if (p.type === 'info') return;
        const init = initialValues[entry.id][key];
        p.value = init;
        const ctrl = groupEls[entry.id].controls[key];
        if (ctrl?.reset) ctrl.reset(init);
      });
      debouncedRebuild(entry);
    });
    showToast('All reset');
  });

  // ===================== COLLAPSE TOGGLE =====================
  header.querySelector('#gtCollapse').addEventListener('click', () => {
    panel.classList.toggle('gt-collapsed');
  });

  // ===================== DESKTOP HANDLE =====================
  const handle = document.createElement('div');
  handle.className = 'gt-handle';
  handle.innerHTML = '<span class="gt-handle-icon">◀</span>';
  handle.title = 'Toggle Tuner Panel';

  function setHidden(hidden) {
    if (hidden) {
      panel.classList.add('gt-hidden');
      handle.style.right = '0';
      handle.innerHTML = '<span class="gt-handle-icon">◀</span>';
    } else {
      panel.classList.remove('gt-hidden');
      handle.style.right = '360px';
      handle.innerHTML = '<span class="gt-handle-icon">▶</span>';
    }
  }

  handle.addEventListener('click', () => {
    setHidden(!panel.classList.contains('gt-hidden'));
  });

  // ===================== MOBILE DRAG-TO-RESIZE =====================
  (function() {
    if (window.innerWidth > 600) return;
    var startY = 0, startH = 0, dragging = false;
    var minH = 120, maxH = window.innerHeight * 0.85;

    // Restore saved height
    try {
      var saved = sessionStorage.getItem('gt-panel-height');
      if (saved) {
        var h = parseInt(saved);
        if (h >= minH && h <= maxH) {
          panel.style.setProperty('--gt-panel-height', h + 'px');
        }
      }
    } catch(e) {}

    function onStart(e) {
      // Don't drag if tapping a button inside the header
      var t = e.target;
      if (t.closest('button') || t.tagName === 'BUTTON') return;
      if (panel.classList.contains('gt-collapsed')) return;
      dragging = true;
      startY = e.touches ? e.touches[0].clientY : e.clientY;
      startH = panel.offsetHeight;
      panel.classList.add('gt-dragging');
      e.preventDefault();
    }
    function onMove(e) {
      if (!dragging) return;
      var clientY = e.touches ? e.touches[0].clientY : e.clientY;
      var delta = startY - clientY;
      var newH = Math.min(maxH, Math.max(minH, startH + delta));
      panel.style.setProperty('--gt-panel-height', newH + 'px');
      e.preventDefault();
    }
    function onEnd() {
      if (!dragging) return;
      dragging = false;
      panel.classList.remove('gt-dragging');
      try { sessionStorage.setItem('gt-panel-height', panel.offsetHeight); } catch(e) {}
    }

    header.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    // Mouse fallback for testing in desktop dev tools mobile mode
    header.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
  })();

  // ===================== MOUNT =====================
  document.documentElement.appendChild(panel);
  document.documentElement.appendChild(handle);
  document.documentElement.appendChild(toast);

  // Position handle next to visible panel initially
  if (window.innerWidth > 600) {
    handle.style.right = '360px';
    handle.innerHTML = '<span class="gt-handle-icon">▶</span>';
  }

  // Open first group
  const first = body.querySelector('.gt-group');
  if (first) first.classList.add('open');

  console.log(`[Tuner] Loaded — ${registry.length} animation groups`);
}

// Wait for everything (including page scripts that Astro may place after </body>)
function __tryInitGsapTuner(retries) {
  var registry = window.__GSAP_TUNER_REGISTRY;
  if (registry && registry.length) {
    __initGsapTuner();
  } else if (retries > 0) {
    setTimeout(function() { __tryInitGsapTuner(retries - 1); }, 50);
  }
}
if (document.readyState === 'complete') {
  __tryInitGsapTuner(20);
} else {
  window.addEventListener('load', function() { __tryInitGsapTuner(20); });
}

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function initUI() {
  // "More" dropdown (keyboard + click)
  const more = $('.more-btn'), menu = $('#more-menu');
  if (more) {
    const set = (v) => { more.setAttribute('aria-expanded', v); menu.classList.toggle('open', v); };
    more.addEventListener('click', () => set(more.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('click', (e) => { if (!e.target.closest('.more')) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { set(false); closeMenu(); } });
    $('.more').addEventListener('focusout', (e) => { if (!e.currentTarget.contains(e.relatedTarget)) set(false); });
  }

  // mobile menu
  const mbtn = $('.menu-btn'), mm = $('#mmenu');
  function closeMenu() { if (!mm || mm.hidden) return; mm.hidden = true; mbtn.setAttribute('aria-expanded', 'false'); mbtn.setAttribute('aria-label', 'Open menu'); document.documentElement.classList.remove('menu-open'); }
  if (mbtn) mbtn.addEventListener('click', () => {
    const open = mm.hidden;
    mm.hidden = !open;
    mbtn.setAttribute('aria-expanded', String(open));
    mbtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.documentElement.classList.toggle('menu-open', open);
    if (open) $('a', mm).focus();
  });

  // cookie notice (verbatim from the live site; concept sets no cookies)
  const ck = $('#cookie');
  let seen = null;
  try { seen = localStorage.getItem('hwx-cookie'); } catch (e) { /* storage blocked */ }
  if (ck && !seen) {
    ck.hidden = false;
    ck.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ck]');
      if (!b) return;
      try { localStorage.setItem('hwx-cookie', b.dataset.ck); } catch (err) { /* ignore */ }
      ck.hidden = true;
    });
  }

  // contact form: original fields; posts nowhere yet
  const f = $('#contactForm');
  if (f) {
    const msg = $('.form-msg', f);
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const em = f.elements.email;
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim());
      em.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (!ok) { msg.textContent = 'Please enter a valid email.'; em.focus(); return; }
      // TODO(endpoint): POST to the client's form handler here.
      msg.textContent = 'Thanks. (Concept preview: message not sent.)';
      f.reset();
    });
    f.addEventListener('reset', () => { $$('[aria-invalid]', f).forEach((n) => n.removeAttribute('aria-invalid')); });
  }
}

const fmt = new Intl.NumberFormat('en-US');
export function setCount(n, v) {
  if (!n) return;
  if (n._v === v) return;
  n._v = v;
  n.textContent = fmt.format(v);
}

// wrap each word in a span (keeps <mark> and counters intact)
export function splitWords(root) {
  if (!root) return [];
  if (root._words) return root._words;
  const out = [];
  const walk = (node) => {
    for (const ch of [...node.childNodes]) {
      if (ch.nodeType === 3) {
        const parts = ch.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        for (const p of parts) {
          if (!p) continue;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); continue; }
          const s = document.createElement('span');
          s.className = 'w'; s.textContent = p;
          frag.appendChild(s); out.push(s);
        }
        ch.replaceWith(frag);
      } else if (ch.nodeType === 1) {
        if (ch.classList.contains('count')) { ch.classList.add('w'); out.push(ch); }
        else walk(ch);
      }
    }
  };
  walk(root);
  root._words = out;
  return out;
}

// HUD: a session clock that starts at 3:00 AM (the 24/7 nod)
let hudEls;
export function hud(prog, station, reps, light, hide) {
  if (!hudEls) hudEls = { root: $('#hud'), clock: $('#hudClock'), ampm: $('#hudAmpm'), st: $('#hudSt'), reps: $('#hudReps'), bar: $('#hudBar') };
  const h = hudEls;
  const mins = Math.round(prog * 72);
  const hh = 3 + Math.floor(mins / 60), mm = mins % 60;
  const txt = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  if (h._c !== txt) { h._c = txt; h.clock.textContent = txt; }
  if (h._s !== station) { h._s = station; h.st.textContent = station; }
  const r = String(reps).padStart(2, '0');
  if (h._r !== r) { h._r = r; h.reps.textContent = r; }
  h.bar.style.transform = `scaleX(${prog.toFixed(4)})`;
  h.root.classList.toggle('on-light', !!light);
  h.root.classList.toggle('hide', !!hide);
}

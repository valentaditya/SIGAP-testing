"use client";

/* ============================================================
   SATU rAF-throttled scroll handler untuk semua pinned stage.
   Tiap stage mendapat --p (0..1) berdasar posisi wrapper-nya.
   ============================================================ */
type Entry = { wrap: HTMLElement; pin: HTMLElement };
const stages = new Set<Entry>();
let scheduled = false;

function update() {
  scheduled = false;
  const vh = window.innerHeight;
  stages.forEach(({ wrap, pin }) => {
    const r = wrap.getBoundingClientRect();
    const total = r.height - vh;
    if (total <= 0) return;
    const p = Math.min(1, Math.max(0, -r.top / total));
    pin.style.setProperty("--p", p.toFixed(4));
  });
}

function onScroll() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(update);
}

let listenerCount = 0;
function attach() {
  if (listenerCount === 0) {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
  }
  listenerCount++;
}
function detach() {
  listenerCount--;
  if (listenerCount <= 0) {
    listenerCount = 0;
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  }
}

export function registerStage(wrap: HTMLElement, pin: HTMLElement) {
  const entry = { wrap, pin };
  stages.add(entry);
  attach();
  onScroll();
  return () => {
    stages.delete(entry);
    detach();
  };
}

/* Progress global halaman 0..1, untuk meter halus bila diperlukan */
export function pageProgress(el: HTMLElement) {
  const h = document.documentElement;
  const total = h.scrollHeight - window.innerHeight;
  const p = total > 0 ? window.scrollY / total : 0;
  el.style.setProperty("--p", p.toFixed(4));
}

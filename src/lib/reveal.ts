"use client";

/* ============================================================
   SATU IntersectionObserver untuk semua atom [data-rev] / [data-words].
   Begitu terlihat, kelas is-rev dilepas ke CSS yang memegang delay --d/--i.
   ============================================================ */
let io: IntersectionObserver | null = null;
const seen = new WeakSet<Element>();

function observer() {
  if (io) return io;
  io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-rev");
          io?.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  return io;
}

export function revealAtom(el: Element) {
  if (seen.has(el)) return () => {};
  seen.add(el);
  observer().observe(el);
  return () => observer().unobserve(el);
}

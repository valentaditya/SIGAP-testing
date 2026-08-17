"use client";
/* ============================================================
   SATU IntersectionObserver untuk seluruh halaman.

   Elemen cukup memasang atribut data-rev / data-type / data-underline
   / data-slide, lalu observer melepas kelas is-rev sekali saja dan
   berhenti mengamati. Tidak ada observer per komponen, tidak ada
   listener scroll tambahan.
   ============================================================ */

let io: IntersectionObserver | null = null;

function observer() {
  if (io) return io;
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        el.classList.add("is-rev");
        // will-change hanya dipasang selama animasi berjalan, lalu
        // dilepas. Membiarkannya menetap memaksa browser menyimpan
        // ribuan layer GPU dan justru membuat scroll tersendat.
        el.style.willChange = "opacity, transform";
        const bersihkan = () => { el.style.willChange = ""; };
        el.addEventListener("transitionend", bersihkan, { once: true });
        el.addEventListener("animationend", bersihkan, { once: true });
        setTimeout(bersihkan, 2600); // jaring pengaman bila event tidak pernah datang
        io?.unobserve(el);
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
  );
  return io;
}

export function revealAtom(el: Element) {
  // Tidak ada penjaga "sudah pernah dilihat" di sini. StrictMode
  // menjalankan efek dua kali (pasang, bersihkan, pasang lagi); penjaga
  // semacam itu membuat pemasangan kedua dilewati sehingga elemen tidak
  // pernah teramati dan konten tak pernah muncul. observe() sendiri sudah
  // idempoten, jadi memanggilnya berulang aman.
  observer().observe(el);
  return () => io?.unobserve(el);
}

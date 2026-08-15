import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Stage } from "@/components/Stage";
import { Words, Atom } from "@/components/Words";
import { TimelineLive } from "@/components/TimelineLive";
import { RouteMap } from "@/components/RouteMap";
import { JsonViewer } from "@/components/JsonViewer";
import { IntroGate } from "@/components/IntroGate";
import { ForceGuest } from "@/components/ForceGuest";

export const metadata = { title: "Beranda" };

/* ================= DATA ================= */

const FITUR = [
  { n: "01", judul: "Citizen Reporting", desc: "Lapor dengan kategori, foto, dan lokasi akurat." },
  { n: "02", judul: "AI Multi-Agent", desc: "Tiga agen menilai kategori, dampak, dan prioritas." },
  { n: "03", judul: "Priority Score", desc: "Skor Urgensi 1 sampai 10 menentukan mana yang didahulukan." },
  { n: "04", judul: "Issue Tracking", desc: "Status transparan dari Reported sampai Resolved." },
  { n: "05", judul: "Notifikasi Real-Time", desc: "Kabar langsung tiap perubahan status laporan." },
  { n: "06", judul: "Gamifikasi", desc: "Poin, lencana, dan papan peringkat partisipasi." },
  { n: "07", judul: "Early Warning", desc: "Peringatan area rawan berbasis laporan warga." },
  { n: "08", judul: "Emergency Button", desc: "Sinyal darurat dalam satu ketukan." },
  { n: "09", judul: "Laporan Anonim", desc: "Bersuara tanpa mengungkap identitas." },
  { n: "10", judul: "City Impact", desc: "Statistik dampak kota yang terbuka." },
];

const ALUR = [
  { n: "01", judul: "Lapor", desc: "Warga mengirim kategori, foto, dan titik lokasi dalam tiga langkah." },
  { n: "02", judul: "AI Menilai", desc: "Tiga agen membaca laporan dan menuliskan Skor Urgensinya." },
  { n: "03", judul: "Tuntas", desc: "Admin memverifikasi, petugas menangani, warga memantau sampai selesai." },
];

const KATEGORI_TARIF = [
  { nama: "Jalan & Infrastruktur", desc: "Lubang, retakan, jembatan, rambu rusak", sla: "48 JAM" },
  { nama: "Sampah & Kebersihan", desc: "TPS liar, tumpukan liar, saluran kotor", sla: "72 JAM" },
  { nama: "Banjir & Drainase", desc: "Genangan, drainase tersumbat, tanggul bocor", sla: "24 JAM" },
  { nama: "Lampu Jalan", desc: "PJU mati, lampu berkedip, kabel terbuka", sla: "48 JAM" },
  { nama: "Keamanan & Ketertiban", desc: "Tawuran, begal, kerumunan berisiko", sla: "24 JAM" },
  { nama: "Fasilitas Umum", desc: "Halte, taman, toilet umum, trotoar rusak", sla: "7 HARI" },
];

const STAT = [
  { v: "241", l: "laporan terdata" },
  { v: "06", l: "kategori masalah" },
  { v: "04", l: "agen AI bekerja" },
  { v: "24 JAM", l: "respons tercepat" },
];

const AGEN = [
  { n: "01", nama: "Agent Klasifikasi", tugas: "Mengklasifikasikan jenis permasalahan dengan confidence score." },
  { n: "02", nama: "Agent Analisis Dampak", tugas: "Mengukur dampak sosial, lingkungan, dan lokasi." },
  { n: "03", nama: "Agent Prioritas", tugas: "Menghitung Skor Urgensi 1–10 dan estimasi SLA." },
];

const TIM = [
  { nama: "Valent Aditya Hermanus", nim: "241712920", peran: "Product dan Front-end" },
  { nama: "Christian Vieri Santosa", nim: "241712892", peran: "AI dan Machine Learning" },
  { nama: "Made Kresna Praba Wistara", nim: "241712921", peran: "Data dan Backend" },
];

const FAQ = [
  { q: "Apakah SIGAP gratis untuk warga?", a: "Ya. SIGAP adalah platform publik, warga dapat melapor dan memantau tindak lanjut tanpa biaya." },
  { q: "Bagaimana AI menentukan prioritas?", a: "Tiga agen AI menganalisis kategori, dampak, dan dukungan warga, lalu menghasilkan Skor Urgensi 1–10. Skor ≥ 9 masuk jalur darurat." },
  { q: "Apakah laporan saya pasti ditindaklanjuti?", a: "Setiap laporan masuk antrean verifikasi. Laporan dengan skor tinggi diprioritaskan untuk penugasan tim lapangan." },
  { q: "Bisakah saya melapor secara anonim?", a: "Bisa. Aktifkan opsi lapor sebagai anonim di formulir untuk laporan yang sensitif." },
  { q: "Siapa yang menangani laporan saya di lapangan?", a: "Petugas lapangan yang ditugaskan admin berdasarkan kategori, lokasi, dan skor prioritas laporan Anda." },
  { q: "Bagaimana saya tahu laporan sudah selesai?", a: "Status berubah menjadi Resolved, Anda menerima notifikasi, dan hasilnya tercatat di statistik Dampak Kota." },
];

/* ================= HALAMAN ================= */

export default function Home() {
  return (
    <>
    <ForceGuest />
    <IntroGate>
    <main>
      {/* ======================================================
          STAGE 1 — POSTER HERO (280svh)
          Grid modular 44px parallax 60px, lockup terangkat & memudar,
          separuh wordmark merah, SATU hairline ambient 38 detik.
          ====================================================== */}
      <Stage svh={280} className="border-b-2 border-cream">
        <div
          aria-hidden
          className="grid-overlay pointer-events-none absolute inset-0"
          style={{ transform: "translateY(calc(var(--p, 0) * -60px))" }}
        />
        <div className="relative mx-auto flex h-full max-w-[1180px] flex-col justify-center px-6">
          <div
            style={{
              transform: "translateY(calc(var(--p, 0) * -44px))",
              opacity: "calc(1 - var(--p, 0) * 1.1)",
            }}
          >
            <Atom d={0} className="micro-label text-sage">
              Sistem Informasi &amp; Gerak Aktif Pelaporan — Yogyakarta
            </Atom>
            <h1
              className="font-display mt-5 text-cream-hi"
              style={{ fontSize: "min(clamp(52px,15vw,220px), calc(90vw / (20 * .44)))", whiteSpace: "nowrap" }}
            >
              <Words text="LAPOR CEPAT," base={1} />
              <br />
              <span className="text-tan"><Words text="KOTA TANGGAP." base={3} /></span>
            </h1>
            <div className="mt-8 border-t-2 border-cream pt-6">
              <div className="flex flex-wrap items-end justify-between gap-6">
                <Atom d={180}>
                  <Words
                    as="p"
                    base={6}
                    className="max-w-[46ch] text-[15px] leading-relaxed text-sage-pale"
                    text="Dua belas layanan pelaporan warga dalam satu platform, ditenagai tiga agen AI yang membaca, menilai, dan memprioritaskan setiap laporan."
                  />
                </Atom>
                <Atom d={260}>
                  <Link
                    href="/lapor"
                    className="btn-anim inline-flex items-center gap-3 bg-tan px-8 py-4 font-display text-lg text-white no-underline hover:bg-brand-700"
                  >
                    Lapor sekarang <ArrowUpRight size={18} />
                  </Link>
                </Atom>
              </div>
              {/* Strap stat mono */}
              <div className="mt-10 flex flex-wrap gap-x-10 gap-y-3">
                {STAT.map((s, i) => (
                  <Atom key={s.l} d={320 + i * 60} className="flex items-baseline gap-3">
                    <span className="font-display text-2xl text-cream-hi">{s.v}</span>
                    <span className="micro-label text-sage">{s.l}</span>
                  </Atom>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Satu hairline merah ambient 38 detik, BUKAN marquee */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] overflow-hidden">
          <div className="ambient-line h-full w-full bg-tan" />
        </div>
      </Stage>

      {/* ======================================================
          STAGE 2 — WIPE KIRI KE KANAN di atas tinta (260svh)
          Pernyataan 18% tinta + klon persis terisi clip-path.
          ====================================================== */}
      <Stage svh={260} className="bg-ground-2">
        <div className="mx-auto flex h-full max-w-[1180px] flex-col justify-center px-6">
          <p className="micro-label text-sage">Janji kami</p>
          <div className="relative mt-6 max-w-[14ch]">
            <h2
              aria-hidden
              className="font-display text-[clamp(2.1rem,7.4vw,7.2rem)]"
              style={{ color: "color-mix(in srgb, var(--color-cream) 16%, transparent)" }}
            >
              Laporan Anda tidak berhenti di tengah jalan.
            </h2>
            <h2
              className="font-display absolute inset-0 text-[clamp(2.1rem,7.4vw,7.2rem)] text-cream"
              style={{ clipPath: "inset(0 calc(100% - var(--p, 0) * 100%) 0 0)" }}
            >
              Laporan Anda tidak berhenti di tengah jalan.
            </h2>
          </div>
          <div className="mt-10 border-t-2 border-cream pt-5">
            <div className="flex flex-wrap gap-x-12 gap-y-3">
              <Atom d={80} className="micro-label text-sage-pale">
                241 laporan terdata <span className="text-tan">/ 92 skor tertinggi</span>
              </Atom>
              <Atom d={160} className="micro-label text-sage-pale">
                5 tahap status <span className="text-tan">/ 0 laporan hilang</span>
              </Atom>
            </div>
          </div>
        </div>
      </Stage>

      {/* ======================================================
          STAGE 3 — TIMELINE LANGSUNG (400svh)
          Jam, jarak, status, dan baris menyala dari SATU seri menit.
          ====================================================== */}
      <TimelineLive />

      {/* ======================================================
          STAGE 4 — PETA RUTE TERTELUSUR (300svh)
          Lattice phyllotaxis di canvas, multiply ke kertas.
          ====================================================== */}
      <RouteMap />

      {/* ======================================================
          BAND — tiga sel penjelas berpemisah hairline
          ====================================================== */}
      <section className="border-b-2 border-cream">
        <div className="mx-auto max-w-[1180px] px-6 py-24">
          <Atom className="micro-label text-sage">Cara kerja</Atom>
          <Words
            as="h2"
            text="Tiga langkah, tidak lebih."
            className="font-display mt-4 text-[clamp(2rem,5vw,4rem)] text-cream-hi"
          />
          <div className="mt-12 grid gap-px border border-ink-300 bg-ink-300 md:grid-cols-3">
            {ALUR.map((a, i) => (
              <Atom key={a.n} d={i * 90} className="card-hover bg-bg p-8">
                <p className="font-display text-3xl text-tan">{a.n}</p>
                <h3 className="font-display mt-4 text-2xl text-cream"><Words text={a.judul} base={0} /></h3>
                <Words as="p" base={4} text={a.desc} className="mt-3 text-sm leading-relaxed text-sage-pale" />
              </Atom>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
          BAND — sepuluh fitur, grid hairline
          ====================================================== */}
      <section id="fitur" className="border-b-2 border-cream">
        <div className="mx-auto max-w-[1180px] px-6 py-24">
          <Atom className="micro-label text-sage">Satu platform</Atom>
          <h2 className="font-display mt-4 text-[clamp(2rem,5vw,4rem)] text-cream-hi">
            <Words text="Sepuluh fitur," base={0} /> <span className="text-tan"><Words text="satu platform." base={2} /></span>
          </h2>
          <div className="mt-12 grid gap-px border border-ink-300 bg-ink-300 sm:grid-cols-2 lg:grid-cols-3">
            {FITUR.map((f, i) => {
              const isWide = i === FITUR.length - 1;
              return (
                <Atom
                  key={f.judul}
                  d={(i % 3) * 70}
                  className={`card-hover group bg-bg p-7 ${isWide ? "lg:col-span-3" : ""}`}
                >
                  <div className={`flex h-full flex-col ${isWide ? "lg:flex-row lg:items-center lg:gap-10" : ""}`}>
                    <div className={isWide ? "lg:flex-1" : ""}>
                      <p className="micro-label text-tan">{f.n}</p>
                      <h3 className="font-display mt-3 text-xl normal-case tracking-normal text-cream transition-colors group-hover:text-tan">
                        <Words text={f.judul} base={0} />
                      </h3>
                    </div>
                    <Words
                      as="p"
                      base={2}
                      text={f.desc}
                      className={`mt-2 text-sm leading-relaxed text-sage-pale ${isWide ? "lg:mt-0 lg:flex-1 lg:text-base" : ""}`}
                    />
                    {isWide && (
                      <div className="mt-4 hidden shrink-0 items-center gap-6 border-t border-ink-300 pt-4 lg:mt-0 lg:border-l lg:border-t-0 lg:px-10 lg:pt-0">
                        {["12 layanan", "2.4k laporan", "90% selesai"].map((s) => (
                          <span key={s} className="font-display text-lg text-tan">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </Atom>
              );
            })}
          </div>
        </div>
      </section>

      {/* ======================================================
          BAND — tiga agen AI, daftar ber-rule
          ====================================================== */}
      <section id="ai" className="border-b-2 border-cream bg-ground">
        <div className="mx-auto max-w-[1180px] px-6 py-24">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <Atom className="micro-label text-sage">AI Multi-Agent</Atom>
              <h2 className="font-display mt-4 text-[clamp(2rem,4.6vw,3.6rem)] text-cream-hi">
                <Words text="Tiga agen," base={0} />{" "}
                <span className="text-tan"><Words text="satu keputusan." base={2} /></span>
              </h2>
              <Words
                as="p"
                base={5}
                text="Setiap laporan melewati rangkaian agen yang saling melengkapi, menghasilkan penilaian objektif dalam hitungan detik."
                className="mt-4 max-w-[44ch] text-sage-pale"
              />
              <Atom d={200} className="mt-8">
                <JsonViewer />
              </Atom>
            </div>
            <div className="flex flex-col justify-center">
              {AGEN.map((a, i) => (
                <Atom key={a.nama} d={i * 90} className="group flex items-start gap-6 border-t border-ink-300 py-5 last:border-b">
                  <span className="font-display text-3xl text-tan">{a.n}</span>
                  <div>
                    <h3 className="font-display text-xl normal-case tracking-normal text-cream transition-colors group-hover:text-tan"><Words text={a.nama} base={0} /></h3>
                    <Words as="p" base={2} text={a.tugas} className="mt-1 text-sage-pale" />
                  </div>
                </Atom>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          BAND — tabel SLA per kategori (angka mono merah)
          ====================================================== */}
      <section className="border-b-2 border-cream">
        <div className="mx-auto max-w-[1180px] px-6 py-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Atom className="micro-label text-sage">Standar layanan</Atom>
              <Words as="h2" text="Enam kategori, masing-masing dengan SLA." className="font-display mt-4 max-w-[20ch] text-[clamp(2rem,5vw,4rem)] text-cream-hi" />
            </div>
            <Atom d={120} className="micro-label text-sage">Volume 01 — 2026</Atom>
          </div>
          <div className="mt-12 border-t-2 border-cream">
            {KATEGORI_TARIF.map((k, i) => (
              <Atom key={k.nama} d={i * 60} className="group grid grid-cols-[1fr_auto] items-baseline gap-4 border-b border-ink-300 py-5 transition-colors hover:bg-ground md:grid-cols-[1fr_1.2fr_auto]">
                <h3 className="font-display text-xl text-cream transition-colors group-hover:text-tan md:text-2xl"><Words text={k.nama} base={0} /></h3>
                <Words as="p" base={2} text={k.desc} className="hidden text-sm text-sage-pale md:block" />
                <span className="micro-label text-tan">{k.sla}</span>
              </Atom>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
          BAND — tim, grid hairline
          ====================================================== */}
      <section id="tim" className="border-b-2 border-cream">
        <div className="mx-auto max-w-[1180px] px-6 py-24">
          <Atom className="micro-label text-sage">Tim kami</Atom>
          <Words as="h2" text="Tim Susah Senang Bareng" className="font-display mt-4 text-[clamp(2rem,5vw,4rem)] text-cream-hi" />
          <Atom d={120} className="micro-label mt-3 text-sage">Universitas Atma Jaya Yogyakarta · Sistem Informasi</Atom>
          <div className="mt-12 grid gap-px border border-ink-300 bg-ink-300 sm:grid-cols-3">
            {TIM.map((t, i) => (
              <Atom key={t.nama} d={i * 90} className="card-hover group bg-bg p-8">
                <p className="micro-label text-tan">{t.nim}</p>
                <h3 className="font-display mt-4 text-xl normal-case leading-snug tracking-normal text-cream transition-colors group-hover:text-tan"><Words text={t.nama} base={0} /></h3>
                <p className="mt-1 text-sm text-sage-pale">{t.peran}</p>
              </Atom>
            ))}
          </div>
          <Atom d={200} className="mt-8 flex items-center gap-4">
            <Image src="/assets/logo-uajy.png" alt="Logo Universitas Atma Jaya Yogyakarta" width={44} height={53} />
            <p className="micro-label text-sage">Fakultas Teknologi Industri · Sistem Informasi</p>
          </Atom>
        </div>
      </section>

      {/* ======================================================
          BAND — FAQ dengan plus CSS-only
          ====================================================== */}
      <section id="faq" className="border-b-2 border-cream">
        <div className="mx-auto grid max-w-[1180px] gap-10 px-6 py-24 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <Atom className="micro-label text-sage">FAQ</Atom>
            <Words as="h2" text="Pertanyaan umum" className="font-display mt-4 text-[clamp(2rem,5vw,4rem)] text-cream-hi" />
            <Words as="p" base={3} text="Jawaban singkat untuk yang paling sering ditanyakan." className="mt-3 text-sage-pale" />
          </div>
          <div className="border-t-2 border-cream">
            {FAQ.map((f, i) => (
              <Atom key={f.q} d={i * 50}>
                <details className="faq group border-b border-ink-300 py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg normal-case tracking-normal text-cream">
                    <Words text={f.q} base={0} />
                    <span aria-hidden className="faq-plus shrink-0 font-display text-2xl leading-none text-tan">+</span>
                  </summary>
                  <div className="faq-body">
                    <div>
                      <Words as="p" base={2} text={f.a} className="pt-3 text-sm leading-relaxed text-sage-pale" />
                    </div>
                  </div>
                </details>
              </Atom>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
          BAND PENUTUP — dampak & ajakan, BUKAN duplikat CTA lapor
          ====================================================== */}
      <section className="border-b-2 border-cream">
        <div className="mx-auto max-w-[1180px] px-6 py-28">
          <Atom className="micro-label text-sage">Dampak untuk kota</Atom>
          <h2 className="font-display mt-6 text-[clamp(3rem,11vw,10rem)] leading-[0.88] text-cream-hi">
            <Words text="KOTA YANG" base={0} />
            <br />
            <span className="text-tan"><Words text="TANGGAP." base={1} /></span>
          </h2>
          <div className="mt-10 grid gap-px border border-ink-300 bg-ink-300 sm:grid-cols-3">
            {[
              { v: "24 jam", l: "maks penyelesaian laporan" },
              { v: "5 tahap", l: "status transparan per laporan" },
              { v: "3 agen", l: "AI menilai setiap laporan" },
            ].map((s, i) => (
              <Atom key={s.l} d={i * 80} className="bg-bg p-7">
                <p className="font-display text-4xl text-tan">{s.v}</p>
                <p className="micro-label mt-2 text-sage">{s.l}</p>
              </Atom>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-8 border-t-2 border-cream pt-8">
            <Atom d={140}>
              <Link href="/dampak" className="btn-anim inline-flex items-center gap-3 bg-tan px-8 py-4 font-display text-lg text-white no-underline hover:bg-brand-700">
                Lihat Dampak Kota <ArrowUpRight size={18} />
              </Link>
            </Atom>
            <Atom d={220} className="micro-label text-sage">
              Statistik terbuka — setiap laporan tercatat, setiap penyelesaian terlihat.
            </Atom>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="bg-ground">
        <div className="mx-auto max-w-[1180px] px-6 py-16">
          <div className="grid gap-10 border-b border-ink-300 pb-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            {/* Brand */}
            <Atom d={0}>
              <p className="font-display text-2xl text-cream">SIGAP</p>
              <Words
                as="p"
                base={2}
                text="Sistem Informasi & Gerak Aktif Pelaporan — platform warga untuk melapor, memantau, dan melihat dampaknya bagi kota."
                className="mt-3 max-w-[34ch] text-sm leading-relaxed text-sage-pale"
              />
              <p className="micro-label mt-5 text-sage">Live · 2.4k laporan aktif</p>
            </Atom>
            {/* Navigasi */}
            <Atom d={60}>
              <p className="micro-label text-tan">Navigasi</p>
              <ul className="mt-4 space-y-2.5 text-sm text-sage-pale">
                {[["Beranda", "/"], ["Buat Laporan", "/lapor"], ["Dashboard", "/dashboard"], ["Petugas", "/petugas"], ["Dampak Kota", "/dampak"]].map(([lbl, href]) => (
                  <li key={href}>
                    <a href={href} className="transition-colors hover:text-cream">{lbl}</a>
                  </li>
                ))}
              </ul>
            </Atom>
            {/* Fitur */}
            <Atom d={120}>
              <p className="micro-label text-tan">Fitur</p>
              <ul className="mt-4 space-y-2.5 text-sm text-sage-pale">
                {["Citizen Reporting", "AI Multi-Agent", "Issue Tracking", "Emergency Button", "Laporan Anonim"].map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </Atom>
            {/* Kontak */}
            <Atom d={180}>
              <p className="micro-label text-tan">Kontak</p>
              <ul className="mt-4 space-y-2.5 text-sm text-sage-pale">
                <li>Kampus III UAJY, Jalan Babarsari</li>
                <li>Yogyakarta, DIY 55281</li>
                <li>sap@sigap.id</li>
                <li>Proposal · Susah Senang Bareng</li>
              </ul>
            </Atom>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <Atom d={0} className="micro-label text-sage">© 2026 SIGAP — Sistem Informasi &amp; Gerak Aktif Pelaporan</Atom>
            <Atom d={60} className="micro-label text-sage">Universitas Atma Jaya Yogyakarta · Fakultas Teknologi Industri</Atom>
          </div>
        </div>
      </footer>
    </main>
    </IntroGate>
    </>
  );
}

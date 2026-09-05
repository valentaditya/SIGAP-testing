import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowUpRight, Sparkles, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { Rise, ClipSlide } from "@/components/Words";
import { Underline } from "@/components/Underline";
import { TimelineLive } from "@/components/TimelineLive";
import { IntroGate } from "@/components/IntroGate";
import { ForceGuest } from "@/components/ForceGuest";
import { StatCounter } from "@/components/StatCounter";
import { KATEGORI, LAPORAN } from "@/lib/data";

const PERSEN_SELESAI = Math.round(
  (LAPORAN.filter((l) => l.status === "resolved").length / LAPORAN.length) * 100,
);

export const metadata = { title: "Beranda" };

/* ================= DATA ================= */

const FITUR = [
  { n: "01", judul: "Citizen Reporting", desc: "Lapor dengan kategori, foto, dan lokasi presisi dalam hitungan detik." },
  { n: "02", judul: "AI Multi-Agent", desc: "Tiga agen cerdas menilai kategori, dampak sosial, dan tingkat urgensi." },
  { n: "03", judul: "Priority Score", desc: "Skor Urgensi 1 sampai 10 menentukan prioritas penanganan di lapangan." },
  { n: "04", judul: "Issue Tracking", desc: "Status transparan dan terpantau langsung dari Reported hingga Resolved." },
  { n: "05", judul: "Notifikasi Real-Time", desc: "Pemberitahuan instan pada setiap tahap penanganan laporan Anda." },
  { n: "06", judul: "Early Warning System", desc: "Peringatan dini area rawan berbasis akumulasi laporan warga sekitar." },
  { n: "07", judul: "Emergency Button", desc: "Kirim sinyal darurat dalam satu ketukan dengan respons instan." },
  { n: "08", judul: "Laporan Anonim", desc: "Kirim laporan sensitif dengan perlindungan privasi identitas penuh." },
  { n: "09", judul: "City Impact Open Data", desc: "Transparansi statistik dampak dan efektivitas resolusi bagi kota." },
];

const ALUR = [
  { n: "01", judul: "Kirim Laporan", desc: "Warga mengirim kategori, foto bukti, dan titik lokasi hanya dalam tiga langkah mudah." },
  { n: "02", judul: "AI Menganalisis", desc: "Tiga agen AI membaca laporan, memvalidasi bukti, dan menghitung Skor Urgensinya." },
  { n: "03", judul: "Tuntas Ditangani", desc: "Admin memverifikasi, tim lapangan bertindak, dan warga memantau hingga tuntas." },
];

const KATEGORI_TARIF = [
  { nama: "Jalan & Infrastruktur", desc: "Lubang jalan, retakan, jembatan, rambu lalu lintas rusak", sla: "48 JAM" },
  { nama: "Sampah & Kebersihan", desc: "TPS liar, tumpukan sampah, saluran air kotor", sla: "72 JAM" },
  { nama: "Banjir & Drainase", desc: "Genangan air, drainase tersumbat, tanggul bocor", sla: "24 JAM" },
  { nama: "Lampu Jalan (PJU)", desc: "PJU padam, lampu berkedip, kabel terbuka berbahaya", sla: "48 JAM" },
  { nama: "Keamanan & Ketertiban", desc: "Tawuran, gangguan ketertiban, kerumunan berisiko", sla: "24 JAM" },
  { nama: "Fasilitas Umum", desc: "Halte, taman kota, toilet umum, trotoar pejalan kaki rusak", sla: "7 HARI" },
];

const STAT = [
  { to: LAPORAN.length, pad: 2, l: "Laporan Terdata" },
  { to: KATEGORI.length, pad: 2, l: "Kategori Masalah" },
  { to: 3, pad: 2, l: "Agen AI Aktif" },
  { to: 24, suffix: " JAM", l: "Target Respons Tercepat" },
];

const AGEN = [
  { n: "01", nama: "Agent Klasifikasi", tugas: "Mengklasifikasikan jenis permasalahan secara instan dengan confidence score tinggi." },
  { n: "02", nama: "Agent Analisis Dampak", tugas: "Mengukur tingkat dampak sosial, risiko lingkungan, dan urgensi titik lokasi." },
  { n: "03", nama: "Agent Prioritas", tugas: "Menghitung Skor Urgensi 1–10 secara objektif dan menentukan estimasi SLA resolusi." },
];

const FAQ = [
  { q: "Apakah SIGAP gratis untuk seluruh warga?", a: "Ya, SIGAP adalah platform layanan publik terpadu. Warga dapat melapor, memantau tindak lanjut, dan mengakses data kota tanpa dipungut biaya apa pun." },
  { q: "Bagaimana AI menentukan tingkat prioritas?", a: "Tiga agen AI cerdas menganalisis kategori laporan, bobot dampak risiko, dan lokasi kejadian untuk menghasilkan Skor Urgensi 1–10. Laporan berbobot tinggi otomatis masuk prioritas utama." },
  { q: "Apakah laporan saya dijamin ditindaklanjuti?", a: "Setiap laporan masuk ke antrean verifikasi resmi sistem. Petugas lapangan ditugaskan sesuai SLA kategori dan perkembangan penanganan dapat dipantau secara langsung." },
  { q: "Bisakah saya melapor secara anonim?", a: "Tentu. Anda dapat mengaktifkan opsi 'Lapor sebagai Anonim' saat mengisi formulir untuk melindungi privasi dan identitas Anda." },
  { q: "Siapa yang menangani laporan di lapangan?", a: "Petugas dinas dan tim lapangan resmi yang ditugaskan admin sistem berdasarkan wilayah, kategori keahlian, dan tingkat urgensi masalah." },
  { q: "Bagaimana cara mengetahui laporan telah selesai?", a: "Status laporan akan diperbarui menjadi 'Resolved', sistem mengirimkan notifikasi langsung ke akun Anda, dan bukti penyelesaian tercatat di statistik Dampak Kota." },
];

/* ================= HALAMAN ================= */

export default async function Home() {
  const c = await cookies();
  const introSeen = c.get("sigap_intro_seen")?.value === "1";

  return (
    <>
      <ForceGuest />
      <IntroGate introSeen={introSeen}>
        <main className="overflow-hidden">
          {/* ======================================================
              HERO SECTION (CENTERED & PROMINENT)
              ====================================================== */}
          <section className="relative overflow-hidden border-b border-ink-300 bg-bg pt-8 pb-0 lg:pt-12">
            <div
              aria-hidden
              className="grid-overlay pointer-events-none absolute inset-0 opacity-50"
            />
            {/* Ambient warm glow circle */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-tan/10 blur-[130px]"
            />

            <div className="relative mx-auto max-w-[1240px] px-6">
              <div className="mx-auto flex max-w-[900px] flex-col items-center text-center">
                {/* Pill Tag Badge */}
                {/* <Rise d={0}>
                  <div className="inline-flex items-center gap-2.5 rounded-full border border-tan/25 bg-tan/10 px-5 py-2 shadow-sm backdrop-blur-md">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tan opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-tan" />
                    </span>
                    <span className="font-mono text-xs font-bold tracking-wider text-tan uppercase">
                      Sistem Informasi &amp; Gerak Aktif Pelaporan — Yogyakarta
                    </span>
                  </div>
                </Rise> */}

                {/* Main Headline */}
                <h1
                  className="font-display mt-6 font-extrabold tracking-tight text-cream-hi"
                  style={{
                    fontSize: "clamp(2.85rem, 7.5vw, 5.75rem)",
                    lineHeight: 1.08,
                  }}
                >
                  Lapor Cepat,{" "}
                  <span className="bg-gradient-to-r from-tan via-[#E65A34] to-[#B46A08] bg-clip-text text-transparent">
                    Kota Tanggap.
                  </span>
                </h1>

                {/* Subtitle */}
                <div className="mt-6 max-w-[58ch]">
                  <Rise d={180}>
                    <p className="text-base sm:text-lg leading-relaxed text-sage-pale font-normal">
                      Platform terintegrasi pelaporan warga Yogyakarta ditenagai <strong className="font-semibold text-cream">tiga agen AI</strong> yang membaca, menganalisis dampak, dan memprioritaskan penyelesaian setiap laporan secara transparan.
                    </p>
                  </Rise>
                </div>

                {/* Prominent Centered CTA Button */}
                <div className="mt-9 flex justify-center">
                  <Rise d={260}>
                    <Link
                      href="/lapor"
                      className="btn-anim inline-flex items-center gap-3.5 rounded-full bg-tan px-10 py-5 font-display text-lg font-bold text-white no-underline shadow-xl shadow-tan/30 hover:bg-tan-solid hover:shadow-tan/40"
                    >
                      Lapor Sekarang <ArrowUpRight size={22} className="stroke-[2.5]" />
                    </Link>
                  </Rise>
                </div>
              </div>

              {/* Stat Cards — pushed lower so they require a scroll to be visible */}
              <div className="mt-[40vh] grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6 pb-16">
                {STAT.map((s, i) => (
                  <Rise
                    key={s.l}
                    d={320 + i * 60}
                    className="card-hover rounded-3xl border border-ink-300 bg-surface/90 p-6 text-center shadow-sm backdrop-blur-md transition-all hover:border-tan/40 hover:shadow-md"
                  >
                    <StatCounter
                      to={s.to}
                      pad={s.pad}
                      suffix={s.suffix}
                      delay={i * 140}
                      className="font-display text-[clamp(2rem,3.6vw,2.85rem)] font-extrabold leading-none tabular-nums text-cream-hi"
                    />
                    <p className="mt-2.5 text-xs font-bold uppercase tracking-wider text-sage">
                      {s.l}
                    </p>
                  </Rise>
                ))}
              </div>
            </div>
          </section>

          {/* ======================================================
              SIKLUS RESOLUSI LAPORAN (TIMELINE)
              ====================================================== */}
          <TimelineLive />

          {/* ======================================================
              BAND — CARA KERJA
              ====================================================== */}
          <section id="alur" className="border-b border-ink-300 bg-bg">
            <div className="mx-auto max-w-[1240px] px-6 py-28">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-tan" />
                <Rise className="micro-label text-sage">Alur Praktis</Rise>
              </div>
              <Rise as="h2" className="font-display mt-3 text-[clamp(2rem,4.5vw,3.5rem)] font-extrabold tracking-tight text-cream-hi">
                <Underline>Tiga langkah</Underline>, tidak lebih.
              </Rise>
              <p className="mt-3 max-w-[60ch] text-base text-sage-pale font-normal">
                Alur pelaporan yang dirancang ringkas tanpa birokrasi berbelit agar masalah segera ditangani.
              </p>

              <div className="mt-12 grid gap-6 md:grid-cols-3">
                {ALUR.map((a, i) => (
                  <Rise
                    key={a.n}
                    d={i * 90}
                    className="card-hover rounded-3xl border border-ink-300 bg-surface p-8 shadow-sm"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-tan/10 text-tan font-display text-xl font-bold">
                      {a.n}
                    </div>
                    <h3 className="font-display mt-6 text-2xl font-bold tracking-tight text-cream">
                      {a.judul}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-sage-pale font-normal">
                      {a.desc}
                    </p>
                  </Rise>
                ))}
              </div>
            </div>
          </section>

          {/* ======================================================
              BAND — FITUR UNGGULAN
              ====================================================== */}
          <section id="fitur" className="border-b border-ink-300 bg-ground/50">
            <div className="mx-auto max-w-[1240px] px-6 py-28">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-tan" />
                <Rise className="micro-label text-sage">Fitur Unggulan</Rise>
              </div>
              <Rise as="h2" className="font-display mt-3 text-[clamp(2rem,4.5vw,3.5rem)] font-extrabold tracking-tight text-cream-hi">
                Fitur lengkap, <span className="text-tan"><Underline>satu platform</Underline>.</span>
              </Rise>
              <p className="mt-3 max-w-[60ch] text-base text-sage-pale font-normal">
                Dirancang komprehensif untuk memudahkan warga, mempercepat petugas, dan menyajikan data terbuka bagi publik.
              </p>

              <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {FITUR.map((f, i) => (
                  <Rise
                    key={f.judul}
                    d={(i % 3) * 70}
                    className="card-hover group flex flex-col justify-between rounded-3xl border border-ink-300 bg-surface p-7 shadow-sm"
                  >
                    <div>
                      <span className="inline-block rounded-lg bg-ground px-3 py-1 font-mono text-xs font-bold text-tan">
                        {f.n}
                      </span>
                      <h3 className="font-display mt-4 text-xl font-bold tracking-tight text-cream transition-colors group-hover:text-tan">
                        {f.judul}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-sage-pale font-normal">
                        {f.desc}
                      </p>
                    </div>
                  </Rise>
                ))}
              </div>
            </div>
          </section>

          {/* ======================================================
              BAND — AI MULTI-AGENT
              ====================================================== */}
          <section id="ai" className="border-b border-ink-300 bg-bg">
            <div className="mx-auto max-w-[1240px] px-6 py-28">
              <div className="mx-auto max-w-[760px] text-center">
                <div className="flex items-center justify-center gap-2">
                  <Sparkles size={16} className="text-tan" />
                  <Rise className="micro-label text-sage">Kecerdasan Buatan</Rise>
                </div>
                <Rise as="h2" className="font-display mt-3 text-[clamp(2rem,4.2vw,3.3rem)] font-extrabold tracking-tight text-cream-hi">
                  Tiga agen cerdas,{" "}
                  <span className="text-tan"><Underline>satu keputusan</Underline>.</span>
                </Rise>
                <p className="mt-4 text-base leading-relaxed text-sage-pale font-normal">
                  Setiap laporan diproses oleh rangkaian agen AI terspesialisasi yang bekerja kolaboratif untuk menghasilkan penilaian objektif dan penentuan SLA dalam hitungan detik.
                </p>
              </div>

              <div className="mt-14 grid gap-6 md:grid-cols-3">
                {AGEN.map((a, i) => (
                  <Rise
                    key={a.nama}
                    d={i * 90}
                    className="card-hover group flex flex-col justify-between rounded-3xl border border-ink-300 bg-surface p-8 shadow-sm"
                  >
                    <div>
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-tan/10 font-display text-xl font-bold text-tan">
                        {a.n}
                      </span>
                      <h3 className="font-display mt-6 text-xl font-bold tracking-tight text-cream transition-colors group-hover:text-tan">
                        {a.nama}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-sage-pale font-normal">
                        {a.tugas}
                      </p>
                    </div>
                  </Rise>
                ))}
              </div>
            </div>
          </section>

          {/* ======================================================
              BAND — STANDAR LAYANAN SLA
              ====================================================== */}
          <section id="sla" className="border-b border-ink-300 bg-ground/40">
            <div className="mx-auto max-w-[1240px] px-6 py-28">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-tan" />
                    <Rise className="micro-label text-sage">Service Level Agreement</Rise>
                  </div>
                  <Rise as="h2" className="font-display mt-3 max-w-[22ch] text-[clamp(2rem,4.5vw,3.5rem)] font-extrabold tracking-tight text-cream-hi">
                    Enam kategori dengan komitmen <Underline>SLA resmi</Underline>.
                  </Rise>
                </div>
                <Rise d={120} className="rounded-full border border-ink-300 bg-surface px-4 py-1.5 font-mono text-xs font-semibold text-sage">
                  Standar Mutu 2026
                </Rise>
              </div>

              <div className="mt-12 overflow-hidden rounded-3xl border border-ink-300 bg-surface shadow-sm">
                <div className="divide-y divide-ink-300">
                  {KATEGORI_TARIF.map((k, i) => (
                    <Rise
                      key={k.nama}
                      d={i * 60}
                      className="group grid grid-cols-[1fr_auto] items-center gap-4 p-6 transition-colors hover:bg-ground/60 md:grid-cols-[1fr_1.4fr_auto]"
                    >
                      <h3 className="font-display text-lg font-bold text-cream transition-colors group-hover:text-tan md:text-xl">
                        {k.nama}
                      </h3>
                      <p className="hidden text-sm text-sage-pale font-normal md:block">
                        {k.desc}
                      </p>
                      <span className="rounded-full bg-tan/10 px-4 py-1.5 font-mono text-xs font-bold text-tan">
                        {k.sla}
                      </span>
                    </Rise>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ======================================================
              BAND — FAQ
              ====================================================== */}
          <section id="faq" className="border-b border-ink-300 bg-ground/40">
            <div className="mx-auto grid max-w-[1240px] gap-12 px-6 py-28 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-tan" />
                  <Rise className="micro-label text-sage">Tanya Jawab</Rise>
                </div>
                <h2 className="font-display mt-3 text-[clamp(2rem,4.5vw,3.5rem)] font-extrabold tracking-tight text-cream-hi">
                  Pertanyaan Umum
                </h2>
                <p className="mt-3 text-base text-sage-pale font-normal">
                  Jawaban ringkas dan jelas untuk pertanyaan yang paling sering diajukan warga.
                </p>
              </div>

              <div className="space-y-4">
                {FAQ.map((f, i) => (
                  <Rise key={f.q} d={i * 50}>
                    <details className="faq group rounded-3xl border border-ink-300 bg-surface p-6 shadow-sm transition-all hover:border-tan/40">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-bold text-cream">
                        <span>{f.q}</span>
                        <span aria-hidden className="faq-plus shrink-0 font-display text-2xl font-bold leading-none text-tan">
                          +
                        </span>
                      </summary>
                      <div className="faq-body">
                        <div>
                          <p className="pt-4 text-sm leading-relaxed text-sage-pale font-normal">
                            {f.a}
                          </p>
                        </div>
                      </div>
                    </details>
                  </Rise>
                ))}
              </div>
            </div>
          </section>

          {/* ======================================================
              BAND PENUTUP — DAMPAK & AJAKAN
              ====================================================== */}
          <section className="border-b border-ink-300 bg-bg">
            <div className="mx-auto max-w-[1240px] px-6 py-28">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-tan" />
                <Rise className="micro-label text-sage">Transparansi Kota</Rise>
              </div>
              <h2
                className="font-display mt-6 font-extrabold tracking-tight text-cream-hi"
                style={{ fontSize: "clamp(2.5rem, 8vw, 6.5rem)", lineHeight: 1.02 }}
              >
                <ClipSlide text="KOTA YANG" step={45} />
                <br />
                <ClipSlide text="TANGGAP." step={45} base={430} className="text-tan" />
              </h2>

              <div className="mt-12 grid gap-6 sm:grid-cols-3">
                {[
                  { v: "24 Jam", l: "Maksimal target penanganan laporan" },
                  { v: "5 Tahap", l: "Pelacakan status transparan per laporan" },
                  { v: "3 Agen", l: "AI menilai & memvalidasi setiap laporan" },
                ].map((s, i) => (
                  <Rise
                    key={s.l}
                    d={i * 80}
                    className="rounded-3xl border border-ink-300 bg-surface p-8 shadow-sm"
                  >
                    <p className="font-display text-4xl font-extrabold text-tan">{s.v}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-sage">{s.l}</p>
                  </Rise>
                ))}
              </div>

              <div className="mt-12 flex flex-wrap items-center gap-8 border-t border-ink-300 pt-8">
                <Rise d={140}>
                  <Link
                    href="/peta"
                    className="btn-anim inline-flex items-center gap-3 rounded-full bg-tan px-8 py-4 font-display text-base font-semibold text-white no-underline shadow-lg shadow-tan/25 hover:bg-tan-solid"
                  >
                    Lihat Peta Laporan <ArrowUpRight size={18} />
                  </Link>
                </Rise>
                <Rise d={220} className="text-sm font-medium text-sage">
                  Peta terbuka umum, setiap laporan tercatat, setiap penyelesaian terlihat nyata.
                </Rise>
              </div>
            </div>
          </section>

          {/* ============ FOOTER ============ */}
          <footer className="bg-ground">
            <div className="mx-auto max-w-[1240px] px-6 py-16">
              <div className="grid gap-10 border-b border-ink-300 pb-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
                {/* Brand */}
                <Rise d={0}>
                  <p className="font-display text-3xl font-extrabold text-cream">
                    SI<span className="text-tan">GAP</span>
                  </p>
                  <p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-sage-pale font-normal">
                    Sistem Informasi &amp; Gerak Aktif Pelaporan, sebuah platform warga Yogyakarta untuk melapor, memantau, dan mewujudkan kota yang lebih tanggap.
                  </p>
                  {/* <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-ink-300 bg-surface px-3 py-1 text-xs font-semibold text-sage">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    <span>Live · {LAPORAN.length} laporan aktif</span>
                  </div> */}
                </Rise>

                {/* Navigasi */}
                <Rise d={60}>
                  <p className="micro-label text-tan">Navigasi</p>
                  <ul className="mt-4 space-y-2.5 text-sm text-sage-pale font-medium">
                    {[
                      ["Beranda", "/"],
                      ["Buat Laporan", "/lapor"],
                      ["Dashboard", "/dashboard"],
                      ["Petugas", "/petugas"],
                      ["Dampak Kota", "/dampak"],
                    ].map(([lbl, href]) => (
                      <li key={href}>
                        <a href={href} className="transition-colors hover:text-tan">
                          {lbl}
                        </a>
                      </li>
                    ))}
                  </ul>
                </Rise>

                {/* Fitur */}
                <Rise d={120}>
                  <p className="micro-label text-tan">Layanan Utama</p>
                  <ul className="mt-4 space-y-2.5 text-sm text-sage-pale font-medium">
                    {[
                      "Citizen Reporting",
                      "AI Multi-Agent",
                      "Issue Tracking",
                      "Emergency Button",
                      "Laporan Anonim",
                    ].map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </Rise>

                {/* Kontak */}
                <Rise d={180}>
                  <p className="micro-label text-tan">Kampus &amp; Kontak</p>
                  <ul className="mt-4 space-y-2.5 text-sm text-sage-pale font-medium">
                    <li>Kampus III UAJY, Jl. Babarsari</li>
                    <li>Yogyakarta, DIY 55281</li>
                    <li>informasi@sigap.id</li>
                    <li>Susah Senang Bareng</li>
                  </ul>
                </Rise>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-xs font-medium text-sage">
                <Rise d={0}>© 2026 SIGAP - Sistem Informasi &amp; Gerak Aktif Pelaporan</Rise>
                <Rise d={60}>Universitas Atma Jaya Yogyakarta · FTI Sistem Informasi</Rise>
              </div>
            </div>
          </footer>
        </main>
      </IntroGate>
    </>
  );
}

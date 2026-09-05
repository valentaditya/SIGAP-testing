import dynamic from "next/dynamic";

const PetaClient = dynamic(() => import("./PetaClient"), {
  ssr: false,
});

export const metadata = {
  title: "Peta Sebaran Laporan — SIGAP Yogyakarta",
  description: "Peta interaktif sebaran laporan warga, status penanganan, dan tingkat prioritas di wilayah DIY.",
};

export default function PetaPage() {
  return <PetaClient />;
}

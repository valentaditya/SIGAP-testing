import type { Metadata } from "next";
import LaporClient from "./LaporClient";

export const metadata: Metadata = { title: "Form Pelaporan" };

export default function Page() {
  return <LaporClient />;
}

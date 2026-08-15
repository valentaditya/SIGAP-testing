#!/usr/bin/env bash
# Deploy SIGAP ke Vercel (butuh: npm i -g vercel && vercel login)
set -e
cd "$(dirname "$0")"
echo "▶ Build lokal dulu untuk validasi…"
npm run build
echo "▶ Deploy ke Vercel (produksi)…"
vercel --prod

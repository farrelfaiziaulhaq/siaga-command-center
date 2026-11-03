/* ============================================================
   Data simulasi — SIAGA Command Center
   Struktur mengikuti payload REST API:
   { id_bangunan, koordinat, status_pca, prediksi_nnbp, skor_dss }
   ============================================================ */

const WEIGHTS = [
  { key: "x1", label: "Kondisi bangunan", w: 0.30 },
  { key: "x2", label: "Kondisi struktur", w: 0.20 },
  { key: "x3", label: "Kerusakan fisik", w: 0.25 },
  { key: "x4", label: "Fungsi bangunan", w: 0.15 },
  { key: "x5", label: "Kondisi pendukung", w: 0.10 }
];

const SEV_META = {
  ringan: { label: "Rusak Ringan", short: "Ringan", color: "#22c55e", icon: "i-check", priority: "Pantau" },
  sedang: { label: "Rusak Sedang", short: "Sedang", color: "#f59e0b", icon: "i-alert", priority: "Sedang" },
  berat:  { label: "Rusak Berat",  short: "Berat",  color: "#ef4444", icon: "i-x", priority: "Utama" }
};

const BUILDINGS = [
  {
    id: "B-182", name: "Kel. Penanggungan", district: "Klojen",
    lat: -7.9725, lon: 112.6305, sev: "berat", score: 9.85, rank: 1,
    prob: 93.8, kk: 128, units: 12, surveyor: "Budi S. · B-12",
    time: "03/11/2026 · 14:28 WIB", pca: 2,
    probs: { ringan: 2.1, sedang: 4.1, berat: 93.8 },
    criteria: { x1: 96, x2: 91, x3: 94, x4: 88, x5: 79 }
  },
  {
    id: "B-207", name: "Kel. Mojolangu", district: "Lowokwaru",
    lat: -7.9432, lon: 112.6320, sev: "berat", score: 8.70, rank: 2,
    prob: 91.2, kk: 96, units: 9, surveyor: "Rani P. · B-07",
    time: "03/11/2026 · 14:21 WIB", pca: 2,
    probs: { ringan: 3.0, sedang: 5.8, berat: 91.2 },
    criteria: { x1: 92, x2: 86, x3: 90, x4: 81, x5: 74 }
  },
  {
    id: "B-114", name: "Kel. Lesanpuro", district: "Kedungkandang",
    lat: -7.9905, lon: 112.6555, sev: "berat", score: 7.50, rank: 3,
    prob: 88.7, kk: 74, units: 7, surveyor: "Dedi K. · B-19",
    time: "03/11/2026 · 14:05 WIB", pca: 2,
    probs: { ringan: 4.4, sedang: 6.9, berat: 88.7 },
    criteria: { x1: 88, x2: 79, x3: 84, x4: 76, x5: 70 }
  },
  {
    id: "B-233", name: "Kel. Gadang", district: "Sukun",
    lat: -8.0050, lon: 112.6290, sev: "berat", score: 7.12, rank: 4,
    prob: 86.1, kk: 61, units: 6, surveyor: "Sari W. · B-22",
    time: "03/11/2026 · 13:58 WIB", pca: 2,
    probs: { ringan: 5.2, sedang: 8.7, berat: 86.1 },
    criteria: { x1: 84, x2: 74, x3: 81, x4: 72, x5: 66 }
  },
  {
    id: "B-190", name: "Kel. Arjosari", district: "Blimbing",
    lat: -7.9445, lon: 112.6480, sev: "sedang", score: 6.84, rank: 5,
    prob: 74.2, kk: 48, units: 5, surveyor: "Rani P. · B-07",
    time: "03/11/2026 · 13:44 WIB", pca: 1,
    probs: { ringan: 11.6, sedang: 74.2, berat: 14.2 },
    criteria: { x1: 62, x2: 58, x3: 66, x4: 54, x5: 51 }
  },
  {
    id: "B-205", name: "Kel. Kauman", district: "Klojen",
    lat: -7.9800, lon: 112.6380, sev: "berat", score: 6.65, rank: 6,
    prob: 81.4, kk: 42, units: 4, surveyor: "Budi S. · B-12",
    time: "03/11/2026 · 13:39 WIB", pca: 2,
    probs: { ringan: 6.8, sedang: 11.8, berat: 81.4 },
    criteria: { x1: 79, x2: 68, x3: 77, x4: 64, x5: 60 }
  },
  {
    id: "B-158", name: "Kel. Tulusrejo", district: "Lowokwaru",
    lat: -7.9550, lon: 112.6215, sev: "sedang", score: 6.42, rank: 7,
    prob: 70.5, kk: 39, units: 4, surveyor: "Nadia F. · B-31",
    time: "03/11/2026 · 13:27 WIB", pca: 1,
    probs: { ringan: 14.2, sedang: 70.5, berat: 15.3 },
    criteria: { x1: 58, x2: 54, x3: 61, x4: 49, x5: 47 }
  },
  {
    id: "B-221", name: "Kel. Purwantoro", district: "Blimbing",
    lat: -7.9500, lon: 112.6440, sev: "sedang", score: 6.10, rank: 8,
    prob: 68.8, kk: 33, units: 4, surveyor: "Dedi K. · B-19",
    time: "03/11/2026 · 13:18 WIB", pca: 1,
    probs: { ringan: 16.0, sedang: 68.8, berat: 15.2 },
    criteria: { x1: 55, x2: 51, x3: 58, x4: 46, x5: 44 }
  },
  {
    id: "B-166", name: "Kel. Oro-oro Dowo", district: "Klojen",
    lat: -7.9855, lon: 112.6180, sev: "sedang", score: 5.87, rank: 9,
    prob: 65.4, kk: 28, units: 3, surveyor: "Nadia F. · B-31",
    time: "03/11/2026 · 13:02 WIB", pca: 1,
    probs: { ringan: 18.3, sedang: 65.4, berat: 16.3 },
    criteria: { x1: 51, x2: 47, x3: 54, x4: 42, x5: 40 }
  },
  {
    id: "B-241", name: "Kel. Bandungrejosari", district: "Sukun",
    lat: -7.9990, lon: 112.6165, sev: "ringan", score: 5.20, rank: 10,
    prob: 48.6, kk: 22, units: 3, surveyor: "Sari W. · B-22",
    time: "03/11/2026 · 12:48 WIB", pca: 0,
    probs: { ringan: 48.6, sedang: 33.1, berat: 18.3 },
    criteria: { x1: 38, x2: 34, x3: 41, x4: 31, x5: 29 }
  },
  {
    id: "B-149", name: "Kel. Jatimulyo", district: "Lowokwaru",
    lat: -7.9560, lon: 112.6060, sev: "ringan", score: 4.95, rank: 11,
    prob: 45.5, kk: 18, units: 2, surveyor: "Budi S. · B-12",
    time: "03/11/2026 · 12:31 WIB", pca: 0,
    probs: { ringan: 45.5, sedang: 36.0, berat: 18.5 },
    criteria: { x1: 34, x2: 30, x3: 37, x4: 27, x5: 26 }
  },
  {
    id: "B-176", name: "Kel. Mergosono", district: "Kedungkandang",
    lat: -7.9845, lon: 112.6440, sev: "ringan", score: 4.72, rank: 12,
    prob: 44.0, kk: 15, units: 2, surveyor: "Dedi K. · B-19",
    time: "03/11/2026 · 12:19 WIB", pca: 0,
    probs: { ringan: 44.0, sedang: 37.2, berat: 18.8 },
    criteria: { x1: 31, x2: 27, x3: 34, x4: 24, x5: 23 }
  },
  {
    id: "B-219", name: "Kel. Mulyorejo", district: "Sukun",
    lat: -8.0020, lon: 112.6065, sev: "ringan", score: 4.40, rank: 13,
    prob: 41.7, kk: 13, units: 2, surveyor: "Sari W. · B-22",
    time: "03/11/2026 · 12:04 WIB", pca: 0,
    probs: { ringan: 41.7, sedang: 38.5, berat: 19.8 },
    criteria: { x1: 27, x2: 24, x3: 30, x4: 21, x5: 20 }
  }
];

const TREND = {
  labels: ["21 Okt", "22 Okt", "23 Okt", "24 Okt", "25 Okt", "26 Okt", "27 Okt", "28 Okt", "29 Okt", "30 Okt", "31 Okt", "1 Nov", "2 Nov", "3 Nov"],
  verified: [24, 31, 28, 45, 52, 48, 76, 89, 84, 112, 146, 198, 244, 312],
  predicted: [30, 34, 39, 44, 58, 63, 71, 92, 101, 124, 158, 186, 231, 298]
};

const INITIAL_FEED = [
  { icon: "i-alert", color: "#ef4444", text: "<strong>Laporan baru B-182</strong> · Rusak Berat terdeteksi", meta: "Surveyor B-12", time: "2 dtk lalu" },
  { icon: "i-cpu", color: "#34d399", text: "<strong>NNBP memvalidasi 12 bangunan</strong> · akurasi 93,8%", meta: "Model A2", time: "48 dtk lalu" },
  { icon: "i-truck", color: "#38bdf8", text: "<strong>Tim Charlie tiba di Zona A</strong> · 2 kendaraan", meta: "Logistik", time: "4 mnt lalu" },
  { icon: "i-box", color: "#a78bfa", text: "<strong>Tenda 40 unit terkirim</strong> ke Posko Klojen", meta: "Gudang BPBD", time: "12 mnt lalu" }
];

const LIVE_EVENTS = [
  { icon: "i-alert", color: "#ef4444", text: "<strong>Laporan baru B-244</strong> · indikasi Rusak Berat", meta: "Surveyor B-22" },
  { icon: "i-cpu", color: "#34d399", text: "<strong>Klasifikasi GLCM–PCA selesai</strong> · 8 bangunan", meta: "Model A2" },
  { icon: "i-truck", color: "#38bdf8", text: "<strong>Tim Bravo bergerak</strong> menuju Zona C", meta: "SAR" },
  { icon: "i-box", color: "#a78bfa", text: "<strong>Air bersih 1.200 L</strong> tiba di Posko Sukun", meta: "Logistik" },
  { icon: "i-radio", color: "#f59e0b", text: "<strong>Pembaruan BMKG</strong> · curah hujan 18 mm/jam", meta: "BMKG" },
  { icon: "i-building", color: "#f59e0b", text: "<strong>B-158 naik status</strong> · Sedang → Berat", meta: "Validasi lapangan" }
];

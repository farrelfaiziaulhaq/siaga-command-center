/* ============================================================
   SIAGA Command Center — interaction layer
   ============================================================ */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const params = new URLSearchParams(location.search);
const STATIC_MODE = params.get("static") === "1";

/* ---------- Peta: konversi koordinat → persen ---------- */
const MAP = { z: 14, x0: 13315, y0: 8554, tile: 256, cols: 6, rows: 4 };

function project(lat, lon) {
  const n = 2 ** MAP.z;
  const px = ((lon + 180) / 360) * n * MAP.tile;
  const py = ((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * n * MAP.tile;
  return {
    x: ((px - MAP.x0 * MAP.tile) / (MAP.cols * MAP.tile)) * 100,
    y: ((py - MAP.y0 * MAP.tile) / (MAP.rows * MAP.tile)) * 100
  };
}

const fmt = (n) => new Intl.NumberFormat("id-ID").format(n);
const dec = (n) => String(n).replace(".", ",");

const state = {
  filter: "all",
  selected: null,
  paused: false,
  zoom: 1.18,
  lastSync: Date.now(),
  search: "",
  liveStep: 0
};

/* ---------- Inspector / drawer ---------- */
function openDrawer(id) {
  const b = BUILDINGS.find((x) => x.id === id);
  if (!b) return;
  state.selected = id;

  const meta = SEV_META[b.sev];
  $("#drawerId").textContent = b.id;
  $("#drawerName").textContent = b.name;
  $("#drawerLoc").textContent = `${b.district} · ${dec(b.lat.toFixed(4))} / ${dec(b.lon.toFixed(4))}`;

  const status = $("#drawerStatus");
  status.style.background = `linear-gradient(90deg, ${meta.color}22, ${meta.color}05)`;
  status.style.borderColor = `${meta.color}44`;
  status.querySelector(".sev-ic").style.color = meta.color;
  status.querySelector(".sev-ic").style.background = `${meta.color}22`;
  $("#drawerSev").textContent = meta.label;
  $("#drawerSev").style.color = "#ffe4e4";
  $("#drawerSevSub").textContent = `${meta.priority === "Utama" ? "Prioritas utama" : "Prioritas " + meta.priority.toLowerCase()} · tindakan < 6 jam`;
  $("#drawerScore").textContent = dec(b.score.toFixed(2));

  $("#mKK").innerHTML = `${fmt(b.kk)}<small>KK</small>`;
  $("#mBangunan").innerHTML = `${b.units}<small>unit</small>`;
  $("#mProb").innerHTML = `${dec(b.prob.toFixed(1))}<small>%</small>`;

  const probRows = Object.entries(b.probs)
    .map(([sev, val]) => {
      const m = SEV_META[sev];
      return `<div class="prob-row" style="--c:${m.color};--w:${val}%">
        <span class="lbl"><i></i>${m.short}</span>
        <span class="prob-bar"><div></div></span>
        <b>${dec(val.toFixed(1))}%</b>
      </div>`;
    })
    .join("");
  $("#probRows").innerHTML = probRows;

  $("#critRows").innerHTML = WEIGHTS.map((w) => `
    <div class="crit-row">
      <div class="crit-top"><span>${w.label}</span><b><em>bobot ${dec(w.w.toFixed(2))}</em>${b.criteria[w.key]}</b></div>
      <div class="crit-bar"><div style="width:${b.criteria[w.key]}%"></div></div>
    </div>`).join("");

  $("#metaId").textContent = b.id;
  $("#metaKec").textContent = b.district;
  $("#metaCoord").textContent = `${dec(b.lat.toFixed(4))} / ${dec(b.lon.toFixed(4))}`;
  $("#metaSurveyor").textContent = b.surveyor;
  $("#metaTime").textContent = b.time;

  $("#overlay").classList.add("open");
  const drawer = $("#drawer");
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");

  $$(".p-row").forEach((r) => r.classList.toggle("selected", r.dataset.id === id));
  $$(".pin").forEach((p) => p.classList.toggle("selected", p.dataset.id === id));
}

function closeDrawer() {
  $("#overlay").classList.remove("open");
  const drawer = $("#drawer");
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  state.selected = null;
  $$(".pin.selected, .p-row.selected").forEach((n) => n.classList.remove("selected"));
}

/* ---------- Render peta ---------- */
function renderPins() {
  const wrap = $("#mapPins");
  wrap.innerHTML = BUILDINGS.map((b) => {
    const p = project(b.lat, b.lon);
    const meta = SEV_META[b.sev];
    const size = b.sev === "berat" ? 96 : b.sev === "sedang" ? 66 : 46;
    return `<span class="pin-heat" style="left:${p.x.toFixed(2)}%;top:${p.y.toFixed(2)}%;--c:${meta.color};--sz:${size}px"></span>
      <button class="pin" data-id="${b.id}" data-sev="${b.sev}" style="left:${p.x.toFixed(2)}%;top:${p.y.toFixed(2)}%;--c:${meta.color}"
      aria-label="${b.name}, ${meta.label}, skor ${dec(b.score.toFixed(2))}">
      <svg class="icon"><use href="#${meta.icon}"/></svg>
    </button>`;
  }).join("");
  bindPins();
  updateCounts();
}

function updateCounts() {
  const counts = { ringan: 0, sedang: 0, berat: 0 };
  BUILDINGS.forEach((b) => counts[b.sev]++);
  $("#countRingan").textContent = counts.ringan;
  $("#countSedang").textContent = counts.sedang;
  $("#countBerat").textContent = counts.berat;
  $("#legendTotal").textContent = BUILDINGS.length;
  $("#pinCount").textContent = BUILDINGS.length;
}

function bindPins() {
  $$(".pin").forEach((pin) => {
    pin.addEventListener("mouseenter", () => {
      const b = BUILDINGS.find((x) => x.id === pin.dataset.id);
      if (!b) return;
      const p = project(b.lat, b.lon);
      const tip = $("#pinTip");
      tip.style.left = `${p.x}%`;
      tip.style.top = `${p.y}%`;
      tip.style.setProperty("--c", SEV_META[b.sev].color);
      tip.innerHTML = `<div class="t-name">${b.name}</div>
        <div class="t-meta"><i></i>${SEV_META[b.sev].label} · ${dec(b.score.toFixed(2))}</div>`;
      tip.classList.add("show");
    });
    pin.addEventListener("mouseleave", () => $("#pinTip").classList.remove("show"));
    pin.addEventListener("click", () => openDrawer(pin.dataset.id));
  });
}

function applyFilter() {
  $$(".pin").forEach((pin) => {
    const visible = state.filter === "all" || pin.dataset.sev === state.filter;
    const matchesSearch = !state.search
      || (BUILDINGS.find((b) => b.id === pin.dataset.id)?.name || "").toLowerCase().includes(state.search)
      || pin.dataset.id.toLowerCase().includes(state.search);
    pin.classList.toggle("dimmed", !visible || !matchesSearch);
    pin.style.pointerEvents = visible && matchesSearch ? "auto" : "none";
  });
  $$(".p-row").forEach((row) => {
    const b = BUILDINGS.find((x) => x.id === row.dataset.id);
    const visible = state.filter === "all" || b?.sev === state.filter;
    const matchesSearch = !state.search
      || (b?.name || "").toLowerCase().includes(state.search)
      || row.dataset.id.toLowerCase().includes(state.search);
    row.style.display = visible ? "" : "none";
    row.style.opacity = matchesSearch ? "" : "0.3";
  });
}

/* ---------- Render prioritas ---------- */
function priorityClass(rank) {
  if (rank === 1) return "utama";
  if (rank === 2) return "tinggi";
  if (rank <= 4) return "sedang";
  return "pantau";
}

function priorityLabel(rank) {
  if (rank === 1) return "Utama";
  if (rank === 2) return "Tinggi";
  if (rank <= 4) return "Sedang";
  return "Pantau";
}

function renderPriority() {
  const rows = [...BUILDINGS].sort((a, b) => b.score - a.score).slice(0, 5);
  $("#priorityRows").innerHTML = rows.map((b, i) => {
    const rank = i + 1;
    return `<button class="p-row" data-id="${b.id}">
      <span class="p-rank">${rank}</span>
      <span class="p-area"><b>${b.name}</b><span>${b.district} · ${b.id}</span></span>
      <span class="p-score">${dec(b.score.toFixed(2))}</span>
      <span class="p-status ${priorityClass(rank)}">${priorityLabel(rank)}</span>
    </button>`;
  }).join("");

  $$(".p-row").forEach((row) => row.addEventListener("click", () => openDrawer(row.dataset.id)));
}

/* ---------- Render tren ---------- */
function smoothPath(points) {
  if (!points.length) return "";
  let d = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cx = (p0[0] + p1[0]) / 2;
    d += ` C ${cx},${p0[1]} ${cx},${p1[1]} ${p1[0]},${p1[1]}`;
  }
  return d;
}

function renderTrend() {
  const svg = $("#trendChart");
  const W = 660, H = 118, L = 36, R = 10, T = 12, B = 20;
  const max = 320;
  const innerW = W - L - R;
  const innerH = H - T - B;
  const x = (i) => L + (i / (TREND.labels.length - 1)) * innerW;
  const y = (v) => T + innerH - (v / max) * innerH;

  const grid = [0, 80, 160, 240, 320].map((v) => {
    const yy = y(v);
    return `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" stroke="#1a2739" stroke-width="1" vector-effect="non-scaling-stroke" ${v === 0 ? "" : 'stroke-dasharray="3 5"'}/>
      <text x="${L - 7}" y="${yy + 3}" text-anchor="end" font-size="8.5" fill="#4d6078">${v}</text>`;
  }).join("");

  const xLabels = TREND.labels.map((lab, i) => {
    if (![0, 3, 6, 9, 13].includes(i)) return "";
    return `<text x="${x(i)}" y="${H - 4}" text-anchor="${i === 0 ? "start" : i === 13 ? "end" : "middle"}" font-size="8.5" fill="#4d6078">${lab}</text>`;
  }).join("");

  const vPoints = TREND.verified.map((v, i) => [x(i), y(v)]);
  const pPoints = TREND.predicted.map((v, i) => [x(i), y(v)]);
  const vLine = smoothPath(vPoints);
  const pLine = smoothPath(pPoints);
  const area = `${vLine} L ${W - R},${T + innerH} L ${L},${T + innerH} Z`;

  const last = vPoints[vPoints.length - 1];
  const before = vPoints[vPoints.length - 2];
  const midX = (last[0] + before[0]) / 2;

  svg.innerHTML = `
    <defs>
      <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#38bdf8" stop-opacity=".26"/>
        <stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${grid}
    ${xLabels}
    <path d="${area}" fill="url(#areaFill)"/>
    <path d="${pLine}" fill="none" stroke="#52657e" stroke-width="1.3" stroke-dasharray="4 4" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
    <path d="${vLine}" fill="none" stroke="#38bdf8" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
    <line x1="${last[0]}" x2="${last[0]}" y1="${T}" y2="${T + innerH}" stroke="#38bdf8" stroke-opacity=".22" stroke-width="1" stroke-dasharray="2 3" vector-effect="non-scaling-stroke"/>
    <circle cx="${last[0]}" cy="${last[1]}" r="5.5" fill="#38bdf8" opacity=".16"/>
    <circle cx="${last[0]}" cy="${last[1]}" r="2.6" fill="#7dd3fc" stroke="#06111e" stroke-width="1"/>
    <circle cx="${midX}" cy="${last[1]}" r="0" fill="none"/>
  `;
}

/* ---------- Render feed ---------- */
function feedItemHTML(item, isNew = false) {
  return `<div class="feed-item ${isNew ? "new" : ""}">
    <span class="feed-ic" style="--c:${item.color}"><svg class="icon"><use href="#${item.icon}"/></svg></span>
    <div class="feed-txt">
      <b>${item.text}</b>
      <span>${item.meta}<i class="dotsep"></i>${item.time || "baru saja"}</span>
    </div>
  </div>`;
}

function renderFeed() {
  $("#feedList").innerHTML = INITIAL_FEED.slice(0, 3).map((f) => feedItemHTML(f)).join("");
  $("#feedList").addEventListener("click", () => toast("Membuka <b>24 aktivitas</b> hari ini", "i-activity"));
}

function pushFeed(item) {
  const list = $("#feedList");
  list.insertAdjacentHTML("afterbegin", feedItemHTML(item, true));
  while (list.children.length > 3) list.lastElementChild.remove();
}

/* ---------- Gauge ---------- */
function animateGauge() {
  const circle = $("#gaugeVal");
  const circumference = 2 * Math.PI * 34;
  const arc = circumference * 0.75;
  circle.style.strokeDasharray = `${arc} ${circumference - arc}`;
  circle.style.strokeDashoffset = arc;
  requestAnimationFrame(() => {
    setTimeout(() => {
      circle.style.strokeDashoffset = arc * (1 - 0.9381);
    }, 180);
  });
}

/* ---------- Toast ---------- */
function toast(message, icon = "i-check-circle") {
  const node = document.createElement("div");
  node.className = "toast";
  node.innerHTML = `<svg class="icon"><use href="#${icon}"/></svg><span>${message}</span>`;
  $("#toasts").appendChild(node);
  setTimeout(() => {
    node.style.opacity = "0";
    node.style.transform = "translateY(6px)";
    node.style.transition = "0.25s";
    setTimeout(() => node.remove(), 260);
  }, 3800);
}

/* ---------- Live clock & sync ---------- */
function tickClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  $("#clock").textContent = `${hh}:${mm}:${ss}`;

  const age = Math.max(1, Math.round((Date.now() - state.lastSync) / 1000));
  if (age < 60) {
    $("#mapUpdated").textContent = `diperbarui ${age} dtk lalu`;
  } else {
    $("#mapUpdated").textContent = `diperbarui ${Math.floor(age / 60)} mnt lalu`;
  }
}

function markSync() {
  state.lastSync = Date.now();
  const t = $("#clock").textContent;
  $("#syncTime").textContent = t;
}

/* ---------- Simulasi data langsung ---------- */
const EXTRA_POINTS = [
  { lat: -7.9660, lon: 112.6420, district: "Klojen" },
  { lat: -7.9610, lon: 112.6160, district: "Lowokwaru" },
  { lat: -7.9880, lon: 112.6360, district: "Kedungkandang" }
];

function simulateLiveEvent() {
  if (state.paused || STATIC_MODE) return;
  const ev = LIVE_EVENTS[state.liveStep % LIVE_EVENTS.length];
  state.liveStep++;

  let item = { ...ev, time: "baru saja" };
  if (state.liveStep % 2 === 1) {
    const extra = EXTRA_POINTS[(state.liveStep - 1) / 2 % EXTRA_POINTS.length];
    const idNum = 250 + state.liveStep;
    const isNew = !BUILDINGS.find((b) => b.id === `B-${idNum}`);
    if (isNew) {
      const nb = {
        id: `B-${idNum}`, name: "Laporan lapangan baru", district: extra.district,
        lat: extra.lat, lon: extra.lon, sev: "berat", score: 7.4, rank: 20,
        prob: 89.2, kk: 24, units: 2, surveyor: "Surveyor lapangan",
        time: "03/11/2026 · baru saja", pca: 2,
        probs: { ringan: 4.1, sedang: 6.7, berat: 89.2 },
        criteria: { x1: 85, x2: 76, x3: 82, x4: 71, x5: 65 }
      };
      BUILDINGS.push(nb);
      renderPins();
      applyFilter();
      const pin = $(`.pin[data-id="${nb.id}"]`);
      pin?.classList.add("is-new");
      item = { icon: "i-alert", color: "#ef4444", text: `<strong>Laporan baru ${nb.id}</strong> · Rusak Berat terdeteksi`, meta: "Surveyor lapangan", time: "baru saja" };
      updateKpiAfterNew();
      const toastNode = $("#mapToast");
      toastNode.innerHTML = `<svg class="icon" style="width:12px;height:12px;color:#7dd3fc"><use href="#i-radio"/></svg>
        <span><b>Titik baru diterima</b> · ${nb.id} · ${extra.district}</span>`;
      toastNode.classList.add("show");
      setTimeout(() => toastNode.classList.remove("show"), 3400);
    }
  }

  pushFeed(item);
  markSync();
  if (state.liveStep % 3 === 0) toast(`Data baru masuk dari <b>Mobile Surveyor</b>`, "i-radio");
}

function updateKpiAfterNew() {
  const kpi = $$(".kpi-value")[1];
  const current = parseInt(kpi.textContent.replace(/\D/g, ""), 10) || 1284;
  kpi.innerHTML = `${fmt(current + 1)}<small>unit</small>`;
}

/* ---------- Search & filter ---------- */
function initFilters() {
  $$("#mapFilters .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      $$("#mapFilters .chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      state.filter = chip.dataset.sev;
      applyFilter();
    });
  });

  $("#globalSearch").addEventListener("input", (e) => {
    state.search = e.target.value.trim().toLowerCase();
    applyFilter();
  });
  $("#globalSearch").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const match = BUILDINGS.find((b) => b.name.toLowerCase().includes(state.search) || b.id.toLowerCase().includes(state.search));
      if (match) openDrawer(match.id);
    }
  });
}

/* ---------- Map controls ---------- */
function initMapControls() {
  $("#zoomIn").addEventListener("click", () => {
    state.zoom = Math.min(1.6, state.zoom + 0.15);
    $("#mapWrap").style.setProperty("--zoom", state.zoom);
  });
  $("#zoomOut").addEventListener("click", () => {
    state.zoom = Math.max(1, state.zoom - 0.15);
    $("#mapWrap").style.setProperty("--zoom", state.zoom);
  });
  $("#liveToggle").addEventListener("click", () => {
    state.paused = !state.paused;
    const chip = $("#liveToggle");
    chip.classList.toggle("paused", state.paused);
    $("#liveLabel").textContent = state.paused ? "Dijeda" : "Langsung";
    toast(state.paused ? "Umpan langsung <b>dijeda</b>" : "Umpan langsung <b>dilanjutkan</b>", "i-radio");
  });
}

/* ---------- Boot ---------- */
function boot() {
  renderPins();
  renderPriority();
  renderTrend();
  renderFeed();
  initFilters();
  initMapControls();
  animateGauge();
  tickClock();
  setInterval(tickClock, 1000);
  if (!STATIC_MODE) setInterval(simulateLiveEvent, 11000);

  // Detail demo lewat URL: ?detail=B-182
  const detail = params.get("detail");
  if (detail) {
    setTimeout(() => openDrawer(detail), 350);
  }

  // Pemberitahuan
  $("#alertClose").addEventListener("click", () => $("#alertBanner").classList.add("is-hidden"));
  $("#alertLink").addEventListener("click", () => {
    $$(".p-row")[0]?.focus();
    $(".priority").scrollIntoView({ behavior: "smooth", block: "center" });
  });
  $("#bellBtn").addEventListener("click", () => toast("<b>3 notifikasi baru</b> · 2 laporan kritis, 1 pembaruan model", "i-bell"));
  $("#seeAllPriority").addEventListener("click", (e) => {
    e.preventDefault();
    toast("Menampilkan <b>24 area</b> pada daftar prioritas lengkap", "i-table");
  });
  $("#deployRec").addEventListener("click", (e) => {
    const btn = e.currentTarget;
    btn.innerHTML = '<svg class="icon" style="width:11px;height:11px"><use href="#i-check"/></svg>';
    toast("Rekomendasi evakuasi <b>Zona A</b> dikirim ke tim lapangan", "i-send");
    setTimeout(() => {
      btn.innerHTML = '<svg class="icon"><use href="#i-send"/></svg>';
    }, 2600);
  });

  // Drawer
  $("#drawerClose").addEventListener("click", closeDrawer);
  $("#overlay").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      $("#globalSearch").focus();
    }
  });

  // Segmented control
  $$(".segmented button").forEach((b) => b.addEventListener("click", () => {
    $$(".segmented button").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    toast(`Rentang data diubah ke <b>${b.textContent}</b>`, "i-clock");
  }));

  $$(".btn").forEach((btn) => {
    if (btn.textContent.includes("Ekspor laporan")) {
      btn.addEventListener("click", () => {
        toast("Menyiapkan laporan PDF…", "i-file");
        setTimeout(() => toast("Laporan <b>situasi-pascabencana.pdf</b> siap diunduh", "i-download"), 1400);
      });
    }
  });

  markSync();
  document.documentElement.dataset.ready = "true";
}

document.addEventListener("DOMContentLoaded", boot);

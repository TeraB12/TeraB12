// Genera el panel de actividad del perfil, en la identidad de Pulso.
//
// No usa servicios de terceros a proposito: los generadores tipo
// github-readme-stats se caen, se saturan y pintan con su paleta, no con la
// nuestra. Aca los datos salen de la API de GitHub y el SVG se dibuja con los
// mismos tokens que DESIGN.md, asi el panel envejece junto con la marca.
//
// Se ejecuta desde .github/workflows/pulso.yml. Sin dependencias: Node 20 trae
// fetch incorporado.

import { writeFileSync, mkdirSync } from "node:fs";

const USER = process.env.GH_USER || "TeraB12";
const TOKEN = process.env.GH_TOKEN;
if (!TOKEN) {
  console.error("Falta GH_TOKEN.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Paleta. Copiada de DESIGN.md: negro calido, un solo dorado, cero azul.
// ---------------------------------------------------------------------------
const C = {
  bg: "#0A0A08",
  accent: "#E9B23E",
  ink: "#F4F1EA",
  ink70: "#B6B1A8",
  ink50: "#8A857C",
  ink45: "#807C74",
  ink35: "#6B6862",
  hair: "#F4F1EA",
};

// La escala del mapa de calor, en dorado. El nivel 0 es un negro apenas mas
// claro que el fondo: tiene que leerse como celda vacia, no como agujero.
const SCALE = ["#17170F", "#4A3A17", "#8A6A22", "#C4952F", "#E9B23E"];

const MONO = `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace`;
const SANS = `"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif`;

// ---------------------------------------------------------------------------
// Datos
// ---------------------------------------------------------------------------
const QUERY = `
  query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays { date contributionCount }
          }
        }
      }
    }
  }`;

const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: {
    Authorization: `bearer ${TOKEN}`,
    "Content-Type": "application/json",
    "User-Agent": "perfil-pulso",
  },
  body: JSON.stringify({ query: QUERY, variables: { login: USER } }),
});

const json = await res.json();
if (json.errors) {
  console.error(JSON.stringify(json.errors, null, 2));
  process.exit(1);
}

const cal = json.data.user.contributionsCollection.contributionCalendar;
const weeks = cal.weeks;
const days = weeks.flatMap((w) => w.contributionDays);

// ---------------------------------------------------------------------------
// Rachas.
//
// La actual se cuenta hacia atras desde el ultimo dia con actividad. Si hoy
// todavia no commiteaste no rompe la racha: recien la corta un dia entero en
// cero, que es como la cuenta cualquiera que la mire.
// ---------------------------------------------------------------------------
function streaks(all) {
  let longest = 0;
  let run = 0;
  for (const d of all) {
    run = d.contributionCount > 0 ? run + 1 : 0;
    if (run > longest) longest = run;
  }

  let current = 0;
  for (let i = all.length - 1; i >= 0; i--) {
    if (all[i].contributionCount > 0) current++;
    else if (i === all.length - 1) continue; // hoy sin actividad todavia
    else break;
  }
  return { current, longest };
}

const { current, longest } = streaks(days);
const busiest = days.reduce((m, d) => Math.max(m, d.contributionCount), 0);
const total = cal.totalContributions;

// El nivel se calcula contra el pico real, no contra un umbral fijo: si el pico
// del anio es 40, un dia de 8 tiene que verse activo, no apagado.
function level(n) {
  if (n === 0) return 0;
  const r = n / Math.max(busiest, 1);
  if (r > 0.6) return 4;
  if (r > 0.3) return 3;
  if (r > 0.12) return 2;
  return 1;
}

// ---------------------------------------------------------------------------
// Dibujo
// ---------------------------------------------------------------------------
const W = 1280;
const LEFT = 108;
const RIGHT = 64;
const GRID_TOP = 250;

const pitch = Math.floor((W - LEFT - RIGHT) / weeks.length);
const cell = pitch - 4;
const GRID_H = pitch * 7;
const GRID_BOTTOM = GRID_TOP + GRID_H;
const H = GRID_BOTTOM + 96;

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function build(t) {
  const p = [];

  p.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(t.aria(total, current, longest, busiest))}">`
  );
  p.push(`  <title>${esc(t.title)}</title>`);
  p.push(`  <defs><style>
      .mono { font-family: ${MONO}; }
      .sans { font-family: ${SANS}; }
      .eyebrow { font-size: 16px; letter-spacing: 2.6px; fill: ${C.accent}; }
      .key     { font-size: 12px; letter-spacing: 2px; fill: ${C.ink35}; }
      .big     { font-size: 52px; font-weight: 800; letter-spacing: -2px; fill: ${C.ink}; }
      .unit    { font-size: 17px; font-weight: 400; letter-spacing: 0; fill: ${C.ink45}; }
      .mlabel  { font-size: 12px; letter-spacing: 1.4px; fill: ${C.ink45}; }
      .dlabel  { font-size: 11.5px; letter-spacing: 1px; fill: ${C.ink35}; }
      .legend  { font-size: 12px; letter-spacing: 1.6px; fill: ${C.ink45}; }
      .foot    { font-size: 13px; fill: ${C.ink35}; }
    </style></defs>`);

  p.push(`  <rect width="${W}" height="${H}" fill="${C.bg}"/>`);
  p.push(
    `  <path d="M0 .5 H${W} M0 ${H - 0.5} H${W}" stroke="${C.hair}" stroke-opacity=".11" stroke-width="1"/>`
  );

  p.push(`  <text class="mono eyebrow" x="64" y="54">${esc(t.eyebrow)}</text>`);

  // Fila de indicadores
  const stats = [
    { k: t.kTotal, v: total, u: "" },
    { k: t.kCurrent, v: current, u: t.days },
    { k: t.kLongest, v: longest, u: t.days },
    { k: t.kBusiest, v: busiest, u: "" },
  ];
  stats.forEach((s, i) => {
    const x = 64 + i * 304;
    p.push(`  <text class="mono key" x="${x}" y="112">${esc(s.k)}</text>`);
    p.push(
      `  <text class="sans big" x="${x}" y="166">${s.v}<tspan class="sans unit" dx="8">${esc(s.u)}</tspan></text>`
    );
  });

  p.push(
    `  <path d="M64 198.5 H${W - 64}" stroke="${C.hair}" stroke-opacity=".11" stroke-width="1"/>`
  );

  // Rotulos de mes, uno por cada semana que estrena mes
  let lastMonth = -1;
  weeks.forEach((w, wi) => {
    const first = w.contributionDays[0];
    if (!first) return;
    const m = new Date(first.date + "T00:00:00Z").getUTCMonth();
    if (m !== lastMonth) {
      lastMonth = m;
      const x = LEFT + wi * pitch;
      if (x < W - 120)
        p.push(`  <text class="mono mlabel" x="${x}" y="234">${t.months[m]}</text>`);
    }
  });

  // Rotulos de dia
  [
    [1, t.mon],
    [3, t.wed],
    [5, t.fri],
  ].forEach(([row, label]) => {
    const y = GRID_TOP + row * pitch + cell / 2 + 4;
    p.push(
      `  <text class="mono dlabel" x="${LEFT - 14}" y="${y}" text-anchor="end">${label}</text>`
    );
  });

  // El mapa de calor
  weeks.forEach((w, wi) => {
    w.contributionDays.forEach((d) => {
      const row = new Date(d.date + "T00:00:00Z").getUTCDay();
      const x = LEFT + wi * pitch;
      const y = GRID_TOP + row * pitch;
      p.push(
        `  <rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${SCALE[level(d.contributionCount)]}"><title>${d.date}: ${d.contributionCount}</title></rect>`
      );
    });
  });

  // Referencia
  const ly = GRID_BOTTOM + 44;
  p.push(`  <text class="mono legend" x="64" y="${ly + 10}">${esc(t.less)}</text>`);
  SCALE.forEach((c, i) => {
    p.push(
      `  <rect x="${140 + i * 22}" y="${ly}" width="14" height="14" fill="${c}"/>`
    );
  });
  p.push(
    `  <text class="mono legend" x="${140 + SCALE.length * 22 + 8}" y="${ly + 10}">${esc(t.more)}</text>`
  );
  p.push(
    `  <text class="sans foot" x="${W - 64}" y="${ly + 11}" text-anchor="end">${esc(t.foot)}</text>`
  );

  p.push(`</svg>`);
  return p.join("\n") + "\n";
}

const ES = {
  title: "Actividad · Mateo Pereyra",
  eyebrow: "ACTIVIDAD · ULTIMOS 12 MESES",
  kTotal: "CONTRIBUCIONES",
  kCurrent: "RACHA ACTUAL",
  kLongest: "RACHA MAS LARGA",
  kBusiest: "DIA MAS ACTIVO",
  days: "días",
  months: ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"],
  mon: "LUN", wed: "MIE", fri: "VIE",
  less: "MENOS", more: "MAS",
  foot: "Se genera solo, todos los días, desde la API de GitHub",
  aria: (t, c, l, b) =>
    `Actividad de los ultimos 12 meses: ${t} contribuciones, racha actual de ${c} dias, racha mas larga de ${l} dias y un pico de ${b} contribuciones en un dia.`,
};

const EN = {
  title: "Activity · Mateo Pereyra",
  eyebrow: "ACTIVITY · LAST 12 MONTHS",
  kTotal: "CONTRIBUTIONS",
  kCurrent: "CURRENT STREAK",
  kLongest: "LONGEST STREAK",
  kBusiest: "BUSIEST DAY",
  days: "days",
  months: ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"],
  mon: "MON", wed: "WED", fri: "FRI",
  less: "LESS", more: "MORE",
  foot: "Regenerated every day from the GitHub API",
  aria: (t, c, l, b) =>
    `Activity over the last 12 months: ${t} contributions, a current streak of ${c} days, a longest streak of ${l} days and a peak of ${b} contributions in one day.`,
};

mkdirSync("assets", { recursive: true });
writeFileSync("assets/pulse.svg", build(ES));
writeFileSync("assets/pulse-en.svg", build(EN));

console.log(
  `total=${total} racha=${current} maxracha=${longest} pico=${busiest} semanas=${weeks.length} pitch=${pitch}`
);

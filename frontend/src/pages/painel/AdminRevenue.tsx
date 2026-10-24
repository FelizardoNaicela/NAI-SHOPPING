import { useEffect, useState } from "react";
import { Download, FileText, Wallet } from "lucide-react";

import PanelSection from "../../components/panel/PanelSection";
import {
  getRevenueStats,
  type RevenueStats,
} from "../../services/adminRevenue";

import styles from "./AdminRevenue.module.css";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const TYPES = [
  { key: "verification", label: "Verificações", color: "#3b82f6" },
  { key: "promotion", label: "Promoções", color: "#e08a2e" },
  { key: "nationalRanking", label: "Ranking nacional", color: "#7c5ce6" },
  { key: "other", label: "Outros", color: "#94a3b8" },
] as const;

function money(value: number, currency: string) {
  return `${value.toLocaleString("pt-MZ", {
    maximumFractionDigits: 2,
  })} ${currency}`;
}

// ---------------------------------------------------------
// Relatório (abre numa janela; "Guardar como PDF" na impressão)
// ---------------------------------------------------------

function buildReportHtml(data: RevenueStats) {
  const max = Math.max(1, ...data.months.map(m => m.total));

  const W = 720;
  const H = 240;
  const base = H - 30;
  const slot = W / 12;
  const barW = slot * 0.6;

  const bars = data.months
    .map((m, i) => {
      let y = base;
      const x = i * slot + (slot - barW) / 2;

      const segs = TYPES.map(t => {
        const h = (m[t.key] / max) * (base - 10);
        y -= h;
        return h > 0
          ? `<rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="${t.color}"/>`
          : "";
      }).join("");

      return `${segs}<text x="${x + barW / 2}" y="${H - 10}" font-size="11" text-anchor="middle" fill="#555">${MONTHS[i].slice(0, 3)}</text>`;
    })
    .join("");

    const regionRows = data.byRegion
  .map(
    r => `<tr>
      <td>${r.region}</td>
      <td>${r.count}</td>
      <td>${money(r.verification, data.currency)}</td>
      <td>${money(r.promotion, data.currency)}</td>
      <td>${money(r.nationalRanking, data.currency)}</td>
      <td>${money(r.other, data.currency)}</td>
      <td><b>${money(r.total, data.currency)}</b></td>
    </tr>`,
  )
  .join("");

  const rows = data.months
    .map(
      m => `<tr>
        <td>${MONTHS[m.month - 1]}</td>
        <td>${m.count}</td>
        <td>${money(m.verification, data.currency)}</td>
        <td>${money(m.promotion, data.currency)}</td>
        <td>${money(m.nationalRanking, data.currency)}</td>
        <td>${money(m.other, data.currency)}</td>
        <td><b>${money(m.total, data.currency)}</b></td>
      </tr>`,
    )
    .join("");

  const legend = TYPES.map(
    t =>
      `<span><i style="background:${t.color}"></i>${t.label}: <b>${money(
        data.byType[t.key],
        data.currency,
      )}</b></span>`,
  ).join("");

  const generated = new Date().toLocaleString("pt-MZ");

  return `<!doctype html>
<html lang="pt"><head><meta charset="utf-8"/>
<title>Relatório de ganhos ${data.year}</title>
<style>
  body{font-family:system-ui,"Segoe UI",Roboto,Arial,sans-serif;color:#17191d;margin:32px}
  h1{margin:0 0 4px;font-size:24px} h2{font-size:16px;margin:28px 0 10px}
  .meta{color:#666;font-size:12px}
  .total{margin:18px 0;padding:16px;border:1px solid #ddd;border-radius:10px}
  .total b{font-size:28px;display:block;margin-top:4px}
  .legend{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:12px;margin-top:8px}
  .legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th,td{padding:7px 8px;border-bottom:1px solid #e5e5e5;text-align:right}
  th:first-child,td:first-child{text-align:left}
  thead th{background:#f4f5f7;font-size:11px;text-transform:uppercase}
  tfoot td{font-weight:700;border-top:2px solid #999;background:#f4f5f7}
  @media print{body{margin:12mm}}
</style></head><body>
  <h1>Relatório de ganhos ${data.year}</h1>
  <div class="meta">Apenas pagamentos confirmados · Gerado em ${generated}</div>

  <div class="total">Total do ano<b>${money(data.total, data.currency)}</b>
    <span class="meta">${data.paymentsCount} pagamento(s) confirmado(s)</span>
  </div>

  <h2>Ganhos por mês</h2>
  <svg viewBox="0 0 ${W} ${H}" width="100%">
    <line x1="0" y1="${base}" x2="${W}" y2="${base}" stroke="#bbb"/>
    ${bars}
  </svg>
  <div class="legend">${legend}</div>

  <h2>Detalhe mensal</h2>
  <table>
    <thead><tr>
      <th>Mês</th><th>Pagamentos</th><th>Verificações</th><th>Promoções</th>
      <th>Ranking</th><th>Outros</th><th>Total</th>
    </tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr>
      <td>Total</td><td>${data.paymentsCount}</td>
      <td>${money(data.byType.verification, data.currency)}</td>
      <td>${money(data.byType.promotion, data.currency)}</td>
      <td>${money(data.byType.nationalRanking, data.currency)}</td>
      <td>${money(data.byType.other, data.currency)}</td>
      <td>${money(data.total, data.currency)}</td>
    </tr></tfoot>
  </table>

  <h2>Ganhos por região</h2>
<table>
  <thead><tr>
    <th>Região</th><th>Pagamentos</th><th>Verificações</th><th>Promoções</th>
    <th>Ranking</th><th>Outros</th><th>Total</th>
  </tr></thead>
  <tbody>${regionRows}</tbody>
</table>
  <script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
</body></html>`;
}

function openReport(data: RevenueStats) {
  const win = window.open("", "_blank");

  if (!win) {
    alert("O navegador bloqueou a janela. Permita pop-ups para gerar o relatório.");
    return;
  }

  win.document.open();
  win.document.write(buildReportHtml(data));
  win.document.close();
}

function downloadCsv(data: RevenueStats) {
  const head = [
    "Mês", "Pagamentos", "Verificações", "Promoções",
    "Ranking nacional", "Outros", "Total", "Moeda",
  ];

  const lines = data.months.map(m =>
    [
      MONTHS[m.month - 1], m.count, m.verification, m.promotion,
      m.nationalRanking, m.other, m.total, data.currency,
    ].join(";"),
  );

  lines.push(
    [
      "Total", data.paymentsCount, data.byType.verification,
      data.byType.promotion, data.byType.nationalRanking,
      data.byType.other, data.total, data.currency,
    ].join(";"),
  );

  // BOM para o Excel reconhecer os acentos
  const blob = new Blob(["\uFEFF" + [head.join(";"), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });

  lines.push("");
lines.push(["Região", "Pagamentos", "Verificações", "Promoções", "Ranking nacional", "Outros", "Total", "Moeda"].join(";"));

data.byRegion.forEach(r =>
  lines.push(
    [r.region, r.count, r.verification, r.promotion, r.nationalRanking, r.other, r.total, data.currency].join(";"),
  ),
);

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `ganhos-${data.year}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------
// Componente
// ---------------------------------------------------------

export default function AdminRevenue() {
  const [year, setYear] = useState<number | undefined>(undefined);
  const [region, setRegion] = useState("");
  const [data, setData] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const result = await getRevenueStats(year, region || undefined);


        if (!cancelled) {
          setData(result);
        }
      } catch (err: any) {

        if (!cancelled) {
          setError(
            err?.response?.data?.message ??
              "Não foi possível carregar os ganhos.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [year, region]);

  const currency = data?.currency ?? "MZN";
  const max = Math.max(1, ...(data?.months.map(m => m.total) ?? [1]));

  const best = data
    ? data.months.reduce((a, b) => (b.total > a.total ? b : a), data.months[0])
    : null;

  const monthsWithRevenue = data
    ? data.months.filter(m => m.total > 0).length
    : 0;

  const average =
    data && monthsWithRevenue > 0 ? data.total / monthsWithRevenue : 0;

  return (
    <PanelSection
      title="Ganhos da plataforma"
      description="Total recebido e estatísticas por mês (apenas pagamentos confirmados)."
      icon={<Wallet size={20} strokeWidth={1.9} />}
      storageKey="adminPanel:revenue"
      summary={data ? money(data.total, currency) : undefined}
    >
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <label className={styles.label} htmlFor="revenue-year">
            Ano
          </label>

          <select
            id="revenue-year"
            className={styles.select}
            value={data?.year ?? ""}
            onChange={event => setYear(Number(event.target.value))}
            disabled={!data}
          >
            {(data?.availableYears ?? []).map(y => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <label className={styles.label} htmlFor="revenue-region">
  Região
</label>

<select
  id="revenue-region"
  className={styles.select}
  value={region}
  onChange={event => setRegion(event.target.value)}
  disabled={!data}
>
  <option value="">Todas as regiões</option>

  {(data?.byRegion ?? []).map(r => (
    <option key={r.region} value={r.region}>
      {r.region}
    </option>
  ))}
</select>
        </div>

        <div className={styles.toolbarGroup}>
          <button
            type="button"
            className={styles.btn}
            disabled={!data}
            onClick={() => data && downloadCsv(data)}
          >
            <Download size={15} />
            CSV
          </button>

          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={!data}
            onClick={() => data && openReport(data)}
          >
            <FileText size={15} />
            Relatório PDF
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading && !data && <div className={styles.state}>A carregar...</div>}

      {data && (
        <>
          <div className={styles.stats}>
            <div className={`${styles.card} ${styles.cardHighlight}`}>
              <span className={styles.cardLabel}>Total em {data.year}</span>
              <strong className={styles.cardValue}>
                {money(data.total, currency)}
              </strong>
              <span className={styles.cardHint}>
                {data.paymentsCount} pagamento
                {data.paymentsCount === 1 ? "" : "s"} confirmado
                {data.paymentsCount === 1 ? "" : "s"}
              </span>
            </div>

            <div className={styles.card}>
              <span className={styles.cardLabel}>Melhor mês</span>
              <strong className={styles.cardValue}>
                {best && best.total > 0 ? MONTHS[best.month - 1] : "—"}
              </strong>
              <span className={styles.cardHint}>
                {best && best.total > 0 ? money(best.total, currency) : ""}
              </span>
            </div>

            <div className={styles.card}>
              <span className={styles.cardLabel}>Média mensal</span>
              <strong className={styles.cardValue}>
                {money(average, currency)}
              </strong>
              <span className={styles.cardHint}>
                Meses com ganhos: {monthsWithRevenue}
              </span>
            </div>

            <div className={styles.card}>
  <span className={styles.cardLabel}>Maior região</span>
  <strong className={styles.cardValue}>
    {data.byRegion[0] && data.byRegion[0].total > 0
      ? data.byRegion[0].region
      : "—"}
  </strong>
  <span className={styles.cardHint}>
    {data.byRegion[0] ? money(data.byRegion[0].total, currency) : ""}
  </span>
</div>
          </div>

          <div className={styles.chartBox}>
            <h3 className={styles.chartTitle}>Ganhos por mês</h3>

            <div className={styles.chart}>
              {data.months.map(m => (
                <div
                  key={m.month}
                  className={styles.col}
                  title={`${MONTHS[m.month - 1]}: ${money(m.total, currency)}`}
                >
                  <div
                    className={styles.stack}
                    style={{ height: `${(m.total / max) * 100}%` }}
                  >
                    {TYPES.map(t =>
                      m[t.key] > 0 ? (
                        <div
                          key={t.key}
                          className={styles.seg}
                          style={{
                            height: `${(m[t.key] / m.total) * 100}%`,
                            background: t.color,
                          }}
                        />
                      ) : null,
                    )}
                  </div>

                  <span className={styles.colLabel}>
                    {MONTHS[m.month - 1].slice(0, 3)}
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.legend}>
              {TYPES.map(t => (
                <span key={t.key}>
                  <i className={styles.dot} style={{ background: t.color }} />
                  {t.label}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mês</th>
                  <th>Pagamentos</th>
                  <th>Verificações</th>
                  <th>Promoções</th>
                  <th>Ranking</th>
                  <th>Outros</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                {data.months.map(m => (
                  <tr key={m.month} className={m.total === 0 ? styles.muted : ""}>
                    <td>{MONTHS[m.month - 1]}</td>
                    <td>{m.count}</td>
                    <td>{money(m.verification, currency)}</td>
                    <td>{money(m.promotion, currency)}</td>
                    <td>{money(m.nationalRanking, currency)}</td>
                    <td>{money(m.other, currency)}</td>
                    <td>
                      <strong>{money(m.total, currency)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr>
                  <td>Total</td>
                  <td>{data.paymentsCount}</td>
                  <td>{money(data.byType.verification, currency)}</td>
                  <td>{money(data.byType.promotion, currency)}</td>
                  <td>{money(data.byType.nationalRanking, currency)}</td>
                  <td>{money(data.byType.other, currency)}</td>
                  <td>{money(data.total, currency)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className={styles.chartBox}>
  <h3 className={styles.chartTitle}>Ganhos por região ({data.year})</h3>

  {data.byRegion.length === 0 ? (
    <div className={styles.state}>Sem ganhos neste ano.</div>
  ) : (
    <div className={styles.regionList}>
      {data.byRegion.map(r => {
        const all = data.byRegion.reduce((s, x) => s + x.total, 0) || 1;
        const share = (r.total / all) * 100;

        return (
          <button
            key={r.region}
            type="button"
            className={`${styles.regionRow} ${
              region === r.region ? styles.regionRowActive : ""
            }`}
            onClick={() => setRegion(region === r.region ? "" : r.region)}
            title="Clicar para filtrar por esta região"
          >
            <span className={styles.regionName}>{r.region}</span>

            <span className={styles.regionBar}>
              <span style={{ width: `${share}%` }} />
            </span>

            <span className={styles.regionValue}>
              {money(r.total, currency)}
              <small>
                {share.toFixed(0)}% · {r.count} pag.
              </small>
            </span>
          </button>
        );
      })}
    </div>
  )}
</div>
        </>
      )}
    </PanelSection>
  );
}
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function renderFilters(filters = []) {
  const activeFilters = filters.filter((item) => item.value)

  if (!activeFilters.length) {
    return '<p class="filters">Filtros: nenhum filtro aplicado</p>'
  }

  return `<p class="filters">Filtros: ${activeFilters
    .map((item) => `${escapeHtml(item.label)}: ${escapeHtml(item.value)}`)
    .join(' | ')}</p>`
}

function renderTable(columns = [], rows = []) {
  return `
    <table>
      <thead>
        <tr>
          ${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${
          rows.length
            ? rows
                .map(
                  (row) => `
                    <tr>
                      ${columns
                        .map((column) => `<td>${escapeHtml(column.render(row))}</td>`)
                        .join('')}
                    </tr>
                  `,
                )
                .join('')
            : `<tr><td colspan="${columns.length}">Nenhum registro encontrado.</td></tr>`
        }
      </tbody>
    </table>
  `
}

function renderTotals(totals = []) {
  const visibleTotals = totals.filter((item) => item.value !== undefined)

  if (!visibleTotals.length) {
    return ''
  }

  return `
    <section class="totals">
      ${visibleTotals
        .map(
          (item) => `
            <div>
              <span>${escapeHtml(item.label)}</span>
              <strong>${escapeHtml(item.value)}</strong>
            </div>
          `,
        )
        .join('')}
    </section>
  `
}

export function printReport({
  title,
  subtitle,
  filters = [],
  columns = [],
  rows = [],
  totals = [],
}) {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer')

  if (!printWindow) {
    throw new Error('Nao foi possivel abrir a janela de impressao.')
  }

  const emittedAt = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date())

  printWindow.document.write(`
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          @page { margin: 16mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            color: #17251c;
            font-family: Arial, sans-serif;
            font-size: 12px;
          }
          header {
            border-bottom: 2px solid #1f5137;
            margin-bottom: 14px;
            padding-bottom: 10px;
          }
          h1 {
            margin: 0;
            font-size: 22px;
          }
          .subtitle,
          .filters,
          .emitted {
            margin: 5px 0 0;
            color: #52665a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th,
          td {
            border: 1px solid #d7e1d8;
            padding: 7px 8px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background: #edf5ee;
            color: #1f5137;
            font-size: 11px;
            text-transform: uppercase;
          }
          tbody tr:nth-child(even) td {
            background: #f8fbf8;
          }
          .totals {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 8px;
            margin-top: 12px;
          }
          .totals div {
            border: 1px solid #d7e1d8;
            padding: 9px;
            background: #f8fbf8;
          }
          .totals span {
            display: block;
            color: #52665a;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .totals strong {
            display: block;
            margin-top: 4px;
            color: #17251c;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <header>
          <h1>${escapeHtml(title)}</h1>
          ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ''}
          ${renderFilters(filters)}
          <p class="emitted">Emitido em ${escapeHtml(emittedAt)}</p>
        </header>
        ${renderTable(columns, rows)}
        ${renderTotals(totals)}
        <script>
          window.addEventListener('load', function () {
            window.print();
          });
        </script>
      </body>
    </html>
  `)
  printWindow.document.close()
}

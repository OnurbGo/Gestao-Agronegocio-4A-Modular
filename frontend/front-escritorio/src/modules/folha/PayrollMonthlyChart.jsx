import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

const chartConfig = {
  bruto: {
    label: 'Bruto',
    color: '#2563eb',
  },
  liquido: {
    label: 'Líquido',
    color: '#16a34a',
  },
  final: {
    label: 'Final',
    color: '#0f766e',
  },
}

const dinheiroCompacto = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

const dinheiro = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function numero(value) {
  if (value === '' || value === null || value === undefined) return 0
  const parsed = Number(String(value).replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

function PayrollMonthlyChart({ relatorio }) {
  const data = (relatorio?.itens || []).map((item) => ({
    nome: item.entidade?.nome || 'Sem nome',
    bruto: numero(item.salario_bruto),
    liquido: numero(item.salario_liquido),
    final: numero(item.salario_liquido_com_desconto),
  }))

  return (
    <section className="monthly-chart-panel no-print">
      <div className="panel-heading">
        <h2>Gráfico mensal</h2>
        <span>{data.length}</span>
      </div>

      {data.length ? (
        <ChartContainer
          className="h-[360px] w-full"
          config={chartConfig}
          id="payroll-monthly"
        >
          <BarChart data={data} margin={{ left: 12, right: 12, top: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              angle={-18}
              axisLine={false}
              dataKey="nome"
              height={82}
              interval={0}
              textAnchor="end"
              tickLine={false}
              tickMargin={12}
            />
            <YAxis
              axisLine={false}
              tickFormatter={(value) => dinheiroCompacto.format(value)}
              tickLine={false}
              tickMargin={10}
              width={92}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  valueFormatter={(value) => dinheiro.format(numero(value))}
                />
              }
              cursor={false}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="bruto"
              fill={chartConfig.bruto.color}
              name={chartConfig.bruto.label}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="liquido"
              fill={chartConfig.liquido.color}
              name={chartConfig.liquido.label}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="final"
              fill={chartConfig.final.color}
              name={chartConfig.final.label}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      ) : (
        <p className="empty-state">Nenhum lançamento no período.</p>
      )}
    </section>
  )
}

export default PayrollMonthlyChart

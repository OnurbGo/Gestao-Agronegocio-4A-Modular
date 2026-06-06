import * as React from 'react'
import {
  Legend,
  ResponsiveContainer,
  Tooltip,
  type LegendPayload,
  type TooltipContentProps,
  type TooltipPayloadEntry,
  type TooltipValueType,
} from 'recharts'
import { cn } from '@/utils/cn'

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode
    color?: string
  }
>

type ChartContextValue = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextValue | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error('useChart must be used within a ChartContainer')
  }

  return context
}

function hasStringValue(
  payload: unknown,
  key: string,
): payload is Record<string, string> {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    key in payload &&
    typeof (payload as Record<string, unknown>)[key] === 'string'
  )
}

function getNestedPayload(payload: unknown): Record<string, unknown> | undefined {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'payload' in payload &&
    typeof payload.payload === 'object' &&
    payload.payload !== null
  ) {
    return payload.payload as Record<string, unknown>
  }

  return undefined
}

function getPayloadConfig(
  config: ChartConfig,
  payload: unknown,
  key: string,
) {
  if (typeof payload !== 'object' || payload === null) {
    return undefined
  }

  const payloadPayload = getNestedPayload(payload)

  let configLabelKey = key

  if (hasStringValue(payload, key)) {
    configLabelKey = payload[key]
  } else if (
    payloadPayload &&
    hasStringValue(payloadPayload, key)
  ) {
    configLabelKey = payloadPayload[key]
  }

  return configLabelKey in config ? config[configLabelKey] : config[key]
}

export interface ChartContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          'flex aspect-video justify-center text-xs text-slate-600 [&_.recharts-cartesian-axis-tick_text]:fill-slate-500 [&_.recharts-cartesian-grid_line]:stroke-slate-200 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-slate-200 [&_.recharts-layer]:outline-none [&_.recharts-radial-bar-background-sector]:fill-slate-100 [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-slate-100 [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none',
          className,
        )}
        {...props}
      >
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = 'ChartContainer'

const ChartTooltip = Tooltip
const ChartLegend = Legend

export interface ChartTooltipContentProps
  extends Partial<TooltipContentProps<TooltipValueType, string>> {
  className?: string
  indicator?: 'dot' | 'line' | 'dashed'
  hideLabel?: boolean
  hideIndicator?: boolean
  valueFormatter?: (
    value: TooltipPayloadEntry<TooltipValueType, string>['value'],
    name: string | number | undefined,
  ) => React.ReactNode
}

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(
  (
    {
      active,
      payload,
      className,
      indicator = 'dot',
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      valueFormatter,
    },
    ref,
  ) => {
    const { config } = useChart()

    if (!active || !payload?.length) {
      return null
    }

    const nestedLabel = payload.length === 1 && indicator !== 'dot'
    const firstItem = payload[0]
    const firstKey = `${firstItem?.dataKey || firstItem?.name || 'value'}`
    const firstConfig = getPayloadConfig(config, firstItem, firstKey)
    const labelValue =
      !label && typeof firstConfig?.label === 'string' ? firstConfig.label : label
    const displayLabel = (() => {
      if (hideLabel || !labelValue) {
        return null
      }

      if (labelFormatter) {
        return (
          <div className="font-semibold text-slate-900">
            {labelFormatter(labelValue, payload)}
          </div>
        )
      }

      return <div className="font-semibold text-slate-900">{labelValue}</div>
    })()

    return (
      <div
        ref={ref}
        className={cn(
          'grid min-w-40 gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-xl',
          className,
        )}
      >
        {!nestedLabel ? displayLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item) => {
            const key = `${item.name || item.dataKey || 'value'}`
            const itemConfig = getPayloadConfig(config, item, key)
            const nestedPayload = getNestedPayload(item)
            const color =
              item.color ||
              (typeof nestedPayload?.fill === 'string' ? nestedPayload.fill : undefined) ||
              itemConfig?.color

            return (
              <div
                key={`${item.dataKey || item.name || item.value || 'value'}`}
                className={cn(
                  'flex w-full flex-wrap items-stretch gap-2',
                  nestedLabel ? 'items-center' : '',
                )}
              >
                {!hideIndicator ? (
                  <div
                    className={cn(
                      'shrink-0 rounded-[2px] border-[var(--color-border)] bg-[var(--color-bg)]',
                      indicator === 'dot' && 'mt-1 h-2.5 w-2.5 rounded-full',
                      indicator === 'line' && 'w-1',
                      indicator === 'dashed' && 'w-0 border-[1.5px] border-dashed bg-transparent',
                    )}
                    style={{
                      '--color-bg': color,
                      '--color-border': color,
                    } as React.CSSProperties}
                  />
                ) : null}
                <div className="flex flex-1 justify-between gap-4 leading-none">
                  <div className="grid gap-1.5">
                    {nestedLabel ? displayLabel : null}
                    <span className="text-slate-600">
                      {itemConfig?.label || item.name}
                    </span>
                  </div>
                  {item.value !== undefined ? (
                    <span className="font-mono font-semibold text-slate-950">
                      {valueFormatter
                        ? valueFormatter(item.value, item.name)
                        : item.value}
                    </span>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  },
)
ChartTooltipContent.displayName = 'ChartTooltipContent'

export interface ChartLegendContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  payload?: LegendPayload[]
  verticalAlign?: 'top' | 'bottom'
}

const ChartLegendContent = React.forwardRef<HTMLDivElement, ChartLegendContentProps>(
  ({ className, payload, verticalAlign = 'bottom' }, ref) => {
  const { config } = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-center gap-4',
        verticalAlign === 'top' ? 'pb-3' : 'pt-3',
        className,
      )}
    >
      {payload.map((item) => {
        const key = `${item.dataKey || 'value'}`
        const itemConfig = getPayloadConfig(config, item, key)

        return (
          <div
            key={`${item.value}`}
            className="flex items-center gap-1.5 text-xs text-slate-600"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: item.color }}
            />
            {itemConfig?.label || item.value}
          </div>
        )
      })}
    </div>
  )
})
ChartLegendContent.displayName = 'ChartLegendContent'

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
}

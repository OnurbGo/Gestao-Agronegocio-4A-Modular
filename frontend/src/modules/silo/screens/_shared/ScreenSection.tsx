import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'

type ScreenSectionProps = {
  title?: string
  children: ReactNode
  actions?: ReactNode
  className?: string
}

function ScreenSection({
  title,
  children,
  actions,
  className = '',
}: ScreenSectionProps) {
  return (
    <Card className={className}>
      {title || actions ? (
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {title ? <CardTitle>{title}</CardTitle> : <span />}
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </CardHeader>
      ) : null}
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export default ScreenSection

import React from 'react'

import { cn } from '../../utils/class-utils.js'
import { Card, CardContent, CardHeader, CardTitle } from './card.js'

export function SimpleCard({
  action,
  className,
  content,
  contentClasses,
  headerClasses,
  title,
}: {
  action?: React.ReactNode
  className?: string
  content: React.ReactNode
  contentClasses?: string
  headerClasses?: string
  title: string
}) {
  return (
    <Card className={cn(className)}>
      <CardHeader action={action} className={cn('sm:tw-min-h-[71px]', headerClasses)}>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className={cn(contentClasses)}>{content}</CardContent>
    </Card>
  )
}

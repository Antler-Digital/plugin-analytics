'use client'

import React from 'react'

import { cn } from '../../utils/class-utils.js'
import { Card, CardContent, CardHeader, CardTitle } from './card.js'
import { Popover, PopoverContent, PopoverTrigger } from './popover.js'
import { InfoIcon } from 'lucide-react'

export function SimpleCard({
  action,
  className,
  content,
  contentClasses,
  headerClasses,
  title,
  info,
}: {
  action?: React.ReactNode
  className?: string
  content: React.ReactNode
  contentClasses?: string
  headerClasses?: string
  info?: {
    body: React.ReactNode
    title: string
  }
  title: string
}) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Card className={cn(className)}>
      <CardHeader action={action} className={cn('sm:tw-min-h-[71px]', headerClasses)}>
        <div className="tw-flex tw-flex-row tw-items-center tw-gap-x-2">
          <CardTitle>{title}</CardTitle>
          {info ? (
            <Popover onOpenChange={setIsOpen} open={isOpen}>
              <PopoverTrigger className="tw-bg-transparent tw-border-none">
                <InfoIcon className="tw-w-4 tw-h-4" />
              </PopoverTrigger>
              <PopoverContent className="">
                <div className="tw-text-base tw-font-medium">{info.title}</div>
                <p
                  className="tw-text-sm tw-w-72 !tw-max-w-72"
                  style={{
                    maxWidth: '200px',
                  }}
                >
                  {info.body}
                </p>
              </PopoverContent>
            </Popover>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className={cn(contentClasses)}>{content}</CardContent>
    </Card>
  )
}

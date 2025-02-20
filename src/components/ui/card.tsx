import * as React from 'react'

import { cn } from '../../utils/class-utils.js'

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      className={cn(
        'tw-rounded tw-border tw-border-zinc-800 tw-bg-card tw-text-card-foreground tw-shadow',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  {
    action?: React.ReactNode
  } & React.HTMLAttributes<HTMLDivElement>
>(({ action, children, className, ...props }, ref) => (
  <div
    className={cn(
      'tw-flex tw-flex-col sm:tw-flex-row tw-justify-between tw-items-start sm:tw-items-center tw-space-y-1.5 tw-p-6',
      className,
    )}
    ref={ref}
    {...props}
  >
    <div>{children}</div>
    {action && <div className="">{action}</div>}
  </div>
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      className={cn('tw-font-bold tw-leading-none tw-tracking-tight', className)}
      ref={ref}
      {...props}
    />
  ),
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div className={cn('tw-text-sm tw-text-muted-foreground', className)} ref={ref} {...props} />
  ),
)
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div className={cn('tw-p-6 tw-pt-0', className)} ref={ref} {...props} />
  ),
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div className={cn('tw-flex tw-items-center tw-p-6 tw-pt-0', className)} ref={ref} {...props} />
  ),
)
CardFooter.displayName = 'CardFooter'

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle }

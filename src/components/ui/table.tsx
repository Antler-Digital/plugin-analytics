import * as React from 'react'

import { cn } from '../../utils/class-utils.js'

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="tw-relative tw-w-full tw-overflow-auto">
      <table
        className={cn('tw-w-full tw-caption-bottom tw-text-sm', className)}
        ref={ref}
        {...props}
      />
    </div>
  ),
)
Table.displayName = 'Table'

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead className={cn('[&_tr]:tw-border-b', className)} ref={ref} {...props} />
))
TableHeader.displayName = 'TableHeader'

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody className={cn('[&_tr:last-child]:tw-border-0', className)} ref={ref} {...props} />
))
TableBody.displayName = 'TableBody'

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    className={cn('tw-border-t tw-bg-muted/50 tw-font-medium [&>tr]:tw-last:border-b-0', className)}
    ref={ref}
    {...props}
  />
))
TableFooter.displayName = 'TableFooter'

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      className={cn(
        'tw-transition-colors hover:tw-bg-muted/50 data-[state=selected]:tw-bg-muted',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
)
TableRow.displayName = 'TableRow'

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    className={cn(
      'tw-h-10 tw-px-2 tw-text-left tw-align-middle tw-font-medium tw-text-muted-foreground [&:has([role=checkbox])]:tw-pr-0 [&>[role=checkbox]]:tw-translate-y-[2px]',
      className,
    )}
    ref={ref}
    {...props}
  />
))
TableHead.displayName = 'TableHead'

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    className={cn(
      'tw-p-2 tw-align-middle [&:has([role=checkbox])]:tw-pr-0 [&>[role=checkbox]]:tw-translate-y-[2px]',
      className,
    )}
    ref={ref}
    {...props}
  />
))
TableCell.displayName = 'TableCell'

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    className={cn('tw-mt-4 tw-text-sm tw-text-muted-foreground', className)}
    ref={ref}
    {...props}
  />
))
TableCaption.displayName = 'TableCaption'

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow }

import React from 'react'

import type { DashboardData } from '../../../actions/get-dashboard-stats.js'

import { SeeAllModal } from '../../modals/see-all-modal.js'
import { SimpleCard } from '../../ui/simple-card.js'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table.js'

export function UTMTrackingCard({ utm_tracking }: { utm_tracking: DashboardData['utm_tracking'] }) {
  const columns = ['Campaign', 'Source', 'Medium', 'Visitors']
  let tableBody: React.ReactNode
  if (!utm_tracking?.length) {
    tableBody = (
      <TableBody className="tw-pointer-events-none">
        <TableRow className="tw-hover:bg-transparent tw-dark:hover:bg-transparent">
          <TableCell className="tw-text-center tw-h-[489px] tw-text-xl" colSpan={columns.length}>
            No results
          </TableCell>
        </TableRow>
      </TableBody>
    )
  } else {
    tableBody = (
      <TableBody>
        {utm_tracking.map(({ campaign, medium, source, visitors }, index) => (
          <TableRow key={index}>
            <TableCell>{campaign}</TableCell>
            <TableCell>{source}</TableCell>
            <TableCell>{medium}</TableCell>
            <TableCell>{visitors}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    )
  }

  return (
    <SimpleCard
      action={<SeeAllModal table="utm-tracking" />}
      className="tw-w-full sm:tw-w-1/2"
      content={
        <Table>
          <TableHeader className="tw-border-b tw-border-b-zinc-600">
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          {tableBody}
        </Table>
      }
      headerClasses="!tw-flex-row !tw-items-center"
      title="UTM Tracking"
    />
  )
}

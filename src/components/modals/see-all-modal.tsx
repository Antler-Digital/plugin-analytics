'use client'
import type { ColumnDef } from '@tanstack/react-table'

import { ArrowRight } from 'lucide-react'
// @ts-ignore
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React from 'react'

import PaginatedTable from '../ui/analytics-cards/modal-table.js'
import { Button } from '../ui/button.js'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog.js'

interface SeeAllModalProps {
  buttonText?: string
  description?: string
  table: string
  title?: string
}

interface DataItem {
  email: string
  id: string
  name: string
  // Add other fields as needed
}

const tables: Record<
  string,
  { columns: ColumnDef<DataItem>[]; description: string; title: string }
> = {
  browsers: {
    columns: [
      {
        accessorKey: 'browser',
        header: 'Browser',
      },
      {
        accessorKey: 'value',
        header: 'Visitors',
      },
    ],
    description: 'View detailed analytics for all your browsers',
    title: 'Browsers',
  },
  devices: {
    columns: [
      {
        accessorKey: 'device_type',
        header: 'Device',
      },
      {
        accessorKey: 'value',
        header: 'Visitors',
      },
    ],
    description: 'View detailed analytics for all your devices',
    title: 'Devices',
  },
  'operating-systems': {
    columns: [
      {
        accessorKey: 'os',
        header: 'Operating System',
      },
      {
        accessorKey: 'value',
        header: 'Visitors',
      },
    ],
    description: 'View detailed analytics for all your operating systems',
    title: 'Operating Systems',
  },
  'top-pages': {
    columns: [
      {
        accessorKey: 'path',
        header: 'Path',
      },
      {
        accessorKey: 'value',
        header: 'Value',
        size: 50,
      },
    ],
    description: 'View detailed analytics for all your pages',
    title: 'Top Pages',
  },
  'top-referrers': {
    columns: [
      {
        accessorKey: 'referrer_url',
        header: 'Referrers',
      },
      {
        accessorKey: 'value',
        header: 'Value',
        size: 50,
      },
    ],
    description: 'View detailed analytics for all your referrers',
    title: 'Top Referrers',
  },
  'utm-tracking': {
    columns: [
      {
        accessorKey: 'campaign',
        header: 'Campaign',
      },
      {
        accessorKey: 'source',
        header: 'Source',
      },
      {
        accessorKey: 'medium',
        header: 'Medium',
      },
      {
        accessorKey: 'visitors',
        header: 'Visitors',
      },
    ],
    description: 'View detailed analytics for all your UTM tracking',
    title: 'UTM Tracking',
  },
}

export function SeeAllModal({ buttonText = 'See all', table }: SeeAllModalProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const tableData = tables[table]

  if (!tableData) {
    return null
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        // remove page and limit from url when modal is closed
        if (!open) {
          const params = new URLSearchParams(searchParams)
          params.delete('page')
          params.delete('limit')
          router.push(pathname + '?' + params.toString(), { scroll: false })
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost">
          {buttonText} <ArrowRight className="tw-ml-1 tw-w-4 tw-h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="tw-h-full sm:tw-h-auto sm:tw-min-h-[540px]">
        <DialogHeader className="DialogHeader">
          <DialogTitle className="tw-text-3xl">{tableData.title}</DialogTitle>
          <DialogDescription>{tableData.description}</DialogDescription>
        </DialogHeader>
        <PaginatedTable<DataItem> columns={tableData.columns} name={table} />
        <DialogFooter />
      </DialogContent>
    </Dialog>
  )
}

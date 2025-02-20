'use client'

import type { ColumnDef, PaginationState } from '@tanstack/react-table'
import type { ReactNode } from 'react'

import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { LoaderCircle } from 'lucide-react'
// @ts-ignore
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import useSWR from 'swr'

import { Button } from '../../ui/button.js'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table.js'

interface TableParams {
  date_from?: string
  date_to?: string
  limit?: string
  page?: string
}

export default function PaginatedTable<DataItem>({
  name,
  columns,
}: {
  columns: ColumnDef<DataItem>[]
  name: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Use extracted function to get params
  const { currentLimit, currentPage, dateFrom } = getTableParams(searchParams)

  // Set up pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: currentPage - 1,
    pageSize: currentLimit,
  })

  // Construct API URL with parameters
  const getApiUrl = (params: TableParams) => {
    const baseUrl = `/api/analytics-events/stats/${name}`
    return createUrl(baseUrl, {
      ...params,
      limit: params.limit?.toString(),
      page: params.page?.toString(),
    }).toString()
  }

  // Fetch data using SWR
  const { data, error, isLoading } = useSWR(
    getApiUrl({
      date_from: dateFrom,
      limit: pagination.pageSize.toString(),
      page: (pagination.pageIndex + 1).toString(),
    }),
    fetcher,
  )

  // Update URL when pagination changes
  useEffect(() => {
    const queryString = updateUrlParams(searchParams, pagination, dateFrom)
    router.push('?' + queryString, { scroll: false })
  }, [pagination, dateFrom])

  // Initialize table
  const table = useReactTable({
    columns,
    data: data?.docs || [],
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    onPaginationChange: setPagination,
    pageCount: data?.totalPages || -1,
    state: {
      pagination,
    },
  })

  if (error) {
    return (
      <div className="tw-text-center py-10 tw-flex tw-items-center tw-justify-center">
        Failed to load data
      </div>
    )
  }

  if (!isLoading && (!data?.docs || data?.docs.length === 0)) {
    return (
      <div className="tw-text-center py-10 tw-flex tw-items-center tw-justify-center">
        No data found
      </div>
    )
  }

  return (
    <div className="tw-space-y-4">
      <div className="tw-rounded-md">
        <Table className="tw-table-fixed ">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.column.columnDef.size }}>
                    {header.column.columnDef.header?.toString()}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="" style={{ height: '300px' }}>
                <TableCell className="tw-w-full tw-h-full" colSpan={2}>
                  <div className="tw-flex tw-items-center tw-justify-center tw-h-full tw-w-full">
                    <LoaderCircle className="tw-animate-spin tw-h-8 tw-w-8" />
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row, i, arr) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{cell.renderValue() as ReactNode}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
            {!isLoading &&
              table.getRowModel().rows.length < DEFAULT_PAGE_SIZE &&
              // Fill remaining space with empty rows
              Array.from({
                length: DEFAULT_PAGE_SIZE - table.getRowModel().rows.length,
              }).map((_, index) => (
                <TableRow key={`empty-${index}`}>
                  {columns.map((_, cellIndex) => (
                    <TableCell key={`empty-${index}-${cellIndex}`}>&nbsp;</TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <div className="tw-flex tw-items-center tw-justify-between tw-space-x-2 tw-py-2">
        <Button
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
          size="sm"
          variant="outline"
        >
          Previous
        </Button>
        <Button
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
          size="sm"
          variant="outline"
        >
          Next
        </Button>
      </div>
      <div className="text-sm text-gray-600">
        Page {table.getState().pagination.pageIndex + 1} of {data?.totalPages || 1}
      </div>
    </div>
  )
}

// Helper function to create URL with parameters
function createUrl(baseUrl: string, params: TableParams) {
  const searchParams = new URLSearchParams()

  // Only add parameters that are defined
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value)
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }
  return res.json()
}

const DEFAULT_PAGE_SIZE = 10

// Extract URL parameter handling
function getTableParams(searchParams: URLSearchParams) {
  return {
    currentLimit: Number(searchParams.get('limit')) || DEFAULT_PAGE_SIZE,
    currentPage: Number(searchParams.get('page')) || 1,
    dateFrom: searchParams.get('date_from') || '',
  }
}

// Extract URL update logic
function updateUrlParams(
  searchParams: URLSearchParams,
  pagination: PaginationState,
  dateFrom: string,
) {
  const newParams = new URLSearchParams(searchParams.toString())
  newParams.set('page', (pagination.pageIndex + 1).toString())
  newParams.set('limit', pagination.pageSize.toString())
  if (dateFrom) {
    newParams.set('date_from', dateFrom)
  }
  return newParams.toString()
}

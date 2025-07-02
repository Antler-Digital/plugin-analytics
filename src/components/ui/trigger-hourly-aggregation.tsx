'use client'
import React, { useState } from 'react'
import { Button } from './button.js'
import { AnalyticsPluginOptions } from '../../types.js'

export function TriggerHourlyAggregationButton({
  pluginOptions,
}: {
  pluginOptions: AnalyticsPluginOptions
}) {
  const [status, setStatus] = useState<string | null>(null)

  async function triggerAggregation() {
    setStatus('Running...')
    try {
      const res = await fetch(
        `/api/${pluginOptions.collectionSlug}-events/trigger-aggregation/hourly`,
        {
          method: 'POST',
        },
      )
      if (res.ok) {
        setStatus('Hourly aggregation triggered!')
      } else {
        setStatus('Failed to trigger hourly aggregation')
      }
    } catch (e) {
      setStatus(`Error: ${String(e)}`)
    }
    setTimeout(() => setStatus(null), 3000)
  }

  return (
    <div className="tw-flex tw-flex-col tw-items-start">
      <Button onClick={triggerAggregation} type="button">
        Trigger Hourly Aggregation
      </Button>
      {status && <span className="tw-mt-1 tw-text-sm tw-text-gray-500">{status}</span>}
    </div>
  )
}

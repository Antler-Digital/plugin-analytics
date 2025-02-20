import React from 'react'

import StatCard from '../../ui/stat-card.js'

export function StatCardBase({
  change,
  label,
  value,
}: {
  change?: number
  label: string
  value?: number
}) {
  try {
    return <StatCard change={change} changeSuffix="%" label={label} value={value} />
  } catch (error) {
    return null
  }
}

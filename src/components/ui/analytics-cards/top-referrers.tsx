import React from 'react'

import type { DashboardData } from '../../../actions/get-dashboard-stats.js'

import ReferrersChart from '../../charts/horizontal-bar-chart.js'
import { SeeAllModal } from '../../modals/see-all-modal.js'
import { SimpleCard } from '../../ui/simple-card.js'

export function TopReferrersCard({ referrers }: { referrers: DashboardData['top_referrers'] }) {
  try {
    return (
      <SimpleCard
        action={<SeeAllModal table="top-referrers" />}
        className="tw-w-full sm:tw-w-1/2"
        content={<ReferrersChart data={referrers} />}
        headerClasses="!tw-flex-row !tw-items-center"
        title="Top Referrers"
      />
    )
  } catch (error) {
    return null
  }
}

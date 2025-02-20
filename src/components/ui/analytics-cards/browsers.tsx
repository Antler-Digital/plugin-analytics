import React from 'react'

import type { DashboardData } from '../../../actions/get-dashboard-stats.js'

import { RadialChart } from '../../charts/radial-chart.js'
import { SeeAllModal } from '../../modals/see-all-modal.js'
import { SimpleCard } from '../../ui/simple-card.js'

export function BrowsersCard({ browsers }: { browsers: DashboardData['browsers'] }) {
  try {
    return (
      <SimpleCard
        action={<SeeAllModal table="browsers" />}
        className="tw-w-full"
        content={
          <div className="tw-flex tw-items-center tw-justify-center tw-h-[200px] tw-w-[200px] tw-mx-auto">
            <RadialChart className="tw-h-full tw-w-full" data={browsers} labelKey="browser" />
          </div>
        }
        contentClasses="!tw-p-0"
        headerClasses="!tw-flex-row !tw-items-center"
        title="Browsers"
      />
    )
  } catch (error) {
    return null
  }
}

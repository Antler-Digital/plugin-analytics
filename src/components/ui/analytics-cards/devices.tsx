import React from 'react'

import type { DashboardData } from '../../../actions/get-dashboard-stats.js'

import { SemiRadialChart } from '../../charts/semi-radial.js'
import { SeeAllModal } from '../../modals/see-all-modal.js'
import { SimpleCard } from '../../ui/simple-card.js'

export function DevicesCard({
  devices,
  totalVisitors,
}: {
  devices: DashboardData['devices']
  totalVisitors: DashboardData['webpage_views']['value']
}) {
  try {
    return (
      <SimpleCard
        action={<SeeAllModal table="devices" />}
        className="tw-w-full"
        content={
          <div className="tw-flex tw-items-center tw-justify-center tw-h-[250px] tw-mx-auto">
            <SemiRadialChart
              className="tw-h-full tw-w-full"
              data={devices}
              total={{
                label: 'Visitors',
                value: totalVisitors,
              }}
            />
          </div>
        }
        contentClasses="!tw-p-0"
        headerClasses="!tw-flex-row !tw-items-center"
        title="Devices"
      />
    )
  } catch (error) {
    return null
  }
}

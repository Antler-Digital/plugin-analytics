import React from 'react'

import type { CountryData } from '../../../types.js'

import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card.js'
import { CountriesList } from '../../ui/countries-list.js'
import GeographyMap from '../../ui/geography-map.js'

export function VisitorGeographyCard({ data }: { data: CountryData[] }) {
  try {
    return (
      <Card className="tw-w-full sm:tw-w-1/2 lg:tw-w-2/3 tw-flex tw-flex-col lg:tw-flex-row">
        <CardContent className="tw-p-0 tw-w-full lg:tw-w-2/3">
          <CardHeader className="lg:tw-min-h-[71px]">
            <CardTitle>Visitor Geography</CardTitle>
          </CardHeader>
          <GeographyMap countryData={data} />
        </CardContent>
        <CardContent className="tw-p-0 tw-w-full lg:tw-w-1/3">
          <CardHeader className="lg:tw-min-h-[71px]">
            <CardTitle>Top Countries</CardTitle>
          </CardHeader>
          <CardContent>
            <CountriesList data={data} />
          </CardContent>
        </CardContent>
      </Card>
    )
  } catch (error) {
    return null
  }
}

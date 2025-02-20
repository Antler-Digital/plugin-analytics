import React, { useMemo } from 'react'

import type { CountryData, CountryInfo } from '../../types.js'

import countries from '../../data/countries.json' with { type: 'json' }
import { Table, TableBody, TableCell, TableRow } from './table.js'

export function CountriesList({ data = [] }: { data: CountryData[] }) {
  const countriesMap = useMemo(() => {
    const map = new Map<string, CountryInfo>()
    Object.values(countries).forEach((country) => {
      map.set(country.alpha2, country)
    })
    return map
  }, [])

  const sortedData = useMemo(() => {
    return data.sort((a, b) => b.views - a.views)
  }, [data]).slice(0, 12)

  return (
    <Table className="tw-pt-4 tw-w-full">
      <TableBody>
        {sortedData.map((country) => {
          const countryInfo = countriesMap.get(country.countryCode)
          if (!countryInfo) {
            return null
          }

          return (
            <TableRow key={country.countryCode}>
              <TableCell>
                <div className="tw-flex tw-items-center tw-space-x-2">
                  <img
                    alt={`${countryInfo.name} flag`}
                    className="tw-rounded-sm"
                    height={18}
                    src={`https://flagcdn.com/24x18/${country.countryCode.toLowerCase()}.png`}
                    width={24}
                  />
                  <span className="tw-text-sm">{countryInfo.name}</span>
                </div>
              </TableCell>
              <TableCell className="tw-text-right">
                <span className="tw-text-sm">{country.views.toLocaleString()}</span>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

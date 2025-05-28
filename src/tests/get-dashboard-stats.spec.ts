/* eslint-disable no-console */
import { describe, it } from 'node:test'
import assert from 'node:assert'

import { DashboardStats } from '../actions/get-dashboard-stats.js'
import type { DateRange } from '../types.js'

await describe('DashboardStats', async () => {
  const mockData = [
    {
      browser: 'Chrome',
      device_type: 'desktop',
      os: 'Windows',
      path: '/home',
      ip_hash: '123',
      createdAt: new Date().toISOString(),
      country: 'US',
      referrer_url: 'https://google.com',
      session_id: {
        utm: {
          campaign: 'test',
          medium: 'social',
          source: 'twitter',
        },
      },
    },
    {
      browser: 'Firefox',
      device_type: 'mobile',
      os: 'iOS',
      path: '/about',
      ip_hash: '456',
      createdAt: new Date().toISOString(),
      country: 'UK',
      referrer_url: 'https://facebook.com',
    },
  ]

  const mockRangeData = [
    {
      ip_hash: '789',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  ]

  const mockOpts = {
    date_range: 'last_7_days' as DateRange,
    date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  }

  await it('should correctly parse browsers data', () => {
    const stats = new DashboardStats(mockData, mockRangeData, mockOpts)
    const browsers = stats.browsers

    assert.strictEqual(browsers.length, 2)
    assert.strictEqual(browsers[0].browser, 'chrome')
    assert.strictEqual(browsers[1].browser, 'firefox')
    assert.strictEqual(browsers[0].visitors, 1)
  })

  await it('should correctly parse devices data', () => {
    const stats = new DashboardStats(mockData, mockRangeData, mockOpts)
    const devices = stats.devices

    assert.strictEqual(devices.length, 2)
    assert.strictEqual(devices[0].desktop, 1)
    assert.strictEqual(devices[1].mobile, 1)
  })

  await it('should correctly calculate live visitors', () => {
    const stats = new DashboardStats(mockData, mockRangeData, mockOpts)
    const liveVisitors = stats.live_visitors

    assert.strictEqual(liveVisitors.value, 2)
  })

  await it('should correctly parse top pages', () => {
    const stats = new DashboardStats(mockData, mockRangeData, mockOpts)
    const topPages = stats.top_pages

    assert.strictEqual(topPages.length, 2)
    assert.strictEqual(topPages[0].path, '/home')
    assert.strictEqual(topPages[1].path, '/about')
  })

  await it('should correctly parse top referrers', () => {
    const stats = new DashboardStats(mockData, mockRangeData, mockOpts)
    const referrers = stats.top_referrers

    assert.strictEqual(referrers.length, 2)
    assert.strictEqual(referrers[0].domain, 'https://google.com')
    assert.strictEqual(referrers[1].domain, 'https://facebook.com')
  })

  await it('should correctly calculate unique visitors', () => {
    const stats = new DashboardStats(mockData, mockRangeData, mockOpts)
    const uniqueVisitors = stats.unique_visitors

    assert.strictEqual(uniqueVisitors.value, 2)
    assert.strictEqual(typeof uniqueVisitors.change, 'number')
  })

  await it('should correctly parse UTM tracking data', () => {
    const stats = new DashboardStats(mockData, mockRangeData, mockOpts)
    const utmTracking = stats.utm_tracking

    assert.strictEqual(utmTracking.length, 1)
    assert.strictEqual(utmTracking[0].campaign, 'test')
    assert.strictEqual(utmTracking[0].medium, 'social')
    assert.strictEqual(utmTracking[0].source, 'twitter')
  })

  await it('should correctly parse visitor geography', () => {
    const stats = new DashboardStats(mockData, mockRangeData, mockOpts)
    const geography = stats.visitor_geography

    assert.strictEqual(geography.length, 2)
    assert.strictEqual(geography[0].countryCode, 'US')
    assert.strictEqual(geography[1].countryCode, 'UK')
  })

  await it('should correctly calculate webpage views', () => {
    const stats = new DashboardStats(mockData, mockRangeData, mockOpts)
    const views = stats.webpage_views

    assert.strictEqual(views.value, 2)
    assert.strictEqual(typeof views.change, 'number')
  })
})

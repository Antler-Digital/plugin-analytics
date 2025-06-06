import { DashboardStats } from '../actions/get-dashboard-stats.js'
import type { DateRange } from '../types.js'

describe('DashboardStats - Basic Tests', () => {
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

  it('should correctly parse browsers data', () => {
    const stats = new DashboardStats(mockData, mockRangeData, mockOpts)
    const browsers = stats.browsers

    expect(browsers.length).toBe(2)
    expect(browsers[0].browser).toBe('chrome')
    expect(browsers[1].browser).toBe('firefox')
    expect(browsers[0].visitors).toBe(1)
  })

  it('should correctly parse devices data', () => {
    const stats = new DashboardStats(mockData, mockRangeData, mockOpts)
    const devices = stats.devices

    expect(devices.length).toBe(2)
    expect(devices[0].desktop).toBe(1)
    expect(devices[1].mobile).toBe(1)
  })

  it('should correctly calculate live visitors', () => {
    const stats = new DashboardStats(mockData, mockRangeData, mockOpts)
    const liveVisitors = stats.live_visitors

    expect(liveVisitors.value).toBe(2)
  })

  it('should correctly parse top pages', () => {
    const stats = new DashboardStats(mockData, mockRangeData, mockOpts)
    const topPages = stats.top_pages

    expect(topPages.length).toBe(2)
    expect(topPages[0].path).toBe('/home')
    expect(topPages[1].path).toBe('/about')
  })

  it('should correctly parse top referrers', () => {
    const stats = new DashboardStats(mockData, mockRangeData, mockOpts)
    const referrers = stats.top_referrers

    expect(referrers.length).toBe(2)
    expect(referrers[0].domain).toBe('https://google.com')
    expect(referrers[1].domain).toBe('https://facebook.com')
  })

  it('should correctly calculate unique visitors', () => {
    const stats = new DashboardStats(mockData, mockRangeData, mockOpts)
    const uniqueVisitors = stats.unique_visitors

    expect(uniqueVisitors.value).toBe(2)
    expect(typeof uniqueVisitors.change).toBe('number')
  })

  it('should correctly parse UTM tracking data', () => {
    const stats = new DashboardStats(mockData, mockRangeData, mockOpts)
    const utmTracking = stats.utm_tracking

    expect(utmTracking.length).toBe(1)
    expect(utmTracking[0].campaign).toBe('test')
    expect(utmTracking[0].medium).toBe('social')
    expect(utmTracking[0].source).toBe('twitter')
  })

  it('should correctly parse visitor geography', () => {
    const stats = new DashboardStats(mockData, mockRangeData, mockOpts)
    const geography = stats.visitor_geography

    expect(geography.length).toBe(2)
    expect(geography[0].countryCode).toBe('US')
    expect(geography[1].countryCode).toBe('UK')
  })

  it('should correctly calculate webpage views', () => {
    const stats = new DashboardStats(mockData, mockRangeData, mockOpts)
    const views = stats.webpage_views

    expect(views.value).toBe(2)
    expect(typeof views.change).toBe('number')
  })
})

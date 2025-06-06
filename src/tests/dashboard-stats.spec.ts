import { describe, it, expect, beforeEach, jest } from '@jest/globals'

import { DashboardStats } from '../actions/get-dashboard-stats.js'
import type { DateRange, TableParams } from '../types.js'

describe('DashboardStats', () => {
  let mockCurrentTime: number

  beforeEach(() => {
    // Mock current time to ensure consistent test results
    mockCurrentTime = new Date('2024-01-15T12:00:00Z').getTime()
    jest.spyOn(Date, 'now').mockReturnValue(mockCurrentTime)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const createMockData = () => [
    {
      browser: 'Chrome',
      device_type: 'desktop',
      os: 'Windows',
      path: '/home',
      ip_hash: 'hash1',
      createdAt: new Date(mockCurrentTime - 10 * 60 * 1000).toISOString(), // 10 minutes ago
      country: 'US',
      referrer_url: 'https://google.com',
      session_id: {
        utm: {
          campaign: 'summer-sale',
          medium: 'social',
          source: 'twitter',
          term: 'shoes',
          content: 'banner',
        },
      },
    },
    {
      browser: 'Firefox',
      device_type: 'mobile',
      os: 'iOS',
      path: '/about',
      ip_hash: 'hash2',
      createdAt: new Date(mockCurrentTime - 60 * 60 * 1000).toISOString(), // 1 hour ago
      country: 'UK',
      referrer_url: 'https://facebook.com',
      session_id: {
        utm: {
          campaign: 'winter-promo',
          medium: 'email',
          source: 'newsletter',
        },
      },
    },
    {
      browser: 'Chrome',
      device_type: 'tablet',
      os: 'Android',
      path: '/home',
      ip_hash: 'hash1', // Same user, different session
      createdAt: new Date(mockCurrentTime - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      country: 'US',
      referrer_url: null,
    },
    {
      browser: 'Safari',
      device_type: 'desktop',
      os: 'macOS',
      path: '/contact',
      ip_hash: 'hash3',
      createdAt: new Date(mockCurrentTime - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      country: 'CA',
      referrer_url: 'invalid-url',
    },
  ]

  const createMockRangeData = () => [
    {
      ip_hash: 'hash4',
      createdAt: new Date(mockCurrentTime - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    },
    {
      ip_hash: 'hash5',
      createdAt: new Date(mockCurrentTime - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
    },
  ]

  const createMockOpts = (): TableParams => ({
    date_range: 'last_7_days' as DateRange,
    date_from: new Date(mockCurrentTime - 7 * 24 * 60 * 60 * 1000),
  })

  describe('Static Methods', () => {
    describe('getDayFromDate', () => {
      it('should return date in YYYY-MM-DD format', () => {
        const date = new Date('2024-01-15T12:30:45Z')
        const result = DashboardStats.getDayFromDate(date)
        expect(result).toBe('2024-01-15')
      })

      it('should handle different timezones consistently', () => {
        const date = new Date('2024-01-15T23:59:59Z')
        const result = DashboardStats.getDayFromDate(date)
        expect(result).toBe('2024-01-15')
      })
    })

    describe('getHourFromDate', () => {
      it('should return hour in "Xh D/M" format', () => {
        const date = new Date('2024-01-15T14:30:45Z')
        const result = DashboardStats.getHourFromDate(date)
        // getHours() returns local time, so we need to account for timezone differences
        const expectedHour = date.getHours()
        expect(result).toBe(`${expectedHour}h 15/1`)
      })

      it('should handle single digit days and months', () => {
        const date = new Date('2024-03-05T09:15:30Z')
        const result = DashboardStats.getHourFromDate(date)
        const expectedHour = date.getHours()
        expect(result).toBe(`${expectedHour}h 5/3`)
      })
    })
  })

  describe('Constructor and Basic Methods', () => {
    it('should initialize with provided data', () => {
      const data = createMockData()
      const rangeData = createMockRangeData()
      const opts = createMockOpts()

      const stats = new DashboardStats(data, rangeData, opts)

      expect(stats.data).toBe(data)
      expect(stats.rangeData).toBe(rangeData)
      expect(stats.opts).toBe(opts)
    })

    it('should return complete dashboard data from parse method', () => {
      const stats = new DashboardStats(createMockData(), createMockRangeData(), createMockOpts())
      const result = stats.parse()

      expect(result).toHaveProperty('bounce_rate')
      expect(result).toHaveProperty('browsers')
      expect(result).toHaveProperty('devices')
      expect(result).toHaveProperty('live_visitors')
      expect(result).toHaveProperty('operating_systems')
      expect(result).toHaveProperty('top_pages')
      expect(result).toHaveProperty('top_referrers')
      expect(result).toHaveProperty('unique_visitors')
      expect(result).toHaveProperty('utm_tracking')
      expect(result).toHaveProperty('views_and_visitors')
      expect(result).toHaveProperty('visitor_geography')
      expect(result).toHaveProperty('webpage_views')
    })
  })

  describe('bounce_rate', () => {
    it('should return default bounce rate values', () => {
      const stats = new DashboardStats([], [], createMockOpts())
      const result = stats.bounce_rate

      expect(result).toEqual({ change: 0, value: 0 })
    })
  })

  describe('browsers', () => {
    it('should aggregate and sort browser data correctly', () => {
      const stats = new DashboardStats(createMockData(), [], createMockOpts())
      const result = stats.browsers

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({
        browser: 'firefox',
        fill: 'hsl(var(--chart-1))',
        visitors: 1,
      })
      expect(result[1]).toEqual({
        browser: 'safari',
        fill: 'hsl(var(--chart-2))',
        visitors: 1,
      })
      expect(result[2]).toEqual({
        browser: 'chrome',
        fill: 'hsl(var(--chart-3))',
        visitors: 2,
      })
    })

    it('should handle empty data', () => {
      const stats = new DashboardStats([], [], createMockOpts())
      const result = stats.browsers

      expect(result).toEqual([])
    })

    it('should normalize browser names to lowercase', () => {
      const data = [{ browser: 'CHROME' }, { browser: 'Firefox' }]
      const stats = new DashboardStats(data, [], createMockOpts())
      const result = stats.browsers

      // Browsers are sorted by visitor count (ascending), then alphabetically
      expect(result[0].browser).toBe('chrome')
      expect(result[1].browser).toBe('firefox')
    })
  })

  describe('devices', () => {
    it('should aggregate device type data correctly', () => {
      const stats = new DashboardStats(createMockData(), [], createMockOpts())
      const result = stats.devices

      expect(result).toHaveLength(3)
      expect(result).toContainEqual({
        desktop: 2,
        fill: 'hsl(var(--chart-1))',
      })
      expect(result).toContainEqual({
        mobile: 1,
        fill: 'hsl(var(--chart-2))',
      })
      expect(result).toContainEqual({
        tablet: 1,
        fill: 'hsl(var(--chart-3))',
      })
    })

    it('should handle empty data', () => {
      const stats = new DashboardStats([], [], createMockOpts())
      const result = stats.devices

      expect(result).toEqual([])
    })
  })

  describe('live_visitors', () => {
    it('should count unique visitors from last 30 minutes', () => {
      const stats = new DashboardStats(createMockData(), [], createMockOpts())
      const result = stats.live_visitors

      // Only the first entry (10 minutes ago) should be considered "live"
      expect(result.value).toBe(1)
    })

    it('should handle no live visitors', () => {
      const oldData = [
        {
          ip_hash: 'hash1',
          createdAt: new Date(mockCurrentTime - 60 * 60 * 1000).toISOString(), // 1 hour ago
        },
      ]
      const stats = new DashboardStats(oldData, [], createMockOpts())
      const result = stats.live_visitors

      expect(result.value).toBe(0)
    })

    it('should deduplicate visitors by IP hash', () => {
      const recentData = [
        {
          ip_hash: 'hash1',
          createdAt: new Date(mockCurrentTime - 10 * 60 * 1000).toISOString(),
        },
        {
          ip_hash: 'hash1', // Same visitor
          createdAt: new Date(mockCurrentTime - 15 * 60 * 1000).toISOString(),
        },
        {
          ip_hash: 'hash2',
          createdAt: new Date(mockCurrentTime - 20 * 60 * 1000).toISOString(),
        },
      ]
      const stats = new DashboardStats(recentData, [], createMockOpts())
      const result = stats.live_visitors

      expect(result.value).toBe(2)
    })
  })

  describe('operating_systems', () => {
    it('should aggregate and sort OS data correctly', () => {
      const stats = new DashboardStats(createMockData(), [], createMockOpts())
      const result = stats.operating_systems

      expect(result).toHaveLength(4) // Windows, iOS, Android, macOS
      // OS data is sorted by visitor count (ascending)
      expect(result.every((item) => item.visitors === 1)).toBe(true)
      expect(result.map((os) => os.os)).toContain('windows')
      expect(result.map((os) => os.os)).toContain('ios')
      expect(result.map((os) => os.os)).toContain('android')
      expect(result.map((os) => os.os)).toContain('macos')
    })

    it('should normalize OS names to lowercase', () => {
      const data = [{ os: 'WINDOWS' }, { os: 'MacOS' }]
      const stats = new DashboardStats(data, [], createMockOpts())
      const result = stats.operating_systems

      // Check that the OS names are normalized to lowercase
      expect(result.map((item) => item.os)).toContain('windows')
      expect(result.map((item) => item.os)).toContain('macos')
    })
  })

  describe('top_pages', () => {
    it('should return top pages sorted by views', () => {
      const stats = new DashboardStats(createMockData(), [], createMockOpts())
      const result = stats.top_pages

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({
        change: 0,
        path: '/home',
        value: 2,
      })
      expect(result[1]).toEqual({
        change: 0,
        path: '/about',
        value: 1,
      })
    })

    it('should limit results to top 10 pages', () => {
      const data = Array.from({ length: 15 }, (_, i) => ({
        path: `/page-${i}`,
      }))
      const stats = new DashboardStats(data, [], createMockOpts())
      const result = stats.top_pages

      expect(result).toHaveLength(10)
    })

    it('should handle empty data', () => {
      const stats = new DashboardStats([], [], createMockOpts())
      const result = stats.top_pages

      expect(result).toEqual([])
    })
  })

  describe('top_referrers', () => {
    it('should parse valid referrer URLs correctly', () => {
      // Create data with only valid referrer URLs
      const dataWithValidReferrers = [
        {
          referrer_url: 'https://google.com',
        },
        {
          referrer_url: 'https://facebook.com',
        },
      ]
      const stats = new DashboardStats(dataWithValidReferrers, [], createMockOpts())
      const result = stats.top_referrers

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        count: 1,
        domain: 'https://google.com',
        label: 'https://google.com',
      })
      expect(result[1]).toEqual({
        count: 1,
        domain: 'https://facebook.com',
        label: 'https://facebook.com',
      })
    })

    it('should handle invalid URLs gracefully', () => {
      const dataWithInvalidURL = [
        {
          referrer_url: 'invalid-url',
        },
      ]
      const stats = new DashboardStats(dataWithInvalidURL, [], createMockOpts())
      const result = stats.top_referrers

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        count: 1,
        domain: '',
        label: 'invalid-url',
      })
    })

    it('should exclude entries without referrer_url', () => {
      const dataWithoutReferrer = [
        { referrer_url: 'https://google.com' },
        { referrer_url: null },
        { referrer_url: undefined },
        {},
      ]
      const stats = new DashboardStats(dataWithoutReferrer, [], createMockOpts())
      const result = stats.top_referrers

      expect(result).toHaveLength(1)
    })

    it('should limit results to top 5 referrers', () => {
      const data = Array.from({ length: 10 }, (_, i) => ({
        referrer_url: `https://site${i}.com`,
      }))
      const stats = new DashboardStats(data, [], createMockOpts())
      const result = stats.top_referrers

      expect(result).toHaveLength(5)
    })
  })

  describe('unique_visitors', () => {
    it('should count unique visitors and calculate percentage change', () => {
      const stats = new DashboardStats(createMockData(), createMockRangeData(), createMockOpts())
      const result = stats.unique_visitors

      expect(result.value).toBe(3) // hash1, hash2, hash3
      expect(result.change).toBe(50) // Percentage change: (3-2)/2 * 100 = 50%
    })

    it('should handle empty range data', () => {
      const stats = new DashboardStats(createMockData(), [], createMockOpts())
      const result = stats.unique_visitors

      expect(result.value).toBe(3)
      expect(result.change).toBe(0)
    })

    it('should deduplicate visitors correctly', () => {
      const dataWithDuplicates = [{ ip_hash: 'hash1' }, { ip_hash: 'hash1' }, { ip_hash: 'hash2' }]
      const stats = new DashboardStats(dataWithDuplicates, [], createMockOpts())
      const result = stats.unique_visitors

      expect(result.value).toBe(2)
    })
  })

  describe('utm_tracking', () => {
    it('should aggregate UTM tracking data correctly', () => {
      const stats = new DashboardStats(createMockData(), [], createMockOpts())
      const result = stats.utm_tracking

      expect(result).toHaveLength(2)
      expect(result).toContainEqual({
        campaign: 'summer-sale',
        medium: 'social',
        source: 'twitter',
        visitors: 1,
      })
      expect(result).toContainEqual({
        campaign: 'winter-promo',
        medium: 'email',
        source: 'newsletter',
        visitors: 1,
      })
    })

    it('should handle entries without UTM data', () => {
      const dataWithoutUTM = [{ session_id: {} }, { session_id: { utm: null } }, {}]
      const stats = new DashboardStats(dataWithoutUTM, [], createMockOpts())
      const result = stats.utm_tracking

      expect(result).toEqual([])
    })

    it('should aggregate duplicate UTM campaigns', () => {
      const dataWithDuplicateUTM = [
        {
          session_id: {
            utm: {
              campaign: 'test-campaign',
              medium: 'email',
              source: 'newsletter',
            },
          },
        },
        {
          session_id: {
            utm: {
              campaign: 'test-campaign',
              medium: 'email',
              source: 'newsletter',
            },
          },
        },
      ]
      const stats = new DashboardStats(dataWithDuplicateUTM, [], createMockOpts())
      const result = stats.utm_tracking

      expect(result).toHaveLength(1)
      expect(result[0].visitors).toBe(2)
    })
  })

  describe('visitor_geography', () => {
    it('should aggregate visitor data by country', () => {
      const stats = new DashboardStats(createMockData(), [], createMockOpts())
      const result = stats.visitor_geography

      expect(result).toHaveLength(3)
      expect(result).toContainEqual({
        countryCode: 'US',
        views: 2,
      })
      expect(result).toContainEqual({
        countryCode: 'UK',
        views: 1,
      })
      expect(result).toContainEqual({
        countryCode: 'CA',
        views: 1,
      })
    })

    it('should handle empty data', () => {
      const stats = new DashboardStats([], [], createMockOpts())
      const result = stats.visitor_geography

      expect(result).toEqual([])
    })
  })

  describe('webpage_views', () => {
    it('should calculate total views and percentage change', () => {
      const stats = new DashboardStats(createMockData(), createMockRangeData(), createMockOpts())
      const result = stats.webpage_views

      expect(result.value).toBe(4)
      expect(result.change).toBe(100) // (2-4)/2 * 100, but actual calculation might differ
    })

    it('should handle empty range data', () => {
      const stats = new DashboardStats(createMockData(), [], createMockOpts())
      const result = stats.webpage_views

      expect(result.value).toBe(4)
      expect(result.change).toBe(0)
    })
  })

  describe('views_and_visitors for different date ranges', () => {
    beforeEach(() => {
      // Set a specific time for consistent hour/day calculations
      mockCurrentTime = new Date('2024-01-15T12:00:00Z').getTime()
      jest.spyOn(Date, 'now').mockReturnValue(mockCurrentTime)
    })

    it('should generate hourly data for last_1_day', () => {
      const opts = { ...createMockOpts(), date_range: 'last_1_day' as DateRange }
      const stats = new DashboardStats(createMockData(), [], opts)
      const result = stats.views_and_visitors

      expect(result).toHaveLength(24)
      expect(result[0]).toHaveProperty('day')
      expect(result[0]).toHaveProperty('views')
      expect(result[0]).toHaveProperty('visitors')
    })

    it('should generate hourly data for last_3_days', () => {
      const opts = { ...createMockOpts(), date_range: 'last_3_days' as DateRange }
      const stats = new DashboardStats(createMockData(), [], opts)
      const result = stats.views_and_visitors

      expect(result).toHaveLength(72)
    })

    it('should generate daily data for last_7_days', () => {
      const opts = { ...createMockOpts(), date_range: 'last_7_days' as DateRange }
      const stats = new DashboardStats(createMockData(), [], opts)
      const result = stats.views_and_visitors

      expect(result).toHaveLength(8) // 7 days + current day
      expect(result.every((item) => item.day.match(/^\d{4}-\d{2}-\d{2}$/))).toBe(true)
    })

    it('should aggregate views and unique visitors correctly', () => {
      const dataWithSameDay = [
        {
          ip_hash: 'hash1',
          createdAt: new Date(mockCurrentTime - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          ip_hash: 'hash1', // Same visitor
          createdAt: new Date(mockCurrentTime - 3 * 60 * 60 * 1000).toISOString(),
        },
        {
          ip_hash: 'hash2',
          createdAt: new Date(mockCurrentTime - 4 * 60 * 60 * 1000).toISOString(),
        },
      ]
      const opts = { ...createMockOpts(), date_range: 'last_7_days' as DateRange }
      const stats = new DashboardStats(dataWithSameDay, [], opts)
      const result = stats.views_and_visitors

      const todayData = result.find((item) => item.day === '2024-01-15')
      expect(todayData?.views).toBe(3)
      expect(todayData?.visitors).toBe(2) // Unique visitors
    })

    it('should handle other date ranges with daily aggregation', () => {
      const opts = { ...createMockOpts(), date_range: 'all_time' as DateRange }
      const stats = new DashboardStats(createMockData(), [], opts)
      const result = stats.views_and_visitors

      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('day')
      expect(result[0]).toHaveProperty('views')
      expect(result[0]).toHaveProperty('visitors')
    })
  })

  describe('Edge Cases', () => {
    it('should handle completely empty data', () => {
      const stats = new DashboardStats([], [], createMockOpts())
      const result = stats.parse()

      expect(result.browsers).toEqual([])
      expect(result.devices).toEqual([])
      expect(result.live_visitors.value).toBe(0)
      expect(result.unique_visitors.value).toBe(0)
      expect(result.webpage_views.value).toBe(0)
    })

    it('should handle malformed data gracefully', () => {
      const malformedData = [null, undefined, {}, { browser: null, device_type: undefined }]
      const stats = new DashboardStats(malformedData, [], createMockOpts())

      expect(() => stats.parse()).not.toThrow()
    })

    it('should handle missing session_id in UTM tracking', () => {
      const dataWithoutSessionId = [{ session_id: null }, { session_id: undefined }, {}]
      const stats = new DashboardStats(dataWithoutSessionId, [], createMockOpts())
      const result = stats.utm_tracking

      expect(result).toEqual([])
    })
  })
})

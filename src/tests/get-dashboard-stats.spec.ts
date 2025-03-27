/* eslint-disable no-console */
import dotenv from 'dotenv'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import { after, before, describe, it } from 'node:test'
import assert from 'node:assert'

import path from 'path'
import { getPayload } from 'payload'
import { fileURLToPath } from 'url'

import { getDashboardData, DashboardStats } from '../actions/get-dashboard-stats.js'

import type { Payload } from 'payload'
import type { DateRange } from '../types.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

let payload: Payload
let memoryDB: MongoMemoryReplSet | undefined

await describe('Analytics Tests', async () => {
  before(async () => {
    process.env.DISABLE_PAYLOAD_HMR = 'true'
    process.env.PAYLOAD_DROP_DATABASE = 'true'

    dotenv.config({
      path: path.resolve(dirname, './.env'),
    })

    if (!process.env.DATABASE_URI) {
      console.log('Starting memory database')
      memoryDB = await MongoMemoryReplSet.create({
        replSet: {
          count: 1, // Reduced from 3 to 1 for faster tests
          dbName: 'payloadmemory',
        },
      })
      console.log('Memory database started')

      process.env.DATABASE_URI = memoryDB.getUri()
    }

    const { default: config } = await import('../../dev/payload.config.js')
    payload = await getPayload({ config })
  })

  after(async () => {
    console.log('Running cleanup...')
    try {
      if (payload) {
        await payload?.db?.destroy?.()
        console.log('Payload connection closed')
      }
    } catch (err) {
      console.error('Error closing payload connection:', err)
    }

    try {
      if (memoryDB) {
        await memoryDB.stop()
        console.log('Memory database stopped')
      }
    } catch (err) {
      console.error('Error stopping memory database:', err)
    }
  })

  await describe('getDashboardStats', async () => {
    await it('should return empty stats when no data exists', async () => {
      const stats = await getDashboardData(payload, { collectionSlug: 'analytics' }, {})
      assert.strictEqual(stats.error, null)
      assert.ok(stats.data)
      assert.strictEqual(stats.data.webpage_views.value, 0)
      assert.strictEqual(stats.data.unique_visitors.value, 0)
    })

    await it('should handle date filtering correctly', async () => {
      // Create test data
      const session = await payload.create({
        collection: 'analytics-sessions',
        data: {
          domain: 'test.com',
          ip_hash: 'test_utm',
          session_start: new Date(),
        },
      })

      await payload.create({
        collection: 'analytics-events',
        data: {
          session_id: session.id,
          domain: 'test.com',
          path: '/test',
          browser: 'Chrome',
          ip_hash: session.ip_hash,
          createdAt: new Date(),
        },
      })

      const dateFrom = new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      const stats = await getDashboardData(
        payload,
        { collectionSlug: 'analytics' },
        { date_from: dateFrom },
      )

      assert.strictEqual(stats.error, null)
      assert.ok(stats.data)
      assert.strictEqual(stats.data.webpage_views.value, 1)
    })

    await it('should respect the limit parameter', async () => {
      // Create multiple test entries
      for (let i = 0; i < 15; i++) {
        const session = await payload.create({
          collection: 'analytics-sessions',
          data: {
            domain: 'test.com',
            ip_hash: 'test_utm',
            session_start: new Date(),
          },
        })

        await payload.create({
          collection: 'analytics-events',
          data: {
            session_id: session.id,
            domain: 'test.com',
            path: '/test',
            browser: 'Chrome',
            ip_hash: `ip_${i}`,
            createdAt: new Date(),
          },
        })
      }

      const stats = await getDashboardData(
        payload,
        { collectionSlug: 'analytics' },
        { limit: '10' },
      )

      assert.strictEqual(stats.error, null)
      assert.ok(stats.data)
      assert.strictEqual(stats.data.webpage_views.value, 10)
    })

    await it('should handle date range comparisons correctly', async () => {
      const now = new Date()
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
      const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000)

      // Create data for different time periods
      const session = await payload.create({
        collection: 'analytics-sessions',
        data: {
          domain: 'test.com',
          ip_hash: 'test_utm',
          session_start: new Date(),
        },
      })

      await payload.create({
        collection: 'analytics-events',
        data: {
          session_id: session.id,
          domain: 'test.com',
          path: '/test',
          browser: 'Firefox',
          ip_hash: 'old',
          createdAt: fourDaysAgo,
        },
      })

      const stats = await getDashboardData(
        payload,
        { collectionSlug: 'analytics' },
        {
          date_from: twoDaysAgo,
          date_change: fourDaysAgo,
        },
      )

      assert.strictEqual(stats.error, null)
      assert.ok(stats.data)
      assert.ok(typeof stats.data.webpage_views.change === 'number')
    })

    await it('should handle errors gracefully', async () => {
      // Test with invalid collection slug
      const stats = await getDashboardData(payload, { collectionSlug: 'invalid-collection' }, {})

      assert.strictEqual(stats.error, true)
      assert.strictEqual(stats.data, null)
      assert.ok(stats.message)
    })

    await it('should populate session data with UTM parameters', async () => {
      // Create a session first
      const session = await payload.create({
        collection: 'analytics-sessions',
        data: {
          domain: 'test.com',
          ip_hash: 'test_utm',
          session_start: new Date(),
          utm: {
            campaign: 'test-campaign',
            medium: 'email',
            source: 'newsletter',
          },
        },
      })

      // Create an event referencing the session
      await payload.create({
        collection: 'analytics-events',
        data: {
          domain: 'test.com',
          path: '/test',
          browser: 'Chrome',
          ip_hash: 'test_utm',
          session_id: session.id,
          createdAt: new Date(),
        },
      })

      const stats = await getDashboardData(payload, { collectionSlug: 'analytics' }, {})

      assert.strictEqual(stats.error, null)
      assert.ok(stats.data)
      assert.ok(stats.data.utm_tracking.length > 0)
      assert.strictEqual(stats.data.utm_tracking[0].campaign, 'test-campaign')
    })
  })

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
})

import { MongoClient } from 'mongodb'
import type { BasePayload, CollectionSlug } from 'payload'

import {
  getWebpageViews,
  getUniqueVisitors,
  getBounceRate,
  getLiveVisitors,
  getPageViewsAndVisitors,
  getVisitorGeography,
  topReferrers,
  getTopPages,
  getUTMTracking,
  getBrowsers,
  getDevices,
  getOperatingSystems,
} from '../actions/get-webpage-views.js'
import { UTMTracking } from '../utils/utm-tracking.js'

// Mock MongoDB
jest.mock('mongodb', () => ({
  MongoClient: jest.fn(),
}))

// Mock UTM tracking utility
jest.mock('../utils/utm-tracking.js', () => ({
  UTMTracking: {
    utmToKey: jest.fn(),
    keyToUTM: jest.fn(),
  },
}))

describe('get-webpage-views', () => {
  let mockPayload: BasePayload
  let mockCollection: CollectionSlug
  let mockMongoClient: any
  let mockDb: any
  let mockDbCollection: any

  beforeEach(() => {
    mockCollection = 'test-collection' as CollectionSlug

    // Mock payload
    mockPayload = {
      count: jest.fn(),
      find: jest.fn(),
      db: {
        url: 'mongodb://localhost:27017/test',
      },
    } as unknown as BasePayload

    // Mock MongoDB client and database
    mockDbCollection = {
      aggregate: jest.fn(),
    }

    mockDb = {
      collection: jest.fn().mockReturnValue(mockDbCollection),
    }

    mockMongoClient = {
      db: jest.fn().mockReturnValue(mockDb),
    }
    ;(MongoClient as jest.MockedClass<typeof MongoClient>).mockReturnValue(mockMongoClient)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getWebpageViews', () => {
    it('should return webpage views count with 100% change', async () => {
      const mockCount = { totalDocs: 150 }
      ;(mockPayload.count as jest.Mock).mockResolvedValue(mockCount)

      const response = await getWebpageViews(mockPayload, mockCollection)
      const data = await response.json()

      expect(mockPayload.count).toHaveBeenCalledWith({ collection: mockCollection })
      expect(response.status).toBe(200)
      expect(data).toEqual({ change: 100, value: 150 })
    })

    it('should handle zero count', async () => {
      const mockCount = { totalDocs: 0 }
      ;(mockPayload.count as jest.Mock).mockResolvedValue(mockCount)

      const response = await getWebpageViews(mockPayload, mockCollection)
      const data = await response.json()

      expect(data).toEqual({ change: 100, value: 0 })
    })
  })

  describe('getUniqueVisitors', () => {
    it('should return unique visitors count', async () => {
      const mockAggregate = [{ session_ids: 75 }]
      mockDbCollection.aggregate.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockAggregate),
      })

      const response = await getUniqueVisitors(mockPayload, mockCollection)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ change: -10, value: 75 })
    })

    it('should handle empty aggregate result', async () => {
      mockDbCollection.aggregate.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      })

      const response = await getUniqueVisitors(mockPayload, mockCollection)
      const data = await response.json()

      expect(data).toEqual({ change: 0, value: 0 })
    })

    it('should handle database errors', async () => {
      mockDbCollection.aggregate.mockReturnValue({
        toArray: jest.fn().mockRejectedValue(new Error('Database connection failed')),
      })

      const response = await getUniqueVisitors(mockPayload, mockCollection)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ message: 'Database connection failed' })
    })

    it('should handle missing database URL', async () => {
      const payloadWithoutUrl = {
        ...mockPayload,
        db: {},
      } as unknown as BasePayload

      const response = await getUniqueVisitors(payloadWithoutUrl, mockCollection)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.message).toBe('No database URL found')
    })

    it('should verify correct MongoDB aggregation pipeline', async () => {
      const mockAggregate = [{ session_ids: 50 }]
      mockDbCollection.aggregate.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockAggregate),
      })

      await getUniqueVisitors(mockPayload, mockCollection)

      expect(mockDbCollection.aggregate).toHaveBeenCalledWith([
        {
          $group: {
            _id: '$session_id',
          },
        },
        {
          $count: 'session_ids',
        },
      ])
    })
  })

  describe('getBounceRate', () => {
    it('should return bounce rate with 23% change', async () => {
      const mockCount = { totalDocs: 50 }
      ;(mockPayload.count as jest.Mock).mockResolvedValue(mockCount)

      const response = await getBounceRate(mockPayload, mockCollection)
      const data = await response.json()

      expect(data).toEqual({ change: 23, value: 50 })
    })
  })

  describe('getLiveVisitors', () => {
    it('should return live visitors count with -7% change', async () => {
      const mockCount = { totalDocs: 25 }
      ;(mockPayload.count as jest.Mock).mockResolvedValue(mockCount)

      const response = await getLiveVisitors(mockPayload, mockCollection)
      const data = await response.json()

      expect(data).toEqual({ change: -7, value: 25 })
    })
  })

  describe('getPageViewsAndVisitors', () => {
    it('should return empty array', async () => {
      const mockCount = { totalDocs: 100 }
      ;(mockPayload.count as jest.Mock).mockResolvedValue(mockCount)

      const response = await getPageViewsAndVisitors(mockPayload, mockCollection)
      const data = await response.json()

      expect(data).toEqual([])
    })
  })

  describe('getVisitorGeography', () => {
    it('should return empty array', async () => {
      const mockCount = { totalDocs: 100 }
      ;(mockPayload.count as jest.Mock).mockResolvedValue(mockCount)

      const response = await getVisitorGeography(mockPayload, mockCollection)
      const data = await response.json()

      expect(data).toEqual([])
    })
  })

  describe('topReferrers', () => {
    it('should return top referrers with pagination', async () => {
      const mockDocs = [
        { referrer_url: 'https://google.com' },
        { referrer_url: 'https://facebook.com' },
        { referrer_url: 'https://google.com' },
        { referrer_url: null },
      ]
      const mockResult = { docs: mockDocs, totalDocs: 4 }
      ;(mockPayload.find as jest.Mock).mockResolvedValue(mockResult)

      const response = await topReferrers(mockPayload, mockCollection, { page: '1', limit: '10' })
      const data = await response.json()

      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: mockCollection,
        select: { referrer_url: true },
        limit: 0,
        pagination: false,
      })

      expect(data.docs).toHaveLength(3)
      expect(data.docs).toContainEqual({ referrer_url: 'https://google.com', value: 2 })
      expect(data.docs).toContainEqual({ referrer_url: 'https://facebook.com', value: 1 })
      expect(data.docs).toContainEqual({ referrer_url: 'Unknown', value: 1 })
      expect(data.total).toBe(4)
      expect(data.page).toBe(1)
    })

    it('should handle pagination correctly', async () => {
      const mockDocs = Array.from({ length: 15 }, (_, i) => ({
        referrer_url: `https://site${i}.com`,
      }))
      const mockResult = { docs: mockDocs, totalDocs: 15 }
      ;(mockPayload.find as jest.Mock).mockResolvedValue(mockResult)

      const response = await topReferrers(mockPayload, mockCollection, { page: '2', limit: '5' })
      const data = await response.json()

      expect(data.docs).toHaveLength(5)
      expect(data.page).toBe(2)
      expect(data.totalPages).toBe(1) // Math.ceil(5 / 5) = 1
    })

    it('should handle default pagination parameters', async () => {
      const mockResult = { docs: [{ referrer_url: 'https://test.com' }], totalDocs: 1 }
      ;(mockPayload.find as jest.Mock).mockResolvedValue(mockResult)

      const response = await topReferrers(mockPayload, mockCollection, {})
      const data = await response.json()

      expect(data.page).toBe(1)
      expect(data.totalPages).toBe(1)
    })
  })

  describe('getTopPages', () => {
    it('should return top pages with pagination', async () => {
      const mockDocs = [
        { path: '/home' },
        { path: '/about' },
        { path: '/home' },
        { path: '/contact' },
      ]
      const mockResult = { docs: mockDocs, totalDocs: 4 }
      ;(mockPayload.find as jest.Mock).mockResolvedValue(mockResult)

      const response = await getTopPages(mockPayload, mockCollection, { page: '1', limit: '10' })
      const data = await response.json()

      expect(data.docs).toHaveLength(3)
      expect(data.docs).toContainEqual({ path: '/home', value: 2 })
      expect(data.docs).toContainEqual({ path: '/about', value: 1 })
      expect(data.docs).toContainEqual({ path: '/contact', value: 1 })
    })

    it('should verify correct payload.find call', async () => {
      const mockResult = { docs: [], totalDocs: 0 }
      ;(mockPayload.find as jest.Mock).mockResolvedValue(mockResult)

      await getTopPages(mockPayload, mockCollection, { page: '1', limit: '10' })

      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: mockCollection,
        select: { path: true },
        limit: 0,
        pagination: false,
      })
    })
  })

  describe('getUTMTracking', () => {
    beforeEach(() => {
      // Reset the mock before each test
      jest.resetModules()
    })

    it('should return UTM tracking data', async () => {
      const mockDocs = [
        { utm: { campaign: 'summer', source: 'google', medium: 'cpc' } },
        { utm: { campaign: 'winter', source: 'facebook', medium: 'social' } },
      ]
      const mockResult = { docs: mockDocs, totalDocs: 2 }
      ;(mockPayload.find as jest.Mock).mockResolvedValue(mockResult)
      ;(UTMTracking.utmToKey as jest.Mock).mockImplementation((utm) =>
        utm ? `${utm.campaign}-${utm.source}-${utm.medium}` : null,
      )
      ;(UTMTracking.keyToUTM as jest.Mock).mockImplementation((key) => {
        const [campaign, source, medium] = key.split('-')
        return { campaign, source, medium, content: undefined, term: undefined }
      })

      const response = await getUTMTracking(mockPayload, mockCollection, { page: '1', limit: '10' })
      const data = await response.json()

      expect(data.docs).toHaveLength(2)
      expect(data.docs[0]).toEqual({
        campaign: 'summer',
        content: null,
        medium: 'cpc',
        source: 'google',
        term: null,
        visitors: 1,
      })
    })

    it('should handle UTM tracking errors', async () => {
      ;(mockPayload.find as jest.Mock).mockRejectedValue(new Error('Find failed'))

      const response = await getUTMTracking(mockPayload, mockCollection, { page: '1', limit: '10' })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.message).toBe('Find failed')
    })

    it('should handle null UTM keys', async () => {
      const mockDocs = [{ utm: { campaign: 'test' } }, { utm: null }]
      const mockResult = { docs: mockDocs, totalDocs: 2 }
      ;(mockPayload.find as jest.Mock).mockResolvedValue(mockResult)
      ;(UTMTracking.utmToKey as jest.Mock).mockImplementation((utm) =>
        utm && utm.campaign ? 'test-key' : null,
      )
      ;(UTMTracking.keyToUTM as jest.Mock).mockImplementation(() => ({ campaign: 'test' }))

      const response = await getUTMTracking(mockPayload, mockCollection, { page: '1', limit: '10' })
      const data = await response.json()

      expect(data.docs).toHaveLength(1)
    })

    it('should convert falsy UTM values to null', async () => {
      const mockDocs = [{ utm: { campaign: 'test' } }]
      const mockResult = { docs: mockDocs, totalDocs: 1 }
      ;(mockPayload.find as jest.Mock).mockResolvedValue(mockResult)
      ;(UTMTracking.utmToKey as jest.Mock).mockReturnValue('test-key')
      ;(UTMTracking.keyToUTM as jest.Mock).mockReturnValue({
        campaign: 'test',
        source: 'false',
        medium: 'null',
        content: 'undefined',
        term: '',
      })

      const response = await getUTMTracking(mockPayload, mockCollection, { page: '1', limit: '10' })
      const data = await response.json()

      expect(data.docs[0].source).toBe(null)
      expect(data.docs[0].medium).toBe(null)
      expect(data.docs[0].content).toBe(null)
      expect(data.docs[0].term).toBe(null)
    })
  })

  describe('getBrowsers', () => {
    it('should return browser statistics', async () => {
      const mockDocs = [
        { browser: 'Chrome' },
        { browser: 'Firefox' },
        { browser: 'Chrome' },
        { browser: 'Safari' },
      ]
      const mockResult = { docs: mockDocs, totalDocs: 4 }
      ;(mockPayload.find as jest.Mock).mockResolvedValue(mockResult)

      const response = await getBrowsers(mockPayload, mockCollection, { page: '1', limit: '10' })
      const data = await response.json()

      expect(data.docs).toHaveLength(3)
      expect(data.docs).toContainEqual({ browser: 'Chrome', value: 2 })
      expect(data.docs).toContainEqual({ browser: 'Firefox', value: 1 })
      expect(data.docs).toContainEqual({ browser: 'Safari', value: 1 })
      expect(data.total).toBe(4)
    })

    it('should handle browser statistics errors', async () => {
      ;(mockPayload.find as jest.Mock).mockRejectedValue(new Error('Browser query failed'))

      const response = await getBrowsers(mockPayload, mockCollection, { page: '1', limit: '10' })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.message).toBe('Browser query failed')
    })

    it('should verify correct find parameters', async () => {
      const mockResult = { docs: [], totalDocs: 0 }
      ;(mockPayload.find as jest.Mock).mockResolvedValue(mockResult)

      await getBrowsers(mockPayload, mockCollection, { page: '1', limit: '10' })

      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: mockCollection,
        select: { browser: true },
        limit: 0,
        pagination: false,
      })
    })
  })

  describe('getDevices', () => {
    it('should return device statistics', async () => {
      const mockDocs = [
        { device_type: 'desktop' },
        { device_type: 'mobile' },
        { device_type: 'desktop' },
        { device_type: 'tablet' },
      ]
      const mockResult = { docs: mockDocs, totalDocs: 4 }
      ;(mockPayload.find as jest.Mock).mockResolvedValue(mockResult)

      const response = await getDevices(mockPayload, mockCollection, { page: '1', limit: '10' })
      const data = await response.json()

      expect(data.docs).toHaveLength(3)
      expect(data.docs).toContainEqual({ device_type: 'desktop', value: 2 })
      expect(data.docs).toContainEqual({ device_type: 'mobile', value: 1 })
      expect(data.docs).toContainEqual({ device_type: 'tablet', value: 1 })
    })

    it('should handle device statistics errors', async () => {
      ;(mockPayload.find as jest.Mock).mockRejectedValue(new Error('Device query failed'))

      const response = await getDevices(mockPayload, mockCollection, { page: '1', limit: '10' })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.message).toBe('Device query failed')
    })
  })

  describe('getOperatingSystems', () => {
    it('should return OS statistics', async () => {
      const mockDocs = [{ os: 'Windows' }, { os: 'macOS' }, { os: 'Windows' }, { os: 'Linux' }]
      const mockResult = { docs: mockDocs, totalDocs: 4 }
      ;(mockPayload.find as jest.Mock).mockResolvedValue(mockResult)

      const response = await getOperatingSystems(mockPayload, mockCollection, {
        page: '1',
        limit: '10',
      })
      const data = await response.json()

      expect(data.docs).toHaveLength(3)
      expect(data.docs).toContainEqual({ os: 'Windows', value: 2 })
      expect(data.docs).toContainEqual({ os: 'macOS', value: 1 })
      expect(data.docs).toContainEqual({ os: 'Linux', value: 1 })
    })

    it('should handle OS statistics errors', async () => {
      ;(mockPayload.find as jest.Mock).mockRejectedValue(new Error('OS query failed'))

      const response = await getOperatingSystems(mockPayload, mockCollection, {
        page: '1',
        limit: '10',
      })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.message).toBe('OS query failed')
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle empty collections', async () => {
      const mockResult = { docs: [], totalDocs: 0 }
      ;(mockPayload.find as jest.Mock).mockResolvedValue(mockResult)

      const response = await getTopPages(mockPayload, mockCollection, { page: '1', limit: '10' })
      const data = await response.json()

      expect(data.docs).toHaveLength(0)
      expect(data.total).toBe(0)
    })

    it('should handle large pagination requests', async () => {
      const mockDocs = Array.from({ length: 50 }, (_, i) => ({ path: `/page${i}` }))
      const mockResult = { docs: mockDocs, totalDocs: 50 }
      ;(mockPayload.find as jest.Mock).mockResolvedValue(mockResult)

      const response = await getTopPages(mockPayload, mockCollection, { page: '1', limit: '1000' })
      const data = await response.json()

      expect(data.docs).toHaveLength(50)
      expect(data.page).toBe(1)
    })

    it('should handle invalid pagination parameters', async () => {
      const mockResult = { docs: [{ path: '/test' }], totalDocs: 1 }
      ;(mockPayload.find as jest.Mock).mockResolvedValue(mockResult)

      const response = await getTopPages(mockPayload, mockCollection, {
        page: 'invalid',
        limit: 'invalid',
      })
      const data = await response.json()

      // Should default to page 1 and limit 1000
      expect(data.page).toBe(1)
    })

    it('should correctly calculate totalPages for pagination', async () => {
      const mockDocs = Array.from({ length: 25 }, (_, i) => ({ path: `/page-${i}` }))
      const mockResult = { docs: mockDocs, totalDocs: 25 }
      ;(mockPayload.find as jest.Mock).mockResolvedValue(mockResult)

      const response = await getTopPages(mockPayload, mockCollection, { page: '1', limit: '10' })
      const data = await response.json()

      expect(data.totalPages).toBe(3)
    })

    it('should handle null/undefined values in data aggregation', async () => {
      const mockDocs = [{ browser: null }, { browser: 'Chrome' }, { browser: undefined }]
      const mockResult = { docs: mockDocs, totalDocs: 3 }
      ;(mockPayload.find as jest.Mock).mockResolvedValue(mockResult)

      const response = await getBrowsers(mockPayload, mockCollection, { page: '1', limit: '10' })
      const data = await response.json()

      // Should handle null/undefined gracefully
      expect(data.docs.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Response format consistency', () => {
    it('should return consistent Response objects', async () => {
      const mockCount = { totalDocs: 10 }
      ;(mockPayload.count as jest.Mock).mockResolvedValue(mockCount)

      const response = await getWebpageViews(mockPayload, mockCollection)

      expect(response).toBeInstanceOf(Response)
      expect(response.headers.get('Content-Type')).toBe('application/json')
    })

    it('should return consistent error Response objects', async () => {
      mockDbCollection.aggregate.mockReturnValue({
        toArray: jest.fn().mockRejectedValue(new Error('Test error')),
      })

      const response = await getUniqueVisitors(mockPayload, mockCollection)

      expect(response).toBeInstanceOf(Response)
      expect(response.status).toBe(500)
      expect(response.headers.get('Content-Type')).toBe('application/json')
    })
  })
})

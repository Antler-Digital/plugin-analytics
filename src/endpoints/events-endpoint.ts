import type { CollectionSlug, Endpoint } from 'payload'

import crypto from 'crypto'

import type {
  AnalyticsPluginOptions,
  CreateEventData,
  CreateSessionData,
  TableParams,
} from '../types.js'

// import { getDashboardData } from '../actions/get-dashboard-stats.js'
import * as WebpageActions from '../actions/get-webpage-views.js'
import { createEvent, createSession, getEvents, getExistingSession } from '../utils/db-helpers.js'
import {
  getBrowser,
  getCountry,
  getDeviceType,
  getDomain,
  getIpAddress,
  getOs,
  getPathname,
  getQueryParams,
  getReferrerUrl,
  getUserAgent,
  getUtmParams,
} from '../utils/request-helpers.js'

const headers: ResponseInit['headers'] = {
  'Content-Type': 'application/json',
}

const hashIpAddress = (ip: string) => {
  return crypto.createHash('sha256').update(ip).digest('hex')
}

// 1x1 transparent GIF pixel (base64 encoded)
const TRANSPARENT_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
)

export function EventsEndpoint(pluginOptions: AnalyticsPluginOptions): Endpoint {
  return {
    handler: async (req) => {
      try {
        const payload = req.payload
        const ip = getIpAddress(req)
        const hashedIp = hashIpAddress(ip)
        const domain = getDomain(req)
        const userAgent = getUserAgent(req)
        const deviceType = userAgent ? getDeviceType(userAgent) : undefined
        const os = userAgent ? getOs(userAgent) : undefined
        const browser = userAgent ? getBrowser(userAgent) : undefined
        const country = ip ? getCountry(req) : undefined
        const path = getPathname(req)

        let session = await getExistingSession(payload, pluginOptions, hashedIp, domain)

        const sessionData: CreateSessionData = {
          browser,
          country,
          device_type: deviceType,
          domain,
          ip_hash: hashedIp,
          os,
          user_agent: userAgent,
        } as any

        if (!session) {
          session = await createSession(payload, pluginOptions, sessionData)
        }

        // Handle session end
        if (req.query.event === 'session_end' && req.query.duration) {
          // Just update the session, don't create an event
          const { collectionSlug: slug } = pluginOptions
          const collection = `${slug}-sessions`
          await payload.update({
            // @ts-ignore
            id: session.id,
            collection,
            data: {
              // @ts-ignore
              session_end: new Date(),
              // @ts-ignore
              duration: parseInt(req.query.duration as string),
            } as any,
          })

          // Return early - no need to create an event
          return new Response(TRANSPARENT_PIXEL, {
            headers: { 'Content-Type': 'image/gif' },
          })
        }

        // Only create events for page views
        const eventData: CreateEventData = {
          ...sessionData,
          event_type: 'page_view',
          path,
          query_params: getQueryParams(req)?.toString(),
          referrer_url: getReferrerUrl(req),
          session_id: session.id.toString(),
          utm: getUtmParams(req),
        }

        await createEvent(payload, pluginOptions, eventData)

        return new Response(TRANSPARENT_PIXEL, {
          headers: { 'Content-Type': 'image/gif' },
        })
      } catch (error) {
        console.error('Analytics tracking error:', {
          domain: getDomain(req),
          error,
          path: req.pathname,
        })

        // Still return the pixel to avoid client-side errors
        // but with a 500 status code
        return new Response(TRANSPARENT_PIXEL, {
          headers: { 'Content-Type': 'image/gif' },
          status: 500,
        })
      }
    },
    method: 'get',
    path: '/events',
  }
}

export function GetEvents(pluginOptions: AnalyticsPluginOptions): Endpoint {
  return {
    handler: async (req) => {
      try {
        const payload = req.payload

        const events = await getEvents(payload, pluginOptions)

        return new Response(JSON.stringify(events?.docs), { headers })
      } catch (error) {
        return Response.json({ message: 'Internal server error' }, { status: 500 })
      }
    },
    method: 'get',
    path: '/events',
  }
}

export function GetStats(pluginOptions: AnalyticsPluginOptions): Endpoint {
  return {
    handler: async (req) => {
      try {
        const payload = req.payload

        const widget = req.routeParams?.['widget']
        const params = req.query

        if (!widget) {
          return new Response(JSON.stringify({ message: 'Widget param is required' }), {
            headers,
          })
        }

        const { collectionSlug: slug } = pluginOptions
        const collection = `${slug}-events`
        const sessionsCollection = `${slug}-sessions`

        switch (widget) {
          case 'bounce-rate':
            return await WebpageActions.getBounceRate(payload, collection)
          case 'browsers':
            return await WebpageActions.getBrowsers(payload, collection, params as TableParams)
          case 'devices':
            return await WebpageActions.getDevices(payload, collection, params as TableParams)
          case 'live-visitors':
            return await WebpageActions.getLiveVisitors(payload, collection)
          case 'operating-systems':
            return await WebpageActions.getOperatingSystems(
              payload,
              collection,
              params as TableParams,
            )
          case 'page-views-and-visitors':
            return await WebpageActions.getPageViewsAndVisitors(payload, collection)

          case 'top-pages':
            return await WebpageActions.getTopPages(payload, collection, params as TableParams)
          case 'top-referrers':
            return await WebpageActions.topReferrers(payload, collection, params as TableParams)
          case 'unique-visitors':
            return await WebpageActions.getUniqueVisitors(payload, collection)
          case 'utm-tracking':
            return await WebpageActions.getUTMTracking(
              payload,
              sessionsCollection,
              params as TableParams,
            )
          case 'visitor-geography':
            return await WebpageActions.getVisitorGeography(payload, collection)
          case 'webpage-views':
            return await WebpageActions.getWebpageViews(payload, collection)

          default:
            return new Response(JSON.stringify({ message: `Unrecognized param: ${widget}` }), {
              headers,
            })
        }
      } catch (error) {
        return Response.json({ message: 'Internal server error' }, { status: 500 })
      }
    },
    method: 'get',
    path: '/stats/:widget',
  }
}

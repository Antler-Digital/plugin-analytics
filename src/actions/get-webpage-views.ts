import type { BasePayload, CollectionSlug, PayloadRequest } from 'payload'

import { MongoClient } from 'mongodb'

import type { TableParams } from '../types.js'

import { UTMTracking } from '../utils/utm-tracking.js'

const headers = { 'Content-Type': 'application/json' }

function getDbUrl(payload: BasePayload): string {
  if ('url' in payload.db && payload.db.url) {
    return payload.db.url as string
  }
  throw new Error('No database URL found')
}

function connectToDb(payload: BasePayload): MongoClient {
  const dbUrl = getDbUrl(payload)
  return new MongoClient(dbUrl)
}

function getCollection(payload: BasePayload, collection: CollectionSlug) {
  const db = connectToDb(payload)

  return db.db().collection(collection)
}

export async function getWebpageViews(payload: BasePayload, collection: CollectionSlug) {
  const count = await payload.count({
    collection,
  })

  return new Response(JSON.stringify({ change: 100, value: count.totalDocs }), {
    headers,
  })
}

export async function getUniqueVisitors(payload: BasePayload, collection: CollectionSlug) {
  try {
    const _collection = await getCollection(payload, collection)

    const aggregate = await _collection
      .aggregate([
        {
          $group: {
            _id: '$session_id',
          },
        },
        {
          $count: 'session_ids',
        },
      ])
      .toArray()

    if (aggregate.length === 0) {
      return new Response(JSON.stringify({ change: 0, value: 0 }), {
        headers,
      })
    }

    return new Response(JSON.stringify({ change: -10, value: aggregate[0]?.session_ids }), {
      headers,
    })
  } catch (error) {
    console.log('error', error)
    return new Response(JSON.stringify({ message: (error as Error).message }), {
      headers,
      status: 500,
    })
  }
}

export async function getBounceRate(payload: BasePayload, collection: CollectionSlug) {
  const count = await payload.count({
    collection,
  })

  return new Response(JSON.stringify({ change: 23, value: count.totalDocs }), {
    headers,
  })
}

export async function getLiveVisitors(payload: BasePayload, collection: CollectionSlug) {
  const count = await payload.count({
    collection,
  })

  return new Response(JSON.stringify({ change: -7, value: count.totalDocs }), {
    headers,
  })
}

export async function getPageViewsAndVisitors(payload: BasePayload, collection: CollectionSlug) {
  const count = await payload.count({
    collection,
  })

  return new Response(JSON.stringify([]), {
    headers,
  })
}

export async function getVisitorGeography(payload: BasePayload, collection: CollectionSlug) {
  const count = await payload.count({
    collection,
  })

  return new Response(JSON.stringify([]), {
    headers,
  })
}

export async function topReferrers<T extends PayloadRequest>(
  payload: BasePayload,
  collection: CollectionSlug,
  opts: TableParams,
) {
  const all = await payload.find<any, any>({
    collection,
    select: {
      referrer_url: true,
    },
    // get all docs; payload has no other option for this since you can't pass in aggregate options
    limit: 0,
    pagination: false,
  })

  const uniquePaths = new Map<string, number>()

  all.docs.forEach((doc) => {
    if (!doc.referrer_url) {
      doc.referrer_url = 'Unknown'
    }
    uniquePaths.set(
      doc.referrer_url as string,
      (uniquePaths.get(doc.referrer_url as string) || 0) + 1,
    )
  })

  const docs = Array.from(uniquePaths.entries())
    .slice(
      (parseInt(opts.page || '1', 10) - 1) * parseInt(opts.limit || '1000', 10),
      parseInt(opts.page || '1', 10) * parseInt(opts.limit || '1000', 10),
    )
    .map(([referrer_url, count]) => ({
      referrer_url,
      value: count,
    }))

  return new Response(
    JSON.stringify({
      docs,
      page: parseInt(opts.page || '1', 10),
      total: all.totalDocs,
      totalPages: Math.ceil(docs.length / parseInt(opts.limit || '1000', 10)),
    }),
    {
      headers,
    },
  )
}

export async function getTopPages(
  payload: BasePayload,
  collection: CollectionSlug,
  opts: TableParams,
) {
  const all = await payload.find<any, any>({
    collection,
    select: {
      path: true,
    },
    // get all docs; payload has no other option for this since you can't pass in aggregate options
    limit: 0,
    pagination: false,
  })

  const uniquePaths = new Map<string, number>()

  all.docs.forEach((doc) => {
    uniquePaths.set(doc.path as string, (uniquePaths.get(doc.path as string) || 0) + 1)
  })
  const docs = Array.from(uniquePaths.entries())
    .slice(
      (parseInt(opts.page || '1', 10) - 1) * parseInt(opts.limit || '1000', 10),
      parseInt(opts.page || '1', 10) * parseInt(opts.limit || '1000', 10),
    )
    .map(([path, count]) => ({
      path,
      value: count,
    }))

  return new Response(
    JSON.stringify({
      docs,
      page: parseInt(opts.page || '1', 10),
      total: all.totalDocs,
      totalPages: Math.ceil(docs.length / parseInt(opts.limit || '1000', 10)),
    }),
    {
      headers,
    },
  )
}

export async function getUTMTracking(
  payload: BasePayload,
  sessionsCollection: CollectionSlug,
  opts: TableParams,
) {
  try {
    const all = await payload.find<any, any>({
      collection: sessionsCollection,
      select: {
        utm: true,
      },
      // get all docs; payload has no other option for this since you can't pass in aggregate options
      limit: 0,
      pagination: false,
    })
    const uniqueCampaigns = new Map<string, number>()

    all.docs.forEach((doc) => {
      const key = UTMTracking.utmToKey(doc.utm)

      if (key) {
        uniqueCampaigns.set(key, (uniqueCampaigns.get(key) || 0) + 1)
      }
    })

    const docs = Array.from(uniqueCampaigns.entries())
      .slice(
        (parseInt(opts.page || '1', 10) - 1) * parseInt(opts.limit || '1000', 10),
        parseInt(opts.page || '1', 10) * parseInt(opts.limit || '1000', 10),
      )
      .map(([campaign, count]) => {
        const utm = UTMTracking.keyToUTM(campaign)
        return {
          campaign: falsyString(utm?.campaign),
          content: falsyString(utm?.content),
          medium: falsyString(utm?.medium),
          source: falsyString(utm?.source),
          term: falsyString(utm?.term),
          visitors: count,
        }
      })

    return new Response(
      JSON.stringify({
        docs,
        page: parseInt(opts.page || '1', 10),
        total: all.totalDocs,
        totalPages: Math.ceil(docs.length / parseInt(opts.limit || '1000', 10)),
      }),
      {
        headers,
      },
    )
  } catch (error) {
    console.log('error', error)
    return new Response(JSON.stringify({ message: (error as Error).message }), {
      headers,
      status: 500,
    })
  }
}

export async function getBrowsers(
  payload: BasePayload,
  collection: CollectionSlug,
  opts: TableParams,
) {
  try {
    const all = await payload.find<any, any>({
      collection,
      select: {
        browser: true,
      },
      // get all docs; payload has no other option for this since you can't pass in aggregate options
      limit: 0,
      pagination: false,
    })
    const uniqueBrowsers = new Map<string, number>()

    all.docs.forEach((doc) => {
      uniqueBrowsers.set(
        doc.browser as string,
        (uniqueBrowsers.get(doc.browser as string) || 0) + 1,
      )
    })
    const docs = Array.from(uniqueBrowsers.entries())
      .slice(
        (parseInt(opts.page || '1', 10) - 1) * parseInt(opts.limit || '1000', 10),
        parseInt(opts.page || '1', 10) * parseInt(opts.limit || '1000', 10),
      )
      .map(([browser, count]) => ({
        browser,
        value: count,
      }))

    return new Response(
      JSON.stringify({
        docs,
        page: parseInt(opts.page || '1', 10),
        total: all.totalDocs,
        totalPages: Math.ceil(docs.length / parseInt(opts.limit || '1000', 10)),
      }),
      {
        headers,
      },
    )
  } catch (error) {
    console.log('error', error)
    return new Response(JSON.stringify({ message: (error as Error).message }), {
      headers,
      status: 500,
    })
  }
}

export async function getDevices(
  payload: BasePayload,
  collection: CollectionSlug,
  opts: TableParams,
) {
  try {
    const all = await payload.find<any, any>({
      collection,
      select: {
        device_type: true,
      },
      // get all docs; payload has no other option for this since you can't pass in aggregate options
      limit: 0,
      pagination: false,
    })
    const uniqueBrowsers = new Map<string, number>()

    all.docs.forEach((doc) => {
      uniqueBrowsers.set(
        doc.device_type as string,
        (uniqueBrowsers.get(doc.device_type as string) || 0) + 1,
      )
    })
    const docs = Array.from(uniqueBrowsers.entries())
      .slice(
        (parseInt(opts.page || '1', 10) - 1) * parseInt(opts.limit || '1000', 10),
        parseInt(opts.page || '1', 10) * parseInt(opts.limit || '1000', 10),
      )
      .map(([device_type, count]) => ({
        device_type,
        value: count,
      }))

    return new Response(
      JSON.stringify({
        docs,
        page: parseInt(opts.page || '1', 10),
        total: all.totalDocs,
        totalPages: Math.ceil(docs.length / parseInt(opts.limit || '1000', 10)),
      }),
      {
        headers,
      },
    )
  } catch (error) {
    console.log('error', error)
    return new Response(JSON.stringify({ message: (error as Error).message }), {
      headers,
      status: 500,
    })
  }
}

export async function getOperatingSystems(
  payload: BasePayload,
  collection: CollectionSlug,
  opts: TableParams,
) {
  try {
    const all = await payload.find<any, any>({
      collection,
      select: {
        os: true,
      },
      // get all docs; payload has no other option for this since you can't pass in aggregate options
      limit: 0,
      pagination: false,
    })
    const uniqueBrowsers = new Map<string, number>()

    all.docs.forEach((doc) => {
      uniqueBrowsers.set(doc.os as string, (uniqueBrowsers.get(doc.os as string) || 0) + 1)
    })
    const docs = Array.from(uniqueBrowsers.entries())
      .slice(
        (parseInt(opts.page || '1', 10) - 1) * parseInt(opts.limit || '1000', 10),
        parseInt(opts.page || '1', 10) * parseInt(opts.limit || '1000', 10),
      )
      .map(([os, count]) => ({
        os,
        value: count,
      }))

    return new Response(
      JSON.stringify({
        docs,
        page: parseInt(opts.page || '1', 10),
        total: all.totalDocs,
        totalPages: Math.ceil(docs.length / parseInt(opts.limit || '1000', 10)),
      }),
      {
        headers,
      },
    )
  } catch (error) {
    console.log('error', error)
    return new Response(JSON.stringify({ message: (error as Error).message }), {
      headers,
      status: 500,
    })
  }
}

function falsyString(value?: string) {
  if (['false', 'null', 'undefined'].includes(value || '')) {
    return null
  }
  return value
}

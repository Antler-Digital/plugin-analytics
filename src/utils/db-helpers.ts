import type { CollectionSlug, Payload } from 'payload'

import type { AnalyticsPluginOptions, CreateEventData, CreateSessionData } from '../types.js'

export async function getExistingSession(
  payload: Payload,
  pluginOptions: AnalyticsPluginOptions,
  ip_hash: string,
  domain: string,
) {
  const { collectionSlug: slug } = pluginOptions
  const collection = `${slug}-sessions`
  const session = await payload.find({
    // @ts-ignore
    collection,
    limit: 1,
    where: {
      domain: {
        equals: domain,
      },
      ip_hash: {
        equals: ip_hash,
      },
    },
  })

  return session.totalDocs > 0 ? session.docs[0] : null
}

export async function createSession(
  payload: Payload,
  pluginOptions: AnalyticsPluginOptions,
  data: CreateSessionData,
) {
  const { collectionSlug: slug } = pluginOptions
  const collection = `${slug}-sessions`
  return await payload.create({
    // @ts-ignore
    collection,
    // @ts-ignore
    data,
  })
}

export async function createEvent(
  payload: Payload,
  pluginOptions: AnalyticsPluginOptions,
  data: CreateEventData,
) {
  const { collectionSlug: slug } = pluginOptions
  const collection = `${slug}-events`
  return await payload.create({
    // @ts-ignore
    collection,
    // @ts-ignore
    data,
  } as any)
}

export async function getEvents(payload: Payload, pluginOptions: AnalyticsPluginOptions) {
  const { collectionSlug: slug } = pluginOptions
  const collection = `${slug}-events`
  // @ts-ignore
  return await payload.find({ collection })
}

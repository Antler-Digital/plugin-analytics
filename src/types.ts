export type AnalyticsPluginOptions = {
  /**
   * Base collection name for plugin collections
   * @default 'analytics'
   * @example Creates two collections: `{collectionSlug}-sessions` and `{collectionSlug}-events`
   */
  collectionSlug?: string
  /**
   * Name of the link to the analytics dashboard in the admin nav menu.
   * @default "Analytics"
   */
  dashboardLinkLabel?: string
  /**
   * Route the analytics dashboard is viewable on in the admin panel.
   * @default "/analytics"
   */
  dashboardSlug?: string
  /**
   * Determines if the deployment is serverless (Vercel) or self-hosted.
   * This is required to set up cron jobs correctly for deleting sessions.
   * @default true
   */
  isServerless?: boolean
  /**
   * Maximum number of days to store events and sessions in the database.
   * @default 60
   */
  maxAgeInDays?: number
}

export type DeviceType = 'desktop' | 'mobile' | 'tablet'

export interface CreateSessionData {
  browser?: string
  country?: string
  device_type?: DeviceType
  domain: string
  ip_hash: string
  os?: string
  user_agent?: string
}

export interface CreateEventData extends CreateSessionData {
  event_type: string
  path: string
  query_params?: string
  referrer_url?: string
  session_id: string
  utm?: {
    campaign?: string
    content?: string
    medium?: string
    term?: string
  }
}

export interface CountryData {
  countryCode: string
  views: number
}

export interface CountryInfo {
  alpha2: string
  alpha3: string
  name: string
  numeric: string
}

export type DateRange =
  | 'all_time'
  | 'last_1_day'
  | 'last_3_days'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_60_days'

export interface TableParams {
  date_change?: Date
  date_from?: Date
  date_range?: DateRange
  limit?: string
  page?: string
}

interface VercelCron {
  path: string
  schedule: string
}

export interface VercelJson {
  [key: string]: any
  crons: VercelCron[]
}

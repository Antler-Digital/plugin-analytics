import type { PayloadRequest } from 'payload'

export const getIpAddress = (req: PayloadRequest) => {
  const FALLBACK_IP_ADDRESS = '0.0.0.0'

  const headers = req.headers
  const forwardedFor = headers.get('x-forwarded-for')

  if (forwardedFor) {
    return forwardedFor.split(',')[0] ?? FALLBACK_IP_ADDRESS
  }

  return headers.get('x-real-ip') ?? FALLBACK_IP_ADDRESS
}

export const getDomain = (req: PayloadRequest): string => {
  return req.host || req?.headers?.get('x-forwarded-host') || ''
}

export const getPathname = (req: PayloadRequest): string => {
  const params = getQueryParams(req)
  return params?.get('path')?.toString() || ''
}

export function getUserAgent(req: PayloadRequest) {
  return req?.headers?.get('user-agent') || undefined
}

export function getDeviceType(userAgent: string) {
  const lowerUA = userAgent.toLowerCase()

  // Check for tablets first since they may also match mobile patterns
  if (
    /ipad|tablet|playbook|silk/.test(lowerUA) ||
    (/android/.test(lowerUA) && !/mobile/.test(lowerUA))
  ) {
    return 'tablet'
  }

  // Check for mobile devices
  if (
    /mobile|iphone|ipod|android|blackberry|opera mini|opera mobi|webos|windows phone|iemobile/.test(
      lowerUA,
    )
  ) {
    return 'mobile'
  }

  // Default to desktop
  return 'desktop'
}

export function getOs(userAgent: string) {
  const ua = userAgent.toLowerCase()

  if (ua.includes('win')) {
    return 'Windows'
  }
  if (ua.includes('mac')) {
    return 'macOS'
  }
  if (ua.includes('linux')) {
    return 'Linux'
  }
  if (ua.includes('android')) {
    return 'Android'
  }
  if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) {
    return 'iOS'
  }

  return 'Unknown'
}

export function getBrowser(userAgent: string) {
  const ua = userAgent.toLowerCase()

  if (ua.includes('firefox')) {
    return 'Firefox'
  }
  if (ua.includes('edg/')) {
    return 'Edge'
  }
  if (ua.includes('opr/') || ua.includes('opera')) {
    return 'Opera'
  }
  if (ua.includes('safari') && !ua.includes('chrome')) {
    return 'Safari'
  }
  if (ua.includes('chrome')) {
    return 'Chrome'
  }
  if (ua.includes('msie') || ua.includes('trident/')) {
    return 'Internet Explorer'
  }

  return 'Unknown'
}

export function getQueryParams(req: PayloadRequest) {
  try {
    const url = req.url || ''
    const parsedUrl = new URL(url)
    return parsedUrl.searchParams
  } catch (error) {
    return undefined
  }
}

export function getUtmParams(req: PayloadRequest) {
  const params = getQueryParams(req)
  return {
    campaign: params?.get('utm_campaign')?.toString() || undefined,
    content: params?.get('utm_content')?.toString() || undefined,
    medium: params?.get('utm_medium')?.toString() || undefined,
    source: params?.get('utm_source')?.toString() || undefined,
    term: params?.get('utm_term')?.toString() || undefined,
  }
}

export function getReferrerUrl(req: PayloadRequest) {
  return req?.headers?.get('referer') || undefined
}

export async function getCountry(req: PayloadRequest) {
  // Priority: x-vercel-ip-country > cf-ipcountry > cloudfront-viewer-country
  const vercel = req?.headers?.get('x-vercel-ip-country')
  if (vercel) return vercel

  const cf = req?.headers?.get('cf-ipcountry')
  if (cf) return cf

  const cloudfront = req?.headers?.get('cloudfront-viewer-country')
  if (cloudfront) return cloudfront

  // Fallback: IP-based geolocation
  const ip = getIpAddress(req)
  if (!ip || ip === '0.0.0.0' || ip === '::1' || ip === '127.0.0.1') return undefined

  try {
    // Use ip-api.com for free IP geolocation (countryCode)
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`)
    if (!res.ok) return undefined
    const data = await res.json()
    return data.countryCode || undefined
  } catch (e) {
    return undefined
  }
}

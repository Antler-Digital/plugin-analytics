/* eslint-disable @typescript-eslint/require-await */
interface AnalyticsOptions {
  domain?: string
  endpoint?: string
}

class Analytics {
  private domain: string
  private endpoint: string
  // Debounce route change handling
  private handleRouteChange = this.debounce(async () => {
    await this.trackPageView()
  }, 1000)
  private initialized: boolean = false
  private isTracking: boolean = false

  private sessionStartTime: number

  constructor(options: AnalyticsOptions = {}) {
    // Default endpoint based on script src or fallback to /api/events
    const scriptEl = document?.querySelector('script[src*="analytics.min.js"]') as HTMLScriptElement
    const defaultEndpoint = scriptEl?.src.replace('analytics.min.js', 'api/events')

    this.endpoint = options.endpoint || defaultEndpoint || '/api/events'
    this.domain = options.domain || window.location.hostname
    this.sessionStartTime = Date.now()
    void this.init()
  }

  // Add debounce utility
  private debounce(fn: (...args: any[]) => void, delay: number) {
    let timeoutId: NodeJS.Timeout
    return (...args: any[]) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => fn(...args), delay)
    }
  }

  private getUtmParams(): Record<string, string> {
    const urlParams = new URLSearchParams(window.location.search)
    const utmParams: Record<string, string> = {}
    ;['source', 'medium', 'campaign', 'term', 'content'].forEach((param) => {
      const value = urlParams.get(`utm_${param}`)
      if (value) {
        utmParams[param] = value
      }
    })

    return utmParams
  }

  private async init(): Promise<void> {
    if (this.initialized) {
      return
    }

    // Track initial pageview after a small delay to ensure page is fully loaded
    setTimeout(() => this.trackPageView(), 100)

    // Setup session end tracking
    this.setupSessionEndTracking()

    // Handle route changes for SPAs and regular navigation
    window.addEventListener('popstate', this.handleRouteChange)

    // For modern browsers, detect URL changes with debounced observer
    let lastUrl = window.location.href
    const observer = new MutationObserver(
      this.debounce(() => {
        const currentUrl = window.location.href
        if (currentUrl !== lastUrl) {
          lastUrl = currentUrl
          this.handleRouteChange()
        }
      }, 1000),
    )

    // Only observe body and limit to specific changes
    const body = document?.querySelector('body')
    if (body) {
      observer.observe(body, {
        attributes: false,
        characterData: false,
        childList: true,
        subtree: true,
      })
    }

    this.initialized = true
  }

  private async loadPixel(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const pixel = new Image()
      pixel.onload = () => {
        pixel.remove()
        resolve()
      }
      pixel.onerror = (error) => {
        pixel.remove()
        if (error instanceof ErrorEvent) {
          reject(new Error(`Network error: ${error.message}`))
        } else {
          reject(new Error('Failed to load tracking pixel'))
        }
      }
      pixel.src = url
      pixel.style.display = 'none'
      document?.body.appendChild(pixel)
    })
  }

  // Helper method for exponential backoff retry
  private async retryWithBackoff(
    fn: () => Promise<void>,
    maxAttempts = 3,
    baseDelay = 1000,
  ): Promise<void> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await fn()
        return
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error
        }
        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  private setupSessionEndTracking(): void {
    // Track tab/window close
    window.addEventListener('beforeunload', () => {
      void this.trackSessionEnd()
    })

    // Track when user switches tabs
    document?.addEventListener('visibilitychange', () => {
      if (document?.visibilityState === 'hidden') {
        void this.trackSessionEnd()
      }
    })

    // Backup: track when user becomes inactive
    let inactivityTimeout: NodeJS.Timeout
    const resetInactivityTimeout = () => {
      clearTimeout(inactivityTimeout)
      inactivityTimeout = setTimeout(
        () => {
          void this.trackSessionEnd()
        },
        30 * 60 * 1000,
      ) // 30 minutes of inactivity
    }

    // Reset timeout on user activity
    ;['mousedown', 'keydown', 'touchstart', 'scroll'].forEach((event) => {
      window.addEventListener(event, resetInactivityTimeout, { passive: true })
    })

    resetInactivityTimeout()
  }

  private shouldRetry(error: unknown): boolean {
    // Improve error type checking
    if (error instanceof Error) {
      // Retry on network errors
      if (error.message.includes('Network error')) {
        return true
      }
    }
    // Don't retry on other types of errors
    return false
  }

  private async trackPageView(): Promise<void> {
    // Add a guard to prevent tracking if the previous request hasn't completed
    if (this.isTracking) {
      return
    }
    this.isTracking = true

    try {
      await this.retryWithBackoff(async () => {
        const eventsUrl = new URL(this.endpoint)
        eventsUrl.searchParams.append('domain', this.domain)
        eventsUrl.searchParams.append('path', window.location.pathname)

        // Only add referrer if it's from a different domain
        const referrer = document?.referrer
        if (referrer && !referrer.includes(window.location.hostname)) {
          eventsUrl.searchParams.append('ref', referrer)
        }

        // Add UTM parameters if they exist
        const utmParams = this.getUtmParams()
        Object.entries(utmParams).forEach(([key, value]) => {
          eventsUrl.searchParams.append(`utm_${key}`, value)
        })

        await this.loadPixel(eventsUrl.toString())
      })
    } catch (error) {
      // Only log if it's a final failure after retries
      console.warn('Failed to track page view after retries:', error)
    } finally {
      this.isTracking = false
    }
  }

  private async trackSessionEnd(): Promise<void> {
    try {
      const sessionDuration = Date.now() - this.sessionStartTime

      // Use sendBeacon for more reliable delivery during page unload
      const eventsUrl = new URL(this.endpoint)
      eventsUrl.searchParams.append('domain', this.domain)
      eventsUrl.searchParams.append('event', 'session_end')
      eventsUrl.searchParams.append('duration', sessionDuration.toString())

      // Fallback to sync image request
      await this.loadPixel(eventsUrl.toString())
    } catch (error) {
      console.warn('Failed to track session end:', error)
      // Optionally implement retry logic here
    }
  }

  // Public method to manually track page views
  public async trackView(): Promise<void> {
    try {
      await this.retryWithBackoff(() => this.trackPageView())
    } catch (error) {
      console.warn('Manual page view tracking failed after retries:', error)
    }
  }
}

// Create instance immediately
const analytics = new Analytics()

// Export for advanced usage
if (typeof window !== 'undefined') {
  ;(window as any).Analytics = Analytics
  ;(window as any).analytics = analytics
}

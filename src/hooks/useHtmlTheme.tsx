import { useEffect, useState } from 'react'
// import type { Theme } from '@payloadcms/ui'

type Theme = 'dark' | 'light'

const useHtmlTheme = (): Theme => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light' // Fallback for SSR
  })

  useEffect(() => {
    const htmlElement = document.documentElement
    const currentTheme = (htmlElement.getAttribute('data-theme') as Theme) || theme
    setTheme(currentTheme)

    // Update HTML class based on theme
    htmlElement.classList.remove('light', 'dark')
    htmlElement.classList.add(currentTheme)

    // Watch for changes to the data-theme attribute
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          const newTheme = (htmlElement.getAttribute('data-theme') as Theme) || theme
          setTheme(newTheme)
          htmlElement.classList.remove('light', 'dark')
          htmlElement.classList.add(newTheme)
        }
      })
    })

    // Watch for OS theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleOSThemeChange = (e: MediaQueryListEvent) => {
      if (!htmlElement.hasAttribute('data-theme')) {
        const newTheme = e.matches ? 'dark' : 'light'
        setTheme(newTheme)
        htmlElement.classList.remove('light', 'dark')
        htmlElement.classList.add(newTheme)
      }
    }
    mediaQuery.addEventListener('change', handleOSThemeChange)

    observer.observe(htmlElement, { attributes: true })

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', handleOSThemeChange)
      htmlElement.classList.remove('light', 'dark')
    }
  }, [theme])

  return theme
}

export default useHtmlTheme

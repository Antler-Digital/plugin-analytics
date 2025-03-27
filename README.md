# Payload Analytics Plugin

A lightweight, privacy-focused analytics solution for Payload CMS that automatically tracks page views, user behavior, and campaign performance without compromising user privacy.

[Screenshot placeholder - Add dashboard screenshot here]

## About

This plugin provides real-time analytics tracking and visualization for your Payload CMS projects. It's designed with privacy in mind, collecting essential metrics without using cookies or storing personal data.

### Key Features
- 📊 Automatic page view tracking
- 🔍 UTM parameter capture
- 🌐 SPA navigation support
- 📱 Device and browser analytics
- 🗺️ Geographic visitor insights
- 🔒 Privacy-focused (GDPR & CCPA compliant)
- 🚀 Lightweight (<5KB)

## Installation

```bash
npm install @antler-digital/plugin-analytics
```

### Basic Setup

Add the plugin to your Payload config:

```typescript
// payload.config.ts
import { analyticsPlugin } from "@antler-payload-plugins/plugin-analytics";

export default buildConfig({
  plugins: [analyticsPlugin()],
});
```

### Client Setup

Add the tracking script to your HTML document:

```html
<script src="https://your-payload-domain.com/analytics.min.js"></script>
```

### Next.js Integration

```tsx
// app/layout.tsx
import Script from "next/script";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Script
          src="https://your-payload-domain.com/analytics.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
```

## Configuration

### Plugin Options

```typescript
analyticsPlugin({
  collectionSlug: 'analytics',
  dashboardSlug: '/analytics',
  dashboardLinkLabel: 'Analytics',
  maxAgeInDays: 30,
  isServerless: true
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `collectionSlug` | string | `'analytics'` | Collection name for storing analytics data |
| `dashboardSlug` | string | `'/analytics'` | Admin panel dashboard route |
| `dashboardLinkLabel` | string | `'Analytics'` | Dashboard navigation label |
| `maxAgeInDays` | number | `30` | Data retention period |
| `isServerless` | boolean | `true` | Deployment environment type |

### Client Configuration

```typescript
window.analytics = new Analytics({
  endpoint: "https://your-payload-domain.com/api/pixel",
  domain: "your-domain.com",
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `endpoint` | string | `/api/events` | Analytics endpoint URL |
| `domain` | string | `window.location.hostname` | Domain to track |

## Security

### Content Security Policy (CSP)

Add the following to your CSP headers:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="img-src 'self' https://your-payload-domain.com/"
/>
```

### Privacy Compliance
- No cookies
- No personal data collection
- IP address hashing
- GDPR & CCPA compliant

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers
- SPA & MPA compatible

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

[MIT License](LICENSE)

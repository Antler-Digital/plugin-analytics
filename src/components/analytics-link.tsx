// @ts-ignore
import Link from 'next/link'

export function AnalyticsLink({ href, label }: { href: string; label: string }) {
  return <Link href={href}>{label}</Link>
}

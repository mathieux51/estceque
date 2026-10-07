// formatTime shows seconds as 1:02:03 or 2:03.
export function formatTime(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return '0:00'
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const rest = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${rest}` : `${m}:${rest}`
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return ''
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${Math.max(1, minutes)} min`
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`
}

const relative = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })

export function formatAgo(date: string | null): string {
  if (!date) return ''
  const seconds = (new Date(date).getTime() - Date.now()) / 1000
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit)
  }
  return "à l'instant"
}

export function plural(n: number, one: string, many: string): string {
  return `${n.toLocaleString('fr')} ${n > 1 ? many : one}`
}

// parseTime reads "1:23", "1:02:03" or "83" as seconds.
export function parseTime(value: string | null): number | null {
  if (!value) return null
  const parts = value.split(':').map(Number)
  if (parts.some((p) => !Number.isFinite(p) || p < 0)) return null
  return parts.reduce((total, p) => total * 60 + p, 0)
}

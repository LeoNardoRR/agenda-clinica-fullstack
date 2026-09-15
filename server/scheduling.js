export const OPENING_HOUR = 8
export const CLOSING_HOUR = 18
export const SUPPORTED_YEAR = 2026
export const CLINIC_TIME_ZONE = 'America/Sao_Paulo'

export const ALL_SLOTS = Array.from(
  { length: CLOSING_HOUR - OPENING_HOUR },
  (_, index) => `${String(OPENING_HOUR + index).padStart(2, '0')}:00`,
)

export function parseDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) return null
  const parsed = new Date(`${date}T12:00:00Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return null
  return parsed
}

export function isWeekend(date) {
  const day = date.getUTCDay()
  return day === 0 || day === 6
}

export function getNowInClinic(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const value = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]))
  return { date: `${value.year}-${value.month}-${value.day}`, time: `${value.hour}:${value.minute}` }
}

export function filterAvailableSlots(date, occupiedSlots, now = new Date()) {
  const clinicNow = getNowInClinic(now)
  return ALL_SLOTS.filter((slot) => {
    if (occupiedSlots.has(slot)) return false
    return date !== clinicNow.date || slot > clinicNow.time
  })
}

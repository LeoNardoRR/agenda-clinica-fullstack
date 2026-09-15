import { SUPPORTED_YEAR } from './scheduling.js'

const API_URL = `https://date.nager.at/api/v3/PublicHolidays/${SUPPORTED_YEAR}/BR`
let holidayCache = null

export async function getHolidays(fetchImpl = fetch) {
  if (holidayCache) return holidayCache
  const response = await fetchImpl(API_URL, { signal: AbortSignal.timeout(7000) })
  if (!response.ok) throw new Error(`API de feriados respondeu com status ${response.status}`)
  const data = await response.json()
  holidayCache = new Map(data.map((holiday) => [holiday.date, holiday.localName]))
  return holidayCache
}

export function clearHolidayCache() {
  holidayCache = null
}

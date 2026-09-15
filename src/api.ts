export type Appointment = {
  id: number
  patientName: string
  phone: string
  date: string
  time: string
}

export type Availability = {
  date: string
  available: string[]
  blockedReason: string | null
}

type AppointmentInput = Omit<Appointment, 'id'>

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

const STORAGE_KEY = 'clinica-aurora-demo-appointments'
const ALL_SLOTS = Array.from({ length: 10 }, (_, index) => `${String(index + 8).padStart(2, '0')}:00`)

function readDemoAppointments(): Appointment[] {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(stored) ? stored : []
  } catch {
    return []
  }
}

function clinicNow() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return { date: `${values.year}-${values.month}-${values.day}`, time: `${values.hour}:${values.minute}` }
}

async function demoAvailability(date: string): Promise<Availability> {
  const parsed = new Date(`${date}T12:00:00Z`)
  if (!/^2026-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error('Informe uma data válida de 2026.')
  }
  if ([0, 6].includes(parsed.getUTCDay())) {
    return { date, available: [], blockedReason: 'A clínica não atende aos finais de semana.' }
  }

  const response = await fetch('https://date.nager.at/api/v3/PublicHolidays/2026/BR')
  if (!response.ok) throw new Error('Não foi possível consultar os feriados agora.')
  const holidays = await response.json() as Array<{ date: string; localName: string }>
  const holiday = holidays.find((item) => item.date === date)
  if (holiday) return { date, available: [], blockedReason: `Feriado: ${holiday.localName}.` }

  const occupied = new Set(readDemoAppointments().filter((item) => item.date === date).map((item) => item.time))
  const now = clinicNow()
  const available = ALL_SLOTS.filter((time) => !occupied.has(time) && (date !== now.date || time > now.time))
  return { date, available, blockedReason: null }
}

async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a operação.')
  return data
}

export async function fetchAvailability(date: string): Promise<Availability> {
  if (isDemoMode) return demoAvailability(date)
  return readJson(await fetch(`/api/available?date=${encodeURIComponent(date)}`))
}

export async function fetchAppointments(): Promise<Appointment[]> {
  if (isDemoMode) return readDemoAppointments().sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
  const data = await readJson<{ appointments: Appointment[] }>(await fetch('/api/appointments'))
  return data.appointments
}

export async function bookAppointment(input: AppointmentInput): Promise<Appointment> {
  if (!isDemoMode) {
    const data = await readJson<{ appointment: Appointment }>(await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }))
    return data.appointment
  }

  if (input.patientName.trim().length < 2 || input.phone.trim().length < 8) {
    throw new Error('Informe nome e telefone válidos.')
  }
  const availability = await demoAvailability(input.date)
  if (!availability.available.includes(input.time)) {
    throw new Error(availability.blockedReason || 'Este horário não está mais disponível.')
  }
  const appointments = readDemoAppointments()
  const appointment = { ...input, id: Date.now() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...appointments, appointment]))
  return appointment
}

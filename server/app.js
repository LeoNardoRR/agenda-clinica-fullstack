import express from 'express'
import { createAppointment, listAppointments, occupiedSlots } from './database.js'
import { getHolidays } from './holidays.js'
import {
  ALL_SLOTS,
  SUPPORTED_YEAR,
  filterAvailableSlots,
  isWeekend,
  parseDate,
} from './scheduling.js'

const invalidDateMessage = `Informe uma data válida de ${SUPPORTED_YEAR}.`

async function inspectDate(date, fetchImpl) {
  const parsedDate = parseDate(date)
  if (!parsedDate || parsedDate.getUTCFullYear() !== SUPPORTED_YEAR) {
    return { status: 400, error: invalidDateMessage }
  }
  if (isWeekend(parsedDate)) {
    return { status: 200, available: [], blockedReason: 'A clínica não atende aos finais de semana.' }
  }
  const holidays = await getHolidays(fetchImpl)
  if (holidays.has(date)) {
    return { status: 200, available: [], blockedReason: `Feriado: ${holidays.get(date)}.` }
  }
  return { status: 200, available: filterAvailableSlots(date, occupiedSlots(date)), blockedReason: null }
}

export function createApp({ fetchImpl = fetch } = {}) {
  const app = express()
  app.use(express.json())

  app.get('/api/health', (_request, response) => response.json({ status: 'ok' }))

  app.get(['/available', '/api/available'], async (request, response) => {
    try {
      const result = await inspectDate(request.query.date, fetchImpl)
      if (result.error) return response.status(result.status).json({ error: result.error })
      return response.json({
        date: request.query.date,
        available: result.available,
        blockedReason: result.blockedReason,
      })
    } catch (error) {
      console.error(error)
      return response.status(503).json({ error: 'Não foi possível consultar os feriados agora. Tente novamente.' })
    }
  })

  app.get(['/appointments', '/api/appointments'], (_request, response) => {
    response.json({ appointments: listAppointments() })
  })

  app.post(['/appointments', '/api/appointments'], async (request, response) => {
    const patientName = String(request.body.patientName ?? '').trim()
    const phone = String(request.body.phone ?? '').trim()
    const date = String(request.body.date ?? '')
    const time = String(request.body.time ?? '')

    if (patientName.length < 2 || phone.length < 8) {
      return response.status(400).json({ error: 'Informe nome e telefone válidos.' })
    }
    if (!ALL_SLOTS.includes(time)) {
      return response.status(400).json({ error: 'Selecione um horário válido entre 08:00 e 18:00.' })
    }

    try {
      const validation = await inspectDate(date, fetchImpl)
      if (validation.error) return response.status(validation.status).json({ error: validation.error })
      if (!validation.available.includes(time)) {
        return response.status(409).json({ error: validation.blockedReason || 'Este horário não está mais disponível.' })
      }
      const appointment = createAppointment({ patientName, phone, date, time })
      return response.status(201).json({
        message: 'Consulta agendada com sucesso!',
        appointment,
      })
    } catch (error) {
      if (String(error.message).includes('UNIQUE constraint failed')) {
        return response.status(409).json({ error: 'Este horário acabou de ser reservado. Escolha outro.' })
      }
      console.error(error)
      return response.status(503).json({ error: 'Não foi possível concluir o agendamento agora.' })
    }
  })

  return app
}

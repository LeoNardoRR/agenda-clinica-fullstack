import assert from 'node:assert/strict'
import { once } from 'node:events'
import test from 'node:test'

process.env.DATABASE_PATH = ':memory:'

const holidays = [
  { date: '2026-12-25', localName: 'Natal' },
]
const fetchImpl = async () => new Response(JSON.stringify(holidays), {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
})

const { createApp } = await import('../server/app.js')

test('API oferece, cria, lista e impede conflito de agendamentos', async (context) => {
  const server = createApp({ fetchImpl }).listen(0, '127.0.0.1')
  await once(server, 'listening')
  context.after(() => server.close())
  const { port } = server.address()
  const baseUrl = `http://127.0.0.1:${port}`

  const availableResponse = await fetch(`${baseUrl}/available?date=2026-10-20`)
  const available = await availableResponse.json()
  assert.equal(availableResponse.status, 200)
  assert.equal(available.available.includes('10:00'), true)

  const createResponse = await fetch(`${baseUrl}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientName: 'Paciente Teste',
      phone: '11999999999',
      date: '2026-10-20',
      time: '10:00',
    }),
  })
  assert.equal(createResponse.status, 201)

  const conflictResponse = await fetch(`${baseUrl}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientName: 'Outro Paciente',
      phone: '11888888888',
      date: '2026-10-20',
      time: '10:00',
    }),
  })
  assert.equal(conflictResponse.status, 409)

  const list = await (await fetch(`${baseUrl}/appointments`)).json()
  assert.equal(list.appointments.length, 1)
  assert.equal(list.appointments[0].patientName, 'Paciente Teste')

  const holiday = await (await fetch(`${baseUrl}/available?date=2026-12-25`)).json()
  assert.deepEqual(holiday.available, [])
  assert.match(holiday.blockedReason, /Natal/)

  const weekend = await (await fetch(`${baseUrl}/available?date=2026-10-18`)).json()
  assert.deepEqual(weekend.available, [])
  assert.match(weekend.blockedReason, /finais de semana/)
})

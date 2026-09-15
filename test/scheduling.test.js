import assert from 'node:assert/strict'
import test from 'node:test'
import { ALL_SLOTS, filterAvailableSlots, isWeekend, parseDate } from '../server/scheduling.js'

test('gera dez horários de uma hora entre 08:00 e 18:00', () => {
  assert.deepEqual(ALL_SLOTS, [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00',
  ])
})

test('rejeita datas inválidas e identifica finais de semana', () => {
  assert.equal(parseDate('2026-02-30'), null)
  assert.equal(isWeekend(parseDate('2026-02-14')), true)
  assert.equal(isWeekend(parseDate('2026-02-10')), false)
})

test('remove horários ocupados e passados no dia atual da clínica', () => {
  const now = new Date('2026-02-10T13:30:00Z') // 10:30 em São Paulo
  assert.deepEqual(
    filterAvailableSlots('2026-02-10', new Set(['13:00']), now),
    ['11:00', '12:00', '14:00', '15:00', '16:00', '17:00'],
  )
})

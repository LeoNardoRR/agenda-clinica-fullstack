import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const databasePath = process.env.DATABASE_PATH || resolve('data/appointments.db')
if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true })

export const db = new DatabaseSync(databasePath)
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    appointment_date TEXT NOT NULL,
    appointment_time TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (appointment_date, appointment_time)
  );
`)

export function listAppointments() {
  return db.prepare(`
    SELECT id, patient_name AS patientName, phone, appointment_date AS date,
           appointment_time AS time, created_at AS createdAt
    FROM appointments
    ORDER BY appointment_date, appointment_time
  `).all()
}

export function occupiedSlots(date) {
  return new Set(
    db.prepare('SELECT appointment_time AS time FROM appointments WHERE appointment_date = ?')
      .all(date)
      .map(({ time }) => time),
  )
}

export function createAppointment({ patientName, phone, date, time }) {
  const result = db.prepare(`
    INSERT INTO appointments (patient_name, phone, appointment_date, appointment_time)
    VALUES (?, ?, ?, ?)
  `).run(patientName, phone, date, time)
  return db.prepare(`
    SELECT id, patient_name AS patientName, phone, appointment_date AS date,
           appointment_time AS time, created_at AS createdAt
    FROM appointments WHERE id = ?
  `).get(result.lastInsertRowid)
}

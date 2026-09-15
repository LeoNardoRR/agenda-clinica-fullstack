import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

type Appointment = {
  id: number
  patientName: string
  phone: string
  date: string
  time: string
}

type Availability = {
  date: string
  available: string[]
  blockedReason: string | null
}

const todayInSaoPaulo = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date())

const firstValidDate = () => {
  const today = todayInSaoPaulo()
  return today.startsWith('2026-') ? today : '2026-02-10'
}

const formatDate = (date: string) => new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'long',
  timeZone: 'UTC',
}).format(new Date(`${date}T12:00:00Z`))

function CalendarIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" /></svg>
}

function ClockIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
}

function App() {
  const [date, setDate] = useState(firstValidDate)
  const [availability, setAvailability] = useState<Availability | null>(null)
  const [selectedTime, setSelectedTime] = useState('')
  const [patientName, setPatientName] = useState('')
  const [phone, setPhone] = useState('')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadAppointments = useCallback(async () => {
    const response = await fetch('/api/appointments')
    const data = await response.json()
    setAppointments(data.appointments ?? [])
  }, [])

  const loadAvailability = useCallback(async (selectedDate: string) => {
    setLoading(true)
    setNotice(null)
    setSelectedTime('')
    try {
      const response = await fetch(`/api/available?date=${encodeURIComponent(selectedDate)}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setAvailability(data)
    } catch (error) {
      setAvailability(null)
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Falha ao consultar horários.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAvailability(date)
    void loadAppointments()
  }, [date, loadAppointments, loadAvailability])

  const nextAppointments = useMemo(() => appointments.slice(0, 4), [appointments])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!selectedTime) {
      setNotice({ type: 'error', text: 'Escolha um dos horários disponíveis.' })
      return
    }
    setLoading(true)
    setNotice(null)
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientName, phone, date, time: selectedTime }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setNotice({ type: 'success', text: `${data.message} Protocolo #${data.appointment.id}.` })
      setPatientName('')
      setPhone('')
      setSelectedTime('')
      await Promise.all([loadAvailability(date), loadAppointments()])
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Falha ao agendar.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-shell">
      <section className="intro" aria-labelledby="page-title">
        <span className="eyebrow">Clínica Aurora</span>
        <h1 id="page-title">Seu cuidado começa com um horário.</h1>
        <p>Agende sua consulta em poucos passos, com horários atualizados e confirmação imediata.</p>
        <div className="trust-note"><span>✓</span> Datas e feriados validados em tempo real</div>
      </section>

      <section className="scheduler-card" aria-label="Formulário de agendamento">
        <header className="card-header">
          <div className="brand-mark">A</div>
          <div><strong>Agendamento</strong><span>Horário de Brasília</span></div>
          <span className="secure-badge">Seguro</span>
        </header>

        <form onSubmit={submit}>
          <div className="step-heading"><span>1</span><div><strong>Escolha o dia</strong><small>Atendimento de segunda a sexta</small></div></div>
          <label className="date-field">
            <CalendarIcon />
            <span><small>Data da consulta</small><strong>{formatDate(date)}</strong></span>
            <input aria-label="Data da consulta" type="date" min="2026-01-01" max="2026-12-31" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>

          <div className="step-heading"><span>2</span><div><strong>Selecione um horário</strong><small>Consultas com duração de 1 hora</small></div></div>
          <div className="slots" aria-live="polite">
            {loading && !availability ? <p className="status">Consultando agenda...</p> : null}
            {availability?.blockedReason ? <p className="status blocked">{availability.blockedReason}</p> : null}
            {availability && !availability.blockedReason && availability.available.length === 0 ? <p className="status blocked">Não há mais horários disponíveis nesta data.</p> : null}
            {availability?.available.map((time) => (
              <button className={selectedTime === time ? 'slot selected' : 'slot'} type="button" key={time} onClick={() => setSelectedTime(time)} aria-pressed={selectedTime === time}>
                <ClockIcon /> {time}
              </button>
            ))}
          </div>

          <div className="step-heading"><span>3</span><div><strong>Seus dados</strong><small>Para confirmar a reserva</small></div></div>
          <div className="patient-fields">
            <label><span>Nome completo</span><input value={patientName} onChange={(event) => setPatientName(event.target.value)} minLength={2} required placeholder="Como podemos chamar você?" /></label>
            <label><span>Telefone</span><input value={phone} onChange={(event) => setPhone(event.target.value)} minLength={8} required inputMode="tel" placeholder="(00) 00000-0000" /></label>
          </div>

          {notice ? <p className={`notice ${notice.type}`} role="status">{notice.text}</p> : null}
          <button className="submit-button" disabled={loading || !selectedTime} type="submit">{loading ? 'Processando...' : 'Confirmar agendamento'} <span>→</span></button>
        </form>
      </section>

      <aside className="upcoming-card" aria-label="Próximos agendamentos">
        <div className="aside-heading"><div><span className="eyebrow">Agenda</span><h2>Próximas consultas</h2></div><span className="count">{appointments.length}</span></div>
        {nextAppointments.length === 0 ? <p className="empty">Nenhuma consulta agendada ainda.</p> : nextAppointments.map((item) => (
          <article key={item.id} className="appointment-item">
            <div className="date-tile"><strong>{item.date.slice(8)}</strong><span>{new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' }).format(new Date(`${item.date}T12:00:00Z`)).replace('.', '')}</span></div>
            <div><strong>{item.patientName}</strong><span>{item.time} · Consulta clínica</span></div>
            <span className="confirmed-dot" title="Confirmado" />
          </article>
        ))}
        <p className="api-note">Feriados nacionais consultados via Nager.Date API.</p>
      </aside>
    </main>
  )
}

export default App

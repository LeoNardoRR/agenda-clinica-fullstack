# Clínica Aurora - Agenda Full Stack

Mini sistema de agendamento para clínica, desenvolvido a partir de um desafio técnico Full Stack.

## Funcionalidades

- consulta de horários disponíveis por data;
- bloqueio de finais de semana e feriados nacionais;
- bloqueio de horários já ocupados e horários passados no dia atual;
- criação e listagem persistente de agendamentos;
- interface responsiva e acessível;
- validação de conflitos também no banco de dados.

## Tecnologias

- React, TypeScript e Vite no frontend;
- Node.js e Express no backend REST;
- SQLite nativo do Node.js para persistência;
- Nager.Date API para feriados brasileiros de 2026;
- testes com o runner nativo do Node.js.

## Como executar

Requer Node.js 22 ou superior.

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`

API: `http://localhost:3333`

Para gerar e executar a versão de produção:

```bash
npm run build
npm start
```

## Endpoints

### `GET /available?date=2026-02-10`

Retorna os horários disponíveis e, quando aplicável, o motivo de bloqueio da data.

### `POST /appointments`

```json
{
  "patientName": "Maria Silva",
  "phone": "11999999999",
  "date": "2026-02-10",
  "time": "10:00"
}
```

### `GET /appointments`

Lista todos os agendamentos em ordem cronológica.

As rotas também estão disponíveis com o prefixo `/api`, usado pelo frontend.

## Validação

```bash
npm run check
```

O comando executa os testes automatizados, a checagem TypeScript e o build de produção.

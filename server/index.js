import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import express from 'express'
import { createApp } from './app.js'

const app = createApp()
const distPath = resolve('dist')

if (existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*splat', (_request, response) => response.sendFile(resolve(distPath, 'index.html')))
}

const port = Number(process.env.PORT || 3333)
app.listen(port, () => console.log(`Clínica Aurora disponível em http://localhost:${port}`))

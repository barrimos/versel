import dotenv from 'dotenv'
import express from 'express'
import http from 'http'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { Redis } from '@upstash/redis'

dotenv.config()
const PORT = process.env.PORT || 8002
const app = express()

const allowedOrigins = process.env.corsOrigin ? [process.env.corsOrigin] : ['http://localhost:3000']

const corsOptions = {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}

app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Upstash Redis (REST API - safe for serverless)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

app.post('/api/set', async (req, res) => {
  try {
    const { key, value } = req.body
    await redis.set(key, value)
    res.json({ success: true, message: 'Stored successfully' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.get('/api/get', async (req, res) => {
  try {
    const { key } = req.query
    const value = await redis.get(key)
    res.json({ success: true, value })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.get('/health', (req, res) => res.json({ status: 'ok' }))


// Local dev fallback
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
  })
}

export default app

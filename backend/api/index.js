import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { initRedis, getRedis } from '../src/config/redis.js'

const app = express()

// Dynamic CORS Configuration
const allowedOrigins = process.env.corsOrigin ? [process.env.corsOrigin] : ['http://localhost:3000']
const corsOptions = {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}

// Middlewares
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Immediate async initialization for Serverless environments
initRedis().catch(err => console.error('Failed to pre-init Redis:', err))

// API Routes
app.post('/api/set', async (req, res) => {
  try {
    const { key, value } = req.body
    const redis = getRedis()
    await redis.set(key, value)
    res.json({ success: true, message: 'Stored successfully' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.get('/api/get', async (req, res) => {
  try {
    const { key } = req.query
    const redis = getRedis()
    const value = await redis.get(key)
    res.json({ success: true, value })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.get('/health', (req, res) => res.json({ status: 'ok' }))

export default app

import dotenv from 'dotenv'
import app from '../api/index.js'
import { getRedis } from './config/redis.js'

dotenv.config()
const PORT = process.env.PORT || 8002
let isRedisConnected = false

const startLocalServer = async () => {
  try {
    // 1. Fire up the Express network listener immediately
    app.listen(PORT, () => {
      console.log(`🚀 Development server successfully running on port ${PORT}`)
    })

    // 2. Connect to Redis concurrently without blocking port allocation
    console.log('🔄 Connecting to storage layers...')
    const connectRedisOnce = async () => {
      if (isRedisConnected) return
      await getRedis()
      isRedisConnected = true
    }
    
  } catch (error) {
    console.error('💥 Critical error spinning up development runtime:', error)
    process.exit(1)
  }
}

startLocalServer()

import { Redis as UpstashRedis } from '@upstash/redis'
import { createClient as createLocalClient } from 'redis'

let redisInstance = null
let connectionPromise = null // Track the active connection process

export const initRedis = async () => {
  // 1. If it's fully connected, return the instance immediately
  if (redisInstance) return redisInstance

  // 2. If a connection is already in progress, wait for it instead of starting a new one
  if (connectionPromise) {
    return connectionPromise
  }

  // 3. Create the connection promise
  connectionPromise = (async () => {
    if (process.env.NODE_ENV === 'production') {
      redisInstance = new UpstashRedis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
      console.log('☁️ Production Upstash Redis initialized')
    } else {
      const client = createLocalClient({
        url: 'redis://127.0.0.1:6380'
      })

      client.on('error', (err) => console.error('❌ Local Redis Client Error:', err))
      await client.connect()
      
      redisInstance = client
      console.log('🐳 Connected to Local Docker Redis on port 6380')
    }
    return redisInstance
  })()

  return connectionPromise
}

export const getRedis = () => {
  if (!redisInstance) {
    throw new Error('Redis client has not been initialized yet!')
  }
  return redisInstance
}

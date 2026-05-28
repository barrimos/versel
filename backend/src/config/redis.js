import { createClient } from 'redis'

// 1. ประกาศตัวแปรไว้ใน Global Scope (และรองรับ TypeScript/Node Global setup)
let globalRedisClient

export const getRedis = async () => {
  const isProd = process.env.NODE_ENV === 'production'
  
  // 2. ถ้ามี Client เดิมและเชื่อมต่ออยู่แล้ว ให้ Reuse ทันที (ใช้ได้ทั้ง Dev และ Prod)
  if (globalRedisClient?.isOpen) {
    return globalRedisClient
  }

  // 3. ถ้ายังไม่มี Instance ค่อยสร้างขึ้นมาใหม่
  if (!globalRedisClient) {
    const redisUrl = isProd 
      ? (process.env.REDIS_URL || process.env.REDIS_CLOUD_URL) 
      : 'redis://localhost:6380'

    globalRedisClient = createClient({
      url: redisUrl,
      // ใส่ Socket Configuration เฉพาะตอน Production เพื่อป้องกัน Vercel ค้าง
      ...(isProd && {
        socket: {
          connectTimeout: 5000,
          keepAlive: 5000,
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              return new Error('Redis connection failed permanently for this execution')
            }
            return Math.min(retries * 100, 1000)
          }
        }
      })
    })

    // ดักจับ Error ป้องกัน App Crash
    globalRedisClient.on('error', (err) => {
      console.error('💥 Redis Client Error:', err.message)
    })
  }

  // 4. สั่งเชื่อมต่อในกรณีที่ยังไม่ได้ Connect หรือสายหลุด
  if (!globalRedisClient.isOpen) {
    try {
      await globalRedisClient.connect()
      console.log(`🚀 Successfully connected to Redis (${process.env.NODE_ENV})`)
    } catch (connectError) {
      console.error('❌ Failed to establish Redis connection:', connectError)
      throw connectError
    }
  }

  return globalRedisClient
}

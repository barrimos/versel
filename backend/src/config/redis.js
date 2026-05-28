import { Redis as UpstashRedis } from '@upstash/redis'
import { createClient } from 'redis'

let redisInstance = null
let connectionPromise = null // Track the active connection process

// ตัวแปร Global เพื่อเก็บ Instance เอาไว้แชร์กันใน Memory ข้าม Request
let globalRedisClient = null

export const initRedis = async () => {
  // 1. ถ้า Client เคยเชื่อมต่อสำเร็จแล้ว ให้ดึงอันเดิมมาใช้ทันที ไม่ต้องต่อใหม่
  if (globalRedisClient?.isOpen) {
    console.log('🔄 Reusing existing Redis Cloud connection')
    return globalRedisClient
  }

  // 2. ถ้ายังไม่มี Client ให้สร้าง Instance ขึ้นมาพร้อมตั้งค่า Socket ป้องกันการค้าง
  if (!globalRedisClient) {
    globalRedisClient = createClient({
      // Vercel จะ Inject ตัวแปรนี้มาให้โดยอัตโนมัติเมื่อกด Link Integration
      url: process.env.REDIS_URL || process.env.REDIS_CLOUD_URL, 
      socket: {
        connectTimeout: 5000,    // ถ้าเชื่อมต่อไม่ติดภายใน 5 วินาที ให้ตัดทันที (ป้องกัน Vercel ค้าง)
        keepAlive: 5000,         // ส่งสัญญาณ Keep-Alive ทุกๆ 5 วินาที ป้องกัน Cloud Network ตัดสาย
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            // ถ้าพยายามต่อใหม่เกิน 3 ครั้ง ให้หยุดพยายาม เพื่อไม่ให้ฟังก์ชันค้างจนล่ม
            return new Error('Redis connection failed permanently for this execution')
          }
          return Math.min(retries * 100, 1000) // เว้นระยะก่อนลองใหม่
        }
      }
    })

    globalRedisClient.on('error', (err) => {
      console.error('💥 Redis Client Error Context:', err.message)
    })
  }

  // 3. สั่งเชื่อมต่อในกรณีที่ Instance มีอยู่แล้วแต่สายหลุดไป (Not Open)
  if (!globalRedisClient.isOpen) {
    try {
      await globalRedisClient.connect()
      console.log('🚀 Successfully connected to official Redis Cloud')
    } catch (connectError) {
      console.error('❌ Failed to establish initial Redis connection:', connectError)
      throw connectError
    }
  }

  return globalRedisClient
}

export const getRedis = () => {
  if (!redisInstance) {
    throw new Error('Redis client has not been initialized yet!')
  }
  return redisInstance
}

import { createClient } from 'redis'

// ใช้ตัวแปรเดียวใน Global Scope เพื่อแชร์ Connection ภายใน Container เดียวกัน
let globalRedisClient = null

/**
 * ฟังก์ชันสำหรับ Initialize และดึง Redis Client
 * รองรับการ Auto-connect หากสายหลุดหรือเชื่อมต่อครั้งแรก
 */
export const getRedis = async () => {
  // 1. ถ้าเชื่อมต่ออยู่แล้ว ให้ส่ง Client เดิมกลับไปใช้งานทันที (Reuse)
  if (globalRedisClient?.isOpen) {
    return globalRedisClient
  }

  // 2. ถ้ายังไม่มี Instance ให้สร้างขึ้นมาใหม่พร้อมตั้งค่า Socket ป้องกันการค้าง
  if (!globalRedisClient) {
    globalRedisClient = createClient({
      url: process.env.REDIS_URL || process.env.REDIS_CLOUD_URL, 
      socket: {
        connectTimeout: 5000,    // ถ้าเชื่อมต่อไม่ติดภายใน 5 วินาทีให้ตัดทันที ป้องกัน Vercel ค้าง (Timeout)
        keepAlive: 5000,         // ส่งสัญญาณ Keep-Alive ทุก 5 วินาทีเพื่อรักษาความเสถียรของสาย
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            // หากพยายามต่อใหม่เกิน 3 ครั้ง ให้หยุดพยายาม เพื่อไม่ให้ฟังก์ชันค้างจนโดน Vercel ปรับตังค์
            return new Error('Redis connection failed permanently for this execution')
          }
          // เว้นระยะห่างในการลองใหม่ (เช่น 100ms, 200ms, 300ms)
          return Math.min(retries * 100, 1000)
        }
      }
    })

    // ดักจับ Error เพื่อไม่ให้ Node.js Crash ทั้ง Process
    globalRedisClient.on('error', (err) => {
      console.error('💥 Redis Client Error:', err.message)
    })
  }

  // 3. สั่งเชื่อมต่อในกรณีที่สร้าง Client แล้วแต่ยังไม่ได้กด Connect หรือสายหลุดไป
  if (!globalRedisClient.isOpen) {
    try {
      await globalRedisClient.connect()
      console.log('🚀 Successfully connected to Redis Cloud')
    } catch (connectError) {
      console.error('❌ Failed to establish Redis connection:', connectError)
      throw connectError
    }
  }

  return globalRedisClient
}

const containerId = Math.random().toString(36).substring(7)
console.log(`[🚀 CONTAINER CREATED] New Instance Spawned! ID: ${containerId} at ${new Date().toISOString()}`)

import dotenv from 'dotenv'
import app from '../api/index.js'

dotenv.config()
const PORT = process.env.PORT || 8002

// 1. Fire up the Express network listener immediately
app.listen(PORT, () => {
  console.log(`🚀 Development server successfully running on port ${PORT}`)
})

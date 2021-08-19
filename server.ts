import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import connectDB from './config/db'
import fileRoutes from './routes/files'
import { v2 as cloudinary } from 'cloudinary'

dotenv.config()

const app = express()
const { use, listen } = app
const { config } = cloudinary
const { PORT, CLOUDINARY_API_CLOUD, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

cloudinary.config({
  cloud_name: CLOUDINARY_API_CLOUD,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
})

connectDB()

app.use('/api/files', fileRoutes)
app.listen(PORT, () => console.log(`Server running on ${PORT}`))

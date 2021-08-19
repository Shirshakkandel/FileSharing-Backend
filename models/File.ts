import mongoose from 'mongoose'
const { Schema, model } = mongoose

interface IFile extends Document {
  filename: string
  secure_url: string
  sizeInBytes: string
  format: string
  sender?: string
  receiver?: string
}

const fileSchema = new Schema({
  filename: { type: String, required: true },
  secure_url: { type: String, required: true },
  format: { type: String, required: true },
  sizeInBytes: { type: String, required: true },
  sender: { type: String },
  receiver: { type: String },
})

export default mongoose.model<IFile>('File', fileSchema)

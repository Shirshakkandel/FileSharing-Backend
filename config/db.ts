import mongoose from 'mongoose'
const { connect, connection } = mongoose
const { on, readyState } = connection

export default async function dbConnect() {
  try {
    await connect(process.env.MONGO_URI!, {
      useCreateIndex: true,
      useFindAndModify: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
  } catch (error) {
    console.log('Connection Error', error.message)
  }
  const { readyState, on } = connection

  if (readyState >= 1) {
    console.log('connection to databse')
    return
  }
  on('error', () => console.log('connection failed'))
}

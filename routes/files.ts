import express from 'express'
import multer from 'multer'
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary'
import File from '../models/File'
import https from 'https'
import nodemailer from 'nodemailer'
import createEmailTemplate from '../utils/createEmailTemplate'

const router = express.Router()

//layout
const { diskStorage } = multer
const { upload } = cloudinary.uploader

const { create, findById } = File
var { post, get } = router
// var { get } = https

const storage = diskStorage({})
let multerUpload = multer({ storage })
//upload file routes
router.post('/upload', multerUpload.single('myFile'), async (req, res) => {
  const { file } = req
  const { status, json } = res

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Hey bro! You need the file' })
    }

    let uploadedFile: UploadApiResponse
    try {
      uploadedFile = await upload(req.file.path, {
        folder: 'sharemeYt',
        resource_type: 'auto',
      })
    } catch (error) {
      console.log(error.message)
      return res.status(400).json({ message: 'Cloudinary Error' })
    }

    const { originalname } = req.file
    const { secure_url, bytes, format } = uploadedFile
    //Putting into Database
    const file = await File.create({
      filename: originalname,
      sizeInBytes: bytes,
      secure_url,
      format,
    })
    const { API_BASE_ENDPOINT_CLIENT } = process.env
    res
      .status(200)
      .json({ id: file._id, downloadPageLink: `${API_BASE_ENDPOINT_CLIENT}/download/${file._id}` })
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ message: 'Server Errror' })
  }
})

//get uploaded file by id
router.get('/:id', async (req, res) => {
  let { id } = req.params
  let { status, json } = res
  try {
    const id = req.params.id
    const file = await File.findById(id)
    if (!file) {
      return res.status(404).json({ message: 'File does not exist' })
    }

    const { filename, format, sizeInBytes } = file

    return res.status(200).json({
      name: filename,
      sizeInBytes,
      format,
      id,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Server Error :(' })
  }
})

//download uploaded file with id
router.get('/:id/download', async (req, res) => {
  try {
    const id = req.params.id
    const file = await File.findById(id)
    if (!file) {
      return res.status(404).json({ message: 'File does not exist' })
    }

    https.get(file.secure_url, (fileStream) => fileStream.pipe(res))
  } catch (error) {
    return res.status(500).json({ message: 'Server Error :(' })
  }
})

router.post('/email', async (req, res) => {
  //1.validate request
  const { id, emailFrom, emailTo } = req.body

  //2.check if the file exits
  const file = await File.findById(id)
  if (!file) return res.status(404).json({ message: 'File does not exist' })

  //3.create transportor
  let transporter = nodemailer.createTransport({
    // @ts-ignore
    host: process.env.SENDINBLUE_SMTP_HOST!,
    port: process.env.SENDINBLUE_SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SENDINBLUE_SMTP_USER,
      pass: process.env.SENDINBLUE_SMTP_PASSWORD,
    },
    //code to make
    tls: { rejectUnauthorized: false },
  })
  //4.prepare the email data
  const { filename, sizeInBytes } = file
  const fileSize = `${(Number(sizeInBytes) / (1024 * 1024)).toFixed(2)} MB`
  const downloadPageLink = `${process.env.API_BASE_ENDPOINT_CLIENT}/download/${id}`

  const mailOptions = {
    from: emailFrom, // sender address
    to: emailTo, // list of receivers
    subject: 'File shared with you', // Subject line
    text: `${emailFrom} shared a file with you`, // plain text body
    html: createEmailTemplate(emailFrom, downloadPageLink, filename, fileSize), // html body
  }

  //5.send email using the transporter

  transporter.sendMail(mailOptions, async (error, info) => {
    if (error) {
      console.log(error)
      return res.status(500).json({
        message: 'server error :(',
      })
    }

    file.sender = emailFrom
    file.receiver = emailTo

    await file.save()
    return res.status(200).json({
      message: 'Email Sent',
    })
  })

  //6.save the data and send the response
})

export default router

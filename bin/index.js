// NPM Module dependencies.
const express = require('express')
const mongoose = require('mongoose')
const gridfs = require('gridfs-stream')
const multer = require('multer')
const upload = multer()

// NodeJS Module dependendies
const { Readable } = require('stream')

// Create Express Server
const app = express()

mongoose.connect('mongodb://localhost/images')
mongoose.Promise = global.Promise

gridfs.mongo = mongoose.mongo

const connection = mongoose.connection
connection.on('error', console.error.bind(console, 'connection error:'))
connection.once('open', () => {
  const gfs = gridfs(connection.db)

  app.get('/', (req, res) => {
    res.send('ExpressJS Image To GridFS - Service is Working')
  })

  app.post('/image/upload', upload.single('animalImage'), (req, res) => {
    console.log(req.file)
    const imageName = req.file.originalname
    const fileBuffer = req.file.buffer

    const readableStream = new Readable()
    readableStream.push(fileBuffer)
    readableStream.push(null)

    const writestream = gfs.createWriteStream({ filename: imageName })
    readableStream.pipe(writestream)
    writestream.on('close', function (file) {
      res.send(file.filename)
    })
  })

  app.get('/image/:imageName', (req, res) => {
    const imageName = req.params.imageName
    gfs.exist({ filename: imageName }, (err, file) => {
      if (err || !file) {
        res.send('File Not Found')
      } else {
        var readstream = gfs.createReadStream({ filename: imageName })
        readstream.pipe(res)
      }
    })
  })

  app.get('/image/remove/:imageName', (req, res) => {
    const imageName = req.params.imageName
    gfs.exist({ filename: imageName }, (err, file) => {
      if (err || !file) {
        res.send('File Not Found')
      } else {
        gfs.remove({ filename: imageName }, (err) => {
          if (err) res.send(err)
          res.send('File Deleted')
        })
      }
    })
  })

  app.get('/image/meta/:imageName', (req, res) => {
    const imageName = req.params.imageName
    gfs.exist({ filename: imageName }, (err, file) => {
      if (err || !file) {
        res.send('File Not Found')
      } else {
        gfs.files.find({ filename: imageName }).toArray((err, files) => {
          if (err) res.send(err)
          res.send(files)
        })
      }
    })
  })

  app.listen(8081, () => console.log('ExpressJS Image To GridFS service listening on port 8081!'))
})

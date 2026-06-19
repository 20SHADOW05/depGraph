import express from 'express';
const server = express();

import cookieParser from 'cookie-parser';
import multer from 'multer';
import cors from 'cors';

server.use(cors());
app.use(cookieParser());
server.use(express.json());
server.use(express.urlencoded({ extended : true }));

import uploadRouter from './routes/uploadRoute.js';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 7 * 1024 * 1024 },
    fileFilter: (req, file, callBack) => {
    const allowed = [
      'package-lock.json',
      // 'requirements.txt',
      // 'poetry.lock',
      // 'Cargo.lock',
      // 'go.mod',
      // 'go.sum'
    ]
    if (allowed.includes(file.originalname)) {
      callBack(null, true)
    } else {
      callBack(new Error('Unsupported file type'))
    }
  }
});

server.use('/graph', upload.single('file'), uploadRouter);

server.use((err, req, res, next) => {
    return res.status(400).json({ error: err.message });
})

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
})
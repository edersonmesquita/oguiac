import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Gerar UUID para garantir nomes únicos
    const uuid = uuidv4();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `logo_${uuid}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  }
});

// Rota para upload de arquivo com redimensionamento
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const filePath = req.file.path;
    
    // Retorna a URL da imagem no formato /uploads/logo_UUID.jpeg
    const fileUrl = `/uploads/${req.file.filename}`;
    
    // Opcional: redimensionar a imagem mantendo o mesmo nome
    await sharp(filePath)
      .resize(800, 800, { fit: 'inside' })
      .toFile(filePath + '.temp');
    
    fs.unlinkSync(filePath);
    fs.renameSync(filePath + '.temp', filePath);

    console.log('Arquivo salvo:', fileUrl);
    res.json({ url: fileUrl });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro ao fazer upload do arquivo' });
  }
});

export default router;
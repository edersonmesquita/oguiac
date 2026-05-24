import { Router } from 'express';
import { CompanyDashboardController } from '../controllers/CompanyDashboardController';
import { authMiddleware } from '../middlewares/auth.middleware';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const router = Router();
const companyDashboardController = new CompanyDashboardController();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    // Generate a unique filename with original extension
    const hash = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(file.originalname);
    cb(null, `${hash}-${Date.now()}${extension}`);
  }
});

// Create upload middleware
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!') as any);
    }
  }
});

// Company profile routes
router.get('/profile', authMiddleware, companyDashboardController.getProfile);
router.put('/profile', authMiddleware, upload.single('logo'), companyDashboardController.updateProfile);

// Plans routes
router.get('/plans', authMiddleware, companyDashboardController.getPlans);

export default router; 
// config/multer_config.js
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ FIX: Use memory storage instead of disk storage for Render compatibility
// Render has ephemeral filesystem - files are deleted on restart/redeploy
// Memory storage is faster and more reliable for cloud uploads
const storage = multer.memoryStorage();

// File filter - only accept images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Multer configuration
export const uploadHazardImage = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: fileFilter
});

// ✅ FIX: Error handler middleware for multer errors
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Image file too large. Maximum size is 5MB.'
      });
    }
    return res.status(400).json({
      error: `File upload error: ${err.message}`
    });
  } else if (err) {
    return res.status(400).json({
      error: err.message || 'File upload failed'
    });
  }
  next();
};
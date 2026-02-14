const multer = require('multer');
const path = require('path');

// Configuration du stockage local
const stockage = multer.diskStorage({
  destination: (req, fichier, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, fichier, cb) => {
    const nomUnique = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(fichier.originalname)}`;
    cb(null, nomUnique);
  }
});

// Filtre : accepter images et audio
const filtrerFichier = (req, fichier, cb) => {
  const typesImages = /jpeg|jpg|png|webp/;
  const typesAudio = /webm|mp3|wav|ogg|mpeg|mp4/;

  const ext = path.extname(fichier.originalname).toLowerCase();
  const mime = fichier.mimetype;

  // Photos
  if (fichier.fieldname === 'photos') {
    if (typesImages.test(ext) && typesImages.test(mime)) {
      return cb(null, true);
    }
    return cb(new Error('Seules les images (JPEG, PNG, WEBP) sont autorisées.'), false);
  }

  // Audio
  if (fichier.fieldname === 'audio') {
    if (typesAudio.test(ext) || typesAudio.test(mime)) {
      return cb(null, true);
    }
    return cb(new Error('Seuls les fichiers audio (WEBM, MP3, WAV, OGG) sont autorisés.'), false);
  }

  cb(null, true);
};

const upload = multer({
  storage: stockage,
  limits: { fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 5 * 1024 * 1024 }, // 5MB
  fileFilter: filtrerFichier
});

module.exports = upload;

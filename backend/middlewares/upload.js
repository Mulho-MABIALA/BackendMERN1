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

// Filtre : accepter uniquement les images
const filtrerFichier = (req, fichier, cb) => {
  const typesAutorises = /jpeg|jpg|png|webp/;
  const extensionValide = typesAutorises.test(path.extname(fichier.originalname).toLowerCase());
  const mimeValide = typesAutorises.test(fichier.mimetype);

  if (extensionValide && mimeValide) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images (JPEG, PNG, WEBP) sont autorisées.'), false);
  }
};

const upload = multer({
  storage: stockage,
  limits: { fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 5 * 1024 * 1024 }, // 5MB
  fileFilter: filtrerFichier
});

module.exports = upload;

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const connecterBD = require('./config/db');

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialiser Express
const app = express();

// ===== Connexion à MongoDB =====
connecterBD();

// ===== Middlewares globaux =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers uploadés
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== Routes API =====
app.use('/api', require('./routes/routes'));

// ===== Route de test =====
app.get('/api', (req, res) => {
  res.json({
    succes: true,
    message: 'Bienvenue sur l\'API ECOHUB',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      signalements: '/api/signalements',
      utilisateurs: '/api/utilisateurs',
      notifications: '/api/notifications',
      statistiques: '/api/statistiques',
      configuration: '/api/configuration',
      commentaires: '/api/commentaires',
      ventesDechets: '/api/ventes-dechets'
    }
  });
});

// ===== Gestion des erreurs globale =====
app.use((err, req, res, next) => {
  console.error('❌ Erreur:', err.message);

  // Erreur Multer (upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      succes: false,
      message: 'Le fichier est trop volumineux. Taille max : 5MB.'
    });
  }

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      succes: false,
      message: 'Erreur de validation',
      erreurs: messages
    });
  }

  // Erreur de clé dupliquée
  if (err.code === 11000) {
    const champ = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      succes: false,
      message: `La valeur du champ "${champ}" existe déjà.`
    });
  }

  // Erreur par défaut
  res.status(err.statusCode || 500).json({
    succes: false,
    message: err.message || 'Erreur interne du serveur.'
  });
});

// ===== Démarrage du serveur =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur ECOHUB démarré sur le port ${PORT}`);
  console.log(`📍 API : http://localhost:${PORT}/api`);
  console.log(`🌍 Environnement : ${process.env.NODE_ENV}`);
});

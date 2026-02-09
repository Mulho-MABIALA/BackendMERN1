const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const schemaUtilisateur = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "L'email est obligatoire"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Format d'email invalide"]
  },
  motDePasse: {
    type: String,
    required: [true, 'Le mot de passe est obligatoire'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
    select: false // Ne pas retourner le mot de passe par défaut
  },
  role: {
    type: String,
    enum: ['citoyen', 'agent', 'admin'],
    default: 'citoyen',
    required: true
  },

  // Données civiques
  prenom: { type: String, trim: true },
  nom: { type: String, trim: true },
  telephone: { type: String, trim: true },
  adresse: {
    rue: String,
    ville: String,
    codePostal: String,
    coordonnees: {
      lat: Number,
      lng: Number
    }
  },

  // Préférences de notification
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false }
  },

  // Paramètres spécifiques agent/admin
  zoneAssignee: { type: String },       // Pour les agents
  permissions: [String],                 // Pour les admins
  departement: { type: String },         // Pour les agents

  // Métadonnées
  estAnonyme: { type: Boolean, default: false },
  estActif: { type: Boolean, default: true },
  derniereConnexion: Date,

  // Statistiques
  statistiques: {
    signalementsEnvoyes: { type: Number, default: 0 },
    signalementsResolus: { type: Number, default: 0 },
    tempsReponseMoyen: Number
  }
}, {
  timestamps: { createdAt: 'creeLe', updatedAt: 'misAJourLe' }
});

// Hash du mot de passe avant sauvegarde
schemaUtilisateur.pre('save', async function () {
  if (!this.isModified('motDePasse')) return;
  const sel = await bcrypt.genSalt(10);
  this.motDePasse = await bcrypt.hash(this.motDePasse, sel);
});

// Comparer le mot de passe
schemaUtilisateur.methods.comparerMotDePasse = async function (motDePasseSaisi) {
  return await bcrypt.compare(motDePasseSaisi, this.motDePasse);
};

// Générer un token JWT
schemaUtilisateur.methods.genererToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

module.exports = mongoose.model('Utilisateur', schemaUtilisateur);

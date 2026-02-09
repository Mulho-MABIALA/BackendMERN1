const mongoose = require('mongoose');

const schemaRegroupement = new mongoose.Schema({
  idRegroupement: {
    type: String,
    unique: true
  },

  // Zone géographique
  centre: {
    coordonnees: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number] // [longitude, latitude]
    },
    rayon: Number // en mètres
  },

  // Signalements liés
  signalements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Signalement' }],
  nombreSignalements: { type: Number, default: 0 },

  // Catégorisation
  categoriePrincipale: String,
  categories: [{
    categorie: String,
    nombre: Number
  }],

  // Métriques
  scorePrioriteMoyen: Number,
  niveauUrgence: {
    type: String,
    enum: ['faible', 'moyen', 'eleve', 'urgent'],
    default: 'moyen'
  },
  datePremierSignalement: Date,
  dateDernierSignalement: Date,

  // État
  estActif: { type: Boolean, default: true },
  estResolu: { type: Boolean, default: false },
  resoluLe: Date,

  // Affectation
  agentAssigne: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur' },
  equipe: [String]
}, {
  timestamps: { createdAt: 'creeLe', updatedAt: 'misAJourLe' }
});

schemaRegroupement.index({ 'centre.coordonnees': '2dsphere' });

// Génération auto de l'ID
schemaRegroupement.pre('save', async function () {
  if (!this.idRegroupement) {
    const compteur = await mongoose.model('Regroupement').countDocuments();
    this.idRegroupement = `GRP-${Date.now()}-${String(compteur + 1).padStart(4, '0')}`;
  }
});

module.exports = mongoose.model('Regroupement', schemaRegroupement);

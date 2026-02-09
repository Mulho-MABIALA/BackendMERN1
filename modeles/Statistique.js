const mongoose = require('mongoose');

const schemaStatistique = new mongoose.Schema({
  periode: {
    type: String,
    enum: ['quotidien', 'hebdomadaire', 'mensuel', 'annuel'],
    required: true
  },
  dateDebut: { type: Date, required: true },
  dateFin: { type: Date, required: true },

  // Métriques générales
  totalSignalements: { type: Number, default: 0 },
  signalementsParCategorie: [{
    categorie: String,
    nombre: Number,
    resolus: Number
  }],

  // Performances
  tempsResolutionMoyen: Number, // en heures
  tauxResolution: Number,       // pourcentage
  signalementsParStatut: {
    recu: { type: Number, default: 0 },
    en_cours: { type: Number, default: 0 },
    resolu: { type: Number, default: 0 },
    rejete: { type: Number, default: 0 }
  },

  // Utilisateurs
  utilisateursActifs: { type: Number, default: 0 },
  nouveauxUtilisateurs: { type: Number, default: 0 },
  signalementsParUtilisateur: Number,

  // Zones
  pointsChauds: [{
    quartier: String,
    nombreSignalements: Number,
    categorieTop: String
  }],

  // Satisfaction
  votesRecus: { type: Number, default: 0 },
  commentairesMoyenParSignalement: Number,

  // Performance agents
  meilleursAgents: [{
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur' },
    signalementsResolus: Number,
    tempsMoyen: Number
  }]
}, {
  timestamps: { createdAt: 'genereeLe' }
});

module.exports = mongoose.model('Statistique', schemaStatistique);

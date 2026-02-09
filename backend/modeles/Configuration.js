const mongoose = require('mongoose');

const schemaConfiguration = new mongoose.Schema({
  // Pondérations de priorité
  ponderationsPriorite: {
    nombreSignalements: { type: Number, default: 30, min: 0, max: 100 },
    niveauDanger: { type: Number, default: 35, min: 0, max: 100 },
    proximiteZoneSensible: { type: Number, default: 25, min: 0, max: 100 },
    anciennete: { type: Number, default: 10, min: 0, max: 100 }
  },

  // Zones sensibles
  zonesSensibles: [{
    nom: String,
    type: {
      type: String,
      enum: ['ecole', 'hopital', 'marche', 'espace_public']
    },
    coordonnees: [Number], // [longitude, latitude]
    rayon: Number // en mètres
  }],

  // Seuils
  seuils: {
    prioriteUrgente: { type: Number, default: 80 },
    prioriteElevee: { type: Number, default: 60 },
    prioriteMoyenne: { type: Number, default: 40 },
    rayonRegroupement: { type: Number, default: 100 },       // en mètres
    minimumSignalementsRegroupement: { type: Number, default: 3 }
  },

  // Catégories
  categories: [{
    id: String,
    nom: String,
    sousCategories: [String],
    prioriteParDefaut: String,
    icone: String,
    couleur: String
  }],

  // Paramètres notifications
  parametresNotifications: {
    miseAJourStatutCitoyen: { type: Boolean, default: true },
    assignationAgent: { type: Boolean, default: true },
    creationRegroupement: { type: Boolean, default: true },
    signalementResolu: { type: Boolean, default: true }
  },

  modifieePar: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur' }
}, {
  timestamps: { createdAt: 'creeLe', updatedAt: 'misAJourLe' }
});

module.exports = mongoose.model('Configuration', schemaConfiguration);

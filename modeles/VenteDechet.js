const mongoose = require('mongoose');

const schemaVenteDechet = new mongoose.Schema({
  // Identification
  idVente: {
    type: String,
    unique: true
    // Généré automatiquement via pre-save
  },

  // Type de déchet
  typeDechet: {
    type: String,
    enum: {
      values: ['plastique', 'fer'],
      message: 'Type de déchet invalide. Choix : plastique, fer'
    },
    required: [true, 'Le type de déchet est obligatoire']
  },

  // Poids en kilogrammes
  poidsKg: {
    type: Number,
    required: [true, 'Le poids en kg est obligatoire'],
    min: [0.5, 'Le poids minimum est de 0.5 kg'],
    max: [10000, 'Le poids maximum est de 10 000 kg']
  },

  // Description optionnelle
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },

  // Photos du déchet
  photos: [{
    url: String,
    dateUpload: { type: Date, default: Date.now }
  }],

  // Localisation pour récupération
  localisation: {
    coordonnees: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] }
    },
    adresse: { type: String },
    quartier: { type: String },
    ville: { type: String, default: 'Dakar' }
  },

  // Prix
  prixPropose: {
    type: Number,
    default: null
    // Prix proposé par l'admin (en FCFA)
  },
  prixParKg: {
    type: Number,
    default: null
    // Prix par kg fixé par l'admin
  },
  prixTotal: {
    type: Number,
    default: null
    // prixParKg * poidsKg
  },

  // Statut de la vente
  statut: {
    type: String,
    enum: ['en_attente', 'prix_propose', 'accepte', 'refuse', 'complete', 'annule'],
    default: 'en_attente'
  },

  // Citoyen qui propose la vente
  citoyen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: [true, 'Le citoyen est obligatoire']
  },

  // Admin qui traite la vente
  traitePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    default: null
  },

  // Dates
  traiteLe: Date,
  completeLe: Date,

  // Commentaire admin
  commentaireAdmin: {
    type: String,
    trim: true,
    maxlength: [500, 'Le commentaire ne peut pas dépasser 500 caractères']
  },

  // Réponse du citoyen
  reponseCitoyen: {
    type: String,
    trim: true,
    maxlength: [500, 'La réponse ne peut pas dépasser 500 caractères']
  },

  // Historique
  historique: [{
    statut: String,
    modifiePar: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur' },
    modifieLe: { type: Date, default: Date.now },
    commentaire: String
  }]
}, {
  timestamps: { createdAt: 'creeLe', updatedAt: 'misAJourLe' }
});

// Génération automatique de l'ID de vente
schemaVenteDechet.pre('save', async function () {
  if (!this.idVente) {
    const annee = new Date().getFullYear();
    const compteur = await mongoose.model('VenteDechet').countDocuments();
    this.idVente = `VNT-${annee}-${String(compteur + 1).padStart(6, '0')}`;
  }

  // Calculer le prix total si prixParKg est défini
  if (this.prixParKg && this.poidsKg) {
    this.prixTotal = Math.round(this.prixParKg * this.poidsKg);
  }

  // Ajouter au historique si le statut a changé
  if (this.isModified('statut')) {
    this.historique.push({
      statut: this.statut,
      modifieLe: new Date(),
      commentaire: `Statut changé en "${this.statut}"`
    });
  }
});

module.exports = mongoose.model('VenteDechet', schemaVenteDechet);

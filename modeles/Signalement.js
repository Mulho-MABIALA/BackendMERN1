const mongoose = require('mongoose');

const schemaSignalement = new mongoose.Schema({
  // Identification
  idSignalement: {
    type: String,
    unique: true
    // Généré automatiquement via pre-save
  },
  titre: {
    type: String,
    required: [true, 'Le titre est obligatoire'],
    trim: true,
    maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères']
  },
  description: {
    type: String,
    required: [true, 'La description est obligatoire'],
    minlength: [20, 'La description doit contenir au moins 20 caractères'],
    maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
  },

  // Catégorisation
  categorie: {
    type: String,
    enum: {
      values: ['routes', 'eclairage', 'dechets', 'eau', 'securite', 'inondation', 'autre'],
      message: 'Catégorie invalide'
    },
    required: [true, 'La catégorie est obligatoire']
  },
  sousCategorie: { type: String, trim: true },

  // Localisation
  localisation: {
    coordonnees: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true } // [longitude, latitude]
    },
    adresse: { type: String },
    quartier: { type: String },
    ville: { type: String, required: [true, 'La ville est obligatoire'] },
    pointDeRepere: { type: String },
    proximiteZoneSensible: {
      type: String,
      enum: ['ecole', 'hopital', 'marche', 'espace_public', 'aucune'],
      default: 'aucune'
    }
  },

  // État et priorité
  statut: {
    type: String,
    enum: ['recu', 'en_cours', 'resolu', 'rejete'],
    default: 'recu'
  },
  priorite: {
    type: String,
    enum: ['faible', 'moyen', 'eleve', 'urgent'],
    default: 'moyen'
  },
  scorePriorite: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },

  // Photos
  photos: [{
    url: String,
    miniatureUrl: String,
    dateUpload: { type: Date, default: Date.now },
    description: String,
    estVerifiee: { type: Boolean, default: false }
  }],

  // Audio vocal
  audio: {
    url: String,
    duree: Number, // en secondes
    dateUpload: { type: Date }
  },

  // Métadonnées
  estAnonyme: { type: Boolean, default: false },
  aSignalementsMultiples: { type: Boolean, default: false },
  regroupementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Regroupement' },
  doublonDe: { type: mongoose.Schema.Types.ObjectId, ref: 'Signalement' },

  // Dates
  resoluLe: Date,
  tempsResolutionEstime: Date,

  // Liens
  soumisePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: [true, "L'auteur du signalement est obligatoire"]
  },
  assigneA: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur' },
  assigneLe: Date,

  // Interactions citoyennes
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur' }],
  nombreVotes: { type: Number, default: 0 },
  nombreCommentaires: { type: Number, default: 0 },
  partages: { type: Number, default: 0 },

  // Analyse IA
  analyseIA: {
    confianceCategorie: Number,    // 0-1
    niveauUrgence: String,
    tagImages: [String],
    descriptionAutomatique: String,
    objetsDetectes: [String]
  },

  // Historique des statuts
  historiqueStatuts: [{
    statut: String,
    modifiePar: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur' },
    modifieLe: { type: Date, default: Date.now },
    commentaire: String
  }],

  // Résolution
  resolution: {
    description: String,
    photos: [{
      url: String,
      legende: String,
      estPhotoAvant: Boolean
    }],
    cout: Number,
    ressourcesUtilisees: [String],
    valideePar: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur' }
  },

  // Rejet
  rejet: {
    raison: String,
    explication: String,
    rejetePar: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur' },
    rejeteLe: Date
  }
}, {
  timestamps: { createdAt: 'creeLe', updatedAt: 'misAJourLe' }
});

// Index géospatial pour les requêtes de proximité
schemaSignalement.index({ 'localisation.coordonnees': '2dsphere' });

// Génération automatique de l'ID de signalement
schemaSignalement.pre('save', async function () {
  if (!this.idSignalement) {
    const annee = new Date().getFullYear();
    const compteur = await mongoose.model('Signalement').countDocuments();
    this.idSignalement = `SIG-${annee}-${String(compteur + 1).padStart(6, '0')}`;
  }

  // Ajouter au historique des statuts si le statut a changé
  if (this.isModified('statut')) {
    this.historiqueStatuts.push({
      statut: this.statut,
      modifieLe: new Date(),
      commentaire: `Statut changé en "${this.statut}"`
    });
  }
});

module.exports = mongoose.model('Signalement', schemaSignalement);

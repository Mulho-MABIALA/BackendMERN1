const mongoose = require('mongoose');

const schemaNotification = new mongoose.Schema({
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: [true, "L'utilisateur destinataire est obligatoire"]
  },

  // Contenu
  titre: {
    type: String,
    required: [true, 'Le titre est obligatoire'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Le message est obligatoire'],
    trim: true
  },
  type: {
    type: String,
    enum: [
      'changement_statut',
      'signalement_assigne',
      'nouveau_commentaire',
      'regroupement_cree',
      'priorite_augmentee',
      'signalement_resolu',
      'annonce',
      'rappel'
    ]
  },

  // Liens
  signalementLie: { type: mongoose.Schema.Types.ObjectId, ref: 'Signalement' },
  regroupementLie: { type: mongoose.Schema.Types.ObjectId, ref: 'Regroupement' },
  lienAction: String,

  // État
  estLue: { type: Boolean, default: false },
  estEnvoyee: { type: Boolean, default: false },
  methodeLivraison: [{
    type: String,
    enum: ['email', 'push', 'sms']
  }],

  programmePour: Date,
  envoyeeLe: Date,
  lueLe: Date
}, {
  timestamps: { createdAt: 'creeLe', updatedAt: 'misAJourLe' }
});

// Index pour les requêtes fréquentes
schemaNotification.index({ utilisateur: 1, estLue: 1 });

module.exports = mongoose.model('Notification', schemaNotification);

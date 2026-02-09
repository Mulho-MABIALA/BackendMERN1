const mongoose = require('mongoose');

const schemaCommentaire = new mongoose.Schema({
  contenu: {
    type: String,
    required: [true, 'Le contenu du commentaire est obligatoire'],
    maxlength: [500, 'Le commentaire ne peut pas dépasser 500 caractères'],
    trim: true
  },
  signalement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Signalement',
    required: [true, 'Le signalement associé est obligatoire']
  },
  auteur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: [true, "L'auteur est obligatoire"]
  },

  // Type de commentaire
  type: {
    type: String,
    enum: ['mise_a_jour_citoyen', 'mise_a_jour_agent', 'note_interne'],
    default: 'mise_a_jour_citoyen'
  },

  // Visibilité
  visibilite: {
    type: String,
    enum: ['public', 'agents_seulement', 'admin_seulement'],
    default: 'public'
  },

  // Pièces jointes
  piecesJointes: [{
    url: String,
    type: {
      type: String,
      enum: ['image', 'document']
    }
  }],

  estModifie: { type: Boolean, default: false },

  // Interactions
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur' }],
  reponseA: { type: mongoose.Schema.Types.ObjectId, ref: 'Commentaire' }
}, {
  timestamps: { createdAt: 'creeLe', updatedAt: 'misAJourLe' }
});

// Après création d'un commentaire, incrémenter le compteur sur le signalement
schemaCommentaire.post('save', async function () {
  const Signalement = mongoose.model('Signalement');
  await Signalement.findByIdAndUpdate(this.signalement, {
    $inc: { nombreCommentaires: 1 }
  });
});

module.exports = mongoose.model('Commentaire', schemaCommentaire);

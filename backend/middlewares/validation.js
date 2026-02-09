const { body, param, validationResult } = require('express-validator');

// Middleware pour gérer les erreurs de validation
const gererValidation = (req, res, next) => {
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) {
    return res.status(400).json({
      succes: false,
      message: 'Erreurs de validation',
      erreurs: erreurs.array().map(e => ({ champ: e.path, message: e.msg }))
    });
  }
  next();
};

// ===== Règles de validation : Inscription =====
const reglesInscription = [
  body('email').isEmail().withMessage("Format d'email invalide").normalizeEmail(),
  body('motDePasse').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('prenom').optional().trim().notEmpty().withMessage('Le prénom ne peut pas être vide'),
  body('nom').optional().trim().notEmpty().withMessage('Le nom ne peut pas être vide'),
  body('role').optional().isIn(['citoyen', 'agent', 'admin']).withMessage('Rôle invalide')
];

// ===== Règles de validation : Connexion =====
const reglesConnexion = [
  body('email').isEmail().withMessage("Format d'email invalide").normalizeEmail(),
  body('motDePasse').notEmpty().withMessage('Le mot de passe est obligatoire')
];

// ===== Règles de validation : Signalement =====
const reglesSignalement = [
  body('titre').trim().notEmpty().withMessage('Le titre est obligatoire').isLength({ max: 200 }).withMessage('Max 200 caractères'),
  body('description').trim().notEmpty().withMessage('La description est obligatoire').isLength({ min: 20 }).withMessage('Min 20 caractères'),
  body('categorie').isIn(['routes', 'eclairage', 'dechets', 'eau', 'securite', 'inondation', 'autre']).withMessage('Catégorie invalide'),
  body('localisation.ville').trim().notEmpty().withMessage('La ville est obligatoire')
];

// ===== Règles de validation : Commentaire =====
const reglesCommentaire = [
  body('contenu').trim().notEmpty().withMessage('Le contenu est obligatoire').isLength({ max: 500 }).withMessage('Max 500 caractères')
];

// ===== Règles de validation : Changement de statut =====
const reglesStatut = [
  body('statut').isIn(['recu', 'en_cours', 'resolu', 'rejete']).withMessage('Statut invalide'),
  body('commentaire').optional().trim()
];

// ===== Validation d'un ObjectId MongoDB =====
const validerObjectId = (req, res, next) => {
  if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ succes: false, message: 'ID invalide.' });
  }
  next();
};

module.exports = {
  reglesInscription,
  reglesConnexion,
  reglesSignalement,
  reglesCommentaire,
  reglesStatut,
  validerObjectId,
  gererValidation
};

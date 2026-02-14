const express = require('express');
const routeur = express.Router();
const { proteger, autoriser } = require('../middlewares/auth');
const { reglesSignalement, reglesStatut, validerObjectId, gererValidation } = require('../middlewares/validation');
const upload = require('../middlewares/upload');
const {
  creerSignalement,
  obtenirSignalements,
  obtenirSignalement,
  mesSignalements,
  changerStatut,
  assignerSignalement,
  voterSignalement,
  signalementsProximite,
  ajouterResolution
} = require('../controleurs/signalementControleur');

// Commentaires (sous-route des signalements)
const { ajouterCommentaire, obtenirCommentaires } = require('../controleurs/commentaireControleur');
const { reglesCommentaire } = require('../middlewares/validation');
// gererValidation already imported above

// Toutes les routes sont protégées
routeur.use(proteger);

// Routes citoyen
routeur.get('/mes-signalements', mesSignalements);
routeur.post('/', upload.fields([{ name: 'photos', maxCount: 5 }, { name: 'audio', maxCount: 1 }]), ...reglesSignalement, gererValidation, creerSignalement);
routeur.put('/:id/voter', validerObjectId, voterSignalement);

// Routes de consultation
routeur.get('/', obtenirSignalements);
routeur.get('/proximite/:lng/:lat/:distance', signalementsProximite);
routeur.get('/:id', validerObjectId, obtenirSignalement);

// Routes agent
routeur.put('/:id/statut', validerObjectId, autoriser('agent', 'admin'), ...reglesStatut, gererValidation, changerStatut);
routeur.put('/:id/resolution', validerObjectId, autoriser('agent', 'admin'), upload.array('photos', 5), ajouterResolution);

// Routes admin
routeur.put('/:id/assigner', validerObjectId, autoriser('admin'), assignerSignalement);

// Commentaires
routeur.post('/:id/commentaires', validerObjectId, ...reglesCommentaire, gererValidation, ajouterCommentaire);
routeur.get('/:id/commentaires', validerObjectId, obtenirCommentaires);

module.exports = routeur;

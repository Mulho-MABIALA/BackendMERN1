const express = require('express');
const routeur = express.Router();
const { proteger, autoriser } = require('../middlewares/auth');
const { validerObjectId } = require('../middlewares/validation');
const {
  obtenirUtilisateurs,
  obtenirUtilisateur,
  creerUtilisateur,
  mettreAJourUtilisateur,
  changerStatutUtilisateur,
  obtenirAgents
} = require('../controleurs/utilisateurControleur');

// Toutes les routes sont protégées et réservées aux admins
routeur.use(proteger, autoriser('admin'));

routeur.get('/', obtenirUtilisateurs);
routeur.get('/agents', obtenirAgents);
routeur.get('/:id', validerObjectId, obtenirUtilisateur);
routeur.post('/', creerUtilisateur);
routeur.put('/:id', validerObjectId, mettreAJourUtilisateur);
routeur.put('/:id/statut', validerObjectId, changerStatutUtilisateur);

module.exports = routeur;

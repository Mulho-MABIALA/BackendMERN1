const express = require('express');
const routeur = express.Router();
const { inscription, connexion, obtenirProfil, mettreAJourProfil } = require('../controleurs/authControleur');
const { proteger } = require('../middlewares/auth');
const { reglesInscription, reglesConnexion, gererValidation } = require('../middlewares/validation');

// Routes publiques
routeur.post('/inscription', ...reglesInscription, gererValidation, inscription);
routeur.post('/connexion', ...reglesConnexion, gererValidation, connexion);

// Routes protégées
routeur.get('/profil', proteger, obtenirProfil);
routeur.put('/profil', proteger, mettreAJourProfil);

module.exports = routeur;

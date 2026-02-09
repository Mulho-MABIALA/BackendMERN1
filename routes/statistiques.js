const express = require('express');
const routeur = express.Router();
const { proteger, autoriser } = require('../middlewares/auth');
const { obtenirStatistiques, obtenirStatsCitoyen, obtenirStatsPubliques } = require('../controleurs/statistiqueControleur');

// Route publique (pas de token requis)
routeur.get('/publiques', obtenirStatsPubliques);

routeur.use(proteger);

// Stats globales (admin)
routeur.get('/', autoriser('admin'), obtenirStatistiques);

// Stats citoyen
routeur.get('/citoyen', obtenirStatsCitoyen);

module.exports = routeur;

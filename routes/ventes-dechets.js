const express = require('express');
const routeur = express.Router();
const { proteger, autoriser } = require('../middlewares/auth');
const {
  creerVente,
  mesVentes,
  listeVentes,
  detailVente,
  proposerPrix,
  repondreOffre,
  completerVente,
  annulerVente,
  statistiquesVentes,
  obtenirPrix
} = require('../controleurs/venteDechetControleur');

// Routes publiques
routeur.get('/prix', obtenirPrix);

// Routes protégées
routeur.use(proteger);

// Routes citoyen
routeur.post('/', creerVente);
routeur.get('/mes-ventes', mesVentes);

// Routes admin - statistiques (avant :id pour éviter conflit)
routeur.get('/statistiques', autoriser('admin'), statistiquesVentes);

// Routes avec paramètre :id
routeur.get('/:id', detailVente);
routeur.put('/:id/proposer-prix', autoriser('admin'), proposerPrix);
routeur.put('/:id/repondre', repondreOffre);
routeur.put('/:id/completer', autoriser('admin'), completerVente);
routeur.put('/:id/annuler', annulerVente);

// Route admin - liste toutes les ventes
routeur.get('/', autoriser('admin'), listeVentes);

module.exports = routeur;

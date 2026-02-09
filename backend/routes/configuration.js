const express = require('express');
const routeur = express.Router();
const { proteger, autoriser } = require('../middlewares/auth');
const {
  obtenirConfiguration,
  mettreAJourConfiguration,
  ajouterZoneSensible
} = require('../controleurs/configurationControleur');

routeur.use(proteger, autoriser('admin'));

routeur.get('/', obtenirConfiguration);
routeur.put('/', mettreAJourConfiguration);
routeur.post('/zones-sensibles', ajouterZoneSensible);

module.exports = routeur;

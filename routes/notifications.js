const express = require('express');
const routeur = express.Router();
const { proteger } = require('../middlewares/auth');
const { validerObjectId } = require('../middlewares/validation');
const {
  obtenirNotifications,
  marquerCommeLue,
  toutMarquerCommeLu,
  supprimerNotification
} = require('../controleurs/notificationControleur');

routeur.use(proteger);

routeur.get('/', obtenirNotifications);
routeur.put('/tout-lire', toutMarquerCommeLu);
routeur.put('/:id/lire', validerObjectId, marquerCommeLue);
routeur.delete('/:id', validerObjectId, supprimerNotification);

module.exports = routeur;

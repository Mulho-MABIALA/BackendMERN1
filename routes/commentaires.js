const express = require('express');
const routeur = express.Router();
const { proteger } = require('../middlewares/auth');
const { validerObjectId } = require('../middlewares/validation');
const { likerCommentaire } = require('../controleurs/commentaireControleur');

routeur.use(proteger);

// Liker un commentaire
routeur.put('/:id/liker', validerObjectId, likerCommentaire);

module.exports = routeur;

const express = require('express');
const routeur = express.Router();

// ===== Regroupement de toutes les routes =====
routeur.use('/auth', require('./auth'));
routeur.use('/signalements', require('./signalements'));
routeur.use('/utilisateurs', require('./utilisateurs'));
routeur.use('/notifications', require('./notifications'));
routeur.use('/statistiques', require('./statistiques'));
routeur.use('/configuration', require('./configuration'));
routeur.use('/commentaires', require('./commentaires'));
routeur.use('/exports', require('./exports'));
routeur.use('/ventes-dechets', require('./ventes-dechets'));

module.exports = routeur;
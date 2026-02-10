const express = require('express');
const routeur = express.Router();
const { proteger, autoriser } = require('../middlewares/auth');
const { exporterCSV, exporterPDF } = require('../controleurs/exportControleur');

routeur.use(proteger);
routeur.get('/csv', autoriser('admin', 'agent'), exporterCSV);
routeur.get('/pdf', autoriser('admin', 'agent'), exporterPDF);

module.exports = routeur;

const Signalement = require('../modeles/Signalement');
const Utilisateur = require('../modeles/Utilisateur');
const Statistique = require('../modeles/Statistique');
const { asyncHandler, envoyerReponse } = require('../utilitaires/helpers');

// @desc    Obtenir les statistiques globales (temps réel)
// @route   GET /api/statistiques
// @acces   Privé (admin)
const obtenirStatistiques = asyncHandler(async (req, res) => {
  // Total par statut
  const parStatut = await Signalement.aggregate([
    { $group: { _id: '$statut', nombre: { $sum: 1 } } }
  ]);

  const statuts = { recu: 0, en_cours: 0, resolu: 0, rejete: 0 };
  parStatut.forEach(s => { statuts[s._id] = s.nombre; });
  const totalSignalements = Object.values(statuts).reduce((a, b) => a + b, 0);

  // Taux de résolution
  const tauxResolution = totalSignalements > 0
    ? Math.round((statuts.resolu / totalSignalements) * 1000) / 10
    : 0;

  // Par catégorie
  const parCategorie = await Signalement.aggregate([
    {
      $group: {
        _id: '$categorie',
        nombre: { $sum: 1 },
        resolus: { $sum: { $cond: [{ $eq: ['$statut', 'resolu'] }, 1, 0] } }
      }
    },
    { $sort: { nombre: -1 } }
  ]);

  // Temps moyen de résolution (en heures)
  const tempsResolution = await Signalement.aggregate([
    { $match: { statut: 'resolu', resoluLe: { $exists: true } } },
    {
      $project: {
        duree: { $subtract: ['$resoluLe', '$creeLe'] }
      }
    },
    {
      $group: {
        _id: null,
        tempsMoyen: { $avg: '$duree' }
      }
    }
  ]);

  const tempsMoyenHeures = tempsResolution.length > 0
    ? Math.round(tempsResolution[0].tempsMoyen / (1000 * 60 * 60) * 10) / 10
    : 0;

  // Utilisateurs actifs
  const totalUtilisateurs = await Utilisateur.countDocuments({ estActif: true });
  const totalAgents = await Utilisateur.countDocuments({ role: 'agent', estActif: true });

  // Signalements urgents
  const urgents = await Signalement.countDocuments({
    priorite: 'urgent',
    statut: { $in: ['recu', 'en_cours'] }
  });

  // Tendance mensuelle (6 derniers mois)
  const sixMoisArriere = new Date();
  sixMoisArriere.setMonth(sixMoisArriere.getMonth() - 6);

  const tendanceMensuelle = await Signalement.aggregate([
    { $match: { creeLe: { $gte: sixMoisArriere } } },
    {
      $group: {
        _id: {
          annee: { $year: '$creeLe' },
          mois: { $month: '$creeLe' }
        },
        signalements: { $sum: 1 },
        resolus: { $sum: { $cond: [{ $eq: ['$statut', 'resolu'] }, 1, 0] } }
      }
    },
    { $sort: { '_id.annee': 1, '_id.mois': 1 } }
  ]);

  // Points chauds (top 5 quartiers)
  const pointsChauds = await Signalement.aggregate([
    { $match: { statut: { $in: ['recu', 'en_cours'] } } },
    {
      $group: {
        _id: '$localisation.quartier',
        nombreSignalements: { $sum: 1 },
        categorieTop: { $first: '$categorie' }
      }
    },
    { $sort: { nombreSignalements: -1 } },
    { $limit: 5 }
  ]);

  // Meilleurs agents
  const meilleursAgents = await Signalement.aggregate([
    { $match: { statut: 'resolu', assigneA: { $exists: true } } },
    {
      $group: {
        _id: '$assigneA',
        signalementsResolus: { $sum: 1 }
      }
    },
    { $sort: { signalementsResolus: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'utilisateurs',
        localField: '_id',
        foreignField: '_id',
        as: 'agent'
      }
    },
    { $unwind: '$agent' },
    {
      $project: {
        signalementsResolus: 1,
        'agent.prenom': 1,
        'agent.nom': 1,
        'agent.email': 1
      }
    }
  ]);

  envoyerReponse(res, 200, true, 'Statistiques récupérées.', {
    resume: {
      totalSignalements,
      tauxResolution,
      tempsMoyenHeures,
      signalementsUrgents: urgents,
      totalUtilisateurs,
      totalAgents
    },
    signalementsParStatut: statuts,
    signalementsParCategorie: parCategorie,
    tendanceMensuelle,
    pointsChauds,
    meilleursAgents
  });
});

// @desc    Obtenir les stats du citoyen connecté
// @route   GET /api/statistiques/citoyen
// @acces   Privé (citoyen)
const obtenirStatsCitoyen = asyncHandler(async (req, res) => {
  const mesStats = await Signalement.aggregate([
    { $match: { soumisePar: req.utilisateur._id } },
    {
      $group: {
        _id: '$statut',
        nombre: { $sum: 1 }
      }
    }
  ]);

  const statuts = { recu: 0, en_cours: 0, resolu: 0, rejete: 0 };
  mesStats.forEach(s => { statuts[s._id] = s.nombre; });
  const total = Object.values(statuts).reduce((a, b) => a + b, 0);

  envoyerReponse(res, 200, true, 'Statistiques citoyen récupérées.', {
    totalSignalements: total,
    parStatut: statuts,
    tauxResolution: total > 0 ? Math.round((statuts.resolu / total) * 100) : 0
  });
});

// @desc    Stats publiques pour la page d'accueil
// @route   GET /api/statistiques/publiques
// @acces   Public
const obtenirStatsPubliques = asyncHandler(async (req, res) => {
  const totalSignalements = await Signalement.countDocuments();
  const totalResolus = await Signalement.countDocuments({ statut: 'resolu' });
  const totalUtilisateurs = await Utilisateur.countDocuments({ estActif: true });
  const tauxResolution = totalSignalements > 0
    ? Math.round((totalResolus / totalSignalements) * 10) / 10
    : 0;

  // Temps moyen de résolution
  const tempsResolution = await Signalement.aggregate([
    { $match: { statut: 'resolu', resoluLe: { $exists: true } } },
    { $project: { duree: { $subtract: ['$resoluLe', '$creeLe'] } } },
    { $group: { _id: null, tempsMoyen: { $avg: '$duree' } } }
  ]);
  const tempsMoyenJours = tempsResolution.length > 0
    ? Math.round(tempsResolution[0].tempsMoyen / (1000 * 60 * 60 * 24) * 10) / 10
    : 0;

  const signalementsActifs = await Signalement.countDocuments({ statut: { $in: ['recu', 'en_cours'] } });

  envoyerReponse(res, 200, true, 'Statistiques publiques.', {
    totalSignalements,
    totalResolus,
    totalUtilisateurs,
    tauxResolution,
    tempsMoyenJours,
    signalementsActifs
  });
});

module.exports = { obtenirStatistiques, obtenirStatsCitoyen, obtenirStatsPubliques };

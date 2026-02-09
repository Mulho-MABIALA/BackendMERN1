const Notification = require('../modeles/Notification');
const { asyncHandler, envoyerReponse } = require('../utilitaires/helpers');

// @desc    Obtenir mes notifications
// @route   GET /api/notifications
// @acces   Privé
const obtenirNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limite = 20, nonLues } = req.query;

  const filtre = { utilisateur: req.utilisateur._id };
  if (nonLues === 'true') filtre.estLue = false;

  const total = await Notification.countDocuments(filtre);
  const nonLuesCount = await Notification.countDocuments({
    utilisateur: req.utilisateur._id,
    estLue: false
  });

  const notifications = await Notification.find(filtre)
    .populate('signalementLie', 'titre statut idSignalement')
    .sort('-creeLe')
    .skip((parseInt(page) - 1) * parseInt(limite))
    .limit(parseInt(limite));

  envoyerReponse(res, 200, true, 'Notifications récupérées.', {
    total,
    nonLues: nonLuesCount,
    notifications
  });
});

// @desc    Marquer une notification comme lue
// @route   PUT /api/notifications/:id/lire
// @acces   Privé
const marquerCommeLue = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, utilisateur: req.utilisateur._id },
    { estLue: true, lueLe: new Date() },
    { new: true }
  );

  if (!notification) {
    return envoyerReponse(res, 404, false, 'Notification introuvable.');
  }

  envoyerReponse(res, 200, true, 'Notification marquée comme lue.', { notification });
});

// @desc    Marquer toutes les notifications comme lues
// @route   PUT /api/notifications/tout-lire
// @acces   Privé
const toutMarquerCommeLu = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { utilisateur: req.utilisateur._id, estLue: false },
    { estLue: true, lueLe: new Date() }
  );

  envoyerReponse(res, 200, true, 'Toutes les notifications ont été marquées comme lues.');
});

// @desc    Supprimer une notification
// @route   DELETE /api/notifications/:id
// @acces   Privé
const supprimerNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    utilisateur: req.utilisateur._id
  });

  if (!notification) {
    return envoyerReponse(res, 404, false, 'Notification introuvable.');
  }

  envoyerReponse(res, 200, true, 'Notification supprimée.');
});

module.exports = { obtenirNotifications, marquerCommeLue, toutMarquerCommeLu, supprimerNotification };

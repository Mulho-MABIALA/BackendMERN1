const Commentaire = require('../modeles/Commentaire');
const Signalement = require('../modeles/Signalement');
const Notification = require('../modeles/Notification');
const { asyncHandler, envoyerReponse } = require('../utilitaires/helpers');

// @desc    Ajouter un commentaire à un signalement
// @route   POST /api/signalements/:id/commentaires
// @acces   Privé
const ajouterCommentaire = asyncHandler(async (req, res) => {
  const { contenu, type, visibilite } = req.body;

  const signalement = await Signalement.findById(req.params.id);
  if (!signalement) {
    return envoyerReponse(res, 404, false, 'Signalement introuvable.');
  }

  // Déterminer le type selon le rôle
  let typeCommentaire = type || 'mise_a_jour_citoyen';
  if (req.utilisateur.role === 'agent') typeCommentaire = 'mise_a_jour_agent';
  if (req.utilisateur.role === 'admin' && type === 'note_interne') typeCommentaire = 'note_interne';

  const commentaire = await Commentaire.create({
    contenu,
    signalement: req.params.id,
    auteur: req.utilisateur._id,
    type: typeCommentaire,
    visibilite: visibilite || 'public'
  });

  const commentairePopule = await Commentaire.findById(commentaire._id)
    .populate('auteur', 'prenom nom role');

  // Notifier le propriétaire du signalement (si ce n'est pas lui qui commente)
  if (signalement.soumisePar.toString() !== req.utilisateur._id.toString()) {
    await Notification.create({
      utilisateur: signalement.soumisePar,
      titre: 'Nouveau commentaire',
      message: `Un commentaire a été ajouté à votre signalement "${signalement.titre}".`,
      type: 'nouveau_commentaire',
      signalementLie: signalement._id
    });
  }

  envoyerReponse(res, 201, true, 'Commentaire ajouté.', { commentaire: commentairePopule });
});

// @desc    Obtenir les commentaires d'un signalement
// @route   GET /api/signalements/:id/commentaires
// @acces   Privé
const obtenirCommentaires = asyncHandler(async (req, res) => {
  const filtre = { signalement: req.params.id };

  // Filtrer la visibilité selon le rôle
  if (req.utilisateur.role === 'citoyen') {
    filtre.visibilite = 'public';
  } else if (req.utilisateur.role === 'agent') {
    filtre.visibilite = { $in: ['public', 'agents_seulement'] };
  }
  // Admin voit tout

  const commentaires = await Commentaire.find(filtre)
    .populate('auteur', 'prenom nom role')
    .populate('reponseA')
    .sort('creeLe');

  envoyerReponse(res, 200, true, 'Commentaires récupérés.', { commentaires });
});

// @desc    Liker un commentaire
// @route   PUT /api/commentaires/:id/liker
// @acces   Privé
const likerCommentaire = asyncHandler(async (req, res) => {
  const commentaire = await Commentaire.findById(req.params.id);
  if (!commentaire) {
    return envoyerReponse(res, 404, false, 'Commentaire introuvable.');
  }

  const dejaLike = commentaire.likes.includes(req.utilisateur._id);
  if (dejaLike) {
    commentaire.likes.pull(req.utilisateur._id);
  } else {
    commentaire.likes.push(req.utilisateur._id);
  }

  await commentaire.save();
  envoyerReponse(res, 200, true, dejaLike ? 'Like retiré.' : 'Like ajouté.', {
    nombreLikes: commentaire.likes.length
  });
});

module.exports = { ajouterCommentaire, obtenirCommentaires, likerCommentaire };

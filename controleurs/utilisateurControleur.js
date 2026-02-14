const Utilisateur = require('../modeles/Utilisateur');
const Signalement = require('../modeles/Signalement');
const { asyncHandler, envoyerReponse, paginer } = require('../utilitaires/helpers');

// @desc    Obtenir tous les utilisateurs
// @route   GET /api/utilisateurs
// @acces   Privé (admin)
const obtenirUtilisateurs = asyncHandler(async (req, res) => {
  const { role, estActif, recherche, page, limite } = req.query;

  const filtre = {};
  if (role) filtre.role = role;
  if (estActif !== undefined) filtre.estActif = estActif === 'true';
  if (recherche) {
    filtre.$or = [
      { prenom: { $regex: recherche, $options: 'i' } },
      { nom: { $regex: recherche, $options: 'i' } },
      { email: { $regex: recherche, $options: 'i' } }
    ];
  }

  const total = await Utilisateur.countDocuments(filtre);
  let requete = Utilisateur.find(filtre).sort('-creeLe');
  const { requete: requetePaginee, pagination } = paginer(requete, page, limite);
  const utilisateurs = await requetePaginee;

  envoyerReponse(res, 200, true, 'Utilisateurs récupérés.', { total, pagination, utilisateurs });
});

// @desc    Obtenir un utilisateur par ID
// @route   GET /api/utilisateurs/:id
// @acces   Privé (admin)
const obtenirUtilisateur = asyncHandler(async (req, res) => {
  const utilisateur = await Utilisateur.findById(req.params.id);
  if (!utilisateur) {
    return envoyerReponse(res, 404, false, 'Utilisateur introuvable.');
  }
  envoyerReponse(res, 200, true, 'Utilisateur récupéré.', { utilisateur });
});

// @desc    Créer un agent ou admin
// @route   POST /api/utilisateurs
// @acces   Privé (admin)
const creerUtilisateur = asyncHandler(async (req, res) => {
  const { email, motDePasse, prenom, nom, role, telephone, zoneAssignee, departement } = req.body;

  const existeDeja = await Utilisateur.findOne({ email });
  if (existeDeja) {
    return envoyerReponse(res, 400, false, 'Un compte avec cet email existe déjà.');
  }

  const utilisateur = await Utilisateur.create({
    email,
    motDePasse,
    prenom,
    nom,
    role: role || 'agent',
    telephone,
    zoneAssignee,
    departement
  });

  envoyerReponse(res, 201, true, 'Utilisateur créé.', {
    utilisateur: {
      id: utilisateur._id,
      email: utilisateur.email,
      prenom: utilisateur.prenom,
      nom: utilisateur.nom,
      role: utilisateur.role
    }
  });
});

// @desc    Mettre à jour un utilisateur
// @route   PUT /api/utilisateurs/:id
// @acces   Privé (admin)
const mettreAJourUtilisateur = asyncHandler(async (req, res) => {
  const champsAutorises = ['prenom', 'nom', 'telephone', 'role', 'zoneAssignee', 'departement', 'estActif', 'permissions'];
  const miseAJour = {};

  champsAutorises.forEach(champ => {
    if (req.body[champ] !== undefined) {
      miseAJour[champ] = req.body[champ];
    }
  });

  const utilisateur = await Utilisateur.findByIdAndUpdate(req.params.id, miseAJour, {
    new: true,
    runValidators: true
  });

  if (!utilisateur) {
    return envoyerReponse(res, 404, false, 'Utilisateur introuvable.');
  }

  envoyerReponse(res, 200, true, 'Utilisateur mis à jour.', { utilisateur });
});

// @desc    Désactiver / Réactiver un utilisateur
// @route   PUT /api/utilisateurs/:id/statut
// @acces   Privé (admin)
const changerStatutUtilisateur = asyncHandler(async (req, res) => {
  const utilisateur = await Utilisateur.findById(req.params.id);
  if (!utilisateur) {
    return envoyerReponse(res, 404, false, 'Utilisateur introuvable.');
  }

  utilisateur.estActif = !utilisateur.estActif;
  await utilisateur.save({ validateBeforeSave: false });

  envoyerReponse(res, 200, true,
    utilisateur.estActif ? 'Utilisateur réactivé.' : 'Utilisateur désactivé.',
    { utilisateur }
  );
});

// @desc    Obtenir tous les agents avec leur charge de travail
// @route   GET /api/utilisateurs/agents
// @acces   Privé (admin)
const obtenirAgents = asyncHandler(async (req, res) => {
  const agents = await Utilisateur.find({ role: 'agent' }).sort('nom');

  // Compter les signalements actifs (en_cours) par agent
  const chargesTravail = await Signalement.aggregate([
    { $match: { assigneA: { $in: agents.map(a => a._id) }, statut: 'en_cours' } },
    { $group: { _id: '$assigneA', signalementsActifs: { $sum: 1 } } }
  ]);

  const chargeMap = {};
  chargesTravail.forEach(c => { chargeMap[c._id.toString()] = c.signalementsActifs; });

  const agentsAvecCharge = agents.map(a => {
    const obj = a.toObject();
    obj.signalementsActifs = chargeMap[a._id.toString()] || 0;
    return obj;
  });

  envoyerReponse(res, 200, true, 'Agents récupérés.', { agents: agentsAvecCharge });
});

module.exports = {
  obtenirUtilisateurs,
  obtenirUtilisateur,
  creerUtilisateur,
  mettreAJourUtilisateur,
  changerStatutUtilisateur,
  obtenirAgents
};

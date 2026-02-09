const Utilisateur = require('../modeles/Utilisateur');
const { asyncHandler, envoyerReponse } = require('../utilitaires/helpers');

// @desc    Inscription d'un utilisateur
// @route   POST /api/auth/inscription
// @acces   Public
const inscription = asyncHandler(async (req, res) => {
  const { email, motDePasse, prenom, nom, telephone, role } = req.body;

  // Vérifier si l'utilisateur existe déjà
  const existeDeja = await Utilisateur.findOne({ email });
  if (existeDeja) {
    return envoyerReponse(res, 400, false, 'Un compte avec cet email existe déjà.');
  }

  // Créer l'utilisateur
  const utilisateur = await Utilisateur.create({
    email,
    motDePasse,
    prenom,
    nom,
    telephone,
    role: role || 'citoyen'
  });

  // Générer le token
  const token = utilisateur.genererToken();

  envoyerReponse(res, 201, true, 'Inscription réussie.', {
    token,
    utilisateur: {
      id: utilisateur._id,
      email: utilisateur.email,
      prenom: utilisateur.prenom,
      nom: utilisateur.nom,
      role: utilisateur.role
    }
  });
});

// @desc    Connexion d'un utilisateur
// @route   POST /api/auth/connexion
// @acces   Public
const connexion = asyncHandler(async (req, res) => {
  const { email, motDePasse } = req.body;

  // Chercher l'utilisateur avec le mot de passe
  const utilisateur = await Utilisateur.findOne({ email }).select('+motDePasse');
  if (!utilisateur) {
    return envoyerReponse(res, 401, false, 'Email ou mot de passe incorrect.');
  }

  // Vérifier le mot de passe
  const motDePasseValide = await utilisateur.comparerMotDePasse(motDePasse);
  if (!motDePasseValide) {
    return envoyerReponse(res, 401, false, 'Email ou mot de passe incorrect.');
  }

  // Vérifier si le compte est actif
  if (!utilisateur.estActif) {
    return envoyerReponse(res, 401, false, 'Compte désactivé. Contactez un administrateur.');
  }

  // Mettre à jour la dernière connexion
  utilisateur.derniereConnexion = new Date();
  await utilisateur.save({ validateBeforeSave: false });

  // Générer le token
  const token = utilisateur.genererToken();

  envoyerReponse(res, 200, true, 'Connexion réussie.', {
    token,
    utilisateur: {
      id: utilisateur._id,
      email: utilisateur.email,
      prenom: utilisateur.prenom,
      nom: utilisateur.nom,
      role: utilisateur.role
    }
  });
});

// @desc    Obtenir le profil de l'utilisateur connecté
// @route   GET /api/auth/profil
// @acces   Privé
const obtenirProfil = asyncHandler(async (req, res) => {
  const utilisateur = await Utilisateur.findById(req.utilisateur._id);
  envoyerReponse(res, 200, true, 'Profil récupéré.', { utilisateur });
});

// @desc    Mettre à jour le profil
// @route   PUT /api/auth/profil
// @acces   Privé
const mettreAJourProfil = asyncHandler(async (req, res) => {
  const champsAutorises = ['prenom', 'nom', 'telephone', 'adresse', 'notifications'];
  const miseAJour = {};

  champsAutorises.forEach(champ => {
    if (req.body[champ] !== undefined) {
      miseAJour[champ] = req.body[champ];
    }
  });

  const utilisateur = await Utilisateur.findByIdAndUpdate(
    req.utilisateur._id,
    miseAJour,
    { new: true, runValidators: true }
  );

  envoyerReponse(res, 200, true, 'Profil mis à jour.', { utilisateur });
});

module.exports = { inscription, connexion, obtenirProfil, mettreAJourProfil };

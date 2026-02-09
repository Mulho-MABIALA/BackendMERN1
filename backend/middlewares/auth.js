const jwt = require('jsonwebtoken');
const Utilisateur = require('../modeles/Utilisateur');

// Protéger les routes - vérifier le token JWT
const proteger = async (req, res, next) => {
  let token;

  // Vérifier le header Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      succes: false,
      message: 'Accès non autorisé. Veuillez vous connecter.'
    });
  }

  try {
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer l'utilisateur
    const utilisateur = await Utilisateur.findById(decoded.id);
    if (!utilisateur) {
      return res.status(401).json({
        succes: false,
        message: 'Utilisateur introuvable.'
      });
    }

    if (!utilisateur.estActif) {
      return res.status(401).json({
        succes: false,
        message: 'Compte désactivé. Contactez un administrateur.'
      });
    }

    req.utilisateur = utilisateur;
    next();
  } catch (erreur) {
    return res.status(401).json({
      succes: false,
      message: 'Token invalide ou expiré.'
    });
  }
};

// Autoriser certains rôles
const autoriser = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.utilisateur.role)) {
      return res.status(403).json({
        succes: false,
        message: `Le rôle "${req.utilisateur.role}" n'est pas autorisé pour cette action.`
      });
    }
    next();
  };
};

module.exports = { proteger, autoriser };

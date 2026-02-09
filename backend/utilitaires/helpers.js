/**
 * ===== Fonctions utilitaires =====
 */

// Envoyer une réponse formatée
const envoyerReponse = (res, codeStatut, succes, message, donnees = null) => {
  const reponse = { succes, message };
  if (donnees !== null) reponse.donnees = donnees;
  return res.status(codeStatut).json(reponse);
};

// Wrapper async pour les contrôleurs (évite les try/catch répétitifs)
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Pagination helper
const paginer = (query, page = 1, limite = 20) => {
  const pageNum = parseInt(page) || 1;
  const limiteNum = parseInt(limite) || 20;
  const saut = (pageNum - 1) * limiteNum;

  return {
    requete: query.skip(saut).limit(limiteNum),
    pagination: {
      page: pageNum,
      limite: limiteNum,
      saut
    }
  };
};

module.exports = { envoyerReponse, asyncHandler, paginer };

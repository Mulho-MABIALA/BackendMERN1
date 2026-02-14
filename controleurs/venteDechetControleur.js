const VenteDechet = require('../modeles/VenteDechet');
const Notification = require('../modeles/Notification');
const { asyncHandler, envoyerReponse, paginer } = require('../utilitaires/helpers');

// Prix par défaut par kg (en FCFA) - l'admin peut ajuster
const PRIX_PAR_DEFAUT = {
  plastique: 75,  // 75 FCFA/kg
  fer: 150        // 150 FCFA/kg
};

// @desc    Créer une proposition de vente de déchet
// @route   POST /api/ventes-dechets
// @acces   Privé (citoyen)
const creerVente = asyncHandler(async (req, res) => {
  const { typeDechet, poidsKg, description, localisation } = req.body;

  if (!typeDechet || !poidsKg) {
    return envoyerReponse(res, 400, false, 'Le type de déchet et le poids sont obligatoires.');
  }

  // Parser localisation si envoyé en string
  let loc = localisation;
  if (typeof loc === 'string') {
    try { loc = JSON.parse(loc); } catch (e) { loc = {}; }
  }

  const vente = await VenteDechet.create({
    typeDechet,
    poidsKg,
    description,
    localisation: loc || { ville: 'Dakar' },
    citoyen: req.utilisateur._id,
    historique: [{
      statut: 'en_attente',
      modifiePar: req.utilisateur._id,
      commentaire: 'Proposition de vente créée'
    }]
  });

  envoyerReponse(res, 201, true, 'Proposition de vente créée avec succès.', { vente });
});

// @desc    Lister les ventes du citoyen connecté
// @route   GET /api/ventes-dechets/mes-ventes
// @acces   Privé (citoyen)
const mesVentes = asyncHandler(async (req, res) => {
  const ventes = await VenteDechet.find({ citoyen: req.utilisateur._id })
    .sort({ creeLe: -1 })
    .populate('traitePar', 'prenom nom');

  envoyerReponse(res, 200, true, 'Ventes récupérées.', { ventes, total: ventes.length });
});

// @desc    Lister toutes les ventes (admin)
// @route   GET /api/ventes-dechets
// @acces   Privé (admin)
const listeVentes = asyncHandler(async (req, res) => {
  const { statut, typeDechet, page, limite } = req.query;

  let filtre = {};
  if (statut) filtre.statut = statut;
  if (typeDechet) filtre.typeDechet = typeDechet;

  const total = await VenteDechet.countDocuments(filtre);

  let requete = VenteDechet.find(filtre)
    .populate('citoyen', 'prenom nom email telephone')
    .populate('traitePar', 'prenom nom')
    .sort({ creeLe: -1 });

  const { requete: requetePaginee, pagination } = paginer(requete, page, limite);
  const ventes = await requetePaginee;

  envoyerReponse(res, 200, true, 'Liste des ventes.', { ventes, total, pagination });
});

// @desc    Détail d'une vente
// @route   GET /api/ventes-dechets/:id
// @acces   Privé
const detailVente = asyncHandler(async (req, res) => {
  const vente = await VenteDechet.findById(req.params.id)
    .populate('citoyen', 'prenom nom email telephone')
    .populate('traitePar', 'prenom nom');

  if (!vente) {
    return envoyerReponse(res, 404, false, 'Vente non trouvée.');
  }

  // Vérifier que le citoyen ne voit que ses propres ventes (sauf admin)
  if (req.utilisateur.role === 'citoyen' && String(vente.citoyen._id) !== String(req.utilisateur._id)) {
    return envoyerReponse(res, 403, false, 'Accès non autorisé.');
  }

  envoyerReponse(res, 200, true, 'Détail de la vente.', { vente });
});

// @desc    Proposer un prix (admin)
// @route   PUT /api/ventes-dechets/:id/proposer-prix
// @acces   Privé (admin)
const proposerPrix = asyncHandler(async (req, res) => {
  const { prixParKg, commentaireAdmin } = req.body;

  if (!prixParKg || prixParKg <= 0) {
    return envoyerReponse(res, 400, false, 'Le prix par kg doit être supérieur à 0.');
  }

  const vente = await VenteDechet.findById(req.params.id);
  if (!vente) {
    return envoyerReponse(res, 404, false, 'Vente non trouvée.');
  }

  if (vente.statut !== 'en_attente' && vente.statut !== 'prix_propose') {
    return envoyerReponse(res, 400, false, 'Cette vente ne peut plus recevoir de proposition de prix.');
  }

  vente.prixParKg = prixParKg;
  vente.prixTotal = Math.round(prixParKg * vente.poidsKg);
  vente.prixPropose = vente.prixTotal;
  vente.statut = 'prix_propose';
  vente.traitePar = req.utilisateur._id;
  vente.traiteLe = new Date();
  if (commentaireAdmin) vente.commentaireAdmin = commentaireAdmin;

  await vente.save();

  // Notifier le citoyen
  try {
    await Notification.create({
      utilisateur: vente.citoyen,
      type: 'vente',
      titre: 'Prix proposé pour votre vente',
      contenu: `Un prix de ${vente.prixTotal} FCFA (${prixParKg} FCFA/kg) a été proposé pour vos ${vente.poidsKg} kg de ${vente.typeDechet}.`,
      lien: `/citizen/ventes`
    });
  } catch (e) {
    console.error('Erreur notification:', e.message);
  }

  envoyerReponse(res, 200, true, 'Prix proposé avec succès.', { vente });
});

// @desc    Accepter/Refuser une offre (citoyen)
// @route   PUT /api/ventes-dechets/:id/repondre
// @acces   Privé (citoyen)
const repondreOffre = asyncHandler(async (req, res) => {
  const { accepter, reponseCitoyen } = req.body;

  const vente = await VenteDechet.findById(req.params.id);
  if (!vente) {
    return envoyerReponse(res, 404, false, 'Vente non trouvée.');
  }

  if (String(vente.citoyen) !== String(req.utilisateur._id)) {
    return envoyerReponse(res, 403, false, 'Accès non autorisé.');
  }

  if (vente.statut !== 'prix_propose') {
    return envoyerReponse(res, 400, false, 'Cette vente n\'a pas de prix proposé à accepter ou refuser.');
  }

  vente.statut = accepter ? 'accepte' : 'refuse';
  if (reponseCitoyen) vente.reponseCitoyen = reponseCitoyen;

  await vente.save();

  const message = accepter ? 'Offre acceptée !' : 'Offre refusée.';
  envoyerReponse(res, 200, true, message, { vente });
});

// @desc    Marquer une vente comme complétée (admin)
// @route   PUT /api/ventes-dechets/:id/completer
// @acces   Privé (admin)
const completerVente = asyncHandler(async (req, res) => {
  const vente = await VenteDechet.findById(req.params.id);
  if (!vente) {
    return envoyerReponse(res, 404, false, 'Vente non trouvée.');
  }

  if (vente.statut !== 'accepte') {
    return envoyerReponse(res, 400, false, 'Seule une vente acceptée peut être complétée.');
  }

  vente.statut = 'complete';
  vente.completeLe = new Date();

  await vente.save();

  // Notifier le citoyen
  try {
    await Notification.create({
      utilisateur: vente.citoyen,
      type: 'vente',
      titre: 'Vente complétée !',
      contenu: `Votre vente de ${vente.poidsKg} kg de ${vente.typeDechet} a été complétée. Montant : ${vente.prixTotal} FCFA.`,
      lien: `/citizen/ventes`
    });
  } catch (e) {
    console.error('Erreur notification:', e.message);
  }

  envoyerReponse(res, 200, true, 'Vente complétée avec succès.', { vente });
});

// @desc    Annuler une vente (citoyen ou admin)
// @route   PUT /api/ventes-dechets/:id/annuler
// @acces   Privé
const annulerVente = asyncHandler(async (req, res) => {
  const vente = await VenteDechet.findById(req.params.id);
  if (!vente) {
    return envoyerReponse(res, 404, false, 'Vente non trouvée.');
  }

  // Le citoyen ne peut annuler que ses propres ventes non complétées
  if (req.utilisateur.role === 'citoyen') {
    if (String(vente.citoyen) !== String(req.utilisateur._id)) {
      return envoyerReponse(res, 403, false, 'Accès non autorisé.');
    }
    if (vente.statut === 'complete') {
      return envoyerReponse(res, 400, false, 'Une vente complétée ne peut pas être annulée.');
    }
  }

  vente.statut = 'annule';
  await vente.save();

  envoyerReponse(res, 200, true, 'Vente annulée.', { vente });
});

// @desc    Statistiques des ventes (admin)
// @route   GET /api/ventes-dechets/statistiques
// @acces   Privé (admin)
const statistiquesVentes = asyncHandler(async (req, res) => {
  const [stats] = await VenteDechet.aggregate([
    {
      $facet: {
        parStatut: [
          { $group: { _id: '$statut', total: { $sum: 1 } } }
        ],
        parType: [
          { $group: { _id: '$typeDechet', total: { $sum: 1 }, poidsTotal: { $sum: '$poidsKg' }, revenus: { $sum: '$prixTotal' } } }
        ],
        global: [
          {
            $group: {
              _id: null,
              totalVentes: { $sum: 1 },
              poidsTotal: { $sum: '$poidsKg' },
              revenusTotal: { $sum: { $cond: [{ $eq: ['$statut', 'complete'] }, '$prixTotal', 0] } },
              ventesCompletees: { $sum: { $cond: [{ $eq: ['$statut', 'complete'] }, 1, 0] } },
              ventesEnAttente: { $sum: { $cond: [{ $eq: ['$statut', 'en_attente'] }, 1, 0] } }
            }
          }
        ]
      }
    }
  ]);

  envoyerReponse(res, 200, true, 'Statistiques des ventes.', {
    parStatut: stats.parStatut,
    parType: stats.parType,
    global: stats.global[0] || { totalVentes: 0, poidsTotal: 0, revenusTotal: 0, ventesCompletees: 0, ventesEnAttente: 0 }
  });
});

// @desc    Obtenir les prix par défaut
// @route   GET /api/ventes-dechets/prix
// @acces   Public
const obtenirPrix = asyncHandler(async (req, res) => {
  envoyerReponse(res, 200, true, 'Prix par kg.', { prix: PRIX_PAR_DEFAUT });
});

module.exports = {
  creerVente,
  mesVentes,
  listeVentes,
  detailVente,
  proposerPrix,
  repondreOffre,
  completerVente,
  annulerVente,
  statistiquesVentes,
  obtenirPrix
};

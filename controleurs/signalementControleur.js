const Signalement = require('../modeles/Signalement');
const Utilisateur = require('../modeles/Utilisateur');
const Notification = require('../modeles/Notification');
const { asyncHandler, envoyerReponse, paginer } = require('../utilitaires/helpers');
const { calculerPriorite } = require('../utilitaires/calculPriorite');
const { tenterRegroupement } = require('../utilitaires/regroupement');
const { envoyerEmail, templateChangementStatut, templateAssignation } = require('../utilitaires/email');

// Masquer l'identité pour les signalements anonymes
function masquerAnonyme(signalements, utilisateur) {
  const estAutorise = ['admin', 'agent'].includes(utilisateur.role);
  return signalements.map(s => {
    const obj = s.toObject ? s.toObject() : { ...s };
    if (obj.estAnonyme && !estAutorise && String(obj.soumisePar?._id || obj.soumisePar) !== String(utilisateur._id)) {
      obj.soumisePar = null;
    }
    return obj;
  });
}

// @desc    Créer un signalement
// @route   POST /api/signalements
// @acces   Privé (citoyen, agent, admin)
const creerSignalement = asyncHandler(async (req, res) => {
  const { titre, description, categorie, sousCategorie, estAnonyme } = req.body;

  // Parser localisation si envoyé en string (FormData multipart)
  let localisation = req.body.localisation;
  if (typeof localisation === 'string') {
    try { localisation = JSON.parse(localisation); } catch (e) { localisation = {}; }
  }

  if (!localisation?.ville) {
    return envoyerReponse(res, 400, false, 'La ville est obligatoire.');
  }

  // Calculer la priorité automatiquement
  const { score, priorite } = calculerPriorite({
    categorie,
    proximiteZoneSensible: localisation?.proximiteZoneSensible || 'aucune',
    nombreSignalementsSimilaires: 0,
    dateCreation: new Date()
  });

  const signalement = await Signalement.create({
    titre,
    description,
    categorie,
    sousCategorie,
    localisation,
    soumisePar: req.utilisateur._id,
    estAnonyme: estAnonyme || false,
    scorePriorite: score,
    priorite,
    historiqueStatuts: [{
      statut: 'recu',
      modifiePar: req.utilisateur._id,
      commentaire: 'Signalement créé'
    }]
  });

  // Incrémenter les stats de l'utilisateur
  await Utilisateur.findByIdAndUpdate(req.utilisateur._id, {
    $inc: { 'statistiques.signalementsEnvoyes': 1 }
  });

  // Tenter le regroupement IA (asynchrone, ne bloque pas la réponse)
  tenterRegroupement(signalement).catch(err => {
    console.error('Erreur regroupement:', err.message);
  });

  // Gérer les photos uploadées
  if (req.files && req.files.length > 0) {
    signalement.photos = req.files.map(f => ({
      url: `/uploads/${f.filename}`,
      miniatureUrl: `/uploads/${f.filename}`,
      dateUpload: new Date()
    }));
    await signalement.save();
  }

  const signalementPopule = await Signalement.findById(signalement._id)
    .populate('soumisePar', 'prenom nom email');

  envoyerReponse(res, 201, true, 'Signalement créé avec succès.', { signalement: signalementPopule });
});

// @desc    Obtenir tous les signalements (avec filtres et pagination)
// @route   GET /api/signalements
// @acces   Privé
const obtenirSignalements = asyncHandler(async (req, res) => {
  const { statut, categorie, priorite, ville, page, limite, tri } = req.query;

  // Construire le filtre
  const filtre = {};
  if (statut) filtre.statut = statut;
  if (categorie) filtre.categorie = categorie;
  if (priorite) filtre.priorite = priorite;
  if (ville) filtre['localisation.ville'] = { $regex: ville, $options: 'i' };

  // Si citoyen, ne montrer que ses propres signalements + les publics
  if (req.utilisateur.role === 'citoyen') {
    filtre.$or = [
      { soumisePar: req.utilisateur._id },
      { estAnonyme: false }
    ];
  }

  // Si agent, montrer uniquement ses signalements assignés
  if (req.utilisateur.role === 'agent') {
    filtre.assigneA = req.utilisateur._id;
  }

  const total = await Signalement.countDocuments(filtre);

  let requete = Signalement.find(filtre)
    .populate('soumisePar', 'prenom nom')
    .populate('assigneA', 'prenom nom');

  // Tri
  const optionTri = tri || '-creeLe';
  requete = requete.sort(optionTri);

  // Pagination
  const { requete: requetePaginee, pagination } = paginer(requete, page, limite);
  const signalements = await requetePaginee;

  const resultat = masquerAnonyme(signalements, req.utilisateur);

  envoyerReponse(res, 200, true, 'Signalements récupérés.', {
    total,
    pagination,
    signalements: resultat
  });
});

// @desc    Obtenir un signalement par ID
// @route   GET /api/signalements/:id
// @acces   Privé
const obtenirSignalement = asyncHandler(async (req, res) => {
  const signalement = await Signalement.findById(req.params.id)
    .populate('soumisePar', 'prenom nom email telephone')
    .populate('assigneA', 'prenom nom email')
    .populate('historiqueStatuts.modifiePar', 'prenom nom role');

  if (!signalement) {
    return envoyerReponse(res, 404, false, 'Signalement introuvable.');
  }

  const [resultat] = masquerAnonyme([signalement], req.utilisateur);

  envoyerReponse(res, 200, true, 'Signalement récupéré.', { signalement: resultat });
});

// @desc    Mes signalements (citoyen)
// @route   GET /api/signalements/mes-signalements
// @acces   Privé (citoyen)
const mesSignalements = asyncHandler(async (req, res) => {
  const signalements = await Signalement.find({ soumisePar: req.utilisateur._id })
    .sort('-creeLe')
    .populate('assigneA', 'prenom nom');

  envoyerReponse(res, 200, true, 'Mes signalements récupérés.', { signalements });
});

// @desc    Changer le statut d'un signalement
// @route   PUT /api/signalements/:id/statut
// @acces   Privé (agent, admin)
const changerStatut = asyncHandler(async (req, res) => {
  const { statut, commentaire } = req.body;

  const signalement = await Signalement.findById(req.params.id);
  if (!signalement) {
    return envoyerReponse(res, 404, false, 'Signalement introuvable.');
  }

  // Si agent, vérifier qu'il est bien assigné à ce signalement
  if (req.utilisateur.role === 'agent') {
    if (!signalement.assigneA || String(signalement.assigneA) !== String(req.utilisateur._id)) {
      return envoyerReponse(res, 403, false, 'Ce signalement ne vous est pas assigné.');
    }
  }

  const ancienStatut = signalement.statut;
  signalement.statut = statut;

  // Ajouter à l'historique
  signalement.historiqueStatuts.push({
    statut,
    modifiePar: req.utilisateur._id,
    commentaire: commentaire || `Statut changé de "${ancienStatut}" à "${statut}"`
  });

  // Si résolu, enregistrer la date
  if (statut === 'resolu') {
    signalement.resoluLe = new Date();
    // Incrémenter les stats
    await Utilisateur.findByIdAndUpdate(signalement.soumisePar, {
      $inc: { 'statistiques.signalementsResolus': 1 }
    });
  }

  // Si rejeté, enregistrer les infos de rejet
  if (statut === 'rejete' && req.body.raison) {
    signalement.rejet = {
      raison: req.body.raison,
      explication: req.body.explication || '',
      rejetePar: req.utilisateur._id,
      rejeteLe: new Date()
    };
  }

  await signalement.save();

  // Créer une notification pour le citoyen
  await Notification.create({
    utilisateur: signalement.soumisePar,
    titre: 'Mise à jour de votre signalement',
    message: `Votre signalement "${signalement.titre}" est passé en statut "${statut}".`,
    type: 'changement_statut',
    signalementLie: signalement._id
  });

  // Envoyer email au citoyen
  const citoyen = await Utilisateur.findById(signalement.soumisePar);
  if (citoyen?.email) {
    envoyerEmail({
      destinataire: citoyen.email,
      sujet: `EcoHub - Mise a jour: ${signalement.titre}`,
      html: templateChangementStatut(citoyen.prenom, signalement.titre, ancienStatut, statut)
    });
  }

  const signalementMisAJour = await Signalement.findById(req.params.id)
    .populate('soumisePar', 'prenom nom')
    .populate('assigneA', 'prenom nom');

  envoyerReponse(res, 200, true, 'Statut mis à jour.', { signalement: signalementMisAJour });
});

// @desc    Assigner un signalement à un agent
// @route   PUT /api/signalements/:id/assigner
// @acces   Privé (admin)
const assignerSignalement = asyncHandler(async (req, res) => {
  const { agentId } = req.body;

  // Vérifier que l'agent existe et a le bon rôle
  const agent = await Utilisateur.findById(agentId);
  if (!agent || agent.role !== 'agent') {
    return envoyerReponse(res, 400, false, 'Agent invalide.');
  }

  const signalement = await Signalement.findByIdAndUpdate(
    req.params.id,
    {
      assigneA: agentId,
      assigneLe: new Date(),
      statut: 'en_cours',
      $push: {
        historiqueStatuts: {
          statut: 'en_cours',
          modifiePar: req.utilisateur._id,
          commentaire: `Assigné à ${agent.prenom} ${agent.nom}`
        }
      }
    },
    { new: true }
  ).populate('assigneA', 'prenom nom email');

  if (!signalement) {
    return envoyerReponse(res, 404, false, 'Signalement introuvable.');
  }

  // Notifier l'agent
  await Notification.create({
    utilisateur: agentId,
    titre: 'Nouveau signalement assigné',
    message: `Le signalement "${signalement.titre}" vous a été assigné.`,
    type: 'signalement_assigne',
    signalementLie: signalement._id
  });

  // Envoyer email à l'agent
  if (agent.email) {
    envoyerEmail({
      destinataire: agent.email,
      sujet: `EcoHub - Nouveau signalement assigne: ${signalement.titre}`,
      html: templateAssignation(agent.prenom, signalement.titre)
    });
  }

  envoyerReponse(res, 200, true, 'Signalement assigné.', { signalement });
});

// @desc    Voter pour un signalement
// @route   PUT /api/signalements/:id/voter
// @acces   Privé (citoyen)
const voterSignalement = asyncHandler(async (req, res) => {
  const signalement = await Signalement.findById(req.params.id);
  if (!signalement) {
    return envoyerReponse(res, 404, false, 'Signalement introuvable.');
  }

  // Vérifier si l'utilisateur a déjà voté
  const dejaVote = signalement.votes.includes(req.utilisateur._id);

  if (dejaVote) {
    // Retirer le vote
    signalement.votes.pull(req.utilisateur._id);
    signalement.nombreVotes = signalement.votes.length;
  } else {
    // Ajouter le vote
    signalement.votes.push(req.utilisateur._id);
    signalement.nombreVotes = signalement.votes.length;
  }

  await signalement.save();

  envoyerReponse(res, 200, true, dejaVote ? 'Vote retiré.' : 'Vote ajouté.', {
    nombreVotes: signalement.nombreVotes
  });
});

// @desc    Signalements proches (géo)
// @route   GET /api/signalements/proximite/:lng/:lat/:distance
// @acces   Privé
const signalementsProximite = asyncHandler(async (req, res) => {
  const { lng, lat, distance } = req.params;
  const rayon = parseFloat(distance) || 1000; // mètres par défaut

  const signalements = await Signalement.find({
    'localisation.coordonnees': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        $maxDistance: rayon
      }
    },
    statut: { $in: ['recu', 'en_cours'] }
  }).populate('soumisePar', 'prenom nom');

  const resultat = masquerAnonyme(signalements, req.utilisateur);

  envoyerReponse(res, 200, true, `${resultat.length} signalements trouvés à proximité.`, { signalements: resultat });
});

// @desc    Ajouter photos de résolution
// @route   PUT /api/signalements/:id/resolution
// @acces   Privé (agent)
const ajouterResolution = asyncHandler(async (req, res) => {
  const { description, cout, ressourcesUtilisees } = req.body;

  // Vérifier que l'agent est bien assigné à ce signalement
  const signalementExistant = await Signalement.findById(req.params.id);
  if (!signalementExistant) {
    return envoyerReponse(res, 404, false, 'Signalement introuvable.');
  }
  if (req.utilisateur.role === 'agent') {
    if (!signalementExistant.assigneA || String(signalementExistant.assigneA) !== String(req.utilisateur._id)) {
      return envoyerReponse(res, 403, false, 'Ce signalement ne vous est pas assigné.');
    }
  }

  const photosResolution = (req.files || []).map((f, index) => ({
    url: `/uploads/${f.filename}`,
    legende: req.body[`legende_${index}`] || req.body.legende || '',
    estPhotoAvant: req.body[`estPhotoAvant_${index}`] === 'true'
  }));

  const signalement = await Signalement.findByIdAndUpdate(
    req.params.id,
    {
      resolution: {
        description,
        photos: photosResolution,
        cout: cout ? parseFloat(cout) : undefined,
        ressourcesUtilisees: ressourcesUtilisees ? ressourcesUtilisees.split(',') : [],
        valideePar: req.utilisateur._id
      },
      statut: 'resolu',
      resoluLe: new Date(),
      $push: {
        historiqueStatuts: {
          statut: 'resolu',
          modifiePar: req.utilisateur._id,
          commentaire: description || 'Signalement résolu'
        }
      }
    },
    { new: true }
  );

  if (!signalement) {
    return envoyerReponse(res, 404, false, 'Signalement introuvable.');
  }

  envoyerReponse(res, 200, true, 'Résolution enregistrée.', { signalement });
});

module.exports = {
  creerSignalement,
  obtenirSignalements,
  obtenirSignalement,
  mesSignalements,
  changerStatut,
  assignerSignalement,
  voterSignalement,
  signalementsProximite,
  ajouterResolution
};

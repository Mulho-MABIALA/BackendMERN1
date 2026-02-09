const Configuration = require('../modeles/Configuration');
const { asyncHandler, envoyerReponse } = require('../utilitaires/helpers');

// @desc    Obtenir la configuration active
// @route   GET /api/configuration
// @acces   Privé (admin)
const obtenirConfiguration = asyncHandler(async (req, res) => {
  let config = await Configuration.findOne().populate('modifieePar', 'prenom nom');

  // Créer une config par défaut si aucune n'existe
  if (!config) {
    config = await Configuration.create({
      categories: [
        { id: 'routes', nom: 'Routes dégradées', sousCategories: ['nid-de-poule', 'fissure', 'chaussée défoncée'], prioriteParDefaut: 'moyen', icone: 'Construction', couleur: '#3b82f6' },
        { id: 'eclairage', nom: 'Éclairage public', sousCategories: ['lampadaire en panne', 'zone sombre'], prioriteParDefaut: 'moyen', icone: 'Lightbulb', couleur: '#f59e0b' },
        { id: 'dechets', nom: 'Déchets', sousCategories: ['dépôt sauvage', 'poubelle débordante', 'encombrants'], prioriteParDefaut: 'faible', icone: 'Trash2', couleur: '#00A67E' },
        { id: 'eau', nom: "Problèmes d'eau", sousCategories: ['fuite', 'canalisation', 'égout'], prioriteParDefaut: 'eleve', icone: 'Droplets', couleur: '#06b6d4' },
        { id: 'securite', nom: 'Insécurité', sousCategories: ['zone dangereuse', 'éclairage insuffisant'], prioriteParDefaut: 'urgent', icone: 'ShieldAlert', couleur: '#ef4444' },
        { id: 'inondation', nom: 'Inondations', sousCategories: ['accumulation eau', 'drainage défaillant'], prioriteParDefaut: 'urgent', icone: 'CloudRain', couleur: '#8b5cf6' },
        { id: 'autre', nom: 'Autres', sousCategories: [], prioriteParDefaut: 'faible', icone: 'HelpCircle', couleur: '#64748b' }
      ]
    });
  }

  envoyerReponse(res, 200, true, 'Configuration récupérée.', { configuration: config });
});

// @desc    Mettre à jour la configuration
// @route   PUT /api/configuration
// @acces   Privé (admin)
const mettreAJourConfiguration = asyncHandler(async (req, res) => {
  const champsAutorises = [
    'ponderationsPriorite',
    'zonesSensibles',
    'seuils',
    'categories',
    'parametresNotifications'
  ];

  const miseAJour = { modifieePar: req.utilisateur._id };
  champsAutorises.forEach(champ => {
    if (req.body[champ] !== undefined) {
      miseAJour[champ] = req.body[champ];
    }
  });

  let config = await Configuration.findOne();
  if (!config) {
    config = await Configuration.create(miseAJour);
  } else {
    config = await Configuration.findOneAndUpdate({}, miseAJour, {
      new: true,
      runValidators: true
    });
  }

  envoyerReponse(res, 200, true, 'Configuration mise à jour.', { configuration: config });
});

// @desc    Ajouter une zone sensible
// @route   POST /api/configuration/zones-sensibles
// @acces   Privé (admin)
const ajouterZoneSensible = asyncHandler(async (req, res) => {
  const { nom, type, coordonnees, rayon } = req.body;

  const config = await Configuration.findOne();
  if (!config) {
    return envoyerReponse(res, 404, false, 'Configuration introuvable.');
  }

  config.zonesSensibles.push({ nom, type, coordonnees, rayon });
  config.modifieePar = req.utilisateur._id;
  await config.save();

  envoyerReponse(res, 201, true, 'Zone sensible ajoutée.', { configuration: config });
});

module.exports = { obtenirConfiguration, mettreAJourConfiguration, ajouterZoneSensible };

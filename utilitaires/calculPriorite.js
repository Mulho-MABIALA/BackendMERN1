/**
 * ===== Calcul automatique du score de priorité =====
 *
 * Critères (cahier de charge) :
 *   - Nombre de signalements similaires : 30%
 *   - Niveau de danger                  : 35%
 *   - Proximité de zones sensibles      : 25%
 *   - Ancienneté du signalement         : 10%
 */

// Pondérations par défaut (modifiables via Configuration)
const PONDERATIONS_DEFAUT = {
  nombreSignalements: 30,
  niveauDanger: 35,
  proximiteZoneSensible: 25,
  anciennete: 10
};

// Score de danger par catégorie
const DANGER_PAR_CATEGORIE = {
  securite: 100,
  inondation: 90,
  eau: 75,
  routes: 70,
  eclairage: 50,
  dechets: 40,
  autre: 30
};

// Score de proximité zone sensible
const SCORE_ZONE_SENSIBLE = {
  hopital: 100,
  ecole: 90,
  marche: 70,
  espace_public: 60,
  aucune: 0
};

/**
 * Calculer le score de priorité d'un signalement
 * @param {Object} params
 * @param {String} params.categorie - Catégorie du signalement
 * @param {String} params.proximiteZoneSensible - Type de zone sensible proche
 * @param {Number} params.nombreSignalementsSimilaires - Nombre de signalements dans la même zone
 * @param {Date}   params.dateCreation - Date de création du signalement
 * @param {Object} params.ponderations - Pondérations personnalisées (optionnel)
 * @returns {Object} { score, priorite }
 */
function calculerPriorite({
  categorie,
  proximiteZoneSensible = 'aucune',
  nombreSignalementsSimilaires = 0,
  dateCreation = new Date(),
  ponderations = PONDERATIONS_DEFAUT
}) {
  // 1. Score nombre de signalements (0-100)
  // Plus il y a de signalements similaires, plus le score est élevé
  const scoreNombre = Math.min(nombreSignalementsSimilaires * 15, 100);

  // 2. Score danger (0-100)
  const scoreDanger = DANGER_PAR_CATEGORIE[categorie] || 30;

  // 3. Score zone sensible (0-100)
  const scoreZone = SCORE_ZONE_SENSIBLE[proximiteZoneSensible] || 0;

  // 4. Score ancienneté (0-100)
  // Plus le signalement est ancien, plus il est prioritaire
  const joursDepuisCreation = Math.floor((Date.now() - new Date(dateCreation).getTime()) / (1000 * 60 * 60 * 24));
  const scoreAnciennete = Math.min(joursDepuisCreation * 5, 100);

  // Calcul pondéré
  const score = Math.round(
    (scoreNombre * ponderations.nombreSignalements / 100) +
    (scoreDanger * ponderations.niveauDanger / 100) +
    (scoreZone * ponderations.proximiteZoneSensible / 100) +
    (scoreAnciennete * ponderations.anciennete / 100)
  );

  // Clamp entre 0 et 100
  const scoreFinal = Math.max(0, Math.min(100, score));

  // Déterminer le niveau de priorité
  let priorite;
  if (scoreFinal >= 80) priorite = 'urgent';
  else if (scoreFinal >= 60) priorite = 'eleve';
  else if (scoreFinal >= 40) priorite = 'moyen';
  else priorite = 'faible';

  return { score: scoreFinal, priorite };
}

module.exports = { calculerPriorite, PONDERATIONS_DEFAUT };

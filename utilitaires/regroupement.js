/**
 * ===== Regroupement intelligent des signalements =====
 *
 * Détection automatique des signalements similaires dans un rayon défini.
 * Regroupe les doublons et augmente la priorité.
 */

const Signalement = require('../modeles/Signalement');
const Regroupement = require('../modeles/Regroupement');
const { calculerPriorite } = require('./calculPriorite');

/**
 * Chercher les signalements proches d'un point donné
 * @param {Array} coordonnees - [longitude, latitude]
 * @param {Number} rayonMetres - Rayon de recherche en mètres
 * @param {String} categorie - Catégorie pour filtrer
 * @returns {Array} Signalements trouvés
 */
async function chercherSignalementsProches(coordonnees, rayonMetres = 100, categorie = null) {
  const filtre = {
    'localisation.coordonnees': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordonnees
        },
        $maxDistance: rayonMetres
      }
    },
    statut: { $in: ['recu', 'en_cours'] }
  };

  if (categorie) {
    filtre.categorie = categorie;
  }

  return await Signalement.find(filtre);
}

/**
 * Tenter de regrouper un nouveau signalement avec des signalements existants
 * @param {Object} signalement - Le nouveau signalement créé
 * @param {Number} rayonMetres - Rayon de regroupement (défaut: 100m)
 * @param {Number} seuilMinimum - Nombre minimum pour créer un regroupement (défaut: 3)
 * @returns {Object|null} Regroupement créé ou mis à jour, ou null
 */
async function tenterRegroupement(signalement, rayonMetres = 100, seuilMinimum = 3) {
  const coordonnees = signalement.localisation.coordonnees.coordinates;

  // Chercher les signalements proches de la même catégorie
  const proches = await chercherSignalementsProches(coordonnees, rayonMetres, signalement.categorie);

  // Pas assez de signalements proches
  if (proches.length < seuilMinimum) return null;

  // Vérifier si un regroupement existe déjà pour ces signalements
  const regroupementExistant = await Regroupement.findOne({
    estActif: true,
    categoriePrincipale: signalement.categorie,
    'centre.coordonnees': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordonnees
        },
        $maxDistance: rayonMetres
      }
    }
  });

  if (regroupementExistant) {
    // Ajouter le signalement au regroupement existant
    if (!regroupementExistant.signalements.includes(signalement._id)) {
      regroupementExistant.signalements.push(signalement._id);
      regroupementExistant.nombreSignalements = regroupementExistant.signalements.length;
      regroupementExistant.dateDernierSignalement = new Date();

      // Recalculer la priorité moyenne
      const { score, priorite } = calculerPriorite({
        categorie: signalement.categorie,
        proximiteZoneSensible: signalement.localisation.proximiteZoneSensible,
        nombreSignalementsSimilaires: regroupementExistant.nombreSignalements
      });
      regroupementExistant.scorePrioriteMoyen = score;
      regroupementExistant.niveauUrgence = priorite;

      await regroupementExistant.save();

      // Mettre à jour le signalement avec le lien vers le regroupement
      signalement.regroupementId = regroupementExistant._id;
      signalement.aSignalementsMultiples = true;
      await signalement.save();
    }

    return regroupementExistant;
  }

  // Créer un nouveau regroupement
  const idsSignalements = proches.map(s => s._id);
  const { score, priorite } = calculerPriorite({
    categorie: signalement.categorie,
    proximiteZoneSensible: signalement.localisation.proximiteZoneSensible,
    nombreSignalementsSimilaires: proches.length
  });

  const nouveauRegroupement = await Regroupement.create({
    centre: {
      coordonnees: {
        type: 'Point',
        coordinates: coordonnees
      },
      rayon: rayonMetres
    },
    signalements: idsSignalements,
    nombreSignalements: idsSignalements.length,
    categoriePrincipale: signalement.categorie,
    categories: [{ categorie: signalement.categorie, nombre: proches.length }],
    scorePrioriteMoyen: score,
    niveauUrgence: priorite,
    datePremierSignalement: proches.reduce((min, s) => s.creeLe < min ? s.creeLe : min, new Date()),
    dateDernierSignalement: new Date()
  });

  // Mettre à jour tous les signalements du groupe
  await Signalement.updateMany(
    { _id: { $in: idsSignalements } },
    { regroupementId: nouveauRegroupement._id, aSignalementsMultiples: true }
  );

  return nouveauRegroupement;
}

module.exports = { chercherSignalementsProches, tenterRegroupement };

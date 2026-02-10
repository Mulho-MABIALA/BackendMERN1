const PDFDocument = require('pdfkit');
const Signalement = require('../modeles/Signalement');
const { asyncHandler } = require('../utilitaires/helpers');

const categorieLabels = {
  routes: 'Routes & Voirie',
  eclairage: 'Eclairage public',
  dechets: 'Dechets & Proprete',
  eau: 'Eau & Assainissement',
  securite: 'Securite',
  inondation: 'Inondation',
  autre: 'Autre',
};

const statutLabels = {
  recu: 'Recu',
  en_cours: 'En cours',
  resolu: 'Resolu',
  rejete: 'Rejete',
};

// Construire les filtres communs
function construireFiltre(query) {
  const filtre = {};
  if (query.statut) filtre.statut = query.statut;
  if (query.categorie) filtre.categorie = query.categorie;
  if (query.priorite) filtre.priorite = query.priorite;
  if (query.ville) filtre['localisation.ville'] = { $regex: query.ville, $options: 'i' };
  return filtre;
}

// @desc    Exporter les signalements en CSV
// @route   GET /api/exports/csv
// @acces   Privé (agent, admin)
const exporterCSV = asyncHandler(async (req, res) => {
  const filtre = construireFiltre(req.query);
  const signalements = await Signalement.find(filtre)
    .populate('soumisePar', 'prenom nom')
    .sort('-creeLe');

  // En-têtes CSV
  const lignes = ['ID;Titre;Categorie;Statut;Priorite;Score;Ville;Quartier;Date;Auteur'];

  signalements.forEach(s => {
    const auteur = s.estAnonyme ? 'Anonyme' : (s.soumisePar ? `${s.soumisePar.prenom} ${s.soumisePar.nom}` : 'Inconnu');
    const date = new Date(s.creeLe).toLocaleDateString('fr-FR');
    const ligne = [
      s.idSignalement || s._id,
      `"${(s.titre || '').replace(/"/g, '""')}"`,
      categorieLabels[s.categorie] || s.categorie,
      statutLabels[s.statut] || s.statut,
      s.priorite,
      s.scorePriorite || 0,
      s.localisation?.ville || '',
      s.localisation?.quartier || '',
      date,
      auteur,
    ].join(';');
    lignes.push(ligne);
  });

  const csv = '\uFEFF' + lignes.join('\n'); // BOM UTF-8 pour Excel

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=signalements-export.csv');
  res.send(csv);
});

// @desc    Exporter les signalements en PDF
// @route   GET /api/exports/pdf
// @acces   Privé (agent, admin)
const exporterPDF = asyncHandler(async (req, res) => {
  const filtre = construireFiltre(req.query);
  const signalements = await Signalement.find(filtre)
    .populate('soumisePar', 'prenom nom')
    .sort('-creeLe');

  // Stats
  const total = signalements.length;
  const parStatut = {};
  const parCategorie = {};
  signalements.forEach(s => {
    parStatut[s.statut] = (parStatut[s.statut] || 0) + 1;
    parCategorie[s.categorie] = (parCategorie[s.categorie] || 0) + 1;
  });

  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=rapport-signalements.pdf');
  doc.pipe(res);

  // Titre
  doc.fontSize(22).font('Helvetica-Bold').text('ECOHUB - Rapport des Signalements', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica').fillColor('#666')
    .text(`Genere le ${new Date().toLocaleDateString('fr-FR')} | ${total} signalements`, { align: 'center' });
  doc.moveDown(1.5);

  // Résumé par statut
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#000').text('Resume par statut');
  doc.moveDown(0.5);
  Object.entries(parStatut).forEach(([statut, count]) => {
    doc.fontSize(10).font('Helvetica').text(`  ${statutLabels[statut] || statut}: ${count}`);
  });
  doc.moveDown(1);

  // Résumé par catégorie
  doc.fontSize(14).font('Helvetica-Bold').text('Resume par categorie');
  doc.moveDown(0.5);
  Object.entries(parCategorie).forEach(([cat, count]) => {
    doc.fontSize(10).font('Helvetica').text(`  ${categorieLabels[cat] || cat}: ${count}`);
  });
  doc.moveDown(1.5);

  // Liste des signalements
  doc.fontSize(14).font('Helvetica-Bold').text('Liste des signalements');
  doc.moveDown(0.5);

  signalements.forEach((s, i) => {
    if (doc.y > 700) doc.addPage();

    const auteur = s.estAnonyme ? 'Anonyme' : (s.soumisePar ? `${s.soumisePar.prenom} ${s.soumisePar.nom}` : 'Inconnu');
    const date = new Date(s.creeLe).toLocaleDateString('fr-FR');

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#00A67E')
      .text(`${i + 1}. ${s.titre}`);
    doc.fontSize(9).font('Helvetica').fillColor('#333')
      .text(`   Categorie: ${categorieLabels[s.categorie] || s.categorie} | Statut: ${statutLabels[s.statut] || s.statut} | Priorite: ${s.priorite} (${s.scorePriorite}/100)`);
    doc.text(`   Lieu: ${s.localisation?.ville || ''} ${s.localisation?.quartier ? '- ' + s.localisation.quartier : ''} | Date: ${date} | Auteur: ${auteur}`);
    doc.moveDown(0.5);
  });

  doc.end();
});

module.exports = { exporterCSV, exporterPDF };

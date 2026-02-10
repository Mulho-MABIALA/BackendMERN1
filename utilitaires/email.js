const nodemailer = require('nodemailer');

const transporteur = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_UTILISATEUR,
    pass: process.env.EMAIL_MOT_DE_PASSE,
  },
});

async function envoyerEmail({ destinataire, sujet, html }) {
  // Ne pas envoyer si les credentials email ne sont pas configurés
  if (!process.env.EMAIL_UTILISATEUR || !process.env.EMAIL_MOT_DE_PASSE) {
    console.log(`[Email] Config manquante - email non envoye a ${destinataire}: ${sujet}`);
    return;
  }

  try {
    await transporteur.sendMail({
      from: `"EcoHub" <${process.env.EMAIL_EXPEDITEUR || process.env.EMAIL_UTILISATEUR}>`,
      to: destinataire,
      subject: sujet,
      html,
    });
    console.log(`[Email] Envoye a ${destinataire}: ${sujet}`);
  } catch (err) {
    console.error('[Email] Erreur envoi:', err.message);
  }
}

function templateChangementStatut(prenom, titre, ancienStatut, nouveauStatut) {
  const statutLabels = { recu: 'Recu', en_cours: 'En cours', resolu: 'Resolu', rejete: 'Rejete' };
  return `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #00A67E; margin: 0;">ECOHUB</h1>
      </div>
      <h2 style="color: #333;">Mise a jour de votre signalement</h2>
      <p>Bonjour <strong>${prenom}</strong>,</p>
      <p>Votre signalement "<strong>${titre}</strong>" est passe du statut
         "<em>${statutLabels[ancienStatut] || ancienStatut}</em>" a
         "<em>${statutLabels[nouveauStatut] || nouveauStatut}</em>".</p>
      <div style="background: #f0fdf4; border-left: 4px solid #00A67E; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-weight: bold; color: #00A67E;">Nouveau statut : ${statutLabels[nouveauStatut] || nouveauStatut}</p>
      </div>
      <p>Connectez-vous a EcoHub pour plus de details.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #999; font-size: 12px;">Cet email a ete envoye automatiquement par la plateforme EcoHub.</p>
    </div>
  `;
}

function templateAssignation(prenom, titre) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #00A67E; margin: 0;">ECOHUB</h1>
      </div>
      <h2 style="color: #333;">Nouveau signalement assigne</h2>
      <p>Bonjour <strong>${prenom}</strong>,</p>
      <p>Le signalement "<strong>${titre}</strong>" vous a ete assigne.</p>
      <p>Connectez-vous a EcoHub pour commencer l'intervention.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #999; font-size: 12px;">Cet email a ete envoye automatiquement par la plateforme EcoHub.</p>
    </div>
  `;
}

module.exports = { envoyerEmail, templateChangementStatut, templateAssignation };

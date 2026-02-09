const mongoose = require('mongoose');

const connecterBD = async () => {
  try {
    const connexion = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB connecté : ${connexion.connection.host}`);
  } catch (erreur) {
    console.error(`❌ Erreur connexion MongoDB : ${erreur.message}`);
    process.exit(1);
  }
};

module.exports = connecterBD;

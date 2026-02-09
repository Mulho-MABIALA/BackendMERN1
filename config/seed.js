/**
 * ===== Script de migration / seed de la base de données ECOHUB =====
 * Usage : node config/seed.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

const Utilisateur = require('../modeles/Utilisateur');
const Signalement = require('../modeles/Signalement');
const Commentaire = require('../modeles/Commentaire');
const Notification = require('../modeles/Notification');
const Regroupement = require('../modeles/Regroupement');
const Statistique = require('../modeles/Statistique');
const Configuration = require('../modeles/Configuration');

// ===== Connexion =====
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connecté');

    // Nettoyage complet
    console.log('🗑️  Nettoyage des collections...');
    await Promise.all([
      Utilisateur.deleteMany({}),
      Signalement.deleteMany({}),
      Commentaire.deleteMany({}),
      Notification.deleteMany({}),
      Regroupement.deleteMany({}),
      Statistique.deleteMany({}),
      Configuration.deleteMany({})
    ]);
    console.log('   Collections vidées.');

    // ============================================================
    // 1. UTILISATEURS
    // ============================================================
    console.log('\n👤 Création des utilisateurs...');

    const utilisateurs = await Utilisateur.create([
      // Admin
      {
        email: 'admin@ecohub.com',
        motDePasse: 'admin123',
        role: 'admin',
        prenom: 'Karim',
        nom: 'Benali',
        telephone: '+216 71 000 001',
        adresse: { ville: 'Tunis', rue: 'Avenue Habib Bourguiba', codePostal: '1000' },
        permissions: ['gestion_utilisateurs', 'gestion_signalements', 'gestion_agents', 'configuration', 'statistiques']
      },
      // Agents
      {
        email: 'agent1@ecohub.com',
        motDePasse: 'agent123',
        role: 'agent',
        prenom: 'Fatima',
        nom: 'Zahra',
        telephone: '+216 71 000 010',
        zoneAssignee: 'Tunis Centre',
        departement: 'Voirie',
        adresse: { ville: 'Tunis', rue: 'Rue de Marseille', codePostal: '1000' }
      },
      {
        email: 'agent2@ecohub.com',
        motDePasse: 'agent123',
        role: 'agent',
        prenom: 'Mohamed',
        nom: 'Trabelsi',
        telephone: '+216 71 000 011',
        zoneAssignee: 'La Marsa',
        departement: 'Eau et assainissement',
        adresse: { ville: 'La Marsa', rue: 'Avenue de la République', codePostal: '2078' }
      },
      {
        email: 'agent3@ecohub.com',
        motDePasse: 'agent123',
        role: 'agent',
        prenom: 'Sami',
        nom: 'Bouazizi',
        telephone: '+216 71 000 012',
        zoneAssignee: 'Ariana',
        departement: 'Éclairage public',
        adresse: { ville: 'Ariana', rue: 'Rue Ibn Khaldoun', codePostal: '2080' }
      },
      // Citoyens
      {
        email: 'citoyen1@ecohub.com',
        motDePasse: 'citoyen123',
        role: 'citoyen',
        prenom: 'Ahmed',
        nom: 'Hammami',
        telephone: '+216 71 000 100',
        adresse: { ville: 'Tunis', quartier: 'Bab Bhar', codePostal: '1000' }
      },
      {
        email: 'citoyen2@ecohub.com',
        motDePasse: 'citoyen123',
        role: 'citoyen',
        prenom: 'Leila',
        nom: 'Mekni',
        telephone: '+216 71 000 101',
        adresse: { ville: 'La Marsa', quartier: 'Sidi Bou Said', codePostal: '2078' }
      },
      {
        email: 'citoyen3@ecohub.com',
        motDePasse: 'citoyen123',
        role: 'citoyen',
        prenom: 'Youssef',
        nom: 'Gharbi',
        telephone: '+216 71 000 102',
        adresse: { ville: 'Ariana', quartier: 'Ennasr', codePostal: '2080' }
      },
      {
        email: 'citoyen4@ecohub.com',
        motDePasse: 'citoyen123',
        role: 'citoyen',
        prenom: 'Nour',
        nom: 'Slimani',
        telephone: '+216 71 000 103',
        adresse: { ville: 'Tunis', quartier: 'Lafayette', codePostal: '1002' }
      },
      {
        email: 'citoyen5@ecohub.com',
        motDePasse: 'citoyen123',
        role: 'citoyen',
        prenom: 'Amine',
        nom: 'Khelifi',
        telephone: '+216 71 000 104',
        adresse: { ville: 'Ben Arous', quartier: 'Mégrine', codePostal: '2033' }
      },
      {
        email: 'citoyen6@ecohub.com',
        motDePasse: 'citoyen123',
        role: 'citoyen',
        prenom: 'Sara',
        nom: 'Mejri',
        telephone: '+216 71 000 105',
        adresse: { ville: 'La Marsa', quartier: 'Gammarth', codePostal: '2078' }
      }
    ]);

    const admin = utilisateurs[0];
    const agents = utilisateurs.slice(1, 4);
    const citoyens = utilisateurs.slice(4);

    console.log(`   ${utilisateurs.length} utilisateurs créés (1 admin, 3 agents, 6 citoyens)`);

    // ============================================================
    // 2. CONFIGURATION
    // ============================================================
    console.log('\n⚙️  Création de la configuration...');

    const configuration = await Configuration.create({
      ponderationsPriorite: {
        nombreSignalements: 30,
        niveauDanger: 35,
        proximiteZoneSensible: 25,
        anciennete: 10
      },
      zonesSensibles: [
        { nom: 'École Primaire Bab Bhar', type: 'ecole', coordonnees: [10.1700, 36.7990], rayon: 200 },
        { nom: 'Hôpital Charles Nicolle', type: 'hopital', coordonnees: [10.1680, 36.8020], rayon: 300 },
        { nom: 'Marché Central Tunis', type: 'marche', coordonnees: [10.1750, 36.7980], rayon: 150 },
        { nom: 'Parc du Belvédère', type: 'espace_public', coordonnees: [10.1580, 36.8120], rayon: 400 },
        { nom: 'Lycée Alaoui', type: 'ecole', coordonnees: [10.1820, 36.8060], rayon: 200 },
        { nom: 'Clinique La Marsa', type: 'hopital', coordonnees: [10.3250, 36.8780], rayon: 250 }
      ],
      seuils: {
        prioriteUrgente: 80,
        prioriteElevee: 60,
        prioriteMoyenne: 40,
        rayonRegroupement: 100,
        minimumSignalementsRegroupement: 3
      },
      categories: [
        { id: 'routes', nom: 'Routes et chaussées', sousCategories: ['nid_de_poule', 'fissure', 'effondrement', 'signalisation'], prioriteParDefaut: 'moyen', icone: 'road', couleur: '#EF4444' },
        { id: 'eclairage', nom: 'Éclairage public', sousCategories: ['lampadaire_eteint', 'cable_expose', 'vandalisme'], prioriteParDefaut: 'moyen', icone: 'lightbulb', couleur: '#F59E0B' },
        { id: 'dechets', nom: 'Déchets et propreté', sousCategories: ['poubelle_pleine', 'depot_sauvage', 'dechets_dangereux'], prioriteParDefaut: 'moyen', icone: 'trash', couleur: '#10B981' },
        { id: 'eau', nom: 'Eau et assainissement', sousCategories: ['fuite', 'egout_bouche', 'inondation_mineure', 'eau_stagnante'], prioriteParDefaut: 'eleve', icone: 'droplet', couleur: '#3B82F6' },
        { id: 'securite', nom: 'Sécurité', sousCategories: ['batiment_dangereux', 'arbre_instable', 'zone_non_securisee'], prioriteParDefaut: 'eleve', icone: 'shield', couleur: '#8B5CF6' },
        { id: 'inondation', nom: 'Inondation', sousCategories: ['rue_inondee', 'sous_sol_inonde', 'debordement'], prioriteParDefaut: 'urgent', icone: 'waves', couleur: '#06B6D4' },
        { id: 'autre', nom: 'Autre', sousCategories: ['mobilier_urbain', 'espace_vert', 'bruit', 'autre'], prioriteParDefaut: 'faible', icone: 'flag', couleur: '#6B7280' }
      ],
      parametresNotifications: {
        miseAJourStatutCitoyen: true,
        assignationAgent: true,
        creationRegroupement: true,
        signalementResolu: true
      },
      modifieePar: admin._id
    });

    console.log('   Configuration créée avec 6 zones sensibles et 7 catégories');

    // ============================================================
    // 3. SIGNALEMENTS
    // ============================================================
    console.log('\n📋 Création des signalements...');

    const donneesSignalements = [
      // --- Reçus (nouveaux) ---
      {
        titre: 'Nid-de-poule dangereux Avenue Bourguiba',
        description: 'Un large nid-de-poule s\'est formé au milieu de la chaussée, provoquant des accidents pour les deux-roues et endommageant les véhicules.',
        categorie: 'routes',
        sousCategorie: 'nid_de_poule',
        localisation: { coordonnees: { type: 'Point', coordinates: [10.1815, 36.8065] }, ville: 'Tunis', quartier: 'Centre ville', adresse: 'Avenue Habib Bourguiba', proximiteZoneSensible: 'espace_public' },
        statut: 'recu', priorite: 'eleve', scorePriorite: 72,
        soumisePar: citoyens[0]._id,
        nombreVotes: 8, votes: [citoyens[0]._id, citoyens[1]._id, citoyens[2]._id, citoyens[3]._id]
      },
      {
        titre: 'Dépôt sauvage de déchets près du marché',
        description: 'Des sacs poubelles et des déchets de construction ont été abandonnés sur le trottoir à côté de l\'entrée du marché central, bloquant le passage des piétons.',
        categorie: 'dechets',
        sousCategorie: 'depot_sauvage',
        localisation: { coordonnees: { type: 'Point', coordinates: [10.1750, 36.7980] }, ville: 'Tunis', quartier: 'Bab Bhar', adresse: 'Rue du Marché Central', proximiteZoneSensible: 'marche' },
        statut: 'recu', priorite: 'moyen', scorePriorite: 55,
        soumisePar: citoyens[3]._id,
        nombreVotes: 3, votes: [citoyens[3]._id, citoyens[0]._id]
      },
      {
        titre: 'Câble électrique exposé sur un poteau',
        description: 'Un câble électrique pend dangereusement depuis un poteau d\'éclairage, accessible aux enfants qui passent pour aller à l\'école voisine.',
        categorie: 'eclairage',
        sousCategorie: 'cable_expose',
        localisation: { coordonnees: { type: 'Point', coordinates: [10.1700, 36.7990] }, ville: 'Tunis', quartier: 'Bab Bhar', adresse: 'Rue de l\'École', proximiteZoneSensible: 'ecole' },
        statut: 'recu', priorite: 'urgent', scorePriorite: 88,
        soumisePar: citoyens[1]._id,
        nombreVotes: 12, votes: [citoyens[0]._id, citoyens[1]._id, citoyens[2]._id, citoyens[3]._id, citoyens[4]._id]
      },

      // --- En cours ---
      {
        titre: 'Fuite d\'eau importante rue de Marseille',
        description: 'Une grosse fuite d\'eau jaillit du trottoir depuis plusieurs jours, inondant la rue et rendant la circulation difficile pour les piétons.',
        categorie: 'eau',
        sousCategorie: 'fuite',
        localisation: { coordonnees: { type: 'Point', coordinates: [10.1780, 36.8010] }, ville: 'Tunis', quartier: 'Centre ville', adresse: 'Rue de Marseille', proximiteZoneSensible: 'aucune' },
        statut: 'en_cours', priorite: 'eleve', scorePriorite: 68,
        soumisePar: citoyens[0]._id,
        assigneA: agents[1]._id, assigneLe: new Date('2026-02-05'),
        nombreVotes: 5, votes: [citoyens[0]._id, citoyens[2]._id]
      },
      {
        titre: 'Égout bouché provoquant des odeurs',
        description: 'L\'égout de la rue est complètement bouché, causant des remontées d\'eaux usées et des odeurs nauséabondes insupportables pour les riverains.',
        categorie: 'eau',
        sousCategorie: 'egout_bouche',
        localisation: { coordonnees: { type: 'Point', coordinates: [10.3260, 36.8770] }, ville: 'La Marsa', quartier: 'Centre', adresse: 'Rue de la Plage', proximiteZoneSensible: 'aucune' },
        statut: 'en_cours', priorite: 'moyen', scorePriorite: 52,
        soumisePar: citoyens[1]._id,
        assigneA: agents[1]._id, assigneLe: new Date('2026-02-04'),
        nombreVotes: 4, votes: [citoyens[1]._id, citoyens[5]._id]
      },
      {
        titre: 'Lampadaires éteints dans tout le quartier Ennasr',
        description: 'Depuis une semaine, tous les lampadaires de la rue principale du quartier Ennasr sont éteints, rendant les déplacements nocturnes dangereux.',
        categorie: 'eclairage',
        sousCategorie: 'lampadaire_eteint',
        localisation: { coordonnees: { type: 'Point', coordinates: [10.1450, 36.8350] }, ville: 'Ariana', quartier: 'Ennasr', adresse: 'Rue Principale Ennasr', proximiteZoneSensible: 'aucune' },
        statut: 'en_cours', priorite: 'moyen', scorePriorite: 48,
        soumisePar: citoyens[2]._id,
        assigneA: agents[2]._id, assigneLe: new Date('2026-02-03'),
        nombreVotes: 6, votes: [citoyens[2]._id, citoyens[4]._id]
      },
      {
        titre: 'Bâtiment menaçant de s\'effondrer',
        description: 'Un ancien bâtiment abandonné présente des fissures profondes et des morceaux de façade qui tombent sur le trottoir, mettant en danger les passants.',
        categorie: 'securite',
        sousCategorie: 'batiment_dangereux',
        localisation: { coordonnees: { type: 'Point', coordinates: [10.1690, 36.8030] }, ville: 'Tunis', quartier: 'Médina', adresse: 'Rue Sidi Ben Arous', proximiteZoneSensible: 'espace_public' },
        statut: 'en_cours', priorite: 'urgent', scorePriorite: 92,
        soumisePar: citoyens[3]._id,
        assigneA: agents[0]._id, assigneLe: new Date('2026-02-01'),
        nombreVotes: 15, votes: [citoyens[0]._id, citoyens[1]._id, citoyens[2]._id, citoyens[3]._id, citoyens[4]._id, citoyens[5]._id]
      },

      // --- Résolus ---
      {
        titre: 'Poubelles débordantes Rue de Rome',
        description: 'Les poubelles publiques de la rue de Rome n\'ont pas été vidées depuis plus d\'une semaine et débordent sur les trottoirs avec des odeurs insoutenables.',
        categorie: 'dechets',
        sousCategorie: 'poubelle_pleine',
        localisation: { coordonnees: { type: 'Point', coordinates: [10.1795, 36.8040] }, ville: 'Tunis', quartier: 'Centre ville', adresse: 'Rue de Rome', proximiteZoneSensible: 'aucune' },
        statut: 'resolu', priorite: 'moyen', scorePriorite: 45,
        soumisePar: citoyens[4]._id,
        assigneA: agents[0]._id, assigneLe: new Date('2026-01-25'),
        resoluLe: new Date('2026-01-28'),
        nombreVotes: 7, votes: [citoyens[4]._id, citoyens[0]._id, citoyens[3]._id],
        resolution: { description: 'Poubelles vidées et nettoyage complet de la zone effectué.', cout: 150 }
      },
      {
        titre: 'Fissure profonde sur la chaussée à Sidi Bou Said',
        description: 'Une longue fissure traverse la route principale de Sidi Bou Said, posant un risque pour les véhicules et les piétons.',
        categorie: 'routes',
        sousCategorie: 'fissure',
        localisation: { coordonnees: { type: 'Point', coordinates: [10.3450, 36.8690] }, ville: 'La Marsa', quartier: 'Sidi Bou Said', adresse: 'Route principale', proximiteZoneSensible: 'espace_public' },
        statut: 'resolu', priorite: 'eleve', scorePriorite: 65,
        soumisePar: citoyens[1]._id,
        assigneA: agents[0]._id, assigneLe: new Date('2026-01-20'),
        resoluLe: new Date('2026-01-27'),
        nombreVotes: 4, votes: [citoyens[1]._id, citoyens[5]._id],
        resolution: { description: 'Réparation de la chaussée et pose de nouveau revêtement bitumineux.', cout: 3500 }
      },
      {
        titre: 'Arbre instable menaçant de tomber',
        description: 'Un grand eucalyptus penche dangereusement au-dessus de la route après les fortes pluies de la semaine dernière. Les racines sont apparentes.',
        categorie: 'securite',
        sousCategorie: 'arbre_instable',
        localisation: { coordonnees: { type: 'Point', coordinates: [10.1590, 36.8110] }, ville: 'Tunis', quartier: 'Belvédère', adresse: 'Avenue de Paris', proximiteZoneSensible: 'espace_public' },
        statut: 'resolu', priorite: 'urgent', scorePriorite: 85,
        soumisePar: citoyens[2]._id,
        assigneA: agents[0]._id, assigneLe: new Date('2026-01-15'),
        resoluLe: new Date('2026-01-17'),
        nombreVotes: 10, votes: [citoyens[0]._id, citoyens[1]._id, citoyens[2]._id, citoyens[3]._id],
        resolution: { description: 'Arbre élagué et sécurisé par les services municipaux.', cout: 800 }
      },
      {
        titre: 'Eau stagnante devant l\'hôpital',
        description: 'Une grande flaque d\'eau stagnante persiste devant l\'entrée principale de l\'hôpital Charles Nicolle, gênant l\'accès des ambulances et des patients.',
        categorie: 'eau',
        sousCategorie: 'eau_stagnante',
        localisation: { coordonnees: { type: 'Point', coordinates: [10.1680, 36.8020] }, ville: 'Tunis', quartier: 'Bab Saadoun', adresse: 'Devant Hôpital Charles Nicolle', proximiteZoneSensible: 'hopital' },
        statut: 'resolu', priorite: 'urgent', scorePriorite: 90,
        soumisePar: citoyens[5]._id,
        assigneA: agents[1]._id, assigneLe: new Date('2026-01-18'),
        resoluLe: new Date('2026-01-19'),
        nombreVotes: 20, votes: [citoyens[0]._id, citoyens[1]._id, citoyens[2]._id, citoyens[3]._id, citoyens[4]._id, citoyens[5]._id],
        resolution: { description: 'Drain débouché et pompage de l\'eau stagnante. Installation d\'un nouveau système de drainage.', cout: 2200 }
      },

      // --- Rejetés ---
      {
        titre: 'Bruit excessif du voisin',
        description: 'Mon voisin fait du bruit tous les soirs avec de la musique forte. Ce n\'est plus supportable depuis des mois.',
        categorie: 'autre',
        sousCategorie: 'bruit',
        localisation: { coordonnees: { type: 'Point', coordinates: [10.1500, 36.8300] }, ville: 'Ariana', quartier: 'Ennasr 2', adresse: 'Résidence Les Jasmins', proximiteZoneSensible: 'aucune' },
        statut: 'rejete', priorite: 'faible', scorePriorite: 15,
        soumisePar: citoyens[4]._id,
        nombreVotes: 0,
        rejet: { raison: 'Hors compétence', explication: 'Les nuisances sonores entre voisins relèvent de la police municipale, pas de notre plateforme.', rejetePar: admin._id, rejeteLe: new Date('2026-02-02') }
      },

      // --- Supplémentaires pour volume ---
      {
        titre: 'Signalisation routière manquante au carrefour',
        description: 'Le panneau stop au carrefour de la rue Ibn Khaldoun a été arraché, causant des situations dangereuses aux heures de pointe.',
        categorie: 'routes',
        sousCategorie: 'signalisation',
        localisation: { coordonnees: { type: 'Point', coordinates: [10.1460, 36.8340] }, ville: 'Ariana', quartier: 'Centre', adresse: 'Carrefour Ibn Khaldoun', proximiteZoneSensible: 'aucune' },
        statut: 'recu', priorite: 'eleve', scorePriorite: 70,
        soumisePar: citoyens[2]._id,
        nombreVotes: 5, votes: [citoyens[2]._id, citoyens[4]._id]
      },
      {
        titre: 'Rue inondée après chaque pluie à Mégrine',
        description: 'La rue principale de Mégrine est systématiquement inondée dès qu\'il pleut, rendant impossible la circulation pendant plusieurs heures.',
        categorie: 'inondation',
        sousCategorie: 'rue_inondee',
        localisation: { coordonnees: { type: 'Point', coordinates: [10.2300, 36.7700] }, ville: 'Ben Arous', quartier: 'Mégrine', adresse: 'Rue Principale', proximiteZoneSensible: 'aucune' },
        statut: 'en_cours', priorite: 'urgent', scorePriorite: 82,
        soumisePar: citoyens[4]._id,
        assigneA: agents[1]._id, assigneLe: new Date('2026-02-06'),
        nombreVotes: 9, votes: [citoyens[4]._id, citoyens[0]._id, citoyens[3]._id]
      },
      {
        titre: 'Vandalisme sur les lampadaires de Gammarth',
        description: 'Plusieurs lampadaires du front de mer de Gammarth ont été vandalisés. Les vitres sont cassées et certains fils sont arrachés.',
        categorie: 'eclairage',
        sousCategorie: 'vandalisme',
        localisation: { coordonnees: { type: 'Point', coordinates: [10.2900, 36.9100] }, ville: 'La Marsa', quartier: 'Gammarth', adresse: 'Corniche de Gammarth', proximiteZoneSensible: 'espace_public' },
        statut: 'recu', priorite: 'moyen', scorePriorite: 50,
        soumisePar: citoyens[5]._id,
        nombreVotes: 3, votes: [citoyens[5]._id, citoyens[1]._id]
      }
    ];

    // Pré-assigner les idSignalement pour éviter les doublons en batch
    donneesSignalements.forEach((s, i) => {
      s.idSignalement = `SIG-2026-${String(i + 1).padStart(6, '0')}`;
    });

    // Ajouter les historiqueStatuts à chaque signalement
    donneesSignalements.forEach(s => {
      s.historiqueStatuts = [{ statut: 'recu', modifiePar: s.soumisePar, commentaire: 'Signalement créé' }];
      if (s.statut === 'en_cours' || s.statut === 'resolu' || s.statut === 'rejete') {
        s.historiqueStatuts.push({ statut: 'en_cours', modifiePar: s.assigneA || admin._id, commentaire: 'Prise en charge' });
      }
      if (s.statut === 'resolu') {
        s.historiqueStatuts.push({ statut: 'resolu', modifiePar: s.assigneA || admin._id, commentaire: 'Problème résolu' });
      }
      if (s.statut === 'rejete') {
        s.historiqueStatuts.push({ statut: 'rejete', modifiePar: admin._id, commentaire: s.rejet?.raison || 'Rejeté' });
      }
    });

    const signalements = await Signalement.create(donneesSignalements);
    console.log(`   ${signalements.length} signalements créés`);

    // Mettre à jour les stats des utilisateurs
    for (const citoyen of citoyens) {
      const nb = signalements.filter(s => s.soumisePar.toString() === citoyen._id.toString()).length;
      const nbResolus = signalements.filter(s => s.soumisePar.toString() === citoyen._id.toString() && s.statut === 'resolu').length;
      await Utilisateur.findByIdAndUpdate(citoyen._id, {
        'statistiques.signalementsEnvoyes': nb,
        'statistiques.signalementsResolus': nbResolus
      });
    }

    // Stats agents
    for (const agent of agents) {
      const nbResolus = signalements.filter(s => s.assigneA && s.assigneA.toString() === agent._id.toString() && s.statut === 'resolu').length;
      await Utilisateur.findByIdAndUpdate(agent._id, {
        'statistiques.signalementsResolus': nbResolus
      });
    }

    // ============================================================
    // 4. COMMENTAIRES
    // ============================================================
    console.log('\n💬 Création des commentaires...');

    const commentaires = await Commentaire.create([
      { contenu: 'Ce nid-de-poule a causé un accident de scooter hier, c\'est vraiment urgent !', signalement: signalements[0]._id, auteur: citoyens[1]._id, type: 'mise_a_jour_citoyen' },
      { contenu: 'Je confirme, mon pneu a éclaté à cause de ce trou la semaine dernière.', signalement: signalements[0]._id, auteur: citoyens[3]._id, type: 'mise_a_jour_citoyen' },
      { contenu: 'Les déchets attirent des rats, situation sanitaire préoccupante.', signalement: signalements[1]._id, auteur: citoyens[0]._id, type: 'mise_a_jour_citoyen' },
      { contenu: 'Attention, le câble émet des étincelles quand il pleut !', signalement: signalements[2]._id, auteur: citoyens[3]._id, type: 'mise_a_jour_citoyen' },
      { contenu: 'Nous avons sécurisé le périmètre, intervention prévue demain matin.', signalement: signalements[2]._id, auteur: agents[2]._id, type: 'mise_a_jour_agent' },
      { contenu: 'L\'équipe de plomberie est sur place, réparation en cours.', signalement: signalements[3]._id, auteur: agents[1]._id, type: 'mise_a_jour_agent' },
      { contenu: 'L\'eau continue de couler malgré l\'intervention, il faut couper la vanne principale.', signalement: signalements[3]._id, auteur: citoyens[0]._id, type: 'mise_a_jour_citoyen' },
      { contenu: 'Note interne : commander les pièces de rechange pour la vanne.', signalement: signalements[3]._id, auteur: agents[1]._id, type: 'note_interne', visibilite: 'agents_seulement' },
      { contenu: 'Les odeurs sont devenues insupportables, les commerçants ferment boutique.', signalement: signalements[4]._id, auteur: citoyens[5]._id, type: 'mise_a_jour_citoyen' },
      { contenu: 'Un électricien spécialisé intervient demain pour vérifier le circuit.', signalement: signalements[5]._id, auteur: agents[2]._id, type: 'mise_a_jour_agent' },
      { contenu: 'Le bâtiment a été clôturé par des barrières de sécurité.', signalement: signalements[6]._id, auteur: agents[0]._id, type: 'mise_a_jour_agent' },
      { contenu: 'Un expert du génie civil a été contacté pour évaluer la structure.', signalement: signalements[6]._id, auteur: agents[0]._id, type: 'note_interne', visibilite: 'agents_seulement' },
      { contenu: 'Merci pour la résolution rapide, la rue est de nouveau propre !', signalement: signalements[7]._id, auteur: citoyens[4]._id, type: 'mise_a_jour_citoyen' },
      { contenu: 'Excellent travail, la route est comme neuve.', signalement: signalements[8]._id, auteur: citoyens[1]._id, type: 'mise_a_jour_citoyen' },
      { contenu: 'Merci beaucoup ! Les patients peuvent enfin accéder normalement à l\'hôpital.', signalement: signalements[10]._id, auteur: citoyens[5]._id, type: 'mise_a_jour_citoyen' },
      { contenu: 'La situation est critique, l\'eau monte à chaque averse.', signalement: signalements[13]._id, auteur: citoyens[4]._id, type: 'mise_a_jour_citoyen' },
      { contenu: 'Pompage en cours, étude du réseau d\'évacuation lancée.', signalement: signalements[13]._id, auteur: agents[1]._id, type: 'mise_a_jour_agent' }
    ]);

    console.log(`   ${commentaires.length} commentaires créés`);

    // ============================================================
    // 5. NOTIFICATIONS
    // ============================================================
    console.log('\n🔔 Création des notifications...');

    const notifications = await Notification.create([
      // Notifications pour citoyens (changements de statut)
      { utilisateur: citoyens[0]._id, titre: 'Signalement pris en charge', message: 'Votre signalement "Fuite d\'eau importante rue de Marseille" est passé en statut "en_cours".', type: 'changement_statut', signalementLie: signalements[3]._id, estLue: true, lueLe: new Date('2026-02-05') },
      { utilisateur: citoyens[0]._id, titre: 'Nouveau commentaire', message: 'Un agent a commenté votre signalement "Fuite d\'eau importante rue de Marseille".', type: 'nouveau_commentaire', signalementLie: signalements[3]._id, estLue: true, lueLe: new Date('2026-02-06') },
      { utilisateur: citoyens[1]._id, titre: 'Signalement pris en charge', message: 'Votre signalement "Égout bouché provoquant des odeurs" est passé en statut "en_cours".', type: 'changement_statut', signalementLie: signalements[4]._id, estLue: false },
      { utilisateur: citoyens[2]._id, titre: 'Signalement pris en charge', message: 'Votre signalement "Lampadaires éteints dans tout le quartier Ennasr" est passé en statut "en_cours".', type: 'changement_statut', signalementLie: signalements[5]._id, estLue: false },
      { utilisateur: citoyens[4]._id, titre: 'Signalement résolu', message: 'Votre signalement "Poubelles débordantes Rue de Rome" a été résolu.', type: 'signalement_resolu', signalementLie: signalements[7]._id, estLue: true, lueLe: new Date('2026-01-28') },
      { utilisateur: citoyens[1]._id, titre: 'Signalement résolu', message: 'Votre signalement "Fissure profonde sur la chaussée à Sidi Bou Said" a été résolu.', type: 'signalement_resolu', signalementLie: signalements[8]._id, estLue: true, lueLe: new Date('2026-01-27') },
      { utilisateur: citoyens[2]._id, titre: 'Signalement résolu', message: 'Votre signalement "Arbre instable menaçant de tomber" a été résolu.', type: 'signalement_resolu', signalementLie: signalements[9]._id, estLue: true, lueLe: new Date('2026-01-17') },
      { utilisateur: citoyens[5]._id, titre: 'Signalement résolu', message: 'Votre signalement "Eau stagnante devant l\'hôpital" a été résolu.', type: 'signalement_resolu', signalementLie: signalements[10]._id, estLue: true, lueLe: new Date('2026-01-19') },
      { utilisateur: citoyens[4]._id, titre: 'Signalement rejeté', message: 'Votre signalement "Bruit excessif du voisin" a été rejeté. Motif : Hors compétence.', type: 'changement_statut', signalementLie: signalements[11]._id, estLue: false },

      // Notifications pour agents (assignations)
      { utilisateur: agents[0]._id, titre: 'Nouveau signalement assigné', message: 'Le signalement "Bâtiment menaçant de s\'effondrer" vous a été assigné (priorité urgente).', type: 'signalement_assigne', signalementLie: signalements[6]._id, estLue: true, lueLe: new Date('2026-02-01') },
      { utilisateur: agents[1]._id, titre: 'Nouveau signalement assigné', message: 'Le signalement "Fuite d\'eau importante rue de Marseille" vous a été assigné.', type: 'signalement_assigne', signalementLie: signalements[3]._id, estLue: true, lueLe: new Date('2026-02-05') },
      { utilisateur: agents[1]._id, titre: 'Nouveau signalement assigné', message: 'Le signalement "Rue inondée après chaque pluie à Mégrine" vous a été assigné (priorité urgente).', type: 'signalement_assigne', signalementLie: signalements[13]._id, estLue: false },
      { utilisateur: agents[2]._id, titre: 'Nouveau signalement assigné', message: 'Le signalement "Lampadaires éteints dans tout le quartier Ennasr" vous a été assigné.', type: 'signalement_assigne', signalementLie: signalements[5]._id, estLue: true, lueLe: new Date('2026-02-03') },

      // Notifications admin
      { utilisateur: admin._id, titre: 'Priorité augmentée', message: 'Le signalement "Câble électrique exposé sur un poteau" a atteint un score de priorité urgent (88).', type: 'priorite_augmentee', signalementLie: signalements[2]._id, estLue: false },
      { utilisateur: admin._id, titre: 'Annonce système', message: '15 nouveaux signalements cette semaine. 4 en attente d\'assignation.', type: 'annonce', estLue: false }
    ]);

    console.log(`   ${notifications.length} notifications créées`);

    // ============================================================
    // 6. REGROUPEMENTS
    // ============================================================
    console.log('\n🔗 Création des regroupements...');

    const regroupements = await Regroupement.create([
      {
        centre: { coordonnees: { type: 'Point', coordinates: [10.1760, 36.8000] }, rayon: 150 },
        signalements: [signalements[0]._id, signalements[1]._id, signalements[7]._id],
        nombreSignalements: 3,
        categoriePrincipale: 'routes',
        categories: [{ categorie: 'routes', nombre: 1 }, { categorie: 'dechets', nombre: 2 }],
        scorePrioriteMoyen: 57,
        niveauUrgence: 'moyen',
        datePremierSignalement: new Date('2026-01-25'),
        dateDernierSignalement: new Date('2026-02-07'),
        estActif: true
      },
      {
        centre: { coordonnees: { type: 'Point', coordinates: [10.1710, 36.8010] }, rayon: 200 },
        signalements: [signalements[2]._id, signalements[6]._id, signalements[10]._id],
        nombreSignalements: 3,
        categoriePrincipale: 'securite',
        categories: [{ categorie: 'eclairage', nombre: 1 }, { categorie: 'securite', nombre: 1 }, { categorie: 'eau', nombre: 1 }],
        scorePrioriteMoyen: 87,
        niveauUrgence: 'urgent',
        datePremierSignalement: new Date('2026-01-18'),
        dateDernierSignalement: new Date('2026-02-07'),
        agentAssigne: agents[0]._id,
        estActif: true
      },
      {
        centre: { coordonnees: { type: 'Point', coordinates: [10.3350, 36.8730] }, rayon: 180 },
        signalements: [signalements[4]._id, signalements[8]._id],
        nombreSignalements: 2,
        categoriePrincipale: 'eau',
        categories: [{ categorie: 'eau', nombre: 1 }, { categorie: 'routes', nombre: 1 }],
        scorePrioriteMoyen: 58,
        niveauUrgence: 'moyen',
        datePremierSignalement: new Date('2026-01-20'),
        dateDernierSignalement: new Date('2026-02-04'),
        agentAssigne: agents[1]._id,
        estActif: true
      }
    ]);

    // Mettre à jour les signalements avec leur regroupement
    await Signalement.updateMany(
      { _id: { $in: [signalements[0]._id, signalements[1]._id, signalements[7]._id] } },
      { regroupementId: regroupements[0]._id, aSignalementsMultiples: true }
    );
    await Signalement.updateMany(
      { _id: { $in: [signalements[2]._id, signalements[6]._id, signalements[10]._id] } },
      { regroupementId: regroupements[1]._id, aSignalementsMultiples: true }
    );
    await Signalement.updateMany(
      { _id: { $in: [signalements[4]._id, signalements[8]._id] } },
      { regroupementId: regroupements[2]._id, aSignalementsMultiples: true }
    );

    console.log(`   ${regroupements.length} regroupements créés`);

    // ============================================================
    // 7. STATISTIQUES
    // ============================================================
    console.log('\n📊 Création des statistiques...');

    const maintenant = new Date();
    const statistiques = await Statistique.create([
      {
        periode: 'hebdomadaire',
        dateDebut: new Date('2026-02-01'),
        dateFin: new Date('2026-02-07'),
        totalSignalements: 15,
        signalementsParCategorie: [
          { categorie: 'routes', nombre: 3, resolus: 1 },
          { categorie: 'eclairage', nombre: 3, resolus: 0 },
          { categorie: 'dechets', nombre: 2, resolus: 1 },
          { categorie: 'eau', nombre: 4, resolus: 1 },
          { categorie: 'securite', nombre: 2, resolus: 1 },
          { categorie: 'inondation', nombre: 1, resolus: 0 }
        ],
        tempsResolutionMoyen: 72,
        tauxResolution: 26.7,
        signalementsParStatut: { recu: 5, en_cours: 5, resolu: 4, rejete: 1 },
        utilisateursActifs: 9,
        nouveauxUtilisateurs: 3,
        signalementsParUtilisateur: 1.7,
        pointsChauds: [
          { quartier: 'Centre ville Tunis', nombreSignalements: 5, categorieTop: 'routes' },
          { quartier: 'Bab Bhar', nombreSignalements: 3, categorieTop: 'dechets' },
          { quartier: 'La Marsa', nombreSignalements: 3, categorieTop: 'eau' },
          { quartier: 'Ariana', nombreSignalements: 2, categorieTop: 'eclairage' }
        ],
        votesRecus: 45,
        commentairesMoyenParSignalement: 1.1,
        meilleursAgents: [
          { agentId: agents[0]._id, signalementsResolus: 3, tempsMoyen: 60 },
          { agentId: agents[1]._id, signalementsResolus: 1, tempsMoyen: 24 },
          { agentId: agents[2]._id, signalementsResolus: 0, tempsMoyen: 0 }
        ]
      },
      {
        periode: 'mensuel',
        dateDebut: new Date('2026-01-01'),
        dateFin: new Date('2026-01-31'),
        totalSignalements: 42,
        signalementsParCategorie: [
          { categorie: 'routes', nombre: 10, resolus: 7 },
          { categorie: 'eclairage', nombre: 8, resolus: 5 },
          { categorie: 'dechets', nombre: 7, resolus: 6 },
          { categorie: 'eau', nombre: 9, resolus: 6 },
          { categorie: 'securite', nombre: 5, resolus: 3 },
          { categorie: 'inondation', nombre: 2, resolus: 1 },
          { categorie: 'autre', nombre: 1, resolus: 0 }
        ],
        tempsResolutionMoyen: 96,
        tauxResolution: 66.7,
        signalementsParStatut: { recu: 5, en_cours: 9, resolu: 28, rejete: 0 },
        utilisateursActifs: 25,
        nouveauxUtilisateurs: 8,
        signalementsParUtilisateur: 1.7,
        pointsChauds: [
          { quartier: 'Centre ville Tunis', nombreSignalements: 15, categorieTop: 'routes' },
          { quartier: 'La Marsa', nombreSignalements: 10, categorieTop: 'eau' },
          { quartier: 'Ariana', nombreSignalements: 8, categorieTop: 'eclairage' },
          { quartier: 'Ben Arous', nombreSignalements: 5, categorieTop: 'inondation' }
        ],
        votesRecus: 120,
        commentairesMoyenParSignalement: 2.3,
        meilleursAgents: [
          { agentId: agents[0]._id, signalementsResolus: 12, tempsMoyen: 72 },
          { agentId: agents[1]._id, signalementsResolus: 10, tempsMoyen: 48 },
          { agentId: agents[2]._id, signalementsResolus: 6, tempsMoyen: 120 }
        ]
      }
    ]);

    console.log(`   ${statistiques.length} statistiques créées`);

    // ============================================================
    // RÉSUMÉ
    // ============================================================
    console.log('\n' + '='.repeat(55));
    console.log('✅ MIGRATION TERMINÉE AVEC SUCCÈS');
    console.log('='.repeat(55));
    console.log(`   👤 Utilisateurs   : ${utilisateurs.length} (1 admin, 3 agents, 6 citoyens)`);
    console.log(`   ⚙️  Configuration  : 1`);
    console.log(`   📋 Signalements   : ${signalements.length}`);
    console.log(`   💬 Commentaires   : ${commentaires.length}`);
    console.log(`   🔔 Notifications  : ${notifications.length}`);
    console.log(`   🔗 Regroupements  : ${regroupements.length}`);
    console.log(`   📊 Statistiques   : ${statistiques.length}`);
    console.log('='.repeat(55));
    console.log('\n📌 Comptes de test :');
    console.log('   Admin   : admin@ecohub.com / admin123');
    console.log('   Agent 1 : agent1@ecohub.com / agent123');
    console.log('   Agent 2 : agent2@ecohub.com / agent123');
    console.log('   Agent 3 : agent3@ecohub.com / agent123');
    console.log('   Citoyen : citoyen1@ecohub.com / citoyen123');
    console.log('          ...citoyen6@ecohub.com / citoyen123\n');

    process.exit(0);
  } catch (erreur) {
    console.error('\n❌ Erreur lors de la migration :', erreur.message);
    console.error(erreur.stack);
    process.exit(1);
  }
};

seed();
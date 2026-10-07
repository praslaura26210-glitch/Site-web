import type { Categorie, Famille } from './types';

/** Travaux de départ : on en ajoute d'autres depuis le site. */
export const CATEGORIES_DEPART: Categorie[] = [
  { id: 'memoire', nom: 'Mémoire' },
  { id: 'rde', nom: 'Rapport d’études' },
  { id: 'studio-villefort', nom: 'Studio Vielfaure' },
];

/** Liste de départ des mots-clés, modifiable dans les réglages. */
export const FAMILLES_DEPART: Famille[] = [
  {
    id: 'materiaux',
    nom: 'Matériaux et techniques',
    groupes: [
      { nom: 'Terre', mots: ['terre crue', 'pisé', 'bauge', 'adobe', 'torchis', 'BTC', 'enduit terre', 'terre allégée'] },
      { nom: 'Pierre', mots: ['pierre', 'pierre sèche', 'pierre concassée', 'galets roulés', 'lauze'] },
      { nom: 'Bois', mots: ['bois', 'charpente', 'ossature bois', 'bois massif', 'bardage', 'tavaillon'] },
      { nom: 'Fibres végétales', mots: ['paille', 'chanvre', 'roseau', 'bambou'] },
      { nom: 'Autres matériaux', mots: ['chaux', 'terre cuite', 'béton', 'béton cyclopéen', 'terrazzo', 'métal', 'verre'] },
      { nom: 'Finitions', mots: ['finitions naturelles', 'bois brûlé', 'peinture naturelle', 'enduit'] },
      { nom: 'Démarches', mots: ['écoconstruction', 'rénovation écologique', 'réemploi', 'ressources locales', 'low-tech', 'chantier participatif', 'savoir-faire', 'prototype'] },
    ],
  },
  {
    id: 'themes',
    nom: 'Thèmes',
    groupes: [
      { nom: 'Sensorialité', mots: ['sensorialité', 'toucher', 'odeur', 'lumière', 'acoustique', 'température', 'atmosphère', 'matérialité'] },
      { nom: 'Existant', mots: ['réhabilitation', "dialogue avec l'existant", 'ruine', 'patrimoine', 'vernaculaire', 'reconversion', 'hameau abandonné'] },
      { nom: 'Territoire', mots: ['territoire', 'paysage', 'pente', 'ancrage', 'ruralité', 'eau'] },
      { nom: 'Usages', mots: ['habitat', 'logement social', 'équipement public', 'enfance', 'culte', 'mémoire'] },
      { nom: 'Méthode', mots: ['dessin à la main', 'maquette', 'relevé', 'carnet de voyage', 'méthodologie', 'mémoire de master'] },
    ],
  },
  {
    id: 'architectes',
    nom: 'Architectes',
    groupes: [
      {
        nom: 'Architectes',
        mots: [
          'Dario Castellino', 'Peter Zumthor', 'Carlo Scarpa', 'Anna Heringer', 'RCR Arquitectes', 'Ryue Nishizawa',
          'Barbara Martino', 'Link Architectes', 'Colectivo C733', 'CoA arquitectura', 'Shinslab', 'designbuildLAB',
          'Martin Rauch', 'Gion A. Caminada', 'Wang Shu', 'Lacaton & Vassal', 'Sverre Fehn',
          'Kengo Kuma', 'Studio Mumbai', 'Pierre Chareau', 'Powerhouse Company', 'La Cabina de la Curiosidad', 'HARQUITECTES', 'Collection Architectes',
        ],
      },
    ],
  },
  {
    id: 'lieux',
    nom: 'Lieux',
    groupes: [
      { nom: 'France', mots: ['Drôme', 'Ardèche', 'Isère', 'Hautes-Alpes', 'Rhône', 'Lyon', 'Grenoble'] },
      { nom: 'Europe', mots: ['Alpes', 'Piémont', 'Grisons', 'Italie', 'Suisse', 'Espagne'] },
      { nom: 'Monde', mots: ['Japon', 'Mexique', 'Bangladesh', 'Corée du Sud', 'Inde', 'Équateur', 'États-Unis'] },
    ],
  },
];

/** Synonymes de départ : la recherche d'un terme trouve aussi les autres termes de la ligne. */
export const SYNONYMES_DEPART: string[][] = [
  ['pisé', 'terre compactée', 'terre damée', 'rammed earth', 'tapial'],
  ['bauge', 'terre empilée', 'cob'],
  ['adobe', 'brique de terre crue', 'brique crue'],
  ['BTC', 'brique de terre comprimée', 'bloc de terre comprimée'],
  ['terre crue', 'earth', 'terra cruda'],
  ['pierre sèche', 'drystone', 'muret'],
  ['réhabilitation', 'rénovation', 'transformation', 'recupero'],
  ['ruine', 'vestige', 'rudere', 'rovina'],
  ['sensorialité', 'sensoriel', 'expérience sensible', 'perception'],
  ['toucher', 'tactile', 'haptique'],
  ['odeur', 'olfactif', 'odorat'],
  ['réemploi', 'remploi', 'récupération', 'reuse'],
  ['écoconstruction', 'construction écologique', 'bioconstruction', 'construire en vert'],
  ['bois brûlé', 'shou sugi ban', 'yakisugi'],
  ['mémoire de master', 'mémoire de fin d’études', 'rédaction'],
  ['rapport d’études', 'RDE'],
  ['pierre concassée', 'granulats recyclés', 'gravats'],
  ['terrazzo', 'granito'],
  ['logement social', 'logements sociaux', 'HLM', 'social housing'],
  ['vernaculaire', 'traditionnel', 'architecture sans architecte'],
  ['bois massif', 'CLT', 'bois lamellé-croisé'],
  ['lumière', 'light', 'luce'],
  ['bois', 'timber', 'legno'],
  ['pierre', 'stone', 'pietra'],
];

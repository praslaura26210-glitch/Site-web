// Parcours de Laura (formations et stages), partagé par À propos et la carte du territoire.

export type Etape = { cle: number; date: { fr: string; en: string; it: string }; titre: { fr: string; en: string; it: string }; lieu: string; type: 'f' | 's' };

/** Parcours dans l'ordre chronologique inverse : formations et stages mêlés. */
export const PARCOURS: Etape[] = [
  { cle: 2026.9, type: 'f', date: { fr: 'En cours', en: 'Ongoing', it: 'In corso' }, titre: { fr: 'Master Architecture, Environnement et Cultures Constructives', en: "Master's in Architecture, Environment and Building Cultures", it: 'Master in Architettura, Ambiente e Culture Costruttive' }, lieu: 'ENSA Grenoble' },
  { cle: 2026.5, type: 'f', date: { fr: '2026', en: '2026', it: '2026' }, titre: { fr: 'Licence 3', en: 'Bachelor, 3rd year', it: 'Laurea triennale, 3° anno' }, lieu: 'ENSA Grenoble' },
  { cle: 2025.5, type: 's', date: { fr: 'Juillet 2025', en: 'July 2025', it: 'Luglio 2025' }, titre: { fr: "Stage en architecture d'intérieur", en: 'Interior architecture internship', it: "Tirocinio in architettura d'interni" }, lieu: 'MTG Intérieur, Caluire-et-Cuire' },
  { cle: 2024.1, type: 's', date: { fr: 'Janvier 2024', en: 'January 2024', it: 'Gennaio 2024' }, titre: { fr: 'Stage ouvrier sur chantier', en: 'Site internship, as a builder', it: 'Tirocinio operaio in cantiere' }, lieu: 'Chenavier Caraz, Beaurepaire' },
  { cle: 2023.6, type: 's', date: { fr: 'Juin – août 2023', en: 'June – August 2023', it: 'Giugno – agosto 2023' }, titre: { fr: "Stage en agence d'architecture", en: 'Architecture practice internship', it: 'Tirocinio in studio di architettura' }, lieu: 'ATCD Architecture, Beaurepaire' },
  { cle: 2023.5, type: 'f', date: { fr: '2023', en: '2023', it: '2023' }, titre: { fr: 'Titre RNCP (bac+2), dessinatrice en bâtiment et architecture', en: 'National vocational diploma (2 years), building and architectural draughtswoman', it: 'Diploma professionale (2 anni), disegnatrice edile e di architettura' }, lieu: 'EDAIC, Villeurbanne' },
  { cle: 2022.5, type: 'f', date: { fr: '2022', en: '2022', it: '2022' }, titre: { fr: 'Bac STMG', en: 'Baccalauréat (STMG)', it: 'Maturità (STMG)' }, lieu: 'Lycée du Sacré-Cœur, Tournon-sur-Rhône' },
  { cle: 2022.1, type: 's', date: { fr: 'Février 2022', en: 'February 2022', it: 'Febbraio 2022' }, titre: { fr: "Stage en agence d'architecture", en: 'Architecture practice internship', it: 'Tirocinio in studio di architettura' }, lieu: 'EAD, Salaise-sur-Sanne' },
  { cle: 2021.9, type: 's', date: { fr: 'Décembre 2021', en: 'December 2021', it: 'Dicembre 2021' }, titre: { fr: "Stage en agence d'architecture", en: 'Architecture practice internship', it: 'Tirocinio in studio di architettura' }, lieu: 'Cheeze, Valence' },
];

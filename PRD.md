# Product Requirements Document - gestion-planning-externe

## 📋 Vue d'Ensemble

### Objectif Principal
Automatiser la génération de plannings de gardes hospitalières pour les externes en médecine. **Chaque externe saisit individuellement ses disponibilités, indisponibilités et préférences via un lien personnel.** L'application agrège ensuite toutes ces données et génère automatiquement un planning équitable respectant toutes les contraintes réglementaires et organisationnelles, éliminant ainsi le besoin de réunions de négociation manuelle.

### Problème Résolu
Actuellement, les groupes d'externes (8-11 personnes) passent 2 heures en réunion à négocier manuellement la répartition des gardes via Excel, créant des tensions et des inefficacités. Le processus est fastidieux, subjectif et chronophage. L'application résout ce problème en automatisant la répartition équitable selon un algorithme impartial qui maximise la satisfaction collective tout en respectant 100% des contraintes obligatoires.

### Public Cible
- **Primaire** : Étudiants externes en médecine (stages hospitaliers)
- **Secondaire** : Coordinateurs de services hospitaliers, responsables de planning
- **Taille groupe typique** : 8 à 11 externes par service

## 🎯 Portée du Projet

### ✅ MVP (Minimum Viable Product)
**Ce qui DOIT fonctionner pour lancer**

1. **Configuration de période** : Définir dates début/fin, nombre d'externes, quota de gardes (8-10)
2. **Génération de liens personnels** : Token unique par externe pour saisie isolée
3. **Saisie des contraintes individuelles** : Interface calendrier pour chaque externe (indisponibilités rouge, disponibilités blanc, préférences vert)
4. **Dashboard admin** : Suivi temps réel des participants ayant complété leurs vœux
5. **Génération automatique** : Algorithme qui produit un planning respectant :
   - 1 externe par jour
   - Pas de gardes consécutives
   - Repos de 24h après chaque garde
   - Quota 8-10 gardes par personne
   - Équité sur les préférences (~40-50% de satisfaction)
6. **Visualisation du planning** : Calendrier/tableau affichant le résultat final
7. **Export basique** : Export Excel du planning validé

### 🚀 V1 (Version 1)
**Fonctionnalités additionnelles importantes**

1. **Optimisation dimanches** : Garantir au moins 1 dimanche par externe (rémunération majorée)
2. **Notifications email** : Invitations automatiques, relances, notification résultat
3. **Statistiques d'équité** : Dashboard montrant taux de satisfaction par personne, répartition des dimanches, etc.
4. **Historique & templates** : Sauvegarder plannings précédents, réutiliser configurations
5. **Export multiple** : PDF, iCal, Google Calendar
6. **Ajustements manuels** : Possibilité de modifier le planning généré avant validation
7. **Réouverture de saisie** : Permettre corrections après génération (avec regénération)

### 💎 V2+ (Futures versions)
**Fonctionnalités bonus, non prioritaires**

1. **Multi-services** : Gérer plusieurs groupes/services en parallèle
2. **Notifications push** : Rappels automatiques des gardes à venir
3. **Mobile app** : Application native iOS/Android
4. **Système de swap** : Échange de gardes entre externes avec validation
5. **Analytics avancées** : Historique personnel, charge de travail sur l'année
6. **Intégration hospitalière** : API pour synchronisation avec systèmes RH hôpitaux

### ❌ Hors Périmètre
**Ce qui ne sera PAS fait**

- Gestion de paie ou rémunération
- Gestion de présence/pointage
- Communication/messagerie entre externes
- Gestion de compétences ou formations
- Plannings multi-sites complexes (MVP = 1 service)
- Intégrations avec logiciels hospitaliers (hors V2+)

## 👤 User Stories

### Externe (Utilisateur Principal)
**En tant qu'** externe en médecine
**Je veux** recevoir un lien personnel pour saisir MES propres indisponibilités et préférences
**Afin de** remplir mon formulaire de façon autonome sans voir les choix des autres

**En tant qu'** externe
**Je veux** modifier mes vœux tant que le planning n'est pas généré
**Afin de** corriger des erreurs ou ajuster selon mon emploi du temps

**En tant qu'** externe
**Je veux** être notifié quand le planning final est prêt
**Afin de** découvrir mes gardes assignées

**En tant qu'** externe
**Je veux** voir combien de mes préférences ont été satisfaites
**Afin de** vérifier l'équité du planning

**En tant qu'** externe
**Je veux** exporter mon planning personnel au format iCal
**Afin de** l'intégrer dans mon calendrier Google/Outlook

### Coordinateur/Admin
**En tant que** responsable de service (ou externe désigné coordinateur)
**Je veux** envoyer un lien unique à chacun des 8-12 externes
**Afin que** chacun remplisse ses vœux de façon isolée et indépendante

**En tant que** coordinateur
**Je veux** voir en temps réel qui a complété ses vœux
**Afin de** relancer les retardataires avant de lancer la génération

**En tant que** coordinateur
**Je veux** lancer la génération uniquement quand tous ont répondu
**Afin d'** éviter un planning incomplet

**En tant que** coordinateur
**Je veux** ajuster manuellement 1-2 gardes si nécessaire
**Afin de** gérer des cas particuliers après génération automatique

## 🎨 Expérience Utilisateur

### Interface Principale
**Écran en 4 étapes séquentielles :**

1. **Setup** (Admin/Coordinateur uniquement) :
   - Formulaire : dates, nombre externes (variable 8-12), quota gardes
   - Ajout participants : Nom + Email de chaque externe
   - **Génération automatique de liens uniques individuels**
   - Bouton "Envoyer les invitations par email" (ou copie manuelle des liens)

2. **Saisie INDIVIDUELLE** (Chaque externe sur son lien personnel) :
   - **Écran d'accueil** : "Bonjour [Nom], remplissez vos vœux pour la période [dates]"
   - Calendrier interactif sur 3 mois (vue isolée, pas de visibilité sur les autres)
   - Clic pour marquer : Rouge (indispo) / Blanc (dispo) / Vert (préférence ~10 jours)
   - Compteur temps réel : "Vous avez marqué 12 préférences, 5 indispos"
   - **Bouton "Enregistrer mes vœux"** → Confirmation "Merci, vos vœux sont enregistrés"
   - Possibilité de revenir modifier tant que planning pas généré

3. **Dashboard Admin** (Coordinateur) :
   - Liste participants avec statut :
     - ✅ "Baptiste : Vœux complétés le 05/02"
     - ⏳ "Chloé : En attente"
     - ⏳ "Jean : En attente"
   - Bouton "Lancer la génération" (actif uniquement si 100% complétés)

4. **Résultat** (Visible par tous après génération) :
   - Vue calendrier avec noms assignés par jour
   - Code couleur par personne
   - Stats individuelles : "Baptiste : 9 gardes, 4/10 préférences, 2 dimanches"

### Navigation
- **Workflow linéaire** pour MVP : Setup → Invitations → Saisie → Dashboard Admin → Génération → Export
- **Navigation secondaire** (V1) : Sidebar avec Plannings actifs, Historique, Paramètres

### Actions Clés
1. **Admin crée planning** → Génère liens uniques pour chaque externe
2. **Externe remplit calendrier** → Enregistrement auto, indicateur "Complété"
3. **Admin lance génération** (quand 100% complétés) → Algorithme tourne (5-30 sec) → Résultat affiché
4. **Utilisateur exporte** → Téléchargement immédiat Excel/PDF/iCal

## 📊 Données et Contenu

### Données Entrantes
- **Configuration planning** : Date début, date fin, nombre externes, quota min/max (JSON)
- **Participants** : Nom, email (saisie manuelle)
- **Contraintes individuelles** :
  - Indisponibilités : `[{date: "2025-04-15", type: "unavailable"}]`
  - Préférences : `[{date: "2025-04-20", type: "preferred"}]`

### Données Stockées
- **Base de données relationnelle** :
  - Table `plannings` : id, période, statut (`draft|collecting|generated|finalized`), créateur, date_création
  - Table `participants` : id, planning_id, nom, email, **token_unique**, statut_saisie (`pending|completed`), date_complétion
  - Table `contraintes` : id, participant_id, date, type (`unavailable|preferred|available`)
  - Table `resultats` : id, planning_id, date, participant_assigné
  - (V1) Table `emails_log` : Traçabilité envois/ouvertures

### Données Sortantes
- **Export Excel** : Tableau avec dates en lignes, externes en colonnes
- **Export iCal** : Un fichier .ics par externe avec ses gardes
- **PDF** : Planning visuel formaté pour impression
- **JSON API** (V2+) : Pour intégrations tierces

## ⚙️ Exigences Fonctionnelles

### F1 - Configuration de Planning
**Description** : Créer un nouveau planning avec paramètres de période et contraintes globales
**Priorité** : MVP
**Critères d'acceptance** :
- [ ] Sélection date début et fin (calendrier)
- [ ] Définition nombre d'externes (8-11)
- [ ] Définition quota gardes (min 8, max 10)
- [ ] Validation : période minimum 30 jours, maximum 120 jours
- [ ] Génération automatique d'ID unique planning

### F2 - Gestion des Participants
**Description** : Ajouter les externes et générer un lien unique personnel par personne
**Priorité** : MVP
**Critères d'acceptance** :
- [ ] Formulaire ajout externe (nom obligatoire, email obligatoire pour envoi auto)
- [ ] **Génération d'un TOKEN unique et sécurisé par externe** (non devinable)
- [ ] URL format : `https://app.com/saisie/{token_unique}`
- [ ] Bouton "Envoyer invitations" → Email automatique avec lien personnel
- [ ] Alternative : Copie manuelle du lien (si pas d'email fourni)
- [ ] Liste des participants avec statut "En attente" / "Complété" / "Non envoyé"

### F3 - Interface de Saisie Contraintes
**Description** : Calendrier interactif PERSONNEL pour marquer indispos/dispos/préférences
**Priorité** : MVP
**Critères d'acceptance** :
- [ ] **Accès via token unique** : Validation du lien avant affichage
- [ ] **Isolation totale** : L'externe voit UNIQUEMENT ses propres choix (pas ceux des autres)
- [ ] Affichage nom externe en header : "Vœux de [Nom]"
- [ ] Vue calendrier mensuel (3 mois visibles)
- [ ] Clic sur date : cycle Rouge → Vert → Blanc
- [ ] Légende claire : Rouge = indispo, Vert = préféré (~10 max conseillé), Blanc = dispo
- [ ] Compteur temps réel des sélections
- [ ] Sauvegarde automatique (debounce 2 sec) + message "Enregistré ✓"
- [ ] **Bouton "Confirmer et soumettre mes vœux"** → Statut passe à "Complété"
- [ ] **Possibilité de rééditer** : Si planning pas encore généré, lien reste actif

### F4 - Algorithme de Génération
**Description** : Moteur d'optimisation pour créer planning équitable
**Priorité** : MVP
**Critères d'acceptance** :
- [ ] Respect 100% des indisponibilités (contrainte dure)
- [ ] 1 externe par jour garanti
- [ ] Pas de gardes consécutives
- [ ] Quota 8-10 gardes par personne respecté
- [ ] Équité préférences : écart-type < 1,5 entre participants
- [ ] Temps calcul < 60 secondes pour 11 externes sur 90 jours
- [ ] Message d'erreur si solution impossible (avec suggestions)

### F5 - Visualisation du Résultat
**Description** : Affichage du planning généré avec statistiques
**Priorité** : MVP
**Critères d'acceptance** :
- [ ] Vue calendrier avec nom assigné par jour
- [ ] Code couleur par externe (couleur auto-assignée)
- [ ] Tableau récapitulatif : Externe | Nb gardes | Nb préférences obtenues
- [ ] Indication des dimanches (badge spécial)
- [ ] Responsive (mobile + desktop)

### F6 - Export Planning
**Description** : Téléchargement du planning en différents formats
**Priorité** : MVP (Excel), V1 (autres formats)
**Critères d'acceptance** :
- [ ] Export Excel : dates en lignes, externes en colonnes, couleurs préservées
- [ ] Nom fichier : `planning_gardes_AAAA-MM-DD.xlsx`
- [ ] (V1) Export PDF : vue calendrier imprimable
- [ ] (V1) Export iCal : 1 fichier par externe avec ses gardes

### F7 - Optimisation Dimanches
**Description** : Garantir équité sur jours majorés (dimanches)
**Priorité** : V1
**Critères d'acceptance** :
- [ ] Contrainte algorithmique : min 1 dimanche par externe
- [ ] Affichage badge "Dimanche" dans résultat
- [ ] Stats : "X dimanches" dans tableau récapitulatif

### F8 - Ajustements Manuels
**Description** : Modifier le planning après génération
**Priorité** : V1
**Critères d'acceptance** :
- [ ] Mode édition : drag-and-drop pour échanger gardes
- [ ] Validation : respect contraintes (pas de gardes consécutives)
- [ ] Historique : tracer modifications manuelles
- [ ] Bouton "Réinitialiser au planning auto"

### F9 - Notifications & Relances
**Description** : Système d'emails pour fluidifier le processus
**Priorité** : V1
**Critères d'acceptance** :
- [ ] Email invitation : "Lien pour remplir vos vœux de garde [période]"
- [ ] Email relance auto : Si non complété après 48h (paramétrable)
- [ ] Email notification finale : "Le planning est prêt, consultez vos gardes"
- [ ] Désactivation possible des emails (mode "copie manuelle" uniquement)

### F10 - Gestion d'État du Planning
**Description** : Workflow d'états pour éviter modifications concurrentes
**Priorité** : MVP
**Critères d'acceptance** :
- [ ] États : "En cours de saisie" → "Prêt à générer" → "Généré" → "Validé"
- [ ] Blocage génération si < 100% participants complétés
- [ ] **Verrouillage liens saisie** après génération (message "Planning déjà généré")
- [ ] (V1) Possibilité "Rouvrir la saisie" (réinitialise statut, prévient externes)

## 🔒 Exigences Non-Fonctionnelles

### Performance
- Temps de chargement page : < 2 secondes
- Temps de génération planning : < 60 secondes (11 externes, 90 jours)
- Sauvegarde contraintes : < 500ms après saisie

### Sécurité
- **Authentification par token unique** (UUID v4, 32+ caractères)
- **Isolation stricte** : Chaque token donne accès uniquement à SES propres données
- Pas d'accès cross-participant (validation backend systématique)
- **Expiration tokens** : Optionnelle (si planning non généré après X jours)
- HTTPS obligatoire en production
- Rate limiting sur endpoints saisie (anti-spam)
- Conformité RGPD : données minimales, pas de vente, droit à l'oubli

### Accessibilité
- Responsive : mobile (≥360px), tablet (≥768px), desktop (≥1024px)
- Contraste WCAG AA (ratio ≥ 4.5:1)
- Navigation clavier complète
- Labels ARIA sur calendrier interactif

### Compatibilité
- **Navigateurs** : Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Appareils** : iOS 14+, Android 10+, Windows 10+, macOS 11+
- **Résolution** : 360px à 2560px

## 🎯 Métriques de Succès

### MVP
- **Adoption** : 5 groupes d'externes utilisent l'outil sur 1 mois
- **Temps gagné** : Réduction de 2h → 15 min (collecte + génération)
- **Satisfaction** : Score ≥ 4/5 sur questionnaire post-utilisation
- **Fiabilité** : 95% de plannings générés sans erreur (contraintes respectées)

### V1+
- **Équité perçue** : 80% des utilisateurs jugent la répartition "équitable" ou "très équitable"
- **Réutilisation** : 70% des groupes créent un 2ème planning (trimestre suivant)
- **Ajustements manuels** : < 10% des plannings nécessitent modifications post-génération

## 📅 Timeline (Estimatif)

- **MVP** : 3-4 semaines
  - Semaine 1 : Architecture + Backend (API + algo basique)
  - Semaine 2 : Frontend (setup + saisie)
  - Semaine 3 : Génération + visualisation
  - Semaine 4 : Tests + export Excel

- **V1** : +2-3 semaines après MVP
  - Dimanches, ajustements manuels, exports multiples, notifications

- **V2** : +4-6 semaines (selon priorisation features)

## ❓ Questions en Suspens

- [ ] **Algorithme** : OR-Tools (Google) vs PuLP vs solution custom ? (Impact : complexité dev, performance)
- [ ] **Hébergement** : Cloud (Vercel/Render) vs auto-hébergé ? (Impact : coût, maintenance)
- [ ] **Authentification V1** : Magic links email vs système comptes ? (Impact : UX, sécurité)
- [ ] **Email obligatoire** : Si externe n'a pas d'email, comment gérer ? (SMS ? Copie lien manuelle uniquement ?)
- [ ] **Réouverture saisie** : Si 1 externe veut modifier après génération, faut-il tout regénérer ou bloquer ?
- [ ] **Vœux anonymes** : Doit-on cacher qui a mis quoi avant génération ? (Éviter influence mutuelle)
- [ ] **Validation admin** : Le coordinateur peut-il modifier les vœux d'un externe absent ? (Risque éthique)
- [ ] **Cas impossible** : Si aucune solution n'existe (trop d'indispos), fallback ? Suggestion relaxation contraintes ?
- [ ] **Langue** : Français uniquement ou i18n dès MVP ? (Impact : ~10% temps dev supplémentaire)
- [ ] **Données sensibles** : Considérer les noms d'externes comme données médicales ? (Impact : compliance RGPD stricte)

## 📝 Notes et Contraintes

**Workflow détaillé :**
1. Admin crée planning → Ajoute 10 externes avec emails
2. Système génère 10 tokens uniques → Envoie 10 emails (ou copie manuelle)
3. Chaque externe (indépendamment, à son rythme) :
   - Clique sur son lien personnel
   - Remplit son calendrier (rouge/vert/blanc)
   - Valide ses vœux
4. Admin suit progression (dashboard : 7/10 complétés)
5. Relance les retardataires
6. Quand 10/10 → Lance génération
7. Algorithme agrège TOUS les vœux → Résout contraintes → Génère planning
8. Notification à tous : "Planning disponible"

**Contraintes techniques :**
- Problème NP-difficile (bin packing + contraintes multiples) → Heuristiques nécessaires si groupes >15 externes
- Poids des préférences : Compromis satisfaction individuelle vs équité collective (calibrage à tester)

**Contraintes réglementaires :**
- Gardes 24h fixes (8h30-8h30) → Pas de flexibilité horaires dans MVP
- Repos obligatoire 24h → Validation stricte dans algo
- Rémunération dimanches → Impacte priorisation mais pas calcul direct

**Hypothèses :**
- Les externes ne se concertent PAS avant de remplir (important pour équité)
- Chacun peut avoir des agendas très différents (études, famille, loisirs)
- Pas de "chef" qui impose : système démocratique automatisé
- Tous les externes sont de bonne foi (pas de gaming du système)
- Admin = 1 personne du groupe, pas de hiérarchie formelle
- Pas de contraintes légales bloquantes pour stockage données planning

**Risques identifiés :**
- **Complexité algo** : Si solution impossible, risque frustration utilisateurs → Mitigation : messages clairs + suggestions
- **Adoption** : Résistance au changement (Excel = familier) → Mitigation : Démo + UX simple
- **Équité perçue** : Même si mathématiquement juste, peut être contesté → Mitigation : Transparence stats + possibilité ajustements V1
- **Sécurité tokens** : Liens partagés par erreur → Mitigation : Expiration + logs d'accès (V1)

---

**Dernière mise à jour** : 05/02/2025
**Version** : 1.0
**Auteur** : Steeve (pour groupe externes médecine)

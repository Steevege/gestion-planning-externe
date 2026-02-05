# Instructions Projet - gestion-planning-externe

## 🌍 Langue et Communication
- **Toutes les communications en FRANÇAIS** (explications, commentaires, docs)
- **Spécifications techniques en FRANÇAIS** y compris sections Purpose et Scenarios
- **Seuls les titres de Requirements en ANGLAIS** avec SHALL/MUST (validation OpenSpec)
- Code et variables en anglais (convention standard)

## 🎨 Philosophie de Développement
- **Pensée Chef de Produit** : Focus sur le QUOI, pas le COMMENT
- **Itératif** : Une fonctionnalité à la fois
- **Simple avant tout** : MVP d'abord, sophistication ensuite

## 🔧 Environnement Technique

### Outils Pré-installés (NE PAS RÉINSTALLER)
- ✅ Playwright (global) - Vérifier avec `npx playwright --version`
- ✅ Node.js - Vérifier avec `node --version`
- ✅ Git configuré

### MCP Configurés
- **Context7** : Documentation à jour des bibliothèques
  - Utiliser AUTOMATIQUEMENT pour toute génération de code
  - Ne jamais se fier uniquement aux données d'entraînement
- **Playwright** : Tests et navigation web
  - Utiliser pour valider chaque interface graphique

## 🎯 Workflow Standard

### Phase 1 : Découverte
1. Clarifier l'objectif du projet
2. Définir MVP / V1 / V2 / Hors-périmètre
3. Documenter dans @PRD.md

### Phase 2 : Architecture
1. Proposer tech stack adapté (think hard)
2. Comparer les options
3. Documenter dans @ARCHITECTURE.md

### Phase 3 : Setup
1. Configuration Git + .env
2. Permissions Claude
3. Installation dépendances nécessaires UNIQUEMENT

### Phase 4 : Build
1. `/openspec:proposal` - Planifier la feature
2. `/openspec:apply` - Implémenter
3. Tester avec playwright-skill
4. `/openspec:archive` - Valider et archiver
5. Git push
6. Répéter pour feature suivante

## 🎨 Standards UI/UX

### Design
- Interface claire et minimaliste
- Responsive OBLIGATOIRE (mobile-first)
- Accessibilité (contraste, tailles de texte)
- Pas de mode sombre pour MVP (sauf demande explicite)

### Tests
- Tester CHAQUE interface avec playwright-skill
- Vérifier responsive sur mobile/tablet/desktop
- Valider accessibilité de base

## 🔒 Sécurité & Bonnes Pratiques

### Obligatoire
- ❌ NE JAMAIS exposer clés API côté client
- ✅ Toutes les clés dans `.env` (jamais commitées)
- ✅ Validation des inputs utilisateur
- ✅ Gestion d'erreurs explicite

### Architecture
- Préférer composants existants vs nouvelles dépendances
- Garder le code simple et lisible
- Commenter les parties complexes EN FRANÇAIS

## 📚 Documentation

### Fichiers Attendus
- `@PRD.md` - Spécifications produit
- `@ARCHITECTURE.md` - Choix techniques
- `README.md` - Guide d'installation et utilisation
- `.env.example` - Template des variables d'environnement

### Format des Commits
```
type: description courte

- Détail 1
- Détail 2
```
Types : `feat`, `fix`, `docs`, `style`, `refactor`, `test`

## 🚨 Checks Avant Chaque Feature

Avant de commencer une nouvelle fonctionnalité :
1. [ ] `/clear` - Nettoyer le contexte
2. [ ] Vérifier @PRD.md et @ARCHITECTURE.md
3. [ ] Context7 activé pour cette feature ?
4. [ ] Plan validé avec `/openspec:proposal`

Après implémentation :
1. [ ] Tests playwright passent
2. [ ] Responsive vérifié
3. [ ] Pas d'erreurs console
4. [ ] Documentation mise à jour si nécessaire
5. [ ] Commit + Push

## 💡 Commandes Utiles

### Navigation
- `@fichier.md` - Référencer un fichier
- Screenshot - Coller erreurs/designs directement

### Contrôle
- `/clear` - Nettoyer contexte (chaque nouvelle tâche)
- `/context` - Vérifier usage tokens
- `/model` - Changer modèle si besoin
- `Esc` - Stopper action en cours
- `⇧ Shift+Tab` - Basculer mode Plan/Build
- `⇧ Shift+Enter` - Retour à la ligne

### OpenSpec
- `/openspec:proposal` - Créer spec feature
- `/openspec:apply` - Implémenter spec
- `/openspec:archive` - Archiver feature terminée

## 🎭 Context7 - RÈGLE IMPORTANTE

Utilise toujours context7 lorsque j'ai besoin de génération de code, d'étapes de configuration ou d'installation, ou de documentation de bibliothèque/API. Cela signifie que tu dois automatiquement utiliser les outils MCP Context7 pour résoudre l'identifiant de bibliothèque et obtenir la documentation de bibliothèque sans que j'aie à le demander explicitement.

---

**Note** : Ce fichier évolue avec chaque projet. Ajuster selon besoins spécifiques.

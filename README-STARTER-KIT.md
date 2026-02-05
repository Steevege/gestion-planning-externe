# 🚀 Claude Code Starter Kit

Un kit complet pour démarrer rapidement vos projets avec Claude Code, incluant templates, bonnes pratiques et workflow automatisé.

## ✨ Ce que contient ce starter kit

### 📄 Templates de Documentation
- **CLAUDE.md** - Instructions complètes pour Claude (workflow, standards, commandes)
- **PRD-TEMPLATE.md** - Template de Product Requirements Document
- **ARCHITECTURE-TEMPLATE.md** - Template de documentation technique
- **README.md** - Template README pour vos projets

### ⚙️ Configuration
- **.claude/settings.local.json** - Permissions pré-configurées pour Claude
- **.env.example** - Template de variables d'environnement
- **.gitignore** - Fichiers à ignorer (node_modules, .env, etc.)

### 🛠️ Outils
- **START-NEW-PROJECT.sh** - Script automatisé de création de projet

## 🎯 Installation

Le starter kit est déjà installé et prêt à l'emploi !

**Emplacement** : `/Users/steevegernez/Documents/claude-projets/claude-starter-kit`

**Alias disponible** : `new-claude` (pour créer un nouveau projet n'importe où)

## 🚀 Utilisation

### Créer un nouveau projet

```bash
# Depuis n'importe quel dossier
new-claude
```

Le script vous demandera un nom de projet, puis :
1. ✅ Crée un nouveau dossier avec le nom du projet
2. ✅ Copie tous les templates
3. ✅ Remplace `gestion-planning-externe` par le nom réel
4. ✅ Renomme les fichiers templates (PRD-TEMPLATE.md → PRD.md)
5. ✅ Initialise Git avec un commit initial
6. ✅ Prêt à l'emploi !

### Workflow recommandé

```bash
# 1. Créer le projet
new-claude
# Entrer le nom : mon-super-projet

# 2. Aller dans le projet
cd mon-super-projet

# 3. Éditer le PRD avec vos specs
# Ouvrir PRD.md et remplir les sections

# 4. Lancer Claude Code
claude

# 5. Demander à Claude de proposer l'architecture
# "Lis le PRD et propose-moi une architecture technique"

# 6. Commencer à développer avec OpenSpec
# /openspec:proposal pour planifier chaque feature
# /openspec:apply pour implémenter
# /openspec:archive pour valider et archiver
```

## 📋 Fichiers générés pour chaque nouveau projet

```
mon-projet/
├── .claude/
│   ├── agents/              # Vide (pour vos agents custom)
│   ├── hooks/               # Vide (pour vos hooks custom)
│   └── settings.local.json  # Permissions Claude pré-configurées
├── .env.example             # Template variables d'environnement
├── .gitignore              # Fichiers à ignorer
├── ARCHITECTURE.md         # À remplir avec vos choix techniques
├── CLAUDE.md               # Instructions pour Claude
├── PRD.md                  # À remplir avec vos specs produit
└── README.md               # Guide d'installation/utilisation
```

## 🎨 Philosophie du Starter Kit

### Pensée Chef de Produit
- Focus sur le **QUOI** (fonctionnalités), pas le **COMMENT** (implémentation)
- Itératif : une fonctionnalité à la fois
- MVP d'abord, sophistication ensuite

### Standards Inclus
- ✅ Communication en FRANÇAIS (sauf code)
- ✅ Workflow OpenSpec intégré
- ✅ Tests automatiques avec Playwright
- ✅ Sécurité : gestion des secrets via .env
- ✅ Responsive obligatoire
- ✅ Documentation structurée

### Outils Pré-configurés
- Context7 : documentation à jour des bibliothèques
- Playwright : tests et navigation web
- Git : commits formatés et bonnes pratiques

## 🔧 Personnalisation

### Modifier les templates

Vous pouvez éditer les templates directement dans le starter kit :
- `CLAUDE.md` - Ajuster les instructions pour Claude
- `PRD-TEMPLATE.md` - Modifier la structure du PRD
- `ARCHITECTURE-TEMPLATE.md` - Adapter le template d'architecture
- `.claude/settings.local.json` - Ajouter/retirer des permissions

Les modifications seront appliquées aux prochains projets créés.

### Ajouter des fichiers

Placez de nouveaux fichiers dans le starter kit, ils seront copiés automatiquement dans chaque nouveau projet.

## 💡 Commandes Utiles

### Pour le Starter Kit
```bash
# Mettre à jour un template
cd ~/Documents/claude-projets/claude-starter-kit
# Éditer le fichier souhaité
git add .
git commit -m "docs: update template XYZ"

# Voir l'historique des changements
git log --oneline
```

### Dans vos projets
```bash
# Nettoyer le contexte Claude
/clear

# Vérifier l'usage des tokens
/context

# Planifier une feature
/openspec:proposal

# Implémenter une spec
/openspec:apply

# Archiver une feature terminée
/openspec:archive
```

## 🎯 Checks Avant Chaque Feature

Avant de commencer une nouvelle fonctionnalité :
- [ ] `/clear` - Nettoyer le contexte
- [ ] Vérifier @PRD.md et @ARCHITECTURE.md
- [ ] Context7 activé pour cette feature ?
- [ ] Plan validé avec `/openspec:proposal`

Après implémentation :
- [ ] Tests playwright passent
- [ ] Responsive vérifié (mobile/tablet/desktop)
- [ ] Pas d'erreurs console
- [ ] Documentation mise à jour si nécessaire
- [ ] Commit + Push

## 📚 Ressources

### Workflow OpenSpec
1. **Proposal** - Planifier la feature avec `/openspec:proposal`
2. **Apply** - Implémenter avec `/openspec:apply`
3. **Archive** - Valider et archiver avec `/openspec:archive`

### MCP Context7
Utilisé automatiquement pour :
- Documentation de bibliothèques
- Étapes de configuration
- Exemples de code à jour

## ❓ FAQ

**Q: Puis-je modifier un template après avoir créé des projets ?**
R: Oui, mais ça n'affectera que les nouveaux projets. Les projets existants ne seront pas modifiés.

**Q: Comment ajouter un nouveau fichier au template ?**
R: Ajoutez-le dans le dossier du starter kit, il sera copié automatiquement dans les nouveaux projets.

**Q: L'alias `new-claude` ne fonctionne pas**
R: Exécutez `source ~/.zshrc` pour recharger votre configuration shell.

**Q: Puis-je renommer le starter kit ?**
R: Oui, mais pensez à mettre à jour l'alias dans votre `~/.zshrc`.

## 🤝 Contribuer

Ce starter kit évolue avec vos projets. N'hésitez pas à :
- Améliorer les templates
- Ajouter de nouveaux fichiers utiles
- Partager vos bonnes pratiques
- Documenter vos workflows

## 📝 Changelog

### v1.0 - 2026-02-05
- ✨ Templates initiaux (CLAUDE, PRD, ARCHITECTURE)
- ✨ Script de création de projet
- ✨ Configuration Claude pré-configurée
- ✨ Alias shell `new-claude`

---

**Emplacement** : `/Users/steevegernez/Documents/claude-projets/claude-starter-kit`
**Alias** : `new-claude`
**Version** : 1.0

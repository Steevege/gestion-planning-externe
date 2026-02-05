# 🏥 Gestion Planning Gardes - Externes Médecine

Application web pour automatiser la génération de plannings de gardes hospitalières pour les externes en médecine.

## 🎯 Fonctionnalités MVP

- ✅ Création de planning (admin)
- ✅ Génération de liens personnels sécurisés
- ✅ Saisie individuelle des vœux (rouge/vert/blanc)
- ✅ Dashboard admin (suivi temps réel des participants)
- ✅ Génération automatique via algorithme d'optimisation
- ✅ Visualisation du résultat + statistiques
- ✅ Export Excel

## 🚀 Quick Start

### 1. Setup Supabase (FAIT ✅)

Votre projet Supabase est configuré :
- ✅ Project URL: https://pkdfdbnrgeirbzmqpbhz.supabase.co
- ✅ Variables d'environnement dans `.env.local`

**Action requise** : Créer les tables en copiant le contenu de `supabase-setup.sql` dans l'éditeur SQL Supabase.

#### Comment faire :
1. Ouvrir https://supabase.com/dashboard/project/pkdfdbnrgeirbzmqpbhz/sql/new
2. Copier TOUT le contenu de `supabase-setup.sql`
3. Coller dans l'éditeur
4. Cliquer "Run" (en bas à droite)
5. Vérifier que 5 tables sont créées (plannings, participants, contraintes, resultats, emails_log)

### 2. Démarrer le serveur de développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

### 3. Tester l'installation

Si vous voyez la page d'accueil avec les boutons "Créer un planning" et "Saisir mes vœux", **c'est bon !** ✅

## 📦 Stack Technique

- **Frontend + Backend** : Next.js 16.1.6 (App Router)
- **Base de données** : Supabase (PostgreSQL)
- **UI** : React 19 + Tailwind CSS
- **Calendrier** : React Big Calendar 1.19.4
- **Algorithme** : javascript-lp-solver
- **Hébergement** : Vercel (gratuit)

## 📁 Structure du Projet

```
gestion-planning-externe/
├── app/
│   ├── api/              # API Routes (à créer)
│   ├── admin/            # Pages admin (à créer)
│   ├── saisie/           # Pages saisie externe (à créer)
│   ├── resultat/         # Pages résultat (à créer)
│   ├── components/       # Composants React (à créer)
│   ├── lib/
│   │   └── supabase.ts   # Client Supabase ✅
│   ├── layout.tsx        # Layout global ✅
│   ├── page.tsx          # Landing page ✅
│   └── globals.css       # Styles globaux ✅
├── public/               # Assets statiques
├── supabase-setup.sql    # Script création tables ✅
├── .env.local            # Variables d'environnement ✅
├── PRD.md                # Product Requirements ✅
├── ARCHITECTURE.md       # Architecture technique ✅
└── README.md             # Ce fichier
```

## 🔐 Variables d'Environnement

Les variables sont déjà configurées dans `.env.local` :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://pkdfdbnrgeirbzmqpbhz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

**Important** : Ce fichier n'est PAS commité (dans `.gitignore`).

## 🧪 Tests

```bash
# Tests unitaires (Vitest)
npm run test

# Tests d'interface (Playwright)
npx playwright test

# Lint
npm run lint
```

## 📚 Documentation

- **PRD** : Voir `PRD.md` (spécifications produit complètes)
- **Architecture** : Voir `ARCHITECTURE.md` (détails techniques)
- **Quick Start** : Voir `QUICK_START.md` (guide installation 30 min)
- **API Docs** : Voir `LIBRARIES_DOCUMENTATION.md` (doc des bibliothèques)

## 🎯 Prochaines Étapes

1. ✅ ~~Setup projet Next.js~~
2. ✅ ~~Configuration Supabase~~
3. ⏳ **Créer les tables Supabase** (exécuter `supabase-setup.sql`)
4. ⏭️ Implémenter Feature 1 : Configuration planning (F1)
5. ⏭️ Implémenter Feature 2 : Gestion participants + tokens (F2)
6. ⏭️ Implémenter Feature 3 : Interface saisie contraintes (F3)
7. ⏭️ Implémenter Feature 4 : Algorithme génération (F4)
8. ⏭️ Implémenter Feature 5 : Visualisation résultat (F5)
9. ⏭️ Implémenter Feature 6 : Export Excel (F6)

## 🚢 Déploiement

### Vercel (Recommandé)

1. Push le code sur GitHub
2. Aller sur [vercel.com](https://vercel.com)
3. Importer le repo
4. Configurer les variables d'environnement
5. Déployer (automatique à chaque push)

**Coût** : 0€ (Free tier)

## 🆘 Troubleshooting

### "Cannot connect to Supabase"
- Vérifier que les tables sont créées (exécuter `supabase-setup.sql`)
- Vérifier `.env.local` (URL et anon key corrects)

### "npm install" échoue
- Supprimer `node_modules/` et `package-lock.json`
- Réessayer `npm install`

### Page blanche après démarrage
- Vérifier la console navigateur (F12)
- Vérifier les logs terminal

## 📝 Commits

Format recommandé :
```
type: description courte

- Détail 1
- Détail 2
```

Types : `feat`, `fix`, `docs`, `style`, `refactor`, `test`

## 👥 Contributeurs

- **Steeve** - Product Owner & Developer

## 📄 Licence

Projet privé - Usage interne

---

**Version** : 0.1.0 (MVP en cours)
**Dernière mise à jour** : 05/02/2025

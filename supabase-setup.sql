-- =============================================================================
-- SETUP SUPABASE - Gestion Planning Gardes
-- À exécuter dans l'éditeur SQL de Supabase Dashboard
-- =============================================================================

-- 1. Table: plannings
-- Stocke les configurations de planning (période, quotas, statut)
CREATE TABLE IF NOT EXISTS plannings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  quota_min INT NOT NULL DEFAULT 8,
  quota_max INT NOT NULL DEFAULT 10,
  statut VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (statut IN ('draft', 'collecting', 'generated', 'finalized')),
  createur VARCHAR(255),
  date_creation TIMESTAMP DEFAULT NOW(),
  date_generation TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Table: participants
-- Stocke les externes avec leurs tokens uniques
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planning_id UUID NOT NULL REFERENCES plannings(id) ON DELETE CASCADE,
  nom VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  token_unique VARCHAR(64) UNIQUE NOT NULL,
  statut_saisie VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (statut_saisie IN ('pending', 'completed')),
  date_completion TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(planning_id, email)
);

-- Index pour recherche rapide par token
CREATE INDEX IF NOT EXISTS idx_participants_token ON participants(token_unique);
CREATE INDEX IF NOT EXISTS idx_participants_planning ON participants(planning_id);

-- 3. Table: contraintes
-- Stocke les vœux (rouge/vert/blanc) pour chaque externe
CREATE TABLE IF NOT EXISTS contraintes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  date_garde DATE NOT NULL,
  type_contrainte VARCHAR(20) NOT NULL
    CHECK (type_contrainte IN ('unavailable', 'preferred', 'available')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(participant_id, date_garde)
);

-- Index pour recherche par participant et date
CREATE INDEX IF NOT EXISTS idx_contraintes_participant ON contraintes(participant_id);
CREATE INDEX IF NOT EXISTS idx_contraintes_date ON contraintes(date_garde);

-- 4. Table: resultats
-- Stocke le planning généré (assignations finales)
CREATE TABLE IF NOT EXISTS resultats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planning_id UUID NOT NULL REFERENCES plannings(id) ON DELETE CASCADE,
  date_garde DATE NOT NULL,
  participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  est_dimanche BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(planning_id, date_garde)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_resultats_planning ON resultats(planning_id);
CREATE INDEX IF NOT EXISTS idx_resultats_participant ON resultats(participant_id);

-- 5. Table: emails_log (V1 - optionnel pour MVP)
-- Traçabilité des envois d'emails
CREATE TABLE IF NOT EXISTS emails_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  type_email VARCHAR(50) NOT NULL
    CHECK (type_email IN ('invitation', 'relance', 'resultat')),
  statut VARCHAR(20) NOT NULL DEFAULT 'sent'
    CHECK (statut IN ('sent', 'delivered', 'failed')),
  date_envoi TIMESTAMP DEFAULT NOW(),
  erreur_message TEXT
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE plannings ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE contraintes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultats ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails_log ENABLE ROW LEVEL SECURITY;

-- Policy: Tout le monde peut lire les plannings (pour MVP)
-- Note: En production, limiter aux utilisateurs authentifiés
CREATE POLICY "Public peut lire plannings"
  ON plannings FOR SELECT
  USING (true);

-- Policy: Tout le monde peut créer des plannings (pour MVP)
-- Note: En production, restreindre aux admins authentifiés
CREATE POLICY "Public peut créer plannings"
  ON plannings FOR INSERT
  WITH CHECK (true);

-- Policy: Tout le monde peut mettre à jour les plannings (pour MVP)
-- Note: En production, restreindre aux créateurs/admins
CREATE POLICY "Public peut mettre à jour plannings"
  ON plannings FOR UPDATE
  USING (true);

-- Policy: Participants lisibles par tous (pour dashboard admin)
-- Note: En production, limiter aux admins du planning concerné
CREATE POLICY "Public peut lire participants"
  ON participants FOR SELECT
  USING (true);

-- Policy: Participants créables par tous (pour MVP)
CREATE POLICY "Public peut créer participants"
  ON participants FOR INSERT
  WITH CHECK (true);

-- Policy: Participants modifiables par tous (pour MVP)
CREATE POLICY "Public peut mettre à jour participants"
  ON participants FOR UPDATE
  USING (true);

-- Policy: Contraintes lisibles/modifiables par tous (pour MVP)
-- Note: En V1, ajouter isolation par token
CREATE POLICY "Public peut lire contraintes"
  ON contraintes FOR SELECT
  USING (true);

CREATE POLICY "Public peut créer contraintes"
  ON contraintes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public peut mettre à jour contraintes"
  ON contraintes FOR UPDATE
  USING (true);

CREATE POLICY "Public peut supprimer contraintes"
  ON contraintes FOR DELETE
  USING (true);

-- Policy: Résultats lisibles par tous
CREATE POLICY "Public peut lire resultats"
  ON resultats FOR SELECT
  USING (true);

CREATE POLICY "Public peut créer resultats"
  ON resultats FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public peut mettre à jour resultats"
  ON resultats FOR UPDATE
  USING (true);

-- Policy: Emails log lisibles par tous (pour MVP)
CREATE POLICY "Public peut lire emails_log"
  ON emails_log FOR SELECT
  USING (true);

CREATE POLICY "Public peut créer emails_log"
  ON emails_log FOR INSERT
  WITH CHECK (true);

-- =============================================================================
-- FONCTIONS UTILITAIRES (Optionnel)
-- =============================================================================

-- Fonction: Mettre à jour le champ updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_plannings_updated_at
    BEFORE UPDATE ON plannings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participants_updated_at
    BEFORE UPDATE ON participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contraintes_updated_at
    BEFORE UPDATE ON contraintes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- DONNÉES DE TEST (Optionnel - à commenter si pas voulu)
-- =============================================================================

-- Créer un planning de test
-- INSERT INTO plannings (date_debut, date_fin, quota_min, quota_max, createur, statut)
-- VALUES ('2025-03-01', '2025-05-31', 8, 10, 'Admin Test', 'draft');

-- =============================================================================
-- FIN DU SCRIPT
-- =============================================================================

-- Pour vérifier que tout est créé:
-- SELECT * FROM plannings;
-- SELECT * FROM participants;
-- SELECT * FROM contraintes;
-- SELECT * FROM resultats;

-- Migration: Remplacer quota_min/quota_max par nb_externes
-- Date: 2026-02-05
-- Raison: Correction du modèle - ALL days must be filled, quota means NUMBER OF EXTERNS

-- Ajouter la nouvelle colonne nb_externes
ALTER TABLE plannings ADD COLUMN IF NOT EXISTS nb_externes INT;

-- Mettre à jour les lignes existantes avec une valeur par défaut
-- (En production, tu devrais calculer la vraie valeur basée sur quota_min/quota_max)
UPDATE plannings
SET nb_externes = 10
WHERE nb_externes IS NULL;

-- Rendre la colonne obligatoire
ALTER TABLE plannings ALTER COLUMN nb_externes SET NOT NULL;

-- Supprimer les anciennes colonnes (optionnel - à faire après validation)
-- ALTER TABLE plannings DROP COLUMN IF EXISTS quota_min;
-- ALTER TABLE plannings DROP COLUMN IF EXISTS quota_max;

-- Note: Les deux dernières lignes sont commentées pour sécurité
-- Décommente-les une fois que tu as vérifié que tout fonctionne

-- Fix RLS policies pour permettre la régénération

-- Supprimer l'ancienne politique si elle existe
DROP POLICY IF EXISTS "resultats_all_access" ON resultats;

-- Créer une politique qui permet tout (pour MVP)
CREATE POLICY "resultats_all_access" 
ON resultats FOR ALL 
USING (true) 
WITH CHECK (true);

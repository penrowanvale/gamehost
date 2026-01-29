ALTER TABLE game_participants DROP CONSTRAINT IF EXISTS game_participants_game_id_user_id_key;

SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'game_participants'::regclass 
AND contype = 'u';

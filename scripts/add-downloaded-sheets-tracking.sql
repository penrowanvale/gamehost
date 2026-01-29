ALTER TABLE game_participants 
ADD COLUMN IF NOT EXISTS downloaded_sheet_numbers INTEGER[] DEFAULT '{}';

COMMENT ON COLUMN game_participants.downloaded_sheet_numbers IS 'Array of sheet numbers that have been downloaded by this participant';

CREATE INDEX IF NOT EXISTS idx_game_participants_downloaded_sheets 
ON game_participants USING GIN (downloaded_sheet_numbers);

SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'game_participants' 
AND column_name IN ('downloaded_sheet_numbers', 'selected_sheet_numbers', 'sheets_downloaded');

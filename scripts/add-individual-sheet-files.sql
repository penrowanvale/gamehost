ALTER TABLE games 
ADD COLUMN individual_sheet_files JSONB DEFAULT '{}';

COMMENT ON COLUMN games.individual_sheet_files IS 'JSON object mapping sheet numbers to individual Google Drive file IDs. Format: {"1": "file_id_1", "2": "file_id_2", ...}';

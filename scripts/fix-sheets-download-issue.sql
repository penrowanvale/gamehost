ALTER TABLE games 
ADD COLUMN IF NOT EXISTS sheets_files JSONB,
ADD COLUMN IF NOT EXISTS sheets_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sheets_uploaded BOOLEAN DEFAULT FALSE,

ADD COLUMN IF NOT EXISTS banners_files JSONB,
ADD COLUMN IF NOT EXISTS banners_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS banners_uploaded BOOLEAN DEFAULT FALSE,

ADD COLUMN IF NOT EXISTS images_files JSONB,
ADD COLUMN IF NOT EXISTS images_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS images_uploaded BOOLEAN DEFAULT FALSE,

ADD COLUMN IF NOT EXISTS upload_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS drive_folder_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS drive_folder_name VARCHAR(500);

ALTER TABLE games 
ADD COLUMN IF NOT EXISTS individual_sheet_files JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_games_drive_folder_id ON games(drive_folder_id);
CREATE INDEX IF NOT EXISTS idx_games_sheets_folder_id ON games(sheets_folder_id);

COMMENT ON COLUMN games.sheets_files IS 'JSONB storage for sheet file metadata from Google Drive';
COMMENT ON COLUMN games.sheets_count IS 'Total number of sheets uploaded';
COMMENT ON COLUMN games.sheets_uploaded IS 'Flag indicating if sheets have been uploaded';
COMMENT ON COLUMN games.banners_files IS 'JSONB storage for banner file metadata from Google Drive';
COMMENT ON COLUMN games.images_files IS 'JSONB storage for image file metadata from Google Drive';
COMMENT ON COLUMN games.drive_folder_id IS 'Google Drive folder ID where game files are stored';
COMMENT ON COLUMN games.drive_folder_name IS 'Google Drive folder name for easy identification';
COMMENT ON COLUMN games.individual_sheet_files IS 'JSON object mapping sheet numbers to individual Google Drive file IDs. Format: {"1": {"fileId": "...", "fileName": "...", "downloadUrl": "..."}, ...}. This ensures each sheet has its own file ID and users cannot access other sheets.';
COMMENT ON COLUMN games.sheets_folder_id IS 'Google Drive folder ID specifically for sheets (used for downloads)';

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('sheets_files', 'sheets_count', 'sheets_uploaded', 'sheets_folder_id', 'individual_sheet_files', 'drive_folder_id', 'drive_folder_name', 'upload_method') 
        THEN '✅ Required for sheet uploads'
        ELSE ''
    END as importance
FROM information_schema.columns
WHERE table_name = 'games'
AND column_name IN (
    'sheets_files', 'sheets_count', 'sheets_uploaded',
    'sheets_folder_id', 'individual_sheet_files',
    'banners_files', 'banners_count', 'banners_uploaded',
    'images_files', 'images_count', 'images_uploaded',
    'upload_method', 'drive_folder_id', 'drive_folder_name'
)
ORDER BY column_name;

SELECT 
    id,
    name,
    CASE 
        WHEN sheets_folder_id IS NOT NULL THEN '✅ Has sheets_folder_id'
        ELSE '❌ Missing sheets_folder_id'
    END as sheets_status,
    sheets_count,
    sheets_uploaded,
    drive_folder_name
FROM games
WHERE status IN ('upcoming', 'live')
ORDER BY created_at DESC
LIMIT 10;

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

CREATE INDEX IF NOT EXISTS idx_games_drive_folder_id ON games(drive_folder_id);

COMMENT ON COLUMN games.sheets_files IS 'JSONB storage for sheet file metadata from Google Drive';
COMMENT ON COLUMN games.banners_files IS 'JSONB storage for banner file metadata from Google Drive';
COMMENT ON COLUMN games.images_files IS 'JSONB storage for image file metadata from Google Drive';
COMMENT ON COLUMN games.drive_folder_id IS 'Google Drive folder ID where game files are stored';
COMMENT ON COLUMN games.drive_folder_name IS 'Google Drive folder name for easy identification';

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'games'
AND column_name IN (
  'sheets_files', 'sheets_count', 'sheets_uploaded',
  'banners_files', 'banners_count', 'banners_uploaded',
  'images_files', 'images_count', 'images_uploaded',
  'upload_method', 'drive_folder_id', 'drive_folder_name'
)
ORDER BY column_name;

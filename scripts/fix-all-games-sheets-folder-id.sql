SELECT 
    '=== BEFORE FIX ===' as status,
    id,
    name,
    sheets_count,
    CASE 
        WHEN sheets_folder_id IS NOT NULL THEN '✅ HAS ID'
        WHEN drive_folder_name IS NOT NULL THEN '⚠️ HAS DRIVE BUT NO ID'
        ELSE '❌ NO DATA'
    END as folder_status,
    sheets_folder_id,
    drive_folder_name
FROM games
WHERE status IN ('upcoming', 'live')
ORDER BY created_at DESC;

SELECT 
    '=== GAMES NEEDING FIX ===' as status,
    id,
    name,
    sheets_count,
    drive_folder_name,
    CASE 
        WHEN individual_sheet_files IS NOT NULL 
             AND jsonb_typeof(individual_sheet_files) = 'object'
             AND (SELECT COUNT(*) FROM jsonb_object_keys(individual_sheet_files)) > 0
        THEN '✅ CAN AUTO-FIX (has individual files)'
        WHEN sheets_count > 0 
        THEN '⚠️ MANUAL FIX NEEDED (no individual files)'
        ELSE '❌ NO SHEETS UPLOADED'
    END as fix_status
FROM games
WHERE sheets_folder_id IS NULL
  AND status IN ('upcoming', 'live')
ORDER BY created_at DESC;

SELECT 
    id,
    name,
    jsonb_pretty(individual_sheet_files) as sheet_files_sample
FROM games
WHERE sheets_folder_id IS NULL
  AND individual_sheet_files IS NOT NULL
  AND jsonb_typeof(individual_sheet_files) = 'object'
LIMIT 1;

UPDATE games
SET 
    sheets_folder_id = drive_folder_id,
    updated_at = NOW()
WHERE sheets_folder_id IS NULL
  AND drive_folder_id IS NOT NULL
  AND status IN ('upcoming', 'live');

SELECT 
    '=== AUTO-FIX APPLIED ===' as status,
    COUNT(*) as games_fixed
FROM games
WHERE sheets_folder_id = drive_folder_id
  AND updated_at > NOW() - INTERVAL '1 minute';

SELECT 
    '=== AFTER FIX ===' as status,
    id,
    name,
    sheets_count,
    CASE 
        WHEN sheets_folder_id IS NOT NULL THEN '✅ FIXED!'
        WHEN drive_folder_name IS NOT NULL THEN '⚠️ STILL NEEDS MANUAL FIX'
        ELSE '❌ NO DATA'
    END as folder_status,
    sheets_folder_id
FROM games
WHERE status IN ('upcoming', 'live')
ORDER BY created_at DESC;

SELECT 
    '=== MANUAL FIX NEEDED ===' as status,
    id,
    name,
    sheets_count,
    drive_folder_name,
    'Run: UPDATE games SET sheets_folder_id = ''<FOLDER_ID>'' WHERE id = ''' || id || ''';' as fix_command
FROM games
WHERE sheets_folder_id IS NULL
  AND status IN ('upcoming', 'live')
ORDER BY created_at DESC;

SELECT 
    '=== FINAL SUMMARY ===' as summary,
    COUNT(*) as total_active_games,
    COUNT(CASE WHEN sheets_folder_id IS NOT NULL THEN 1 END) as games_with_folder_id,
    COUNT(CASE WHEN sheets_folder_id IS NULL THEN 1 END) as games_still_broken,
    ROUND(
        100.0 * COUNT(CASE WHEN sheets_folder_id IS NOT NULL THEN 1 END) / NULLIF(COUNT(*), 0),
        1
    ) || '%' as success_rate
FROM games
WHERE status IN ('upcoming', 'live');

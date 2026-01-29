SELECT 
    '=== COLUMN CHECK ===' as check_type,
    column_name, 
    data_type,
    CASE 
        WHEN column_name = 'sheets_folder_id' THEN '⭐ CRITICAL - Without this, error "sheets not available"'
        WHEN column_name = 'individual_sheet_files' THEN '⭐ CRITICAL - Without this, security blocks download'
        ELSE 'Supporting column'
    END as importance
FROM information_schema.columns
WHERE table_name = 'games'
AND column_name IN (
    'sheets_folder_id',
    'individual_sheet_files', 
    'sheets_count',
    'sheets_uploaded',
    'sheets_files',
    'drive_folder_id',
    'drive_folder_name'
)
ORDER BY 
    CASE 
        WHEN column_name = 'sheets_folder_id' THEN 1
        WHEN column_name = 'individual_sheet_files' THEN 2
        ELSE 3
    END;

SELECT 
    '=== GAME DATA CHECK ===' as check_type,
    id,
    name,
    status,
    sheets_count,
    CASE 
        WHEN sheets_folder_id IS NOT NULL THEN '✅ Has ID: ' || LEFT(sheets_folder_id, 20) || '...'
        ELSE '❌ NULL - THIS IS THE PROBLEM!'
    END as sheets_folder_status,
    CASE 
        WHEN sheets_uploaded = true THEN '✅ TRUE'
        ELSE '❌ FALSE'
    END as sheets_uploaded_status,
    drive_folder_name
FROM games
WHERE status IN ('upcoming', 'live')
ORDER BY created_at DESC
LIMIT 5;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'games' 
        AND column_name = 'individual_sheet_files'
    ) THEN
        RAISE NOTICE '=== INDIVIDUAL SHEET FILES CHECK ===';
        
        PERFORM 
            id,
            name,
            CASE 
                WHEN individual_sheet_files IS NOT NULL AND jsonb_typeof(individual_sheet_files) = 'object' THEN
                    '✅ Has ' || (SELECT COUNT(*) FROM jsonb_object_keys(individual_sheet_files)) || ' sheet file IDs'
                WHEN individual_sheet_files IS NOT NULL THEN
                    '⚠️ Not NULL but wrong format'
                ELSE 
                    '❌ NULL - Need to populate'
            END as individual_files_status
        FROM games
        WHERE status IN ('upcoming', 'live')
        ORDER BY created_at DESC
        LIMIT 5;
    ELSE
        RAISE NOTICE '❌ Column individual_sheet_files does NOT exist - you need to add it!';
    END IF;
END $$;

SELECT 
    '=== SAMPLE SHEET FILES DATA ===' as check_type,
    id,
    name,
    jsonb_pretty(individual_sheet_files) as individual_sheet_files_sample
FROM games
WHERE status IN ('upcoming', 'live')
AND individual_sheet_files IS NOT NULL 
AND jsonb_typeof(individual_sheet_files) = 'object'
AND (SELECT COUNT(*) FROM jsonb_object_keys(individual_sheet_files)) > 0
LIMIT 1;

SELECT 
    '=== PARTICIPANT CHECK ===' as check_type,
    gp.id as participation_id,
    u.username,
    g.name as game_name,
    gp.payment_status,
    gp.sheets_selected,
    gp.selected_sheet_numbers,
    gp.sheets_downloaded,
    CASE 
        WHEN g.sheets_folder_id IS NULL THEN '❌ Game has no sheets_folder_id'
        WHEN gp.payment_status != 'approved' THEN '⚠️ Participation not approved'
        ELSE '✅ Should be able to download'
    END as download_status
FROM game_participants gp
JOIN games g ON gp.game_id = g.id
JOIN users u ON gp.user_id = u.id
WHERE g.status IN ('upcoming', 'live')
ORDER BY gp.created_at DESC
LIMIT 5;

SELECT 
    '=== 🎯 DIAGNOSIS SUMMARY ===' as summary_type,
    COUNT(*) as total_active_games,
    COUNT(CASE WHEN sheets_folder_id IS NOT NULL THEN 1 END) as games_with_folder_id,
    COUNT(CASE WHEN sheets_folder_id IS NULL THEN 1 END) as games_WITHOUT_folder_id,
    CASE 
        WHEN COUNT(CASE WHEN sheets_folder_id IS NULL THEN 1 END) > 0 THEN
            '❌ PROBLEM: ' || COUNT(CASE WHEN sheets_folder_id IS NULL THEN 1 END) || ' game(s) missing sheets_folder_id - RE-UPLOAD NEEDED'
        ELSE
            '✅ All games have sheets_folder_id set'
    END as diagnosis
FROM games
WHERE status IN ('upcoming', 'live');

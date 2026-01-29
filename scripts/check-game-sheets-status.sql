SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'games'
AND column_name = 'individual_sheet_files';

SELECT 
    id,
    name,
    status,
    sheets_folder_id,
    sheets_count,
    sheets_uploaded,
    drive_folder_id,
    drive_folder_name,
    CASE 
        WHEN sheets_folder_id IS NOT NULL THEN '✅ Has sheets_folder_id'
        ELSE '❌ NULL - This is the problem!'
    END as folder_status,
    CASE 
        WHEN individual_sheet_files IS NOT NULL THEN 
            '✅ Has individual files: ' || jsonb_array_length(jsonb_object_keys(individual_sheet_files)::jsonb) || ' sheets'
        ELSE '❌ No individual_sheet_files column or NULL'
    END as individual_files_status
FROM games
WHERE status IN ('upcoming', 'live')
ORDER BY created_at DESC
LIMIT 5;

SELECT 
    id,
    name,
    jsonb_pretty(sheets_files) as sheets_files_data
FROM games
WHERE sheets_files IS NOT NULL
LIMIT 1;

SELECT 
    gp.id as participation_id,
    u.username,
    g.name as game_name,
    gp.payment_status,
    gp.selected_sheet_numbers,
    gp.downloaded_sheet_numbers,
    gp.sheets_downloaded,
    gp.created_at
FROM game_participants gp
JOIN users u ON gp.user_id = u.id
JOIN games g ON gp.game_id = g.id
ORDER BY gp.created_at DESC
LIMIT 5;

SELECT 
    u.username,
    g.name,
    gp.selected_sheet_numbers,
    gp.downloaded_sheet_numbers,
    array_length(gp.downloaded_sheet_numbers, 1) as num_downloaded,
    gp.payment_status
FROM game_participants gp
JOIN users u ON gp.user_id = u.id
JOIN games g ON gp.game_id = g.id
WHERE gp.payment_status = 'approved'
ORDER BY gp.created_at DESC
LIMIT 10;

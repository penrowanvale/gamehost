SELECT 
    id,
    game_id,
    selected_sheet_numbers,
    downloaded_sheet_numbers,
    payment_status
FROM game_participants
WHERE user_id = '1d7c48d2-6ddf-441e-a08d-bd5c445159da'
AND payment_status = 'approved';

UPDATE game_participants
SET 
    downloaded_sheet_numbers = ARRAY[]::integer[],
    sheets_downloaded = false,
    updated_at = NOW()
WHERE user_id = '1d7c48d2-6ddf-441e-a08d-bd5c445159da'
AND payment_status = 'approved';

SELECT 
    id,
    game_id,
    selected_sheet_numbers,
    downloaded_sheet_numbers,
    sheets_downloaded
FROM game_participants
WHERE user_id = '1d7c48d2-6ddf-441e-a08d-bd5c445159da'
AND payment_status = 'approved';

UPDATE users 
SET password_hash = '$2a$10$UQZSkspzR8iGKtaE8EDNPeul7/EyZa7oWbqPFXPcQ2M8UD1EUVeRK'
WHERE email = 'admin@gameblast.com';

UPDATE users 
SET password_hash = '$2a$10$D0XvrqgsecbovCyCyPrpaujDbTBHwPqPcRhSYgWvve3xIkACDFLpq'
WHERE email IN ('player1@example.com', 'player2@example.com');

UPDATE users 
SET password_hash = '$2a$10$iFeW.qdkkGClRjxgFpWboO33P4tGXmapTKIyfQyg543yJ0izSboW.'
WHERE email IN ('organiser1@example.com', 'organiser2@example.com');

SELECT username, email, 
       CASE 
         WHEN password_hash = '$2a$10$UQZSkspzR8iGKtaE8EDNPeul7/EyZa7oWbqPFXPcQ2M8UD1EUVeRK' THEN 'AdminPass123!'
         WHEN password_hash = '$2a$10$D0XvrqgsecbovCyCyPrpaujDbTBHwPqPcRhSYgWvve3xIkACDFLpq' THEN 'password123'
         WHEN password_hash = '$2a$10$iFeW.qdkkGClRjxgFpWboO33P4tGXmapTKIyfQyg543yJ0izSboW.' THEN 'organiser123'
         ELSE 'Unknown'
       END as password_should_be
FROM users 
WHERE email IN ('admin@gameblast.com', 'player1@example.com', 'player2@example.com', 'organiser1@example.com', 'organiser2@example.com')
ORDER BY role, username;

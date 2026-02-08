UPDATE "users" 
SET "passwordHash" = '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    "updatedAt" = NOW()
WHERE "username" = 'admin';

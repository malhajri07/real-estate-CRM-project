INSERT INTO "users" (
    "id", 
    "username", 
    "email", 
    "phone", 
    "firstName", 
    "lastName", 
    "passwordHash", 
    "roles", 
    "isActive", 
    "approvalStatus", 
    "createdAt", 
    "updatedAt"
) VALUES (
    '00000000-0000-0000-0000-000000000001', 
    'admin', 
    'admin@realestateInfo.com', 
    '+966500000000', 
    'Admin', 
    'User', 
    'password_placeholder', 
    '["WEBSITE_ADMIN"]', 
    true, 
    'APPROVED', 
    NOW(), 
    NOW()
) ON CONFLICT ("username") DO NOTHING;

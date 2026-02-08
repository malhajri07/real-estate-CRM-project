import fetch from 'node-fetch';

async function checkUsersApi() {
    const BASE_URL = 'http://localhost:3000';

    console.log('1. Logging in as admin...');
    try {
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: 'admin', password: 'admin123' })
        });

        if (!loginRes.ok) {
            console.error('Login failed:', await loginRes.text());
            return;
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('✅ Login successful. Token obtained.');

        console.log('2. Fetching users from /api/rbac-admin/users...');
        const usersRes = await fetch(`${BASE_URL}/api/rbac-admin/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!usersRes.ok) {
            console.error('❌ Fetch users failed:', await usersRes.text());
            return;
        }

        const usersData = await usersRes.json();
        console.log('✅ Users fetched successfully.');
        console.log('Count:', usersData.users?.length);
        console.log('Sample User:', usersData.users?.[0]?.username);

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkUsersApi();

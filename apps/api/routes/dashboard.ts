import { Router } from 'express';
import { prisma } from '../prismaClient';
import { z } from 'zod';
import { subDays, format } from 'date-fns';
import { authenticateToken as authenticate } from '../auth';

const router = Router();

// Apply Authentication Middleware
router.use(authenticate);

// Simple seeded random function
const seededRandom = (seed: number) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
};

// Robust Mock Data Generator
const generateHistoricalData = (days: number) => {
    const data = [];
    const today = new Date();

    // Base values
    let totalUsers = 2400;
    let totalRevenue = 328000;
    let totalListings = 150;

    for (let i = days; i >= 0; i--) {
        const date = subDays(today, i);
        // Create a unique seed based on the date string (YYYY-MM-DD)
        const dateString = format(date, 'yyyy-MM-dd');
        const seed = dateString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        // Random daily permutations using seeded random
        const newUsers = Math.floor(seededRandom(seed) * 5) + 1;
        const revenue = Math.floor(seededRandom(seed + 1) * 5000) + 1000;
        const newListings = Math.floor(seededRandom(seed + 2) * 3);

        totalUsers += newUsers;
        totalRevenue += revenue;
        totalListings += newListings;

        data.push({
            date: date.toISOString(),
            users: totalUsers,
            activeUsers: Math.floor(totalUsers * 0.4), // 40% active
            revenue: revenue, // Daily revenue
            totalRevenue: totalRevenue, // Cumulative
            listings: totalListings,
            orders: Math.floor(seededRandom(seed + 3) * 10),
            disputes: Math.floor(seededRandom(seed + 4) * 2)
        });
    }
    return data;
};

router.get('/metrics', async (req: any, res) => {
    try {
        // In a real env with schema access, we would query the daily_system_stats table.
        // Due to env restrictions, we generate consistent realistic data here.
        const history = generateHistoricalData(180); // 6 Months
        const today = history[history.length - 1];
        const yesterday = history[history.length - 2];
        const lastMonth = history[history.length - 30];

        // Calculate trends
        const userGrowth = ((today.users - lastMonth.users) / lastMonth.users) * 100;
        const revenueGrowth = ((today.totalRevenue - lastMonth.totalRevenue) / lastMonth.totalRevenue) * 100;

        res.json({
            summary: {
                totalUsers: today.users,
                userGrowth: Number(userGrowth.toFixed(1)),
                totalRevenue: today.totalRevenue,
                revenueGrowth: Number(revenueGrowth.toFixed(1)),
                activeOrganizations: 45, // Static for now
                orgGrowth: 5.2,
                openTickets: 23,
                ticketChange: -15.4
            },
            history: history
        });
    } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        res.status(500).json({ message: 'Failed to fetch metrics' });
    }
});

export default router;


import express from 'express';

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { title, message, type, leadIds } = req.body;

        if (!title || !message || !type || !leadIds || !Array.isArray(leadIds)) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const campaign = {
            id: Date.now().toString(),
            title,
            message,
            type,
            leadIds,
            status: "sent",
            sentAt: new Date().toISOString(),
            recipientCount: leadIds.length
        };

        // For now, just return success - storage methods will be added
        res.status(201).json(campaign);
    } catch (error) {
        console.error("Error creating campaign:", error);
        res.status(500).json({ error: "Failed to create campaign" });
    }
});

export default router;

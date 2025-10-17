import express from "express";
import { storage } from "../storage-prisma";

const router = express.Router();

// Helper to get current user in mock/dev
function getUserId(req: any) {
  return req?.user?.id || "sample-user-1";
}

router.get("/", async (req, res) => {
  try {
    const userId = getUserId(req);
    const props = await storage.getFavoriteProperties(userId);
    res.json(props);
  } catch (err) {
    console.error("Error fetching favorites:", err);
    res.status(500).json({ message: "Failed to fetch favorites" });
  }
});

router.post("/", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { propertyId } = req.body || {};
    if (!propertyId) return res.status(400).json({ message: "propertyId is required" });
    const fav = await storage.addFavorite(userId, propertyId);
    res.status(201).json(fav);
  } catch (err) {
    console.error("Error adding favorite:", err);
    res.status(500).json({ message: "Failed to add favorite" });
  }
});

router.delete("/:propertyId", async (req, res) => {
  try {
    const userId = getUserId(req);
    const ok = await storage.removeFavorite(userId, req.params.propertyId);
    if (!ok) return res.status(404).json({ message: "Favorite not found" });
    res.status(204).send();
  } catch (err) {
    console.error("Error removing favorite:", err);
    res.status(500).json({ message: "Failed to remove favorite" });
  }
});

export default router;


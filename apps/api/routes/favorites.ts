/**
 * routes/favorites.ts — Saved/favorite properties per user.
 *
 * Mounted at `/api/favorites`.
 *
 * | Method | Path | Auth? | Purpose |
 * |--------|------|-------|---------|
 * | GET | / | Yes | List authenticated user's favorited properties |
 * | POST | / | Yes | Add a property to favorites |
 * | DELETE | /:id | Yes | Remove property from favorites |
 *
 * Consumer: favorites page (`/favorites`), listing card heart toggle.
 */

import express from "express";
import { storage } from "../storage-prisma";

const router = express.Router();

// Require real authenticated user — no fallback to fake IDs
function getUserId(req: any): string | null {
  return req?.user?.id || req?.session?.user?.id || null;
}

/**
 * List  with optional filters.
 *
 * @route   GET /api/favorites/
 * @auth    Public — no auth required
 */
router.get("/", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    const props = await storage.getFavoriteProperties(userId);
    res.json(props);
  } catch (err) {
    console.error("Error fetching favorites:", err);
    res.status(500).json({ message: "Failed to fetch favorites" });
  }
});

/**
 * Create a new  record.
 *
 * @route   POST /api/favorites/
 * @auth    Public — no auth required
 */
router.post("/", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    const { propertyId } = req.body || {};
    if (!propertyId) return res.status(400).json({ message: "propertyId is required" });
    const fav = await storage.addFavorite(userId, propertyId);
    res.status(201).json(fav);
  } catch (err) {
    console.error("Error adding favorite:", err);
    res.status(500).json({ message: "Failed to add favorite" });
  }
});

/**
 * Delete a :propertyId record.
 *
 * @route   DELETE /api/favorites/:propertyId
 * @auth    Public — no auth required
 */
router.delete("/:propertyId", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    const ok = await storage.removeFavorite(userId, req.params.propertyId);
    if (!ok) return res.status(404).json({ message: "Favorite not found" });
    res.status(204).send();
  } catch (err) {
    console.error("Error removing favorite:", err);
    res.status(500).json({ message: "Failed to remove favorite" });
  }
});

export default router;

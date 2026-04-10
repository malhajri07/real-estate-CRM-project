/**
 * routes/saved-filters.ts — Agent-saved filter presets for the properties page (E7).
 *
 * Mounted at `/api/saved-filters` in `apps/api/routes.ts`.
 *
 * | Method | Path   | Auth? | Purpose                          |
 * |--------|--------|-------|----------------------------------|
 * | GET    | /      | Yes   | List agent's saved filter presets |
 * | POST   | /      | Yes   | Create a new filter preset        |
 * | DELETE | /:id   | Yes   | Delete a saved filter             |
 *
 * Consumer: properties page `apps/web/src/pages/platform/properties/index.tsx`
 *   — "Save Filter" button + preset dropdown (E7).
 *
 * @see [[Sessions/E7 - Properties]]
 */

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prismaClient";
import { authenticateToken } from "../src/middleware/auth.middleware";

const router = Router();

/**
 * @route GET /api/saved-filters
 * @auth  Required
 * @returns Array of `{ id, name, filterConfig (parsed JSON) }`.
 *   Consumer: preset dropdown in the properties filter bar.
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const filters = await prisma.saved_filters.findMany({
      where: { agentId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json(filters.map((f) => ({
      ...f,
      filterConfig: JSON.parse(f.filterConfig),
    })));
  } catch (error) {
    console.error("Error fetching saved filters:", error);
    res.status(500).json({ message: "فشل تحميل الفلاتر المحفوظة" });
  }
});

/**
 * @route POST /api/saved-filters
 * @auth  Required
 * @param req.body.name - Preset name (Arabic text). Source: text input in save-filter dialog.
 * @param req.body.filterConfig - Current filter state object. Source: properties page filter state.
 * @returns Created filter preset.
 *   Consumer: invalidates `['/api/saved-filters']` → dropdown refreshes.
 * @sideEffect Creates a `saved_filters` row.
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const schema = z.object({
      name: z.string().min(1, "اسم الفلتر مطلوب"),
      filterConfig: z.record(z.unknown()),
    });
    const data = schema.parse(req.body);

    const filter = await prisma.saved_filters.create({
      data: {
        agentId: user.id,
        name: data.name,
        filterConfig: JSON.stringify(data.filterConfig),
      },
    });

    res.status(201).json({ ...filter, filterConfig: data.filterConfig });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
    console.error("Error saving filter:", error);
    res.status(500).json({ message: "فشل حفظ الفلتر" });
  }
});

/**
 * @route DELETE /api/saved-filters/:id
 * @auth  Required
 * @sideEffect Deletes the `saved_filters` row.
 */
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    await prisma.saved_filters.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "فشل حذف الفلتر" });
  }
});

export default router;

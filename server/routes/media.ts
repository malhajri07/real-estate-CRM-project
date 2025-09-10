import express from "express";
import { ObjectStorageService } from "../objectStorage";

const router = express.Router();

router.post("/upload-url", async (req, res) => {
  try {
    const { ext = 'jpg' } = (req.body || {}) as { ext?: string };
    const svc = new ObjectStorageService();
    const { uploadURL, path } = await svc.getMediaUploadURL(ext);
    res.json({ uploadURL, path });
  } catch (err: any) {
    console.error('Error signing media upload URL:', err?.message || err);
    res.status(500).json({ message: 'Failed to sign upload URL. Ensure PRIVATE_OBJECT_DIR is set.' });
  }
});

export default router;

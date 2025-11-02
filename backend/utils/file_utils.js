// utils/file_utils.js
import fs from "fs";
import path from "path";

export const safeDeleteFile = (relativePath) => {
  try {
    const cleanPath = relativePath.startsWith("/") ? relativePath.slice(1) : relativePath;
    const fullPath = path.join(process.cwd(), cleanPath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    console.log("🧹 Deleted file:", cleanPath);
  } catch (err) {
    console.warn("⚠️ File deletion failed:", err.message);
  }
};

import multer from "multer";
import path from "path";
import crypto from "crypto";

export const upload = multer({
  storage: multer.diskStorage({
    destination: path.resolve("public/covers"),
    filename: (req, file, callback) => {
      const hash = crypto.randomBytes(8).toString("hex");
      const fileName = `${hash}-${file.originalname}`;
      callback(null, fileName);
    }
  })
});
import { BadRequestException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { existsSync, mkdirSync } from "fs";
import { diskStorage, Options } from "multer";
import path from "path";

export const userPhotoUploadDir =
  process.env.UPLOAD_DIR ||
  path.resolve(process.cwd(), "uploads", "core", "usuarios");

const imageMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

if (!existsSync(userPhotoUploadDir)) {
  mkdirSync(userPhotoUploadDir, { recursive: true });
}

export const userPhotoUploadOptions: Options = {
  storage: diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, userPhotoUploadDir);
    },
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `${Date.now()}-${randomUUID()}${extension}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!imageMimeTypes.includes(file.mimetype)) {
      callback(
        new BadRequestException(
          "Arquivo invalido. Envie apenas imagens JPG, PNG, WEBP ou GIF.",
        ),
      );
      return;
    }

    callback(null, true);
  },
};

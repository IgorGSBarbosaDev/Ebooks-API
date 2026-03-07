import { Router } from "express";
import { upload } from "../../config/multer";
import * as ebookController from "./ebook.controller"

export const ebookRouter = Router();

ebookRouter.post("/", ebookController.createEbook);
ebookRouter.get("/", ebookController.list);
ebookRouter.get("/:slug", ebookController.getBySlug);
ebookRouter.put("/:slug", ebookController.update);
ebookRouter.delete("/:slug", ebookController.remove);
ebookRouter.post("/:slug/cover", 
    ebookController.validateEbookExists, 
    upload.single("cover"), 
    ebookController.uploadCover
);
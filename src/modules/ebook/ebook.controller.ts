import type { Request, Response, NextFunction } from "express";
import * as ebookService from "./ebook.service";
import { createEbookSchema, updateEbookSchema, listEbooksQuerySchema } from "./ebook.schema";

//post / ebook
export async function createEbook(req: Request, res: Response, next: NextFunction) {
    try {
        const data = createEbookSchema.parse(req.body);
        const ebook = await ebookService.createEbook(data);
        res.status(201).json(ebook);
    } catch (error) {
        next(error);
    }
}

// get /ebooks
export async function list(req: Request, res: Response, next: NextFunction) {
    try {
        const query = listEbooksQuerySchema.parse(req.query);
        const result = await ebookService.listEbooks(query);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

//get / ebooks/:slug
export async function getBySlug(
    req: Request,
    res: Response,
    next: NextFunction
){
    try {
        const ebook = await ebookService.getEbookBySlug(req.params.slug!);
        res.json(ebook);
    } catch (error) {
        next(error);
    }
}

//put /ebooks/:slug
export async function update(req: Request, res: Response, next: NextFunction){
    try {
        const data = updateEbookSchema.parse(req.body);
        const ebook = await ebookService.updateEbook(req.params.slug!, data);
        res.json(ebook);
    } catch(error){
        next(error);
    }
}

//delete /ebooks/:slug
export async function remove(req: Request, res: Response, next: NextFunction){
    try {
    await ebookService.deleteEbook(req.params.slug!); 
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

//post /ebooks/:slug/cover
export async function uploadCover(req: Request, res: Response, next: NextFunction){
    try{
        if(!req.file) {
            res.status(400).json({ error: "Cover image file is required" });
            return;
        }

        const ebook = await ebookService.uploadCover(req.params.slug!, req.file.filename);
        res.json(ebook);
    } catch (error){
        next(error);
    }
}

export async function validateEbookExists(req: Request, res: Response, next: NextFunction) {
    try {
        await ebookService.getEbookBySlug(req.params.slug!);
        next();
    } catch (error) {
        next(error);
    }
}

import fs from "fs";
import path from "path";

import { prisma } from "../../shared/prisma";
import { AppError } from "../../shared/errors/AppError";
import { createSlug } from "../../shared/utils/slug";

async function generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
    let slug = createSlug(title);
    let suffix = 1;

    while (true){
        const existing = await prisma.ebook.findFirst({
            where: {
                slug,
                ...(excludeId ? {id: {not: excludeId}} : {})
            }
        })
        if (!existing) return slug;

        suffix++;
        slug = `${createSlug(title)}-${suffix}`;
    }
}
// create
interface CreateEbookData {
    title: string;
    author: string;
    description?: string;
}

export async function createEbook(data: CreateEbookData) {
    const slug = await generateUniqueSlug(data.title);

    return prisma.ebook.create({
        data: {
            title: data.title,
            author: data.author,
            description: data.description ?? "",
            slug,
            coverPath: ""
        }
});
}
// get
export async function getEbookBySlug(slug: string) {
    const ebook = await prisma.ebook.findFirst({
        where: { slug }
    });

    if (!ebook){
        throw new AppError("Ebook not found", 404);
    }

    return ebook;
}

// list 
interface ListEbookParams {
    page: number;
    limit: number;
    title?: string;
    author?: string;
}

export async function listEbooks(params: ListEbookParams) {
    const { page , limit, title, author } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (title){
        where.title = { contains: title, mode: "insensitive" };
    }
    if (author){
        where.author = { contains: author, mode: "insensitive" };
    }

    const [ebooks, total] = await Promise.all([
        prisma.ebook.findMany({
            where, 
            skip,
            take: limit,
            orderBy: {createdAt: "desc"}
        }),
        prisma.ebook.count({ where })
    ]);

    return {
        data: ebooks,
        meta: {
            total, 
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
}

//update
interface UpdateEbookData{
    title?: string;
    author?: string;
    description?: string;
}

export async function updateEbook(slug: string, data: UpdateEbookData) {
    const ebook = await getEbookBySlug(slug);

    let newSlug = ebook.slug;
    if (data.title && data.title !== ebook.title){
        newSlug = await generateUniqueSlug(data.title, ebook.id);
    }

    return prisma.ebook.update({
        where: { id: ebook.id },
        data: {
            ...data,
            slug: newSlug 
        }
    });
}

// delete
export async function deleteEbook(slug: string){
    const ebook = await getEbookBySlug(slug);

    if (ebook.coverPath){
        const coverFullPath = path.resolve("public/covers", ebook.coverPath);
        if (fs.existsSync(coverFullPath)){
            fs.unlinkSync(coverFullPath); 
        }
    }

    return prisma.ebook.delete({
        where: { id: ebook.id }
    });
}

// upload cover
export async function uploadCover(slug: string , filename: string){
    const ebook = await getEbookBySlug(slug);

    if(!ebook){
        throw new AppError("Ebook not found", 404);
    }

    if (ebook.coverPath){
        const oldFullPath = path.resolve("public/covers", ebook.coverPath);
        if (fs.existsSync(oldFullPath)){
            fs.unlinkSync(oldFullPath); 
        }
    }

    return prisma.ebook.update({
        where: { id: ebook.id },
        data: { coverPath: filename }
    });

}


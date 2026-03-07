import express from "express";
import cors from "cors";
import path from "path";

import { ebookRouter } from "./modules/ebook/ebook.routes";
import { AppError } from "./shared/errors/AppError";

export const app = express();

app.use(cors());
app.use(express.json());
app.use("/covers", express.static(path.resolve("public/covers")));

app.use("/ebooks", ebookRouter); 

app.use(
    (
    error: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) => {
    if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
    }

    if (error.name === "ZodError") {
        res.status(400).json({ error: "Validation failed", details: error })
        return;
    }

    console.error("Unhandled error:", error);
    res.status(500).json({ error: "Internal Server Error" });
}
);
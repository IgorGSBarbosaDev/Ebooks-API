import express from "express";
import cors from "cors";
import path from "path";

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/covers", express.static(path.resolve("public/covers")));

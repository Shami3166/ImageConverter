import express from "express";
import { getAllConverters } from "../controllers/converterController";


const router = express.Router();

router.get("/converters", getAllConverters);

export default router;
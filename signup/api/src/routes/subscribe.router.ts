import { Router } from "express";
import SubscribeController from "../controllers/Subscribe.controller";

const router = Router();

router.post("/", SubscribeController.subscribeUser);

export default router;

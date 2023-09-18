import { Router } from 'express';
import UsersController from '../controllers/Users.controller';

const router = Router();

router.post('/', UsersController.subscribeUser);

export default router;
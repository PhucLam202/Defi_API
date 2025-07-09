import { Router } from 'express';
import { yieldsController } from '../../controllers/yieldsController';

const router = Router();

router.get('/', yieldsController.getYields.bind(yieldsController));
router.get('/:symbol', yieldsController.getYieldBySymbol.bind(yieldsController));

export default router;
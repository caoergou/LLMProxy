import { Router, Request, Response } from 'express';
import * as path from 'path';

const router = Router();

// Serve the main dashboard page
router.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Serve static files
router.get('/dashboard', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
});

export default router;
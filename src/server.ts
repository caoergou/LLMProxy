import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import * as path from 'path';
import Database from './models/Database';
import apiRoutes from './routes/api';
import webRoutes from './routes/web';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialize database
Database.init();

// Routes
app.use('/api', apiRoutes);
app.use('/', webRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`API Proxy server running on port ${PORT}`);
    console.log(`Web interface: http://localhost:${PORT}`);
});

export default app;
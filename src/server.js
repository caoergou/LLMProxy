require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('./models/Database');
const apiRoutes = require('./routes/api');
const webRoutes = require('./routes/web');

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

module.exports = app;
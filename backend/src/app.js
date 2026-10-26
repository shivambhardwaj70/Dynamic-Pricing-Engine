const express = require('express');

const app = express();

// Lets Express read JSON sent in request bodies (req.body)
app.use(express.json());

// GET /api/health: confirms the server is alive
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

module.exports = app;

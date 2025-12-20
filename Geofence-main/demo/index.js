const express = require('express');
const path = require('path');

const app = express();

// Serve static files from the "demo" directory
app.use(express.static(path.join(__dirname, 'demo')));

// Default route to load "advanced.html"
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'demo', 'advanced.html'));
});

// Define the port
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

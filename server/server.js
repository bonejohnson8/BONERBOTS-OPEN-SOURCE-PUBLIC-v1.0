/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// This is a simple server for serving the built React application.
// It no longer handles any API proxying or key management.

const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

const staticPath = path.join(__dirname, '..', 'dist');

// Serve static files from the 'dist' directory
app.use(express.static(staticPath));

// For any other request, serve the index.html file for client-side routing.
app.get('*', (req, res) => {
    const indexPath = path.join(staticPath, 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            res.status(500).send('Error serving the application. Did you run `npm run build`?');
        }
    });
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}. It only serves static files.`);
});
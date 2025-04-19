const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const db = new sqlite3.Database('workflows.db');

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});



// Initialize database
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS workflows (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

app.use(express.json());
app.use(express.static('public'));

// Save workflow
app.post('/save', (req, res) => {
    const { nodes, connections } = req.body; // Now captures both
    db.run(
      'INSERT INTO workflows (data) VALUES (?)',
      [JSON.stringify({ nodes, connections })], // Save as object
      function(err) {
            if (err) return res.status(500).send(err.message);
            res.json({ id: this.lastID });
        }
    );
});

// Load workflow
app.get('/load/:id', (req, res) => {
    db.get(
        'SELECT * FROM workflows WHERE id = ?',
        [req.params.id],
        (err, row) => {
            if (err) return res.status(500).send(err.message);
            if (!row) return res.status(404).send('Workflow not found');
            res.json(row);
        }
    );
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
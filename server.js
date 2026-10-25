const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Setup SQLite Database
const db = new sqlite3.Database('./lottery.db', (err) => {
    if (err) {
        console.error('Database opening error: ' + err.message);
    } else {
        console.log('Connected to SQLite Database.');
        
        // Results Table
        db.run(`CREATE TABLE IF NOT EXISTS results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            state_name TEXT,
            draw_name TEXT,
            prize_number TEXT,
            draw_time TEXT,
            date TEXT
        )`, () => {
            db.get(`SELECT COUNT(*) as count FROM results`, (err, row) => {
                if (row && row.count === 0) {
                    db.run(`INSERT INTO results (state_name, draw_name, prize_number, draw_time, date) VALUES 
                        ('SADAR BAZAR', 'MAIN BAZAR', '45', '1:40 PM', '2026-10-25'),
                        ('गली (Gali)', 'NIGHT BAZAR', '89', '11:30 PM', '2026-10-24')`);
                }
            });
        });

        // Admin Table (Default password: dm@boss2026)
        db.run(`CREATE TABLE IF NOT EXISTS admin (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            password TEXT
        )`, () => {
            db.get(`SELECT COUNT(*) as count FROM admin`, (err, row) => {
                if (row && row.count === 0) {
                    db.run(`INSERT INTO admin (password) VALUES ('dm@boss2026')`);
                }
            });
        });
    }
});

// API: Get Admin Password
app.get('/api/admin/get-password', (req, res) => {
    db.get(`SELECT password FROM admin WHERE id = 1`, (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ password: row ? row.password : 'dm@boss2026' });
    });
});

// API: Update Admin Password
app.post('/api/admin/change-password', (req, res) => {
    const { new_password } = req.body;
    if (!new_password) {
        res.status(400).json({ error: "Password khali nahi ho sakta (Password cannot be empty)." });
        return;
    }
    db.run(`UPDATE admin SET password = ? WHERE id = 1`, [new_password], function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: "Password successfully updated!" });
    });
});

// API: Get results
app.get('/api/results', (req, res) => {
    db.all(`SELECT * FROM results ORDER BY id DESC`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: "success", data: rows });
    });
});

// API: Admin Manual Update
app.post('/api/update-result', (req, res) => {
    const { state_name, draw_name, prize_number, draw_time, date } = req.body;
    const query = `INSERT INTO results (state_name, draw_name, prize_number, draw_time, date) VALUES (?, ?, ?, ?, ?)`;
    
    db.run(query, [state_name, draw_name, prize_number, draw_time, date], function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: "Success", id: this.lastID });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

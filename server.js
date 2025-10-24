// --- Import Required Tools ---
const express = require('express'); // The web server framework
const { Pool } = require('pg');     // The PostgreSQL driver
const path = require('path');         // Helper for file paths

// --- Configuration ---
const app = express();
const PORT = 3000; // Port your server will run on

// --- Database Connection ---
// This is where you "connect" to PostgreSQL
// The server is the ONLY place that has this password.
const pool = new Pool({
    user: 'postgres',     
    host: 'localhost',
    database: 'vision_x_db',     
    password: 'QwGh34&@bloke',
    port: 5432,
});

// --- Middleware ---
// This allows your server to read JSON from requests
app.use(express.json());
// This tells express to serve static files (like login.html) from the current folder
app.use(express.static(__dirname)); 

// --- HTML Page Routes (Serving the Menu) ---

// When someone visits http://localhost:3000/, send them login.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// When someone logs in (or visits /dashboard), send them dashboard.html
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'VisionXdashboard.html'));
});

// --- API Routes (Taking Orders) ---
// This is what your dashboard's JavaScript will call

// API endpoint for login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    // WARNING: THIS IS INSECURE. 
    // In a real app, you MUST hash passwords and compare the hash.
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND password_hash = $2', 
            [email, password]
        );

        if (result.rows.length > 0) {
            // Successful login
            res.json({ success: true, user: result.rows[0] });
        } else {
            // Failed login
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// API endpoint to get the current user
app.get('/api/user', async (req, res) => {
    // In a real app, you'd get the user ID from a secure session or token
    // For this demo, we just get the first user ("Karan")
    try {
        const result = await pool.query('SELECT * FROM users WHERE user_id = 1');
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API endpoint to get all events
app.get('/api/events', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM events ORDER BY event_id DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API endpoint to get all profiles
app.get('/api/profiles', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM profiles');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API endpoint to get all help requests
app.get('/api/help-requests', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM help_requests WHERE status = $1 ORDER BY request_id DESC', ['Open']);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Start the Server (Start the Restaurant) ---
app.listen(PORT, () => {
    console.log(`Vision X server running at http://localhost:${PORT}`);
});

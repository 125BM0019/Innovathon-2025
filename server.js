// --- 1. Import Required Tools ---
const express = require('express');
const { Pool } = require('pg'); 
const path = require('path');
// If you are using .env files for local development, you should also require dotenv here:
// require('dotenv').config(); 

// --- 2. Configuration & App Setup (Middleware MUST go here) ---
const app = express();
const PORT = process.env.PORT || 3000; 

// --- CRITICAL FIX: Essential Middleware for JSON and URL-encoded bodies ---
// These MUST be registered early so req.body is defined for all subsequent routes.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// --- 3. Production-Ready Database Connection Logic ---

let pool; // Declare pool globally so we can access it across the application

/**
 * Runs essential SQL commands to ensure the database schema is ready.
 * This is crucial for initial deployment on services like Render.
 */
async function runDatabaseMigrations(dbPool) {
  const createUserTableSql = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  console.log('[DB MIGRATION] Starting database setup...');
  await dbPool.query(createUserTableSql);
  console.log('[DB MIGRATION] "users" table created or already exists.');
  
  // Add any other necessary tables here (e.g., CREATE TABLE IF NOT EXISTS posts...)
}


// Function to initialize database connection and start the Express server
async function initializeAndStartServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const connectionString = process.env.DATABASE_URL;

  // Initialize the Pool instance
  pool = new Pool({
    connectionString: connectionString, 
    ssl: isProduction ? { 
      rejectUnauthorized: false 
    } : false,
  });

  try {
    // Attempt to connect and confirm DB is reachable
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log(`[DB SUCCESS] Database connection confirmed at: ${result.rows[0].now}`);
    client.release(); // Release the client back to the pool
    
    // --- CRITICAL STEP: RUN MIGRATIONS ---
    await runDatabaseMigrations(pool); 

    // --- 4. ROUTES ---

    // Serve Static Files (from the root directory)
    app.use(express.static(__dirname));

    // Simple Health Check Route
    app.get('/status', (req, res) => {
      res.send(`Server running on port ${PORT}. DB connected. Env: ${isProduction ? 'Production' : 'Development'}`);
    });

    // NOTE: Add your API routes here that use the 'pool' to query the DB
    // All routes added here or later will now correctly receive req.body

    // --- 5. SERVER START (Only starts after DB confirmation and migrations) ---
    app.listen(PORT, () => {
      console.log(`[SERVER START] Server successfully listening on port ${PORT}.`);
    });

  } catch (err) {
    // If connection or migration fails, log a FATAL error and exit the process.
    console.error('--- FATAL ERROR: FAILED TO CONNECT OR MIGRATE POSTGRES ---');
    console.error('Please check your DATABASE_URL, Region, and PostgreSQL credentials.');
    console.error('DETAILS:', err.stack);
    process.exit(1); 
  }
}

// Start the whole application lifecycle
initializeAndStartServer();


// Export the pool instance so your API routes can use it
module.exports = {
  app,
  pool,
  PORT,
};




// --- User Session Global Variable (Holds the ID of the currently logged-in user) ---
let currentLoggedInUser = null; 

// --- HTML Page Routes (Serving the Menu) ---

// When someone visits http://localhost:3000/, send them login.html
app.get('/', (req, res) => {
    // If a user is logged in, redirect them to the dashboard immediately
    if (currentLoggedInUser) {
        return res.redirect('/dashboard');
    }
    res.sendFile(path.join(__dirname, 'login.html'));
});

// When someone logs in (or visits /dashboard), send them dashboard.html
app.get('/dashboard', (req, res) => {
    // Basic check: if no user ID is stored, redirect to login
    if (!currentLoggedInUser) {
        return res.redirect('/');
    }
    // NOTE: Assuming your dashboard file is named 'VisionXdashboard.html'
    res.sendFile(path.join(__dirname, 'VisionXdashboard.html')); 
});

// *** NEW ROUTE ADDED HERE ***
// Route to serve the Ambassador Submission Page
app.get('/ambassador', (req, res) => {
    // NOTE: Assuming your ambassador file is named 'Ambassador_Page.html'
    res.sendFile(path.join(__dirname, 'Ambassador_Page.html'));
});


app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// --- User Authentication/Registration API ---

app.post ('/api/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if the user already exists
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Create a new user (Note: password_hash is used for demonstration as plain text)
        const newUser = await pool.query(
            'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
            [name, email, password]
        );

        res.status(201).json({ success: true, user: newUser.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    // WARNING: THIS IS INSECURE. 
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND password_hash = $2', 
            [email, password]
        );

        if (result.rows.length > 0) {
            // CRITICAL CHANGE: Store the logged-in user's ID
            currentLoggedInUser = result.rows[0].user_id; 
            
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

// NEW API endpoint for logging out
app.post('/api/logout', (req, res) => {
    currentLoggedInUser = null; // Clear the session variable
    res.json({ success: true, message: 'Logged out successfully.' });
});

// --- Dynamic Data API Endpoints ---

// API endpoint to get the current user
app.get('/api/user', async (req, res) => {
    // CRITICAL CHANGE: Use the stored session variable instead of hardcoding '1'
    if (!currentLoggedInUser) {
        // Return 401 Unauthorized if no user is currently tracked
        return res.status(401).json({ error: 'No user is currently logged in.' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [currentLoggedInUser]); 
        
        if (result.rows.length > 0) {
            // Return the currently logged-in user's data
            res.json(result.rows[0]);
        } else {
            // Logged-in ID somehow doesn't exist anymore
            currentLoggedInUser = null; 
            res.status(404).json({ error: 'Logged-in user not found.' });
        }
    } catch (err) {
        console.error("Error fetching current user:", err.message);
        res.status(500).json({ error: 'Server error fetching user data.' });
    }
});

// API endpoint to receive and store an event submission
app.post('/api/events/submit', async (req, res) => {
    // 1. Destructure data from the request body
    const { club, title, description, event_date, location } = req.body;
    
    // Simple validation
    if (!club || !title || !description || !event_date || !location) {
        return res.status(400).json({ 
            success: false, 
            message: 'All fields (Club, Title, Description, Date, Location) are required.' 
        });
    }

    try {
        // 2. SQL Query to insert the new event into the 'events' table
        const result = await pool.query(
            `INSERT INTO events (club, title, description, event_date, location) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [club, title, description, event_date, location]
        );

        // 3. Send a success response back to the client
        res.status(201).json({ 
            success: true, 
            message: 'Event submitted successfully.', 
            event: result.rows[0] 
        });

    } catch (err) {
        // 4. Handle database or server errors
        console.error('Error inserting new event:', err.message);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to submit event due to a server error.' 
        });
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

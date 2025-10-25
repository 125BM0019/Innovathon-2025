-- Drop tables if they exist to start fresh (for testing)
DROP TABLE IF EXISTS help_requests;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;

-- Create the Users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Never store plain text!
    avatar_char CHAR(1)
);

-- Create the Events table
CREATE TABLE events (
    event_id SERIAL PRIMARY KEY,
    club VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date VARCHAR(100),
    location VARCHAR(100)
);

-- Create the Profiles table
CREATE TABLE profiles (
    profile_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    major VARCHAR(100),
    interests TEXT,
    avatar VARCHAR(1)
);

-- Create the Help Requests table
CREATE TABLE help_requests (
    request_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    posted_by VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Open',
    description TEXT
);

-- --- INSERT SOME STARTING DATA ---

-- Insert a demo user
-- In a real app, 'password123' would be 'hashed' (e.g., with bcrypt)
INSERT INTO users (name, email, password_hash, avatar_char)
VALUES ('Karan', 'karan@college.edu', 'password123', 'K');

-- Insert some profiles
INSERT INTO profiles (name, major, interests, avatar)
VALUES
('Sai Arpit', 'B.Tech CSE', 'AI, Web Dev, Chess', 'S'),
('Pawan', 'B.Tech ECE', 'Robotics, IoT', 'P'),
('Bhagabanta', 'B.Tech Mech', 'Fluid Dynamics, CAD', 'B');

-- Insert some events
INSERT INTO events (club, title, description, event_date, location)
VALUES
('Coding Club', 'Hackathon 2025', 'Join us for the annual 24-hour hackathon. Prizes, food, and more!', 'Oct 30, 2025 9:00 AM', 'Main Auditorium'),
('Drama Society', 'Spring Play Auditions', 'Auditions for "Hamlet" are now open. No experience necessary.', 'Nov 2, 2025 6:00 PM', 'Theater');

-- Insert some help requests
INSERT INTO help_requests (title, posted_by, status, description)
VALUES
('Need help with Physics record', 'Pawan', 'Open', 'I''m sick and need someone to help me complete my physics record by tomorrow. Willing to pay.'),
('Proofread my English essay', 'Sai Arpit', 'Open', 'Just need a second pair of eyes on my 5-page essay on Shakespeare.');

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Neon/Postgres connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Email and scheduling dependencies
const nodemailer = require('nodemailer');
const cron = require('node-cron');

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Medication Reminder Cron Job
cron.schedule('* * * * *', async () => {
  try {
    // Ensure reminder_sent column exists
    await pool.query(`ALTER TABLE medications ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE`);
    // Find medications due in the next 5 minutes and not already reminded
    const now = new Date();
    const fiveMinutesLater = new Date(now.getTime() + 5 * 60000);
    const result = await pool.query(
      `SELECT * FROM medications WHERE reminder_sent = FALSE AND time::time >= $1::time AND time::time <= $2::time`,
      [now.toTimeString().slice(0,5), fiveMinutesLater.toTimeString().slice(0,5)]
    );
    for (const med of result.rows) {
      const mailOptions = {
        from: process.env.REMINDER_FROM,
        to: med.email,
        subject: `Medication Reminder: ${med.medication_name}`,
        text: `Hello ${med.name},\n\nThis is a reminder to take your medication: ${med.medication_name} (Dosage: ${med.dosage}, Frequency: ${med.frequency}, Time: ${med.time}).\n\nNotes: ${med.notes || 'None'}\n\nStay healthy!\nCare Circle`
      };
      await transporter.sendMail(mailOptions);
      await pool.query(`UPDATE medications SET reminder_sent = TRUE WHERE id = $1`, [med.id]);
      console.log(`Reminder sent to ${med.email} for medication ${med.medication_name}`);
    }
  } catch (error) {
    console.error('Error in reminder cron job:', error);
  }
});

// Ensure tables exist (run once at startup)
async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      service VARCHAR(255),
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS medications (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      medication_name VARCHAR(255) NOT NULL,
      dosage VARCHAR(255) NOT NULL,
      frequency VARCHAR(255) NOT NULL,
      time VARCHAR(255) NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS emergency_contacts (
      id SERIAL PRIMARY KEY,
      elderly_name VARCHAR(255) NOT NULL,
      elderly_phone VARCHAR(50) NOT NULL,
      contact_name VARCHAR(255) NOT NULL,
      contact_phone VARCHAR(50) NOT NULL,
      relationship VARCHAR(255) NOT NULL,
      address TEXT,
      medical_info TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS health_checks (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      age INTEGER NOT NULL,
      blood_pressure VARCHAR(255),
      heart_rate VARCHAR(255),
      temperature VARCHAR(255),
      weight VARCHAR(255),
      symptoms TEXT,
      medications TEXT,
      notes TEXT,
      check_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

ensureTables().catch(console.error);

// Ensure users table exists
(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
})();

// Registration endpoint
const bcrypt = require('bcryptjs');
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    // Check if user already exists
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered.' });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3)', [name, email, hashedPassword]);
    res.json({ success: true, message: 'Registration successful.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    const user = userRes.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    res.json({ success: true, message: 'Login successful.', user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    // Check if user already exists
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered.' });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3)', [name, email, hashedPassword]);
    res.json({ success: true, message: 'Registration successful.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/services', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'services.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/medication', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'medication.html'));
});

app.get('/emergency', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'emergency.html'));
});

app.get('/health', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'health.html'));
});
// API Routes
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, service, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name, email, and message are required' 
            });
        }
        await pool.query(
            `INSERT INTO contacts (name, email, phone, service, message) VALUES ($1, $2, $3, $4, $5)`,
            [name, email, phone, service, message]
        );
        res.json({ 
            success: true, 
            message: 'Contact form submitted successfully!' 
        });
    } catch (error) {
        console.error('Error saving contact:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again later.' 
        });
    }
});

// Medication Reminder API
app.post('/api/medication', async (req, res) => {
    try {
        const { name, email, medicationName, dosage, frequency, time, notes } = req.body;
        if (!name || !email || !medicationName || !dosage || !frequency || !time) {
            return res.status(400).json({ 
                success: false, 
                message: 'All required fields must be filled' 
            });
        }
        await pool.query(
            `INSERT INTO medications (name, email, medication_name, dosage, frequency, time, notes) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [name, email, medicationName, dosage, frequency, time, notes]
        );
        res.json({ 
            success: true, 
            message: 'Medication reminder set successfully!' 
        });
    } catch (error) {
        console.error('Error saving medication:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again later.' 
        });
    }
});

// Get all medication reminders
app.get('/api/medications', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM medications ORDER BY time ASC, id DESC');
        res.json({ success: true, medications: result.rows });
    } catch (error) {
        console.error('Error fetching medications:', error);
        res.status(500).json({ success: false, message: 'Error fetching medication reminders.' });
    }
});

// Emergency Contact API
app.post('/api/emergency', async (req, res) => {
    try {
        const { elderlyName, elderlyPhone, contactName, contactPhone, relationship, address, medicalInfo } = req.body;
        if (!elderlyName || !elderlyPhone || !contactName || !contactPhone || !relationship) {
            return res.status(400).json({ 
                success: false, 
                message: 'All required fields must be filled' 
            });
        }
        await pool.query(
            `INSERT INTO emergency_contacts (elderly_name, elderly_phone, contact_name, contact_phone, relationship, address, medical_info) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [elderlyName, elderlyPhone, contactName, contactPhone, relationship, address, medicalInfo]
        );
        res.json({ 
            success: true, 
            message: 'Emergency contact registered successfully!' 
        });
    } catch (error) {
        console.error('Error saving emergency contact:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again later.' 
        });
    }
});

// Health Check API
app.post('/api/health-check', async (req, res) => {
    try {
        const { name, age, bloodPressure, heartRate, temperature, weight, symptoms, medications, notes } = req.body;
        if (!name || !age) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name and age are required' 
            });
        }
        await pool.query(
            `INSERT INTO health_checks (name, age, blood_pressure, heart_rate, temperature, weight, symptoms, medications, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [name, age, bloodPressure, heartRate, temperature, weight, symptoms, medications, notes]
        );
        res.json({ 
            success: true, 
            message: 'Health check recorded successfully!' 
        });
    } catch (error) {
        console.error('Error saving health check:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again later.' 
        });
    }
});

app.get('/api/contacts', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM contacts ORDER BY created_at DESC');
        res.json({ success: true, contacts: result.rows });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again later.' 
        });
    }
});

// Clock/timer interaction endpoint
app.post('/api/clock-interaction', async (req, res) => {
  try {
    const { time, page, note } = req.body;
    // Store minimal info in health_checks for guests
    await pool.query(
      `INSERT INTO health_checks (name, age, blood_pressure, heart_rate, temperature, weight, symptoms, medications, notes, check_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        'Guest', // name
        0, // age
        null, // blood_pressure
        null, // heart_rate
        null, // temperature
        null, // weight
        null, // symptoms
        null, // medications
        note || `Clock interaction on ${page}`,
        time || new Date().toISOString()
      ]
    );
    res.json({ success: true, message: 'Clock/timer interaction logged.' });
  } catch (error) {
    console.error('Error logging clock/timer interaction:', error);
    res.status(500).json({ success: false, message: 'Error logging clock/timer interaction.' });
  }
});

// Get all health/clock/guest check records
app.get('/api/health-records', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM health_checks ORDER BY check_date DESC NULLS LAST, id DESC');
    res.json({ success: true, records: result.rows });
  } catch (error) {
    console.error('Error fetching health records:', error);
    res.status(500).json({ success: false, message: 'Error fetching health records.' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Care Circle API is running!',
        timestamp: new Date().toISOString()
    });
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Something went wrong!' 
    });
});

app.listen(PORT, () => {
    console.log(`Care Circle server running on http://localhost:${PORT}`);
});

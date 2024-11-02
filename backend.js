// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Models
// company.model.js
const companySchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    mobile: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    verificationToken: String,
    createdAt: { type: Date, default: Date.now }
});

const Company = mongoose.model('Company', companySchema);

// job.model.js
const jobSchema = new mongoose.Schema({
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    experienceLevel: { type: String, required: true },
    candidates: [{ type: String }], // Array of candidate emails
    endDate: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Job = mongoose.model('Job', jobSchema);

// Email Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Access denied' });

    jwt.verify(token, process.env.JWT_SECRET, (err, company) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.company = company;
        next();
    });
};

// Routes
// Company Authentication Routes
app.post('/api/companies/register', async (req, res) => {
    try {
        const { name, email, password, mobile } = req.body;
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Generate verification token
        const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' });
        
        const company = new Company({
            name,
            email,
            password: hashedPassword,
            mobile,
            verificationToken
        });

        await company.save();

        // Send verification email
        const verificationEmail = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify Your Email',
            html: `Click <a href="${process.env.FRONTEND_URL}/verify/${verificationToken}">here</a> to verify your email.`
        };

        await transporter.sendMail(verificationEmail);

        res.status(201).json({ message: 'Registration successful. Please check your email for verification.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/companies/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const company = await Company.findOne({ email: decoded.email });
        if (!company) return res.status(404).json({ message: 'Company not found' });

        company.isVerified = true;
        company.verificationToken = undefined;
        await company.save();

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        res.status(400).json({ message: 'Invalid or expired verification token' });
    }
});

app.post('/api/companies/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const company = await Company.findOne({ email });
        if (!company) return res.status(404).json({ message: 'Company not found' });
        
        if (!company.isVerified) {
            return res.status(403).json({ message: 'Please verify your email first' });
        }

        const validPassword = await bcrypt.compare(password, company.password);
        if (!validPassword) return res.status(400).json({ message: 'Invalid password' });

        const token = jwt.sign({ id: company._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Job Routes
app.post('/api/jobs', authenticateToken, async (req, res) => {
    try {
        const { title, description, experienceLevel, candidates, endDate } = req.body;
        
        const job = new Job({
            company: req.company.id,
            title,
            description,
            experienceLevel,
            candidates,
            endDate
        });

        await job.save();

        // Send emails to candidates
        for (const candidateEmail of candidates) {
            const jobEmail = {
                from: process.env.EMAIL_USER,
                to: candidateEmail,
                subject: `New Job Opportunity: ${title}`,
                html: `
                    <h2>${title}</h2>
                    <p>${description}</p>
                    <p>Experience Level: ${experienceLevel}</p>
                    <p>Application Deadline: ${new Date(endDate).toLocaleDateString()}</p>
                `
            };

            await transporter.sendMail(jobEmail);
        }

        res.status(201).json(job);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/jobs', authenticateToken, async (req, res) => {
    try {
        const jobs = await Job.find({ company: req.company.id });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

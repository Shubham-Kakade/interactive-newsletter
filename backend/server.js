// backend/server.js
// This is a live Express server that serves a frontend and handles API requests.

const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const nodemailer = require('nodemailer');
require('dotenv').config(); // Used for local testing, but hosting provider will use its own env variables.

// --- Initialization ---
const app = express();
// Use the PORT environment variable provided by the hosting service, or 3000 for local testing.
const port = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Enable parsing of JSON request bodies

// Serve the frontend static files (HTML, CSS, JS)
// This tells Express to serve the index.html file from the 'frontend' folder
app.use(express.static(path.join(__dirname, '../frontend')));

// --- API Configuration ---
// Read credentials from environment variables
const apiKey = process.env.GEMINI_API_KEY;
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const recipientEmails = process.env.RECIPIENT_EMAILS;

// --- Main Application Logic ---
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;

const transporter = (smtpHost && smtpUser && smtpPass) ? nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort == 465,
    auth: { user: smtpUser, pass: smtpPass },
}) : null;


// --- API Routes ---

/**
 * @route POST /api/generate-news
 * @description Receives a prompt, calls Gemini, and returns news items.
 */
app.post('/api/generate-news', async (req, res) => {
    if (!genAI) {
        return res.status(500).json({ error: 'Gemini API not configured on the server.' });
    }

    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required.' });
    }
    console.log(`Received prompt: "${prompt}"`);

    try {
        const generationPrompt = `
            Based on the topic "${prompt}", generate a list of 5 to 7 important and current trends.
            For each trend, provide a concise, engaging headline and a short summary (1-2 sentences).
            Return the result as a valid JSON array of objects, where each object has a "headline" and a "summary" key.
        `;
        const result = await model.generateContent(generationPrompt);
        const response = await result.response;
        const text = response.text();
        const jsonString = text.replace(/```json|```/g, '').trim();
        const newsItems = JSON.parse(jsonString);
        res.json({ newsItems });
    } catch (error) {
        console.error("Error generating news from Gemini:", error);
        res.status(500).json({ error: 'Failed to generate news from Gemini.' });
    }
});

/**
 * @route POST /api/create-newsletter
 * @description Receives selected news items, builds the HTML, and sends the email.
 */
app.post('/api/create-newsletter', async (req, res) => {
    if (!transporter) {
        return res.status(500).json({ error: 'Email service not configured on the server.' });
    }
    if (!recipientEmails) {
        return res.status(500).json({ error: 'No recipient emails configured on the server.' });
    }

    const { selectedItems } = req.body;
    if (!selectedItems || selectedItems.length === 0) {
        return res.status(400).json({ error: 'At least one news item must be selected.' });
    }
    console.log(`Creating and sending newsletter with ${selectedItems.length} items.`);

    try {
        const templatePath = path.join(__dirname, 'newsletter-template.html');
        const template = await fs.readFile(templatePath, 'utf-8');

        const newsHtml = selectedItems.map((item, index) => {
            if (index === 0) { // Main story style
                return `<tr><td><img src="https://images.unsplash.com/photo-1677756119517-756a188d2d94?q=80&w=1470&auto=format&fit=crop" width="100%" style="max-width: 100%; height: auto; display: block;" alt="Main Story"><table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td bgcolor="#0d3d8a" style="padding: 20px; color: #ffffff; font-family: Arial, sans-serif;"><h2 style="margin: 0; font-size: 22px;">${item.headline}</h2></td></tr><tr><td style="padding: 20px; border: 1px solid #dddddd; border-top: 0; font-family: Arial, sans-serif; font-size: 15px; color: #555; line-height: 1.6;">${item.summary}</td></tr></table></td></tr><tr><td style="font-size: 0; line-height: 0;" height="25">&nbsp;</td></tr>`;
            }
            return `<tr><td><table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td width="60" valign="top"><img src="https://placehold.co/50x50/2563EB/FFFFFF?text=i&font=arial" width="50" height="50" style="border-radius: 50%;"></td><td valign="top" style="padding-left: 15px; font-family: Arial, sans-serif;"><h3 style="margin: 0 0 5px 0; font-size: 18px; color: #333;">${item.headline}</h3><p style="margin: 0; font-size: 14px; color: #666; line-height: 1.5;">${item.summary}</p></td></tr></table></td></tr><tr><td style="font-size: 0; line-height: 0;" height="20">&nbsp;</td></tr>`;
        }).join('');
        
        const finalHtml = template.replace('{{NEWS_ITEMS_PLACEHOLDER}}', newsHtml);

        await transporter.sendMail({
            from: `"AI Weekly Roundup" <${smtpUser}>`,
            to: recipientEmails,
            subject: 'Your AI Weekly Roundup!',
            html: finalHtml,
        });

        console.log("Newsletter sent successfully!");
        res.json({ message: 'Newsletter sent successfully!', preview: finalHtml });

    } catch (error) {
        console.error("Error creating or sending newsletter:", error);
        res.status(500).json({ error: 'Failed to create or send the newsletter.' });
    }
});

// --- Server Start ---
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

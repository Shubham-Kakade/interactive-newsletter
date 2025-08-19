// backend/server.js
// This version is updated to generate HTML matching the new newsletter template.

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const { GoogleGenerativeAI } = require('@google/generative-ai');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// --- Predefined Recipient Lists ---
const RECIPIENT_LISTS = {
    "marketing-team": "marketing-head@mphasis.com,seo-specialist@mphasis.com",
    "all-employees": "all-staff@mphasis.com,hr-updates@mphasis.com",
    "tech-leads": "lead-dev@mphasis.com,architect@mphasis.com",
    "testing-only": process.env.SMTP_USER
};

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

// --- API Configuration ---
const apiKey = process.env.GEMINI_API_KEY;
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;
const transporter = (smtpHost && smtpUser && smtpPass) ? nodemailer.createTransport({
    host: smtpHost, port: smtpPort, secure: smtpPort == 465, auth: { user: smtpUser, pass: smtpPass },
}) : null;

// --- API Routes ---

app.get('/api/recipient-groups', (req, res) => {
    const groupNames = Object.keys(RECIPIENT_LISTS);
    res.json({ recipientGroups: groupNames });
});

app.post('/api/generate-news', async (req, res) => {
    if (!genAI) return res.status(500).json({ error: 'Gemini API not configured.' });
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required.' });
    
    try {
        const generationPrompt = `Based on "${prompt}", generate 5-7 important trends as a JSON array of objects with "headline" and "summary" keys.`;
        const result = await model.generateContent(generationPrompt);
        const text = await result.response.text();
        const jsonString = text.replace(/```json|```/g, '').trim();
        res.json({ newsItems: JSON.parse(jsonString) });
    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ error: 'Failed to generate news.' });
    }
});

app.post('/api/preview-newsletter', async (req, res) => {
    const { selectedItems } = req.body;
    if (!selectedItems || selectedItems.length === 0) return res.status(400).json({ error: 'No items selected.' });

    try {
        const template = await fs.readFile(path.join(__dirname, 'newsletter-template.html'), 'utf-8');
        
        // *** UPDATED HTML GENERATION LOGIC ***
        // This now creates HTML that matches the new template's structure.
        const newsHtml = selectedItems.map(item => `
            <tr>
                <td style="padding: 25px 40px; border-bottom: 1px solid #e2e8f0;" class="content-padding">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td style="color: #2c5282; margin: 0 0 12px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 20px; font-weight: 600; line-height: 1.3;">
                                ${item.headline}
                            </td>
                        </tr>
                        <tr>
                            <td style="color: #4a5568; margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 15px; line-height: 1.6; padding-top: 12px;">
                                ${item.summary}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        `).join('');

        const finalHtml = template.replace('{{NEWS_ITEMS_PLACEHOLDER}}', newsHtml);
        res.json({ previewHtml: finalHtml });
    } catch (error) {
        console.error("Preview Error:", error);
        res.status(500).json({ error: 'Failed to create preview.' });
    }
});

app.post('/api/send-newsletter', async (req, res) => {
    if (!transporter) return res.status(500).json({ error: 'Email service not configured.' });
    
    const { htmlContent, recipientGroup } = req.body;
    if (!htmlContent || !recipientGroup) return res.status(400).json({ error: 'HTML content and a recipient group are required.' });

    const recipientEmails = RECIPIENT_LISTS[recipientGroup];
    if (!recipientEmails) return res.status(400).json({ error: 'Invalid recipient group selected.' });

    try {
        await transporter.sendMail({
            from: `"AI Weekly Roundup" <${smtpUser}>`,
            to: recipientEmails,
            subject: 'Your AI Weekly Roundup!',
            html: htmlContent,
        });
        res.json({ message: `Newsletter sent successfully to the ${recipientGroup} group!` });
    } catch (error) {
        console.error("Send Error:", error);
        res.status(500).json({ error: 'Failed to send newsletter.' });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

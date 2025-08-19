// backend/server.js
// This version is updated to generate HTML matching the new CREATIVE newsletter template.

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
        const generationPrompt = `Based on "${prompt}", generate 3 to 5 important trends as a JSON array of objects with "headline" and "summary" keys. The first one should be the most important.`;
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
        
        // ** NEW HTML GENERATION LOGIC for the creative template **
        const newsHtml = selectedItems.map((item, index) => {
            // First item is the large, featured story
            if (index === 0) {
                return `
                <tr>
                    <td style="padding: 0 40px 40px;" class="content-padding">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(241, 245, 249, 0.5); border-left: 4px solid #9333ea; border-radius: 0 16px 16px 0;">
                            <tr>
                                <td style="padding: 30px;">
                                    <p style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #9333ea; margin: 0;">Featured</p>
                                    <h2 style="color: #1e293b; margin: 10px 0 15px; font-size: 24px; font-weight: 700; line-height: 1.2; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                                        ${item.headline}
                                    </h2>
                                    <p style="color: #475569; margin: 0; font-size: 16px; line-height: 1.6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                                        ${item.summary}
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                `;
            }
            // Subsequent items are in a two-column layout
            // This is a simplified version for email compatibility
            return `
            <tr>
                <td style="padding: 0 40px 30px;" class="content-padding">
                     <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <tr>
                            <td style="padding: 25px;">
                                <h3 style="color: #2c5282; margin: 0 0 10px; font-size: 18px; font-weight: 600; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                                    ${item.headline}
                                </h3>
                                <p style="color: #64748b; margin: 0; font-size: 14px; line-height: 1.5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                                    ${item.summary}
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            `;
        }).join('');

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
            from: `"Creative Weekly Digest" <${smtpUser}>`,
            to: recipientEmails,
            subject: 'Your Creative Weekly Digest!',
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

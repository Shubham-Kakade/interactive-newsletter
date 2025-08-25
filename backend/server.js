// backend/server.js
// This version includes a more robust method for parsing the JSON response from the AI.

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

// --- Middleware & Config ---
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

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
    res.json({ recipientGroups: Object.keys(RECIPIENT_LISTS) });
});

app.post('/api/generate-news', async (req, res) => {
    if (!genAI) return res.status(500).json({ error: 'Gemini API not configured.' });
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required.' });
    
    try {
        const generationPrompt = `
            Based on the topic "${prompt}", generate a list of 5 to 7 of the most important and latest developments (from the past 2 weeks). 
These updates should be highly relevant for CXO-level leaders at a global IT services organization (similar to TCS, Infosys, Tech Mahindra, Mphasis) with a strong focus on BFSI clients in North America.

The updates should cover:
1. Major advancements in Artificial Intelligence and their enterprise adoption.  
2. BFSI-related technology and financial trends (banking, payments, insurance, risk, cybersecurity, regulations).  
3. Strategic moves by leading tech companies (Microsoft, Google, Amazon, Accenture, IBM, Infosys, TCS, Wipro, etc.) that impact IT services.  
4. Regulatory and compliance changes in North America affecting BFSI and IT services.  
5. Insights or commentary from influential leaders (CEOs, policymakers, AI experts).

For each update, return:
- "headline": A crisp headline (under 12 words).  
- "summary": A concise summary (1–2 sentences) highlighting strategic relevance for IT services & BFSI.  
- "sourceUrl": A valid, openable URL from a reputable tech/financial news site (e.g., TechCrunch, Wired, WSJ, FT, Reuters, Bloomberg, The Verge).

Return the result **only** as a valid JSON array of objects with keys: "headline", "summary", and "sourceUrl".

        `;
        const result = await model.generateContent(generationPrompt);
        const text = await result.response.text();
        
        // --- FIX: Robust JSON extraction ---
        // This regular expression finds the JSON array within the AI's response,
        // even if there is extra text before or after it.
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error("No valid JSON array found in the AI's response.");
        }
        const jsonString = jsonMatch[0];
        
        res.json({ newsItems: JSON.parse(jsonString) });
    } catch (error) {
        console.error("Gemini Error or JSON Parsing Error:", error);
        res.status(500).json({ error: 'Failed to generate news. The AI response may have been invalid.' });
    }
});

app.post('/api/preview-newsletter', async (req, res) => {
    const { selectedItems } = req.body;
    if (!selectedItems || selectedItems.length === 0) return res.status(400).json({ error: 'No items selected.' });

    try {
        const template = await fs.readFile(path.join(__dirname, 'newsletter-template.html'), 'utf-8');
        
        const newsHtml = selectedItems.map(item => {
            return `
            <!-- Single News Item -->
            <tr>
                <td align="center" style="padding: 0 20px 30px 20px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td align="left" style="border-bottom: 2px solid #e2e8f0; padding-bottom: 20px;">
                                <a href="${item.sourceUrl}" target="_blank" style="text-decoration: none;">
                                    <h3 style="margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 20px; font-weight: 600; color: #1e293b;">${item.headline}</h3>
                                </a>
                                <p style="margin: 8px 0 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 15px; color: #475569; line-height: 1.6;">
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
            from: `"Creative Weekly" <${smtpUser}>`,
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

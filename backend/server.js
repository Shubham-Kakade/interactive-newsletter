// backend/server.js
// This version switches back to the Gemini API and uses the new, detailed CXO prompt.

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const { GoogleGenerativeAI } = require('@google/generative-ai'); // <-- Reverted to Gemini
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

const apiKey = process.env.GEMINI_API_KEY; // <-- Reverted to Gemini
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

// --- Initialize API Clients ---
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null; // <-- Reverted to Gemini
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
        // --- NEW DETAILED PROMPT ---
        const generationPrompt = `
            Generate a list of 5 to 7 of the most important developments from the past 14 days based on the topic of ${prompt}.
            These updates are for a weekly intelligence briefing for the CXO suite of a global IT services organization whose primary market is North American Fortune 500 BFSI clients.
            The updates must cover the intersection of AI, technology, and the financial services sector, with a strong emphasis on events originating from or directly impacting the North American market.
            Prioritize news related to:

            1. Major AI Platform & Enterprise Moves: Announcements from Microsoft, Google Cloud, AWS, IBM, and Salesforce impacting enterprise adoption.
            2. Competitor & Partner Strategy: Significant acquisitions, partnerships, or product launches from competitors like Accenture, Deloitte, or other major IT service providers with a footprint in North America.
            3. North American Regulatory Landscape: New guidance or rulings on AI, data, and cybersecurity from US and Canadian bodies (e.g., SEC, Federal Reserve, FINRA, OSFI).
            4. BFSI Client Innovation: Concrete examples of AI adoption, investment, or digital transformation by major North American banks, insurers, or financial institutions.
            5. Influential Market Commentary: Actionable insights from CEOs of major tech or financial firms or influential analysts.
            
            Avoid news that is primarily of regional interest outside of North America, unless it has direct and significant global implications.
            For each update, return:

            - "headline": A crisp, impactful headline (under 15 words).
            - "summary": A 2-sentence strategic summary explaining why this matters to an IT services leader serving North American BFSI clients. Focus on the opportunity or threat.
            - "url": A direct, verifiable URL to a high-authority, English-language news source or press release.
            
            Return the result only as a valid JSON array of objects.
        `;
        const result = await model.generateContent(generationPrompt);
        const text = await result.response.text();
        
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
            // Updated to use "url" key from the new prompt
            return `
            <!-- Single News Item -->
            <tr>
                <td align="center" style="padding: 0 20px 30px 20px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td align="left" style="border-bottom: 2px solid #e2e8f0; padding-bottom: 20px;">
                                <h3 style="margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 20px; font-weight: 600; color: #1e293b;">${item.headline}</h3>
                                <p style="margin: 8px 0 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 15px; color: #475569; line-height: 1.6;">
                                    ${item.summary}
                                    <a href="${item.url}" target="_blank" style="text-decoration: none; color: #4A90E2; font-weight: bold;">Read More &rarr;</a>
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

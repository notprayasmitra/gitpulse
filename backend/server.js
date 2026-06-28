const express = require('express');
const cors = require('cors');
const path = require('path');
const Groq = require('groq-sdk');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running!', hasToken: !!process.env.GITHUB_TOKEN });
});

app.post('/api/review-pr', async (req, res) => {
  const { prUrl } = req.body;

  if (!prUrl) {
    return res.status(400).json({ error: 'PR URL is required' });
  }

  try {
    const urlParts = prUrl.replace('https://github.com/', '').split('/');
    const owner = urlParts[0];
    const repo = urlParts[1];
    const pullNumber = urlParts[3];

    if (!owner || !repo || !pullNumber) {
      return res.status(400).json({ error: 'Invalid GitHub PR URL format' });
    }

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`, {
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3.diff'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `GitHub API error: ${errorText}` });
    }

    const diffText = await response.text();

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an expert Senior Software Engineer. Review the following code diff from a GitHub Pull Request. 
          Provide structured feedback using Markdown format. Look for:
          1. Technical bugs or logical issues.
          2. Edge cases that might cause failures.
          3. Readability and compliance with coding standards.
          Keep your feedback precise, constructive, and direct.`
        },
        {
          role: "user",
          content: `Here is the git diff:\n\n${diffText}`
        }
      ],
      model: "llama-3.1-8b-instant", // Model options: llama-3.1-8b-instant & llama-3.3-70b-versatile
    });

    const aiReview = chatCompletion.choices[0].message.content;

    res.json({ success: true, review: aiReview });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error during processing' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
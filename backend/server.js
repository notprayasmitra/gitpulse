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

// 🚀 BACKEND COMPILER WITH TIGHT MARKDOWN PROMPT
app.post('/api/review-repo', async (req, res) => {
  const { repoUrl } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ error: 'Repository URL is required' });
  }

  try {
    const cleanUrl = repoUrl.replace(/\/$/, '');
    const urlParts = cleanUrl.replace('https://github.com/', '').split('/');
    const owner = urlParts[0];
    const repo = urlParts[1];

    if (!owner || !repo) {
      return res.status(400).json({ error: 'Invalid GitHub Repository URL format' });
    }

    const repoInfoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` }
    });
    if (!repoInfoRes.ok) throw new Error('Failed to fetch base repository details');
    const repoInfo = await repoInfoRes.json();
    const defaultBranch = repoInfo.default_branch;

    const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`, {
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!treeResponse.ok) {
      return res.status(treeResponse.status).json({ error: 'Failed to retrieve repository file structure map.' });
    }

    const treeData = await treeResponse.json();
    
    const excludedExtensions = [
      '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.pdf', '.zip', '.tar', '.gz',
      '.mp3', '.mp4', '.woff', '.woff2', '.eot', '.ttf', '.exe', '.dll', '.ds_store'
    ];
    const excludedDirectories = [
      'node_modules', '.next', 'dist', 'build', '.git', '.env', 'package-lock.json', 'yarn.lock'
    ];

    const validFiles = treeData.tree.filter(file => {
      // 1. Must be a file asset, not a directory folder tree node
      if (file.type !== 'blob') return false;

      const filePathLower = file.path.toLowerCase();

      // 2. Explicitly kill any font, image, or lock folders right at the root paths
      const blockedKeywords = ['fonts/', 'images/', 'assets/', 'node_modules/', '.next/', 'dist/', 'build/'];
      if (blockedKeywords.some(keyword => filePathLower.includes(keyword))) return false;

      // 3. Match explicit forbidden file extensions
      const blockedExtensions = [
        '.ttf', '.woff', '.woff2', '.eot', '.otf', 
        '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', 
        '.pdf', '.zip', '.tar', '.gz', '.lock'
      ];
      if (blockedExtensions.some(ext => filePathLower.endsWith(ext))) return false;

      // If it passes all security checks, allow parsing
      return true;
    }).slice(0, 15);

    let concatenatedCodebase = '';

    for (const file of validFiles) {
      const rawFileRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${file.path}`, {
        headers: { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` }
      });
      
      if (rawFileRes.ok) {
        const content = await rawFileRes.text();
        concatenatedCodebase += `\n\n--- START FILE: ${file.path} ---\n${content.substring(0, 4000)}\n--- END FILE ---`;
      }
    }

    if (!concatenatedCodebase) {
      return res.status(400).json({ error: 'No readable source files discovered.' });
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an expert technical documentation architect. Formulate highly clean, web-friendly, and completely left-aligned documentation using clear structural Markdown.

          CRITICAL RULES:
          1. Avoid excessive bullet points. Use raw paragraphs, definition blocks, or clean data tables instead.
          2. Ensure every single text element, header, and table alignment behaves strictly left-aligned.
          
          Follow this structure precisely:
          
          # 01 // SYSTEM OVERVIEW
          > Provide a clean, blockquoted 2-3 sentence technical summary of what this repository manages. Do not use bullet points here.
          
          ---

          # 02 // ARCHITECTURAL BLUEPRINT
          > Provide a clean, blockquoted 2-3 sentence technical summary of the architectural design and flow of this repository. Do not use bullet points here.
          
          ### Topology & Framework Flow
          > Provide a solid technical paragraph explaining how the directories interact and pass states. Do not use lists.

          ---

          # 03 // CORE COMPONENT REGISTRY
          For every core file scanned, provide a clean text breakdown without nesting sub-bullets:
          
          ### Target Module: \`path/to/file.ext\`
          *System Designation:* Write title here.
          *Functional Scope:* Provide a solid, continuous sentence layout explaining what it configures or exposes.
          
          ---

          # 04 // ENVIRONMENT DEPLOYMENT & SETUP
          Provide step-by-step terminal block setups:
          \`\`\`bash
          # Commands go here
          \`\`\``
        },
        {
          role: "user",
          content: `Here is the codebase snapshot data for project [${repo}]:\n\n${concatenatedCodebase}`
        }
      ],
      model: "llama-3.3-70b-versatile",
    });

    res.json({ success: true, documentation: chatCompletion.choices[0].message.content });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error analyzing code assets' });
  }
});

app.post('/api/fetch-prs', async (req, res) => {
  const { repoUrl } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ error: 'Repository URL is required' });
  }

  try {
    const cleanUrl = repoUrl.replace(/\/$/, ''); 
    const urlParts = cleanUrl.replace('https://github.com/', '').split('/');
    const owner = urlParts[0];
    const repo = urlParts[1];

    if (!owner || !repo) {
      return res.status(400).json({ error: 'Invalid GitHub Repository URL format' });
    }

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=open`, {
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      // If GitHub says 404, it means the repo doesn't exist OR it's a private repository
      if (response.status === 404) {
        return res.status(404).json({ 
          error: 'Repository not found. It may be private or misspelled. Make sure your GITHUB_TOKEN has access to it.' 
        });
      }
      
      const errorText = await response.text();
      return res.status(response.status).json({ error: `GitHub API error: ${errorText}` });
    }
    
    const prsData = await response.json();

    const formattedPRs = prsData.map(pr => ({
      number: pr.number,
      title: pr.title,
      url: pr.html_url,
      author: pr.user.login
    }));

    res.json({ success: true, prs: formattedPRs });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error fetching pull requests' });
  }
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
      if (response.status === 404) {
        return res.status(404).json({ 
          error: 'Pull request not found. If this is a private repository, ensure your GITHUB_TOKEN has full read permissions for it.' 
        });
      }
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
      model: "llama-3.3-70b-versatile", // Model options: llama-3.1-8b-instant & llama-3.3-70b-versatile
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
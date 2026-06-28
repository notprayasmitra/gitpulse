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

// 🚀 UPGRADED ROUTE: Clean Binary Filter & High-End Markdown Compiler
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

    // 1. Fetch default branch info
    const repoInfoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` }
    });
    if (!repoInfoRes.ok) throw new Error('Failed to fetch base repository details');
    const repoInfo = await repoInfoRes.json();
    const defaultBranch = repoInfo.default_branch;

    // 2. Fetch file tree recursively
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
    
    // 🔒 EXPANDED FILTER: Stops binary data corruption streams completely
    const excludedExtensions = [
      '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.pdf', '.zip', '.tar', '.gz',
      '.mp3', '.mp4', '.woff', '.woff2', '.eot', '.ttf', '.exe', '.dll', '.ds_store'
    ];
    const excludedDirectories = [
      'node_modules', '.next', 'dist', 'build', '.git', '.env', 'package-lock.json', 'yarn.lock'
    ];

    const validFiles = treeData.tree.filter(file => 
      file.type === 'blob' && 
      !excludedDirectories.some(dir => file.path.includes(dir)) &&
      !excludedExtensions.some(ext => file.path.toLowerCase().endsWith(ext))
    ).slice(0, 15); // Capped to 15 essential source files

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
      return res.status(400).json({ error: 'No readable source files discovered in this repository scope.' });
    }

    // 3. Command Groq to format output as clean, web-friendly Markdown components
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an expert technical documentation architect. Formulate highly clean, web-friendly documentation for the provided codebase snapshot using structural Markdown. 

          Follow this layout specification strictly:
          
          # SYSTEM OVERVIEW
          > Provide a concise, professional 2-3 sentence overview explaining what the project achieves.
          
          ### Core Objectives & Deliverables
          * Use clean bullet lists to show what functionality the codebase targets.
          
          ---

          # ARCHITECTURAL BLUEPRINT
          ### Technology Stack Matrix
          | Layer | Technology | Purpose / Role |
          | :--- | :--- | :--- |
          | Frontend | (e.g., React / Vite) | (Inferred from files) |
          | Backend | (e.g., Node.js / Express) | (Inferred from files) |

          ### Core Structural Layout
          * Describe the architectural directories and how logic flows across components.

          ---

          # COMPONENT REGISTRY
          *For every core file processed, provide a clean breakdown:*
          
          ### \`path/to/file.js\`
          * **Role:** Short explanation of why this file exists.
          * **Key Functions/Configurations:** Detail what it configures or exposes.
          
          ---

          # INSTALLATION & SETUP
          Provide step-by-step terminal instructions. Format terminal codes using clear, separate shell syntax blocks:
          \`\`\`bash
          # Commands go here
          \`\`\`
          
          Maintain an elegant, highly structured, developer-focused technical presentation tone.`
        },
        {
          role: "user",
          content: `Here is the codebase data snapshot for project [${repo}]:\n\n${concatenatedCodebase}`
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
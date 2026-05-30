const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Your Anthropic API key goes here
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'YOUR_API_KEY_HERE';

const typePrompts = {
  linkedin: 'Write a compelling LinkedIn post',
  email: 'Write a cold outreach email (subject line + body)',
  instagram: 'Write an Instagram caption with relevant hashtags',
  sales: 'Write a short sales page section (headline + 3 paragraphs)',
  bio: 'Write a professional business bio (2–3 paragraphs)',
  followup: "Write a follow-up email for a prospect who didn't reply"
};

app.post('/generate', async (req, res) => {
  const { bizName, bizDesc, audience, type, tone } = req.body;

  if (!bizName || !bizDesc || !type || !tone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const prompt = `${typePrompts[type] || 'Write professional content'} for the following business:

Business Name: ${bizName}
What they do: ${bizDesc}${audience ? `\nTarget audience: ${audience}` : ''}

Tone: ${tone}

Requirements:
- Make it specific to this business — no generic filler
- Sound like a real human wrote it, not a robot
- Be compelling, clear, and ready to use as-is
- Do not add any meta-commentary, just output the content directly`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const text = data.content?.find(b => b.type === 'text')?.text || '';
    res.json({ result: text });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Generation failed. Please try again.' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ContentForge backend running on port ${PORT}`));

import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const IMAGES = [
  '/tmp/design1_small.png',
];

const PROMPT = `Describe this UI screenshot in detail as JSON. Focus on: layout, colors (with hex codes), typography style, visual style (glassmorphism/minimal/dark/etc), buttons and cards, background treatment, and any unique features. Keep it concise.`;

async function analyzeImage(imagePath) {
  const zai = await ZAI.create();
  const buffer = fs.readFileSync(imagePath);
  const base64 = buffer.toString('base64');
  const ext = path.extname(imagePath).slice(1).toLowerCase();
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg';

  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: PROMPT },
          { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } },
        ],
      },
    ],
    thinking: { type: 'disabled' },
  });

  return response.choices[0]?.message?.content;
}

async function main() {
  for (const img of IMAGES) {
    console.log(`\n========== ANALYZING: ${path.basename(img)} ==========`);
    try {
      const result = await analyzeImage(img);
      console.log(result);
      const outPath = img.replace(/\.png$/, '_analysis.json');
      fs.writeFileSync(outPath, result, 'utf8');
      console.log(`\nSaved to: ${outPath}`);
    } catch (e) {
      console.error('Failed for', img, e.message);
    }
  }
}

main();

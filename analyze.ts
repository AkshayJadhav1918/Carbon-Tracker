import fs from 'fs';

function findKeywordsInFile(filePath: string, keywords: string[]) {
  const content = fs.readFileSync(filePath, 'utf-8');
  console.log(`--- Analyzing ${filePath} ---`);
  
  keywords.forEach(kw => {
    let index = 0;
    let count = 0;
    while ((index = content.indexOf(kw, index)) !== -1) {
      count++;
      // Print context of 100 chars around it
      const start = Math.max(0, index - 50);
      const end = Math.min(content.length, index + 50);
      const chunk = content.substring(start, end).replace(/\n/g, ' ');
      console.log(`Match for "${kw}" [${count}]: ...${chunk}...`);
      index += kw.length;
      if (count >= 15) { // cap output per keyword to avoid flooding
        console.log(`(Truncated after 15 occurrences of "${kw}")`);
        break;
      }
    }
  });
}

// Common topics to search for
const keywords = [
  '/api',
  'gemini',
  'GoogleGenAI',
  'apiKey',
  'calculate',
  'footprint',
  'diet',
  'transport',
  'energy',
  'waste',
  'flight',
  'Paris',
  'average',
  'store',
  'recommendation',
  'insight'
];

findKeywordsInFile('assets/store-C6yxtQOP.js', keywords);
findKeywordsInFile('assets/index-v3iUX61G.js', keywords);

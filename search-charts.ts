import fs from 'fs';

const content = fs.readFileSync('assets/index-v3iUX61G.js', 'utf-8');

function findAndPrint(term: string, len: number) {
  const idx = content.indexOf(term);
  if (idx !== -1) {
    console.log(`=== Found ${term} ===`);
    console.log(content.substring(idx, idx + len));
  } else {
    console.log(`=== Not found ${term} ===`);
  }
}

// Print 4000 characters to fully capture the dr component details
findAndPrint('dr=({history', 4000);

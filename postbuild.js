import fs from 'fs';
import path from 'path';

const distDir = path.join(process.cwd(), 'dist');
const assetsDir = path.join(distDir, 'assets');

try {
  // Find the CSS file in dist/assets
  const files = fs.readdirSync(assetsDir);
  const cssFile = files.find(f => f.endsWith('.css'));

  if (cssFile) {
    const cssPath = path.join(assetsDir, cssFile);
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    
    // Read index.html
    const htmlPath = path.join(distDir, 'index.html');
    let htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    
    // Replace stylesheet link tag with inlined style tag
    const linkRegex = new RegExp(`<link[^>]*href=["']?\\/?assets\\/${cssFile}["']?[^>]*>`, 'g');
    htmlContent = htmlContent.replace(linkRegex, `<style>${cssContent}</style>`);
    
    // Fallback: remove any residual stylesheet links
    const residualLinkRegex = /<link rel="stylesheet"[^>]*>/g;
    htmlContent = htmlContent.replace(residualLinkRegex, '');

    fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
    
    // Delete the CSS file to prevent duplicate load / warnings
    fs.unlinkSync(cssPath);
    console.log(`Successfully inlined CSS (${cssFile}) into index.html`);
  } else {
    console.log('No CSS file found to inline.');
  }
} catch (err) {
  console.error('Error running postbuild inlining:', err);
}

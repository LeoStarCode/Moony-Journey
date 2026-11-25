// Keep the editable question bank and the copy used by direct file launches in sync.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'index.html');
const data = JSON.parse(fs.readFileSync(path.join(root, 'questions.json'), 'utf8'));
const json = JSON.stringify(data, null, 2).replace(/</g, '\\u003c');
const block = `  <!-- QUESTION_BANK_START -->\n  <script id="question-bank" type="application/json">\n${json}\n  </script>\n  <!-- QUESTION_BANK_END -->`;
const html = fs.readFileSync(htmlPath, 'utf8');
const marker = /^  <!-- QUESTION_BANK_START -->[\s\S]*?^  <!-- QUESTION_BANK_END -->/m;
if (!marker.test(html)) throw new Error('The embedded question bank markers are missing from index.html.');
const updated = html.replace(marker, () => block);
if (process.argv.includes('--check')) {
  if (updated !== html) {
    console.error('The questions in index.html are out of date. Run: node tools/sync-questions.cjs');
    process.exitCode = 1;
  } else {
    console.log('The embedded questions match questions.json.');
  }
} else {
  fs.writeFileSync(htmlPath, updated);
  console.log(`Embedded ${data.questions.length} questions in index.html.`);
}

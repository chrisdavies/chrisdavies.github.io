// Generates a new markdown file with the specified title
// npm run new "My Fanci Post"

const fs = require('fs');
const { exec } = require('child_process');

// node new.js 'New blog post'
const title = process.argv[2] || 'New blog post';

const pad = n => (`00${n}`).slice(-2);
const now = new Date();
const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const fileName = `${timestamp}-${title.toLowerCase().replace(' ', '-')}.md`;
const filePath = `./src/md/${fileName}`;
const content = `# ${title}`;

fs.writeFileSync(filePath, content);

console.log(filePath);

exec(`code ${filePath}`);

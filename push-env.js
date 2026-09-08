const { execSync } = require('child_process');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf-8');
const lines = envContent.split('\n');

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  
  const [key, ...valueParts] = trimmed.split('=');
  let value = valueParts.join('=').trim();
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.substring(1, value.length - 1);
  }
  
  if (key && value) {
    console.log(`Adding ${key}...`);
    try {
      execSync(`npx vercel env add ${key} production`, {
        input: value,
        stdio: ['pipe', 'ignore', 'ignore']
      });
      execSync(`npx vercel env add ${key} preview`, {
        input: value,
        stdio: ['pipe', 'ignore', 'ignore']
      });
      execSync(`npx vercel env add ${key} development`, {
        input: value,
        stdio: ['pipe', 'ignore', 'ignore']
      });
    } catch (e) {
      console.log(`Failed to add ${key}`);
    }
  }
}
console.log('All variables added!');

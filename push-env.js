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
      try {
        execSync(`npx vercel env rm ${key} production --yes`, { stdio: 'ignore' });
        execSync(`npx vercel env rm ${key} preview --yes`, { stdio: 'ignore' });
        execSync(`npx vercel env rm ${key} development --yes`, { stdio: 'ignore' });
      } catch (e) {
        // Ignore errors if the key doesn't exist
      }
      
      const typeFlag = key.startsWith('NEXT_PUBLIC_') ? '--type config' : '';
      
      execSync(`npx vercel env add ${key} production ${typeFlag}`, {
        input: value,
        stdio: ['pipe', 'inherit', 'inherit']
      });
      execSync(`npx vercel env add ${key} preview ${typeFlag}`, {
        input: value,
        stdio: ['pipe', 'inherit', 'inherit']
      });
      execSync(`npx vercel env add ${key} development ${typeFlag}`, {
        input: value,
        stdio: ['pipe', 'inherit', 'inherit']
      });
    } catch (e) {
      console.log(`Failed to add ${key}`);
    }
  }
}
console.log('All variables added!');

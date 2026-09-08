const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if(file.endsWith('.tsx')) results.push(file);
    }
  });
  return results;
}
const files = walk('./app/(dashboard)');
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('<table className="w-full text-sm">')) {
    content = content.replace(/<table className="w-full text-sm">/g, '<table className="w-full text-sm min-w-[800px]">');
    fs.writeFileSync(f, content);
    console.log('Updated ' + f);
  }
});

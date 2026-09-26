const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(path.join(__dirname, '../frontend/src'), function(filePath) {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Replace broken quote variants with backticks
    content = content.replace(/["'](http:\/\/\$\{window\.location\.hostname\}:4000\/api.*?)[m"']/g, '`$1`');
    // More targeted:
    content = content.replace(/["'](http:\/\/\$\{window\.location\.hostname\}:4000\/api[a-zA-Z0-9_\-\/\?\=\$\{\}\.]*)["']/g, '`$1`');
    // Replace dangling ends from powershell screwup (if any)
    content = content.replace(/["'](http:\/\/\$\{window\.location\.hostname\}:4000\/api[a-zA-Z0-9_\-\/\?\=\$\{\}\.]*)['"]/g, '`$1`');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed:', filePath);
    }
  }
});

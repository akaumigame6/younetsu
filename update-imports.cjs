const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

// app配下のインポートを置換
const appDir = path.join(__dirname, 'src/app');
if (fs.existsSync(appDir)) {
  walkDir(appDir, (filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let newContent = content.replace(/pages\//g, 'views/');
      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
      }
    }
  });
}

// pagesディレクトリ内のファイルを無効化する (削除またはリネーム)
const pagesDir = path.join(__dirname, 'src/pages');
if (fs.existsSync(pagesDir)) {
  try {
    fs.rmSync(pagesDir, { recursive: true, force: true });
    console.log('src/pages successfully deleted.');
  } catch (err) {
    console.error('Failed to delete src/pages. Renaming files instead...', err.message);
    walkDir(pagesDir, (filePath) => {
      if (filePath.endsWith('.tsx')) {
        fs.renameSync(filePath, filePath + '.txt');
      }
    });
  }
}

console.log('Import paths updated.');

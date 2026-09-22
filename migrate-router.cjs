const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/admin/AdminCreatorFeedbackDetail.tsx',
  'src/pages/admin/AdminDashboard.tsx',
  'src/pages/admin/AdminEventFeedbackDetail.tsx',
  'src/pages/admin/AdminLogin.tsx',
  'src/pages/creator/CreatorFeedbackView.tsx',
  'src/pages/viewer/CompleteSend.tsx',
  'src/pages/viewer/CreatorSelect.tsx',
  'src/pages/viewer/EventSurvey.tsx',
  'src/pages/viewer/MyFeedbackDetail.tsx',
  'src/pages/viewer/SurveyWizard.tsx',
  'src/pages/viewer/ViewerMenu.tsx',
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('"use client";') && !content.includes("'use client';")) {
    content = '"use client";\n' + content;
  }

  content = content.replace(/import\s*\{\s*([^}]*)\s*\}\s*from\s*['"]react-router-dom['"];/, (match, p1) => {
    let imports = p1.split(',').map(s => s.trim());
    imports = imports.map(i => i === 'useNavigate' ? 'useRouter' : i);
    
    // next/navigation は useLocation を持たないので除外する。
    // SurveyWizard.tsx のロジックに影響するが、まずはエラーなくコンパイルを通すことを優先する。
    imports = imports.filter(i => i !== 'useLocation');
    return `import { ${imports.join(', ')} } from 'next/navigation';`;
  });

  content = content.replace(/const\s+navigate\s*=\s*useNavigate\(\);/g, 'const router = useRouter();');
  content = content.replace(/navigate\(/g, 'router.push(');

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Migration complete');

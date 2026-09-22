const fs = require('fs');
const path = require('path');

const routes = [
  { path: 'app/survey/page.tsx', component: '../../pages/viewer/EventSurvey' },
  { path: 'app/survey/wizard/page.tsx', component: '../../../pages/viewer/SurveyWizard' },
  { path: 'app/survey/creators/page.tsx', component: '../../../pages/viewer/CreatorSelect' },
  { path: 'app/survey/complete/page.tsx', component: '../../../pages/viewer/CompleteSend' },
  { path: 'app/viewer/page.tsx', component: '../../pages/viewer/ViewerMenu' },
  { path: 'app/viewer/feedback/[id]/page.tsx', component: '../../../../pages/viewer/MyFeedbackDetail' },
  { path: 'app/creator/[token]/page.tsx', component: '../../../pages/creator/CreatorFeedbackView' },
  { path: 'app/admin/page.tsx', component: '../../pages/admin/AdminLogin' },
  { path: 'app/admin/dashboard/page.tsx', component: '../../../pages/admin/AdminDashboard' },
  { path: 'app/admin/creator/[id]/page.tsx', component: '../../../../pages/admin/AdminCreatorFeedbackDetail' },
  { path: 'app/admin/event-survey/page.tsx', component: '../../../pages/admin/AdminEventFeedbackDetail' }
];

routes.forEach(route => {
  const fullPath = path.join(__dirname, 'src', route.path);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const content = `"use client";\nimport PageComponent from '${route.component}';\nexport default function Page() { return <PageComponent />; }\n`;
  fs.writeFileSync(fullPath, content, 'utf8');
});
console.log('App router creation complete.');

const fs = require('fs');
const path = require('path');

const files = [
  'lib/rbac.ts',
  'lib/auth.ts',
  'lib/actions/workflows.ts',
  'lib/actions/tasks.ts',
  'lib/actions/clients.ts',
  'lib/actions/documents.ts',
  'app/(dashboard)/invoices/[id]/page.tsx',
  'app/(dashboard)/invoices/page.tsx',
  'app/(dashboard)/field-tasks/page.tsx',
  'app/(dashboard)/clients/page.tsx',
  'components/dashboard/WorkflowStepCard.tsx',
  'components/dashboard/TaskStatusButton.tsx',
  'components/dashboard/InvoiceBuilder.tsx'
];

files.forEach(f => {
  const filePath = path.join(process.cwd(), f);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/from ["']@prisma\/client["']/g, 'from "@/types"');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', f);
  } else {
    console.log('Missing', f);
  }
});

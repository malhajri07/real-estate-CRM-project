const fs = require('fs');

// Read the file
const filePath = 'apps/web/src/pages/rbac-dashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Find the line numbers of duplicate cases
const lines = content.split('\n');
let duplicateInvoicingStart = -1;
let duplicateContentManagementStart = -1;
let defaultCaseStart = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === "case 'invoicing':" && duplicateInvoicingStart === -1) {
    // Find the first occurrence
    let j = i;
    while (j < lines.length && !lines[j].trim().startsWith('case ') && !lines[j].trim().startsWith('default:')) {
      j++;
    }
    if (j < lines.length && lines[j].trim() === "case 'invoicing':") {
      duplicateInvoicingStart = i;
    }
  }
  if (lines[i].trim() === "case 'content-management':" && duplicateContentManagementStart === -1) {
    // Find the first occurrence
    let j = i;
    while (j < lines.length && !lines[j].trim().startsWith('case ') && !lines[j].trim().startsWith('default:')) {
      j++;
    }
    if (j < lines.length && lines[j].trim() === "case 'content-management':") {
      duplicateContentManagementStart = i;
    }
  }
  if (lines[i].trim() === 'default:') {
    defaultCaseStart = i;
    break;
  }
}

console.log('Duplicate invoicing case starts at line:', duplicateInvoicingStart);
console.log('Duplicate content-management case starts at line:', duplicateContentManagementStart);
console.log('Default case starts at line:', defaultCaseStart);

// Remove the duplicate cases
if (duplicateInvoicingStart !== -1 && duplicateContentManagementStart !== -1 && defaultCaseStart !== -1) {
  // Remove from duplicate invoicing case to duplicate content-management case
  const newLines = lines.slice(0, duplicateInvoicingStart).concat(lines.slice(duplicateContentManagementStart));
  
  // Find where the duplicate content-management case ends
  let duplicateContentManagementEnd = duplicateContentManagementStart;
  while (duplicateContentManagementEnd < newLines.length && !newLines[duplicateContentManagementEnd].trim().startsWith('case ') && !newLines[duplicateContentManagementEnd].trim().startsWith('default:')) {
    duplicateContentManagementEnd++;
  }
  
  // Remove the duplicate content-management case
  const finalLines = newLines.slice(0, duplicateContentManagementStart).concat(newLines.slice(duplicateContentManagementEnd));
  
  // Write the fixed content
  fs.writeFileSync(filePath, finalLines.join('\n'));
  console.log('Fixed duplicate cases');
} else {
  console.log('Could not find duplicate cases to remove');
}

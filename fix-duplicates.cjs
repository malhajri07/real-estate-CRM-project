const fs = require('fs');

// Read the file
const filePath = 'client/src/pages/rbac-dashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Split into lines
const lines = content.split('\n');

// Find and remove duplicate case 'invoicing':
let invoicingCount = 0;
let invoicingStart = -1;
let invoicingEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === "case 'invoicing':") {
    invoicingCount++;
    if (invoicingCount === 1) {
      invoicingStart = i;
    } else if (invoicingCount === 2) {
      // This is the duplicate, find where it ends
      let j = i;
      while (j < lines.length && !lines[j].trim().startsWith('case ') && !lines[j].trim().startsWith('default:')) {
        j++;
      }
      invoicingEnd = j;
      break;
    }
  }
}

if (invoicingStart !== -1 && invoicingEnd !== -1) {
  // Remove the duplicate case
  lines.splice(invoicingStart, invoicingEnd - invoicingStart);
  console.log('Removed duplicate invoicing case');
}

// Find and remove duplicate case 'content-management':
let contentManagementCount = 0;
let contentManagementStart = -1;
let contentManagementEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === "case 'content-management':") {
    contentManagementCount++;
    if (contentManagementCount === 1) {
      contentManagementStart = i;
    } else if (contentManagementCount === 2) {
      // This is the duplicate, find where it ends
      let j = i;
      while (j < lines.length && !lines[j].trim().startsWith('case ') && !lines[j].trim().startsWith('default:')) {
        j++;
      }
      contentManagementEnd = j;
      break;
    }
  }
}

if (contentManagementStart !== -1 && contentManagementEnd !== -1) {
  // Remove the duplicate case
  lines.splice(contentManagementStart, contentManagementEnd - contentManagementStart);
  console.log('Removed duplicate content-management case');
}

// Write the fixed content
fs.writeFileSync(filePath, lines.join('\n'));
console.log('Fixed duplicate cases');


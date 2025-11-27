const fs = require('fs');
const path = require('path');

const privateKey = `....`;

const envContent = `# Line Login
NEXT_PUBLIC_LINE_LIFF_ID=
LINE_CHANNEL_ID=xxxxx
LINE_CHANNEL_SECRET=xxxxx

# Google Sheets
GOOGLE_SERVICE_ACCOUNT_EMAIL=zxzxz
GOOGLE_PRIVATE_KEY="${privateKey}"
GOOGLE_SHEET_ID=1493sKJbvY0ElPVjh5xCplsN3JK8d7xZe_-aPrKeZ5gc

# Admin System
NEXT_PUBLIC_ADMIN_LINE_IDS=xxxxxxxx
`;

fs.writeFileSync(path.join(process.cwd(), '.env.local'), envContent);
console.log('.env.local updated successfully');

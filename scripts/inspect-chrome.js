import { execSync } from 'child_process';

const output = execSync('tasklist /FI "IMAGENAME eq chrome.exe" /V /FO CSV', { encoding: 'utf8' });
const lines = output.trim().split('\n');
for (const line of lines) {
  const parts = line.split('","').map(s => s.replace(/(^"|"$)/g, ''));
  if (parts.length >= 9 && parts[8] && parts[8] !== 'N/A' && parts[8] !== 'Window Title') {
    console.log(`PID: ${parts[1]} | Title: ${parts[8]}`);
  }
}

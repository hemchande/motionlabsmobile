#!/usr/bin/env node
/**
 * Print the URL to open on your phone (same Wi-Fi as this machine).
 * Run while dev server is running: npm run dev (in one terminal), npm run phone-url (in another).
 */
const os = require('os');
const nets = os.networkInterfaces();
for (const name of Object.keys(nets)) {
  for (const iface of nets[name]) {
    if (iface.family === 'IPv4' && !iface.internal) {
      const url = `http://${iface.address}:3000`;
      console.log('\n  Open this on your phone (same Wi-Fi):\n');
      console.log('  ' + url);
      console.log('\n');
      process.exit(0);
    }
  }
}
console.log('  No LAN IP found. Are you connected to Wi-Fi?\n');
process.exit(1);

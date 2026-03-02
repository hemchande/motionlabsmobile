/**
 * List Firebase Auth users for debugging (e.g. sign-in method, email).
 *
 * Setup:
 * 1. Firebase Console → Project Settings → Service accounts → Generate new private key
 * 2. Save the JSON file as firebase-service-account.json in the project root
 *    (or set GOOGLE_APPLICATION_CREDENTIALS to its path)
 * 3. Run: node scripts/list-firebase-users.js
 *
 * Do NOT commit firebase-service-account.json (it's in .gitignore).
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const projectId = 'motionlabsai-c2a0b';

function getCredentials() {
  const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (envPath && fs.existsSync(envPath)) {
    return envPath;
  }
  const localPath = path.join(process.cwd(), 'firebase-service-account.json');
  if (fs.existsSync(localPath)) {
    return localPath;
  }
  console.error(
    'No credentials found. Either:\n' +
    '  - Save your service account JSON as firebase-service-account.json in the project root, or\n' +
    '  - Set GOOGLE_APPLICATION_CREDENTIALS to the path of the JSON file.\n' +
    'Get the key: Firebase Console → Project Settings → Service accounts → Generate new private key'
  );
  process.exit(1);
}

async function main() {
  const credPath = getCredentials();
  if (!admin.apps.length) {
    const key = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    admin.initializeApp({ credential: admin.credential.cert(key) });
  }
  const auth = admin.auth();

  console.log('Listing Firebase Auth users for project:', projectId);
  console.log('---\n');

  const allUsers = [];
  let nextPageToken;
  do {
    const result = await auth.listUsers(1000, nextPageToken);
    allUsers.push(...result.users);
    nextPageToken = result.pageToken;
  } while (nextPageToken);

  if (allUsers.length === 0) {
    console.log('No users found.');
    return;
  }

  console.log(`Total users: ${allUsers.length}\n`);

  for (const u of allUsers) {
    const providers = (u.providerData || []).map((p) => p.providerId);
    const hasPassword = providers.includes('password');
    const hasGoogle = providers.includes('google.com');
    const signInHint = hasPassword
      ? 'Can sign in with email/password'
      : hasGoogle
        ? 'Google only (no password – use "Sign in with Google")'
        : providers.length ? providers.join(', ') : 'no providers';
    console.log(`Email:     ${u.email || '(none)'}`);
    console.log(`UID:      ${u.uid}`);
    console.log(`Providers: ${providers.join(', ') || '(none)'}`);
    console.log(`→ ${signInHint}`);
    console.log(`Created:   ${u.metadata.creationTime}`);
    console.log(`Disabled:  ${u.disabled}`);
    console.log('');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

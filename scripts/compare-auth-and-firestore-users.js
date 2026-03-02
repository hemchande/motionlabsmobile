/**
 * List Firebase Auth users and Firestore "users" collection, and compare.
 * Shows which Auth users have (or lack) a Firestore user doc (completed profile).
 *
 * Setup: firebase-service-account.json in project root, or GOOGLE_APPLICATION_CREDENTIALS
 * Run: node scripts/compare-auth-and-firestore-users.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

function getCredentials() {
  const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (envPath && fs.existsSync(envPath)) {
    return envPath;
  }
  const localPath = path.join(process.cwd(), 'firebase-service-account.json');
  if (fs.existsSync(localPath)) {
    return localPath;
  }
  console.error('No credentials. Use firebase-service-account.json or GOOGLE_APPLICATION_CREDENTIALS.');
  process.exit(1);
}

async function main() {
  const credPath = getCredentials();
  if (!admin.apps.length) {
    const key = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    admin.initializeApp({ credential: admin.credential.cert(key) });
  }
  const auth = admin.auth();
  const db = admin.firestore();

  const authUsers = [];
  let nextPageToken;
  do {
    const result = await auth.listUsers(1000, nextPageToken);
    authUsers.push(...result.users);
    nextPageToken = result.pageToken;
  } while (nextPageToken);

  const usersSnap = await db.collection('users').get();
  const firestoreUids = new Set(usersSnap.docs.map((d) => d.id));
  const firestoreByUid = new Map(usersSnap.docs.map((d) => [d.id, d.data()]));

  console.log('--- Firebase Auth vs Firestore "users" ---\n');
  console.log(`Firebase Auth users:     ${authUsers.length}`);
  console.log(`Firestore user documents: ${firestoreUids.size}`);
  console.log('');

  if (authUsers.length === 0) {
    console.log('No Firebase Auth users.');
    return;
  }

  for (const u of authUsers) {
    const inFirestore = firestoreUids.has(u.uid);
    const doc = firestoreByUid.get(u.uid);
    const role = doc?.role ?? '(no doc)';
    const fullName = doc?.fullName ?? '(no doc)';
    console.log(`${u.email || '(no email)'}`);
    console.log(`  UID: ${u.uid}`);
    console.log(`  Firestore doc: ${inFirestore ? 'YES' : 'NO (has not completed profile)'}`);
    if (inFirestore) {
      console.log(`  role: ${role}, fullName: ${fullName}`);
    }
    console.log('');
  }

  const authOnly = authUsers.filter((u) => !firestoreUids.has(u.uid));
  if (authOnly.length > 0) {
    console.log('--- Auth users WITHOUT a Firestore user doc (need to complete profile) ---');
    authOnly.forEach((u) => console.log(`  ${u.email || u.uid}`));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

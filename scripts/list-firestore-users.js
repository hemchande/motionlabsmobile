/**
 * List all documents in the Firestore "users" collection.
 * Use this to verify how many users have completed profile (have a doc in users).
 *
 * Setup: same as list-firebase-users.js
 *   firebase-service-account.json in project root, or GOOGLE_APPLICATION_CREDENTIALS
 * Run: node scripts/list-firestore-users.js
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
  console.error(
    'No credentials found. Use firebase-service-account.json or GOOGLE_APPLICATION_CREDENTIALS.\n' +
    'See list-firebase-users.js for setup.'
  );
  process.exit(1);
}

async function main() {
  const credPath = getCredentials();
  if (!admin.apps.length) {
    const key = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    admin.initializeApp({ credential: admin.credential.cert(key) });
  }
  const db = admin.firestore();

  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  if (snapshot.empty) {
    console.log('Firestore "users" collection: 0 documents.');
    console.log('(Each user who completes profile gets a doc; invited athletes need to complete profile.)');
    return;
  }

  console.log(`Firestore "users" collection: ${snapshot.size} document(s)\n`);

  snapshot.docs.forEach((d, i) => {
    const data = d.data();
    const createdAt = data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;
    const lastLogin = data.lastLogin && data.lastLogin.toDate ? data.lastLogin.toDate().toISOString() : data.lastLogin;
    console.log(`${i + 1}. Document ID (Firebase UID): ${d.id}`);
    console.log(`   email:      ${data.email || '(none)'}`);
    console.log(`   fullName:   ${data.fullName || '(none)'}`);
    console.log(`   role:       ${data.role || '(none)'}`);
    console.log(`   athleteId:  ${data.athleteId ?? '(none)'}`);
    console.log(`   institution: ${data.institution ?? '(none)'}`);
    console.log(`   createdAt:  ${createdAt ?? '(none)'}`);
    console.log(`   lastLogin:  ${lastLogin ?? '(none)'}`);
    console.log('');
  });

  console.log('Tip: Run "node scripts/list-firebase-users.js" to see Firebase Auth users.');
  console.log('If Auth has more users than Firestore users, those users have not completed profile yet.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

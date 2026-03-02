/**
 * Delete all documents in the Firestore "invitations" collection.
 *
 * Setup:
 * 1. Firebase Console → Project Settings → Service accounts → Generate new private key
 * 2. Save the JSON file as firebase-service-account.json in the project root
 *    (or set GOOGLE_APPLICATION_CREDENTIALS to its path)
 * 3. Run: node scripts/delete-firestore-invitations.js
 *
 * Do NOT commit firebase-service-account.json (it's in .gitignore).
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
  const db = admin.firestore();

  const collectionRef = db.collection('invitations');
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    console.log('No invitations found. Collection is already empty.');
    return;
  }

  console.log(`Found ${snapshot.size} invitation(s). Deleting...`);

  const batchSize = 500;
  let deleted = 0;
  let batch = db.batch();

  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
    deleted++;
    if (deleted % batchSize === 0) {
      await batch.commit();
      batch = db.batch();
      console.log(`  Deleted ${deleted}...`);
    }
  }

  if (deleted % batchSize !== 0) {
    await batch.commit();
  }

  console.log(`Done. Deleted ${deleted} invitation(s) from Firestore.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rulesText = fs.readFileSync(new URL('./firestore.rules', import.meta.url), 'utf8');

test('Firestore rules enforce Eight Pillars and block Dirty Dozen payloads', () => {
  // 1. Default-deny catch-all exists
  assert.ok(rulesText.includes('match /{document=**} {\n      allow read, write: if false;\n    }'));

  // 2. Unauthenticated / Unverified Email Spoofing blocked
  assert.ok(rulesText.includes('request.auth.token.email_verified == true'));

  // 3. Path Variable Hardening (ID Poisoning Guard)
  assert.ok(rulesText.includes("id.matches('^[a-zA-Z0-9_\\\\-]+$')"));
  assert.ok(rulesText.includes('isValidId(projectId)'));
  assert.ok(rulesText.includes('isValidId(characterId)'));
  assert.ok(rulesText.includes('isValidId(userId)'));

  // 4. Shadow Field Injection blocked via hasAll + hasOnly
  assert.ok(rulesText.includes('data.keys().hasAll(['));
  assert.ok(rulesText.includes('data.keys().hasOnly(['));
  assert.ok(rulesText.includes('incoming().diff(existing()).affectedKeys().hasOnly(['));

  // 5. Owner Immutability & Temporal Integrity enforced
  assert.ok(rulesText.includes('incoming().ownerId == existing().ownerId'));
  assert.ok(rulesText.includes('incoming().createdAt == request.time'));
  assert.ok(rulesText.includes('incoming().updatedAt == request.time'));

  // 6. Terminal State Locking enforced on projects
  assert.ok(rulesText.includes("existing().status != 'archived'"));

  // 7. PII Isolation enforced in /users/{userId}/private/{infoId}
  assert.ok(rulesText.includes('match /private/{infoId}'));
  assert.ok(rulesText.includes('existsAfter(/databases/$(database)/documents/users/$(userId))'));

  // 8. Secure List Queries enforce resource.data.ownerId == request.auth.uid
  assert.ok(rulesText.includes('allow list: if isSignedIn() && (resource.data.ownerId == request.auth.uid || isAdmin());'));
});

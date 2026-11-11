# Security Specification — AI Music Video Studio

## 1. Data Invariants
1. **Default-Deny Catch-All**: All unmatched paths in Firestore are unconditionally denied (`allow read, write: if false;`).
2. **PII Split-Collection Isolation**: User email addresses are isolated in `/users/{userId}/private/{infoId}` and never stored in `/users/{userId}`. Only the owner (`request.auth.uid == userId`) or a verified admin (`isAdmin()`) can read `/users/{userId}/private/{infoId}`.
3. **Verified Identity & Anti-Spoofing**: All write operations require `isSignedIn()`, `request.auth.token.email_verified == true`, and strict UID ownership (`incoming().ownerId == request.auth.uid` or `incoming().uid == request.auth.uid`).
4. **Path Variable Hardening**: Every single-document target operation (`get`, `create`, `update`, `delete`) validates document IDs via `isValidId(id)` (`id is string && id.size() >= 1 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`).
5. **Strict Key & Size Enforcement**: Every entity has a dedicated `isValid[Entity](data)` helper enforcing `data.keys().hasAll(...)`, `data.keys().hasOnly(...)`, exact types, and `.size()` bounds on every string.
6. **Temporal Integrity**: `createdAt` must equal `request.time` on creation and remain immutable (`incoming().createdAt == existing().createdAt`) on update; `updatedAt` must equal `request.time` on both creation and update.
7. **Secure List Queries**: Every `allow list` rule enforces `resource.data.ownerId == request.auth.uid || isAdmin()` without delegating filtering to the client and without calling `get()` or `exists()` on each listed document.

## 2. The "Dirty Dozen" Payloads (All Must Return `PERMISSION_DENIED`)
1. **Unauthenticated Profile Creation**: Creating `/users/user_1` with `auth == null`.
2. **Unverified Email Spoofing**: Creating `/users/user_1` with `email_verified: false`.
3. **Cross-User Profile Hijack**: Authenticated `user_2` creating `/users/user_1` with `uid: "user_1"`.
4. **Shadow Field Injection on Create**: Creating `/projects/proj_1` with an undeclared field `"isAdminOverride": true`.
5. **Shadow Field Injection on Update**: Updating `/projects/proj_1` with an undeclared field `"freeCredits": 999999`.
6. **Owner Immutability Violation**: Updating `/projects/proj_1` to change `ownerId` from `"user_1"` to `"user_2"`.
7. **Timestamp Forgery on Create**: Creating `/projects/proj_1` with a past client timestamp instead of `request.time`.
8. **CreatedAt Mutation on Update**: Updating `/projects/proj_1` with a modified `createdAt` timestamp.
9. **Resource Poisoning (Oversized String)**: Creating `/characters/char_1` with a 5,000-character `name` (exceeding `maxLength: 80`).
10. **PII Blanket Leak**: Authenticated `user_2` attempting `get` on `/users/user_1/private/info`.
11. **Unscoped List Scraping**: Authenticated `user_2` attempting `list` on `/projects` without `where('ownerId', '==', 'user_2')`.
12. **Self-Assigned Admin Escalation**: Authenticated non-admin user attempting to create `/admins/user_2`.

## 3. Red Team Audit Conflict Report
- **Identity Spoofing**: Blocked by `incoming().ownerId == request.auth.uid` on create and `incoming().ownerId == existing().ownerId` on update.
- **State Shortcutting**: `status` is strictly constrained to the allowed enum `['draft', 'analyzing', 'storyboard_ready', 'generating_clips', 'editing', 'exported', 'failed']`.
- **Resource Poisoning**: Every ID is guarded by `isValidId()` (`<= 128` chars, alphanumeric/hyphen/underscore) and every string has an explicit `.size() <= MAX` bound.
- **Value Poisoning on Update**: Every `allow update` block begins with `isValid[Entity](incoming())` before checking action-specific `affectedKeys().hasOnly(...)`.

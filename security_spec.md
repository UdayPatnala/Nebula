# 🛡️ NEBULA FIRESTORE SECURITY SPECIFICATION (ABAC Model)

This document specifies the Data Invariants and the "Dirty Dozen" active attack vectors designed to challenge and verify our Zero-Trust Firebase integration.

---

## 🧬 1. Data Invariants

1. **User Identity Invariant**: A user document at `/users/{userId}` can only be created or modified if its `uid` field identically matches `request.auth.uid`.
2. **Memory Path Isolation Invariant**: A memory doc at `/users/{userId}/memories/{memoryId}` can only be written, listed, or fetched by the authenticated owner (`request.auth.uid == userId`).
3. **Temporal Sanity Invariant**: All synced records must have a `syncedAt` (or `createdAt`) matching `request.time`. Client-declared rogue timestamps are strictly rejected.
4. **Absolute Schema Invariance**: Creating a memory without full required attributes or injecting ghost/unauthorized parameters will violate strict Map size bounds, failing immediately.
5. **Verified Email Mandate**: To prevent rogue/unverified signup spamming, any writing user must have a verified email token (`request.auth.token.email_verified == true`).

---

## ☣️ 2. The "Dirty Dozen" Payloads

Here are twelve weaponized payloads that are mathematically guaranteed to fail permission checks under our security architecture:

### 1. The ID Spoof Attack (Identity Spoofing)
- **Path**: `/users/legit_user_123`
- **Invoker**: `attacker_456`
- **Payload**:
```json
{
  "uid": "legit_user_123",
  "email": "malicious@attacker.org",
  "displayName": "Rogue Agent",
  "createdAt": "2026-05-31T10:00:00Z"
}
```
- **Reason to Block**: Cannot create or write user records unless path ID matches the current caller's UID.

### 2. The Cross-Tenant Memory Inject (Privilege Escalation)
- **Path**: `/users/legit_user_123/memories/mem_789`
- **Invoker**: `attacker_456`
- **Payload**:
```json
{
  "id": "mem_789",
  "fileKey": "100-200-hacker.png",
  "name": "hacker.png",
  "size": 1337,
  "timestamp": 1717142400000,
  "dateStr": "2026-05-31",
  "time12h": "10:00 AM",
  "hour24": 10.0,
  "caption": "Injected memory",
  "category": "Nature",
  "location": "Outdoor",
  "peopleCount": 0,
  "colorPalette": ["#000000", "#111111", "#222222"],
  "syncedAt": "2026-05-31T10:00:00Z"
}
```
- **Reason to Block**: Access to child memories is locked under the parent user ID path check.

### 3. The Unverified Rogue Signup (Email Spoofing)
- **Path**: `/users/unverified_user`
- **Invoker**: `unverified_user` (but `email_verified` is `false`)
- **Payload**:
```json
{
  "uid": "unverified_user",
  "email": "unverified@test.com",
  "createdAt": "2026-05-31T10:05:00Z"
}
```
- **Reason to Block**: Writes are restricted to users with `request.auth.token.email_verified == true`.

### 4. The Shadow Update Ghost-Field Inject (Vulnerability / Under-locking)
- **Path**: `/users/legit_user_123/memories/mem_789`
- **Invoker**: `legit_user_123`
- **Payload**:
```json
{
  "id": "mem_789",
  "fileKey": "100-200-hacker.png",
  "name": "hacker.png",
  "size": 1337,
  "timestamp": 1717142400000,
  "dateStr": "2026-05-31",
  "time12h": "10:00 AM",
  "hour24": 10.0,
  "caption": "Injected memory",
  "category": "Nature",
  "location": "Outdoor",
  "peopleCount": 0,
  "colorPalette": ["#000000", "#111111", "#222222"],
  "syncedAt": "2026-05-31T10:00:00Z",
  "isAdmin": true
}
```
- **Reason to Block**: Contains the shadow field "isAdmin", failing the strict key size check.

### 5. Temporal Deception Attack (Time Spoofing)
- **Path**: `/users/legit_user_123/memories/mem_789`
- **Invoker**: `legit_user_123`
- **Payload**:
```json
{
  "id": "mem_789",
  "fileKey": "100-200-hacker.png",
  "name": "hacker.png",
  "size": 1337,
  "timestamp": 1717142400000,
  "dateStr": "2026-05-31",
  "time12h": "10:00 AM",
  "hour24": 10.0,
  "caption": "Stale data",
  "category": "Nature",
  "location": "Outdoor",
  "peopleCount": 0,
  "colorPalette": ["#000000", "#111111", "#222222"],
  "syncedAt": "1999-12-31T23:59:59Z"
}
```
- **Reason to Block**: Declares a past timestamp instead of matching `request.time`.

### 6. The 1MB ID Poisoning Attack (Resource Poisoning)
- **Path**: `/users/legit_user_123/memories/extremely_long_junk_id_that_exceeds_128_chars_and_has_invalid_symbols_!!!`
- **Invoker**: `legit_user_123`
- **Payload**: Valid Memory object.
- **Reason to Block**: Document ID path variable fails `isValidId()` pattern and length constraints.

### 7. The Partial Key Deletion ("Anti-Update-Gap")
- **Path**: `/users/legit_user_123/memories/mem_789`
- **Invoker**: `legit_user_123`
- **Payload**:
```json
{
  "id": "mem_789",
  "caption": "Stripped database item"
}
```
- **Reason to Block**: Creation or generic updates must satisfy schema structures, maintaining relational integrity.

### 8. Massive Over-limit Array Inflation (PII/Wallet Exhaustion)
- **Path**: `/users/legit_user_123/memories/mem_789`
- **Invoker**: `legit_user_123`
- **Payload**:
```json
{
  "id": "mem_789",
  "fileKey": "100-200-hacker.png",
  "name": "hacker.png",
  "size": 1337,
  "timestamp": 1717142400000,
  "dateStr": "2026-05-31",
  "time12h": "10:00 AM",
  "hour24": 10.0,
  "caption": "Test inflation",
  "category": "Nature",
  "location": "Outdoor",
  "peopleCount": 0,
  "colorPalette": ["#1", "#2", "#3", "#4", "#5", "#6"], // Over-size list
  "syncedAt": "2026-05-31T10:00:00Z"
}
```
- **Reason to Block**: `colorPalette` must have a strict size of exactly 3 or <= 5.

### 9. Type Mismatch Attack (Payload Poisoning)
- **Path**: `/users/legit_user_123/memories/mem_789`
- **Invoker**: `legit_user_123`
- **Payload**: Explicitly passes a boolean instead of a number for `peopleCount`: `"peopleCount": true`.
- **Reason to Block**: Fails schema attribute type-safety check.

### 10. Blank PII Read Attempt (PII Leak)
- **Invoker**: `attacker_456`
- **Action**: Attempting to read `/users/legit_user_123`.
- **Reason to Block**: Client profiles are closed except to the respective authenticated account.

### 11. Anonymous Memory Dumping (Anonymous Write)
- **Path**: `/users/anon_123/memories/mem_abc`
- **Invoker**: Anonymous (Unauthenticated)
- **Payload**: Valid Memory object.
- **Reason to Block**: Blocked by authentication layer.

### 12. Query Scraping List Attempt (Blanket Scraping)
- **Invoker**: `attacker_456`
- **Action**: Listing all user profiles or other users' memories.
- **Reason to Block**: The list rule explicitly restricts queries to `resource.data.userId == request.auth.uid`, blocking generic database mining.

---

## 🧪 3. Verification Test Suite Outline

The testing blueprint uses `@firebase/rules-unit-testing`:

```typescript
import { initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "gen-lang-client-0672107445",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "localhost",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

// All 12 test payloads trigger expected firebase error:
// expect(operation).rejects.toThrow("PERMISSION_DENIED");
```

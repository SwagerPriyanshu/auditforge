/**
 * Test 7: Cryptographic Attestation
 *
 * Input: Any investigation
 * Expected: Attestation generated, Merkle root hash stored
 * Success: Attestation exists, can verify individual entries
 */

import {
  getAttestationGen,
  createTestSession,
  assertSessionCompleted,
} from "./helpers";

describe("Test 7: Cryptographic Attestation", () => {
  it("should generate an attestation after investigation", async () => {
    const result = await createTestSession(
      "Attestation Test",
      "Investigate the 500 errors on the API"
    );

    assertSessionCompleted(result.session);

    // Attestation should be generated
    const gen = getAttestationGen();
    const attestation = await gen.generateAttestation(result.session.id);

    expect(attestation).toBeDefined();
    expect(attestation.merkleRoot).toBeTruthy();
    expect(attestation.leafCount).toBeGreaterThanOrEqual(0);
    expect(attestation.sessionId).toBe(result.session.id);
  });

  it("should produce a valid Merkle root hash", async () => {
    const result = await createTestSession(
      "Merkle Root Test",
      "Check the deployment logs"
    );

    const gen = getAttestationGen();
    const attestation = await gen.generateAttestation(result.session.id);

    // Merkle root should be a hex string
    expect(attestation.merkleRoot).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should produce different roots for different sessions", async () => {
    const result1 = await createTestSession("Attestation A", "Investigate API errors");
    const result2 = await createTestSession("Attestation B", "Check database connectivity");

    const gen = getAttestationGen();
    const att1 = await gen.generateAttestation(result1.session.id);
    const att2 = await gen.generateAttestation(result2.session.id);

    expect(att1.merkleRoot).not.toBe(att2.merkleRoot);
  });

  it("should include leaf count matching audit entries", async () => {
    const result = await createTestSession(
      "Leaf Count Test",
      "Investigate the incident"
    );

    const gen = getAttestationGen();
    const attestation = await gen.generateAttestation(result.session.id);

    // Leaf count should match the number of entries
    expect(attestation.leafCount).toBe(result.entries.length);
  });

  it("should produce a block hash", async () => {
    const result = await createTestSession(
      "Block Hash Test",
      "Check system status"
    );

    const gen = getAttestationGen();
    const attestation = await gen.generateAttestation(result.session.id);

    expect(attestation.blockHash).toBeTruthy();
    expect(attestation.blockHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should handle empty sessions gracefully", async () => {
    const gen = getAttestationGen();
    const attestation = await gen.generateAttestation("nonexistent-session");

    expect(attestation.leafCount).toBe(0);
    expect(attestation.merkleRoot).toBeTruthy();
  });
});

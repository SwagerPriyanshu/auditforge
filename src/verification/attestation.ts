/**
 * AuditForge — Merkle Tree Attestation
 *
 * Provides cryptographic proof that audit entries are complete and
 * untampered. After each session, the Merkle root is published as
 * an attestation.
 *
 * Properties:
 *   1. All entries are included (Merkle proof)
 *   2. No entries were modified (hash chain)
 *   3. Order is preserved (parent hashes)
 *   4. Individual entries can be verified against the root
 */

import crypto from "crypto";
import { AuditEntryStore, AttestationStore, getDb } from "../storage/audit.db";
import { logger } from "../interception/logger";
import type { Attestation, MerkleProof, AuditEntry } from "../types";

// ─── Types ─────────────────────────────────────────────────────

interface MerkleTree {
  root: string;
  leaves: string[];
  levels: string[][];
}

// ─── Attestation Generator ─────────────────────────────────────

export class AttestationGenerator {
  private leafBuffers = new Map<string, string[]>();

  /**
   * Add a leaf hash to the session's buffer.
   */
  addLeaf(sessionId: string, leafHash: string): void {
    if (!this.leafBuffers.has(sessionId)) {
      this.leafBuffers.set(sessionId, []);
    }
    this.leafBuffers.get(sessionId)!.push(leafHash);
  }

  /**
   * Generate a full attestation for a session.
   *
   * Builds a Merkle tree from all audit entry hashes and
   * returns the root as a cryptographic proof.
   */
  async generateAttestation(sessionId: string): Promise<Attestation> {
    const entries = await AuditEntryStore.getBySession(sessionId);
    const bufferedLeaves = this.leafBuffers.get(sessionId) ?? [];

    // Use buffered leaves if available, otherwise hash entries
    const leaves = bufferedLeaves.length > 0
      ? bufferedLeaves
      : entries.map((e) => this.hashEntry(e));

    if (leaves.length === 0) {
      // No entries — create null attestation
      const nullRoot = this.computeNullRoot(sessionId);
      const attestation: Attestation = {
        sessionId,
        merkleRoot: nullRoot,
        leafCount: 0,
        createdAt: new Date().toISOString(),
        blockHash: this.computeBlockHash(nullRoot, 0, sessionId),
      };

      await AttestationStore.save(attestation);
      logger.attestationCreated(sessionId, nullRoot, 0);
      return attestation;
    }

    // Build Merkle tree
    const tree = this.buildMerkleTree(leaves);

    const attestation: Attestation = {
      sessionId,
      merkleRoot: tree.root,
      leafCount: leaves.length,
      createdAt: new Date().toISOString(),
      blockHash: this.computeBlockHash(tree.root, leaves.length, sessionId),
    };

    await AttestationStore.save(attestation);
    this.leafBuffers.delete(sessionId);

    logger.attestationCreated(sessionId, tree.root, leaves.length);
    return attestation;
  }

  /**
   * Verify that a specific entry is part of the attested log.
   *
   * Uses the Merkle proof to verify the entry against the root.
   */
  async verifyAttestation(
    sessionId: string,
    entryIndex: number,
    entry: AuditEntry,
    root: string
  ): Promise<boolean> {
    const entryHash = this.hashEntry(entry);
    const proof = await this.generateProof(sessionId, entryIndex);

    if (!proof) return false;

    // Recompute root from entry + proof
    let currentHash = entryHash;
    let index = entryIndex;

    for (const siblingHash of proof.proof) {
      const isRight = index % 2 === 1;
      currentHash = isRight
        ? this.hashPair(siblingHash, currentHash)
        : this.hashPair(currentHash, siblingHash);
      index = Math.floor(index / 2);
    }

    return currentHash === root;
  }

  /**
   * Generate a Merkle proof for a specific entry.
   *
   * The proof is the set of sibling hashes needed to recompute
   * the root from the leaf.
   */
  async generateProof(sessionId: string, leafIndex: number): Promise<MerkleProof | null> {
    const leaves = this.leafBuffers.get(sessionId);
    if (!leaves || leafIndex >= leaves.length) {
      // Try loading from DB
      const dbLeaves = await this.loadLeavesFromDb(sessionId);
      if (leafIndex >= dbLeaves.length) return null;
      return this.generateProofFromLeaves(dbLeaves, leafIndex);
    }

    return this.generateProofFromLeaves(leaves, leafIndex);
  }

  // ─── Merkle Tree Operations ──────────────────────────────

  private buildMerkleTree(leaves: string[]): MerkleTree {
    if (leaves.length === 0) {
      return { root: "", leaves: [], levels: [] };
    }

    const levels: string[][] = [leaves];
    let currentLevel = [...leaves];

    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        if (i + 1 < currentLevel.length) {
          nextLevel.push(this.hashPair(currentLevel[i], currentLevel[i + 1]));
        } else {
          // Odd leaf: hash with itself
          nextLevel.push(this.hashPair(currentLevel[i], currentLevel[i]));
        }
      }
      levels.push(nextLevel);
      currentLevel = nextLevel;
    }

    return {
      root: currentLevel[0],
      leaves,
      levels,
    };
  }

  private generateProofFromLeaves(leaves: string[], leafIndex: number): MerkleProof {
    const proof: string[] = [];
    let index = leafIndex;
    let currentLevel = [...leaves];

    while (currentLevel.length > 1) {
      const isRight = index % 2 === 1;
      const siblingIndex = isRight ? index - 1 : index + 1;

      if (siblingIndex < currentLevel.length) {
        proof.push(currentLevel[siblingIndex]);
      }

      // Compute next level
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        if (i + 1 < currentLevel.length) {
          nextLevel.push(this.hashPair(currentLevel[i], currentLevel[i + 1]));
        } else {
          nextLevel.push(this.hashPair(currentLevel[i], currentLevel[i]));
        }
      }
      currentLevel = nextLevel;
      index = Math.floor(index / 2);
    }

    return {
      leafIndex,
      leafHash: leaves[leafIndex],
      proof,
      root: currentLevel[0],
    };
  }

  // ─── Hashing ─────────────────────────────────────────────

  hashEntry(entry: AuditEntry): string {
    const data = JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp,
      toolName: entry.toolName,
      toolInput: entry.toolInput,
      toolOutput: entry.toolOutput,
      riskScore: entry.riskScore,
      approved: entry.approved,
      evidenceHash: entry.evidenceHash,
    });
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  private hashPair(left: string, right: string): string {
    const combined = Buffer.from(left + right, "hex");
    return crypto.createHash("sha256").update(combined).digest("hex");
  }

  private computeNullRoot(sessionId: string): string {
    return crypto.createHash("sha256").update(`auditforge-null:${sessionId}`).digest("hex");
  }

  private computeBlockHash(merkleRoot: string, leafCount: number, sessionId: string): string {
    const payload = `auditforge-block:${merkleRoot}:${leafCount}:${sessionId}:${Date.now()}`;
    return crypto.createHash("sha256").update(payload).digest("hex");
  }

  private async loadLeavesFromDb(sessionId: string): Promise<string[]> {
    const d = await getDb();
    // Use queryAll helper from storage
    const stmt = d.prepare(
      "SELECT evidence_hash FROM audit_entries WHERE session_id = ? ORDER BY timestamp ASC"
    );
    stmt.bind([sessionId]);
    const rows: string[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      rows.push(row.evidence_hash as string);
    }
    stmt.free();
    return rows;
  }
}

// ─── Singleton ─────────────────────────────────────────────────

export const attestationGenerator = new AttestationGenerator();

/**
 * Convenience: add a leaf to the current session's buffer.
 */
export function addLeaf(sessionId: string, leafHash: string): void {
  attestationGenerator.addLeaf(sessionId, leafHash);
}

/**
 * Convenience: finalize attestation for a session.
 */
export async function finalizeAttestation(sessionId: string): Promise<Attestation> {
  return attestationGenerator.generateAttestation(sessionId);
}

/**
 * Convenience: verify an entry against the stored attestation.
 */
export async function verifyEntry(
  sessionId: string,
  entryIndex: number,
  entry: AuditEntry,
  root: string
): Promise<boolean> {
  return attestationGenerator.verifyAttestation(sessionId, entryIndex, entry, root);
}

/**
 * Convenience: generate a Merkle proof.
 */
export async function generateProof(sessionId: string, leafIndex: number): Promise<MerkleProof | null> {
  return attestationGenerator.generateProof(sessionId, leafIndex);
}

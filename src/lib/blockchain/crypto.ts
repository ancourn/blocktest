/**
 * Quantum-resistant cryptography module for KALDRIX
 * TypeScript interfaces for cryptographic operations
 */

import {
  KeyPair,
  KeyType,
  HashAlgorithm,
  SignatureAlgorithm,
  CryptoAlgorithm,
  PublicKey,
  PrivateKey,
  Signature,
  BlockHash,
  TransactionId,
  SecurityLevel,
  CryptoResult,
  CryptoPerformanceStats,
} from './types';
import { Transaction, DAGNode } from './dag';

/**
 * Cryptographic configuration
 */
export interface CryptoConfig {
  /** Primary cryptographic algorithm */
  algorithm: CryptoAlgorithm;
  /** Signature algorithm */
  signatureAlgorithm: SignatureAlgorithm;
  /** Hash algorithm */
  hashAlgorithm: HashAlgorithm;
  /** Whether to enable quantum-resistant signatures */
  enableQuantumSignatures: boolean;
  /** Whether to enable key rotation */
  enableKeyRotation: boolean;
  /** Key rotation interval in seconds */
  keyRotationIntervalSecs: number;
  /** Cache size for cryptographic operations */
  cacheSize: number;
  /** Whether to enable hardware security module (HSM) integration */
  enableHSM: boolean;
  /** HSM configuration */
  hsmConfig?: {
    /** HSM provider */
    provider: string;
    /** HSM endpoint */
    endpoint: string;
    /** HSM credentials */
    credentials: {
      apiKey: string;
      secretKey: string;
    };
  };
}

/**
 * Key rotation manager interface
 */
export interface KeyRotationManager {
  /** Active keys */
  activeKeys: Map<string, KeyPair>;
  /** Rotation schedule */
  rotationSchedule: Map<string, number>;
  /** Last rotation check timestamp */
  lastCheck: number;
  /** Key rotation history */
  rotationHistory: KeyRotationEvent[];
}

/**
 * Key rotation event
 */
export interface KeyRotationEvent {
  /** Key ID */
  keyId: string;
  /** Old key pair */
  oldKeyPair: KeyPair;
  /** New key pair */
  newKeyPair: KeyPair;
  /** Rotation timestamp */
  timestamp: number;
  /** Rotation reason */
  reason: string;
  /** Rotation status */
  status: 'success' | 'failed';
}

/**
 * Quantum cryptography interface
 */
export interface QuantumCrypto {
  /**
   * Initialize the cryptography module
   */
  initialize(config: CryptoConfig): Promise<void>;

  /**
   * Generate a new key pair
   */
  generateKeyPair(): Promise<KeyPair>;

  /**
   * Generate a key pair with specific type
   */
  generateKeyPairWithType(keyType: KeyType): Promise<KeyPair>;

  /**
   * Sign data with private key
   */
  sign(data: Uint8Array, privateKey: PrivateKey): Promise<Signature>;

  /**
   * Verify signature
   */
  verify(data: Uint8Array, signature: Signature, publicKey: PublicKey): Promise<boolean>;

  /**
   * Hash transaction
   */
  hashTransaction(transaction: Transaction): Promise<BlockHash>;

  /**
   * Hash block
   */
  hashBlock(block: DAGNode): Promise<BlockHash>;

  /**
   * Generate shared secret (Key Encapsulation Mechanism)
   */
  generateSharedSecret(publicKey: PublicKey, privateKey: PrivateKey): Promise<Uint8Array>;

  /**
   * Encrypt data using quantum-resistant encryption
   */
  encrypt(data: Uint8Array, publicKey: PublicKey): Promise<Uint8Array>;

  /**
   * Decrypt data
   */
  decrypt(ciphertext: Uint8Array, privateKey: PrivateKey): Promise<Uint8Array>;

  /**
   * Derive key from shared secret
   */
  deriveKey(sharedSecret: Uint8Array, context: Uint8Array): Promise<Uint8Array>;

  /**
   * Get key pair by ID
   */
  getKeyPair(keyId: string): Promise<KeyPair | null>;

  /**
   * List all key pairs
   */
  listKeyPairs(): Promise<KeyPair[]>;

  /**
   * Remove key pair
   */
  removeKeyPair(keyId: string): Promise<boolean>;

  /**
   * Rotate keys
   */
  rotateKeys(): Promise<KeyRotationEvent[]>;

  /**
   * Get performance statistics
   */
  getPerformanceStats(): Promise<CryptoPerformanceStats>;

  /**
   * Get security level
   */
  getSecurityLevel(): Promise<SecurityLevel>;

  /**
   * Validate key format
   */
  validateKeyFormat(keyType: KeyType, keyData: Uint8Array): boolean;

  /**
   * Export key pair
   */
  exportKeyPair(keyId: string, password?: string): Promise<string>;

  /**
   * Import key pair
   */
  importKeyPair(exportedData: string, password?: string): Promise<KeyPair>;

  /**
   * Backup all keys
   */
  backupKeys(password: string): Promise<Uint8Array>;

  /**
   * Restore keys from backup
   */
  restoreKeys(backupData: Uint8Array, password: string): Promise<boolean>;

  /**
   * Clear cache
   */
  clearCache(): Promise<void>;

  /**
   * Get cache statistics
   */
  getCacheStats(): Promise<{
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
  }>;
}

/**
 * Cryptographic operation types
 */
export enum CryptoOperation {
  /** Key generation */
  KeyGeneration = 'key_generation',
  /** Signing */
  Signing = 'signing',
  /** Verification */
  Verification = 'verification',
  /** Encryption */
  Encryption = 'encryption',
  /** Decryption */
  Decryption = 'decryption',
  /** Hashing */
  Hashing = 'hashing',
  /** Key derivation */
  KeyDerivation = 'key_derivation',
  /** Shared secret generation */
  SharedSecret = 'shared_secret',
}

/**
 * Cryptographic benchmark result
 */
export interface CryptoBenchmark {
  /** Operation type */
  operation: CryptoOperation;
  /** Algorithm used */
  algorithm: string;
  /** Number of iterations */
  iterations: number;
  /** Total time in milliseconds */
  totalTimeMs: number;
  /** Average time per operation in microseconds */
  avgTimeUs: number;
  /** Operations per second */
  opsPerSec: number;
  /** Memory usage in bytes */
  memoryUsage: number;
  /** CPU usage percentage */
  cpuUsage: number;
  /** Success rate (0-1) */
  successRate: number;
  /** Error messages */
  errors: string[];
}

/**
 * Security audit result
 */
export interface SecurityAudit {
  /** Audit ID */
  id: string;
  /** Audit timestamp */
  timestamp: number;
  /** Security level */
  securityLevel: SecurityLevel;
  /** Overall security score (0-100) */
  securityScore: number;
  /** Vulnerabilities found */
  vulnerabilities: SecurityVulnerability[];
  /** Recommendations */
  recommendations: string[];
  /** Compliance status */
  complianceStatus: {
    /** Is compliant */
    isCompliant: boolean;
    /** Compliance standards */
    standards: string[];
    /** Non-compliant areas */
    nonCompliantAreas: string[];
  };
}

/**
 * Security vulnerability
 */
export interface SecurityVulnerability {
  /** Vulnerability ID */
  id: string;
  /** Vulnerability type */
  type: string;
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Description */
  description: string;
  /** Affected components */
  affectedComponents: string[];
  /** Remediation steps */
  remediation: string[];
  /** CVSS score */
  cvssScore?: number;
  /** References */
  references: string[];
}

/**
 * Hardware Security Module (HSM) interface
 */
export interface HSMInterface {
  /**
   * Initialize HSM connection
   */
  initialize(config: CryptoConfig['hsmConfig']): Promise<void>;

  /**
   * Generate key in HSM
   */
  generateKey(keyType: KeyType, keyId: string): Promise<KeyPair>;

  /**
   * Sign with HSM
   */
  sign(keyId: string, data: Uint8Array): Promise<Signature>;

  /**
   * Verify with HSM
   */
  verify(keyId: string, data: Uint8Array, signature: Signature): Promise<boolean>;

  /**
   * List keys in HSM
   */
  listKeys(): Promise<string[]>;

  /**
   * Delete key from HSM
   */
  deleteKey(keyId: string): Promise<boolean>;

  /**
   * Backup HSM keys
   */
  backup(): Promise<Uint8Array>;

  /**
   * Restore HSM keys
   */
  restore(backupData: Uint8Array): Promise<boolean>;
}

/**
 * Zero-knowledge proof interface
 */
export interface ZeroKnowledgeProof {
  /**
   * Generate proof
   */
  generateProof(statement: Uint8Array, witness: Uint8Array): Promise<Uint8Array>;

  /**
   * Verify proof
   */
  verifyProof(statement: Uint8Array, proof: Uint8Array): Promise<boolean>;

  /**
   * Generate zk-SNARK proof
   */
  generateSnarkProof(publicInputs: Uint8Array, privateInputs: Uint8Array): Promise<Uint8Array>;

  /**
   * Verify zk-SNARK proof
   */
  verifySnarkProof(publicInputs: Uint8Array, proof: Uint8Array): Promise<boolean>;

  /**
   * Generate zk-STARK proof
   */
  generateStarkProof(publicInputs: Uint8Array, privateInputs: Uint8Array): Promise<Uint8Array>;

  /**
   * Verify zk-STARK proof
   */
  verifyStarkProof(publicInputs: Uint8Array, proof: Uint8Array): Promise<boolean>;
}

/**
 * Multi-signature interface
 */
export interface MultiSignature {
  /**
   * Create multi-signature key pair
   */
  createMultiSigKeyPair(participants: PublicKey[], threshold: number): Promise<KeyPair>;

  /**
   * Create partial signature
   */
  createPartialSignature(keyId: string, data: Uint8Array): Promise<Signature>;

  /**
   * Combine partial signatures
   */
  combineSignatures(partialSignatures: Signature[]): Promise<Signature>;

  /**
   * Verify multi-signature
   */
  verifyMultiSignature(data: Uint8Array, signature: Signature, publicKeys: PublicKey[]): Promise<boolean>;
}

/**
 * Threshold cryptography interface
 */
export interface ThresholdCrypto {
  /**
   * Generate threshold key shares
   */
  generateThresholdShares(totalShares: number, threshold: number): Promise<{
    publicKey: PublicKey;
    shares: Array<{ shareId: number; share: PrivateKey }>;
  }>;

  /**
   * Create threshold signature
   */
  createThresholdSignature(
    shareId: number,
    share: PrivateKey,
    data: Uint8Array,
    participatingShares: number[]
  ): Promise<Signature>;

  /**
   * Combine threshold signatures
   */
  combineThresholdSignatures(signatures: Signature[]): Promise<Signature>;

  /**
   * Verify threshold signature
   */
  verifyThresholdSignature(
    data: Uint8Array,
    signature: Signature,
    publicKey: PublicKey,
    threshold: number
  ): Promise<boolean>;
}

/**
 * Cryptographic utility functions
 */
export const CryptoUtils = {
  /**
   * Compare two cryptographic keys in constant time
   */
  constantTimeCompare(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    return result === 0;
  },

  /**
   * Generate cryptographically secure random bytes
   */
  secureRandomBytes(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
  },

  /**
   * Generate random big integer
   */
  secureRandomBigInt(min: bigint, max: bigint): bigint {
    const range = max - min;
    const bits = range.toString(2).length;
    const bytes = Math.ceil(bits / 8);
    let random;
    
    do {
      random = BigInt('0x' + Array.from(this.secureRandomBytes(bytes))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(''));
    } while (random >= range);
    
    return min + random;
  },

  /**
   * Hash data with specified algorithm
   */
  async hashData(data: Uint8Array, algorithm: HashAlgorithm): Promise<Uint8Array> {
    const dataBuffer = Buffer.from(data);
    
    switch (algorithm) {
      case HashAlgorithm.Blake3:
        // Note: In a real implementation, you'd use a BLAKE3 library
        return crypto.subtle.digest('SHA-256', dataBuffer).then(hash => new Uint8Array(hash));
      
      case HashAlgorithm.Sha3_256:
        return crypto.subtle.digest('SHA-3-256', dataBuffer).then(hash => new Uint8Array(hash));
      
      case HashAlgorithm.Sha3_512:
        return crypto.subtle.digest('SHA-3-512', dataBuffer).then(hash => new Uint8Array(hash));
      
      case HashAlgorithm.Keccak256:
        // Note: In a real implementation, you'd use a Keccak library
        return crypto.subtle.digest('SHA-256', dataBuffer).then(hash => new Uint8Array(hash));
      
      default:
        throw new Error(`Unsupported hash algorithm: ${algorithm}`);
    }
  },

  /**
   * Validate cryptographic key format
   */
  validateKeyFormat(keyType: KeyType, keyData: Uint8Array): boolean {
    switch (keyType) {
      case KeyType.Ed25519:
        return keyData.length === 32;
      
      case KeyType.Dilithium:
        // Dilithium keys are typically 2560 bytes for public, 4032 bytes for private
        return keyData.length === 2560 || keyData.length === 4032;
      
      case KeyType.SphincsPlus:
        // SPHINCS+ keys are typically 64 bytes for public, 128 bytes for private
        return keyData.length === 64 || keyData.length === 128;
      
      case KeyType.Falcon:
        // Falcon keys are typically 1793 bytes for public, 2305 bytes for private
        return keyData.length === 1793 || keyData.length === 2305;
      
      case KeyType.Kyber:
        // Kyber keys are typically 1184 bytes for public, 2400 bytes for private
        return keyData.length === 1184 || keyData.length === 2400;
      
      default:
        return false;
    }
  },

  /**
   * Estimate cryptographic operation time
   */
  estimateOperationTime(operation: CryptoOperation, keyType: KeyType): number {
    const baseTimes = {
      [CryptoOperation.KeyGeneration]: {
        [KeyType.Ed25519]: 1,
        [KeyType.Dilithium]: 10,
        [KeyType.SphincsPlus]: 50,
        [KeyType.Falcon]: 20,
        [KeyType.Kyber]: 15,
      },
      [CryptoOperation.Signing]: {
        [KeyType.Ed25519]: 0.1,
        [KeyType.Dilithium]: 2,
        [KeyType.SphincsPlus]: 20,
        [KeyType.Falcon]: 5,
        [KeyType.Kyber]: 1,
      },
      [CryptoOperation.Verification]: {
        [KeyType.Ed25519]: 0.05,
        [KeyType.Dilithium]: 1,
        [KeyType.SphincsPlus]: 10,
        [KeyType.Falcon]: 2,
        [KeyType.Kyber]: 0.5,
      },
    };

    const operationTimes = baseTimes[operation] || {};
    return (operationTimes[keyType] || 1) * 1000; // Convert to microseconds
  },

  /**
   * Calculate key strength in bits
   */
  calculateKeyStrength(keyType: KeyType): number {
    const strengths = {
      [KeyType.Ed25519]: 128,
      [KeyType.Dilithium]: 256,
      [KeyType.SphincsPlus]: 256,
      [KeyType.Falcon]: 256,
      [KeyType.Kyber]: 256,
    };
    return strengths[keyType] || 0;
  },

  /**
   * Get recommended key type for security level
   */
  getRecommendedKeyType(securityLevel: SecurityLevel): KeyType {
    switch (securityLevel) {
      case SecurityLevel.Basic:
        return KeyType.Ed25519;
      
      case SecurityLevel.Standard:
        return KeyType.Dilithium;
      
      case SecurityLevel.High:
        return KeyType.Falcon;
      
      case SecurityLevel.QuantumResistant:
      case SecurityLevel.Hybrid:
        return KeyType.Dilithium;
      
      default:
        return KeyType.Dilithium;
    }
  },
};

export default QuantumCrypto;
import crypto from 'crypto';
import config from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(config.encryptionKey, 'hex');

/**
 * Encrypts a file buffer using AES-256-GCM
 * @param {Buffer} buffer - File buffer to encrypt
 * @returns {Buffer} Encrypted buffer with IV and auth tag prepended
 * @throws {Error} If encryption fails
 */
export function encryptFile(buffer) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(buffer),
    cipher.final()
  ]);
  
  const authTag = cipher.getAuthTag();
  
  // Return: iv (16) + authTag (16) + encrypted data
  return Buffer.concat([iv, authTag, encrypted]);
}

/**
 * Decrypts a file buffer using AES-256-GCM
 * @param {Buffer} encryptedBuffer - Encrypted buffer with IV and auth tag
 * @returns {Buffer} Decrypted file buffer
 * @throws {Error} If decryption or authentication fails
 */
export function decryptFile(encryptedBuffer) {
  const iv = encryptedBuffer.slice(0, 16);
  const authTag = encryptedBuffer.slice(16, 32);
  const encrypted = encryptedBuffer.slice(32);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
}

/**
 * Generates a secure hash for a filename
 * @param {string} filename - Original filename
 * @returns {string} SHA-256 hash of filename + timestamp
 */
export function hashFilename(filename) {
  return crypto
    .createHash('sha256')
    .update(filename + Date.now())
    .digest('hex');
}
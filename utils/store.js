import fs from 'fs/promises';
import path from 'path';
import { encryptFile, decryptFile, hashFilename } from './encryption.js';

const UPLOAD_DIR = './uploads';

// Ensure upload directory exists
await fs.mkdir(UPLOAD_DIR, { recursive: true });

/**
 * @typedef {Object} FileMetadata
 * @property {string} originalName - Original filename
 * @property {string} hashedName - Hashed filename for storage
 * @property {number} size - File size in bytes
 * @property {string} mimetype - MIME type of the file
 * @property {string} uploadDate - ISO date string of upload
 */

/**
 * @typedef {Object} MulterFile
 * @property {string} fieldname
 * @property {string} originalname
 * @property {string} encoding
 * @property {string} mimetype
 * @property {Buffer} buffer
 * @property {number} size
 */

/**
 * Saves an uploaded file with encryption
 * @param {MulterFile} file - Multer file object
 * @returns {Promise<FileMetadata>} File metadata
 * @throws {Error} If file save fails
 */
export async function saveFile(file) {
  const encryptedData = encryptFile(file.buffer);
  const hashedName = hashFilename(file.originalname);
  const filepath = path.join(UPLOAD_DIR, hashedName);
  
  await fs.writeFile(filepath, encryptedData);
  
  /** @type {FileMetadata} */
  const metadata = {
    originalName: file.originalname,
    hashedName: hashedName,
    size: file.size,
    mimetype: file.mimetype,
    uploadDate: new Date().toISOString()
  };
  
  await fs.writeFile(
    path.join(UPLOAD_DIR, `${hashedName}.meta`),
    JSON.stringify(metadata)
  );
  
  return metadata;
}

/**
 * Retrieves and decrypts a file
 * @param {string} hashedName - Hashed filename
 * @returns {Promise<{data: Buffer, metadata: FileMetadata}>} Decrypted file data and metadata
 * @throws {Error} If file not found or decryption fails
 */
export async function getFile(hashedName) {
  const filepath = path.join(UPLOAD_DIR, hashedName);
  const metapath = path.join(UPLOAD_DIR, `${hashedName}.meta`);
  
  const encryptedData = await fs.readFile(filepath);
  const metadata = JSON.parse(await fs.readFile(metapath, 'utf8'));
  
  const decryptedData = decryptFile(encryptedData);
  
  return { data: decryptedData, metadata };
}

/**
 * Lists all uploaded files
 * @returns {Promise<FileMetadata[]>} Array of file metadata
 * @throws {Error} If directory read fails
 */
export async function listFiles() {
  const files = await fs.readdir(UPLOAD_DIR);
  const metaFiles = files.filter(f => f.endsWith('.meta'));
  
  const fileList = await Promise.all(
    metaFiles.map(async (metaFile) => {
      const content = await fs.readFile(
        path.join(UPLOAD_DIR, metaFile),
        'utf8'
      );
      return JSON.parse(content);
    })
  );
  
  return fileList;
}

/**
 * Deletes a file and its metadata
 * @param {string} hashedName - Hashed filename to delete
 * @returns {Promise<void>}
 * @throws {Error} If file deletion fails
 */
export async function deleteFile(hashedName) {
  const filepath = path.join(UPLOAD_DIR, hashedName);
  const metapath = path.join(UPLOAD_DIR, `${hashedName}.meta`);
  
  await fs.unlink(filepath);
  await fs.unlink(metapath);
}
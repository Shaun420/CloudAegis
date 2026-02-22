/**
 * Shows a status message to the user
 * @param {string} message - Message to display
 * @param {boolean} isError - Whether this is an error message
 */
function showStatus(message, isError = false) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${isError ? 'error' : 'success'}`;
  
  setTimeout(() => {
    statusDiv.className = 'status';
  }, 5000);
}

/**
 * Formats file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Escapes HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
  // File input change handler
  document.getElementById('fileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      document.getElementById('selectedFile').textContent = 
        `Selected: ${file.name} (${formatSize(file.size)})`;
    }
  });

  // Choose file button
  document.getElementById('chooseBtn').addEventListener('click', () => {
    document.getElementById('fileInput').click();
  });

  // Upload button
  document.getElementById('uploadBtn').addEventListener('click', uploadFile);

  // Load initial file list
  loadFiles();
});

/**
 * Uploads a file to the server
 * @returns {Promise<void>}
 */
async function uploadFile() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  
  if (!file) {
    showStatus('Please select a file', true);
    return;
  }
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      showStatus(`File "${result.file.name}" uploaded successfully!`);
      fileInput.value = '';
      document.getElementById('selectedFile').textContent = '';
      loadFiles();
    } else {
      showStatus(result.error || 'Upload failed', true);
    }
  } catch (error) {
    showStatus('Upload failed: ' + error.message, true);
  }
}

/**
 * Loads the list of files from the server
 * @returns {Promise<void>}
 */
async function loadFiles() {
  try {
    const response = await fetch('/api/files');
    
    const result = await response.json();
    
    if (result.success) {
      displayFiles(result.files);
    } else {
      showStatus('Failed to load files', true);
    }
  } catch (error) {
    showStatus('Failed to load files: ' + error.message, true);
  }
}

/**
 * Displays the file list in the UI
 * @param {Array<{id: string, name: string, size: number, uploadDate: string}>} files
 */
function displayFiles(files) {
  const filesList = document.getElementById('filesList');
  
  if (files.length === 0) {
    filesList.innerHTML = '<p class="files-text">No files uploaded yet</p>';
    return;
  }
  
  filesList.innerHTML = files.map(file => `
    <div class="file-item">
      <div class="file-info">
        <div class="file-name">📄 ${escapeHtml(file.name)}</div>
        <div class="file-meta">
          ${formatSize(file.size)} • 
          ${new Date(file.uploadDate).toString()}
        </div>
      </div>
      <div class="file-actions">
        <button class="download-btn" data-file-id="${file.id}" data-file-name="${escapeHtml(file.name)}">
          Download
        </button>
        <button class="delete-btn" data-file-id="${file.id}">
          Delete
        </button>
      </div>
    </div>
  `).join('');
  
  // Attach event listeners using event delegation
  attachFileActionListeners();
}

/**
 * Attaches event listeners to file action buttons using event delegation
 */
function attachFileActionListeners() {
  const filesList = document.getElementById('filesList');
  
  // Remove old listeners by cloning
  const newFilesList = filesList.cloneNode(true);
  filesList.parentNode.replaceChild(newFilesList, filesList);
  
  // Add new listener
  document.getElementById('filesList').addEventListener('click', (e) => {
    const target = e.target;
    
    if (target.classList.contains('download-btn')) {
      const fileId = target.dataset.fileId;
      const fileName = target.dataset.fileName;
      downloadFile(fileId, fileName);
    }
    
    if (target.classList.contains('delete-btn')) {
      const fileId = target.dataset.fileId;
      deleteFile(fileId);
    }
  });
}

/**
 * Downloads a file from the server
 * @param {string} id - File ID
 * @param {string} name - File name
 * @returns {Promise<void>}
 */
async function downloadFile(id, name) {
  try {
    const response = await fetch(`/api/download/${id}`);
    
    if (!response.ok) {
      showStatus('Download failed', true);
      return;
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    showStatus(`Downloaded "${name}"`);
  } catch (error) {
    showStatus('Download failed: ' + error.message, true);
  }
}

/**
 * Deletes a file from the server
 * @param {string} id - File ID
 * @returns {Promise<void>}
 */
async function deleteFile(id) {
  if (!confirm('Are you sure you want to delete this file?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/files/${id}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (result.success) {
      showStatus('File deleted successfully');
      loadFiles();
    } else {
      showStatus('Delete failed', true);
    }
  } catch (error) {
    showStatus('Delete failed: ' + error.message, true);
  }
}
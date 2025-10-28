// Secure Download Page JavaScript

class SecureDownloadManager {
  constructor() {
    this.gameId = null;
    this.participationId = null;
    this.sheetNumber = null;
    this.init();
  }

  async init() {
    // Wait for app authentication to complete
    if (!app.authReady) {
      window.addEventListener('authReady', () => this.checkAuthAndInit());
      
      // Fallback timeout in case event doesn't fire
      setTimeout(() => {
        if (!app.authReady) {
          console.log('⏰ Auth timeout, checking anyway...');
          this.checkAuthAndInit();
        }
      }, 3000);
      return;
    }
    
    this.checkAuthAndInit();
  }
  
  checkAuthAndInit() {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    this.gameId = urlParams.get('game');
    this.participationId = urlParams.get('participation');
    this.sheetNumber = urlParams.get('sheet');

    console.log('🔍 Secure download params:', {
      gameId: this.gameId,
      participationId: this.participationId,
      sheetNumber: this.sheetNumber,
      user: app.user
    });

    // Check if user is logged in
    if (!app.user) {
      console.log('❌ User not logged in');
      this.showLoginRequired();
      return;
    }

    // Validate parameters
    if (!this.gameId || !this.participationId || !this.sheetNumber) {
      console.log('❌ Invalid download parameters');
      this.showError('Invalid download link. Please use the download link from your dashboard.');
      return;
    }

    console.log('✅ User authenticated, loading secure download');
    this.loadSecureDownload();
  }

  showLoginRequired() {
    document.getElementById('loginRequiredScreen').style.display = 'block';
    document.getElementById('secureDownloadContainer').style.display = 'none';
    document.getElementById('errorScreen').style.display = 'none';
  }

  showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorScreen').style.display = 'block';
    document.getElementById('loginRequiredScreen').style.display = 'none';
    document.getElementById('secureDownloadContainer').style.display = 'none';
  }

  showDownload() {
    document.getElementById('secureDownloadContainer').style.display = 'block';
    document.getElementById('loginRequiredScreen').style.display = 'none';
    document.getElementById('errorScreen').style.display = 'none';
  }

  async loadSecureDownload() {
    try {
      // Verify access and get download information
      const response = await app.apiCall(`/games/sheets/secure-download/${this.participationId}/${this.sheetNumber}`);
      
      if (response.success && response.security && response.security.restricted) {
        this.renderSecureDownload(response);
        this.showDownload();
      } else {
        this.showError('This download is not properly secured. Please contact support.');
      }
      
    } catch (error) {
      console.error('Secure download error:', error);
      this.showError(error.message || 'Access denied. You may not have permission to download this sheet.');
    }
  }

  renderSecureDownload(downloadData) {
    const downloadInfo = document.getElementById('downloadInfo');
    
    downloadInfo.innerHTML = `
      <div class="download-card">
        <div class="download-header">
          <h2>📄 ${downloadData.fileName}</h2>
          <div class="download-meta">
            <span class="game-name">Game: ${downloadData.gameName}</span>
            <span class="sheet-number">Sheet #${downloadData.sheetNumber}</span>
          </div>
        </div>

        <div class="download-content">
          <div class="download-status">
            <div class="status-item">
              <span class="status-label">Status:</span>
              <span class="status-value success">✅ Authorized</span>
            </div>
            <div class="status-item">
              <span class="status-label">Your Selected Sheets:</span>
              <span class="status-value">${downloadData.security.authorizedSheets.join(', ')}</span>
            </div>
          </div>

          <div class="download-actions">
            <div class="primary-download">
              <h3>🔒 Secure Download Options:</h3>
              <p class="download-description">Choose your preferred download method:</p>
              
              <div class="download-options">
                <button class="btn btn-primary btn-large" onclick="secureDownloadManager.downloadSecureSheet()">
                  🔐 Download ${downloadData.fileName}
                </button>
                
                <div class="alternative-download">
                  <p class="alt-description">
                    <strong>Alternative:</strong> If the secure download doesn't work, you can access the folder directly, 
                    but <strong>please only download your authorized sheet: ${downloadData.fileName}</strong>
                  </p>
                  <button class="btn btn-secondary" onclick="secureDownloadManager.openFolderWithWarning('${downloadData.downloadOptions.folder}')">
                    📁 Open Folder (Use Responsibly)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="download-warning">
          <h4>⚠️ Important Guidelines:</h4>
          <ul>
            <li>Only download the sheet you've paid for: <strong>${downloadData.fileName}</strong></li>
            <li>Do not download other participants' sheets</li>
            <li>Each sheet can only be downloaded once</li>
            <li>Unauthorized downloads may result in account suspension</li>
          </ul>
        </div>
      </div>
    `;

    // Store download data for later use
    this.downloadData = downloadData;
  }

  async downloadSecureSheet() {
    try {
      app.showNotification('🔐 Initiating secure download...', 'info');
      
      // Try to create a direct download link with enhanced security
      const response = await app.apiCall(`/games/sheets/secure-download/${this.participationId}/${this.sheetNumber}`);
      
      if (response.success) {
        if (response.downloadUrl || response.secureUrl) {
          // Redirect to the secure download URL
          const downloadUrl = response.downloadUrl || response.secureUrl;
          window.location.href = downloadUrl;
          app.showNotification('✅ Redirecting to secure download...', 'success');
        } else {
          // Show controlled folder access with strict warnings
          this.showControlledAccess(response);
        }
      } else {
        app.showNotification('❌ Download authorization failed', 'error');
      }
      
    } catch (error) {
      console.error('Secure download error:', error);
      if (error.message.includes('already been downloaded')) {
        app.showNotification('⚠️ This sheet has already been downloaded. Each sheet can only be downloaded once.', 'warning');
      } else if (error.message.includes('not authorized')) {
        app.showNotification('🚫 Access denied. You can only download sheets you have purchased.', 'error');
      } else {
        app.showNotification('❌ Secure download failed. Please contact support.', 'error');
      }
    }
  }

  showControlledAccess(downloadInfo) {
    const confirmed = confirm(
      `🔐 CONTROLLED ACCESS REQUIRED 🔐\n\n` +
      `Sheet: ${downloadInfo.fileName}\n` +
      `Authorization: ✅ VERIFIED\n\n` +
      `STRICT SECURITY NOTICE:\n` +
      `• You can ONLY download: ${downloadInfo.fileName}\n` +
      `• This download is logged and monitored\n` +
      `• Unauthorized access will result in account suspension\n` +
      `• Each sheet can only be downloaded ONCE\n\n` +
      `Remaining sheets you can download: ${downloadInfo.remainingSheets?.join(', ') || 'None'}\n\n` +
      `Do you understand and agree to these terms?`
    );

    if (confirmed) {
      // Only proceed with controlled access if user explicitly agrees
      this.proceedWithControlledAccess(downloadInfo);
    } else {
      app.showNotification('Download cancelled by user', 'info');
    }
  }

  proceedWithControlledAccess(downloadInfo) {
    // Log the controlled access
    this.logControlledAccess(downloadInfo);
    
    // Show final warning before opening folder
    const finalConfirm = confirm(
      `⚠️ FINAL WARNING ⚠️\n\n` +
      `You are about to access the game folder.\n\n` +
      `REMEMBER: You can ONLY download ${downloadInfo.fileName}\n\n` +
      `Downloading any other file is:\n` +
      `• A violation of terms of service\n` +
      `• Unfair to other participants\n` +
      `• Will result in immediate account suspension\n\n` +
      `Click OK only if you will download ONLY your authorized sheet.`
    );

    if (finalConfirm) {
      // Open with maximum security warnings
      window.open(this.downloadData.downloadOptions.folder, '_blank');
      app.showNotification(`🔐 Folder opened. Download ONLY: ${downloadInfo.fileName}`, 'warning');
    }
  }

  async logControlledAccess(downloadInfo) {
    try {
      await app.apiCall('/games/sheets/log-folder-access', 'POST', {
        participationId: this.participationId,
        sheetNumber: this.sheetNumber,
        gameId: this.gameId,
        fileName: downloadInfo.fileName,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        accessType: 'controlled_folder_access'
      });
    } catch (error) {
      console.error('Failed to log controlled access:', error);
    }
  }

  openFolderWithWarning(folderUrl) {
    const confirmed = confirm(
      `⚠️ SECURITY WARNING ⚠️\n\n` +
      `You are about to access the game sheets folder.\n\n` +
      `IMPORTANT: You are only authorized to download:\n` +
      `"${this.downloadData.fileName}"\n\n` +
      `Downloading other sheets is:\n` +
      `• Against the terms of service\n` +
      `• Unfair to other participants\n` +
      `• May result in account suspension\n\n` +
      `Do you agree to only download your authorized sheet?`
    );

    if (confirmed) {
      window.open(folderUrl, '_blank');
      app.showNotification(`Opening folder. Remember: Only download ${this.downloadData.fileName}`, 'warning');
      
      // Log the folder access for security monitoring
      this.logFolderAccess();
    }
  }

  async logFolderAccess() {
    try {
      await app.apiCall('/games/sheets/log-folder-access', 'POST', {
        participationId: this.participationId,
        sheetNumber: this.sheetNumber,
        gameId: this.gameId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
    } catch (error) {
      console.error('Failed to log folder access:', error);
    }
  }
}

// Initialize secure download manager
const secureDownloadManager = new SecureDownloadManager();
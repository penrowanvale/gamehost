

class DashboardManager {
  constructor() {
    this.participations = [];
    this.notifications = [];
    this.currentFilter = 'all';
    this.init();
  }

  async init() {
    
    if (!app.authReady) {
      window.addEventListener('authReady', () => this.checkAuthAndInit());

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
    
    console.log('🔍 Checking user auth. User:', app.user);
    
    if (!app.user || app.user.role !== 'user') {
      console.log('❌ User access denied. User role:', app.user?.role || 'No user');
      this.showLoginRequired();
      return;
    }

    console.log('✅ User dashboard access granted for:', app.user.username);
    this.showDashboard();
    this.setupEventListeners();
    this.loadDashboardData();
  }

  showLoginRequired() {
    document.getElementById('loginRequiredScreen').style.display = 'block';
    document.getElementById('userDashboard').style.display = 'none';
  }

  showDashboard() {
    document.getElementById('loginRequiredScreen').style.display = 'none';
    document.getElementById('userDashboard').style.display = 'block';

    document.getElementById('userName').textContent = app.user.username;
  }

  setupEventListeners() {
    
    document.getElementById('participationFilter')?.addEventListener('change', (e) => {
      this.currentFilter = e.target.value;
      this.filterParticipations();
    });

    document.addEventListener('click', (e) => {
      if (e.target.closest('.notification-item')) {
        const notificationId = e.target.closest('.notification-item').dataset.notificationId;
        this.markNotificationAsRead(notificationId);
      }
    });
  }

  async loadDashboardData() {
    try {
      
      await this.loadParticipations();
      await this.loadNotifications();
      await this.loadUserStats(); 
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      app.showNotification('Failed to load dashboard data', 'error');
    }
  }

  async loadParticipations() {
    try {
      console.log('📊 DASHBOARD: Loading participations...');
      const response = await app.apiCall('/games/user/participations');
      this.participations = response.participations || [];
      
      console.log('✅ DASHBOARD: Participations loaded:', {
        count: this.participations.length,
        sample: this.participations.slice(0, 2).map(p => ({
          id: p.id,
          gameId: p.games?.id,
          gameName: p.games?.name,
          status: p.payment_status
        }))
      });
      
      this.renderParticipations();
    } catch (error) {
      console.error('❌ Error loading participations:', error);
    }
  }

  async loadNotifications() {
    try {
      const response = await app.apiCall('/users/notifications');
      this.notifications = response.notifications || [];
      this.renderNotifications();
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  async loadUserStats() {
    try {
      console.log('📊 STATS: Loading user statistics...');
      console.log('📊 STATS: Participations data:', this.participations);

      const total = this.participations ? this.participations.length : 0;
      const approved = this.participations ? this.participations.filter(p => p.payment_status === 'approved').length : 0;
      const pending = this.participations ? this.participations.filter(p => p.payment_status === 'pending').length : 0;
      const rejected = this.participations ? this.participations.filter(p => p.payment_status === 'rejected').length : 0;
      
      console.log('📊 STATS: Calculated stats:', { total, approved, pending, rejected });

      const totalEl = document.getElementById('totalParticipations');
      const approvedEl = document.getElementById('approvedParticipations');
      const pendingEl = document.getElementById('pendingParticipations');
      const winsEl = document.getElementById('totalWins');
      
      if (totalEl) totalEl.textContent = total;
      if (approvedEl) approvedEl.textContent = approved;
      if (pendingEl) pendingEl.textContent = pending;
      if (winsEl) winsEl.textContent = approved; 
      
      console.log('✅ STATS: Dashboard stats updated successfully');
      
    } catch (error) {
      console.error('❌ STATS: Error loading user stats:', error);
    }
  }

  renderNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    if (!notificationsList) return;

    const recentNotifications = this.notifications.slice(0, 5);

    if (recentNotifications.length === 0) {
      notificationsList.innerHTML = `
        <div class="no-content">
          <h4>📭 No notifications yet</h4>
          <p>You'll receive notifications when games go live or your payments are approved.</p>
        </div>
      `;
      return;
    }

    notificationsList.innerHTML = recentNotifications.map(notification => `
      <div class="notification-item ${notification.is_read ? '' : 'unread'} ${notification.type === 'game_live' ? 'game-live' : ''}" 
           data-notification-id="${notification.id}">
        <div class="notification-header">
          <div class="notification-title">${notification.title}</div>
          <div class="notification-time">${this.formatTimeAgo(notification.created_at)}</div>
        </div>
        <div class="notification-message">${notification.message}</div>
      </div>
    `).join('');
  }

  renderParticipations() {
    const participationsGrid = document.getElementById('participationsGrid');
    const noParticipations = document.getElementById('noParticipations');

    if (this.participations.length === 0) {
      participationsGrid.innerHTML = '';
      noParticipations.style.display = 'block';
      return;
    }

    noParticipations.style.display = 'none';
    this.filterParticipations();
  }

  filterParticipations() {
    const participationsGrid = document.getElementById('participationsGrid');
    
    let filtered = this.participations;
    if (this.currentFilter !== 'all') {
      filtered = this.participations.filter(p => p.payment_status === this.currentFilter);
    }

    if (filtered.length === 0) {
      participationsGrid.innerHTML = `
        <div class="no-content" style="grid-column: 1 / -1;">
          <h4>No ${this.currentFilter === 'all' ? '' : this.currentFilter} participations found</h4>
          <p>Try changing the filter or join more games!</p>
        </div>
      `;
      return;
    }

    participationsGrid.innerHTML = filtered.map(participation => this.createParticipationCard(participation)).join('');
  }

  createParticipationCard(participation) {
    const game = participation.games;

    console.log('🎮 DASHBOARD DEBUG: Game object for participation:', {
      participationId: participation.id,
      gameObject: game,
      gameId: game?.id,
      gameName: game?.name
    });

    const gameParticipations = this.participations.filter(p => p.games?.id === game.id);
    const hasMultipleParticipations = gameParticipations.length > 1;

    const hasApprovedParticipations = gameParticipations.some(p => p.payment_status === 'approved');
    const hasUndownloadedSheets = gameParticipations.some(p => p.payment_status === 'approved' && !p.sheets_downloaded);
    
    const canDownload = hasApprovedParticipations && hasUndownloadedSheets;
    const canJoinMeeting = participation.payment_status === 'approved' && game.status === 'live' && game.zoom_link;

    return `
      <div class="participation-card ${participation.payment_status}">
        <div class="participation-header">
          <div class="participation-title">${game.name}</div>
          <div class="participation-meta">
            <span>${app.formatDate(game.game_date)}</span>
            <span>${game.game_time ? app.formatTime(game.game_time) : 'TBA'}</span>
          </div>
        </div>
        
        <div class="participation-body">
          <div class="participation-details">
            <div class="detail-item">
              <div class="detail-label">Sheets</div>
              <div class="detail-value">${participation.sheets_selected}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Amount</div>
              <div class="detail-value amount">₹${participation.total_amount.toLocaleString()}</div>
            </div>
          </div>
          
          <div class="participation-status">
            <span class="status-badge status-${participation.payment_status}">
              ${participation.payment_status}
            </span>
          </div>
          
          <div class="participation-actions">
            ${canDownload ? `
              <button class="btn btn-download" onclick="dashboardManager.downloadAllGameSheets('${game.id}')">
                📥 Download ${hasMultipleParticipations ? 'All ' : ''}Sheets
              </button>
            ` : participation.sheets_downloaded ? `
              <button class="btn btn-secondary" disabled>
                ✅ Sheets Downloaded
              </button>
            ` : `
              <button class="btn btn-secondary" disabled>
                ⏳ Awaiting Approval
              </button>
            `}
            
            ${canJoinMeeting ? `
              <button class="btn btn-meeting" onclick="dashboardManager.joinMeeting('${game.zoom_link}')">
                🎥 Join Meeting
              </button>
            ` : ''}
          </div>
          
          <div class="participation-info">
            <small>UTR: ${participation.utr_id}</small><br>
            <small>Registered: ${app.formatDate(participation.created_at)}</small>
          </div>
        </div>
      </div>
    `;
  }

  async downloadAllGameSheets(gameId) {
    try {
      app.showNotification('Preparing your sheet downloads...', 'info');
      
      console.log(`📥 DOWNLOAD: Attempting download for game ${gameId}`);

      const response = await app.apiCall(`/games/${gameId}/download-sheets`);
      
      console.log('📥 DOWNLOAD RESPONSE:', response);
      
      if (response.success && response.sheets && response.sheets.length > 0) {
        console.log(`✅ DOWNLOAD: Found ${response.sheets.length} sheets to download`);
        this.showDownloadModal(response.sheets, response.totalSheets);
      } else if (response.error) {
        
        if (response.code === 'NOT_REGISTERED') {
          app.showNotification('❌ You are not registered for this game. Please register first.', 'error');
        } else if (response.code === 'NOT_APPROVED') {
          app.showNotification('⏳ Your payment is pending approval by the organiser. Please wait.', 'warning');
        } else {
          app.showNotification(response.error, 'error');
        }
      } else {
        app.showNotification('No sheets available for download', 'error');
      }
      
    } catch (error) {
      console.error('Download error:', error);

      const errorDetails = `
ERROR DETAILS:
- Message: ${error.message}
- Status: ${error.status || 'Unknown'}
- Response: ${JSON.stringify(error.response || 'No response')}
      `;
      console.log(errorDetails);
      
      if (error.message.includes('not approved')) {
        app.showNotification('⏳ Your payment is pending organiser approval', 'warning');
      } else if (error.message.includes('not registered')) {
        app.showNotification('❌ Please register for this game first', 'error');
      } else if (error.status === 403) {
        app.showNotification('🚫 Access denied. Check console for details.', 'error');
      } else {
        app.showNotification(error.message || 'Failed to prepare downloads', 'error');
      }
    }
  }

  async downloadSheets(participationId, gameId) {
    try {
      app.showNotification('Preparing your sheet downloads...', 'info');
      
      const response = await app.apiCall(`/games/${gameId}/sheets/${participationId}`);
      
      if (response.sheets && response.sheets.length > 0) {
        this.showDownloadModal(response.sheets, response.totalSheets);
      } else {
        app.showNotification('No sheets available for download', 'error');
      }
      
    } catch (error) {
      app.showNotification(error.message || 'Failed to prepare downloads', 'error');
    }
  }

  showDownloadModal(sheets, totalSheets) {
    const modalBody = document.getElementById('downloadModalBody');
    
    modalBody.innerHTML = `
      <div class="download-summary">
        <p>You have <strong>${totalSheets}</strong> approved sheets ready for secure download.</p>
        <p class="download-warning">🔒 <strong>Security Notice:</strong> Files are streamed directly through our secure servers. Each sheet can only be downloaded ONCE.</p>
        <p class="download-info">📋 <strong>Your Authorized Sheets:</strong> ${sheets.map(s => s.sheetNumber).join(', ')}</p>
      </div>
      
      <div class="download-list">
        ${sheets.map(sheet => `
          <div class="download-item" id="sheet-${sheet.participationId}-${sheet.sheetNumber}">
            <div class="download-item-info">
              <div class="download-item-name">Sheet ${sheet.sheetNumber}</div>
              <div class="download-item-details">${sheet.fileName}</div>
              <div class="download-security">🔐 One-Time Secure Download</div>
            </div>
            <button class="btn-download-sheet" 
                    onclick="dashboardManager.downloadSecureSheet('${sheet.participationId || ''}', '${sheet.sheetNumber}', '${sheet.fileName}')"
                    data-participation="${sheet.participationId}"
                    data-sheet="${sheet.sheetNumber}">
              📥 Download Now
            </button>
          </div>
        `).join('')}
      </div>
      
      <div class="download-actions">
        <button class="btn btn-primary" onclick="dashboardManager.downloadAllSecureSheets(${JSON.stringify(sheets).replace(/"/g, '&quot;')})">
          📥 Download All Sheets (One by One)
        </button>
        <button class="btn btn-secondary" onclick="closeDownloadModal()">
          Close
        </button>
      </div>
      
        <div class="security-notice">
        <h4>🛡️ Maximum Security Features:</h4>
        <ul>
          <li>🔐 <strong>Server-Side Streaming:</strong> Files streamed through our secure servers only</li>
          <li>⚡ <strong>Direct Downloads:</strong> No external links or folder exposure</li>
          <li>🚫 <strong>Zero Google Drive Access:</strong> Users never see or access Google Drive</li>
          <li>📊 <strong>Complete Tracking:</strong> Every download attempt is logged and verified</li>
          <li>✅ <strong>One-Time Security:</strong> Each sheet can only be downloaded once per user</li>
          <li>💰 <strong>Business Protection:</strong> Prevents unauthorized access to other sheets</li>
        </ul>
      </div>
    `;

    document.getElementById('downloadModal').style.display = 'block';
  }

  async downloadSheet(downloadUrl, fileName) {
    try {
      app.showNotification(`Preparing ${fileName} for download...`, 'info');

      const response = await app.apiCall(downloadUrl.replace('/api', ''));
      
      if (response.success && response.downloadOptions) {
        
        if (response.downloadOptions.secure) {
          
          window.open(response.downloadOptions.secure, '_blank');
          app.showNotification(`🔐 Opening secure download page for: ${fileName}`, 'success');
        } else if (response.downloadOptions.direct) {
          
          const link = document.createElement('a');
          link.href = response.downloadOptions.direct;
          link.download = fileName;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          app.showNotification(`📥 Starting download: ${fileName}`, 'success');
        } else if (response.downloadOptions.folder) {
          
          const confirmed = confirm(
            `⚠️ SECURITY NOTICE ⚠️\n\n` +
            `You are about to access the game sheets folder.\n` +
            `Please only download your authorized sheet: ${fileName}\n\n` +
            `Downloading other sheets violates terms of service.\n\n` +
            `Continue?`
          );
          
          if (confirmed) {
            window.open(response.downloadOptions.folder, '_blank');
            app.showNotification(`📁 Opening folder. Only download: ${fileName}`, 'warning');
          }
        } else {
          throw new Error('No download options available');
        }
      } else {
        throw new Error('Download information not available');
      }
      
    } catch (error) {
      console.error('Download error:', error);
      app.showNotification(error.message || 'Download failed', 'error');
    }
  }

  async downloadSecureSheet(participationId, sheetNumber, fileName) {
    try {
      app.showNotification(`🔐 Starting secure download for ${fileName}...`, 'info');
      
      console.log(`🔐 DOWNLOAD: Requesting secure download for sheet ${sheetNumber}, participation ${participationId}`);

      const response = await app.apiCall(`/games/sheets/secure-download/${participationId}/${sheetNumber}`);
      
      if (response.success && response.downloadUrl) {
        console.log(`✅ DOWNLOAD: Authorized for sheet ${sheetNumber}`);

                console.log(`🔐 DOWNLOAD: Using secure server-side proxy`);

                if (response.downloadMethod === 'google_drive_storage') {
                  console.log(`☁️ DOWNLOAD: Using Google Drive storage for ${fileName}`);

                  const tokenResponse = await app.apiCall(response.downloadUrl.replace('/api', ''));
                  
                  if (tokenResponse.success && tokenResponse.downloadUrl) {
                    console.log(`✅ DOWNLOAD: Got Google Drive download URL for ${fileName}`);

                    const link = document.createElement('a');
                    link.href = tokenResponse.downloadUrl;
                    link.download = fileName;
                    link.style.display = 'none';

                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    this.markSheetAsDownloaded(participationId, sheetNumber);

                    app.showNotification(`✅ ${fileName} downloaded from Google Drive (Compressed & Secure)`, 'success');
                  } else {
                    throw new Error('Failed to get Google Drive download token');
                  }
                } else if (response.downloadMethod === 'secure_token') {
                  console.log(`🎫 DOWNLOAD: Using secure token for ${fileName}`);

                  const tokenResponse = await app.apiCall(response.downloadUrl.replace('/api', ''));
                  
                  if (tokenResponse.success && tokenResponse.downloadUrl) {
                    console.log(`✅ DOWNLOAD: Got secure download URL for ${fileName}`);

                    const link = document.createElement('a');
                    link.href = tokenResponse.downloadUrl;
                    link.download = fileName;
                    link.style.display = 'none';

                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    this.markSheetAsDownloaded(participationId, sheetNumber);

                    app.showNotification(`✅ ${fileName} downloaded successfully (Secure)`, 'success');
                  } else {
                    throw new Error('Failed to get secure download token');
                  }
                } else if (response.downloadMethod === 'secure_proxy') {
                  console.log(`✅ DOWNLOAD: Using secure proxy for ${fileName} (NO Google Drive exposure)`);

                  const link = document.createElement('a');
                  link.href = response.downloadUrl;
                  link.download = fileName;
                  link.style.display = 'none';

                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);

                  this.markSheetAsDownloaded(participationId, sheetNumber);

                  app.showNotification(`✅ ${fileName} downloaded securely (No Google Drive exposure)`, 'success');
                } else {
                  
                  const fileResponse = await app.apiCall(response.downloadUrl.replace('/api', ''));

                  if (fileResponse.success && fileResponse.directFileUrl) {
                    console.log(`✅ DOWNLOAD: Got direct file URL for sheet ${sheetNumber}`);

                    const link = document.createElement('a');
                    link.href = fileResponse.directFileUrl;
                    link.download = fileName;
                    link.style.display = 'none';

                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    this.markSheetAsDownloaded(participationId, sheetNumber);

                    app.showNotification(`✅ ${fileName} downloaded successfully`, 'success');
                  } else {
                    throw new Error('Failed to get file access');
                  }
                }
        
      } else {
        throw new Error(response.error || 'Download authorization failed');
      }
      
    } catch (error) {
      console.error('Secure download error:', error);
      
      if (error.message.includes('already been downloaded')) {
        app.showNotification(`⚠️ ${fileName} has already been downloaded`, 'warning');
        this.markSheetAsDownloaded(participationId, sheetNumber);
      } else if (error.message.includes('not authorized')) {
        app.showNotification(`🚫 You are not authorized to download ${fileName}`, 'error');
      } else if (error.message.includes('not configured') || error.message.includes('not available') || error.message.includes('auto-scanning')) {
        app.showNotification(`🔒 Game requires auto-scanning to enable secure downloads`, 'warning');
        this.showAutoScanRequiredNotice();
      } else {
        app.showNotification(`❌ Failed to download ${fileName}: ${error.message}`, 'error');
      }
    }
  }

  showSecureFolderInstructions(folderInfo) {
    const modal = document.createElement('div');
    modal.className = 'secure-download-modal';
    modal.innerHTML = `
      <div class="secure-download-content">
        <h3>⚠️ ${folderInfo.instructions.title}</h3>
        
        <div class="download-warning">
          ${folderInfo.instructions.criticalWarning}
        </div>
        
        <div class="download-steps">
          <h4>STRICT Download Instructions:</h4>
          <ol>
            ${folderInfo.instructions.steps.map(step => `<li>${step}</li>`).join('')}
          </ol>
        </div>
        
        <div class="download-actions">
          <a href="${folderInfo.secureAccess.url}" target="_blank" class="btn btn-primary">
            ⚠️ Open Secure Folder (Use Responsibly)
          </a>
          <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
            I Understand the Rules
          </button>
        </div>
        
        <div class="security-info">
          <small>
            🛡️ This access is tracked and logged for security purposes.<br>
            📋 Authorized file ONLY: <strong>${folderInfo.secureAccess.authorizedFile}</strong><br>
            🚨 Downloading unauthorized files may result in account suspension.
          </small>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);

    setTimeout(() => {
      if (modal.parentElement) {
        modal.remove();
      }
    }, 45000);
  }

  showAutoScanRequiredNotice() {
    const modal = document.createElement('div');
    modal.className = 'secure-download-modal';
    modal.innerHTML = `
      <div class="secure-download-content">
        <h3>🔍 Auto-Scan Required for Secure Downloads</h3>
        
        <div class="download-warning">
          ⚠️ This game needs auto-scanning to enable individual sheet downloads
        </div>
        
        <div class="download-steps">
          <h4>Why auto-scanning is required:</h4>
          <ul>
            <li>🛡️ <strong>Business Protection:</strong> Prevents users from accessing entire folders</li>
            <li>🔐 <strong>Individual File Access:</strong> Each sheet gets its own secure download link</li>
            <li>💰 <strong>Revenue Protection:</strong> Users can only download sheets they paid for</li>
            <li>⚡ <strong>Automatic Setup:</strong> System scans folder and configures individual file access</li>
          </ul>
          
          <div class="organizer-action" style="margin-top: 15px; padding: 15px; background: rgba(255, 193, 7, 0.1); border-radius: 8px; border: 1px solid #ffc107;">
            <h4 style="color: #856404; margin: 0 0 10px 0;">📢 For Game Organizer:</h4>
            <p style="margin: 0; color: #856404;">
              <strong>To enable downloads:</strong> Go to your organizer dashboard → Find this game → Click the <strong>"🔍 Auto-Scan"</strong> button. This will automatically configure secure downloads for all participants.
            </p>
          </div>
        </div>
        
        <div class="download-actions">
          <button class="btn btn-primary" onclick="this.parentElement.parentElement.parentElement.remove()">
            I Understand
          </button>
        </div>
        
        <div class="security-info">
          <small>
            🛡️ Auto-scanning protects your business from revenue losses.<br>
            📋 Contact the game organizer to enable auto-scanning for this game.
          </small>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);

    setTimeout(() => {
      if (modal.parentElement) {
        modal.remove();
      }
    }, 20000);
  }

  showSecurityConfigurationNotice() {
    const modal = document.createElement('div');
    modal.className = 'secure-download-modal';
    modal.innerHTML = `
      <div class="secure-download-content">
        <h3>🔒 Secure Downloads Not Yet Configured</h3>
        
        <div class="download-warning">
          ⚠️ This game is not yet configured for secure individual sheet downloads
        </div>
        
        <div class="download-steps">
          <h4>Why downloads are temporarily unavailable:</h4>
          <ul>
            <li>🛡️ <strong>Maximum Security:</strong> Files are streamed through our secure servers only</li>
            <li>💰 <strong>Business Protection:</strong> No Google Drive exposure prevents unauthorized access</li>
            <li>🔐 <strong>Individual File Streaming:</strong> Each sheet is served individually with full authorization</li>
            <li>⚡ <strong>Setup Required:</strong> Organizer must configure individual file access</li>
          </ul>
        </div>
        
        <div class="download-actions">
          <button class="btn btn-primary" onclick="this.parentElement.parentElement.parentElement.remove()">
            I Understand
          </button>
        </div>
        
        <div class="security-info">
          <small>
            🛡️ This security measure protects both users and the business.<br>
            📋 Contact the game organizer if you need immediate access to your sheets.
          </small>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);

    setTimeout(() => {
      if (modal.parentElement) {
        modal.remove();
      }
    }, 20000);
  }

  markSheetAsDownloaded(participationId, sheetNumber) {
    
    const downloadButtons = document.querySelectorAll(`[onclick*="${participationId}"][onclick*="${sheetNumber}"]`);
    downloadButtons.forEach(button => {
      button.textContent = '✅ Downloaded';
      button.disabled = true;
      button.classList.add('downloaded');
    });
  }

  async downloadAllSecureSheets(sheets) {
    try {
      app.showNotification('🔐 Starting secure download of all sheets...', 'info');

      for (let i = 0; i < sheets.length; i++) {
        setTimeout(() => {
          this.downloadSecureSheet(sheets[i].participationId || '', sheets[i].sheetNumber, sheets[i].fileName);
        }, i * 2000); 
      }

      setTimeout(() => {
        this.closeDownloadModal();
      }, 3000);
      
    } catch (error) {
      app.showNotification('Failed to download all sheets securely', 'error');
    }
  }

  async downloadAllSheets(sheets) {
    try {
      app.showNotification('Starting download of all sheets...', 'info');

      for (let i = 0; i < sheets.length; i++) {
        setTimeout(() => {
          this.downloadSheet(sheets[i].downloadUrl, sheets[i].fileName);
        }, i * 1000); 
      }

      setTimeout(() => {
        this.closeDownloadModal();
      }, 2000);
      
    } catch (error) {
      app.showNotification('Failed to download all sheets', 'error');
    }
  }

  joinMeeting(meetingLink) {
    if (meetingLink) {
      window.open(meetingLink, '_blank');
      app.showNotification('Opening meeting...', 'success');
    }
  }

  async markNotificationAsRead(notificationId) {
    try {
      await app.apiCall(`/users/notifications/${notificationId}/read`, 'PUT');

      const notificationElement = document.querySelector(`[data-notification-id="${notificationId}"]`);
      if (notificationElement) {
        notificationElement.classList.remove('unread');
      }
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  closeDownloadModal() {
    document.getElementById('downloadModal').style.display = 'none';
  }

  formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }
}

function closeDownloadModal() {
  dashboardManager.closeDownloadModal();
}

window.onclick = function(event) {
  const modal = document.getElementById('downloadModal');
  if (event.target === modal) {
    closeDownloadModal();
  }
}

const dashboardManager = new DashboardManager();
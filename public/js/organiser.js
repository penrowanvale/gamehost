// Organiser Dashboard JavaScript

class OrganiserManager {
  constructor() {
    this.currentSection = 'dashboard';
    this.organiserData = null;
    this.games = [];
    this.participants = [];
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
    // Hide loading screen
    document.getElementById('authLoadingScreen').style.display = 'none';
    
    // Check if user is logged in and is an organiser
    console.log('🔍 Checking organiser auth. User:', app.user);
    
    if (!app.user || (app.user.role !== 'organiser' && app.user.role !== 'admin')) {
      console.log('❌ Access denied. User role:', app.user?.role || 'No user');
      this.showLoginRequired();
      return;
    }

    console.log('✅ Organiser access granted for:', app.user.username);
    this.showDashboard();
    this.setupEventListeners();
    this.loadOrganiserData();
    this.loadDashboardData();
  }

  showLoginRequired() {
    document.getElementById('authLoadingScreen').style.display = 'none';
    document.getElementById('loginRequiredScreen').style.display = 'block';
    document.getElementById('organiserDashboard').style.display = 'none';
  }

  showDashboard() {
    document.getElementById('authLoadingScreen').style.display = 'none';
    document.getElementById('loginRequiredScreen').style.display = 'none';
    document.getElementById('organiserDashboard').style.display = 'flex';
  }

  setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = e.currentTarget.dataset.section;
        this.switchSection(section);
      });
    });

    // Sidebar toggle for mobile
    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
      this.toggleSidebar();
    });

    // Mobile sidebar toggle
    document.getElementById('mobileSidebarToggle')?.addEventListener('click', () => {
      this.toggleSidebar();
    });

    // Sidebar backdrop
    document.getElementById('sidebarBackdrop')?.addEventListener('click', () => {
      this.closeSidebar();
    });

    // Close sidebar with ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeSidebar();
      }
    });

    // Header button to open/close sidebar on mobile
    document.getElementById('organiserSidebarOpen')?.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });

    // Profile form
    document.getElementById('profileForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.updateProfile();
    });

    // Create game form
    document.getElementById('createGameForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.createGame();
    });

    // Game status filter
    document.getElementById('gameStatusFilter')?.addEventListener('change', (e) => {
      this.filterGames(e.target.value);
    });

    // Participant filters
    document.getElementById('participantGameFilter')?.addEventListener('change', () => {
      this.filterParticipants();
    });

    document.getElementById('participantStatusFilter')?.addEventListener('change', () => {
      this.filterParticipants();
    });

    // End game form
    document.getElementById('endGameForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.endGame();
    });

    // Set minimum date for game creation and ensure Chrome compatibility
    const gameDate = document.getElementById('gameDate');
    const gameTime = document.getElementById('gameTime');
    
    if (gameDate) {
      const today = new Date().toISOString().split('T')[0];
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 1);
      const maxDateStr = maxDate.toISOString().split('T')[0];
      
      gameDate.min = today;
      gameDate.max = maxDateStr;
      
      // Force Chrome to recognize the input properly
      gameDate.setAttribute('type', 'date');
      gameDate.style.colorScheme = 'light dark';
      gameDate.style.fontSize = '16px'; // Prevents zoom on iOS
      
      // Add click handler for Chrome compatibility
      gameDate.addEventListener('click', function() {
        this.showPicker && this.showPicker();
      });
      
      console.log('📅 DATE PICKER: Initialized for Chrome compatibility');
    }
    
    if (gameTime) {
      // Force Chrome to recognize the time input properly
      gameTime.setAttribute('type', 'time');
      gameTime.style.colorScheme = 'light dark';
      gameTime.style.fontSize = '16px'; // Prevents zoom on iOS
      
      // Add click handler for Chrome compatibility
      gameTime.addEventListener('click', function() {
        this.showPicker && this.showPicker();
      });
      
      // Set default time to current time + 1 hour
      const now = new Date();
      now.setHours(now.getHours() + 1);
      const defaultTime = now.toTimeString().slice(0, 5);
      gameTime.value = defaultTime;
      
      console.log('🕐 TIME PICKER: Initialized for Chrome compatibility');
    }

    // Google Drive folder validation
    document.getElementById('sheetsFolder')?.addEventListener('blur', (e) => {
      this.validateGoogleDriveFolder(e.target.value);
    });

    // Show test button when folder URL is entered
    document.getElementById('sheetsFolder')?.addEventListener('input', (e) => {
      const testBtn = document.getElementById('testScanBtn');
      if (testBtn) {
        if (e.target.value.trim()) {
          testBtn.style.display = 'inline-block';
        } else {
          testBtn.style.display = 'none';
        }
      }
    });

    // Test scan button
    document.getElementById('testScanBtn')?.addEventListener('click', () => {
      const folderUrl = document.getElementById('sheetsFolder')?.value;
      if (folderUrl) {
        this.validateGoogleDriveFolder(folderUrl);
      }
    });

    // Sheet format change handler
    document.getElementById('sheetFileFormat')?.addEventListener('change', (e) => {
      const customGroup = document.getElementById('customFormatGroup');
      if (customGroup) {
        if (e.target.value === 'custom') {
          customGroup.style.display = 'block';
        } else {
          customGroup.style.display = 'none';
        }
      }
      this.updateSheetsPreview();
    });

    // Custom format input
    document.getElementById('customFormat')?.addEventListener('input', () => {
      this.updateSheetsPreview();
    });

    // Total sheets change
    document.getElementById('totalSheets')?.addEventListener('input', () => {
      this.updateSheetsPreview();
    });

    // Validate sheets button
    document.getElementById('validateSheetsBtn')?.addEventListener('click', () => {
      this.validateSheetsAccess();
    });
  }

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    
    sidebar.classList.toggle('open');
    
    if (sidebar.classList.contains('open')) {
      backdrop.classList.add('active');
    } else {
      backdrop.classList.remove('active');
    }
  }

  closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    
    sidebar.classList.remove('open');
    backdrop.classList.remove('active');
  }

  switchSection(section) {
    this.currentSection = section;
    
    // Close sidebar on mobile when switching sections
    if (window.innerWidth <= 1024) {
      this.closeSidebar();
    }

    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`).classList.add('active');

    // Show section
    document.querySelectorAll('.content-section').forEach(sec => {
      sec.classList.remove('active');
    });
    document.getElementById(`${section}-section`).classList.add('active');

    // Load section data
    this.loadSectionData(section);
    
    // Initialize image upload widgets when switching to create-game section
    if (section === 'create-game') {
      setTimeout(() => this.initializeImagePreviews(), 100);
    }
  }

  initializeImagePreviews() {
    // Image previews are now handled by the new drag & drop upload system
    // This function is kept for compatibility but functionality moved to upload interface
    console.log('📤 New upload system initialized - use "Upload to Drive" button for images');
  }

  async loadSectionData(section) {
    switch (section) {
      case 'dashboard':
        await this.loadDashboardData();
        break;
      case 'profile':
        await this.loadProfileData();
        break;
      case 'active-games':
        await this.loadActiveGames();
        break;
      case 'participants':
        await this.loadParticipants();
        break;
      case 'history':
        await this.loadHistory();
        break;
    }
  }

  async loadOrganiserData() {
    try {
      console.log('🏢 Loading organiser data...');
      console.log('🔑 Current user:', app.user);
      console.log('🎫 Current token:', app.token ? 'Present' : 'Missing');
      
      const response = await app.apiCall('/organiser/profile');
      console.log('📊 Organiser data response:', response);
      
      this.organiserData = response.organiser;
      console.log('✅ Organiser data loaded:', this.organiserData?.organiser_name);
    } catch (error) {
      console.error('💥 Error loading organiser data:', error);
      console.error('💥 Error details:', error.message, error.status);
      app.showNotification('Failed to load organiser data: ' + (error.message || 'Unknown error'), 'error');
    }
  }

  async loadDashboardData() {
    try {
      console.log('📊 Loading dashboard data...');
      const [statsResponse, gamesResponse] = await Promise.all([
        app.apiCall('/organiser/stats'),
        app.apiCall('/organiser/games?status=upcoming')
      ]);

      // Update stats
      document.getElementById('totalGamesCreated').textContent = statsResponse.totalGames || 0;
      document.getElementById('activeGamesCount').textContent = gamesResponse.games?.length || 0;
      document.getElementById('totalRevenue').textContent = `₹${(statsResponse.totalRevenue || 0).toLocaleString()}`;
      document.getElementById('totalProfit').textContent = `₹${(statsResponse.totalProfit || 0).toLocaleString()}`;

      // Load recent games widget
      this.loadRecentGamesWidget(gamesResponse.games?.slice(0, 5) || []);

      // Load pending verifications
      await this.loadPendingVerifications();

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  loadRecentGamesWidget(games) {
    const widget = document.getElementById('recentGamesWidget');
    if (!widget) return;

    if (games.length === 0) {
      widget.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No recent games</p>';
      return;
    }

    widget.innerHTML = games.map(game => `
      <div style="padding: 10px 0; border-bottom: 1px solid rgba(255, 107, 53, 0.1);">
        <div style="font-weight: 600; color: var(--text-light); margin-bottom: 5px;">${game.name}</div>
        <div style="font-size: 0.9rem; color: var(--text-muted);">
          ${app.formatDate(game.game_date)} • ₹${game.total_prize.toLocaleString()}
        </div>
      </div>
    `).join('');
  }

  async loadPendingVerifications() {
    try {
      console.log('🔍 ORGANISER DEBUG: Loading pending verifications...');
      const response = await app.apiCall('/organiser/games');
      const allGames = response.games || [];
      
      console.log(`📊 ORGANISER DEBUG: Found ${allGames.length} games`);
      
      // Get participants for all games
      let allPendingParticipants = [];
      const widget = document.getElementById('pendingVerificationsWidget');
      
      for (const game of allGames.slice(0, 5)) { // Show more games
        try {
          console.log(`🎮 ORGANISER DEBUG: Loading participants for game ${game.id} (${game.name})`);
          const participantsResponse = await app.apiCall(`/organiser/games/${game.id}/participants`);
          const allParticipants = participantsResponse.participants || [];
          const pending = allParticipants.filter(p => p.payment_status === 'pending');
          
          console.log(`👥 ORGANISER DEBUG: Game ${game.name} - ${allParticipants.length} total participants, ${pending.length} pending`);
          
          // Add game info to each participant
          pending.forEach(participant => {
            participant.gameName = game.name;
            participant.gameId = game.id;
          });
          
          allPendingParticipants.push(...pending);
        } catch (error) {
          console.error('❌ Error loading participants for game:', game.id, error);
        }
      }
      
      console.log(`✅ ORGANISER DEBUG: Total pending participants: ${allPendingParticipants.length}`);

      if (widget) {
        if (allPendingParticipants.length === 0) {
          widget.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No pending verifications</p>';
        } else {
          // Show detailed list with approve/deny buttons
          widget.innerHTML = `
            <div class="pending-verifications-list">
              ${allPendingParticipants.slice(0, 5).map(participant => `
                <div class="pending-verification-item">
                  <div class="participant-info">
                    <div class="participant-name">${participant.users?.username || 'Unknown User'}</div>
                    <div class="participant-game">${participant.gameName}</div>
                    <div class="participant-details">
                      <span>Entry Fee: ₹${participant.entry_fee}</span>
                      <span>Sheets: ${participant.selected_sheet_numbers?.join(', ') || 'None'}</span>
                    </div>
                  </div>
                  <div class="verification-actions">
                    <button class="btn btn-success btn-sm" onclick="organiserManager.approveParticipant('${participant.id}')">
                      ✓ Approve
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="organiserManager.denyParticipant('${participant.id}')">
                      ✗ Deny
                    </button>
                  </div>
                </div>
              `).join('')}
              ${allPendingParticipants.length > 5 ? `
                <div class="pending-more">
                  <a href="#" onclick="organiserManager.switchSection('participants')" class="btn btn-secondary btn-sm">
                    View All ${allPendingParticipants.length} Pending
                  </a>
                </div>
              ` : ''}
            </div>
          `;
        }
      }
    } catch (error) {
      console.error('Error loading pending verifications:', error);
    }
  }

  async loadProfileData() {
    if (!this.organiserData) return;

    // Fill form with current data
    document.getElementById('realName').value = this.organiserData.real_name || '';
    document.getElementById('personalPhone').value = this.organiserData.personal_phone || '';
    document.getElementById('email').value = this.organiserData.users?.email || '';
    document.getElementById('username').value = this.organiserData.users?.username || '';
    document.getElementById('organiserName').value = this.organiserData.organiser_name || '';
    document.getElementById('whatsappNumber').value = this.organiserData.whatsapp_number || '';
  }

  async updateProfile() {
    try {
      const formData = new FormData(document.getElementById('profileForm'));
      const data = {
        organiserName: formData.get('organiserName'),
        whatsappNumber: formData.get('whatsappNumber')
      };

      const response = await app.apiCall('/organiser/profile', 'PUT', data);
      app.showNotification('Profile updated successfully', 'success');
      
      // Reload organiser data
      await this.loadOrganiserData();
      
    } catch (error) {
      app.showNotification(error.message || 'Failed to update profile', 'error');
    }
  }

  async createGame() {
    try {
      const formData = new FormData(document.getElementById('createGameForm'));
      
      // Validate required fields
      const gameName = formData.get('gameName');
      const totalPrize = formData.get('totalPrize');
      const pricePerSheet1 = formData.get('pricePerSheet1');
      const pricePerSheet2 = formData.get('pricePerSheet2');
      const pricePerSheet3Plus = formData.get('pricePerSheet3Plus');
      const gameDate = formData.get('gameDate');
      const gameTime = formData.get('gameTime');
      
      // Validate inputs
      if (!gameName || !gameName.trim()) {
        app.showNotification('Game name is required', 'error');
        return;
      }
      
      // Validate numeric inputs
      const totalPrizeNum = parseFloat(totalPrize);
      const priceSheet1Num = parseFloat(pricePerSheet1);
      const priceSheet2Num = parseFloat(pricePerSheet2);
      const priceSheet3Num = parseFloat(pricePerSheet3Plus);
      
      if (isNaN(totalPrizeNum) || totalPrizeNum <= 0) {
        app.showNotification('Please enter a valid total prize amount', 'error');
        return;
      }
      
      if (isNaN(priceSheet1Num) || priceSheet1Num <= 0) {
        app.showNotification('Please enter a valid price for 1 sheet', 'error');
        return;
      }
      
      if (isNaN(priceSheet2Num) || priceSheet2Num <= 0) {
        app.showNotification('Please enter a valid price for 2 sheets', 'error');
        return;
      }
      
      if (isNaN(priceSheet3Num) || priceSheet3Num <= 0) {
        app.showNotification('Please enter a valid price for 3+ sheets', 'error');
        return;
      }
      
      // Validate date and time
      if (!gameDate) {
        app.showNotification('Game date is required', 'error');
        return;
      }
      
      if (!gameTime) {
        app.showNotification('Game time is required', 'error');
        return;
      }
      
      // Validate date is not in the past
      const selectedDate = new Date(`${gameDate}T${gameTime}`);
      const now = new Date();
      if (selectedDate < now) {
        app.showNotification('Game date and time cannot be in the past', 'error');
        return;
      }
      
      // Extract Google Drive folder ID from URL
      const sheetsFolder = formData.get('sheetsFolder');
      let sheetsFolderId = null;
      
      if (sheetsFolder && sheetsFolder !== 'upload_after_creation') {
        sheetsFolderId = sheetsFolder;
      }

      // Get auto-scanned sheets data
      const autoScannedSheets = formData.get('autoScannedSheets');
      let individualSheetFiles = {};
      
      if (autoScannedSheets) {
        try {
          const scannedData = JSON.parse(autoScannedSheets);
          // Convert scanned data to individual_sheet_files format
          Object.entries(scannedData).forEach(([sheetNumber, fileInfo]) => {
            individualSheetFiles[sheetNumber] = fileInfo.fileId;
          });
          console.log(`🔍 GAME CREATION: Using auto-scanned data for ${Object.keys(individualSheetFiles).length} sheets`);
        } catch (error) {
          console.error('❌ Error parsing auto-scanned data:', error);
        }
      }

      const data = {
        name: gameName.trim(),
        bannerImageUrl: formData.get('bannerImageUrl') === 'upload_after_creation' ? null : formData.get('bannerImageUrl'),
        totalPrize: totalPrizeNum,
        pricePerSheet1: priceSheet1Num,
        pricePerSheet2: priceSheet2Num,
        pricePerSheet3Plus: priceSheet3Num,
        paymentQrCodeUrl: formData.get('paymentQrCodeUrl') === 'upload_after_creation' ? null : formData.get('paymentQrCodeUrl'),
        zoomLink: formData.get('zoomLink') || null,
        zoomPassword: formData.get('zoomPassword') || null,
        gameDate: gameDate,
        gameTime: gameTime,
        sheetsFolder: sheetsFolderId,
        totalSheets: parseInt(formData.get('totalSheets')) || 0,
        sheetFileFormat: formData.get('sheetFileFormat') || 'Sheet_{number}.pdf',
        customFormat: formData.get('customFormat') || null,
        individualSheetFiles: individualSheetFiles, // Auto-scanned individual file IDs
        autoScanned: Object.keys(individualSheetFiles).length > 0,
        uploadMethod: 'new_drag_drop_system' // Flag to indicate new upload system
      };

      const response = await app.apiCall('/organiser/games', 'POST', data);
      app.showNotification('Game created successfully', 'success');
      
      // Reset form and switch to active games
      document.getElementById('createGameForm').reset();
      
      // Safely hide elements that might exist
      const sheetsPreview = document.getElementById('sheetsPreview');
      if (sheetsPreview) sheetsPreview.style.display = 'none';
      
      const folderValidation = document.getElementById('folderValidation');
      if (folderValidation) folderValidation.style.display = 'none';
      
      const autoScanSection = document.getElementById('autoScanSection');
      if (autoScanSection) autoScanSection.style.display = 'none';
      
      this.switchSection('active-games');
      
    } catch (error) {
      app.showNotification(error.message || 'Failed to create game', 'error');
    }
  }

  async loadActiveGames() {
    try {
      const response = await app.apiCall('/organiser/games');
      this.games = response.games || [];
      this.renderActiveGames(this.games);
      
      // Populate game filter for participants
      this.populateGameFilter();
      
    } catch (error) {
      console.error('Error loading active games:', error);
      app.showNotification('Failed to load games', 'error');
    }
  }

  renderActiveGames(games) {
    const grid = document.getElementById('activeGamesGrid');
    if (!grid) return;

    if (games.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: var(--text-muted);">
          <h3>No games created yet</h3>
          <p>Create your first game to get started!</p>
          <button class="btn btn-primary" onclick="organiserManager.switchSection('create-game')">
            Create Game
          </button>
        </div>
      `;
      return;
    }

    grid.innerHTML = games.map(game => `
      <div class="game-card">
        <div class="game-card-header">
          <div class="game-card-title">${game.name}</div>
          <div class="game-card-meta">
            <span>${app.formatDate(game.game_date)}</span>
            <span class="status-badge status-${game.status}">${game.status}</span>
          </div>
        </div>
        <div class="game-card-body">
          <div class="game-card-stats">
            <div class="game-stat">
              <div class="game-stat-value">₹${game.total_prize.toLocaleString()}</div>
              <div class="game-stat-label">Prize Pool</div>
            </div>
            <div class="game-stat">
              <div class="game-stat-value">${game.registered_participants || 0}</div>
              <div class="game-stat-label">Participants</div>
            </div>
          </div>
          <div class="game-card-actions">
            <button class="btn btn-secondary btn-sm" onclick="organiserManager.editGame('${game.id}')">
              Edit
            </button>
            <button class="btn btn-primary btn-sm" onclick="organiserManager.viewParticipants('${game.id}')">
              Participants
            </button>
            ${this.needsAutoScan(game) ? `
              <button class="btn btn-warning btn-sm" onclick="organiserManager.runAutoScan('${game.id}')" title="Enable secure downloads">
                🔍 Auto-Scan
              </button>
            ` : ''}
            <button class="btn btn-success btn-sm" onclick="organiserManager.uploadToDrive('${game.id}')" title="Upload files to Google Drive with compression">
              ☁️ Upload to Drive
            </button>
            ${game.status === 'upcoming' ? `
              <button class="btn btn-success btn-sm" onclick="organiserManager.startGame('${game.id}')">
                Start Game
              </button>
              <button class="btn btn-danger btn-sm" onclick="organiserManager.showEndGameModal('${game.id}')">
                End Game
              </button>
            ` : ''}
            ${game.status === 'live' ? `
              <button class="btn btn-danger btn-sm" onclick="organiserManager.showEndGameModal('${game.id}')">
                End Game
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  // Check if a game needs auto-scanning for secure downloads
  needsAutoScan(game) {
    // Game needs auto-scan if:
    // 1. It has a sheets folder but no individual_sheet_files configured
    // 2. Or individual_sheet_files is empty
    const hasFolder = game.sheets_folder_id;
    const hasIndividualFiles = game.individual_sheet_files && Object.keys(game.individual_sheet_files).length > 0;
    
    // Show auto-scan button for any game that has a folder but no individual files
    return hasFolder && !hasIndividualFiles;
  }

  // Run auto-scan for a specific game
  async runAutoScan(gameId) {
    try {
      const game = this.games.find(g => g.id === gameId);
      if (!game) {
        app.showNotification('Game not found', 'error');
        return;
      }

      app.showNotification(`🔍 Starting auto-scan for ${game.name}...`, 'info');
      
      console.log(`🔍 AUTO-SCAN: Starting scan for game ${gameId}`);

      const response = await app.apiCall(`/organiser/games/${gameId}/auto-scan-sheets`, 'POST');
      
      if (response.success) {
        app.showNotification(`✅ Auto-scan completed for ${game.name}! Secure downloads enabled.`, 'success');
        
        // Update the game in our local data
        const gameIndex = this.games.findIndex(g => g.id === gameId);
        if (gameIndex !== -1) {
          this.games[gameIndex].individual_sheet_files = response.individualSheetFiles || {};
        }
        
        // Re-render the games to hide the auto-scan button
        this.renderActiveGames(this.games);
        
        console.log(`✅ AUTO-SCAN: Completed for game ${game.name}, configured ${response.configuredSheets?.length || 0} sheets`);
      } else if (response.solution === 'Configure individual file IDs manually') {
        // Show manual configuration instructions
        this.showManualConfigInstructions(gameId, game.name, response);
      } else {
        throw new Error(response.error || 'Auto-scan failed');
      }
      
    } catch (error) {
      console.error('💥 AUTO-SCAN ERROR:', error);
      app.showNotification(`❌ Auto-scan failed: ${error.message}`, 'error');
    }
  }

  // Show manual configuration instructions
  showManualConfigInstructions(gameId, gameName, response) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <h3>🔧 Manual Configuration Required</h3>
        <p><strong>Game:</strong> ${gameName}</p>
        
        <div class="config-instructions" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 15px 0;">
          <h4>📋 How to get real Google Drive file IDs:</h4>
          <ol style="margin: 10px 0; padding-left: 20px;">
            <li><strong>Open your Google Drive folder</strong></li>
            <li><strong>For each sheet file:</strong> Right-click → Share → Copy link</li>
            <li><strong>Extract file ID from URL:</strong><br>
                From: <code>https://drive.google.com/file/d/<span style="background: yellow;">1ABC123xyz</span>/view</code><br>
                File ID is: <code>1ABC123xyz</code>
            </li>
            <li><strong>Use manual configuration</strong> to set the file IDs</li>
          </ol>
        </div>
        
        <div class="config-warning" style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h4 style="color: #856404; margin: 0 0 10px 0;">⚠️ Important:</h4>
          <p style="margin: 0; color: #856404;">
            Each file must be individually shared with "Anyone with the link can view" permissions.
            Folder sharing alone is not enough for individual file downloads.
          </p>
        </div>
        
        <div class="modal-actions">
          <button class="btn btn-primary" onclick="this.parentElement.parentElement.parentElement.remove()">
            I Understand
          </button>
          <button class="btn btn-secondary" onclick="organiserManager.openManualConfig('${gameId}')">
            Configure File IDs
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    app.showNotification(`⚠️ ${gameName} requires manual file ID configuration`, 'warning');
  }

  // Open manual configuration (placeholder for now)
  openManualConfig(gameId) {
    app.showNotification('Manual configuration interface coming soon. For now, contact support with your file IDs.', 'info');
    // Remove the modal
    document.querySelector('.modal-overlay')?.remove();
  }

  // Upload to Google Drive with compression
  uploadToDrive(gameId) {
    const game = this.games.find(g => g.id === gameId);
    if (!game) {
      app.showNotification('Game not found', 'error');
      return;
    }

    // Redirect to Google Drive upload page
    window.location.href = `/upload-to-drive.html?gameId=${gameId}`;
  }

  // Show link configuration modal
  showLinkConfigurationModal(gameId, gameName) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 700px;">
        <h3>🔗 Configure Sheet Download Links</h3>
        <p><strong>Game:</strong> ${gameName}</p>
        
        <div class="config-instructions" style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 15px 0;">
          <h4>📋 Simple Setup (No file storage costs):</h4>
          <ol style="margin: 10px 0; padding-left: 20px;">
            <li><strong>For each sheet in Google Drive:</strong> Right-click → Share → Copy link</li>
            <li><strong>Make sure each file is shared:</strong> "Anyone with the link can view"</li>
            <li><strong>Paste the links below</strong> (one per sheet)</li>
          </ol>
        </div>
        
        <div class="link-input-area" style="max-height: 300px; overflow-y: auto;">
          <h4>🔗 Sheet Links:</h4>
          <div id="linkInputs">
            <div class="link-input-row" style="margin: 10px 0; display: flex; gap: 10px; align-items: center;">
              <span style="width: 80px;">Sheet 1:</span>
              <input type="url" placeholder="https://drive.google.com/file/d/1ABC123.../view" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="organiserManager.addMoreLinkInputs()" style="margin: 10px 0;">
            + Add More Sheets
          </button>
        </div>
        
        <div class="modal-actions" style="margin-top: 20px;">
          <button class="btn btn-primary" onclick="organiserManager.saveLinkConfiguration('${gameId}')">
            💾 Save Configuration
          </button>
          <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
            Cancel
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  // Add more link input rows
  addMoreLinkInputs() {
    const linkInputs = document.getElementById('linkInputs');
    const currentCount = linkInputs.children.length;
    const newSheetNumber = currentCount + 1;
    
    const newRow = document.createElement('div');
    newRow.className = 'link-input-row';
    newRow.style.cssText = 'margin: 10px 0; display: flex; gap: 10px; align-items: center;';
    newRow.innerHTML = `
      <span style="width: 80px;">Sheet ${newSheetNumber}:</span>
      <input type="url" placeholder="https://drive.google.com/file/d/1ABC123.../view" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
    `;
    
    linkInputs.appendChild(newRow);
  }

  // Save link configuration
  async saveLinkConfiguration(gameId) {
    try {
      const linkInputs = document.querySelectorAll('#linkInputs input[type="url"]');
      const sheetLinks = [];
      
      linkInputs.forEach((input, index) => {
        if (input.value.trim()) {
          sheetLinks.push({
            sheetNumber: index + 1,
            googleDriveUrl: input.value.trim()
          });
        }
      });
      
      if (sheetLinks.length === 0) {
        app.showNotification('Please provide at least one sheet link', 'warning');
        return;
      }
      
      app.showNotification(`🔗 Configuring ${sheetLinks.length} sheet links...`, 'info');
      
      const response = await app.apiCall(`/organiser/games/${gameId}/configure-links`, 'POST', {
        sheetLinks: sheetLinks
      });
      
      if (response.success) {
        app.showNotification(`✅ Successfully configured ${response.totalSheets} sheet links!`, 'success');
        
        // Update the game in our local data
        const gameIndex = this.games.findIndex(g => g.id === gameId);
        if (gameIndex !== -1) {
          this.games[gameIndex].individual_sheet_files = response.sheetFiles || {};
        }
        
        // Re-render games and close modal
        this.renderActiveGames(this.games);
        document.querySelector('.modal-overlay')?.remove();
        
      } else {
        throw new Error(response.error || 'Configuration failed');
      }
      
    } catch (error) {
      console.error('💥 LINK CONFIG ERROR:', error);
      app.showNotification(`❌ Configuration failed: ${error.message}`, 'error');
    }
  }

  filterGames(status) {
    if (status === 'all') {
      this.renderActiveGames(this.games);
    } else {
      const filtered = this.games.filter(game => game.status === status);
      this.renderActiveGames(filtered);
    }
  }

  async loadParticipants() {
    try {
      // Load participants for all games
      const allParticipants = [];
      
      for (const game of this.games) {
        try {
          const response = await app.apiCall(`/organiser/games/${game.id}/participants`);
          const participants = response.participants || [];
          participants.forEach(p => {
            p.gameName = game.name;
            p.gameId = game.id;
          });
          allParticipants.push(...participants);
        } catch (error) {
          console.error(`Error loading participants for game ${game.id}:`, error);
        }
      }
      
      this.participants = allParticipants;
      this.renderParticipants(this.participants);
      
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  }

  populateGameFilter() {
    const filter = document.getElementById('participantGameFilter');
    if (!filter) return;

    const options = '<option value="all">All Games</option>' +
      this.games.map(game => `<option value="${game.id}">${game.name}</option>`).join('');
    
    filter.innerHTML = options;
  }

  renderParticipants(participants) {
    const tbody = document.getElementById('participantsTableBody');
    if (!tbody) return;

    if (participants.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">
            No participants found
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = participants.map(participant => `
      <tr>
        <td>${participant.users?.username || 'Unknown'}</td>
        <td>${participant.gameName}</td>
        <td>${participant.sheets_selected}</td>
        <td>₹${participant.total_amount.toLocaleString()}</td>
        <td>${participant.utr_id}</td>
        <td>${participant.payment_phone}</td>
        <td><span class="status-badge status-${participant.payment_status}">${participant.payment_status}</span></td>
        <td>
          ${participant.payment_status === 'pending' ? `
            <div class="action-buttons">
              <button class="btn btn-success btn-xs" onclick="organiserManager.updateParticipantStatus('${participant.id}', 'approved')">
                Approve
              </button>
              <button class="btn btn-danger btn-xs" onclick="organiserManager.updateParticipantStatus('${participant.id}', 'rejected')">
                Reject
              </button>
            </div>
          ` : '-'}
        </td>
      </tr>
    `).join('');
  }

  filterParticipants() {
    const gameFilter = document.getElementById('participantGameFilter')?.value;
    const statusFilter = document.getElementById('participantStatusFilter')?.value;

    let filtered = [...this.participants];

    if (gameFilter && gameFilter !== 'all') {
      filtered = filtered.filter(p => p.gameId === gameFilter);
    }

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(p => p.payment_status === statusFilter);
    }

    this.renderParticipants(filtered);
  }

  async updateParticipantStatus(participantId, status) {
    try {
      const response = await app.apiCall(`/organiser/participants/${participantId}/status`, 'PUT', {
        status: status
      });

      app.showNotification(`Participant ${status} successfully`, 'success');
      
      // Reload participants and pending verifications
      await this.loadParticipants();
      await this.loadPendingVerifications();
      
    } catch (error) {
      app.showNotification(error.message || `Failed to ${status} participant`, 'error');
    }
  }

  async approveParticipant(participantId) {
    await this.updateParticipantStatus(participantId, 'approved');
  }

  async denyParticipant(participantId) {
    await this.updateParticipantStatus(participantId, 'rejected');
  }

  viewParticipants(gameId) {
    // Set game filter and switch to participants section
    this.switchSection('participants');
    setTimeout(() => {
      const gameFilter = document.getElementById('participantGameFilter');
      if (gameFilter) {
        gameFilter.value = gameId;
        this.filterParticipants();
      }
    }, 100);
  }

  editGame(gameId) {
    // Find the game
    const game = this.games.find(g => g.id === gameId);
    if (!game) {
      app.showNotification('Game not found', 'error');
      return;
    }

    // Show edit game modal with populated form
    this.showEditGameModal(game);
  }

  showEditGameModal(game) {
    const modal = document.getElementById('editGameModal');
    const content = document.getElementById('editGameContent');
    
    content.innerHTML = `
      <div class="modal-header">
        <h2>Edit Game: ${game.name}</h2>
        <p>Update game information and settings</p>
      </div>
      
      <form id="editGameForm">
        <input type="hidden" id="editGameId" value="${game.id}">
        
        <div class="form-section">
          <h3>Game Information</h3>
          <div class="form-group">
            <label for="editGameName">Game Name</label>
            <input type="text" id="editGameName" name="gameName" value="${game.name}" required>
          </div>
          
          <div class="form-group">
            <label>Banner Image</label>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border: 2px dashed #007bff;">
              <div style="text-align: center;">
                <div style="font-size: 32px; margin-bottom: 10px;">🎨</div>
                <p style="margin: 0; color: #495057; font-size: 14px;">
                  Use "☁️ Upload to Drive" button to update banner with our new drag & drop system
                </p>
              </div>
            </div>
            <input type="hidden" id="editBannerImageUrl" name="bannerImageUrl" value="${game.banner_image_url || ''}">
          </div>
          
          <div class="form-group">
            <label for="editTotalPrize">Total Prize Pool (₹)</label>
            <input type="number" id="editTotalPrize" name="totalPrize" value="${game.total_prize}" required min="1">
          </div>
        </div>

        <div class="form-section">
          <h3>Pricing Structure</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="editPricePerSheet1">Price for 1 Sheet (₹)</label>
              <input type="number" id="editPricePerSheet1" name="pricePerSheet1" value="${game.price_per_sheet_1}" required min="1">
            </div>
            <div class="form-group">
              <label for="editPricePerSheet2">Price for 2 Sheets (₹ each)</label>
              <input type="number" id="editPricePerSheet2" name="pricePerSheet2" value="${game.price_per_sheet_2}" required min="1">
            </div>
            <div class="form-group">
              <label for="editPricePerSheet3Plus">Price for 3+ Sheets (₹ each)</label>
              <input type="number" id="editPricePerSheet3Plus" name="pricePerSheet3Plus" value="${game.price_per_sheet_3_plus}" required min="1">
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>Game Schedule</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="editGameDate">Game Date</label>
              <input type="date" id="editGameDate" name="gameDate" value="${game.game_date}" required>
            </div>
            <div class="form-group">
              <label for="editGameTime">Game Time</label>
              <input type="time" id="editGameTime" name="gameTime" value="${game.game_time}" required>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>Payment & Meeting</h3>
          <div class="form-group">
            <label>Payment QR Code</label>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border: 2px dashed #28a745;">
              <div style="text-align: center;">
                <div style="font-size: 32px; margin-bottom: 10px;">💳</div>
                <p style="margin: 0; color: #495057; font-size: 14px;">
                  Use "☁️ Upload to Drive" button to update QR code with our new drag & drop system
                </p>
              </div>
            </div>
            <input type="hidden" id="editPaymentQrCodeUrl" name="paymentQrCodeUrl" value="${game.payment_qr_code_url || ''}">
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="editZoomLink">Meeting Link (Zoom/Google Meet)</label>
              <input type="url" id="editZoomLink" name="zoomLink" value="${game.zoom_link || ''}" placeholder="https://zoom.us/j/123456789">
            </div>
            <div class="form-group">
              <label for="editZoomPassword">Meeting Password</label>
              <input type="text" id="editZoomPassword" name="zoomPassword" value="${game.zoom_password || ''}" placeholder="Optional meeting password">
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Update Game</button>
          <button type="button" onclick="closeEditGameModal()" class="btn btn-secondary">Cancel</button>
        </div>
      </form>
    `;
    
    // Set minimum date for game editing
    const editGameDate = document.getElementById('editGameDate');
    if (editGameDate) {
      const today = new Date().toISOString().split('T')[0];
      editGameDate.min = today;
    }
    
    // Setup form submission
    document.getElementById('editGameForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.updateGame();
    });
    
    modal.style.display = 'block';
  }

  async updateGame() {
    try {
      const formData = new FormData(document.getElementById('editGameForm'));
      const gameId = formData.get('editGameId') || document.getElementById('editGameId').value;
      
      // Validate required fields
      const gameName = formData.get('gameName');
      const totalPrize = formData.get('totalPrize');
      const pricePerSheet1 = formData.get('pricePerSheet1');
      const pricePerSheet2 = formData.get('pricePerSheet2');
      const pricePerSheet3Plus = formData.get('pricePerSheet3Plus');
      const gameDate = formData.get('gameDate');
      const gameTime = formData.get('gameTime');
      
      if (!gameName || !gameName.trim()) {
        app.showNotification('Game name is required', 'error');
        return;
      }
      
      // Validate numeric inputs
      const totalPrizeNum = parseFloat(totalPrize);
      const priceSheet1Num = parseFloat(pricePerSheet1);
      const priceSheet2Num = parseFloat(pricePerSheet2);
      const priceSheet3Num = parseFloat(pricePerSheet3Plus);
      
      if (isNaN(totalPrizeNum) || totalPrizeNum <= 0) {
        app.showNotification('Please enter a valid total prize amount', 'error');
        return;
      }
      
      if (isNaN(priceSheet1Num) || priceSheet1Num <= 0) {
        app.showNotification('Please enter a valid price for 1 sheet', 'error');
        return;
      }
      
      if (isNaN(priceSheet2Num) || priceSheet2Num <= 0) {
        app.showNotification('Please enter a valid price for 2 sheets', 'error');
        return;
      }
      
      if (isNaN(priceSheet3Num) || priceSheet3Num <= 0) {
        app.showNotification('Please enter a valid price for 3+ sheets', 'error');
        return;
      }
      
      if (!gameDate) {
        app.showNotification('Game date is required', 'error');
        return;
      }
      
      if (!gameTime) {
        app.showNotification('Game time is required', 'error');
        return;
      }
      
      const data = {
        name: gameName.trim(),
        banner_image_url: formData.get('bannerImageUrl') || null,
        total_prize: totalPrizeNum,
        price_per_sheet_1: priceSheet1Num,
        price_per_sheet_2: priceSheet2Num,
        price_per_sheet_3_plus: priceSheet3Num,
        payment_qr_code_url: formData.get('paymentQrCodeUrl') || null,
        zoom_link: formData.get('zoomLink') || null,
        zoom_password: formData.get('zoomPassword') || null,
        game_date: gameDate,
        game_time: gameTime
      };

      const response = await app.apiCall(`/organiser/games/${gameId}`, 'PUT', data);
      app.showNotification('Game updated successfully', 'success');
      
      // Close modal and refresh games list
      this.closeEditGameModal();
      await this.loadActiveGames();
      
    } catch (error) {
      app.showNotification(error.message || 'Failed to update game', 'error');
    }
  }

  closeEditGameModal() {
    document.getElementById('editGameModal').style.display = 'none';
    document.getElementById('editGameContent').innerHTML = '';
  }

  async startGame(gameId) {
    try {
      if (!confirm('Are you sure you want to start this game? All approved participants will be notified.')) {
        return;
      }

      const response = await app.apiCall(`/organiser/games/${gameId}/start`, 'POST');
      app.showNotification(`Game started! ${response.participantsNotified} participants notified.`, 'success');
      
      // Reload games to show updated status
      await this.loadActiveGames();
      
    } catch (error) {
      app.showNotification(error.message || 'Failed to start game', 'error');
    }
  }

  showEndGameModal(gameId) {
    document.getElementById('endGameId').value = gameId;
    
    // Reset winner inputs to default 3
    this.resetWinnerInputs();
    
    document.getElementById('endGameModal').style.display = 'block';
  }

  resetWinnerInputs() {
    const winnerInputs = document.getElementById('winnerInputs');
    winnerInputs.innerHTML = `
      <div class="winner-input" data-position="1">
        <label>1st Place Winner</label>
        <input type="text" name="winner1" placeholder="Username" required>
        <input type="number" name="prize1" placeholder="Prize Amount (₹)" required min="0">
      </div>
      <div class="winner-input" data-position="2">
        <label>2nd Place Winner</label>
        <input type="text" name="winner2" placeholder="Username">
        <input type="number" name="prize2" placeholder="Prize Amount (₹)" min="0">
      </div>
      <div class="winner-input" data-position="3">
        <label>3rd Place Winner</label>
        <input type="text" name="winner3" placeholder="Username">
        <input type="number" name="prize3" placeholder="Prize Amount (₹)" min="0">
      </div>
    `;
  }

  addWinnerField() {
    const winnerInputs = document.getElementById('winnerInputs');
    const currentCount = winnerInputs.children.length;
    
    if (currentCount >= 15) {
      app.showNotification('Maximum 15 winners allowed', 'warning');
      return;
    }
    
    const newPosition = currentCount + 1;
    const winnerDiv = document.createElement('div');
    winnerDiv.className = 'winner-input';
    winnerDiv.setAttribute('data-position', newPosition);
    
    const positionText = this.getPositionText(newPosition);
    
    winnerDiv.innerHTML = `
      <label>${positionText} Place Winner</label>
      <input type="text" name="winner${newPosition}" placeholder="Username">
      <input type="number" name="prize${newPosition}" placeholder="Prize Amount (₹)" min="0">
    `;
    
    winnerInputs.appendChild(winnerDiv);
  }

  removeWinnerField() {
    const winnerInputs = document.getElementById('winnerInputs');
    const currentCount = winnerInputs.children.length;
    
    if (currentCount <= 3) {
      app.showNotification('Minimum 3 winner fields required', 'warning');
      return;
    }
    
    winnerInputs.removeChild(winnerInputs.lastElementChild);
  }

  getPositionText(position) {
    const positions = {
      1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th',
      6: '6th', 7: '7th', 8: '8th', 9: '9th', 10: '10th',
      11: '11th', 12: '12th', 13: '13th', 14: '14th', 15: '15th'
    };
    return positions[position] || `${position}th`;
  }

  async endGame() {
    try {
      const formData = new FormData(document.getElementById('endGameForm'));
      const gameId = formData.get('endGameId') || document.getElementById('endGameId').value;
      
      const winners = [];
      const winnerInputs = document.getElementById('winnerInputs');
      const winnerCount = winnerInputs.children.length;
      
      // Collect winners data from all winner inputs
      for (let i = 1; i <= winnerCount; i++) {
        const username = formData.get(`winner${i}`);
        const prize = formData.get(`prize${i}`);
        
        if (username && username.trim() && prize && parseFloat(prize) > 0) {
          winners.push({
            userId: username.trim(), // In real implementation, you'd need to resolve username to userId
            position: i,
            prizeAmount: parseFloat(prize)
          });
        }
      }

      if (winners.length === 0) {
        app.showNotification('Please add at least one winner', 'warning');
        return;
      }

      // Validate that 1st place winner is provided
      const firstPlace = winners.find(w => w.position === 1);
      if (!firstPlace) {
        app.showNotification('1st place winner is required', 'error');
        return;
      }

      const response = await app.apiCall(`/organiser/games/${gameId}/end`, 'POST', {
        winners: winners
      });

      app.showNotification(`Game ended successfully with ${winners.length} winner(s)`, 'success');
      this.closeEndGameModal();
      
      // Reload games
      await this.loadActiveGames();
      
    } catch (error) {
      app.showNotification(error.message || 'Failed to end game', 'error');
    }
  }

  closeEndGameModal() {
    document.getElementById('endGameModal').style.display = 'none';
    document.getElementById('endGameForm').reset();
  }

  async loadHistory() {
    try {
      const [statsResponse, gamesResponse] = await Promise.all([
        app.apiCall('/organiser/stats'),
        app.apiCall('/organiser/games?status=ended')
      ]);

      // Update summary cards
      document.getElementById('historyTotalGames').textContent = statsResponse.endedGamesCount || 0;
      document.getElementById('historyTotalRevenue').textContent = `₹${(statsResponse.totalRevenue || 0).toLocaleString()}`;
      document.getElementById('historyTotalProfit').textContent = `₹${(statsResponse.totalProfit || 0).toLocaleString()}`;
      
      // Calculate total participants from ended games
      const endedGames = gamesResponse.games || [];
      const totalParticipants = endedGames.reduce((sum, game) => sum + (game.registered_participants || 0), 0);
      document.getElementById('historyTotalParticipants').textContent = totalParticipants;

      // Render history table
      this.renderHistoryTable(endedGames);

    } catch (error) {
      console.error('Error loading history:', error);
    }
  }

  renderHistoryTable(games) {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;

    if (games.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
            No completed games yet
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = games.map(game => {
      const revenue = (game.registered_participants || 0) * (game.price_per_sheet_1 || 0); // Simplified calculation
      const profit = revenue - (game.total_prize || 0);
      
      return `
        <tr>
          <td>${game.name}</td>
          <td>${app.formatDate(game.game_date)}</td>
          <td>₹${game.total_prize.toLocaleString()}</td>
          <td>${game.registered_participants || 0}</td>
          <td>₹${revenue.toLocaleString()}</td>
          <td style="color: ${profit >= 0 ? 'var(--success-color)' : 'var(--danger-color)'}">
            ₹${profit.toLocaleString()}
          </td>
          <td>
            <button class="btn btn-secondary btn-xs" onclick="organiserManager.viewGameDetails('${game.id}')">
              View Details
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  viewGameDetails(gameId) {
    app.showNotification('Game details view coming soon', 'info');
  }

  exportData(type) {
    app.showNotification(`${type} data export coming soon`, 'info');
  }

  // AUTO-SCAN Google Drive folder for individual sheets
  async validateGoogleDriveFolder(folderUrl) {
    const validation = document.getElementById('folderValidation');
    const autoScanSection = document.getElementById('autoScanSection');
    const scanStatus = document.getElementById('scanStatus');
    
    if (!folderUrl) {
      if (validation) validation.style.display = 'none';
      if (autoScanSection) autoScanSection.style.display = 'none';
      return;
    }

    // Check if validation element exists
    if (!validation) {
      console.warn('folderValidation element not found in DOM');
      return;
    }

    const statusSpan = validation.querySelector('.validation-status');
    if (!statusSpan) {
      console.warn('validation-status element not found in DOM');
      return;
    }

    // Show validation status
    validation.style.display = 'block';
    validation.className = 'folder-validation loading';
    statusSpan.textContent = '🔄 Validating folder...';

    try {
      // First validate folder access
      const response = await app.apiCall('/organiser/validate-folder', 'POST', {
        folderUrl: folderUrl
      });

      validation.className = 'folder-validation success';
      statusSpan.textContent = '✅ Folder is accessible - Starting auto-scan...';
      
      // Show auto-scan section and start scanning
      if (autoScanSection) {
        autoScanSection.style.display = 'block';
        this.startAutoScan(folderUrl);
      }
      
    } catch (error) {
      validation.className = 'folder-validation error';
      statusSpan.textContent = `❌ ${error.message}`;
      if (autoScanSection) autoScanSection.style.display = 'none';
    }
  }

  // AUTO-SCAN the Google Drive folder for individual sheet files
  async startAutoScan(folderUrl) {
    const scanStatus = document.getElementById('scanStatus');
    if (!scanStatus) {
      console.warn('scanStatus element not found in DOM');
      return;
    }

    const loadingDiv = scanStatus.querySelector('.scan-loading');
    const successDiv = scanStatus.querySelector('.scan-success');
    const errorDiv = scanStatus.querySelector('.scan-error');
    
    if (!loadingDiv || !successDiv || !errorDiv) {
      console.warn('Scan status child elements not found in DOM');
      return;
    }
    
    // Show loading state
    loadingDiv.style.display = 'flex';
    successDiv.style.display = 'none';
    errorDiv.style.display = 'none';

    try {
      console.log(`🔍 AUTO-SCAN: Starting scan for folder: ${folderUrl}`);
      
      // Extract folder ID from URL
      const folderId = this.extractFolderIdFromUrl(folderUrl);
      if (!folderId) {
        throw new Error('Invalid Google Drive folder URL');
      }

      // Call the auto-scan API (we'll create a temporary game to scan)
      const scanResponse = await app.apiCall('/organiser/scan-folder-preview', 'POST', {
        folderId: folderId
      });

      if (scanResponse.success && scanResponse.sheetFiles) {
        // Show success state
        loadingDiv.style.display = 'none';
        successDiv.style.display = 'flex';
        
        const totalSheets = Object.keys(scanResponse.sheetFiles).length;
        successDiv.querySelector('.scan-results').textContent = 
          `Found ${totalSheets} sheets in folder`;

        // Auto-populate the form with scanned data
        document.getElementById('totalSheets').value = totalSheets;
        document.getElementById('autoScannedSheets').value = JSON.stringify(scanResponse.sheetFiles);
        
        // Detect file format from scanned files
        const firstFile = Object.values(scanResponse.sheetFiles)[0];
        if (firstFile && firstFile.fileName) {
          const detectedFormat = this.detectFileFormat(firstFile.fileName);
          document.getElementById('sheetFileFormat').value = detectedFormat;
        }
        
        // Show preview of scanned sheets
        this.showScannedSheetsPreview(scanResponse.sheetFiles);
        
        app.showNotification(`✅ Auto-scan complete: Found ${totalSheets} sheets`, 'success');
        
      } else {
        throw new Error(scanResponse.error || 'Auto-scan failed');
      }
      
    } catch (error) {
      console.error('💥 AUTO-SCAN ERROR:', error);
      
      // Show error state with helpful information
      loadingDiv.style.display = 'none';
      errorDiv.style.display = 'flex';
      
      let errorMessage = error.message || 'Unknown error occurred';
      let helpfulTip = '';
      
      // Provide specific help based on error type
      if (errorMessage.includes('Folder ID is required')) {
        helpfulTip = 'Please paste a valid Google Drive folder URL';
      } else if (errorMessage.includes('publicly accessible')) {
        helpfulTip = 'Make sure your folder is shared with "Anyone with the link can view"';
      } else if (errorMessage.includes('Invalid Google Drive')) {
        helpfulTip = 'Check that you pasted the complete folder URL from Google Drive';
      } else {
        helpfulTip = 'Try refreshing the page and pasting the folder URL again';
      }
      
      errorDiv.querySelector('.error-message').innerHTML = `
        <div><strong>Scan Failed:</strong> ${errorMessage}</div>
        <div style="margin-top: 8px; font-size: 0.9em; color: #666;">
          💡 <strong>Tip:</strong> ${helpfulTip}
        </div>
      `;
      
      app.showNotification(`❌ Auto-scan failed: ${errorMessage}`, 'error');
    }
  }

  // Extract folder ID from Google Drive URL
  extractFolderIdFromUrl(url) {
    if (!url) return null;
    
    const patterns = [
      /\/folders\/([a-zA-Z0-9-_]+)/,  // Standard folder URL
      /id=([a-zA-Z0-9-_]+)/,          // Alternative format
      /^([a-zA-Z0-9-_]+)$/            // Direct folder ID
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }

  // Detect file format from filename
  detectFileFormat(fileName) {
    if (fileName.match(/^Sheet_\d+\.pdf$/i)) {
      return 'Sheet_{number}.pdf';
    } else if (fileName.match(/^\d+\.pdf$/)) {
      return '{number}.pdf';
    } else if (fileName.match(/^sheet_\d+\.pdf$/i)) {
      return 'sheet_{number}.pdf';
    } else {
      return 'custom';
    }
  }

  // Show preview of scanned sheets
  showScannedSheetsPreview(sheetFiles) {
    const preview = document.getElementById('sheetsPreview');
    const samples = document.getElementById('previewSamples');
    const summary = document.getElementById('scanSummary');
    
    if (!preview || !samples || !summary) {
      console.warn('Sheet preview elements not found in DOM');
      return;
    }
    
    preview.style.display = 'block';
    
    // Show ALL detected sheets (not just first 10)
    const sheetNumbers = Object.keys(sheetFiles).map(Number).sort((a, b) => a - b);
    const totalSheets = sheetNumbers.length;
    
    // If there are many sheets, show first 10 + indication of more
    let displayNumbers = sheetNumbers;
    let showMoreIndicator = false;
    
    if (totalSheets > 10) {
      displayNumbers = sheetNumbers.slice(0, 10);
      showMoreIndicator = true;
    }
    
    samples.innerHTML = displayNumbers.map(num => {
      const fileInfo = sheetFiles[num];
      return `
        <div class="preview-sample available">
          <span class="sheet-number">Sheet ${num}</span>
          <span class="file-name">${fileInfo.fileName}</span>
        </div>
      `;
    }).join('');
    
    // Add "and more" indicator if needed
    if (showMoreIndicator) {
      samples.innerHTML += `
        <div class="preview-sample more-indicator">
          <span class="sheet-number">...</span>
          <span class="file-name">and ${totalSheets - 10} more sheets</span>
        </div>
      `;
    }
    
    // Show accurate summary
    summary.innerHTML = `
      <div class="scan-summary-info">
        <strong>✅ Auto-Scan Results:</strong><br>
        📊 Total sheets detected: ${totalSheets}<br>
        📋 Sheet range: ${Math.min(...sheetNumbers)} - ${Math.max(...sheetNumbers)}<br>
        ${totalSheets > 10 ? `📋 Showing first 10 sheets (${totalSheets} total)<br>` : ''}
        🔐 Individual file access configured: YES<br>
        💰 Business protection: ACTIVE
      </div>
    `;
  }

  // Update sheets preview based on format and count
  updateSheetsPreview() {
    const totalSheets = parseInt(document.getElementById('totalSheets')?.value) || 0;
    const format = document.getElementById('sheetFileFormat')?.value;
    const customFormat = document.getElementById('customFormat')?.value;
    const preview = document.getElementById('sheetsPreview');
    const samples = document.getElementById('previewSamples');

    if (!preview || !samples) {
      return; // Elements don't exist, skip preview update
    }

    if (totalSheets === 0) {
      preview.style.display = 'none';
      return;
    }

    preview.style.display = 'block';
    
    // Generate sample file names
    let fileFormat = format;
    if (format === 'custom' && customFormat) {
      fileFormat = customFormat;
    }

    const sampleNumbers = [1, 2, 3, Math.min(10, totalSheets), Math.min(100, totalSheets), totalSheets];
    const uniqueNumbers = [...new Set(sampleNumbers)].filter(n => n <= totalSheets);

    samples.innerHTML = uniqueNumbers.map(num => {
      let fileName = fileFormat.replace('{number}', num);
      return `<div class="preview-sample">${fileName}</div>`;
    }).join('');
  }

  // Validate sheets access
  async validateSheetsAccess() {
    const folderUrl = document.getElementById('sheetsFolder')?.value;
    const totalSheets = parseInt(document.getElementById('totalSheets')?.value) || 0;
    const format = document.getElementById('sheetFileFormat')?.value;
    const customFormat = document.getElementById('customFormat')?.value;

    if (!folderUrl || totalSheets === 0) {
      app.showNotification('Please fill in folder URL and total sheets first', 'warning');
      return;
    }

    try {
      app.showNotification('🔍 Validating sheet access...', 'info');

      let fileFormat = format;
      if (format === 'custom' && customFormat) {
        fileFormat = customFormat;
      }

      const response = await app.apiCall('/organiser/validate-sheets', 'POST', {
        folderUrl: folderUrl,
        totalSheets: totalSheets,
        fileFormat: fileFormat
      });

      const samples = document.getElementById('previewSamples');
      const sampleResults = response.validation || {};
      
      // Update preview with validation results
      samples.querySelectorAll('.preview-sample').forEach((sample, index) => {
        const fileName = sample.textContent;
        const sheetNumber = this.extractNumberFromFileName(fileName, fileFormat);
        
        if (sampleResults[sheetNumber]) {
          sample.classList.add('available');
          sample.title = 'Sheet is accessible';
        } else {
          sample.classList.add('missing');
          sample.title = 'Sheet not found or not accessible';
        }
      });

      const availableCount = Object.keys(sampleResults).length;
      app.showNotification(`✅ Validated: ${availableCount} sheets accessible`, 'success');

    } catch (error) {
      app.showNotification(`❌ Validation failed: ${error.message}`, 'error');
    }
  }

  extractNumberFromFileName(fileName, format) {
    const pattern = format.replace('{number}', '(\\d+)');
    const regex = new RegExp(pattern);
    const match = fileName.match(regex);
    return match ? parseInt(match[1]) : null;
  }
}

// Global functions
function closeEditGameModal() {
  if (organiserManager) {
    organiserManager.closeEditGameModal();
  } else {
    document.getElementById('editGameModal').style.display = 'none';
  }
}

function closeEndGameModal() {
  organiserManager.closeEndGameModal();
}

// Close modals when clicking outside
window.onclick = function(event) {
  const editModal = document.getElementById('editGameModal');
  const endModal = document.getElementById('endGameModal');
  
  if (event.target === editModal) {
    closeEditGameModal();
  }
  if (event.target === endModal) {
    closeEndGameModal();
  }
}

// Initialize organiser manager
const organiserManager = new OrganiserManager();
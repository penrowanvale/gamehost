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

    // Set minimum date for game creation
    const gameDate = document.getElementById('gameDate');
    if (gameDate) {
      const today = new Date().toISOString().split('T')[0];
      gameDate.min = today;
    }

    // Google Drive folder validation
    document.getElementById('sheetsFolder')?.addEventListener('blur', (e) => {
      this.validateGoogleDriveFolder(e.target.value);
    });

    // Sheet format change handler
    document.getElementById('sheetFileFormat')?.addEventListener('change', (e) => {
      const customGroup = document.getElementById('customFormatGroup');
      if (e.target.value === 'custom') {
        customGroup.style.display = 'block';
      } else {
        customGroup.style.display = 'none';
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
      setTimeout(() => this.initializeImageUploads(), 100);
    }
  }

  initializeImageUploads() {
    // Initialize banner image upload
    if (document.getElementById('bannerImageUpload') && !document.getElementById('bannerImageUpload').hasChildNodes()) {
      imageUploadManager.createUploadWidget(
        'bannerImageUpload',
        (imageUrl) => {
          document.getElementById('bannerImageUrl').value = imageUrl;
          app.showNotification('✅ Banner image uploaded successfully!', 'success');
        },
        (error) => {
          app.showNotification(`❌ Banner upload failed: ${error}`, 'error');
        }
      );
    }

    // Initialize QR code upload
    if (document.getElementById('qrCodeUpload') && !document.getElementById('qrCodeUpload').hasChildNodes()) {
      imageUploadManager.createUploadWidget(
        'qrCodeUpload',
        (imageUrl) => {
          document.getElementById('paymentQrCodeUrl').value = imageUrl;
          app.showNotification('✅ QR code uploaded successfully!', 'success');
        },
        (error) => {
          app.showNotification(`❌ QR code upload failed: ${error}`, 'error');
        }
      );
    }
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
      const response = await app.apiCall('/organiser/games');
      const allGames = response.games || [];
      
      // Get participants for all games
      let allPendingParticipants = [];
      const widget = document.getElementById('pendingVerificationsWidget');
      
      for (const game of allGames) {
        try {
          const participantsResponse = await app.apiCall(`/organiser/games/${game.id}/participants`);
          const pending = participantsResponse.participants?.filter(p => p.payment_status === 'pending') || [];
          
          // Add game info to each pending participant
          pending.forEach(participant => {
            participant.gameName = game.name;
            participant.gameId = game.id;
            allPendingParticipants.push(participant);
          });
        } catch (error) {
          console.error('Error loading participants for game:', game.id);
        }
      }

      if (widget) {
        if (allPendingParticipants.length === 0) {
          widget.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No pending verifications</p>';
        } else {
          // Show detailed list of pending verifications with action buttons
          widget.innerHTML = `
            <div class="pending-verifications-list">
              <div class="pending-header">
                <span class="pending-count">${allPendingParticipants.length}</span>
                <span class="pending-label">Pending Verifications</span>
              </div>
              <div class="pending-items">
                ${allPendingParticipants.slice(0, 5).map(participant => `
                  <div class="pending-item" data-participant-id="${participant.id}">
                    <div class="pending-info">
                      <div class="participant-name">${participant.users?.username || 'Unknown User'}</div>
                      <div class="game-name">${participant.gameName}</div>
                      <div class="payment-details">
                        <span class="amount">₹${participant.amount_paid}</span>
                        <span class="sheets">${participant.selected_sheet_numbers?.length || 0} sheets</span>
                      </div>
                      ${participant.payment_screenshot_url ? 
                        `<div class="screenshot-link">
                          <a href="${participant.payment_screenshot_url}" target="_blank" class="btn-view-screenshot">
                            📷 View Screenshot
                          </a>
                        </div>` : ''
                      }
                    </div>
                    <div class="pending-actions">
                      <button class="btn btn-success btn-sm" onclick="organiserManager.approveParticipant('${participant.id}', '${participant.gameId}')">
                        ✓ Approve
                      </button>
                      <button class="btn btn-danger btn-sm" onclick="organiserManager.denyParticipant('${participant.id}', '${participant.gameId}')">
                        ✗ Deny
                      </button>
                    </div>
                  </div>
                `).join('')}
                ${allPendingParticipants.length > 5 ? 
                  `<div class="view-all-pending">
                    <button class="btn btn-secondary" onclick="organiserManager.switchSection('participants')">
                      View All ${allPendingParticipants.length} Pending
                    </button>
                  </div>` : ''
                }
              </div>
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
      
      // Extract Google Drive folder ID from URL
      const sheetsFolder = formData.get('sheetsFolder');
      let sheetsFolderId = null;
      
      if (sheetsFolder) {
        // This will be handled on the server side
        sheetsFolderId = sheetsFolder;
      }

      const data = {
        name: formData.get('gameName'),
        bannerImageUrl: formData.get('bannerImageUrl'),
        totalPrize: parseFloat(formData.get('totalPrize')),
        pricePerSheet1: parseFloat(formData.get('pricePerSheet1')),
        pricePerSheet2: parseFloat(formData.get('pricePerSheet2')),
        pricePerSheet3Plus: parseFloat(formData.get('pricePerSheet3Plus')),
        paymentQrCodeUrl: formData.get('paymentQrCodeUrl'),
        zoomLink: formData.get('zoomLink'),
        zoomPassword: formData.get('zoomPassword'),
        gameDate: formData.get('gameDate'),
        gameTime: formData.get('gameTime'),
        sheetsFolder: sheetsFolderId,
        totalSheets: parseInt(formData.get('totalSheets')),
        sheetFileFormat: formData.get('sheetFileFormat'),
        customFormat: formData.get('customFormat')
      };

      const response = await app.apiCall('/organiser/games', 'POST', data);
      app.showNotification('Game created successfully', 'success');
      
      // Reset form and switch to active games
      document.getElementById('createGameForm').reset();
      document.getElementById('sheetsPreview').style.display = 'none';
      document.getElementById('folderValidation').style.display = 'none';
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
      
      // Reload participants
      await this.loadParticipants();
      
    } catch (error) {
      app.showNotification(error.message || `Failed to ${status} participant`, 'error');
    }
  }

  async approveParticipant(participantId, gameId) {
    try {
      const response = await app.apiCall(`/organiser/participants/${participantId}/status`, 'PUT', {
        status: 'approved'
      });

      app.showNotification('Participant approved successfully', 'success');
      
      // Reload pending verifications and participants
      await this.loadPendingVerifications();
      if (this.currentSection === 'participants') {
        await this.loadParticipants();
      }
      
    } catch (error) {
      app.showNotification(error.message || 'Failed to approve participant', 'error');
    }
  }

  async denyParticipant(participantId, gameId) {
    try {
      // Show confirmation dialog
      if (!confirm('Are you sure you want to deny this participant? This action cannot be undone.')) {
        return;
      }

      const response = await app.apiCall(`/organiser/participants/${participantId}/status`, 'PUT', {
        status: 'denied'
      });

      app.showNotification('Participant denied', 'success');
      
      // Reload pending verifications and participants
      await this.loadPendingVerifications();
      if (this.currentSection === 'participants') {
        await this.loadParticipants();
      }
      
    } catch (error) {
      app.showNotification(error.message || 'Failed to deny participant', 'error');
    }
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
            <label for="editBannerImageUrl">Banner Image URL</label>
            <input type="url" id="editBannerImageUrl" name="bannerImageUrl" value="${game.banner_image_url || ''}" placeholder="https://example.com/banner.jpg">
            <small>Upload your banner to a cloud service and paste the URL</small>
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
            <label for="editPaymentQrCodeUrl">Payment QR Code URL</label>
            <input type="url" id="editPaymentQrCodeUrl" name="paymentQrCodeUrl" value="${game.payment_qr_code_url || ''}" required>
            <small>Upload your UPI QR code image and paste the URL</small>
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
      
      const data = {
        name: formData.get('gameName'),
        banner_image_url: formData.get('bannerImageUrl'),
        total_prize: parseFloat(formData.get('totalPrize')),
        price_per_sheet_1: parseFloat(formData.get('pricePerSheet1')),
        price_per_sheet_2: parseFloat(formData.get('pricePerSheet2')),
        price_per_sheet_3_plus: parseFloat(formData.get('pricePerSheet3Plus')),
        payment_qr_code_url: formData.get('paymentQrCodeUrl'),
        zoom_link: formData.get('zoomLink'),
        zoom_password: formData.get('zoomPassword'),
        game_date: formData.get('gameDate'),
        game_time: formData.get('gameTime')
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

  async exportData(type) {
    try {
      app.showNotification(`Preparing ${type} data export...`, 'info');
      
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = `/api/organiser/export/${type}`;
      link.target = '_blank';
      link.style.display = 'none';
      
      // Add authorization header by creating a form and submitting it
      const form = document.createElement('form');
      form.method = 'GET';
      form.action = `/api/organiser/export/${type}`;
      form.style.display = 'none';
      
      // Add authorization as a hidden input (this won't work for GET, so we'll use a different approach)
      document.body.appendChild(form);
      
      // Alternative: Use fetch to download the file
      const response = await app.apiCall(`/organiser/export/${type}`, 'GET');
      
      // If the response is successful, it should be a blob
      if (response instanceof Blob || typeof response === 'string') {
        const blob = response instanceof Blob ? response : new Blob([response], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        
        link.href = url;
        link.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        document.body.removeChild(form);
        
        app.showNotification(`${type} data exported successfully!`, 'success');
      } else {
        // If we get here, the API returned JSON (likely an error or the data)
        // Let's try the direct window.open approach with auth headers
        this.downloadWithAuth(`/api/organiser/export/${type}`, `${type}_export.csv`);
      }
      
    } catch (error) {
      console.error('Export error:', error);
      app.showNotification(error.message || `Failed to export ${type} data`, 'error');
    }
  }

  // Helper method to download files with authentication
  async downloadWithAuth(url, filename) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${app.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(link);
      
      app.showNotification('Export completed successfully!', 'success');
      
    } catch (error) {
      console.error('Download error:', error);
      app.showNotification('Export failed. Please try again.', 'error');
    }
  }

  // Google Drive folder validation
  async validateGoogleDriveFolder(folderUrl) {
    const validation = document.getElementById('folderValidation');
    const statusSpan = validation.querySelector('.validation-status');
    
    if (!folderUrl) {
      validation.style.display = 'none';
      return;
    }

    validation.style.display = 'block';
    validation.className = 'folder-validation loading';
    statusSpan.textContent = '🔄 Validating folder...';

    try {
      const response = await app.apiCall('/organiser/validate-folder', 'POST', {
        folderUrl: folderUrl
      });

      validation.className = 'folder-validation success';
      statusSpan.textContent = '✅ Folder is accessible and valid';
      
      this.updateSheetsPreview();
      
    } catch (error) {
      validation.className = 'folder-validation error';
      statusSpan.textContent = `❌ ${error.message}`;
    }
  }

  // Update sheets preview based on format and count
  updateSheetsPreview() {
    const totalSheets = parseInt(document.getElementById('totalSheets')?.value) || 0;
    const format = document.getElementById('sheetFileFormat')?.value;
    const customFormat = document.getElementById('customFormat')?.value;
    const preview = document.getElementById('sheetsPreview');
    const samples = document.getElementById('previewSamples');

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
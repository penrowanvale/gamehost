// Admin Panel JavaScript

class AdminManager {
  constructor() {
    this.currentSection = 'dashboard';
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
    // Check if user is admin
    console.log('🔍 Checking admin auth. User:', app.user);
    
    if (!app.user || app.user.role !== 'admin') {
      console.log('❌ Admin access denied. User role:', app.user?.role || 'No user');
      this.showAdminRequired();
      return;
    }

    console.log('✅ Admin access granted for:', app.user.username);
    this.showDashboard();
    this.setupEventListeners();
    this.loadDashboardData();
  }

  showAdminRequired() {
    document.getElementById('adminRequiredScreen').style.display = 'block';
    document.getElementById('adminDashboard').style.display = 'none';
  }

  showDashboard() {
    document.getElementById('adminRequiredScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'flex';
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

    // Sidebar toggle
    document.getElementById('adminSidebarToggle')?.addEventListener('click', () => {
      this.toggleSidebar();
    });

    // Mobile sidebar toggle
    document.getElementById('mobileAdminSidebarToggle')?.addEventListener('click', () => {
      this.toggleSidebar();
    });

    // Sidebar backdrop
    document.getElementById('adminSidebarBackdrop')?.addEventListener('click', () => {
      this.closeSidebar();
    });

    // Close sidebar with ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeSidebar();
      }
    });

    // Settings form
    document.getElementById('settingsForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveSettings();
    });
  }

  toggleSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const backdrop = document.getElementById('adminSidebarBackdrop');
    
    sidebar.classList.toggle('open');
    
    if (sidebar.classList.contains('open')) {
      backdrop.classList.add('active');
    } else {
      backdrop.classList.remove('active');
    }
  }

  closeSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const backdrop = document.getElementById('adminSidebarBackdrop');
    
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
    document.querySelectorAll('.admin-content-section').forEach(sec => {
      sec.classList.remove('active');
    });
    document.getElementById(`${section}-section`).classList.add('active');

    // Load section data
    this.loadSectionData(section);
  }

  async loadSectionData(section) {
    switch (section) {
      case 'dashboard':
        await this.loadDashboardData();
        break;
      case 'users':
        await this.loadUsers();
        break;
      case 'organisers':
        await this.loadOrganisers();
        break;
      case 'games':
        await this.loadGames();
        break;
      case 'settings':
        await this.loadSettings();
        break;
    }
  }

  async loadDashboardData() {
    try {
      console.log('📊 Loading admin dashboard data...');
      console.log('🔑 Current user:', app.user);
      console.log('🎫 Current token:', app.token ? 'Present' : 'Missing');
      
      // Load basic stats (simplified)
      const [usersResponse, organisersResponse, gamesResponse] = await Promise.all([
        app.apiCall('/admin/users').catch(err => { console.error('Users API error:', err); return { users: [] }; }),
        app.apiCall('/admin/organisers').catch(err => { console.error('Organisers API error:', err); return { organisers: [] }; }),
        app.apiCall('/admin/games').catch(err => { console.error('Games API error:', err); return { games: [] }; })
      ]);

      console.log('📊 Dashboard responses:', { 
        users: usersResponse.users?.length, 
        organisers: organisersResponse.organisers?.length, 
        games: gamesResponse.games?.length 
      });

      // Update stats
      document.getElementById('totalUsers').textContent = usersResponse.users?.length || 0;
      document.getElementById('totalOrganisers').textContent = organisersResponse.organisers?.filter(o => o.is_approved).length || 0;
      document.getElementById('totalGames').textContent = gamesResponse.games?.length || 0;
      document.getElementById('platformRevenue').textContent = '₹0'; // Would calculate from actual data
      
      console.log('✅ Admin dashboard data loaded successfully');
      
      // Update pending organisers count
      const pendingCount = organisersResponse.organisers?.filter(o => !o.is_approved).length || 0;
      document.getElementById('pendingOrganisers').textContent = pendingCount;

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  async loadUsers() {
    try {
      const response = await app.apiCall('/admin/users');
      this.renderUsersTable(response.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      app.showNotification('Failed to load users', 'error');
    }
  }

  renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">No users found</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(user => `
      <tr>
        <td>${user.username}</td>
        <td>${user.email}</td>
        <td>${user.phone}</td>
        <td><span class="status-badge status-${user.role}">${user.role}</span></td>
        <td><span class="status-badge status-${user.is_active ? 'active' : 'inactive'}">${user.is_active ? 'Active' : 'Inactive'}</span></td>
        <td>${app.formatDate(user.created_at)}</td>
        <td>
          <button class="btn btn-secondary btn-xs" onclick="adminManager.viewUser('${user.id}')">View</button>
        </td>
      </tr>
    `).join('');
  }

  async loadOrganisers() {
    try {
      console.log('🏢 Loading all organisers...');
      const response = await app.apiCall('/admin/organisers');
      console.log('📊 Organisers response:', response);
      console.log('✅ Organisers loaded:', response.organisers?.length || 0);
      this.renderOrganisersTable(response.organisers || []);
    } catch (error) {
      console.error('💥 Error loading organisers:', error);
      console.error('💥 Error details:', error.message, error.status);
      app.showNotification('Failed to load organisers: ' + (error.message || 'Unknown error'), 'error');
    }
  }

  renderOrganisersTable(organisers) {
    const tbody = document.getElementById('organisersTableBody');
    if (!tbody) return;

    if (organisers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">No organiser applications found</td></tr>';
      return;
    }

    tbody.innerHTML = organisers.map(organiser => `
      <tr>
        <td>${organiser.real_name}</td>
        <td>${organiser.organiser_name}</td>
        <td>${organiser.users?.email || 'N/A'}</td>
        <td>${organiser.personal_phone}</td>
        <td><span class="status-badge status-${organiser.is_approved ? 'approved' : 'pending'}">${organiser.is_approved ? 'Approved' : 'Pending'}</span></td>
        <td>${app.formatDate(organiser.created_at)}</td>
        <td>
          ${!organiser.is_approved ? `
            <button class="btn btn-success btn-xs" onclick="adminManager.approveOrganiser('${organiser.id}', true)">Approve</button>
            <button class="btn btn-danger btn-xs" onclick="adminManager.approveOrganiser('${organiser.id}', false)">Reject</button>
          ` : `
            <button class="btn btn-secondary btn-xs" onclick="adminManager.viewOrganiser('${organiser.id}')">View</button>
          `}
        </td>
      </tr>
    `).join('');
  }

  async approveOrganiser(organiserId, approved) {
    try {
      const response = await app.apiCall(`/admin/organisers/${organiserId}/status`, 'PUT', {
        approved: approved
      });

      app.showNotification(`Organiser ${approved ? 'approved' : 'rejected'} successfully`, 'success');
      await this.loadOrganisers();
      await this.loadDashboardData(); // Refresh dashboard stats
      
    } catch (error) {
      app.showNotification(error.message || 'Failed to update organiser status', 'error');
    }
  }

  async loadGames() {
    try {
      const response = await app.apiCall('/admin/games');
      this.renderGamesTable(response.games || []);
    } catch (error) {
      console.error('Error loading games:', error);
      app.showNotification('Failed to load games', 'error');
    }
  }

  renderGamesTable(games) {
    const tbody = document.getElementById('gamesTableBody');
    if (!tbody) return;

    if (games.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">No games found</td></tr>';
      return;
    }

    tbody.innerHTML = games.map(game => `
      <tr>
        <td>${game.name}</td>
        <td>${game.organisers?.organiser_name || 'Unknown'}</td>
        <td>${app.formatDate(game.game_date)}</td>
        <td>₹${game.total_prize.toLocaleString()}</td>
        <td>${game.registered_participants || 0}</td>
        <td><span class="status-badge status-${game.status}">${game.status}</span></td>
        <td>
          <button class="btn btn-secondary btn-xs" onclick="adminManager.viewGame('${game.id}')">View</button>
        </td>
      </tr>
    `).join('');
  }

  async loadSettings() {
    try {
      const response = await app.apiCall('/admin/settings');
      const settings = response.settings || [];
      
      // Populate form with current settings
      settings.forEach(setting => {
        const input = document.querySelector(`[name="${setting.setting_key}"]`);
        if (input) {
          input.value = setting.setting_value || '';
        }
      });
      
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async saveSettings() {
    try {
      const formData = new FormData(document.getElementById('settingsForm'));
      
      // Save each setting
      for (const [key, value] of formData.entries()) {
        await app.apiCall(`/admin/settings/${key}`, 'PUT', { value });
      }
      
      app.showNotification('Settings saved successfully', 'success');
      
    } catch (error) {
      app.showNotification(error.message || 'Failed to save settings', 'error');
    }
  }

  async exportData(type) {
    try {
      app.showNotification(`Preparing ${type} data export...`, 'info');
      await this.downloadWithAuth(`/api/admin/export/${type}`, `${type}_export.csv`);
    } catch (error) {
      console.error('Export error:', error);
      app.showNotification(`Failed to export ${type} data`, 'error');
    }
  }

  async exportAllData() {
    try {
      app.showNotification('Exporting all platform data...', 'info');
      
      // Export all data types with delay
      const types = ['users', 'organisers', 'games', 'participants', 'financial'];
      
      for (let i = 0; i < types.length; i++) {
        setTimeout(async () => {
          try {
            await this.downloadWithAuth(`/api/admin/export/${types[i]}`, `${types[i]}_export.csv`);
          } catch (error) {
            console.error(`Failed to export ${types[i]}:`, error);
          }
        }, i * 1000); // 1 second delay between downloads
      }
      
      app.showNotification('All exports initiated. Downloads will start shortly.', 'success');
    } catch (error) {
      console.error('Export all error:', error);
      app.showNotification('Failed to export all data', 'error');
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

  viewUser(userId) {
    app.showNotification('User details view coming soon', 'info');
  }

  viewOrganiser(organiserId) {
    app.showNotification('Organiser details view coming soon', 'info');
  }

  viewGame(gameId) {
    window.open(`/game/${gameId}`, '_blank');
  }
}

// Global functions for modals (simplified)
function closeAddFeaturedModal() {
  document.getElementById('addFeaturedModal').style.display = 'none';
}

function closeAddAdModal() {
  document.getElementById('addAdModal').style.display = 'none';
}

function closeAddNewsModal() {
  document.getElementById('addNewsModal').style.display = 'none';
}

// Initialize admin manager
const adminManager = new AdminManager();
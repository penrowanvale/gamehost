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

    // Form submissions
    document.getElementById('addFeaturedForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddFeatured(e);
    });

    document.getElementById('addAdForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddAd(e);
    });

    document.getElementById('addNewsForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddNews(e);
    });

    // Tab switching for featured games
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabType = e.target.dataset.tab;
        this.switchTab(tabType);
      });
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

  switchTab(tabType) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabType}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabType}-tab`).classList.add('active');

    // Load appropriate data
    if (tabType === 'featured') {
      this.loadFeaturedGames();
    } else if (tabType === 'top') {
      this.loadTopGames();
    }
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
      case 'featured':
        await this.loadFeaturedGames();
        await this.loadTopGames();
        break;
      case 'ads':
        await this.loadSponsoredAds();
        break;
      case 'news':
        await this.loadNews();
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

    tbody.innerHTML = organisers.map(organiser => {
      // Determine status: approved, rejected, or pending
      let status, statusClass, actions;
      
      if (organiser.is_approved) {
        status = 'Approved';
        statusClass = 'approved';
        actions = `<button class="btn btn-secondary btn-xs" onclick="adminManager.viewOrganiser('${organiser.id}')">View</button>`;
      } else if (organiser.monthly_fee_paid === null) {
        // Using monthly_fee_paid = null as rejection marker
        status = 'Rejected';
        statusClass = 'rejected';
        actions = `
          <button class="btn btn-success btn-xs" onclick="adminManager.approveOrganiser('${organiser.id}', true)">Approve</button>
          <button class="btn btn-secondary btn-xs" onclick="adminManager.viewOrganiser('${organiser.id}')">View</button>
        `;
      } else {
        status = 'Pending';
        statusClass = 'pending';
        actions = `
          <button class="btn btn-success btn-xs" onclick="adminManager.approveOrganiser('${organiser.id}', true)">Approve</button>
          <button class="btn btn-danger btn-xs" onclick="adminManager.approveOrganiser('${organiser.id}', false)">Reject</button>
        `;
      }
      
      return `
        <tr>
          <td>${organiser.real_name}</td>
          <td>${organiser.organiser_name}</td>
          <td>${organiser.users?.email || 'N/A'}</td>
          <td>${organiser.personal_phone}</td>
          <td><span class="status-badge status-${statusClass}">${status}</span></td>
          <td>${app.formatDate(organiser.created_at)}</td>
          <td>${actions}</td>
        </tr>
      `;
    }).join('');
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

  exportData(type) {
    app.showNotification(`Exporting ${type} data...`, 'info');
    // In a real implementation, this would trigger a download
    window.open(`/api/admin/export/${type}`, '_blank');
  }

  exportAllData() {
    app.showNotification('Exporting all platform data...', 'info');
    // Export all data types
    ['users', 'organisers', 'games', 'participants'].forEach(type => {
      setTimeout(() => {
        window.open(`/api/admin/export/${type}`, '_blank');
      }, 1000);
    });
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

  // Featured Games Management
  showAddFeaturedModal(type) {
    const modal = document.getElementById('addFeaturedModal');
    const title = document.getElementById('featuredModalTitle');
    const form = document.getElementById('addFeaturedForm');
    
    title.textContent = type === 'featured' ? 'Add Featured Game' : 'Add Top Game';
    form.setAttribute('data-type', type);
    
    // Load available games
    this.loadAvailableGames();
    
    modal.style.display = 'block';
  }

  async loadAvailableGames() {
    try {
      const response = await app.apiCall('/admin/games');
      const select = document.getElementById('featuredGameSelect');
      
      select.innerHTML = '<option value="">Select a game...</option>' + 
        response.games.map(game => 
          `<option value="${game.id}">${game.name} (${game.status})</option>`
        ).join('');
        
    } catch (error) {
      console.error('Error loading games:', error);
    }
  }

  // Sponsored Ads Management
  showAddAdModal() {
    const modal = document.getElementById('addAdModal');
    modal.style.display = 'block';
  }

  // News Banner Management
  showAddNewsModal() {
    const modal = document.getElementById('addNewsModal');
    modal.style.display = 'block';
  }

  // Form handlers
  async handleAddFeatured(e) {
    try {
      const form = e.target;
      const formData = new FormData(form);
      const type = form.getAttribute('data-type');
      
      const gameId = formData.get('gameId');
      const order = formData.get('order');
      
      if (!gameId) {
        app.showNotification('Please select a game', 'error');
        return;
      }

      const endpoint = type === 'featured' ? '/admin/featured-games' : '/admin/top-games';
      
      await app.apiCall(endpoint, 'POST', {
        gameId: gameId,
        order: parseInt(order) || 1
      });

      app.showNotification(`Game added to ${type} successfully`, 'success');
      closeAddFeaturedModal();
      
      // Reload the appropriate list
      if (type === 'featured') {
        this.loadFeaturedGames();
      } else {
        this.loadTopGames();
      }
      
    } catch (error) {
      app.showNotification(error.message || 'Failed to add game', 'error');
    }
  }

  async handleAddAd(e) {
    try {
      const formData = new FormData(e.target);
      
      await app.apiCall('/admin/ads', 'POST', {
        title: formData.get('title'),
        bannerImageUrl: formData.get('bannerImageUrl'),
        linkUrl: formData.get('linkUrl'),
        displayOrder: parseInt(formData.get('displayOrder')) || 1
      });

      app.showNotification('Sponsored ad added successfully', 'success');
      closeAddAdModal();
      this.loadSponsoredAds();
      
    } catch (error) {
      app.showNotification(error.message || 'Failed to add sponsored ad', 'error');
    }
  }

  async handleAddNews(e) {
    try {
      const formData = new FormData(e.target);
      
      await app.apiCall('/admin/news-banner', 'POST', {
        text: formData.get('text'),
        linkUrl: formData.get('linkUrl'),
        order: parseInt(formData.get('order')) || 1
      });

      app.showNotification('News item added successfully', 'success');
      closeAddNewsModal();
      this.loadNews();
      
    } catch (error) {
      app.showNotification(error.message || 'Failed to add news item', 'error');
    }
  }

  // Load functions for the new content
  async loadFeaturedGames() {
    try {
      const response = await app.apiCall('/admin/games/featured');
      // Render featured games list
      const list = document.getElementById('featuredGamesList');
      if (list && response.games) {
        list.innerHTML = response.games.map(game => `
          <div class="featured-item">
            <span>${game.name} (Order: ${game.featured_order})</span>
            <button class="btn btn-danger btn-xs" onclick="adminManager.removeFeatured('${game.id}', 'featured')">Remove</button>
          </div>
        `).join('');
      }
    } catch (error) {
      console.error('Error loading featured games:', error);
    }
  }

  async loadTopGames() {
    try {
      const response = await app.apiCall('/admin/games/top');
      // Render top games list
      const list = document.getElementById('topGamesList');
      if (list && response.games) {
        list.innerHTML = response.games.map(game => `
          <div class="featured-item">
            <span>${game.name} (Order: ${game.top_game_order})</span>
            <button class="btn btn-danger btn-xs" onclick="adminManager.removeFeatured('${game.id}', 'top')">Remove</button>
          </div>
        `).join('');
      }
    } catch (error) {
      console.error('Error loading top games:', error);
    }
  }

  async loadSponsoredAds() {
    try {
      const response = await app.apiCall('/admin/ads');
      // Render sponsored ads
      const grid = document.getElementById('adsGrid');
      if (grid && response.ads) {
        grid.innerHTML = response.ads.map(ad => `
          <div class="ad-item">
            <img src="${ad.banner_image_url}" alt="${ad.title || 'Ad'}" style="width: 100px; height: 60px; object-fit: cover;">
            <div>
              <h4>${ad.title || 'Untitled Ad'}</h4>
              <p>Order: ${ad.display_order}</p>
              <p><a href="${ad.link_url}" target="_blank">View Link</a></p>
            </div>
            <button class="btn btn-danger btn-xs" onclick="adminManager.removeAd('${ad.id}')">Remove</button>
          </div>
        `).join('');
      }
    } catch (error) {
      console.error('Error loading sponsored ads:', error);
    }
  }

  async removeAd(adId) {
    try {
      if (!confirm('Are you sure you want to remove this sponsored ad?')) {
        return;
      }

      await app.apiCall(`/admin/ads/${adId}`, 'DELETE');
      app.showNotification('Sponsored ad removed successfully', 'success');
      this.loadSponsoredAds();
      
    } catch (error) {
      app.showNotification(error.message || 'Failed to remove sponsored ad', 'error');
    }
  }

  async loadNews() {
    try {
      const response = await app.apiCall('/admin/news-banner');
      // Render news items
      const list = document.getElementById('newsList');
      if (list && response.newsItems) {
        list.innerHTML = response.newsItems.map(item => `
          <div class="news-item">
            <span>${item.text}</span>
            <button class="btn btn-danger btn-xs" onclick="adminManager.removeNews('${item.id}')">Remove</button>
          </div>
        `).join('');
      }
    } catch (error) {
      console.error('Error loading news items:', error);
    }
  }

  async removeNews(newsId) {
    try {
      if (!confirm('Are you sure you want to remove this news item?')) {
        return;
      }

      await app.apiCall(`/admin/news-banners/${newsId}`, 'DELETE');
      app.showNotification('News item removed successfully', 'success');
      this.loadNews();
      
    } catch (error) {
      app.showNotification(error.message || 'Failed to remove news item', 'error');
    }
  }

  async removeFeatured(gameId, type) {
    try {
      if (!confirm(`Are you sure you want to remove this game from ${type} games?`)) {
        return;
      }

      const updateData = type === 'featured' 
        ? { is_featured: false, featured_order: null }
        : { is_top_game: false, top_game_order: null };

      await app.apiCall(`/admin/games/${gameId}/promotion`, 'PUT', updateData);
      app.showNotification(`Game removed from ${type} successfully`, 'success');
      
      if (type === 'featured') {
        this.loadFeaturedGames();
      } else {
        this.loadTopGames();
      }
      
    } catch (error) {
      app.showNotification(error.message || `Failed to remove game from ${type}`, 'error');
    }
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
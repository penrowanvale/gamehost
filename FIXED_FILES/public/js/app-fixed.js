// Main Application JavaScript - FIXED VERSION

class GamePlatform {
  constructor() {
    this.apiBase = '/api';
    this.token = localStorage.getItem('authToken');
    this.user = null;
    this.init();
  }

  async init() {
    await this.loadAdScripts();
    await this.loadPublicSettings();
    this.setupEventListeners();
    this.checkAuthStatus();
    this.loadPublicData();
    
    // Load notifications for logged-in users
    if (this.token) {
      this.loadNotifications();
      // Check for new notifications every 30 seconds
      setInterval(() => this.loadNotifications(), 30000);
    }
  }

  // FIXED: Enhanced image error handling
  handleImageError(img) {
    console.log('🖼️ Image error for:', img.src);
    img.onerror = null; // Prevent infinite loop
    img.src = '/images/default-game.svg';
    img.alt = 'Game Image';
  }

  // Authentication Methods
  async checkAuthStatus() {
    if (this.token) {
      try {
        const response = await this.apiCall('/auth/verify', 'GET');
        if (response.valid) {
          this.user = response.user;
          this.updateUIForLoggedInUser();
        } else {
          this.logout();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        this.logout();
      }
    }
  }

  async login(identifier, password, userType = 'user') {
    try {
      const response = await this.apiCall('/auth/login', 'POST', {
        identifier,
        password
      });

      if (response.token) {
        this.token = response.token;
        this.user = response.user;
        localStorage.setItem('authToken', this.token);
        
        this.showNotification('Login successful!', 'success');
        this.updateUIForLoggedInUser();
        
        // Redirect based on user role
        setTimeout(() => {
          if (this.user.role === 'admin') {
            window.location.href = '/admin';
          } else if (this.user.role === 'organiser') {
            window.location.href = '/organiser';
          } else {
            window.location.href = '/';
          }
        }, 1000);
        
        return true;
      }
    } catch (error) {
      this.showNotification(error.message || 'Login failed', 'error');
      return false;
    }
  }

  async register(userData, isOrganiser = false) {
    try {
      const endpoint = isOrganiser ? '/auth/register-organiser' : '/auth/register';
      const response = await this.apiCall(endpoint, 'POST', userData);
      
      if (response.token) {
        this.token = response.token;
        this.user = response.user;
        localStorage.setItem('authToken', this.token);
        
        this.showNotification(response.message || 'Registration successful!', 'success');
        this.updateUIForLoggedInUser();
        
        setTimeout(() => {
          if (isOrganiser) {
            window.location.href = '/organiser';
          } else {
            window.location.href = '/';
          }
        }, 1000);
        
        return true;
      } else {
        this.showNotification(response.message || 'Registration successful! Please wait for approval.', 'success');
        return true;
      }
    } catch (error) {
      this.showNotification(error.message || 'Registration failed', 'error');
      return false;
    }
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('authToken');
    this.updateUIForLoggedOutUser();
    if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
      window.location.href = '/';
    }
  }

  // API Methods
  async apiCall(endpoint, method = 'GET', data = null) {
    const url = `${this.apiBase}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (this.token) {
      options.headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'API call failed');
    }

    return result;
  }

  // UI Update Methods
  updateUIForLoggedInUser() {
    const userMenu = document.getElementById('userMenu');
    const authButtons = document.getElementById('authButtons');
    
    if (userMenu && this.user) {
      userMenu.innerHTML = `
        <div class="user-info">
          <span>Welcome, ${this.user.username}</span>
          <div class="user-dropdown">
            ${this.user.role === 'user' ? '<a href="/dashboard" class="btn btn-secondary">Dashboard</a>' : ''}
            <button class="btn btn-secondary" onclick="app.logout()">Logout</button>
          </div>
        </div>
      `;
      userMenu.style.display = 'block';
    }
    
    if (authButtons) {
      authButtons.style.display = 'none';
    }

    // Show/hide user-specific navigation
    const userNavItems = document.querySelectorAll('.user-only-nav');
    userNavItems.forEach(item => {
      if (this.user && this.user.role === 'user') {
        item.style.display = 'inline-block';
      } else {
        item.style.display = 'none';
      }
    });
  }

  updateUIForLoggedOutUser() {
    const userMenu = document.getElementById('userMenu');
    const authButtons = document.getElementById('authButtons');
    
    if (userMenu) {
      userMenu.style.display = 'none';
    }
    
    if (authButtons) {
      authButtons.style.display = 'block';
    }

    // Hide user-specific navigation
    const userNavItems = document.querySelectorAll('.user-only-nav');
    userNavItems.forEach(item => {
      item.style.display = 'none';
    });
  }

  // Public Data Loading
  async loadPublicData() {
    try {
      await Promise.all([
        this.loadSponsoredAds(),
        this.loadNewsBanner(),
        this.loadFeaturedGames(),
        this.loadTopGames()
      ]);
    } catch (error) {
      console.error('Error loading public data:', error);
    }
  }

  async loadSponsoredAds() {
    try {
      const response = await this.apiCall('/users/public/sponsored-ads');
      const adsContainer = document.getElementById('sponsoredAds');
      
      if (adsContainer && response.ads && response.ads.length > 0) {
        const adsGrid = adsContainer.querySelector('.ads-grid');
        adsGrid.innerHTML = response.ads.map(ad => `
          <a href="${ad.link_url}" target="_blank" class="ad-banner">
            <img src="${ad.banner_image_url}" alt="${ad.title || 'Sponsored Ad'}" loading="lazy"
                 onerror="this.onerror=null; this.src='/images/default-game.svg';">
          </a>
        `).join('');
        adsContainer.style.display = 'block';
      } else if (adsContainer) {
        adsContainer.style.display = 'none';
      }
    } catch (error) {
      console.error('Error loading sponsored ads:', error);
    }
  }

  async loadNewsBanner() {
    try {
      const response = await this.apiCall('/users/public/news-banner');
      const newsContainer = document.getElementById('newsBanner');
      
      if (newsContainer && response.newsItems && response.newsItems.length > 0) {
        const ticker = newsContainer.querySelector('.news-ticker');
        ticker.innerHTML = response.newsItems.map(item => `
          <a href="${item.link_url || '#'}" class="news-item">${item.text}</a>
        `).join('');
        newsContainer.style.display = 'block';
      } else if (newsContainer) {
        newsContainer.style.display = 'none';
      }
    } catch (error) {
      console.error('Error loading news banner:', error);
    }
  }

  async loadFeaturedGames() {
    try {
      const response = await this.apiCall('/games/featured');
      this.renderGameCarousel('featuredGames', response.games);
    } catch (error) {
      console.error('Error loading featured games:', error);
    }
  }

  async loadTopGames() {
    try {
      const response = await this.apiCall('/games/top');
      this.renderGameCarousel('topGames', response.games);
    } catch (error) {
      console.error('Error loading top games:', error);
    }
  }

  // FIXED: Enhanced game carousel with better image handling
  renderGameCarousel(containerId, games) {
    const container = document.getElementById(containerId);
    if (!container || !games || games.length === 0) return;

    const gameGrid = container.querySelector('.game-grid');
    gameGrid.innerHTML = games.map(game => `
      <div class="game-card ${game.has_glow_dot ? 'glow-dot' : ''} ${game.has_glow_shadow ? 'glow-shadow' : ''}">
        <img src="${game.banner_image_url || '/images/default-game.svg'}" 
             alt="${game.name}" loading="lazy"
             onerror="this.onerror=null; this.src='/images/default-game.svg'; console.log('🖼️ Image fallback for: ${game.name}');">
        <div class="game-info">
          <h3 class="game-title">${game.name}</h3>
          <div class="game-details">
            <span class="participants">${game.registered_participants || 0} players</span>
            <span class="game-prize">₹${game.total_prize}</span>
          </div>
          <a href="/game/${game.id}" class="btn btn-primary">View Game</a>
        </div>
      </div>
    `).join('');

    this.initializeCarousel(container);
  }

  initializeCarousel(container) {
    const gameGrid = container.querySelector('.game-grid');
    const prevBtn = container.querySelector('.carousel-prev');
    const nextBtn = container.querySelector('.carousel-next');
    
    if (!gameGrid || !prevBtn || !nextBtn) return;

    let scrollAmount = 0;
    const cardWidth = 300; // Approximate card width + gap

    prevBtn.addEventListener('click', () => {
      scrollAmount = Math.max(scrollAmount - cardWidth, 0);
      gameGrid.style.transform = `translateX(-${scrollAmount}px)`;
    });

    nextBtn.addEventListener('click', () => {
      const maxScroll = gameGrid.scrollWidth - gameGrid.clientWidth;
      scrollAmount = Math.min(scrollAmount + cardWidth, maxScroll);
      gameGrid.style.transform = `translateX(-${scrollAmount}px)`;
    });
  }

  async loadPublicSettings() {
    try {
      const response = await this.apiCall('/users/public/settings');
      if (response.settings) {
        // Update platform name and other settings
        const platformName = response.settings.platform_name || 'GameBlast Mobile';
        const tagline = response.settings.platform_tagline || 'Your Ultimate Mobile Gaming Experience';
        const disclaimer = response.settings.disclaimer_text || 'This platform is a SaaS service. We are not responsible for any monetary losses. Play responsibly.';
        
        // Update UI elements
        const logoElements = document.querySelectorAll('.logo');
        logoElements.forEach(el => el.textContent = platformName);
        
        const taglineElements = document.querySelectorAll('.platform-tagline');
        taglineElements.forEach(el => el.textContent = tagline);
        
        const disclaimerElements = document.querySelectorAll('.disclaimer-text');
        disclaimerElements.forEach(el => el.textContent = disclaimer);
      }
    } catch (error) {
      console.error('Error loading public settings:', error);
    }
  }

  async loadAdScripts() {
    try {
      const response = await this.apiCall('/users/public/ad-scripts');
      if (response.scripts) {
        response.scripts.forEach(script => {
          if (script.script_content) {
            const scriptElement = document.createElement('script');
            scriptElement.innerHTML = script.script_content;
            document.head.appendChild(scriptElement);
          }
        });
      }
    } catch (error) {
      console.error('Error loading ad scripts:', error);
    }
  }

  // Utility Methods
  setupEventListeners() {
    // Mobile menu toggle
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (mobileToggle && navMenu) {
      mobileToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
      });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (navMenu && !navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
        navMenu.classList.remove('active');
      }
    });
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(timeString) {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Load and display notifications
  async loadNotifications() {
    if (!this.token) return;

    try {
      const response = await this.apiCall('/users/notifications');
      const notifications = response.notifications || [];
      
      // Show unread notifications
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      if (unreadNotifications.length > 0) {
        this.displayNotificationBadge(unreadNotifications.length);
        
        // Show game live notifications immediately
        const liveGameNotifications = unreadNotifications.filter(n => n.type === 'game_live');
        liveGameNotifications.forEach(notification => {
          this.showGameLiveNotification(notification);
          this.markNotificationAsRead(notification.id);
        });
      }
      
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  // Display notification badge in header
  displayNotificationBadge(count) {
    const userMenu = document.getElementById('userMenu');
    if (!userMenu) return;

    let badge = userMenu.querySelector('.notification-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'notification-badge';
      userMenu.appendChild(badge);
    }

    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }

  // Show game live notification with meeting link
  showGameLiveNotification(notification) {
    const notificationEl = document.createElement('div');
    notificationEl.className = 'live-game-notification';
    notificationEl.innerHTML = `
      <div class="notification-content">
        <h4>🔴 ${notification.title}</h4>
        <p>${notification.message}</p>
        <div class="notification-actions">
          <button class="btn btn-primary" onclick="app.joinGameMeeting('${notification.game_id}')">
            Join Meeting
          </button>
          <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
            Dismiss
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(notificationEl);

    // Auto-remove after 30 seconds
    setTimeout(() => {
      if (notificationEl.parentElement) {
        notificationEl.remove();
      }
    }, 30000);
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId) {
    try {
      await this.apiCall(`/users/notifications/${notificationId}/read`, 'PUT');
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Join game meeting
  async joinGameMeeting(gameId) {
    try {
      const response = await this.apiCall(`/games/${gameId}`);
      const game = response.game;
      
      if (game.zoom_link) {
        window.open(game.zoom_link, '_blank');
        this.showNotification('Opening meeting link...', 'success');
      } else {
        this.showNotification('Meeting link not available', 'error');
      }
    } catch (error) {
      this.showNotification('Failed to get meeting link', 'error');
    }
  }
}

// Initialize the application
const app = new GamePlatform();

// Export for use in other files
window.app = app;
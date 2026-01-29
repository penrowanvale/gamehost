

class GamesManager {
  constructor() {
    this.games = [];
    this.filteredGames = [];
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.init();
  }

  getValidImageUrl(imageUrl, size = 'w1000') {
    if (!imageUrl) return '/images/default-game.svg';

    if (imageUrl.startsWith('/images/') && imageUrl.endsWith('.jpg')) {
      return imageUrl.replace('.jpg', '.svg');
    }

    if (imageUrl.startsWith('http')) {
      
      if (imageUrl.includes('ibb.co/')) {
        
        const match = imageUrl.match(/ibb\.co\/([a-zA-Z0-9]+)/);
        if (match) {
          
          return `https://i.ibb.co/${match[1]}.jpg`;
        }
        console.warn('Invalid ibb.co URL:', imageUrl);
        return '/images/default-game.svg';
      }

      if (imageUrl.match(/^[a-zA-Z0-9_-]{20,}$/)) {
        
        return `https://drive.google.com/thumbnail?id=${imageUrl}&sz=${size}`;
      }

      if (imageUrl.includes('drive.google.com')) {
        
        let fileId = null;

        const match1 = imageUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
        if (match1) fileId = match1[1];

        const match2 = imageUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match2 && !fileId) fileId = match2[1];

        const match3 = imageUrl.match(/[?&]id=([a-zA-Z0-9-_]+)/);
        if (match3 && !fileId) fileId = match3[1];
        
        if (fileId) {
          
          return `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
        }
        console.warn('Could not extract file ID from Google Drive URL:', imageUrl);
        return '/images/default-game.svg';
      }

      if (imageUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)) {
        return imageUrl; 
      }
      
      console.warn('Invalid image URL format:', imageUrl);
      return '/images/default-game.svg';
    }
    
    return imageUrl;
  }

  async init() {
    this.setupEventListeners();
    await this.loadGames();
  }

  setupEventListeners() {
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const status = e.target.dataset.status;
        this.setFilter(status);
      });
    });

    const searchInput = document.getElementById('searchGames');
    const searchBtn = document.querySelector('.search-btn');
    
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.filterGames();
    });

    searchBtn.addEventListener('click', () => {
      this.filterGames();
    });

    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.filterGames();
      }
    });
  }

  async loadGames() {
    try {
      this.showLoading(true);
      
      console.log('🎮 Loading games...');
      console.log('👤 Current user:', app.user);

      const response = await app.apiCall('/games/public');
      console.log('📊 Public games API response:', response);
      
      this.games = response.games || [];
      this.filteredGames = [...this.games];
      
      console.log('✅ Loaded games:', this.games.length);

      if (this.games.length > 0) {
        console.log('🎯 Games by organiser:');
        this.games.forEach(game => {
          console.log(`- ${game.name} by ${game.organisers?.organiser_name || 'Unknown'} (Status: ${game.status})`);
        });
      }
      
      if (this.games.length === 0) {
        console.log('🔄 No games found, checking today games as fallback...');
        try {
          const todayResponse = await app.apiCall('/games/today');
          console.log('📅 Today games fallback response:', todayResponse);
          this.games = todayResponse.games || [];
          this.filteredGames = [...this.games];
        } catch (todayError) {
          console.log('❌ Today games also failed:', todayError);
        }
      }
      
      this.renderGames();
      this.showLoading(false);
      
    } catch (error) {
      console.error('💥 Error loading games:', error);
      app.showNotification('Failed to load games. Please try again later.', 'error');
      this.showNoGames();
      this.showLoading(false);
    }
  }

  setFilter(status) {
    this.currentFilter = status;

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-status="${status}"]`).classList.add('active');
    
    this.filterGames();
  }

  filterGames() {
    this.filteredGames = this.games.filter(game => {
      
      const statusMatch = this.currentFilter === 'all' || game.status === this.currentFilter;

      const searchMatch = !this.searchQuery || 
        game.name.toLowerCase().includes(this.searchQuery) ||
        (game.organisers && game.organisers.organiser_name.toLowerCase().includes(this.searchQuery));
      
      return statusMatch && searchMatch;
    });
    
    this.renderGames();
  }

  renderGames() {
    const gamesGrid = document.getElementById('gamesGrid');
    const noGamesElement = document.getElementById('noGames');
    
    if (this.filteredGames.length === 0) {
      gamesGrid.innerHTML = '';
      noGamesElement.style.display = 'block';
      return;
    }
    
    noGamesElement.style.display = 'none';
    
    gamesGrid.innerHTML = this.filteredGames.map(game => this.createGameCard(game)).join('');

    document.querySelectorAll('.game-card-large').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.whatsapp-btn') && !e.target.closest('.btn-view-game')) {
          const gameId = card.dataset.gameId;
          this.showGameDetails(gameId);
        }
      });
    });
  }

  createGameCard(game) {
    const statusClass = `status-${game.status}`;
    const statusText = game.status.charAt(0).toUpperCase() + game.status.slice(1);
    
    return `
      <div class="game-card-large ${game.has_glow_dot ? 'glow-dot' : ''} ${game.has_glow_shadow ? 'glow-shadow' : ''}" 
           data-game-id="${game.id}">
        <div class="game-banner">
          <img src="${this.getValidImageUrl(game.banner_image_url)}" 
               alt="${game.name}" loading="lazy" 
               onerror="this.onerror=null; this.src='/images/default-game.svg'; console.log('🖼️ Image fallback for: ${game.name}');">
          <div class="game-status ${statusClass}">${statusText}</div>
        </div>
        
        <div class="game-content">
          <h3 class="game-title">${game.name}</h3>
          
          <div class="game-meta">
            <div class="meta-item">
              <span class="meta-label">Prize Pool</span>
              <span class="meta-value prize">₹${app.formatCurrency(game.total_prize).replace('₹', '')}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Players</span>
              <span class="meta-value">${game.registered_participants || 0}</span>
            </div>
          </div>
          
          <div class="game-details">
            <div class="detail-item">
              <div class="detail-label">Date</div>
              <div class="detail-value">${app.formatDate(game.game_date)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Time</div>
              <div class="detail-value">${game.game_time ? app.formatTime(game.game_time) : 'TBA'}</div>
            </div>
          </div>
          
          ${game.organisers ? `
            <div class="organiser-info">
              <span class="organiser-name">by ${game.organisers.organiser_name}</span>
              ${game.organisers.whatsapp_number ? `
                <a href="https://wa.me/${game.organisers.whatsapp_number.replace(/[^0-9]/g, '')}" 
                   class="whatsapp-btn" target="_blank">
                  📱 Contact
                </a>
              ` : ''}
            </div>
          ` : ''}
          
          <div class="game-actions">
            <a href="/game/${game.id}" class="btn-view-game">
              ${game.status === 'live' ? 'Join Now' : 'View Details'}
            </a>
          </div>
        </div>
      </div>
    `;
  }

  async showGameDetails(gameId) {
    try {
      const response = await app.apiCall(`/games/${gameId}`);
      const game = response.game;
      
      const modalContent = document.getElementById('gameModalContent');
      modalContent.innerHTML = `
          <img src="${this.getValidImageUrl(game.banner_image_url)}"
             alt="${game.name}" class="modal-game-banner">
        
        <h2 class="modal-game-title">${game.name}</h2>
        
        <div class="modal-game-meta">
          <div class="meta-item">
            <span class="meta-label">Prize Pool</span>
            <span class="meta-value prize">₹${app.formatCurrency(game.total_prize).replace('₹', '')}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Players Registered</span>
            <span class="meta-value">${game.registered_participants || 0}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Date & Time</span>
            <span class="meta-value">${app.formatDate(game.game_date)} at ${game.game_time ? app.formatTime(game.game_time) : 'TBA'}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Status</span>
            <span class="meta-value status-${game.status}">${game.status.toUpperCase()}</span>
          </div>
        </div>
        
        <div class="game-pricing">
          <h4>Sheet Pricing:</h4>
          <ul>
            <li>1 Sheet: ₹${game.price_per_sheet_1}</li>
            <li>2 Sheets: ₹${game.price_per_sheet_2} each</li>
            <li>3+ Sheets: ₹${game.price_per_sheet_3_plus} each</li>
          </ul>
        </div>
        
        ${game.organisers ? `
          <div class="organiser-details">
            <h4>Organiser: ${game.organisers.organiser_name}</h4>
            ${game.organisers.whatsapp_number ? `
              <a href="https://wa.me/${game.organisers.whatsapp_number.replace(/[^0-9]/g, '')}" 
                 class="whatsapp-btn" target="_blank">
                📱 Contact Organiser
              </a>
            ` : ''}
          </div>
        ` : ''}
        
        <div class="modal-actions">
          <a href="/game/${game.id}" class="btn btn-primary">
            ${game.status === 'live' ? 'Join Game' : 'View Full Details'}
          </a>
          <button onclick="closeGameModal()" class="btn btn-secondary">Close</button>
        </div>
      `;
      
      document.getElementById('gameModal').style.display = 'block';
      
    } catch (error) {
      console.error('Error loading game details:', error);
      app.showNotification('Failed to load game details', 'error');
    }
  }

  showLoading(show) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const gamesGrid = document.getElementById('gamesGrid');
    
    if (show) {
      loadingSpinner.style.display = 'block';
      gamesGrid.style.display = 'none';
    } else {
      loadingSpinner.style.display = 'none';
      gamesGrid.style.display = 'grid';
    }
  }

  showNoGames() {
    document.getElementById('noGames').style.display = 'block';
    document.getElementById('gamesGrid').style.display = 'none';
  }
}

function closeGameModal() {
  document.getElementById('gameModal').style.display = 'none';
}

window.onclick = function(event) {
  const modal = document.getElementById('gameModal');
  if (event.target === modal) {
    closeGameModal();
  }
}

const gamesManager = new GamesManager();
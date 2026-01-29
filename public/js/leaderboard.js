

class LeaderboardManager {
  constructor() {
    this.winners = [];
    this.filteredWinners = [];
    this.currentSort = 'recent';
    this.searchQuery = '';
    this.currentPage = 1;
    this.winnersPerPage = 20;
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadLeaderboard();
    await this.loadStatistics();
  }

  setupEventListeners() {
    
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
      sortFilter.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        this.sortWinners();
        this.renderWinnersTable();
      });
    }

    const searchInput = document.getElementById('searchWinners');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.filterWinners();
        this.renderWinnersTable();
      });
    }

    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        this.loadMoreWinners();
      });
    }
  }

  async loadLeaderboard() {
    try {
      this.showLoading(true);
      
      const response = await app.apiCall('/users/leaderboard');
      this.winners = response.winners || [];
      this.filteredWinners = [...this.winners];
      
      this.renderPodium();
      this.renderWinnersTable();
      this.showContent();
      
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      this.showNoWinners();
    } finally {
      this.showLoading(false);
    }
  }

  async loadStatistics() {
    try {

      const totalWinners = this.winners.length;
      const totalPrizes = this.winners.reduce((sum, winner) => sum + parseFloat(winner.prize_amount), 0);

      document.getElementById('totalWinners').textContent = totalWinners.toLocaleString();
      document.getElementById('totalPrizes').textContent = `₹${totalPrizes.toLocaleString()}`;

      document.getElementById('totalGames').textContent = '156';
      document.getElementById('totalPlayers').textContent = '2,847';
      
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }

  renderPodium() {
    if (this.winners.length === 0) return;

    const topWinners = [...this.winners]
      .sort((a, b) => parseFloat(b.prize_amount) - parseFloat(a.prize_amount))
      .slice(0, 3);

    this.updatePodiumPlace('firstPlace', topWinners[0], 1);
    this.updatePodiumPlace('secondPlace', topWinners[1], 2);
    this.updatePodiumPlace('thirdPlace', topWinners[2], 3);

    document.getElementById('podiumSection').style.display = 'block';
  }

  updatePodiumPlace(elementId, winner, position) {
    const element = document.getElementById(elementId);
    if (!element || !winner) return;

    const nameElement = element.querySelector('.winner-name');
    const prizeElement = element.querySelector('.winner-prize');
    const gameElement = element.querySelector('.winner-game');

    nameElement.textContent = winner.users?.username || 'Unknown';
    prizeElement.textContent = `₹${parseFloat(winner.prize_amount).toLocaleString()}`;
    gameElement.textContent = winner.games?.name || 'Unknown Game';

    element.style.cursor = 'pointer';
    element.onclick = () => this.showWinnerDetails(winner);
  }

  sortWinners() {
    switch (this.currentSort) {
      case 'recent':
        this.filteredWinners.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'prize-high':
        this.filteredWinners.sort((a, b) => parseFloat(b.prize_amount) - parseFloat(a.prize_amount));
        break;
      case 'prize-low':
        this.filteredWinners.sort((a, b) => parseFloat(a.prize_amount) - parseFloat(b.prize_amount));
        break;
    }
  }

  filterWinners() {
    if (!this.searchQuery) {
      this.filteredWinners = [...this.winners];
    } else {
      this.filteredWinners = this.winners.filter(winner => {
        const username = winner.users?.username?.toLowerCase() || '';
        const gameName = winner.games?.name?.toLowerCase() || '';
        const organiserName = winner.games?.organisers?.organiser_name?.toLowerCase() || '';
        
        return username.includes(this.searchQuery) ||
               gameName.includes(this.searchQuery) ||
               organiserName.includes(this.searchQuery);
      });
    }
    
    this.sortWinners();
    this.currentPage = 1;
  }

  renderWinnersTable() {
    const tableBody = document.getElementById('winnersTableBody');
    if (!tableBody) return;

    const startIndex = 0;
    const endIndex = this.currentPage * this.winnersPerPage;
    const winnersToShow = this.filteredWinners.slice(startIndex, endIndex);

    if (winnersToShow.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
            No winners found matching your criteria.
          </td>
        </tr>
      `;
      this.hideLoadMore();
      return;
    }

    tableBody.innerHTML = winnersToShow.map((winner, index) => `
      <tr onclick="leaderboardManager.showWinnerDetails(${JSON.stringify(winner).replace(/"/g, '&quot;')})">
        <td class="rank-cell">#${index + 1}</td>
        <td class="winner-cell">${winner.users?.username || 'Unknown'}</td>
        <td class="game-cell">${winner.games?.name || 'Unknown Game'}</td>
        <td class="prize-cell">₹${parseFloat(winner.prize_amount).toLocaleString()}</td>
        <td class="organiser-cell">${winner.games?.organisers?.organiser_name || 'Unknown'}</td>
        <td class="date-cell">${app.formatDate(winner.created_at)}</td>
      </tr>
    `).join('');

    if (endIndex < this.filteredWinners.length) {
      this.showLoadMore();
    } else {
      this.hideLoadMore();
    }

    document.getElementById('winnersTableSection').style.display = 'block';
  }

  loadMoreWinners() {
    this.currentPage++;
    this.renderWinnersTable();
  }

  showLoadMore() {
    const container = document.getElementById('loadMoreContainer');
    if (container) {
      container.style.display = 'block';
    }
  }

  hideLoadMore() {
    const container = document.getElementById('loadMoreContainer');
    if (container) {
      container.style.display = 'none';
    }
  }

  showWinnerDetails(winner) {
    const modalContent = document.getElementById('winnerModalContent');
    if (!modalContent) return;

    modalContent.innerHTML = `
      <h2>🏆 Winner Details</h2>
      <div class="winner-details">
        <div class="detail-row">
          <span class="detail-label">Winner:</span>
          <span class="detail-value">${winner.users?.username || 'Unknown'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Game:</span>
          <span class="detail-value">${winner.games?.name || 'Unknown Game'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Prize Amount:</span>
          <span class="detail-value">₹${parseFloat(winner.prize_amount).toLocaleString()}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Position:</span>
          <span class="detail-value">${this.getPositionText(winner.position)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Organiser:</span>
          <span class="detail-value">${winner.games?.organisers?.organiser_name || 'Unknown'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date Won:</span>
          <span class="detail-value">${app.formatDate(winner.created_at)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Game Date:</span>
          <span class="detail-value">${app.formatDate(winner.games?.game_date)}</span>
        </div>
      </div>
      <div style="text-align: center; margin-top: 25px;">
        <button onclick="closeWinnerModal()" class="btn btn-primary">Close</button>
      </div>
    `;

    document.getElementById('winnerModal').style.display = 'block';
  }

  getPositionText(position) {
    switch (position) {
      case 1: return '🥇 First Place';
      case 2: return '🥈 Second Place';
      case 3: return '🥉 Third Place';
      default: return `#${position}`;
    }
  }

  showLoading(show) {
    const loadingContainer = document.getElementById('loadingContainer');
    if (loadingContainer) {
      loadingContainer.style.display = show ? 'block' : 'none';
    }
  }

  showContent() {
    const sections = ['podiumSection', 'winnersTableSection'];
    sections.forEach(sectionId => {
      const section = document.getElementById(sectionId);
      if (section) {
        section.style.display = 'block';
      }
    });
  }

  showNoWinners() {
    const noWinners = document.getElementById('noWinners');
    if (noWinners) {
      noWinners.style.display = 'block';
    }

    ['podiumSection', 'winnersTableSection'].forEach(sectionId => {
      const section = document.getElementById(sectionId);
      if (section) {
        section.style.display = 'none';
      }
    });
  }
}

function closeWinnerModal() {
  document.getElementById('winnerModal').style.display = 'none';
}

window.onclick = function(event) {
  const modal = document.getElementById('winnerModal');
  if (event.target === modal) {
    closeWinnerModal();
  }
}

const leaderboardManager = new LeaderboardManager();
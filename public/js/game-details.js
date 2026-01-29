

class GameDetailsManager {
  constructor() {
    this.gameId = null;
    this.game = null;
    this.selectedSheets = [];
    this.selectedSheetsCount = 0;
    this.pricePerSheet = 0;
    this.totalAmount = 0;
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
    this.gameId = this.getGameIdFromURL();
    if (this.gameId) {
      await this.loadGameDetails();
      await this.loadSoldSheets();
    } else {
      this.showError('Game not found');
    }
    this.setupEventListeners();
  }

  getGameIdFromURL() {
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.length - 1];
  }

  setupEventListeners() {
    
    document.querySelectorAll('.pricing-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const sheets = parseInt(e.currentTarget.dataset.sheets);
        this.selectPricingOption(sheets);
      });
    });

    document.getElementById('decreaseSheets')?.addEventListener('click', () => {
      this.changeSheetCount(-1);
    });

    document.getElementById('increaseSheets')?.addEventListener('click', () => {
      this.changeSheetCount(1);
    });

    document.getElementById('proceedToPayment')?.addEventListener('click', () => {
      this.proceedToPayment();
    });

    document.getElementById('paymentVerificationForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitPaymentVerification();
    });

    document.getElementById('contactOrganiserBtn')?.addEventListener('click', () => {
      this.contactOrganiser();
    });

    document.getElementById('joinMeetingBtn')?.addEventListener('click', () => {
      this.joinMeeting();
    });
  }

  async loadGameDetails() {
    try {
      this.showLoading(true);
      
      console.log('🎮 Loading game details for ID:', this.gameId);
      const response = await app.apiCall(`/games/${this.gameId}`);
      console.log('📊 Game details response:', response);
      
      this.game = response.game;
      
      if (this.game) {
        console.log('🎯 Game data:', this.game);
        console.log('🏢 Organiser data:', this.game.organisers);
        console.log('🖼️ Banner URL:', this.game.banner_image_url);
      }
      
      this.renderGameDetails();
      
      this.showLoading(false);
      
    } catch (error) {
      console.error('Error loading game details:', error);
      this.showError('Failed to load game details');
    }
  }

  renderGameDetails() {
    if (!this.game) return;

    document.title = `${this.game.name} - GameBlast Mobile`;

    const bannerImg = document.getElementById('gameBanner');
    bannerImg.src = this.getValidImageUrl(this.game.banner_image_url);
    bannerImg.onerror = () => {
      bannerImg.onerror = null;
      bannerImg.src = '/images/default-game.svg';
      console.log('🖼️ Banner image fallback for:', this.game.name);
    };
    document.getElementById('gameTitle').textContent = this.game.name;

    const statusBadge = document.getElementById('gameStatusBadge');
    statusBadge.textContent = this.game.status.toUpperCase();
    statusBadge.className = `game-status-badge status-${this.game.status}`;

    document.getElementById('gamePrize').textContent = `₹${this.game.total_prize.toLocaleString()}`;
    document.getElementById('gameParticipants').textContent = this.game.registered_participants || 0;
    document.getElementById('gameDate').textContent = app.formatDate(this.game.game_date);
    document.getElementById('gameTime').textContent = this.game.game_time ? app.formatTime(this.game.game_time) : 'TBA';

    console.log('🏢 Game organiser data:', this.game.organisers);
    const organiserNameEl = document.getElementById('organiserName');
    if (this.game.organisers && organiserNameEl) {
      organiserNameEl.textContent = this.game.organisers.organiser_name || 'Unknown Organiser';

      const contactBtn = document.getElementById('contactOrganiserBtn');
      if (this.game.organisers.whatsapp_number && contactBtn) {
        contactBtn.style.display = 'inline-block';
        contactBtn.onclick = () => this.contactOrganiser();
      }

      const meetingBtn = document.getElementById('joinMeetingBtn');
      if (this.game.status === 'live' && this.game.zoom_link && meetingBtn) {
        meetingBtn.style.display = 'inline-block';
        meetingBtn.onclick = () => this.joinMeeting();
      }
    } else {
      console.warn('⚠️ No organiser data found for game:', this.game.id);
      if (organiserNameEl) {
        organiserNameEl.textContent = 'Organiser information not available';
      }
    }

    document.getElementById('price1Sheet').textContent = `₹${this.game.price_per_sheet_1}`;
    document.getElementById('price2Sheets').textContent = `₹${this.game.price_per_sheet_2}`;
    document.getElementById('price3Sheets').textContent = `₹${this.game.price_per_sheet_3_plus}`;

    if (this.game.status === 'ended') {
      document.getElementById('sheetSelectionSection').style.display = 'none';
    }
  }

  selectPricingOption(sheets) {
    
    document.querySelectorAll('.pricing-card').forEach(card => {
      card.classList.remove('selected');
    });
    document.querySelector(`[data-sheets="${sheets}"]`).classList.add('selected');

    if (sheets === 3) {
      
      this.showSheetSelector();
      this.selectedSheetsCount = 3;
    } else {
      
      this.hideSheetSelector();
      this.selectedSheetsCount = sheets;
    }

    this.updatePricing();
    this.updateSelectionSummary();
  }

  showSheetSelector() {
    const selector = document.getElementById('sheetSelector');
    selector.style.display = 'block';
    document.getElementById('sheetCount').textContent = '3';
  }

  hideSheetSelector() {
    document.getElementById('sheetSelector').style.display = 'none';
  }

  changeSheetCount(delta) {
    const currentCount = parseInt(document.getElementById('sheetCount').textContent);
    const newCount = Math.max(3, currentCount + delta);
    
    document.getElementById('sheetCount').textContent = newCount;
    this.selectedSheetsCount = newCount;
    
    this.updatePricing();
    this.updateSelectionSummary();
  }

  updatePricing() {
    if (this.selectedSheetsCount === 1) {
      this.pricePerSheet = this.game.price_per_sheet_1;
      this.totalAmount = this.pricePerSheet;
    } else if (this.selectedSheetsCount === 2) {
      this.pricePerSheet = this.game.price_per_sheet_2;
      this.totalAmount = this.pricePerSheet * 2;
    } else {
      this.pricePerSheet = this.game.price_per_sheet_3_plus;
      this.totalAmount = this.pricePerSheet * this.selectedSheetsCount;
    }

    const totalAmountElement = document.getElementById('totalAmount');
    if (totalAmountElement) {
      totalAmountElement.textContent = `₹${this.totalAmount.toLocaleString()}`;
    }
  }

  async loadSoldSheets() {
    try {
      console.log(`🔍 LOADING SOLD SHEETS for game ${this.gameId}`);
      const response = await app.apiCall(`/games/${this.gameId}/sold-sheets`);
      
      console.log(`📊 SOLD SHEETS API RESPONSE:`, response);
      
      this.soldSheets = response.soldSheets || [];
      this.approvedSheets = response.approvedSheets || [];
      this.reservedSheets = response.reservedSheets || [];
      
      console.log('✅ Sheet status loaded:', {
        total: this.soldSheets.length,
        approved: this.approvedSheets.length,
        reserved: this.reservedSheets.length,
        soldSheetNumbers: this.soldSheets,
        approvedSheetNumbers: this.approvedSheets,
        reservedSheetNumbers: this.reservedSheets
      });

      this.generateSheetGrid();
    } catch (error) {
      console.error('❌ Error loading sold sheets:', error);
      this.soldSheets = [];
      this.approvedSheets = [];
      this.reservedSheets = [];

      this.generateSheetGrid();
    }
  }

  generateSheetGrid() {
    const sheetGrid = document.getElementById('sheetGrid');
    if (!sheetGrid) {
      console.error('Sheet grid element not found');
      return;
    }

    if (!this.game) {
      console.error('Game data not loaded yet');
      return;
    }

    const totalSheets = this.game.total_sheets || 1000;
    const sheetNumbers = [];
    
    for (let i = 1; i <= totalSheets; i++) {
      sheetNumbers.push(i);
    }

    console.log('Generating sheet grid with:', {
      totalSheets,
      soldSheets: this.soldSheets?.length || 0,
      approvedSheets: this.approvedSheets?.length || 0,
      reservedSheets: this.reservedSheets?.length || 0
    });

    sheetGrid.innerHTML = sheetNumbers.map(num => {
      const isUnavailable = this.soldSheets && this.soldSheets.includes(num);
      const isApproved = this.approvedSheets && this.approvedSheets.includes(num);
      const isReserved = this.reservedSheets && this.reservedSheets.includes(num);
      
      let statusClass = '';
      let statusIndicator = '';
      let clickHandler = `onclick="gameDetails.toggleSheetSelection(${num})"`;
      
      if (isApproved) {
        statusClass = 'sold';
        statusIndicator = '<span class="sold-indicator">SOLD</span>';
        clickHandler = '';
      } else if (isReserved) {
        statusClass = 'reserved';
        statusIndicator = '<span class="reserved-indicator">RESERVED</span>';
        clickHandler = '';
      }

      if (num <= 5) {
        console.log(`🎯 Sheet ${num} status:`, {
          isUnavailable,
          isApproved,
          isReserved,
          statusClass,
          soldSheets: this.soldSheets?.slice(0, 10),
          approvedSheets: this.approvedSheets?.slice(0, 10),
          reservedSheets: this.reservedSheets?.slice(0, 10)
        });
      }
      
      return `
        <div class="sheet-number ${statusClass}" data-sheet="${num}" ${clickHandler}>
          ${num}
          ${statusIndicator}
        </div>
      `;
    }).join('');
    
    console.log('Sheet grid generated with', sheetNumbers.length, 'sheets');
  }

  toggleSheetSelection(sheetNumber) {
    
    const sheetNum = parseInt(sheetNumber);
    const sheetElement = document.querySelector(`[data-sheet="${sheetNum}"]`);

    if (this.soldSheets && this.soldSheets.includes(sheetNum)) {
      if (this.approvedSheets && this.approvedSheets.includes(sheetNum)) {
        app.showNotification(`Sheet ${sheetNum} is already sold and not available`, 'error');
      } else if (this.reservedSheets && this.reservedSheets.includes(sheetNum)) {
        app.showNotification(`Sheet ${sheetNum} is currently reserved by another user`, 'warning');
      }
      return;
    }
    
    if (this.selectedSheets.includes(sheetNum)) {
      
      this.selectedSheets = this.selectedSheets.filter(num => num !== sheetNum);
      sheetElement.classList.remove('selected');
    } else {
      
      if (this.selectedSheets.length < this.selectedSheetsCount) {
        this.selectedSheets.push(sheetNum);
        sheetElement.classList.add('selected');
      } else {
        app.showNotification(`You can only select ${this.selectedSheetsCount} sheets`, 'warning');
        return;
      }
    }

    this.updateSelectionSummary();
  }

  updateSelectionSummary() {
    const summary = document.getElementById('selectionSummary');
    const selectedCount = document.getElementById('selectedSheetsCount');
    const summaryTotal = document.getElementById('summaryTotalAmount');

    if (this.selectedSheetsCount > 0) {
      summary.style.display = 'block';
      selectedCount.textContent = this.selectedSheetsCount;
      summaryTotal.textContent = `₹${this.totalAmount.toLocaleString()}`;
    } else {
      summary.style.display = 'none';
    }
  }

  proceedToPayment() {
    
    if (!app.user) {
      this.showLoginRequired();
      return;
    }

    if (this.selectedSheets.length !== this.selectedSheetsCount) {
      app.showNotification(`Please select exactly ${this.selectedSheetsCount} sheets`, 'warning');
      return;
    }

    if (this.game.status === 'ended') {
      app.showNotification('This game has ended', 'error');
      return;
    }

    this.showPaymentModal();
  }

  showPaymentModal() {
    const modal = document.getElementById('paymentModal');

    if (this.game.payment_qr_code_url) {
      document.getElementById('paymentQR').src = this.getValidImageUrl(this.game.payment_qr_code_url);
    }

    document.getElementById('paymentSheetsCount').textContent = this.selectedSheetsCount;
    document.getElementById('paymentTotalAmount').textContent = `₹${this.totalAmount.toLocaleString()}`;

    modal.style.display = 'block';
  }

  async submitPaymentVerification() {
    const form = document.getElementById('paymentVerificationForm');
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
      const utrId = formData.get('utrId');
      const paymentPhone = formData.get('paymentPhone');

      if (!utrId || !paymentPhone) {
        throw new Error('Please fill in all required fields');
      }

      const response = await app.apiCall(`/games/${this.gameId}/register`, 'POST', {
        sheetsSelected: this.selectedSheetsCount,
        utrId: utrId,
        paymentPhone: paymentPhone,
        selectedSheetNumbers: this.selectedSheets
      });

      app.showNotification(response.message, 'success');
      this.closePaymentModal();

      setTimeout(() => {
        window.location.href = '/games';
      }, 2000);

    } catch (error) {
      app.showNotification(error.message, 'error');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  }

  contactOrganiser() {
    if (this.game.organisers && this.game.organisers.whatsapp_number) {
      const phoneNumber = this.game.organisers.whatsapp_number.replace(/[^0-9]/g, '');
      const message = encodeURIComponent(`Hi! I'm interested in joining "${this.game.name}" game.`);
      const whatsappUrl = `https:
      window.open(whatsappUrl, '_blank');
    }
  }

  joinMeeting() {
    if (this.game.zoom_link) {
      window.open(this.game.zoom_link, '_blank');
    }
  }

  showLoginRequired() {
    document.getElementById('loginRequiredModal').style.display = 'block';
  }

  closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';

    document.getElementById('paymentVerificationForm').reset();
  }

  showLoading(show) {
    const loadingScreen = document.getElementById('loadingScreen');
    const gameContainer = document.getElementById('gameDetailsContainer');
    
    if (show) {
      loadingScreen.style.display = 'flex';
      gameContainer.style.display = 'none';
    } else {
      loadingScreen.style.display = 'none';
      gameContainer.style.display = 'block';
    }
  }

  showError(message) {
    this.showLoading(false);
    app.showNotification(message, 'error');

    setTimeout(() => {
      window.location.href = '/games';
    }, 3000);
  }
}

function closePaymentModal() {
  gameDetails.closePaymentModal();
}

function closeLoginRequiredModal() {
  document.getElementById('loginRequiredModal').style.display = 'none';
}

window.onclick = function(event) {
  const paymentModal = document.getElementById('paymentModal');
  const loginModal = document.getElementById('loginRequiredModal');
  
  if (event.target === paymentModal) {
    closePaymentModal();
  }
  if (event.target === loginModal) {
    closeLoginRequiredModal();
  }
}

const gameDetails = new GameDetailsManager();
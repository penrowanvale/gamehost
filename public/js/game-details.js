// Game Details Page JavaScript

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

  init() {
    this.gameId = this.getGameIdFromURL();
    if (this.gameId) {
      this.loadGameDetails();
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
    // Pricing card selection
    document.querySelectorAll('.pricing-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const sheets = parseInt(e.currentTarget.dataset.sheets);
        this.selectPricingOption(sheets);
      });
    });

    // Sheet counter
    document.getElementById('decreaseSheets')?.addEventListener('click', () => {
      this.changeSheetCount(-1);
    });

    document.getElementById('increaseSheets')?.addEventListener('click', () => {
      this.changeSheetCount(1);
    });

    // Proceed to payment
    document.getElementById('proceedToPayment')?.addEventListener('click', () => {
      this.proceedToPayment();
    });

    // Payment form
    document.getElementById('paymentVerificationForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitPaymentVerification();
    });

    // Contact organiser
    document.getElementById('contactOrganiserBtn')?.addEventListener('click', () => {
      this.contactOrganiser();
    });

    // Join meeting
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
      this.generateSheetGrid();
      this.showLoading(false);
      
    } catch (error) {
      console.error('Error loading game details:', error);
      this.showError('Failed to load game details');
    }
  }

  renderGameDetails() {
    if (!this.game) return;

    // Update page title
    document.title = `${this.game.name} - GameBlast Mobile`;

    // Game banner and basic info - FIXED: Better image handling
    const bannerImg = document.getElementById('gameBanner');
    bannerImg.src = this.game.banner_image_url || '/images/default-game.svg';
    bannerImg.onerror = () => {
      bannerImg.onerror = null;
      bannerImg.src = '/images/default-game.svg';
      console.log('🖼️ Banner image fallback for:', this.game.name);
    };
    document.getElementById('gameTitle').textContent = this.game.name;
    
    // Status badge
    const statusBadge = document.getElementById('gameStatusBadge');
    statusBadge.textContent = this.game.status.toUpperCase();
    statusBadge.className = `game-status-badge status-${this.game.status}`;

    // Meta information
    document.getElementById('gamePrize').textContent = `₹${this.game.total_prize.toLocaleString()}`;
    document.getElementById('gameParticipants').textContent = this.game.registered_participants || 0;
    document.getElementById('gameDate').textContent = app.formatDate(this.game.game_date);
    document.getElementById('gameTime').textContent = this.game.game_time ? app.formatTime(this.game.game_time) : 'TBA';

    // FIXED: Enhanced organiser info display
    console.log('🏢 Game organiser data:', this.game.organisers);
    const organiserNameEl = document.getElementById('organiserName');
    const organiserCardEl = document.querySelector('.organiser-card');
    
    if (this.game.organisers && organiserNameEl) {
      organiserNameEl.textContent = this.game.organisers.organiser_name || 'Unknown Organiser';
      
      // Show organiser card
      if (organiserCardEl) {
        organiserCardEl.style.display = 'block';
      }
      
      // Contact organiser button
      const contactBtn = document.getElementById('contactOrganiserBtn');
      if (this.game.organisers.whatsapp_number && contactBtn) {
        contactBtn.style.display = 'inline-block';
        contactBtn.onclick = () => this.contactOrganiser();
      }
      
      // Meeting button (show only if game is live and user is registered)
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
      // Hide organiser card if no data
      if (organiserCardEl) {
        organiserCardEl.style.display = 'none';
      }
    }

    // Pricing information
    document.getElementById('price1Sheet').textContent = `₹${this.game.price_per_sheet_1}`;
    document.getElementById('price2Sheets').textContent = `₹${this.game.price_per_sheet_2}`;
    document.getElementById('price3Sheets').textContent = `₹${this.game.price_per_sheet_3_plus}`;

    // Hide sheet selection if game is ended
    if (this.game.status === 'ended') {
      document.getElementById('sheetSelectionSection').style.display = 'none';
    }
  }

  selectPricingOption(sheets) {
    // Update UI
    document.querySelectorAll('.pricing-card').forEach(card => {
      card.classList.remove('selected');
    });
    document.querySelector(`[data-sheets="${sheets}"]`).classList.add('selected');

    if (sheets === 3) {
      // Show sheet selector for 3+ sheets
      this.showSheetSelector();
      this.selectedSheetsCount = 3;
    } else {
      // Hide sheet selector and set fixed count
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

    // Update total amount display
    const totalAmountElement = document.getElementById('totalAmount');
    if (totalAmountElement) {
      totalAmountElement.textContent = `₹${this.totalAmount.toLocaleString()}`;
    }
  }

  generateSheetGrid() {
    const sheetGrid = document.getElementById('sheetGrid');
    if (!sheetGrid) return;

    // Generate sheet numbers (assuming 1000 sheets max)
    const totalSheets = this.game.total_sheets || 1000;
    const sheetNumbers = [];
    
    for (let i = 1; i <= totalSheets; i++) {
      sheetNumbers.push(i);
    }

    sheetGrid.innerHTML = sheetNumbers.map(num => `
      <div class="sheet-number" data-sheet="${num}" onclick="gameDetails.toggleSheetSelection(${num})">
        ${num}
      </div>
    `).join('');
  }

  toggleSheetSelection(sheetNumber) {
    const sheetElement = document.querySelector(`[data-sheet="${sheetNumber}"]`);
    
    if (this.selectedSheets.includes(sheetNumber)) {
      // Remove from selection
      this.selectedSheets = this.selectedSheets.filter(num => num !== sheetNumber);
      sheetElement.classList.remove('selected');
    } else {
      // Add to selection (limit based on selected count)
      if (this.selectedSheets.length < this.selectedSheetsCount) {
        this.selectedSheets.push(sheetNumber);
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
    // Check if user is logged in
    if (!app.user) {
      this.showLoginRequired();
      return;
    }

    // Check if sheets are selected
    if (this.selectedSheets.length !== this.selectedSheetsCount) {
      app.showNotification(`Please select exactly ${this.selectedSheetsCount} sheets`, 'warning');
      return;
    }

    // Check if game is still active
    if (this.game.status === 'ended') {
      app.showNotification('This game has ended', 'error');
      return;
    }

    this.showPaymentModal();
  }

  showPaymentModal() {
    const modal = document.getElementById('paymentModal');
    
    // Set QR code with error handling
    const qrImg = document.getElementById('paymentQR');
    if (this.game.payment_qr_code_url) {
      qrImg.src = this.game.payment_qr_code_url;
      qrImg.onerror = () => {
        qrImg.onerror = null;
        qrImg.src = '/images/default-game.svg';
        console.log('🖼️ QR code image fallback');
      };
    }

    // Update payment summary
    document.getElementById('paymentSheetsCount').textContent = this.selectedSheetsCount;
    document.getElementById('paymentTotalAmount').textContent = `₹${this.totalAmount.toLocaleString()}`;

    modal.style.display = 'block';
  }

  async submitPaymentVerification() {
    const form = document.getElementById('paymentVerificationForm');
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');

    // Show loading state
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
      
      // Redirect to user dashboard or games page
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
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
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
    
    // Reset form
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
    
    // Redirect to games page after error
    setTimeout(() => {
      window.location.href = '/games';
    }, 3000);
  }
}

// Global functions for HTML onclick events
function closePaymentModal() {
  gameDetails.closePaymentModal();
}

function closeLoginRequiredModal() {
  document.getElementById('loginRequiredModal').style.display = 'none';
}

// Close modals when clicking outside
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

// Initialize game details manager
const gameDetails = new GameDetailsManager();
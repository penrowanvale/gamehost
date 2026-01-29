

class ImageUploadManager {
  constructor() {
    
  }

  createUploadWidget(containerId, onSuccess, onError) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const widgetId = containerId + '_widget';
    const driveUrlId = containerId + '_driveUrl';
    const driveResultId = containerId + '_driveResult';
    const driveDirectUrlId = containerId + '_driveDirectUrl';
    const drivePreviewId = containerId + '_drivePreview';
    const drivePreviewImageId = containerId + '_drivePreviewImage';

    container.innerHTML = `
      <div class="image-upload-widget" id="${widgetId}">
        <div class="drive-header">
          <h4>📂 Upload Image via Google Drive</h4>
          <p>Free, reliable, and saves our storage space!</p>
        </div>
        
        <div class="drive-instructions">
          <div class="instruction-steps">
            <div class="step">
              <div class="step-number">1</div>
              <div class="step-content">
                <strong>Upload to Google Drive</strong>
                <p>Go to <a href="https://drive.google.com" target="_blank" class="drive-link">drive.google.com</a> and upload your image</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">2</div>
              <div class="step-content">
                <strong>Get Sharing Link</strong>
                <p>Right-click your image → "Get link" → Change to <strong>"Anyone with the link can view"</strong></p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">3</div>
              <div class="step-content">
                <strong>Paste Link Below</strong>
                <p>Copy the sharing URL and paste it in the field below</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="drive-input-section">
          <label>Google Drive Sharing Link:</label>
          <input type="url" id="${driveUrlId}" placeholder="https://drive.google.com/file/d/1ABC123/view?usp=sharing" class="form-control">
          <button type="button" class="btn btn-primary" onclick="imageUploadManager.processDriveUrl('${containerId}')">
            🔄 Convert to Direct Link
          </button>
        </div>
        
        <div class="drive-result" id="${driveResultId}" style="display: none;">
          <div class="result-success">
            <h4>✅ Success! Direct Image URL Ready:</h4>
            <input type="url" id="${driveDirectUrlId}" class="form-control" readonly>
            <div class="result-actions">
              <button type="button" class="btn btn-success" onclick="imageUploadManager.useDriveUrl('${containerId}')">
                ✅ Use This URL
              </button>
              <button type="button" class="btn btn-secondary" onclick="imageUploadManager.testDriveUrl('${containerId}')">
                🔍 Test Image
              </button>
            </div>
          </div>
        </div>
        
        <div class="drive-preview" id="${drivePreviewId}" style="display: none;">
          <h4>🖼️ Image Preview:</h4>
          <img id="${drivePreviewImageId}" style="max-width: 200px; max-height: 200px; border-radius: 8px; border: 1px solid rgba(255, 107, 53, 0.3);">
        </div>
        
        <div class="drive-tips">
          <h4>💡 Tips for Best Results:</h4>
          <ul>
            <li><strong>Banner Images:</strong> Use 400x600px (portrait) for best appearance</li>
            <li><strong>QR Codes:</strong> Use 300x300px minimum for clear scanning</li>
            <li><strong>File Format:</strong> JPG or PNG works best</li>
            <li><strong>Permissions:</strong> Must be set to "Anyone with the link can view"</li>
            <li><strong>Wait Time:</strong> Allow 2-3 minutes after changing permissions</li>
          </ul>
        </div>
        
        <div class="common-issues">
          <h4>❓ Common Issues & Solutions:</h4>
          <div class="issue-item">
            <strong>Image test fails:</strong> This is often due to Google Drive CORS restrictions. The URL will still work in your game even if the test fails.
          </div>
          <div class="issue-item">
            <strong>Image not loading:</strong> Make sure permissions are set to "Anyone with the link can view"
          </div>
          <div class="issue-item">
            <strong>Still not working:</strong> Wait 2-3 minutes after changing permissions, then try again
          </div>
          <div class="issue-item">
            <strong>Wrong URL format:</strong> Use the sharing URL from Google Drive, not the direct file URL
          </div>
          <div class="issue-item">
            <strong>Manual verification:</strong> If test fails, click the manual check link to verify the image opens in Google Drive
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners(containerId, onSuccess, onError);
  }

  setupEventListeners(containerId, onSuccess, onError) {
    
    if (!this.widgets) {
      this.widgets = {};
    }
    this.widgets[containerId] = {
      onSuccess: onSuccess,
      onError: onError
    };
  }

  processDriveUrl(containerId) {
    const driveUrlId = containerId + '_driveUrl';
    const driveResultId = containerId + '_driveResult';
    const driveDirectUrlId = containerId + '_driveDirectUrl';
    
    const driveInput = document.getElementById(driveUrlId);
    const result = document.getElementById(driveResultId);
    const directUrlInput = document.getElementById(driveDirectUrlId);
    
    if (!driveInput || !result || !directUrlInput) {
      app.showNotification('❌ Widget elements not found', 'error');
      return;
    }
    
    const driveUrl = driveInput.value.trim();
    if (!driveUrl) {
      app.showNotification('Please enter a Google Drive link', 'warning');
      return;
    }

    const fileId = driveUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!fileId) {
      app.showNotification('❌ Invalid Google Drive URL format. Please use the sharing URL from Google Drive.', 'error');
      return;
    }

    const extractedId = fileId[1];
    const directUrl = `https://drive.google.com/uc?export=view&id=${extractedId}`;

    const alternativeUrl = `https://drive.google.com/thumbnail?id=${extractedId}&sz=w1000`;
    
    directUrlInput.value = directUrl;
    directUrlInput.setAttribute('data-alternative', alternativeUrl);
    directUrlInput.setAttribute('data-file-id', extractedId);
    
    result.style.display = 'block';
    
    app.showNotification('✅ Google Drive link converted! Click "Test Image" to verify. If test fails, the URL should still work in your game.', 'success');
  }

  useDriveUrl(containerId) {
    const driveDirectUrlId = containerId + '_driveDirectUrl';
    const directUrlInput = document.getElementById(driveDirectUrlId);
    
    if (!directUrlInput) {
      app.showNotification('❌ Widget elements not found', 'error');
      return;
    }
    
    const directUrl = directUrlInput.value;
    const widget = this.widgets && this.widgets[containerId];
    
    if (widget && widget.onSuccess) {
      widget.onSuccess(directUrl);
      app.showNotification('✅ Image URL added to form!', 'success');
    } else {
      app.showNotification('❌ Widget callback not found', 'error');
    }
  }

  async testDriveUrl(containerId) {
    const driveDirectUrlId = containerId + '_driveDirectUrl';
    const drivePreviewId = containerId + '_drivePreview';
    const drivePreviewImageId = containerId + '_drivePreviewImage';
    
    const directUrlInput = document.getElementById(driveDirectUrlId);
    const preview = document.getElementById(drivePreviewId);
    const previewImg = document.getElementById(drivePreviewImageId);
    
    if (!directUrlInput || !preview || !previewImg) {
      app.showNotification('❌ Widget elements not found', 'error');
      return;
    }
    
    const directUrl = directUrlInput.value;
    if (!directUrl) {
      app.showNotification('No URL to test', 'warning');
      return;
    }

    app.showNotification('🔍 Testing Google Drive image...', 'info');
    
    try {
      
      let imageLoaded = false;
      let imageErrored = false;
      
      const timeout = setTimeout(() => {
        if (!imageLoaded && !imageErrored) {
          preview.style.display = 'none';
          app.showNotification('⚠️ Image test timed out. This might be due to Google Drive restrictions, but the URL should still work in your game. Try opening the URL in a new tab to verify manually.', 'warning');
        }
      }, 10000); 
      
      previewImg.onload = () => {
        imageLoaded = true;
        clearTimeout(timeout);
        preview.style.display = 'block';
        app.showNotification('✅ Image loads successfully! You can use this URL.', 'success');
      };
      
      previewImg.onerror = () => {
        
        const alternativeUrl = directUrlInput.getAttribute('data-alternative');
        const fileId = directUrlInput.getAttribute('data-file-id');
        
        if (alternativeUrl && previewImg.src !== alternativeUrl) {
          console.log('Primary URL failed, trying alternative format...');
          previewImg.src = alternativeUrl;
          return; 
        }
        
        imageErrored = true;
        clearTimeout(timeout);
        preview.style.display = 'none';

        const manualUrl = fileId ? `https://drive.google.com/file/d/${fileId}/view` : directUrl;
        
        app.showNotification(`❌ Image preview failed. This could be due to:\n1. File permissions not set to "Anyone with the link can view"\n2. Google Drive CORS restrictions\n3. File is not an image format\n\n🔗 Manual check: <a href="${manualUrl}" target="_blank">Click here to verify the image opens in Google Drive</a>\n\n✅ Note: The URL should still work in your game even if preview fails.`, 'warning');
      };

      previewImg.src = '';
      
      setTimeout(() => {
        previewImg.src = directUrl;
      }, 100);
      
    } catch (error) {
      console.error('Image test error:', error);
      app.showNotification('❌ Error testing image URL', 'error');
    }
  }

  getValidImageUrl(imageUrl) {
    if (!imageUrl) return '/images/default-game.svg';

    if (imageUrl.startsWith('/images/') && imageUrl.endsWith('.jpg')) {
      return imageUrl.replace('.jpg', '.svg');
    }

    if (imageUrl.startsWith('http')) {
      
      if (imageUrl.includes('drive.google.com/file/')) {
        const fileId = imageUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (fileId) {
          return `https://drive.google.com/uc?export=view&id=${fileId[1]}`;
        }
        console.warn('Invalid Google Drive URL:', imageUrl);
        return '/images/default-game.svg';
      }

      if (imageUrl.includes('drive.google.com/uc?export=view') || imageUrl.includes('drive.google.com/thumbnail')) {
        return imageUrl; 
      }

      if (imageUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)) {
        return imageUrl; 
      }

      console.warn('Unknown external URL format:', imageUrl);
      return imageUrl;
    }
    
    return imageUrl;
  }

  setupImageFallback(imgElement, imageUrl) {
    if (!imgElement || !imageUrl) return;

    if (imageUrl.includes('drive.google.com')) {
      const fileId = imageUrl.match(/id=([a-zA-Z0-9-_]+)/);
      if (fileId) {
        const alternativeUrl = `https://drive.google.com/thumbnail?id=${fileId[1]}&sz=w1000`;
        
        imgElement.onerror = function() {
          
          if (this.src !== alternativeUrl) {
            console.log('Trying alternative Google Drive URL format...');
            this.src = alternativeUrl;
          } else {
            
            console.warn('Google Drive image failed to load:', imageUrl);
            this.src = '/images/default-game.svg';
          }
        };
      }
    }
  }
}

const imageUploadManager = new ImageUploadManager();
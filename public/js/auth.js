

class AuthManager {
  constructor() {
    this.currentUserType = 'user';
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupFormValidation();
  }

  setupEventListeners() {
    
    document.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.target.dataset.type;
        this.switchLoginType(type);
      });
    });

    document.getElementById('loginForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin('user');
    });

    document.getElementById('organiserLoginFormElement')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin('organiser');
    });

    document.getElementById('adminLoginFormElement')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin('admin');
    });

    document.getElementById('userSignupFormElement')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSignup('user');
    });

    document.getElementById('organiserSignupFormElement')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSignup('organiser');
    });

    document.querySelectorAll('input[type="password"]').forEach(input => {
      if (input.name === 'password') {
        input.addEventListener('input', (e) => {
          this.checkPasswordStrength(e.target);
        });
      }
    });
  }

  setupFormValidation() {
    
    document.querySelectorAll('input').forEach(input => {
      input.addEventListener('blur', (e) => {
        this.validateField(e.target);
      });

      input.addEventListener('input', (e) => {
        this.clearFieldError(e.target);
      });
    });

    document.querySelectorAll('input[name="confirmPassword"]').forEach(input => {
      input.addEventListener('input', (e) => {
        this.validatePasswordConfirmation(e.target);
      });
    });
  }

  switchLoginType(type) {
    this.currentUserType = type;

    document.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-type="${type}"]`).classList.add('active');

    document.querySelectorAll('.auth-form').forEach(form => {
      form.classList.remove('active');
    });
    document.getElementById(`${type}LoginForm`).classList.add('active');
  }

  async handleLogin(userType) {
    const formId = userType === 'user' ? 'loginForm' : 
                   userType === 'organiser' ? 'organiserLoginFormElement' : 
                   'adminLoginFormElement';
    
    const form = document.getElementById(formId);
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
      const identifier = formData.get('identifier');
      const password = formData.get('password');

      if (!identifier || !password) {
        throw new Error('Please fill in all fields');
      }

      const success = await app.login(identifier, password, userType);
      
      if (!success) {
        throw new Error('Login failed');
      }

    } catch (error) {
      app.showNotification(error.message, 'error');
    } finally {
      
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  }

  async handleSignup(userType) {
    const formId = userType === 'user' ? 'userSignupFormElement' : 'organiserSignupFormElement';
    const form = document.getElementById(formId);
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!this.validateForm(form)) {
      return;
    }

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
      const userData = {};

      userData.username = formData.get('username');
      userData.email = formData.get('email');
      userData.phone = formData.get('phone');
      userData.password = formData.get('password');

      if (userType === 'organiser') {
        userData.realName = formData.get('realName');
        userData.organiserName = formData.get('organiserName');
        userData.personalPhone = formData.get('personalPhone');
        userData.aadhaarFrontUrl = formData.get('aadhaarFrontUrl');
        userData.aadhaarBackUrl = formData.get('aadhaarBackUrl');
      }

      const success = await app.register(userData, userType === 'organiser');
      
      if (success) {
        
        closeSignupModal();
      }

    } catch (error) {
      console.error('Signup error:', error);
      app.showNotification(error.message || 'Registration failed', 'error');
    } finally {
      
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  }

  validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input[required]');

    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });

    const password = form.querySelector('input[name="password"]');
    const confirmPassword = form.querySelector('input[name="confirmPassword"]');
    
    if (password && confirmPassword) {
      if (!this.validatePasswordConfirmation(confirmPassword)) {
        isValid = false;
      }
    }

    const termsCheckbox = form.querySelector('input[type="checkbox"]');
    if (termsCheckbox && !termsCheckbox.checked) {
      this.showFieldError(termsCheckbox, 'Please accept the terms and conditions');
      isValid = false;
    }

    return isValid;
  }

  validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    if (field.required && !value) {
      errorMessage = 'This field is required';
      isValid = false;
    }

    else if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errorMessage = 'Please enter a valid email address';
        isValid = false;
      }
    }

    else if (field.type === 'tel' && value) {
      const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(value)) {
        errorMessage = 'Please enter a valid phone number';
        isValid = false;
      }
    }

    else if (field.name === 'password' && value) {
      if (value.length < 6) {
        errorMessage = 'Password must be at least 6 characters long';
        isValid = false;
      }
    }

    else if (field.type === 'url' && value) {
      try {
        new URL(value);
      } catch {
        errorMessage = 'Please enter a valid URL';
        isValid = false;
      }
    }

    if (isValid) {
      this.clearFieldError(field);
      field.parentElement.classList.add('success');
    } else {
      this.showFieldError(field, errorMessage);
    }

    return isValid;
  }

  validatePasswordConfirmation(confirmField) {
    const form = confirmField.closest('form');
    const passwordField = form.querySelector('input[name="password"]');
    
    if (passwordField && confirmField.value !== passwordField.value) {
      this.showFieldError(confirmField, 'Passwords do not match');
      return false;
    } else {
      this.clearFieldError(confirmField);
      confirmField.parentElement.classList.add('success');
      return true;
    }
  }

  checkPasswordStrength(passwordField) {
    const password = passwordField.value;
    let strength = 0;

    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    let strengthIndicator = passwordField.parentElement.querySelector('.password-strength');
    if (!strengthIndicator) {
      strengthIndicator = document.createElement('div');
      strengthIndicator.className = 'password-strength';
      strengthIndicator.innerHTML = '<div class="password-strength-bar"></div>';
      passwordField.parentElement.appendChild(strengthIndicator);
    }

    const strengthBar = strengthIndicator.querySelector('.password-strength-bar');
    strengthBar.className = 'password-strength-bar';

    if (password.length === 0) {
      strengthBar.style.width = '0%';
    } else if (strength <= 2) {
      strengthBar.classList.add('weak');
    } else if (strength <= 3) {
      strengthBar.classList.add('medium');
    } else {
      strengthBar.classList.add('strong');
    }
  }

  showFieldError(field, message) {
    const formGroup = field.parentElement;
    formGroup.classList.add('error');
    formGroup.classList.remove('success');

    let errorElement = formGroup.querySelector('.error-message');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      formGroup.appendChild(errorElement);
    }
    errorElement.textContent = message;
  }

  clearFieldError(field) {
    const formGroup = field.parentElement;
    formGroup.classList.remove('error');
    
    const errorElement = formGroup.querySelector('.error-message');
    if (errorElement) {
      errorElement.remove();
    }
  }
}

function showSignupForm(type) {
  const modal = document.getElementById('signupModal');
  const userForm = document.getElementById('userSignupForm');
  const organiserForm = document.getElementById('organiserSignupForm');

  if (type === 'user') {
    userForm.classList.add('active');
    organiserForm.classList.remove('active');
  } else {
    organiserForm.classList.add('active');
    userForm.classList.remove('active');
  }

  modal.style.display = 'block';
}

function closeSignupModal() {
  const modal = document.getElementById('signupModal');
  modal.style.display = 'none';

  document.querySelectorAll('.signup-form form').forEach(form => {
    form.reset();
    form.querySelectorAll('.form-group').forEach(group => {
      group.classList.remove('error', 'success');
    });
    form.querySelectorAll('.error-message').forEach(error => {
      error.remove();
    });
  });
}

function showForgotPassword() {
  app.showNotification('Please contact support for password recovery', 'info');
}

window.onclick = function(event) {
  const modal = document.getElementById('signupModal');
  if (event.target === modal) {
    closeSignupModal();
  }
}

const authManager = new AuthManager();

if (app.token && app.user) {
  if (app.user.role === 'admin') {
    window.location.href = '/admin';
  } else if (app.user.role === 'organiser') {
    window.location.href = '/organiser';
  } else {
    window.location.href = '/';
  }
}
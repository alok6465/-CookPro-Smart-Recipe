// Firebase Authentication Manager
class AuthManager {
  static currentUser = null;

  static init() {
    if (typeof firebase === 'undefined' || typeof auth === 'undefined') {
      console.log('Firebase not loaded yet, retrying...');
      setTimeout(() => this.init(), 100);
      return;
    }
    
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.currentUser = user;
        this.updateUI(true);
        this.loadUserData();
      } else {
        this.currentUser = null;
        this.updateUI(false);
      }
    });
  }

  static async signUp(email, password, name) {
    try {
      const result = await auth.createUserWithEmailAndPassword(email, password);
      await result.user.updateProfile({ displayName: name });
      
      if (typeof FirebaseDB !== 'undefined') {
        await FirebaseDB.saveUser(result.user.uid, {
          name: name,
          email: email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      
      this.showMessage('Account created successfully!', 'success');
      this.closeAuthModal();
      return true;
    } catch (error) {
      this.showMessage(error.message, 'error');
      return false;
    }
  }

  static async signIn(email, password) {
    try {
      await auth.signInWithEmailAndPassword(email, password);
      this.showMessage('Signed in successfully!', 'success');
      this.closeAuthModal();
      return true;
    } catch (error) {
      this.showMessage(error.message, 'error');
      return false;
    }
  }

  static async signOut() {
    try {
      await auth.signOut();
      this.showMessage('Signed out successfully!', 'success');
      return true;
    } catch (error) {
      this.showMessage(error.message, 'error');
      return false;
    }
  }

  static async signInWithGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await auth.signInWithPopup(provider);
      
      if (typeof FirebaseDB !== 'undefined') {
        await FirebaseDB.saveUser(result.user.uid, {
          name: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      
      this.showMessage('Signed in with Google!', 'success');
      this.closeAuthModal();
      return true;
    } catch (error) {
      this.showMessage(error.message, 'error');
      return false;
    }
  }

  static updateUI(isLoggedIn) {
    const loginBtn = document.getElementById('loginBtn');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');

    if (isLoggedIn && this.currentUser) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (userMenu) userMenu.style.display = 'block';
      if (userName) userName.textContent = this.currentUser.displayName || 'User';
    } else {
      if (loginBtn) loginBtn.style.display = 'block';
      if (userMenu) userMenu.style.display = 'none';
    }
  }

  static async loadUserData() {
    if (!this.currentUser || typeof FirebaseDB === 'undefined') return;
    
    try {
      const userData = await FirebaseDB.getUser(this.currentUser.uid);
      if (userData) {
        console.log('User data loaded:', userData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  static showMessage(message, type) {
    if (typeof showMessage === 'function') {
      showMessage(message, type);
      return;
    }

    const existingMessages = document.querySelectorAll('.auth-message');
    existingMessages.forEach(msg => msg.remove());

    const messageDiv = document.createElement('div');
    messageDiv.className = `auth-message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10000;
      padding: 1rem 2rem; border-radius: 8px; color: white;
      background: ${type === 'success' ? '#46d369' : '#e50914'};
      animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 3000);
  }

  static closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  }

  static getCurrentUserId() {
    return this.currentUser ? this.currentUser.uid : null;
  }

  static getCurrentUser() {
    return this.currentUser;
  }

  static isUserLoggedIn() {
    return !!this.currentUser;
  }
}

// Global functions
function openAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    showLoginForm();
  }
}

function closeAuthModal() {
  AuthManager.closeAuthModal();
}

function showLoginForm() {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  if (loginForm && signupForm) {
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
  }
}

function showSignupForm() {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  if (loginForm && signupForm) {
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
  }
}

function signInWithGoogle() {
  AuthManager.signInWithGoogle();
}

function logout() {
  AuthManager.signOut();
}

function toggleUserDropdown() {
  const dropdown = document.getElementById('userDropdown');
  if (dropdown) {
    dropdown.classList.toggle('active');
  }
}

function viewProfile() {
  toggleUserDropdown();
  AuthManager.showMessage('Profile feature coming soon!', 'info');
}

function viewSettings() {
  AuthManager.showMessage('Settings feature coming soon!', 'info');
  toggleUserDropdown();
}

function initializeAuth() {
  if (typeof AuthManager !== 'undefined') {
    AuthManager.init();
  }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const userMenu = document.getElementById('userMenu');
  const dropdown = document.getElementById('userDropdown');
  
  if (userMenu && dropdown && !userMenu.contains(e.target)) {
    dropdown.classList.remove('active');
  }
});

// Form handlers
document.addEventListener('DOMContentLoaded', () => {
  AuthManager.init();

  const loginFormElement = document.getElementById('loginFormElement');
  if (loginFormElement) {
    loginFormElement.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      await AuthManager.signIn(email, password);
    });
  }

  const signupFormElement = document.getElementById('signupFormElement');
  if (signupFormElement) {
    signupFormElement.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signupName').value;
      const email = document.getElementById('signupEmail').value;
      const password = document.getElementById('signupPassword').value;
      await AuthManager.signUp(email, password, name);
    });
  }
});
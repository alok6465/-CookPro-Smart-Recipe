// Firebase Authentication Manager
class AuthManager {
  static currentUser = null;

  // Initialize auth state listener
  static init() {
    // Ensure Firebase is loaded
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

  // Sign up with email/password
  static async signUp(email, password, name) {
    try {
      const result = await auth.createUserWithEmailAndPassword(email, password);
      await result.user.updateProfile({ displayName: name });
      
      // Save user data to Firestore
      await FirebaseDB.saveUser(result.user.uid, {
        name: name,
        email: email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      this.showMessage('Account created successfully!', 'success');
      this.closeAuthModal();
      return true;
    } catch (error) {
      this.showMessage(error.message, 'error');
      return false;
    }
  }

  // Sign in with email/password
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

  // Sign out
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

  // Google Sign In
  static async signInWithGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await auth.signInWithPopup(provider);
      
      // Save user data to Firestore
      await FirebaseDB.saveUser(result.user.uid, {
        name: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      this.showMessage('Signed in with Google!', 'success');
      this.closeAuthModal();
      return true;
    } catch (error) {
      this.showMessage(error.message, 'error');
      return false;
    }
  }

  // Update UI based on auth state
  static updateUI(isLoggedIn) {
    const loginBtn = document.getElementById('loginBtn');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');

    if (isLoggedIn && this.currentUser) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (userMenu) userMenu.style.display = 'block';
      if (userName) userName.textContent = this.currentUser.displayName || 'User';
      
      // Refresh saved recipes if on saved page
      if (window.location.pathname.includes('saved.html')) {
        setTimeout(() => {
          if (typeof showSavedRecipes === 'function') {
            showSavedRecipes();
          }
        }, 500);
      }
    } else {
      if (loginBtn) loginBtn.style.display = 'block';
      if (userMenu) userMenu.style.display = 'none';
    }
  }

  // Load user data from Firebase
  static async loadUserData() {
    if (!this.currentUser) return;
    
    const userData = await FirebaseDB.getUser(this.currentUser.uid);
    if (userData) {
      console.log('User data loaded:', userData);
    }
  }

  // Show message to user
  static showMessage(message, type) {
    if (typeof showMessage === 'function') {
      showMessage(message);
    } else {
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
  }

  // Close authentication modal
  static closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  }

  // Get current user ID
  static getCurrentUserId() {
    return this.currentUser ? this.currentUser.uid : null;
  }

  // Get current user
  static getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is logged in
  static isUserLoggedIn() {
    return !!this.currentUser;
  }
}

// Profile Modal Functions
function openProfileModal() {
  if (!AuthManager.isUserLoggedIn()) {
    AuthManager.showMessage('Please login to view profile', 'error');
    return;
  }
  
  let modal = document.getElementById('profileModal');
  if (!modal) {
    modal = createProfileModal();
    document.body.appendChild(modal);
  }
  
  loadProfileData();
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // Show development message after 4 seconds
  setTimeout(() => {
    showDevelopmentMessage();
  }, 4000);
}

function closeProfileModal() {
  const modal = document.getElementById('profileModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

function createProfileModal() {
  const modal = document.createElement('div');
  modal.id = 'profileModal';
  modal.className = 'profile-modal';
  
  modal.innerHTML = `
    <div class="profile-modal-content">
      <div class="profile-header">
        <h2 class="profile-title">
          <i class="fas fa-user-circle"></i>
          My Profile
        </h2>
        <button class="profile-close" onclick="closeProfileModal()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="profile-body">
        <!-- User Info Section -->
        <div class="profile-section">
          <h3><i class="fas fa-info-circle"></i> User Information</h3>
          <div class="user-info" id="userInfo">
            <div class="info-card">
              <h4>Name</h4>
              <p id="profileName">Loading...</p>
            </div>
            <div class="info-card">
              <h4>Email</h4>
              <p id="profileEmail">Loading...</p>
            </div>
            <div class="info-card">
              <h4>Member Since</h4>
              <p id="profileJoined">Loading...</p>
            </div>
            <div class="info-card">
              <h4>Total Likes</h4>
              <p id="profileLikes">0</p>
            </div>
          </div>
        </div>
        
        <!-- Liked Recipes Section -->
        <div class="profile-section">
          <h3><i class="fas fa-heart"></i> Liked Recipes</h3>
          <div class="liked-recipes-scroll">
            <div class="liked-recipes-list" id="likedRecipesList">
              <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem;"></i>
                <p style="margin-top: 0.5rem;">Loading liked recipes...</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- User Comments Section -->
        <div class="profile-section">
          <h3><i class="fas fa-comments"></i> My Comments</h3>
          <div class="user-comments-list" id="userCommentsList">
            <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
              <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem;"></i>
              <p style="margin-top: 0.5rem;">Loading your comments...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeProfileModal();
    }
  });
  
  return modal;
}

async function loadProfileData() {
  const user = AuthManager.getCurrentUser();
  if (!user) return;
  
  // Load basic user info
  document.getElementById('profileName').textContent = user.displayName || 'Anonymous User';
  document.getElementById('profileEmail').textContent = user.email || 'No email';
  
  // Format join date
  const joinDate = user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Unknown';
  document.getElementById('profileJoined').textContent = joinDate;
  
  // Load liked recipes
  await loadUserLikedRecipes(user.uid);
  
  // Load user comments
  await loadUserComments(user.uid);
}

async function loadUserLikedRecipes(userId) {
  const container = document.getElementById('likedRecipesList');
  
  try {
    // Get user's liked recipes from Firebase
    const userData = await FirebaseDB.getUser(userId);
    const likedRecipeIds = userData?.likedRecipes || [];
    
    // Update total likes count
    document.getElementById('profileLikes').textContent = likedRecipeIds.length;
    
    if (likedRecipeIds.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
          <i class="fas fa-heart" style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem;"></i>
          <p>No liked recipes yet</p>
          <p style="font-size: 0.9rem; margin-top: 0.5rem;">Start exploring recipes and like your favorites!</p>
        </div>
      `;
      return;
    }
    
    // Load recipe data
    if (typeof loadJSONRecipes === 'function') {
      await loadJSONRecipes();
    }
    
    container.innerHTML = '';
    
    likedRecipeIds.forEach(recipeId => {
      // Find recipe by ID
      let recipe = null;
      if (window.recipes) {
        recipe = window.recipes.find(r => generateRecipeId(r) === recipeId);
      }
      
      if (recipe) {
        const recipeCard = createLikedRecipeCard(recipe);
        container.appendChild(recipeCard);
      }
    });
    
  } catch (error) {
    console.error('Error loading liked recipes:', error);
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
        <p>Error loading liked recipes</p>
      </div>
    `;
  }
}

function createLikedRecipeCard(recipe) {
  const card = document.createElement('div');
  card.className = 'liked-recipe-card';
  
  const recipeIndex = window.recipes ? window.recipes.findIndex(r => r.name === recipe.name) : -1;
  
  card.innerHTML = `
    <div class="liked-recipe-image">
      ${recipe.image ? `<img src="${recipe.image}" alt="${recipe.name}" style="width: 100%; height: 100%; object-fit: cover;">` : '🍛'}
    </div>
    <div class="liked-recipe-content">
      <div class="liked-recipe-title">${recipe.name}</div>
      <div class="liked-recipe-time">⏱️ ${recipe.time || '30 mins'}</div>
    </div>
  `;
  
  card.addEventListener('click', () => {
    closeProfileModal();
    if (recipeIndex !== -1 && typeof openRecipeModal === 'function') {
      openRecipeModal(recipeIndex, 'offline');
    }
  });
  
  return card;
}

async function loadUserComments(userId) {
  const container = document.getElementById('userCommentsList');
  
  try {
    const allComments = [];
    
    // Load recipes first
    if (typeof loadJSONRecipes === 'function') {
      await loadJSONRecipes();
    }
    
    // Get comments from all recipes
    if (window.recipes) {
      for (const recipe of window.recipes) {
        const recipeId = generateRecipeId(recipe);
        const comments = await FirebaseDB.getRecipeComments(recipeId);
        
        comments.forEach(comment => {
          if (comment.userId === userId) {
            allComments.push({
              ...comment,
              recipeName: recipe.name
            });
          }
        });
      }
    }
    
    // Get general reviews
    const generalComments = await FirebaseDB.getRecipeComments('general_reviews');
    generalComments.forEach(comment => {
      if (comment.userId === userId) {
        allComments.push({
          ...comment,
          recipeName: 'General Review'
        });
      }
    });
    
    // Sort by newest first
    allComments.sort((a, b) => {
      const timeA = a.createdAt ? a.createdAt.toDate().getTime() : 0;
      const timeB = b.createdAt ? b.createdAt.toDate().getTime() : 0;
      return timeB - timeA;
    });
    
    if (allComments.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
          <i class="fas fa-comments" style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem;"></i>
          <p>No comments yet</p>
          <p style="font-size: 0.9rem; margin-top: 0.5rem;">Share your cooking experiences by commenting on recipes!</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = '';
    
    allComments.forEach(comment => {
      const commentItem = createUserCommentItem(comment);
      container.appendChild(commentItem);
    });
    
  } catch (error) {
    console.error('Error loading user comments:', error);
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
        <p>Error loading comments</p>
      </div>
    `;
  }
}

function createUserCommentItem(comment) {
  const item = document.createElement('div');
  item.className = 'user-comment-item';
  
  const timeAgo = comment.createdAt ? formatTimeAgo(comment.createdAt.toDate()) : 'Just now';
  
  item.innerHTML = `
    <div class="comment-recipe-name">${comment.recipeName}</div>
    <div class="comment-text">${comment.comment}</div>
    <div class="comment-meta">
      <span class="comment-time">${timeAgo}</span>
      <button class="comment-delete" onclick="deleteUserComment('${comment.id}')">
        <i class="fas fa-trash"></i> Delete
      </button>
    </div>
  `;
  
  return item;
}

async function deleteUserComment(commentId) {
  if (!confirm('Delete this comment?')) return;
  
  const userId = AuthManager.getCurrentUserId();
  
  try {
    const success = await FirebaseDB.deleteComment(commentId, userId);
    
    if (success) {
      AuthManager.showMessage('Comment deleted!', 'success');
      // Reload comments
      await loadUserComments(userId);
    } else {
      AuthManager.showMessage('Failed to delete comment.', 'error');
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
    AuthManager.showMessage('Error deleting comment.', 'error');
  }
}

// Helper function for recipe ID generation (if not available globally)
function generateRecipeId(recipe) {
  if (typeof window.generateRecipeId === 'function') {
    return window.generateRecipeId(recipe);
  }
  const name = recipe.name || recipe.RecipeName || recipe.TranslatedRecipeName || 'unknown';
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

// Helper function for time formatting (if not available globally)
function formatTimeAgo(date) {
  if (typeof window.formatTimeAgo === 'function') {
    return window.formatTimeAgo(date);
  }
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Recipe Management with Firebase
async function saveRecipe(recipe) {
  const userId = AuthManager.getCurrentUserId();
  if (!userId) {
    AuthManager.showMessage('Please login to save recipes', 'error');
    return false;
  }

  const success = await FirebaseDB.saveRecipe(userId, recipe);
  if (success) {
    AuthManager.showMessage('Recipe saved successfully!', 'success');
    updateSaveButton(recipe.id, true);
  }
  return success;
}

async function loadSavedRecipes() {
  const userId = AuthManager.getCurrentUserId();
  if (!userId) return [];

  const recipes = await FirebaseDB.getSavedRecipes(userId);
  return recipes;
}

async function removeSavedRecipe(recipeId) {
  const userId = AuthManager.getCurrentUserId();
  if (!userId) return false;

  const success = await FirebaseDB.removeSavedRecipe(userId, recipeId);
  if (success) {
    AuthManager.showMessage('Recipe removed from saved list', 'success');
    updateSaveButton(recipeId, false);
  }
  return success;
}

function updateSaveButton(recipeId, isSaved) {
  // Update save button state if it exists
  const saveButtons = document.querySelectorAll(`[onclick*="${recipeId}"]`);
  saveButtons.forEach(btn => {
    if (btn.innerHTML.includes('Save') || btn.innerHTML.includes('Saved')) {
      if (isSaved) {
        btn.innerHTML = '<i class="fas fa-bookmark"></i> Saved';
        btn.style.background = 'rgba(76, 175, 80, 0.2)';
        btn.style.borderColor = '#4CAF50';
        btn.style.color = '#4CAF50';
      } else {
        btn.innerHTML = '<i class="far fa-bookmark"></i> Save';
        btn.style.background = '';
        btn.style.borderColor = '';
        btn.style.color = '';
      }
    }
  });
}

// Global functions for HTML
function switchTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const authTitle = document.getElementById('authTitle');
  const authSubtitle = document.getElementById('authSubtitle');
  const tabs = document.querySelectorAll('.auth-tab');

  tabs.forEach(t => t.classList.remove('active'));
  
  if (tab === 'login') {
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
    authTitle.textContent = 'Welcome Back';
    authSubtitle.textContent = 'Login to your account';
    tabs[0].classList.add('active');
  } else {
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
    authTitle.textContent = 'Join CookPro';
    authSubtitle.textContent = 'Create your account';
    tabs[1].classList.add('active');
  }
}

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

function socialLogin(provider) {
  if (provider === 'google') {
    AuthManager.signInWithGoogle();
  }
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

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const userMenu = document.getElementById('userMenu');
  const dropdown = document.getElementById('userDropdown');
  
  if (userMenu && dropdown && !userMenu.contains(e.target)) {
    dropdown.classList.remove('active');
  }
});

// Development Message Functions
function showDevelopmentMessage() {
  // Check if message already exists
  if (document.getElementById('devMessagePopup')) {
    return;
  }
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'dev-message-overlay';
  overlay.id = 'devMessageOverlay';
  
  // Create popup
  const popup = document.createElement('div');
  popup.className = 'dev-message-popup';
  popup.id = 'devMessagePopup';
  
  popup.innerHTML = `
    <div class="dev-message-header">
      <div class="dev-message-icon">
        <i class="fas fa-tools"></i>
      </div>
      <h3 class="dev-message-title">Development Phase</h3>
    </div>
    <div class="dev-message-text">
      The profile section is currently in the development phase. Some features may be unavailable or limited. We're working hard to bring you the best experience!
    </div>
    <button class="dev-message-close" onclick="closeDevelopmentMessage()">
      <i class="fas fa-check"></i> Got it!
    </button>
  `;
  
  document.body.appendChild(overlay);
  document.body.appendChild(popup);
  
  // Show with animation
  setTimeout(() => {
    overlay.classList.add('active');
    popup.classList.add('active');
  }, 100);
}

function closeDevelopmentMessage() {
  const overlay = document.getElementById('devMessageOverlay');
  const popup = document.getElementById('devMessagePopup');
  
  if (overlay && popup) {
    overlay.classList.remove('active');
    popup.classList.remove('active');
    
    setTimeout(() => {
      if (overlay.parentNode) overlay.remove();
      if (popup.parentNode) popup.remove();
    }, 300);
  }
}

function viewProfile() {
  toggleUserDropdown();
  openProfileModal();
}

function viewSettings() {
  AuthManager.showMessage('Settings feature coming soon!', 'success');
  toggleUserDropdown();
}

// Form handlers
document.addEventListener('DOMContentLoaded', () => {
  AuthManager.init();

  // Login form
  const loginFormElement = document.getElementById('loginFormElement');
  if (loginFormElement) {
    loginFormElement.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      await AuthManager.signIn(email, password);
    });
  }

  // Signup form
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
  
  // Close profile modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeProfileModal();
      closeDevelopmentMessage();
    }
  });
});
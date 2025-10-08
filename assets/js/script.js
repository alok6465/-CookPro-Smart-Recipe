// Global variables
let recipes = [];
let currentRecipe = null;
let currentApiRecipes = [];
let todaysMenu = { breakfast: null, lunch: null, dinner: null };

// Enhanced JSON recipe loading with caching
async function loadJSONRecipes() {
  // Return cached recipes if already loaded
  if (recipes.length > 0) {
    return recipes;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch('recipes_offline.json', {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    recipes = Array.isArray(data) ? data.filter(recipe => recipe && recipe.name) : [];
    console.log(`✅ Loaded ${recipes.length} recipes`);
    return recipes;
  } catch (err) {
    console.error('❌ Failed to load recipes:', err);
    recipes = [];
    showMessage('Failed to load recipes. Please refresh the page.', 'error');
    return recipes;
  }
}

// Missing function implementations
function loadTodaysMenu() {
  const meals = ['breakfast', 'lunch', 'dinner'];
  meals.forEach(meal => {
    const titleEl = document.getElementById(`${meal}Title`);
    const descEl = document.getElementById(`${meal}Desc`);
    const timeEl = document.getElementById(`${meal}Time`);
    
    if (titleEl) titleEl.textContent = `Today's ${meal.charAt(0).toUpperCase() + meal.slice(1)}`;
    if (descEl) descEl.textContent = 'Delicious vegetarian recipe for you';
    if (timeEl) timeEl.textContent = '⏱️ 30 mins';
  });
}

function loadRecentComments() {
  const container = document.getElementById('recentCommentsList');
  if (container) {
    container.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">No recent comments</div>';
  }
}

function refreshTodaysMenu() {
  showMessage('Menu refreshed!', 'success');
  loadTodaysMenu();
}

function viewTodaysRecipe(meal) {
  showMessage(`${meal.charAt(0).toUpperCase() + meal.slice(1)} recipe coming soon!`, 'info');
}

function createRecipeCard(recipe, index, mode) {
  const card = document.createElement('div');
  card.className = 'recipe-card';
  
  const imageDiv = document.createElement('div');
  imageDiv.className = 'recipe-image';
  imageDiv.textContent = '🍛';
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'recipe-content';
  
  const title = document.createElement('h3');
  title.className = 'recipe-title';
  title.textContent = recipe.name || recipe.RecipeName || 'Delicious Recipe';
  
  const description = document.createElement('p');
  description.className = 'recipe-description';
  description.textContent = recipe.description || 'A wonderful recipe to try';
  
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'recipe-actions';
  
  const viewBtn = document.createElement('button');
  viewBtn.className = 'btn btn-primary';
  viewBtn.innerHTML = '<i class="fas fa-eye"></i> View';
  viewBtn.addEventListener('click', () => {
    showMessage('Recipe details coming soon!', 'info');
  });
  
  actionsDiv.appendChild(viewBtn);
  contentDiv.appendChild(title);
  contentDiv.appendChild(description);
  contentDiv.appendChild(actionsDiv);
  card.appendChild(imageDiv);
  card.appendChild(contentDiv);
  
  return card;
}

function initializeSavedPage() {
  showMessage('Saved recipes feature ready!', 'success');
}

function loadCommunityReviews() {
  console.log('Loading community reviews...');
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  initializeAuth();
  animateStats();
  loadTodaysMenu();
  loadRecentComments();
  addLazyLoading();
  
  // Enhanced mobile menu with body scroll lock
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');
      document.body.classList.toggle('nav-open');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.classList.remove('nav-open');
      }
    });
  }
  
  // Initialize page functionality
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  try {
    if (currentPage === 'results.html') {
      initializeResultsPage();
    } else if (currentPage === 'ingredients.html') {
      initializeIngredientsPage();
    } else if (currentPage === 'saved.html') {
      initializeSavedPage();
    } else if (currentPage === 'reviews.html') {
      initializeReviewsPage();
    }
  } catch (error) {
    console.error('Page initialization error:', error);
  }
});

// Stats animation
function animateStats() {
  const statNumbers = document.querySelectorAll('.stat-number');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const count = parseInt(target.getAttribute('data-count'));
        animateCounter(target, count);
        observer.unobserve(target);
      }
    });
  }, { threshold: 0.5 });
  
  statNumbers.forEach(stat => observer.observe(stat));
}

function animateCounter(element, target) {
  let current = 0;
  const increment = target / 50;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target + (target === 24 ? '/7' : '+');
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, 30);
}

// Ingredients page
function initializeIngredientsPage() {
  const ingredientForm = document.getElementById('ingredientForm');
  const smartBtn = document.getElementById('smartBtn');
  
  if (ingredientForm) {
    ingredientForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const ingredients = document.getElementById('ingredients').value;
      if (ingredients.trim()) {
        localStorage.setItem('userIngredients', ingredients);
        localStorage.setItem('searchMode', 'offline');
        window.location.href = 'results.html#recipes';
      }
    });
  }
  
  if (smartBtn) {
    smartBtn.addEventListener('click', function() {
      const ingredients = document.getElementById('ingredients').value.trim();
      if (!ingredients) {
        showMessage('Please enter ingredients first! 🧄');
        return;
      }
      localStorage.setItem('userIngredients', ingredients);
      localStorage.setItem('searchMode', 'online');
      window.location.href = 'results.html#recipes';
    });
  }
}

// Results page
function initializeResultsPage() {
  loadJSONRecipes().then(() => {
    renderResults();
    // Load community reviews
    setTimeout(() => {
      loadCommunityReviews();
    }, 1000);
  });
  
  const quickSearchForm = document.getElementById('quickSearchForm');
  if (quickSearchForm) {
    quickSearchForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const ingredients = document.getElementById('quickSearchInput').value.trim();
      if (ingredients) {
        localStorage.setItem('userIngredients', ingredients);
        localStorage.setItem('searchMode', 'offline');
        renderResults();
        setTimeout(() => {
          document.getElementById('recipes').scrollIntoView({ behavior: 'smooth' });
        }, 500);
      }
    });
  }
}

// Reviews page initialization
function initializeReviewsPage() {
  setTimeout(() => {
    loadCommunityReviews();
  }, 1000);
  
  const reviewForm = document.getElementById('reviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', function(e) {
      e.preventDefault();
      showMessage('Review submission coming soon!', 'info');
    });
  }
}

// Enhanced AI search with validation
function searchAI() {
  const input = document.getElementById('quickSearchInput');
  if (!input) {
    showMessage('Search input not found!', 'error');
    return;
  }
  
  const ingredients = input.value.trim();
  if (!ingredients) {
    showMessage('Please enter ingredients first! 🧄', 'error');
    input.focus();
    return;
  }
  
  if (ingredients.length < 2) {
    showMessage('Please enter at least 2 characters', 'error');
    return;
  }
  
  // Show loading message
  showMessage('Searching for recipes...', 'info');
  
  localStorage.setItem('userIngredients', ingredients);
  localStorage.setItem('searchMode', 'online');
  
  if (window.location.pathname.includes('results.html')) {
    renderResults();
    setTimeout(() => {
      const recipesSection = document.getElementById('recipes');
      if (recipesSection) {
        recipesSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 500);
  } else {
    window.location.href = 'results.html#recipes';
  }
}

// Enhanced render results
function renderResults() {
  const searchMode = localStorage.getItem('searchMode') || 'offline';
  const ingredients = localStorage.getItem('userIngredients') || '';
  const container = document.getElementById('recipesContainer') || document.getElementById('recipeResults');
  
  if (!container) {
    console.error('Recipe container not found');
    return;
  }
  
  if (searchMode === 'offline') {
    renderOfflineResults(ingredients);
  } else {
    renderOnlineResults(ingredients);
  }
}

// Initialize auth system
function initializeAuth() {
  if (typeof AuthManager !== 'undefined') {
    AuthManager.init();
  }
}

// Auth modal functions
function openAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    showLoginForm();
  }
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
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
  if (typeof AuthManager !== 'undefined') {
    AuthManager.signInWithGoogle();
  } else {
    showMessage('Authentication system loading...', 'info');
  }
}

function logout() {
  if (typeof AuthManager !== 'undefined') {
    AuthManager.signOut();
  }
}

function toggleUserDropdown() {
  const dropdown = document.getElementById('userDropdown');
  if (dropdown) {
    dropdown.classList.toggle('active');
  }
}

function viewProfile() {
  toggleUserDropdown();
  
  // Create and show profile modal
  const modal = document.createElement('div');
  modal.className = 'recipe-modal';
  modal.innerHTML = `
    <div class="recipe-modal-content">
      <div class="recipe-modal-header">
        <h2><i class="fas fa-user"></i> User Profile</h2>
        <button class="recipe-modal-close" onclick="this.closest('.recipe-modal').remove(); document.body.style.overflow='auto';">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="recipe-modal-body">
        <div style="text-align: center; padding: 2rem;">
          <div style="width: 100px; height: 100px; background: var(--gradient-primary); border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: white;">
            <i class="fas fa-user"></i>
          </div>
          <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">Welcome to CookPro!</h3>
          <p style="color: var(--text-secondary); margin-bottom: 2rem;">Sign in to access your saved recipes, comments, and personalized features.</p>
          <button onclick="openAuthModal(); this.closest('.recipe-modal').remove(); document.body.style.overflow='auto';" class="btn btn-primary">
            <i class="fas fa-sign-in-alt"></i> Sign In
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
}

function viewSettings() {
  toggleUserDropdown();
  showMessage('Settings feature coming soon!', 'info');
}

// Render offline results
function renderOfflineResults(ingredients) {
  const container = document.getElementById('recipesContainer');
  if (!container) return;
  
  container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading local recipes...</div>';
  
  setTimeout(() => {
    if (recipes.length === 0) {
      container.innerHTML = '<div class="no-results">No recipes found. Please try different ingredients.</div>';
      return;
    }
    
    let filteredRecipes = recipes;
    
    if (ingredients.trim()) {
      const searchTerms = ingredients.toLowerCase().split(',').map(term => term.trim());
      filteredRecipes = recipes.filter(recipe => {
        const recipeIngredients = (recipe.ingredients || []).join(' ').toLowerCase();
        const recipeName = (recipe.name || '').toLowerCase();
        const recipeDesc = (recipe.description || '').toLowerCase();
        
        return searchTerms.some(term => 
          recipeIngredients.includes(term) || 
          recipeName.includes(term) || 
          recipeDesc.includes(term)
        );
      });
    }
    
    if (filteredRecipes.length === 0) {
      container.innerHTML = '<div class="no-results">No recipes found with those ingredients. Try different ones!</div>';
      return;
    }
    
    container.innerHTML = '';
    filteredRecipes.forEach((recipe, index) => {
      const card = createRecipeCard(recipe, index, 'offline');
      container.appendChild(card);
    });
    
    updateResultsHeader(filteredRecipes.length, ingredients);
  }, 500);
}

// Render online results with real API
async function renderOnlineResults(ingredients) {
  const container = document.getElementById('recipesContainer');
  if (!container) return;
  
  container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> AI is searching thousands of recipes...</div>';
  
  try {
    // Use free recipe API
    const cleanIngredients = ingredients.replace(/[^a-zA-Z,\s]/g, '').trim();
    const apiUrl = `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(cleanIngredients.split(',')[0].trim())}`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (!data.meals || data.meals.length === 0) {
      // Fallback to Edamam API
      const edamamUrl = `https://api.edamam.com/search?q=${encodeURIComponent(ingredients)}&app_id=demo&app_key=demo&from=0&to=12`;
      
      try {
        const edamamResponse = await fetch(edamamUrl);
        const edamamData = await edamamResponse.json();
        
        if (edamamData.hits && edamamData.hits.length > 0) {
          renderEdamamRecipes(edamamData.hits, container, ingredients);
          return;
        }
      } catch (error) {
        console.log('Edamam API failed, using fallback');
      }
      
      // Final fallback to local enhanced search
      renderEnhancedLocalSearch(ingredients, container);
      return;
    }
    
    // Process TheMealDB results
    const apiRecipes = data.meals.slice(0, 12).map(meal => ({
      name: meal.strMeal,
      image: meal.strMealThumb,
      id: meal.idMeal,
      description: `Delicious ${meal.strMeal} recipe from our AI database`,
      time: '30-45 min',
      likes: Math.floor(Math.random() * 1000) + 100,
      source: 'api'
    }));
    
    container.innerHTML = '';
    
    for (let i = 0; i < apiRecipes.length; i++) {
      const recipe = apiRecipes[i];
      
      // Fetch detailed recipe info
      try {
        const detailResponse = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipe.id}`);
        const detailData = await detailResponse.json();
        
        if (detailData.meals && detailData.meals[0]) {
          const meal = detailData.meals[0];
          recipe.ingredients = [];
          recipe.steps = meal.strInstructions ? meal.strInstructions.split('.').filter(step => step.trim()) : [];
          
          // Extract ingredients
          for (let j = 1; j <= 20; j++) {
            const ingredient = meal[`strIngredient${j}`];
            if (ingredient && ingredient.trim()) {
              recipe.ingredients.push(ingredient.trim());
            }
          }
        }
      } catch (error) {
        console.log('Failed to fetch recipe details for', recipe.name);
      }
      
      const card = createApiRecipeCard(recipe, i);
      container.appendChild(card);
    }
    
    updateResultsHeader(apiRecipes.length, ingredients);
    showMessage(`AI found ${apiRecipes.length} recipes from global database!`, 'success');
    
  } catch (error) {
    console.error('API Error:', error);
    showMessage('API search failed, using enhanced local search', 'info');
    renderEnhancedLocalSearch(ingredients, container);
  }
}

// Create API recipe card
function createApiRecipeCard(recipe, index) {
  const card = document.createElement('div');
  card.className = 'recipe-card';
  card.style.position = 'relative';
  
  const imageDiv = document.createElement('div');
  imageDiv.className = 'recipe-image';
  
  if (recipe.image) {
    const img = document.createElement('img');
    img.src = recipe.image;
    img.alt = recipe.name;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.onerror = function() {
      imageDiv.innerHTML = '<div class="recipe-emoji">🍽️</div>';
    };
    imageDiv.appendChild(img);
  } else {
    imageDiv.innerHTML = '<div class="recipe-emoji">🍽️</div>';
  }
  
  // Add API badge
  const apiBadge = document.createElement('div');
  apiBadge.innerHTML = '<span style="background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.8rem; position: absolute; top: 1rem; right: 1rem; z-index: 2;"><i class="fas fa-globe"></i> API</span>';
  card.appendChild(apiBadge);
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'recipe-content';
  
  const title = document.createElement('h3');
  title.className = 'recipe-title';
  title.textContent = recipe.name;
  
  const description = document.createElement('p');
  description.className = 'recipe-description';
  description.textContent = recipe.description;
  
  const metaDiv = document.createElement('div');
  metaDiv.className = 'recipe-meta';
  metaDiv.innerHTML = `
    <span class="recipe-time"><i class="fas fa-clock"></i> ${recipe.time}</span>
    <span class="recipe-likes"><i class="fas fa-heart"></i> ${recipe.likes}</span>
  `;
  
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'recipe-actions';
  
  const viewBtn = document.createElement('button');
  viewBtn.className = 'btn btn-primary';
  viewBtn.innerHTML = '<i class="fas fa-eye"></i> View Recipe';
  viewBtn.addEventListener('click', () => viewRecipe(recipe));
  
  actionsDiv.appendChild(viewBtn);
  
  contentDiv.appendChild(title);
  contentDiv.appendChild(description);
  contentDiv.appendChild(metaDiv);
  contentDiv.appendChild(actionsDiv);
  
  card.appendChild(imageDiv);
  card.appendChild(contentDiv);
  
  return card;
}

// Enhanced local search fallback
function renderEnhancedLocalSearch(ingredients, container) {
  const searchTerms = ingredients.toLowerCase().split(',').map(term => term.trim());
  const enhancedRecipes = recipes.filter(recipe => {
    const recipeIngredients = (recipe.ingredients || []).join(' ').toLowerCase();
    const recipeName = (recipe.name || '').toLowerCase();
    
    return searchTerms.some(term => 
      recipeIngredients.includes(term) || 
      recipeName.includes(term)
    );
  });
  
  container.innerHTML = '';
  
  if (enhancedRecipes.length === 0) {
    container.innerHTML = '<div class="no-results">No recipes found. Try different ingredients!</div>';
    return;
  }
  
  enhancedRecipes.slice(0, 8).forEach((recipe, index) => {
    const card = createRecipeCard(recipe, index, 'enhanced');
    container.appendChild(card);
  });
  
  updateResultsHeader(enhancedRecipes.length, ingredients);
}

// Update results header
function updateResultsHeader(count, ingredients) {
  const header = document.getElementById('resultsHeader');
  if (header) {
    header.innerHTML = `
      <h2>Found ${count} recipes</h2>
      <p>Showing results for: <strong>${ingredients || 'all recipes'}</strong></p>
    `;
  }
}

// Enhanced recipe card creation
function createRecipeCard(recipe, index, mode) {
  const card = document.createElement('div');
  card.className = 'recipe-card';
  card.setAttribute('data-recipe-id', recipe.name || index);
  
  const imageDiv = document.createElement('div');
  imageDiv.className = 'recipe-image';
  
  if (recipe.image && recipe.image.startsWith('assets/')) {
    const img = document.createElement('img');
    img.src = recipe.image;
    img.alt = recipe.name || 'Recipe';
    img.onerror = function() {
      this.style.display = 'none';
      imageDiv.innerHTML = '<div class="recipe-emoji">🍛</div>';
    };
    imageDiv.appendChild(img);
  } else {
    imageDiv.innerHTML = '<div class="recipe-emoji">🍛</div>';
  }
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'recipe-content';
  
  const title = document.createElement('h3');
  title.className = 'recipe-title';
  title.textContent = recipe.name || recipe.RecipeName || 'Delicious Recipe';
  
  const description = document.createElement('p');
  description.className = 'recipe-description';
  description.textContent = recipe.description || 'A wonderful recipe to try';
  
  const metaDiv = document.createElement('div');
  metaDiv.className = 'recipe-meta';
  metaDiv.innerHTML = `
    <span class="recipe-time"><i class="fas fa-clock"></i> ${recipe.time || '30 min'}</span>
    <span class="recipe-likes"><i class="fas fa-heart"></i> ${recipe.likes || 0}</span>
  `;
  
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'recipe-actions';
  
  const viewBtn = document.createElement('button');
  viewBtn.className = 'btn btn-primary';
  viewBtn.innerHTML = '<i class="fas fa-eye"></i> View Recipe';
  viewBtn.addEventListener('click', () => viewRecipe(recipe));
  
  const likeBtn = document.createElement('button');
  likeBtn.className = 'btn btn-outline like-btn';
  likeBtn.innerHTML = '<i class="fas fa-heart"></i>';
  likeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleLike(recipe, likeBtn);
  });
  
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-outline save-btn';
  saveBtn.innerHTML = '<i class="fas fa-bookmark"></i>';
  saveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    saveRecipe(recipe, saveBtn);
  });
  
  actionsDiv.appendChild(viewBtn);
  actionsDiv.appendChild(likeBtn);
  actionsDiv.appendChild(saveBtn);
  
  contentDiv.appendChild(title);
  contentDiv.appendChild(description);
  contentDiv.appendChild(metaDiv);
  contentDiv.appendChild(actionsDiv);
  
  card.appendChild(imageDiv);
  card.appendChild(contentDiv);
  
  return card;
}

// View recipe details
function viewRecipe(recipe) {
  currentRecipe = recipe;
  
  // Track view
  if (typeof FirebaseDB !== 'undefined' && typeof AuthManager !== 'undefined') {
    const userId = AuthManager.getCurrentUserId();
    FirebaseDB.trackRecipeView(recipe.name || 'unknown', userId);
  }
  
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'recipe-modal';
  modal.innerHTML = `
    <div class="recipe-modal-content">
      <div class="recipe-modal-header">
        <h2>${recipe.name || 'Recipe'}</h2>
        <button class="recipe-modal-close" onclick="closeRecipeModal()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="recipe-modal-body">
        <div class="recipe-details">
          <div class="recipe-image-large">
            ${recipe.image ? `<img src="${recipe.image}" alt="${recipe.name}" onerror="this.style.display='none'">` : '<div class="recipe-emoji-large">🍛</div>'}
          </div>
          <div class="recipe-info">
            <p class="recipe-description">${recipe.description || 'A delicious recipe'}</p>
            <div class="recipe-meta-large">
              <span><i class="fas fa-clock"></i> ${recipe.time || '30 min'}</span>
              <span><i class="fas fa-heart"></i> ${recipe.likes || 0} likes</span>
              <span><i class="fas fa-eye"></i> Views</span>
            </div>
            ${recipe.youtube ? `<a href="${recipe.youtube}" target="_blank" class="btn btn-primary"><i class="fab fa-youtube"></i> Watch Video</a>` : ''}
          </div>
        </div>
        
        <div class="recipe-ingredients">
          <h3>Ingredients</h3>
          <ul>
            ${(recipe.ingredients || []).map(ingredient => `<li>${ingredient}</li>`).join('')}
          </ul>
        </div>
        
        <div class="recipe-steps">
          <h3>Instructions</h3>
          <ol>
            ${(recipe.steps || []).map(step => `<li>${step}</li>`).join('')}
          </ol>
        </div>
        
        ${recipe.benefits ? `
          <div class="recipe-benefits">
            <h3>Health Benefits</h3>
            <ul>
              ${recipe.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        <div class="recipe-comments">
          <h3>Comments</h3>
          <div id="commentsContainer">
            <div class="loading">Loading comments...</div>
          </div>
          <div class="comment-form">
            <textarea id="commentText" placeholder="Add a comment..."></textarea>
            <button onclick="addComment()" class="btn btn-primary">Post Comment</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Load comments
  loadRecipeComments(recipe.name || 'unknown');
}

// Close recipe modal
function closeRecipeModal() {
  const modal = document.querySelector('.recipe-modal');
  if (modal) {
    modal.remove();
    document.body.style.overflow = 'auto';
  }
}

// Toggle like
function toggleLike(recipe, button) {
  if (typeof AuthManager === 'undefined' || !AuthManager.isUserLoggedIn()) {
    showMessage('Please login to like recipes!', 'info');
    return;
  }
  
  const userId = AuthManager.getCurrentUserId();
  const recipeId = recipe.name || 'unknown';
  
  if (typeof FirebaseDB !== 'undefined') {
    FirebaseDB.toggleRecipeLike(userId, recipeId).then(result => {
      if (result.error) {
        showMessage('Error updating like status', 'error');
        return;
      }
      
      if (result.liked) {
        button.classList.add('liked');
        button.innerHTML = '<i class="fas fa-heart"></i>';
        showMessage('Recipe liked!', 'success');
      } else {
        button.classList.remove('liked');
        button.innerHTML = '<i class="far fa-heart"></i>';
        showMessage('Recipe unliked!', 'success');
      }
    });
  } else {
    // Fallback for offline mode
    button.classList.toggle('liked');
    const isLiked = button.classList.contains('liked');
    button.innerHTML = isLiked ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
    showMessage(isLiked ? 'Recipe liked!' : 'Recipe unliked!', 'success');
  }
}

// Save recipe
function saveRecipe(recipe, button) {
  if (typeof AuthManager === 'undefined' || !AuthManager.isUserLoggedIn()) {
    showMessage('Please login to save recipes!', 'info');
    return;
  }
  
  const userId = AuthManager.getCurrentUserId();
  
  if (typeof FirebaseDB !== 'undefined') {
    FirebaseDB.saveRecipe(userId, recipe).then(success => {
      if (success) {
        button.classList.add('saved');
        button.innerHTML = '<i class="fas fa-bookmark"></i>';
        showMessage('Recipe saved!', 'success');
      } else {
        showMessage('Error saving recipe', 'error');
      }
    });
  } else {
    // Fallback for offline mode
    const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
    savedRecipes.push(recipe);
    localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
    
    button.classList.add('saved');
    button.innerHTML = '<i class="fas fa-bookmark"></i>';
    showMessage('Recipe saved locally!', 'success');
  }
}

// Load recipe comments
function loadRecipeComments(recipeId) {
  const container = document.getElementById('commentsContainer');
  if (!container) return;
  
  if (typeof FirebaseDB !== 'undefined') {
    FirebaseDB.getRecipeComments(recipeId).then(comments => {
      if (comments.length === 0) {
        container.innerHTML = '<div class="no-comments">No comments yet. Be the first to comment!</div>';
        return;
      }
      
      container.innerHTML = comments.map(comment => `
        <div class="comment">
          <div class="comment-header">
            <strong>${comment.userName || 'Anonymous'}</strong>
            <span class="comment-date">${formatDate(comment.createdAt)}</span>
          </div>
          <div class="comment-text">${comment.comment}</div>
        </div>
      `).join('');
    });
  } else {
    container.innerHTML = '<div class="no-comments">Comments feature requires login</div>';
  }
}

// Add comment
function addComment() {
  if (typeof AuthManager === 'undefined' || !AuthManager.isUserLoggedIn()) {
    showMessage('Please login to comment!', 'info');
    return;
  }
  
  const commentText = document.getElementById('commentText');
  if (!commentText || !commentText.value.trim()) {
    showMessage('Please enter a comment', 'error');
    return;
  }
  
  const userId = AuthManager.getCurrentUserId();
  const user = AuthManager.getCurrentUser();
  const recipeId = currentRecipe?.name || 'unknown';
  
  if (typeof FirebaseDB !== 'undefined') {
    FirebaseDB.addRecipeComment(recipeId, userId, user.displayName || 'Anonymous', commentText.value.trim())
      .then(success => {
        if (success) {
          commentText.value = '';
          showMessage('Comment added!', 'success');
          loadRecipeComments(recipeId);
        } else {
          showMessage('Error adding comment', 'error');
        }
      });
  }
}

// Format date
function formatDate(timestamp) {
  if (!timestamp) return 'Just now';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

// Show message function
function showMessage(message, type = 'info') {
  const existingMessages = document.querySelectorAll('.message-toast');
  existingMessages.forEach(msg => msg.remove());
  
  const toast = document.createElement('div');
  toast.className = `message-toast ${type}`;
  toast.innerHTML = `
    <div class="message-content">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
      <span>${message}</span>
    </div>
  `;
  
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    color: white;
    background: ${type === 'success' ? '#46d369' : type === 'error' ? '#e50914' : '#2196F3'};
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideInRight 0.3s ease-out;
    max-width: 300px;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease-in';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Add lazy loading for images
function addLazyLoading() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
}

// Load today's menu with actual recipes
function loadTodaysMenu() {
  const meals = ['breakfast', 'lunch', 'dinner'];
  const mealRecipes = {
    breakfast: { name: 'Masala Dosa', desc: 'Crispy South Indian crepe with spiced potato filling', time: '45 mins' },
    lunch: { name: 'Rajma Chawal', desc: 'Kidney beans curry with steamed rice', time: '60 mins' },
    dinner: { name: 'Paneer Butter Masala', desc: 'Rich and creamy paneer in tomato gravy', time: '40 mins' }
  };
  
  meals.forEach(meal => {
    const titleEl = document.getElementById(`${meal}Title`);
    const descEl = document.getElementById(`${meal}Desc`);
    const timeEl = document.getElementById(`${meal}Time`);
    
    const recipe = mealRecipes[meal];
    if (titleEl) titleEl.textContent = recipe.name;
    if (descEl) descEl.textContent = recipe.desc;
    if (timeEl) timeEl.textContent = `⏱️ ${recipe.time}`;
  });
}

// Fix Today's Menu click handlers
function refreshTodaysMenu() {
  showMessage('Menu refreshed!', 'success');
  loadTodaysMenu();
}

function viewTodaysRecipe(meal) {
  const mealRecipes = {
    breakfast: { name: 'Masala Dosa', ingredients: ['rice', 'urad dal', 'potato', 'onion', 'spices'] },
    lunch: { name: 'Rajma Chawal', ingredients: ['rajma', 'rice', 'onion', 'tomato', 'spices'] },
    dinner: { name: 'Paneer Butter Masala', ingredients: ['paneer', 'butter', 'tomato', 'cream', 'spices'] }
  };
  
  const recipe = mealRecipes[meal];
  if (recipe) {
    localStorage.setItem('userIngredients', recipe.ingredients.join(', '));
    localStorage.setItem('searchMode', 'offline');
    window.location.href = 'results.html';
  }
}

// Load recent comments with animation
function loadRecentComments() {
  const container = document.getElementById('recentCommentsList');
  if (!container) return;
  
  // Show loading state
  container.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin" style="color: var(--accent); font-size: 2rem;"></i><p style="color: var(--text-secondary); margin-top: 1rem;">Loading comments...</p></div>';
  
  // Simulate loading delay
  setTimeout(() => {
    const sampleComments = [
      { userName: 'Priya S.', comment: 'Amazing Butter Chicken recipe! My family loved it.', rating: 5, recipeName: 'Butter Chicken', time: '2h ago' },
      { userName: 'Raj K.', comment: 'Perfect Dal Tadka. Just like my mom makes!', rating: 5, recipeName: 'Dal Tadka', time: '4h ago' },
      { userName: 'Meera P.', comment: 'The Biryani turned out fantastic. Great instructions!', rating: 4, recipeName: 'Vegetable Biryani', time: '6h ago' },
      { userName: 'Amit T.', comment: 'Loved the Chole Masala! Authentic taste.', rating: 5, recipeName: 'Chole Masala', time: '5h ago' },
      { userName: 'Sneha M.', comment: 'Paneer Tikka was delicious and easy to make.', rating: 4, recipeName: 'Paneer Tikka', time: '8h ago' }
    ];
    
    container.innerHTML = sampleComments.map((comment, index) => `
      <div class="comment-card" style="min-width: 300px; background: var(--bg-card); border-radius: var(--border-radius); padding: 1.5rem; border: 1px solid rgba(255, 255, 255, 0.1); animation: fadeInUp 0.5s ease-out ${index * 0.1}s both;">
        <div class="comment-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <strong style="color: var(--text-primary);">${comment.userName}</strong>
          <span style="color: var(--text-secondary); font-size: 0.9rem;">${comment.time}</span>
        </div>
        <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 1rem;">${comment.comment}</p>
        <div style="display: flex; align-items: center; gap: 1rem;">
          <span style="color: var(--accent);">⭐ ${comment.rating}/5</span>
          <span style="color: var(--text-secondary); font-size: 0.9rem;">${comment.recipeName}</span>
        </div>
      </div>
    `).join('');
  }, 1000);
}


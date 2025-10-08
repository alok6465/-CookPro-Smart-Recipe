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
  
  // Add review form handler if exists
  const reviewForm = document.getElementById('reviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', function(e) {
      e.preventDefault();
      submitReview();
    });
  }
}

// Enhanced AI search with validation
function searchAI() {
  const input = document.getElementById('quickSearchInput');
  if (!input) return;
  
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

// Enhanced render results with smart search
async function renderResults() {
  const mode = localStorage.getItem('searchMode') || 'offline';
  const ingredients = localStorage.getItem('userIngredients');
  const container = document.getElementById('recipeResults');
  
  if (!container) return;
  
  container.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--accent);"></i></div>';
  
  if (mode === 'offline') {
    await loadJSONRecipes();
    let displayRecipes = recipes;
    
    if (ingredients && typeof filterRecipesByIngredients === 'function') {
      displayRecipes = filterRecipesByIngredients(recipes, ingredients);
      console.log(`🔍 Found ${displayRecipes.length} matching recipes for: "${ingredients}"`);
    }
    
    container.innerHTML = '';
    displayRecipes.slice(0, 6).forEach((recipe, index) => {
      const card = createRecipeCard(recipe, index, 'offline');
      container.appendChild(card);
    });
    
    if (displayRecipes.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">No recipes found. Try different ingredients!</div>';
    }
  } else {
    // API mode with enhanced error handling
    try {
      const cleanedIngredients = typeof parseSearchIngredients === 'function' 
        ? parseSearchIngredients(ingredients).join(' ') 
        : ingredients;
      
      const apiUrl = getApiUrl(cleanedIngredients);
      console.log('🌐 API Request:', apiUrl);
      
      // Use enhanced fetch with retry
      const apiRecipes = typeof fetchWithRetry === 'function'
        ? await fetchWithRetry(apiUrl)
        : await (await fetch(apiUrl)).json();
      
      currentApiRecipes = apiRecipes;
      container.innerHTML = '';
      
      if (apiRecipes && apiRecipes.length > 0) {
        apiRecipes.slice(0, 6).forEach((recipe, index) => {
          const card = createRecipeCard(recipe, index, 'online');
          container.appendChild(card);
        });
      } else {
        container.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">No AI recipes found. Try different ingredients!</div>';
      }
    } catch (error) {
      console.error('API Error:', error);
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
          <p>API temporarily unavailable</p>
          <button onclick="localStorage.setItem('searchMode', 'offline'); renderResults();" class="btn btn-primary" style="margin-top: 1rem;">
            Try Offline Mode
          </button>
        </div>
      `;
    }
  }
}

// Performance optimizations
function addLazyLoading() {
  const images = document.querySelectorAll('img[data-src]');
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
  
  images.forEach(img => imageObserver.observe(img));
}

// Debounced search for better performance
const debouncedSearch = typeof debounce === 'function' ? debounce(searchAI, 500) : searchAI;

// Safe message display
function showMessage(message, type = 'info') {
  const existingMessages = document.querySelectorAll('.temp-message');
  existingMessages.forEach(msg => msg.remove());

  const messageDiv = document.createElement('div');
  messageDiv.className = 'temp-message';
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 10000;
    padding: 1rem 2rem; border-radius: 8px; color: white;
    background: ${type === 'success' ? '#46d369' : type === 'error' ? '#e50914' : '#0070f3'};
    animation: slideInRight 0.3s ease-out;
  `;
  
  document.body.appendChild(messageDiv);
  setTimeout(() => messageDiv.remove(), 3000);
}
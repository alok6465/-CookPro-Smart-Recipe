// Global variables
let recipes = [];
let currentRecipe = null;
let currentApiRecipes = [];
let todaysMenu = { breakfast: null, lunch: null, dinner: null };

// Load JSON recipes
async function loadJSONRecipes() {
  try {
    const res = await fetch('recipes_offline.json');
    const data = await res.json();
    recipes = data.filter(recipe => recipe && recipe.name);
    console.log(`✅ Loaded ${recipes.length} recipes`);
    return recipes;
  } catch (err) {
    console.error('❌ Failed to load recipes:', err);
    recipes = [];
    return recipes;
  }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  initializeAuth();
  animateStats();
  loadTodaysMenu();
  loadRecentComments();
  
  // Mobile menu
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');
    });
  }
  
  // Initialize page functionality
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  if (currentPage === 'results.html') {
    initializeResultsPage();
  } else if (currentPage === 'ingredients.html') {
    initializeIngredientsPage();
  } else if (currentPage === 'saved.html') {
    initializeSavedPage();
  } else if (currentPage === 'reviews.html') {
    initializeReviewsPage();
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

// AI search
function searchAI() {
  const ingredients = document.getElementById('quickSearchInput').value.trim();
  if (!ingredients) {
    showMessage('Please enter ingredients first! 🧄');
    return;
  }
  localStorage.setItem('userIngredients', ingredients);
  localStorage.setItem('searchMode', 'online');
  if (window.location.pathname.includes('results.html')) {
    renderResults();
    setTimeout(() => {
      document.getElementById('recipes').scrollIntoView({ behavior: 'smooth' });
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
    // API mode with enhanced search
    try {
      const cleanedIngredients = typeof parseSearchIngredients === 'function' 
        ? parseSearchIngredients(ingredients).join(' ') 
        : ingredients;
      
      const apiUrl = getApiUrl(cleanedIngredients);
      console.log('🌐 API Request:', apiUrl);
      
      const response = await fetch(apiUrl);
      const apiRecipes = await response.json();
      
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
      container.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">API not available. Please try offline mode.</div>';
    }
  }
}
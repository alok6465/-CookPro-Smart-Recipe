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

// Render results
async function renderResults() {
  const mode = localStorage.getItem('searchMode') || 'offline';
  const ingredients = localStorage.getItem('userIngredients');
  const container = document.getElementById('recipeResults');
  
  if (!container) return;
  
  container.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--accent);"></i></div>';
  
  if (mode === 'offline') {
    await loadJSONRecipes();
    let displayRecipes = recipes;
    
    if (ingredients) {
      displayRecipes = recipes.filter(recipe =>
        recipe.ingredients && recipe.ingredients.some(ing => 
          ingredients.toLowerCase().split(',').some(userIng => 
            ing.toLowerCase().includes(userIng.trim())
          )
        )
      );
    }
    
    container.innerHTML = '';
    displayRecipes.slice(0, 6).forEach((recipe, index) => {
      const card = createRecipeCard(recipe, index, 'offline');
      container.appendChild(card);
    });
  } else {
    // API mode
    try {
      const apiUrl = `http://localhost:4000/?q=${encodeURIComponent(ingredients)}`;
      const response = await fetch(apiUrl);
      const apiRecipes = await response.json();
      
      currentApiRecipes = apiRecipes;
      container.innerHTML = '';
      
      if (apiRecipes && apiRecipes.length > 0) {
        apiRecipes.slice(0, 6).forEach((recipe, index) => {
          const card = createRecipeCard(recipe, index, 'online');
          container.appendChild(card);
        });
      }
    } catch (error) {
      console.error('API Error:', error);
      container.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">API not available. Please try offline mode.</div>';
    }
  }
}

// Create recipe card
function createRecipeCard(recipe, index, mode) {
  const card = document.createElement('div');
  card.className = 'recipe-card';
  
  const name = recipe.name || recipe.RecipeName || 'Unknown Recipe';
  const time = recipe.time || (recipe.TotalTimeInMins ? `${recipe.TotalTimeInMins} mins` : '30 mins');
  const recipeId = generateRecipeId(recipe);
  const description = recipe.description || recipe.benefits?.[0] || 'Delicious Indian recipe';
  
  const imageContent = (mode === 'offline' && recipe.image) ? 
    `<img src="${recipe.image}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover;">` : 
    `<div style="font-size: 3rem; display: flex; align-items: center; justify-content: center; height: 100%; background: var(--gradient-primary);">🍛</div>`;
  
  card.setAttribute('data-recipe-id', recipeId);
  card.setAttribute('data-recipe-index', index);
  card.setAttribute('data-recipe-mode', mode);
  
  card.innerHTML = `
    <div class="recipe-image" style="position: relative; overflow: hidden;">
      ${imageContent}
      <div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem;">
        <i class="fas fa-heart" style="color: #e50914;"></i> <span class="like-count">0</span>
      </div>
      <div style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem;">
        <i class="fas fa-eye" style="color: #4CAF50;"></i> <span class="view-count">0</span>
      </div>
      <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.8)); padding: 20px 15px 15px; color: white;">
        <div style="font-size: 0.9rem; opacity: 0.9;">
          <i class="fas fa-clock"></i> ${time}
        </div>
      </div>
    </div>
    <div class="recipe-content">
      <h3 class="recipe-title">${name}</h3>
      <p class="recipe-description">${description.substring(0, 80)}${description.length > 80 ? '...' : ''}</p>
      <div class="recipe-actions">
        <button class="btn btn-primary" onclick="openRecipeModal(${index}, '${mode}')">
          <i class="fas fa-eye"></i> View Recipe
        </button>
        <button class="btn btn-outline" onclick="saveRecipe('${name}', ${index}, '${mode}')">
          <i class="fas fa-bookmark"></i> Save
        </button>
        <button class="btn btn-outline" onclick="shareRecipe('${name}', ${index}, '${mode}')">
          <i class="fas fa-share"></i> Share
        </button>
      </div>
    </div>
  `;
  
  // Load Firebase counts
  setTimeout(async () => {
    if (typeof FirebaseDB !== 'undefined') {
      try {
        const likes = await FirebaseDB.getRecipeLikes(recipeId);
        const views = await FirebaseDB.getRecipeViews(recipeId);
        card.querySelector('.like-count').textContent = likes;
        card.querySelector('.view-count').textContent = views;
      } catch (error) {
        console.error('Error loading counts:', error);
      }
    }
  }, 1000);
  
  return card;
}

// Open recipe modal - FIXED INDEX ISSUE
function openRecipeModal(index, mode) {
  let recipe = null;
  
  // Get the correct recipe based on mode
  if (mode === 'offline') {
    const userIngredients = localStorage.getItem('userIngredients');
    if (userIngredients) {
      // Filter recipes first, then get by index
      const filteredRecipes = recipes.filter(r =>
        r.ingredients && r.ingredients.some(ing => 
          userIngredients.toLowerCase().split(',').some(userIng => 
            ing.toLowerCase().includes(userIng.trim())
          )
        )
      );
      recipe = filteredRecipes[index] || recipes[index];
    } else {
      recipe = recipes[index];
    }
  } else if (mode === 'online') {
    recipe = currentApiRecipes[index];
  }
  
  if (!recipe) {
    showMessage('Recipe not found!');
    return;
  }
  
  currentRecipe = recipe;
  console.log('Opening recipe:', recipe.name || recipe.RecipeName);
  
  let modal = document.getElementById('recipeModal');
  if (!modal) {
    modal = createRecipeModal();
    document.body.appendChild(modal);
  }
  
  if (mode === 'online') {
    displayApiRecipe(recipe, modal);
  } else {
    displayOfflineRecipe(recipe, modal);
  }
  
  // Track view and initialize
  const recipeId = generateRecipeId(recipe);
  setTimeout(async () => {
    if (typeof FirebaseDB !== 'undefined') {
      const userId = (typeof AuthManager !== 'undefined' && AuthManager.isUserLoggedIn()) ? AuthManager.getCurrentUserId() : null;
      await FirebaseDB.trackRecipeView(recipeId, userId);
      await initializeLikeButton(recipe);
      await loadRecipeComments(recipeId);
      await updateCounts(recipeId);
    }
  }, 500);
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Display offline recipe
function displayOfflineRecipe(recipe, modal) {
  const recipeName = recipe.name || 'Recipe';
  const totalTime = recipe.time || '30 mins';
  
  const modalContent = `
    <div class="modal-header">
      <button class="modal-close" onclick="closeRecipeModal()">
        <i class="fas fa-times"></i>
      </button>
      <span>🍛</span>
    </div>
    <div class="modal-body">
      <h2 class="modal-title">${recipeName}</h2>
      <div class="modal-meta">
        <span><i class="fas fa-clock"></i> ${totalTime}</span>
        <span><i class="fas fa-users"></i> 4 servings</span>
        <span><i class="fas fa-utensils"></i> Indian</span>
      </div>
      
      <div class="modal-actions">
        <button class="btn btn-outline" onclick="likeRecipe()">
          <i class="fas fa-heart"></i> Like
        </button>
        <button class="btn btn-primary" onclick="saveCurrentRecipe()">
          <i class="fas fa-bookmark"></i> Save
        </button>
        ${recipe.youtube ? `<button class="btn btn-outline" onclick="watchVideo('${recipe.youtube}')">
          <i class="fab fa-youtube"></i> Watch Video
        </button>` : ''}
        <button class="btn btn-outline" onclick="downloadRecipe()">
          <i class="fas fa-download"></i> Download
        </button>
      </div>

      <div class="recipe-section">
        <h3><i class="fas fa-list"></i> Ingredients</h3>
        <ul>${recipe.ingredients?.map(ing => `<li>${ing}</li>`).join('') || '<li>No ingredients listed</li>'}</ul>
      </div>

      <div class="recipe-section">
        <h3><i class="fas fa-clipboard-list"></i> Instructions</h3>
        <ol>${recipe.steps?.map(step => `<li>${step}</li>`).join('') || '<li>No instructions available</li>'}</ol>
      </div>

      <div class="recipe-section">
        <h3><i class="fas fa-heart"></i> Benefits</h3>
        <p>${Array.isArray(recipe.benefits) ? recipe.benefits.join(' ') : (recipe.benefits || recipe.description || 'Nutritious and delicious!')}</p>
      </div>
      
      <div class="recipe-section">
        <h3><i class="fas fa-comments"></i> Comments</h3>
        <div id="commentForm" style="margin-bottom: 2rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
          <textarea id="commentInput" placeholder="Share your cooking experience..." style="width: 100%; padding: 0.75rem; border: 1px solid rgba(255,255,255,0.2); border-radius: 5px; background: var(--bg-primary); color: var(--text-primary); resize: vertical; min-height: 80px;"></textarea>
          <button onclick="submitComment()" class="btn btn-primary" style="margin-top: 0.5rem;">
            <i class="fas fa-paper-plane"></i> Post Comment
          </button>
        </div>
        <div id="commentsContainer"></div>
      </div>
    </div>
  `;
  
  modal.querySelector('.modal-content').innerHTML = modalContent;
}

// Display API recipe
function displayApiRecipe(recipe, modal) {
  const recipeName = recipe.RecipeName || recipe.TranslatedRecipeName || 'API Recipe';
  
  let ingredientsList = '';
  if (recipe.TranslatedIngredients) {
    const ingredients = recipe.TranslatedIngredients.split(',');
    ingredientsList = ingredients.map(ing => `<li>${ing.trim()}</li>`).join('');
  }
  
  let instructionsList = '';
  if (recipe.URL) {
    const instructions = recipe.URL.split('.').filter(step => step.trim().length > 10);
    instructionsList = instructions.map((step, index) => `<li><strong>Step ${index + 1}:</strong> ${step.trim()}.</li>`).join('');
  }
  
  const modalContent = `
    <div class="modal-header">
      <button class="modal-close" onclick="closeRecipeModal()">
        <i class="fas fa-times"></i>
      </button>
      <span>🤖</span>
    </div>
    <div class="modal-body">
      <h2 class="modal-title">${recipeName}</h2>
      
      <div class="modal-actions">
        <button class="btn btn-outline" onclick="likeRecipe()">
          <i class="fas fa-heart"></i> Like
        </button>
        <button class="btn btn-primary" onclick="saveCurrentRecipe()">
          <i class="fas fa-bookmark"></i> Save
        </button>
        <button class="btn btn-outline" onclick="downloadRecipe()">
          <i class="fas fa-download"></i> Download
        </button>
      </div>
      
      <div class="recipe-details" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
        ${recipe.TotalTimeInMins ? `<div><strong>⏱️ Total Time:</strong> ${recipe.TotalTimeInMins} mins</div>` : ''}
        <div><strong>👥 Servings:</strong> ${recipe.Servings || '4'}</div>
        <div><strong>🍽️ Cuisine:</strong> ${recipe.Cuisine || 'Indian'}</div>
        <div><strong>🌱 Diet:</strong> ${recipe.Diet || 'Vegetarian'}</div>
      </div>
      
      ${ingredientsList ? `
        <div class="recipe-section">
          <h3><i class="fas fa-list"></i> Ingredients</h3>
          <ul>${ingredientsList}</ul>
        </div>
      ` : ''}
      
      ${instructionsList ? `
        <div class="recipe-section">
          <h3><i class="fas fa-clipboard-list"></i> Instructions</h3>
          <ol>${instructionsList}</ol>
        </div>
      ` : ''}
      
      <div class="recipe-section">
        <h3><i class="fas fa-comments"></i> Comments</h3>
        <div id="commentForm" style="margin-bottom: 2rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
          <textarea id="commentInput" placeholder="Share your cooking experience..." style="width: 100%; padding: 0.75rem; border: 1px solid rgba(255,255,255,0.2); border-radius: 5px; background: var(--bg-primary); color: var(--text-primary); resize: vertical; min-height: 80px;"></textarea>
          <button onclick="submitComment()" class="btn btn-primary" style="margin-top: 0.5rem;">
            <i class="fas fa-paper-plane"></i> Post Comment
          </button>
        </div>
        <div id="commentsContainer"></div>
      </div>
    </div>
  `;
  
  modal.querySelector('.modal-content').innerHTML = modalContent;
}

// Create recipe modal
function createRecipeModal() {
  const modal = document.createElement('div');
  modal.id = 'recipeModal';
  modal.className = 'recipe-modal';
  modal.innerHTML = '<div class="modal-content"></div>';
  
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeRecipeModal();
    }
  });
  
  return modal;
}

// Close modal
function closeRecipeModal() {
  const modal = document.getElementById('recipeModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    currentRecipe = null;
  }
}

// Generate recipe ID
function generateRecipeId(recipe) {
  const name = recipe.name || recipe.RecipeName || recipe.TranslatedRecipeName || 'unknown';
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

// Like recipe
async function likeRecipe() {
  if (!currentRecipe) return;
  
  if (typeof AuthManager === 'undefined' || !AuthManager.isUserLoggedIn()) {
    showMessage('Please login to like recipes! 🔐');
    return;
  }
  
  const userId = AuthManager.getCurrentUserId();
  const recipeId = generateRecipeId(currentRecipe);
  const likeBtn = document.querySelector('.modal-actions .btn[onclick="likeRecipe()"]');
  
  if (!likeBtn) return;
  
  try {
    const result = await FirebaseDB.toggleRecipeLike(userId, recipeId);
    
    if (result.liked) {
      likeBtn.innerHTML = '<i class="fas fa-heart" style="color: #e50914;"></i> Liked';
      likeBtn.style.background = 'rgba(229, 9, 20, 0.1)';
      showMessage('Recipe liked! ❤️');
    } else {
      likeBtn.innerHTML = '<i class="far fa-heart"></i> Like';
      likeBtn.style.background = '';
      showMessage('Recipe unliked!');
    }
    
    updateCounts(recipeId);
  } catch (error) {
    console.error('Error toggling like:', error);
    showMessage('Failed to update like.');
  }
}

// Initialize like button
async function initializeLikeButton(recipe) {
  if (typeof AuthManager === 'undefined' || !AuthManager.isUserLoggedIn()) return;
  
  const userId = AuthManager.getCurrentUserId();
  const recipeId = generateRecipeId(recipe);
  const likeBtn = document.querySelector('.modal-actions .btn[onclick="likeRecipe()"]');
  
  if (!likeBtn) return;
  
  try {
    const isLiked = await FirebaseDB.isRecipeLiked(userId, recipeId);
    
    if (isLiked) {
      likeBtn.innerHTML = '<i class="fas fa-heart" style="color: #e50914;"></i> Liked';
      likeBtn.style.background = 'rgba(229, 9, 20, 0.1)';
    } else {
      likeBtn.innerHTML = '<i class="far fa-heart"></i> Like';
      likeBtn.style.background = '';
    }
  } catch (error) {
    console.error('Error initializing like button:', error);
  }
}

// Update counts
async function updateCounts(recipeId) {
  try {
    const likes = await FirebaseDB.getRecipeLikes(recipeId);
    const views = await FirebaseDB.getRecipeViews(recipeId);
    
    document.querySelectorAll(`[data-recipe-id="${recipeId}"] .like-count`).forEach(el => {
      el.textContent = likes;
    });
    document.querySelectorAll(`[data-recipe-id="${recipeId}"] .view-count`).forEach(el => {
      el.textContent = views;
    });
  } catch (error) {
    console.error('Error updating counts:', error);
  }
}

// Load comments for any container
async function loadRecipeComments(recipeId, containerId = 'commentsContainer') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Show loading animation
  showFirebaseLoading(container, 'Loading comments...');
  
  try {
    const comments = await FirebaseDB.getRecipeComments(recipeId);
    
    // Hide loading animation
    hideFirebaseLoading(container);
    
    if (comments.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No comments yet. Be the first to share your experience!</p>';
      return;
    }
    
    container.innerHTML = comments.map(comment => {
      const timeAgo = comment.createdAt ? formatTimeAgo(comment.createdAt.toDate()) : 'Just now';
      const isOwner = (typeof AuthManager !== 'undefined' && AuthManager.isUserLoggedIn() && AuthManager.getCurrentUserId() === comment.userId);
      
      return `
        <div class="comment-item" style="padding: 1rem; margin-bottom: 1rem; background: var(--bg-primary); border-radius: 8px; border-left: 3px solid var(--accent);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <i class="fas fa-user-circle" style="color: var(--accent); font-size: 1.2rem;"></i>
              <strong style="color: var(--text-primary);">${comment.userName}</strong>
              <span style="color: var(--text-secondary); font-size: 0.8rem;">${timeAgo}</span>
            </div>
            ${isOwner ? `<button onclick="deleteComment('${comment.id}')" style="background: none; border: none; color: var(--text-secondary); cursor: pointer;"><i class="fas fa-trash"></i></button>` : ''}
          </div>
          <p style="color: var(--text-secondary); line-height: 1.6; margin: 0;">${comment.comment}</p>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading comments:', error);
  }
}

// Load all comments for community reviews
async function loadCommunityReviews() {
  const container = document.getElementById('reviewsList');
  if (!container) return;
  
  // Show loading animation
  showFirebaseLoading(container, 'Loading community reviews...');
  
  try {
    // Wait for Firebase
    let attempts = 0;
    while (typeof FirebaseDB === 'undefined' && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (typeof FirebaseDB === 'undefined') {
      hideFirebaseLoading(container);
      container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No reviews yet.</p>';
      return;
    }
    
    const allComments = [];
    
    // Get comments from all recipes
    await loadJSONRecipes();
    for (const recipe of recipes) {
      const recipeId = generateRecipeId(recipe);
      const comments = await FirebaseDB.getRecipeComments(recipeId);
      comments.forEach(comment => {
        allComments.push({
          ...comment,
          recipeName: recipe.name,
          recipeEmoji: '🍛'
        });
      });
    }
    
    // Also get general reviews
    const generalReviews = await FirebaseDB.getRecipeComments('general_reviews');
    generalReviews.forEach(comment => {
      allComments.push({
        ...comment,
        recipeName: 'General Review',
        recipeEmoji: '⭐'
      });
    });
    
    // Sort by newest first
    allComments.sort((a, b) => {
      const timeA = a.createdAt ? a.createdAt.toDate().getTime() : 0;
      const timeB = b.createdAt ? b.createdAt.toDate().getTime() : 0;
      return timeB - timeA;
    });
    
    // Hide loading animation
    hideFirebaseLoading(container);
    
    if (allComments.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No reviews yet. Be the first to share your experience!</p>';
      return;
    }
    
    container.innerHTML = '';
    allComments.slice(0, 12).forEach((comment, index) => {
      const isLongComment = comment.comment.length > 150;
      const truncatedComment = isLongComment ? comment.comment.substring(0, 150) + '...' : comment.comment;
      const timeAgo = comment.createdAt ? formatTimeAgo(comment.createdAt.toDate()) : 'Just now';
      
      const reviewCard = document.createElement('div');
      reviewCard.className = 'comment-card';
      reviewCard.style.cssText = `
        animation: fadeInUp 0.6s ease-out ${index * 0.1}s both;
        max-width: none;
        height: auto;
        margin-bottom: 0;
      `;
      
      reviewCard.innerHTML = `
        <div class="comment-header">
          <div class="comment-user">
            <div class="comment-avatar">${comment.userName.charAt(0).toUpperCase()}</div>
            <div class="comment-user-info">
              <h4>${comment.userName}</h4>
              <a href="#" class="comment-recipe">${comment.recipeName}</a>
            </div>
          </div>
          <div class="comment-time">${timeAgo}</div>
        </div>
        <div class="comment-text ${isLongComment ? '' : 'expanded'}" id="review-text-${index}">
          ${isLongComment ? truncatedComment : comment.comment}
        </div>
        ${isLongComment ? `<button class="comment-see-more" onclick="expandReview(${index}, '${comment.comment.replace(/'/g, "\\'")}')">See More</button>` : ''}
      `;
      
      container.appendChild(reviewCard);
    });
    
  } catch (error) {
    console.error('Error loading community reviews:', error);
  }
}

// Create review card from comment
function createReviewCard(comment, index) {
  const card = document.createElement('div');
  card.className = 'recipe-card';
  card.style.animationDelay = `${index * 0.1}s`;
  
  const timeAgo = comment.createdAt ? formatTimeAgo(comment.createdAt.toDate()) : 'Just now';
  
  card.innerHTML = `
    <div class="recipe-content" style="padding: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 1.5rem;">${comment.recipeEmoji}</span>
          <div>
            <h3 class="recipe-title" style="margin: 0; font-size: 1.1rem;">${comment.userName}</h3>
            <p style="color: var(--text-secondary); margin: 0; font-size: 0.9rem;">${comment.recipeName}</p>
          </div>
        </div>
        <span style="color: var(--text-secondary); font-size: 0.8rem;">${timeAgo}</span>
      </div>
      <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 1rem;">${comment.comment}</p>
      <div style="display: flex; gap: 0.5rem;">
        <span style="background: var(--accent); color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.8rem;">⭐ Review</span>
      </div>
    </div>
  `;
  
  return card;
}

// Submit comment
async function submitComment() {
  console.log('submitComment called');
  
  const commentInput = document.getElementById('commentInput');
  const comment = commentInput.value.trim();
  
  console.log('Comment text:', comment);
  
  if (!comment) {
    showMessage('Please enter a comment!');
    return;
  }
  
  // Wait for Firebase and Auth to load
  let attempts = 0;
  while ((typeof FirebaseDB === 'undefined' || typeof AuthManager === 'undefined') && attempts < 50) {
    console.log('Waiting for Firebase/Auth...', attempts);
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  console.log('Firebase available:', typeof FirebaseDB !== 'undefined');
  console.log('AuthManager available:', typeof AuthManager !== 'undefined');
  
  if (typeof AuthManager === 'undefined' || !AuthManager.isUserLoggedIn()) {
    showMessage('Please login to comment!');
    return;
  }
  
  if (!currentRecipe) {
    showMessage('No recipe selected!');
    return;
  }
  
  const userId = AuthManager.getCurrentUserId();
  const userName = AuthManager.getCurrentUser().displayName || 'Anonymous User';
  const recipeId = generateRecipeId(currentRecipe);
  
  console.log('Submitting comment:', { recipeId, userId, userName, comment });
  
  try {
    const success = await FirebaseDB.addRecipeComment(recipeId, userId, userName, comment);
    
    console.log('Comment submission result:', success);
    
    if (success) {
      commentInput.value = '';
      showMessage('Comment posted successfully!');
      
      // Reload comments immediately
      console.log('Reloading comments...');
      loadRecipeComments(recipeId);
      
      // Refresh other sections immediately
      setTimeout(() => {
        console.log('Refreshing community reviews and recent comments...');
        if (document.getElementById('reviewsList')) {
          loadCommunityReviews();
        }
        if (document.getElementById('recentCommentsList')) {
          loadRecentComments();
        }
      }, 500);
    } else {
      showMessage('Failed to post comment.');
    }
  } catch (error) {
    console.error('Error posting comment:', error);
    showMessage('Error posting comment: ' + error.message);
  }
}

// Submit review (for reviews.html)
async function submitReview() {
  const commentInput = document.getElementById('reviewComment');
  const comment = commentInput.value.trim();
  
  if (!comment) {
    showMessage('Please enter a review!');
    return;
  }
  
  // Wait for Firebase and Auth to load
  let attempts = 0;
  while ((typeof FirebaseDB === 'undefined' || typeof AuthManager === 'undefined') && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  if (typeof AuthManager === 'undefined' || !AuthManager.isUserLoggedIn()) {
    showMessage('Please login to post reviews!');
    return;
  }
  
  const userId = AuthManager.getCurrentUserId();
  const userName = AuthManager.getCurrentUser().displayName || 'Anonymous User';
  
  // Use a general review ID for reviews page
  const reviewId = 'general_reviews';
  
  try {
    const success = await FirebaseDB.addRecipeComment(reviewId, userId, userName, comment);
    
    if (success) {
      commentInput.value = '';
      showMessage('Review posted successfully!');
      
      // Reload reviews and recent comments
      setTimeout(() => {
        loadCommunityReviews();
        if (document.getElementById('recentCommentsList')) {
          loadRecentComments();
        }
      }, 500);
    } else {
      showMessage('Failed to post review.');
    }
  } catch (error) {
    console.error('Error posting review:', error);
    showMessage('Error posting review.');
  }
}

// Delete comment
async function deleteComment(commentId) {
  if (!confirm('Delete this comment?')) return;
  
  const userId = AuthManager.getCurrentUserId();
  
  try {
    const success = await FirebaseDB.deleteComment(commentId, userId);
    
    if (success) {
      showMessage('Comment deleted!');
      const recipeId = generateRecipeId(currentRecipe);
      loadRecipeComments(recipeId);
    } else {
      showMessage('Failed to delete comment.');
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
  }
}

// Format time ago
function formatTimeAgo(date) {
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

// Save recipe
async function saveRecipe(name, index, mode) {
  let recipe = null;
  
  if (mode === 'offline') {
    recipe = recipes[index];
  } else if (mode === 'online') {
    recipe = currentApiRecipes[index];
  }
  
  if (recipe) {
    await saveRecipeToFirebase(recipe);
  }
}

async function saveCurrentRecipe() {
  if (currentRecipe) {
    await saveRecipeToFirebase(currentRecipe);
  }
}

async function saveRecipeToFirebase(recipe) {
  if (typeof AuthManager === 'undefined' || !AuthManager.isUserLoggedIn()) {
    showMessage('Please login to save recipes! 🔐');
    openAuthModal();
    return;
  }
  
  const userId = AuthManager.getCurrentUserId();
  const recipeName = recipe.name || recipe.RecipeName || 'Unknown Recipe';
  
  try {
    // Check if recipe is already saved
    const savedRecipes = await FirebaseDB.getSavedRecipes(userId);
    const recipeId = generateRecipeId(recipe);
    
    const alreadySaved = savedRecipes.some(saved => {
      const savedId = generateRecipeId(saved);
      return savedId === recipeId;
    });
    
    if (alreadySaved) {
      showMessage(`"${recipeName}" is already saved! 📚`);
      return;
    }
    
    const success = await FirebaseDB.saveRecipe(userId, recipe);
    
    if (success) {
      showMessage(`"${recipeName}" saved! 🔖`);
    } else {
      showMessage('Failed to save recipe.');
    }
  } catch (error) {
    console.error('Error saving recipe:', error);
    showMessage('Error saving recipe.');
  }
}

// Share recipe
function shareRecipe(name, index, mode) {
  const shareText = `Check out this amazing ${name} recipe from CookPro! 🍛`;
  const shareUrl = window.location.origin;
  
  if (navigator.share) {
    navigator.share({
      title: `${name} - CookPro`,
      text: shareText,
      url: shareUrl
    }).then(() => {
      showMessage('Recipe shared! 📤');
    }).catch(() => {
      fallbackShare(shareText, shareUrl);
    });
  } else {
    fallbackShare(shareText, shareUrl);
  }
}

function fallbackShare(shareText, shareUrl) {
  const shareData = `${shareText}\n\n${shareUrl}`;
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(shareData).then(() => {
      showMessage('Recipe details copied to clipboard! 📋');
    });
  } else {
    showMessage('Share feature not supported on this browser.');
  }
}

// Watch video function
function watchVideo(youtubeUrl) {
  if (!youtubeUrl) return;
  
  // Extract video ID from YouTube URL
  const videoId = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (!videoId) return;
  
  // Create video modal
  const videoModal = document.createElement('div');
  videoModal.className = 'video-modal';
  videoModal.innerHTML = `
    <div class="video-modal-content">
      <div class="video-modal-header">
        <h3>Recipe Video Tutorial</h3>
        <button class="video-modal-close" onclick="closeVideoModal()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="video-container">
        <iframe 
          src="https://www.youtube.com/embed/${videoId[1]}?autoplay=1" 
          frameborder="0" 
          allowfullscreen
          allow="autoplay; encrypted-media">
        </iframe>
      </div>
    </div>
  `;
  
  document.body.appendChild(videoModal);
  videoModal.classList.add('active');
  document.body.style.overflow = 'hidden';
  showMessage('Loading video tutorial! 🎥');
}

// Close video modal
function closeVideoModal() {
  const videoModal = document.querySelector('.video-modal');
  if (videoModal) {
    videoModal.remove();
    document.body.style.overflow = 'auto';
  }
}

// Download recipe
function downloadRecipe() {
  if (!currentRecipe) return;
  
  const name = currentRecipe.name || currentRecipe.RecipeName || currentRecipe.TranslatedRecipeName || 'Recipe';
  const time = currentRecipe.time || (currentRecipe.TotalTimeInMins ? `${currentRecipe.TotalTimeInMins} mins` : '30 mins');
  const servings = currentRecipe.Servings || '4';
  const cuisine = currentRecipe.Cuisine || 'Indian';
  const diet = currentRecipe.Diet || 'Vegetarian';
  
  // Format ingredients
  let ingredients = 'Not available';
  if (currentRecipe.ingredients) {
    ingredients = currentRecipe.ingredients.map((ing, i) => `${i + 1}. ${ing}`).join('\n');
  } else if (currentRecipe.TranslatedIngredients) {
    const ingList = currentRecipe.TranslatedIngredients.split(',');
    ingredients = ingList.map((ing, i) => `${i + 1}. ${ing.trim()}`).join('\n');
  }
  
  // Format instructions
  let instructions = 'Not available';
  if (currentRecipe.steps) {
    instructions = currentRecipe.steps.map((step, i) => `${i + 1}. ${step}`).join('\n');
  } else if (currentRecipe.URL) {
    const steps = currentRecipe.URL.split('.').filter(step => step.trim().length > 10);
    instructions = steps.map((step, i) => `${i + 1}. ${step.trim()}.`).join('\n');
  }
  
  // Format benefits
  let benefits = '';
  if (currentRecipe.benefits) {
    benefits = Array.isArray(currentRecipe.benefits) ? currentRecipe.benefits.join(' ') : currentRecipe.benefits;
  } else if (currentRecipe.description) {
    benefits = currentRecipe.description;
  }
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${name} - CookPro Recipe</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
        h1 { color: #e50914; margin-bottom: 10px; }
        .recipe-info { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .section { margin: 20px 0; }
        .section h3 { color: #333; border-bottom: 2px solid #e50914; padding-bottom: 5px; }
        .ingredients, .instructions { white-space: pre-line; }
        @media print { .no-print { display: none; } }
      </style>
    </head>
    <body>
      <h1>🍛 ${name}</h1>
      
      <div class="recipe-info">
        <strong>⏱️ Cooking Time:</strong> ${time}<br>
        <strong>👥 Servings:</strong> ${servings}<br>
        <strong>🍽️ Cuisine:</strong> ${cuisine}<br>
        <strong>🌱 Diet:</strong> ${diet}
      </div>
      
      <div class="section">
        <h3>📝 Ingredients</h3>
        <div class="ingredients">${ingredients}</div>
      </div>
      
      <div class="section">
        <h3>👨‍🍳 Instructions</h3>
        <div class="instructions">${instructions}</div>
      </div>
      
      ${benefits ? `
        <div class="section">
          <h3>💚 Benefits</h3>
          <p>${benefits}</p>
        </div>
      ` : ''}
      
      <div class="no-print" style="text-align: center; margin: 30px 0;">
        <button onclick="window.print()" style="background: #e50914; color: white; padding: 12px 24px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin-right: 10px;">📄 Download PDF</button>
        <button onclick="window.close()" style="background: #666; color: white; padding: 12px 24px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">❌ Close</button>
      </div>
      
      <footer style="margin-top: 40px; text-align: center; color: #666; border-top: 1px solid #ddd; padding-top: 20px;">
        <p>Generated by CookPro - Smart Recipe Platform</p>
        <p>Visit us at: ${window.location.origin}</p>
      </footer>
    </body>
    </html>
  `);
  printWindow.document.close();
  
  showMessage('Recipe PDF opened! 📄');
}

// Saved page
function initializeSavedPage() {
  setTimeout(() => {
    showSavedRecipes();
  }, 500);
}

async function showSavedRecipes() {
  const container = document.getElementById('savedRecipes');
  if (!container) return;
  
  // Show Firebase loading animation
  showFirebaseLoading(container, 'Loading your saved recipes...');
  
  if (typeof AuthManager === 'undefined' || !AuthManager.isUserLoggedIn()) {
    container.innerHTML = `
      <div style="text-align: center; padding: 4rem;">
        <h3>Login Required</h3>
        <p>Please login to view saved recipes.</p>
        <button class="btn btn-primary" onclick="openAuthModal()">Login</button>
      </div>
    `;
    return;
  }
  
  try {
    const saved = await FirebaseDB.getSavedRecipes(AuthManager.getCurrentUserId());
    
    // Hide loading animation
    hideFirebaseLoading(container);
    
    if (saved.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 4rem;">
          <h3>No saved recipes</h3>
          <p>Start exploring and save your favorites!</p>
          <a href="ingredients.html" class="btn btn-primary">Find Recipes</a>
        </div>
      `;
      return;
    }
    
    container.innerHTML = '';
    saved.forEach((recipe, index) => {
      const card = createSavedRecipeCard(recipe, index);
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading saved recipes:', error);
    hideFirebaseLoading(container);
    container.innerHTML = '<div style="text-align: center; padding: 2rem;">Error loading recipes.</div>';
  }
}

function createSavedRecipeCard(recipe, index) {
  const card = document.createElement('div');
  card.className = 'recipe-card';
  
  const name = recipe.name || recipe.RecipeName || 'Saved Recipe';
  const time = recipe.time || (recipe.TotalTimeInMins ? `${recipe.TotalTimeInMins} mins` : '30 mins');
  
  card.innerHTML = `
    <div class="recipe-image" style="position: relative; overflow: hidden;">
      <div style="font-size: 3rem; display: flex; align-items: center; justify-content: center; height: 150px; background: var(--gradient-primary);">🍛</div>
      <div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem;">
        <i class="fas fa-bookmark" style="color: #4CAF50;"></i> Saved
      </div>
    </div>
    <div class="recipe-content">
      <h3 class="recipe-title">${name}</h3>
      <div class="recipe-meta">
        <span>⏱️ ${time}</span>
        <span>🍽️ Indian</span>
      </div>
      <div class="recipe-actions">
        <button class="btn btn-primary" onclick="openSavedRecipeModal(${index})">
          <i class="fas fa-eye"></i> View Recipe
        </button>
        <button class="btn btn-outline" onclick="deleteSavedRecipe(${index})">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    </div>
  `;
  
  return card;
}

let currentSavedRecipes = [];

async function openSavedRecipeModal(index) {
  if (typeof AuthManager !== 'undefined' && AuthManager.isUserLoggedIn()) {
    try {
      currentSavedRecipes = await FirebaseDB.getSavedRecipes(AuthManager.getCurrentUserId());
    } catch (error) {
      console.error('Error loading saved recipes:', error);
      return;
    }
  }
  
  const recipe = currentSavedRecipes[index];
  if (!recipe) return;
  
  currentRecipe = recipe;
  
  let modal = document.getElementById('recipeModal');
  if (!modal) {
    modal = createRecipeModal();
    document.body.appendChild(modal);
  }
  
  const isApiRecipe = recipe.RecipeName || recipe.TranslatedIngredients;
  
  if (isApiRecipe) {
    displayApiRecipe(recipe, modal);
  } else {
    displayOfflineRecipe(recipe, modal);
  }
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

async function deleteSavedRecipe(index) {
  try {
    // Load current saved recipes
    const savedRecipes = await FirebaseDB.getSavedRecipes(AuthManager.getCurrentUserId());
    const recipe = savedRecipes[index];
    
    if (!recipe) {
      showMessage('Recipe not found!');
      return;
    }
    
    const name = recipe.name || recipe.RecipeName || 'Recipe';
    
    if (confirm(`Delete "${name}" from saved recipes?`)) {
      const success = await FirebaseDB.removeSavedRecipe(AuthManager.getCurrentUserId(), recipe.id);
      
      if (success) {
        showMessage(`"${name}" deleted! 🗑️`);
        showSavedRecipes();
      } else {
        showMessage('Failed to delete recipe.');
      }
    }
  } catch (error) {
    console.error('Error deleting recipe:', error);
    showMessage('Error deleting recipe.');
  }
}

// Today's menu
function loadTodaysMenu() {
  loadJSONRecipes().then(() => {
    if (recipes.length > 0) {
      const vegRecipes = recipes.filter(recipe => 
        !recipe.name.toLowerCase().includes('chicken') && 
        !recipe.name.toLowerCase().includes('mutton') && 
        !recipe.name.toLowerCase().includes('fish') &&
        !recipe.name.toLowerCase().includes('egg')
      );
      
      if (vegRecipes.length >= 3) {
        const today = new Date().toDateString();
        const seed = today.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        
        todaysMenu.breakfast = vegRecipes[seed % vegRecipes.length];
        todaysMenu.lunch = vegRecipes[(seed + 1) % vegRecipes.length];
        todaysMenu.dinner = vegRecipes[(seed + 2) % vegRecipes.length];
        
        updateMealCard('breakfast', todaysMenu.breakfast);
        updateMealCard('lunch', todaysMenu.lunch);
        updateMealCard('dinner', todaysMenu.dinner);
      }
    }
  });
}

function updateMealCard(mealType, recipe) {
  const titleEl = document.getElementById(`${mealType}Title`);
  const descEl = document.getElementById(`${mealType}Desc`);
  const timeEl = document.getElementById(`${mealType}Time`);
  
  if (titleEl && descEl && timeEl && recipe) {
    titleEl.textContent = recipe.name;
    descEl.textContent = Array.isArray(recipe.benefits) ? recipe.benefits[0] : (recipe.description || 'Delicious vegetarian recipe');
    timeEl.textContent = `⏱️ ${recipe.time || '30 mins'}`;
  }
}

function viewTodaysRecipe(mealType) {
  const recipe = todaysMenu[mealType];
  if (recipe) {
    const recipeIndex = recipes.findIndex(r => r.name === recipe.name);
    if (recipeIndex !== -1) {
      openRecipeModal(recipeIndex, 'offline');
    }
  }
}

function refreshTodaysMenu() {
  if (recipes.length > 0) {
    const vegRecipes = recipes.filter(recipe => 
      !recipe.name.toLowerCase().includes('chicken') && 
      !recipe.name.toLowerCase().includes('mutton') && 
      !recipe.name.toLowerCase().includes('fish') &&
      !recipe.name.toLowerCase().includes('egg')
    );
    
    todaysMenu.breakfast = vegRecipes[Math.floor(Math.random() * vegRecipes.length)];
    todaysMenu.lunch = vegRecipes[Math.floor(Math.random() * vegRecipes.length)];
    todaysMenu.dinner = vegRecipes[Math.floor(Math.random() * vegRecipes.length)];
    
    updateMealCard('breakfast', todaysMenu.breakfast);
    updateMealCard('lunch', todaysMenu.lunch);
    updateMealCard('dinner', todaysMenu.dinner);
    
    showMessage('Menu refreshed! 🍽️');
  }
}

// Recent comments
async function loadRecentComments() {
  const commentsContainer = document.getElementById('recentCommentsList');
  if (!commentsContainer) return;
  
  // Show loading animation
  showFirebaseLoading(commentsContainer, 'Loading recent comments...');
  
  try {
    // Wait for Firebase
    let attempts = 0;
    while (typeof FirebaseDB === 'undefined' && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (typeof FirebaseDB === 'undefined') {
      hideFirebaseLoading(commentsContainer);
      commentsContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
          <i class="fas fa-comments" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
          <p>No comments yet. Be the first to share your thoughts!</p>
        </div>
      `;
      return;
    }
    
    const allComments = [];
    
    // Load comments from all recipes
    await loadJSONRecipes();
    for (const recipe of recipes) {
      const recipeId = generateRecipeId(recipe);
      const comments = await FirebaseDB.getRecipeComments(recipeId);
      comments.forEach(comment => {
        allComments.push({
          ...comment,
          recipeName: recipe.name,
          recipeType: 'json',
          recipeEmoji: recipe.emoji || '🍛'
        });
      });
    }
    
    // Also get general reviews
    const generalReviews = await FirebaseDB.getRecipeComments('general_reviews');
    generalReviews.forEach(comment => {
      allComments.push({
        ...comment,
        recipeName: 'General Review',
        recipeType: 'general',
        recipeEmoji: '⭐'
      });
    });
    
    // Sort by newest first (most recent comments at top)
    allComments.sort((a, b) => {
      const timeA = a.createdAt ? a.createdAt.toDate().getTime() : Date.now();
      const timeB = b.createdAt ? b.createdAt.toDate().getTime() : Date.now();
      return timeB - timeA;
    });
    
    // Get the newest 16 comments
    const recentComments = allComments.slice(0, 16);
    
    // Hide loading animation
    hideFirebaseLoading(commentsContainer);
    
    if (recentComments.length === 0) {
      commentsContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
          <i class="fas fa-comments" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
          <p>No comments yet. Be the first to share your thoughts!</p>
        </div>
      `;
      return;
    }
    
    commentsContainer.innerHTML = recentComments.map((comment, index) => {
      const timeAgo = comment.createdAt ? formatTimeAgo(comment.createdAt.toDate()) : 'Just now';
      const isLongComment = comment.comment.length > 100;
      const truncatedComment = isLongComment ? comment.comment.substring(0, 100) + '...' : comment.comment;
      
      return `
        <div class="comment-card" onclick="openRecipeFromComment('${comment.recipeName}', '${comment.recipeType}')">
          <div class="comment-header">
            <div class="comment-user">
              <div class="comment-avatar">${comment.userName.charAt(0).toUpperCase()}</div>
              <div class="comment-user-info">
                <h4>${comment.userName}</h4>
                <a href="#" class="comment-recipe">${comment.recipeName}</a>
              </div>
            </div>
            <div class="comment-time">${timeAgo}</div>
          </div>
          <div class="comment-text ${isLongComment ? '' : 'expanded'}" id="comment-text-${index}">
            ${isLongComment ? truncatedComment : comment.comment}
          </div>
          ${isLongComment ? `<button class="comment-see-more" onclick="event.stopPropagation(); expandComment(${index}, '${comment.comment.replace(/'/g, "\\'")}')">See More</button>` : ''}
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error('Error loading recent comments:', error);
    hideFirebaseLoading(commentsContainer);
  }
}

async function openRecipeFromComment(recipeName, recipeType) {
  try {
    if (recipeType === 'json') {
      await loadJSONRecipes();
      const recipe = recipes.find(r => r.name === recipeName);
      if (recipe) {
        const recipeIndex = recipes.findIndex(r => r.name === recipeName);
        openRecipeModal(recipeIndex, 'offline');
      }
    }
  } catch (error) {
    console.error('Error opening recipe from comment:', error);
  }
}

// Firebase Loading Animation Functions
function showFirebaseLoading(container, message = 'Loading...') {
  if (!container) return;
  
  container.innerHTML = `
    <div class="firebase-loading">
      <div class="firebase-spinner"></div>
      <div class="firebase-dots">
        <div class="firebase-dot"></div>
        <div class="firebase-dot"></div>
        <div class="firebase-dot"></div>
      </div>
      <div class="firebase-loading-text">${message}</div>
    </div>
  `;
}

function hideFirebaseLoading(container) {
  if (!container) return;
  const loadingEl = container.querySelector('.firebase-loading');
  if (loadingEl) {
    loadingEl.style.opacity = '0';
    loadingEl.style.transform = 'scale(0.9)';
    setTimeout(() => {
      if (loadingEl.parentNode) {
        loadingEl.remove();
      }
    }, 300);
  }
}

// Utility functions
function showMessage(message, duration = 3000) {
  const existing = document.querySelector('.success-message');
  if (existing) existing.remove();
  
  const messageDiv = document.createElement('div');
  messageDiv.className = 'success-message';
  messageDiv.innerHTML = message;
  
  document.body.appendChild(messageDiv);
  
  setTimeout(() => {
    messageDiv.style.opacity = '0';
    messageDiv.style.transform = 'translateX(-50%) translateY(-30px)';
    setTimeout(() => messageDiv.remove(), 300);
  }, duration);
}

// Initialize auth (placeholder)
function initializeAuth() {
  // Auth initialization handled by firebase-auth.js
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeRecipeModal();
  }
});

// Expand comment function
function expandComment(index, fullComment) {
  const commentTextEl = document.getElementById(`comment-text-${index}`);
  const seeMoreBtn = commentTextEl.nextElementSibling;
  
  if (commentTextEl && seeMoreBtn) {
    commentTextEl.innerHTML = fullComment;
    commentTextEl.classList.add('expanded');
    seeMoreBtn.style.display = 'none';
  }
}

// Expand review function
function expandReview(index, fullComment) {
  const reviewTextEl = document.getElementById(`review-text-${index}`);
  const seeMoreBtn = reviewTextEl.nextElementSibling;
  
  if (reviewTextEl && seeMoreBtn) {
    reviewTextEl.innerHTML = fullComment;
    reviewTextEl.classList.add('expanded');
    seeMoreBtn.style.display = 'none';
  }
}

// Initialize homepage functionality
if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
      loadRecentComments();
    }, 2000);
  });
}
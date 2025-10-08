// Simple JavaScript for Original Features
let recipes = [];

// Load recipes from JSON
async function loadRecipes() {
  try {
    const response = await fetch('recipes_offline.json');
    const data = await response.json();
    recipes = data;
    console.log('Loaded', recipes.length, 'recipes');
  } catch (error) {
    console.error('Error loading recipes:', error);
  }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  loadRecipes();
  
  // Mobile menu toggle
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');
  
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');
    });
  }
  
  // Ingredient form
  const ingredientForm = document.getElementById('ingredientForm');
  if (ingredientForm) {
    ingredientForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const ingredients = document.getElementById('ingredients').value;
      if (ingredients.trim()) {
        localStorage.setItem('searchIngredients', ingredients);
        window.location.href = 'results.html';
      }
    });
  }
  
  // Smart search button
  const smartBtn = document.getElementById('smartBtn');
  if (smartBtn) {
    smartBtn.addEventListener('click', function() {
      const ingredients = document.getElementById('ingredients').value;
      if (ingredients.trim()) {
        localStorage.setItem('searchIngredients', ingredients);
        localStorage.setItem('searchMode', 'smart');
        window.location.href = 'results.html';
      } else {
        alert('Please enter ingredients first!');
      }
    });
  }
  
  // Load results if on results page
  if (window.location.pathname.includes('results.html')) {
    loadResults();
  }
});

// Add ingredient to input
function addIngredient(ingredient) {
  const input = document.getElementById('ingredients');
  if (input) {
    const current = input.value.trim();
    input.value = current ? current + ', ' + ingredient : ingredient;
  }
}

// Load and display results
function loadResults() {
  const ingredients = localStorage.getItem('searchIngredients') || '';
  const mode = localStorage.getItem('searchMode') || 'normal';
  const container = document.getElementById('recipesContainer');
  
  if (!container) return;
  
  if (recipes.length === 0) {
    setTimeout(loadResults, 500);
    return;
  }
  
  let filteredRecipes = recipes;
  
  if (ingredients) {
    const searchTerms = ingredients.toLowerCase().split(',').map(term => term.trim());
    filteredRecipes = recipes.filter(recipe => {
      const recipeIngredients = (recipe.ingredients || []).join(' ').toLowerCase();
      const recipeName = (recipe.name || '').toLowerCase();
      
      return searchTerms.some(term => 
        recipeIngredients.includes(term) || 
        recipeName.includes(term)
      );
    });
  }
  
  container.innerHTML = '';
  
  if (filteredRecipes.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">No recipes found. Try different ingredients!</div>';
    return;
  }
  
  filteredRecipes.forEach(recipe => {
    const card = createRecipeCard(recipe);
    container.appendChild(card);
  });
}

// Create recipe card
function createRecipeCard(recipe) {
  const card = document.createElement('div');
  card.className = 'recipe-card';
  
  card.innerHTML = `
    <div class="recipe-image">
      ${recipe.image ? `<img src="${recipe.image}" alt="${recipe.name}" onerror="this.style.display='none'">` : ''}
      <div class="recipe-emoji">🍛</div>
    </div>
    <div class="recipe-content">
      <h3 class="recipe-title">${recipe.name}</h3>
      <p class="recipe-description">${recipe.description || 'Delicious Indian recipe'}</p>
      <div class="recipe-meta">
        <span><i class="fas fa-clock"></i> ${recipe.time || '30 min'}</span>
        <span><i class="fas fa-heart"></i> ${recipe.likes || 0}</span>
      </div>
      <div class="recipe-actions">
        <button class="btn btn-primary" onclick="viewRecipe('${recipe.name}')">
          <i class="fas fa-eye"></i> View Recipe
        </button>
      </div>
    </div>
  `;
  
  return card;
}

// View recipe details
function viewRecipe(recipeName) {
  const recipe = recipes.find(r => r.name === recipeName);
  if (!recipe) return;
  
  const modal = document.createElement('div');
  modal.className = 'recipe-modal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.9); display: flex; align-items: center;
    justify-content: center; z-index: 2000; padding: 1rem;
  `;
  
  modal.innerHTML = `
    <div style="background: var(--bg-card); border-radius: 12px; max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto; position: relative;">
      <div style="padding: 2rem; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
        <h2 style="margin: 0; color: var(--text-primary);">${recipe.name}</h2>
        <button onclick="this.closest('.recipe-modal').remove()" style="background: none; border: none; color: var(--text-secondary); font-size: 1.5rem; cursor: pointer;">×</button>
      </div>
      <div style="padding: 2rem;">
        <div style="margin-bottom: 2rem;">
          <h3 style="color: var(--accent); margin-bottom: 1rem;">Ingredients</h3>
          <ul style="list-style: none; padding: 0;">
            ${(recipe.ingredients || []).map(ingredient => `<li style="padding: 0.5rem; margin-bottom: 0.5rem; background: var(--bg-secondary); border-radius: 4px;">• ${ingredient}</li>`).join('')}
          </ul>
        </div>
        <div>
          <h3 style="color: var(--accent); margin-bottom: 1rem;">Instructions</h3>
          <ol style="padding-left: 1rem;">
            ${(recipe.steps || []).map(step => `<li style="margin-bottom: 1rem; line-height: 1.6;">${step}</li>`).join('')}
          </ol>
        </div>
        ${recipe.youtube ? `<div style="margin-top: 2rem; text-align: center;"><a href="${recipe.youtube}" target="_blank" class="btn btn-primary"><i class="fab fa-youtube"></i> Watch Video</a></div>` : ''}
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}
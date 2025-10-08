// API functionality for online recipe search
function getApiUrl(ingredients) {
  // Using Spoonacular API as fallback
  const apiKey = 'demo'; // Replace with actual API key
  return `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(ingredients)}&number=12&apiKey=${apiKey}`;
}

// Enhanced fetch with retry mechanism
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// Parse search ingredients
function parseSearchIngredients(ingredients) {
  return ingredients.split(',').map(ingredient => ingredient.trim()).filter(Boolean);
}

// Filter recipes by ingredients
function filterRecipesByIngredients(recipes, ingredients) {
  const searchTerms = ingredients.toLowerCase().split(',').map(term => term.trim());
  
  return recipes.filter(recipe => {
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

// Debounce function for search optimization
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
// API Configuration - Auto-detects local vs hosted
const API_CONFIG = {
  BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:4000'  // Local development
    : 'https://ind-recipes-api.onrender.com'  // Production/hosted
};

function getApiUrl(query) {
  return `${API_CONFIG.BASE_URL}/?q=${encodeURIComponent(query)}`;
}

// Enhanced search logic - handles spaces, commas, special characters
function parseSearchIngredients(input) {
  if (!input || typeof input !== 'string') return [];
  
  // Remove special characters except letters, numbers, spaces, commas
  const cleaned = input.replace(/[^\w\s,.-]/g, '');
  
  // Split by comma, space, or multiple spaces and filter empty strings
  const ingredients = cleaned
    .split(/[,\s]+/)
    .map(ingredient => ingredient.trim().toLowerCase())
    .filter(ingredient => ingredient.length > 0);
  
  console.log('🔍 Parsed ingredients:', ingredients);
  return ingredients;
}

// Smart recipe matching for JSON recipes
function matchRecipeIngredients(recipe, searchIngredients) {
  if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) return false;
  
  const recipeIngredients = recipe.ingredients.map(ing => ing.toLowerCase());
  
  // Check if ANY search ingredient matches ANY recipe ingredient (OR logic)
  return searchIngredients.some(searchIng => 
    recipeIngredients.some(recipeIng => 
      recipeIng.includes(searchIng) || searchIng.includes(recipeIng)
    )
  );
}

// Smart recipe matching for recipe name and description
function matchRecipeContent(recipe, searchIngredients) {
  const searchableText = [
    recipe.name || '',
    recipe.description || '',
    ...(recipe.benefits || [])
  ].join(' ').toLowerCase();
  
  return searchIngredients.some(ingredient => 
    searchableText.includes(ingredient)
  );
}

// Enhanced filtering function
function filterRecipesByIngredients(recipes, ingredientsInput) {
  if (!ingredientsInput || !ingredientsInput.trim()) {
    return recipes; // Return all recipes if no search input
  }
  
  const searchIngredients = parseSearchIngredients(ingredientsInput);
  
  if (searchIngredients.length === 0) {
    return recipes; // Return all if no valid ingredients parsed
  }
  
  return recipes.filter(recipe => 
    matchRecipeIngredients(recipe, searchIngredients) || 
    matchRecipeContent(recipe, searchIngredients)
  );
}
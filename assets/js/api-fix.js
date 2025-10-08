// Enhanced API Configuration
const API_CONFIG = {
  BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:4000'
    : 'https://ind-recipes-api.onrender.com',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3
};

// Enhanced fetch with retry and timeout
async function fetchWithRetry(url, options = {}, retries = API_CONFIG.RETRY_ATTEMPTS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (retries > 0 && !controller.signal.aborted) {
      console.warn(`API request failed, retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    
    throw error;
  }
}

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



// Enhanced filtering function
function filterRecipesByIngredients(recipes, ingredientsInput) {
  if (!ingredientsInput?.trim()) return recipes;
  
  const searchIngredients = parseSearchIngredients(ingredientsInput);
  if (searchIngredients.length === 0) return recipes;
  
  return recipes.filter(recipe => {
    const recipeIngredients = recipe.ingredients?.map(ing => ing.toLowerCase()) || [];
    const searchableText = [
      recipe.name || '',
      recipe.description || '',
      ...(recipe.benefits || [])
    ].join(' ').toLowerCase();
    
    return searchIngredients.some(searchIng => 
      recipeIngredients.some(recipeIng => 
        recipeIng.includes(searchIng) || searchIng.includes(recipeIng)
      ) || searchableText.includes(searchIng)
    );
  });
}

// Debounce helper for performance
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
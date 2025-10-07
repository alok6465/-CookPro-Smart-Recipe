// Firebase Configuration (v8 compat syntax)
const firebaseConfig = {
  apiKey: "AIzaSyCF8uKk-dUixbREE9Xb9wVZ5f8mi9_FShg",
  authDomain: "cookpro-410d4.firebaseapp.com",
  projectId: "cookpro-410d4",
  storageBucket: "cookpro-410d4.firebasestorage.app",
  messagingSenderId: "33114575575",
  appId: "1:33114575575:web:edd25f2cb205c6f7925692",
  measurementId: "G-NYHD9V6XQ4"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Firebase Database Helper Functions
class FirebaseDB {
  // Save user data
  static async saveUser(userId, userData) {
    try {
      await db.collection('users').doc(userId).set(userData, { merge: true });
      return true;
    } catch (error) {
      console.error('Error saving user:', error);
      return false;
    }
  }

  // Get user data
  static async getUser(userId) {
    try {
      const doc = await db.collection('users').doc(userId).get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  // Save recipe to user's collection
  static async saveRecipe(userId, recipe) {
    try {
      const recipeId = recipe.id || Date.now().toString();
      await db.collection('users').doc(userId).collection('savedRecipes').doc(recipeId).set({
        ...recipe,
        savedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error saving recipe:', error);
      return false;
    }
  }

  // Get user's saved recipes
  static async getSavedRecipes(userId) {
    try {
      const snapshot = await db.collection('users').doc(userId).collection('savedRecipes').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting recipes:', error);
      return [];
    }
  }

  // Remove saved recipe
  static async removeSavedRecipe(userId, recipeId) {
    try {
      await db.collection('users').doc(userId).collection('savedRecipes').doc(recipeId).delete();
      return true;
    } catch (error) {
      console.error('Error removing recipe:', error);
      return false;
    }
  }

  // Save user review
  static async saveReview(userId, review) {
    try {
      await db.collection('reviews').add({
        ...review,
        userId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error saving review:', error);
      return false;
    }
  }

  // Get all reviews
  static async getReviews() {
    try {
      const snapshot = await db.collection('reviews').orderBy('createdAt', 'desc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting reviews:', error);
      return [];
    }
  }

  // Like/Unlike recipe
  static async toggleRecipeLike(userId, recipeId) {
    try {
      const userRef = db.collection('users').doc(userId);
      const recipeRef = db.collection('recipes').doc(recipeId);
      
      const userDoc = await userRef.get();
      const userData = userDoc.exists ? userDoc.data() : {};
      const likedRecipes = userData.likedRecipes || [];
      
      const isLiked = likedRecipes.includes(recipeId);
      
      if (isLiked) {
        // Unlike: Remove from user's liked list and decrease recipe likes
        await userRef.set({
          likedRecipes: firebase.firestore.FieldValue.arrayRemove(recipeId)
        }, { merge: true });
        
        await recipeRef.set({
          likes: firebase.firestore.FieldValue.increment(-1),
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        return { liked: false, action: 'unliked' };
      } else {
        // Like: Add to user's liked list and increase recipe likes
        await userRef.set({
          likedRecipes: firebase.firestore.FieldValue.arrayUnion(recipeId)
        }, { merge: true });
        
        await recipeRef.set({
          likes: firebase.firestore.FieldValue.increment(1),
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        return { liked: true, action: 'liked' };
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      return { error: true };
    }
  }

  // Get recipe likes count
  static async getRecipeLikes(recipeId) {
    try {
      const doc = await db.collection('recipes').doc(recipeId).get();
      return doc.exists ? (doc.data().likes || 0) : 0;
    } catch (error) {
      console.error('Error getting likes:', error);
      return 0;
    }
  }

  // Check if user liked recipe
  static async isRecipeLiked(userId, recipeId) {
    try {
      const doc = await db.collection('users').doc(userId).get();
      if (doc.exists) {
        const likedRecipes = doc.data().likedRecipes || [];
        return likedRecipes.includes(recipeId);
      }
      return false;
    } catch (error) {
      console.error('Error checking like status:', error);
      return false;
    }
  }

  // Track recipe view
  static async trackRecipeView(recipeId, userId = null) {
    try {
      const recipeRef = db.collection('recipes').doc(recipeId);
      
      // Increment view count
      await recipeRef.set({
        views: firebase.firestore.FieldValue.increment(1),
        lastViewed: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      // Track user view if logged in
      if (userId) {
        await db.collection('recipeViews').add({
          recipeId,
          userId,
          viewedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error tracking view:', error);
      return false;
    }
  }

  // Get recipe views count
  static async getRecipeViews(recipeId) {
    try {
      const doc = await db.collection('recipes').doc(recipeId).get();
      return doc.exists ? (doc.data().views || 0) : 0;
    } catch (error) {
      console.error('Error getting views:', error);
      return 0;
    }
  }

  // Add comment to recipe
  static async addRecipeComment(recipeId, userId, userName, comment) {
    try {
      await db.collection('recipeComments').add({
        recipeId,
        userId,
        userName,
        comment,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      return false;
    }
  }

  // Get recipe comments
  static async getRecipeComments(recipeId) {
    try {
      const snapshot = await db.collection('recipeComments')
        .where('recipeId', '==', recipeId)
        .get();
      const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by createdAt in JavaScript to avoid index requirement
      return comments.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
    } catch (error) {
      console.error('Error getting comments:', error);
      return [];
    }
  }

  // Delete comment (only by comment author)
  static async deleteComment(commentId, userId) {
    try {
      const commentRef = db.collection('recipeComments').doc(commentId);
      const doc = await commentRef.get();
      
      if (doc.exists && doc.data().userId === userId) {
        await commentRef.delete();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  }
}
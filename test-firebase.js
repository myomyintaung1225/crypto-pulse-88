// Simple test to check if Firebase imports work
try {
  const firebase = require('firebase/app');
  const firestore = require('firebase/firestore');
  console.log('Firebase imports successful');
} catch (error) {
  console.error('Firebase import error:', error.message);
}
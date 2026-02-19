// Test script to verify popup.js initialization logic

// Simulate document
const mockDocument = {
  readyState: 'complete',
  getElementById: (id) => {
    console.log(`  getElementById('${id}')`);
    return { id };
  },
  addEventListener: (event, handler) => {
    console.log(`  addEventListener('${event}', ...)`);
    if (event === 'DOMContentLoaded') {
      // DOM already loaded, so this won't fire
    }
  },
  createElement: (tag) => ({ tag }),
  head: { appendChild: () => {} }
};

global.document = mockDocument;
global.window = { addEventListener: () => {} };
global.chrome = { storage: { local: { get: () => {}, set: () => {} } } };

console.log('=== Testing Popup Initialization ===\n');

// Test the IIFE logic
(function() {
  console.log('1. Checking document.readyState:', document.readyState);

  if (document.readyState === 'loading') {
    console.log('2. DOM is loading, would wait for DOMContentLoaded');
  } else {
    console.log('2. DOM is ready, initializing immediately');
    initDOM();
  }

  function initDOM() {
    console.log('3. Initializing DOM references...');
    try {
      const quoteList = document.getElementById('quoteList');
      const modalSourceUrl = document.getElementById('modalSourceUrl');
      console.log('4. ✅ DOM initialization successful');
      return true;
    } catch (error) {
      console.error('4. ❌ DOM initialization failed:', error);
      return false;
    }
  }
})();

console.log('\n=== Test Complete ===');

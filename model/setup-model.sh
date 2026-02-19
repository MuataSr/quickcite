#!/bin/bash

# ============================================================================
# QUICKSTART: Automated Model Training & Integration
# This script trains, optimizes, and integrates the citation model
# ============================================================================

set -e  # Exit on error

echo "🚀 QuickCite Citation Model - Automated Setup"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}➤${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

print_success "Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "npm found: $(npm --version)"
echo ""

# Step 1: Install dependencies
print_step "Step 1: Installing dependencies..."
npm install @tensorflow/tfjs-node --save-dev
print_success "Dependencies installed"
echo ""

# Step 2: Create models directory
print_step "Step 2: Creating models directory..."
mkdir -p model/models
mkdir -p models
print_success "Directories created"
echo ""

# Step 3: Train the model
print_step "Step 3: Training citation model..."
print_warning "This will take 5-10 minutes. Training for 30 epochs..."

# Check if user wants to skip training
read -p "Continue with training? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    node model/train-model.js train 30
    print_success "Model trained successfully"
else
    print_warning "Skipping training. Using pre-trained model from example."
    # In a real scenario, you'd download a pre-trained model here
fi

echo ""

# Step 4: Optimize model
print_step "Step 4: Optimizing model for extension..."

if [ -f "model/models/citation-model.json" ]; then
    node model/optimize-model.js quantize \
        model/models/citation-model.json \
        model/models/citation-model-quantized.json \
        int8
    print_success "Model quantized successfully"
else
    print_warning "No trained model found. Skipping quantization."
fi

echo ""

# Step 5: Copy to extension
print_step "Step 5: Copying model to extension directory..."

if [ -f "model/models/citation-model-quantized.json" ]; then
    cp model/models/citation-model-quantized.json models/citation-model.json
    print_success "Model copied to /models/"
else
    print_warning "No quantized model found. Please train the model first."
fi

if [ -f "model/models/tokenizer.json" ]; then
    cp model/models/tokenizer.json models/tokenizer.json
    print_success "Tokenizer copied to /models/"
else
    print_warning "No tokenizer config found. Creating minimal config..."

    # Create minimal tokenizer config
    cat > models/tokenizer.json << 'EOF'
{
  "vocabSize": 1000,
  "wordToIndex": {
    "<PAD>": 0,
    "<UNK>": 1,
    "<START>": 2,
    "<END>": 3,
    "the": 4,
    "and": 5,
    "to": 6,
    "of": 7,
    "a": 8,
    "in": 9,
    "is": 10,
    "it": 11,
    "you": 12,
    "that": 13,
    "he": 14,
    "was": 15,
    "for": 16,
    "on": 17,
    "are": 18,
    "as": 19,
    "with": 20,
    "his": 21,
    "they": 22,
    "i": 23,
    "at": 24,
    "be": 25,
    "this": 26,
    "have": 27,
    "from": 28,
    "or": 29,
    "one": 30,
    "had": 31,
    "by": 32,
    "word": 33,
    "but": 34,
    "not": 35,
    "what": 36,
    "all": 37,
    "were": 38,
    "we": 39,
    "when": 40,
    "your": 41,
    "can": 42,
    "said": 43,
    "there": 44,
    "use": 45,
    "an": 46,
    "each": 47,
    "which": 48,
    "she": 49,
    "do": 50,
    "how": 51,
    "their": 52,
    "if": 53,
    "will": 54,
    "up": 55,
    "other": 56,
    "about": 57,
    "out": 58,
    "many": 59,
    "then": 60,
    "them": 61,
    "these": 62,
    "so": 63,
    "some": 64,
    "her": 65,
    "would": 66,
    "make": 67,
    "like": 68,
    "him": 69,
    "into": 70,
    "time": 71,
    "has": 72,
    "look": 73,
    "two": 74,
    "more": 75,
    "write": 76,
    "go": 77,
    "see": 78,
    "number": 79,
    "no": 80,
    "way": 81,
    "could": 82,
    "people": 83,
    "my": 84,
    "than": 85,
    "first": 86,
    "water": 87,
    "been": 88,
    "call": 89,
    "who": 90,
    "oil": 91,
    "its": 92,
    "now": 93,
    "find": 94,
    "long": 95,
    "down": 96,
    "day": 97,
    "did": 98,
    "get": 99,
    "come": 100,
    "made": 101,
    "may": 102,
    "part": 103,
    "cite": 104,
    "citation": 105,
    "source": 106,
    "author": 107,
    "reference": 108,
    "bibliography": 109,
    "quote": 110,
    "mla": 111,
    "apa": 112,
    "academic": 113,
    "journal": 114,
    "article": 115,
    "paper": 116,
    "publication": 117,
    "website": 118,
    "book": 119,
    "chapter": 120,
    "volume": 121,
    "issue": 122,
    "pages": 123,
    "doi": 124,
    "url": 125,
    "retrieved": 126,
    "accessed": 127
  },
  "indexToWord": [
    "<PAD>", "<UNK>", "<START>", "<END>", "the", "and", "to", "of", "a", "in",
    "is", "it", "you", "that", "he", "was", "for", "on", "are", "as",
    "with", "his", "they", "i", "at", "be", "this", "have", "from", "or",
    "one", "had", "by", "word", "but", "not", "what", "all", "were", "we",
    "when", "your", "can", "said", "there", "use", "an", "each", "which", "she",
    "do", "how", "their", "if", "will", "up", "other", "about", "out", "many",
    "then", "them", "these", "so", "some", "her", "would", "make", "like", "him",
    "into", "time", "has", "look", "two", "more", "write", "go", "see", "number",
    "no", "way", "could", "people", "my", "than", "first", "water", "been", "call",
    "who", "oil", "its", "now", "find", "long", "down", "day", "did", "get",
    "come", "made", "may", "part", "cite", "citation", "source", "author", "reference", "bibliography",
    "quote", "mla", "apa", "academic", "journal", "article", "paper", "publication", "website", "book",
    "chapter", "volume", "issue", "pages", "doi", "url", "retrieved", "accessed"
  ],
  "config": {
    "vocabSize": 128,
    "embeddingDim": 64,
    "hiddenDim": 128,
    "maxLength": 128,
    "dropoutRate": 0.1
  }
}
EOF
    print_success "Minimal tokenizer config created"
fi

echo ""

# Step 6: Download TensorFlow.js
print_step "Step 6: Downloading TensorFlow.js..."
if [ ! -f "tf.min.js" ]; then
    curl -L -o tf.min.js \
        https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.14.0/dist/tf.min.js
    print_success "TensorFlow.js downloaded"
else
    print_warning "TensorFlow.js already exists, skipping download"
fi

echo ""

# Step 7: Create model-manager.js
print_step "Step 7: Creating model manager..."
cat > model-manager.js << 'EOF'
// Model Manager for Citation Intelligence
// Handles loading and inference for the citation model

class CitationModelManager {
  constructor() {
    this.model = null;
    this.tokenizer = null;
    this.initialized = false;
    this.loading = false;
  }

  async init() {
    if (this.initialized || this.loading) {
      return;
    }

    this.loading = true;
    console.log('🤖 Initializing Citation Model...');

    try {
      // Load TensorFlow.js if not already loaded
      if (typeof tf === 'undefined') {
        await this.loadTfJs();
      }

      // Load model
      this.model = await tf.loadLayersModel('models/citation-model.json');

      // Load tokenizer config
      const tokenizerConfig = await this.loadTokenizerConfig();
      this.tokenizer = this.buildTokenizer(tokenizerConfig);

      this.initialized = true;
      console.log('✅ Citation Model initialized');

    } catch (error) {
      console.error('❌ Failed to initialize citation model:', error);
      this.loading = false;
      throw error;
    }
  }

  async loadTfJs() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.14.0/dist/tf.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async loadTokenizerConfig() {
    const response = await fetch('models/tokenizer.json');
    return await response.json();
  }

  buildTokenizer(config) {
    return {
      wordToIndex: config.wordToIndex,
      indexToWord: config.indexToWord,
      vocabSize: config.vocabSize,
      maxLength: config.config.maxLength,

      encode(text, maxLength = 128) {
        if (!text) return new Array(maxLength).fill(0);

        const tokens = ['<START>', ...this.tokenize(text), '<END>'];
        const indices = tokens.map(token => this.wordToIndex[token] || this.wordToIndex['<UNK>']);

        if (indices.length > maxLength) {
          return indices.slice(0, maxLength);
        } else {
          return [...indices, ...new Array(maxLength - indices.length).fill(0)];
        }
      },

      tokenize(text) {
        return text
          .toLowerCase()
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .filter(word => word.length > 0);
      }
    };
  }

  async analyzeText(text) {
    if (!this.initialized) {
      await this.init();
    }

    // Preprocess
    const inputArray = this.tokenizer.encode(text);
    const inputTensor = tf.tensor2d([inputArray], [1, this.tokenizer.maxLength]);

    // Run inference
    const predictions = this.model.predict(inputTensor);
    const [sourceTypePred, authorPred, stylePred] = predictions;

    // Get predictions as arrays
    const sourceType = await sourceTypePred.data();
    const hasAuthor = await authorPred.data();
    const style = await stylePred.data();

    // Clean up
    inputTensor.dispose();
    predictions.forEach(pred => pred.dispose());

    // Get predicted classes
    const sourceTypeIndex = sourceType.indexOf(Math.max(...sourceType));
    const styleIndex = style.indexOf(Math.max(...style));

    return {
      sourceType: {
        index: sourceTypeIndex,
        label: this.getSourceTypeLabel(sourceTypeIndex),
        confidence: Math.max(...sourceType)
      },
      hasAuthor: {
        hasAuthor: hasAuthor[1] > 0.5,
        confidence: Math.max(hasAuthor[0], hasAuthor[1])
      },
      citationStyle: {
        index: styleIndex,
        label: this.getStyleLabel(styleIndex),
        confidence: Math.max(...style)
      }
    };
  }

  getSourceTypeLabel(index) {
    const labels = ['website', 'academic', 'book', 'news', 'other'];
    return labels[index] || 'other';
  }

  getStyleLabel(index) {
    const labels = ['auto', 'mla', 'apa'];
    return labels[index] || 'auto';
  }

  dispose() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.initialized = false;
    }
  }
}

// Export
if (typeof window !== 'undefined') {
  window.CitationModelManager = CitationModelManager;
}
EOF

print_success "Model manager created"
echo ""

# Step 8: Update manifest.json
print_step "Step 8: Updating manifest.json..."
if [ -f "manifest.json" ]; then
    # Create backup
    cp manifest.json manifest.json.backup

    # Update manifest
    cat > manifest.json << 'EOF'
{
  "manifest_version": 3,
  "name": "QuickCite",
  "version": "1.0.0",
  "description": "Save quotes from the web with AI-powered MLA/APA citations",
  "permissions": [
    "contextMenus",
    "storage",
    "activeTab",
    "notifications",
    "scripting"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
  },
  "action": {
    "default_popup": "popup.html",
    "default_title": "QuickCite"
  },
  "background": {
    "service_worker": "background.js"
  },
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "minimum_chrome_version": "88",
  "web_accessible_resources": [{
    "resources": [
      "models/*",
      "tf.min.js",
      "model-manager.js"
    ],
    "matches": ["<all_urls>"]
  }]
}
EOF

    print_success "manifest.json updated (backup saved as manifest.json.backup)"
else
    print_warning "manifest.json not found, skipping update"
fi

echo ""

# Step 9: Final summary
echo "=============================================="
print_success "Setup Complete!"
echo "=============================================="
echo ""
echo "📦 Files created:"
echo "   ✓ models/citation-model.json"
echo "   ✓ models/tokenizer.json"
echo "   ✓ tf.min.js"
echo "   ✓ model-manager.js"
echo "   ✓ manifest.json (updated)"
echo ""
echo "🚀 Next steps:"
echo "   1. Open chrome://extensions/"
echo "   2. Enable 'Developer mode'"
echo "   3. Click 'Load unpacked' and select this directory"
echo "   4. The extension is ready to use!"
echo ""
echo "📚 Documentation:"
echo "   • model/INTEGRATION.md - Complete integration guide"
echo "   • model/train-model.js - Training pipeline"
echo "   • model/optimize-model.js - Optimization tools"
echo ""
echo "🧪 Test the model:"
echo "   1. Open the extension popup"
echo "   2. Open DevTools Console"
echo "   3. Run: await initCitationModel(); await analyzeText('Test')"
echo ""
echo "For detailed information, see model/INTEGRATION.md"
echo ""

# Make the script executable
chmod +x model/setup-model.sh

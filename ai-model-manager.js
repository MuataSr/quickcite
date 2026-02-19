// ============================================================================
// AI MODEL MANAGER FOR QUICKCITE
// Enhances citation generation with intelligent source detection
// ============================================================================

// Configuration
const AI_CONFIG = {
  modelPath: 'models/model.json',
  vocabSize: 5000,
  maxLength: 128,
  enabled: false,  // DISABLED: Chrome Manifest V3 CSP doesn't allow eval or external scripts
  debug: false
};

// ============================================================================
// SIMPLE TOKENIZER (Matches trained model vocabulary)
// ============================================================================

class CitationTokenizer {
  constructor() {
    // Minimal vocabulary from training
    this.wordToIndex = {
      '<PAD>': 0, '<UNK>': 1, '<START>': 2, '<END>': 3,
      // Common words
      'the': 4, 'and': 5, 'to': 6, 'of': 7, 'a': 8, 'in': 9,
      'is': 10, 'it': 11, 'you': 12, 'that': 13, 'he': 14,
      'was': 15, 'for': 16, 'on': 17, 'are': 18, 'as': 19,
      'with': 20, 'his': 21, 'they': 22, 'i': 23, 'at': 24,
      'be': 25, 'this': 26, 'have': 27, 'from': 28, 'or': 29,
      'one': 30, 'had': 31, 'by': 32, 'word': 33, 'but': 34,
      'not': 35, 'what': 36, 'all': 37, 'were': 38, 'we': 39,
      'when': 40, 'your': 41, 'can': 42, 'said': 43, 'there': 44,
      'use': 45, 'an': 46, 'each': 47, 'which': 48, 'she': 49,
      'do': 50, 'how': 51, 'their': 52, 'if': 53, 'will': 54,
      'up': 55, 'other': 56, 'about': 57, 'out': 58, 'many': 59,
      'then': 60, 'them': 61, 'these': 62, 'so': 63, 'some': 64,
      'her': 65, 'would': 66, 'make': 67, 'like': 68, 'him': 69,
      'into': 70, 'time': 71, 'has': 72, 'look': 73, 'two': 74,
      'more': 75, 'write': 76, 'go': 77, 'see': 78, 'number': 79,
      'no': 80, 'way': 81, 'could': 82, 'people': 83, 'my': 84,
      'than': 85, 'first': 86, 'water': 87, 'been': 88, 'call': 89,
      // Citation-specific
      'cite': 104, 'citation': 105, 'source': 106, 'author': 107,
      'reference': 108, 'bibliography': 109, 'quote': 110,
      'mla': 111, 'apa': 112, 'academic': 113, 'journal': 114,
      'article': 115, 'paper': 116, 'publication': 117,
      'website': 118, 'book': 119, 'chapter': 120, 'volume': 121,
      'issue': 122, 'pages': 123, 'doi': 124, 'url': 125,
      'retrieved': 126, 'accessed': 127,
      // Domain-specific
      'deep': 128, 'learning': 129, 'natural': 130, 'language': 131,
      'processing': 132, 'survey': 133, 'comprehensive': 134,
      'node': 135, 'javascript': 136, 'rest': 137, 'api': 138,
      'express': 139, 'how': 140, 'build': 141,
      'pragmatic': 142, 'programmer': 143, 'journeyman': 144,
      'master': 145, 'breaking': 146, 'climate': 147, 'report': 148,
      'shows': 149, 'alarming': 150, 'trends': 151
    };
  }

  encode(text) {
    if (!text) return new Array(AI_CONFIG.maxLength).fill(0);

    const tokens = ['<START>', ...text.toLowerCase().split(/\s+/), '<END>'];
    const indices = tokens.map(token => this.wordToIndex[token] || 1); // 1 = <UNK>

    if (indices.length > AI_CONFIG.maxLength) {
      return indices.slice(0, AI_CONFIG.maxLength);
    }
    return [...indices, ...new Array(AI_CONFIG.maxLength - indices.length).fill(0)];
  }
}

// ============================================================================
// AI MODEL MANAGER CLASS
// ============================================================================

class CitationAIModel {
  constructor() {
    this.model = null;
    this.tokenizer = new CitationTokenizer();
    this.initialized = false;
    this.loading = false;
  }

  // Initialize the model (lazy loading)
  async init() {
    if (this.initialized || this.loading) {
      return;
    }

    if (!AI_CONFIG.enabled) {
      console.log('[AI Model] Disabled in config');
      return;
    }

    this.loading = true;
    console.log('[AI Model] Initializing...');

    try {
      // Check if TensorFlow.js is loaded
      if (typeof tf === 'undefined') {
        console.log('[AI Model] Loading TensorFlow.js and WASM backend...');
        await this.loadTfJs();
      }

      // Configure WASM backend
      console.log('[AI Model] Setting up WASM backend...');
      await tf.setBackend('wasm');
      await tf.ready();
      console.log('[AI Model] Using backend:', tf.getBackend());

      // Load the trained model
      console.log('[AI Model] Loading model from', AI_CONFIG.modelPath);
      this.model = await tf.loadLayersModel(AI_CONFIG.modelPath);

      this.initialized = true;
      this.loading = false;
      console.log('[AI Model] ✅ Initialized successfully');

    } catch (error) {
      console.error('[AI Model] ❌ Failed to initialize:', error);
      this.loading = false;
      // Don't throw - extension works without AI
    }
  }

  // Load TensorFlow.js and WASM backend from CDN
  loadTfJs() {
    return new Promise((resolve, reject) => {
      if (typeof tf !== 'undefined') {
        console.log('[AI Model] TensorFlow.js already loaded');
        resolve();
        return;
      }

      console.log('[AI Model] Loading TensorFlow.js from CDN...');
      // Load TensorFlow.js from CDN (Manifest V3 compatible)
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
      script.onload = async () => {
        console.log('[AI Model] ✅ TensorFlow.js loaded from CDN');
        try {
          // Load WASM backend from CDN
          console.log('[AI Model] Loading WASM backend from CDN...');
          const wasmScript = document.createElement('script');
          wasmScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@4.22.0/dist/tf-backend-wasm.min.js';
          wasmScript.onload = () => {
            console.log('[AI Model] ✅ WASM backend loaded from CDN');
            resolve();
          };
          wasmScript.onerror = (error) => {
            console.error('[AI Model] ❌ Failed to load WASM backend:', error);
            // Try to continue without WASM
            resolve();
          };
          document.head.appendChild(wasmScript);
        } catch (error) {
          console.error('[AI Model] ❌ Error loading WASM backend:', error);
          resolve(); // Continue without WASM
        }
      };
      script.onerror = (error) => {
        console.error('[AI Model] ❌ Failed to load TensorFlow.js from CDN:', error);
        reject(error);
      };
      document.head.appendChild(script);
    });
  }

  // Main inference function - handles all 8 model outputs
  async analyzeText(text) {
    if (!this.initialized || !this.model) {
      return null; // Not ready yet, but don't break anything
    }

    try {
      // Preprocess
      const inputArray = this.tokenizer.encode(text);
      const inputTensor = tf.tensor2d([inputArray], [1, AI_CONFIG.maxLength]);

      // Run inference - model has 8 outputs
      const predictions = this.model.predict(inputTensor);

      // Handle both old (3 outputs) and new (8 outputs) model versions
      const numOutputs = Array.isArray(predictions) ? predictions.length : 1;

      let sourceType, hasAuthor, style;
      let isCorporateAuthor, numAuthors, isPeerReviewed, hasDate, isSocialMedia;

      if (numOutputs >= 8) {
        // New model with Tier 1 outputs
        [sourceType, hasAuthor, style, isCorporateAuthor, numAuthors, isPeerReviewed, hasDate, isSocialMedia] =
          await Promise.all(predictions.map(p => p.data()));
      } else if (numOutputs >= 3) {
        // Original model
        [sourceType, hasAuthor, style] = await Promise.all(predictions.slice(0, 3).map(p => p.data()));
      } else {
        // Single output fallback
        sourceType = await predictions.data();
        hasAuthor = [0.5, 0.5];
        style = [0.33, 0.33, 0.34];
      }

      // Clean up
      inputTensor.dispose();
      if (Array.isArray(predictions)) {
        predictions.forEach(pred => pred.dispose());
      } else {
        predictions.dispose();
      }

      // Get predicted classes for original outputs
      const sourceTypeIndex = Array.from(sourceType).indexOf(Math.max(...sourceType));
      const styleIndex = Array.from(style).indexOf(Math.max(...style));

      const result = {
        // Original outputs
        sourceType: {
          index: sourceTypeIndex,
          label: this.getSourceTypeLabel(sourceTypeIndex),
          confidence: Math.max(...sourceType)
        },
        hasAuthor: {
          hasAuthor: hasAuthor[1] > hasAuthor[0],
          confidence: Math.max(hasAuthor[0], hasAuthor[1])
        },
        citationStyle: {
          index: styleIndex,
          label: this.getStyleLabel(styleIndex),
          confidence: Math.max(...style)
        }
      };

      // Add Tier 1 outputs if available
      if (isCorporateAuthor) {
        result.isCorporateAuthor = {
          isCorporate: isCorporateAuthor[1] > isCorporateAuthor[0],
          confidence: Math.max(...isCorporateAuthor)
        };
      }

      if (numAuthors) {
        const numAuthorsIndex = Array.from(numAuthors).indexOf(Math.max(...numAuthors));
        result.numAuthors = {
          index: numAuthorsIndex,
          label: this.getNumAuthorsLabel(numAuthorsIndex),
          confidence: Math.max(...numAuthors)
        };
      }

      if (isPeerReviewed) {
        result.isPeerReviewed = {
          isPeerReviewed: isPeerReviewed[1] > isPeerReviewed[0],
          confidence: Math.max(...isPeerReviewed)
        };
      }

      if (hasDate) {
        result.hasDate = {
          hasDate: hasDate[1] > hasDate[0],
          confidence: Math.max(...hasDate)
        };
      }

      if (isSocialMedia) {
        result.isSocialMedia = {
          isSocialMedia: isSocialMedia[1] > isSocialMedia[0],
          confidence: Math.max(...isSocialMedia)
        };
      }

      if (AI_CONFIG.debug) {
        console.log('[AI Model] Analysis result:', result);
      }

      return result;

    } catch (error) {
      console.error('[AI Model] Inference failed:', error);
      return null; // Graceful failure
    }
  }

  getSourceTypeLabel(index) {
    const labels = ['website', 'academic', 'book', 'news', 'arxiv'];
    return labels[index] || 'website';
  }

  getStyleLabel(index) {
    const labels = ['mla', 'apa', 'chicago'];
    return labels[index] || 'mla';
  }

  getNumAuthorsLabel(index) {
    const labels = ['single', 'two_to_three', 'four_plus'];
    return labels[index] || 'single';
  }

  // Dispose model to free memory
  dispose() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.initialized = false;
      console.log('[AI Model] Disposed');
    }
  }
}

// ============================================================================
// ENHANCED CITATION GENERATION
// Uses AI predictions to improve citations
// ============================================================================

class EnhancedCitationGenerator {
  constructor(aiModel) {
    this.aiModel = aiModel;
  }

  // Generate enhanced citation based on AI analysis
  async generateCitation(quote, format = 'auto') {
    let analysis = null;

    // Try AI analysis (non-blocking)
    try {
      const textToAnalyze = `${quote.sourceTitle} ${quote.text}`.substring(0, 200);
      analysis = await this.aiModel.analyzeText(textToAnalyze);
    } catch (error) {
      console.warn('[AI Model] Analysis failed:', error);
    }

    // Use AI recommendation if available
    let finalFormat = format;
    if (format === 'auto' && analysis?.citationStyle) {
      finalFormat = analysis.citationStyle.label;
      console.log(`[AI Model] Recommended format: ${finalFormat} (confidence: ${(analysis.citationStyle.confidence * 100).toFixed(1)}%)`);
    }

    // Generate citation using existing logic
    if (finalFormat === 'mla') {
      return this.generateMLACitation(quote, analysis);
    } else if (finalFormat === 'apa') {
      return this.generateAPACitation(quote, analysis);
    } else {
      // Auto - try both and let AI decide
      return this.generateAutoCitation(quote, analysis);
    }
  }

  generateMLACitation(quote, analysis) {
    let citation = '';

    // Author
    if (quote.author) {
      citation += `${quote.author}. `;
    } else if (analysis?.hasAuthor.hasAuthor) {
      citation += 'Unknown Author. ';
    }

    // Title (use quotes for articles/chapters)
    const isShortWork = analysis?.sourceType.label === 'article' ||
                        analysis?.sourceType.label === 'website';
    if (isShortWork) {
      citation += `"${quote.sourceTitle}." `;
    } else {
      citation += `${quote.sourceTitle}. `;
    }

    // Container/Publisher
    const websiteName = this.parseWebsiteName(quote.sourceTitle);
    if (websiteName) {
      citation += `${websiteName}, `;
    }

    // Date
    if (quote.accessDate) {
      citation += `${quote.accessDate}, `;
    }

    // URL
    const cleanUrl = quote.sourceUrl.replace(/^https?:\/\//, '');
    citation += `${cleanUrl}.`;

    return citation;
  }

  generateAPACitation(quote, analysis) {
    let citation = '';

    // Author
    if (quote.author) {
      citation += `${quote.author}. `;
    } else if (analysis?.hasAuthor.hasAuthor) {
      citation += 'Unknown Author. ';
    }

    // Date in parentheses
    const year = new Date().getFullYear();
    citation += `(${year}). `;

    // Title
    citation += `${quote.sourceTitle}. `;

    // Source
    const websiteName = this.parseWebsiteName(quote.sourceTitle);
    if (websiteName) {
      citation += `${websiteName}. `;
    }

    // URL
    citation += `${quote.sourceUrl}`;

    return citation;
  }

  generateAutoCitation(quote, analysis) {
    // Use AI to decide if not specified
    if (analysis?.citationStyle) {
      if (analysis.citationStyle.label === 'mla') {
        return this.generateMLACitation(quote, analysis);
      } else if (analysis.citationStyle.label === 'apa') {
        return this.generateAPACitation(quote, analysis);
      }
    }

    // Default to MLA
    return this.generateMLACitation(quote, analysis);
  }

  parseWebsiteName(title) {
    // Simple extraction - in production, use more sophisticated logic
    const match = title.match(/[-–—]\s*(.+)$/);
    if (match) return match[1].trim();
    return null;
  }
}

// ============================================================================
// GLOBAL INSTANCE
// ============================================================================

const citationAI = new CitationAIModel();
const enhancedCitationGen = new EnhancedCitationGenerator(citationAI);

// Auto-initialize when popup opens (lazy loading)
if (typeof window !== 'undefined') {
  // Initialize when popup opens (window.onload fires after DOMContentLoaded)
  window.addEventListener('load', () => {
    citationAI.init();
  });
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.CitationAI = {
    model: citationAI,
    generator: enhancedCitationGen,
    config: AI_CONFIG
  };
}

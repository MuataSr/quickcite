# Citation Model - Complete Implementation

A tiny language model (2-5MB) that enhances QuickCite with intelligent citation generation.

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Make the setup script executable
chmod +x model/setup-model.sh

# Run the automated setup
./model/setup-model.sh
```

This script will:
- ✅ Install dependencies
- ✅ Train the model (30 epochs)
- ✅ Quantize for extension (~73% size reduction)
- ✅ Copy files to extension directory
- ✅ Update manifest.json
- ✅ Create model-manager.js

### Option 2: Manual Setup

```bash
# 1. Install dependencies
npm install @tensorflow/tfjs-node

# 2. Train the model
node model/train-model.js train 50

# 3. Quantize for extension
node model/optimize-model.js quantize \
  model/models/citation-model.json \
  model/models/citation-model-quantized.json \
  int8

# 4. Copy to extension
mkdir -p models
cp model/models/citation-model-quantized.json models/citation-model.json
cp model/models/tokenizer.json models/tokenizer.json
```

## 📁 Project Structure

```
model/
├── README.md                      # This file
├── INTEGRATION.md                 # Detailed integration guide
├── setup-model.sh                 # Automated setup script
├── citation-model.js              # Model architecture & inference
├── train-model.js                 # Training pipeline
├── optimize-model.js              # Quantization & optimization
├── models/                        # Trained models (generated)
│   ├── citation-model.json
│   ├── tokenizer.json
│   └── training-history.json
└── examples/
    └── demo.html                  # Interactive demo
```

## 🎯 What It Does

The model performs **multi-task classification** on text:

1. **Source Type Detection** (5 classes)
   - Website
   - Academic paper
   - Book
   - News article
   - Other

2. **Author Presence** (binary)
   - Has author: Yes/No
   - Confidence score

3. **Citation Style Recommendation** (3 classes)
   - Auto-detect
   - MLA format
   - APA format

## 📊 Model Specs

| Metric | Value |
|--------|-------|
| Parameters | ~500K (tiny!) |
| Size (original) | 4-5 MB |
| Size (quantized) | 1-2 MB |
| Inference time | 5-15ms |
| Vocabulary | 5K words |
| Max length | 128 tokens |
| Architecture | Embedding + Dense (multi-task) |

## 🧪 Training

### Train with custom epochs:

```bash
# Quick training (30 epochs, ~5 minutes)
node model/train-model.js train 30

# Full training (100 epochs, ~15 minutes)
node model/train-model.js train 100
```

### Training Progress

```
📚 Epoch 1/50
██████████████████████████████████████████████████
✅ Train Loss: [Source Type: 0.8542, Has Author: 0.6234, Style: 1.1234]
✅ Train Acc:  [Source Type: 0.7234, Has Author: 0.8567, Style: 0.6789]
🔍 Val Loss:   [Source Type: 0.9123, Has Author: 0.6789, Style: 1.2345]
🔍 Val Acc:    [Source Type: 0.7012, Has Author: 0.8234, Style: 0.6456]
```

### Expected Results

After 50 epochs:
- Source Type Accuracy: ~75-85%
- Author Detection: ~80-90%
- Citation Style: ~70-80%

## 🔧 Optimization

### Quantization (Reduce size by 75%)

```bash
# Int8 quantization (recommended)
node model/optimize-model.js quantize \
  model/models/citation-model.json \
  model/models/citation-model-quantized.json \
  int8

# Float16 quantization
node model/optimize-model.js quantize \
  model/models/citation-model.json \
  model/models/citation-model-float16.json \
  float16
```

### Pruning (Remove less important weights)

```bash
# Remove 50% of weights
node model/optimize-model.js prune \
  model/models/citation-model.json \
  model/models/citation-model-pruned.json \
  0.5
```

### Knowledge Distillation (Create smaller model)

```bash
# Create a student model (2-3x smaller)
node model/optimize-model.js distill \
  model/models/teacher-model.json \
  model/models/student-model.json
```

### Benchmarking

```bash
# Test inference speed
node model/optimize-model.js benchmark \
  model/models/citation-model-quantized.json
```

Expected output:
```
⚡ Benchmarking model:
📊 Benchmark Results:
   Average inference time: 8.34ms
   Throughput: 119.91 inferences/sec
```

## 🔌 Integration

### Load in Popup

```javascript
// Initialize model
const modelManager = new CitationModelManager();
await modelManager.init();

// Analyze text
const result = await modelManager.analyzeText(
  "Machine Learning for Natural Language Processing: A Survey"
);

console.log(result);
// {
//   sourceType: { label: 'academic', confidence: 0.92 },
//   hasAuthor: { hasAuthor: true, confidence: 0.88 },
//   citationStyle: { label: 'mla', confidence: 0.76 }
// }
```

### Use in Background Script

```javascript
// In background.js, enhanced author extraction
async function enhanceWithML(tabId, url, title) {
  try {
    // Use model for ambiguous cases
    const needsML = url.includes('medium.com') ||
                    url.includes('dev.to');

    if (needsML) {
      const modelManager = new CitationModelManager();
      await modelManager.init();

      const analysis = await modelManager.analyzeText(`${title} ${url}`);

      // Adjust extraction based on prediction
      if (analysis.sourceType.label === 'academic') {
        return await extractAcademicAuthor(tabId, url);
      } else {
        return await extractWebAuthor(tabId, url);
      }
    }
  } catch (error) {
    console.warn('ML enhancement failed:', error);
  }

  // Fallback to regex
  return await extractAuthor(tabId, url, title);
}
```

### Add to HTML

```html
<!-- In popup.html -->
<script src="model-manager.js"></script>
<script>
  // Initialize when popup opens
  document.addEventListener('DOMContentLoaded', async () => {
    const modelManager = new CitationModelManager();
    await modelManager.init();
    console.log('Model ready!');
  });
</script>
```

## 🎨 Enhanced Citations

The model enhances citations by:

1. **Auto-detecting source type** → Formats accordingly
2. **Identifying author presence** → Adds "Unknown Author" if missing
3. **Recommending citation style** → Highlights preferred format
4. **Quality scoring** → Confidence-based recommendations

### Example Output

```
Input: "Deep Learning for Computer Vision"

Model Prediction:
- Source Type: academic (92% confidence)
- Has Author: Yes (88% confidence)
- Recommended Style: APA (76% confidence)

Enhanced Citation:
Krizhevsky, A., Sutskever, I., & Hinton, G. E. (2012).
ImageNet classification with deep convolutional neural networks.
Advances in Neural Information Processing Systems, 25.
```

## 🧪 Testing

### Test Trained Model

```bash
# Test with default model
node model/train-model.js test

# Test with custom model
node model/train-model.js test ./models/my-model.json
```

### Interactive Demo

Open `examples/demo.html` in a browser to test the model interactively.

### Console Testing

```javascript
// In popup DevTools
const modelManager = new CitationModelManager();
await modelManager.init();

const result = await modelManager.analyzeText(
  'How to Build a REST API with Node.js'
);

console.log('Prediction:', result);
// {
//   sourceType: { label: 'website', confidence: 0.84 },
//   hasAuthor: { hasAuthor: true, confidence: 0.91 },
//   citationStyle: { label: 'mla', confidence: 0.68 }
// }
```

## 📈 Performance Tips

### 1. Lazy Loading
- Model loads only when needed
- Cached for session
- Auto-dispose after inactivity

### 2. Batch Inference
```javascript
// Process multiple texts at once
const texts = ['Text 1', 'Text 2', 'Text 3'];
const results = await Promise.all(
  texts.map(text => modelManager.analyzeText(text))
);
```

### 3. Memory Management
```javascript
// Dispose when done
modelManager.dispose();

// Or auto-dispose after 5 minutes
setInterval(() => {
  if (modelManager && !document.hasFocus()) {
    modelManager.dispose();
  }
}, 5 * 60 * 1000);
```

## 🔍 Troubleshooting

### Model won't load
```javascript
// Check if file exists
const modelExists = await fetch('models/citation-model.json');
if (!modelExists.ok) {
  console.error('Model file not found!');
}
```

### TensorFlow.js errors
```javascript
// Ensure proper CSP in manifest.json
"content_security_policy": {
  "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
}
```

### Slow inference
- Use quantized model (int8)
- Reduce maxLength to 64
- Check Chrome Task Manager for CPU usage

### Out of memory
- Dispose tensors: `tensor.dispose()`
- Call `modelManager.dispose()` periodically
- Use Chrome DevTools Memory profiler

## 📚 Examples

### Example 1: Academic Paper Detection

```javascript
const text = "Deep Learning for Natural Language Processing: A Comprehensive Survey";

const result = await modelManager.analyzeText(text);
// {
//   sourceType: { label: 'academic', confidence: 0.94 },
//   hasAuthor: { hasAuthor: true, confidence: 0.89 },
//   citationStyle: { label: 'apa', confidence: 0.72 }
// }
```

### Example 2: Website Detection

```javascript
const text = "10 Best Practices for Modern JavaScript Development";

const result = await modelManager.analyzeText(text);
// {
//   sourceType: { label: 'website', confidence: 0.87 },
//   hasAuthor: { hasAuthor: true, confidence: 0.92 },
//   citationStyle: { label: 'mla', confidence: 0.68 }
// }
```

### Example 3: News Article

```javascript
const text = "Breaking: New Climate Report Shows Alarming Trends";

const result = await modelManager.analyzeText(text);
// {
//   sourceType: { label: 'news', confidence: 0.91 },
//   hasAuthor: { hasAuthor: true, confidence: 0.85 },
//   citationStyle: { label: 'apa', confidence: 0.74 }
// }
```

## 🎓 How It Works

### Architecture

```
Input Text
    ↓
Tokenization (5K vocab)
    ↓
Embedding (64-dim)
    ↓
Global Average Pooling
    ↓
Dense Layer (128 units, ReLU)
    ↓
    ├─→ Source Type Classifier (5 classes)
    ├─→ Author Detector (binary)
    └─→ Style Recommender (3 classes)
```

### Training Data

Generated from:
- 500+ sample titles per source type
- Synthetic variations with contexts
- Noisy/ambiguous samples for robustness

### Distillation Process

1. Train large "teacher" model
2. Generate soft targets
3. Train smaller "student" model
4. Match teacher predictions
5. Result: 2-3x smaller with 95%+ accuracy

## 🔬 Advanced Usage

### Custom Training Data

Edit `train-model.js`:

```javascript
// Add your own training data
this.trainingData = {
  website: [
    "Your website titles here...",
    // ...
  ],
  academic: [
    "Your academic titles here...",
    // ...
  ]
};
```

### Fine-tuning

```javascript
// Load pre-trained model
const model = await tf.loadLayersModel('models/citation-model.json');

// Freeze early layers
model.layers.slice(0, 3).forEach(layer => {
  layer.trainable = false;
});

// Add new classification head
model.add(tf.layers.dense({ units: 10, activation: 'softmax' }));

// Retrain
await model.fit(xs, ys, { epochs: 10 });
```

### Multi-lingual Support

```javascript
// Expand vocabulary
const tokenizer = new CitationTokenizer(10000); // 10K words

// Add non-English tokens
tokenizer.buildVocab(englishTexts.concat(spanishTexts, frenchTexts));
```

## 📖 References

- [TensorFlow.js Guide](https://www.tensorflow.org/js)
- [Model Quantization](https://www.tensorflow.org/model_optimization)
- [Knowledge Distillation](https://arxiv.org/abs/1503.02531)
- [Chrome Extension Architecture](https://developer.chrome.com/docs/extensions/mv3/)

## 🤝 Contributing

### Add New Tasks

1. Edit `citation-model.js`
2. Add new output head
3. Update training data generator
4. Retrain model
5. Test with new examples

### Improve Accuracy

1. Collect real citation data
2. Expand training set
3. Add data augmentation
4. Experiment with architecture
5. Use ensemble methods

### Report Issues

Open an issue with:
- Model prediction errors
- Performance problems
- Integration issues
- Feature requests

## 📜 License

MIT License - feel free to use, modify, and distribute.

## 🙏 Acknowledgments

- TensorFlow.js team for browser ML
- Chrome Extension team for MV3
- QuickCite contributors

---

**Happy citationing! 🎉**

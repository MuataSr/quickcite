// ============================================================================
// CITATION-SPECIFIC MINI-MODEL
// TensorFlow.js implementation for intelligent citation generation
// ============================================================================

// Import TensorFlow.js
const tf = require('@tensorflow/tfjs-node');

const MODEL_CONFIG = {
  vocabSize: 5000,           // Top 5K words for citation tasks
  embeddingDim: 64,          // Small embeddings
  hiddenDim: 128,            // Hidden layer size
  numClasses: {              // Multi-task classification
    sourceType: 5,           // website, academic, book, news, other
    hasAuthor: 2,            // binary
    citationStyle: 3,        // MLA, APA, auto-detect
  },
  maxLength: 128,            // Max sequence length
  dropoutRate: 0.1,
};

// ============================================================================
// TOKENIZATION: Simple word-level tokenization
// ============================================================================

class CitationTokenizer {
  constructor(vocabSize = 5000) {
    this.vocabSize = vocabSize;
    this.wordToIndex = { '<PAD>': 0, '<UNK>': 1, '<START>': 2, '<END>': 3 };
    this.indexToWord = ['<PAD>', '<UNK>', '<START>', '<END>'];
    this.vocabBuilt = false;
  }

  // Build vocabulary from training data
  buildVocab(texts, minFreq = 2) {
    const wordFreq = {};

    // Count word frequencies
    texts.forEach(text => {
      const words = this.tokenize(text);
      words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      });
    });

    // Add words to vocab (sorted by frequency)
    const sortedWords = Object.entries(wordFreq)
      .filter(([_, freq]) => freq >= minFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.vocabSize - 4)
      .map(([word]) => word);

    sortedWords.forEach(word => {
      if (!this.wordToIndex[word]) {
        const index = this.indexToWord.length;
        this.wordToIndex[word] = index;
        this.indexToWord.push(word);
      }
    });

    this.vocabBuilt = true;
    console.log(`Vocab built: ${this.vocabSize} words`);
  }

  // Tokenize text into words
  tokenize(text) {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  // Convert text to indices
  encode(text, maxLength = 128) {
    if (!this.vocabBuilt) {
      throw new Error('Vocab not built. Call buildVocab() first.');
    }

    const tokens = ['<START>', ...this.tokenize(text), '<END>'];
    const indices = tokens.map(token => this.wordToIndex[token] || this.wordToIndex['<UNK>']);

    // Pad or truncate
    if (indices.length > maxLength) {
      return indices.slice(0, maxLength);
    } else {
      return [...indices, ...new Array(maxLength - indices.length).fill(0)];
    }
  }

  // Convert indices back to text
  decode(indices) {
    return indices
      .map(index => this.indexToWord[index] || '<UNK>')
      .filter(token => token !== '<PAD>' && token !== '<START>' && token !== '<END>')
      .join(' ');
  }
}

// ============================================================================
// MODEL ARCHITECTURE: Multi-task classification model
// ============================================================================

function createCitationModel(config = MODEL_CONFIG) {
  // Input layer
  const input = tf.input({ shape: [config.maxLength] });

  // Embedding layer
  let x = tf.layers.embedding({
    inputDim: config.vocabSize,
    outputDim: config.embeddingDim,
    inputLength: config.maxLength,
    name: 'embedding'
  }).apply(input);

  // Global average pooling
  x = tf.layers.globalAveragePooling1d({ name: 'pooling' }).apply(x);

  // Shared dense layer
  x = tf.layers.dense({
    units: config.hiddenDim,
    activation: 'relu',
    name: 'shared_dense'
  }).apply(x);

  x = tf.layers.dropout({ rate: config.dropoutRate }).apply(x);

  // Output heads for different tasks
  // 1. Source type classification
  const sourceTypeOutput = tf.layers.dense({
    units: config.numClasses.sourceType,
    activation: 'softmax',
    name: 'source_type_output'
  }).apply(x);

  // 2. Has author detection
  const authorBranch = tf.layers.dense({
    units: config.hiddenDim,
    activation: 'relu',
    name: 'author_branch'
  }).apply(x);

  const authorOutput = tf.layers.dense({
    units: config.numClasses.hasAuthor,
    activation: 'sigmoid',
    name: 'has_author_output'
  }).apply(authorBranch);

  // 3. Citation style recommendation
  const styleBranch = tf.layers.dense({
    units: config.hiddenDim,
    activation: 'relu',
    name: 'style_branch'
  }).apply(x);

  const styleOutput = tf.layers.dense({
    units: config.numClasses.citationStyle,
    activation: 'softmax',
    name: 'citation_style_output'
  }).apply(styleBranch);

  // Create model with multiple outputs
  const model = tf.model({
    inputs: input,
    outputs: [sourceTypeOutput, authorOutput, styleOutput],
    name: 'citation_model'
  });

  // Compile model
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: {
      source_type_output: 'sparseCategoricalCrossentropy',
      has_author_output: 'categoricalCrossentropy',
      citation_style_output: 'sparseCategoricalCrossentropy',
    },
    lossWeights: {
      source_type_output: 1.0,
      has_author_output: 0.5,
      citation_style_output: 0.8,
    },
    metrics: {
      source_type_output: 'accuracy',
      has_author_output: 'accuracy',
      citation_style_output: 'accuracy',
    },
  });

  return model;
}

// ============================================================================
// MODEL INFERENCE: Load and use the trained model
// ============================================================================

class CitationInference {
  constructor(modelPath = '/models/citation-model.json') {
    this.model = null;
    this.tokenizer = new CitationTokenizer();
    this.modelPath = modelPath;
  }

  // Load model from extension directory
  async loadModel() {
    try {
      console.log('Loading citation model...');
      this.model = await tf.loadLayersModel(this.modelPath);
      console.log('Model loaded successfully');

      // Load tokenizer config (you'd save this alongside the model)
      // For now, we'll use a default vocab - in production, load from file
      await this.loadTokenizerConfig();

      return true;
    } catch (error) {
      console.error('Failed to load model:', error);
      return false;
    }
  }

  // Load tokenizer vocabulary
  async loadTokenizerConfig() {
    // In production, load from /models/tokenizer.json
    // For now, using minimal default vocabulary
    const defaultVocab = [
      '<PAD>', '<UNK>', '<START>', '<END>', 'the', 'of', 'and', 'a', 'to', 'in',
      'is', 'it', 'you', 'that', 'he', 'was', 'for', 'on', 'are', 'with',
      'as', 'i', 'his', 'they', 'be', 'at', 'one', 'have', 'this', 'from',
      'or', 'had', 'by', 'hot', 'but', 'what', 'some', 'we', 'can', 'out',
      'other', 'were', 'all', 'there', 'when', 'up', 'use', 'your', 'how',
      'said', 'an', 'each', 'she', 'which', 'do', 'their', 'time', 'if',
      'will', 'way', 'about', 'many', 'them', 'would', 'write', 'like', 'so',
      'these', 'her', 'long', 'make', 'thing', 'see', 'him', 'two', 'has',
      'look', 'more', 'day', 'could', 'go', 'come', 'did', 'my', 'sound',
      'no', 'most', 'number', 'who', 'over', 'know', 'water', 'than', 'call',
      'first', 'people', 'may', 'down', 'side', 'been', 'now', 'find', 'any',
      'new', 'work', 'part', 'get', 'also', 'into', 'its', 'just', 'only',
      'both', 'very', 'how', 'where', 'through', 'back', 'much', 'before',
      'here', 'move', 'why', 'right', 'too', 'mean', 'old', 'any', 'same',
      'tell', 'boy', 'follow', 'came', 'want', 'show', 'also', 'around',
      'form', 'three', 'small', 'set', 'put', 'end', 'does', 'another',
      'well', 'large', 'must', 'big', 'even', 'such', 'because', 'turn',
      'here', 'when', 'much', 'before', 'move', 'right', 'boy', 'old', 'too',
      'same', 'tell', 'does', 'ask', 'men', 'change', 'went', 'light', 'kind',
      'house', 'picture', 'again', 'animal', 'point', 'mother', 'world',
      'near', 'build', 'self', 'earth', 'father', 'head', 'stand', 'own',
      'page', 'should', 'country', 'found', 'answer', 'school', 'grow',
      'study', 'still', 'learn', 'plant', 'cover', 'food', 'sun', 'four',
      'between', 'state', 'keep', 'eye', 'never', 'last', 'let', 'thought',
      'city', 'tree', 'cross', 'farm', 'hard', 'start', 'might', 'story',
      'saw', 'far', 'sea', 'draw', 'left', 'late', 'run', 'dont', 'while',
      'press', 'close', 'night', 'real', 'life', 'few', 'north', 'open',
      'seem', 'together', 'next', 'white', 'children', 'begin', 'got',
      'walk', 'example', 'ease', 'paper', 'group', 'always', 'music', 'those',
      'both', 'mark', 'often', 'letter', 'until', 'mile', 'river', 'car',
      'feet', 'care', 'second', 'book', 'carry', 'took', 'science', 'eat',
      'room', 'friend', 'began', 'idea', 'fish', 'mountain', 'stop', 'once',
      'base', 'hear', 'horse', 'cut', 'sure', 'watch', 'color', 'face',
      'wood', 'main', 'enough', 'plain', 'girl', 'usual', 'young', 'ready',
      'above', 'ever', 'red', 'list', 'though', 'feel', 'talk', 'bird',
      'soon', 'body', 'dog', 'family', 'direct', 'leave', 'song', 'measure',
      'door', 'product', 'black', 'short', 'numeral', 'class', 'wind',
      'question', 'happen', 'complete', 'ship', 'area', 'half', 'rock',
      'order', 'fire', 'south', 'problem', 'piece', 'told', 'knew', 'pass',
      'since', 'top', 'whole', 'king', 'space', 'heard', 'best', 'hour',
      'better', 'during', 'hundred', 'five', 'remember', 'step', 'early',
      'hold', 'west', 'ground', 'interest', 'reach', 'fast', 'verb', 'sing',
      'listen', 'six', 'table', 'travel', 'less', 'morning', 'ten', 'simple',
      'several', 'vowel', 'toward', 'war', 'lay', 'against', 'pattern', 'slow',
      'center', 'love', 'person', 'money', 'serve', 'appear', 'road', 'map',
      'rain', 'rule', 'govern', 'pull', 'cold', 'notice', 'voice', 'unit',
      'power', 'town', 'fine', 'certain', 'fly', 'fall', 'lead', 'cry', 'dark',
      'machine', 'note', 'wait', 'plan', 'figure', 'star', 'box', 'noun',
      'field', 'rest', 'correct', 'able', 'pound', 'done', 'beauty', 'drive',
      'stood', 'contain', 'front', 'teach', 'week', 'final', 'gave', 'green',
      'oh', 'quick', 'develop', 'ocean', 'warm', 'free', 'minute', 'strong',
      'special', 'mind', 'behind', 'clear', 'tail', 'produce', 'fact', 'street',
      'inch', 'multiply', 'nothing', 'course', 'stay', 'wheel', 'full', 'force',
      'blue', 'object', 'decide', 'surface', 'deep', 'moon', 'island', 'foot',
      'system', 'busy', 'test', 'record', 'boat', 'common', 'gold', 'possible',
      'plane', 'stead', 'dry', 'wonder', 'laugh', 'thousands', 'ago', 'ran',
      'check', 'game', 'shape', 'equate', 'hot', 'miss', 'brought', 'heat',
      'snow', 'tire', 'bring', 'yes', 'distant', 'fill', 'east', 'paint',
      'language', 'among', 'grand', 'ball', 'yet', 'wave', 'drop', 'heart',
      'am', 'present', 'heavy', 'dance', 'engine', 'position', 'arm', 'wide',
      'sail', 'material', 'size', 'vary', 'settle', 'speak', 'weight', 'general',
      'ice', 'matter', 'circle', 'pair', 'include', 'divide', 'syllable', 'felt',
      'perhaps', 'pick', 'sudden', 'count', 'square', 'reason', 'length',
      'represent', 'art', 'subject', 'region', 'energy', 'hunt', 'probable',
      'bed', 'brother', 'egg', 'ride', 'cell', 'believe', 'fraction', 'forest',
      'sit', 'race', 'window', 'store', 'summer', 'train', 'sleep', 'prove',
      'lone', 'leg', 'exercise', 'wall', 'catch', 'mount', 'wish', 'sky',
      'board', 'joy', 'winter', 'sat', 'written', 'wild', 'instrument', 'kept',
      'glass', 'grass', 'cow', 'job', 'edge', 'sign', 'visit', 'past', 'soft',
      'fun', 'bright', 'gas', 'weather', 'month', 'million', 'bear', 'finish',
      'happy', 'hope', 'flower', 'clothe', 'strange', 'gone', 'jump', 'baby',
      'eight', 'village', 'meet', 'root', 'buy', 'raise', 'solve', 'metal',
      'whether', 'push', 'seven', 'paragraph', 'third', 'shall', 'held', 'hair',
      'describe', 'cook', 'floor', 'either', 'result', 'burn', 'hill', 'safe',
      'cat', 'century', 'consider', 'type', 'law', 'bit', 'coast', 'copy',
      'phrase', 'silent', 'tall', 'sand', 'soil', 'roll', 'temperature',
      'finger', 'industry', 'value', 'fight', 'lie', 'beat', 'excite', 'natural',
      'view', 'sense', 'capital', 'wont', 'chair', 'danger', 'fruit', 'rich',
      'thick', 'soldier', 'process', 'practice', 'separate', 'difficult',
      'doctor', 'please', 'protect', 'noon', 'whose', 'locate', 'ring',
      'character', 'insect', 'caught', 'period', 'indicate', 'radio', 'spoke',
      'atom', 'human', 'history', 'effect', 'electric', 'expect', 'crop',
      'modern', 'element', 'hit', 'student', 'corner', 'party', 'supply',
      'bone', 'rail', 'imagine', 'provide', 'agree', 'thus', 'capital', 'wont',
      'chair', 'danger', 'fruit', 'rich', 'thick', 'soldier', 'process',
      'separate', 'difficult', 'doctor', 'please', 'protect', 'noon', 'whose',
      'locate', 'ring', 'character', 'insect', 'caught', 'period', 'indicate',
      'radio', 'spoke', 'atom', 'human', 'history', 'effect', 'electric',
      'expect', 'crop', 'modern', 'element', 'hit', 'student', 'corner',
      'party', 'supply', 'bone', 'rail', 'imagine', 'provide', 'agree',
      'thus', 'gentle', 'woman', 'captain', 'guess', 'necessary', 'sharp',
      'wing', 'create', 'neighbor', 'wash', 'bat', 'rather', 'crowd', 'corn',
      'compare', 'poem', 'string', 'bell', 'depend', 'meat', 'rub', 'tube',
      'famous', 'dollar', 'stream', 'fear', 'sight', 'thin', 'triangle',
      'planet', 'hurry', 'chief', 'colony', 'clock', 'mine', 'tie', 'enter',
      'major', 'fresh', 'search', 'send', 'yellow', 'gun', 'allow', 'print',
      'dead', 'spot', 'desert', 'suit', 'current', 'lift', 'rose', 'continue',
      'block', 'chart', 'hat', 'sell', 'success', 'company', 'subtract',
      'event', 'particular', 'deal', 'swim', 'term', 'opposite', 'wife',
      'shoe', 'shoulder', 'spread', 'arrange', 'camp', 'invent', 'cotton',
      'born', 'determine', 'quart', 'nine', 'truck', 'noise', 'level',
      'chance', 'gather', 'shop', 'stretch', 'throw', 'shine', 'property',
      'column', 'molecule', 'select', 'wrong', 'gray', 'repeat', 'require',
      'broad', 'prepare', 'salt', 'nose', 'plural', 'anger', 'claim',
      'continent', 'oxygen', 'sugar', 'death', 'pretty', 'skill', 'women',
      'season', 'solution', 'magnet', 'silver', 'thank', 'branch', 'match',
      'suffix', 'especially', 'fig', 'afraid', 'huge', 'sister', 'steel',
      'discuss', 'forward', 'similar', 'guide', 'experience', 'score', 'apple',
      'bought', 'led', 'pitch', 'coat', 'mass', 'card', 'band', 'rope',
      'slip', 'win', 'dream', 'evening', 'condition', 'feed', 'tool', 'total',
      'basic', 'smell', 'valley', 'nor', 'double', 'seat', 'arrive', 'master',
      'track', 'parent', 'shore', 'division', 'sheet', 'substance', 'favor',
      'connect', 'post', 'spend', 'chord', 'fat', 'glad', 'original', 'share',
      'station', 'dad', 'bread', 'charge', 'proper', 'bar', 'offer',
      'segment', 'slave', 'duck', 'instant', 'market', 'degree', 'populate',
      'chick', 'dear', 'enemy', 'reply', 'drink', 'occur', 'support',
      'speech', 'nature', 'range', 'steam', 'motion', 'path', 'liquid', 'log',
      'meant', 'quotient', 'teeth', 'shell', 'neck', 'oxygen', 'study',
      'analysis', 'cite', 'citation', 'source', 'author', 'reference',
      'bibliography', 'quote', 'paraphrase', 'mla', 'apa', 'chicago', 'harvard',
      'vancouver', 'ieee', 'academic', 'journal', 'article', 'paper',
      'publication', 'publisher', 'edition', 'volume', 'issue', 'pages',
      'doi', 'url', 'website', 'retrieved', 'accessed', 'accessed date',
      'accessed on', 'available at', 'in press', 'forthcoming', 'et al',
      'ibid', 'op cit', 'loc cit', 'ibid', 'vol', 'no', 'pp', 'p', 'ed',
      'eds', 'trans', 'translator', 'edited by', 'compiled by', ' foreword',
      'preface', 'introduction', 'chapter', 'section', 'figure', 'table',
      'appendix', 'index', 'bibliography', 'references', 'works cited',
      'further reading', 'notes', 'footnote', 'endnote', 'annotation',
      'abstract', 'summary', 'keywords', 'subject', 'discipline', 'field',
      'domain', 'topic', 'theme', 'argument', 'claim', 'evidence',
      'premise', 'conclusion', 'hypothesis', 'theory', 'method', 'result',
      'finding', 'data', 'statistic', 'percentage', 'survey', 'interview',
      'observation', 'experiment', 'case study', 'literature review',
      'methodology', 'analysis', 'discussion', 'implication', 'limitation',
      'future research', 'recommendation', 'conclusion', 'introduction',
      'background', 'objective', 'aim', 'purpose', 'goal', 'scope',
      'delimitation', 'significance', 'contribution', 'novelty', 'innovation',
      'advancement', 'breakthrough', 'discovery', 'insight', 'perspective',
      'viewpoint', 'stance', 'position', 'side', 'aspect', 'facet',
      'dimension', 'element', 'component', 'factor', 'variable', 'constant',
      'parameter', 'criterion', 'standard', 'benchmark', 'baseline',
      'control', 'treatment', 'group', 'sample', 'population', 'subject',
      'participant', 'respondent', 'individual', 'person', 'human', 'animal',
      'organism', 'species', 'genus', 'family', 'order', 'class', 'phylum',
      'kingdom', 'domain', 'taxonomy', 'classification', 'categorization',
      'taxonomy', 'nomenclature', 'terminology', 'definition', 'concept',
      'construct', 'idea', 'notion', 'thought', 'understanding', 'comprehension',
      'knowledge', 'wisdom', 'insight', 'awareness', 'consciousness',
      'perception', 'cognition', 'reasoning', 'thinking', 'reflection',
      'contemplation', 'meditation', 'pondering', 'deliberation', 'consideration',
      'evaluation', 'assessment', 'judgment', 'decision', 'choice', 'option',
      'alternative', 'possibility', 'potential', 'capability', 'ability',
      'skill', 'competence', 'expertise', 'proficiency', 'mastery',
      'craftsmanship', 'artistry', 'talent', 'gift', 'aptitude', 'flair',
      'knack', 'bent', 'leaning', 'inclination', 'tendency', 'propensity',
      'predisposition', 'predilection', 'preference', 'liking', 'affinity',
      'attraction', 'appeal', 'charm', 'fascination', 'interest', 'curiosity',
      'wonder', 'amazement', 'astonishment', 'surprise', 'shock', 'stun',
      'dazzle', 'bewilder', 'confuse', 'puzzle', 'perplex', 'baffle',
      'mystify', 'stump', 'flummox', 'confound', 'disconcert', 'disquiet',
      'unsettle', 'disturb', 'perturb', 'agitate', 'upset', 'trouble',
      'bother', 'concern', 'worry', 'anxiety', 'fear', 'terror', 'horror',
      'panic', 'dread', 'apprehension', 'trepidation', 'foreboding',
      'premonition', 'presentiment', 'intuition', 'hunch', 'suspicion',
      'doubt', 'skepticism', 'disbelief', 'incredulity', 'astonishment',
      'amazement', 'wonder', 'marvel', 'awe', 'reverence', 'respect',
      'admiration', 'appreciation', 'gratitude', 'thankfulness', 'thanks',
      'acknowledgment', 'recognition', 'acclamation', 'applause', 'praise',
      'commendation', 'endorsement', 'approval', 'sanction', 'authorization',
      'permission', 'consent', 'assent', 'agreement', 'accord', 'concord',
      'harmony', 'consensus', 'unity', 'solidarity', 'collaboration',
      'cooperation', 'partnership', 'alliance', 'association', 'organization',
      'institution', 'establishment', 'foundation', 'creation', 'formation',
      'constitution', 'structure', 'framework', 'architecture', 'design',
      'blueprint', 'plan', 'scheme', 'strategy', 'tactic', 'approach',
      'method', 'technique', 'procedure', 'protocol', 'process', 'operation',
      'function', 'performance', 'execution', 'implementation', 'application',
      'use', 'utilization', 'employment', 'deployment', 'mobilization',
      'activation', 'initiation', 'commencement', 'beginning', 'start',
      'onset', 'outset', 'inception', 'conception', 'birth', 'origin',
      'source', 'root', 'cause', 'reason', 'motive', 'incentive', 'spur',
      'stimulus', 'trigger', 'catalyst', 'precipitant', 'occasion', 'opportunity',
      'chance', 'possibility', 'prospect', 'likelihood', 'probability',
      'odds', 'bet', 'gamble', 'risk', 'hazard', 'danger', 'peril', 'threat',
      'jeopardy', 'vulnerability', 'exposure', 'susceptibility', 'predilection',
      'weakness', 'flaw', 'defect', 'imperfection', 'deficiency', 'shortcoming',
      'limitation', 'drawback', 'disadvantage', 'handicap', 'obstacle',
      'barrier', 'impediment', 'hindrance', 'obstruction', 'blockade', 'barricade',
      'wall', 'fence', 'boundary', 'border', 'frontier', 'edge', 'margin',
      'perimeter', 'circumference', 'compass', 'scope', 'range', 'extent',
      'magnitude', 'size', 'dimension', 'proportion', 'ratio', 'scale',
      'measure', 'quantity', 'amount', 'number', 'figure', 'digit', 'numeral',
      'integer', 'whole', 'fraction', 'decimal', 'percentage', 'rate',
      'ratio', 'proportion', 'percentage', 'fraction', 'decimal', 'fraction',
      'part', 'piece', 'segment', 'section', 'portion', 'share', 'allotment',
      'division', 'split', 'separation', 'partition', 'break', 'crack',
      'fracture', 'breach', 'gap', 'interval', 'space', 'distance', 'length',
      'width', 'height', 'depth', 'thickness', 'breadth', 'latitude',
      'longitude', 'altitude', 'elevation', 'level', 'grade', 'rank',
      'position', 'standing', 'status', 'state', 'condition', 'situation',
      'circumstance', 'context', 'setting', 'environment', 'surrounding',
      'milieu', 'background', 'framework', 'backdrop', 'scene', 'scenario',
      'landscape', 'seascape', 'cityscape', 'skyscape', 'panorama', 'view',
      'vista', 'prospect', 'outlook', 'perspective', 'viewpoint', 'stance',
      'position', 'side', 'angle', 'aspect', 'facet', 'dimension', 'element',
      'component', 'part', 'feature', 'attribute', 'characteristic', 'trait',
      'quality', 'property', 'essence', 'nature', 'character', 'identity',
      'personality', 'temperament', 'disposition', 'mindset', 'attitude',
      'outlook', 'perspective', 'worldview', 'philosophy', 'ideology',
      'belief', 'faith', 'creed', 'doctrine', 'dogma', 'tenet', 'principle',
      'value', 'ideal', 'standard', 'criterion', 'benchmark', 'measure',
      'yardstick', 'gauge', 'indicator', 'sign', 'signal', 'symptom', 'manifestation',
      'expression', 'display', 'demonstration', 'exhibition', 'presentation',
      'performance', 'show', 'production', 'creation', 'work', 'piece',
      'composition', 'piece', 'artwork', 'masterpiece', 'magnum opus',
      'oeuvre', 'output', 'product', 'outcome', 'result', 'consequence',
      'effect', 'impact', 'influence', 'impression', 'mark', 'trace',
      'vestige', 'remnant', 'remains', 'residue', 'leftover', 'remainder',
      'rest', 'balance', 'surplus', 'excess', 'surfeit', 'overabundance',
      'plethora', 'myriad', 'multitude', 'host', 'horde', 'crowd', 'throng',
      'mob', 'pack', 'group', 'team', 'squad', 'unit', 'section', 'division',
      'department', 'branch', 'wing', 'arm', 'offshoot', 'subsidiary',
      'affiliate', 'associate', 'partner', 'colleague', 'co-worker', 'associate',
      'companion', 'friend', 'ally', 'supporter', 'backer', 'advocate',
      'champion', 'defender', 'protector', 'guardian', 'keeper', 'custodian',
      'steward', 'manager', 'administrator', 'director', 'head', 'chief',
      'leader', 'commander', 'captain', 'general', 'admiral', 'marshal',
      'generalissimo', 'dictator', 'tyrant', 'autocrat', 'ruler', 'sovereign',
      'monarch', 'king', 'queen', 'prince', 'princess', 'duke', 'duchess',
      'count', 'countess', 'earl', 'baron', 'baroness', 'sir', 'madam',
      'lady', 'gentleman', 'mister', 'miss', 'mrs', 'ms', 'dr', 'prof',
      'mr', 'mrs', 'ms', 'mx', 'ind', 'per', 'pro', 'ante', 'anti', 'auto',
      'bio', 'co', 'con', 'contra', 'counter', 'de', 'dis', 'en', 'em',
      'ex', 'extra', 'fore', 'hetero', 'homo', 'homeo', 'il', 'im', 'in',
      'ir', 'inter', 'intra', 'intro', 'macro', 'micro', 'mid', 'mis',
      'mono', 'multi', 'neo', 'non', 'omni', 'over', 'post', 'pre', 'pro',
      'pseudo', 're', 'retro', 'semi', 'sub', 'super', 'trans', 'tri',
      'ultra', 'un', 'under', 'uni', 'vice'
    ];

    this.tokenizer.wordToIndex = {};
    this.tokenizer.indexToWord = [];
    defaultVocab.forEach((word, index) => {
      this.tokenizer.wordToIndex[word] = index;
      this.tokenizer.indexToWord[index] = word;
    });
    this.tokenizer.vocabBuilt = true;
  }

  // Preprocess input text
  preprocessText(text) {
    return this.tokenizer.encode(text, MODEL_CONFIG.maxLength);
  }

  // Predict source type, author presence, and citation style
  async predict(text) {
    if (!this.model) {
      throw new Error('Model not loaded. Call loadModel() first.');
    }

    // Preprocess
    const inputArray = this.preprocessText(text);
    const inputTensor = tf.tensor2d([inputArray], [1, MODEL_CONFIG.maxLength]);

    // Run inference
    const predictions = this.model.predict(inputTensor);
    const [sourceTypePred, authorPred, stylePred] = await predictions;

    // Get predictions as arrays
    const sourceType = await sourceTypePred.data();
    const hasAuthor = await authorPred.data();
    const style = await stylePred.data();

    // Clean up tensors
    inputTensor.dispose();
    predictions.forEach(pred => pred.dispose());

    // Get predicted classes
    const sourceTypeIndex = sourceType.indexOf(Math.max(...sourceType));
    const styleIndex = style.indexOf(Math.max(...style));

    const results = {
      sourceType: {
        index: sourceTypeIndex,
        label: this.getSourceTypeLabel(sourceTypeIndex),
        confidence: Math.max(...sourceType),
        probabilities: {
          website: sourceType[0],
          academic: sourceType[1],
          book: sourceType[2],
          news: sourceType[3],
          other: sourceType[4]
        }
      },
      hasAuthor: {
        hasAuthor: hasAuthor[1] > 0.5,
        confidence: Math.max(hasAuthor[0], hasAuthor[1])
      },
      citationStyle: {
        index: styleIndex,
        label: this.getStyleLabel(styleIndex),
        confidence: Math.max(...style),
        probabilities: {
          auto: style[0],
          mla: style[1],
          apa: style[2]
        }
      }
    };

    return results;
  }

  getSourceTypeLabel(index) {
    const labels = ['website', 'academic', 'book', 'news', 'other'];
    return labels[index] || 'other';
  }

  getStyleLabel(index) {
    const labels = ['auto', 'mla', 'apa'];
    return labels[index] || 'auto';
  }

  // Dispose model to free memory
  dispose() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CitationTokenizer,
    createCitationModel,
    CitationInference,
    MODEL_CONFIG
  };
}

// For browser usage
if (typeof window !== 'undefined') {
  window.CitationModel = {
    CitationTokenizer,
    createCitationModel,
    CitationInference,
    MODEL_CONFIG
  };
}

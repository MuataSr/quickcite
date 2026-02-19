// Simple batch test
const tf = require('@tensorflow/tfjs-node');
const { CitationTokenizer, createCitationModel, MODEL_CONFIG } = require('./model/citation-model.js');

console.log('Testing batch creation...\n');

// Create tokenizer and build vocab
const tokenizer = new CitationTokenizer(MODEL_CONFIG.vocabSize);
const sampleTexts = [
  "Deep Learning for Natural Language Processing",
  "How to Build a REST API with Node.js",
  "The Pragmatic Programmer",
  "Breaking: News Report"
];

tokenizer.buildVocab(sampleTexts);

// Create a simple batch
const batchData = [
  { text: "Test 1", sourceType: 0, hasAuthor: 1, citationStyle: 0 },
  { text: "Test 2", sourceType: 1, hasAuthor: 0, citationStyle: 1 },
  { text: "Test 3", sourceType: 2, hasAuthor: 1, citationStyle: 2 },
];

const inputs = [];
const outputs = {
  source_type_output: [],
  has_author_output: [],
  citation_style_output: []
};

batchData.forEach(sample => {
  inputs.push(tokenizer.encode(sample.text, MODEL_CONFIG.maxLength));
  outputs.source_type_output.push(sample.sourceType);
  outputs.has_author_output.push(sample.hasAuthor);
  outputs.citation_style_output.push(sample.citationStyle);
});

console.log('Input batch size:', inputs.length);
console.log('Source type outputs:', outputs.source_type_output);
console.log('Has author outputs:', outputs.has_author_output);
console.log('Citation style outputs:', outputs.citation_style_output);

// Try one-hot encoding
const authorOneHot = outputs.has_author_output.map(val => {
  const oneHot = [0, 0];
  oneHot[val] = 1;
  return oneHot;
});

console.log('\nOne-hot encoded author:', authorOneHot);
console.log('Author one-hot type:', typeof authorOneHot);
console.log('Author one-hot length:', authorOneHot.length);
if (authorOneHot.length > 0) {
  console.log('First element:', authorOneHot[0]);
  console.log('First element type:', typeof authorOneHot[0]);
}

// Try creating tensors
const xs = tf.tensor2d(inputs);
console.log('\nInput tensor shape:', xs.shape);

console.log('\nCreating author tensor...');
const authorTensor = tf.tensor2d(authorOneHot);
console.log('Author tensor shape:', authorTensor.shape);

const ys = {
  source_type_output: tf.tensor1d(outputs.source_type_output, 'int32'),
  has_author_output: authorTensor,
  citation_style_output: tf.tensor1d(outputs.citation_style_output, 'int32')
};

console.log('Output shapes:');
console.log('  source_type_output:', ys.source_type_output.shape);
console.log('  has_author_output:', ys.has_author_output.shape);
console.log('  citation_style_output:', ys.citation_style_output.shape);

// Create model and try prediction
const model = createCitationModel();
console.log('\n✅ Model created successfully');

const predictions = model.predict(xs);
console.log('✅ Prediction successful');
console.log('Prediction shapes:', predictions.map(p => p.shape));

// Cleanup
xs.dispose();
ys.source_type_output.dispose();
ys.has_author_output.dispose();
ys.citation_style_output.dispose();
predictions.forEach(p => p.dispose());
model.dispose();

console.log('\n✅ All tests passed!');

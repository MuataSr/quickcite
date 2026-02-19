// ============================================================================
// MODEL OPTIMIZATION & QUANTIZATION
// Compresses the trained model for extension deployment
// ============================================================================

const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');

// ============================================================================
// QUANTIZATION: Convert float32 to int8 or float16 for smaller size
// ============================================================================

async function quantizeModel(modelPath, outputPath, quantizationType = 'int8') {
  console.log(`🔧 Loading model for quantization: ${modelPath}`);

  // Load model (add file:// prefix for local paths)
  const modelUrl = modelPath.startsWith('file://') ? modelPath : `file://${path.resolve(modelPath)}`;
  const model = await tf.loadLayersModel(modelUrl);

  // Quantize weights
  console.log(`🎯 Quantizing to ${quantizationType}...`);

  if (quantizationType === 'int8') {
    await quantizeWeightsInt8(model);
  } else if (quantizationType === 'float16') {
    await quantizeWeightsFloat16(model);
  }

  // Save quantized model with uint16 quantization
  console.log(`💾 Saving quantized model to: ${outputPath}`);
  const outputDir = path.resolve(outputPath);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  await model.save(`file://${outputDir}`, {
    quantizationBits: 16  // Use uint16 quantization (halves weight size)
  });

  // Calculate size reduction
  const originalSize = getDirectorySize(path.dirname(modelPath));
  const quantizedSize = getDirectorySize(path.dirname(outputPath));
  const reduction = ((1 - quantizedSize / originalSize) * 100).toFixed(2);

  console.log(`\n📊 Size Comparison:`);
  console.log(`   Original: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Quantized: ${(quantizedSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Reduction: ${reduction}%`);

  model.dispose();
  return { originalSize, quantizedSize, reduction };
}

async function quantizeWeightsInt8(model) {
  // TensorFlow.js doesn't support in-place int8 quantization for layer models
  // Instead, we'll use uint16 quantization via saving with quantizeUint16 option
  // The model will be saved with quantization enabled
  console.log('   Using TensorFlow.js built-in uint16 quantization...');
}

async function quantizeWeightsFloat16(model) {
  model.layers.forEach(layer => {
    if (layer.getWeights().length > 0) {
      const weights = layer.getWeights();
      const float16Weights = weights.map(weight => {
        // Convert to float16
        const float16Data = new Float16Array(weight.dataSync());
        const float16Tensor = tf.tensor(float16Data, weight.shape, 'float16');
        weight.dispose();
        return float16Tensor;
      });

      layer.setWeights(float16Weights);
    }
  });
}

// ============================================================================
// MODEL PRUNING: Remove less important weights
// ============================================================================

async function pruneModel(modelPath, outputPath, pruningFactor = 0.5) {
  console.log(`✂️  Loading model for pruning: ${modelPath}`);

  const model = await tf.loadLayersModel(modelPath);
  console.log(`🎯 Pruning ${pruningFactor * 100}% of weights...`);

  model.layers.forEach(layer => {
    if (layer.getWeights().length > 0) {
      const weights = layer.getWeights();
      const prunedWeights = weights.map(weight => {
        const data = weight.dataSync();
        const shape = weight.shape;

        // Calculate absolute values
        const absData = Array.from(data).map(Math.abs);

        // Find threshold (keep top (1 - pruningFactor) weights)
        const sortedAbsData = [...absData].sort((a, b) => b - a);
        const thresholdIndex = Math.floor(sortedAbsData.length * (1 - pruningFactor));
        const threshold = sortedAbsData[thresholdIndex] || 0;

        // Create mask for weights to keep
        const prunedData = new Float32Array(data.length);
        for (let i = 0; i < data.length; i++) {
          prunedData[i] = absData[i] >= threshold ? data[i] : 0;
        }

        const prunedTensor = tf.tensor(prunedData, shape);
        weight.dispose();
        return prunedTensor;
      });

      layer.setWeights(prunedWeights);
    }
  });

  console.log(`💾 Saving pruned model to: ${outputPath}`);
  await model.save(`file://${path.resolve(outputPath)}`);

  model.dispose();
}

// ============================================================================
// KNOWLEDGE DISTILLATION: Create smaller student model
// ============================================================================

async function createDistilledModel(teacherModelPath, studentModelPath, studentConfig) {
  console.log(`🎓 Creating distilled student model...`);

  // Load teacher model
  const teacherModel = await tf.loadLayersModel(teacherModelPath);

  // Create smaller student model (architecture defined in studentConfig)
  const studentModel = createStudentModel(studentConfig);

  // Generate training data for distillation
  const numSamples = 1000;
  console.log(`📚 Generating ${numSamples} training samples for distillation...`);

  const distillationData = generateDistillationData(numSamples);

  // Train student model with soft targets from teacher
  console.log(`🔬 Training student model with knowledge distillation...`);

  const batchSize = 32;
  const epochs = 30;

  const optimizer = tf.train.adam(0.001);

  for (let epoch = 1; epoch <= epochs; epoch++) {
    console.log(`\nEpoch ${epoch}/${epochs}`);
    let totalLoss = 0;
    let numBatches = 0;

    for (let i = 0; i < distillationData.length; i += batchSize) {
      const batch = distillationData.slice(i, i + batchSize);

      const inputs = batch.map(sample => sample.input);
      const hardTargets = batch.map(sample => sample.targets);

      const xs = tf.tensor2d(inputs);
      const ys = {
        source_type_output: tf.tensor1d(hardTargets.map(t => t.sourceType), 'int32'),
        has_author_output: tf.tensor1d(hardTargets.map(t => t.hasAuthor), 'int32'),
        citation_style_output: tf.tensor1d(hardTargets.map(t => t.citationStyle), 'int32')
      };

      // Get teacher predictions (soft targets)
      const teacherPreds = teacherModel.predict(xs);

      // Compute loss (combination of hard and soft targets)
      const studentPreds = studentModel.predict(xs);
      const loss = tf.losses.meanSquaredError(
        tf.concat([teacherPreds[0], teacherPreds[1], teacherPreds[2]], 1),
        tf.concat([studentPreds[0], studentPreds[1], studentPreds[2]], 1)
      );

      const lossValue = await loss.data();
      totalLoss += lossValue[0];
      numBatches++;

      // Backpropagation
      const grads = tf.grad(lossValue => {
        const studentPreds = studentModel.predict(xs);
        const combinedLoss = tf.losses.meanSquaredError(
          tf.concat([teacherPreds[0], teacherPreds[1], teacherPreds[2]], 1),
          tf.concat([studentPreds[0], studentPreds[1], studentPreds[2]], 1)
        );
        return combinedLoss;
      })(xs);

      optimizer.applyGradients(grads);

      xs.dispose();
      ys.source_type_output.dispose();
      ys.has_author_output.dispose();
      ys.citation_style_output.dispose();
      teacherPreds.forEach(pred => pred.dispose());
      studentPreds.forEach(pred => pred.dispose());
      grads.dispose();
    }

    console.log(`Average Loss: ${(totalLoss / numBatches).toFixed(4)}`);
  }

  console.log(`💾 Saving distilled model to: ${studentModelPath}`);
  await studentModel.save(`file://${path.resolve(studentModelPath)}`);

  teacherModel.dispose();
  studentModel.dispose();
}

function createStudentModel(config) {
  const model = tf.sequential();

  // Smaller architecture
  model.add(tf.layers.embedding({
    inputDim: config.vocabSize,
    outputDim: config.embeddingDim || 32,
    inputLength: config.maxLength || 128
  }));

  model.add(tf.layers.globalAveragePooling1d());

  model.add(tf.layers.dense({
    units: config.hiddenDim || 64,
    activation: 'relu'
  }));

  model.add(tf.layers.dropout({ rate: 0.1 }));

  // Output layers
  const authorBranch = tf.layers.dense({
    units: 32,
    activation: 'relu'
  })(model.outputs[0]);

  const authorOutput = tf.layers.dense({
    units: 2,
    activation: 'sigmoid',
    name: 'has_author_output'
  })(authorBranch);

  const styleBranch = tf.layers.dense({
    units: 32,
    activation: 'relu'
  })(model.outputs[0]);

  const styleOutput = tf.layers.dense({
    units: 3,
    activation: 'softmax',
    name: 'citation_style_output'
  })(styleBranch);

  const multiOutputModel = tf.model({
    inputs: model.inputs,
    outputs: [
      model.outputs[0],
      authorOutput,
      styleOutput
    ]
  });

  multiOutputModel.compile({
    optimizer: tf.train.adam(0.001),
    loss: {
      source_type_output: 'sparseCategoricalCrossentropy',
      has_author_output: 'binaryCrossentropy',
      citation_style_output: 'sparseCategoricalCrossentropy'
    },
    lossWeights: {
      source_type_output: 1.0,
      has_author_output: 0.5,
      citation_style_output: 0.8
    }
  });

  return multiOutputModel;
}

function generateDistillationData(numSamples) {
  const data = [];
  const sampleTexts = [
    "Machine Learning for Natural Language Processing",
    "Building Scalable Web Applications with Node.js",
    "Climate Change and Global Environmental Impact",
    "Deep Learning Architectures in Computer Vision",
    "Software Engineering Best Practices Guide"
  ];

  for (let i = 0; i < numSamples; i++) {
    const text = sampleTexts[i % sampleTexts.length];
    data.push({
      input: text,
      targets: {
        sourceType: i % 5,
        hasAuthor: Math.random() > 0.3 ? 1 : 0,
        citationStyle: Math.floor(Math.random() * 3)
      }
    });
  }

  return data;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getDirectorySize(dirPath) {
  let totalSize = 0;
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isFile()) {
      totalSize += stats.size;
    } else if (stats.isDirectory()) {
      totalSize += getDirectorySize(filePath);
    }
  });

  return totalSize;
}

async function benchmarkModel(modelPath) {
  console.log(`⚡ Benchmarking model: ${modelPath}\n`);

  const model = await tf.loadLayersModel(modelPath);

  // Warm up
  const warmupInput = tf.randomNormal([1, 128]);
  model.predict(warmupInput);
  warmupInput.dispose();

  // Benchmark
  const numRuns = 100;
  const startTime = Date.now();

  for (let i = 0; i < numRuns; i++) {
    const input = tf.randomNormal([1, 128]);
    const predictions = model.predict(input);
    input.dispose();
    predictions.forEach(pred => pred.dispose());
  }

  const endTime = Date.now();
  const totalTime = endTime - startTime;
  const avgTime = totalTime / numRuns;

  console.log(`📊 Benchmark Results:`);
  console.log(`   Total time for ${numRuns} runs: ${totalTime}ms`);
  console.log(`   Average inference time: ${avgTime.toFixed(2)}ms`);
  console.log(`   Throughput: ${(1000 / avgTime).toFixed(2)} inferences/sec`);

  model.dispose();
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'quantize') {
    const modelPath = args[1];
    const outputPath = args[2] || modelPath.replace('.json', '-quantized.json');
    const type = args[3] || 'int8';

    if (!modelPath) {
      console.error('❌ Please specify model path');
      process.exit(1);
    }

    await quantizeModel(modelPath, outputPath, type);
  } else if (command === 'prune') {
    const modelPath = args[1];
    const outputPath = args[2] || modelPath.replace('.json', '-pruned.json');
    const factor = parseFloat(args[3]) || 0.5;

    if (!modelPath) {
      console.error('❌ Please specify model path');
      process.exit(1);
    }

    await pruneModel(modelPath, outputPath, factor);
  } else if (command === 'distill') {
    const teacherPath = args[1];
    const studentPath = args[2] || './models/student-model.json';

    if (!teacherPath) {
      console.error('❌ Please specify teacher model path');
      process.exit(1);
    }

    const studentConfig = {
      vocabSize: 5000,
      embeddingDim: 32,
      hiddenDim: 64,
      maxLength: 128
    };

    await createDistilledModel(teacherPath, studentPath, studentConfig);
  } else if (command === 'benchmark') {
    const modelPath = args[1];

    if (!modelPath) {
      console.error('❌ Please specify model path');
      process.exit(1);
    }

    await benchmarkModel(modelPath);
  } else {
    console.log(`
🔧 Model Optimization & Quantization Tools

Commands:
  quantize [modelPath] [outputPath] [type]    Quantize model (int8 or float16)
  prune [modelPath] [outputPath] [factor]     Prune model weights (0-1)
  distill [teacherPath] [studentPath]         Create distilled student model
  benchmark [modelPath]                        Benchmark inference speed

Examples:
  node optimize-model.js quantize ./models/model.json ./models/model-int8.json int8
  node optimize-model.js prune ./models/model.json ./models/model-pruned.json 0.7
  node optimize-model.js distill ./models/teacher.json ./models/student.json
  node optimize-model.js benchmark ./models/model.json
    `);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

module.exports = {
  quantizeModel,
  pruneModel,
  createDistilledModel,
  benchmarkModel
};

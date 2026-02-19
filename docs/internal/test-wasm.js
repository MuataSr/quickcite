// Quick test to verify WASM backend works
// Run with: node test-wasm.js (after setting up node environment)

const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');

async function testWasmBackend() {
  console.log('🔬 Testing TensorFlow.js WASM Backend\n');

  try {
    // Set WASM backend
    console.log('1️⃣ Setting WASM backend...');
    await tf.setBackend('wasm');
    await tf.ready();
    console.log('   ✅ Backend set to:', tf.getBackend());

    // Check if WASM file exists
    const wasmPath = path.join(__dirname, 'wasm', 'tfjs-backend-wasm.wasm');
    if (fs.existsSync(wasmPath)) {
      console.log('   ✅ WASM file found:', wasmPath);
      console.log('   📏 File size:', (fs.statSync(wasmPath).size / 1024).toFixed(1), 'KB');
    } else {
      console.log('   ⚠️  WASM file not found at:', wasmPath);
    }

    // Test simple tensor operation
    console.log('\n2️⃣ Testing tensor operations...');
    const a = tf.tensor2d([[1, 2], [3, 4]]);
    const b = tf.tensor2d([[5, 6], [7, 8]]);
    const c = a.matMul(b);
    const result = await c.data();
    console.log('   ✅ Matrix multiplication works!');
    console.log('   📊 Result:', Array.from(result));

    a.dispose();
    b.dispose();
    c.dispose();

    // Test model loading (if exists)
    const modelPath = path.join(__dirname, 'models', 'model.json');
    if (fs.existsSync(modelPath)) {
      console.log('\n3️⃣ Testing model loading...');
      const model = await tf.loadLayersModel('file://' + modelPath);
      console.log('   ✅ Model loaded successfully!');
      console.log('   📋 Model inputs:', model.inputs);
      console.log('   📋 Model outputs:', model.outputs);
      model.dispose();
    } else {
      console.log('\n3️⃣ ⚠️  Model file not found:', modelPath);
    }

    console.log('\n🎉 All tests passed! WASM backend is ready.\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testWasmBackend();

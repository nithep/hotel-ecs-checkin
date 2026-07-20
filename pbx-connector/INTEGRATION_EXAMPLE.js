/**
 * @file INTEGRATION_EXAMPLE.js - Example of using refactored PBX modules
 * 
 * This file demonstrates how the three refactored modules work together:
 * 1. PBXProtocolHandler - Encodes/decodes CCH2 protocol
 * 2. CommandQueue - Ensures deterministic FIFO execution
 * 3. StateVerifier - Provides pre/post-flight verification with self-healing
 */

const { PBXProtocolHandler } = require('./protocol');
const { CommandQueue } = require('./queue');
const StateVerifier = require('./safety/StateVerifier');

// Mock transport for demonstration (replace with actual TcpTransport/SerialTransport)
class MockTransport {
  constructor() {
    this.connected = false;
  }
  
  async connect() {
    this.connected = true;
    console.log('✅ Connected to PBX');
  }
  
  async send(command) {
    if (!this.connected) throw new Error('Not connected');
    
    // Simulate PBX response based on command
    console.log(`📤 Sending: ${command.replace(/\r?\n/g, '')}`);
    
    // Simulate network delay
    await new Promise(r => setTimeout(r, 50));
    
    // Parse command and generate appropriate response
    if (command.includes('ROOM')) {
      const roomMatch = command.match(/ROOM(\d{4})=(\d)/);
      if (roomMatch) {
        const [, room, status] = roomMatch;
        return `=>ROOM${room}=${status}\r\n`;
      }
    }
    
    return '=NACK\r\n';
  }
  
  isConnected() {
    return this.connected;
  }
}

async function demonstrateIntegration() {
  console.log('\n' + '='.repeat(70));
  console.log('PBX MODULE INTEGRATION DEMONSTRATION');
  console.log('='.repeat(70) + '\n');
  
  // Initialize components
  const transport = new MockTransport();
  const queue = new CommandQueue();
  const verifier = new StateVerifier({ maxRetries: 3, retryDelayMs: 100 });
  
  // Connect to PBX
  await transport.connect();
  
  console.log('🔧 Step 1: Encode command using PBXProtocolHandler');
  const command = PBXProtocolHandler.encodeCommand(101, 'ON');
  console.log(`   Input: room=101, action='ON'`);
  console.log(`   Output: "${command.replace(/\r?\n/g, '\\r\\n')}"`);
  console.log('');
  
  console.log('🔧 Step 2: Pre-flight verification');
  const preCheck = verifier.preFlightCheck(101, 'ON');
  console.log(`   Valid: ${preCheck.valid}`);
  if (!preCheck.valid) {
    console.log(`   Error: ${preCheck.error}`);
    return;
  }
  console.log('');
  
  console.log('🔧 Step 3: Execute through CommandQueue (FIFO guarantee)');
  
  // Wrap the send operation with StateVerifier
  const result = await queue.add(async () => {
    console.log('   📡 Sending command to PBX...');
    
    // Send command via transport
    const rawResponse = await transport.send(command);
    console.log(`   📥 Received: "${rawResponse.replace(/\r?\n/g, '\\r\\n')}"`);
    
    // Post-flight verification
    console.log('');
    console.log('🔧 Step 4: Post-flight verification');
    const postCheck = verifier.postFlightCheck(rawResponse, 101, 'ON');
    console.log(`   Verified: ${postCheck.verified}`);
    console.log(`   Type: ${postCheck.type}`);
    
    if (!postCheck.verified) {
      throw new Error(postCheck.error || 'Verification failed');
    }
    
    console.log(`   Room: ${postCheck.parsed.room}`);
    console.log(`   Status: ${postCheck.parsed.value}`);
    console.log('');
    
    return {
      success: true,
      data: postCheck.parsed,
    };
  });
  
  console.log('🔧 Step 5: Decode response using PBXProtocolHandler');
  const decoded = PBXProtocolHandler.decodeResponse(result.data.raw);
  console.log(`   Response Type: ${decoded.type}`);
  console.log(`   Parsed Data:`, JSON.stringify(decoded.parsed, null, 2));
  console.log('');
  
  console.log('🔧 Step 6: Check verification statistics');
  const stats = verifier.getStats();
  console.log('   Statistics:', JSON.stringify(stats, null, 2));
  console.log('');
  
  console.log('✨ Integration Complete!');
  console.log('='.repeat(70) + '\n');
  
  return result;
}

// Run demonstration
demonstrateIntegration().catch(console.error);


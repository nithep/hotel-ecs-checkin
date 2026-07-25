require('dotenv').config();
const mqtt = require('mqtt');
const { createConnector } = require('./index');
const { logger } = require('./logger');

// Load configurations from Environment Variables
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtts://your-hivemq-cluster-url:8883';
const MQTT_USERNAME = process.env.MQTT_USERNAME || 'hotel-edge';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || 'your-password';
const BRANCH_ID = process.env.BRANCH_ID || 'branch_01';
const PBX_HOST = process.env.PBX_HOST || '192.168.1.100';
const PBX_PORT = parseInt(process.env.PBX_PORT, 10) || 23;

// Topics
const TOPIC_COMMAND = `hotel/${BRANCH_ID}/room/+/command`;
const TOPIC_STATUS = `hotel/${BRANCH_ID}/status`;

// 1. Initialize PBX Connector
const pbx = createConnector({
  mode: 'tcp', // Use 'mock' for local testing without actual PBX
  host: PBX_HOST,
  port: PBX_PORT,
  heartbeatInterval: 30000,
});

// 2. Initialize MQTT Client
logger.info(`Connecting to MQTT Broker at ${MQTT_BROKER_URL}...`);
const mqttClient = mqtt.connect(MQTT_BROKER_URL, {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  clientId: `edge-agent-${BRANCH_ID}-${Math.random().toString(16).substr(2, 8)}`,
  // Last Will and Testament (LWT)
  will: {
    topic: TOPIC_STATUS,
    payload: JSON.stringify({ status: 'offline', timestamp: Date.now() }),
    qos: 1,
    retain: true
  }
});

// Connect to PBX and MQTT
async function start() {
  try {
    await pbx.connect();
    logger.info('Connected to PBX successfully.');
  } catch (error) {
    logger.error(`Failed to connect to PBX: ${error.message}`);
    // Optional: We can still continue, PBX connector has auto-reconnect
  }
}

mqttClient.on('connect', () => {
  logger.info('Connected to MQTT Broker.');
  
  // Publish online status
  mqttClient.publish(TOPIC_STATUS, JSON.stringify({ status: 'online', timestamp: Date.now() }), { retain: true, qos: 1 });
  
  // Subscribe to command topic
  mqttClient.subscribe(TOPIC_COMMAND, { qos: 1 }, (err) => {
    if (!err) {
      logger.info(`Subscribed to topic: ${TOPIC_COMMAND}`);
    } else {
      logger.error(`Failed to subscribe: ${err.message}`);
    }
  });
});

mqttClient.on('message', async (topic, message) => {
  try {
    logger.info(`Received message on ${topic}: ${message.toString()}`);
    
    // Extract room number from topic (e.g., hotel/branch_01/room/101/command)
    const parts = topic.split('/');
    const roomNo = parts[3];
    
    const payload = JSON.parse(message.toString());
    const command = payload.command; // 'ON' or 'OFF'
    const guestName = payload.guestName || '';
    
    if (command === 'ON') {
      await pbx.checkIn(roomNo, guestName);
      logger.info(`Check-in command executed for room ${roomNo}`);
    } else if (command === 'OFF') {
      await pbx.checkOut(roomNo);
      logger.info(`Check-out command executed for room ${roomNo}`);
    } else {
      logger.warn(`Unknown command: ${command}`);
    }
    
    // Publish success result back
    const resultTopic = `hotel/${BRANCH_ID}/room/${roomNo}/result`;
    mqttClient.publish(resultTopic, JSON.stringify({
      status: 'success',
      command,
      timestamp: Date.now()
    }), { qos: 1 });
    
  } catch (error) {
    logger.error(`Error processing MQTT message: ${error.message}`);
  }
});

mqttClient.on('error', (err) => {
  logger.error(`MQTT Error: ${err.message}`);
});

mqttClient.on('offline', () => {
  logger.warn('MQTT Client went offline. Reconnecting...');
});

// Start the agent
start();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down Edge Agent...');
  mqttClient.publish(TOPIC_STATUS, JSON.stringify({ status: 'offline', timestamp: Date.now() }), { retain: true, qos: 1 });
  mqttClient.end();
  await pbx.disconnect();
  process.exit(0);
});

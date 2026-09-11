import mongoose from 'mongoose';
import Node from './models/Node.js';

const simulateTelemetry = async () => {
  try {
    const nodes = await Node.find({});
    
    for (let node of nodes) {
      const point = {
        timestamp: new Date().toLocaleTimeString(),
        timeEpoch: Date.now(),
        tiltDeg: node.readings.tiltDeg + (Math.random() * 0.1 - 0.05),
        vibrationMmS: node.readings.vibrationMmS + (Math.random() * 0.2 - 0.1),
        crackWidthMm: node.readings.crackWidthMm + (Math.random() * 0.1 - 0.02), // slight positive bias
        gasPpm: node.readings.gasPpm + (Math.random() * 2 - 1),
        riskScore: Math.floor(Math.random() * 100)
      };
      
      // Keep values realistic
      point.tiltDeg = Math.max(0, point.tiltDeg);
      point.vibrationMmS = Math.max(0, point.vibrationMmS);
      point.crackWidthMm = Math.max(0, point.crackWidthMm);
      point.gasPpm = Math.max(0, point.gasPpm);

      node.history.push(point);
      if (node.history.length > 50) {
        node.history.shift();
      }

      node.readings.tiltDeg = point.tiltDeg;
      node.readings.vibrationMmS = point.vibrationMmS;
      node.readings.crackWidthMm = point.crackWidthMm;
      node.readings.gasPpm = point.gasPpm;
      node.readings.lastHeartbeat = point.timeEpoch;
      
      await node.save();
    }
  } catch (error) {
    console.error('Simulation error:', error.message);
  }
};

const startSimulation = () => {
  console.log('Starting hardware simulation loop...');
  // Run every 3 seconds to mimic live telemetry
  setInterval(simulateTelemetry, 3000);
};

export default startSimulation;

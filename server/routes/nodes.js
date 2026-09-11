import express from 'express';
import Node from '../models/Node.js';

const router = express.Router();

// Get all nodes
router.get('/', async (req, res) => {
  try {
    const nodes = await Node.find({});
    res.json(nodes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching nodes', error: error.message });
  }
});

// Get a single node by ID
router.get('/:id', async (req, res) => {
  try {
    const node = await Node.findOne({ id: req.params.id });
    if (node) {
      res.json(node);
    } else {
      res.status(404).json({ message: 'Node not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching node', error: error.message });
  }
});

// Update telemetry for a node (Internal/Simulation)
router.post('/:id/telemetry', async (req, res) => {
  try {
    const node = await Node.findOne({ id: req.params.id });
    if (!node) {
      return res.status(404).json({ message: 'Node not found' });
    }
    
    // The payload should be the telemetry point
    const point = req.body;
    node.history.push(point);
    if (node.history.length > 50) {
      node.history.shift();
    }
    
    // Extract current reading fields from telemetry
    node.readings.tiltDeg = point.tiltDeg;
    node.readings.vibrationMmS = point.vibrationMmS;
    node.readings.crackWidthMm = point.crackWidthMm;
    node.readings.gasPpm = point.gasPpm;
    node.readings.lastHeartbeat = point.timeEpoch;
    
    await node.save();
    res.status(200).json(node);
  } catch (error) {
    res.status(500).json({ message: 'Error updating telemetry', error: error.message });
  }
});

export default router;

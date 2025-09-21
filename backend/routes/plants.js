// routes/plants.js
const express = require('express');
const router = express.Router();
const plantController = require('../controllers/plantController');

// Rută pentru a obține lista simplificată a plantelor
// GET /api/plants
router.get('/', plantController.getAllPlants);

// Rută pentru a obține detaliile complete pentru o singură plantă
// GET /api/plants/1
router.get('/:id', plantController.getPlantById);

module.exports = router;
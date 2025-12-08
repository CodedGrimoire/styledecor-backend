const express = require('express');
const router = express.Router();
const {
  getServices,
  getServiceById,
  register,
  getTopDecorators,
} = require('../controllers/publicController');

router.get('/services', getServices);
router.get('/services/:id', getServiceById);

router.get('/decorators/top', getTopDecorators);

router.post('/register', register);

module.exports = router;
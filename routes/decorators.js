const express = require('express');
const router = express.Router();

const { getTopDecorators } = require('../../controllers/decoratorController');

router.get('/top', getTopDecorators);

module.exports = router;
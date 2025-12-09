const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/role');
const decoratorController = require('../controllers/decoratorController');

router.use(verifyToken);
router.use(requireRole('decorator'));

router.get('/projects', decoratorController.getProjects);

router.put('/project/:bookingId/status', decoratorController.updateProjectStatus);

router.put('/project/:bookingId/status1', decoratorController.updateOnSiteStatus);

module.exports = router;

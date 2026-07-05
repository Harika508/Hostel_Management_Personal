const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const controller = require('../controllers/resources.controller');

router.use(verifyToken);

// Inventory ΓÇö Admin/Manager only manage
router.get('/inventory', controller.listInventory);
router.post('/inventory', controller.createInventory);
router.put('/inventory/:id', controller.updateInventory);
router.delete('/inventory/:id', controller.deleteInventory);

// Facilities ΓÇö everyone views, Admin/Manager manage
router.get('/facilities', controller.listFacilities);
router.post('/facilities', controller.createFacility);
router.put('/facilities/:id', controller.updateFacility);
router.delete('/facilities/:id', controller.deleteFacility);

// Maintenance Requests ΓÇö anyone creates, Admin/Manager resolve
router.get('/requests', controller.listRequests);
router.post('/requests', controller.createRequest);
router.put('/requests/:id', controller.updateRequest);
router.delete('/requests/:id', controller.deleteRequest);

module.exports = router;
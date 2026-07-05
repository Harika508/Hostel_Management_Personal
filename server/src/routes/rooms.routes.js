const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const controller = require('../controllers/rooms.controller');

router.use(verifyToken);
router.get('/', controller.listRooms);
router.post('/', controller.createRoom);
router.put('/:id', controller.updateRoom);
router.delete('/:id', controller.deleteRoom);
router.get('/stats', controller.stats);

module.exports = router;
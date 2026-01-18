const express = require('express');
const { globalSearch } = require('../controllers/searchController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.use(authMiddleware);

router.get('/', globalSearch);

module.exports = router;

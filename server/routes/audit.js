const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware to ensure user is admin
const adminMiddleware = async (req, res, next) => {
    const { data: profile } = await req.supabase
        .from('perfiles')
        .select('rol')
        .eq('id', req.user.id)
        .single();

    if (profile?.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
    }
    next();
};

router.get('/', authMiddleware, adminMiddleware, auditController.getAuditLogs);

module.exports = router;

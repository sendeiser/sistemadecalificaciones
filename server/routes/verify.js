const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabaseClient');

// PUBLIC validation route
router.get('/:hash', async (req, res) => {
    const { hash } = req.params;

    try {
        const { data, error } = await supabaseAdmin
            .from('document_validations')
            .select(`
                *,
                student:perfiles!student_id(nombre, dni)
            `)
            .eq('validation_hash', hash)
            .single();

        if (error || !data) {
            return res.status(404).json({ valid: false, message: 'Documento no válido o no encontrado.' });
        }

        res.json({
            valid: true,
            document_type: data.document_type,
            student_name: data.student?.nombre || 'Institucional (Sin Alumno)',
            created_at: data.created_at,
            metadata: data.metadata
        });
    } catch (err) {
        console.error('Verification error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;

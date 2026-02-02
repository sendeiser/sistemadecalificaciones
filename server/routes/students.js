const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { supabaseAdmin } = require('../config/supabaseClient');
const multer = require('multer');
const fs = require('fs');
const { parseCSV } = require('../utils/csvHandler');

const upload = multer({ dest: 'uploads/' });

router.use(authMiddleware);

// Middleware to check if user is admin or preceptor
const isAdminOrPreceptor = async (req, res, next) => {
    const { data: profile, error } = await req.supabase
        .from('perfiles')
        .select('rol')
        .eq('id', req.user.id)
        .single();

    if (error || (profile?.rol !== 'admin' && profile?.rol !== 'preceptor')) {
        return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador o preceptor.' });
    }
    next();
};

// GET /api/students
router.get('/', async (req, res) => {
    try {
        const { data, error } = await req.supabase
            .from('perfiles')
            .select('*')
            .eq('rol', 'alumno')
            .order('nombre');

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/students/register
 * Creates a new Auth user and its profile.
 * Requires SUPABASE_SERVICE_ROLE_KEY to be configured.
 */
router.post('/register', isAdminOrPreceptor, async (req, res) => {
    const { email, password, nombre, dni } = req.body;

    if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Supabase Admin Client not configured (missing Service Role Key)' });
    }

    if (!email || !password || !nombre || !dni) {
        return res.status(400).json({ error: 'Email, password, nombre and dni are required' });
    }

    try {
        // 1. Create the Auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { nombre, dni, rol: 'alumno' }
        });

        if (authError) throw authError;

        const userId = authData.user.id;

        // 2. Fetch the profile (auto-created by DB trigger)
        const { data: profileData, error: profileError } = await req.supabase
            .from('perfiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError) {
            // Rollback auth user creation if profile fetching fails (should be rare)
            await supabaseAdmin.auth.admin.deleteUser(userId);
            throw profileError;
        }

        res.status(201).json(profileData);
    } catch (err) {
        console.error('Registration error:', err);
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/students/:id (Admin)
router.put('/:id', isAdminOrPreceptor, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, dni, email } = req.body;
        const { data, error } = await req.supabase
            .from('perfiles')
            .update({ nombre, dni, email })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/students/:id (Admin)
router.delete('/:id', isAdminOrPreceptor, async (req, res) => {
    try {
        const { id } = req.params;

        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'Admin client not configured. Cannot delete Auth user.' });
        }

        // Fetch student profile before deletion for audit log
        const { data: oldProfile } = await supabaseAdmin
            .from('perfiles')
            .select('*')
            .eq('id', id)
            .single();

        // 1. Delete all related records first (to avoid foreign key constraint errors)

        // Delete attendance records (asistencias)
        const { error: attError1 } = await supabaseAdmin
            .from('asistencias')
            .delete()
            .eq('estudiante_id', id);

        if (attError1) console.warn('Could not delete asistencias:', attError1.message);

        // Delete preceptor attendance records (asistencias_preceptor)
        const { error: attError2 } = await supabaseAdmin
            .from('asistencias_preceptor')
            .delete()
            .eq('estudiante_id', id);

        if (attError2) console.warn('Could not delete asistencias_preceptor:', attError2.message);

        // Get all grade IDs for this student and delete audit logs
        const { data: studentGrades } = await supabaseAdmin
            .from('calificaciones')
            .select('id')
            .eq('alumno_id', id);

        if (studentGrades && studentGrades.length > 0) {
            const gradeIds = studentGrades.map(g => g.id);
            const { error: auditError } = await supabaseAdmin
                .from('auditoria_notas')
                .delete()
                .in('calificacion_id', gradeIds);

            if (auditError) console.warn('Could not delete auditoria_notas:', auditError.message);
        }

        // Delete grades (calificaciones)
        const { error: gradeError } = await supabaseAdmin
            .from('calificaciones')
            .delete()
            .eq('alumno_id', id);

        if (gradeError) console.warn('Could not delete calificaciones:', gradeError.message);

        // Delete tutor relationships (tutores_alumnos)
        const { error: tutorError } = await supabaseAdmin
            .from('tutores_alumnos')
            .delete()
            .eq('alumno_id', id);

        if (tutorError) console.warn('Could not delete tutores_alumnos:', tutorError.message);

        // 2. Try to delete from Auth (may fail if user doesn't have Auth account)
        try {
            const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

            // Only throw if it's not a "user not found" error
            if (authError && !authError.message.includes('not found') && authError.code !== 'user_not_found') {
                console.error('Auth deletion error:', authError);
                throw authError;
            }
        } catch (authErr) {
            // Log but continue - the profile deletion will clean up
            console.warn(`Could not delete Auth user ${id}:`, authErr.message);
        }

        // 3. Delete from profiles table
        const { error: profileError } = await req.supabase
            .from('perfiles')
            .delete()
            .eq('id', id);

        if (profileError) {
            console.error('Profile deletion error:', profileError);
            throw profileError;
        }

        // Log Audit
        const { logAudit } = require('../utils/auditLogger');
        await logAudit(
            req.user.id,
            'perfil',
            id,
            'DELETE',
            oldProfile,
            null
        );

        res.json({ message: 'Student and all related records deleted successfully' });
    } catch (err) {
        console.error('Delete student error:', err);
        res.status(400).json({ error: err.message });
    }
});


// AI Integration for Bulk Registration
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * POST /api/students/bulk-ai
 * Parses raw text using Gemini and registers multiple students.
 */
router.post('/bulk-ai', isAdminOrPreceptor, async (req, res) => {
    const { rawText } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY no detectada en el servidor. Asegúrate de añadirla en server/.env y reiniciar el servidor.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey); // Standard init, default usually v1beta or handles exp

    if (!rawText || rawText.trim().length === 0) {
        return res.status(400).json({ error: 'Raw text is required' });
    }

    try {
        console.log('Iniciando procesamiento con Gemini (gemini-3-flash-preview)...');
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
        const prompt = `Extrae una lista de estudiantes del siguiente texto desordenado. 
        Para cada estudiante necesito: NOMBRE completo, DNI (solo números) y EMAIL.
        Devuelve SOLO un array JSON con el formato: [{"nombre": "...", "dni": "...", "email": "..."}]
        Si falta algún dato inventa uno coherente (ej: si falta el email, genera uno basado en el nombre).
        Si no hay estudiantes en el texto, devuelve un array vacío [].
        Texto: ${rawText}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean markdown backticks if any
        const jsonString = text.replace(/```json|```/g, '').trim();
        const extractedStudents = JSON.parse(jsonString);

        if (!Array.isArray(extractedStudents) || extractedStudents.length === 0) {
            return res.status(400).json({ error: 'No se pudieron extraer estudiantes del texto.' });
        }

        const results = {
            success: [],
            errors: []
        };

        // Process each student
        // Using a temporary password of "Escuela123" for bulk imports
        const defaultPassword = "Escuela123";

        for (const student of extractedStudents) {
            try {
                // 1. Create Auth User
                const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                    email: student.email,
                    password: defaultPassword,
                    email_confirm: true,
                    user_metadata: {
                        nombre: student.nombre,
                        dni: student.dni,
                        rol: 'alumno'
                    }
                });

                if (authError) throw authError;

                const userId = authData.user.id;

                // 2. Fetch Profile (Triggered automatically)
                const { data: profile, error: profileError } = await req.supabase
                    .from('perfiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (profileError) throw profileError;

                results.success.push(profile);
            } catch (err) {
                results.errors.push({
                    student: student.nombre || student.email,
                    error: err.message
                });
            }
        }

        res.json(results);
    } catch (err) {
        console.error('Bulk AI Error:', err);
        res.status(500).json({ error: 'Error procesando el texto con IA: ' + err.message });
    }
});

/**
 * POST /api/students/import
 * Imports students from a CSV file.
 * Expected columns: dni, nombre, email
 */
router.post('/import', isAdminOrPreceptor, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    try {
        const students = await parseCSV(req.file.path);

        if (!students || students.length === 0) {
            return res.status(400).json({ error: 'CSV file is empty or invalid' });
        }

        const results = {
            success: [],
            errors: []
        };

        const defaultPassword = "Escuela123";

        for (const student of students) {
            // Verify required fields (case insensitive logic or strict key matching?)
            // Assuming strict keys: dni, nombre, email
            if (!student.dni || !student.nombre || !student.email) {
                results.errors.push({ student: student, error: 'Missing required fields (dni, nombre, email)' });
                continue;
            }

            try {
                // 1. Create Auth User
                const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                    email: student.email,
                    password: defaultPassword,
                    email_confirm: true,
                    user_metadata: {
                        nombre: student.nombre,
                        dni: student.dni,
                        rol: 'alumno'
                    }
                });

                if (authError) throw authError;

                const userId = authData.user.id;

                // 2. Fetch Profile
                const { data: profile, error: profileError } = await req.supabase
                    .from('perfiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (profileError) throw profileError;

                results.success.push(profile);
            } catch (err) {
                results.errors.push({
                    student: student.nombre,
                    error: err.message
                });
            }
        }

        res.json(results);

    } catch (err) {
        console.error('CSV Import Error:', err);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

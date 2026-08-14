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

// PUT /api/students/:id/password (Admin)
router.put('/:id/password', isAdminOrPreceptor, async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;

    if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Admin client not configured (missing Service Role Key).' });
    }

    if (!password || password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    try {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { password });
        if (error) throw error;
        res.json({ message: 'Contraseña actualizada correctamente.' });
    } catch (err) {
        console.error('Password update error:', err);
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/students/:id (Admin)
router.delete('/:id', isAdminOrPreceptor, async (req, res) => {
    try {
        const { id } = req.params;
        const clientToUse = supabaseAdmin || req.supabase;

        // Fetch student profile before deletion for audit log
        const { data: oldProfile } = await clientToUse
            .from('perfiles')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        // 1. Delete all related records in cascade
        const { cleanUserReferences } = require('../utils/userCleanup');
        await cleanUserReferences(clientToUse, id);

        // 2. Try to delete from Auth (may fail gracefully if not in Auth)
        if (supabaseAdmin) {
            try {
                const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
                if (authError && !authError.message.includes('not found') && authError.code !== 'user_not_found') {
                    console.warn(`Could not delete Auth user ${id}:`, authError.message);
                }
            } catch (authErr) {
                console.warn(`Auth delete exception for ${id}:`, authErr.message);
            }
        }

        // 3. Delete from profiles table
        const { error: profileError } = await clientToUse
            .from('perfiles')
            .delete()
            .eq('id', id);

        if (profileError) {
            console.error('Profile deletion error:', profileError);
            throw profileError;
        }

        // Log Audit
        try {
            const { logAudit } = require('../utils/auditLogger');
            await logAudit(
                req.user.id,
                'perfil',
                id,
                'DELETE',
                oldProfile,
                null
            );
        } catch (auditErr) {
            console.warn('Warning logging audit:', auditErr);
        }

        res.json({ message: 'Alumno y todos sus registros eliminados correctamente' });
    } catch (err) {
        console.error('Delete student error:', err);
        res.status(400).json({ error: err.message || 'Error al eliminar alumno' });
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
        console.log('Iniciando procesamiento con Gemini AI...');
        let result;
        const modelsToTry = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-2.5-flash-lite"];
        let lastError = null;

        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const prompt = `Extrae una lista de estudiantes del siguiente texto desordenado. 
                Para cada estudiante necesito: NOMBRE completo, DNI (solo números) y EMAIL.
                Devuelve SOLO un array JSON con el formato: [{"nombre": "...", "dni": "...", "email": "..."}]
                Si falta algún dato inventa uno coherente (ej: si falta el email, genera uno basado en el nombre).
                Si no hay estudiantes en el texto, devuelve un array vacío [].
                Texto: ${rawText}`;

                result = await model.generateContent(prompt);
                if (result) break;
            } catch (mErr) {
                console.warn(`Model ${modelName} error, trying next fallback:`, mErr.message);
                lastError = mErr;
            }
        }

        if (!result) throw lastError || new Error("No se pudo obtener respuesta de Gemini API");

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

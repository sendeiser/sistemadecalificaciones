const path = require('path');
const fs = require('fs');
const serverDir = path.join(__dirname, '..', 'server');
require(path.join(serverDir, 'node_modules', 'dotenv')).config({ path: path.join(serverDir, '.env') });
const { createClient } = require(path.join(serverDir, 'node_modules', '@supabase', 'supabase-js'));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testBulkImport() {
    try {
        console.log('Logging in as admin...');
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: 'admin@cgb.edu.ar',
            password: 'admin123'
        });

        if (authError) throw authError;

        const token = authData.session.access_token;
        console.log('Login successful, token obtained.');

        // Create a temp CSV file
        const csvPath = path.join(__dirname, 'test_students.csv');
        const csvContent = 'dni,nombre,email\n99999999,Alumno Importacion Test,alumno_import_test@cgb.edu.ar\n';
        fs.writeFileSync(csvPath, csvContent);
        console.log('Temporary CSV file created.');

        // Build multipart/form-data payload
        const formData = new FormData();
        const fileContent = fs.readFileSync(csvPath);
        const fileBlob = new Blob([fileContent], { type: 'text/csv' });
        formData.append('file', fileBlob, 'test_students.csv');

        console.log('Sending upload request...');
        const response = await fetch('http://localhost:5000/api/students/import', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        console.log('Status:', response.status);
        const result = await response.json();
        console.log('Result:', JSON.stringify(result, null, 2));

        // Clean up locally
        if (fs.existsSync(csvPath)) fs.unlinkSync(csvPath);

        if (!response.ok) {
            throw new Error(result.error || 'Server returned error status');
        }

        if (result.success && result.success.length > 0) {
            const importedStudent = result.success[0];
            console.log('Import successful! Imported student profile ID:', importedStudent.id);

            // Clean up the imported user from Supabase using supabaseAdmin
            const { supabaseAdmin } = require(path.join(serverDir, 'config', 'supabaseClient'));
            if (supabaseAdmin) {
                console.log('Cleaning up imported student from database...');
                // Delete user from Auth (also cascade deletes trigger if configured, but let's delete profile manually just in case)
                await supabaseAdmin.from('perfiles').delete().eq('id', importedStudent.id);
                const { error: authDelError } = await supabaseAdmin.auth.admin.deleteUser(importedStudent.id);
                if (authDelError) {
                    console.error('Error deleting Auth user during cleanup:', authDelError.message);
                } else {
                    console.log('Cleanup successful. DB is clean.');
                }
            }
        } else {
            console.warn('Import completed but no student was successfully imported.');
            if (result.errors && result.errors.length > 0) {
                console.error('Import errors:', result.errors);
            }
        }

    } catch (err) {
        console.error('Test failed:', err.message);
    }
}

testBulkImport();

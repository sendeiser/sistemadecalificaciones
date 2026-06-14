const path = require('path');
const serverDir = path.join(__dirname, '..', 'server');
require(path.join(serverDir, 'node_modules', 'dotenv')).config({ path: path.join(serverDir, '.env') });

console.log('Available keys in process.env:');
for (const key of Object.keys(process.env)) {
    if (key.includes('SUPABASE') || key.includes('DB') || key.includes('DATABASE') || key.includes('PORT') || key.includes('URL')) {
        console.log(`- ${key}: ${process.env[key] ? 'Exists (length ' + process.env[key].length + ')' : 'Empty'}`);
    }
}

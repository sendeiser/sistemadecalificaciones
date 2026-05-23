const { supabaseAdmin } = require('../server/config/supabaseClient');

async function main() {
    try {
        console.log("Checking if system_settings table exists...");
        const { data, error } = await supabaseAdmin
            .from('system_settings')
            .select('*')
            .limit(1);
        if (error) {
            console.error("Error or table does not exist:", error);
        } else {
            console.log("Table system_settings exists, data:", data);
        }
    } catch (e) {
        console.error("Exception:", e);
    }
}
main();

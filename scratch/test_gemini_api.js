const path = require('path');
const serverDir = path.join(__dirname, '..', 'server');
require(path.join(serverDir, 'node_modules', 'dotenv')).config({ path: path.join(serverDir, '.env') });
const apiKey = process.env.GEMINI_API_KEY;

async function run() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{ parts: [{ text: "Hello" }] }]
        })
    });
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text);
}

run().catch(console.error);

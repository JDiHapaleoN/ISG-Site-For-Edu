const fs = require('fs');
const path = require('path');

async function listModels() {
    let apiKey = '';
    try {
        const envPath = path.join(__dirname, '..', '.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/OPENAI_API_KEY=["']?([^"'\s]+)["']?/);
        if (match) {
            apiKey = match[1];
        }
    } catch (e) {
        console.error("Could not read .env file", e);
        return;
    }

    if (!apiKey) {
        console.error("API Key not found in .env");
        return;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();

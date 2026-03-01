async function testTranslate() {
    const payload = {
        word: "society",
        context: "Many things change our society.",
        module: "english"
    };

    console.log("Sending request to http://localhost:3000/api/translate...");
    try {
        const start = Date.now();
        const res = await fetch("http://localhost:3000/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const duration = Date.now() - start;
        console.log(`Response status: ${res.status} (took ${duration}ms)`);

        const text = await res.text();
        console.log("Response body:", text);

        try {
            JSON.parse(text);
            console.log("JSON is valid!");
        } catch (e) {
            console.error("JSON parsing failed:", e.message);
        }
    } catch (error) {
        console.error("Fetch failed:", error.message);
    }
}

testTranslate();

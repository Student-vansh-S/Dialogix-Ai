import "dotenv/config";

const getOpenAIAPIResponse = async(message)=>{
    try {
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const options = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: message, 
                            },
                        ],
                    },
                ],
            }),
        };

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            options
        );

        const data = await response.json();
        // console.log(data.candidates[0].content.parts[0].text); 
        return data.candidates[0].content.parts[0].text; //reply
    } catch (e) {
        console.error("Error:", e);
        res.status(500).json({ error: "Something went wrong" });
    }
}

export default getOpenAIAPIResponse;
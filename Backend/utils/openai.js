import "dotenv/config";

const getOpenAIAPIResponse = async (message) => {
  try {
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "user", content: message }
          ],
        }),
      }
    );

    const data = await response.json();

    console.log("🔵 OpenAI RAW RESPONSE:", data);

    if (!data?.choices?.[0]?.message?.content) {
      console.error("❌ Invalid OpenAI response");
      return null;
    }

    return data.choices[0].message.content;

  } catch (error) {
    console.error("❌ OpenAI error:", error);
    return null;
  }
};

export default getOpenAIAPIResponse;

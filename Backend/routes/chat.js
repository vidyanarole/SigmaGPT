import express from "express";
import Thread from "../models/Thread.js";
import getOpenAIAPIResponse from "../utils/openai.js";

const router = express.Router();

//test
router.post("/test", async(req, res) => {
    try {
        const thread = new Thread({
            threadId: "abc",
            title: "Testing New Thread2"
        });

        const response = await thread.save();
        res.send(response);
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to save in DB"});
    }
});

//Get all threads
router.get("/thread", async(req, res) => {
    try {
        const threads = await Thread.find({}).sort({updatedAt: -1});
        //descending order of updatedAt...most recent data on top
        res.json(threads);
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to fetch threads"});
    }
});

router.get("/thread/:threadId", async(req, res) => {
    const {threadId} = req.params;

    try {
        const thread = await Thread.findOne({threadId});

        if(!thread) {
            return res.status(404).json({error: "Thread not found"});
        }

        return res.json(thread.messages);
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to fetch chat"});
    }
});

router.delete("/thread/:threadId", async (req, res) => {
    const {threadId} = req.params;

    try {
        const deletedThread = await Thread.findOneAndDelete({threadId});

        if(!deletedThread) {
            return res.status(404).json({error: "Thread not found"});
        }

        return res.status(200).json({success : "Thread deleted successfully"});

    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to delete thread"});
    }
});

router.post("/chat", async(req, res) => {
    const {threadId, message} = req.body;
  
    if (!threadId || typeof threadId !== "string" || !message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({ error: "threadId and non-empty message are required" });
    }

    const trimmedMessage = message.trim();

    try {
        let thread = await Thread.findOne({threadId});

        if (!thread) {
            // Create a new thread in DB with the user's initial message
            thread = new Thread({
                threadId,
                title: trimmedMessage.length > 50 ? `${trimmedMessage.substring(0, 47)}...` : trimmedMessage,
                messages: [{role: "user", content: trimmedMessage}]
            });
        } else {
            thread.messages.push({role: "user", content: trimmedMessage});
            thread.updatedAt = new Date();
        }

        // Persist the user message first so it is not lost if the AI call fails
        await thread.save();

        // Pass full thread messages for multi-turn conversation context
        const aiResult = await getOpenAIAPIResponse(thread.messages);

        if (!aiResult || !aiResult.success) {
            return res.status(aiResult?.status || 502).json({
                error: aiResult?.error || "AI failed to generate response. Please check your API key or network connection."
            });
        }

        const assistantReply = aiResult.content;

        thread.messages.push({
            role: "assistant",
            content: assistantReply
        });
        thread.updatedAt = new Date();
        await thread.save();

        return res.json({reply: assistantReply});
    } catch(err) {
        console.error("Chat route error:", err.message || err);
        return res.status(500).json({error: "Something went wrong processing your request"});
    }
});




export default router;
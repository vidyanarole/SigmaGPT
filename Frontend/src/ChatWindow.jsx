import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState } from "react";
import {ScaleLoader} from "react-spinners";
import { API_BASE_URL } from "./api.js";

function ChatWindow() {
    const {prompt, setPrompt, setReply, currThreadId, setPrevChats, newChat, setNewChat, triggerSidebarRefresh} = useContext(MyContext);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState(null);

    const getReply = async () => {
        const userMessage = prompt.trim();
        if (!userMessage || loading) return;

        setError(null);
        setPrompt("");
        const isFirstMessage = newChat;
        if (newChat) setNewChat(false);

        // Optimistically add user's message to chat window immediately
        setPrevChats(prev => [...prev, { role: "user", content: userMessage }]);
        setLoading(true);

        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: userMessage,
                threadId: currThreadId
            })
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/chat`, options);
            const res = await response.json();

            if (isFirstMessage && triggerSidebarRefresh) {
                triggerSidebarRefresh();
            }

            if (!response.ok || res.error) {
                setError(res.error || "Failed to generate AI response.");
            } else if (res.reply) {
                setReply(res.reply);
                setPrevChats(prev => [...prev, { role: "assistant", content: res.reply }]);
            }
        } catch(err) {
            console.error("Chat request failed:", err);
            setError("Network error: Could not reach the server.");
        } finally {
            setLoading(false);
        }
    };

    const handleProfileClick = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="chatWindow">
            <div className="navbar">
                <span>SigmaGPT <i className="fa-solid fa-chevron-down"></i></span>
                <div className="userIconDiv" onClick={handleProfileClick}>
                    <span className="userIcon"><i className="fa-solid fa-user"></i></span>
                </div>
            </div>
            {
                isOpen && 
                <div className="dropDown">
                    <div className="dropDownItem"><i className="fa-solid fa-gear"></i> Settings</div>
                    <div className="dropDownItem"><i className="fa-solid fa-cloud-arrow-up"></i> Upgrade plan</div>
                    <div className="dropDownItem"><i className="fa-solid fa-arrow-right-from-bracket"></i> Log out</div>
                </div>
            }
            <Chat></Chat>

            {error && (
                <div style={{ color: "#f87171", fontSize: "0.85rem", padding: "0.5rem 1rem", backgroundColor: "rgba(248, 113, 113, 0.1)", borderRadius: "8px", maxWidth: "600px", margin: "0.5rem auto" }}>
                    <i className="fa-solid fa-circle-exclamation" style={{ marginRight: "6px" }}></i>
                    {error}
                </div>
            )}

            <ScaleLoader color="#fff" loading={loading} />
            
            <div className="chatInput">
                <div className="inputBox">
                    <input 
                        placeholder={loading ? "Waiting for response..." : "Ask anything"}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !loading) {
                                e.preventDefault();
                                getReply();
                            }
                        }}
                        disabled={loading}
                    />
                    <div 
                        id="submit" 
                        onClick={loading || !prompt.trim() ? undefined : getReply}
                        style={{
                            opacity: loading || !prompt.trim() ? 0.4 : 1,
                            cursor: loading || !prompt.trim() ? "not-allowed" : "pointer"
                        }}
                    >
                        <i className="fa-solid fa-paper-plane"></i>
                    </div>
                </div>
                <p className="info">
                    SigmaGPT can make mistakes. Check important info. See Cookie Preferences.
                </p>
            </div>
        </div>
    );
}

export default ChatWindow;
import "./Chat.css";
import React, { useContext, useState, useEffect, useRef } from "react";
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

function Chat() {
    const {newChat, prevChats, reply} = useContext(MyContext);
    const [latestReply, setLatestReply] = useState(null);
    const bottomRef = useRef(null);

    // Typing effect for the latest assistant reply
    useEffect(() => {
        if (!reply) {
            setLatestReply(null);
            return;
        }

        const words = reply.split(" ");
        let idx = 0;
        const interval = setInterval(() => {
            idx++;
            setLatestReply(words.slice(0, idx).join(" "));
            if (idx >= words.length) {
                clearInterval(interval);
            }
        }, 30);

        return () => clearInterval(interval);
    }, [reply]);

    // Auto-scroll to the bottom whenever chats or typing content update
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [prevChats, latestReply]);

    return (
        <>
            {newChat && <h1>Start a New Chat!</h1>}
            <div className="chats">
                {
                    prevChats?.map((chat, idx) => {
                        const isLast = idx === prevChats.length - 1;

                        if (chat.role === "user") {
                            return (
                                <div className="userDiv" key={idx}>
                                    <p className="userMessage">{chat.content}</p>
                                </div>
                            );
                        }

                        // Assistant message
                        const textToDisplay = (isLast && latestReply !== null) ? latestReply : chat.content;
                        return (
                            <div className="gptDiv" key={idx}>
                                <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                                    {textToDisplay}
                                </ReactMarkdown>
                            </div>
                        );
                    })
                }
                <div ref={bottomRef} />
            </div>
        </>
    );
}

export default Chat;
import "./Sidebar.css";
import { useContext, useEffect, useCallback } from "react";
import { MyContext } from "./MyContext.jsx";
import {v1 as uuidv1} from "uuid";
import blackLogo from "./assets/blacklogo.png";
import { API_BASE_URL } from "./api.js";

function Sidebar() {
    const {allThreads, setAllThreads, currThreadId, setNewChat, setPrompt, setReply, setCurrThreadId, setPrevChats, threadsTrigger} = useContext(MyContext);

    const getAllThreads = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/thread`);
            const res = await response.json();
            if (Array.isArray(res)) {
                const filteredData = res.map(thread => ({threadId: thread.threadId, title: thread.title}));
                setAllThreads(filteredData);
            }
        } catch(err) {
            console.error("Failed to fetch threads:", err);
        }
    }, [setAllThreads]);

    useEffect(() => {
        getAllThreads();
    }, [currThreadId, threadsTrigger, getAllThreads]);

    const createNewChat = () => {
        setNewChat(true);
        setPrompt("");
        setReply(null);
        setCurrThreadId(uuidv1());
        setPrevChats([]);
    }

    const changeThread = async (newThreadId) => {
        setCurrThreadId(newThreadId);

        try {
            const response = await fetch(`${API_BASE_URL}/api/thread/${newThreadId}`);
            const res = await response.json();
            if (Array.isArray(res)) {
                setPrevChats(res);
            } else {
                setPrevChats([]);
            }
            setNewChat(false);
            setReply(null);
        } catch(err) {
            console.error("Failed to fetch thread chats:", err);
        }
    }   

    const deleteThread = async (threadId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/thread/${threadId}`, {method: "DELETE"});
            await response.json();

            //updated threads re-render
            setAllThreads(prev => prev.filter(thread => thread.threadId !== threadId));

            if(threadId === currThreadId) {
                createNewChat();
            }

        } catch(err) {
            console.error("Failed to delete thread:", err);
        }
    }

    return (
        <section className="sidebar">
            <button onClick={createNewChat}>
                <img src={blackLogo} alt="gpt logo" className="logo" />
                <span><i className="fa-solid fa-pen-to-square"></i></span>
            </button>


            <ul className="history">
                {
                    allThreads?.map((thread, idx) => (
                        <li key={idx} 
                            onClick={() => changeThread(thread.threadId)}
                            className={thread.threadId === currThreadId ? "highlighted": " "}
                        >
                            {thread.title}
                            <i className="fa-solid fa-trash"
                                onClick={(e) => {
                                    e.stopPropagation(); //stop event bubbling
                                    deleteThread(thread.threadId);
                                }}
                            ></i>
                        </li>
                    ))
                }
            </ul>
 
            <div className="sign">
                <p>By ApnaCollege &hearts;</p>
            </div>
        </section>
    )
}

export default Sidebar;
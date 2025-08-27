import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { Mycontext } from "./Mycontext.jsx";
import { useContext,useState,useEffect } from "react";
import {ScaleLoader} from "react-spinners";
function ChatWindow(){
    const {prompt,setPrompt,reply,setReply,currThreadId,setCurrThreadId,prevChats,setPrevChats,setNewChat}=useContext(Mycontext);
    const [loading,setLoading]=useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL;

    const getReply=async()=>{
        setLoading(true);
        setNewChat(false);
        console.log("Message",prompt,"ThreadId",currThreadId);
        const options={
            method:"POST",
            headers: { "Content-Type": "application/json" },
            body:JSON.stringify({
                message:prompt,
                threadId:currThreadId
            }),
        };
        try{
            const response = await fetch(`${API_URL}/api/chat`,options);
            const res=await response.json();
            console.log(res)
            setReply(res.reply);
        }catch(err){
            console.log(err);
        }
        setLoading(false);
    }

    //Append new chat to previous chats
    useEffect(()=>{
        if(prompt && reply){
            setPrevChats(prevChats=>(
                [...prevChats,{
                    role:"user",
                    content:prompt
                },{
                    role:"assistant",
                    content:reply
                }]
            ));
        }
        setPrompt("");
    },[reply]);

    const handleProfileClick = () => {
        setIsOpen(!isOpen);
    }

    return(
        <>
            <div className="chatWindow">
                <div className="navbar">
                    <span>Dialogix Ai <i className="fa-solid fa-caret-down"></i></span>
                    <div className="userIconDiv" onClick={handleProfileClick}>
                        <span className="userIcon"><i className="fa-solid fa-user"></i></span>
                    </div>
                </div>
                {
                    isOpen && 
                    <div className="dropDown">
                        <div className="dropDownItem"><i class="fa-solid fa-gear"></i> Settings</div>
                        <div className="dropDownItem"><i class="fa-solid fa-cloud-arrow-up"></i> Upgrade plan</div>
                        <div className="dropDownItem"><i class="fa-solid fa-arrow-right-from-bracket"></i> Log out</div>
                    </div>
                }
                <Chat/>
                <div className="assistantTyping">
                    <ScaleLoader color="#fff" loading={loading} size={60} />
                </div>

                <div className="chatInput">
                    <div className="inputBox">
                        <input placeholder="Ask anything" value={prompt} onChange={(e)=>setPrompt(e.target.value)} onKeyDown={(e)=>e.key==='Enter'?getReply():''} />

                        <div id="submit" onClick={getReply}><i className="fa-solid fa-paper-plane"></i></div>
                    </div>
                    <p className="info">Dailogix Ai can make mistakes.Check important info. See Cookie Preferences.</p>
                </div>
            </div>
        </>
    )
}

export default ChatWindow;
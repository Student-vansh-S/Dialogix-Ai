import "./Sidebar.css";
import { useContext,useEffect } from "react";
import { Mycontext } from "./Mycontext";
import {v1 as uuidv1} from "uuid"; 

function Sidebar(){
    const {allThreads,setAllThreads,currThreadId,setNewChat,setPrompt,setReply,setCurrThreadId,setPrevChats}=useContext(Mycontext);

    const getAllThreads = async ()=>{
        try{
            const response = await fetch("http://localhost:8080/api/thread");
            const res = await response.json();
            const filteredData = res.map(thread=>({threadId:thread.threadId,title:thread.title}));
            // console.log(filteredData);
            setAllThreads(filteredData);
        }catch(err){
            console.log(err);
        }
    };

    useEffect(()=>{
        getAllThreads();
    },[currThreadId]);

    const createNewChat=()=>{
        setNewChat(true);
        setPrompt("");
        setReply(null);
        setCurrThreadId(uuidv1());
        setPrevChats([]);
    }

    const changeThread= async(newThreadId)=>{
        setCurrThreadId(newThreadId);

        try{
            const response= await fetch(`http://localhost:8080/api/thread/${newThreadId}`);
            const res = await response.json();
            console.log(res);
            setPrevChats(res);
            setNewChat(false);
            setReply(null);
        }catch(err){
            console.log(err);
        }
    }

    const deleteThread= async(threadId)=>{
        try{
            const response = await fetch(`http://localhost:8080/api/thread/${threadId}`,{method:"DELETE"});
            const res = await response.json();
            console.log(res);

            //update threads re-render
            setAllThreads(prev => prev.filter(thread => thread.threadId !==threadId));

            if(threadId === currThreadId){
                createNewChat();
            }
        }catch(err){
            console.log(err);
        }
    }
    return(
        <>
            <section className="sidebar">
                {/* new chat button */}
                <button onClick={createNewChat}>
                    <img src="src/assets/blacklogo.png" alt="logo" className="logo"/>
                    <span><i className="fa-solid fa-pen-to-square"></i></span>
                </button>


                {/* history */}
                <ul className="history">
                    {
                        allThreads?.map((thread,idx)=>(
                            <li key={idx} onClick={(e)=>changeThread(thread.threadId)} className={thread.threadId===currThreadId?"highlighted":""}>{thread.title}<i className="fa-solid fa-trash" onClick={(e)=>{
                                e.stopPropagation(); //stop event bubbling(only child component will trigger)
                                deleteThread(thread.threadId);
                            }}></i></li>
                        ))
                    }
                </ul>

                {/* sign */}
                <div className="sign">
                    By Vansh &hearts;
                </div>

            </section>
        </>
    )
}

export default Sidebar;
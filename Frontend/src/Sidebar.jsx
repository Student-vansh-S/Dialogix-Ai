import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mycontext } from "./Mycontext";
import { v1 as uuidv1 } from "uuid";

const API_URL = import.meta.env.VITE_API_URL;

function Sidebar() {
  const {
    allThreads, setAllThreads,
    currThreadId, setCurrThreadId,
    setNewChat, setPrompt, setReply,
    setPrevChats, sidebarOpen, setSidebarOpen,
    fetchThreadsTrigger,
  } = useContext(Mycontext);

  const [loadingThreads, setLoadingThreads] = useState(false);
  const navigate = useNavigate();

  const getAllThreads = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      setLoadingThreads(true);
      const response = await fetch(`${API_URL}/api/thread`, {
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      const res = await response.json();
      if (!Array.isArray(res)) return;

      const filteredData = res.map((thread) => ({
        threadId: thread.threadId,
        title: thread.title,
      }));
      setAllThreads(filteredData);
    } catch (err) {
      console.error("Failed to fetch threads:", err);
    } finally {
      setLoadingThreads(false);
    }
  };

  useEffect(() => {
    getAllThreads();
  }, [currThreadId, fetchThreadsTrigger]);

  const createNewChat = () => {
    setNewChat(true);
    setPrompt("");
    setReply(null);
    setCurrThreadId(uuidv1());
    setPrevChats([]);
    setSidebarOpen(false);
  };

  const changeThread = async (newThreadId) => {
    setCurrThreadId(newThreadId);
    setSidebarOpen(false);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/thread/${newThreadId}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      const res = await response.json();
      if (Array.isArray(res)) {
        setPrevChats(res);
        setNewChat(false);
        setReply(null);
      }
    } catch (err) {
      console.error("Failed to load thread:", err);
    }
  };

  const deleteThread = async (threadId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/thread/${threadId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.ok) {
        setAllThreads((prev) => prev.filter((t) => t.threadId !== threadId));
        if (threadId === currThreadId) createNewChat();
      }
    } catch (err) {
      console.error("Failed to delete thread:", err);
    }
  };

  return (
    <section className={`
      fixed inset-y-0 left-0 z-[100] w-[280px] transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
      ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      bg-white/5 backdrop-blur-2xl border-r border-white/10 flex flex-col p-4
    `}>
      {/* New chat button */}
      <button
        onClick={createNewChat}
        className="flex items-center justify-between w-full p-3 mb-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-neon-blue/50 transition-all duration-300 group shadow-lg"
      >
        <span className="flex items-center gap-2 font-medium text-sm text-slate-300 group-hover:text-white transition-colors">
          <i className="fa-solid fa-plus text-neon-blue"></i> New Chat
        </span>
        <i className="fa-solid fa-pen-to-square text-slate-500 group-hover:text-neon-blue transition-colors"></i>
      </button>

      {/* Chat history */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
        {loadingThreads && allThreads.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-500 text-xs uppercase tracking-widest">Loading...</p>
          </div>
        )}
        {!loadingThreads && allThreads.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-600 text-xs">No conversations yet</p>
          </div>
        )}
        {allThreads?.map((thread) => (
          <div
            key={thread.threadId}
            onClick={() => changeThread(thread.threadId)}
            className={`
              group relative flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200
              ${thread.threadId === currThreadId
                ? "bg-white/10 text-white border-l-2 border-neon-blue pl-4"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}
            `}
          >
            <span className="text-sm truncate pr-6">{thread.title}</span>
            <i
              className="fa-solid fa-trash absolute right-3 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all duration-200 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                deleteThread(thread.threadId);
              }}
            ></i>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-white/5 text-center">
        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
          Dialogix Premium
        </div>
      </div>
    </section>
  );
}

export default Sidebar;
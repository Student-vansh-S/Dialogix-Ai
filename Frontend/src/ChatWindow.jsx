import Chat from "./Chat.jsx";
import { Mycontext } from "./Mycontext.jsx";
import { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ScaleLoader } from "react-spinners";

function ChatWindow() {
  const {
    prompt, setPrompt,
    reply, setReply,
    currThreadId,
    prevChats, setPrevChats,
    setNewChat, setSidebarOpen,
    setFetchThreadsTrigger,
    isTyping, setStopRequested,
  } = useContext(Mycontext);

  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);

  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStopRequested(true);
    setLoading(false);
  };

  const getReply = async () => {
    if (!prompt.trim() || loading || isTyping) return;

    setLoading(true);
    setNewChat(false);
    setError(null);

    const token = localStorage.getItem("token");
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const options = {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: prompt,
        threadId: currThreadId,
      }),
    };

    try {
      const response = await fetch(`${API_URL}/api/chat`, options);
      const res = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(res.error || "Server error");
      }

      const isFirstMessage = prevChats.length === 0;
      setReply(res.reply);

      if (isFirstMessage) {
        setFetchThreadsTrigger(prev => prev + 1);
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Request aborted by user.");
      } else {
        console.error("Chat error:", err);
        setError("Failed to get response. Please try again.");
      }
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (prompt && reply) {
      setPrevChats((prev) => [
        ...prev,
        { role: "user", content: prompt },
        { role: "assistant", content: reply },
      ]);
    }
    setPrompt("");
  }, [reply]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      getReply();
    }
  };

  const handleProfileClick = () => setIsOpen(!isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = () => setIsOpen(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isGenerating = loading || isTyping;

  return (
    <div className="flex-1 flex flex-col h-full relative bg-transparent overflow-hidden">
      {/* ===== Navbar ===== */}
      <div className="h-16 flex items-center justify-between px-6 bg-white/[0.02] backdrop-blur-md border-b border-white/5 z-[80]">
        <div className="flex items-center gap-4">
          <button
            className="lg:hidden text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
            onClick={() => setSidebarOpen(true)}
          >
            <i className="fa-solid fa-bars"></i>
          </button>
          <div className="flex items-center gap-2 cursor-pointer group">
            <span className="font-bold text-lg bg-gradient-to-r from-slate-200 to-slate-500 bg-clip-text text-transparent">
              Dialogix AI
            </span>
            <i className="fa-solid fa-caret-down text-[10px] text-slate-500 group-hover:text-neon-blue transition-colors"></i>
          </div>
        </div>

        <div
          className="relative group cursor-pointer"
          onClick={(e) => { e.stopPropagation(); handleProfileClick(); }}
        >
          <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:border-neon-blue/50 hover:text-white transition-all duration-300">
            <i className="fa-solid fa-user text-sm"></i>
          </div>

          {isOpen && (
            <div className="absolute top-12 right-0 w-56 p-1 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-[200] animate-fade-in" onClick={(e) => e.stopPropagation()}>
              <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-slate-500 font-bold border-b border-white/5 mb-1">Account</div>
              <button className="flex items-center gap-3 w-full p-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors">
                <i className="fa-solid fa-gear text-xs opacity-50"></i> Settings
              </button>
              <button className="flex items-center gap-3 w-full p-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors">
                <i className="fa-solid fa-cloud-arrow-up text-xs opacity-50 text-neon-blue"></i> Upgrade Plan
              </button>
              <div className="h-px bg-white/5 my-1"></div>
              <button onClick={handleLogout} className="flex items-center gap-3 w-full p-2.5 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                <i className="fa-solid fa-arrow-right-from-bracket text-xs"></i> Log out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===== Chat Messages ===== */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        <Chat />

        {/* Loading Indicator */}
        {loading && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 flex items-center gap-3 shadow-xl">
            <ScaleLoader color="#00d1ff" loading={loading} height={12} width={2} margin={2} />
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Thinking...</span>
          </div>
        )}
      </div>

      {/* ===== Error Message ===== */}
      {error && (
        <div className="max-w-2xl mx-auto w-full px-6 mb-2">
          <div className="bg-red-400/10 border border-red-400/20 text-red-400 text-xs py-2 px-4 rounded-lg text-center backdrop-blur-sm">
            {error}
          </div>
        </div>
      )}

      {/* ===== Input Area ===== */}
      <div className="w-full px-4 pb-10 pt-4 flex flex-col items-center">
        <div className="w-full max-w-[700px] relative group transition-all duration-300">
          <div className="flex items-center bg-white bg-opacity-5 backdrop-blur-xl border border-white border-opacity-10 rounded-[28px] px-5 py-2.5 shadow-[0px_0px_12px_rgba(0,209,255,0.15)] focus-within:shadow-[0px_0px_20px_rgba(0,209,255,0.3)] focus-within:border-neon-blue focus-within:border-opacity-30 transition-all duration-300 outline-none">
            <textarea
              ref={inputRef}
              rows="1"
              placeholder="Ask anything..."
              className="flex-1 bg-transparent border-none outline-none text-white py-3 pr-4 text-base focus:ring-0 focus:outline-none resize-none placeholder:text-slate-500 custom-scrollbar max-h-48"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              style={{ minHeight: '44px' }}
            />

            <div className="flex items-center justify-center shrink-0">
              {isGenerating ? (
                <button
                  onClick={stopGeneration}
                  className="w-10 h-10 flex items-center justify-center rounded-2xl bg-red-400 bg-opacity-10 text-red-400 hover:bg-opacity-20 hover:scale-105 transition-all border border-red-400 border-opacity-20"
                >
                  <i className="fa-solid fa-stop text-sm"></i>
                </button>
              ) : (
                <button
                  onClick={getReply}
                  disabled={!prompt.trim()}
                  className={`
                    w-10 h-10 flex items-center justify-center rounded-2xl transition-all active:scale-95
                    ${prompt.trim()
                      ? "bg-neon-blue text-slate-950 shadow-[0_0_12px_rgba(0,209,255,0.3)] hover:scale-105 hover:shadow-[0_0_20px_rgba(0,209,255,0.5)]"
                      : "bg-white bg-opacity-5 text-slate-500 border border-white border-opacity-5 cursor-not-allowed"}
                  `}
                >
                  <i className="fa-solid fa-paper-plane text-sm"></i>
                </button>
              )}
            </div>
          </div>
        </div>
        <p className="text-[10px] text-center mt-4 text-slate-600 font-bold uppercase tracking-widest opacity-60">
          Powered by Dialogix Intelligence
        </p>
      </div>
    </div>
  );
}

export default ChatWindow;
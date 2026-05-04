import { useContext, useState, useEffect, useRef, useCallback } from "react";
import { Mycontext } from "./Mycontext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

const NEAR_BOTTOM_THRESHOLD = 100;

function Chat() {
  const {
    newChat, prevChats, reply,
    stopRequested, setStopRequested,
    setIsTyping,
  } = useContext(Mycontext);

  const [latestReply, setLatestReply] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const chatAreaRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const prevChatsLenRef = useRef(0);
  const typingIntervalRef = useRef(null);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = chatAreaRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "instant" });
  }, []);

  const checkNearBottom = useCallback(() => {
    const el = chatAreaRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const near = distanceFromBottom <= NEAR_BOTTOM_THRESHOLD;
    isNearBottomRef.current = near;
    setShowScrollBtn(!near);
  }, []);

  useEffect(() => {
    const el = chatAreaRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkNearBottom, { passive: true });
    return () => el.removeEventListener("scroll", checkNearBottom);
  }, [checkNearBottom]);

  useEffect(() => {
    const newLen = prevChats?.length ?? 0;
    const oldLen = prevChatsLenRef.current;

    if (newLen > oldLen) {
      const lastMsg = prevChats[newLen - 1];
      if (lastMsg?.role === "user") {
        isNearBottomRef.current = true;
        setShowScrollBtn(false);
        scrollToBottom(true);
      } else if (isNearBottomRef.current) {
        scrollToBottom(false);
      }
    }

    prevChatsLenRef.current = newLen;
  }, [prevChats, scrollToBottom]);

  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom(false);
    }
  }, [latestReply, scrollToBottom]);

  useEffect(() => {
    if (reply === null) {
      setLatestReply(null);
      setIsTyping(false);
      return;
    }
    if (!prevChats?.length) return;

    const words = reply.split(" ");
    let idx = 0;

    setIsTyping(true);

    typingIntervalRef.current = setInterval(() => {
      setLatestReply(words.slice(0, idx + 1).join(" "));
      idx++;
      if (idx >= words.length) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
        setIsTyping(false);
      }
    }, 30);

    return () => {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
      setIsTyping(false);
    };
  }, [prevChats, reply]);

  useEffect(() => {
    if (!stopRequested) return;

    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    setIsTyping(false);
    setStopRequested(false);
  }, [stopRequested, setStopRequested, setIsTyping]);

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 custom-scrollbar relative scroll-smooth" ref={chatAreaRef}>
      {newChat && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
            <i className="fa-solid fa-wand-magic-sparkles text-2xl text-neon-blue"></i>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent mb-3">
            What can I help you build?
          </h1>
        </div>
      )}

      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 py-10">
        {prevChats?.slice(0, -1).map((chat, idx) => (
          <div 
            className={`flex flex-col ${chat.role === "user" ? "items-end" : "items-start"} animate-fade-in`} 
            key={idx}
          >
            <div className={`
              max-w-[85%] px-5 py-3.5 rounded-2xl text-sm leading-relaxed
              ${chat.role === "user" 
                ? "bg-white/10 text-white border border-white/10 rounded-br-none shadow-lg" 
                : "bg-white/[0.03] text-slate-300 border border-white/5 rounded-bl-none backdrop-blur-sm"}
            `}>
              {chat.role === "user" ? (
                <p className="whitespace-pre-wrap">{chat.content}</p>
              ) : (
                <div className="markdown-content">
                  <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                    {chat.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}

        {prevChats.length > 0 && (
          <div className={`flex flex-col items-start animate-fade-in`} key="latest">
            <div className="max-w-[85%] px-5 py-3.5 rounded-2xl text-sm leading-relaxed bg-white/[0.03] text-slate-300 border border-white/5 rounded-bl-none backdrop-blur-sm">
              <div className="markdown-content">
                <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                  {latestReply === null ? prevChats[prevChats.length - 1].content : latestReply}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        <div style={{ height: "1px" }} />
      </div>

      {showScrollBtn && (
        <button
          className="fixed bottom-32 right-8 w-10 h-10 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-slate-400 hover:text-white hover:border-neon-blue/50 flex items-center justify-center transition-all duration-300 shadow-2xl z-50 animate-bounce"
          onClick={() => {
            isNearBottomRef.current = true;
            setShowScrollBtn(false);
            scrollToBottom(true);
          }}
        >
          <i className="fa-solid fa-chevron-down"></i>
        </button>
      )}
    </div>
  );
}

export default Chat;
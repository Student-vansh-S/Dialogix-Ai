import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";
import { Mycontext } from './Mycontext.jsx';
import { useState, useContext, useEffect } from 'react';
import { v1 as uuidv1 } from "uuid";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login.jsx";
import Signup from "./Signup.jsx";

/**
 * Protected Route — redirects to login if no valid token exists.
 * Shows a loading screen while verifying authentication.
 */
const ProtectedRoute = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAuthenticated(false);
      setChecking(false);
      return;
    }

    // Validate token by checking profile endpoint
    const API_URL = import.meta.env.VITE_API_URL;
    fetch(`${API_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.ok) {
          setAuthenticated(true);
        } else {
          // Token is invalid/expired — clean up
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setAuthenticated(false);
        }
      })
      .catch(() => {
        // Network error — allow offline access if token exists
        setAuthenticated(true);
      })
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <i className="fa-solid fa-bolt-lightning text-neon-blue animate-pulse"></i>
          </div>
          <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">Loading Dialogix...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) return <Navigate to="/login" replace />;
  return children;
};

/**
 * Chat Layout — renders sidebar + chat window together.
 */
function ChatLayout() {
  const { sidebarOpen, setSidebarOpen } = useContext(Mycontext);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      <div
        className={`
          fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden transition-opacity duration-300
          ${sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
        onClick={() => setSidebarOpen(false)}
      />
      <Sidebar />
      <ChatWindow />
    </div>
  );
}

/**
 * App Content — provides global state context and routing.
 */
function AppContent() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);
  const [currThreadId, setCurrThreadId] = useState(uuidv1());
  const [prevChats, setPrevChats] = useState([]);
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fetchThreadsTrigger, setFetchThreadsTrigger] = useState(0);
  const [stopRequested, setStopRequested] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const providerValues = {
    prompt, setPrompt,
    reply, setReply,
    currThreadId, setCurrThreadId,
    newChat, setNewChat,
    prevChats, setPrevChats,
    allThreads, setAllThreads,
    sidebarOpen, setSidebarOpen,
    fetchThreadsTrigger, setFetchThreadsTrigger,
    stopRequested, setStopRequested,
    isTyping, setIsTyping,
  };

  return (
    <Mycontext.Provider value={providerValues}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ChatLayout />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Mycontext.Provider>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

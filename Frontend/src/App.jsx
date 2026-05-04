import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";
import { Mycontext } from './Mycontext.jsx';
import { useState, useContext } from 'react';
import { v1 as uuidv1 } from "uuid";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login.jsx";
import Signup from "./Signup.jsx";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

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

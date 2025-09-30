import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ChatBot from './ChatBot';
import type { AuthResponse, ChatSession } from './types';
import SignUp from './components/SignUp';

function App() {
  const [user, setUser] = useState<any>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const authUser = JSON.parse(localStorage.getItem('user') || 'null');

    if (token && authUser) {
      setUser(authUser);
    }

    // Initialize sessions only if none exist
    if (!sessions.length) {
      const initialSession: ChatSession = {
        id: '1',
        title: 'New Chat',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setSessions([initialSession]);
      setCurrentSessionId(initialSession.id);
    }
  }, [sessions.length]); // Added dependency to prevent unnecessary re-initialization



  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    setSessions([]);
    setCurrentSessionId(null);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Close sidebar when clicking on overlay (mobile)
  const handleOverlayClick = () => {
    setIsSidebarOpen(false);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/auth"
          element={user ? <Navigate to="/" /> : <SignUp />}
        />

        <Route
          path="/"
          element={
            user ? (
              <div className="min-h-screen h-full w-full flex flex-col bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900 dark:bg-gray-900">
                {/* Header - Mobile Optimized with User Avatar */}
                <header className="flex h-16 lg:h-20 justify-between items-center px-4 lg:p-6 bg-white/20 dark:bg-gray-800/30 backdrop-blur-xl rounded-b-3xl shadow-lg border border-white/10">
                  <div className="flex items-center gap-3 lg:gap-4">
                    {/* Mobile Menu Button */}
                    <button
                      onClick={toggleSidebar}
                      className="lg:hidden p-2 rounded-2xl bg-white/20 hover:bg-white/30 transition-colors"
                      aria-label="Toggle menu"
                    >
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>

                    <div className="w-10 h-10 lg:w-14 lg:h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl lg:rounded-3xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <span className="text-xl lg:text-3xl">🤖</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-lg lg:text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent truncate">
                        ChatBot
                      </h1>
                      <p className="text-gray-200 dark:text-gray-300 text-xs lg:text-sm mt-0.5 truncate">
                        Welcome, {user?.name}!
                      </p>
                    </div>
                  </div>

                  {/* User Info and Logout */}
                  <div className="flex items-center gap-2 lg:gap-4">
                    {/* User Avatar and Name - Hidden on mobile, visible on desktop */}
                    <div className="hidden lg:flex items-center gap-3">
                      {/* User Avatar */}
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20">
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user?.name || 'User'}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-semibold text-sm">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>

                      {/* User Name - Hidden on smaller screens */}
                      <div className="hidden xl:block">
                        <p className="text-white font-medium text-sm">{user?.name}</p>
                        <p className="text-gray-200 text-xs">{user?.email}</p>
                      </div>
                    </div>

                    {/* Mobile User Avatar - Smaller and simplified */}
                    <div className="lg:hidden w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg border border-white/20">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user?.name || 'User'}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold text-xs">
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>

                    {/* Logout Button */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-3 py-1.5 lg:px-4 lg:py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl lg:rounded-2xl hover:shadow-xl transition-all duration-300 text-sm lg:text-base whitespace-nowrap"
                    >
                      {/* Logout Icon - Visible on mobile, hidden on desktop */}
                      <svg
                        className="w-4 h-4 lg:hidden"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>

                      {/* Text - Hidden on mobile, visible on desktop */}
                      <span className="hidden lg:inline">Logout</span>
                    </button>
                  </div>
                </header>

                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                  <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={handleOverlayClick}
                  />
                )}

                {/* Main Chat Area with Sidebar */}
                <div className="flex flex-1 h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] overflow-hidden">
                  {/* Sidebar - Mobile Responsive */}
                  <aside className={`
                    fixed lg:static inset-y-0 left-0 z-50
                    w-64 lg:w-80 transform transition-transform duration-300 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl
                    border-r border-white/10
                    overflow-y-auto
                  `}>
                    <div className="p-4 lg:p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg lg:text-xl font-semibold text-white">Chat Sessions</h2>
                        <button
                          onClick={() => setIsSidebarOpen(false)}
                          className="lg:hidden p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        >
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Session List */}
                      <div className="space-y-2">
                        {sessions.map((session) => (
                          <div
                            key={session.id}
                            className={`p-3 rounded-2xl cursor-pointer transition-all duration-200 ${currentSessionId === session.id
                              ? 'bg-white/20 text-white shadow-lg'
                              : 'bg-white/5 text-gray-200 hover:bg-white/10'
                              }`}
                            onClick={() => {
                              setCurrentSessionId(session.id);
                              setIsSidebarOpen(false); // Close sidebar on mobile when session is selected
                            }}
                          >
                            <div className="font-medium truncate">{session.title}</div>
                            <div className="text-xs opacity-70 mt-1">
                              {session.messages.length} messages
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* New Chat Button */}
                      <button className="w-full mt-4 p-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-2xl hover:shadow-lg transition-all duration-300 font-medium">
                        + New Chat
                      </button>
                    </div>
                  </aside>

                  {/* Chat Content */}
                  <main className="flex-1 p-2 lg:p-4 min-w-0">
                    <div className="h-full w-full bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl overflow-hidden rounded-2xl lg:rounded-3xl shadow-inner flex flex-col">
                      {currentSessionId && (
                        <ChatBot
                          className="flex-1 overflow-y-auto"
                          user={user}
                        />
                      )}
                    </div>
                  </main>
                </div>
              </div>
            ) : (
              <Navigate to="/auth" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
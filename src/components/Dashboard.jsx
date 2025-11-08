import React, { useState, useEffect } from "react";
import {
  Plus, Search, Folder, Clock, Trash2, Edit, Copy, MoreVertical,
  Grid, List, TrendingUp, Code, Loader, Star, FileText, CheckCircle, AlertCircle, Sparkles, LogOut, User
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

// --- MOCK SERVICE (replace with Firestore in real app) ---
const projectService = {
    getUserProjects: async (userId) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
        projects: [
          {
            id: '1',
            name: 'E-commerce Platform',
            description: 'Full-stack online store with cart and payments',
            status: 'in-progress',
            createdAt: new Date('2024-01-10'),
            updatedAt: new Date('2024-01-15'),
            lastAccessedAt: new Date('2024-01-15'),
            techStack: {
              frontend: ['React', 'Tailwind CSS'],
              backend: ['Node.js', 'Express'],
              database: ['MongoDB']
            },
            thumbnail: null,
            progress: 75,
            filesCount: 24,
            linesOfCode: 3420
          },
          {
            id: '2',
            name: 'Task Manager Pro',
            description: 'Productivity app with AI suggestions',
            status: 'completed',
            createdAt: new Date('2024-01-08'),
            updatedAt: new Date('2024-01-14'),
            lastAccessedAt: new Date('2024-01-14'),
            techStack: {
              frontend: ['React', 'Redux'],
              backend: ['Firebase']
            },
            progress: 100,
            filesCount: 18,
            linesOfCode: 2150
          },
          {
            id: '3',
            name: 'Portfolio Website',
            description: 'Modern portfolio with animations',
            status: 'draft',
            createdAt: new Date('2024-01-12'),
            updatedAt: new Date('2024-01-12'),
            lastAccessedAt: new Date('2024-01-12'),
            techStack: {
              frontend: ['React', 'Framer Motion']
            },
            progress: 30,
            filesCount: 8,
            linesOfCode: 850
          },
          {
            id: '4',
            name: 'Weather Dashboard',
            description: 'Real-time weather with maps',
            status: 'in-progress',
            createdAt: new Date('2024-01-09'),
            updatedAt: new Date('2024-01-13'),
            lastAccessedAt: new Date('2024-01-13'),
            techStack: {
              frontend: ['React'],
              backend: ['OpenWeather API']
            },
            progress: 60,
            filesCount: 12,
            linesOfCode: 1540
          },
          {
            id: '5',
            name: 'Social Media App',
            description: 'Connect with friends and share moments',
            status: 'in-progress',
            createdAt: new Date('2024-01-05'),
            updatedAt: new Date('2024-01-11'),
            lastAccessedAt: new Date('2024-01-11'),
            techStack: {
              frontend: ['React', 'Redux'],
              backend: ['Node.js', 'Socket.io'],
              database: ['PostgreSQL']
            },
            progress: 45,
            filesCount: 32,
            linesOfCode: 4200
          },
          {
            id: '6',
            name: 'Recipe Finder',
            description: 'Discover and save delicious recipes',
            status: 'completed',
            createdAt: new Date('2024-01-03'),
            updatedAt: new Date('2024-01-10'),
            lastAccessedAt: new Date('2024-01-10'),
            techStack: {
              frontend: ['React'],
              backend: ['Spoonacular API']
            },
            progress: 100,
            filesCount: 15,
            linesOfCode: 1890
          }
        ]
      };
    },
    
    deleteProject: async (projectId) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    
    duplicateProject: async (projectId, userId) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true, projectId: 'new-' + projectId };
    },
    
    updateLastAccessed: async (projectId) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return { success: true };
    },
    
    getProjectStats: async (userId) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        stats: {
          totalProjects: 6,
          draftProjects: 1,
          inProgressProjects: 3,
          completedProjects: 2,
          totalLines: 14050,
          totalFiles: 109
        }
      };
    }
  };

const Dashboard = ({ onNewProject, onOpenProject, onLogout }) => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [filterStatus, setFilterStatus] = useState("all");
  const [stats, setStats] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadProjects();
      loadStats();
    }
  }, [currentUser]);

  useEffect(() => filterProjects(), [projects, searchQuery, filterStatus]);

  const loadProjects = async () => {
    setLoading(true);
    const { success, projects: data } = await projectService.getUserProjects(currentUser.uid);
    if (success) setProjects(data);
    setLoading(false);
  };

  const loadStats = async () => {
    const { success, stats } = await projectService.getProjectStats(currentUser.uid);
    if (success) setStats(stats);
  };

  const filterProjects = () => {
    let f = [...projects];
    if (filterStatus !== "all") f = f.filter(p => p.status === filterStatus);
    if (searchQuery.trim())
      f = f.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    setFilteredProjects(f);
  };

  const formatDate = (date) => {
    const diff = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const statusBadge = (status) => {
    const map = {
      draft: { label: "draft", color: "text-purple-300 bg-purple-500/10 border-purple-400/30" },
      "in-progress": { label: "in progress", color: "text-blue-300 bg-blue-500/10 border-blue-400/30" },
      completed: { label: "completed", color: "text-green-300 bg-green-500/10 border-green-400/30" }
    };
    const item = map[status];
    if (!item) return null;
    return (
      <span className={`px-2 py-1 rounded-full text-xs border ${item.color}`}>
        {item.label}
      </span>
    );
  };

  const progressColor = (v) =>
    v >= 80 ? "bg-gradient-to-r from-green-500 to-emerald-500" :
    v >= 50 ? "bg-gradient-to-r from-blue-500 to-cyan-500" :
    v >= 30 ? "bg-gradient-to-r from-yellow-500 to-orange-500" : "bg-gradient-to-r from-gray-500 to-gray-600";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#090b1a] via-[#0e1130] to-[#1a093b] text-white relative overflow-hidden">

      {/* Animated Background Effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-200px] right-[-100px] w-[400px] h-[400px] bg-purple-600/15 blur-[160px] animate-pulse" />
        <div className="absolute bottom-[-200px] left-[-100px] w-[400px] h-[400px] bg-cyan-500/15 blur-[160px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-pink-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-white/10 backdrop-blur-xl bg-white/5">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 blur-xl opacity-50" />
              <div className="relative w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                My Projects
              </h1>
              <p className="text-sm text-gray-400">
                Welcome back, {currentUser?.displayName || 'User'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onNewProject}
              className="group px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 font-semibold transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              New Workspace
            </button>

            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold hover:scale-105 transition-transform shadow-lg"
              >
                {currentUser?.displayName?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase()}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-white/10 bg-gray-900/95 backdrop-blur-xl shadow-2xl p-5 z-50 animate-fade-in">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-lg font-bold text-white">
                      {currentUser?.displayName?.charAt(0).toUpperCase() ||
                      currentUser?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="font-semibold text-white text-lg">
                        {currentUser?.displayName}
                      </h2>
                      <p className="text-xs text-gray-400">
                        Member since{" "}
                        {currentUser?.metadata?.creationTime
                          ? new Date(currentUser.metadata.creationTime).toLocaleDateString()
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-sm">
                      <p className="text-xs text-gray-400 mb-1">Display Name</p>
                      <p className="text-white font-medium">{currentUser?.displayName}</p>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-sm">
                      <p className="text-xs text-gray-400 mb-1">Email Address</p>
                      <p className="text-white font-medium">{currentUser?.email}</p>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-sm">
                      <p className="text-xs text-gray-400 mb-1">Email Verification</p>
                      <p className={`font-medium flex items-center gap-2 ${
                        currentUser?.emailVerified ? "text-green-400" : "text-yellow-400"
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          currentUser?.emailVerified ? "bg-green-400" : "bg-yellow-400"
                        }`}></span>
                        {currentUser?.emailVerified ? "Verified" : "Not Verified"}
                      </p>
                    </div>
                  </div>

                  <div className="h-[1px] bg-white/10 my-4" />

                  <button
                    onClick={onLogout}
                    className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            {[
              { label: "Total Projects", v: stats.totalProjects, icon: Folder, gradient: "from-purple-500 to-pink-500" },
              { label: "In Progress", v: stats.inProgressProjects, icon: TrendingUp, gradient: "from-blue-500 to-cyan-500" },
              { label: "Completed", v: stats.completedProjects, icon: CheckCircle, gradient: "from-green-500 to-emerald-500" },
              { label: "Lines of Code", v: stats.totalLines.toLocaleString(), icon: Code, gradient: "from-orange-500 to-yellow-500" },
            ].map((s, i) => (
              <div key={i}
                className="group p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all shadow-lg hover:shadow-2xl hover:scale-105"
              >
                <div className="flex justify-between mb-3">
                  <span className="text-sm text-gray-400">{s.label}</span>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg`}>
                    <s.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className={`text-3xl font-bold bg-gradient-to-r ${s.gradient} bg-clip-text text-transparent`}>
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search + View Toggle */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <div className="flex-1 min-w-[300px] relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
            <input
              className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-xl pl-12 pr-4 py-3.5 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button
            className="p-3.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-400">Loading your projects...</p>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Folder className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No projects found</h3>
              <p className="text-gray-500 mb-6">Create your first project to get started</p>
              <button
                onClick={onNewProject}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold transition-all shadow-lg"
              >
                Create Project
              </button>
            </div>
          </div>
        ) : (
          <div className={viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
          }>
            {filteredProjects.map(p => (
              <div
                key={p.id}
                className="group relative p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 hover:border-purple-400/40 hover:bg-white/10 hover:shadow-2xl hover:shadow-purple-500/20 transition-all cursor-pointer"
                onClick={() => onOpenProject(p)}
              >
                {/* Menu Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProject(selectedProject === p.id ? null : p.id);
                  }}
                  className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <MoreVertical className="w-4 h-4 text-gray-400 group-hover:text-white" />
                </button>

                {selectedProject === p.id && (
                  <div className="absolute right-4 top-12 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-10 overflow-hidden">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); 
                      }}
                      className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-white/10 w-full text-left transition-colors"
                    >
                      <Copy className="w-4 h-4" /> Duplicate
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 w-full text-left transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                )}

                {/* Project Content */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors mb-2">
                    {p.name}
                  </h3>
                  <p className="text-sm text-gray-400 line-clamp-2">{p.description}</p>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Progress</span>
                    <span className="font-semibold">{p.progress}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${progressColor(p.progress)} transition-all duration-500`}
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {p.techStack.frontend?.slice(0, 3).map((t, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 rounded-lg border border-purple-400/30 text-purple-300 bg-purple-500/10 backdrop-blur-sm"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" /> {p.filesCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Code className="w-3 h-3" /> {p.linesOfCode.toLocaleString()}
                    </span>
                  </div>
                  {statusBadge(p.status)}
                </div>

                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDate(p.lastAccessedAt)}
                  </span>
                  {p.progress === 100 && (
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
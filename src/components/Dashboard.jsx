import React, { useState, useEffect } from "react";
import {
  Plus, Search, Folder, Clock, Trash2, Edit, Copy, MoreVertical,
  Grid, List, TrendingUp, Code, Loader, Star, FileText, CheckCircle, AlertCircle
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

// --- MOCK SERVICE (replace with Firestore in real app) ---
const projectService = {
    getUserProjects: async (userId) => {
      // Simulate API call
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

  useEffect(() => {
    if (currentUser) {
      loadProjects();
      loadStats();
    }
  }, [currentUser]);

  useEffect(() => filterProjects(), [projects, searchQuery, filterStatus]);

  const loadProjects = async () => {
    const { success, projects: data } = await projectService.getUserProjects(currentUser.uid);
    if (success) setProjects(data);
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
      draft: { label: "draft", color: "text-purple-300 bg-purple-500/10 border-purple-400" },
      "in-progress": { label: "in progress", color: "text-blue-300 bg-blue-500/10 border-blue-400" },
      completed: { label: "completed", color: "text-green-300 bg-green-500/10 border-green-400" }
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
    v >= 80 ? "bg-green-500" :
    v >= 50 ? "bg-blue-500" :
    v >= 30 ? "bg-yellow-500" : "bg-gray-500";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#090b1a] via-[#0e1130] to-[#1a093b] text-white relative overflow-hidden">

      {/* Glowing gradient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-200px] right-[-100px] w-[400px] h-[400px] bg-purple-600/15 blur-[160px]" />
        <div className="absolute bottom-[-200px] left-[-100px] w-[400px] h-[400px] bg-cyan-500/15 blur-[160px]" />
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-white/10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              My Projects
            </h1>
            <p className="text-sm text-gray-400">
              Welcome back, {currentUser?.displayName}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onNewProject}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 hover:to-pink-500 shadow-lg shadow-purple-600/30 font-semibold transition"
            >
              + New Workspace
            </button>

            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold"
              >
                {currentUser?.displayName?.[0]}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-gray-800 bg-gray-900 shadow-xl p-5 z-50">

                    {/* Header */}
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

                    {/* User Info */}
                    <div className="space-y-3">

                    <div className="bg-gray-800 border border-gray-700 p-3 rounded-xl text-sm">
                        <p className="text-xs text-gray-400">Display Name</p>
                        <p className="text-white font-medium">{currentUser?.displayName}</p>
                    </div>

                    <div className="bg-gray-800 border border-gray-700 p-3 rounded-xl text-sm">
                        <p className="text-xs text-gray-400">Email Address</p>
                        <p className="text-white font-medium">{currentUser?.email}</p>
                    </div>

                    <div className="bg-gray-800 border border-gray-700 p-3 rounded-xl text-sm">
                        <p className="text-xs text-gray-400">Email Verification</p>
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

                    {/* Divider */}
                    <div className="h-[1px] bg-gray-700 my-4" />

                    {/* Sign Out */}
                    <button
                    onClick={onLogout}
                    className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2"
                    >
                    <span className="text-lg">↳</span> Sign Out
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
              { label: "Total Projects", v: stats.totalProjects, icon: Folder },
              { label: "In Progress", v: stats.inProgressProjects, icon: TrendingUp },
              { label: "Completed", v: stats.completedProjects, icon: CheckCircle },
              { label: "Lines of Code", v: stats.totalLines.toLocaleString(), icon: Code },
            ].map((s, i) => (
              <div key={i}
                className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md hover:border-purple-400/40 transition shadow-xl shadow-black/20"
              >
                <div className="flex justify-between mb-2 text-gray-300">
                  <span>{s.label}</span>
                  <s.icon className="text-cyan-400" />
                </div>
                <div className="text-3xl font-bold">{s.v}</div>
              </div>
            ))}
          </div>
        )}

        {/* Search + view switch */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 placeholder-gray-400 backdrop-blur text-white focus:ring-2 focus:ring-purple-500"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            className="px-4 rounded-lg bg-white/5 border border-white/10 hover:border-purple-400/40 transition"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? <List /> : <Grid />}
          </button>
        </div>

        {/* PROJECT GRID */}
        <div className={viewMode === "grid"
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          : "space-y-6"
        }>
          {filteredProjects.map(p => (
            <div
              key={p.id}
              className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-lg hover:border-purple-400/40 hover:shadow-lg hover:shadow-purple-500/30 transition cursor-pointer group"
              onClick={() => onOpenProject(p)}
            >
              {/* Title + menu */}
              <div className="flex justify-between mb-3">
                <h3 className="text-lg font-semibold group-hover:text-purple-300 transition">
                  {p.name}
                </h3>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProject(selectedProject === p.id ? null : p.id);
                  }}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  <MoreVertical className="w-4 h-4 text-gray-300" />
                </button>

                {selectedProject === p.id && (
                  <div className="absolute right-4 bg-black/70 border border-white/10 rounded-xl backdrop-blur-xl shadow-xl">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); 
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/10 w-full"
                    >
                      <Copy className="w-4 h-4" /> Duplicate
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-white/10 w-full"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-gray-400 mb-4">{p.description}</p>

              {/* Progress */}
              <div className="mb-4">
                <div className="text-xs text-gray-400 mb-1 flex justify-between">
                  <span>Progress</span><span>{p.progress}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${progressColor(p.progress)} transition`}
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>

              {/* Tech tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {p.techStack.frontend?.slice(0, 3).map((t, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 rounded border border-purple-400/30 text-purple-300 bg-purple-500/10"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="flex justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" /> {p.filesCount} files
                </span>
                <span className="flex items-center gap-1">
                  <Code className="w-3 h-3" /> {p.linesOfCode.toLocaleString()} LOC
                </span>
              </div>

              <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formatDate(p.lastAccessedAt)}
                </span>

                <div className="flex gap-2 items-center">
                  {statusBadge(p.status)}
                  {p.progress === 100 && (
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

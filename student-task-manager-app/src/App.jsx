import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5000/api"
  : "/api";

const emptyForm = {
  title: "",
  description: "",
  due_date: "",
  priority: "Medium",
  status: "Pending",
};

function App() {
  // Authentication State
  const [user, setUser] = useState(() => {
    if (typeof window === "undefined") return null;
    const stored = window.localStorage.getItem("studentTaskUser");
    return stored ? JSON.parse(stored) : null;
  });
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Backend Status State
  const [backendMode, setBackendMode] = useState("Checking...");

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`${API_BASE}/status`);
        const data = await response.json();
        setBackendMode(data.mode);
      } catch (err) {
        setBackendMode("Offline");
      }
    };
    checkStatus();
  }, []);

  // Tasks State
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [feedback, setFeedback] = useState("");

  // Fetch tasks helper
  const fetchTasks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/tasks`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to load tasks");
      }
      setTasks(data);
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sync tasks on mount / user session updates
  useEffect(() => {
    if (user) {
      fetchTasks();
    } else {
      setTasks([]);
    }
  }, [user]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === "Completed").length;
    const active = total - completed;

    return { total, completed, active };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        `${task.title} ${task.description}`.toLowerCase().includes(normalizedSearch);
      
      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;
      
      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [priorityFilter, searchTerm, statusFilter, tasks]);

  // Auth form submissions
  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    const { name, email, password } = authForm;
    const isLogin = authMode === "login";

    if (!email || !password || (!isLogin && !name)) {
      setAuthError("All fields are required.");
      setAuthLoading(false);
      return;
    }

    try {
      const endpoint = isLogin ? `${API_BASE}/auth/login` : `${API_BASE}/auth/register`;
      const payload = isLogin ? { email } : { name, email };
      payload.password = password;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Authentication failed.");
      }

      const loggedUser = {
        name: data.name,
        email: data.email,
        token: data.token,
      };

      window.localStorage.setItem("studentTaskUser", JSON.stringify(loggedUser));
      setUser(loggedUser);
      setAuthForm({ name: "", email: "", password: "" });
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    window.localStorage.removeItem("studentTaskUser");
    resetForm();
  };

  // Task form submissions
  const handleSubmit = async (event) => {
    event.preventDefault();

    const title = form.title.trim();
    if (!title) {
      setFeedback("Please enter a task title before saving.");
      return;
    }

    const payload = {
      title,
      description: form.description.trim(),
      due_date: form.due_date || null,
      priority: form.priority,
      status: form.status,
    };

    try {
      const endpoint = editingId ? `${API_BASE}/tasks/${editingId}` : `${API_BASE}/tasks`;
      const response = await fetch(endpoint, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to save task");
      }

      setFeedback(editingId ? "Task updated successfully." : "Task added successfully.");
      setForm(emptyForm);
      setEditingId(null);
      fetchTasks();
    } catch (err) {
      setFeedback(err.message);
    }
  };

  const handleEdit = (task) => {
    setForm({
      title: task.title,
      description: task.description || "",
      due_date: task.due_date ? task.due_date.slice(0, 10) : "",
      priority: task.priority || "Medium",
      status: task.status || "Pending",
    });
    setEditingId(task.id || task._id);
    setFeedback("Editing task. Update the details and save.");
  };

  const handleDelete = async (taskId) => {
    try {
      const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete task");
      }

      setFeedback("Task removed.");
      if (editingId === taskId) {
        setForm(emptyForm);
        setEditingId(null);
      }
      fetchTasks();
    } catch (err) {
      setFeedback(err.message);
    }
  };

  const toggleComplete = async (task) => {
    const taskId = task.id || task._id;
    const newStatus = task.status === "Completed" ? "Pending" : "Completed";
    try {
      const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to toggle status");
      }
      fetchTasks();
    } catch (err) {
      setFeedback(err.message);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFeedback("");
  };

  // If user is not logged in, render authentication panel
  if (!user) {
    const isLogin = authMode === "login";
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div style={{ marginBottom: "1rem" }}>
              <span className={`mode-badge ${backendMode.toLowerCase().replace(" ", "-")}`}>
                {backendMode} Mode
              </span>
            </div>
            <h1>Student Task Manager</h1>
            <p>{isLogin ? "Sign in to manage your tasks" : "Create an account to get started"}</p>
          </div>

          <div className="auth-tabs" role="tablist">
            <button
              className={`auth-tab-btn ${isLogin ? "active" : ""}`}
              onClick={() => {
                setAuthMode("login");
                setAuthError("");
              }}
              role="tab"
              aria-selected={isLogin}
            >
              Login
            </button>
            <button
              className={`auth-tab-btn ${!isLogin ? "active" : ""}`}
              onClick={() => {
                setAuthMode("register");
                setAuthError("");
              }}
              role="tab"
              aria-selected={!isLogin}
            >
              Register
            </button>
          </div>

          {authError && <div className="auth-error">{authError}</div>}

          <form onSubmit={handleAuthSubmit} className="auth-form-body">
            {!isLogin && (
              <label className="field">
                <span>Name</span>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  required
                />
              </label>
            )}

            <label className="field">
              <span>Email</span>
              <input
                type="email"
                placeholder="student@example.com"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value.trim().toLowerCase() })}
                required
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                placeholder="••••••••"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                required
              />
            </label>

            <button className="primary-btn" type="submit" disabled={authLoading} style={{ width: "100%", marginTop: "1rem" }}>
              {authLoading ? "Please wait..." : isLogin ? "Log In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="hero-card">
        <div>
          <div style={{ marginBottom: "0.75rem" }}>
            <span className={`mode-badge ${backendMode.toLowerCase().replace(" ", "-")}`}>
              {backendMode} Mode
            </span>
          </div>
          <p className="eyebrow">Stay on top of your study plan</p>
          <h1>Student Task Manager</h1>
          <p className="hero-copy">
            Welcome, <strong>{user.name}</strong> ({user.email}). Organize homework, projects, and study blocks.
          </p>
          <div style={{ marginTop: "1rem" }}>
            <button className="secondary-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        <div className="stats-grid" aria-label="Task summary">
          <div className="stat-card">
            <strong>{stats.total}</strong>
            <span>Total</span>
          </div>
          <div className="stat-card">
            <strong>{stats.active}</strong>
            <span>Active</span>
          </div>
          <div className="stat-card">
            <strong>{stats.completed}</strong>
            <span>Done</span>
          </div>
        </div>
      </header>

      <section className="content-grid">
        <form className="panel form-panel" onSubmit={handleSubmit}>
          <div className="panel-heading">
            <h2>{editingId ? "Edit Task" : "Add a Task"}</h2>
            <p>Capture the details that matter most.</p>
          </div>

          <label className="field">
            <span>Task title</span>
            <input
              type="text"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="e.g. Finish calculus revision"
            />
          </label>

          <label className="field">
            <span>Description</span>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              rows="3"
              placeholder="Add notes or study goals"
            />
          </label>

          <div className="inline-fields">
            <label className="field">
              <span>Due date</span>
              <input
                type="date"
                value={form.due_date}
                onChange={(event) => setForm({ ...form, due_date: event.target.value })}
              />
            </label>

            <label className="field">
              <span>Priority</span>
              <select
                value={form.priority}
                onChange={(event) => setForm({ ...form, priority: event.target.value })}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </label>
          </div>

          <label className="field">
            <span>Status</span>
            <select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </label>

          <div className="button-row">
            <button className="primary-btn" type="submit">
              {editingId ? "Update Task" : "Add Task"}
            </button>
            <button className="secondary-btn" type="button" onClick={resetForm}>
              {editingId ? "Cancel Edit" : "Clear"}
            </button>
          </div>

          {feedback ? <p className="feedback">{feedback}</p> : null}
        </form>

        <section className="panel task-panel">
          <div className="panel-heading">
            <h2>Your Tasks</h2>
            <p>Search, filter, and track progress.</p>
          </div>

          <div className="toolbar">
            <label className="field compact-field">
              <span>Search</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Find a task"
              />
            </label>

            <label className="field compact-field">
              <span>Status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </label>

            <label className="field compact-field">
              <span>Priority</span>
              <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
                <option value="all">All</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </label>
          </div>

          <div className="task-list">
            {loading ? (
              <div className="empty-state">
                <p>Loading tasks from database...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="empty-state">
                <p>No tasks match your current selection.</p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const taskId = task.id || task._id;
                const isCompleted = task.status === "Completed";
                return (
                  <article key={taskId} className={`task-card ${isCompleted ? "completed" : ""}`}>
                    <div className="task-main">
                      <button
                        className="check-btn"
                        type="button"
                        onClick={() => toggleComplete(task)}
                        aria-label={isCompleted ? "Mark task active" : "Mark task complete"}
                      >
                        {isCompleted ? "✓" : "○"}
                      </button>

                      <div className="task-copy">
                        <div className="task-title-row">
                          <h3>{task.title}</h3>
                          <span className={`priority-pill ${task.priority.toLowerCase()}`}>
                            {task.priority}
                          </span>
                        </div>
                        {task.description ? <p>{task.description}</p> : null}
                        <div className="task-meta">
                          {task.due_date ? <span>Due {new Date(task.due_date).toLocaleDateString()}</span> : <span>No due date</span>}
                          <span>{task.status}</span>
                        </div>
                      </div>
                    </div>

                    <div className="task-actions">
                      <button type="button" onClick={() => handleEdit(task)}>
                        Edit
                      </button>
                      <button type="button" className="danger-btn" onClick={() => handleDelete(taskId)}>
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </section>
    </div>
  );
}

export default App;

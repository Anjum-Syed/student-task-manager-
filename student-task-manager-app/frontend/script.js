const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "/api";
const API_URL = `${API_BASE}/tasks`;
const AUTH_URL = `${API_BASE}/auth`;

let currentUser = null;
let editingTaskId = null;

window.onload = initApp;

function initApp() {
    const storedUser = localStorage.getItem("studentTaskUser");
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        renderDashboard();
        getTasks();
    } else {
        renderAuth();
    }
}

function renderAuth() {
    const app = document.getElementById("app");
    app.innerHTML = `
        <div class="auth-page">
            <div class="card">
                <h1>Student Task Manager</h1>
                <p style="margin: 8px 0 16px; color: #475569;">Register or log in to manage your tasks.</p>
                <div class="nav-links auth-tabs" style="margin-bottom: 16px;">
                    <button class="btn btn-secondary auth-tab active" id="showLoginBtn" data-mode="login">Login</button>
                    <button class="btn btn-secondary auth-tab" id="showRegisterBtn" data-mode="register">Register</button>
                </div>
                <form id="authForm" class="auth-form">
                    <input id="authName" type="text" placeholder="Full name" style="display:none;">
                    <input id="authEmail" type="email" placeholder="Email" required>
                    <input id="authPassword" type="password" placeholder="Password" required>
                    <button class="btn btn-primary" type="submit" id="authSubmitBtn">Login</button>
                </form>
                <p id="authMessage" class="message"></p>
            </div>
        </div>
    `;

    document.querySelectorAll(".auth-tab").forEach((tab) => {
        tab.addEventListener("click", () => setAuthMode(tab.dataset.mode));
    });
    document.getElementById("authForm").addEventListener("submit", handleAuthSubmit);
    setAuthMode("login");
}

function setAuthMode(mode) {
    const nameInput = document.getElementById("authName");
    const submitBtn = document.getElementById("authSubmitBtn");
    const loginTab = document.getElementById("showLoginBtn");
    const registerTab = document.getElementById("showRegisterBtn");

    document.querySelectorAll(".auth-tab").forEach((tab) => {
        tab.classList.toggle("active", tab.dataset.mode === mode);
        tab.classList.toggle("btn-primary", tab.dataset.mode === mode);
        tab.classList.toggle("btn-secondary", tab.dataset.mode !== mode);
    });

    if (mode === "register") {
        nameInput.style.display = "block";
        nameInput.required = true;
        submitBtn.textContent = "Register";
    } else {
        nameInput.style.display = "none";
        nameInput.required = false;
        submitBtn.textContent = "Login";
    }

    const message = document.getElementById("authMessage");
    if (message) {
        message.textContent = "";
    }
}

function renderDashboard() {
    const app = document.getElementById("app");
    app.innerHTML = `
        <div class="dashboard-page">
            <div class="card">
                <div class="header-row">
                    <div>
                        <h1>Student Task Manager</h1>
                        <p>Welcome, ${currentUser.name}</p>
                    </div>
                    <div class="nav-links">
                        <button class="btn btn-secondary" id="logoutBtn">Logout</button>
                    </div>
                </div>

                <form id="taskForm" class="task-form">
                    <input type="text" id="title" placeholder="Task title" required>
                    <textarea id="description" placeholder="Description"></textarea>
                    <input type="date" id="dueDate">
                    <select id="priority">
                        <option value="High">High</option>
                        <option value="Medium" selected>Medium</option>
                        <option value="Low">Low</option>
                    </select>
                    <select id="status">
                        <option value="Pending" selected>Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                    </select>
                    <input type="hidden" id="taskId">
                    <div class="task-actions">
                        <button class="btn btn-primary" type="submit" id="submitButton">Add Task</button>
                        <button class="btn btn-secondary" type="button" id="cancelEditButton" style="display:none;">Cancel</button>
                    </div>
                </form>

                <p id="statusMessage" class="message"></p>
                <div id="taskList" class="task-grid"></div>
            </div>
        </div>
    `;

    document.getElementById("taskForm").addEventListener("submit", handleTaskSubmit);
    document.getElementById("cancelEditButton").addEventListener("click", resetForm);
    document.getElementById("logoutBtn").addEventListener("click", logout);
    getTasks();
}

async function handleAuthSubmit(event) {
    event.preventDefault();
    const name = document.getElementById("authName").value.trim();
    const email = document.getElementById("authEmail").value.trim().toLowerCase();
    const password = document.getElementById("authPassword").value;
    const mode = document.getElementById("authSubmitBtn").textContent.trim().toLowerCase() === "register" ? "register" : "login";
    const endpoint = mode === "register" ? `${AUTH_URL}/register` : `${AUTH_URL}/login`;

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(mode === "register" ? { name, email, password } : { email, password }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Authentication failed");

        currentUser = { name: data.name, email: data.email, token: data.token };
        localStorage.setItem("studentTaskUser", JSON.stringify(currentUser));
        renderDashboard();
        showStatus("Logged in successfully.");
    } catch (error) {
        document.getElementById("authMessage").textContent = error.message;
        document.getElementById("authMessage").style.color = "#dc2626";
    }
}

async function handleTaskSubmit(event) {
    event.preventDefault();

    const task = {
        title: document.getElementById("title").value.trim(),
        description: document.getElementById("description").value.trim(),
        due_date: document.getElementById("dueDate").value || null,
        priority: document.getElementById("priority").value,
        status: document.getElementById("status").value,
    };

    if (!task.title) {
        showStatus("Task title is required.", true);
        return;
    }

    const taskId = document.getElementById("taskId").value;

    try {
        const response = await fetch(taskId ? `${API_URL}/${taskId}` : API_URL, {
            method: taskId ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${currentUser.token}`,
            },
            body: JSON.stringify(task),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Request failed");

        showStatus(taskId ? "Task updated successfully." : "Task created successfully.");
        resetForm();
        getTasks();
    } catch (error) {
        showStatus(error.message, true);
    }
}

async function getTasks() {
    try {
        const response = await fetch(API_URL, {
            headers: { Authorization: `Bearer ${currentUser.token}` },
        });
        const tasks = await response.json();
        if (!response.ok) throw new Error(tasks.message || "Unable to load tasks");
        renderTasks(tasks);
    } catch (error) {
        showStatus(error.message, true);
        document.getElementById("taskList").innerHTML = "<p>Unable to load tasks right now.</p>";
    }
}

function renderTasks(tasks) {
    const taskList = document.getElementById("taskList");
    taskList.innerHTML = "";

    if (!tasks.length) {
        taskList.innerHTML = "<p>No tasks yet. Add one above.</p>";
        return;
    }

    const fragment = document.createDocumentFragment();
    tasks.forEach((task) => {
        const card = document.createElement("div");
        card.className = "task-card";
        card.innerHTML = `
            <h3>${task.title}</h3>
            <p>${task.description || "No description"}</p>
            <p><strong>Priority:</strong> ${task.priority}</p>
            <p><strong>Status:</strong> ${task.status}</p>
            <p><strong>Due:</strong> ${task.due_date ? new Date(task.due_date).toLocaleDateString() : "Not set"}</p>
            <div class="task-actions">
                <button class="btn btn-secondary" type="button" data-action="edit" data-id="${task._id || task.id}">Edit</button>
                <button class="btn btn-primary" type="button" data-action="complete" data-id="${task._id || task.id}">Mark Complete</button>
                <button class="btn btn-danger" type="button" data-action="delete" data-id="${task._id || task.id}">Delete</button>
            </div>
        `;
        fragment.appendChild(card);
    });

    taskList.appendChild(fragment);
}

document.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const taskId = button.getAttribute("data-id");
    const action = button.getAttribute("data-action");

    if (action === "edit") {
        const task = await fetchTaskById(taskId);
        if (task) setFormMode(task);
        return;
    }

    if (action === "complete") {
        try {
            const response = await fetch(`${API_URL}/${taskId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${currentUser.token}`,
                },
                body: JSON.stringify({ status: "Completed" }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Unable to update task");
            showStatus("Task marked complete.");
            getTasks();
        } catch (error) {
            showStatus(error.message, true);
        }
        return;
    }

    if (action === "delete") {
        try {
            const response = await fetch(`${API_URL}/${taskId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${currentUser.token}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Unable to delete task");
            showStatus("Task deleted successfully.");
            getTasks();
        } catch (error) {
            showStatus(error.message, true);
        }
    }
});

async function fetchTaskById(taskId) {
    try {
        const response = await fetch(`${API_URL}/${taskId}`, {
            headers: { Authorization: `Bearer ${currentUser.token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load task");
        return data;
    } catch (error) {
        showStatus(error.message, true);
        return null;
    }
}

function setFormMode(task) {
    document.getElementById("title").value = task.title || "";
    document.getElementById("description").value = task.description || "";
    document.getElementById("dueDate").value = task.due_date ? task.due_date.slice(0, 10) : "";
    document.getElementById("priority").value = task.priority || "Medium";
    document.getElementById("status").value = task.status || "Pending";
    document.getElementById("taskId").value = task._id || task.id || "";
    document.getElementById("submitButton").textContent = "Save Task";
    document.getElementById("cancelEditButton").style.display = "inline-block";
    document.getElementById("title").focus();
}

function resetForm() {
    document.getElementById("taskForm").reset();
    document.getElementById("taskId").value = "";
    document.getElementById("submitButton").textContent = "Add Task";
    document.getElementById("cancelEditButton").style.display = "none";
    document.getElementById("status").value = "Pending";
    document.getElementById("priority").value = "Medium";
}

function showStatus(message, isError = false) {
    const statusMessage = document.getElementById("statusMessage");
    statusMessage.textContent = message;
    statusMessage.style.color = isError ? "#dc2626" : "#166534";
}

function logout() {
    currentUser = null;
    localStorage.removeItem("studentTaskUser");
    renderAuth();
}
const mongoose = require("mongoose");
const Task = require("../models/Task");
const memoryStore = require("../config/memoryStore");

const toTaskResponse = (task) => ({
  _id: task._id,
  id: task._id?.toString?.() || task.id,
  user_id: task.user_id,
  title: task.title,
  description: task.description || "",
  due_date: task.due_date || null,
  priority: task.priority || "Medium",
  status: task.status || "Pending",
  createdAt: task.createdAt || new Date().toISOString(),
  updatedAt: task.updatedAt || new Date().toISOString(),
});

// Create a new task
const createTask = async (req, res) => {
  try {
    if (process.env.USE_MEMORY_STORE === "true") {
      const task = {
        _id: new mongoose.Types.ObjectId(),
        user_id: req.user._id,
        title: req.body.title,
        description: req.body.description || "",
        due_date: req.body.due_date || null,
        priority: req.body.priority || "Medium",
        status: req.body.status || "Pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryStore.tasks.push(task);
      memoryStore.save();
      res.status(201).json(toTaskResponse(task));
    } else {
      const task = await Task.create({
        ...req.body,
        user_id: req.user._id,
      });
      res.status(201).json(toTaskResponse(task));
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all tasks
const getTasks = async (req, res) => {
  try {
    if (process.env.USE_MEMORY_STORE === "true") {
      const userTasks = memoryStore.tasks
        .filter((t) => t.user_id.toString() === req.user._id.toString())
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      res.json(userTasks.map(toTaskResponse));
    } else {
      const tasks = await Task.find({ user_id: req.user._id }).sort({ createdAt: -1 });
      res.json(tasks.map(toTaskResponse));
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTaskById = async (req, res) => {
  try {
    if (process.env.USE_MEMORY_STORE === "true") {
      const task = memoryStore.tasks.find(
        (t) => t._id.toString() === req.params.id && t.user_id.toString() === req.user._id.toString()
      );
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      return res.json(toTaskResponse(task));
    } else {
      const task = await Task.findOne({ _id: req.params.id, user_id: req.user._id });

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      return res.json(toTaskResponse(task));
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Update a task
const updateTask = async (req, res) => {
  try {
    if (process.env.USE_MEMORY_STORE === "true") {
      const taskIndex = memoryStore.tasks.findIndex(
        (t) => t._id.toString() === req.params.id && t.user_id.toString() === req.user._id.toString()
      );

      if (taskIndex === -1) {
        return res.status(404).json({ message: "Task not found" });
      }

      const updatedTask = {
        ...memoryStore.tasks[taskIndex],
        ...req.body,
        updatedAt: new Date().toISOString(),
      };

      memoryStore.tasks[taskIndex] = updatedTask;
      memoryStore.save();
      res.json(toTaskResponse(updatedTask));
    } else {
      const task = await Task.findOneAndUpdate(
        { _id: req.params.id, user_id: req.user._id },
        req.body,
        { new: true }
      );

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.json(toTaskResponse(task));
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a task
const deleteTask = async (req, res) => {
  try {
    if (process.env.USE_MEMORY_STORE === "true") {
      const taskIndex = memoryStore.tasks.findIndex(
        (t) => t._id.toString() === req.params.id && t.user_id.toString() === req.user._id.toString()
      );

      if (taskIndex === -1) {
        return res.status(404).json({ message: "Task not found" });
      }

      memoryStore.tasks.splice(taskIndex, 1);
      memoryStore.save();
      res.json({ message: "Task deleted successfully" });
    } else {
      const task = await Task.findOneAndDelete({ _id: req.params.id, user_id: req.user._id });

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.json({ message: "Task deleted successfully" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
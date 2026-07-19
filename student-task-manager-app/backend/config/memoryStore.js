const fs = require("fs");
const path = require("path");

const storePath = path.join(__dirname, "memoryStore.json");

const loadData = () => {
  try {
    if (fs.existsSync(storePath)) {
      const content = fs.readFileSync(storePath, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading memory store:", err);
  }
  return { users: [], tasks: [] };
};

const saveData = (data) => {
  try {
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving memory store:", err);
  }
};

const data = loadData();

module.exports = {
  get users() {
    return data.users;
  },
  get tasks() {
    return data.tasks;
  },
  save() {
    saveData(data);
  },
};

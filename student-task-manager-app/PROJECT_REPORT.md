# Student Task Manager Project Report

## Overview
The Student Task Manager is a full-stack web application that allows students to register, log in, and manage their personal tasks securely.

## Objectives
- Implement user authentication with JWT
- Store tasks in MongoDB Atlas
- Provide a responsive task management UI
- Ensure CRUD operations persist after refresh

## Architecture
- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Express.js with Mongoose
- Database: MongoDB Atlas

## Database Schema
### User
- name: String
- email: String
- password: String

### Task
- user_id: ObjectId
- title: String
- description: String
- status: String
- priority: String
- due_date: Date

## API Functionalities
- Auth registration and login
- Task creation, retrieval, update, deletion
- Protected endpoint access using JWT

## Testing
Verified using live API requests against the running backend.

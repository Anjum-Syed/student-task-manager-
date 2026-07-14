# Student Task Manager

A full-stack student task management application built with Node.js, Express, MongoDB Atlas, and a responsive frontend.

## Features
- User registration and login
- JWT-based authentication
- Protected task APIs per user
- Create, view, update, delete, and mark complete tasks
- MongoDB Atlas persistence
- Responsive UI with auth flow and logout

## Tech Stack
- Backend: Node.js, Express, Mongoose, bcryptjs, jsonwebtoken
- Frontend: HTML, CSS, Vanilla JavaScript
- Database: MongoDB Atlas

## Project Structure
- backend/ - Express API and MongoDB connection
- frontend/ - Static UI files

## Setup
1. Navigate to the backend folder.
2. Copy .env.example to .env and update the values.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the backend:
   ```bash
   node server.js
   ```
5. Serve the frontend from the frontend folder or open index.html in a browser.

## Environment Variables
- PORT
- MONGO_URI
- JWT_SECRET

## API Endpoints
### Auth
- POST /api/auth/register
- POST /api/auth/login

### Tasks
- POST /api/tasks
- GET /api/tasks
- GET /api/tasks/:id
- PUT /api/tasks/:id
- DELETE /api/tasks/:id

## Database Schema
- User: name, email, password
- Task: user_id, title, description, status, priority, due_date


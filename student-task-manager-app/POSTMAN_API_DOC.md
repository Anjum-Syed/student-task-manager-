# Postman API Documentation

## Base URL
http://localhost:5000/api

## Auth
### Register User
POST /auth/register
Body:
```json
{
  "name": "Student Name",
  "email": "student@example.com",
  "password": "secret123"
}
```

### Login User
POST /auth/login
Body:
```json
{
  "email": "student@example.com",
  "password": "secret123"
}
```

## Tasks
### Create Task
POST /tasks
Headers:
```http
Authorization: Bearer <token>
```
Body:
```json
{
  "title": "Assignment",
  "description": "Complete the internship report",
  "priority": "High",
  "status": "Pending",
  "due_date": "2026-07-20"
}
```

### Get Tasks
GET /tasks
Headers:
```http
Authorization: Bearer <token>
```

### Update Task
PUT /tasks/:id
Headers:
```http
Authorization: Bearer <token>
```
Body:
```json
{
  "status": "Completed"
}
```

### Delete Task
DELETE /tasks/:id
Headers:
```http
Authorization: Bearer <token>
```

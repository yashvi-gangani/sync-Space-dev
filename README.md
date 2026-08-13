# SyncSpace - Collaborative Workspace for Developers

**Real-Time Collaborative Code Editor, Whiteboard, Video Calling & File Sharing Platform**

**Live Demo:** https://syncspace-frontend-05u3.onrender.com/

# Project Overview

SyncSpace is a MERN stack based collaborative workspace where multiple users can work together in real time. It combines features like a collaborative code editor, whiteboard, chat, video calling, and file sharing in a single platform.

The project was inspired by tools like VS Code Live Share, Replit, and Excalidraw. We developed this project as part of the **Axlero Solutions Advanced MERN Stack Engineering Program** to learn full-stack development, real-time communication, and team collaboration.


# Key Features

- Real-time collaboration using Socket.IO and Yjs
- Collaborative code editor with Monaco Editor
- Run Python, Java, C++, Go, Rust, and JavaScript using the Piston API
- Live HTML/CSS preview
- Shared whiteboard for brainstorming
- Video and audio calling using WebRTC
- File and PDF sharing using Cloudinary
- Room chat with user presence
- Action replay for editor and whiteboard events
- replay history


# Architecture

The project uses the following technologies:

- **Frontend:** React (Vite), Tailwind CSS, Zustand, Yjs
- **Backend:** Node.js, Express.js, Socket.IO
- **Database:** MongoDB with Mongoose
- **Storage:** Cloudinary
- **Code Execution:** Piston API

# Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React, Tailwind CSS, Monaco Editor, Zustand, React Hot Toast |
| Backend | Node.js, Express.js, Socket.IO, JWT, Bcrypt |
| Database | MongoDB, Cloudinary |
| Real-time | Socket.IO, WebRTC, Yjs |
| Deployment | Render, GitHub Actions |



# Installation & Setup

## Prerequisites

- Node.js (v18 or above)
- MongoDB (Local or Atlas)
- Cloudinary Account

## Clone the Repository

git clone https://github.com/gopichandkuru/syncSpace.git
cd syncSpace


## Backend Setup

cd server
npm install


Create a `.env` file inside the `server` folder.

PORT=5005
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=30d
CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret


Start the backend:
npm run dev


## Frontend Setup

cd ../client
npm install


Create a `.env` file inside the `client` folder.
VITE_API_URL=http://localhost:5005/api
VITE_SOCKET_URL=http://localhost:5005

Start the frontend:
npm run dev

# Folder Structure

syncSpace/
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── features/
│       ├── hooks/
│       ├── services/
│       └── store/
├── server/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── events/
│       ├── middlewares/
│       ├── models/
│       ├── routes/
│       └── socket/
└── render.yaml

# Contributors

This project was developed as a group project by:

- **Yashvi Gangani** – Team Lead, Authentication, WebRTC
- **Gopichand Kuru** – Frontend Development, Database
- **Kunal** – Backend Development, Real-Time Features
- **Malathi** – Database & Authentication
- **Bhagyasree** – Real-Time Features & WebRTC

# Roadmap / Future Enhancements

### Completed
- JWT Authentication & Workspaces
- Monaco Editor & Yjs Sync
- Infinite Whiteboard
- File Sharing (PDF/Images)
- Multi-language Code Execution
- Live HTML/CSS Preview

### In Progress
- WebRTC Video & Audio Calling
- Session Replay Improvements

### Planned Features
- Version History for Code and Whiteboard
- Screen Sharing
- Dark Mode
- Room Activity Logs
- Collaborative To-Do List
- Better Notifications

### AI Features (Future Work)
- **AI Code Assistant** – Explain code, suggest improvements, detect bugs, and generate comments.
- **AI Session Summary** – Generate a summary of discussions, code changes, and pending tasks after each collaboration session.
- **AI Whiteboard Assistant** – Summarize whiteboard content and convert handwritten notes into organized text.

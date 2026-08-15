# SyncSpace - Collaborative Workspace for Developers

**Real-Time Collaborative Code Editor, Whiteboard, Video Calling, File Sharing & AI-Powered Workspace**

**Live Demo:** https://syncspace-frontend-05u3.onrender.com/

**Repository:** https://github.com/yashvi-gangani/sync-Space-dev


## Project Overview

**SyncSpace** is a full-stack collaborative workspace designed for developers and teams to work together in real time.

It brings coding, communication, brainstorming, file sharing, meetings, session replay, analytics, and AI-powered assistance into a single collaborative platform.

SyncSpace allows multiple users to join shared rooms and collaborate through a **real-time code editor, shared whiteboard, chat, video/audio meetings, screen sharing, file sharing, and collaborative documents**.

The project was developed as a group project during the **Axlero Solutions Advanced MERN Stack Engineering Program**, with the goal of building a production-style MERN application while gaining practical experience in full-stack development, real-time communication, WebRTC, cloud services, deployment, and AI integration.


# Key Features

### Authentication & User Management

* User registration and login
* JWT-based authentication
* Password hashing and secure authentication flow
* Email verification
* Forgot password and password reset
* User profiles and avatars
* Protected routes and authenticated sessions

### Collaborative Rooms

* Create and join collaboration rooms
* Room-based workspace architecture
* Invite members using room links
* Member management
* Room settings
* User presence and online status
* Shared workspace for all collaboration tools

### Collaborative Code Editor

* Real-time collaborative code editing
* Monaco Editor integration
* Multi-user editing using Yjs
* Syntax highlighting
* Multi-language support
* Code execution
* Execution output and error handling
* Supported programming languages through the Piston API
* AI-powered code review
* Code improvement suggestions and issue detection

### Live HTML/CSS Preview

* Write HTML and CSS directly in the workspace
* Preview changes in real time
* Useful for frontend development and experimentation

### Collaborative Whiteboard

* Real-time shared whiteboard
* Drawing and editing tools
* Multiple users can work on the same canvas
* Real-time synchronization
* Whiteboard session recording
* Whiteboard snapshots
* Save and restore important whiteboard states

### Video & Audio Collaboration

* Real-time video calling
* Audio calling
* Multi-user meetings
* Participant presence
* Camera and microphone controls
* Screen sharing
* Screen-share viewing
* Meeting state management using WebRTC

### Real-Time Chat

* Room-based chat
* Real-time message delivery
* User presence
* Persistent chat messages
* Communication directly inside the collaboration workspace

### File & Document Sharing

* Upload and share files inside rooms
* Cloudinary-based file storage
* PDF and image sharing
* Collaborative documents
* Document editing
* Document listing and management

### Session Replay

* Record important collaboration events
* Replay previous collaboration sessions
* Track editor activity
* Track whiteboard activity
* Track chat activity
* Track code execution events
* Session-based replay history
* Participant information during replay

### Session Analytics

SyncSpace provides analytics for completed collaboration sessions, including:

* Session duration
* Total collaboration events
* Whiteboard activity
* Code changes
* Chat messages
* Code executions
* Participant count
* Most active participant

### AI-Powered Features

SyncSpace includes AI functionality to make collaboration more productive.

#### AI Code Review

The AI can analyze code and provide:

* Code quality feedback
* Potential issues
* Improvement suggestions
* Explanation of problematic sections
* Review highlights

#### AI Session Summary

After a collaboration session, SyncSpace can generate an AI-powered summary based on the recorded session events.

The summary can include:

* Session title
* Overall session summary
* Important highlights
* Participants
* Event statistics
* Collaboration activity

The session summary uses **Google Gemini API**.

# Architecture

SyncSpace follows a full-stack MERN architecture with real-time communication and cloud integrations.

                    ┌─────────────────────────┐
                    │       SyncSpace          │
                    │   Collaborative Room    │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
        React Frontend      Express Backend     Socket.IO
              │                  │                  │
              │                  ▼                  │
              │              MongoDB               │
              │                  │                  │
              ▼                  ▼                  ▼
        Monaco Editor       Mongoose            Real-Time Sync
        Whiteboard          Cloudinary          User Presence
        WebRTC              Gemini API           Collaboration
        Yjs                 Piston API


# Tech Stack

| Category                | Technologies              |
| ----------------------- | ------------------------- |
| Frontend                | React, Vite, Tailwind CSS |
| State Management        | Zustand                   |
| Code Editor             | Monaco Editor             |
| Real-Time Collaboration | Socket.IO, Yjs            |
| Backend                 | Node.js, Express.js       |
| Authentication          | JWT, bcrypt               |
| Database                | MongoDB, Mongoose         |
| Video & Audio           | WebRTC                    |
| File Storage            | Cloudinary                |
| Code Execution          | Piston API                |
| AI Integration          | Google Gemini API         |
| HTTP Client             | Axios                     |
| Deployment              | Render                    |
| Version Control         | Git, GitHub               |


# Main Technologies & Integrations

### React

Used to build the interactive frontend and reusable UI components.

### Node.js & Express

Used to build the REST API, authentication system, room management, file handling, execution system, replay system, and other backend services.

### MongoDB

Used for persistent storage of:

* Users
* Rooms
* Sessions
* Documents
* Chat messages
* Files
* Replay history
* Whiteboard snapshots
* Activity information

### Socket.IO

Used for real-time communication including:

* Room events
* Chat
* User presence
* Collaboration events
* Whiteboard synchronization
* Editor updates
* Meeting events
* Replay event recording

### Yjs

Used for real-time collaborative editing and synchronization of shared documents/code.

### WebRTC

Used for peer-to-peer:

* Video calls
* Audio calls
* Screen sharing

### Cloudinary

Used for cloud-based storage and delivery of uploaded files, images, and whiteboard snapshots.

### Piston API

Used to execute code in multiple programming languages from the collaborative playground.

### Google Gemini

Used for AI-powered code review and AI session summaries.


# Supported Code Execution

The collaborative playground supports multiple programming languages through the Piston execution API.

Supported languages include:

* JavaScript
* Python
* Java
* C++
* Go
* Rust

The execution system provides:

* Code execution
* Standard input support
* Output handling
* Error handling
* Execution status
* Execution results


# Project Structure

sync-Space-dev/
│
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── features/
│       │   ├── documents/
│       │   ├── editor/
│       │   ├── files/
│       │   ├── meeting/
│       │   └── whiteboard/
│       ├── hooks/
│       ├── layouts/
│       ├── pages/
│       ├── services/
│       └── store/
│
├── server/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── database/
│       ├── events/
│       ├── middlewares/
│       ├── models/
│       ├── routes/
│       ├── services/
│       ├── socket/
│       ├── utils/
│       └── validators/
│
├── scratch/
├── .github/
├── render.yaml
├── package.json
├── README.md
└── CONTRIBUTING.md

# Installation & Local Setup

## Prerequisites

Make sure the following are installed:

* Node.js 18+
* npm
* MongoDB Atlas or local MongoDB
* Cloudinary account
* Google Gemini API key
* Piston API access


## Clone the Repository
git clone https://github.com/yashvi-gangani/sync-Space-dev.git
cd sync-Space-dev


# Backend Setup
cd server
npm install


Create a `.env` file inside the `server` directory.

Example configuration:
env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.1-flash-lite


Configure any additional mail or application-specific environment variables required by your local setup.

Start the backend:
npm run dev


The backend runs on:
http://localhost:5000

# Frontend Setup

Open another terminal:
cd client
npm install


Create a `.env` file inside the `client` directory.

Example:
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000


Start the frontend:
npm run dev


The frontend will normally be available at:
http://localhost:5173


# Environment Variables

Environment files containing API keys, database credentials, JWT secrets, Cloudinary credentials, and other private values should **never be committed to GitHub**.

The repository `.gitignore` excludes `.env` files.

For deployment, configure the required environment variables directly in the hosting platform.


# Deployment

The application is deployed using **Render**.

The production architecture consists of:

User
 │
 ▼
React Frontend
 │
 ▼
Render
 │
 ├── Express API
 ├── Socket.IO
 ├── MongoDB Atlas
 ├── Cloudinary
 ├── Piston API
 └── Google Gemini API

### Production Features

The deployed application supports:

* Authentication
* Collaborative rooms
* Real-time code editing
* Code execution
* AI code review
* AI session summary
* Whiteboard
* Video/audio meetings
* Screen sharing
* Chat
* File sharing
* Documents
* Session replay
* Session analytics


# Completed Features

All major planned SyncSpace features have been implemented.

### Authentication

* JWT authentication
* Registration and login
* Email verification
* Password reset
* Protected routes
* User profiles

### Collaboration

* Room creation
* Room joining
* Member invitations
* User presence
* Real-time collaboration
* Room management

### Development Tools

* Monaco Editor
* Yjs collaboration
* Multi-language execution
* Piston API integration
* HTML/CSS preview
* AI code review

### Communication

* Real-time chat
* Video calling
* Audio calling
* Screen sharing
* Participant management

### Whiteboard

* Collaborative whiteboard
* Real-time synchronization
* Whiteboard snapshots
* Replay support

### Files & Documents

* File uploads
* PDF/image sharing
* Cloudinary integration
* Collaborative documents
* Document management

### Replay & Analytics

* Session recording
* Collaboration event tracking
* Session replay
* Session analytics
* Participant activity
* Most active user tracking

### AI

* AI Code Review
* AI Session Summary
* Gemini API integration

# Project Highlights

SyncSpace demonstrates practical implementation of:

* Full-stack MERN development
* REST API design
* JWT authentication
* Real-time systems
* WebSocket communication
* Collaborative editing
* WebRTC
* Cloud file storage
* Code execution APIs
* AI API integration
* Database modeling
* State management
* Production deployment
* Git and GitHub collaboration


# Contributors

This project was developed as a collaborative team project during the **Axlero Solutions Advanced MERN Stack Engineering Program**.

* **Yashvi Gangani** – Team Lead, Authentication, WebRTC, Collaboration Features & AI Integration
* **Gopichand Kuru** – Frontend Development & Database
* **Kunal** – Backend Development & Real-Time Features
* **Bhagyasree** – Real-Time Features & WebRTC

# Future Improvements

The core SyncSpace project is complete. Future versions could extend the platform with additional capabilities such as:

* Advanced AI coding assistance
* AI-powered whiteboard understanding
* Collaborative task management
* Advanced activity dashboards
* Version history for documents and code
* Improved notification system
* Additional programming languages
* Advanced team/workspace management
* More detailed collaboration analytics







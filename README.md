#  Resume Interview Analyzer

<div align="center">

![MERN](https://img.shields.io/badge/MERN-Full%20Stack-green?style=for-the-badge)
![React](https://img.shields.io/badge/React.js-Frontend-blue?style=for-the-badge\&logo=react)
![Node](https://img.shields.io/badge/Node.js-Backend-green?style=for-the-badge\&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green?style=for-the-badge\&logo=mongodb)
![Gemini](https://img.shields.io/badge/Google-Gemini%202.5%20Flash-orange?style=for-the-badge)
![JWT](https://img.shields.io/badge/JWT-Authentication-black?style=for-the-badge)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge\&logo=vercel)
![Render](https://img.shields.io/badge/Render-Backend-blue?style=for-the-badge)

### AI-Powered Resume Analysis & Interview Preparation Platform

Upload your resume, compare it against a Job Description, identify skill gaps, generate ATS-friendly resumes, and receive AI-generated interview preparation reports.

</div>

---

# 📌 Project Overview

Resume Interview Analyzer is a production-ready AI-powered MERN Stack application designed to help job seekers improve their chances of getting shortlisted and succeeding in interviews.

The platform leverages Google Gemini AI to:

* Analyze resumes
* Match resumes with job descriptions
* Generate interview preparation reports
* Identify missing skills
* Create ATS-friendly resumes
* Generate downloadable PDF resumes

The system provides personalized feedback and preparation plans that help candidates improve their profile before applying for jobs.

---

# 🌐 Live Demo

| Service     | Link                                               |
| ----------- | -------------------------------------------------- |
| Frontend    | https://resume-interview-analyzer.vercel.app/login  |
| Backend API | https://resume-interview-analyzer-api.onrender.com |

---

# ✨ Features

## 🔐 Authentication

* User Registration
* User Login
* JWT Authentication
* HTTP Only Cookies
* Protected Routes
* Persistent Sessions
* Demo Recruiter Account

---

## 📄 Resume Analysis

* Upload PDF Resume
* Resume Parsing
* Job Description Analysis
* Self Description Input
* Resume Matching
* ATS Optimization

---

## 🤖 AI Interview Report

Generate:

* Match Score
* Technical Interview Questions
* Behavioral Interview Questions
* Skill Gap Analysis
* Resume Feedback
* 7-Day Preparation Roadmap

---

## 📑 ATS Resume Generator

Generate:

* Professional Summary
* Technical Skills
* Education
* Experience
* Projects
* Certifications
* Achievements

---

## 📥 PDF Export

* Download ATS Resume
* Professional Formatting
* Recruiter Friendly Layout
* Puppeteer PDF Generation

---

## 📊 Report Management

* Save Reports
* View Previous Reports
* Resume Download
* Historical Analysis

---

# 📸 Screenshots

## Home Page

<img width="1138" height="850" alt="Screenshot 2026-06-19 174307" src="https://github.com/user-attachments/assets/a089c9ce-fc9b-4ea9-ac1e-c07a8ee6e7e5" />


---

## Questions that Can Recruiters ask

<img width="1611" height="832" alt="image" src="https://github.com/user-attachments/assets/3d32fd1a-b195-46c6-8452-87d6d0111db5" />



---

## Road Map Plans

<img width="1867" height="832" alt="image" src="https://github.com/user-attachments/assets/90322ac1-9554-493f-b780-dec1fe76c367" />


---


# 🛠️ Tech Stack

## Frontend

| Technology   | Purpose        |
| ------------ | -------------- |
| React.js     | UI Development |
| Vite         | Build Tool     |
| React Router | Routing        |
| Axios        | API Requests   |
| SCSS         | Styling        |

---

## Backend

| Technology    | Purpose         |
| ------------- | --------------- |
| Node.js       | Runtime         |
| Express.js    | API Server      |
| JWT           | Authentication  |
| Multer        | File Upload     |
| Cookie Parser | Cookie Handling |

---

## Database

| Technology    | Purpose        |
| ------------- | -------------- |
| MongoDB Atlas | Cloud Database |
| Mongoose      | ODM            |

---

## AI Layer

| Technology         | Purpose           |
| ------------------ | ----------------- |
| Gemini 2.5 Flash   | AI Processing     |
| Zod                | Validation        |
| zod-to-json-schema | Structured Output |

---

## PDF Processing

| Technology | Purpose        |
| ---------- | -------------- |
| pdf-parse  | Resume Parsing |
| Puppeteer  | PDF Generation |

---

## Deployment

| Service       | Purpose          |
| ------------- | ---------------- |
| Vercel        | Frontend Hosting |
| Render        | Backend Hosting  |
| MongoDB Atlas | Database         |

---

# 🏗️ Architecture Overview

```text
                   ┌───────────────────┐
                   │      User         │
                   └─────────┬─────────┘
                             │
                             ▼
                   ┌───────────────────┐
                   │   React Frontend  │
                   │      (Vite)       │
                   └─────────┬─────────┘
                             │
                    Axios API Calls
                             │
                             ▼
                   ┌───────────────────┐
                   │  Express Backend  │
                   └─────────┬─────────┘
                             │
       ┌─────────────────────┼─────────────────────┐
       ▼                     ▼                     ▼

 ┌───────────┐      ┌────────────────┐      ┌──────────────┐
 │ MongoDB   │      │ Gemini AI API  │      │ PDF Services │
 │ Atlas     │      │ Analysis Layer │      │ Puppeteer    │
 └───────────┘      └────────────────┘      └──────────────┘
```

---

# 📂 Folder Structure

```bash
Resume-Interview-Analyzer
│
├── client
│   ├── src
│   │   ├── pages
│   │   ├── components
│   │   ├── layouts
│   │   ├── routes
│   │   ├── services
│   │   ├── context
│   │   └── styles
│
├── server
│   ├── controllers
│   ├── models
│   ├── routes
│   ├── middleware
│   ├── services
│   ├── validators
│   ├── utils
│   └── config
│
├── uploads
├── package.json
└── README.md
```

---

# ⚙️ Installation Guide

## Clone Repository

```bash
git clone https://github.com/yourusername/resume-interview-analyzer.git

cd resume-interview-analyzer
```

---

# 🔑 Environment Variables

## Backend (.env)

```env
PORT=5000

NODE_ENV=development

MONGO_URI=your_mongodb_connection

JWT_SECRET=your_jwt_secret

CLIENT_URL=http://localhost:5173

GEMINI_API_KEY=your_gemini_api_key
```

---

# 🚀 Backend Setup

```bash
cd server

npm install

npm run dev
```

Server runs on:

```bash
http://localhost:5000
```

---

# 🎨 Frontend Setup

```bash
cd client

npm install

npm run dev
```

Frontend runs on:

```bash
http://localhost:5173
```

---

# ▶️ Running Locally

Start Backend

```bash
npm run dev
```

Start Frontend

```bash
npm run dev
```

Open browser:

```bash
http://localhost:5173
```

---

# 🌍 Deployment Guide

## Frontend Deployment

Deploy on Vercel:

```bash
vercel --prod
```

---

## Backend Deployment

Deploy on Render:

```bash
Build Command:
npm install

Start Command:
npm start
```

---

## Database

MongoDB Atlas

Configure:

* Database User
* Network Access
* Connection String

---

# 🔌 API Endpoints

## Authentication

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/get-me
```

---

## Resume Analysis

```http
POST /api/interview/analyze
```

---

## Resume Generator

```http
POST /api/resume/generate
GET  /api/resume/:id
```

---

## Reports

```http
GET /api/reports
GET /api/reports/:id
```

---

# 🔐 Authentication Flow

```text
User Login
    │
    ▼

Validate Credentials
    │
    ▼

Generate JWT
    │
    ▼

Store JWT in HTTP Only Cookie
    │
    ▼

Protected Route Access
    │
    ▼

Verify Token Middleware
```

---

# 🤖 AI Workflow

```text
Resume Upload
      │
      ▼

PDF Parsing
      │
      ▼

Extract Resume Content
      │
      ▼

Combine:
- Resume
- Job Description
- Self Description

      │
      ▼

Gemini AI Analysis
      │
      ▼

Zod Validation
      │
      ▼

Structured Report Output
```

---

# 🗄️ Database Schema Overview

## User

```javascript
{
  name,
  email,
  password,
  role
}
```

---

## Report

```javascript
{
  userId,
  matchScore,
  technicalQuestions,
  behavioralQuestions,
  skillGaps,
  preparationPlan
}
```

---

## Resume

```javascript
{
  userId,
  generatedContent,
  pdfUrl
}
```

---

# 📄 Resume Generation Flow

```text
User Inputs Data
       │
       ▼

Gemini Prompt
       │
       ▼

Generate ATS Resume
       │
       ▼

Store Resume
       │
       ▼

Generate PDF
       │
       ▼

Download Resume
```

---

# 🎯 Interview Report Generation Flow

```text
Resume Upload
      │
      ▼

Job Description
      │
      ▼

Self Description
      │
      ▼

Gemini Analysis
      │
      ▼

Generate

✓ Match Score
✓ Skill Gaps
✓ Technical Questions
✓ Behavioral Questions
✓ Preparation Plan
```

---

# 🧩 Challenges Solved

## Authentication

* JWT Cookies
* Protected Routes
* Session Persistence

## PDF Parsing

* Extracted structured resume content

## Gemini AI Integration

* Prompt Engineering
* Structured Output

## Validation

* Zod Schema Validation
* Malformed Response Handling

## PDF Export

* Puppeteer PDF Generation

---

# 🚀 Production Improvements

Implemented and solved:

* CORS Issues
* Cookie Authentication Issues
* Vercel Routing Issues
* React Router Refresh Problems
* Puppeteer Deployment Issues
* Gemini Formatting Errors
* MongoDB Validation Issues

---

# 🔮 Future Enhancements

* LinkedIn Profile Analysis
* Resume Versioning
* Interview Simulator
* AI Mock Interviews
* Voice Based Interviews
* Recruiter Dashboard
* Job Recommendation Engine
* Team Collaboration Features
* Resume Templates Marketplace

---

# 💡 Skills Demonstrated

### Frontend

* React.js
* Vite
* SCSS
* React Router
* Axios

### Backend

* Node.js
* Express.js
* REST APIs
* Authentication

### Database

* MongoDB
* Mongoose

### AI Engineering

* Prompt Engineering
* Gemini Integration
* Zod Validation

### DevOps

* Vercel
* Render
* MongoDB Atlas

### Software Engineering

* MVC Architecture
* Authentication
* Error Handling
* API Design
* Deployment

---

# 👨‍💻 Author

## Dhruv Talati

**B.Tech Information Technology Student**

A.D. Patel Institute of Technology (ADIT)

### Connect

* GitHub: https://github.com/yourusername
* LinkedIn: https://linkedin.com/in/yourprofile

### Technical Skills

* React.js
* Node.js
* Express.js
* MongoDB
* JavaScript
* REST APIs
* JWT Authentication
* Gemini AI Integration

---

# 🤝 Contributing Guide

Contributions are welcome!

### Steps

```bash
Fork Repository

Create Feature Branch

git checkout -b feature/new-feature

Commit Changes

git commit -m "Added new feature"

Push Changes

git push origin feature/new-feature

Create Pull Request
```

---

# 📜 License

This project is licensed under the MIT License.

```text
MIT License

Copyright (c) 2026 Dhruv Talati

Permission is hereby granted, free of charge,
to any person obtaining a copy of this software
and associated documentation files...
```

---

<div align="center">

### ⭐ If you found this project useful, consider giving it a star.

Built with ❤️ using MERN Stack, Gemini AI, and Modern Web Technologies.

</div>

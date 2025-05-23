# UniStack - Student Q&A Platform  

## Overview
UniStack is a community-driven Q&A platform tailored for ATU students, inspired by Stack Overflow but designed specifically for student-level questions and answers. The platform aims to create a supportive community among students, helping them with course-related queries and preparing them for real-world tech environments where collaboration is key.  

## Technologies Used  
- Frontend: React.js (Create React App)
- Backend: PHP
- Database: MySQL
- Deployment: Docker

## Project Structure
```plaintext
project/
├── apache.conf                  # Apache server configuration
├── dev.sh                       # Development script
├── docker-compose.yml           # Docker configuration
├── README.md                    # Main documentation
├── backend/                     # PHP backend
│   ├── ppiitprojectdb.sql       # Database schema
│   └── server.php               # Backend server logic
└── frontend/                    # React frontend application
    ├── public/                  # Public assets
    └── src/                     # Source code
        ├── components/          # React components
        │   ├── auth/            # Authentication components
        │   ├── home/            # Home page components
        │   └── questions/       # Question-related components
        └── ...
```

## Features
- User authentication (login/register)
- Question posting and answering
- Comment system
- Question management
- Answer management and acceptance

## Getting started
### Easiest
- Go to code and create a codespace
- In the terminal type -> ./dev.sh
- This will build the containers and launch the project
- Set port 3000 and 8000 to public
- Explore the website

## Project Purpose
This project was developed as part of the Professional Practice in IT module (3rd Year). It addresses the challenges students face when researching specific content like programming languages and concepts, creating a platform where students can help each other through knowledge sharing.
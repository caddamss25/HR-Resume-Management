# HR Resume Management System (RMS)

A modern, full-stack application designed to streamline the recruitment process by managing candidate resumes, tracking recruitment stages, and providing an efficient interface for HR teams.

## 🚀 Features

- **Candidate Management**: Add, update, and track candidates through various recruitment stages.
- **Resume Processing**: Upload and store resumes securely using Cloudinary.
- **Advanced Search & Filter**: Quickly find candidates by skills, experience, or status.
- **Secure Authentication**: Role-based access control (RBAC) with JWT (Admin, Manager, Recruiter).
- **Data Initialization**: Automatic creation of system administrator accounts on first run.
- **Responsive Design**: Clean and interactive UI built with React and Bootstrap 5.

## 🛠️ Tech Stack

### Backend
- **Framework**: Spring Boot 3.2.5
- **Language**: Java 17
- **Database**: [Turso](https://turso.tech/) (LibSQL/SQLite)
- **Security**: Spring Security + JWT
- **ORM**: Hibernate / Spring Data JPA
- **Storage**: Cloudinary API

### Frontend
- **Framework**: React 18 (Vite)
- **Styling**: Bootstrap 5 + Bootstrap Icons
- **HTTP Client**: Axios
- **Routing**: React Router DOM
- **File Handling**: React Dropzone

## 📋 Prerequisites

- **Java**: JDK 17 or higher
- **Node.js**: v18 or higher
- **Maven**: 3.8+
- **Turso Account**: For database hosting
- **Cloudinary Account**: For resume file storage

## ⚙️ Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/HR-Resume-Management.git
cd HR-Resume-Management
```

### 2. Backend Setup
Navigate to the `backend` directory and create a `.env` file based on the environment requirements.

```bash
cd backend
```

**Environment Variables (`backend/.env`):**
```properties
SPRING_DATASOURCE_URL=jdbc:dbeaver:libsql:your-turso-url
SPRING_DATASOURCE_USERNAME=
SPRING_DATASOURCE_PASSWORD=your-turso-token
JWT_SECRET=your-secure-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
FRONTEND_URL=http://localhost:5173
app.init-db=true
```

Run the backend:
```bash
mvn spring-boot:run
```

### 3. Frontend Setup
Navigate to the `frontend` directory and install dependencies.

```bash
cd ../frontend
npm install
```

**Environment Variables (`frontend/.env`):**
```properties
VITE_API_URL=http://localhost:8080/api
```

Run the frontend:
```bash
npm run dev
```

## 🔐 Role-Based Access
- **ADMIN**: Full system access, including user management.
- **MANAGER**: Access to all candidate data and recruitment status updates.
- **RECRUITER**: Access to add and view candidates within their assigned scope.

## 📄 License
This project is licensed under the MIT License.

---
Built with ❤️ by [Caddamss , unit of caddam technologies pvt ltd.](https://github.com/caddamss25)
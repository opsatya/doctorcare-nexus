# DoctorCare API Documentation

## Base URL
- **Development**: `http://localhost:3001`
- **Production**: TBD

## Authentication
All endpoints use mock JWT tokens for authentication. No real authentication is implemented.

---

## 🏥 Doctor Endpoints

### 1. Get All Doctors
```http
GET /api/doctors
```

**Response Example:**
```json
[
  {
    "id": 1,
    "name": "Dr. Sarah Johnson",
    "email": "sarah.johnson@doctorcare.com",
    "specialization": "Cardiology",
    "experience": 15,
    "rating": 4.9,
    "phone": "+91-99887-76543",
    "consultationFee": 1200,
    "location": "Delhi, India",
    "nextAvailable": "Today 3 PM",
    "availability": ["Monday", "Wednesday", "Friday"],
    "about": "Experienced cardiologist with expertise in preventive care and advanced cardiac procedures."
  }
]
```

### 2. Get Single Doctor
```http
GET /api/doctors/:id
```

**Parameters:**
- `id` (number): Doctor ID

**Response Example:**
```json
{
  "id": 1,
  "name": "Dr. Sarah Johnson",
  "email": "sarah.johnson@doctorcare.com",
  "specialization": "Cardiology",
  "experience": 15,
  "rating": 4.9,
  "phone": "+91-99887-76543",
  "consultationFee": 1200,
  "location": "Delhi, India",
  "nextAvailable": "Today 3 PM"
}
```

### 3. Doctor Login
```http
POST /api/doctor/login
```

**Request Body:**
```json
{
  "email": "sarah.johnson@doctorcare.com",
  "password": "password123"
}
```

**Success Response:**
```json
{
  "success": true,
  "doctor": {
    "id": 1,
    "name": "Dr. Sarah Johnson",
    "email": "sarah.johnson@doctorcare.com",
    "specialization": "Cardiology"
  },
  "token": "mock-jwt-token-doctor-1"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### 4. Doctor Signup
```http
POST /api/doctor/signup
```

**Request Body:**
```json
{
  "name": "Dr. John Doe",
  "email": "john.doe@doctorcare.com",
  "password": "password123",
  "specialization": "General Medicine",
  "licenseNumber": "DL12345",
  "phone": "+91-98765-43210"
}
```

**Success Response:**
```json
{
  "success": true,
  "doctor": {
    "id": 4,
    "name": "Dr. John Doe",
    "email": "john.doe@doctorcare.com",
    "specialization": "General Medicine",
    "isVerified": false
  },
  "token": "mock-jwt-token-doctor-4"
}
```

---

## 👤 Patient Endpoints

### 1. Get All Patients
```http
GET /api/patients
```

**Response Example:**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@email.com",
    "phone": "+1-555-0123",
    "dateOfBirth": "1985-03-15",
    "address": "123 Main St, New York, NY",
    "emergencyContact": "Jane Doe - +1-555-0124"
  }
]
```

### 2. Patient Login
```http
POST /api/patient/login
```

**Request Body:**
```json
{
  "email": "john.doe@email.com",
  "password": "password123"
}
```

**Success Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@email.com",
    "phone": "+1-555-0123"
  },
  "token": "mock-jwt-token-patient-1"
}
```

---

## 📅 Appointment Endpoints

### 1. Get All Appointments
```http
GET /api/appointments
```

**Response Example:**
```json
[
  {
    "id": 1,
    "doctorId": 1,
    "doctorName": "Dr. Sarah Johnson",
    "specialization": "Cardiology",
    "patientName": "John Doe",
    "email": "john.doe@email.com",
    "phone": "+1-555-0123",
    "date": "2025-07-26",
    "time": "10:00 AM",
    "status": "pending",
    "reason": "Regular checkup",
    "createdAt": "2025-07-25T00:00:00Z"
  }
]
```

### 2. Create Appointment
```http
POST /api/appointments
```

**Request Body:**
```json
{
  "patientName": "John Doe",
  "email": "john.doe@email.com",
  "phone": "+1-555-0123",
  "doctorId": 1,
  "date": "2025-07-26",
  "time": "10:00 AM",
  "reason": "Regular checkup"
}
```

**Success Response:**
```json
{
  "id": 4,
  "patientName": "John Doe",
  "email": "john.doe@email.com",
  "phone": "+1-555-0123",
  "doctorId": 1,
  "doctorName": "Dr. Sarah Johnson",
  "specialization": "Cardiology",
  "date": "2025-07-26",
  "time": "10:00 AM",
  "reason": "Regular checkup",
  "status": "pending",
  "createdAt": "2025-07-28T12:00:00Z"
}
```

### 3. Update Appointment Status
```http
PATCH /api/appointments/:id
```

**Parameters:**
- `id` (number): Appointment ID

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Success Response:**
```json
{
  "id": 1,
  "status": "confirmed",
  "patientName": "John Doe",
  "doctorName": "Dr. Sarah Johnson",
  "date": "2025-07-26",
  "time": "10:00 AM"
}
```

---

## 📊 Status Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 201  | Created |
| 400  | Bad Request |
| 401  | Unauthorized |
| 404  | Not Found |
| 500  | Internal Server Error |

---

## 🔐 Test Credentials

### Doctors
- **Email**: `sarah.johnson@doctorcare.com` **Password**: `password123`
- **Email**: `michael.chen@doctorcare.com` **Password**: `password123`
- **Email**: `emily.rodriguez@doctorcare.com` **Password**: `password123`

### Patients
- **Email**: `john.doe@email.com` **Password**: `password123`
- **Email**: `jane.smith@email.com` **Password**: `password123`

---

## 🚀 Setup Instructions

### Backend Setup
1. Navigate to backend folder: `cd backend`
2. Install dependencies: `npm install`
3. Start server: `npm start`
4. Server runs on: `http://localhost:3001`

### Frontend Setup
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Frontend runs on: `http://localhost:5173`

---

## 📝 Notes

- All passwords are stored in plain text (for demo purposes only)
- JWT tokens are mock tokens for demonstration
- Database changes persist in `db.json` file
- CORS is enabled for `localhost:5173` and `localhost:3000`
- Rate limiting: 100 requests per 15 minutes per IP
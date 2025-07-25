# DoctorCare Backend (JSON Server)

This is a mock backend for the DoctorCare application using JSON Server.

## Setup

1. Navigate to the backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

The server will run on `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/doctor/login` - Doctor login
- `POST /api/doctor/signup` - Doctor registration

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID
- `PUT /api/doctors/:id` - Update doctor
- `DELETE /api/doctors/:id` - Delete doctor

### Appointments
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

## Development

Run with delay for more realistic API responses:
```bash
npm run dev
```

## Test Credentials

### Doctors
- Email: `sarah.johnson@doctorcare.com`, Password: `password123`
- Email: `michael.chen@doctorcare.com`, Password: `password123`
- Email: `emily.rodriguez@doctorcare.com`, Password: `password123`

### Admin
- Email: `admin@doctorcare.com`, Password: `admin123`
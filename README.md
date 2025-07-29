# DoctorCare Nexus - Healthcare Management System

A modern, full-stack healthcare management application built with React, TypeScript, and Node.js. This system provides a comprehensive platform for patients to book appointments and doctors to manage their practice.

## 🏗️ Architecture Overview

The application follows a modern client-server architecture with the following key components:

- **Frontend**: React 18 with TypeScript, Vite, and Tailwind CSS
- **State Management**: Recoil for global state management
- **Backend**: Node.js with JSON Server for API endpoints
- **Mock API**: MSW (Mock Service Worker) for development and testing
- **Authentication**: JWT-based authentication with localStorage persistence
- **UI Components**: shadcn UI with custom styling

## 📁 Project Structure

```
doctorcare-nexus/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── auth/           # Authentication components
│   │   ├── layout/         # Layout components
│   │   ├── sections/       # Page sections
│   │   └── ui/             # Base UI components (Shadcn UI)
│   ├── pages/              # Application pages/routes
│   ├── lib/                # Utilities and configurations
│   │   ├── recoil/         # State management
│   │   └── validation/     # Form validation schemas
│   ├── mocks/              # MSW mock handlers
│   └── hooks/              # Custom React hooks
├── backend/                # Backend server
│   ├── server.js           # Express server with JSON Server
│   └── db.json             # Mock database
└── public/                 # Static assets
```

## 🔄 Mock API Implementation

### MSW (Mock Service Worker) Setup

The application uses MSW for API mocking during development, providing a realistic API experience without a real backend.

#### Key Files:
- [`src/mocks/handlers.ts`](src/mocks/handlers.ts) - Defines all API endpoints and responses
- [`src/mocks/browser.ts`](src/mocks/browser.ts) - Configures MSW worker for browser
- [`public/mockServiceWorker.js`](public/mockServiceWorker.js) - MSW service worker script

#### Mock API Endpoints:

**Doctor Management:**
- `GET /api/doctors` - Fetch all doctors
- `GET /api/doctors/:id` - Fetch specific doctor details

**Authentication:**
- `POST /api/patient/login` - Patient authentication
- `POST /api/doctor/login` - Doctor authentication  
- `POST /api/doctor/signup` - Doctor registration

**Appointments:**
- `GET /api/appointments` - Fetch appointments
- `GET /api/appointments/:id` - Fetch specific appointment details
- `POST /api/appointments` - Create new appointment

**Doctor Dashboard:**
- `GET /api/doctor/profile` - Get doctor profile (requires auth)
- `GET /api/doctor/appointments` - Get doctor's appointments
- `GET /api/doctor/stats` - Get dashboard statistics

#### Mock Data Features:
- **Realistic Response Times**: Simulated network delays (300-800ms)
- **Authentication Simulation**: JWT token generation and validation
- **Error Handling**: Proper HTTP status codes and error responses
- **Console Logging**: Debug information for API calls

```typescript
// Example from handlers.ts
http.get('http://localhost:3001/api/doctors', async () => {
  console.log('🔧 MSW: Handling GET /api/doctors');
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  
  return HttpResponse.json([
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      specialization: "Cardiology",
      // ... more doctor data
    }
  ]);
})
```

## 🗄️ State Management with Recoil

### Atoms Configuration

The application uses Recoil for predictable state management with the following atoms:

#### [`src/lib/recoil/atoms.ts`](src/lib/recoil/atoms.ts)

**Core Interfaces:**
```typescript
interface Doctor {
  id: string;
  name: string;
  email: string;
  specialization: string;
  licenseNumber: string;
  phone: string;
  profileImage?: string;
}

interface Patient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  doctor: Doctor | null;
  patient: Patient | null;
  token: string | null;
}
```

**State Atoms:**
- `authState` - Manages authentication state for both doctors and patients
- `loadingState` - Global loading state management

**Key Features:**
- **Persistent Authentication**: State persists across browser sessions using localStorage
- **Dual User Types**: Supports both doctor and patient authentication
- **Automatic Hydration**: Loads auth state from localStorage on app initialization
- **Type Safety**: Full TypeScript support with proper interfaces

```typescript
// Authentication state with localStorage persistence
export const authState = atom<AuthState>({
  key: 'authState',
  default: getInitialAuthState(), // Loads from localStorage
});
```

### State Persistence Strategy

The application implements a dual-storage approach:
- **Doctor Auth**: Stored in `doctorcare_auth` localStorage key
- **Patient Auth**: Stored in `doctorcare_patient_auth` localStorage key

This allows the system to maintain separate authentication contexts for different user types.

## 🔐 Authentication System

### Authentication Flow

#### 1. Login Process
The authentication system supports both doctors and patients through a unified login modal:

**Component**: [`src/components/auth/PatientLoginModal.tsx`](src/components/auth/PatientLoginModal.tsx)

**Flow Steps:**
1. User selects login type (Patient/Doctor)
2. Form validation using Yup schemas
3. API call to appropriate endpoint (`/api/patient/login` or `/api/doctor/login`)
4. JWT token received and stored
5. User data stored in Recoil state and localStorage
6. Redirect to appropriate dashboard

```typescript
// Login submission handler
const onSubmit = async (data: LoginFormData) => {
  const endpoint = loginType === 'patient' ? '/api/patient/login' : '/api/doctor/login';
  const response = await fetch(`http://localhost:3001${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (response.ok) {
    const result = await response.json();
    // Update Recoil state and localStorage
    setAuth({
      isAuthenticated: true,
      [loginType]: result.user || result.doctor,
      token: result.token,
    });
  }
};
```

#### 2. Route Protection
**Component**: [`src/components/auth/ProtectedRoute.tsx`](src/components/auth/ProtectedRoute.tsx)

```typescript
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const auth = useRecoilValue(authState);

  if (!auth.isAuthenticated || (!auth.doctor && !auth.patient)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

#### 3. Demo Credentials
For testing purposes, the application provides demo credentials:

**Doctor Demo:**
- Email: `teste@example.com`
- Password: `123456`

**Patient Demo:**
- Email: `patient@example.com`
- Password: `123456`

### Form Validation

**Validation Schemas**: [`src/lib/validation/schemas.ts`](src/lib/validation/schemas.ts)

The application uses Yup for robust form validation:

```typescript
export const doctorLoginSchema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

export const patientLoginSchema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});
```

## 🔄 Execution Flow

### Application Initialization

1. **MSW Setup** ([`src/main.tsx`](src/main.tsx)):
   ```typescript
   async function enableMocking() {
     if (process.env.NODE_ENV !== 'development') return;
     const { worker } = await import('./mocks/browser');
     return worker.start();
   }
   ```

2. **Recoil State Hydration**: Authentication state loads from localStorage
3. **Route Configuration**: React Router handles navigation and protected routes

### Data Flow Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React App     │    │   Recoil State   │    │   localStorage  │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ Components  │◄┼────┼►│  authState   │◄┼────┼►│ Auth Data   │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘ │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │                 │
│ │ API Calls   │ │    │ │ loadingState │ │    │                 │
│ └─────────────┘ │    │ └──────────────┘ │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                                               
         ▼                                               
┌─────────────────┐    ┌──────────────────┐              
│   MSW/Backend   │    │   Mock Handlers  │              
│                 │    │                  │              
│ ┌─────────────┐ │    │ ┌──────────────┐ │              
│ │ JSON Server │ │    │ │ HTTP Mocks   │ │              
│ └─────────────┘ │    │ └──────────────┘ │              
└─────────────────┘    └──────────────────┘              
```

### API Communication Pattern

1. **Component Action**: User interaction triggers API call
2. **Loading State**: Global loading state updated via Recoil
3. **MSW Interception**: Mock Service Worker intercepts HTTP requests
4. **Response Processing**: Data processed and state updated
5. **UI Update**: Components re-render with new data

## 🖥️ Backend Server Implementation

### Server.js Overview

**File**: [`backend/server.js`](backend/server.js)

The backend server is built using JSON Server with custom middleware for enhanced functionality:

#### Key Features:

**1. Security Middleware:**
```javascript
// Helmet for security headers
server.use(helmet());

// Rate limiting (100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
server.use(limiter);
```

**2. CORS Configuration:**
```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3000', 'http://localhost:5173'],
  optionsSuccessStatus: 200
};
```

**3. Custom Authentication Endpoints:**
- `POST /api/doctor/login` - Doctor authentication with password verification
- `POST /api/patient/login` - Patient authentication
- `POST /api/doctor/signup` - New doctor registration with duplicate checking

**4. Data Persistence:**
```javascript
// Automatic file-based persistence
fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
```

#### Database Structure ([`backend/db.json`](backend/db.json)):

```json
{
  "doctors": [
    {
      "id": 1,
      "name": "Dr. Sarah Johnson",
      "email": "sarah.johnson@doctorcare.com",
      "specialization": "Cardiology",
      "experience": 15,
      "rating": 4.9,
      // ... additional fields
    }
  ],
  "patients": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@email.com",
      "phone": "+1-555-0123",
      // ... additional fields
    }
  ],
  "appointments": [
    {
      "id": 1,
      "doctorId": 1,
      "patientName": "John Doe",
      "date": "2025-07-26",
      "time": "10:00 AM",
      "status": "pending"
      // ... additional fields
    }
  ]
}
```

### API Endpoints

**Authentication:**
- `POST /api/doctor/login` - Doctor login
- `POST /api/patient/login` - Patient login
- `POST /api/doctor/signup` - Doctor registration

**Data Retrieval:**
- `GET /api/doctors` - List all doctors
- `GET /api/doctors/:id` - Get specific doctor
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `PATCH /api/appointments/:id` - Update appointment status

## 🔧 Handler Functions & Data Communication

### Frontend API Communication

The application uses native `fetch` API for HTTP requests with consistent error handling:

```typescript
// Example API call pattern
const response = await fetch(`http://localhost:3001/api/doctors`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` // When authentication required
  }
});

const data = await response.json();
```

### Error Handling Strategy

**1. Network Errors:**
```typescript
try {
  const response = await fetch(endpoint);
  // Handle response
} catch (error) {
  toast({
    title: 'Connection error',
    description: 'Could not connect to the server.',
    variant: 'destructive',
  });
}
```

**2. HTTP Errors:**
```typescript
if (!response.ok) {
  const errorData = await response.json();
  toast({
    title: 'API Error',
    description: errorData.message || 'Something went wrong',
    variant: 'destructive',
  });
}
```

### Data Transformation

The application handles data transformation between frontend and backend formats:

**Authentication Response Processing:**
```typescript
// Backend response transformation
if (loginType === 'doctor') {
  const authData = {
    isAuthenticated: true,
    doctor: result.doctor,
    patient: null,
    token: result.token,
  };
  setAuth(authData);
  localStorage.setItem('doctorcare_auth', JSON.stringify(authData));
}
```

## 🚀 Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd doctorcare-nexus
   ```

2. **Install dependencies:**
   ```bash
   npm install
   cd backend && npm install
   ```

3. **Start development servers:**
   
   **Frontend (Terminal 1):**
   ```bash
   npm run dev
   # Runs on http://localhost:8080
   ```
   
   **Backend (Terminal 2):**
   ```bash
   cd backend
   node server.js
   # Runs on http://localhost:3001
   ```

### Environment Configuration

**Frontend Configuration:**
- Vite dev server: `localhost:8080`
- API URL: `http://localhost:3001` (configurable via `VITE_API_URL`)

**Backend Configuration:**
- Server port: `3001` (configurable via `PORT` env var)
- CORS origins: Configured for development and production

## 🧪 Testing & Development Features

### Mock Service Worker Benefits

1. **Offline Development**: Work without backend dependency
2. **Consistent Testing**: Predictable API responses
3. **Network Simulation**: Realistic loading states and error conditions
4. **Debug Logging**: Console output for API interactions

### Development Tools

- **Hot Reload**: Vite provides instant updates
- **TypeScript**: Full type safety across the application
- **ESLint**: Code quality and consistency
- **Tailwind CSS**: Utility-first styling with custom design system

## 📱 User Interface & Experience

### Design System

- **Component Library**: Radix UI primitives with custom styling
- **Styling**: Tailwind CSS with custom design tokens
- **Animations**: Framer Motion for smooth interactions
- **Icons**: Lucide React icon library
- **Responsive**: Mobile-first responsive design

### Key UI Components

- **Authentication Modal**: Unified login/signup experience
- **Protected Routes**: Automatic authentication checking
- **Toast Notifications**: User feedback for actions
- **Loading States**: Global loading management
- **Form Validation**: Real-time validation with error messages

## 🔒 Security Features

### Frontend Security
- **Input Validation**: Yup schema validation
- **XSS Protection**: React's built-in XSS protection
- **Route Protection**: Authentication-based route access
- **Token Storage**: Secure localStorage implementation

### Backend Security
- **Helmet**: Security headers middleware
- **Rate Limiting**: API request throttling
- **CORS**: Cross-origin request protection
- **Input Sanitization**: JSON parsing with validation

## 🚀 Deployment Considerations

### Production Build
```bash
npm run build
```

### Environment Variables
- `VITE_API_URL`: Backend API URL
- `NODE_ENV`: Environment mode
- `FRONTEND_URL`: Frontend URL for CORS (production)

### Deployment Architecture
- **Frontend**: Static hosting (Vercel, Netlify)
- **Backend**: Node.js hosting (Heroku, Railway)
- **Database**: Replace JSON Server with proper database (PostgreSQL, MongoDB)

## 📈 Future Enhancements

### Planned Features
- Real-time notifications
- Video consultation integration
- Advanced appointment scheduling
- Payment processing
- Medical records management
- Multi-language support

### Technical Improvements
- Database migration from JSON Server
- Real JWT implementation
- API caching with React Query
- Progressive Web App features
- Comprehensive testing suite

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. MSW "Failed to fetch" Error

**Error**: `TypeError: Failed to fetch` in mockServiceWorker.js

**Cause**: Missing MSW handlers for specific API endpoints

**Solution**:
- Check the browser console for the exact endpoint that's failing
- Ensure all API endpoints used in your components have corresponding handlers in [`src/mocks/handlers.ts`](src/mocks/handlers.ts)
- Common missing endpoints:
  - `GET /api/appointments/:id` - Individual appointment details
  - `PATCH /api/appointments/:id` - Update appointment status
  - `DELETE /api/appointments/:id` - Cancel appointments

**Example Fix**:
```typescript
// Add missing handler to src/mocks/handlers.ts
http.get('http://localhost:3001/api/appointments/:id', async ({ params }) => {
  console.log('🔧 MSW: Handling GET /api/appointments/:id', params.id);
  // Return appropriate mock data
  return HttpResponse.json(mockAppointment);
})
```

#### 2. Backend Server Connection Issues

**Error**: `net::ERR_FAILED` when trying to reach `localhost:3001`

**Solutions**:
1. **Start Backend Server**:
   ```bash
   cd backend
   node server.js
   ```

2. **Check Port Conflicts**:
   - Ensure port 3001 is not used by another process
   - Modify port in `backend/server.js` if needed

3. **CORS Issues**:
   - Verify CORS configuration in `backend/server.js`
   - Check that frontend URL is in allowed origins

#### 3. Authentication State Issues

**Problem**: User gets logged out on page refresh

**Solution**: Check localStorage persistence in browser DevTools:
- Application tab → Local Storage → `localhost:8080`
- Look for `doctorcare_auth` or `doctorcare_patient_auth` keys
- Clear localStorage if corrupted: `localStorage.clear()`

#### 4. MSW Not Intercepting Requests

**Problem**: API calls bypass MSW and hit real backend

**Solutions**:
1. **Check MSW Initialization**:
   ```typescript
   // In src/main.tsx
   enableMocking().then(() => {
     // App should render after MSW starts
   });
   ```

2. **Verify Service Worker Registration**:
   - Check browser DevTools → Application → Service Workers
   - `mockServiceWorker.js` should be registered and active

3. **Clear Browser Cache**:
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Or disable cache in DevTools Network tab

#### 5. Development Server Issues

**Problem**: Frontend not loading or showing blank page

**Solutions**:
1. **Check Node.js Version**: Ensure Node.js 18+ is installed
2. **Clear Dependencies**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
3. **Check Port Availability**: Default port 8080 might be in use
4. **Environment Variables**: Verify `VITE_API_URL` if set

### Debug Mode

Enable detailed logging by opening browser DevTools Console. MSW handlers include debug logs prefixed with `🔧 MSW:` to help track API interactions.

### Getting Help

1. Check browser DevTools Console for error messages
2. Verify Network tab shows intercepted requests (MSW icon)
3. Ensure both frontend (8080) and backend (3001) servers are running
4. Test with demo credentials provided in login modal

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**DoctorCare Nexus** - Connecting patients with healthcare providers through modern technology.

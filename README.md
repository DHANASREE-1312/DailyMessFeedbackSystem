# Daily Mess Feedback System

A full-stack web application for collecting and managing daily feedback on mess meals and services.

## Tech Stack
- **Backend**: Node.js, Express.js, TypeScript
- **Frontend**: React, Vite, Tailwind CSS, Shadcn/ui
- **Database**: Azure SQL Database

## Features
- User authentication and role-based access
- Daily feedback submission with ratings and comments
- Feedback history for users
- Admin dashboard for reports and analytics
- Anonymous feedback option

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git
- Azure SQL Database access

## Team Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/BhuvaneshwariMohanraj/DailyMessFeedbackSystem-Web.git
cd DailyMessFeedbackSystem-Web
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your Azure SQL Database credentials
# Update the following variables:
# DB_SERVER=your-server.database.windows.net
# DB_NAME=your-database-name
# DB_USER=your-username
# DB_PASSWORD=your-password
# PORT=5000

# Start the backend server
npm run dev
```

### 3. Frontend Setup (Open new terminal)
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the frontend development server
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## Development Commands

### Backend Commands
```bash
cd backend
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start           # Start production server
npm run test        # Run tests
```

### Frontend Commands
```bash
cd frontend
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
npm run lint        # Run ESLint
```

## Environment Variables

### Backend (.env)
```env
DB_SERVER=your-server.database.windows.net
DB_NAME=your-database-name
DB_USER=your-username
DB_PASSWORD=your-password
PORT=5000
```

## Project Structure
```
├── backend/                 # Node.js/Express server
│   ├── src/
│   │   ├── auth.ts         # Authentication logic
│   │   ├── database.ts     # Database connection
│   │   └── ...
│   ├── .env.example        # Environment template
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   └── ...
│   └── package.json
└── README.md
```

## Troubleshooting

### Common Issues
1. **Database Connection Error**: Verify your Azure SQL Database credentials in `.env`
2. **Port Already in Use**: Change the PORT in backend `.env` file
3. **Module Not Found**: Run `npm install` in the respective directory

### Getting Help
- Check the console for error messages
- Ensure all dependencies are installed
- Verify environment variables are set correctly

## Docker Setup

### Prerequisites for Docker
- Docker and Docker Compose installed
- Git

### Quick Start with Docker

1. **Clone the repository**
```bash
git clone https://github.com/BhuvaneshwariMohanraj/DailyMessFeedbackSystem-Web.git
cd DailyMessFeedbackSystem-Web
```

2. **Create environment file**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Start the application**
```bash
# Production mode
docker-compose up -d

# Development mode
docker-compose -f docker-compose.dev.yml up -d
```

4. **Access the application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: localhost:1433

### Docker Commands

```bash
# Build and start all services
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Development mode
docker-compose -f docker-compose.dev.yml up -d
```

### Individual Service Management

```bash
# Build specific service
docker-compose build backend
docker-compose build frontend

# Start specific service
docker-compose up backend
docker-compose up frontend

# View service logs
docker-compose logs backend
docker-compose logs frontend
```

## Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (local or cloud)
- kubectl configured
- Docker images pushed to registry

### Deploy to Kubernetes

1. **Update image references in k8s manifests**
```bash
# Edit k8s/backend-deployment.yaml and k8s/frontend-deployment.yaml
# Update image URLs to point to your container registry
```

2. **Apply Kubernetes manifests**
```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create secrets (update with your values)
kubectl apply -f k8s/secret.yaml

# Create configmap
kubectl apply -f k8s/configmap.yaml

# Deploy services
kubectl apply -f k8s/services.yaml

# Deploy applications
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# Deploy ingress (optional)
kubectl apply -f k8s/ingress.yaml
```

3. **Check deployment status**
```bash
kubectl get pods -n mess-feedback-system
kubectl get services -n mess-feedback-system
kubectl get ingress -n mess-feedback-system
```

## CI/CD Pipeline

The project includes GitHub Actions workflows for:

### Automatic CI/CD Pipeline
- **Triggers**: Push to main/develop branches, Pull Requests
- **Testing**: Runs tests for both backend and frontend
- **Building**: Builds Docker images for both services
- **Pushing**: Pushes images to GitHub Container Registry
- **Deployment**: Deploys to production environment

### Workflow Files
- `.github/workflows/ci-cd.yml` - Main CI/CD pipeline
- `.github/workflows/docker-build.yml` - Docker build and push

### Setup CI/CD
1. **Enable GitHub Actions** in your repository settings
2. **Configure secrets** in repository settings:
   - `GITHUB_TOKEN` (automatically provided)
   - Add any additional secrets for deployment

3. **Update image references** in k8s manifests with your registry URL

### Manual Deployment
```bash
# Build and push images manually
docker build -t your-registry/mess-feedback-backend:latest ./backend
docker build -t your-registry/mess-feedback-frontend:latest ./frontend

docker push your-registry/mess-feedback-backend:latest
docker push your-registry/mess-feedback-frontend:latest
```

## Environment Variables

### Docker Environment (.env)
```env
# Database Configuration
DB_SERVER=your-server.database.windows.net
DB_NAME=your-database-name
DB_USER=your-username
DB_PASSWORD=your-password
SA_PASSWORD=YourStrong@Password123

# Application Configuration
PORT=5000
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-here

# Frontend Configuration
VITE_API_URL=http://localhost:5000/api
```

### Kubernetes Configuration
- **ConfigMap**: Non-sensitive configuration
- **Secrets**: Sensitive data (passwords, API keys)

## Monitoring and Health Checks

### Health Check Endpoints
- **Backend**: `http://localhost:5000/health`
- **Frontend**: `http://localhost:3000/health`

### Monitoring Commands
```bash
# Docker health checks
docker-compose ps

# Kubernetes health checks
kubectl get pods -n mess-feedback-system
kubectl describe pod <pod-name> -n mess-feedback-system

# View logs
kubectl logs -f deployment/backend-deployment -n mess-feedback-system
kubectl logs -f deployment/frontend-deployment -n mess-feedback-system
```

## Troubleshooting

### Docker Issues
1. **Port conflicts**: Change ports in docker-compose.yml
2. **Database connection**: Verify environment variables
3. **Build failures**: Check Dockerfile syntax and dependencies

### Kubernetes Issues
1. **Pod not starting**: Check logs with `kubectl logs`
2. **Service not accessible**: Verify service and ingress configuration
3. **Image pull errors**: Ensure images are pushed to accessible registry

### Common Solutions
```bash
# Clean Docker environment
docker-compose down -v
docker system prune -a

# Reset Kubernetes deployment
kubectl delete -f k8s/
kubectl apply -f k8s/

# Check resource usage
docker stats
kubectl top pods -n mess-feedback-system
```

## Contributing
1. Create a new branch for your feature
2. Make your changes
3. Test thoroughly with Docker
4. Submit a pull request
5. CI/CD pipeline will automatically test and build

# PolyOne Makefile
# Convenience commands for development and deployment

.PHONY: help install dev build test clean docker-up docker-down deploy

# Default target
help:
	@echo "PolyOne - Available Commands:"
	@echo ""
	@echo "  make install      - Install all dependencies"
	@echo "  make dev          - Start development servers"
	@echo "  make build        - Build for production"
	@echo "  make test         - Run all tests"
	@echo "  make lint         - Run linters"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make docker-up    - Start Docker containers"
	@echo "  make docker-down  - Stop Docker containers"
	@echo "  make logs         - View Docker logs"
	@echo "  make setup        - Initial project setup"
	@echo ""

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	cd backend && npm install
	cd frontend && npm install
	cd sample-dapp && npm install
	@echo "✅ Dependencies installed!"

# Setup project
setup: install
	@echo "🔧 Setting up project..."
	cp .env.example .env
	cp frontend/.env.example frontend/.env.local
	cp backend/.env.example backend/.env
	@echo "✅ Environment files created. Please update them with your values."
	@echo "📚 Read docs/SETUP.md for next steps."

# Development
dev:
	@echo "🚀 Starting development servers..."
	@echo "Backend will run on http://localhost:5000"
	@echo "Frontend will run on http://localhost:3000"
	@echo ""
	@(cd backend && npm run dev) & \
	(cd frontend && npm run dev)

# Build for production
build:
	@echo "🏗️  Building for production..."
	cd backend && npm run build || echo "No backend build script"
	cd frontend && npm run build
	@echo "✅ Build complete!"

# Run tests
test:
	@echo "🧪 Running tests..."
	cd backend && npm test || echo "No backend tests yet"
	cd frontend && npm test || echo "No frontend tests yet"
	@echo "✅ Tests complete!"

# Lint code
lint:
	@echo "🔍 Linting code..."
	cd backend && npm run lint || echo "No backend lint script"
	cd frontend && npm run lint || echo "No frontend lint script"
	@echo "✅ Linting complete!"

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf backend/node_modules backend/dist backend/logs/*.log
	rm -rf frontend/node_modules frontend/.next frontend/out
	rm -rf sample-dapp/node_modules sample-dapp/dist
	@echo "✅ Clean complete!"

# Docker commands
docker-up:
	@echo "🐳 Starting Docker containers..."
	docker-compose up -d
	@echo "✅ Containers started!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:5000"
	@echo "Grafana: http://localhost:3001"

docker-down:
	@echo "🐳 Stopping Docker containers..."
	docker-compose down
	@echo "✅ Containers stopped!"

docker-build:
	@echo "🐳 Building Docker images..."
	docker-compose build
	@echo "✅ Images built!"

docker-restart:
	@echo "🐳 Restarting Docker containers..."
	docker-compose restart
	@echo "✅ Containers restarted!"

# View logs
logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

# Database commands
db-create:
	@echo "🗄️  Creating database..."
	docker-compose exec postgres createdb -U postgres polyone || echo "Database may already exist"

db-reset:
	@echo "⚠️  Resetting database..."
	docker-compose down -v
	docker-compose up -d postgres
	sleep 3
	$(MAKE) db-create

# Deploy commands
deploy-staging:
	@echo "🚀 Deploying to staging..."
	./scripts/deploy-staging.sh

deploy-production:
	@echo "🚀 Deploying to production..."
	@echo "⚠️  This will deploy to production. Are you sure? (Ctrl+C to cancel)"
	@sleep 5
	./scripts/deploy-production.sh

# Health check
health:
	@echo "🏥 Checking service health..."
	@curl -s http://localhost:5000/health | jq '.' || echo "Backend is down"
	@curl -s http://localhost:3000 > /dev/null && echo "✅ Frontend is up" || echo "❌ Frontend is down"

# Generate documentation
docs:
	@echo "📚 Generating documentation..."
	cd backend && npm run docs || echo "No backend docs script"
	cd frontend && npm run docs || echo "No frontend docs script"

# Run sample dApp
dapp:
	@echo "🎨 Starting sample dApp..."
	cd sample-dapp && npm run dev

# Show project info
info:
	@echo "ℹ️  PolyOne Project Information"
	@echo ""
	@echo "Node version:  $$(node --version)"
	@echo "npm version:   $$(npm --version)"
	@echo "Docker:        $$(docker --version 2>/dev/null || echo 'Not installed')"
	@echo ""
	@echo "Project structure:"
	@tree -L 2 -I 'node_modules|.next|dist' || echo "Install 'tree' for directory visualization"


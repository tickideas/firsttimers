#!/bin/bash

# First Timers Docker Development Scripts

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    echo "Usage: ./docker-scripts.sh [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  up          Start all services in development mode"
    echo "  down        Stop all services"
    echo "  build       Build all services"
    echo "  reset       Stop, remove containers, volumes, and restart"
    echo "  logs        Show logs from all services"
    echo "  migrate     Run database migrations"
    echo "  seed        Seed the database"
    echo "  test        Run tests in Docker containers"
    echo "  pgadmin     Open pgAdmin in browser"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./docker-scripts.sh up"
    echo "  ./docker-scripts.sh build"
    echo "  ./docker-scripts.sh down"
}

# Check if docker-compose is available
check_docker() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "docker-compose is not installed or not in PATH"
        exit 1
    fi
    
    if ! docker-compose version &> /dev/null; then
        print_error "docker-compose is not working properly"
        exit 1
    fi
}

# Start development environment
start_dev() {
    print_status "Starting First Timers development environment..."
    print_status "Using docker-compose profile: dev"
    
    # Copy environment file for Docker
    if [ -f .env.docker ]; then
        cp .env.docker .env
        print_status "Copied .env.docker to .env"
    else
        print_warning ".env.docker file not found, using existing .env"
    fi
    
    # Build and start services
    docker-compose -f docker-compose.yaml --profile dev up --build -d
    
    # Wait for services to be healthy
    print_status "Waiting for database to be healthy..."
    until docker-compose -f docker-compose.yaml ps | grep "firsttimers_postgres" | grep -q "healthy"; do
        sleep 2
        print_status "Waiting for PostgreSQL to be healthy..."
    done
    
    print_status "Waiting for redis to be healthy..."
    until docker-compose -f docker-compose.yaml ps | grep "firsttimers_redis" | grep -q "healthy"; do
        sleep 2
        print_status "Waiting for Redis to be healthy..."
    done
    
    print_success "Development environment started successfully!"
    print_status "Services:"
    print_status "  - Web: http://localhost:3000"
    print_status "  - API: http://localhost:3001/health"
    print_status "  - pgAdmin: http://localhost:5050 (user: admin@firsttimers.org)"
    print_status ""
    print_status "To view logs: ./docker-scripts.sh logs"
    print_status "To stop: ./docker-scripts.sh down"
}

# Build all services
build_services() {
    print_status "Building all services..."
    docker-compose -f docker-compose.yaml --profile dev build
    print_success "All services built successfully!"
}

# Stop all services
stop_services() {
    print_status "Stopping all services..."
    docker-compose -f docker-compose.yaml down
    print_success "All services stopped!"
}

# Reset environment (full cleanup and restart)
reset_environment() {
    print_warning "This will remove all containers, volumes, and restart the environment!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Stopping and removing all services..."
        docker-compose -f docker-compose.yaml down -v --remove-orphans
        
        print_status "Removing volumes..."
        docker volume rm firsttimers_postgres_data firsttimers_redis_data 2>/dev/null || true
        
        print_status "Rebuilding and restarting..."
        start_dev
        print_success "Environment reset complete!"
    else
        print_status "Reset cancelled"
    fi
}

# Show logs
show_logs() {
    print_status "Showing logs from all services (press Ctrl+C to exit)..."
    docker-compose -f docker-compose.yaml logs -f --tail=50
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    docker-compose -f docker-compose.yaml exec api bun run prisma:migrate
    print_success "Migrations completed!"
}

# Seed database
seed_database() {
    print_status "Seeding database..."
    docker-compose -f docker-compose.yaml exec api bun run prisma:seed
    print_success "Database seeded!"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    docker-compose -f docker-compose.yaml exec api bun run test
    print_success "Tests completed!"
}

# Open pgAdmin
open_pgadmin() {
    print_status "Opening pgAdmin in browser..."
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:5050 || true
    elif command -v open &> /dev/null; then
        open http://localhost:5050 || true
    elif command -v start &> /dev/null; then
        start http://localhost:5050 || true
    fi
    print_status "pgAdmin should open in your browser (login: admin@firsttimers.org)"
}

# Main script logic
case "$1" in
    up)
        check_docker
        start_dev
        ;;
    down)
        check_docker
        stop_services
        ;;
    build)
        check_docker
        build_services
        ;;
    reset)
        check_docker
        reset_environment
        ;;
    logs)
        check_docker
        show_logs
        ;;
    migrate)
        check_docker
        run_migrations
        ;;
    seed)
        check_docker
        seed_database
        ;;
    test)
        check_docker
        run_tests
        ;;
    pgadmin)
        check_docker
        open_pgadmin
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac

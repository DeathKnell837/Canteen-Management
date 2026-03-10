# Docker Setup for Canteen Management System

This directory contains Docker configurations for running the Canteen Management System with PostgreSQL and Redis.

## 🐳 Services Included

### PostgreSQL 16
- Latest stable PostgreSQL
- Automatic database initialization
- Volume persistence
- pgAdmin interface for database management

### Redis 7
- In-memory cache store
- Session management
- Queue processing
- Data persistence

### pgAdmin 4 (Optional)
- Web interface for PostgreSQL management
- User: `admin@canteen.local`
- Password: `admin`
- Access: http://localhost:5050

## 🚀 Quick Start

### Start All Services
```bash
docker-compose up -d
```

### Stop All Services
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Access PostgreSQL
```bash
# Via psql
psql -h localhost -U canteen_user -d canteen_db

# Via pgAdmin
# Open http://localhost:5050
# Login with admin@canteen.local / admin
```

### Reset Database (Warning: Deletes Data)
```bash
docker-compose down -v
docker-compose up -d
```

## 🔧 Configuration

### Environment Variables
```yml
POSTGRES_USER: canteen_user
POSTGRES_PASSWORD: canteen_password_dev
POSTGRES_DB: canteen_db
```

### Ports
- PostgreSQL: 5432
- Redis: 6379
- pgAdmin: 5050

## 📊 Database

### Default Credentials
- **Host**: localhost
- **Port**: 5432
- **User**: canteen_user
- **Password**: canteen_password_dev
- **Database**: canteen_db

### Connection String
```
postgresql://canteen_user:canteen_password_dev@localhost:5432/canteen_db
```

### Update .env File
Create `../backend/.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=canteen_db
DB_USER=canteen_user
DB_PASSWORD=canteen_password_dev
```

## 💾 Persistence

### Volumes
- `postgres_data`: PostgreSQL data directory
- `redis_data`: Redis data directory

These volumes persist data between container restarts and removals.

## 🩺 Health Checks

All services have health checks configured:
```bash
# Check service status
docker ps

# View health status
docker ps --format "table {{.Names}}\t{{.Status}}"
```

## 🔒 Production Considerations

### Change Default Passwords
In `docker-compose.yml`, update:
```yml
POSTGRES_PASSWORD: <strong-password-here>
PGADMIN_DEFAULT_PASSWORD: <strong-password-here>
```

### Disable pgAdmin
Remove pgAdmin service if not needed in production.

### Use .env File
Create `.env` file instead of hardcoding passwords:
```
POSTGRES_USER=canteen_user
POSTGRES_PASSWORD=your_secure_password
```

### Enable SSL
Configure PostgreSQL SSL in production deployments.

## 📚 Common Tasks

### Backup Database
```bash
docker exec canteen_postgres pg_dump -U canteen_user canteen_db > backup.sql
```

### Restore Database
```bash
docker exec -i canteen_postgres psql -U canteen_user canteen_db < backup.sql
```

### View Database Size
```bash
docker exec canteen_postgres psql -U canteen_user -d canteen_db -c "SELECT pg_size_pretty(pg_database_size('canteen_db'));"
```

### Connect to Redis
```bash
docker exec -it canteen_redis redis-cli
```

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :5432

# Kill process
kill -9 <PID>
```

### Container Won't Start
```bash
# Check logs
docker-compose logs postgres

# Check volume
docker volume ls | grep canteen
```

### Database Connection Refused
1. Ensure Docker is running
2. Check container is up: `docker ps`
3. Verify credentials match
4. Wait for health check to pass

## 🔗 Links

- PostgreSQL: https://www.postgresql.org/
- Redis: https://redis.io/
- pgAdmin: https://www.pgadmin.org/
- Docker: https://www.docker.com/

---

**Note**: Uses development/demo credentials. Change all passwords in production!

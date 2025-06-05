# 🐳 Docker Support for Own IPFS Service

This document provides comprehensive instructions for running the Own IPFS Service using Docker and Docker Compose.

## 📋 Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed and running
- [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop)

## 🚀 Quick Start

### Single Node Deployment

1. **Build and start a single IPFS node:**
   ```bash
   docker-compose up ipfs-node1
   ```

2. **Access the service:**
   - Web Interface: http://localhost:8080
   - API: http://localhost:8080/api

3. **Stop the service:**
   ```bash
   docker-compose down
   ```

### Multi-Node P2P Network

1. **Start two nodes for P2P testing:**
   ```bash
   docker-compose up ipfs-node1 ipfs-node2
   ```

2. **Access the nodes:**
   - Node 1: http://localhost:8080
   - Node 2: http://localhost:8081

3. **Connect the nodes:**
   - Open Node 1 at http://localhost:8080
   - Go to P2P Network section
   - Connect to: `ws://ipfs-node2:9080`

4. **Start all three nodes (full network):**
   ```bash
   docker-compose --profile full-network up
   ```

## 🛠️ Available Commands

### Basic Operations

```bash
# Build the Docker image
docker-compose build

# Start services in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ This deletes all stored files)
docker-compose down -v

# Restart a specific service
docker-compose restart ipfs-node1
```

### Development Commands

```bash
# Build without cache
docker-compose build --no-cache

# Start with specific services
docker-compose up ipfs-node1 ipfs-node2

# Scale a service (not recommended for this app)
docker-compose up --scale ipfs-node1=2
```

## 🔧 Configuration

### Environment Variables

You can customize the deployment by modifying the `docker-compose.yml` file or using environment variables:

```yaml
environment:
  - PORT=8080              # Internal port (don't change unless needed)
  - DATA_DIR=/app/data     # Data directory inside container
  - NODE_ENV=production    # Node.js environment
```

### Port Mapping

Default port mappings:
- Node 1: `8080:8080` (HTTP) and `9080:9080` (WebSocket)
- Node 2: `8081:8080` (HTTP) and `9081:9080` (WebSocket)  
- Node 3: `8082:8080` (HTTP) and `9082:9080` (WebSocket)

To change ports, modify the `docker-compose.yml` file:

```yaml
ports:
  - "3000:8080"  # Map host port 3000 to container port 8080
  - "3001:9080"  # Map host port 3001 to container port 9080
```

### Data Persistence

Data is automatically persisted using Docker volumes:
- `ipfs_data1` - Data for Node 1
- `ipfs_data2` - Data for Node 2
- `ipfs_data3` - Data for Node 3

Files uploaded to any node will persist between container restarts.

## 🌐 P2P Network Setup

### Connecting Nodes

1. **Start multiple nodes:**
   ```bash
   docker-compose up ipfs-node1 ipfs-node2
   ```

2. **Connect Node 1 to Node 2:**
   - Open http://localhost:8080
   - In P2P Network section, enter: `ws://ipfs-node2:9080`
   - Click "Connect to Peer"

3. **Connect Node 2 to Node 1:**
   - Open http://localhost:8081
   - In P2P Network section, enter: `ws://ipfs-node1:9080`
   - Click "Connect to Peer"

### Network Architecture

```
┌─────────────┐    WebSocket    ┌─────────────┐
│   Node 1    │◄──────────────►│   Node 2    │
│ :8080/:9080 │                │ :8081/:9081 │
└─────────────┘                └─────────────┘
       ▲                              ▲
       │           WebSocket          │
       └─────────────────────────────┘
                   Node 3
               :8082/:9082
```

## 📊 Monitoring and Health Checks

### Built-in Health Checks

Each container includes health checks that monitor:
- API endpoint availability (`/api/stats`)
- Response time (3-second timeout)
- Automatic restart on failure

### Viewing Health Status

```bash
# Check health status
docker-compose ps

# View detailed health information
docker inspect own-ipfs-node1 | grep -A 10 "Health"
```

### Logs and Debugging

```bash
# View logs from all services
docker-compose logs -f

# View logs from specific service
docker-compose logs -f ipfs-node1

# Follow logs with timestamps
docker-compose logs -f -t

# View last 50 log lines
docker-compose logs --tail=50 ipfs-node1
```

## 🔒 Security Considerations

### Container Security

- Containers run as non-root user (`nodejs:1001`)
- Only necessary ports are exposed
- No sensitive information in environment variables
- Minimal Alpine Linux base image

### Network Security

- Isolated Docker network for inter-container communication
- Health checks prevent unhealthy containers from receiving traffic
- Volume mounts are restricted to data directory only

## 🚀 Production Deployment

### Recommended Production Settings

1. **Use specific image tags:**
   ```yaml
   image: own-ipfs-service:v1.0.0
   ```

2. **Set resource limits:**
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '1.0'
         memory: 512M
       reservations:
         memory: 256M
   ```

3. **Configure logging:**
   ```yaml
   logging:
     driver: "json-file"
     options:
       max-size: "10m"
       max-file: "3"
   ```

4. **Use external volumes:**
   ```yaml
   volumes:
     - /host/data/ipfs1:/app/data
   ```

### Docker Swarm Deployment

For production clusters, consider using Docker Swarm:

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml ipfs-stack

# Scale services
docker service scale ipfs-stack_ipfs-node1=3
```

## 🧪 Testing the Deployment

### Basic Functionality Test

1. **Start the service:**
   ```bash
   docker-compose up -d ipfs-node1
   ```

2. **Test API endpoints:**
   ```bash
   # Health check
   curl http://localhost:8080/api/stats
   
   # Upload a file
   curl -X POST -F "file=@README.md" http://localhost:8080/api/add
   
   # List files
   curl http://localhost:8080/api/list
   ```

### P2P Network Test

1. **Start two nodes:**
   ```bash
   docker-compose up -d ipfs-node1 ipfs-node2
   ```

2. **Upload file to Node 1:**
   ```bash
   curl -X POST -F "file=@test.txt" http://localhost:8080/api/add
   ```

3. **Retrieve file from Node 2 (after connecting peers):**
   ```bash
   curl http://localhost:8081/api/cat/QmYourHashHere
   ```

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check if ports are in use
   netstat -tlnp | grep :8080
   
   # Use different ports in docker-compose.yml
   ```

2. **Permission issues:**
   ```bash
   # Check container logs
   docker-compose logs ipfs-node1
   
   # Verify volume permissions
   docker-compose exec ipfs-node1 ls -la /app/data
   ```

3. **Network connectivity:**
   ```bash
   # Test container networking
   docker-compose exec ipfs-node1 ping ipfs-node2
   
   # Check exposed ports
   docker-compose ps
   ```

### Cleanup Commands

```bash
# Remove all containers and networks
docker-compose down

# Remove containers, networks, and volumes
docker-compose down -v

# Remove unused Docker resources
docker system prune -a

# Remove specific volumes
docker volume rm own-ipfs-service_ipfs_data1
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Own IPFS Service Main README](./README.md)

## 🤝 Contributing to Docker Support

If you want to improve the Docker configuration:

1. Test your changes with multiple scenarios
2. Update this documentation
3. Ensure backward compatibility
4. Add appropriate comments to Docker files

---

**🐳 Happy containerized file sharing!** If you encounter any issues with the Docker setup, please create an issue in the GitHub repository.

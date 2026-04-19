# Deployment Documentation
## WeatherSphere — React Weather Dashboard
### Fully Automated CI/CD: Jenkins + Docker + AWS EC2

---

## 🏗️ Architecture Overview

```
GitHub Repository
  │
  ├── dev branch  ──► Jenkins ──► Docker build (TEST)  ──► EC2 :8090
  │                    ↓
  │              Lint + Test (Vitest)
  │
  └── main branch ──► Jenkins ──► Docker build (PROD) ──► EC2 :8000
```

**Full pipeline flow:**
```
Code Push (local)
  → GitHub Webhook
  → Jenkins (Port 80 via Nginx)
  → npm install → ESLint → Vitest (22 tests)
  → Docker Build (React compiled + API key injected)
  → Docker Push (santhoshramesh007/weather-dashboard)
  → SSH into EC2
  → Docker Pull → Stop/RM old → Run new
  → ✅ Live URL update
```

---

## 🌐 Environment Details

| Environment | Branch | URL | Port | Environment Badge |
|---|---|---|---|---|
| **Production** | `main` | [http://3.109.221.200:8000](http://3.109.221.200:8000) | 8000 | ✅ LIVE |
| **Test/Dev** | `dev` | [http://3.109.221.200:8090](http://3.109.221.200:8090) | 8090 | ⚗️ TEST ENV |
| **Jenkins** | N/A | [http://3.109.221.200](http://3.109.221.200) | 80 | N/A |

> **Note on Port 80:** Port 80 on the EC2 is managed by an **Nginx Reverse Proxy** that routes traffic to the Jenkins container (listening internally on 8888). This bypasses home ISP restrictions on high ports.

---

## 🛠️ Jenkins Configuration

### 1. Credentials Created
| Credential ID | Type | Purpose |
|---|---|---|
| `docker-hub-credentials` | User/Pass | Push images to santhoshramesh007 |
| `weather-api-key` | Secret text | OpenWeatherMap API Key |
| `ec2-ssh-key` | SSH Private Key | SSH access to the deployment server |

### 2. Jenkinsfile Logic
The pipeline is **Fully Automated**. The "Manual Approval Gate" was removed to ensure continuous deployment without the need for UI access during builds.

---

## 🐳 Docker Images (Docker Hub)

- **Repository:** `santhoshramesh007/weather-dashboard`
- **Prod Tag:** `latest`
- **Test Tag:** `latest-test`

**Manual Pull Command:**
```bash
docker pull santhoshramesh007/weather-dashboard:latest
```

---

## 📋 Verification Checklist

### Infrastructure
- [x] EC2 running Ubuntu 24.04
- [x] Docker installed and running
- [x] Nginx proxying Port 80 to Jenkins
- [x] AWS Security Groups open for 22, 80, 8000, 8090

### Pipeline
- [x] GitHub push triggers build within 10 seconds
- [x] `npm test` passes with 22/22 tests
- [x] Docker image pushed successfully to Docker Hub
- [x] SSH deployment succeeds without human interaction

### App Functionality
- [x] Realistic Weather Data (OpenWeatherMap API)
- [x] Dynamic Background Blobs (App.css)
- [x] Unit Toggle (°C/°F)
- [x] Search city functionality
- [x] Healthy `/health` endpoint

---

## 🆘 Troubleshooting Commands (EC2)

```bash
# View running apps
docker ps

# See logs for Production App
docker logs prod-web -f

# Restart Jenkins
docker restart jenkins

# Check Nginx status (Proxy)
systemctl status nginx
```

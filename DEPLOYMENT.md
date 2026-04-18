# Deployment Documentation
## WeatherSphere — React Weather Dashboard
### Branch-Based CI/CD: Jenkins Multibranch + Docker + AWS EC2

---

## Architecture Overview

```
GitHub Repository
  │
  ├── dev branch  ──► Jenkins ──► Docker build (TEST)  ──► EC2 :8080
  │                    ↓
  │              Lint + Test
  │
  └── main branch ──► Jenkins ──► Docker build (PROD) ──► Manual Approval ──► EC2 :80
```

**Full pipeline flow:**
```
Code Push
  → GitHub Webhook
  → Jenkins detects branch
  → npm install → ESLint → Vitest
  → docker build (Vite compiles React + bakes API key)
  → docker push (Docker Hub)
  → [main only: manual approval gate]
  → SSH into EC2
  → docker pull → docker stop/rm → docker run
  → /health check → ✅ Done
```

---

## Project Structure

```
devops_pro/
├── Jenkinsfile            ← 9-stage Jenkins Multibranch Pipeline
├── DEPLOYMENT.md          ← This file
├── README.md              ← Project overview
├── .env.example           ← Environment variable template
└── app/
    ├── Dockerfile         ← Multi-stage: Node 20 builder → Nginx Alpine runtime
    ├── nginx.conf         ← SPA routing, health endpoint, gzip, security headers
    ├── vite.config.js     ← Vite + Vitest
    ├── package.json       ← React, Axios, Vitest, ESLint
    ├── index.html
    └── src/               ← React JSX source code
```

---

## Prerequisites

### 1. OpenWeatherMap API Key

1. Sign up at https://openweathermap.org/api (free tier)
2. Navigate to **API Keys** tab and copy your key
3. Wait ~10 minutes for activation

### 2. Jenkins Plugins Required

| Plugin | Purpose |
|--------|---------|
| Pipeline | Core pipeline support |
| Git + GitHub | Branch detection & webhooks |
| Docker Pipeline | `docker build/push` in pipeline |
| SSH Agent | SSH into EC2 for deployment |
| Credentials Binding | Inject secrets into pipeline |

### 3. Jenkins Credentials to Create

Go to **Jenkins → Manage Jenkins → Credentials → (global) → Add Credential**

| Credential ID | Type | Value |
|---|---|---|
| `docker-hub-credentials` | Username/Password | Docker Hub login |
| `weather-api-key` | Secret text | OpenWeatherMap API key |
| `ec2-ssh-key` | SSH Username + Private Key | EC2 `.pem` key contents |

### 4. EC2 Instance Requirements

- Ubuntu 20.04/22.04
- Docker installed and running
- Ports **22** (SSH), **80** (prod), **8080** (test) open in Security Group
- Jenkins EC2 agent or SSH access from Jenkins server

---

## EC2 Docker Setup

SSH into your EC2 instance and run:

```bash
# Install Docker
sudo apt update && sudo apt install -y docker.io
sudo systemctl enable --now docker

# Add ubuntu user to docker group (no sudo needed)
sudo usermod -aG docker ubuntu

# Log out and back in, then verify
docker --version
```

---

## Jenkins Job Setup

### Step 1 — Create Multibranch Pipeline

1. Jenkins → **New Item**
2. Name: `weather-dashboard-pipeline`
3. Type: **Multibranch Pipeline**

### Step 2 — Configure Branch Sources

1. Under **Branch Sources** → **Add Source → GitHub**
2. Repository URL: `https://github.com/SanthoshRamesh007/devops_pro`
3. Add GitHub credentials if private

### Step 3 — Script Path

- **Script Path**: `Jenkinsfile` ✅

### Step 4 — Update Jenkinsfile

Open `Jenkinsfile` and set your EC2 IP:
```groovy
EC2_HOST = 'YOUR_EC2_PUBLIC_IP'   // ← Set this
```

### Step 5 — Scan Repository

Click **Scan Repository Now** — Jenkins will discover `dev` and `main` branches and create sub-jobs.

### Step 6 — Configure GitHub Webhook

In your GitHub repo → **Settings → Webhooks → Add webhook**:
- Payload URL: `http://<jenkins-ip>:8080/github-webhook/`
- Content type: `application/json`
- Events: **Just the push event**

---

## Pipeline Stages

| # | Stage | Description |
|---|-------|-------------|
| 1 | Checkout | `checkout scm` — pulls the correct branch |
| 2 | Install | `npm install` — installs React, Vite, Vitest, etc. |
| 3 | Lint | `npm run lint` — ESLint checks JSX source |
| 4 | Test | `npm test` — Vitest runs unit tests |
| 5 | Docker Build | Multi-stage build; injects API key + env label via `--build-arg` |
| 6 | Docker Push | Pushes versioned + `latest-test`/`latest-prod` tags to Docker Hub |
| 7 | Approval Gate | **main only** — 10-minute timeout for manual approval in Jenkins UI |
| 8 | Deploy to EC2 | SSH → `docker pull` → `docker stop/rm` → `docker run` |
| 9 | Health Check | `curl /health` — confirms container is serving traffic |

---

## Branch → Environment Mapping

| Git Branch | Container Name | EC2 Port | Docker Tag | ENV_LABEL |
|---|---|---|---|---|
| `dev` | `weather-dashboard-test` | **8080** | `test-<N>` | `TEST` |
| `main` | `weather-dashboard-prod` | **80** | `prod-<N>` | `PRODUCTION` |

The `VITE_ENV_LABEL` build-arg is baked into the React bundle at build time. The UI displays a **TEST ENV** badge for the dev build and a **✅ LIVE** badge for production.

---

## Docker Image Details

### Multi-Stage Build

```
Stage 1 — Builder (node:20-alpine)
  ├── COPY package*.json
  ├── RUN npm install
  ├── COPY src/
  └── RUN npm run build   →  dist/  (Vite output)

Stage 2 — Runtime (nginx:1.25-alpine)
  ├── COPY nginx.conf
  ├── COPY dist/ → /usr/share/nginx/html
  ├── EXPOSE 80
  └── HEALTHCHECK /health
```

**Image size**: ~25 MB (Alpine Nginx only — no Node.js, no source code in production image)

### Docker Tags Published

```
santhoshramesh007/weather-dashboard:test-<N>      ← dev branch build
santhoshramesh007/weather-dashboard:latest-test   ← rolling test tag

santhoshramesh007/weather-dashboard:prod-<N>      ← main branch build
santhoshramesh007/weather-dashboard:latest-prod   ← rolling prod tag
```

---

## Manual Docker Commands (EC2)

```bash
# Check running containers
docker ps

# View logs
docker logs weather-dashboard-test -f
docker logs weather-dashboard-prod -f

# Restart a container
docker restart weather-dashboard-prod

# Run test build manually (replace IP and API key)
docker run -d \
  --name weather-dashboard-test \
  --restart unless-stopped \
  -p 8080:80 \
  santhoshramesh007/weather-dashboard:latest-test
```

---

## Verification Checklist

### Jenkins & Credentials
- [ ] `docker-hub-credentials` added to Jenkins
- [ ] `weather-api-key` (Secret Text) added to Jenkins
- [ ] `ec2-ssh-key` SSH key added to Jenkins
- [ ] `EC2_HOST` updated in `Jenkinsfile`

### EC2 Instance
- [ ] Docker installed and running (`docker --version`)
- [ ] Port 80 open in Security Group (production)
- [ ] Port 8080 open in Security Group (test)
- [ ] Port 22 open for Jenkins SSH deployment

### Pipeline Validation
- [ ] Push to `dev` → builds TEST image → deploys to `:8080` → health check passes
- [ ] Visit `http://<EC2_IP>:8080` → see weather dashboard with **TEST ENV** badge
- [ ] Push to `main` → approval gate appears in Jenkins
- [ ] Approve → deploys to `:80` → health check passes
- [ ] Visit `http://<EC2_IP>` → see weather dashboard with **✅ LIVE** badge

### App Functionality
- [ ] Search for a city → real-time weather loads
- [ ] Geolocation button → fetches current location weather
- [ ] °C / °F toggle → values update
- [ ] 24-hour chart renders with temperature + weather icons
- [ ] 5-day forecast cards display
- [ ] `/health` endpoint returns `{"status":"healthy"}`

---

## Deployment Flow Summary

```
dev branch push
  └► Jenkins detects (GitHub webhook)
       └► Checkout → npm install → ESLint → Vitest
            └► docker build (tag: test-N, ENV=TEST)
                 └► docker push (Docker Hub)
                      └► SSH → EC2
                           └► docker pull → stop/rm → run -p 8080:80
                                └► curl /health → ✅

main branch push
  └► Jenkins detects (GitHub webhook)
       └► Checkout → npm install → ESLint → Vitest
            └► docker build (tag: prod-N, ENV=PRODUCTION)
                 └► docker push (Docker Hub)
                      └► ⚠️ Manual approval required (10 min)
                           └► SSH → EC2
                                └► docker pull → stop/rm → run -p 80:80
                                     └► curl /health → ✅
```

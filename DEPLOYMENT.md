# Deployment Documentation
## Task 19 — GitHub Branch-Based Deployment with Jenkins & Docker

---

## Overview

This document describes the CI/CD pipeline that enables **branch-based deployment**, automatically routing:

| Git Branch | Target Environment | Docker Image Tag |
|---|---|---|
| `dev` | **Test** server | `test-<build_number>` |
| `main` | **Production** server | `prod-<build_number>` |

---

## Architecture Diagram

```
GitHub Repository
       │
       ├── dev branch ──────────────────────────────────► TEST Environment
       │       │                                          (test-server-ip:3000)
       │    Jenkins
       │    Pipeline
       │       │
       └── main branch ─────────────────────────────────► PRODUCTION Environment
                                                          (prod-server-ip:3000)
```

**Full pipeline flow:**
```
Code Push → GitHub Webhook → Jenkins → Build & Test → Docker Build
         → Docker Push (Docker Hub) → SSH Deploy to Server → Health Check
```

---

## Project Structure

```
devops_pro/
├── Jenkinsfile              ← Jenkins pipeline definition
├── DEPLOYMENT.md            ← This documentation
└── app/
    ├── server.js            ← Node.js Express application
    ├── package.json         ← Node.js dependencies
    └── Dockerfile           ← Multi-stage Docker build
```

---

## Prerequisites

### Jenkins Setup
- Jenkins 2.x or later with the following plugins:
  - **Pipeline** (default)
  - **Git** plugin
  - **Docker Pipeline** plugin
  - **SSH Agent** plugin
  - **Credentials Binding** plugin

### Jenkins Credentials (Manage Jenkins → Credentials)

| Credential ID | Type | Purpose |
|---|---|---|
| `docker-hub-credentials` | Username/Password | Docker Hub login |
| `deploy-server-ssh` | SSH Private Key | SSH access to servers |

### Server Requirements
- Docker installed and running on both test and production servers
- SSH access from Jenkins agent to both servers
- Port `3000` open on both servers

---

## Pipeline Stages

### Stage 1 — Checkout
Checks out the repository from GitHub using the configured SCM.

### Stage 2 — Build
Installs Node.js dependencies via `npm install` inside the `app/` directory.

### Stage 3 — Test
Runs `npm test` to execute test suites before any Docker image is built.

### Stage 4 — Docker Build & Push
- Builds a Docker image from `app/Dockerfile`
- Tags the image with the build number:
  - `dev` branch → `your-username/devops-pro-app:test-<N>`
  - `main` branch → `your-username/devops-pro-app:prod-<N>`
- Also maintains a rolling `latest-test` / `latest-prod` tag
- Pushes both tags to Docker Hub

### Stage 5 — Deploy (Branch-Conditional)

#### `dev` branch → Test Environment
```bash
docker pull <image>
docker stop devops-pro-test && docker rm devops-pro-test
docker run -d --name devops-pro-test \
  -p 3000:3000 \
  -e NODE_ENV=test \
  <image>
```

#### `main` branch → Production Environment
- Includes a **manual approval gate** (10-minute timeout) before deployment
- After approval:
```bash
docker pull <image>
docker stop devops-pro-prod && docker rm devops-pro-prod
docker run -d --name devops-pro-prod \
  -p 3000:3000 \
  -e NODE_ENV=production \
  <image>
```

### Stage 6 — Health Check
Hits the `/health` endpoint after deployment to confirm the container is running correctly.

---

## Jenkins Job Setup

### Step 1 — Create a Multibranch Pipeline Job
1. Open Jenkins → **New Item**
2. Select **Multibranch Pipeline**
3. Name it `devops-pro-pipeline`

### Step 2 — Configure Branch Sources
1. Under **Branch Sources**, click **Add Source → GitHub**
2. Enter your repository URL (e.g., `https://github.com/your-username/devops_pro`)
3. Add GitHub credentials if the repo is private

### Step 3 — Configure Build Configuration
- Set **Script Path** to `Jenkinsfile`

### Step 4 — Scan Repository
- Click **Scan Repository Now**
- Jenkins will detect `dev` and `main` branches and create sub-jobs automatically

---

## Customization — Values to Replace

Open `Jenkinsfile` and update the `environment` block:

```groovy
DOCKER_REGISTRY = 'your-dockerhub-username'   // Your Docker Hub username
TEST_SERVER     = 'user@test-server-ip'        // SSH target for test server
PROD_SERVER     = 'user@prod-server-ip'        // SSH target for production server
```

---

## Docker Image Details

The `Dockerfile` uses a **multi-stage build**:
1. **Builder stage** — installs dependencies
2. **Runtime stage** — lean production image (node:18-alpine)

Security features:
- Runs as a **non-root user** (`appuser`)
- Built-in **HEALTHCHECK** directive
- Uses Alpine Linux (minimal attack surface)

---

## Deployment Flow Summary

```
dev branch push
  └─► Jenkins detects push (webhook)
       └─► Checkout → npm install → npm test
            └─► docker build → docker push (tag: test-N)
                 └─► SSH into TEST server
                      └─► docker pull → docker stop/rm → docker run
                           └─► /health check → ✅ Done

main branch push
  └─► Jenkins detects push (webhook)
       └─► Checkout → npm install → npm test
            └─► docker build → docker push (tag: prod-N)
                 └─► ⚠️  Manual approval required in Jenkins UI
                      └─► SSH into PROD server
                           └─► docker pull → docker stop/rm → docker run
                                └─► /health check → ✅ Done
```

---

## Verification Checklist

- [ ] Jenkins Multibranch Pipeline job created
- [ ] `docker-hub-credentials` added to Jenkins credentials store
- [ ] `deploy-server-ssh` SSH key added to Jenkins credentials store
- [ ] `DOCKER_REGISTRY`, `TEST_SERVER`, `PROD_SERVER` values updated in `Jenkinsfile`
- [ ] Docker installed on test and production servers
- [ ] Firewall allows port `3000` on both servers
- [ ] GitHub webhook configured (Jenkins URL + `/github-webhook/`)
- [ ] `dev` branch triggers test deployment ✅
- [ ] `main` branch triggers prod deployment with approval gate ✅

pipeline {
    agent any

    // ──────────────────────────────────────────────────────────────
    //  GLOBAL ENVIRONMENT — update EC2_HOST before running
    // ──────────────────────────────────────────────────────────────
    environment {
        // Docker Hub
        DOCKER_REGISTRY       = 'santhoshramesh007'
        DOCKER_IMAGE_NAME     = 'weather-dashboard'
        DOCKER_CREDENTIALS_ID = 'docker-hub-credentials'   // Jenkins credential ID

        // OpenWeatherMap API key (stored as Jenkins Secret Text)
        WEATHER_API_CREDENTIAL = 'weather-api-key'         // Jenkins credential ID

        // EC2 SSH access
        SSH_CREDENTIALS_ID    = 'ec2-ssh-key'             // Jenkins SSH credential ID
        EC2_USER              = 'ubuntu'                   // EC2 login user
        EC2_HOST              = '3.109.221.200'             // EC2 Public IP

        // Container ports
        TEST_PORT             = '8090'   // 8080 is reserved for Jenkins UI
        PROD_PORT             = '8000'
    }

    stages {

        // ────────────────────────────────────────
        // STAGE 1 — Checkout
        // ────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo "📥 Checking out branch: ${env.BRANCH_NAME}"
                checkout scm
            }
        }

        // ────────────────────────────────────────
        // STAGE 2 — Install Dependencies
        // ────────────────────────────────────────
        stage('Install Dependencies') {
            steps {
                dir('app') {
                    echo '📦 Installing Node.js dependencies...'
                    sh 'npm install --legacy-peer-deps'
                    echo '✅ Dependencies installed.'
                }
            }
        }

        // ────────────────────────────────────────
        // STAGE 3 — Lint
        // ────────────────────────────────────────
        stage('Lint') {
            steps {
                dir('app') {
                    echo '🔍 Running ESLint...'
                    sh 'npm run lint'
                    echo '✅ Linting passed.'
                }
            }
        }

        // ────────────────────────────────────────
        // STAGE 4 — Unit Tests (Vitest)
        // ────────────────────────────────────────
        stage('Test') {
            steps {
                dir('app') {
                    echo '🧪 Running unit tests...'
                    sh 'npm test'
                    echo '✅ All tests passed.'
                }
            }
        }

        // ────────────────────────────────────────
        // STAGE 5 — Docker Build
        //   dev  branch → tag: test-<N>   env: TEST
        //   main branch → tag: prod-<N>   env: PRODUCTION
        // ────────────────────────────────────────
        stage('Docker Build') {
            steps {
                script {
                    if (env.BRANCH_NAME == 'main') {
                        env.IMAGE_TAG      = "prod-${env.BUILD_NUMBER}"
                        env.LATEST_TAG     = 'latest-prod'
                        env.ENV_LABEL      = 'PRODUCTION'
                        env.CONTAINER_NAME = 'weather-dashboard-prod'
                        env.APP_PORT       = env.PROD_PORT
                    } else {
                        env.IMAGE_TAG      = "test-${env.BUILD_NUMBER}"
                        env.LATEST_TAG     = 'latest-test'
                        env.ENV_LABEL      = 'TEST'
                        env.CONTAINER_NAME = 'weather-dashboard-test'
                        env.APP_PORT       = env.TEST_PORT
                    }

                    env.FULL_IMAGE   = "${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${env.IMAGE_TAG}"
                    env.LATEST_IMAGE = "${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${env.LATEST_TAG}"

                    withCredentials([string(credentialsId: env.WEATHER_API_CREDENTIAL, variable: 'WEATHER_KEY')]) {
                        dir('app') {
                            echo "🐳 Building Docker image: ${env.FULL_IMAGE}"
                            echo "🏷️  Environment label  : ${env.ENV_LABEL}"
                            sh """
                                docker build \\
                                  --build-arg VITE_WEATHER_API_KEY=${WEATHER_KEY} \\
                                  --build-arg VITE_ENV_LABEL=${env.ENV_LABEL} \\
                                  -t ${env.FULL_IMAGE} \\
                                  -t ${env.LATEST_IMAGE} \\
                                  .
                            """
                            echo "✅ Docker image built: ${env.FULL_IMAGE}"
                        }
                    }
                }
            }
        }

        // ────────────────────────────────────────
        // STAGE 6 — Docker Push to Docker Hub
        // ────────────────────────────────────────
        stage('Docker Push') {
            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId: env.DOCKER_CREDENTIALS_ID,
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        echo '🔐 Logging in to Docker Hub...'
                        sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'

                        echo "⬆️  Pushing ${env.FULL_IMAGE}..."
                        sh "docker push ${env.FULL_IMAGE}"

                        echo "⬆️  Pushing ${env.LATEST_IMAGE}..."
                        sh "docker push ${env.LATEST_IMAGE}"

                        echo "✅ Images pushed to Docker Hub successfully!"
                    }
                }
            }
        }

        // STAGE 7 Removed to fully automate production deployment
        // ────────────────────────────────────────
        // STAGE 8 — Deploy to EC2
        //   dev  → container: weather-dashboard-test  port 8080:80
        //   main → container: weather-dashboard-prod  port 80:80
        // ────────────────────────────────────────
        stage('Deploy to EC2') {
            steps {
                script {
                    sshagent(credentials: [env.SSH_CREDENTIALS_ID]) {
                        echo "🚀 Deploying ${env.FULL_IMAGE} to EC2 (${env.ENV_LABEL}: port ${env.APP_PORT})..."
                        sh """
                            ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} '
                                echo "Pulling image: ${env.FULL_IMAGE}"
                                docker pull ${env.FULL_IMAGE}

                                echo "Stopping old container (if any)..."
                                docker stop ${env.CONTAINER_NAME} 2>/dev/null || true
                                docker rm   ${env.CONTAINER_NAME} 2>/dev/null || true

                                echo "Starting new container on port ${env.APP_PORT}..."
                                docker run -d \\
                                  --name ${env.CONTAINER_NAME} \\
                                  --restart unless-stopped \\
                                  -p ${env.APP_PORT}:80 \\
                                  ${env.FULL_IMAGE}

                                echo "Container started successfully."
                            '
                        """
                        echo "✅ Deployed to EC2 on port ${env.APP_PORT}"
                    }
                }
            }
        }

        // ────────────────────────────────────────
        // STAGE 9 — Health Check
        // ────────────────────────────────────────
        stage('Health Check') {
            steps {
                script {
                    echo '⏳ Waiting 15s for container to fully start...'
                    sleep 15
                    sh """
                        curl -sf http://${EC2_HOST}:${env.APP_PORT}/health \\
                          || (echo '❌ Health check failed!' && exit 1)
                    """
                    echo "✅ Health check passed — app is live on http://${EC2_HOST}:${env.APP_PORT}"
                }
            }
        }

    } // end stages

    // ──────────────────────────────────────────────────────────────
    //  POST — Summary & Cleanup
    // ──────────────────────────────────────────────────────────────
    post {
        success {
            echo """
            ╔══════════════════════════════════════════╗
            ║  ✅  PIPELINE SUCCESS                    ║
            ║  Branch    : ${env.BRANCH_NAME}
            ║  Env       : ${env.ENV_LABEL}
            ║  Image     : ${env.FULL_IMAGE}
            ║  URL       : http://${EC2_HOST}:${env.APP_PORT}
            ║  Build     : #${env.BUILD_NUMBER}
            ╚══════════════════════════════════════════╝
            """
        }
        failure {
            echo """
            ╔══════════════════════════════════════════╗
            ║  ❌  PIPELINE FAILED                     ║
            ║  Branch : ${env.BRANCH_NAME}
            ║  Stage  : Check logs above
            ║  Build  : #${env.BUILD_NUMBER}
            ╚══════════════════════════════════════════╝
            """
        }
        always {
            // Remove dangling/unused images to free disk space
            sh 'docker image prune -f || true'
            echo '🧹 Image cleanup done.'
        }
    }
}

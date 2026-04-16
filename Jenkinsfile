pipeline {
    agent any

    environment {
        // Docker Hub / Registry credentials (set in Jenkins credentials store)
        DOCKER_CREDENTIALS_ID = 'docker-hub-credentials'
        DOCKER_IMAGE_NAME     = 'devops-pro-app'
        DOCKER_REGISTRY       = 'your-dockerhub-username'  // Replace with your Docker Hub username

        // SSH credentials for remote deployment servers (set in Jenkins credentials store)
        SSH_CREDENTIALS_ID    = 'deploy-server-ssh'

        // Server addresses (set as Jenkins environment or replace directly)
        TEST_SERVER           = 'user@test-server-ip'       // Replace with test server
        PROD_SERVER           = 'user@prod-server-ip'       // Replace with prod server

        // Application port mapping
        APP_PORT              = '3000'
    }

    stages {

        // ──────────────────────────────────────────────
        // STAGE 1: Checkout
        // ──────────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo "Checking out branch: ${env.BRANCH_NAME}"
                checkout scm
            }
        }

        // ──────────────────────────────────────────────
        // STAGE 2: Build
        // ──────────────────────────────────────────────
        stage('Build') {
            steps {
                dir('app') {
                    echo 'Installing dependencies...'
                    sh 'npm install'
                }
            }
        }

        // ──────────────────────────────────────────────
        // STAGE 3: Test
        // ──────────────────────────────────────────────
        stage('Test') {
            steps {
                dir('app') {
                    echo 'Running application tests...'
                    sh 'npm test'
                }
            }
        }

        // ──────────────────────────────────────────────
        // STAGE 4: Docker Build & Push
        // ──────────────────────────────────────────────
        stage('Docker Build & Push') {
            steps {
                script {
                    def imageTag = ''

                    if (env.BRANCH_NAME == 'dev') {
                        imageTag = "test-${env.BUILD_NUMBER}"
                    } else if (env.BRANCH_NAME == 'main') {
                        imageTag = "prod-${env.BUILD_NUMBER}"
                    } else {
                        imageTag = "branch-${env.BRANCH_NAME}-${env.BUILD_NUMBER}"
                    }

                    env.IMAGE_TAG      = imageTag
                    env.FULL_IMAGE     = "${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${imageTag}"
                    env.LATEST_IMAGE   = "${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:latest-${env.BRANCH_NAME == 'main' ? 'prod' : 'test'}"

                    dir('app') {
                        echo "Building Docker image: ${env.FULL_IMAGE}"
                        sh "docker build -t ${env.FULL_IMAGE} ."
                        sh "docker tag ${env.FULL_IMAGE} ${env.LATEST_IMAGE}"
                    }

                    withCredentials([usernamePassword(
                        credentialsId: DOCKER_CREDENTIALS_ID,
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        sh "echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin"
                        sh "docker push ${env.FULL_IMAGE}"
                        sh "docker push ${env.LATEST_IMAGE}"
                        echo "Docker image pushed: ${env.FULL_IMAGE}"
                    }
                }
            }
        }

        // ──────────────────────────────────────────────
        // STAGE 5a: Deploy to TEST  (dev branch only)
        // ──────────────────────────────────────────────
        stage('Deploy to Test Environment') {
            when {
                branch 'dev'
            }
            steps {
                script {
                    echo "Deploying to TEST environment on ${TEST_SERVER}"
                    withCredentials([sshUserPrivateKey(
                        credentialsId: SSH_CREDENTIALS_ID,
                        keyFileVariable: 'SSH_KEY'
                    )]) {
                        sh """
                            ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${TEST_SERVER} '
                                docker pull ${env.FULL_IMAGE}
                                docker stop devops-pro-test 2>/dev/null || true
                                docker rm   devops-pro-test 2>/dev/null || true
                                docker run -d \\
                                    --name devops-pro-test \\
                                    --restart unless-stopped \\
                                    -p ${APP_PORT}:3000 \\
                                    -e NODE_ENV=test \\
                                    ${env.FULL_IMAGE}
                                echo "Deployment to TEST complete"
                            '
                        """
                    }
                }
            }
        }

        // ──────────────────────────────────────────────
        // STAGE 5b: Deploy to PRODUCTION  (main branch only)
        // ──────────────────────────────────────────────
        stage('Deploy to Production Environment') {
            when {
                branch 'main'
            }
            steps {
                script {
                    // Manual approval gate before prod deployment
                    timeout(time: 10, unit: 'MINUTES') {
                        input message: "Deploy build #${env.BUILD_NUMBER} to PRODUCTION?",
                              ok: 'Approve Deployment'
                    }

                    echo "Deploying to PRODUCTION environment on ${PROD_SERVER}"
                    withCredentials([sshUserPrivateKey(
                        credentialsId: SSH_CREDENTIALS_ID,
                        keyFileVariable: 'SSH_KEY'
                    )]) {
                        sh """
                            ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${PROD_SERVER} '
                                docker pull ${env.FULL_IMAGE}
                                docker stop devops-pro-prod 2>/dev/null || true
                                docker rm   devops-pro-prod 2>/dev/null || true
                                docker run -d \\
                                    --name devops-pro-prod \\
                                    --restart unless-stopped \\
                                    -p ${APP_PORT}:3000 \\
                                    -e NODE_ENV=production \\
                                    ${env.FULL_IMAGE}
                                echo "Deployment to PRODUCTION complete"
                            '
                        """
                    }
                }
            }
        }

        // ──────────────────────────────────────────────
        // STAGE 6: Health Check (both environments)
        // ──────────────────────────────────────────────
        stage('Health Check') {
            steps {
                script {
                    def targetServer = ''
                    def envLabel     = ''

                    if (env.BRANCH_NAME == 'dev') {
                        targetServer = TEST_SERVER.split('@')[1]
                        envLabel     = 'TEST'
                    } else if (env.BRANCH_NAME == 'main') {
                        targetServer = PROD_SERVER.split('@')[1]
                        envLabel     = 'PRODUCTION'
                    }

                    if (targetServer) {
                        echo "Running health check against ${envLabel} (http://${targetServer}:${APP_PORT}/health)..."
                        withCredentials([sshUserPrivateKey(
                            credentialsId: SSH_CREDENTIALS_ID,
                            keyFileVariable: 'SSH_KEY'
                        )]) {
                            sh """
                                ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${env.BRANCH_NAME == 'dev' ? TEST_SERVER : PROD_SERVER} '
                                    sleep 5
                                    curl -sf http://localhost:${APP_PORT}/health && echo "Health check PASSED" || echo "Health check FAILED"
                                '
                            """
                        }
                    }
                }
            }
        }

    } // end stages

    // ──────────────────────────────────────────────
    // POST: Notifications & Cleanup
    // ──────────────────────────────────────────────
    post {
        success {
            echo "Pipeline completed successfully for branch: ${env.BRANCH_NAME}"
            // Add Slack/email notification here if needed
        }
        failure {
            echo "Pipeline FAILED for branch: ${env.BRANCH_NAME} — build #${env.BUILD_NUMBER}"
            // Add Slack/email notification here if needed
        }
        always {
            // Clean up dangling Docker images on Jenkins agent
            sh 'docker image prune -f || true'
            echo 'Workspace cleanup complete.'
        }
    }
}

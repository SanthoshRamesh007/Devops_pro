pipeline {
    agent any

    environment {
        // ── Replace with your Docker Hub username ──
        DOCKER_REGISTRY       = 'santhoshramesh007'
        DOCKER_IMAGE_NAME     = 'devops-pro-app'
        DOCKER_CREDENTIALS_ID = 'docker-hub-credentials'
    }

    stages {

        // ─────────────────────────────────────────
        // STAGE 1: Checkout Code from GitHub
        // ─────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo "Checking out branch: ${env.BRANCH_NAME}"
                checkout scm
            }
        }

        // ─────────────────────────────────────────
        // STAGE 2: Install Dependencies & Build
        // ─────────────────────────────────────────
        stage('Build') {
            steps {
                dir('app') {
                    echo 'Installing Node.js dependencies...'
                    sh 'npm install'
                    echo 'Build complete.'
                }
            }
        }

        // ─────────────────────────────────────────
        // STAGE 3: Run Tests
        // ─────────────────────────────────────────
        stage('Test') {
            steps {
                dir('app') {
                    echo 'Running tests...'
                    sh 'npm test'
                    echo 'Tests passed.'
                }
            }
        }

        // ─────────────────────────────────────────
        // STAGE 4: Docker Build
        //   dev  branch  → tag: test-<build#>
        //   main branch  → tag: prod-<build#>
        // ─────────────────────────────────────────
        stage('Docker Build') {
            steps {
                script {
                    // Determine image tag based on branch
                    if (env.BRANCH_NAME == 'main') {
                        env.IMAGE_TAG = "prod-${env.BUILD_NUMBER}"
                        env.ENV_LABEL = 'PRODUCTION'
                    } else if (env.BRANCH_NAME == 'dev') {
                        env.IMAGE_TAG = "test-${env.BUILD_NUMBER}"
                        env.ENV_LABEL = 'TEST'
                    } else {
                        env.IMAGE_TAG = "${env.BRANCH_NAME}-${env.BUILD_NUMBER}"
                        env.ENV_LABEL = 'OTHER'
                    }

                    env.FULL_IMAGE   = "${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${env.IMAGE_TAG}"
                    env.LATEST_IMAGE = "${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:latest-${env.BRANCH_NAME == 'main' ? 'prod' : 'test'}"

                    dir('app') {
                        echo "Building Docker image for ${env.ENV_LABEL} environment..."
                        echo "Image: ${env.FULL_IMAGE}"
                        sh "docker build -t ${env.FULL_IMAGE} ."
                        sh "docker tag  ${env.FULL_IMAGE} ${env.LATEST_IMAGE}"
                        echo "Docker image built successfully: ${env.FULL_IMAGE}"
                    }
                }
            }
        }

        // ─────────────────────────────────────────
        // STAGE 5: Push Image to Docker Hub
        // ─────────────────────────────────────────
        stage('Docker Push') {
            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId: DOCKER_CREDENTIALS_ID,
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        echo "Logging in to Docker Hub..."
                        sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'

                        echo "Pushing ${env.FULL_IMAGE}..."
                        sh "docker push ${env.FULL_IMAGE}"

                        echo "Pushing ${env.LATEST_IMAGE}..."
                        sh "docker push ${env.LATEST_IMAGE}"

                        echo "✅ Docker image pushed to Docker Hub successfully!"
                        echo "Image: ${env.FULL_IMAGE}"
                    }
                }
            }
        }

    } // end stages

    // ─────────────────────────────────────────
    // POST: Summary & Cleanup
    // ─────────────────────────────────────────
    post {
        success {
            echo """
            ====================================
            ✅ PIPELINE SUCCESS
            Branch : ${env.BRANCH_NAME}
            Env    : ${env.ENV_LABEL}
            Image  : ${env.FULL_IMAGE}
            Build  : #${env.BUILD_NUMBER}
            ====================================
            """
        }
        failure {
            echo """
            ====================================
            ❌ PIPELINE FAILED
            Branch : ${env.BRANCH_NAME}
            Build  : #${env.BUILD_NUMBER}
            ====================================
            """
        }
        always {
            // Remove dangling images to free space on Jenkins agent
            sh 'docker image prune -f || true'
            echo 'Cleanup done.'
        }
    }
}

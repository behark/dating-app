#!/usr/bin/env bash

# This script runs before dependencies are installed
# Set build environment variables

echo "Setting up build environment..."

# Export environment variables for Kotlin/Gradle
export GRADLE_OPTS="-Xmx4096m -XX:MaxMetaspaceSize=1024m"

# Disable Sentry uploads via environment variable (Gradle plugin will respect this)
export SENTRY_DISABLE_AUTO_UPLOAD=true

# Create android directory and sentry.properties to disable Sentry uploads
# This will be preserved during prebuild
mkdir -p android

# Create sentry.properties with uploads completely disabled
cat > android/sentry.properties << 'EOF'
# Sentry Configuration - Uploads Completely Disabled
enabled=false
# Explicitly disable all uploads - no project/org configured
defaults.project=
defaults.org=
EOF

echo "Sentry uploads disabled via android/sentry.properties"

echo "Build environment configured"
echo "Sentry uploads disabled via android/sentry.properties"

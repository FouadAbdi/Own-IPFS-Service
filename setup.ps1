# Own IPFS Service - Windows Setup Script
# Run this script to set up and start your IPFS service

param(
    [int]$Port = 8080,
    [string]$DataDir = "./data",
    [switch]$MultiNode,
    [switch]$Demo,
    [switch]$Test
)

Write-Host "🌟 Own IPFS Service - Windows Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Check Node.js installation
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
}

# Run tests if requested
if ($Test) {
    Write-Host "🧪 Running tests..." -ForegroundColor Yellow
    npm test
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Tests failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ All tests passed" -ForegroundColor Green
    return
}

# Run demo if requested
if ($Demo) {
    Write-Host "🎯 Running demonstration..." -ForegroundColor Yellow
    
    # Start service in background
    $serviceJob = Start-Job -ScriptBlock { 
        Set-Location $using:PWD
        npm start 
    }
    
    # Wait for service to start
    Start-Sleep -Seconds 3
    
    # Run demo
    node demo.js
    
    # Stop service
    Stop-Job $serviceJob
    Remove-Job $serviceJob
    return
}

# Multi-node setup
if ($MultiNode) {
    Write-Host "🌐 Starting multi-node network..." -ForegroundColor Yellow
    npm run multi-node
    return
}

# Single node setup
Write-Host "🚀 Starting IPFS service..." -ForegroundColor Yellow
Write-Host "Port: $Port" -ForegroundColor Cyan
Write-Host "Data Directory: $DataDir" -ForegroundColor Cyan

# Set environment variables
$env:PORT = $Port.ToString()
$env:DATA_DIR = $DataDir

# Create data directory if it doesn't exist
if (-not (Test-Path $DataDir)) {
    New-Item -ItemType Directory -Path $DataDir -Force | Out-Null
    Write-Host "📁 Created data directory: $DataDir" -ForegroundColor Green
}

Write-Host ""
Write-Host "🌟 Service starting..." -ForegroundColor Green
Write-Host "Web Interface: http://localhost:$Port" -ForegroundColor Cyan
Write-Host "API Endpoint: http://localhost:$Port/api" -ForegroundColor Cyan
Write-Host "P2P Port: $($Port + 1000)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the service" -ForegroundColor Yellow
Write-Host ""

# Start the service
npm start

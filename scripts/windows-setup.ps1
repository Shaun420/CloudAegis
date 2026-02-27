# CloudAegis Windows Production Setup
# Run as Administrator

Write-Host "🚀 CloudAegis Windows Production Setup" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ Please run this script as Administrator" -ForegroundColor Red
    exit 1
}

# Set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# Install PM2 globally
Write-Host "`n📦 Installing PM2..." -ForegroundColor Yellow
npm install -g pm2
npm install -g pm2-windows-startup

# Install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
npm ci --only=production

# Generate secrets if not exist
Write-Host "`n🔐 Checking secrets..." -ForegroundColor Yellow
if (-not (Test-Path .env)) {
    Write-Host "Generating secrets..." -ForegroundColor Yellow
    npm run generate-secrets
}

# Generate SSL certificates
Write-Host "`n🔒 Checking SSL certificates..." -ForegroundColor Yellow
if (-not (Test-Path ssl\cert.pem)) {
    Write-Host "Generating SSL certificates..." -ForegroundColor Yellow
    
    # Check if OpenSSL is available
    $opensslPath = Get-Command openssl -ErrorAction SilentlyContinue
    
    if ($opensslPath) {
        New-Item -ItemType Directory -Force -Path ssl | Out-Null
        & openssl req -x509 -newkey rsa:4096 `
            -keyout ssl\key.pem -out ssl\cert.pem `
            -days 365 -nodes `
            -subj "/CN=$env:COMPUTERNAME"
    } else {
        Write-Host "⚠️  OpenSSL not found. Please install OpenSSL or generate certificates manually." -ForegroundColor Yellow
        Write-Host "   Download from: https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Yellow
    }
}

# Create directories
Write-Host "`n📁 Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path uploads | Out-Null
New-Item -ItemType Directory -Force -Path logs | Out-Null

# Setup PM2
Write-Host "`n▶️  Setting up PM2..." -ForegroundColor Yellow
pm2-startup install
pm2 start ecosystem.config.js
pm2 save

Write-Host "`n✅ Production setup complete!" -ForegroundColor Green
Write-Host "`nUseful commands:" -ForegroundColor Cyan
Write-Host "  pm2 status       - Check status" -ForegroundColor White
Write-Host "  pm2 logs         - View logs" -ForegroundColor White
Write-Host "  pm2 monit        - Monitor resources" -ForegroundColor White
Write-Host "  pm2 restart all  - Restart application" -ForegroundColor White
Write-Host "`n🌐 Application running at: https://localhost:3000" -ForegroundColor Cyan
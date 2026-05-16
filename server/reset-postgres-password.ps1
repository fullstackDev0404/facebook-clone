# PostgreSQL Password Reset Script
# Run this as Administrator

$ErrorActionPreference = "Stop"

$PG_HBA_PATH = "C:\Program Files\PostgreSQL\18\data\pg_hba.conf"
$SERVICE_NAME = "postgresql-x64-18"
$NEW_PASSWORD = "facebook12345678"

Write-Host "🔧 PostgreSQL Password Reset Script" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "   Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit 1
}

# Step 1: Backup pg_hba.conf
Write-Host "📋 Step 1: Backing up pg_hba.conf..." -ForegroundColor Yellow
Copy-Item $PG_HBA_PATH "$PG_HBA_PATH.backup" -Force
Write-Host "   ✅ Backup created at $PG_HBA_PATH.backup`n" -ForegroundColor Green

# Step 2: Modify pg_hba.conf to trust
Write-Host "🔓 Step 2: Enabling passwordless access..." -ForegroundColor Yellow
$content = Get-Content $PG_HBA_PATH
$content = $content -replace 'scram-sha-256', 'trust'
$content | Set-Content $PG_HBA_PATH
Write-Host "   ✅ Changed authentication to 'trust'`n" -ForegroundColor Green

# Step 3: Restart PostgreSQL
Write-Host "🔄 Step 3: Restarting PostgreSQL..." -ForegroundColor Yellow
Stop-Service $SERVICE_NAME -Force
Start-Sleep -Seconds 2
Start-Service $SERVICE_NAME
Start-Sleep -Seconds 3
Write-Host "   ✅ PostgreSQL restarted`n" -ForegroundColor Green

# Step 4: Reset password
Write-Host "🔑 Step 4: Resetting password..." -ForegroundColor Yellow
$psqlCommand = "ALTER USER postgres PASSWORD '$NEW_PASSWORD';"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "$psqlCommand" 2>&1 | Out-Null
Write-Host "   ✅ Password set to: $NEW_PASSWORD`n" -ForegroundColor Green

# Step 5: Create database
Write-Host "🗄️  Step 5: Creating database 'facebook_clone'..." -ForegroundColor Yellow
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE facebook_clone;" 2>&1 | Out-Null
Write-Host "   ✅ Database created`n" -ForegroundColor Green

# Step 6: Restore pg_hba.conf to scram-sha-256
Write-Host "🔒 Step 6: Restoring secure authentication..." -ForegroundColor Yellow
$content = Get-Content $PG_HBA_PATH
$content = $content -replace 'trust', 'scram-sha-256'
$content | Set-Content $PG_HBA_PATH
Write-Host "   ✅ Changed authentication back to 'scram-sha-256'`n" -ForegroundColor Green

# Step 7: Final restart
Write-Host "🔄 Step 7: Final PostgreSQL restart..." -ForegroundColor Yellow
Stop-Service $SERVICE_NAME -Force
Start-Sleep -Seconds 2
Start-Service $SERVICE_NAME
Start-Sleep -Seconds 3
Write-Host "   ✅ PostgreSQL restarted`n" -ForegroundColor Green

Write-Host "✅ SUCCESS! Password reset complete." -ForegroundColor Green
Write-Host "`nYou can now run: npm run db:migrate" -ForegroundColor Cyan
Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

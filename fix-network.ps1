# Run this as Administrator
# Fixes: 1) Windows Firewall blocking node.exe  2) Opens ports 3000 and 5001

Write-Host "=== Fixing Windows Firewall for Node.js ===" -ForegroundColor Cyan

# Remove ALL block rules for node.exe (auto-created when user clicked "Block")
$blocked = Get-NetFirewallRule | Where-Object {
    $_.Direction -eq 'Inbound' -and $_.Action -eq 'Block'
} | Where-Object {
    $_.DisplayName -like "*node*"
}

if ($blocked) {
    $blocked | ForEach-Object {
        Write-Host "Removing block rule: $($_.DisplayName)" -ForegroundColor Yellow
        Remove-NetFirewallRule -Name $_.Name
    }
    Write-Host "Block rules removed." -ForegroundColor Green
} else {
    Write-Host "No node.exe block rules found." -ForegroundColor Gray
}

# Remove old allow rules to avoid duplicates
Get-NetFirewallRule -DisplayName "Next.js Dev 3000"    -ErrorAction SilentlyContinue | Remove-NetFirewallRule
Get-NetFirewallRule -DisplayName "Node Server 5001"    -ErrorAction SilentlyContinue | Remove-NetFirewallRule
Get-NetFirewallRule -DisplayName "Port 3000 Allow All" -ErrorAction SilentlyContinue | Remove-NetFirewallRule
Get-NetFirewallRule -DisplayName "Port 5001 Allow All" -ErrorAction SilentlyContinue | Remove-NetFirewallRule
Get-NetFirewallRule -DisplayName "Node Allow 3000"     -ErrorAction SilentlyContinue | Remove-NetFirewallRule
Get-NetFirewallRule -DisplayName "Node Allow 5001"     -ErrorAction SilentlyContinue | Remove-NetFirewallRule
Get-NetFirewallRule -DisplayName "Node.js Allow All"   -ErrorAction SilentlyContinue | Remove-NetFirewallRule

# Add clean allow rules for ALL profiles (Domain, Private, Public)
New-NetFirewallRule -DisplayName "Node.js Port 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Any | Out-Null
New-NetFirewallRule -DisplayName "Node.js Port 5001" -Direction Inbound -Protocol TCP -LocalPort 5001 -Action Allow -Profile Any | Out-Null

Write-Host "Allow rules added for ports 3000 and 5001 on ALL profiles." -ForegroundColor Green

# Verify
Write-Host "`n=== Current rules for ports 3000/5001 ===" -ForegroundColor Cyan
Get-NetFirewallRule | Where-Object { $_.DisplayName -like "*Node*" } |
    Select-Object DisplayName, Action, Profile, Enabled |
    Format-Table -AutoSize

Write-Host "`nDone! Now restart the Next.js dev server." -ForegroundColor Green

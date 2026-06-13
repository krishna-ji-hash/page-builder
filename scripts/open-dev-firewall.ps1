# Run as Administrator: right-click PowerShell → Run as administrator, then:
#   cd path\to\Builder-custom
#   .\scripts\open-dev-firewall.ps1

$ruleName = 'Builder Custom Dev 3000'
$existing = netsh advfirewall firewall show rule name="$ruleName" 2>$null
if ($LASTEXITCODE -eq 0) {
  Write-Host "Firewall rule already exists: $ruleName"
} else {
  netsh advfirewall firewall add rule name="$ruleName" dir=in action=allow protocol=TCP localport=3000 enable=yes profile=any
  Write-Host "Added inbound firewall rule for TCP port 3000 (private + domain networks)."
}
Write-Host ""
Write-Host "On other devices (same Wi-Fi), open:"
Write-Host "  http://YOUR_LAN_IP:3000/admin/login"
Write-Host "Find YOUR_LAN_IP: ipconfig  ->  IPv4 Address (e.g. 192.168.1.21)"

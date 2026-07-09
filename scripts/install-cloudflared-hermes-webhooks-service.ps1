# Reinstall Cloudflared Windows service for Hermes webhooks (run once as Administrator).
# Fixes bare cloudflared.exe service with no tunnel config.
$ErrorActionPreference = 'Stop'
$cf = "${env:ProgramFiles(x86)}\cloudflared\cloudflared.exe"
$userConfigDir = "$env:USERPROFILE\.cloudflared"
$systemConfigDir = "$env:WINDIR\System32\config\systemprofile\.cloudflared"
$tunnelId = '05a62f82-fd86-4c7c-b2fe-45e2bf74ff1d'
$credName = "$tunnelId.json"

if (-not (Test-Path $cf)) { throw "cloudflared not found at $cf" }
if (-not (Test-Path "$userConfigDir\$credName")) { throw "Missing credentials $userConfigDir\$credName" }

New-Item -ItemType Directory -Force -Path $systemConfigDir | Out-Null
Copy-Item -Force "$userConfigDir\$credName" "$systemConfigDir\$credName"
@(
  "tunnel: $tunnelId"
  "credentials-file: $systemConfigDir\$credName"
  ""
  "ingress:"
  "  - hostname: hooks.sparras.dev"
  "    service: http://127.0.0.1:8644"
  "  - service: http_status:404"
) | Set-Content -Encoding utf8 "$systemConfigDir\config.yml"

Stop-Service Cloudflared -Force -ErrorAction SilentlyContinue
& $cf service uninstall 2>$null
& $cf service install --config "$systemConfigDir\config.yml"
Start-Service Cloudflared
Start-Sleep -Seconds 3
Get-Service Cloudflared | Format-List Name, Status, StartType
& $cf tunnel info hermes-webhooks
Write-Host "Verify: curl https://hooks.sparras.dev/health"
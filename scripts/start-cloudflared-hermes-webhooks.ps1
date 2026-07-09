# Start Hermes webhook tunnel (user session). Ingress uses 127.0.0.1:8644.
$cf = "${env:ProgramFiles(x86)}\cloudflared\cloudflared.exe"
$config = "$env:USERPROFILE\.cloudflared\config.yml"
if (-not (Test-Path $cf)) { throw "cloudflared not found" }
if (-not (Test-Path $config)) { throw "config not found: $config" }
$existing = Get-Process cloudflared -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "cloudflared already running (PID $($existing.Id -join ','))"
  exit 0
}
Start-Process -FilePath $cf -ArgumentList @('tunnel', '--config', $config, 'run', 'hermes-webhooks') -WindowStyle Hidden
Start-Sleep -Seconds 3
curl.exe -sS -m 10 "https://hooks.sparras.dev/health"
Write-Host ""
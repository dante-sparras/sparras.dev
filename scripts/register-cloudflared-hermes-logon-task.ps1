# Register logon scheduled task (no admin) for Hermes webhook tunnel.
$ErrorActionPreference = 'Stop'
$cf = "${env:ProgramFiles(x86)}\cloudflared\cloudflared.exe"
$config = "$env:USERPROFILE\.cloudflared\config.yml"
$action = New-ScheduledTaskAction -Execute $cf -Argument "tunnel --config `"$config`" run hermes-webhooks"
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
Register-ScheduledTask -TaskName 'HermesCloudflaredWebhooks' -Action $action -Trigger $trigger -Settings $settings -Description 'Cloudflare tunnel hooks.sparras.dev -> Hermes webhooks :8644' -Force | Out-Null
Get-ScheduledTask -TaskName 'HermesCloudflaredWebhooks' | Select-Object TaskName, State
Write-Host 'Registered: HermesCloudflaredWebhooks (At logon)'
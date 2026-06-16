$ErrorActionPreference = "Stop"
$vmrunPath = "C:\Program Files (x86)\VMware\VMware Workstation\vmrun.exe"
$vmxPath = "C:\Users\ADMINI~1\DOCUME~1\VIRTUA~1\UBUNTU~1\UBUNTU~1.VMX"

# Write a script to temp file in guest
$script = @"
#!/bin/bash
echo '=== DOCKER PS ==='
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
echo '=== PORT 3306 ==='
ss -tlnp 2>/dev/null | grep 3306 || echo '3306 not listening'
"@

# Run inline
$output = & $vmrunPath -gu cg -gp 123456 runScriptInGuest $vmxPath /bin/bash "$script" 2>&1
Write-Host $output

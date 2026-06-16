$ErrorActionPreference = "Stop"
$vmrunPath = "C:\Program Files (x86)\VMware\VMware Workstation\vmrun.exe"
$vmxPath = "C:\Users\ADMINI~1\DOCUME~1\VIRTUA~1\UBUNTU~1\UBUNTU~1.VMX"

Write-Host "Checking Docker containers..."
& $vmrunPath -gu cg -gp 123456 runScriptInGuest $vmxPath /bin/bash "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'" 2>&1

Write-Host "`nChecking port 3306..."
& $vmrunPath -gu cg -gp 123456 runScriptInGuest $vmxPath /bin/bash "ss -tlnp 2>/dev/null | grep 3306 || echo '3306 not listening'" 2>&1

$ErrorActionPreference = "Continue"
$vmrunPath = "C:\Program Files (x86)\VMware\VMware Workstation\vmrun.exe"
$vmxPath = "C:\Users\ADMINI~1\DOCUME~1\VIRTUA~1\UBUNTU~1\UBUNTU~1.VMX"

# Try running a simple command first
Write-Host "=== Test: hostname ==="
& $vmrunPath -gu cg -gp 123456 runScriptInGuest $vmxPath /bin/sh "hostname" 2>&1

Write-Host "`n=== Test: docker ps ==="
& $vmrunPath -gu cg -gp 123456 runScriptInGuest $vmxPath /bin/sh "docker ps" 2>&1

Write-Host "`n=== Restart middleware ==="
& $vmrunPath -gu cg -gp 123456 runScriptInGuest $vmxPath /bin/sh "cd /home/cg/quickframework-middleware && docker-compose up -d" 2>&1

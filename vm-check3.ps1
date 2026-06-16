$vmrunPath = "C:\Program Files (x86)\VMware\VMware Workstation\vmrun.exe"
$vmxPath = "C:\Users\ADMINI~1\DOCUME~1\VIRTUA~1\UBUNTU~1\UBUNTU~1.VMX"

$output = & $vmrunPath -gu cg -gp 123456 runScriptInGuest $vmxPath /bin/bash "docker ps" 2>&1
foreach ($line in $output) { Write-Host $line }

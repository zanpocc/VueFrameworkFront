$ErrorActionPreference = "Stop"
$vmrunPath = "C:\Program Files (x86)\VMware\VMware Workstation\vmrun.exe"

# Use 8.3 short path to avoid Chinese encoding issues
$fso = New-Object -ComObject Scripting.FileSystemObject
$vmDir = [System.IO.DirectoryInfo]'C:\Users\Administrator\Documents\Virtual Machines'
$dirs = $vmDir.GetDirectories()
foreach ($d in $dirs) {
    $short = $fso.GetFolder($d.FullName)
    $vmxFiles = $d.GetFiles('*.vmx')
    foreach ($v in $vmxFiles) {
        $shortFile = $fso.GetFile($v.FullName)
        Write-Host "SHORT_VMX=$($shortFile.ShortPath)"
    }
}

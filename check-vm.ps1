$ErrorActionPreference = "Stop"
$fso = New-Object -ComObject Scripting.FileSystemObject
$folder = $fso.GetFolder('C:\Users\Administrator\Documents\Virtual Machines\Ubuntu 64 位')
$shortPath = $folder.ShortPath
$parentShort = $fso.GetFolder('C:\Users\Administrator\Documents\Virtual Machines').ShortPath
Write-Host "Parent short: $parentShort"
Write-Host "Folder short: $shortPath"

# Find vmx
$vmxFiles = Get-ChildItem (Join-Path 'C:\Users\Administrator\Documents\Virtual Machines\Ubuntu 64 位' '*.vmx')
foreach ($f in $vmxFiles) {
    $shortFile = $fso.GetFile($f.FullName)
    Write-Host "VMX full: $($f.FullName)"
    Write-Host "VMX short: $($shortFile.ShortPath)"
}

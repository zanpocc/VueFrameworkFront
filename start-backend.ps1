$ErrorActionPreference = "Stop"

$repoRoot = "C:\Users\Administrator\Desktop\QuickFramework\JavaFrameworkBackend"
$jdkHome = Join-Path $repoRoot ".jdks\jdk-17"
$jarFile = Join-Path $repoRoot "platform-server-monolith\target\platform-server-monolith-0.1.0-SNAPSHOT-exec.jar"
$runDir = Join-Path $repoRoot ".run\monolith"
$logFile = Join-Path $runDir "monolith.log"

$env:JAVA_HOME = $jdkHome
$env:PATH = "$(Join-Path $jdkHome 'bin');$env:PATH"
$env:SPRING_PROFILES_ACTIVE = "local-vm"
$env:MYSQL_HOST = "192.168.36.134"
$env:MYSQL_PORT = "3306"
$env:MYSQL_DATABASE = "quickframework"
$env:MYSQL_APP_USERNAME = "quickframework"
$env:MYSQL_APP_PASSWORD = "quickframework_dev"
$env:SPRING_DATA_REDIS_HOST = "192.168.36.134"
$env:SPRING_DATA_REDIS_PORT = "6379"

Write-Host "Starting monolith with local-vm profile..."
Write-Host "JAVA_HOME=$env:JAVA_HOME"
Write-Host "MYSQL_HOST=$env:MYSQL_HOST"
Write-Host "REDIS_HOST=$env:SPRING_DATA_REDIS_HOST"

& "$jdkHome\bin\java.exe" -Xms128m -Xmx512m -jar $jarFile 2>&1 | Tee-Object -FilePath $logFile

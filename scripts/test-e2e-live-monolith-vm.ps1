param(
    [switch]$SkipBackendStart,
    [switch]$SkipDatabaseReset,
    [switch]$KeepBackendRunning,
    [int]$TimeoutSeconds = 180
)

$ErrorActionPreference = "Stop"

$frontRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$workspaceRoot = (Resolve-Path (Join-Path $frontRoot "..")).Path
$backendRoot = Join-Path $workspaceRoot "JavaFrameworkBackend"
$backendHealthUrl = "http://127.0.0.1:8080/actuator/health"

function Wait-Backend {
    param(
        [string]$Url,
        [datetime]$Deadline
    )

    while ((Get-Date) -lt $Deadline) {
        try {
            $response = Invoke-RestMethod -Method Get -Uri $Url -TimeoutSec 5
            if ($response.status -eq "UP") {
                Write-Host "OK backend: $Url"
                return
            }
        } catch {
            Start-Sleep -Seconds 2
            continue
        }
        Start-Sleep -Seconds 2
    }

    throw "Backend did not become ready before timeout: $Url"
}

try {
    if (-not $SkipBackendStart) {
        Push-Location $backendRoot
        try {
            & ".\scripts\stop-monolith.ps1"
            if (-not $SkipDatabaseReset) {
                & ".\scripts\vm\reset-mysql-databases.ps1" -Databases quickframework
            }
            & ".\scripts\run-monolith-vm.ps1" -Background -UseJar -JvmArgs "-Xms128m -Xmx512m"
        } finally {
            Pop-Location
        }
    }

    Wait-Backend -Url $backendHealthUrl -Deadline (Get-Date).AddSeconds($TimeoutSeconds)

    Push-Location $frontRoot
    try {
        $env:VITE_API_BASE_URL = "/api"
        $env:VITE_API_PROXY_TARGET = "http://127.0.0.1:8080"
        & yarn playwright test -c playwright.live.config.ts
        if ($LASTEXITCODE -ne 0) {
            throw "Playwright live backend E2E failed with exit code $LASTEXITCODE"
        }
    } finally {
        Pop-Location
    }
} finally {
    if (-not $SkipBackendStart -and -not $KeepBackendRunning) {
        Push-Location $backendRoot
        try {
            & ".\scripts\stop-monolith.ps1"
        } finally {
            Pop-Location
        }
    }
}

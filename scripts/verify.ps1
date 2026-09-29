Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot

function Invoke-NativeStep {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Name,
        [Parameter(Mandatory = $true)]
        [string] $WorkingDirectory,
        [Parameter(Mandatory = $true)]
        [string] $Command,
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]] $Arguments
    )

    Write-Host ""
    Write-Host "==> $Name"

    Push-Location $WorkingDirectory
    try {
        & $Command @Arguments
        $ExitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }

    if ($ExitCode -ne 0) {
        throw "$Name failed with exit code $ExitCode."
    }

    $script:LASTEXITCODE = 0
}

$Frontend = Join-Path $Root "frontend"
$Backend = Join-Path $Root "backend"

try {
    Invoke-NativeStep "Frontend test" $Frontend "npm.cmd" "test"
    Invoke-NativeStep "Frontend build" $Frontend "npm.cmd" "run" "build"
    Invoke-NativeStep "Backend test" $Backend ".\gradlew.bat" "test"
    Invoke-NativeStep "Backend build" $Backend ".\gradlew.bat" "build"

    Write-Host ""
    Write-Host "Local verification passed."
    exit 0
}
catch {
    Write-Error $_
    exit 1
}

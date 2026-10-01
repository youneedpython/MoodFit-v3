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

# DEC-015: 승인된 Node.js Version은 .nvmrc를 기준으로 한다. 불일치 시 경고만 출력한다.
function Test-NodeVersion {
    $Expected = (Get-Content (Join-Path $Root ".nvmrc") -TotalCount 1).Trim()
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Warning "Node.js version could not be detected (node not found). .nvmrc expects $Expected."
        return
    }

    $Actual = ((& node --version) -replace '^v', '').Trim()

    if ($Actual -ne $Expected) {
        Write-Warning "Node.js $Actual is in use, but .nvmrc expects $Expected (CI uses $Expected)."
    }
    else {
        Write-Host "Node.js $Actual (matches .nvmrc)"
    }
}

$Frontend = Join-Path $Root "frontend"
$Backend = Join-Path $Root "backend"

try {
    Test-NodeVersion
    Invoke-NativeStep "Frontend install (npm ci)" $Frontend "npm.cmd" "ci"
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

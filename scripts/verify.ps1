$ErrorActionPreference = "Stop"

function Invoke-NpmStep {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,
        [Parameter(Mandatory = $true)]
        [scriptblock]$Command
    )

    Write-Host "$Name..." -ForegroundColor Cyan
    & $Command
    $exitCode = $LASTEXITCODE

    if ($exitCode -ne 0) {
        throw "$Name failed with exit code $exitCode. Verification stopped."
    }
}

Invoke-NpmStep "Installing dependencies" { npm install }
Invoke-NpmStep "Running tests" { npm test }
Invoke-NpmStep "Running lint" { npm run lint }
Invoke-NpmStep "Running production build" { npm run build }

Write-Host "ExamLabel verification passed." -ForegroundColor Green

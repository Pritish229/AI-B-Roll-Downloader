# Ensure script executes in its parent project directory
Set-Location -Path $PSScriptRoot

# AI B-Roll Downloader - PowerShell 1-Click Desktop Launcher with Auto-Node Installer
Write-Host "=========================================================" -ForegroundColor Magenta
Write-Host "      LAUNCHING AI B-ROLL DOWNLOADER DESKTOP APP        " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Magenta

# Check if Node.js is installed
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVer = (node -v).Trim()
    Write-Host "[OK] Node.js Status: INSTALLED (Version $nodeVer)" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[!] Node.js Status: NOT INSTALLED" -ForegroundColor Yellow
    Write-Host "[!] Starting automatic Node.js download & installation..." -ForegroundColor Cyan
    Write-Host ""

    $installed = $false

    # Try winget first if available
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Write-Host "--> Attempting fast install via Windows Package Manager (winget)..." -ForegroundColor Green
        try {
            Start-Process winget -ArgumentList "install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements" -Wait
            $installed = $true
        } catch {
            Write-Host "--> Winget install bypassed." -ForegroundColor Yellow
        }
    }

    # Fallback to direct MSI download from official nodejs.org
    if (-not $installed -or -not (Get-Command node -ErrorAction SilentlyContinue)) {
        $msiUrl = "https://nodejs.org/dist/v20.15.1/node-v20.15.1-x64.msi"
        $msiPath = Join-Path $env:TEMP "node-installer-v20.msi"

        Write-Host "--> Downloading Node.js v20 LTS installer from official server..." -ForegroundColor Green
        try {
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            Invoke-WebRequest -Uri $msiUrl -OutFile $msiPath
            Write-Host "--> Running Node.js installer UI..." -ForegroundColor Green
            Start-Process msiexec.exe -ArgumentList "/i `"$msiPath`" /qb" -Wait
        } catch {
            Write-Host "[ERROR] Failed to auto-download Node.js installer: $_" -ForegroundColor Red
            Write-Host "Please download Node.js manually from https://nodejs.org/" -ForegroundColor Yellow
            Read-Host -Prompt "Press Enter to exit..."
            exit 1
        }
    }

    # Refresh PATH in current execution process
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

# Verify Node installation after setup attempt
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js installation completed, but PATH requires shell restart." -ForegroundColor Red
    Write-Host "Please close this window and run start-desktop.bat or start-desktop.ps1 again." -ForegroundColor Yellow
    Read-Host -Prompt "Press Enter to exit..."
    exit 1
}

# Auto-install dependencies if node_modules missing
if (-not (Test-Path "node_modules")) {
    Write-Host "--> Installing project dependencies for first-time setup..." -ForegroundColor Green
    npm install
}

Write-Host "[1/3] Starting backend & frontend services..." -ForegroundColor Green

# Spawn server background process with explicit working directory
$processInfo = New-Object System.Diagnostics.ProcessStartInfo
$processInfo.FileName = "cmd.exe"
$processInfo.Arguments = "/c npm run dev"
$processInfo.WorkingDirectory = $PSScriptRoot
$processInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
[System.Diagnostics.Process]::Start($processInfo) | Out-Null

Write-Host "[2/3] Waiting for application server to initialize..." -ForegroundColor Green
Start-Sleep -Seconds 5

Write-Host "[3/3] Launching Native Desktop Window..." -ForegroundColor Green

$url = "http://localhost:3000"
$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$profileDir = "$env:LOCALAPPDATA\AI-BRoll-Downloader-Profile"

if (Test-Path $edgePath) {
    Start-Process $edgePath -ArgumentList "--app=$url", "--window-size=1280,850", "--user-data-dir=$profileDir"
} elseif (Test-Path $chromePath) {
    Start-Process $chromePath -ArgumentList "--app=$url", "--window-size=1280,850", "--user-data-dir=$profileDir"
} else {
    Start-Process $url
}

Write-Host "=========================================================" -ForegroundColor Magenta
Write-Host " Application Desktop Window Active at $url" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Magenta

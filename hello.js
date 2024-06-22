# Define the base directory where your Git repositories are located
$baseDir = "C:\path\to\your\repositories"

# Recursively find and delete all target directories
Get-ChildItem -Path $baseDir -Recurse -Directory -Force | Where-Object {
    Test-Path "$($_.FullName)\.git" -PathType Container
} | ForEach-Object {
    $repoDir = $_.FullName
    Write-Host "Processing repository in: $repoDir"
    Get-ChildItem -Path $repoDir -Recurse -Directory -Filter "target" -Force | ForEach-Object {
        $targetDir = $_.FullName
        Write-Host "Deleting: $targetDir"
        Remove-Item -Path $targetDir -Recurse -Force
    }
}

Write-Host "Completed."
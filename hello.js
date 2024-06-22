$baseDir = Get-Location

$folders = Get-ChildItem -Path $baseDir -Directory -Recurse | ForEach-Object {
    $folderPath = $_.FullName
    $folderSize = (Get-ChildItem -Path $folderPath -Recurse | Measure-Object -Property Length -Sum).Sum
    [PSCustomObject]@{
        Path = $folderPath
        Size = [Math]::Round($folderSize / 1MB, 2)
    }
}

$sortedFolders = $folders | Sort-Object -Property Size -Descending

$sortedFolders | ForEach-Object { Write-Host "Path: $($_.Path) Size: $($_.Size) MB" }
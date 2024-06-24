function issh {
    param (
        [string]$UserHost
    )
    
    $keyPath = "C:\Users\YourUser\Documents\mykey"  # Update this path to your key file
    
    if ($UserHost -match "^([^@]+)@([^@]+)$") {
        $UserName = $matches[1]
        $HostName = $matches[2]
        ssh -i $keyPath "$UserName@$HostName"
    } else {
        Write-Host "Invalid format. Use: issh username@hostname"
    }
}
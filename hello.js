function Invoke-SSHCommandFromConfig {
    # Path to SSH config file (adjust path as needed)
    $sshConfigFile = "$env:USERPROFILE\.ssh\config"  # Example for Windows, adjust for Linux/Unix

    # Check if SSH config file exists
    if (Test-Path $sshConfigFile -PathType Leaf) {
        Write-Output "SSH config file found: $sshConfigFile"

        # Read SSH config file
        $configContent = Get-Content $sshConfigFile -Raw

        # Parse SSH config file
        $hosts = @{}
        $configContent -split "\r?\n" | ForEach-Object {
            $line = $_.Trim()
            if ($line -match '^Host\s+(.+)') {
                $currentHost = $matches[1].Trim()
                $hosts[$currentHost] = @{}
            }
            elseif ($line -match '^\s*([A-Za-z]+)\s+(.+)$' -and $currentHost) {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                $hosts[$currentHost][$key] = $value
            }
        }

        if ($hosts.Count -gt 0) {
            # Present host names to user
            Write-Output "Available hosts from SSH config:"
            $index = 1
            $hosts.Keys | ForEach-Object {
                Write-Output "$index. $_"
                $index++
            }

            # Prompt user to select a host
            $choice = Read-Host "Enter the number of the host to connect to (1-$($hosts.Count))"

            if ($choice -ge 1 -and $choice -le $hosts.Count) {
                $selectedHost = $hosts.Keys[$choice - 1]
                Write-Output "Selected host: $selectedHost"

                # Execute SSH command
                $sshHostname = $hosts[$selectedHost]['HostName']
                $sshUser = $hosts[$selectedHost]['User']  # Assuming 'User' is specified in config
                $sshCommand = "ssh"
                if ($sshUser) {
                    $sshCommand += " -l $sshUser"
                }
                $sshCommand += " $sshHostname"
                
                Write-Output "Executing SSH command: $sshCommand"
                Invoke-Expression $sshCommand
            } else {
                Write-Output "Invalid choice. Exiting."
            }
        } else {
            Write-Output "No hosts found in SSH config file."
        }
    } else {
        Write-Output "SSH config file not found: $sshConfigFile"
    }
}
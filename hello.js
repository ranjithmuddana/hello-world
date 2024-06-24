function Invoke-SSHCommandFromConfig {
    # Path to SSH config file (adjust path as needed)
    $sshConfigFile = "$env:USERPROFILE\.ssh\config"  # Example for Windows, adjust for Linux/Unix

    # Check if SSH config file exists
    if (Test-Path $sshConfigFile -PathType Leaf) {
        Write-Output "SSH config file found: $sshConfigFile"

        # Read SSH config file
        $configContent = Get-Content $sshConfigFile -Raw

        # Initialize variables to store hosts and their configurations
        $hosts = @{}
        $currentHost = $null

        # Parse SSH config file
        foreach ($line in $configContent -split "\r?\n") {
            $line = $line.Trim()
            if ($line -match '^Host\s+(.+)') {
                # New host entry found
                $currentHost = $matches[1].Trim()
                $hosts[$currentHost] = @{}
            } elseif ($line -match '^\s*HostName\s+(.+)$' -and $currentHost) {
                # HostName line found, capture the IP address
                $hosts[$currentHost]['IPAddress'] = $matches[1].Trim()
            } elseif ($line -match '^\s*User\s+(.+)$' -and $currentHost) {
                # User line found, capture the username if needed
                $hosts[$currentHost]['User'] = $matches[1].Trim()
            }
        }

        # Print the contents of the $hosts object for debugging
        Write-Output "Contents of \$hosts object after reading SSH config file:"
        $hosts | Format-List  # Display $hosts as a list for readability
        Write-Output "==============================="

        if ($hosts.Count -gt 0) {
            # Present host names to user
            Write-Output "Available hosts from SSH config:"
            $index = 1
            $hosts.Keys | ForEach-Object {
                Write-Output "$index. $_ - $($hosts[$_]['IPAddress'])"
                $index++
            }

            # Prompt user to select a host
            $choice = Read-Host "Enter the number of the host to connect to (1-$($hosts.Count))"

            if ($choice -ge 1 -and $choice -le $hosts.Count) {
                $selectedHost = $hosts.Keys[$choice - 1]
                Write-Output "Selected host: $selectedHost"

                # Execute SSH command
                $sshHostname = $hosts[$selectedHost]['IPAddress']
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
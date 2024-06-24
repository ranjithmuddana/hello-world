function ExecuteSSHCommand {
    param (
        [string]$Username = $env:SSH_USERNAME,  # Default to environment variable if not provided
        [string]$Host = $env:SSH_HOST          # Default to environment variable if not provided
    )

    # Define a list of hosts to choose from
    $validHosts = @("host1.example.com", "host2.example.com", "host3.example.com")

    # Prompt user to select a host if $Host is not provided or not in $validHosts
    if (-not $Host -or $validHosts -notcontains $Host) {
        Write-Output "Choose a host to connect to:"
        for ($i = 0; $i -lt $validHosts.Count; $i++) {
            Write-Output "$($i + 1). $($validHosts[$i])"
        }
        $hostChoice = Read-Host "Enter host number (1-$($validHosts.Count)):"
        $Host = $validHosts[$hostChoice - 1]
    }

    # Construct SSH command
    $sshCommand = "ssh"
    if ($Username) {
        $sshCommand += " $Username@"
    }
    $sshCommand += " $Host"

    # Execute SSH command
    Write-Output "Executing SSH command:"
    Write-Output $sshCommand
    # Uncomment the following line to actually execute the SSH command
    # Invoke-Expression $sshCommand
}

# Example usage:
# ExecuteSSHCommand -Username "myusername" -Host "host1.example.com"
function issh {
    $keyPath = "C:\Users\YourUser\Documents\mykey"  # Update this path to your key file
    
    # Fetch the list of running instances
    $instancesJson = gcloud compute instances list --filter="status=RUNNING" --format="json(name,zone,networkInterfaces[0].networkIP)"
    $instances = $instancesJson | ConvertFrom-Json
    
    if ($instances.Count -eq 0) {
        Write-Host "No running instances found."
        return
    }

    # Display the list of instances
    Write-Host "Select an instance to connect:"
    for ($i = 0; $i -lt $instances.Count; $i++) {
        Write-Host "$i. $($instances[$i].name) in $($instances[$i].zone) with internal IP $($instances[$i].networkInterfaces[0].networkIP)"
    }

    # Get user selection
    $selection = Read-Host "Enter the number of the instance"
    if ($selection -match '^\d+$' -and $selection -ge 0 -and $selection -lt $instances.Count) {
        $instance = $instances[$selection]
        $instanceName = $instance.name
        $instanceZone = $instance.zone
        $internalIP = $instance.networkInterfaces[0].networkIP
        
        # Connect via SSH
        if ($internalIP) {
            ssh -i $keyPath $env:USERNAME@$internalIP
        } else {
            Write-Host "Failed to retrieve the internal IP address of the selected instance."
        }
    } else {
        Write-Host "Invalid selection."
    }
}
function Invoke-GsutilCommand {
    param (
        [string]$SubCommand,
        [Parameter(ValueFromRemainingArguments = $true)]
        $Arguments
    )

    switch ($SubCommand) {
        "ls" { & gsutil ls @Arguments }
        "cat" { & gsutil cat @Arguments }
        default { Write-Error "Unknown gsutil command: $SubCommand" }
    }
}

Set-Alias -Name gls -Value Invoke-GsutilCommand
Set-Alias -Name gcat -Value Invoke-GsutilCommand

# Example usage (uncomment to test within the script):
# gls ls gs://my-bucket
# gcat cat gs://my-bucket/my-file.txt
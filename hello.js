# Import the BurntToast module
Import-Module BurntToast

# Define break intervals in minutes
$breakInterval = 60  # 60 minutes or 1 hour

# Infinite loop for continuous reminders
while ($true) {
    # Display toast notification
    New-BurntToastNotification -Text "It's time for a break! Take a few minutes to relax and stretch." -AppLogo "C:\Path\To\Your\Logo.png"

    # Wait for the break interval
    Start-Sleep -Seconds ($breakInterval * 60)  # Convert minutes to seconds
}
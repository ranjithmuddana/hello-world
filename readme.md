#!/bin/bash

# --- CONFIGURATION ---
# Change this to match the exact name of your external drive in Finder
EXTERNAL_NAME="ExternalSSD"
# ---------------------

TARGET_DIR="/Volumes/$EXTERNAL_NAME"
BREW_BASE="/opt/homebrew"

# 1. Verification checks
if [ ! -d "$TARGET_DIR" ]; then
    echo "❌ Error: External drive '$TARGET_DIR' not found."
    echo "Please update the EXTERNAL_NAME variable in the script or connect your drive."
    exit 1
fi

echo "🍏 Starting Interactive Mac Storage Migration"
echo "--------------------------------------------------"
echo "Instructions: Type 'y' and Enter to run a command. Press Enter alone to skip it."
echo "--------------------------------------------------"

# Helper function to print a command, ask for confirmation, and run it
confirm_and_run() {
    local cmd="$1"
    
    # Print the command in yellow text for clear visibility
    echo -e "\n👉 Ready to run: \033[33m$cmd\033[0m"
    read -p "Execute this command? (y/N): " response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        # Run the command
        eval "$cmd"
        return $?
    else
        echo "⏭️  Skipped."
        return 1
    fi
}

# Core function to handle folder tracking
migrate_folder() {
    local source_path="$1"
    local dest_path="$2"
    
    # Check if source exists and is not already a symlink
    if [ -d "$source_path" ] && [ ! -L "$source_path" ]; then
        echo -e "\n📦 --- Target found: $source_path ---"
        
        # Step A: Create target directory
        confirm_and_run "mkdir -p \"$(dirname "$dest_path")\""
        
        # Step B: Sync files safely using rsync
        confirm_and_run "sudo rsync -avP \"$source_path/\" \"$dest_path/\""
        
        # Only proceed to delete/link if the rsync prompt wasn't skipped
        if [ $? -eq 0 ]; then
            # Step C: Remove the original directory
            confirm_and_run "sudo rm -rf \"$source_path\""
            
            # Step D: Create the symbolic link
            confirm_and_run "sudo ln -s \"$dest_path\" \"$source_path\""
        else
            echo "ℹ️  Rsync step was skipped or failed. Skipping deletion and linking to keep data safe."
        fi
    elif [ -L "$source_path" ]; then
        echo "⏭️  Skipping target: '$source_path' is already a symbolic link."
    else
        echo "ℹ️  Skipping target: '$source_path' does not exist on your internal drive."
    fi
    echo "--------------------------------------------------"
}

# --- PROCESS TARGETS ---

# Target 1: The developer environment (Xcode, Simulators, DerivedData)
migrate_folder "$HOME/Library/Developer" "$TARGET_DIR/Developer"

# Target 2: Homebrew Cellar (CLI Tools)
migrate_folder "$BREW_BASE/Cellar" "$TARGET_DIR/Homebrew/Cellar"

# Target 3: Homebrew Caskroom (GUI Apps)
migrate_folder "$BREW_BASE/Caskroom" "$TARGET_DIR/Homebrew/Caskroom"

# Target 4: Specific heavy Application Support items
migrate_folder "$HOME/Library/Application Support/Code" "$TARGET_DIR/AppSupport/Code"
migrate_folder "$HOME/Library/Application Support/Google/Chrome" "$TARGET_DIR/AppSupport/Chrome"
migrate_folder "$HOME/Library/Application Support/Spotify" "$TARGET_DIR/AppSupport/Spotify"
migrate_folder "$HOME/Library/Application Support/discord" "$TARGET_DIR/AppSupport/discord"
migrate_folder "$HOME/Library/Application Support/Steam" "$TARGET_DIR/AppSupport/Steam"

echo -e "\n🏁 Interactive migration process finished!"

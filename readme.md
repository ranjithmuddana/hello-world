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

echo "🍏 Starting Mac storage migration to: $TARGET_DIR"
echo "--------------------------------------------------"

# Function to safely move and symlink a directory
migrate_folder() {
    local source_path="$1"
    local dest_path="$2"
    
    # Check if source exists and is not already a symlink
    if [ -d "$source_path" ] && [ ! -L "$source_path" ]; then
        echo "📦 Migrating: $source_path"
        
        # Create target directory on external drive
        mkdir -p "$(dirname "$dest_path")"
        
        # Sync the data safely (a = archive/permissions, v = verbose, P = progress)
        sudo rsync -avP "$source_path/" "$dest_path/"
        
        # Verify sync was successful before deleting
        if [ $? -eq 0 ]; then
            echo "✅ Sync successful. Removing original internal files..."
            sudo rm -rf "$source_path"
            
            echo "🔗 Creating symlink..."
            sudo ln -s "$dest_path" "$source_path"
            echo "🎉 Successfully linked $source_path -> $dest_path"
        else
            echo "❌ Error syncing $source_path. Keeping original folder intact."
        fi
    elif [ -L "$source_path" ]; then
        echo "⏭️  Skipping: $source_path is already a symbolic link."
    else
        echo "ℹ️  Skipping: $source_path does not exist or isn't a directory."
    fi
    echo "--------------------------------------------------"
}

# --- PROCESS TARGETS ---

# Target 1: The heavy developer environment (Xcode, Simulators, DerivedData)
migrate_folder "$HOME/Library/Developer" "$TARGET_DIR/Developer"

# Target 2: Homebrew Cellar (Where CLI tools are installed)
migrate_folder "$BREW_BASE/Cellar" "$TARGET_DIR/Homebrew/Cellar"

# Target 3: Homebrew Caskroom (Where GUI application binaries sit)
migrate_folder "$BREW_BASE/Caskroom" "$TARGET_DIR/Homebrew/Caskroom"

echo "🏁 Migration script finished!"
echo "💡 Reminder: Keep '$EXTERNAL_NAME' plugged in when running terminal tools or compiling code."

#!/bin/bash

# API Response Standardization Migration Script
# This script helps standardize response formats across all controllers

echo "🔧 Starting API Response Standardization Migration..."
echo ""

# Function to backup a file
backup_file() {
    local file=$1
    if [ -f "$file" ]; then
        cp "$file" "$file.backup.$(date +%Y%m%d_%H%M%S)"
        echo "✅ Backed up: $file"
    fi
}

# Function to update a controller file
update_controller() {
    local file=$1
    local controller_name=$(basename "$file" .js)
    
    echo "📝 Processing: $controller_name"
    
    # Backup the file
    backup_file "$file"
    
    # Add response helpers import if not present
    if ! grep -q "responseHelpers" "$file"; then
        # Find the line with require statements and add our import
        sed -i '/const.*require.*models\|const.*require.*services/a\\nconst { sendSuccess, sendError, sendValidationError, sendNotFound, sendUnauthorized, sendForbidden, sendRateLimit, asyncHandler } = require('\''../utils/responseHelpers'\'');' "$file"
        echo "  ➕ Added responseHelpers import"
    fi
    
    # Replace common response patterns
    
    # Replace basic error responses
    sed -i 's/res\.status(\([0-9]*\))\.json({[[:space:]]*success: false,[[:space:]]*message: \([^}]*\)[[:space:]]*})/sendError(res, \1, { message: \2 })/g' "$file"
    
    # Replace basic success responses
    sed -i 's/res\.json({[[:space:]]*success: true,[[:space:]]*message: \([^,]*\),[[:space:]]*data: \([^}]*\)[[:space:]]*})/sendSuccess(res, 200, { message: \1, data: \2 })/g' "$file"
    
    # Replace status + json success responses
    sed -i 's/res\.status(\([0-9]*\))\.json({[[:space:]]*success: true,[[:space:]]*message: \([^,]*\),[[:space:]]*data: \([^}]*\)[[:space:]]*})/sendSuccess(res, \1, { message: \2, data: \3 })/g' "$file"
    
    echo "  ✅ Updated response patterns"
}

# Main execution
echo "📂 Scanning backend/controllers directory..."
echo ""

# Update all controller files
for file in backend/controllers/*Controller.js; do
    if [ -f "$file" ]; then
        update_controller "$file"
        echo ""
    fi
done

echo "🎉 Migration completed!"
echo ""
echo "📋 Next steps:"
echo "1. Review the updated files for any manual adjustments needed"
echo "2. Test your API endpoints"
echo "3. Update frontend services to expect standardized responses"
echo "4. Remove .backup files once you're satisfied with the changes"
echo ""
echo "📚 Standard response formats:"
echo "  Success: { success: true, message: '...', data: {...} }"
echo "  Error:   { success: false, message: '...', error: 'ERROR_CODE' }"
echo "  Paginated: { success: true, data: [...], pagination: {...} }"
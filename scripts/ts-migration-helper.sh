#!/bin/bash

# TypeScript Migration Helper Scripts
# Collection of utilities to assist with the TypeScript migration process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# SCRIPT 1: Count Migration Progress
# ============================================================================
count_migration_progress() {
    echo -e "${BLUE}=== TypeScript Migration Progress ===${NC}"
    echo ""
    
    # Count frontend services
    total_services=$(find src/services -name "*.js" -o -name "*.ts" | wc -l)
    ts_services=$(find src/services -name "*.ts" | wc -l)
    js_services=$(find src/services -name "*.js" | wc -l)
    
    echo -e "${YELLOW}Frontend Services:${NC}"
    echo "  Total: $total_services"
    echo "  TypeScript: $ts_services"
    echo "  JavaScript: $js_services"
    echo "  Progress: $(( ts_services * 100 / (ts_services + js_services) ))%"
    echo ""
    
    # Count backend controllers
    total_controllers=$(find backend/controllers -name "*.js" -o -name "*.ts" | wc -l)
    ts_controllers=$(find backend/controllers -name "*.ts" | wc -l)
    js_controllers=$(find backend/controllers -name "*.js" | wc -l)
    
    echo -e "${YELLOW}Backend Controllers:${NC}"
    echo "  Total: $total_controllers"
    echo "  TypeScript: $ts_controllers"
    echo "  JavaScript: $js_controllers"
    echo "  Progress: $(( ts_controllers * 100 / (ts_controllers + js_controllers) ))%"
    echo ""
    
    # Count screens
    total_screens=$(find src/screens -name "*.js" -o -name "*.tsx" | wc -l)
    tsx_screens=$(find src/screens -name "*.tsx" | wc -l)
    js_screens=$(find src/screens -name "*.js" | wc -l)
    
    echo -e "${YELLOW}Screens:${NC}"
    echo "  Total: $total_screens"
    echo "  TypeScript: $tsx_screens"
    echo "  JavaScript: $js_screens"
    echo "  Progress: $(( tsx_screens * 100 / (tsx_screens + js_screens) ))%"
    echo ""
    
    # Overall progress
    total_files=$(( js_services + js_controllers + js_screens ))
    migrated_files=$(( ts_services + ts_controllers + tsx_screens ))
    overall_progress=$(( migrated_files * 100 / (migrated_files + total_files) ))
    
    echo -e "${GREEN}Overall Progress: ${overall_progress}%${NC}"
    echo -e "${GREEN}Files Migrated: ${migrated_files} / $(( migrated_files + total_files ))${NC}"
}

# ============================================================================
# SCRIPT 2: Find Files to Migrate Next
# ============================================================================
find_next_files() {
    echo -e "${BLUE}=== Next Files to Migrate ===${NC}"
    echo ""
    
    echo -e "${YELLOW}Frontend Services (sorted by size):${NC}"
    find src/services -name "*.js" ! -name "api.js" -exec wc -l {} + | sort -n | head -10
    echo ""
    
    echo -e "${YELLOW}Backend Controllers (sorted by size):${NC}"
    find backend/controllers -name "*.js" ! -name "*.backup.js" -exec wc -l {} + | sort -n | head -10
    echo ""
    
    echo -e "${YELLOW}Screens (sorted by size):${NC}"
    find src/screens -name "*.js" -exec wc -l {} + | sort -n | head -10
}

# ============================================================================
# SCRIPT 3: Check for Import Issues
# ============================================================================
check_imports() {
    local file=$1
    echo -e "${BLUE}=== Checking Imports for: $file ===${NC}"
    echo ""
    
    # Find all files that import this file
    echo -e "${YELLOW}Files importing this module:${NC}"
    grep -r "from.*$(basename $file .js)" src/ backend/ 2>/dev/null | cut -d: -f1 | sort -u
    echo ""
    
    # Check if TypeScript version exists
    local ts_version="${file%.js}.ts"
    local tsx_version="${file%.js}.tsx"
    
    if [ -f "$ts_version" ]; then
        echo -e "${GREEN}✓ TypeScript version exists: $ts_version${NC}"
    elif [ -f "$tsx_version" ]; then
        echo -e "${GREEN}✓ TypeScript version exists: $tsx_version${NC}"
    else
        echo -e "${RED}✗ No TypeScript version found${NC}"
    fi
}

# ============================================================================
# SCRIPT 4: Validate TypeScript File
# ============================================================================
validate_typescript() {
    local file=$1
    echo -e "${BLUE}=== Validating TypeScript: $file ===${NC}"
    echo ""
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}✗ File not found: $file${NC}"
        return 1
    fi
    
    # Type check the file
    echo -e "${YELLOW}Running type check...${NC}"
    if npx tsc --noEmit "$file" 2>&1 | grep -q "error TS"; then
        echo -e "${RED}✗ Type errors found:${NC}"
        npx tsc --noEmit "$file"
        return 1
    else
        echo -e "${GREEN}✓ No type errors${NC}"
    fi
    
    # Check for 'any' types
    echo ""
    echo -e "${YELLOW}Checking for 'any' types...${NC}"
    local any_count=$(grep -c ": any" "$file" 2>/dev/null || echo "0")
    if [ "$any_count" -gt 0 ]; then
        echo -e "${YELLOW}⚠ Found $any_count 'any' types${NC}"
        grep -n ": any" "$file"
    else
        echo -e "${GREEN}✓ No 'any' types found${NC}"
    fi
    
    # Check for proper exports
    echo ""
    echo -e "${YELLOW}Checking exports...${NC}"
    if grep -q "export " "$file"; then
        echo -e "${GREEN}✓ Has exports${NC}"
        grep -n "^export " "$file" | head -5
    else
        echo -e "${YELLOW}⚠ No exports found${NC}"
    fi
}

# ============================================================================
# SCRIPT 5: Generate Type Definitions Template
# ============================================================================
generate_type_template() {
    local filename=$1
    local service_name=$(basename "$filename" .js | sed 's/Service$//')
    
    cat << EOF
/**
 * ${service_name} Service - TypeScript
 * Generated template - customize as needed
 */

import logger from '../utils/logger';
import api from './api';

// ==================== TYPES ====================

export interface ${service_name}Data {
  id: string;
  // Add properties here
}

export interface ${service_name}Response {
  success: boolean;
  data?: ${service_name}Data;
  error?: string;
  message?: string;
}

export type ${service_name}Status = 'pending' | 'active' | 'completed' | 'error';

// ==================== SERVICE ====================

export class ${service_name}Service {
  /**
   * Get ${service_name,,} data
   * @param id - ${service_name} identifier
   * @returns Promise resolving to ${service_name,,} data or null
   */
  static async get(id: string): Promise<${service_name}Data | null> {
    try {
      const response = await api.get(\`/api/${service_name,,}/\${id}\`);
      
      if (!response.success) {
        logger.error('Error getting ${service_name,,}', new Error(response.message));
        return null;
      }
      
      return response.data || null;
    } catch (error) {
      logger.error('Error getting ${service_name,,}', error as Error);
      return null;
    }
  }
  
  /**
   * Create new ${service_name,,}
   * @param data - ${service_name} data
   * @returns Promise resolving to response
   */
  static async create(data: Partial<${service_name}Data>): Promise<${service_name}Response> {
    try {
      const response = await api.post('/api/${service_name,,}', data);
      
      if (!response.success) {
        logger.error('Error creating ${service_name,,}', new Error(response.message));
        return { success: false, error: response.message };
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Error creating ${service_name,,}', error as Error);
      return { success: false, error: (error as Error).message };
    }
  }
  
  // Add more methods here
}

export default ${service_name}Service;
EOF
}

# ============================================================================
# SCRIPT 6: Batch Type Check
# ============================================================================
batch_type_check() {
    echo -e "${BLUE}=== Batch Type Check ===${NC}"
    echo ""
    
    local error_count=0
    
    # Check all TypeScript files
    echo -e "${YELLOW}Checking frontend...${NC}"
    if ! npx tsc --noEmit -p tsconfig.json; then
        error_count=$((error_count + 1))
    fi
    
    echo ""
    echo -e "${YELLOW}Checking backend...${NC}"
    if ! npx tsc --noEmit -p backend/tsconfig.json; then
        error_count=$((error_count + 1))
    fi
    
    echo ""
    if [ $error_count -eq 0 ]; then
        echo -e "${GREEN}✓ All type checks passed!${NC}"
        return 0
    else
        echo -e "${RED}✗ Found type errors in $error_count location(s)${NC}"
        return 1
    fi
}

# ============================================================================
# SCRIPT 7: Update Imports for Migrated File
# ============================================================================
update_imports() {
    local old_file=$1
    local new_file=$2
    
    echo -e "${BLUE}=== Updating Imports ===${NC}"
    echo "From: $old_file"
    echo "To: $new_file"
    echo ""
    
    local old_name=$(basename "$old_file" .js)
    local new_ext="${new_file##*.}"
    
    # Find and update imports in src/
    echo -e "${YELLOW}Updating src/ imports...${NC}"
    find src/ -type f \( -name "*.js" -o -name "*.ts" -o -name "*.tsx" \) \
        -exec grep -l "from.*$old_name" {} \; | while read file; do
        echo "  Updating: $file"
        sed -i.bak "s|from '\(.*\)$old_name'|from '\1$old_name'|g" "$file"
        rm "${file}.bak"
    done
    
    # Find and update imports in backend/
    if [[ "$old_file" == backend/* ]]; then
        echo -e "${YELLOW}Updating backend/ imports...${NC}"
        find backend/ -type f \( -name "*.js" -o -name "*.ts" \) \
            -exec grep -l "from.*$old_name" {} \; | while read file; do
            echo "  Updating: $file"
            sed -i.bak "s|from '\(.*\)$old_name'|from '\1$old_name'|g" "$file"
            rm "${file}.bak"
        done
    fi
    
    echo -e "${GREEN}✓ Import update complete${NC}"
}

# ============================================================================
# SCRIPT 8: Find Missing Type Definitions
# ============================================================================
find_missing_types() {
    echo -e "${BLUE}=== Finding Missing Type Definitions ===${NC}"
    echo ""
    
    echo -e "${YELLOW}Files with implicit 'any':${NC}"
    find src/ backend/ -name "*.ts" -o -name "*.tsx" | while read file; do
        if npx tsc --noEmit "$file" 2>&1 | grep -q "implicitly has an 'any' type"; then
            echo "  $file"
        fi
    done
    
    echo ""
    echo -e "${YELLOW}Files with explicit 'any':${NC}"
    grep -r ": any" src/ backend/ --include="*.ts" --include="*.tsx" | cut -d: -f1 | sort -u
}

# ============================================================================
# SCRIPT 9: Generate Migration Checklist
# ============================================================================
generate_checklist() {
    local file=$1
    local filename=$(basename "$file")
    
    cat << EOF
# Migration Checklist: $filename

## Pre-Migration
- [ ] Review file size and complexity
- [ ] Check for dependencies
- [ ] Identify all public methods
- [ ] Note any tricky type scenarios

## Migration Steps
- [ ] Create TypeScript file (.ts or .tsx)
- [ ] Add type definitions at top
- [ ] Convert function signatures
- [ ] Add parameter types
- [ ] Add return types
- [ ] Replace 'any' with specific types
- [ ] Add JSDoc comments
- [ ] Export types for consumers

## Validation
- [ ] Run type check: \`npx tsc --noEmit $file\`
- [ ] Run linter: \`npx eslint $file\`
- [ ] Run tests: \`npm test -- ${filename%.js}\`
- [ ] Check for 'any' types
- [ ] Verify no implicit types

## Post-Migration
- [ ] Update imports in consuming files
- [ ] Update tests
- [ ] Update documentation
- [ ] Commit changes
- [ ] Remove old .js file (after verification)

## Notes
<!-- Add any migration-specific notes here -->

EOF
}

# ============================================================================
# MAIN MENU
# ============================================================================
show_menu() {
    echo ""
    echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  TypeScript Migration Helper Menu    ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
    echo ""
    echo "1. Count migration progress"
    echo "2. Find next files to migrate"
    echo "3. Check imports for a file"
    echo "4. Validate TypeScript file"
    echo "5. Generate type template"
    echo "6. Batch type check"
    echo "7. Update imports for migrated file"
    echo "8. Find missing type definitions"
    echo "9. Generate migration checklist"
    echo "0. Exit"
    echo ""
}

# Main execution
main() {
    if [ $# -eq 0 ]; then
        # Interactive mode
        while true; do
            show_menu
            read -p "Select option (0-9): " choice
            echo ""
            
            case $choice in
                1) count_migration_progress ;;
                2) find_next_files ;;
                3) 
                    read -p "Enter file path: " filepath
                    check_imports "$filepath"
                    ;;
                4)
                    read -p "Enter TypeScript file path: " filepath
                    validate_typescript "$filepath"
                    ;;
                5)
                    read -p "Enter JavaScript file path: " filepath
                    generate_type_template "$filepath"
                    ;;
                6) batch_type_check ;;
                7)
                    read -p "Enter old file path: " oldfile
                    read -p "Enter new file path: " newfile
                    update_imports "$oldfile" "$newfile"
                    ;;
                8) find_missing_types ;;
                9)
                    read -p "Enter file path: " filepath
                    generate_checklist "$filepath"
                    ;;
                0) echo "Goodbye!"; exit 0 ;;
                *) echo -e "${RED}Invalid option${NC}" ;;
            esac
            
            echo ""
            read -p "Press Enter to continue..."
        done
    else
        # Command line mode
        case "$1" in
            progress) count_migration_progress ;;
            next) find_next_files ;;
            check) check_imports "$2" ;;
            validate) validate_typescript "$2" ;;
            template) generate_type_template "$2" ;;
            typecheck) batch_type_check ;;
            update) update_imports "$2" "$3" ;;
            missing) find_missing_types ;;
            checklist) generate_checklist "$2" ;;
            *)
                echo "Usage: $0 [command] [args]"
                echo ""
                echo "Commands:"
                echo "  progress              Show migration progress"
                echo "  next                  Find next files to migrate"
                echo "  check <file>          Check imports for file"
                echo "  validate <file>       Validate TypeScript file"
                echo "  template <file>       Generate type template"
                echo "  typecheck             Batch type check"
                echo "  update <old> <new>    Update imports"
                echo "  missing               Find missing types"
                echo "  checklist <file>      Generate checklist"
                echo ""
                echo "Run without arguments for interactive mode"
                ;;
        esac
    fi
}

# Run main function
main "$@"

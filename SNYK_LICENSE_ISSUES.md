# Snyk License Issues - LGPL-3.0

**Type:** License Compliance (Not Security Vulnerability)  
**Source:** `sharp@0.33.5` package  
**License:** LGPL-3.0  
**Severity:** Medium (License compliance)

---

## 🔍 What Are These Issues?

These are **license compliance issues**, not security vulnerabilities. Your upgraded Snyk plan now includes license scanning, which is why you're seeing these.

### Packages Affected:

All are platform-specific binaries for the `sharp` image processing library:

- `@img/sharp-libvips-darwin-arm64` (macOS Apple Silicon)
- `@img/sharp-libvips-darwin-x64` (macOS Intel)
- `@img/sharp-libvips-linux-arm` (Linux ARM)
- `@img/sharp-libvips-linux-arm64` (Linux ARM64)
- `@img/sharp-libvips-linux-s390x` (Linux s390x)
- `@img/sharp-libvips-linux-x64` (Linux x64)
- `@img/sharp-libvips-linuxmusl-arm64` (Linux musl ARM64)
- `@img/sharp-libvips-linuxmusl-x64` (Linux musl x64)

**All introduced through:** `sharp@0.33.5`

---

## 📜 What is LGPL-3.0?

**LGPL-3.0** (Lesser General Public License v3.0) is a **copyleft license** that:

### Key Requirements:

1. **If you modify the library:**
   - You must release your modifications under LGPL-3.0
   - You must make source code available

2. **If you link dynamically:**
   - Generally okay for most use cases
   - You may need to provide source code if you modify it

3. **If you link statically:**
   - More restrictive
   - May require providing your application's source code

4. **Distribution:**
   - You can distribute your application
   - You must include LGPL-3.0 license text
   - You must provide source code of the library (if modified)

---

## 🎯 Impact on Your Project

### For Your Dating App:

1. **You're using `sharp` as-is:**
   - ✅ You're not modifying the library
   - ✅ You're using it as a dependency
   - ✅ Dynamic linking (typical Node.js usage)

2. **What You Need to Do:**

   **✅ Required:**
   - Include LGPL-3.0 license text in your application
   - Acknowledge use of sharp library
   - Provide attribution

   **⚠️ May Need:**
   - Include source code of sharp (if distributing)
   - Provide license information to users

   **❌ Not Required:**
   - Release your application's source code (if using dynamically)
   - Modify your application's license

---

## 📋 License Compliance Checklist

### ✅ What You Should Do:

1. **Add License Attribution:**

   ```markdown
   ## Third-Party Licenses

   This application uses the following open-source libraries:

   - sharp (LGPL-3.0) - Image processing
     Source: https://github.com/lovell/sharp
     License: https://www.gnu.org/licenses/lgpl-3.0.html
   ```

2. **Include License Text:**
   - Add LGPL-3.0 license text to your project
   - Usually in a `LICENSES` or `THIRD_PARTY_LICENSES` file

3. **Update README:**
   - Mention use of sharp
   - Link to license information

4. **For Distribution:**
   - Include license files
   - Provide source code of sharp (if required by your distribution method)

---

## 🛡️ Risk Assessment

### Risk Level: **Low to Medium**

| Factor                | Assessment                                         |
| --------------------- | -------------------------------------------------- |
| **License Type**      | LGPL-3.0 (copyleft, but less restrictive than GPL) |
| **Usage**             | Dynamic linking (typical Node.js)                  |
| **Modification**      | None (using as-is)                                 |
| **Distribution**      | Depends on your deployment method                  |
| **Compliance Effort** | Low (add attribution and license text)             |
| **Legal Risk**        | Low (if compliant)                                 |

---

## ✅ Recommended Actions

### Immediate (Required):

1. **Add License Attribution:**
   - Create `THIRD_PARTY_LICENSES.md` or similar
   - List sharp with LGPL-3.0 license
   - Include license text or link

2. **Update Documentation:**
   - Add to README.md
   - Include in license file

### Optional (Best Practice):

1. **License File:**

   ```bash
   # Download LGPL-3.0 license text
   # Add to your project as LICENSES/LGPL-3.0.txt
   ```

2. **Package.json:**
   ```json
   {
     "license": "PROPRIETARY",
     "licenses": [
       {
         "type": "LGPL-3.0",
         "url": "https://www.gnu.org/licenses/lgpl-3.0.html"
       }
     ]
   }
   ```

---

## 🔄 Can You Ignore These?

### In Snyk Dashboard:

- ✅ **You can ignore** if you're compliant
- ✅ **You can ignore** if you've added proper attribution
- ⚠️ **Don't ignore** if you haven't addressed compliance

### When to Ignore:

- You've added license attribution ✅
- You've included license text ✅
- You're compliant with LGPL-3.0 requirements ✅

### When NOT to Ignore:

- You haven't addressed compliance ❌
- You're unsure about requirements ❌
- You're distributing commercially ❌

---

## 📝 Example Compliance File

Create `THIRD_PARTY_LICENSES.md`:

```markdown
# Third-Party Licenses

This application uses the following open-source libraries:

## sharp

- **Version:** 0.33.5
- **License:** LGPL-3.0
- **Usage:** Image processing
- **Source:** https://github.com/lovell/sharp
- **License Text:** See [LICENSES/LGPL-3.0.txt](LICENSES/LGPL-3.0.txt)

### LGPL-3.0 Requirements Met:

- ✅ Library used as-is (no modifications)
- ✅ Dynamic linking (Node.js standard)
- ✅ Attribution provided
- ✅ License text included
```

---

## 🎯 Summary

### What These Are:

- ✅ **License compliance issues** (not security vulnerabilities)
- ✅ **LGPL-3.0** license from `sharp` image processing library
- ✅ **8 platform-specific binaries** (all from sharp)

### What You Need to Do:

1. ✅ **Add license attribution** (acknowledge use of sharp)
2. ✅ **Include LGPL-3.0 license text** (or link to it)
3. ✅ **Update documentation** (README, license files)

### Risk Level:

- **Low** - Standard compliance requirements
- **Easy to fix** - Just add attribution and license text

### Can You Ignore in Snyk?

- ✅ **Yes, after compliance** - Once you've added proper attribution and license text, you can ignore these in Snyk dashboard

---

## 🔗 Resources

- **LGPL-3.0 License:** https://www.gnu.org/licenses/lgpl-3.0.html
- **sharp Library:** https://github.com/lovell/sharp
- **LGPL-3.0 FAQ:** https://www.gnu.org/licenses/gpl-faq.html

---

**Bottom Line:** These are license compliance issues, not security problems. Add proper attribution and license text, and you're compliant. Then you can ignore these in Snyk if desired.

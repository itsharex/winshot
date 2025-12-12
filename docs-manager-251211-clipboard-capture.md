# Documentation Update Report - Clipboard Capture Feature

**Date:** 2025-12-11 | **Version:** 1.1.0

---

## Summary

Updated core documentation to reflect Clipboard Capture feature implementation, which adds Win32 API clipboard image reading to WinShot.

---

## Files Updated

### 1. `docs/codebase-summary.md`
**Changes:**
- Added `clipboard.go` to internal/screenshot package directory structure
- Updated Package: `internal/screenshot` section:
  - Updated file list: `clipboard.go (200 LOC)`
  - Added `GetClipboardImage()` to Features list
  - Added **Clipboard Implementation** subsection documenting:
    - Win32 API calls used (OpenClipboard, GetClipboardData, GlobalLock)
    - Supported formats (24-bit BGR, 32-bit BGRA DIB)
    - Thread safety mechanism (runtime.LockOSThread)
    - Image layout handling (top-down/bottom-up)
    - Size limit enforcement (100MB)
    - DIB-to-RGBA conversion
  - Updated Entry Points to include `GetClipboardImage()` binding
- Updated app.go section:
  - Changed "Key Methods (~25 total)" to (~26 total)
  - Added `GetClipboardImage()` to capture operations list

**Impact:** Developers can now understand clipboard capture architecture without reading raw code.

### 2. `docs/system-architecture.md`
**Changes:**

#### Backend Package Diagram
- Added `GetClipboardImage()` → CaptureResult to app.go screenshot methods

#### Package: `internal/screenshot` Section
- Updated Responsibility: now covers "Screen, window, and clipboard image capture"
- Added **Capture Mode 4: Clipboard** with detailed flow:
  - Thread locking requirement
  - DIB format checking
  - BITMAPINFOHEADER parsing
  - Color conversion (BGR/BGRA to RGBA)
  - Layout direction handling
  - PNG encoding
- Added **Clipboard Implementation Details** subsection covering:
  - Thread safety rationale
  - Supported bit depths
  - DoS prevention (size limit)
  - Buffer overflow protection
  - Alpha channel compatibility handling

#### Data Flow Diagram
- Added **Clipboard Capture Flow** showing:
  - User interaction (Clipboard button click)
  - Frontend → Backend binding call
  - Go execution (thread lock, clipboard operations, encoding)
  - Success/error handling paths
  - Canvas re-render with clipboard image
  - Positioned before Hotkey Event Flow

**Impact:** System architecture docs now fully document clipboard integration, error states, and safety mechanisms.

---

## Technical Details Documented

### Clipboard Implementation Specifics
1. **Thread Safety:** Documented `runtime.LockOSThread()` requirement for Windows clipboard API
2. **Format Support:** 24-bit BGR and 32-bit BGRA DIB formats with color conversion logic
3. **Layout Handling:** Top-down (negative height) vs bottom-up (positive height) DIB variants
4. **Security:** 100MB size limit documented as DoS prevention
5. **Compatibility:** Alpha channel handling for 32-bit images (converts 0→255 for opaque compatibility)
6. **Error Handling:** "No image in clipboard" error path documented in data flow

### Frontend Integration Points
- CaptureToolbar component hosts Clipboard button
- handleClipboardCapture() async handler in App.tsx
- GetClipboardImage() Wails binding auto-generated from app.go
- Error display via setStatusMessage for user feedback

---

## Files Not Updated (Out of Scope)

- `code-standards.md` - No standards violations; existing patterns apply
- `project-overview-pdr.md` - Feature already documented; no new PDR requirements
- `README.md` - User-facing docs; clipboard feature not yet user-ready based on context
- `tech-stack.md` - No new dependencies; uses existing Win32/Go stdlib

---

## Changes Summary by Impact

| File | Changes | Severity |
|------|---------|----------|
| codebase-summary.md | +18 LOC, updated 3 sections | Medium |
| system-architecture.md | +35 LOC, added 2 sections | High |

---

## Verification

All updates cross-reference actual implementation:
- File locations match directory structure
- Method names match Go function signatures
- Data flow aligns with frontend bindings and error handling
- Technical details (Win32 API calls, formats) match clipboard.go source

---

## Recommendations

1. **Future Updates:** When clipboard feature lands in release notes, update README.md Features section (add "Clipboard" under Capture Modes)
2. **Edge Cases:** Document known limitations if discovered (e.g., specific apps with non-standard DIB formats)
3. **Hotkey Support:** If clipboard capture gets a hotkey binding, update hotkey flow diagram

---

## Notes

- All changes maintain existing documentation style and structure
- No breaking changes to documented APIs
- Clipboard feature is fully isolated in internal/screenshot package
- Frontend components (button placement, error messaging) already documented via code review

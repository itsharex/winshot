# Phase 10: Settings Page

**Parent:** [plan.md](./plan.md)
**Dependencies:** Phase 01, Phase 09 (System Integration)
**Docs:** internal/hotkeys/hotkeys.go, app.go

---

## Overview

| Field | Value |
|-------|-------|
| Date | 2025-12-01 |
| Priority | Medium |
| Description | Settings modal for configuring hotkeys, startup options, save location, and export defaults |
| Implementation Status | Complete |
| Review Status | Complete - See reports/code-reviewer-251201-settings-implementation.md |

---

## Key Insights

1. **Existing hotkeys.go** has `Register`/`Unregister` methods ready for dynamic hotkey changes
2. **app.go** already has `HotkeyConfig` struct and `GetHotkeyConfig()` returning hardcoded values
3. **settings-panel.tsx** handles visual settings (padding, corner radius, shadow) - keep separate
4. Windows Registry needed for startup integration via `golang.org/x/sys/windows/registry`
5. Config persistence: JSON file at `%APPDATA%/WinShot/config.json`

---

## Requirements

### Keyboard Shortcuts
- [x] Fullscreen capture hotkey (default: PrintScreen)
- [x] Region capture hotkey (default: Ctrl+PrintScreen)
- [x] Window capture hotkey (default: Ctrl+Shift+PrintScreen)
- [x] Key capture UI component for recording shortcuts

### Startup Options
- [x] Launch on Windows startup toggle
- [x] Minimize to tray on start toggle
- [x] Show notification on capture toggle

### Quick Save Settings
- [x] Default save folder selection
- [x] Filename pattern selector (winshot_{timestamp}, screenshot_{date}, etc.)
- [x] Auto-increment numbering option (config only, implementation in QuickSave pending)

### Export Defaults
- [x] Default format (PNG/JPEG)
- [x] JPEG quality slider (0-100)
- [x] Include background toggle

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
├─────────────────────────────────────────────────────────────┤
│ settings-modal.tsx                                           │
│ ├── KeyboardShortcutsSection                                │
│ │   └── HotkeyInput component (captures key combinations)   │
│ ├── StartupOptionsSection                                   │
│ ├── QuickSaveSection                                        │
│ └── ExportDefaultsSection                                   │
│                                                             │
│ types.ts                                                    │
│ └── AppConfig interface                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                    Wails Bindings
                              │
┌─────────────────────────────────────────────────────────────┐
│                     Backend (Go)                             │
├─────────────────────────────────────────────────────────────┤
│ internal/config/config.go                                   │
│ ├── Config struct                                           │
│ ├── Load() - reads from %APPDATA%/WinShot/config.json      │
│ ├── Save() - persists to JSON                              │
│ └── Default() - returns default config                     │
│                                                             │
│ internal/config/startup.go                                  │
│ └── SetStartupEnabled(bool) - Windows Registry             │
│                                                             │
│ app.go (new bindings)                                       │
│ ├── GetConfig() AppConfig                                   │
│ ├── SaveConfig(AppConfig) error                             │
│ └── SelectFolder() string                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Related Code Files

### Backend (Go)
- `app.go` - Add config bindings (GetConfig, SaveConfig, SelectFolder)
- `internal/config/config.go` - NEW: Config struct and JSON persistence
- `internal/config/startup.go` - NEW: Windows startup registry management
- `internal/hotkeys/hotkeys.go` - Update to support dynamic re-registration

### Frontend (React/TypeScript)
- `frontend/src/components/settings-modal.tsx` - NEW: Settings modal component
- `frontend/src/components/hotkey-input.tsx` - NEW: Key capture input
- `frontend/src/types.ts` - Add AppConfig type
- `frontend/src/App.tsx` - Add settings button and modal state
- `frontend/src/components/capture-toolbar.tsx` - Add settings gear icon

---

## Implementation Steps

### Step 1: Backend Config Module
1. Create `internal/config/config.go`:
   - Define `Config` struct with all settings fields
   - Implement `Load()` to read from JSON (create default if missing)
   - Implement `Save()` to write JSON
   - Implement `Default()` for initial values

2. Create `internal/config/startup.go`:
   - Use `golang.org/x/sys/windows/registry`
   - Key: `HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run`
   - Set/remove "WinShot" value pointing to exe path

### Step 2: App Bindings
1. Add to `app.go`:
   ```go
   func (a *App) GetConfig() *config.Config
   func (a *App) SaveConfig(cfg *config.Config) error
   func (a *App) SelectFolder() (string, error)
   func (a *App) UpdateHotkeys(cfg *config.HotkeyConfig) error
   ```

2. Update startup to load config and apply settings

### Step 3: Hotkey Dynamic Registration
1. Update `internal/hotkeys/hotkeys.go`:
   - Add `UpdateHotkey(id int, modifiers, keyCode uint)` method
   - Unregister old, register new
   - Add key code parser for string representations

### Step 4: Frontend Types
1. Add to `types.ts`:
   ```typescript
   interface AppConfig {
     hotkeys: {
       fullscreen: string;
       region: string;
       window: string;
     };
     startup: {
       launchOnStartup: boolean;
       minimizeToTray: boolean;
       showNotification: boolean;
     };
     quickSave: {
       folder: string;
       pattern: 'timestamp' | 'date' | 'increment';
     };
     export: {
       defaultFormat: 'png' | 'jpeg';
       jpegQuality: number;
       includeBackground: boolean;
     };
   }
   ```

### Step 5: HotkeyInput Component
1. Create `hotkey-input.tsx`:
   - Listen for keydown events when focused
   - Capture modifier keys (Ctrl, Alt, Shift, Win)
   - Display current combination
   - Validate conflicts with system shortcuts

### Step 6: Settings Modal
1. Create `settings-modal.tsx`:
   - Tab/section-based layout
   - Load config on open via `GetConfig()`
   - Save on apply via `SaveConfig()`
   - Cancel reverts to loaded state

### Step 7: Integration
1. Update `capture-toolbar.tsx` - Add settings gear icon button
2. Update `App.tsx`:
   - Add `showSettings` state
   - Add `SettingsModal` component
   - Load config on app start
   - Apply export defaults to existing export logic

---

## Todo List

- [x] Create internal/config/config.go
- [x] Create internal/config/startup.go
- [x] Add app.go bindings (GetConfig, SaveConfig, SelectFolder, UpdateHotkeys)
- [x] Update internal/hotkeys/hotkeys.go for dynamic registration
- [x] Create frontend/src/types.ts AppConfig interface
- [x] Create frontend/src/components/hotkey-input.tsx
- [x] Create frontend/src/components/settings-modal.tsx
- [x] Update frontend/src/components/capture-toolbar.tsx (add gear icon)
- [x] Update frontend/src/App.tsx (settings modal state + integration)
- [x] Run wails generate module
- [x] Code review completed - See reports/code-reviewer-251201-settings-implementation.md
- [ ] Address high-priority review findings (hotkey conflicts, validation, error messaging)
- [ ] Test all settings categories on Windows machine

---

## Success Criteria

1. Settings modal opens via gear icon
2. Hotkey changes apply immediately (unregister old, register new)
3. Config persists across app restarts
4. Windows startup toggle works (check Run registry key)
5. Quick save uses configured folder and pattern
6. Export uses configured defaults

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Hotkey conflicts with other apps | Medium | Show error if registration fails |
| Registry access denied | Low | Handle error gracefully, show warning |
| Config file corruption | Low | Validate JSON, fallback to defaults |
| Key capture blocks certain keys | Medium | Filter out system-reserved combos |

---

## Security Considerations

- Config file stored in user's AppData (no sensitive data)
- Registry access limited to HKCU (no admin required)
- No network calls or external data
- Input validation on all config fields

---

## Next Steps

After implementation:
1. Add config migration for future schema changes
2. Consider adding more themes/appearance settings
3. Add import/export settings feature
4. Add settings search functionality for larger config

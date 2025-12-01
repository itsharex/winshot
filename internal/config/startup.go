package config

import (
	"os"
	"path/filepath"

	"golang.org/x/sys/windows/registry"
)

const (
	// Windows Run registry key for current user startup
	startupKeyPath = `Software\Microsoft\Windows\CurrentVersion\Run`
	appName        = "WinShot"
)

// IsStartupEnabled checks if the app is set to run on Windows startup
func IsStartupEnabled() (bool, error) {
	key, err := registry.OpenKey(registry.CURRENT_USER, startupKeyPath, registry.QUERY_VALUE)
	if err != nil {
		return false, err
	}
	defer key.Close()

	_, _, err = key.GetStringValue(appName)
	if err == registry.ErrNotExist {
		return false, nil
	}
	if err != nil {
		return false, err
	}

	return true, nil
}

// SetStartupEnabled enables or disables running the app on Windows startup
func SetStartupEnabled(enabled bool) error {
	if enabled {
		return enableStartup()
	}
	return disableStartup()
}

func enableStartup() error {
	// Get executable path
	exePath, err := os.Executable()
	if err != nil {
		return err
	}

	// Resolve symlinks and get absolute path
	exePath, err = filepath.Abs(exePath)
	if err != nil {
		return err
	}

	// Open registry key for writing
	key, err := registry.OpenKey(registry.CURRENT_USER, startupKeyPath, registry.SET_VALUE)
	if err != nil {
		return err
	}
	defer key.Close()

	// Set value with path in quotes (for paths with spaces)
	return key.SetStringValue(appName, `"`+exePath+`"`)
}

func disableStartup() error {
	key, err := registry.OpenKey(registry.CURRENT_USER, startupKeyPath, registry.SET_VALUE)
	if err != nil {
		return err
	}
	defer key.Close()

	// Delete the value (ignore error if not exists)
	err = key.DeleteValue(appName)
	if err == registry.ErrNotExist {
		return nil
	}
	return err
}

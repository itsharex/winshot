package config

import (
	"encoding/json"
	"testing"
)

func TestCloudConfig_Serialization(t *testing.T) {
	cfg := &Config{
		Cloud: CloudConfig{
			R2: R2Config{
				AccountID: "abc123",
				Bucket:    "my-bucket",
				PublicURL: "https://pub.r2.dev",
			},
			GDrive: GDriveConfig{
				FolderID: "folder123",
			},
		},
	}

	// Serialize
	data, err := json.Marshal(cfg)
	if err != nil {
		t.Fatalf("Failed to marshal config: %v", err)
	}

	// Deserialize
	var loaded Config
	if err := json.Unmarshal(data, &loaded); err != nil {
		t.Fatalf("Failed to unmarshal config: %v", err)
	}

	// Verify R2
	if loaded.Cloud.R2.AccountID != "abc123" {
		t.Errorf("R2.AccountID = %q, want %q", loaded.Cloud.R2.AccountID, "abc123")
	}
	if loaded.Cloud.R2.Bucket != "my-bucket" {
		t.Errorf("R2.Bucket = %q, want %q", loaded.Cloud.R2.Bucket, "my-bucket")
	}
	if loaded.Cloud.R2.PublicURL != "https://pub.r2.dev" {
		t.Errorf("R2.PublicURL = %q, want %q", loaded.Cloud.R2.PublicURL, "https://pub.r2.dev")
	}

	// Verify GDrive
	if loaded.Cloud.GDrive.FolderID != "folder123" {
		t.Errorf("GDrive.FolderID = %q, want %q", loaded.Cloud.GDrive.FolderID, "folder123")
	}
}

func TestCloudConfig_EmptyOmitsFromJSON(t *testing.T) {
	cfg := Default()

	data, err := json.Marshal(cfg)
	if err != nil {
		t.Fatalf("Failed to marshal config: %v", err)
	}

	// Empty cloud config should still have structure but empty values
	var raw map[string]interface{}
	if err := json.Unmarshal(data, &raw); err != nil {
		t.Fatalf("Failed to unmarshal to map: %v", err)
	}

	// Cloud key should exist but with empty R2/GDrive
	cloud, ok := raw["cloud"].(map[string]interface{})
	if !ok {
		t.Skip("Cloud key is omitempty and was omitted - acceptable")
		return
	}

	// If present, verify structure
	if r2, ok := cloud["r2"].(map[string]interface{}); ok {
		if r2["accountId"] != nil && r2["accountId"] != "" {
			t.Error("Expected empty accountId")
		}
	}
}

func TestCloudConfig_BackwardCompatibility(t *testing.T) {
	// Simulate old config without cloud field
	oldConfig := `{
		"hotkeys": {"fullscreen": "PrintScreen"},
		"startup": {"launchOnStartup": false}
	}`

	var cfg Config
	if err := json.Unmarshal([]byte(oldConfig), &cfg); err != nil {
		t.Fatalf("Failed to unmarshal old config: %v", err)
	}

	// Cloud should be zero-value
	if cfg.Cloud.R2.AccountID != "" {
		t.Error("Expected empty R2 AccountID for old config")
	}
	if cfg.Cloud.GDrive.FolderID != "" {
		t.Error("Expected empty GDrive FolderID for old config")
	}
}

func TestR2Config_Struct(t *testing.T) {
	r2 := R2Config{
		AccountID: "account",
		Bucket:    "bucket",
		PublicURL: "https://example.com",
	}

	if r2.AccountID != "account" {
		t.Errorf("AccountID = %q, want %q", r2.AccountID, "account")
	}
	if r2.Bucket != "bucket" {
		t.Errorf("Bucket = %q, want %q", r2.Bucket, "bucket")
	}
	if r2.PublicURL != "https://example.com" {
		t.Errorf("PublicURL = %q, want %q", r2.PublicURL, "https://example.com")
	}
}

func TestGDriveConfig_Struct(t *testing.T) {
	gdrive := GDriveConfig{
		FolderID: "folder",
	}

	if gdrive.FolderID != "folder" {
		t.Errorf("FolderID = %q, want %q", gdrive.FolderID, "folder")
	}
}

func TestDefault_IncludesCloudConfig(t *testing.T) {
	cfg := Default()

	// Cloud should be present with empty values
	if cfg.Cloud.R2.AccountID != "" {
		t.Error("Default R2 AccountID should be empty")
	}
	if cfg.Cloud.GDrive.FolderID != "" {
		t.Error("Default GDrive FolderID should be empty")
	}
}

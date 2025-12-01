package screenshot

import (
	"unsafe"

	"golang.org/x/sys/windows"
)

var (
	user32Win  = windows.NewLazySystemDLL("user32.dll")
	shcore     = windows.NewLazySystemDLL("shcore.dll")
	dwmapi     = windows.NewLazySystemDLL("dwmapi.dll")

	procGetWindowRectSS         = user32Win.NewProc("GetWindowRect")
	procSetProcessDPIAware      = user32Win.NewProc("SetProcessDPIAware")
	procDwmGetWindowAttribute   = dwmapi.NewProc("DwmGetWindowAttribute")
	procSetProcessDpiAwareness  = shcore.NewProc("SetProcessDpiAwareness")
)

const (
	DWMWA_EXTENDED_FRAME_BOUNDS = 9
	PROCESS_PER_MONITOR_DPI_AWARE = 2
)

type RECT struct {
	Left, Top, Right, Bottom int32
}

func init() {
	// Set DPI awareness for accurate window coordinates
	// Try per-monitor DPI awareness first (Windows 8.1+)
	if shcore.Load() == nil && procSetProcessDpiAwareness.Find() == nil {
		procSetProcessDpiAwareness.Call(uintptr(PROCESS_PER_MONITOR_DPI_AWARE))
	} else {
		// Fallback to basic DPI awareness (Windows Vista+)
		procSetProcessDPIAware.Call()
	}
}

// CaptureWindowByCoords captures a window by capturing the screen region at window coordinates
// This approach is more reliable than direct GDI capture for hardware-accelerated windows
func CaptureWindowByCoords(hwnd uintptr) (*CaptureResult, error) {
	var rect RECT

	// Try DWM extended frame bounds first (more accurate for modern windows)
	// This accounts for window shadows and DPI scaling
	if dwmapi.Load() == nil && procDwmGetWindowAttribute.Find() == nil {
		ret, _, _ := procDwmGetWindowAttribute.Call(
			hwnd,
			uintptr(DWMWA_EXTENDED_FRAME_BOUNDS),
			uintptr(unsafe.Pointer(&rect)),
			unsafe.Sizeof(rect),
		)
		if ret != 0 {
			// DWM failed, fall back to GetWindowRect
			procGetWindowRectSS.Call(hwnd, uintptr(unsafe.Pointer(&rect)))
		}
	} else {
		// DWM not available, use GetWindowRect
		procGetWindowRectSS.Call(hwnd, uintptr(unsafe.Pointer(&rect)))
	}

	x := int(rect.Left)
	y := int(rect.Top)
	width := int(rect.Right - rect.Left)
	height := int(rect.Bottom - rect.Top)

	// Ensure valid dimensions
	if width <= 0 || height <= 0 {
		return nil, nil
	}

	// Capture the screen region at window coordinates
	return CaptureRegion(x, y, width, height)
}

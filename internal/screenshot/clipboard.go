package screenshot

import (
	"bytes"
	"encoding/base64"
	"errors"
	"image"
	"image/png"
	"runtime"
	"unsafe"

	"golang.org/x/sys/windows"
)

var (
	user32Clip                     = windows.NewLazySystemDLL("user32.dll")
	procOpenClipboard              = user32Clip.NewProc("OpenClipboard")
	procCloseClipboard             = user32Clip.NewProc("CloseClipboard")
	procGetClipboardData           = user32Clip.NewProc("GetClipboardData")
	procIsClipboardFormatAvailable = user32Clip.NewProc("IsClipboardFormatAvailable")

	kernel32Clip     = windows.NewLazySystemDLL("kernel32.dll")
	procGlobalLock   = kernel32Clip.NewProc("GlobalLock")
	procGlobalUnlock = kernel32Clip.NewProc("GlobalUnlock")
	procGlobalSize   = kernel32Clip.NewProc("GlobalSize")
)

const (
	CF_BITMAP        = 2
	CF_DIB           = 8
	maxClipboardSize = 100 * 1024 * 1024 // 100MB max to prevent DoS
)

// BITMAPINFOHEADER represents the Windows BITMAPINFOHEADER structure
type BITMAPINFOHEADER struct {
	BiSize          uint32
	BiWidth         int32
	BiHeight        int32
	BiPlanes        uint16
	BiBitCount      uint16
	BiCompression   uint32
	BiSizeImage     uint32
	BiXPelsPerMeter int32
	BiYPelsPerMeter int32
	BiClrUsed       uint32
	BiClrImportant  uint32
}

// ErrNoImageInClipboard is returned when clipboard has no image
var ErrNoImageInClipboard = errors.New("no image in clipboard")

// GetClipboardImage reads image from Windows clipboard
func GetClipboardImage() (*CaptureResult, error) {
	// CRITICAL: Lock OS thread because Windows clipboard API requires
	// OpenClipboard and CloseClipboard to be called on the same thread.
	// Go's goroutine scheduler can switch threads between calls otherwise.
	runtime.LockOSThread()
	defer runtime.UnlockOSThread()

	// Check if clipboard has DIB format
	available, _, _ := procIsClipboardFormatAvailable.Call(uintptr(CF_DIB))
	if available == 0 {
		return nil, ErrNoImageInClipboard
	}

	// Open clipboard
	ret, _, _ := procOpenClipboard.Call(0)
	if ret == 0 {
		return nil, errors.New("failed to open clipboard")
	}
	defer procCloseClipboard.Call()

	// Get clipboard data handle
	hData, _, _ := procGetClipboardData.Call(uintptr(CF_DIB))
	if hData == 0 {
		return nil, ErrNoImageInClipboard
	}

	// Lock global memory to get pointer to data
	ptr, _, _ := procGlobalLock.Call(hData)
	if ptr == 0 {
		return nil, errors.New("failed to lock clipboard data")
	}
	// IMPORTANT: Must unlock before clipboard closes to prevent clipboard corruption
	defer procGlobalUnlock.Call(hData)

	// Get size of clipboard data
	size, _, _ := procGlobalSize.Call(hData)
	if size == 0 {
		return nil, errors.New("failed to get clipboard data size")
	}

	// Check size limit to prevent DoS
	if size > maxClipboardSize {
		return nil, errors.New("clipboard image too large")
	}

	// Parse BITMAPINFOHEADER
	header := (*BITMAPINFOHEADER)(unsafe.Pointer(ptr))

	width := int(header.BiWidth)
	height := int(header.BiHeight)
	bitCount := int(header.BiBitCount)

	// Height can be negative (top-down DIB) or positive (bottom-up DIB)
	bottomUp := height > 0
	if height < 0 {
		height = -height
	}

	if width <= 0 || height <= 0 {
		return nil, errors.New("invalid image dimensions in clipboard")
	}

	// Calculate pixel data offset (header + color table if applicable)
	pixelOffset := uintptr(header.BiSize)
	if bitCount <= 8 {
		// For 8-bit or less, there's a color table
		colorTableSize := uintptr(1 << bitCount * 4) // RGBQUAD entries
		if header.BiClrUsed > 0 {
			colorTableSize = uintptr(header.BiClrUsed * 4)
		}
		pixelOffset += colorTableSize
	}

	// Get pixel data pointer
	pixelPtr := ptr + pixelOffset

	// Create RGBA image
	img := image.NewRGBA(image.Rect(0, 0, width, height))

	// Calculate row stride (must be aligned to 4 bytes)
	rowSize := ((width*bitCount + 31) / 32) * 4

	// Validate pixel data bounds to prevent buffer overflow
	expectedSize := uintptr(rowSize * height)
	dataSize := size - pixelOffset
	if dataSize < expectedSize {
		return nil, errors.New("invalid clipboard data: pixel data smaller than expected")
	}

	// Convert DIB to RGBA
	switch bitCount {
	case 24:
		// 24-bit BGR
		for y := 0; y < height; y++ {
			srcY := y
			if bottomUp {
				srcY = height - 1 - y
			}
			rowPtr := pixelPtr + uintptr(srcY*rowSize)
			for x := 0; x < width; x++ {
				pixelAddr := rowPtr + uintptr(x*3)
				b := *(*byte)(unsafe.Pointer(pixelAddr))
				g := *(*byte)(unsafe.Pointer(pixelAddr + 1))
				r := *(*byte)(unsafe.Pointer(pixelAddr + 2))
				img.Pix[(y*width+x)*4+0] = r
				img.Pix[(y*width+x)*4+1] = g
				img.Pix[(y*width+x)*4+2] = b
				img.Pix[(y*width+x)*4+3] = 255
			}
		}
	case 32:
		// 32-bit BGRA
		for y := 0; y < height; y++ {
			srcY := y
			if bottomUp {
				srcY = height - 1 - y
			}
			rowPtr := pixelPtr + uintptr(srcY*rowSize)
			for x := 0; x < width; x++ {
				pixelAddr := rowPtr + uintptr(x*4)
				b := *(*byte)(unsafe.Pointer(pixelAddr))
				g := *(*byte)(unsafe.Pointer(pixelAddr + 1))
				r := *(*byte)(unsafe.Pointer(pixelAddr + 2))
				a := *(*byte)(unsafe.Pointer(pixelAddr + 3))
				// Some apps set alpha to 0 for opaque pixels, handle this
				if a == 0 {
					a = 255
				}
				img.Pix[(y*width+x)*4+0] = r
				img.Pix[(y*width+x)*4+1] = g
				img.Pix[(y*width+x)*4+2] = b
				img.Pix[(y*width+x)*4+3] = a
			}
		}
	default:
		return nil, errors.New("unsupported bit depth: only 24-bit and 32-bit images are supported")
	}

	// Encode to PNG and return as CaptureResult
	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		return nil, err
	}

	return &CaptureResult{
		Width:  width,
		Height: height,
		Data:   base64.StdEncoding.EncodeToString(buf.Bytes()),
	}, nil
}

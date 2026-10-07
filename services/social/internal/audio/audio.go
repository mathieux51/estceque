// Package audio wraps FFmpeg: listening copies, decoding for analysis,
// duration and waveform.
package audio

import (
	"bytes"
	"context"
	"encoding/binary"
	"fmt"
	"math"
	"os/exec"
	"strconv"
	"strings"
)

func run(ctx context.Context, name string, args ...string) ([]byte, error) {
	cmd := exec.CommandContext(ctx, name, args...)
	var stdout, stderr bytes.Buffer
	cmd.Stdout, cmd.Stderr = &stdout, &stderr
	if err := cmd.Run(); err != nil {
		tail := stderr.String()
		if len(tail) > 600 {
			tail = tail[len(tail)-600:]
		}
		return nil, fmt.Errorf("%s: %w: %s", name, err, tail)
	}
	return stdout.Bytes(), nil
}

// ListeningCopy writes a 128 kbit/s MP3 at the podcast loudness norm (-16 LUFS).
func ListeningCopy(ctx context.Context, in, out string) error {
	_, err := run(ctx, "ffmpeg", "-y", "-v", "error", "-i", in, "-vn",
		"-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "44100", "-codec:a", "libmp3lame", "-b:a", "128k", out)
	return err
}

// Duration in seconds, from ffprobe.
func Duration(ctx context.Context, path string) (float64, error) {
	out, err := run(ctx, "ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path)
	if err != nil {
		return 0, err
	}
	return strconv.ParseFloat(strings.TrimSpace(string(out)), 64)
}

// DecodeMono returns the audio as mono float samples at the given rate.
func DecodeMono(ctx context.Context, path string, rate int) ([]float32, error) {
	out, err := run(ctx, "ffmpeg", "-v", "error", "-i", path, "-vn", "-ac", "1",
		"-ar", strconv.Itoa(rate), "-f", "s16le", "-")
	if err != nil {
		return nil, err
	}
	samples := make([]float32, len(out)/2)
	for i := range samples {
		samples[i] = float32(int16(binary.LittleEndian.Uint16(out[i*2:]))) / 32768
	}
	return samples, nil
}

// WriteWav16k writes a 16 kHz mono WAV, the input format of whisper.cpp.
func WriteWav16k(ctx context.Context, in, out string) error {
	_, err := run(ctx, "ffmpeg", "-y", "-v", "error", "-i", in, "-vn", "-ac", "1", "-ar", "16000",
		"-c:a", "pcm_s16le", out)
	return err
}

// Waveform summarises samples into `points` peak levels between 0 and 1.
func Waveform(samples []float32, points int) []float32 {
	if len(samples) == 0 || points <= 0 {
		return nil
	}
	out := make([]float32, points)
	per := float64(len(samples)) / float64(points)
	loudest := float32(0)
	for i := range out {
		start, end := int(float64(i)*per), int(float64(i+1)*per)
		peak := float32(0)
		for _, s := range samples[start:min(end, len(samples))] {
			if a := float32(math.Abs(float64(s))); a > peak {
				peak = a
			}
		}
		out[i] = peak
		if peak > loudest {
			loudest = peak
		}
	}
	if loudest > 0 {
		for i := range out {
			out[i] /= loudest
		}
	}
	return out
}

// VoiceNote converts a recorded note (WebM/Opus, MP4...) to a mono 64 kbit/s MP3.
func VoiceNote(ctx context.Context, in, out string) error {
	_, err := run(ctx, "ffmpeg", "-y", "-v", "error", "-i", in, "-vn", "-ac", "1", "-ar", "44100",
		"-t", "300", "-codec:a", "libmp3lame", "-b:a", "64k", out)
	return err
}

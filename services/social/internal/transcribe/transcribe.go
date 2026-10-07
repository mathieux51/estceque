// Package transcribe turns speech into timed text with whisper.cpp.
package transcribe

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"strings"
)

type Segment struct {
	Start float64
	End   float64
	Text  string
}

// Run transcribes a 16 kHz mono WAV, detecting the language.
func Run(ctx context.Context, bin, model, wav string) ([]Segment, error) {
	base := strings.TrimSuffix(wav, ".wav")
	cmd := exec.CommandContext(ctx, bin, "-m", model, "-f", wav, "-l", "auto", "-oj", "-of", base, "-np")
	if out, err := cmd.CombinedOutput(); err != nil {
		tail := string(out)
		if len(tail) > 600 {
			tail = tail[len(tail)-600:]
		}
		return nil, fmt.Errorf("whisper: %w: %s", err, tail)
	}
	raw, err := os.ReadFile(base + ".json")
	if err != nil {
		return nil, err
	}
	defer os.Remove(base + ".json")
	var parsed struct {
		Transcription []struct {
			Offsets struct {
				From int `json:"from"`
				To   int `json:"to"`
			} `json:"offsets"`
			Text string `json:"text"`
		} `json:"transcription"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, err
	}
	segments := make([]Segment, 0, len(parsed.Transcription))
	for _, s := range parsed.Transcription {
		text := strings.TrimSpace(s.Text)
		if text == "" || strings.HasPrefix(text, "[") {
			continue // empty or "[Music]"-style markers
		}
		segments = append(segments, Segment{Start: float64(s.Offsets.From) / 1000, End: float64(s.Offsets.To) / 1000, Text: text})
	}
	return segments, nil
}

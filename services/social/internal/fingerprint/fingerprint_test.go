package fingerprint

import (
	"math"
	"math/rand"
	"testing"
)

// speechLike makes a deterministic, varied signal: tones that change every
// ~100 ms, with an amplitude envelope, like syllables.
func speechLike(seconds float64, seed int64) []float32 {
	r := rand.New(rand.NewSource(seed))
	n := int(seconds * SampleRate)
	out := make([]float32, n)
	segment := SampleRate / 10
	var f1, f2 float64
	for i := 0; i < n; i++ {
		if i%segment == 0 {
			f1 = 150 + r.Float64()*900
			f2 = 900 + r.Float64()*2500
		}
		t := float64(i) / SampleRate
		env := 0.5 + 0.5*math.Sin(2*math.Pi*4*t)
		out[i] = float32(env * (0.5*math.Sin(2*math.Pi*f1*t) + 0.3*math.Sin(2*math.Pi*f2*t)))
	}
	return out
}

func hitsFor(episode int64, points []Point) []Hit {
	hits := make([]Hit, len(points))
	for i, p := range points {
		hits[i] = Hit{Hash: p.Hash, EpisodeID: episode, Frame: p.Frame}
	}
	return hits
}

func TestFindsEpisodeAndTimeDespiteNoise(t *testing.T) {
	a := speechLike(120, 1)
	b := speechLike(120, 2)
	index := append(hitsFor(1, Compute(a)), hitsFor(2, Compute(b))...)

	// A 8 s snippet of episode 2 starting at 73.4 s, quieter, with noise.
	start := int(73.4 * SampleRate)
	r := rand.New(rand.NewSource(9))
	snippet := make([]float32, 8*SampleRate)
	for i := range snippet {
		snippet[i] = 0.6*b[start+i] + float32(r.NormFloat64()*0.08)
	}
	query := Compute(snippet)

	// Keep only stored landmarks sharing a hash with the query, as the database does.
	wanted := map[int32]bool{}
	for _, p := range query {
		wanted[p.Hash] = true
	}
	var hits []Hit
	for _, h := range index {
		if wanted[h.Hash] {
			hits = append(hits, h)
		}
	}
	matches := Best(query, hits, 3)
	if len(matches) == 0 || matches[0].EpisodeID != 2 {
		t.Fatalf("expected episode 2 first, got %+v", matches)
	}
	got := FrameSeconds(matches[0].OffsetFrame)
	if math.Abs(got-73.4) > 0.2 {
		t.Fatalf("expected the snippet at 73.4 s, got %.2f s", got)
	}
	if len(matches) > 1 && matches[0].Score < 3*matches[1].Score {
		t.Fatalf("match not clearly ahead: %+v", matches)
	}
	t.Logf("best %+v at %.2f s", matches[0], got)
}

func TestFFTMatchesSine(t *testing.T) {
	buf := make([]complex128, 64)
	for i := range buf {
		buf[i] = complex(math.Sin(2*math.Pi*5*float64(i)/64), 0)
	}
	fft(buf)
	if mag := real(buf[5])*real(buf[5]) + imag(buf[5])*imag(buf[5]); mag < 900 {
		t.Fatalf("expected energy in bin 5, got %v", mag)
	}
}

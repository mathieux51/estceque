// Package fingerprint recognises audio from a short recording: it turns
// sound into hashes of pairs of spectrogram peaks ("landmarks", the technique
// Shazam made known) and finds the episode and time whose hashes line up.
package fingerprint

import (
	"math"
	"math/cmplx"
	"sort"
)

const (
	// SampleRate is the rate audio must be decoded at (mono).
	SampleRate = 8000
	windowSize = 1024
	// Hop is the number of samples between two frames (32 ms).
	Hop        = 256
	fanOut     = 5
	zoneFrames = 40
	// Minimum peak height relative to the frame's average band peak.
	peakFactor = 1.4
)

// Bands of FFT bins; the loudest bin of each band is a candidate peak.
var bands = [][2]int{{8, 20}, {20, 40}, {40, 80}, {80, 160}, {160, 320}, {320, 512}}

// Point is one landmark: a hash and the frame of its first peak.
type Point struct {
	Hash  int32
	Frame int32
}

// FrameSeconds converts a frame index to seconds.
func FrameSeconds(frame int) float64 { return float64(frame*Hop) / SampleRate }

type peak struct{ frame, bin int }

// Compute returns the landmarks of 8 kHz mono samples.
func Compute(samples []float32) []Point {
	peaks := findPeaks(samples)
	points := make([]Point, 0, len(peaks)*fanOut)
	for i, anchor := range peaks {
		paired := 0
		for j := i + 1; j < len(peaks) && paired < fanOut; j++ {
			target := peaks[j]
			dt := target.frame - anchor.frame
			if dt < 1 {
				continue
			}
			if dt > zoneFrames {
				break
			}
			hash := int32(anchor.bin&0x1ff) | int32(target.bin&0x1ff)<<9 | int32(dt&0xff)<<18
			points = append(points, Point{Hash: hash, Frame: int32(anchor.frame)})
			paired++
		}
	}
	return points
}

func findPeaks(samples []float32) []peak {
	window := make([]float64, windowSize)
	for i := range window {
		window[i] = 0.5 - 0.5*math.Cos(2*math.Pi*float64(i)/float64(windowSize-1))
	}
	buf := make([]complex128, windowSize)
	var peaks []peak
	for frame := 0; (frame*Hop)+windowSize <= len(samples); frame++ {
		start := frame * Hop
		for i := 0; i < windowSize; i++ {
			buf[i] = complex(float64(samples[start+i])*window[i], 0)
		}
		fft(buf)
		type candidate struct {
			bin int
			mag float64
		}
		best := make([]candidate, 0, len(bands))
		total := 0.0
		for _, band := range bands {
			c := candidate{bin: band[0]}
			for bin := band[0]; bin < band[1]; bin++ {
				if m := math.Log1p(cmplx.Abs(buf[bin])); m > c.mag {
					c = candidate{bin: bin, mag: m}
				}
			}
			best = append(best, c)
			total += c.mag
		}
		threshold := peakFactor * total / float64(len(best))
		for _, c := range best {
			if c.mag > threshold && c.mag > 1 {
				peaks = append(peaks, peak{frame: frame, bin: c.bin})
			}
		}
	}
	sort.SliceStable(peaks, func(a, b int) bool { return peaks[a].frame < peaks[b].frame })
	return peaks
}

// fft is an in-place radix-2 Cooley-Tukey transform; len(a) must be a power of 2.
func fft(a []complex128) {
	n := len(a)
	for i, j := 1, 0; i < n; i++ {
		bit := n >> 1
		for ; j&bit != 0; bit >>= 1 {
			j ^= bit
		}
		j ^= bit
		if i < j {
			a[i], a[j] = a[j], a[i]
		}
	}
	for size := 2; size <= n; size <<= 1 {
		step := cmplx.Exp(complex(0, -2*math.Pi/float64(size)))
		for start := 0; start < n; start += size {
			w := complex(1, 0)
			for k := 0; k < size/2; k++ {
				u, v := a[start+k], a[start+k+size/2]*w
				a[start+k], a[start+k+size/2] = u+v, u-v
				w *= step
			}
		}
	}
}

// Hit is one stored landmark matching a query hash.
type Hit struct {
	Hash      int32
	EpisodeID int64
	Frame     int32
}

// Match is the best alignment of a query with one episode.
type Match struct {
	EpisodeID int64
	// Frame of the episode where the query starts.
	OffsetFrame int
	Score       int
}

// Best groups hits by episode and time offset and returns the strongest
// alignments, best first. A real match has many hashes agreeing on one offset.
func Best(query []Point, hits []Hit, limit int) []Match {
	queryFrames := make(map[int32][]int32, len(query))
	for _, p := range query {
		queryFrames[p.Hash] = append(queryFrames[p.Hash], p.Frame)
	}
	type key struct {
		episode int64
		offset  int
	}
	counts := map[key]int{}
	for _, h := range hits {
		for _, qf := range queryFrames[h.Hash] {
			// Offsets are bucketed by 2 frames to absorb small timing jitter.
			counts[key{h.EpisodeID, int(h.Frame-qf) / 2}]++
		}
	}
	bestPerEpisode := map[int64]Match{}
	for k, n := range counts {
		if m, ok := bestPerEpisode[k.episode]; !ok || n > m.Score {
			bestPerEpisode[k.episode] = Match{EpisodeID: k.episode, OffsetFrame: k.offset * 2, Score: n}
		}
	}
	matches := make([]Match, 0, len(bestPerEpisode))
	for _, m := range bestPerEpisode {
		matches = append(matches, m)
	}
	sort.Slice(matches, func(a, b int) bool { return matches[a].Score > matches[b].Score })
	if len(matches) > limit {
		matches = matches[:limit]
	}
	return matches
}

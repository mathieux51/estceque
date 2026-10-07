package api

import (
	"slices"
	"testing"
)

func TestSlugify(t *testing.T) {
	for in, want := range map[string]string{
		"Café du matin":         "cafe-du-matin",
		"  Vélo en ville !  ":   "velo-en-ville",
		"L’épisode n°1: Noël":   "l-episode-n-1-noel",
		"???":                   "podcast",
		"Ça ne s'arrête jamais": "ca-ne-s-arrete-jamais",
	} {
		if got := slugify(in); got != want {
			t.Errorf("slugify(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestCleanTags(t *testing.T) {
	got := cleanTags([]string{" #Café", "café", "", "Société ", "#"})
	if want := []string{"café", "société"}; !slices.Equal(got, want) {
		t.Errorf("cleanTags = %q, want %q", got, want)
	}
}

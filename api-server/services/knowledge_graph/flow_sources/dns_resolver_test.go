package flow_sources

import "testing"

func TestFindMatchingZone(t *testing.T) {
	zones := []Route53HostedZone{
		{ID: "Z1", Name: "example.com."},
		{ID: "Z2", Name: "sub.example.com."},
	}

	tests := []struct {
		name       string
		hostname   string
		expectedID string
	}{
		// Should match
		{
			name:       "exact match",
			hostname:   "example.com",
			expectedID: "Z1",
		},
		{
			name:       "subdomain matches parent zone",
			hostname:   "foo.example.com",
			expectedID: "Z1",
		},
		{
			name:       "prefers most specific zone",
			hostname:   "www.sub.example.com",
			expectedID: "Z2",
		},
		{
			name:       "hostname with trailing dot",
			hostname:   "foo.example.com.",
			expectedID: "Z1",
		},
		{
			name:       "case-insensitive match",
			hostname:   "Foo.Example.COM",
			expectedID: "Z1",
		},

		// Should NOT match
		{
			name:       "label boundary: notexample.com must not match example.com",
			hostname:   "notexample.com",
			expectedID: "",
		},
		{
			name:       "unrelated hostname",
			hostname:   "other.net",
			expectedID: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := findMatchingZone(tt.hostname, zones)
			if tt.expectedID == "" {
				if result != nil {
					t.Errorf("findMatchingZone(%q) = %q, expected nil", tt.hostname, result.ID)
				}
			} else {
				if result == nil {
					t.Errorf("findMatchingZone(%q) = nil, expected %q", tt.hostname, tt.expectedID)
				} else if result.ID != tt.expectedID {
					t.Errorf("findMatchingZone(%q) = %q, expected %q", tt.hostname, result.ID, tt.expectedID)
				}
			}
		})
	}
}

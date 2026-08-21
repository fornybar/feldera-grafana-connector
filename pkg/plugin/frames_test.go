package plugin

import (
	"testing"
	"time"

	"github.com/apache/arrow-go/v18/arrow"
)

func TestTimestampToTimeRespectsArrowUnits(t *testing.T) {
	expected := time.Date(2025, 1, 2, 3, 4, 5, 0, time.UTC)
	millis := arrow.Timestamp(expected.UnixMilli())
	if got := timestampToTime(millis, arrow.Millisecond); !got.Equal(expected) {
		t.Fatalf("timestamp = %s", got)
	}
	micros := arrow.Timestamp(expected.UnixMicro())
	if got := timestampToTime(micros, arrow.Microsecond); !got.Equal(expected) {
		t.Fatalf("timestamp = %s", got)
	}
}

func TestFrameFromFelderaJSONAcceptsArrayAndNDJSON(t *testing.T) {
	for _, payload := range [][]byte{
		[]byte(`[{"time":"2025-01-01T00:00:00Z","value":1},{"time":"2025-01-01T00:01:00Z","value":null}]`),
		[]byte("{\"time\":\"2025-01-01T00:00:00Z\",\"value\":1}\n{\"time\":\"2025-01-01T00:01:00Z\",\"value\":null}\n"),
	} {
		frame, err := frameFromFelderaJSON(payload)
		if err != nil {
			t.Fatal(err)
		}
		if frame == nil || frame.Rows() != 2 {
			t.Fatalf("expected two rows, got %#v", frame)
		}
	}
}
func TestFrameFromFelderaJSONRejectsAmbiguousInvalidPayload(t *testing.T) {
	if _, err := frameFromFelderaJSON([]byte("{\n  \"value\": 1\n}")); err == nil {
		t.Fatal("expected parse error")
	}
}
func TestFrameFromFelderaJSONAcceptsEmptyResult(t *testing.T) {
	frame, err := frameFromFelderaJSON([]byte(" \n"))
	if err != nil || frame != nil {
		t.Fatalf("frame=%v err=%v", frame, err)
	}
}

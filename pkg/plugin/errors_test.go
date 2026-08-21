package plugin

import (
	"errors"
	"testing"

	"github.com/fornybar/feldera-grafana-connector/pkg/feldera"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

func TestFelderaQueryErrorClassifiesHTTPFailures(t *testing.T) {
	cases := []struct {
		statusCode int
		status     backend.Status
		message    string
	}{
		{400, backend.StatusBadRequest, "Feldera rejected the query"},
		{401, backend.StatusUnauthorized, "Feldera credentials lack access"},
		{404, backend.StatusNotFound, "Feldera pipeline was not found"},
		{504, backend.StatusTimeout, "Feldera query timed out"},
	}
	for _, test := range cases {
		response := felderaQueryError(&feldera.HTTPError{StatusCode: test.statusCode})
		if response.Error == nil || response.Status != test.status || response.Error.Error() != test.message {
			t.Fatalf("status %d: %#v", test.statusCode, response.Error)
		}
	}
}

func TestFelderaQueryErrorDoesNotExposeUnknownError(t *testing.T) {
	response := felderaQueryError(errors.New("sensitive upstream detail"))
	if response.Error == nil || response.Error.Error() != "Feldera request failed" {
		t.Fatalf("unexpected response: %#v", response.Error)
	}
}

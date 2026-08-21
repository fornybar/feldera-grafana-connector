package plugin

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/fornybar/feldera-grafana-connector/pkg/feldera"
	"github.com/fornybar/feldera-grafana-connector/pkg/models"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

func TestQueryDataSendsAuthenticationAndExpandedTimeRange(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get("Authorization"); got != "Bearer secret" {
			t.Errorf("authorization = %q", got)
		}
		if got := r.URL.Path; got != "/v0/pipelines/energy/query" {
			t.Errorf("path = %q", got)
		}
		format := r.URL.Query().Get("format")
		if format != "arrow_ipc" && format != "json" {
			t.Errorf("format = %q", format)
		}
		if got := r.URL.Query().Get("sql"); got != "SELECT * FROM v WHERE ts >= '2025-01-02T03:04:05Z'" {
			t.Errorf("sql = %q", got)
		}
		_, _ = w.Write([]byte(`{"ts":"2025-01-02T03:04:05Z","value":42}`))
	}))
	defer server.Close()
	client, err := feldera.New(server.URL, "secret", server.Client())
	if err != nil {
		t.Fatal(err)
	}
	ds := Datasource{client: client, settings: &models.PluginSettings{BaseUrl: server.URL, Pipeline: "energy", Secrets: &models.SecretPluginSettings{ApiKey: "secret"}}}
	from := time.Date(2025, 1, 2, 3, 4, 5, 0, time.UTC)
	response, err := ds.QueryData(context.Background(), &backend.QueryDataRequest{Queries: []backend.DataQuery{{RefID: "A", JSON: []byte(`{"queryText":"SELECT * FROM v WHERE ts >= $__timeFrom()"}`), TimeRange: backend.TimeRange{From: from, To: from}}}})
	if err != nil {
		t.Fatal(err)
	}
	if response.Responses["A"].Error != nil {
		t.Fatal(response.Responses["A"].Error)
	}
	if len(response.Responses["A"].Frames) != 1 {
		t.Fatal("expected one result frame")
	}
}

func TestQueryDataRejectsQueryWithoutPipeline(t *testing.T) {
	ds := Datasource{settings: &models.PluginSettings{BaseUrl: "http://example.test", Secrets: &models.SecretPluginSettings{}}}
	response, err := ds.QueryData(context.Background(), &backend.QueryDataRequest{Queries: []backend.DataQuery{{RefID: "A", JSON: []byte(`{"queryText":"SELECT 1"}`)}}})
	if err != nil {
		t.Fatal(err)
	}
	if response.Responses["A"].Error == nil {
		t.Fatal("expected validation error")
	}
}

type captureSender struct{ response *backend.CallResourceResponse }

func (s *captureSender) Send(response *backend.CallResourceResponse) error {
	s.response = response
	return nil
}

func TestPipelineResourceOnlyAllowsReadOnlyKnownRoute(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { _, _ = w.Write([]byte(`[{"name":"energy"}]`)) }))
	defer server.Close()
	client, _ := feldera.New(server.URL, "", server.Client())
	ds := Datasource{client: client, settings: &models.PluginSettings{Secrets: &models.SecretPluginSettings{}}}
	sender := &captureSender{}
	if err := ds.CallResource(context.Background(), &backend.CallResourceRequest{Method: "GET", Path: "pipelines"}, sender); err != nil {
		t.Fatal(err)
	}
	if sender.response.Status != http.StatusOK || string(sender.response.Body) != `[{"name":"energy"}]` {
		t.Fatalf("unexpected response: %#v", sender.response)
	}
	if err := ds.CallResource(context.Background(), &backend.CallResourceRequest{Method: "POST", Path: "pipelines"}, sender); err != nil {
		t.Fatal(err)
	}
	if sender.response.Status != http.StatusNotFound {
		t.Fatal("mutation route must be rejected")
	}
}

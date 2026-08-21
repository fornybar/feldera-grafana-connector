package feldera

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestQueryUsesAuthenticatedEscapedRequest(t *testing.T) {
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v0/pipelines/a b/query" {
			t.Errorf("path %q", r.URL.Path)
		}
		if r.Header.Get("Authorization") != "Bearer secret" {
			t.Error("missing authorization")
		}
		if r.URL.Query().Get("format") != "json" || r.URL.Query().Get("sql") != "select 1" {
			t.Error("wrong query")
		}
		_, _ = w.Write([]byte(`{"x":1}`))
	}))
	defer s.Close()
	c, err := New(s.URL, "secret", s.Client())
	if err != nil {
		t.Fatal(err)
	}
	if _, err = c.Query(context.Background(), "a b", "select 1"); err != nil {
		t.Fatal(err)
	}
}
func TestQueryReturnsSafeHTTPError(t *testing.T) {
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { http.Error(w, "bad query", http.StatusBadRequest) }))
	defer s.Close()
	c, _ := New(s.URL, "", s.Client())
	if _, err := c.Query(context.Background(), "p", "x"); err == nil {
		t.Fatal("expected error")
	}
}

package feldera

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const MaxResponseBytes int64 = 50 << 20

type Client struct {
	baseURL, apiKey string
	httpClient      *http.Client
}

type HTTPError struct {
	StatusCode int
	Status     string
}

func (e *HTTPError) Error() string {
	return fmt.Sprintf("Feldera request failed with HTTP %s", e.Status)
}

func New(baseURL, apiKey string, httpClient *http.Client) (*Client, error) {
	parsed, err := url.ParseRequestURI(baseURL)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return nil, fmt.Errorf("invalid Feldera base URL")
	}
	if httpClient == nil {
		httpClient = &http.Client{Timeout: 30 * time.Second}
	}
	return &Client{baseURL: strings.TrimRight(baseURL, "/"), apiKey: apiKey, httpClient: httpClient}, nil
}

func (c *Client) Query(ctx context.Context, pipeline, sql string) ([]byte, error) {
	return c.query(ctx, pipeline, sql, "json")
}

func (c *Client) QueryArrow(ctx context.Context, pipeline, sql string) ([]byte, error) {
	return c.query(ctx, pipeline, sql, "arrow_ipc")
}

func (c *Client) query(ctx context.Context, pipeline, sql, format string) ([]byte, error) {
	endpoint := c.baseURL + "/v0/pipelines/" + url.PathEscape(pipeline) + "/query"
	values := url.Values{"format": {format}, "sql": {sql}}
	return c.get(ctx, endpoint+"?"+values.Encode())
}
func (c *Client) Pipelines(ctx context.Context) ([]byte, error) {
	return c.get(ctx, c.baseURL+"/v0/pipelines")
}

func (c *Client) Pipeline(ctx context.Context, pipeline string) ([]byte, error) {
	endpoint := c.baseURL + "/v0/pipelines/" + url.PathEscape(pipeline)
	return c.get(ctx, endpoint)
}
func (c *Client) get(ctx context.Context, endpoint string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}
	if c.apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+c.apiKey)
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(io.LimitReader(resp.Body, MaxResponseBytes))
	if err != nil {
		return nil, err
	}
	if resp.StatusCode/100 != 2 {
		return nil, &HTTPError{StatusCode: resp.StatusCode, Status: resp.Status}
	}
	return body, nil
}

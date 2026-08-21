package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/fornybar/feldera-grafana-connector/pkg/feldera"
	"github.com/fornybar/feldera-grafana-connector/pkg/models"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

var (
	_ backend.QueryDataHandler      = (*Datasource)(nil)
	_ backend.CheckHealthHandler    = (*Datasource)(nil)
	_ backend.CallResourceHandler   = (*Datasource)(nil)
	_ instancemgmt.InstanceDisposer = (*Datasource)(nil)
)

type Datasource struct {
	client   *feldera.Client
	settings *models.PluginSettings
}

type queryModel struct {
	QueryText string `json:"queryText"`
	Pipeline  string `json:"pipeline"`
}

func NewDatasource(_ context.Context, setting backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	settings, err := models.LoadPluginSettings(setting)
	if err != nil {
		return nil, err
	}
	settings.BaseUrl = strings.TrimSpace(settings.BaseUrl)
	if settings.BaseUrl == "" {
		return nil, fmt.Errorf("base URL is required")
	}
	client, err := feldera.New(settings.BaseUrl, settings.Secrets.ApiKey, nil)
	if err != nil {
		return nil, err
	}
	return &Datasource{client: client, settings: settings}, nil
}

func (d *Datasource) Dispose() {}

func (d *Datasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	response := backend.NewQueryDataResponse()
	for _, query := range req.Queries {
		response.Responses[query.RefID] = d.query(ctx, query)
	}
	return response, nil
}

func (d *Datasource) query(ctx context.Context, query backend.DataQuery) backend.DataResponse {
	var model queryModel
	if err := json.Unmarshal(query.JSON, &model); err != nil {
		return backend.ErrDataResponse(backend.StatusValidationFailed, "invalid query model")
	}
	sql := strings.TrimSpace(model.QueryText)
	if sql == "" {
		return backend.DataResponse{}
	}
	pipeline := strings.TrimSpace(model.Pipeline)
	if pipeline == "" {
		pipeline = strings.TrimSpace(d.settings.Pipeline)
	}
	if pipeline == "" {
		return backend.ErrDataResponse(backend.StatusValidationFailed, "pipeline is required")
	}
	if err := validateReadOnlySQL(sql); err != nil {
		return backend.ErrDataResponse(backend.StatusValidationFailed, err.Error())
	}
	sql = expandTimeMacros(sql, query.TimeRange)

	body, err := d.client.QueryArrow(ctx, pipeline, sql)
	if err != nil {
		return backend.ErrDataResponse(backend.StatusBadGateway, err.Error())
	}
	frame, err := frameFromFelderaArrow(body)
	if err != nil {
		log.DefaultLogger.Info("Falling back to Feldera JSON result", "reason", "arrowDecodeFailed")
		body, jsonErr := d.client.Query(ctx, pipeline, sql)
		if jsonErr != nil {
			return backend.ErrDataResponse(backend.StatusBadGateway, jsonErr.Error())
		}
		frame, err = frameFromFelderaJSON(body)
		if err != nil {
			return backend.ErrDataResponse(backend.StatusBadGateway, "cannot decode Feldera query result: "+err.Error())
		}
	}
	if frame == nil {
		return backend.DataResponse{}
	}
	return backend.DataResponse{Frames: []*data.Frame{frame}}
}

func expandTimeMacros(sql string, timeRange backend.TimeRange) string {
	from := fmt.Sprintf("'%s'", timeRange.From.UTC().Format(time.RFC3339))
	to := fmt.Sprintf("'%s'", timeRange.To.UTC().Format(time.RFC3339))
	sql = strings.ReplaceAll(sql, "$__timeFrom()", from)
	return strings.ReplaceAll(sql, "$__timeTo()", to)
}

func (d *Datasource) CheckHealth(ctx context.Context, _ *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	if d.client == nil {
		return &backend.CheckHealthResult{Status: backend.HealthStatusError, Message: "Invalid base URL"}, nil
	}
	if _, err := d.client.Pipelines(ctx); err != nil {
		return &backend.CheckHealthResult{Status: backend.HealthStatusError, Message: "Feldera unavailable: " + err.Error()}, nil
	}
	return &backend.CheckHealthResult{Status: backend.HealthStatusOk, Message: "Connected to Feldera"}, nil
}

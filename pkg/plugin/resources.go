package plugin

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

type columnInfo struct {
	Name string `json:"name"`
}

type viewInfo struct {
	Name         string       `json:"name"`
	Materialized bool         `json:"materialized"`
	Columns      []columnInfo `json:"columns"`
}

type programRelation struct {
	Name         string       `json:"name"`
	Materialized bool         `json:"materialized"`
	Fields       []columnInfo `json:"fields"`
}

// CallResource exposes only read-only metadata routes.
func (d *Datasource) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	if req.Method != http.MethodGet {
		return sender.Send(jsonResponse(http.StatusNotFound, map[string]string{"message": "resource not found"}))
	}

	path := strings.Split(strings.Trim(req.Path, "/"), "/")
	switch {
	case len(path) == 1 && path[0] == "pipelines":
		body, err := d.client.Pipelines(ctx)
		if err != nil {
			return sender.Send(jsonResponse(http.StatusBadGateway, map[string]string{"message": "Feldera metadata request failed"}))
		}
		pipelines, err := pipelineNames(body)
		if err != nil {
			return sender.Send(jsonResponse(http.StatusBadGateway, map[string]string{"message": "Feldera returned an unsupported pipeline list"}))
		}
		return sender.Send(jsonResponse(http.StatusOK, pipelines))
	case len(path) == 3 && path[0] == "pipelines" && path[2] == "views" && path[1] != "":
		body, err := d.client.Pipeline(ctx, path[1])
		if err != nil {
			return sender.Send(jsonResponse(http.StatusBadGateway, map[string]string{"message": "Feldera view discovery request failed"}))
		}
		views, err := outputViews(body)
		if err != nil {
			return sender.Send(jsonResponse(http.StatusBadGateway, map[string]string{"message": "Feldera returned an unsupported pipeline schema"}))
		}
		return sender.Send(jsonResponse(http.StatusOK, views))
	default:
		return sender.Send(jsonResponse(http.StatusNotFound, map[string]string{"message": "resource not found"}))
	}
}

type pipelineInfo struct {
	Name string `json:"name"`
}

// pipelineNames keeps pipeline configuration backend-only.
func pipelineNames(body []byte) ([]pipelineInfo, error) {
	var pipelines []pipelineInfo
	if err := json.Unmarshal(body, &pipelines); err != nil {
		return nil, err
	}
	result := make([]pipelineInfo, 0, len(pipelines))
	for _, pipeline := range pipelines {
		if pipeline.Name != "" {
			result = append(result, pipeline)
		}
	}
	return result, nil
}

// outputViews keeps pipeline configuration backend-only.
func outputViews(body []byte) ([]viewInfo, error) {
	var response struct {
		ProgramInfo *struct {
			Schema struct {
				Outputs []programRelation `json:"outputs"`
			} `json:"schema"`
		} `json:"program_info"`
	}
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, err
	}
	if response.ProgramInfo == nil {
		return []viewInfo{}, nil
	}
	outputs := response.ProgramInfo.Schema.Outputs
	views := make([]viewInfo, 0, len(outputs))
	for _, output := range outputs {
		if output.Name == "" || !output.Materialized {
			continue
		}
		columns := make([]columnInfo, 0, len(output.Fields))
		for _, field := range output.Fields {
			if field.Name != "" {
				columns = append(columns, field)
			}
		}
		views = append(views, viewInfo{Name: output.Name, Materialized: output.Materialized, Columns: columns})
	}
	return views, nil
}

func jsonResponse(status int, value any) *backend.CallResourceResponse {
	body, _ := json.Marshal(value)
	return &backend.CallResourceResponse{Status: status, Headers: map[string][]string{"Content-Type": {"application/json"}}, Body: body}
}

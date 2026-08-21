package plugin

import (
	"errors"

	"github.com/fornybar/feldera-grafana-connector/pkg/feldera"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

func felderaQueryError(err error) backend.DataResponse {
	var httpError *feldera.HTTPError
	if !errors.As(err, &httpError) {
		return backend.ErrDataResponse(backend.StatusBadGateway, "Feldera request failed")
	}
	switch httpError.StatusCode {
	case 400:
		return backend.ErrDataResponse(backend.StatusBadRequest, "Feldera rejected the query")
	case 401, 403:
		return backend.ErrDataResponse(backend.StatusUnauthorized, "Feldera credentials lack access")
	case 404:
		return backend.ErrDataResponse(backend.StatusNotFound, "Feldera pipeline was not found")
	case 408, 504:
		return backend.ErrDataResponse(backend.StatusTimeout, "Feldera query timed out")
	default:
		return backend.ErrDataResponse(backend.StatusBadGateway, "Feldera request failed")
	}
}

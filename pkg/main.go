package main

import (
	"os"

	"github.com/fornybar/feldera-grafana-connector/pkg/plugin"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

func main() {
	if err := datasource.Manage("feldera-datasource-connector", plugin.NewDatasource, datasource.ManageOpts{}); err != nil {
		log.DefaultLogger.Error(err.Error())
		os.Exit(1)
	}
}

package plugin

import "testing"

func TestPipelineNamesStripsPipelineDefinitions(t *testing.T) {
	pipelines, err := pipelineNames([]byte(`[
		{"name":"power","program_code":"CREATE VIEW secret AS SELECT 1","runtime_config":{"workers":4}},
		{"name":"overview"},
		{"program_code":"missing name"}
	]`))
	if err != nil {
		t.Fatal(err)
	}
	if len(pipelines) != 2 || pipelines[0].Name != "power" || pipelines[1].Name != "overview" {
		t.Fatalf("unexpected pipelines: %#v", pipelines)
	}
}

func TestOutputViewsReturnsOnlyOutputSchema(t *testing.T) {
	body := []byte(`{
		"program_info": {
			"schema": {
				"inputs": [{"name":"source_table"}],
				"outputs": [
					{"name":"daily_power","materialized":true,"fields":[{"name":"timestamp"},{"name":"power_mw"}]},
					{"name":"latest_status","materialized":false}
				]
			}
		}
	}`)
	views, err := outputViews(body)
	if err != nil {
		t.Fatal(err)
	}
	if len(views) != 1 || views[0].Name != "daily_power" || !views[0].Materialized || len(views[0].Columns) != 2 || views[0].Columns[1].Name != "power_mw" {
		t.Fatalf("unexpected views: %#v", views)
	}
}

func TestOutputViewsHandlesPipelineWithoutCompiledSchema(t *testing.T) {
	views, err := outputViews([]byte(`{"program_info":null}`))
	if err != nil {
		t.Fatal(err)
	}
	if len(views) != 0 {
		t.Fatalf("unexpected views: %#v", views)
	}
}

package plugin

import (
	"bytes"
	"encoding/json"
	"fmt"
	"time"

	"github.com/apache/arrow-go/v18/arrow"
	"github.com/apache/arrow-go/v18/arrow/array"
	"github.com/apache/arrow-go/v18/arrow/ipc"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/grafana/infinity-libs/lib/go/jsonframer"
)

// Arrow preserves native query result types.
func frameFromFelderaArrow(body []byte) (*data.Frame, error) {
	if len(bytes.TrimSpace(body)) == 0 {
		return nil, nil
	}

	reader, err := ipc.NewReader(bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("decode Feldera Arrow IPC stream: %w", err)
	}
	defer reader.Release()
	var frame *data.Frame
	for reader.Next() {
		var err error
		frame, err = appendArrowRecord(frame, reader.Record())
		if err != nil {
			return nil, fmt.Errorf("convert Feldera Arrow record: %w", err)
		}
	}
	if reader.Err() != nil {
		return nil, fmt.Errorf("read Feldera Arrow IPC stream: %w", reader.Err())
	}
	log.DefaultLogger.Info("Decoded Feldera Arrow result", "transport", "stream")
	return frame, nil
}

func appendArrowRecord(frame *data.Frame, record arrow.Record) (*data.Frame, error) {
	next, err := data.FromArrowRecord(record)
	if err != nil {
		return nil, err
	}
	for index, field := range record.Schema().Fields() {
		timestampType, ok := field.Type.(*arrow.TimestampType)
		if !ok {
			continue
		}
		next.Fields[index] = timestampField(next.Fields[index], array.NewTimestampData(record.Column(index).Data()), timestampType.Unit)
	}
	if frame == nil {
		return next, nil
	}
	for row := 0; row < next.Rows(); row++ {
		frame.AppendRow(next.RowCopy(row)...)
	}
	return frame, nil
}

func timestampField(field *data.Field, values *array.Timestamp, unit arrow.TimeUnit) *data.Field {
	var replacement *data.Field
	if values.NullN() > 0 {
		converted := make([]*time.Time, values.Len())
		for row, timestamp := range values.TimestampValues() {
			if values.IsNull(row) {
				continue
			}
			value := timestampToTime(timestamp, unit)
			converted[row] = &value
		}
		replacement = data.NewField(field.Name, field.Labels, converted)
	} else {
		converted := make([]time.Time, values.Len())
		for row, timestamp := range values.TimestampValues() {
			converted[row] = timestampToTime(timestamp, unit)
		}
		replacement = data.NewField(field.Name, field.Labels, converted)
	}
	replacement.Config = field.Config
	return replacement
}

func timestampToTime(timestamp arrow.Timestamp, unit arrow.TimeUnit) time.Time {
	switch unit {
	case arrow.Second:
		return time.Unix(int64(timestamp), 0)
	case arrow.Millisecond:
		return time.UnixMilli(int64(timestamp))
	case arrow.Microsecond:
		return time.UnixMicro(int64(timestamp))
	default:
		return time.Unix(0, int64(timestamp))
	}
}

// JSON fallback accepts arrays and NDJSON records.
func frameFromFelderaJSON(body []byte) (*data.Frame, error) {
	trimmed := bytes.TrimSpace(body)
	if len(trimmed) == 0 {
		return nil, nil
	}

	var array []json.RawMessage
	if err := json.Unmarshal(trimmed, &array); err == nil {
		return frameFromRecords(array)
	}

	lines := bytes.Split(trimmed, []byte{'\n'})
	records := make([]json.RawMessage, 0, len(lines))
	for _, line := range lines {
		line = bytes.TrimSpace(line)
		if len(line) == 0 {
			continue
		}
		var record json.RawMessage
		if err := json.Unmarshal(line, &record); err != nil {
			return nil, fmt.Errorf("expected JSON array or NDJSON record: %w", err)
		}
		if len(record) == 0 || record[0] != '{' {
			return nil, fmt.Errorf("expected JSON object records")
		}
		records = append(records, record)
	}
	return frameFromRecords(records)
}

func frameFromRecords(records []json.RawMessage) (*data.Frame, error) {
	if len(records) == 0 {
		return nil, nil
	}
	payload, err := json.Marshal(records)
	if err != nil {
		return nil, err
	}
	frame, err := jsonframer.ToFrame(string(payload), jsonframer.FramerOptions{})
	if err != nil {
		return nil, fmt.Errorf("convert Feldera rows to Grafana frame: %w", err)
	}
	return frame, nil
}

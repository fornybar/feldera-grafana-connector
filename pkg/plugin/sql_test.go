package plugin

import "testing"

func TestValidateReadOnlySQLAllowsSelectQueries(t *testing.T) {
	for _, sql := range []string{
		"SELECT * FROM power",
		"  -- dashboard query\n SELECT value FROM power",
		"/* dashboard query */ EXPLAIN SELECT * FROM power",
		"select * from power;",
		"SELECT * FROM power WHERE tag = 'a;b'",
	} {
		if err := validateReadOnlySQL(sql); err != nil {
			t.Fatalf("expected query to be allowed: %q: %v", sql, err)
		}
	}
}

func TestValidateReadOnlySQLRejectsWriteAndMultipleStatements(t *testing.T) {
	for _, sql := range []string{
		"INSERT INTO power VALUES (1)",
		"UPDATE power SET value = 1",
		"DELETE FROM power",
		"CREATE VIEW dangerous AS SELECT 1",
		"WITH source AS (SELECT 1) SELECT * FROM source",
		"SELECT 1; DELETE FROM power",
		"SELECT 1; SELECT 2",
	} {
		if err := validateReadOnlySQL(sql); err == nil {
			t.Fatalf("expected query to be rejected: %q", sql)
		}
	}
}

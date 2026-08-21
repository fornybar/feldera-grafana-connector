package plugin

import (
	"fmt"
	"strings"
	"unicode"
)

// validateReadOnlySQL permits one SELECT statement or EXPLAIN SELECT.
func validateReadOnlySQL(sql string) error {
	statement := stripLeadingSQLComments(sql)
	if hasStatementSeparator(statement) {
		return fmt.Errorf("only one read-only SQL statement is allowed")
	}
	first, remainder := firstSQLWord(statement)
	if first == "EXPLAIN" {
		first, _ = firstSQLWord(remainder)
	}
	if first != "SELECT" {
		return fmt.Errorf("only read-only SELECT queries are allowed")
	}
	return nil
}

func stripLeadingSQLComments(sql string) string {
	remaining := strings.TrimSpace(sql)
	for {
		switch {
		case strings.HasPrefix(remaining, "--"):
			if newline := strings.IndexByte(remaining, '\n'); newline >= 0 {
				remaining = strings.TrimSpace(remaining[newline+1:])
			} else {
				return ""
			}
		case strings.HasPrefix(remaining, "/*"):
			end := strings.Index(remaining[2:], "*/")
			if end < 0 {
				return remaining
			}
			remaining = strings.TrimSpace(remaining[end+4:])
		default:
			return remaining
		}
	}
}

// hasStatementSeparator permits one trailing terminator outside quotes.
func hasStatementSeparator(sql string) bool {
	inSingleQuote := false
	inDoubleQuote := false
	for index := 0; index < len(sql); index++ {
		switch sql[index] {
		case '\'':
			if !inDoubleQuote {
				if inSingleQuote && index+1 < len(sql) && sql[index+1] == '\'' {
					index++
					continue
				}
				inSingleQuote = !inSingleQuote
			}
		case '"':
			if !inSingleQuote {
				if inDoubleQuote && index+1 < len(sql) && sql[index+1] == '"' {
					index++
					continue
				}
				inDoubleQuote = !inDoubleQuote
			}
		case ';':
			if !inSingleQuote && !inDoubleQuote && strings.TrimSpace(sql[index+1:]) != "" {
				return true
			}
		}
	}
	return false
}

func firstSQLWord(sql string) (string, string) {
	trimmed := strings.TrimLeftFunc(sql, unicode.IsSpace)
	for index, char := range trimmed {
		if !unicode.IsLetter(char) {
			return strings.ToUpper(trimmed[:index]), trimmed[index:]
		}
	}
	return strings.ToUpper(trimmed), ""
}

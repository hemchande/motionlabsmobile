#!/bin/bash
# Test all Alert Dashboard API endpoints (port 8004)
# Usage: ./scripts/test_alert_endpoints.sh [base_url]
BASE_URL="${1:-http://localhost:8004}"
ATHLETE_ID="${2:-athlete_001}"
ALERT_ID="${3:-}"
SESSION_ID="${4:-test_metrics_drift_10}"

echo "=========================================="
echo "Alert Dashboard Endpoint Tests"
echo "Base URL: $BASE_URL"
echo "Athlete ID: $ATHLETE_ID"
echo "=========================================="

test_endpoint() {
  local name="$1"
  local url="$2"
  echo ""
  echo "--- $name ---"
  echo "GET $url"
  response=$(curl -s -w "\n%{http_code}" "$url")
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  echo "HTTP: $http_code"
  echo "$body" | head -c 500
  [ ${#body} -gt 500 ] && echo "...[truncated]"
  echo ""
}

# 1. Health
test_endpoint "1. Health" "$BASE_URL/health"

# 2. Get athlete alerts
test_endpoint "2. Get athlete alerts" "$BASE_URL/api/athlete/$ATHLETE_ID/alerts?include_stream_urls=true&include_insights=true&include_metrics=true&limit=10"

# 3. Get all alerts
test_endpoint "3. Get all alerts" "$BASE_URL/api/alerts?limit=10"

# 4. Get session
test_endpoint "4. Get session" "$BASE_URL/api/session/$SESSION_ID"

# 5. Get session insights
test_endpoint "5. Get session insights" "$BASE_URL/api/session/$SESSION_ID/insights"

# 6. Get session metrics
test_endpoint "6. Get session metrics" "$BASE_URL/api/session/$SESSION_ID/metrics"

# 7. Get sessions for alert (need alert_id from step 2 or 3)
if [ -n "$ALERT_ID" ]; then
  test_endpoint "7. Get sessions for alert" "$BASE_URL/api/alert/$ALERT_ID/sessions"
  test_endpoint "8. Get clips for alert" "$BASE_URL/api/alert/$ALERT_ID/clips"
  test_endpoint "9. Get baselines for alert" "$BASE_URL/api/alert/$ALERT_ID/baselines"
else
  echo ""
  echo "--- 7. Get sessions for alert (skipped - no ALERT_ID) ---"
  echo "--- 8. Get clips for alert (skipped) ---"
  echo "--- 9. Get baselines for alert (skipped) ---"
  echo "   Pass alert_id as 3rd arg to test"
fi

echo "=========================================="
echo "Tests complete"
echo "=========================================="

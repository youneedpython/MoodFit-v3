#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
fail() { printf 'FAIL: smoke %s\n' "$1" >&2; exit 1; }
trap 'fail "transport, HTTP or contract check failed"' ERR
command -v python >/dev/null || fail 'Python required'
work=$(mktemp -d)
chmod 700 "$work"
umask 077
trap 'rm -rf -- "$work"' EXIT
base=https://staging.moodfit.8949db.kr
request() {
  local expected=$1 path=$2 output=$3
  shift 3
  code=$(curl --silent --show-error --connect-timeout 10 --max-time 30 --cookie "$work/cookies" --cookie-jar "$work/cookies" --config "$work/headers" --output "$output" --write-out '%{http_code}' "$@" "$base$path" 2>/dev/null) || fail "transport failed for $path"
  [[ "$code" == "$expected" ]] || fail "unexpected HTTP status for $path"
}
touch "$work/headers" "$work/cookies"
printf 'STEP: static and SPA\n'
request 200 / "$work/index"
for path in /check-in /history; do
  request 200 "$path" "$work/spa"
  cmp -s "$work/index" "$work/spa" || fail 'SPA route does not return index document'
done
python - "$work/index" <<'PY'
import sys
assert '<html' in open(sys.argv[1], encoding='utf-8').read().lower(), 'FAIL: missing HTML'
PY
redirect=$(curl --silent --connect-timeout 10 --max-time 30 --output /dev/null --write-out '%{http_code} %{redirect_url}' http://staging.moodfit.8949db.kr/ 2>/dev/null)
[[ "$redirect" == '301 https://staging.moodfit.8949db.kr/' || "$redirect" == '302 https://staging.moodfit.8949db.kr/' || "$redirect" == '307 https://staging.moodfit.8949db.kr/' || "$redirect" == '308 https://staging.moodfit.8949db.kr/' ]] || fail 'HTTP redirect not preserved'
printf 'STEP: origin protection\n'
origin_code=000
if origin_code=$(curl --silent --connect-timeout 10 --max-time 20 --output /dev/null --write-out '%{http_code}' https://origin.staging.moodfit.8949db.kr/api/check-ins/latest 2>/dev/null); then
  [[ "$origin_code" == 403 ]] || fail 'origin direct access was not blocked'
else
  [[ "$origin_code" == 000 ]] || fail 'origin returned unexpected partial response'
fi
printf 'STEP: unauthenticated 401 and guest login\n'
request 401 /api/check-ins/latest "$work/unauthenticated"
request 200 /api/auth/me "$work/me"
csrf_headers() {
  python - "$work" <<'PY'
import pathlib, sys
p = pathlib.Path(sys.argv[1])
rows = [line.split('\t') for line in (p / 'cookies').read_text().splitlines() if not line.startswith('#')]
values = [row[6] for row in rows if len(row) == 7 and row[5] == 'XSRF-TOKEN']
assert len(values) == 1 and values[0] and all(c.isalnum() or c == '-' for c in values[0])
header_name = 'X-XSRF-TOKEN'
(p / 'headers').write_text('header = "' + header_name + ': ' + values[0] + '"\n', encoding='utf-8')
PY
}
csrf_headers
request 204 /api/auth/guest "$work/guest" --request POST
request 200 /api/auth/me "$work/me"
csrf_headers
python - "$work/me" <<'PY'
import json, sys
result = json.load(open(sys.argv[1], encoding='utf-8'))
assert result['authenticated'] and result['user']['provider'] == 'guest'
PY
printf 'STEP: synthetic create and error preservation\n'
request 400 /api/check-ins "$work/error" -H 'Content-Type: application/json' --data '{"heartRate":181,"respiratoryRate":18,"sleepScore":86,"stressLevel":31,"energyLevel":74,"temperature":19.0,"weather":"RAIN"}'
request 201 /api/check-ins "$work/create" -H 'Content-Type: application/json' --data '{"heartRate":68,"respiratoryRate":18,"sleepScore":86,"stressLevel":31,"energyLevel":74,"temperature":19.0,"weather":"RAIN"}'
request 200 /api/check-ins/latest "$work/latest"
request 200 '/api/check-ins/history?days=7' "$work/history"
python - "$work" <<'PY'
import datetime, json, pathlib, sys
p = pathlib.Path(sys.argv[1])
def load(name): return json.loads((p / name).read_text(encoding='utf-8'))
def contract(name): return json.loads(pathlib.Path('contracts/' + name + '.json').read_text(encoding='utf-8'))
def recommendation(actual, expected):
    if isinstance(expected, dict):
        assert isinstance(actual, dict) and actual.keys() == expected.keys()
        for key, value in expected.items():
            if key == 'videoId':
                assert actual[key] is None or (type(actual[key]) is str and len(actual[key]) == 11)
            else: recommendation(actual[key], value)
    else:
        assert type(actual) is type(expected)

def match(actual, expected):
    if isinstance(expected, dict):
        assert isinstance(actual, dict) and actual.keys() == expected.keys()
        for key, value in expected.items():
            if key == 'id': assert type(actual[key]) is int and actual[key] > 0
            elif key == 'recordedAt': datetime.datetime.fromisoformat(actual[key].replace('Z', '+00:00'))
            elif key in ('foods', 'music', 'foodNames', 'musicTitles'):
                assert isinstance(actual[key], list) and len(actual[key]) == 5
                for item in actual[key]: recommendation(item, value[0])
            else: match(actual[key], value)
    elif isinstance(expected, list):
        assert isinstance(actual, list) and len(actual) == len(expected)
        for a, e in zip(actual, expected): match(a, e)
    else: assert actual == expected
created = load('create')
match(created, contract('checkin-create-201'))
match(load('error'), contract('checkin-create-400'))
latest = load('latest')
match(latest, contract('checkin-latest-200'))
assert latest == created, 'concurrent write or latest mismatch'
history = load('history')
sample = contract('checkin-history-200')
assert history.keys() == sample.keys() and history['days'] == 7
item = next(i for i in history['items'] if i['id'] == created['id'])
match(item, sample['items'][0])
assert item['recordedAt'] == created['recordedAt']
print('PASS: create/latest/history and 400 contract preserved')
PY
printf 'PASS: staging smoke (synthetic record retained; no deletion)\n'

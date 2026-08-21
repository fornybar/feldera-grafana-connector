#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_root"

plugin_id=feldera-datasource-connector
version=$(node -p "require('./package.json').version")
artifact_dir="$repo_root/artifacts"
staging_dir=$(mktemp -d)
trap 'rm -rf "$staging_dir"' EXIT

rm -rf dist
npm run build
go run github.com/magefile/mage -v build:backend

plugin_dir="$staging_dir/$plugin_id"
mkdir -p "$plugin_dir"
cp -r dist/* "$plugin_dir/"

backend="$plugin_dir/feldera_datasource_connector_linux_amd64"
if [[ ! -x "$backend" ]]; then
  echo "missing Linux backend: $backend" >&2
  exit 1
fi

mkdir -p "$artifact_dir"
artifact="$artifact_dir/$plugin_id-$version.zip"
rm -f "$artifact"
python3 - "$staging_dir" "$plugin_id" "$artifact" <<'PY'
import os
import stat
import sys
import zipfile

root, plugin_id, artifact = sys.argv[1:]
with zipfile.ZipFile(artifact, 'w', zipfile.ZIP_DEFLATED) as archive:
    for directory, _, files in os.walk(os.path.join(root, plugin_id)):
        for filename in files:
            path = os.path.join(directory, filename)
            info = zipfile.ZipInfo(os.path.relpath(path, root))
            info.external_attr = (stat.S_IMODE(os.stat(path).st_mode) | stat.S_IFREG) << 16
            with open(path, 'rb') as source:
                archive.writestr(info, source.read(), compress_type=zipfile.ZIP_DEFLATED)
PY
sha256sum "$artifact" > "$artifact.sha256"
printf 'Created %s\n' "$artifact"

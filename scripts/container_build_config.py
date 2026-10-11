import json
import os
from pathlib import Path
import re


def build_arguments(config, ref, dockerfile):
    if not isinstance(config, dict):
        raise ValueError('CONTAINER_PUBLIC_BUILD_ENV must be a JSON object')
    declared = set(re.findall(r'^ARG ([A-Z0-9_]+)', dockerfile, re.M))
    allowed = {key for key in declared if key.startswith('NEXT_PUBLIC_') or key == 'NEXT_IMAGE_UNOPTIMIZED'}
    if set(config) - allowed:
        raise ValueError('Only public arguments declared in Dockerfile are accepted')
    if any(not isinstance(value, str) or value != value.strip() or any(c in value for c in '\r\n\0') for value in config.values()):
        raise ValueError('Build values must be trimmed single-line strings')
    expected = {
        'refs/heads/master': ('https://www.emuready.com', 'production', 'pk_live_'),
        'refs/heads/staging': ('https://staging.emuready.com', 'staging', 'pk_test_'),
    }
    if ref not in expected:
        raise ValueError('Container images may only be built from master or staging')
    url, environment, clerk_prefix = expected[ref]
    if config.get('NEXT_PUBLIC_APP_URL') != url or config.get('NEXT_PUBLIC_APP_ENV') != environment:
        raise ValueError('Public URL and environment must match the selected branch')
    clerk_key = config.get('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', '')
    if not clerk_key.startswith(clerk_prefix) or len(clerk_key) == len(clerk_prefix):
        raise ValueError('Supply a full Clerk publishable key for the selected environment')
    return [item for key, value in sorted(config.items()) for item in ('--build-arg', f'{key}={value}')]


if __name__ == '__main__':
    try:
        arguments = build_arguments(json.loads(os.environ['PUBLIC_BUILD_ENV']), os.environ['GITHUB_REF'], Path('Dockerfile').read_text())
    except ValueError as error:
        raise SystemExit(str(error)) from error
    Path(os.environ['RUNNER_TEMP'], 'container-build-args').write_bytes(('\0'.join(arguments) + '\0').encode())

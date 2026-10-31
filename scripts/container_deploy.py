import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import time


COOLIFY_URL = 'https://coolify.emuready.com/api/v1'
TARGETS = {
    'refs/heads/master': 'https://www.emuready.com',
    'refs/heads/staging': 'https://staging.emuready.com',
}
IMAGE_NAME = 'ghcr.io/producdevity/emuready'


class ReleaseError(Exception):
    pass


class Client:
    def __init__(self, base, token=None):
        self.base = base
        self.token = token

    def request(self, path, method='GET', payload=None):
        config = [f'url = {json.dumps(self.base + path)}', f'request = {json.dumps(method)}']
        config.append('header = "Accept: application/json"')
        if self.token:
            if any(char in self.token for char in '\r\n\0'):
                raise ReleaseError('Invalid Coolify token format')
            config.append(f'header = {json.dumps("Authorization: Bearer " + self.token)}')
        if payload is not None:
            config.extend(['header = "Content-Type: application/json"',
                           f'data = {json.dumps(json.dumps(payload))}'])
        result = subprocess.run(
            ['curl', '--disable', '--config', '-', '--silent', '--show-error', '--connect-timeout', '10',
             '--max-time', '30', '--proto', '=https', '--write-out', '\n%{http_code}'],
            input='\n'.join(config), text=True, capture_output=True,
        )
        body, _, status = result.stdout.rpartition('\n')
        accepted_statuses = ('200', '201') if method == 'PATCH' else ('200',)
        if result.returncode or status not in accepted_statuses:
            raise ReleaseError(f'{method} request failed (HTTP {status or "unknown"})')
        try:
            return json.loads(body)
        except json.JSONDecodeError as error:
            raise ReleaseError('Expected a JSON response') from error


def git(*arguments):
    result = subprocess.run(['git', *arguments], capture_output=True, check=False)
    if result.returncode:
        raise ReleaseError('Unable to inspect release history or branch head')
    return result.stdout


def schema_digest(revision):
    if not isinstance(revision, str) or not re.fullmatch('[a-f0-9]{40}', revision):
        raise ReleaseError('Expected an immutable source commit')
    paths = git('ls-tree', '-r', '-z', '--name-only', revision, '--',
                'prisma/schema.prisma', 'prisma/migrations').split(b'\0')
    paths = sorted(path for path in paths if path)
    if b'prisma/schema.prisma' not in paths:
        raise ReleaseError('Release history does not contain the database schema')
    digest = hashlib.sha256()
    for path in paths:
        content = git('show', f'{revision}:{path.decode()}')
        for value in (path, content):
            digest.update(len(value).to_bytes(8, 'big'))
            digest.update(value)
    return digest.hexdigest()


def verify_branch_head(ref, revision):
    remote = git('ls-remote', '--exit-code', 'origin', ref).decode().split()
    if len(remote) != 2 or remote[0] != revision or remote[1] != ref:
        raise ReleaseError('Branch advanced; refusing to deploy an outdated release')


def preflight(ref, revision, application_uuid, api, public, approved_schema=None):
    if ref not in TARGETS or not re.fullmatch('[a-f0-9]{40}', revision):
        raise ReleaseError('Releases require an exact staging or master commit')
    if not re.fullmatch('[a-zA-Z0-9]{10,64}', application_uuid):
        raise ReleaseError('Set the target environment application UUID')
    verify_branch_head(ref, revision)
    application = api.request(f'/applications/{application_uuid}')
    domains = application.get('fqdn', '')
    if not isinstance(domains, str) or TARGETS[ref] not in {url.strip().rstrip('/') for url in domains.split(',')}:
        raise ReleaseError('Coolify application domains do not match the selected environment')
    if (application.get('uuid') != application_uuid
            or application.get('git_branch') != ref.removeprefix('refs/heads/')
            or application.get('build_pack') != 'dockerimage'
            or application.get('docker_registry_image_name') != IMAGE_NAME
            or not re.fullmatch('sha256-[a-f0-9]{64}', application.get('docker_registry_image_tag') or '')
            or application.get('health_check_path') != '/api/health/ready'
            or not application.get('health_check_enabled')
            or application.get('pre_deployment_command')
            or application.get('post_deployment_command')):
        raise ReleaseError('Coolify target does not match the guarded image deployment')
    variables = api.request(f'/applications/{application_uuid}/envs')
    if any(variable.get('key') in ('APP_VERSION', 'NEXT_BUILD_ID') and variable.get('is_runtime')
           for variable in variables):
        raise ReleaseError('Remove runtime version overrides so the image supplies its own commit')
    deployed = public.request('/api/health')
    if deployed.get('status') != 'healthy':
        raise ReleaseError('The current application is not healthy; investigate before releasing')
    desired_schema = schema_digest(revision)
    try:
        deployed_schema = schema_digest(deployed.get('version', ''))
    except ReleaseError as error:
        raise ReleaseError('Cannot verify the deployed source/schema; restore its commit version or fetch its history before releasing') from error
    if deployed_schema != desired_schema and approved_schema != desired_schema:
        raise ReleaseError('Database changes require an approved backup and migration before deployment')
    return application


def deploy(ref, revision, application_uuid, image, api, public, approved_schema=None):
    if not re.fullmatch(re.escape(IMAGE_NAME) + r'@sha256:[a-f0-9]{64}', image):
        raise ReleaseError('Only an immutable EmuReady image digest may be deployed')
    application = preflight(ref, revision, application_uuid, api, public, approved_schema)
    previous_image = f'{IMAGE_NAME}@sha256:{application["docker_registry_image_tag"].removeprefix("sha256-")}'
    print(f'Previous image: {previous_image}', flush=True)
    verify_branch_head(ref, revision)
    # Coolify restricts the deploy API's docker_tag override to preview deployments.
    api.request(f'/applications/{application_uuid}', 'PATCH', {
        'docker_registry_image_tag': image.split('@')[1].replace('sha256:', 'sha256-'),
        'git_commit_sha': revision,
    })
    queued = api.request('/deploy', 'POST', {'uuid': application_uuid, 'force': False})
    deployments = queued.get('deployments', [])
    if (len(deployments) != 1 or deployments[0].get('resource_uuid') != application_uuid
            or not re.fullmatch('[a-zA-Z0-9]{10,64}', deployments[0].get('deployment_uuid', ''))):
        raise ReleaseError('Coolify did not queue the requested application deployment')
    deployment_uuid = deployments[0]['deployment_uuid']
    print(f'Deployment {deployment_uuid}', flush=True)
    deadline = time.monotonic() + 900
    while time.monotonic() < deadline:
        try:
            deployment = api.request(f'/deployments/{deployment_uuid}')
        except ReleaseError as error:
            print(f'Deployment status unavailable: {error}; retrying', flush=True)
            time.sleep(10)
            continue
        status = deployment.get('status')
        if status == 'finished':
            break
        if status not in ('queued', 'in_progress'):
            raise ReleaseError(f'Coolify deployment ended with status {status}')
        time.sleep(10)
    else:
        raise ReleaseError('Timed out waiting for Coolify; inspect the deployment before retrying')
    last_error = 'No public health response received'
    for attempt in range(6):
        try:
            health = public.request('/api/health')
            ready = public.request('/api/health/ready')
            if not isinstance(health, dict) or not isinstance(ready, dict):
                raise ReleaseError('Expected public health responses to be JSON objects')
            failures = []
            if health.get('version') != revision:
                failures.append('release version differs from the expected commit')
            if health.get('status') != 'healthy':
                failures.append('liveness is not healthy')
            if ready.get('status') != 'healthy':
                failures.append('readiness is not healthy')
            if not failures:
                return deployment_uuid
            last_error = '; '.join(failures)
        except ReleaseError as error:
            last_error = str(error)
        if attempt < 5:
            time.sleep(10)
    raise ReleaseError(f'Deployment finished, but public readiness and release version did not match: {last_error}')


def main():
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--preflight', action='store_true')
    mode.add_argument('--image')
    mode.add_argument('--schema-digest', action='store_true')
    arguments = parser.parse_args()
    ref = os.environ.get('GITHUB_REF', '')
    revision = os.environ.get('GITHUB_SHA', '')
    if arguments.schema_digest:
        print(schema_digest(revision))
        return
    token = os.environ.get('COOLIFY_TOKEN', '')
    if ref not in TARGETS or not token:
        raise ReleaseError('Set the branch-scoped Coolify deployment credential')
    api = Client(COOLIFY_URL, token)
    public = Client(TARGETS[ref])
    application_uuid = os.environ.get('COOLIFY_APPLICATION_UUID', '')
    approved_schema = os.environ.get('CONTAINER_APPROVED_SCHEMA_DIGEST')
    if arguments.preflight:
        preflight(ref, revision, application_uuid, api, public, approved_schema)
        print('Release target, branch head and database compatibility verified')
    else:
        deployment_uuid = deploy(ref, revision, application_uuid, arguments.image, api, public, approved_schema)
        summary = f'\nDeployed `{revision}` as `{arguments.image}` through Coolify `{deployment_uuid}`.\n'
        if os.environ.get('GITHUB_STEP_SUMMARY'):
            with Path(os.environ['GITHUB_STEP_SUMMARY']).open('a') as output:
                output.write(summary)
        print(summary.strip())


if __name__ == '__main__':
    try:
        main()
    except ReleaseError as error:
        raise SystemExit(str(error)) from error

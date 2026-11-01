import subprocess
import unittest
from unittest.mock import patch

import container_deploy as release


REF = 'refs/heads/staging'
OLD = '1' * 40
REVISION = '2' * 40
UUID = 'jzfkmcmpz0xat15arcayharg'
DEPLOYMENT = 'testdeployment1234567890'
IMAGE = release.IMAGE_NAME + '@sha256:' + '3' * 64
SCHEMA_DIGEST = release.schema_digest


class FakeApi:
    def __init__(self):
        self.application = {
            'uuid': UUID,
            'git_branch': 'staging',
            'fqdn': 'https://staging.emuready.com',
            'build_pack': 'dockerimage',
            'docker_registry_image_name': release.IMAGE_NAME,
            'docker_registry_image_tag': 'sha256-' + '4' * 64,
            'health_check_path': '/api/health/ready',
            'health_check_enabled': True,
        }
        self.variables = []
        self.status = 'finished'
        self.poll_failures = 0
        self.calls = []

    def request(self, path, method='GET', payload=None):
        self.calls.append((path, method, payload))
        if method == 'PATCH':
            return {}
        if path == '/deploy':
            return {'deployments': [{'resource_uuid': UUID, 'deployment_uuid': DEPLOYMENT}]}
        if path == '/deployments/' + DEPLOYMENT:
            if self.poll_failures:
                self.poll_failures -= 1
                raise release.ReleaseError('GET request failed (HTTP 503)')
            return {'status': self.status}
        if path.endswith('/envs'):
            return self.variables
        return self.application


class FakePublic:
    def __init__(self):
        self.version = REVISION
        self.initial_version = OLD
        self.calls = 0

    def request(self, path):
        if path == '/api/health/ready':
            return {'status': 'healthy'}
        self.calls += 1
        return {'status': 'healthy', 'version': self.initial_version if self.calls == 1 else self.version}


class DeploymentTests(unittest.TestCase):
    def setUp(self):
        self.api = FakeApi()
        self.public = FakePublic()
        self.branch = patch.object(release, 'git', return_value=f'{REVISION}\t{REF}\n'.encode()).start()
        self.schema = patch.object(release, 'schema_digest', return_value='a' * 64).start()
        patch.object(release.time, 'sleep').start()
        self.addCleanup(patch.stopall)

    def deploy(self, image=IMAGE, approved_schema=None):
        return release.deploy(REF, REVISION, UUID, image, self.api, self.public, approved_schema)

    def assert_no_writes(self):
        self.assertTrue(all(method == 'GET' for _, method, _ in self.api.calls))

    def test_deploys_exact_digest_only_after_preflight_and_checks_public_version(self):
        self.assertEqual(self.deploy(), DEPLOYMENT)
        self.assertEqual(self.api.calls[2], ('/applications/' + UUID, 'PATCH', {
            'docker_registry_image_tag': 'sha256-' + '3' * 64,
            'git_commit_sha': REVISION,
        }))
        self.assertEqual(self.api.calls[3], ('/deploy', 'POST', {'uuid': UUID, 'force': False}))
        self.assertEqual(self.public.calls, 2)

    def test_rejects_mutable_tags_before_contacting_coolify(self):
        with self.assertRaisesRegex(release.ReleaseError, 'immutable'):
            self.deploy(release.IMAGE_NAME + ':latest')
        self.assertEqual(self.api.calls, [])

    def test_rejects_a_stale_build_without_mutation(self):
        self.branch.return_value = f'{OLD}\t{REF}\n'.encode()
        with self.assertRaisesRegex(release.ReleaseError, 'Branch advanced'):
            self.deploy()
        self.assertEqual(self.api.calls, [])

    def test_rechecks_branch_after_preflight_before_any_mutation(self):
        self.branch.side_effect = [f'{REVISION}\t{REF}\n'.encode(), f'{OLD}\t{REF}\n'.encode()]
        with self.assertRaisesRegex(release.ReleaseError, 'Branch advanced'):
            self.deploy()
        self.assert_no_writes()
        self.assertEqual(self.branch.call_count, 2)

    def test_rejects_wrong_environment_without_mutation(self):
        self.api.application['git_branch'] = 'master'
        with self.assertRaisesRegex(release.ReleaseError, 'target'):
            self.deploy()
        self.assert_no_writes()

    def test_rejects_deployment_commands_without_mutation(self):
        for key in ('pre_deployment_command', 'post_deployment_command'):
            with self.subTest(key=key):
                self.api.application[key] = 'pnpm db:migrate:deploy'
                with self.assertRaisesRegex(release.ReleaseError, 'target'):
                    self.deploy()
                self.assert_no_writes()
                self.api.application.pop(key)

    def test_rejects_non_object_health_json_before_mutation(self):
        for response in ([], None, False, 'healthy'):
            with self.subTest(response=response):
                with patch.object(self.public, 'request', return_value=response):
                    with self.assertRaisesRegex(release.ReleaseError, 'not healthy'):
                        self.deploy()
                self.assert_no_writes()
                self.schema.assert_not_called()

    def test_rejects_the_wrong_public_domain_without_mutation(self):
        self.api.application['fqdn'] = 'https://www.emuready.com'
        with self.assertRaisesRegex(release.ReleaseError, 'domains'):
            self.deploy()
        self.assert_no_writes()

    def test_accepts_whitespace_between_configured_domains(self):
        self.api.application['fqdn'] = 'https://other.example, https://staging.emuready.com/ '
        self.assertEqual(self.deploy(), DEPLOYMENT)

    def test_rejects_a_null_image_selection_without_mutation(self):
        self.api.application['docker_registry_image_tag'] = None
        with self.assertRaisesRegex(release.ReleaseError, 'target'):
            self.deploy()
        self.assert_no_writes()

    def test_master_uses_the_production_application(self):
        ref = 'refs/heads/master'
        self.branch.return_value = f'{REVISION}\t{ref}\n'.encode()
        self.api.application.update(git_branch='master', fqdn='https://www.emuready.com,https://emuready.com')
        self.assertEqual(release.deploy(ref, REVISION, UUID, IMAGE, self.api, self.public), DEPLOYMENT)

    def test_rejects_an_old_runtime_version_override(self):
        self.api.variables = [{'key': 'APP_VERSION', 'is_runtime': True}]
        with self.assertRaisesRegex(release.ReleaseError, 'version overrides'):
            self.deploy()
        self.assert_no_writes()

    def test_schema_changes_require_an_exact_approved_digest(self):
        self.schema.side_effect = lambda revision: ('a' if revision == REVISION else 'b') * 64
        with self.assertRaisesRegex(release.ReleaseError, 'Database changes'):
            self.deploy(approved_schema='outdated-approval')
        self.assert_no_writes()
        self.public.calls = 0
        self.assertEqual(self.deploy(approved_schema='a' * 64), DEPLOYMENT)

    def test_failed_coolify_deployment_does_not_count_as_success(self):
        self.api.status = 'failed'
        with self.assertRaisesRegex(release.ReleaseError, 'status failed'):
            self.deploy()
        self.assertEqual(self.public.calls, 1)

    def test_retries_a_transient_status_read_without_queuing_another_deployment(self):
        self.api.poll_failures = 1
        self.assertEqual(self.deploy(), DEPLOYMENT)
        self.assertEqual(sum(path == '/deploy' for path, _, _ in self.api.calls), 1)
        self.assertEqual(sum(path == '/deployments/' + DEPLOYMENT for path, _, _ in self.api.calls), 2)

    def test_status_read_failures_remain_bounded_by_the_deadline(self):
        self.api.poll_failures = 1
        with patch.object(release.time, 'monotonic', side_effect=[0, 0, 901]):
            with self.assertRaisesRegex(release.ReleaseError, 'Timed out waiting'):
                self.deploy()
        self.assertEqual(sum(path == '/deploy' for path, _, _ in self.api.calls), 1)

    def test_schema_approval_does_not_bypass_an_unknown_live_source_commit(self):
        self.public.initial_version = '0.0.0'
        self.schema.side_effect = lambda revision: 'a' * 64 if revision == REVISION else SCHEMA_DIGEST(revision)
        with self.assertRaisesRegex(release.ReleaseError, 'Cannot verify the deployed source/schema'):
            self.deploy(approved_schema='a' * 64)
        self.assert_no_writes()

    def test_old_healthy_public_release_does_not_count_as_success(self):
        self.public.version = OLD
        with self.assertRaisesRegex(release.ReleaseError, 'release version did not match'):
            self.deploy()

    def test_retries_non_object_health_json_without_repeating_the_deployment(self):
        healthy = {'status': 'healthy'}
        responses = [{**healthy, 'version': OLD}, [], healthy, {**healthy, 'version': REVISION}, healthy]
        with patch.object(self.public, 'request', side_effect=responses):
            self.assertEqual(self.deploy(), DEPLOYMENT)
        self.assertEqual(sum(path == '/deploy' for path, _, _ in self.api.calls), 1)

    def test_includes_the_last_transport_failure_in_the_readiness_error(self):
        responses = [{'status': 'healthy', 'version': OLD}]
        responses += [release.ReleaseError('GET request failed (HTTP 503)') for _ in range(6)]
        with patch.object(self.public, 'request', side_effect=responses):
            with self.assertRaisesRegex(release.ReleaseError, 'HTTP 503'):
                self.deploy()

    def test_includes_the_failed_health_gate_without_echoing_response_data(self):
        responses = [{'status': 'healthy', 'version': OLD}]
        responses += [{'status': 'healthy', 'version': REVISION}, {'status': 'private-upstream-detail'}] * 6
        with patch.object(self.public, 'request', side_effect=responses):
            with self.assertRaises(release.ReleaseError) as result:
                self.deploy()
        self.assertIn('readiness is not healthy', str(result.exception))
        self.assertNotIn('private-upstream-detail', str(result.exception))

    def test_transport_keeps_credentials_out_of_process_arguments_and_does_not_follow_redirects(self):
        result = subprocess.CompletedProcess([], 0, stdout='{}\n200', stderr='')
        with patch.object(release.subprocess, 'run', return_value=result) as run:
            release.Client(release.COOLIFY_URL, 'private-test-token').request('/applications/' + UUID)
        args = run.call_args.args[0]
        self.assertNotIn('private-test-token', ' '.join(args))
        self.assertNotIn('--location', args)
        self.assertEqual(args[1], '--disable')
        self.assertIn('Authorization: Bearer private-test-token', run.call_args.kwargs['input'])

    def test_transport_rejects_redirects_without_retrying_a_deploy(self):
        result = subprocess.CompletedProcess([], 0, stdout='redirect\n302', stderr='')
        with patch.object(release.subprocess, 'run', return_value=result) as run:
            with self.assertRaisesRegex(release.ReleaseError, 'HTTP 302'):
                release.Client(release.COOLIFY_URL, 'private-test-token').request('/deploy', 'POST', {'uuid': UUID})
        self.assertEqual(run.call_count, 1)

    def test_schema_digest_changes_with_migration_contents(self):
        paths = b'prisma/schema.prisma\0prisma/migrations/one/migration.sql\0'
        with patch.object(release, 'git', side_effect=[paths, b'SELECT 1;', b'model User {}']):
            before = SCHEMA_DIGEST(REVISION)
        with patch.object(release, 'git', side_effect=[paths, b'SELECT 2;', b'model User {}']):
            after = SCHEMA_DIGEST(REVISION)
        self.assertNotEqual(before, after)


if __name__ == '__main__':
    unittest.main()

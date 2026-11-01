from pathlib import Path
import unittest

from container_build_config import build_arguments


DOCKERFILE = (Path(__file__).resolve().parent.parent / 'Dockerfile').read_text()
STAGING = {
    'NEXT_PUBLIC_APP_URL': 'https://staging.emuready.com',
    'NEXT_PUBLIC_APP_ENV': 'staging',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY': 'pk_test_c3RhZ2luZy5leGFtcGxlLmNvbSQ=',
}
PRODUCTION = {
    'NEXT_PUBLIC_APP_URL': 'https://www.emuready.com',
    'NEXT_PUBLIC_APP_ENV': 'production',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY': 'pk_live_cHJvZHVjdGlvbi5leGFtcGxlLmNvbSQ=',
}


class ContainerBuildConfigTest(unittest.TestCase):
    def test_accepts_each_branch_configuration(self):
        for branch, config in [('master', PRODUCTION), ('staging', STAGING)]:
            with self.subTest(branch=branch):
                args = build_arguments(config, 'refs/heads/' + branch, DOCKERFILE)
                self.assertEqual(set(args[1::2]), {f'{key}={value}' for key, value in config.items()})
                self.assertEqual(len(args), 2 * len(config))
                self.assertEqual(args.count('--build-arg'), len(config))

    def test_rejects_individual_cross_environment_values(self):
        for branch, expected, other in [('master', PRODUCTION, STAGING), ('staging', STAGING, PRODUCTION)]:
            for key in expected:
                with self.subTest(branch=branch, key=key):
                    with self.assertRaises(ValueError):
                        build_arguments({**expected, key: other[key]}, 'refs/heads/' + branch, DOCKERFILE)

    def test_rejects_omitted_clerk_key(self):
        config = STAGING.copy()
        config.pop('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')
        with self.assertRaises(ValueError):
            build_arguments(config, 'refs/heads/staging', DOCKERFILE)

    def test_rejects_empty_or_prefix_only_key(self):
        for key in ('', 'pk_test_'):
            with self.subTest(key=key):
                with self.assertRaises(ValueError):
                    build_arguments({**STAGING, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY': key}, 'refs/heads/staging', DOCKERFILE)

    def test_rejects_secret_and_undeclared_arguments(self):
        for key in ('DATABASE_URL', 'BUILD_DATABASE_URL', 'CLERK_SECRET_KEY', 'NEXT_PUBLIC_UNKNOWN'):
            with self.subTest(key=key):
                with self.assertRaises(ValueError):
                    build_arguments({**STAGING, key: 'value'}, 'refs/heads/staging', DOCKERFILE)

    def test_rejects_surrounding_whitespace_in_clerk_key(self):
        for prefix, suffix in [(' ', ''), ('', ' '), ('\t', ''), ('', '\t')]:
            with self.subTest(prefix=prefix, suffix=suffix):
                with self.assertRaises(ValueError):
                    build_arguments({**STAGING, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY': prefix + STAGING['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'] + suffix}, 'refs/heads/staging', DOCKERFILE)

    def test_rejects_non_object_and_unsafe_values(self):
        for config in ([], None, {**STAGING, 'NEXT_PUBLIC_APP_URL': False},
                       *({**STAGING, 'NEXT_PUBLIC_APP_URL': STAGING['NEXT_PUBLIC_APP_URL'] + char} for char in '\r\n\0')):
            with self.subTest(config=config):
                with self.assertRaises(ValueError):
                    build_arguments(config, 'refs/heads/staging', DOCKERFILE)

    def test_rejects_other_branches(self):
        with self.assertRaises(ValueError):
            build_arguments(STAGING, 'refs/heads/feature', DOCKERFILE)

    def test_keeps_shell_metacharacters_in_a_single_argument(self):
        value = 'spaces $(echo test); *'
        args = build_arguments({**STAGING, 'NEXT_PUBLIC_DISCORD_LINK': value}, 'refs/heads/staging', DOCKERFILE)
        self.assertIn('NEXT_PUBLIC_DISCORD_LINK=' + value, args)


if __name__ == '__main__':
    unittest.main()

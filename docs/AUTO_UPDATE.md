# PROMETHEUS Android automatic updates

## What is implemented

PROMETHEUS checks a signed update manifest every six hours and on the normal app startup path when a check is due. If a newer release exists, the app downloads it, verifies SHA-256, verifies the package name and version code, and hands it to Android's package installer.

The update manifest is hosted at the repository's raw GitHub main-branch URL. The release publisher creates signed APK releases and updates that manifest automatically after a production release.

## Critical limitation

Android does not allow a normal third-party application to silently replace itself. A sideloaded PROMETHEUS build can automate discovery, download, integrity checks, and opening the installer, but Android may still require the user to approve the installation. This is intentional platform security.

For Google Play distribution, PROMETHEUS should use Google Play In-App Updates instead.

## One-time signing setup

Automatic APK updates require every production build to use the same signing key. Create one production keystore and keep the private key out of Git.

Add these repository Actions secrets:

- PROMETHEUS_KEYSTORE_BASE64
- PROMETHEUS_KEYSTORE_PASSWORD
- PROMETHEUS_KEY_ALIAS
- PROMETHEUS_KEY_PASSWORD

The first APK installed on a device must also be signed with this key. If an APK was previously installed using a different key, Android will reject a replacement signed by the production key.

## Release behavior

Every main push that changes application code can publish a new production release when the four signing secrets are present. The generated version code is monotonically increasing from the GitHub Actions run number, and the release APK plus SHA-256 digest are published to GitHub Releases.

The generated update.json commit is excluded from both the debug build workflow and the release publisher workflow, preventing an update-manifest feedback loop.

## Verification

Do not call the updater complete until this sequence passes:

1. Install a production-signed PROMETHEUS APK.
2. Push a real application change.
3. Confirm the publisher workflow succeeds.
4. Confirm a new GitHub Release contains prometheus-release.apk.
5. Confirm update.json contains the new version and SHA-256.
6. Launch the older app.
7. Confirm the update is downloaded and its checksum/package/version checks pass.
8. Complete Android's installer approval if the device requests it.
9. Relaunch PROMETHEUS and verify the new version.
10. Repeat once more to prove consecutive updates work.

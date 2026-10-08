package org.crowncouncil.prometheus;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import android.widget.Toast;
import androidx.core.content.FileProvider;
import org.json.JSONObject;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class UpdateManager {
    private static final String MANIFEST_URL =
        "https://raw.githubusercontent.com/masudurrahman-ds/prometheus-microgravity/main/update/update.json";
    private static final String PROVIDER_AUTHORITY = "org.crowncouncil.prometheus.files";
    private static final long CHECK_INTERVAL_MS = 6L * 60L * 60L * 1000L;
    private static final int CONNECT_TIMEOUT_MS = 10000;
    private static final int READ_TIMEOUT_MS = 20000;
    private final Activity activity;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private volatile boolean checking;

    public UpdateManager(Activity activity) { this.activity = activity; }

    public void checkIfDue() {
        long last = activity.getPreferences(Activity.MODE_PRIVATE)
            .getLong("prometheus_update_check", 0L);
        if (System.currentTimeMillis() - last < CHECK_INTERVAL_MS) return;
        activity.getPreferences(Activity.MODE_PRIVATE).edit()
            .putLong("prometheus_update_check", System.currentTimeMillis()).apply();
        checkNow();
    }

    public void checkNow() {
        if (checking) return;
        checking = true;
        executor.execute(() -> {
            try {
                JSONObject manifest = fetchJson(MANIFEST_URL);
                if (!manifest.optBoolean("enabled", false)) return;
                String packageName = manifest.optString("package_name", "");
                String apkUrl = manifest.optString("apk_url", "");
                String sha256 = manifest.optString("sha256", "").toLowerCase();
                long remoteVersion = manifest.optLong("version_code", 0L);
                String remoteName = manifest.optString("version_name", "");
                if (!activity.getPackageName().equals(packageName)
                        || remoteVersion <= getCurrentVersionCode()
                        || !apkUrl.startsWith("https://")
                        || !apkUrl.toLowerCase().endsWith(".apk")
                        || sha256.length() != 64) return;
                File apk = downloadApk(apkUrl, sha256);
                verifyPackage(apk, remoteVersion, packageName);
                activity.runOnUiThread(() -> installApk(apk, remoteName));
            } catch (Exception ignored) {
                // Update failures must never block normal PROMETHEUS startup.
            } finally {
                checking = false;
            }
        });
    }

    private long getCurrentVersionCode() {
        try {
            PackageInfo info = activity.getPackageManager().getPackageInfo(activity.getPackageName(), 0);
            return Build.VERSION.SDK_INT >= 28 ? info.getLongVersionCode() : info.versionCode;
        } catch (Exception e) { return 0L; }
    }

    private JSONObject fetchJson(String endpoint) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(endpoint).openConnection();
        c.setConnectTimeout(CONNECT_TIMEOUT_MS);
        c.setReadTimeout(READ_TIMEOUT_MS);
        c.setRequestProperty("Accept", "application/json");
        c.setRequestProperty("User-Agent", "PROMETHEUS-Updater");
        try (InputStream in = c.getInputStream()) { return new JSONObject(readAll(in)); }
        finally { c.disconnect(); }
    }

    private File downloadApk(String endpoint, String expectedSha256) throws Exception {
        File dir = new File(activity.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "updates");
        if (!dir.exists() && !dir.mkdirs()) throw new IOException("Cannot create update directory");
        File apk = new File(dir, "prometheus-update.apk");
        HttpURLConnection c = (HttpURLConnection) new URL(endpoint).openConnection();
        c.setConnectTimeout(CONNECT_TIMEOUT_MS);
        c.setReadTimeout(READ_TIMEOUT_MS);
        c.setRequestProperty("User-Agent", "PROMETHEUS-Updater");
        try (InputStream in = c.getInputStream(); FileOutputStream out = new FileOutputStream(apk)) {
            byte[] buffer = new byte[8192]; int n;
            while ((n = in.read(buffer)) != -1) out.write(buffer, 0, n);
        } finally { c.disconnect(); }
        if (!expectedSha256.equalsIgnoreCase(sha256(apk))) {
            //noinspection ResultOfMethodCallIgnored
            apk.delete();
            throw new SecurityException("PROMETHEUS update checksum mismatch");
        }
        return apk;
    }

    private void verifyPackage(File apk, long expectedVersion, String expectedPackage) throws Exception {
        PackageManager pm = activity.getPackageManager();
        PackageInfo info = pm.getPackageArchiveInfo(apk.getAbsolutePath(), 0);
        if (info == null || !expectedPackage.equals(info.packageName))
            throw new SecurityException("Downloaded APK package mismatch");
        long version = Build.VERSION.SDK_INT >= 28 ? info.getLongVersionCode() : info.versionCode;
        if (version != expectedVersion || version <= getCurrentVersionCode())
            throw new SecurityException("Downloaded APK version mismatch");
    }

    private void installApk(File apk, String versionName) {
        if (Build.VERSION.SDK_INT >= 26 && !activity.getPackageManager().canRequestPackageInstalls()) {
            Toast.makeText(activity,
                "PROMETHEUS update ready. Allow installs from this app to continue.",
                Toast.LENGTH_LONG).show();
            activity.startActivity(new Intent(
                Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                Uri.parse("package:" + activity.getPackageName())));
            return;
        }
        Uri uri = FileProvider.getUriForFile(activity, PROVIDER_AUTHORITY, apk);
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(uri, "application/vnd.android.package-archive");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        activity.startActivity(intent);
    }

    private static String sha256(File file) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (InputStream in = new FileInputStream(file)) {
            byte[] buffer = new byte[8192]; int n;
            while ((n = in.read(buffer)) != -1) digest.update(buffer, 0, n);
        }
        StringBuilder out = new StringBuilder();
        for (byte b : digest.digest()) out.append(String.format("%02x", b));
        return out.toString();
    }

    private static String readAll(InputStream in) throws Exception {
        StringBuilder out = new StringBuilder();
        byte[] buffer = new byte[4096]; int n;
        while ((n = in.read(buffer)) != -1) out.append(new String(buffer, 0, n, "UTF-8"));
        return out.toString();
    }
}

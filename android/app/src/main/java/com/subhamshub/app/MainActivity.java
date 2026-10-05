package com.subhamshub.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // FIX: our own plugin must be registered BEFORE super.onCreate().
        // Without this line the JavaScript could never call TruecallerBanner.
        registerPlugin(BannerPlugin.class);

        super.onCreate(savedInstanceState);

        askOverlayPermissionOnce();
    }

    // Before: the phone Settings page opened on EVERY app start while the permission was off,
    // even on top of an incoming call screen. Now it asks only one time.
    // (Phase 2 will add a proper permissions screen with buttons.)
    private void askOverlayPermissionOnce() {
        // Never open Settings on top of an incoming call
        Intent launchIntent = getIntent();
        if (launchIntent != null && launchIntent.getBooleanExtra(CallNotifier.EXTRA_FROM_CALL, false)) {
            return;
        }

        if (Settings.canDrawOverlays(this)) {
            return;
        }

        SharedPreferences prefs = getSharedPreferences("subhams_prefs", MODE_PRIVATE);
        if (prefs.getBoolean("overlay_asked", false)) {
            return;
        }
        prefs.edit().putBoolean("overlay_asked", true).apply();

        Intent intent = new Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + getPackageName())
        );
        startActivity(intent);
    }
}
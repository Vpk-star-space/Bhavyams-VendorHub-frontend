package com.subhamshub.app;

import android.content.Intent;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "TruecallerBanner")
public class BannerPlugin extends Plugin {

    // Runs once when the app starts: make sure the call notification channel exists
    @Override
    public void load() {
        CallNotifier.ensureChannel(getContext());
    }

    // Overlay popup (needs "Display over other apps" permission).
    // JS: TruecallerBanner.showBanner({ title, body, roomId, callerName, type })
    @PluginMethod
    public void showBanner(PluginCall call) {
        if (!Settings.canDrawOverlays(getContext())) {
            call.reject("Overlay permission is OFF. Turn on 'Display over other apps' for Subhams Hub.");
            return;
        }

        String title = call.getString("title", "Urgent Alert");
        String body = call.getString("body", "Incoming...");

        Intent intent = new Intent(getContext(), BannerService.class);
        intent.putExtra("title", title);
        intent.putExtra("body", body);
        intent.putExtra("roomId", call.getString("roomId"));
        intent.putExtra("callerName", call.getString("callerName"));
        intent.putExtra("type", call.getString("type"));
        getContext().startService(intent);

        call.resolve();
    }

    // The app was CLOSED and was opened by tapping the call banner.
    // React asks "was I opened by a call?" and gets the call data here.
    @PluginMethod
    public void getPendingCall(PluginCall call) {
        JSObject result = new JSObject();
        Intent intent = (getActivity() != null) ? getActivity().getIntent() : null;

        if (intent != null && intent.getBooleanExtra(CallNotifier.EXTRA_FROM_CALL, false)) {
            result.put("hasCall", true);
            result.put("roomId", intent.getStringExtra(CallNotifier.EXTRA_ROOM_ID));
            result.put("callerName", intent.getStringExtra(CallNotifier.EXTRA_CALLER_NAME));
            result.put("type", intent.getStringExtra(CallNotifier.EXTRA_TYPE));
            // Use it only once, so the call screen does not open again and again
            intent.removeExtra(CallNotifier.EXTRA_FROM_CALL);
        } else {
            result.put("hasCall", false);
        }
        call.resolve(result);
    }

    // The app was already RUNNING (background) and the banner was tapped.
    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);

        if (intent != null && intent.getBooleanExtra(CallNotifier.EXTRA_FROM_CALL, false)) {
            JSObject data = new JSObject();
            data.put("hasCall", true);
            data.put("roomId", intent.getStringExtra(CallNotifier.EXTRA_ROOM_ID));
            data.put("callerName", intent.getStringExtra(CallNotifier.EXTRA_CALLER_NAME));
            data.put("type", intent.getStringExtra(CallNotifier.EXTRA_TYPE));
            notifyListeners("incomingCall", data, true);
        }
    }
}
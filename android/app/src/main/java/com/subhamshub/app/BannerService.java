package com.subhamshub.app;

import android.app.Service;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.provider.Settings;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;

public class BannerService extends Service {

    private static final String TAG = "SubhamsBanner";
    private static final long AUTO_DISMISS_MS = 30000; // closes by itself after 30 seconds

    private WindowManager windowManager;
    private View bannerView;
    private Ringtone ringtone;
    private Vibrator vibrator;
    private final Handler handler = new Handler(Looper.getMainLooper());

    @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (!Settings.canDrawOverlays(this)) {
            Log.w(TAG, "Overlay permission is OFF, popup not shown");
            stopSelf();
            return START_NOT_STICKY;
        }

        if (bannerView != null) {
            return START_NOT_STICKY;
        }

        // Data sent by BannerPlugin.showBanner()
        final String titleText = (intent != null) ? intent.getStringExtra("title") : null;
        final String bodyText = (intent != null) ? intent.getStringExtra("body") : null;
        final String roomId = (intent != null) ? intent.getStringExtra("roomId") : null;
        final String callerName = (intent != null) ? intent.getStringExtra("callerName") : null;
        final String type = (intent != null) ? intent.getStringExtra("type") : null;

        // 1. Sound and vibration
        try {
            Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            if (alarmUri == null) {
                alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            }
            ringtone = RingtoneManager.getRingtone(getApplicationContext(), alarmUri);
            if (ringtone != null) ringtone.play();

            vibrator = (Vibrator) getSystemService(VIBRATOR_SERVICE);
            if (vibrator != null) {
                long[] pattern = {0, 1000, 500, 1000};
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
                } else {
                    vibrator.vibrate(pattern, 0);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Sound or vibration failed", e);
        }

        // 2. The Truecaller-style card
        try {
            windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
            bannerView = LayoutInflater.from(this).inflate(R.layout.truecaller_banner, null);

            WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                    WindowManager.LayoutParams.MATCH_PARENT,
                    WindowManager.LayoutParams.WRAP_CONTENT,
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                            | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
                            | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                            | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON,
                    PixelFormat.TRANSLUCENT
            );
            params.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
            params.x = 0;
            params.y = (int) (40 * getResources().getDisplayMetrics().density); // 40dp from the top

            if (titleText != null) ((TextView) bannerView.findViewById(R.id.banner_title)).setText(titleText);
            if (bodyText != null) ((TextView) bannerView.findViewById(R.id.banner_body)).setText(bodyText);

            // Tap the card or the green Answer button: open the app (call screen if we have a room)
            View.OnClickListener openApp = v -> openApp(roomId, callerName, type);
            bannerView.findViewById(R.id.banner_container).setOnClickListener(openApp);
            bannerView.findViewById(R.id.btn_answer).setOnClickListener(openApp);

            // Red Decline button and the X: just close the popup
            bannerView.findViewById(R.id.btn_decline).setOnClickListener(v -> stopSelf());
            bannerView.findViewById(R.id.btn_close).setOnClickListener(v -> stopSelf());

            windowManager.addView(bannerView, params);

            handler.postDelayed(() -> stopSelf(), AUTO_DISMISS_MS);
        } catch (Exception e) {
            Log.e(TAG, "Could not show the popup", e);
            bannerView = null;
            stopSelf();
        }

        return START_NOT_STICKY;
    }

    private void openApp(String roomId, String callerName, String type) {
        Intent appIntent = new Intent(this, MainActivity.class);
        appIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                | Intent.FLAG_ACTIVITY_SINGLE_TOP
                | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        // If this popup is for a call, hand the call data to the React app
        if (roomId != null && !roomId.isEmpty()) {
            appIntent.putExtra(CallNotifier.EXTRA_FROM_CALL, true);
            appIntent.putExtra(CallNotifier.EXTRA_ROOM_ID, roomId);
            appIntent.putExtra(CallNotifier.EXTRA_CALLER_NAME, callerName == null ? "Subhams Hub" : callerName);
            appIntent.putExtra(CallNotifier.EXTRA_TYPE, type == null ? "voice_call" : type);
        }

        startActivity(appIntent);
        stopSelf();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        handler.removeCallbacksAndMessages(null);

        try {
            if (ringtone != null && ringtone.isPlaying()) {
                ringtone.stop();
            }
            if (vibrator != null) {
                vibrator.cancel();
            }
        } catch (Exception e) {
            Log.e(TAG, "Could not stop sound or vibration", e);
        }

        try {
            if (bannerView != null && windowManager != null) {
                windowManager.removeView(bannerView);
            }
        } catch (Exception e) {
            Log.e(TAG, "Could not remove the popup", e);
        }
        bannerView = null;
    }
}
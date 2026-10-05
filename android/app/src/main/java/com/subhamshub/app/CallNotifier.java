package com.subhamshub.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import androidx.core.app.NotificationCompat;

/**
 * NEW FILE. Shows the top banner (heads-up) and the lock-screen call notification.
 * Used by SubhamsFirebaseService (push while app is closed) and BannerPlugin.
 */
public class CallNotifier {

    private static final String TAG = "SubhamsCall";

    // New channel id. Android never changes the sound of an old channel,
    // so a new id is the only way to make the new sound/vibration settings work.
    public static final String CHANNEL_ID = "subhams_calls_v2";
    public static final int NOTIFICATION_ID = 999;
    private static final long TIMEOUT_MS = 30000; // banner disappears after 30 seconds

    // Keys used to pass the call data from Java to the React app
    public static final String EXTRA_FROM_CALL = "subhams_from_call";
    public static final String EXTRA_ROOM_ID = "subhams_room_id";
    public static final String EXTRA_CALLER_NAME = "subhams_caller_name";
    public static final String EXTRA_TYPE = "subhams_type";

    private CallNotifier() {}

    public static void ensureChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        // Remove the old channels made by earlier versions of the app
        nm.deleteNotificationChannel("subhams_call_channel");
        nm.deleteNotificationChannel("subhams-urgent-alerts");

        if (nm.getNotificationChannel(CHANNEL_ID) != null) return;

        Uri ringtone = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
        AudioAttributes audio = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();

        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Incoming Calls & Urgent Orders",
                NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Incoming call and urgent order alerts");
        channel.enableVibration(true);
        channel.setVibrationPattern(new long[]{0, 1000, 500, 1000, 500, 1000});
        channel.setSound(ringtone, audio);
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(channel);
    }

    public static void show(Context context, String title, String body,
                            String roomId, String type, String callerName) {
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) {
            Log.e(TAG, "NotificationManager is null, cannot show the banner");
            return;
        }

        if (!nm.areNotificationsEnabled()) {
            Log.w(TAG, "Notifications are OFF for this app. Turn them on in phone Settings > Apps > Subhams Hub.");
        }

        ensureChannel(context);

        // Tapping the banner (or the lock-screen call screen) opens MainActivity with the call data
        Intent intent = new Intent(context, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                | Intent.FLAG_ACTIVITY_SINGLE_TOP
                | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra(EXTRA_FROM_CALL, true);
        intent.putExtra(EXTRA_ROOM_ID, roomId == null ? "" : roomId);
        intent.putExtra(EXTRA_CALLER_NAME, callerName == null ? "Subhams Hub" : callerName);
        intent.putExtra(EXTRA_TYPE, type == null ? "voice_call" : type);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Uri ringtone = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.sym_call_incoming)
                .setColor(Color.parseColor("#2563EB"))
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setFullScreenIntent(pendingIntent, true) // wakes a locked phone
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .setTimeoutAfter(TIMEOUT_MS)
                .setSound(ringtone)                       // only used on Android 7
                .setVibrate(new long[]{0, 1000, 500, 1000});

        Notification notification = builder.build();
        notification.flags |= Notification.FLAG_INSISTENT; // repeat the sound until tapped or timeout

        nm.notify(NOTIFICATION_ID, notification);
        Log.d(TAG, "Banner shown: " + title);
    }

    public static void cancel(Context context) {
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.cancel(NOTIFICATION_ID);
    }
}
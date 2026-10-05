package com.subhamshub.app;

import android.util.Log;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

public class SubhamsFirebaseService extends FirebaseMessagingService {

    private static final String TAG = "SubhamsFCM";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        Map<String, String> data = remoteMessage.getData();
        Log.d(TAG, "Push received. data=" + data);

        if (data.isEmpty()) {
            Log.d(TAG, "Push has no data, ignored");
            return;
        }

        String type = data.get("type");
        String action = data.get("action");
        String callerName = data.get("callerName");
        String roomId = data.get("roomId");
        String title = data.get("title");
        String body = data.get("body");

        if (title == null) title = (callerName != null) ? callerName : "Subhams Urgent Call";
        if (body == null) body = "Incoming order call... Tap to answer.";

        // Calls, orders and urgent alerts
        if ("voice_call".equals(type) || "urgent".equals(type) || "INCOMING_CALL".equals(action)) {
            CallNotifier.show(this, title, body, roomId, type, callerName);
        } else {
            Log.d(TAG, "Push type not handled: type=" + type + " action=" + action);
        }
    }

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        // The app sends the newest token to the server every time it is opened.
        Log.d(TAG, "FCM token was refreshed");
    }
}
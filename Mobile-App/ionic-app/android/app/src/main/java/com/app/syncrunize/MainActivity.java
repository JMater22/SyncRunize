package com.app.syncrunize;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        createNotificationChannels();
    }

    /**
     * Creates notification channels for push notifications.
     * Required for Android 8.0 (API level 26) and above.
     * Channel ID must match the backend configuration: "syncrunize-alerts"
     */
    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Channel for hazard and traffic alerts
            CharSequence name = "Hazard & Traffic Alerts";
            String description = "Real-time notifications for nearby hazards, traffic, and safety alerts while running";
            int importance = NotificationManager.IMPORTANCE_HIGH;

            NotificationChannel alertChannel = new NotificationChannel(
                "syncrunize-alerts",
                name,
                importance
            );

            alertChannel.setDescription(description);
            alertChannel.enableVibration(true);
            alertChannel.enableLights(true);
            alertChannel.setShowBadge(true);
            // Vibration pattern: wait 0ms, vibrate 200ms, wait 100ms, vibrate 200ms
            alertChannel.setVibrationPattern(new long[]{0, 200, 100, 200});

            // Channel for general app notifications (likes, comments, challenges)
            CharSequence generalName = "App Notifications";
            String generalDescription = "Notifications for likes, comments, challenges, and social interactions";
            int generalImportance = NotificationManager.IMPORTANCE_DEFAULT;

            NotificationChannel generalChannel = new NotificationChannel(
                "syncrunize-general",
                generalName,
                generalImportance
            );

            generalChannel.setDescription(generalDescription);
            generalChannel.enableVibration(true);
            generalChannel.setShowBadge(true);

            // Register channels with the system
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(alertChannel);
                notificationManager.createNotificationChannel(generalChannel);

                android.util.Log.d("MainActivity", "Notification channels created successfully");
            }
        }
    }
}

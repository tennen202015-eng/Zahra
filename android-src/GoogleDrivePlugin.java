package com.zahra.tracker;

import android.app.Activity;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.identity.AuthorizationRequest;
import com.google.android.gms.auth.api.identity.AuthorizationResult;
import com.google.android.gms.auth.api.identity.Identity;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.common.api.Scope;
import java.util.Arrays;

/**
 * Asks Google for an access token limited to the app's private Drive folder (drive.appdata) and the account email.
 * No device permission is involved; Google shows its own account and consent screen.
 */
@CapacitorPlugin(name = "GoogleDrive")
public class GoogleDrivePlugin extends Plugin {
    private ActivityResultLauncher<IntentSenderRequest> launcher;
    private PluginCall pending;

    private AuthorizationRequest request() {
        return AuthorizationRequest.builder()
            .setRequestedScopes(Arrays.asList(
                new Scope("https://www.googleapis.com/auth/drive.appdata"),
                new Scope("email")))
            .build();
    }

    @Override
    public void load() {
        launcher = getActivity().registerForActivityResult(
            new ActivityResultContracts.StartIntentSenderForResult(),
            res -> {
                PluginCall call = pending;
                pending = null;
                if (call == null) return;
                if (res.getResultCode() != Activity.RESULT_OK) { call.reject("Sign-in cancelled", "CANCELLED"); return; }
                try {
                    AuthorizationResult ar = Identity.getAuthorizationClient(getActivity()).getAuthorizationResultFromIntent(res.getData());
                    resolve(call, ar);
                } catch (ApiException e) {
                    call.reject(e.getMessage(), "ERR_" + e.getStatusCode());
                }
            });
    }

    private void resolve(PluginCall call, AuthorizationResult ar) {
        if (ar.getAccessToken() == null) { call.reject("No access token", "NO_TOKEN"); return; }
        JSObject o = new JSObject();
        o.put("accessToken", ar.getAccessToken());
        call.resolve(o);
    }

    @PluginMethod
    public void authorize(PluginCall call) {
        final boolean interactive = call.getBoolean("interactive", true);
        Identity.getAuthorizationClient(getActivity())
            .authorize(request())
            .addOnSuccessListener(r -> {
                if (r.hasResolution()) {
                    if (!interactive || r.getPendingIntent() == null) { call.reject("Needs user approval", "NEED_UI"); return; }
                    pending = call;
                    try {
                        launcher.launch(new IntentSenderRequest.Builder(r.getPendingIntent().getIntentSender()).build());
                    } catch (Exception e) {
                        pending = null;
                        call.reject(e.getMessage(), "ERR_LAUNCH");
                    }
                } else {
                    resolve(call, r);
                }
            })
            .addOnFailureListener(e -> call.reject(e.getMessage(), "ERR_AUTH"));
    }
}

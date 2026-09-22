package com.albaraka.contracts;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AlbarakaPrintPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

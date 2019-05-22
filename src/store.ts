import Vuex, { ActionContext } from 'vuex';
import VuexPersistence from 'vuex-persist';

const vuexLocal = new VuexPersistence({
  key: 'webrtc',
  storage: window.localStorage,
  reducer: (state: any) => ({ settings: state.settings })
});

interface StateSettings {
  [key: string]: any;
  type: 'MQTT' | 'WebSocket' | null;
  websocket_host: string | null;
  websocket_port: number | null;
  mqtt_server: string | null;
  mqtt_token: string | null;
  mqtt_clientId: string | null;
  mqtt_userId: number | null;
  uuid: string;
}

const moduleSettings = {
  state: {
    type: 'MQTT',
    websocket_host: 'matmag.ir',
    websocket_port: 8443,
    mqtt_server: 'm4.gap.im',
    mqtt_token: '884063:f45ac4b76cba07b6e528c2e35f8475a5',
    mqtt_clientId: '5ce39bbaa3605e0770659112',
    mqtt_userId: 884063,
    uuid: Math.random().toString()
  } as StateSettings,
  mutations: {
    setSettings(state: StateSettings, options: any) {
      for (let key in options) {
        state[key] = options[key];
      }
    }
  },
  getters: {}
};

const store = new Vuex.Store({
  modules: {
    settings: moduleSettings
  },
  plugins: [vuexLocal.plugin]
});

export default store;

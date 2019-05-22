<template lang="pug">
#settings.card.shadow-sm.mb-3
  .card-header.bg-info.text-white Settings
  .card-body
    form
      .form-group.row
        label.col-sm-2.col-form-label(for="type") Type
        .col-12.col-sm-6
          select.form-control(items="['MQTT', 'WebSocket']" v-model="type" id="type" autofocus="")
            option(v-for="option in ['MQTT', 'WebSocket']" :value="option") {{option}}
      .form-group.row(v-if="type === 'WebSocket'")
        label.col-sm-2.col-form-label(for="host") Host
        .col-12.col-sm-6
          input.form-control(v-model="websocket_host" placeholder="192.168.0.1" id="host")
      .form-group.row(v-if="type === 'WebSocket'")
        label.col-sm-2.col-form-label(for="port") Port
        .col-12.col-sm-6
          input.form-control(v-model="websocket_port" placeholder="8443" id="port")
      .form-group.row(v-if="type === 'MQTT'")
        label.col-sm-2.col-form-label(for="server") Server
        .col-12.col-sm-6
          input.form-control(v-model="mqtt_server" placeholder="m4.gap.im" id="server")
      .form-group.row(v-if="type === 'MQTT'")
        label.col-sm-2.col-form-label(for="clientId") ClientId
        .col-12.col-sm-6
          input.form-control(v-model="mqtt_clientId" id="clientId")
      .form-group.row(v-if="type === 'MQTT'")
        label.col-sm-2.col-form-label(for="userId") UserId
        .col-12.col-sm-6
          input.form-control(v-model="mqtt_userId" id="userId")
      .form-group.row(v-if="type === 'MQTT'")
        label.col-sm-2.col-form-label(for="token") Token
        .col-12.col-sm-6
          input.form-control(v-model="mqtt_token" id="token")
</template>

<script lang="ts">
import Vue from "vue";
import { mapState } from "vuex";

const setSettings = (name: string) => {
  return {
    set(value: any) {
      (this as any).$store.commit("setSettings", { [name]: value });
    },
    get(): any {
      return (this as any).settings[name];
    }
  };
};

export default Vue.extend({
  computed: {
    ...mapState(["settings"]),
    type: setSettings("type"),
    websocket_host: setSettings("websocket_host"),
    websocket_port: setSettings("websocket_port"),
    mqtt_server: setSettings("mqtt_server"),
    mqtt_clientId: setSettings("mqtt_clientId"),
    mqtt_userId: setSettings("mqtt_userId"),
    mqtt_token: setSettings("mqtt_token")
  },

  methods: {
    save() {}
  }
});
</script>

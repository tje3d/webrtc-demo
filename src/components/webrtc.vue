<template lang="pug">
.container-fluid
	#webrtc.pt-3.pb-3
		settings
		.card.shadow-sm.mb-3
			.card-header.bg-info.text-white Video Streams
			.card-body
				.row
					.col-sm-6.text-center
						.row.mb-3(v-if="!localStream")
							.col
								a.btn.btn-block(href="#" @click.prevent="requestLocalStream" :disabled="localStream" :class="{'disabled': localStream, 'btn-info': !localStream, 'btn-success': localStream}") Prepare Camera
						.row.mb-3(v-if="!connectedToSignalServer && !gapRTC && localStream")
							.col(v-if="connectionLoading") Connecting...
							.col(v-if="settings.type === 'MQTT' && !connectionLoading")
								a.btn.btn-block.btn-success(href="#" @click.prevent="createMqttConnection()") Create MQTT Connection
							.col(v-if="settings.type === 'WebSocket' && !connectionLoading")
								a.btn.btn-block.btn-success(href="#" @click.prevent="createWebSocket()") Create WebSocket Connection
						.row.mb-3(v-if="connectedToSignalServer")
							.col(v-if="!gapRTC && localStream && websocket")
								a.btn.btn-block.btn-success(href="#" @click.prevent="preparePeerConnection(true)") Call
							.col(v-if="gapRTC && localStream")
								span.text-muted All Set, Waiting for connection
						.row.mb-2
							.col
								video.rounded.border.w-100(ref="localVideo" autoplay muted)
					.col-sm-6
						.row
								.col.mb-3
									a.btn.btn-block.disabled.btn-info(href="#") Remote Camera
						.row
							.col
								video.rounded.border.w-100(ref="remoteVideo" autoplay)
</template>

<script lang="ts">
import Vue from "vue";
import alertify from "alertifyjs";
import settings from "./settings.vue";
import { mapState } from "vuex";
import GapRTC from "../GapRTC";

export default Vue.extend({
  components: { settings },

  computed: {
    ...mapState(["settings"]),
    connectedToSignalServer(): boolean {
      return !!(this.websocket || this.mqtt);
    }
  },

  data() {
    return {
      gapRTC: null as GapRTC | null,
      localStream: null as MediaStream | null,
      connectionLoading: false,
      websocket: null as WebSocket | null,
      mqtt: null
    };
  },

  methods: {
    requestLocalStream() {
      if (this.localStream) {
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return alertify.error("Your browser does not support getUserMedia API");
      }

      navigator.mediaDevices
        .getUserMedia({ audio: true, video: true })
        .then((stream: MediaStream) => {
          this.localStream = stream;
          (this.$refs.localVideo as any).srcObject = this.localStream;
        })
        .catch(error => {
          alertify.error(error.message);
        });
    },

    createWebSocket() {
      const host = (this as any).settings.websocket_host;
      const port = (this as any).settings.websocket_port;
      const uri = `wss://${host}:${port}`;

      this.connectionLoading = true;
      const websocket = new WebSocket(uri);

      websocket.onerror = (event: Event) => {
        this.websocket = null;
        this.connectionLoading = false;
        console.warn("WebSocket Onerror", event);
      };

      websocket.onopen = (event: any) => {
        this.websocket = websocket;
        this.connectionLoading = false;
        console.warn("WebSocket Opened");
      };

      websocket.onmessage = async (ev: MessageEvent): Promise<any> => {
        this.preparePeerConnection();

        const signal = JSON.parse(ev.data);

        if (signal.uuid === (this as any).settings.uuid) {
          return console.warn(
            "WebSocket Message Received But ##Dropped",
            ev.data
          );
        }

        console.warn("WebSocket Message Received", ev.data);

        if (!this.gapRTC) {
          return;
        }

        if (signal.sdp) {
          const sdpAnswer = await this.gapRTC.answerToOfferSdp(signal);

          if (this.websocket) {
            this.websocket.send(
              JSON.stringify({
                sdp: sdpAnswer,
                uuid: (this as any).settings.uuid
              })
            );
          }
        }

        if (signal.ice) {
          await this.gapRTC.addIceCandidate(new RTCIceCandidate(signal.ice));
        }

        return null;
      };
    },

    createMqttConnection() {},

    async preparePeerConnection(caller = false) {
      if (this.gapRTC || !this.localStream) {
        return;
      }

      console.warn("preparePeerConnection");

      this.gapRTC = new GapRTC({
        localStream: this.localStream,
        onGotTrack: (event: RTCTrackEvent) => {
          console.warn("gotTrack");

          (this.$refs.remoteVideo as any).srcObject = event.streams[0];
        },
        onCandidateReceived: (ice: RTCIceCandidate) => {
          console.warn("onCandidateReceived", ice);

          const uuid = (this as any).settings.uuid;

          if (!this.websocket) {
            return;
          }

          this.websocket.send(JSON.stringify({ ice, uuid }));
        }
      });

      if (caller && this.websocket) {
        const sdp: RTCSessionDescription = await this.gapRTC.createOffer();

        this.websocket.send(
          JSON.stringify({ sdp, uuid: (this as any).settings.uuid })
        );
      }
    }
  }
});
</script>

<style lang="scss" scoped>
video {
  max-height: 300px;
}
</style>

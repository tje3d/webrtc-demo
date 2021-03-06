//
// ─── TYPES ──────────────────────────────────────────────────────────────────────
//

export interface GapRTCParams {
  onCandidateLoadEnd?(candidates: Array<RTCIceCandidate>): void;
  onCandidateReceived?(candidate: RTCIceCandidate): void;
  onGotTrack?(event: RTCTrackEvent): void;
  localStream?: MediaStream;
}

export interface Signal {
  sdp?: RTCSessionDescription;
  ice?: RTCIceCandidate;
}

//
// ─── EXCEPTIONS ─────────────────────────────────────────────────────────────────
//

export class ExceptionNoConnection extends Error {}

export class EmptySDP extends Error {}

//
// ─── GAPRTC ─────────────────────────────────────────────────────────────────────
//

export default class GapRTC {
  config: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.gap.im' },
      {
        urls: 'turn:stun.gap.im',
        username: 'username1',
        credential: 'password1',
      },
    ],
  };
  connection?: RTCPeerConnection;
  iceCandidates: Array<RTCIceCandidate> = [];
  params: GapRTCParams;

  constructor(params: GapRTCParams) {
    this.params = params;

    this.createRTCPeerConnection();
  }

  createRTCPeerConnection() {
    this.iceCandidates = [];
    this.close();

    this.connection = new RTCPeerConnection(this.config);

    this.connection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate === null) {
        this.params.onCandidateLoadEnd &&
          this.params.onCandidateLoadEnd(this.iceCandidates);
        return;
      }

      if (!this.iceCandidates) {
        this.iceCandidates = [];
      }

      this.iceCandidates.push(event.candidate);

      if (this.params.onCandidateReceived) {
        this.params.onCandidateReceived(event.candidate);
      }
    };

    this.connection.ontrack = (event: RTCTrackEvent) => {
      if (this.params.onGotTrack) {
        this.params.onGotTrack(event);
      }
    };

    if (this.params.localStream) {
      this.params.localStream.getTracks().forEach((track: MediaStreamTrack) => {
        if (!this.connection || !this.params.localStream) {
          return;
        }

        this.connection.addTrack(track, this.params.localStream);
      });
    }
  }

  close() {
    if (!this.connection) {
      return;
    }

    this.connection.close();
  }

  addTrack(track: MediaStreamTrack, stream: MediaStream) {
    if (!this.connection) {
      return;
    }

    this.connection.addTrack(track, stream);
  }

  /**
   * Create offer SDP
   */
  async createOffer(): Promise<RTCSessionDescription> {
    if (!this.connection) {
      throw new ExceptionNoConnection();
    }

    const sdp: RTCSessionDescriptionInit = await this.connection.createOffer({
      iceRestart: true,
    });

    await this.connection.setLocalDescription(sdp);

    if (!this.connection.localDescription) {
      throw new EmptySDP();
    }

    return this.connection.localDescription;
  }

  /**
   * Create answer SDP
   */
  async createAnswer(): Promise<RTCSessionDescription> {
    if (!this.connection) {
      throw new ExceptionNoConnection();
    }

    const sdp = await this.connection.createAnswer({
      iceRestart: true,
    });

    await this.connection.setLocalDescription(sdp);

    if (!this.connection.localDescription) {
      throw new EmptySDP();
    }

    return this.connection.localDescription;
  }

  /**
   * Answer to a offer SDP
   * Send returned SDP to signaling server
   * @returns RTCSessionDescription | null
   */
  async answerToOfferSdp(
    signal: Signal,
  ): Promise<RTCSessionDescription | null> {
    if (!this.connection) {
      throw new ExceptionNoConnection();
    }

    if (!signal.sdp) {
      throw new EmptySDP();
    }

    this.connection.setRemoteDescription(new RTCSessionDescription(signal.sdp));

    if (signal.sdp.type !== 'offer') {
      return null;
    }

    return this.createAnswer();
  }

  /**
   * Add a Interactive Connectivity Establishment
   * @param ice RTCIceCandidate
   */
  async addIceCandidate(ice: RTCIceCandidate): Promise<void> {
    if (!this.connection) {
      throw new ExceptionNoConnection();
    }

    return this.connection.addIceCandidate(ice);
  }

  //
  // ─── HELPERS ────────────────────────────────────────────────────────────────────
  //

  /**
   * Disable or enable audio
   * @param void
   */
  setAudioStatus(status: boolean): void {
    this.params
      .localStream!.getAudioTracks()
      .forEach(track => (track.enabled = status));
  }

  /**
   * Disable or enable video
   * @param status
   */
  setVideoStatus(status: boolean): void {
    this.params
      .localStream!.getVideoTracks()
      .forEach(track => (track.enabled = status));
  }

  /**
   * Disable audio
   */
  mute() {
    this.setAudioStatus(false);
  }

  /**
   * Enable audio
   */
  unmute() {
    this.setAudioStatus(true);
  }

  /**
   * Disable video streaming
   */
  disableVideo() {
    this.setVideoStatus(false);
  }

  /**
   * Enable video streaming
   */
  enableVideo() {
    this.setVideoStatus(true);
  }
}

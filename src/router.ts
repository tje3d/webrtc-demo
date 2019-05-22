import VueRouter from 'vue-router';
import Webrtc from './components/webrtc.vue';

const router = new VueRouter({
  routes: [
    { path: '/webrtc', component: Webrtc },
    { path: '/', redirect: '/webrtc' }
  ]
});

export default router;

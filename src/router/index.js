import Vue from 'vue';
import Router from 'vue-router';
import ChatRoom from '@/components/chatroom/ChatRoom';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'ChatRoom',
      component: ChatRoom,
    },
  ],
});

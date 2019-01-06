<template>
  <div class="participant-list" :class="showParticipants ? 'shown' : ''">
    <div class="toggle" @click="showOrHideParticipants">
      <i class="fas fa-chevron-left" v-show="this.showParticipants"></i>
      <i class="fas fa-chevron-right" v-show="!this.showParticipants"></i>
    </div>
    <span class="pl-title">Participants</span>
    <ul>
      <li
        class="participant"
        v-for="participant in participants"
        :key="participant.sid"
      >{{participant.name}}</li>
    </ul>
  </div>
</template>

<script>
export default {
  props: ["participants"],
  data: function() {
    return {
      showParticipants: false
    };
  },
  methods: {
    showOrHideParticipants: function() {
      this.showParticipants = !this.showParticipants;
    },
    resizeHandler: function() {
      this.showParticipants = false;
    }
  },
  mounted: function() {
    window.addEventListener("resize", this.resizeHandler);
  }
};
</script>

<style scoped>
.pl-title {
  align-self: center;
  color: rgb(71, 165, 202);
  font-size: 20px;
  padding: 10px 0 10px 0;
}

.participant-list {
  min-width: 200px;
  height: 100%;
  background-color: rgb(44, 46, 49);
  display: flex;
  flex-direction: column;
  transition: all 0.25s ease;
}

.participant {
  margin: 5px 0 0 10px;
  color: #71e299;
  font-size: 16px;
}

.toggle {
  visibility: hidden;
  position: absolute;
  justify-self: center;
  left: 300px;
  height: 50px;
  width: 20px;
  background: rgb(54, 55, 58);
  border-top-right-radius: 3px;
  border-bottom-right-radius: 3px;
  top: 0;
  bottom: 0;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  color: grey;
}

@media screen and (max-width: 640px) {
  .toggle {
    visibility: visible;
  }

  .participant-list {
    position: absolute;
    left: -300px;
    z-index: 20;
    min-width: 300px;
    height: -webkit-calc(100% - 120px);
  }

  .participant-list.shown {
    left: 0;
  }
}
</style>

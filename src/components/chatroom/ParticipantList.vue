<template>
  <div class="participant-list">
    <span class="pl-title">Participants</span>
    <ul>
      <li
        class='participant'
        v-for="participant in participants"
        :key="participant.sid">{{participant.name}}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  props: ['participants'],
};
</script>

<style scoped>

.pl-title {
  align-self: center;
  color: rgb(71, 165, 202);
  font-size: 20px;
  padding: 10px 0 10px 0;
}

.participant-list{
  min-width: 200px;
  height: 100%;
  background-color: rgb(44, 46, 49);
  display: flex;
  flex-direction: column;
}

.participant{
  margin: 5px 0 0 10px;
  color: #71e299;
  font-size: 16px;
}

</style>

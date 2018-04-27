<template>
  <div class="msg">
    <span class="msg-owner">{{message.name}}</span>
    <div v-if="message.message.length > 0" class="msg-content-container">
      <span
        v-for="(msg, i) in message.message"
        :key="`m-${i}`" class="msg-content"
        v-html="msg"></span>
    </div>
  </div>
</template>

<script>
export default {
  props: ['message'],
};
</script>

<style>
.msg{
  background-color: #2a2b2b;
  color:rgb(184, 231, 231);
  padding: 15px;
  margin-top: 5px;
  border-radius: 2.5px;
  align-self: center;
}

.msg-owner{
  font-size: 14px;
  color: #71e299;
}

.msg-content-container {
  margin-top: 5px;
  display: flex;
  flex-direction: column;
}

.msg-content{
  margin: 5px 0 0 15px;
  font-size: 14px;
  letter-spacing: .25px;
}
</style>

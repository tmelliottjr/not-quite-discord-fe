<template>
        <div class="msg">
          <span class="msg-owner">{{message.name}}</span>
          <span v-for="(msg, i) in message.message" :key="`m-${i}`" class="msg-content" v-html="msg"></span>
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
  display: flex;
  flex-direction: column;
  padding: 10px;
  margin: 10px;
  border-radius: 2.5px;
}

.msg-owner{
  font-size: 12px;
  font-weight: bold;
  margin-top: 5px;
  margin-bottom: 5px;
  color: #71e299;
}

.msg-content{
  margin-left: 15px;
  margin-bottom: 2px;
  font-size: 14px;
  font-weight: bold;
}

</style>

<template>
  <div class="container">

    <div class="chat-header">
      <div v-if="connected" class="connected-info">
        Connected as {{name}}
      </div>      
      <div v-else class="join-chat">
        <input class='connect-name' v-model='name' type="text" placeholder="Name">
        <input class='connect-button' :class="name != '' ? 'enabled' : 'disabled'" @click="connect" type="button" value='Connect'>
      </div>
    </div>

    <div class="chat-container">
      <div class="participant-list">
        <ul>
          <li class='participant' v-for="participant in connectedParticipants" :key="participant.sid">{{participant.name}}</li>
        </ul>
      </div>
      <div class='msg-container'>
        <div class="msg-list">
          <msg-item v-for="(msg, i) in messages" :key="`msg-${i}`" :message=msg></msg-item>
        </div>
        <div class="msg-input">
          <div v-if="autoCompleteList.length > 0" class="autocomplete">
            <span :data-participant="acParticipant.name" @click="completeParticipant(i)" :class="{'ac-selected': acParticipant.selected}" class="autocomplete-item" v-for="(acParticipant,i) in autoCompleteList" :key="i">{{acParticipant.name}}</span>
          </div>
          <input class="msg-input-content" ref='message' v-model='message' type="text" @keydown="inputHandler"
            placeholder="Message">
        </div>
      </div>
    </div>

    <footer>
      <span>
        <a href='https://github.com/tmelliottjr'>github.com/tmelliotjr</a> | Socket.IO Chat App
      </span>
    </footer>
  </div>
</template>

<script>

import io from 'socket.io-client';
import axios from 'axios';
import MsgItem from './MsgItem';

export default {
  name: 'ChatRoom',
  data() {
    return {
      msg: process.env.API_URL,
      messages: [],
      message: '',
      socket: '',
      name: '',
      connectedParticipants: [],
      connected: false,
      showAutoComplete: false,
      msgSlice: '',
      lastAt: -1,
      doAutoComplete: false,
      autoCompleteFilter: '',
      autoCompleteList: [],
      slicePos: 0,
    };
  },
  components:{
    MsgItem
  },
  created() {
    axios.get('http://localhost:5000/connections').then(r => this.loadParticipants(r.data));
  },
  methods: {
    inputCheck(e){
      if ((e.code == "Enter" || e.code == "Tab" || e.code ==="ArrowUp" || e.code === "ArrowDown") && this.doAutoComplete) {
        e.preventDefault();
      }
    },
      generateAutoCompleteList() {
      if (this.doAutoComplete){
        this.autoCompleteList = this.connectedParticipants.reduce((a, e, i) => {
          if (e.name.toUpperCase().indexOf(this.autoCompleteFilter.toUpperCase()) > -1){
            a.push({
              name: e.name,
              selected: a.length == 0 ? true : false,
              })
          }
          return a
        }, [])
      } else {
        this.autoCompleteList = [];
      }
    },
    inputHandler(e){
      //
      // Needs to be refactored to route these functions accordingly.
      //

      if ((e.code == "Enter" || e.code == "Tab") && this.doAutoComplete){
        this.completeParticipant(this.autoCompleteList.findIndex(e => e.selected))
        e.preventDefault();
        return
      } else if (e.code == "Enter") {
        this.emit();
      }

      this.autoCompleteTest(e)

      if (this.doAutoComplete && e.code !== "ArrowDown" && e.code !== "ArrowUp") this.generateAutoCompleteList();

      if (this.doAutoComplete && this.autoCompleteList.length > 0 && (e.code == "ArrowUp" || e.code == "ArrowDown")) {
        
        let currentIndex = this.autoCompleteList.findIndex(ele => ele.selected);
        let nextIndex = 0;
        let cursorPos = this.$refs.message.selectionStart;

        if (e.code === "ArrowDown") {
          nextIndex = currentIndex == this.autoCompleteList.length - 1? 0 : currentIndex + 1;
        } else if (e.code === "ArrowUp") {
          nextIndex = currentIndex == 0 ? this.autoCompleteList.length - 1 : currentIndex - 1
        }

        this.autoCompleteList[currentIndex].selected = false;
        this.autoCompleteList[nextIndex].selected = true;

      }
    },
    autoCompleteTest(e) {

      // TODO: Slicing is ugly here. Needs to be cleaned up to properly with keydown

      let inc;

      if (e.code === "ArrowLeft" || e.code === "Backspace" || e.key === '@') {
        inc = -1;
      } else {
        inc = 1; 
      }

      if (e.key === '@') {
        this.lastAt = this.$refs.message.selectionStart;
      } else {
        this.lastAt = this.message.substring(0, this.$refs.message.selectionStart + inc).lastIndexOf('@');
      }

      let prevChar = this.message.charAt(this.lastAt - 1);
      
      this.slicePos = this.$refs.message.selectionStart + inc;

      this.autoCompleteFilter = this.message.substring(this.lastAt + inc, this.slicePos);
      console.log(this.autoCompleteFilter);
      this.autoCompleteFilter = this.autoCompleteFilter === ' ' ? '' : this.autoCompleteFilter;

      if (this.slicePos > this.lastAt && (prevChar === ' ' || prevChar === '') && this.lastAt > -1) {
        this.doAutoComplete = true;
      } else {
        this.clearAutoComplete();
      }
    },
    completeParticipant(index) {
      // Preserve space if found
      let slicePoint = this.message.indexOf(' ', this.slicePos)

      let end = ' '
      if (slicePoint > -1){
        end = `${this.message.slice(slicePoint)}`;
      } 

      let start = `${this.message.substring(0, this.lastAt + 1)}${this.autoCompleteList[index].name}`;
      this.message = `${this.message.substring(0, this.lastAt + 1)}${this.autoCompleteList[index].name}${end}`;
      this.clearAutoComplete();

      this.$refs.message.focus();
      this.$refs.message.selectionStart = start.length;
      this.$refs.message.selectionEnd = start.length;
      this.$forceUpdate();
    },
    loadParticipants(data) {
        this.connectedParticipants = [];
        for (let key in data){
        this.connectedParticipants.push({
          name: data[key],
          sid: key,
        })
      }
    },
    clearAutoComplete() {
      this.autoCompleteList = [];
      this.autoCompleteFilter = '';
      this.doAutoComplete = false;
    },
    emit(e) {
        this.socket.emit('client-message', this.message);
        this.message = '';
    },
    connect() {
      if (this.name !== '') {
        this.socket = io('localhost:5000', { query: `name=${this.name}` });
        this.connected = true;

        this.socket.on('message', (data) => {
          if (this.messages.length > 0 && this.messages[this.messages.length - 1].name === data.name) {
            this.messages[this.messages.length - 1].message.push(data.message);
          } else {
            this.messages.push({ name: data.name, message: [data.message] });
          }
        });
        
        this.socket.on('user-connected', this.loadParticipants);
      }
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
h1, h2 {
  font-weight: normal;
}

.container{
  height: 100%;
  display: grid;
  grid-template-rows: 60px 1fr 60px;
}

.chat-container{
  width: 100%;
  height: 100%;
  background-color: rgb(45, 48, 54);
  display: flex;
  border-bottom: 1px solid black;
}

.connect-name{
  height: 20px;
  font-size: 16px;
  font-weight: bold;
  color:rgb(129, 138, 146);
  background-color: rgb(54, 55, 58);
}

.connect-button{
  line-height: 20px;
  font-size: 16px;
  background-color: #333;
  cursor: pointer;
  transition: all 1s ease;
}

.connect-button.disabled{
  background-color: rgb(182, 114, 114);
}

.connect-button.enabled{
  background-color: rgb(114, 182, 131);
}

.connect-button:hover{
  transform: translateY(-1px);
}

.participant-list{
  min-width: 200px;
  height: 100%;
  background-color: rgb(44, 46, 49);
}

.connected-info{
  font-size: 18px;
  font-weight: bold;
  color: rgb(101, 131, 212);
}

.participant{
  margin: 5px;
  font-weight: bold;
  color:rgb(129, 138, 146);
}

.msg-container{
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
}

.msg-list{
  width: 90%;
  max-height: 90%;
  position: absolute;
  overflow-y: scroll;
  align-self: center;
}

.chat-header{
  background-color: #2a2b2b;
  display: flex;
  align-items: center;
  justify-content: center;
}

.msg-input{
  align-self: center;
  justify-content: center;
  align-items: center;
  display: flex;
  flex-direction: column;
  position: absolute;
  bottom: 0;
  width: 100%;
}

.msg-input-content{
  font-size: 16px;
  width: 80%;
  margin-bottom: 5px;
  background-color: rgb(54, 55, 58);
  border: none;
  border-radius: 2.5px;
  padding: 5px;
  font-weight: bold;
  color:rgb(129, 138, 146);
}

input{
  outline-style:none;
  box-shadow:none;
  border-color:transparent;
}

footer {
  background-color: #2a2b2b;
  color: rgb(101, 131, 212);
  display: flex;
  align-items: center;
  justify-content: center;
}

a {
  color: rgb(101, 131, 212);
}

.autocomplete {
  display: flex;
  width: 80%;
  flex-direction: column;
  background-color:rgb(44, 46, 49);
  color: rgb(106, 175, 187);
  padding: 3px;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
}
.autocomplete-item{
  padding: 5px;
  font-weight: bold;
  border-radius: 5px;
}
.autocomplete-item:hover, .ac-selected {
  cursor: pointer;
  background-color: rgba(255, 255, 255, 0.05);
}

</style>


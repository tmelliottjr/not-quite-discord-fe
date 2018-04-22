<template>
  <div class="container">
    <audio src="/static/msgalert.aac" ref="messagealert"></audio>

    <div class="chat-header">
      <div class="ch-left">
        <i class="fas alert-toggle" 
          @click="allowAlerts = !allowAlerts" 
          :class="allowAlerts ? 'fa-volume-up' : 'fa-volume-off'"
          title="Allow message alerts. If off @mentions will continue to function."></i>
      </div>
      <div v-if="connected" class="connected-info ch-center">
        Connected as {{name}}
      </div>      
      <div v-else class="join-chat ch-center">
        <input 
          class='connect-name' 
          ref='name'
          v-model='name' 
          @keydown.@.prevent 
          @keydown.space.prevent 
          type="text" 
          placeholder="Name">
        <input 
          class='connect-button' 
          :class="name != '' ? 'enabled' : 'disabled'" 
          @click="connect" 
          type="button" 
          value='Connect'>
      </div>
      <div class="ch-right"></div>
    </div>

    <div class="chat-container">
      <ParticipantList :participants="connectedParticipants"></ParticipantList> 
      <div class='msg-container'>
        <div ref="msglist" class="msg-list">
          <msg-item v-for="(msg, i) in messages" :key="`msg-${i}`" :message=msg></msg-item>
        </div>
        <div class="msg-input">
          <div v-if="autoCompleteList.length > 0" class="autocomplete">
            <span 
              :data-participant="acParticipant.name" 
              @click="completeParticipant(i)" 
              :class="{'ac-selected': acParticipant.selected}" 
              class="autocomplete-item" 
              v-for="(acParticipant,i) in autoCompleteList" 
              :key="i">{{acParticipant.name}}
            </span>
          </div>
          <input 
            class="msg-input-content" 
            ref='message' 
            v-model='message' 
            type="text" 
            @keydown.tab.prevent
            @keydown="keydownHandler" 
            @keyup="keyupHandler" 
            @input="inputHandler"
            placeholder="Message"
            :disabled="!connected">
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
import ParticipantList from './ParticipantList'
import messageHelpers from '../../mixins/message-helpers'

export default {
  name: 'ChatRoom',
  mixins:[messageHelpers],
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
      lastAt: -1,
      doAutoComplete: false,
      autoCompleteFilter: '',
      autoCompleteList: [],
      allowAlerts: true,      
    };
  },
  components:{
    MsgItem,
    ParticipantList,
  },
  created() {
    axios.get(process.env.API_URL+'/connections').then(r => this.loadParticipants(r.data));
  },
  methods: {
      generateAutoCompleteList() {
      if (this.doAutoComplete){
        this.autoCompleteList = this.connectedParticipants.reduce((a, e, i) => {
          if (e.name.toUpperCase().indexOf(this.autoCompleteFilter.toUpperCase()) > -1 && e.name !== this.name){
            a.push({
              name: e.name,
              selected: false,
              })
          }
          return a
        }, [])

        this.autoCompleteList.sort((a,b )=>{
         if(a.name.toUpperCase() < b.name.toUpperCase()) return -1;
         if(a.name.toUpperCase() > b.name.toUpperCase()) return 1;
         return 0;
        })

        this.autoCompleteList.slice(0, 5)
        this.$set(this.autoCompleteList[0],'selected', true);
      } else {
        this.autoCompleteList = [];
      }
    },
    keydownHandler(e){
      if ((e.code == "Enter" || e.code == "Tab") && this.doAutoComplete && this.autoCompleteList.length > 0){
        this.completeParticipant(this.autoCompleteList.findIndex(ele => ele.selected))
        e.preventDefault();
        return
      } else if (e.code == "Enter") {
        // Send message
        if (this.connected && this.message.length > 0) {
          this.emit();
        }
        return
      }

      if (this.doAutoComplete) {
        if (this.autoCompleteList.length > 0 && (e.code == "ArrowUp" || e.code == "ArrowDown")) {
          this.autoCompleteSelect(e)
          e.preventDefault();
        }
      }
    },
    keyupHandler(e) {
      // Only need to check for autocomplete when scrolling side to side - see discord functionality ;)
      if(e.code === "ArrowLeft" || e.code === "ArrowRight") {
        this.autoCompleteTest(e)
      }
    },
    inputHandler(e){
      this.autoCompleteTest(e)
    },
    autoCompleteSelect(e) {
        let currentIndex = this.autoCompleteList.findIndex(ele => ele.selected);
        let nextIndex = 0;

        if (e.code === "ArrowDown") {
          nextIndex = currentIndex == this.autoCompleteList.length - 1? 0 : currentIndex + 1;
        } else if (e.code === "ArrowUp") {
          nextIndex = currentIndex == 0 ? this.autoCompleteList.length - 1 : currentIndex - 1
        }

        this.autoCompleteList[currentIndex].selected = false;
        this.autoCompleteList[nextIndex].selected = true;
    },
    autoCompleteTest(e) {
      this.lastAt = this.message.substring(0, this.$refs.message.selectionStart).lastIndexOf('@');

      let prevChar = this.message.charAt(this.lastAt - 1);

      let cursorPos = this.$refs.message.selectionStart;

      this.autoCompleteFilter = this.message.substring(this.lastAt + 1, cursorPos);

      if (cursorPos > this.lastAt && (prevChar === ' ' || prevChar === '') && this.lastAt > -1) {
        this.doAutoComplete = true;
        this.generateAutoCompleteList();
        this.doAutoComplete = this.autoCompleteList.length > 0;
      } else {
        this.clearAutoComplete();
      }
    },
    completeParticipant(index) {
      // Preserve space if found
      let slicePoint = this.message.indexOf(' ', this.$refs.message.selectionStart)

      let end = ' '
      if (slicePoint > -1){
        end = `${this.message.slice(slicePoint)}`;
      } 

      let start = `${this.message.substring(0, this.lastAt + 1)}${this.autoCompleteList[index].name}`;

      this.message = `${start}${end}`;

      this.clearAutoComplete();

      this.$refs.message.focus();

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

      let nameVerified = false;

      if (this.name !== '') {
        this.socket = io(process.env.API_URL, { query: `name=${this.name}` });

        this.socket.on('connection-error', (data) => {
          this.socket.disconnect();
          alert(`Username ${this.name} already taken.`)
          this.$refs.name.focus();
        })

        this.socket.on('connection-success', (data) => {
          this.connected = true;
          this.$refs.message.focus();
        })

        this.socket.on('message', this.messageReceived);
        
        this.socket.on('user-connected', data => {
          this.messages.push({ name: `${data[0]} has connected!`, message: '' })
          this.loadParticipants(data[1])
        });

        this.socket.on('user-disconnected', data => {
          this.messages.push({ name: `${data[0]} has disconnected!`, message: '' })
          this.loadParticipants(data[1])
        });
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

.msg-list {
    -ms-overflow-style: none;  
    overflow: -moz-scrollbars-none;  
}
.msg-list::-webkit-scrollbar { 
    display: none;  
}

.chat-container{
  width: 100%;
  height: 100%;
  background-color: rgb(45, 48, 54);
  display: flex;
  border-bottom: 1px solid black;
}

.ch-left, .ch-right {
  color: rgb(184, 231, 231);
  flex: 1;
}

.connect-name{
  height: 20px;
  font-size: 16px;
  font-weight: bold;
  color:rgb(129, 138, 146);
  background-color: rgb(54, 55, 58);
}

.chat-emote {
  height: 25px;
  vertical-align: middle;
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

.alert-toggle {
  cursor: pointer;
}

.connected-info{
  font-size: 18px;
  color: rgb(71, 165, 202);
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
  padding: 20px;
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
  color: rgb(71, 165, 202);
  display: flex;
  align-items: center;
  justify-content: center;
}

a {
  color: rgb(71, 165, 202);
}

.autocomplete {
  display: flex;
  width: 80%;
  flex-direction: column;
  background-color:rgb(44, 46, 49);
  color: #71e299;
  
  padding: 3px;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
}

.autocomplete-item{
  padding: 5px;
  font-size: 16px;
  border-radius: 5px;
}

.autocomplete-item:hover, .ac-selected {
  cursor: pointer;
  background-color: rgba(255, 255, 255, 0.05);
}

</style>


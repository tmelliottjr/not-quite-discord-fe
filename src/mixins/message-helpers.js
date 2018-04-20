export default {
  data() {
    return {
      emotes: {
        ':doge:': 'https://media1.giphy.com/media/3o7WIFkaWxc4xMFPna/giphy.gif',
        ':kappa:': 'http://i.imgur.com/W0QgS4N.png',
      },
    };
  },
  methods: {
    messageReceived(data) {
      // Create a new message block, if the last received message belongs has the same
      // owner as this message append to existing message block.
      if (this.messages.length > 0 && this.messages[this.messages.length - 1].name === data.name) {
        this.messages[this.messages.length - 1].message
          .push(this.processEmotes(this.sanitize(data.message)));
      } else {
        this.messages.push({
          name: data.name,
          message: [this.processEmotes(this.sanitize(data.message))],
        });
      }

      this.$refs.msglist.scrollTop = this.$refs.msglist.scrollHeight;

      // Play message notification sound if enabled or current user was mentioned.
      // This really shouldn't be using name. SID is a more appropriate identifier.
      const mention = data.message.includes(`@${this.name} `);

      if (data.name !== this.name && (this.allowAlerts || mention)) {
        this.$refs.messagealert.play();
      }
    },
    sanitize(string) {
      const entityMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;',
      };

      return String(string).replace(/[&<>"'`=/]/g, s => entityMap[s]);
    },
    processEmotes(message) {
      let m = message;
      Object.keys(this.emotes).forEach((emote) => {
        const re = new RegExp(emote, 'g');
        console.log('emote', emote);
        m = String(m).replace(re, `<img class="chat-emote" src="${this.emotes[emote]}" title="${emote}" alt="${emote}">`);
      });
      return m;
    },
  },
};

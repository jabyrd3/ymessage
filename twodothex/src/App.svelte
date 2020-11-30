<script>
  import ConversationSidebar from './ConversationSidebar.svelte';
  import Conversation from './Conversation.svelte';
  import MessageInput from './MessageInput.svelte';
  import config from '../../config.mjs';
  import Contacts from '../../contacts.mjs';
  // window.contacts = this.contacts;
  // const messageKeys = Array.from({length: initData.messages.length}).map((i, idx)=>idx);
  const ws = new WebSocket(`ws://${config.hostname}:8080`);
  let messages, chats, keys=[];
  // todo: wire up initdata somehow
  const contacts = new Contacts([]);
  ws.addEventListener('open', function (event) {
      ws.send(JSON.stringify({
        type: 'all'
      }));
  });
  ws.addEventListener('message', msgs => {
    const newMessages = JSON.parse(msgs.data);
    if(newMessages.type === 'grabity' || newMessages.type === 'twitter'){
      // todo: update previewcache
      return;
    }
    chats = computeChats(newMessages);
    keys = Object.keys(chats);
  });
  const computeChats = (msgs) => msgs.reduce((acc, val, idx)=>{
    if(msgs[idx].text){
      const contact = contacts.one(msgs[idx].phone);
      const date = new Date('2001-1-1');
      date.setMilliseconds(date.getMilliseconds() + msgs[idx].date / 1000000);
      return Object.assign({}, acc, {
        [msgs[idx].chat_id]: {
          contact,
          message: msgs[idx],
          date
        }
      })
    }else{
      return acc;
    }
  }, {});
</script>

<style>
  body {
    font-family: Helvetica, "Helvetica-Neue", Arial, sans-serif;
    background-color: #333;
    color: white;
    margin: 0;
    padding: 0;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  .messages, .chats{
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  .app {
    display: flex;
  }
  .chats {
    flex: 1 0 0;
    max-width: 300px;
    border-right: 1px solid #666;
    padding: 0;
    margin: 0px; 
  }
  .chat {
    display: flex;
    font-size: 13px;
    margin: 0;
    border-bottom: 1px solid #4F5052;
    padding: 8px 0px 8px 8px;
  }
  .chat .timestamp{
    flex: .25 0 0;
  }
  .chat .content-wrap{
    flex: 1 0 0;
    display: flex;
    max-width:200px;
    flex-wrap: wrap;
  }
  .chat .text{
    width: 100%;
    word-wrap: anywhere;
  }
  .chat .users{
    width: 100%;
    font-weight: bold;
  }
  .chat.selected{
    background-color: #505153;
  }
  .chats, .messages{
    height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
  }
  .right{
    flex: 3 0 0;
    position: relative;
    background-color: #1E1F22;
  }
  .messages {
    overflow-y: auto;
    height: calc(100vh - 32px);
    word-wrap: anywhere;
  }
  .messages > div:not(.chat-box){
    padding-left: 8px;
  }
  .message{
    margin-top: 12px;
  }
  .message:last-of-type{
    margin-bottom: 12px;
  }
  .img-wrap{
    /*position: relative;*/
    width: 35vw;
    height: 35vh;
    max-width: 35vw;
    margin-top: 12px;
    overflow: hidden;
  }
  .message img{
    height: 100%;
    /*position: absolute;*/
  /*  top:0;
    bottom: 0;
    left:0;
    right:0;
  */}
  .orientation-6{
    transform: rotateZ(90deg);
  }
  .message span{
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 13px;
    line-height: 13px;
    display: block;
  }
  .ours{
    float: right;
    clear: both;
  }
  .ours span{
    background-color: #1574E3;
    margin-right:8px;
  }
  .theirs{
    float: left;
    clear: both;
    margin-left: 8px;
  }
  .theirs span{
    clear: both;
    background-color: #464646;
  }
  .chat-box{
    border-top: 1px solid #414141;
    bottom: 0;
    right: 0;
    background-color: #1E1E1E;
    width: 100%;
    padding: 6px 0;
    position: absolute;
    bottom: 0;
  }
  .chat-box input{
    border-radius: 20px;
    font-size: 13px;
    border: 1px solid #626264;
    background-color: #3C3C3C;
    width: calc(96%);
    margin-left: 1%;
    padding: 0px 1%;
    color: white;
  }
  .hidden {
    display: none;
  }
</style>
<div class="app">
  {#each keys as key}
    <span>{key}</span>
  {/each}
  <ConversationSidebar />
  <Conversation />
  <MessageInput />
</div>

import { h, render, Component } from '/node_modules/preact/dist/preact.mjs';
import Contacts from '/contacts.mjs';
import config from '/config.mjs';
const urlRegex =/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
class App extends Component {
  constructor(props){
    super(props);
    this.contacts = new Contacts(initData.contacts)
    window.contacts = this.contacts;
    const messageKeys = Array.from({length: initData.messages.length}).map((i, idx)=>idx);
    this.state = {
      messages: initData.messages,
      messageKeys,
      orientations: {},
      msgText: '',
      previews: initData.previews || {}
    };
    this.computeChats = this.computeChats.bind(this);
    this.loadedImg = this.loadedImg.bind(this);
    this.submit = this.submit.bind(this);
    this.updateMsg = this.updateMsg.bind(this);
    console.log('computechats constructor');
    this.computeChats(initData.messages, this.state.messageKeys);
    document.onfocus = () => {
      document.title = 'imessage';
    }
  }
  componentWillMount(){
    console.log('computechats cwm');
    const chats = this.computeChats(initData.messages, this.state.messageKeys);
    this.setState({
      chats
    });
  }
  scrollMessages(){
    setTimeout(() => {
      const messages = document.getElementById('messages');
      messages.scrollTo(0, messages.scrollHeight)
    }, 16);
  }
  componentDidMount(){
    // todo: unfuck this
    // console.log(this.state.chats)
    this.setState({
      activeChat: Object.keys(this.state.chats).sort((a, b) => this.state.chats[a].date > this.state.chats[b].date ? -1 : 1)[0]
    });
    console.log('computechats cdm');
    const chats = this.computeChats(initData.messages, this.state.messageKeys);
    this.setState({
      chats
    });
    const ws = new WebSocket(`ws://${config.hostname}:8080`);
    this.ws = ws;
    this.ws.addEventListener('open', function (event) {
        ws.send(JSON.stringify({
          type: 'Hello Server!'
        }));
    });
    this.ws.addEventListener('message', msgs => {
      const messages = JSON.parse(msgs.data);
      if(messages.type && (messages.type === 'grabity' || messages.type === 'twitter')){
        this.setState({
          previews: Object.assign({}, this.state.previews, {
            [messages.message_id]: messages.preview
          })
        });
        return true;
      }
      // console.log('jabbo', messages.type)
      console.log('jabbo messages', messages.type, messages.type && "fuck")
      console.log('computechats eventlistener', messages, messages.type, messages.type && "fuck"); 
      const messageKeys = Object.keys(messages);
      const chats = this.computeChats(messages, messageKeys);
      const newIds = messages.map(m=>m.message_id)
      const oldIds = this.state.messages.map(m=>m.message_id);
      const newMsgs = newIds.filter(ni=>!oldIds.includes(ni));
      const hasLinks = messages
        .filter(m => m.text !== null)
        .filter(m => m.text.includes('http') || m.text.includes('https'));
      hasLinks.map(m=>{
        if(!this.state.previews[m.message_id]) {
          ws.send(JSON.stringify({
            type: 'grabity',
            message_id: m.message_id,
            url: m.text.match(urlRegex)
          }));
        }
      });
      console.log('jabbo haslinks', hasLinks);
      if (newMsgs.length > 0 ){
        const newest = messages.find(msg=>msg.message_id = newMsgs[0]);
        // console.log('new message!', newMsgs, newest)
        document.title = `(${newMsgs.length}) imessage`;
      }
      this.setState({
        messages,
        messageKeys,
        chats
      });
    });
  }
  computeChats(messages, messageKeys){
    const chats = messageKeys.reduce((acc, m, idx)=>{
      if(messages[idx] && messages[idx].chat_id && Object.keys(acc).includes(messages[idx].chat_id.toString())) {
        return acc;
      } else if(messages[idx].text){
        const contact = this.contacts.one(messages[idx].phone);
        const date = new Date('2001-1-1');
        date.setMilliseconds(date.getMilliseconds() + messages[idx].date / 1000000);
        return Object.assign({}, acc, {
          [messages[idx].chat_id]:
            {component: 
              h('div', {class: `chat ${this.state.activeChat && messages[idx].chat_id && messages[idx].chat_id.toString() === this.state.activeChat.toString() ? 'selected' : ''}`, onClick: () => {
                  this.setState({
                    activeChat: messages[idx].chat_id
                  });
                  setTimeout(() => this.setState({chats: this.computeChats(this.state.messages, this.state.messageKeys)}), 0);
                  this.scrollMessages();
               }},
                h('div', {class: 'content-wrap'}, 
                  h('span', {class: 'users'}, contact && contact[0] ? `${contact[0].firstName || ''} ${contact[0].lastName || ''}` : 'hrm'),
                  h('span', {class: 'text'}, messages[idx].text !== '\ufffc' ? messages[idx].text : 'attachment'),
                  h('span', {class: 'hidden'}, `${messages[idx].chat_id} | ${messages[idx].date}`)),
                h('div', {class: 'timestamp'}, date.toDateString())),
            date: messages[idx].date}
        });
      } else {
        return acc;
      }
    }, {});
    window.chats = chats;
    return chats;
  }
  socketUpdate(messages){
    this.setState({
      messages 
    });
  }
  loadedImg(filename){
    // const that = this;
    // const img1 = document.getElementById(filename);
    // EXIF.getData(img1, function() {
    //   const o = EXIF.getTag(this, 'Orientation');
    //   that.setState({
    //     orientations: Object.assign({}, that.state.orientations, {
    //       [filename]: {
    //         o,
    //         w: img1.clientWidth,
    //         h: img1.clientHeight,
    //       }
    //     })
    //   })
    // });
    this.scrollMessages();
  }
  submit(e){
    e.preventDefault();
    const {activeChat, messages, msgText} = this.state;
    this.ws.send(JSON.stringify({
      type: 'imessage',
      msg: {
        target: messages.find(m=>m.chat_id == activeChat).guid,
        message: msgText
      }
    }));
    this.setState({
      msgText: ''
    });
  }
  updateMsg(msg){
    this.setState({
      msgText: msg.target.value
    });
  }
  render(){
    console.log(this.state.previews);
    const {chats, messages, activeChat, messageKeys, orientations} = this.state;
    const msgComponents = messageKeys 
      .map(k => messages[k])
      .sort((a, b) => {
        return a.date <= b.date ? -1 : 1;
      })
      .filter(m => m && m.chat_id == activeChat)
      .map(msg => h('div', {
        class: `${msg.is_from_me === 1 ? 'ours' : 'theirs'} message`
      }, this.state.previews[msg.message_id] && this.state.previews[msg.message_id].type === 'twitter' && this.state.previews[msg.message_id].url ? 
          // haspreview
          h('div', {class: 'preview'}, h('img', {
            class: 'img-wrap',
            src: `/${this.state.previews[msg.message_id].url}`}), h('a', {href:msg.text}, msg.text)) :
          msg.attachments && msg.attachments.length > 0 ?
            // attachment messages
            msg.attachments.filter(atch=>atch.filename).map(atch=> h('div', {
              class:'img-wrap',
              style: `height: ${orientations[atch.filename] && orientations[atch.filename].h || undefined}px; width: ${orientations[atch.filename] && orientations[atch.filename].w || undefined}px`
            }, h('img', {
              src: `/assets/${atch.filename}`,
              class: `orientation-${orientations[atch.filename] && orientations[atch.filename].o}`,
              importance: 'low',
              decoding: 'async',
              id: atch.filename,
              onload: (img) => this.loadedImg(atch.filename)
            })))
            // any text besides weird unicode from messages
            .concat([h('span', {}, msg.text !== '\ufffc' ? msg.text : '')]) :
            // normal messages
            h('span', {}, msg.text)));
    return (
      h('div', {class: 'app', onClick: () => {document.title = 'imessage'}}, 
        h('div', {class: 'chats'}, Object.keys(chats)
            .sort((a, b)=> chats[a].date >= chats[b].date ? -1 : 1)
            .map(k => chats[k].component)),
        h('div', {class: 'right'},
          h('div', {id: 'messages', class: 'messages'}, msgComponents),
          h('form', {
            class: 'chat-box',
            onSubmit: this.submit
          }, h('input', {
            value: this.state.msgText,
            onInput: this.updateMsg
          })))
        )
      );
  }
}

render(h(App), document.body);

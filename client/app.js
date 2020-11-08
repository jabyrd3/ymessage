import { h, render, Component } from 'http://totem.home:5000/node_modules/preact/dist/preact.mjs';
import Contacts from 'http://totem.home:5000/contacts.mjs';

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
      msgText: ''
    };
    this.computeChats = this.computeChats.bind(this);
    this.loadedImg = this.loadedImg.bind(this);
    this.submit = this.submit.bind(this);
    this.updateMsg = this.updateMsg.bind(this);
    this.computeChats(initData.messages, this.state.messageKeys);
  }
  componentWillMount(){
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
    console.log(this.state.chats)
    this.setState({
      activeChat: Object.keys(this.state.chats).sort((a, b) => this.state.chats[a].date > this.state.chats[b].date ? -1 : 1)[0]
    });
    const chats = this.computeChats(initData.messages, this.state.messageKeys);
    this.setState({
      chats
    });
    const ws = new WebSocket('ws://totem.home:8080');
    this.ws = ws;
    this.ws.addEventListener('open', function (event) {
        ws.send(JSON.stringify({
          type: 'Hello Server!'
        }));
    });
    this.ws.addEventListener('message', msgs => {
      const messages = JSON.parse(msgs.data);
      const messageKeys = Object.keys(messages);
      const chats = this.computeChats(messages, messageKeys);
      this.setState({
        messages,
        messageKeys,
        chats,
        msgText: this.state.msgText
      });
    });
  }
  computeChats(messages, messageKeys){
    const chats = messageKeys.reduce((acc, m, idx)=>{
      if(messages[idx].chat_id && Object.keys(acc).includes(messages[idx].chat_id.toString())) {
        return acc;
      } else if(messages[idx].text){
        const contact = this.contacts.one(messages[idx].phone);
        const date = new Date('2001-1-1');
        date.setMilliseconds(date.getMilliseconds() + messages[idx].date / 1000000);
        return Object.assign({}, acc, {
          [messages[idx].chat_id]:
            {component: 
              h('div', {class: `chat ${this.state.activeChat && messages[idx].chat_id.toString() === this.state.activeChat.toString() ? 'selected' : ''}`, onClick: () => {
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
    const that = this;
    const img1 = document.getElementById(filename);
    EXIF.getData(img1, function() {
      const o = EXIF.getTag(this, 'Orientation');
      that.setState({
        orientations: Object.assign({}, that.state.orientations, {
          [filename]: {
            o,
            w: img1.clientWidth,
            h: img1.clientHeight,
          }
        })
      })
    });
    this.scrollMessages();
  }
  submit(e){
    e.preventDefault();
    const {activeChat, messages, msgText} = this.state;
    // console.log(messages)
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
      msgText: new String(msg.target.value)
    });
  }
  render(){
    const {chats, messages, activeChat, messageKeys, orientations} = this.state;
    const msgComponents = messageKeys 
      .map(k => messages[k])
      .sort((a, b) => {
        return a.date <= b.date ? -1 : 1;
      })
      .filter(m => m && m.chat_id == activeChat)
      .map(msg => h('div', {
        class: `${msg.is_from_me === 1 ? 'ours' : 'theirs'} message`
      }, msg.attachments && msg.attachments.length > 0 ? msg.attachments.map(atch=> h('div', {
        class:'img-wrap',
        style: `height: ${orientations[atch.filename] && orientations[atch.filename].h || undefined}px; width: ${orientations[atch.filename] && orientations[atch.filename].w || undefined}px`
      }, h('img', {
        src: `http://totem.home:3000/assets/${atch.filename}`,
        class: `orientation-${orientations[atch.filename] && orientations[atch.filename].o}`,
        importance: 'low',
        decoding: 'async',
        id: atch.filename,
        // onload: (img) => this.loadedImg(atch.filename)
      }))).concat([h('span', {}, msg.text !== '\ufffc' ? msg.text : '')]) : h('span', {}, msg.text)))
    return (
      h('div', {class: 'app'}, 
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
            onKeyUp: this.updateMsg
          })))
        )
      );
  }
}

render(h(App), document.body);

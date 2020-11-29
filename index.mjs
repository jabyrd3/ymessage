import sqlite from 'better-sqlite3';
import WebSocket from 'ws';
import http from 'http';
import Contacts from './contacts.mjs';
import client from './client/index.mjs';
import fs from 'fs';
import cp from 'child_process';
import Sender from './sender.mjs';
import config from './config.mjs';
import {promisify} from 'util';
import grabity from 'grabity';
import twitSnap from './test-grabity.mjs';
let previews = {};
const sender = new Sender((err, rtn) => {
  if(err){
    return console.log(`sender failed with ${err}`)
  };
  console.log(`sender succeeded returning: `, rtn)
});
const db = sqlite(`${config.home}/Library/Messages/chat.db`);
const wss = new WebSocket.Server({ port: 8080 });
const contacts = new Contacts(false, cp);
const allContacts = contacts.all();
console.log(allContacts)
const port = 3000

let sockets = [];
let fullMessages = db.prepare(`
  SELECT  chat.guid, message.is_from_me, message."ROWID" as message_id, handle_id, handle.id as phone, chat_id, date, text from message 
    left join chat_message_join 
      on message."ROWID" = chat_message_join.message_id
    left join handle
      on handle.ROWID = message.handle_id 
   left join chat
      on chat."ROWID" = chat_message_join.chat_id
   ORDER BY message.ROWID desc LIMIT 300 OFFSET 0;
`).all();
let attachments = db.prepare(`SELECT attachment_id, message.ROWID, filename from message
  inner join message_attachment_join
  on message_attachment_join.message_id = message.ROWID
  inner join attachment
    on message_attachment_join.attachment_id = attachment.ROWID
ORDER BY message.ROWID desc LIMIT 300 OFFSET 0;
`).all();

const updateClient = (msgs) => {
  sockets.map(s => s.send(JSON.stringify(msgs)));
};

const poller = () => {
  // console.log('looping', Object.keys(fullMessages).length)
  /*datetime(date + strftime('%s','2001-01-01'), 'unixepoch')*/
  fullMessages = db.prepare(`
    SELECT chat.guid, message.is_from_me, message."ROWID" as message_id, handle_id, handle.id as phone, chat_id, date, text from message 
      left join chat_message_join 
        on message."ROWID" = chat_message_join.message_id
      left join handle
        on handle.ROWID = message.handle_id 
      left join chat
        on chat."ROWID" = chat_message_join.chat_id
     ORDER BY message.ROWID desc LIMIT 300 OFFSET 0;
  `).all();
  attachments = db.prepare(`SELECT attachment_id, message.ROWID, filename from message
    inner join message_attachment_join
    on message_attachment_join.message_id = message.ROWID
    inner join attachment
      on message_attachment_join.attachment_id = attachment.ROWID
  ORDER BY message.ROWID desc LIMIT 300 OFFSET 0;
  `).all();
  updateClient(fullMessages.map(fm => Object.assign({}, fm, {
    attachments: attachments.filter(at => at.ROWID === fm.message_id)
  })), contacts);
  setTimeout(()=>{
    poller();
  }, 5000);
};

// init
poller();
wss.on('connection', function connection(ws) {
  sockets.push(ws);
  ws.on('open', () => {
    // ws.send('something');
    console.log('open')
  });
  ws.on('message', async data => {
    const msg = JSON.parse(data);
    switch(msg.type){
      case 'grabity':
        if(previews[msg.message_id]){
          console.log('cachedsend', previews[msg.message_id]);
          sockets.map(async s => s.send(JSON.stringify({
            type: previews[msg.message_id].type,
            message_id: msg.message_id,
            preview: previews[msg.message_id]
          })));
        } else {
          let preview;
          try {
            if(msg.url[0].includes('twitter')){
              preview = await twitSnap(msg.url[0], msg.message_id, 0);
              preview.type = 'twitter';
            } else {
              preview = await grabity.grab(msg.url[0]);
              preview.type = 'grabity';
            }
          } catch(e){
            console.log("failed to fetch", msg);
            preview = {
              type: 'grabity',
              msg:'Not Available'
            };
          }
          previews[msg.message_id] = preview;
          console.log('realfetchd send uncache', preview)
          sockets.map(async s => s.send(JSON.stringify({
            message_id: msg.message_id,
            type: preview.type,
            preview
          })));
        }
      break;
      case 'sms': 
        console.log('trigger sms with message', msg)
      break;
      case 'imessage': 
        console.log('trigger imessage with message', msg)
        sender.message(msg.msg.target, msg.msg.message);
      break;
      case 'group': 
        console.log('trigger group with message', msg)
      break;
      default:
        console.log('fellthru with type ', msg.type);
    }
  });
});

const server = http.createServer(async (request, response) => {
  if(request.url.includes('assets')){
    try{
      const file = await promisify(fs.readFile)(request.url.replace('~', config.home).split('assets/')[1]);
      return response.end(file);
    }catch(e){
      console.log(e)
      response.statusCode = 404;
      return response.end();
    }

  }
  response.end(client(fullMessages.map(fm => Object.assign({}, fm, {
    attachments: attachments.filter(at => at.ROWID === fm.message_id)
  })), allContacts))
});

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
});

process
  .on('unhandledRejection', (reason, p) => {
    console.error(reason, 'Unhandled Rejection at Promise', p);
  })
  .on('uncaughtException', err => {
    console.error(err, 'Uncaught Exception thrown');
    process.exit(1);
  });

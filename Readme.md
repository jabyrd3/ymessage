# ymessage
this is a web-based bridge/ui for macos messages. It reads chat.db and tries to present a reasonably feature-complete UI for basic messaging. messages are sent via applescript through the messages app.

its not going to replace messages entirely, but if you use linux/windows and miss access to messages, this will help fill the gap.

this has no authentication or even encryption over the wire. Only run this on a vpn. Actually, until i've got it binding to specific network interfaces, don't run this at all. it is dangerous as-is.

# reqs
node 12

# install
- clone this repo
- mv config.example.mjs to config.mjs and replace with values that make sense for your env
- cd into ymessage
- run `npm install`, it shouldn't take long
- run `npx serve` to serve up some basic modules. for prod, probably use a real webserver here
- run `node --experimental-modules index.js` to stand up the server
- go to locahost:3000 to see a (basic) representation of your messages.app chat.db. outbound messages are kind of rough, and group chat isn't fully working yet.

# todo (priority order):
- [ ] templatize configs (ports, dirs, etc)
- [ ] bind to specific interfaces (ie: vpn only)
- [ ] render links as anchor tags
- [ ] add unread dots to chat list
- [ ] os notifications
- [ ] grabit?
- [ ] figure out twitter attachments formatting
- [ ] implement send behavior for group chat
- [ ] implement send behavior for sms
- [ ] figure out wtf to do about group sms
- [ ] come up with a better way to get contacts
- [ ] upload attachments
- [ ] create new message

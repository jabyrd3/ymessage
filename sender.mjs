import applescript from 'applescript';
export default class Sender{
  constructor(cb){
    this.callback = cb ? cb.bind(this) : () => {};
  }
  sms(phone, message){
    applescript.execString(`
      tell application "Messages"
        set message to "${message}"
        set conversation to a reference to text chat id chat_id
        send message to conversation
      end tell`, this.callback);
  }
  message(cID, message){
    applescript.execString(
      `tell application "Messages"
        set message to "${message}"
        set chat_id to "${cID}"
        set msg_service to 1st service whose service type = iMessage
        set conversation to a reference to text chat id chat_id
        send message to conversation
      end tell`, this.callback);
  }
  group(cID, message){
    applescript.execString(
      `tell application "Messages"
        set chat_id to "${cID}"
        set message to "${message}"
        set conversation to a reference to text chat id chat_id
        send message to conversation
      end tell`, this.callback);
  }
}

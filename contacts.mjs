const replacer = /\@|\(|\)|\-|\+| /g;
class Contacts {
  constructor(cts, cp){
    if(!cts && cp){
      const rawContacts = cp.execSync('./contacts-cli').toString().replace(/\n/g, ',');
      this.contacts = JSON.parse(`[${rawContacts.slice(0, -1)}]`);
    } else {
     this.contacts = cts; 
    }
    this.all = this.all.bind(this);
    this.one = this.one.bind(this);
  }
  all(){
    return this.contacts;
  }
  one(token){
    if(token){
      let cleanToken = token.replace(replacer, '');
      if (cleanToken[0] === '1'){
        cleanToken = cleanToken.slice(1);
      }
      return this.contacts.filter(contact => {
        return (
          (contact.firstName && contact.firstName.toLowerCase().includes(cleanToken.toLowerCase())) ||
          (contact.emails && contact.emails.map(email => email.value.replace(replacer, '')).includes(cleanToken)) ||
          (contact.phones && contact.phones.map(phone => {
            const cleanedPhone = phone.value.replace(replacer, '');
            return cleanedPhone[0] === 1 ?
              cleanedPhone.slice(1) : 
              cleanedPhone
          }).filter(cleanPhone => cleanPhone === cleanToken || cleanPhone.includes(cleanToken)).length > 0)
        )
      });
    }
  }
}
export default Contacts;


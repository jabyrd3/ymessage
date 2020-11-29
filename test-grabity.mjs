// import kahaki from 'kahaki';
import Nightmare from 'nightmare';
import fs from 'fs';
import nss from 'nightmare-screenshot-selector';
Nightmare.action('screenshotSelector', nss);
let busy = 0;
const nightmare = Nightmare({
  waitTimeout: 60000
});
const test = async () => {
  nightmare.goto('https://twitter.com/dril/status/1331742968709926912')
    .wait('article[data-focusable=true][tabindex="0"] div div div div div div span')
    .screenshotSelector('article[data-focusable=true][tabindex="0"]')
    // .evaluate(() => document.querySelector('article[data-focusable=true][tabindex="0"]').innerHTML)
    .end()
    .then(snap=>{
      fs.writeFileSync('./cache/test.png', snap)
    })
    .catch(error => {
      console.error('Search failed:', error)
    });
}

// test();

const fire = (url, msgid, idx, res2) => {
  return new Promise((res, rej) => {
    if(fs.existsSync(`./cache/${msgid}-${idx}.png`)){
      return res({msgid, idx, url: `cache/${msgid}-${0}.png`, msg: 'shotted', type: 'twitter'});
    }
    if(busy === 0){
      busy = 1;
      const nightmare = Nightmare({ show: false });
      nightmare.goto(url)
        .wait('article[data-focusable=true][tabindex="0"] div div div div div div span')
        .screenshotSelector('article[data-focusable=true][tabindex="0"]')
        .then(snap => {
          fs.writeFileSync(`./cache/${msgid}-${idx}.png`, snap);
          busy = 0;
          const goop = {
            msgid,
            idx,
            url: `cache/${msgid}-${idx}.png`,
            msg: 'shotted',
            type: 'twitter'
          };
          res2 ? res2(goop) : res(goop);
        })
        .catch(error => {
          console.log('twit fetch failed', url, msgid, error);
          busy = 0;
          const goop = {
            msgid,
            idx,
            url: null,
            msg: 'No preview',
            type: 'twitter'
          };
          res2 ? res2(goop) : res(goop);
        });
    } else {
      setTimeout(() => fire(url, msgid, idx, res), 2000);
    }
  });
};

export default fire;

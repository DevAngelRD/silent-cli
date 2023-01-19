const fs = require('fs');
const fsExtra = require('fs-extra');
const axios = require('axios').default;
const query = process.argv.slice(2).join(' ');
const readline = require('node:readline');
const ProgressBar = require('multi-progress');
const dotenv = require('dotenv');
const { promisify } = require('util');
const write = promisify(fs.writeFile);
const { setTimeout: wait } = require('timers/promises');

dotenv.config();

const { TEST_URL } = process.env;

const silent_url = TEST_URL || `https://silent-cloud-project-cloud.cyclic.app/get`;

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const input = text => new Promise(resolve => rl.question(`${text} `, a => {
     resolve(a);
     rl.close()
}));

if (query.trim() === '') return console.log(`No se ha proporcionado una búsqueda`);

(async () => {
     if (fs.existsSync('./data/')) {
          fsExtra.emptyDirSync('./data/');
     } else {
          fs.mkdirSync('./data/');
     }

     let amount = parseInt(await input(`Cantidad de archivos (Por defecto 5):`));
     let success = 0;

     if (isNaN(amount)) amount = 5;

     const multi = new ProgressBar(process.stderr);

     console.clear();

     const bar = multi.newBar('Descargando [:bar] :percent', {
          complete: '=',
          incomplete: ' ',
          width: 20,
          total: amount
     });

     for (let i = 0; i < amount; i++) {
          let m = null;

          try {
               const { data } = await axios.get(silent_url, {
                    params: {
                         q: JSON.stringify(Buffer.from(query).toJSON().data.map(i => i * 152)),
                         i
                    }
               });

               const buffer = Buffer.from(data.buffer.map(i => i / 1235));
               let filename = (new URL(data.original)).pathname.split('/').pop();
               if (filename.split('.').pop() === '') filename = filename + '.png';

               await write(`./data/${filename}`, buffer);

               success++;
               m = `\n✅ SUCCESS | FETCHED ${success}/${amount} IMAGES | ${amount - i - 1} left`;
          } catch (e) {
               // throw e;
               m = `\n❌ ERROR | FETCHED ${success}/${amount} IMAGES | ${amount - i - 1} left`;
          }

          console.clear();

          bar.tick();
          console.log(m);
          if(i + 1 !== amount ) await wait(2 * 1000);
     }

     console.log(`Se han descargado ${success}/${amount} archivos (${success / amount * 100}%)`);

     process.exit();
})();
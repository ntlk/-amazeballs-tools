const prompt = require('prompt');
const nconf = require('nconf');
const exec = require('child_process').exec;

// Configuration
nconf.use('file', {file: __dirname + '/config.json'})
nconf.load()

let title = nconf.get('title');
let number = nconf.get('number');
let wavFile = nconf.get('wavFile');
let siteDir = nconf.get('siteDir');

// Prepare schema for prompting
let schema = {
  properties: {
    title: {
      description: 'Enter the episode title',
      type: 'string',
      default: title,
      required: !title
    },
    number: {
      description: 'Enter the episode number',
      type: 'string',
      default: number,
      rerquired: !number
    },
    wavFile: {
      description: 'Enter the location of the wav file',
      type: 'string',
      default: wavFile,
      required: !wavFile
    },
    siteDir: {
      description: 'Enter the path to the site repo',
      type: 'string',
      default: siteDir,
      required: !siteDir
    }
  }
};

let log = (err, stdout, stderr) => { console.log(err, stdout, stderr) };

// Start prompting
prompt.message = '';
prompt.delimiter = '';
console.log('');
prompt.start();
prompt.get(schema, (err, result) => {
  nconf.set('title', result.title);
  nconf.set('number', result.number);
  nconf.set('wavFile', result.wavFile);
  nconf.set('siteDir', result.siteDir);
  nconf.save();
  let title = `Episode ${result.number} — ${result.title}`;

  // turn the wav into mp3, m4a and ogg
  let outputPath = `output/`;
  let outputName = `AMAZEBALLS#${result.number}`;
  let outputFilename = outputPath + outputName;
  exec(`ffmpeg -i ${result.wavFile} -vn -ar 44100 -ac 2 -ab 192k -f mp3 ${outputFilename}.mp3`, log);
  exec(`ffmpeg -i ${result.wavFile} -c:a libvorbis -qscale:a 5 ${outputFilename}.ogg`, log);
  exec(`ffmpeg -i ${result.wavFile} -c:a libfdk_aac -vbr 3 ${outputFilename}.m4a`, log);

  nconf.set('createdFiles', true');

  // update the file metadata
  // ...

  // upload to S3
  // save the links
  // add the links to the homepage
  // update the itunes feeds (both, lol)
  // push the homepage
  // add the new episode to huffduffer
  // tweet out the links
  // let tweetMp3 = `Episode ${number} is out! ${title} — get is as .mp3 ${mp3Url}`;
  // let tweetOgg = `Episode ${number} is out! ${title} — get is as freedom format .ogg ${oggUrl}`;

  console.log('The title is going to be ' + title);
  process.exit();
});

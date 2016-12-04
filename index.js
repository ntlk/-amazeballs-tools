const prompt = require('prompt');
const nconf = require('nconf');
const exec = require('child_process').exec;
const s3 = require('s3');

require('dotenv').config();

// Configuration
nconf.use('file', {file: __dirname + '/config.json'})
nconf.load()

let title = nconf.get('title');
let number = nconf.get('number');
let wavFile = nconf.get('wavFile');
let siteDir = nconf.get('siteDir');

let amazonAccessKeyId = process.env.AMAZON_ACCESS_KEY_ID;
let amazonSecretAccessKey = process.env.AMAZON_SECRET_ACCESS_KEY;
let bucket = process.env.AMAZON_BUCKET;

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

var client = s3.createClient({
  s3Options: {
    accessKeyId: amazonAccessKeyId,
    secretAccessKey: amazonSecretAccessKey,
    region: 'us-east-1'
  }
});

// Start prompting
prompt.message = '';
prompt.delimiter = '';

console.log('');
console.log('Amazetools 1.0.0');
console.log('');

prompt.start();
prompt.get(schema, (err, result) => {
  nconf.set('title', result.title);
  nconf.set('number', result.number);
  nconf.set('wavFile', result.wavFile);
  nconf.set('siteDir', result.siteDir);
  nconf.save();
  let title = `Episode ${result.number} — ${result.title}`;

  // clean the output dir
  exec('rm output/*', log);

  // turn the wav into mp3, m4a and ogg
  // this needs to be done with promises because sometimes we try to upload a non-existent file
  let outputPath = `output/`;
  let outputName = `AMAZEBALLS#${result.number}`;
  let outputFilename = outputPath + outputName;
  exec(`ffmpeg -i ${result.wavFile} -vn -ar 44100 -ac 2 -ab 192k -f mp3 ${outputFilename}.mp3`, log);
  exec(`ffmpeg -i ${result.wavFile} -c:a libvorbis -qscale:a 5 ${outputFilename}.ogg`, log);
  exec(`ffmpeg -i ${result.wavFile} -c:a libfdk_aac -vbr 3 ${outputFilename}.m4a`, log);
  exec('chmod -R +r output/');

  // update the file metadata
  // ...

  // upload to S3
  // this needs to be done with promises because sometimes we try to upload a non-existent file
  var params = {
    localDir: "output/",
    s3Params: {
      Bucket: bucket
    }
  };
  var uploader = client.uploadDir(params);
  uploader.on('error', function(err) {
    console.error("unable to sync:", err.stack);
  });
  uploader.on('progress', function() {
    console.log("progress", uploader.progressAmount, uploader.progressTotal);
  });
  uploader.on('end', function() {
    console.log("done uploading");
  });

  // save the links
  // add the links to the homepage
  // update the itunes feeds (both, lol)
  // push the homepage
  // add the new episode to huffduffer
  // tweet out the links
  // let tweetMp3 = `Episode ${number} is out! ${title} — get is as .mp3 ${mp3Url}`;
  // let tweetOgg = `Episode ${number} is out! ${title} — get is as freedom format .ogg ${oggUrl}`;

  console.log('The title is going to be ' + title);
});

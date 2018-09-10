const fs = require('fs');
const util = require('util');
const shell = require('shelljs');

var soundServerConfig = require('../config/soundserver.json');

/**
 * GET /channels
 * Get all channels
 */
exports.getStatus = (req, res) => {
  let cpuFreq = getCpuFreqData(soundServerConfig.cpuFreqDataPath);
  let cpuTemp = getCpuTempData(soundServerConfig.cpuTempDataPath);
  let systemData = [{'name':'CPU Frequency (kHz)','value':cpuFreq}, {'name':'CPU Temperature (°C)','value':cpuTemp}];
  var channels=getChannels();
  res.render('soundserver/status', {
    title: 'Status',
    channels,
    systemData
  });
};

exports.getSettings = (req, res) => {

  var channels=getChannels();
  res.render('soundserver/settings', {
    title: 'Settings',
    channels
  });
};


function getCpuTempData(file){
  let content = '';
  // Check that the file exists locally
  if(!fs.existsSync(file)) {
    content = 'n/a'
    console.log("File not found - " + file);
  }
  // The file *does* exist
  else {
    // Read the file and do anything you want
    content = fs.readFileSync(file, 'utf-8');
    content = [content.slice(0, 2), ',', content.slice(2)].join('');
  }
  return content;
}

function getCpuFreqData(file){
  let content = '';
  // Check that the file exists locally
  if(!fs.existsSync(file)) {
    content = 'n/a'
    console.log("File not found - " + file);
  }
  // The file *does* exist
  else {
    // Read the file and do anything you want
    content = fs.readFileSync(file, 'utf-8');
  }
  return content;
}


function getChannels(){
  var channelsCount=soundServerConfig.channels;
  let channels=[];
  for (let id=0; id<channelsCount; id++) {
    let item={};
    item.id=id;
    soundServerConfig.paramSet.forEach(function(param){
      try {
        var data = fs.readFileSync(soundServerConfig.dataDir+'/'+id +'/'+param, 'utf8');
        // console.log(data);
        item[param]=data;
      } catch(e) {
        console.log('Error:', e.stack);
      }
    });
    channels.push(item);
  }
  // console.log(channels);
  // [{ id: 1, status: 'Rob', volume: 'Title 1',frequency: 'Title 1',codec: 'Title 1'}]
  return channels;
}
  // if (!req.query.id) {
  //   req.assert('id','id should be an int value from 1 to 99').isInt({ min: 1, max: 99 })
  //   console.log(res);
  // }

  // td= channel.id
  // td= channel.status
  // td= channel.volume
  // td= channel.frequency
  // td.hidden-xs= channel.codec

  // req.assert('query.id', 'Name cannot be blank').notEmpty();
  // req.query.id
  // console.log(res);

function writeSettings(chId, param, val){
  console.log(param, val);
//   try {
//     var data = fs.readFileSync(dataDir+'/'+chId +'/'+param, 'utf8');
//     console.log(data);
//   } catch(e) {
//     console.log('Error:', e.stack);
//   }
  fs.writeFile(soundServerConfig.dataDir+'/'+chId +'/'+param, val, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved! "+param+' '+val);
  });
}

exports.postSettings = (req, res, next) => {
  req.assert('id', 'Поле id не может быть пустым.').notEmpty();
  // req.assert('status', 'status must be present').notEmpty();
  req.assert('volume', 'Значение volume должно быть int в диапазоне 0-100').isInt({ min: 0, max: 100 });
  req.assert('frequency', 'Поле frequency не может быть пустым.').notEmpty();
  req.assert('codec', 'Поле codec не может быть пустым.').notEmpty();

  req.assert('lowpass', 'Поле lowpass не может быть пустым.').isInt({ min: 0, max: 44100 });
  req.assert('highpass', 'Поле highpass не может быть пустым.').isInt({ min: 0, max: 44100 });

  let lowpass=req.body.lowpass;//граница ВЧ
  let highpass=req.body.highpass;//граница НЧ
  console.log("postSettings: lowpass-"+lowpass+" highpass-"+highpass);
  if (lowpass<=highpass) {
    req.flash('errors', { msg: 'Значение поля highpass должно быть меньше, чем lowpass.' });
    return res.redirect('/soundserver/settings');
  }

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/soundserver/settings');
  }

  var chId=req.body.id;

  shell.exec(soundServerConfig.scriptsDir+'/service.sh '+chId, function(code, stdout, stderr) {
    console.log('Exit code:', code);
    console.log('Program output:', stdout);
    console.log('Program stderr:', stderr);
  });


  // writeSettings(chId, 'id', req.body.id);
  writeSettings(chId, 'status', req.body.status ? true : false);
  writeSettings(chId, 'volume', req.body.volume);
  writeSettings(chId, 'frequency', req.body.frequency);
  writeSettings(chId, 'codec', req.body.codec);
  writeSettings(chId, 'lowpass', lowpass);
  writeSettings(chId, 'highpass', highpass);

  // User.findById(req.user.id, (err, user) => {
  //   if (err) { return next(err); }
  //   user.password = req.body.password;
  //   user.save((err) => {
  //     if (err) { return next(err); }
  //     req.flash('success', { msg: 'Password has been changed.' });
      req.flash('success', { msg: 'Настройки были успешно сохранены.' });
      res.redirect('/soundserver/settings');
  //   });
  // });
};

// GET /status?id=channelid
// GET /volume?id=channelid
// GET /frequency?id=channelid
// GET /codec?id=channelid

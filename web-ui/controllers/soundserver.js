const fs = require('fs');
const util = require('util');
const shell = require('shelljs');

var soundServerConfig = require('../config/soundserver.json');

/**
 * GET /channels
 * Get all channels
 */
exports.getStatus = (req, res) => {
  var channels=getChannels();
  res.render('soundserver/status', {
    title: 'Status',
    channels
  });
};

exports.getSettings = (req, res) => {
  var channels=getChannels();
  res.render('soundserver/settings', {
    title: 'Settings',
    channels
  });
   // getSettings('1','volume');
};

function getChannels(){
  var channelsCount=soundServerConfig.channels;
  let channels=[];
  for (let id=1; id<=channelsCount; id++) {
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
  // [{ id: 1, status: 'Rob', volume: 'Title 1',frequency: 'Title 1',codec: 'Title 1',port: 'Title 1'}]
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
  // td.hidden-xs= channel.port

  // req.assert('query.id', 'Name cannot be blank').notEmpty();
  // req.query.id
  // console.log(res);

exports.getChannelState = (req, res) => {
  let fromName;
  let fromEmail;
  if (!req.user) {
    req.assert('name', 'Name cannot be blank').notEmpty();
    req.assert('email', 'Email is not valid').isEmail();
  }
}

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

    console.log("The file was saved!");
  });
}

exports.postSettings = (req, res, next) => {
// id: 1
// status: on
// volume: 55
// frequency: 41000
// codec: opus
// port: 50000
  req.assert('id', 'id must be present').notEmpty();
  // req.assert('status', 'status must be present').notEmpty();
  req.assert('volume', 'volume should be int from 0-100').isInt({ min: 0, max: 100 });
  req.assert('frequency', 'frequency should be present').notEmpty();
  req.assert('codec', 'codec should be present').notEmpty();
  req.assert('port', 'port should be present in range 1024-65535').isInt({ min: 1024, max: 65535 });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/soundserver/settings');
  }

  var chId=req.body.id;

shell.exec('/home/best/soundserver-webui/soundserver-webui/service.sh '+chId, function(code, stdout, stderr) {
  console.log('Exit code:', code);
  console.log('Program output:', stdout);
  console.log('Program stderr:', stderr);
});


  // writeSettings(chId, 'id', req.body.id);
  writeSettings(chId, 'status', req.body.status ? true : false);
  writeSettings(chId, 'volume', req.body.volume);
  writeSettings(chId, 'frequency', req.body.frequency);
  writeSettings(chId, 'codec', req.body.codec);
  writeSettings(chId, 'port', req.body.port);

  // User.findById(req.user.id, (err, user) => {
  //   if (err) { return next(err); }
  //   user.password = req.body.password;
  //   user.save((err) => {
  //     if (err) { return next(err); }
  //     req.flash('success', { msg: 'Password has been changed.' });
      req.flash('success', { msg: 'Settings has been changed.' });
      res.redirect('/soundserver/settings');
  //   });
  // });
};

// GET /status?id=channelid
// GET /volume?id=channelid
// GET /frequency?id=channelid
// GET /codec?id=channelid
// GET /port?id=channelid

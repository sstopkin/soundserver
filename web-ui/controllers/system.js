const shell = require('shelljs');
const fs = require('fs');
var soundServerConfig = require('../config/soundserver.json');

exports.getGlobal = (req, res) => {

  res.render('system/global', {
    title: 'Основные настройки'
  });
};

exports.getNetworking = (req, res) => {
  let parameters = getNetworkingConfig();
  let networkingMode = getNetworkingMode();
  let host = getHostname();
  console.log(parameters);
  // let parameters = [{'name':'address','value':'1'}, {'name':'netmask','value':'2'}];
  res.render('system/networking', {
    title: 'Сетевые настройки',
    host,
    networkingMode,
    parameters
  });
};

exports.postNetworking = (req, res) => {
  req.assert('mode', 'mode must be present').notEmpty();
  req.assert('hostname', 'hostname must be present').notEmpty();
  let networkingMode = req.body.mode;

  if (networkingMode === 'static'){
    req.assert('address', 'Поле address не может быть пустым.').isIP();
    req.assert('netmask', 'Поле netmask не может быть пустым.').isIP();
    req.assert('gateway', 'Поле gateway не может быть пустым.').isIP();
    req.assert('dns1', 'Поле dns1 не может быть пустым.').isIP();
    req.assert('dns2', 'Поле dns2 не может быть пустым.').isIP();
  }

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/system/networking');
  }

  writeSettings('mode', networkingMode);
  writeSettings('address', req.body.address);
  writeSettings('netmask', req.body.netmask);
  writeSettings('gateway', req.body.gateway);
  writeSettings('dns1', req.body.dns1);
  writeSettings('dns2', req.body.dns2);
  writeSettings('hostname', req.body.hostname);

  shell.exec(soundServerConfig.scriptsDir+'/networking.sh', function(code, stdout, stderr) {
    console.log('Exit code:', code);
    console.log('Program output:', stdout);
    console.log('Program stderr:', stderr);
  });

  req.flash('success', { msg: 'Требуется перезапустить сервер для применения новых параметров.' });
  res.redirect('/system/networking');
}

function writeSettings(param, val){
  console.log(param, val);
//   try {
//     var data = fs.readFileSync(dataDir+'/'+chId +'/'+param, 'utf8');
//     console.log(data);
//   } catch(e) {
//     console.log('Error:', e.stack);
//   }
  fs.writeFile(soundServerConfig.configDir+'/networking/'+param, val, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved! "+param+' '+val);
  });
}

exports.rebootSystem = (req, res) => {
  req.flash('success', { msg: 'Перезапуск системы. Пожалуйста, подождите..' });
  console.log("rebootSystem");
  res.redirect('/system');
}

function getNetworkingConfig(){
  let parameters=[];
  soundServerConfig.paramSetNetworking.forEach(function(param){
    let item={};
    try {
      var data = fs.readFileSync(soundServerConfig.configDir+'/networking/'+param, 'utf8');
      // console.log(data);
      item.name=param;
      item.value=data;
    } catch(e) {
      console.log('Error:', e.stack);
    }
    parameters.push(item);
  });
  return parameters;
}

function getNetworkingMode(){
  return fs.readFileSync(soundServerConfig.configDir+'/networking/mode', 'utf8');
}

function getHostname(){
  return fs.readFileSync(soundServerConfig.configDir+'/networking/hostname', 'utf8');
}

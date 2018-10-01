const shell = require('shelljs');
const fs = require('fs');
var soundServerConfig = require('../config/soundserver.json');

exports.getGlobal = (req, res) => {
  let date = getParameterByName('global', 'date');
  let time = getParameterByName('global', 'time');
  let timezone = getParameterByName('global', 'timezone');
  let parameters = [{'title':'Дата (ГГГГ-ММ-ДД)', 'name':'date', 'value':date},
      {'title':'Время (ЧЧ:ММ:СС)', 'name':'time', 'value':time},
      {'title':'Часовой пояс (UTCXX)', 'name':'timezone', 'value':timezone}];
  res.render('system/global', {
    title: 'Основные настройки',
    parameters
  });
};

exports.getNetworking = (req, res) => {
  let parameters = getNetworkingConfig();
  let networkingMode = getParameterByName('networking', 'mode');
  let host = getParameterByName('networking', 'hostname');
  console.log('getNetworking: ' + parameters);
  // let parameters = [{'name':'address','value':'1'}, {'name':'netmask','value':'2'}];
  res.render('system/networking', {
    title: 'Сетевые настройки',
    host,
    networkingMode,
    parameters
  });
};

exports.postGlobal = (req, res) => {
  req.assert('date', 'Поле date не может быть пустым.').notEmpty();
  req.assert('time', 'Поле time не может быть пустым.').notEmpty();
  req.assert('timezone', 'Поле timezone не может быть пустым.').notEmpty();
  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/system/global');
  }

  let date = req.body.date;
  let time = req.body.time;
  console.log("date- "+ date + " time-" + time);

  if (!isValidDate(date)) {
    req.flash('errors', { msg: 'Некорректное значение поля date.' });
    return res.redirect('/system/global');
  }

  if (!isValidTime(time)) {
    req.flash('errors', { msg: 'Некорректное значение поля time.' });
    return res.redirect('/system/global');
  }

  writeSettings('global', 'date', date);
  writeSettings('global', 'time', time);
  writeSettings('global', 'timezone', req.body.timezone);

  shell.exec(soundServerConfig.scriptsDir+'/datetime.sh', function(code, stdout, stderr) {
    console.log('Exit code:', code);
    console.log('Program output:', stdout);
    console.log('Program stderr:', stderr);
  });

  req.flash('success', { msg: 'Требуется перезапустить сервер для применения новых параметров.' });
  res.redirect('/system/global');
}

exports.postNetworking = (req, res) => {
  req.assert('mode', 'Поле mode не может быть пустым.').notEmpty();
  req.assert('hostname', 'Поле hostname не может быть пустым.').notEmpty();
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

  writeSettings('networking', 'mode', networkingMode);
  writeSettings('networking', 'address', req.body.address);
  writeSettings('networking', 'netmask', req.body.netmask);
  writeSettings('networking', 'gateway', req.body.gateway);
  writeSettings('networking', 'dns1', req.body.dns1);
  writeSettings('networking', 'dns2', req.body.dns2);
  writeSettings('networking', 'hostname', req.body.hostname);

  shell.exec(soundServerConfig.scriptsDir+'/networking.sh', function(code, stdout, stderr) {
    console.log('Exit code:', code);
    console.log('Program output:', stdout);
    console.log('Program stderr:', stderr);
  });

  req.flash('success', { msg: 'Требуется перезапустить сервер для применения новых параметров.' });
  res.redirect('/system/networking');
}

function writeSettings(type, param, val){
  console.log(param, val);
//   try {
//     var data = fs.readFileSync(dataDir+'/'+chId +'/'+param, 'utf8');
//     console.log(data);
//   } catch(e) {
//     console.log('Error:', e.stack);
//   }
  fs.writeFile(soundServerConfig.configDir+'/'+type+'/'+param, val, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved! "+type+' '+param+' '+val);
  });
}

exports.rebootSystem = (req, res) => {
  req.flash('success', { msg: 'Перезапуск системы. Пожалуйста, подождите..' });
  console.log("rebootSystem");
  var exec = require('child_process').exec;
  exec('systemctl reboot', function(code, stdout, stderr) {
    console.log('Exit code:', code);
    console.log('Program output:', stdout);
    console.log('Program stderr:', stderr);
  });
  res.redirect('/system/global');
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

function getParameterByName(type, paramName){
  return fs.readFileSync(soundServerConfig.configDir+'/'+type+'/'+paramName, 'utf8');
}

// https://stackoverflow.com/a/14892796
function isValidTime(timeString) {
    var timeFormat = /^(?:2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]$/;
    return timeFormat.test(timeString);
}

// https://stackoverflow.com/questions/6177975/how-to-validate-date-with-format-mm-dd-yyyy-in-javascript
function isValidDate(dateString) {
    // First check for the pattern
    var regex_date = /^\d{4}\-\d{1,2}\-\d{1,2}$/;

    if(!regex_date.test(dateString))
    {
        return false;
    }

    // Parse the date parts to integers
    var parts   = dateString.split("-");
    var day     = parseInt(parts[2], 10);
    var month   = parseInt(parts[1], 10);
    var year    = parseInt(parts[0], 10);

    // Check the ranges of month and year
    if(year < 1000 || year > 3000 || month == 0 || month > 12)
    {
        return false;
    }

    var monthLength = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

    // Adjust for leap years
    if(year % 400 == 0 || (year % 100 != 0 && year % 4 == 0))
    {
        monthLength[1] = 29;
    }

    // Check the range of the day
    return day > 0 && day <= monthLength[month - 1];
}

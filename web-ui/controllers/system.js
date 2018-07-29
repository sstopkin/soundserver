const shell = require('shelljs');
const fs = require('fs');
var soundServerConfig = require('../config/soundserver.json');

exports.getSystem = (req, res) => {
  let cpuFreq = getCpuFreqData(soundServerConfig.cpuFreqDataPath);
  let cpuTemp = getCpuTempData(soundServerConfig.cpuTempDataPath);
  let systemData = [{'name':'cpuFreq (MHz)','value':cpuFreq}, {'name':'cpuTemp (°C)','value':cpuTemp}];
  res.render('system/system', {
    title: 'System',
    systemData
  });
};

exports.rebootSystem = (req, res) => {
  req.flash('success', { msg: 'Restarting system. Please wait..' });
  console.log("rebootSystem");
  res.redirect('/system');
}

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
    content = content.slice(0, -3);
  }
  return content;
}

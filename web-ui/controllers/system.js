const shell = require('shelljs');

exports.getSystem = (req, res) => {
  res.render('system/system', {
    title: 'System'
  });
};

exports.rebootSystem = (req, res) => {
  req.flash('success', { msg: 'Restarting system. Please wait..' });
  console.log("rebootSystem");
  res.redirect('/system');
}

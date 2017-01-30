const electron = require('electron');
const session = require('electron').session;
if(require('electron-squirrel-startup')) return;

// Module to control application life.
const {app} = electron
// Module to create native browser window.
const {BrowserWindow} = electron;

const autoUpdater = require('electron').autoUpdater;
const appVersion = require('./package.json').version;
const os = require('os').platform();

var updateFeed = 'http://localhost:3000/releases/win32/0.0.2/Autographa';

autoUpdater.setFeedURL(updateFeed);
autoUpdater.checkForUpdates();
// autoUpdater.quitAndInstall();

// autoUpdater.on('error', (e) => {
//     console.error(e.message)
//   });

//   autoUpdater.on('checking-for-update', () => {
//     console.info('Checking for update...')
//   });

//   autoUpdater.on('update-available', () => {
//     console.info('Found available update!')
//   });

//   autoUpdater.on('update-not-available', () => {
//     console.info('There are no updates available.')
//   });

  autoUpdater.on('update-downloaded', () => {
    console.info('update downloaded.');
    autoUpdater.quitAndInstall();
  });




// this should be placed at top of main.js to handle setup events quickly
if (handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
}

function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }

  const ChildProcess = require('child_process');
  const path = require('path');

  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Setup.exe'));
  const exeName = path.basename(process.execPath);

  const spawn = function(command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
    } catch (error) {}

    return spawnedProcess;
  };

  const spawnUpdate = function(args) {
    return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Install desktop and start menu shortcuts
      spawnUpdate(['--createShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove desktop and start menu shortcuts
      spawnUpdate(['--removeShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated

      app.quit();
      return true;
  }
};

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
    width: 800,
	height: 600,
    'min-width': 600,
    'min-height': 300,
    'accept-first-mouse': true,
    'title-bar-style': 'hidden',
    'webPreferences': {'session': session},
    show: false
    });

    // and load the index.html of the app.
    win.loadURL(`file:${__dirname}/app/views/index.html`);

    //loading window gracefully
    win.once('ready-to-show', () => {
	// Open the DevTools.
	//win.webContents.openDevTools();	
	win.maximize();
        win.show();
    });

    // Emitted when the window is closed.
    win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
	win = null;
	if (process.platform !== 'darwin') {
	    app.quit();
	}
    });
}

var dbSetup = new Promise(
    function (resolve, reject) {
	// Setup database.
	var dbUtil = require(`${__dirname}/app/util/DbUtil.js`);
	dbUtil.setupTargetDb
	    .then((response) => {
		console.log(response);
		return dbUtil.setupRefDb;
	    })
	    .then((response) => {
		console.log(response);
		resolve(response);
	    })
	    .catch((err) => {
		console.log('Error while DB setup. ' + err);
		reject(err);
	    });
    });

function preProcess() {
    dbSetup
	.then((response) => {
	    createWindow();
	})
	.catch((err) => {
	    console.log('Error while App intialization.' + err);
	});
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', preProcess);



// if (process.env.NODE_ENV !== 'development') {
//   updateFeed = os === 'darwin' ?
//     'https://mysite.com/updates/latest' :
//     'http://localhost/releases/win32';
// }





// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
    app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
    createWindow();
    }
});


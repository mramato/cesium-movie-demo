'use strict';

var electron = require('electron');
var fsExtra = require('fs-extra');
var ffmpeg = require('./ffmpeg');

var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
var ipcMain = electron.ipcMain;

var width = 640;
var height = 360;
var outputDirectory = 'output';
var currentFrame = 0;
var totalFrames = 300;

app.on('ready', function () {
    var browserWindow = new BrowserWindow({
        enableLargerThanScreen: true,
        show: false,
        webPreferences: {
            nodeIntegration: true
        },
        resizable: false
    });
    browserWindow.setMenu(null);
    browserWindow.setSize(width, height);

    browserWindow.once('ready-to-show', function () {
        var frame = 0;
        ipcMain.on('frameReady', function (event, arg) {
            console.log('Frame ' + ++currentFrame + ' of ' + totalFrames);
            browserWindow.capturePage({x: 0, y: 0, width: width, height: height}).then(function (img) {
                var file = outputDirectory + '/' + ("00000" + frame++).slice(-5) + '.png';
                return fsExtra.outputFile(file, img.toPNG())
                    .then(function () {
                        browserWindow.webContents.send('nextFrame', {});
                    });
            })
            .catch(function (err) {
                console.log(err);
                browserWindow.close();
            });
        });

        ipcMain.on('done', function (event, arg) {
            var timemark = null;
            ffmpeg(outputDirectory + '/%05d.png')
                .inputFPS(30)
                .outputFPS(30)
                .noAudio()
                .videoBitrate(1024 * 20)
                .format('avi')
                .on('progress', function (progress) {
                    if (progress.timemark !== timemark) {
                        timemark = progress.timemark;
                        console.log('Time mark: ' + timemark + "...");
                    }
                })
                .on('end', function () {
                    console.log('file has been converted succesfully');
                    browserWindow.close();
                })
                .on('error', function (err) {
                    console.log('an error happened: ' + err.message);
                    browserWindow.close();
                })
                .save('movie.avi');
        });

        browserWindow.webContents.send('beginCapture', {totalFrames: totalFrames});
    });

    browserWindow.loadURL('file://' + __dirname + '/browser.html');
});

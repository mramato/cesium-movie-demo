'use strict';

var ffmpeg = require('@ffmpeg-installer/ffmpeg');
var fluentFfmpeg = require('fluent-ffmpeg');

fluentFfmpeg.setFfmpegPath(ffmpeg.path);

module.exports = fluentFfmpeg;

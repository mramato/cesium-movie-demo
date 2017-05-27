'use strict';

var electron = require('electron');
var Cesium = require('cesium');

var viewer;
var totalFrames;
var currentFrame;
var tweenCollection;

function beginCapture(event, options) {
    currentFrame = 0;
    totalFrames = options.totalFrames;

    viewer = new Cesium.CesiumWidget('cesiumContainer', {
        useDefaultRenderLoop: false,
        terrainProvider: new Cesium.CesiumTerrainProvider({
            url: 'https://assets.agi.com/stk-terrain/world',
            requestWaterMask: true,
            requestVertexNormals: true
        })
    });

    var scene = viewer.scene;

    scene.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(-73.98580932617188, 40.74843406689482, 363.34038727246224)
    });

    var tween = Cesium.CameraFlightPath.createTween(scene, {
        duration: totalFrames - 1,
        destination: Cesium.Cartesian3.fromDegrees(-73.98585975679403, 40.75759944127251, 186.50838555841779),
        heading: Cesium.Math.toRadians(200.0),
        pitch: Cesium.Math.toRadians(-50.0),
        roll: 0,
        easingFunction: Cesium.EasingFunction.QUARTIC_IN_OUT
    });

    tweenCollection = new Cesium.TweenCollection();
    tweenCollection.add(tween);

    nextFrame();
}

function nextFrame() {
    if (currentFrame === totalFrames) {
        ipcRenderer.send('done');
        return;
    }

    tweenCollection.update(currentFrame++);
    var scene = viewer.scene;
    var remove = scene.postRender.addEventListener(function () {
        var surface = scene.globe._surface;
        var complete = surface.tileProvider.ready && surface._tileLoadQueueHigh.length === 0 && surface._tileLoadQueueMedium.length === 0 && surface._tileLoadQueueLow.length === 0 && surface._debug.tilesWaitingForChildren === 0;

        if (complete) {
            remove();
            ipcRenderer.send('frameReady');
        } else {
            setTimeout(function () {
                viewer.resize();
                viewer.render();
            }, 0);
        }
    });
    viewer.resize();
    viewer.render();
}

var ipcRenderer = electron.ipcRenderer;
ipcRenderer.on('beginCapture', beginCapture);
ipcRenderer.on('nextFrame', nextFrame);

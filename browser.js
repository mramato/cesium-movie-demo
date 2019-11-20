'use strict';

var electron = require('electron');

var viewer;
var totalFrames;
var currentFrame;
var tilesets = [];


function beginCapture(event, options) {
    currentFrame = 0;
    totalFrames = options.totalFrames;

    // A simple demo of 3D Tiles feature picking with hover and select behavior
    // Building data courtesy of NYC OpenData portal: http://www1.nyc.gov/site/doitt/initiatives/3d-building.page
    viewer = new Cesium.CesiumWidget('cesiumContainer', {
        shadows: true,
        useDefaultRenderLoop: false,
        terrainProvider: Cesium.createWorldTerrain()
    });

    viewer.clock.currentTime = Cesium.JulianDate.fromIso8601('2018-12-31T20:00:00Z');

    // var shadowMap = viewer.shadowMap;
    // shadowMap.maximumDistance = 10000.0;
    // shadowMap.softShadows = true;
    // shadowMap.size = 2048;

    viewer.scene.globe.depthTestAgainstTerrain = true;

    var camera = viewer.scene.camera;
    camera.up = new Cesium.Cartesian3(0.32089989928124085, 0.6515339929538302, 0.687405783120078);
    camera.direction = new Cesium.Cartesian3(-0.19586057825253983, 0.7557527020761972, -0.6248811784580389);
    camera.position = new Cesium.Cartesian3(1335689.493191067, -4651019.882614981, 4143982.6102668047);

    // Load the NYC buildings tileset
    var tileset = new Cesium.Cesium3DTileset({ url: Cesium.IonResource.fromAssetId(5741) });
    viewer.scene.primitives.add(tileset);
    tilesets.push(tileset);

    nextFrame();
}

function nextFrame() {
    if (currentFrame >= totalFrames) {
        ipcRenderer.send('done');
        return;
    }
    currentFrame++;

    viewer.clock.currentTime = Cesium.JulianDate.addDays(viewer.clock.currentTime, 1, viewer.clock.currentTime);

    var div = document.getElementById('timestamp');

    // var greg = Cesium.JulianDate.toGregorianDate(viewer.clock.currentTime);
    // if(greg.day === 10 && greg.month === 3){
    //     viewer.clock.currentTime = Cesium.JulianDate.addHours(viewer.clock.currentTime, 1, viewer.clock.currentTime);
    // }
    // if(greg.day === 3 && greg.month === 11){
    //     viewer.clock.currentTime = Cesium.JulianDate.addHours(viewer.clock.currentTime, -1, viewer.clock.currentTime);
    // }
    // greg = Cesium.JulianDate.toGregorianDate(viewer.clock.currentTime);
    // div.textContent = `${greg.year}-${greg.month}-${greg.day} 3:00pm EST`;

    var greg = Cesium.JulianDate.toGregorianDate(viewer.clock.currentTime);
    div.textContent = `${greg.year}-${greg.month}-${greg.day} ${greg.hour}:00 UTC`;    

    var scene = viewer.scene;
    var remove = scene.postRender.addEventListener(function () {
        var complete = _updateSceneComplete();

        if (complete) {
            remove();
            ipcRenderer.send('frameReady');
        } else {
            requestAnimationFrame(function () {
                viewer.resize();
                viewer.render();
            });
        }
    });
    viewer.resize();
    viewer.render();
}

function _updateSceneComplete() {
    var surface = viewer.scene.globe._surface;

    //A rather obtuse check to see if Entity geometry is complete.
    //var entitiesComplete = viewer.clockViewModel.canAnimate;

    var complete = surface.tileProvider.ready && surface._tileLoadQueueHigh.length === 0 && surface._tileLoadQueueMedium.length === 0 && surface._tileLoadQueueLow.length === 0 && surface._debug.tilesWaitingForChildren === 0;

    //If not, check all of the 3D tilesets.
    if (complete) {
        var length = tilesets.length;
        for (var i = 0; i < length; i++) {
            var tileset = tilesets[i];
            complete = tileset.ready && tileset.tilesLoaded;
            if (!complete) {
                break;
            }
        }
    }

    return complete;
}

var ipcRenderer = electron.ipcRenderer;
ipcRenderer.on('beginCapture', beginCapture);
ipcRenderer.on('nextFrame', nextFrame);

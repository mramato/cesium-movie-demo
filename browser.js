"use strict";

var electron = require("electron");

var viewer;
var totalFrames;
var currentFrame;
var tweenCollection;
var tilesets = [];


function beginCapture(event, options) {
  currentFrame = 0;
  totalFrames = options.totalFrames;

  viewer = new Cesium.CesiumWidget("cesiumContainer", {
    useDefaultRenderLoop: false,
    terrainProvider: Cesium.createWorldTerrain()
  });
  viewer.useBrowserRecommendedResolution = false;
  var scene = viewer.scene;

  scene.postProcessStages.fxaa.enabled = true;

  scene.camera.setView({
    destination: new Cesium.Cartesian3(
      1333016.8260117217,
      -4654705.764139854,
      4138050.356968003
    ),
    orientation: {
      heading: 1.1938950193608342,
      pitch: -0.40519439739471186,
      roll: 0.003359818633623668,
    },
  });

  var tween = Cesium.CameraFlightPath.createTween(scene, {
    duration: totalFrames - 1,
    destination: new Cesium.Cartesian3(
      1334234.3970472903,
      -4653924.033165023,
      4138472.8300507637
    ),
    heading: 1.6108560792554636,
    pitch: -0.549513523795369,
    roll: 0.0038888274125952194,
    easingFunction: Cesium.EasingFunction.QUARTIC_IN_OUT,
  });

  tweenCollection = new Cesium.TweenCollection();
  tweenCollection.add(tween);

  var tileset = new Cesium.Cesium3DTileset({
    url: Cesium.IonResource.fromAssetId(97829),
  });
  tileset.maximumScreenSpaceError = 1;
  viewer.scene.primitives.add(tileset);
  tilesets.push(tileset);

  nextFrame();
}

function nextFrame() {
  if (currentFrame === totalFrames) {
    ipcRenderer.send("done");
    return;
  }

  tweenCollection.update(currentFrame++);
  var scene = viewer.scene;
  var remove = scene.postRender.addEventListener(function () {
    var complete = _updateSceneComplete();

    if (complete) {
      remove();
      setTimeout(function () {
        ipcRenderer.send("frameReady");
      }, 0);
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

function _updateSceneComplete() {
  var surface = viewer.scene.globe._surface;

  //A rather obtuse check to see if Entity geometry is complete.
  //var entitiesComplete = viewer.clockViewModel.canAnimate;

  var complete =
    viewer.scene.globe.tilesLoaded &&
    surface._debug.tilesWaitingForChildren === 0 &&
    Cesium.RequestScheduler.statistics.numberOfActiveRequests === 0;

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
ipcRenderer.on("beginCapture", beginCapture);
ipcRenderer.on("nextFrame", nextFrame);

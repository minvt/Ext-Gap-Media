/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

var argscheck = require('cordova/argscheck'),
    utils = require('cordova/utils'),
    exec = require('cordova/exec');

var mediaObjects = {};

/**
 * This class provides access to the device media, interfaces to both sound and video
 *
 * @constructor
 * @param src                   The file name or url to play
 * @param successCallback       The callback to be called when the file is done playing or recording.
 *                                  successCallback()
 * @param errorCallback         The callback to be called if there is an error.
 *                                  errorCallback(int errorCode) - OPTIONAL
 * @param statusCallback        The callback to be called when media status has changed.
 *                                  statusCallback(int statusCode) - OPTIONAL
 */
var MediaEx = function(src, successCallback, errorCallback, statusCallback) {
    argscheck.checkArgs('SFFF', 'MediaEx', arguments);
    this.id = utils.createUUID();
    mediaObjects[this.id] = this;
    this.src = src;
    this.successCallback = successCallback;
    this.errorCallback = errorCallback;
    this.statusCallback = statusCallback;
    this._duration = -1;
    this._position = -1;
    exec(null, this.errorCallback, "MediaEx", "create", [this.id, this.src]);
};

// Media messages
MediaEx.MEDIA_STATE = 1;
MediaEx.MEDIA_DURATION = 2;
MediaEx.MEDIA_POSITION = 3;
MediaEx.MEDIA_ERROR = 9;

// Media states
MediaEx.MEDIA_NONE = 0;
MediaEx.MEDIA_STARTING = 1;
MediaEx.MEDIA_RUNNING = 2;
MediaEx.MEDIA_PAUSED = 3;
MediaEx.MEDIA_STOPPED = 4;
MediaEx.MEDIA_MSG = ["None", "Starting", "Running", "Paused", "Stopped"];

// "static" function to return existing objs.
MediaEx.get = function(id) {
    return mediaObjects[id];
};

/**
 * Start or resume playing audio file.
 */
MediaEx.prototype.play = function(options) {
    exec(null, null, "MediaEx", "startPlayingAudio", [this.id, this.src, options]);
};

/**
 * Stop playing audio file.
 */
MediaEx.prototype.stop = function() {
    var me = this;
    exec(function() {
        me._position = 0;
    }, this.errorCallback, "MediaEx", "stopPlayingAudio", [this.id]);
};

/**
 * Seek or jump to a new time in the track..
 */
MediaEx.prototype.seekTo = function(milliseconds) {
    var me = this;
    exec(function(p) {
        me._position = p;
    }, this.errorCallback, "MediaEx", "seekToAudio", [this.id, milliseconds]);
};

/**
 * Pause playing audio file.
 */
MediaEx.prototype.pause = function() {
    exec(null, this.errorCallback, "MediaEx", "pausePlayingAudio", [this.id]);
};

/**
 * Get duration of an audio file.
 * The duration is only set for audio that is playing, paused or stopped.
 *
 * @return      duration or -1 if not known.
 */
MediaEx.prototype.getDuration = function() {
    return this._duration;
};

/**
 * Get position of audio.
 */
MediaEx.prototype.getCurrentPosition = function(success, fail) {
    var me = this;
    exec(function(p) {
        me._position = p;
        success(p);
    }, fail, "MediaEx", "getCurrentPositionAudio", [this.id]);
};

/**
 * Start recording audio file.
 */
MediaEx.prototype.startRecord = function() {
    exec(null, this.errorCallback, "MediaEx", "startRecordingAudio", [this.id, this.src]);
};

/**
 * Stop recording audio file.
 */
MediaEx.prototype.stopRecord = function() {
    exec(null, this.errorCallback, "MediaEx", "stopRecordingAudio", [this.id]);
};

/**
 * Release the resources.
 */
MediaEx.prototype.release = function() {
    exec(null, this.errorCallback, "MediaEx", "release", [this.id]);
};

/**
 * Adjust the volume.
 */
MediaEx.prototype.setVolume = function(volume) {
    exec(null, null, "MediaEx", "setVolume", [this.id, volume]);
};

/**
 * custom Start recording audio file.
 */
MediaEx.prototype.startRecordAsync = function() {
    exec(null, this.errorCallback, "MediaEx", "startRecordAsync", [this.id, this.src]);
};

/**
 * custom Stop recording audio file.
 */
MediaEx.prototype.stopRecordAsync = function() {
    exec(null, this.errorCallback, "MediaEx", "stopRecordAsync", [this.id]);
};


/**
 * Audio has status update.
 * PRIVATE
 *
 * @param id            The media object id (string)
 * @param msgType       The 'type' of update this is
 * @param value         Use of value is determined by the msgType
 */
MediaEx.onStatus = function(id, msgType, value) {

    var media = mediaObjects[id];

    if(media) {
        switch(msgType) {
            case MediaEx.MEDIA_STATE :
                media.statusCallback && media.statusCallback(value);
                if(value == MediaEx.MEDIA_STOPPED) {
                    media.successCallback && media.successCallback();
                }
                break;
            case MediaEx.MEDIA_DURATION :
                media._duration = value;
                break;
            case MediaEx.MEDIA_ERROR :
                media.errorCallback && media.errorCallback(value);
                break;
            case MediaEx.MEDIA_POSITION :
                media._position = Number(value);
                break;
            default :
                console.error && console.error("Unhandled Media.onStatus :: " + msgType);
                break;
        }
    }
    else {
         console.error && console.error("Received Media.onStatus callback for unknown media :: " + id);
    }

};

module.exports = MediaEx;

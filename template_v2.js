// Facebook Pixel - GTM Custom Template (Sandboxed JS)

// Required sandbox APIs
const log = require('logToConsole');
const injectScript = require('injectScript');
const copyFromWindow = require('copyFromWindow');
const setInWindow = require('setInWindow');
const getType = require('getType');

// Read fields
var pixelInput = data.fbPixel;
var eventName = data.eventName || 'PageView';
var eventParams = data.eventParams;
var locale = data.loadLocale || 'en_US';

// Helpers without regex (sandbox-safe)
function stripWhitespace(str) {
  var out = '';
  for (var i = 0; i < str.length; i++) {
    var ch = str.charAt(i);
    if (ch !== ' ' && ch !== '\t' && ch !== '\n' && ch !== '\r' && ch !== '\f') {
      out += ch;
    }
  }
  return out;
}

function normalizeIds(input) {
  var t = getType(input);
  if (t === 'string') {
    var s = stripWhitespace(input);
    if (s.indexOf(',') > -1) {
      var parts = s.split(',');
      var out = [];
      for (var i = 0; i < parts.length; i++) {
        if (parts[i]) out.push(parts[i]);
      }
      return out;
    }
    return s ? [s] : [];
  }
  if (t === 'array') {
    var outArr = [];
    // Safe loop: no Array constructor, no Array.isArray
    for (var j = 0; j < input.length; j++) {
      var v = input[j];
      if (getType(v) === 'string' && v) {
        outArr.push(stripWhitespace(v));
      }
    }
    return outArr;
  }
  return [];
}

var pixelIds = normalizeIds(pixelInput);

// Ensure fbq shim (queue) before script load
function ensureFbqShim() {
  var existingFbq = copyFromWindow('fbq');
  if (existingFbq) return existingFbq;

  var queue = copyFromWindow('fbqqueue');
  if (getType(queue) !== 'array') {
    queue = [];
    setInWindow('fbqqueue', queue);
  }

  var shim = function() {
    queue.push(arguments);
    setInWindow('fbqqueue', queue);
  };

  setInWindow('fbq', shim);
  return shim;
}

var fbq = ensureFbqShim();

// Track which pixel IDs have been initialized (idempotent)
function getInitializedIds() {
  var ids = copyFromWindow('_fbq_gtm_ids');
  if (getType(ids) !== 'array') {
    ids = [];
    setInWindow('_fbq_gtm_ids', ids);
  }
  return ids;
}

function markInitialized(id) {
  var ids = getInitializedIds();
  var found = false;
  for (var i = 0; i < ids.length; i++) {
    if (ids[i] === id) { found = true; break; }
  }
  if (!found) {
    ids.push(id);
    setInWindow('_fbq_gtm_ids', ids);
  }
}

function alreadyInitialized(id) {
  var ids = getInitializedIds();
  for (var i = 0; i < ids.length; i++) {
    if (ids[i] === id) return true;
  }
  return false;
}

// Init pixels (only if fbq is callable)
if (fbq && getType(fbq) === 'function') {
  for (var p = 0; p < pixelIds.length; p++) {
    var pid = pixelIds[p];
    if (!alreadyInitialized(pid)) {
      fbq('init', pid);
      markInitialized(pid);
    }
  }

  // Track event (PageView by default)
  if (eventName) {
    if (getType(eventParams) === 'object') {
      fbq('track', eventName, eventParams);
    } else {
      fbq('track', eventName);
    }
  }
}

// Load FB script
var src = 'https://connect.facebook.net/' + locale + '/fbevents.js';
injectScript(
  src,
  function() {
    if (data && data.gtmOnSuccess) { data.gtmOnSuccess(); }
  },
  function() {
    if (data && data.gtmOnFailure) { data.gtmOnFailure(); }
  }
);

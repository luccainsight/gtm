// ===== SETUP CODE - EXECUTED BEFORE EACH TEST (no Array refs) =====

const getDefaultMockData = function() {
  return {
    fbPixel: '1234567890123456',
    eventName: 'PageView',
    eventParams: { source: 'unit_test' },
    loadLocale: 'en_US',
    gtmOnSuccess: mock('gtmOnSuccess'),
    gtmOnFailure: mock('gtmOnFailure')
  };
};

const setupCommonMocks = function() {
  // injectScript: simulate successful load
  mock('injectScript', function(url, onSuccess, onFailure) {
    if (onSuccess) { onSuccess(); }
  });

  mock('logToConsole', function(){});

  // getType without using Array / Array.isArray
  mock('getType', function(v) {
    var t = typeof v;
    if (v === null) return 'null';
    if (t === 'object') {
      // Heuristic: treat as array if it quacks like one (no global Array usage)
      var looksLikeArray =
        v &&
        typeof v.length === 'number' &&
        typeof v.push === 'function' &&
        typeof v.splice === 'function';
      if (looksLikeArray) return 'array';
    }
    return t;
  });

  // Simulated "window" store for copy/set
  var __w__ = {};

  mock('copyFromWindow', function(key) {
    return __w__[key];
  });

  mock('setInWindow', function(key, value) {
    __w__[key] = value;
  });

  // Optional stubs (safe if never called)
  mock('createQueue', function(){ return []; });
  mock('aliasInWindow', function(){});
  mock('makeTableMap', function(){ return {}; });
};

setupCommonMocks();

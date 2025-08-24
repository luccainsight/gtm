// ===== TEST CODE =====

// First run: no fbq injected; template should create shim and proceed
var data1 = getDefaultMockData();
runCode(data1);

// Basic assertions
assertApi('injectScript').wasCalled();
assertApi('gtmOnSuccess').wasCalled();

// Second run: pre-inject a fbq into the simulated window and ensure calls hit it
var fbqCalls = [];
var mockFbq = function() {
  fbqCalls.push(arguments);
};

var cw = require('copyFromWindow');
var siw = require('setInWindow');
siw('fbq', mockFbq);

var data2 = getDefaultMockData();
runCode(data2);

// We expect the template to call fbq (init and track) on the pre-injected mock
assertThat(fbqCalls.length).isGreaterThan(0);

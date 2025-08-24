// Facebook Pixel GTM Template Tests

// Setup mock data
const mockData = {
    fbPixel: '12345,23456',
    eventSetup: {
      standard: {
        value: 'PageView'
      }
    },
    consentGranted: {
      true: 'true'
    },
    advancedMatching: {
      enable: false
    },
    customDataParam: {
      dataParameter: [
        {parameterName: 'value', parameterValue: '100'},
        {parameterName: 'currency', parameterValue: 'USD'}
      ]
    },
    objectProperties: {
      simpleTable1: [
        {propNames: 'content_type', propValue: 'product'},
        {propNames: 'content_name', propValue: 'Test Product'}
      ]
    },
    moreSettings: {
      autoConfig: {
        disable: false
      },
      eventTracking: {
        disable: false
      },
      eventId: {
        eventId: ''
      }
    }
  };
  
  const scriptUrl = 'https://connect.facebook.net/en_US/fbevents.js';
  
  // Create injectScript mock
  let success, failure;
  mock('injectScript', (url, onsuccess, onfailure) => {
    success = onsuccess;
    failure = onfailure;
    onsuccess();
  });
  
  mock('copyFromWindow', key => {
    if (key === 'fbq') return () => {};
  });
  
  // Test 1: Library is injected
  runTest('Library is injected', () => {
    runCode(mockData);
    assertApi('injectScript').wasCalledWith(scriptUrl, success, failure, 'fbPixel');
    assertApi('gtmOnSuccess').wasCalled();
  });
  
  // Test 2: fbq does not exist - method created
  runTest('fbq does not exist - method created', () => {
    let fbq;
    
    mock('copyFromWindow', key => {
      if (key === 'fbq') return fbq;
    });
    
    mock('createQueue', key => {});
    
    mock('setInWindow', (key, val) => {
      if (key === 'fbq') fbq = val;
    });
    
    runCode(mockData);
    
    assertApi('aliasInWindow').wasCalledWith('_fbq', 'fbq');
    assertApi('setInWindow').wasCalled();
    assertApi('gtmOnSuccess').wasCalled();
  });
  
  // Test 3: fbq exists - method copied
  runTest('fbq exists - method copied', () => {
    mock('setInWindow', key => {
      if (key === 'fbq') fail('setInWindow called with fbq even though variable exists');
    });
    
    mock('createQueue', key => {});
    
    runCode(mockData);
    assertApi('gtmOnSuccess').wasCalled();
  });
  
  // Test 4: Consent set correctly
  runTest('Consent set', () => {
    mock('copyFromWindow', key => {
      if (key === 'fbq') return function() {
        if (arguments[0] === 'consent') {
          assertThat(arguments[1]).isEqualTo('grant');
        }
      };
    });
    
    runCode(mockData);
    assertApi('gtmOnSuccess').wasCalled();
  });
  
  // Test 5: Pixel IDs set - do not initialize
  runTest('Pixel IDs set - do not initialize', () => {
    mock('copyFromWindow', key => {
      if (key === '_fbq_gtm_ids') return ['12345', '23456'];
      if (key === 'fbq') return function() {
        if (arguments[0] === 'init') fail('init called even though pixel IDs already initialized');
      };
    });
    
    runCode(mockData);
    assertApi('gtmOnSuccess').wasCalled();
  });
  
  // Test 6: Send standard event
  runTest('Send standard event', () => {
    const eventParams = {
      content_type: 'product',
      content_name: 'Test Product',
      value: '100',
      currency: 'USD'
    };
    
    let index = 0;
    mock('copyFromWindow', key => {
      if (key === 'fbq') return function() {
        if (arguments[0] === 'trackSingle') {
          assertThat(arguments[1]).isEqualTo(mockData.fbPixel.split(',')[index].trim());
          assertThat(arguments[2]).isEqualTo('PageView');
          assertThat(arguments[3]).isEqualTo(eventParams);
          index += 1;
        }
      };
    });
    
    runCode(mockData);
    
    assertThat(index).isEqualTo(2);
    assertApi('gtmOnSuccess').wasCalled();
  });
  
  // Test 7: Send custom event
  runTest('Send custom event', () => {
    mockData.eventSetup = {
      custom: {
        value: 'CustomConversion'
      }
    };
    
    let index = 0;
    mock('copyFromWindow', key => {
      if (key === 'fbq') return function() {
        if (arguments[0] === 'trackSingleCustom') {
          assertThat(arguments[1]).isEqualTo(mockData.fbPixel.split(',')[index].trim());
          assertThat(arguments[2]).isEqualTo('CustomConversion');
          index += 1;
        }
      };
    });
    
    runCode(mockData);
    
    assertThat(index).isEqualTo(2);
    assertApi('gtmOnSuccess').wasCalled();
  });
  
  // Test 8: Send event with Event ID
  runTest('Send event ID', () => {
    mockData.moreSettings.eventId.eventId = 'EVENT_123';
    
    mock('copyFromWindow', key => {
      if (key === 'fbq') return function() {
        if (arguments[0] === 'trackSingle') {
          assertThat(arguments[4]).isEqualTo({eventID: 'EVENT_123'});
        }
      };
    });
    
    runCode(mockData);
    assertApi('gtmOnSuccess').wasCalled();
  });
  
  // Test 9: Advanced matching enabled
  runTest('Advanced matching enabled', () => {
    mockData.advancedMatching.enable = 'Enable Advanced Matching';
    mockData.customDataParam.dataParameter = [
      {parameterName: 'em', parameterValue: 'test@example.com'},
      {parameterName: 'fn', parameterValue: 'John'},
      {parameterName: 'ln', parameterValue: 'Doe'}
    ];
    
    let initCalled = false;
    mock('copyFromWindow', key => {
      if (key === 'fbq') return function() {
        if (arguments[0] === 'init') {
          initCalled = true;
          assertThat(arguments[2]).isEqualTo({
            em: 'test@example.com',
            fn: 'John',
            ln: 'Doe'
          });
        }
      };
    });
    
    runCode(mockData);
    assertThat(initCalled).isTrue();
    assertApi('gtmOnSuccess').wasCalled();
  });
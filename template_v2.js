// Facebook Pixel GTM Template Code
const log = require('logToConsole');
const createQueue = require('createQueue');
const callInWindow = require('callInWindow');
const aliasInWindow = require('aliasInWindow');
const copyFromWindow = require('copyFromWindow');
const setInWindow = require('setInWindow');
const injectScript = require('injectScript');
const makeTableMap = require('makeTableMap');
const makeNumber = require('makeNumber');
const getType = require('getType');

// Log configuration data for debugging
log('Facebook Pixel Configuration:', data);

// Get initial pixel IDs from global scope
const initIds = copyFromWindow('_fbq_gtm_ids') || [];
const pixelIds = data.fbPixel;

// Helper method to merge objects
const mergeObj = (obj, obj2) => {
  for (let key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      obj[key] = obj2[key];
    }
  }
  return obj;
};

// Utility function to use either fbq.queue[] or fbq.callMethod()
const getFbq = () => {
  // Return the existing 'fbq' global method if available
  let fbq = copyFromWindow('fbq');
  if (fbq) {
    return fbq;
  }
  
  // Initialize the 'fbq' global method
  setInWindow('fbq', function() {    
    const callMethod = copyFromWindow('fbq.callMethod.apply');
    if (callMethod) {           
      callInWindow('fbq.callMethod.apply', null, arguments); 
    } else {       
      callInWindow('fbq.queue.push', arguments);
    }
  });
  aliasInWindow('_fbq', 'fbq');
  
  // Create the fbq.queue
  createQueue('fbq.queue');
    
  // Return the global 'fbq' method
  return copyFromWindow('fbq');
};

// Get reference to the global method
const fbq = getFbq();

// Build event name based on configuration
let eventName;
const standardEventNames = ['AddPaymentInfo', 'AddToCart', 'AddToWishlist', 'CompleteRegistration', 
                           'Contact', 'CustomizeProduct', 'Donate', 'FindLocation', 'InitiateCheckout', 
                           'Lead', 'PageView', 'Purchase', 'Schedule', 'Search', 'StartTrial', 
                           'SubmitApplication', 'Subscribe', 'ViewContent'];

// Handle event setup
if (data.eventSetup) {
  if (data.eventSetup.standard && data.eventSetup.standard.value) {
    eventName = data.eventSetup.standard.value;
  } else if (data.eventSetup.custom && data.eventSetup.custom.value) {
    eventName = data.eventSetup.custom.value;
  }
} else {
  eventName = 'PageView'; // Default event
}

// Build parameters
const cidParams = data.customDataParam && data.customDataParam.dataParameter && data.customDataParam.dataParameter.length 
  ? makeTableMap(data.customDataParam.dataParameter, 'parameterName', 'parameterValue') 
  : {};

const objectProps = data.objectProperties && data.objectProperties.simpleTable1 && data.objectProperties.simpleTable1.length 
  ? makeTableMap(data.objectProperties.simpleTable1, 'propNames', 'propValue') 
  : {};

// Merge all object properties
const finalObjectProps = mergeObj({}, objectProps);

// Add custom data parameters to final props
for (let key in cidParams) {
  if (cidParams.hasOwnProperty(key)) {
    // Check if this is an advanced matching parameter
    const advancedMatchingParams = ['em', 'fn', 'ln', 'db', 'ph', 'ct', 'st', 'zp', 'cn', 'ge', 'external_id'];
    if (advancedMatchingParams.indexOf(key) === -1) {
      finalObjectProps[key] = cidParams[key];
    }
  }
}

// Determine command type
const command = standardEventNames.indexOf(eventName) === -1 ? 'trackSingleCustom' : 'trackSingle';

// Handle consent
const consent = data.consentGranted && (data.consentGranted.true === 'true' || data.consentGranted.true === true) ? 'grant' : 'revoke';
fbq('consent', consent);

// Handle multiple pixel IDs
pixelIds.split(',').forEach(pixelId => {
  pixelId = pixelId.trim(); // Remove any whitespace
  
  if (initIds.indexOf(pixelId) === -1) {
    
    // Handle More Settings
    if (data.moreSettings) {
      // Disable automatic configuration if set
      if (data.moreSettings.autoConfig && 
          data.moreSettings.autoConfig.disable === 'Disable Automatic Configuration') {
        fbq('set', 'autoConfig', false, pixelId);
      }
      
      // Disable history tracking if set
      if (data.moreSettings.eventTracking && 
          data.moreSettings.eventTracking.disable === 'Disable History Event Tracking') {
        setInWindow('fbq.disablePushState', true);
      }
    }
    
    // Build advanced matching parameters
    const advancedMatchingData = {};
    if (data.advancedMatching && data.advancedMatching.enable === 'Enable Advanced Matching') {
      const advancedParams = ['em', 'fn', 'ln', 'db', 'ph', 'ct', 'st', 'zp', 'cn', 'ge', 'external_id'];
      advancedParams.forEach(param => {
        if (cidParams[param]) {
          advancedMatchingData[param] = cidParams[param];
        }
      });
    }
    
    // Initialize pixel
    fbq('init', pixelId, advancedMatchingData);
    
    // Set monitoring agent
    fbq('set', 'agent', 'tmGTM-CustomTemplate', pixelId);
    
    // Store initialized pixel ID
    initIds.push(pixelId);
    setInWindow('_fbq_gtm_ids', initIds, true);
  }
  
  // Add event ID if configured
  let eventOptions = {};
  if (data.moreSettings && data.moreSettings.eventId && data.moreSettings.eventId.eventId) {
    eventOptions.eventID = data.moreSettings.eventId.eventId;
  }
  
  // Send the event
  if (eventOptions.eventID) {
    fbq(command, pixelId, eventName, finalObjectProps, eventOptions);
  } else {
    fbq(command, pixelId, eventName, finalObjectProps);
  }
  
  log('Facebook Pixel Event Sent:', {
    command: command,
    pixelId: pixelId,
    eventName: eventName,
    props: finalObjectProps,
    options: eventOptions
  });
});

// Inject Facebook Pixel script
injectScript('https://connect.facebook.net/en_US/fbevents.js', data.gtmOnSuccess, data.gtmOnFailure, 'fbPixel');
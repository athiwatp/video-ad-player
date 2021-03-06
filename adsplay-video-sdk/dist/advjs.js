/**
 * Video.js version 4.12
 */


// HTML5 Shiv. Must be in <head> to support older browsers.
document.createElement('video');
document.createElement('audio');
document.createElement('track');

/**
 * Doubles as the main function for users to create a player instance and also
 * the main library object.
 *
 * **ALIASES** advjs, _V_ (deprecated)
 *
 * The `advjs` function can be used to initialize or retrieve a player.
 *
 *     var myPlayer = advjs('my_video_id');
 *
 * @param  {String|Element} id      Video element or video element ID
 * @param  {Object=} options        Optional options object for config/settings
 * @param  {Function=} ready        Optional ready callback
 * @return {advjs.Player}             A player instance
 * @namespace
 */
var advjs = function(id, options, ready){
    var tag; // Element of ID

    // Allow for element or ID to be passed in
    // String ID
    if (typeof id === 'string') {

        // Adjust for jQuery ID syntax
        if (id.indexOf('#') === 0) {
            id = id.slice(1);
        }

        // If a player instance has already been created for this ID return it.
        if (advjs.players[id]) {

            // If options or ready funtion are passed, warn
            if (options) {
                advjs.log.warn ('Player "' + id + '" is already initialised. Options will not be applied.');
            }

            if (ready) {
                advjs.players[id].ready(ready);
            }

            return advjs.players[id];

            // Otherwise get element for ID
        } else {
            tag = advjs.el(id);
        }

        // ID is a media element
    } else {
        tag = id;
    }

    // Check for a useable element
    if (!tag || !tag.nodeName) { // re: nodeName, could be a box div also
        throw new TypeError('The element or ID supplied is not valid. (advjs)'); // Returns
    }

    // Element may have a player attr referring to an already created player instance.
    // If not, set up a new player and return the instance.
    return tag['player'] || new advjs.Player(tag, options, ready);
};

// Extended name, also available externally, window.advjs
var advjs = window['advjs'] = advjs;

// CDN Version. Used to target right flash swf.
advjs.CDN_VERSION = '4.12';
advjs.ACCESS_PROTOCOL = ('https:' == document.location.protocol ? 'https://' : 'http://');

/**
 * Full player version
 * @type {string}
 */
advjs['VERSION'] = '4.12.15';

/**
 * Global Player instance options, surfaced from advjs.Player.prototype.options_
 * advjs.options = advjs.Player.prototype.options_
 * All options should use string keys so they avoid
 * renaming by closure compiler
 * @type {Object}
 */
advjs.options = {
    // Default order of fallback technology
    'techOrder': ['html5','flash'],
    // techOrder: ['flash','html5'],

    'html5': {},
    'flash': {},

    // Default of web browser is 300x150. Should rely on source width/height.
    'width': 300,
    'height': 150,
    // defaultVolume: 0.85,
    'defaultVolume': 0.00, // The freakin seaguls are driving me crazy!

    // default playback rates
    'playbackRates': [],
    // Add playback rate selection by adding rates
    // 'playbackRates': [0.5, 1, 1.5, 2],

    // default inactivity timeout
    'inactivityTimeout': 2000,

    // Included control sets
    'children': {
        'mediaLoader': {},
        'posterImage': {},
        'loadingSpinner': {},
        'textTrackDisplay': {},
        'bigPlayButton': {},
        'controlBar': {},
        'errorDisplay': {},
        'textTrackSettings': {}
    },

    'language': document.getElementsByTagName('html')[0].getAttribute('lang') || navigator.languages && navigator.languages[0] || navigator.userLanguage || navigator.language || 'en',

    // locales and their language translations
    'languages': {},

    // Default message to show when a video cannot be played.
    'notSupportedMessage': 'No compatible source was found for this video.'
};

// Set CDN Version of swf
// The added (+) blocks the replace from changing this 4.12 string
if (advjs.CDN_VERSION !== 'GENERATED'+'_CDN_VSN') {
    advjs.options['flash']['swf'] = advjs.ACCESS_PROTOCOL + 'advjs.zencdn.net/'+advjs.CDN_VERSION+'/video-js.swf';
}

/**
 * Utility function for adding languages to the default options. Useful for
 * amending multiple language support at runtime.
 *
 * Example: advjs.addLanguage('es', {'Hello':'Hola'});
 *
 * @param  {String} code The language code or dictionary property
 * @param  {Object} data The data values to be translated
 * @return {Object} The resulting global languages dictionary object
 */
advjs.addLanguage = function(code, data){
    if(advjs.options['languages'][code] !== undefined) {
        advjs.options['languages'][code] = advjs.util.mergeOptions(advjs.options['languages'][code], data);
    } else {
        advjs.options['languages'][code] = data;
    }
    return advjs.options['languages'];
};

/**
 * Global player list
 * @type {Object}
 */
advjs.players = {};

/*!
 * Custom Universal Module Definition (UMD)
 *
 * Video.js will never be a non-browser lib so we can simplify UMD a bunch and
 * still support requirejs and browserify. This also needs to be closure
 * compiler compatible, so string keys are used.
 */
if (typeof define === 'function' && define['amd']) {
    define('advjs', [], function(){ return advjs; });

// checking that module is an object too because of umdjs/umd#35
} else if (typeof exports === 'object' && typeof module === 'object') {
    module['exports'] = advjs;
}
/**
 * Core Object/Class for objects that use inheritance + constructors
 *
 * To create a class that can be subclassed itself, extend the CoreObject class.
 *
 *     var Animal = CoreObject.extend();
 *     var Horse = Animal.extend();
 *
 * The constructor can be defined through the init property of an object argument.
 *
 *     var Animal = CoreObject.extend({
 *       init: function(name, sound){
 *         this.name = name;
 *       }
 *     });
 *
 * Other methods and properties can be added the same way, or directly to the
 * prototype.
 *
 *    var Animal = CoreObject.extend({
 *       init: function(name){
 *         this.name = name;
 *       },
 *       getName: function(){
 *         return this.name;
 *       },
 *       sound: '...'
 *    });
 *
 *    Animal.prototype.makeSound = function(){
 *      alert(this.sound);
 *    };
 *
 * To create an instance of a class, use the create method.
 *
 *    var fluffy = Animal.create('Fluffy');
 *    fluffy.getName(); // -> Fluffy
 *
 * Methods and properties can be overridden in subclasses.
 *
 *     var Horse = Animal.extend({
 *       sound: 'Neighhhhh!'
 *     });
 *
 *     var horsey = Horse.create('Horsey');
 *     horsey.getName(); // -> Horsey
 *     horsey.makeSound(); // -> Alert: Neighhhhh!
 *
 * @class
 * @constructor
 */
advjs.CoreObject = advjs['CoreObject'] = function(){};
// Manually exporting advjs['CoreObject'] here for Closure Compiler
// because of the use of the extend/create class methods
// If we didn't do this, those functions would get flattened to something like
// `a = ...` and `this.prototype` would refer to the global object instead of
// CoreObject

/**
 * Create a new object that inherits from this Object
 *
 *     var Animal = CoreObject.extend();
 *     var Horse = Animal.extend();
 *
 * @param {Object} props Functions and properties to be applied to the
 *                       new object's prototype
 * @return {advjs.CoreObject} An object that inherits from CoreObject
 * @this {*}
 */
advjs.CoreObject.extend = function(props){
    var init, subObj;

    props = props || {};
    // Set up the constructor using the supplied init method
    // or using the init of the parent object
    // Make sure to check the unobfuscated version for external libs
    init = props['init'] || props.init || this.prototype['init'] || this.prototype.init || function(){};
    // In Resig's simple class inheritance (previously used) the constructor
    //  is a function that calls `this.init.apply(arguments)`
    // However that would prevent us from using `ParentObject.call(this);`
    //  in a Child constructor because the `this` in `this.init`
    //  would still refer to the Child and cause an infinite loop.
    // We would instead have to do
    //    `ParentObject.prototype.init.apply(this, arguments);`
    //  Bleh. We're not creating a _super() function, so it's good to keep
    //  the parent constructor reference simple.
    subObj = function(){
        init.apply(this, arguments);
    };

    // Inherit from this object's prototype
    subObj.prototype = advjs.obj.create(this.prototype);
    // Reset the constructor property for subObj otherwise
    // instances of subObj would have the constructor of the parent Object
    subObj.prototype.constructor = subObj;

    // Make the class extendable
    subObj.extend = advjs.CoreObject.extend;
    // Make a function for creating instances
    subObj.create = advjs.CoreObject.create;

    // Extend subObj's prototype with functions and other properties from props
    for (var name in props) {
        if (props.hasOwnProperty(name)) {
            subObj.prototype[name] = props[name];
        }
    }

    return subObj;
};

/**
 * Create a new instance of this Object class
 *
 *     var myAnimal = Animal.create();
 *
 * @return {advjs.CoreObject} An instance of a CoreObject subclass
 * @this {*}
 */
advjs.CoreObject.create = function(){
    // Create a new object that inherits from this object's prototype
    var inst = advjs.obj.create(this.prototype);

    // Apply this constructor function to the new object
    this.apply(inst, arguments);

    // Return the new object
    return inst;
};
/**
 * @fileoverview Event System (John Resig - Secrets of a JS Ninja http://jsninja.com/)
 * (Original book version wasn't completely usable, so fixed some things and made Closure Compiler compatible)
 * This should work very similarly to jQuery's events, however it's based off the book version which isn't as
 * robust as jquery's, so there's probably some differences.
 */

/**
 * Add an event listener to element
 * It stores the handler function in a separate cache object
 * and adds a generic handler to the element's event,
 * along with a unique id (guid) to the element.
 * @param  {Element|Object}   elem Element or object to bind listeners to
 * @param  {String|Array}   type Type of event to bind to.
 * @param  {Function} fn   Event listener.
 * @private
 */
advjs.on = function(elem, type, fn){
    if (advjs.obj.isArray(type)) {
        return _handleMultipleEvents(advjs.on, elem, type, fn);
    }

    var data = advjs.getData(elem);

    // We need a place to store all our handler data
    if (!data.handlers) data.handlers = {};

    if (!data.handlers[type]) data.handlers[type] = [];

    if (!fn.guid) fn.guid = advjs.guid++;

    data.handlers[type].push(fn);

    if (!data.dispatcher) {
        data.disabled = false;

        data.dispatcher = function (event){

            if (data.disabled) return;
            event = advjs.fixEvent(event);

            var handlers = data.handlers[event.type];

            if (handlers) {
                // Copy handlers so if handlers are added/removed during the process it doesn't throw everything off.
                var handlersCopy = handlers.slice(0);

                for (var m = 0, n = handlersCopy.length; m < n; m++) {
                    if (event.isImmediatePropagationStopped()) {
                        break;
                    } else {
                        handlersCopy[m].call(elem, event);
                    }
                }
            }
        };
    }

    if (data.handlers[type].length == 1) {
        if (elem.addEventListener) {
            elem.addEventListener(type, data.dispatcher, false);
        } else if (elem.attachEvent) {
            elem.attachEvent('on' + type, data.dispatcher);
        }
    }
};

/**
 * Removes event listeners from an element
 * @param  {Element|Object}   elem Object to remove listeners from
 * @param  {String|Array=}   type Type of listener to remove. Don't include to remove all events from element.
 * @param  {Function} fn   Specific listener to remove. Don't include to remove listeners for an event type.
 * @private
 */
advjs.off = function(elem, type, fn) {
    // Don't want to add a cache object through getData if not needed
    if (!advjs.hasData(elem)) return;

    var data = advjs.getData(elem);

    // If no events exist, nothing to unbind
    if (!data.handlers) { return; }

    if (advjs.obj.isArray(type)) {
        return _handleMultipleEvents(advjs.off, elem, type, fn);
    }

    // Utility function
    var removeType = function(t){
        data.handlers[t] = [];
        advjs.cleanUpEvents(elem,t);
    };

    // Are we removing all bound events?
    if (!type) {
        for (var t in data.handlers) removeType(t);
        return;
    }

    var handlers = data.handlers[type];

    // If no handlers exist, nothing to unbind
    if (!handlers) return;

    // If no listener was provided, remove all listeners for type
    if (!fn) {
        removeType(type);
        return;
    }

    // We're only removing a single handler
    if (fn.guid) {
        for (var n = 0; n < handlers.length; n++) {
            if (handlers[n].guid === fn.guid) {
                handlers.splice(n--, 1);
            }
        }
    }

    advjs.cleanUpEvents(elem, type);
};

/**
 * Clean up the listener cache and dispatchers
 * @param  {Element|Object} elem Element to clean up
 * @param  {String} type Type of event to clean up
 * @private
 */
advjs.cleanUpEvents = function(elem, type) {
    var data = advjs.getData(elem);

    // Remove the events of a particular type if there are none left
    if (data.handlers[type].length === 0) {
        delete data.handlers[type];
        // data.handlers[type] = null;
        // Setting to null was causing an error with data.handlers

        // Remove the meta-handler from the element
        if (elem.removeEventListener) {
            elem.removeEventListener(type, data.dispatcher, false);
        } else if (elem.detachEvent) {
            elem.detachEvent('on' + type, data.dispatcher);
        }
    }

    // Remove the events object if there are no types left
    if (advjs.isEmpty(data.handlers)) {
        delete data.handlers;
        delete data.dispatcher;
        delete data.disabled;

        // data.handlers = null;
        // data.dispatcher = null;
        // data.disabled = null;
    }

    // Finally remove the expando if there is no data left
    if (advjs.isEmpty(data)) {
        advjs.removeData(elem);
    }
};

/**
 * Fix a native event to have standard property values
 * @param  {Object} event Event object to fix
 * @return {Object}
 * @private
 */
advjs.fixEvent = function(event) {

    function returnTrue() { return true; }
    function returnFalse() { return false; }

    // Test if fixing up is needed
    // Used to check if !event.stopPropagation instead of isPropagationStopped
    // But native events return true for stopPropagation, but don't have
    // other expected methods like isPropagationStopped. Seems to be a problem
    // with the Javascript Ninja code. So we're just overriding all events now.
    if (!event || !event.isPropagationStopped) {
        var old = event || window.event;

        event = {};
        // Clone the old object so that we can modify the values event = {};
        // IE8 Doesn't like when you mess with native event properties
        // Firefox returns false for event.hasOwnProperty('type') and other props
        //  which makes copying more difficult.
        // TODO: Probably best to create a whitelist of event props
        for (var key in old) {
            // Safari 6.0.3 warns you if you try to copy deprecated layerX/Y
            // Chrome warns you if you try to copy deprecated keyboardEvent.keyLocation
            if (key !== 'layerX' && key !== 'layerY' && key !== 'keyLocation') {
                // Chrome 32+ warns if you try to copy deprecated returnValue, but
                // we still want to if preventDefault isn't supported (IE8).
                if (!(key == 'returnValue' && old.preventDefault)) {
                    event[key] = old[key];
                }
            }
        }

        // The event occurred on this element
        if (!event.target) {
            event.target = event.srcElement || document;
        }

        // Handle which other element the event is related to
        event.relatedTarget = event.fromElement === event.target ?
            event.toElement :
            event.fromElement;

        // Stop the default browser action
        event.preventDefault = function () {
            if (old.preventDefault) {
                old.preventDefault();
            }
            event.returnValue = false;
            event.isDefaultPrevented = returnTrue;
            event.defaultPrevented = true;
        };

        event.isDefaultPrevented = returnFalse;
        event.defaultPrevented = false;

        // Stop the event from bubbling
        event.stopPropagation = function () {
            if (old.stopPropagation) {
                old.stopPropagation();
            }
            event.cancelBubble = true;
            event.isPropagationStopped = returnTrue;
        };

        event.isPropagationStopped = returnFalse;

        // Stop the event from bubbling and executing other handlers
        event.stopImmediatePropagation = function () {
            if (old.stopImmediatePropagation) {
                old.stopImmediatePropagation();
            }
            event.isImmediatePropagationStopped = returnTrue;
            event.stopPropagation();
        };

        event.isImmediatePropagationStopped = returnFalse;

        // Handle mouse position
        if (event.clientX != null) {
            var doc = document.documentElement, body = document.body;

            event.pageX = event.clientX +
                (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
                (doc && doc.clientLeft || body && body.clientLeft || 0);
            event.pageY = event.clientY +
                (doc && doc.scrollTop || body && body.scrollTop || 0) -
                (doc && doc.clientTop || body && body.clientTop || 0);
        }

        // Handle key presses
        event.which = event.charCode || event.keyCode;

        // Fix button for mouse clicks:
        // 0 == left; 1 == middle; 2 == right
        if (event.button != null) {
            event.button = (event.button & 1 ? 0 :
                (event.button & 4 ? 1 :
                    (event.button & 2 ? 2 : 0)));
        }
    }

    // Returns fixed-up instance
    return event;
};

/**
 * Trigger an event for an element
 * @param  {Element|Object}      elem  Element to trigger an event on
 * @param  {Event|Object|String} event A string (the type) or an event object with a type attribute
 * @private
 */
advjs.trigger = function(elem, event) {
    // Fetches element data and a reference to the parent (for bubbling).
    // Don't want to add a data object to cache for every parent,
    // so checking hasData first.
    var elemData = (advjs.hasData(elem)) ? advjs.getData(elem) : {};
    var parent = elem.parentNode || elem.ownerDocument;
    // type = event.type || event,
    // handler;

    // If an event name was passed as a string, creates an event out of it
    if (typeof event === 'string') {
        event = { type:event, target:elem };
    }
    // Normalizes the event properties.
    event = advjs.fixEvent(event);

    // If the passed element has a dispatcher, executes the established handlers.
    if (elemData.dispatcher) {
        elemData.dispatcher.call(elem, event);
    }

    // Unless explicitly stopped or the event does not bubble (e.g. media events)
    // recursively calls this function to bubble the event up the DOM.
    if (parent && !event.isPropagationStopped() && event.bubbles !== false) {
        advjs.trigger(parent, event);

        // If at the top of the DOM, triggers the default action unless disabled.
    } else if (!parent && !event.defaultPrevented) {
        var targetData = advjs.getData(event.target);

        // Checks if the target has a default action for this event.
        if (event.target[event.type]) {
            // Temporarily disables event dispatching on the target as we have already executed the handler.
            targetData.disabled = true;
            // Executes the default action.
            if (typeof event.target[event.type] === 'function') {
                event.target[event.type]();
            }
            // Re-enables event dispatching.
            targetData.disabled = false;
        }
    }

    // Inform the triggerer if the default was prevented by returning false
    return !event.defaultPrevented;
    /* Original version of js ninja events wasn't complete.
     * We've since updated to the latest version, but keeping this around
     * for now just in case.
     */
    // // Added in addition to book. Book code was broke.
    // event = typeof event === 'object' ?
    //   event[advjs.expando] ?
    //     event :
    //     new advjs.Event(type, event) :
    //   new advjs.Event(type);

    // event.type = type;
    // if (handler) {
    //   handler.call(elem, event);
    // }

    // // Clean up the event in case it is being reused
    // event.result = undefined;
    // event.target = elem;
};

/**
 * Trigger a listener only once for an event
 * @param  {Element|Object}   elem Element or object to
 * @param  {String|Array}   type
 * @param  {Function} fn
 * @private
 */
advjs.one = function(elem, type, fn) {
    if (advjs.obj.isArray(type)) {
        return _handleMultipleEvents(advjs.one, elem, type, fn);
    }
    var func = function(){
        advjs.off(elem, type, func);
        fn.apply(this, arguments);
    };
    // copy the guid to the new function so it can removed using the original function's ID
    func.guid = fn.guid = fn.guid || advjs.guid++;
    advjs.on(elem, type, func);
};

/**
 * Loops through an array of event types and calls the requested method for each type.
 * @param  {Function} fn   The event method we want to use.
 * @param  {Element|Object} elem Element or object to bind listeners to
 * @param  {String}   type Type of event to bind to.
 * @param  {Function} callback   Event listener.
 * @private
 */
function _handleMultipleEvents(fn, elem, type, callback) {
    advjs.arr.forEach(type, function(type) {
        fn(elem, type, callback); //Call the event method for each one of the types
    });
}
var hasOwnProp = Object.prototype.hasOwnProperty;

/**
 * Creates an element and applies properties.
 * @param  {String=} tagName    Name of tag to be created.
 * @param  {Object=} properties Element properties to be applied.
 * @return {Element}
 * @private
 */
advjs.createEl = function(tagName, properties){
    var el;

    tagName = tagName || 'div';
    properties = properties || {};

    el = document.createElement(tagName);

    advjs.obj.each(properties, function(propName, val){
        // Not remembering why we were checking for dash
        // but using setAttribute means you have to use getAttribute

        // The check for dash checks for the aria-* attributes, like aria-label, aria-valuemin.
        // The additional check for "role" is because the default method for adding attributes does not
        // add the attribute "role". My guess is because it's not a valid attribute in some namespaces, although
        // browsers handle the attribute just fine. The W3C allows for aria-* attributes to be used in pre-HTML5 docs.
        // http://www.w3.org/TR/wai-aria-primer/#ariahtml. Using setAttribute gets around this problem.
        if (propName.indexOf('aria-') !== -1 || propName == 'role') {
            el.setAttribute(propName, val);
        } else {
            el[propName] = val;
        }
    });

    return el;
};

/**
 * Uppercase the first letter of a string
 * @param  {String} string String to be uppercased
 * @return {String}
 * @private
 */
advjs.capitalize = function(string){
    return string.charAt(0).toUpperCase() + string.slice(1);
};

/**
 * Object functions container
 * @type {Object}
 * @private
 */
advjs.obj = {};

/**
 * Object.create shim for prototypal inheritance
 *
 * https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/create
 *
 * @function
 * @param  {Object}   obj Object to use as prototype
 * @private
 */
advjs.obj.create = Object.create || function(obj){
    //Create a new function called 'F' which is just an empty object.
    function F() {}

    //the prototype of the 'F' function should point to the
    //parameter of the anonymous function.
    F.prototype = obj;

    //create a new constructor function based off of the 'F' function.
    return new F();
};

/**
 * Loop through each property in an object and call a function
 * whose arguments are (key,value)
 * @param  {Object}   obj Object of properties
 * @param  {Function} fn  Function to be called on each property.
 * @this {*}
 * @private
 */
advjs.obj.each = function(obj, fn, context){
    for (var key in obj) {
        if (hasOwnProp.call(obj, key)) {
            fn.call(context || this, key, obj[key]);
        }
    }
};

/**
 * Merge two objects together and return the original.
 * @param  {Object} obj1
 * @param  {Object} obj2
 * @return {Object}
 * @private
 */
advjs.obj.merge = function(obj1, obj2){
    if (!obj2) { return obj1; }
    for (var key in obj2){
        if (hasOwnProp.call(obj2, key)) {
            obj1[key] = obj2[key];
        }
    }
    return obj1;
};

/**
 * Merge two objects, and merge any properties that are objects
 * instead of just overwriting one. Uses to merge options hashes
 * where deeper default settings are important.
 * @param  {Object} obj1 Object to override
 * @param  {Object} obj2 Overriding object
 * @return {Object}      New object. Obj1 and Obj2 will be untouched.
 * @private
 */
advjs.obj.deepMerge = function(obj1, obj2){
    var key, val1, val2;

    // make a copy of obj1 so we're not overwriting original values.
    // like prototype.options_ and all sub options objects
    obj1 = advjs.obj.copy(obj1);

    for (key in obj2){
        if (hasOwnProp.call(obj2, key)) {
            val1 = obj1[key];
            val2 = obj2[key];

            // Check if both properties are pure objects and do a deep merge if so
            if (advjs.obj.isPlain(val1) && advjs.obj.isPlain(val2)) {
                obj1[key] = advjs.obj.deepMerge(val1, val2);
            } else {
                obj1[key] = obj2[key];
            }
        }
    }
    return obj1;
};

/**
 * Make a copy of the supplied object
 * @param  {Object} obj Object to copy
 * @return {Object}     Copy of object
 * @private
 */
advjs.obj.copy = function(obj){
    return advjs.obj.merge({}, obj);
};

/**
 * Check if an object is plain, and not a dom node or any object sub-instance
 * @param  {Object} obj Object to check
 * @return {Boolean}     True if plain, false otherwise
 * @private
 */
advjs.obj.isPlain = function(obj){
    return !!obj
        && typeof obj === 'object'
        && obj.toString() === '[object Object]'
        && obj.constructor === Object;
};

/**
 * Check if an object is Array
 *  Since instanceof Array will not work on arrays created in another frame we need to use Array.isArray, but since IE8 does not support Array.isArray we need this shim
 * @param  {Object} obj Object to check
 * @return {Boolean}     True if plain, false otherwise
 * @private
 */
advjs.obj.isArray = Array.isArray || function(arr) {
    return Object.prototype.toString.call(arr) === '[object Array]';
};

/**
 * Check to see whether the input is NaN or not.
 * NaN is the only JavaScript construct that isn't equal to itself
 * @param {Number} num Number to check
 * @return {Boolean} True if NaN, false otherwise
 * @private
 */
advjs.isNaN = function(num) {
    return num !== num;
};

/**
 * Bind (a.k.a proxy or Context). A simple method for changing the context of a function
 It also stores a unique id on the function so it can be easily removed from events
 * @param  {*}   context The object to bind as scope
 * @param  {Function} fn      The function to be bound to a scope
 * @param  {Number=}   uid     An optional unique ID for the function to be set
 * @return {Function}
 * @private
 */
advjs.bind = function(context, fn, uid) {
    // Make sure the function has a unique ID
    if (!fn.guid) { fn.guid = advjs.guid++; }

    // Create the new function that changes the context
    var ret = function() {
        return fn.apply(context, arguments);
    };

    // Allow for the ability to individualize this function
    // Needed in the case where multiple objects might share the same prototype
    // IF both items add an event listener with the same function, then you try to remove just one
    // it will remove both because they both have the same guid.
    // when using this, you need to use the bind method when you remove the listener as well.
    // currently used in text tracks
    ret.guid = (uid) ? uid + '_' + fn.guid : fn.guid;

    return ret;
};

/**
 * Element Data Store. Allows for binding data to an element without putting it directly on the element.
 * Ex. Event listeners are stored here.
 * (also from jsninja.com, slightly modified and updated for closure compiler)
 * @type {Object}
 * @private
 */
advjs.cache = {};

/**
 * Unique ID for an element or function
 * @type {Number}
 * @private
 */
advjs.guid = 1;

/**
 * Unique attribute name to store an element's guid in
 * @type {String}
 * @constant
 * @private
 */
advjs.expando = 'vdata' + (new Date()).getTime();

/**
 * Returns the cache object where data for an element is stored
 * @param  {Element} el Element to store data for.
 * @return {Object}
 * @private
 */
advjs.getData = function(el){
    var id = el[advjs.expando];
    if (!id) {
        id = el[advjs.expando] = advjs.guid++;
    }
    if (!advjs.cache[id]) {
        advjs.cache[id] = {};
    }
    return advjs.cache[id];
};

/**
 * Returns the cache object where data for an element is stored
 * @param  {Element} el Element to store data for.
 * @return {Object}
 * @private
 */
advjs.hasData = function(el){
    var id = el[advjs.expando];
    return !(!id || advjs.isEmpty(advjs.cache[id]));
};

/**
 * Delete data for the element from the cache and the guid attr from getElementById
 * @param  {Element} el Remove data for an element
 * @private
 */
advjs.removeData = function(el){
    var id = el[advjs.expando];
    if (!id) { return; }
    // Remove all stored data
    // Changed to = null
    // http://coding.smashingmagazine.com/2012/11/05/writing-fast-memory-efficient-javascript/
    // advjs.cache[id] = null;
    delete advjs.cache[id];

    // Remove the expando property from the DOM node
    try {
        delete el[advjs.expando];
    } catch(e) {
        if (el.removeAttribute) {
            el.removeAttribute(advjs.expando);
        } else {
            // IE doesn't appear to support removeAttribute on the document element
            el[advjs.expando] = null;
        }
    }
};

/**
 * Check if an object is empty
 * @param  {Object}  obj The object to check for emptiness
 * @return {Boolean}
 * @private
 */
advjs.isEmpty = function(obj) {
    for (var prop in obj) {
        // Inlude null properties as empty.
        if (obj[prop] !== null) {
            return false;
        }
    }
    return true;
};

/**
 * Check if an element has a CSS class
 * @param {Element} element Element to check
 * @param {String} classToCheck Classname to check
 * @private
 */
advjs.hasClass = function(element, classToCheck){
    return ((' ' + element.className + ' ').indexOf(' ' + classToCheck + ' ') !== -1);
};


/**
 * Add a CSS class name to an element
 * @param {Element} element    Element to add class name to
 * @param {String} classToAdd Classname to add
 * @private
 */
advjs.addClass = function(element, classToAdd){
    if (!advjs.hasClass(element, classToAdd)) {
        element.className = element.className === '' ? classToAdd : element.className + ' ' + classToAdd;
    }
};

/**
 * Remove a CSS class name from an element
 * @param {Element} element    Element to remove from class name
 * @param {String} classToAdd Classname to remove
 * @private
 */
advjs.removeClass = function(element, classToRemove){
    var classNames, i;

    if (!advjs.hasClass(element, classToRemove)) {return;}

    classNames = element.className.split(' ');

    // no arr.indexOf in ie8, and we don't want to add a big shim
    for (i = classNames.length - 1; i >= 0; i--) {
        if (classNames[i] === classToRemove) {
            classNames.splice(i,1);
        }
    }

    element.className = classNames.join(' ');
};

/**
 * Element for testing browser HTML5 video capabilities
 * @type {Element}
 * @constant
 * @private
 */
advjs.TEST_VID = advjs.createEl('video');
(function() {
    var track = document.createElement('track');
    track.kind = 'captions';
    track.srclang = 'en';
    track.label = 'English';
    advjs.TEST_VID.appendChild(track);
})();

/**
 * Useragent for browser testing.
 * @type {String}
 * @constant
 * @private
 */
advjs.USER_AGENT = navigator.userAgent;

/**
 * Device is an iPhone
 * @type {Boolean}
 * @constant
 * @private
 */
advjs.IS_IPHONE = (/iPhone/i).test(advjs.USER_AGENT);
advjs.IS_IPAD = (/iPad/i).test(advjs.USER_AGENT);
advjs.IS_IPOD = (/iPod/i).test(advjs.USER_AGENT);
advjs.IS_IOS = advjs.IS_IPHONE || advjs.IS_IPAD || advjs.IS_IPOD;

advjs.IOS_VERSION = (function(){
    var match = advjs.USER_AGENT.match(/OS (\d+)_/i);
    if (match && match[1]) { return match[1]; }
})();

advjs.IS_ANDROID = (/Android/i).test(advjs.USER_AGENT);
advjs.ANDROID_VERSION = (function() {
    // This matches Android Major.Minor.Patch versions
    // ANDROID_VERSION is Major.Minor as a Number, if Minor isn't available, then only Major is returned
    var match = advjs.USER_AGENT.match(/Android (\d+)(?:\.(\d+))?(?:\.(\d+))*/i),
        major,
        minor;

    if (!match) {
        return null;
    }

    major = match[1] && parseFloat(match[1]);
    minor = match[2] && parseFloat(match[2]);

    if (major && minor) {
        return parseFloat(match[1] + '.' + match[2]);
    } else if (major) {
        return major;
    } else {
        return null;
    }
})();
// Old Android is defined as Version older than 2.3, and requiring a webkit version of the android browser
advjs.IS_OLD_ANDROID = advjs.IS_ANDROID && (/webkit/i).test(advjs.USER_AGENT) && advjs.ANDROID_VERSION < 2.3;

advjs.IS_FIREFOX = (/Firefox/i).test(advjs.USER_AGENT);
advjs.IS_CHROME = (/Chrome/i).test(advjs.USER_AGENT);
advjs.IS_IE8 = (/MSIE\s8\.0/).test(advjs.USER_AGENT);

advjs.TOUCH_ENABLED = !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch);
advjs.BACKGROUND_SIZE_SUPPORTED = 'backgroundSize' in advjs.TEST_VID.style;

/**
 * Apply attributes to an HTML element.
 * @param  {Element} el         Target element.
 * @param  {Object=} attributes Element attributes to be applied.
 * @private
 */
advjs.setElementAttributes = function(el, attributes){
    advjs.obj.each(attributes, function(attrName, attrValue) {
        if (attrValue === null || typeof attrValue === 'undefined' || attrValue === false) {
            el.removeAttribute(attrName);
        } else {
            el.setAttribute(attrName, (attrValue === true ? '' : attrValue));
        }
    });
};

/**
 * Get an element's attribute values, as defined on the HTML tag
 * Attributes are not the same as properties. They're defined on the tag
 * or with setAttribute (which shouldn't be used with HTML)
 * This will return true or false for boolean attributes.
 * @param  {Element} tag Element from which to get tag attributes
 * @return {Object}
 * @private
 */
advjs.getElementAttributes = function(tag){
    var obj, knownBooleans, attrs, attrName, attrVal;

    obj = {};

    // known boolean attributes
    // we can check for matching boolean properties, but older browsers
    // won't know about HTML5 boolean attributes that we still read from
    knownBooleans = ','+'autoplay,controls,loop,muted,default'+',';

    if (tag && tag.attributes && tag.attributes.length > 0) {
        attrs = tag.attributes;

        for (var i = attrs.length - 1; i >= 0; i--) {
            attrName = attrs[i].name;
            attrVal = attrs[i].value;

            // check for known booleans
            // the matching element property will return a value for typeof
            if (typeof tag[attrName] === 'boolean' || knownBooleans.indexOf(','+attrName+',') !== -1) {
                // the value of an included boolean attribute is typically an empty
                // string ('') which would equal false if we just check for a false value.
                // we also don't want support bad code like autoplay='false'
                attrVal = (attrVal !== null) ? true : false;
            }

            obj[attrName] = attrVal;
        }
    }

    return obj;
};

/**
 * Get the computed style value for an element
 * From http://robertnyman.com/2006/04/24/get-the-rendered-style-of-an-element/
 * @param  {Element} el        Element to get style value for
 * @param  {String} strCssRule Style name
 * @return {String}            Style value
 * @private
 */
advjs.getComputedDimension = function(el, strCssRule){
    var strValue = '';
    if(document.defaultView && document.defaultView.getComputedStyle){
        strValue = document.defaultView.getComputedStyle(el, '').getPropertyValue(strCssRule);

    } else if(el.currentStyle){
        // IE8 Width/Height support
        strValue = el['client'+strCssRule.substr(0,1).toUpperCase() + strCssRule.substr(1)] + 'px';
    }
    return strValue;
};

/**
 * Insert an element as the first child node of another
 * @param  {Element} child   Element to insert
 * @param  {[type]} parent Element to insert child into
 * @private
 */
advjs.insertFirst = function(child, parent){
    if (parent.firstChild) {
        parent.insertBefore(child, parent.firstChild);
    } else {
        parent.appendChild(child);
    }
};

/**
 * Object to hold browser support information
 * @type {Object}
 * @private
 */
advjs.browser = {};

/**
 * Shorthand for document.getElementById()
 * Also allows for CSS (jQuery) ID syntax. But nothing other than IDs.
 * @param  {String} id  Element ID
 * @return {Element}    Element with supplied ID
 * @private
 */
advjs.el = function(id){
    if (id.indexOf('#') === 0) {
        id = id.slice(1);
    }

    return document.getElementById(id);
};

/**
 * Format seconds as a time string, H:MM:SS or M:SS
 * Supplying a guide (in seconds) will force a number of leading zeros
 * to cover the length of the guide
 * @param  {Number} seconds Number of seconds to be turned into a string
 * @param  {Number} guide   Number (in seconds) to model the string after
 * @return {String}         Time formatted as H:MM:SS or M:SS
 * @private
 */
advjs.formatTime = function(seconds, guide) {
    // Default to using seconds as guide
    guide = guide || seconds;
    var s = Math.floor(seconds % 60),
        m = Math.floor(seconds / 60 % 60),
        h = Math.floor(seconds / 3600),
        gm = Math.floor(guide / 60 % 60),
        gh = Math.floor(guide / 3600);

    // handle invalid times
    if (isNaN(seconds) || seconds === Infinity) {
        // '-' is false for all relational operators (e.g. <, >=) so this setting
        // will add the minimum number of fields specified by the guide
        h = m = s = '-';
    }

    // Check if we need to show hours
    h = (h > 0 || gh > 0) ? h + ':' : '';

    // If hours are showing, we may need to add a leading zero.
    // Always show at least one digit of minutes.
    m = (((h || gm >= 10) && m < 10) ? '0' + m : m) + ':';

    // Check if leading zero is need for seconds
    s = (s < 10) ? '0' + s : s;

    return h + m + s;
};

// Attempt to block the ability to select text while dragging controls
advjs.blockTextSelection = function(){
    document.body.focus();
    document.onselectstart = function () { return false; };
};
// Turn off text selection blocking
advjs.unblockTextSelection = function(){ document.onselectstart = function () { return true; }; };

/**
 * Trim whitespace from the ends of a string.
 * @param  {String} string String to trim
 * @return {String}        Trimmed string
 * @private
 */
advjs.trim = function(str){
    return (str+'').replace(/^\s+|\s+$/g, '');
};

/**
 * Should round off a number to a decimal place
 * @param  {Number} num Number to round
 * @param  {Number} dec Number of decimal places to round to
 * @return {Number}     Rounded number
 * @private
 */
advjs.round = function(num, dec) {
    if (!dec) { dec = 0; }
    return Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
};

/**
 * Should create a fake TimeRange object
 * Mimics an HTML5 time range instance, which has functions that
 * return the start and end times for a range
 * TimeRanges are returned by the buffered() method
 * @param  {Number} start Start time in seconds
 * @param  {Number} end   End time in seconds
 * @return {Object}       Fake TimeRange object
 * @private
 */
advjs.createTimeRange = function(start, end){
    if (start === undefined && end === undefined) {
        return {
            length: 0,
            start: function() {
                throw new Error('This TimeRanges object is empty');
            },
            end: function() {
                throw new Error('This TimeRanges object is empty');
            }
        };
    }

    return {
        length: 1,
        start: function() { return start; },
        end: function() { return end; }
    };
};

/**
 * Add to local storage (may removable)
 * @private
 */
advjs.setLocalStorage = function(key, value){
    try {
        // IE was throwing errors referencing the var anywhere without this
        var localStorage = window.localStorage || false;
        if (!localStorage) { return; }
        localStorage[key] = value;
    } catch(e) {
        if (e.code == 22 || e.code == 1014) { // Webkit == 22 / Firefox == 1014
            advjs.log('LocalStorage Full (advjs)', e);
        } else {
            if (e.code == 18) {
                advjs.log('LocalStorage not allowed (advjs)', e);
            } else {
                advjs.log('LocalStorage Error (advjs)', e);
            }
        }
    }
};

/**
 * Get absolute version of relative URL. Used to tell flash correct URL.
 * http://stackoverflow.com/questions/470832/getting-an-absolute-url-from-a-relative-one-ie6-issue
 * @param  {String} url URL to make absolute
 * @return {String}     Absolute URL
 * @private
 */
advjs.getAbsoluteURL = function(url){

    // Check if absolute URL
    if (!url.match(/^https?:\/\//)) {
        // Convert to absolute URL. Flash hosted off-site needs an absolute URL.
        url = advjs.createEl('div', {
            innerHTML: '<a href="'+url+'">x</a>'
        }).firstChild.href;
    }

    return url;
};


/**
 * Resolve and parse the elements of a URL
 * @param  {String} url The url to parse
 * @return {Object}     An object of url details
 */
advjs.parseUrl = function(url) {
    var div, a, addToBody, props, details;

    props = ['protocol', 'hostname', 'port', 'pathname', 'search', 'hash', 'host'];

    // add the url to an anchor and let the browser parse the URL
    a = advjs.createEl('a', { href: url });

    // IE8 (and 9?) Fix
    // ie8 doesn't parse the URL correctly until the anchor is actually
    // added to the body, and an innerHTML is needed to trigger the parsing
    addToBody = (a.host === '' && a.protocol !== 'file:');
    if (addToBody) {
        div = advjs.createEl('div');
        div.innerHTML = '<a href="'+url+'"></a>';
        a = div.firstChild;
        // prevent the div from affecting layout
        div.setAttribute('style', 'display:none; position:absolute;');
        document.body.appendChild(div);
    }

    // Copy the specific URL properties to a new object
    // This is also needed for IE8 because the anchor loses its
    // properties when it's removed from the dom
    details = {};
    for (var i = 0; i < props.length; i++) {
        details[props[i]] = a[props[i]];
    }

    // IE9 adds the port to the host property unlike everyone else. If
    // a port identifier is added for standard ports, strip it.
    if (details.protocol === 'http:') {
        details.host = details.host.replace(/:80$/, '');
    }
    if (details.protocol === 'https:') {
        details.host = details.host.replace(/:443$/, '');
    }

    if (addToBody) {
        document.body.removeChild(div);
    }

    return details;
};

/**
 * Log messages to the console and history based on the type of message
 *
 * @param  {String} type The type of message, or `null` for `log`
 * @param  {[type]} args The args to be passed to the log
 * @private
 */
function _logType(type, args){
    var argsArray, noop, console;

    // convert args to an array to get array functions
    argsArray = Array.prototype.slice.call(args);
    // if there's no console then don't try to output messages
    // they will still be stored in advjs.log.history
    // Was setting these once outside of this function, but containing them
    // in the function makes it easier to test cases where console doesn't exist
    noop = function(){};
    console = window['console'] || {
        'log': noop,
        'warn': noop,
        'error': noop
    };

    if (type) {
        // add the type to the front of the message
        argsArray.unshift(type.toUpperCase()+':');
    } else {
        // default to log with no prefix
        type = 'log';
    }

    // add to history
    advjs.log.history.push(argsArray);

    // add console prefix after adding to history
    argsArray.unshift('advjs:');

    // call appropriate log function
    if (console[type].apply) {
        console[type].apply(console, argsArray);
    } else {
        // ie8 doesn't allow error.apply, but it will just join() the array anyway
        console[type](argsArray.join(' '));
    }
}

/**
 * Log plain debug messages
 */
advjs.log = function(){
    _logType(null, arguments);
};

/**
 * Keep a history of log messages
 * @type {Array}
 */
advjs.log.history = [];

/**
 * Log error messages
 */
advjs.log.error = function(){
    _logType('error', arguments);
};

/**
 * Log warning messages
 */
advjs.log.warn = function(){
    _logType('warn', arguments);
};

// Offset Left
// getBoundingClientRect technique from John Resig http://ejohn.org/blog/getboundingclientrect-is-awesome/
advjs.findPosition = function(el) {
    var box, docEl, body, clientLeft, scrollLeft, left, clientTop, scrollTop, top;

    if (el.getBoundingClientRect && el.parentNode) {
        box = el.getBoundingClientRect();
    }

    if (!box) {
        return {
            left: 0,
            top: 0
        };
    }

    docEl = document.documentElement;
    body = document.body;

    clientLeft = docEl.clientLeft || body.clientLeft || 0;
    scrollLeft = window.pageXOffset || body.scrollLeft;
    left = box.left + scrollLeft - clientLeft;

    clientTop = docEl.clientTop || body.clientTop || 0;
    scrollTop = window.pageYOffset || body.scrollTop;
    top = box.top + scrollTop - clientTop;

    // Android sometimes returns slightly off decimal values, so need to round
    return {
        left: advjs.round(left),
        top: advjs.round(top)
    };
};

/**
 * Array functions container
 * @type {Object}
 * @private
 */
advjs.arr = {};

/*
 * Loops through an array and runs a function for each item inside it.
 * @param  {Array}    array       The array
 * @param  {Function} callback    The function to be run for each item
 * @param  {*}        thisArg     The `this` binding of callback
 * @returns {Array}               The array
 * @private
 */
advjs.arr.forEach = function(array, callback, thisArg) {
    if (advjs.obj.isArray(array) && callback instanceof Function) {
        for (var i = 0, len = array.length; i < len; ++i) {
            callback.call(thisArg || advjs, array[i], i, array);
        }
    }

    return array;
};
/**
 * Simple http request for retrieving external files (e.g. text tracks)
 *
 * ##### Example
 *
 *     // using url string
 *     advjs.xhr('http://example.com/myfile.vtt', function(error, response, responseBody){});
 *
 *     // or options block
 *     advjs.xhr({
 *       uri: 'http://example.com/myfile.vtt',
 *       method: 'GET',
 *       responseType: 'text'
 *     }, function(error, response, responseBody){
 *       if (error) {
 *         // log the error
 *       } else {
 *         // successful, do something with the response
 *       }
 *     });
 *
 *
 * API is modeled after the Raynos/xhr, which we hope to use after
 * getting browserify implemented.
 * https://github.com/Raynos/xhr/blob/master/index.js
 *
 * @param  {Object|String}  options   Options block or URL string
 * @param  {Function}       callback  The callback function
 * @returns {Object}                  The request
 */
advjs.xhr = function(options, callback){
    var XHR, request, urlInfo, winLoc, fileUrl, crossOrigin, abortTimeout, successHandler, errorHandler;

    // If options is a string it's the url
    if (typeof options === 'string') {
        options = {
            uri: options
        };
    }

    // Merge with default options
    advjs.util.mergeOptions({
        method: 'GET',
        timeout: 45 * 1000
    }, options);

    callback = callback || function(){};

    successHandler = function(){
        window.clearTimeout(abortTimeout);
        callback(null, request, request.response || request.responseText);
    };

    errorHandler = function(err){
        window.clearTimeout(abortTimeout);

        if (!err || typeof err === 'string') {
            err = new Error(err);
        }

        callback(err, request);
    };

    XHR = window.XMLHttpRequest;

    if (typeof XHR === 'undefined') {
        // Shim XMLHttpRequest for older IEs
        XHR = function () {
            try { return new window.ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch (e) {}
            try { return new window.ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch (f) {}
            try { return new window.ActiveXObject('Msxml2.XMLHTTP'); } catch (g) {}
            throw new Error('This browser does not support XMLHttpRequest.');
        };
    }

    request = new XHR();
    // Store a reference to the url on the request instance
    request.uri = options.uri;

    urlInfo = advjs.parseUrl(options.uri);
    winLoc = window.location;
    // Check if url is for another domain/origin
    // IE8 doesn't know location.origin, so we won't rely on it here
    crossOrigin = (urlInfo.protocol + urlInfo.host) !== (winLoc.protocol + winLoc.host);

    // XDomainRequest -- Use for IE if XMLHTTPRequest2 isn't available
    // 'withCredentials' is only available in XMLHTTPRequest2
    // Also XDomainRequest has a lot of gotchas, so only use if cross domain
    if (crossOrigin && window.XDomainRequest && !('withCredentials' in request)) {
        request = new window.XDomainRequest();
        request.onload = successHandler;
        request.onerror = errorHandler;
        // These blank handlers need to be set to fix ie9
        // http://cypressnorth.com/programming/internet-explorer-aborting-ajax-requests-fixed/
        request.onprogress = function(){};
        request.ontimeout = function(){};

        // XMLHTTPRequest
    } else {
        fileUrl = (urlInfo.protocol == 'file:' || winLoc.protocol == 'file:');

        request.onreadystatechange = function() {
            if (request.readyState === 4) {
                if (request.timedout) {
                    return errorHandler('timeout');
                }

                if (request.status === 200 || fileUrl && request.status === 0) {
                    successHandler();
                } else {
                    errorHandler();
                }
            }
        };

        if (options.timeout) {
            abortTimeout = window.setTimeout(function() {
                if (request.readyState !== 4) {
                    request.timedout = true;
                    request.abort();
                }
            }, options.timeout);
        }
    }

    // open the connection
    try {
        // Third arg is async, or ignored by XDomainRequest
        request.open(options.method || 'GET', options.uri, true);
    } catch(err) {
        return errorHandler(err);
    }

    // withCredentials only supported by XMLHttpRequest2
    if(options.withCredentials) {
        request.withCredentials = true;
    }

    if (options.responseType) {
        request.responseType = options.responseType;
    }

    // send the request
    try {
        request.send();
    } catch(err) {
        return errorHandler(err);
    }

    return request;
};
/**
 * Utility functions namespace
 * @namespace
 * @type {Object}
 */
advjs.util = {};

/**
 * Merge two options objects, recursively merging any plain object properties as
 * well.  Previously `deepMerge`
 *
 * @param  {Object} obj1 Object to override values in
 * @param  {Object} obj2 Overriding object
 * @return {Object}      New object -- obj1 and obj2 will be untouched
 */
advjs.util.mergeOptions = function(obj1, obj2){
    var key, val1, val2;

    // make a copy of obj1 so we're not overwriting original values.
    // like prototype.options_ and all sub options objects
    obj1 = advjs.obj.copy(obj1);

    for (key in obj2){
        if (obj2.hasOwnProperty(key)) {
            val1 = obj1[key];
            val2 = obj2[key];

            // Check if both properties are pure objects and do a deep merge if so
            if (advjs.obj.isPlain(val1) && advjs.obj.isPlain(val2)) {
                obj1[key] = advjs.util.mergeOptions(val1, val2);
            } else {
                obj1[key] = obj2[key];
            }
        }
    }
    return obj1;
};advjs.EventEmitter = function() {
};

advjs.EventEmitter.prototype.allowedEvents_ = {
};

advjs.EventEmitter.prototype.on = function(type, fn) {
    // Remove the addEventListener alias before calling advjs.on
    // so we don't get into an infinite type loop
    var ael = this.addEventListener;
    this.addEventListener = Function.prototype;
    advjs.on(this, type, fn);
    this.addEventListener = ael;
};
advjs.EventEmitter.prototype.addEventListener = advjs.EventEmitter.prototype.on;

advjs.EventEmitter.prototype.off = function(type, fn) {
    advjs.off(this, type, fn);
};
advjs.EventEmitter.prototype.removeEventListener = advjs.EventEmitter.prototype.off;

advjs.EventEmitter.prototype.one = function(type, fn) {
    advjs.one(this, type, fn);
};

advjs.EventEmitter.prototype.trigger = function(event) {
    var type = event.type || event;

    if (typeof event === 'string') {
        event = {
            type: type
        };
    }
    event = advjs.fixEvent(event);

    if (this.allowedEvents_[type] && this['on' + type]) {
        this['on' + type](event);
    }

    advjs.trigger(this, event);
};
// The standard DOM EventTarget.dispatchEvent() is aliased to trigger()
advjs.EventEmitter.prototype.dispatchEvent = advjs.EventEmitter.prototype.trigger;
/**
 * @fileoverview Player Component - Base class for all UI objects
 *
 */

/**
 * Base UI Component class
 *
 * Components are embeddable UI objects that are represented by both a
 * javascript object and an element in the DOM. They can be children of other
 * components, and can have many children themselves.
 *
 *     // adding a button to the player
 *     var button = player.addChild('button');
 *     button.el(); // -> button element
 *
 *     <div class="video-js">
 *       <div class="advjs-button">Button</div>
 *     </div>
 *
 * Components are also event emitters.
 *
 *     button.on('click', function(){
 *       console.log('Button Clicked!');
 *     });
 *
 *     button.trigger('customevent');
 *
 * @param {Object} player  Main Player
 * @param {Object=} options
 * @class
 * @constructor
 * @extends advjs.CoreObject
 */
advjs.Component = advjs.CoreObject.extend({
    /**
     * the constructor function for the class
     *
     * @constructor
     */
    init: function(player, options, ready){
        this.player_ = player;

        // Make a copy of prototype.options_ to protect against overriding global defaults
        this.options_ = advjs.obj.copy(this.options_);

        // Updated options with supplied options
        options = this.options(options);

        // Get ID from options or options element if one is supplied
        this.id_ = options['id'] || (options['el'] && options['el']['id']);

        // If there was no ID from the options, generate one
        if (!this.id_) {
            // Don't require the player ID function in the case of mock players
            this.id_ = ((player.id && player.id()) || 'no_player') + '_component_' + advjs.guid++;
        }

        this.name_ = options['name'] || null;

        // Create element if one wasn't provided in options
        this.el_ = options['el'] || this.createEl();

        this.children_ = [];
        this.childIndex_ = {};
        this.childNameIndex_ = {};

        // Add any child components in options
        this.initChildren();

        this.ready(ready);
        // Don't want to trigger ready here or it will before init is actually
        // finished for all children that run this constructor

        if (options.reportTouchActivity !== false) {
            this.enableTouchActivity();
        }
    }
});

/**
 * Dispose of the component and all child components
 */
advjs.Component.prototype.dispose = function(){
    this.trigger({ type: 'dispose', 'bubbles': false });

    // Dispose all children.
    if (this.children_) {
        for (var i = this.children_.length - 1; i >= 0; i--) {
            if (this.children_[i].dispose) {
                this.children_[i].dispose();
            }
        }
    }

    // Delete child references
    this.children_ = null;
    this.childIndex_ = null;
    this.childNameIndex_ = null;

    // Remove all event listeners.
    this.off();

    // Remove element from DOM
    if (this.el_.parentNode) {
        this.el_.parentNode.removeChild(this.el_);
    }

    advjs.removeData(this.el_);
    this.el_ = null;
};

/**
 * Reference to main player instance
 *
 * @type {advjs.Player}
 * @private
 */
advjs.Component.prototype.player_ = true;

/**
 * Return the component's player
 *
 * @return {advjs.Player}
 */
advjs.Component.prototype.player = function(){
    return this.player_;
};

/**
 * The component's options object
 *
 * @type {Object}
 * @private
 */
advjs.Component.prototype.options_;

/**
 * Deep merge of options objects
 *
 * Whenever a property is an object on both options objects
 * the two properties will be merged using advjs.obj.deepMerge.
 *
 * This is used for merging options for child components. We
 * want it to be easy to override individual options on a child
 * component without having to rewrite all the other default options.
 *
 *     Parent.prototype.options_ = {
 *       children: {
 *         'childOne': { 'foo': 'bar', 'asdf': 'fdsa' },
 *         'childTwo': {},
 *         'childThree': {}
 *       }
 *     }
 *     newOptions = {
 *       children: {
 *         'childOne': { 'foo': 'baz', 'abc': '123' }
 *         'childTwo': null,
 *         'childFour': {}
 *       }
 *     }
 *
 *     this.options(newOptions);
 *
 * RESULT
 *
 *     {
 *       children: {
 *         'childOne': { 'foo': 'baz', 'asdf': 'fdsa', 'abc': '123' },
 *         'childTwo': null, // Disabled. Won't be initialized.
 *         'childThree': {},
 *         'childFour': {}
 *       }
 *     }
 *
 * @param  {Object} obj Object of new option values
 * @return {Object}     A NEW object of this.options_ and obj merged
 */
advjs.Component.prototype.options = function(obj){
    if (obj === undefined) return this.options_;

    return this.options_ = advjs.util.mergeOptions(this.options_, obj);
};

/**
 * The DOM element for the component
 *
 * @type {Element}
 * @private
 */
advjs.Component.prototype.el_;

/**
 * Create the component's DOM element
 *
 * @param  {String=} tagName  Element's node type. e.g. 'div'
 * @param  {Object=} attributes An object of element attributes that should be set on the element
 * @return {Element}
 */
advjs.Component.prototype.createEl = function(tagName, attributes){
    return advjs.createEl(tagName, attributes);
};

advjs.Component.prototype.localize = function(string){
    var lang = this.player_.language(),
        languages = this.player_.languages();
    if (languages && languages[lang] && languages[lang][string]) {
        return languages[lang][string];
    }
    return string;
};

/**
 * Get the component's DOM element
 *
 *     var domEl = myComponent.el();
 *
 * @return {Element}
 */
advjs.Component.prototype.el = function(){
    return this.el_;
};

/**
 * An optional element where, if defined, children will be inserted instead of
 * directly in `el_`
 *
 * @type {Element}
 * @private
 */
advjs.Component.prototype.contentEl_;

/**
 * Return the component's DOM element for embedding content.
 * Will either be el_ or a new element defined in createEl.
 *
 * @return {Element}
 */
advjs.Component.prototype.contentEl = function(){
    return this.contentEl_ || this.el_;
};

/**
 * The ID for the component
 *
 * @type {String}
 * @private
 */
advjs.Component.prototype.id_;

/**
 * Get the component's ID
 *
 *     var id = myComponent.id();
 *
 * @return {String}
 */
advjs.Component.prototype.id = function(){
    return this.id_;
};

/**
 * The name for the component. Often used to reference the component.
 *
 * @type {String}
 * @private
 */
advjs.Component.prototype.name_;

/**
 * Get the component's name. The name is often used to reference the component.
 *
 *     var name = myComponent.name();
 *
 * @return {String}
 */
advjs.Component.prototype.name = function(){
    return this.name_;
};

/**
 * Array of child components
 *
 * @type {Array}
 * @private
 */
advjs.Component.prototype.children_;

/**
 * Get an array of all child components
 *
 *     var kids = myComponent.children();
 *
 * @return {Array} The children
 */
advjs.Component.prototype.children = function(){
    return this.children_;
};

/**
 * Object of child components by ID
 *
 * @type {Object}
 * @private
 */
advjs.Component.prototype.childIndex_;

/**
 * Returns a child component with the provided ID
 *
 * @return {advjs.Component}
 */
advjs.Component.prototype.getChildById = function(id){
    return this.childIndex_[id];
};

/**
 * Object of child components by name
 *
 * @type {Object}
 * @private
 */
advjs.Component.prototype.childNameIndex_;

/**
 * Returns a child component with the provided name
 *
 * @return {advjs.Component}
 */
advjs.Component.prototype.getChild = function(name){
    return this.childNameIndex_[name];
};

/**
 * Adds a child component inside this component
 *
 *     myComponent.el();
 *     // -> <div class='my-component'></div>
 *     myComonent.children();
 *     // [empty array]
 *
 *     var myButton = myComponent.addChild('MyButton');
 *     // -> <div class='my-component'><div class="my-button">myButton<div></div>
 *     // -> myButton === myComonent.children()[0];
 *
 * Pass in options for child constructors and options for children of the child
 *
 *     var myButton = myComponent.addChild('MyButton', {
 *       text: 'Press Me',
 *       children: {
 *         buttonChildExample: {
 *           buttonChildOption: true
 *         }
 *       }
 *     });
 *
 * @param {String|advjs.Component} child The class name or instance of a child to add
 * @param {Object=} options Options, including options to be passed to children of the child.
 * @return {advjs.Component} The child component (created by this process if a string was used)
 * @suppress {accessControls|checkRegExp|checkTypes|checkVars|const|constantProperty|deprecated|duplicate|es5Strict|fileoverviewTags|globalThis|invalidCasts|missingProperties|nonStandardJsDocs|strictModuleDepCheck|undefinedNames|undefinedVars|unknownDefines|uselessCode|visibility}
 */
advjs.Component.prototype.addChild = function(child, options){
    var component, componentClass, componentName;

    // If child is a string, create new component with options
    if (typeof child === 'string') {
        componentName = child;

        // Make sure options is at least an empty object to protect against errors
        options = options || {};

        // If no componentClass in options, assume componentClass is the name lowercased
        // (e.g. playButton)
        componentClass = options['componentClass'] || advjs.capitalize(componentName);

        // Set name through options
        options['name'] = componentName;

        // Create a new object & element for this controls set
        // If there's no .player_, this is a player
        // Closure Compiler throws an 'incomplete alias' warning if we use the advjs variable directly.
        // Every class should be exported, so this should never be a problem here.
        component = new window['advjs'][componentClass](this.player_ || this, options);

        // child is a component instance
    } else {
        component = child;
    }

    this.children_.push(component);

    if (typeof component.id === 'function') {
        this.childIndex_[component.id()] = component;
    }

    // If a name wasn't used to create the component, check if we can use the
    // name function of the component
    componentName = componentName || (component.name && component.name());

    if (componentName) {
        this.childNameIndex_[componentName] = component;
    }

    // Add the UI object's element to the container div (box)
    // Having an element is not required
    if (typeof component['el'] === 'function' && component['el']()) {
        this.contentEl().appendChild(component['el']());
    }

    // Return so it can stored on parent object if desired.
    return component;
};

/**
 * Remove a child component from this component's list of children, and the
 * child component's element from this component's element
 *
 * @param  {advjs.Component} component Component to remove
 */
advjs.Component.prototype.removeChild = function(component){
    if (typeof component === 'string') {
        component = this.getChild(component);
    }

    if (!component || !this.children_) return;

    var childFound = false;
    for (var i = this.children_.length - 1; i >= 0; i--) {
        if (this.children_[i] === component) {
            childFound = true;
            this.children_.splice(i,1);
            break;
        }
    }

    if (!childFound) return;

    this.childIndex_[component.id()] = null;
    this.childNameIndex_[component.name()] = null;

    var compEl = component.el();
    if (compEl && compEl.parentNode === this.contentEl()) {
        this.contentEl().removeChild(component.el());
    }
};

/**
 * Add and initialize default child components from options
 *
 *     // when an instance of MyComponent is created, all children in options
 *     // will be added to the instance by their name strings and options
 *     MyComponent.prototype.options_.children = {
 *       myChildComponent: {
 *         myChildOption: true
 *       }
 *     }
 *
 *     // Or when creating the component
 *     var myComp = new MyComponent(player, {
 *       children: {
 *         myChildComponent: {
 *           myChildOption: true
 *         }
 *       }
 *     });
 *
 * The children option can also be an Array of child names or
 * child options objects (that also include a 'name' key).
 *
 *     var myComp = new MyComponent(player, {
 *       children: [
 *         'button',
 *         {
 *           name: 'button',
 *           someOtherOption: true
 *         }
 *       ]
 *     });
 *
 */
advjs.Component.prototype.initChildren = function(){
    var parent, parentOptions, children, child, name, opts, handleAdd;

    parent = this;
    parentOptions = parent.options();
    children = parentOptions['children'];

    if (children) {
        handleAdd = function(name, opts){
            // Allow options for children to be set at the parent options
            // e.g. advjs(id, { controlBar: false });
            // instead of advjs(id, { children: { controlBar: false });
            if (parentOptions[name] !== undefined) {
                opts = parentOptions[name];
            }

            // Allow for disabling default components
            // e.g. advjs.options['children']['posterImage'] = false
            if (opts === false) return;

            // Create and add the child component.
            // Add a direct reference to the child by name on the parent instance.
            // If two of the same component are used, different names should be supplied
            // for each
            parent[name] = parent.addChild(name, opts);
        };

        // Allow for an array of children details to passed in the options
        if (advjs.obj.isArray(children)) {
            for (var i = 0; i < children.length; i++) {
                child = children[i];

                if (typeof child == 'string') {
                    // ['myComponent']
                    name = child;
                    opts = {};
                } else {
                    // [{ name: 'myComponent', otherOption: true }]
                    name = child.name;
                    opts = child;
                }

                handleAdd(name, opts);
            }
        } else {
            advjs.obj.each(children, handleAdd);
        }
    }
};

/**
 * Allows sub components to stack CSS class names
 *
 * @return {String} The constructed class name
 */
advjs.Component.prototype.buildCSSClass = function(){
    // Child classes can include a function that does:
    // return 'CLASS NAME' + this._super();
    return '';
};

/* Events
 ============================================================================= */

/**
 * Add an event listener to this component's element
 *
 *     var myFunc = function(){
 *       var myComponent = this;
 *       // Do something when the event is fired
 *     };
 *
 *     myComponent.on('eventType', myFunc);
 *
 * The context of myFunc will be myComponent unless previously bound.
 *
 * Alternatively, you can add a listener to another element or component.
 *
 *     myComponent.on(otherElement, 'eventName', myFunc);
 *     myComponent.on(otherComponent, 'eventName', myFunc);
 *
 * The benefit of using this over `advjs.on(otherElement, 'eventName', myFunc)`
 * and `otherComponent.on('eventName', myFunc)` is that this way the listeners
 * will be automatically cleaned up when either component is disposed.
 * It will also bind myComponent as the context of myFunc.
 *
 * **NOTE**: When using this on elements in the page other than window
 * and document (both permanent), if you remove the element from the DOM
 * you need to call `advjs.trigger(el, 'dispose')` on it to clean up
 * references to it and allow the browser to garbage collect it.
 *
 * @param  {String|advjs.Component} first   The event type or other component
 * @param  {Function|String}      second  The event handler or event type
 * @param  {Function}             third   The event handler
 * @return {advjs.Component}        self
 */
advjs.Component.prototype.on = function(first, second, third){
    var target, type, fn, removeOnDispose, cleanRemover, thisComponent;

    if (typeof first === 'string' || advjs.obj.isArray(first)) {
        advjs.on(this.el_, first, advjs.bind(this, second));

        // Targeting another component or element
    } else {
        target = first;
        type = second;
        fn = advjs.bind(this, third);
        thisComponent = this;

        // When this component is disposed, remove the listener from the other component
        removeOnDispose = function(){
            thisComponent.off(target, type, fn);
        };
        // Use the same function ID so we can remove it later it using the ID
        // of the original listener
        removeOnDispose.guid = fn.guid;
        this.on('dispose', removeOnDispose);

        // If the other component is disposed first we need to clean the reference
        // to the other component in this component's removeOnDispose listener
        // Otherwise we create a memory leak.
        cleanRemover = function(){
            thisComponent.off('dispose', removeOnDispose);
        };
        // Add the same function ID so we can easily remove it later
        cleanRemover.guid = fn.guid;

        // Check if this is a DOM node
        if (first.nodeName) {
            // Add the listener to the other element
            advjs.on(target, type, fn);
            advjs.on(target, 'dispose', cleanRemover);

            // Should be a component
            // Not using `instanceof advjs.Component` because it makes mock players difficult
        } else if (typeof first.on === 'function') {
            // Add the listener to the other component
            target.on(type, fn);
            target.on('dispose', cleanRemover);
        }
    }

    return this;
};

/**
 * Remove an event listener from this component's element
 *
 *     myComponent.off('eventType', myFunc);
 *
 * If myFunc is excluded, ALL listeners for the event type will be removed.
 * If eventType is excluded, ALL listeners will be removed from the component.
 *
 * Alternatively you can use `off` to remove listeners that were added to other
 * elements or components using `myComponent.on(otherComponent...`.
 * In this case both the event type and listener function are REQUIRED.
 *
 *     myComponent.off(otherElement, 'eventType', myFunc);
 *     myComponent.off(otherComponent, 'eventType', myFunc);
 *
 * @param  {String=|advjs.Component}  first  The event type or other component
 * @param  {Function=|String}       second The listener function or event type
 * @param  {Function=}              third  The listener for other component
 * @return {advjs.Component}
 */
advjs.Component.prototype.off = function(first, second, third){
    var target, otherComponent, type, fn, otherEl;

    if (!first || typeof first === 'string' || advjs.obj.isArray(first)) {
        advjs.off(this.el_, first, second);
    } else {
        target = first;
        type = second;
        // Ensure there's at least a guid, even if the function hasn't been used
        fn = advjs.bind(this, third);

        // Remove the dispose listener on this component,
        // which was given the same guid as the event listener
        this.off('dispose', fn);

        if (first.nodeName) {
            // Remove the listener
            advjs.off(target, type, fn);
            // Remove the listener for cleaning the dispose listener
            advjs.off(target, 'dispose', fn);
        } else {
            target.off(type, fn);
            target.off('dispose', fn);
        }
    }

    return this;
};

/**
 * Add an event listener to be triggered only once and then removed
 *
 *     myComponent.one('eventName', myFunc);
 *
 * Alternatively you can add a listener to another element or component
 * that will be triggered only once.
 *
 *     myComponent.one(otherElement, 'eventName', myFunc);
 *     myComponent.one(otherComponent, 'eventName', myFunc);
 *
 * @param  {String|advjs.Component}  first   The event type or other component
 * @param  {Function|String}       second  The listener function or event type
 * @param  {Function=}             third   The listener function for other component
 * @return {advjs.Component}
 */
advjs.Component.prototype.one = function(first, second, third) {
    var target, type, fn, thisComponent, newFunc;

    if (typeof first === 'string' || advjs.obj.isArray(first)) {
        advjs.one(this.el_, first, advjs.bind(this, second));
    } else {
        target = first;
        type = second;
        fn = advjs.bind(this, third);
        thisComponent = this;

        newFunc = function(){
            thisComponent.off(target, type, newFunc);
            fn.apply(this, arguments);
        };
        // Keep the same function ID so we can remove it later
        newFunc.guid = fn.guid;

        this.on(target, type, newFunc);
    }

    return this;
};

/**
 * Trigger an event on an element
 *
 *     myComponent.trigger('eventName');
 *     myComponent.trigger({'type':'eventName'});
 *
 * @param  {Event|Object|String} event  A string (the type) or an event object with a type attribute
 * @return {advjs.Component}       self
 */
advjs.Component.prototype.trigger = function(event){
    advjs.trigger(this.el_, event);
    return this;
};

/* Ready
 ================================================================================ */
/**
 * Is the component loaded
 * This can mean different things depending on the component.
 *
 * @private
 * @type {Boolean}
 */
advjs.Component.prototype.isReady_;

/**
 * Trigger ready as soon as initialization is finished
 *
 * Allows for delaying ready. Override on a sub class prototype.
 * If you set this.isReadyOnInitFinish_ it will affect all components.
 * Specially used when waiting for the Flash player to asynchronously load.
 *
 * @type {Boolean}
 * @private
 */
advjs.Component.prototype.isReadyOnInitFinish_ = true;

/**
 * List of ready listeners
 *
 * @type {Array}
 * @private
 */
advjs.Component.prototype.readyQueue_;

/**
 * Bind a listener to the component's ready state
 *
 * Different from event listeners in that if the ready event has already happened
 * it will trigger the function immediately.
 *
 * @param  {Function} fn Ready listener
 * @return {advjs.Component}
 */
advjs.Component.prototype.ready = function(fn){
    if (fn) {
        if (this.isReady_) {
            fn.call(this);
        } else {
            if (this.readyQueue_ === undefined) {
                this.readyQueue_ = [];
            }
            this.readyQueue_.push(fn);
        }
    }
    return this;
};

/**
 * Trigger the ready listeners
 *
 * @return {advjs.Component}
 */
advjs.Component.prototype.triggerReady = function(){
    this.isReady_ = true;

    var readyQueue = this.readyQueue_;

    // Reset Ready Queue
    this.readyQueue_ = [];

    if (readyQueue && readyQueue.length > 0) {

        for (var i = 0, j = readyQueue.length; i < j; i++) {
            readyQueue[i].call(this);
        }

        // Allow for using event listeners also, in case you want to do something everytime a source is ready.
        this.trigger('ready');
    }
};

/* Display
 ============================================================================= */

/**
 * Check if a component's element has a CSS class name
 *
 * @param {String} classToCheck Classname to check
 * @return {advjs.Component}
 */
advjs.Component.prototype.hasClass = function(classToCheck){
    return advjs.hasClass(this.el_, classToCheck);
};

/**
 * Add a CSS class name to the component's element
 *
 * @param {String} classToAdd Classname to add
 * @return {advjs.Component}
 */
advjs.Component.prototype.addClass = function(classToAdd){
    advjs.addClass(this.el_, classToAdd);
    return this;
};

/**
 * Remove a CSS class name from the component's element
 *
 * @param {String} classToRemove Classname to remove
 * @return {advjs.Component}
 */
advjs.Component.prototype.removeClass = function(classToRemove){
    advjs.removeClass(this.el_, classToRemove);
    return this;
};

/**
 * Show the component element if hidden
 *
 * @return {advjs.Component}
 */
advjs.Component.prototype.show = function(){
    this.removeClass('advjs-hidden');
    return this;
};

/**
 * Hide the component element if currently showing
 *
 * @return {advjs.Component}
 */
advjs.Component.prototype.hide = function(){
    this.addClass('advjs-hidden');
    return this;
};

/**
 * Lock an item in its visible state
 * To be used with fadeIn/fadeOut.
 *
 * @return {advjs.Component}
 * @private
 */
advjs.Component.prototype.lockShowing = function(){
    this.addClass('advjs-lock-showing');
    return this;
};

/**
 * Unlock an item to be hidden
 * To be used with fadeIn/fadeOut.
 *
 * @return {advjs.Component}
 * @private
 */
advjs.Component.prototype.unlockShowing = function(){
    this.removeClass('advjs-lock-showing');
    return this;
};

/**
 * Disable component by making it unshowable
 *
 * Currently private because we're moving towards more css-based states.
 * @private
 */
advjs.Component.prototype.disable = function(){
    this.hide();
    this.show = function(){};
};

/**
 * Set or get the width of the component (CSS values)
 *
 * Setting the video tag dimension values only works with values in pixels.
 * Percent values will not work.
 * Some percents can be used, but width()/height() will return the number + %,
 * not the actual computed width/height.
 *
 * @param  {Number|String=} num   Optional width number
 * @param  {Boolean} skipListeners Skip the 'resize' event trigger
 * @return {advjs.Component} This component, when setting the width
 * @return {Number|String} The width, when getting
 */
advjs.Component.prototype.width = function(num, skipListeners){
    return this.dimension('width', num, skipListeners);
};

/**
 * Get or set the height of the component (CSS values)
 *
 * Setting the video tag dimension values only works with values in pixels.
 * Percent values will not work.
 * Some percents can be used, but width()/height() will return the number + %,
 * not the actual computed width/height.
 *
 * @param  {Number|String=} num     New component height
 * @param  {Boolean=} skipListeners Skip the resize event trigger
 * @return {advjs.Component} This component, when setting the height
 * @return {Number|String} The height, when getting
 */
advjs.Component.prototype.height = function(num, skipListeners){
    return this.dimension('height', num, skipListeners);
};

/**
 * Set both width and height at the same time
 *
 * @param  {Number|String} width
 * @param  {Number|String} height
 * @return {advjs.Component} The component
 */
advjs.Component.prototype.dimensions = function(width, height){
    // Skip resize listeners on width for optimization
    return this.width(width, true).height(height);
};

/**
 * Get or set width or height
 *
 * This is the shared code for the width() and height() methods.
 * All for an integer, integer + 'px' or integer + '%';
 *
 * Known issue: Hidden elements officially have a width of 0. We're defaulting
 * to the style.width value and falling back to computedStyle which has the
 * hidden element issue. Info, but probably not an efficient fix:
 * http://www.foliotek.com/devblog/getting-the-width-of-a-hidden-element-with-jquery-using-width/
 *
 * @param  {String} widthOrHeight  'width' or 'height'
 * @param  {Number|String=} num     New dimension
 * @param  {Boolean=} skipListeners Skip resize event trigger
 * @return {advjs.Component} The component if a dimension was set
 * @return {Number|String} The dimension if nothing was set
 * @private
 */
advjs.Component.prototype.dimension = function(widthOrHeight, num, skipListeners){
    if (num !== undefined) {
        if (num === null || advjs.isNaN(num)) {
            num = 0;
        }

        // Check if using css width/height (% or px) and adjust
        if ((''+num).indexOf('%') !== -1 || (''+num).indexOf('px') !== -1) {
            this.el_.style[widthOrHeight] = num;
        } else if (num === 'auto') {
            this.el_.style[widthOrHeight] = '';
        } else {
            this.el_.style[widthOrHeight] = num+'px';
        }

        // skipListeners allows us to avoid triggering the resize event when setting both width and height
        if (!skipListeners) { this.trigger('resize'); }

        // Return component
        return this;
    }

    // Not setting a value, so getting it
    // Make sure element exists
    if (!this.el_) return 0;

    // Get dimension value from style
    var val = this.el_.style[widthOrHeight];
    var pxIndex = val.indexOf('px');
    if (pxIndex !== -1) {
        // Return the pixel value with no 'px'
        return parseInt(val.slice(0,pxIndex), 10);

        // No px so using % or no style was set, so falling back to offsetWidth/height
        // If component has display:none, offset will return 0
        // TODO: handle display:none and no dimension style using px
    } else {

        return parseInt(this.el_['offset'+advjs.capitalize(widthOrHeight)], 10);

        // ComputedStyle version.
        // Only difference is if the element is hidden it will return
        // the percent value (e.g. '100%'')
        // instead of zero like offsetWidth returns.
        // var val = advjs.getComputedStyleValue(this.el_, widthOrHeight);
        // var pxIndex = val.indexOf('px');

        // if (pxIndex !== -1) {
        //   return val.slice(0, pxIndex);
        // } else {
        //   return val;
        // }
    }
};

/**
 * Fired when the width and/or height of the component changes
 * @event resize
 */
advjs.Component.prototype.onResize;

/**
 * Emit 'tap' events when touch events are supported
 *
 * This is used to support toggling the controls through a tap on the video.
 *
 * We're requiring them to be enabled because otherwise every component would
 * have this extra overhead unnecessarily, on mobile devices where extra
 * overhead is especially bad.
 * @private
 */
advjs.Component.prototype.emitTapEvents = function(){
    var touchStart, firstTouch, touchTime, couldBeTap, noTap,
        xdiff, ydiff, touchDistance, tapMovementThreshold, touchTimeThreshold;

    // Track the start time so we can determine how long the touch lasted
    touchStart = 0;
    firstTouch = null;

    // Maximum movement allowed during a touch event to still be considered a tap
    // Other popular libs use anywhere from 2 (hammer.js) to 15, so 10 seems like a nice, round number.
    tapMovementThreshold = 10;

    // The maximum length a touch can be while still being considered a tap
    touchTimeThreshold = 200;

    this.on('touchstart', function(event) {
        // If more than one finger, don't consider treating this as a click
        if (event.touches.length === 1) {
            firstTouch = advjs.obj.copy(event.touches[0]);
            // Record start time so we can detect a tap vs. "touch and hold"
            touchStart = new Date().getTime();
            // Reset couldBeTap tracking
            couldBeTap = true;
        }
    });

    this.on('touchmove', function(event) {
        // If more than one finger, don't consider treating this as a click
        if (event.touches.length > 1) {
            couldBeTap = false;
        } else if (firstTouch) {
            // Some devices will throw touchmoves for all but the slightest of taps.
            // So, if we moved only a small distance, this could still be a tap
            xdiff = event.touches[0].pageX - firstTouch.pageX;
            ydiff = event.touches[0].pageY - firstTouch.pageY;
            touchDistance = Math.sqrt(xdiff * xdiff + ydiff * ydiff);
            if (touchDistance > tapMovementThreshold) {
                couldBeTap = false;
            }
        }
    });

    noTap = function(){
        couldBeTap = false;
    };
    // TODO: Listen to the original target. http://youtu.be/DujfpXOKUp8?t=13m8s
    this.on('touchleave', noTap);
    this.on('touchcancel', noTap);

    // When the touch ends, measure how long it took and trigger the appropriate
    // event
    this.on('touchend', function(event) {
        firstTouch = null;
        // Proceed only if the touchmove/leave/cancel event didn't happen
        if (couldBeTap === true) {
            // Measure how long the touch lasted
            touchTime = new Date().getTime() - touchStart;
            // Make sure the touch was less than the threshold to be considered a tap
            if (touchTime < touchTimeThreshold) {
                event.preventDefault(); // Don't let browser turn this into a click
                this.trigger('tap');
                // It may be good to copy the touchend event object and change the
                // type to tap, if the other event properties aren't exact after
                // advjs.fixEvent runs (e.g. event.target)
            }
        }
    });
};

/**
 * Report user touch activity when touch events occur
 *
 * User activity is used to determine when controls should show/hide. It's
 * relatively simple when it comes to mouse events, because any mouse event
 * should show the controls. So we capture mouse events that bubble up to the
 * player and report activity when that happens.
 *
 * With touch events it isn't as easy. We can't rely on touch events at the
 * player level, because a tap (touchstart + touchend) on the video itself on
 * mobile devices is meant to turn controls off (and on). User activity is
 * checked asynchronously, so what could happen is a tap event on the video
 * turns the controls off, then the touchend event bubbles up to the player,
 * which if it reported user activity, would turn the controls right back on.
 * (We also don't want to completely block touch events from bubbling up)
 *
 * Also a touchmove, touch+hold, and anything other than a tap is not supposed
 * to turn the controls back on on a mobile device.
 *
 * Here we're setting the default component behavior to report user activity
 * whenever touch events happen, and this can be turned off by components that
 * want touch events to act differently.
 */
advjs.Component.prototype.enableTouchActivity = function() {
    var report, touchHolding, touchEnd;

    // Don't continue if the root player doesn't support reporting user activity
    if (!this.player().reportUserActivity) {
        return;
    }

    // listener for reporting that the user is active
    report = advjs.bind(this.player(), this.player().reportUserActivity);

    this.on('touchstart', function() {
        report();
        // For as long as the they are touching the device or have their mouse down,
        // we consider them active even if they're not moving their finger or mouse.
        // So we want to continue to update that they are active
        this.clearInterval(touchHolding);
        // report at the same interval as activityCheck
        touchHolding = this.setInterval(report, 250);
    });

    touchEnd = function(event) {
        report();
        // stop the interval that maintains activity if the touch is holding
        this.clearInterval(touchHolding);
    };

    this.on('touchmove', report);
    this.on('touchend', touchEnd);
    this.on('touchcancel', touchEnd);
};

/**
 * Creates timeout and sets up disposal automatically.
 * @param {Function} fn The function to run after the timeout.
 * @param {Number} timeout Number of ms to delay before executing specified function.
 * @return {Number} Returns the timeout ID
 */
advjs.Component.prototype.setTimeout = function(fn, timeout) {
    fn = advjs.bind(this, fn);

    // window.setTimeout would be preferable here, but due to some bizarre issue with Sinon and/or Phantomjs, we can't.
    var timeoutId = setTimeout(fn, timeout);

    var disposeFn = function() {
        this.clearTimeout(timeoutId);
    };

    disposeFn.guid = 'advjs-timeout-'+ timeoutId;

    this.on('dispose', disposeFn);

    return timeoutId;
};


/**
 * Clears a timeout and removes the associated dispose listener
 * @param {Number} timeoutId The id of the timeout to clear
 * @return {Number} Returns the timeout ID
 */
advjs.Component.prototype.clearTimeout = function(timeoutId) {
    clearTimeout(timeoutId);

    var disposeFn = function(){};
    disposeFn.guid = 'advjs-timeout-'+ timeoutId;

    this.off('dispose', disposeFn);

    return timeoutId;
};

/**
 * Creates an interval and sets up disposal automatically.
 * @param {Function} fn The function to run every N seconds.
 * @param {Number} interval Number of ms to delay before executing specified function.
 * @return {Number} Returns the interval ID
 */
advjs.Component.prototype.setInterval = function(fn, interval) {
    fn = advjs.bind(this, fn);

    var intervalId = setInterval(fn, interval);

    var disposeFn = function() {
        this.clearInterval(intervalId);
    };

    disposeFn.guid = 'advjs-interval-'+ intervalId;

    this.on('dispose', disposeFn);

    return intervalId;
};

/**
 * Clears an interval and removes the associated dispose listener
 * @param {Number} intervalId The id of the interval to clear
 * @return {Number} Returns the interval ID
 */
advjs.Component.prototype.clearInterval = function(intervalId) {
    clearInterval(intervalId);

    var disposeFn = function(){};
    disposeFn.guid = 'advjs-interval-'+ intervalId;

    this.off('dispose', disposeFn);

    return intervalId;
};
/* Button - Base class for all buttons
 ================================================================================ */
/**
 * Base class for all buttons
 * @param {advjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
advjs.Button = advjs.Component.extend({
    /**
     * @constructor
     * @inheritDoc
     */
    init: function(player, options){
        advjs.Component.call(this, player, options);

        this.emitTapEvents();

        this.on('tap', this.onClick);
        this.on('click', this.onClick);
        this.on('focus', this.onFocus);
        this.on('blur', this.onBlur);
    }
});

advjs.Button.prototype.createEl = function(type, props){
    var el;

    // Add standard Aria and Tabindex info
    props = advjs.obj.merge({
        className: this.buildCSSClass(),
        'role': 'button',
        'aria-live': 'polite', // let the screen reader user know that the text of the button may change
        tabIndex: 0
    }, props);

    el = advjs.Component.prototype.createEl.call(this, type, props);

    // if innerHTML hasn't been overridden (bigPlayButton), add content elements
    if (!props.innerHTML) {
        this.contentEl_ = advjs.createEl('div', {
            className: 'advjs-control-content'
        });

        this.controlText_ = advjs.createEl('span', {
            className: 'advjs-control-text',
            innerHTML: this.localize(this.buttonText) || 'Need Text'
        });

        this.contentEl_.appendChild(this.controlText_);
        el.appendChild(this.contentEl_);
    }

    return el;
};

advjs.Button.prototype.buildCSSClass = function(){
    // TODO: Change advjs-control to advjs-button?
    return 'advjs-control ' + advjs.Component.prototype.buildCSSClass.call(this);
};

// Click - Override with specific functionality for button
advjs.Button.prototype.onClick = function(){};

// Focus - Add keyboard functionality to element
advjs.Button.prototype.onFocus = function(){
    advjs.on(document, 'keydown', advjs.bind(this, this.onKeyPress));
};

// KeyPress (document level) - Trigger click when keys are pressed
advjs.Button.prototype.onKeyPress = function(event){
    // Check for space bar (32) or enter (13) keys
    if (event.which == 32 || event.which == 13) {
        event.preventDefault();
        this.onClick();
    }
};

// Blur - Remove keyboard triggers
advjs.Button.prototype.onBlur = function(){
    advjs.off(document, 'keydown', advjs.bind(this, this.onKeyPress));
};
/* Slider
 ================================================================================ */
/**
 * The base functionality for sliders like the volume bar and seek bar
 *
 * @param {advjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
advjs.Slider = advjs.Component.extend({
    /** @constructor */
    init: function(player, options){
        advjs.Component.call(this, player, options);

        // Set property names to bar and handle to match with the child Slider class is looking for
        this.bar = this.getChild(this.options_['barName']);
        this.handle = this.getChild(this.options_['handleName']);

        this.on('mousedown', this.onMouseDown);
        this.on('touchstart', this.onMouseDown);
        this.on('focus', this.onFocus);
        this.on('blur', this.onBlur);
        this.on('click', this.onClick);

        this.on(player, 'controlsvisible', this.update);
        this.on(player, this.playerEvent, this.update);
    }
});

advjs.Slider.prototype.createEl = function(type, props) {
    props = props || {};
    // Add the slider element class to all sub classes
    props.className = props.className + ' advjs-slider';
    props = advjs.obj.merge({
        'role': 'slider',
        'aria-valuenow': 0,
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        tabIndex: 0
    }, props);

    return advjs.Component.prototype.createEl.call(this, type, props);
};

advjs.Slider.prototype.onMouseDown = function(event){
    event.preventDefault();
    advjs.blockTextSelection();
    this.addClass('advjs-sliding');

    this.on(document, 'mousemove', this.onMouseMove);
    this.on(document, 'mouseup', this.onMouseUp);
    this.on(document, 'touchmove', this.onMouseMove);
    this.on(document, 'touchend', this.onMouseUp);

    this.onMouseMove(event);
};

// To be overridden by a subclass
advjs.Slider.prototype.onMouseMove = function(){};

advjs.Slider.prototype.onMouseUp = function() {
    advjs.unblockTextSelection();
    this.removeClass('advjs-sliding');

    this.off(document, 'mousemove', this.onMouseMove);
    this.off(document, 'mouseup', this.onMouseUp);
    this.off(document, 'touchmove', this.onMouseMove);
    this.off(document, 'touchend', this.onMouseUp);

    this.update();
};

advjs.Slider.prototype.update = function(){
    // In VolumeBar init we have a setTimeout for update that pops and update to the end of the
    // execution stack. The player is destroyed before then update will cause an error
    if (!this.el_) return;

    // If scrubbing, we could use a cached value to make the handle keep up with the user's mouse.
    // On HTML5 browsers scrubbing is really smooth, but some flash players are slow, so we might want to utilize this later.
    // var progress =  (this.player_.scrubbing) ? this.player_.getCache().currentTime / this.player_.duration() : this.player_.currentTime() / this.player_.duration();

    var barProgress,
        progress = this.getPercent(),
        handle = this.handle,
        bar = this.bar;

    // Protect against no duration and other division issues
    if (typeof progress !== 'number' ||
        progress !== progress ||
        progress < 0 ||
        progress === Infinity) {
        progress = 0;
    }

    barProgress = progress;

    // If there is a handle, we need to account for the handle in our calculation for progress bar
    // so that it doesn't fall short of or extend past the handle.
    if (handle) {

        var box = this.el_,
            boxWidth = box.offsetWidth,

            handleWidth = handle.el().offsetWidth,

        // The width of the handle in percent of the containing box
        // In IE, widths may not be ready yet causing NaN
            handlePercent = (handleWidth) ? handleWidth / boxWidth : 0,

        // Get the adjusted size of the box, considering that the handle's center never touches the left or right side.
        // There is a margin of half the handle's width on both sides.
            boxAdjustedPercent = 1 - handlePercent,

        // Adjust the progress that we'll use to set widths to the new adjusted box width
            adjustedProgress = progress * boxAdjustedPercent;

        // The bar does reach the left side, so we need to account for this in the bar's width
        barProgress = adjustedProgress + (handlePercent / 2);

        // Move the handle from the left based on the adjected progress
        handle.el().style.left = advjs.round(adjustedProgress * 100, 2) + '%';
    }

    // Set the new bar width
    if (bar) {
        bar.el().style.width = advjs.round(barProgress * 100, 2) + '%';
    }
};

advjs.Slider.prototype.calculateDistance = function(event){
    var el, box, boxX, boxY, boxW, boxH, handle, pageX, pageY;

    el = this.el_;
    box = advjs.findPosition(el);
    boxW = boxH = el.offsetWidth;
    handle = this.handle;

    if (this.options()['vertical']) {
        boxY = box.top;

        if (event.changedTouches) {
            pageY = event.changedTouches[0].pageY;
        } else {
            pageY = event.pageY;
        }

        if (handle) {
            var handleH = handle.el().offsetHeight;
            // Adjusted X and Width, so handle doesn't go outside the bar
            boxY = boxY + (handleH / 2);
            boxH = boxH - handleH;
        }

        // Percent that the click is through the adjusted area
        return Math.max(0, Math.min(1, ((boxY - pageY) + boxH) / boxH));

    } else {
        boxX = box.left;

        if (event.changedTouches) {
            pageX = event.changedTouches[0].pageX;
        } else {
            pageX = event.pageX;
        }

        if (handle) {
            var handleW = handle.el().offsetWidth;

            // Adjusted X and Width, so handle doesn't go outside the bar
            boxX = boxX + (handleW / 2);
            boxW = boxW - handleW;
        }

        // Percent that the click is through the adjusted area
        return Math.max(0, Math.min(1, (pageX - boxX) / boxW));
    }
};

advjs.Slider.prototype.onFocus = function(){
    this.on(document, 'keydown', this.onKeyPress);
};

advjs.Slider.prototype.onKeyPress = function(event){
    if (event.which == 37 || event.which == 40) { // Left and Down Arrows
        event.preventDefault();
        this.stepBack();
    } else if (event.which == 38 || event.which == 39) { // Up and Right Arrows
        event.preventDefault();
        this.stepForward();
    }
};

advjs.Slider.prototype.onBlur = function(){
    this.off(document, 'keydown', this.onKeyPress);
};

/**
 * Listener for click events on slider, used to prevent clicks
 *   from bubbling up to parent elements like button menus.
 * @param  {Object} event Event object
 */
advjs.Slider.prototype.onClick = function(event){
    event.stopImmediatePropagation();
    event.preventDefault();
};

/**
 * SeekBar Behavior includes play progress bar, and seek handle
 * Needed so it can determine seek position based on handle position/size
 * @param {advjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
advjs.SliderHandle = advjs.Component.extend();

/**
 * Default value of the slider
 *
 * @type {Number}
 * @private
 */
advjs.SliderHandle.prototype.defaultValue = 0;

/** @inheritDoc */
advjs.SliderHandle.prototype.createEl = function(type, props) {
    props = props || {};
    // Add the slider element class to all sub classes
    props.className = props.className + ' advjs-slider-handle';
    props = advjs.obj.merge({
        innerHTML: '<span class="advjs-control-text">'+this.defaultValue+'</span>'
    }, props);

    return advjs.Component.prototype.createEl.call(this, 'div', props);
};
/* Menu
 ================================================================================ */
/**
 * The Menu component is used to build pop up menus, including subtitle and
 * captions selection menus.
 *
 * @param {advjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
advjs.Menu = advjs.Component.extend();

/**
 * Add a menu item to the menu
 * @param {Object|String} component Component or component type to add
 */
advjs.Menu.prototype.addItem = function(component){
    this.addChild(component);
    component.on('click', advjs.bind(this, function(){
        this.unlockShowing();
    }));
};

/** @inheritDoc */
advjs.Menu.prototype.createEl = function(){
    var contentElType = this.options().contentElType || 'ul';
    this.contentEl_ = advjs.createEl(contentElType, {
        className: 'advjs-menu-content'
    });
    var el = advjs.Component.prototype.createEl.call(this, 'div', {
        append: this.contentEl_,
        className: 'advjs-menu'
    });
    el.appendChild(this.contentEl_);

    // Prevent clicks from bubbling up. Needed for Menu Buttons,
    // where a click on the parent is significant
    advjs.on(el, 'click', function(event){
        event.preventDefault();
        event.stopImmediatePropagation();
    });

    return el;
};

/**
 * The component for a menu item. `<li>`
 *
 * @param {advjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
advjs.MenuItem = advjs.Button.extend({
    /** @constructor */
    init: function(player, options){
        advjs.Button.call(this, player, options);
        this.selected(options['selected']);
    }
});

/** @inheritDoc */
advjs.MenuItem.prototype.createEl = function(type, props){
    return advjs.Button.prototype.createEl.call(this, 'li', advjs.obj.merge({
        className: 'advjs-menu-item',
        innerHTML: this.localize(this.options_['label'])
    }, props));
};

/**
 * Handle a click on the menu item, and set it to selected
 */
advjs.MenuItem.prototype.onClick = function(){
    this.selected(true);
};

/**
 * Set this menu item as selected or not
 * @param  {Boolean} selected
 */
advjs.MenuItem.prototype.selected = function(selected){
    if (selected) {
        this.addClass('advjs-selected');
        this.el_.setAttribute('aria-selected',true);
    } else {
        this.removeClass('advjs-selected');
        this.el_.setAttribute('aria-selected',false);
    }
};


/**
 * A button class with a popup menu
 * @param {advjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
advjs.MenuButton = advjs.Button.extend({
    /** @constructor */
    init: function(player, options){
        advjs.Button.call(this, player, options);

        this.update();

        this.on('keydown', this.onKeyPress);
        this.el_.setAttribute('aria-haspopup', true);
        this.el_.setAttribute('role', 'button');
    }
});

advjs.MenuButton.prototype.update = function() {
    var menu = this.createMenu();

    if (this.menu) {
        this.removeChild(this.menu);
    }

    this.menu = menu;
    this.addChild(menu);

    if (this.items && this.items.length === 0) {
        this.hide();
    } else if (this.items && this.items.length > 1) {
        this.show();
    }
};

/**
 * Track the state of the menu button
 * @type {Boolean}
 * @private
 */
advjs.MenuButton.prototype.buttonPressed_ = false;

advjs.MenuButton.prototype.createMenu = function(){
    var menu = new advjs.Menu(this.player_);

    // Add a title list item to the top
    if (this.options().title) {
        menu.contentEl().appendChild(advjs.createEl('li', {
            className: 'advjs-menu-title',
            innerHTML: advjs.capitalize(this.options().title),
            tabindex: -1
        }));
    }

    this.items = this['createItems']();

    if (this.items) {
        // Add menu items to the menu
        for (var i = 0; i < this.items.length; i++) {
            menu.addItem(this.items[i]);
        }
    }

    return menu;
};

/**
 * Create the list of menu items. Specific to each subclass.
 */
advjs.MenuButton.prototype.createItems = function(){};

/** @inheritDoc */
advjs.MenuButton.prototype.buildCSSClass = function(){
    return this.className + ' advjs-menu-button ' + advjs.Button.prototype.buildCSSClass.call(this);
};

// Focus - Add keyboard functionality to element
// This function is not needed anymore. Instead, the keyboard functionality is handled by
// treating the button as triggering a submenu. When the button is pressed, the submenu
// appears. Pressing the button again makes the submenu disappear.
advjs.MenuButton.prototype.onFocus = function(){};
// Can't turn off list display that we turned on with focus, because list would go away.
advjs.MenuButton.prototype.onBlur = function(){};

advjs.MenuButton.prototype.onClick = function(){
    // When you click the button it adds focus, which will show the menu indefinitely.
    // So we'll remove focus when the mouse leaves the button.
    // Focus is needed for tab navigation.
    this.one('mouseout', advjs.bind(this, function(){
        this.menu.unlockShowing();
        this.el_.blur();
    }));
    if (this.buttonPressed_){
        this.unpressButton();
    } else {
        this.pressButton();
    }
};

advjs.MenuButton.prototype.onKeyPress = function(event){

    // Check for space bar (32) or enter (13) keys
    if (event.which == 32 || event.which == 13) {
        if (this.buttonPressed_){
            this.unpressButton();
        } else {
            this.pressButton();
        }
        event.preventDefault();
        // Check for escape (27) key
    } else if (event.which == 27){
        if (this.buttonPressed_){
            this.unpressButton();
        }
        event.preventDefault();
    }
};

advjs.MenuButton.prototype.pressButton = function(){
    this.buttonPressed_ = true;
    this.menu.lockShowing();
    this.el_.setAttribute('aria-pressed', true);
    if (this.items && this.items.length > 0) {
        this.items[0].el().focus(); // set the focus to the title of the submenu
    }
};

advjs.MenuButton.prototype.unpressButton = function(){
    this.buttonPressed_ = false;
    this.menu.unlockShowing();
    this.el_.setAttribute('aria-pressed', false);
};
/**
 * Custom MediaError to mimic the HTML5 MediaError
 * @param {Number} code The media error code
 */
advjs.MediaError = function(code){
    if (typeof code === 'number') {
        this.code = code;
    } else if (typeof code === 'string') {
        // default code is zero, so this is a custom error
        this.message = code;
    } else if (typeof code === 'object') { // object
        advjs.obj.merge(this, code);
    }

    if (!this.message) {
        this.message = advjs.MediaError.defaultMessages[this.code] || '';
    }
};

/**
 * The error code that refers two one of the defined
 * MediaError types
 * @type {Number}
 */
advjs.MediaError.prototype.code = 0;

/**
 * An optional message to be shown with the error.
 * Message is not part of the HTML5 video spec
 * but allows for more informative custom errors.
 * @type {String}
 */
advjs.MediaError.prototype.message = '';

/**
 * An optional status code that can be set by plugins
 * to allow even more detail about the error.
 * For example the HLS plugin might provide the specific
 * HTTP status code that was returned when the error
 * occurred, then allowing a custom error overlay
 * to display more information.
 * @type {[type]}
 */
advjs.MediaError.prototype.status = null;

advjs.MediaError.errorTypes = [
    'MEDIA_ERR_CUSTOM',            // = 0
    'MEDIA_ERR_ABORTED',           // = 1
    'MEDIA_ERR_NETWORK',           // = 2
    'MEDIA_ERR_DECODE',            // = 3
    'MEDIA_ERR_SRC_NOT_SUPPORTED', // = 4
    'MEDIA_ERR_ENCRYPTED'          // = 5
];

advjs.MediaError.defaultMessages = {
    1: 'You aborted the video playback',
    2: 'A network error caused the video download to fail part-way.',
    3: 'The video playback was aborted due to a corruption problem or because the video used features your browser did not support.',
    4: 'The video could not be loaded, either because the server or network failed or because the format is not supported.',
    5: 'The video is encrypted and we do not have the keys to decrypt it.'
};

// Add types as properties on MediaError
// e.g. MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED = 4;
for (var errNum = 0; errNum < advjs.MediaError.errorTypes.length; errNum++) {
    advjs.MediaError[advjs.MediaError.errorTypes[errNum]] = errNum;
    // values should be accessible on both the class and instance
    advjs.MediaError.prototype[advjs.MediaError.errorTypes[errNum]] = errNum;
}
(function(){
    var apiMap, specApi, browserApi, i;

    /**
     * Store the browser-specific methods for the fullscreen API
     * @type {Object|undefined}
     * @private
     */
    advjs.browser.fullscreenAPI;

    // browser API methods
    // map approach from Screenful.js - https://github.com/sindresorhus/screenfull.js
    apiMap = [
        // Spec: https://dvcs.w3.org/hg/fullscreen/raw-file/tip/Overview.html
        [
            'requestFullscreen',
            'exitFullscreen',
            'fullscreenElement',
            'fullscreenEnabled',
            'fullscreenchange',
            'fullscreenerror'
        ],
        // WebKit
        [
            'webkitRequestFullscreen',
            'webkitExitFullscreen',
            'webkitFullscreenElement',
            'webkitFullscreenEnabled',
            'webkitfullscreenchange',
            'webkitfullscreenerror'
        ],
        // Old WebKit (Safari 5.1)
        [
            'webkitRequestFullScreen',
            'webkitCancelFullScreen',
            'webkitCurrentFullScreenElement',
            'webkitCancelFullScreen',
            'webkitfullscreenchange',
            'webkitfullscreenerror'
        ],
        // Mozilla
        [
            'mozRequestFullScreen',
            'mozCancelFullScreen',
            'mozFullScreenElement',
            'mozFullScreenEnabled',
            'mozfullscreenchange',
            'mozfullscreenerror'
        ],
        // Microsoft
        [
            'msRequestFullscreen',
            'msExitFullscreen',
            'msFullscreenElement',
            'msFullscreenEnabled',
            'MSFullscreenChange',
            'MSFullscreenError'
        ]
    ];

    specApi = apiMap[0];

    // determine the supported set of functions
    for (i=0; i<apiMap.length; i++) {
        // check for exitFullscreen function
        if (apiMap[i][1] in document) {
            browserApi = apiMap[i];
            break;
        }
    }

    // map the browser API names to the spec API names
    // or leave advjs.browser.fullscreenAPI undefined
    if (browserApi) {
        advjs.browser.fullscreenAPI = {};

        for (i=0; i<browserApi.length; i++) {
            advjs.browser.fullscreenAPI[specApi[i]] = browserApi[i];
        }
    }

})();
/**
 * An instance of the `advjs.Player` class is created when any of the Video.js setup methods are used to initialize a video.
 *
 * ```js
 * var myPlayer = advjs('example_video_1');
 * ```
 *
 * In the following example, the `data-setup` attribute tells the Video.js library to create a player instance when the library is ready.
 *
 * ```html
 * <video id="example_video_1" data-setup='{}' controls>
 *   <source src="my-source.mp4" type="video/mp4">
 * </video>
 * ```
 *
 * After an instance has been created it can be accessed globally using `Video('example_video_1')`.
 *
 * @class
 * @extends advjs.Component
 */
advjs.Player = advjs.Component.extend({

    /**
     * player's constructor function
     *
     * @constructs
     * @method init
     * @param {Element} tag        The original video tag used for configuring options
     * @param {Object=} options    Player options
     * @param {Function=} ready    Ready callback function
     */
    init: function(tag, options, ready){
        this.tag = tag; // Store the original tag used to set options

        // Make sure tag ID exists
        tag.id = tag.id || 'vjs_video_' + advjs.guid++;

        // Store the tag attributes used to restore html5 element
        this.tagAttributes = tag && advjs.getElementAttributes(tag);

        // Set Options
        // The options argument overrides options set in the video tag
        // which overrides globally set options.
        // This latter part coincides with the load order
        // (tag must exist before Player)
        options = advjs.obj.merge(this.getTagSettings(tag), options);

        // Update Current Language
        this.language_ = options['language'] || advjs.options['language'];

        // Update Supported Languages
        this.languages_ = options['languages'] || advjs.options['languages'];

        // Cache for video property values.
        this.cache_ = {};

        // Set poster
        this.poster_ = options['poster'] || '';

        // Set controls
        this.controls_ = !!options['controls'];
        // Original tag settings stored in options
        // now remove immediately so native controls don't flash.
        // May be turned back on by HTML5 tech if nativeControlsForTouch is true
        tag.controls = false;

        // we don't want the player to report touch activity on itself
        // see enableTouchActivity in Component
        options.reportTouchActivity = false;

        // Set isAudio based on whether or not an audio tag was used
        this.isAudio(this.tag.nodeName.toLowerCase() === 'audio');

        // Run base component initializing with new options.
        // Builds the element through createEl()
        // Inits and embeds any child components in opts
        advjs.Component.call(this, this, options, ready);

        // Update controls className. Can't do this when the controls are initially
        // set because the element doesn't exist yet.
        if (this.controls()) {
            this.addClass('advjs-controls-enabled');
        } else {
            this.addClass('advjs-controls-disabled');
        }

        if (this.isAudio()) {
            this.addClass('advjs-audio');
        }

        // TODO: Make this smarter. Toggle user state between touching/mousing
        // using events, since devices can have both touch and mouse events.
        // if (advjs.TOUCH_ENABLED) {
        //   this.addClass('advjs-touch-enabled');
        // }

        // Make player easily findable by ID
        advjs.players[this.id_] = this;

        if (options['plugins']) {
            advjs.obj.each(options['plugins'], function(key, val){
                this[key](val);
            }, this);
        }

        this.listenForUserActivity();
    }
});

/**
 * The player's stored language code
 *
 * @type {String}
 * @private
 */
advjs.Player.prototype.language_;

/**
 * The player's language code
 * @param  {String} languageCode  The locale string
 * @return {String}             The locale string when getting
 * @return {advjs.Player}         self, when setting
 */
advjs.Player.prototype.language = function (languageCode) {
    if (languageCode === undefined) {
        return this.language_;
    }

    this.language_ = languageCode;
    return this;
};

/**
 * The player's stored language dictionary
 *
 * @type {Object}
 * @private
 */
advjs.Player.prototype.languages_;

advjs.Player.prototype.languages = function(){
    return this.languages_;
};

/**
 * Player instance options, surfaced using advjs.options
 * advjs.options = advjs.Player.prototype.options_
 * Make changes in advjs.options, not here.
 * All options should use string keys so they avoid
 * renaming by closure compiler
 * @type {Object}
 * @private
 */
advjs.Player.prototype.options_ = advjs.options;

/**
 * Destroys the video player and does any necessary cleanup
 *
 *     myPlayer.dispose();
 *
 * This is especially helpful if you are dynamically adding and removing videos
 * to/from the DOM.
 */
advjs.Player.prototype.dispose = function(){
    this.trigger('dispose');
    // prevent dispose from being called twice
    this.off('dispose');

    // Kill reference to this player
    advjs.players[this.id_] = null;
    if (this.tag && this.tag['player']) { this.tag['player'] = null; }
    if (this.el_ && this.el_['player']) { this.el_['player'] = null; }

    if (this.tech) { this.tech.dispose(); }

    // Component dispose
    advjs.Component.prototype.dispose.call(this);
};

advjs.Player.prototype.getTagSettings = function(tag){
    var tagOptions,
        dataSetup,
        options = {
            'sources': [],
            'tracks': []
        };

    tagOptions = advjs.getElementAttributes(tag);
    dataSetup = tagOptions['data-setup'];

    // Check if data-setup attr exists.
    if (dataSetup !== null){
        // Parse options JSON
        // If empty string, make it a parsable json object.
        advjs.obj.merge(tagOptions, advjs.JSON.parse(dataSetup || '{}'));
    }

    advjs.obj.merge(options, tagOptions);

    // Get tag children settings
    if (tag.hasChildNodes()) {
        var children, child, childName, i, j;

        children = tag.childNodes;

        for (i=0,j=children.length; i<j; i++) {
            child = children[i];
            // Change case needed: http://ejohn.org/blog/nodename-case-sensitivity/
            childName = child.nodeName.toLowerCase();
            if (childName === 'source') {
                options['sources'].push(advjs.getElementAttributes(child));
            } else if (childName === 'track') {
                options['tracks'].push(advjs.getElementAttributes(child));
            }
        }
    }

    return options;
};

advjs.Player.prototype.createEl = function(){
    var
        el = this.el_ = advjs.Component.prototype.createEl.call(this, 'div'),
        tag = this.tag,
        attrs;

    // Remove width/height attrs from tag so CSS can make it 100% width/height
    tag.removeAttribute('width');
    tag.removeAttribute('height');

    // Copy over all the attributes from the tag, including ID and class
    // ID will now reference player box, not the video tag
    attrs = advjs.getElementAttributes(tag);
    advjs.obj.each(attrs, function(attr) {
        // workaround so we don't totally break IE7
        // http://stackoverflow.com/questions/3653444/css-styles-not-applied-on-dynamic-elements-in-internet-explorer-7
        if (attr == 'class') {
            el.className = attrs[attr];
        } else {
            el.setAttribute(attr, attrs[attr]);
        }
    });

    // Update tag id/class for use as HTML5 playback tech
    // Might think we should do this after embedding in container so .advjs-tech class
    // doesn't flash 100% width/height, but class only applies with .video-js parent
    tag.id += '_html5_api';
    tag.className = 'advjs-tech';

    // Make player findable on elements
    tag['player'] = el['player'] = this;
    // Default state of video is paused
    this.addClass('advjs-paused');

    // Make box use width/height of tag, or rely on default implementation
    // Enforce with CSS since width/height attrs don't work on divs
    this.width(this.options_['width'], true); // (true) Skip resize listener on load
    this.height(this.options_['height'], true);

    // advjs.insertFirst seems to cause the networkState to flicker from 3 to 2, so
    // keep track of the original for later so we can know if the source originally failed
    tag.initNetworkState_ = tag.networkState;

    // Wrap video tag in div (el/box) container
    if (tag.parentNode) {
        tag.parentNode.insertBefore(el, tag);
    }
    advjs.insertFirst(tag, el); // Breaks iPhone, fixed in HTML5 setup.

    // The event listeners need to be added before the children are added
    // in the component init because the tech (loaded with mediaLoader) may
    // fire events, like loadstart, that these events need to capture.
    // Long term it might be better to expose a way to do this in component.init
    // like component.initEventListeners() that runs between el creation and
    // adding children
    this.el_ = el;
    this.on('loadstart', this.onLoadStart);
    this.on('waiting', this.onWaiting);
    this.on(['canplay', 'canplaythrough', 'playing', 'ended'], this.onWaitEnd);
    this.on('seeking', this.onSeeking);
    this.on('seeked', this.onSeeked);
    this.on('ended', this.onEnded);
    this.on('play', this.onPlay);
    this.on('firstplay', this.onFirstPlay);
    this.on('pause', this.onPause);
    this.on('progress', this.onProgress);
    this.on('durationchange', this.onDurationChange);
    this.on('fullscreenchange', this.onFullscreenChange);

    return el;
};

// /* Media Technology (tech)
// ================================================================================ */
// Load/Create an instance of playback technology including element and API methods
// And append playback element in player div.
advjs.Player.prototype.loadTech = function(techName, source){

    // Pause and remove current playback technology
    if (this.tech) {
        this.unloadTech();
    }

    // get rid of the HTML5 video tag as soon as we are using another tech
    if (techName !== 'Html5' && this.tag) {
        advjs.Html5.disposeMediaElement(this.tag);
        this.tag = null;
    }

    this.techName = techName;

    // Turn off API access because we're loading a new tech that might load asynchronously
    this.isReady_ = false;

    var techReady = function(){
        this.player_.triggerReady();
    };

    // Grab tech-specific options from player options and add source and parent element to use.
    var techOptions = advjs.obj.merge({ 'source': source, 'parentEl': this.el_ }, this.options_[techName.toLowerCase()]);

    if (source) {
        this.currentType_ = source.type;
        if (source.src == this.cache_.src && this.cache_.currentTime > 0) {
            techOptions['startTime'] = this.cache_.currentTime;
        }

        this.cache_.src = source.src;
    }

    // Initialize tech instance
    this.tech = new window['advjs'][techName](this, techOptions);

    this.tech.ready(techReady);
};

advjs.Player.prototype.unloadTech = function(){
    this.isReady_ = false;

    this.tech.dispose();

    this.tech = false;
};

// There's many issues around changing the size of a Flash (or other plugin) object.
// First is a plugin reload issue in Firefox that has been around for 11 years: https://bugzilla.mozilla.org/show_bug.cgi?id=90268
// Then with the new fullscreen API, Mozilla and webkit browsers will reload the flash object after going to fullscreen.
// To get around this, we're unloading the tech, caching source and currentTime values, and reloading the tech once the plugin is resized.
// reloadTech: function(betweenFn){
//   advjs.log('unloadingTech')
//   this.unloadTech();
//   advjs.log('unloadedTech')
//   if (betweenFn) { betweenFn.call(); }
//   advjs.log('LoadingTech')
//   this.loadTech(this.techName, { src: this.cache_.src })
//   advjs.log('loadedTech')
// },

// /* Player event handlers (how the player reacts to certain events)
// ================================================================================ */

/**
 * Fired when the user agent begins looking for media data
 * @event loadstart
 */
advjs.Player.prototype.onLoadStart = function() {
    // TODO: Update to use `emptied` event instead. See #1277.

    this.removeClass('advjs-ended');

    // reset the error state
    this.error(null);

    // If it's already playing we want to trigger a firstplay event now.
    // The firstplay event relies on both the play and loadstart events
    // which can happen in any order for a new source
    if (!this.paused()) {
        this.trigger('firstplay');
    } else {
        // reset the hasStarted state
        this.hasStarted(false);
    }
};

advjs.Player.prototype.hasStarted_ = false;

advjs.Player.prototype.hasStarted = function(hasStarted){
    if (hasStarted !== undefined) {
        // only update if this is a new value
        if (this.hasStarted_ !== hasStarted) {
            this.hasStarted_ = hasStarted;
            if (hasStarted) {
                this.addClass('advjs-has-started');
                // trigger the firstplay event if this newly has played
                this.trigger('firstplay');
            } else {
                this.removeClass('advjs-has-started');
            }
        }
        return this;
    }
    return this.hasStarted_;
};

/**
 * Fired when the player has initial duration and dimension information
 * @event loadedmetadata
 */
advjs.Player.prototype.onLoadedMetaData;

/**
 * Fired when the player has downloaded data at the current playback position
 * @event loadeddata
 */
advjs.Player.prototype.onLoadedData;

/**
 * Fired when the player has finished downloading the source data
 * @event loadedalldata
 */
advjs.Player.prototype.onLoadedAllData;

/**
 * Fired whenever the media begins or resumes playback
 * @event play
 */
advjs.Player.prototype.onPlay = function(){
    this.removeClass('advjs-ended');
    this.removeClass('advjs-paused');
    this.addClass('advjs-playing');

    // hide the poster when the user hits play
    // https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-play
    this.hasStarted(true);
};

/**
 * Fired whenever the media begins waiting
 * @event waiting
 */
advjs.Player.prototype.onWaiting = function(){
    this.addClass('advjs-waiting');
};

/**
 * A handler for events that signal that waiting has ended
 * which is not consistent between browsers. See #1351
 * @private
 */
advjs.Player.prototype.onWaitEnd = function(){
    this.removeClass('advjs-waiting');
};

/**
 * Fired whenever the player is jumping to a new time
 * @event seeking
 */
advjs.Player.prototype.onSeeking = function(){
    this.addClass('advjs-seeking');
};

/**
 * Fired when the player has finished jumping to a new time
 * @event seeked
 */
advjs.Player.prototype.onSeeked = function(){
    this.removeClass('advjs-seeking');
};

/**
 * Fired the first time a video is played
 *
 * Not part of the HLS spec, and we're not sure if this is the best
 * implementation yet, so use sparingly. If you don't have a reason to
 * prevent playback, use `myPlayer.one('play');` instead.
 *
 * @event firstplay
 */
advjs.Player.prototype.onFirstPlay = function(){
    //If the first starttime attribute is specified
    //then we will start at the given offset in seconds
    if(this.options_['starttime']){
        this.currentTime(this.options_['starttime']);
    }

    this.addClass('advjs-has-started');
};

/**
 * Fired whenever the media has been paused
 * @event pause
 */
advjs.Player.prototype.onPause = function(){
    this.removeClass('advjs-playing');
    this.addClass('advjs-paused');
};

/**
 * Fired when the current playback position has changed
 *
 * During playback this is fired every 15-250 milliseconds, depending on the
 * playback technology in use.
 * @event timeupdate
 */
advjs.Player.prototype.onTimeUpdate;

/**
 * Fired while the user agent is downloading media data
 * @event progress
 */
advjs.Player.prototype.onProgress = function(){
    // Add custom event for when source is finished downloading.
    if (this.bufferedPercent() == 1) {
        this.trigger('loadedalldata');
    }
};

/**
 * Fired when the end of the media resource is reached (currentTime == duration)
 * @event ended
 */
advjs.Player.prototype.onEnded = function(){
    this.addClass('advjs-ended');
    if (this.options_['loop']) {
        this.currentTime(0);
        this.play();
    } else if (!this.paused()) {
        this.pause();
    }
};

/**
 * Fired when the duration of the media resource is first known or changed
 * @event durationchange
 */
advjs.Player.prototype.onDurationChange = function(){
    // Allows for caching value instead of asking player each time.
    // We need to get the techGet response and check for a value so we don't
    // accidentally cause the stack to blow up.
    var duration = this.techGet('duration');
    if (duration) {
        if (duration < 0) {
            duration = Infinity;
        }
        this.duration(duration);
        // Determine if the stream is live and propagate styles down to UI.
        if (duration === Infinity) {
            this.addClass('advjs-live');
        } else {
            this.removeClass('advjs-live');
        }
    }
};

/**
 * Fired when the volume changes
 * @event volumechange
 */
advjs.Player.prototype.onVolumeChange;

/**
 * Fired when the player switches in or out of fullscreen mode
 * @event fullscreenchange
 */
advjs.Player.prototype.onFullscreenChange = function() {
    if (this.isFullscreen()) {
        this.addClass('advjs-fullscreen');
    } else {
        this.removeClass('advjs-fullscreen');
    }
};

/**
 * Fired when an error occurs
 * @event error
 */
advjs.Player.prototype.onError;

// /* Player API
// ================================================================================ */

/**
 * Object for cached values.
 * @private
 */
advjs.Player.prototype.cache_;

advjs.Player.prototype.getCache = function(){
    return this.cache_;
};

// Pass values to the playback tech
advjs.Player.prototype.techCall = function(method, arg){
    // If it's not ready yet, call method when it is
    if (this.tech && !this.tech.isReady_) {
        this.tech.ready(function(){
            this[method](arg);
        });

        // Otherwise call method now
    } else {
        try {
            this.tech[method](arg);
        } catch(e) {
            advjs.log(e);
            throw e;
        }
    }
};

// Get calls can't wait for the tech, and sometimes don't need to.
advjs.Player.prototype.techGet = function(method){
    if (this.tech && this.tech.isReady_) {

        // Flash likes to die and reload when you hide or reposition it.
        // In these cases the object methods go away and we get errors.
        // When that happens we'll catch the errors and inform tech that it's not ready any more.
        try {
            return this.tech[method]();
        } catch(e) {
            // When building additional tech libs, an expected method may not be defined yet
            if (this.tech[method] === undefined) {
                advjs.log('Video.js: ' + method + ' method not defined for '+this.techName+' playback technology.', e);
            } else {
                // When a method isn't available on the object it throws a TypeError
                if (e.name == 'TypeError') {
                    advjs.log('Video.js: ' + method + ' unavailable on '+this.techName+' playback technology element.', e);
                    this.tech.isReady_ = false;
                } else {
                    advjs.log(e);
                }
            }
            throw e;
        }
    }

    return;
};

/**
 * start media playback
 *
 *     myPlayer.play();
 *
 * @return {advjs.Player} self
 */
advjs.Player.prototype.play = function(){
    this.techCall('play');
    return this;
};

/**
 * Pause the video playback
 *
 *     myPlayer.pause();
 *
 * @return {advjs.Player} self
 */
advjs.Player.prototype.pause = function(){
    this.techCall('pause');
    return this;
};

/**
 * Check if the player is paused
 *
 *     var isPaused = myPlayer.paused();
 *     var isPlaying = !myPlayer.paused();
 *
 * @return {Boolean} false if the media is currently playing, or true otherwise
 */
advjs.Player.prototype.paused = function(){
    // The initial state of paused should be true (in Safari it's actually false)
    return (this.techGet('paused') === false) ? false : true;
};

/**
 * Get or set the current time (in seconds)
 *
 *     // get
 *     var whereYouAt = myPlayer.currentTime();
 *
 *     // set
 *     myPlayer.currentTime(120); // 2 minutes into the video
 *
 * @param  {Number|String=} seconds The time to seek to
 * @return {Number}        The time in seconds, when not setting
 * @return {advjs.Player}    self, when the current time is set
 */
advjs.Player.prototype.currentTime = function(seconds){
    if (seconds !== undefined) {

        this.techCall('setCurrentTime', seconds);

        return this;
    }

    // cache last currentTime and return. default to 0 seconds
    //
    // Caching the currentTime is meant to prevent a massive amount of reads on the tech's
    // currentTime when scrubbing, but may not provide much performance benefit afterall.
    // Should be tested. Also something has to read the actual current time or the cache will
    // never get updated.
    return this.cache_.currentTime = (this.techGet('currentTime') || 0);
};

/**
 * Get the length in time of the video in seconds
 *
 *     var lengthOfVideo = myPlayer.duration();
 *
 * **NOTE**: The video must have started loading before the duration can be
 * known, and in the case of Flash, may not be known until the video starts
 * playing.
 *
 * @return {Number} The duration of the video in seconds
 */
advjs.Player.prototype.duration = function(seconds){
    if (seconds !== undefined) {

        // cache the last set value for optimized scrubbing (esp. Flash)
        this.cache_.duration = parseFloat(seconds);

        return this;
    }

    if (this.cache_.duration === undefined) {
        this.onDurationChange();
    }

    return this.cache_.duration || 0;
};

/**
 * Calculates how much time is left.
 *
 *     var timeLeft = myPlayer.remainingTime();
 *
 * Not a native video element function, but useful
 * @return {Number} The time remaining in seconds
 */
advjs.Player.prototype.remainingTime = function(){
    return this.duration() - this.currentTime();
};

// http://dev.w3.org/html5/spec/video.html#dom-media-buffered
// Buffered returns a timerange object.
// Kind of like an array of portions of the video that have been downloaded.

/**
 * Get a TimeRange object with the times of the video that have been downloaded
 *
 * If you just want the percent of the video that's been downloaded,
 * use bufferedPercent.
 *
 *     // Number of different ranges of time have been buffered. Usually 1.
 *     numberOfRanges = bufferedTimeRange.length,
 *
 *     // Time in seconds when the first range starts. Usually 0.
 *     firstRangeStart = bufferedTimeRange.start(0),
 *
 *     // Time in seconds when the first range ends
 *     firstRangeEnd = bufferedTimeRange.end(0),
 *
 *     // Length in seconds of the first time range
 *     firstRangeLength = firstRangeEnd - firstRangeStart;
 *
 * @return {Object} A mock TimeRange object (following HTML spec)
 */
advjs.Player.prototype.buffered = function(){
    var buffered = this.techGet('buffered');

    if (!buffered || !buffered.length) {
        buffered = advjs.createTimeRange(0,0);
    }

    return buffered;
};

/**
 * Get the percent (as a decimal) of the video that's been downloaded
 *
 *     var howMuchIsDownloaded = myPlayer.bufferedPercent();
 *
 * 0 means none, 1 means all.
 * (This method isn't in the HTML5 spec, but it's very convenient)
 *
 * @return {Number} A decimal between 0 and 1 representing the percent
 */
advjs.Player.prototype.bufferedPercent = function(){
    var duration = this.duration(),
        buffered = this.buffered(),
        bufferedDuration = 0,
        start, end;

    if (!duration) {
        return 0;
    }

    for (var i=0; i<buffered.length; i++){
        start = buffered.start(i);
        end   = buffered.end(i);

        // buffered end can be bigger than duration by a very small fraction
        if (end > duration) {
            end = duration;
        }

        bufferedDuration += end - start;
    }

    return bufferedDuration / duration;
};

/**
 * Get the ending time of the last buffered time range
 *
 * This is used in the progress bar to encapsulate all time ranges.
 * @return {Number} The end of the last buffered time range
 */
advjs.Player.prototype.bufferedEnd = function(){
    var buffered = this.buffered(),
        duration = this.duration(),
        end = buffered.end(buffered.length-1);

    if (end > duration) {
        end = duration;
    }

    return end;
};

/**
 * Get or set the current volume of the media
 *
 *     // get
 *     var howLoudIsIt = myPlayer.volume();
 *
 *     // set
 *     myPlayer.volume(0.5); // Set volume to half
 *
 * 0 is off (muted), 1.0 is all the way up, 0.5 is half way.
 *
 * @param  {Number} percentAsDecimal The new volume as a decimal percent
 * @return {Number}                  The current volume, when getting
 * @return {advjs.Player}              self, when setting
 */
advjs.Player.prototype.volume = function(percentAsDecimal){
    var vol;

    if (percentAsDecimal !== undefined) {
        vol = Math.max(0, Math.min(1, parseFloat(percentAsDecimal))); // Force value to between 0 and 1
        this.cache_.volume = vol;
        this.techCall('setVolume', vol);
        advjs.setLocalStorage('volume', vol);
        return this;
    }

    // Default to 1 when returning current volume.
    vol = parseFloat(this.techGet('volume'));
    return (isNaN(vol)) ? 1 : vol;
};


/**
 * Get the current muted state, or turn mute on or off
 *
 *     // get
 *     var isVolumeMuted = myPlayer.muted();
 *
 *     // set
 *     myPlayer.muted(true); // mute the volume
 *
 * @param  {Boolean=} muted True to mute, false to unmute
 * @return {Boolean} True if mute is on, false if not, when getting
 * @return {advjs.Player} self, when setting mute
 */
advjs.Player.prototype.muted = function(muted){
    if (muted !== undefined) {
        this.techCall('setMuted', muted);
        return this;
    }
    return this.techGet('muted') || false; // Default to false
};

// Check if current tech can support native fullscreen
// (e.g. with built in controls like iOS, so not our flash swf)
advjs.Player.prototype.supportsFullScreen = function(){
    return this.techGet('supportsFullScreen') || false;
};

/**
 * is the player in fullscreen
 * @type {Boolean}
 * @private
 */
advjs.Player.prototype.isFullscreen_ = false;

/**
 * Check if the player is in fullscreen mode
 *
 *     // get
 *     var fullscreenOrNot = myPlayer.isFullscreen();
 *
 *     // set
 *     myPlayer.isFullscreen(true); // tell the player it's in fullscreen
 *
 * NOTE: As of the latest HTML5 spec, isFullscreen is no longer an official
 * property and instead document.fullscreenElement is used. But isFullscreen is
 * still a valuable property for internal player workings.
 *
 * @param  {Boolean=} isFS Update the player's fullscreen state
 * @return {Boolean} true if fullscreen, false if not
 * @return {advjs.Player} self, when setting
 */
advjs.Player.prototype.isFullscreen = function(isFS){
    if (isFS !== undefined) {
        this.isFullscreen_ = !!isFS;
        return this;
    }
    return this.isFullscreen_;
};

/**
 * Old naming for isFullscreen()
 * @deprecated for lowercase 's' version
 */
advjs.Player.prototype.isFullScreen = function(isFS){
    advjs.log.warn('player.isFullScreen() has been deprecated, use player.isFullscreen() with a lowercase "s")');
    return this.isFullscreen(isFS);
};

/**
 * Increase the size of the video to full screen
 *
 *     myPlayer.requestFullscreen();
 *
 * In some browsers, full screen is not supported natively, so it enters
 * "full window mode", where the video fills the browser window.
 * In browsers and devices that support native full screen, sometimes the
 * browser's default controls will be shown, and not the Video.js custom skin.
 * This includes most mobile devices (iOS, Android) and older versions of
 * Safari.
 *
 * @return {advjs.Player} self
 */
advjs.Player.prototype.requestFullscreen = function(){
    var fsApi = advjs.browser.fullscreenAPI;

    this.isFullscreen(true);

    if (fsApi) {
        // the browser supports going fullscreen at the element level so we can
        // take the controls fullscreen as well as the video

        // Trigger fullscreenchange event after change
        // We have to specifically add this each time, and remove
        // when canceling fullscreen. Otherwise if there's multiple
        // players on a page, they would all be reacting to the same fullscreen
        // events
        advjs.on(document, fsApi['fullscreenchange'], advjs.bind(this, function(e){
            this.isFullscreen(document[fsApi.fullscreenElement]);

            // If cancelling fullscreen, remove event listener.
            if (this.isFullscreen() === false) {
                advjs.off(document, fsApi['fullscreenchange'], arguments.callee);
            }

            this.trigger('fullscreenchange');
        }));

        this.el_[fsApi.requestFullscreen]();

    } else if (this.tech.supportsFullScreen()) {
        // we can't take the video.js controls fullscreen but we can go fullscreen
        // with native controls
        this.techCall('enterFullScreen');
    } else {
        // fullscreen isn't supported so we'll just stretch the video element to
        // fill the viewport
        this.enterFullWindow();
        this.trigger('fullscreenchange');
    }

    return this;
};

/**
 * Old naming for requestFullscreen
 * @deprecated for lower case 's' version
 */
advjs.Player.prototype.requestFullScreen = function(){
    advjs.log.warn('player.requestFullScreen() has been deprecated, use player.requestFullscreen() with a lowercase "s")');
    return this.requestFullscreen();
};


/**
 * Return the video to its normal size after having been in full screen mode
 *
 *     myPlayer.exitFullscreen();
 *
 * @return {advjs.Player} self
 */
advjs.Player.prototype.exitFullscreen = function(){
    var fsApi = advjs.browser.fullscreenAPI;
    this.isFullscreen(false);

    // Check for browser element fullscreen support
    if (fsApi) {
        document[fsApi.exitFullscreen]();
    } else if (this.tech.supportsFullScreen()) {
        this.techCall('exitFullScreen');
    } else {
        this.exitFullWindow();
        this.trigger('fullscreenchange');
    }

    return this;
};

/**
 * Old naming for exitFullscreen
 * @deprecated for exitFullscreen
 */
advjs.Player.prototype.cancelFullScreen = function(){
    advjs.log.warn('player.cancelFullScreen() has been deprecated, use player.exitFullscreen()');
    return this.exitFullscreen();
};

// When fullscreen isn't supported we can stretch the video container to as wide as the browser will let us.
advjs.Player.prototype.enterFullWindow = function(){
    this.isFullWindow = true;

    // Storing original doc overflow value to return to when fullscreen is off
    this.docOrigOverflow = document.documentElement.style.overflow;

    // Add listener for esc key to exit fullscreen
    advjs.on(document, 'keydown', advjs.bind(this, this.fullWindowOnEscKey));

    // Hide any scroll bars
    document.documentElement.style.overflow = 'hidden';

    // Apply fullscreen styles
    advjs.addClass(document.body, 'advjs-full-window');

    this.trigger('enterFullWindow');
};
advjs.Player.prototype.fullWindowOnEscKey = function(event){
    if (event.keyCode === 27) {
        if (this.isFullscreen() === true) {
            this.exitFullscreen();
        } else {
            this.exitFullWindow();
        }
    }
};

advjs.Player.prototype.exitFullWindow = function(){
    this.isFullWindow = false;
    advjs.off(document, 'keydown', this.fullWindowOnEscKey);

    // Unhide scroll bars.
    document.documentElement.style.overflow = this.docOrigOverflow;

    // Remove fullscreen styles
    advjs.removeClass(document.body, 'advjs-full-window');

    // Resize the box, controller, and poster to original sizes
    // this.positionAll();
    this.trigger('exitFullWindow');
};

advjs.Player.prototype.selectSource = function(sources){
    // Loop through each playback technology in the options order
    for (var i=0,j=this.options_['techOrder'];i<j.length;i++) {
        var techName = advjs.capitalize(j[i]),
            tech = window['advjs'][techName];

        // Check if the current tech is defined before continuing
        if (!tech) {
            advjs.log.error('The "' + techName + '" tech is undefined. Skipped browser support check for that tech.');
            continue;
        }

        // Check if the browser supports this technology
        if (tech.isSupported()) {
            // Loop through each source object
            for (var a=0,b=sources;a<b.length;a++) {
                var source = b[a];

                // Check if source can be played with this technology
                if (tech['canPlaySource'](source)) {
                    return { source: source, tech: techName };
                }
            }
        }
    }

    return false;
};

/**
 * The source function updates the video source
 *
 * There are three types of variables you can pass as the argument.
 *
 * **URL String**: A URL to the the video file. Use this method if you are sure
 * the current playback technology (HTML5/Flash) can support the source you
 * provide. Currently only MP4 files can be used in both HTML5 and Flash.
 *
 *     myPlayer.src("http://www.example.com/path/to/video.mp4");
 *
 * **Source Object (or element):** A javascript object containing information
 * about the source file. Use this method if you want the player to determine if
 * it can support the file using the type information.
 *
 *     myPlayer.src({ type: "video/mp4", src: "http://www.example.com/path/to/video.mp4" });
 *
 * **Array of Source Objects:** To provide multiple versions of the source so
 * that it can be played using HTML5 across browsers you can use an array of
 * source objects. Video.js will detect which version is supported and load that
 * file.
 *
 *     myPlayer.src([
 *       { type: "video/mp4", src: "http://www.example.com/path/to/video.mp4" },
 *       { type: "video/webm", src: "http://www.example.com/path/to/video.webm" },
 *       { type: "video/ogg", src: "http://www.example.com/path/to/video.ogv" }
 *     ]);
 *
 * @param  {String|Object|Array=} source The source URL, object, or array of sources
 * @return {String} The current video source when getting
 * @return {String} The player when setting
 */
advjs.Player.prototype.src = function(source){
    if (source === undefined) {
        return this.techGet('src');
    }

    // case: Array of source objects to choose from and pick the best to play
    if (advjs.obj.isArray(source)) {
        this.sourceList_(source);

        // case: URL String (http://myvideo...)
    } else if (typeof source === 'string') {
        // create a source object from the string
        this.src({ src: source });

        // case: Source object { src: '', type: '' ... }
    } else if (source instanceof Object) {
        // check if the source has a type and the loaded tech cannot play the source
        // if there's no type we'll just try the current tech
        if (source.type && !window['advjs'][this.techName]['canPlaySource'](source)) {
            // create a source list with the current source and send through
            // the tech loop to check for a compatible technology
            this.sourceList_([source]);
        } else {
            this.cache_.src = source.src;
            this.currentType_ = source.type || '';

            // wait until the tech is ready to set the source
            this.ready(function(){

                // The setSource tech method was added with source handlers
                // so older techs won't support it
                // We need to check the direct prototype for the case where subclasses
                // of the tech do not support source handlers
                if (window['advjs'][this.techName].prototype.hasOwnProperty('setSource')) {
                    this.techCall('setSource', source);
                } else {
                    this.techCall('src', source.src);
                }

                if (this.options_['preload'] == 'auto') {
                    this.load();
                }

                if (this.options_['autoplay']) {
                    this.play();
                }
            });
        }
    }

    return this;
};

/**
 * Handle an array of source objects
 * @param  {[type]} sources Array of source objects
 * @private
 */
advjs.Player.prototype.sourceList_ = function(sources){
    var sourceTech = this.selectSource(sources);

    if (sourceTech) {
        if (sourceTech.tech === this.techName) {
            // if this technology is already loaded, set the source
            this.src(sourceTech.source);
        } else {
            // load this technology with the chosen source
            this.loadTech(sourceTech.tech, sourceTech.source);
        }
    } else {
        // We need to wrap this in a timeout to give folks a chance to add error event handlers
        this.setTimeout( function() {
            this.error({ code: 4, message: this.localize(this.options()['notSupportedMessage']) });
        }, 0);

        // we could not find an appropriate tech, but let's still notify the delegate that this is it
        // this needs a better comment about why this is needed
        this.triggerReady();
    }
};

/**
 * Begin loading the src data.
 * @return {advjs.Player} Returns the player
 */
advjs.Player.prototype.load = function(){
    this.techCall('load');
    return this;
};

/**
 * Returns the fully qualified URL of the current source value e.g. http://mysite.com/video.mp4
 * Can be used in conjuction with `currentType` to assist in rebuilding the current source object.
 * @return {String} The current source
 */
advjs.Player.prototype.currentSrc = function(){
    return this.techGet('currentSrc') || this.cache_.src || '';
};

/**
 * Get the current source type e.g. video/mp4
 * This can allow you rebuild the current source object so that you could load the same
 * source and tech later
 * @return {String} The source MIME type
 */
advjs.Player.prototype.currentType = function(){
    return this.currentType_ || '';
};

/**
 * Get or set the preload attribute.
 * @return {String} The preload attribute value when getting
 * @return {advjs.Player} Returns the player when setting
 */
advjs.Player.prototype.preload = function(value){
    if (value !== undefined) {
        this.techCall('setPreload', value);
        this.options_['preload'] = value;
        return this;
    }
    return this.techGet('preload');
};

/**
 * Get or set the autoplay attribute.
 * @return {String} The autoplay attribute value when getting
 * @return {advjs.Player} Returns the player when setting
 */
advjs.Player.prototype.autoplay = function(value){
    if (value !== undefined) {
        this.techCall('setAutoplay', value);
        this.options_['autoplay'] = value;
        return this;
    }
    return this.techGet('autoplay', value);
};

/**
 * Get or set the loop attribute on the video element.
 * @return {String} The loop attribute value when getting
 * @return {advjs.Player} Returns the player when setting
 */
advjs.Player.prototype.loop = function(value){
    if (value !== undefined) {
        this.techCall('setLoop', value);
        this.options_['loop'] = value;
        return this;
    }
    return this.techGet('loop');
};

/**
 * the url of the poster image source
 * @type {String}
 * @private
 */
advjs.Player.prototype.poster_;

/**
 * get or set the poster image source url
 *
 * ##### EXAMPLE:
 *
 *     // getting
 *     var currentPoster = myPlayer.poster();
 *
 *     // setting
 *     myPlayer.poster('http://example.com/myImage.jpg');
 *
 * @param  {String=} [src] Poster image source URL
 * @return {String} poster URL when getting
 * @return {advjs.Player} self when setting
 */
advjs.Player.prototype.poster = function(src){
    if (src === undefined) {
        return this.poster_;
    }

    // The correct way to remove a poster is to set as an empty string
    // other falsey values will throw errors
    if (!src) {
        src = '';
    }

    // update the internal poster variable
    this.poster_ = src;

    // update the tech's poster
    this.techCall('setPoster', src);

    // alert components that the poster has been set
    this.trigger('posterchange');

    return this;
};

/**
 * Whether or not the controls are showing
 * @type {Boolean}
 * @private
 */
advjs.Player.prototype.controls_;

/**
 * Get or set whether or not the controls are showing.
 * @param  {Boolean} controls Set controls to showing or not
 * @return {Boolean}    Controls are showing
 */
advjs.Player.prototype.controls = function(bool){
    if (bool !== undefined) {
        bool = !!bool; // force boolean
        // Don't trigger a change event unless it actually changed
        if (this.controls_ !== bool) {
            this.controls_ = bool;
            if (bool) {
                this.removeClass('advjs-controls-disabled');
                this.addClass('advjs-controls-enabled');
                this.trigger('controlsenabled');
            } else {
                this.removeClass('advjs-controls-enabled');
                this.addClass('advjs-controls-disabled');
                this.trigger('controlsdisabled');
            }
        }
        return this;
    }
    return this.controls_;
};

advjs.Player.prototype.usingNativeControls_;

/**
 * Toggle native controls on/off. Native controls are the controls built into
 * devices (e.g. default iPhone controls), Flash, or other techs
 * (e.g. Vimeo Controls)
 *
 * **This should only be set by the current tech, because only the tech knows
 * if it can support native controls**
 *
 * @param  {Boolean} bool    True signals that native controls are on
 * @return {advjs.Player}      Returns the player
 * @private
 */
advjs.Player.prototype.usingNativeControls = function(bool){
    if (bool !== undefined) {
        bool = !!bool; // force boolean
        // Don't trigger a change event unless it actually changed
        if (this.usingNativeControls_ !== bool) {
            this.usingNativeControls_ = bool;
            if (bool) {
                this.addClass('advjs-using-native-controls');

                /**
                 * player is using the native device controls
                 *
                 * @event usingnativecontrols
                 * @memberof advjs.Player
                 * @instance
                 * @private
                 */
                this.trigger('usingnativecontrols');
            } else {
                this.removeClass('advjs-using-native-controls');

                /**
                 * player is using the custom HTML controls
                 *
                 * @event usingcustomcontrols
                 * @memberof advjs.Player
                 * @instance
                 * @private
                 */
                this.trigger('usingcustomcontrols');
            }
        }
        return this;
    }
    return this.usingNativeControls_;
};

/**
 * Store the current media error
 * @type {Object}
 * @private
 */
advjs.Player.prototype.error_ = null;

/**
 * Set or get the current MediaError
 * @param  {*} err A MediaError or a String/Number to be turned into a MediaError
 * @return {advjs.MediaError|null}     when getting
 * @return {advjs.Player}              when setting
 */
advjs.Player.prototype.error = function(err){
    if (err === undefined) {
        return this.error_;
    }

    // restoring to default
    if (err === null) {
        this.error_ = err;
        this.removeClass('advjs-error');
        return this;
    }

    // error instance
    if (err instanceof advjs.MediaError) {
        this.error_ = err;
    } else {
        this.error_ = new advjs.MediaError(err);
    }

    // fire an error event on the player
    this.trigger('error');

    // add the advjs-error classname to the player
    this.addClass('advjs-error');

    // log the name of the error type and any message
    // ie8 just logs "[object object]" if you just log the error object
    advjs.log.error('(CODE:'+this.error_.code+' '+advjs.MediaError.errorTypes[this.error_.code]+')', this.error_.message, this.error_);

    return this;
};

/**
 * Returns whether or not the player is in the "ended" state.
 * @return {Boolean} True if the player is in the ended state, false if not.
 */
advjs.Player.prototype.ended = function(){ return this.techGet('ended'); };

/**
 * Returns whether or not the player is in the "seeking" state.
 * @return {Boolean} True if the player is in the seeking state, false if not.
 */
advjs.Player.prototype.seeking = function(){ return this.techGet('seeking'); };

/**
 * Returns the TimeRanges of the media that are currently available
 * for seeking to.
 * @return {TimeRanges} the seekable intervals of the media timeline
 */
advjs.Player.prototype.seekable = function(){ return this.techGet('seekable'); };

// When the player is first initialized, trigger activity so components
// like the control bar show themselves if needed
advjs.Player.prototype.userActivity_ = true;
advjs.Player.prototype.reportUserActivity = function(event){
    this.userActivity_ = true;
};

advjs.Player.prototype.userActive_ = true;
advjs.Player.prototype.userActive = function(bool){
    if (bool !== undefined) {
        bool = !!bool;
        if (bool !== this.userActive_) {
            this.userActive_ = bool;
            if (bool) {
                // If the user was inactive and is now active we want to reset the
                // inactivity timer
                this.userActivity_ = true;
                this.removeClass('advjs-user-inactive');
                this.addClass('advjs-user-active');
                this.trigger('useractive');
            } else {
                // We're switching the state to inactive manually, so erase any other
                // activity
                this.userActivity_ = false;

                // Chrome/Safari/IE have bugs where when you change the cursor it can
                // trigger a mousemove event. This causes an issue when you're hiding
                // the cursor when the user is inactive, and a mousemove signals user
                // activity. Making it impossible to go into inactive mode. Specifically
                // this happens in fullscreen when we really need to hide the cursor.
                //
                // When this gets resolved in ALL browsers it can be removed
                // https://code.google.com/p/chromium/issues/detail?id=103041
                if(this.tech) {
                    this.tech.one('mousemove', function(e){
                        e.stopPropagation();
                        e.preventDefault();
                    });
                }

                this.removeClass('advjs-user-active');
                this.addClass('advjs-user-inactive');
                this.trigger('userinactive');
            }
        }
        return this;
    }
    return this.userActive_;
};

advjs.Player.prototype.listenForUserActivity = function(){
    var onActivity, onMouseMove, onMouseDown, mouseInProgress, onMouseUp,
        activityCheck, inactivityTimeout, lastMoveX, lastMoveY;

    onActivity = advjs.bind(this, this.reportUserActivity);

    onMouseMove = function(e) {
        // #1068 - Prevent mousemove spamming
        // Chrome Bug: https://code.google.com/p/chromium/issues/detail?id=366970
        if(e.screenX != lastMoveX || e.screenY != lastMoveY) {
            lastMoveX = e.screenX;
            lastMoveY = e.screenY;
            onActivity();
        }
    };

    onMouseDown = function() {
        onActivity();
        // For as long as the they are touching the device or have their mouse down,
        // we consider them active even if they're not moving their finger or mouse.
        // So we want to continue to update that they are active
        this.clearInterval(mouseInProgress);
        // Setting userActivity=true now and setting the interval to the same time
        // as the activityCheck interval (250) should ensure we never miss the
        // next activityCheck
        mouseInProgress = this.setInterval(onActivity, 250);
    };

    onMouseUp = function(event) {
        onActivity();
        // Stop the interval that maintains activity if the mouse/touch is down
        this.clearInterval(mouseInProgress);
    };

    // Any mouse movement will be considered user activity
    this.on('mousedown', onMouseDown);
    this.on('mousemove', onMouseMove);
    this.on('mouseup', onMouseUp);

    // Listen for keyboard navigation
    // Shouldn't need to use inProgress interval because of key repeat
    this.on('keydown', onActivity);
    this.on('keyup', onActivity);

    // Run an interval every 250 milliseconds instead of stuffing everything into
    // the mousemove/touchmove function itself, to prevent performance degradation.
    // `this.reportUserActivity` simply sets this.userActivity_ to true, which
    // then gets picked up by this loop
    // http://ejohn.org/blog/learning-from-twitter/
    activityCheck = this.setInterval(function() {
        // Check to see if mouse/touch activity has happened
        if (this.userActivity_) {
            // Reset the activity tracker
            this.userActivity_ = false;

            // If the user state was inactive, set the state to active
            this.userActive(true);

            // Clear any existing inactivity timeout to start the timer over
            this.clearTimeout(inactivityTimeout);

            var timeout = this.options()['inactivityTimeout'];
            if (timeout > 0) {
                // In <timeout> milliseconds, if no more activity has occurred the
                // user will be considered inactive
                inactivityTimeout = this.setTimeout(function () {
                    // Protect against the case where the inactivityTimeout can trigger just
                    // before the next user activity is picked up by the activityCheck loop
                    // causing a flicker
                    if (!this.userActivity_) {
                        this.userActive(false);
                    }
                }, timeout);
            }
        }
    }, 250);
};

/**
 * Gets or sets the current playback rate.
 * @param  {Boolean} rate   New playback rate to set.
 * @return {Number}         Returns the new playback rate when setting
 * @return {Number}         Returns the current playback rate when getting
 */
advjs.Player.prototype.playbackRate = function(rate) {
    if (rate !== undefined) {
        this.techCall('setPlaybackRate', rate);
        return this;
    }

    if (this.tech && this.tech['featuresPlaybackRate']) {
        return this.techGet('playbackRate');
    } else {
        return 1.0;
    }

};

/**
 * Store the current audio state
 * @type {Boolean}
 * @private
 */
advjs.Player.prototype.isAudio_ = false;

/**
 * Gets or sets the audio flag
 *
 * @param  {Boolean} bool    True signals that this is an audio player.
 * @return {Boolean}         Returns true if player is audio, false if not when getting
 * @return {advjs.Player}      Returns the player if setting
 * @private
 */
advjs.Player.prototype.isAudio = function(bool) {
    if (bool !== undefined) {
        this.isAudio_ = !!bool;
        return this;
    }

    return this.isAudio_;
};

/**
 * Returns the current state of network activity for the element, from
 * the codes in the list below.
 * - NETWORK_EMPTY (numeric value 0)
 *   The element has not yet been initialised. All attributes are in
 *   their initial states.
 * - NETWORK_IDLE (numeric value 1)
 *   The element's resource selection algorithm is active and has
 *   selected a resource, but it is not actually using the network at
 *   this time.
 * - NETWORK_LOADING (numeric value 2)
 *   The user agent is actively trying to download data.
 * - NETWORK_NO_SOURCE (numeric value 3)
 *   The element's resource selection algorithm is active, but it has
 *   not yet found a resource to use.
 * @return {Number} the current network activity state
 * @see https://html.spec.whatwg.org/multipage/embedded-content.html#network-states
 */
advjs.Player.prototype.networkState = function(){
    return this.techGet('networkState');
};

/**
 * Returns a value that expresses the current state of the element
 * with respect to rendering the current playback position, from the
 * codes in the list below.
 * - HAVE_NOTHING (numeric value 0)
 *   No information regarding the media resource is available.
 * - HAVE_METADATA (numeric value 1)
 *   Enough of the resource has been obtained that the duration of the
 *   resource is available.
 * - HAVE_CURRENT_DATA (numeric value 2)
 *   Data for the immediate current playback position is available.
 * - HAVE_FUTURE_DATA (numeric value 3)
 *   Data for the immediate current playback position is available, as
 *   well as enough data for the user agent to advance the current
 *   playback position in the direction of playback.
 * - HAVE_ENOUGH_DATA (numeric value 4)
 *   The user agent estimates that enough data is available for
 *   playback to proceed uninterrupted.
 * @return {Number} the current playback rendering state
 * @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-readystate
 */
advjs.Player.prototype.readyState = function(){
    return this.techGet('readyState');
};

/**
 * Text tracks are tracks of timed text events.
 * Captions - text displayed over the video for the hearing impaired
 * Subtitles - text displayed over the video for those who don't understand language in the video
 * Chapters - text displayed in a menu allowing the user to jump to particular points (chapters) in the video
 * Descriptions (not supported yet) - audio descriptions that are read back to the user by a screen reading device
 */

/**
 * Get an array of associated text tracks. captions, subtitles, chapters, descriptions
 * http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-texttracks
 * @return {Array}           Array of track objects
 */
advjs.Player.prototype.textTracks = function(){
    // cannot use techGet directly because it checks to see whether the tech is ready.
    // Flash is unlikely to be ready in time but textTracks should still work.
    return this.tech && this.tech['textTracks']();
};

advjs.Player.prototype.remoteTextTracks = function() {
    return this.tech && this.tech['remoteTextTracks']();
};

/**
 * Add a text track
 * In addition to the W3C settings we allow adding additional info through options.
 * http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-addtexttrack
 * @param {String}  kind        Captions, subtitles, chapters, descriptions, or metadata
 * @param {String=} label       Optional label
 * @param {String=} language    Optional language
 */
advjs.Player.prototype.addTextTrack = function(kind, label, language) {
    return this.tech && this.tech['addTextTrack'](kind, label, language);
};

advjs.Player.prototype.addRemoteTextTrack = function(options) {
    return this.tech && this.tech['addRemoteTextTrack'](options);
};

advjs.Player.prototype.removeRemoteTextTrack = function(track) {
    this.tech && this.tech['removeRemoteTextTrack'](track);
};

// Methods to add support for
// initialTime: function(){ return this.techCall('initialTime'); },
// startOffsetTime: function(){ return this.techCall('startOffsetTime'); },
// played: function(){ return this.techCall('played'); },
// seekable: function(){ return this.techCall('seekable'); },
// videoTracks: function(){ return this.techCall('videoTracks'); },
// audioTracks: function(){ return this.techCall('audioTracks'); },
// videoWidth: function(){ return this.techCall('videoWidth'); },
// videoHeight: function(){ return this.techCall('videoHeight'); },
// defaultPlaybackRate: function(){ return this.techCall('defaultPlaybackRate'); },
// mediaGroup: function(){ return this.techCall('mediaGroup'); },
// controller: function(){ return this.techCall('controller'); },
// defaultMuted: function(){ return this.techCall('defaultMuted'); }

// TODO
// currentSrcList: the array of sources including other formats and bitrates
// playList: array of source lists in order of playback
/**
 * Container of main controls
 * @param {advjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 * @extends advjs.Component
 */
advjs.ControlBar = advjs.Component.extend();

advjs.ControlBar.prototype.options_ = {
    loadEvent: 'play',
    children: {
        'playToggle': {},
        'currentTimeDisplay': {},
        'timeDivider': {},
        'durationDisplay': {},
        'remainingTimeDisplay': {},
        'liveDisplay': {},
        'progressControl': {},
        'fullscreenToggle': {},
        'volumeControl': {},
        'muteToggle': {},
        // 'volumeMenuButton': {},
        'playbackRateMenuButton': {},
        'subtitlesButton': {},
        'captionsButton': {},
        'chaptersButton': {}
    }
};

advjs.ControlBar.prototype.createEl = function(){
    return advjs.createEl('div', {
        className: 'advjs-control-bar'
    });
};
/**
 * Displays the live indicator
 * TODO - Future make it click to snap to live
 * @param {advjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
advjs.LiveDisplay = advjs.Component.extend({
    init: function(player, options){
        advjs.Component.call(this, player, options);
    }
});

advjs.LiveDisplay.prototype.createEl = function(){
    var el = advjs.Component.prototype.createEl.call(this, 'div', {
        className: 'advjs-live-controls advjs-control'
    });

    this.contentEl_ = advjs.createEl('div', {
        className: 'advjs-live-display',
        innerHTML: '<span class="advjs-control-text">' + this.localize('Stream Type') + '</span>' + this.localize('LIVE'),
        'aria-live': 'off'
    });

    el.appendChild(this.contentEl_);

    return el;
};
/**
 * Button to toggle between play and pause
 * @param {advjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
advjs.PlayToggle = advjs.Button.extend({
    /** @constructor */
    init: function(player, options){
        advjs.Button.call(this, player, options);

        this.on(player, 'play', this.onPlay);
        this.on(player, 'pause', this.onPause);
    }
});

advjs.PlayToggle.prototype.buttonText = 'Play';

advjs.PlayToggle.prototype.buildCSSClass = function(){
    return 'advjs-play-control ' + advjs.Button.prototype.buildCSSClass.call(this);
};

// OnClick - Toggle between play and pause
advjs.PlayToggle.prototype.onClick = function(){
    if (this.player_.paused()) {
        this.player_.play();
    } else {
        this.player_.pause();
    }
};

// OnPlay - Add the advjs-playing class to the element so it can change appearance
advjs.PlayToggle.prototype.onPlay = function(){
    this.removeClass('advjs-paused');
    this.addClass('advjs-playing');
    this.el_.children[0].children[0].innerHTML = this.localize('Pause'); // change the button text to "Pause"
};

// OnPause - Add the advjs-paused class to the element so it can change appearance
advjs.PlayToggle.prototype.onPause = function(){
    this.removeClass('advjs-playing');
    this.addClass('advjs-paused');
    this.el_.children[0].children[0].innerHTML = this.localize('Play'); // change the button text to "Play"
};
/**
 * Displays the current time
 * @param {advjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
advjs.CurrentTimeDisplay = advjs.Component.extend({
    /** @constructor */
    init: function(player, options){
        advjs.Component.call(this, player, options);

        this.on(player, 'timeupdate', this.updateContent);
    }
});

advjs.CurrentTimeDisplay.prototype.createEl = function(){
    var el = advjs.Component.prototype.createEl.call(this, 'div', {
        className: 'advjs-current-time advjs-time-controls advjs-control'
    });

    this.contentEl_ = advjs.createEl('div', {
        className: 'advjs-current-time-display',
        innerHTML: '<span class="advjs-control-text">Current Time </span>' + '0:00', // label the current time for screen reader users
        'aria-live': 'off' // tell screen readers not to automatically read the time as it changes
    });

    el.appendChild(this.contentEl_);
    return el;
};

advjs.CurrentTimeDisplay.prototype.updateContent = function(){
    // Allows for smooth scrubbing, when player can't keep up.
    var time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
    this.contentEl_.innerHTML = '<span class="advjs-control-text">' + this.localize('Current Time') + '</span> ' + advjs.formatTime(time, this.player_.duration());
};

/**
 * Displays the duration
 * @param {advjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
advjs.DurationDisplay = advjs.Component.extend({
    /** @constructor */
    init: function(player, options){
        advjs.Component.call(this, player, options);

        // this might need to be changed to 'durationchange' instead of 'timeupdate' eventually,
        // however the durationchange event fires before this.player_.duration() is set,
        // so the value cannot be written out using this method.
        // Once the order of durationchange and this.player_.duration() being set is figured out,
        // this can be updated.
        this.on(player, 'timeupdate', this.updateContent);
        this.on(player, 'loadedmetadata', this.updateContent);
    }
});

advjs.DurationDisplay.prototype.createEl = function(){
    var el = advjs.Component.prototype.createEl.call(this, 'div', {
        className: 'advjs-duration advjs-time-controls advjs-control'
    });

    this.contentEl_ = advjs.createEl('div', {
        className: 'advjs-duration-display',
        innerHTML: '<span class="advjs-control-text">' + this.localize('Duration Time') + '</span> ' + '0:00', // label the duration time for screen reader users
        'aria-live': 'off' // tell screen readers not to automatically read the time as it changes
    });

    el.appendChild(this.contentEl_);
    return el;
};

advjs.DurationDisplay.prototype.updateContent = function(){
    var duration = this.player_.duration();
    if (duration) {
        this.contentEl_.innerHTML = '<span class="advjs-control-text">' + this.localize('Duration Time') + '</span> ' + advjs.formatTime(duration); // label the duration time for screen reader users
    }
};

/**
 * The separator between the current time and duration
 *
 * Can be hidden if it's not needed in the design.
 *
 * @param {advjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
advjs.TimeDivider = advjs.Component.extend({
    /** @constructor */
    init: function(player, options){
        advjs.Component.call(this, player, options);
    }
});

advjs.TimeDivider.prototype.createEl = function(){
    return advjs.Component.prototype.createEl.call(this, 'div', {
        className: 'advjs-time-divider',
        innerHTML: '<div><span>/</span></div>'
    });
};

/**
 * Displays the time left in the video
 * @param {advjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
advjs.RemainingTimeDisplay = advjs.Component.extend({
    /** @constructor */
    init: function(player, options){
        advjs.Component.call(this, player, options);

        this.on(player, 'timeupdate', this.updateContent);
    }
});

advjs.RemainingTimeDisplay.prototype.createEl = function(){
    var el = advjs.Component.prototype.createEl.call(this, 'div', {
        className: 'advjs-remaining-time advjs-time-controls advjs-control'
    });

    this.contentEl_ = advjs.createEl('div', {
        className: 'advjs-remaining-time-display',
        innerHTML: '<span class="advjs-control-text">' + this.localize('Remaining Time') + '</span> ' + '-0:00', // label the remaining time for screen reader users
        'aria-live': 'off' // tell screen readers not to automatically read the time as it changes
    });

    el.appendChild(this.contentEl_);
    return el;
};

advjs.RemainingTimeDisplay.prototype.updateContent = function(){
    if (this.player_.duration()) {
        this.contentEl_.innerHTML = '<span class="advjs-control-text">' + this.localize('Remaining Time') + '</span> ' + '-'+ advjs.formatTime(this.player_.remainingTime());
    }

    // Allows for smooth scrubbing, when player can't keep up.
    // var time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
    // this.contentEl_.innerHTML = advjs.formatTime(time, this.player_.duration());
};
/**
 * Toggle fullscreen video
 * @param {advjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @extends advjs.Button
 */
advjs.FullscreenToggle = advjs.Button.extend({
    /**
     * @constructor
     * @memberof advjs.FullscreenToggle
     * @instance
     */
    init: function(player, options){
        advjs.Button.call(this, player, options);
    }
});

advjs.FullscreenToggle.prototype.buttonText = 'Fullscreen';

advjs.FullscreenToggle.prototype.buildCSSClass = function(){
    return 'advjs-fullscreen-control ' + advjs.Button.prototype.buildCSSClass.call(this);
};

advjs.FullscreenToggle.prototype.onClick = function(){
    if (!this.player_.isFullscreen()) {
        this.player_.requestFullscreen();
        this.controlText_.innerHTML = this.localize('Non-Fullscreen');
    } else {
        this.player_.exitFullscreen();
        this.controlText_.innerHTML = this.localize('Fullscreen');
    }
};
/**
 * The Progress Control component contains the seek bar, load progress,
 * and play progress
 *
 * @param {advjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
advjs.ProgressControl = advjs.Component.extend({
    /** @constructor */
    init: function(player, options){
        advjs.Component.call(this, player, options);
    }
});

advjs.ProgressControl.prototype.options_ = {
    children: {
        'seekBar': {}
    }
};

advjs.ProgressControl.prototype.createEl = function(){
    return advjs.Component.prototype.createEl.call(this, 'div', {
        className: 'advjs-progress-control advjs-control'
    });
};

/**
 * Seek Bar and holder for the progress bars
 *
 * @param {advjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
advjs.SeekBar = advjs.Slider.extend({
    /** @constructor */
    init: function(player, options){
        advjs.Slider.call(this, player, options);
        this.on(player, 'timeupdate', this.updateARIAAttributes);
        player.ready(advjs.bind(this, this.updateARIAAttributes));
    }
});

advjs.SeekBar.prototype.options_ = {
    children: {
        'loadProgressBar': {},
        'playProgressBar': {},
        'seekHandle': {}
    },
    'barName': 'playProgressBar',
    'handleName': 'seekHandle'
};

advjs.SeekBar.prototype.playerEvent = 'timeupdate';

advjs.SeekBar.prototype.createEl = function(){
    return advjs.Slider.prototype.createEl.call(this, 'div', {
        className: 'advjs-progress-holder',
        'aria-label': 'video progress bar'
    });
};

advjs.SeekBar.prototype.updateARIAAttributes = function(){
    // Allows for smooth scrubbing, when player can't keep up.
    var time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
    this.el_.setAttribute('aria-valuenow',advjs.round(this.getPercent()*100, 2)); // machine readable value of progress bar (percentage complete)
    this.el_.setAttribute('aria-valuetext',advjs.formatTime(time, this.player_.duration())); // human readable value of progress bar (time complete)
};

advjs.SeekBar.prototype.getPercent = function(){
    return this.player_.currentTime() / this.player_.duration();
};

advjs.SeekBar.prototype.onMouseDown = function(event){
    advjs.Slider.prototype.onMouseDown.call(this, event);

    this.player_.scrubbing = true;
    this.player_.addClass('advjs-scrubbing');

    this.videoWasPlaying = !this.player_.paused();
    this.player_.pause();
};

advjs.SeekBar.prototype.onMouseMove = function(event){
    var newTime = this.calculateDistance(event) * this.player_.duration();

    // Don't let video end while scrubbing.
    if (newTime == this.player_.duration()) { newTime = newTime - 0.1; }

    // Set new time (tell player to seek to new time)
    this.player_.currentTime(newTime);
};

advjs.SeekBar.prototype.onMouseUp = function(event){
    advjs.Slider.prototype.onMouseUp.call(this, event);

    this.player_.scrubbing = false;
    this.player_.removeClass('advjs-scrubbing');
    if (this.videoWasPlaying) {
        this.player_.play();
    }
};

advjs.SeekBar.prototype.stepForward = function(){
    this.player_.currentTime(this.player_.currentTime() + 5); // more quickly fast forward for keyboard-only users
};

advjs.SeekBar.prototype.stepBack = function(){
    this.player_.currentTime(this.player_.currentTime() - 5); // more quickly rewind for keyboard-only users
};

/**
 * Shows load progress
 *
 * @param {advjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
advjs.LoadProgressBar = advjs.Component.extend({
    /** @constructor */
    init: function(player, options){
        advjs.Component.call(this, player, options);
        this.on(player, 'progress', this.update);
    }
});

advjs.LoadProgressBar.prototype.createEl = function(){
    return advjs.Component.prototype.createEl.call(this, 'div', {
        className: 'advjs-load-progress',
        innerHTML: '<span class="advjs-control-text"><span>' + this.localize('Loaded') + '</span>: 0%</span>'
    });
};

advjs.LoadProgressBar.prototype.update = function(){
    var i, start, end, part,
        buffered = this.player_.buffered(),
        duration = this.player_.duration(),
        bufferedEnd = this.player_.bufferedEnd(),
        children = this.el_.children,
    // get the percent width of a time compared to the total end
        percentify = function (time, end){
            var percent = (time / end) || 0; // no NaN
            return (percent * 100) + '%';
        };

    // update the width of the progress bar
    this.el_.style.width = percentify(bufferedEnd, duration);

    // add child elements to represent the individual buffered time ranges
    for (i = 0; i < buffered.length; i++) {
        start = buffered.start(i),
            end = buffered.end(i),
            part = children[i];

        if (!part) {
            part = this.el_.appendChild(advjs.createEl());
        }

        // set the percent based on the width of the progress bar (bufferedEnd)
        part.style.left = percentify(start, bufferedEnd);
        part.style.width = percentify(end - start, bufferedEnd);
    }

    // remove unused buffered range elements
    for (i = children.length; i > buffered.length; i--) {
        this.el_.removeChild(children[i-1]);
    }
};

/**
 * Shows play progress
 *
 * @param {advjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
advjs.PlayProgressBar = advjs.Component.extend({
    /** @constructor */
    init: function(player, options){
        advjs.Component.call(this, player, options);
    }
});

advjs.PlayProgressBar.prototype.createEl = function(){
    return advjs.Component.prototype.createEl.call(this, 'div', {
        className: 'advjs-play-progress',
        innerHTML: '<span class="advjs-control-text"><span>' + this.localize('Progress') + '</span>: 0%</span>'
    });
};

/**
 * The Seek Handle shows the current position of the playhead during playback,
 * and can be dragged to adjust the playhead.
 *
 * @param {advjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
advjs.SeekHandle = advjs.SliderHandle.extend({
    init: function(player, options) {
        advjs.SliderHandle.call(this, player, options);
        this.on(player, 'timeupdate', this.updateContent);
    }
});

/**
 * The default value for the handle content, which may be read by screen readers
 *
 * @type {String}
 * @private
 */
advjs.SeekHandle.prototype.defaultValue = '00:00';

/** @inheritDoc */
advjs.SeekHandle.prototype.createEl = function() {
    return advjs.SliderHandle.prototype.createEl.call(this, 'div', {
        className: 'advjs-seek-handle',
        'aria-live': 'off'
    });
};

advjs.SeekHandle.prototype.updateContent = function() {
    var time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
    this.el_.innerHTML = '<span class="advjs-control-text">' + advjs.formatTime(time, this.player_.duration()) + '</span>';
};
/**
 * The component for controlling the volume level
 *
 * @param {advjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
advjs.VolumeControl = advjs.Component.extend({
    /** @constructor */
    init: function(player, options){
        advjs.Component.call(this, player, options);

        // hide volume controls when they're not supported by the current tech
        if (player.tech && player.tech['featuresVolumeControl'] === false) {
            this.addClass('advjs-hidden');
        }
        this.on(player, 'loadstart', function(){
            if (player.tech['featuresVolumeControl'] === false) {
                this.addClass('advjs-hidden');
            } else {
                this.removeClass('advjs-hidden');
            }
        });
    }
});

advjs.VolumeControl.prototype.options_ = {
    children: {
        'volumeBar': {}
    }
};

advjs.VolumeControl.prototype.createEl = function(){
    return advjs.Component.prototype.createEl.call(this, 'div', {
        className: 'advjs-volume-control advjs-control'
    });
};

/**
 * The bar that contains the volume level and can be clicked on to adjust the level
 *
 * @param {advjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
advjs.VolumeBar = advjs.Slider.extend({
    /** @constructor */
    init: function(player, options){
        advjs.Slider.call(this, player, options);
        this.on(player, 'volumechange', this.updateARIAAttributes);
        player.ready(advjs.bind(this, this.updateARIAAttributes));
    }
});

advjs.VolumeBar.prototype.updateARIAAttributes = function(){
    // Current value of volume bar as a percentage
    this.el_.setAttribute('aria-valuenow',advjs.round(this.player_.volume()*100, 2));
    this.el_.setAttribute('aria-valuetext',advjs.round(this.player_.volume()*100, 2)+'%');
};

advjs.VolumeBar.prototype.options_ = {
    children: {
        'volumeLevel': {},
        'volumeHandle': {}
    },
    'barName': 'volumeLevel',
    'handleName': 'volumeHandle'
};

advjs.VolumeBar.prototype.playerEvent = 'volumechange';

advjs.VolumeBar.prototype.createEl = function(){
    return advjs.Slider.prototype.createEl.call(this, 'div', {
        className: 'advjs-volume-bar',
        'aria-label': 'volume level'
    });
};

advjs.VolumeBar.prototype.onMouseMove = function(event) {
    if (this.player_.muted()) {
        this.player_.muted(false);
    }

    this.player_.volume(this.calculateDistance(event));
};

advjs.VolumeBar.prototype.getPercent = function(){
    if (this.player_.muted()) {
        return 0;
    } else {
        return this.player_.volume();
    }
};

advjs.VolumeBar.prototype.stepForward = function(){
    this.player_.volume(this.player_.volume() + 0.1);
};

advjs.VolumeBar.prototype.stepBack = function(){
    this.player_.volume(this.player_.volume() - 0.1);
};

/**
 * Shows volume level
 *
 * @param {advjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
advjs.VolumeLevel = advjs.Component.extend({
    /** @constructor */
    init: function(player, options){
        advjs.Component.call(this, player, options);
    }
});

advjs.VolumeLevel.prototype.createEl = function(){
    return advjs.Component.prototype.createEl.call(this, 'div', {
        className: 'advjs-volume-level',
        innerHTML: '<span class="advjs-control-text"></span>'
    });
};

/**
 * The volume handle can be dragged to adjust the volume level
 *
 * @param {advjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
advjs.VolumeHandle = advjs.SliderHandle.extend();

advjs.VolumeHandle.prototype.defaultValue = '00:00';

/** @inheritDoc */
advjs.VolumeHandle.prototype.createEl = function(){
    return advjs.SliderHandle.prototype.createEl.call(this, 'div', {
        className: 'advjs-volume-handle'
    });
};
/**
 * A button component for muting the audio
 *
 * @param {advjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
advjs.MuteToggle = advjs.Button.extend({
    /** @constructor */
    init: function(player, options){
        advjs.Button.call(this, player, options);

        this.on(player, 'volumechange', this.update);

        // hide mute toggle if the current tech doesn't support volume control
        if (player.tech && player.tech['featuresVolumeControl'] === false) {
            this.addClass('advjs-hidden');
        }

        this.on(player, 'loadstart', function(){
            if (player.tech['featuresVolumeControl'] === false) {
                this.addClass('advjs-hidden');
            } else {
                this.removeClass('advjs-hidden');
            }
        });
    }
});

advjs.MuteToggle.prototype.createEl = function(){
    return advjs.Button.prototype.createEl.call(this, 'div', {
        className: 'advjs-mute-control advjs-control',
        innerHTML: '<div><span class="advjs-control-text">' + this.localize('Mute') + '</span></div>'
    });
};

advjs.MuteToggle.prototype.onClick = function(){
    this.player_.muted( this.player_.muted() ? false : true );
};

advjs.MuteToggle.prototype.update = function(){
    var vol = this.player_.volume(),
        level = 3;

    if (vol === 0 || this.player_.muted()) {
        level = 0;
    } else if (vol < 0.33) {
        level = 1;
    } else if (vol < 0.67) {
        level = 2;
    }

    // Don't rewrite the button text if the actual text doesn't change.
    // This causes unnecessary and confusing information for screen reader users.
    // This check is needed because this function gets called every time the volume level is changed.
    if(this.player_.muted()){
        if(this.el_.children[0].children[0].innerHTML!=this.localize('Unmute')){
            this.el_.children[0].children[0].innerHTML = this.localize('Unmute'); // change the button text to "Unmute"
        }
    } else {
        if(this.el_.children[0].children[0].innerHTML!=this.localize('Mute')){
            this.el_.children[0].children[0].innerHTML = this.localize('Mute'); // change the button text to "Mute"
        }
    }

    /* TODO improve muted icon classes */
    for (var i = 0; i < 4; i++) {
        advjs.removeClass(this.el_, 'advjs-vol-'+i);
    }
    advjs.addClass(this.el_, 'advjs-vol-'+level);
};
/**
 * Menu button with a popup for showing the volume slider.
 * @constructor
 */
advjs.VolumeMenuButton = advjs.MenuButton.extend({
    /** @constructor */
    init: function(player, options){
        advjs.MenuButton.call(this, player, options);

        // Same listeners as MuteToggle
        this.on(player, 'volumechange', this.volumeUpdate);

        // hide mute toggle if the current tech doesn't support volume control
        if (player.tech && player.tech['featuresVolumeControl'] === false) {
            this.addClass('advjs-hidden');
        }
        this.on(player, 'loadstart', function(){
            if (player.tech['featuresVolumeControl'] === false) {
                this.addClass('advjs-hidden');
            } else {
                this.removeClass('advjs-hidden');
            }
        });
        this.addClass('advjs-menu-button');
    }
});

advjs.VolumeMenuButton.prototype.createMenu = function(){
    var menu = new advjs.Menu(this.player_, {
        contentElType: 'div'
    });
    var vc = new advjs.VolumeBar(this.player_, this.options_['volumeBar']);
    vc.on('focus', function() {
        menu.lockShowing();
    });
    vc.on('blur', function() {
        menu.unlockShowing();
    });
    menu.addChild(vc);
    return menu;
};

advjs.VolumeMenuButton.prototype.onClick = function(){
    advjs.MuteToggle.prototype.onClick.call(this);
    advjs.MenuButton.prototype.onClick.call(this);
};

advjs.VolumeMenuButton.prototype.createEl = function(){
    return advjs.Button.prototype.createEl.call(this, 'div', {
        className: 'advjs-volume-menu-button advjs-menu-button advjs-control',
        innerHTML: '<div><span class="advjs-control-text">' + this.localize('Mute') + '</span></div>'
    });
};
advjs.VolumeMenuButton.prototype.volumeUpdate = advjs.MuteToggle.prototype.update;
/**
 * The component for controlling the playback rate
 *
 * @param {advjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
advjs.PlaybackRateMenuButton = advjs.MenuButton.extend({
    /** @constructor */
    init: function(player, options){
        advjs.MenuButton.call(this, player, options);

        this.updateVisibility();
        this.updateLabel();

        this.on(player, 'loadstart', this.updateVisibility);
        this.on(player, 'ratechange', this.updateLabel);
    }
});

advjs.PlaybackRateMenuButton.prototype.buttonText = 'Playback Rate';
advjs.PlaybackRateMenuButton.prototype.className = 'advjs-playback-rate';

advjs.PlaybackRateMenuButton.prototype.createEl = function(){
    var el = advjs.MenuButton.prototype.createEl.call(this);

    this.labelEl_ = advjs.createEl('div', {
        className: 'advjs-playback-rate-value',
        innerHTML: 1.0
    });

    el.appendChild(this.labelEl_);

    return el;
};

// Menu creation
advjs.PlaybackRateMenuButton.prototype.createMenu = function(){
    var menu = new advjs.Menu(this.player());
    var rates = this.player().options()['playbackRates'];

    if (rates) {
        for (var i = rates.length - 1; i >= 0; i--) {
            menu.addChild(
                new advjs.PlaybackRateMenuItem(this.player(), { 'rate': rates[i] + 'x'})
            );
        }
    }

    return menu;
};

advjs.PlaybackRateMenuButton.prototype.updateARIAAttributes = function(){
    // Current playback rate
    this.el().setAttribute('aria-valuenow', this.player().playbackRate());
};

advjs.PlaybackRateMenuButton.prototype.onClick = function(){
    // select next rate option
    var currentRate = this.player().playbackRate();
    var rates = this.player().options()['playbackRates'];
    // this will select first one if the last one currently selected
    var newRate = rates[0];
    for (var i = 0; i <rates.length ; i++) {
        if (rates[i] > currentRate) {
            newRate = rates[i];
            break;
        }
    }
    this.player().playbackRate(newRate);
};

advjs.PlaybackRateMenuButton.prototype.playbackRateSupported = function(){
    return this.player().tech
        && this.player().tech['featuresPlaybackRate']
        && this.player().options()['playbackRates']
        && this.player().options()['playbackRates'].length > 0
        ;
};

/**
 * Hide playback rate controls when they're no playback rate options to select
 */
advjs.PlaybackRateMenuButton.prototype.updateVisibility = function(){
    if (this.playbackRateSupported()) {
        this.removeClass('advjs-hidden');
    } else {
        this.addClass('advjs-hidden');
    }
};

/**
 * Update button label when rate changed
 */
advjs.PlaybackRateMenuButton.prototype.updateLabel = function(){
    if (this.playbackRateSupported()) {
        this.labelEl_.innerHTML = this.player().playbackRate() + 'x';
    }
};

/**
 * The specific menu item type for selecting a playback rate
 *
 * @constructor
 */
advjs.PlaybackRateMenuItem = advjs.MenuItem.extend({
    contentElType: 'button',
    /** @constructor */
    init: function(player, options){
        var label = this.label = options['rate'];
        var rate = this.rate = parseFloat(label, 10);

        // Modify options for parent MenuItem class's init.
        options['label'] = label;
        options['selected'] = rate === 1;
        advjs.MenuItem.call(this, player, options);

        this.on(player, 'ratechange', this.update);
    }
});

advjs.PlaybackRateMenuItem.prototype.onClick = function(){
    advjs.MenuItem.prototype.onClick.call(this);
    this.player().playbackRate(this.rate);
};

advjs.PlaybackRateMenuItem.prototype.update = function(){
    this.selected(this.player().playbackRate() == this.rate);
};
/* Poster Image
 ================================================================================ */
/**
 * The component that handles showing the poster image.
 *
 * @param {advjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
advjs.PosterImage = advjs.Button.extend({
    /** @constructor */
    init: function(player, options){
        advjs.Button.call(this, player, options);

        this.update();
        player.on('posterchange', advjs.bind(this, this.update));
    }
});

/**
 * Clean up the poster image
 */
advjs.PosterImage.prototype.dispose = function(){
    this.player().off('posterchange', this.update);
    advjs.Button.prototype.dispose.call(this);
};

/**
 * Create the poster image element
 * @return {Element}
 */
advjs.PosterImage.prototype.createEl = function(){
    var el = advjs.createEl('div', {
        className: 'advjs-poster',

        // Don't want poster to be tabbable.
        tabIndex: -1
    });

    // To ensure the poster image resizes while maintaining its original aspect
    // ratio, use a div with `background-size` when available. For browsers that
    // do not support `background-size` (e.g. IE8), fall back on using a regular
    // img element.
    if (!advjs.BACKGROUND_SIZE_SUPPORTED) {
        this.fallbackImg_ = advjs.createEl('img');
        el.appendChild(this.fallbackImg_);
    }

    return el;
};

/**
 * Event handler for updates to the player's poster source
 */
advjs.PosterImage.prototype.update = function(){
    var url = this.player().poster();

    this.setSrc(url);

    // If there's no poster source we should display:none on this component
    // so it's not still clickable or right-clickable
    if (url) {
        this.show();
    } else {
        this.hide();
    }
};

/**
 * Set the poster source depending on the display method
 */
advjs.PosterImage.prototype.setSrc = function(url){
    var backgroundImage;

    if (this.fallbackImg_) {
        this.fallbackImg_.src = url;
    } else {
        backgroundImage = '';
        // Any falsey values should stay as an empty string, otherwise
        // this will throw an extra error
        if (url) {
            backgroundImage = 'url("' + url + '")';
        }

        this.el_.style.backgroundImage = backgroundImage;
    }
};

/**
 * Event handler for clicks on the poster image
 */
advjs.PosterImage.prototype.onClick = function(){
    // We don't want a click to trigger playback when controls are disabled
    // but CSS should be hiding the poster to prevent that from happening
    this.player_.play();
};
/* Loading Spinner
 ================================================================================ */
/**
 * Loading spinner for waiting events
 * @param {advjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
advjs.LoadingSpinner = advjs.Component.extend({
    /** @constructor */
    init: function(player, options){
        advjs.Component.call(this, player, options);

        // MOVING DISPLAY HANDLING TO CSS

        // player.on('canplay', advjs.bind(this, this.hide));
        // player.on('canplaythrough', advjs.bind(this, this.hide));
        // player.on('playing', advjs.bind(this, this.hide));
        // player.on('seeking', advjs.bind(this, this.show));

        // in some browsers seeking does not trigger the 'playing' event,
        // so we also need to trap 'seeked' if we are going to set a
        // 'seeking' event
        // player.on('seeked', advjs.bind(this, this.hide));

        // player.on('ended', advjs.bind(this, this.hide));

        // Not showing spinner on stalled any more. Browsers may stall and then not trigger any events that would remove the spinner.
        // Checked in Chrome 16 and Safari 5.1.2. http://help.advjs.com/discussions/problems/883-why-is-the-download-progress-showing
        // player.on('stalled', advjs.bind(this, this.show));

        // player.on('waiting', advjs.bind(this, this.show));
    }
});

advjs.LoadingSpinner.prototype.createEl = function(){
    return advjs.Component.prototype.createEl.call(this, 'div', {
        className: 'advjs-loading-spinner'
    });
};
/* Big Play Button
 ================================================================================ */
/**
 * Initial play button. Shows before the video has played. The hiding of the
 * big play button is done via CSS and player states.
 * @param {advjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
advjs.BigPlayButton = advjs.Button.extend();

advjs.BigPlayButton.prototype.createEl = function(){
    return advjs.Button.prototype.createEl.call(this, 'div', {
        className: 'advjs-big-play-button',
        innerHTML: '<span aria-hidden="true"></span>',
        'aria-label': 'play video'
    });
};

advjs.BigPlayButton.prototype.onClick = function(){
    this.player_.play();
};
/**
 * Display that an error has occurred making the video unplayable
 * @param {advjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
advjs.ErrorDisplay = advjs.Component.extend({
    init: function(player, options){
        advjs.Component.call(this, player, options);

        this.update();
        this.on(player, 'error', this.update);
    }
});

advjs.ErrorDisplay.prototype.createEl = function(){
    var el = advjs.Component.prototype.createEl.call(this, 'div', {
        className: 'advjs-error-display'
    });

    this.contentEl_ = advjs.createEl('div');
    el.appendChild(this.contentEl_);

    return el;
};

advjs.ErrorDisplay.prototype.update = function(){
    if (this.player().error()) {
        this.contentEl_.innerHTML = this.localize(this.player().error().message);
    }
};
(function() {
    var createTrackHelper;
    /**
     * @fileoverview Media Technology Controller - Base class for media playback
     * technology controllers like Flash and HTML5
     */

    /**
     * Base class for media (HTML5 Video, Flash) controllers
     * @param {advjs.Player|Object} player  Central player instance
     * @param {Object=} options Options object
     * @constructor
     */
    advjs.MediaTechController = advjs.Component.extend({
        /** @constructor */
        init: function(player, options, ready){
            options = options || {};
            // we don't want the tech to report user activity automatically.
            // This is done manually in addControlsListeners
            options.reportTouchActivity = false;
            advjs.Component.call(this, player, options, ready);

            // Manually track progress in cases where the browser/flash player doesn't report it.
            if (!this['featuresProgressEvents']) {
                this.manualProgressOn();
            }

            // Manually track timeupdates in cases where the browser/flash player doesn't report it.
            if (!this['featuresTimeupdateEvents']) {
                this.manualTimeUpdatesOn();
            }

            this.initControlsListeners();

            if (!this['featuresNativeTextTracks']) {
                this.emulateTextTracks();
            }

            this.initTextTrackListeners();
        }
    });

    /**
     * Set up click and touch listeners for the playback element
     * On desktops, a click on the video itself will toggle playback,
     * on a mobile device a click on the video toggles controls.
     * (toggling controls is done by toggling the user state between active and
     * inactive)
     *
     * A tap can signal that a user has become active, or has become inactive
     * e.g. a quick tap on an iPhone movie should reveal the controls. Another
     * quick tap should hide them again (signaling the user is in an inactive
     * viewing state)
     *
     * In addition to this, we still want the user to be considered inactive after
     * a few seconds of inactivity.
     *
     * Note: the only part of iOS interaction we can't mimic with this setup
     * is a touch and hold on the video element counting as activity in order to
     * keep the controls showing, but that shouldn't be an issue. A touch and hold on
     * any controls will still keep the user active
     */
    advjs.MediaTechController.prototype.initControlsListeners = function(){
        var player, activateControls;

        player = this.player();

        activateControls = function(){
            if (player.controls() && !player.usingNativeControls()) {
                this.addControlsListeners();
            }
        };

        // Set up event listeners once the tech is ready and has an element to apply
        // listeners to
        this.ready(activateControls);
        this.on(player, 'controlsenabled', activateControls);
        this.on(player, 'controlsdisabled', this.removeControlsListeners);

        // if we're loading the playback object after it has started loading or playing the
        // video (often with autoplay on) then the loadstart event has already fired and we
        // need to fire it manually because many things rely on it.
        // Long term we might consider how we would do this for other events like 'canplay'
        // that may also have fired.
        this.ready(function(){
            if (this.networkState && this.networkState() > 0) {
                this.player().trigger('loadstart');
            }
        });
    };

    advjs.MediaTechController.prototype.addControlsListeners = function(){
        var userWasActive;

        // Some browsers (Chrome & IE) don't trigger a click on a flash swf, but do
        // trigger mousedown/up.
        // http://stackoverflow.com/questions/1444562/javascript-onclick-event-over-flash-object
        // Any touch events are set to block the mousedown event from happening
        this.on('mousedown', this.onClick);

        // If the controls were hidden we don't want that to change without a tap event
        // so we'll check if the controls were already showing before reporting user
        // activity
        this.on('touchstart', function(event) {
            userWasActive = this.player_.userActive();
        });

        this.on('touchmove', function(event) {
            if (userWasActive){
                this.player().reportUserActivity();
            }
        });

        this.on('touchend', function(event) {
            // Stop the mouse events from also happening
            event.preventDefault();
        });

        // Turn on component tap events
        this.emitTapEvents();

        // The tap listener needs to come after the touchend listener because the tap
        // listener cancels out any reportedUserActivity when setting userActive(false)
        this.on('tap', this.onTap);
    };

    /**
     * Remove the listeners used for click and tap controls. This is needed for
     * toggling to controls disabled, where a tap/touch should do nothing.
     */
    advjs.MediaTechController.prototype.removeControlsListeners = function(){
        // We don't want to just use `this.off()` because there might be other needed
        // listeners added by techs that extend this.
        this.off('tap');
        this.off('touchstart');
        this.off('touchmove');
        this.off('touchleave');
        this.off('touchcancel');
        this.off('touchend');
        this.off('click');
        this.off('mousedown');
    };

    /**
     * Handle a click on the media element. By default will play/pause the media.
     */
    advjs.MediaTechController.prototype.onClick = function(event){
        // We're using mousedown to detect clicks thanks to Flash, but mousedown
        // will also be triggered with right-clicks, so we need to prevent that
        if (event.button !== 0) return;

        // When controls are disabled a click should not toggle playback because
        // the click is considered a control
        if (this.player().controls()) {
            if (this.player().paused()) {
                this.player().play();
            } else {
                this.player().pause();
            }
        }
    };

    /**
     * Handle a tap on the media element. By default it will toggle the user
     * activity state, which hides and shows the controls.
     */
    advjs.MediaTechController.prototype.onTap = function(){
        this.player().userActive(!this.player().userActive());
    };

    /* Fallbacks for unsupported event types
     ================================================================================ */
// Manually trigger progress events based on changes to the buffered amount
// Many flash players and older HTML5 browsers don't send progress or progress-like events
    advjs.MediaTechController.prototype.manualProgressOn = function(){
        this.manualProgress = true;

        // Trigger progress watching when a source begins loading
        this.trackProgress();
    };

    advjs.MediaTechController.prototype.manualProgressOff = function(){
        this.manualProgress = false;
        this.stopTrackingProgress();
    };

    advjs.MediaTechController.prototype.trackProgress = function(){
        this.progressInterval = this.setInterval(function(){
            // Don't trigger unless buffered amount is greater than last time

            var bufferedPercent = this.player().bufferedPercent();

            if (this.bufferedPercent_ != bufferedPercent) {
                this.player().trigger('progress');
            }

            this.bufferedPercent_ = bufferedPercent;

            if (bufferedPercent === 1) {
                this.stopTrackingProgress();
            }
        }, 500);
    };
    advjs.MediaTechController.prototype.stopTrackingProgress = function(){ this.clearInterval(this.progressInterval); };

    /*! Time Tracking -------------------------------------------------------------- */
    advjs.MediaTechController.prototype.manualTimeUpdatesOn = function(){
        var player = this.player_;

        this.manualTimeUpdates = true;

        this.on(player, 'play', this.trackCurrentTime);
        this.on(player, 'pause', this.stopTrackingCurrentTime);
        // timeupdate is also called by .currentTime whenever current time is set

        // Watch for native timeupdate event
        this.one('timeupdate', function(){
            // Update known progress support for this playback technology
            this['featuresTimeupdateEvents'] = true;
            // Turn off manual progress tracking
            this.manualTimeUpdatesOff();
        });
    };

    advjs.MediaTechController.prototype.manualTimeUpdatesOff = function(){
        var player = this.player_;

        this.manualTimeUpdates = false;
        this.stopTrackingCurrentTime();
        this.off(player, 'play', this.trackCurrentTime);
        this.off(player, 'pause', this.stopTrackingCurrentTime);
    };

    advjs.MediaTechController.prototype.trackCurrentTime = function(){
        if (this.currentTimeInterval) { this.stopTrackingCurrentTime(); }
        this.currentTimeInterval = this.setInterval(function(){
            this.player().trigger('timeupdate');
        }, 250); // 42 = 24 fps // 250 is what Webkit uses // FF uses 15
    };

// Turn off play progress tracking (when paused or dragging)
    advjs.MediaTechController.prototype.stopTrackingCurrentTime = function(){
        this.clearInterval(this.currentTimeInterval);

        // #1002 - if the video ends right before the next timeupdate would happen,
        // the progress bar won't make it all the way to the end
        this.player().trigger('timeupdate');
    };

    advjs.MediaTechController.prototype.dispose = function() {
        // Turn off any manual progress or timeupdate tracking
        if (this.manualProgress) { this.manualProgressOff(); }

        if (this.manualTimeUpdates) { this.manualTimeUpdatesOff(); }

        advjs.Component.prototype.dispose.call(this);
    };

    advjs.MediaTechController.prototype.setCurrentTime = function() {
        // improve the accuracy of manual timeupdates
        if (this.manualTimeUpdates) { this.player().trigger('timeupdate'); }
    };

// TODO: Consider looking at moving this into the text track display directly
// https://github.com/advjs/video.js/issues/1863
    advjs.MediaTechController.prototype.initTextTrackListeners = function() {
        var player = this.player_,
            tracks,
            textTrackListChanges = function() {
                var textTrackDisplay = player.getChild('textTrackDisplay'),
                    controlBar;

                if (textTrackDisplay) {
                    textTrackDisplay.updateDisplay();
                }
            };

        tracks = this.textTracks();

        if (!tracks) {
            return;
        }

        tracks.addEventListener('removetrack', textTrackListChanges);
        tracks.addEventListener('addtrack', textTrackListChanges);

        this.on('dispose', advjs.bind(this, function() {
            tracks.removeEventListener('removetrack', textTrackListChanges);
            tracks.removeEventListener('addtrack', textTrackListChanges);
        }));
    };

    advjs.MediaTechController.prototype.emulateTextTracks = function() {
        var player = this.player_,
            textTracksChanges,
            tracks,
            script;

        if (!window['WebVTT']) {
            script = document.createElement('script');
            script.src = player.options()['vtt.js'] || '../node_modules/vtt.js/dist/vtt.js';
            player.el().appendChild(script);
            window['WebVTT'] = true;
        }

        tracks = this.textTracks();
        if (!tracks) {
            return;
        }

        textTracksChanges = function() {
            var i, track, textTrackDisplay;

            textTrackDisplay = player.getChild('textTrackDisplay'),

                textTrackDisplay.updateDisplay();

            for (i = 0; i < this.length; i++) {
                track = this[i];
                track.removeEventListener('cuechange', advjs.bind(textTrackDisplay, textTrackDisplay.updateDisplay));
                if (track.mode === 'showing') {
                    track.addEventListener('cuechange', advjs.bind(textTrackDisplay, textTrackDisplay.updateDisplay));
                }
            }
        };

        tracks.addEventListener('change', textTracksChanges);

        this.on('dispose', advjs.bind(this, function() {
            tracks.removeEventListener('change', textTracksChanges);
        }));
    };

    /**
     * Provide default methods for text tracks.
     *
     * Html5 tech overrides these.
     */

    /**
     * List of associated text tracks
     * @type {Array}
     * @private
     */
    advjs.MediaTechController.prototype.textTracks_;

    advjs.MediaTechController.prototype.textTracks = function() {
        this.player_.textTracks_ = this.player_.textTracks_ || new advjs.TextTrackList();
        return this.player_.textTracks_;
    };

    advjs.MediaTechController.prototype.remoteTextTracks = function() {
        this.player_.remoteTextTracks_ = this.player_.remoteTextTracks_ || new advjs.TextTrackList();
        return this.player_.remoteTextTracks_;
    };

    createTrackHelper = function(self, kind, label, language, options) {
        var tracks = self.textTracks(),
            track;

        options = options || {};

        options['kind'] = kind;
        if (label) {
            options['label'] = label;
        }
        if (language) {
            options['language'] = language;
        }
        options['player'] = self.player_;

        track = new advjs.TextTrack(options);
        tracks.addTrack_(track);

        return track;
    };

    advjs.MediaTechController.prototype.addTextTrack = function(kind, label, language) {
        if (!kind) {
            throw new Error('TextTrack kind is required but was not provided');
        }

        return createTrackHelper(this, kind, label, language);
    };

    advjs.MediaTechController.prototype.addRemoteTextTrack = function(options) {
        var track = createTrackHelper(this, options['kind'], options['label'], options['language'], options);
        this.remoteTextTracks().addTrack_(track);
        return {
            track: track
        };
    };

    advjs.MediaTechController.prototype.removeRemoteTextTrack = function(track) {
        this.textTracks().removeTrack_(track);
        this.remoteTextTracks().removeTrack_(track);
    };

    /**
     * Provide a default setPoster method for techs
     *
     * Poster support for techs should be optional, so we don't want techs to
     * break if they don't have a way to set a poster.
     */
    advjs.MediaTechController.prototype.setPoster = function(){};

    advjs.MediaTechController.prototype['featuresVolumeControl'] = true;

// Resizing plugins using request fullscreen reloads the plugin
    advjs.MediaTechController.prototype['featuresFullscreenResize'] = false;
    advjs.MediaTechController.prototype['featuresPlaybackRate'] = false;

// Optional events that we can manually mimic with timers
// currently not triggered by video-js-swf
    advjs.MediaTechController.prototype['featuresProgressEvents'] = false;
    advjs.MediaTechController.prototype['featuresTimeupdateEvents'] = false;

    advjs.MediaTechController.prototype['featuresNativeTextTracks'] = false;

    /**
     * A functional mixin for techs that want to use the Source Handler pattern.
     *
     * ##### EXAMPLE:
     *
     *   advjs.MediaTechController.withSourceHandlers.call(MyTech);
     *
     */
    advjs.MediaTechController.withSourceHandlers = function(Tech){
        /**
         * Register a source handler
         * Source handlers are scripts for handling specific formats.
         * The source handler pattern is used for adaptive formats (HLS, DASH) that
         * manually load video data and feed it into a Source Buffer (Media Source Extensions)
         * @param  {Function} handler  The source handler
         * @param  {Boolean}  first    Register it before any existing handlers
         */
        Tech['registerSourceHandler'] = function(handler, index){
            var handlers = Tech.sourceHandlers;

            if (!handlers) {
                handlers = Tech.sourceHandlers = [];
            }

            if (index === undefined) {
                // add to the end of the list
                index = handlers.length;
            }

            handlers.splice(index, 0, handler);
        };

        /**
         * Return the first source handler that supports the source
         * TODO: Answer question: should 'probably' be prioritized over 'maybe'
         * @param  {Object} source The source object
         * @returns {Object}       The first source handler that supports the source
         * @returns {null}         Null if no source handler is found
         */
        Tech.selectSourceHandler = function(source){
            var handlers = Tech.sourceHandlers || [],
                can;

            for (var i = 0; i < handlers.length; i++) {
                can = handlers[i]['canHandleSource'](source);

                if (can) {
                    return handlers[i];
                }
            }

            return null;
        };

        /**
         * Check if the tech can support the given source
         * @param  {Object} srcObj  The source object
         * @return {String}         'probably', 'maybe', or '' (empty string)
         */
        Tech.canPlaySource = function(srcObj){
            var sh = Tech.selectSourceHandler(srcObj);

            if (sh) {
                return sh['canHandleSource'](srcObj);
            }

            return '';
        };

        /**
         * Create a function for setting the source using a source object
         * and source handlers.
         * Should never be called unless a source handler was found.
         * @param {Object} source  A source object with src and type keys
         * @return {advjs.MediaTechController} self
         */
        Tech.prototype.setSource = function(source){
            var sh = Tech.selectSourceHandler(source);

            if (!sh) {
                // Fall back to a native source hander when unsupported sources are
                // deliberately set
                if (Tech['nativeSourceHandler']) {
                    sh = Tech['nativeSourceHandler'];
                } else {
                    advjs.log.error('No source hander found for the current source.');
                }
            }

            // Dispose any existing source handler
            this.disposeSourceHandler();
            this.off('dispose', this.disposeSourceHandler);

            this.currentSource_ = source;
            this.sourceHandler_ = sh['handleSource'](source, this);
            this.on('dispose', this.disposeSourceHandler);

            return this;
        };

        /**
         * Clean up any existing source handler
         */
        Tech.prototype.disposeSourceHandler = function(){
            if (this.sourceHandler_ && this.sourceHandler_['dispose']) {
                this.sourceHandler_['dispose']();
            }
        };

    };

    advjs.media = {};

})();
/**
 * @fileoverview HTML5 Media Controller - Wrapper for HTML5 Media API
 */

/**
 * HTML5 Media Controller - Wrapper for HTML5 Media API
 * @param {advjs.Player|Object} player
 * @param {Object=} options
 * @param {Function=} ready
 * @constructor
 */
advjs.Html5 = advjs.MediaTechController.extend({
    /** @constructor */
    init: function(player, options, ready){
        var  nodes, nodesLength, i, node, nodeName, removeNodes;

        if (options['nativeCaptions'] === false || options['nativeTextTracks'] === false) {
            this['featuresNativeTextTracks'] = false;
        }

        advjs.MediaTechController.call(this, player, options, ready);

        this.setupTriggers();

        var source = options['source'];

        // Set the source if one is provided
        // 1) Check if the source is new (if not, we want to keep the original so playback isn't interrupted)
        // 2) Check to see if the network state of the tag was failed at init, and if so, reset the source
        // anyway so the error gets fired.
        if (source && (this.el_.currentSrc !== source.src || (player.tag && player.tag.initNetworkState_ === 3))) {
            this.setSource(source);
        }

        if (this.el_.hasChildNodes()) {

            nodes = this.el_.childNodes;
            nodesLength = nodes.length;
            removeNodes = [];

            while (nodesLength--) {
                node = nodes[nodesLength];
                nodeName = node.nodeName.toLowerCase();
                if (nodeName === 'track') {
                    if (!this['featuresNativeTextTracks']) {
                        // Empty video tag tracks so the built-in player doesn't use them also.
                        // This may not be fast enough to stop HTML5 browsers from reading the tags
                        // so we'll need to turn off any default tracks if we're manually doing
                        // captions and subtitles. videoElement.textTracks
                        removeNodes.push(node);
                    } else {
                        this.remoteTextTracks().addTrack_(node['track']);
                    }
                }
            }

            for (i=0; i<removeNodes.length; i++) {
                this.el_.removeChild(removeNodes[i]);
            }
        }

        // Determine if native controls should be used
        // Our goal should be to get the custom controls on mobile solid everywhere
        // so we can remove this all together. Right now this will block custom
        // controls on touch enabled laptops like the Chrome Pixel
        if (advjs.TOUCH_ENABLED && player.options()['nativeControlsForTouch'] === true) {
            this.useNativeControls();
        }

        // Chrome and Safari both have issues with autoplay.
        // In Safari (5.1.1), when we move the video element into the container div, autoplay doesn't work.
        // In Chrome (15), if you have autoplay + a poster + no controls, the video gets hidden (but audio plays)
        // This fixes both issues. Need to wait for API, so it updates displays correctly
        player.ready(function(){
            if (this.src() && this.tag && this.options_['autoplay'] && this.paused()) {
                delete this.tag['poster']; // Chrome Fix. Fixed in Chrome v16.
                this.play();
            }
        });

        this.triggerReady();
    }
});

advjs.Html5.prototype.dispose = function(){
    advjs.Html5.disposeMediaElement(this.el_);
    advjs.MediaTechController.prototype.dispose.call(this);
};

advjs.Html5.prototype.createEl = function(){
    var player = this.player_,
        track,
        trackEl,
        i,
    // If possible, reuse original tag for HTML5 playback technology element
        el = player.tag,
        attributes,
        newEl,
        clone;

    // Check if this browser supports moving the element into the box.
    // On the iPhone video will break if you move the element,
    // So we have to create a brand new element.
    if (!el || this['movingMediaElementInDOM'] === false) {

        // If the original tag is still there, clone and remove it.
        if (el) {
            clone = el.cloneNode(false);
            advjs.Html5.disposeMediaElement(el);
            el = clone;
            player.tag = null;
        } else {
            el = advjs.createEl('video');

            // determine if native controls should be used
            attributes = advjs.util.mergeOptions({}, player.tagAttributes);
            if (!advjs.TOUCH_ENABLED || player.options()['nativeControlsForTouch'] !== true) {
                delete attributes.controls;
            }

            advjs.setElementAttributes(el,
                advjs.obj.merge(attributes, {
                    id:player.id() + '_html5_api',
                    'class':'advjs-tech'
                })
            );
        }
        // associate the player with the new tag
        el['player'] = player;

        if (player.options_.tracks) {
            for (i = 0; i < player.options_.tracks.length; i++) {
                track = player.options_.tracks[i];
                trackEl = document.createElement('track');
                trackEl.kind = track.kind;
                trackEl.label = track.label;
                trackEl.srclang = track.srclang;
                trackEl.src = track.src;
                if ('default' in track) {
                    trackEl.setAttribute('default', 'default');
                }
                el.appendChild(trackEl);
            }
        }

        advjs.insertFirst(el, player.el());
    }

    // Update specific tag settings, in case they were overridden
    var settingsAttrs = ['autoplay','preload','loop','muted'];
    for (i = settingsAttrs.length - 1; i >= 0; i--) {
        var attr = settingsAttrs[i];
        var overwriteAttrs = {};
        if (typeof player.options_[attr] !== 'undefined') {
            overwriteAttrs[attr] = player.options_[attr];
        }
        advjs.setElementAttributes(el, overwriteAttrs);
    }

    return el;
    // jenniisawesome = true;
};

// Make video events trigger player events
// May seem verbose here, but makes other APIs possible.
// Triggers removed using this.off when disposed
advjs.Html5.prototype.setupTriggers = function(){
    for (var i = advjs.Html5.Events.length - 1; i >= 0; i--) {
        this.on(advjs.Html5.Events[i], this.eventHandler);
    }
};

advjs.Html5.prototype.eventHandler = function(evt){
    // In the case of an error on the video element, set the error prop
    // on the player and let the player handle triggering the event. On
    // some platforms, error events fire that do not cause the error
    // property on the video element to be set. See #1465 for an example.
    if (evt.type == 'error' && this.error()) {
        this.player().error(this.error().code);

        // in some cases we pass the event directly to the player
    } else {
        // No need for media events to bubble up.
        evt.bubbles = false;

        this.player().trigger(evt);
    }
};

advjs.Html5.prototype.useNativeControls = function(){
    var tech, player, controlsOn, controlsOff, cleanUp;

    tech = this;
    player = this.player();

    // If the player controls are enabled turn on the native controls
    tech.setControls(player.controls());

    // Update the native controls when player controls state is updated
    controlsOn = function(){
        tech.setControls(true);
    };
    controlsOff = function(){
        tech.setControls(false);
    };
    player.on('controlsenabled', controlsOn);
    player.on('controlsdisabled', controlsOff);

    // Clean up when not using native controls anymore
    cleanUp = function(){
        player.off('controlsenabled', controlsOn);
        player.off('controlsdisabled', controlsOff);
    };
    tech.on('dispose', cleanUp);
    player.on('usingcustomcontrols', cleanUp);

    // Update the state of the player to using native controls
    player.usingNativeControls(true);
};


advjs.Html5.prototype.play = function(){ this.el_.play(); };
advjs.Html5.prototype.pause = function(){ this.el_.pause(); };
advjs.Html5.prototype.paused = function(){ return this.el_.paused; };

advjs.Html5.prototype.currentTime = function(){ return this.el_.currentTime; };
advjs.Html5.prototype.setCurrentTime = function(seconds){
    try {
        this.el_.currentTime = seconds;
    } catch(e) {
        advjs.log(e, 'Video is not ready. (Video.js)');
        // this.warning(advjs.warnings.videoNotReady);
    }
};

advjs.Html5.prototype.duration = function(){ return this.el_.duration || 0; };
advjs.Html5.prototype.buffered = function(){ return this.el_.buffered; };

advjs.Html5.prototype.volume = function(){ return this.el_.volume; };
advjs.Html5.prototype.setVolume = function(percentAsDecimal){ this.el_.volume = percentAsDecimal; };
advjs.Html5.prototype.muted = function(){ return this.el_.muted; };
advjs.Html5.prototype.setMuted = function(muted){ this.el_.muted = muted; };

advjs.Html5.prototype.width = function(){ return this.el_.offsetWidth; };
advjs.Html5.prototype.height = function(){ return this.el_.offsetHeight; };

advjs.Html5.prototype.supportsFullScreen = function(){
    if (typeof this.el_.webkitEnterFullScreen == 'function') {

        // Seems to be broken in Chromium/Chrome && Safari in Leopard
        if (/Android/.test(advjs.USER_AGENT) || !/Chrome|Mac OS X 10.5/.test(advjs.USER_AGENT)) {
            return true;
        }
    }
    return false;
};

advjs.Html5.prototype.enterFullScreen = function(){
    var video = this.el_;

    if ('webkitDisplayingFullscreen' in video) {
        this.one('webkitbeginfullscreen', function() {
            this.player_.isFullscreen(true);

            this.one('webkitendfullscreen', function() {
                this.player_.isFullscreen(false);
                this.player_.trigger('fullscreenchange');
            });

            this.player_.trigger('fullscreenchange');
        });
    }

    if (video.paused && video.networkState <= video.HAVE_METADATA) {
        // attempt to prime the video element for programmatic access
        // this isn't necessary on the desktop but shouldn't hurt
        this.el_.play();

        // playing and pausing synchronously during the transition to fullscreen
        // can get iOS ~6.1 devices into a play/pause loop
        this.setTimeout(function(){
            video.pause();
            video.webkitEnterFullScreen();
        }, 0);
    } else {
        video.webkitEnterFullScreen();
    }
};

advjs.Html5.prototype.exitFullScreen = function(){
    this.el_.webkitExitFullScreen();
};

// Checks to see if the element's reported URI (either from `el_.src`
// or `el_.currentSrc`) is a blob-uri and, if so, returns the uri that
// was passed into the source-handler when it was first invoked instead
// of the blob-uri
advjs.Html5.prototype.returnOriginalIfBlobURI_ = function (elementURI, originalURI) {
    var blobURIRegExp = /^blob\:/i;

    // If originalURI is undefined then we are probably in a non-source-handler-enabled
    // tech that inherits from the Html5 tech so we should just return the elementURI
    // regardless of it's blobby-ness
    if (originalURI && elementURI && blobURIRegExp.test(elementURI)) {
        return originalURI;
    }
    return elementURI;
};

advjs.Html5.prototype.src = function(src) {
    var elementSrc = this.el_.src;

    if (src === undefined) {
        return this.returnOriginalIfBlobURI_(elementSrc, this.source_);
    } else {
        // Setting src through `src` instead of `setSrc` will be deprecated
        this.setSrc(src);
    }
};

advjs.Html5.prototype.setSrc = function(src) {
    this.el_.src = src;
};

advjs.Html5.prototype.load = function(){ this.el_.load(); };
advjs.Html5.prototype.currentSrc = function(){
    var elementSrc = this.el_.currentSrc;

    if (!this.currentSource_) {
        return elementSrc;
    }

    return this.returnOriginalIfBlobURI_(elementSrc, this.currentSource_.src);
};

advjs.Html5.prototype.poster = function(){ return this.el_.poster; };
advjs.Html5.prototype.setPoster = function(val){ this.el_.poster = val; };

advjs.Html5.prototype.preload = function(){ return this.el_.preload; };
advjs.Html5.prototype.setPreload = function(val){ this.el_.preload = val; };

advjs.Html5.prototype.autoplay = function(){ return this.el_.autoplay; };
advjs.Html5.prototype.setAutoplay = function(val){ this.el_.autoplay = val; };

advjs.Html5.prototype.controls = function(){ return this.el_.controls; };
advjs.Html5.prototype.setControls = function(val){ this.el_.controls = !!val; };

advjs.Html5.prototype.loop = function(){ return this.el_.loop; };
advjs.Html5.prototype.setLoop = function(val){ this.el_.loop = val; };

advjs.Html5.prototype.error = function(){ return this.el_.error; };
advjs.Html5.prototype.seeking = function(){ return this.el_.seeking; };
advjs.Html5.prototype.seekable = function(){ return this.el_.seekable; };
advjs.Html5.prototype.ended = function(){ return this.el_.ended; };
advjs.Html5.prototype.defaultMuted = function(){ return this.el_.defaultMuted; };

advjs.Html5.prototype.playbackRate = function(){ return this.el_.playbackRate; };
advjs.Html5.prototype.setPlaybackRate = function(val){ this.el_.playbackRate = val; };

advjs.Html5.prototype.networkState = function(){ return this.el_.networkState; };
advjs.Html5.prototype.readyState = function(){ return this.el_.readyState; };

advjs.Html5.prototype.textTracks = function() {
    if (!this['featuresNativeTextTracks']) {
        return advjs.MediaTechController.prototype.textTracks.call(this);
    }

    return this.el_.textTracks;
};
advjs.Html5.prototype.addTextTrack = function(kind, label, language) {
    if (!this['featuresNativeTextTracks']) {
        return advjs.MediaTechController.prototype.addTextTrack.call(this, kind, label, language);
    }

    return this.el_.addTextTrack(kind, label, language);
};

advjs.Html5.prototype.addRemoteTextTrack = function(options) {
    if (!this['featuresNativeTextTracks']) {
        return advjs.MediaTechController.prototype.addRemoteTextTrack.call(this, options);
    }

    var track = document.createElement('track');
    options = options || {};

    if (options['kind']) {
        track['kind'] = options['kind'];
    }
    if (options['label']) {
        track['label'] = options['label'];
    }
    if (options['language'] || options['srclang']) {
        track['srclang'] = options['language'] || options['srclang'];
    }
    if (options['default']) {
        track['default'] = options['default'];
    }
    if (options['id']) {
        track['id'] = options['id'];
    }
    if (options['src']) {
        track['src'] = options['src'];
    }

    this.el().appendChild(track);
    this.remoteTextTracks().addTrack_(track.track);

    return track;
};

advjs.Html5.prototype.removeRemoteTextTrack = function(track) {
    if (!this['featuresNativeTextTracks']) {
        return advjs.MediaTechController.prototype.removeRemoteTextTrack.call(this, track);
    }

    var tracks, i;

    this.remoteTextTracks().removeTrack_(track);

    tracks = this.el()['querySelectorAll']('track');

    for (i = 0; i < tracks.length; i++) {
        if (tracks[i] === track || tracks[i]['track'] === track) {
            tracks[i]['parentNode']['removeChild'](tracks[i]);
            break;
        }
    }
};

/* HTML5 Support Testing ---------------------------------------------------- */

/**
 * Check if HTML5 video is supported by this browser/device
 * @return {Boolean}
 */
advjs.Html5.isSupported = function(){
    // IE9 with no Media Player is a LIAR! (#984)
    try {
        advjs.TEST_VID['volume'] = 0.5;
    } catch (e) {
        return false;
    }

    return !!advjs.TEST_VID.canPlayType;
};

// Add Source Handler pattern functions to this tech
advjs.MediaTechController.withSourceHandlers(advjs.Html5);

/*
 * Override the withSourceHandler mixin's methods with our own because
 * the HTML5 Media Element returns blob urls when utilizing MSE and we
 * want to still return proper source urls even when in that case
 */
(function(){
    var
        origSetSource = advjs.Html5.prototype.setSource,
        origDisposeSourceHandler = advjs.Html5.prototype.disposeSourceHandler;

    advjs.Html5.prototype.setSource = function (source) {
        var retVal = origSetSource.call(this, source);
        this.source_ = source.src;
        return retVal;
    };

    advjs.Html5.prototype.disposeSourceHandler = function () {
        this.source_ = undefined;
        return origDisposeSourceHandler.call(this);
    };
})();

/**
 * The default native source handler.
 * This simply passes the source to the video element. Nothing fancy.
 * @param  {Object} source   The source object
 * @param  {advjs.Html5} tech  The instance of the HTML5 tech
 */
advjs.Html5['nativeSourceHandler'] = {};

/**
 * Check if the video element can handle the source natively
 * @param  {Object} source  The source object
 * @return {String}         'probably', 'maybe', or '' (empty string)
 */
advjs.Html5['nativeSourceHandler']['canHandleSource'] = function(source){
    var match, ext;

    function canPlayType(type){
        // IE9 on Windows 7 without MediaPlayer throws an error here
        // https://github.com/advjs/video.js/issues/519
        try {
            return advjs.TEST_VID.canPlayType(type);
        } catch(e) {
            return '';
        }
    }

    // If a type was provided we should rely on that
    if (source.type) {
        return canPlayType(source.type);
    } else if (source.src) {
        // If no type, fall back to checking 'video/[EXTENSION]'
        match = source.src.match(/\.([^.\/\?]+)(\?[^\/]+)?$/i);
        ext = match && match[1];

        return canPlayType('video/'+ext);
    }

    return '';
};

/**
 * Pass the source to the video element
 * Adaptive source handlers will have more complicated workflows before passing
 * video data to the video element
 * @param  {Object} source    The source object
 * @param  {advjs.Html5} tech   The instance of the Html5 tech
 */
advjs.Html5['nativeSourceHandler']['handleSource'] = function(source, tech){
    tech.setSrc(source.src);
};

/**
 * Clean up the source handler when disposing the player or switching sources..
 * (no cleanup is needed when supporting the format natively)
 */
advjs.Html5['nativeSourceHandler']['dispose'] = function(){};

// Register the native source handler
advjs.Html5['registerSourceHandler'](advjs.Html5['nativeSourceHandler']);

/**
 * Check if the volume can be changed in this browser/device.
 * Volume cannot be changed in a lot of mobile devices.
 * Specifically, it can't be changed from 1 on iOS.
 * @return {Boolean}
 */
advjs.Html5.canControlVolume = function(){
    var volume =  advjs.TEST_VID.volume;
    advjs.TEST_VID.volume = (volume / 2) + 0.1;
    return volume !== advjs.TEST_VID.volume;
};

/**
 * Check if playbackRate is supported in this browser/device.
 * @return {[type]} [description]
 */
advjs.Html5.canControlPlaybackRate = function(){
    var playbackRate =  advjs.TEST_VID.playbackRate;
    advjs.TEST_VID.playbackRate = (playbackRate / 2) + 0.1;
    return playbackRate !== advjs.TEST_VID.playbackRate;
};

/**
 * Check to see if native text tracks are supported by this browser/device
 * @return {Boolean}
 */
advjs.Html5.supportsNativeTextTracks = function() {
    var supportsTextTracks;

    // Figure out native text track support
    // If mode is a number, we cannot change it because it'll disappear from view.
    // Browsers with numeric modes include IE10 and older (<=2013) samsung android models.
    // Firefox isn't playing nice either with modifying the mode
    // TODO: Investigate firefox: https://github.com/advjs/video.js/issues/1862
    supportsTextTracks = !!advjs.TEST_VID.textTracks;
    if (supportsTextTracks && advjs.TEST_VID.textTracks.length > 0) {
        supportsTextTracks = typeof advjs.TEST_VID.textTracks[0]['mode'] !== 'number';
    }
    if (supportsTextTracks && advjs.IS_FIREFOX) {
        supportsTextTracks = false;
    }

    return supportsTextTracks;
};

/**
 * Set the tech's volume control support status
 * @type {Boolean}
 */
advjs.Html5.prototype['featuresVolumeControl'] = advjs.Html5.canControlVolume();

/**
 * Set the tech's playbackRate support status
 * @type {Boolean}
 */
advjs.Html5.prototype['featuresPlaybackRate'] = advjs.Html5.canControlPlaybackRate();

/**
 * Set the tech's status on moving the video element.
 * In iOS, if you move a video element in the DOM, it breaks video playback.
 * @type {Boolean}
 */
advjs.Html5.prototype['movingMediaElementInDOM'] = !advjs.IS_IOS;

/**
 * Set the the tech's fullscreen resize support status.
 * HTML video is able to automatically resize when going to fullscreen.
 * (No longer appears to be used. Can probably be removed.)
 */
advjs.Html5.prototype['featuresFullscreenResize'] = true;

/**
 * Set the tech's progress event support status
 * (this disables the manual progress events of the MediaTechController)
 */
advjs.Html5.prototype['featuresProgressEvents'] = true;

/**
 * Sets the tech's status on native text track support
 * @type {Boolean}
 */
advjs.Html5.prototype['featuresNativeTextTracks'] = advjs.Html5.supportsNativeTextTracks();

// HTML5 Feature detection and Device Fixes --------------------------------- //
(function() {
    var canPlayType,
        mpegurlRE = /^application\/(?:x-|vnd\.apple\.)mpegurl/i,
        mp4RE = /^video\/mp4/i;

    advjs.Html5.patchCanPlayType = function() {
        // Android 4.0 and above can play HLS to some extent but it reports being unable to do so
        if (advjs.ANDROID_VERSION >= 4.0) {
            if (!canPlayType) {
                canPlayType = advjs.TEST_VID.constructor.prototype.canPlayType;
            }

            advjs.TEST_VID.constructor.prototype.canPlayType = function(type) {
                if (type && mpegurlRE.test(type)) {
                    return 'maybe';
                }
                return canPlayType.call(this, type);
            };
        }

        // Override Android 2.2 and less canPlayType method which is broken
        if (advjs.IS_OLD_ANDROID) {
            if (!canPlayType) {
                canPlayType = advjs.TEST_VID.constructor.prototype.canPlayType;
            }

            advjs.TEST_VID.constructor.prototype.canPlayType = function(type){
                if (type && mp4RE.test(type)) {
                    return 'maybe';
                }
                return canPlayType.call(this, type);
            };
        }
    };

    advjs.Html5.unpatchCanPlayType = function() {
        var r = advjs.TEST_VID.constructor.prototype.canPlayType;
        advjs.TEST_VID.constructor.prototype.canPlayType = canPlayType;
        canPlayType = null;
        return r;
    };

    // by default, patch the video element
    advjs.Html5.patchCanPlayType();
})();

// List of all HTML5 events (various uses).
advjs.Html5.Events = 'loadstart,suspend,abort,error,emptied,stalled,loadedmetadata,loadeddata,canplay,canplaythrough,playing,waiting,seeking,seeked,ended,durationchange,timeupdate,progress,play,pause,ratechange,volumechange'.split(',');

advjs.Html5.disposeMediaElement = function(el){
    if (!el) { return; }

    el['player'] = null;

    if (el.parentNode) {
        el.parentNode.removeChild(el);
    }

    // remove any child track or source nodes to prevent their loading
    while(el.hasChildNodes()) {
        el.removeChild(el.firstChild);
    }

    // remove any src reference. not setting `src=''` because that causes a warning
    // in firefox
    el.removeAttribute('src');

    // force the media element to update its loading state by calling load()
    // however IE on Windows 7N has a bug that throws an error so need a try/catch (#793)
    if (typeof el.load === 'function') {
        // wrapping in an iife so it's not deoptimized (#1060#discussion_r10324473)
        (function() {
            try {
                el.load();
            } catch (e) {
                // not supported
            }
        })();
    }
};
/**
 * @fileoverview advjs-SWF - Custom Flash Player with HTML5-ish API
 * https://github.com/zencoder/video-js-swf
 * Not using setupTriggers. Using global onEvent func to distribute events
 */

/**
 * Flash Media Controller - Wrapper for fallback SWF API
 *
 * @param {advjs.Player} player
 * @param {Object=} options
 * @param {Function=} ready
 * @constructor
 */
advjs.Flash = advjs.MediaTechController.extend({
    /** @constructor */
    init: function(player, options, ready){
        advjs.MediaTechController.call(this, player, options, ready);

        var source = options['source'],

        // Generate ID for swf object
            objId = player.id()+'_flash_api',

        // Store player options in local var for optimization
        // TODO: switch to using player methods instead of options
        // e.g. player.autoplay();
            playerOptions = player.options_,

        // Merge default flashvars with ones passed in to init
            flashVars = advjs.obj.merge({

                // SWF Callback Functions
                'readyFunction': 'advjs.Flash.onReady',
                'eventProxyFunction': 'advjs.Flash.onEvent',
                'errorEventProxyFunction': 'advjs.Flash.onError',

                // Player Settings
                'autoplay': playerOptions.autoplay,
                'preload': playerOptions.preload,
                'loop': playerOptions.loop,
                'muted': playerOptions.muted

            }, options['flashVars']),

        // Merge default parames with ones passed in
            params = advjs.obj.merge({
                'wmode': 'opaque', // Opaque is needed to overlay controls, but can affect playback performance
                'bgcolor': '#000000' // Using bgcolor prevents a white flash when the object is loading
            }, options['params']),

        // Merge default attributes with ones passed in
            attributes = advjs.obj.merge({
                'id': objId,
                'name': objId, // Both ID and Name needed or swf to identify itself
                'class': 'advjs-tech'
            }, options['attributes'])
            ;

        // If source was supplied pass as a flash var.
        if (source) {
            this.ready(function(){
                this.setSource(source);
            });
        }

        // Add placeholder to player div
        advjs.insertFirst(this.el_, options['parentEl']);

        // Having issues with Flash reloading on certain page actions (hide/resize/fullscreen) in certain browsers
        // This allows resetting the playhead when we catch the reload
        if (options['startTime']) {
            this.ready(function(){
                this.load();
                this.play();
                this['currentTime'](options['startTime']);
            });
        }

        // firefox doesn't bubble mousemove events to parent. advjs/video-js-swf#37
        // bugzilla bug: https://bugzilla.mozilla.org/show_bug.cgi?id=836786
        if (advjs.IS_FIREFOX) {
            this.ready(function(){
                this.on('mousemove', function(){
                    // since it's a custom event, don't bubble higher than the player
                    this.player().trigger({ 'type':'mousemove', 'bubbles': false });
                });
            });
        }

        // native click events on the SWF aren't triggered on IE11, Win8.1RT
        // use stageclick events triggered from inside the SWF instead
        player.on('stageclick', player.reportUserActivity);

        this.el_ = advjs.Flash.embed(options['swf'], this.el_, flashVars, params, attributes);
    }
});

advjs.Flash.prototype.dispose = function(){
    advjs.MediaTechController.prototype.dispose.call(this);
};

advjs.Flash.prototype.play = function(){
    if (this.ended()) {
        this['setCurrentTime'](0);
    }

    this.el_.vjs_play();
};

advjs.Flash.prototype.pause = function(){
    this.el_.vjs_pause();
};

advjs.Flash.prototype.src = function(src){
    if (src === undefined) {
        return this['currentSrc']();
    }

    // Setting src through `src` not `setSrc` will be deprecated
    return this.setSrc(src);
};

advjs.Flash.prototype.setSrc = function(src){
    // Make sure source URL is absolute.
    src = advjs.getAbsoluteURL(src);
    this.el_.vjs_src(src);

    // Currently the SWF doesn't autoplay if you load a source later.
    // e.g. Load player w/ no source, wait 2s, set src.
    if (this.player_.autoplay()) {
        var tech = this;
        this.setTimeout(function(){ tech.play(); }, 0);
    }
};

advjs.Flash.prototype['setCurrentTime'] = function(time){
    this.lastSeekTarget_ = time;
    this.el_.vjs_setProperty('currentTime', time);
    advjs.MediaTechController.prototype.setCurrentTime.call(this);
};

advjs.Flash.prototype['currentTime'] = function(time){
    // when seeking make the reported time keep up with the requested time
    // by reading the time we're seeking to
    if (this.seeking()) {
        return this.lastSeekTarget_ || 0;
    }
    return this.el_.vjs_getProperty('currentTime');
};

advjs.Flash.prototype['currentSrc'] = function(){
    if (this.currentSource_) {
        return this.currentSource_.src;
    } else {
        return this.el_.vjs_getProperty('currentSrc');
    }
};

advjs.Flash.prototype.load = function(){
    this.el_.vjs_load();
};

advjs.Flash.prototype.poster = function(){
    this.el_.vjs_getProperty('poster');
};
advjs.Flash.prototype['setPoster'] = function(){
    // poster images are not handled by the Flash tech so make this a no-op
};

advjs.Flash.prototype.seekable = function() {
    var duration = this.duration();
    if (duration === 0) {
        // The SWF reports a duration of zero when the actual duration is unknown
        return advjs.createTimeRange();
    }
    return advjs.createTimeRange(0, this.duration());
};

advjs.Flash.prototype.buffered = function(){
    if (!this.el_.vjs_getProperty) {
        return advjs.createTimeRange();
    }
    return advjs.createTimeRange(0, this.el_.vjs_getProperty('buffered'));
};

advjs.Flash.prototype.duration = function(){
    if (!this.el_.vjs_getProperty) {
        return 0;
    }
    return this.el_.vjs_getProperty('duration');
};

advjs.Flash.prototype.supportsFullScreen = function(){
    return false; // Flash does not allow fullscreen through javascript
};

advjs.Flash.prototype.enterFullScreen = function(){
    return false;
};

(function(){
    // Create setters and getters for attributes
    var api = advjs.Flash.prototype,
        readWrite = 'rtmpConnection,rtmpStream,preload,defaultPlaybackRate,playbackRate,autoplay,loop,mediaGroup,controller,controls,volume,muted,defaultMuted'.split(','),
        readOnly = 'error,networkState,readyState,seeking,initialTime,startOffsetTime,paused,played,ended,videoTracks,audioTracks,videoWidth,videoHeight'.split(','),
    // Overridden: buffered, currentTime, currentSrc
        i;

    function createSetter(attr){
        var attrUpper = attr.charAt(0).toUpperCase() + attr.slice(1);
        api['set'+attrUpper] = function(val){ return this.el_.vjs_setProperty(attr, val); };
    }
    function createGetter(attr) {
        api[attr] = function(){ return this.el_.vjs_getProperty(attr); };
    }

    // Create getter and setters for all read/write attributes
    for (i = 0; i < readWrite.length; i++) {
        createGetter(readWrite[i]);
        createSetter(readWrite[i]);
    }

    // Create getters for read-only attributes
    for (i = 0; i < readOnly.length; i++) {
        createGetter(readOnly[i]);
    }
})();

/* Flash Support Testing -------------------------------------------------------- */

advjs.Flash.isSupported = function(){
    return advjs.Flash.version()[0] >= 10;
    // return swfobject.hasFlashPlayerVersion('10');
};

// Add Source Handler pattern functions to this tech
advjs.MediaTechController.withSourceHandlers(advjs.Flash);

/**
 * The default native source handler.
 * This simply passes the source to the video element. Nothing fancy.
 * @param  {Object} source   The source object
 * @param  {advjs.Flash} tech  The instance of the Flash tech
 */
advjs.Flash['nativeSourceHandler'] = {};

/**
 * Check Flash can handle the source natively
 * @param  {Object} source  The source object
 * @return {String}         'probably', 'maybe', or '' (empty string)
 */
advjs.Flash['nativeSourceHandler']['canHandleSource'] = function(source){
    var type;

    if (!source.type) {
        return '';
    }

    // Strip code information from the type because we don't get that specific
    type = source.type.replace(/;.*/,'').toLowerCase();

    if (type in advjs.Flash.formats) {
        return 'maybe';
    }

    return '';
};

/**
 * Pass the source to the flash object
 * Adaptive source handlers will have more complicated workflows before passing
 * video data to the video element
 * @param  {Object} source    The source object
 * @param  {advjs.Flash} tech   The instance of the Flash tech
 */
advjs.Flash['nativeSourceHandler']['handleSource'] = function(source, tech){
    tech.setSrc(source.src);
};

/**
 * Clean up the source handler when disposing the player or switching sources..
 * (no cleanup is needed when supporting the format natively)
 */
advjs.Flash['nativeSourceHandler']['dispose'] = function(){};

// Register the native source handler
advjs.Flash['registerSourceHandler'](advjs.Flash['nativeSourceHandler']);

advjs.Flash.formats = {
    'video/flv': 'FLV',
    'video/x-flv': 'FLV',
    'video/mp4': 'MP4',
    'video/m4v': 'MP4'
};

advjs.Flash['onReady'] = function(currSwf){
    var el, player;

    el = advjs.el(currSwf);

    // get player from the player div property
    player = el && el.parentNode && el.parentNode['player'];

    // if there is no el or player then the tech has been disposed
    // and the tech element was removed from the player div
    if (player) {
        // reference player on tech element
        el['player'] = player;
        // check that the flash object is really ready
        advjs.Flash['checkReady'](player.tech);
    }
};

// The SWF isn't always ready when it says it is. Sometimes the API functions still need to be added to the object.
// If it's not ready, we set a timeout to check again shortly.
advjs.Flash['checkReady'] = function(tech){
    // stop worrying if the tech has been disposed
    if (!tech.el()) {
        return;
    }

    // check if API property exists
    if (tech.el().vjs_getProperty) {
        // tell tech it's ready
        tech.triggerReady();
    } else {
        // wait longer
        this.setTimeout(function(){
            advjs.Flash['checkReady'](tech);
        }, 50);
    }
};

// Trigger events from the swf on the player
advjs.Flash['onEvent'] = function(swfID, eventName){
    var player = advjs.el(swfID)['player'];
    player.trigger(eventName);
};

// Log errors from the swf
advjs.Flash['onError'] = function(swfID, err){
    var player = advjs.el(swfID)['player'];
    var msg = 'FLASH: '+err;

    if (err == 'srcnotfound') {
        player.error({ code: 4, message: msg });

        // errors we haven't categorized into the media errors
    } else {
        player.error(msg);
    }
};

// Flash Version Check
advjs.Flash.version = function(){
    var version = '0,0,0';

    // IE
    try {
        version = new window.ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version').replace(/\D+/g, ',').match(/^,?(.+),?$/)[1];

        // other browsers
    } catch(e) {
        try {
            if (navigator.mimeTypes['application/x-shockwave-flash'].enabledPlugin){
                version = (navigator.plugins['Shockwave Flash 2.0'] || navigator.plugins['Shockwave Flash']).description.replace(/\D+/g, ',').match(/^,?(.+),?$/)[1];
            }
        } catch(err) {}
    }
    return version.split(',');
};

// Flash embedding method. Only used in non-iframe mode
advjs.Flash.embed = function(swf, placeHolder, flashVars, params, attributes){
    var code = advjs.Flash.getEmbedCode(swf, flashVars, params, attributes),

    // Get element by embedding code and retrieving created element
        obj = advjs.createEl('div', { innerHTML: code }).childNodes[0],

        par = placeHolder.parentNode
        ;

    placeHolder.parentNode.replaceChild(obj, placeHolder);
    obj[advjs.expando] = placeHolder[advjs.expando];

    // IE6 seems to have an issue where it won't initialize the swf object after injecting it.
    // This is a dumb fix
    var newObj = par.childNodes[0];
    setTimeout(function(){
        newObj.style.display = 'block';
    }, 1000);

    return obj;

};

advjs.Flash.getEmbedCode = function(swf, flashVars, params, attributes){

    var objTag = '<object type="application/x-shockwave-flash" ',
        flashVarsString = '',
        paramsString = '',
        attrsString = '';

    // Convert flash vars to string
    if (flashVars) {
        advjs.obj.each(flashVars, function(key, val){
            flashVarsString += (key + '=' + val + '&amp;');
        });
    }

    // Add swf, flashVars, and other default params
    params = advjs.obj.merge({
        'movie': swf,
        'flashvars': flashVarsString,
        'allowScriptAccess': 'always', // Required to talk to swf
        'allowNetworking': 'all' // All should be default, but having security issues.
    }, params);

    // Create param tags string
    advjs.obj.each(params, function(key, val){
        paramsString += '<param name="'+key+'" value="'+val+'" />';
    });

    attributes = advjs.obj.merge({
        // Add swf to attributes (need both for IE and Others to work)
        'data': swf,

        // Default to 100% width/height
        'width': '100%',
        'height': '100%'

    }, attributes);

    // Create Attributes string
    advjs.obj.each(attributes, function(key, val){
        attrsString += (key + '="' + val + '" ');
    });

    return objTag + attrsString + '>' + paramsString + '</object>';
};
advjs.Flash.streamingFormats = {
    'rtmp/mp4': 'MP4',
    'rtmp/flv': 'FLV'
};

advjs.Flash.streamFromParts = function(connection, stream) {
    return connection + '&' + stream;
};

advjs.Flash.streamToParts = function(src) {
    var parts = {
        connection: '',
        stream: ''
    };

    if (! src) {
        return parts;
    }

    // Look for the normal URL separator we expect, '&'.
    // If found, we split the URL into two pieces around the
    // first '&'.
    var connEnd = src.indexOf('&');
    var streamBegin;
    if (connEnd !== -1) {
        streamBegin = connEnd + 1;
    }
    else {
        // If there's not a '&', we use the last '/' as the delimiter.
        connEnd = streamBegin = src.lastIndexOf('/') + 1;
        if (connEnd === 0) {
            // really, there's not a '/'?
            connEnd = streamBegin = src.length;
        }
    }
    parts.connection = src.substring(0, connEnd);
    parts.stream = src.substring(streamBegin, src.length);

    return parts;
};

advjs.Flash.isStreamingType = function(srcType) {
    return srcType in advjs.Flash.streamingFormats;
};

// RTMP has four variations, any string starting
// with one of these protocols should be valid
advjs.Flash.RTMP_RE = /^rtmp[set]?:\/\//i;

advjs.Flash.isStreamingSrc = function(src) {
    return advjs.Flash.RTMP_RE.test(src);
};

/**
 * A source handler for RTMP urls
 * @type {Object}
 */
advjs.Flash.rtmpSourceHandler = {};

/**
 * Check Flash can handle the source natively
 * @param  {Object} source  The source object
 * @return {String}         'probably', 'maybe', or '' (empty string)
 */
advjs.Flash.rtmpSourceHandler['canHandleSource'] = function(source){
    if (advjs.Flash.isStreamingType(source.type) || advjs.Flash.isStreamingSrc(source.src)) {
        return 'maybe';
    }

    return '';
};

/**
 * Pass the source to the flash object
 * Adaptive source handlers will have more complicated workflows before passing
 * video data to the video element
 * @param  {Object} source    The source object
 * @param  {advjs.Flash} tech   The instance of the Flash tech
 */
advjs.Flash.rtmpSourceHandler['handleSource'] = function(source, tech){
    var srcParts = advjs.Flash.streamToParts(source.src);

    tech['setRtmpConnection'](srcParts.connection);
    tech['setRtmpStream'](srcParts.stream);
};

// Register the native source handler
advjs.Flash['registerSourceHandler'](advjs.Flash.rtmpSourceHandler);
/**
 * The Media Loader is the component that decides which playback technology to load
 * when the player is initialized.
 *
 * @constructor
 */
advjs.MediaLoader = advjs.Component.extend({
    /** @constructor */
    init: function(player, options, ready){
        advjs.Component.call(this, player, options, ready);

        // If there are no sources when the player is initialized,
        // load the first supported playback technology.
        if (!player.options_['sources'] || player.options_['sources'].length === 0) {
            for (var i=0,j=player.options_['techOrder']; i<j.length; i++) {
                var techName = advjs.capitalize(j[i]),
                    tech = window['advjs'][techName];

                // Check if the browser supports this technology
                if (tech && tech.isSupported()) {
                    player.loadTech(techName);
                    break;
                }
            }
        } else {
            // // Loop through playback technologies (HTML5, Flash) and check for support.
            // // Then load the best source.
            // // A few assumptions here:
            // //   All playback technologies respect preload false.
            player.src(player.options_['sources']);
        }
    }
});
/*
 * https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackmode
 *
 * enum TextTrackMode { "disabled",  "hidden",  "showing" };
 */
advjs.TextTrackMode = {
    'disabled': 'disabled',
    'hidden': 'hidden',
    'showing': 'showing'
};

/*
 * https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackkind
 *
 * enum TextTrackKind { "subtitles",  "captions",  "descriptions",  "chapters",  "metadata" };
 */
advjs.TextTrackKind = {
    'subtitles': 'subtitles',
    'captions': 'captions',
    'descriptions': 'descriptions',
    'chapters': 'chapters',
    'metadata': 'metadata'
};
(function() {
    /*
     * https://html.spec.whatwg.org/multipage/embedded-content.html#texttrack
     *
     * interface TextTrack : EventTarget {
     *   readonly attribute TextTrackKind kind;
     *   readonly attribute DOMString label;
     *   readonly attribute DOMString language;
     *
     *   readonly attribute DOMString id;
     *   readonly attribute DOMString inBandMetadataTrackDispatchType;
     *
     *   attribute TextTrackMode mode;
     *
     *   readonly attribute TextTrackCueList? cues;
     *   readonly attribute TextTrackCueList? activeCues;
     *
     *   void addCue(TextTrackCue cue);
     *   void removeCue(TextTrackCue cue);
     *
     *   attribute EventHandler oncuechange;
     * };
     */

    advjs.TextTrack = function(options) {
        var tt, id, mode, kind, label, language, cues, activeCues, timeupdateHandler, changed, prop;

        options = options || {};

        if (!options['player']) {
            throw new Error('A player was not provided.');
        }

        tt = this;
        if (advjs.IS_IE8) {
            tt = document.createElement('custom');

            for (prop in advjs.TextTrack.prototype) {
                tt[prop] = advjs.TextTrack.prototype[prop];
            }
        }

        tt.player_ = options['player'];

        mode = advjs.TextTrackMode[options['mode']] || 'disabled';
        kind = advjs.TextTrackKind[options['kind']] || 'subtitles';
        label = options['label'] || '';
        language = options['language'] || options['srclang'] || '';
        id = options['id'] || 'vjs_text_track_' + advjs.guid++;

        if (kind === 'metadata' || kind === 'chapters') {
            mode = 'hidden';
        }

        tt.cues_ = [];
        tt.activeCues_ = [];

        cues = new advjs.TextTrackCueList(tt.cues_);
        activeCues = new advjs.TextTrackCueList(tt.activeCues_);

        changed = false;
        timeupdateHandler = advjs.bind(tt, function() {
            this['activeCues'];
            if (changed) {
                this['trigger']('cuechange');
                changed = false;
            }
        });
        if (mode !== 'disabled') {
            tt.player_.on('timeupdate', timeupdateHandler);
        }

        Object.defineProperty(tt, 'kind', {
            get: function() {
                return kind;
            },
            set: Function.prototype
        });

        Object.defineProperty(tt, 'label', {
            get: function() {
                return label;
            },
            set: Function.prototype
        });

        Object.defineProperty(tt, 'language', {
            get: function() {
                return language;
            },
            set: Function.prototype
        });

        Object.defineProperty(tt, 'id', {
            get: function() {
                return id;
            },
            set: Function.prototype
        });

        Object.defineProperty(tt, 'mode', {
            get: function() {
                return mode;
            },
            set: function(newMode) {
                if (!advjs.TextTrackMode[newMode]) {
                    return;
                }
                mode = newMode;
                if (mode === 'showing') {
                    this.player_.on('timeupdate', timeupdateHandler);
                }
                this.trigger('modechange');
            }
        });

        Object.defineProperty(tt, 'cues', {
            get: function() {
                if (!this.loaded_) {
                    return null;
                }

                return cues;
            },
            set: Function.prototype
        });

        Object.defineProperty(tt, 'activeCues', {
            get: function() {
                var i, l, active, ct, cue;

                if (!this.loaded_) {
                    return null;
                }

                if (this['cues'].length === 0) {
                    return activeCues; // nothing to do
                }

                ct = this.player_.currentTime();
                i = 0;
                l = this['cues'].length;
                active = [];

                for (; i < l; i++) {
                    cue = this['cues'][i];
                    if (cue['startTime'] <= ct && cue['endTime'] >= ct) {
                        active.push(cue);
                    } else if (cue['startTime'] === cue['endTime'] && cue['startTime'] <= ct && cue['startTime'] + 0.5 >= ct) {
                        active.push(cue);
                    }
                }

                changed = false;

                if (active.length !== this.activeCues_.length) {
                    changed = true;
                } else {
                    for (i = 0; i < active.length; i++) {
                        if (indexOf.call(this.activeCues_, active[i]) === -1) {
                            changed = true;
                        }
                    }
                }

                this.activeCues_ = active;
                activeCues.setCues_(this.activeCues_);

                return activeCues;
            },
            set: Function.prototype
        });

        if (options.src) {
            loadTrack(options.src, tt);
        } else {
            tt.loaded_ = true;
        }

        if (advjs.IS_IE8) {
            return tt;
        }
    };

    advjs.TextTrack.prototype = advjs.obj.create(advjs.EventEmitter.prototype);
    advjs.TextTrack.prototype.constructor = advjs.TextTrack;

    /*
     * cuechange - One or more cues in the track have become active or stopped being active.
     */
    advjs.TextTrack.prototype.allowedEvents_ = {
        'cuechange': 'cuechange'
    };

    advjs.TextTrack.prototype.addCue = function(cue) {
        var tracks = this.player_.textTracks(),
            i = 0;

        if (tracks) {
            for (; i < tracks.length; i++) {
                if (tracks[i] !== this) {
                    tracks[i].removeCue(cue);
                }
            }
        }

        this.cues_.push(cue);
        this['cues'].setCues_(this.cues_);
    };

    advjs.TextTrack.prototype.removeCue = function(removeCue) {
        var i = 0,
            l = this.cues_.length,
            cue,
            removed = false;

        for (; i < l; i++) {
            cue = this.cues_[i];
            if (cue === removeCue) {
                this.cues_.splice(i, 1);
                removed = true;
            }
        }

        if (removed) {
            this.cues.setCues_(this.cues_);
        }
    };

    /*
     * Downloading stuff happens below this point
     */
    var loadTrack, parseCues, indexOf;

    loadTrack = function(src, track) {
        advjs.xhr(src, advjs.bind(this, function(err, response, responseBody){
            if (err) {
                return advjs.log.error(err);
            }


            track.loaded_ = true;
            parseCues(responseBody, track);
        }));
    };

    parseCues = function(srcContent, track) {
        if (typeof window['WebVTT'] !== 'function') {
            //try again a bit later
            return window.setTimeout(function() {
                parseCues(srcContent, track);
            }, 25);
        }

        var parser = new window['WebVTT']['Parser'](window, window['vttjs'], window['WebVTT']['StringDecoder']());

        parser['oncue'] = function(cue) {
            track.addCue(cue);
        };
        parser['onparsingerror'] = function(error) {
            advjs.log.error(error);
        };

        parser['parse'](srcContent);
        parser['flush']();
    };

    indexOf = function(searchElement, fromIndex) {

        var k;

        if (this == null) {
            throw new TypeError('"this" is null or not defined');
        }

        var O = Object(this);

        var len = O.length >>> 0;

        if (len === 0) {
            return -1;
        }

        var n = +fromIndex || 0;

        if (Math.abs(n) === Infinity) {
            n = 0;
        }

        if (n >= len) {
            return -1;
        }

        k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

        while (k < len) {
            if (k in O && O[k] === searchElement) {
                return k;
            }
            k++;
        }
        return -1;
    };

})();
/*
 * https://html.spec.whatwg.org/multipage/embedded-content.html#texttracklist
 *
 * interface TextTrackList : EventTarget {
 *   readonly attribute unsigned long length;
 *   getter TextTrack (unsigned long index);
 *   TextTrack? getTrackById(DOMString id);
 *
 *   attribute EventHandler onchange;
 *   attribute EventHandler onaddtrack;
 *   attribute EventHandler onremovetrack;
 * };
 */
advjs.TextTrackList = function(tracks) {
    var list = this,
        prop,
        i = 0;

    if (advjs.IS_IE8) {
        list = document.createElement('custom');

        for (prop in advjs.TextTrackList.prototype) {
            list[prop] = advjs.TextTrackList.prototype[prop];
        }
    }

    tracks = tracks || [];
    list.tracks_ = [];

    Object.defineProperty(list, 'length', {
        get: function() {
            return this.tracks_.length;
        }
    });

    for (; i < tracks.length; i++) {
        list.addTrack_(tracks[i]);
    }

    if (advjs.IS_IE8) {
        return list;
    }
};

advjs.TextTrackList.prototype = advjs.obj.create(advjs.EventEmitter.prototype);
advjs.TextTrackList.prototype.constructor = advjs.TextTrackList;

/*
 * change - One or more tracks in the track list have been enabled or disabled.
 * addtrack - A track has been added to the track list.
 * removetrack - A track has been removed from the track list.
 */
advjs.TextTrackList.prototype.allowedEvents_ = {
    'change': 'change',
    'addtrack': 'addtrack',
    'removetrack': 'removetrack'
};

// emulate attribute EventHandler support to allow for feature detection
(function() {
    var event;

    for (event in advjs.TextTrackList.prototype.allowedEvents_) {
        advjs.TextTrackList.prototype['on' + event] = null;
    }
})();

advjs.TextTrackList.prototype.addTrack_ = function(track) {
    var index = this.tracks_.length;
    if (!(''+index in this)) {
        Object.defineProperty(this, index, {
            get: function() {
                return this.tracks_[index];
            }
        });
    }

    track.addEventListener('modechange', advjs.bind(this, function() {
        this.trigger('change');
    }));
    this.tracks_.push(track);

    this.trigger({
        type: 'addtrack',
        track: track
    });
};

advjs.TextTrackList.prototype.removeTrack_ = function(rtrack) {
    var i = 0,
        l = this.length,
        result = null,
        track;

    for (; i < l; i++) {
        track = this[i];
        if (track === rtrack) {
            this.tracks_.splice(i, 1);
            break;
        }
    }

    this.trigger({
        type: 'removetrack',
        track: rtrack
    });
};

advjs.TextTrackList.prototype.getTrackById = function(id) {
    var i = 0,
        l = this.length,
        result = null,
        track;

    for (; i < l; i++) {
        track = this[i];
        if (track.id === id) {
            result = track;
            break;
        }
    }

    return result;
};
/*
 * https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackcuelist
 *
 * interface TextTrackCueList {
 *   readonly attribute unsigned long length;
 *   getter TextTrackCue (unsigned long index);
 *   TextTrackCue? getCueById(DOMString id);
 * };
 */

advjs.TextTrackCueList = function(cues) {
    var list = this,
        prop;

    if (advjs.IS_IE8) {
        list = document.createElement('custom');

        for (prop in advjs.TextTrackCueList.prototype) {
            list[prop] = advjs.TextTrackCueList.prototype[prop];
        }
    }

    advjs.TextTrackCueList.prototype.setCues_.call(list, cues);

    Object.defineProperty(list, 'length', {
        get: function() {
            return this.length_;
        }
    });

    if (advjs.IS_IE8) {
        return list;
    }
};

advjs.TextTrackCueList.prototype.setCues_ = function(cues) {
    var oldLength = this.length || 0,
        i = 0,
        l = cues.length,
        defineProp;

    this.cues_ = cues;
    this.length_ = cues.length;

    defineProp = function(i) {
        if (!(''+i in this)) {
            Object.defineProperty(this, '' + i, {
                get: function() {
                    return this.cues_[i];
                }
            });
        }
    };

    if (oldLength < l) {
        i = oldLength;
        for(; i < l; i++) {
            defineProp.call(this, i);
        }
    }
};

advjs.TextTrackCueList.prototype.getCueById = function(id) {
    var i = 0,
        l = this.length,
        result = null,
        cue;

    for (; i < l; i++) {
        cue = this[i];
        if (cue.id === id) {
            result = cue;
            break;
        }
    }

    return result;
};
(function() {
    'use strict';

    /* Text Track Display
     ============================================================================= */
// Global container for both subtitle and captions text. Simple div container.

    /**
     * The component for displaying text track cues
     *
     * @constructor
     */
    advjs.TextTrackDisplay = advjs.Component.extend({
        /** @constructor */
        init: function(player, options, ready){
            advjs.Component.call(this, player, options, ready);

            player.on('loadstart', advjs.bind(this, this.toggleDisplay));

            // This used to be called during player init, but was causing an error
            // if a track should show by default and the display hadn't loaded yet.
            // Should probably be moved to an external track loader when we support
            // tracks that don't need a display.
            player.ready(advjs.bind(this, function() {
                if (player.tech && player.tech['featuresNativeTextTracks']) {
                    this.hide();
                    return;
                }

                var i, tracks, track;

                player.on('fullscreenchange', advjs.bind(this, this.updateDisplay));

                tracks = player.options_['tracks'] || [];
                for (i = 0; i < tracks.length; i++) {
                    track = tracks[i];
                    this.player_.addRemoteTextTrack(track);
                }
            }));
        }
    });

    advjs.TextTrackDisplay.prototype.toggleDisplay = function() {
        if (this.player_.tech && this.player_.tech['featuresNativeTextTracks']) {
            this.hide();
        } else {
            this.show();
        }
    };

    advjs.TextTrackDisplay.prototype.createEl = function(){
        return advjs.Component.prototype.createEl.call(this, 'div', {
            className: 'advjs-text-track-display'
        });
    };

    advjs.TextTrackDisplay.prototype.clearDisplay = function() {
        if (typeof window['WebVTT'] === 'function') {
            window['WebVTT']['processCues'](window, [], this.el_);
        }
    };

// Add cue HTML to display
    var constructColor = function(color, opacity) {
        return 'rgba(' +
            // color looks like "#f0e"
            parseInt(color[1] + color[1], 16) + ',' +
            parseInt(color[2] + color[2], 16) + ',' +
            parseInt(color[3] + color[3], 16) + ',' +
            opacity + ')';
    };
    var darkGray = '#222';
    var lightGray = '#ccc';
    var fontMap = {
        monospace:             'monospace',
        sansSerif:             'sans-serif',
        serif:                 'serif',
        monospaceSansSerif:    '"Andale Mono", "Lucida Console", monospace',
        monospaceSerif:        '"Courier New", monospace',
        proportionalSansSerif: 'sans-serif',
        proportionalSerif:     'serif',
        casual:                '"Comic Sans MS", Impact, fantasy',
        script:                '"Monotype Corsiva", cursive',
        smallcaps:             '"Andale Mono", "Lucida Console", monospace, sans-serif'
    };
    var tryUpdateStyle = function(el, style, rule) {
        // some style changes will throw an error, particularly in IE8. Those should be noops.
        try {
            el.style[style] = rule;
        } catch (e) {}
    };

    advjs.TextTrackDisplay.prototype.updateDisplay = function() {
        var tracks = this.player_.textTracks(),
            i = 0,
            track;

        this.clearDisplay();

        if (!tracks) {
            return;
        }

        for (; i < tracks.length; i++) {
            track = tracks[i];
            if (track['mode'] === 'showing') {
                this.updateForTrack(track);
            }
        }
    };

    advjs.TextTrackDisplay.prototype.updateForTrack = function(track) {
        if (typeof window['WebVTT'] !== 'function' || !track['activeCues']) {
            return;
        }

        var i = 0,
            property,
            cueDiv,
            overrides = this.player_['textTrackSettings'].getValues(),
            fontSize,
            cues = [];

        for (; i < track['activeCues'].length; i++) {
            cues.push(track['activeCues'][i]);
        }

        window['WebVTT']['processCues'](window, track['activeCues'], this.el_);

        i = cues.length;
        while (i--) {
            cueDiv = cues[i].displayState;
            if (overrides.color) {
                cueDiv.firstChild.style.color = overrides.color;
            }
            if (overrides.textOpacity) {
                tryUpdateStyle(cueDiv.firstChild,
                    'color',
                    constructColor(overrides.color || '#fff',
                        overrides.textOpacity));
            }
            if (overrides.backgroundColor) {
                cueDiv.firstChild.style.backgroundColor = overrides.backgroundColor;
            }
            if (overrides.backgroundOpacity) {
                tryUpdateStyle(cueDiv.firstChild,
                    'backgroundColor',
                    constructColor(overrides.backgroundColor || '#000',
                        overrides.backgroundOpacity));
            }
            if (overrides.windowColor) {
                if (overrides.windowOpacity) {
                    tryUpdateStyle(cueDiv,
                        'backgroundColor',
                        constructColor(overrides.windowColor, overrides.windowOpacity));
                } else {
                    cueDiv.style.backgroundColor = overrides.windowColor;
                }
            }
            if (overrides.edgeStyle) {
                if (overrides.edgeStyle === 'dropshadow') {
                    cueDiv.firstChild.style.textShadow = '2px 2px 3px ' + darkGray + ', 2px 2px 4px ' + darkGray + ', 2px 2px 5px ' + darkGray;
                } else if (overrides.edgeStyle === 'raised') {
                    cueDiv.firstChild.style.textShadow = '1px 1px ' + darkGray + ', 2px 2px ' + darkGray + ', 3px 3px ' + darkGray;
                } else if (overrides.edgeStyle === 'depressed') {
                    cueDiv.firstChild.style.textShadow = '1px 1px ' + lightGray + ', 0 1px ' + lightGray + ', -1px -1px ' + darkGray + ', 0 -1px ' + darkGray;
                } else if (overrides.edgeStyle === 'uniform') {
                    cueDiv.firstChild.style.textShadow = '0 0 4px ' + darkGray + ', 0 0 4px ' + darkGray + ', 0 0 4px ' + darkGray + ', 0 0 4px ' + darkGray;
                }
            }
            if (overrides.fontPercent && overrides.fontPercent !== 1) {
                fontSize = window.parseFloat(cueDiv.style.fontSize);
                cueDiv.style.fontSize = (fontSize * overrides.fontPercent) + 'px';
                cueDiv.style.height = 'auto';
                cueDiv.style.top = 'auto';
                cueDiv.style.bottom = '2px';
            }
            if (overrides.fontFamily && overrides.fontFamily !== 'default') {
                if (overrides.fontFamily === 'small-caps') {
                    cueDiv.firstChild.style.fontVariant = 'small-caps';
                } else {
                    cueDiv.firstChild.style.fontFamily = fontMap[overrides.fontFamily];
                }
            }
        }
    };


    /**
     * The specific menu item type for selecting a language within a text track kind
     *
     * @constructor
     */
    advjs.TextTrackMenuItem = advjs.MenuItem.extend({
        /** @constructor */
        init: function(player, options){
            var track = this.track = options['track'],
                tracks = player.textTracks(),
                changeHandler,
                event;

            if (tracks) {
                changeHandler = advjs.bind(this, function() {
                    var selected = this.track['mode'] === 'showing',
                        track,
                        i,
                        l;

                    if (this instanceof advjs.OffTextTrackMenuItem) {
                        selected = true;

                        i = 0,
                            l = tracks.length;

                        for (; i < l; i++) {
                            track = tracks[i];
                            if (track['kind'] === this.track['kind'] && track['mode'] === 'showing') {
                                selected = false;
                                break;
                            }
                        }
                    }

                    this.selected(selected);
                });
                tracks.addEventListener('change', changeHandler);
                player.on('dispose', function() {
                    tracks.removeEventListener('change', changeHandler);
                });
            }

            // Modify options for parent MenuItem class's init.
            options['label'] = track['label'] || track['language'] || 'Unknown';
            options['selected'] = track['default'] || track['mode'] === 'showing';
            advjs.MenuItem.call(this, player, options);

            // iOS7 doesn't dispatch change events to TextTrackLists when an
            // associated track's mode changes. Without something like
            // Object.observe() (also not present on iOS7), it's not
            // possible to detect changes to the mode attribute and polyfill
            // the change event. As a poor substitute, we manually dispatch
            // change events whenever the controls modify the mode.
            if (tracks && tracks.onchange === undefined) {
                this.on(['tap', 'click'], function() {
                    if (typeof window.Event !== 'object') {
                        // Android 2.3 throws an Illegal Constructor error for window.Event
                        try {
                            event = new window.Event('change');
                        } catch(err){}
                    }

                    if (!event) {
                        event = document.createEvent('Event');
                        event.initEvent('change', true, true);
                    }

                    tracks.dispatchEvent(event);
                });
            }
        }
    });

    advjs.TextTrackMenuItem.prototype.onClick = function(){
        var kind = this.track['kind'],
            tracks = this.player_.textTracks(),
            mode,
            track,
            i = 0;

        advjs.MenuItem.prototype.onClick.call(this);

        if (!tracks) {
            return;
        }

        for (; i < tracks.length; i++) {
            track = tracks[i];

            if (track['kind'] !== kind) {
                continue;
            }

            if (track === this.track) {
                track['mode'] = 'showing';
            } else {
                track['mode'] = 'disabled';
            }
        }
    };

    /**
     * A special menu item for turning of a specific type of text track
     *
     * @constructor
     */
    advjs.OffTextTrackMenuItem = advjs.TextTrackMenuItem.extend({
        /** @constructor */
        init: function(player, options){
            // Create pseudo track info
            // Requires options['kind']
            options['track'] = {
                'kind': options['kind'],
                'player': player,
                'label': options['kind'] + ' off',
                'default': false,
                'mode': 'disabled'
            };
            advjs.TextTrackMenuItem.call(this, player, options);
            this.selected(true);
        }
    });

    advjs.CaptionSettingsMenuItem = advjs.TextTrackMenuItem.extend({
        init: function(player, options) {
            options['track'] = {
                'kind': options['kind'],
                'player': player,
                'label': options['kind'] + ' settings',
                'default': false,
                mode: 'disabled'
            };

            advjs.TextTrackMenuItem.call(this, player, options);
            this.addClass('advjs-texttrack-settings');
        }
    });

    advjs.CaptionSettingsMenuItem.prototype.onClick = function() {
        this.player().getChild('textTrackSettings').show();
    };

    /**
     * The base class for buttons that toggle specific text track types (e.g. subtitles)
     *
     * @constructor
     */
    advjs.TextTrackButton = advjs.MenuButton.extend({
        /** @constructor */
        init: function(player, options){
            var tracks, updateHandler;

            advjs.MenuButton.call(this, player, options);

            tracks = this.player_.textTracks();

            if (this.items.length <= 1) {
                this.hide();
            }

            if (!tracks) {
                return;
            }

            updateHandler = advjs.bind(this, this.update);
            tracks.addEventListener('removetrack', updateHandler);
            tracks.addEventListener('addtrack', updateHandler);

            this.player_.on('dispose', function() {
                tracks.removeEventListener('removetrack', updateHandler);
                tracks.removeEventListener('addtrack', updateHandler);
            });
        }
    });

// Create a menu item for each text track
    advjs.TextTrackButton.prototype.createItems = function(){
        var items = [], track, tracks;

        if (this instanceof advjs.CaptionsButton && !(this.player().tech && this.player().tech['featuresNativeTextTracks'])) {
            items.push(new advjs.CaptionSettingsMenuItem(this.player_, { 'kind': this.kind_ }));
        }

        // Add an OFF menu item to turn all tracks off
        items.push(new advjs.OffTextTrackMenuItem(this.player_, { 'kind': this.kind_ }));

        tracks = this.player_.textTracks();

        if (!tracks) {
            return items;
        }

        for (var i = 0; i < tracks.length; i++) {
            track = tracks[i];

            // only add tracks that are of the appropriate kind and have a label
            if (track['kind'] === this.kind_) {
                items.push(new advjs.TextTrackMenuItem(this.player_, {
                    'track': track
                }));
            }
        }

        return items;
    };

    /**
     * The button component for toggling and selecting captions
     *
     * @constructor
     */
    advjs.CaptionsButton = advjs.TextTrackButton.extend({
        /** @constructor */
        init: function(player, options, ready){
            advjs.TextTrackButton.call(this, player, options, ready);
            this.el_.setAttribute('aria-label','Captions Menu');
        }
    });
    advjs.CaptionsButton.prototype.kind_ = 'captions';
    advjs.CaptionsButton.prototype.buttonText = 'Captions';
    advjs.CaptionsButton.prototype.className = 'advjs-captions-button';

    advjs.CaptionsButton.prototype.update = function() {
        var threshold = 2;
        advjs.TextTrackButton.prototype.update.call(this);

        // if native, then threshold is 1 because no settings button
        if (this.player().tech && this.player().tech['featuresNativeTextTracks']) {
            threshold = 1;
        }

        if (this.items && this.items.length > threshold) {
            this.show();
        } else {
            this.hide();
        }
    };

    /**
     * The button component for toggling and selecting subtitles
     *
     * @constructor
     */
    advjs.SubtitlesButton = advjs.TextTrackButton.extend({
        /** @constructor */
        init: function(player, options, ready){
            advjs.TextTrackButton.call(this, player, options, ready);
            this.el_.setAttribute('aria-label','Subtitles Menu');
        }
    });
    advjs.SubtitlesButton.prototype.kind_ = 'subtitles';
    advjs.SubtitlesButton.prototype.buttonText = 'Subtitles';
    advjs.SubtitlesButton.prototype.className = 'advjs-subtitles-button';

// Chapters act much differently than other text tracks
// Cues are navigation vs. other tracks of alternative languages
    /**
     * The button component for toggling and selecting chapters
     *
     * @constructor
     */
    advjs.ChaptersButton = advjs.TextTrackButton.extend({
        /** @constructor */
        init: function(player, options, ready){
            advjs.TextTrackButton.call(this, player, options, ready);
            this.el_.setAttribute('aria-label','Chapters Menu');
        }
    });
    advjs.ChaptersButton.prototype.kind_ = 'chapters';
    advjs.ChaptersButton.prototype.buttonText = 'Chapters';
    advjs.ChaptersButton.prototype.className = 'advjs-chapters-button';

// Create a menu item for each text track
    advjs.ChaptersButton.prototype.createItems = function(){
        var items = [], track, tracks;

        tracks = this.player_.textTracks();

        if (!tracks) {
            return items;
        }

        for (var i = 0; i < tracks.length; i++) {
            track = tracks[i];
            if (track['kind'] === this.kind_) {
                items.push(new advjs.TextTrackMenuItem(this.player_, {
                    'track': track
                }));
            }
        }

        return items;
    };

    advjs.ChaptersButton.prototype.createMenu = function(){
        var tracks = this.player_.textTracks() || [],
            i = 0,
            l = tracks.length,
            track, chaptersTrack,
            items = this.items = [];

        for (; i < l; i++) {
            track = tracks[i];
            if (track['kind'] == this.kind_) {
                if (!track.cues) {
                    track['mode'] = 'hidden';
                    /* jshint loopfunc:true */
                    // TODO see if we can figure out a better way of doing this https://github.com/advjs/video.js/issues/1864
                    window.setTimeout(advjs.bind(this, function() {
                        this.createMenu();
                    }), 100);
                    /* jshint loopfunc:false */
                } else {
                    chaptersTrack = track;
                    break;
                }
            }
        }

        var menu = this.menu;
        if (menu === undefined) {
            menu = new advjs.Menu(this.player_);
            menu.contentEl().appendChild(advjs.createEl('li', {
                className: 'advjs-menu-title',
                innerHTML: advjs.capitalize(this.kind_),
                tabindex: -1
            }));
        }

        if (chaptersTrack) {
            var cues = chaptersTrack['cues'], cue, mi;
            i = 0;
            l = cues.length;

            for (; i < l; i++) {
                cue = cues[i];

                mi = new advjs.ChaptersTrackMenuItem(this.player_, {
                    'track': chaptersTrack,
                    'cue': cue
                });

                items.push(mi);

                menu.addChild(mi);
            }
            this.addChild(menu);
        }

        if (this.items.length > 0) {
            this.show();
        }

        return menu;
    };


    /**
     * @constructor
     */
    advjs.ChaptersTrackMenuItem = advjs.MenuItem.extend({
        /** @constructor */
        init: function(player, options){
            var track = this.track = options['track'],
                cue = this.cue = options['cue'],
                currentTime = player.currentTime();

            // Modify options for parent MenuItem class's init.
            options['label'] = cue.text;
            options['selected'] = (cue['startTime'] <= currentTime && currentTime < cue['endTime']);
            advjs.MenuItem.call(this, player, options);

            track.addEventListener('cuechange', advjs.bind(this, this.update));
        }
    });

    advjs.ChaptersTrackMenuItem.prototype.onClick = function(){
        advjs.MenuItem.prototype.onClick.call(this);
        this.player_.currentTime(this.cue.startTime);
        this.update(this.cue.startTime);
    };

    advjs.ChaptersTrackMenuItem.prototype.update = function(){
        var cue = this.cue,
            currentTime = this.player_.currentTime();

        // advjs.log(currentTime, cue.startTime);
        this.selected(cue['startTime'] <= currentTime && currentTime < cue['endTime']);
    };
})();
(function() {
    'use strict';

    advjs.TextTrackSettings = advjs.Component.extend({
        init: function(player, options) {
            advjs.Component.call(this, player, options);
            this.hide();

            advjs.on(this.el().querySelector('.advjs-done-button'), 'click', advjs.bind(this, function() {
                this.saveSettings();
                this.hide();
            }));

            advjs.on(this.el().querySelector('.advjs-default-button'), 'click', advjs.bind(this, function() {
                this.el().querySelector('.advjs-fg-color > select').selectedIndex = 0;
                this.el().querySelector('.advjs-bg-color > select').selectedIndex = 0;
                this.el().querySelector('.window-color > select').selectedIndex = 0;
                this.el().querySelector('.advjs-text-opacity > select').selectedIndex = 0;
                this.el().querySelector('.advjs-bg-opacity > select').selectedIndex = 0;
                this.el().querySelector('.advjs-window-opacity > select').selectedIndex = 0;
                this.el().querySelector('.advjs-edge-style select').selectedIndex = 0;
                this.el().querySelector('.advjs-font-family select').selectedIndex = 0;
                this.el().querySelector('.advjs-font-percent select').selectedIndex = 2;
                this.updateDisplay();
            }));

            advjs.on(this.el().querySelector('.advjs-fg-color > select'), 'change', advjs.bind(this, this.updateDisplay));
            advjs.on(this.el().querySelector('.advjs-bg-color > select'), 'change', advjs.bind(this, this.updateDisplay));
            advjs.on(this.el().querySelector('.window-color > select'), 'change', advjs.bind(this, this.updateDisplay));
            advjs.on(this.el().querySelector('.advjs-text-opacity > select'), 'change', advjs.bind(this, this.updateDisplay));
            advjs.on(this.el().querySelector('.advjs-bg-opacity > select'), 'change', advjs.bind(this, this.updateDisplay));
            advjs.on(this.el().querySelector('.advjs-window-opacity > select'), 'change', advjs.bind(this, this.updateDisplay));
            advjs.on(this.el().querySelector('.advjs-font-percent select'), 'change', advjs.bind(this, this.updateDisplay));
            advjs.on(this.el().querySelector('.advjs-edge-style select'), 'change', advjs.bind(this, this.updateDisplay));
            advjs.on(this.el().querySelector('.advjs-font-family select'), 'change', advjs.bind(this, this.updateDisplay));

            if (player.options()['persistTextTrackSettings']) {
                this.restoreSettings();
            }
        }
    });

    advjs.TextTrackSettings.prototype.createEl = function() {
        return advjs.Component.prototype.createEl.call(this, 'div', {
            className: 'advjs-caption-settings advjs-modal-overlay',
            innerHTML: captionOptionsMenuTemplate()
        });
    };

    advjs.TextTrackSettings.prototype.getValues = function() {
        var el, bgOpacity, textOpacity, windowOpacity, textEdge, fontFamily, fgColor, bgColor, windowColor, result, name, fontPercent;

        el = this.el();

        textEdge = getSelectedOptionValue(el.querySelector('.advjs-edge-style select'));
        fontFamily = getSelectedOptionValue(el.querySelector('.advjs-font-family select'));
        fgColor = getSelectedOptionValue(el.querySelector('.advjs-fg-color > select'));
        textOpacity = getSelectedOptionValue(el.querySelector('.advjs-text-opacity > select'));
        bgColor = getSelectedOptionValue(el.querySelector('.advjs-bg-color > select'));
        bgOpacity = getSelectedOptionValue(el.querySelector('.advjs-bg-opacity > select'));
        windowColor = getSelectedOptionValue(el.querySelector('.window-color > select'));
        windowOpacity = getSelectedOptionValue(el.querySelector('.advjs-window-opacity > select'));
        fontPercent = window['parseFloat'](getSelectedOptionValue(el.querySelector('.advjs-font-percent > select')));

        result = {
            'backgroundOpacity': bgOpacity,
            'textOpacity': textOpacity,
            'windowOpacity': windowOpacity,
            'edgeStyle': textEdge,
            'fontFamily': fontFamily,
            'color': fgColor,
            'backgroundColor': bgColor,
            'windowColor': windowColor,
            'fontPercent': fontPercent
        };
        for (name in result) {
            if (result[name] === '' || result[name] === 'none' || (name === 'fontPercent' && result[name] === 1.00)) {
                delete result[name];
            }
        }
        return result;
    };

    advjs.TextTrackSettings.prototype.setValues = function(values) {
        var el = this.el(), fontPercent;

        setSelectedOption(el.querySelector('.advjs-edge-style select'), values.edgeStyle);
        setSelectedOption(el.querySelector('.advjs-font-family select'), values.fontFamily);
        setSelectedOption(el.querySelector('.advjs-fg-color > select'), values.color);
        setSelectedOption(el.querySelector('.advjs-text-opacity > select'), values.textOpacity);
        setSelectedOption(el.querySelector('.advjs-bg-color > select'), values.backgroundColor);
        setSelectedOption(el.querySelector('.advjs-bg-opacity > select'), values.backgroundOpacity);
        setSelectedOption(el.querySelector('.window-color > select'), values.windowColor);
        setSelectedOption(el.querySelector('.advjs-window-opacity > select'), values.windowOpacity);

        fontPercent = values.fontPercent;

        if (fontPercent) {
            fontPercent = fontPercent.toFixed(2);
        }

        setSelectedOption(el.querySelector('.advjs-font-percent > select'), fontPercent);
    };

    advjs.TextTrackSettings.prototype.restoreSettings = function() {
        var values;
        try {
            values = JSON.parse(window.localStorage.getItem('advjs-text-track-settings'));
        } catch (e) {}

        if (values) {
            this.setValues(values);
        }
    };

    advjs.TextTrackSettings.prototype.saveSettings = function() {
        var values;

        if (!this.player_.options()['persistTextTrackSettings']) {
            return;
        }

        values = this.getValues();
        try {
            if (!advjs.isEmpty(values)) {
                window.localStorage.setItem('advjs-text-track-settings', JSON.stringify(values));
            } else {
                window.localStorage.removeItem('advjs-text-track-settings');
            }
        } catch (e) {}
    };

    advjs.TextTrackSettings.prototype.updateDisplay = function() {
        var ttDisplay = this.player_.getChild('textTrackDisplay');
        if (ttDisplay) {
            ttDisplay.updateDisplay();
        }
    };

    function getSelectedOptionValue(target) {
        var selectedOption;
        // not all browsers support selectedOptions, so, fallback to options
        if (target.selectedOptions) {
            selectedOption = target.selectedOptions[0];
        } else if (target.options) {
            selectedOption = target.options[target.options.selectedIndex];
        }

        return selectedOption.value;
    }

    function setSelectedOption(target, value) {
        var i, option;

        if (!value) {
            return;
        }

        for (i = 0; i < target.options.length; i++) {
            option = target.options[i];
            if (option.value === value) {
                break;
            }
        }

        target.selectedIndex = i;
    }

    function captionOptionsMenuTemplate() {
        return '<div class="advjs-tracksettings">' +
            '<div class="advjs-tracksettings-colors">' +
            '<div class="advjs-fg-color advjs-tracksetting">' +
            '<label class="advjs-label">Foreground</label>' +
            '<select>' +
            '<option value="">---</option>' +
            '<option value="#FFF">White</option>' +
            '<option value="#000">Black</option>' +
            '<option value="#F00">Red</option>' +
            '<option value="#0F0">Green</option>' +
            '<option value="#00F">Blue</option>' +
            '<option value="#FF0">Yellow</option>' +
            '<option value="#F0F">Magenta</option>' +
            '<option value="#0FF">Cyan</option>' +
            '</select>' +
            '<span class="advjs-text-opacity advjs-opacity">' +
            '<select>' +
            '<option value="">---</option>' +
            '<option value="1">Opaque</option>' +
            '<option value="0.5">Semi-Opaque</option>' +
            '</select>' +
            '</span>' +
            '</div>' + // advjs-fg-color
            '<div class="advjs-bg-color advjs-tracksetting">' +
            '<label class="advjs-label">Background</label>' +
            '<select>' +
            '<option value="">---</option>' +
            '<option value="#FFF">White</option>' +
            '<option value="#000">Black</option>' +
            '<option value="#F00">Red</option>' +
            '<option value="#0F0">Green</option>' +
            '<option value="#00F">Blue</option>' +
            '<option value="#FF0">Yellow</option>' +
            '<option value="#F0F">Magenta</option>' +
            '<option value="#0FF">Cyan</option>' +
            '</select>' +
            '<span class="advjs-bg-opacity advjs-opacity">' +
            '<select>' +
            '<option value="">---</option>' +
            '<option value="1">Opaque</option>' +
            '<option value="0.5">Semi-Transparent</option>' +
            '<option value="0">Transparent</option>' +
            '</select>' +
            '</span>' +
            '</div>' + // advjs-bg-color
            '<div class="window-color advjs-tracksetting">' +
            '<label class="advjs-label">Window</label>' +
            '<select>' +
            '<option value="">---</option>' +
            '<option value="#FFF">White</option>' +
            '<option value="#000">Black</option>' +
            '<option value="#F00">Red</option>' +
            '<option value="#0F0">Green</option>' +
            '<option value="#00F">Blue</option>' +
            '<option value="#FF0">Yellow</option>' +
            '<option value="#F0F">Magenta</option>' +
            '<option value="#0FF">Cyan</option>' +
            '</select>' +
            '<span class="advjs-window-opacity advjs-opacity">' +
            '<select>' +
            '<option value="">---</option>' +
            '<option value="1">Opaque</option>' +
            '<option value="0.5">Semi-Transparent</option>' +
            '<option value="0">Transparent</option>' +
            '</select>' +
            '</span>' +
            '</div>' + // advjs-window-color
            '</div>' + // advjs-tracksettings
            '<div class="advjs-tracksettings-font">' +
            '<div class="advjs-font-percent advjs-tracksetting">' +
            '<label class="advjs-label">Font Size</label>' +
            '<select>' +
            '<option value="0.50">50%</option>' +
            '<option value="0.75">75%</option>' +
            '<option value="1.00" selected>100%</option>' +
            '<option value="1.25">125%</option>' +
            '<option value="1.50">150%</option>' +
            '<option value="1.75">175%</option>' +
            '<option value="2.00">200%</option>' +
            '<option value="3.00">300%</option>' +
            '<option value="4.00">400%</option>' +
            '</select>' +
            '</div>' + // advjs-font-percent
            '<div class="advjs-edge-style advjs-tracksetting">' +
            '<label class="advjs-label">Text Edge Style</label>' +
            '<select>' +
            '<option value="none">None</option>' +
            '<option value="raised">Raised</option>' +
            '<option value="depressed">Depressed</option>' +
            '<option value="uniform">Uniform</option>' +
            '<option value="dropshadow">Dropshadow</option>' +
            '</select>' +
            '</div>' + // advjs-edge-style
            '<div class="advjs-font-family advjs-tracksetting">' +
            '<label class="advjs-label">Font Family</label>' +
            '<select>' +
            '<option value="">Default</option>' +
            '<option value="monospaceSerif">Monospace Serif</option>' +
            '<option value="proportionalSerif">Proportional Serif</option>' +
            '<option value="monospaceSansSerif">Monospace Sans-Serif</option>' +
            '<option value="proportionalSansSerif">Proportional Sans-Serif</option>' +
            '<option value="casual">Casual</option>' +
            '<option value="script">Script</option>' +
            '<option value="small-caps">Small Caps</option>' +
            '</select>' +
            '</div>' + // advjs-font-family
            '</div>' +
            '</div>' +
            '<div class="advjs-tracksettings-controls">' +
            '<button class="advjs-default-button">Defaults</button>' +
            '<button class="advjs-done-button">Done</button>' +
            '</div>';
    }

})();
/**
 * @fileoverview Add JSON support
 * @suppress {undefinedVars}
 * (Compiler doesn't like JSON not being declared)
 */

/**
 * Javascript JSON implementation
 * (Parse Method Only)
 * https://github.com/douglascrockford/JSON-js/blob/master/json2.js
 * Only using for parse method when parsing data-setup attribute JSON.
 * @suppress {undefinedVars}
 * @namespace
 * @private
 */
advjs.JSON;

if (typeof window.JSON !== 'undefined' && typeof window.JSON.parse === 'function') {
    advjs.JSON = window.JSON;

} else {
    advjs.JSON = {};

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

    /**
     * parse the json
     *
     * @memberof advjs.JSON
     * @param {String} text The JSON string to parse
     * @param {Function=} [reviver] Optional function that can transform the results
     * @return {Object|Array} The parsed JSON
     */
    advjs.JSON.parse = function (text, reviver) {
        var j;

        function walk(holder, key) {
            var k, v, value = holder[key];
            if (value && typeof value === 'object') {
                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = walk(value, k);
                        if (v !== undefined) {
                            value[k] = v;
                        } else {
                            delete value[k];
                        }
                    }
                }
            }
            return reviver.call(holder, key, value);
        }
        text = String(text);
        cx.lastIndex = 0;
        if (cx.test(text)) {
            text = text.replace(cx, function (a) {
                return '\\u' +
                    ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            });
        }

        if (/^[\],:{}\s]*$/
            .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

            j = eval('(' + text + ')');

            return typeof reviver === 'function' ?
                walk({'': j}, '') : j;
        }

        throw new SyntaxError('JSON.parse(): invalid or malformed JSON data');
    };
}
/**
 * @fileoverview Functions for automatically setting up a player
 * based on the data-setup attribute of the video tag
 */

// Automatically set up any tags that have a data-setup attribute
advjs.autoSetup = function(){
    var options, mediaEl, player, i, e;

    // One day, when we stop supporting IE8, go back to this, but in the meantime...*hack hack hack*
    // var vids = Array.prototype.slice.call(document.getElementsByTagName('video'));
    // var audios = Array.prototype.slice.call(document.getElementsByTagName('audio'));
    // var mediaEls = vids.concat(audios);

    // Because IE8 doesn't support calling slice on a node list, we need to loop through each list of elements
    // to build up a new, combined list of elements.
    var vids = document.getElementsByTagName('video');
    var audios = document.getElementsByTagName('audio');
    var mediaEls = [];
    if (vids && vids.length > 0) {
        for(i=0, e=vids.length; i<e; i++) {
            mediaEls.push(vids[i]);
        }
    }
    if (audios && audios.length > 0) {
        for(i=0, e=audios.length; i<e; i++) {
            mediaEls.push(audios[i]);
        }
    }

    // Check if any media elements exist
    if (mediaEls && mediaEls.length > 0) {

        for (i=0,e=mediaEls.length; i<e; i++) {
            mediaEl = mediaEls[i];

            // Check if element exists, has getAttribute func.
            // IE seems to consider typeof el.getAttribute == 'object' instead of 'function' like expected, at least when loading the player immediately.
            if (mediaEl && mediaEl.getAttribute) {

                // Make sure this player hasn't already been set up.
                if (mediaEl['player'] === undefined) {
                    options = mediaEl.getAttribute('data-setup');

                    // Check if data-setup attr exists.
                    // We only auto-setup if they've added the data-setup attr.
                    if (options !== null) {
                        // Create new video.js instance.
                        player = advjs(mediaEl);
                    }
                }

                // If getAttribute isn't defined, we need to wait for the DOM.
            } else {
                advjs.autoSetupTimeout(1);
                break;
            }
        }

        // No videos were found, so keep looping unless page is finished loading.
    } else if (!advjs.windowLoaded) {
        advjs.autoSetupTimeout(1);
    }
};

// Pause to let the DOM keep processing
advjs.autoSetupTimeout = function(wait){
    setTimeout(advjs.autoSetup, wait);
};

if (document.readyState === 'complete') {
    advjs.windowLoaded = true;
} else {
    advjs.one(window, 'load', function(){
        advjs.windowLoaded = true;
    });
}

// Run Auto-load players
// You have to wait at least once in case this script is loaded after your video in the DOM (weird behavior only with minified version)
advjs.autoSetupTimeout(1);
/**
 * the method for registering a video.js plugin
 *
 * @param  {String} name The name of the plugin
 * @param  {Function} init The function that is run when the player inits
 */
advjs.plugin = function(name, init){
    advjs.Player.prototype[name] = init;
};

/* vtt.js - v0.12.1 (https://github.com/mozilla/vtt.js) built on 08-07-2015 */

(function(root) {
    var vttjs = root.vttjs = {};
    var cueShim = vttjs.VTTCue;
    var regionShim = vttjs.VTTRegion;
    var oldVTTCue = root.VTTCue;
    var oldVTTRegion = root.VTTRegion;

    vttjs.shim = function() {
        vttjs.VTTCue = cueShim;
        vttjs.VTTRegion = regionShim;
    };

    vttjs.restore = function() {
        vttjs.VTTCue = oldVTTCue;
        vttjs.VTTRegion = oldVTTRegion;
    };
}(this));

/**
 * Copyright 2013 vtt.js Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function(root, vttjs) {

    var autoKeyword = "auto";
    var directionSetting = {
        "": true,
        "lr": true,
        "rl": true
    };
    var alignSetting = {
        "start": true,
        "middle": true,
        "end": true,
        "left": true,
        "right": true
    };

    function findDirectionSetting(value) {
        if (typeof value !== "string") {
            return false;
        }
        var dir = directionSetting[value.toLowerCase()];
        return dir ? value.toLowerCase() : false;
    }

    function findAlignSetting(value) {
        if (typeof value !== "string") {
            return false;
        }
        var align = alignSetting[value.toLowerCase()];
        return align ? value.toLowerCase() : false;
    }

    function extend(obj) {
        var i = 1;
        for (; i < arguments.length; i++) {
            var cobj = arguments[i];
            for (var p in cobj) {
                obj[p] = cobj[p];
            }
        }

        return obj;
    }

    function VTTCue(startTime, endTime, text) {
        var cue = this;
        var isIE8 = (/MSIE\s8\.0/).test(navigator.userAgent);
        var baseObj = {};

        if (isIE8) {
            cue = document.createElement('custom');
        } else {
            baseObj.enumerable = true;
        }

        /**
         * Shim implementation specific properties. These properties are not in
         * the spec.
         */

            // Lets us know when the VTTCue's data has changed in such a way that we need
            // to recompute its display state. This lets us compute its display state
            // lazily.
        cue.hasBeenReset = false;

        /**
         * VTTCue and TextTrackCue properties
         * http://dev.w3.org/html5/webvtt/#vttcue-interface
         */

        var _id = "";
        var _pauseOnExit = false;
        var _startTime = startTime;
        var _endTime = endTime;
        var _text = text;
        var _region = null;
        var _vertical = "";
        var _snapToLines = true;
        var _line = "auto";
        var _lineAlign = "start";
        var _position = 50;
        var _positionAlign = "middle";
        var _size = 50;
        var _align = "middle";

        Object.defineProperty(cue,
            "id", extend({}, baseObj, {
                get: function() {
                    return _id;
                },
                set: function(value) {
                    _id = "" + value;
                }
            }));

        Object.defineProperty(cue,
            "pauseOnExit", extend({}, baseObj, {
                get: function() {
                    return _pauseOnExit;
                },
                set: function(value) {
                    _pauseOnExit = !!value;
                }
            }));

        Object.defineProperty(cue,
            "startTime", extend({}, baseObj, {
                get: function() {
                    return _startTime;
                },
                set: function(value) {
                    if (typeof value !== "number") {
                        throw new TypeError("Start time must be set to a number.");
                    }
                    _startTime = value;
                    this.hasBeenReset = true;
                }
            }));

        Object.defineProperty(cue,
            "endTime", extend({}, baseObj, {
                get: function() {
                    return _endTime;
                },
                set: function(value) {
                    if (typeof value !== "number") {
                        throw new TypeError("End time must be set to a number.");
                    }
                    _endTime = value;
                    this.hasBeenReset = true;
                }
            }));

        Object.defineProperty(cue,
            "text", extend({}, baseObj, {
                get: function() {
                    return _text;
                },
                set: function(value) {
                    _text = "" + value;
                    this.hasBeenReset = true;
                }
            }));

        Object.defineProperty(cue,
            "region", extend({}, baseObj, {
                get: function() {
                    return _region;
                },
                set: function(value) {
                    _region = value;
                    this.hasBeenReset = true;
                }
            }));

        Object.defineProperty(cue,
            "vertical", extend({}, baseObj, {
                get: function() {
                    return _vertical;
                },
                set: function(value) {
                    var setting = findDirectionSetting(value);
                    // Have to check for false because the setting an be an empty string.
                    if (setting === false) {
                        throw new SyntaxError("An invalid or illegal string was specified.");
                    }
                    _vertical = setting;
                    this.hasBeenReset = true;
                }
            }));

        Object.defineProperty(cue,
            "snapToLines", extend({}, baseObj, {
                get: function() {
                    return _snapToLines;
                },
                set: function(value) {
                    _snapToLines = !!value;
                    this.hasBeenReset = true;
                }
            }));

        Object.defineProperty(cue,
            "line", extend({}, baseObj, {
                get: function() {
                    return _line;
                },
                set: function(value) {
                    if (typeof value !== "number" && value !== autoKeyword) {
                        throw new SyntaxError("An invalid number or illegal string was specified.");
                    }
                    _line = value;
                    this.hasBeenReset = true;
                }
            }));

        Object.defineProperty(cue,
            "lineAlign", extend({}, baseObj, {
                get: function() {
                    return _lineAlign;
                },
                set: function(value) {
                    var setting = findAlignSetting(value);
                    if (!setting) {
                        throw new SyntaxError("An invalid or illegal string was specified.");
                    }
                    _lineAlign = setting;
                    this.hasBeenReset = true;
                }
            }));

        Object.defineProperty(cue,
            "position", extend({}, baseObj, {
                get: function() {
                    return _position;
                },
                set: function(value) {
                    if (value < 0 || value > 100) {
                        throw new Error("Position must be between 0 and 100.");
                    }
                    _position = value;
                    this.hasBeenReset = true;
                }
            }));

        Object.defineProperty(cue,
            "positionAlign", extend({}, baseObj, {
                get: function() {
                    return _positionAlign;
                },
                set: function(value) {
                    var setting = findAlignSetting(value);
                    if (!setting) {
                        throw new SyntaxError("An invalid or illegal string was specified.");
                    }
                    _positionAlign = setting;
                    this.hasBeenReset = true;
                }
            }));

        Object.defineProperty(cue,
            "size", extend({}, baseObj, {
                get: function() {
                    return _size;
                },
                set: function(value) {
                    if (value < 0 || value > 100) {
                        throw new Error("Size must be between 0 and 100.");
                    }
                    _size = value;
                    this.hasBeenReset = true;
                }
            }));

        Object.defineProperty(cue,
            "align", extend({}, baseObj, {
                get: function() {
                    return _align;
                },
                set: function(value) {
                    var setting = findAlignSetting(value);
                    if (!setting) {
                        throw new SyntaxError("An invalid or illegal string was specified.");
                    }
                    _align = setting;
                    this.hasBeenReset = true;
                }
            }));

        /**
         * Other <track> spec defined properties
         */

            // http://www.whatwg.org/specs/web-apps/current-work/multipage/the-video-element.html#text-track-cue-display-state
        cue.displayState = undefined;

        if (isIE8) {
            return cue;
        }
    }

    /**
     * VTTCue methods
     */

    VTTCue.prototype.getCueAsHTML = function() {
        // Assume WebVTT.convertCueToDOMTree is on the global.
        return WebVTT.convertCueToDOMTree(window, this.text);
    };

    root.VTTCue = root.VTTCue || VTTCue;
    vttjs.VTTCue = VTTCue;
}(this, (this.vttjs || {})));

/**
 * Copyright 2013 vtt.js Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function(root, vttjs) {

    var scrollSetting = {
        "": true,
        "up": true
    };

    function findScrollSetting(value) {
        if (typeof value !== "string") {
            return false;
        }
        var scroll = scrollSetting[value.toLowerCase()];
        return scroll ? value.toLowerCase() : false;
    }

    function isValidPercentValue(value) {
        return typeof value === "number" && (value >= 0 && value <= 100);
    }

    // VTTRegion shim http://dev.w3.org/html5/webvtt/#vttregion-interface
    function VTTRegion() {
        var _width = 100;
        var _lines = 3;
        var _regionAnchorX = 0;
        var _regionAnchorY = 100;
        var _viewportAnchorX = 0;
        var _viewportAnchorY = 100;
        var _scroll = "";

        Object.defineProperties(this, {
            "width": {
                enumerable: true,
                get: function() {
                    return _width;
                },
                set: function(value) {
                    if (!isValidPercentValue(value)) {
                        throw new Error("Width must be between 0 and 100.");
                    }
                    _width = value;
                }
            },
            "lines": {
                enumerable: true,
                get: function() {
                    return _lines;
                },
                set: function(value) {
                    if (typeof value !== "number") {
                        throw new TypeError("Lines must be set to a number.");
                    }
                    _lines = value;
                }
            },
            "regionAnchorY": {
                enumerable: true,
                get: function() {
                    return _regionAnchorY;
                },
                set: function(value) {
                    if (!isValidPercentValue(value)) {
                        throw new Error("RegionAnchorX must be between 0 and 100.");
                    }
                    _regionAnchorY = value;
                }
            },
            "regionAnchorX": {
                enumerable: true,
                get: function() {
                    return _regionAnchorX;
                },
                set: function(value) {
                    if(!isValidPercentValue(value)) {
                        throw new Error("RegionAnchorY must be between 0 and 100.");
                    }
                    _regionAnchorX = value;
                }
            },
            "viewportAnchorY": {
                enumerable: true,
                get: function() {
                    return _viewportAnchorY;
                },
                set: function(value) {
                    if (!isValidPercentValue(value)) {
                        throw new Error("ViewportAnchorY must be between 0 and 100.");
                    }
                    _viewportAnchorY = value;
                }
            },
            "viewportAnchorX": {
                enumerable: true,
                get: function() {
                    return _viewportAnchorX;
                },
                set: function(value) {
                    if (!isValidPercentValue(value)) {
                        throw new Error("ViewportAnchorX must be between 0 and 100.");
                    }
                    _viewportAnchorX = value;
                }
            },
            "scroll": {
                enumerable: true,
                get: function() {
                    return _scroll;
                },
                set: function(value) {
                    var setting = findScrollSetting(value);
                    // Have to check for false as an empty string is a legal value.
                    if (setting === false) {
                        throw new SyntaxError("An invalid or illegal string was specified.");
                    }
                    _scroll = setting;
                }
            }
        });
    }

    root.VTTRegion = root.VTTRegion || VTTRegion;
    vttjs.VTTRegion = VTTRegion;
}(this, (this.vttjs || {})));

/**
 * Copyright 2013 vtt.js Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

(function(global) {

    var _objCreate = Object.create || (function() {
        function F() {}
        return function(o) {
            if (arguments.length !== 1) {
                throw new Error('Object.create shim only accepts one parameter.');
            }
            F.prototype = o;
            return new F();
        };
    })();

    // Creates a new ParserError object from an errorData object. The errorData
    // object should have default code and message properties. The default message
    // property can be overriden by passing in a message parameter.
    // See ParsingError.Errors below for acceptable errors.
    function ParsingError(errorData, message) {
        this.name = "ParsingError";
        this.code = errorData.code;
        this.message = message || errorData.message;
    }
    ParsingError.prototype = _objCreate(Error.prototype);
    ParsingError.prototype.constructor = ParsingError;

    // ParsingError metadata for acceptable ParsingErrors.
    ParsingError.Errors = {
        BadSignature: {
            code: 0,
            message: "Malformed WebVTT signature."
        },
        BadTimeStamp: {
            code: 1,
            message: "Malformed time stamp."
        }
    };

    // Try to parse input as a time stamp.
    function parseTimeStamp(input) {

        function computeSeconds(h, m, s, f) {
            return (h | 0) * 3600 + (m | 0) * 60 + (s | 0) + (f | 0) / 1000;
        }

        var m = input.match(/^(\d+):(\d{2})(:\d{2})?\.(\d{3})/);
        if (!m) {
            return null;
        }

        if (m[3]) {
            // Timestamp takes the form of [hours]:[minutes]:[seconds].[milliseconds]
            return computeSeconds(m[1], m[2], m[3].replace(":", ""), m[4]);
        } else if (m[1] > 59) {
            // Timestamp takes the form of [hours]:[minutes].[milliseconds]
            // First position is hours as it's over 59.
            return computeSeconds(m[1], m[2], 0,  m[4]);
        } else {
            // Timestamp takes the form of [minutes]:[seconds].[milliseconds]
            return computeSeconds(0, m[1], m[2], m[4]);
        }
    }

    // A settings object holds key/value pairs and will ignore anything but the first
    // assignment to a specific key.
    function Settings() {
        this.values = _objCreate(null);
    }

    Settings.prototype = {
        // Only accept the first assignment to any key.
        set: function(k, v) {
            if (!this.get(k) && v !== "") {
                this.values[k] = v;
            }
        },
        // Return the value for a key, or a default value.
        // If 'defaultKey' is passed then 'dflt' is assumed to be an object with
        // a number of possible default values as properties where 'defaultKey' is
        // the key of the property that will be chosen; otherwise it's assumed to be
        // a single value.
        get: function(k, dflt, defaultKey) {
            if (defaultKey) {
                return this.has(k) ? this.values[k] : dflt[defaultKey];
            }
            return this.has(k) ? this.values[k] : dflt;
        },
        // Check whether we have a value for a key.
        has: function(k) {
            return k in this.values;
        },
        // Accept a setting if its one of the given alternatives.
        alt: function(k, v, a) {
            for (var n = 0; n < a.length; ++n) {
                if (v === a[n]) {
                    this.set(k, v);
                    break;
                }
            }
        },
        // Accept a setting if its a valid (signed) integer.
        integer: function(k, v) {
            if (/^-?\d+$/.test(v)) { // integer
                this.set(k, parseInt(v, 10));
            }
        },
        // Accept a setting if its a valid percentage.
        percent: function(k, v) {
            var m;
            if ((m = v.match(/^([\d]{1,3})(\.[\d]*)?%$/))) {
                v = parseFloat(v);
                if (v >= 0 && v <= 100) {
                    this.set(k, v);
                    return true;
                }
            }
            return false;
        }
    };

    // Helper function to parse input into groups separated by 'groupDelim', and
    // interprete each group as a key/value pair separated by 'keyValueDelim'.
    function parseOptions(input, callback, keyValueDelim, groupDelim) {
        var groups = groupDelim ? input.split(groupDelim) : [input];
        for (var i in groups) {
            if (typeof groups[i] !== "string") {
                continue;
            }
            var kv = groups[i].split(keyValueDelim);
            if (kv.length !== 2) {
                continue;
            }
            var k = kv[0];
            var v = kv[1];
            callback(k, v);
        }
    }

    function parseCue(input, cue, regionList) {
        // Remember the original input if we need to throw an error.
        var oInput = input;
        // 4.1 WebVTT timestamp
        function consumeTimeStamp() {
            var ts = parseTimeStamp(input);
            if (ts === null) {
                throw new ParsingError(ParsingError.Errors.BadTimeStamp,
                        "Malformed timestamp: " + oInput);
            }
            // Remove time stamp from input.
            input = input.replace(/^[^\sa-zA-Z-]+/, "");
            return ts;
        }

        // 4.4.2 WebVTT cue settings
        function consumeCueSettings(input, cue) {
            var settings = new Settings();

            parseOptions(input, function (k, v) {
                switch (k) {
                    case "region":
                        // Find the last region we parsed with the same region id.
                        for (var i = regionList.length - 1; i >= 0; i--) {
                            if (regionList[i].id === v) {
                                settings.set(k, regionList[i].region);
                                break;
                            }
                        }
                        break;
                    case "vertical":
                        settings.alt(k, v, ["rl", "lr"]);
                        break;
                    case "line":
                        var vals = v.split(","),
                            vals0 = vals[0];
                        settings.integer(k, vals0);
                        settings.percent(k, vals0) ? settings.set("snapToLines", false) : null;
                        settings.alt(k, vals0, ["auto"]);
                        if (vals.length === 2) {
                            settings.alt("lineAlign", vals[1], ["start", "middle", "end"]);
                        }
                        break;
                    case "position":
                        vals = v.split(",");
                        settings.percent(k, vals[0]);
                        if (vals.length === 2) {
                            settings.alt("positionAlign", vals[1], ["start", "middle", "end"]);
                        }
                        break;
                    case "size":
                        settings.percent(k, v);
                        break;
                    case "align":
                        settings.alt(k, v, ["start", "middle", "end", "left", "right"]);
                        break;
                }
            }, /:/, /\s/);

            // Apply default values for any missing fields.
            cue.region = settings.get("region", null);
            cue.vertical = settings.get("vertical", "");
            cue.line = settings.get("line", "auto");
            cue.lineAlign = settings.get("lineAlign", "start");
            cue.snapToLines = settings.get("snapToLines", true);
            cue.size = settings.get("size", 100);
            cue.align = settings.get("align", "middle");
            cue.position = settings.get("position", {
                start: 0,
                left: 0,
                middle: 50,
                end: 100,
                right: 100
            }, cue.align);
            cue.positionAlign = settings.get("positionAlign", {
                start: "start",
                left: "start",
                middle: "middle",
                end: "end",
                right: "end"
            }, cue.align);
        }

        function skipWhitespace() {
            input = input.replace(/^\s+/, "");
        }

        // 4.1 WebVTT cue timings.
        skipWhitespace();
        cue.startTime = consumeTimeStamp();   // (1) collect cue start time
        skipWhitespace();
        if (input.substr(0, 3) !== "-->") {     // (3) next characters must match "-->"
            throw new ParsingError(ParsingError.Errors.BadTimeStamp,
                    "Malformed time stamp (time stamps must be separated by '-->'): " +
                    oInput);
        }
        input = input.substr(3);
        skipWhitespace();
        cue.endTime = consumeTimeStamp();     // (5) collect cue end time

        // 4.1 WebVTT cue settings list.
        skipWhitespace();
        consumeCueSettings(input, cue);
    }

    var ESCAPE = {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&lrm;": "\u200e",
        "&rlm;": "\u200f",
        "&nbsp;": "\u00a0"
    };

    var TAG_NAME = {
        c: "span",
        i: "i",
        b: "b",
        u: "u",
        ruby: "ruby",
        rt: "rt",
        v: "span",
        lang: "span"
    };

    var TAG_ANNOTATION = {
        v: "title",
        lang: "lang"
    };

    var NEEDS_PARENT = {
        rt: "ruby"
    };

    // Parse content into a document fragment.
    function parseContent(window, input) {
        function nextToken() {
            // Check for end-of-string.
            if (!input) {
                return null;
            }

            // Consume 'n' characters from the input.
            function consume(result) {
                input = input.substr(result.length);
                return result;
            }

            var m = input.match(/^([^<]*)(<[^>]+>?)?/);
            // If there is some text before the next tag, return it, otherwise return
            // the tag.
            return consume(m[1] ? m[1] : m[2]);
        }

        // Unescape a string 's'.
        function unescape1(e) {
            return ESCAPE[e];
        }
        function unescape(s) {
            while ((m = s.match(/&(amp|lt|gt|lrm|rlm|nbsp);/))) {
                s = s.replace(m[0], unescape1);
            }
            return s;
        }

        function shouldAdd(current, element) {
            return !NEEDS_PARENT[element.localName] ||
                NEEDS_PARENT[element.localName] === current.localName;
        }

        // Create an element for this tag.
        function createElement(type, annotation) {
            var tagName = TAG_NAME[type];
            if (!tagName) {
                return null;
            }
            var element = window.document.createElement(tagName);
            element.localName = tagName;
            var name = TAG_ANNOTATION[type];
            if (name && annotation) {
                element[name] = annotation.trim();
            }
            return element;
        }

        var rootDiv = window.document.createElement("div"),
            current = rootDiv,
            t,
            tagStack = [];

        while ((t = nextToken()) !== null) {
            if (t[0] === '<') {
                if (t[1] === "/") {
                    // If the closing tag matches, move back up to the parent node.
                    if (tagStack.length &&
                        tagStack[tagStack.length - 1] === t.substr(2).replace(">", "")) {
                        tagStack.pop();
                        current = current.parentNode;
                    }
                    // Otherwise just ignore the end tag.
                    continue;
                }
                var ts = parseTimeStamp(t.substr(1, t.length - 2));
                var node;
                if (ts) {
                    // Timestamps are lead nodes as well.
                    node = window.document.createProcessingInstruction("timestamp", ts);
                    current.appendChild(node);
                    continue;
                }
                var m = t.match(/^<([^.\s/0-9>]+)(\.[^\s\\>]+)?([^>\\]+)?(\\?)>?$/);
                // If we can't parse the tag, skip to the next tag.
                if (!m) {
                    continue;
                }
                // Try to construct an element, and ignore the tag if we couldn't.
                node = createElement(m[1], m[3]);
                if (!node) {
                    continue;
                }
                // Determine if the tag should be added based on the context of where it
                // is placed in the cuetext.
                if (!shouldAdd(current, node)) {
                    continue;
                }
                // Set the class list (as a list of classes, separated by space).
                if (m[2]) {
                    node.className = m[2].substr(1).replace('.', ' ');
                }
                // Append the node to the current node, and enter the scope of the new
                // node.
                tagStack.push(m[1]);
                current.appendChild(node);
                current = node;
                continue;
            }

            // Text nodes are leaf nodes.
            current.appendChild(window.document.createTextNode(unescape(t)));
        }

        return rootDiv;
    }

    // This is a list of all the Unicode characters that have a strong
    // right-to-left category. What this means is that these characters are
    // written right-to-left for sure. It was generated by pulling all the strong
    // right-to-left characters out of the Unicode data table. That table can
    // found at: http://www.unicode.org/Public/UNIDATA/UnicodeData.txt
    var strongRTLChars = [0x05BE, 0x05C0, 0x05C3, 0x05C6, 0x05D0, 0x05D1,
        0x05D2, 0x05D3, 0x05D4, 0x05D5, 0x05D6, 0x05D7, 0x05D8, 0x05D9, 0x05DA,
        0x05DB, 0x05DC, 0x05DD, 0x05DE, 0x05DF, 0x05E0, 0x05E1, 0x05E2, 0x05E3,
        0x05E4, 0x05E5, 0x05E6, 0x05E7, 0x05E8, 0x05E9, 0x05EA, 0x05F0, 0x05F1,
        0x05F2, 0x05F3, 0x05F4, 0x0608, 0x060B, 0x060D, 0x061B, 0x061E, 0x061F,
        0x0620, 0x0621, 0x0622, 0x0623, 0x0624, 0x0625, 0x0626, 0x0627, 0x0628,
        0x0629, 0x062A, 0x062B, 0x062C, 0x062D, 0x062E, 0x062F, 0x0630, 0x0631,
        0x0632, 0x0633, 0x0634, 0x0635, 0x0636, 0x0637, 0x0638, 0x0639, 0x063A,
        0x063B, 0x063C, 0x063D, 0x063E, 0x063F, 0x0640, 0x0641, 0x0642, 0x0643,
        0x0644, 0x0645, 0x0646, 0x0647, 0x0648, 0x0649, 0x064A, 0x066D, 0x066E,
        0x066F, 0x0671, 0x0672, 0x0673, 0x0674, 0x0675, 0x0676, 0x0677, 0x0678,
        0x0679, 0x067A, 0x067B, 0x067C, 0x067D, 0x067E, 0x067F, 0x0680, 0x0681,
        0x0682, 0x0683, 0x0684, 0x0685, 0x0686, 0x0687, 0x0688, 0x0689, 0x068A,
        0x068B, 0x068C, 0x068D, 0x068E, 0x068F, 0x0690, 0x0691, 0x0692, 0x0693,
        0x0694, 0x0695, 0x0696, 0x0697, 0x0698, 0x0699, 0x069A, 0x069B, 0x069C,
        0x069D, 0x069E, 0x069F, 0x06A0, 0x06A1, 0x06A2, 0x06A3, 0x06A4, 0x06A5,
        0x06A6, 0x06A7, 0x06A8, 0x06A9, 0x06AA, 0x06AB, 0x06AC, 0x06AD, 0x06AE,
        0x06AF, 0x06B0, 0x06B1, 0x06B2, 0x06B3, 0x06B4, 0x06B5, 0x06B6, 0x06B7,
        0x06B8, 0x06B9, 0x06BA, 0x06BB, 0x06BC, 0x06BD, 0x06BE, 0x06BF, 0x06C0,
        0x06C1, 0x06C2, 0x06C3, 0x06C4, 0x06C5, 0x06C6, 0x06C7, 0x06C8, 0x06C9,
        0x06CA, 0x06CB, 0x06CC, 0x06CD, 0x06CE, 0x06CF, 0x06D0, 0x06D1, 0x06D2,
        0x06D3, 0x06D4, 0x06D5, 0x06E5, 0x06E6, 0x06EE, 0x06EF, 0x06FA, 0x06FB,
        0x06FC, 0x06FD, 0x06FE, 0x06FF, 0x0700, 0x0701, 0x0702, 0x0703, 0x0704,
        0x0705, 0x0706, 0x0707, 0x0708, 0x0709, 0x070A, 0x070B, 0x070C, 0x070D,
        0x070F, 0x0710, 0x0712, 0x0713, 0x0714, 0x0715, 0x0716, 0x0717, 0x0718,
        0x0719, 0x071A, 0x071B, 0x071C, 0x071D, 0x071E, 0x071F, 0x0720, 0x0721,
        0x0722, 0x0723, 0x0724, 0x0725, 0x0726, 0x0727, 0x0728, 0x0729, 0x072A,
        0x072B, 0x072C, 0x072D, 0x072E, 0x072F, 0x074D, 0x074E, 0x074F, 0x0750,
        0x0751, 0x0752, 0x0753, 0x0754, 0x0755, 0x0756, 0x0757, 0x0758, 0x0759,
        0x075A, 0x075B, 0x075C, 0x075D, 0x075E, 0x075F, 0x0760, 0x0761, 0x0762,
        0x0763, 0x0764, 0x0765, 0x0766, 0x0767, 0x0768, 0x0769, 0x076A, 0x076B,
        0x076C, 0x076D, 0x076E, 0x076F, 0x0770, 0x0771, 0x0772, 0x0773, 0x0774,
        0x0775, 0x0776, 0x0777, 0x0778, 0x0779, 0x077A, 0x077B, 0x077C, 0x077D,
        0x077E, 0x077F, 0x0780, 0x0781, 0x0782, 0x0783, 0x0784, 0x0785, 0x0786,
        0x0787, 0x0788, 0x0789, 0x078A, 0x078B, 0x078C, 0x078D, 0x078E, 0x078F,
        0x0790, 0x0791, 0x0792, 0x0793, 0x0794, 0x0795, 0x0796, 0x0797, 0x0798,
        0x0799, 0x079A, 0x079B, 0x079C, 0x079D, 0x079E, 0x079F, 0x07A0, 0x07A1,
        0x07A2, 0x07A3, 0x07A4, 0x07A5, 0x07B1, 0x07C0, 0x07C1, 0x07C2, 0x07C3,
        0x07C4, 0x07C5, 0x07C6, 0x07C7, 0x07C8, 0x07C9, 0x07CA, 0x07CB, 0x07CC,
        0x07CD, 0x07CE, 0x07CF, 0x07D0, 0x07D1, 0x07D2, 0x07D3, 0x07D4, 0x07D5,
        0x07D6, 0x07D7, 0x07D8, 0x07D9, 0x07DA, 0x07DB, 0x07DC, 0x07DD, 0x07DE,
        0x07DF, 0x07E0, 0x07E1, 0x07E2, 0x07E3, 0x07E4, 0x07E5, 0x07E6, 0x07E7,
        0x07E8, 0x07E9, 0x07EA, 0x07F4, 0x07F5, 0x07FA, 0x0800, 0x0801, 0x0802,
        0x0803, 0x0804, 0x0805, 0x0806, 0x0807, 0x0808, 0x0809, 0x080A, 0x080B,
        0x080C, 0x080D, 0x080E, 0x080F, 0x0810, 0x0811, 0x0812, 0x0813, 0x0814,
        0x0815, 0x081A, 0x0824, 0x0828, 0x0830, 0x0831, 0x0832, 0x0833, 0x0834,
        0x0835, 0x0836, 0x0837, 0x0838, 0x0839, 0x083A, 0x083B, 0x083C, 0x083D,
        0x083E, 0x0840, 0x0841, 0x0842, 0x0843, 0x0844, 0x0845, 0x0846, 0x0847,
        0x0848, 0x0849, 0x084A, 0x084B, 0x084C, 0x084D, 0x084E, 0x084F, 0x0850,
        0x0851, 0x0852, 0x0853, 0x0854, 0x0855, 0x0856, 0x0857, 0x0858, 0x085E,
        0x08A0, 0x08A2, 0x08A3, 0x08A4, 0x08A5, 0x08A6, 0x08A7, 0x08A8, 0x08A9,
        0x08AA, 0x08AB, 0x08AC, 0x200F, 0xFB1D, 0xFB1F, 0xFB20, 0xFB21, 0xFB22,
        0xFB23, 0xFB24, 0xFB25, 0xFB26, 0xFB27, 0xFB28, 0xFB2A, 0xFB2B, 0xFB2C,
        0xFB2D, 0xFB2E, 0xFB2F, 0xFB30, 0xFB31, 0xFB32, 0xFB33, 0xFB34, 0xFB35,
        0xFB36, 0xFB38, 0xFB39, 0xFB3A, 0xFB3B, 0xFB3C, 0xFB3E, 0xFB40, 0xFB41,
        0xFB43, 0xFB44, 0xFB46, 0xFB47, 0xFB48, 0xFB49, 0xFB4A, 0xFB4B, 0xFB4C,
        0xFB4D, 0xFB4E, 0xFB4F, 0xFB50, 0xFB51, 0xFB52, 0xFB53, 0xFB54, 0xFB55,
        0xFB56, 0xFB57, 0xFB58, 0xFB59, 0xFB5A, 0xFB5B, 0xFB5C, 0xFB5D, 0xFB5E,
        0xFB5F, 0xFB60, 0xFB61, 0xFB62, 0xFB63, 0xFB64, 0xFB65, 0xFB66, 0xFB67,
        0xFB68, 0xFB69, 0xFB6A, 0xFB6B, 0xFB6C, 0xFB6D, 0xFB6E, 0xFB6F, 0xFB70,
        0xFB71, 0xFB72, 0xFB73, 0xFB74, 0xFB75, 0xFB76, 0xFB77, 0xFB78, 0xFB79,
        0xFB7A, 0xFB7B, 0xFB7C, 0xFB7D, 0xFB7E, 0xFB7F, 0xFB80, 0xFB81, 0xFB82,
        0xFB83, 0xFB84, 0xFB85, 0xFB86, 0xFB87, 0xFB88, 0xFB89, 0xFB8A, 0xFB8B,
        0xFB8C, 0xFB8D, 0xFB8E, 0xFB8F, 0xFB90, 0xFB91, 0xFB92, 0xFB93, 0xFB94,
        0xFB95, 0xFB96, 0xFB97, 0xFB98, 0xFB99, 0xFB9A, 0xFB9B, 0xFB9C, 0xFB9D,
        0xFB9E, 0xFB9F, 0xFBA0, 0xFBA1, 0xFBA2, 0xFBA3, 0xFBA4, 0xFBA5, 0xFBA6,
        0xFBA7, 0xFBA8, 0xFBA9, 0xFBAA, 0xFBAB, 0xFBAC, 0xFBAD, 0xFBAE, 0xFBAF,
        0xFBB0, 0xFBB1, 0xFBB2, 0xFBB3, 0xFBB4, 0xFBB5, 0xFBB6, 0xFBB7, 0xFBB8,
        0xFBB9, 0xFBBA, 0xFBBB, 0xFBBC, 0xFBBD, 0xFBBE, 0xFBBF, 0xFBC0, 0xFBC1,
        0xFBD3, 0xFBD4, 0xFBD5, 0xFBD6, 0xFBD7, 0xFBD8, 0xFBD9, 0xFBDA, 0xFBDB,
        0xFBDC, 0xFBDD, 0xFBDE, 0xFBDF, 0xFBE0, 0xFBE1, 0xFBE2, 0xFBE3, 0xFBE4,
        0xFBE5, 0xFBE6, 0xFBE7, 0xFBE8, 0xFBE9, 0xFBEA, 0xFBEB, 0xFBEC, 0xFBED,
        0xFBEE, 0xFBEF, 0xFBF0, 0xFBF1, 0xFBF2, 0xFBF3, 0xFBF4, 0xFBF5, 0xFBF6,
        0xFBF7, 0xFBF8, 0xFBF9, 0xFBFA, 0xFBFB, 0xFBFC, 0xFBFD, 0xFBFE, 0xFBFF,
        0xFC00, 0xFC01, 0xFC02, 0xFC03, 0xFC04, 0xFC05, 0xFC06, 0xFC07, 0xFC08,
        0xFC09, 0xFC0A, 0xFC0B, 0xFC0C, 0xFC0D, 0xFC0E, 0xFC0F, 0xFC10, 0xFC11,
        0xFC12, 0xFC13, 0xFC14, 0xFC15, 0xFC16, 0xFC17, 0xFC18, 0xFC19, 0xFC1A,
        0xFC1B, 0xFC1C, 0xFC1D, 0xFC1E, 0xFC1F, 0xFC20, 0xFC21, 0xFC22, 0xFC23,
        0xFC24, 0xFC25, 0xFC26, 0xFC27, 0xFC28, 0xFC29, 0xFC2A, 0xFC2B, 0xFC2C,
        0xFC2D, 0xFC2E, 0xFC2F, 0xFC30, 0xFC31, 0xFC32, 0xFC33, 0xFC34, 0xFC35,
        0xFC36, 0xFC37, 0xFC38, 0xFC39, 0xFC3A, 0xFC3B, 0xFC3C, 0xFC3D, 0xFC3E,
        0xFC3F, 0xFC40, 0xFC41, 0xFC42, 0xFC43, 0xFC44, 0xFC45, 0xFC46, 0xFC47,
        0xFC48, 0xFC49, 0xFC4A, 0xFC4B, 0xFC4C, 0xFC4D, 0xFC4E, 0xFC4F, 0xFC50,
        0xFC51, 0xFC52, 0xFC53, 0xFC54, 0xFC55, 0xFC56, 0xFC57, 0xFC58, 0xFC59,
        0xFC5A, 0xFC5B, 0xFC5C, 0xFC5D, 0xFC5E, 0xFC5F, 0xFC60, 0xFC61, 0xFC62,
        0xFC63, 0xFC64, 0xFC65, 0xFC66, 0xFC67, 0xFC68, 0xFC69, 0xFC6A, 0xFC6B,
        0xFC6C, 0xFC6D, 0xFC6E, 0xFC6F, 0xFC70, 0xFC71, 0xFC72, 0xFC73, 0xFC74,
        0xFC75, 0xFC76, 0xFC77, 0xFC78, 0xFC79, 0xFC7A, 0xFC7B, 0xFC7C, 0xFC7D,
        0xFC7E, 0xFC7F, 0xFC80, 0xFC81, 0xFC82, 0xFC83, 0xFC84, 0xFC85, 0xFC86,
        0xFC87, 0xFC88, 0xFC89, 0xFC8A, 0xFC8B, 0xFC8C, 0xFC8D, 0xFC8E, 0xFC8F,
        0xFC90, 0xFC91, 0xFC92, 0xFC93, 0xFC94, 0xFC95, 0xFC96, 0xFC97, 0xFC98,
        0xFC99, 0xFC9A, 0xFC9B, 0xFC9C, 0xFC9D, 0xFC9E, 0xFC9F, 0xFCA0, 0xFCA1,
        0xFCA2, 0xFCA3, 0xFCA4, 0xFCA5, 0xFCA6, 0xFCA7, 0xFCA8, 0xFCA9, 0xFCAA,
        0xFCAB, 0xFCAC, 0xFCAD, 0xFCAE, 0xFCAF, 0xFCB0, 0xFCB1, 0xFCB2, 0xFCB3,
        0xFCB4, 0xFCB5, 0xFCB6, 0xFCB7, 0xFCB8, 0xFCB9, 0xFCBA, 0xFCBB, 0xFCBC,
        0xFCBD, 0xFCBE, 0xFCBF, 0xFCC0, 0xFCC1, 0xFCC2, 0xFCC3, 0xFCC4, 0xFCC5,
        0xFCC6, 0xFCC7, 0xFCC8, 0xFCC9, 0xFCCA, 0xFCCB, 0xFCCC, 0xFCCD, 0xFCCE,
        0xFCCF, 0xFCD0, 0xFCD1, 0xFCD2, 0xFCD3, 0xFCD4, 0xFCD5, 0xFCD6, 0xFCD7,
        0xFCD8, 0xFCD9, 0xFCDA, 0xFCDB, 0xFCDC, 0xFCDD, 0xFCDE, 0xFCDF, 0xFCE0,
        0xFCE1, 0xFCE2, 0xFCE3, 0xFCE4, 0xFCE5, 0xFCE6, 0xFCE7, 0xFCE8, 0xFCE9,
        0xFCEA, 0xFCEB, 0xFCEC, 0xFCED, 0xFCEE, 0xFCEF, 0xFCF0, 0xFCF1, 0xFCF2,
        0xFCF3, 0xFCF4, 0xFCF5, 0xFCF6, 0xFCF7, 0xFCF8, 0xFCF9, 0xFCFA, 0xFCFB,
        0xFCFC, 0xFCFD, 0xFCFE, 0xFCFF, 0xFD00, 0xFD01, 0xFD02, 0xFD03, 0xFD04,
        0xFD05, 0xFD06, 0xFD07, 0xFD08, 0xFD09, 0xFD0A, 0xFD0B, 0xFD0C, 0xFD0D,
        0xFD0E, 0xFD0F, 0xFD10, 0xFD11, 0xFD12, 0xFD13, 0xFD14, 0xFD15, 0xFD16,
        0xFD17, 0xFD18, 0xFD19, 0xFD1A, 0xFD1B, 0xFD1C, 0xFD1D, 0xFD1E, 0xFD1F,
        0xFD20, 0xFD21, 0xFD22, 0xFD23, 0xFD24, 0xFD25, 0xFD26, 0xFD27, 0xFD28,
        0xFD29, 0xFD2A, 0xFD2B, 0xFD2C, 0xFD2D, 0xFD2E, 0xFD2F, 0xFD30, 0xFD31,
        0xFD32, 0xFD33, 0xFD34, 0xFD35, 0xFD36, 0xFD37, 0xFD38, 0xFD39, 0xFD3A,
        0xFD3B, 0xFD3C, 0xFD3D, 0xFD50, 0xFD51, 0xFD52, 0xFD53, 0xFD54, 0xFD55,
        0xFD56, 0xFD57, 0xFD58, 0xFD59, 0xFD5A, 0xFD5B, 0xFD5C, 0xFD5D, 0xFD5E,
        0xFD5F, 0xFD60, 0xFD61, 0xFD62, 0xFD63, 0xFD64, 0xFD65, 0xFD66, 0xFD67,
        0xFD68, 0xFD69, 0xFD6A, 0xFD6B, 0xFD6C, 0xFD6D, 0xFD6E, 0xFD6F, 0xFD70,
        0xFD71, 0xFD72, 0xFD73, 0xFD74, 0xFD75, 0xFD76, 0xFD77, 0xFD78, 0xFD79,
        0xFD7A, 0xFD7B, 0xFD7C, 0xFD7D, 0xFD7E, 0xFD7F, 0xFD80, 0xFD81, 0xFD82,
        0xFD83, 0xFD84, 0xFD85, 0xFD86, 0xFD87, 0xFD88, 0xFD89, 0xFD8A, 0xFD8B,
        0xFD8C, 0xFD8D, 0xFD8E, 0xFD8F, 0xFD92, 0xFD93, 0xFD94, 0xFD95, 0xFD96,
        0xFD97, 0xFD98, 0xFD99, 0xFD9A, 0xFD9B, 0xFD9C, 0xFD9D, 0xFD9E, 0xFD9F,
        0xFDA0, 0xFDA1, 0xFDA2, 0xFDA3, 0xFDA4, 0xFDA5, 0xFDA6, 0xFDA7, 0xFDA8,
        0xFDA9, 0xFDAA, 0xFDAB, 0xFDAC, 0xFDAD, 0xFDAE, 0xFDAF, 0xFDB0, 0xFDB1,
        0xFDB2, 0xFDB3, 0xFDB4, 0xFDB5, 0xFDB6, 0xFDB7, 0xFDB8, 0xFDB9, 0xFDBA,
        0xFDBB, 0xFDBC, 0xFDBD, 0xFDBE, 0xFDBF, 0xFDC0, 0xFDC1, 0xFDC2, 0xFDC3,
        0xFDC4, 0xFDC5, 0xFDC6, 0xFDC7, 0xFDF0, 0xFDF1, 0xFDF2, 0xFDF3, 0xFDF4,
        0xFDF5, 0xFDF6, 0xFDF7, 0xFDF8, 0xFDF9, 0xFDFA, 0xFDFB, 0xFDFC, 0xFE70,
        0xFE71, 0xFE72, 0xFE73, 0xFE74, 0xFE76, 0xFE77, 0xFE78, 0xFE79, 0xFE7A,
        0xFE7B, 0xFE7C, 0xFE7D, 0xFE7E, 0xFE7F, 0xFE80, 0xFE81, 0xFE82, 0xFE83,
        0xFE84, 0xFE85, 0xFE86, 0xFE87, 0xFE88, 0xFE89, 0xFE8A, 0xFE8B, 0xFE8C,
        0xFE8D, 0xFE8E, 0xFE8F, 0xFE90, 0xFE91, 0xFE92, 0xFE93, 0xFE94, 0xFE95,
        0xFE96, 0xFE97, 0xFE98, 0xFE99, 0xFE9A, 0xFE9B, 0xFE9C, 0xFE9D, 0xFE9E,
        0xFE9F, 0xFEA0, 0xFEA1, 0xFEA2, 0xFEA3, 0xFEA4, 0xFEA5, 0xFEA6, 0xFEA7,
        0xFEA8, 0xFEA9, 0xFEAA, 0xFEAB, 0xFEAC, 0xFEAD, 0xFEAE, 0xFEAF, 0xFEB0,
        0xFEB1, 0xFEB2, 0xFEB3, 0xFEB4, 0xFEB5, 0xFEB6, 0xFEB7, 0xFEB8, 0xFEB9,
        0xFEBA, 0xFEBB, 0xFEBC, 0xFEBD, 0xFEBE, 0xFEBF, 0xFEC0, 0xFEC1, 0xFEC2,
        0xFEC3, 0xFEC4, 0xFEC5, 0xFEC6, 0xFEC7, 0xFEC8, 0xFEC9, 0xFECA, 0xFECB,
        0xFECC, 0xFECD, 0xFECE, 0xFECF, 0xFED0, 0xFED1, 0xFED2, 0xFED3, 0xFED4,
        0xFED5, 0xFED6, 0xFED7, 0xFED8, 0xFED9, 0xFEDA, 0xFEDB, 0xFEDC, 0xFEDD,
        0xFEDE, 0xFEDF, 0xFEE0, 0xFEE1, 0xFEE2, 0xFEE3, 0xFEE4, 0xFEE5, 0xFEE6,
        0xFEE7, 0xFEE8, 0xFEE9, 0xFEEA, 0xFEEB, 0xFEEC, 0xFEED, 0xFEEE, 0xFEEF,
        0xFEF0, 0xFEF1, 0xFEF2, 0xFEF3, 0xFEF4, 0xFEF5, 0xFEF6, 0xFEF7, 0xFEF8,
        0xFEF9, 0xFEFA, 0xFEFB, 0xFEFC, 0x10800, 0x10801, 0x10802, 0x10803,
        0x10804, 0x10805, 0x10808, 0x1080A, 0x1080B, 0x1080C, 0x1080D, 0x1080E,
        0x1080F, 0x10810, 0x10811, 0x10812, 0x10813, 0x10814, 0x10815, 0x10816,
        0x10817, 0x10818, 0x10819, 0x1081A, 0x1081B, 0x1081C, 0x1081D, 0x1081E,
        0x1081F, 0x10820, 0x10821, 0x10822, 0x10823, 0x10824, 0x10825, 0x10826,
        0x10827, 0x10828, 0x10829, 0x1082A, 0x1082B, 0x1082C, 0x1082D, 0x1082E,
        0x1082F, 0x10830, 0x10831, 0x10832, 0x10833, 0x10834, 0x10835, 0x10837,
        0x10838, 0x1083C, 0x1083F, 0x10840, 0x10841, 0x10842, 0x10843, 0x10844,
        0x10845, 0x10846, 0x10847, 0x10848, 0x10849, 0x1084A, 0x1084B, 0x1084C,
        0x1084D, 0x1084E, 0x1084F, 0x10850, 0x10851, 0x10852, 0x10853, 0x10854,
        0x10855, 0x10857, 0x10858, 0x10859, 0x1085A, 0x1085B, 0x1085C, 0x1085D,
        0x1085E, 0x1085F, 0x10900, 0x10901, 0x10902, 0x10903, 0x10904, 0x10905,
        0x10906, 0x10907, 0x10908, 0x10909, 0x1090A, 0x1090B, 0x1090C, 0x1090D,
        0x1090E, 0x1090F, 0x10910, 0x10911, 0x10912, 0x10913, 0x10914, 0x10915,
        0x10916, 0x10917, 0x10918, 0x10919, 0x1091A, 0x1091B, 0x10920, 0x10921,
        0x10922, 0x10923, 0x10924, 0x10925, 0x10926, 0x10927, 0x10928, 0x10929,
        0x1092A, 0x1092B, 0x1092C, 0x1092D, 0x1092E, 0x1092F, 0x10930, 0x10931,
        0x10932, 0x10933, 0x10934, 0x10935, 0x10936, 0x10937, 0x10938, 0x10939,
        0x1093F, 0x10980, 0x10981, 0x10982, 0x10983, 0x10984, 0x10985, 0x10986,
        0x10987, 0x10988, 0x10989, 0x1098A, 0x1098B, 0x1098C, 0x1098D, 0x1098E,
        0x1098F, 0x10990, 0x10991, 0x10992, 0x10993, 0x10994, 0x10995, 0x10996,
        0x10997, 0x10998, 0x10999, 0x1099A, 0x1099B, 0x1099C, 0x1099D, 0x1099E,
        0x1099F, 0x109A0, 0x109A1, 0x109A2, 0x109A3, 0x109A4, 0x109A5, 0x109A6,
        0x109A7, 0x109A8, 0x109A9, 0x109AA, 0x109AB, 0x109AC, 0x109AD, 0x109AE,
        0x109AF, 0x109B0, 0x109B1, 0x109B2, 0x109B3, 0x109B4, 0x109B5, 0x109B6,
        0x109B7, 0x109BE, 0x109BF, 0x10A00, 0x10A10, 0x10A11, 0x10A12, 0x10A13,
        0x10A15, 0x10A16, 0x10A17, 0x10A19, 0x10A1A, 0x10A1B, 0x10A1C, 0x10A1D,
        0x10A1E, 0x10A1F, 0x10A20, 0x10A21, 0x10A22, 0x10A23, 0x10A24, 0x10A25,
        0x10A26, 0x10A27, 0x10A28, 0x10A29, 0x10A2A, 0x10A2B, 0x10A2C, 0x10A2D,
        0x10A2E, 0x10A2F, 0x10A30, 0x10A31, 0x10A32, 0x10A33, 0x10A40, 0x10A41,
        0x10A42, 0x10A43, 0x10A44, 0x10A45, 0x10A46, 0x10A47, 0x10A50, 0x10A51,
        0x10A52, 0x10A53, 0x10A54, 0x10A55, 0x10A56, 0x10A57, 0x10A58, 0x10A60,
        0x10A61, 0x10A62, 0x10A63, 0x10A64, 0x10A65, 0x10A66, 0x10A67, 0x10A68,
        0x10A69, 0x10A6A, 0x10A6B, 0x10A6C, 0x10A6D, 0x10A6E, 0x10A6F, 0x10A70,
        0x10A71, 0x10A72, 0x10A73, 0x10A74, 0x10A75, 0x10A76, 0x10A77, 0x10A78,
        0x10A79, 0x10A7A, 0x10A7B, 0x10A7C, 0x10A7D, 0x10A7E, 0x10A7F, 0x10B00,
        0x10B01, 0x10B02, 0x10B03, 0x10B04, 0x10B05, 0x10B06, 0x10B07, 0x10B08,
        0x10B09, 0x10B0A, 0x10B0B, 0x10B0C, 0x10B0D, 0x10B0E, 0x10B0F, 0x10B10,
        0x10B11, 0x10B12, 0x10B13, 0x10B14, 0x10B15, 0x10B16, 0x10B17, 0x10B18,
        0x10B19, 0x10B1A, 0x10B1B, 0x10B1C, 0x10B1D, 0x10B1E, 0x10B1F, 0x10B20,
        0x10B21, 0x10B22, 0x10B23, 0x10B24, 0x10B25, 0x10B26, 0x10B27, 0x10B28,
        0x10B29, 0x10B2A, 0x10B2B, 0x10B2C, 0x10B2D, 0x10B2E, 0x10B2F, 0x10B30,
        0x10B31, 0x10B32, 0x10B33, 0x10B34, 0x10B35, 0x10B40, 0x10B41, 0x10B42,
        0x10B43, 0x10B44, 0x10B45, 0x10B46, 0x10B47, 0x10B48, 0x10B49, 0x10B4A,
        0x10B4B, 0x10B4C, 0x10B4D, 0x10B4E, 0x10B4F, 0x10B50, 0x10B51, 0x10B52,
        0x10B53, 0x10B54, 0x10B55, 0x10B58, 0x10B59, 0x10B5A, 0x10B5B, 0x10B5C,
        0x10B5D, 0x10B5E, 0x10B5F, 0x10B60, 0x10B61, 0x10B62, 0x10B63, 0x10B64,
        0x10B65, 0x10B66, 0x10B67, 0x10B68, 0x10B69, 0x10B6A, 0x10B6B, 0x10B6C,
        0x10B6D, 0x10B6E, 0x10B6F, 0x10B70, 0x10B71, 0x10B72, 0x10B78, 0x10B79,
        0x10B7A, 0x10B7B, 0x10B7C, 0x10B7D, 0x10B7E, 0x10B7F, 0x10C00, 0x10C01,
        0x10C02, 0x10C03, 0x10C04, 0x10C05, 0x10C06, 0x10C07, 0x10C08, 0x10C09,
        0x10C0A, 0x10C0B, 0x10C0C, 0x10C0D, 0x10C0E, 0x10C0F, 0x10C10, 0x10C11,
        0x10C12, 0x10C13, 0x10C14, 0x10C15, 0x10C16, 0x10C17, 0x10C18, 0x10C19,
        0x10C1A, 0x10C1B, 0x10C1C, 0x10C1D, 0x10C1E, 0x10C1F, 0x10C20, 0x10C21,
        0x10C22, 0x10C23, 0x10C24, 0x10C25, 0x10C26, 0x10C27, 0x10C28, 0x10C29,
        0x10C2A, 0x10C2B, 0x10C2C, 0x10C2D, 0x10C2E, 0x10C2F, 0x10C30, 0x10C31,
        0x10C32, 0x10C33, 0x10C34, 0x10C35, 0x10C36, 0x10C37, 0x10C38, 0x10C39,
        0x10C3A, 0x10C3B, 0x10C3C, 0x10C3D, 0x10C3E, 0x10C3F, 0x10C40, 0x10C41,
        0x10C42, 0x10C43, 0x10C44, 0x10C45, 0x10C46, 0x10C47, 0x10C48, 0x1EE00,
        0x1EE01, 0x1EE02, 0x1EE03, 0x1EE05, 0x1EE06, 0x1EE07, 0x1EE08, 0x1EE09,
        0x1EE0A, 0x1EE0B, 0x1EE0C, 0x1EE0D, 0x1EE0E, 0x1EE0F, 0x1EE10, 0x1EE11,
        0x1EE12, 0x1EE13, 0x1EE14, 0x1EE15, 0x1EE16, 0x1EE17, 0x1EE18, 0x1EE19,
        0x1EE1A, 0x1EE1B, 0x1EE1C, 0x1EE1D, 0x1EE1E, 0x1EE1F, 0x1EE21, 0x1EE22,
        0x1EE24, 0x1EE27, 0x1EE29, 0x1EE2A, 0x1EE2B, 0x1EE2C, 0x1EE2D, 0x1EE2E,
        0x1EE2F, 0x1EE30, 0x1EE31, 0x1EE32, 0x1EE34, 0x1EE35, 0x1EE36, 0x1EE37,
        0x1EE39, 0x1EE3B, 0x1EE42, 0x1EE47, 0x1EE49, 0x1EE4B, 0x1EE4D, 0x1EE4E,
        0x1EE4F, 0x1EE51, 0x1EE52, 0x1EE54, 0x1EE57, 0x1EE59, 0x1EE5B, 0x1EE5D,
        0x1EE5F, 0x1EE61, 0x1EE62, 0x1EE64, 0x1EE67, 0x1EE68, 0x1EE69, 0x1EE6A,
        0x1EE6C, 0x1EE6D, 0x1EE6E, 0x1EE6F, 0x1EE70, 0x1EE71, 0x1EE72, 0x1EE74,
        0x1EE75, 0x1EE76, 0x1EE77, 0x1EE79, 0x1EE7A, 0x1EE7B, 0x1EE7C, 0x1EE7E,
        0x1EE80, 0x1EE81, 0x1EE82, 0x1EE83, 0x1EE84, 0x1EE85, 0x1EE86, 0x1EE87,
        0x1EE88, 0x1EE89, 0x1EE8B, 0x1EE8C, 0x1EE8D, 0x1EE8E, 0x1EE8F, 0x1EE90,
        0x1EE91, 0x1EE92, 0x1EE93, 0x1EE94, 0x1EE95, 0x1EE96, 0x1EE97, 0x1EE98,
        0x1EE99, 0x1EE9A, 0x1EE9B, 0x1EEA1, 0x1EEA2, 0x1EEA3, 0x1EEA5, 0x1EEA6,
        0x1EEA7, 0x1EEA8, 0x1EEA9, 0x1EEAB, 0x1EEAC, 0x1EEAD, 0x1EEAE, 0x1EEAF,
        0x1EEB0, 0x1EEB1, 0x1EEB2, 0x1EEB3, 0x1EEB4, 0x1EEB5, 0x1EEB6, 0x1EEB7,
        0x1EEB8, 0x1EEB9, 0x1EEBA, 0x1EEBB, 0x10FFFD];

    function determineBidi(cueDiv) {
        var nodeStack = [],
            text = "",
            charCode;

        if (!cueDiv || !cueDiv.childNodes) {
            return "ltr";
        }

        function pushNodes(nodeStack, node) {
            for (var i = node.childNodes.length - 1; i >= 0; i--) {
                nodeStack.push(node.childNodes[i]);
            }
        }

        function nextTextNode(nodeStack) {
            if (!nodeStack || !nodeStack.length) {
                return null;
            }

            var node = nodeStack.pop(),
                text = node.textContent || node.innerText;
            if (text) {
                // TODO: This should match all unicode type B characters (paragraph
                // separator characters). See issue #115.
                var m = text.match(/^.*(\n|\r)/);
                if (m) {
                    nodeStack.length = 0;
                    return m[0];
                }
                return text;
            }
            if (node.tagName === "ruby") {
                return nextTextNode(nodeStack);
            }
            if (node.childNodes) {
                pushNodes(nodeStack, node);
                return nextTextNode(nodeStack);
            }
        }

        pushNodes(nodeStack, cueDiv);
        while ((text = nextTextNode(nodeStack))) {
            for (var i = 0; i < text.length; i++) {
                charCode = text.charCodeAt(i);
                for (var j = 0; j < strongRTLChars.length; j++) {
                    if (strongRTLChars[j] === charCode) {
                        return "rtl";
                    }
                }
            }
        }
        return "ltr";
    }

    function computeLinePos(cue) {
        if (typeof cue.line === "number" &&
            (cue.snapToLines || (cue.line >= 0 && cue.line <= 100))) {
            return cue.line;
        }
        if (!cue.track || !cue.track.textTrackList ||
            !cue.track.textTrackList.mediaElement) {
            return -1;
        }
        var track = cue.track,
            trackList = track.textTrackList,
            count = 0;
        for (var i = 0; i < trackList.length && trackList[i] !== track; i++) {
            if (trackList[i].mode === "showing") {
                count++;
            }
        }
        return ++count * -1;
    }

    function StyleBox() {
    }

    // Apply styles to a div. If there is no div passed then it defaults to the
    // div on 'this'.
    StyleBox.prototype.applyStyles = function(styles, div) {
        div = div || this.div;
        for (var prop in styles) {
            if (styles.hasOwnProperty(prop)) {
                div.style[prop] = styles[prop];
            }
        }
    };

    StyleBox.prototype.formatStyle = function(val, unit) {
        return val === 0 ? 0 : val + unit;
    };

    // Constructs the computed display state of the cue (a div). Places the div
    // into the overlay which should be a block level element (usually a div).
    function CueStyleBox(window, cue, styleOptions) {
        var isIE8 = (/MSIE\s8\.0/).test(navigator.userAgent);
        var color = "rgba(255, 255, 255, 1)";
        var backgroundColor = "rgba(0, 0, 0, 0.8)";

        if (isIE8) {
            color = "rgb(255, 255, 255)";
            backgroundColor = "rgb(0, 0, 0)";
        }

        StyleBox.call(this);
        this.cue = cue;

        // Parse our cue's text into a DOM tree rooted at 'cueDiv'. This div will
        // have inline positioning and will function as the cue background box.
        this.cueDiv = parseContent(window, cue.text);
        var styles = {
            color: color,
            backgroundColor: backgroundColor,
            position: "relative",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            display: "inline"
        };

        if (!isIE8) {
            styles.writingMode = cue.vertical === "" ? "horizontal-tb"
                : cue.vertical === "lr" ? "vertical-lr"
                : "vertical-rl";
            styles.unicodeBidi = "plaintext";
        }
        this.applyStyles(styles, this.cueDiv);

        // Create an absolutely positioned div that will be used to position the cue
        // div. Note, all WebVTT cue-setting alignments are equivalent to the CSS
        // mirrors of them except "middle" which is "center" in CSS.
        this.div = window.document.createElement("div");
        styles = {
            textAlign: cue.align === "middle" ? "center" : cue.align,
            font: styleOptions.font,
            whiteSpace: "pre-line",
            position: "absolute"
        };

        if (!isIE8) {
            styles.direction = determineBidi(this.cueDiv);
            styles.writingMode = cue.vertical === "" ? "horizontal-tb"
                : cue.vertical === "lr" ? "vertical-lr"
                : "vertical-rl".
                stylesunicodeBidi =  "plaintext";
        }

        this.applyStyles(styles);

        this.div.appendChild(this.cueDiv);

        // Calculate the distance from the reference edge of the viewport to the text
        // position of the cue box. The reference edge will be resolved later when
        // the box orientation styles are applied.
        var textPos = 0;
        switch (cue.positionAlign) {
            case "start":
                textPos = cue.position;
                break;
            case "middle":
                textPos = cue.position - (cue.size / 2);
                break;
            case "end":
                textPos = cue.position - cue.size;
                break;
        }

        // Horizontal box orientation; textPos is the distance from the left edge of the
        // area to the left edge of the box and cue.size is the distance extending to
        // the right from there.
        if (cue.vertical === "") {
            this.applyStyles({
                left:  this.formatStyle(textPos, "%"),
                width: this.formatStyle(cue.size, "%")
            });
            // Vertical box orientation; textPos is the distance from the top edge of the
            // area to the top edge of the box and cue.size is the height extending
            // downwards from there.
        } else {
            this.applyStyles({
                top: this.formatStyle(textPos, "%"),
                height: this.formatStyle(cue.size, "%")
            });
        }

        this.move = function(box) {
            this.applyStyles({
                top: this.formatStyle(box.top, "px"),
                bottom: this.formatStyle(box.bottom, "px"),
                left: this.formatStyle(box.left, "px"),
                right: this.formatStyle(box.right, "px"),
                height: this.formatStyle(box.height, "px"),
                width: this.formatStyle(box.width, "px")
            });
        };
    }
    CueStyleBox.prototype = _objCreate(StyleBox.prototype);
    CueStyleBox.prototype.constructor = CueStyleBox;

    // Represents the co-ordinates of an Element in a way that we can easily
    // compute things with such as if it overlaps or intersects with another Element.
    // Can initialize it with either a StyleBox or another BoxPosition.
    function BoxPosition(obj) {
        var isIE8 = (/MSIE\s8\.0/).test(navigator.userAgent);

        // Either a BoxPosition was passed in and we need to copy it, or a StyleBox
        // was passed in and we need to copy the results of 'getBoundingClientRect'
        // as the object returned is readonly. All co-ordinate values are in reference
        // to the viewport origin (top left).
        var lh, height, width, top;
        if (obj.div) {
            height = obj.div.offsetHeight;
            width = obj.div.offsetWidth;
            top = obj.div.offsetTop;

            var rects = (rects = obj.div.childNodes) && (rects = rects[0]) &&
                rects.getClientRects && rects.getClientRects();
            obj = obj.div.getBoundingClientRect();
            // In certain cases the outter div will be slightly larger then the sum of
            // the inner div's lines. This could be due to bold text, etc, on some platforms.
            // In this case we should get the average line height and use that. This will
            // result in the desired behaviour.
            lh = rects ? Math.max((rects[0] && rects[0].height) || 0, obj.height / rects.length)
                : 0;

        }
        this.left = obj.left;
        this.right = obj.right;
        this.top = obj.top || top;
        this.height = obj.height || height;
        this.bottom = obj.bottom || (top + (obj.height || height));
        this.width = obj.width || width;
        this.lineHeight = lh !== undefined ? lh : obj.lineHeight;

        if (isIE8 && !this.lineHeight) {
            this.lineHeight = 13;
        }
    }

    // Move the box along a particular axis. Optionally pass in an amount to move
    // the box. If no amount is passed then the default is the line height of the
    // box.
    BoxPosition.prototype.move = function(axis, toMove) {
        toMove = toMove !== undefined ? toMove : this.lineHeight;
        switch (axis) {
            case "+x":
                this.left += toMove;
                this.right += toMove;
                break;
            case "-x":
                this.left -= toMove;
                this.right -= toMove;
                break;
            case "+y":
                this.top += toMove;
                this.bottom += toMove;
                break;
            case "-y":
                this.top -= toMove;
                this.bottom -= toMove;
                break;
        }
    };

    // Check if this box overlaps another box, b2.
    BoxPosition.prototype.overlaps = function(b2) {
        return this.left < b2.right &&
            this.right > b2.left &&
            this.top < b2.bottom &&
            this.bottom > b2.top;
    };

    // Check if this box overlaps any other boxes in boxes.
    BoxPosition.prototype.overlapsAny = function(boxes) {
        for (var i = 0; i < boxes.length; i++) {
            if (this.overlaps(boxes[i])) {
                return true;
            }
        }
        return false;
    };

    // Check if this box is within another box.
    BoxPosition.prototype.within = function(container) {
        return this.top >= container.top &&
            this.bottom <= container.bottom &&
            this.left >= container.left &&
            this.right <= container.right;
    };

    // Check if this box is entirely within the container or it is overlapping
    // on the edge opposite of the axis direction passed. For example, if "+x" is
    // passed and the box is overlapping on the left edge of the container, then
    // return true.
    BoxPosition.prototype.overlapsOppositeAxis = function(container, axis) {
        switch (axis) {
            case "+x":
                return this.left < container.left;
            case "-x":
                return this.right > container.right;
            case "+y":
                return this.top < container.top;
            case "-y":
                return this.bottom > container.bottom;
        }
    };

    // Find the percentage of the area that this box is overlapping with another
    // box.
    BoxPosition.prototype.intersectPercentage = function(b2) {
        var x = Math.max(0, Math.min(this.right, b2.right) - Math.max(this.left, b2.left)),
            y = Math.max(0, Math.min(this.bottom, b2.bottom) - Math.max(this.top, b2.top)),
            intersectArea = x * y;
        return intersectArea / (this.height * this.width);
    };

    // Convert the positions from this box to CSS compatible positions using
    // the reference container's positions. This has to be done because this
    // box's positions are in reference to the viewport origin, whereas, CSS
    // values are in referecne to their respective edges.
    BoxPosition.prototype.toCSSCompatValues = function(reference) {
        return {
            top: this.top - reference.top,
            bottom: reference.bottom - this.bottom,
            left: this.left - reference.left,
            right: reference.right - this.right,
            height: this.height,
            width: this.width
        };
    };

    // Get an object that represents the box's position without anything extra.
    // Can pass a StyleBox, HTMLElement, or another BoxPositon.
    BoxPosition.getSimpleBoxPosition = function(obj) {
        var height = obj.div ? obj.div.offsetHeight : obj.tagName ? obj.offsetHeight : 0;
        var width = obj.div ? obj.div.offsetWidth : obj.tagName ? obj.offsetWidth : 0;
        var top = obj.div ? obj.div.offsetTop : obj.tagName ? obj.offsetTop : 0;

        obj = obj.div ? obj.div.getBoundingClientRect() :
            obj.tagName ? obj.getBoundingClientRect() : obj;
        var ret = {
            left: obj.left,
            right: obj.right,
            top: obj.top || top,
            height: obj.height || height,
            bottom: obj.bottom || (top + (obj.height || height)),
            width: obj.width || width
        };
        return ret;
    };

    // Move a StyleBox to its specified, or next best, position. The containerBox
    // is the box that contains the StyleBox, such as a div. boxPositions are
    // a list of other boxes that the styleBox can't overlap with.
    function moveBoxToLinePosition(window, styleBox, containerBox, boxPositions) {

        // Find the best position for a cue box, b, on the video. The axis parameter
        // is a list of axis, the order of which, it will move the box along. For example:
        // Passing ["+x", "-x"] will move the box first along the x axis in the positive
        // direction. If it doesn't find a good position for it there it will then move
        // it along the x axis in the negative direction.
        function findBestPosition(b, axis) {
            var bestPosition,
                specifiedPosition = new BoxPosition(b),
                percentage = 1; // Highest possible so the first thing we get is better.

            for (var i = 0; i < axis.length; i++) {
                while (b.overlapsOppositeAxis(containerBox, axis[i]) ||
                    (b.within(containerBox) && b.overlapsAny(boxPositions))) {
                    b.move(axis[i]);
                }
                // We found a spot where we aren't overlapping anything. This is our
                // best position.
                if (b.within(containerBox)) {
                    return b;
                }
                var p = b.intersectPercentage(containerBox);
                // If we're outside the container box less then we were on our last try
                // then remember this position as the best position.
                if (percentage > p) {
                    bestPosition = new BoxPosition(b);
                    percentage = p;
                }
                // Reset the box position to the specified position.
                b = new BoxPosition(specifiedPosition);
            }
            return bestPosition || specifiedPosition;
        }

        var boxPosition = new BoxPosition(styleBox),
            cue = styleBox.cue,
            linePos = computeLinePos(cue),
            axis = [];

        // If we have a line number to align the cue to.
        if (cue.snapToLines) {
            var size;
            switch (cue.vertical) {
                case "":
                    axis = [ "+y", "-y" ];
                    size = "height";
                    break;
                case "rl":
                    axis = [ "+x", "-x" ];
                    size = "width";
                    break;
                case "lr":
                    axis = [ "-x", "+x" ];
                    size = "width";
                    break;
            }

            var step = boxPosition.lineHeight,
                position = step * Math.round(linePos),
                maxPosition = containerBox[size] + step,
                initialAxis = axis[0];

            // If the specified intial position is greater then the max position then
            // clamp the box to the amount of steps it would take for the box to
            // reach the max position.
            if (Math.abs(position) > maxPosition) {
                position = position < 0 ? -1 : 1;
                position *= Math.ceil(maxPosition / step) * step;
            }

            // If computed line position returns negative then line numbers are
            // relative to the bottom of the video instead of the top. Therefore, we
            // need to increase our initial position by the length or width of the
            // video, depending on the writing direction, and reverse our axis directions.
            if (linePos < 0) {
                position += cue.vertical === "" ? containerBox.height : containerBox.width;
                axis = axis.reverse();
            }

            // Move the box to the specified position. This may not be its best
            // position.
            boxPosition.move(initialAxis, position);

        } else {
            // If we have a percentage line value for the cue.
            var calculatedPercentage = (boxPosition.lineHeight / containerBox.height) * 100;

            switch (cue.lineAlign) {
                case "middle":
                    linePos -= (calculatedPercentage / 2);
                    break;
                case "end":
                    linePos -= calculatedPercentage;
                    break;
            }

            // Apply initial line position to the cue box.
            switch (cue.vertical) {
                case "":
                    styleBox.applyStyles({
                        top: styleBox.formatStyle(linePos, "%")
                    });
                    break;
                case "rl":
                    styleBox.applyStyles({
                        left: styleBox.formatStyle(linePos, "%")
                    });
                    break;
                case "lr":
                    styleBox.applyStyles({
                        right: styleBox.formatStyle(linePos, "%")
                    });
                    break;
            }

            axis = [ "+y", "-x", "+x", "-y" ];

            // Get the box position again after we've applied the specified positioning
            // to it.
            boxPosition = new BoxPosition(styleBox);
        }

        var bestPosition = findBestPosition(boxPosition, axis);
        styleBox.move(bestPosition.toCSSCompatValues(containerBox));
    }

    function WebVTT() {
        // Nothing
    }

    // Helper to allow strings to be decoded instead of the default binary utf8 data.
    WebVTT.StringDecoder = function() {
        return {
            decode: function(data) {
                if (!data) {
                    return "";
                }
                if (typeof data !== "string") {
                    throw new Error("Error - expected string data.");
                }
                return decodeURIComponent(encodeURIComponent(data));
            }
        };
    };

    WebVTT.convertCueToDOMTree = function(window, cuetext) {
        if (!window || !cuetext) {
            return null;
        }
        return parseContent(window, cuetext);
    };

    var FONT_SIZE_PERCENT = 0.05;
    var FONT_STYLE = "sans-serif";
    var CUE_BACKGROUND_PADDING = "1.5%";

    // Runs the processing model over the cues and regions passed to it.
    // @param overlay A block level element (usually a div) that the computed cues
    //                and regions will be placed into.
    WebVTT.processCues = function(window, cues, overlay) {
        if (!window || !cues || !overlay) {
            return null;
        }

        // Remove all previous children.
        while (overlay.firstChild) {
            overlay.removeChild(overlay.firstChild);
        }

        var paddedOverlay = window.document.createElement("div");
        paddedOverlay.style.position = "absolute";
        paddedOverlay.style.left = "0";
        paddedOverlay.style.right = "0";
        paddedOverlay.style.top = "0";
        paddedOverlay.style.bottom = "0";
        paddedOverlay.style.margin = CUE_BACKGROUND_PADDING;
        overlay.appendChild(paddedOverlay);

        // Determine if we need to compute the display states of the cues. This could
        // be the case if a cue's state has been changed since the last computation or
        // if it has not been computed yet.
        function shouldCompute(cues) {
            for (var i = 0; i < cues.length; i++) {
                if (cues[i].hasBeenReset || !cues[i].displayState) {
                    return true;
                }
            }
            return false;
        }

        // We don't need to recompute the cues' display states. Just reuse them.
        if (!shouldCompute(cues)) {
            for (var i = 0; i < cues.length; i++) {
                paddedOverlay.appendChild(cues[i].displayState);
            }
            return;
        }

        var boxPositions = [],
            containerBox = BoxPosition.getSimpleBoxPosition(paddedOverlay),
            fontSize = Math.round(containerBox.height * FONT_SIZE_PERCENT * 100) / 100;
        var styleOptions = {
            font: fontSize + "px " + FONT_STYLE
        };

        (function() {
            var styleBox, cue;

            for (var i = 0; i < cues.length; i++) {
                cue = cues[i];

                // Compute the intial position and styles of the cue div.
                styleBox = new CueStyleBox(window, cue, styleOptions);
                paddedOverlay.appendChild(styleBox.div);

                // Move the cue div to it's correct line position.
                moveBoxToLinePosition(window, styleBox, containerBox, boxPositions);

                // Remember the computed div so that we don't have to recompute it later
                // if we don't have too.
                cue.displayState = styleBox.div;

                boxPositions.push(BoxPosition.getSimpleBoxPosition(styleBox));
            }
        })();
    };

    WebVTT.Parser = function(window, vttjs, decoder) {
        if (!decoder) {
            decoder = vttjs;
            vttjs = {};
        }
        if (!vttjs) {
            vttjs = {};
        }

        this.window = window;
        this.vttjs = vttjs;
        this.state = "INITIAL";
        this.buffer = "";
        this.decoder = decoder || new TextDecoder("utf8");
        this.regionList = [];
    };

    WebVTT.Parser.prototype = {
        // If the error is a ParsingError then report it to the consumer if
        // possible. If it's not a ParsingError then throw it like normal.
        reportOrThrowError: function(e) {
            if (e instanceof ParsingError) {
                this.onparsingerror && this.onparsingerror(e);
            } else {
                throw e;
            }
        },
        parse: function (data) {
            var self = this;

            // If there is no data then we won't decode it, but will just try to parse
            // whatever is in buffer already. This may occur in circumstances, for
            // example when flush() is called.
            if (data) {
                // Try to decode the data that we received.
                self.buffer += self.decoder.decode(data, {stream: true});
            }

            function collectNextLine() {
                var buffer = self.buffer;
                var pos = 0;
                while (pos < buffer.length && buffer[pos] !== '\r' && buffer[pos] !== '\n') {
                    ++pos;
                }
                var line = buffer.substr(0, pos);
                // Advance the buffer early in case we fail below.
                if (buffer[pos] === '\r') {
                    ++pos;
                }
                if (buffer[pos] === '\n') {
                    ++pos;
                }
                self.buffer = buffer.substr(pos);
                return line;
            }

            // 3.4 WebVTT region and WebVTT region settings syntax
            function parseRegion(input) {
                var settings = new Settings();

                parseOptions(input, function (k, v) {
                    switch (k) {
                        case "id":
                            settings.set(k, v);
                            break;
                        case "width":
                            settings.percent(k, v);
                            break;
                        case "lines":
                            settings.integer(k, v);
                            break;
                        case "regionanchor":
                        case "viewportanchor":
                            var xy = v.split(',');
                            if (xy.length !== 2) {
                                break;
                            }
                            // We have to make sure both x and y parse, so use a temporary
                            // settings object here.
                            var anchor = new Settings();
                            anchor.percent("x", xy[0]);
                            anchor.percent("y", xy[1]);
                            if (!anchor.has("x") || !anchor.has("y")) {
                                break;
                            }
                            settings.set(k + "X", anchor.get("x"));
                            settings.set(k + "Y", anchor.get("y"));
                            break;
                        case "scroll":
                            settings.alt(k, v, ["up"]);
                            break;
                    }
                }, /=/, /\s/);

                // Create the region, using default values for any values that were not
                // specified.
                if (settings.has("id")) {
                    var region = new (self.vttjs.VTTRegion || self.window.VTTRegion)();
                    region.width = settings.get("width", 100);
                    region.lines = settings.get("lines", 3);
                    region.regionAnchorX = settings.get("regionanchorX", 0);
                    region.regionAnchorY = settings.get("regionanchorY", 100);
                    region.viewportAnchorX = settings.get("viewportanchorX", 0);
                    region.viewportAnchorY = settings.get("viewportanchorY", 100);
                    region.scroll = settings.get("scroll", "");
                    // Register the region.
                    self.onregion && self.onregion(region);
                    // Remember the VTTRegion for later in case we parse any VTTCues that
                    // reference it.
                    self.regionList.push({
                        id: settings.get("id"),
                        region: region
                    });
                }
            }

            // 3.2 WebVTT metadata header syntax
            function parseHeader(input) {
                parseOptions(input, function (k, v) {
                    switch (k) {
                        case "Region":
                            // 3.3 WebVTT region metadata header syntax
                            parseRegion(v);
                            break;
                    }
                }, /:/);
            }

            // 5.1 WebVTT file parsing.
            try {
                var line;
                if (self.state === "INITIAL") {
                    // We can't start parsing until we have the first line.
                    if (!/\r\n|\n/.test(self.buffer)) {
                        return this;
                    }

                    line = collectNextLine();

                    var m = line.match(/^WEBVTT([ \t].*)?$/);
                    if (!m || !m[0]) {
                        throw new ParsingError(ParsingError.Errors.BadSignature);
                    }

                    self.state = "HEADER";
                }

                var alreadyCollectedLine = false;
                while (self.buffer) {
                    // We can't parse a line until we have the full line.
                    if (!/\r\n|\n/.test(self.buffer)) {
                        return this;
                    }

                    if (!alreadyCollectedLine) {
                        line = collectNextLine();
                    } else {
                        alreadyCollectedLine = false;
                    }

                    switch (self.state) {
                        case "HEADER":
                            // 13-18 - Allow a header (metadata) under the WEBVTT line.
                            if (/:/.test(line)) {
                                parseHeader(line);
                            } else if (!line) {
                                // An empty line terminates the header and starts the body (cues).
                                self.state = "ID";
                            }
                            continue;
                        case "NOTE":
                            // Ignore NOTE blocks.
                            if (!line) {
                                self.state = "ID";
                            }
                            continue;
                        case "ID":
                            // Check for the start of NOTE blocks.
                            if (/^NOTE($|[ \t])/.test(line)) {
                                self.state = "NOTE";
                                break;
                            }
                            // 19-29 - Allow any number of line terminators, then initialize new cue values.
                            if (!line) {
                                continue;
                            }
                            self.cue = new (self.vttjs.VTTCue || self.window.VTTCue)(0, 0, "");
                            self.state = "CUE";
                            // 30-39 - Check if self line contains an optional identifier or timing data.
                            if (line.indexOf("-->") === -1) {
                                self.cue.id = line;
                                continue;
                            }
                        // Process line as start of a cue.
                        /*falls through*/
                        case "CUE":
                            // 40 - Collect cue timings and settings.
                            try {
                                parseCue(line, self.cue, self.regionList);
                            } catch (e) {
                                self.reportOrThrowError(e);
                                // In case of an error ignore rest of the cue.
                                self.cue = null;
                                self.state = "BADCUE";
                                continue;
                            }
                            self.state = "CUETEXT";
                            continue;
                        case "CUETEXT":
                            var hasSubstring = line.indexOf("-->") !== -1;
                            // 34 - If we have an empty line then report the cue.
                            // 35 - If we have the special substring '-->' then report the cue,
                            // but do not collect the line as we need to process the current
                            // one as a new cue.
                            if (!line || hasSubstring && (alreadyCollectedLine = true)) {
                                // We are done parsing self cue.
                                self.oncue && self.oncue(self.cue);
                                self.cue = null;
                                self.state = "ID";
                                continue;
                            }
                            if (self.cue.text) {
                                self.cue.text += "\n";
                            }
                            self.cue.text += line;
                            continue;
                        case "BADCUE": // BADCUE
                            // 54-62 - Collect and discard the remaining cue.
                            if (!line) {
                                self.state = "ID";
                            }
                            continue;
                    }
                }
            } catch (e) {
                self.reportOrThrowError(e);

                // If we are currently parsing a cue, report what we have.
                if (self.state === "CUETEXT" && self.cue && self.oncue) {
                    self.oncue(self.cue);
                }
                self.cue = null;
                // Enter BADWEBVTT state if header was not parsed correctly otherwise
                // another exception occurred so enter BADCUE state.
                self.state = self.state === "INITIAL" ? "BADWEBVTT" : "BADCUE";
            }
            return this;
        },
        flush: function () {
            var self = this;
            try {
                // Finish decoding the stream.
                self.buffer += self.decoder.decode();
                // Synthesize the end of the current cue or region.
                if (self.cue || self.state === "HEADER") {
                    self.buffer += "\n\n";
                    self.parse();
                }
                // If we've flushed, parsed, and we're still on the INITIAL state then
                // that means we don't have enough of the stream to parse the first
                // line.
                if (self.state === "INITIAL") {
                    throw new ParsingError(ParsingError.Errors.BadSignature);
                }
            } catch(e) {
                self.reportOrThrowError(e);
            }
            self.onflush && self.onflush();
            return this;
        }
    };

    global.WebVTT = WebVTT;

}(this, (this.vttjs || {})));

/**
 * Basic Ad support plugin for video.js.
 *
 * Common code to support ad integrations.
 */
(function(window, document, vjs, undefined) {
    "use strict";

    var

        /**
         * Copies properties from one or more objects onto an original.
         */
        extend = function(obj /*, arg1, arg2, ... */) {
            var arg, i, k;
            for (i=1; i<arguments.length; i++) {
                arg = arguments[i];
                for (k in arg) {
                    if (arg.hasOwnProperty(k)) {
                        obj[k] = arg[k];
                    }
                }
            }
            return obj;
        },

        /**
         * Add a handler for multiple listeners to an object that supports addEventListener() or on().
         *
         * @param {object} obj The object to which the handler will be assigned.
         * @param {mixed} events A string, array of strings, or hash of string/callback pairs.
         * @param {function} callback Invoked when specified events occur, if events param is not a hash.
         *
         * @return {object} obj The object passed in.
         */
        on = function(obj, events, handler) {

            var

                type = Object.prototype.toString.call(events),

                register = function(obj, event, handler) {
                    if (obj.addEventListener) {
                        obj.addEventListener(event, handler);
                    } else if (obj.on) {
                        obj.on(event, handler);
                    } else if (obj.attachEvent) {
                        obj.attachEvent('on' + event, handler);
                    } else {
                        throw new Error('object has no mechanism for adding event listeners');
                    }
                },

                i,
                ii;

            switch (type) {
                case '[object String]':
                    register(obj, events, handler);
                    break;
                case '[object Array]':
                    for (i = 0, ii = events.length; i<ii; i++) {
                        register(obj, events[i], handler);
                    }
                    break;
                case '[object Object]':
                    for (i in events) {
                        if (events.hasOwnProperty(i)) {
                            register(obj, i, events[i]);
                        }
                    }
                    break;
                default:
                    throw new Error('Unrecognized events parameter type: ' + type);
            }

            return obj;

        },

        /**
         * Runs the callback at the next available opportunity.
         * @see https://developer.mozilla.org/en-US/docs/Web/API/window.setImmediate
         */
        setImmediate = function(callback) {
            return (
                window.setImmediate ||
                window.requestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.setTimeout
                )(callback, 0);
        },

        /**
         * Clears a callback previously registered with `setImmediate`.
         * @param {id} id The identifier of the callback to abort
         */
        clearImmediate = function(id) {
            return (window.clearImmediate ||
                window.cancelAnimationFrame ||
                window.webkitCancelAnimationFrame ||
                window.mozCancelAnimationFrame ||
                window.clearTimeout)(id);
        },

        /**
         * If ads are not playing, pauses the player at the next available
         * opportunity. Has no effect if ads have started. This function is necessary
         * because pausing a video element while processing a `play` event on iOS can
         * cause the video element to continuously toggle between playing and paused
         * states.
         *
         * @param {object} player The video player
         */
        cancelContentPlay = function(player) {
            if (player.ads.cancelPlayTimeout) {
                // another cancellation is already in flight, so do nothing
                return;
            }

            player.ads.cancelPlayTimeout = setImmediate(function() {

                // deregister the cancel timeout so subsequent cancels are scheduled
                player.ads.cancelPlayTimeout = null;

                if (!player.paused()) {
                    player.pause();
                }
            });
        },

        /**
         * Returns an object that captures the portions of player state relevant to
         * video playback. The result of this function can be passed to
         * restorePlayerSnapshot with a player to return the player to the state it
         * was in when this function was invoked.
         * @param {object} player The advjs player object
         */
        getPlayerSnapshot = function(player) {
            var
                tech = player.el().querySelector('.vjs-tech'),
                snapshot = {
                    src: player.currentSrc(),
                    currentTime: player.currentTime(),
                    type: player.currentType()
                };

            if (tech) {
                snapshot.nativePoster = tech.poster;
            }

            return snapshot;
        },

        removeClass = function(element, className) {
            var
                classes = element.className.split(/\s+/),
                i = classes.length,
                newClasses = [];
            while (i--) {
                if (classes[i] !== className) {
                    newClasses.push(classes[i]);
                }
            }
            element.className = newClasses.join(' ');
        },

        /**
         * Attempts to modify the specified player so that its state is equivalent to
         * the state of the snapshot.
         * @param {object} snapshot - the player state to apply
         */
        restorePlayerSnapshot = function(player, snapshot) {
            var
            // the playback tech
                tech = player.el().querySelector('.vjs-tech'),

            // the number of remaining attempts to restore the snapshot
                attempts = 20,

            // finish restoring the playback state
                resume = function() {
                    player.currentTime(snapshot.currentTime);
                    //If this wasn't a postroll resume
                    if (!player.ended()) {
                        player.play();c
                    }
                },

            // determine if the video element has loaded enough of the snapshot source
            // to be ready to apply the rest of the state
                tryToResume = function() {
                    if(!tech) return;

                    if (tech.seekable === undefined) {
                        // if the tech doesn't expose the seekable time ranges, try to
                        // resume playback immediately
                        resume();
                        return;
                    }
                    if (tech.seekable.length > 0) {
                        // if some period of the video is seekable, resume playback
                        resume();
                        return;
                    }

                    // delay a bit and then check again unless we're out of attempts
                    if (attempts--) {
                        setTimeout(tryToResume, 50);
                    }
                },

            // whether the video element has been modified since the
            // snapshot was taken
                srcChanged;

            if (snapshot.nativePoster) {
                tech.poster = snapshot.nativePoster;
            }

            // Determine whether the player needs to be restored to its state
            // before ad playback began. With a custom ad display or burned-in
            // ads, the content player state hasn't been modified and so no
            // restoration is required

            if (player.src()) {
                // the player was in src attribute mode before the ad and the
                // src attribute has not been modified, no restoration is required
                // to resume playback
                srcChanged = player.src() !== snapshot.src;
            } else {
                // the player was configured through source element children
                // and the currentSrc hasn't changed, no restoration is required
                // to resume playback
                srcChanged = player.currentSrc() !== snapshot.src;
            }

            if (srcChanged) {
                // if the src changed for ad playback, reset it
                player.src({ src: snapshot.src, type: snapshot.type });
                // safari requires a call to `load` to pick up a changed source
                player.load();
                // and then resume from the snapshots time once the original src has loaded
                player.one('loadedmetadata', tryToResume);
            } else if (!player.ended()) {
                // the src didn't change and this wasn't a postroll
                // just resume playback at the current time.
                player.play();
            }
        },

        /**
         * Remove the poster attribute from the video element tech, if present. When
         * reusing a video element for multiple videos, the poster image will briefly
         * reappear while the new source loads. Removing the attribute ahead of time
         * prevents the poster from showing up between videos.
         * @param {object} player The advjs player object
         */
        removeNativePoster = function(player) {
            var tech = player.el().querySelector('.vjs-tech');
            if (tech) {
                tech.removeAttribute('poster');
            }
        },

    // ---------------------------------------------------------------------------
    // Ad Framework
    // ---------------------------------------------------------------------------

    // default framework settings
        defaults = {
            // maximum amount of time in ms to wait to receive `adsready` from the ad
            // implementation after play has been requested. Ad implementations are
            // expected to load any dynamic libraries and make any requests to determine
            // ad policies for a video during this time.
            timeout: 5000,

            // maximum amount of time in ms to wait for the ad implementation to start
            // linear ad mode after `readyforpreroll` has fired. This is in addition to
            // the standard timeout.
            prerollTimeout: 100,

            // when truthy, instructs the plugin to output additional information about
            // plugin state to the video.js log. On most devices, the video.js log is
            // the same as the developer console.
            debug: false
        },

        adFramework = function(options) {
            var
                player = this,

            // merge options and defaults
                settings = extend({}, defaults, options || {}),

                fsmHandler;

            // replace the ad initializer with the ad namespace
            player.ads = {
                state: 'content-set',

                startLinearAdMode: function() {
                    player.trigger('adstart');
                },

                endLinearAdMode: function() {
                    player.trigger('adend');
                }
            };

            fsmHandler = function(event) {

                // Ad Playback State Machine
                var
                    fsm = {
                        'content-set': {
                            events: {
                                'adsready': function() {
                                    this.state = 'ads-ready';
                                },
                                'play': function() {
                                    this.state = 'ads-ready?';
                                    cancelContentPlay(player);

                                    // remove the poster so it doesn't flash between videos
                                    removeNativePoster(player);
                                }
                            }
                        },
                        'ads-ready': {
                            events: {
                                'play': function() {
                                    this.state = 'preroll?';
                                    cancelContentPlay(player);
                                }
                            }
                        },
                        'preroll?': {
                            enter: function() {
                                // change class to show that we're waiting on ads
                                player.el().className += ' vjs-ad-loading';

                                // schedule an adtimeout event to fire if we waited too long
                                player.ads.timeout = window.setTimeout(function() {
                                    player.trigger('adtimeout');
                                }, settings.prerollTimeout);

                                // signal to ad plugin that it's their opportunity to play a preroll
                                player.trigger('readyforpreroll');

                            },
                            leave: function() {
                                window.clearTimeout(player.ads.timeout);

                                clearImmediate(player.ads.cancelPlayTimeout);
                                player.ads.cancelPlayTimeout = null;

                                removeClass(player.el(), 'vjs-ad-loading');
                            },
                            events: {
                                'play': function() {
                                    cancelContentPlay(player);
                                },
                                'adstart': function() {
                                    this.state = 'ad-playback';
                                    player.el().className += ' vjs-ad-playing';
                                },
                                'adtimeout': function() {
                                    this.state = 'content-playback';
                                    player.play();
                                }
                            }
                        },
                        'ads-ready?': {
                            enter: function() {
                                player.el().className += ' vjs-ad-loading';
                                player.ads.timeout = window.setTimeout(function() {
                                    player.trigger('adtimeout');
                                }, settings.timeout);
                            },
                            leave: function() {
                                window.clearTimeout(player.ads.timeout);
                                removeClass(player.el(), 'vjs-ad-loading');
                            },
                            events: {
                                'play': function() {
                                    cancelContentPlay(player);
                                },
                                'adsready': function() {
                                    this.state = 'preroll?';
                                },
                                'adtimeout': function() {
                                    this.state = 'ad-timeout-playback';
                                }
                            }
                        },
                        'ad-timeout-playback': {
                            events: {
                                'adsready': function() {
                                    if (player.paused()) {
                                        this.state = 'ads-ready';
                                    } else {
                                        this.state = 'preroll?';
                                    }
                                },
                                'contentupdate': function() {
                                    if (player.paused()) {
                                        this.state = 'content-set';
                                    } else {
                                        this.state = 'ads-ready?';
                                    }
                                }
                            }
                        },
                        'ad-playback': {
                            enter: function() {
                                // capture current player state snapshot (playing, currentTime, src)
                                this.snapshot = getPlayerSnapshot(player);

                                // remove the poster so it doesn't flash between videos
                                removeNativePoster(player);
                            },
                            leave: function() {
                                removeClass(player.el(), 'vjs-ad-playing');
                                restorePlayerSnapshot(player, this.snapshot);
                            },
                            events: {
                                'adend': function() {
                                    this.state = 'content-playback';
                                }
                            }
                        },
                        'content-playback': {
                            events: {
                                'adstart': function() {
                                    this.state = 'ad-playback';
                                    player.el().className += ' vjs-ad-playing';

                                    // remove the poster so it doesn't flash between videos
                                    removeNativePoster(player);
                                },
                                'contentupdate': function() {
                                    if (player.paused()) {
                                        this.state = 'content-set';
                                    } else {
                                        this.state = 'ads-ready?';
                                    }
                                }
                            }
                        }
                    };

                (function(state) {

                    var noop = function() {};

                    // process the current event with a noop default handler
                    (fsm[state].events[event.type] || noop).apply(player.ads);

                    // execute leave/enter callbacks if present
                    if (state !== player.ads.state) {
                        (fsm[state].leave || noop).apply(player.ads);
                        (fsm[player.ads.state].enter || noop).apply(player.ads);

                        if (settings.debug) {
                            advjs.log('ads', state + ' -> ' + player.ads.state);
                        }
                    }

                })(player.ads.state);

            };

            // register for the events we're interested in
            on(player, vjs.Html5.Events.concat([
                // events emitted by ad plugin
                'adtimeout',
                'contentupdate',
                // events emitted by third party ad implementors
                'adsready',
                'adstart',  // startLinearAdMode()
                'adend'     // endLinearAdMode()
            ]), fsmHandler);

            // keep track of the current content source
            // if you want to change the src of the video without triggering
            // the ad workflow to restart, you can update this variable before
            // modifying the player's source
            player.ads.contentSrc = player.currentSrc();

            // implement 'contentupdate' event.
            (function(){
                var
                // check if a new src has been set, if so, trigger contentupdate
                    checkSrc = function() {
                        var src;
                        if (player.ads.state !== 'ad-playback') {
                            src = player.currentSrc();
                            if (src !== player.ads.contentSrc) {
                                player.trigger({
                                    type: 'contentupdate',
                                    oldValue: player.ads.contentSrc,
                                    newValue: src
                                });
                                player.ads.contentSrc = src;
                            }
                        }
                    };
                // loadstart reliably indicates a new src has been set
                player.on('loadstart', checkSrc);
                // check immediately in case we missed the loadstart
                setImmediate(checkSrc);
            })();

            // kick off the fsm
            if (!player.paused()) {
                // simulate a play event if we're autoplaying
                fsmHandler({type:'play'});
            }

        };

    // register the ad plugin framework
    vjs.plugin('ads', adFramework);

})(window, document, advjs);

!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.DMVAST=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

    function EventEmitter() {
        this._events = this._events || {};
        this._maxListeners = this._maxListeners || undefined;
    }
    module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
    EventEmitter.EventEmitter = EventEmitter;

    EventEmitter.prototype._events = undefined;
    EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
    EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
    EventEmitter.prototype.setMaxListeners = function(n) {
        if (!isNumber(n) || n < 0 || isNaN(n))
            throw TypeError('n must be a positive number');
        this._maxListeners = n;
        return this;
    };

    EventEmitter.prototype.emit = function(type) {
        var er, handler, len, args, i, listeners;

        if (!this._events)
            this._events = {};

        // If there is no 'error' event listener then throw.
        if (type === 'error') {
            if (!this._events.error ||
                (isObject(this._events.error) && !this._events.error.length)) {
                er = arguments[1];
                if (er instanceof Error) {
                    throw er; // Unhandled 'error' event
                }
                throw TypeError('Uncaught, unspecified "error" event.');
            }
        }

        handler = this._events[type];

        if (isUndefined(handler))
            return false;

        if (isFunction(handler)) {
            switch (arguments.length) {
                // fast cases
                case 1:
                    handler.call(this);
                    break;
                case 2:
                    handler.call(this, arguments[1]);
                    break;
                case 3:
                    handler.call(this, arguments[1], arguments[2]);
                    break;
                // slower
                default:
                    len = arguments.length;
                    args = new Array(len - 1);
                    for (i = 1; i < len; i++)
                        args[i - 1] = arguments[i];
                    handler.apply(this, args);
            }
        } else if (isObject(handler)) {
            len = arguments.length;
            args = new Array(len - 1);
            for (i = 1; i < len; i++)
                args[i - 1] = arguments[i];

            listeners = handler.slice();
            len = listeners.length;
            for (i = 0; i < len; i++)
                listeners[i].apply(this, args);
        }

        return true;
    };

    EventEmitter.prototype.addListener = function(type, listener) {
        var m;

        if (!isFunction(listener))
            throw TypeError('listener must be a function');

        if (!this._events)
            this._events = {};

        // To avoid recursion in the case that type === "newListener"! Before
        // adding it to the listeners, first emit "newListener".
        if (this._events.newListener)
            this.emit('newListener', type,
                isFunction(listener.listener) ?
                    listener.listener : listener);

        if (!this._events[type])
        // Optimize the case of one listener. Don't need the extra array object.
            this._events[type] = listener;
        else if (isObject(this._events[type]))
        // If we've already got an array, just append.
            this._events[type].push(listener);
        else
        // Adding the second element, need to change to array.
            this._events[type] = [this._events[type], listener];

        // Check for listener leak
        if (isObject(this._events[type]) && !this._events[type].warned) {
            var m;
            if (!isUndefined(this._maxListeners)) {
                m = this._maxListeners;
            } else {
                m = EventEmitter.defaultMaxListeners;
            }

            if (m && m > 0 && this._events[type].length > m) {
                this._events[type].warned = true;
                console.error('(node) warning: possible EventEmitter memory ' +
                        'leak detected. %d listeners added. ' +
                        'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
                if (typeof console.trace === 'function') {
                    // not supported in IE 10
                    console.trace();
                }
            }
        }

        return this;
    };

    EventEmitter.prototype.on = EventEmitter.prototype.addListener;

    EventEmitter.prototype.once = function(type, listener) {
        if (!isFunction(listener))
            throw TypeError('listener must be a function');

        var fired = false;

        function g() {
            this.removeListener(type, g);

            if (!fired) {
                fired = true;
                listener.apply(this, arguments);
            }
        }

        g.listener = listener;
        this.on(type, g);

        return this;
    };

// emits a 'removeListener' event iff the listener was removed
    EventEmitter.prototype.removeListener = function(type, listener) {
        var list, position, length, i;

        if (!isFunction(listener))
            throw TypeError('listener must be a function');

        if (!this._events || !this._events[type])
            return this;

        list = this._events[type];
        length = list.length;
        position = -1;

        if (list === listener ||
            (isFunction(list.listener) && list.listener === listener)) {
            delete this._events[type];
            if (this._events.removeListener)
                this.emit('removeListener', type, listener);

        } else if (isObject(list)) {
            for (i = length; i-- > 0;) {
                if (list[i] === listener ||
                    (list[i].listener && list[i].listener === listener)) {
                    position = i;
                    break;
                }
            }

            if (position < 0)
                return this;

            if (list.length === 1) {
                list.length = 0;
                delete this._events[type];
            } else {
                list.splice(position, 1);
            }

            if (this._events.removeListener)
                this.emit('removeListener', type, listener);
        }

        return this;
    };

    EventEmitter.prototype.removeAllListeners = function(type) {
        var key, listeners;

        if (!this._events)
            return this;

        // not listening for removeListener, no need to emit
        if (!this._events.removeListener) {
            if (arguments.length === 0)
                this._events = {};
            else if (this._events[type])
                delete this._events[type];
            return this;
        }

        // emit removeListener for all listeners on all events
        if (arguments.length === 0) {
            for (key in this._events) {
                if (key === 'removeListener') continue;
                this.removeAllListeners(key);
            }
            this.removeAllListeners('removeListener');
            this._events = {};
            return this;
        }

        listeners = this._events[type];

        if (isFunction(listeners)) {
            this.removeListener(type, listeners);
        } else {
            // LIFO order
            while (listeners.length)
                this.removeListener(type, listeners[listeners.length - 1]);
        }
        delete this._events[type];

        return this;
    };

    EventEmitter.prototype.listeners = function(type) {
        var ret;
        if (!this._events || !this._events[type])
            ret = [];
        else if (isFunction(this._events[type]))
            ret = [this._events[type]];
        else
            ret = this._events[type].slice();
        return ret;
    };

    EventEmitter.listenerCount = function(emitter, type) {
        var ret;
        if (!emitter._events || !emitter._events[type])
            ret = 0;
        else if (isFunction(emitter._events[type]))
            ret = 1;
        else
            ret = emitter._events[type].length;
        return ret;
    };

    function isFunction(arg) {
        return typeof arg === 'function';
    }

    function isNumber(arg) {
        return typeof arg === 'number';
    }

    function isObject(arg) {
        return typeof arg === 'object' && arg !== null;
    }

    function isUndefined(arg) {
        return arg === void 0;
    }

},{}],2:[function(_dereq_,module,exports){
// Generated by CoffeeScript 1.7.1
    var VASTAd;

    VASTAd = (function() {
        function VASTAd() {
            this.errorURLTemplates = [];
            this.impressionURLTemplates = [];
            this.creatives = [];
        }

        return VASTAd;

    })();

    module.exports = VASTAd;

},{}],3:[function(_dereq_,module,exports){
// Generated by CoffeeScript 1.7.1
    var VASTClient, VASTParser, VASTUtil;

    VASTParser = _dereq_('./parser.coffee');

    VASTUtil = _dereq_('./util.coffee');

    VASTClient = (function() {
        function VASTClient() {}

        VASTClient.cappingFreeLunch = 0;

        VASTClient.cappingMinimumTimeInterval = 0;

        VASTClient.options = {
            withCredentials: false,
            timeout: 0
        };

        VASTClient.get = function(url, opts, cb) {
            var extend, now, options;
            now = +new Date();
            extend = exports.extend = function(object, properties) {
                var key, val;
                for (key in properties) {
                    val = properties[key];
                    object[key] = val;
                }
                return object;
            };
            if (!cb) {
                if (typeof opts === 'function') {
                    cb = opts;
                }
                options = {};
            }
            options = extend(this.options, opts);
            if (this.totalCallsTimeout < now) {
                this.totalCalls = 1;
                this.totalCallsTimeout = now + (60 * 60 * 1000);
            } else {
                this.totalCalls++;
            }
            if (this.cappingFreeLunch >= this.totalCalls) {
                cb(null);
                return;
            }
            if (now - this.lastSuccessfullAd < this.cappingMinimumTimeInterval) {
                cb(null);
                return;
            }
            return VASTParser.parse(url, options, (function(_this) {
                return function(response) {
                    return cb(response);
                };
            })(this));
        };

        (function() {
            var defineProperty, storage;
            storage = VASTUtil.storage;
            defineProperty = Object.defineProperty;
            ['lastSuccessfullAd', 'totalCalls', 'totalCallsTimeout'].forEach(function(property) {
                defineProperty(VASTClient, property, {
                    get: function() {
                        return storage.getItem(property);
                    },
                    set: function(value) {
                        return storage.setItem(property, value);
                    },
                    configurable: false,
                    enumerable: true
                });
            });
            if (VASTClient.totalCalls == null) {
                VASTClient.totalCalls = 0;
            }
            if (VASTClient.totalCallsTimeout == null) {
                VASTClient.totalCallsTimeout = 0;
            }
        })();

        return VASTClient;

    })();

    module.exports = VASTClient;

},{"./parser.coffee":8,"./util.coffee":14}],4:[function(_dereq_,module,exports){
// Generated by CoffeeScript 1.7.1
    var VASTCompanionAd;

    VASTCompanionAd = (function() {
        function VASTCompanionAd() {
            this.id = null;
            this.width = 0;
            this.height = 0;
            this.type = null;
            this.staticResource = null;
            this.companionClickThroughURLTemplate = null;
            this.trackingEvents = {};
        }

        return VASTCompanionAd;

    })();

    module.exports = VASTCompanionAd;

},{}],5:[function(_dereq_,module,exports){
// Generated by CoffeeScript 1.7.1
    var VASTCreative, VASTCreativeCompanion, VASTCreativeLinear, VASTCreativeNonLinear,
        __hasProp = {}.hasOwnProperty,
        __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

    VASTCreative = (function() {
        function VASTCreative() {
            this.trackingEvents = {};
        }

        return VASTCreative;

    })();

    VASTCreativeLinear = (function(_super) {
        __extends(VASTCreativeLinear, _super);

        function VASTCreativeLinear() {
            VASTCreativeLinear.__super__.constructor.apply(this, arguments);
            this.type = "linear";
            this.duration = 0;
            this.skipDelay = null;
            this.mediaFiles = [];
            this.videoClickThroughURLTemplate = null;
            this.videoClickTrackingURLTemplates = [];
            this.adParameters = null;
        }

        return VASTCreativeLinear;

    })(VASTCreative);

    VASTCreativeNonLinear = (function(_super) {
        __extends(VASTCreativeNonLinear, _super);

        function VASTCreativeNonLinear() {
            return VASTCreativeNonLinear.__super__.constructor.apply(this, arguments);
        }

        return VASTCreativeNonLinear;

    })(VASTCreative);

    VASTCreativeCompanion = (function(_super) {
        __extends(VASTCreativeCompanion, _super);

        function VASTCreativeCompanion() {
            this.type = "companion";
            this.variations = [];
            this.videoClickTrackingURLTemplates = [];
        }

        return VASTCreativeCompanion;

    })(VASTCreative);

    module.exports = {
        VASTCreativeLinear: VASTCreativeLinear,
        VASTCreativeNonLinear: VASTCreativeNonLinear,
        VASTCreativeCompanion: VASTCreativeCompanion
    };

},{}],6:[function(_dereq_,module,exports){
// Generated by CoffeeScript 1.7.1
    module.exports = {
        client: _dereq_('./client.coffee'),
        tracker: _dereq_('./tracker.coffee'),
        parser: _dereq_('./parser.coffee'),
        util: _dereq_('./util.coffee')
    };

},{"./client.coffee":3,"./parser.coffee":8,"./tracker.coffee":10,"./util.coffee":14}],7:[function(_dereq_,module,exports){
// Generated by CoffeeScript 1.7.1
    var VASTMediaFile;

    VASTMediaFile = (function() {
        function VASTMediaFile() {
            this.id = null;
            this.fileURL = null;
            this.deliveryType = "progressive";
            this.mimeType = null;
            this.codec = null;
            this.bitrate = 0;
            this.minBitrate = 0;
            this.maxBitrate = 0;
            this.width = 0;
            this.height = 0;
            this.apiFramework = null;
            this.scalable = null;
            this.maintainAspectRatio = null;
        }

        return VASTMediaFile;

    })();

    module.exports = VASTMediaFile;

},{}],8:[function(_dereq_,module,exports){
// Generated by CoffeeScript 1.7.1
    var EventEmitter, URLHandler, VASTAd, VASTCompanionAd, VASTCreativeCompanion, VASTCreativeLinear, VASTMediaFile, VASTParser, VASTResponse, VASTUtil,
        __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

    URLHandler = _dereq_('./urlhandler.coffee');

    VASTResponse = _dereq_('./response.coffee');

    VASTAd = _dereq_('./ad.coffee');

    VASTUtil = _dereq_('./util.coffee');

    VASTCreativeLinear = _dereq_('./creative.coffee').VASTCreativeLinear;

    VASTCreativeCompanion = _dereq_('./creative.coffee').VASTCreativeCompanion;

    VASTMediaFile = _dereq_('./mediafile.coffee');

    VASTCompanionAd = _dereq_('./companionad.coffee');

    EventEmitter = _dereq_('events').EventEmitter;

    VASTParser = (function() {
        var URLTemplateFilters;

        function VASTParser() {}

        URLTemplateFilters = [];

        VASTParser.addURLTemplateFilter = function(func) {
            if (typeof func === 'function') {
                URLTemplateFilters.push(func);
            }
        };

        VASTParser.removeURLTemplateFilter = function() {
            return URLTemplateFilters.pop();
        };

        VASTParser.countURLTemplateFilters = function() {
            return URLTemplateFilters.length;
        };

        VASTParser.clearUrlTemplateFilters = function() {
            return URLTemplateFilters = [];
        };

        VASTParser.parse = function(url, options, cb) {
            if (!cb) {
                if (typeof options === 'function') {
                    cb = options;
                }
                options = {};
            }
            return this._parse(url, null, options, function(err, response) {
                return cb(response);
            });
        };

        VASTParser.vent = new EventEmitter();

        VASTParser.track = function(templates, errorCode) {
            this.vent.emit('VAST-error', errorCode);
            return VASTUtil.track(templates, errorCode);
        };

        VASTParser.on = function(eventName, cb) {
            return this.vent.on(eventName, cb);
        };

        VASTParser.once = function(eventName, cb) {
            return this.vent.once(eventName, cb);
        };

        VASTParser._parse = function(url, parentURLs, options, cb) {
            var filter, _i, _len;
            if (!cb) {
                if (typeof options === 'function') {
                    cb = options;
                }
                options = {};
            }
            for (_i = 0, _len = URLTemplateFilters.length; _i < _len; _i++) {
                filter = URLTemplateFilters[_i];
                url = filter(url);
            }
            if (parentURLs == null) {
                parentURLs = [];
            }
            parentURLs.push(url);
            return URLHandler.get(url, options, (function(_this) {
                return function(err, xml) {
                    var ad, complete, loopIndex, node, response, _j, _k, _len1, _len2, _ref, _ref1;
                    if (err != null) {
                        return cb(err);
                    }
                    response = new VASTResponse();
                    if (!(((xml != null ? xml.documentElement : void 0) != null) && xml.documentElement.nodeName === "VAST")) {
                        return cb();
                    }
                    _ref = xml.documentElement.childNodes;
                    for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
                        node = _ref[_j];
                        if (node.nodeName === 'Error') {
                            response.errorURLTemplates.push(_this.parseNodeText(node));
                        }
                    }
                    _ref1 = xml.documentElement.childNodes;
                    for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
                        node = _ref1[_k];
                        if (node.nodeName === 'Ad') {
                            ad = _this.parseAdElement(node);
                            if (ad != null) {
                                response.ads.push(ad);
                            } else {
                                _this.track(response.errorURLTemplates, {
                                    ERRORCODE: 101
                                });
                            }
                        }
                    }
                    complete = function(errorAlreadyRaised) {
                        var _l, _len3, _ref2;
                        if (errorAlreadyRaised == null) {
                            errorAlreadyRaised = false;
                        }
                        if (!response) {
                            return;
                        }
                        _ref2 = response.ads;
                        for (_l = 0, _len3 = _ref2.length; _l < _len3; _l++) {
                            ad = _ref2[_l];
                            if (ad.nextWrapperURL != null) {
                                return;
                            }
                        }
                        if (response.ads.length === 0) {
                            if (!errorAlreadyRaised) {
                                _this.track(response.errorURLTemplates, {
                                    ERRORCODE: 303
                                });
                            }
                            response = null;
                        }
                        return cb(null, response);
                    };
                    loopIndex = response.ads.length;
                    while (loopIndex--) {
                        ad = response.ads[loopIndex];
                        if (ad.nextWrapperURL == null) {
                            continue;
                        }
                        (function(ad) {
                            var baseURL, _ref2;
                            if (parentURLs.length >= 10 || (_ref2 = ad.nextWrapperURL, __indexOf.call(parentURLs, _ref2) >= 0)) {
                                _this.track(ad.errorURLTemplates, {
                                    ERRORCODE: 302
                                });
                                response.ads.splice(response.ads.indexOf(ad), 1);
                                complete();
                                return;
                            }
                            if (ad.nextWrapperURL.indexOf('://') === -1) {
                                baseURL = url.slice(0, url.lastIndexOf('/'));
                                ad.nextWrapperURL = "" + baseURL + "/" + ad.nextWrapperURL;
                            }
                            return _this._parse(ad.nextWrapperURL, parentURLs, options, function(err, wrappedResponse) {
                                var creative, errorAlreadyRaised, eventName, index, wrappedAd, _base, _l, _len3, _len4, _len5, _len6, _m, _n, _o, _ref3, _ref4, _ref5, _ref6;
                                errorAlreadyRaised = false;
                                if (err != null) {
                                    _this.track(ad.errorURLTemplates, {
                                        ERRORCODE: 301
                                    });
                                    response.ads.splice(response.ads.indexOf(ad), 1);
                                    errorAlreadyRaised = true;
                                } else if (wrappedResponse == null) {
                                    _this.track(ad.errorURLTemplates, {
                                        ERRORCODE: 303
                                    });
                                    response.ads.splice(response.ads.indexOf(ad), 1);
                                    errorAlreadyRaised = true;
                                } else {
                                    response.errorURLTemplates = response.errorURLTemplates.concat(wrappedResponse.errorURLTemplates);
                                    index = response.ads.indexOf(ad);
                                    response.ads.splice(index, 1);
                                    _ref3 = wrappedResponse.ads;
                                    for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
                                        wrappedAd = _ref3[_l];
                                        wrappedAd.errorURLTemplates = ad.errorURLTemplates.concat(wrappedAd.errorURLTemplates);
                                        wrappedAd.impressionURLTemplates = ad.impressionURLTemplates.concat(wrappedAd.impressionURLTemplates);
                                        if (ad.trackingEvents != null) {
                                            _ref4 = wrappedAd.creatives;
                                            for (_m = 0, _len4 = _ref4.length; _m < _len4; _m++) {
                                                creative = _ref4[_m];
                                                if (creative.type === 'linear') {
                                                    _ref5 = Object.keys(ad.trackingEvents);
                                                    for (_n = 0, _len5 = _ref5.length; _n < _len5; _n++) {
                                                        eventName = _ref5[_n];
                                                        (_base = creative.trackingEvents)[eventName] || (_base[eventName] = []);
                                                        creative.trackingEvents[eventName] = creative.trackingEvents[eventName].concat(ad.trackingEvents[eventName]);
                                                    }
                                                }
                                            }
                                        }
                                        if (ad.videoClickTrackingURLTemplates != null) {
                                            _ref6 = wrappedAd.creatives;
                                            for (_o = 0, _len6 = _ref6.length; _o < _len6; _o++) {
                                                creative = _ref6[_o];
                                                if (creative.type === 'linear') {
                                                    creative.videoClickTrackingURLTemplates = creative.videoClickTrackingURLTemplates.concat(ad.videoClickTrackingURLTemplates);
                                                }
                                            }
                                        }
                                        response.ads.splice(index, 0, wrappedAd);
                                    }
                                }
                                delete ad.nextWrapperURL;
                                return complete(errorAlreadyRaised);
                            });
                        })(ad);
                    }
                    return complete();
                };
            })(this));
        };

        VASTParser.childByName = function(node, name) {
            var child, _i, _len, _ref;
            _ref = node.childNodes;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                child = _ref[_i];
                if (child.nodeName === name) {
                    return child;
                }
            }
        };

        VASTParser.childsByName = function(node, name) {
            var child, childs, _i, _len, _ref;
            childs = [];
            _ref = node.childNodes;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                child = _ref[_i];
                if (child.nodeName === name) {
                    childs.push(child);
                }
            }
            return childs;
        };

        VASTParser.parseAdElement = function(adElement) {
            var adTypeElement, _i, _len, _ref;
            _ref = adElement.childNodes;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                adTypeElement = _ref[_i];
                if (adTypeElement.nodeName === "Wrapper") {
                    return this.parseWrapperElement(adTypeElement);
                } else if (adTypeElement.nodeName === "InLine") {
                    return this.parseInLineElement(adTypeElement);
                }
            }
        };

        VASTParser.parseWrapperElement = function(wrapperElement) {
            var ad, creative, wrapperCreativeElement, wrapperURLElement, _i, _len, _ref;
            ad = this.parseInLineElement(wrapperElement);
            wrapperURLElement = this.childByName(wrapperElement, "VASTAdTagURI");
            if (wrapperURLElement != null) {
                ad.nextWrapperURL = this.parseNodeText(wrapperURLElement);
            } else {
                wrapperURLElement = this.childByName(wrapperElement, "VASTAdTagURL");
                if (wrapperURLElement != null) {
                    ad.nextWrapperURL = this.parseNodeText(this.childByName(wrapperURLElement, "URL"));
                }
            }
            wrapperCreativeElement = null;
            _ref = ad.creatives;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                creative = _ref[_i];
                if (creative.type === 'linear') {
                    wrapperCreativeElement = creative;
                    break;
                }
            }
            if (wrapperCreativeElement != null) {
                if (wrapperCreativeElement.trackingEvents != null) {
                    ad.trackingEvents = wrapperCreativeElement.trackingEvents;
                }
                if (wrapperCreativeElement.videoClickTrackingURLTemplates != null) {
                    ad.videoClickTrackingURLTemplates = wrapperCreativeElement.videoClickTrackingURLTemplates;
                }
            }
            if (ad.nextWrapperURL != null) {
                return ad;
            }
        };

        VASTParser.parseInLineElement = function(inLineElement) {
            var ad, creative, creativeElement, creativeTypeElement, node, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
            ad = new VASTAd();
            _ref = inLineElement.childNodes;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                node = _ref[_i];
                switch (node.nodeName) {
                    case "Error":
                        if (this.isUrl(node)) {
                            ad.errorURLTemplates.push(this.parseNodeText(node));
                        }
                        break;
                    case "Impression":
                        if (this.isUrl(node)) {
                            ad.impressionURLTemplates.push(this.parseNodeText(node));
                        }
                        break;
                    case "Creatives":
                        _ref1 = this.childsByName(node, "Creative");
                        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                            creativeElement = _ref1[_j];
                            _ref2 = creativeElement.childNodes;
                            for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
                                creativeTypeElement = _ref2[_k];
                                switch (creativeTypeElement.nodeName) {
                                    case "Linear":
                                        creative = this.parseCreativeLinearElement(creativeTypeElement);
                                        if (creative) {
                                            ad.creatives.push(creative);
                                        }
                                        break;
                                    case "CompanionAds":
                                        creative = this.parseCompanionAd(creativeTypeElement);
                                        if (creative) {
                                            ad.creatives.push(creative);
                                        }
                                }
                            }
                        }
                }
            }
            return ad;
        };

        VASTParser.parseCreativeLinearElement = function(creativeElement) {
            var adParamsElement, clickTrackingElement, creative, eventName, maintainAspectRatio, mediaFile, mediaFileElement, mediaFilesElement, percent, scalable, skipOffset, trackingElement, trackingEventsElement, trackingURLTemplate, videoClicksElement, _base, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2, _ref3, _ref4;
            creative = new VASTCreativeLinear();
            creative.duration = this.parseDuration(this.parseNodeText(this.childByName(creativeElement, "Duration")));
            if (creative.duration === -1 && creativeElement.parentNode.parentNode.parentNode.nodeName !== 'Wrapper') {
                return null;
            }
            skipOffset = creativeElement.getAttribute("skipoffset");
            if (skipOffset == null) {
                creative.skipDelay = null;
            } else if (skipOffset.charAt(skipOffset.length - 1) === "%") {
                percent = parseInt(skipOffset, 10);
                creative.skipDelay = creative.duration * (percent / 100);
            } else {
                creative.skipDelay = this.parseDuration(skipOffset);
            }
            videoClicksElement = this.childByName(creativeElement, "VideoClicks");
            if (videoClicksElement != null) {
                creative.videoClickThroughURLTemplate = this.parseNodeText(this.childByName(videoClicksElement, "ClickThrough"));
                _ref = this.childsByName(videoClicksElement, "ClickTracking");
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    clickTrackingElement = _ref[_i];
                    //console.log(this.parseNodeText(clickTrackingElement));
                    creative.videoClickTrackingURLTemplates.push(this.parseNodeText(clickTrackingElement));
                }
            }
            adParamsElement = this.childByName(creativeElement, "AdParameters");
            if (adParamsElement != null) {
                creative.adParameters = this.parseNodeText(adParamsElement);
            }
            _ref1 = this.childsByName(creativeElement, "TrackingEvents");
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                trackingEventsElement = _ref1[_j];
                _ref2 = this.childsByName(trackingEventsElement, "Tracking");
                for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
                    trackingElement = _ref2[_k];
                    eventName = trackingElement.getAttribute("event");
                    trackingURLTemplate = this.parseNodeText(trackingElement);
                    if ((eventName != null) && (trackingURLTemplate != null)) {
                        if ((_base = creative.trackingEvents)[eventName] == null) {
                            _base[eventName] = [];
                        }
                        creative.trackingEvents[eventName].push(trackingURLTemplate);
                    }
                }
            }
            _ref3 = this.childsByName(creativeElement, "MediaFiles");
            for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
                mediaFilesElement = _ref3[_l];
                _ref4 = this.childsByName(mediaFilesElement, "MediaFile");
                for (_m = 0, _len4 = _ref4.length; _m < _len4; _m++) {
                    mediaFileElement = _ref4[_m];
                    mediaFile = new VASTMediaFile();
                    mediaFile.id = mediaFileElement.getAttribute("id");
                    mediaFile.fileURL = this.parseNodeText(mediaFileElement);
                    mediaFile.deliveryType = mediaFileElement.getAttribute("delivery");
                    mediaFile.codec = mediaFileElement.getAttribute("codec");
                    mediaFile.mimeType = mediaFileElement.getAttribute("type");
                    mediaFile.apiFramework = mediaFileElement.getAttribute("apiFramework");
                    mediaFile.bitrate = parseInt(mediaFileElement.getAttribute("bitrate") || 0);
                    mediaFile.minBitrate = parseInt(mediaFileElement.getAttribute("minBitrate") || 0);
                    mediaFile.maxBitrate = parseInt(mediaFileElement.getAttribute("maxBitrate") || 0);
                    mediaFile.width = parseInt(mediaFileElement.getAttribute("width") || 0);
                    mediaFile.height = parseInt(mediaFileElement.getAttribute("height") || 0);
                    scalable = mediaFileElement.getAttribute("scalable");
                    if (scalable && typeof scalable === "string") {
                        scalable = scalable.toLowerCase();
                        if (scalable === "true") {
                            mediaFile.scalable = true;
                        } else if (scalable === "false") {
                            mediaFile.scalable = false;
                        }
                    }
                    maintainAspectRatio = mediaFileElement.getAttribute("maintainAspectRatio");
                    if (maintainAspectRatio && typeof maintainAspectRatio === "string") {
                        maintainAspectRatio = maintainAspectRatio.toLowerCase();
                        if (maintainAspectRatio === "true") {
                            mediaFile.maintainAspectRatio = true;
                        } else if (maintainAspectRatio === "false") {
                            mediaFile.maintainAspectRatio = false;
                        }
                    }
                    creative.mediaFiles.push(mediaFile);
                }
            }
            return creative;
        };

        VASTParser.parseCompanionAd = function(creativeElement) {
            var companionAd, companionResource, creative, eventName, htmlElement, iframeElement, staticElement, trackingElement, trackingEventsElement, trackingURLTemplate, _base, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _m, _n, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
            creative = new VASTCreativeCompanion();
            _ref = this.childsByName(creativeElement, "Companion");
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                companionResource = _ref[_i];
                companionAd = new VASTCompanionAd();
                companionAd.id = companionResource.getAttribute("id") || null;
                companionAd.width = companionResource.getAttribute("width");
                companionAd.height = companionResource.getAttribute("height");
                _ref1 = this.childsByName(companionResource, "HTMLResource");
                for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                    htmlElement = _ref1[_j];
                    companionAd.type = htmlElement.getAttribute("creativeType") || 0;
                    companionAd.htmlResource = this.parseNodeText(htmlElement);
                }
                _ref2 = this.childsByName(companionResource, "IFrameResource");
                for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
                    iframeElement = _ref2[_k];
                    companionAd.type = iframeElement.getAttribute("creativeType") || 0;
                    companionAd.iframeResource = this.parseNodeText(iframeElement);
                }
                _ref3 = this.childsByName(companionResource, "StaticResource");
                for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
                    staticElement = _ref3[_l];
                    companionAd.type = staticElement.getAttribute("creativeType") || 0;
                    companionAd.staticResource = this.parseNodeText(staticElement);
                }
                _ref4 = this.childsByName(companionResource, "TrackingEvents");
                for (_m = 0, _len4 = _ref4.length; _m < _len4; _m++) {
                    trackingEventsElement = _ref4[_m];
                    _ref5 = this.childsByName(trackingEventsElement, "Tracking");
                    for (_n = 0, _len5 = _ref5.length; _n < _len5; _n++) {
                        trackingElement = _ref5[_n];
                        eventName = trackingElement.getAttribute("event");
                        trackingURLTemplate = this.parseNodeText(trackingElement);
                        if ((eventName != null) && (trackingURLTemplate != null)) {
                            if ((_base = companionAd.trackingEvents)[eventName] == null) {
                                _base[eventName] = [];
                            }
                            companionAd.trackingEvents[eventName].push(trackingURLTemplate);
                        }
                    }
                }
                companionAd.companionClickThroughURLTemplate = this.parseNodeText(this.childByName(companionResource, "CompanionClickThrough"));
                creative.variations.push(companionAd);
            }
            return creative;
        };

        VASTParser.parseDuration = function(durationString) {
            var durationComponents, hours, minutes, seconds, secondsAndMS;
            if (!(durationString != null)) {
                return -1;
            }
            durationComponents = durationString.split(":");
            if (durationComponents.length !== 3) {
                return -1;
            }
            secondsAndMS = durationComponents[2].split(".");
            seconds = parseInt(secondsAndMS[0]);
            if (secondsAndMS.length === 2) {
                seconds += parseFloat("0." + secondsAndMS[1]);
            }
            minutes = parseInt(durationComponents[1] * 60);
            hours = parseInt(durationComponents[0] * 60 * 60);
            if (isNaN(hours || isNaN(minutes || isNaN(seconds || minutes > 60 * 60 || seconds > 60)))) {
                return -1;
            }
            return hours + minutes + seconds;
        };

        VASTParser.parseNodeText = function(node) {
            return node && (node.textContent || node.text || '').trim();
        };

        VASTParser.isUrl = function(node) {
            return /[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?//=]*)/i.test(this.parseNodeText(node));
        };

        return VASTParser;

    })();

    module.exports = VASTParser;

},{"./ad.coffee":2,"./companionad.coffee":4,"./creative.coffee":5,"./mediafile.coffee":7,"./response.coffee":9,"./urlhandler.coffee":11,"./util.coffee":14,"events":1}],9:[function(_dereq_,module,exports){
// Generated by CoffeeScript 1.7.1
    var VASTResponse;

    VASTResponse = (function() {
        function VASTResponse() {
            this.ads = [];
            this.errorURLTemplates = [];
        }

        return VASTResponse;

    })();

    module.exports = VASTResponse;

},{}],10:[function(_dereq_,module,exports){
// Generated by CoffeeScript 1.7.1
    var EventEmitter, VASTClient, VASTCreativeLinear, VASTTracker, VASTUtil,
        __hasProp = {}.hasOwnProperty,
        __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

    VASTClient = _dereq_('./client.coffee');

    VASTUtil = _dereq_('./util.coffee');

    VASTCreativeLinear = _dereq_('./creative.coffee').VASTCreativeLinear;

    EventEmitter = _dereq_('events').EventEmitter;

    VASTTracker = (function(_super) {
        __extends(VASTTracker, _super);

        function VASTTracker(ad, creative) {
            var eventName, events, _ref;
            this.ad = ad;
            this.creative = creative;
            this.muted = false;
            this.impressed = false;
            this.skipable = false;
            this.skipDelayDefault = -1;
            this.trackingEvents = {};
            this.emitAlwaysEvents = ['creativeView', 'start', 'firstQuartile', 'midpoint', 'thirdQuartile', 'complete', 'resume', 'pause', 'rewind', 'skip', 'closeLinear', 'close'];
            _ref = creative.trackingEvents;
            for (eventName in _ref) {
                events = _ref[eventName];
                this.trackingEvents[eventName] = events.slice(0);
            }
            if (creative instanceof VASTCreativeLinear) {
                this.setDuration(creative.duration);
                this.skipDelay = creative.skipDelay;
                this.linear = true;
                this.clickThroughURLTemplate = creative.videoClickThroughURLTemplate;
                this.clickTrackingURLTemplates = creative.videoClickTrackingURLTemplates;
            } else {
                this.skipDelay = -1;
                this.linear = false;
            }
            this.on('start', function() {
                VASTClient.lastSuccessfullAd = +new Date();
            });
        }

        VASTTracker.prototype.setDuration = function(duration) {
            this.assetDuration = duration;
            return this.quartiles = {
                'firstQuartile': Math.round(25 * this.assetDuration) / 100,
                'midpoint': Math.round(50 * this.assetDuration) / 100,
                'thirdQuartile': Math.round(75 * this.assetDuration) / 100
            };
        };

        VASTTracker.prototype.setProgress = function(progress) {
            var eventName, events, percent, quartile, skipDelay, time, _i, _len, _ref;
            skipDelay = this.skipDelay === null ? this.skipDelayDefault : this.skipDelay;
            if (skipDelay !== -1 && !this.skipable) {
                if (skipDelay > progress) {
                    this.emit('skip-countdown', skipDelay - progress);
                } else {
                    this.skipable = true;
                    this.emit('skip-countdown', 0);
                }
            }
            if (this.linear && this.assetDuration > 0) {
                events = [];
                if (progress > 0) {
                    events.push("start");
                    percent = Math.round(progress / this.assetDuration * 100);
                    events.push("progress-" + percent + "%");
                    _ref = this.quartiles;
                    for (quartile in _ref) {
                        time = _ref[quartile];
                        if ((time <= progress && progress <= (time + 1))) {
                            events.push(quartile);
                        }
                    }
                }
                for (_i = 0, _len = events.length; _i < _len; _i++) {
                    eventName = events[_i];
                    this.track(eventName, true);
                }
                if (progress < this.progress) {
                    this.track("rewind");
                }
            }
            return this.progress = progress;
        };

        VASTTracker.prototype.setMuted = function(muted) {
            if (this.muted !== muted) {
                this.track(muted ? "mute" : "unmute");
            }
            return this.muted = muted;
        };

        VASTTracker.prototype.setPaused = function(paused) {
            if (this.paused !== paused) {
                this.track(paused ? "pause" : "resume");
            }
            return this.paused = paused;
        };

        VASTTracker.prototype.setFullscreen = function(fullscreen) {
            if (this.fullscreen !== fullscreen) {
                this.track(fullscreen ? "fullscreen" : "exitFullscreen");
            }
            return this.fullscreen = fullscreen;
        };

        VASTTracker.prototype.setSkipDelay = function(duration) {
            if (typeof duration === 'number') {
                return this.skipDelay = duration;
            }
        };

        VASTTracker.prototype.load = function() {
            if (!this.impressed) {
                this.impressed = true;
                this.trackURLs(this.ad.impressionURLTemplates);
                return this.track("creativeView");
            }
        };

        VASTTracker.prototype.errorWithCode = function(errorCode) {
            return this.trackURLs(this.ad.errorURLTemplates, {
                ERRORCODE: errorCode
            });
        };

        VASTTracker.prototype.complete = function() {
            return this.track("complete");
        };

        VASTTracker.prototype.stop = function() {
            return this.track(this.linear ? "closeLinear" : "close");
        };

        VASTTracker.prototype.skip = function() {
            this.track("skip");
            return this.trackingEvents = [];
        };

        VASTTracker.prototype.click = function() {
            var clickThroughURL, variables, _ref;
            if ((_ref = this.clickTrackingURLTemplates) != null ? _ref.length : void 0) {
                this.trackURLs(this.clickTrackingURLTemplates);
            }
            if (this.clickThroughURLTemplate != null) {
                if (this.linear) {
                    variables = {
                        CONTENTPLAYHEAD: this.progressFormated()
                    };
                }
                clickThroughURL = VASTUtil.resolveURLTemplates([this.clickThroughURLTemplate], variables)[0];
                return this.emit("clickthrough", clickThroughURL);
            }
        };

        VASTTracker.prototype.track = function(eventName, once) {
            var idx, trackingURLTemplates;
            if (once == null) {
                once = false;
            }
            if (eventName === 'closeLinear' && ((this.trackingEvents[eventName] == null) && (this.trackingEvents['close'] != null))) {
                eventName = 'close';
            }
            trackingURLTemplates = this.trackingEvents[eventName];
            idx = this.emitAlwaysEvents.indexOf(eventName);
            if (trackingURLTemplates != null) {
                this.emit(eventName, '');
                this.trackURLs(trackingURLTemplates);
            } else if (idx !== -1) {
                this.emit(eventName, '');
            }
            if (once === true) {
                delete this.trackingEvents[eventName];
                if (idx > -1) {
                    this.emitAlwaysEvents.splice(idx, 1);
                }
            }
        };

        VASTTracker.prototype.trackURLs = function(URLTemplates, variables) {
            if (variables == null) {
                variables = {};
            }
            if (this.linear) {
                variables["CONTENTPLAYHEAD"] = this.progressFormated();
            }
            return VASTUtil.track(URLTemplates, variables);
        };

        VASTTracker.prototype.progressFormated = function() {
            var h, m, ms, s, seconds;
            seconds = parseInt(this.progress);
            h = seconds / (60 * 60);
            if (h.length < 2) {
                h = "0" + h;
            }
            m = seconds / 60 % 60;
            if (m.length < 2) {
                m = "0" + m;
            }
            s = seconds % 60;
            if (s.length < 2) {
                s = "0" + m;
            }
            ms = parseInt((this.progress - seconds) * 100);
            return "" + h + ":" + m + ":" + s + "." + ms;
        };

        return VASTTracker;

    })(EventEmitter);

    module.exports = VASTTracker;

},{"./client.coffee":3,"./creative.coffee":5,"./util.coffee":14,"events":1}],11:[function(_dereq_,module,exports){
// Generated by CoffeeScript 1.7.1
    var URLHandler, flash, xhr;

    xhr = _dereq_('./urlhandlers/xmlhttprequest.coffee');

    flash = _dereq_('./urlhandlers/flash.coffee');

    URLHandler = (function() {
        function URLHandler() {}

        URLHandler.get = function(url, options, cb) {
            if (!cb) {
                if (typeof options === 'function') {
                    cb = options;
                }
                options = {};
            }
            if (options.urlhandler && options.urlhandler.supported()) {
                return options.urlhandler.get(url, options, cb);
            } else if (typeof window === "undefined" || window === null) {
                return _dereq_('./urlhandlers/' + 'node.coffee').get(url, options, cb);
            } else if (xhr.supported()) {
                return xhr.get(url, options, cb);
            } else if (flash.supported()) {
                return flash.get(url, options, cb);
            } else {
                return cb();
            }
        };

        return URLHandler;

    })();

    module.exports = URLHandler;

},{"./urlhandlers/flash.coffee":12,"./urlhandlers/xmlhttprequest.coffee":13}],12:[function(_dereq_,module,exports){
// Generated by CoffeeScript 1.7.1
    var FlashURLHandler;

    FlashURLHandler = (function() {
        function FlashURLHandler() {}

        FlashURLHandler.xdr = function() {
            var xdr;
            if (window.XDomainRequest) {
                xdr = new XDomainRequest();
            }
            return xdr;
        };

        FlashURLHandler.supported = function() {
            return !!this.xdr();
        };

        FlashURLHandler.get = function(url, options, cb) {
            var xdr, xmlDocument;
            if (xmlDocument = typeof window.ActiveXObject === "function" ? new window.ActiveXObject("Microsoft.XMLDOM") : void 0) {
                xmlDocument.async = false;
            } else {
                return cb();
            }
            xdr = this.xdr();
            xdr.open('GET', url);
            xdr.timeout = options.timeout || 0;
            xdr.withCredentials = options.withCredentials || false;
            xdr.send();
            return xdr.onload = function() {
                xmlDocument.loadXML(xdr.responseText);
                return cb(null, xmlDocument);
            };
        };

        return FlashURLHandler;

    })();

    module.exports = FlashURLHandler;

},{}],13:[function(_dereq_,module,exports){
// Generated by CoffeeScript 1.7.1
    var XHRURLHandler;

    XHRURLHandler = (function() {
        function XHRURLHandler() {}

        XHRURLHandler.xhr = function() {
            var xhr;
            xhr = new window.XMLHttpRequest();
            if ('withCredentials' in xhr) {
                return xhr;
            }
        };

        XHRURLHandler.supported = function() {
            return !!this.xhr();
        };

        XHRURLHandler.get = function(url, options, cb) {
            var xhr;
            try {
                xhr = this.xhr();
                xhr.open('GET', url);
                xhr.timeout = options.timeout || 0;
                xhr.withCredentials = options.withCredentials || false;
                xhr.send();
                return xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        return cb(null, xhr.responseXML);
                    }
                };
            } catch (_error) {
                return cb();
            }
        };

        return XHRURLHandler;

    })();

    module.exports = XHRURLHandler;

},{}],14:[function(_dereq_,module,exports){
// Generated by CoffeeScript 1.7.1
    var VASTUtil;

    VASTUtil = (function() {
        function VASTUtil() {}

        VASTUtil.track = function(URLTemplates, variables) {
            var URL, URLs, i, _i, _len, _results;
            URLs = this.resolveURLTemplates(URLTemplates, variables);
            _results = [];
            for (_i = 0, _len = URLs.length; _i < _len; _i++) {
                URL = URLs[_i];
                if (typeof window !== "undefined" && window !== null) {
                    i = new Image();
                    _results.push(i.src = URL);
                } else {

                }
            }
            return _results;
        };

        VASTUtil.resolveURLTemplates = function(URLTemplates, variables) {
            var URLTemplate, URLs, key, macro1, macro2, resolveURL, value, _i, _len;
            URLs = [];
            if (variables == null) {
                variables = {};
            }
            if (!("CACHEBUSTING" in variables)) {
                variables["CACHEBUSTING"] = Math.round(Math.random() * 1.0e+10);
            }
            variables["random"] = variables["CACHEBUSTING"];
            for (_i = 0, _len = URLTemplates.length; _i < _len; _i++) {
                URLTemplate = URLTemplates[_i];
                resolveURL = URLTemplate;
                if (!resolveURL) {
                    continue;
                }
                for (key in variables) {
                    value = variables[key];
                    macro1 = "[" + key + "]";
                    macro2 = "%%" + key + "%%";
                    resolveURL = resolveURL.replace(macro1, value);
                    resolveURL = resolveURL.replace(macro2, value);
                }
                URLs.push(resolveURL);
            }
            return URLs;
        };

        VASTUtil.storage = (function() {
            var data, isDisabled, storage, storageError;
            try {
                storage = typeof window !== "undefined" && window !== null ? window.localStorage || window.sessionStorage : null;
            } catch (_error) {
                storageError = _error;
                storage = null;
            }
            isDisabled = function(store) {
                var e, testValue;
                try {
                    testValue = '__VASTUtil__';
                    store.setItem(testValue, testValue);
                    if (store.getItem(testValue) !== testValue) {
                        return true;
                    }
                } catch (_error) {
                    e = _error;
                    return true;
                }
                return false;
            };
            if ((storage == null) || isDisabled(storage)) {
                data = {};
                storage = {
                    length: 0,
                    getItem: function(key) {
                        return data[key];
                    },
                    setItem: function(key, value) {
                        data[key] = value;
                        this.length = Object.keys(data).length;
                    },
                    removeItem: function(key) {
                        delete data[key];
                        this.length = Object.keys(data).length;
                    },
                    clear: function() {
                        data = {};
                        this.length = 0;
                    }
                };
            }
            return storage;
        })();

        return VASTUtil;

    })();

    module.exports = VASTUtil;

},{}]},{},[6])
(6)
});

(function (window, vjs, vast) {
    'use strict';

    var extend = function (obj) {
            var arg, i, k;
            for (i = 1; i < arguments.length; i++) {
                arg = arguments[i];
                for (k in arg) {
                    if (arg.hasOwnProperty(k)) {
                        obj[k] = arg[k];
                    }
                }
            }
            return obj;
        },

        defaults = {
            // seconds before skip button shows, negative values to disable skip button altogether
            skip: 5
        },

        Vast = function (player, settings) {

            // return vast plugin
            return {
                createSourceObjects: function (media_files) {
                    var sourcesByFormat = {}, i, j, tech;
                    var techOrder = player.options().techOrder;
                    for (i = 0, j = techOrder.length; i < j; i++) {
                        var techName = techOrder[i].charAt(0).toUpperCase() + techOrder[i].slice(1);
                        tech = window.advjs[techName];

                        // Check if the current tech is defined before continuing
                        if (!tech) {
                            continue;
                        }

                        // Check if the browser supports this technology
                        if (tech.isSupported()) {
                            // Loop through each source object
                            for (var a = 0, b = media_files.length; a < b; a++) {
                                var media_file = media_files[a];
                                var source = {type: media_file.mimeType, src: media_file.fileURL};
                                // Check if source can be played with this technology
                                if (tech.canPlaySource(source)) {
                                    if (sourcesByFormat[techOrder[i]] === undefined) {
                                        sourcesByFormat[techOrder[i]] = [];
                                    }
                                    sourcesByFormat[techOrder[i]].push({
                                        type: media_file.mimeType,
                                        src: media_file.fileURL,
                                        width: media_file.width,
                                        height: media_file.height
                                    });
                                }
                            }
                        }
                    }
                    // Create sources in preferred format order
                    var sources = [];
                    for (j = 0; j < techOrder.length; j++) {
                        tech = techOrder[j];
                        if (sourcesByFormat[tech] !== undefined) {
                            for (i = 0; i < sourcesByFormat[tech].length; i++) {
                                sources.push(sourcesByFormat[tech][i]);
                            }
                        }
                    }
                    return sources;
                },

                getContent: function () {

                    // query vast url given in settings
                    vast.client.get(settings.url, function (response) {
                        if (response) {
                            // we got a response, deal with it
                            for (var adIdx = 0; adIdx < response.ads.length; adIdx++) {
                                var ad = response.ads[adIdx];
                                player.vast.companion = undefined;
                                for (var creaIdx = 0; creaIdx < ad.creatives.length; creaIdx++) {
                                    var creative = ad.creatives[creaIdx], foundCreative = false, foundCompanion = false;
                                    if (creative.type === "linear" && !foundCreative) {

                                        if (creative.mediaFiles.length) {

                                            player.vast.sources = player.vast.createSourceObjects(creative.mediaFiles);

                                            if (!player.vast.sources.length) {
                                                player.trigger('adscanceled');
                                                return;
                                            }

                                            player.vastTracker = new vast.tracker(ad, creative);

                                            foundCreative = true;
                                        }

                                    } else if (creative.type === "companion" && !foundCompanion) {

                                        player.vast.companion = creative;

                                        foundCompanion = true;

                                    }
                                }

                                if (player.vastTracker) {
                                    // vast tracker and content is ready to go, trigger event
                                    player.trigger('vast-ready');
                                    break;
                                } else {
                                    // Inform ad server we can't find suitable media file for this ad
                                    vast.util.track(ad.errorURLTemplates, {ERRORCODE: 403});
                                }
                            }
                        }

                        if ( ! player.vastTracker ) {
                            // No pre-roll, start video
                            console.log('No Ads, back to play content');
                            //player.trigger('ended');
                            player.trigger('adscanceled');
                        }
                    });
                },

                setupEvents: function () {

                    var errorOccurred = false,
                        canplayFn = function () {
                            player.vastTracker.load();
                        },
                        timeupdateFn = function () {
                            if (isNaN(player.vastTracker.assetDuration)) {
                                player.vastTracker.assetDuration = player.duration();
                            }
                            player.vastTracker.setProgress(player.currentTime());
                        },
                        pauseFn = function () {
                            player.vastTracker.setPaused(true);
                            player.one('play', function () {
                                player.vastTracker.setPaused(false);
                            });
                        },
                        errorFn = function () {
                            // Inform ad server we couldn't play the media file for this ad
                            vast.util.track(player.vastTracker.ad.errorURLTemplates, {ERRORCODE: 405});
                            errorOccurred = true;
                            player.trigger('ended');
                        };

                    player.on('canplay', canplayFn);
                    player.on('timeupdate', timeupdateFn);
                    player.on('pause', pauseFn);
                    player.on('error', errorFn);

                    player.one('vast-preroll-removed', function () {
                        player.off('canplay', canplayFn);
                        player.off('timeupdate', timeupdateFn);
                        player.off('pause', pauseFn);
                        player.off('error', errorFn);
                        if (!errorOccurred) {
                            player.vastTracker.complete();
                        }
                    });
                },

                preroll: function () {

                    player.ads.startLinearAdMode();
                    player.vast.showControls = player.controls();
                    if (player.vast.showControls) {
                        player.controls(false);
                    }

                    // load linear ad sources and start playing them
                    player.src(player.vast.sources);

                    var clickthrough;
                    if (player.vastTracker.clickThroughURLTemplate) {
                        clickthrough = vast.util.resolveURLTemplates(
                            [player.vastTracker.clickThroughURLTemplate],
                            {
                                CACHEBUSTER: Math.round(Math.random() * 1.0e+10),
                                CONTENTPLAYHEAD: player.vastTracker.progressFormated()
                            }
                        )[0];
                    }
                    var blocker = window.document.createElement("a");
                    blocker.className = "vast-blocker";
                    blocker.href = clickthrough || "#";
                    blocker.target = "_blank";
                    blocker.onclick = function () {
                        if (player.paused()) {
                            player.play();
                            return false;
                        }
                        player.vastTracker.click();
                        player.trigger("adclick");
                    };
                    player.vast.blocker = blocker;
                    player.el().insertBefore(blocker, player.controlBar.el());

                    var skipButton = window.document.createElement("div");
                    skipButton.className = "vast-skip-button";
                    if (settings.skip < 0) {
                        skipButton.style.display = "none";
                    }
                    player.vast.skipButton = skipButton;
                    player.el().appendChild(skipButton);

                    //TODO vast timer
                    var timerDiv = window.document.createElement("div");
                    timerDiv.className = "vast-timer";
                    timerDiv.id = player.id() + "-vast-timer";
                    timerDiv.innerHTML = "00:00";
                    player.el().appendChild(timerDiv);
                    player.vast.countDown = timerDiv;

                    player.on("timeupdate", player.vast.timeupdate);

                    skipButton.onclick = function (e) {
                        if ((' ' + player.vast.skipButton.className + ' ').indexOf(' enabled ') >= 0) {
                            player.vastTracker.skip();
                            player.vast.tearDown();
                        }
                        if (window.Event.prototype.stopPropagation !== undefined) {
                            e.stopPropagation();
                        } else {
                            return false;
                        }
                    };

                    player.vast.setupEvents();

                    player.one('ended', player.vast.tearDown);

                    player.trigger('vast-preroll-ready');
                },

                tearDown: function () {
                    // remove preroll buttons
                    if(player.vast.countDown){
                        clearInterval(player.vast.countDown.tid);
                        player.vast.countDown.parentNode.removeChild(player.vast.countDown);
                        player.vast.skipButton.parentNode.removeChild(player.vast.skipButton);
                        player.vast.blocker.parentNode.removeChild(player.vast.blocker);
                    }

                    // remove vast-specific events
                    player.off('timeupdate', player.vast.timeupdate);
                    player.off('ended', player.vast.tearDown);

                    // end ad mode
                    player.ads.endLinearAdMode();

                    // show player controls for video
                    if (player.vast.showControls) {
                        player.controls(true);
                    }

                    player.trigger('vast-preroll-removed');
                },

                timeupdate: function (e) {
                    player.loadingSpinner.el().style.display = "none";
                    var timeLeft = Math.ceil(settings.skip - player.currentTime());
                    if (timeLeft > 0) {


                        var html = '<div style="font-size:12px;">Ad will be closed after </div><div style="font-size:18px;">';
                        html = html + timeLeft + ' seconds</div>';
                        player.vast.skipButton.innerHTML = html;
                    } else {
                        if ((' ' + player.vast.skipButton.className + ' ').indexOf(' enabled ') === -1) {
                            player.vast.skipButton.className += " enabled";
                            player.vast.skipButton.innerHTML = '<div style="font-size:18px;"> CLOSE </div>';
                        }
                    }
                }
            };

        },

        vastPlugin = function (options) {
            var player = this;
            var settings = extend({}, defaults, options || {});

            // check that we have the ads plugin
            if (player.ads === undefined) {
                window.console.error('vast video plugin requires advjs-contrib-ads, vast plugin not initialized');
                return null;
            }

            // set up vast plugin, then set up events here
            player.vast = new Vast(player, settings);

            player.on('vast-ready', function () {
                // vast is prepared with content, set up ads and trigger ready function
                player.trigger('adsready');
            });

            player.on('vast-preroll-ready', function () {
                // start playing preroll, note: this should happen this way no matter what, even if autoplay
                //  has been disabled since the preroll function shouldn't run until the user/autoplay has
                //  caused the main video to trigger this preroll function
                player.play();

                var c = 0;
                var tid = setInterval(function(){
                    var duration = Math.floor(player.duration()) - (++c);

                    var minutes = parseInt(duration / 60, 10);
                    minutes = (minutes<10) ? ('0'+minutes) : minutes;

                    var seconds = duration % 60;
                    seconds = (seconds<10) ? ('0'+seconds) : seconds;

                    var div =  document.getElementById(player.id() + '-vast-timer');
                    if(duration<=0){
                        //player.vast.countDown.innerHTML = '';
                        clearInterval(tid);
                        ////TODO trigger event
                    }
                    div.innerHTML = minutes + ':' +  seconds;
                },1000);
                player.vast.countDown.tid = tid;


            });

            player.on('vast-preroll-removed', function () {
                // preroll done or removed, start playing the actual video
                if(window._EndAdVideoPlayed instanceof Function){
                    window._EndAdVideoPlayed();
                } else {
                    player.play();
                }
            });

            player.on('contentupdate', function () {
                // advjs-ads triggers this when src changes
                player.vast.getContent(settings.url);
            });

            player.on('adscanceled', function () {
                console.log('adscanceled is triggered at ' + new Date());

                //try double trigger event play
                player.vast.tearDown();
                setTimeout(function(){
                    player.play();
                },4000);
                setTimeout(function(){
                    player.play();
                },5600);
                return false;
            });

            player.on('readyforpreroll', function () {
                // if we don't have a vast url, just bail out
                if (!settings.url) {
                    player.trigger('adscanceled');
                    return null;
                }
                // set up and start playing preroll
                player.vast.preroll();
            });

            // make an ads request immediately so we're ready when the viewer hits "play"
            if (player.currentSrc()) {
                player.vast.getContent(settings.url);
            }

            // return player to allow this plugin to be chained
            return player;
        };

    vjs.plugin('vast', vastPlugin);

}(window, advjs, DMVAST));

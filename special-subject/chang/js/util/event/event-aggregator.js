define(function (require, exports) {
    var toString = Object.prototype.toString;
    var debug = location.href.indexOf('debug=events') > -1;

    function Event(name) {
        this.handlers = [];
        this.name = name;
    }
    Event.prototype = {
        getName: function () {
            return this.name;
        },
        addHandler: function (handler) {
            this.handlers.push(handler);
        },
        removeHandler: function (handler) {
            for (var i = 0; i < this.handlers.length; i++) {
                if (this.handlers[i] == handler) {
                    this.handlers.splice(i, 1);
                    break;
                }
            }
        },
        fire: function (eventArg1, eventArg2, eventArg3) {
            for(var i = 0, len = this.handlers.length; i < len; i++){
                this.handlers[i](eventArg1, eventArg2, eventArg3);
            }
        }
    };

    function EventAggregator() {
        this.events = [];
    }
    EventAggregator.prototype = {
        _getEvent: function(eventName) {
            var names = [];
            for(var i = 0, len = this.events.length; i < len; i++){
                var name = this.events[i].getName();
                if(name === eventName){
                    names.push(this.events[i]);
                }else if(name.indexOf(eventName) === 0 && name.substr(eventName.length)[0] == '.'){
                    names.push(this.events[i]);
                }
            }
            return names;
        },
        publish: function (eventName, eventArg1, eventArg2, eventArg3) {
            var events = this._getEvent(eventName), event, i;
            if (!events.length) {
                event = new Event(eventName);
                this.events.push(event);
                events.push(event);
            }
            if(debug){
                console.log('publish ------->', eventName, '(' + events.length + ' receive)');
            }
            for(i = 0; evt = events[i++];){
                evt.fire(eventArg1, eventArg2, eventArg3);
            }
        },
        subscribe: function (eventName, handler) {
            var events = this._getEvent(eventName), event, i;
            if (!events.length) {
                event = new Event(eventName);
                this.events.push(event);
                events.push(event);
            }
            if(debug){
                console.log('subscribe <-----', eventName);
            }
            for(i = 0; evt = events[i++];){
                evt.addHandler(handler);
            }
            
        },
        unSubscribe: function (eventName, handler) {
            var events = this._getEvent(eventName), event, i;
            if (!events.length) {
                event = new Event(eventName);
                this.events.push(event);
                events.push(event);
            }
            for(i = 0; evt = events[i++];){
                evt.removeHandler(handler);
            }
        }
    };

    EventAggregator.prototype.on = EventAggregator.prototype.subscribe;
    EventAggregator.prototype.off = EventAggregator.prototype.unSubscribe;
    EventAggregator.prototype.trigger = EventAggregator.prototype.publish;

    EventAggregator.prototype.once = function(eventName, handler){
        var self = this;
        var once = function(){
            self.off(eventName, handler);
            handler();
        };
        this.on(eventName, once);
    };

    return EventAggregator;
});

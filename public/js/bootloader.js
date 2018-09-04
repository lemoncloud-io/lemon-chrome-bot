/**
 * Lemon BootLoader
 * - Common Bootloader.
 *
 * 
 * author: Steve <steve@lemoncloud.io>
 * date : 2018-08-31
 *
 * Copyright (C) 2018 LemonCloud Co Ltd. - All Rights Reserved.
 */
/** ********************************************************************************************************************
 *  boot loading for global instance manager
 ** *******************************************************************************************************************/
//global core functions. (_$)
(function (_root, _name) {
	"use strict";
	_root = _root || {};
	var ROOT_NAME = _name || '$LEMON_BOOT';
    //! load configuration.
    var process = typeof _root.process != 'undefined' ? _root.process : null;
	var STAGE = process && process.env && process.env.STAGE || 'local';
    var LC = (STAGE === 'local');
    var TS = (STAGE !== 'prod' );
    var DUM = function(){};

    var GREEN = [
        'background: white; color: green; display: block;'
        // 'background: linear-gradient(#D33106, #571402)'
        // , 'border: 1px solid #3E0E02'
        // , 'color: white'
        // , 'display: block'
        // , 'text-shadow: 0 1px 0 rgba(0, 0, 0, 0.3)'
        // , 'box-shadow: 0 1px 0 rgba(255, 255, 255, 0.4) inset, 0 5px 3px -5px rgba(0, 0, 0, 0.5), 0 -13px 5px -10px rgba(255, 255, 255, 0.4) inset'
        // , 'line-height: 40px'
        // , 'text-align: center'
        // , 'font-weight: bold'
    ].join(';');
    var BLUE = [
        'background: blue; color: white; display: block;'
    ].join(';');
    var RED = [
        'background: red; color: white; display: block;'
    ].join(';');

	//! common function for logging.
	var $console = {thiz: console||{}, log: console.log||DUM, error: console.error||DUM, auto_ts: TS, auto_color: LC};
	var _log = function () {
		var args = $console.auto_ts && !Array.isArray(arguments) && Array.prototype.slice.call(arguments) || arguments;
		// if ($console.auto_color) args.unshift("\x1b[0m"), $console.auto_ts && args.unshift(_ts(), 'L'), args.unshift("\x1b[32m");       // BLUE
		if ($console.auto_color) args.unshift(GREEN), args.unshift('%c '+($console.auto_ts && _ts() || '')+ ' L');       // BLUE
		else $console.auto_ts && args.unshift(_ts(), 'L');
		return $console.log.apply($console.thiz, args)
	}
	var _inf = function () {
		var args = $console.auto_ts && !Array.isArray(arguments) && Array.prototype.slice.call(arguments) || arguments;
		// if ($console.auto_color) args.unshift(""), args.push("\x1b[0m"), $console.auto_ts && args.unshift(_ts(), 'I'), args.unshift("\x1b[33m");       	// YELLOW in line.
		if ($console.auto_color) args.unshift(BLUE), args.unshift('%c '+($console.auto_ts && _ts() || '')+ ' L');       // BLUE
		else $console.auto_ts && args.unshift(_ts(), 'I');
		return $console.log.apply($console.thiz, args)
	}
	var _err = function () {
		var args = $console.auto_ts && !Array.isArray(arguments) && Array.prototype.slice.call(arguments) || arguments;
		// if ($console.auto_color) args.unshift("\x1b[0m"), $console.auto_ts && args.unshift(_ts(), 'E'), args.unshift("\x1b[31m");       // RED
		if ($console.auto_color) args.unshift(RED), args.unshift('%c '+($console.auto_ts && _ts() || '')+ ' L');       // BLUE
		else $console.auto_ts && args.unshift(_ts(), 'E');
		return $console.error.apply($console.thiz, args)
	}
	var _extend = function (opt, opts) {      // simple object extender.
		for (var k in opts) {
			var v = opts[k];
			if (v === undefined) delete opt[k];
			else opt[k] = v;
		}
		return opt;
	}

	function _ts(_d) {                       // timestamp like 2016-12-08 13:30:44
		var dt = _d || new Date();
		var y = dt.getFullYear(), m = dt.getMonth() + 1, d = dt.getDate(), h = dt.getHours(), i = dt.getMinutes(), s = dt.getSeconds();
		return (y < 10 ? "0" : "") + y + "-" + (m < 10 ? "0" : "") + m + "-" + (d < 10 ? "0" : "") + d + " " + (h < 10 ? "0" : "") + h + ":" + (i < 10 ? "0" : "") + i + ":" + (s < 10 ? "0" : "") + s;
    }
    
	//! root instance to manage global objects.
	var _$$ = function () {
	};             // global container.(dummy instance pointer)
	var _$ = function (name, opts) {      // global identifier.
		if (!name) return;
		var thiz = 1 ? _$ : _$$;        // 인스턴스 바꿔치기: _$('hello') == _$.hello
		var opt = typeof thiz[name] !== 'undefined' ? thiz[name] : undefined;
		if (opts === undefined) return opt;
		if (opt === undefined) {
			_log('INFO! service[' + name + '] registered');
			thiz[name] = opts;
			return opts;
		}
		//! extends options.
		_err('WARN! service[' + name + '] exists! so extends ');
		opt = opt || {};
		opts = opts || {};
		opt = _extend(opt, opts);
		thiz[name] = opt;
		return opt;
	};

	// register into _$(global instance manager).
	_$.id = ROOT_NAME;
	_$.log = _log;
	_$.inf = _inf;
	_$.err = _err;
	_$.extend = _extend;
	_$.ts = _ts;
	_$.$console = $console;                     // '$' means object. (change this in order to override log/error message handler)
	_$.toString = function () {
		return this.id || '$ROOT'
	}

	// register as global instances.
	_root._log = _log;
	_root._inf = _inf;
	_root._err = _err;
	_root._$ = _$;
    _root[_$.id] = _$;


    //////////////////////////////////////////////////
    //! addtional functions.
    _$.catch_val = function (data, txt1, txt2){
        data = data||'';
        var a = data.indexOf(txt1);
        var b = a >= 0 ? data.indexOf(txt2, a + txt1.length) : a;
        var c = b > a ? data.substring(a+txt1.length, b) : "";
        return c;
    };
    _$.exclude_val = function (data, txt1, txt2){
        var a = data.indexOf(txt1);
        var b = a >= 0 ? data.indexOf(txt2, a + txt1.length) : a;
        var c = b > a ? (data.substring(0, a) + data.substring(b+txt2.length)) : "";
        return c;
    };
    _$.get_get_param = function (url, name){
        url = url||'';
        name = name||'';
        var k1 = '?'+name+'=', k2 = '&'+name+'=';
        var a1 = url.indexOf(k1), a2 = url.indexOf(k2);
        var a = a1 >= 0 ? a1 : a2 >= 0 ? a2 : -1;
        if (a >= 0) {
            var len = url.length;
            var b = url.indexOf('&', a+name.length+2);
            b = b > 0 ? b : url.length;
            var oldval = url.substring(a+name.length+2, b);
            return oldval;
        }
        return '';
    };
    _$.parse_price = function(cv){
        if((typeof cv === 'number') && (cv % 1 === 0)) return cv;
		cv = String(cv).replace(/ /g, '');
		var a = cv.substr(0,1), b = cv.substr(-1,1);
		if(a == '₩' || a == '$') cv = cv.substr(1, cv.length);
		if(a == '(' && b == ')') cv = cv.substr(1, cv.length-2);
        if(a == '[' && b == ']') cv = cv.substr(1, cv.length-2);
        if(cv.startsWith('총'))   cv = cv.substr(1, cv.length);         // like '총 2개'
		if(cv.substr(-1) == "원") cv = cv.substr(0, cv.length-1);
		if(cv.substr(-1) == "개") cv = cv.substr(0, cv.length-1);
		if(cv.substr(0,2) == '무료') cv = '0';
		if(cv.substr(0,2) == '착불') cv = '3,000';
		return cv;
    };
	_$.N = function(x, def){try{
		if(x === '' || x === undefined || x === null) return def;
		if((typeof x === 'number') && (x % 1 === 0)) return x;
		if(typeof x == 'number') return parseInt(x);
		return parseInt((''+x).replace(/,/ig, '').trim())
	} catch(e){
		// _err('err at _N: x='+x+';'+(typeof x)+';'+(e.message||''), e);
		//console.error(e);
		return def;
    }};
    // 숫자 타입에서 쓸 수 있도록 format() 함수 추가
    _$.NF = function(v){
        if(!v) return '0';
        var reg = /(^[+-]?\d+)(\d{3})/;
        var n = (v + '');
        while (reg.test(n)) n = n.replace(reg, '$1' + ',' + '$2');
        return n;
    };
    _$.copy_clean = function ($N) {
        if (!$N || Array.isArray($N)) return $N;
		return Object.keys($N).reduce(function(N, key) {
            var val = $N[key];
			if(key.startsWith('_')) return N;
            if(key.startsWith('$')) return N;
            if (val && typeof val == 'object') {
                N[key] = _$.copy_clean(val);
            } else {
                N[key] = val;
            }
			return N;
		}, {})
    }
    
})(window||global)

/** ********************************************************************************************************************
 *  Pollyfill
 ** *******************************************************************************************************************/
// ECMA-262 5판, 15.4.4.21항의 작성 과정
// 참고: http://es5.github.io/#x15.4.4.21
if (!Array.prototype.reduce) {
    Array.prototype.reduce = function(callback /*, initialValue*/) {
      'use strict';
      if (this == null) {
        throw new TypeError('Array.prototype.reduce called on null or undefined');
      }
      if (typeof callback !== 'function') {
        throw new TypeError(callback + ' is not a function');
      }
      var t = Object(this), len = t.length >>> 0, k = 0, value;
      if (arguments.length == 2) {
        value = arguments[1];
      } else {
        while (k < len && !(k in t)) {
          k++;
        }
        if (k >= len) {
          throw new TypeError('Reduce of empty array with no initial value');
        }
        value = t[k++];
      }
      for (; k < len; k++) {
        if (k in t) {
          value = callback(value, t[k], k, t);
        }
      }
      return value;
    };
}

// ECMAScript 6 규격에 포함되어 있지만 아직까지는 모든 JavaScrpt가 이 기능을 지원
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position){
      position = position || 0;
      return this.substr(position, searchString.length) === searchString;
  };
}
if (!String.prototype.endsWith) {
    String.prototype.endsWith = function(searchString, position) {
        var subjectString = this.toString();
        if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
          position = subjectString.length;
        }
        position -= searchString.length;
        var lastIndex = subjectString.indexOf(searchString, position);
        return lastIndex !== -1 && lastIndex === position;
    };
  }

// only run when the substr() function is broken
if ('ab'.substr(-1) != 'b') {
    /**
     *  Get the substring of a string
     *  @param  {integer}  start   where to start the substring
     *  @param  {integer}  length  how many characters to return
     *  @return {string}
     */
    String.prototype.substr = function(substr) {
      return function(start, length) {
        // call the original method
        return substr.call(this,
            // did we get a negative start, calculate how much it is from the beginning of the string
          // adjust the start parameter for negative value
          start < 0 ? this.length + start : start,
          length)
      }
    }(String.prototype.substr);
}

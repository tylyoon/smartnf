(() => {
  var fp = Object.create;
  var lr = Object.defineProperty;
  var sp = Object.getOwnPropertyDescriptor;
  var op = Object.getOwnPropertyNames;
  var rp = Object.getPrototypeOf, dp = Object.prototype.hasOwnProperty;
  var Ze = (t, l) => () => (l || t((l = { exports: {} }).exports, l), l.exports);
  var mp = (t, l, e, n) => {
    if (l && typeof l == "object" || typeof l == "function") for (let a of op(l)) !dp.call(t, a) && a !== e && lr(t, a, { get: () => l[a], enumerable: !(n = sp(l, a)) || n.enumerable });
    return t;
  };
  var Ul = (t, l, e) => (e = t != null ? fp(rp(t)) : {}, mp(l || !t || !t.__esModule ? lr(e, "default", { value: t, enumerable: true }) : e, t));
  var dr = Ze((R) => {
    "use strict";
    var Gc = Symbol.for("react.transitional.element"), hp = Symbol.for("react.portal"), pp = Symbol.for("react.fragment"), yp = Symbol.for("react.strict_mode"), gp = Symbol.for("react.profiler"), vp = Symbol.for("react.consumer"), bp = Symbol.for("react.context"), Sp = Symbol.for("react.forward_ref"), Np = Symbol.for("react.suspense"), Ep = Symbol.for("react.memo"), ir = Symbol.for("react.lazy"), Tp = Symbol.for("react.activity"), er = Symbol.iterator;
    function Ap(t) {
      return t === null || typeof t != "object" ? null : (t = er && t[er] || t["@@iterator"], typeof t == "function" ? t : null);
    }
    var cr = { isMounted: function() {
      return false;
    }, enqueueForceUpdate: function() {
    }, enqueueReplaceState: function() {
    }, enqueueSetState: function() {
    } }, fr = Object.assign, sr = {};
    function Wn(t, l, e) {
      this.props = t, this.context = l, this.refs = sr, this.updater = e || cr;
    }
    Wn.prototype.isReactComponent = {};
    Wn.prototype.setState = function(t, l) {
      if (typeof t != "object" && typeof t != "function" && t != null) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
      this.updater.enqueueSetState(this, t, l, "setState");
    };
    Wn.prototype.forceUpdate = function(t) {
      this.updater.enqueueForceUpdate(this, t, "forceUpdate");
    };
    function or() {
    }
    or.prototype = Wn.prototype;
    function Xc(t, l, e) {
      this.props = t, this.context = l, this.refs = sr, this.updater = e || cr;
    }
    var Qc = Xc.prototype = new or();
    Qc.constructor = Xc;
    fr(Qc, Wn.prototype);
    Qc.isPureReactComponent = true;
    var nr = Array.isArray;
    function jc() {
    }
    var Ct = { H: null, A: null, T: null, S: null }, rr = Object.prototype.hasOwnProperty;
    function Zc(t, l, e) {
      var n = e.ref;
      return { $$typeof: Gc, type: t, key: l, ref: n !== void 0 ? n : null, props: e };
    }
    function zp(t, l) {
      return Zc(t.type, l, t.props);
    }
    function Vc(t) {
      return typeof t == "object" && t !== null && t.$$typeof === Gc;
    }
    function Op(t) {
      var l = { "=": "=0", ":": "=2" };
      return "$" + t.replace(/[=:]/g, function(e) {
        return l[e];
      });
    }
    var ar = /\/+/g;
    function wc(t, l) {
      return typeof t == "object" && t !== null && t.key != null ? Op("" + t.key) : l.toString(36);
    }
    function Cp(t) {
      switch (t.status) {
        case "fulfilled":
          return t.value;
        case "rejected":
          throw t.reason;
        default:
          switch (typeof t.status == "string" ? t.then(jc, jc) : (t.status = "pending", t.then(function(l) {
            t.status === "pending" && (t.status = "fulfilled", t.value = l);
          }, function(l) {
            t.status === "pending" && (t.status = "rejected", t.reason = l);
          })), t.status) {
            case "fulfilled":
              return t.value;
            case "rejected":
              throw t.reason;
          }
      }
      throw t;
    }
    function kn(t, l, e, n, a) {
      var u = typeof t;
      (u === "undefined" || u === "boolean") && (t = null);
      var i = false;
      if (t === null) i = true;
      else switch (u) {
        case "bigint":
        case "string":
        case "number":
          i = true;
          break;
        case "object":
          switch (t.$$typeof) {
            case Gc:
            case hp:
              i = true;
              break;
            case ir:
              return i = t._init, kn(i(t._payload), l, e, n, a);
          }
      }
      if (i) return a = a(t), i = n === "" ? "." + wc(t, 0) : n, nr(a) ? (e = "", i != null && (e = i.replace(ar, "$&/") + "/"), kn(a, l, e, "", function(r) {
        return r;
      })) : a != null && (Vc(a) && (a = zp(a, e + (a.key == null || t && t.key === a.key ? "" : ("" + a.key).replace(ar, "$&/") + "/") + i)), l.push(a)), 1;
      i = 0;
      var c = n === "" ? "." : n + ":";
      if (nr(t)) for (var f = 0; f < t.length; f++) n = t[f], u = c + wc(n, f), i += kn(n, l, e, u, a);
      else if (f = Ap(t), typeof f == "function") for (t = f.call(t), f = 0; !(n = t.next()).done; ) n = n.value, u = c + wc(n, f++), i += kn(n, l, e, u, a);
      else if (u === "object") {
        if (typeof t.then == "function") return kn(Cp(t), l, e, n, a);
        throw l = String(t), Error("Objects are not valid as a React child (found: " + (l === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : l) + "). If you meant to render a collection of children, use an array instead.");
      }
      return i;
    }
    function Wu(t, l, e) {
      if (t == null) return t;
      var n = [], a = 0;
      return kn(t, n, "", "", function(u) {
        return l.call(e, u, a++);
      }), n;
    }
    function Mp(t) {
      if (t._status === -1) {
        var l = t._result;
        l = l(), l.then(function(e) {
          (t._status === 0 || t._status === -1) && (t._status = 1, t._result = e);
        }, function(e) {
          (t._status === 0 || t._status === -1) && (t._status = 2, t._result = e);
        }), t._status === -1 && (t._status = 0, t._result = l);
      }
      if (t._status === 1) return t._result.default;
      throw t._result;
    }
    var ur = typeof reportError == "function" ? reportError : function(t) {
      if (typeof window == "object" && typeof window.ErrorEvent == "function") {
        var l = new window.ErrorEvent("error", { bubbles: true, cancelable: true, message: typeof t == "object" && t !== null && typeof t.message == "string" ? String(t.message) : String(t), error: t });
        if (!window.dispatchEvent(l)) return;
      } else if (typeof process == "object" && typeof process.emit == "function") {
        process.emit("uncaughtException", t);
        return;
      }
      console.error(t);
    }, Dp = { map: Wu, forEach: function(t, l, e) {
      Wu(t, function() {
        l.apply(this, arguments);
      }, e);
    }, count: function(t) {
      var l = 0;
      return Wu(t, function() {
        l++;
      }), l;
    }, toArray: function(t) {
      return Wu(t, function(l) {
        return l;
      }) || [];
    }, only: function(t) {
      if (!Vc(t)) throw Error("React.Children.only expected to receive a single React element child.");
      return t;
    } };
    R.Activity = Tp;
    R.Children = Dp;
    R.Component = Wn;
    R.Fragment = pp;
    R.Profiler = gp;
    R.PureComponent = Xc;
    R.StrictMode = yp;
    R.Suspense = Np;
    R.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = Ct;
    R.__COMPILER_RUNTIME = { __proto__: null, c: function(t) {
      return Ct.H.useMemoCache(t);
    } };
    R.cache = function(t) {
      return function() {
        return t.apply(null, arguments);
      };
    };
    R.cacheSignal = function() {
      return null;
    };
    R.cloneElement = function(t, l, e) {
      if (t == null) throw Error("The argument must be a React element, but you passed " + t + ".");
      var n = fr({}, t.props), a = t.key;
      if (l != null) for (u in l.key !== void 0 && (a = "" + l.key), l) !rr.call(l, u) || u === "key" || u === "__self" || u === "__source" || u === "ref" && l.ref === void 0 || (n[u] = l[u]);
      var u = arguments.length - 2;
      if (u === 1) n.children = e;
      else if (1 < u) {
        for (var i = Array(u), c = 0; c < u; c++) i[c] = arguments[c + 2];
        n.children = i;
      }
      return Zc(t.type, a, n);
    };
    R.createContext = function(t) {
      return t = { $$typeof: bp, _currentValue: t, _currentValue2: t, _threadCount: 0, Provider: null, Consumer: null }, t.Provider = t, t.Consumer = { $$typeof: vp, _context: t }, t;
    };
    R.createElement = function(t, l, e) {
      var n, a = {}, u = null;
      if (l != null) for (n in l.key !== void 0 && (u = "" + l.key), l) rr.call(l, n) && n !== "key" && n !== "__self" && n !== "__source" && (a[n] = l[n]);
      var i = arguments.length - 2;
      if (i === 1) a.children = e;
      else if (1 < i) {
        for (var c = Array(i), f = 0; f < i; f++) c[f] = arguments[f + 2];
        a.children = c;
      }
      if (t && t.defaultProps) for (n in i = t.defaultProps, i) a[n] === void 0 && (a[n] = i[n]);
      return Zc(t, u, a);
    };
    R.createRef = function() {
      return { current: null };
    };
    R.forwardRef = function(t) {
      return { $$typeof: Sp, render: t };
    };
    R.isValidElement = Vc;
    R.lazy = function(t) {
      return { $$typeof: ir, _payload: { _status: -1, _result: t }, _init: Mp };
    };
    R.memo = function(t, l) {
      return { $$typeof: Ep, type: t, compare: l === void 0 ? null : l };
    };
    R.startTransition = function(t) {
      var l = Ct.T, e = {};
      Ct.T = e;
      try {
        var n = t(), a = Ct.S;
        a !== null && a(e, n), typeof n == "object" && n !== null && typeof n.then == "function" && n.then(jc, ur);
      } catch (u) {
        ur(u);
      } finally {
        l !== null && e.types !== null && (l.types = e.types), Ct.T = l;
      }
    };
    R.unstable_useCacheRefresh = function() {
      return Ct.H.useCacheRefresh();
    };
    R.use = function(t) {
      return Ct.H.use(t);
    };
    R.useActionState = function(t, l, e) {
      return Ct.H.useActionState(t, l, e);
    };
    R.useCallback = function(t, l) {
      return Ct.H.useCallback(t, l);
    };
    R.useContext = function(t) {
      return Ct.H.useContext(t);
    };
    R.useDebugValue = function() {
    };
    R.useDeferredValue = function(t, l) {
      return Ct.H.useDeferredValue(t, l);
    };
    R.useEffect = function(t, l) {
      return Ct.H.useEffect(t, l);
    };
    R.useEffectEvent = function(t) {
      return Ct.H.useEffectEvent(t);
    };
    R.useId = function() {
      return Ct.H.useId();
    };
    R.useImperativeHandle = function(t, l, e) {
      return Ct.H.useImperativeHandle(t, l, e);
    };
    R.useInsertionEffect = function(t, l) {
      return Ct.H.useInsertionEffect(t, l);
    };
    R.useLayoutEffect = function(t, l) {
      return Ct.H.useLayoutEffect(t, l);
    };
    R.useMemo = function(t, l) {
      return Ct.H.useMemo(t, l);
    };
    R.useOptimistic = function(t, l) {
      return Ct.H.useOptimistic(t, l);
    };
    R.useReducer = function(t, l, e) {
      return Ct.H.useReducer(t, l, e);
    };
    R.useRef = function(t) {
      return Ct.H.useRef(t);
    };
    R.useState = function(t) {
      return Ct.H.useState(t);
    };
    R.useSyncExternalStore = function(t, l, e) {
      return Ct.H.useSyncExternalStore(t, l, e);
    };
    R.useTransition = function() {
      return Ct.H.useTransition();
    };
    R.version = "19.2.0";
  });
  var yl = Ze((vv, mr) => {
    "use strict";
    mr.exports = dr();
  });
  var Tr = Ze((Ht) => {
    "use strict";
    function Wc(t, l) {
      var e = t.length;
      t.push(l);
      t: for (; 0 < e; ) {
        var n = e - 1 >>> 1, a = t[n];
        if (0 < Fu(a, l)) t[n] = l, t[e] = a, e = n;
        else break t;
      }
    }
    function fe(t) {
      return t.length === 0 ? null : t[0];
    }
    function Iu(t) {
      if (t.length === 0) return null;
      var l = t[0], e = t.pop();
      if (e !== l) {
        t[0] = e;
        t: for (var n = 0, a = t.length, u = a >>> 1; n < u; ) {
          var i = 2 * (n + 1) - 1, c = t[i], f = i + 1, r = t[f];
          if (0 > Fu(c, e)) f < a && 0 > Fu(r, c) ? (t[n] = r, t[f] = e, n = f) : (t[n] = c, t[i] = e, n = i);
          else if (f < a && 0 > Fu(r, e)) t[n] = r, t[f] = e, n = f;
          else break t;
        }
      }
      return l;
    }
    function Fu(t, l) {
      var e = t.sortIndex - l.sortIndex;
      return e !== 0 ? e : t.id - l.id;
    }
    Ht.unstable_now = void 0;
    typeof performance == "object" && typeof performance.now == "function" ? (hr = performance, Ht.unstable_now = function() {
      return hr.now();
    }) : (Kc = Date, pr = Kc.now(), Ht.unstable_now = function() {
      return Kc.now() - pr;
    });
    var hr, Kc, pr, ve = [], Ve = [], _p = 1, Zl = null, ml = 3, Fc = false, Za = false, Va = false, $c = false, vr = typeof setTimeout == "function" ? setTimeout : null, br = typeof clearTimeout == "function" ? clearTimeout : null, yr = typeof setImmediate < "u" ? setImmediate : null;
    function $u(t) {
      for (var l = fe(Ve); l !== null; ) {
        if (l.callback === null) Iu(Ve);
        else if (l.startTime <= t) Iu(Ve), l.sortIndex = l.expirationTime, Wc(ve, l);
        else break;
        l = fe(Ve);
      }
    }
    function Ic(t) {
      if (Va = false, $u(t), !Za) if (fe(ve) !== null) Za = true, $n || ($n = true, Fn());
      else {
        var l = fe(Ve);
        l !== null && Pc(Ic, l.startTime - t);
      }
    }
    var $n = false, Ka = -1, Sr = 5, Nr = -1;
    function Er() {
      return $c ? true : !(Ht.unstable_now() - Nr < Sr);
    }
    function Jc() {
      if ($c = false, $n) {
        var t = Ht.unstable_now();
        Nr = t;
        var l = true;
        try {
          t: {
            Za = false, Va && (Va = false, br(Ka), Ka = -1), Fc = true;
            var e = ml;
            try {
              l: {
                for ($u(t), Zl = fe(ve); Zl !== null && !(Zl.expirationTime > t && Er()); ) {
                  var n = Zl.callback;
                  if (typeof n == "function") {
                    Zl.callback = null, ml = Zl.priorityLevel;
                    var a = n(Zl.expirationTime <= t);
                    if (t = Ht.unstable_now(), typeof a == "function") {
                      Zl.callback = a, $u(t), l = true;
                      break l;
                    }
                    Zl === fe(ve) && Iu(ve), $u(t);
                  } else Iu(ve);
                  Zl = fe(ve);
                }
                if (Zl !== null) l = true;
                else {
                  var u = fe(Ve);
                  u !== null && Pc(Ic, u.startTime - t), l = false;
                }
              }
              break t;
            } finally {
              Zl = null, ml = e, Fc = false;
            }
            l = void 0;
          }
        } finally {
          l ? Fn() : $n = false;
        }
      }
    }
    var Fn;
    typeof yr == "function" ? Fn = function() {
      yr(Jc);
    } : typeof MessageChannel < "u" ? (kc = new MessageChannel(), gr = kc.port2, kc.port1.onmessage = Jc, Fn = function() {
      gr.postMessage(null);
    }) : Fn = function() {
      vr(Jc, 0);
    };
    var kc, gr;
    function Pc(t, l) {
      Ka = vr(function() {
        t(Ht.unstable_now());
      }, l);
    }
    Ht.unstable_IdlePriority = 5;
    Ht.unstable_ImmediatePriority = 1;
    Ht.unstable_LowPriority = 4;
    Ht.unstable_NormalPriority = 3;
    Ht.unstable_Profiling = null;
    Ht.unstable_UserBlockingPriority = 2;
    Ht.unstable_cancelCallback = function(t) {
      t.callback = null;
    };
    Ht.unstable_forceFrameRate = function(t) {
      0 > t || 125 < t ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : Sr = 0 < t ? Math.floor(1e3 / t) : 5;
    };
    Ht.unstable_getCurrentPriorityLevel = function() {
      return ml;
    };
    Ht.unstable_next = function(t) {
      switch (ml) {
        case 1:
        case 2:
        case 3:
          var l = 3;
          break;
        default:
          l = ml;
      }
      var e = ml;
      ml = l;
      try {
        return t();
      } finally {
        ml = e;
      }
    };
    Ht.unstable_requestPaint = function() {
      $c = true;
    };
    Ht.unstable_runWithPriority = function(t, l) {
      switch (t) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          break;
        default:
          t = 3;
      }
      var e = ml;
      ml = t;
      try {
        return l();
      } finally {
        ml = e;
      }
    };
    Ht.unstable_scheduleCallback = function(t, l, e) {
      var n = Ht.unstable_now();
      switch (typeof e == "object" && e !== null ? (e = e.delay, e = typeof e == "number" && 0 < e ? n + e : n) : e = n, t) {
        case 1:
          var a = -1;
          break;
        case 2:
          a = 250;
          break;
        case 5:
          a = 1073741823;
          break;
        case 4:
          a = 1e4;
          break;
        default:
          a = 5e3;
      }
      return a = e + a, t = { id: _p++, callback: l, priorityLevel: t, startTime: e, expirationTime: a, sortIndex: -1 }, e > n ? (t.sortIndex = e, Wc(Ve, t), fe(ve) === null && t === fe(Ve) && (Va ? (br(Ka), Ka = -1) : Va = true, Pc(Ic, e - n))) : (t.sortIndex = a, Wc(ve, t), Za || Fc || (Za = true, $n || ($n = true, Fn()))), t;
    };
    Ht.unstable_shouldYield = Er;
    Ht.unstable_wrapCallback = function(t) {
      var l = ml;
      return function() {
        var e = ml;
        ml = l;
        try {
          return t.apply(this, arguments);
        } finally {
          ml = e;
        }
      };
    };
  });
  var zr = Ze((Sv, Ar) => {
    "use strict";
    Ar.exports = Tr();
  });
  var Cr = Ze((vl) => {
    "use strict";
    var Up = yl();
    function Or(t) {
      var l = "https://react.dev/errors/" + t;
      if (1 < arguments.length) {
        l += "?args[]=" + encodeURIComponent(arguments[1]);
        for (var e = 2; e < arguments.length; e++) l += "&args[]=" + encodeURIComponent(arguments[e]);
      }
      return "Minified React error #" + t + "; visit " + l + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
    }
    function Ke() {
    }
    var gl = { d: { f: Ke, r: function() {
      throw Error(Or(522));
    }, D: Ke, C: Ke, L: Ke, m: Ke, X: Ke, S: Ke, M: Ke }, p: 0, findDOMNode: null }, Hp = Symbol.for("react.portal");
    function xp(t, l, e) {
      var n = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
      return { $$typeof: Hp, key: n == null ? null : "" + n, children: t, containerInfo: l, implementation: e };
    }
    var Ja = Up.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    function Pu(t, l) {
      if (t === "font") return "";
      if (typeof l == "string") return l === "use-credentials" ? l : "";
    }
    vl.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = gl;
    vl.createPortal = function(t, l) {
      var e = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
      if (!l || l.nodeType !== 1 && l.nodeType !== 9 && l.nodeType !== 11) throw Error(Or(299));
      return xp(t, l, null, e);
    };
    vl.flushSync = function(t) {
      var l = Ja.T, e = gl.p;
      try {
        if (Ja.T = null, gl.p = 2, t) return t();
      } finally {
        Ja.T = l, gl.p = e, gl.d.f();
      }
    };
    vl.preconnect = function(t, l) {
      typeof t == "string" && (l ? (l = l.crossOrigin, l = typeof l == "string" ? l === "use-credentials" ? l : "" : void 0) : l = null, gl.d.C(t, l));
    };
    vl.prefetchDNS = function(t) {
      typeof t == "string" && gl.d.D(t);
    };
    vl.preinit = function(t, l) {
      if (typeof t == "string" && l && typeof l.as == "string") {
        var e = l.as, n = Pu(e, l.crossOrigin), a = typeof l.integrity == "string" ? l.integrity : void 0, u = typeof l.fetchPriority == "string" ? l.fetchPriority : void 0;
        e === "style" ? gl.d.S(t, typeof l.precedence == "string" ? l.precedence : void 0, { crossOrigin: n, integrity: a, fetchPriority: u }) : e === "script" && gl.d.X(t, { crossOrigin: n, integrity: a, fetchPriority: u, nonce: typeof l.nonce == "string" ? l.nonce : void 0 });
      }
    };
    vl.preinitModule = function(t, l) {
      if (typeof t == "string") if (typeof l == "object" && l !== null) {
        if (l.as == null || l.as === "script") {
          var e = Pu(l.as, l.crossOrigin);
          gl.d.M(t, { crossOrigin: e, integrity: typeof l.integrity == "string" ? l.integrity : void 0, nonce: typeof l.nonce == "string" ? l.nonce : void 0 });
        }
      } else l == null && gl.d.M(t);
    };
    vl.preload = function(t, l) {
      if (typeof t == "string" && typeof l == "object" && l !== null && typeof l.as == "string") {
        var e = l.as, n = Pu(e, l.crossOrigin);
        gl.d.L(t, e, { crossOrigin: n, integrity: typeof l.integrity == "string" ? l.integrity : void 0, nonce: typeof l.nonce == "string" ? l.nonce : void 0, type: typeof l.type == "string" ? l.type : void 0, fetchPriority: typeof l.fetchPriority == "string" ? l.fetchPriority : void 0, referrerPolicy: typeof l.referrerPolicy == "string" ? l.referrerPolicy : void 0, imageSrcSet: typeof l.imageSrcSet == "string" ? l.imageSrcSet : void 0, imageSizes: typeof l.imageSizes == "string" ? l.imageSizes : void 0, media: typeof l.media == "string" ? l.media : void 0 });
      }
    };
    vl.preloadModule = function(t, l) {
      if (typeof t == "string") if (l) {
        var e = Pu(l.as, l.crossOrigin);
        gl.d.m(t, { as: typeof l.as == "string" && l.as !== "script" ? l.as : void 0, crossOrigin: e, integrity: typeof l.integrity == "string" ? l.integrity : void 0 });
      } else gl.d.m(t);
    };
    vl.requestFormReset = function(t) {
      gl.d.r(t);
    };
    vl.unstable_batchedUpdates = function(t, l) {
      return t(l);
    };
    vl.useFormState = function(t, l, e) {
      return Ja.H.useFormState(t, l, e);
    };
    vl.useFormStatus = function() {
      return Ja.H.useHostTransitionStatus();
    };
    vl.version = "19.2.0";
  });
  var _r = Ze((Ev, Dr) => {
    "use strict";
    function Mr() {
      if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function")) try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(Mr);
      } catch (t) {
        console.error(t);
      }
    }
    Mr(), Dr.exports = Cr();
  });
  var Qh = Ze((Tc) => {
    "use strict";
    var tl = zr(), em = yl(), Bp = _r();
    function z(t) {
      var l = "https://react.dev/errors/" + t;
      if (1 < arguments.length) {
        l += "?args[]=" + encodeURIComponent(arguments[1]);
        for (var e = 2; e < arguments.length; e++) l += "&args[]=" + encodeURIComponent(arguments[e]);
      }
      return "Minified React error #" + t + "; visit " + l + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
    }
    function nm(t) {
      return !(!t || t.nodeType !== 1 && t.nodeType !== 9 && t.nodeType !== 11);
    }
    function Hu(t) {
      var l = t, e = t;
      if (t.alternate) for (; l.return; ) l = l.return;
      else {
        t = l;
        do
          l = t, (l.flags & 4098) !== 0 && (e = l.return), t = l.return;
        while (t);
      }
      return l.tag === 3 ? e : null;
    }
    function am(t) {
      if (t.tag === 13) {
        var l = t.memoizedState;
        if (l === null && (t = t.alternate, t !== null && (l = t.memoizedState)), l !== null) return l.dehydrated;
      }
      return null;
    }
    function um(t) {
      if (t.tag === 31) {
        var l = t.memoizedState;
        if (l === null && (t = t.alternate, t !== null && (l = t.memoizedState)), l !== null) return l.dehydrated;
      }
      return null;
    }
    function Ur(t) {
      if (Hu(t) !== t) throw Error(z(188));
    }
    function qp(t) {
      var l = t.alternate;
      if (!l) {
        if (l = Hu(t), l === null) throw Error(z(188));
        return l !== t ? null : t;
      }
      for (var e = t, n = l; ; ) {
        var a = e.return;
        if (a === null) break;
        var u = a.alternate;
        if (u === null) {
          if (n = a.return, n !== null) {
            e = n;
            continue;
          }
          break;
        }
        if (a.child === u.child) {
          for (u = a.child; u; ) {
            if (u === e) return Ur(a), t;
            if (u === n) return Ur(a), l;
            u = u.sibling;
          }
          throw Error(z(188));
        }
        if (e.return !== n.return) e = a, n = u;
        else {
          for (var i = false, c = a.child; c; ) {
            if (c === e) {
              i = true, e = a, n = u;
              break;
            }
            if (c === n) {
              i = true, n = a, e = u;
              break;
            }
            c = c.sibling;
          }
          if (!i) {
            for (c = u.child; c; ) {
              if (c === e) {
                i = true, e = u, n = a;
                break;
              }
              if (c === n) {
                i = true, n = u, e = a;
                break;
              }
              c = c.sibling;
            }
            if (!i) throw Error(z(189));
          }
        }
        if (e.alternate !== n) throw Error(z(190));
      }
      if (e.tag !== 3) throw Error(z(188));
      return e.stateNode.current === e ? t : l;
    }
    function im(t) {
      var l = t.tag;
      if (l === 5 || l === 26 || l === 27 || l === 6) return t;
      for (t = t.child; t !== null; ) {
        if (l = im(t), l !== null) return l;
        t = t.sibling;
      }
      return null;
    }
    var _t = Object.assign, Yp = Symbol.for("react.element"), Ru = Symbol.for("react.transitional.element"), tu = Symbol.for("react.portal"), ea = Symbol.for("react.fragment"), cm = Symbol.for("react.strict_mode"), xf = Symbol.for("react.profiler"), fm = Symbol.for("react.consumer"), Oe = Symbol.for("react.context"), Ms = Symbol.for("react.forward_ref"), Bf = Symbol.for("react.suspense"), qf = Symbol.for("react.suspense_list"), Ds = Symbol.for("react.memo"), Je = Symbol.for("react.lazy");
    Symbol.for("react.scope");
    var Yf = Symbol.for("react.activity");
    Symbol.for("react.legacy_hidden");
    Symbol.for("react.tracing_marker");
    var Lp = Symbol.for("react.memo_cache_sentinel");
    Symbol.for("react.view_transition");
    var Hr = Symbol.iterator;
    function ka(t) {
      return t === null || typeof t != "object" ? null : (t = Hr && t[Hr] || t["@@iterator"], typeof t == "function" ? t : null);
    }
    var wp = Symbol.for("react.client.reference");
    function Lf(t) {
      if (t == null) return null;
      if (typeof t == "function") return t.$$typeof === wp ? null : t.displayName || t.name || null;
      if (typeof t == "string") return t;
      switch (t) {
        case ea:
          return "Fragment";
        case xf:
          return "Profiler";
        case cm:
          return "StrictMode";
        case Bf:
          return "Suspense";
        case qf:
          return "SuspenseList";
        case Yf:
          return "Activity";
      }
      if (typeof t == "object") switch (t.$$typeof) {
        case tu:
          return "Portal";
        case Oe:
          return t.displayName || "Context";
        case fm:
          return (t._context.displayName || "Context") + ".Consumer";
        case Ms:
          var l = t.render;
          return t = t.displayName, t || (t = l.displayName || l.name || "", t = t !== "" ? "ForwardRef(" + t + ")" : "ForwardRef"), t;
        case Ds:
          return l = t.displayName || null, l !== null ? l : Lf(t.type) || "Memo";
        case Je:
          l = t._payload, t = t._init;
          try {
            return Lf(t(l));
          } catch {
          }
      }
      return null;
    }
    var lu = Array.isArray, $ = em.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, ht = Bp.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, Cn = { pending: false, data: null, method: null, action: null }, wf = [], na = -1;
    function me(t) {
      return { current: t };
    }
    function nl(t) {
      0 > na || (t.current = wf[na], wf[na] = null, na--);
    }
    function Tt(t, l) {
      na++, wf[na] = t.current, t.current = l;
    }
    var de = me(null), vu = me(null), nn = me(null), Hi = me(null);
    function xi(t, l) {
      switch (Tt(nn, l), Tt(vu, t), Tt(de, null), l.nodeType) {
        case 9:
        case 11:
          t = (t = l.documentElement) && (t = t.namespaceURI) ? jd(t) : 0;
          break;
        default:
          if (t = l.tagName, l = l.namespaceURI) l = jd(l), t = Mh(l, t);
          else switch (t) {
            case "svg":
              t = 1;
              break;
            case "math":
              t = 2;
              break;
            default:
              t = 0;
          }
      }
      nl(de), Tt(de, t);
    }
    function Na() {
      nl(de), nl(vu), nl(nn);
    }
    function jf(t) {
      t.memoizedState !== null && Tt(Hi, t);
      var l = de.current, e = Mh(l, t.type);
      l !== e && (Tt(vu, t), Tt(de, e));
    }
    function Bi(t) {
      vu.current === t && (nl(de), nl(vu)), Hi.current === t && (nl(Hi), Du._currentValue = Cn);
    }
    var Rc, xr;
    function Tn(t) {
      if (Rc === void 0) try {
        throw Error();
      } catch (e) {
        var l = e.stack.trim().match(/\n( *(at )?)/);
        Rc = l && l[1] || "", xr = -1 < e.stack.indexOf(`
    at`) ? " (<anonymous>)" : -1 < e.stack.indexOf("@") ? "@unknown:0:0" : "";
      }
      return `
` + Rc + t + xr;
    }
    var tf = false;
    function lf(t, l) {
      if (!t || tf) return "";
      tf = true;
      var e = Error.prepareStackTrace;
      Error.prepareStackTrace = void 0;
      try {
        var n = { DetermineComponentFrameRoot: function() {
          try {
            if (l) {
              var b = function() {
                throw Error();
              };
              if (Object.defineProperty(b.prototype, "props", { set: function() {
                throw Error();
              } }), typeof Reflect == "object" && Reflect.construct) {
                try {
                  Reflect.construct(b, []);
                } catch (h) {
                  var m = h;
                }
                Reflect.construct(t, [], b);
              } else {
                try {
                  b.call();
                } catch (h) {
                  m = h;
                }
                t.call(b.prototype);
              }
            } else {
              try {
                throw Error();
              } catch (h) {
                m = h;
              }
              (b = t()) && typeof b.catch == "function" && b.catch(function() {
              });
            }
          } catch (h) {
            if (h && m && typeof h.stack == "string") return [h.stack, m.stack];
          }
          return [null, null];
        } };
        n.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
        var a = Object.getOwnPropertyDescriptor(n.DetermineComponentFrameRoot, "name");
        a && a.configurable && Object.defineProperty(n.DetermineComponentFrameRoot, "name", { value: "DetermineComponentFrameRoot" });
        var u = n.DetermineComponentFrameRoot(), i = u[0], c = u[1];
        if (i && c) {
          var f = i.split(`
`), r = c.split(`
`);
          for (a = n = 0; n < f.length && !f[n].includes("DetermineComponentFrameRoot"); ) n++;
          for (; a < r.length && !r[a].includes("DetermineComponentFrameRoot"); ) a++;
          if (n === f.length || a === r.length) for (n = f.length - 1, a = r.length - 1; 1 <= n && 0 <= a && f[n] !== r[a]; ) a--;
          for (; 1 <= n && 0 <= a; n--, a--) if (f[n] !== r[a]) {
            if (n !== 1 || a !== 1) do
              if (n--, a--, 0 > a || f[n] !== r[a]) {
                var y = `
` + f[n].replace(" at new ", " at ");
                return t.displayName && y.includes("<anonymous>") && (y = y.replace("<anonymous>", t.displayName)), y;
              }
            while (1 <= n && 0 <= a);
            break;
          }
        }
      } finally {
        tf = false, Error.prepareStackTrace = e;
      }
      return (e = t ? t.displayName || t.name : "") ? Tn(e) : "";
    }
    function jp(t, l) {
      switch (t.tag) {
        case 26:
        case 27:
        case 5:
          return Tn(t.type);
        case 16:
          return Tn("Lazy");
        case 13:
          return t.child !== l && l !== null ? Tn("Suspense Fallback") : Tn("Suspense");
        case 19:
          return Tn("SuspenseList");
        case 0:
        case 15:
          return lf(t.type, false);
        case 11:
          return lf(t.type.render, false);
        case 1:
          return lf(t.type, true);
        case 31:
          return Tn("Activity");
        default:
          return "";
      }
    }
    function Br(t) {
      try {
        var l = "", e = null;
        do
          l += jp(t, e), e = t, t = t.return;
        while (t);
        return l;
      } catch (n) {
        return `
Error generating stack: ` + n.message + `
` + n.stack;
      }
    }
    var Gf = Object.prototype.hasOwnProperty, _s = tl.unstable_scheduleCallback, ef = tl.unstable_cancelCallback, Gp = tl.unstable_shouldYield, Xp = tl.unstable_requestPaint, Yl = tl.unstable_now, Qp = tl.unstable_getCurrentPriorityLevel, sm = tl.unstable_ImmediatePriority, om = tl.unstable_UserBlockingPriority, qi = tl.unstable_NormalPriority, Zp = tl.unstable_LowPriority, rm = tl.unstable_IdlePriority, Vp = tl.log, Kp = tl.unstable_setDisableYieldValue, xu = null, Ll = null;
    function Pe(t) {
      if (typeof Vp == "function" && Kp(t), Ll && typeof Ll.setStrictMode == "function") try {
        Ll.setStrictMode(xu, t);
      } catch {
      }
    }
    var wl = Math.clz32 ? Math.clz32 : Wp, Jp = Math.log, kp = Math.LN2;
    function Wp(t) {
      return t >>>= 0, t === 0 ? 32 : 31 - (Jp(t) / kp | 0) | 0;
    }
    var ti = 256, li = 262144, ei = 4194304;
    function An(t) {
      var l = t & 42;
      if (l !== 0) return l;
      switch (t & -t) {
        case 1:
          return 1;
        case 2:
          return 2;
        case 4:
          return 4;
        case 8:
          return 8;
        case 16:
          return 16;
        case 32:
          return 32;
        case 64:
          return 64;
        case 128:
          return 128;
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
          return t & 261888;
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
          return t & 3932160;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
          return t & 62914560;
        case 67108864:
          return 67108864;
        case 134217728:
          return 134217728;
        case 268435456:
          return 268435456;
        case 536870912:
          return 536870912;
        case 1073741824:
          return 0;
        default:
          return t;
      }
    }
    function cc(t, l, e) {
      var n = t.pendingLanes;
      if (n === 0) return 0;
      var a = 0, u = t.suspendedLanes, i = t.pingedLanes;
      t = t.warmLanes;
      var c = n & 134217727;
      return c !== 0 ? (n = c & ~u, n !== 0 ? a = An(n) : (i &= c, i !== 0 ? a = An(i) : e || (e = c & ~t, e !== 0 && (a = An(e))))) : (c = n & ~u, c !== 0 ? a = An(c) : i !== 0 ? a = An(i) : e || (e = n & ~t, e !== 0 && (a = An(e)))), a === 0 ? 0 : l !== 0 && l !== a && (l & u) === 0 && (u = a & -a, e = l & -l, u >= e || u === 32 && (e & 4194048) !== 0) ? l : a;
    }
    function Bu(t, l) {
      return (t.pendingLanes & ~(t.suspendedLanes & ~t.pingedLanes) & l) === 0;
    }
    function Fp(t, l) {
      switch (t) {
        case 1:
        case 2:
        case 4:
        case 8:
        case 64:
          return l + 250;
        case 16:
        case 32:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
          return l + 5e3;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
          return -1;
        case 67108864:
        case 134217728:
        case 268435456:
        case 536870912:
        case 1073741824:
          return -1;
        default:
          return -1;
      }
    }
    function dm() {
      var t = ei;
      return ei <<= 1, (ei & 62914560) === 0 && (ei = 4194304), t;
    }
    function nf(t) {
      for (var l = [], e = 0; 31 > e; e++) l.push(t);
      return l;
    }
    function qu(t, l) {
      t.pendingLanes |= l, l !== 268435456 && (t.suspendedLanes = 0, t.pingedLanes = 0, t.warmLanes = 0);
    }
    function $p(t, l, e, n, a, u) {
      var i = t.pendingLanes;
      t.pendingLanes = e, t.suspendedLanes = 0, t.pingedLanes = 0, t.warmLanes = 0, t.expiredLanes &= e, t.entangledLanes &= e, t.errorRecoveryDisabledLanes &= e, t.shellSuspendCounter = 0;
      var c = t.entanglements, f = t.expirationTimes, r = t.hiddenUpdates;
      for (e = i & ~e; 0 < e; ) {
        var y = 31 - wl(e), b = 1 << y;
        c[y] = 0, f[y] = -1;
        var m = r[y];
        if (m !== null) for (r[y] = null, y = 0; y < m.length; y++) {
          var h = m[y];
          h !== null && (h.lane &= -536870913);
        }
        e &= ~b;
      }
      n !== 0 && mm(t, n, 0), u !== 0 && a === 0 && t.tag !== 0 && (t.suspendedLanes |= u & ~(i & ~l));
    }
    function mm(t, l, e) {
      t.pendingLanes |= l, t.suspendedLanes &= ~l;
      var n = 31 - wl(l);
      t.entangledLanes |= l, t.entanglements[n] = t.entanglements[n] | 1073741824 | e & 261930;
    }
    function hm(t, l) {
      var e = t.entangledLanes |= l;
      for (t = t.entanglements; e; ) {
        var n = 31 - wl(e), a = 1 << n;
        a & l | t[n] & l && (t[n] |= l), e &= ~a;
      }
    }
    function pm(t, l) {
      var e = l & -l;
      return e = (e & 42) !== 0 ? 1 : Us(e), (e & (t.suspendedLanes | l)) !== 0 ? 0 : e;
    }
    function Us(t) {
      switch (t) {
        case 2:
          t = 1;
          break;
        case 8:
          t = 4;
          break;
        case 32:
          t = 16;
          break;
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
          t = 128;
          break;
        case 268435456:
          t = 134217728;
          break;
        default:
          t = 0;
      }
      return t;
    }
    function Hs(t) {
      return t &= -t, 2 < t ? 8 < t ? (t & 134217727) !== 0 ? 32 : 268435456 : 8 : 2;
    }
    function ym() {
      var t = ht.p;
      return t !== 0 ? t : (t = window.event, t === void 0 ? 32 : jh(t.type));
    }
    function qr(t, l) {
      var e = ht.p;
      try {
        return ht.p = t, l();
      } finally {
        ht.p = e;
      }
    }
    var gn = Math.random().toString(36).slice(2), il = "__reactFiber$" + gn, Ml = "__reactProps$" + gn, Ha = "__reactContainer$" + gn, Xf = "__reactEvents$" + gn, Ip = "__reactListeners$" + gn, Pp = "__reactHandles$" + gn, Yr = "__reactResources$" + gn, Yu = "__reactMarker$" + gn;
    function xs(t) {
      delete t[il], delete t[Ml], delete t[Xf], delete t[Ip], delete t[Pp];
    }
    function aa(t) {
      var l = t[il];
      if (l) return l;
      for (var e = t.parentNode; e; ) {
        if (l = e[Ha] || e[il]) {
          if (e = l.alternate, l.child !== null || e !== null && e.child !== null) for (t = Vd(t); t !== null; ) {
            if (e = t[il]) return e;
            t = Vd(t);
          }
          return l;
        }
        t = e, e = t.parentNode;
      }
      return null;
    }
    function xa(t) {
      if (t = t[il] || t[Ha]) {
        var l = t.tag;
        if (l === 5 || l === 6 || l === 13 || l === 31 || l === 26 || l === 27 || l === 3) return t;
      }
      return null;
    }
    function eu(t) {
      var l = t.tag;
      if (l === 5 || l === 26 || l === 27 || l === 6) return t.stateNode;
      throw Error(z(33));
    }
    function ha(t) {
      var l = t[Yr];
      return l || (l = t[Yr] = { hoistableStyles: /* @__PURE__ */ new Map(), hoistableScripts: /* @__PURE__ */ new Map() }), l;
    }
    function el(t) {
      t[Yu] = true;
    }
    var gm = /* @__PURE__ */ new Set(), vm = {};
    function Ln(t, l) {
      Ea(t, l), Ea(t + "Capture", l);
    }
    function Ea(t, l) {
      for (vm[t] = l, t = 0; t < l.length; t++) gm.add(l[t]);
    }
    var Rp = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), Lr = {}, wr = {};
    function ty(t) {
      return Gf.call(wr, t) ? true : Gf.call(Lr, t) ? false : Rp.test(t) ? wr[t] = true : (Lr[t] = true, false);
    }
    function gi(t, l, e) {
      if (ty(l)) if (e === null) t.removeAttribute(l);
      else {
        switch (typeof e) {
          case "undefined":
          case "function":
          case "symbol":
            t.removeAttribute(l);
            return;
          case "boolean":
            var n = l.toLowerCase().slice(0, 5);
            if (n !== "data-" && n !== "aria-") {
              t.removeAttribute(l);
              return;
            }
        }
        t.setAttribute(l, "" + e);
      }
    }
    function ni(t, l, e) {
      if (e === null) t.removeAttribute(l);
      else {
        switch (typeof e) {
          case "undefined":
          case "function":
          case "symbol":
          case "boolean":
            t.removeAttribute(l);
            return;
        }
        t.setAttribute(l, "" + e);
      }
    }
    function be(t, l, e, n) {
      if (n === null) t.removeAttribute(e);
      else {
        switch (typeof n) {
          case "undefined":
          case "function":
          case "symbol":
          case "boolean":
            t.removeAttribute(e);
            return;
        }
        t.setAttributeNS(l, e, "" + n);
      }
    }
    function Kl(t) {
      switch (typeof t) {
        case "bigint":
        case "boolean":
        case "number":
        case "string":
        case "undefined":
          return t;
        case "object":
          return t;
        default:
          return "";
      }
    }
    function bm(t) {
      var l = t.type;
      return (t = t.nodeName) && t.toLowerCase() === "input" && (l === "checkbox" || l === "radio");
    }
    function ly(t, l, e) {
      var n = Object.getOwnPropertyDescriptor(t.constructor.prototype, l);
      if (!t.hasOwnProperty(l) && typeof n < "u" && typeof n.get == "function" && typeof n.set == "function") {
        var a = n.get, u = n.set;
        return Object.defineProperty(t, l, { configurable: true, get: function() {
          return a.call(this);
        }, set: function(i) {
          e = "" + i, u.call(this, i);
        } }), Object.defineProperty(t, l, { enumerable: n.enumerable }), { getValue: function() {
          return e;
        }, setValue: function(i) {
          e = "" + i;
        }, stopTracking: function() {
          t._valueTracker = null, delete t[l];
        } };
      }
    }
    function Qf(t) {
      if (!t._valueTracker) {
        var l = bm(t) ? "checked" : "value";
        t._valueTracker = ly(t, l, "" + t[l]);
      }
    }
    function Sm(t) {
      if (!t) return false;
      var l = t._valueTracker;
      if (!l) return true;
      var e = l.getValue(), n = "";
      return t && (n = bm(t) ? t.checked ? "true" : "false" : t.value), t = n, t !== e ? (l.setValue(t), true) : false;
    }
    function Yi(t) {
      if (t = t || (typeof document < "u" ? document : void 0), typeof t > "u") return null;
      try {
        return t.activeElement || t.body;
      } catch {
        return t.body;
      }
    }
    var ey = /[\n"\\]/g;
    function Wl(t) {
      return t.replace(ey, function(l) {
        return "\\" + l.charCodeAt(0).toString(16) + " ";
      });
    }
    function Zf(t, l, e, n, a, u, i, c) {
      t.name = "", i != null && typeof i != "function" && typeof i != "symbol" && typeof i != "boolean" ? t.type = i : t.removeAttribute("type"), l != null ? i === "number" ? (l === 0 && t.value === "" || t.value != l) && (t.value = "" + Kl(l)) : t.value !== "" + Kl(l) && (t.value = "" + Kl(l)) : i !== "submit" && i !== "reset" || t.removeAttribute("value"), l != null ? Vf(t, i, Kl(l)) : e != null ? Vf(t, i, Kl(e)) : n != null && t.removeAttribute("value"), a == null && u != null && (t.defaultChecked = !!u), a != null && (t.checked = a && typeof a != "function" && typeof a != "symbol"), c != null && typeof c != "function" && typeof c != "symbol" && typeof c != "boolean" ? t.name = "" + Kl(c) : t.removeAttribute("name");
    }
    function Nm(t, l, e, n, a, u, i, c) {
      if (u != null && typeof u != "function" && typeof u != "symbol" && typeof u != "boolean" && (t.type = u), l != null || e != null) {
        if (!(u !== "submit" && u !== "reset" || l != null)) {
          Qf(t);
          return;
        }
        e = e != null ? "" + Kl(e) : "", l = l != null ? "" + Kl(l) : e, c || l === t.value || (t.value = l), t.defaultValue = l;
      }
      n = n ?? a, n = typeof n != "function" && typeof n != "symbol" && !!n, t.checked = c ? t.checked : !!n, t.defaultChecked = !!n, i != null && typeof i != "function" && typeof i != "symbol" && typeof i != "boolean" && (t.name = i), Qf(t);
    }
    function Vf(t, l, e) {
      l === "number" && Yi(t.ownerDocument) === t || t.defaultValue === "" + e || (t.defaultValue = "" + e);
    }
    function pa(t, l, e, n) {
      if (t = t.options, l) {
        l = {};
        for (var a = 0; a < e.length; a++) l["$" + e[a]] = true;
        for (e = 0; e < t.length; e++) a = l.hasOwnProperty("$" + t[e].value), t[e].selected !== a && (t[e].selected = a), a && n && (t[e].defaultSelected = true);
      } else {
        for (e = "" + Kl(e), l = null, a = 0; a < t.length; a++) {
          if (t[a].value === e) {
            t[a].selected = true, n && (t[a].defaultSelected = true);
            return;
          }
          l !== null || t[a].disabled || (l = t[a]);
        }
        l !== null && (l.selected = true);
      }
    }
    function Em(t, l, e) {
      if (l != null && (l = "" + Kl(l), l !== t.value && (t.value = l), e == null)) {
        t.defaultValue !== l && (t.defaultValue = l);
        return;
      }
      t.defaultValue = e != null ? "" + Kl(e) : "";
    }
    function Tm(t, l, e, n) {
      if (l == null) {
        if (n != null) {
          if (e != null) throw Error(z(92));
          if (lu(n)) {
            if (1 < n.length) throw Error(z(93));
            n = n[0];
          }
          e = n;
        }
        e == null && (e = ""), l = e;
      }
      e = Kl(l), t.defaultValue = e, n = t.textContent, n === e && n !== "" && n !== null && (t.value = n), Qf(t);
    }
    function Ta(t, l) {
      if (l) {
        var e = t.firstChild;
        if (e && e === t.lastChild && e.nodeType === 3) {
          e.nodeValue = l;
          return;
        }
      }
      t.textContent = l;
    }
    var ny = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
    function jr(t, l, e) {
      var n = l.indexOf("--") === 0;
      e == null || typeof e == "boolean" || e === "" ? n ? t.setProperty(l, "") : l === "float" ? t.cssFloat = "" : t[l] = "" : n ? t.setProperty(l, e) : typeof e != "number" || e === 0 || ny.has(l) ? l === "float" ? t.cssFloat = e : t[l] = ("" + e).trim() : t[l] = e + "px";
    }
    function Am(t, l, e) {
      if (l != null && typeof l != "object") throw Error(z(62));
      if (t = t.style, e != null) {
        for (var n in e) !e.hasOwnProperty(n) || l != null && l.hasOwnProperty(n) || (n.indexOf("--") === 0 ? t.setProperty(n, "") : n === "float" ? t.cssFloat = "" : t[n] = "");
        for (var a in l) n = l[a], l.hasOwnProperty(a) && e[a] !== n && jr(t, a, n);
      } else for (var u in l) l.hasOwnProperty(u) && jr(t, u, l[u]);
    }
    function Bs(t) {
      if (t.indexOf("-") === -1) return false;
      switch (t) {
        case "annotation-xml":
        case "color-profile":
        case "font-face":
        case "font-face-src":
        case "font-face-uri":
        case "font-face-format":
        case "font-face-name":
        case "missing-glyph":
          return false;
        default:
          return true;
      }
    }
    var ay = /* @__PURE__ */ new Map([["acceptCharset", "accept-charset"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"], ["crossOrigin", "crossorigin"], ["accentHeight", "accent-height"], ["alignmentBaseline", "alignment-baseline"], ["arabicForm", "arabic-form"], ["baselineShift", "baseline-shift"], ["capHeight", "cap-height"], ["clipPath", "clip-path"], ["clipRule", "clip-rule"], ["colorInterpolation", "color-interpolation"], ["colorInterpolationFilters", "color-interpolation-filters"], ["colorProfile", "color-profile"], ["colorRendering", "color-rendering"], ["dominantBaseline", "dominant-baseline"], ["enableBackground", "enable-background"], ["fillOpacity", "fill-opacity"], ["fillRule", "fill-rule"], ["floodColor", "flood-color"], ["floodOpacity", "flood-opacity"], ["fontFamily", "font-family"], ["fontSize", "font-size"], ["fontSizeAdjust", "font-size-adjust"], ["fontStretch", "font-stretch"], ["fontStyle", "font-style"], ["fontVariant", "font-variant"], ["fontWeight", "font-weight"], ["glyphName", "glyph-name"], ["glyphOrientationHorizontal", "glyph-orientation-horizontal"], ["glyphOrientationVertical", "glyph-orientation-vertical"], ["horizAdvX", "horiz-adv-x"], ["horizOriginX", "horiz-origin-x"], ["imageRendering", "image-rendering"], ["letterSpacing", "letter-spacing"], ["lightingColor", "lighting-color"], ["markerEnd", "marker-end"], ["markerMid", "marker-mid"], ["markerStart", "marker-start"], ["overlinePosition", "overline-position"], ["overlineThickness", "overline-thickness"], ["paintOrder", "paint-order"], ["panose-1", "panose-1"], ["pointerEvents", "pointer-events"], ["renderingIntent", "rendering-intent"], ["shapeRendering", "shape-rendering"], ["stopColor", "stop-color"], ["stopOpacity", "stop-opacity"], ["strikethroughPosition", "strikethrough-position"], ["strikethroughThickness", "strikethrough-thickness"], ["strokeDasharray", "stroke-dasharray"], ["strokeDashoffset", "stroke-dashoffset"], ["strokeLinecap", "stroke-linecap"], ["strokeLinejoin", "stroke-linejoin"], ["strokeMiterlimit", "stroke-miterlimit"], ["strokeOpacity", "stroke-opacity"], ["strokeWidth", "stroke-width"], ["textAnchor", "text-anchor"], ["textDecoration", "text-decoration"], ["textRendering", "text-rendering"], ["transformOrigin", "transform-origin"], ["underlinePosition", "underline-position"], ["underlineThickness", "underline-thickness"], ["unicodeBidi", "unicode-bidi"], ["unicodeRange", "unicode-range"], ["unitsPerEm", "units-per-em"], ["vAlphabetic", "v-alphabetic"], ["vHanging", "v-hanging"], ["vIdeographic", "v-ideographic"], ["vMathematical", "v-mathematical"], ["vectorEffect", "vector-effect"], ["vertAdvY", "vert-adv-y"], ["vertOriginX", "vert-origin-x"], ["vertOriginY", "vert-origin-y"], ["wordSpacing", "word-spacing"], ["writingMode", "writing-mode"], ["xmlnsXlink", "xmlns:xlink"], ["xHeight", "x-height"]]), uy = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
    function vi(t) {
      return uy.test("" + t) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : t;
    }
    function Ce() {
    }
    var Kf = null;
    function qs(t) {
      return t = t.target || t.srcElement || window, t.correspondingUseElement && (t = t.correspondingUseElement), t.nodeType === 3 ? t.parentNode : t;
    }
    var ua = null, ya = null;
    function Gr(t) {
      var l = xa(t);
      if (l && (t = l.stateNode)) {
        var e = t[Ml] || null;
        t: switch (t = l.stateNode, l.type) {
          case "input":
            if (Zf(t, e.value, e.defaultValue, e.defaultValue, e.checked, e.defaultChecked, e.type, e.name), l = e.name, e.type === "radio" && l != null) {
              for (e = t; e.parentNode; ) e = e.parentNode;
              for (e = e.querySelectorAll('input[name="' + Wl("" + l) + '"][type="radio"]'), l = 0; l < e.length; l++) {
                var n = e[l];
                if (n !== t && n.form === t.form) {
                  var a = n[Ml] || null;
                  if (!a) throw Error(z(90));
                  Zf(n, a.value, a.defaultValue, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name);
                }
              }
              for (l = 0; l < e.length; l++) n = e[l], n.form === t.form && Sm(n);
            }
            break t;
          case "textarea":
            Em(t, e.value, e.defaultValue);
            break t;
          case "select":
            l = e.value, l != null && pa(t, !!e.multiple, l, false);
        }
      }
    }
    var af = false;
    function zm(t, l, e) {
      if (af) return t(l, e);
      af = true;
      try {
        var n = t(l);
        return n;
      } finally {
        if (af = false, (ua !== null || ya !== null) && (bc(), ua && (l = ua, t = ya, ya = ua = null, Gr(l), t))) for (l = 0; l < t.length; l++) Gr(t[l]);
      }
    }
    function bu(t, l) {
      var e = t.stateNode;
      if (e === null) return null;
      var n = e[Ml] || null;
      if (n === null) return null;
      e = n[l];
      t: switch (l) {
        case "onClick":
        case "onClickCapture":
        case "onDoubleClick":
        case "onDoubleClickCapture":
        case "onMouseDown":
        case "onMouseDownCapture":
        case "onMouseMove":
        case "onMouseMoveCapture":
        case "onMouseUp":
        case "onMouseUpCapture":
        case "onMouseEnter":
          (n = !n.disabled) || (t = t.type, n = !(t === "button" || t === "input" || t === "select" || t === "textarea")), t = !n;
          break t;
        default:
          t = false;
      }
      if (t) return null;
      if (e && typeof e != "function") throw Error(z(231, l, typeof e));
      return e;
    }
    var He = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), Jf = false;
    if (He) try {
      In = {}, Object.defineProperty(In, "passive", { get: function() {
        Jf = true;
      } }), window.addEventListener("test", In, In), window.removeEventListener("test", In, In);
    } catch {
      Jf = false;
    }
    var In, Re = null, Ys = null, bi = null;
    function Om() {
      if (bi) return bi;
      var t, l = Ys, e = l.length, n, a = "value" in Re ? Re.value : Re.textContent, u = a.length;
      for (t = 0; t < e && l[t] === a[t]; t++) ;
      var i = e - t;
      for (n = 1; n <= i && l[e - n] === a[u - n]; n++) ;
      return bi = a.slice(t, 1 < n ? 1 - n : void 0);
    }
    function Si(t) {
      var l = t.keyCode;
      return "charCode" in t ? (t = t.charCode, t === 0 && l === 13 && (t = 13)) : t = l, t === 10 && (t = 13), 32 <= t || t === 13 ? t : 0;
    }
    function ai() {
      return true;
    }
    function Xr() {
      return false;
    }
    function Dl(t) {
      function l(e, n, a, u, i) {
        this._reactName = e, this._targetInst = a, this.type = n, this.nativeEvent = u, this.target = i, this.currentTarget = null;
        for (var c in t) t.hasOwnProperty(c) && (e = t[c], this[c] = e ? e(u) : u[c]);
        return this.isDefaultPrevented = (u.defaultPrevented != null ? u.defaultPrevented : u.returnValue === false) ? ai : Xr, this.isPropagationStopped = Xr, this;
      }
      return _t(l.prototype, { preventDefault: function() {
        this.defaultPrevented = true;
        var e = this.nativeEvent;
        e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = false), this.isDefaultPrevented = ai);
      }, stopPropagation: function() {
        var e = this.nativeEvent;
        e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = true), this.isPropagationStopped = ai);
      }, persist: function() {
      }, isPersistent: ai }), l;
    }
    var wn = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(t) {
      return t.timeStamp || Date.now();
    }, defaultPrevented: 0, isTrusted: 0 }, fc = Dl(wn), Lu = _t({}, wn, { view: 0, detail: 0 }), iy = Dl(Lu), uf, cf, Wa, sc = _t({}, Lu, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: Ls, button: 0, buttons: 0, relatedTarget: function(t) {
      return t.relatedTarget === void 0 ? t.fromElement === t.srcElement ? t.toElement : t.fromElement : t.relatedTarget;
    }, movementX: function(t) {
      return "movementX" in t ? t.movementX : (t !== Wa && (Wa && t.type === "mousemove" ? (uf = t.screenX - Wa.screenX, cf = t.screenY - Wa.screenY) : cf = uf = 0, Wa = t), uf);
    }, movementY: function(t) {
      return "movementY" in t ? t.movementY : cf;
    } }), Qr = Dl(sc), cy = _t({}, sc, { dataTransfer: 0 }), fy = Dl(cy), sy = _t({}, Lu, { relatedTarget: 0 }), ff = Dl(sy), oy = _t({}, wn, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }), ry = Dl(oy), dy = _t({}, wn, { clipboardData: function(t) {
      return "clipboardData" in t ? t.clipboardData : window.clipboardData;
    } }), my = Dl(dy), hy = _t({}, wn, { data: 0 }), Zr = Dl(hy), py = { Esc: "Escape", Spacebar: " ", Left: "ArrowLeft", Up: "ArrowUp", Right: "ArrowRight", Down: "ArrowDown", Del: "Delete", Win: "OS", Menu: "ContextMenu", Apps: "ContextMenu", Scroll: "ScrollLock", MozPrintableKey: "Unidentified" }, yy = { 8: "Backspace", 9: "Tab", 12: "Clear", 13: "Enter", 16: "Shift", 17: "Control", 18: "Alt", 19: "Pause", 20: "CapsLock", 27: "Escape", 32: " ", 33: "PageUp", 34: "PageDown", 35: "End", 36: "Home", 37: "ArrowLeft", 38: "ArrowUp", 39: "ArrowRight", 40: "ArrowDown", 45: "Insert", 46: "Delete", 112: "F1", 113: "F2", 114: "F3", 115: "F4", 116: "F5", 117: "F6", 118: "F7", 119: "F8", 120: "F9", 121: "F10", 122: "F11", 123: "F12", 144: "NumLock", 145: "ScrollLock", 224: "Meta" }, gy = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
    function vy(t) {
      var l = this.nativeEvent;
      return l.getModifierState ? l.getModifierState(t) : (t = gy[t]) ? !!l[t] : false;
    }
    function Ls() {
      return vy;
    }
    var by = _t({}, Lu, { key: function(t) {
      if (t.key) {
        var l = py[t.key] || t.key;
        if (l !== "Unidentified") return l;
      }
      return t.type === "keypress" ? (t = Si(t), t === 13 ? "Enter" : String.fromCharCode(t)) : t.type === "keydown" || t.type === "keyup" ? yy[t.keyCode] || "Unidentified" : "";
    }, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: Ls, charCode: function(t) {
      return t.type === "keypress" ? Si(t) : 0;
    }, keyCode: function(t) {
      return t.type === "keydown" || t.type === "keyup" ? t.keyCode : 0;
    }, which: function(t) {
      return t.type === "keypress" ? Si(t) : t.type === "keydown" || t.type === "keyup" ? t.keyCode : 0;
    } }), Sy = Dl(by), Ny = _t({}, sc, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 }), Vr = Dl(Ny), Ey = _t({}, Lu, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: Ls }), Ty = Dl(Ey), Ay = _t({}, wn, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }), zy = Dl(Ay), Oy = _t({}, sc, { deltaX: function(t) {
      return "deltaX" in t ? t.deltaX : "wheelDeltaX" in t ? -t.wheelDeltaX : 0;
    }, deltaY: function(t) {
      return "deltaY" in t ? t.deltaY : "wheelDeltaY" in t ? -t.wheelDeltaY : "wheelDelta" in t ? -t.wheelDelta : 0;
    }, deltaZ: 0, deltaMode: 0 }), Cy = Dl(Oy), My = _t({}, wn, { newState: 0, oldState: 0 }), Dy = Dl(My), _y = [9, 13, 27, 32], ws = He && "CompositionEvent" in window, uu = null;
    He && "documentMode" in document && (uu = document.documentMode);
    var Uy = He && "TextEvent" in window && !uu, Cm = He && (!ws || uu && 8 < uu && 11 >= uu), Kr = " ", Jr = false;
    function Mm(t, l) {
      switch (t) {
        case "keyup":
          return _y.indexOf(l.keyCode) !== -1;
        case "keydown":
          return l.keyCode !== 229;
        case "keypress":
        case "mousedown":
        case "focusout":
          return true;
        default:
          return false;
      }
    }
    function Dm(t) {
      return t = t.detail, typeof t == "object" && "data" in t ? t.data : null;
    }
    var ia = false;
    function Hy(t, l) {
      switch (t) {
        case "compositionend":
          return Dm(l);
        case "keypress":
          return l.which !== 32 ? null : (Jr = true, Kr);
        case "textInput":
          return t = l.data, t === Kr && Jr ? null : t;
        default:
          return null;
      }
    }
    function xy(t, l) {
      if (ia) return t === "compositionend" || !ws && Mm(t, l) ? (t = Om(), bi = Ys = Re = null, ia = false, t) : null;
      switch (t) {
        case "paste":
          return null;
        case "keypress":
          if (!(l.ctrlKey || l.altKey || l.metaKey) || l.ctrlKey && l.altKey) {
            if (l.char && 1 < l.char.length) return l.char;
            if (l.which) return String.fromCharCode(l.which);
          }
          return null;
        case "compositionend":
          return Cm && l.locale !== "ko" ? null : l.data;
        default:
          return null;
      }
    }
    var By = { color: true, date: true, datetime: true, "datetime-local": true, email: true, month: true, number: true, password: true, range: true, search: true, tel: true, text: true, time: true, url: true, week: true };
    function kr(t) {
      var l = t && t.nodeName && t.nodeName.toLowerCase();
      return l === "input" ? !!By[t.type] : l === "textarea";
    }
    function _m(t, l, e, n) {
      ua ? ya ? ya.push(n) : ya = [n] : ua = n, l = tc(l, "onChange"), 0 < l.length && (e = new fc("onChange", "change", null, e, n), t.push({ event: e, listeners: l }));
    }
    var iu = null, Su = null;
    function qy(t) {
      zh(t, 0);
    }
    function oc(t) {
      var l = eu(t);
      if (Sm(l)) return t;
    }
    function Wr(t, l) {
      if (t === "change") return l;
    }
    var Um = false;
    He && (He ? (ii = "oninput" in document, ii || (sf = document.createElement("div"), sf.setAttribute("oninput", "return;"), ii = typeof sf.oninput == "function"), ui = ii) : ui = false, Um = ui && (!document.documentMode || 9 < document.documentMode));
    var ui, ii, sf;
    function Fr() {
      iu && (iu.detachEvent("onpropertychange", Hm), Su = iu = null);
    }
    function Hm(t) {
      if (t.propertyName === "value" && oc(Su)) {
        var l = [];
        _m(l, Su, t, qs(t)), zm(qy, l);
      }
    }
    function Yy(t, l, e) {
      t === "focusin" ? (Fr(), iu = l, Su = e, iu.attachEvent("onpropertychange", Hm)) : t === "focusout" && Fr();
    }
    function Ly(t) {
      if (t === "selectionchange" || t === "keyup" || t === "keydown") return oc(Su);
    }
    function wy(t, l) {
      if (t === "click") return oc(l);
    }
    function jy(t, l) {
      if (t === "input" || t === "change") return oc(l);
    }
    function Gy(t, l) {
      return t === l && (t !== 0 || 1 / t === 1 / l) || t !== t && l !== l;
    }
    var Gl = typeof Object.is == "function" ? Object.is : Gy;
    function Nu(t, l) {
      if (Gl(t, l)) return true;
      if (typeof t != "object" || t === null || typeof l != "object" || l === null) return false;
      var e = Object.keys(t), n = Object.keys(l);
      if (e.length !== n.length) return false;
      for (n = 0; n < e.length; n++) {
        var a = e[n];
        if (!Gf.call(l, a) || !Gl(t[a], l[a])) return false;
      }
      return true;
    }
    function $r(t) {
      for (; t && t.firstChild; ) t = t.firstChild;
      return t;
    }
    function Ir(t, l) {
      var e = $r(t);
      t = 0;
      for (var n; e; ) {
        if (e.nodeType === 3) {
          if (n = t + e.textContent.length, t <= l && n >= l) return { node: e, offset: l - t };
          t = n;
        }
        t: {
          for (; e; ) {
            if (e.nextSibling) {
              e = e.nextSibling;
              break t;
            }
            e = e.parentNode;
          }
          e = void 0;
        }
        e = $r(e);
      }
    }
    function xm(t, l) {
      return t && l ? t === l ? true : t && t.nodeType === 3 ? false : l && l.nodeType === 3 ? xm(t, l.parentNode) : "contains" in t ? t.contains(l) : t.compareDocumentPosition ? !!(t.compareDocumentPosition(l) & 16) : false : false;
    }
    function Bm(t) {
      t = t != null && t.ownerDocument != null && t.ownerDocument.defaultView != null ? t.ownerDocument.defaultView : window;
      for (var l = Yi(t.document); l instanceof t.HTMLIFrameElement; ) {
        try {
          var e = typeof l.contentWindow.location.href == "string";
        } catch {
          e = false;
        }
        if (e) t = l.contentWindow;
        else break;
        l = Yi(t.document);
      }
      return l;
    }
    function js(t) {
      var l = t && t.nodeName && t.nodeName.toLowerCase();
      return l && (l === "input" && (t.type === "text" || t.type === "search" || t.type === "tel" || t.type === "url" || t.type === "password") || l === "textarea" || t.contentEditable === "true");
    }
    var Xy = He && "documentMode" in document && 11 >= document.documentMode, ca = null, kf = null, cu = null, Wf = false;
    function Pr(t, l, e) {
      var n = e.window === e ? e.document : e.nodeType === 9 ? e : e.ownerDocument;
      Wf || ca == null || ca !== Yi(n) || (n = ca, "selectionStart" in n && js(n) ? n = { start: n.selectionStart, end: n.selectionEnd } : (n = (n.ownerDocument && n.ownerDocument.defaultView || window).getSelection(), n = { anchorNode: n.anchorNode, anchorOffset: n.anchorOffset, focusNode: n.focusNode, focusOffset: n.focusOffset }), cu && Nu(cu, n) || (cu = n, n = tc(kf, "onSelect"), 0 < n.length && (l = new fc("onSelect", "select", null, l, e), t.push({ event: l, listeners: n }), l.target = ca)));
    }
    function En(t, l) {
      var e = {};
      return e[t.toLowerCase()] = l.toLowerCase(), e["Webkit" + t] = "webkit" + l, e["Moz" + t] = "moz" + l, e;
    }
    var fa = { animationend: En("Animation", "AnimationEnd"), animationiteration: En("Animation", "AnimationIteration"), animationstart: En("Animation", "AnimationStart"), transitionrun: En("Transition", "TransitionRun"), transitionstart: En("Transition", "TransitionStart"), transitioncancel: En("Transition", "TransitionCancel"), transitionend: En("Transition", "TransitionEnd") }, of = {}, qm = {};
    He && (qm = document.createElement("div").style, "AnimationEvent" in window || (delete fa.animationend.animation, delete fa.animationiteration.animation, delete fa.animationstart.animation), "TransitionEvent" in window || delete fa.transitionend.transition);
    function jn(t) {
      if (of[t]) return of[t];
      if (!fa[t]) return t;
      var l = fa[t], e;
      for (e in l) if (l.hasOwnProperty(e) && e in qm) return of[t] = l[e];
      return t;
    }
    var Ym = jn("animationend"), Lm = jn("animationiteration"), wm = jn("animationstart"), Qy = jn("transitionrun"), Zy = jn("transitionstart"), Vy = jn("transitioncancel"), jm = jn("transitionend"), Gm = /* @__PURE__ */ new Map(), Ff = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
    Ff.push("scrollEnd");
    function ie(t, l) {
      Gm.set(t, l), Ln(l, [t]);
    }
    var Li = typeof reportError == "function" ? reportError : function(t) {
      if (typeof window == "object" && typeof window.ErrorEvent == "function") {
        var l = new window.ErrorEvent("error", { bubbles: true, cancelable: true, message: typeof t == "object" && t !== null && typeof t.message == "string" ? String(t.message) : String(t), error: t });
        if (!window.dispatchEvent(l)) return;
      } else if (typeof process == "object" && typeof process.emit == "function") {
        process.emit("uncaughtException", t);
        return;
      }
      console.error(t);
    }, Vl = [], sa = 0, Gs = 0;
    function rc() {
      for (var t = sa, l = Gs = sa = 0; l < t; ) {
        var e = Vl[l];
        Vl[l++] = null;
        var n = Vl[l];
        Vl[l++] = null;
        var a = Vl[l];
        Vl[l++] = null;
        var u = Vl[l];
        if (Vl[l++] = null, n !== null && a !== null) {
          var i = n.pending;
          i === null ? a.next = a : (a.next = i.next, i.next = a), n.pending = a;
        }
        u !== 0 && Xm(e, a, u);
      }
    }
    function dc(t, l, e, n) {
      Vl[sa++] = t, Vl[sa++] = l, Vl[sa++] = e, Vl[sa++] = n, Gs |= n, t.lanes |= n, t = t.alternate, t !== null && (t.lanes |= n);
    }
    function Xs(t, l, e, n) {
      return dc(t, l, e, n), wi(t);
    }
    function Gn(t, l) {
      return dc(t, null, null, l), wi(t);
    }
    function Xm(t, l, e) {
      t.lanes |= e;
      var n = t.alternate;
      n !== null && (n.lanes |= e);
      for (var a = false, u = t.return; u !== null; ) u.childLanes |= e, n = u.alternate, n !== null && (n.childLanes |= e), u.tag === 22 && (t = u.stateNode, t === null || t._visibility & 1 || (a = true)), t = u, u = u.return;
      return t.tag === 3 ? (u = t.stateNode, a && l !== null && (a = 31 - wl(e), t = u.hiddenUpdates, n = t[a], n === null ? t[a] = [l] : n.push(l), l.lane = e | 536870912), u) : null;
    }
    function wi(t) {
      if (50 < yu) throw yu = 0, ys = null, Error(z(185));
      for (var l = t.return; l !== null; ) t = l, l = t.return;
      return t.tag === 3 ? t.stateNode : null;
    }
    var oa = {};
    function Ky(t, l, e, n) {
      this.tag = t, this.key = e, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = l, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = n, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
    }
    function Bl(t, l, e, n) {
      return new Ky(t, l, e, n);
    }
    function Qs(t) {
      return t = t.prototype, !(!t || !t.isReactComponent);
    }
    function De(t, l) {
      var e = t.alternate;
      return e === null ? (e = Bl(t.tag, l, t.key, t.mode), e.elementType = t.elementType, e.type = t.type, e.stateNode = t.stateNode, e.alternate = t, t.alternate = e) : (e.pendingProps = l, e.type = t.type, e.flags = 0, e.subtreeFlags = 0, e.deletions = null), e.flags = t.flags & 65011712, e.childLanes = t.childLanes, e.lanes = t.lanes, e.child = t.child, e.memoizedProps = t.memoizedProps, e.memoizedState = t.memoizedState, e.updateQueue = t.updateQueue, l = t.dependencies, e.dependencies = l === null ? null : { lanes: l.lanes, firstContext: l.firstContext }, e.sibling = t.sibling, e.index = t.index, e.ref = t.ref, e.refCleanup = t.refCleanup, e;
    }
    function Qm(t, l) {
      t.flags &= 65011714;
      var e = t.alternate;
      return e === null ? (t.childLanes = 0, t.lanes = l, t.child = null, t.subtreeFlags = 0, t.memoizedProps = null, t.memoizedState = null, t.updateQueue = null, t.dependencies = null, t.stateNode = null) : (t.childLanes = e.childLanes, t.lanes = e.lanes, t.child = e.child, t.subtreeFlags = 0, t.deletions = null, t.memoizedProps = e.memoizedProps, t.memoizedState = e.memoizedState, t.updateQueue = e.updateQueue, t.type = e.type, l = e.dependencies, t.dependencies = l === null ? null : { lanes: l.lanes, firstContext: l.firstContext }), t;
    }
    function Ni(t, l, e, n, a, u) {
      var i = 0;
      if (n = t, typeof t == "function") Qs(t) && (i = 1);
      else if (typeof t == "string") i = Wg(t, e, de.current) ? 26 : t === "html" || t === "head" || t === "body" ? 27 : 5;
      else t: switch (t) {
        case Yf:
          return t = Bl(31, e, l, a), t.elementType = Yf, t.lanes = u, t;
        case ea:
          return Mn(e.children, a, u, l);
        case cm:
          i = 8, a |= 24;
          break;
        case xf:
          return t = Bl(12, e, l, a | 2), t.elementType = xf, t.lanes = u, t;
        case Bf:
          return t = Bl(13, e, l, a), t.elementType = Bf, t.lanes = u, t;
        case qf:
          return t = Bl(19, e, l, a), t.elementType = qf, t.lanes = u, t;
        default:
          if (typeof t == "object" && t !== null) switch (t.$$typeof) {
            case Oe:
              i = 10;
              break t;
            case fm:
              i = 9;
              break t;
            case Ms:
              i = 11;
              break t;
            case Ds:
              i = 14;
              break t;
            case Je:
              i = 16, n = null;
              break t;
          }
          i = 29, e = Error(z(130, t === null ? "null" : typeof t, "")), n = null;
      }
      return l = Bl(i, e, l, a), l.elementType = t, l.type = n, l.lanes = u, l;
    }
    function Mn(t, l, e, n) {
      return t = Bl(7, t, n, l), t.lanes = e, t;
    }
    function rf(t, l, e) {
      return t = Bl(6, t, null, l), t.lanes = e, t;
    }
    function Zm(t) {
      var l = Bl(18, null, null, 0);
      return l.stateNode = t, l;
    }
    function df(t, l, e) {
      return l = Bl(4, t.children !== null ? t.children : [], t.key, l), l.lanes = e, l.stateNode = { containerInfo: t.containerInfo, pendingChildren: null, implementation: t.implementation }, l;
    }
    var Rr = /* @__PURE__ */ new WeakMap();
    function Fl(t, l) {
      if (typeof t == "object" && t !== null) {
        var e = Rr.get(t);
        return e !== void 0 ? e : (l = { value: t, source: l, stack: Br(l) }, Rr.set(t, l), l);
      }
      return { value: t, source: l, stack: Br(l) };
    }
    var ra = [], da = 0, ji = null, Eu = 0, Jl = [], kl = 0, mn = null, se = 1, oe = "";
    function Ae(t, l) {
      ra[da++] = Eu, ra[da++] = ji, ji = t, Eu = l;
    }
    function Vm(t, l, e) {
      Jl[kl++] = se, Jl[kl++] = oe, Jl[kl++] = mn, mn = t;
      var n = se;
      t = oe;
      var a = 32 - wl(n) - 1;
      n &= ~(1 << a), e += 1;
      var u = 32 - wl(l) + a;
      if (30 < u) {
        var i = a - a % 5;
        u = (n & (1 << i) - 1).toString(32), n >>= i, a -= i, se = 1 << 32 - wl(l) + a | e << a | n, oe = u + t;
      } else se = 1 << u | e << a | n, oe = t;
    }
    function Zs(t) {
      t.return !== null && (Ae(t, 1), Vm(t, 1, 0));
    }
    function Vs(t) {
      for (; t === ji; ) ji = ra[--da], ra[da] = null, Eu = ra[--da], ra[da] = null;
      for (; t === mn; ) mn = Jl[--kl], Jl[kl] = null, oe = Jl[--kl], Jl[kl] = null, se = Jl[--kl], Jl[kl] = null;
    }
    function Km(t, l) {
      Jl[kl++] = se, Jl[kl++] = oe, Jl[kl++] = mn, se = l.id, oe = l.overflow, mn = t;
    }
    var cl = null, Dt = null, st = false, an = null, $l = false, $f = Error(z(519));
    function hn(t) {
      var l = Error(z(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", ""));
      throw Tu(Fl(l, t)), $f;
    }
    function td(t) {
      var l = t.stateNode, e = t.type, n = t.memoizedProps;
      switch (l[il] = t, l[Ml] = n, e) {
        case "dialog":
          it("cancel", l), it("close", l);
          break;
        case "iframe":
        case "object":
        case "embed":
          it("load", l);
          break;
        case "video":
        case "audio":
          for (e = 0; e < Cu.length; e++) it(Cu[e], l);
          break;
        case "source":
          it("error", l);
          break;
        case "img":
        case "image":
        case "link":
          it("error", l), it("load", l);
          break;
        case "details":
          it("toggle", l);
          break;
        case "input":
          it("invalid", l), Nm(l, n.value, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name, true);
          break;
        case "select":
          it("invalid", l);
          break;
        case "textarea":
          it("invalid", l), Tm(l, n.value, n.defaultValue, n.children);
      }
      e = n.children, typeof e != "string" && typeof e != "number" && typeof e != "bigint" || l.textContent === "" + e || n.suppressHydrationWarning === true || Ch(l.textContent, e) ? (n.popover != null && (it("beforetoggle", l), it("toggle", l)), n.onScroll != null && it("scroll", l), n.onScrollEnd != null && it("scrollend", l), n.onClick != null && (l.onclick = Ce), l = true) : l = false, l || hn(t, true);
    }
    function ld(t) {
      for (cl = t.return; cl; ) switch (cl.tag) {
        case 5:
        case 31:
        case 13:
          $l = false;
          return;
        case 27:
        case 3:
          $l = true;
          return;
        default:
          cl = cl.return;
      }
    }
    function Pn(t) {
      if (t !== cl) return false;
      if (!st) return ld(t), st = true, false;
      var l = t.tag, e;
      if ((e = l !== 3 && l !== 27) && ((e = l === 5) && (e = t.type, e = !(e !== "form" && e !== "button") || Ns(t.type, t.memoizedProps)), e = !e), e && Dt && hn(t), ld(t), l === 13) {
        if (t = t.memoizedState, t = t !== null ? t.dehydrated : null, !t) throw Error(z(317));
        Dt = Zd(t);
      } else if (l === 31) {
        if (t = t.memoizedState, t = t !== null ? t.dehydrated : null, !t) throw Error(z(317));
        Dt = Zd(t);
      } else l === 27 ? (l = Dt, vn(t.type) ? (t = zs, zs = null, Dt = t) : Dt = l) : Dt = cl ? Pl(t.stateNode.nextSibling) : null;
      return true;
    }
    function Hn() {
      Dt = cl = null, st = false;
    }
    function mf() {
      var t = an;
      return t !== null && (Ol === null ? Ol = t : Ol.push.apply(Ol, t), an = null), t;
    }
    function Tu(t) {
      an === null ? an = [t] : an.push(t);
    }
    var If = me(null), Xn = null, Me = null;
    function We(t, l, e) {
      Tt(If, l._currentValue), l._currentValue = e;
    }
    function _e(t) {
      t._currentValue = If.current, nl(If);
    }
    function Pf(t, l, e) {
      for (; t !== null; ) {
        var n = t.alternate;
        if ((t.childLanes & l) !== l ? (t.childLanes |= l, n !== null && (n.childLanes |= l)) : n !== null && (n.childLanes & l) !== l && (n.childLanes |= l), t === e) break;
        t = t.return;
      }
    }
    function Rf(t, l, e, n) {
      var a = t.child;
      for (a !== null && (a.return = t); a !== null; ) {
        var u = a.dependencies;
        if (u !== null) {
          var i = a.child;
          u = u.firstContext;
          t: for (; u !== null; ) {
            var c = u;
            u = a;
            for (var f = 0; f < l.length; f++) if (c.context === l[f]) {
              u.lanes |= e, c = u.alternate, c !== null && (c.lanes |= e), Pf(u.return, e, t), n || (i = null);
              break t;
            }
            u = c.next;
          }
        } else if (a.tag === 18) {
          if (i = a.return, i === null) throw Error(z(341));
          i.lanes |= e, u = i.alternate, u !== null && (u.lanes |= e), Pf(i, e, t), i = null;
        } else i = a.child;
        if (i !== null) i.return = a;
        else for (i = a; i !== null; ) {
          if (i === t) {
            i = null;
            break;
          }
          if (a = i.sibling, a !== null) {
            a.return = i.return, i = a;
            break;
          }
          i = i.return;
        }
        a = i;
      }
    }
    function Ba(t, l, e, n) {
      t = null;
      for (var a = l, u = false; a !== null; ) {
        if (!u) {
          if ((a.flags & 524288) !== 0) u = true;
          else if ((a.flags & 262144) !== 0) break;
        }
        if (a.tag === 10) {
          var i = a.alternate;
          if (i === null) throw Error(z(387));
          if (i = i.memoizedProps, i !== null) {
            var c = a.type;
            Gl(a.pendingProps.value, i.value) || (t !== null ? t.push(c) : t = [c]);
          }
        } else if (a === Hi.current) {
          if (i = a.alternate, i === null) throw Error(z(387));
          i.memoizedState.memoizedState !== a.memoizedState.memoizedState && (t !== null ? t.push(Du) : t = [Du]);
        }
        a = a.return;
      }
      t !== null && Rf(l, t, e, n), l.flags |= 262144;
    }
    function Gi(t) {
      for (t = t.firstContext; t !== null; ) {
        if (!Gl(t.context._currentValue, t.memoizedValue)) return true;
        t = t.next;
      }
      return false;
    }
    function xn(t) {
      Xn = t, Me = null, t = t.dependencies, t !== null && (t.firstContext = null);
    }
    function fl(t) {
      return Jm(Xn, t);
    }
    function ci(t, l) {
      return Xn === null && xn(t), Jm(t, l);
    }
    function Jm(t, l) {
      var e = l._currentValue;
      if (l = { context: l, memoizedValue: e, next: null }, Me === null) {
        if (t === null) throw Error(z(308));
        Me = l, t.dependencies = { lanes: 0, firstContext: l }, t.flags |= 524288;
      } else Me = Me.next = l;
      return e;
    }
    var Jy = typeof AbortController < "u" ? AbortController : function() {
      var t = [], l = this.signal = { aborted: false, addEventListener: function(e, n) {
        t.push(n);
      } };
      this.abort = function() {
        l.aborted = true, t.forEach(function(e) {
          return e();
        });
      };
    }, ky = tl.unstable_scheduleCallback, Wy = tl.unstable_NormalPriority, It = { $$typeof: Oe, Consumer: null, Provider: null, _currentValue: null, _currentValue2: null, _threadCount: 0 };
    function Ks() {
      return { controller: new Jy(), data: /* @__PURE__ */ new Map(), refCount: 0 };
    }
    function wu(t) {
      t.refCount--, t.refCount === 0 && ky(Wy, function() {
        t.controller.abort();
      });
    }
    var fu = null, ts = 0, Aa = 0, ga = null;
    function Fy(t, l) {
      if (fu === null) {
        var e = fu = [];
        ts = 0, Aa = go(), ga = { status: "pending", value: void 0, then: function(n) {
          e.push(n);
        } };
      }
      return ts++, l.then(ed, ed), l;
    }
    function ed() {
      if (--ts === 0 && fu !== null) {
        ga !== null && (ga.status = "fulfilled");
        var t = fu;
        fu = null, Aa = 0, ga = null;
        for (var l = 0; l < t.length; l++) (0, t[l])();
      }
    }
    function $y(t, l) {
      var e = [], n = { status: "pending", value: null, reason: null, then: function(a) {
        e.push(a);
      } };
      return t.then(function() {
        n.status = "fulfilled", n.value = l;
        for (var a = 0; a < e.length; a++) (0, e[a])(l);
      }, function(a) {
        for (n.status = "rejected", n.reason = a, a = 0; a < e.length; a++) (0, e[a])(void 0);
      }), n;
    }
    var nd = $.S;
    $.S = function(t, l) {
      ih = Yl(), typeof l == "object" && l !== null && typeof l.then == "function" && Fy(t, l), nd !== null && nd(t, l);
    };
    var Dn = me(null);
    function Js() {
      var t = Dn.current;
      return t !== null ? t : Nt.pooledCache;
    }
    function Ei(t, l) {
      l === null ? Tt(Dn, Dn.current) : Tt(Dn, l.pool);
    }
    function km() {
      var t = Js();
      return t === null ? null : { parent: It._currentValue, pool: t };
    }
    var qa = Error(z(460)), ks = Error(z(474)), mc = Error(z(542)), Xi = { then: function() {
    } };
    function ad(t) {
      return t = t.status, t === "fulfilled" || t === "rejected";
    }
    function Wm(t, l, e) {
      switch (e = t[e], e === void 0 ? t.push(l) : e !== l && (l.then(Ce, Ce), l = e), l.status) {
        case "fulfilled":
          return l.value;
        case "rejected":
          throw t = l.reason, id(t), t;
        default:
          if (typeof l.status == "string") l.then(Ce, Ce);
          else {
            if (t = Nt, t !== null && 100 < t.shellSuspendCounter) throw Error(z(482));
            t = l, t.status = "pending", t.then(function(n) {
              if (l.status === "pending") {
                var a = l;
                a.status = "fulfilled", a.value = n;
              }
            }, function(n) {
              if (l.status === "pending") {
                var a = l;
                a.status = "rejected", a.reason = n;
              }
            });
          }
          switch (l.status) {
            case "fulfilled":
              return l.value;
            case "rejected":
              throw t = l.reason, id(t), t;
          }
          throw _n = l, qa;
      }
    }
    function zn(t) {
      try {
        var l = t._init;
        return l(t._payload);
      } catch (e) {
        throw e !== null && typeof e == "object" && typeof e.then == "function" ? (_n = e, qa) : e;
      }
    }
    var _n = null;
    function ud() {
      if (_n === null) throw Error(z(459));
      var t = _n;
      return _n = null, t;
    }
    function id(t) {
      if (t === qa || t === mc) throw Error(z(483));
    }
    var va = null, Au = 0;
    function fi(t) {
      var l = Au;
      return Au += 1, va === null && (va = []), Wm(va, t, l);
    }
    function Fa(t, l) {
      l = l.props.ref, t.ref = l !== void 0 ? l : null;
    }
    function si(t, l) {
      throw l.$$typeof === Yp ? Error(z(525)) : (t = Object.prototype.toString.call(l), Error(z(31, t === "[object Object]" ? "object with keys {" + Object.keys(l).join(", ") + "}" : t)));
    }
    function Fm(t) {
      function l(s, o) {
        if (t) {
          var p = s.deletions;
          p === null ? (s.deletions = [o], s.flags |= 16) : p.push(o);
        }
      }
      function e(s, o) {
        if (!t) return null;
        for (; o !== null; ) l(s, o), o = o.sibling;
        return null;
      }
      function n(s) {
        for (var o = /* @__PURE__ */ new Map(); s !== null; ) s.key !== null ? o.set(s.key, s) : o.set(s.index, s), s = s.sibling;
        return o;
      }
      function a(s, o) {
        return s = De(s, o), s.index = 0, s.sibling = null, s;
      }
      function u(s, o, p) {
        return s.index = p, t ? (p = s.alternate, p !== null ? (p = p.index, p < o ? (s.flags |= 67108866, o) : p) : (s.flags |= 67108866, o)) : (s.flags |= 1048576, o);
      }
      function i(s) {
        return t && s.alternate === null && (s.flags |= 67108866), s;
      }
      function c(s, o, p, N) {
        return o === null || o.tag !== 6 ? (o = rf(p, s.mode, N), o.return = s, o) : (o = a(o, p), o.return = s, o);
      }
      function f(s, o, p, N) {
        var S = p.type;
        return S === ea ? y(s, o, p.props.children, N, p.key) : o !== null && (o.elementType === S || typeof S == "object" && S !== null && S.$$typeof === Je && zn(S) === o.type) ? (o = a(o, p.props), Fa(o, p), o.return = s, o) : (o = Ni(p.type, p.key, p.props, null, s.mode, N), Fa(o, p), o.return = s, o);
      }
      function r(s, o, p, N) {
        return o === null || o.tag !== 4 || o.stateNode.containerInfo !== p.containerInfo || o.stateNode.implementation !== p.implementation ? (o = df(p, s.mode, N), o.return = s, o) : (o = a(o, p.children || []), o.return = s, o);
      }
      function y(s, o, p, N, S) {
        return o === null || o.tag !== 7 ? (o = Mn(p, s.mode, N, S), o.return = s, o) : (o = a(o, p), o.return = s, o);
      }
      function b(s, o, p) {
        if (typeof o == "string" && o !== "" || typeof o == "number" || typeof o == "bigint") return o = rf("" + o, s.mode, p), o.return = s, o;
        if (typeof o == "object" && o !== null) {
          switch (o.$$typeof) {
            case Ru:
              return p = Ni(o.type, o.key, o.props, null, s.mode, p), Fa(p, o), p.return = s, p;
            case tu:
              return o = df(o, s.mode, p), o.return = s, o;
            case Je:
              return o = zn(o), b(s, o, p);
          }
          if (lu(o) || ka(o)) return o = Mn(o, s.mode, p, null), o.return = s, o;
          if (typeof o.then == "function") return b(s, fi(o), p);
          if (o.$$typeof === Oe) return b(s, ci(s, o), p);
          si(s, o);
        }
        return null;
      }
      function m(s, o, p, N) {
        var S = o !== null ? o.key : null;
        if (typeof p == "string" && p !== "" || typeof p == "number" || typeof p == "bigint") return S !== null ? null : c(s, o, "" + p, N);
        if (typeof p == "object" && p !== null) {
          switch (p.$$typeof) {
            case Ru:
              return p.key === S ? f(s, o, p, N) : null;
            case tu:
              return p.key === S ? r(s, o, p, N) : null;
            case Je:
              return p = zn(p), m(s, o, p, N);
          }
          if (lu(p) || ka(p)) return S !== null ? null : y(s, o, p, N, null);
          if (typeof p.then == "function") return m(s, o, fi(p), N);
          if (p.$$typeof === Oe) return m(s, o, ci(s, p), N);
          si(s, p);
        }
        return null;
      }
      function h(s, o, p, N, S) {
        if (typeof N == "string" && N !== "" || typeof N == "number" || typeof N == "bigint") return s = s.get(p) || null, c(o, s, "" + N, S);
        if (typeof N == "object" && N !== null) {
          switch (N.$$typeof) {
            case Ru:
              return s = s.get(N.key === null ? p : N.key) || null, f(o, s, N, S);
            case tu:
              return s = s.get(N.key === null ? p : N.key) || null, r(o, s, N, S);
            case Je:
              return N = zn(N), h(s, o, p, N, S);
          }
          if (lu(N) || ka(N)) return s = s.get(p) || null, y(o, s, N, S, null);
          if (typeof N.then == "function") return h(s, o, p, fi(N), S);
          if (N.$$typeof === Oe) return h(s, o, p, ci(o, N), S);
          si(o, N);
        }
        return null;
      }
      function T(s, o, p, N) {
        for (var S = null, Q = null, D = o, L = o = 0, j = null; D !== null && L < p.length; L++) {
          D.index > L ? (j = D, D = null) : j = D.sibling;
          var k = m(s, D, p[L], N);
          if (k === null) {
            D === null && (D = j);
            break;
          }
          t && D && k.alternate === null && l(s, D), o = u(k, o, L), Q === null ? S = k : Q.sibling = k, Q = k, D = j;
        }
        if (L === p.length) return e(s, D), st && Ae(s, L), S;
        if (D === null) {
          for (; L < p.length; L++) D = b(s, p[L], N), D !== null && (o = u(D, o, L), Q === null ? S = D : Q.sibling = D, Q = D);
          return st && Ae(s, L), S;
        }
        for (D = n(D); L < p.length; L++) j = h(D, s, L, p[L], N), j !== null && (t && j.alternate !== null && D.delete(j.key === null ? L : j.key), o = u(j, o, L), Q === null ? S = j : Q.sibling = j, Q = j);
        return t && D.forEach(function(pt) {
          return l(s, pt);
        }), st && Ae(s, L), S;
      }
      function M(s, o, p, N) {
        if (p == null) throw Error(z(151));
        for (var S = null, Q = null, D = o, L = o = 0, j = null, k = p.next(); D !== null && !k.done; L++, k = p.next()) {
          D.index > L ? (j = D, D = null) : j = D.sibling;
          var pt = m(s, D, k.value, N);
          if (pt === null) {
            D === null && (D = j);
            break;
          }
          t && D && pt.alternate === null && l(s, D), o = u(pt, o, L), Q === null ? S = pt : Q.sibling = pt, Q = pt, D = j;
        }
        if (k.done) return e(s, D), st && Ae(s, L), S;
        if (D === null) {
          for (; !k.done; L++, k = p.next()) k = b(s, k.value, N), k !== null && (o = u(k, o, L), Q === null ? S = k : Q.sibling = k, Q = k);
          return st && Ae(s, L), S;
        }
        for (D = n(D); !k.done; L++, k = p.next()) k = h(D, s, L, k.value, N), k !== null && (t && k.alternate !== null && D.delete(k.key === null ? L : k.key), o = u(k, o, L), Q === null ? S = k : Q.sibling = k, Q = k);
        return t && D.forEach(function(B) {
          return l(s, B);
        }), st && Ae(s, L), S;
      }
      function _(s, o, p, N) {
        if (typeof p == "object" && p !== null && p.type === ea && p.key === null && (p = p.props.children), typeof p == "object" && p !== null) {
          switch (p.$$typeof) {
            case Ru:
              t: {
                for (var S = p.key; o !== null; ) {
                  if (o.key === S) {
                    if (S = p.type, S === ea) {
                      if (o.tag === 7) {
                        e(s, o.sibling), N = a(o, p.props.children), N.return = s, s = N;
                        break t;
                      }
                    } else if (o.elementType === S || typeof S == "object" && S !== null && S.$$typeof === Je && zn(S) === o.type) {
                      e(s, o.sibling), N = a(o, p.props), Fa(N, p), N.return = s, s = N;
                      break t;
                    }
                    e(s, o);
                    break;
                  } else l(s, o);
                  o = o.sibling;
                }
                p.type === ea ? (N = Mn(p.props.children, s.mode, N, p.key), N.return = s, s = N) : (N = Ni(p.type, p.key, p.props, null, s.mode, N), Fa(N, p), N.return = s, s = N);
              }
              return i(s);
            case tu:
              t: {
                for (S = p.key; o !== null; ) {
                  if (o.key === S) if (o.tag === 4 && o.stateNode.containerInfo === p.containerInfo && o.stateNode.implementation === p.implementation) {
                    e(s, o.sibling), N = a(o, p.children || []), N.return = s, s = N;
                    break t;
                  } else {
                    e(s, o);
                    break;
                  }
                  else l(s, o);
                  o = o.sibling;
                }
                N = df(p, s.mode, N), N.return = s, s = N;
              }
              return i(s);
            case Je:
              return p = zn(p), _(s, o, p, N);
          }
          if (lu(p)) return T(s, o, p, N);
          if (ka(p)) {
            if (S = ka(p), typeof S != "function") throw Error(z(150));
            return p = S.call(p), M(s, o, p, N);
          }
          if (typeof p.then == "function") return _(s, o, fi(p), N);
          if (p.$$typeof === Oe) return _(s, o, ci(s, p), N);
          si(s, p);
        }
        return typeof p == "string" && p !== "" || typeof p == "number" || typeof p == "bigint" ? (p = "" + p, o !== null && o.tag === 6 ? (e(s, o.sibling), N = a(o, p), N.return = s, s = N) : (e(s, o), N = rf(p, s.mode, N), N.return = s, s = N), i(s)) : e(s, o);
      }
      return function(s, o, p, N) {
        try {
          Au = 0;
          var S = _(s, o, p, N);
          return va = null, S;
        } catch (D) {
          if (D === qa || D === mc) throw D;
          var Q = Bl(29, D, null, s.mode);
          return Q.lanes = N, Q.return = s, Q;
        } finally {
        }
      };
    }
    var Bn = Fm(true), $m = Fm(false), ke = false;
    function Ws(t) {
      t.updateQueue = { baseState: t.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, lanes: 0, hiddenCallbacks: null }, callbacks: null };
    }
    function ls(t, l) {
      t = t.updateQueue, l.updateQueue === t && (l.updateQueue = { baseState: t.baseState, firstBaseUpdate: t.firstBaseUpdate, lastBaseUpdate: t.lastBaseUpdate, shared: t.shared, callbacks: null });
    }
    function un(t) {
      return { lane: t, tag: 0, payload: null, callback: null, next: null };
    }
    function cn(t, l, e) {
      var n = t.updateQueue;
      if (n === null) return null;
      if (n = n.shared, (mt & 2) !== 0) {
        var a = n.pending;
        return a === null ? l.next = l : (l.next = a.next, a.next = l), n.pending = l, l = wi(t), Xm(t, null, e), l;
      }
      return dc(t, n, l, e), wi(t);
    }
    function su(t, l, e) {
      if (l = l.updateQueue, l !== null && (l = l.shared, (e & 4194048) !== 0)) {
        var n = l.lanes;
        n &= t.pendingLanes, e |= n, l.lanes = e, hm(t, e);
      }
    }
    function hf(t, l) {
      var e = t.updateQueue, n = t.alternate;
      if (n !== null && (n = n.updateQueue, e === n)) {
        var a = null, u = null;
        if (e = e.firstBaseUpdate, e !== null) {
          do {
            var i = { lane: e.lane, tag: e.tag, payload: e.payload, callback: null, next: null };
            u === null ? a = u = i : u = u.next = i, e = e.next;
          } while (e !== null);
          u === null ? a = u = l : u = u.next = l;
        } else a = u = l;
        e = { baseState: n.baseState, firstBaseUpdate: a, lastBaseUpdate: u, shared: n.shared, callbacks: n.callbacks }, t.updateQueue = e;
        return;
      }
      t = e.lastBaseUpdate, t === null ? e.firstBaseUpdate = l : t.next = l, e.lastBaseUpdate = l;
    }
    var es = false;
    function ou() {
      if (es) {
        var t = ga;
        if (t !== null) throw t;
      }
    }
    function ru(t, l, e, n) {
      es = false;
      var a = t.updateQueue;
      ke = false;
      var u = a.firstBaseUpdate, i = a.lastBaseUpdate, c = a.shared.pending;
      if (c !== null) {
        a.shared.pending = null;
        var f = c, r = f.next;
        f.next = null, i === null ? u = r : i.next = r, i = f;
        var y = t.alternate;
        y !== null && (y = y.updateQueue, c = y.lastBaseUpdate, c !== i && (c === null ? y.firstBaseUpdate = r : c.next = r, y.lastBaseUpdate = f));
      }
      if (u !== null) {
        var b = a.baseState;
        i = 0, y = r = f = null, c = u;
        do {
          var m = c.lane & -536870913, h = m !== c.lane;
          if (h ? (ft & m) === m : (n & m) === m) {
            m !== 0 && m === Aa && (es = true), y !== null && (y = y.next = { lane: 0, tag: c.tag, payload: c.payload, callback: null, next: null });
            t: {
              var T = t, M = c;
              m = l;
              var _ = e;
              switch (M.tag) {
                case 1:
                  if (T = M.payload, typeof T == "function") {
                    b = T.call(_, b, m);
                    break t;
                  }
                  b = T;
                  break t;
                case 3:
                  T.flags = T.flags & -65537 | 128;
                case 0:
                  if (T = M.payload, m = typeof T == "function" ? T.call(_, b, m) : T, m == null) break t;
                  b = _t({}, b, m);
                  break t;
                case 2:
                  ke = true;
              }
            }
            m = c.callback, m !== null && (t.flags |= 64, h && (t.flags |= 8192), h = a.callbacks, h === null ? a.callbacks = [m] : h.push(m));
          } else h = { lane: m, tag: c.tag, payload: c.payload, callback: c.callback, next: null }, y === null ? (r = y = h, f = b) : y = y.next = h, i |= m;
          if (c = c.next, c === null) {
            if (c = a.shared.pending, c === null) break;
            h = c, c = h.next, h.next = null, a.lastBaseUpdate = h, a.shared.pending = null;
          }
        } while (true);
        y === null && (f = b), a.baseState = f, a.firstBaseUpdate = r, a.lastBaseUpdate = y, u === null && (a.shared.lanes = 0), yn |= i, t.lanes = i, t.memoizedState = b;
      }
    }
    function Im(t, l) {
      if (typeof t != "function") throw Error(z(191, t));
      t.call(l);
    }
    function Pm(t, l) {
      var e = t.callbacks;
      if (e !== null) for (t.callbacks = null, t = 0; t < e.length; t++) Im(e[t], l);
    }
    var za = me(null), Qi = me(0);
    function cd(t, l) {
      t = Ye, Tt(Qi, t), Tt(za, l), Ye = t | l.baseLanes;
    }
    function ns() {
      Tt(Qi, Ye), Tt(za, za.current);
    }
    function Fs() {
      Ye = Qi.current, nl(za), nl(Qi);
    }
    var Xl = me(null), Il = null;
    function Fe(t) {
      var l = t.alternate;
      Tt(Qt, Qt.current & 1), Tt(Xl, t), Il === null && (l === null || za.current !== null || l.memoizedState !== null) && (Il = t);
    }
    function as(t) {
      Tt(Qt, Qt.current), Tt(Xl, t), Il === null && (Il = t);
    }
    function Rm(t) {
      t.tag === 22 ? (Tt(Qt, Qt.current), Tt(Xl, t), Il === null && (Il = t)) : $e(t);
    }
    function $e() {
      Tt(Qt, Qt.current), Tt(Xl, Xl.current);
    }
    function xl(t) {
      nl(Xl), Il === t && (Il = null), nl(Qt);
    }
    var Qt = me(0);
    function Zi(t) {
      for (var l = t; l !== null; ) {
        if (l.tag === 13) {
          var e = l.memoizedState;
          if (e !== null && (e = e.dehydrated, e === null || Ts(e) || As(e))) return l;
        } else if (l.tag === 19 && (l.memoizedProps.revealOrder === "forwards" || l.memoizedProps.revealOrder === "backwards" || l.memoizedProps.revealOrder === "unstable_legacy-backwards" || l.memoizedProps.revealOrder === "together")) {
          if ((l.flags & 128) !== 0) return l;
        } else if (l.child !== null) {
          l.child.return = l, l = l.child;
          continue;
        }
        if (l === t) break;
        for (; l.sibling === null; ) {
          if (l.return === null || l.return === t) return null;
          l = l.return;
        }
        l.sibling.return = l.return, l = l.sibling;
      }
      return null;
    }
    var xe = 0, tt = null, St = null, Ft = null, Vi = false, ba = false, qn = false, Ki = 0, zu = 0, Sa = null, Iy = 0;
    function jt() {
      throw Error(z(321));
    }
    function $s(t, l) {
      if (l === null) return false;
      for (var e = 0; e < l.length && e < t.length; e++) if (!Gl(t[e], l[e])) return false;
      return true;
    }
    function Is(t, l, e, n, a, u) {
      return xe = u, tt = l, l.memoizedState = null, l.updateQueue = null, l.lanes = 0, $.H = t === null || t.memoizedState === null ? _0 : fo, qn = false, u = e(n, a), qn = false, ba && (u = l0(l, e, n, a)), t0(t), u;
    }
    function t0(t) {
      $.H = Ou;
      var l = St !== null && St.next !== null;
      if (xe = 0, Ft = St = tt = null, Vi = false, zu = 0, Sa = null, l) throw Error(z(300));
      t === null || Pt || (t = t.dependencies, t !== null && Gi(t) && (Pt = true));
    }
    function l0(t, l, e, n) {
      tt = t;
      var a = 0;
      do {
        if (ba && (Sa = null), zu = 0, ba = false, 25 <= a) throw Error(z(301));
        if (a += 1, Ft = St = null, t.updateQueue != null) {
          var u = t.updateQueue;
          u.lastEffect = null, u.events = null, u.stores = null, u.memoCache != null && (u.memoCache.index = 0);
        }
        $.H = U0, u = l(e, n);
      } while (ba);
      return u;
    }
    function Py() {
      var t = $.H, l = t.useState()[0];
      return l = typeof l.then == "function" ? ju(l) : l, t = t.useState()[0], (St !== null ? St.memoizedState : null) !== t && (tt.flags |= 1024), l;
    }
    function Ps() {
      var t = Ki !== 0;
      return Ki = 0, t;
    }
    function Rs(t, l, e) {
      l.updateQueue = t.updateQueue, l.flags &= -2053, t.lanes &= ~e;
    }
    function to(t) {
      if (Vi) {
        for (t = t.memoizedState; t !== null; ) {
          var l = t.queue;
          l !== null && (l.pending = null), t = t.next;
        }
        Vi = false;
      }
      xe = 0, Ft = St = tt = null, ba = false, zu = Ki = 0, Sa = null;
    }
    function bl() {
      var t = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
      return Ft === null ? tt.memoizedState = Ft = t : Ft = Ft.next = t, Ft;
    }
    function Zt() {
      if (St === null) {
        var t = tt.alternate;
        t = t !== null ? t.memoizedState : null;
      } else t = St.next;
      var l = Ft === null ? tt.memoizedState : Ft.next;
      if (l !== null) Ft = l, St = t;
      else {
        if (t === null) throw tt.alternate === null ? Error(z(467)) : Error(z(310));
        St = t, t = { memoizedState: St.memoizedState, baseState: St.baseState, baseQueue: St.baseQueue, queue: St.queue, next: null }, Ft === null ? tt.memoizedState = Ft = t : Ft = Ft.next = t;
      }
      return Ft;
    }
    function hc() {
      return { lastEffect: null, events: null, stores: null, memoCache: null };
    }
    function ju(t) {
      var l = zu;
      return zu += 1, Sa === null && (Sa = []), t = Wm(Sa, t, l), l = tt, (Ft === null ? l.memoizedState : Ft.next) === null && (l = l.alternate, $.H = l === null || l.memoizedState === null ? _0 : fo), t;
    }
    function pc(t) {
      if (t !== null && typeof t == "object") {
        if (typeof t.then == "function") return ju(t);
        if (t.$$typeof === Oe) return fl(t);
      }
      throw Error(z(438, String(t)));
    }
    function lo(t) {
      var l = null, e = tt.updateQueue;
      if (e !== null && (l = e.memoCache), l == null) {
        var n = tt.alternate;
        n !== null && (n = n.updateQueue, n !== null && (n = n.memoCache, n != null && (l = { data: n.data.map(function(a) {
          return a.slice();
        }), index: 0 })));
      }
      if (l == null && (l = { data: [], index: 0 }), e === null && (e = hc(), tt.updateQueue = e), e.memoCache = l, e = l.data[l.index], e === void 0) for (e = l.data[l.index] = Array(t), n = 0; n < t; n++) e[n] = Lp;
      return l.index++, e;
    }
    function Be(t, l) {
      return typeof l == "function" ? l(t) : l;
    }
    function Ti(t) {
      var l = Zt();
      return eo(l, St, t);
    }
    function eo(t, l, e) {
      var n = t.queue;
      if (n === null) throw Error(z(311));
      n.lastRenderedReducer = e;
      var a = t.baseQueue, u = n.pending;
      if (u !== null) {
        if (a !== null) {
          var i = a.next;
          a.next = u.next, u.next = i;
        }
        l.baseQueue = a = u, n.pending = null;
      }
      if (u = t.baseState, a === null) t.memoizedState = u;
      else {
        l = a.next;
        var c = i = null, f = null, r = l, y = false;
        do {
          var b = r.lane & -536870913;
          if (b !== r.lane ? (ft & b) === b : (xe & b) === b) {
            var m = r.revertLane;
            if (m === 0) f !== null && (f = f.next = { lane: 0, revertLane: 0, gesture: null, action: r.action, hasEagerState: r.hasEagerState, eagerState: r.eagerState, next: null }), b === Aa && (y = true);
            else if ((xe & m) === m) {
              r = r.next, m === Aa && (y = true);
              continue;
            } else b = { lane: 0, revertLane: r.revertLane, gesture: null, action: r.action, hasEagerState: r.hasEagerState, eagerState: r.eagerState, next: null }, f === null ? (c = f = b, i = u) : f = f.next = b, tt.lanes |= m, yn |= m;
            b = r.action, qn && e(u, b), u = r.hasEagerState ? r.eagerState : e(u, b);
          } else m = { lane: b, revertLane: r.revertLane, gesture: r.gesture, action: r.action, hasEagerState: r.hasEagerState, eagerState: r.eagerState, next: null }, f === null ? (c = f = m, i = u) : f = f.next = m, tt.lanes |= b, yn |= b;
          r = r.next;
        } while (r !== null && r !== l);
        if (f === null ? i = u : f.next = c, !Gl(u, t.memoizedState) && (Pt = true, y && (e = ga, e !== null))) throw e;
        t.memoizedState = u, t.baseState = i, t.baseQueue = f, n.lastRenderedState = u;
      }
      return a === null && (n.lanes = 0), [t.memoizedState, n.dispatch];
    }
    function pf(t) {
      var l = Zt(), e = l.queue;
      if (e === null) throw Error(z(311));
      e.lastRenderedReducer = t;
      var n = e.dispatch, a = e.pending, u = l.memoizedState;
      if (a !== null) {
        e.pending = null;
        var i = a = a.next;
        do
          u = t(u, i.action), i = i.next;
        while (i !== a);
        Gl(u, l.memoizedState) || (Pt = true), l.memoizedState = u, l.baseQueue === null && (l.baseState = u), e.lastRenderedState = u;
      }
      return [u, n];
    }
    function e0(t, l, e) {
      var n = tt, a = Zt(), u = st;
      if (u) {
        if (e === void 0) throw Error(z(407));
        e = e();
      } else e = l();
      var i = !Gl((St || a).memoizedState, e);
      if (i && (a.memoizedState = e, Pt = true), a = a.queue, no(u0.bind(null, n, a, t), [t]), a.getSnapshot !== l || i || Ft !== null && Ft.memoizedState.tag & 1) {
        if (n.flags |= 2048, Oa(9, { destroy: void 0 }, a0.bind(null, n, a, e, l), null), Nt === null) throw Error(z(349));
        u || (xe & 127) !== 0 || n0(n, l, e);
      }
      return e;
    }
    function n0(t, l, e) {
      t.flags |= 16384, t = { getSnapshot: l, value: e }, l = tt.updateQueue, l === null ? (l = hc(), tt.updateQueue = l, l.stores = [t]) : (e = l.stores, e === null ? l.stores = [t] : e.push(t));
    }
    function a0(t, l, e, n) {
      l.value = e, l.getSnapshot = n, i0(l) && c0(t);
    }
    function u0(t, l, e) {
      return e(function() {
        i0(l) && c0(t);
      });
    }
    function i0(t) {
      var l = t.getSnapshot;
      t = t.value;
      try {
        var e = l();
        return !Gl(t, e);
      } catch {
        return true;
      }
    }
    function c0(t) {
      var l = Gn(t, 2);
      l !== null && Cl(l, t, 2);
    }
    function us(t) {
      var l = bl();
      if (typeof t == "function") {
        var e = t;
        if (t = e(), qn) {
          Pe(true);
          try {
            e();
          } finally {
            Pe(false);
          }
        }
      }
      return l.memoizedState = l.baseState = t, l.queue = { pending: null, lanes: 0, dispatch: null, lastRenderedReducer: Be, lastRenderedState: t }, l;
    }
    function f0(t, l, e, n) {
      return t.baseState = e, eo(t, St, typeof n == "function" ? n : Be);
    }
    function Ry(t, l, e, n, a) {
      if (gc(t)) throw Error(z(485));
      if (t = l.action, t !== null) {
        var u = { payload: a, action: t, next: null, isTransition: true, status: "pending", value: null, reason: null, listeners: [], then: function(i) {
          u.listeners.push(i);
        } };
        $.T !== null ? e(true) : u.isTransition = false, n(u), e = l.pending, e === null ? (u.next = l.pending = u, s0(l, u)) : (u.next = e.next, l.pending = e.next = u);
      }
    }
    function s0(t, l) {
      var e = l.action, n = l.payload, a = t.state;
      if (l.isTransition) {
        var u = $.T, i = {};
        $.T = i;
        try {
          var c = e(a, n), f = $.S;
          f !== null && f(i, c), fd(t, l, c);
        } catch (r) {
          is(t, l, r);
        } finally {
          u !== null && i.types !== null && (u.types = i.types), $.T = u;
        }
      } else try {
        u = e(a, n), fd(t, l, u);
      } catch (r) {
        is(t, l, r);
      }
    }
    function fd(t, l, e) {
      e !== null && typeof e == "object" && typeof e.then == "function" ? e.then(function(n) {
        sd(t, l, n);
      }, function(n) {
        return is(t, l, n);
      }) : sd(t, l, e);
    }
    function sd(t, l, e) {
      l.status = "fulfilled", l.value = e, o0(l), t.state = e, l = t.pending, l !== null && (e = l.next, e === l ? t.pending = null : (e = e.next, l.next = e, s0(t, e)));
    }
    function is(t, l, e) {
      var n = t.pending;
      if (t.pending = null, n !== null) {
        n = n.next;
        do
          l.status = "rejected", l.reason = e, o0(l), l = l.next;
        while (l !== n);
      }
      t.action = null;
    }
    function o0(t) {
      t = t.listeners;
      for (var l = 0; l < t.length; l++) (0, t[l])();
    }
    function r0(t, l) {
      return l;
    }
    function od(t, l) {
      if (st) {
        var e = Nt.formState;
        if (e !== null) {
          t: {
            var n = tt;
            if (st) {
              if (Dt) {
                l: {
                  for (var a = Dt, u = $l; a.nodeType !== 8; ) {
                    if (!u) {
                      a = null;
                      break l;
                    }
                    if (a = Pl(a.nextSibling), a === null) {
                      a = null;
                      break l;
                    }
                  }
                  u = a.data, a = u === "F!" || u === "F" ? a : null;
                }
                if (a) {
                  Dt = Pl(a.nextSibling), n = a.data === "F!";
                  break t;
                }
              }
              hn(n);
            }
            n = false;
          }
          n && (l = e[0]);
        }
      }
      return e = bl(), e.memoizedState = e.baseState = l, n = { pending: null, lanes: 0, dispatch: null, lastRenderedReducer: r0, lastRenderedState: l }, e.queue = n, e = C0.bind(null, tt, n), n.dispatch = e, n = us(false), u = co.bind(null, tt, false, n.queue), n = bl(), a = { state: l, dispatch: null, action: t, pending: null }, n.queue = a, e = Ry.bind(null, tt, a, u, e), a.dispatch = e, n.memoizedState = t, [l, e, false];
    }
    function rd(t) {
      var l = Zt();
      return d0(l, St, t);
    }
    function d0(t, l, e) {
      if (l = eo(t, l, r0)[0], t = Ti(Be)[0], typeof l == "object" && l !== null && typeof l.then == "function") try {
        var n = ju(l);
      } catch (i) {
        throw i === qa ? mc : i;
      }
      else n = l;
      l = Zt();
      var a = l.queue, u = a.dispatch;
      return e !== l.memoizedState && (tt.flags |= 2048, Oa(9, { destroy: void 0 }, tg.bind(null, a, e), null)), [n, u, t];
    }
    function tg(t, l) {
      t.action = l;
    }
    function dd(t) {
      var l = Zt(), e = St;
      if (e !== null) return d0(l, e, t);
      Zt(), l = l.memoizedState, e = Zt();
      var n = e.queue.dispatch;
      return e.memoizedState = t, [l, n, false];
    }
    function Oa(t, l, e, n) {
      return t = { tag: t, create: e, deps: n, inst: l, next: null }, l = tt.updateQueue, l === null && (l = hc(), tt.updateQueue = l), e = l.lastEffect, e === null ? l.lastEffect = t.next = t : (n = e.next, e.next = t, t.next = n, l.lastEffect = t), t;
    }
    function m0() {
      return Zt().memoizedState;
    }
    function Ai(t, l, e, n) {
      var a = bl();
      tt.flags |= t, a.memoizedState = Oa(1 | l, { destroy: void 0 }, e, n === void 0 ? null : n);
    }
    function yc(t, l, e, n) {
      var a = Zt();
      n = n === void 0 ? null : n;
      var u = a.memoizedState.inst;
      St !== null && n !== null && $s(n, St.memoizedState.deps) ? a.memoizedState = Oa(l, u, e, n) : (tt.flags |= t, a.memoizedState = Oa(1 | l, u, e, n));
    }
    function md(t, l) {
      Ai(8390656, 8, t, l);
    }
    function no(t, l) {
      yc(2048, 8, t, l);
    }
    function lg(t) {
      tt.flags |= 4;
      var l = tt.updateQueue;
      if (l === null) l = hc(), tt.updateQueue = l, l.events = [t];
      else {
        var e = l.events;
        e === null ? l.events = [t] : e.push(t);
      }
    }
    function h0(t) {
      var l = Zt().memoizedState;
      return lg({ ref: l, nextImpl: t }), function() {
        if ((mt & 2) !== 0) throw Error(z(440));
        return l.impl.apply(void 0, arguments);
      };
    }
    function p0(t, l) {
      return yc(4, 2, t, l);
    }
    function y0(t, l) {
      return yc(4, 4, t, l);
    }
    function g0(t, l) {
      if (typeof l == "function") {
        t = t();
        var e = l(t);
        return function() {
          typeof e == "function" ? e() : l(null);
        };
      }
      if (l != null) return t = t(), l.current = t, function() {
        l.current = null;
      };
    }
    function v0(t, l, e) {
      e = e != null ? e.concat([t]) : null, yc(4, 4, g0.bind(null, l, t), e);
    }
    function ao() {
    }
    function b0(t, l) {
      var e = Zt();
      l = l === void 0 ? null : l;
      var n = e.memoizedState;
      return l !== null && $s(l, n[1]) ? n[0] : (e.memoizedState = [t, l], t);
    }
    function S0(t, l) {
      var e = Zt();
      l = l === void 0 ? null : l;
      var n = e.memoizedState;
      if (l !== null && $s(l, n[1])) return n[0];
      if (n = t(), qn) {
        Pe(true);
        try {
          t();
        } finally {
          Pe(false);
        }
      }
      return e.memoizedState = [n, l], n;
    }
    function uo(t, l, e) {
      return e === void 0 || (xe & 1073741824) !== 0 && (ft & 261930) === 0 ? t.memoizedState = l : (t.memoizedState = e, t = fh(), tt.lanes |= t, yn |= t, e);
    }
    function N0(t, l, e, n) {
      return Gl(e, l) ? e : za.current !== null ? (t = uo(t, e, n), Gl(t, l) || (Pt = true), t) : (xe & 42) === 0 || (xe & 1073741824) !== 0 && (ft & 261930) === 0 ? (Pt = true, t.memoizedState = e) : (t = fh(), tt.lanes |= t, yn |= t, l);
    }
    function E0(t, l, e, n, a) {
      var u = ht.p;
      ht.p = u !== 0 && 8 > u ? u : 8;
      var i = $.T, c = {};
      $.T = c, co(t, false, l, e);
      try {
        var f = a(), r = $.S;
        if (r !== null && r(c, f), f !== null && typeof f == "object" && typeof f.then == "function") {
          var y = $y(f, n);
          du(t, l, y, jl(t));
        } else du(t, l, n, jl(t));
      } catch (b) {
        du(t, l, { then: function() {
        }, status: "rejected", reason: b }, jl());
      } finally {
        ht.p = u, i !== null && c.types !== null && (i.types = c.types), $.T = i;
      }
    }
    function eg() {
    }
    function cs(t, l, e, n) {
      if (t.tag !== 5) throw Error(z(476));
      var a = T0(t).queue;
      E0(t, a, l, Cn, e === null ? eg : function() {
        return A0(t), e(n);
      });
    }
    function T0(t) {
      var l = t.memoizedState;
      if (l !== null) return l;
      l = { memoizedState: Cn, baseState: Cn, baseQueue: null, queue: { pending: null, lanes: 0, dispatch: null, lastRenderedReducer: Be, lastRenderedState: Cn }, next: null };
      var e = {};
      return l.next = { memoizedState: e, baseState: e, baseQueue: null, queue: { pending: null, lanes: 0, dispatch: null, lastRenderedReducer: Be, lastRenderedState: e }, next: null }, t.memoizedState = l, t = t.alternate, t !== null && (t.memoizedState = l), l;
    }
    function A0(t) {
      var l = T0(t);
      l.next === null && (l = t.alternate.memoizedState), du(t, l.next.queue, {}, jl());
    }
    function io() {
      return fl(Du);
    }
    function z0() {
      return Zt().memoizedState;
    }
    function O0() {
      return Zt().memoizedState;
    }
    function ng(t) {
      for (var l = t.return; l !== null; ) {
        switch (l.tag) {
          case 24:
          case 3:
            var e = jl();
            t = un(e);
            var n = cn(l, t, e);
            n !== null && (Cl(n, l, e), su(n, l, e)), l = { cache: Ks() }, t.payload = l;
            return;
        }
        l = l.return;
      }
    }
    function ag(t, l, e) {
      var n = jl();
      e = { lane: n, revertLane: 0, gesture: null, action: e, hasEagerState: false, eagerState: null, next: null }, gc(t) ? M0(l, e) : (e = Xs(t, l, e, n), e !== null && (Cl(e, t, n), D0(e, l, n)));
    }
    function C0(t, l, e) {
      var n = jl();
      du(t, l, e, n);
    }
    function du(t, l, e, n) {
      var a = { lane: n, revertLane: 0, gesture: null, action: e, hasEagerState: false, eagerState: null, next: null };
      if (gc(t)) M0(l, a);
      else {
        var u = t.alternate;
        if (t.lanes === 0 && (u === null || u.lanes === 0) && (u = l.lastRenderedReducer, u !== null)) try {
          var i = l.lastRenderedState, c = u(i, e);
          if (a.hasEagerState = true, a.eagerState = c, Gl(c, i)) return dc(t, l, a, 0), Nt === null && rc(), false;
        } catch {
        } finally {
        }
        if (e = Xs(t, l, a, n), e !== null) return Cl(e, t, n), D0(e, l, n), true;
      }
      return false;
    }
    function co(t, l, e, n) {
      if (n = { lane: 2, revertLane: go(), gesture: null, action: n, hasEagerState: false, eagerState: null, next: null }, gc(t)) {
        if (l) throw Error(z(479));
      } else l = Xs(t, e, n, 2), l !== null && Cl(l, t, 2);
    }
    function gc(t) {
      var l = t.alternate;
      return t === tt || l !== null && l === tt;
    }
    function M0(t, l) {
      ba = Vi = true;
      var e = t.pending;
      e === null ? l.next = l : (l.next = e.next, e.next = l), t.pending = l;
    }
    function D0(t, l, e) {
      if ((e & 4194048) !== 0) {
        var n = l.lanes;
        n &= t.pendingLanes, e |= n, l.lanes = e, hm(t, e);
      }
    }
    var Ou = { readContext: fl, use: pc, useCallback: jt, useContext: jt, useEffect: jt, useImperativeHandle: jt, useLayoutEffect: jt, useInsertionEffect: jt, useMemo: jt, useReducer: jt, useRef: jt, useState: jt, useDebugValue: jt, useDeferredValue: jt, useTransition: jt, useSyncExternalStore: jt, useId: jt, useHostTransitionStatus: jt, useFormState: jt, useActionState: jt, useOptimistic: jt, useMemoCache: jt, useCacheRefresh: jt };
    Ou.useEffectEvent = jt;
    var _0 = { readContext: fl, use: pc, useCallback: function(t, l) {
      return bl().memoizedState = [t, l === void 0 ? null : l], t;
    }, useContext: fl, useEffect: md, useImperativeHandle: function(t, l, e) {
      e = e != null ? e.concat([t]) : null, Ai(4194308, 4, g0.bind(null, l, t), e);
    }, useLayoutEffect: function(t, l) {
      return Ai(4194308, 4, t, l);
    }, useInsertionEffect: function(t, l) {
      Ai(4, 2, t, l);
    }, useMemo: function(t, l) {
      var e = bl();
      l = l === void 0 ? null : l;
      var n = t();
      if (qn) {
        Pe(true);
        try {
          t();
        } finally {
          Pe(false);
        }
      }
      return e.memoizedState = [n, l], n;
    }, useReducer: function(t, l, e) {
      var n = bl();
      if (e !== void 0) {
        var a = e(l);
        if (qn) {
          Pe(true);
          try {
            e(l);
          } finally {
            Pe(false);
          }
        }
      } else a = l;
      return n.memoizedState = n.baseState = a, t = { pending: null, lanes: 0, dispatch: null, lastRenderedReducer: t, lastRenderedState: a }, n.queue = t, t = t.dispatch = ag.bind(null, tt, t), [n.memoizedState, t];
    }, useRef: function(t) {
      var l = bl();
      return t = { current: t }, l.memoizedState = t;
    }, useState: function(t) {
      t = us(t);
      var l = t.queue, e = C0.bind(null, tt, l);
      return l.dispatch = e, [t.memoizedState, e];
    }, useDebugValue: ao, useDeferredValue: function(t, l) {
      var e = bl();
      return uo(e, t, l);
    }, useTransition: function() {
      var t = us(false);
      return t = E0.bind(null, tt, t.queue, true, false), bl().memoizedState = t, [false, t];
    }, useSyncExternalStore: function(t, l, e) {
      var n = tt, a = bl();
      if (st) {
        if (e === void 0) throw Error(z(407));
        e = e();
      } else {
        if (e = l(), Nt === null) throw Error(z(349));
        (ft & 127) !== 0 || n0(n, l, e);
      }
      a.memoizedState = e;
      var u = { value: e, getSnapshot: l };
      return a.queue = u, md(u0.bind(null, n, u, t), [t]), n.flags |= 2048, Oa(9, { destroy: void 0 }, a0.bind(null, n, u, e, l), null), e;
    }, useId: function() {
      var t = bl(), l = Nt.identifierPrefix;
      if (st) {
        var e = oe, n = se;
        e = (n & ~(1 << 32 - wl(n) - 1)).toString(32) + e, l = "_" + l + "R_" + e, e = Ki++, 0 < e && (l += "H" + e.toString(32)), l += "_";
      } else e = Iy++, l = "_" + l + "r_" + e.toString(32) + "_";
      return t.memoizedState = l;
    }, useHostTransitionStatus: io, useFormState: od, useActionState: od, useOptimistic: function(t) {
      var l = bl();
      l.memoizedState = l.baseState = t;
      var e = { pending: null, lanes: 0, dispatch: null, lastRenderedReducer: null, lastRenderedState: null };
      return l.queue = e, l = co.bind(null, tt, true, e), e.dispatch = l, [t, l];
    }, useMemoCache: lo, useCacheRefresh: function() {
      return bl().memoizedState = ng.bind(null, tt);
    }, useEffectEvent: function(t) {
      var l = bl(), e = { impl: t };
      return l.memoizedState = e, function() {
        if ((mt & 2) !== 0) throw Error(z(440));
        return e.impl.apply(void 0, arguments);
      };
    } }, fo = { readContext: fl, use: pc, useCallback: b0, useContext: fl, useEffect: no, useImperativeHandle: v0, useInsertionEffect: p0, useLayoutEffect: y0, useMemo: S0, useReducer: Ti, useRef: m0, useState: function() {
      return Ti(Be);
    }, useDebugValue: ao, useDeferredValue: function(t, l) {
      var e = Zt();
      return N0(e, St.memoizedState, t, l);
    }, useTransition: function() {
      var t = Ti(Be)[0], l = Zt().memoizedState;
      return [typeof t == "boolean" ? t : ju(t), l];
    }, useSyncExternalStore: e0, useId: z0, useHostTransitionStatus: io, useFormState: rd, useActionState: rd, useOptimistic: function(t, l) {
      var e = Zt();
      return f0(e, St, t, l);
    }, useMemoCache: lo, useCacheRefresh: O0 };
    fo.useEffectEvent = h0;
    var U0 = { readContext: fl, use: pc, useCallback: b0, useContext: fl, useEffect: no, useImperativeHandle: v0, useInsertionEffect: p0, useLayoutEffect: y0, useMemo: S0, useReducer: pf, useRef: m0, useState: function() {
      return pf(Be);
    }, useDebugValue: ao, useDeferredValue: function(t, l) {
      var e = Zt();
      return St === null ? uo(e, t, l) : N0(e, St.memoizedState, t, l);
    }, useTransition: function() {
      var t = pf(Be)[0], l = Zt().memoizedState;
      return [typeof t == "boolean" ? t : ju(t), l];
    }, useSyncExternalStore: e0, useId: z0, useHostTransitionStatus: io, useFormState: dd, useActionState: dd, useOptimistic: function(t, l) {
      var e = Zt();
      return St !== null ? f0(e, St, t, l) : (e.baseState = t, [t, e.queue.dispatch]);
    }, useMemoCache: lo, useCacheRefresh: O0 };
    U0.useEffectEvent = h0;
    function yf(t, l, e, n) {
      l = t.memoizedState, e = e(n, l), e = e == null ? l : _t({}, l, e), t.memoizedState = e, t.lanes === 0 && (t.updateQueue.baseState = e);
    }
    var fs = { enqueueSetState: function(t, l, e) {
      t = t._reactInternals;
      var n = jl(), a = un(n);
      a.payload = l, e != null && (a.callback = e), l = cn(t, a, n), l !== null && (Cl(l, t, n), su(l, t, n));
    }, enqueueReplaceState: function(t, l, e) {
      t = t._reactInternals;
      var n = jl(), a = un(n);
      a.tag = 1, a.payload = l, e != null && (a.callback = e), l = cn(t, a, n), l !== null && (Cl(l, t, n), su(l, t, n));
    }, enqueueForceUpdate: function(t, l) {
      t = t._reactInternals;
      var e = jl(), n = un(e);
      n.tag = 2, l != null && (n.callback = l), l = cn(t, n, e), l !== null && (Cl(l, t, e), su(l, t, e));
    } };
    function hd(t, l, e, n, a, u, i) {
      return t = t.stateNode, typeof t.shouldComponentUpdate == "function" ? t.shouldComponentUpdate(n, u, i) : l.prototype && l.prototype.isPureReactComponent ? !Nu(e, n) || !Nu(a, u) : true;
    }
    function pd(t, l, e, n) {
      t = l.state, typeof l.componentWillReceiveProps == "function" && l.componentWillReceiveProps(e, n), typeof l.UNSAFE_componentWillReceiveProps == "function" && l.UNSAFE_componentWillReceiveProps(e, n), l.state !== t && fs.enqueueReplaceState(l, l.state, null);
    }
    function Yn(t, l) {
      var e = l;
      if ("ref" in l) {
        e = {};
        for (var n in l) n !== "ref" && (e[n] = l[n]);
      }
      if (t = t.defaultProps) {
        e === l && (e = _t({}, e));
        for (var a in t) e[a] === void 0 && (e[a] = t[a]);
      }
      return e;
    }
    function H0(t) {
      Li(t);
    }
    function x0(t) {
      console.error(t);
    }
    function B0(t) {
      Li(t);
    }
    function Ji(t, l) {
      try {
        var e = t.onUncaughtError;
        e(l.value, { componentStack: l.stack });
      } catch (n) {
        setTimeout(function() {
          throw n;
        });
      }
    }
    function yd(t, l, e) {
      try {
        var n = t.onCaughtError;
        n(e.value, { componentStack: e.stack, errorBoundary: l.tag === 1 ? l.stateNode : null });
      } catch (a) {
        setTimeout(function() {
          throw a;
        });
      }
    }
    function ss(t, l, e) {
      return e = un(e), e.tag = 3, e.payload = { element: null }, e.callback = function() {
        Ji(t, l);
      }, e;
    }
    function q0(t) {
      return t = un(t), t.tag = 3, t;
    }
    function Y0(t, l, e, n) {
      var a = e.type.getDerivedStateFromError;
      if (typeof a == "function") {
        var u = n.value;
        t.payload = function() {
          return a(u);
        }, t.callback = function() {
          yd(l, e, n);
        };
      }
      var i = e.stateNode;
      i !== null && typeof i.componentDidCatch == "function" && (t.callback = function() {
        yd(l, e, n), typeof a != "function" && (fn === null ? fn = /* @__PURE__ */ new Set([this]) : fn.add(this));
        var c = n.stack;
        this.componentDidCatch(n.value, { componentStack: c !== null ? c : "" });
      });
    }
    function ug(t, l, e, n, a) {
      if (e.flags |= 32768, n !== null && typeof n == "object" && typeof n.then == "function") {
        if (l = e.alternate, l !== null && Ba(l, e, a, true), e = Xl.current, e !== null) {
          switch (e.tag) {
            case 31:
            case 13:
              return Il === null ? Ii() : e.alternate === null && Gt === 0 && (Gt = 3), e.flags &= -257, e.flags |= 65536, e.lanes = a, n === Xi ? e.flags |= 16384 : (l = e.updateQueue, l === null ? e.updateQueue = /* @__PURE__ */ new Set([n]) : l.add(n), Cf(t, n, a)), false;
            case 22:
              return e.flags |= 65536, n === Xi ? e.flags |= 16384 : (l = e.updateQueue, l === null ? (l = { transitions: null, markerInstances: null, retryQueue: /* @__PURE__ */ new Set([n]) }, e.updateQueue = l) : (e = l.retryQueue, e === null ? l.retryQueue = /* @__PURE__ */ new Set([n]) : e.add(n)), Cf(t, n, a)), false;
          }
          throw Error(z(435, e.tag));
        }
        return Cf(t, n, a), Ii(), false;
      }
      if (st) return l = Xl.current, l !== null ? ((l.flags & 65536) === 0 && (l.flags |= 256), l.flags |= 65536, l.lanes = a, n !== $f && (t = Error(z(422), { cause: n }), Tu(Fl(t, e)))) : (n !== $f && (l = Error(z(423), { cause: n }), Tu(Fl(l, e))), t = t.current.alternate, t.flags |= 65536, a &= -a, t.lanes |= a, n = Fl(n, e), a = ss(t.stateNode, n, a), hf(t, a), Gt !== 4 && (Gt = 2)), false;
      var u = Error(z(520), { cause: n });
      if (u = Fl(u, e), pu === null ? pu = [u] : pu.push(u), Gt !== 4 && (Gt = 2), l === null) return true;
      n = Fl(n, e), e = l;
      do {
        switch (e.tag) {
          case 3:
            return e.flags |= 65536, t = a & -a, e.lanes |= t, t = ss(e.stateNode, n, t), hf(e, t), false;
          case 1:
            if (l = e.type, u = e.stateNode, (e.flags & 128) === 0 && (typeof l.getDerivedStateFromError == "function" || u !== null && typeof u.componentDidCatch == "function" && (fn === null || !fn.has(u)))) return e.flags |= 65536, a &= -a, e.lanes |= a, a = q0(a), Y0(a, t, e, n), hf(e, a), false;
        }
        e = e.return;
      } while (e !== null);
      return false;
    }
    var so = Error(z(461)), Pt = false;
    function ul(t, l, e, n) {
      l.child = t === null ? $m(l, null, e, n) : Bn(l, t.child, e, n);
    }
    function gd(t, l, e, n, a) {
      e = e.render;
      var u = l.ref;
      if ("ref" in n) {
        var i = {};
        for (var c in n) c !== "ref" && (i[c] = n[c]);
      } else i = n;
      return xn(l), n = Is(t, l, e, i, u, a), c = Ps(), t !== null && !Pt ? (Rs(t, l, a), qe(t, l, a)) : (st && c && Zs(l), l.flags |= 1, ul(t, l, n, a), l.child);
    }
    function vd(t, l, e, n, a) {
      if (t === null) {
        var u = e.type;
        return typeof u == "function" && !Qs(u) && u.defaultProps === void 0 && e.compare === null ? (l.tag = 15, l.type = u, L0(t, l, u, n, a)) : (t = Ni(e.type, null, n, l, l.mode, a), t.ref = l.ref, t.return = l, l.child = t);
      }
      if (u = t.child, !oo(t, a)) {
        var i = u.memoizedProps;
        if (e = e.compare, e = e !== null ? e : Nu, e(i, n) && t.ref === l.ref) return qe(t, l, a);
      }
      return l.flags |= 1, t = De(u, n), t.ref = l.ref, t.return = l, l.child = t;
    }
    function L0(t, l, e, n, a) {
      if (t !== null) {
        var u = t.memoizedProps;
        if (Nu(u, n) && t.ref === l.ref) if (Pt = false, l.pendingProps = n = u, oo(t, a)) (t.flags & 131072) !== 0 && (Pt = true);
        else return l.lanes = t.lanes, qe(t, l, a);
      }
      return os(t, l, e, n, a);
    }
    function w0(t, l, e, n) {
      var a = n.children, u = t !== null ? t.memoizedState : null;
      if (t === null && l.stateNode === null && (l.stateNode = { _visibility: 1, _pendingMarkers: null, _retryCache: null, _transitions: null }), n.mode === "hidden") {
        if ((l.flags & 128) !== 0) {
          if (u = u !== null ? u.baseLanes | e : e, t !== null) {
            for (n = l.child = t.child, a = 0; n !== null; ) a = a | n.lanes | n.childLanes, n = n.sibling;
            n = a & ~u;
          } else n = 0, l.child = null;
          return bd(t, l, u, e, n);
        }
        if ((e & 536870912) !== 0) l.memoizedState = { baseLanes: 0, cachePool: null }, t !== null && Ei(l, u !== null ? u.cachePool : null), u !== null ? cd(l, u) : ns(), Rm(l);
        else return n = l.lanes = 536870912, bd(t, l, u !== null ? u.baseLanes | e : e, e, n);
      } else u !== null ? (Ei(l, u.cachePool), cd(l, u), $e(l), l.memoizedState = null) : (t !== null && Ei(l, null), ns(), $e(l));
      return ul(t, l, a, e), l.child;
    }
    function nu(t, l) {
      return t !== null && t.tag === 22 || l.stateNode !== null || (l.stateNode = { _visibility: 1, _pendingMarkers: null, _retryCache: null, _transitions: null }), l.sibling;
    }
    function bd(t, l, e, n, a) {
      var u = Js();
      return u = u === null ? null : { parent: It._currentValue, pool: u }, l.memoizedState = { baseLanes: e, cachePool: u }, t !== null && Ei(l, null), ns(), Rm(l), t !== null && Ba(t, l, n, true), l.childLanes = a, null;
    }
    function zi(t, l) {
      return l = ki({ mode: l.mode, children: l.children }, t.mode), l.ref = t.ref, t.child = l, l.return = t, l;
    }
    function Sd(t, l, e) {
      return Bn(l, t.child, null, e), t = zi(l, l.pendingProps), t.flags |= 2, xl(l), l.memoizedState = null, t;
    }
    function ig(t, l, e) {
      var n = l.pendingProps, a = (l.flags & 128) !== 0;
      if (l.flags &= -129, t === null) {
        if (st) {
          if (n.mode === "hidden") return t = zi(l, n), l.lanes = 536870912, nu(null, t);
          if (as(l), (t = Dt) ? (t = _h(t, $l), t = t !== null && t.data === "&" ? t : null, t !== null && (l.memoizedState = { dehydrated: t, treeContext: mn !== null ? { id: se, overflow: oe } : null, retryLane: 536870912, hydrationErrors: null }, e = Zm(t), e.return = l, l.child = e, cl = l, Dt = null)) : t = null, t === null) throw hn(l);
          return l.lanes = 536870912, null;
        }
        return zi(l, n);
      }
      var u = t.memoizedState;
      if (u !== null) {
        var i = u.dehydrated;
        if (as(l), a) if (l.flags & 256) l.flags &= -257, l = Sd(t, l, e);
        else if (l.memoizedState !== null) l.child = t.child, l.flags |= 128, l = null;
        else throw Error(z(558));
        else if (Pt || Ba(t, l, e, false), a = (e & t.childLanes) !== 0, Pt || a) {
          if (n = Nt, n !== null && (i = pm(n, e), i !== 0 && i !== u.retryLane)) throw u.retryLane = i, Gn(t, i), Cl(n, t, i), so;
          Ii(), l = Sd(t, l, e);
        } else t = u.treeContext, Dt = Pl(i.nextSibling), cl = l, st = true, an = null, $l = false, t !== null && Km(l, t), l = zi(l, n), l.flags |= 4096;
        return l;
      }
      return t = De(t.child, { mode: n.mode, children: n.children }), t.ref = l.ref, l.child = t, t.return = l, t;
    }
    function Oi(t, l) {
      var e = l.ref;
      if (e === null) t !== null && t.ref !== null && (l.flags |= 4194816);
      else {
        if (typeof e != "function" && typeof e != "object") throw Error(z(284));
        (t === null || t.ref !== e) && (l.flags |= 4194816);
      }
    }
    function os(t, l, e, n, a) {
      return xn(l), e = Is(t, l, e, n, void 0, a), n = Ps(), t !== null && !Pt ? (Rs(t, l, a), qe(t, l, a)) : (st && n && Zs(l), l.flags |= 1, ul(t, l, e, a), l.child);
    }
    function Nd(t, l, e, n, a, u) {
      return xn(l), l.updateQueue = null, e = l0(l, n, e, a), t0(t), n = Ps(), t !== null && !Pt ? (Rs(t, l, u), qe(t, l, u)) : (st && n && Zs(l), l.flags |= 1, ul(t, l, e, u), l.child);
    }
    function Ed(t, l, e, n, a) {
      if (xn(l), l.stateNode === null) {
        var u = oa, i = e.contextType;
        typeof i == "object" && i !== null && (u = fl(i)), u = new e(n, u), l.memoizedState = u.state !== null && u.state !== void 0 ? u.state : null, u.updater = fs, l.stateNode = u, u._reactInternals = l, u = l.stateNode, u.props = n, u.state = l.memoizedState, u.refs = {}, Ws(l), i = e.contextType, u.context = typeof i == "object" && i !== null ? fl(i) : oa, u.state = l.memoizedState, i = e.getDerivedStateFromProps, typeof i == "function" && (yf(l, e, i, n), u.state = l.memoizedState), typeof e.getDerivedStateFromProps == "function" || typeof u.getSnapshotBeforeUpdate == "function" || typeof u.UNSAFE_componentWillMount != "function" && typeof u.componentWillMount != "function" || (i = u.state, typeof u.componentWillMount == "function" && u.componentWillMount(), typeof u.UNSAFE_componentWillMount == "function" && u.UNSAFE_componentWillMount(), i !== u.state && fs.enqueueReplaceState(u, u.state, null), ru(l, n, u, a), ou(), u.state = l.memoizedState), typeof u.componentDidMount == "function" && (l.flags |= 4194308), n = true;
      } else if (t === null) {
        u = l.stateNode;
        var c = l.memoizedProps, f = Yn(e, c);
        u.props = f;
        var r = u.context, y = e.contextType;
        i = oa, typeof y == "object" && y !== null && (i = fl(y));
        var b = e.getDerivedStateFromProps;
        y = typeof b == "function" || typeof u.getSnapshotBeforeUpdate == "function", c = l.pendingProps !== c, y || typeof u.UNSAFE_componentWillReceiveProps != "function" && typeof u.componentWillReceiveProps != "function" || (c || r !== i) && pd(l, u, n, i), ke = false;
        var m = l.memoizedState;
        u.state = m, ru(l, n, u, a), ou(), r = l.memoizedState, c || m !== r || ke ? (typeof b == "function" && (yf(l, e, b, n), r = l.memoizedState), (f = ke || hd(l, e, f, n, m, r, i)) ? (y || typeof u.UNSAFE_componentWillMount != "function" && typeof u.componentWillMount != "function" || (typeof u.componentWillMount == "function" && u.componentWillMount(), typeof u.UNSAFE_componentWillMount == "function" && u.UNSAFE_componentWillMount()), typeof u.componentDidMount == "function" && (l.flags |= 4194308)) : (typeof u.componentDidMount == "function" && (l.flags |= 4194308), l.memoizedProps = n, l.memoizedState = r), u.props = n, u.state = r, u.context = i, n = f) : (typeof u.componentDidMount == "function" && (l.flags |= 4194308), n = false);
      } else {
        u = l.stateNode, ls(t, l), i = l.memoizedProps, y = Yn(e, i), u.props = y, b = l.pendingProps, m = u.context, r = e.contextType, f = oa, typeof r == "object" && r !== null && (f = fl(r)), c = e.getDerivedStateFromProps, (r = typeof c == "function" || typeof u.getSnapshotBeforeUpdate == "function") || typeof u.UNSAFE_componentWillReceiveProps != "function" && typeof u.componentWillReceiveProps != "function" || (i !== b || m !== f) && pd(l, u, n, f), ke = false, m = l.memoizedState, u.state = m, ru(l, n, u, a), ou();
        var h = l.memoizedState;
        i !== b || m !== h || ke || t !== null && t.dependencies !== null && Gi(t.dependencies) ? (typeof c == "function" && (yf(l, e, c, n), h = l.memoizedState), (y = ke || hd(l, e, y, n, m, h, f) || t !== null && t.dependencies !== null && Gi(t.dependencies)) ? (r || typeof u.UNSAFE_componentWillUpdate != "function" && typeof u.componentWillUpdate != "function" || (typeof u.componentWillUpdate == "function" && u.componentWillUpdate(n, h, f), typeof u.UNSAFE_componentWillUpdate == "function" && u.UNSAFE_componentWillUpdate(n, h, f)), typeof u.componentDidUpdate == "function" && (l.flags |= 4), typeof u.getSnapshotBeforeUpdate == "function" && (l.flags |= 1024)) : (typeof u.componentDidUpdate != "function" || i === t.memoizedProps && m === t.memoizedState || (l.flags |= 4), typeof u.getSnapshotBeforeUpdate != "function" || i === t.memoizedProps && m === t.memoizedState || (l.flags |= 1024), l.memoizedProps = n, l.memoizedState = h), u.props = n, u.state = h, u.context = f, n = y) : (typeof u.componentDidUpdate != "function" || i === t.memoizedProps && m === t.memoizedState || (l.flags |= 4), typeof u.getSnapshotBeforeUpdate != "function" || i === t.memoizedProps && m === t.memoizedState || (l.flags |= 1024), n = false);
      }
      return u = n, Oi(t, l), n = (l.flags & 128) !== 0, u || n ? (u = l.stateNode, e = n && typeof e.getDerivedStateFromError != "function" ? null : u.render(), l.flags |= 1, t !== null && n ? (l.child = Bn(l, t.child, null, a), l.child = Bn(l, null, e, a)) : ul(t, l, e, a), l.memoizedState = u.state, t = l.child) : t = qe(t, l, a), t;
    }
    function Td(t, l, e, n) {
      return Hn(), l.flags |= 256, ul(t, l, e, n), l.child;
    }
    var gf = { dehydrated: null, treeContext: null, retryLane: 0, hydrationErrors: null };
    function vf(t) {
      return { baseLanes: t, cachePool: km() };
    }
    function bf(t, l, e) {
      return t = t !== null ? t.childLanes & ~e : 0, l && (t |= ql), t;
    }
    function j0(t, l, e) {
      var n = l.pendingProps, a = false, u = (l.flags & 128) !== 0, i;
      if ((i = u) || (i = t !== null && t.memoizedState === null ? false : (Qt.current & 2) !== 0), i && (a = true, l.flags &= -129), i = (l.flags & 32) !== 0, l.flags &= -33, t === null) {
        if (st) {
          if (a ? Fe(l) : $e(l), (t = Dt) ? (t = _h(t, $l), t = t !== null && t.data !== "&" ? t : null, t !== null && (l.memoizedState = { dehydrated: t, treeContext: mn !== null ? { id: se, overflow: oe } : null, retryLane: 536870912, hydrationErrors: null }, e = Zm(t), e.return = l, l.child = e, cl = l, Dt = null)) : t = null, t === null) throw hn(l);
          return As(t) ? l.lanes = 32 : l.lanes = 536870912, null;
        }
        var c = n.children;
        return n = n.fallback, a ? ($e(l), a = l.mode, c = ki({ mode: "hidden", children: c }, a), n = Mn(n, a, e, null), c.return = l, n.return = l, c.sibling = n, l.child = c, n = l.child, n.memoizedState = vf(e), n.childLanes = bf(t, i, e), l.memoizedState = gf, nu(null, n)) : (Fe(l), rs(l, c));
      }
      var f = t.memoizedState;
      if (f !== null && (c = f.dehydrated, c !== null)) {
        if (u) l.flags & 256 ? (Fe(l), l.flags &= -257, l = Sf(t, l, e)) : l.memoizedState !== null ? ($e(l), l.child = t.child, l.flags |= 128, l = null) : ($e(l), c = n.fallback, a = l.mode, n = ki({ mode: "visible", children: n.children }, a), c = Mn(c, a, e, null), c.flags |= 2, n.return = l, c.return = l, n.sibling = c, l.child = n, Bn(l, t.child, null, e), n = l.child, n.memoizedState = vf(e), n.childLanes = bf(t, i, e), l.memoizedState = gf, l = nu(null, n));
        else if (Fe(l), As(c)) {
          if (i = c.nextSibling && c.nextSibling.dataset, i) var r = i.dgst;
          i = r, n = Error(z(419)), n.stack = "", n.digest = i, Tu({ value: n, source: null, stack: null }), l = Sf(t, l, e);
        } else if (Pt || Ba(t, l, e, false), i = (e & t.childLanes) !== 0, Pt || i) {
          if (i = Nt, i !== null && (n = pm(i, e), n !== 0 && n !== f.retryLane)) throw f.retryLane = n, Gn(t, n), Cl(i, t, n), so;
          Ts(c) || Ii(), l = Sf(t, l, e);
        } else Ts(c) ? (l.flags |= 192, l.child = t.child, l = null) : (t = f.treeContext, Dt = Pl(c.nextSibling), cl = l, st = true, an = null, $l = false, t !== null && Km(l, t), l = rs(l, n.children), l.flags |= 4096);
        return l;
      }
      return a ? ($e(l), c = n.fallback, a = l.mode, f = t.child, r = f.sibling, n = De(f, { mode: "hidden", children: n.children }), n.subtreeFlags = f.subtreeFlags & 65011712, r !== null ? c = De(r, c) : (c = Mn(c, a, e, null), c.flags |= 2), c.return = l, n.return = l, n.sibling = c, l.child = n, nu(null, n), n = l.child, c = t.child.memoizedState, c === null ? c = vf(e) : (a = c.cachePool, a !== null ? (f = It._currentValue, a = a.parent !== f ? { parent: f, pool: f } : a) : a = km(), c = { baseLanes: c.baseLanes | e, cachePool: a }), n.memoizedState = c, n.childLanes = bf(t, i, e), l.memoizedState = gf, nu(t.child, n)) : (Fe(l), e = t.child, t = e.sibling, e = De(e, { mode: "visible", children: n.children }), e.return = l, e.sibling = null, t !== null && (i = l.deletions, i === null ? (l.deletions = [t], l.flags |= 16) : i.push(t)), l.child = e, l.memoizedState = null, e);
    }
    function rs(t, l) {
      return l = ki({ mode: "visible", children: l }, t.mode), l.return = t, t.child = l;
    }
    function ki(t, l) {
      return t = Bl(22, t, null, l), t.lanes = 0, t;
    }
    function Sf(t, l, e) {
      return Bn(l, t.child, null, e), t = rs(l, l.pendingProps.children), t.flags |= 2, l.memoizedState = null, t;
    }
    function Ad(t, l, e) {
      t.lanes |= l;
      var n = t.alternate;
      n !== null && (n.lanes |= l), Pf(t.return, l, e);
    }
    function Nf(t, l, e, n, a, u) {
      var i = t.memoizedState;
      i === null ? t.memoizedState = { isBackwards: l, rendering: null, renderingStartTime: 0, last: n, tail: e, tailMode: a, treeForkCount: u } : (i.isBackwards = l, i.rendering = null, i.renderingStartTime = 0, i.last = n, i.tail = e, i.tailMode = a, i.treeForkCount = u);
    }
    function G0(t, l, e) {
      var n = l.pendingProps, a = n.revealOrder, u = n.tail;
      n = n.children;
      var i = Qt.current, c = (i & 2) !== 0;
      if (c ? (i = i & 1 | 2, l.flags |= 128) : i &= 1, Tt(Qt, i), ul(t, l, n, e), n = st ? Eu : 0, !c && t !== null && (t.flags & 128) !== 0) t: for (t = l.child; t !== null; ) {
        if (t.tag === 13) t.memoizedState !== null && Ad(t, e, l);
        else if (t.tag === 19) Ad(t, e, l);
        else if (t.child !== null) {
          t.child.return = t, t = t.child;
          continue;
        }
        if (t === l) break t;
        for (; t.sibling === null; ) {
          if (t.return === null || t.return === l) break t;
          t = t.return;
        }
        t.sibling.return = t.return, t = t.sibling;
      }
      switch (a) {
        case "forwards":
          for (e = l.child, a = null; e !== null; ) t = e.alternate, t !== null && Zi(t) === null && (a = e), e = e.sibling;
          e = a, e === null ? (a = l.child, l.child = null) : (a = e.sibling, e.sibling = null), Nf(l, false, a, e, u, n);
          break;
        case "backwards":
        case "unstable_legacy-backwards":
          for (e = null, a = l.child, l.child = null; a !== null; ) {
            if (t = a.alternate, t !== null && Zi(t) === null) {
              l.child = a;
              break;
            }
            t = a.sibling, a.sibling = e, e = a, a = t;
          }
          Nf(l, true, e, null, u, n);
          break;
        case "together":
          Nf(l, false, null, null, void 0, n);
          break;
        default:
          l.memoizedState = null;
      }
      return l.child;
    }
    function qe(t, l, e) {
      if (t !== null && (l.dependencies = t.dependencies), yn |= l.lanes, (e & l.childLanes) === 0) if (t !== null) {
        if (Ba(t, l, e, false), (e & l.childLanes) === 0) return null;
      } else return null;
      if (t !== null && l.child !== t.child) throw Error(z(153));
      if (l.child !== null) {
        for (t = l.child, e = De(t, t.pendingProps), l.child = e, e.return = l; t.sibling !== null; ) t = t.sibling, e = e.sibling = De(t, t.pendingProps), e.return = l;
        e.sibling = null;
      }
      return l.child;
    }
    function oo(t, l) {
      return (t.lanes & l) !== 0 ? true : (t = t.dependencies, !!(t !== null && Gi(t)));
    }
    function cg(t, l, e) {
      switch (l.tag) {
        case 3:
          xi(l, l.stateNode.containerInfo), We(l, It, t.memoizedState.cache), Hn();
          break;
        case 27:
        case 5:
          jf(l);
          break;
        case 4:
          xi(l, l.stateNode.containerInfo);
          break;
        case 10:
          We(l, l.type, l.memoizedProps.value);
          break;
        case 31:
          if (l.memoizedState !== null) return l.flags |= 128, as(l), null;
          break;
        case 13:
          var n = l.memoizedState;
          if (n !== null) return n.dehydrated !== null ? (Fe(l), l.flags |= 128, null) : (e & l.child.childLanes) !== 0 ? j0(t, l, e) : (Fe(l), t = qe(t, l, e), t !== null ? t.sibling : null);
          Fe(l);
          break;
        case 19:
          var a = (t.flags & 128) !== 0;
          if (n = (e & l.childLanes) !== 0, n || (Ba(t, l, e, false), n = (e & l.childLanes) !== 0), a) {
            if (n) return G0(t, l, e);
            l.flags |= 128;
          }
          if (a = l.memoizedState, a !== null && (a.rendering = null, a.tail = null, a.lastEffect = null), Tt(Qt, Qt.current), n) break;
          return null;
        case 22:
          return l.lanes = 0, w0(t, l, e, l.pendingProps);
        case 24:
          We(l, It, t.memoizedState.cache);
      }
      return qe(t, l, e);
    }
    function X0(t, l, e) {
      if (t !== null) if (t.memoizedProps !== l.pendingProps) Pt = true;
      else {
        if (!oo(t, e) && (l.flags & 128) === 0) return Pt = false, cg(t, l, e);
        Pt = (t.flags & 131072) !== 0;
      }
      else Pt = false, st && (l.flags & 1048576) !== 0 && Vm(l, Eu, l.index);
      switch (l.lanes = 0, l.tag) {
        case 16:
          t: {
            var n = l.pendingProps;
            if (t = zn(l.elementType), l.type = t, typeof t == "function") Qs(t) ? (n = Yn(t, n), l.tag = 1, l = Ed(null, l, t, n, e)) : (l.tag = 0, l = os(null, l, t, n, e));
            else {
              if (t != null) {
                var a = t.$$typeof;
                if (a === Ms) {
                  l.tag = 11, l = gd(null, l, t, n, e);
                  break t;
                } else if (a === Ds) {
                  l.tag = 14, l = vd(null, l, t, n, e);
                  break t;
                }
              }
              throw l = Lf(t) || t, Error(z(306, l, ""));
            }
          }
          return l;
        case 0:
          return os(t, l, l.type, l.pendingProps, e);
        case 1:
          return n = l.type, a = Yn(n, l.pendingProps), Ed(t, l, n, a, e);
        case 3:
          t: {
            if (xi(l, l.stateNode.containerInfo), t === null) throw Error(z(387));
            n = l.pendingProps;
            var u = l.memoizedState;
            a = u.element, ls(t, l), ru(l, n, null, e);
            var i = l.memoizedState;
            if (n = i.cache, We(l, It, n), n !== u.cache && Rf(l, [It], e, true), ou(), n = i.element, u.isDehydrated) if (u = { element: n, isDehydrated: false, cache: i.cache }, l.updateQueue.baseState = u, l.memoizedState = u, l.flags & 256) {
              l = Td(t, l, n, e);
              break t;
            } else if (n !== a) {
              a = Fl(Error(z(424)), l), Tu(a), l = Td(t, l, n, e);
              break t;
            } else {
              switch (t = l.stateNode.containerInfo, t.nodeType) {
                case 9:
                  t = t.body;
                  break;
                default:
                  t = t.nodeName === "HTML" ? t.ownerDocument.body : t;
              }
              for (Dt = Pl(t.firstChild), cl = l, st = true, an = null, $l = true, e = $m(l, null, n, e), l.child = e; e; ) e.flags = e.flags & -3 | 4096, e = e.sibling;
            }
            else {
              if (Hn(), n === a) {
                l = qe(t, l, e);
                break t;
              }
              ul(t, l, n, e);
            }
            l = l.child;
          }
          return l;
        case 26:
          return Oi(t, l), t === null ? (e = Jd(l.type, null, l.pendingProps, null)) ? l.memoizedState = e : st || (e = l.type, t = l.pendingProps, n = lc(nn.current).createElement(e), n[il] = l, n[Ml] = t, sl(n, e, t), el(n), l.stateNode = n) : l.memoizedState = Jd(l.type, t.memoizedProps, l.pendingProps, t.memoizedState), null;
        case 27:
          return jf(l), t === null && st && (n = l.stateNode = Uh(l.type, l.pendingProps, nn.current), cl = l, $l = true, a = Dt, vn(l.type) ? (zs = a, Dt = Pl(n.firstChild)) : Dt = a), ul(t, l, l.pendingProps.children, e), Oi(t, l), t === null && (l.flags |= 4194304), l.child;
        case 5:
          return t === null && st && ((a = n = Dt) && (n = qg(n, l.type, l.pendingProps, $l), n !== null ? (l.stateNode = n, cl = l, Dt = Pl(n.firstChild), $l = false, a = true) : a = false), a || hn(l)), jf(l), a = l.type, u = l.pendingProps, i = t !== null ? t.memoizedProps : null, n = u.children, Ns(a, u) ? n = null : i !== null && Ns(a, i) && (l.flags |= 32), l.memoizedState !== null && (a = Is(t, l, Py, null, null, e), Du._currentValue = a), Oi(t, l), ul(t, l, n, e), l.child;
        case 6:
          return t === null && st && ((t = e = Dt) && (e = Yg(e, l.pendingProps, $l), e !== null ? (l.stateNode = e, cl = l, Dt = null, t = true) : t = false), t || hn(l)), null;
        case 13:
          return j0(t, l, e);
        case 4:
          return xi(l, l.stateNode.containerInfo), n = l.pendingProps, t === null ? l.child = Bn(l, null, n, e) : ul(t, l, n, e), l.child;
        case 11:
          return gd(t, l, l.type, l.pendingProps, e);
        case 7:
          return ul(t, l, l.pendingProps, e), l.child;
        case 8:
          return ul(t, l, l.pendingProps.children, e), l.child;
        case 12:
          return ul(t, l, l.pendingProps.children, e), l.child;
        case 10:
          return n = l.pendingProps, We(l, l.type, n.value), ul(t, l, n.children, e), l.child;
        case 9:
          return a = l.type._context, n = l.pendingProps.children, xn(l), a = fl(a), n = n(a), l.flags |= 1, ul(t, l, n, e), l.child;
        case 14:
          return vd(t, l, l.type, l.pendingProps, e);
        case 15:
          return L0(t, l, l.type, l.pendingProps, e);
        case 19:
          return G0(t, l, e);
        case 31:
          return ig(t, l, e);
        case 22:
          return w0(t, l, e, l.pendingProps);
        case 24:
          return xn(l), n = fl(It), t === null ? (a = Js(), a === null && (a = Nt, u = Ks(), a.pooledCache = u, u.refCount++, u !== null && (a.pooledCacheLanes |= e), a = u), l.memoizedState = { parent: n, cache: a }, Ws(l), We(l, It, a)) : ((t.lanes & e) !== 0 && (ls(t, l), ru(l, null, null, e), ou()), a = t.memoizedState, u = l.memoizedState, a.parent !== n ? (a = { parent: n, cache: n }, l.memoizedState = a, l.lanes === 0 && (l.memoizedState = l.updateQueue.baseState = a), We(l, It, n)) : (n = u.cache, We(l, It, n), n !== a.cache && Rf(l, [It], e, true))), ul(t, l, l.pendingProps.children, e), l.child;
        case 29:
          throw l.pendingProps;
      }
      throw Error(z(156, l.tag));
    }
    function Se(t) {
      t.flags |= 4;
    }
    function Ef(t, l, e, n, a) {
      if ((l = (t.mode & 32) !== 0) && (l = false), l) {
        if (t.flags |= 16777216, (a & 335544128) === a) if (t.stateNode.complete) t.flags |= 8192;
        else if (rh()) t.flags |= 8192;
        else throw _n = Xi, ks;
      } else t.flags &= -16777217;
    }
    function zd(t, l) {
      if (l.type !== "stylesheet" || (l.state.loading & 4) !== 0) t.flags &= -16777217;
      else if (t.flags |= 16777216, !Bh(l)) if (rh()) t.flags |= 8192;
      else throw _n = Xi, ks;
    }
    function oi(t, l) {
      l !== null && (t.flags |= 4), t.flags & 16384 && (l = t.tag !== 22 ? dm() : 536870912, t.lanes |= l, Ca |= l);
    }
    function $a(t, l) {
      if (!st) switch (t.tailMode) {
        case "hidden":
          l = t.tail;
          for (var e = null; l !== null; ) l.alternate !== null && (e = l), l = l.sibling;
          e === null ? t.tail = null : e.sibling = null;
          break;
        case "collapsed":
          e = t.tail;
          for (var n = null; e !== null; ) e.alternate !== null && (n = e), e = e.sibling;
          n === null ? l || t.tail === null ? t.tail = null : t.tail.sibling = null : n.sibling = null;
      }
    }
    function Mt(t) {
      var l = t.alternate !== null && t.alternate.child === t.child, e = 0, n = 0;
      if (l) for (var a = t.child; a !== null; ) e |= a.lanes | a.childLanes, n |= a.subtreeFlags & 65011712, n |= a.flags & 65011712, a.return = t, a = a.sibling;
      else for (a = t.child; a !== null; ) e |= a.lanes | a.childLanes, n |= a.subtreeFlags, n |= a.flags, a.return = t, a = a.sibling;
      return t.subtreeFlags |= n, t.childLanes = e, l;
    }
    function fg(t, l, e) {
      var n = l.pendingProps;
      switch (Vs(l), l.tag) {
        case 16:
        case 15:
        case 0:
        case 11:
        case 7:
        case 8:
        case 12:
        case 9:
        case 14:
          return Mt(l), null;
        case 1:
          return Mt(l), null;
        case 3:
          return e = l.stateNode, n = null, t !== null && (n = t.memoizedState.cache), l.memoizedState.cache !== n && (l.flags |= 2048), _e(It), Na(), e.pendingContext && (e.context = e.pendingContext, e.pendingContext = null), (t === null || t.child === null) && (Pn(l) ? Se(l) : t === null || t.memoizedState.isDehydrated && (l.flags & 256) === 0 || (l.flags |= 1024, mf())), Mt(l), null;
        case 26:
          var a = l.type, u = l.memoizedState;
          return t === null ? (Se(l), u !== null ? (Mt(l), zd(l, u)) : (Mt(l), Ef(l, a, null, n, e))) : u ? u !== t.memoizedState ? (Se(l), Mt(l), zd(l, u)) : (Mt(l), l.flags &= -16777217) : (t = t.memoizedProps, t !== n && Se(l), Mt(l), Ef(l, a, t, n, e)), null;
        case 27:
          if (Bi(l), e = nn.current, a = l.type, t !== null && l.stateNode != null) t.memoizedProps !== n && Se(l);
          else {
            if (!n) {
              if (l.stateNode === null) throw Error(z(166));
              return Mt(l), null;
            }
            t = de.current, Pn(l) ? td(l, t) : (t = Uh(a, n, e), l.stateNode = t, Se(l));
          }
          return Mt(l), null;
        case 5:
          if (Bi(l), a = l.type, t !== null && l.stateNode != null) t.memoizedProps !== n && Se(l);
          else {
            if (!n) {
              if (l.stateNode === null) throw Error(z(166));
              return Mt(l), null;
            }
            if (u = de.current, Pn(l)) td(l, u);
            else {
              var i = lc(nn.current);
              switch (u) {
                case 1:
                  u = i.createElementNS("http://www.w3.org/2000/svg", a);
                  break;
                case 2:
                  u = i.createElementNS("http://www.w3.org/1998/Math/MathML", a);
                  break;
                default:
                  switch (a) {
                    case "svg":
                      u = i.createElementNS("http://www.w3.org/2000/svg", a);
                      break;
                    case "math":
                      u = i.createElementNS("http://www.w3.org/1998/Math/MathML", a);
                      break;
                    case "script":
                      u = i.createElement("div"), u.innerHTML = "<script><\/script>", u = u.removeChild(u.firstChild);
                      break;
                    case "select":
                      u = typeof n.is == "string" ? i.createElement("select", { is: n.is }) : i.createElement("select"), n.multiple ? u.multiple = true : n.size && (u.size = n.size);
                      break;
                    default:
                      u = typeof n.is == "string" ? i.createElement(a, { is: n.is }) : i.createElement(a);
                  }
              }
              u[il] = l, u[Ml] = n;
              t: for (i = l.child; i !== null; ) {
                if (i.tag === 5 || i.tag === 6) u.appendChild(i.stateNode);
                else if (i.tag !== 4 && i.tag !== 27 && i.child !== null) {
                  i.child.return = i, i = i.child;
                  continue;
                }
                if (i === l) break t;
                for (; i.sibling === null; ) {
                  if (i.return === null || i.return === l) break t;
                  i = i.return;
                }
                i.sibling.return = i.return, i = i.sibling;
              }
              l.stateNode = u;
              t: switch (sl(u, a, n), a) {
                case "button":
                case "input":
                case "select":
                case "textarea":
                  n = !!n.autoFocus;
                  break t;
                case "img":
                  n = true;
                  break t;
                default:
                  n = false;
              }
              n && Se(l);
            }
          }
          return Mt(l), Ef(l, l.type, t === null ? null : t.memoizedProps, l.pendingProps, e), null;
        case 6:
          if (t && l.stateNode != null) t.memoizedProps !== n && Se(l);
          else {
            if (typeof n != "string" && l.stateNode === null) throw Error(z(166));
            if (t = nn.current, Pn(l)) {
              if (t = l.stateNode, e = l.memoizedProps, n = null, a = cl, a !== null) switch (a.tag) {
                case 27:
                case 5:
                  n = a.memoizedProps;
              }
              t[il] = l, t = !!(t.nodeValue === e || n !== null && n.suppressHydrationWarning === true || Ch(t.nodeValue, e)), t || hn(l, true);
            } else t = lc(t).createTextNode(n), t[il] = l, l.stateNode = t;
          }
          return Mt(l), null;
        case 31:
          if (e = l.memoizedState, t === null || t.memoizedState !== null) {
            if (n = Pn(l), e !== null) {
              if (t === null) {
                if (!n) throw Error(z(318));
                if (t = l.memoizedState, t = t !== null ? t.dehydrated : null, !t) throw Error(z(557));
                t[il] = l;
              } else Hn(), (l.flags & 128) === 0 && (l.memoizedState = null), l.flags |= 4;
              Mt(l), t = false;
            } else e = mf(), t !== null && t.memoizedState !== null && (t.memoizedState.hydrationErrors = e), t = true;
            if (!t) return l.flags & 256 ? (xl(l), l) : (xl(l), null);
            if ((l.flags & 128) !== 0) throw Error(z(558));
          }
          return Mt(l), null;
        case 13:
          if (n = l.memoizedState, t === null || t.memoizedState !== null && t.memoizedState.dehydrated !== null) {
            if (a = Pn(l), n !== null && n.dehydrated !== null) {
              if (t === null) {
                if (!a) throw Error(z(318));
                if (a = l.memoizedState, a = a !== null ? a.dehydrated : null, !a) throw Error(z(317));
                a[il] = l;
              } else Hn(), (l.flags & 128) === 0 && (l.memoizedState = null), l.flags |= 4;
              Mt(l), a = false;
            } else a = mf(), t !== null && t.memoizedState !== null && (t.memoizedState.hydrationErrors = a), a = true;
            if (!a) return l.flags & 256 ? (xl(l), l) : (xl(l), null);
          }
          return xl(l), (l.flags & 128) !== 0 ? (l.lanes = e, l) : (e = n !== null, t = t !== null && t.memoizedState !== null, e && (n = l.child, a = null, n.alternate !== null && n.alternate.memoizedState !== null && n.alternate.memoizedState.cachePool !== null && (a = n.alternate.memoizedState.cachePool.pool), u = null, n.memoizedState !== null && n.memoizedState.cachePool !== null && (u = n.memoizedState.cachePool.pool), u !== a && (n.flags |= 2048)), e !== t && e && (l.child.flags |= 8192), oi(l, l.updateQueue), Mt(l), null);
        case 4:
          return Na(), t === null && vo(l.stateNode.containerInfo), Mt(l), null;
        case 10:
          return _e(l.type), Mt(l), null;
        case 19:
          if (nl(Qt), n = l.memoizedState, n === null) return Mt(l), null;
          if (a = (l.flags & 128) !== 0, u = n.rendering, u === null) if (a) $a(n, false);
          else {
            if (Gt !== 0 || t !== null && (t.flags & 128) !== 0) for (t = l.child; t !== null; ) {
              if (u = Zi(t), u !== null) {
                for (l.flags |= 128, $a(n, false), t = u.updateQueue, l.updateQueue = t, oi(l, t), l.subtreeFlags = 0, t = e, e = l.child; e !== null; ) Qm(e, t), e = e.sibling;
                return Tt(Qt, Qt.current & 1 | 2), st && Ae(l, n.treeForkCount), l.child;
              }
              t = t.sibling;
            }
            n.tail !== null && Yl() > Fi && (l.flags |= 128, a = true, $a(n, false), l.lanes = 4194304);
          }
          else {
            if (!a) if (t = Zi(u), t !== null) {
              if (l.flags |= 128, a = true, t = t.updateQueue, l.updateQueue = t, oi(l, t), $a(n, true), n.tail === null && n.tailMode === "hidden" && !u.alternate && !st) return Mt(l), null;
            } else 2 * Yl() - n.renderingStartTime > Fi && e !== 536870912 && (l.flags |= 128, a = true, $a(n, false), l.lanes = 4194304);
            n.isBackwards ? (u.sibling = l.child, l.child = u) : (t = n.last, t !== null ? t.sibling = u : l.child = u, n.last = u);
          }
          return n.tail !== null ? (t = n.tail, n.rendering = t, n.tail = t.sibling, n.renderingStartTime = Yl(), t.sibling = null, e = Qt.current, Tt(Qt, a ? e & 1 | 2 : e & 1), st && Ae(l, n.treeForkCount), t) : (Mt(l), null);
        case 22:
        case 23:
          return xl(l), Fs(), n = l.memoizedState !== null, t !== null ? t.memoizedState !== null !== n && (l.flags |= 8192) : n && (l.flags |= 8192), n ? (e & 536870912) !== 0 && (l.flags & 128) === 0 && (Mt(l), l.subtreeFlags & 6 && (l.flags |= 8192)) : Mt(l), e = l.updateQueue, e !== null && oi(l, e.retryQueue), e = null, t !== null && t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), n = null, l.memoizedState !== null && l.memoizedState.cachePool !== null && (n = l.memoizedState.cachePool.pool), n !== e && (l.flags |= 2048), t !== null && nl(Dn), null;
        case 24:
          return e = null, t !== null && (e = t.memoizedState.cache), l.memoizedState.cache !== e && (l.flags |= 2048), _e(It), Mt(l), null;
        case 25:
          return null;
        case 30:
          return null;
      }
      throw Error(z(156, l.tag));
    }
    function sg(t, l) {
      switch (Vs(l), l.tag) {
        case 1:
          return t = l.flags, t & 65536 ? (l.flags = t & -65537 | 128, l) : null;
        case 3:
          return _e(It), Na(), t = l.flags, (t & 65536) !== 0 && (t & 128) === 0 ? (l.flags = t & -65537 | 128, l) : null;
        case 26:
        case 27:
        case 5:
          return Bi(l), null;
        case 31:
          if (l.memoizedState !== null) {
            if (xl(l), l.alternate === null) throw Error(z(340));
            Hn();
          }
          return t = l.flags, t & 65536 ? (l.flags = t & -65537 | 128, l) : null;
        case 13:
          if (xl(l), t = l.memoizedState, t !== null && t.dehydrated !== null) {
            if (l.alternate === null) throw Error(z(340));
            Hn();
          }
          return t = l.flags, t & 65536 ? (l.flags = t & -65537 | 128, l) : null;
        case 19:
          return nl(Qt), null;
        case 4:
          return Na(), null;
        case 10:
          return _e(l.type), null;
        case 22:
        case 23:
          return xl(l), Fs(), t !== null && nl(Dn), t = l.flags, t & 65536 ? (l.flags = t & -65537 | 128, l) : null;
        case 24:
          return _e(It), null;
        case 25:
          return null;
        default:
          return null;
      }
    }
    function Q0(t, l) {
      switch (Vs(l), l.tag) {
        case 3:
          _e(It), Na();
          break;
        case 26:
        case 27:
        case 5:
          Bi(l);
          break;
        case 4:
          Na();
          break;
        case 31:
          l.memoizedState !== null && xl(l);
          break;
        case 13:
          xl(l);
          break;
        case 19:
          nl(Qt);
          break;
        case 10:
          _e(l.type);
          break;
        case 22:
        case 23:
          xl(l), Fs(), t !== null && nl(Dn);
          break;
        case 24:
          _e(It);
      }
    }
    function Gu(t, l) {
      try {
        var e = l.updateQueue, n = e !== null ? e.lastEffect : null;
        if (n !== null) {
          var a = n.next;
          e = a;
          do {
            if ((e.tag & t) === t) {
              n = void 0;
              var u = e.create, i = e.inst;
              n = u(), i.destroy = n;
            }
            e = e.next;
          } while (e !== a);
        }
      } catch (c) {
        vt(l, l.return, c);
      }
    }
    function pn(t, l, e) {
      try {
        var n = l.updateQueue, a = n !== null ? n.lastEffect : null;
        if (a !== null) {
          var u = a.next;
          n = u;
          do {
            if ((n.tag & t) === t) {
              var i = n.inst, c = i.destroy;
              if (c !== void 0) {
                i.destroy = void 0, a = l;
                var f = e, r = c;
                try {
                  r();
                } catch (y) {
                  vt(a, f, y);
                }
              }
            }
            n = n.next;
          } while (n !== u);
        }
      } catch (y) {
        vt(l, l.return, y);
      }
    }
    function Z0(t) {
      var l = t.updateQueue;
      if (l !== null) {
        var e = t.stateNode;
        try {
          Pm(l, e);
        } catch (n) {
          vt(t, t.return, n);
        }
      }
    }
    function V0(t, l, e) {
      e.props = Yn(t.type, t.memoizedProps), e.state = t.memoizedState;
      try {
        e.componentWillUnmount();
      } catch (n) {
        vt(t, l, n);
      }
    }
    function mu(t, l) {
      try {
        var e = t.ref;
        if (e !== null) {
          switch (t.tag) {
            case 26:
            case 27:
            case 5:
              var n = t.stateNode;
              break;
            case 30:
              n = t.stateNode;
              break;
            default:
              n = t.stateNode;
          }
          typeof e == "function" ? t.refCleanup = e(n) : e.current = n;
        }
      } catch (a) {
        vt(t, l, a);
      }
    }
    function re(t, l) {
      var e = t.ref, n = t.refCleanup;
      if (e !== null) if (typeof n == "function") try {
        n();
      } catch (a) {
        vt(t, l, a);
      } finally {
        t.refCleanup = null, t = t.alternate, t != null && (t.refCleanup = null);
      }
      else if (typeof e == "function") try {
        e(null);
      } catch (a) {
        vt(t, l, a);
      }
      else e.current = null;
    }
    function K0(t) {
      var l = t.type, e = t.memoizedProps, n = t.stateNode;
      try {
        t: switch (l) {
          case "button":
          case "input":
          case "select":
          case "textarea":
            e.autoFocus && n.focus();
            break t;
          case "img":
            e.src ? n.src = e.src : e.srcSet && (n.srcset = e.srcSet);
        }
      } catch (a) {
        vt(t, t.return, a);
      }
    }
    function Tf(t, l, e) {
      try {
        var n = t.stateNode;
        Dg(n, t.type, e, l), n[Ml] = l;
      } catch (a) {
        vt(t, t.return, a);
      }
    }
    function J0(t) {
      return t.tag === 5 || t.tag === 3 || t.tag === 26 || t.tag === 27 && vn(t.type) || t.tag === 4;
    }
    function Af(t) {
      t: for (; ; ) {
        for (; t.sibling === null; ) {
          if (t.return === null || J0(t.return)) return null;
          t = t.return;
        }
        for (t.sibling.return = t.return, t = t.sibling; t.tag !== 5 && t.tag !== 6 && t.tag !== 18; ) {
          if (t.tag === 27 && vn(t.type) || t.flags & 2 || t.child === null || t.tag === 4) continue t;
          t.child.return = t, t = t.child;
        }
        if (!(t.flags & 2)) return t.stateNode;
      }
    }
    function ds(t, l, e) {
      var n = t.tag;
      if (n === 5 || n === 6) t = t.stateNode, l ? (e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e).insertBefore(t, l) : (l = e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, l.appendChild(t), e = e._reactRootContainer, e != null || l.onclick !== null || (l.onclick = Ce));
      else if (n !== 4 && (n === 27 && vn(t.type) && (e = t.stateNode, l = null), t = t.child, t !== null)) for (ds(t, l, e), t = t.sibling; t !== null; ) ds(t, l, e), t = t.sibling;
    }
    function Wi(t, l, e) {
      var n = t.tag;
      if (n === 5 || n === 6) t = t.stateNode, l ? e.insertBefore(t, l) : e.appendChild(t);
      else if (n !== 4 && (n === 27 && vn(t.type) && (e = t.stateNode), t = t.child, t !== null)) for (Wi(t, l, e), t = t.sibling; t !== null; ) Wi(t, l, e), t = t.sibling;
    }
    function k0(t) {
      var l = t.stateNode, e = t.memoizedProps;
      try {
        for (var n = t.type, a = l.attributes; a.length; ) l.removeAttributeNode(a[0]);
        sl(l, n, e), l[il] = t, l[Ml] = e;
      } catch (u) {
        vt(t, t.return, u);
      }
    }
    var ze = false, $t = false, zf = false, Od = typeof WeakSet == "function" ? WeakSet : Set, ll = null;
    function og(t, l) {
      if (t = t.containerInfo, bs = uc, t = Bm(t), js(t)) {
        if ("selectionStart" in t) var e = { start: t.selectionStart, end: t.selectionEnd };
        else t: {
          e = (e = t.ownerDocument) && e.defaultView || window;
          var n = e.getSelection && e.getSelection();
          if (n && n.rangeCount !== 0) {
            e = n.anchorNode;
            var a = n.anchorOffset, u = n.focusNode;
            n = n.focusOffset;
            try {
              e.nodeType, u.nodeType;
            } catch {
              e = null;
              break t;
            }
            var i = 0, c = -1, f = -1, r = 0, y = 0, b = t, m = null;
            l: for (; ; ) {
              for (var h; b !== e || a !== 0 && b.nodeType !== 3 || (c = i + a), b !== u || n !== 0 && b.nodeType !== 3 || (f = i + n), b.nodeType === 3 && (i += b.nodeValue.length), (h = b.firstChild) !== null; ) m = b, b = h;
              for (; ; ) {
                if (b === t) break l;
                if (m === e && ++r === a && (c = i), m === u && ++y === n && (f = i), (h = b.nextSibling) !== null) break;
                b = m, m = b.parentNode;
              }
              b = h;
            }
            e = c === -1 || f === -1 ? null : { start: c, end: f };
          } else e = null;
        }
        e = e || { start: 0, end: 0 };
      } else e = null;
      for (Ss = { focusedElem: t, selectionRange: e }, uc = false, ll = l; ll !== null; ) if (l = ll, t = l.child, (l.subtreeFlags & 1028) !== 0 && t !== null) t.return = l, ll = t;
      else for (; ll !== null; ) {
        switch (l = ll, u = l.alternate, t = l.flags, l.tag) {
          case 0:
            if ((t & 4) !== 0 && (t = l.updateQueue, t = t !== null ? t.events : null, t !== null)) for (e = 0; e < t.length; e++) a = t[e], a.ref.impl = a.nextImpl;
            break;
          case 11:
          case 15:
            break;
          case 1:
            if ((t & 1024) !== 0 && u !== null) {
              t = void 0, e = l, a = u.memoizedProps, u = u.memoizedState, n = e.stateNode;
              try {
                var T = Yn(e.type, a);
                t = n.getSnapshotBeforeUpdate(T, u), n.__reactInternalSnapshotBeforeUpdate = t;
              } catch (M) {
                vt(e, e.return, M);
              }
            }
            break;
          case 3:
            if ((t & 1024) !== 0) {
              if (t = l.stateNode.containerInfo, e = t.nodeType, e === 9) Es(t);
              else if (e === 1) switch (t.nodeName) {
                case "HEAD":
                case "HTML":
                case "BODY":
                  Es(t);
                  break;
                default:
                  t.textContent = "";
              }
            }
            break;
          case 5:
          case 26:
          case 27:
          case 6:
          case 4:
          case 17:
            break;
          default:
            if ((t & 1024) !== 0) throw Error(z(163));
        }
        if (t = l.sibling, t !== null) {
          t.return = l.return, ll = t;
          break;
        }
        ll = l.return;
      }
    }
    function W0(t, l, e) {
      var n = e.flags;
      switch (e.tag) {
        case 0:
        case 11:
        case 15:
          Ee(t, e), n & 4 && Gu(5, e);
          break;
        case 1:
          if (Ee(t, e), n & 4) if (t = e.stateNode, l === null) try {
            t.componentDidMount();
          } catch (i) {
            vt(e, e.return, i);
          }
          else {
            var a = Yn(e.type, l.memoizedProps);
            l = l.memoizedState;
            try {
              t.componentDidUpdate(a, l, t.__reactInternalSnapshotBeforeUpdate);
            } catch (i) {
              vt(e, e.return, i);
            }
          }
          n & 64 && Z0(e), n & 512 && mu(e, e.return);
          break;
        case 3:
          if (Ee(t, e), n & 64 && (t = e.updateQueue, t !== null)) {
            if (l = null, e.child !== null) switch (e.child.tag) {
              case 27:
              case 5:
                l = e.child.stateNode;
                break;
              case 1:
                l = e.child.stateNode;
            }
            try {
              Pm(t, l);
            } catch (i) {
              vt(e, e.return, i);
            }
          }
          break;
        case 27:
          l === null && n & 4 && k0(e);
        case 26:
        case 5:
          Ee(t, e), l === null && n & 4 && K0(e), n & 512 && mu(e, e.return);
          break;
        case 12:
          Ee(t, e);
          break;
        case 31:
          Ee(t, e), n & 4 && I0(t, e);
          break;
        case 13:
          Ee(t, e), n & 4 && P0(t, e), n & 64 && (t = e.memoizedState, t !== null && (t = t.dehydrated, t !== null && (e = bg.bind(null, e), Lg(t, e))));
          break;
        case 22:
          if (n = e.memoizedState !== null || ze, !n) {
            l = l !== null && l.memoizedState !== null || $t, a = ze;
            var u = $t;
            ze = n, ($t = l) && !u ? Te(t, e, (e.subtreeFlags & 8772) !== 0) : Ee(t, e), ze = a, $t = u;
          }
          break;
        case 30:
          break;
        default:
          Ee(t, e);
      }
    }
    function F0(t) {
      var l = t.alternate;
      l !== null && (t.alternate = null, F0(l)), t.child = null, t.deletions = null, t.sibling = null, t.tag === 5 && (l = t.stateNode, l !== null && xs(l)), t.stateNode = null, t.return = null, t.dependencies = null, t.memoizedProps = null, t.memoizedState = null, t.pendingProps = null, t.stateNode = null, t.updateQueue = null;
    }
    var xt = null, zl = false;
    function Ne(t, l, e) {
      for (e = e.child; e !== null; ) $0(t, l, e), e = e.sibling;
    }
    function $0(t, l, e) {
      if (Ll && typeof Ll.onCommitFiberUnmount == "function") try {
        Ll.onCommitFiberUnmount(xu, e);
      } catch {
      }
      switch (e.tag) {
        case 26:
          $t || re(e, l), Ne(t, l, e), e.memoizedState ? e.memoizedState.count-- : e.stateNode && (e = e.stateNode, e.parentNode.removeChild(e));
          break;
        case 27:
          $t || re(e, l);
          var n = xt, a = zl;
          vn(e.type) && (xt = e.stateNode, zl = false), Ne(t, l, e), gu(e.stateNode), xt = n, zl = a;
          break;
        case 5:
          $t || re(e, l);
        case 6:
          if (n = xt, a = zl, xt = null, Ne(t, l, e), xt = n, zl = a, xt !== null) if (zl) try {
            (xt.nodeType === 9 ? xt.body : xt.nodeName === "HTML" ? xt.ownerDocument.body : xt).removeChild(e.stateNode);
          } catch (u) {
            vt(e, l, u);
          }
          else try {
            xt.removeChild(e.stateNode);
          } catch (u) {
            vt(e, l, u);
          }
          break;
        case 18:
          xt !== null && (zl ? (t = xt, Xd(t.nodeType === 9 ? t.body : t.nodeName === "HTML" ? t.ownerDocument.body : t, e.stateNode), Ua(t)) : Xd(xt, e.stateNode));
          break;
        case 4:
          n = xt, a = zl, xt = e.stateNode.containerInfo, zl = true, Ne(t, l, e), xt = n, zl = a;
          break;
        case 0:
        case 11:
        case 14:
        case 15:
          pn(2, e, l), $t || pn(4, e, l), Ne(t, l, e);
          break;
        case 1:
          $t || (re(e, l), n = e.stateNode, typeof n.componentWillUnmount == "function" && V0(e, l, n)), Ne(t, l, e);
          break;
        case 21:
          Ne(t, l, e);
          break;
        case 22:
          $t = (n = $t) || e.memoizedState !== null, Ne(t, l, e), $t = n;
          break;
        default:
          Ne(t, l, e);
      }
    }
    function I0(t, l) {
      if (l.memoizedState === null && (t = l.alternate, t !== null && (t = t.memoizedState, t !== null))) {
        t = t.dehydrated;
        try {
          Ua(t);
        } catch (e) {
          vt(l, l.return, e);
        }
      }
    }
    function P0(t, l) {
      if (l.memoizedState === null && (t = l.alternate, t !== null && (t = t.memoizedState, t !== null && (t = t.dehydrated, t !== null)))) try {
        Ua(t);
      } catch (e) {
        vt(l, l.return, e);
      }
    }
    function rg(t) {
      switch (t.tag) {
        case 31:
        case 13:
        case 19:
          var l = t.stateNode;
          return l === null && (l = t.stateNode = new Od()), l;
        case 22:
          return t = t.stateNode, l = t._retryCache, l === null && (l = t._retryCache = new Od()), l;
        default:
          throw Error(z(435, t.tag));
      }
    }
    function ri(t, l) {
      var e = rg(t);
      l.forEach(function(n) {
        if (!e.has(n)) {
          e.add(n);
          var a = Sg.bind(null, t, n);
          n.then(a, a);
        }
      });
    }
    function Tl(t, l) {
      var e = l.deletions;
      if (e !== null) for (var n = 0; n < e.length; n++) {
        var a = e[n], u = t, i = l, c = i;
        t: for (; c !== null; ) {
          switch (c.tag) {
            case 27:
              if (vn(c.type)) {
                xt = c.stateNode, zl = false;
                break t;
              }
              break;
            case 5:
              xt = c.stateNode, zl = false;
              break t;
            case 3:
            case 4:
              xt = c.stateNode.containerInfo, zl = true;
              break t;
          }
          c = c.return;
        }
        if (xt === null) throw Error(z(160));
        $0(u, i, a), xt = null, zl = false, u = a.alternate, u !== null && (u.return = null), a.return = null;
      }
      if (l.subtreeFlags & 13886) for (l = l.child; l !== null; ) R0(l, t), l = l.sibling;
    }
    var ue = null;
    function R0(t, l) {
      var e = t.alternate, n = t.flags;
      switch (t.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          Tl(l, t), Al(t), n & 4 && (pn(3, t, t.return), Gu(3, t), pn(5, t, t.return));
          break;
        case 1:
          Tl(l, t), Al(t), n & 512 && ($t || e === null || re(e, e.return)), n & 64 && ze && (t = t.updateQueue, t !== null && (n = t.callbacks, n !== null && (e = t.shared.hiddenCallbacks, t.shared.hiddenCallbacks = e === null ? n : e.concat(n))));
          break;
        case 26:
          var a = ue;
          if (Tl(l, t), Al(t), n & 512 && ($t || e === null || re(e, e.return)), n & 4) {
            var u = e !== null ? e.memoizedState : null;
            if (n = t.memoizedState, e === null) if (n === null) if (t.stateNode === null) {
              t: {
                n = t.type, e = t.memoizedProps, a = a.ownerDocument || a;
                l: switch (n) {
                  case "title":
                    u = a.getElementsByTagName("title")[0], (!u || u[Yu] || u[il] || u.namespaceURI === "http://www.w3.org/2000/svg" || u.hasAttribute("itemprop")) && (u = a.createElement(n), a.head.insertBefore(u, a.querySelector("head > title"))), sl(u, n, e), u[il] = t, el(u), n = u;
                    break t;
                  case "link":
                    var i = Wd("link", "href", a).get(n + (e.href || ""));
                    if (i) {
                      for (var c = 0; c < i.length; c++) if (u = i[c], u.getAttribute("href") === (e.href == null || e.href === "" ? null : e.href) && u.getAttribute("rel") === (e.rel == null ? null : e.rel) && u.getAttribute("title") === (e.title == null ? null : e.title) && u.getAttribute("crossorigin") === (e.crossOrigin == null ? null : e.crossOrigin)) {
                        i.splice(c, 1);
                        break l;
                      }
                    }
                    u = a.createElement(n), sl(u, n, e), a.head.appendChild(u);
                    break;
                  case "meta":
                    if (i = Wd("meta", "content", a).get(n + (e.content || ""))) {
                      for (c = 0; c < i.length; c++) if (u = i[c], u.getAttribute("content") === (e.content == null ? null : "" + e.content) && u.getAttribute("name") === (e.name == null ? null : e.name) && u.getAttribute("property") === (e.property == null ? null : e.property) && u.getAttribute("http-equiv") === (e.httpEquiv == null ? null : e.httpEquiv) && u.getAttribute("charset") === (e.charSet == null ? null : e.charSet)) {
                        i.splice(c, 1);
                        break l;
                      }
                    }
                    u = a.createElement(n), sl(u, n, e), a.head.appendChild(u);
                    break;
                  default:
                    throw Error(z(468, n));
                }
                u[il] = t, el(u), n = u;
              }
              t.stateNode = n;
            } else Fd(a, t.type, t.stateNode);
            else t.stateNode = kd(a, n, t.memoizedProps);
            else u !== n ? (u === null ? e.stateNode !== null && (e = e.stateNode, e.parentNode.removeChild(e)) : u.count--, n === null ? Fd(a, t.type, t.stateNode) : kd(a, n, t.memoizedProps)) : n === null && t.stateNode !== null && Tf(t, t.memoizedProps, e.memoizedProps);
          }
          break;
        case 27:
          Tl(l, t), Al(t), n & 512 && ($t || e === null || re(e, e.return)), e !== null && n & 4 && Tf(t, t.memoizedProps, e.memoizedProps);
          break;
        case 5:
          if (Tl(l, t), Al(t), n & 512 && ($t || e === null || re(e, e.return)), t.flags & 32) {
            a = t.stateNode;
            try {
              Ta(a, "");
            } catch (T) {
              vt(t, t.return, T);
            }
          }
          n & 4 && t.stateNode != null && (a = t.memoizedProps, Tf(t, a, e !== null ? e.memoizedProps : a)), n & 1024 && (zf = true);
          break;
        case 6:
          if (Tl(l, t), Al(t), n & 4) {
            if (t.stateNode === null) throw Error(z(162));
            n = t.memoizedProps, e = t.stateNode;
            try {
              e.nodeValue = n;
            } catch (T) {
              vt(t, t.return, T);
            }
          }
          break;
        case 3:
          if (Di = null, a = ue, ue = ec(l.containerInfo), Tl(l, t), ue = a, Al(t), n & 4 && e !== null && e.memoizedState.isDehydrated) try {
            Ua(l.containerInfo);
          } catch (T) {
            vt(t, t.return, T);
          }
          zf && (zf = false, th(t));
          break;
        case 4:
          n = ue, ue = ec(t.stateNode.containerInfo), Tl(l, t), Al(t), ue = n;
          break;
        case 12:
          Tl(l, t), Al(t);
          break;
        case 31:
          Tl(l, t), Al(t), n & 4 && (n = t.updateQueue, n !== null && (t.updateQueue = null, ri(t, n)));
          break;
        case 13:
          Tl(l, t), Al(t), t.child.flags & 8192 && t.memoizedState !== null != (e !== null && e.memoizedState !== null) && (vc = Yl()), n & 4 && (n = t.updateQueue, n !== null && (t.updateQueue = null, ri(t, n)));
          break;
        case 22:
          a = t.memoizedState !== null;
          var f = e !== null && e.memoizedState !== null, r = ze, y = $t;
          if (ze = r || a, $t = y || f, Tl(l, t), $t = y, ze = r, Al(t), n & 8192) t: for (l = t.stateNode, l._visibility = a ? l._visibility & -2 : l._visibility | 1, a && (e === null || f || ze || $t || On(t)), e = null, l = t; ; ) {
            if (l.tag === 5 || l.tag === 26) {
              if (e === null) {
                f = e = l;
                try {
                  if (u = f.stateNode, a) i = u.style, typeof i.setProperty == "function" ? i.setProperty("display", "none", "important") : i.display = "none";
                  else {
                    c = f.stateNode;
                    var b = f.memoizedProps.style, m = b != null && b.hasOwnProperty("display") ? b.display : null;
                    c.style.display = m == null || typeof m == "boolean" ? "" : ("" + m).trim();
                  }
                } catch (T) {
                  vt(f, f.return, T);
                }
              }
            } else if (l.tag === 6) {
              if (e === null) {
                f = l;
                try {
                  f.stateNode.nodeValue = a ? "" : f.memoizedProps;
                } catch (T) {
                  vt(f, f.return, T);
                }
              }
            } else if (l.tag === 18) {
              if (e === null) {
                f = l;
                try {
                  var h = f.stateNode;
                  a ? Qd(h, true) : Qd(f.stateNode, false);
                } catch (T) {
                  vt(f, f.return, T);
                }
              }
            } else if ((l.tag !== 22 && l.tag !== 23 || l.memoizedState === null || l === t) && l.child !== null) {
              l.child.return = l, l = l.child;
              continue;
            }
            if (l === t) break t;
            for (; l.sibling === null; ) {
              if (l.return === null || l.return === t) break t;
              e === l && (e = null), l = l.return;
            }
            e === l && (e = null), l.sibling.return = l.return, l = l.sibling;
          }
          n & 4 && (n = t.updateQueue, n !== null && (e = n.retryQueue, e !== null && (n.retryQueue = null, ri(t, e))));
          break;
        case 19:
          Tl(l, t), Al(t), n & 4 && (n = t.updateQueue, n !== null && (t.updateQueue = null, ri(t, n)));
          break;
        case 30:
          break;
        case 21:
          break;
        default:
          Tl(l, t), Al(t);
      }
    }
    function Al(t) {
      var l = t.flags;
      if (l & 2) {
        try {
          for (var e, n = t.return; n !== null; ) {
            if (J0(n)) {
              e = n;
              break;
            }
            n = n.return;
          }
          if (e == null) throw Error(z(160));
          switch (e.tag) {
            case 27:
              var a = e.stateNode, u = Af(t);
              Wi(t, u, a);
              break;
            case 5:
              var i = e.stateNode;
              e.flags & 32 && (Ta(i, ""), e.flags &= -33);
              var c = Af(t);
              Wi(t, c, i);
              break;
            case 3:
            case 4:
              var f = e.stateNode.containerInfo, r = Af(t);
              ds(t, r, f);
              break;
            default:
              throw Error(z(161));
          }
        } catch (y) {
          vt(t, t.return, y);
        }
        t.flags &= -3;
      }
      l & 4096 && (t.flags &= -4097);
    }
    function th(t) {
      if (t.subtreeFlags & 1024) for (t = t.child; t !== null; ) {
        var l = t;
        th(l), l.tag === 5 && l.flags & 1024 && l.stateNode.reset(), t = t.sibling;
      }
    }
    function Ee(t, l) {
      if (l.subtreeFlags & 8772) for (l = l.child; l !== null; ) W0(t, l.alternate, l), l = l.sibling;
    }
    function On(t) {
      for (t = t.child; t !== null; ) {
        var l = t;
        switch (l.tag) {
          case 0:
          case 11:
          case 14:
          case 15:
            pn(4, l, l.return), On(l);
            break;
          case 1:
            re(l, l.return);
            var e = l.stateNode;
            typeof e.componentWillUnmount == "function" && V0(l, l.return, e), On(l);
            break;
          case 27:
            gu(l.stateNode);
          case 26:
          case 5:
            re(l, l.return), On(l);
            break;
          case 22:
            l.memoizedState === null && On(l);
            break;
          case 30:
            On(l);
            break;
          default:
            On(l);
        }
        t = t.sibling;
      }
    }
    function Te(t, l, e) {
      for (e = e && (l.subtreeFlags & 8772) !== 0, l = l.child; l !== null; ) {
        var n = l.alternate, a = t, u = l, i = u.flags;
        switch (u.tag) {
          case 0:
          case 11:
          case 15:
            Te(a, u, e), Gu(4, u);
            break;
          case 1:
            if (Te(a, u, e), n = u, a = n.stateNode, typeof a.componentDidMount == "function") try {
              a.componentDidMount();
            } catch (r) {
              vt(n, n.return, r);
            }
            if (n = u, a = n.updateQueue, a !== null) {
              var c = n.stateNode;
              try {
                var f = a.shared.hiddenCallbacks;
                if (f !== null) for (a.shared.hiddenCallbacks = null, a = 0; a < f.length; a++) Im(f[a], c);
              } catch (r) {
                vt(n, n.return, r);
              }
            }
            e && i & 64 && Z0(u), mu(u, u.return);
            break;
          case 27:
            k0(u);
          case 26:
          case 5:
            Te(a, u, e), e && n === null && i & 4 && K0(u), mu(u, u.return);
            break;
          case 12:
            Te(a, u, e);
            break;
          case 31:
            Te(a, u, e), e && i & 4 && I0(a, u);
            break;
          case 13:
            Te(a, u, e), e && i & 4 && P0(a, u);
            break;
          case 22:
            u.memoizedState === null && Te(a, u, e), mu(u, u.return);
            break;
          case 30:
            break;
          default:
            Te(a, u, e);
        }
        l = l.sibling;
      }
    }
    function ro(t, l) {
      var e = null;
      t !== null && t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), t = null, l.memoizedState !== null && l.memoizedState.cachePool !== null && (t = l.memoizedState.cachePool.pool), t !== e && (t != null && t.refCount++, e != null && wu(e));
    }
    function mo(t, l) {
      t = null, l.alternate !== null && (t = l.alternate.memoizedState.cache), l = l.memoizedState.cache, l !== t && (l.refCount++, t != null && wu(t));
    }
    function ae(t, l, e, n) {
      if (l.subtreeFlags & 10256) for (l = l.child; l !== null; ) lh(t, l, e, n), l = l.sibling;
    }
    function lh(t, l, e, n) {
      var a = l.flags;
      switch (l.tag) {
        case 0:
        case 11:
        case 15:
          ae(t, l, e, n), a & 2048 && Gu(9, l);
          break;
        case 1:
          ae(t, l, e, n);
          break;
        case 3:
          ae(t, l, e, n), a & 2048 && (t = null, l.alternate !== null && (t = l.alternate.memoizedState.cache), l = l.memoizedState.cache, l !== t && (l.refCount++, t != null && wu(t)));
          break;
        case 12:
          if (a & 2048) {
            ae(t, l, e, n), t = l.stateNode;
            try {
              var u = l.memoizedProps, i = u.id, c = u.onPostCommit;
              typeof c == "function" && c(i, l.alternate === null ? "mount" : "update", t.passiveEffectDuration, -0);
            } catch (f) {
              vt(l, l.return, f);
            }
          } else ae(t, l, e, n);
          break;
        case 31:
          ae(t, l, e, n);
          break;
        case 13:
          ae(t, l, e, n);
          break;
        case 23:
          break;
        case 22:
          u = l.stateNode, i = l.alternate, l.memoizedState !== null ? u._visibility & 2 ? ae(t, l, e, n) : hu(t, l) : u._visibility & 2 ? ae(t, l, e, n) : (u._visibility |= 2, ta(t, l, e, n, (l.subtreeFlags & 10256) !== 0 || false)), a & 2048 && ro(i, l);
          break;
        case 24:
          ae(t, l, e, n), a & 2048 && mo(l.alternate, l);
          break;
        default:
          ae(t, l, e, n);
      }
    }
    function ta(t, l, e, n, a) {
      for (a = a && ((l.subtreeFlags & 10256) !== 0 || false), l = l.child; l !== null; ) {
        var u = t, i = l, c = e, f = n, r = i.flags;
        switch (i.tag) {
          case 0:
          case 11:
          case 15:
            ta(u, i, c, f, a), Gu(8, i);
            break;
          case 23:
            break;
          case 22:
            var y = i.stateNode;
            i.memoizedState !== null ? y._visibility & 2 ? ta(u, i, c, f, a) : hu(u, i) : (y._visibility |= 2, ta(u, i, c, f, a)), a && r & 2048 && ro(i.alternate, i);
            break;
          case 24:
            ta(u, i, c, f, a), a && r & 2048 && mo(i.alternate, i);
            break;
          default:
            ta(u, i, c, f, a);
        }
        l = l.sibling;
      }
    }
    function hu(t, l) {
      if (l.subtreeFlags & 10256) for (l = l.child; l !== null; ) {
        var e = t, n = l, a = n.flags;
        switch (n.tag) {
          case 22:
            hu(e, n), a & 2048 && ro(n.alternate, n);
            break;
          case 24:
            hu(e, n), a & 2048 && mo(n.alternate, n);
            break;
          default:
            hu(e, n);
        }
        l = l.sibling;
      }
    }
    var au = 8192;
    function Rn(t, l, e) {
      if (t.subtreeFlags & au) for (t = t.child; t !== null; ) eh(t, l, e), t = t.sibling;
    }
    function eh(t, l, e) {
      switch (t.tag) {
        case 26:
          Rn(t, l, e), t.flags & au && t.memoizedState !== null && Fg(e, ue, t.memoizedState, t.memoizedProps);
          break;
        case 5:
          Rn(t, l, e);
          break;
        case 3:
        case 4:
          var n = ue;
          ue = ec(t.stateNode.containerInfo), Rn(t, l, e), ue = n;
          break;
        case 22:
          t.memoizedState === null && (n = t.alternate, n !== null && n.memoizedState !== null ? (n = au, au = 16777216, Rn(t, l, e), au = n) : Rn(t, l, e));
          break;
        default:
          Rn(t, l, e);
      }
    }
    function nh(t) {
      var l = t.alternate;
      if (l !== null && (t = l.child, t !== null)) {
        l.child = null;
        do
          l = t.sibling, t.sibling = null, t = l;
        while (t !== null);
      }
    }
    function Ia(t) {
      var l = t.deletions;
      if ((t.flags & 16) !== 0) {
        if (l !== null) for (var e = 0; e < l.length; e++) {
          var n = l[e];
          ll = n, uh(n, t);
        }
        nh(t);
      }
      if (t.subtreeFlags & 10256) for (t = t.child; t !== null; ) ah(t), t = t.sibling;
    }
    function ah(t) {
      switch (t.tag) {
        case 0:
        case 11:
        case 15:
          Ia(t), t.flags & 2048 && pn(9, t, t.return);
          break;
        case 3:
          Ia(t);
          break;
        case 12:
          Ia(t);
          break;
        case 22:
          var l = t.stateNode;
          t.memoizedState !== null && l._visibility & 2 && (t.return === null || t.return.tag !== 13) ? (l._visibility &= -3, Ci(t)) : Ia(t);
          break;
        default:
          Ia(t);
      }
    }
    function Ci(t) {
      var l = t.deletions;
      if ((t.flags & 16) !== 0) {
        if (l !== null) for (var e = 0; e < l.length; e++) {
          var n = l[e];
          ll = n, uh(n, t);
        }
        nh(t);
      }
      for (t = t.child; t !== null; ) {
        switch (l = t, l.tag) {
          case 0:
          case 11:
          case 15:
            pn(8, l, l.return), Ci(l);
            break;
          case 22:
            e = l.stateNode, e._visibility & 2 && (e._visibility &= -3, Ci(l));
            break;
          default:
            Ci(l);
        }
        t = t.sibling;
      }
    }
    function uh(t, l) {
      for (; ll !== null; ) {
        var e = ll;
        switch (e.tag) {
          case 0:
          case 11:
          case 15:
            pn(8, e, l);
            break;
          case 23:
          case 22:
            if (e.memoizedState !== null && e.memoizedState.cachePool !== null) {
              var n = e.memoizedState.cachePool.pool;
              n != null && n.refCount++;
            }
            break;
          case 24:
            wu(e.memoizedState.cache);
        }
        if (n = e.child, n !== null) n.return = e, ll = n;
        else t: for (e = t; ll !== null; ) {
          n = ll;
          var a = n.sibling, u = n.return;
          if (F0(n), n === e) {
            ll = null;
            break t;
          }
          if (a !== null) {
            a.return = u, ll = a;
            break t;
          }
          ll = u;
        }
      }
    }
    var dg = { getCacheForType: function(t) {
      var l = fl(It), e = l.data.get(t);
      return e === void 0 && (e = t(), l.data.set(t, e)), e;
    }, cacheSignal: function() {
      return fl(It).controller.signal;
    } }, mg = typeof WeakMap == "function" ? WeakMap : Map, mt = 0, Nt = null, ct = null, ft = 0, gt = 0, Hl = null, tn = false, Ya = false, ho = false, Ye = 0, Gt = 0, yn = 0, Un = 0, po = 0, ql = 0, Ca = 0, pu = null, Ol = null, ms = false, vc = 0, ih = 0, Fi = 1 / 0, $i = null, fn = null, Rt = 0, sn = null, Ma = null, Ue = 0, hs = 0, ps = null, ch = null, yu = 0, ys = null;
    function jl() {
      return (mt & 2) !== 0 && ft !== 0 ? ft & -ft : $.T !== null ? go() : ym();
    }
    function fh() {
      if (ql === 0) if ((ft & 536870912) === 0 || st) {
        var t = li;
        li <<= 1, (li & 3932160) === 0 && (li = 262144), ql = t;
      } else ql = 536870912;
      return t = Xl.current, t !== null && (t.flags |= 32), ql;
    }
    function Cl(t, l, e) {
      (t === Nt && (gt === 2 || gt === 9) || t.cancelPendingCommit !== null) && (Da(t, 0), ln(t, ft, ql, false)), qu(t, e), ((mt & 2) === 0 || t !== Nt) && (t === Nt && ((mt & 2) === 0 && (Un |= e), Gt === 4 && ln(t, ft, ql, false)), he(t));
    }
    function sh(t, l, e) {
      if ((mt & 6) !== 0) throw Error(z(327));
      var n = !e && (l & 127) === 0 && (l & t.expiredLanes) === 0 || Bu(t, l), a = n ? yg(t, l) : Of(t, l, true), u = n;
      do {
        if (a === 0) {
          Ya && !n && ln(t, l, 0, false);
          break;
        } else {
          if (e = t.current.alternate, u && !hg(e)) {
            a = Of(t, l, false), u = false;
            continue;
          }
          if (a === 2) {
            if (u = l, t.errorRecoveryDisabledLanes & u) var i = 0;
            else i = t.pendingLanes & -536870913, i = i !== 0 ? i : i & 536870912 ? 536870912 : 0;
            if (i !== 0) {
              l = i;
              t: {
                var c = t;
                a = pu;
                var f = c.current.memoizedState.isDehydrated;
                if (f && (Da(c, i).flags |= 256), i = Of(c, i, false), i !== 2) {
                  if (ho && !f) {
                    c.errorRecoveryDisabledLanes |= u, Un |= u, a = 4;
                    break t;
                  }
                  u = Ol, Ol = a, u !== null && (Ol === null ? Ol = u : Ol.push.apply(Ol, u));
                }
                a = i;
              }
              if (u = false, a !== 2) continue;
            }
          }
          if (a === 1) {
            Da(t, 0), ln(t, l, 0, true);
            break;
          }
          t: {
            switch (n = t, u = a, u) {
              case 0:
              case 1:
                throw Error(z(345));
              case 4:
                if ((l & 4194048) !== l) break;
              case 6:
                ln(n, l, ql, !tn);
                break t;
              case 2:
                Ol = null;
                break;
              case 3:
              case 5:
                break;
              default:
                throw Error(z(329));
            }
            if ((l & 62914560) === l && (a = vc + 300 - Yl(), 10 < a)) {
              if (ln(n, l, ql, !tn), cc(n, 0, true) !== 0) break t;
              Ue = l, n.timeoutHandle = Dh(Cd.bind(null, n, e, Ol, $i, ms, l, ql, Un, Ca, tn, u, "Throttled", -0, 0), a);
              break t;
            }
            Cd(n, e, Ol, $i, ms, l, ql, Un, Ca, tn, u, null, -0, 0);
          }
        }
        break;
      } while (true);
      he(t);
    }
    function Cd(t, l, e, n, a, u, i, c, f, r, y, b, m, h) {
      if (t.timeoutHandle = -1, b = l.subtreeFlags, b & 8192 || (b & 16785408) === 16785408) {
        b = { stylesheets: null, count: 0, imgCount: 0, imgBytes: 0, suspenseyImages: [], waitingForImages: true, waitingForViewTransition: false, unsuspend: Ce }, eh(l, u, b);
        var T = (u & 62914560) === u ? vc - Yl() : (u & 4194048) === u ? ih - Yl() : 0;
        if (T = $g(b, T), T !== null) {
          Ue = u, t.cancelPendingCommit = T(Dd.bind(null, t, l, u, e, n, a, i, c, f, y, b, null, m, h)), ln(t, u, i, !r);
          return;
        }
      }
      Dd(t, l, u, e, n, a, i, c, f);
    }
    function hg(t) {
      for (var l = t; ; ) {
        var e = l.tag;
        if ((e === 0 || e === 11 || e === 15) && l.flags & 16384 && (e = l.updateQueue, e !== null && (e = e.stores, e !== null))) for (var n = 0; n < e.length; n++) {
          var a = e[n], u = a.getSnapshot;
          a = a.value;
          try {
            if (!Gl(u(), a)) return false;
          } catch {
            return false;
          }
        }
        if (e = l.child, l.subtreeFlags & 16384 && e !== null) e.return = l, l = e;
        else {
          if (l === t) break;
          for (; l.sibling === null; ) {
            if (l.return === null || l.return === t) return true;
            l = l.return;
          }
          l.sibling.return = l.return, l = l.sibling;
        }
      }
      return true;
    }
    function ln(t, l, e, n) {
      l &= ~po, l &= ~Un, t.suspendedLanes |= l, t.pingedLanes &= ~l, n && (t.warmLanes |= l), n = t.expirationTimes;
      for (var a = l; 0 < a; ) {
        var u = 31 - wl(a), i = 1 << u;
        n[u] = -1, a &= ~i;
      }
      e !== 0 && mm(t, e, l);
    }
    function bc() {
      return (mt & 6) === 0 ? (Xu(0, false), false) : true;
    }
    function yo() {
      if (ct !== null) {
        if (gt === 0) var t = ct.return;
        else t = ct, Me = Xn = null, to(t), va = null, Au = 0, t = ct;
        for (; t !== null; ) Q0(t.alternate, t), t = t.return;
        ct = null;
      }
    }
    function Da(t, l) {
      var e = t.timeoutHandle;
      e !== -1 && (t.timeoutHandle = -1, Hg(e)), e = t.cancelPendingCommit, e !== null && (t.cancelPendingCommit = null, e()), Ue = 0, yo(), Nt = t, ct = e = De(t.current, null), ft = l, gt = 0, Hl = null, tn = false, Ya = Bu(t, l), ho = false, Ca = ql = po = Un = yn = Gt = 0, Ol = pu = null, ms = false, (l & 8) !== 0 && (l |= l & 32);
      var n = t.entangledLanes;
      if (n !== 0) for (t = t.entanglements, n &= l; 0 < n; ) {
        var a = 31 - wl(n), u = 1 << a;
        l |= t[a], n &= ~u;
      }
      return Ye = l, rc(), e;
    }
    function oh(t, l) {
      tt = null, $.H = Ou, l === qa || l === mc ? (l = ud(), gt = 3) : l === ks ? (l = ud(), gt = 4) : gt = l === so ? 8 : l !== null && typeof l == "object" && typeof l.then == "function" ? 6 : 1, Hl = l, ct === null && (Gt = 1, Ji(t, Fl(l, t.current)));
    }
    function rh() {
      var t = Xl.current;
      return t === null ? true : (ft & 4194048) === ft ? Il === null : (ft & 62914560) === ft || (ft & 536870912) !== 0 ? t === Il : false;
    }
    function dh() {
      var t = $.H;
      return $.H = Ou, t === null ? Ou : t;
    }
    function mh() {
      var t = $.A;
      return $.A = dg, t;
    }
    function Ii() {
      Gt = 4, tn || (ft & 4194048) !== ft && Xl.current !== null || (Ya = true), (yn & 134217727) === 0 && (Un & 134217727) === 0 || Nt === null || ln(Nt, ft, ql, false);
    }
    function Of(t, l, e) {
      var n = mt;
      mt |= 2;
      var a = dh(), u = mh();
      (Nt !== t || ft !== l) && ($i = null, Da(t, l)), l = false;
      var i = Gt;
      t: do
        try {
          if (gt !== 0 && ct !== null) {
            var c = ct, f = Hl;
            switch (gt) {
              case 8:
                yo(), i = 6;
                break t;
              case 3:
              case 2:
              case 9:
              case 6:
                Xl.current === null && (l = true);
                var r = gt;
                if (gt = 0, Hl = null, ma(t, c, f, r), e && Ya) {
                  i = 0;
                  break t;
                }
                break;
              default:
                r = gt, gt = 0, Hl = null, ma(t, c, f, r);
            }
          }
          pg(), i = Gt;
          break;
        } catch (y) {
          oh(t, y);
        }
      while (true);
      return l && t.shellSuspendCounter++, Me = Xn = null, mt = n, $.H = a, $.A = u, ct === null && (Nt = null, ft = 0, rc()), i;
    }
    function pg() {
      for (; ct !== null; ) hh(ct);
    }
    function yg(t, l) {
      var e = mt;
      mt |= 2;
      var n = dh(), a = mh();
      Nt !== t || ft !== l ? ($i = null, Fi = Yl() + 500, Da(t, l)) : Ya = Bu(t, l);
      t: do
        try {
          if (gt !== 0 && ct !== null) {
            l = ct;
            var u = Hl;
            l: switch (gt) {
              case 1:
                gt = 0, Hl = null, ma(t, l, u, 1);
                break;
              case 2:
              case 9:
                if (ad(u)) {
                  gt = 0, Hl = null, Md(l);
                  break;
                }
                l = function() {
                  gt !== 2 && gt !== 9 || Nt !== t || (gt = 7), he(t);
                }, u.then(l, l);
                break t;
              case 3:
                gt = 7;
                break t;
              case 4:
                gt = 5;
                break t;
              case 7:
                ad(u) ? (gt = 0, Hl = null, Md(l)) : (gt = 0, Hl = null, ma(t, l, u, 7));
                break;
              case 5:
                var i = null;
                switch (ct.tag) {
                  case 26:
                    i = ct.memoizedState;
                  case 5:
                  case 27:
                    var c = ct;
                    if (i ? Bh(i) : c.stateNode.complete) {
                      gt = 0, Hl = null;
                      var f = c.sibling;
                      if (f !== null) ct = f;
                      else {
                        var r = c.return;
                        r !== null ? (ct = r, Sc(r)) : ct = null;
                      }
                      break l;
                    }
                }
                gt = 0, Hl = null, ma(t, l, u, 5);
                break;
              case 6:
                gt = 0, Hl = null, ma(t, l, u, 6);
                break;
              case 8:
                yo(), Gt = 6;
                break t;
              default:
                throw Error(z(462));
            }
          }
          gg();
          break;
        } catch (y) {
          oh(t, y);
        }
      while (true);
      return Me = Xn = null, $.H = n, $.A = a, mt = e, ct !== null ? 0 : (Nt = null, ft = 0, rc(), Gt);
    }
    function gg() {
      for (; ct !== null && !Gp(); ) hh(ct);
    }
    function hh(t) {
      var l = X0(t.alternate, t, Ye);
      t.memoizedProps = t.pendingProps, l === null ? Sc(t) : ct = l;
    }
    function Md(t) {
      var l = t, e = l.alternate;
      switch (l.tag) {
        case 15:
        case 0:
          l = Nd(e, l, l.pendingProps, l.type, void 0, ft);
          break;
        case 11:
          l = Nd(e, l, l.pendingProps, l.type.render, l.ref, ft);
          break;
        case 5:
          to(l);
        default:
          Q0(e, l), l = ct = Qm(l, Ye), l = X0(e, l, Ye);
      }
      t.memoizedProps = t.pendingProps, l === null ? Sc(t) : ct = l;
    }
    function ma(t, l, e, n) {
      Me = Xn = null, to(l), va = null, Au = 0;
      var a = l.return;
      try {
        if (ug(t, a, l, e, ft)) {
          Gt = 1, Ji(t, Fl(e, t.current)), ct = null;
          return;
        }
      } catch (u) {
        if (a !== null) throw ct = a, u;
        Gt = 1, Ji(t, Fl(e, t.current)), ct = null;
        return;
      }
      l.flags & 32768 ? (st || n === 1 ? t = true : Ya || (ft & 536870912) !== 0 ? t = false : (tn = t = true, (n === 2 || n === 9 || n === 3 || n === 6) && (n = Xl.current, n !== null && n.tag === 13 && (n.flags |= 16384))), ph(l, t)) : Sc(l);
    }
    function Sc(t) {
      var l = t;
      do {
        if ((l.flags & 32768) !== 0) {
          ph(l, tn);
          return;
        }
        t = l.return;
        var e = fg(l.alternate, l, Ye);
        if (e !== null) {
          ct = e;
          return;
        }
        if (l = l.sibling, l !== null) {
          ct = l;
          return;
        }
        ct = l = t;
      } while (l !== null);
      Gt === 0 && (Gt = 5);
    }
    function ph(t, l) {
      do {
        var e = sg(t.alternate, t);
        if (e !== null) {
          e.flags &= 32767, ct = e;
          return;
        }
        if (e = t.return, e !== null && (e.flags |= 32768, e.subtreeFlags = 0, e.deletions = null), !l && (t = t.sibling, t !== null)) {
          ct = t;
          return;
        }
        ct = t = e;
      } while (t !== null);
      Gt = 6, ct = null;
    }
    function Dd(t, l, e, n, a, u, i, c, f) {
      t.cancelPendingCommit = null;
      do
        Nc();
      while (Rt !== 0);
      if ((mt & 6) !== 0) throw Error(z(327));
      if (l !== null) {
        if (l === t.current) throw Error(z(177));
        if (u = l.lanes | l.childLanes, u |= Gs, $p(t, e, u, i, c, f), t === Nt && (ct = Nt = null, ft = 0), Ma = l, sn = t, Ue = e, hs = u, ps = a, ch = n, (l.subtreeFlags & 10256) !== 0 || (l.flags & 10256) !== 0 ? (t.callbackNode = null, t.callbackPriority = 0, Ng(qi, function() {
          return Sh(), null;
        })) : (t.callbackNode = null, t.callbackPriority = 0), n = (l.flags & 13878) !== 0, (l.subtreeFlags & 13878) !== 0 || n) {
          n = $.T, $.T = null, a = ht.p, ht.p = 2, i = mt, mt |= 4;
          try {
            og(t, l, e);
          } finally {
            mt = i, ht.p = a, $.T = n;
          }
        }
        Rt = 1, yh(), gh(), vh();
      }
    }
    function yh() {
      if (Rt === 1) {
        Rt = 0;
        var t = sn, l = Ma, e = (l.flags & 13878) !== 0;
        if ((l.subtreeFlags & 13878) !== 0 || e) {
          e = $.T, $.T = null;
          var n = ht.p;
          ht.p = 2;
          var a = mt;
          mt |= 4;
          try {
            R0(l, t);
            var u = Ss, i = Bm(t.containerInfo), c = u.focusedElem, f = u.selectionRange;
            if (i !== c && c && c.ownerDocument && xm(c.ownerDocument.documentElement, c)) {
              if (f !== null && js(c)) {
                var r = f.start, y = f.end;
                if (y === void 0 && (y = r), "selectionStart" in c) c.selectionStart = r, c.selectionEnd = Math.min(y, c.value.length);
                else {
                  var b = c.ownerDocument || document, m = b && b.defaultView || window;
                  if (m.getSelection) {
                    var h = m.getSelection(), T = c.textContent.length, M = Math.min(f.start, T), _ = f.end === void 0 ? M : Math.min(f.end, T);
                    !h.extend && M > _ && (i = _, _ = M, M = i);
                    var s = Ir(c, M), o = Ir(c, _);
                    if (s && o && (h.rangeCount !== 1 || h.anchorNode !== s.node || h.anchorOffset !== s.offset || h.focusNode !== o.node || h.focusOffset !== o.offset)) {
                      var p = b.createRange();
                      p.setStart(s.node, s.offset), h.removeAllRanges(), M > _ ? (h.addRange(p), h.extend(o.node, o.offset)) : (p.setEnd(o.node, o.offset), h.addRange(p));
                    }
                  }
                }
              }
              for (b = [], h = c; h = h.parentNode; ) h.nodeType === 1 && b.push({ element: h, left: h.scrollLeft, top: h.scrollTop });
              for (typeof c.focus == "function" && c.focus(), c = 0; c < b.length; c++) {
                var N = b[c];
                N.element.scrollLeft = N.left, N.element.scrollTop = N.top;
              }
            }
            uc = !!bs, Ss = bs = null;
          } finally {
            mt = a, ht.p = n, $.T = e;
          }
        }
        t.current = l, Rt = 2;
      }
    }
    function gh() {
      if (Rt === 2) {
        Rt = 0;
        var t = sn, l = Ma, e = (l.flags & 8772) !== 0;
        if ((l.subtreeFlags & 8772) !== 0 || e) {
          e = $.T, $.T = null;
          var n = ht.p;
          ht.p = 2;
          var a = mt;
          mt |= 4;
          try {
            W0(t, l.alternate, l);
          } finally {
            mt = a, ht.p = n, $.T = e;
          }
        }
        Rt = 3;
      }
    }
    function vh() {
      if (Rt === 4 || Rt === 3) {
        Rt = 0, Xp();
        var t = sn, l = Ma, e = Ue, n = ch;
        (l.subtreeFlags & 10256) !== 0 || (l.flags & 10256) !== 0 ? Rt = 5 : (Rt = 0, Ma = sn = null, bh(t, t.pendingLanes));
        var a = t.pendingLanes;
        if (a === 0 && (fn = null), Hs(e), l = l.stateNode, Ll && typeof Ll.onCommitFiberRoot == "function") try {
          Ll.onCommitFiberRoot(xu, l, void 0, (l.current.flags & 128) === 128);
        } catch {
        }
        if (n !== null) {
          l = $.T, a = ht.p, ht.p = 2, $.T = null;
          try {
            for (var u = t.onRecoverableError, i = 0; i < n.length; i++) {
              var c = n[i];
              u(c.value, { componentStack: c.stack });
            }
          } finally {
            $.T = l, ht.p = a;
          }
        }
        (Ue & 3) !== 0 && Nc(), he(t), a = t.pendingLanes, (e & 261930) !== 0 && (a & 42) !== 0 ? t === ys ? yu++ : (yu = 0, ys = t) : yu = 0, Xu(0, false);
      }
    }
    function bh(t, l) {
      (t.pooledCacheLanes &= l) === 0 && (l = t.pooledCache, l != null && (t.pooledCache = null, wu(l)));
    }
    function Nc() {
      return yh(), gh(), vh(), Sh();
    }
    function Sh() {
      if (Rt !== 5) return false;
      var t = sn, l = hs;
      hs = 0;
      var e = Hs(Ue), n = $.T, a = ht.p;
      try {
        ht.p = 32 > e ? 32 : e, $.T = null, e = ps, ps = null;
        var u = sn, i = Ue;
        if (Rt = 0, Ma = sn = null, Ue = 0, (mt & 6) !== 0) throw Error(z(331));
        var c = mt;
        if (mt |= 4, ah(u.current), lh(u, u.current, i, e), mt = c, Xu(0, false), Ll && typeof Ll.onPostCommitFiberRoot == "function") try {
          Ll.onPostCommitFiberRoot(xu, u);
        } catch {
        }
        return true;
      } finally {
        ht.p = a, $.T = n, bh(t, l);
      }
    }
    function _d(t, l, e) {
      l = Fl(e, l), l = ss(t.stateNode, l, 2), t = cn(t, l, 2), t !== null && (qu(t, 2), he(t));
    }
    function vt(t, l, e) {
      if (t.tag === 3) _d(t, t, e);
      else for (; l !== null; ) {
        if (l.tag === 3) {
          _d(l, t, e);
          break;
        } else if (l.tag === 1) {
          var n = l.stateNode;
          if (typeof l.type.getDerivedStateFromError == "function" || typeof n.componentDidCatch == "function" && (fn === null || !fn.has(n))) {
            t = Fl(e, t), e = q0(2), n = cn(l, e, 2), n !== null && (Y0(e, n, l, t), qu(n, 2), he(n));
            break;
          }
        }
        l = l.return;
      }
    }
    function Cf(t, l, e) {
      var n = t.pingCache;
      if (n === null) {
        n = t.pingCache = new mg();
        var a = /* @__PURE__ */ new Set();
        n.set(l, a);
      } else a = n.get(l), a === void 0 && (a = /* @__PURE__ */ new Set(), n.set(l, a));
      a.has(e) || (ho = true, a.add(e), t = vg.bind(null, t, l, e), l.then(t, t));
    }
    function vg(t, l, e) {
      var n = t.pingCache;
      n !== null && n.delete(l), t.pingedLanes |= t.suspendedLanes & e, t.warmLanes &= ~e, Nt === t && (ft & e) === e && (Gt === 4 || Gt === 3 && (ft & 62914560) === ft && 300 > Yl() - vc ? (mt & 2) === 0 && Da(t, 0) : po |= e, Ca === ft && (Ca = 0)), he(t);
    }
    function Nh(t, l) {
      l === 0 && (l = dm()), t = Gn(t, l), t !== null && (qu(t, l), he(t));
    }
    function bg(t) {
      var l = t.memoizedState, e = 0;
      l !== null && (e = l.retryLane), Nh(t, e);
    }
    function Sg(t, l) {
      var e = 0;
      switch (t.tag) {
        case 31:
        case 13:
          var n = t.stateNode, a = t.memoizedState;
          a !== null && (e = a.retryLane);
          break;
        case 19:
          n = t.stateNode;
          break;
        case 22:
          n = t.stateNode._retryCache;
          break;
        default:
          throw Error(z(314));
      }
      n !== null && n.delete(l), Nh(t, e);
    }
    function Ng(t, l) {
      return _s(t, l);
    }
    var Pi = null, la = null, gs = false, Ri = false, Mf = false, en = 0;
    function he(t) {
      t !== la && t.next === null && (la === null ? Pi = la = t : la = la.next = t), Ri = true, gs || (gs = true, Tg());
    }
    function Xu(t, l) {
      if (!Mf && Ri) {
        Mf = true;
        do
          for (var e = false, n = Pi; n !== null; ) {
            if (!l) if (t !== 0) {
              var a = n.pendingLanes;
              if (a === 0) var u = 0;
              else {
                var i = n.suspendedLanes, c = n.pingedLanes;
                u = (1 << 31 - wl(42 | t) + 1) - 1, u &= a & ~(i & ~c), u = u & 201326741 ? u & 201326741 | 1 : u ? u | 2 : 0;
              }
              u !== 0 && (e = true, Ud(n, u));
            } else u = ft, u = cc(n, n === Nt ? u : 0, n.cancelPendingCommit !== null || n.timeoutHandle !== -1), (u & 3) === 0 || Bu(n, u) || (e = true, Ud(n, u));
            n = n.next;
          }
        while (e);
        Mf = false;
      }
    }
    function Eg() {
      Eh();
    }
    function Eh() {
      Ri = gs = false;
      var t = 0;
      en !== 0 && Ug() && (t = en);
      for (var l = Yl(), e = null, n = Pi; n !== null; ) {
        var a = n.next, u = Th(n, l);
        u === 0 ? (n.next = null, e === null ? Pi = a : e.next = a, a === null && (la = e)) : (e = n, (t !== 0 || (u & 3) !== 0) && (Ri = true)), n = a;
      }
      Rt !== 0 && Rt !== 5 || Xu(t, false), en !== 0 && (en = 0);
    }
    function Th(t, l) {
      for (var e = t.suspendedLanes, n = t.pingedLanes, a = t.expirationTimes, u = t.pendingLanes & -62914561; 0 < u; ) {
        var i = 31 - wl(u), c = 1 << i, f = a[i];
        f === -1 ? ((c & e) === 0 || (c & n) !== 0) && (a[i] = Fp(c, l)) : f <= l && (t.expiredLanes |= c), u &= ~c;
      }
      if (l = Nt, e = ft, e = cc(t, t === l ? e : 0, t.cancelPendingCommit !== null || t.timeoutHandle !== -1), n = t.callbackNode, e === 0 || t === l && (gt === 2 || gt === 9) || t.cancelPendingCommit !== null) return n !== null && n !== null && ef(n), t.callbackNode = null, t.callbackPriority = 0;
      if ((e & 3) === 0 || Bu(t, e)) {
        if (l = e & -e, l === t.callbackPriority) return l;
        switch (n !== null && ef(n), Hs(e)) {
          case 2:
          case 8:
            e = om;
            break;
          case 32:
            e = qi;
            break;
          case 268435456:
            e = rm;
            break;
          default:
            e = qi;
        }
        return n = Ah.bind(null, t), e = _s(e, n), t.callbackPriority = l, t.callbackNode = e, l;
      }
      return n !== null && n !== null && ef(n), t.callbackPriority = 2, t.callbackNode = null, 2;
    }
    function Ah(t, l) {
      if (Rt !== 0 && Rt !== 5) return t.callbackNode = null, t.callbackPriority = 0, null;
      var e = t.callbackNode;
      if (Nc() && t.callbackNode !== e) return null;
      var n = ft;
      return n = cc(t, t === Nt ? n : 0, t.cancelPendingCommit !== null || t.timeoutHandle !== -1), n === 0 ? null : (sh(t, n, l), Th(t, Yl()), t.callbackNode != null && t.callbackNode === e ? Ah.bind(null, t) : null);
    }
    function Ud(t, l) {
      if (Nc()) return null;
      sh(t, l, true);
    }
    function Tg() {
      xg(function() {
        (mt & 6) !== 0 ? _s(sm, Eg) : Eh();
      });
    }
    function go() {
      if (en === 0) {
        var t = Aa;
        t === 0 && (t = ti, ti <<= 1, (ti & 261888) === 0 && (ti = 256)), en = t;
      }
      return en;
    }
    function Hd(t) {
      return t == null || typeof t == "symbol" || typeof t == "boolean" ? null : typeof t == "function" ? t : vi("" + t);
    }
    function xd(t, l) {
      var e = l.ownerDocument.createElement("input");
      return e.name = l.name, e.value = l.value, t.id && e.setAttribute("form", t.id), l.parentNode.insertBefore(e, l), t = new FormData(t), e.parentNode.removeChild(e), t;
    }
    function Ag(t, l, e, n, a) {
      if (l === "submit" && e && e.stateNode === a) {
        var u = Hd((a[Ml] || null).action), i = n.submitter;
        i && (l = (l = i[Ml] || null) ? Hd(l.formAction) : i.getAttribute("formAction"), l !== null && (u = l, i = null));
        var c = new fc("action", "action", null, n, a);
        t.push({ event: c, listeners: [{ instance: null, listener: function() {
          if (n.defaultPrevented) {
            if (en !== 0) {
              var f = i ? xd(a, i) : new FormData(a);
              cs(e, { pending: true, data: f, method: a.method, action: u }, null, f);
            }
          } else typeof u == "function" && (c.preventDefault(), f = i ? xd(a, i) : new FormData(a), cs(e, { pending: true, data: f, method: a.method, action: u }, u, f));
        }, currentTarget: a }] });
      }
    }
    for (di = 0; di < Ff.length; di++) mi = Ff[di], Bd = mi.toLowerCase(), qd = mi[0].toUpperCase() + mi.slice(1), ie(Bd, "on" + qd);
    var mi, Bd, qd, di;
    ie(Ym, "onAnimationEnd");
    ie(Lm, "onAnimationIteration");
    ie(wm, "onAnimationStart");
    ie("dblclick", "onDoubleClick");
    ie("focusin", "onFocus");
    ie("focusout", "onBlur");
    ie(Qy, "onTransitionRun");
    ie(Zy, "onTransitionStart");
    ie(Vy, "onTransitionCancel");
    ie(jm, "onTransitionEnd");
    Ea("onMouseEnter", ["mouseout", "mouseover"]);
    Ea("onMouseLeave", ["mouseout", "mouseover"]);
    Ea("onPointerEnter", ["pointerout", "pointerover"]);
    Ea("onPointerLeave", ["pointerout", "pointerover"]);
    Ln("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
    Ln("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
    Ln("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
    Ln("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
    Ln("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
    Ln("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
    var Cu = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), zg = new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Cu));
    function zh(t, l) {
      l = (l & 4) !== 0;
      for (var e = 0; e < t.length; e++) {
        var n = t[e], a = n.event;
        n = n.listeners;
        t: {
          var u = void 0;
          if (l) for (var i = n.length - 1; 0 <= i; i--) {
            var c = n[i], f = c.instance, r = c.currentTarget;
            if (c = c.listener, f !== u && a.isPropagationStopped()) break t;
            u = c, a.currentTarget = r;
            try {
              u(a);
            } catch (y) {
              Li(y);
            }
            a.currentTarget = null, u = f;
          }
          else for (i = 0; i < n.length; i++) {
            if (c = n[i], f = c.instance, r = c.currentTarget, c = c.listener, f !== u && a.isPropagationStopped()) break t;
            u = c, a.currentTarget = r;
            try {
              u(a);
            } catch (y) {
              Li(y);
            }
            a.currentTarget = null, u = f;
          }
        }
      }
    }
    function it(t, l) {
      var e = l[Xf];
      e === void 0 && (e = l[Xf] = /* @__PURE__ */ new Set());
      var n = t + "__bubble";
      e.has(n) || (Oh(l, t, 2, false), e.add(n));
    }
    function Df(t, l, e) {
      var n = 0;
      l && (n |= 4), Oh(e, t, n, l);
    }
    var hi = "_reactListening" + Math.random().toString(36).slice(2);
    function vo(t) {
      if (!t[hi]) {
        t[hi] = true, gm.forEach(function(e) {
          e !== "selectionchange" && (zg.has(e) || Df(e, false, t), Df(e, true, t));
        });
        var l = t.nodeType === 9 ? t : t.ownerDocument;
        l === null || l[hi] || (l[hi] = true, Df("selectionchange", false, l));
      }
    }
    function Oh(t, l, e, n) {
      switch (jh(l)) {
        case 2:
          var a = Rg;
          break;
        case 8:
          a = tv;
          break;
        default:
          a = Eo;
      }
      e = a.bind(null, l, e, t), a = void 0, !Jf || l !== "touchstart" && l !== "touchmove" && l !== "wheel" || (a = true), n ? a !== void 0 ? t.addEventListener(l, e, { capture: true, passive: a }) : t.addEventListener(l, e, true) : a !== void 0 ? t.addEventListener(l, e, { passive: a }) : t.addEventListener(l, e, false);
    }
    function _f(t, l, e, n, a) {
      var u = n;
      if ((l & 1) === 0 && (l & 2) === 0 && n !== null) t: for (; ; ) {
        if (n === null) return;
        var i = n.tag;
        if (i === 3 || i === 4) {
          var c = n.stateNode.containerInfo;
          if (c === a) break;
          if (i === 4) for (i = n.return; i !== null; ) {
            var f = i.tag;
            if ((f === 3 || f === 4) && i.stateNode.containerInfo === a) return;
            i = i.return;
          }
          for (; c !== null; ) {
            if (i = aa(c), i === null) return;
            if (f = i.tag, f === 5 || f === 6 || f === 26 || f === 27) {
              n = u = i;
              continue t;
            }
            c = c.parentNode;
          }
        }
        n = n.return;
      }
      zm(function() {
        var r = u, y = qs(e), b = [];
        t: {
          var m = Gm.get(t);
          if (m !== void 0) {
            var h = fc, T = t;
            switch (t) {
              case "keypress":
                if (Si(e) === 0) break t;
              case "keydown":
              case "keyup":
                h = Sy;
                break;
              case "focusin":
                T = "focus", h = ff;
                break;
              case "focusout":
                T = "blur", h = ff;
                break;
              case "beforeblur":
              case "afterblur":
                h = ff;
                break;
              case "click":
                if (e.button === 2) break t;
              case "auxclick":
              case "dblclick":
              case "mousedown":
              case "mousemove":
              case "mouseup":
              case "mouseout":
              case "mouseover":
              case "contextmenu":
                h = Qr;
                break;
              case "drag":
              case "dragend":
              case "dragenter":
              case "dragexit":
              case "dragleave":
              case "dragover":
              case "dragstart":
              case "drop":
                h = fy;
                break;
              case "touchcancel":
              case "touchend":
              case "touchmove":
              case "touchstart":
                h = Ty;
                break;
              case Ym:
              case Lm:
              case wm:
                h = ry;
                break;
              case jm:
                h = zy;
                break;
              case "scroll":
              case "scrollend":
                h = iy;
                break;
              case "wheel":
                h = Cy;
                break;
              case "copy":
              case "cut":
              case "paste":
                h = my;
                break;
              case "gotpointercapture":
              case "lostpointercapture":
              case "pointercancel":
              case "pointerdown":
              case "pointermove":
              case "pointerout":
              case "pointerover":
              case "pointerup":
                h = Vr;
                break;
              case "toggle":
              case "beforetoggle":
                h = Dy;
            }
            var M = (l & 4) !== 0, _ = !M && (t === "scroll" || t === "scrollend"), s = M ? m !== null ? m + "Capture" : null : m;
            M = [];
            for (var o = r, p; o !== null; ) {
              var N = o;
              if (p = N.stateNode, N = N.tag, N !== 5 && N !== 26 && N !== 27 || p === null || s === null || (N = bu(o, s), N != null && M.push(Mu(o, N, p))), _) break;
              o = o.return;
            }
            0 < M.length && (m = new h(m, T, null, e, y), b.push({ event: m, listeners: M }));
          }
        }
        if ((l & 7) === 0) {
          t: {
            if (m = t === "mouseover" || t === "pointerover", h = t === "mouseout" || t === "pointerout", m && e !== Kf && (T = e.relatedTarget || e.fromElement) && (aa(T) || T[Ha])) break t;
            if ((h || m) && (m = y.window === y ? y : (m = y.ownerDocument) ? m.defaultView || m.parentWindow : window, h ? (T = e.relatedTarget || e.toElement, h = r, T = T ? aa(T) : null, T !== null && (_ = Hu(T), M = T.tag, T !== _ || M !== 5 && M !== 27 && M !== 6) && (T = null)) : (h = null, T = r), h !== T)) {
              if (M = Qr, N = "onMouseLeave", s = "onMouseEnter", o = "mouse", (t === "pointerout" || t === "pointerover") && (M = Vr, N = "onPointerLeave", s = "onPointerEnter", o = "pointer"), _ = h == null ? m : eu(h), p = T == null ? m : eu(T), m = new M(N, o + "leave", h, e, y), m.target = _, m.relatedTarget = p, N = null, aa(y) === r && (M = new M(s, o + "enter", T, e, y), M.target = p, M.relatedTarget = _, N = M), _ = N, h && T) l: {
                for (M = Og, s = h, o = T, p = 0, N = s; N; N = M(N)) p++;
                N = 0;
                for (var S = o; S; S = M(S)) N++;
                for (; 0 < p - N; ) s = M(s), p--;
                for (; 0 < N - p; ) o = M(o), N--;
                for (; p--; ) {
                  if (s === o || o !== null && s === o.alternate) {
                    M = s;
                    break l;
                  }
                  s = M(s), o = M(o);
                }
                M = null;
              }
              else M = null;
              h !== null && Yd(b, m, h, M, false), T !== null && _ !== null && Yd(b, _, T, M, true);
            }
          }
          t: {
            if (m = r ? eu(r) : window, h = m.nodeName && m.nodeName.toLowerCase(), h === "select" || h === "input" && m.type === "file") var Q = Wr;
            else if (kr(m)) if (Um) Q = jy;
            else {
              Q = Ly;
              var D = Yy;
            }
            else h = m.nodeName, !h || h.toLowerCase() !== "input" || m.type !== "checkbox" && m.type !== "radio" ? r && Bs(r.elementType) && (Q = Wr) : Q = wy;
            if (Q && (Q = Q(t, r))) {
              _m(b, Q, e, y);
              break t;
            }
            D && D(t, m, r), t === "focusout" && r && m.type === "number" && r.memoizedProps.value != null && Vf(m, "number", m.value);
          }
          switch (D = r ? eu(r) : window, t) {
            case "focusin":
              (kr(D) || D.contentEditable === "true") && (ca = D, kf = r, cu = null);
              break;
            case "focusout":
              cu = kf = ca = null;
              break;
            case "mousedown":
              Wf = true;
              break;
            case "contextmenu":
            case "mouseup":
            case "dragend":
              Wf = false, Pr(b, e, y);
              break;
            case "selectionchange":
              if (Xy) break;
            case "keydown":
            case "keyup":
              Pr(b, e, y);
          }
          var L;
          if (ws) t: {
            switch (t) {
              case "compositionstart":
                var j = "onCompositionStart";
                break t;
              case "compositionend":
                j = "onCompositionEnd";
                break t;
              case "compositionupdate":
                j = "onCompositionUpdate";
                break t;
            }
            j = void 0;
          }
          else ia ? Mm(t, e) && (j = "onCompositionEnd") : t === "keydown" && e.keyCode === 229 && (j = "onCompositionStart");
          j && (Cm && e.locale !== "ko" && (ia || j !== "onCompositionStart" ? j === "onCompositionEnd" && ia && (L = Om()) : (Re = y, Ys = "value" in Re ? Re.value : Re.textContent, ia = true)), D = tc(r, j), 0 < D.length && (j = new Zr(j, t, null, e, y), b.push({ event: j, listeners: D }), L ? j.data = L : (L = Dm(e), L !== null && (j.data = L)))), (L = Uy ? Hy(t, e) : xy(t, e)) && (j = tc(r, "onBeforeInput"), 0 < j.length && (D = new Zr("onBeforeInput", "beforeinput", null, e, y), b.push({ event: D, listeners: j }), D.data = L)), Ag(b, t, r, e, y);
        }
        zh(b, l);
      });
    }
    function Mu(t, l, e) {
      return { instance: t, listener: l, currentTarget: e };
    }
    function tc(t, l) {
      for (var e = l + "Capture", n = []; t !== null; ) {
        var a = t, u = a.stateNode;
        if (a = a.tag, a !== 5 && a !== 26 && a !== 27 || u === null || (a = bu(t, e), a != null && n.unshift(Mu(t, a, u)), a = bu(t, l), a != null && n.push(Mu(t, a, u))), t.tag === 3) return n;
        t = t.return;
      }
      return [];
    }
    function Og(t) {
      if (t === null) return null;
      do
        t = t.return;
      while (t && t.tag !== 5 && t.tag !== 27);
      return t || null;
    }
    function Yd(t, l, e, n, a) {
      for (var u = l._reactName, i = []; e !== null && e !== n; ) {
        var c = e, f = c.alternate, r = c.stateNode;
        if (c = c.tag, f !== null && f === n) break;
        c !== 5 && c !== 26 && c !== 27 || r === null || (f = r, a ? (r = bu(e, u), r != null && i.unshift(Mu(e, r, f))) : a || (r = bu(e, u), r != null && i.push(Mu(e, r, f)))), e = e.return;
      }
      i.length !== 0 && t.push({ event: l, listeners: i });
    }
    var Cg = /\r\n?/g, Mg = /\u0000|\uFFFD/g;
    function Ld(t) {
      return (typeof t == "string" ? t : "" + t).replace(Cg, `
`).replace(Mg, "");
    }
    function Ch(t, l) {
      return l = Ld(l), Ld(t) === l;
    }
    function bt(t, l, e, n, a, u) {
      switch (e) {
        case "children":
          typeof n == "string" ? l === "body" || l === "textarea" && n === "" || Ta(t, n) : (typeof n == "number" || typeof n == "bigint") && l !== "body" && Ta(t, "" + n);
          break;
        case "className":
          ni(t, "class", n);
          break;
        case "tabIndex":
          ni(t, "tabindex", n);
          break;
        case "dir":
        case "role":
        case "viewBox":
        case "width":
        case "height":
          ni(t, e, n);
          break;
        case "style":
          Am(t, n, u);
          break;
        case "data":
          if (l !== "object") {
            ni(t, "data", n);
            break;
          }
        case "src":
        case "href":
          if (n === "" && (l !== "a" || e !== "href")) {
            t.removeAttribute(e);
            break;
          }
          if (n == null || typeof n == "function" || typeof n == "symbol" || typeof n == "boolean") {
            t.removeAttribute(e);
            break;
          }
          n = vi("" + n), t.setAttribute(e, n);
          break;
        case "action":
        case "formAction":
          if (typeof n == "function") {
            t.setAttribute(e, "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");
            break;
          } else typeof u == "function" && (e === "formAction" ? (l !== "input" && bt(t, l, "name", a.name, a, null), bt(t, l, "formEncType", a.formEncType, a, null), bt(t, l, "formMethod", a.formMethod, a, null), bt(t, l, "formTarget", a.formTarget, a, null)) : (bt(t, l, "encType", a.encType, a, null), bt(t, l, "method", a.method, a, null), bt(t, l, "target", a.target, a, null)));
          if (n == null || typeof n == "symbol" || typeof n == "boolean") {
            t.removeAttribute(e);
            break;
          }
          n = vi("" + n), t.setAttribute(e, n);
          break;
        case "onClick":
          n != null && (t.onclick = Ce);
          break;
        case "onScroll":
          n != null && it("scroll", t);
          break;
        case "onScrollEnd":
          n != null && it("scrollend", t);
          break;
        case "dangerouslySetInnerHTML":
          if (n != null) {
            if (typeof n != "object" || !("__html" in n)) throw Error(z(61));
            if (e = n.__html, e != null) {
              if (a.children != null) throw Error(z(60));
              t.innerHTML = e;
            }
          }
          break;
        case "multiple":
          t.multiple = n && typeof n != "function" && typeof n != "symbol";
          break;
        case "muted":
          t.muted = n && typeof n != "function" && typeof n != "symbol";
          break;
        case "suppressContentEditableWarning":
        case "suppressHydrationWarning":
        case "defaultValue":
        case "defaultChecked":
        case "innerHTML":
        case "ref":
          break;
        case "autoFocus":
          break;
        case "xlinkHref":
          if (n == null || typeof n == "function" || typeof n == "boolean" || typeof n == "symbol") {
            t.removeAttribute("xlink:href");
            break;
          }
          e = vi("" + n), t.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", e);
          break;
        case "contentEditable":
        case "spellCheck":
        case "draggable":
        case "value":
        case "autoReverse":
        case "externalResourcesRequired":
        case "focusable":
        case "preserveAlpha":
          n != null && typeof n != "function" && typeof n != "symbol" ? t.setAttribute(e, "" + n) : t.removeAttribute(e);
          break;
        case "inert":
        case "allowFullScreen":
        case "async":
        case "autoPlay":
        case "controls":
        case "default":
        case "defer":
        case "disabled":
        case "disablePictureInPicture":
        case "disableRemotePlayback":
        case "formNoValidate":
        case "hidden":
        case "loop":
        case "noModule":
        case "noValidate":
        case "open":
        case "playsInline":
        case "readOnly":
        case "required":
        case "reversed":
        case "scoped":
        case "seamless":
        case "itemScope":
          n && typeof n != "function" && typeof n != "symbol" ? t.setAttribute(e, "") : t.removeAttribute(e);
          break;
        case "capture":
        case "download":
          n === true ? t.setAttribute(e, "") : n !== false && n != null && typeof n != "function" && typeof n != "symbol" ? t.setAttribute(e, n) : t.removeAttribute(e);
          break;
        case "cols":
        case "rows":
        case "size":
        case "span":
          n != null && typeof n != "function" && typeof n != "symbol" && !isNaN(n) && 1 <= n ? t.setAttribute(e, n) : t.removeAttribute(e);
          break;
        case "rowSpan":
        case "start":
          n == null || typeof n == "function" || typeof n == "symbol" || isNaN(n) ? t.removeAttribute(e) : t.setAttribute(e, n);
          break;
        case "popover":
          it("beforetoggle", t), it("toggle", t), gi(t, "popover", n);
          break;
        case "xlinkActuate":
          be(t, "http://www.w3.org/1999/xlink", "xlink:actuate", n);
          break;
        case "xlinkArcrole":
          be(t, "http://www.w3.org/1999/xlink", "xlink:arcrole", n);
          break;
        case "xlinkRole":
          be(t, "http://www.w3.org/1999/xlink", "xlink:role", n);
          break;
        case "xlinkShow":
          be(t, "http://www.w3.org/1999/xlink", "xlink:show", n);
          break;
        case "xlinkTitle":
          be(t, "http://www.w3.org/1999/xlink", "xlink:title", n);
          break;
        case "xlinkType":
          be(t, "http://www.w3.org/1999/xlink", "xlink:type", n);
          break;
        case "xmlBase":
          be(t, "http://www.w3.org/XML/1998/namespace", "xml:base", n);
          break;
        case "xmlLang":
          be(t, "http://www.w3.org/XML/1998/namespace", "xml:lang", n);
          break;
        case "xmlSpace":
          be(t, "http://www.w3.org/XML/1998/namespace", "xml:space", n);
          break;
        case "is":
          gi(t, "is", n);
          break;
        case "innerText":
        case "textContent":
          break;
        default:
          (!(2 < e.length) || e[0] !== "o" && e[0] !== "O" || e[1] !== "n" && e[1] !== "N") && (e = ay.get(e) || e, gi(t, e, n));
      }
    }
    function vs(t, l, e, n, a, u) {
      switch (e) {
        case "style":
          Am(t, n, u);
          break;
        case "dangerouslySetInnerHTML":
          if (n != null) {
            if (typeof n != "object" || !("__html" in n)) throw Error(z(61));
            if (e = n.__html, e != null) {
              if (a.children != null) throw Error(z(60));
              t.innerHTML = e;
            }
          }
          break;
        case "children":
          typeof n == "string" ? Ta(t, n) : (typeof n == "number" || typeof n == "bigint") && Ta(t, "" + n);
          break;
        case "onScroll":
          n != null && it("scroll", t);
          break;
        case "onScrollEnd":
          n != null && it("scrollend", t);
          break;
        case "onClick":
          n != null && (t.onclick = Ce);
          break;
        case "suppressContentEditableWarning":
        case "suppressHydrationWarning":
        case "innerHTML":
        case "ref":
          break;
        case "innerText":
        case "textContent":
          break;
        default:
          if (!vm.hasOwnProperty(e)) t: {
            if (e[0] === "o" && e[1] === "n" && (a = e.endsWith("Capture"), l = e.slice(2, a ? e.length - 7 : void 0), u = t[Ml] || null, u = u != null ? u[e] : null, typeof u == "function" && t.removeEventListener(l, u, a), typeof n == "function")) {
              typeof u != "function" && u !== null && (e in t ? t[e] = null : t.hasAttribute(e) && t.removeAttribute(e)), t.addEventListener(l, n, a);
              break t;
            }
            e in t ? t[e] = n : n === true ? t.setAttribute(e, "") : gi(t, e, n);
          }
      }
    }
    function sl(t, l, e) {
      switch (l) {
        case "div":
        case "span":
        case "svg":
        case "path":
        case "a":
        case "g":
        case "p":
        case "li":
          break;
        case "img":
          it("error", t), it("load", t);
          var n = false, a = false, u;
          for (u in e) if (e.hasOwnProperty(u)) {
            var i = e[u];
            if (i != null) switch (u) {
              case "src":
                n = true;
                break;
              case "srcSet":
                a = true;
                break;
              case "children":
              case "dangerouslySetInnerHTML":
                throw Error(z(137, l));
              default:
                bt(t, l, u, i, e, null);
            }
          }
          a && bt(t, l, "srcSet", e.srcSet, e, null), n && bt(t, l, "src", e.src, e, null);
          return;
        case "input":
          it("invalid", t);
          var c = u = i = a = null, f = null, r = null;
          for (n in e) if (e.hasOwnProperty(n)) {
            var y = e[n];
            if (y != null) switch (n) {
              case "name":
                a = y;
                break;
              case "type":
                i = y;
                break;
              case "checked":
                f = y;
                break;
              case "defaultChecked":
                r = y;
                break;
              case "value":
                u = y;
                break;
              case "defaultValue":
                c = y;
                break;
              case "children":
              case "dangerouslySetInnerHTML":
                if (y != null) throw Error(z(137, l));
                break;
              default:
                bt(t, l, n, y, e, null);
            }
          }
          Nm(t, u, c, f, r, i, a, false);
          return;
        case "select":
          it("invalid", t), n = i = u = null;
          for (a in e) if (e.hasOwnProperty(a) && (c = e[a], c != null)) switch (a) {
            case "value":
              u = c;
              break;
            case "defaultValue":
              i = c;
              break;
            case "multiple":
              n = c;
            default:
              bt(t, l, a, c, e, null);
          }
          l = u, e = i, t.multiple = !!n, l != null ? pa(t, !!n, l, false) : e != null && pa(t, !!n, e, true);
          return;
        case "textarea":
          it("invalid", t), u = a = n = null;
          for (i in e) if (e.hasOwnProperty(i) && (c = e[i], c != null)) switch (i) {
            case "value":
              n = c;
              break;
            case "defaultValue":
              a = c;
              break;
            case "children":
              u = c;
              break;
            case "dangerouslySetInnerHTML":
              if (c != null) throw Error(z(91));
              break;
            default:
              bt(t, l, i, c, e, null);
          }
          Tm(t, n, a, u);
          return;
        case "option":
          for (f in e) if (e.hasOwnProperty(f) && (n = e[f], n != null)) switch (f) {
            case "selected":
              t.selected = n && typeof n != "function" && typeof n != "symbol";
              break;
            default:
              bt(t, l, f, n, e, null);
          }
          return;
        case "dialog":
          it("beforetoggle", t), it("toggle", t), it("cancel", t), it("close", t);
          break;
        case "iframe":
        case "object":
          it("load", t);
          break;
        case "video":
        case "audio":
          for (n = 0; n < Cu.length; n++) it(Cu[n], t);
          break;
        case "image":
          it("error", t), it("load", t);
          break;
        case "details":
          it("toggle", t);
          break;
        case "embed":
        case "source":
        case "link":
          it("error", t), it("load", t);
        case "area":
        case "base":
        case "br":
        case "col":
        case "hr":
        case "keygen":
        case "meta":
        case "param":
        case "track":
        case "wbr":
        case "menuitem":
          for (r in e) if (e.hasOwnProperty(r) && (n = e[r], n != null)) switch (r) {
            case "children":
            case "dangerouslySetInnerHTML":
              throw Error(z(137, l));
            default:
              bt(t, l, r, n, e, null);
          }
          return;
        default:
          if (Bs(l)) {
            for (y in e) e.hasOwnProperty(y) && (n = e[y], n !== void 0 && vs(t, l, y, n, e, void 0));
            return;
          }
      }
      for (c in e) e.hasOwnProperty(c) && (n = e[c], n != null && bt(t, l, c, n, e, null));
    }
    function Dg(t, l, e, n) {
      switch (l) {
        case "div":
        case "span":
        case "svg":
        case "path":
        case "a":
        case "g":
        case "p":
        case "li":
          break;
        case "input":
          var a = null, u = null, i = null, c = null, f = null, r = null, y = null;
          for (h in e) {
            var b = e[h];
            if (e.hasOwnProperty(h) && b != null) switch (h) {
              case "checked":
                break;
              case "value":
                break;
              case "defaultValue":
                f = b;
              default:
                n.hasOwnProperty(h) || bt(t, l, h, null, n, b);
            }
          }
          for (var m in n) {
            var h = n[m];
            if (b = e[m], n.hasOwnProperty(m) && (h != null || b != null)) switch (m) {
              case "type":
                u = h;
                break;
              case "name":
                a = h;
                break;
              case "checked":
                r = h;
                break;
              case "defaultChecked":
                y = h;
                break;
              case "value":
                i = h;
                break;
              case "defaultValue":
                c = h;
                break;
              case "children":
              case "dangerouslySetInnerHTML":
                if (h != null) throw Error(z(137, l));
                break;
              default:
                h !== b && bt(t, l, m, h, n, b);
            }
          }
          Zf(t, i, c, f, r, y, u, a);
          return;
        case "select":
          h = i = c = m = null;
          for (u in e) if (f = e[u], e.hasOwnProperty(u) && f != null) switch (u) {
            case "value":
              break;
            case "multiple":
              h = f;
            default:
              n.hasOwnProperty(u) || bt(t, l, u, null, n, f);
          }
          for (a in n) if (u = n[a], f = e[a], n.hasOwnProperty(a) && (u != null || f != null)) switch (a) {
            case "value":
              m = u;
              break;
            case "defaultValue":
              c = u;
              break;
            case "multiple":
              i = u;
            default:
              u !== f && bt(t, l, a, u, n, f);
          }
          l = c, e = i, n = h, m != null ? pa(t, !!e, m, false) : !!n != !!e && (l != null ? pa(t, !!e, l, true) : pa(t, !!e, e ? [] : "", false));
          return;
        case "textarea":
          h = m = null;
          for (c in e) if (a = e[c], e.hasOwnProperty(c) && a != null && !n.hasOwnProperty(c)) switch (c) {
            case "value":
              break;
            case "children":
              break;
            default:
              bt(t, l, c, null, n, a);
          }
          for (i in n) if (a = n[i], u = e[i], n.hasOwnProperty(i) && (a != null || u != null)) switch (i) {
            case "value":
              m = a;
              break;
            case "defaultValue":
              h = a;
              break;
            case "children":
              break;
            case "dangerouslySetInnerHTML":
              if (a != null) throw Error(z(91));
              break;
            default:
              a !== u && bt(t, l, i, a, n, u);
          }
          Em(t, m, h);
          return;
        case "option":
          for (var T in e) if (m = e[T], e.hasOwnProperty(T) && m != null && !n.hasOwnProperty(T)) switch (T) {
            case "selected":
              t.selected = false;
              break;
            default:
              bt(t, l, T, null, n, m);
          }
          for (f in n) if (m = n[f], h = e[f], n.hasOwnProperty(f) && m !== h && (m != null || h != null)) switch (f) {
            case "selected":
              t.selected = m && typeof m != "function" && typeof m != "symbol";
              break;
            default:
              bt(t, l, f, m, n, h);
          }
          return;
        case "img":
        case "link":
        case "area":
        case "base":
        case "br":
        case "col":
        case "embed":
        case "hr":
        case "keygen":
        case "meta":
        case "param":
        case "source":
        case "track":
        case "wbr":
        case "menuitem":
          for (var M in e) m = e[M], e.hasOwnProperty(M) && m != null && !n.hasOwnProperty(M) && bt(t, l, M, null, n, m);
          for (r in n) if (m = n[r], h = e[r], n.hasOwnProperty(r) && m !== h && (m != null || h != null)) switch (r) {
            case "children":
            case "dangerouslySetInnerHTML":
              if (m != null) throw Error(z(137, l));
              break;
            default:
              bt(t, l, r, m, n, h);
          }
          return;
        default:
          if (Bs(l)) {
            for (var _ in e) m = e[_], e.hasOwnProperty(_) && m !== void 0 && !n.hasOwnProperty(_) && vs(t, l, _, void 0, n, m);
            for (y in n) m = n[y], h = e[y], !n.hasOwnProperty(y) || m === h || m === void 0 && h === void 0 || vs(t, l, y, m, n, h);
            return;
          }
      }
      for (var s in e) m = e[s], e.hasOwnProperty(s) && m != null && !n.hasOwnProperty(s) && bt(t, l, s, null, n, m);
      for (b in n) m = n[b], h = e[b], !n.hasOwnProperty(b) || m === h || m == null && h == null || bt(t, l, b, m, n, h);
    }
    function wd(t) {
      switch (t) {
        case "css":
        case "script":
        case "font":
        case "img":
        case "image":
        case "input":
        case "link":
          return true;
        default:
          return false;
      }
    }
    function _g() {
      if (typeof performance.getEntriesByType == "function") {
        for (var t = 0, l = 0, e = performance.getEntriesByType("resource"), n = 0; n < e.length; n++) {
          var a = e[n], u = a.transferSize, i = a.initiatorType, c = a.duration;
          if (u && c && wd(i)) {
            for (i = 0, c = a.responseEnd, n += 1; n < e.length; n++) {
              var f = e[n], r = f.startTime;
              if (r > c) break;
              var y = f.transferSize, b = f.initiatorType;
              y && wd(b) && (f = f.responseEnd, i += y * (f < c ? 1 : (c - r) / (f - r)));
            }
            if (--n, l += 8 * (u + i) / (a.duration / 1e3), t++, 10 < t) break;
          }
        }
        if (0 < t) return l / t / 1e6;
      }
      return navigator.connection && (t = navigator.connection.downlink, typeof t == "number") ? t : 5;
    }
    var bs = null, Ss = null;
    function lc(t) {
      return t.nodeType === 9 ? t : t.ownerDocument;
    }
    function jd(t) {
      switch (t) {
        case "http://www.w3.org/2000/svg":
          return 1;
        case "http://www.w3.org/1998/Math/MathML":
          return 2;
        default:
          return 0;
      }
    }
    function Mh(t, l) {
      if (t === 0) switch (l) {
        case "svg":
          return 1;
        case "math":
          return 2;
        default:
          return 0;
      }
      return t === 1 && l === "foreignObject" ? 0 : t;
    }
    function Ns(t, l) {
      return t === "textarea" || t === "noscript" || typeof l.children == "string" || typeof l.children == "number" || typeof l.children == "bigint" || typeof l.dangerouslySetInnerHTML == "object" && l.dangerouslySetInnerHTML !== null && l.dangerouslySetInnerHTML.__html != null;
    }
    var Uf = null;
    function Ug() {
      var t = window.event;
      return t && t.type === "popstate" ? t === Uf ? false : (Uf = t, true) : (Uf = null, false);
    }
    var Dh = typeof setTimeout == "function" ? setTimeout : void 0, Hg = typeof clearTimeout == "function" ? clearTimeout : void 0, Gd = typeof Promise == "function" ? Promise : void 0, xg = typeof queueMicrotask == "function" ? queueMicrotask : typeof Gd < "u" ? function(t) {
      return Gd.resolve(null).then(t).catch(Bg);
    } : Dh;
    function Bg(t) {
      setTimeout(function() {
        throw t;
      });
    }
    function vn(t) {
      return t === "head";
    }
    function Xd(t, l) {
      var e = l, n = 0;
      do {
        var a = e.nextSibling;
        if (t.removeChild(e), a && a.nodeType === 8) if (e = a.data, e === "/$" || e === "/&") {
          if (n === 0) {
            t.removeChild(a), Ua(l);
            return;
          }
          n--;
        } else if (e === "$" || e === "$?" || e === "$~" || e === "$!" || e === "&") n++;
        else if (e === "html") gu(t.ownerDocument.documentElement);
        else if (e === "head") {
          e = t.ownerDocument.head, gu(e);
          for (var u = e.firstChild; u; ) {
            var i = u.nextSibling, c = u.nodeName;
            u[Yu] || c === "SCRIPT" || c === "STYLE" || c === "LINK" && u.rel.toLowerCase() === "stylesheet" || e.removeChild(u), u = i;
          }
        } else e === "body" && gu(t.ownerDocument.body);
        e = a;
      } while (e);
      Ua(l);
    }
    function Qd(t, l) {
      var e = t;
      t = 0;
      do {
        var n = e.nextSibling;
        if (e.nodeType === 1 ? l ? (e._stashedDisplay = e.style.display, e.style.display = "none") : (e.style.display = e._stashedDisplay || "", e.getAttribute("style") === "" && e.removeAttribute("style")) : e.nodeType === 3 && (l ? (e._stashedText = e.nodeValue, e.nodeValue = "") : e.nodeValue = e._stashedText || ""), n && n.nodeType === 8) if (e = n.data, e === "/$") {
          if (t === 0) break;
          t--;
        } else e !== "$" && e !== "$?" && e !== "$~" && e !== "$!" || t++;
        e = n;
      } while (e);
    }
    function Es(t) {
      var l = t.firstChild;
      for (l && l.nodeType === 10 && (l = l.nextSibling); l; ) {
        var e = l;
        switch (l = l.nextSibling, e.nodeName) {
          case "HTML":
          case "HEAD":
          case "BODY":
            Es(e), xs(e);
            continue;
          case "SCRIPT":
          case "STYLE":
            continue;
          case "LINK":
            if (e.rel.toLowerCase() === "stylesheet") continue;
        }
        t.removeChild(e);
      }
    }
    function qg(t, l, e, n) {
      for (; t.nodeType === 1; ) {
        var a = e;
        if (t.nodeName.toLowerCase() !== l.toLowerCase()) {
          if (!n && (t.nodeName !== "INPUT" || t.type !== "hidden")) break;
        } else if (n) {
          if (!t[Yu]) switch (l) {
            case "meta":
              if (!t.hasAttribute("itemprop")) break;
              return t;
            case "link":
              if (u = t.getAttribute("rel"), u === "stylesheet" && t.hasAttribute("data-precedence")) break;
              if (u !== a.rel || t.getAttribute("href") !== (a.href == null || a.href === "" ? null : a.href) || t.getAttribute("crossorigin") !== (a.crossOrigin == null ? null : a.crossOrigin) || t.getAttribute("title") !== (a.title == null ? null : a.title)) break;
              return t;
            case "style":
              if (t.hasAttribute("data-precedence")) break;
              return t;
            case "script":
              if (u = t.getAttribute("src"), (u !== (a.src == null ? null : a.src) || t.getAttribute("type") !== (a.type == null ? null : a.type) || t.getAttribute("crossorigin") !== (a.crossOrigin == null ? null : a.crossOrigin)) && u && t.hasAttribute("async") && !t.hasAttribute("itemprop")) break;
              return t;
            default:
              return t;
          }
        } else if (l === "input" && t.type === "hidden") {
          var u = a.name == null ? null : "" + a.name;
          if (a.type === "hidden" && t.getAttribute("name") === u) return t;
        } else return t;
        if (t = Pl(t.nextSibling), t === null) break;
      }
      return null;
    }
    function Yg(t, l, e) {
      if (l === "") return null;
      for (; t.nodeType !== 3; ) if ((t.nodeType !== 1 || t.nodeName !== "INPUT" || t.type !== "hidden") && !e || (t = Pl(t.nextSibling), t === null)) return null;
      return t;
    }
    function _h(t, l) {
      for (; t.nodeType !== 8; ) if ((t.nodeType !== 1 || t.nodeName !== "INPUT" || t.type !== "hidden") && !l || (t = Pl(t.nextSibling), t === null)) return null;
      return t;
    }
    function Ts(t) {
      return t.data === "$?" || t.data === "$~";
    }
    function As(t) {
      return t.data === "$!" || t.data === "$?" && t.ownerDocument.readyState !== "loading";
    }
    function Lg(t, l) {
      var e = t.ownerDocument;
      if (t.data === "$~") t._reactRetry = l;
      else if (t.data !== "$?" || e.readyState !== "loading") l();
      else {
        var n = function() {
          l(), e.removeEventListener("DOMContentLoaded", n);
        };
        e.addEventListener("DOMContentLoaded", n), t._reactRetry = n;
      }
    }
    function Pl(t) {
      for (; t != null; t = t.nextSibling) {
        var l = t.nodeType;
        if (l === 1 || l === 3) break;
        if (l === 8) {
          if (l = t.data, l === "$" || l === "$!" || l === "$?" || l === "$~" || l === "&" || l === "F!" || l === "F") break;
          if (l === "/$" || l === "/&") return null;
        }
      }
      return t;
    }
    var zs = null;
    function Zd(t) {
      t = t.nextSibling;
      for (var l = 0; t; ) {
        if (t.nodeType === 8) {
          var e = t.data;
          if (e === "/$" || e === "/&") {
            if (l === 0) return Pl(t.nextSibling);
            l--;
          } else e !== "$" && e !== "$!" && e !== "$?" && e !== "$~" && e !== "&" || l++;
        }
        t = t.nextSibling;
      }
      return null;
    }
    function Vd(t) {
      t = t.previousSibling;
      for (var l = 0; t; ) {
        if (t.nodeType === 8) {
          var e = t.data;
          if (e === "$" || e === "$!" || e === "$?" || e === "$~" || e === "&") {
            if (l === 0) return t;
            l--;
          } else e !== "/$" && e !== "/&" || l++;
        }
        t = t.previousSibling;
      }
      return null;
    }
    function Uh(t, l, e) {
      switch (l = lc(e), t) {
        case "html":
          if (t = l.documentElement, !t) throw Error(z(452));
          return t;
        case "head":
          if (t = l.head, !t) throw Error(z(453));
          return t;
        case "body":
          if (t = l.body, !t) throw Error(z(454));
          return t;
        default:
          throw Error(z(451));
      }
    }
    function gu(t) {
      for (var l = t.attributes; l.length; ) t.removeAttributeNode(l[0]);
      xs(t);
    }
    var Rl = /* @__PURE__ */ new Map(), Kd = /* @__PURE__ */ new Set();
    function ec(t) {
      return typeof t.getRootNode == "function" ? t.getRootNode() : t.nodeType === 9 ? t : t.ownerDocument;
    }
    var Le = ht.d;
    ht.d = { f: wg, r: jg, D: Gg, C: Xg, L: Qg, m: Zg, X: Kg, S: Vg, M: Jg };
    function wg() {
      var t = Le.f(), l = bc();
      return t || l;
    }
    function jg(t) {
      var l = xa(t);
      l !== null && l.tag === 5 && l.type === "form" ? A0(l) : Le.r(t);
    }
    var La = typeof document > "u" ? null : document;
    function Hh(t, l, e) {
      var n = La;
      if (n && typeof l == "string" && l) {
        var a = Wl(l);
        a = 'link[rel="' + t + '"][href="' + a + '"]', typeof e == "string" && (a += '[crossorigin="' + e + '"]'), Kd.has(a) || (Kd.add(a), t = { rel: t, crossOrigin: e, href: l }, n.querySelector(a) === null && (l = n.createElement("link"), sl(l, "link", t), el(l), n.head.appendChild(l)));
      }
    }
    function Gg(t) {
      Le.D(t), Hh("dns-prefetch", t, null);
    }
    function Xg(t, l) {
      Le.C(t, l), Hh("preconnect", t, l);
    }
    function Qg(t, l, e) {
      Le.L(t, l, e);
      var n = La;
      if (n && t && l) {
        var a = 'link[rel="preload"][as="' + Wl(l) + '"]';
        l === "image" && e && e.imageSrcSet ? (a += '[imagesrcset="' + Wl(e.imageSrcSet) + '"]', typeof e.imageSizes == "string" && (a += '[imagesizes="' + Wl(e.imageSizes) + '"]')) : a += '[href="' + Wl(t) + '"]';
        var u = a;
        switch (l) {
          case "style":
            u = _a(t);
            break;
          case "script":
            u = wa(t);
        }
        Rl.has(u) || (t = _t({ rel: "preload", href: l === "image" && e && e.imageSrcSet ? void 0 : t, as: l }, e), Rl.set(u, t), n.querySelector(a) !== null || l === "style" && n.querySelector(Qu(u)) || l === "script" && n.querySelector(Zu(u)) || (l = n.createElement("link"), sl(l, "link", t), el(l), n.head.appendChild(l)));
      }
    }
    function Zg(t, l) {
      Le.m(t, l);
      var e = La;
      if (e && t) {
        var n = l && typeof l.as == "string" ? l.as : "script", a = 'link[rel="modulepreload"][as="' + Wl(n) + '"][href="' + Wl(t) + '"]', u = a;
        switch (n) {
          case "audioworklet":
          case "paintworklet":
          case "serviceworker":
          case "sharedworker":
          case "worker":
          case "script":
            u = wa(t);
        }
        if (!Rl.has(u) && (t = _t({ rel: "modulepreload", href: t }, l), Rl.set(u, t), e.querySelector(a) === null)) {
          switch (n) {
            case "audioworklet":
            case "paintworklet":
            case "serviceworker":
            case "sharedworker":
            case "worker":
            case "script":
              if (e.querySelector(Zu(u))) return;
          }
          n = e.createElement("link"), sl(n, "link", t), el(n), e.head.appendChild(n);
        }
      }
    }
    function Vg(t, l, e) {
      Le.S(t, l, e);
      var n = La;
      if (n && t) {
        var a = ha(n).hoistableStyles, u = _a(t);
        l = l || "default";
        var i = a.get(u);
        if (!i) {
          var c = { loading: 0, preload: null };
          if (i = n.querySelector(Qu(u))) c.loading = 5;
          else {
            t = _t({ rel: "stylesheet", href: t, "data-precedence": l }, e), (e = Rl.get(u)) && bo(t, e);
            var f = i = n.createElement("link");
            el(f), sl(f, "link", t), f._p = new Promise(function(r, y) {
              f.onload = r, f.onerror = y;
            }), f.addEventListener("load", function() {
              c.loading |= 1;
            }), f.addEventListener("error", function() {
              c.loading |= 2;
            }), c.loading |= 4, Mi(i, l, n);
          }
          i = { type: "stylesheet", instance: i, count: 1, state: c }, a.set(u, i);
        }
      }
    }
    function Kg(t, l) {
      Le.X(t, l);
      var e = La;
      if (e && t) {
        var n = ha(e).hoistableScripts, a = wa(t), u = n.get(a);
        u || (u = e.querySelector(Zu(a)), u || (t = _t({ src: t, async: true }, l), (l = Rl.get(a)) && So(t, l), u = e.createElement("script"), el(u), sl(u, "link", t), e.head.appendChild(u)), u = { type: "script", instance: u, count: 1, state: null }, n.set(a, u));
      }
    }
    function Jg(t, l) {
      Le.M(t, l);
      var e = La;
      if (e && t) {
        var n = ha(e).hoistableScripts, a = wa(t), u = n.get(a);
        u || (u = e.querySelector(Zu(a)), u || (t = _t({ src: t, async: true, type: "module" }, l), (l = Rl.get(a)) && So(t, l), u = e.createElement("script"), el(u), sl(u, "link", t), e.head.appendChild(u)), u = { type: "script", instance: u, count: 1, state: null }, n.set(a, u));
      }
    }
    function Jd(t, l, e, n) {
      var a = (a = nn.current) ? ec(a) : null;
      if (!a) throw Error(z(446));
      switch (t) {
        case "meta":
        case "title":
          return null;
        case "style":
          return typeof e.precedence == "string" && typeof e.href == "string" ? (l = _a(e.href), e = ha(a).hoistableStyles, n = e.get(l), n || (n = { type: "style", instance: null, count: 0, state: null }, e.set(l, n)), n) : { type: "void", instance: null, count: 0, state: null };
        case "link":
          if (e.rel === "stylesheet" && typeof e.href == "string" && typeof e.precedence == "string") {
            t = _a(e.href);
            var u = ha(a).hoistableStyles, i = u.get(t);
            if (i || (a = a.ownerDocument || a, i = { type: "stylesheet", instance: null, count: 0, state: { loading: 0, preload: null } }, u.set(t, i), (u = a.querySelector(Qu(t))) && !u._p && (i.instance = u, i.state.loading = 5), Rl.has(t) || (e = { rel: "preload", as: "style", href: e.href, crossOrigin: e.crossOrigin, integrity: e.integrity, media: e.media, hrefLang: e.hrefLang, referrerPolicy: e.referrerPolicy }, Rl.set(t, e), u || kg(a, t, e, i.state))), l && n === null) throw Error(z(528, ""));
            return i;
          }
          if (l && n !== null) throw Error(z(529, ""));
          return null;
        case "script":
          return l = e.async, e = e.src, typeof e == "string" && l && typeof l != "function" && typeof l != "symbol" ? (l = wa(e), e = ha(a).hoistableScripts, n = e.get(l), n || (n = { type: "script", instance: null, count: 0, state: null }, e.set(l, n)), n) : { type: "void", instance: null, count: 0, state: null };
        default:
          throw Error(z(444, t));
      }
    }
    function _a(t) {
      return 'href="' + Wl(t) + '"';
    }
    function Qu(t) {
      return 'link[rel="stylesheet"][' + t + "]";
    }
    function xh(t) {
      return _t({}, t, { "data-precedence": t.precedence, precedence: null });
    }
    function kg(t, l, e, n) {
      t.querySelector('link[rel="preload"][as="style"][' + l + "]") ? n.loading = 1 : (l = t.createElement("link"), n.preload = l, l.addEventListener("load", function() {
        return n.loading |= 1;
      }), l.addEventListener("error", function() {
        return n.loading |= 2;
      }), sl(l, "link", e), el(l), t.head.appendChild(l));
    }
    function wa(t) {
      return '[src="' + Wl(t) + '"]';
    }
    function Zu(t) {
      return "script[async]" + t;
    }
    function kd(t, l, e) {
      if (l.count++, l.instance === null) switch (l.type) {
        case "style":
          var n = t.querySelector('style[data-href~="' + Wl(e.href) + '"]');
          if (n) return l.instance = n, el(n), n;
          var a = _t({}, e, { "data-href": e.href, "data-precedence": e.precedence, href: null, precedence: null });
          return n = (t.ownerDocument || t).createElement("style"), el(n), sl(n, "style", a), Mi(n, e.precedence, t), l.instance = n;
        case "stylesheet":
          a = _a(e.href);
          var u = t.querySelector(Qu(a));
          if (u) return l.state.loading |= 4, l.instance = u, el(u), u;
          n = xh(e), (a = Rl.get(a)) && bo(n, a), u = (t.ownerDocument || t).createElement("link"), el(u);
          var i = u;
          return i._p = new Promise(function(c, f) {
            i.onload = c, i.onerror = f;
          }), sl(u, "link", n), l.state.loading |= 4, Mi(u, e.precedence, t), l.instance = u;
        case "script":
          return u = wa(e.src), (a = t.querySelector(Zu(u))) ? (l.instance = a, el(a), a) : (n = e, (a = Rl.get(u)) && (n = _t({}, e), So(n, a)), t = t.ownerDocument || t, a = t.createElement("script"), el(a), sl(a, "link", n), t.head.appendChild(a), l.instance = a);
        case "void":
          return null;
        default:
          throw Error(z(443, l.type));
      }
      else l.type === "stylesheet" && (l.state.loading & 4) === 0 && (n = l.instance, l.state.loading |= 4, Mi(n, e.precedence, t));
      return l.instance;
    }
    function Mi(t, l, e) {
      for (var n = e.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'), a = n.length ? n[n.length - 1] : null, u = a, i = 0; i < n.length; i++) {
        var c = n[i];
        if (c.dataset.precedence === l) u = c;
        else if (u !== a) break;
      }
      u ? u.parentNode.insertBefore(t, u.nextSibling) : (l = e.nodeType === 9 ? e.head : e, l.insertBefore(t, l.firstChild));
    }
    function bo(t, l) {
      t.crossOrigin == null && (t.crossOrigin = l.crossOrigin), t.referrerPolicy == null && (t.referrerPolicy = l.referrerPolicy), t.title == null && (t.title = l.title);
    }
    function So(t, l) {
      t.crossOrigin == null && (t.crossOrigin = l.crossOrigin), t.referrerPolicy == null && (t.referrerPolicy = l.referrerPolicy), t.integrity == null && (t.integrity = l.integrity);
    }
    var Di = null;
    function Wd(t, l, e) {
      if (Di === null) {
        var n = /* @__PURE__ */ new Map(), a = Di = /* @__PURE__ */ new Map();
        a.set(e, n);
      } else a = Di, n = a.get(e), n || (n = /* @__PURE__ */ new Map(), a.set(e, n));
      if (n.has(t)) return n;
      for (n.set(t, null), e = e.getElementsByTagName(t), a = 0; a < e.length; a++) {
        var u = e[a];
        if (!(u[Yu] || u[il] || t === "link" && u.getAttribute("rel") === "stylesheet") && u.namespaceURI !== "http://www.w3.org/2000/svg") {
          var i = u.getAttribute(l) || "";
          i = t + i;
          var c = n.get(i);
          c ? c.push(u) : n.set(i, [u]);
        }
      }
      return n;
    }
    function Fd(t, l, e) {
      t = t.ownerDocument || t, t.head.insertBefore(e, l === "title" ? t.querySelector("head > title") : null);
    }
    function Wg(t, l, e) {
      if (e === 1 || l.itemProp != null) return false;
      switch (t) {
        case "meta":
        case "title":
          return true;
        case "style":
          if (typeof l.precedence != "string" || typeof l.href != "string" || l.href === "") break;
          return true;
        case "link":
          if (typeof l.rel != "string" || typeof l.href != "string" || l.href === "" || l.onLoad || l.onError) break;
          switch (l.rel) {
            case "stylesheet":
              return t = l.disabled, typeof l.precedence == "string" && t == null;
            default:
              return true;
          }
        case "script":
          if (l.async && typeof l.async != "function" && typeof l.async != "symbol" && !l.onLoad && !l.onError && l.src && typeof l.src == "string") return true;
      }
      return false;
    }
    function Bh(t) {
      return !(t.type === "stylesheet" && (t.state.loading & 3) === 0);
    }
    function Fg(t, l, e, n) {
      if (e.type === "stylesheet" && (typeof n.media != "string" || matchMedia(n.media).matches !== false) && (e.state.loading & 4) === 0) {
        if (e.instance === null) {
          var a = _a(n.href), u = l.querySelector(Qu(a));
          if (u) {
            l = u._p, l !== null && typeof l == "object" && typeof l.then == "function" && (t.count++, t = nc.bind(t), l.then(t, t)), e.state.loading |= 4, e.instance = u, el(u);
            return;
          }
          u = l.ownerDocument || l, n = xh(n), (a = Rl.get(a)) && bo(n, a), u = u.createElement("link"), el(u);
          var i = u;
          i._p = new Promise(function(c, f) {
            i.onload = c, i.onerror = f;
          }), sl(u, "link", n), e.instance = u;
        }
        t.stylesheets === null && (t.stylesheets = /* @__PURE__ */ new Map()), t.stylesheets.set(e, l), (l = e.state.preload) && (e.state.loading & 3) === 0 && (t.count++, e = nc.bind(t), l.addEventListener("load", e), l.addEventListener("error", e));
      }
    }
    var Hf = 0;
    function $g(t, l) {
      return t.stylesheets && t.count === 0 && _i(t, t.stylesheets), 0 < t.count || 0 < t.imgCount ? function(e) {
        var n = setTimeout(function() {
          if (t.stylesheets && _i(t, t.stylesheets), t.unsuspend) {
            var u = t.unsuspend;
            t.unsuspend = null, u();
          }
        }, 6e4 + l);
        0 < t.imgBytes && Hf === 0 && (Hf = 62500 * _g());
        var a = setTimeout(function() {
          if (t.waitingForImages = false, t.count === 0 && (t.stylesheets && _i(t, t.stylesheets), t.unsuspend)) {
            var u = t.unsuspend;
            t.unsuspend = null, u();
          }
        }, (t.imgBytes > Hf ? 50 : 800) + l);
        return t.unsuspend = e, function() {
          t.unsuspend = null, clearTimeout(n), clearTimeout(a);
        };
      } : null;
    }
    function nc() {
      if (this.count--, this.count === 0 && (this.imgCount === 0 || !this.waitingForImages)) {
        if (this.stylesheets) _i(this, this.stylesheets);
        else if (this.unsuspend) {
          var t = this.unsuspend;
          this.unsuspend = null, t();
        }
      }
    }
    var ac = null;
    function _i(t, l) {
      t.stylesheets = null, t.unsuspend !== null && (t.count++, ac = /* @__PURE__ */ new Map(), l.forEach(Ig, t), ac = null, nc.call(t));
    }
    function Ig(t, l) {
      if (!(l.state.loading & 4)) {
        var e = ac.get(t);
        if (e) var n = e.get(null);
        else {
          e = /* @__PURE__ */ new Map(), ac.set(t, e);
          for (var a = t.querySelectorAll("link[data-precedence],style[data-precedence]"), u = 0; u < a.length; u++) {
            var i = a[u];
            (i.nodeName === "LINK" || i.getAttribute("media") !== "not all") && (e.set(i.dataset.precedence, i), n = i);
          }
          n && e.set(null, n);
        }
        a = l.instance, i = a.getAttribute("data-precedence"), u = e.get(i) || n, u === n && e.set(null, a), e.set(i, a), this.count++, n = nc.bind(this), a.addEventListener("load", n), a.addEventListener("error", n), u ? u.parentNode.insertBefore(a, u.nextSibling) : (t = t.nodeType === 9 ? t.head : t, t.insertBefore(a, t.firstChild)), l.state.loading |= 4;
      }
    }
    var Du = { $$typeof: Oe, Provider: null, Consumer: null, _currentValue: Cn, _currentValue2: Cn, _threadCount: 0 };
    function Pg(t, l, e, n, a, u, i, c, f) {
      this.tag = 1, this.containerInfo = t, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = nf(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = nf(0), this.hiddenUpdates = nf(null), this.identifierPrefix = n, this.onUncaughtError = a, this.onCaughtError = u, this.onRecoverableError = i, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = f, this.incompleteTransitions = /* @__PURE__ */ new Map();
    }
    function qh(t, l, e, n, a, u, i, c, f, r, y, b) {
      return t = new Pg(t, l, e, i, f, r, y, b, c), l = 1, u === true && (l |= 24), u = Bl(3, null, null, l), t.current = u, u.stateNode = t, l = Ks(), l.refCount++, t.pooledCache = l, l.refCount++, u.memoizedState = { element: n, isDehydrated: e, cache: l }, Ws(u), t;
    }
    function Yh(t) {
      return t ? (t = oa, t) : oa;
    }
    function Lh(t, l, e, n, a, u) {
      a = Yh(a), n.context === null ? n.context = a : n.pendingContext = a, n = un(l), n.payload = { element: e }, u = u === void 0 ? null : u, u !== null && (n.callback = u), e = cn(t, n, l), e !== null && (Cl(e, t, l), su(e, t, l));
    }
    function $d(t, l) {
      if (t = t.memoizedState, t !== null && t.dehydrated !== null) {
        var e = t.retryLane;
        t.retryLane = e !== 0 && e < l ? e : l;
      }
    }
    function No(t, l) {
      $d(t, l), (t = t.alternate) && $d(t, l);
    }
    function wh(t) {
      if (t.tag === 13 || t.tag === 31) {
        var l = Gn(t, 67108864);
        l !== null && Cl(l, t, 67108864), No(t, 67108864);
      }
    }
    function Id(t) {
      if (t.tag === 13 || t.tag === 31) {
        var l = jl();
        l = Us(l);
        var e = Gn(t, l);
        e !== null && Cl(e, t, l), No(t, l);
      }
    }
    var uc = true;
    function Rg(t, l, e, n) {
      var a = $.T;
      $.T = null;
      var u = ht.p;
      try {
        ht.p = 2, Eo(t, l, e, n);
      } finally {
        ht.p = u, $.T = a;
      }
    }
    function tv(t, l, e, n) {
      var a = $.T;
      $.T = null;
      var u = ht.p;
      try {
        ht.p = 8, Eo(t, l, e, n);
      } finally {
        ht.p = u, $.T = a;
      }
    }
    function Eo(t, l, e, n) {
      if (uc) {
        var a = Os(n);
        if (a === null) _f(t, l, n, ic, e), Pd(t, n);
        else if (ev(a, t, l, e, n)) n.stopPropagation();
        else if (Pd(t, n), l & 4 && -1 < lv.indexOf(t)) {
          for (; a !== null; ) {
            var u = xa(a);
            if (u !== null) switch (u.tag) {
              case 3:
                if (u = u.stateNode, u.current.memoizedState.isDehydrated) {
                  var i = An(u.pendingLanes);
                  if (i !== 0) {
                    var c = u;
                    for (c.pendingLanes |= 2, c.entangledLanes |= 2; i; ) {
                      var f = 1 << 31 - wl(i);
                      c.entanglements[1] |= f, i &= ~f;
                    }
                    he(u), (mt & 6) === 0 && (Fi = Yl() + 500, Xu(0, false));
                  }
                }
                break;
              case 31:
              case 13:
                c = Gn(u, 2), c !== null && Cl(c, u, 2), bc(), No(u, 2);
            }
            if (u = Os(n), u === null && _f(t, l, n, ic, e), u === a) break;
            a = u;
          }
          a !== null && n.stopPropagation();
        } else _f(t, l, n, null, e);
      }
    }
    function Os(t) {
      return t = qs(t), To(t);
    }
    var ic = null;
    function To(t) {
      if (ic = null, t = aa(t), t !== null) {
        var l = Hu(t);
        if (l === null) t = null;
        else {
          var e = l.tag;
          if (e === 13) {
            if (t = am(l), t !== null) return t;
            t = null;
          } else if (e === 31) {
            if (t = um(l), t !== null) return t;
            t = null;
          } else if (e === 3) {
            if (l.stateNode.current.memoizedState.isDehydrated) return l.tag === 3 ? l.stateNode.containerInfo : null;
            t = null;
          } else l !== t && (t = null);
        }
      }
      return ic = t, null;
    }
    function jh(t) {
      switch (t) {
        case "beforetoggle":
        case "cancel":
        case "click":
        case "close":
        case "contextmenu":
        case "copy":
        case "cut":
        case "auxclick":
        case "dblclick":
        case "dragend":
        case "dragstart":
        case "drop":
        case "focusin":
        case "focusout":
        case "input":
        case "invalid":
        case "keydown":
        case "keypress":
        case "keyup":
        case "mousedown":
        case "mouseup":
        case "paste":
        case "pause":
        case "play":
        case "pointercancel":
        case "pointerdown":
        case "pointerup":
        case "ratechange":
        case "reset":
        case "resize":
        case "seeked":
        case "submit":
        case "toggle":
        case "touchcancel":
        case "touchend":
        case "touchstart":
        case "volumechange":
        case "change":
        case "selectionchange":
        case "textInput":
        case "compositionstart":
        case "compositionend":
        case "compositionupdate":
        case "beforeblur":
        case "afterblur":
        case "beforeinput":
        case "blur":
        case "fullscreenchange":
        case "focus":
        case "hashchange":
        case "popstate":
        case "select":
        case "selectstart":
          return 2;
        case "drag":
        case "dragenter":
        case "dragexit":
        case "dragleave":
        case "dragover":
        case "mousemove":
        case "mouseout":
        case "mouseover":
        case "pointermove":
        case "pointerout":
        case "pointerover":
        case "scroll":
        case "touchmove":
        case "wheel":
        case "mouseenter":
        case "mouseleave":
        case "pointerenter":
        case "pointerleave":
          return 8;
        case "message":
          switch (Qp()) {
            case sm:
              return 2;
            case om:
              return 8;
            case qi:
            case Zp:
              return 32;
            case rm:
              return 268435456;
            default:
              return 32;
          }
        default:
          return 32;
      }
    }
    var Cs = false, on = null, rn = null, dn = null, _u = /* @__PURE__ */ new Map(), Uu = /* @__PURE__ */ new Map(), Ie = [], lv = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");
    function Pd(t, l) {
      switch (t) {
        case "focusin":
        case "focusout":
          on = null;
          break;
        case "dragenter":
        case "dragleave":
          rn = null;
          break;
        case "mouseover":
        case "mouseout":
          dn = null;
          break;
        case "pointerover":
        case "pointerout":
          _u.delete(l.pointerId);
          break;
        case "gotpointercapture":
        case "lostpointercapture":
          Uu.delete(l.pointerId);
      }
    }
    function Pa(t, l, e, n, a, u) {
      return t === null || t.nativeEvent !== u ? (t = { blockedOn: l, domEventName: e, eventSystemFlags: n, nativeEvent: u, targetContainers: [a] }, l !== null && (l = xa(l), l !== null && wh(l)), t) : (t.eventSystemFlags |= n, l = t.targetContainers, a !== null && l.indexOf(a) === -1 && l.push(a), t);
    }
    function ev(t, l, e, n, a) {
      switch (l) {
        case "focusin":
          return on = Pa(on, t, l, e, n, a), true;
        case "dragenter":
          return rn = Pa(rn, t, l, e, n, a), true;
        case "mouseover":
          return dn = Pa(dn, t, l, e, n, a), true;
        case "pointerover":
          var u = a.pointerId;
          return _u.set(u, Pa(_u.get(u) || null, t, l, e, n, a)), true;
        case "gotpointercapture":
          return u = a.pointerId, Uu.set(u, Pa(Uu.get(u) || null, t, l, e, n, a)), true;
      }
      return false;
    }
    function Gh(t) {
      var l = aa(t.target);
      if (l !== null) {
        var e = Hu(l);
        if (e !== null) {
          if (l = e.tag, l === 13) {
            if (l = am(e), l !== null) {
              t.blockedOn = l, qr(t.priority, function() {
                Id(e);
              });
              return;
            }
          } else if (l === 31) {
            if (l = um(e), l !== null) {
              t.blockedOn = l, qr(t.priority, function() {
                Id(e);
              });
              return;
            }
          } else if (l === 3 && e.stateNode.current.memoizedState.isDehydrated) {
            t.blockedOn = e.tag === 3 ? e.stateNode.containerInfo : null;
            return;
          }
        }
      }
      t.blockedOn = null;
    }
    function Ui(t) {
      if (t.blockedOn !== null) return false;
      for (var l = t.targetContainers; 0 < l.length; ) {
        var e = Os(t.nativeEvent);
        if (e === null) {
          e = t.nativeEvent;
          var n = new e.constructor(e.type, e);
          Kf = n, e.target.dispatchEvent(n), Kf = null;
        } else return l = xa(e), l !== null && wh(l), t.blockedOn = e, false;
        l.shift();
      }
      return true;
    }
    function Rd(t, l, e) {
      Ui(t) && e.delete(l);
    }
    function nv() {
      Cs = false, on !== null && Ui(on) && (on = null), rn !== null && Ui(rn) && (rn = null), dn !== null && Ui(dn) && (dn = null), _u.forEach(Rd), Uu.forEach(Rd);
    }
    function pi(t, l) {
      t.blockedOn === l && (t.blockedOn = null, Cs || (Cs = true, tl.unstable_scheduleCallback(tl.unstable_NormalPriority, nv)));
    }
    var yi = null;
    function tm(t) {
      yi !== t && (yi = t, tl.unstable_scheduleCallback(tl.unstable_NormalPriority, function() {
        yi === t && (yi = null);
        for (var l = 0; l < t.length; l += 3) {
          var e = t[l], n = t[l + 1], a = t[l + 2];
          if (typeof n != "function") {
            if (To(n || e) === null) continue;
            break;
          }
          var u = xa(e);
          u !== null && (t.splice(l, 3), l -= 3, cs(u, { pending: true, data: a, method: e.method, action: n }, n, a));
        }
      }));
    }
    function Ua(t) {
      function l(f) {
        return pi(f, t);
      }
      on !== null && pi(on, t), rn !== null && pi(rn, t), dn !== null && pi(dn, t), _u.forEach(l), Uu.forEach(l);
      for (var e = 0; e < Ie.length; e++) {
        var n = Ie[e];
        n.blockedOn === t && (n.blockedOn = null);
      }
      for (; 0 < Ie.length && (e = Ie[0], e.blockedOn === null); ) Gh(e), e.blockedOn === null && Ie.shift();
      if (e = (t.ownerDocument || t).$$reactFormReplay, e != null) for (n = 0; n < e.length; n += 3) {
        var a = e[n], u = e[n + 1], i = a[Ml] || null;
        if (typeof u == "function") i || tm(e);
        else if (i) {
          var c = null;
          if (u && u.hasAttribute("formAction")) {
            if (a = u, i = u[Ml] || null) c = i.formAction;
            else if (To(a) !== null) continue;
          } else c = i.action;
          typeof c == "function" ? e[n + 1] = c : (e.splice(n, 3), n -= 3), tm(e);
        }
      }
    }
    function Xh() {
      function t(u) {
        u.canIntercept && u.info === "react-transition" && u.intercept({ handler: function() {
          return new Promise(function(i) {
            return a = i;
          });
        }, focusReset: "manual", scroll: "manual" });
      }
      function l() {
        a !== null && (a(), a = null), n || setTimeout(e, 20);
      }
      function e() {
        if (!n && !navigation.transition) {
          var u = navigation.currentEntry;
          u && u.url != null && navigation.navigate(u.url, { state: u.getState(), info: "react-transition", history: "replace" });
        }
      }
      if (typeof navigation == "object") {
        var n = false, a = null;
        return navigation.addEventListener("navigate", t), navigation.addEventListener("navigatesuccess", l), navigation.addEventListener("navigateerror", l), setTimeout(e, 100), function() {
          n = true, navigation.removeEventListener("navigate", t), navigation.removeEventListener("navigatesuccess", l), navigation.removeEventListener("navigateerror", l), a !== null && (a(), a = null);
        };
      }
    }
    function Ao(t) {
      this._internalRoot = t;
    }
    Ec.prototype.render = Ao.prototype.render = function(t) {
      var l = this._internalRoot;
      if (l === null) throw Error(z(409));
      var e = l.current, n = jl();
      Lh(e, n, t, l, null, null);
    };
    Ec.prototype.unmount = Ao.prototype.unmount = function() {
      var t = this._internalRoot;
      if (t !== null) {
        this._internalRoot = null;
        var l = t.containerInfo;
        Lh(t.current, 2, null, t, null, null), bc(), l[Ha] = null;
      }
    };
    function Ec(t) {
      this._internalRoot = t;
    }
    Ec.prototype.unstable_scheduleHydration = function(t) {
      if (t) {
        var l = ym();
        t = { blockedOn: null, target: t, priority: l };
        for (var e = 0; e < Ie.length && l !== 0 && l < Ie[e].priority; e++) ;
        Ie.splice(e, 0, t), e === 0 && Gh(t);
      }
    };
    var lm = em.version;
    if (lm !== "19.2.0") throw Error(z(527, lm, "19.2.0"));
    ht.findDOMNode = function(t) {
      var l = t._reactInternals;
      if (l === void 0) throw typeof t.render == "function" ? Error(z(188)) : (t = Object.keys(t).join(","), Error(z(268, t)));
      return t = qp(l), t = t !== null ? im(t) : null, t = t === null ? null : t.stateNode, t;
    };
    var av = { bundleType: 0, version: "19.2.0", rendererPackageName: "react-dom", currentDispatcherRef: $, reconcilerVersion: "19.2.0" };
    if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && (Ra = __REACT_DEVTOOLS_GLOBAL_HOOK__, !Ra.isDisabled && Ra.supportsFiber)) try {
      xu = Ra.inject(av), Ll = Ra;
    } catch {
    }
    var Ra;
    Tc.createRoot = function(t, l) {
      if (!nm(t)) throw Error(z(299));
      var e = false, n = "", a = H0, u = x0, i = B0;
      return l != null && (l.unstable_strictMode === true && (e = true), l.identifierPrefix !== void 0 && (n = l.identifierPrefix), l.onUncaughtError !== void 0 && (a = l.onUncaughtError), l.onCaughtError !== void 0 && (u = l.onCaughtError), l.onRecoverableError !== void 0 && (i = l.onRecoverableError)), l = qh(t, 1, false, null, null, e, n, null, a, u, i, Xh), t[Ha] = l.current, vo(t), new Ao(l);
    };
    Tc.hydrateRoot = function(t, l, e) {
      if (!nm(t)) throw Error(z(299));
      var n = false, a = "", u = H0, i = x0, c = B0, f = null;
      return e != null && (e.unstable_strictMode === true && (n = true), e.identifierPrefix !== void 0 && (a = e.identifierPrefix), e.onUncaughtError !== void 0 && (u = e.onUncaughtError), e.onCaughtError !== void 0 && (i = e.onCaughtError), e.onRecoverableError !== void 0 && (c = e.onRecoverableError), e.formState !== void 0 && (f = e.formState)), l = qh(t, 1, true, l, e ?? null, n, a, f, u, i, c, Xh), l.context = Yh(null), e = l.current, n = jl(), n = Us(n), a = un(n), a.callback = null, cn(e, a, n), e = n, l.current.lanes = e, qu(l, e), he(l), t[Ha] = l.current, vo(t), new Ec(l);
    };
    Tc.version = "19.2.0";
  });
  var Kh = Ze((Av, Vh) => {
    "use strict";
    function Zh() {
      if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function")) try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(Zh);
      } catch (t) {
        console.error(t);
      }
    }
    Zh(), Vh.exports = Qh();
  });
  var Po = Ul(yl()), ap = Ul(Kh());
  var X = Ul(yl());
  var dt = Ul(yl()), Ac = { dashboard: "내 대시보드", health: "나의 건강정보", plans: "식단 계획·장보기·외식", meals: "식사 기록·재료 성분", care: "나의 관리항목", daily: "실천·측정 기록", feedback: "변화·피드백", settings: "회원정보·설정" };
  function zo({ preview: t = false, date: l, maxDate: e, onDateChange: n, active: a, onNavigate: u, children: i }) {
    return dt.default.createElement("div", { className: "nr-review" }, dt.default.createElement("div", { className: "nr-hero" }, dt.default.createElement("div", null, dt.default.createElement("p", { className: "nr-kicker" }, "SMARTNF / MY NUTRITION"), dt.default.createElement("h1", null, "먹는 기록이, 나의 관리로."), dt.default.createElement("p", null, "헬스케어에서 방향을 정하고, MyPage에서 매일 이어갑니다.")), dt.default.createElement("span", { className: "nr-chip" }, t ? "가상 체험" : "나의 MyPage")), t ? dt.default.createElement("div", { className: "nr-notice" }, dt.default.createElement("strong", null, "프론트엔드 검토본 · 가상 사용자 화면"), dt.default.createElement("p", null, "실제 회원 데이터가 아닙니다. 입력은 서버·DB·외부 AI에 전송하지 않으며 새로고침하면 초기화됩니다. 음식·재료은 가상이며 완성 식단 추천이 아닙니다.")) : dt.default.createElement("div", { className: "nr-notice" }, dt.default.createElement("strong", null, "식사·실천·측정 기록을 한곳에서 관리하세요."), dt.default.createElement("p", null, "식사 기록에는 갱신된 건강정보 저장 동의가 필요합니다. 공개 체험의 가상 식사는 본인 계정에 자동 저장되지 않습니다.")), dt.default.createElement("section", { className: "nr-journey", "aria-label": "헬스케어와 MyPage 이용 흐름" }, t ? dt.default.createElement("a", { href: "/preview/health/info" }, "① 건강정보·비교") : dt.default.createElement("button", { type: "button", onClick: () => u("health") }, "① 나의 건강정보"), dt.default.createElement("button", { type: "button", onClick: () => u("care") }, t ? "② 관리항목 선택" : "② 관리항목·실천 기록"), dt.default.createElement("button", { type: "button", onClick: () => u("meals") }, t ? "③ 식사·실천 기록" : "③ 식사 기록"), dt.default.createElement("button", { type: "button", onClick: () => u("feedback") }, "④ 기간별 돌아보기"), dt.default.createElement("p", null, "헬스케어: 상태·관리 방향 / MyPage: 기록·확인")), dt.default.createElement("div", { className: "nr-shell" }, dt.default.createElement("aside", { className: "nr-sidebar" }, dt.default.createElement("h2", null, "나의 MyPage"), dt.default.createElement("nav", { "aria-label": "MyPage 메뉴" }, Object.entries(Ac).filter(([c]) => t ? !["plans", "health"].includes(c) : c !== "daily").map(([c, f]) => dt.default.createElement("button", { type: "button", "aria-current": a === c ? "page" : void 0, key: c, onClick: () => u(c) }, !t && c === "care" ? "나의 관리항목·실천 기록" : f))), dt.default.createElement("a", { href: t ? "/mypage" : "/preview/mypage/review" }, t ? "나의 실제 MyPage" : "같은 구성으로 가상 체험", " ↗")), dt.default.createElement("div", { className: "nr-content" }, dt.default.createElement("div", { className: "nr-heading" }, dt.default.createElement("h2", null, !t && a === "care" ? "나의 관리항목·실천 기록" : Ac[a]), (t || a === "dashboard") && dt.default.createElement("label", null, t ? "가상 기록 날짜" : "조회 날짜", dt.default.createElement("input", { type: "date", min: "1900-01-01", max: e, value: l, onChange: (c) => n(c.target.value) }))), i)));
  }
  (() => {
    if (window.SmartNFActionConfirm) return;
    let t = null;
    window.SmartNFActionConfirm = (l) => new Promise((e) => {
      t?.();
      let n = document.activeElement, a = n?.closest("form,section,article") || document.querySelector("main") || document.body, u = document.createElement("section"), i = document.createElement("p"), c = document.createElement("button"), f = document.createElement("button");
      u.dataset.actionConfirm = "", u.setAttribute("role", "group"), u.setAttribute("aria-label", "작업 확인"), u.style.cssText = "border:1px solid #9bbfaa;border-radius:10px;padding:14px;margin:12px 0;background:#f2f8f4;", i.textContent = l, c.type = f.type = "button", c.textContent = "확인하고 진행", f.textContent = "취소";
      for (let m of [c, f]) m.style.cssText = "min-height:44px;margin:4px;padding:8px 14px;";
      let r = false, y = new MutationObserver(() => {
        (!u.isConnected || !n?.isConnected) && b(false);
      });
      function b(m) {
        r || (r = true, y.disconnect(), u.remove(), t = null, n?.isConnected && n.focus({ preventScroll: true }), e(m));
      }
      c.onclick = () => b(true), f.onclick = () => b(false), u.onkeydown = (m) => {
        m.key === "Escape" && (m.preventDefault(), b(false));
      }, u.append(i, c, f), a.append(u), t = () => b(false), y.observe(document.body, { childList: true, subtree: true }), u.scrollIntoView({ block: "nearest" }), f.focus({ preventScroll: true });
    }), window.SmartNFActionConfirm.cancel = () => t?.();
  })();
  var O = Ul(yl());
  var ja = ["당뇨병", "고혈압", "이상지질혈증", "신장질환", "기타 만성질환"], uv = [["신체·측정 정보", ["age", "sex", "referenceContext", "measured", "height", "weight", "waist", "bodyFat"]], ["혈압", ["sys", "dia", "bpContext"]], ["혈당", ["glucose", "glucoseMethod", "fasting", "postGlucose", "postType", "postHours", "hba1c"]], ["혈중 지질", ["totalChol", "ldl", "hdl", "tg", "labMeasured", "labSource"]], ["추가 검사", ["ast", "alt", "ggt", "creatinine", "egfr", "hemoglobin"]], ["생활습관·활동", ["steps", "activeMinutes", "sleepHours", "smoking", "drinkingDays", "breakfast", "vegetables", "sugary", "late", "regular"]], ["목표·개인 조건", ["goal", "medication", "restriction", "activity", "exerciseLimit", "weightGoal", "targetWeight", "goalStart", "goalEnd", "goalReviewed", "weightNotes"]]], Oo = (t) => {
    let l = new Date(t);
    return Number.isNaN(l.valueOf()) ? "저장 시각 확인 필요" : l.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) + " (한국 시간)";
  };
  function Vu(t = {}) {
    if (!t || typeof t != "object" || Array.isArray(t)) throw Error("건강정보 형식을 확인할 수 없습니다.");
    let l = {};
    for (let [e, n] of Object.entries(t)) {
      if (!Array.isArray(n) || n.some((a) => typeof a != "string")) throw Error("건강정보 항목 형식을 확인할 수 없습니다.");
      l[e] = [...n];
    }
    return l.conditions ??= [], l;
  }
  function Co(t) {
    let l = Vu(t), e = l.conditions;
    for (let n of Object.keys(l)) {
      let a = n.match(/_(\d)$/);
      a && !e.includes(ja[Number(a[1])]) && delete l[n];
    }
    return l;
  }
  function zc(t) {
    let l = Co(t);
    return JSON.stringify(Object.fromEntries(Object.keys(l).sort().map((e) => [e, ["conditions", "goal"].includes(e) ? [...l[e]].sort() : l[e]])));
  }
  function Mo(t, l = {}, e = false) {
    let n = Object.entries(t || {}), a = /* @__PURE__ */ new Set(), u = [], i = (c, f) => {
      let r = f.filter((y) => Object.hasOwn(t, y) && (e || (l[y] || []).some((b) => b !== ""))).map((y) => (a.add(y), [y, t[y]]));
      r.length && u.push({ title: c, rows: r });
    };
    i("진단받은 질환", ["conditions"]);
    for (let c = 0; c < ja.length; c++) l.conditions?.includes(ja[c]) && i(ja[c], n.map(([f]) => f).filter((f) => f.endsWith("_" + c)));
    for (let [c, f] of uv) i(c, f);
    return i("기타 저장 항목", n.map(([c]) => c).filter((c) => !a.has(c) && !/_\d$/.test(c))), u;
  }
  var Do = (t, l) => !t?.length || t.every((e) => e === "") ? "미입력" : t.map((e) => l === "goal" && e === "체중 관리" ? "다이어트" : e).join(" · "), _o = (t, l) => t === "conditions" ? "진단받은 질환" : l?.label || t;
  var Sl = (t, l) => window.SmartNFHealthAPI.request(t, l), iv = () => location.pathname.endsWith("/history") ? "history" : location.pathname.endsWith("/consent") ? "consent" : "latest";
  function Uo({ onDirty: t, onSaved: l, initialView: e }) {
    let [n, a] = (0, O.useState)(() => e || iv()), [u, i] = (0, O.useState)(null), [c, f] = (0, O.useState)(null), [r, y] = (0, O.useState)(null), [b, m] = (0, O.useState)([]), [h, T] = (0, O.useState)(0), [M, _] = (0, O.useState)(null), [s, o] = (0, O.useState)(null), [p, N] = (0, O.useState)(false), [S, Q] = (0, O.useState)(false), [D, L] = (0, O.useState)(false), [j, k] = (0, O.useState)(false), [pt, B] = (0, O.useState)("건강정보를 확인하고 있습니다."), Z = (0, O.useRef)(true), lt = (0, O.useRef)(0), W = (0, O.useRef)(false), F = (0, O.useRef)(null), ut = (0, O.useRef)(null), At = s !== null && zc(s) !== zc(c?.fields || {});
    ut.current = { consent: u, profile: c, draft: s, dirty: At, page: h, mode: n }, (0, O.useEffect)(() => (t?.(At || !!F.current), () => t?.(false)), [At, t, D]);
    function yt() {
      f(null), _(null), y(null), m([]), o(null), N(false), F.current = null;
    }
    async function zt(Y = 0) {
      if (W.current) return;
      window.SmartNFActionConfirm.cancel?.();
      let v = ++lt.current;
      W.current = true, L(true), k(false), yt(), B("계정의 최신 건강정보를 확인하고 있습니다…");
      try {
        let x = await Sl("/consent");
        if (!Z.current || v !== lt.current) return;
        if (i(x), !x.agreed) {
          B("건강정보 저장 안내와 동의를 먼저 확인하세요.");
          return;
        }
        let [H, w, K] = await Promise.all([Sl("/profile"), Sl("/catalog"), Sl("/history?page=" + Y)]), ot = await Sl("/consent");
        if (!ot.agreed || ot.eventId !== x.eventId) throw Error("저장 동의가 바뀌었습니다. 다시 조회하세요.");
        if (!w.fields || !Array.isArray(K)) throw Error("건강정보 자료 형식을 확인할 수 없습니다.");
        H.profile && Vu(H.profile.fields), Z.current && v === lt.current && (f(H.profile), y(w.fields), m(K), T(Y), i(ot), B(H.profile ? "MyPage에 저장한 최신 건강정보입니다." : "아직 계정에 저장한 건강정보가 없습니다."));
      } catch (x) {
        Z.current && v === lt.current && (yt(), k(true), B(x.message));
      } finally {
        W.current = false, Z.current && v === lt.current && L(false);
      }
    }
    async function Vt() {
      if (W.current) return;
      let Y = lt.current;
      try {
        let v = await Sl("/consent");
        if (!Z.current || Y !== lt.current || W.current) return;
        let x = ut.current;
        if (!v.agreed || v.eventId !== x.consent?.eventId) {
          lt.current++, yt(), i(v), k(true), B("계정·저장 동의가 변경되었습니다. 다시 불러오세요.");
          return;
        }
        if (x.draft !== null || F.current) {
          let H = await Sl("/profile");
          if (!Z.current || Y !== lt.current || W.current) return;
          (H.profile?.id ?? null) !== (ut.current.profile?.id ?? null) && (k(true), B("다른 화면에서 건강정보가 변경되었습니다. 입력을 확인하고 최신본을 다시 불러오세요."));
        } else ut.current.draft === null && !F.current && zt(x.page);
      } catch (v) {
        Z.current && Y === lt.current && !W.current && ([401, 403, 409].includes(v.status) && (yt(), k(true), i(null)), B(v.message + (ut.current?.draft !== null ? " 수정 중인 입력은 유지합니다." : "")));
      }
    }
    (0, O.useEffect)(() => {
      Z.current = true, zt();
      let Y = (w) => {
        (ut.current?.dirty || F.current) && (w.preventDefault(), w.returnValue = "");
      }, v = () => {
        lt.current++, yt();
      }, x = (w) => {
        w.persisted && location.reload();
      };
      window.addEventListener("focus", Vt), window.addEventListener("beforeunload", Y), window.addEventListener("pagehide", v), window.addEventListener("pageshow", x);
      let H;
      return typeof BroadcastChannel == "function" && (H = new BroadcastChannel("smartnf-health-consent-v1"), H.onmessage = Vt), () => {
        Z.current = false, lt.current++, H?.close(), window.removeEventListener("focus", Vt), window.removeEventListener("beforeunload", Y), window.removeEventListener("pagehide", v), window.removeEventListener("pageshow", x);
      };
    }, []);
    function Lt() {
      (At || F.current) && !confirm("저장 전 변경을 버리고 최신 건강정보를 다시 불러올까요?") || (F.current = null, zt(h));
    }
    function Kt(Y) {
      D || Y === n || (At || F.current) && !confirm("건강정보 수정을 취소하고 이동할까요?") || (F.current = null, o(null), N(false), _(null), a(Y));
    }
    function nt() {
      if (!(!r || j || D)) {
        if (lt.current++, Object.keys(c?.fields || {}).some((Y) => !Object.hasOwn(r, Y))) {
          B("이전 저장본에 현재 양식에서 확인할 수 없는 항목이 있습니다. 임의로 제외하지 않으므로 먼저 자료를 확인하세요.");
          return;
        }
        o(Vu(c?.fields || {})), N(false), a("latest"), B("수정 후 확인 체크와 변경사항 저장을 눌러 주세요.");
      }
    }
    function pl(Y, v) {
      if (F.current) {
        B("이전 저장 결과를 먼저 확인하거나 같은 내용으로 다시 시도하세요.");
        return;
      }
      o((x) => ({ ...x, [Y]: v })), N(false);
    }
    async function wt(Y) {
      if (Y.preventDefault(), W.current || j || !s || !u?.agreed || !p) return;
      let v = zc(s);
      if (F.current && F.current.signature !== v) {
        B("같은 내용으로 다시 시도하거나 최신 저장본을 확인하세요.");
        return;
      }
      W.current = true, L(true), B("MyPage에 저장하고 있습니다…");
      let x = false;
      try {
        let H = await Sl("/consent");
        if (!H.agreed || H.eventId !== u.eventId) throw Object.assign(Error("저장 동의가 변경되었습니다."), { status: 403 });
        F.current || (F.current = { signature: v, body: { requestId: crypto.randomUUID(), expectedCurrentProfileId: c?.id ?? null, consentEventId: u.eventId, demo: false, confirmedByUser: true, fields: Co(s) } }), x = true;
        let w = await Sl("/profiles", F.current.body), K = await Sl("/consent");
        if (!K.agreed || K.eventId !== u.eventId) throw Object.assign(Error("저장 동의가 변경되었습니다."), { status: 403 });
        if (!Z.current) return;
        F.current = null, ut.current = { ...ut.current, profile: w, draft: null, dirty: false }, f(w), o(null), N(false), _(null);
        try {
          sessionStorage.removeItem("smartnf.health-profile.v1"), sessionStorage.removeItem("smartnf.food-guide-context.v1");
        } catch {
        }
        l?.(w), window.dispatchEvent(new Event("smartnf-health-account-changed")), B("✓ 건강정보를 MyPage에 저장했습니다. 관리항목은 새 정보로 다시 검토·확정하세요.");
        try {
          let ot = await Sl("/history?page=0");
          Z.current && (m(ot), T(0));
        } catch {
          Z.current && B("저장은 완료됐습니다. 저장 이력은 다시 불러와 확인하세요.");
        }
      } catch (H) {
        (!x || H.status && H.status < 500) && (F.current = null), Z.current && (B(H.message + (F.current ? " 저장 결과가 불확실합니다. 같은 요청으로 다시 시도하거나 다시 불러오세요." : "")), [401, 403].includes(H.status) ? (yt(), k(true), i(null)) : H.status === 409 && k(true));
      } finally {
        x && window.dispatchEvent(new Event("smartnf-health-account-changed")), W.current = false, Z.current && L(false);
      }
    }
    async function Jt(Y) {
      if (W.current) return;
      W.current = true, L(true);
      let v = ++lt.current;
      _(null);
      try {
        let x = await Sl("/consent");
        if (!x.agreed || x.eventId !== u.eventId) throw Error("저장 동의가 변경되었습니다.");
        let H = await Sl("/profiles/" + Y), w = await Sl("/consent");
        if (!w.agreed || w.eventId !== x.eventId) throw Error("저장 동의가 변경되었습니다.");
        Z.current && v === lt.current && (Vu(H.fields), _(H), B("선택한 과거 저장본입니다. 최신 정보와 구분해 조회합니다."));
      } catch (x) {
        Z.current && v === lt.current && (yt(), k(true), B(x.message));
      } finally {
        W.current = false, Z.current && L(false);
      }
    }
    async function _l(Y = false) {
      if (!(W.current || !u || !Y && !S) && !(Y && !await window.SmartNFActionConfirm("건강정보 저장 동의를 철회하면 건강정보·관리항목·일일 기록·식사 기록 전체가 삭제됩니다. 복원할 수 없습니다. 계속할까요?"))) {
        W.current = true, L(true);
        try {
          let v = await Sl("/consent", { documentVersion: u.version, decision: Y ? "WITHDRAWN" : "AGREED", expectedEventId: u.eventId });
          if (Y && window.SmartNFHealthAPI.clear(), ut.current = { ...ut.current, consent: v, profile: null, draft: null, dirty: false }, !Z.current) return;
          yt(), i(v), Q(false), Y && (window.SmartNFHealthAPI.clear(), l?.(null)), window.dispatchEvent(new Event("smartnf-health-account-changed")), W.current = false, await zt(0), Z.current && B(Y ? "건강정보 저장 동의를 철회하고 해당 건강기록을 삭제했습니다. 회원 계정과 별도 선택 식품·장보기·외식 계획은 유지됩니다." : "저장 동의를 확인했습니다. 건강정보를 입력할 수 있습니다.");
        } catch (v) {
          Z.current && (yt(), k(true), B(v.message));
        } finally {
          window.SmartNFHealthAPI.broadcast(), window.dispatchEvent(new Event("smartnf-health-account-changed")), W.current = false, Z.current && L(false);
        }
      }
    }
    function ol(Y) {
      return O.default.createElement("section", { className: "nr-card mh-snapshot" }, O.default.createElement("h3", null, n === "history" ? "과거 저장본" : "최신 건강정보"), O.default.createElement("p", null, "입력해 저장한 항목만 표시합니다. 비어 있는 항목을 정상으로 판정하지 않습니다."), O.default.createElement("p", { className: "mh-saved-at" }, "마지막 저장: ", Oo(Y.savedAt), " · 저장본 #", Y.id), Mo(r, Y.fields).map((v) => O.default.createElement("section", { className: "mh-group", key: v.title }, O.default.createElement("h4", null, v.title), O.default.createElement("dl", null, v.rows.map(([x, H]) => O.default.createElement(O.default.Fragment, { key: x }, O.default.createElement("dt", null, _o(x, H)), O.default.createElement("dd", null, Do(Y.fields[x], x))))))), Object.keys(Y.fields).filter((v) => !r?.[v]).map((v) => O.default.createElement("p", { key: v }, v, ": ", Do(Y.fields[v], v))), n === "history" && O.default.createElement("p", null, "조회용 과거 기록입니다. 현재 저장본으로 자동 적용하지 않습니다."));
    }
    function Nl(Y, v) {
      let x = s[Y] || [], H = x[0] || "";
      if (Y === "conditions" || Y === "goal") return O.default.createElement("fieldset", { className: "mh-conditions" }, O.default.createElement("legend", null, Y === "conditions" ? "진단받은 질환" : "관리 목표", " (복수 선택)"), O.default.createElement("div", { className: "mh-condition-options" }, (Y === "conditions" ? ja : v.options || []).map((K) => O.default.createElement("label", { key: K }, O.default.createElement("input", { type: "checkbox", checked: x.includes(K), onChange: (ot) => pl(Y, ot.target.checked ? [...x, K] : x.filter((Ot) => Ot !== K)) }), O.default.createElement("span", null, Y === "goal" && K === "체중 관리" ? "다이어트" : K)))));
      let w = { id: "mh-" + Y, name: Y, value: H, onChange: (K) => pl(Y, [K.target.value]) };
      return O.default.createElement("label", { className: "mh-field", key: Y, htmlFor: w.id }, _o(Y, v), v.kind === "select" ? O.default.createElement("select", { ...w }, O.default.createElement("option", { value: "" }, "미입력"), (v.options || []).filter((K) => K !== "").map((K) => O.default.createElement("option", { value: K, key: K }, K))) : v.kind === "textarea" ? O.default.createElement("textarea", { ...w, maxLength: 2e3, rows: 3 }) : O.default.createElement("input", { ...w, type: v.kind === "number" ? "number" : ["date", "month"].includes(v.kind) ? v.kind : "text", min: v.kind === "number" ? v.min : void 0, max: v.kind === "number" ? v.max : void 0, step: v.kind === "number" ? 10 ** -v.scale : void 0, maxLength: Y === "labSource" ? 120 : 2e3 }));
    }
    return O.default.createElement("div", { className: "my-health" }, O.default.createElement("p", null, "나의 계정에 저장한 건강정보입니다. 헬스케어의 계정 저장 기능과 같은 데이터를 사용합니다."), O.default.createElement("div", { className: "mh-tabs", role: "group", "aria-label": "나의 건강정보 보기" }, [["latest", "최신 건강정보"], ["history", "저장 이력"], ["consent", "저장 동의·삭제 관리"]].map(([Y, v]) => O.default.createElement("button", { type: "button", key: Y, disabled: D, "aria-pressed": n === Y, onClick: () => Kt(Y) }, v)), O.default.createElement("button", { type: "button", disabled: D, onClick: Lt }, "다시 불러오기")), O.default.createElement("p", { role: "status", "aria-live": "polite" }, pt), u && !u.agreed && O.default.createElement("section", { className: "nr-card" }, O.default.createElement("h3", null, "건강정보 저장 동의"), O.default.createElement("p", null, "저장한 건강정보를 조회·수정하려면 별도의 건강정보 저장 동의가 필요합니다."), O.default.createElement("a", { href: "/mypage/consent/document", target: "_blank", rel: "noopener" }, "저장 안내 전체 보기"), O.default.createElement("label", null, O.default.createElement("input", { type: "checkbox", disabled: D, checked: S, onChange: (Y) => Q(Y.target.checked) }), "안내를 확인하고 건강정보 저장에 동의합니다."), O.default.createElement("button", { disabled: D || !S, onClick: () => _l() }, "동의하고 건강정보 열기")), u?.agreed && r && (!j || s !== null) && O.default.createElement(O.default.Fragment, null, n === "latest" && O.default.createElement(O.default.Fragment, null, !s && (c ? O.default.createElement(O.default.Fragment, null, ol(c), O.default.createElement("button", { type: "button", className: "nr-primary", onClick: nt, disabled: D }, "건강정보 수정"), O.default.createElement("p", null, "수정 후에는 관리항목을 다시 검토하세요.")) : O.default.createElement("section", { className: "nr-card" }, O.default.createElement("h3", null, "저장된 건강정보가 없습니다"), O.default.createElement("p", null, "건강정보 입력과 계정 저장은 별개입니다. 처음 입력한 정보도 여기에서 계정에 저장할 수 있습니다."), O.default.createElement("button", { type: "button", className: "nr-primary", disabled: D, onClick: nt }, "건강정보 입력하기"))), s && O.default.createElement("form", { className: "mh-edit", onSubmit: wt }, O.default.createElement("fieldset", { disabled: D || j || !!F.current }, O.default.createElement("legend", null, "나의 건강정보 입력·수정"), O.default.createElement("p", null, "모르는 항목은 비워두세요. 입력 내용으로 진단이나 치료 목표를 자동 확정하지 않습니다. 알레르기는 이 저장 범위에 포함되지 않습니다."), Mo(r, s, true).map((Y) => O.default.createElement("section", { className: "mh-group", key: Y.title }, O.default.createElement("h3", null, Y.title), O.default.createElement("div", { className: "mh-fields" }, Y.rows.map(([v, x]) => O.default.createElement(O.default.Fragment, { key: v }, Nl(v, x))))))), O.default.createElement("label", { className: "mh-ack" }, O.default.createElement("input", { type: "checkbox", disabled: D, checked: p, onChange: (Y) => N(Y.target.checked) }), "입력 내용을 확인했으며 나의 계정에 저장합니다."), O.default.createElement("button", { type: "submit", className: "nr-primary", disabled: D || j || !p || !At && !F.current }, D ? "저장 중…" : F.current ? "같은 내용 저장 다시 시도" : "변경사항 저장"), O.default.createElement("button", { type: "button", disabled: D, onClick: Lt }, "수정 취소·최신본 조회"))), n === "history" && O.default.createElement(O.default.Fragment, null, O.default.createElement("section", { className: "nr-card" }, O.default.createElement("h3", null, "날짜별 건강정보 저장 이력"), O.default.createElement("p", null, "입력한 건강정보의 저장 이력입니다. 하루 대표 측정·식사 기록과는 별도입니다."), b.length ? O.default.createElement("ul", { className: "mh-history" }, b.map((Y) => O.default.createElement("li", { key: Y.id }, O.default.createElement("button", { type: "button", disabled: D, onClick: () => Jt(Y.id) }, Oo(Y.savedAt), " · 저장본 #", Y.id)))) : O.default.createElement("p", null, "저장 이력이 없습니다."), O.default.createElement("div", { className: "mh-tabs" }, O.default.createElement("button", { disabled: D || h === 0, onClick: () => zt(h - 1) }, "이전 이력"), O.default.createElement("span", null, h + 1, " 페이지"), O.default.createElement("button", { disabled: D || b.length < 20, onClick: () => zt(h + 1) }, "다음 이력"))), M && ol(M)), n === "consent" && O.default.createElement("section", { className: "nr-card" }, O.default.createElement("h3", null, "건강정보 저장 동의·삭제 관리"), O.default.createElement("p", null, "현재 건강정보 저장에 동의한 상태입니다. 일반적인 정보 수정은 최신 건강정보에서 진행하세요."), O.default.createElement("a", { href: "/mypage/consent/document", target: "_blank", rel: "noopener" }, "저장 안내·삭제 범위 전체 확인"), O.default.createElement("details", { className: "mh-danger" }, O.default.createElement("summary", null, "동의 철회와 건강기록 전체 삭제"), O.default.createElement("p", null, "건강정보·질환/측정/관리항목·일일 기록·식사 기록이 모두 삭제되며 재동의해도 복원되지 않습니다. 회원 계정·동의 이력 및 별도 선택 식품·장보기·외식 계획은 유지됩니다."), O.default.createElement("button", { type: "button", disabled: D, onClick: () => _l(true) }, "저장 동의 철회·해당 건강기록 전체 삭제")))));
  }
  var at = Ul(yl());
  var cv = ["energy", "protein", "carbohydrate", "fat", "sodium", "sugars", "fiber", "saturated_fat"];
  function fv(t) {
    let l = /* @__PURE__ */ new Set();
    return t.trimEnd().split(`
`).map((e) => {
      let n = e.split("	");
      if (n.length !== 14 || l.has(n[0])) throw Error("기준 자료 형식을 확인할 수 없습니다.");
      l.add(n[0]);
      let a = {};
      return cv.forEach((u, i) => {
        if (n[i + 6] !== "") {
          let c = Number(n[i + 6]);
          if (!Number.isFinite(c)) throw Error("성분 자료 오류");
          a[u] = c;
        }
      }), { id: n[0], name: n[1], version: n[2], source: n[3], basis: n[4], group: n[5], nutrients: a };
    });
  }
  var Oc;
  function Cc() {
    return Oc || (Oc = fetch("/js/data/food-nutrition/meal-references.tsv", { cache: "no-cache" }).then((t) => {
      if (!t.ok) throw Error("기준 자료를 불러오지 못했습니다. 다시 시도해 주세요.");
      return t.text();
    }).then(fv).catch((t) => {
      throw Oc = null, t;
    })), Oc;
  }
  var Ga = (t) => t === "100g edible portion" ? "100g 가식부" : t || "기준량 미확인";
  function Mc(t, l, e = "all") {
    let n = l.normalize("NFKC").toLocaleLowerCase().replaceAll("칼치", "갈치").trim().split(/\s+/).filter(Boolean);
    return t.filter((a) => (e === "all" || a.id.startsWith(e + ":")) && n.every((u) => (a.name + " " + a.group).toLocaleLowerCase().includes(u)));
  }
  function Ho({ ids: t, onChange: l }) {
    let [e, n] = (0, at.useState)([]), [a, u] = (0, at.useState)(""), [i, c] = (0, at.useState)("all"), [f, r] = (0, at.useState)(40), [y, b] = (0, at.useState)(""), [m, h] = (0, at.useState)(0);
    (0, at.useEffect)(() => {
      let s = true;
      return b(""), Cc().then((o) => {
        s && n(o);
      }).catch((o) => {
        s && b(o.message);
      }), () => {
        s = false;
      };
    }, [m]);
    let T = Mc(e, a, i), M = new Map(e.map((s) => [s.id, s]));
    function _(s) {
      !t.includes(s) && t.length >= 20 || l(t.includes(s) ? t.filter((o) => o !== s) : [...t, s]);
    }
    return at.default.createElement("div", { className: "ingredient-search" }, at.default.createElement("p", null, "식재료·식품 영양정보와 같은 전체 자료를 검색합니다. 조리 상태·출처·기준량을 확인하세요. 조리된 음식 자료를 선택해도 그 음식의 재료가 자동으로 연결되지는 않습니다."), at.default.createElement("label", null, "재료·식품 검색", at.default.createElement("input", { type: "search", placeholder: "예: 갈치, 우유, 샌드위치", value: a, onChange: (s) => {
      u(s.target.value), r(40);
    } })), at.default.createElement("label", null, "자료 출처", at.default.createElement("select", { "aria-label": "자료 출처", value: i, onChange: (s) => {
      c(s.target.value), r(40);
    } }, at.default.createElement("option", { value: "all" }, "전체 자료"), at.default.createElement("option", { value: "rda_10_4" }, "농촌진흥청 · 식재료·가공식품"), at.default.createElement("option", { value: "mfds_dishes" }, "식품의약품안전처 · 음식"))), y ? at.default.createElement("p", { role: "alert" }, y, " ", at.default.createElement("button", { type: "button", onClick: () => h((s) => s + 1) }, "다시 시도")) : e.length ? at.default.createElement(at.default.Fragment, null, at.default.createElement("p", null, "선택 ", t.length, "/20개 · 검색 결과 ", T.length.toLocaleString("ko-KR"), "개 / 전체 ", e.length.toLocaleString("ko-KR"), "개"), t.length > 0 && at.default.createElement("div", null, at.default.createElement("strong", null, "선택한 기준 자료"), at.default.createElement("ul", null, t.map((s) => at.default.createElement("li", { key: s }, M.get(s)?.name || s, " · ", Ga(M.get(s)?.basis), " ", at.default.createElement("button", { type: "button", onClick: () => _(s) }, "선택 해제"))))), at.default.createElement("div", { className: "ingredient-options" }, T.slice(0, f).map((s) => at.default.createElement("label", { key: s.id }, at.default.createElement("input", { type: "checkbox", checked: t.includes(s.id), disabled: !t.includes(s.id) && t.length >= 20, onChange: () => _(s.id) }), at.default.createElement("span", null, s.name, at.default.createElement("br", null), at.default.createElement("small", null, s.source, " · ", s.group, " · ", Ga(s.basis), " · ", s.id))))), !T.length && at.default.createElement("p", null, "검색 결과가 없습니다. 다른 명칭으로 검색하거나 출처를 전체로 바꿔 보세요."), T.length > f && at.default.createElement("button", { type: "button", onClick: () => r((s) => s + 40) }, "검색 결과 더 보기")) : at.default.createElement("p", { role: "status" }, "기준 자료를 불러옵니다."));
  }
  var U = Ul(yl());
  var Et = Ul(yl());
  function pe(t) {
    return /^\d{4}-\d{2}-\d{2}$/.test(t) && !Number.isNaN(Date.parse(t + "T00:00:00Z")) && (/* @__PURE__ */ new Date(t + "T00:00:00Z")).toISOString().slice(0, 10) === t;
  }
  function ye(t) {
    if (!/^\d{4}-\d{2}$/.test(t) || !pe(t + "-01")) throw Error("Invalid month");
    let [l, e] = t.split("-").map(Number), n = new Date(Date.UTC(l, e - 1, 1)).getUTCDay(), a = new Date(Date.UTC(l, e, 0)).getUTCDate();
    return Array.from({ length: 42 }, (u, i) => {
      let c = i - n + 1;
      return c > 0 && c <= a ? t + "-" + String(c).padStart(2, "0") : null;
    });
  }
  function te(t, l) {
    if (!pe(t + "-01")) throw Error("Invalid month");
    let [e, n] = t.split("-").map(Number);
    return new Date(Date.UTC(e, n - 1 + l, 1)).toISOString().slice(0, 7);
  }
  function Jh(t, l) {
    let e = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
    for (let n of t) n.date === l && Object.hasOwn(e, n.meal) && e[n.meal]++;
    return e;
  }
  function bn() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(/* @__PURE__ */ new Date());
  }
  var kh = { breakfast: ["아", "아침"], lunch: ["점", "점심"], dinner: ["저", "저녁"], snack: ["간", "간식"] };
  function xo({ selected: t, onSelect: l, rows: e = [], today: n, available: a = true }) {
    let [u, i] = (0, Et.useState)(t.slice(0, 7));
    (0, Et.useEffect)(() => i(t.slice(0, 7)), [t]);
    let c = ye(u);
    return Et.default.createElement("section", { className: "mc-calendar", "aria-label": "식사 기록 월간 달력" }, Et.default.createElement("div", { className: "mc-heading" }, Et.default.createElement("button", { type: "button", "aria-label": "이전 달", disabled: u <= "1900-01", onClick: () => i(te(u, -1)) }, "‹"), Et.default.createElement("h3", null, Number(u.slice(0, 4)), "년 ", Number(u.slice(5)), "월"), Et.default.createElement("button", { type: "button", "aria-label": "다음 달", disabled: u >= n.slice(0, 7), onClick: () => i(te(u, 1)) }, "›"), Et.default.createElement("button", { type: "button", onClick: () => {
      i(n.slice(0, 7)), l(n);
    } }, "오늘")), Et.default.createElement("p", { className: "nr-muted" }, a ? "아·점·저·간 표시는 해당 끼니의 기록 유무입니다. 미기록은 결식을 의미하지 않습니다." : "식사 저장 연결 전입니다. 개인 식사 여부를 조회하지 않으며 달력에는 기록 상태를 표시하지 않습니다."), Et.default.createElement("table", { className: "mc-table" }, Et.default.createElement("caption", { className: "sr-only" }, u, " 식사 기록 날짜 선택"), Et.default.createElement("thead", null, Et.default.createElement("tr", null, ["일", "월", "화", "수", "목", "금", "토"].map((f) => Et.default.createElement("th", { scope: "col", key: f }, f)))), Et.default.createElement("tbody", null, Array.from({ length: 6 }, (f, r) => Et.default.createElement("tr", { key: r }, c.slice(r * 7, r * 7 + 7).map((y, b) => {
      if (!y) return Et.default.createElement("td", { key: "blank" + b, "aria-hidden": "true" });
      let m = Jh(e, y), h = a ? Object.entries(kh).map(([T, [, M]]) => M + (m[T] ? " 기록 " + m[T] + "개" : " 미기록")).join(", ") : "식사 저장 미연결";
      return Et.default.createElement("td", { key: y }, Et.default.createElement("button", { type: "button", "data-calendar-date": y, disabled: y > n, "aria-label": y + " " + h, "aria-pressed": y === t, "aria-current": y === n ? "date" : void 0, onClick: () => l(y) }, Et.default.createElement("span", { className: "mc-day" }, Number(y.slice(-2))), a ? Et.default.createElement("span", { className: "mc-dots" }, Object.entries(kh).map(([T, [M, _]]) => Et.default.createElement("span", { key: T, className: m[T] ? "has-entry" : "", title: _ + (m[T] ? " 기록 있음" : " 미기록") }, M))) : Et.default.createElement("span", { className: "mc-unlinked" }, "—")));
    }))))), a && Et.default.createElement("p", { className: "nr-muted" }, "채움: 기록 있음 · 테두리: 미기록 · 선택 날짜 ", t));
  }
  var Xt = Ul(yl());
  function Bo(t, l) {
    let e = t?.[l];
    return typeof e == "number" && Number.isFinite(e) ? e : null;
  }
  function Wh(t) {
    return String(t).match(/생것|삶은것|데친것|구운것(?:\(팬\))?|찐것|튀긴것|말린것/)?.[0] || "원자료에 별도 조리 상태 표시 없음 · 확인 필요";
  }
  var qo = { energy: ["열량", "kcal"], protein: ["단백질", "g"], carbohydrate: ["탄수화물", "g"], fat: ["지방", "g"], sodium: ["나트륨", "mg"], sugars: ["당류", "g"], fiber: ["식이섬유", "g"], saturated_fat: ["포화지방", "g"] }, Dc = { breakfast: "아침", lunch: "점심", dinner: "저녁", snack: "간식" };
  function Yo({ items: t = [] }) {
    return Xt.default.createElement("section", { className: "nr-card" }, Xt.default.createElement("h3", null, "재료·식품별 원자료 기준 성분"), Xt.default.createElement("p", null, "실제 섭취량·음식 전체의 성분이 아닙니다. 서로 더하거나 권장량과 비교하지 않습니다. 생것·삶은것 등 원자료 식품명과 조리 상태를 확인하세요."), !t.some((l) => l.ingredients?.length) && Xt.default.createElement("p", null, "아직 확인한 재료를 연결하지 않았습니다. 음식명으로 재료를 자동 추정하지 않습니다. 이 음식의 수정 화면에서 재료를 선택·확인하면 준비된 기준 성분을 볼 수 있습니다. 목록에 없는 재료는 표시할 수 없습니다."), t.map((l, e) => Xt.default.createElement("section", { key: e, className: "ingredient-dish" }, Xt.default.createElement("h4", null, l.name), l.ingredients?.length ? l.ingredients.map((n, a) => Xt.default.createElement("div", { key: a, className: "ingredient-reference" }, Xt.default.createElement("h5", null, n.name), Xt.default.createElement("p", null, n.kind === "LEGACY_FOOD" ? "기존 선택 식품의 참고 자료 · 이 음식의 재료로 확인된 것은 아닙니다." : "사용자가 확인해 연결한 재료·식품 기준 자료 · 전체 재료 목록을 의미하지 않습니다."), Xt.default.createElement("div", { className: "ingredient-table-scroll" }, Xt.default.createElement("table", null, Xt.default.createElement("caption", null, n.name, " · ", Ga(n.basis || "100g edible portion"), " 기준 성분"), Xt.default.createElement("thead", null, Xt.default.createElement("tr", null, Object.entries(qo).map(([u, [i, c]]) => Xt.default.createElement("th", { key: u }, i, " (", c, ")")))), Xt.default.createElement("tbody", null, Xt.default.createElement("tr", null, Object.keys(qo).map((u) => Xt.default.createElement("td", { key: u }, Bo(n.nutrients, u) !== null ? Bo(n.nutrients, u).toLocaleString("ko-KR", { maximumFractionDigits: 5 }) : "정보 없음")))))), Xt.default.createElement("p", { className: "nr-muted" }, "원자료 식품명: ", n.name, " · 기준량: ", Ga(n.basis || "100g edible portion"), " · 조리 상태: ", Wh(n.name), " · 출처: ", n.source, " · 버전: ", n.version), Xt.default.createElement("a", { href: "/preview/health/foods?food=" + encodeURIComponent(n.foodId) }, "원자료 상세"))) : Xt.default.createElement("p", null, "확인한 재료 연결 전 · 음식 기록은 저장되어 있습니다."))));
  }
  var we = (t, l) => window.SmartNFHealthAPI.request(t, l), Lo = (t = "breakfast") => ({ meal: t, name: "", time: "", note: "", ingredientIds: [], ingredientsConfirmed: false }), Ku = (t) => ({ meal: t.meal, name: t.name, time: t.time || "", note: t.note || "", ingredientIds: [...t.ingredientIds || t.ingredients?.filter((l) => l.kind === "CONFIRMED").map((l) => l.foodId) || []].sort(), ingredientsConfirmed: !!t.ingredientsConfirmed });
  function wo({ initialDate: t, onDateChange: l, onDirty: e }) {
    let [n, a] = (0, U.useState)(t), [u, i] = (0, U.useState)(t), [c, f] = (0, U.useState)(null), [r, y] = (0, U.useState)(null), [b, m] = (0, U.useState)(Lo), [h, T] = (0, U.useState)(""), [M, _] = (0, U.useState)(false), [s, o] = (0, U.useState)(null), [p, N] = (0, U.useState)("breakfast"), [S, Q] = (0, U.useState)(null), [D, L] = (0, U.useState)("계정·저장 동의를 확인합니다."), [j, k] = (0, U.useState)(true), [pt, B] = (0, U.useState)(false), [Z, lt] = (0, U.useState)(t.slice(0, 7)), [W, F] = (0, U.useState)([]), [ut, At] = (0, U.useState)(null), [yt, zt] = (0, U.useState)("달력 기록 조회 대기"), [Vt, Lt] = (0, U.useState)(0), Kt = (0, U.useRef)(false), nt = (0, U.useRef)(true), pl = (0, U.useRef)(null), wt = (0, U.useRef)(null), Jt = (0, U.useRef)(null), _l = (0, U.useRef)(null);
    pl.current = r;
    let ol = bn(), Nl = M && JSON.stringify(Ku(b)) !== h;
    (0, U.useEffect)(() => (e?.(Nl), () => e?.(false)), [Nl, e]), (0, U.useEffect)(() => {
      let V = (P) => {
        Nl && (P.preventDefault(), P.returnValue = "");
      };
      return window.addEventListener("beforeunload", V), () => window.removeEventListener("beforeunload", V);
    }, [Nl]), (0, U.useEffect)(() => {
      M && (Jt.current?.scrollIntoView({ block: "start" }), _l.current?.focus({ preventScroll: true }));
    }, [M, s, p]);
    function Y() {
      _(false), o(null), m(Lo()), T("");
    }
    function v() {
      y(null), f(null), F([]), At(null), Y(), Q(null), wt.current = null;
    }
    async function x(V) {
      if (!Kt.current) {
        window.SmartNFActionConfirm.cancel?.(), Kt.current = true, k(true);
        try {
          let P = await we("/consent");
          if (!P.agreed) {
            v(), L("식사 기록이 포함된 저장 안내에 동의해 주세요.");
            return;
          }
          let rt = await we("/meals/day?date=" + V), Bt = await we("/consent");
          if (!Bt.agreed || Bt.eventId !== P.eventId) throw Error("동의 상태가 변경되었습니다.");
          if (!nt.current) return;
          y(P), f(rt), a(V), i(V), l?.(V), Y(), Q(null), B(false), wt.current = null, L(rt.items.length ? "저장된 식사를 불러왔습니다." : "이 날짜에는 저장된 식사가 없습니다. 음식 추가로 기록해 보세요."), Lt((rl) => rl + 1);
        } catch (P) {
          nt.current && (v(), L(P.message));
        } finally {
          Kt.current = false, nt.current && k(false);
        }
      }
    }
    (0, U.useEffect)(() => {
      nt.current = true, x(t);
      let V = async () => {
        if (!(Kt.current || !pl.current)) try {
          let P = await we("/consent");
          (!P.agreed || P.eventId !== pl.current?.eventId) && (v(), L("저장 동의가 변경되었습니다. 안내 확인 후 다시 불러와 주세요."));
        } catch (P) {
          v(), L(P.message);
        }
      };
      return window.addEventListener("focus", V), () => {
        nt.current = false, window.removeEventListener("focus", V);
      };
    }, []), (0, U.useEffect)(() => {
      if (!r?.agreed) return;
      let V = false;
      At(null), F([]), zt("달력 기록을 불러오는 중입니다.");
      let P = te(Z, 1) + "-01", rt = new Date(Date.parse(P + "T00:00:00Z") - 864e5).toISOString().slice(0, 10), Bt = rt > ol ? ol : rt;
      return (async () => {
        try {
          let rl = await we("/meals?from=" + Z + "-01&to=" + Bt), El = await we("/consent");
          if (V || !nt.current) return;
          if (!El.agreed || El.eventId !== r.eventId) {
            v(), L("동의가 변경되어 기록을 숨겼습니다.");
            return;
          }
          F(rl.flatMap((qt) => qt.items.map((Vn) => ({ ...Vn, date: qt.date })))), At(Z), zt("");
        } catch (rl) {
          if (V || !nt.current) return;
          F([]), At(null), zt("달력 조회 실패: " + rl.message), [401, 403, 409].includes(rl.status) && v();
        }
      })(), () => {
        V = true;
      };
    }, [Z, r?.eventId, Vt]);
    let H = () => !Nl || confirm("저장하지 않은 음식 입력을 버릴까요?");
    function w(V) {
      if (!j) {
        if (V === n) {
          i(V);
          return;
        }
        if (!pe(V) || V < "1900-01-01" || V > ol) {
          L("조회 날짜를 확인하세요.");
          return;
        }
        H() && x(V);
      }
    }
    function K(V = null, P = "breakfast") {
      if (j || pt || !c || !H()) return;
      let rt = V === null ? Lo(P) : Ku(c.items[V]);
      o(V), N(rt.meal), m(rt), T(JSON.stringify(Ku(rt))), _(true), Q(null), L(V === null ? "새 음식을 입력하고 식사 저장을 눌러 주세요." : "저장된 음식의 수정 화면입니다. 변경 후 수정 저장을 눌러 주세요.");
    }
    async function ot(V, P) {
      if (Kt.current || !c || !r || pt) return false;
      let rt = V.length === 0;
      if (!rt && c.items.some((El) => El.legacy) && !await window.SmartNFActionConfirm("이 날짜의 이전 형식 참고 식품·과거 무게는 다시 저장할 때 정리됩니다. 확인한 재료를 선택했는지 확인하고 저장할까요?")) return false;
      Kt.current = true, k(true);
      let Bt = { date: n, expectedRevision: c.revision, consentEventId: r.eventId, ...rt ? {} : { items: V.map(Ku) } }, rl = JSON.stringify({ remove: rt, ...Bt });
      try {
        if (!wt.current || wt.current.key !== rl) {
          if (!crypto.randomUUID) throw Error("localhost 또는 HTTPS의 최신 브라우저에서 요청 ID를 생성할 수 있어야 합니다.");
          wt.current = { key: rl, id: crypto.randomUUID() };
        }
        let El = await we("/meals" + (rt ? "/delete" : ""), { ...Bt, requestId: wt.current.id }), qt = await we("/consent");
        return !qt.agreed || qt.eventId !== r.eventId ? (v(), L("동의가 변경되어 기록을 숨겼습니다."), false) : nt.current ? (f(El), Y(), Q(null), wt.current = null, Lt((Vn) => Vn + 1), L(P === "delete" ? "선택한 식사를 삭제했습니다." : "식사 기록을 계정에 저장했습니다."), true) : false;
      } catch (El) {
        if (L(El.message), [401, 403].includes(El.status)) v();
        else if (El.status === 409) {
          B(true), L("기록 또는 동의가 변경되었습니다. 입력을 확인한 뒤 다시 불러와 주세요.");
          try {
            let qt = await we("/consent");
            (!qt.agreed || qt.eventId !== r.eventId) && v();
          } catch {
            v();
          }
        }
        return false;
      } finally {
        Kt.current = false, nt.current && k(false);
      }
    }
    function Ot(V) {
      if (V.preventDefault(), !b.name.trim() || b.ingredientIds.length && !b.ingredientsConfirmed || s === null && c.items.length >= 50) {
        L("음식명을 입력하고 선택한 재료 확인란을 체크해 주세요. 날짜당 최대 50개입니다.");
        return;
      }
      let P = Ku({ ...b, name: b.name.trim() }), rt = s === null ? [...c.items, P] : c.items.map((Bt, rl) => rl === s ? P : Bt);
      ot(rt, "save");
    }
    async function ee(V) {
      j || pt || await window.SmartNFActionConfirm((Nl ? "저장하지 않은 입력을 버리고, " : "") + "「" + c.items[V].name + "」 식사 기록을 삭제할까요? 복원할 수 없습니다.") && ot(c.items.filter((P, rt) => rt !== V), "delete");
    }
    let Qa = M && U.default.createElement("section", { className: "nr-card meal-editor", ref: Jt, "aria-label": s === null ? "음식 추가 화면" : "음식 수정 화면" }, U.default.createElement("h3", null, n, " · ", Dc[p], " · ", s === null ? "음식 추가" : "음식 수정"), Nl && U.default.createElement("p", { className: "meal-unsaved", role: "status" }, "저장하지 않은 변경사항이 있습니다."), U.default.createElement("fieldset", { disabled: j || pt }, U.default.createElement("form", { onSubmit: Ot }, U.default.createElement("label", null, "음식명", U.default.createElement("input", { ref: _l, maxLength: 120, required: true, value: b.name, onChange: (V) => m((P) => ({ ...P, name: V.target.value })), placeholder: "예: 점심에 먹은 비빔밥" })), U.default.createElement("label", null, "끼니", U.default.createElement("select", { "aria-label": "끼니", value: b.meal, onChange: (V) => m((P) => ({ ...P, meal: V.target.value })) }, Object.entries(Dc).map(([V, P]) => U.default.createElement("option", { key: V, value: V }, P)))), U.default.createElement("label", null, "시간 (선택)", U.default.createElement("input", { type: "time", value: b.time, onChange: (V) => m((P) => ({ ...P, time: V.target.value })) })), U.default.createElement("label", null, "메모 (선택)", U.default.createElement("textarea", { maxLength: 500, value: b.note, onChange: (V) => m((P) => ({ ...P, note: V.target.value })) })), U.default.createElement("fieldset", null, U.default.createElement("legend", null, "관련 재료·식품 선택 (선택)"), U.default.createElement(Ho, { foodName: b.name, ids: b.ingredientIds, onChange: (V) => m((P) => ({ ...P, ingredientIds: V, ingredientsConfirmed: false })) }), b.ingredientIds.length > 0 && U.default.createElement("label", { className: "ingredient-confirm" }, U.default.createElement("input", { type: "checkbox", checked: b.ingredientsConfirmed, onChange: (V) => m((P) => ({ ...P, ingredientsConfirmed: V.target.checked })) }), "선택한 자료가 기록한 재료·식품에 해당함을 확인했습니다. 전체 재료를 확인했다는 뜻은 아닙니다.")), U.default.createElement("div", { className: "meal-actions" }, U.default.createElement("button", { className: "nr-primary", type: "submit", disabled: !Nl }, s === null ? "식사 저장" : "수정 저장"), U.default.createElement("button", { type: "button", onClick: () => {
      H() && (Y(), L("저장된 식사를 확인하세요."));
    } }, "취소")))), U.default.createElement("p", { className: "nr-muted" }, "음식명만 저장할 수 있습니다. 재료·식품 성분은 원자료에 표시된 기준량의 참고 자료이며 섭취량·합계를 계산하지 않습니다."));
    return U.default.createElement(U.default.Fragment, null, U.default.createElement("p", { role: "status", "aria-live": "polite" }, j ? "처리 중입니다." : D), r?.agreed ? U.default.createElement(U.default.Fragment, null, U.default.createElement("div", { className: "meal-query" }, U.default.createElement("label", null, "조회 날짜", U.default.createElement("input", { type: "date", min: "1900-01-01", max: ol, disabled: j, value: u, onChange: (V) => i(V.target.value) })), U.default.createElement("button", { className: "meal-query-submit", type: "button", disabled: j, onClick: () => w(u) }, "조회")), U.default.createElement("div", { className: "mc-layout" }, U.default.createElement(xo, { selected: n, onSelect: w, rows: W, today: ol, onMonthChange: lt, available: ut === Z, availableMonth: ut, unavailableText: yt || "달력 조회 상태 확인 필요" }), U.default.createElement("div", { className: "mc-details" }, U.default.createElement("section", { className: "nr-card meal-saved-list" }, U.default.createElement("div", { className: "nr-card-head" }, U.default.createElement("h3", null, n, " ", c?.items.length ? "저장된 식사" : "식사 기록"), U.default.createElement("button", { type: "button", disabled: j || pt, onClick: () => K() }, "음식 추가")), !c?.items.length && U.default.createElement("p", null, "저장된 식사가 없습니다. 음식 추가로 기록해 보세요."), Object.entries(Dc).map(([V, P]) => U.default.createElement("section", { key: V, className: "meal-saved-group", "data-meal-group": V }, U.default.createElement("div", { className: "nr-card-head" }, U.default.createElement("h4", null, P), U.default.createElement("button", { type: "button", disabled: j || pt, onClick: () => K(null, V) }, P, " 추가")), M && s === null && p === V && Qa, c?.items.some((rt) => rt.meal === V) ? U.default.createElement("ul", { className: "meal-saved-items" }, c.items.map((rt, Bt) => rt.meal === V && U.default.createElement("li", { key: Bt }, U.default.createElement("strong", null, rt.time ? rt.time + " · " : "", rt.name), rt.note && U.default.createElement("p", null, rt.note), U.default.createElement("div", { className: "meal-actions" }, U.default.createElement("button", { type: "button", disabled: j, "aria-expanded": S === Bt, "aria-controls": "meal-reference-" + Bt, onClick: () => Q((rl) => rl === Bt ? null : Bt) }, "재료 성분 보기"), U.default.createElement("button", { type: "button", disabled: j || pt, onClick: () => K(Bt) }, "수정"), U.default.createElement("button", { type: "button", disabled: j || pt, onClick: () => ee(Bt) }, "삭제")), M && s === Bt && Qa, S === Bt && U.default.createElement("div", { id: "meal-reference-" + Bt }, U.default.createElement(Yo, { items: [rt] }))))) : U.default.createElement("p", { className: "nr-muted" }, "미기록 · 식사하지 않았다는 뜻은 아닙니다."))))))) : U.default.createElement("p", null, U.default.createElement("a", { href: "/mypage/consent" }, "식사 기록·재료 연결을 포함한 저장 안내·동의 확인"), " ", U.default.createElement("button", { type: "button", disabled: j, onClick: () => x(n) }, "다시 불러오기")));
  }
  var Fh = `
.food-plans>.mc-calendar{position:static!important;top:auto!important;max-width:none;width:auto;box-sizing:border-box;margin:20px 0;isolation:isolate}
.food-plans .mc-table{border-collapse:separate;border-spacing:3px}
.food-plans .mc-table td{height:auto;vertical-align:top}
.food-plans .plan-calendar-day{border:1px solid #cbded4;border-radius:10px;padding:4px;display:flex;flex-direction:column;gap:2px;min-height:120px}
.food-plans .plan-calendar-day[data-current=true]{border:2px solid #18725a;background:#eff7f1}
.food-plans .mc-table .plan-calendar-day button{height:auto;min-height:27px;display:block;border:0;margin:0;padding:4px 2px;font-size:11px;line-height:1.5;background:transparent}
.food-plans .mc-table .plan-calendar-day>button:first-child{font-weight:700}
.food-plans .mc-table .plan-calendar-day .plan-calendar-count{min-height:24px;font-size:10px}
.food-plans .plan-detail-heading{clear:both;scroll-margin-top:110px;padding-top:12px;position:static}
.food-plans .plan-editor{display:block;position:static;clear:both;margin-top:16px}
.food-plans .plan-detail-card{display:block;position:static;padding:20px;margin:16px 0;border:1px solid #cbded4;border-radius:12px;background:#fff}
.food-plans [hidden]{display:none!important}
.food-plans .plan-origin-badge{display:inline-block;margin:0 0 10px;padding:5px 10px;border-radius:20px;font-size:12px;font-weight:700;background:#e8edf7;color:#274e83}
.food-plans [data-plan-origin=ai] .plan-origin-badge{background:#e0f2e8;color:#155c44}
.food-plans .plan-dish-summary{font-size:18px;font-weight:700;line-height:1.7;margin:0 0 12px;overflow-wrap:anywhere}
.food-plans .plan-simulation{margin:16px 0;padding:16px;border:1px solid #d6e5dd;border-radius:10px;background:#f7faf7}
.food-plans .plan-simulation details{padding:10px 0;border-bottom:1px solid #dde8e1}
.food-plans .plan-simulation summary{cursor:pointer;font-weight:700}
.food-plans .plan-simulation dl{display:grid;grid-template-columns:minmax(80px,1fr) minmax(0,2fr);gap:8px;padding:12px 0}
.food-plans .plan-simulation dd{margin:0;overflow-wrap:anywhere}
@media(max-width:600px){.food-plans>.mc-calendar{padding:8px}.food-plans .mc-table{border-spacing:1px}.food-plans .plan-calendar-day{padding:2px;min-height:116px}.food-plans .mc-table .plan-calendar-day .plan-calendar-count{font-size:9px;overflow-wrap:anywhere}.food-plans .plan-detail-card{padding:14px}}
`;
  var E = Ul(yl());
  var je = (t, l) => window.SmartNFHealthAPI.request("/plans" + t, l), jo = { CHOICE: "오늘의 선택", SHOPPING: "장보기", DINING: "외식" }, sv = (t) => t.simulation ? "AI 레시피·식단" : t.type === "CHOICE" || t.scope === "HEALTH" ? "헬스케어" : "헬스케어·MyPage", $h = { bp: "혈압 관리", diabetes: "혈당 관리", lipid: "혈중 지질 관리", weight: "체중 관리" }, Ju = (t) => ({ simulation: t.simulation?.input || null, scope: t.scope || "GENERAL", management: t.management || [], type: t.type, restaurant: t.restaurant || "", time: t.time || "", note: t.note || "", items: t.items.map((l) => ({ foodId: l.foodId, recipeId: l.recipeId || "", recipeVersion: l.recipeVersion || "", ingredientIndices: l.ingredients.map((e) => e.index) })) });
  function Go() {
    let t = new URLSearchParams(location.search).get("date");
    return pe(t) && t >= "1900-01-01" && t <= "2100-12-31" ? t : bn();
  }
  function Xo({ onDirty: t }) {
    let [l, e] = (0, E.useState)(Go), [n, a] = (0, E.useState)(Go), [u, i] = (0, E.useState)(null), [c, f] = (0, E.useState)([]), [r, y] = (0, E.useState)(null), [b, m] = (0, E.useState)(false), [h, T] = (0, E.useState)("계정의 계획을 확인하고 있습니다."), [M, _] = (0, E.useState)(true), [s, o] = (0, E.useState)([]), [p, N] = (0, E.useState)(""), [S, Q] = (0, E.useState)(""), [D, L] = (0, E.useState)(null), [j, k] = (0, E.useState)(0), [pt, B] = (0, E.useState)(false), [Z, lt] = (0, E.useState)(() => new URLSearchParams(location.search).get("shopping") === "1" ? "SHOPPING" : "ALL"), [W, F] = (0, E.useState)(0), ut = (0, E.useRef)(null), At = (0, E.useRef)(null);
    (0, E.useEffect)(() => {
      !M && u && At.current === l && (At.current = null, ut.current?.scrollIntoView?.({ block: "start", behavior: "auto" }), ut.current?.focus({ preventScroll: true }));
    }, [M, u, l, Z, W]);
    let yt = (0, E.useRef)(0), zt = (0, E.useRef)(false), Vt = (0, E.useRef)(true), Lt = (0, E.useRef)(null), Kt = (0, E.useRef)(null), nt = !!u && JSON.stringify(c.map(Ju)) !== JSON.stringify(u.plans.map(Ju));
    Kt.current = { date: l, day: u, draft: c, consent: r, dirty: nt }, (0, E.useEffect)(() => (t?.(nt), () => t?.(false)), [nt, t]), (0, E.useEffect)(() => {
      let v = (H) => {
        (Kt.current?.dirty || Lt.current) && (H.preventDefault(), H.returnValue = "");
      };
      window.addEventListener("beforeunload", v);
      let x = () => {
        if (zt.current) return;
        const before = Kt.current, seq = yt.current;
        je("/consent").then((H) => {
          if (!Vt.current || seq !== yt.current || zt.current || Kt.current.date !== before.date) return;
          if (H.eventId !== Kt.current.consent?.eventId || !H.agreed) { i(null); f([]); o([]); y(H); B(true); T("계정·저장 동의 상태를 다시 확인해 주세요."); }
          else if (Kt.current.dirty || Lt.current) T("저장하지 않은 변경 또는 저장 확인 대기 내용이 있어 자동 갱신을 보류했습니다.");
          else pl(Kt.current.date);
        }).catch((H) => { if (Vt.current && seq === yt.current && !zt.current) T(H.message); });
      };
      return window.addEventListener("focus", x), pl(Go()), () => {
        Vt.current = false, yt.current++, window.removeEventListener("beforeunload", v), window.removeEventListener("focus", x);
      };
    }, []);
    (0, E.useEffect)(() => {
      const shoppingChanged = async (event) => {
        const frame = document.getElementById("shopping-plan-frame");
        if (event.origin !== location.origin || event.source !== frame?.contentWindow) return;
        if (event.data?.type === "smartnf-shopping-height") {
          const height = Number(event.data.height);
          if (Number.isFinite(height)) frame.style.height = Math.min(4e3, Math.max(500, height)) + "px";
          return;
        }
        if (event.data?.type !== "smartnf-shopping-changed") return;
        const date = Kt.current?.date;
        if (!date) return;
        try {
          const from = date.slice(0, 7) + "-01", to = ye(date.slice(0, 7)).filter(Boolean).at(-1), rows = await je("/range?from=" + from + "&to=" + to), merged = await (await import("/js/shopping-calendar.js?v=storage220")).mergeShoppingCounts(rows, from, to);
          if (Vt.current && Kt.current?.date.slice(0, 7) === date.slice(0, 7)) o(merged);
        } catch (error) {
          if (Vt.current) T(error.message);
        }
      };
      window.addEventListener("message", shoppingChanged);
      return () => window.removeEventListener("message", shoppingChanged);
    }, []);
    async function pl(v) {
      if (zt.current) return;
      window.SmartNFActionConfirm.cancel?.();
      let x = ++yt.current;
      zt.current = true, _(true), i(null), f([]), o([]), B(false), Lt.current = null;
      try {
        let H = await je("/consent");
        if (!Vt.current || x !== yt.current) return;
        if (y(H), !H.agreed) {
          T("장보기·외식 계획 저장 안내를 확인해 주세요.");
          return;
        }
        let w = v.slice(0, 7) + "-01", K = ye(v.slice(0, 7)).filter(Boolean).at(-1), [ot, Ot] = await Promise.all([je("/day?date=" + v), je("/range?from=" + w + "&to=" + K)]), shoppingMerged = await (await import("/js/shopping-calendar.js?v=storage220")).mergeShoppingCounts(Ot, w, K), ee = await je("/consent");
        if (ee.eventId !== H.eventId || !ee.agreed) throw Error("저장 동의가 변경되었습니다. 다시 불러와 주세요.");
        Vt.current && x === yt.current && (e(v), a(v), i(ot), f(ot.plans), o(shoppingMerged), T("본인 계정의 저장 계획을 불러왔습니다. 계획은 실제 식사 기록과 별도입니다."));
      } catch (H) {
        Vt.current && x === yt.current && (B(true), T(H.message));
      } finally {
        zt.current = false, Vt.current && x === yt.current && _(false);
      }
    }
    function wt(v, x = "ALL", H = false) {
      if (!(!pe(v) || v < "1900-01-01" || v > "2100-12-31" || M)) {
        if (v === l) {
          H && (At.current = v, F((w) => w + 1)), lt(x), a(v);
          if (!Kt.current.dirty && !Lt.current) pl(v);
          else T("저장하지 않은 변경 또는 저장 확인 대기 내용이 있어 현재 편집을 유지했습니다.");
          return;
        }
        nt && !confirm("저장하지 않은 계획 변경을 버리고 날짜를 바꿀까요?") || (H && (At.current = v, F((w) => w + 1)), lt(x), pl(v));
      }
    }
    function Jt(v, x) {
      f((H) => H.map((w, K) => K === v ? { ...w, ...x } : w)), T("저장하지 않은 변경사항이 있습니다.");
    }
    async function _l(v = false) {
      if (!(zt.current || !r) && !(v && !await window.SmartNFActionConfirm("이 계정의 모든 장보기·외식 계획을 삭제하고 저장 동의를 철회할까요? 식사 기록은 유지됩니다."))) {
        zt.current = true, _(true);
        try {
          await je("/consent", { documentVersion: r.documentVersion, decision: v ? "WITHDRAWN" : "AGREED", expectedEventId: r.eventId }), zt.current = false, m(false), await pl(l);
        } catch (x) {
          T(x.message), zt.current = false, _(false);
        }
      }
    }
    async function ol(v = false, x = l) {
      if (zt.current || !u || !r?.agreed || pt) return;
      if (!v && c.some((w) => w.scope === "HEALTH" && !w.management?.length)) {
        T("건강관리 계획의 관리 목적을 하나 이상 선택하세요.");
        return;
      }
      if (!v && c.some((w) => !w.simulation && !w.items.length)) {
        T("빈 계획은 제거하거나 식품을 추가하세요.");
        return;
      }
      if (v && !await window.SmartNFActionConfirm("이 날짜의 장보기·외식 계획 전체를 삭제할까요?")) return;
      zt.current = true, _(true);
      let H = JSON.stringify({ remove: v, targetDate: x, plans: c.map(Ju), revision: u.revision, event: r.eventId });
      try {
        let w = Lt.current?.signature === H ? Lt.current.body : null;
        if (!w) {
          let K = u.revision, ot = c.map(Ju);
          if (x !== l) {
            let Ot = await je("/day?date=" + x);
            K = Ot.revision, ot = [...Ot.plans.map(Ju), ...ot];
          }
          w = { requestId: crypto.randomUUID(), expectedRevision: K, consentEventId: r.eventId, date: x, ...v ? {} : { plans: ot } }, Lt.current = { signature: H, body: w };
        }
        if (await je(v ? "/delete" : "", w), !Vt.current) return;
        if (Lt.current = null, zt.current = false, x === l) await pl(l), T(v ? "날짜 계획을 삭제했습니다." : "✓ MyPage 계획을 계정에 저장했습니다. 다시 로그인해도 복원됩니다.");
        else {
          T("✓ " + x + "에 계획을 추가 복사했습니다. 현재 날짜의 저장 전 편집은 그대로입니다.");
          let K = l.slice(0, 7) + "-01", ot = ye(l.slice(0, 7)).filter(Boolean).at(-1);
          je("/range?from=" + K + "&to=" + ot).then(async (Ot) => {
            const merged = await (await import("/js/shopping-calendar.js?v=storage220")).mergeShoppingCounts(Ot, K, ot);
            Vt.current && o(merged);
          }).catch(() => {
            Vt.current && T("복사 저장은 완료됐습니다. 달력 건수는 다시 불러와 확인하세요.");
          }), _(false);
        }
      } catch (w) {
        T(w.message + (w.status === 409 ? " 다른 탭의 변경이 있습니다. 다시 불러온 뒤 확인하세요. 같은 내용의 강제 덮어쓰기는 하지 않습니다." : "")), [401, 403, 409].includes(w.status) && (B(true), w.status !== 409 && (f([]), i(null), o([]), y(null)));
      } finally {
        zt.current = false, Vt.current && _(false);
      }
    }
    async function Nl() {
      try {
        L(await Cc());
      } catch (v) {
        T(v.message);
      }
    }
    let Y = D && S.trim() ? Mc(D, S).slice(0, 20) : [];
    return E.default.createElement("div", { className: "food-plans" }, E.default.createElement("style", null, Fh), E.default.createElement("p", { role: "status", "aria-live": "polite" }, h), E.default.createElement("p", null, "식사 준비·방문 계획입니다. 선택해도 실제 섭취로 기록하지 않습니다. 시뮬레이터 식단은 저장 시점의 영양 추정값을 함께 표시합니다."), E.default.createElement("a", { className: "nr-link", href: "/preview/health/foods" }, "영양정보에서 음식·재료 고르기"), E.default.createElement("button", { disabled: M, onClick: () => {
      (!nt || confirm("저장 전 변경을 버리고 다시 불러올까요?")) && pl(l);
    } }, "계획 다시 불러오기"), r && !r.agreed && E.default.createElement("section", { className: "nr-card" }, E.default.createElement("h3", null, "식단·장보기·외식 계획 저장 동의"), E.default.createElement("p", null, "건강정보 동의와 별도입니다. 선택한 날·계획 날짜·선택 식품·참고 재료·선택 메모 등을 저장합니다. 건강관리 계획은 관리 목적(혈압·혈당·혈중 지질·체중)도 함께 저장합니다. 이름·가족관계는 저장하지 않습니다."), E.default.createElement("a", { href: "/mypage/plans/document", target: "_blank", rel: "noopener" }, "개발용 저장 안내 전체 보기"), E.default.createElement("label", null, E.default.createElement("input", { type: "checkbox", checked: b, onChange: (v) => m(v.target.checked) }), "안내를 확인하고 계획 저장에 동의합니다."), E.default.createElement("button", { disabled: M || !b, onClick: () => _l() }, "동의하고 계획 열기")), r?.agreed && E.default.createElement(E.default.Fragment, null, E.default.createElement("div", { className: "nr-controls plan-date-controls" }, E.default.createElement("label", null, "조회 날짜", E.default.createElement("input", { type: "date", min: "1900-01-01", max: "2100-12-31", value: n, disabled: M, onChange: (v) => a(v.target.value) })), E.default.createElement("button", { disabled: M, onClick: () => wt(n, "ALL", true) }, "날짜 조회")), E.default.createElement("section", { className: "mc-calendar", "aria-label": "식단·장보기·외식·건강관리 계획 달력" }, E.default.createElement("div", { className: "mc-heading" }, E.default.createElement("button", { "aria-label": "계획 이전 달", disabled: M || l.slice(0, 7) <= "1900-01", onClick: () => wt(te(l.slice(0, 7), -1) + "-01") }, "‹"), E.default.createElement("h3", null, l.slice(0, 7)), E.default.createElement("button", { "aria-label": "계획 다음 달", disabled: M || l.slice(0, 7) >= "2100-12", onClick: () => wt(te(l.slice(0, 7), 1) + "-01") }, "›"), E.default.createElement("button", { disabled: M, onClick: () => wt(bn()) }, "오늘")), E.default.createElement("p", { className: "nr-muted" }, "저장한 계획 수입니다. 조회 실패·확인 중에는 건수를 표시하지 않습니다."), E.default.createElement("table", { className: "mc-table" }, E.default.createElement("caption", { className: "sr-only" }, "장보기·외식 계획 날짜 선택"), E.default.createElement("thead", null, E.default.createElement("tr", null, ["일", "월", "화", "수", "목", "금", "토"].map((v) => E.default.createElement("th", { key: v }, v)))), E.default.createElement("tbody", null, Array.from({ length: 6 }, (v, x) => E.default.createElement("tr", { key: x }, ye(l.slice(0, 7)).slice(x * 7, x * 7 + 7).map((H, w) => {
      let K = s.find((ot) => ot.date === H);
      return H ? E.default.createElement("td", { key: H }, E.default.createElement("div", { className: "plan-calendar-day", "data-current": H === l }, E.default.createElement("button", { "data-plan-date": H, disabled: M, "aria-pressed": H === l, onClick: () => wt(H, "ALL", true), "aria-label": H + " 전체 계획 보기" }, Number(H.slice(-2))), u ? E.default.createElement(E.default.Fragment, null, [["CHOICE", "오늘의 선택", K?.choice || 0], ["SHOPPING", "장보기", K?.shopping || 0], ["DINING", "외식", K?.dining || 0], ["HEALTH", "건강관리", K?.health || 0]].map(([ot, Ot, ee]) => E.default.createElement("button", { key: ot, className: "plan-calendar-count", disabled: M, onClick: () => wt(H, ot, true), "aria-label": H + " " + Ot + " " + ee + "건 상세 보기" }, Ot, " ", ee))) : E.default.createElement("small", null, "—"))) : E.default.createElement("td", { key: w });
    })))))), u && E.default.createElement(E.default.Fragment, null, E.default.createElement("h3", { ref: ut, tabIndex: -1, className: "plan-detail-heading" }, l, "의 식단·선택·저장 계획"), E.default.createElement("a", { href: "/preview/health/diet?planDate=" + l }, "식생활 관리 가이드에서 날짜 지정·추가·수정·삭제 →"), E.default.createElement("div", { className: "plan-list-filters", role: "group", "aria-label": "계획 목록 구분" }, [["ALL", "전체"], ["CHOICE", "오늘의 선택"], ["SHOPPING", "장보기"], ["DINING", "외식"], ["HEALTH", "건강관리"]].map(([v, x]) => E.default.createElement("button", { key: v, disabled: M, "aria-pressed": Z === v, onClick: () => lt(v) }, x))), Z === "SHOPPING" && E.default.createElement("section", { className: "plan-shopping-lists" }, E.default.createElement("h4", null, "장보기 예정일·재료 목록"), E.default.createElement("iframe", { id: "shopping-plan-frame", key: l, title: "저장한 장보기 재료 목록", src: "/mypage/shopping?embed=1&date=" + l, style: { width: "100%", height: "850px", border: 0 } })), !c.some((v) => Z === "ALL" || (Z === "HEALTH" ? v.scope === "HEALTH" && v.type !== "CHOICE" : v.type === Z && (Z === "CHOICE" || v.scope !== "HEALTH"))) && E.default.createElement("p", null, Z === "SHOPPING" ? "기존 선택 식품 계획은 없습니다. 재료 장보기 목록은 위에서 확인하세요." : "이 구분에 저장한 계획이 없습니다."), E.default.createElement("p", { role: "status" }, nt ? "저장하지 않은 변경사항" : "저장된 내용과 같습니다."), E.default.createElement("fieldset", { className: "plan-editor", disabled: M || pt }, E.default.createElement("legend", null, "저장 계획 확인·편집"), c.map((v, x) => E.default.createElement("section", { className: "nr-card plan-detail-card", key: x, "data-plan-origin": v.simulation ? "ai" : "health", hidden: Z !== "ALL" && (Z === "HEALTH" ? v.scope !== "HEALTH" || v.type === "CHOICE" : v.type !== Z || Z !== "CHOICE" && v.scope === "HEALTH") }, E.default.createElement("p", { className: "plan-origin-badge" }, sv(v)), E.default.createElement("p", { className: "plan-dish-summary" }, (v.simulation ? v.simulation.dishes : v.items).map((H) => H.name).join(" + ") || "식품을 추가해 주세요."), E.default.createElement("h4", null, v.scope === "HEALTH" ? "건강관리 · " + (v.management || []).map((H) => $h[H]).join(" · ") : "일반 계획", " · ", jo[v.type]), v.scope === "HEALTH" && E.default.createElement("fieldset", null, E.default.createElement("legend", null, "관리 목적 · 진단 기록과 별도"), Object.entries($h).map(([H, w]) => E.default.createElement("label", { key: H }, E.default.createElement("input", { type: "checkbox", checked: (v.management || []).includes(H), onChange: (K) => Jt(x, { management: K.target.checked ? [...v.management || [], H] : (v.management || []).filter((ot) => ot !== H) }) }), w))), E.default.createElement("label", null, "구분", E.default.createElement("select", { disabled: !!v.simulation, value: v.type, onChange: (H) => Jt(x, { type: H.target.value }) }, Object.entries(jo).map(([H, w]) => E.default.createElement("option", { key: H, value: H }, w)))), v.type === "DINING" && E.default.createElement("p", null, E.default.createElement("a", { href: "/preview/health/diet?planDate=" + l + "#dining-plan-guide" }, "건강 식생활 관리 가이드에서 식당·방문 시간 입력")), E.default.createElement("label", null, "메모 (선택)", E.default.createElement("textarea", { maxLength: 500, value: v.note, onChange: (H) => Jt(x, { note: H.target.value }) })), v.simulation && E.default.createElement(ov, { value: v.simulation }), !v.simulation && ["dish", "ingredient", "review"].map((H) => E.default.createElement("div", { key: H }, E.default.createElement("h4", null, { dish: "선택한 음식", ingredient: "개별 선택 식재료", review: "원자료 확인 필요" }[H]), v.items.filter((w) => w.kind === H).map((w) => E.default.createElement("article", { className: "plan-food", key: w.foodId }, E.default.createElement("strong", null, w.name), E.default.createElement("small", null, w.basis, " · ", w.source, " · ", w.version), E.default.createElement("button", { onClick: () => Jt(x, { items: v.items.filter((K) => K.foodId !== w.foodId) }) }, "이 식품 제외"), w.recipeId && E.default.createElement("div", null, E.default.createElement("p", null, "음식별 참고 레시피: ", w.recipeName, " · 성분 자료 미연결"), E.default.createElement("small", null, w.recipeSource, " · ", w.recipeVersion), E.default.createElement("div", { className: "fn-recipe-chips" }, w.ingredients.map((K) => E.default.createElement("button", { type: "button", key: K.index, onClick: () => Jt(x, { items: v.items.map((ot) => ot.foodId === w.foodId ? { ...ot, ingredients: ot.ingredients.filter((Ot) => Ot.index !== K.index) } : ot) }) }, K.text, " ×"))), E.default.createElement("button", { onClick: () => Jt(x, { items: v.items.map((K) => K.foodId === w.foodId ? { ...K, recipeId: "", recipeName: "", ingredients: [] } : K) }) }, "참고 레시피 연결 해제")))))), E.default.createElement("button", { onClick: () => f((H) => H.filter((w, K) => K !== x)) }, "이 계획 제외 · 저장 전"))), Z === "HEALTH" ? E.default.createElement("a", { href: "/preview/health/recommendations" }, "건강별 가이드에서 계획 추가 →") : E.default.createElement("button", { onClick: () => f((v) => [...v, { scope: "GENERAL", management: [], type: "SHOPPING", restaurant: "", time: "", note: "", items: [] }]), disabled: c.length >= 20 }, "장보기·외식 계획 추가"), c.length > 0 && E.default.createElement("details", null, E.default.createElement("summary", null, "계획에 식품 추가"), E.default.createElement("label", null, "추가할 계획", E.default.createElement("select", { value: j, onChange: (v) => k(Number(v.target.value)) }, c.map((v, x) => E.default.createElement("option", { key: x, value: x }, x + 1, ". ", jo[v.type])))), E.default.createElement("label", null, "식품 검색", E.default.createElement("input", { value: S, maxLength: 100, onChange: (v) => Q(v.target.value) })), E.default.createElement("button", { onClick: Nl }, "원자료에서 검색"), E.default.createElement("p", null, "상위 20건. 이름·상태·기준량을 확인하고 추가하세요. 레시피 선택은 영양정보 화면에서 진행합니다."), Y.map((v) => E.default.createElement("button", { key: v.id, onClick: () => {
      if (c[j]?.simulation) {
        T("저장 식단의 요리·분량은 AI 식단 시뮬레이터에서 수정하세요.");
        return;
      }
      !c[j] || c[j].items.some((x) => x.foodId === v.id) || Jt(j, { items: [...c[j].items, { foodId: v.id, name: v.name, kind: window.SmartNFFoodIdentity.kind(v), basis: v.basis, source: v.source, version: v.version, recipeId: "", recipeName: "", ingredients: [] }] });
    } }, v.name, " · ", v.basis, " 추가"))), E.default.createElement("button", { className: "nr-primary", disabled: !nt || !c.length, onClick: () => ol() }, "변경사항 계정에 저장"), E.default.createElement("button", { disabled: !u.plans.length, onClick: () => ol(true) }, "이 날짜 계획 전체 삭제"), E.default.createElement("label", null, "다른 날짜로 추가 복사", E.default.createElement("input", { type: "date", min: "1900-01-01", max: "2100-12-31", value: p, onChange: (v) => N(v.target.value) })), E.default.createElement("button", { disabled: !c.length || !pe(p) || p === l, onClick: () => ol(false, p) }, "선택 날짜에 계획 복사"))), E.default.createElement("details", null, E.default.createElement("summary", null, "계획 저장 동의·전체 삭제 관리"), E.default.createElement("p", null, "철회하면 본인의 모든 계획과 요청 참조를 삭제합니다. 별도 식사 기록과 회원 계정은 유지됩니다."), E.default.createElement("button", { disabled: M, onClick: () => _l(true) }, "계획 저장 동의 철회·모든 계획 삭제"))));
  }
  function ov({ value: t }) {
    let l = { energy: ["열량", "kcal"], carbohydrate: ["탄수화물", "g"], protein: ["단백질", "g"], fat: ["지방", "g"], saturated_fat: ["포화지방", "g"], sugars: ["당류", "g"], sodium: ["나트륨", "mg"], fiber: ["식이섬유", "g"] };
    return E.default.createElement("section", { className: "plan-simulation", "aria-label": "저장한 시뮬레이터 식단" }, E.default.createElement("h4", null, "저장한 한 끼 · ", { breakfast: "아침", lunch: "점심", dinner: "저녁", snack: "간식" }[t.input.meal]), t.dishes.map((e, n) => E.default.createElement("details", { key: n }, E.default.createElement("summary", null, e.name, " · ", e.servings, "인분"), E.default.createElement("ul", null, e.ingredients.map((a, u) => E.default.createElement("li", { key: u }, a.name, " ", a.grams, "g · ", a.source, a.aiKeys?.length > 0 ? " · AI 자료" : "", a.model ? " · " + a.model : "", a.generatedAt ? " · " + a.generatedAt : ""))))), E.default.createElement("dl", null, Object.entries(l).map(([e, [n, a]]) => E.default.createElement(E.default.Fragment, { key: e }, E.default.createElement("dt", null, n), E.default.createElement("dd", null, t.nutrients[e] == null ? "자료 없음" : Number(t.nutrients[e]).toLocaleString("ko-KR", { maximumFractionDigits: 2 }) + " " + a, t.aiCoverage?.[e] > 0 ? " · AI 자료" : "", (t.coverage?.[e] || 0) < t.total ? " · 일부 합계 (" + (t.coverage?.[e] || 0) + "/" + t.total + ")" : "")))), E.default.createElement("p", null, "저장 시점의 값입니다. 실제 섭취 기록과 별도이며, AI 자료는 추정값입니다."), E.default.createElement("a", { href: "/preview/recipes/simulator" }, "AI 식단 시뮬레이터에서 날짜·끼니를 선택해 불러오기 →"));
  }
  var A = Ul(yl()), ku = { care: "나의 관리항목", profile: "건강정보 요약", bp: "혈압 기록", weight: "체중·목표", history: "저장 이력", privacy: "내 정보 보호", plans: "장보기·외식 계획" }, rv = { salt: "짜게 먹는 습관 줄이기", balanced: "균형 잡힌 식사", movement: "걷기 등 신체활동", weightcare: "적정 체중 관리", alcohol: "음주 줄이기·피하기", smoking: "금연", regular: "규칙적인 식사", sugar: "단 음료·첨가당 줄이기", fat: "포화지방 줄이고 지방 종류 살펴보기", late: "야식·늦은 과식 줄이기" }, dv = { bmi: "BMI·체중", bp: "혈압", glucose: "혈당", lipid: "혈중 지질", habits: "식습관", activity: "활동·개인 조건" }, mv = ["care", "profile", "history", "privacy"], Sn = (t, l) => window.SmartNFHealthAPI.request(t, l), Ih = (t) => new Date(t).toLocaleString("ko-KR");
  function Qo({ embedded: t = false, onSnapshot: l }) {
    let [e, n] = (0, A.useState)(null), [a, u] = (0, A.useState)([]), [i, c] = (0, A.useState)(null), [f, r] = (0, A.useState)(""), [y, b] = (0, A.useState)(""), [m, h] = (0, A.useState)(false), [T, M] = (0, A.useState)(false), [_, s] = (0, A.useState)(true), o = (0, A.useRef)(false), p = (0, A.useRef)(false), N = (0, A.useRef)(true), S = (0, A.useRef)(false);
    S.current = T && e && JSON.stringify(a) !== JSON.stringify(e.widgets);
    async function Q(B = false) {
      if (p.current) {
        o.current = true;
        return;
      }
      p.current = true, c(null), l?.(null), s(true);
      try {
        let Z = await Sn("/layout"), lt = await Sn("/consent"), W = { consent: lt, profile: null, care: null, history: [] };
        if (lt.agreed) {
          let F = await Sn("/profile"), ut = await Sn("/care"), At = await Sn("/history?page=0"), yt = await Sn("/consent");
          if (!yt.agreed || yt.eventId !== lt.eventId) throw Error("동의 상태가 변경되었습니다. 다시 불러와 주세요.");
          W = { consent: lt, profile: F.profile, care: ut.care, history: At };
        }
        if (N.current) {
          let F = B && S.current;
          F || (n(Z), u(Z.widgets)), c(W), l?.(W), b(F ? "계정·동의 상태를 다시 확인했습니다. 저장 전 구성은 유지됩니다. 다른 탭의 구성 변경은 저장 시 검사합니다." : "본인 계정의 화면 구성을 불러왔습니다.");
        }
      } catch (Z) {
        N.current && (c(null), l?.(null), b(Z.message));
      } finally {
        p.current = false, N.current && (s(false), o.current && (o.current = false, Q(true)));
      }
    }
    (0, A.useEffect)(() => {
      N.current = true, Q();
      let B = () => {
        p.current || Q(true);
      };
      return window.addEventListener("focus", B), window.addEventListener("smartnf-health-account-changed", B), () => {
        N.current = false, window.removeEventListener("focus", B), window.removeEventListener("smartnf-health-account-changed", B);
      };
    }, []);
    async function D() {
      if (!(!e || m || _)) {
        h(true);
        try {
          let B = await Sn("/layout", { expectedRevision: e.revision, widgets: a });
          n(B), u(B.widgets), M(false), r(""), b("이 계정의 MyPage 구성을 저장했습니다.");
        } catch (B) {
          b(B.message + (B.status === 409 ? " 다시 불러온 뒤 구성을 확인해 주세요." : "")), [401, 403, 409].includes(B.status) && (c(null), l?.(null));
        } finally {
          h(false);
        }
      }
    }
    async function L() {
      if (!(m || _)) {
        h(true);
        try {
          let B = await Sn("/layout/suggest", { text: f });
          B.widgets.length && u(B.widgets), b(B.explanation);
        } catch (B) {
          b(B.message), [401, 403, 409].includes(B.status) && (c(null), l?.(null));
        } finally {
          h(false);
        }
      }
    }
    function j(B, Z) {
      u((lt) => {
        let W = [...lt];
        return [W[B], W[B + Z]] = [W[B + Z], W[B]], W;
      });
    }
    function k(B) {
      if (B === "plans") return A.default.createElement(A.default.Fragment, null, A.default.createElement("p", null, "계정에 저장한 음식·식재료·참고 재료를 날짜별 장보기/외식 계획으로 관리합니다."), A.default.createElement("a", { href: "/mypage/plans" }, "장보기·외식 계획 달력"));
      if (B === "privacy") return A.default.createElement(A.default.Fragment, null, A.default.createElement("p", null, i.consent.agreed ? "건강정보 저장에 동의한 상태입니다." : "건강정보 저장에 동의하지 않은 상태입니다."), A.default.createElement("p", null, "화면 구성에는 카드 종류·순서만 저장합니다. 요청 문장은 저장하지 않으며 외부 AI로 전송하지 않습니다."), A.default.createElement("a", { href: "/mypage/consent" }, "저장 동의·철회 관리"), A.default.createElement("p", { className: "pm-muted" }, "정보 이용 감사 내역과 외부 AI 목적별 동의는 아직 연결되지 않았습니다."));
      if (!i.consent.agreed) return A.default.createElement(A.default.Fragment, null, A.default.createElement("p", null, "저장된 건강정보를 보려면 별도의 저장 동의가 필요합니다."), A.default.createElement("a", { href: "/mypage/consent" }, "동의 안내 확인"));
      let Z = i.profile, lt = Z?.fields || {}, W = (F) => lt[F]?.[0] ?? null;
      return B === "care" ? A.default.createElement(A.default.Fragment, null, A.default.createElement("p", null, i.care?.needsReview ? "건강정보 변경으로 관리항목 재확인이 필요합니다." : i.care ? "계정에 확정한 실천 행동입니다." : "계정에 확정한 관리항목이 없습니다."), A.default.createElement("ul", null, (i.care?.items || []).map((F) => A.default.createElement("li", { key: F.id }, rv[F.id] || F.id, A.default.createElement("br", null), A.default.createElement("span", { className: "pm-badge" }, F.scopes.map((ut) => dv[ut] || ut).join(" · "))))), i.care && !i.care.items.length && A.default.createElement("p", null, "전체 해제한 상태입니다."), A.default.createElement("a", { href: "/health/info" }, "관리항목 확인·변경"), A.default.createElement("p", { className: "pm-muted" }, "실천 기록은 오늘 기록하기에서 입력·조회할 수 있습니다. 관리항목 중단·정렬·기간 피드백은 후속 개발 항목입니다. 카드 숨기기는 관리항목 중단이나 기록 삭제가 아닙니다.")) : B === "history" ? A.default.createElement(A.default.Fragment, null, i.history.length ? A.default.createElement("ul", { className: "pm-history" }, i.history.slice(0, 5).map((F) => A.default.createElement("li", { key: F.id }, "저장본 #", F.id, " · ", Ih(F.savedAt)))) : A.default.createElement("p", null, "저장 이력이 없습니다."), A.default.createElement("a", { href: "/mypage/health/history" }, "저장 이력 전체 확인"), A.default.createElement("p", { className: "pm-muted" }, "입력 저장 이력이며, 기간별 건강 변화 분석은 아닙니다.")) : Z ? B === "bp" ? A.default.createElement(A.default.Fragment, null, A.default.createElement("p", { className: "pm-metric" }, W("sys") ?? "미입력", " / ", W("dia") ?? "미입력", " ", A.default.createElement("small", null, "mmHg")), A.default.createElement("p", null, "측정일: ", W("measured") || "미입력", " · 환경: ", W("bpContext") || "미확인"), A.default.createElement("p", { className: "pm-muted" }, "건강정보 화면의 저장본 기준입니다. 일일 기록은 별도로 조회하며 진단·추세 평가를 생성하지 않습니다."), A.default.createElement("a", { href: "/health/info" }, "건강정보 측정값 확인·수정"), " · ", A.default.createElement("a", { href: "/mypage/daily" }, "일일 기록 입력·조회")) : B === "weight" ? A.default.createElement(A.default.Fragment, null, A.default.createElement("p", { className: "pm-metric" }, W("weight") ?? "미입력", " ", W("weight") !== null ? "kg" : ""), A.default.createElement("p", null, "목표 체중: ", W("targetWeight") !== null ? W("targetWeight") + " kg" : "미설정"), A.default.createElement("p", null, "관리 방향: ", W("weightGoal") || "미설정"), A.default.createElement("p", { className: "pm-muted" }, "측정일: ", W("measured") || "미입력", ". 목표 달성률·변화 그래프는 아직 계산하지 않습니다."), A.default.createElement("a", { href: "/health/info" }, "건강정보 체중·목표 확인·수정"), " · ", A.default.createElement("a", { href: "/mypage/daily" }, "일일 체중 기록")) : A.default.createElement(A.default.Fragment, null, A.default.createElement("p", null, "최근 저장: ", Ih(Z.savedAt)), A.default.createElement("dl", null, [["키", "height", "cm"], ["체중", "weight", "kg"], ["측정일", "measured", ""]].map(([F, ut, At]) => A.default.createElement(A.default.Fragment, { key: ut }, A.default.createElement("dt", null, F), A.default.createElement("dd", null, W(ut) !== null ? `${W(ut)} ${At}` : "미입력")))), A.default.createElement("a", { href: "/mypage/health" }, "건강정보 저장본 확인"), " · ", A.default.createElement("a", { href: "/health/info" }, "입력·수정")) : A.default.createElement(A.default.Fragment, null, A.default.createElement("p", null, "저장된 건강정보가 없습니다."), A.default.createElement("a", { href: "/health/info" }, "건강정보 입력·저장"));
    }
    let pt = e && JSON.stringify(a) !== JSON.stringify(e.widgets);
    return A.default.createElement(A.default.Fragment, null, !t && A.default.createElement(A.default.Fragment, null, A.default.createElement("p", { className: "pm-eyebrow" }, "MY SMARTNF · PERSONAL SPACE"), A.default.createElement("h1", null, "나에게 맞춘 MyPage"), A.default.createElement("p", null, "필요한 카드를 고르고 순서를 바꾸세요. 확인한 구성은 내 계정에 저장됩니다."), A.default.createElement("nav", { className: "pm-nav", "aria-label": "개인 기록 메뉴" }, A.default.createElement("a", { href: "/preview/mypage/review" }, "새 MyPage 구성 미리보기"), A.default.createElement("a", { href: "/mypage/daily" }, "오늘 기록하기·기간별 조회"), A.default.createElement("a", { href: "/mypage/account" }, "회원정보·계정 설정"), A.default.createElement("a", { href: "/mypage/examples" }, "일자별 관리 예시"), A.default.createElement("a", { href: "/health/info" }, "건강정보 입력·수정"), A.default.createElement("a", { href: "/mypage/health/history" }, "저장 이력"), A.default.createElement("a", { href: "/mypage/consent" }, "내 정보 보호"))), A.default.createElement("div", { className: "pm-actions" }, A.default.createElement("button", { type: "button", disabled: _ || m || !i, onClick: () => M(!T) }, T ? "구성 편집 닫기" : "내 화면 구성하기"), A.default.createElement("button", { type: "button", disabled: m || _, onClick: () => Q(false) }, "다시 불러오기")), A.default.createElement("p", { className: "pm-status", role: "status", "aria-live": "polite" }, _ ? "본인 계정과 동의 상태를 확인하고 있습니다." : y), T && i && A.default.createElement("section", { className: "pm-editor", "aria-label": "개인 화면 구성 편집" }, A.default.createElement("h2", null, "어떤 화면이 필요한가요?"), A.default.createElement("label", { htmlFor: "mypage-request" }, "구성 요청 · 최대 300자"), A.default.createElement("textarea", { id: "mypage-request", maxLength: 300, value: f, disabled: m || _, onChange: (B) => r(B.target.value), placeholder: "예: 혈압과 관리항목만 간단히 보여줘" }), A.default.createElement("p", { className: "pm-muted" }, "로컬 키워드 규칙으로 구성만 제안합니다. 건강 수치·이름 등 개인정보는 입력하지 마세요. 외부 LLM은 아직 연결되지 않았습니다."), A.default.createElement("button", { type: "button", disabled: m || _ || !f.trim(), onClick: L }, "로컬 구성 제안받기"), A.default.createElement("fieldset", { disabled: m || _ }, A.default.createElement("legend", null, "표시할 카드"), A.default.createElement("div", { className: "pm-options" }, Object.entries(ku).map(([B, Z]) => A.default.createElement("label", { key: B }, A.default.createElement("input", { type: "checkbox", checked: a.includes(B), onChange: () => u((lt) => lt.includes(B) ? lt.filter((W) => W !== B) : [...lt, B]) }), Z)))), A.default.createElement("div", { className: "pm-actions" }, A.default.createElement("button", { className: "pm-primary", type: "button", disabled: m || _ || !a.length || !pt, onClick: D }, "확인한 구성 저장"), A.default.createElement("button", { type: "button", disabled: m || _, onClick: () => {
      u(e.widgets), b("저장된 구성으로 되돌렸습니다.");
    } }, "편집 취소"), A.default.createElement("button", { type: "button", disabled: m || _, onClick: () => u(mv) }, "기본 구성 미리보기")), A.default.createElement("p", { className: "pm-muted" }, pt ? "저장 전 미리보기입니다." : "현재 계정에 적용된 구성입니다.", " 최소 한 개의 카드를 선택하세요. 위젯 순서는 아래 카드의 위·아래 버튼으로 조정합니다.")), i && !_ && A.default.createElement("div", { className: "pm-grid" }, (T ? a : e.widgets).map((B, Z) => A.default.createElement("section", { key: B, className: "pm-card", "aria-label": ku[B] }, T && A.default.createElement("div", { className: "pm-order" }, A.default.createElement("button", { type: "button", disabled: m || Z === 0, "aria-label": ku[B] + " 위로 이동", onClick: () => j(Z, -1) }, "위로"), A.default.createElement("button", { type: "button", disabled: m || Z === a.length - 1, "aria-label": ku[B] + " 아래로 이동", onClick: () => j(Z, 1) }, "아래로")), A.default.createElement("h2", null, ku[B]), k(B)))), !t && A.default.createElement("p", { className: "pm-muted" }, "식사·활동 기록, 변화 분석, 생성형 리포트는 후속 개발입니다. 현재는 개발용 가상 입력으로 확인하세요."));
  }
  var d = Ul(yl());
  var C = Ul(yl());
  var Qn = { steps: ["걸음 수", "보", 0, 2e5, 1], walkingMinutes: ["걷기 시간", "분", 0, 1440, 1], fastingGlucose: ["공복혈당", "mg/dL", 1, 1500, 1], waist: ["허리둘레", "cm", 1, 400, 0.1], sleepHours: ["수면 시간", "시간", 0, 24, 0.1] }, Zo = { movement: "걷기 등 신체활동", weightcare: "적정 체중 관리" }, _c = (t) => Object.fromEntries(Object.keys(Qn).map((l) => [l, t?.metrics?.[l] ?? null]));
  function Vo(t, l) {
    return t?.items.find((e) => e.id === l)?.status || "UNRECORDED";
  }
  var Nn = { totalCholesterol: ["총콜레스테롤", "mg/dL", 1, 9999, 0.1], ldl: ["LDL", "mg/dL", 0, 9999, 0.1], hdl: ["HDL", "mg/dL", 0, 9999, 0.1], triglycerides: ["중성지방", "mg/dL", 0, 9999, 0.1] }, Uc = (t) => Object.fromEntries(["height", ...Object.keys(Nn)].map((l) => [l, t?.metrics?.clinical?.[l] ?? null]));
  function Ko(t, l) {
    let e = Number(t), n = Number(l);
    return !Number.isFinite(e) || !Number.isFinite(n) || e < 1 || e > 400 || n < 1 || n > 300 ? null : Number((e / (n / 100) ** 2).toFixed(2));
  }
  var hl = "2026-11-01";
  function Ge(t, l) {
    return new Date(Date.parse(t + "T00:00:00Z") + l * 864e5).toISOString().slice(0, 10);
  }
  var Xe = Ge(hl, -119);
  function Xa(t) {
    return /^\d{4}-\d{2}-\d{2}$/.test(t) && !Number.isNaN(Date.parse(t + "T00:00:00Z")) && (/* @__PURE__ */ new Date(t + "T00:00:00Z")).toISOString().slice(0, 10) === t;
  }
  function Ph(t, l) {
    return Xa(t) && Xa(l) && t <= l && t >= Xe && l <= hl;
  }
  function Rh(t) {
    return Array.from({ length: 120 }, (l, e) => {
      let n = ((e - 113) % 7 + 7) % 7, a = t.bp[n];
      return { date: Ge(Xe, e), sys: a == null ? null : Number(a.split("/")[0]), dia: a == null ? null : Number(a.split("/")[1]), weight: t.weight[n], practice: t.practice[n] };
    });
  }
  function tp(t, l, e) {
    return t.filter((n) => n.date >= l && n.date <= e);
  }
  function lp(t, l) {
    let e = [], n = [];
    for (let a = 0; a < t.length; a++) {
      let u = t[a][l];
      u == null || !Number.isFinite(u) ? (n.length && e.push(n), n = []) : n.push({ index: a, value: u, date: t[a].date });
    }
    return n.length && e.push(n), e;
  }
  var Jo = [{ id: "bp", title: "① 혈압·저염 실천 기록", summary: "같은 측정 조건으로 기록하면서 식사 실천을 함께 확인하는 예시", actions: ["짜게 먹는 습관 줄이기", "걷기 등 신체활동"], bp: ["134/84", "132/83", null, "135/84", "131/82", "133/83", "132/82"], weight: [72.1, 72, null, 72.2, 72, 72.1, 72], practice: ["식사·걷기 기록", "식사 기록", null, "걷기 기록", "식사·걷기 기록", "식사 기록", "식사·걷기 기록"] }, { id: "weight", title: "② 체중·식사 기록", summary: "체중의 일별 변동과 식사 기록 여부를 따로 살펴보는 예시", actions: ["적정 체중 관리", "균형 잡힌 식사"], bp: [null, null, null, null, null, null, null], weight: [68.2, 68, 68.3, 68.1, null, 68, 68.2], practice: ["세 끼 기록", "두 끼 기록", "세 끼 기록", null, "세 끼 기록", "두 끼 기록", "세 끼 기록"] }, { id: "meal", title: "③ 규칙적 식사 실천", summary: "수치 입력 없이도 행동 기록이 날짜별로 쌓이는 예시", actions: ["규칙적인 식사", "야식·늦은 과식 줄이기"], bp: [null, null, null, null, null, null, null], weight: [null, null, null, null, null, null, null], practice: ["아침 식사 기록", "아침·저녁 시간 기록", null, "식사 시간 기록", "늦은 식사 메모", "식사 시간 기록", "식사 시간 기록"] }, { id: "activity", title: "④ 활동과 체중 기록", summary: "활동 실천 여부와 체중을 함께 보되 인과관계를 단정하지 않는 예시", actions: ["걷기 등 신체활동", "균형 잡힌 식사"], bp: [null, null, null, null, null, null, null], weight: [58, null, 58.2, null, 58.1, null, 58], practice: ["걷기 기록", "걷기 기록", "쉬었다고 기록", null, "걷기 기록", "쉬었다고 기록", "걷기 기록"] }, { id: "restart", title: "⑤ 기록 중단 후 다시 시작", summary: "미기록 날짜를 실패·0점으로 바꾸지 않고 재개 시점을 보여주는 예시", actions: ["규칙적인 식사"], bp: ["122/78", null, null, null, null, "125/80", "123/79"], weight: [65, null, null, null, null, 65.2, 65.1], practice: ["실천 기록", null, null, null, null, "기록 재개", "실천 기록"] }], Zn = { ...Object.fromEntries(Object.entries({ ...Qn, ...Nn, bmi: ["BMI"], height: ["키"] }).map(([t, [l]]) => [t, { label: l, color: "#176b55" }])), sys: { label: "수축기", color: "#176b55" }, dia: { label: "이완기", color: "#275ca8" }, weight: { label: "체중", color: "#985b20" } };
  function Hc({ rows: t, keys: l, title: e, unit: n, onSelect: a }) {
    let u = t.flatMap((h) => l.map((T) => h[T])).filter((h) => h != null && Number.isFinite(h));
    if (!u.length) return C.default.createElement("section", { className: "pm-card pm-chart" }, C.default.createElement("h3", null, e), C.default.createElement("p", null, "선택한 기간에 기록된 ", e, " 값이 없습니다."));
    let i = Math.min(...u), c = Math.max(...u), f = Math.max(n === "kg" ? 0.5 : 5, (c - i) * 0.15), r = Math.floor((i - f) * 10) / 10, y = Math.ceil((c + f) * 10) / 10, b = (h) => 56 + (t.length === 1 ? 340 : h * 680 / (t.length - 1)), m = (h) => 190 - (h - r) * 160 / (y - r);
    return C.default.createElement("section", { className: "pm-card pm-chart" }, C.default.createElement("h3", null, e, " ", C.default.createElement("span", { className: "pm-muted" }, "(", n, ")")), C.default.createElement("p", { className: "pm-muted" }, l.map((h) => Zn[h].label).join(" · "), " · 미기록 구간은 선을 연결하지 않습니다."), C.default.createElement("div", { className: "pm-chart-scroll", tabIndex: "0", "aria-label": e + " 그래프 가로 스크롤 영역" }, C.default.createElement("svg", { viewBox: "0 0 760 240", role: "group", "aria-label": e + " 날짜별 그래프. 점에 마우스를 올리거나 키보드로 선택하면 상세 기록을 확인할 수 있습니다." }, [0, 1, 2, 3, 4].map((h) => {
      let T = r + (y - r) * h / 4;
      return C.default.createElement("g", { key: h }, C.default.createElement("line", { x1: "56", x2: "736", y1: m(T), y2: m(T), stroke: "#dce7e2" }), C.default.createElement("text", { x: "48", y: m(T) + 4, textAnchor: "end", fontSize: "12" }, Number(T.toFixed(1))));
    }), [.../* @__PURE__ */ new Set([0, Math.floor((t.length - 1) / 2), t.length - 1])].map((h) => C.default.createElement("text", { key: h, x: b(h), y: "218", textAnchor: "middle", fontSize: "12" }, t[h].date.slice(5))), l.map((h) => C.default.createElement("g", { key: h }, lp(t, h).map((T, M) => C.default.createElement("polyline", { key: M, points: T.map((_) => `${b(_.index)},${m(_.value)}`).join(" "), fill: "none", stroke: Zn[h].color, strokeWidth: "2", strokeDasharray: h === "dia" ? "6 3" : void 0 })), t.map((T, M) => T[h] == null ? null : C.default.createElement("circle", { key: T.date, cx: b(M), cy: m(T[h]), r: t.length > 60 ? 3 : 4, fill: Zn[h].color, tabIndex: "0", role: "button", "aria-label": `${T.date} ${Zn[h].label} ${T[h]} ${n}`, onMouseEnter: () => a(T.date), onFocus: () => a(T.date), onClick: () => a(T.date), onKeyDown: (_) => {
      (_.key === "Enter" || _.key === " ") && (_.preventDefault(), a(T.date));
    } }, C.default.createElement("title", null, T.date, " · ", Zn[h].label, " ", T[h], " ", n))))))), C.default.createElement("div", { className: "pm-chart-legend" }, l.map((h) => C.default.createElement("span", { key: h }, C.default.createElement("i", { style: { background: Zn[h].color } }), Zn[h].label, h === "dia" ? " (점선)" : ""))), C.default.createElement("p", { className: "pm-muted" }, "세로축 ", r, "~", y, " ", n, "로 범위를 확대했습니다. 변화의 크기는 축 눈금과 함께 확인하세요. 아래 표에서도 모든 값을 볼 수 있습니다."));
  }
  function ko() {
    let [t, l] = (0, C.useState)(Jo[0].id), [e, n] = (0, C.useState)(Ge(hl, -29)), [a, u] = (0, C.useState)(hl), [i, c] = (0, C.useState)([Ge(hl, -29), hl]), [f, r] = (0, C.useState)(""), [y, b] = (0, C.useState)(["bp", "weight", "practice"]), [m, h] = (0, C.useState)(null), T = Jo.find((S) => S.id === t), M = Rh(T), _ = tp(M, ...i), s = _.find((S) => S.date === m), o = _.filter((S) => S.practice != null).length;
    function p(S, Q) {
      if (!Ph(S, Q)) {
        r(`시작일·종료일을 ${Xe}~${hl} 안에서 올바른 순서로 선택하세요. 기존 조회 기간은 유지됩니다.`);
        return;
      }
      c([S, Q]), n(S), u(Q), h(null), r("");
    }
    function N(S) {
      p(S === 120 ? Xe : Ge(hl, -S + 1), hl);
    }
    return C.default.createElement(C.default.Fragment, null, C.default.createElement("p", { className: "pm-eyebrow" }, "SMARTNF · FICTIONAL EXAMPLES"), C.default.createElement("h1", null, "일자별 관리 예시"), C.default.createElement("p", null, C.default.createElement("strong", null, "가상 사용자 5명의 읽기 전용 예시입니다."), " 내 건강정보가 아니며 계정에 저장되지 않습니다. 실제 실천·측정 기록은 오늘 기록하기에서 별도로 관리합니다. 식사·활동량 상세 기록은 후속 개발입니다."), C.default.createElement("nav", { className: "pm-nav" }, C.default.createElement("a", { href: "/mypage" }, "내 MyPage로 돌아가기"), C.default.createElement("a", { href: "/mypage/daily" }, "오늘 기록하기"), C.default.createElement("a", { href: "/mypage/account" }, "회원정보·계정 설정")), C.default.createElement("section", { className: "pm-editor" }, C.default.createElement("label", { htmlFor: "sample-person" }, "보고 싶은 관리 예시"), C.default.createElement("select", { id: "sample-person", value: t, onChange: (S) => {
      l(S.target.value), h(null);
    } }, Jo.map((S) => C.default.createElement("option", { key: S.id, value: S.id }, S.title))), C.default.createElement("h2", null, T.title), C.default.createElement("p", null, T.summary), C.default.createElement("p", null, "가상 자료 기간: ", Xe, " ~ ", hl, " · 120일"), C.default.createElement("p", { className: "pm-muted" }, "기간 선택을 시험하도록 기존 7일 가상 패턴을 반복한 시연 자료입니다. 실제 추세·권장 목표·치료 효과를 나타내지 않습니다.")), C.default.createElement("div", { className: "pm-grid" }, C.default.createElement("section", { className: "pm-card" }, C.default.createElement("h2", null, "선택한 관리 행동"), C.default.createElement("ul", null, T.actions.map((S) => C.default.createElement("li", { key: S }, S)))), C.default.createElement("section", { className: "pm-card" }, C.default.createElement("h2", null, "기록을 읽는 방법"), C.default.createElement("p", null, "혈압은 ‘가정·아침·안정 후’, 체중은 ‘아침’이라는 같은 조건의 가상값입니다. 수치 변화를 특정 행동의 효과로 해석하지 않습니다. 미기록은 미실천이나 측정값 0이 아닙니다."))), C.default.createElement("section", { className: "pm-card pm-timeline" }, C.default.createElement("h2", null, "날짜별 관리 기록"), C.default.createElement("form", { className: "pm-range", onSubmit: (S) => {
      S.preventDefault(), p(e, a);
    } }, C.default.createElement("label", { htmlFor: "history-start" }, "시작일", C.default.createElement("input", { id: "history-start", type: "date", min: Xe, max: hl, required: true, value: e, onChange: (S) => n(S.target.value) })), C.default.createElement("label", { htmlFor: "history-end" }, "종료일", C.default.createElement("input", { id: "history-end", type: "date", min: Xe, max: hl, required: true, value: a, onChange: (S) => u(S.target.value) })), C.default.createElement("button", { type: "submit", className: "pm-primary" }, "기간 적용")), C.default.createElement("div", { className: "pm-actions pm-periods", "aria-label": "예시 마지막 기록일 기준 빠른 기간" }, [7, 30, 90, 120].map((S) => C.default.createElement("button", { type: "button", key: S, "aria-pressed": i[0] === (S === 120 ? Xe : Ge(hl, -S + 1)) && i[1] === hl, onClick: () => N(S) }, S === 120 ? "전체 (120일)" : `최근 ${S}일`))), C.default.createElement("p", { className: "pm-muted" }, "빠른 기간은 오늘이 아닌 예시 마지막 날짜 ", hl, " 기준입니다."), f && C.default.createElement("p", { role: "alert" }, f), C.default.createElement("p", { role: "status" }, "적용된 기간: ", i[0], " ~ ", i[1], " · ", _.length, "일 중 실천 관련 메모가 있는 날: ", o, "일"), C.default.createElement("p", { className: "pm-muted" }, "단순 기록 일수이며 목표 달성률·건강 점수가 아닙니다. 그래프와 표에 같은 기간을 적용합니다."), C.default.createElement("fieldset", { className: "pm-options" }, C.default.createElement("legend", null, "표시할 그래프"), [["bp", "혈압"], ["weight", "체중"], ["practice", "실천 기록"]].map(([S, Q]) => C.default.createElement("label", { key: S }, C.default.createElement("input", { type: "checkbox", checked: y.includes(S), onChange: () => b((D) => D.includes(S) ? D.filter((L) => L !== S) : [...D, S]) }), Q))), y.includes("bp") && C.default.createElement(Hc, { rows: _, keys: ["sys", "dia"], title: "혈압", unit: "mmHg", onSelect: h }), y.includes("weight") && C.default.createElement(Hc, { rows: _, keys: ["weight"], title: "체중", unit: "kg", onSelect: h }), y.includes("practice") && C.default.createElement("section", { className: "pm-card pm-chart" }, C.default.createElement("h3", null, "실천 관련 메모 기록 여부"), C.default.createElement("p", null, "채움: 메모 있음 · 빈 칸: 미기록. 쉬었다는 메모도 기록에 포함되며 실천 성공을 뜻하지 않습니다."), C.default.createElement("div", { className: "pm-practice-grid" }, _.map((S) => C.default.createElement("button", { type: "button", key: S.date, className: S.practice == null ? "" : "has-record", "aria-label": `${S.date} ${S.practice ?? "미기록"}`, "aria-pressed": m === S.date, onClick: () => h(S.date) }, C.default.createElement("span", null, S.date.slice(5)), C.default.createElement("span", null, S.practice == null ? "—" : "●"))))), C.default.createElement("section", { className: "pm-detail", "aria-live": "polite", "aria-atomic": "true" }, C.default.createElement("h3", null, "선택한 날짜의 상세 기록"), s ? C.default.createElement(C.default.Fragment, null, C.default.createElement("p", null, s.date, " · 혈압: ", s.sys == null ? "미기록" : `${s.sys}/${s.dia} mmHg`, " · 체중: ", s.weight == null ? "미기록" : `${s.weight} kg`), C.default.createElement("p", null, "실천·생활 메모: ", s.practice ?? "미기록"), C.default.createElement("p", { className: "pm-muted" }, "측정 조건: 혈압 가정·아침·안정 후 / 체중 아침 (가상 조건)")) : C.default.createElement("p", null, "그래프의 점이나 실천 기록 날짜를 선택하면 상세 내용이 표시됩니다.")), C.default.createElement("div", { className: "pm-table-scroll" }, C.default.createElement("table", null, C.default.createElement("caption", null, T.title, " · ", i[0], "~", i[1], " · 가상 입력"), C.default.createElement("thead", null, C.default.createElement("tr", null, C.default.createElement("th", { scope: "col" }, "날짜"), C.default.createElement("th", { scope: "col" }, "혈압 (mmHg)"), C.default.createElement("th", { scope: "col" }, "체중 (kg)"), C.default.createElement("th", { scope: "col" }, "실천·생활 메모"))), C.default.createElement("tbody", null, _.map((S) => C.default.createElement("tr", { key: S.date }, C.default.createElement("th", { scope: "row" }, S.date), C.default.createElement("td", null, S.sys == null ? "미기록" : `${S.sys}/${S.dia}`), C.default.createElement("td", null, S.weight ?? "미기록"), C.default.createElement("td", null, S.practice ?? "미기록")))))), C.default.createElement("p", { className: "pm-muted" }, "개인 데이터로 복사·자동 저장하지 않습니다. 실제 입력은 오늘 기록하기에서 관리하며 분석·피드백은 후속 작업입니다.")));
  }
  var ce = { salt: "짜게 먹는 습관 줄이기", balanced: "균형 잡힌 식사", movement: "걷기 등 신체활동", weightcare: "적정 체중 관리", alcohol: "음주 줄이기·피하기", smoking: "금연", regular: "규칙적인 식사", sugar: "단 음료·첨가당 줄이기", fat: "포화지방 줄이고 지방 종류 살펴보기", late: "야식·늦은 과식 줄이기" }, xc = { UNRECORDED: "미기록", DONE: "실천함", PARTIAL: "일부 실천", NOT_DONE: "실천하지 않음" }, Bc = { UNKNOWN: "미확인", HOME: "가정", CLINIC: "진료실" }, Qe = { UNKNOWN: "미확인", AM: "오전", PM: "오후" }, hv = [["신체·활동", ["weight", "bmi", "waist", "steps", "walkingMinutes", "sleepHours"]], ["혈압·혈당", ["bp", "fastingGlucose"]], ["혈중 지질", Object.keys(Nn)]], pv = { weight: "체중", bp: "혈압", bmi: "BMI", ...Object.fromEntries(Object.entries({ ...Qn, ...Nn }).map(([t, [l]]) => [t, l])) }, qc = () => ({ metrics: { ..._c(), clinical: Uc() }, weight: "", sys: "", dia: "", bpContext: "UNKNOWN", bpTime: "UNKNOWN", weightTime: "UNKNOWN", note: "", items: {} }), Wo = (t) => t ? { ...t, metrics: { ..._c(t), clinical: Uc(t) }, weight: t.weight ?? "", sys: t.sys ?? "", dia: t.dia ?? "", items: Object.fromEntries(t.items.map((l) => [l.id, { status: l.status, note: l.note }])) } : qc(), Fo = (t) => ({ metrics: t.metrics, weight: t.weight === "" ? null : Number(t.weight), sys: t.sys === "" ? null : Number(t.sys), dia: t.dia === "" ? null : Number(t.dia), bpContext: t.bpContext, bpTime: t.bpTime, weightTime: t.weightTime, note: t.note, items: Object.entries(t.items).filter(([, l]) => l.status !== "UNRECORDED" || l.note.trim()).map(([l, e]) => ({ id: l, ...e })).sort((l, e) => l.id.localeCompare(e.id)) }), le = (t, l) => window.SmartNFHealthAPI.request(t, l);
  function ep({ label: t, children: l }) {
    let [e, n] = (0, d.useState)(false);
    return d.default.createElement("details", { onToggle: (a) => n(a.currentTarget.open) }, d.default.createElement("summary", { "aria-label": t + " 추이 보기" }, "추이 보기"), e && l());
  }
  function $o({ embedded: t = false, onEdit: l, onMealDate: e, historyOnly: n = false }) {
    let [a, u] = (0, d.useState)(null), [i, c] = (0, d.useState)(null), [f, r] = (0, d.useState)(qc), [y, b] = (0, d.useState)(""), [m, h] = (0, d.useState)(null), [T, M] = (0, d.useState)([]), [_, s] = (0, d.useState)(true), [o, p] = (0, d.useState)("계정·동의 상태를 확인하고 있습니다."), [N, S] = (0, d.useState)(null), [Q, D] = (0, d.useState)(null), [L, j] = (0, d.useState)(null), [k, pt] = (0, d.useState)(false), [B, Z] = (0, d.useState)(null), [lt, W] = (0, d.useState)([]), F = (0, d.useRef)(null), ut = (0, d.useRef)(false), At = (0, d.useRef)(true), yt = (0, d.useRef)(null);
    F.current = a;
    let zt = i?.record ? Wo(i.record.input) : qc(), Vt = JSON.stringify(Fo(f)) !== JSON.stringify(Fo(zt));
    function Lt() {
      Z(null), W([]), u(null), c(null), r(qc()), M([]), pt(false), j(null), S(null), D(null), yt.current = null;
    }
    async function Kt(g = null, q = null) {
      if (!ut.current) {
        window.SmartNFActionConfirm.cancel?.(), ut.current = true, s(true);
        try {
          let G = await le("/consent");
          if (!G.agreed) {
            Lt(), u({ consent: G }), p("일일 기록이 포함된 새 저장 안내를 확인하고 동의해 주세요.");
            return;
          }
          let J = await le("/daily/options"), I = g || J.today, Yt = q || ol(J.today.slice(0, 7), J.today), kt = await le("/daily/tracking"), et = await le("/daily/day?date=" + encodeURIComponent(I)), Ut = await le("/daily?from=" + Yt[0] + "&to=" + Yt[1]), ne = await le("/consent");
          if (!ne.agreed || ne.eventId !== G.eventId) throw Error("동의 상태가 변경되었습니다. 다시 불러와 주세요.");
          if (!At.current) return;
          Z(kt), W(kt.keys), u({ consent: G, options: J }), c(et), r(Wo(et.record?.input)), b(I), h(Yt), M(Ut), pt(true), S(null), D(null), yt.current = null, p("본인 일일 기록을 불러왔습니다. 입력 후 저장 버튼을 눌러 주세요.");
        } catch (G) {
          Lt(), p(G.message);
        } finally {
          ut.current = false, At.current && s(false);
        }
      }
    }
    (0, d.useEffect)(() => {
      At.current = true, Kt();
      let g = async () => {
        if (!(ut.current || !F.current?.consent.agreed)) try {
          let q = await le("/consent");
          (!q.agreed || q.eventId !== F.current?.consent.eventId) && (Lt(), p("동의 상태가 변경되었습니다. 새 안내 확인 후 다시 불러와 주세요."));
        } catch (q) {
          Lt(), p(q.message);
        }
      };
      return window.addEventListener("focus", g), () => {
        At.current = false, window.removeEventListener("focus", g);
      };
    }, []);
    let nt = m?.[0].slice(0, 7), pl = a?.consent.agreed ? a.consent.eventId : null, wt = nt && pl != null ? nt + "|" + m[1] + "|" + pl : null, Jt = nt && nt > "1900-01" ? te(nt, -1) : null, _l = Jt ? Math.min(Number(m[1].slice(8)), ye(Jt).filter(Boolean).length) : 0;
    (0, d.useEffect)(() => {
      if (!n || !wt || !Jt) return;
      let g = true;
      j(null);
      let q = String(_l).padStart(2, "0");
      return le("/daily?from=" + Jt + "-01&to=" + Jt + "-" + q).then((G) => {
        g && j({ key: wt, days: new Set(G.map((J) => J.date)).size });
      }).catch(() => {
        g && j({ key: wt, error: true });
      }), () => {
        g = false;
      };
    }, [n, wt, Jt, _l]);
    function ol(g, q) {
      let G = ye(g).filter(Boolean);
      return [G[0], G.at(-1) < q ? G.at(-1) : q];
    }
    async function Nl() {
      if (!(ut.current || !B || !a)) {
        ut.current = true, s(true);
        try {
          let g = await le("/daily/tracking", { expectedRevision: B.revision, consentEventId: a.consent.eventId, keys: lt });
          Z(g), W(g.keys), p("관리할 항목을 MyPage에 저장했습니다.");
        } catch (g) {
          [401, 403].includes(g.status) && Lt(), p(g.message);
        } finally {
          ut.current = false, s(false);
        }
      }
    }
    let Y = lt.length !== B?.keys.length || lt.some((g) => !B?.keys.includes(g));
    function v() {
      return !Vt && !Y || confirm("저장하지 않은 입력을 버리고 다른 기록을 불러올까요?");
    }
    function x(g) {
      if (g !== y) {
        if (!Xa(g) || g < "1900-01-01" || g > a.options.today) {
          p("올바른 기록 날짜를 선택하세요.");
          return;
        }
        v() && (l?.(), Kt(g, m));
      }
    }
    function H(g, q) {
      if (!Xa(g) || !Xa(q) || g < "1900-01-01" || g > q || q > a.options.today || (Date.parse(q) - Date.parse(g)) / 864e5 > 365) {
        p("1900년 이후·오늘 이전의 기간을 최대 366일로 선택하세요. 기존 조회는 유지됩니다.");
        return;
      }
      v() && Kt(g, [g, q]);
    }
    async function w(g = false) {
      if (ut.current || !a?.consent.agreed || !i || g && !await window.SmartNFActionConfirm(y + " 기록 내용을 삭제할까요? 복원할 수 없습니다. 날짜·삭제 버전은 충돌 방지를 위해 남습니다.")) return;
      ut.current = true, s(true);
      let q = { expectedRevision: i.revision, consentEventId: a.consent.eventId, date: y, ...g ? {} : { input: Fo(f) } }, G = JSON.stringify({ remove: g, ...q });
      try {
        if (!yt.current || yt.current.key !== G) {
          if (!crypto.randomUUID) throw Error("안전한 요청 ID를 만들 수 없습니다. 최신 브라우저의 localhost 또는 HTTPS에서 사용하세요.");
          yt.current = { key: G, id: crypto.randomUUID() };
        }
        let J = await le("/daily" + (g ? "/delete" : ""), { ...q, requestId: yt.current.id });
        c(J), r(Wo(J.record?.input)), yt.current = null, S(null), p(g ? "해당 날짜의 기록 내용을 삭제했습니다." : "일일 기록을 저장했습니다.");
        try {
          let I = await le("/daily?from=" + m[0] + "&to=" + m[1]);
          M(I), pt(true);
        } catch (I) {
          M([]), pt(false), p((g ? "삭제" : "저장") + "는 완료했지만 기간 조회를 갱신하지 못했습니다. " + I.message), [401, 403, 409].includes(I.status) && Lt();
        }
      } catch (J) {
        if (p(J.message), [401, 403].includes(J.status)) Lt();
        else if (J.status === 409) try {
          let I = await le("/consent");
          (!I.agreed || I.eventId !== a.consent.eventId) && Lt();
        } catch {
          Lt();
        }
      } finally {
        ut.current = false, s(false);
      }
    }
    let K = (g, q) => r((G) => ({ ...G, [g]: q })), ot = (g, q, G) => r((J) => ({ ...J, items: { ...J.items, [g]: { status: "UNRECORDED", note: "", ...J.items[g], [q]: G } } })), Ot = B?.keys || [], ee = Ot.filter((g) => Object.hasOwn(ce, g) && !Object.hasOwn(Zo, g)), Qa = Object.entries(Qn).filter(([g]) => Ot.includes(g)), V = Object.entries(ce).filter(([g]) => !Object.hasOwn(Zo, g)), P = Object.entries(Nn).filter(([g]) => Ot.includes(g)), rt = Ot.includes("bmi"), Bt = Ko(f.weight, f.metrics.clinical.height);
    function rl(g, q, G, J, I, Yt) {
      return d.default.createElement("div", { className: "tracking-edit-row", key: g }, d.default.createElement("label", { className: "tracking-inline-field" }, d.default.createElement("span", null, q, " (", G, ")"), d.default.createElement("input", { type: "number", min: J, max: I, step: Yt, value: f.metrics.clinical[g] ?? "", onChange: (kt) => {
        let et = kt.target.value === "" ? null : Number(kt.target.value);
        r((Ut) => ({ ...Ut, metrics: { ...Ut.metrics, clinical: { ...Ut.metrics.clinical, [g]: et } } }));
      } })), Kn(g, q, G));
    }
    let El = new Map(T.map((g) => [g.date, g])), qt = m ? Array.from({ length: Math.floor((Date.parse(m[1]) - Date.parse(m[0])) / 864e5) + 1 }, (g, q) => {
      let G = Ge(m[0], q), J = El.get(G), I = J?.input;
      return { date: G, ..._c(I), ...Uc(I), bmi: Ko(I?.weight, I?.metrics?.clinical?.height), sys: I?.sys ?? null, dia: I?.dia ?? null, weight: I?.weight ?? null, input: I };
    }) : [], Vn = [...new Set(qt.filter((g) => g.sys != null).map((g) => g.input.bpContext + "_" + g.input.bpTime))], Ro = [...new Set(qt.filter((g) => g.weight != null).map((g) => g.input.weightTime))], al = qt.find((g) => g.date === (n ? N : y)), up = [...Qa, ...P, ...rt ? [["bmi", ["BMI", "kg/m²"]]] : [], ...Ot.includes("bp") ? [["bp", ["혈압", "mmHg"]]] : [], ...Ot.includes("weight") ? [["weight", ["체중", "kg"]]] : []];
    function ip(g, q) {
      let G = g === "bp" ? ["sys", "dia"] : [g], J = qt.filter((et) => G.every((Ut) => et[Ut] != null)), I = J.at(-1), Yt = J.filter((et) => g === "bp" ? et.input.bpContext === I.input.bpContext && et.input.bpTime === I.input.bpTime : g === "weight" ? et.input.weightTime === I.input.weightTime : true), kt = (et) => G.map((Ut) => et[Ut]).join(" / ") + " " + q;
      return { latest: I, count: Yt.length, change: I ? Yt.length > 1 ? kt(Yt[0]) + " → " + kt(I) : kt(I) : null };
    }
    function tr(g) {
      let q = { DONE: 0, NOT_DONE: 0, UNRECORDED: 0, PARTIAL: 0 };
      for (let G of g) q[G.status] += 1;
      return "실천 " + q.DONE + "일 · 미실천 " + q.NOT_DONE + "일 · 미기록 " + q.UNRECORDED + "일" + (q.PARTIAL ? " · 일부 실천 " + q.PARTIAL + "일" : "");
    }
    function cp() {
      let g = up.map(([et, [Ut, ne]]) => ({ key: et, label: Ut, unit: ne, ...ip(et, ne) })), q = g.filter((et) => et.count < 2), G = q.find((et) => et.count === 1) || q[0], J = qt.filter((et) => et.input).length, I = qt.slice(0, _l).filter((et) => et.input).length, Yt = L?.key === wt ? L : null, kt = I - (Yt?.days ?? 0);
      return d.default.createElement("div", { className: "tracking-feedback" }, d.default.createElement("section", null, d.default.createElement("h3", null, "기록 요약"), d.default.createElement("p", null, qt.length, "일 중 ", d.default.createElement("strong", null, J, "일 기록")), Jt && d.default.createElement("p", { className: "pm-muted" }, Yt?.error ? "지난달 기록을 불러오지 못했습니다." : Yt ? "같은 기간(1~" + _l + "일) · 이번 조회 월 " + I + "일 / 직전 월 " + Yt.days + "일 · " + (kt === 0 ? "기록 일수 동일" : Math.abs(kt) + "일 " + (kt > 0 ? "더 기록" : "덜 기록")) : "지난달 기록을 불러오는 중입니다.")), g.length > 0 && d.default.createElement("section", null, d.default.createElement("h3", null, "측정값 변화"), d.default.createElement("ul", { className: "tracking-feedback-list" }, g.map(({ key: et, label: Ut, unit: ne, latest: Jn, count: Wt, change: dl }) => d.default.createElement("li", { key: et }, d.default.createElement("strong", null, Ut), d.default.createElement("p", null, dl || "저장된 측정값 없음"), Jn && d.default.createElement("p", { className: "pm-muted" }, "최근 기록 ", Jn.date, " · ", Wt < 2 ? "비교할 기록 부족" : et === "bp" || et === "weight" ? "같은 측정 조건의 첫값과 최근값" : "첫값과 최근값"), d.default.createElement(ep, { key: nt, label: Ut }, () => Yc(et, Ut, ne, N, S)))))), ee.length > 0 && d.default.createElement("section", null, d.default.createElement("h3", null, "실천 변화"), d.default.createElement("ul", { className: "tracking-feedback-list" }, ee.map((et) => d.default.createElement("li", { key: et }, d.default.createElement("strong", null, ce[et]), d.default.createElement("p", null, tr(qt.map((Ut) => ({ status: Vo(Ut.input, et) })))), d.default.createElement(ep, { key: nt, label: ce[et] }, () => Yc(et, ce[et], null, N, S, false)))))), d.default.createElement("section", null, d.default.createElement("h3", null, "기록 피드백"), d.default.createElement("p", null, J === 0 ? "아직 이달의 저장 기록이 없습니다. 기록 입력에서 첫 기록을 저장해 보세요." : G ? G.count === 1 ? G.label + "은 " + (G.key === "bp" || G.key === "weight" ? "같은 조건의 " : "") + "기록이 한 번 있습니다. 다음 값을 저장하면 비교할 수 있습니다." : G.label + " 기록이 없습니다. 다음에 측정하면 값을 저장해 보세요." : "달력에서 날짜를 선택하면 그날의 저장 기록을 확인할 수 있습니다.")));
    }
    function Yc(g, q, G, J, I, Yt = true) {
      if (Object.hasOwn(ce, g)) {
        let Wt = qt.map((Ql) => ({ date: Ql.date, status: Vo(Ql.input, g) })), dl = Wt.find((Ql) => Ql.date === J);
        return d.default.createElement(d.default.Fragment, null, Yt && d.default.createElement("p", null, tr(Wt)), d.default.createElement("div", { className: "tracking-practice" }, Wt.map(({ date: Ql, status: ge }) => d.default.createElement("button", { type: "button", key: Ql, "data-status": ge, "aria-pressed": J === Ql, onClick: () => I(Ql), "aria-label": Ql + " " + xc[ge] }, Ql.slice(8), " ", d.default.createElement("span", { "aria-hidden": "true" }, { DONE: "●", NOT_DONE: "×", PARTIAL: "◐", UNRECORDED: "—" }[ge])))), dl && d.default.createElement("p", null, dl.date, " · ", xc[dl.status]));
      }
      let kt = g === "bp" ? ["sys", "dia"] : [g], et = (Wt) => kt.map((dl) => Wt[dl] ?? "미입력").join(" / ") + " " + G, Ut = qt.findLast((Wt) => Wt[kt[0]] != null), ne = qt.find((Wt) => Wt.date === J && Wt[kt[0]] != null), Jn = (Wt, dl) => d.default.createElement(Hc, { key: dl, rows: Wt, keys: kt, title: dl, unit: G, onSelect: I });
      return d.default.createElement(d.default.Fragment, null, Ut && d.default.createElement("p", null, "최근 기록 · ", Ut.date, " · ", et(Ut)), g === "bp" && Vn.length ? Vn.map((Wt) => {
        let [dl, Ql] = Wt.split("_");
        return Jn(qt.map((ge) => ge.input && ge.input.bpContext + "_" + ge.input.bpTime === Wt ? ge : { ...ge, sys: null, dia: null }), q + " · " + Bc[dl] + " / " + Qe[Ql]);
      }) : g === "weight" && Ro.length ? Ro.map((Wt) => Jn(qt.map((dl) => dl.input?.weightTime === Wt ? dl : { ...dl, weight: null }), q + " · " + Qe[Wt])) : Jn(qt, q), ne && d.default.createElement("p", null, ne.date, " · ", et(ne)));
    }
    function Kn(g, q, G) {
      let J = Q?.key === g;
      return d.default.createElement(d.default.Fragment, null, d.default.createElement("button", { className: "tracking-trend-toggle", type: "button", "aria-label": q + (J ? " 추이 닫기" : " 추이 보기"), "aria-expanded": J, "aria-controls": "daily-trend-" + g, onClick: () => D(J ? null : { key: g, date: null }) }, J ? "추이 닫기" : "추이 보기"), d.default.createElement("section", { className: "tracking-trend-panel", id: "daily-trend-" + g, hidden: !J, "aria-label": q + " 추이" }, J && d.default.createElement(d.default.Fragment, null, d.default.createElement("p", { className: "pm-muted" }, nt, " · 저장된 기록"), Yc(g, q, G, Q.date, (I) => D((Yt) => Yt?.key === g ? { key: g, date: I } : Yt)))));
    }
    function Lc(g, q, G) {
      return d.default.createElement("label", null, G, d.default.createElement("select", { value: f[g], onChange: (J) => K(g, J.target.value) }, Object.entries(q).map(([J, I]) => d.default.createElement("option", { key: J, value: J }, I))));
    }
    return d.default.createElement(d.default.Fragment, null, !t && d.default.createElement(d.default.Fragment, null, d.default.createElement("p", { className: "pm-eyebrow" }, "MY SMARTNF · DAILY RECORDS"), d.default.createElement("h1", null, "오늘 기록하기·기간별 조회"), d.default.createElement("nav", { className: "pm-nav" }, d.default.createElement("a", { href: "/mypage" }, "내 MyPage"), d.default.createElement("a", { href: "/health/info" }, "건강정보·관리항목 선택"), d.default.createElement("a", { href: "/mypage/consent" }, "저장 동의·철회"), d.default.createElement("a", { href: "/mypage/account" }, "계정 설정"), d.default.createElement("a", { href: "/mypage/examples" }, "가상 예시"))), d.default.createElement("p", { role: "status", className: "pm-status" }, _ ? "처리 중입니다. 입력·이동은 완료 후 가능합니다." : o), !a?.consent.agreed && d.default.createElement("p", null, "일일 실천·측정 기록을 저장하려면 ", d.default.createElement("a", { href: "/mypage/consent" }, "갱신된 저장 안내와 동의"), "를 확인하세요. ", d.default.createElement("button", { disabled: _, type: "button", onClick: () => Kt() }, "다시 불러오기")), a?.consent.agreed && i && d.default.createElement(d.default.Fragment, null, !n && d.default.createElement("section", { className: "pm-card" }, d.default.createElement("h2", null, "관리할 항목 선택"), d.default.createElement("p", null, "선택한 항목은 계정에 저장됩니다. 선택을 해제해도 기존 기록은 보관됩니다."), d.default.createElement("fieldset", { disabled: _ }, d.default.createElement("legend", null, "수치로 기록"), hv.map(([g, q]) => d.default.createElement("div", { key: g, role: "group", "aria-label": g }, d.default.createElement("p", { className: "pm-muted" }, d.default.createElement("strong", null, g)), d.default.createElement("div", { className: "tracking-options" }, q.map((G) => d.default.createElement("label", { key: G }, d.default.createElement("input", { type: "checkbox", checked: lt.includes(G), onChange: () => W((J) => J.includes(G) ? J.filter((I) => I !== G) : [...J, G]) }), pv[G])))))), d.default.createElement("fieldset", { disabled: _ }, d.default.createElement("legend", null, "실천 여부로 기록"), d.default.createElement("div", { className: "tracking-options" }, V.map(([g, q]) => d.default.createElement("label", { key: g }, d.default.createElement("input", { type: "checkbox", checked: lt.includes(g), onChange: () => W((G) => G.includes(g) ? G.filter((J) => J !== g) : [...G, g]) }), q)))), d.default.createElement("button", { type: "button", className: "pm-primary", disabled: _ || !Y, onClick: Nl }, "선택 항목 저장"), " ", d.default.createElement("a", { href: "/health/info" }, "건강정보에서 관리 방향 확인"), " · ", d.default.createElement("a", { href: "/preview/health/recommendations" }, "식품 선택 가이드"), " · ", d.default.createElement("a", { href: "/preview/health/diet" }, "식생활 관리 가이드")), d.default.createElement("section", { className: "pm-card" }, d.default.createElement("div", { className: "tracking-month" }, d.default.createElement("h2", null, nt.slice(0, 4), "년 ", Number(nt.slice(5)), "월"), d.default.createElement("div", { className: "pm-actions" }, d.default.createElement("button", { type: "button", disabled: _ || nt === "1900-01", onClick: () => H(...ol(te(nt, -1), a.options.today)) }, "이전 달"), d.default.createElement("button", { type: "button", disabled: _ || nt >= a.options.today.slice(0, 7), onClick: () => H(...ol(te(nt, 1), a.options.today)) }, "다음 달"), d.default.createElement("button", { type: "button", disabled: _, onClick: () => {
      (y !== a.options.today || nt !== a.options.today.slice(0, 7)) && v() && Kt(a.options.today);
    } }, "오늘"))), d.default.createElement("div", { className: "tracking-calendar" }, ["일", "월", "화", "수", "목", "금", "토"].map((g) => d.default.createElement("strong", { key: g }, g)), ye(nt).map((g, q) => g ? d.default.createElement("button", { key: g, type: "button", "aria-label": g + (El.has(g) ? " 기록 있음" : ""), "aria-pressed": (n ? N : y) === g, disabled: _ || g > a.options.today, onClick: () => n ? S(g) : x(g) }, d.default.createElement("span", null, Number(g.slice(8))), El.has(g) && d.default.createElement("span", { "aria-hidden": "true" }, "●")) : d.default.createElement("span", { key: q }))), d.default.createElement("p", { className: "pm-muted" }, "● 저장 기록이 있는 날짜")), !n && d.default.createElement("section", { id: "daily-editor", className: "pm-card" }, d.default.createElement("h2", null, "기록 입력·수정"), d.default.createElement("p", null, "선택한 날짜의 측정값과 실천 여부를 입력하세요. 빈 항목은 미기록으로 표시됩니다."), d.default.createElement("h3", null, "편집 중인 날짜: ", y, " · ", i.record ? "저장본 수정" : "새 기록"), a.options.needsReview && d.default.createElement("p", null, "건강정보 변경으로 관리항목 재확인이 필요합니다. 건강정보 화면에서 재확정해 주세요. 기존 날짜의 항목은 계속 수정할 수 있습니다."), d.default.createElement("form", { key: y, onSubmit: (g) => {
      g.preventDefault(), w();
    } }, d.default.createElement("fieldset", { disabled: _ }, d.default.createElement("legend", null, "실천·측정 기록"), !Ot.length && d.default.createElement("p", null, "위에서 관리할 항목을 선택하고 저장하세요."), d.default.createElement("div", { className: "tracking-edit-list" }, ee.map((g) => {
      let q = f.items[g];
      return d.default.createElement("div", { className: "tracking-edit-row tracking-habit-row", key: g }, d.default.createElement("div", { className: "tracking-edit-title" }, ce[g], q?.status === "PARTIAL" && d.default.createElement("small", null, "기존 기록 · 일부 실천")), d.default.createElement("div", { className: "tracking-edit-controls", role: "group", "aria-label": ce[g] }, [["DONE", "실천"], ["NOT_DONE", "미실천"]].map(([G, J]) => d.default.createElement("button", { key: G, type: "button", className: "tracking-status", "aria-pressed": q?.status === G, onClick: () => ot(g, "status", q?.status === G ? "UNRECORDED" : G) }, J))), d.default.createElement("details", { className: "tracking-edit-note" }, d.default.createElement("summary", null, q?.note ? "메모 있음" : "메모 +"), d.default.createElement("label", null, "실천 메모", d.default.createElement("textarea", { rows: 2, maxLength: 500, value: q?.note || "", onChange: (G) => ot(g, "note", G.target.value) }))), Kn(g, ce[g]));
    }), Qa.map(([g, [q, G, J, I, Yt]]) => d.default.createElement("div", { className: "tracking-edit-row", key: g }, d.default.createElement("label", { className: "tracking-inline-field" }, d.default.createElement("span", null, q, " (", G, ")"), d.default.createElement("input", { type: "number", min: J, max: I, step: Yt, value: f.metrics[g] ?? "", onChange: (kt) => {
      let et = kt.target.value;
      r((Ut) => ({ ...Ut, metrics: { ...Ut.metrics, [g]: et === "" ? null : Number(et) } }));
    } })), Kn(g, q, G))), (Ot.includes("weight") || rt) && d.default.createElement("div", { className: "tracking-edit-row" }, d.default.createElement("label", { className: "tracking-inline-field" }, d.default.createElement("span", null, "체중 (kg)"), d.default.createElement("input", { type: "number", min: "1", max: "400", step: "0.1", value: f.weight, onChange: (g) => K("weight", g.target.value) })), d.default.createElement("details", { className: "tracking-edit-note" }, d.default.createElement("summary", null, "측정 시간대", f.weightTime !== "UNKNOWN" && " · " + Qe[f.weightTime]), Lc("weightTime", Qe, "체중 측정 시간대")), Kn("weight", "체중", "kg")), rt && d.default.createElement(d.default.Fragment, null, rl("height", "키", "cm", 1, 300, 0.1), d.default.createElement("div", { className: "tracking-edit-row" }, d.default.createElement("span", null, "BMI"), d.default.createElement("output", { "aria-label": "계산된 BMI" }, Bt == null ? "이 날짜의 키와 체중을 입력하세요." : Bt.toFixed(2) + " kg/m²"), Kn("bmi", "BMI", "kg/m²"))), P.map(([g, [q, G, J, I, Yt]]) => rl(g, q, G, J, I, Yt)), Ot.includes("bp") && d.default.createElement("div", { className: "tracking-edit-row" }, d.default.createElement("span", null, "혈압 (mmHg)"), d.default.createElement("div", { className: "tracking-edit-controls" }, d.default.createElement("label", null, "수축기", d.default.createElement("input", { type: "number", min: "30", max: "300", step: "1", value: f.sys, onChange: (g) => K("sys", g.target.value) })), d.default.createElement("label", null, "이완기", d.default.createElement("input", { type: "number", min: "20", max: "200", step: "1", value: f.dia, onChange: (g) => K("dia", g.target.value) }))), d.default.createElement("details", { className: "tracking-edit-note" }, d.default.createElement("summary", null, "측정 환경·시간대"), Lc("bpContext", Bc, "혈압 측정 환경"), Lc("bpTime", Qe, "혈압 측정 시간대")), Kn("bp", "혈압", "mmHg"))), d.default.createElement("p", { className: "pm-muted" }, "혈압은 두 값을 함께 입력하세요. 입력 범위는 오입력 방지용이며 정상·위험 판정 기준이 아닙니다. 빈 값은 미입력으로 저장합니다."), d.default.createElement("details", { className: "tracking-edit-note" }, d.default.createElement("summary", null, f.note ? "하루 메모 있음" : "하루 메모 +"), d.default.createElement("label", null, "하루 메모", d.default.createElement("textarea", { rows: 2, maxLength: 1e3, value: f.note, onChange: (g) => K("note", g.target.value) }))), d.default.createElement("div", { className: "pm-actions" }, d.default.createElement("button", { className: "pm-primary", type: "submit" }, i.record ? "수정 내용 저장" : "일일 기록 저장"), d.default.createElement("button", { type: "button", disabled: !i.record, onClick: () => w(true) }, "이 날짜 기록 내용 삭제"), d.default.createElement("button", { type: "button", onClick: () => {
      v() && Kt(y, m);
    } }, "최신 기록 다시 불러오기")), d.default.createElement("p", { className: "pm-muted" }, Vt ? "아직 저장하지 않은 입력이 있습니다." : "현재 저장 상태입니다.", " 단순 기록 삭제는 관리항목 중단·회원 탈퇴와 다릅니다.")))), d.default.createElement("section", { className: "pm-card pm-timeline" }, d.default.createElement("h2", null, n ? "월별 변화" : "월별 기록"), d.default.createElement("p", null, nt, !n && " · 기록 " + T.length + "일"), n && (k ? cp() : d.default.createElement("p", null, "이달 기록을 확인하려면 월을 다시 조회해 주세요.")), d.default.createElement("section", { className: "pm-detail", "aria-live": "polite" }, d.default.createElement("h3", null, "선택한 날짜"), al ? d.default.createElement(d.default.Fragment, null, d.default.createElement("p", null, al.date, " · ", al.input ? "저장 기록 있음" : "미기록"), al.input && d.default.createElement(d.default.Fragment, null, d.default.createElement("p", null, "혈압: ", al.sys == null ? "미입력" : al.sys + "/" + al.dia + " mmHg", " · 체중: ", al.weight == null ? "미입력" : al.weight + " kg"), d.default.createElement("ul", null, Object.entries({ ...Qn, ...Nn, height: ["키", "cm"], bmi: ["BMI", "kg/m²"] }).map(([g, [q, G]]) => al[g] == null ? null : d.default.createElement("li", { key: g }, q, " · ", al[g], " ", G)), al.input.items.map((g) => d.default.createElement("li", { key: g.id }, ce[g.id] || g.id, " · ", xc[g.status], " · ", g.note))), d.default.createElement("p", null, "혈압 조건: ", Bc[al.input.bpContext], " / ", Qe[al.input.bpTime], " · 체중 시간대: ", Qe[al.input.weightTime]), d.default.createElement("p", null, al.input.note)), !n && d.default.createElement("button", { disabled: _, type: "button", onClick: () => x(al.date) }, "이 날짜 입력·수정")) : d.default.createElement("p", null, n ? "그래프 점 또는 날짜를 선택하세요." : "달력에서 고른 날짜의 저장 기록을 확인할 수 있습니다.")), d.default.createElement("details", null, d.default.createElement("summary", null, "이전 실천·측정 기록 원문 확인"), d.default.createElement("div", { className: "pm-table-scroll" }, d.default.createElement("table", null, d.default.createElement("caption", null, "본인 계정의 일일 저장 기록 · 날짜를 누르면 입력·수정"), d.default.createElement("thead", null, d.default.createElement("tr", null, d.default.createElement("th", null, "날짜"), d.default.createElement("th", null, "혈압 (mmHg)·조건"), d.default.createElement("th", null, "체중 (kg)·시간대"), d.default.createElement("th", null, "실천·메모"))), d.default.createElement("tbody", null, T.map((g) => d.default.createElement("tr", { key: g.date }, d.default.createElement("th", null, d.default.createElement("button", { type: "button", disabled: _, onClick: () => n ? S(g.date) : x(g.date) }, d.default.createElement("span", { className: "pm-date-year" }, g.date.slice(0, 4), "년"), d.default.createElement("span", { className: "pm-date-monthday" }, Number(g.date.slice(5, 7)), "월 ", Number(g.date.slice(8)), "일")), e && d.default.createElement("button", { type: "button", disabled: _, onClick: () => e(g.date) }, "식사 기록")), d.default.createElement("td", null, g.input.sys == null ? "미입력" : `${g.input.sys}/${g.input.dia} · ${Bc[g.input.bpContext]}/${Qe[g.input.bpTime]}`), d.default.createElement("td", null, g.input.weight == null ? "미입력" : `${g.input.weight} · ${Qe[g.input.weightTime]}`), d.default.createElement("td", null, g.input.items.map((q) => (ce[q.id] || q.id) + ": " + xc[q.status] + (q.note ? " (" + q.note + ")" : "")).join(" · "), g.input.note && d.default.createElement("p", null, g.input.note)))))))), !T.length && d.default.createElement("p", null, "선택한 기간에 저장된 일일 기록이 없습니다."))));
  }
  function np() {
    let t = location.hash.slice(1);
    return t === "daily" ? "care" : Object.hasOwn(Ac, t) ? t : location.pathname.startsWith("/mypage/health") || location.pathname.endsWith("/mypage/consent") ? "health" : location.pathname.endsWith("/mypage/plans") ? "plans" : location.pathname.endsWith("/mypage/daily") ? "care" : "dashboard";
  }
  function Io() {
    let [t, l] = (0, X.useState)(np), [e, n] = (0, X.useState)(null), [a, u] = (0, X.useState)(bn), [i, c] = (0, X.useState)(() => ["care", "feedback"].includes(np())), f = bn(), [r, y] = (0, X.useState)(false), [b, m] = (0, X.useState)(false), [h, T] = (0, X.useState)(false), [M, _] = (0, X.useState)(() => location.pathname.endsWith("/history") ? "history" : location.pathname.endsWith("/consent") ? "consent" : "latest"), s = (S) => {
      S !== t && (t === "meals" && r || t === "plans" && b || t === "health" && h) && !confirm("저장 전 입력을 버리고 이동할까요?") || (S === "health" && _("latest"), l(S), (S === "care" || S === "feedback") && c(true), history.replaceState(null, "", location.pathname + "#" + S));
    }, o = e?.consent.agreed, p = e?.care;
    function N() {
      return X.default.createElement(wo, { initialDate: a, onDateChange: u, onDirty: y });
    }
    return X.default.createElement(zo, { date: a, maxDate: f, onDateChange: (S) => {
      pe(S) && S >= "1900-01-01" && S <= f && u(S);
    }, active: t, onNavigate: s }, X.default.createElement("section", { hidden: t !== "dashboard", "aria-label": "내 대시보드" }, X.default.createElement("div", { className: "nr-start" }, X.default.createElement("div", null, X.default.createElement("span", { className: "nr-kicker" }, "나의 관리를 이어가세요"), X.default.createElement("h2", null, e ? o ? p?.items.length ? p.needsReview ? "관리항목을 다시 확인해 주세요" : "오늘의 실천과 측정을 기록하세요" : "실천할 관리항목을 정해보세요" : "건강정보 저장 안내를 확인해 주세요" : "계정 정보를 확인해 주세요"), X.default.createElement("p", null, "건강정보에서 관리 방향을 정하고, 기록과 변화를 여기서 확인합니다.")), e && (o ? !p?.items.length || p.needsReview ? X.default.createElement("a", { className: "nr-primary nr-action-link", href: "/health/info" }, "내 관리 시작하기") : X.default.createElement("button", { className: "nr-primary", type: "button", onClick: () => s("care") }, "오늘 실천·측정 기록하기") : X.default.createElement("a", { className: "nr-primary nr-action-link", href: "/mypage/consent" }, "저장 안내·동의"))), X.default.createElement("section", { className: "nr-card" }, X.default.createElement("h3", null, "나의 관리항목·실천 기록"), X.default.createElement("button", { type: "button", onClick: () => s("care") }, "관리 달력 열기")), X.default.createElement("section", { className: "nr-card member-health-overview" }, X.default.createElement("h3", null, "나의 건강정보"), X.default.createElement("p", null, "저장한 건강 수치·질환·생활습관·목표와 이전 저장본을 확인하고 수정합니다."), X.default.createElement("button", { type: "button", onClick: () => s("health") }, "나의 건강정보 확인·수정")), X.default.createElement("section", { className: "nr-card member-food-overview" }, X.default.createElement("div", { className: "nr-card-head" }, X.default.createElement("h3", null, a, " 식사·재료 성분"), X.default.createElement("span", { className: "nr-chip" }, "식사 기록 연결")), X.default.createElement("div", { className: "nr-meal-grid" }, ["아침", "점심", "저녁", "간식"].map((S) => X.default.createElement("button", { type: "button", key: S, onClick: () => s("meals") }, X.default.createElement("span", null, S), X.default.createElement("strong", null, "기록 확인·입력"), X.default.createElement("span", null, "식사 달력 보기 →")))), X.default.createElement("p", { className: "nr-muted" }, "날짜별 식사 달력에서 본인의 음식명과 확인한 재료를 기록하고 재료별 100g당 기준 성분을 확인하세요.")), X.default.createElement("section", { className: "nr-card" }, X.default.createElement("h3", null, "식단·장보기·외식 계획"), X.default.createElement("p", null, "날짜별로 고른 음식·식재료·참고 재료를 계정에 보관합니다. 실제 식사와 별도입니다."), X.default.createElement("button", { type: "button", onClick: () => s("plans") }, "식단 계획 달력 열기")), X.default.createElement("section", { className: "member-personal-cards personal-mypage" }, X.default.createElement("h3", null, "내가 선택한 기록 카드"), X.default.createElement(Qo, { embedded: true, onSnapshot: n }))), t === "health" && X.default.createElement(Uo, { initialView: M, onDirty: T, onSaved: (S) => n((Q) => Q && { ...Q, profile: S, care: Q.care ? { ...Q.care, needsReview: true } : null }) }), t === "plans" && X.default.createElement(Xo, { onDirty: m }), t === "meals" && N(), t === "feedback" && X.default.createElement("section", { className: "nr-card" }, X.default.createElement("h3", null, "같은 조건의 기록을 돌아보세요"), X.default.createElement("p", null, "아래 요약과 피드백은 저장한 실천·측정 기록을 기준으로 표시합니다. 식사·재료 성분은 별도 달력에서 확인할 수 있습니다."), X.default.createElement("button", { type: "button", onClick: () => s("meals") }, "식사·재료 성분 달력")), i && X.default.createElement("section", { hidden: !["care", "feedback"].includes(t), className: "member-daily-view personal-mypage " + (t === "feedback" ? "member-history-only" : "") }, X.default.createElement($o, { embedded: true, historyOnly: t === "feedback", onEdit: () => s("care"), onMealDate: (S) => {
      u(S), s("meals");
    } })), t === "settings" && X.default.createElement("div", { className: "nr-card-grid" }, X.default.createElement("section", { className: "nr-card" }, X.default.createElement("h3", null, "회원정보·계정"), X.default.createElement("p", null, "이메일·비밀번호·SNS 연결 상태·회원 탈퇴를 관리합니다."), X.default.createElement("a", { className: "nr-link", href: "/mypage/account" }, "회원정보·계정 설정 열기")), X.default.createElement("section", { className: "nr-card" }, X.default.createElement("h3", null, "내 정보 보호"), X.default.createElement("p", null, "건강정보·일일 기록 저장 동의와 철회·삭제 범위를 확인합니다."), X.default.createElement("a", { className: "nr-link", href: "/mypage/consent" }, "저장 동의·철회 관리"), X.default.createElement("a", { className: "nr-link", href: "/mypage/health" }, "건강정보 저장본"), X.default.createElement("a", { className: "nr-link", href: "/mypage/health/history" }, "건강정보 저장 이력"))));
  }
  (0, ap.createRoot)(document.getElementById("personal-mypage-root")).render(window.location.pathname.endsWith("/mypage/examples") ? Po.default.createElement(ko, null) : Po.default.createElement(Io, null));
})();
/*! Bundled license information:

react/cjs/react.production.js:
  (**
   * @license React
   * react.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

scheduler/cjs/scheduler.production.js:
  (**
   * @license React
   * scheduler.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-dom/cjs/react-dom.production.js:
  (**
   * @license React
   * react-dom.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-dom/cjs/react-dom-client.production.js:
  (**
   * @license React
   * react-dom-client.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/

// SPDX-FileCopyrightText: 2022 Jorrit Rouwe
// SPDX-License-Identifier: MIT
// This is Web Assembly version of Jolt Physics, see: https://github.com/jrouwe/JoltPhysics.js

var Jolt = (() => {
  var _scriptDir = import.meta.url;
  
  return (
async function(moduleArg = {}) {

  var b = moduleArg, aa, ba;
  b.ready = new Promise((a, c) => { aa = a; ba = c });

  var ca = Object.assign({}, b),
      da = "./this.program",
      ea = "object" == typeof window,
      ha = "function" == typeof importScripts,
      ia = "object" == typeof process && "object" == typeof process.versions && "string" == typeof process.versions.node,
      ja = "",
      ka, la;
  if (ia) {
      const {
          createRequire: a
      } = await import("module");
      var require = a(import.meta.url),
          fs = require("fs"),
          ma = require("path");
      ha ? ja = ma.dirname(ja) + "/" : ja = require("url").fileURLToPath(new URL("./", import.meta.url));
      ka = (c, e) => {
          c = c.startsWith("file://") ? new URL(c) : ma.normalize(c);
          return fs.readFileSync(c, e ? void 0 : "utf8")
      };
      la = c => {
          c = ka(c, !0);
          c.buffer || (c = new Uint8Array(c));
          return c
      };
      !b.thisProgram && 1 < process.argv.length && (da = process.argv[1].replace(/\\/g, "/"));
      process.argv.slice(2);
      b.inspect = () => "[Emscripten Module object]"
  } else if (ea || ha) ha ? ja = self.location.href : "undefined" != typeof document && document.currentScript && (ja = document.currentScript.src), _scriptDir && (ja = _scriptDir), 0 !== ja.indexOf("blob:") ? ja = ja.substr(0, ja.replace(/[?#].*/, "").lastIndexOf("/") + 1) : ja = "", ka = a => {
      var c = new XMLHttpRequest;
      c.open("GET", a, !1);
      c.send(null);
      return c.responseText
  }, ha && (la = a => {
      var c = new XMLHttpRequest;
      c.open("GET", a, !1);
      c.responseType = "arraybuffer";
      c.send(null);
      return new Uint8Array(c.response)
  });
  var na = b.print || console.log.bind(console),
      oa = b.printErr || console.error.bind(console);
  Object.assign(b, ca);
  ca = null;
  b.thisProgram && (da = b.thisProgram);
  var pa;
  b.wasmBinary && (pa = b.wasmBinary);
  var noExitRuntime = b.noExitRuntime || !0;
  "object" != typeof WebAssembly && qa("no native wasm support detected");
  var ra, d, sa = !1,
      ta, ua, va, wa, xa = [],
      ya = [],
      za = [],
      Aa = !1;

  function Ba() {
      var a = b.preRun.shift();
      xa.unshift(a)
  }
  var Ca = 0,
      Da = null,
      Ea = null;

  function qa(a) {
      if (b.onAbort) b.onAbort(a);
      a = "Aborted(" + a + ")";
      oa(a);
      sa = !0;
      a = new WebAssembly.RuntimeError(a + ". Build with -sASSERTIONS for more info.");
      ba(a);
      throw a;
  }

  function Fa(a) {
      return a.startsWith("data:application/octet-stream;base64,")
  }
  
  var Ga;
  if (!Fa(Ga)) {
      var Ha = Ga;
      Ga = b.locateFile ? b.locateFile(Ha, ja) : ja + Ha
  }

  function Ia() {
      var a = Ga;
      return Promise.resolve().then(() => {
          if (a == Ga && pa) var c = new Uint8Array(pa);
          else {
              if (Fa(a)) {
                  var e = a.slice(37);
                  if ("undefined" != typeof ia && ia) c = Buffer.from(e, "base64"), c = new Uint8Array(c.buffer, c.byteOffset, c.byteLength);
                  else try {
                      var f = atob(e),
                          t = new Uint8Array(f.length);
                      for (e = 0; e < f.length; ++e) t[e] = f.charCodeAt(e);
                      c = t
                  } catch (G) {
                      throw Error("Converting base64 string to bytes failed.");
                  }
              } else c = void 0;
              if (!c)
                  if (la) c = la(a);
                  else throw "both async and sync fetching of the wasm failed";
          }
          return c
      })
  }

  function Ka(a, c) {
      return Ia().then(e => WebAssembly.instantiate(e, a)).then(e => e).then(c, e => {
          oa("failed to asynchronously prepare wasm: " + e);
          qa(e)
      })
  }

  function La(a, c) {
      return Ka(a, c)
  }
  var Na = a => {
      for (; 0 < a.length;) a.shift()(b)
  };

  function Oa(a) {
      this.gq = a - 24;
      this.ct = function(c) {
          wa[this.gq + 4 >> 2] = c
      };
      this.bt = function(c) {
          wa[this.gq + 8 >> 2] = c
      };
      this.Zs = function(c, e) {
          this.$s();
          this.ct(c);
          this.bt(e)
      };
      this.$s = function() {
          wa[this.gq + 16 >> 2] = 0
      }
  }
  var Pa = 0,
      Qa = 0,
      Ra = {},
      Ta = () => {
          if (!Sa) {
              var a = {
                      USER: "web_user",
                      LOGNAME: "web_user",
                      PATH: "/",
                      PWD: "/",
                      HOME: "/home/web_user",
                      LANG: ("object" == typeof navigator && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8",
                      _: da || "./this.program"
                  },
                  c;
              for (c in Ra) void 0 === Ra[c] ? delete a[c] : a[c] = Ra[c];
              var e = [];
              for (c in a) e.push(`${c}=${a[c]}`);
              Sa = e
          }
          return Sa
      },
      Sa, Ua = "undefined" != typeof TextDecoder ? new TextDecoder("utf8") : void 0,
      Wa = (a, c) => {
          for (var e = c + NaN, f = c; a[f] && !(f >= e);) ++f;
          if (16 < f - c && a.buffer &&
              Ua) return Ua.decode(a.subarray(c, f));
          for (e = ""; c < f;) {
              var t = a[c++];
              if (t & 128) {
                  var G = a[c++] & 63;
                  if (192 == (t & 224)) e += String.fromCharCode((t & 31) << 6 | G);
                  else {
                      var Va = a[c++] & 63;
                      t = 224 == (t & 240) ? (t & 15) << 12 | G << 6 | Va : (t & 7) << 18 | G << 12 | Va << 6 | a[c++] & 63;
                      65536 > t ? e += String.fromCharCode(t) : (t -= 65536, e += String.fromCharCode(55296 | t >> 10, 56320 | t & 1023))
                  }
              } else e += String.fromCharCode(t)
          }
          return e
      },
      Xa = [null, [],
          []
      ],
      Ya = a => 0 === a % 4 && (0 !== a % 100 || 0 === a % 400),
      $a = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
      bb = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  function cb(a) {
      for (var c = 0, e = 0; e < a.length; ++e) {
          var f = a.charCodeAt(e);
          127 >= f ? c++ : 2047 >= f ? c += 2 : 55296 <= f && 57343 >= f ? (c += 4, ++e) : c += 3
      }
      c = Array(c + 1);
      f = c.length;
      e = 0;
      if (0 < f) {
          f = e + f - 1;
          for (var t = 0; t < a.length; ++t) {
              var G = a.charCodeAt(t);
              if (55296 <= G && 57343 >= G) {
                  var Va = a.charCodeAt(++t);
                  G = 65536 + ((G & 1023) << 10) | Va & 1023
              }
              if (127 >= G) {
                  if (e >= f) break;
                  c[e++] = G
              } else {
                  if (2047 >= G) {
                      if (e + 1 >= f) break;
                      c[e++] = 192 | G >> 6
                  } else {
                      if (65535 >= G) {
                          if (e + 2 >= f) break;
                          c[e++] = 224 | G >> 12
                      } else {
                          if (e + 3 >= f) break;
                          c[e++] = 240 | G >> 18;
                          c[e++] = 128 | G >> 12 & 63
                      }
                      c[e++] = 128 |
                          G >> 6 & 63
                  }
                  c[e++] = 128 | G & 63
              }
          }
          c[e] = 0
      }
      return c
  }
  var eb = (a, c, e, f) => {
          function t(k, U, fa) {
              for (k = "number" == typeof k ? k.toString() : k || ""; k.length < U;) k = fa[0] + k;
              return k
          }

          function G(k, U) {
              return t(k, U, "0")
          }

          function Va(k, U) {
              function fa(Pb) {
                  return 0 > Pb ? -1 : 0 < Pb ? 1 : 0
              }
              var Za;
              0 === (Za = fa(k.getFullYear() - U.getFullYear())) && 0 === (Za = fa(k.getMonth() - U.getMonth())) && (Za = fa(k.getDate() - U.getDate()));
              return Za
          }

          function db(k) {
              switch (k.getDay()) {
                  case 0:
                      return new Date(k.getFullYear() - 1, 11, 29);
                  case 1:
                      return k;
                  case 2:
                      return new Date(k.getFullYear(), 0, 3);
                  case 3:
                      return new Date(k.getFullYear(),
                          0, 2);
                  case 4:
                      return new Date(k.getFullYear(), 0, 1);
                  case 5:
                      return new Date(k.getFullYear() - 1, 11, 31);
                  case 6:
                      return new Date(k.getFullYear() - 1, 11, 30)
              }
          }

          function ab(k) {
              var U = k.Eq;
              for (k = new Date((new Date(k.Fq + 1900, 0, 1)).getTime()); 0 < U;) {
                  var fa = k.getMonth(),
                      Za = (Ya(k.getFullYear()) ? $a : bb)[fa];
                  if (U > Za - k.getDate()) U -= Za - k.getDate() + 1, k.setDate(1), 11 > fa ? k.setMonth(fa + 1) : (k.setMonth(0), k.setFullYear(k.getFullYear() + 1));
                  else {
                      k.setDate(k.getDate() + U);
                      break
                  }
              }
              fa = new Date(k.getFullYear() + 1, 0, 4);
              U = db(new Date(k.getFullYear(),
                  0, 4));
              fa = db(fa);
              return 0 >= Va(U, k) ? 0 >= Va(fa, k) ? k.getFullYear() + 1 : k.getFullYear() : k.getFullYear() - 1
          }
          var Ma = va[f + 40 >> 2];
          f = {
              Au: va[f >> 2],
              zu: va[f + 4 >> 2],
              Oq: va[f + 8 >> 2],
              yr: va[f + 12 >> 2],
              Pq: va[f + 16 >> 2],
              Fq: va[f + 20 >> 2],
              Bq: va[f + 24 >> 2],
              Eq: va[f + 28 >> 2],
              Cu: va[f + 32 >> 2],
              yu: va[f + 36 >> 2],
              Bu: Ma ? Ma ? Wa(ua, Ma) : "" : ""
          };
          e = e ? Wa(ua, e) : "";
          Ma = {
              "%c": "%a %b %d %H:%M:%S %Y",
              "%D": "%m/%d/%y",
              "%F": "%Y-%m-%d",
              "%h": "%b",
              "%r": "%I:%M:%S %p",
              "%R": "%H:%M",
              "%T": "%H:%M:%S",
              "%x": "%m/%d/%y",
              "%X": "%H:%M:%S",
              "%Ec": "%c",
              "%EC": "%C",
              "%Ex": "%m/%d/%y",
              "%EX": "%H:%M:%S",
              "%Ey": "%y",
              "%EY": "%Y",
              "%Od": "%d",
              "%Oe": "%e",
              "%OH": "%H",
              "%OI": "%I",
              "%Om": "%m",
              "%OM": "%M",
              "%OS": "%S",
              "%Ou": "%u",
              "%OU": "%U",
              "%OV": "%V",
              "%Ow": "%w",
              "%OW": "%W",
              "%Oy": "%y"
          };
          for (var Ja in Ma) e = e.replace(new RegExp(Ja, "g"), Ma[Ja]);
          var Qb = "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" "),
              Rb = "January February March April May June July August September October November December".split(" ");
          Ma = {
              "%a": k => Qb[k.Bq].substring(0, 3),
              "%A": k => Qb[k.Bq],
              "%b": k => Rb[k.Pq].substring(0, 3),
              "%B": k => Rb[k.Pq],
              "%C": k => G((k.Fq + 1900) / 100 | 0, 2),
              "%d": k => G(k.yr, 2),
              "%e": k => t(k.yr, 2, " "),
              "%g": k => ab(k).toString().substring(2),
              "%G": k => ab(k),
              "%H": k => G(k.Oq, 2),
              "%I": k => {
                  k = k.Oq;
                  0 == k ? k = 12 : 12 < k && (k -= 12);
                  return G(k, 2)
              },
              "%j": k => {
                  for (var U = 0, fa = 0; fa <= k.Pq - 1; U += (Ya(k.Fq + 1900) ? $a : bb)[fa++]);
                  return G(k.yr + U, 3)
              },
              "%m": k => G(k.Pq + 1, 2),
              "%M": k => G(k.zu, 2),
              "%n": () => "\n",
              "%p": k => 0 <= k.Oq && 12 > k.Oq ? "AM" : "PM",
              "%S": k => G(k.Au, 2),
              "%t": () => "\t",
              "%u": k => k.Bq || 7,
              "%U": k => G(Math.floor((k.Eq + 7 - k.Bq) / 7), 2),
              "%V": k => {
                  var U = Math.floor((k.Eq + 7 - (k.Bq +
                      6) % 7) / 7);
                  2 >= (k.Bq + 371 - k.Eq - 2) % 7 && U++;
                  if (U) 53 == U && (fa = (k.Bq + 371 - k.Eq) % 7, 4 == fa || 3 == fa && Ya(k.Fq) || (U = 1));
                  else {
                      U = 52;
                      var fa = (k.Bq + 7 - k.Eq - 1) % 7;
                      (4 == fa || 5 == fa && Ya(k.Fq % 400 - 1)) && U++
                  }
                  return G(U, 2)
              },
              "%w": k => k.Bq,
              "%W": k => G(Math.floor((k.Eq + 7 - (k.Bq + 6) % 7) / 7), 2),
              "%y": k => (k.Fq + 1900).toString().substring(2),
              "%Y": k => k.Fq + 1900,
              "%z": k => {
                  k = k.yu;
                  var U = 0 <= k;
                  k = Math.abs(k) / 60;
                  return (U ? "+" : "-") + String("0000" + (k / 60 * 100 + k % 60)).slice(-4)
              },
              "%Z": k => k.Bu,
              "%%": () => "%"
          };
          e = e.replace(/%%/g, "\x00\x00");
          for (Ja in Ma) e.includes(Ja) && (e =
              e.replace(new RegExp(Ja, "g"), Ma[Ja](f)));
          e = e.replace(/\0\0/g, "%");
          Ja = cb(e);
          if (Ja.length > c) return 0;
          ta.set(Ja, a);
          return Ja.length - 1
      },
      fb = {
          b: function(a, c, e) {
              (new Oa(a)).Zs(c, e);
              Pa = a;
              Qa++;
              throw Pa;
          },
          d: () => {
              qa("")
          },
          k: () => ua.length,
          a: () => performance.now(),
          m: (a, c, e) => ua.copyWithin(a, c, c + e),
          i: () => {
              qa("OOM")
          },
          e: (a, c) => {
              var e = 0;
              Ta().forEach(function(f, t) {
                  var G = c + e;
                  t = wa[a + 4 * t >> 2] = G;
                  for (G = 0; G < f.length; ++G) ta[t++ >> 0] = f.charCodeAt(G);
                  ta[t >> 0] = 0;
                  e += f.length + 1
              });
              return 0
          },
          f: (a, c) => {
              var e = Ta();
              wa[a >> 2] = e.length;
              var f =
                  0;
              e.forEach(function(t) {
                  f += t.length + 1
              });
              wa[c >> 2] = f;
              return 0
          },
          g: () => 52,
          h: () => 52,
          j: function() {
              return 70
          },
          c: (a, c, e, f) => {
              for (var t = 0, G = 0; G < e; G++) {
                  var Va = wa[c >> 2],
                      db = wa[c + 4 >> 2];
                  c += 8;
                  for (var ab = 0; ab < db; ab++) {
                      var Ma = ua[Va + ab],
                          Ja = Xa[a];
                      0 === Ma || 10 === Ma ? ((1 === a ? na : oa)(Wa(Ja, 0)), Ja.length = 0) : Ja.push(Ma)
                  }
                  t += db
              }
              wa[f >> 2] = t;
              return 0
          },
          l: (a, c, e, f) => eb(a, c, e, f)
      };
  (function() {
      function a(e) {
          d = e = e.exports;
          ra = d.n;
          var f = ra.buffer;
          b.HEAP8 = ta = new Int8Array(f);
          b.HEAP16 = new Int16Array(f);
          b.HEAP32 = va = new Int32Array(f);
          b.HEAPU8 = ua = new Uint8Array(f);
          b.HEAPU16 = new Uint16Array(f);
          b.HEAPU32 = wa = new Uint32Array(f);
          b.HEAPF32 = new Float32Array(f);
          b.HEAPF64 = new Float64Array(f);
          ya.unshift(d.o);
          Ca--;
          b.monitorRunDependencies && b.monitorRunDependencies(Ca);
          0 == Ca && (null !== Da && (clearInterval(Da), Da = null), Ea && (f = Ea, Ea = null, f()));
          return e
      }
      var c = {
          a: fb
      };
      Ca++;
      b.monitorRunDependencies && b.monitorRunDependencies(Ca);
      if (b.instantiateWasm) try {
          return b.instantiateWasm(c, a)
      } catch (e) {
          oa("Module.instantiateWasm callback failed with error: " + e), ba(e)
      }
      La(c, function(e) {
          a(e.instance)
      }).catch(ba);
      return {}
  })();
  var gb = b._emscripten_bind_ShapeSettings_Create_0 = a => (gb = b._emscripten_bind_ShapeSettings_Create_0 = d.p)(a),
      hb = b._emscripten_bind_ShapeSettings_get_mUserData_0 = a => (hb = b._emscripten_bind_ShapeSettings_get_mUserData_0 = d.q)(a),
      ib = b._emscripten_bind_ShapeSettings_set_mUserData_1 = (a, c, e) => (ib = b._emscripten_bind_ShapeSettings_set_mUserData_1 = d.r)(a, c, e),
      jb = b._emscripten_bind_ShapeSettings___destroy___0 = a => (jb = b._emscripten_bind_ShapeSettings___destroy___0 = d.s)(a),
      kb = b._emscripten_bind_Shape_GetType_0 = a =>
      (kb = b._emscripten_bind_Shape_GetType_0 = d.t)(a),
      lb = b._emscripten_bind_Shape_GetSubType_0 = a => (lb = b._emscripten_bind_Shape_GetSubType_0 = d.u)(a),
      mb = b._emscripten_bind_Shape_MustBeStatic_0 = a => (mb = b._emscripten_bind_Shape_MustBeStatic_0 = d.v)(a),
      nb = b._emscripten_bind_Shape_GetLocalBounds_0 = a => (nb = b._emscripten_bind_Shape_GetLocalBounds_0 = d.w)(a),
      ob = b._emscripten_bind_Shape_GetWorldSpaceBounds_2 = (a, c, e) => (ob = b._emscripten_bind_Shape_GetWorldSpaceBounds_2 = d.x)(a, c, e),
      pb = b._emscripten_bind_Shape_GetCenterOfMass_0 =
      a => (pb = b._emscripten_bind_Shape_GetCenterOfMass_0 = d.y)(a),
      qb = b._emscripten_bind_Shape_GetUserData_0 = a => (qb = b._emscripten_bind_Shape_GetUserData_0 = d.z)(a),
      rb = b._emscripten_bind_Shape_SetUserData_1 = (a, c, e) => (rb = b._emscripten_bind_Shape_SetUserData_1 = d.A)(a, c, e),
      sb = b._emscripten_bind_Shape___destroy___0 = a => (sb = b._emscripten_bind_Shape___destroy___0 = d.B)(a),
      tb = b._emscripten_bind_ConstraintSettings_get_mEnabled_0 = a => (tb = b._emscripten_bind_ConstraintSettings_get_mEnabled_0 = d.C)(a),
      ub = b._emscripten_bind_ConstraintSettings_set_mEnabled_1 =
      (a, c) => (ub = b._emscripten_bind_ConstraintSettings_set_mEnabled_1 = d.D)(a, c),
      vb = b._emscripten_bind_ConstraintSettings_get_mNumVelocityStepsOverride_0 = a => (vb = b._emscripten_bind_ConstraintSettings_get_mNumVelocityStepsOverride_0 = d.E)(a),
      wb = b._emscripten_bind_ConstraintSettings_set_mNumVelocityStepsOverride_1 = (a, c) => (wb = b._emscripten_bind_ConstraintSettings_set_mNumVelocityStepsOverride_1 = d.F)(a, c),
      xb = b._emscripten_bind_ConstraintSettings_get_mNumPositionStepsOverride_0 = a => (xb = b._emscripten_bind_ConstraintSettings_get_mNumPositionStepsOverride_0 =
          d.G)(a),
      yb = b._emscripten_bind_ConstraintSettings_set_mNumPositionStepsOverride_1 = (a, c) => (yb = b._emscripten_bind_ConstraintSettings_set_mNumPositionStepsOverride_1 = d.H)(a, c),
      zb = b._emscripten_bind_ConstraintSettings___destroy___0 = a => (zb = b._emscripten_bind_ConstraintSettings___destroy___0 = d.I)(a),
      Ab = b._emscripten_bind_ConvexShapeSettings_Create_0 = a => (Ab = b._emscripten_bind_ConvexShapeSettings_Create_0 = d.J)(a),
      Bb = b._emscripten_bind_ConvexShapeSettings_get_mMaterial_0 = a => (Bb = b._emscripten_bind_ConvexShapeSettings_get_mMaterial_0 =
          d.K)(a),
      Cb = b._emscripten_bind_ConvexShapeSettings_set_mMaterial_1 = (a, c) => (Cb = b._emscripten_bind_ConvexShapeSettings_set_mMaterial_1 = d.L)(a, c),
      Db = b._emscripten_bind_ConvexShapeSettings_get_mDensity_0 = a => (Db = b._emscripten_bind_ConvexShapeSettings_get_mDensity_0 = d.M)(a),
      Eb = b._emscripten_bind_ConvexShapeSettings_set_mDensity_1 = (a, c) => (Eb = b._emscripten_bind_ConvexShapeSettings_set_mDensity_1 = d.N)(a, c),
      Fb = b._emscripten_bind_ConvexShapeSettings_get_mUserData_0 = a => (Fb = b._emscripten_bind_ConvexShapeSettings_get_mUserData_0 =
          d.O)(a),
      Gb = b._emscripten_bind_ConvexShapeSettings_set_mUserData_1 = (a, c, e) => (Gb = b._emscripten_bind_ConvexShapeSettings_set_mUserData_1 = d.P)(a, c, e),
      Hb = b._emscripten_bind_ConvexShapeSettings___destroy___0 = a => (Hb = b._emscripten_bind_ConvexShapeSettings___destroy___0 = d.Q)(a),
      Ib = b._emscripten_bind_ConvexShape_GetDensity_0 = a => (Ib = b._emscripten_bind_ConvexShape_GetDensity_0 = d.R)(a),
      Jb = b._emscripten_bind_ConvexShape_SetDensity_1 = (a, c) => (Jb = b._emscripten_bind_ConvexShape_SetDensity_1 = d.S)(a, c),
      Kb = b._emscripten_bind_ConvexShape_GetType_0 =
      a => (Kb = b._emscripten_bind_ConvexShape_GetType_0 = d.T)(a),
      Lb = b._emscripten_bind_ConvexShape_GetSubType_0 = a => (Lb = b._emscripten_bind_ConvexShape_GetSubType_0 = d.U)(a),
      Mb = b._emscripten_bind_ConvexShape_MustBeStatic_0 = a => (Mb = b._emscripten_bind_ConvexShape_MustBeStatic_0 = d.V)(a),
      Nb = b._emscripten_bind_ConvexShape_GetLocalBounds_0 = a => (Nb = b._emscripten_bind_ConvexShape_GetLocalBounds_0 = d.W)(a),
      Ob = b._emscripten_bind_ConvexShape_GetWorldSpaceBounds_2 = (a, c, e) => (Ob = b._emscripten_bind_ConvexShape_GetWorldSpaceBounds_2 =
          d.X)(a, c, e),
      Sb = b._emscripten_bind_ConvexShape_GetCenterOfMass_0 = a => (Sb = b._emscripten_bind_ConvexShape_GetCenterOfMass_0 = d.Y)(a),
      Tb = b._emscripten_bind_ConvexShape_GetUserData_0 = a => (Tb = b._emscripten_bind_ConvexShape_GetUserData_0 = d.Z)(a),
      Ub = b._emscripten_bind_ConvexShape_SetUserData_1 = (a, c, e) => (Ub = b._emscripten_bind_ConvexShape_SetUserData_1 = d._)(a, c, e),
      Vb = b._emscripten_bind_ConvexShape___destroy___0 = a => (Vb = b._emscripten_bind_ConvexShape___destroy___0 = d.$)(a),
      Wb = b._emscripten_bind_Constraint_SetEnabled_1 =
      (a, c) => (Wb = b._emscripten_bind_Constraint_SetEnabled_1 = d.aa)(a, c),
      Xb = b._emscripten_bind_Constraint_GetEnabled_0 = a => (Xb = b._emscripten_bind_Constraint_GetEnabled_0 = d.ba)(a),
      Yb = b._emscripten_bind_Constraint___destroy___0 = a => (Yb = b._emscripten_bind_Constraint___destroy___0 = d.ca)(a),
      Zb = b._emscripten_bind_TwoBodyConstraintSettings_Create_2 = (a, c, e) => (Zb = b._emscripten_bind_TwoBodyConstraintSettings_Create_2 = d.da)(a, c, e),
      $b = b._emscripten_bind_TwoBodyConstraintSettings_get_mEnabled_0 = a => ($b = b._emscripten_bind_TwoBodyConstraintSettings_get_mEnabled_0 =
          d.ea)(a),
      ac = b._emscripten_bind_TwoBodyConstraintSettings_set_mEnabled_1 = (a, c) => (ac = b._emscripten_bind_TwoBodyConstraintSettings_set_mEnabled_1 = d.fa)(a, c),
      bc = b._emscripten_bind_TwoBodyConstraintSettings_get_mNumVelocityStepsOverride_0 = a => (bc = b._emscripten_bind_TwoBodyConstraintSettings_get_mNumVelocityStepsOverride_0 = d.ga)(a),
      cc = b._emscripten_bind_TwoBodyConstraintSettings_set_mNumVelocityStepsOverride_1 = (a, c) => (cc = b._emscripten_bind_TwoBodyConstraintSettings_set_mNumVelocityStepsOverride_1 = d.ha)(a,
          c),
      dc = b._emscripten_bind_TwoBodyConstraintSettings_get_mNumPositionStepsOverride_0 = a => (dc = b._emscripten_bind_TwoBodyConstraintSettings_get_mNumPositionStepsOverride_0 = d.ia)(a),
      ec = b._emscripten_bind_TwoBodyConstraintSettings_set_mNumPositionStepsOverride_1 = (a, c) => (ec = b._emscripten_bind_TwoBodyConstraintSettings_set_mNumPositionStepsOverride_1 = d.ja)(a, c),
      fc = b._emscripten_bind_TwoBodyConstraintSettings___destroy___0 = a => (fc = b._emscripten_bind_TwoBodyConstraintSettings___destroy___0 = d.ka)(a),
      gc = b._emscripten_bind_GroupFilter___destroy___0 =
      a => (gc = b._emscripten_bind_GroupFilter___destroy___0 = d.la)(a),
      hc = b._emscripten_bind_VoidPtr___destroy___0 = a => (hc = b._emscripten_bind_VoidPtr___destroy___0 = d.ma)(a),
      ic = b._emscripten_bind_JPHString_c_str_0 = a => (ic = b._emscripten_bind_JPHString_c_str_0 = d.na)(a),
      jc = b._emscripten_bind_JPHString_size_0 = a => (jc = b._emscripten_bind_JPHString_size_0 = d.oa)(a),
      kc = b._emscripten_bind_JPHString___destroy___0 = a => (kc = b._emscripten_bind_JPHString___destroy___0 = d.pa)(a),
      lc = b._emscripten_bind_ArrayVec3_size_0 = a => (lc = b._emscripten_bind_ArrayVec3_size_0 =
          d.qa)(a),
      mc = b._emscripten_bind_ArrayVec3_at_1 = (a, c) => (mc = b._emscripten_bind_ArrayVec3_at_1 = d.ra)(a, c),
      nc = b._emscripten_bind_ArrayVec3_push_back_1 = (a, c) => (nc = b._emscripten_bind_ArrayVec3_push_back_1 = d.sa)(a, c),
      oc = b._emscripten_bind_ArrayVec3_reserve_1 = (a, c) => (oc = b._emscripten_bind_ArrayVec3_reserve_1 = d.ta)(a, c),
      pc = b._emscripten_bind_ArrayVec3_resize_1 = (a, c) => (pc = b._emscripten_bind_ArrayVec3_resize_1 = d.ua)(a, c),
      qc = b._emscripten_bind_ArrayVec3___destroy___0 = a => (qc = b._emscripten_bind_ArrayVec3___destroy___0 =
          d.va)(a),
      rc = b._emscripten_bind_Vec3_Vec3_0 = () => (rc = b._emscripten_bind_Vec3_Vec3_0 = d.wa)(),
      sc = b._emscripten_bind_Vec3_Vec3_3 = (a, c, e) => (sc = b._emscripten_bind_Vec3_Vec3_3 = d.xa)(a, c, e),
      tc = b._emscripten_bind_Vec3_sZero_0 = a => (tc = b._emscripten_bind_Vec3_sZero_0 = d.ya)(a),
      uc = b._emscripten_bind_Vec3_sAxisX_0 = a => (uc = b._emscripten_bind_Vec3_sAxisX_0 = d.za)(a),
      vc = b._emscripten_bind_Vec3_sAxisY_0 = a => (vc = b._emscripten_bind_Vec3_sAxisY_0 = d.Aa)(a),
      wc = b._emscripten_bind_Vec3_sAxisZ_0 = a => (wc = b._emscripten_bind_Vec3_sAxisZ_0 =
          d.Ba)(a),
      xc = b._emscripten_bind_Vec3_GetComponent_1 = (a, c) => (xc = b._emscripten_bind_Vec3_GetComponent_1 = d.Ca)(a, c),
      yc = b._emscripten_bind_Vec3_Length_0 = a => (yc = b._emscripten_bind_Vec3_Length_0 = d.Da)(a),
      zc = b._emscripten_bind_Vec3_Normalized_0 = a => (zc = b._emscripten_bind_Vec3_Normalized_0 = d.Ea)(a),
      Ac = b._emscripten_bind_Vec3_GetNormalizedPerpendicular_0 = a => (Ac = b._emscripten_bind_Vec3_GetNormalizedPerpendicular_0 = d.Fa)(a),
      Bc = b._emscripten_bind_Vec3_GetX_0 = a => (Bc = b._emscripten_bind_Vec3_GetX_0 = d.Ga)(a),
      Cc = b._emscripten_bind_Vec3_GetY_0 =
      a => (Cc = b._emscripten_bind_Vec3_GetY_0 = d.Ha)(a),
      Dc = b._emscripten_bind_Vec3_GetZ_0 = a => (Dc = b._emscripten_bind_Vec3_GetZ_0 = d.Ia)(a),
      Ec = b._emscripten_bind_Vec3_SetX_1 = (a, c) => (Ec = b._emscripten_bind_Vec3_SetX_1 = d.Ja)(a, c),
      Fc = b._emscripten_bind_Vec3_SetY_1 = (a, c) => (Fc = b._emscripten_bind_Vec3_SetY_1 = d.Ka)(a, c),
      Gc = b._emscripten_bind_Vec3_SetZ_1 = (a, c) => (Gc = b._emscripten_bind_Vec3_SetZ_1 = d.La)(a, c),
      Hc = b._emscripten_bind_Vec3_SetComponent_2 = (a, c, e) => (Hc = b._emscripten_bind_Vec3_SetComponent_2 = d.Ma)(a, c, e),
      Ic = b._emscripten_bind_Vec3___destroy___0 =
      a => (Ic = b._emscripten_bind_Vec3___destroy___0 = d.Na)(a),
      Jc = b._emscripten_bind_Quat_Quat_0 = () => (Jc = b._emscripten_bind_Quat_Quat_0 = d.Oa)(),
      Kc = b._emscripten_bind_Quat_Quat_4 = (a, c, e, f) => (Kc = b._emscripten_bind_Quat_Quat_4 = d.Pa)(a, c, e, f),
      Lc = b._emscripten_bind_Quat_sIdentity_0 = a => (Lc = b._emscripten_bind_Quat_sIdentity_0 = d.Qa)(a),
      Mc = b._emscripten_bind_Quat_sRotation_2 = (a, c, e) => (Mc = b._emscripten_bind_Quat_sRotation_2 = d.Ra)(a, c, e),
      Nc = b._emscripten_bind_Quat_Length_0 = a => (Nc = b._emscripten_bind_Quat_Length_0 = d.Sa)(a),
      Oc = b._emscripten_bind_Quat_Normalized_0 = a => (Oc = b._emscripten_bind_Quat_Normalized_0 = d.Ta)(a),
      Pc = b._emscripten_bind_Quat_GetX_0 = a => (Pc = b._emscripten_bind_Quat_GetX_0 = d.Ua)(a),
      Qc = b._emscripten_bind_Quat_GetY_0 = a => (Qc = b._emscripten_bind_Quat_GetY_0 = d.Va)(a),
      Rc = b._emscripten_bind_Quat_GetZ_0 = a => (Rc = b._emscripten_bind_Quat_GetZ_0 = d.Wa)(a),
      Sc = b._emscripten_bind_Quat_GetW_0 = a => (Sc = b._emscripten_bind_Quat_GetW_0 = d.Xa)(a),
      Tc = b._emscripten_bind_Quat___destroy___0 = a => (Tc = b._emscripten_bind_Quat___destroy___0 =
          d.Ya)(a),
      Uc = b._emscripten_bind_Float3_Float3_3 = (a, c, e) => (Uc = b._emscripten_bind_Float3_Float3_3 = d.Za)(a, c, e),
      Vc = b._emscripten_bind_Float3_get_x_0 = a => (Vc = b._emscripten_bind_Float3_get_x_0 = d._a)(a),
      Wc = b._emscripten_bind_Float3_set_x_1 = (a, c) => (Wc = b._emscripten_bind_Float3_set_x_1 = d.$a)(a, c),
      Xc = b._emscripten_bind_Float3_get_y_0 = a => (Xc = b._emscripten_bind_Float3_get_y_0 = d.ab)(a),
      Yc = b._emscripten_bind_Float3_set_y_1 = (a, c) => (Yc = b._emscripten_bind_Float3_set_y_1 = d.bb)(a, c),
      Zc = b._emscripten_bind_Float3_get_z_0 =
      a => (Zc = b._emscripten_bind_Float3_get_z_0 = d.cb)(a),
      $c = b._emscripten_bind_Float3_set_z_1 = (a, c) => ($c = b._emscripten_bind_Float3_set_z_1 = d.db)(a, c),
      ad = b._emscripten_bind_Float3___destroy___0 = a => (ad = b._emscripten_bind_Float3___destroy___0 = d.eb)(a),
      bd = b._emscripten_bind_Mat44_sIdentity_0 = a => (bd = b._emscripten_bind_Mat44_sIdentity_0 = d.fb)(a),
      cd = b._emscripten_bind_Mat44_sRotationTranslation_2 = (a, c, e) => (cd = b._emscripten_bind_Mat44_sRotationTranslation_2 = d.gb)(a, c, e),
      dd = b._emscripten_bind_Mat44_GetAxisX_0 = a =>
      (dd = b._emscripten_bind_Mat44_GetAxisX_0 = d.hb)(a),
      ed = b._emscripten_bind_Mat44_GetAxisY_0 = a => (ed = b._emscripten_bind_Mat44_GetAxisY_0 = d.ib)(a),
      fd = b._emscripten_bind_Mat44_GetAxisZ_0 = a => (fd = b._emscripten_bind_Mat44_GetAxisZ_0 = d.jb)(a),
      gd = b._emscripten_bind_Mat44_GetRotation_0 = a => (gd = b._emscripten_bind_Mat44_GetRotation_0 = d.kb)(a),
      hd = b._emscripten_bind_Mat44_GetQuaternion_0 = a => (hd = b._emscripten_bind_Mat44_GetQuaternion_0 = d.lb)(a),
      jd = b._emscripten_bind_Mat44_GetTranslation_0 = a => (jd = b._emscripten_bind_Mat44_GetTranslation_0 =
          d.mb)(a),
      kd = b._emscripten_bind_Mat44___destroy___0 = a => (kd = b._emscripten_bind_Mat44___destroy___0 = d.nb)(a),
      ld = b._emscripten_bind_AABox_AABox_2 = (a, c) => (ld = b._emscripten_bind_AABox_AABox_2 = d.ob)(a, c),
      md = b._emscripten_bind_AABox_sBiggest_0 = a => (md = b._emscripten_bind_AABox_sBiggest_0 = d.pb)(a),
      nd = b._emscripten_bind_AABox_get_mMin_0 = a => (nd = b._emscripten_bind_AABox_get_mMin_0 = d.qb)(a),
      od = b._emscripten_bind_AABox_set_mMin_1 = (a, c) => (od = b._emscripten_bind_AABox_set_mMin_1 = d.rb)(a, c),
      pd = b._emscripten_bind_AABox_get_mMax_0 =
      a => (pd = b._emscripten_bind_AABox_get_mMax_0 = d.sb)(a),
      qd = b._emscripten_bind_AABox_set_mMax_1 = (a, c) => (qd = b._emscripten_bind_AABox_set_mMax_1 = d.tb)(a, c),
      rd = b._emscripten_bind_AABox___destroy___0 = a => (rd = b._emscripten_bind_AABox___destroy___0 = d.ub)(a),
      sd = b._emscripten_bind_PhysicsMaterial_PhysicsMaterial_0 = () => (sd = b._emscripten_bind_PhysicsMaterial_PhysicsMaterial_0 = d.vb)(),
      td = b._emscripten_bind_PhysicsMaterial___destroy___0 = a => (td = b._emscripten_bind_PhysicsMaterial___destroy___0 = d.wb)(a),
      ud = b._emscripten_bind_PhysicsMaterialList_PhysicsMaterialList_0 =
      () => (ud = b._emscripten_bind_PhysicsMaterialList_PhysicsMaterialList_0 = d.xb)(),
      vd = b._emscripten_bind_PhysicsMaterialList_at_1 = (a, c) => (vd = b._emscripten_bind_PhysicsMaterialList_at_1 = d.yb)(a, c),
      wd = b._emscripten_bind_PhysicsMaterialList_push_back_1 = (a, c) => (wd = b._emscripten_bind_PhysicsMaterialList_push_back_1 = d.zb)(a, c),
      xd = b._emscripten_bind_PhysicsMaterialList_reserve_1 = (a, c) => (xd = b._emscripten_bind_PhysicsMaterialList_reserve_1 = d.Ab)(a, c),
      yd = b._emscripten_bind_PhysicsMaterialList_resize_1 = (a, c) => (yd =
          b._emscripten_bind_PhysicsMaterialList_resize_1 = d.Bb)(a, c),
      zd = b._emscripten_bind_PhysicsMaterialList___destroy___0 = a => (zd = b._emscripten_bind_PhysicsMaterialList___destroy___0 = d.Cb)(a),
      Ad = b._emscripten_bind_Triangle_Triangle_0 = () => (Ad = b._emscripten_bind_Triangle_Triangle_0 = d.Db)(),
      Bd = b._emscripten_bind_Triangle_Triangle_3 = (a, c, e) => (Bd = b._emscripten_bind_Triangle_Triangle_3 = d.Eb)(a, c, e),
      Cd = b._emscripten_bind_Triangle_get_mV_1 = (a, c) => (Cd = b._emscripten_bind_Triangle_get_mV_1 = d.Fb)(a, c),
      Dd = b._emscripten_bind_Triangle_set_mV_2 =
      (a, c, e) => (Dd = b._emscripten_bind_Triangle_set_mV_2 = d.Gb)(a, c, e),
      Ed = b._emscripten_bind_Triangle_get_mMaterialIndex_0 = a => (Ed = b._emscripten_bind_Triangle_get_mMaterialIndex_0 = d.Hb)(a),
      Fd = b._emscripten_bind_Triangle_set_mMaterialIndex_1 = (a, c) => (Fd = b._emscripten_bind_Triangle_set_mMaterialIndex_1 = d.Ib)(a, c),
      Gd = b._emscripten_bind_Triangle___destroy___0 = a => (Gd = b._emscripten_bind_Triangle___destroy___0 = d.Jb)(a),
      Hd = b._emscripten_bind_TriangleList_TriangleList_0 = () => (Hd = b._emscripten_bind_TriangleList_TriangleList_0 =
          d.Kb)(),
      Id = b._emscripten_bind_TriangleList_at_1 = (a, c) => (Id = b._emscripten_bind_TriangleList_at_1 = d.Lb)(a, c),
      Jd = b._emscripten_bind_TriangleList_push_back_1 = (a, c) => (Jd = b._emscripten_bind_TriangleList_push_back_1 = d.Mb)(a, c),
      Kd = b._emscripten_bind_TriangleList_reserve_1 = (a, c) => (Kd = b._emscripten_bind_TriangleList_reserve_1 = d.Nb)(a, c),
      Ld = b._emscripten_bind_TriangleList_resize_1 = (a, c) => (Ld = b._emscripten_bind_TriangleList_resize_1 = d.Ob)(a, c),
      Md = b._emscripten_bind_TriangleList___destroy___0 = a => (Md = b._emscripten_bind_TriangleList___destroy___0 =
          d.Pb)(a),
      Nd = b._emscripten_bind_VertexList_VertexList_0 = () => (Nd = b._emscripten_bind_VertexList_VertexList_0 = d.Qb)(),
      Od = b._emscripten_bind_VertexList_at_1 = (a, c) => (Od = b._emscripten_bind_VertexList_at_1 = d.Rb)(a, c),
      Pd = b._emscripten_bind_VertexList_push_back_1 = (a, c) => (Pd = b._emscripten_bind_VertexList_push_back_1 = d.Sb)(a, c),
      Qd = b._emscripten_bind_VertexList_reserve_1 = (a, c) => (Qd = b._emscripten_bind_VertexList_reserve_1 = d.Tb)(a, c),
      Rd = b._emscripten_bind_VertexList_resize_1 = (a, c) => (Rd = b._emscripten_bind_VertexList_resize_1 =
          d.Ub)(a, c),
      Sd = b._emscripten_bind_VertexList___destroy___0 = a => (Sd = b._emscripten_bind_VertexList___destroy___0 = d.Vb)(a),
      Td = b._emscripten_bind_IndexedTriangle_IndexedTriangle_0 = () => (Td = b._emscripten_bind_IndexedTriangle_IndexedTriangle_0 = d.Wb)(),
      Ud = b._emscripten_bind_IndexedTriangle_IndexedTriangle_4 = (a, c, e, f) => (Ud = b._emscripten_bind_IndexedTriangle_IndexedTriangle_4 = d.Xb)(a, c, e, f),
      Vd = b._emscripten_bind_IndexedTriangle_get_mIdx_1 = (a, c) => (Vd = b._emscripten_bind_IndexedTriangle_get_mIdx_1 = d.Yb)(a, c),
      Wd =
      b._emscripten_bind_IndexedTriangle_set_mIdx_2 = (a, c, e) => (Wd = b._emscripten_bind_IndexedTriangle_set_mIdx_2 = d.Zb)(a, c, e),
      Xd = b._emscripten_bind_IndexedTriangle_get_mMaterialIndex_0 = a => (Xd = b._emscripten_bind_IndexedTriangle_get_mMaterialIndex_0 = d._b)(a),
      Yd = b._emscripten_bind_IndexedTriangle_set_mMaterialIndex_1 = (a, c) => (Yd = b._emscripten_bind_IndexedTriangle_set_mMaterialIndex_1 = d.$b)(a, c),
      Zd = b._emscripten_bind_IndexedTriangle___destroy___0 = a => (Zd = b._emscripten_bind_IndexedTriangle___destroy___0 = d.ac)(a),
      $d = b._emscripten_bind_IndexedTriangleList_IndexedTriangleList_0 = () => ($d = b._emscripten_bind_IndexedTriangleList_IndexedTriangleList_0 = d.bc)(),
      ae = b._emscripten_bind_IndexedTriangleList_at_1 = (a, c) => (ae = b._emscripten_bind_IndexedTriangleList_at_1 = d.cc)(a, c),
      be = b._emscripten_bind_IndexedTriangleList_push_back_1 = (a, c) => (be = b._emscripten_bind_IndexedTriangleList_push_back_1 = d.dc)(a, c),
      ce = b._emscripten_bind_IndexedTriangleList_reserve_1 = (a, c) => (ce = b._emscripten_bind_IndexedTriangleList_reserve_1 = d.ec)(a,
          c),
      de = b._emscripten_bind_IndexedTriangleList_resize_1 = (a, c) => (de = b._emscripten_bind_IndexedTriangleList_resize_1 = d.fc)(a, c),
      ee = b._emscripten_bind_IndexedTriangleList___destroy___0 = a => (ee = b._emscripten_bind_IndexedTriangleList___destroy___0 = d.gc)(a),
      fe = b._emscripten_bind_ShapeResult_IsValid_0 = a => (fe = b._emscripten_bind_ShapeResult_IsValid_0 = d.hc)(a),
      ge = b._emscripten_bind_ShapeResult_HasError_0 = a => (ge = b._emscripten_bind_ShapeResult_HasError_0 = d.ic)(a),
      he = b._emscripten_bind_ShapeResult_GetError_0 = a =>
      (he = b._emscripten_bind_ShapeResult_GetError_0 = d.jc)(a),
      ie = b._emscripten_bind_ShapeResult_Get_0 = a => (ie = b._emscripten_bind_ShapeResult_Get_0 = d.kc)(a),
      je = b._emscripten_bind_ShapeResult___destroy___0 = a => (je = b._emscripten_bind_ShapeResult___destroy___0 = d.lc)(a),
      ke = b._emscripten_bind_ShapeGetTriangles_ShapeGetTriangles_5 = (a, c, e, f, t) => (ke = b._emscripten_bind_ShapeGetTriangles_ShapeGetTriangles_5 = d.mc)(a, c, e, f, t),
      le = b._emscripten_bind_ShapeGetTriangles_GetNumTriangles_0 = a => (le = b._emscripten_bind_ShapeGetTriangles_GetNumTriangles_0 =
          d.nc)(a),
      me = b._emscripten_bind_ShapeGetTriangles_GetVerticesSize_0 = a => (me = b._emscripten_bind_ShapeGetTriangles_GetVerticesSize_0 = d.oc)(a),
      ne = b._emscripten_bind_ShapeGetTriangles_GetVerticesData_0 = a => (ne = b._emscripten_bind_ShapeGetTriangles_GetVerticesData_0 = d.pc)(a),
      oe = b._emscripten_bind_ShapeGetTriangles_GetMaterial_1 = (a, c) => (oe = b._emscripten_bind_ShapeGetTriangles_GetMaterial_1 = d.qc)(a, c),
      pe = b._emscripten_bind_ShapeGetTriangles___destroy___0 = a => (pe = b._emscripten_bind_ShapeGetTriangles___destroy___0 =
          d.rc)(a),
      qe = b._emscripten_bind_SphereShapeSettings_SphereShapeSettings_2 = (a, c) => (qe = b._emscripten_bind_SphereShapeSettings_SphereShapeSettings_2 = d.sc)(a, c),
      re = b._emscripten_bind_SphereShapeSettings_Create_0 = a => (re = b._emscripten_bind_SphereShapeSettings_Create_0 = d.tc)(a),
      se = b._emscripten_bind_SphereShapeSettings_get_mRadius_0 = a => (se = b._emscripten_bind_SphereShapeSettings_get_mRadius_0 = d.uc)(a),
      te = b._emscripten_bind_SphereShapeSettings_set_mRadius_1 = (a, c) => (te = b._emscripten_bind_SphereShapeSettings_set_mRadius_1 =
          d.vc)(a, c),
      ue = b._emscripten_bind_SphereShapeSettings_get_mMaterial_0 = a => (ue = b._emscripten_bind_SphereShapeSettings_get_mMaterial_0 = d.wc)(a),
      ve = b._emscripten_bind_SphereShapeSettings_set_mMaterial_1 = (a, c) => (ve = b._emscripten_bind_SphereShapeSettings_set_mMaterial_1 = d.xc)(a, c),
      we = b._emscripten_bind_SphereShapeSettings_get_mDensity_0 = a => (we = b._emscripten_bind_SphereShapeSettings_get_mDensity_0 = d.yc)(a),
      xe = b._emscripten_bind_SphereShapeSettings_set_mDensity_1 = (a, c) => (xe = b._emscripten_bind_SphereShapeSettings_set_mDensity_1 =
          d.zc)(a, c),
      ye = b._emscripten_bind_SphereShapeSettings_get_mUserData_0 = a => (ye = b._emscripten_bind_SphereShapeSettings_get_mUserData_0 = d.Ac)(a),
      ze = b._emscripten_bind_SphereShapeSettings_set_mUserData_1 = (a, c, e) => (ze = b._emscripten_bind_SphereShapeSettings_set_mUserData_1 = d.Bc)(a, c, e),
      Ae = b._emscripten_bind_SphereShapeSettings___destroy___0 = a => (Ae = b._emscripten_bind_SphereShapeSettings___destroy___0 = d.Cc)(a),
      Be = b._emscripten_bind_SphereShape_SphereShape_2 = (a, c) => (Be = b._emscripten_bind_SphereShape_SphereShape_2 =
          d.Dc)(a, c),
      Ce = b._emscripten_bind_SphereShape_GetDensity_0 = a => (Ce = b._emscripten_bind_SphereShape_GetDensity_0 = d.Ec)(a),
      De = b._emscripten_bind_SphereShape_SetDensity_1 = (a, c) => (De = b._emscripten_bind_SphereShape_SetDensity_1 = d.Fc)(a, c),
      Ee = b._emscripten_bind_SphereShape_GetType_0 = a => (Ee = b._emscripten_bind_SphereShape_GetType_0 = d.Gc)(a),
      Fe = b._emscripten_bind_SphereShape_GetSubType_0 = a => (Fe = b._emscripten_bind_SphereShape_GetSubType_0 = d.Hc)(a),
      Ge = b._emscripten_bind_SphereShape_MustBeStatic_0 = a => (Ge = b._emscripten_bind_SphereShape_MustBeStatic_0 =
          d.Ic)(a),
      He = b._emscripten_bind_SphereShape_GetLocalBounds_0 = a => (He = b._emscripten_bind_SphereShape_GetLocalBounds_0 = d.Jc)(a),
      Ie = b._emscripten_bind_SphereShape_GetWorldSpaceBounds_2 = (a, c, e) => (Ie = b._emscripten_bind_SphereShape_GetWorldSpaceBounds_2 = d.Kc)(a, c, e),
      Je = b._emscripten_bind_SphereShape_GetCenterOfMass_0 = a => (Je = b._emscripten_bind_SphereShape_GetCenterOfMass_0 = d.Lc)(a),
      Ke = b._emscripten_bind_SphereShape_GetUserData_0 = a => (Ke = b._emscripten_bind_SphereShape_GetUserData_0 = d.Mc)(a),
      Le = b._emscripten_bind_SphereShape_SetUserData_1 =
      (a, c, e) => (Le = b._emscripten_bind_SphereShape_SetUserData_1 = d.Nc)(a, c, e),
      Me = b._emscripten_bind_SphereShape___destroy___0 = a => (Me = b._emscripten_bind_SphereShape___destroy___0 = d.Oc)(a),
      Ne = b._emscripten_bind_BoxShapeSettings_BoxShapeSettings_3 = (a, c, e) => (Ne = b._emscripten_bind_BoxShapeSettings_BoxShapeSettings_3 = d.Pc)(a, c, e),
      Oe = b._emscripten_bind_BoxShapeSettings_Create_0 = a => (Oe = b._emscripten_bind_BoxShapeSettings_Create_0 = d.Qc)(a),
      Pe = b._emscripten_bind_BoxShapeSettings_get_mHalfExtent_0 = a => (Pe = b._emscripten_bind_BoxShapeSettings_get_mHalfExtent_0 =
          d.Rc)(a),
      Qe = b._emscripten_bind_BoxShapeSettings_set_mHalfExtent_1 = (a, c) => (Qe = b._emscripten_bind_BoxShapeSettings_set_mHalfExtent_1 = d.Sc)(a, c),
      Re = b._emscripten_bind_BoxShapeSettings_get_mConvexRadius_0 = a => (Re = b._emscripten_bind_BoxShapeSettings_get_mConvexRadius_0 = d.Tc)(a),
      Se = b._emscripten_bind_BoxShapeSettings_set_mConvexRadius_1 = (a, c) => (Se = b._emscripten_bind_BoxShapeSettings_set_mConvexRadius_1 = d.Uc)(a, c),
      Te = b._emscripten_bind_BoxShapeSettings_get_mMaterial_0 = a => (Te = b._emscripten_bind_BoxShapeSettings_get_mMaterial_0 =
          d.Vc)(a),
      Ue = b._emscripten_bind_BoxShapeSettings_set_mMaterial_1 = (a, c) => (Ue = b._emscripten_bind_BoxShapeSettings_set_mMaterial_1 = d.Wc)(a, c),
      Ve = b._emscripten_bind_BoxShapeSettings_get_mDensity_0 = a => (Ve = b._emscripten_bind_BoxShapeSettings_get_mDensity_0 = d.Xc)(a),
      We = b._emscripten_bind_BoxShapeSettings_set_mDensity_1 = (a, c) => (We = b._emscripten_bind_BoxShapeSettings_set_mDensity_1 = d.Yc)(a, c),
      Xe = b._emscripten_bind_BoxShapeSettings_get_mUserData_0 = a => (Xe = b._emscripten_bind_BoxShapeSettings_get_mUserData_0 = d.Zc)(a),
      Ye = b._emscripten_bind_BoxShapeSettings_set_mUserData_1 = (a, c, e) => (Ye = b._emscripten_bind_BoxShapeSettings_set_mUserData_1 = d._c)(a, c, e),
      Ze = b._emscripten_bind_BoxShapeSettings___destroy___0 = a => (Ze = b._emscripten_bind_BoxShapeSettings___destroy___0 = d.$c)(a),
      $e = b._emscripten_bind_BoxShape_BoxShape_3 = (a, c, e) => ($e = b._emscripten_bind_BoxShape_BoxShape_3 = d.ad)(a, c, e),
      af = b._emscripten_bind_BoxShape_GetDensity_0 = a => (af = b._emscripten_bind_BoxShape_GetDensity_0 = d.bd)(a),
      bf = b._emscripten_bind_BoxShape_SetDensity_1 =
      (a, c) => (bf = b._emscripten_bind_BoxShape_SetDensity_1 = d.cd)(a, c),
      cf = b._emscripten_bind_BoxShape_GetType_0 = a => (cf = b._emscripten_bind_BoxShape_GetType_0 = d.dd)(a),
      df = b._emscripten_bind_BoxShape_GetSubType_0 = a => (df = b._emscripten_bind_BoxShape_GetSubType_0 = d.ed)(a),
      ef = b._emscripten_bind_BoxShape_MustBeStatic_0 = a => (ef = b._emscripten_bind_BoxShape_MustBeStatic_0 = d.fd)(a),
      ff = b._emscripten_bind_BoxShape_GetLocalBounds_0 = a => (ff = b._emscripten_bind_BoxShape_GetLocalBounds_0 = d.gd)(a),
      gf = b._emscripten_bind_BoxShape_GetWorldSpaceBounds_2 =
      (a, c, e) => (gf = b._emscripten_bind_BoxShape_GetWorldSpaceBounds_2 = d.hd)(a, c, e),
      hf = b._emscripten_bind_BoxShape_GetCenterOfMass_0 = a => (hf = b._emscripten_bind_BoxShape_GetCenterOfMass_0 = d.id)(a),
      jf = b._emscripten_bind_BoxShape_GetUserData_0 = a => (jf = b._emscripten_bind_BoxShape_GetUserData_0 = d.jd)(a),
      kf = b._emscripten_bind_BoxShape_SetUserData_1 = (a, c, e) => (kf = b._emscripten_bind_BoxShape_SetUserData_1 = d.kd)(a, c, e),
      lf = b._emscripten_bind_BoxShape___destroy___0 = a => (lf = b._emscripten_bind_BoxShape___destroy___0 = d.ld)(a),
      mf = b._emscripten_bind_CylinderShapeSettings_CylinderShapeSettings_4 = (a, c, e, f) => (mf = b._emscripten_bind_CylinderShapeSettings_CylinderShapeSettings_4 = d.md)(a, c, e, f),
      nf = b._emscripten_bind_CylinderShapeSettings_Create_0 = a => (nf = b._emscripten_bind_CylinderShapeSettings_Create_0 = d.nd)(a),
      of = b._emscripten_bind_CylinderShapeSettings_get_mHalfHeight_0 = a => (of = b._emscripten_bind_CylinderShapeSettings_get_mHalfHeight_0 = d.od)(a),
      pf = b._emscripten_bind_CylinderShapeSettings_set_mHalfHeight_1 = (a, c) => (pf = b._emscripten_bind_CylinderShapeSettings_set_mHalfHeight_1 =
          d.pd)(a, c),
      qf = b._emscripten_bind_CylinderShapeSettings_get_mRadius_0 = a => (qf = b._emscripten_bind_CylinderShapeSettings_get_mRadius_0 = d.qd)(a),
      rf = b._emscripten_bind_CylinderShapeSettings_set_mRadius_1 = (a, c) => (rf = b._emscripten_bind_CylinderShapeSettings_set_mRadius_1 = d.rd)(a, c),
      sf = b._emscripten_bind_CylinderShapeSettings_get_mConvexRadius_0 = a => (sf = b._emscripten_bind_CylinderShapeSettings_get_mConvexRadius_0 = d.sd)(a),
      tf = b._emscripten_bind_CylinderShapeSettings_set_mConvexRadius_1 = (a, c) => (tf = b._emscripten_bind_CylinderShapeSettings_set_mConvexRadius_1 =
          d.td)(a, c),
      uf = b._emscripten_bind_CylinderShapeSettings_get_mMaterial_0 = a => (uf = b._emscripten_bind_CylinderShapeSettings_get_mMaterial_0 = d.ud)(a),
      vf = b._emscripten_bind_CylinderShapeSettings_set_mMaterial_1 = (a, c) => (vf = b._emscripten_bind_CylinderShapeSettings_set_mMaterial_1 = d.vd)(a, c),
      wf = b._emscripten_bind_CylinderShapeSettings_get_mDensity_0 = a => (wf = b._emscripten_bind_CylinderShapeSettings_get_mDensity_0 = d.wd)(a),
      xf = b._emscripten_bind_CylinderShapeSettings_set_mDensity_1 = (a, c) => (xf = b._emscripten_bind_CylinderShapeSettings_set_mDensity_1 =
          d.xd)(a, c),
      yf = b._emscripten_bind_CylinderShapeSettings_get_mUserData_0 = a => (yf = b._emscripten_bind_CylinderShapeSettings_get_mUserData_0 = d.yd)(a),
      zf = b._emscripten_bind_CylinderShapeSettings_set_mUserData_1 = (a, c, e) => (zf = b._emscripten_bind_CylinderShapeSettings_set_mUserData_1 = d.zd)(a, c, e),
      Af = b._emscripten_bind_CylinderShapeSettings___destroy___0 = a => (Af = b._emscripten_bind_CylinderShapeSettings___destroy___0 = d.Ad)(a),
      Bf = b._emscripten_bind_CylinderShape_CylinderShape_4 = (a, c, e, f) => (Bf = b._emscripten_bind_CylinderShape_CylinderShape_4 =
          d.Bd)(a, c, e, f),
      Cf = b._emscripten_bind_CylinderShape_GetDensity_0 = a => (Cf = b._emscripten_bind_CylinderShape_GetDensity_0 = d.Cd)(a),
      Df = b._emscripten_bind_CylinderShape_SetDensity_1 = (a, c) => (Df = b._emscripten_bind_CylinderShape_SetDensity_1 = d.Dd)(a, c),
      Ef = b._emscripten_bind_CylinderShape_GetType_0 = a => (Ef = b._emscripten_bind_CylinderShape_GetType_0 = d.Ed)(a),
      Ff = b._emscripten_bind_CylinderShape_GetSubType_0 = a => (Ff = b._emscripten_bind_CylinderShape_GetSubType_0 = d.Fd)(a),
      Gf = b._emscripten_bind_CylinderShape_MustBeStatic_0 =
      a => (Gf = b._emscripten_bind_CylinderShape_MustBeStatic_0 = d.Gd)(a),
      Hf = b._emscripten_bind_CylinderShape_GetLocalBounds_0 = a => (Hf = b._emscripten_bind_CylinderShape_GetLocalBounds_0 = d.Hd)(a),
      If = b._emscripten_bind_CylinderShape_GetWorldSpaceBounds_2 = (a, c, e) => (If = b._emscripten_bind_CylinderShape_GetWorldSpaceBounds_2 = d.Id)(a, c, e),
      Jf = b._emscripten_bind_CylinderShape_GetCenterOfMass_0 = a => (Jf = b._emscripten_bind_CylinderShape_GetCenterOfMass_0 = d.Jd)(a),
      Kf = b._emscripten_bind_CylinderShape_GetUserData_0 = a => (Kf = b._emscripten_bind_CylinderShape_GetUserData_0 =
          d.Kd)(a),
      Lf = b._emscripten_bind_CylinderShape_SetUserData_1 = (a, c, e) => (Lf = b._emscripten_bind_CylinderShape_SetUserData_1 = d.Ld)(a, c, e),
      Mf = b._emscripten_bind_CylinderShape___destroy___0 = a => (Mf = b._emscripten_bind_CylinderShape___destroy___0 = d.Md)(a),
      Nf = b._emscripten_bind_CapsuleShapeSettings_CapsuleShapeSettings_3 = (a, c, e) => (Nf = b._emscripten_bind_CapsuleShapeSettings_CapsuleShapeSettings_3 = d.Nd)(a, c, e),
      Of = b._emscripten_bind_CapsuleShapeSettings_Create_0 = a => (Of = b._emscripten_bind_CapsuleShapeSettings_Create_0 =
          d.Od)(a),
      Pf = b._emscripten_bind_CapsuleShapeSettings_get_mRadius_0 = a => (Pf = b._emscripten_bind_CapsuleShapeSettings_get_mRadius_0 = d.Pd)(a),
      Qf = b._emscripten_bind_CapsuleShapeSettings_set_mRadius_1 = (a, c) => (Qf = b._emscripten_bind_CapsuleShapeSettings_set_mRadius_1 = d.Qd)(a, c),
      Rf = b._emscripten_bind_CapsuleShapeSettings_get_mHalfHeightOfCylinder_0 = a => (Rf = b._emscripten_bind_CapsuleShapeSettings_get_mHalfHeightOfCylinder_0 = d.Rd)(a),
      Sf = b._emscripten_bind_CapsuleShapeSettings_set_mHalfHeightOfCylinder_1 = (a, c) =>
      (Sf = b._emscripten_bind_CapsuleShapeSettings_set_mHalfHeightOfCylinder_1 = d.Sd)(a, c),
      Tf = b._emscripten_bind_CapsuleShapeSettings_get_mMaterial_0 = a => (Tf = b._emscripten_bind_CapsuleShapeSettings_get_mMaterial_0 = d.Td)(a),
      Uf = b._emscripten_bind_CapsuleShapeSettings_set_mMaterial_1 = (a, c) => (Uf = b._emscripten_bind_CapsuleShapeSettings_set_mMaterial_1 = d.Ud)(a, c),
      Vf = b._emscripten_bind_CapsuleShapeSettings_get_mDensity_0 = a => (Vf = b._emscripten_bind_CapsuleShapeSettings_get_mDensity_0 = d.Vd)(a),
      Wf = b._emscripten_bind_CapsuleShapeSettings_set_mDensity_1 =
      (a, c) => (Wf = b._emscripten_bind_CapsuleShapeSettings_set_mDensity_1 = d.Wd)(a, c),
      Xf = b._emscripten_bind_CapsuleShapeSettings_get_mUserData_0 = a => (Xf = b._emscripten_bind_CapsuleShapeSettings_get_mUserData_0 = d.Xd)(a),
      Yf = b._emscripten_bind_CapsuleShapeSettings_set_mUserData_1 = (a, c, e) => (Yf = b._emscripten_bind_CapsuleShapeSettings_set_mUserData_1 = d.Yd)(a, c, e),
      Zf = b._emscripten_bind_CapsuleShapeSettings___destroy___0 = a => (Zf = b._emscripten_bind_CapsuleShapeSettings___destroy___0 = d.Zd)(a),
      $f = b._emscripten_bind_CapsuleShape_CapsuleShape_3 =
      (a, c, e) => ($f = b._emscripten_bind_CapsuleShape_CapsuleShape_3 = d._d)(a, c, e),
      ag = b._emscripten_bind_CapsuleShape_GetDensity_0 = a => (ag = b._emscripten_bind_CapsuleShape_GetDensity_0 = d.$d)(a),
      bg = b._emscripten_bind_CapsuleShape_SetDensity_1 = (a, c) => (bg = b._emscripten_bind_CapsuleShape_SetDensity_1 = d.ae)(a, c),
      cg = b._emscripten_bind_CapsuleShape_GetType_0 = a => (cg = b._emscripten_bind_CapsuleShape_GetType_0 = d.be)(a),
      dg = b._emscripten_bind_CapsuleShape_GetSubType_0 = a => (dg = b._emscripten_bind_CapsuleShape_GetSubType_0 = d.ce)(a),
      eg = b._emscripten_bind_CapsuleShape_MustBeStatic_0 = a => (eg = b._emscripten_bind_CapsuleShape_MustBeStatic_0 = d.de)(a),
      fg = b._emscripten_bind_CapsuleShape_GetLocalBounds_0 = a => (fg = b._emscripten_bind_CapsuleShape_GetLocalBounds_0 = d.ee)(a),
      gg = b._emscripten_bind_CapsuleShape_GetWorldSpaceBounds_2 = (a, c, e) => (gg = b._emscripten_bind_CapsuleShape_GetWorldSpaceBounds_2 = d.fe)(a, c, e),
      hg = b._emscripten_bind_CapsuleShape_GetCenterOfMass_0 = a => (hg = b._emscripten_bind_CapsuleShape_GetCenterOfMass_0 = d.ge)(a),
      ig = b._emscripten_bind_CapsuleShape_GetUserData_0 =
      a => (ig = b._emscripten_bind_CapsuleShape_GetUserData_0 = d.he)(a),
      jg = b._emscripten_bind_CapsuleShape_SetUserData_1 = (a, c, e) => (jg = b._emscripten_bind_CapsuleShape_SetUserData_1 = d.ie)(a, c, e),
      kg = b._emscripten_bind_CapsuleShape___destroy___0 = a => (kg = b._emscripten_bind_CapsuleShape___destroy___0 = d.je)(a),
      lg = b._emscripten_bind_TaperedCapsuleShapeSettings_TaperedCapsuleShapeSettings_4 = (a, c, e, f) => (lg = b._emscripten_bind_TaperedCapsuleShapeSettings_TaperedCapsuleShapeSettings_4 = d.ke)(a, c, e, f),
      mg = b._emscripten_bind_TaperedCapsuleShapeSettings_Create_0 =
      a => (mg = b._emscripten_bind_TaperedCapsuleShapeSettings_Create_0 = d.le)(a),
      ng = b._emscripten_bind_TaperedCapsuleShapeSettings_get_mHalfHeightOfTaperedCylinder_0 = a => (ng = b._emscripten_bind_TaperedCapsuleShapeSettings_get_mHalfHeightOfTaperedCylinder_0 = d.me)(a),
      og = b._emscripten_bind_TaperedCapsuleShapeSettings_set_mHalfHeightOfTaperedCylinder_1 = (a, c) => (og = b._emscripten_bind_TaperedCapsuleShapeSettings_set_mHalfHeightOfTaperedCylinder_1 = d.ne)(a, c),
      pg = b._emscripten_bind_TaperedCapsuleShapeSettings_get_mTopRadius_0 =
      a => (pg = b._emscripten_bind_TaperedCapsuleShapeSettings_get_mTopRadius_0 = d.oe)(a),
      qg = b._emscripten_bind_TaperedCapsuleShapeSettings_set_mTopRadius_1 = (a, c) => (qg = b._emscripten_bind_TaperedCapsuleShapeSettings_set_mTopRadius_1 = d.pe)(a, c),
      rg = b._emscripten_bind_TaperedCapsuleShapeSettings_get_mBottomRadius_0 = a => (rg = b._emscripten_bind_TaperedCapsuleShapeSettings_get_mBottomRadius_0 = d.qe)(a),
      sg = b._emscripten_bind_TaperedCapsuleShapeSettings_set_mBottomRadius_1 = (a, c) => (sg = b._emscripten_bind_TaperedCapsuleShapeSettings_set_mBottomRadius_1 =
          d.re)(a, c),
      tg = b._emscripten_bind_TaperedCapsuleShapeSettings_get_mMaterial_0 = a => (tg = b._emscripten_bind_TaperedCapsuleShapeSettings_get_mMaterial_0 = d.se)(a),
      ug = b._emscripten_bind_TaperedCapsuleShapeSettings_set_mMaterial_1 = (a, c) => (ug = b._emscripten_bind_TaperedCapsuleShapeSettings_set_mMaterial_1 = d.te)(a, c),
      vg = b._emscripten_bind_TaperedCapsuleShapeSettings_get_mDensity_0 = a => (vg = b._emscripten_bind_TaperedCapsuleShapeSettings_get_mDensity_0 = d.ue)(a),
      wg = b._emscripten_bind_TaperedCapsuleShapeSettings_set_mDensity_1 =
      (a, c) => (wg = b._emscripten_bind_TaperedCapsuleShapeSettings_set_mDensity_1 = d.ve)(a, c),
      xg = b._emscripten_bind_TaperedCapsuleShapeSettings_get_mUserData_0 = a => (xg = b._emscripten_bind_TaperedCapsuleShapeSettings_get_mUserData_0 = d.we)(a),
      yg = b._emscripten_bind_TaperedCapsuleShapeSettings_set_mUserData_1 = (a, c, e) => (yg = b._emscripten_bind_TaperedCapsuleShapeSettings_set_mUserData_1 = d.xe)(a, c, e),
      zg = b._emscripten_bind_TaperedCapsuleShapeSettings___destroy___0 = a => (zg = b._emscripten_bind_TaperedCapsuleShapeSettings___destroy___0 =
          d.ye)(a),
      Ag = b._emscripten_bind_TaperedCapsuleShape_GetDensity_0 = a => (Ag = b._emscripten_bind_TaperedCapsuleShape_GetDensity_0 = d.ze)(a),
      Bg = b._emscripten_bind_TaperedCapsuleShape_SetDensity_1 = (a, c) => (Bg = b._emscripten_bind_TaperedCapsuleShape_SetDensity_1 = d.Ae)(a, c),
      Cg = b._emscripten_bind_TaperedCapsuleShape_GetType_0 = a => (Cg = b._emscripten_bind_TaperedCapsuleShape_GetType_0 = d.Be)(a),
      Dg = b._emscripten_bind_TaperedCapsuleShape_GetSubType_0 = a => (Dg = b._emscripten_bind_TaperedCapsuleShape_GetSubType_0 = d.Ce)(a),
      Eg = b._emscripten_bind_TaperedCapsuleShape_MustBeStatic_0 = a => (Eg = b._emscripten_bind_TaperedCapsuleShape_MustBeStatic_0 = d.De)(a),
      Fg = b._emscripten_bind_TaperedCapsuleShape_GetLocalBounds_0 = a => (Fg = b._emscripten_bind_TaperedCapsuleShape_GetLocalBounds_0 = d.Ee)(a),
      Gg = b._emscripten_bind_TaperedCapsuleShape_GetWorldSpaceBounds_2 = (a, c, e) => (Gg = b._emscripten_bind_TaperedCapsuleShape_GetWorldSpaceBounds_2 = d.Fe)(a, c, e),
      Hg = b._emscripten_bind_TaperedCapsuleShape_GetCenterOfMass_0 = a => (Hg = b._emscripten_bind_TaperedCapsuleShape_GetCenterOfMass_0 =
          d.Ge)(a),
      Ig = b._emscripten_bind_TaperedCapsuleShape_GetUserData_0 = a => (Ig = b._emscripten_bind_TaperedCapsuleShape_GetUserData_0 = d.He)(a),
      Jg = b._emscripten_bind_TaperedCapsuleShape_SetUserData_1 = (a, c, e) => (Jg = b._emscripten_bind_TaperedCapsuleShape_SetUserData_1 = d.Ie)(a, c, e),
      Kg = b._emscripten_bind_TaperedCapsuleShape___destroy___0 = a => (Kg = b._emscripten_bind_TaperedCapsuleShape___destroy___0 = d.Je)(a),
      Lg = b._emscripten_bind_ConvexHullShapeSettings_ConvexHullShapeSettings_0 = () => (Lg = b._emscripten_bind_ConvexHullShapeSettings_ConvexHullShapeSettings_0 =
          d.Ke)(),
      Mg = b._emscripten_bind_ConvexHullShapeSettings_Create_0 = a => (Mg = b._emscripten_bind_ConvexHullShapeSettings_Create_0 = d.Le)(a),
      Ng = b._emscripten_bind_ConvexHullShapeSettings_get_mPoints_0 = a => (Ng = b._emscripten_bind_ConvexHullShapeSettings_get_mPoints_0 = d.Me)(a),
      Og = b._emscripten_bind_ConvexHullShapeSettings_set_mPoints_1 = (a, c) => (Og = b._emscripten_bind_ConvexHullShapeSettings_set_mPoints_1 = d.Ne)(a, c),
      Pg = b._emscripten_bind_ConvexHullShapeSettings_get_mMaxConvexRadius_0 = a => (Pg = b._emscripten_bind_ConvexHullShapeSettings_get_mMaxConvexRadius_0 =
          d.Oe)(a),
      Qg = b._emscripten_bind_ConvexHullShapeSettings_set_mMaxConvexRadius_1 = (a, c) => (Qg = b._emscripten_bind_ConvexHullShapeSettings_set_mMaxConvexRadius_1 = d.Pe)(a, c),
      Rg = b._emscripten_bind_ConvexHullShapeSettings_get_mMaxErrorConvexRadius_0 = a => (Rg = b._emscripten_bind_ConvexHullShapeSettings_get_mMaxErrorConvexRadius_0 = d.Qe)(a),
      Sg = b._emscripten_bind_ConvexHullShapeSettings_set_mMaxErrorConvexRadius_1 = (a, c) => (Sg = b._emscripten_bind_ConvexHullShapeSettings_set_mMaxErrorConvexRadius_1 = d.Re)(a, c),
      Tg = b._emscripten_bind_ConvexHullShapeSettings_get_mHullTolerance_0 =
      a => (Tg = b._emscripten_bind_ConvexHullShapeSettings_get_mHullTolerance_0 = d.Se)(a),
      Ug = b._emscripten_bind_ConvexHullShapeSettings_set_mHullTolerance_1 = (a, c) => (Ug = b._emscripten_bind_ConvexHullShapeSettings_set_mHullTolerance_1 = d.Te)(a, c),
      Vg = b._emscripten_bind_ConvexHullShapeSettings_get_mMaterial_0 = a => (Vg = b._emscripten_bind_ConvexHullShapeSettings_get_mMaterial_0 = d.Ue)(a),
      Wg = b._emscripten_bind_ConvexHullShapeSettings_set_mMaterial_1 = (a, c) => (Wg = b._emscripten_bind_ConvexHullShapeSettings_set_mMaterial_1 =
          d.Ve)(a, c),
      Xg = b._emscripten_bind_ConvexHullShapeSettings_get_mDensity_0 = a => (Xg = b._emscripten_bind_ConvexHullShapeSettings_get_mDensity_0 = d.We)(a),
      Yg = b._emscripten_bind_ConvexHullShapeSettings_set_mDensity_1 = (a, c) => (Yg = b._emscripten_bind_ConvexHullShapeSettings_set_mDensity_1 = d.Xe)(a, c),
      Zg = b._emscripten_bind_ConvexHullShapeSettings_get_mUserData_0 = a => (Zg = b._emscripten_bind_ConvexHullShapeSettings_get_mUserData_0 = d.Ye)(a),
      $g = b._emscripten_bind_ConvexHullShapeSettings_set_mUserData_1 = (a, c, e) => ($g = b._emscripten_bind_ConvexHullShapeSettings_set_mUserData_1 =
          d.Ze)(a, c, e),
      ah = b._emscripten_bind_ConvexHullShapeSettings___destroy___0 = a => (ah = b._emscripten_bind_ConvexHullShapeSettings___destroy___0 = d._e)(a),
      bh = b._emscripten_bind_ConvexHullShape_GetDensity_0 = a => (bh = b._emscripten_bind_ConvexHullShape_GetDensity_0 = d.$e)(a),
      ch = b._emscripten_bind_ConvexHullShape_SetDensity_1 = (a, c) => (ch = b._emscripten_bind_ConvexHullShape_SetDensity_1 = d.af)(a, c),
      dh = b._emscripten_bind_ConvexHullShape_GetType_0 = a => (dh = b._emscripten_bind_ConvexHullShape_GetType_0 = d.bf)(a),
      eh = b._emscripten_bind_ConvexHullShape_GetSubType_0 =
      a => (eh = b._emscripten_bind_ConvexHullShape_GetSubType_0 = d.cf)(a),
      fh = b._emscripten_bind_ConvexHullShape_MustBeStatic_0 = a => (fh = b._emscripten_bind_ConvexHullShape_MustBeStatic_0 = d.df)(a),
      gh = b._emscripten_bind_ConvexHullShape_GetLocalBounds_0 = a => (gh = b._emscripten_bind_ConvexHullShape_GetLocalBounds_0 = d.ef)(a),
      hh = b._emscripten_bind_ConvexHullShape_GetWorldSpaceBounds_2 = (a, c, e) => (hh = b._emscripten_bind_ConvexHullShape_GetWorldSpaceBounds_2 = d.ff)(a, c, e),
      ih = b._emscripten_bind_ConvexHullShape_GetCenterOfMass_0 =
      a => (ih = b._emscripten_bind_ConvexHullShape_GetCenterOfMass_0 = d.gf)(a),
      jh = b._emscripten_bind_ConvexHullShape_GetUserData_0 = a => (jh = b._emscripten_bind_ConvexHullShape_GetUserData_0 = d.hf)(a),
      kh = b._emscripten_bind_ConvexHullShape_SetUserData_1 = (a, c, e) => (kh = b._emscripten_bind_ConvexHullShape_SetUserData_1 = d.jf)(a, c, e),
      lh = b._emscripten_bind_ConvexHullShape___destroy___0 = a => (lh = b._emscripten_bind_ConvexHullShape___destroy___0 = d.kf)(a),
      mh = b._emscripten_bind_StaticCompoundShapeSettings_StaticCompoundShapeSettings_0 =
      () => (mh = b._emscripten_bind_StaticCompoundShapeSettings_StaticCompoundShapeSettings_0 = d.lf)(),
      nh = b._emscripten_bind_StaticCompoundShapeSettings_AddShape_4 = (a, c, e, f, t) => (nh = b._emscripten_bind_StaticCompoundShapeSettings_AddShape_4 = d.mf)(a, c, e, f, t),
      oh = b._emscripten_bind_StaticCompoundShapeSettings_Create_0 = a => (oh = b._emscripten_bind_StaticCompoundShapeSettings_Create_0 = d.nf)(a),
      ph = b._emscripten_bind_StaticCompoundShapeSettings_get_mUserData_0 = a => (ph = b._emscripten_bind_StaticCompoundShapeSettings_get_mUserData_0 =
          d.of)(a),
      qh = b._emscripten_bind_StaticCompoundShapeSettings_set_mUserData_1 = (a, c, e) => (qh = b._emscripten_bind_StaticCompoundShapeSettings_set_mUserData_1 = d.pf)(a, c, e),
      rh = b._emscripten_bind_StaticCompoundShapeSettings___destroy___0 = a => (rh = b._emscripten_bind_StaticCompoundShapeSettings___destroy___0 = d.qf)(a),
      sh = b._emscripten_bind_StaticCompoundShape_GetType_0 = a => (sh = b._emscripten_bind_StaticCompoundShape_GetType_0 = d.rf)(a),
      th = b._emscripten_bind_StaticCompoundShape_GetSubType_0 = a => (th = b._emscripten_bind_StaticCompoundShape_GetSubType_0 =
          d.sf)(a),
      uh = b._emscripten_bind_StaticCompoundShape_MustBeStatic_0 = a => (uh = b._emscripten_bind_StaticCompoundShape_MustBeStatic_0 = d.tf)(a),
      vh = b._emscripten_bind_StaticCompoundShape_GetLocalBounds_0 = a => (vh = b._emscripten_bind_StaticCompoundShape_GetLocalBounds_0 = d.uf)(a),
      wh = b._emscripten_bind_StaticCompoundShape_GetWorldSpaceBounds_2 = (a, c, e) => (wh = b._emscripten_bind_StaticCompoundShape_GetWorldSpaceBounds_2 = d.vf)(a, c, e),
      xh = b._emscripten_bind_StaticCompoundShape_GetCenterOfMass_0 = a => (xh = b._emscripten_bind_StaticCompoundShape_GetCenterOfMass_0 =
          d.wf)(a),
      yh = b._emscripten_bind_StaticCompoundShape_GetUserData_0 = a => (yh = b._emscripten_bind_StaticCompoundShape_GetUserData_0 = d.xf)(a),
      zh = b._emscripten_bind_StaticCompoundShape_SetUserData_1 = (a, c, e) => (zh = b._emscripten_bind_StaticCompoundShape_SetUserData_1 = d.yf)(a, c, e),
      Ah = b._emscripten_bind_StaticCompoundShape___destroy___0 = a => (Ah = b._emscripten_bind_StaticCompoundShape___destroy___0 = d.zf)(a),
      Bh = b._emscripten_bind_ScaledShapeSettings_ScaledShapeSettings_2 = (a, c) => (Bh = b._emscripten_bind_ScaledShapeSettings_ScaledShapeSettings_2 =
          d.Af)(a, c),
      Ch = b._emscripten_bind_ScaledShapeSettings_Create_0 = a => (Ch = b._emscripten_bind_ScaledShapeSettings_Create_0 = d.Bf)(a),
      Dh = b._emscripten_bind_ScaledShapeSettings_get_mScale_0 = a => (Dh = b._emscripten_bind_ScaledShapeSettings_get_mScale_0 = d.Cf)(a),
      Eh = b._emscripten_bind_ScaledShapeSettings_set_mScale_1 = (a, c) => (Eh = b._emscripten_bind_ScaledShapeSettings_set_mScale_1 = d.Df)(a, c),
      Fh = b._emscripten_bind_ScaledShapeSettings_get_mUserData_0 = a => (Fh = b._emscripten_bind_ScaledShapeSettings_get_mUserData_0 = d.Ef)(a),
      Gh = b._emscripten_bind_ScaledShapeSettings_set_mUserData_1 = (a, c, e) => (Gh = b._emscripten_bind_ScaledShapeSettings_set_mUserData_1 = d.Ff)(a, c, e),
      Hh = b._emscripten_bind_ScaledShapeSettings___destroy___0 = a => (Hh = b._emscripten_bind_ScaledShapeSettings___destroy___0 = d.Gf)(a),
      Ih = b._emscripten_bind_ScaledShape_ScaledShape_2 = (a, c) => (Ih = b._emscripten_bind_ScaledShape_ScaledShape_2 = d.Hf)(a, c),
      Jh = b._emscripten_bind_ScaledShape_GetType_0 = a => (Jh = b._emscripten_bind_ScaledShape_GetType_0 = d.If)(a),
      Kh = b._emscripten_bind_ScaledShape_GetSubType_0 =
      a => (Kh = b._emscripten_bind_ScaledShape_GetSubType_0 = d.Jf)(a),
      Lh = b._emscripten_bind_ScaledShape_MustBeStatic_0 = a => (Lh = b._emscripten_bind_ScaledShape_MustBeStatic_0 = d.Kf)(a),
      Mh = b._emscripten_bind_ScaledShape_GetLocalBounds_0 = a => (Mh = b._emscripten_bind_ScaledShape_GetLocalBounds_0 = d.Lf)(a),
      Nh = b._emscripten_bind_ScaledShape_GetWorldSpaceBounds_2 = (a, c, e) => (Nh = b._emscripten_bind_ScaledShape_GetWorldSpaceBounds_2 = d.Mf)(a, c, e),
      Oh = b._emscripten_bind_ScaledShape_GetCenterOfMass_0 = a => (Oh = b._emscripten_bind_ScaledShape_GetCenterOfMass_0 =
          d.Nf)(a),
      Ph = b._emscripten_bind_ScaledShape_GetUserData_0 = a => (Ph = b._emscripten_bind_ScaledShape_GetUserData_0 = d.Of)(a),
      Qh = b._emscripten_bind_ScaledShape_SetUserData_1 = (a, c, e) => (Qh = b._emscripten_bind_ScaledShape_SetUserData_1 = d.Pf)(a, c, e),
      Rh = b._emscripten_bind_ScaledShape___destroy___0 = a => (Rh = b._emscripten_bind_ScaledShape___destroy___0 = d.Qf)(a),
      Sh = b._emscripten_bind_OffsetCenterOfMassShapeSettings_OffsetCenterOfMassShapeSettings_2 = (a, c) => (Sh = b._emscripten_bind_OffsetCenterOfMassShapeSettings_OffsetCenterOfMassShapeSettings_2 =
          d.Rf)(a, c),
      Th = b._emscripten_bind_OffsetCenterOfMassShapeSettings_Create_0 = a => (Th = b._emscripten_bind_OffsetCenterOfMassShapeSettings_Create_0 = d.Sf)(a),
      Uh = b._emscripten_bind_OffsetCenterOfMassShapeSettings_get_mOffset_0 = a => (Uh = b._emscripten_bind_OffsetCenterOfMassShapeSettings_get_mOffset_0 = d.Tf)(a),
      Vh = b._emscripten_bind_OffsetCenterOfMassShapeSettings_set_mOffset_1 = (a, c) => (Vh = b._emscripten_bind_OffsetCenterOfMassShapeSettings_set_mOffset_1 = d.Uf)(a, c),
      Wh = b._emscripten_bind_OffsetCenterOfMassShapeSettings_get_mUserData_0 =
      a => (Wh = b._emscripten_bind_OffsetCenterOfMassShapeSettings_get_mUserData_0 = d.Vf)(a),
      Xh = b._emscripten_bind_OffsetCenterOfMassShapeSettings_set_mUserData_1 = (a, c, e) => (Xh = b._emscripten_bind_OffsetCenterOfMassShapeSettings_set_mUserData_1 = d.Wf)(a, c, e),
      Yh = b._emscripten_bind_OffsetCenterOfMassShapeSettings___destroy___0 = a => (Yh = b._emscripten_bind_OffsetCenterOfMassShapeSettings___destroy___0 = d.Xf)(a),
      Zh = b._emscripten_bind_OffsetCenterOfMassShape_GetType_0 = a => (Zh = b._emscripten_bind_OffsetCenterOfMassShape_GetType_0 =
          d.Yf)(a),
      $h = b._emscripten_bind_OffsetCenterOfMassShape_GetSubType_0 = a => ($h = b._emscripten_bind_OffsetCenterOfMassShape_GetSubType_0 = d.Zf)(a),
      ai = b._emscripten_bind_OffsetCenterOfMassShape_MustBeStatic_0 = a => (ai = b._emscripten_bind_OffsetCenterOfMassShape_MustBeStatic_0 = d._f)(a),
      bi = b._emscripten_bind_OffsetCenterOfMassShape_GetLocalBounds_0 = a => (bi = b._emscripten_bind_OffsetCenterOfMassShape_GetLocalBounds_0 = d.$f)(a),
      ci = b._emscripten_bind_OffsetCenterOfMassShape_GetWorldSpaceBounds_2 = (a, c, e) => (ci = b._emscripten_bind_OffsetCenterOfMassShape_GetWorldSpaceBounds_2 =
          d.ag)(a, c, e),
      di = b._emscripten_bind_OffsetCenterOfMassShape_GetCenterOfMass_0 = a => (di = b._emscripten_bind_OffsetCenterOfMassShape_GetCenterOfMass_0 = d.bg)(a),
      ei = b._emscripten_bind_OffsetCenterOfMassShape_GetUserData_0 = a => (ei = b._emscripten_bind_OffsetCenterOfMassShape_GetUserData_0 = d.cg)(a),
      fi = b._emscripten_bind_OffsetCenterOfMassShape_SetUserData_1 = (a, c, e) => (fi = b._emscripten_bind_OffsetCenterOfMassShape_SetUserData_1 = d.dg)(a, c, e),
      gi = b._emscripten_bind_OffsetCenterOfMassShape___destroy___0 = a => (gi = b._emscripten_bind_OffsetCenterOfMassShape___destroy___0 =
          d.eg)(a),
      hi = b._emscripten_bind_RotatedTranslatedShapeSettings_RotatedTranslatedShapeSettings_3 = (a, c, e) => (hi = b._emscripten_bind_RotatedTranslatedShapeSettings_RotatedTranslatedShapeSettings_3 = d.fg)(a, c, e),
      ii = b._emscripten_bind_RotatedTranslatedShapeSettings_Create_0 = a => (ii = b._emscripten_bind_RotatedTranslatedShapeSettings_Create_0 = d.gg)(a),
      ji = b._emscripten_bind_RotatedTranslatedShapeSettings_get_mPosition_0 = a => (ji = b._emscripten_bind_RotatedTranslatedShapeSettings_get_mPosition_0 = d.hg)(a),
      ki = b._emscripten_bind_RotatedTranslatedShapeSettings_set_mPosition_1 =
      (a, c) => (ki = b._emscripten_bind_RotatedTranslatedShapeSettings_set_mPosition_1 = d.ig)(a, c),
      li = b._emscripten_bind_RotatedTranslatedShapeSettings_get_mRotation_0 = a => (li = b._emscripten_bind_RotatedTranslatedShapeSettings_get_mRotation_0 = d.jg)(a),
      mi = b._emscripten_bind_RotatedTranslatedShapeSettings_set_mRotation_1 = (a, c) => (mi = b._emscripten_bind_RotatedTranslatedShapeSettings_set_mRotation_1 = d.kg)(a, c),
      ni = b._emscripten_bind_RotatedTranslatedShapeSettings_get_mUserData_0 = a => (ni = b._emscripten_bind_RotatedTranslatedShapeSettings_get_mUserData_0 =
          d.lg)(a),
      oi = b._emscripten_bind_RotatedTranslatedShapeSettings_set_mUserData_1 = (a, c, e) => (oi = b._emscripten_bind_RotatedTranslatedShapeSettings_set_mUserData_1 = d.mg)(a, c, e),
      pi = b._emscripten_bind_RotatedTranslatedShapeSettings___destroy___0 = a => (pi = b._emscripten_bind_RotatedTranslatedShapeSettings___destroy___0 = d.ng)(a),
      qi = b._emscripten_bind_RotatedTranslatedShape_GetType_0 = a => (qi = b._emscripten_bind_RotatedTranslatedShape_GetType_0 = d.og)(a),
      ri = b._emscripten_bind_RotatedTranslatedShape_GetSubType_0 = a =>
      (ri = b._emscripten_bind_RotatedTranslatedShape_GetSubType_0 = d.pg)(a),
      si = b._emscripten_bind_RotatedTranslatedShape_MustBeStatic_0 = a => (si = b._emscripten_bind_RotatedTranslatedShape_MustBeStatic_0 = d.qg)(a),
      ti = b._emscripten_bind_RotatedTranslatedShape_GetLocalBounds_0 = a => (ti = b._emscripten_bind_RotatedTranslatedShape_GetLocalBounds_0 = d.rg)(a),
      ui = b._emscripten_bind_RotatedTranslatedShape_GetWorldSpaceBounds_2 = (a, c, e) => (ui = b._emscripten_bind_RotatedTranslatedShape_GetWorldSpaceBounds_2 = d.sg)(a, c, e),
      vi = b._emscripten_bind_RotatedTranslatedShape_GetCenterOfMass_0 =
      a => (vi = b._emscripten_bind_RotatedTranslatedShape_GetCenterOfMass_0 = d.tg)(a),
      wi = b._emscripten_bind_RotatedTranslatedShape_GetUserData_0 = a => (wi = b._emscripten_bind_RotatedTranslatedShape_GetUserData_0 = d.ug)(a),
      xi = b._emscripten_bind_RotatedTranslatedShape_SetUserData_1 = (a, c, e) => (xi = b._emscripten_bind_RotatedTranslatedShape_SetUserData_1 = d.vg)(a, c, e),
      yi = b._emscripten_bind_RotatedTranslatedShape___destroy___0 = a => (yi = b._emscripten_bind_RotatedTranslatedShape___destroy___0 = d.wg)(a),
      zi = b._emscripten_bind_MeshShapeSettings_MeshShapeSettings_2 =
      (a, c) => (zi = b._emscripten_bind_MeshShapeSettings_MeshShapeSettings_2 = d.xg)(a, c),
      Ai = b._emscripten_bind_MeshShapeSettings_MeshShapeSettings_3 = (a, c, e) => (Ai = b._emscripten_bind_MeshShapeSettings_MeshShapeSettings_3 = d.yg)(a, c, e),
      Bi = b._emscripten_bind_MeshShapeSettings_Create_0 = a => (Bi = b._emscripten_bind_MeshShapeSettings_Create_0 = d.zg)(a),
      Ci = b._emscripten_bind_MeshShapeSettings_get_mUserData_0 = a => (Ci = b._emscripten_bind_MeshShapeSettings_get_mUserData_0 = d.Ag)(a),
      Di = b._emscripten_bind_MeshShapeSettings_set_mUserData_1 =
      (a, c, e) => (Di = b._emscripten_bind_MeshShapeSettings_set_mUserData_1 = d.Bg)(a, c, e),
      Ei = b._emscripten_bind_MeshShapeSettings___destroy___0 = a => (Ei = b._emscripten_bind_MeshShapeSettings___destroy___0 = d.Cg)(a),
      Fi = b._emscripten_bind_MeshShape_GetType_0 = a => (Fi = b._emscripten_bind_MeshShape_GetType_0 = d.Dg)(a),
      Gi = b._emscripten_bind_MeshShape_GetSubType_0 = a => (Gi = b._emscripten_bind_MeshShape_GetSubType_0 = d.Eg)(a),
      Hi = b._emscripten_bind_MeshShape_MustBeStatic_0 = a => (Hi = b._emscripten_bind_MeshShape_MustBeStatic_0 = d.Fg)(a),
      Ii = b._emscripten_bind_MeshShape_GetLocalBounds_0 = a => (Ii = b._emscripten_bind_MeshShape_GetLocalBounds_0 = d.Gg)(a),
      Ji = b._emscripten_bind_MeshShape_GetWorldSpaceBounds_2 = (a, c, e) => (Ji = b._emscripten_bind_MeshShape_GetWorldSpaceBounds_2 = d.Hg)(a, c, e),
      Ki = b._emscripten_bind_MeshShape_GetCenterOfMass_0 = a => (Ki = b._emscripten_bind_MeshShape_GetCenterOfMass_0 = d.Ig)(a),
      Li = b._emscripten_bind_MeshShape_GetUserData_0 = a => (Li = b._emscripten_bind_MeshShape_GetUserData_0 = d.Jg)(a),
      Mi = b._emscripten_bind_MeshShape_SetUserData_1 =
      (a, c, e) => (Mi = b._emscripten_bind_MeshShape_SetUserData_1 = d.Kg)(a, c, e),
      Ni = b._emscripten_bind_MeshShape___destroy___0 = a => (Ni = b._emscripten_bind_MeshShape___destroy___0 = d.Lg)(a),
      Oi = b._emscripten_bind_TwoBodyConstraint_GetBody1_0 = a => (Oi = b._emscripten_bind_TwoBodyConstraint_GetBody1_0 = d.Mg)(a),
      Pi = b._emscripten_bind_TwoBodyConstraint_GetBody2_0 = a => (Pi = b._emscripten_bind_TwoBodyConstraint_GetBody2_0 = d.Ng)(a),
      Qi = b._emscripten_bind_TwoBodyConstraint_SetEnabled_1 = (a, c) => (Qi = b._emscripten_bind_TwoBodyConstraint_SetEnabled_1 =
          d.Og)(a, c),
      Ri = b._emscripten_bind_TwoBodyConstraint_GetEnabled_0 = a => (Ri = b._emscripten_bind_TwoBodyConstraint_GetEnabled_0 = d.Pg)(a),
      Si = b._emscripten_bind_TwoBodyConstraint___destroy___0 = a => (Si = b._emscripten_bind_TwoBodyConstraint___destroy___0 = d.Qg)(a),
      Ti = b._emscripten_bind_FixedConstraintSettings_FixedConstraintSettings_0 = () => (Ti = b._emscripten_bind_FixedConstraintSettings_FixedConstraintSettings_0 = d.Rg)(),
      Ui = b._emscripten_bind_FixedConstraintSettings_Create_2 = (a, c, e) => (Ui = b._emscripten_bind_FixedConstraintSettings_Create_2 =
          d.Sg)(a, c, e),
      Vi = b._emscripten_bind_FixedConstraintSettings_get_mSpace_0 = a => (Vi = b._emscripten_bind_FixedConstraintSettings_get_mSpace_0 = d.Tg)(a),
      Wi = b._emscripten_bind_FixedConstraintSettings_set_mSpace_1 = (a, c) => (Wi = b._emscripten_bind_FixedConstraintSettings_set_mSpace_1 = d.Ug)(a, c),
      Xi = b._emscripten_bind_FixedConstraintSettings_get_mAutoDetectPoint_0 = a => (Xi = b._emscripten_bind_FixedConstraintSettings_get_mAutoDetectPoint_0 = d.Vg)(a),
      Yi = b._emscripten_bind_FixedConstraintSettings_set_mAutoDetectPoint_1 =
      (a, c) => (Yi = b._emscripten_bind_FixedConstraintSettings_set_mAutoDetectPoint_1 = d.Wg)(a, c),
      Zi = b._emscripten_bind_FixedConstraintSettings_get_mPoint1_0 = a => (Zi = b._emscripten_bind_FixedConstraintSettings_get_mPoint1_0 = d.Xg)(a),
      $i = b._emscripten_bind_FixedConstraintSettings_set_mPoint1_1 = (a, c) => ($i = b._emscripten_bind_FixedConstraintSettings_set_mPoint1_1 = d.Yg)(a, c),
      aj = b._emscripten_bind_FixedConstraintSettings_get_mAxisX1_0 = a => (aj = b._emscripten_bind_FixedConstraintSettings_get_mAxisX1_0 = d.Zg)(a),
      bj = b._emscripten_bind_FixedConstraintSettings_set_mAxisX1_1 =
      (a, c) => (bj = b._emscripten_bind_FixedConstraintSettings_set_mAxisX1_1 = d._g)(a, c),
      cj = b._emscripten_bind_FixedConstraintSettings_get_mAxisY1_0 = a => (cj = b._emscripten_bind_FixedConstraintSettings_get_mAxisY1_0 = d.$g)(a),
      dj = b._emscripten_bind_FixedConstraintSettings_set_mAxisY1_1 = (a, c) => (dj = b._emscripten_bind_FixedConstraintSettings_set_mAxisY1_1 = d.ah)(a, c),
      ej = b._emscripten_bind_FixedConstraintSettings_get_mPoint2_0 = a => (ej = b._emscripten_bind_FixedConstraintSettings_get_mPoint2_0 = d.bh)(a),
      fj = b._emscripten_bind_FixedConstraintSettings_set_mPoint2_1 =
      (a, c) => (fj = b._emscripten_bind_FixedConstraintSettings_set_mPoint2_1 = d.ch)(a, c),
      gj = b._emscripten_bind_FixedConstraintSettings_get_mAxisX2_0 = a => (gj = b._emscripten_bind_FixedConstraintSettings_get_mAxisX2_0 = d.dh)(a),
      hj = b._emscripten_bind_FixedConstraintSettings_set_mAxisX2_1 = (a, c) => (hj = b._emscripten_bind_FixedConstraintSettings_set_mAxisX2_1 = d.eh)(a, c),
      ij = b._emscripten_bind_FixedConstraintSettings_get_mAxisY2_0 = a => (ij = b._emscripten_bind_FixedConstraintSettings_get_mAxisY2_0 = d.fh)(a),
      jj = b._emscripten_bind_FixedConstraintSettings_set_mAxisY2_1 =
      (a, c) => (jj = b._emscripten_bind_FixedConstraintSettings_set_mAxisY2_1 = d.gh)(a, c),
      kj = b._emscripten_bind_FixedConstraintSettings_get_mEnabled_0 = a => (kj = b._emscripten_bind_FixedConstraintSettings_get_mEnabled_0 = d.hh)(a),
      lj = b._emscripten_bind_FixedConstraintSettings_set_mEnabled_1 = (a, c) => (lj = b._emscripten_bind_FixedConstraintSettings_set_mEnabled_1 = d.ih)(a, c),
      mj = b._emscripten_bind_FixedConstraintSettings_get_mNumVelocityStepsOverride_0 = a => (mj = b._emscripten_bind_FixedConstraintSettings_get_mNumVelocityStepsOverride_0 =
          d.jh)(a),
      nj = b._emscripten_bind_FixedConstraintSettings_set_mNumVelocityStepsOverride_1 = (a, c) => (nj = b._emscripten_bind_FixedConstraintSettings_set_mNumVelocityStepsOverride_1 = d.kh)(a, c),
      oj = b._emscripten_bind_FixedConstraintSettings_get_mNumPositionStepsOverride_0 = a => (oj = b._emscripten_bind_FixedConstraintSettings_get_mNumPositionStepsOverride_0 = d.lh)(a),
      pj = b._emscripten_bind_FixedConstraintSettings_set_mNumPositionStepsOverride_1 = (a, c) => (pj = b._emscripten_bind_FixedConstraintSettings_set_mNumPositionStepsOverride_1 =
          d.mh)(a, c),
      qj = b._emscripten_bind_FixedConstraintSettings___destroy___0 = a => (qj = b._emscripten_bind_FixedConstraintSettings___destroy___0 = d.nh)(a),
      rj = b._emscripten_bind_SpringSettings_SpringSettings_0 = () => (rj = b._emscripten_bind_SpringSettings_SpringSettings_0 = d.oh)(),
      sj = b._emscripten_bind_SpringSettings_get_mMode_0 = a => (sj = b._emscripten_bind_SpringSettings_get_mMode_0 = d.ph)(a),
      tj = b._emscripten_bind_SpringSettings_set_mMode_1 = (a, c) => (tj = b._emscripten_bind_SpringSettings_set_mMode_1 = d.qh)(a, c),
      uj = b._emscripten_bind_SpringSettings_get_mFrequency_0 =
      a => (uj = b._emscripten_bind_SpringSettings_get_mFrequency_0 = d.rh)(a),
      vj = b._emscripten_bind_SpringSettings_set_mFrequency_1 = (a, c) => (vj = b._emscripten_bind_SpringSettings_set_mFrequency_1 = d.sh)(a, c),
      wj = b._emscripten_bind_SpringSettings_get_mStiffness_0 = a => (wj = b._emscripten_bind_SpringSettings_get_mStiffness_0 = d.th)(a),
      xj = b._emscripten_bind_SpringSettings_set_mStiffness_1 = (a, c) => (xj = b._emscripten_bind_SpringSettings_set_mStiffness_1 = d.uh)(a, c),
      yj = b._emscripten_bind_SpringSettings_get_mDamping_0 = a => (yj =
          b._emscripten_bind_SpringSettings_get_mDamping_0 = d.vh)(a),
      zj = b._emscripten_bind_SpringSettings_set_mDamping_1 = (a, c) => (zj = b._emscripten_bind_SpringSettings_set_mDamping_1 = d.wh)(a, c),
      Aj = b._emscripten_bind_SpringSettings___destroy___0 = a => (Aj = b._emscripten_bind_SpringSettings___destroy___0 = d.xh)(a),
      Bj = b._emscripten_bind_DistanceConstraintSettings_DistanceConstraintSettings_0 = () => (Bj = b._emscripten_bind_DistanceConstraintSettings_DistanceConstraintSettings_0 = d.yh)(),
      Cj = b._emscripten_bind_DistanceConstraintSettings_Create_2 =
      (a, c, e) => (Cj = b._emscripten_bind_DistanceConstraintSettings_Create_2 = d.zh)(a, c, e),
      Dj = b._emscripten_bind_DistanceConstraintSettings_get_mSpace_0 = a => (Dj = b._emscripten_bind_DistanceConstraintSettings_get_mSpace_0 = d.Ah)(a),
      Ej = b._emscripten_bind_DistanceConstraintSettings_set_mSpace_1 = (a, c) => (Ej = b._emscripten_bind_DistanceConstraintSettings_set_mSpace_1 = d.Bh)(a, c),
      Fj = b._emscripten_bind_DistanceConstraintSettings_get_mPoint1_0 = a => (Fj = b._emscripten_bind_DistanceConstraintSettings_get_mPoint1_0 = d.Ch)(a),
      Gj =
      b._emscripten_bind_DistanceConstraintSettings_set_mPoint1_1 = (a, c) => (Gj = b._emscripten_bind_DistanceConstraintSettings_set_mPoint1_1 = d.Dh)(a, c),
      Hj = b._emscripten_bind_DistanceConstraintSettings_get_mPoint2_0 = a => (Hj = b._emscripten_bind_DistanceConstraintSettings_get_mPoint2_0 = d.Eh)(a),
      Ij = b._emscripten_bind_DistanceConstraintSettings_set_mPoint2_1 = (a, c) => (Ij = b._emscripten_bind_DistanceConstraintSettings_set_mPoint2_1 = d.Fh)(a, c),
      Jj = b._emscripten_bind_DistanceConstraintSettings_get_mMinDistance_0 = a => (Jj =
          b._emscripten_bind_DistanceConstraintSettings_get_mMinDistance_0 = d.Gh)(a),
      Kj = b._emscripten_bind_DistanceConstraintSettings_set_mMinDistance_1 = (a, c) => (Kj = b._emscripten_bind_DistanceConstraintSettings_set_mMinDistance_1 = d.Hh)(a, c),
      Lj = b._emscripten_bind_DistanceConstraintSettings_get_mMaxDistance_0 = a => (Lj = b._emscripten_bind_DistanceConstraintSettings_get_mMaxDistance_0 = d.Ih)(a),
      Mj = b._emscripten_bind_DistanceConstraintSettings_set_mMaxDistance_1 = (a, c) => (Mj = b._emscripten_bind_DistanceConstraintSettings_set_mMaxDistance_1 =
          d.Jh)(a, c),
      Nj = b._emscripten_bind_DistanceConstraintSettings_get_mLimitsSpringSettings_0 = a => (Nj = b._emscripten_bind_DistanceConstraintSettings_get_mLimitsSpringSettings_0 = d.Kh)(a),
      Oj = b._emscripten_bind_DistanceConstraintSettings_set_mLimitsSpringSettings_1 = (a, c) => (Oj = b._emscripten_bind_DistanceConstraintSettings_set_mLimitsSpringSettings_1 = d.Lh)(a, c),
      Pj = b._emscripten_bind_DistanceConstraintSettings_get_mEnabled_0 = a => (Pj = b._emscripten_bind_DistanceConstraintSettings_get_mEnabled_0 = d.Mh)(a),
      Qj = b._emscripten_bind_DistanceConstraintSettings_set_mEnabled_1 =
      (a, c) => (Qj = b._emscripten_bind_DistanceConstraintSettings_set_mEnabled_1 = d.Nh)(a, c),
      Rj = b._emscripten_bind_DistanceConstraintSettings_get_mNumVelocityStepsOverride_0 = a => (Rj = b._emscripten_bind_DistanceConstraintSettings_get_mNumVelocityStepsOverride_0 = d.Oh)(a),
      Sj = b._emscripten_bind_DistanceConstraintSettings_set_mNumVelocityStepsOverride_1 = (a, c) => (Sj = b._emscripten_bind_DistanceConstraintSettings_set_mNumVelocityStepsOverride_1 = d.Ph)(a, c),
      Tj = b._emscripten_bind_DistanceConstraintSettings_get_mNumPositionStepsOverride_0 =
      a => (Tj = b._emscripten_bind_DistanceConstraintSettings_get_mNumPositionStepsOverride_0 = d.Qh)(a),
      Uj = b._emscripten_bind_DistanceConstraintSettings_set_mNumPositionStepsOverride_1 = (a, c) => (Uj = b._emscripten_bind_DistanceConstraintSettings_set_mNumPositionStepsOverride_1 = d.Rh)(a, c),
      Vj = b._emscripten_bind_DistanceConstraintSettings___destroy___0 = a => (Vj = b._emscripten_bind_DistanceConstraintSettings___destroy___0 = d.Sh)(a),
      Wj = b._emscripten_bind_PointConstraintSettings_PointConstraintSettings_0 = () => (Wj = b._emscripten_bind_PointConstraintSettings_PointConstraintSettings_0 =
          d.Th)(),
      Xj = b._emscripten_bind_PointConstraintSettings_Create_2 = (a, c, e) => (Xj = b._emscripten_bind_PointConstraintSettings_Create_2 = d.Uh)(a, c, e),
      Yj = b._emscripten_bind_PointConstraintSettings_get_mSpace_0 = a => (Yj = b._emscripten_bind_PointConstraintSettings_get_mSpace_0 = d.Vh)(a),
      Zj = b._emscripten_bind_PointConstraintSettings_set_mSpace_1 = (a, c) => (Zj = b._emscripten_bind_PointConstraintSettings_set_mSpace_1 = d.Wh)(a, c),
      ak = b._emscripten_bind_PointConstraintSettings_get_mPoint1_0 = a => (ak = b._emscripten_bind_PointConstraintSettings_get_mPoint1_0 =
          d.Xh)(a),
      bk = b._emscripten_bind_PointConstraintSettings_set_mPoint1_1 = (a, c) => (bk = b._emscripten_bind_PointConstraintSettings_set_mPoint1_1 = d.Yh)(a, c),
      ck = b._emscripten_bind_PointConstraintSettings_get_mPoint2_0 = a => (ck = b._emscripten_bind_PointConstraintSettings_get_mPoint2_0 = d.Zh)(a),
      dk = b._emscripten_bind_PointConstraintSettings_set_mPoint2_1 = (a, c) => (dk = b._emscripten_bind_PointConstraintSettings_set_mPoint2_1 = d._h)(a, c),
      ek = b._emscripten_bind_PointConstraintSettings_get_mEnabled_0 = a => (ek = b._emscripten_bind_PointConstraintSettings_get_mEnabled_0 =
          d.$h)(a),
      fk = b._emscripten_bind_PointConstraintSettings_set_mEnabled_1 = (a, c) => (fk = b._emscripten_bind_PointConstraintSettings_set_mEnabled_1 = d.ai)(a, c),
      gk = b._emscripten_bind_PointConstraintSettings_get_mNumVelocityStepsOverride_0 = a => (gk = b._emscripten_bind_PointConstraintSettings_get_mNumVelocityStepsOverride_0 = d.bi)(a),
      hk = b._emscripten_bind_PointConstraintSettings_set_mNumVelocityStepsOverride_1 = (a, c) => (hk = b._emscripten_bind_PointConstraintSettings_set_mNumVelocityStepsOverride_1 = d.ci)(a, c),
      ik = b._emscripten_bind_PointConstraintSettings_get_mNumPositionStepsOverride_0 =
      a => (ik = b._emscripten_bind_PointConstraintSettings_get_mNumPositionStepsOverride_0 = d.di)(a),
      jk = b._emscripten_bind_PointConstraintSettings_set_mNumPositionStepsOverride_1 = (a, c) => (jk = b._emscripten_bind_PointConstraintSettings_set_mNumPositionStepsOverride_1 = d.ei)(a, c),
      kk = b._emscripten_bind_PointConstraintSettings___destroy___0 = a => (kk = b._emscripten_bind_PointConstraintSettings___destroy___0 = d.fi)(a),
      lk = b._emscripten_bind_HingeConstraintSettings_HingeConstraintSettings_0 = () => (lk = b._emscripten_bind_HingeConstraintSettings_HingeConstraintSettings_0 =
          d.gi)(),
      mk = b._emscripten_bind_HingeConstraintSettings_Create_2 = (a, c, e) => (mk = b._emscripten_bind_HingeConstraintSettings_Create_2 = d.hi)(a, c, e),
      nk = b._emscripten_bind_HingeConstraintSettings_get_mSpace_0 = a => (nk = b._emscripten_bind_HingeConstraintSettings_get_mSpace_0 = d.ii)(a),
      ok = b._emscripten_bind_HingeConstraintSettings_set_mSpace_1 = (a, c) => (ok = b._emscripten_bind_HingeConstraintSettings_set_mSpace_1 = d.ji)(a, c),
      pk = b._emscripten_bind_HingeConstraintSettings_get_mPoint1_0 = a => (pk = b._emscripten_bind_HingeConstraintSettings_get_mPoint1_0 =
          d.ki)(a),
      qk = b._emscripten_bind_HingeConstraintSettings_set_mPoint1_1 = (a, c) => (qk = b._emscripten_bind_HingeConstraintSettings_set_mPoint1_1 = d.li)(a, c),
      rk = b._emscripten_bind_HingeConstraintSettings_get_mHingeAxis1_0 = a => (rk = b._emscripten_bind_HingeConstraintSettings_get_mHingeAxis1_0 = d.mi)(a),
      sk = b._emscripten_bind_HingeConstraintSettings_set_mHingeAxis1_1 = (a, c) => (sk = b._emscripten_bind_HingeConstraintSettings_set_mHingeAxis1_1 = d.ni)(a, c),
      tk = b._emscripten_bind_HingeConstraintSettings_get_mNormalAxis1_0 =
      a => (tk = b._emscripten_bind_HingeConstraintSettings_get_mNormalAxis1_0 = d.oi)(a),
      uk = b._emscripten_bind_HingeConstraintSettings_set_mNormalAxis1_1 = (a, c) => (uk = b._emscripten_bind_HingeConstraintSettings_set_mNormalAxis1_1 = d.pi)(a, c),
      vk = b._emscripten_bind_HingeConstraintSettings_get_mPoint2_0 = a => (vk = b._emscripten_bind_HingeConstraintSettings_get_mPoint2_0 = d.qi)(a),
      wk = b._emscripten_bind_HingeConstraintSettings_set_mPoint2_1 = (a, c) => (wk = b._emscripten_bind_HingeConstraintSettings_set_mPoint2_1 = d.ri)(a, c),
      xk =
      b._emscripten_bind_HingeConstraintSettings_get_mHingeAxis2_0 = a => (xk = b._emscripten_bind_HingeConstraintSettings_get_mHingeAxis2_0 = d.si)(a),
      yk = b._emscripten_bind_HingeConstraintSettings_set_mHingeAxis2_1 = (a, c) => (yk = b._emscripten_bind_HingeConstraintSettings_set_mHingeAxis2_1 = d.ti)(a, c),
      zk = b._emscripten_bind_HingeConstraintSettings_get_mNormalAxis2_0 = a => (zk = b._emscripten_bind_HingeConstraintSettings_get_mNormalAxis2_0 = d.ui)(a),
      Ak = b._emscripten_bind_HingeConstraintSettings_set_mNormalAxis2_1 = (a, c) => (Ak =
          b._emscripten_bind_HingeConstraintSettings_set_mNormalAxis2_1 = d.vi)(a, c),
      Bk = b._emscripten_bind_HingeConstraintSettings_get_mLimitsMin_0 = a => (Bk = b._emscripten_bind_HingeConstraintSettings_get_mLimitsMin_0 = d.wi)(a),
      Ck = b._emscripten_bind_HingeConstraintSettings_set_mLimitsMin_1 = (a, c) => (Ck = b._emscripten_bind_HingeConstraintSettings_set_mLimitsMin_1 = d.xi)(a, c),
      Dk = b._emscripten_bind_HingeConstraintSettings_get_mLimitsMax_0 = a => (Dk = b._emscripten_bind_HingeConstraintSettings_get_mLimitsMax_0 = d.yi)(a),
      Ek = b._emscripten_bind_HingeConstraintSettings_set_mLimitsMax_1 =
      (a, c) => (Ek = b._emscripten_bind_HingeConstraintSettings_set_mLimitsMax_1 = d.zi)(a, c),
      Fk = b._emscripten_bind_HingeConstraintSettings_get_mMaxFrictionTorque_0 = a => (Fk = b._emscripten_bind_HingeConstraintSettings_get_mMaxFrictionTorque_0 = d.Ai)(a),
      Gk = b._emscripten_bind_HingeConstraintSettings_set_mMaxFrictionTorque_1 = (a, c) => (Gk = b._emscripten_bind_HingeConstraintSettings_set_mMaxFrictionTorque_1 = d.Bi)(a, c),
      Hk = b._emscripten_bind_HingeConstraintSettings_get_mEnabled_0 = a => (Hk = b._emscripten_bind_HingeConstraintSettings_get_mEnabled_0 =
          d.Ci)(a),
      Ik = b._emscripten_bind_HingeConstraintSettings_set_mEnabled_1 = (a, c) => (Ik = b._emscripten_bind_HingeConstraintSettings_set_mEnabled_1 = d.Di)(a, c),
      Jk = b._emscripten_bind_HingeConstraintSettings_get_mNumVelocityStepsOverride_0 = a => (Jk = b._emscripten_bind_HingeConstraintSettings_get_mNumVelocityStepsOverride_0 = d.Ei)(a),
      Kk = b._emscripten_bind_HingeConstraintSettings_set_mNumVelocityStepsOverride_1 = (a, c) => (Kk = b._emscripten_bind_HingeConstraintSettings_set_mNumVelocityStepsOverride_1 = d.Fi)(a, c),
      Lk = b._emscripten_bind_HingeConstraintSettings_get_mNumPositionStepsOverride_0 =
      a => (Lk = b._emscripten_bind_HingeConstraintSettings_get_mNumPositionStepsOverride_0 = d.Gi)(a),
      Mk = b._emscripten_bind_HingeConstraintSettings_set_mNumPositionStepsOverride_1 = (a, c) => (Mk = b._emscripten_bind_HingeConstraintSettings_set_mNumPositionStepsOverride_1 = d.Hi)(a, c),
      Nk = b._emscripten_bind_HingeConstraintSettings___destroy___0 = a => (Nk = b._emscripten_bind_HingeConstraintSettings___destroy___0 = d.Ii)(a),
      Ok = b._emscripten_bind_ConeConstraintSettings_ConeConstraintSettings_0 = () => (Ok = b._emscripten_bind_ConeConstraintSettings_ConeConstraintSettings_0 =
          d.Ji)(),
      Pk = b._emscripten_bind_ConeConstraintSettings_Create_2 = (a, c, e) => (Pk = b._emscripten_bind_ConeConstraintSettings_Create_2 = d.Ki)(a, c, e),
      Qk = b._emscripten_bind_ConeConstraintSettings_get_mSpace_0 = a => (Qk = b._emscripten_bind_ConeConstraintSettings_get_mSpace_0 = d.Li)(a),
      Rk = b._emscripten_bind_ConeConstraintSettings_set_mSpace_1 = (a, c) => (Rk = b._emscripten_bind_ConeConstraintSettings_set_mSpace_1 = d.Mi)(a, c),
      Sk = b._emscripten_bind_ConeConstraintSettings_get_mPoint1_0 = a => (Sk = b._emscripten_bind_ConeConstraintSettings_get_mPoint1_0 =
          d.Ni)(a),
      Tk = b._emscripten_bind_ConeConstraintSettings_set_mPoint1_1 = (a, c) => (Tk = b._emscripten_bind_ConeConstraintSettings_set_mPoint1_1 = d.Oi)(a, c),
      Uk = b._emscripten_bind_ConeConstraintSettings_get_mTwistAxis1_0 = a => (Uk = b._emscripten_bind_ConeConstraintSettings_get_mTwistAxis1_0 = d.Pi)(a),
      Vk = b._emscripten_bind_ConeConstraintSettings_set_mTwistAxis1_1 = (a, c) => (Vk = b._emscripten_bind_ConeConstraintSettings_set_mTwistAxis1_1 = d.Qi)(a, c),
      Wk = b._emscripten_bind_ConeConstraintSettings_get_mPoint2_0 = a => (Wk = b._emscripten_bind_ConeConstraintSettings_get_mPoint2_0 =
          d.Ri)(a),
      Xk = b._emscripten_bind_ConeConstraintSettings_set_mPoint2_1 = (a, c) => (Xk = b._emscripten_bind_ConeConstraintSettings_set_mPoint2_1 = d.Si)(a, c),
      Yk = b._emscripten_bind_ConeConstraintSettings_get_mTwistAxis2_0 = a => (Yk = b._emscripten_bind_ConeConstraintSettings_get_mTwistAxis2_0 = d.Ti)(a),
      Zk = b._emscripten_bind_ConeConstraintSettings_set_mTwistAxis2_1 = (a, c) => (Zk = b._emscripten_bind_ConeConstraintSettings_set_mTwistAxis2_1 = d.Ui)(a, c),
      $k = b._emscripten_bind_ConeConstraintSettings_get_mHalfConeAngle_0 = a => ($k =
          b._emscripten_bind_ConeConstraintSettings_get_mHalfConeAngle_0 = d.Vi)(a),
      al = b._emscripten_bind_ConeConstraintSettings_set_mHalfConeAngle_1 = (a, c) => (al = b._emscripten_bind_ConeConstraintSettings_set_mHalfConeAngle_1 = d.Wi)(a, c),
      bl = b._emscripten_bind_ConeConstraintSettings_get_mEnabled_0 = a => (bl = b._emscripten_bind_ConeConstraintSettings_get_mEnabled_0 = d.Xi)(a),
      cl = b._emscripten_bind_ConeConstraintSettings_set_mEnabled_1 = (a, c) => (cl = b._emscripten_bind_ConeConstraintSettings_set_mEnabled_1 = d.Yi)(a, c),
      dl = b._emscripten_bind_ConeConstraintSettings_get_mNumVelocityStepsOverride_0 =
      a => (dl = b._emscripten_bind_ConeConstraintSettings_get_mNumVelocityStepsOverride_0 = d.Zi)(a),
      el = b._emscripten_bind_ConeConstraintSettings_set_mNumVelocityStepsOverride_1 = (a, c) => (el = b._emscripten_bind_ConeConstraintSettings_set_mNumVelocityStepsOverride_1 = d._i)(a, c),
      fl = b._emscripten_bind_ConeConstraintSettings_get_mNumPositionStepsOverride_0 = a => (fl = b._emscripten_bind_ConeConstraintSettings_get_mNumPositionStepsOverride_0 = d.$i)(a),
      gl = b._emscripten_bind_ConeConstraintSettings_set_mNumPositionStepsOverride_1 =
      (a, c) => (gl = b._emscripten_bind_ConeConstraintSettings_set_mNumPositionStepsOverride_1 = d.aj)(a, c),
      hl = b._emscripten_bind_ConeConstraintSettings___destroy___0 = a => (hl = b._emscripten_bind_ConeConstraintSettings___destroy___0 = d.bj)(a),
      il = b._emscripten_bind_SliderConstraintSettings_SliderConstraintSettings_0 = () => (il = b._emscripten_bind_SliderConstraintSettings_SliderConstraintSettings_0 = d.cj)(),
      jl = b._emscripten_bind_SliderConstraintSettings_Create_2 = (a, c, e) => (jl = b._emscripten_bind_SliderConstraintSettings_Create_2 =
          d.dj)(a, c, e),
      kl = b._emscripten_bind_SliderConstraintSettings_get_mSpace_0 = a => (kl = b._emscripten_bind_SliderConstraintSettings_get_mSpace_0 = d.ej)(a),
      ll = b._emscripten_bind_SliderConstraintSettings_set_mSpace_1 = (a, c) => (ll = b._emscripten_bind_SliderConstraintSettings_set_mSpace_1 = d.fj)(a, c),
      ml = b._emscripten_bind_SliderConstraintSettings_get_mAutoDetectPoint_0 = a => (ml = b._emscripten_bind_SliderConstraintSettings_get_mAutoDetectPoint_0 = d.gj)(a),
      nl = b._emscripten_bind_SliderConstraintSettings_set_mAutoDetectPoint_1 =
      (a, c) => (nl = b._emscripten_bind_SliderConstraintSettings_set_mAutoDetectPoint_1 = d.hj)(a, c),
      ol = b._emscripten_bind_SliderConstraintSettings_get_mPoint1_0 = a => (ol = b._emscripten_bind_SliderConstraintSettings_get_mPoint1_0 = d.ij)(a),
      pl = b._emscripten_bind_SliderConstraintSettings_set_mPoint1_1 = (a, c) => (pl = b._emscripten_bind_SliderConstraintSettings_set_mPoint1_1 = d.jj)(a, c),
      ql = b._emscripten_bind_SliderConstraintSettings_get_mSliderAxis1_0 = a => (ql = b._emscripten_bind_SliderConstraintSettings_get_mSliderAxis1_0 =
          d.kj)(a),
      rl = b._emscripten_bind_SliderConstraintSettings_set_mSliderAxis1_1 = (a, c) => (rl = b._emscripten_bind_SliderConstraintSettings_set_mSliderAxis1_1 = d.lj)(a, c),
      sl = b._emscripten_bind_SliderConstraintSettings_get_mNormalAxis1_0 = a => (sl = b._emscripten_bind_SliderConstraintSettings_get_mNormalAxis1_0 = d.mj)(a),
      tl = b._emscripten_bind_SliderConstraintSettings_set_mNormalAxis1_1 = (a, c) => (tl = b._emscripten_bind_SliderConstraintSettings_set_mNormalAxis1_1 = d.nj)(a, c),
      ul = b._emscripten_bind_SliderConstraintSettings_get_mPoint2_0 =
      a => (ul = b._emscripten_bind_SliderConstraintSettings_get_mPoint2_0 = d.oj)(a),
      vl = b._emscripten_bind_SliderConstraintSettings_set_mPoint2_1 = (a, c) => (vl = b._emscripten_bind_SliderConstraintSettings_set_mPoint2_1 = d.pj)(a, c),
      wl = b._emscripten_bind_SliderConstraintSettings_get_mSliderAxis2_0 = a => (wl = b._emscripten_bind_SliderConstraintSettings_get_mSliderAxis2_0 = d.qj)(a),
      xl = b._emscripten_bind_SliderConstraintSettings_set_mSliderAxis2_1 = (a, c) => (xl = b._emscripten_bind_SliderConstraintSettings_set_mSliderAxis2_1 = d.rj)(a,
          c),
      yl = b._emscripten_bind_SliderConstraintSettings_get_mNormalAxis2_0 = a => (yl = b._emscripten_bind_SliderConstraintSettings_get_mNormalAxis2_0 = d.sj)(a),
      zl = b._emscripten_bind_SliderConstraintSettings_set_mNormalAxis2_1 = (a, c) => (zl = b._emscripten_bind_SliderConstraintSettings_set_mNormalAxis2_1 = d.tj)(a, c),
      Al = b._emscripten_bind_SliderConstraintSettings_get_mLimitsMin_0 = a => (Al = b._emscripten_bind_SliderConstraintSettings_get_mLimitsMin_0 = d.uj)(a),
      Bl = b._emscripten_bind_SliderConstraintSettings_set_mLimitsMin_1 =
      (a, c) => (Bl = b._emscripten_bind_SliderConstraintSettings_set_mLimitsMin_1 = d.vj)(a, c),
      Cl = b._emscripten_bind_SliderConstraintSettings_get_mLimitsMax_0 = a => (Cl = b._emscripten_bind_SliderConstraintSettings_get_mLimitsMax_0 = d.wj)(a),
      Dl = b._emscripten_bind_SliderConstraintSettings_set_mLimitsMax_1 = (a, c) => (Dl = b._emscripten_bind_SliderConstraintSettings_set_mLimitsMax_1 = d.xj)(a, c),
      El = b._emscripten_bind_SliderConstraintSettings_get_mMaxFrictionForce_0 = a => (El = b._emscripten_bind_SliderConstraintSettings_get_mMaxFrictionForce_0 =
          d.yj)(a),
      Fl = b._emscripten_bind_SliderConstraintSettings_set_mMaxFrictionForce_1 = (a, c) => (Fl = b._emscripten_bind_SliderConstraintSettings_set_mMaxFrictionForce_1 = d.zj)(a, c),
      Gl = b._emscripten_bind_SliderConstraintSettings_get_mEnabled_0 = a => (Gl = b._emscripten_bind_SliderConstraintSettings_get_mEnabled_0 = d.Aj)(a),
      Hl = b._emscripten_bind_SliderConstraintSettings_set_mEnabled_1 = (a, c) => (Hl = b._emscripten_bind_SliderConstraintSettings_set_mEnabled_1 = d.Bj)(a, c),
      Il = b._emscripten_bind_SliderConstraintSettings_get_mNumVelocityStepsOverride_0 =
      a => (Il = b._emscripten_bind_SliderConstraintSettings_get_mNumVelocityStepsOverride_0 = d.Cj)(a),
      Jl = b._emscripten_bind_SliderConstraintSettings_set_mNumVelocityStepsOverride_1 = (a, c) => (Jl = b._emscripten_bind_SliderConstraintSettings_set_mNumVelocityStepsOverride_1 = d.Dj)(a, c),
      Kl = b._emscripten_bind_SliderConstraintSettings_get_mNumPositionStepsOverride_0 = a => (Kl = b._emscripten_bind_SliderConstraintSettings_get_mNumPositionStepsOverride_0 = d.Ej)(a),
      Ll = b._emscripten_bind_SliderConstraintSettings_set_mNumPositionStepsOverride_1 =
      (a, c) => (Ll = b._emscripten_bind_SliderConstraintSettings_set_mNumPositionStepsOverride_1 = d.Fj)(a, c),
      Ml = b._emscripten_bind_SliderConstraintSettings___destroy___0 = a => (Ml = b._emscripten_bind_SliderConstraintSettings___destroy___0 = d.Gj)(a),
      Nl = b._emscripten_bind_SwingTwistConstraintSettings_SwingTwistConstraintSettings_0 = () => (Nl = b._emscripten_bind_SwingTwistConstraintSettings_SwingTwistConstraintSettings_0 = d.Hj)(),
      Ol = b._emscripten_bind_SwingTwistConstraintSettings_Create_2 = (a, c, e) => (Ol = b._emscripten_bind_SwingTwistConstraintSettings_Create_2 =
          d.Ij)(a, c, e),
      Pl = b._emscripten_bind_SwingTwistConstraintSettings_get_mSpace_0 = a => (Pl = b._emscripten_bind_SwingTwistConstraintSettings_get_mSpace_0 = d.Jj)(a),
      Ql = b._emscripten_bind_SwingTwistConstraintSettings_set_mSpace_1 = (a, c) => (Ql = b._emscripten_bind_SwingTwistConstraintSettings_set_mSpace_1 = d.Kj)(a, c),
      Rl = b._emscripten_bind_SwingTwistConstraintSettings_get_mPosition1_0 = a => (Rl = b._emscripten_bind_SwingTwistConstraintSettings_get_mPosition1_0 = d.Lj)(a),
      Sl = b._emscripten_bind_SwingTwistConstraintSettings_set_mPosition1_1 =
      (a, c) => (Sl = b._emscripten_bind_SwingTwistConstraintSettings_set_mPosition1_1 = d.Mj)(a, c),
      Tl = b._emscripten_bind_SwingTwistConstraintSettings_get_mTwistAxis1_0 = a => (Tl = b._emscripten_bind_SwingTwistConstraintSettings_get_mTwistAxis1_0 = d.Nj)(a),
      Ul = b._emscripten_bind_SwingTwistConstraintSettings_set_mTwistAxis1_1 = (a, c) => (Ul = b._emscripten_bind_SwingTwistConstraintSettings_set_mTwistAxis1_1 = d.Oj)(a, c),
      Vl = b._emscripten_bind_SwingTwistConstraintSettings_get_mPlaneAxis1_0 = a => (Vl = b._emscripten_bind_SwingTwistConstraintSettings_get_mPlaneAxis1_0 =
          d.Pj)(a),
      Wl = b._emscripten_bind_SwingTwistConstraintSettings_set_mPlaneAxis1_1 = (a, c) => (Wl = b._emscripten_bind_SwingTwistConstraintSettings_set_mPlaneAxis1_1 = d.Qj)(a, c),
      Xl = b._emscripten_bind_SwingTwistConstraintSettings_get_mPosition2_0 = a => (Xl = b._emscripten_bind_SwingTwistConstraintSettings_get_mPosition2_0 = d.Rj)(a),
      Yl = b._emscripten_bind_SwingTwistConstraintSettings_set_mPosition2_1 = (a, c) => (Yl = b._emscripten_bind_SwingTwistConstraintSettings_set_mPosition2_1 = d.Sj)(a, c),
      Zl = b._emscripten_bind_SwingTwistConstraintSettings_get_mTwistAxis2_0 =
      a => (Zl = b._emscripten_bind_SwingTwistConstraintSettings_get_mTwistAxis2_0 = d.Tj)(a),
      $l = b._emscripten_bind_SwingTwistConstraintSettings_set_mTwistAxis2_1 = (a, c) => ($l = b._emscripten_bind_SwingTwistConstraintSettings_set_mTwistAxis2_1 = d.Uj)(a, c),
      am = b._emscripten_bind_SwingTwistConstraintSettings_get_mPlaneAxis2_0 = a => (am = b._emscripten_bind_SwingTwistConstraintSettings_get_mPlaneAxis2_0 = d.Vj)(a),
      bm = b._emscripten_bind_SwingTwistConstraintSettings_set_mPlaneAxis2_1 = (a, c) => (bm = b._emscripten_bind_SwingTwistConstraintSettings_set_mPlaneAxis2_1 =
          d.Wj)(a, c),
      cm = b._emscripten_bind_SwingTwistConstraintSettings_get_mNormalHalfConeAngle_0 = a => (cm = b._emscripten_bind_SwingTwistConstraintSettings_get_mNormalHalfConeAngle_0 = d.Xj)(a),
      dm = b._emscripten_bind_SwingTwistConstraintSettings_set_mNormalHalfConeAngle_1 = (a, c) => (dm = b._emscripten_bind_SwingTwistConstraintSettings_set_mNormalHalfConeAngle_1 = d.Yj)(a, c),
      em = b._emscripten_bind_SwingTwistConstraintSettings_get_mPlaneHalfConeAngle_0 = a => (em = b._emscripten_bind_SwingTwistConstraintSettings_get_mPlaneHalfConeAngle_0 =
          d.Zj)(a),
      fm = b._emscripten_bind_SwingTwistConstraintSettings_set_mPlaneHalfConeAngle_1 = (a, c) => (fm = b._emscripten_bind_SwingTwistConstraintSettings_set_mPlaneHalfConeAngle_1 = d._j)(a, c),
      gm = b._emscripten_bind_SwingTwistConstraintSettings_get_mTwistMinAngle_0 = a => (gm = b._emscripten_bind_SwingTwistConstraintSettings_get_mTwistMinAngle_0 = d.$j)(a),
      hm = b._emscripten_bind_SwingTwistConstraintSettings_set_mTwistMinAngle_1 = (a, c) => (hm = b._emscripten_bind_SwingTwistConstraintSettings_set_mTwistMinAngle_1 = d.ak)(a, c),
      im = b._emscripten_bind_SwingTwistConstraintSettings_get_mTwistMaxAngle_0 = a => (im = b._emscripten_bind_SwingTwistConstraintSettings_get_mTwistMaxAngle_0 = d.bk)(a),
      jm = b._emscripten_bind_SwingTwistConstraintSettings_set_mTwistMaxAngle_1 = (a, c) => (jm = b._emscripten_bind_SwingTwistConstraintSettings_set_mTwistMaxAngle_1 = d.ck)(a, c),
      km = b._emscripten_bind_SwingTwistConstraintSettings_get_mMaxFrictionTorque_0 = a => (km = b._emscripten_bind_SwingTwistConstraintSettings_get_mMaxFrictionTorque_0 = d.dk)(a),
      lm = b._emscripten_bind_SwingTwistConstraintSettings_set_mMaxFrictionTorque_1 =
      (a, c) => (lm = b._emscripten_bind_SwingTwistConstraintSettings_set_mMaxFrictionTorque_1 = d.ek)(a, c),
      mm = b._emscripten_bind_SwingTwistConstraintSettings_get_mEnabled_0 = a => (mm = b._emscripten_bind_SwingTwistConstraintSettings_get_mEnabled_0 = d.fk)(a),
      nm = b._emscripten_bind_SwingTwistConstraintSettings_set_mEnabled_1 = (a, c) => (nm = b._emscripten_bind_SwingTwistConstraintSettings_set_mEnabled_1 = d.gk)(a, c),
      om = b._emscripten_bind_SwingTwistConstraintSettings_get_mNumVelocityStepsOverride_0 = a => (om = b._emscripten_bind_SwingTwistConstraintSettings_get_mNumVelocityStepsOverride_0 =
          d.hk)(a),
      pm = b._emscripten_bind_SwingTwistConstraintSettings_set_mNumVelocityStepsOverride_1 = (a, c) => (pm = b._emscripten_bind_SwingTwistConstraintSettings_set_mNumVelocityStepsOverride_1 = d.ik)(a, c),
      qm = b._emscripten_bind_SwingTwistConstraintSettings_get_mNumPositionStepsOverride_0 = a => (qm = b._emscripten_bind_SwingTwistConstraintSettings_get_mNumPositionStepsOverride_0 = d.jk)(a),
      rm = b._emscripten_bind_SwingTwistConstraintSettings_set_mNumPositionStepsOverride_1 = (a, c) => (rm = b._emscripten_bind_SwingTwistConstraintSettings_set_mNumPositionStepsOverride_1 =
          d.kk)(a, c),
      sm = b._emscripten_bind_SwingTwistConstraintSettings___destroy___0 = a => (sm = b._emscripten_bind_SwingTwistConstraintSettings___destroy___0 = d.lk)(a),
      tm = b._emscripten_bind_BodyID_BodyID_0 = () => (tm = b._emscripten_bind_BodyID_BodyID_0 = d.mk)(),
      um = b._emscripten_bind_BodyID_BodyID_1 = a => (um = b._emscripten_bind_BodyID_BodyID_1 = d.nk)(a),
      wm = b._emscripten_bind_BodyID_GetIndex_0 = a => (wm = b._emscripten_bind_BodyID_GetIndex_0 = d.ok)(a),
      xm = b._emscripten_bind_BodyID_GetIndexAndSequenceNumber_0 = a => (xm = b._emscripten_bind_BodyID_GetIndexAndSequenceNumber_0 =
          d.pk)(a),
      ym = b._emscripten_bind_BodyID___destroy___0 = a => (ym = b._emscripten_bind_BodyID___destroy___0 = d.qk)(a),
      zm = b._emscripten_bind_MotionProperties_GetMotionQuality_0 = a => (zm = b._emscripten_bind_MotionProperties_GetMotionQuality_0 = d.rk)(a),
      Am = b._emscripten_bind_MotionProperties_GetLinearVelocity_0 = a => (Am = b._emscripten_bind_MotionProperties_GetLinearVelocity_0 = d.sk)(a),
      Bm = b._emscripten_bind_MotionProperties_SetLinearVelocity_1 = (a, c) => (Bm = b._emscripten_bind_MotionProperties_SetLinearVelocity_1 = d.tk)(a,
          c),
      Cm = b._emscripten_bind_MotionProperties_SetLinearVelocityClamped_1 = (a, c) => (Cm = b._emscripten_bind_MotionProperties_SetLinearVelocityClamped_1 = d.uk)(a, c),
      Dm = b._emscripten_bind_MotionProperties_GetAngularVelocity_0 = a => (Dm = b._emscripten_bind_MotionProperties_GetAngularVelocity_0 = d.vk)(a),
      Em = b._emscripten_bind_MotionProperties_SetAngularVelocity_1 = (a, c) => (Em = b._emscripten_bind_MotionProperties_SetAngularVelocity_1 = d.wk)(a, c),
      Fm = b._emscripten_bind_MotionProperties_SetAngularVelocityClamped_1 = (a, c) => (Fm =
          b._emscripten_bind_MotionProperties_SetAngularVelocityClamped_1 = d.xk)(a, c),
      Gm = b._emscripten_bind_MotionProperties_MoveKinematic_3 = (a, c, e, f) => (Gm = b._emscripten_bind_MotionProperties_MoveKinematic_3 = d.yk)(a, c, e, f),
      Hm = b._emscripten_bind_MotionProperties_GetMaxLinearVelocity_0 = a => (Hm = b._emscripten_bind_MotionProperties_GetMaxLinearVelocity_0 = d.zk)(a),
      Im = b._emscripten_bind_MotionProperties_SetMaxLinearVelocity_1 = (a, c) => (Im = b._emscripten_bind_MotionProperties_SetMaxLinearVelocity_1 = d.Ak)(a, c),
      Jm = b._emscripten_bind_MotionProperties_GetMaxAngularVelocity_0 =
      a => (Jm = b._emscripten_bind_MotionProperties_GetMaxAngularVelocity_0 = d.Bk)(a),
      Km = b._emscripten_bind_MotionProperties_SetMaxAngularVelocity_1 = (a, c) => (Km = b._emscripten_bind_MotionProperties_SetMaxAngularVelocity_1 = d.Ck)(a, c),
      Lm = b._emscripten_bind_MotionProperties_GetLinearDamping_0 = a => (Lm = b._emscripten_bind_MotionProperties_GetLinearDamping_0 = d.Dk)(a),
      Mm = b._emscripten_bind_MotionProperties_SetLinearDamping_1 = (a, c) => (Mm = b._emscripten_bind_MotionProperties_SetLinearDamping_1 = d.Ek)(a, c),
      Nm = b._emscripten_bind_MotionProperties_GetAngularDamping_0 =
      a => (Nm = b._emscripten_bind_MotionProperties_GetAngularDamping_0 = d.Fk)(a),
      Om = b._emscripten_bind_MotionProperties_SetAngularDamping_1 = (a, c) => (Om = b._emscripten_bind_MotionProperties_SetAngularDamping_1 = d.Gk)(a, c),
      Pm = b._emscripten_bind_MotionProperties_GetInverseMass_0 = a => (Pm = b._emscripten_bind_MotionProperties_GetInverseMass_0 = d.Hk)(a),
      Qm = b._emscripten_bind_MotionProperties_SetInverseMass_1 = (a, c) => (Qm = b._emscripten_bind_MotionProperties_SetInverseMass_1 = d.Ik)(a, c),
      Rm = b._emscripten_bind_MotionProperties_GetInverseInertiaDiagonal_0 =
      a => (Rm = b._emscripten_bind_MotionProperties_GetInverseInertiaDiagonal_0 = d.Jk)(a),
      Sm = b._emscripten_bind_MotionProperties_GetInertiaRotation_0 = a => (Sm = b._emscripten_bind_MotionProperties_GetInertiaRotation_0 = d.Kk)(a),
      Tm = b._emscripten_bind_MotionProperties_SetInverseInertia_2 = (a, c, e) => (Tm = b._emscripten_bind_MotionProperties_SetInverseInertia_2 = d.Lk)(a, c, e),
      Um = b._emscripten_bind_MotionProperties___destroy___0 = a => (Um = b._emscripten_bind_MotionProperties___destroy___0 = d.Mk)(a),
      Vm = b._emscripten_bind_GroupFilterTable_GroupFilterTable_1 =
      a => (Vm = b._emscripten_bind_GroupFilterTable_GroupFilterTable_1 = d.Nk)(a),
      Wm = b._emscripten_bind_GroupFilterTable_DisableCollision_2 = (a, c, e) => (Wm = b._emscripten_bind_GroupFilterTable_DisableCollision_2 = d.Ok)(a, c, e),
      Xm = b._emscripten_bind_GroupFilterTable_EnableCollision_2 = (a, c, e) => (Xm = b._emscripten_bind_GroupFilterTable_EnableCollision_2 = d.Pk)(a, c, e),
      Ym = b._emscripten_bind_GroupFilterTable_IsCollisionEnabled_2 = (a, c, e) => (Ym = b._emscripten_bind_GroupFilterTable_IsCollisionEnabled_2 = d.Qk)(a, c, e),
      Zm = b._emscripten_bind_GroupFilterTable___destroy___0 =
      a => (Zm = b._emscripten_bind_GroupFilterTable___destroy___0 = d.Rk)(a),
      $m = b._emscripten_bind_CollisionGroup_CollisionGroup_0 = () => ($m = b._emscripten_bind_CollisionGroup_CollisionGroup_0 = d.Sk)(),
      an = b._emscripten_bind_CollisionGroup_CollisionGroup_3 = (a, c, e) => (an = b._emscripten_bind_CollisionGroup_CollisionGroup_3 = d.Tk)(a, c, e),
      bn = b._emscripten_bind_CollisionGroup_SetGroupFilter_1 = (a, c) => (bn = b._emscripten_bind_CollisionGroup_SetGroupFilter_1 = d.Uk)(a, c),
      cn = b._emscripten_bind_CollisionGroup_GetGroupFilter_0 = a =>
      (cn = b._emscripten_bind_CollisionGroup_GetGroupFilter_0 = d.Vk)(a),
      dn = b._emscripten_bind_CollisionGroup_SetGroupID_1 = (a, c) => (dn = b._emscripten_bind_CollisionGroup_SetGroupID_1 = d.Wk)(a, c),
      en = b._emscripten_bind_CollisionGroup_GetGroupID_0 = a => (en = b._emscripten_bind_CollisionGroup_GetGroupID_0 = d.Xk)(a),
      fn = b._emscripten_bind_CollisionGroup_SetSubGroupID_1 = (a, c) => (fn = b._emscripten_bind_CollisionGroup_SetSubGroupID_1 = d.Yk)(a, c),
      gn = b._emscripten_bind_CollisionGroup_GetSubGroupID_0 = a => (gn = b._emscripten_bind_CollisionGroup_GetSubGroupID_0 =
          d.Zk)(a),
      hn = b._emscripten_bind_CollisionGroup___destroy___0 = a => (hn = b._emscripten_bind_CollisionGroup___destroy___0 = d._k)(a),
      jn = b._emscripten_bind_Body_GetID_0 = a => (jn = b._emscripten_bind_Body_GetID_0 = d.$k)(a),
      kn = b._emscripten_bind_Body_IsActive_0 = a => (kn = b._emscripten_bind_Body_IsActive_0 = d.al)(a),
      ln = b._emscripten_bind_Body_IsStatic_0 = a => (ln = b._emscripten_bind_Body_IsStatic_0 = d.bl)(a),
      mn = b._emscripten_bind_Body_IsKinematic_0 = a => (mn = b._emscripten_bind_Body_IsKinematic_0 = d.cl)(a),
      nn = b._emscripten_bind_Body_IsDynamic_0 =
      a => (nn = b._emscripten_bind_Body_IsDynamic_0 = d.dl)(a),
      on = b._emscripten_bind_Body_CanBeKinematicOrDynamic_0 = a => (on = b._emscripten_bind_Body_CanBeKinematicOrDynamic_0 = d.el)(a),
      pn = b._emscripten_bind_Body_GetBodyType_0 = a => (pn = b._emscripten_bind_Body_GetBodyType_0 = d.fl)(a),
      qn = b._emscripten_bind_Body_GetMotionType_0 = a => (qn = b._emscripten_bind_Body_GetMotionType_0 = d.gl)(a),
      rn = b._emscripten_bind_Body_SetMotionType_1 = (a, c) => (rn = b._emscripten_bind_Body_SetMotionType_1 = d.hl)(a, c),
      sn = b._emscripten_bind_Body_SetIsSensor_1 =
      (a, c) => (sn = b._emscripten_bind_Body_SetIsSensor_1 = d.il)(a, c),
      tn = b._emscripten_bind_Body_IsSensor_0 = a => (tn = b._emscripten_bind_Body_IsSensor_0 = d.jl)(a),
      un = b._emscripten_bind_Body_GetObjectLayer_0 = a => (un = b._emscripten_bind_Body_GetObjectLayer_0 = d.kl)(a),
      vn = b._emscripten_bind_Body_GetCollisionGroup_0 = a => (vn = b._emscripten_bind_Body_GetCollisionGroup_0 = d.ll)(a),
      wn = b._emscripten_bind_Body_GetAllowSleeping_0 = a => (wn = b._emscripten_bind_Body_GetAllowSleeping_0 = d.ml)(a),
      xn = b._emscripten_bind_Body_SetAllowSleeping_1 =
      (a, c) => (xn = b._emscripten_bind_Body_SetAllowSleeping_1 = d.nl)(a, c),
      yn = b._emscripten_bind_Body_GetFriction_0 = a => (yn = b._emscripten_bind_Body_GetFriction_0 = d.ol)(a),
      zn = b._emscripten_bind_Body_SetFriction_1 = (a, c) => (zn = b._emscripten_bind_Body_SetFriction_1 = d.pl)(a, c),
      An = b._emscripten_bind_Body_GetRestitution_0 = a => (An = b._emscripten_bind_Body_GetRestitution_0 = d.ql)(a),
      Bn = b._emscripten_bind_Body_SetRestitution_1 = (a, c) => (Bn = b._emscripten_bind_Body_SetRestitution_1 = d.rl)(a, c),
      Cn = b._emscripten_bind_Body_GetLinearVelocity_0 =
      a => (Cn = b._emscripten_bind_Body_GetLinearVelocity_0 = d.sl)(a),
      Dn = b._emscripten_bind_Body_SetLinearVelocity_1 = (a, c) => (Dn = b._emscripten_bind_Body_SetLinearVelocity_1 = d.tl)(a, c),
      En = b._emscripten_bind_Body_SetLinearVelocityClamped_1 = (a, c) => (En = b._emscripten_bind_Body_SetLinearVelocityClamped_1 = d.ul)(a, c),
      Fn = b._emscripten_bind_Body_GetAngularVelocity_0 = a => (Fn = b._emscripten_bind_Body_GetAngularVelocity_0 = d.vl)(a),
      Gn = b._emscripten_bind_Body_SetAngularVelocity_1 = (a, c) => (Gn = b._emscripten_bind_Body_SetAngularVelocity_1 =
          d.wl)(a, c),
      Hn = b._emscripten_bind_Body_SetAngularVelocityClamped_1 = (a, c) => (Hn = b._emscripten_bind_Body_SetAngularVelocityClamped_1 = d.xl)(a, c),
      In = b._emscripten_bind_Body_AddForce_1 = (a, c) => (In = b._emscripten_bind_Body_AddForce_1 = d.yl)(a, c),
      Jn = b._emscripten_bind_Body_AddForce_2 = (a, c, e) => (Jn = b._emscripten_bind_Body_AddForce_2 = d.zl)(a, c, e),
      Kn = b._emscripten_bind_Body_AddTorque_1 = (a, c) => (Kn = b._emscripten_bind_Body_AddTorque_1 = d.Al)(a, c),
      Ln = b._emscripten_bind_Body_AddImpulse_1 = (a, c) => (Ln = b._emscripten_bind_Body_AddImpulse_1 =
          d.Bl)(a, c),
      Mn = b._emscripten_bind_Body_AddImpulse_2 = (a, c, e) => (Mn = b._emscripten_bind_Body_AddImpulse_2 = d.Cl)(a, c, e),
      Nn = b._emscripten_bind_Body_MoveKinematic_3 = (a, c, e, f) => (Nn = b._emscripten_bind_Body_MoveKinematic_3 = d.Dl)(a, c, e, f),
      On = b._emscripten_bind_Body_IsInBroadPhase_0 = a => (On = b._emscripten_bind_Body_IsInBroadPhase_0 = d.El)(a),
      Pn = b._emscripten_bind_Body_GetShape_0 = a => (Pn = b._emscripten_bind_Body_GetShape_0 = d.Fl)(a),
      Qn = b._emscripten_bind_Body_GetPosition_0 = a => (Qn = b._emscripten_bind_Body_GetPosition_0 =
          d.Gl)(a),
      Rn = b._emscripten_bind_Body_GetRotation_0 = a => (Rn = b._emscripten_bind_Body_GetRotation_0 = d.Hl)(a),
      Sn = b._emscripten_bind_Body_GetWorldTransform_0 = a => (Sn = b._emscripten_bind_Body_GetWorldTransform_0 = d.Il)(a),
      Tn = b._emscripten_bind_Body_GetCenterOfMassPosition_0 = a => (Tn = b._emscripten_bind_Body_GetCenterOfMassPosition_0 = d.Jl)(a),
      Un = b._emscripten_bind_Body_GetCenterOfMassTransform_0 = a => (Un = b._emscripten_bind_Body_GetCenterOfMassTransform_0 = d.Kl)(a),
      Vn = b._emscripten_bind_Body_GetWorldSpaceBounds_0 = a =>
      (Vn = b._emscripten_bind_Body_GetWorldSpaceBounds_0 = d.Ll)(a),
      Wn = b._emscripten_bind_Body_GetMotionProperties_0 = a => (Wn = b._emscripten_bind_Body_GetMotionProperties_0 = d.Ml)(a),
      Xn = b._emscripten_bind_Body___destroy___0 = a => (Xn = b._emscripten_bind_Body___destroy___0 = d.Nl)(a),
      Yn = b._emscripten_bind_BodyInterface_CreateBody_1 = (a, c) => (Yn = b._emscripten_bind_BodyInterface_CreateBody_1 = d.Ol)(a, c),
      Zn = b._emscripten_bind_BodyInterface_CreateSoftBody_1 = (a, c) => (Zn = b._emscripten_bind_BodyInterface_CreateSoftBody_1 = d.Pl)(a,
          c),
      $n = b._emscripten_bind_BodyInterface_DestroyBody_1 = (a, c) => ($n = b._emscripten_bind_BodyInterface_DestroyBody_1 = d.Ql)(a, c),
      ao = b._emscripten_bind_BodyInterface_AddBody_2 = (a, c, e) => (ao = b._emscripten_bind_BodyInterface_AddBody_2 = d.Rl)(a, c, e),
      bo = b._emscripten_bind_BodyInterface_RemoveBody_1 = (a, c) => (bo = b._emscripten_bind_BodyInterface_RemoveBody_1 = d.Sl)(a, c),
      co = b._emscripten_bind_BodyInterface_IsAdded_1 = (a, c) => (co = b._emscripten_bind_BodyInterface_IsAdded_1 = d.Tl)(a, c),
      eo = b._emscripten_bind_BodyInterface_CreateAndAddBody_2 =
      (a, c, e) => (eo = b._emscripten_bind_BodyInterface_CreateAndAddBody_2 = d.Ul)(a, c, e),
      fo = b._emscripten_bind_BodyInterface_CreateAndAddSoftBody_2 = (a, c, e) => (fo = b._emscripten_bind_BodyInterface_CreateAndAddSoftBody_2 = d.Vl)(a, c, e),
      go = b._emscripten_bind_BodyInterface_GetShape_1 = (a, c) => (go = b._emscripten_bind_BodyInterface_GetShape_1 = d.Wl)(a, c),
      ho = b._emscripten_bind_BodyInterface_SetShape_4 = (a, c, e, f, t) => (ho = b._emscripten_bind_BodyInterface_SetShape_4 = d.Xl)(a, c, e, f, t),
      io = b._emscripten_bind_BodyInterface_SetObjectLayer_2 =
      (a, c, e) => (io = b._emscripten_bind_BodyInterface_SetObjectLayer_2 = d.Yl)(a, c, e),
      jo = b._emscripten_bind_BodyInterface_GetObjectLayer_1 = (a, c) => (jo = b._emscripten_bind_BodyInterface_GetObjectLayer_1 = d.Zl)(a, c),
      ko = b._emscripten_bind_BodyInterface_SetPositionAndRotation_4 = (a, c, e, f, t) => (ko = b._emscripten_bind_BodyInterface_SetPositionAndRotation_4 = d._l)(a, c, e, f, t),
      lo = b._emscripten_bind_BodyInterface_SetPositionAndRotationWhenChanged_4 = (a, c, e, f, t) => (lo = b._emscripten_bind_BodyInterface_SetPositionAndRotationWhenChanged_4 =
          d.$l)(a, c, e, f, t),
      mo = b._emscripten_bind_BodyInterface_GetPositionAndRotation_3 = (a, c, e, f) => (mo = b._emscripten_bind_BodyInterface_GetPositionAndRotation_3 = d.am)(a, c, e, f),
      no = b._emscripten_bind_BodyInterface_SetPosition_3 = (a, c, e, f) => (no = b._emscripten_bind_BodyInterface_SetPosition_3 = d.bm)(a, c, e, f),
      oo = b._emscripten_bind_BodyInterface_GetPosition_1 = (a, c) => (oo = b._emscripten_bind_BodyInterface_GetPosition_1 = d.cm)(a, c),
      po = b._emscripten_bind_BodyInterface_SetRotation_3 = (a, c, e, f) => (po = b._emscripten_bind_BodyInterface_SetRotation_3 =
          d.dm)(a, c, e, f),
      qo = b._emscripten_bind_BodyInterface_GetRotation_1 = (a, c) => (qo = b._emscripten_bind_BodyInterface_GetRotation_1 = d.em)(a, c),
      ro = b._emscripten_bind_BodyInterface_MoveKinematic_4 = (a, c, e, f, t) => (ro = b._emscripten_bind_BodyInterface_MoveKinematic_4 = d.fm)(a, c, e, f, t),
      so = b._emscripten_bind_BodyInterface_ActivateBody_1 = (a, c) => (so = b._emscripten_bind_BodyInterface_ActivateBody_1 = d.gm)(a, c),
      to = b._emscripten_bind_BodyInterface_DeactivateBody_1 = (a, c) => (to = b._emscripten_bind_BodyInterface_DeactivateBody_1 =
          d.hm)(a, c),
      uo = b._emscripten_bind_BodyInterface_IsActive_1 = (a, c) => (uo = b._emscripten_bind_BodyInterface_IsActive_1 = d.im)(a, c),
      vo = b._emscripten_bind_BodyInterface_SetMotionType_3 = (a, c, e, f) => (vo = b._emscripten_bind_BodyInterface_SetMotionType_3 = d.jm)(a, c, e, f),
      wo = b._emscripten_bind_BodyInterface_SetMotionQuality_2 = (a, c, e) => (wo = b._emscripten_bind_BodyInterface_SetMotionQuality_2 = d.km)(a, c, e),
      xo = b._emscripten_bind_BodyInterface___destroy___0 = a => (xo = b._emscripten_bind_BodyInterface___destroy___0 = d.lm)(a),
      yo = b._emscripten_bind_PhysicsSystem_GetBodyInterface_0 = a => (yo = b._emscripten_bind_PhysicsSystem_GetBodyInterface_0 = d.mm)(a),
      zo = b._emscripten_bind_PhysicsSystem_SetGravity_1 = (a, c) => (zo = b._emscripten_bind_PhysicsSystem_SetGravity_1 = d.nm)(a, c),
      Ao = b._emscripten_bind_PhysicsSystem_GetGravity_0 = a => (Ao = b._emscripten_bind_PhysicsSystem_GetGravity_0 = d.om)(a),
      Bo = b._emscripten_bind_PhysicsSystem_GetNumBodies_0 = a => (Bo = b._emscripten_bind_PhysicsSystem_GetNumBodies_0 = d.pm)(a),
      Co = b._emscripten_bind_PhysicsSystem_GetNumActiveBodies_1 =
      (a, c) => (Co = b._emscripten_bind_PhysicsSystem_GetNumActiveBodies_1 = d.qm)(a, c),
      Do = b._emscripten_bind_PhysicsSystem_GetMaxBodies_0 = a => (Do = b._emscripten_bind_PhysicsSystem_GetMaxBodies_0 = d.rm)(a),
      Eo = b._emscripten_bind_PhysicsSystem_AddConstraint_1 = (a, c) => (Eo = b._emscripten_bind_PhysicsSystem_AddConstraint_1 = d.sm)(a, c),
      Fo = b._emscripten_bind_PhysicsSystem_RemoveConstraint_1 = (a, c) => (Fo = b._emscripten_bind_PhysicsSystem_RemoveConstraint_1 = d.tm)(a, c),
      Go = b._emscripten_bind_PhysicsSystem___destroy___0 = a => (Go = b._emscripten_bind_PhysicsSystem___destroy___0 =
          d.um)(a),
      Ho = b._emscripten_bind_MassProperties_MassProperties_0 = () => (Ho = b._emscripten_bind_MassProperties_MassProperties_0 = d.vm)(),
      Io = b._emscripten_bind_MassProperties_get_mMass_0 = a => (Io = b._emscripten_bind_MassProperties_get_mMass_0 = d.wm)(a),
      Jo = b._emscripten_bind_MassProperties_set_mMass_1 = (a, c) => (Jo = b._emscripten_bind_MassProperties_set_mMass_1 = d.xm)(a, c),
      Ko = b._emscripten_bind_MassProperties_get_mInertia_0 = a => (Ko = b._emscripten_bind_MassProperties_get_mInertia_0 = d.ym)(a),
      Lo = b._emscripten_bind_MassProperties_set_mInertia_1 =
      (a, c) => (Lo = b._emscripten_bind_MassProperties_set_mInertia_1 = d.zm)(a, c),
      Mo = b._emscripten_bind_MassProperties___destroy___0 = a => (Mo = b._emscripten_bind_MassProperties___destroy___0 = d.Am)(a),
      No = b._emscripten_bind_BodyCreationSettings_BodyCreationSettings_5 = (a, c, e, f, t) => (No = b._emscripten_bind_BodyCreationSettings_BodyCreationSettings_5 = d.Bm)(a, c, e, f, t),
      Oo = b._emscripten_bind_BodyCreationSettings_get_mPosition_0 = a => (Oo = b._emscripten_bind_BodyCreationSettings_get_mPosition_0 = d.Cm)(a),
      Po = b._emscripten_bind_BodyCreationSettings_set_mPosition_1 =
      (a, c) => (Po = b._emscripten_bind_BodyCreationSettings_set_mPosition_1 = d.Dm)(a, c),
      Qo = b._emscripten_bind_BodyCreationSettings_get_mRotation_0 = a => (Qo = b._emscripten_bind_BodyCreationSettings_get_mRotation_0 = d.Em)(a),
      Ro = b._emscripten_bind_BodyCreationSettings_set_mRotation_1 = (a, c) => (Ro = b._emscripten_bind_BodyCreationSettings_set_mRotation_1 = d.Fm)(a, c),
      So = b._emscripten_bind_BodyCreationSettings_get_mLinearVelocity_0 = a => (So = b._emscripten_bind_BodyCreationSettings_get_mLinearVelocity_0 = d.Gm)(a),
      To = b._emscripten_bind_BodyCreationSettings_set_mLinearVelocity_1 =
      (a, c) => (To = b._emscripten_bind_BodyCreationSettings_set_mLinearVelocity_1 = d.Hm)(a, c),
      Uo = b._emscripten_bind_BodyCreationSettings_get_mAngularVelocity_0 = a => (Uo = b._emscripten_bind_BodyCreationSettings_get_mAngularVelocity_0 = d.Im)(a),
      Vo = b._emscripten_bind_BodyCreationSettings_set_mAngularVelocity_1 = (a, c) => (Vo = b._emscripten_bind_BodyCreationSettings_set_mAngularVelocity_1 = d.Jm)(a, c),
      Wo = b._emscripten_bind_BodyCreationSettings_get_mUserData_0 = a => (Wo = b._emscripten_bind_BodyCreationSettings_get_mUserData_0 =
          d.Km)(a),
      Xo = b._emscripten_bind_BodyCreationSettings_set_mUserData_1 = (a, c, e) => (Xo = b._emscripten_bind_BodyCreationSettings_set_mUserData_1 = d.Lm)(a, c, e),
      Yo = b._emscripten_bind_BodyCreationSettings_get_mObjectLayer_0 = a => (Yo = b._emscripten_bind_BodyCreationSettings_get_mObjectLayer_0 = d.Mm)(a),
      Zo = b._emscripten_bind_BodyCreationSettings_set_mObjectLayer_1 = (a, c) => (Zo = b._emscripten_bind_BodyCreationSettings_set_mObjectLayer_1 = d.Nm)(a, c),
      $o = b._emscripten_bind_BodyCreationSettings_get_mCollisionGroup_0 = a => ($o =
          b._emscripten_bind_BodyCreationSettings_get_mCollisionGroup_0 = d.Om)(a),
      ap = b._emscripten_bind_BodyCreationSettings_set_mCollisionGroup_1 = (a, c) => (ap = b._emscripten_bind_BodyCreationSettings_set_mCollisionGroup_1 = d.Pm)(a, c),
      bp = b._emscripten_bind_BodyCreationSettings_get_mMotionType_0 = a => (bp = b._emscripten_bind_BodyCreationSettings_get_mMotionType_0 = d.Qm)(a),
      cp = b._emscripten_bind_BodyCreationSettings_set_mMotionType_1 = (a, c) => (cp = b._emscripten_bind_BodyCreationSettings_set_mMotionType_1 = d.Rm)(a, c),
      dp = b._emscripten_bind_BodyCreationSettings_get_mAllowDynamicOrKinematic_0 =
      a => (dp = b._emscripten_bind_BodyCreationSettings_get_mAllowDynamicOrKinematic_0 = d.Sm)(a),
      ep = b._emscripten_bind_BodyCreationSettings_set_mAllowDynamicOrKinematic_1 = (a, c) => (ep = b._emscripten_bind_BodyCreationSettings_set_mAllowDynamicOrKinematic_1 = d.Tm)(a, c),
      fp = b._emscripten_bind_BodyCreationSettings_get_mIsSensor_0 = a => (fp = b._emscripten_bind_BodyCreationSettings_get_mIsSensor_0 = d.Um)(a),
      gp = b._emscripten_bind_BodyCreationSettings_set_mIsSensor_1 = (a, c) => (gp = b._emscripten_bind_BodyCreationSettings_set_mIsSensor_1 =
          d.Vm)(a, c),
      hp = b._emscripten_bind_BodyCreationSettings_get_mMotionQuality_0 = a => (hp = b._emscripten_bind_BodyCreationSettings_get_mMotionQuality_0 = d.Wm)(a),
      ip = b._emscripten_bind_BodyCreationSettings_set_mMotionQuality_1 = (a, c) => (ip = b._emscripten_bind_BodyCreationSettings_set_mMotionQuality_1 = d.Xm)(a, c),
      jp = b._emscripten_bind_BodyCreationSettings_get_mAllowSleeping_0 = a => (jp = b._emscripten_bind_BodyCreationSettings_get_mAllowSleeping_0 = d.Ym)(a),
      kp = b._emscripten_bind_BodyCreationSettings_set_mAllowSleeping_1 =
      (a, c) => (kp = b._emscripten_bind_BodyCreationSettings_set_mAllowSleeping_1 = d.Zm)(a, c),
      lp = b._emscripten_bind_BodyCreationSettings_get_mFriction_0 = a => (lp = b._emscripten_bind_BodyCreationSettings_get_mFriction_0 = d._m)(a),
      mp = b._emscripten_bind_BodyCreationSettings_set_mFriction_1 = (a, c) => (mp = b._emscripten_bind_BodyCreationSettings_set_mFriction_1 = d.$m)(a, c),
      np = b._emscripten_bind_BodyCreationSettings_get_mRestitution_0 = a => (np = b._emscripten_bind_BodyCreationSettings_get_mRestitution_0 = d.an)(a),
      op = b._emscripten_bind_BodyCreationSettings_set_mRestitution_1 =
      (a, c) => (op = b._emscripten_bind_BodyCreationSettings_set_mRestitution_1 = d.bn)(a, c),
      pp = b._emscripten_bind_BodyCreationSettings_get_mLinearDamping_0 = a => (pp = b._emscripten_bind_BodyCreationSettings_get_mLinearDamping_0 = d.cn)(a),
      qp = b._emscripten_bind_BodyCreationSettings_set_mLinearDamping_1 = (a, c) => (qp = b._emscripten_bind_BodyCreationSettings_set_mLinearDamping_1 = d.dn)(a, c),
      rp = b._emscripten_bind_BodyCreationSettings_get_mAngularDamping_0 = a => (rp = b._emscripten_bind_BodyCreationSettings_get_mAngularDamping_0 =
          d.en)(a),
      sp = b._emscripten_bind_BodyCreationSettings_set_mAngularDamping_1 = (a, c) => (sp = b._emscripten_bind_BodyCreationSettings_set_mAngularDamping_1 = d.fn)(a, c),
      tp = b._emscripten_bind_BodyCreationSettings_get_mMaxLinearVelocity_0 = a => (tp = b._emscripten_bind_BodyCreationSettings_get_mMaxLinearVelocity_0 = d.gn)(a),
      up = b._emscripten_bind_BodyCreationSettings_set_mMaxLinearVelocity_1 = (a, c) => (up = b._emscripten_bind_BodyCreationSettings_set_mMaxLinearVelocity_1 = d.hn)(a, c),
      vp = b._emscripten_bind_BodyCreationSettings_get_mMaxAngularVelocity_0 =
      a => (vp = b._emscripten_bind_BodyCreationSettings_get_mMaxAngularVelocity_0 = d.jn)(a),
      wp = b._emscripten_bind_BodyCreationSettings_set_mMaxAngularVelocity_1 = (a, c) => (wp = b._emscripten_bind_BodyCreationSettings_set_mMaxAngularVelocity_1 = d.kn)(a, c),
      xp = b._emscripten_bind_BodyCreationSettings_get_mGravityFactor_0 = a => (xp = b._emscripten_bind_BodyCreationSettings_get_mGravityFactor_0 = d.ln)(a),
      yp = b._emscripten_bind_BodyCreationSettings_set_mGravityFactor_1 = (a, c) => (yp = b._emscripten_bind_BodyCreationSettings_set_mGravityFactor_1 =
          d.mn)(a, c),
      zp = b._emscripten_bind_BodyCreationSettings_get_mOverrideMassProperties_0 = a => (zp = b._emscripten_bind_BodyCreationSettings_get_mOverrideMassProperties_0 = d.nn)(a),
      Ap = b._emscripten_bind_BodyCreationSettings_set_mOverrideMassProperties_1 = (a, c) => (Ap = b._emscripten_bind_BodyCreationSettings_set_mOverrideMassProperties_1 = d.on)(a, c),
      Bp = b._emscripten_bind_BodyCreationSettings_get_mInertiaMultiplier_0 = a => (Bp = b._emscripten_bind_BodyCreationSettings_get_mInertiaMultiplier_0 = d.pn)(a),
      Cp = b._emscripten_bind_BodyCreationSettings_set_mInertiaMultiplier_1 =
      (a, c) => (Cp = b._emscripten_bind_BodyCreationSettings_set_mInertiaMultiplier_1 = d.qn)(a, c),
      Dp = b._emscripten_bind_BodyCreationSettings_get_mMassPropertiesOverride_0 = a => (Dp = b._emscripten_bind_BodyCreationSettings_get_mMassPropertiesOverride_0 = d.rn)(a),
      Ep = b._emscripten_bind_BodyCreationSettings_set_mMassPropertiesOverride_1 = (a, c) => (Ep = b._emscripten_bind_BodyCreationSettings_set_mMassPropertiesOverride_1 = d.sn)(a, c),
      Fp = b._emscripten_bind_BodyCreationSettings___destroy___0 = a => (Fp = b._emscripten_bind_BodyCreationSettings___destroy___0 =
          d.tn)(a),
      Gp = b._emscripten_bind_SoftBodySharedSettingsVertex_SoftBodySharedSettingsVertex_0 = () => (Gp = b._emscripten_bind_SoftBodySharedSettingsVertex_SoftBodySharedSettingsVertex_0 = d.un)(),
      Hp = b._emscripten_bind_SoftBodySharedSettingsVertex_get_mPosition_0 = a => (Hp = b._emscripten_bind_SoftBodySharedSettingsVertex_get_mPosition_0 = d.vn)(a),
      Ip = b._emscripten_bind_SoftBodySharedSettingsVertex_set_mPosition_1 = (a, c) => (Ip = b._emscripten_bind_SoftBodySharedSettingsVertex_set_mPosition_1 = d.wn)(a, c),
      Jp = b._emscripten_bind_SoftBodySharedSettingsVertex_get_mVelocity_0 =
      a => (Jp = b._emscripten_bind_SoftBodySharedSettingsVertex_get_mVelocity_0 = d.xn)(a),
      Kp = b._emscripten_bind_SoftBodySharedSettingsVertex_set_mVelocity_1 = (a, c) => (Kp = b._emscripten_bind_SoftBodySharedSettingsVertex_set_mVelocity_1 = d.yn)(a, c),
      Lp = b._emscripten_bind_SoftBodySharedSettingsVertex_get_mInvMass_0 = a => (Lp = b._emscripten_bind_SoftBodySharedSettingsVertex_get_mInvMass_0 = d.zn)(a),
      Mp = b._emscripten_bind_SoftBodySharedSettingsVertex_set_mInvMass_1 = (a, c) => (Mp = b._emscripten_bind_SoftBodySharedSettingsVertex_set_mInvMass_1 =
          d.An)(a, c),
      Np = b._emscripten_bind_SoftBodySharedSettingsVertex___destroy___0 = a => (Np = b._emscripten_bind_SoftBodySharedSettingsVertex___destroy___0 = d.Bn)(a),
      Op = b._emscripten_bind_SoftBodySharedSettingsFace_SoftBodySharedSettingsFace_4 = (a, c, e, f) => (Op = b._emscripten_bind_SoftBodySharedSettingsFace_SoftBodySharedSettingsFace_4 = d.Cn)(a, c, e, f),
      Pp = b._emscripten_bind_SoftBodySharedSettingsFace_get_mVertex_1 = (a, c) => (Pp = b._emscripten_bind_SoftBodySharedSettingsFace_get_mVertex_1 = d.Dn)(a, c),
      Qp = b._emscripten_bind_SoftBodySharedSettingsFace_set_mVertex_2 =
      (a, c, e) => (Qp = b._emscripten_bind_SoftBodySharedSettingsFace_set_mVertex_2 = d.En)(a, c, e),
      Rp = b._emscripten_bind_SoftBodySharedSettingsFace_get_mMaterialIndex_0 = a => (Rp = b._emscripten_bind_SoftBodySharedSettingsFace_get_mMaterialIndex_0 = d.Fn)(a),
      Sp = b._emscripten_bind_SoftBodySharedSettingsFace_set_mMaterialIndex_1 = (a, c) => (Sp = b._emscripten_bind_SoftBodySharedSettingsFace_set_mMaterialIndex_1 = d.Gn)(a, c),
      Tp = b._emscripten_bind_SoftBodySharedSettingsFace___destroy___0 = a => (Tp = b._emscripten_bind_SoftBodySharedSettingsFace___destroy___0 =
          d.Hn)(a),
      Up = b._emscripten_bind_SoftBodySharedSettingsEdge_SoftBodySharedSettingsEdge_3 = (a, c, e) => (Up = b._emscripten_bind_SoftBodySharedSettingsEdge_SoftBodySharedSettingsEdge_3 = d.In)(a, c, e),
      Vp = b._emscripten_bind_SoftBodySharedSettingsEdge_get_mVertex_1 = (a, c) => (Vp = b._emscripten_bind_SoftBodySharedSettingsEdge_get_mVertex_1 = d.Jn)(a, c),
      Wp = b._emscripten_bind_SoftBodySharedSettingsEdge_set_mVertex_2 = (a, c, e) => (Wp = b._emscripten_bind_SoftBodySharedSettingsEdge_set_mVertex_2 = d.Kn)(a, c, e),
      Xp = b._emscripten_bind_SoftBodySharedSettingsEdge_get_mRestLength_0 =
      a => (Xp = b._emscripten_bind_SoftBodySharedSettingsEdge_get_mRestLength_0 = d.Ln)(a),
      Yp = b._emscripten_bind_SoftBodySharedSettingsEdge_set_mRestLength_1 = (a, c) => (Yp = b._emscripten_bind_SoftBodySharedSettingsEdge_set_mRestLength_1 = d.Mn)(a, c),
      Zp = b._emscripten_bind_SoftBodySharedSettingsEdge_get_mCompliance_0 = a => (Zp = b._emscripten_bind_SoftBodySharedSettingsEdge_get_mCompliance_0 = d.Nn)(a),
      $p = b._emscripten_bind_SoftBodySharedSettingsEdge_set_mCompliance_1 = (a, c) => ($p = b._emscripten_bind_SoftBodySharedSettingsEdge_set_mCompliance_1 =
          d.On)(a, c),
      aq = b._emscripten_bind_SoftBodySharedSettingsEdge___destroy___0 = a => (aq = b._emscripten_bind_SoftBodySharedSettingsEdge___destroy___0 = d.Pn)(a),
      bq = b._emscripten_bind_SoftBodySharedSettingsVolume_SoftBodySharedSettingsVolume_5 = (a, c, e, f, t) => (bq = b._emscripten_bind_SoftBodySharedSettingsVolume_SoftBodySharedSettingsVolume_5 = d.Qn)(a, c, e, f, t),
      cq = b._emscripten_bind_SoftBodySharedSettingsVolume_get_mVertex_1 = (a, c) => (cq = b._emscripten_bind_SoftBodySharedSettingsVolume_get_mVertex_1 = d.Rn)(a, c),
      dq = b._emscripten_bind_SoftBodySharedSettingsVolume_set_mVertex_2 =
      (a, c, e) => (dq = b._emscripten_bind_SoftBodySharedSettingsVolume_set_mVertex_2 = d.Sn)(a, c, e),
      eq = b._emscripten_bind_SoftBodySharedSettingsVolume_get_mSixRestVolume_0 = a => (eq = b._emscripten_bind_SoftBodySharedSettingsVolume_get_mSixRestVolume_0 = d.Tn)(a),
      fq = b._emscripten_bind_SoftBodySharedSettingsVolume_set_mSixRestVolume_1 = (a, c) => (fq = b._emscripten_bind_SoftBodySharedSettingsVolume_set_mSixRestVolume_1 = d.Un)(a, c),
      gq = b._emscripten_bind_SoftBodySharedSettingsVolume_get_mCompliance_0 = a => (gq = b._emscripten_bind_SoftBodySharedSettingsVolume_get_mCompliance_0 =
          d.Vn)(a),
      hq = b._emscripten_bind_SoftBodySharedSettingsVolume_set_mCompliance_1 = (a, c) => (hq = b._emscripten_bind_SoftBodySharedSettingsVolume_set_mCompliance_1 = d.Wn)(a, c),
      iq = b._emscripten_bind_SoftBodySharedSettingsVolume___destroy___0 = a => (iq = b._emscripten_bind_SoftBodySharedSettingsVolume___destroy___0 = d.Xn)(a),
      jq = b._emscripten_bind_ArraySoftBodySharedSettingsVertex_size_0 = a => (jq = b._emscripten_bind_ArraySoftBodySharedSettingsVertex_size_0 = d.Yn)(a),
      kq = b._emscripten_bind_ArraySoftBodySharedSettingsVertex_at_1 =
      (a, c) => (kq = b._emscripten_bind_ArraySoftBodySharedSettingsVertex_at_1 = d.Zn)(a, c),
      lq = b._emscripten_bind_ArraySoftBodySharedSettingsVertex_push_back_1 = (a, c) => (lq = b._emscripten_bind_ArraySoftBodySharedSettingsVertex_push_back_1 = d._n)(a, c),
      mq = b._emscripten_bind_ArraySoftBodySharedSettingsVertex_reserve_1 = (a, c) => (mq = b._emscripten_bind_ArraySoftBodySharedSettingsVertex_reserve_1 = d.$n)(a, c),
      nq = b._emscripten_bind_ArraySoftBodySharedSettingsVertex_resize_1 = (a, c) => (nq = b._emscripten_bind_ArraySoftBodySharedSettingsVertex_resize_1 =
          d.ao)(a, c),
      oq = b._emscripten_bind_ArraySoftBodySharedSettingsVertex___destroy___0 = a => (oq = b._emscripten_bind_ArraySoftBodySharedSettingsVertex___destroy___0 = d.bo)(a),
      pq = b._emscripten_bind_ArraySoftBodySharedSettingsFace_size_0 = a => (pq = b._emscripten_bind_ArraySoftBodySharedSettingsFace_size_0 = d.co)(a),
      qq = b._emscripten_bind_ArraySoftBodySharedSettingsFace_at_1 = (a, c) => (qq = b._emscripten_bind_ArraySoftBodySharedSettingsFace_at_1 = d.eo)(a, c),
      rq = b._emscripten_bind_ArraySoftBodySharedSettingsFace_push_back_1 =
      (a, c) => (rq = b._emscripten_bind_ArraySoftBodySharedSettingsFace_push_back_1 = d.fo)(a, c),
      sq = b._emscripten_bind_ArraySoftBodySharedSettingsFace_reserve_1 = (a, c) => (sq = b._emscripten_bind_ArraySoftBodySharedSettingsFace_reserve_1 = d.go)(a, c),
      tq = b._emscripten_bind_ArraySoftBodySharedSettingsFace_resize_1 = (a, c) => (tq = b._emscripten_bind_ArraySoftBodySharedSettingsFace_resize_1 = d.ho)(a, c),
      uq = b._emscripten_bind_ArraySoftBodySharedSettingsFace___destroy___0 = a => (uq = b._emscripten_bind_ArraySoftBodySharedSettingsFace___destroy___0 =
          d.io)(a),
      vq = b._emscripten_bind_ArraySoftBodySharedSettingsEdge_size_0 = a => (vq = b._emscripten_bind_ArraySoftBodySharedSettingsEdge_size_0 = d.jo)(a),
      wq = b._emscripten_bind_ArraySoftBodySharedSettingsEdge_at_1 = (a, c) => (wq = b._emscripten_bind_ArraySoftBodySharedSettingsEdge_at_1 = d.ko)(a, c),
      xq = b._emscripten_bind_ArraySoftBodySharedSettingsEdge_push_back_1 = (a, c) => (xq = b._emscripten_bind_ArraySoftBodySharedSettingsEdge_push_back_1 = d.lo)(a, c),
      yq = b._emscripten_bind_ArraySoftBodySharedSettingsEdge_reserve_1 = (a, c) =>
      (yq = b._emscripten_bind_ArraySoftBodySharedSettingsEdge_reserve_1 = d.mo)(a, c),
      zq = b._emscripten_bind_ArraySoftBodySharedSettingsEdge_resize_1 = (a, c) => (zq = b._emscripten_bind_ArraySoftBodySharedSettingsEdge_resize_1 = d.no)(a, c),
      Aq = b._emscripten_bind_ArraySoftBodySharedSettingsEdge___destroy___0 = a => (Aq = b._emscripten_bind_ArraySoftBodySharedSettingsEdge___destroy___0 = d.oo)(a),
      Bq = b._emscripten_bind_ArraySoftBodySharedSettingsVolume_size_0 = a => (Bq = b._emscripten_bind_ArraySoftBodySharedSettingsVolume_size_0 = d.po)(a),
      Cq = b._emscripten_bind_ArraySoftBodySharedSettingsVolume_at_1 = (a, c) => (Cq = b._emscripten_bind_ArraySoftBodySharedSettingsVolume_at_1 = d.qo)(a, c),
      Dq = b._emscripten_bind_ArraySoftBodySharedSettingsVolume_push_back_1 = (a, c) => (Dq = b._emscripten_bind_ArraySoftBodySharedSettingsVolume_push_back_1 = d.ro)(a, c),
      Eq = b._emscripten_bind_ArraySoftBodySharedSettingsVolume_reserve_1 = (a, c) => (Eq = b._emscripten_bind_ArraySoftBodySharedSettingsVolume_reserve_1 = d.so)(a, c),
      Fq = b._emscripten_bind_ArraySoftBodySharedSettingsVolume_resize_1 =
      (a, c) => (Fq = b._emscripten_bind_ArraySoftBodySharedSettingsVolume_resize_1 = d.to)(a, c),
      Gq = b._emscripten_bind_ArraySoftBodySharedSettingsVolume___destroy___0 = a => (Gq = b._emscripten_bind_ArraySoftBodySharedSettingsVolume___destroy___0 = d.uo)(a),
      Hq = b._emscripten_bind_SoftBodySharedSettings_SoftBodySharedSettings_0 = () => (Hq = b._emscripten_bind_SoftBodySharedSettings_SoftBodySharedSettings_0 = d.vo)(),
      Iq = b._emscripten_bind_SoftBodySharedSettings_AddFace_1 = (a, c) => (Iq = b._emscripten_bind_SoftBodySharedSettings_AddFace_1 =
          d.wo)(a, c),
      Jq = b._emscripten_bind_SoftBodySharedSettings_CalculateEdgeLengths_0 = a => (Jq = b._emscripten_bind_SoftBodySharedSettings_CalculateEdgeLengths_0 = d.xo)(a),
      Kq = b._emscripten_bind_SoftBodySharedSettings_CalculateVolumeConstraintVolumes_0 = a => (Kq = b._emscripten_bind_SoftBodySharedSettings_CalculateVolumeConstraintVolumes_0 = d.yo)(a),
      Lq = b._emscripten_bind_SoftBodySharedSettings_get_mVertices_0 = a => (Lq = b._emscripten_bind_SoftBodySharedSettings_get_mVertices_0 = d.zo)(a),
      Mq = b._emscripten_bind_SoftBodySharedSettings_set_mVertices_1 =
      (a, c) => (Mq = b._emscripten_bind_SoftBodySharedSettings_set_mVertices_1 = d.Ao)(a, c),
      Nq = b._emscripten_bind_SoftBodySharedSettings_get_mFaces_0 = a => (Nq = b._emscripten_bind_SoftBodySharedSettings_get_mFaces_0 = d.Bo)(a),
      Oq = b._emscripten_bind_SoftBodySharedSettings_set_mFaces_1 = (a, c) => (Oq = b._emscripten_bind_SoftBodySharedSettings_set_mFaces_1 = d.Co)(a, c),
      Pq = b._emscripten_bind_SoftBodySharedSettings_get_mEdgeConstraints_0 = a => (Pq = b._emscripten_bind_SoftBodySharedSettings_get_mEdgeConstraints_0 = d.Do)(a),
      Qq = b._emscripten_bind_SoftBodySharedSettings_set_mEdgeConstraints_1 =
      (a, c) => (Qq = b._emscripten_bind_SoftBodySharedSettings_set_mEdgeConstraints_1 = d.Eo)(a, c),
      Rq = b._emscripten_bind_SoftBodySharedSettings_get_mVolumeConstraints_0 = a => (Rq = b._emscripten_bind_SoftBodySharedSettings_get_mVolumeConstraints_0 = d.Fo)(a),
      Sq = b._emscripten_bind_SoftBodySharedSettings_set_mVolumeConstraints_1 = (a, c) => (Sq = b._emscripten_bind_SoftBodySharedSettings_set_mVolumeConstraints_1 = d.Go)(a, c),
      Tq = b._emscripten_bind_SoftBodySharedSettings_get_mMaterials_0 = a => (Tq = b._emscripten_bind_SoftBodySharedSettings_get_mMaterials_0 =
          d.Ho)(a),
      Uq = b._emscripten_bind_SoftBodySharedSettings_set_mMaterials_1 = (a, c) => (Uq = b._emscripten_bind_SoftBodySharedSettings_set_mMaterials_1 = d.Io)(a, c),
      Vq = b._emscripten_bind_SoftBodySharedSettings___destroy___0 = a => (Vq = b._emscripten_bind_SoftBodySharedSettings___destroy___0 = d.Jo)(a),
      Wq = b._emscripten_bind_SoftBodyCreationSettings_SoftBodyCreationSettings_4 = (a, c, e, f) => (Wq = b._emscripten_bind_SoftBodyCreationSettings_SoftBodyCreationSettings_4 = d.Ko)(a, c, e, f),
      Xq = b._emscripten_bind_SoftBodyCreationSettings_get_mPosition_0 =
      a => (Xq = b._emscripten_bind_SoftBodyCreationSettings_get_mPosition_0 = d.Lo)(a),
      Yq = b._emscripten_bind_SoftBodyCreationSettings_set_mPosition_1 = (a, c) => (Yq = b._emscripten_bind_SoftBodyCreationSettings_set_mPosition_1 = d.Mo)(a, c),
      Zq = b._emscripten_bind_SoftBodyCreationSettings_get_mRotation_0 = a => (Zq = b._emscripten_bind_SoftBodyCreationSettings_get_mRotation_0 = d.No)(a),
      $q = b._emscripten_bind_SoftBodyCreationSettings_set_mRotation_1 = (a, c) => ($q = b._emscripten_bind_SoftBodyCreationSettings_set_mRotation_1 = d.Oo)(a,
          c),
      ar = b._emscripten_bind_SoftBodyCreationSettings_get_mUserData_0 = a => (ar = b._emscripten_bind_SoftBodyCreationSettings_get_mUserData_0 = d.Po)(a),
      br = b._emscripten_bind_SoftBodyCreationSettings_set_mUserData_1 = (a, c, e) => (br = b._emscripten_bind_SoftBodyCreationSettings_set_mUserData_1 = d.Qo)(a, c, e),
      cr = b._emscripten_bind_SoftBodyCreationSettings_get_mObjectLayer_0 = a => (cr = b._emscripten_bind_SoftBodyCreationSettings_get_mObjectLayer_0 = d.Ro)(a),
      dr = b._emscripten_bind_SoftBodyCreationSettings_set_mObjectLayer_1 =
      (a, c) => (dr = b._emscripten_bind_SoftBodyCreationSettings_set_mObjectLayer_1 = d.So)(a, c),
      er = b._emscripten_bind_SoftBodyCreationSettings_get_mCollisionGroup_0 = a => (er = b._emscripten_bind_SoftBodyCreationSettings_get_mCollisionGroup_0 = d.To)(a),
      fr = b._emscripten_bind_SoftBodyCreationSettings_set_mCollisionGroup_1 = (a, c) => (fr = b._emscripten_bind_SoftBodyCreationSettings_set_mCollisionGroup_1 = d.Uo)(a, c),
      gr = b._emscripten_bind_SoftBodyCreationSettings_get_mNumIterations_0 = a => (gr = b._emscripten_bind_SoftBodyCreationSettings_get_mNumIterations_0 =
          d.Vo)(a),
      hr = b._emscripten_bind_SoftBodyCreationSettings_set_mNumIterations_1 = (a, c) => (hr = b._emscripten_bind_SoftBodyCreationSettings_set_mNumIterations_1 = d.Wo)(a, c),
      ir = b._emscripten_bind_SoftBodyCreationSettings_get_mLinearDamping_0 = a => (ir = b._emscripten_bind_SoftBodyCreationSettings_get_mLinearDamping_0 = d.Xo)(a),
      jr = b._emscripten_bind_SoftBodyCreationSettings_set_mLinearDamping_1 = (a, c) => (jr = b._emscripten_bind_SoftBodyCreationSettings_set_mLinearDamping_1 = d.Yo)(a, c),
      kr = b._emscripten_bind_SoftBodyCreationSettings_get_mMaxLinearVelocity_0 =
      a => (kr = b._emscripten_bind_SoftBodyCreationSettings_get_mMaxLinearVelocity_0 = d.Zo)(a),
      lr = b._emscripten_bind_SoftBodyCreationSettings_set_mMaxLinearVelocity_1 = (a, c) => (lr = b._emscripten_bind_SoftBodyCreationSettings_set_mMaxLinearVelocity_1 = d._o)(a, c),
      mr = b._emscripten_bind_SoftBodyCreationSettings_get_mRestitution_0 = a => (mr = b._emscripten_bind_SoftBodyCreationSettings_get_mRestitution_0 = d.$o)(a),
      nr = b._emscripten_bind_SoftBodyCreationSettings_set_mRestitution_1 = (a, c) => (nr = b._emscripten_bind_SoftBodyCreationSettings_set_mRestitution_1 =
          d.ap)(a, c),
      or = b._emscripten_bind_SoftBodyCreationSettings_get_mFriction_0 = a => (or = b._emscripten_bind_SoftBodyCreationSettings_get_mFriction_0 = d.bp)(a),
      pr = b._emscripten_bind_SoftBodyCreationSettings_set_mFriction_1 = (a, c) => (pr = b._emscripten_bind_SoftBodyCreationSettings_set_mFriction_1 = d.cp)(a, c),
      qr = b._emscripten_bind_SoftBodyCreationSettings_get_mPressure_0 = a => (qr = b._emscripten_bind_SoftBodyCreationSettings_get_mPressure_0 = d.dp)(a),
      rr = b._emscripten_bind_SoftBodyCreationSettings_set_mPressure_1 = (a, c) =>
      (rr = b._emscripten_bind_SoftBodyCreationSettings_set_mPressure_1 = d.ep)(a, c),
      sr = b._emscripten_bind_SoftBodyCreationSettings_get_mGravityFactor_0 = a => (sr = b._emscripten_bind_SoftBodyCreationSettings_get_mGravityFactor_0 = d.fp)(a),
      tr = b._emscripten_bind_SoftBodyCreationSettings_set_mGravityFactor_1 = (a, c) => (tr = b._emscripten_bind_SoftBodyCreationSettings_set_mGravityFactor_1 = d.gp)(a, c),
      ur = b._emscripten_bind_SoftBodyCreationSettings_get_mUpdatePosition_0 = a => (ur = b._emscripten_bind_SoftBodyCreationSettings_get_mUpdatePosition_0 =
          d.hp)(a),
      vr = b._emscripten_bind_SoftBodyCreationSettings_set_mUpdatePosition_1 = (a, c) => (vr = b._emscripten_bind_SoftBodyCreationSettings_set_mUpdatePosition_1 = d.ip)(a, c),
      wr = b._emscripten_bind_SoftBodyCreationSettings_get_mMakeRotationIdentity_0 = a => (wr = b._emscripten_bind_SoftBodyCreationSettings_get_mMakeRotationIdentity_0 = d.jp)(a),
      xr = b._emscripten_bind_SoftBodyCreationSettings_set_mMakeRotationIdentity_1 = (a, c) => (xr = b._emscripten_bind_SoftBodyCreationSettings_set_mMakeRotationIdentity_1 = d.kp)(a, c),
      yr =
      b._emscripten_bind_SoftBodyCreationSettings___destroy___0 = a => (yr = b._emscripten_bind_SoftBodyCreationSettings___destroy___0 = d.lp)(a),
      zr = b._emscripten_bind_JoltSettings_JoltSettings_0 = () => (zr = b._emscripten_bind_JoltSettings_JoltSettings_0 = d.mp)(),
      Ar = b._emscripten_bind_JoltSettings_get_mMaxBodies_0 = a => (Ar = b._emscripten_bind_JoltSettings_get_mMaxBodies_0 = d.np)(a),
      Br = b._emscripten_bind_JoltSettings_set_mMaxBodies_1 = (a, c) => (Br = b._emscripten_bind_JoltSettings_set_mMaxBodies_1 = d.op)(a, c),
      Cr = b._emscripten_bind_JoltSettings_get_mMaxBodyPairs_0 =
      a => (Cr = b._emscripten_bind_JoltSettings_get_mMaxBodyPairs_0 = d.pp)(a),
      Dr = b._emscripten_bind_JoltSettings_set_mMaxBodyPairs_1 = (a, c) => (Dr = b._emscripten_bind_JoltSettings_set_mMaxBodyPairs_1 = d.qp)(a, c),
      Er = b._emscripten_bind_JoltSettings_get_mMaxContactConstraints_0 = a => (Er = b._emscripten_bind_JoltSettings_get_mMaxContactConstraints_0 = d.rp)(a),
      Fr = b._emscripten_bind_JoltSettings_set_mMaxContactConstraints_1 = (a, c) => (Fr = b._emscripten_bind_JoltSettings_set_mMaxContactConstraints_1 = d.sp)(a, c),
      Gr = b._emscripten_bind_JoltSettings___destroy___0 =
      a => (Gr = b._emscripten_bind_JoltSettings___destroy___0 = d.tp)(a),
      Hr = b._emscripten_bind_JoltInterface_JoltInterface_1 = a => (Hr = b._emscripten_bind_JoltInterface_JoltInterface_1 = d.up)(a),
      Ir = b._emscripten_bind_JoltInterface_Step_2 = (a, c, e) => (Ir = b._emscripten_bind_JoltInterface_Step_2 = d.vp)(a, c, e),
      Jr = b._emscripten_bind_JoltInterface_GetPhysicsSystem_0 = a => (Jr = b._emscripten_bind_JoltInterface_GetPhysicsSystem_0 = d.wp)(a),
      Kr = b._emscripten_bind_JoltInterface___destroy___0 = a => (Kr = b._emscripten_bind_JoltInterface___destroy___0 =
          d.xp)(a),
      Lr = b._emscripten_enum_Layers_MOVING = () => (Lr = b._emscripten_enum_Layers_MOVING = d.yp)(),
      Mr = b._emscripten_enum_Layers_NON_MOVING = () => (Mr = b._emscripten_enum_Layers_NON_MOVING = d.zp)(),
      Nr = b._emscripten_enum_EBodyType_RigidBody = () => (Nr = b._emscripten_enum_EBodyType_RigidBody = d.Ap)(),
      Or = b._emscripten_enum_EBodyType_SoftBody = () => (Or = b._emscripten_enum_EBodyType_SoftBody = d.Bp)(),
      Pr = b._emscripten_enum_EMotionType_Static = () => (Pr = b._emscripten_enum_EMotionType_Static = d.Cp)(),
      Qr = b._emscripten_enum_EMotionType_Kinematic =
      () => (Qr = b._emscripten_enum_EMotionType_Kinematic = d.Dp)(),
      Rr = b._emscripten_enum_EMotionType_Dynamic = () => (Rr = b._emscripten_enum_EMotionType_Dynamic = d.Ep)(),
      Sr = b._emscripten_enum_EMotionQuality_Discrete = () => (Sr = b._emscripten_enum_EMotionQuality_Discrete = d.Fp)(),
      Tr = b._emscripten_enum_EMotionQuality_LinearCast = () => (Tr = b._emscripten_enum_EMotionQuality_LinearCast = d.Gp)(),
      Ur = b._emscripten_enum_EActivation_Activate = () => (Ur = b._emscripten_enum_EActivation_Activate = d.Hp)(),
      Vr = b._emscripten_enum_EActivation_DontActivate =
      () => (Vr = b._emscripten_enum_EActivation_DontActivate = d.Ip)(),
      Wr = b._emscripten_enum_EShapeType_Convex = () => (Wr = b._emscripten_enum_EShapeType_Convex = d.Jp)(),
      Xr = b._emscripten_enum_EShapeType_Compound = () => (Xr = b._emscripten_enum_EShapeType_Compound = d.Kp)(),
      Yr = b._emscripten_enum_EShapeType_Decorated = () => (Yr = b._emscripten_enum_EShapeType_Decorated = d.Lp)(),
      Zr = b._emscripten_enum_EShapeType_Mesh = () => (Zr = b._emscripten_enum_EShapeType_Mesh = d.Mp)(),
      $r = b._emscripten_enum_EShapeType_HeightField = () => ($r = b._emscripten_enum_EShapeType_HeightField =
          d.Np)(),
      as = b._emscripten_enum_EShapeSubType_Sphere = () => (as = b._emscripten_enum_EShapeSubType_Sphere = d.Op)(),
      bs = b._emscripten_enum_EShapeSubType_Box = () => (bs = b._emscripten_enum_EShapeSubType_Box = d.Pp)(),
      cs = b._emscripten_enum_EShapeSubType_Capsule = () => (cs = b._emscripten_enum_EShapeSubType_Capsule = d.Qp)(),
      ds = b._emscripten_enum_EShapeSubType_TaperedCapsule = () => (ds = b._emscripten_enum_EShapeSubType_TaperedCapsule = d.Rp)(),
      es = b._emscripten_enum_EShapeSubType_Cylinder = () => (es = b._emscripten_enum_EShapeSubType_Cylinder =
          d.Sp)(),
      gs = b._emscripten_enum_EShapeSubType_ConvexHull = () => (gs = b._emscripten_enum_EShapeSubType_ConvexHull = d.Tp)(),
      hs = b._emscripten_enum_EShapeSubType_StaticCompound = () => (hs = b._emscripten_enum_EShapeSubType_StaticCompound = d.Up)(),
      is = b._emscripten_enum_EShapeSubType_MutableCompound = () => (is = b._emscripten_enum_EShapeSubType_MutableCompound = d.Vp)(),
      js = b._emscripten_enum_EShapeSubType_RotatedTranslated = () => (js = b._emscripten_enum_EShapeSubType_RotatedTranslated = d.Wp)(),
      ks = b._emscripten_enum_EShapeSubType_Scaled =
      () => (ks = b._emscripten_enum_EShapeSubType_Scaled = d.Xp)(),
      ls = b._emscripten_enum_EShapeSubType_OffsetCenterOfMass = () => (ls = b._emscripten_enum_EShapeSubType_OffsetCenterOfMass = d.Yp)(),
      ms = b._emscripten_enum_EShapeSubType_Mesh = () => (ms = b._emscripten_enum_EShapeSubType_Mesh = d.Zp)(),
      ns = b._emscripten_enum_EShapeSubType_HeightField = () => (ns = b._emscripten_enum_EShapeSubType_HeightField = d._p)(),
      ps = b._emscripten_enum_EConstraintSpace_LocalToBodyCOM = () => (ps = b._emscripten_enum_EConstraintSpace_LocalToBodyCOM = d.$p)(),
      qs = b._emscripten_enum_EConstraintSpace_WorldSpace = () => (qs = b._emscripten_enum_EConstraintSpace_WorldSpace = d.aq)(),
      rs = b._emscripten_enum_ESpringMode_FrequencyAndDamping = () => (rs = b._emscripten_enum_ESpringMode_FrequencyAndDamping = d.bq)(),
      ss = b._emscripten_enum_ESpringMode_StiffnessAndDamping = () => (ss = b._emscripten_enum_ESpringMode_StiffnessAndDamping = d.cq)(),
      ts = b._emscripten_enum_EOverrideMassProperties_CalculateMassAndInertia = () => (ts = b._emscripten_enum_EOverrideMassProperties_CalculateMassAndInertia = d.dq)(),
      us = b._emscripten_enum_EOverrideMassProperties_CalculateInertia = () => (us = b._emscripten_enum_EOverrideMassProperties_CalculateInertia = d.eq)(),
      vs = b._emscripten_enum_EOverrideMassProperties_MassAndInertiaProvided = () => (vs = b._emscripten_enum_EOverrideMassProperties_MassAndInertiaProvided = d.fq)();
  b.___start_em_js = 44794;
  b.___stop_em_js = 44892;
  var xs;
  Ea = function ys() {
      xs || zs();
      xs || (Ea = ys)
  };

  function zs() {
      function a() {
          if (!xs && (xs = !0, b.calledRun = !0, !sa)) {
              Aa = !0;
              Na(ya);
              aa(b);
              if (b.onRuntimeInitialized) b.onRuntimeInitialized();
              if (b.postRun)
                  for ("function" == typeof b.postRun && (b.postRun = [b.postRun]); b.postRun.length;) {
                      var c = b.postRun.shift();
                      za.unshift(c)
                  }
              Na(za)
          }
      }
      if (!(0 < Ca)) {
          if (b.preRun)
              for ("function" == typeof b.preRun && (b.preRun = [b.preRun]); b.preRun.length;) Ba();
          Na(xa);
          0 < Ca || (b.setStatus ? (b.setStatus("Running..."), setTimeout(function() {
              setTimeout(function() {
                  b.setStatus("")
              }, 1);
              a()
          }, 1)) : a())
      }
  }
  if (b.preInit)
      for ("function" == typeof b.preInit && (b.preInit = [b.preInit]); 0 < b.preInit.length;) b.preInit.pop()();
  zs();

  function g() {}
  g.prototype = Object.create(g.prototype);
  g.prototype.constructor = g;
  g.prototype.hq = g;
  g.iq = {};
  b.WrapperObject = g;

  function h(a) {
      return (a || g).iq
  }
  b.getCache = h;

  function l(a, c) {
      var e = h(c),
          f = e[a];
      if (f) return f;
      f = Object.create((c || g).prototype);
      f.gq = a;
      return e[a] = f
  }
  b.wrapPointer = l;
  b.castObject = function(a, c) {
      return l(a.gq, c)
  };
  b.NULL = l(0);
  b.destroy = function(a) {
      if (!a.__destroy__) throw "Error: Cannot destroy object. (Did you create it yourself?)";
      a.__destroy__();
      delete h(a.hq)[a.gq]
  };
  b.compare = function(a, c) {
      return a.gq === c.gq
  };
  b.getPointer = function(a) {
      return a.gq
  };
  b.getClass = function(a) {
      return a.hq
  };
  var As = 0,
      Bs = 0,
      Cs = [],
      Ds = 0;

  function Es() {
      if (Ds) {
          for (var a = 0; a < Cs.length; a++) b._free(Cs[a]);
          Cs.length = 0;
          b._free(As);
          As = 0;
          Bs += Ds;
          Ds = 0
      }
      As || (Bs += 128, (As = b._malloc(Bs)) || qa())
  }

  function Fs() {
      throw "cannot construct a ShapeSettings, no constructor in IDL";
  }
  Fs.prototype = Object.create(g.prototype);
  Fs.prototype.constructor = Fs;
  Fs.prototype.hq = Fs;
  Fs.iq = {};
  b.ShapeSettings = Fs;
  Fs.prototype.Create = function() {
      return l(gb(this.gq), m)
  };
  Fs.prototype.get_mUserData = Fs.prototype.jq = function() {
      return hb(this.gq)
  };
  Fs.prototype.set_mUserData = Fs.prototype.kq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      ib(c, a)
  };
  Object.defineProperty(Fs.prototype, "mUserData", {
      get: Fs.prototype.jq,
      set: Fs.prototype.kq
  });
  Fs.prototype.__destroy__ = function() {
      jb(this.gq)
  };

  function n() {
      throw "cannot construct a Shape, no constructor in IDL";
  }
  n.prototype = Object.create(g.prototype);
  n.prototype.constructor = n;
  n.prototype.hq = n;
  n.iq = {};
  b.Shape = n;
  n.prototype.GetType = function() {
      return kb(this.gq)
  };
  n.prototype.GetSubType = function() {
      return lb(this.gq)
  };
  n.prototype.MustBeStatic = function() {
      return !!mb(this.gq)
  };
  n.prototype.GetLocalBounds = function() {
      return l(nb(this.gq), p)
  };
  n.prototype.GetWorldSpaceBounds = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      return l(ob(e, a, c), p)
  };
  n.prototype.GetCenterOfMass = function() {
      return l(pb(this.gq), q)
  };
  n.prototype.GetUserData = function() {
      return qb(this.gq)
  };
  n.prototype.SetUserData = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      rb(c, a)
  };
  n.prototype.__destroy__ = function() {
      sb(this.gq)
  };

  function r() {
      throw "cannot construct a ConstraintSettings, no constructor in IDL";
  }
  r.prototype = Object.create(g.prototype);
  r.prototype.constructor = r;
  r.prototype.hq = r;
  r.iq = {};
  b.ConstraintSettings = r;
  r.prototype.get_mEnabled = r.prototype.lq = function() {
      return !!tb(this.gq)
  };
  r.prototype.set_mEnabled = r.prototype.oq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      ub(c, a)
  };
  Object.defineProperty(r.prototype, "mEnabled", {
      get: r.prototype.lq,
      set: r.prototype.oq
  });
  r.prototype.get_mNumVelocityStepsOverride = r.prototype.nq = function() {
      return vb(this.gq)
  };
  r.prototype.set_mNumVelocityStepsOverride = r.prototype.qq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      wb(c, a)
  };
  Object.defineProperty(r.prototype, "mNumVelocityStepsOverride", {
      get: r.prototype.nq,
      set: r.prototype.qq
  });
  r.prototype.get_mNumPositionStepsOverride = r.prototype.mq = function() {
      return xb(this.gq)
  };
  r.prototype.set_mNumPositionStepsOverride = r.prototype.pq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      yb(c, a)
  };
  Object.defineProperty(r.prototype, "mNumPositionStepsOverride", {
      get: r.prototype.mq,
      set: r.prototype.pq
  });
  r.prototype.__destroy__ = function() {
      zb(this.gq)
  };

  function u() {
      throw "cannot construct a ConvexShapeSettings, no constructor in IDL";
  }
  u.prototype = Object.create(Fs.prototype);
  u.prototype.constructor = u;
  u.prototype.hq = u;
  u.iq = {};
  b.ConvexShapeSettings = u;
  u.prototype.Create = function() {
      return l(Ab(this.gq), m)
  };
  u.prototype.get_mMaterial = u.prototype.sq = function() {
      return l(Bb(this.gq), Gs)
  };
  u.prototype.set_mMaterial = u.prototype.vq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Cb(c, a)
  };
  Object.defineProperty(u.prototype, "mMaterial", {
      get: u.prototype.sq,
      set: u.prototype.vq
  });
  u.prototype.get_mDensity = u.prototype.rq = function() {
      return Db(this.gq)
  };
  u.prototype.set_mDensity = u.prototype.uq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Eb(c, a)
  };
  Object.defineProperty(u.prototype, "mDensity", {
      get: u.prototype.rq,
      set: u.prototype.uq
  });
  u.prototype.get_mUserData = u.prototype.jq = function() {
      return Fb(this.gq)
  };
  u.prototype.set_mUserData = u.prototype.kq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Gb(c, a)
  };
  Object.defineProperty(u.prototype, "mUserData", {
      get: u.prototype.jq,
      set: u.prototype.kq
  });
  u.prototype.__destroy__ = function() {
      Hb(this.gq)
  };

  function v() {
      throw "cannot construct a ConvexShape, no constructor in IDL";
  }
  v.prototype = Object.create(n.prototype);
  v.prototype.constructor = v;
  v.prototype.hq = v;
  v.iq = {};
  b.ConvexShape = v;
  v.prototype.GetDensity = function() {
      return Ib(this.gq)
  };
  v.prototype.SetDensity = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Jb(c, a)
  };
  v.prototype.GetType = function() {
      return Kb(this.gq)
  };
  v.prototype.GetSubType = function() {
      return Lb(this.gq)
  };
  v.prototype.MustBeStatic = function() {
      return !!Mb(this.gq)
  };
  v.prototype.GetLocalBounds = function() {
      return l(Nb(this.gq), p)
  };
  v.prototype.GetWorldSpaceBounds = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      return l(Ob(e, a, c), p)
  };
  v.prototype.GetCenterOfMass = function() {
      return l(Sb(this.gq), q)
  };
  v.prototype.GetUserData = function() {
      return Tb(this.gq)
  };
  v.prototype.SetUserData = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Ub(c, a)
  };
  v.prototype.__destroy__ = function() {
      Vb(this.gq)
  };

  function Hs() {
      throw "cannot construct a Constraint, no constructor in IDL";
  }
  Hs.prototype = Object.create(g.prototype);
  Hs.prototype.constructor = Hs;
  Hs.prototype.hq = Hs;
  Hs.iq = {};
  b.Constraint = Hs;
  Hs.prototype.SetEnabled = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Wb(c, a)
  };
  Hs.prototype.GetEnabled = function() {
      return !!Xb(this.gq)
  };
  Hs.prototype.__destroy__ = function() {
      Yb(this.gq)
  };

  function w() {
      throw "cannot construct a TwoBodyConstraintSettings, no constructor in IDL";
  }
  w.prototype = Object.create(r.prototype);
  w.prototype.constructor = w;
  w.prototype.hq = w;
  w.iq = {};
  b.TwoBodyConstraintSettings = w;
  w.prototype.Create = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      return l(Zb(e, a, c), Hs)
  };
  w.prototype.get_mEnabled = w.prototype.lq = function() {
      return !!$b(this.gq)
  };
  w.prototype.set_mEnabled = w.prototype.oq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      ac(c, a)
  };
  Object.defineProperty(w.prototype, "mEnabled", {
      get: w.prototype.lq,
      set: w.prototype.oq
  });
  w.prototype.get_mNumVelocityStepsOverride = w.prototype.nq = function() {
      return bc(this.gq)
  };
  w.prototype.set_mNumVelocityStepsOverride = w.prototype.qq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      cc(c, a)
  };
  Object.defineProperty(w.prototype, "mNumVelocityStepsOverride", {
      get: w.prototype.nq,
      set: w.prototype.qq
  });
  w.prototype.get_mNumPositionStepsOverride = w.prototype.mq = function() {
      return dc(this.gq)
  };
  w.prototype.set_mNumPositionStepsOverride = w.prototype.pq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      ec(c, a)
  };
  Object.defineProperty(w.prototype, "mNumPositionStepsOverride", {
      get: w.prototype.mq,
      set: w.prototype.pq
  });
  w.prototype.__destroy__ = function() {
      fc(this.gq)
  };

  function Is() {
      throw "cannot construct a GroupFilter, no constructor in IDL";
  }
  Is.prototype = Object.create(g.prototype);
  Is.prototype.constructor = Is;
  Is.prototype.hq = Is;
  Is.iq = {};
  b.GroupFilter = Is;
  Is.prototype.__destroy__ = function() {
      gc(this.gq)
  };

  function Js() {
      throw "cannot construct a VoidPtr, no constructor in IDL";
  }
  Js.prototype = Object.create(g.prototype);
  Js.prototype.constructor = Js;
  Js.prototype.hq = Js;
  Js.iq = {};
  b.VoidPtr = Js;
  Js.prototype.__destroy__ = function() {
      hc(this.gq)
  };

  function Ks() {
      throw "cannot construct a JPHString, no constructor in IDL";
  }
  Ks.prototype = Object.create(g.prototype);
  Ks.prototype.constructor = Ks;
  Ks.prototype.hq = Ks;
  Ks.iq = {};
  b.JPHString = Ks;
  Ks.prototype.c_str = function() {
      var a = ic(this.gq);
      return a ? Wa(ua, a) : ""
  };
  Ks.prototype.size = Ks.prototype.size = function() {
      return jc(this.gq)
  };
  Ks.prototype.__destroy__ = function() {
      kc(this.gq)
  };

  function Ls() {
      throw "cannot construct a ArrayVec3, no constructor in IDL";
  }
  Ls.prototype = Object.create(g.prototype);
  Ls.prototype.constructor = Ls;
  Ls.prototype.hq = Ls;
  Ls.iq = {};
  b.ArrayVec3 = Ls;
  Ls.prototype.size = Ls.prototype.size = function() {
      return lc(this.gq)
  };
  Ls.prototype.at = Ls.prototype.at = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      return l(mc(c, a), q)
  };
  Ls.prototype.push_back = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      nc(c, a)
  };
  Ls.prototype.reserve = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      oc(c, a)
  };
  Ls.prototype.resize = Ls.prototype.resize = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      pc(c, a)
  };
  Ls.prototype.__destroy__ = function() {
      qc(this.gq)
  };

  function q(a, c, e) {
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      this.gq = void 0 === a ? rc() : void 0 === c ? _emscripten_bind_Vec3_Vec3_1(a) : void 0 === e ? _emscripten_bind_Vec3_Vec3_2(a, c) : sc(a, c, e);
      h(q)[this.gq] = this
  }
  q.prototype = Object.create(g.prototype);
  q.prototype.constructor = q;
  q.prototype.hq = q;
  q.iq = {};
  b.Vec3 = q;
  q.prototype.sZero = function() {
      return l(tc(this.gq), q)
  };
  q.prototype.sAxisX = function() {
      return l(uc(this.gq), q)
  };
  q.prototype.sAxisY = function() {
      return l(vc(this.gq), q)
  };
  q.prototype.sAxisZ = function() {
      return l(wc(this.gq), q)
  };
  q.prototype.GetComponent = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      return xc(c, a)
  };
  q.prototype.Length = function() {
      return yc(this.gq)
  };
  q.prototype.Normalized = function() {
      return l(zc(this.gq), q)
  };
  q.prototype.GetNormalizedPerpendicular = function() {
      return l(Ac(this.gq), q)
  };
  q.prototype.GetX = function() {
      return Bc(this.gq)
  };
  q.prototype.GetY = function() {
      return Cc(this.gq)
  };
  q.prototype.GetZ = function() {
      return Dc(this.gq)
  };
  q.prototype.SetX = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Ec(c, a)
  };
  q.prototype.SetY = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Fc(c, a)
  };
  q.prototype.SetZ = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Gc(c, a)
  };
  q.prototype.SetComponent = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      Hc(e, a, c)
  };
  q.prototype.__destroy__ = function() {
      Ic(this.gq)
  };

  function x(a, c, e, f) {
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      f && "object" === typeof f && (f = f.gq);
      this.gq = void 0 === a ? Jc() : void 0 === c ? _emscripten_bind_Quat_Quat_1(a) : void 0 === e ? _emscripten_bind_Quat_Quat_2(a, c) : void 0 === f ? _emscripten_bind_Quat_Quat_3(a, c, e) : Kc(a, c, e, f);
      h(x)[this.gq] = this
  }
  x.prototype = Object.create(g.prototype);
  x.prototype.constructor = x;
  x.prototype.hq = x;
  x.iq = {};
  b.Quat = x;
  x.prototype.sIdentity = function() {
      return l(Lc(this.gq), x)
  };
  x.prototype.sRotation = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      return l(Mc(e, a, c), x)
  };
  x.prototype.Length = function() {
      return Nc(this.gq)
  };
  x.prototype.Normalized = function() {
      return l(Oc(this.gq), x)
  };
  x.prototype.GetX = function() {
      return Pc(this.gq)
  };
  x.prototype.GetY = function() {
      return Qc(this.gq)
  };
  x.prototype.GetZ = function() {
      return Rc(this.gq)
  };
  x.prototype.GetW = function() {
      return Sc(this.gq)
  };
  x.prototype.__destroy__ = function() {
      Tc(this.gq)
  };

  function y(a, c, e) {
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      this.gq = Uc(a, c, e);
      h(y)[this.gq] = this
  }
  y.prototype = Object.create(g.prototype);
  y.prototype.constructor = y;
  y.prototype.hq = y;
  y.iq = {};
  b.Float3 = y;
  y.prototype.get_x = y.prototype.Ws = function() {
      return Vc(this.gq)
  };
  y.prototype.set_x = y.prototype.vu = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Wc(c, a)
  };
  Object.defineProperty(y.prototype, "x", {
      get: y.prototype.Ws,
      set: y.prototype.vu
  });
  y.prototype.get_y = y.prototype.Xs = function() {
      return Xc(this.gq)
  };
  y.prototype.set_y = y.prototype.wu = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Yc(c, a)
  };
  Object.defineProperty(y.prototype, "y", {
      get: y.prototype.Xs,
      set: y.prototype.wu
  });
  y.prototype.get_z = y.prototype.Ys = function() {
      return Zc(this.gq)
  };
  y.prototype.set_z = y.prototype.xu = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      $c(c, a)
  };
  Object.defineProperty(y.prototype, "z", {
      get: y.prototype.Ys,
      set: y.prototype.xu
  });
  y.prototype.__destroy__ = function() {
      ad(this.gq)
  };

  function Ms() {
      throw "cannot construct a Mat44, no constructor in IDL";
  }
  Ms.prototype = Object.create(g.prototype);
  Ms.prototype.constructor = Ms;
  Ms.prototype.hq = Ms;
  Ms.iq = {};
  b.Mat44 = Ms;
  Ms.prototype.sIdentity = function() {
      return l(bd(this.gq), Ms)
  };
  Ms.prototype.sRotationTranslation = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      return l(cd(e, a, c), Ms)
  };
  Ms.prototype.GetAxisX = function() {
      return l(dd(this.gq), q)
  };
  Ms.prototype.GetAxisY = function() {
      return l(ed(this.gq), q)
  };
  Ms.prototype.GetAxisZ = function() {
      return l(fd(this.gq), q)
  };
  Ms.prototype.GetRotation = function() {
      return l(gd(this.gq), Ms)
  };
  Ms.prototype.GetQuaternion = function() {
      return l(hd(this.gq), x)
  };
  Ms.prototype.GetTranslation = function() {
      return l(jd(this.gq), q)
  };
  Ms.prototype.__destroy__ = function() {
      kd(this.gq)
  };

  function p(a, c) {
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      this.gq = ld(a, c);
      h(p)[this.gq] = this
  }
  p.prototype = Object.create(g.prototype);
  p.prototype.constructor = p;
  p.prototype.hq = p;
  p.iq = {};
  b.AABox = p;
  p.prototype.sBiggest = function() {
      return l(md(this.gq), p)
  };
  p.prototype.get_mMin = p.prototype.rs = function() {
      return l(nd(this.gq), q)
  };
  p.prototype.set_mMin = p.prototype.St = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      od(c, a)
  };
  Object.defineProperty(p.prototype, "mMin", {
      get: p.prototype.rs,
      set: p.prototype.St
  });
  p.prototype.get_mMax = p.prototype.gs = function() {
      return l(pd(this.gq), q)
  };
  p.prototype.set_mMax = p.prototype.Jt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      qd(c, a)
  };
  Object.defineProperty(p.prototype, "mMax", {
      get: p.prototype.gs,
      set: p.prototype.Jt
  });
  p.prototype.__destroy__ = function() {
      rd(this.gq)
  };

  function Gs() {
      this.gq = sd();
      h(Gs)[this.gq] = this
  }
  Gs.prototype = Object.create(g.prototype);
  Gs.prototype.constructor = Gs;
  Gs.prototype.hq = Gs;
  Gs.iq = {};
  b.PhysicsMaterial = Gs;
  Gs.prototype.__destroy__ = function() {
      td(this.gq)
  };

  function Ns() {
      this.gq = ud();
      h(Ns)[this.gq] = this
  }
  Ns.prototype = Object.create(g.prototype);
  Ns.prototype.constructor = Ns;
  Ns.prototype.hq = Ns;
  Ns.iq = {};
  b.PhysicsMaterialList = Ns;
  Ns.prototype.at = Ns.prototype.at = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      return l(vd(c, a), Gs)
  };
  Ns.prototype.push_back = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      wd(c, a)
  };
  Ns.prototype.reserve = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      xd(c, a)
  };
  Ns.prototype.resize = Ns.prototype.resize = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      yd(c, a)
  };
  Ns.prototype.__destroy__ = function() {
      zd(this.gq)
  };

  function z(a, c, e) {
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      this.gq = void 0 === a ? Ad() : void 0 === c ? _emscripten_bind_Triangle_Triangle_1(a) : void 0 === e ? _emscripten_bind_Triangle_Triangle_2(a, c) : Bd(a, c, e);
      h(z)[this.gq] = this
  }
  z.prototype = Object.create(g.prototype);
  z.prototype.constructor = z;
  z.prototype.hq = z;
  z.iq = {};
  b.Triangle = z;
  z.prototype.get_mV = z.prototype.Ss = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      return l(Cd(c, a), y)
  };
  z.prototype.set_mV = z.prototype.ru = function(a, c) {
      var e = this.gq;
      Es();
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      Dd(e, a, c)
  };
  Object.defineProperty(z.prototype, "mV", {
      get: z.prototype.Ss,
      set: z.prototype.ru
  });
  z.prototype.get_mMaterialIndex = z.prototype.Gq = function() {
      return Ed(this.gq)
  };
  z.prototype.set_mMaterialIndex = z.prototype.Kq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Fd(c, a)
  };
  Object.defineProperty(z.prototype, "mMaterialIndex", {
      get: z.prototype.Gq,
      set: z.prototype.Kq
  });
  z.prototype.__destroy__ = function() {
      Gd(this.gq)
  };

  function Os() {
      this.gq = Hd();
      h(Os)[this.gq] = this
  }
  Os.prototype = Object.create(g.prototype);
  Os.prototype.constructor = Os;
  Os.prototype.hq = Os;
  Os.iq = {};
  b.TriangleList = Os;
  Os.prototype.at = Os.prototype.at = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      return l(Id(c, a), z)
  };
  Os.prototype.push_back = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Jd(c, a)
  };
  Os.prototype.reserve = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Kd(c, a)
  };
  Os.prototype.resize = Os.prototype.resize = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Ld(c, a)
  };
  Os.prototype.__destroy__ = function() {
      Md(this.gq)
  };

  function Ps() {
      this.gq = Nd();
      h(Ps)[this.gq] = this
  }
  Ps.prototype = Object.create(g.prototype);
  Ps.prototype.constructor = Ps;
  Ps.prototype.hq = Ps;
  Ps.iq = {};
  b.VertexList = Ps;
  Ps.prototype.at = Ps.prototype.at = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      return l(Od(c, a), y)
  };
  Ps.prototype.push_back = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Pd(c, a)
  };
  Ps.prototype.reserve = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Qd(c, a)
  };
  Ps.prototype.resize = Ps.prototype.resize = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Rd(c, a)
  };
  Ps.prototype.__destroy__ = function() {
      Sd(this.gq)
  };

  function Qs(a, c, e, f) {
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      f && "object" === typeof f && (f = f.gq);
      this.gq = void 0 === a ? Td() : void 0 === c ? _emscripten_bind_IndexedTriangle_IndexedTriangle_1(a) : void 0 === e ? _emscripten_bind_IndexedTriangle_IndexedTriangle_2(a, c) : void 0 === f ? _emscripten_bind_IndexedTriangle_IndexedTriangle_3(a, c, e) : Ud(a, c, e, f);
      h(Qs)[this.gq] = this
  }
  Qs.prototype = Object.create(g.prototype);
  Qs.prototype.constructor = Qs;
  Qs.prototype.hq = Qs;
  Qs.iq = {};
  b.IndexedTriangle = Qs;
  Qs.prototype.get_mIdx = Qs.prototype.Ur = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      return Vd(c, a)
  };
  Qs.prototype.set_mIdx = Qs.prototype.yt = function(a, c) {
      var e = this.gq;
      Es();
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      Wd(e, a, c)
  };
  Object.defineProperty(Qs.prototype, "mIdx", {
      get: Qs.prototype.Ur,
      set: Qs.prototype.yt
  });
  Qs.prototype.get_mMaterialIndex = Qs.prototype.Gq = function() {
      return Xd(this.gq)
  };
  Qs.prototype.set_mMaterialIndex = Qs.prototype.Kq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Yd(c, a)
  };
  Object.defineProperty(Qs.prototype, "mMaterialIndex", {
      get: Qs.prototype.Gq,
      set: Qs.prototype.Kq
  });
  Qs.prototype.__destroy__ = function() {
      Zd(this.gq)
  };

  function Rs() {
      this.gq = $d();
      h(Rs)[this.gq] = this
  }
  Rs.prototype = Object.create(g.prototype);
  Rs.prototype.constructor = Rs;
  Rs.prototype.hq = Rs;
  Rs.iq = {};
  b.IndexedTriangleList = Rs;
  Rs.prototype.at = Rs.prototype.at = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      return l(ae(c, a), Qs)
  };
  Rs.prototype.push_back = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      be(c, a)
  };
  Rs.prototype.reserve = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      ce(c, a)
  };
  Rs.prototype.resize = Rs.prototype.resize = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      de(c, a)
  };
  Rs.prototype.__destroy__ = function() {
      ee(this.gq)
  };

  function m() {
      throw "cannot construct a ShapeResult, no constructor in IDL";
  }
  m.prototype = Object.create(g.prototype);
  m.prototype.constructor = m;
  m.prototype.hq = m;
  m.iq = {};
  b.ShapeResult = m;
  m.prototype.IsValid = function() {
      return !!fe(this.gq)
  };
  m.prototype.HasError = function() {
      return !!ge(this.gq)
  };
  m.prototype.GetError = function() {
      return l(he(this.gq), Ks)
  };
  m.prototype.Get = function() {
      return l(ie(this.gq), n)
  };
  m.prototype.__destroy__ = function() {
      je(this.gq)
  };

  function Ss(a, c, e, f, t) {
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      f && "object" === typeof f && (f = f.gq);
      t && "object" === typeof t && (t = t.gq);
      this.gq = ke(a, c, e, f, t);
      h(Ss)[this.gq] = this
  }
  Ss.prototype = Object.create(g.prototype);
  Ss.prototype.constructor = Ss;
  Ss.prototype.hq = Ss;
  Ss.iq = {};
  b.ShapeGetTriangles = Ss;
  Ss.prototype.GetNumTriangles = function() {
      return le(this.gq)
  };
  Ss.prototype.GetVerticesSize = function() {
      return me(this.gq)
  };
  Ss.prototype.GetVerticesData = function() {
      return ne(this.gq)
  };
  Ss.prototype.GetMaterial = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      return l(oe(c, a), Gs)
  };
  Ss.prototype.__destroy__ = function() {
      pe(this.gq)
  };

  function A(a, c) {
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      this.gq = qe(a, c);
      h(A)[this.gq] = this
  }
  A.prototype = Object.create(u.prototype);
  A.prototype.constructor = A;
  A.prototype.hq = A;
  A.iq = {};
  b.SphereShapeSettings = A;
  A.prototype.Create = function() {
      return l(re(this.gq), m)
  };
  A.prototype.get_mRadius = A.prototype.Hq = function() {
      return se(this.gq)
  };
  A.prototype.set_mRadius = A.prototype.Lq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      te(c, a)
  };
  Object.defineProperty(A.prototype, "mRadius", {
      get: A.prototype.Hq,
      set: A.prototype.Lq
  });
  A.prototype.get_mMaterial = A.prototype.sq = function() {
      return l(ue(this.gq), Gs)
  };
  A.prototype.set_mMaterial = A.prototype.vq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      ve(c, a)
  };
  Object.defineProperty(A.prototype, "mMaterial", {
      get: A.prototype.sq,
      set: A.prototype.vq
  });
  A.prototype.get_mDensity = A.prototype.rq = function() {
      return we(this.gq)
  };
  A.prototype.set_mDensity = A.prototype.uq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      xe(c, a)
  };
  Object.defineProperty(A.prototype, "mDensity", {
      get: A.prototype.rq,
      set: A.prototype.uq
  });
  A.prototype.get_mUserData = A.prototype.jq = function() {
      return ye(this.gq)
  };
  A.prototype.set_mUserData = A.prototype.kq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      ze(c, a)
  };
  Object.defineProperty(A.prototype, "mUserData", {
      get: A.prototype.jq,
      set: A.prototype.kq
  });
  A.prototype.__destroy__ = function() {
      Ae(this.gq)
  };

  function Ts(a, c) {
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      this.gq = Be(a, c);
      h(Ts)[this.gq] = this
  }
  Ts.prototype = Object.create(v.prototype);
  Ts.prototype.constructor = Ts;
  Ts.prototype.hq = Ts;
  Ts.iq = {};
  b.SphereShape = Ts;
  Ts.prototype.GetDensity = function() {
      return Ce(this.gq)
  };
  Ts.prototype.SetDensity = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      De(c, a)
  };
  Ts.prototype.GetType = function() {
      return Ee(this.gq)
  };
  Ts.prototype.GetSubType = function() {
      return Fe(this.gq)
  };
  Ts.prototype.MustBeStatic = function() {
      return !!Ge(this.gq)
  };
  Ts.prototype.GetLocalBounds = function() {
      return l(He(this.gq), p)
  };
  Ts.prototype.GetWorldSpaceBounds = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      return l(Ie(e, a, c), p)
  };
  Ts.prototype.GetCenterOfMass = function() {
      return l(Je(this.gq), q)
  };
  Ts.prototype.GetUserData = function() {
      return Ke(this.gq)
  };
  Ts.prototype.SetUserData = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Le(c, a)
  };
  Ts.prototype.__destroy__ = function() {
      Me(this.gq)
  };

  function B(a, c, e) {
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      this.gq = Ne(a, c, e);
      h(B)[this.gq] = this
  }
  B.prototype = Object.create(u.prototype);
  B.prototype.constructor = B;
  B.prototype.hq = B;
  B.iq = {};
  b.BoxShapeSettings = B;
  B.prototype.Create = function() {
      return l(Oe(this.gq), m)
  };
  B.prototype.get_mHalfExtent = B.prototype.Nr = function() {
      return l(Pe(this.gq), q)
  };
  B.prototype.set_mHalfExtent = B.prototype.rt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Qe(c, a)
  };
  Object.defineProperty(B.prototype, "mHalfExtent", {
      get: B.prototype.Nr,
      set: B.prototype.rt
  });
  B.prototype.get_mConvexRadius = B.prototype.Tq = function() {
      return Re(this.gq)
  };
  B.prototype.set_mConvexRadius = B.prototype.jr = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Se(c, a)
  };
  Object.defineProperty(B.prototype, "mConvexRadius", {
      get: B.prototype.Tq,
      set: B.prototype.jr
  });
  B.prototype.get_mMaterial = B.prototype.sq = function() {
      return l(Te(this.gq), Gs)
  };
  B.prototype.set_mMaterial = B.prototype.vq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Ue(c, a)
  };
  Object.defineProperty(B.prototype, "mMaterial", {
      get: B.prototype.sq,
      set: B.prototype.vq
  });
  B.prototype.get_mDensity = B.prototype.rq = function() {
      return Ve(this.gq)
  };
  B.prototype.set_mDensity = B.prototype.uq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      We(c, a)
  };
  Object.defineProperty(B.prototype, "mDensity", {
      get: B.prototype.rq,
      set: B.prototype.uq
  });
  B.prototype.get_mUserData = B.prototype.jq = function() {
      return Xe(this.gq)
  };
  B.prototype.set_mUserData = B.prototype.kq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Ye(c, a)
  };
  Object.defineProperty(B.prototype, "mUserData", {
      get: B.prototype.jq,
      set: B.prototype.kq
  });
  B.prototype.__destroy__ = function() {
      Ze(this.gq)
  };

  function Us(a, c, e) {
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      this.gq = $e(a, c, e);
      h(Us)[this.gq] = this
  }
  Us.prototype = Object.create(v.prototype);
  Us.prototype.constructor = Us;
  Us.prototype.hq = Us;
  Us.iq = {};
  b.BoxShape = Us;
  Us.prototype.GetDensity = function() {
      return af(this.gq)
  };
  Us.prototype.SetDensity = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      bf(c, a)
  };
  Us.prototype.GetType = function() {
      return cf(this.gq)
  };
  Us.prototype.GetSubType = function() {
      return df(this.gq)
  };
  Us.prototype.MustBeStatic = function() {
      return !!ef(this.gq)
  };
  Us.prototype.GetLocalBounds = function() {
      return l(ff(this.gq), p)
  };
  Us.prototype.GetWorldSpaceBounds = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      return l(gf(e, a, c), p)
  };
  Us.prototype.GetCenterOfMass = function() {
      return l(hf(this.gq), q)
  };
  Us.prototype.GetUserData = function() {
      return jf(this.gq)
  };
  Us.prototype.SetUserData = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      kf(c, a)
  };
  Us.prototype.__destroy__ = function() {
      lf(this.gq)
  };

  function C(a, c, e, f) {
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      f && "object" === typeof f && (f = f.gq);
      this.gq = mf(a, c, e, f);
      h(C)[this.gq] = this
  }
  C.prototype = Object.create(u.prototype);
  C.prototype.constructor = C;
  C.prototype.hq = C;
  C.iq = {};
  b.CylinderShapeSettings = C;
  C.prototype.Create = function() {
      return l(nf(this.gq), m)
  };
  C.prototype.get_mHalfHeight = C.prototype.Or = function() {
      return of(this.gq)
  };
  C.prototype.set_mHalfHeight = C.prototype.st = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      pf(c, a)
  };
  Object.defineProperty(C.prototype, "mHalfHeight", {
      get: C.prototype.Or,
      set: C.prototype.st
  });
  C.prototype.get_mRadius = C.prototype.Hq = function() {
      return qf(this.gq)
  };
  C.prototype.set_mRadius = C.prototype.Lq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      rf(c, a)
  };
  Object.defineProperty(C.prototype, "mRadius", {
      get: C.prototype.Hq,
      set: C.prototype.Lq
  });
  C.prototype.get_mConvexRadius = C.prototype.Tq = function() {
      return sf(this.gq)
  };
  C.prototype.set_mConvexRadius = C.prototype.jr = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      tf(c, a)
  };
  Object.defineProperty(C.prototype, "mConvexRadius", {
      get: C.prototype.Tq,
      set: C.prototype.jr
  });
  C.prototype.get_mMaterial = C.prototype.sq = function() {
      return l(uf(this.gq), Gs)
  };
  C.prototype.set_mMaterial = C.prototype.vq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      vf(c, a)
  };
  Object.defineProperty(C.prototype, "mMaterial", {
      get: C.prototype.sq,
      set: C.prototype.vq
  });
  C.prototype.get_mDensity = C.prototype.rq = function() {
      return wf(this.gq)
  };
  C.prototype.set_mDensity = C.prototype.uq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      xf(c, a)
  };
  Object.defineProperty(C.prototype, "mDensity", {
      get: C.prototype.rq,
      set: C.prototype.uq
  });
  C.prototype.get_mUserData = C.prototype.jq = function() {
      return yf(this.gq)
  };
  C.prototype.set_mUserData = C.prototype.kq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      zf(c, a)
  };
  Object.defineProperty(C.prototype, "mUserData", {
      get: C.prototype.jq,
      set: C.prototype.kq
  });
  C.prototype.__destroy__ = function() {
      Af(this.gq)
  };

  function Vs(a, c, e, f) {
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      f && "object" === typeof f && (f = f.gq);
      this.gq = Bf(a, c, e, f);
      h(Vs)[this.gq] = this
  }
  Vs.prototype = Object.create(v.prototype);
  Vs.prototype.constructor = Vs;
  Vs.prototype.hq = Vs;
  Vs.iq = {};
  b.CylinderShape = Vs;
  Vs.prototype.GetDensity = function() {
      return Cf(this.gq)
  };
  Vs.prototype.SetDensity = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Df(c, a)
  };
  Vs.prototype.GetType = function() {
      return Ef(this.gq)
  };
  Vs.prototype.GetSubType = function() {
      return Ff(this.gq)
  };
  Vs.prototype.MustBeStatic = function() {
      return !!Gf(this.gq)
  };
  Vs.prototype.GetLocalBounds = function() {
      return l(Hf(this.gq), p)
  };
  Vs.prototype.GetWorldSpaceBounds = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      return l(If(e, a, c), p)
  };
  Vs.prototype.GetCenterOfMass = function() {
      return l(Jf(this.gq), q)
  };
  Vs.prototype.GetUserData = function() {
      return Kf(this.gq)
  };
  Vs.prototype.SetUserData = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Lf(c, a)
  };
  Vs.prototype.__destroy__ = function() {
      Mf(this.gq)
  };

  function D(a, c, e) {
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      this.gq = Nf(a, c, e);
      h(D)[this.gq] = this
  }
  D.prototype = Object.create(u.prototype);
  D.prototype.constructor = D;
  D.prototype.hq = D;
  D.iq = {};
  b.CapsuleShapeSettings = D;
  D.prototype.Create = function() {
      return l(Of(this.gq), m)
  };
  D.prototype.get_mRadius = D.prototype.Hq = function() {
      return Pf(this.gq)
  };
  D.prototype.set_mRadius = D.prototype.Lq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Qf(c, a)
  };
  Object.defineProperty(D.prototype, "mRadius", {
      get: D.prototype.Hq,
      set: D.prototype.Lq
  });
  D.prototype.get_mHalfHeightOfCylinder = D.prototype.Pr = function() {
      return Rf(this.gq)
  };
  D.prototype.set_mHalfHeightOfCylinder = D.prototype.tt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Sf(c, a)
  };
  Object.defineProperty(D.prototype, "mHalfHeightOfCylinder", {
      get: D.prototype.Pr,
      set: D.prototype.tt
  });
  D.prototype.get_mMaterial = D.prototype.sq = function() {
      return l(Tf(this.gq), Gs)
  };
  D.prototype.set_mMaterial = D.prototype.vq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Uf(c, a)
  };
  Object.defineProperty(D.prototype, "mMaterial", {
      get: D.prototype.sq,
      set: D.prototype.vq
  });
  D.prototype.get_mDensity = D.prototype.rq = function() {
      return Vf(this.gq)
  };
  D.prototype.set_mDensity = D.prototype.uq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Wf(c, a)
  };
  Object.defineProperty(D.prototype, "mDensity", {
      get: D.prototype.rq,
      set: D.prototype.uq
  });
  D.prototype.get_mUserData = D.prototype.jq = function() {
      return Xf(this.gq)
  };
  D.prototype.set_mUserData = D.prototype.kq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Yf(c, a)
  };
  Object.defineProperty(D.prototype, "mUserData", {
      get: D.prototype.jq,
      set: D.prototype.kq
  });
  D.prototype.__destroy__ = function() {
      Zf(this.gq)
  };

  function Ws(a, c, e) {
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      this.gq = $f(a, c, e);
      h(Ws)[this.gq] = this
  }
  Ws.prototype = Object.create(v.prototype);
  Ws.prototype.constructor = Ws;
  Ws.prototype.hq = Ws;
  Ws.iq = {};
  b.CapsuleShape = Ws;
  Ws.prototype.GetDensity = function() {
      return ag(this.gq)
  };
  Ws.prototype.SetDensity = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      bg(c, a)
  };
  Ws.prototype.GetType = function() {
      return cg(this.gq)
  };
  Ws.prototype.GetSubType = function() {
      return dg(this.gq)
  };
  Ws.prototype.MustBeStatic = function() {
      return !!eg(this.gq)
  };
  Ws.prototype.GetLocalBounds = function() {
      return l(fg(this.gq), p)
  };
  Ws.prototype.GetWorldSpaceBounds = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      return l(gg(e, a, c), p)
  };
  Ws.prototype.GetCenterOfMass = function() {
      return l(hg(this.gq), q)
  };
  Ws.prototype.GetUserData = function() {
      return ig(this.gq)
  };
  Ws.prototype.SetUserData = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      jg(c, a)
  };
  Ws.prototype.__destroy__ = function() {
      kg(this.gq)
  };

  function E(a, c, e, f) {
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      f && "object" === typeof f && (f = f.gq);
      this.gq = lg(a, c, e, f);
      h(E)[this.gq] = this
  }
  E.prototype = Object.create(u.prototype);
  E.prototype.constructor = E;
  E.prototype.hq = E;
  E.iq = {};
  b.TaperedCapsuleShapeSettings = E;
  E.prototype.Create = function() {
      return l(mg(this.gq), m)
  };
  E.prototype.get_mHalfHeightOfTaperedCylinder = E.prototype.Qr = function() {
      return ng(this.gq)
  };
  E.prototype.set_mHalfHeightOfTaperedCylinder = E.prototype.ut = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      og(c, a)
  };
  Object.defineProperty(E.prototype, "mHalfHeightOfTaperedCylinder", {
      get: E.prototype.Qr,
      set: E.prototype.ut
  });
  E.prototype.get_mTopRadius = E.prototype.Os = function() {
      return pg(this.gq)
  };
  E.prototype.set_mTopRadius = E.prototype.nu = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      qg(c, a)
  };
  Object.defineProperty(E.prototype, "mTopRadius", {
      get: E.prototype.Os,
      set: E.prototype.nu
  });
  E.prototype.get_mBottomRadius = E.prototype.Hr = function() {
      return rg(this.gq)
  };
  E.prototype.set_mBottomRadius = E.prototype.lt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      sg(c, a)
  };
  Object.defineProperty(E.prototype, "mBottomRadius", {
      get: E.prototype.Hr,
      set: E.prototype.lt
  });
  E.prototype.get_mMaterial = E.prototype.sq = function() {
      return l(tg(this.gq), Gs)
  };
  E.prototype.set_mMaterial = E.prototype.vq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      ug(c, a)
  };
  Object.defineProperty(E.prototype, "mMaterial", {
      get: E.prototype.sq,
      set: E.prototype.vq
  });
  E.prototype.get_mDensity = E.prototype.rq = function() {
      return vg(this.gq)
  };
  E.prototype.set_mDensity = E.prototype.uq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      wg(c, a)
  };
  Object.defineProperty(E.prototype, "mDensity", {
      get: E.prototype.rq,
      set: E.prototype.uq
  });
  E.prototype.get_mUserData = E.prototype.jq = function() {
      return xg(this.gq)
  };
  E.prototype.set_mUserData = E.prototype.kq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      yg(c, a)
  };
  Object.defineProperty(E.prototype, "mUserData", {
      get: E.prototype.jq,
      set: E.prototype.kq
  });
  E.prototype.__destroy__ = function() {
      zg(this.gq)
  };

  function Xs() {
      throw "cannot construct a TaperedCapsuleShape, no constructor in IDL";
  }
  Xs.prototype = Object.create(v.prototype);
  Xs.prototype.constructor = Xs;
  Xs.prototype.hq = Xs;
  Xs.iq = {};
  b.TaperedCapsuleShape = Xs;
  Xs.prototype.GetDensity = function() {
      return Ag(this.gq)
  };
  Xs.prototype.SetDensity = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Bg(c, a)
  };
  Xs.prototype.GetType = function() {
      return Cg(this.gq)
  };
  Xs.prototype.GetSubType = function() {
      return Dg(this.gq)
  };
  Xs.prototype.MustBeStatic = function() {
      return !!Eg(this.gq)
  };
  Xs.prototype.GetLocalBounds = function() {
      return l(Fg(this.gq), p)
  };
  Xs.prototype.GetWorldSpaceBounds = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      return l(Gg(e, a, c), p)
  };
  Xs.prototype.GetCenterOfMass = function() {
      return l(Hg(this.gq), q)
  };
  Xs.prototype.GetUserData = function() {
      return Ig(this.gq)
  };
  Xs.prototype.SetUserData = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Jg(c, a)
  };
  Xs.prototype.__destroy__ = function() {
      Kg(this.gq)
  };

  function F() {
      this.gq = Lg();
      h(F)[this.gq] = this
  }
  F.prototype = Object.create(u.prototype);
  F.prototype.constructor = F;
  F.prototype.hq = F;
  F.iq = {};
  b.ConvexHullShapeSettings = F;
  F.prototype.Create = function() {
      return l(Mg(this.gq), m)
  };
  F.prototype.get_mPoints = F.prototype.Es = function() {
      return l(Ng(this.gq), Ls)
  };
  F.prototype.set_mPoints = F.prototype.du = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Og(c, a)
  };
  Object.defineProperty(F.prototype, "mPoints", {
      get: F.prototype.Es,
      set: F.prototype.du
  });
  F.prototype.get_mMaxConvexRadius = F.prototype.ms = function() {
      return Pg(this.gq)
  };
  F.prototype.set_mMaxConvexRadius = F.prototype.Ot = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Qg(c, a)
  };
  Object.defineProperty(F.prototype, "mMaxConvexRadius", {
      get: F.prototype.ms,
      set: F.prototype.Ot
  });
  F.prototype.get_mMaxErrorConvexRadius = F.prototype.ps = function() {
      return Rg(this.gq)
  };
  F.prototype.set_mMaxErrorConvexRadius = F.prototype.Qt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Sg(c, a)
  };
  Object.defineProperty(F.prototype, "mMaxErrorConvexRadius", {
      get: F.prototype.ps,
      set: F.prototype.Qt
  });
  F.prototype.get_mHullTolerance = F.prototype.Tr = function() {
      return Tg(this.gq)
  };
  F.prototype.set_mHullTolerance = F.prototype.xt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Ug(c, a)
  };
  Object.defineProperty(F.prototype, "mHullTolerance", {
      get: F.prototype.Tr,
      set: F.prototype.xt
  });
  F.prototype.get_mMaterial = F.prototype.sq = function() {
      return l(Vg(this.gq), Gs)
  };
  F.prototype.set_mMaterial = F.prototype.vq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Wg(c, a)
  };
  Object.defineProperty(F.prototype, "mMaterial", {
      get: F.prototype.sq,
      set: F.prototype.vq
  });
  F.prototype.get_mDensity = F.prototype.rq = function() {
      return Xg(this.gq)
  };
  F.prototype.set_mDensity = F.prototype.uq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Yg(c, a)
  };
  Object.defineProperty(F.prototype, "mDensity", {
      get: F.prototype.rq,
      set: F.prototype.uq
  });
  F.prototype.get_mUserData = F.prototype.jq = function() {
      return Zg(this.gq)
  };
  F.prototype.set_mUserData = F.prototype.kq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      $g(c, a)
  };
  Object.defineProperty(F.prototype, "mUserData", {
      get: F.prototype.jq,
      set: F.prototype.kq
  });
  F.prototype.__destroy__ = function() {
      ah(this.gq)
  };

  function Ys() {
      throw "cannot construct a ConvexHullShape, no constructor in IDL";
  }
  Ys.prototype = Object.create(v.prototype);
  Ys.prototype.constructor = Ys;
  Ys.prototype.hq = Ys;
  Ys.iq = {};
  b.ConvexHullShape = Ys;
  Ys.prototype.GetDensity = function() {
      return bh(this.gq)
  };
  Ys.prototype.SetDensity = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      ch(c, a)
  };
  Ys.prototype.GetType = function() {
      return dh(this.gq)
  };
  Ys.prototype.GetSubType = function() {
      return eh(this.gq)
  };
  Ys.prototype.MustBeStatic = function() {
      return !!fh(this.gq)
  };
  Ys.prototype.GetLocalBounds = function() {
      return l(gh(this.gq), p)
  };
  Ys.prototype.GetWorldSpaceBounds = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      return l(hh(e, a, c), p)
  };
  Ys.prototype.GetCenterOfMass = function() {
      return l(ih(this.gq), q)
  };
  Ys.prototype.GetUserData = function() {
      return jh(this.gq)
  };
  Ys.prototype.SetUserData = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      kh(c, a)
  };
  Ys.prototype.__destroy__ = function() {
      lh(this.gq)
  };

  function Zs() {
      this.gq = mh();
      h(Zs)[this.gq] = this
  }
  Zs.prototype = Object.create(Fs.prototype);
  Zs.prototype.constructor = Zs;
  Zs.prototype.hq = Zs;
  Zs.iq = {};
  b.StaticCompoundShapeSettings = Zs;
  Zs.prototype.AddShape = function(a, c, e, f) {
      var t = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      f && "object" === typeof f && (f = f.gq);
      nh(t, a, c, e, f)
  };
  Zs.prototype.Create = function() {
      return l(oh(this.gq), m)
  };
  Zs.prototype.get_mUserData = Zs.prototype.jq = function() {
      return ph(this.gq)
  };
  Zs.prototype.set_mUserData = Zs.prototype.kq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      qh(c, a)
  };
  Object.defineProperty(Zs.prototype, "mUserData", {
      get: Zs.prototype.jq,
      set: Zs.prototype.kq
  });
  Zs.prototype.__destroy__ = function() {
      rh(this.gq)
  };

  function $s() {
      throw "cannot construct a StaticCompoundShape, no constructor in IDL";
  }
  $s.prototype = Object.create(n.prototype);
  $s.prototype.constructor = $s;
  $s.prototype.hq = $s;
  $s.iq = {};
  b.StaticCompoundShape = $s;
  $s.prototype.GetType = function() {
      return sh(this.gq)
  };
  $s.prototype.GetSubType = function() {
      return th(this.gq)
  };
  $s.prototype.MustBeStatic = function() {
      return !!uh(this.gq)
  };
  $s.prototype.GetLocalBounds = function() {
      return l(vh(this.gq), p)
  };
  $s.prototype.GetWorldSpaceBounds = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      return l(wh(e, a, c), p)
  };
  $s.prototype.GetCenterOfMass = function() {
      return l(xh(this.gq), q)
  };
  $s.prototype.GetUserData = function() {
      return yh(this.gq)
  };
  $s.prototype.SetUserData = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      zh(c, a)
  };
  $s.prototype.__destroy__ = function() {
      Ah(this.gq)
  };

  function at(a, c) {
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      this.gq = Bh(a, c);
      h(at)[this.gq] = this
  }
  at.prototype = Object.create(Fs.prototype);
  at.prototype.constructor = at;
  at.prototype.hq = at;
  at.iq = {};
  b.ScaledShapeSettings = at;
  at.prototype.Create = function() {
      return l(Ch(this.gq), m)
  };
  at.prototype.get_mScale = at.prototype.Js = function() {
      return l(Dh(this.gq), q)
  };
  at.prototype.set_mScale = at.prototype.iu = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Eh(c, a)
  };
  Object.defineProperty(at.prototype, "mScale", {
      get: at.prototype.Js,
      set: at.prototype.iu
  });
  at.prototype.get_mUserData = at.prototype.jq = function() {
      return Fh(this.gq)
  };
  at.prototype.set_mUserData = at.prototype.kq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Gh(c, a)
  };
  Object.defineProperty(at.prototype, "mUserData", {
      get: at.prototype.jq,
      set: at.prototype.kq
  });
  at.prototype.__destroy__ = function() {
      Hh(this.gq)
  };

  function bt(a, c) {
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      this.gq = Ih(a, c);
      h(bt)[this.gq] = this
  }
  bt.prototype = Object.create(n.prototype);
  bt.prototype.constructor = bt;
  bt.prototype.hq = bt;
  bt.iq = {};
  b.ScaledShape = bt;
  bt.prototype.GetType = function() {
      return Jh(this.gq)
  };
  bt.prototype.GetSubType = function() {
      return Kh(this.gq)
  };
  bt.prototype.MustBeStatic = function() {
      return !!Lh(this.gq)
  };
  bt.prototype.GetLocalBounds = function() {
      return l(Mh(this.gq), p)
  };
  bt.prototype.GetWorldSpaceBounds = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      return l(Nh(e, a, c), p)
  };
  bt.prototype.GetCenterOfMass = function() {
      return l(Oh(this.gq), q)
  };
  bt.prototype.GetUserData = function() {
      return Ph(this.gq)
  };
  bt.prototype.SetUserData = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Qh(c, a)
  };
  bt.prototype.__destroy__ = function() {
      Rh(this.gq)
  };

  function ct(a, c) {
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      this.gq = Sh(a, c);
      h(ct)[this.gq] = this
  }
  ct.prototype = Object.create(Fs.prototype);
  ct.prototype.constructor = ct;
  ct.prototype.hq = ct;
  ct.iq = {};
  b.OffsetCenterOfMassShapeSettings = ct;
  ct.prototype.Create = function() {
      return l(Th(this.gq), m)
  };
  ct.prototype.get_mOffset = ct.prototype.zs = function() {
      return l(Uh(this.gq), q)
  };
  ct.prototype.set_mOffset = ct.prototype.Zt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Vh(c, a)
  };
  Object.defineProperty(ct.prototype, "mOffset", {
      get: ct.prototype.zs,
      set: ct.prototype.Zt
  });
  ct.prototype.get_mUserData = ct.prototype.jq = function() {
      return Wh(this.gq)
  };
  ct.prototype.set_mUserData = ct.prototype.kq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Xh(c, a)
  };
  Object.defineProperty(ct.prototype, "mUserData", {
      get: ct.prototype.jq,
      set: ct.prototype.kq
  });
  ct.prototype.__destroy__ = function() {
      Yh(this.gq)
  };

  function dt() {
      throw "cannot construct a OffsetCenterOfMassShape, no constructor in IDL";
  }
  dt.prototype = Object.create(n.prototype);
  dt.prototype.constructor = dt;
  dt.prototype.hq = dt;
  dt.iq = {};
  b.OffsetCenterOfMassShape = dt;
  dt.prototype.GetType = function() {
      return Zh(this.gq)
  };
  dt.prototype.GetSubType = function() {
      return $h(this.gq)
  };
  dt.prototype.MustBeStatic = function() {
      return !!ai(this.gq)
  };
  dt.prototype.GetLocalBounds = function() {
      return l(bi(this.gq), p)
  };
  dt.prototype.GetWorldSpaceBounds = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      return l(ci(e, a, c), p)
  };
  dt.prototype.GetCenterOfMass = function() {
      return l(di(this.gq), q)
  };
  dt.prototype.GetUserData = function() {
      return ei(this.gq)
  };
  dt.prototype.SetUserData = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      fi(c, a)
  };
  dt.prototype.__destroy__ = function() {
      gi(this.gq)
  };

  function H(a, c, e) {
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      this.gq = hi(a, c, e);
      h(H)[this.gq] = this
  }
  H.prototype = Object.create(Fs.prototype);
  H.prototype.constructor = H;
  H.prototype.hq = H;
  H.iq = {};
  b.RotatedTranslatedShapeSettings = H;
  H.prototype.Create = function() {
      return l(ii(this.gq), m)
  };
  H.prototype.get_mPosition = H.prototype.Cq = function() {
      return l(ji(this.gq), q)
  };
  H.prototype.set_mPosition = H.prototype.Dq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      ki(c, a)
  };
  Object.defineProperty(H.prototype, "mPosition", {
      get: H.prototype.Cq,
      set: H.prototype.Dq
  });
  H.prototype.get_mRotation = H.prototype.Iq = function() {
      return l(li(this.gq), x)
  };
  H.prototype.set_mRotation = H.prototype.Mq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      mi(c, a)
  };
  Object.defineProperty(H.prototype, "mRotation", {
      get: H.prototype.Iq,
      set: H.prototype.Mq
  });
  H.prototype.get_mUserData = H.prototype.jq = function() {
      return ni(this.gq)
  };
  H.prototype.set_mUserData = H.prototype.kq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      oi(c, a)
  };
  Object.defineProperty(H.prototype, "mUserData", {
      get: H.prototype.jq,
      set: H.prototype.kq
  });
  H.prototype.__destroy__ = function() {
      pi(this.gq)
  };

  function et() {
      throw "cannot construct a RotatedTranslatedShape, no constructor in IDL";
  }
  et.prototype = Object.create(n.prototype);
  et.prototype.constructor = et;
  et.prototype.hq = et;
  et.iq = {};
  b.RotatedTranslatedShape = et;
  et.prototype.GetType = function() {
      return qi(this.gq)
  };
  et.prototype.GetSubType = function() {
      return ri(this.gq)
  };
  et.prototype.MustBeStatic = function() {
      return !!si(this.gq)
  };
  et.prototype.GetLocalBounds = function() {
      return l(ti(this.gq), p)
  };
  et.prototype.GetWorldSpaceBounds = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      return l(ui(e, a, c), p)
  };
  et.prototype.GetCenterOfMass = function() {
      return l(vi(this.gq), q)
  };
  et.prototype.GetUserData = function() {
      return wi(this.gq)
  };
  et.prototype.SetUserData = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      xi(c, a)
  };
  et.prototype.__destroy__ = function() {
      yi(this.gq)
  };

  function ft(a, c, e) {
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      this.gq = void 0 === e ? zi(a, c) : Ai(a, c, e);
      h(ft)[this.gq] = this
  }
  ft.prototype = Object.create(Fs.prototype);
  ft.prototype.constructor = ft;
  ft.prototype.hq = ft;
  ft.iq = {};
  b.MeshShapeSettings = ft;
  ft.prototype.Create = function() {
      return l(Bi(this.gq), m)
  };
  ft.prototype.get_mUserData = ft.prototype.jq = function() {
      return Ci(this.gq)
  };
  ft.prototype.set_mUserData = ft.prototype.kq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Di(c, a)
  };
  Object.defineProperty(ft.prototype, "mUserData", {
      get: ft.prototype.jq,
      set: ft.prototype.kq
  });
  ft.prototype.__destroy__ = function() {
      Ei(this.gq)
  };

  function gt() {
      throw "cannot construct a MeshShape, no constructor in IDL";
  }
  gt.prototype = Object.create(n.prototype);
  gt.prototype.constructor = gt;
  gt.prototype.hq = gt;
  gt.iq = {};
  b.MeshShape = gt;
  gt.prototype.GetType = function() {
      return Fi(this.gq)
  };
  gt.prototype.GetSubType = function() {
      return Gi(this.gq)
  };
  gt.prototype.MustBeStatic = function() {
      return !!Hi(this.gq)
  };
  gt.prototype.GetLocalBounds = function() {
      return l(Ii(this.gq), p)
  };
  gt.prototype.GetWorldSpaceBounds = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      return l(Ji(e, a, c), p)
  };
  gt.prototype.GetCenterOfMass = function() {
      return l(Ki(this.gq), q)
  };
  gt.prototype.GetUserData = function() {
      return Li(this.gq)
  };
  gt.prototype.SetUserData = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Mi(c, a)
  };
  gt.prototype.__destroy__ = function() {
      Ni(this.gq)
  };

  function ht() {
      throw "cannot construct a TwoBodyConstraint, no constructor in IDL";
  }
  ht.prototype = Object.create(Hs.prototype);
  ht.prototype.constructor = ht;
  ht.prototype.hq = ht;
  ht.iq = {};
  b.TwoBodyConstraint = ht;
  ht.prototype.GetBody1 = function() {
      return l(Oi(this.gq), Body)
  };
  ht.prototype.GetBody2 = function() {
      return l(Pi(this.gq), Body)
  };
  ht.prototype.SetEnabled = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Qi(c, a)
  };
  ht.prototype.GetEnabled = function() {
      return !!Ri(this.gq)
  };
  ht.prototype.__destroy__ = function() {
      Si(this.gq)
  };

  function I() {
      this.gq = Ti();
      h(I)[this.gq] = this
  }
  I.prototype = Object.create(w.prototype);
  I.prototype.constructor = I;
  I.prototype.hq = I;
  I.iq = {};
  b.FixedConstraintSettings = I;
  I.prototype.Create = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      return l(Ui(e, a, c), Hs)
  };
  I.prototype.get_mSpace = I.prototype.tq = function() {
      return Vi(this.gq)
  };
  I.prototype.set_mSpace = I.prototype.wq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Wi(c, a)
  };
  Object.defineProperty(I.prototype, "mSpace", {
      get: I.prototype.tq,
      set: I.prototype.wq
  });
  I.prototype.get_mAutoDetectPoint = I.prototype.Qq = function() {
      return !!Xi(this.gq)
  };
  I.prototype.set_mAutoDetectPoint = I.prototype.gr = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Yi(c, a)
  };
  Object.defineProperty(I.prototype, "mAutoDetectPoint", {
      get: I.prototype.Qq,
      set: I.prototype.gr
  });
  I.prototype.get_mPoint1 = I.prototype.xq = function() {
      return l(Zi(this.gq), q)
  };
  I.prototype.set_mPoint1 = I.prototype.zq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      $i(c, a)
  };
  Object.defineProperty(I.prototype, "mPoint1", {
      get: I.prototype.xq,
      set: I.prototype.zq
  });
  I.prototype.get_mAxisX1 = I.prototype.Dr = function() {
      return l(aj(this.gq), q)
  };
  I.prototype.set_mAxisX1 = I.prototype.ht = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      bj(c, a)
  };
  Object.defineProperty(I.prototype, "mAxisX1", {
      get: I.prototype.Dr,
      set: I.prototype.ht
  });
  I.prototype.get_mAxisY1 = I.prototype.Fr = function() {
      return l(cj(this.gq), q)
  };
  I.prototype.set_mAxisY1 = I.prototype.jt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      dj(c, a)
  };
  Object.defineProperty(I.prototype, "mAxisY1", {
      get: I.prototype.Fr,
      set: I.prototype.jt
  });
  I.prototype.get_mPoint2 = I.prototype.yq = function() {
      return l(ej(this.gq), q)
  };
  I.prototype.set_mPoint2 = I.prototype.Aq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      fj(c, a)
  };
  Object.defineProperty(I.prototype, "mPoint2", {
      get: I.prototype.yq,
      set: I.prototype.Aq
  });
  I.prototype.get_mAxisX2 = I.prototype.Er = function() {
      return l(gj(this.gq), q)
  };
  I.prototype.set_mAxisX2 = I.prototype.it = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      hj(c, a)
  };
  Object.defineProperty(I.prototype, "mAxisX2", {
      get: I.prototype.Er,
      set: I.prototype.it
  });
  I.prototype.get_mAxisY2 = I.prototype.Gr = function() {
      return l(ij(this.gq), q)
  };
  I.prototype.set_mAxisY2 = I.prototype.kt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      jj(c, a)
  };
  Object.defineProperty(I.prototype, "mAxisY2", {
      get: I.prototype.Gr,
      set: I.prototype.kt
  });
  I.prototype.get_mEnabled = I.prototype.lq = function() {
      return !!kj(this.gq)
  };
  I.prototype.set_mEnabled = I.prototype.oq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      lj(c, a)
  };
  Object.defineProperty(I.prototype, "mEnabled", {
      get: I.prototype.lq,
      set: I.prototype.oq
  });
  I.prototype.get_mNumVelocityStepsOverride = I.prototype.nq = function() {
      return mj(this.gq)
  };
  I.prototype.set_mNumVelocityStepsOverride = I.prototype.qq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      nj(c, a)
  };
  Object.defineProperty(I.prototype, "mNumVelocityStepsOverride", {
      get: I.prototype.nq,
      set: I.prototype.qq
  });
  I.prototype.get_mNumPositionStepsOverride = I.prototype.mq = function() {
      return oj(this.gq)
  };
  I.prototype.set_mNumPositionStepsOverride = I.prototype.pq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      pj(c, a)
  };
  Object.defineProperty(I.prototype, "mNumPositionStepsOverride", {
      get: I.prototype.mq,
      set: I.prototype.pq
  });
  I.prototype.__destroy__ = function() {
      qj(this.gq)
  };

  function J() {
      this.gq = rj();
      h(J)[this.gq] = this
  }
  J.prototype = Object.create(g.prototype);
  J.prototype.constructor = J;
  J.prototype.hq = J;
  J.iq = {};
  b.SpringSettings = J;
  J.prototype.get_mMode = J.prototype.ts = function() {
      return sj(this.gq)
  };
  J.prototype.set_mMode = J.prototype.Ut = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      tj(c, a)
  };
  Object.defineProperty(J.prototype, "mMode", {
      get: J.prototype.ts,
      set: J.prototype.Ut
  });
  J.prototype.get_mFrequency = J.prototype.Lr = function() {
      return uj(this.gq)
  };
  J.prototype.set_mFrequency = J.prototype.pt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      vj(c, a)
  };
  Object.defineProperty(J.prototype, "mFrequency", {
      get: J.prototype.Lr,
      set: J.prototype.pt
  });
  J.prototype.get_mStiffness = J.prototype.Ns = function() {
      return wj(this.gq)
  };
  J.prototype.set_mStiffness = J.prototype.mu = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      xj(c, a)
  };
  Object.defineProperty(J.prototype, "mStiffness", {
      get: J.prototype.Ns,
      set: J.prototype.mu
  });
  J.prototype.get_mDamping = J.prototype.Ir = function() {
      return yj(this.gq)
  };
  J.prototype.set_mDamping = J.prototype.mt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      zj(c, a)
  };
  Object.defineProperty(J.prototype, "mDamping", {
      get: J.prototype.Ir,
      set: J.prototype.mt
  });
  J.prototype.__destroy__ = function() {
      Aj(this.gq)
  };

  function K() {
      this.gq = Bj();
      h(K)[this.gq] = this
  }
  K.prototype = Object.create(w.prototype);
  K.prototype.constructor = K;
  K.prototype.hq = K;
  K.iq = {};
  b.DistanceConstraintSettings = K;
  K.prototype.Create = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      return l(Cj(e, a, c), Hs)
  };
  K.prototype.get_mSpace = K.prototype.tq = function() {
      return Dj(this.gq)
  };
  K.prototype.set_mSpace = K.prototype.wq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Ej(c, a)
  };
  Object.defineProperty(K.prototype, "mSpace", {
      get: K.prototype.tq,
      set: K.prototype.wq
  });
  K.prototype.get_mPoint1 = K.prototype.xq = function() {
      return l(Fj(this.gq), q)
  };
  K.prototype.set_mPoint1 = K.prototype.zq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Gj(c, a)
  };
  Object.defineProperty(K.prototype, "mPoint1", {
      get: K.prototype.xq,
      set: K.prototype.zq
  });
  K.prototype.get_mPoint2 = K.prototype.yq = function() {
      return l(Hj(this.gq), q)
  };
  K.prototype.set_mPoint2 = K.prototype.Aq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Ij(c, a)
  };
  Object.defineProperty(K.prototype, "mPoint2", {
      get: K.prototype.yq,
      set: K.prototype.Aq
  });
  K.prototype.get_mMinDistance = K.prototype.ss = function() {
      return Jj(this.gq)
  };
  K.prototype.set_mMinDistance = K.prototype.Tt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Kj(c, a)
  };
  Object.defineProperty(K.prototype, "mMinDistance", {
      get: K.prototype.ss,
      set: K.prototype.Tt
  });
  K.prototype.get_mMaxDistance = K.prototype.ns = function() {
      return Lj(this.gq)
  };
  K.prototype.set_mMaxDistance = K.prototype.Pt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Mj(c, a)
  };
  Object.defineProperty(K.prototype, "mMaxDistance", {
      get: K.prototype.ns,
      set: K.prototype.Pt
  });
  K.prototype.get_mLimitsSpringSettings = K.prototype.Zr = function() {
      return l(Nj(this.gq), J)
  };
  K.prototype.set_mLimitsSpringSettings = K.prototype.Dt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Oj(c, a)
  };
  Object.defineProperty(K.prototype, "mLimitsSpringSettings", {
      get: K.prototype.Zr,
      set: K.prototype.Dt
  });
  K.prototype.get_mEnabled = K.prototype.lq = function() {
      return !!Pj(this.gq)
  };
  K.prototype.set_mEnabled = K.prototype.oq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Qj(c, a)
  };
  Object.defineProperty(K.prototype, "mEnabled", {
      get: K.prototype.lq,
      set: K.prototype.oq
  });
  K.prototype.get_mNumVelocityStepsOverride = K.prototype.nq = function() {
      return Rj(this.gq)
  };
  K.prototype.set_mNumVelocityStepsOverride = K.prototype.qq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Sj(c, a)
  };
  Object.defineProperty(K.prototype, "mNumVelocityStepsOverride", {
      get: K.prototype.nq,
      set: K.prototype.qq
  });
  K.prototype.get_mNumPositionStepsOverride = K.prototype.mq = function() {
      return Tj(this.gq)
  };
  K.prototype.set_mNumPositionStepsOverride = K.prototype.pq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Uj(c, a)
  };
  Object.defineProperty(K.prototype, "mNumPositionStepsOverride", {
      get: K.prototype.mq,
      set: K.prototype.pq
  });
  K.prototype.__destroy__ = function() {
      Vj(this.gq)
  };

  function L() {
      this.gq = Wj();
      h(L)[this.gq] = this
  }
  L.prototype = Object.create(w.prototype);
  L.prototype.constructor = L;
  L.prototype.hq = L;
  L.iq = {};
  b.PointConstraintSettings = L;
  L.prototype.Create = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      return l(Xj(e, a, c), Hs)
  };
  L.prototype.get_mSpace = L.prototype.tq = function() {
      return Yj(this.gq)
  };
  L.prototype.set_mSpace = L.prototype.wq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Zj(c, a)
  };
  Object.defineProperty(L.prototype, "mSpace", {
      get: L.prototype.tq,
      set: L.prototype.wq
  });
  L.prototype.get_mPoint1 = L.prototype.xq = function() {
      return l(ak(this.gq), q)
  };
  L.prototype.set_mPoint1 = L.prototype.zq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      bk(c, a)
  };
  Object.defineProperty(L.prototype, "mPoint1", {
      get: L.prototype.xq,
      set: L.prototype.zq
  });
  L.prototype.get_mPoint2 = L.prototype.yq = function() {
      return l(ck(this.gq), q)
  };
  L.prototype.set_mPoint2 = L.prototype.Aq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      dk(c, a)
  };
  Object.defineProperty(L.prototype, "mPoint2", {
      get: L.prototype.yq,
      set: L.prototype.Aq
  });
  L.prototype.get_mEnabled = L.prototype.lq = function() {
      return !!ek(this.gq)
  };
  L.prototype.set_mEnabled = L.prototype.oq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      fk(c, a)
  };
  Object.defineProperty(L.prototype, "mEnabled", {
      get: L.prototype.lq,
      set: L.prototype.oq
  });
  L.prototype.get_mNumVelocityStepsOverride = L.prototype.nq = function() {
      return gk(this.gq)
  };
  L.prototype.set_mNumVelocityStepsOverride = L.prototype.qq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      hk(c, a)
  };
  Object.defineProperty(L.prototype, "mNumVelocityStepsOverride", {
      get: L.prototype.nq,
      set: L.prototype.qq
  });
  L.prototype.get_mNumPositionStepsOverride = L.prototype.mq = function() {
      return ik(this.gq)
  };
  L.prototype.set_mNumPositionStepsOverride = L.prototype.pq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      jk(c, a)
  };
  Object.defineProperty(L.prototype, "mNumPositionStepsOverride", {
      get: L.prototype.mq,
      set: L.prototype.pq
  });
  L.prototype.__destroy__ = function() {
      kk(this.gq)
  };

  function M() {
      this.gq = lk();
      h(M)[this.gq] = this
  }
  M.prototype = Object.create(w.prototype);
  M.prototype.constructor = M;
  M.prototype.hq = M;
  M.iq = {};
  b.HingeConstraintSettings = M;
  M.prototype.Create = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      return l(mk(e, a, c), Hs)
  };
  M.prototype.get_mSpace = M.prototype.tq = function() {
      return nk(this.gq)
  };
  M.prototype.set_mSpace = M.prototype.wq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      ok(c, a)
  };
  Object.defineProperty(M.prototype, "mSpace", {
      get: M.prototype.tq,
      set: M.prototype.wq
  });
  M.prototype.get_mPoint1 = M.prototype.xq = function() {
      return l(pk(this.gq), q)
  };
  M.prototype.set_mPoint1 = M.prototype.zq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      qk(c, a)
  };
  Object.defineProperty(M.prototype, "mPoint1", {
      get: M.prototype.xq,
      set: M.prototype.zq
  });
  M.prototype.get_mHingeAxis1 = M.prototype.Rr = function() {
      return l(rk(this.gq), q)
  };
  M.prototype.set_mHingeAxis1 = M.prototype.vt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      sk(c, a)
  };
  Object.defineProperty(M.prototype, "mHingeAxis1", {
      get: M.prototype.Rr,
      set: M.prototype.vt
  });
  M.prototype.get_mNormalAxis1 = M.prototype.ar = function() {
      return l(tk(this.gq), q)
  };
  M.prototype.set_mNormalAxis1 = M.prototype.sr = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      uk(c, a)
  };
  Object.defineProperty(M.prototype, "mNormalAxis1", {
      get: M.prototype.ar,
      set: M.prototype.sr
  });
  M.prototype.get_mPoint2 = M.prototype.yq = function() {
      return l(vk(this.gq), q)
  };
  M.prototype.set_mPoint2 = M.prototype.Aq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      wk(c, a)
  };
  Object.defineProperty(M.prototype, "mPoint2", {
      get: M.prototype.yq,
      set: M.prototype.Aq
  });
  M.prototype.get_mHingeAxis2 = M.prototype.Sr = function() {
      return l(xk(this.gq), q)
  };
  M.prototype.set_mHingeAxis2 = M.prototype.wt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      yk(c, a)
  };
  Object.defineProperty(M.prototype, "mHingeAxis2", {
      get: M.prototype.Sr,
      set: M.prototype.wt
  });
  M.prototype.get_mNormalAxis2 = M.prototype.br = function() {
      return l(zk(this.gq), q)
  };
  M.prototype.set_mNormalAxis2 = M.prototype.tr = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Ak(c, a)
  };
  Object.defineProperty(M.prototype, "mNormalAxis2", {
      get: M.prototype.br,
      set: M.prototype.tr
  });
  M.prototype.get_mLimitsMin = M.prototype.Xq = function() {
      return Bk(this.gq)
  };
  M.prototype.set_mLimitsMin = M.prototype.nr = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Ck(c, a)
  };
  Object.defineProperty(M.prototype, "mLimitsMin", {
      get: M.prototype.Xq,
      set: M.prototype.nr
  });
  M.prototype.get_mLimitsMax = M.prototype.Wq = function() {
      return Dk(this.gq)
  };
  M.prototype.set_mLimitsMax = M.prototype.mr = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Ek(c, a)
  };
  Object.defineProperty(M.prototype, "mLimitsMax", {
      get: M.prototype.Wq,
      set: M.prototype.mr
  });
  M.prototype.get_mMaxFrictionTorque = M.prototype.Zq = function() {
      return Fk(this.gq)
  };
  M.prototype.set_mMaxFrictionTorque = M.prototype.qr = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Gk(c, a)
  };
  Object.defineProperty(M.prototype, "mMaxFrictionTorque", {
      get: M.prototype.Zq,
      set: M.prototype.qr
  });
  M.prototype.get_mEnabled = M.prototype.lq = function() {
      return !!Hk(this.gq)
  };
  M.prototype.set_mEnabled = M.prototype.oq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Ik(c, a)
  };
  Object.defineProperty(M.prototype, "mEnabled", {
      get: M.prototype.lq,
      set: M.prototype.oq
  });
  M.prototype.get_mNumVelocityStepsOverride = M.prototype.nq = function() {
      return Jk(this.gq)
  };
  M.prototype.set_mNumVelocityStepsOverride = M.prototype.qq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Kk(c, a)
  };
  Object.defineProperty(M.prototype, "mNumVelocityStepsOverride", {
      get: M.prototype.nq,
      set: M.prototype.qq
  });
  M.prototype.get_mNumPositionStepsOverride = M.prototype.mq = function() {
      return Lk(this.gq)
  };
  M.prototype.set_mNumPositionStepsOverride = M.prototype.pq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Mk(c, a)
  };
  Object.defineProperty(M.prototype, "mNumPositionStepsOverride", {
      get: M.prototype.mq,
      set: M.prototype.pq
  });
  M.prototype.__destroy__ = function() {
      Nk(this.gq)
  };

  function N() {
      this.gq = Ok();
      h(N)[this.gq] = this
  }
  N.prototype = Object.create(w.prototype);
  N.prototype.constructor = N;
  N.prototype.hq = N;
  N.iq = {};
  b.ConeConstraintSettings = N;
  N.prototype.Create = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      return l(Pk(e, a, c), Hs)
  };
  N.prototype.get_mSpace = N.prototype.tq = function() {
      return Qk(this.gq)
  };
  N.prototype.set_mSpace = N.prototype.wq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Rk(c, a)
  };
  Object.defineProperty(N.prototype, "mSpace", {
      get: N.prototype.tq,
      set: N.prototype.wq
  });
  N.prototype.get_mPoint1 = N.prototype.xq = function() {
      return l(Sk(this.gq), q)
  };
  N.prototype.set_mPoint1 = N.prototype.zq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Tk(c, a)
  };
  Object.defineProperty(N.prototype, "mPoint1", {
      get: N.prototype.xq,
      set: N.prototype.zq
  });
  N.prototype.get_mTwistAxis1 = N.prototype.er = function() {
      return l(Uk(this.gq), q)
  };
  N.prototype.set_mTwistAxis1 = N.prototype.wr = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Vk(c, a)
  };
  Object.defineProperty(N.prototype, "mTwistAxis1", {
      get: N.prototype.er,
      set: N.prototype.wr
  });
  N.prototype.get_mPoint2 = N.prototype.yq = function() {
      return l(Wk(this.gq), q)
  };
  N.prototype.set_mPoint2 = N.prototype.Aq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Xk(c, a)
  };
  Object.defineProperty(N.prototype, "mPoint2", {
      get: N.prototype.yq,
      set: N.prototype.Aq
  });
  N.prototype.get_mTwistAxis2 = N.prototype.fr = function() {
      return l(Yk(this.gq), q)
  };
  N.prototype.set_mTwistAxis2 = N.prototype.xr = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Zk(c, a)
  };
  Object.defineProperty(N.prototype, "mTwistAxis2", {
      get: N.prototype.fr,
      set: N.prototype.xr
  });
  N.prototype.get_mHalfConeAngle = N.prototype.Mr = function() {
      return $k(this.gq)
  };
  N.prototype.set_mHalfConeAngle = N.prototype.qt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      al(c, a)
  };
  Object.defineProperty(N.prototype, "mHalfConeAngle", {
      get: N.prototype.Mr,
      set: N.prototype.qt
  });
  N.prototype.get_mEnabled = N.prototype.lq = function() {
      return !!bl(this.gq)
  };
  N.prototype.set_mEnabled = N.prototype.oq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      cl(c, a)
  };
  Object.defineProperty(N.prototype, "mEnabled", {
      get: N.prototype.lq,
      set: N.prototype.oq
  });
  N.prototype.get_mNumVelocityStepsOverride = N.prototype.nq = function() {
      return dl(this.gq)
  };
  N.prototype.set_mNumVelocityStepsOverride = N.prototype.qq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      el(c, a)
  };
  Object.defineProperty(N.prototype, "mNumVelocityStepsOverride", {
      get: N.prototype.nq,
      set: N.prototype.qq
  });
  N.prototype.get_mNumPositionStepsOverride = N.prototype.mq = function() {
      return fl(this.gq)
  };
  N.prototype.set_mNumPositionStepsOverride = N.prototype.pq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      gl(c, a)
  };
  Object.defineProperty(N.prototype, "mNumPositionStepsOverride", {
      get: N.prototype.mq,
      set: N.prototype.pq
  });
  N.prototype.__destroy__ = function() {
      hl(this.gq)
  };

  function O() {
      this.gq = il();
      h(O)[this.gq] = this
  }
  O.prototype = Object.create(w.prototype);
  O.prototype.constructor = O;
  O.prototype.hq = O;
  O.iq = {};
  b.SliderConstraintSettings = O;
  O.prototype.Create = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      return l(jl(e, a, c), Hs)
  };
  O.prototype.get_mSpace = O.prototype.tq = function() {
      return kl(this.gq)
  };
  O.prototype.set_mSpace = O.prototype.wq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      ll(c, a)
  };
  Object.defineProperty(O.prototype, "mSpace", {
      get: O.prototype.tq,
      set: O.prototype.wq
  });
  O.prototype.get_mAutoDetectPoint = O.prototype.Qq = function() {
      return !!ml(this.gq)
  };
  O.prototype.set_mAutoDetectPoint = O.prototype.gr = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      nl(c, a)
  };
  Object.defineProperty(O.prototype, "mAutoDetectPoint", {
      get: O.prototype.Qq,
      set: O.prototype.gr
  });
  O.prototype.get_mPoint1 = O.prototype.xq = function() {
      return l(ol(this.gq), q)
  };
  O.prototype.set_mPoint1 = O.prototype.zq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      pl(c, a)
  };
  Object.defineProperty(O.prototype, "mPoint1", {
      get: O.prototype.xq,
      set: O.prototype.zq
  });
  O.prototype.get_mSliderAxis1 = O.prototype.Ls = function() {
      return l(ql(this.gq), q)
  };
  O.prototype.set_mSliderAxis1 = O.prototype.ku = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      rl(c, a)
  };
  Object.defineProperty(O.prototype, "mSliderAxis1", {
      get: O.prototype.Ls,
      set: O.prototype.ku
  });
  O.prototype.get_mNormalAxis1 = O.prototype.ar = function() {
      return l(sl(this.gq), q)
  };
  O.prototype.set_mNormalAxis1 = O.prototype.sr = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      tl(c, a)
  };
  Object.defineProperty(O.prototype, "mNormalAxis1", {
      get: O.prototype.ar,
      set: O.prototype.sr
  });
  O.prototype.get_mPoint2 = O.prototype.yq = function() {
      return l(ul(this.gq), q)
  };
  O.prototype.set_mPoint2 = O.prototype.Aq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      vl(c, a)
  };
  Object.defineProperty(O.prototype, "mPoint2", {
      get: O.prototype.yq,
      set: O.prototype.Aq
  });
  O.prototype.get_mSliderAxis2 = O.prototype.Ms = function() {
      return l(wl(this.gq), q)
  };
  O.prototype.set_mSliderAxis2 = O.prototype.lu = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      xl(c, a)
  };
  Object.defineProperty(O.prototype, "mSliderAxis2", {
      get: O.prototype.Ms,
      set: O.prototype.lu
  });
  O.prototype.get_mNormalAxis2 = O.prototype.br = function() {
      return l(yl(this.gq), q)
  };
  O.prototype.set_mNormalAxis2 = O.prototype.tr = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      zl(c, a)
  };
  Object.defineProperty(O.prototype, "mNormalAxis2", {
      get: O.prototype.br,
      set: O.prototype.tr
  });
  O.prototype.get_mLimitsMin = O.prototype.Xq = function() {
      return Al(this.gq)
  };
  O.prototype.set_mLimitsMin = O.prototype.nr = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Bl(c, a)
  };
  Object.defineProperty(O.prototype, "mLimitsMin", {
      get: O.prototype.Xq,
      set: O.prototype.nr
  });
  O.prototype.get_mLimitsMax = O.prototype.Wq = function() {
      return Cl(this.gq)
  };
  O.prototype.set_mLimitsMax = O.prototype.mr = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Dl(c, a)
  };
  Object.defineProperty(O.prototype, "mLimitsMax", {
      get: O.prototype.Wq,
      set: O.prototype.mr
  });
  O.prototype.get_mMaxFrictionForce = O.prototype.qs = function() {
      return El(this.gq)
  };
  O.prototype.set_mMaxFrictionForce = O.prototype.Rt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Fl(c, a)
  };
  Object.defineProperty(O.prototype, "mMaxFrictionForce", {
      get: O.prototype.qs,
      set: O.prototype.Rt
  });
  O.prototype.get_mEnabled = O.prototype.lq = function() {
      return !!Gl(this.gq)
  };
  O.prototype.set_mEnabled = O.prototype.oq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Hl(c, a)
  };
  Object.defineProperty(O.prototype, "mEnabled", {
      get: O.prototype.lq,
      set: O.prototype.oq
  });
  O.prototype.get_mNumVelocityStepsOverride = O.prototype.nq = function() {
      return Il(this.gq)
  };
  O.prototype.set_mNumVelocityStepsOverride = O.prototype.qq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Jl(c, a)
  };
  Object.defineProperty(O.prototype, "mNumVelocityStepsOverride", {
      get: O.prototype.nq,
      set: O.prototype.qq
  });
  O.prototype.get_mNumPositionStepsOverride = O.prototype.mq = function() {
      return Kl(this.gq)
  };
  O.prototype.set_mNumPositionStepsOverride = O.prototype.pq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Ll(c, a)
  };
  Object.defineProperty(O.prototype, "mNumPositionStepsOverride", {
      get: O.prototype.mq,
      set: O.prototype.pq
  });
  O.prototype.__destroy__ = function() {
      Ml(this.gq)
  };

  function P() {
      this.gq = Nl();
      h(P)[this.gq] = this
  }
  P.prototype = Object.create(w.prototype);
  P.prototype.constructor = P;
  P.prototype.hq = P;
  P.iq = {};
  b.SwingTwistConstraintSettings = P;
  P.prototype.Create = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      return l(Ol(e, a, c), Hs)
  };
  P.prototype.get_mSpace = P.prototype.tq = function() {
      return Pl(this.gq)
  };
  P.prototype.set_mSpace = P.prototype.wq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Ql(c, a)
  };
  Object.defineProperty(P.prototype, "mSpace", {
      get: P.prototype.tq,
      set: P.prototype.wq
  });
  P.prototype.get_mPosition1 = P.prototype.Fs = function() {
      return l(Rl(this.gq), q)
  };
  P.prototype.set_mPosition1 = P.prototype.eu = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Sl(c, a)
  };
  Object.defineProperty(P.prototype, "mPosition1", {
      get: P.prototype.Fs,
      set: P.prototype.eu
  });
  P.prototype.get_mTwistAxis1 = P.prototype.er = function() {
      return l(Tl(this.gq), q)
  };
  P.prototype.set_mTwistAxis1 = P.prototype.wr = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Ul(c, a)
  };
  Object.defineProperty(P.prototype, "mTwistAxis1", {
      get: P.prototype.er,
      set: P.prototype.wr
  });
  P.prototype.get_mPlaneAxis1 = P.prototype.Bs = function() {
      return l(Vl(this.gq), q)
  };
  P.prototype.set_mPlaneAxis1 = P.prototype.au = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Wl(c, a)
  };
  Object.defineProperty(P.prototype, "mPlaneAxis1", {
      get: P.prototype.Bs,
      set: P.prototype.au
  });
  P.prototype.get_mPosition2 = P.prototype.Gs = function() {
      return l(Xl(this.gq), q)
  };
  P.prototype.set_mPosition2 = P.prototype.fu = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Yl(c, a)
  };
  Object.defineProperty(P.prototype, "mPosition2", {
      get: P.prototype.Gs,
      set: P.prototype.fu
  });
  P.prototype.get_mTwistAxis2 = P.prototype.fr = function() {
      return l(Zl(this.gq), q)
  };
  P.prototype.set_mTwistAxis2 = P.prototype.xr = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      $l(c, a)
  };
  Object.defineProperty(P.prototype, "mTwistAxis2", {
      get: P.prototype.fr,
      set: P.prototype.xr
  });
  P.prototype.get_mPlaneAxis2 = P.prototype.Cs = function() {
      return l(am(this.gq), q)
  };
  P.prototype.set_mPlaneAxis2 = P.prototype.bu = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      bm(c, a)
  };
  Object.defineProperty(P.prototype, "mPlaneAxis2", {
      get: P.prototype.Cs,
      set: P.prototype.bu
  });
  P.prototype.get_mNormalHalfConeAngle = P.prototype.xs = function() {
      return cm(this.gq)
  };
  P.prototype.set_mNormalHalfConeAngle = P.prototype.Xt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      dm(c, a)
  };
  Object.defineProperty(P.prototype, "mNormalHalfConeAngle", {
      get: P.prototype.xs,
      set: P.prototype.Xt
  });
  P.prototype.get_mPlaneHalfConeAngle = P.prototype.Ds = function() {
      return em(this.gq)
  };
  P.prototype.set_mPlaneHalfConeAngle = P.prototype.cu = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      fm(c, a)
  };
  Object.defineProperty(P.prototype, "mPlaneHalfConeAngle", {
      get: P.prototype.Ds,
      set: P.prototype.cu
  });
  P.prototype.get_mTwistMinAngle = P.prototype.Qs = function() {
      return gm(this.gq)
  };
  P.prototype.set_mTwistMinAngle = P.prototype.pu = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      hm(c, a)
  };
  Object.defineProperty(P.prototype, "mTwistMinAngle", {
      get: P.prototype.Qs,
      set: P.prototype.pu
  });
  P.prototype.get_mTwistMaxAngle = P.prototype.Ps = function() {
      return im(this.gq)
  };
  P.prototype.set_mTwistMaxAngle = P.prototype.ou = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      jm(c, a)
  };
  Object.defineProperty(P.prototype, "mTwistMaxAngle", {
      get: P.prototype.Ps,
      set: P.prototype.ou
  });
  P.prototype.get_mMaxFrictionTorque = P.prototype.Zq = function() {
      return km(this.gq)
  };
  P.prototype.set_mMaxFrictionTorque = P.prototype.qr = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      lm(c, a)
  };
  Object.defineProperty(P.prototype, "mMaxFrictionTorque", {
      get: P.prototype.Zq,
      set: P.prototype.qr
  });
  P.prototype.get_mEnabled = P.prototype.lq = function() {
      return !!mm(this.gq)
  };
  P.prototype.set_mEnabled = P.prototype.oq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      nm(c, a)
  };
  Object.defineProperty(P.prototype, "mEnabled", {
      get: P.prototype.lq,
      set: P.prototype.oq
  });
  P.prototype.get_mNumVelocityStepsOverride = P.prototype.nq = function() {
      return om(this.gq)
  };
  P.prototype.set_mNumVelocityStepsOverride = P.prototype.qq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      pm(c, a)
  };
  Object.defineProperty(P.prototype, "mNumVelocityStepsOverride", {
      get: P.prototype.nq,
      set: P.prototype.qq
  });
  P.prototype.get_mNumPositionStepsOverride = P.prototype.mq = function() {
      return qm(this.gq)
  };
  P.prototype.set_mNumPositionStepsOverride = P.prototype.pq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      rm(c, a)
  };
  Object.defineProperty(P.prototype, "mNumPositionStepsOverride", {
      get: P.prototype.mq,
      set: P.prototype.pq
  });
  P.prototype.__destroy__ = function() {
      sm(this.gq)
  };

  function it(a) {
      a && "object" === typeof a && (a = a.gq);
      this.gq = void 0 === a ? tm() : um(a);
      h(it)[this.gq] = this
  }
  it.prototype = Object.create(g.prototype);
  it.prototype.constructor = it;
  it.prototype.hq = it;
  it.iq = {};
  b.BodyID = it;
  it.prototype.GetIndex = function() {
      return wm(this.gq)
  };
  it.prototype.GetIndexAndSequenceNumber = function() {
      return xm(this.gq)
  };
  it.prototype.__destroy__ = function() {
      ym(this.gq)
  };

  function Q() {
      throw "cannot construct a MotionProperties, no constructor in IDL";
  }
  Q.prototype = Object.create(g.prototype);
  Q.prototype.constructor = Q;
  Q.prototype.hq = Q;
  Q.iq = {};
  b.MotionProperties = Q;
  Q.prototype.GetMotionQuality = function() {
      return zm(this.gq)
  };
  Q.prototype.GetLinearVelocity = function() {
      return l(Am(this.gq), q)
  };
  Q.prototype.SetLinearVelocity = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Bm(c, a)
  };
  Q.prototype.SetLinearVelocityClamped = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Cm(c, a)
  };
  Q.prototype.GetAngularVelocity = function() {
      return l(Dm(this.gq), q)
  };
  Q.prototype.SetAngularVelocity = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Em(c, a)
  };
  Q.prototype.SetAngularVelocityClamped = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Fm(c, a)
  };
  Q.prototype.MoveKinematic = function(a, c, e) {
      var f = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      Gm(f, a, c, e)
  };
  Q.prototype.GetMaxLinearVelocity = function() {
      return Hm(this.gq)
  };
  Q.prototype.SetMaxLinearVelocity = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Im(c, a)
  };
  Q.prototype.GetMaxAngularVelocity = function() {
      return Jm(this.gq)
  };
  Q.prototype.SetMaxAngularVelocity = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Km(c, a)
  };
  Q.prototype.GetLinearDamping = function() {
      return Lm(this.gq)
  };
  Q.prototype.SetLinearDamping = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Mm(c, a)
  };
  Q.prototype.GetAngularDamping = function() {
      return Nm(this.gq)
  };
  Q.prototype.SetAngularDamping = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Om(c, a)
  };
  Q.prototype.GetInverseMass = function() {
      return Pm(this.gq)
  };
  Q.prototype.SetInverseMass = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Qm(c, a)
  };
  Q.prototype.GetInverseInertiaDiagonal = function() {
      return l(Rm(this.gq), q)
  };
  Q.prototype.GetInertiaRotation = function() {
      return l(Sm(this.gq), x)
  };
  Q.prototype.SetInverseInertia = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      Tm(e, a, c)
  };
  Q.prototype.__destroy__ = function() {
      Um(this.gq)
  };

  function jt(a) {
      a && "object" === typeof a && (a = a.gq);
      this.gq = Vm(a);
      h(jt)[this.gq] = this
  }
  jt.prototype = Object.create(Is.prototype);
  jt.prototype.constructor = jt;
  jt.prototype.hq = jt;
  jt.iq = {};
  b.GroupFilterTable = jt;
  jt.prototype.DisableCollision = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      Wm(e, a, c)
  };
  jt.prototype.EnableCollision = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      Xm(e, a, c)
  };
  jt.prototype.IsCollisionEnabled = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      return !!Ym(e, a, c)
  };
  jt.prototype.__destroy__ = function() {
      Zm(this.gq)
  };

  function kt(a, c, e) {
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      this.gq = void 0 === a ? $m() : void 0 === c ? _emscripten_bind_CollisionGroup_CollisionGroup_1(a) : void 0 === e ? _emscripten_bind_CollisionGroup_CollisionGroup_2(a, c) : an(a, c, e);
      h(kt)[this.gq] = this
  }
  kt.prototype = Object.create(g.prototype);
  kt.prototype.constructor = kt;
  kt.prototype.hq = kt;
  kt.iq = {};
  b.CollisionGroup = kt;
  kt.prototype.SetGroupFilter = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      bn(c, a)
  };
  kt.prototype.GetGroupFilter = function() {
      return l(cn(this.gq), Is)
  };
  kt.prototype.SetGroupID = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      dn(c, a)
  };
  kt.prototype.GetGroupID = function() {
      return en(this.gq)
  };
  kt.prototype.SetSubGroupID = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      fn(c, a)
  };
  kt.prototype.GetSubGroupID = function() {
      gn(this.gq)
  };
  kt.prototype.__destroy__ = function() {
      hn(this.gq)
  };

  function Body() {
      throw "cannot construct a Body, no constructor in IDL";
  }
  Body.prototype = Object.create(g.prototype);
  Body.prototype.constructor = Body;
  Body.prototype.hq = Body;
  Body.iq = {};
  b.Body = Body;
  Body.prototype.GetID = function() {
      return l(jn(this.gq), it)
  };
  Body.prototype.IsActive = function() {
      return !!kn(this.gq)
  };
  Body.prototype.IsStatic = function() {
      return !!ln(this.gq)
  };
  Body.prototype.IsKinematic = function() {
      return !!mn(this.gq)
  };
  Body.prototype.IsDynamic = function() {
      return !!nn(this.gq)
  };
  Body.prototype.CanBeKinematicOrDynamic = function() {
      return !!on(this.gq)
  };
  Body.prototype.GetBodyType = function() {
      return pn(this.gq)
  };
  Body.prototype.GetMotionType = function() {
      return qn(this.gq)
  };
  Body.prototype.SetMotionType = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      rn(c, a)
  };
  Body.prototype.SetIsSensor = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      sn(c, a)
  };
  Body.prototype.IsSensor = function() {
      return !!tn(this.gq)
  };
  Body.prototype.GetObjectLayer = function() {
      return un(this.gq)
  };
  Body.prototype.GetCollisionGroup = function() {
      return l(vn(this.gq), kt)
  };
  Body.prototype.GetAllowSleeping = function() {
      return !!wn(this.gq)
  };
  Body.prototype.SetAllowSleeping = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      xn(c, a)
  };
  Body.prototype.GetFriction = function() {
      return yn(this.gq)
  };
  Body.prototype.SetFriction = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      zn(c, a)
  };
  Body.prototype.GetRestitution = function() {
      return An(this.gq)
  };
  Body.prototype.SetRestitution = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Bn(c, a)
  };
  Body.prototype.GetLinearVelocity = function() {
      return l(Cn(this.gq), q)
  };
  Body.prototype.SetLinearVelocity = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Dn(c, a)
  };
  Body.prototype.SetLinearVelocityClamped = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      En(c, a)
  };
  Body.prototype.GetAngularVelocity = function() {
      return l(Fn(this.gq), q)
  };
  Body.prototype.SetAngularVelocity = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Gn(c, a)
  };
  Body.prototype.SetAngularVelocityClamped = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Hn(c, a)
  };
  Body.prototype.AddForce = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      void 0 === c ? In(e, a) : Jn(e, a, c)
  };
  Body.prototype.AddTorque = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Kn(c, a)
  };
  Body.prototype.AddImpulse = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      void 0 === c ? Ln(e, a) : Mn(e, a, c)
  };
  Body.prototype.MoveKinematic = function(a, c, e) {
      var f = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      Nn(f, a, c, e)
  };
  Body.prototype.IsInBroadPhase = function() {
      return !!On(this.gq)
  };
  Body.prototype.GetShape = function() {
      return l(Pn(this.gq), n)
  };
  Body.prototype.GetPosition = function() {
      return l(Qn(this.gq), q)
  };
  Body.prototype.GetRotation = function() {
      return l(Rn(this.gq), x)
  };
  Body.prototype.GetWorldTransform = function() {
      return l(Sn(this.gq), Ms)
  };
  Body.prototype.GetCenterOfMassPosition = function() {
      return l(Tn(this.gq), q)
  };
  Body.prototype.GetCenterOfMassTransform = function() {
      return l(Un(this.gq), Ms)
  };
  Body.prototype.GetWorldSpaceBounds = function() {
      return l(Vn(this.gq), p)
  };
  Body.prototype.GetMotionProperties = function() {
      return l(Wn(this.gq), Q)
  };
  Body.prototype.__destroy__ = function() {
      Xn(this.gq)
  };

  function R() {
      throw "cannot construct a BodyInterface, no constructor in IDL";
  }
  R.prototype = Object.create(g.prototype);
  R.prototype.constructor = R;
  R.prototype.hq = R;
  R.iq = {};
  b.BodyInterface = R;
  R.prototype.CreateBody = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      return l(Yn(c, a), Body)
  };
  R.prototype.CreateSoftBody = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      return l(Zn(c, a), Body)
  };
  R.prototype.DestroyBody = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      $n(c, a)
  };
  R.prototype.AddBody = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      ao(e, a, c)
  };
  R.prototype.RemoveBody = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      bo(c, a)
  };
  R.prototype.IsAdded = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      return !!co(c, a)
  };
  R.prototype.CreateAndAddBody = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      return l(eo(e, a, c), it)
  };
  R.prototype.CreateAndAddSoftBody = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      return l(fo(e, a, c), it)
  };
  R.prototype.GetShape = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      return l(go(c, a), n)
  };
  R.prototype.SetShape = function(a, c, e, f) {
      var t = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      f && "object" === typeof f && (f = f.gq);
      ho(t, a, c, e, f)
  };
  R.prototype.SetObjectLayer = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      io(e, a, c)
  };
  R.prototype.GetObjectLayer = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      return jo(c, a)
  };
  R.prototype.SetPositionAndRotation = function(a, c, e, f) {
      var t = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      f && "object" === typeof f && (f = f.gq);
      ko(t, a, c, e, f)
  };
  R.prototype.SetPositionAndRotationWhenChanged = function(a, c, e, f) {
      var t = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      f && "object" === typeof f && (f = f.gq);
      lo(t, a, c, e, f)
  };
  R.prototype.GetPositionAndRotation = function(a, c, e) {
      var f = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      mo(f, a, c, e)
  };
  R.prototype.SetPosition = function(a, c, e) {
      var f = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      no(f, a, c, e)
  };
  R.prototype.GetPosition = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      return l(oo(c, a), q)
  };
  R.prototype.SetRotation = function(a, c, e) {
      var f = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      po(f, a, c, e)
  };
  R.prototype.GetRotation = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      return l(qo(c, a), x)
  };
  R.prototype.MoveKinematic = function(a, c, e, f) {
      var t = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      f && "object" === typeof f && (f = f.gq);
      ro(t, a, c, e, f)
  };
  R.prototype.ActivateBody = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      so(c, a)
  };
  R.prototype.DeactivateBody = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      to(c, a)
  };
  R.prototype.IsActive = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      return !!uo(c, a)
  };
  R.prototype.SetMotionType = function(a, c, e) {
      var f = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      vo(f, a, c, e)
  };
  R.prototype.SetMotionQuality = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      wo(e, a, c)
  };
  R.prototype.__destroy__ = function() {
      xo(this.gq)
  };

  function lt() {
      throw "cannot construct a PhysicsSystem, no constructor in IDL";
  }
  lt.prototype = Object.create(g.prototype);
  lt.prototype.constructor = lt;
  lt.prototype.hq = lt;
  lt.iq = {};
  b.PhysicsSystem = lt;
  lt.prototype.GetBodyInterface = function() {
      return l(yo(this.gq), R)
  };
  lt.prototype.SetGravity = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      zo(c, a)
  };
  lt.prototype.GetGravity = function() {
      return l(Ao(this.gq), q)
  };
  lt.prototype.GetNumBodies = function() {
      return Bo(this.gq)
  };
  lt.prototype.GetNumActiveBodies = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      return Co(c, a)
  };
  lt.prototype.GetMaxBodies = function() {
      return Do(this.gq)
  };
  lt.prototype.AddConstraint = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Eo(c, a)
  };
  lt.prototype.RemoveConstraint = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Fo(c, a)
  };
  lt.prototype.__destroy__ = function() {
      Go(this.gq)
  };

  function mt() {
      this.gq = Ho();
      h(mt)[this.gq] = this
  }
  mt.prototype = Object.create(g.prototype);
  mt.prototype.constructor = mt;
  mt.prototype.hq = mt;
  mt.iq = {};
  b.MassProperties = mt;
  mt.prototype.get_mMass = mt.prototype.cs = function() {
      return Io(this.gq)
  };
  mt.prototype.set_mMass = mt.prototype.Gt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Jo(c, a)
  };
  Object.defineProperty(mt.prototype, "mMass", {
      get: mt.prototype.cs,
      set: mt.prototype.Gt
  });
  mt.prototype.get_mInertia = mt.prototype.Vr = function() {
      return l(Ko(this.gq), Ms)
  };
  mt.prototype.set_mInertia = mt.prototype.zt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Lo(c, a)
  };
  Object.defineProperty(mt.prototype, "mInertia", {
      get: mt.prototype.Vr,
      set: mt.prototype.zt
  });
  mt.prototype.__destroy__ = function() {
      Mo(this.gq)
  };

  function S(a, c, e, f, t) {
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      f && "object" === typeof f && (f = f.gq);
      t && "object" === typeof t && (t = t.gq);
      this.gq = No(a, c, e, f, t);
      h(S)[this.gq] = this
  }
  S.prototype = Object.create(g.prototype);
  S.prototype.constructor = S;
  S.prototype.hq = S;
  S.iq = {};
  b.BodyCreationSettings = S;
  S.prototype.get_mPosition = S.prototype.Cq = function() {
      return l(Oo(this.gq), q)
  };
  S.prototype.set_mPosition = S.prototype.Dq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Po(c, a)
  };
  Object.defineProperty(S.prototype, "mPosition", {
      get: S.prototype.Cq,
      set: S.prototype.Dq
  });
  S.prototype.get_mRotation = S.prototype.Iq = function() {
      return l(Qo(this.gq), x)
  };
  S.prototype.set_mRotation = S.prototype.Mq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Ro(c, a)
  };
  Object.defineProperty(S.prototype, "mRotation", {
      get: S.prototype.Iq,
      set: S.prototype.Mq
  });
  S.prototype.get_mLinearVelocity = S.prototype.$r = function() {
      return l(So(this.gq), q)
  };
  S.prototype.set_mLinearVelocity = S.prototype.Et = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      To(c, a)
  };
  Object.defineProperty(S.prototype, "mLinearVelocity", {
      get: S.prototype.$r,
      set: S.prototype.Et
  });
  S.prototype.get_mAngularVelocity = S.prototype.Cr = function() {
      return l(Uo(this.gq), q)
  };
  S.prototype.set_mAngularVelocity = S.prototype.gt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Vo(c, a)
  };
  Object.defineProperty(S.prototype, "mAngularVelocity", {
      get: S.prototype.Cr,
      set: S.prototype.gt
  });
  S.prototype.get_mUserData = S.prototype.jq = function() {
      return Wo(this.gq)
  };
  S.prototype.set_mUserData = S.prototype.kq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Xo(c, a)
  };
  Object.defineProperty(S.prototype, "mUserData", {
      get: S.prototype.jq,
      set: S.prototype.kq
  });
  S.prototype.get_mObjectLayer = S.prototype.cr = function() {
      return Yo(this.gq)
  };
  S.prototype.set_mObjectLayer = S.prototype.ur = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Zo(c, a)
  };
  Object.defineProperty(S.prototype, "mObjectLayer", {
      get: S.prototype.cr,
      set: S.prototype.ur
  });
  S.prototype.get_mCollisionGroup = S.prototype.Rq = function() {
      return l($o(this.gq), kt)
  };
  S.prototype.set_mCollisionGroup = S.prototype.hr = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      ap(c, a)
  };
  Object.defineProperty(S.prototype, "mCollisionGroup", {
      get: S.prototype.Rq,
      set: S.prototype.hr
  });
  S.prototype.get_mMotionType = S.prototype.vs = function() {
      return bp(this.gq)
  };
  S.prototype.set_mMotionType = S.prototype.Wt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      cp(c, a)
  };
  Object.defineProperty(S.prototype, "mMotionType", {
      get: S.prototype.vs,
      set: S.prototype.Wt
  });
  S.prototype.get_mAllowDynamicOrKinematic = S.prototype.zr = function() {
      return !!dp(this.gq)
  };
  S.prototype.set_mAllowDynamicOrKinematic = S.prototype.dt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      ep(c, a)
  };
  Object.defineProperty(S.prototype, "mAllowDynamicOrKinematic", {
      get: S.prototype.zr,
      set: S.prototype.dt
  });
  S.prototype.get_mIsSensor = S.prototype.Yr = function() {
      return !!fp(this.gq)
  };
  S.prototype.set_mIsSensor = S.prototype.Ct = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      gp(c, a)
  };
  Object.defineProperty(S.prototype, "mIsSensor", {
      get: S.prototype.Yr,
      set: S.prototype.Ct
  });
  S.prototype.get_mMotionQuality = S.prototype.us = function() {
      return hp(this.gq)
  };
  S.prototype.set_mMotionQuality = S.prototype.Vt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      ip(c, a)
  };
  Object.defineProperty(S.prototype, "mMotionQuality", {
      get: S.prototype.us,
      set: S.prototype.Vt
  });
  S.prototype.get_mAllowSleeping = S.prototype.Ar = function() {
      return !!jp(this.gq)
  };
  S.prototype.set_mAllowSleeping = S.prototype.et = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      kp(c, a)
  };
  Object.defineProperty(S.prototype, "mAllowSleeping", {
      get: S.prototype.Ar,
      set: S.prototype.et
  });
  S.prototype.get_mFriction = S.prototype.Uq = function() {
      return lp(this.gq)
  };
  S.prototype.set_mFriction = S.prototype.kr = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      mp(c, a)
  };
  Object.defineProperty(S.prototype, "mFriction", {
      get: S.prototype.Uq,
      set: S.prototype.kr
  });
  S.prototype.get_mRestitution = S.prototype.dr = function() {
      return np(this.gq)
  };
  S.prototype.set_mRestitution = S.prototype.vr = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      op(c, a)
  };
  Object.defineProperty(S.prototype, "mRestitution", {
      get: S.prototype.dr,
      set: S.prototype.vr
  });
  S.prototype.get_mLinearDamping = S.prototype.Yq = function() {
      return pp(this.gq)
  };
  S.prototype.set_mLinearDamping = S.prototype.pr = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      qp(c, a)
  };
  Object.defineProperty(S.prototype, "mLinearDamping", {
      get: S.prototype.Yq,
      set: S.prototype.pr
  });
  S.prototype.get_mAngularDamping = S.prototype.Br = function() {
      return rp(this.gq)
  };
  S.prototype.set_mAngularDamping = S.prototype.ft = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      sp(c, a)
  };
  Object.defineProperty(S.prototype, "mAngularDamping", {
      get: S.prototype.Br,
      set: S.prototype.ft
  });
  S.prototype.get_mMaxLinearVelocity = S.prototype.$q = function() {
      return tp(this.gq)
  };
  S.prototype.set_mMaxLinearVelocity = S.prototype.rr = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      up(c, a)
  };
  Object.defineProperty(S.prototype, "mMaxLinearVelocity", {
      get: S.prototype.$q,
      set: S.prototype.rr
  });
  S.prototype.get_mMaxAngularVelocity = S.prototype.hs = function() {
      return vp(this.gq)
  };
  S.prototype.set_mMaxAngularVelocity = S.prototype.Kt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      wp(c, a)
  };
  Object.defineProperty(S.prototype, "mMaxAngularVelocity", {
      get: S.prototype.hs,
      set: S.prototype.Kt
  });
  S.prototype.get_mGravityFactor = S.prototype.Vq = function() {
      return xp(this.gq)
  };
  S.prototype.set_mGravityFactor = S.prototype.lr = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      yp(c, a)
  };
  Object.defineProperty(S.prototype, "mGravityFactor", {
      get: S.prototype.Vq,
      set: S.prototype.lr
  });
  S.prototype.get_mOverrideMassProperties = S.prototype.As = function() {
      return zp(this.gq)
  };
  S.prototype.set_mOverrideMassProperties = S.prototype.$t = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Ap(c, a)
  };
  Object.defineProperty(S.prototype, "mOverrideMassProperties", {
      get: S.prototype.As,
      set: S.prototype.$t
  });
  S.prototype.get_mInertiaMultiplier = S.prototype.Wr = function() {
      return Bp(this.gq)
  };
  S.prototype.set_mInertiaMultiplier = S.prototype.At = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Cp(c, a)
  };
  Object.defineProperty(S.prototype, "mInertiaMultiplier", {
      get: S.prototype.Wr,
      set: S.prototype.At
  });
  S.prototype.get_mMassPropertiesOverride = S.prototype.ds = function() {
      return l(Dp(this.gq), mt)
  };
  S.prototype.set_mMassPropertiesOverride = S.prototype.Ht = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Ep(c, a)
  };
  Object.defineProperty(S.prototype, "mMassPropertiesOverride", {
      get: S.prototype.ds,
      set: S.prototype.Ht
  });
  S.prototype.__destroy__ = function() {
      Fp(this.gq)
  };

  function T() {
      this.gq = Gp();
      h(T)[this.gq] = this
  }
  T.prototype = Object.create(g.prototype);
  T.prototype.constructor = T;
  T.prototype.hq = T;
  T.iq = {};
  b.SoftBodySharedSettingsVertex = T;
  T.prototype.get_mPosition = T.prototype.Cq = function() {
      return l(Hp(this.gq), y)
  };
  T.prototype.set_mPosition = T.prototype.Dq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Ip(c, a)
  };
  Object.defineProperty(T.prototype, "mPosition", {
      get: T.prototype.Cq,
      set: T.prototype.Dq
  });
  T.prototype.get_mVelocity = T.prototype.Ts = function() {
      return l(Jp(this.gq), y)
  };
  T.prototype.set_mVelocity = T.prototype.su = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Kp(c, a)
  };
  Object.defineProperty(T.prototype, "mVelocity", {
      get: T.prototype.Ts,
      set: T.prototype.su
  });
  T.prototype.get_mInvMass = T.prototype.Xr = function() {
      return Lp(this.gq)
  };
  T.prototype.set_mInvMass = T.prototype.Bt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Mp(c, a)
  };
  Object.defineProperty(T.prototype, "mInvMass", {
      get: T.prototype.Xr,
      set: T.prototype.Bt
  });
  T.prototype.__destroy__ = function() {
      Np(this.gq)
  };

  function nt(a, c, e, f) {
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      f && "object" === typeof f && (f = f.gq);
      this.gq = Op(a, c, e, f);
      h(nt)[this.gq] = this
  }
  nt.prototype = Object.create(g.prototype);
  nt.prototype.constructor = nt;
  nt.prototype.hq = nt;
  nt.iq = {};
  b.SoftBodySharedSettingsFace = nt;
  nt.prototype.get_mVertex = nt.prototype.Jq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      return Pp(c, a)
  };
  nt.prototype.set_mVertex = nt.prototype.Nq = function(a, c) {
      var e = this.gq;
      Es();
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      Qp(e, a, c)
  };
  Object.defineProperty(nt.prototype, "mVertex", {
      get: nt.prototype.Jq,
      set: nt.prototype.Nq
  });
  nt.prototype.get_mMaterialIndex = nt.prototype.Gq = function() {
      return Rp(this.gq)
  };
  nt.prototype.set_mMaterialIndex = nt.prototype.Kq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Sp(c, a)
  };
  Object.defineProperty(nt.prototype, "mMaterialIndex", {
      get: nt.prototype.Gq,
      set: nt.prototype.Kq
  });
  nt.prototype.__destroy__ = function() {
      Tp(this.gq)
  };

  function V(a, c, e) {
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      this.gq = Up(a, c, e);
      h(V)[this.gq] = this
  }
  V.prototype = Object.create(g.prototype);
  V.prototype.constructor = V;
  V.prototype.hq = V;
  V.iq = {};
  b.SoftBodySharedSettingsEdge = V;
  V.prototype.get_mVertex = V.prototype.Jq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      return Vp(c, a)
  };
  V.prototype.set_mVertex = V.prototype.Nq = function(a, c) {
      var e = this.gq;
      Es();
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      Wp(e, a, c)
  };
  Object.defineProperty(V.prototype, "mVertex", {
      get: V.prototype.Jq,
      set: V.prototype.Nq
  });
  V.prototype.get_mRestLength = V.prototype.Is = function() {
      return Xp(this.gq)
  };
  V.prototype.set_mRestLength = V.prototype.hu = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Yp(c, a)
  };
  Object.defineProperty(V.prototype, "mRestLength", {
      get: V.prototype.Is,
      set: V.prototype.hu
  });
  V.prototype.get_mCompliance = V.prototype.Sq = function() {
      return Zp(this.gq)
  };
  V.prototype.set_mCompliance = V.prototype.ir = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      $p(c, a)
  };
  Object.defineProperty(V.prototype, "mCompliance", {
      get: V.prototype.Sq,
      set: V.prototype.ir
  });
  V.prototype.__destroy__ = function() {
      aq(this.gq)
  };

  function W(a, c, e, f, t) {
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      f && "object" === typeof f && (f = f.gq);
      t && "object" === typeof t && (t = t.gq);
      this.gq = bq(a, c, e, f, t);
      h(W)[this.gq] = this
  }
  W.prototype = Object.create(g.prototype);
  W.prototype.constructor = W;
  W.prototype.hq = W;
  W.iq = {};
  b.SoftBodySharedSettingsVolume = W;
  W.prototype.get_mVertex = W.prototype.Jq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      return cq(c, a)
  };
  W.prototype.set_mVertex = W.prototype.Nq = function(a, c) {
      var e = this.gq;
      Es();
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      dq(e, a, c)
  };
  Object.defineProperty(W.prototype, "mVertex", {
      get: W.prototype.Jq,
      set: W.prototype.Nq
  });
  W.prototype.get_mSixRestVolume = W.prototype.Ks = function() {
      return eq(this.gq)
  };
  W.prototype.set_mSixRestVolume = W.prototype.ju = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      fq(c, a)
  };
  Object.defineProperty(W.prototype, "mSixRestVolume", {
      get: W.prototype.Ks,
      set: W.prototype.ju
  });
  W.prototype.get_mCompliance = W.prototype.Sq = function() {
      return gq(this.gq)
  };
  W.prototype.set_mCompliance = W.prototype.ir = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      hq(c, a)
  };
  Object.defineProperty(W.prototype, "mCompliance", {
      get: W.prototype.Sq,
      set: W.prototype.ir
  });
  W.prototype.__destroy__ = function() {
      iq(this.gq)
  };

  function ot() {
      throw "cannot construct a ArraySoftBodySharedSettingsVertex, no constructor in IDL";
  }
  ot.prototype = Object.create(g.prototype);
  ot.prototype.constructor = ot;
  ot.prototype.hq = ot;
  ot.iq = {};
  b.ArraySoftBodySharedSettingsVertex = ot;
  ot.prototype.size = ot.prototype.size = function() {
      return jq(this.gq)
  };
  ot.prototype.at = ot.prototype.at = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      return l(kq(c, a), T)
  };
  ot.prototype.push_back = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      lq(c, a)
  };
  ot.prototype.reserve = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      mq(c, a)
  };
  ot.prototype.resize = ot.prototype.resize = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      nq(c, a)
  };
  ot.prototype.__destroy__ = function() {
      oq(this.gq)
  };

  function pt() {
      throw "cannot construct a ArraySoftBodySharedSettingsFace, no constructor in IDL";
  }
  pt.prototype = Object.create(g.prototype);
  pt.prototype.constructor = pt;
  pt.prototype.hq = pt;
  pt.iq = {};
  b.ArraySoftBodySharedSettingsFace = pt;
  pt.prototype.size = pt.prototype.size = function() {
      return pq(this.gq)
  };
  pt.prototype.at = pt.prototype.at = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      return l(qq(c, a), nt)
  };
  pt.prototype.push_back = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      rq(c, a)
  };
  pt.prototype.reserve = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      sq(c, a)
  };
  pt.prototype.resize = pt.prototype.resize = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      tq(c, a)
  };
  pt.prototype.__destroy__ = function() {
      uq(this.gq)
  };

  function qt() {
      throw "cannot construct a ArraySoftBodySharedSettingsEdge, no constructor in IDL";
  }
  qt.prototype = Object.create(g.prototype);
  qt.prototype.constructor = qt;
  qt.prototype.hq = qt;
  qt.iq = {};
  b.ArraySoftBodySharedSettingsEdge = qt;
  qt.prototype.size = qt.prototype.size = function() {
      return vq(this.gq)
  };
  qt.prototype.at = qt.prototype.at = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      return l(wq(c, a), V)
  };
  qt.prototype.push_back = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      xq(c, a)
  };
  qt.prototype.reserve = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      yq(c, a)
  };
  qt.prototype.resize = qt.prototype.resize = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      zq(c, a)
  };
  qt.prototype.__destroy__ = function() {
      Aq(this.gq)
  };

  function rt() {
      throw "cannot construct a ArraySoftBodySharedSettingsVolume, no constructor in IDL";
  }
  rt.prototype = Object.create(g.prototype);
  rt.prototype.constructor = rt;
  rt.prototype.hq = rt;
  rt.iq = {};
  b.ArraySoftBodySharedSettingsVolume = rt;
  rt.prototype.size = rt.prototype.size = function() {
      return Bq(this.gq)
  };
  rt.prototype.at = rt.prototype.at = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      return l(Cq(c, a), W)
  };
  rt.prototype.push_back = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Dq(c, a)
  };
  rt.prototype.reserve = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Eq(c, a)
  };
  rt.prototype.resize = rt.prototype.resize = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Fq(c, a)
  };
  rt.prototype.__destroy__ = function() {
      Gq(this.gq)
  };

  function X() {
      this.gq = Hq();
      h(X)[this.gq] = this
  }
  X.prototype = Object.create(g.prototype);
  X.prototype.constructor = X;
  X.prototype.hq = X;
  X.iq = {};
  b.SoftBodySharedSettings = X;
  X.prototype.AddFace = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Iq(c, a)
  };
  X.prototype.CalculateEdgeLengths = function() {
      Jq(this.gq)
  };
  X.prototype.CalculateVolumeConstraintVolumes = function() {
      Kq(this.gq)
  };
  X.prototype.get_mVertices = X.prototype.Us = function() {
      return l(Lq(this.gq), ot)
  };
  X.prototype.set_mVertices = X.prototype.tu = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Mq(c, a)
  };
  Object.defineProperty(X.prototype, "mVertices", {
      get: X.prototype.Us,
      set: X.prototype.tu
  });
  X.prototype.get_mFaces = X.prototype.Kr = function() {
      return l(Nq(this.gq), pt)
  };
  X.prototype.set_mFaces = X.prototype.ot = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Oq(c, a)
  };
  Object.defineProperty(X.prototype, "mFaces", {
      get: X.prototype.Kr,
      set: X.prototype.ot
  });
  X.prototype.get_mEdgeConstraints = X.prototype.Jr = function() {
      return l(Pq(this.gq), qt)
  };
  X.prototype.set_mEdgeConstraints = X.prototype.nt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Qq(c, a)
  };
  Object.defineProperty(X.prototype, "mEdgeConstraints", {
      get: X.prototype.Jr,
      set: X.prototype.nt
  });
  X.prototype.get_mVolumeConstraints = X.prototype.Vs = function() {
      return l(Rq(this.gq), rt)
  };
  X.prototype.set_mVolumeConstraints = X.prototype.uu = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Sq(c, a)
  };
  Object.defineProperty(X.prototype, "mVolumeConstraints", {
      get: X.prototype.Vs,
      set: X.prototype.uu
  });
  X.prototype.get_mMaterials = X.prototype.es = function() {
      return l(Tq(this.gq), Ns)
  };
  X.prototype.set_mMaterials = X.prototype.It = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Uq(c, a)
  };
  Object.defineProperty(X.prototype, "mMaterials", {
      get: X.prototype.es,
      set: X.prototype.It
  });
  X.prototype.__destroy__ = function() {
      Vq(this.gq)
  };

  function Y(a, c, e, f) {
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      e && "object" === typeof e && (e = e.gq);
      f && "object" === typeof f && (f = f.gq);
      this.gq = Wq(a, c, e, f);
      h(Y)[this.gq] = this
  }
  Y.prototype = Object.create(g.prototype);
  Y.prototype.constructor = Y;
  Y.prototype.hq = Y;
  Y.iq = {};
  b.SoftBodyCreationSettings = Y;
  Y.prototype.get_mPosition = Y.prototype.Cq = function() {
      return l(Xq(this.gq), q)
  };
  Y.prototype.set_mPosition = Y.prototype.Dq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Yq(c, a)
  };
  Object.defineProperty(Y.prototype, "mPosition", {
      get: Y.prototype.Cq,
      set: Y.prototype.Dq
  });
  Y.prototype.get_mRotation = Y.prototype.Iq = function() {
      return l(Zq(this.gq), x)
  };
  Y.prototype.set_mRotation = Y.prototype.Mq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      $q(c, a)
  };
  Object.defineProperty(Y.prototype, "mRotation", {
      get: Y.prototype.Iq,
      set: Y.prototype.Mq
  });
  Y.prototype.get_mUserData = Y.prototype.jq = function() {
      return ar(this.gq)
  };
  Y.prototype.set_mUserData = Y.prototype.kq = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      br(c, a)
  };
  Object.defineProperty(Y.prototype, "mUserData", {
      get: Y.prototype.jq,
      set: Y.prototype.kq
  });
  Y.prototype.get_mObjectLayer = Y.prototype.cr = function() {
      return cr(this.gq)
  };
  Y.prototype.set_mObjectLayer = Y.prototype.ur = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      dr(c, a)
  };
  Object.defineProperty(Y.prototype, "mObjectLayer", {
      get: Y.prototype.cr,
      set: Y.prototype.ur
  });
  Y.prototype.get_mCollisionGroup = Y.prototype.Rq = function() {
      return l(er(this.gq), kt)
  };
  Y.prototype.set_mCollisionGroup = Y.prototype.hr = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      fr(c, a)
  };
  Object.defineProperty(Y.prototype, "mCollisionGroup", {
      get: Y.prototype.Rq,
      set: Y.prototype.hr
  });
  Y.prototype.get_mNumIterations = Y.prototype.ys = function() {
      return gr(this.gq)
  };
  Y.prototype.set_mNumIterations = Y.prototype.Yt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      hr(c, a)
  };
  Object.defineProperty(Y.prototype, "mNumIterations", {
      get: Y.prototype.ys,
      set: Y.prototype.Yt
  });
  Y.prototype.get_mLinearDamping = Y.prototype.Yq = function() {
      return ir(this.gq)
  };
  Y.prototype.set_mLinearDamping = Y.prototype.pr = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      jr(c, a)
  };
  Object.defineProperty(Y.prototype, "mLinearDamping", {
      get: Y.prototype.Yq,
      set: Y.prototype.pr
  });
  Y.prototype.get_mMaxLinearVelocity = Y.prototype.$q = function() {
      return kr(this.gq)
  };
  Y.prototype.set_mMaxLinearVelocity = Y.prototype.rr = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      lr(c, a)
  };
  Object.defineProperty(Y.prototype, "mMaxLinearVelocity", {
      get: Y.prototype.$q,
      set: Y.prototype.rr
  });
  Y.prototype.get_mRestitution = Y.prototype.dr = function() {
      return mr(this.gq)
  };
  Y.prototype.set_mRestitution = Y.prototype.vr = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      nr(c, a)
  };
  Object.defineProperty(Y.prototype, "mRestitution", {
      get: Y.prototype.dr,
      set: Y.prototype.vr
  });
  Y.prototype.get_mFriction = Y.prototype.Uq = function() {
      return or(this.gq)
  };
  Y.prototype.set_mFriction = Y.prototype.kr = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      pr(c, a)
  };
  Object.defineProperty(Y.prototype, "mFriction", {
      get: Y.prototype.Uq,
      set: Y.prototype.kr
  });
  Y.prototype.get_mPressure = Y.prototype.Hs = function() {
      return qr(this.gq)
  };
  Y.prototype.set_mPressure = Y.prototype.gu = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      rr(c, a)
  };
  Object.defineProperty(Y.prototype, "mPressure", {
      get: Y.prototype.Hs,
      set: Y.prototype.gu
  });
  Y.prototype.get_mGravityFactor = Y.prototype.Vq = function() {
      return sr(this.gq)
  };
  Y.prototype.set_mGravityFactor = Y.prototype.lr = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      tr(c, a)
  };
  Object.defineProperty(Y.prototype, "mGravityFactor", {
      get: Y.prototype.Vq,
      set: Y.prototype.lr
  });
  Y.prototype.get_mUpdatePosition = Y.prototype.Rs = function() {
      return !!ur(this.gq)
  };
  Y.prototype.set_mUpdatePosition = Y.prototype.qu = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      vr(c, a)
  };
  Object.defineProperty(Y.prototype, "mUpdatePosition", {
      get: Y.prototype.Rs,
      set: Y.prototype.qu
  });
  Y.prototype.get_mMakeRotationIdentity = Y.prototype.bs = function() {
      return !!wr(this.gq)
  };
  Y.prototype.set_mMakeRotationIdentity = Y.prototype.Ft = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      xr(c, a)
  };
  Object.defineProperty(Y.prototype, "mMakeRotationIdentity", {
      get: Y.prototype.bs,
      set: Y.prototype.Ft
  });
  Y.prototype.__destroy__ = function() {
      yr(this.gq)
  };

  function Z() {
      this.gq = zr();
      h(Z)[this.gq] = this
  }
  Z.prototype = Object.create(g.prototype);
  Z.prototype.constructor = Z;
  Z.prototype.hq = Z;
  Z.iq = {};
  b.JoltSettings = Z;
  Z.prototype.get_mMaxBodies = Z.prototype.js = function() {
      return Ar(this.gq)
  };
  Z.prototype.set_mMaxBodies = Z.prototype.Lt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Br(c, a)
  };
  Object.defineProperty(Z.prototype, "mMaxBodies", {
      get: Z.prototype.js,
      set: Z.prototype.Lt
  });
  Z.prototype.get_mMaxBodyPairs = Z.prototype.ks = function() {
      return Cr(this.gq)
  };
  Z.prototype.set_mMaxBodyPairs = Z.prototype.Mt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Dr(c, a)
  };
  Object.defineProperty(Z.prototype, "mMaxBodyPairs", {
      get: Z.prototype.ks,
      set: Z.prototype.Mt
  });
  Z.prototype.get_mMaxContactConstraints = Z.prototype.ls = function() {
      return Er(this.gq)
  };
  Z.prototype.set_mMaxContactConstraints = Z.prototype.Nt = function(a) {
      var c = this.gq;
      a && "object" === typeof a && (a = a.gq);
      Fr(c, a)
  };
  Object.defineProperty(Z.prototype, "mMaxContactConstraints", {
      get: Z.prototype.ls,
      set: Z.prototype.Nt
  });
  Z.prototype.__destroy__ = function() {
      Gr(this.gq)
  };

  function st(a) {
      a && "object" === typeof a && (a = a.gq);
      this.gq = Hr(a);
      h(st)[this.gq] = this
  }
  st.prototype = Object.create(g.prototype);
  st.prototype.constructor = st;
  st.prototype.hq = st;
  st.iq = {};
  b.JoltInterface = st;
  st.prototype.Step = function(a, c) {
      var e = this.gq;
      a && "object" === typeof a && (a = a.gq);
      c && "object" === typeof c && (c = c.gq);
      Ir(e, a, c)
  };
  st.prototype.GetPhysicsSystem = function() {
      return l(Jr(this.gq), lt)
  };
  st.prototype.__destroy__ = function() {
      Kr(this.gq)
  };
  (function() {
      function a() {
          b.MOVING = Lr();
          b.NON_MOVING = Mr();
          b.RigidBody = Nr();
          b.SoftBody = Or();
          b.Static = Pr();
          b.Kinematic = Qr();
          b.Dynamic = Rr();
          b.Discrete = Sr();
          b.LinearCast = Tr();
          b.Activate = Ur();
          b.DontActivate = Vr();
          b.Convex = Wr();
          b.Compound = Xr();
          b.Decorated = Yr();
          b.Mesh = Zr();
          b.HeightField = $r();
          b.Sphere = as();
          b.Box = bs();
          b.Capsule = cs();
          b.TaperedCapsule = ds();
          b.Cylinder = es();
          b.ConvexHull = gs();
          b.StaticCompound = hs();
          b.MutableCompound = is();
          b.RotatedTranslated = js();
          b.Scaled = ks();
          b.OffsetCenterOfMass = ls();
          b.Mesh = ms();
          b.HeightField = ns();
          b.LocalToBodyCOM = ps();
          b.WorldSpace = qs();
          b.FrequencyAndDamping = rs();
          b.StiffnessAndDamping = ss();
          b.CalculateMassAndInertia = ts();
          b.CalculateInertia = us();
          b.MassAndInertiaProvided = vs()
      }
      Aa ? a() : ya.unshift(a)
  })();

  return moduleArg.ready
}

);
})();
export default Jolt;
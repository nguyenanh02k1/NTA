(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
    var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    
    ;(function (exports) {
        'use strict';
    
      var Arr = (typeof Uint8Array !== 'undefined')
        ? Uint8Array
        : Array
    
        var PLUS   = '+'.charCodeAt(0)
        var SLASH  = '/'.charCodeAt(0)
        var NUMBER = '0'.charCodeAt(0)
        var LOWER  = 'a'.charCodeAt(0)
        var UPPER  = 'A'.charCodeAt(0)
    
        function decode (elt) {
            var code = elt.charCodeAt(0)
            if (code === PLUS)
                return 62 // '+'
            if (code === SLASH)
                return 63 // '/'
            if (code < NUMBER)
                return -1 //no match
            if (code < NUMBER + 10)
                return code - NUMBER + 26 + 26
            if (code < UPPER + 26)
                return code - UPPER
            if (code < LOWER + 26)
                return code - LOWER + 26
        }
    
        function b64ToByteArray (b64) {
            var i, j, l, tmp, placeHolders, arr
    
            if (b64.length % 4 > 0) {
                throw new Error('Invalid string. Length must be a multiple of 4')
            }
    
            // the number of equal signs (place holders)
            // if there are two placeholders, than the two characters before it
            // represent one byte
            // if there is only one, then the three characters before it represent 2 bytes
            // this is just a cheap hack to not do indexOf twice
            var len = b64.length
            placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0
    
            // base64 is 4/3 + up to two characters of the original data
            arr = new Arr(b64.length * 3 / 4 - placeHolders)
    
            // if there are placeholders, only get up to the last complete 4 chars
            l = placeHolders > 0 ? b64.length - 4 : b64.length
    
            var L = 0
    
            function push (v) {
                arr[L++] = v
            }
    
            for (i = 0, j = 0; i < l; i += 4, j += 3) {
                tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
                push((tmp & 0xFF0000) >> 16)
                push((tmp & 0xFF00) >> 8)
                push(tmp & 0xFF)
            }
    
            if (placeHolders === 2) {
                tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
                push(tmp & 0xFF)
            } else if (placeHolders === 1) {
                tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
                push((tmp >> 8) & 0xFF)
                push(tmp & 0xFF)
            }
    
            return arr
        }
    
        function uint8ToBase64 (uint8) {
            var i,
                extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
                output = "",
                temp, length
    
            function encode (num) {
                return lookup.charAt(num)
            }
    
            function tripletToBase64 (num) {
                return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
            }
    
            // go through the array every three bytes, we'll deal with trailing stuff later
            for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
                temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
                output += tripletToBase64(temp)
            }
    
            // pad the end with zeros, but make sure to not forget the extra bytes
            switch (extraBytes) {
                case 1:
                    temp = uint8[uint8.length - 1]
                    output += encode(temp >> 2)
                    output += encode((temp << 4) & 0x3F)
                    output += '=='
                    break
                case 2:
                    temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
                    output += encode(temp >> 10)
                    output += encode((temp >> 4) & 0x3F)
                    output += encode((temp << 2) & 0x3F)
                    output += '='
                    break
            }
    
            return output
        }
    
        exports.toByteArray = b64ToByteArray
        exports.fromByteArray = uint8ToBase64
    }(typeof exports === 'undefined' ? (this.base64js = {}) : exports))
    
    },{}],2:[function(require,module,exports){
    /*!
     * The buffer module from node.js, for the browser.
     *
     * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
     * @license  MIT
     */
    
    var base64 = require('base64-js')
    var ieee754 = require('ieee754')
    var isArray = require('is-array')
    
    exports.Buffer = Buffer
    exports.SlowBuffer = Buffer
    exports.INSPECT_MAX_BYTES = 50
    Buffer.poolSize = 8192 // not used by this implementation
    
    var kMaxLength = 0x3fffffff
    
    /**
     * If `Buffer.TYPED_ARRAY_SUPPORT`:
     *   === true    Use Uint8Array implementation (fastest)
     *   === false   Use Object implementation (most compatible, even IE6)
     *
     * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
     * Opera 11.6+, iOS 4.2+.
     *
     * Note:
     *
     * - Implementation must support adding new properties to `Uint8Array` instances.
     *   Firefox 4-29 lacked support, fixed in Firefox 30+.
     *   See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
     *
     *  - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
     *
     *  - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
     *    incorrect length in some situations.
     *
     * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they will
     * get the Object implementation, which is slower but will work correctly.
     */
    Buffer.TYPED_ARRAY_SUPPORT = (function () {
      try {
        var buf = new ArrayBuffer(0)
        var arr = new Uint8Array(buf)
        arr.foo = function () { return 42 }
        return 42 === arr.foo() && // typed array instances can be augmented
            typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
            new Uint8Array(1).subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
      } catch (e) {
        return false
      }
    })()
    
    /**
     * Class: Buffer
     * =============
     *
     * The Buffer constructor returns instances of `Uint8Array` that are augmented
     * with function properties for all the node `Buffer` API functions. We use
     * `Uint8Array` so that square bracket notation works as expected -- it returns
     * a single octet.
     *
     * By augmenting the instances, we can avoid modifying the `Uint8Array`
     * prototype.
     */
    function Buffer (subject, encoding, noZero) {
      if (!(this instanceof Buffer))
        return new Buffer(subject, encoding, noZero)
    
      var type = typeof subject
    
      // Find the length
      var length
      if (type === 'number')
        length = subject > 0 ? subject >>> 0 : 0
      else if (type === 'string') {
        if (encoding === 'base64')
          subject = base64clean(subject)
        length = Buffer.byteLength(subject, encoding)
      } else if (type === 'object' && subject !== null) { // assume object is array-like
        if (subject.type === 'Buffer' && isArray(subject.data))
          subject = subject.data
        length = +subject.length > 0 ? Math.floor(+subject.length) : 0
      } else
        throw new TypeError('must start with number, buffer, array or string')
    
      if (this.length > kMaxLength)
        throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
          'size: 0x' + kMaxLength.toString(16) + ' bytes')
    
      var buf
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        // Preferred: Return an augmented `Uint8Array` instance for best performance
        buf = Buffer._augment(new Uint8Array(length))
      } else {
        // Fallback: Return THIS instance of Buffer (created by `new`)
        buf = this
        buf.length = length
        buf._isBuffer = true
      }
    
      var i
      if (Buffer.TYPED_ARRAY_SUPPORT && typeof subject.byteLength === 'number') {
        // Speed optimization -- use set if we're copying from a typed array
        buf._set(subject)
      } else if (isArrayish(subject)) {
        // Treat array-ish objects as a byte array
        if (Buffer.isBuffer(subject)) {
          for (i = 0; i < length; i++)
            buf[i] = subject.readUInt8(i)
        } else {
          for (i = 0; i < length; i++)
            buf[i] = ((subject[i] % 256) + 256) % 256
        }
      } else if (type === 'string') {
        buf.write(subject, 0, encoding)
      } else if (type === 'number' && !Buffer.TYPED_ARRAY_SUPPORT && !noZero) {
        for (i = 0; i < length; i++) {
          buf[i] = 0
        }
      }
    
      return buf
    }
    
    Buffer.isBuffer = function (b) {
      return !!(b != null && b._isBuffer)
    }
    
    Buffer.compare = function (a, b) {
      if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b))
        throw new TypeError('Arguments must be Buffers')
    
      var x = a.length
      var y = b.length
      for (var i = 0, len = Math.min(x, y); i < len && a[i] === b[i]; i++) {}
      if (i !== len) {
        x = a[i]
        y = b[i]
      }
      if (x < y) return -1
      if (y < x) return 1
      return 0
    }
    
    Buffer.isEncoding = function (encoding) {
      switch (String(encoding).toLowerCase()) {
        case 'hex':
        case 'utf8':
        case 'utf-8':
        case 'ascii':
        case 'binary':
        case 'base64':
        case 'raw':
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return true
        default:
          return false
      }
    }
    
    Buffer.concat = function (list, totalLength) {
      if (!isArray(list)) throw new TypeError('Usage: Buffer.concat(list[, length])')
    
      if (list.length === 0) {
        return new Buffer(0)
      } else if (list.length === 1) {
        return list[0]
      }
    
      var i
      if (totalLength === undefined) {
        totalLength = 0
        for (i = 0; i < list.length; i++) {
          totalLength += list[i].length
        }
      }
    
      var buf = new Buffer(totalLength)
      var pos = 0
      for (i = 0; i < list.length; i++) {
        var item = list[i]
        item.copy(buf, pos)
        pos += item.length
      }
      return buf
    }
    
    Buffer.byteLength = function (str, encoding) {
      var ret
      str = str + ''
      switch (encoding || 'utf8') {
        case 'ascii':
        case 'binary':
        case 'raw':
          ret = str.length
          break
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          ret = str.length * 2
          break
        case 'hex':
          ret = str.length >>> 1
          break
        case 'utf8':
        case 'utf-8':
          ret = utf8ToBytes(str).length
          break
        case 'base64':
          ret = base64ToBytes(str).length
          break
        default:
          ret = str.length
      }
      return ret
    }
    
    // pre-set for values that may exist in the future
    Buffer.prototype.length = undefined
    Buffer.prototype.parent = undefined
    
    // toString(encoding, start=0, end=buffer.length)
    Buffer.prototype.toString = function (encoding, start, end) {
      var loweredCase = false
    
      start = start >>> 0
      end = end === undefined || end === Infinity ? this.length : end >>> 0
    
      if (!encoding) encoding = 'utf8'
      if (start < 0) start = 0
      if (end > this.length) end = this.length
      if (end <= start) return ''
    
      while (true) {
        switch (encoding) {
          case 'hex':
            return hexSlice(this, start, end)
    
          case 'utf8':
          case 'utf-8':
            return utf8Slice(this, start, end)
    
          case 'ascii':
            return asciiSlice(this, start, end)
    
          case 'binary':
            return binarySlice(this, start, end)
    
          case 'base64':
            return base64Slice(this, start, end)
    
          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return utf16leSlice(this, start, end)
    
          default:
            if (loweredCase)
              throw new TypeError('Unknown encoding: ' + encoding)
            encoding = (encoding + '').toLowerCase()
            loweredCase = true
        }
      }
    }
    
    Buffer.prototype.equals = function (b) {
      if(!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
      return Buffer.compare(this, b) === 0
    }
    
    Buffer.prototype.inspect = function () {
      var str = ''
      var max = exports.INSPECT_MAX_BYTES
      if (this.length > 0) {
        str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
        if (this.length > max)
          str += ' ... '
      }
      return '<Buffer ' + str + '>'
    }
    
    Buffer.prototype.compare = function (b) {
      if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
      return Buffer.compare(this, b)
    }
    
    // `get` will be removed in Node 0.13+
    Buffer.prototype.get = function (offset) {
      console.log('.get() is deprecated. Access using array indexes instead.')
      return this.readUInt8(offset)
    }
    
    // `set` will be removed in Node 0.13+
    Buffer.prototype.set = function (v, offset) {
      console.log('.set() is deprecated. Access using array indexes instead.')
      return this.writeUInt8(v, offset)
    }
    
    function hexWrite (buf, string, offset, length) {
      offset = Number(offset) || 0
      var remaining = buf.length - offset
      if (!length) {
        length = remaining
      } else {
        length = Number(length)
        if (length > remaining) {
          length = remaining
        }
      }
    
      // must be an even number of digits
      var strLen = string.length
      if (strLen % 2 !== 0) throw new Error('Invalid hex string')
    
      if (length > strLen / 2) {
        length = strLen / 2
      }
      for (var i = 0; i < length; i++) {
        var byte = parseInt(string.substr(i * 2, 2), 16)
        if (isNaN(byte)) throw new Error('Invalid hex string')
        buf[offset + i] = byte
      }
      return i
    }
    
    function utf8Write (buf, string, offset, length) {
      var charsWritten = blitBuffer(utf8ToBytes(string), buf, offset, length)
      return charsWritten
    }
    
    function asciiWrite (buf, string, offset, length) {
      var charsWritten = blitBuffer(asciiToBytes(string), buf, offset, length)
      return charsWritten
    }
    
    function binaryWrite (buf, string, offset, length) {
      return asciiWrite(buf, string, offset, length)
    }
    
    function base64Write (buf, string, offset, length) {
      var charsWritten = blitBuffer(base64ToBytes(string), buf, offset, length)
      return charsWritten
    }
    
    function utf16leWrite (buf, string, offset, length) {
      var charsWritten = blitBuffer(utf16leToBytes(string), buf, offset, length, 2)
      return charsWritten
    }
    
    Buffer.prototype.write = function (string, offset, length, encoding) {
      // Support both (string, offset, length, encoding)
      // and the legacy (string, encoding, offset, length)
      if (isFinite(offset)) {
        if (!isFinite(length)) {
          encoding = length
          length = undefined
        }
      } else {  // legacy
        var swap = encoding
        encoding = offset
        offset = length
        length = swap
      }
    
      offset = Number(offset) || 0
      var remaining = this.length - offset
      if (!length) {
        length = remaining
      } else {
        length = Number(length)
        if (length > remaining) {
          length = remaining
        }
      }
      encoding = String(encoding || 'utf8').toLowerCase()
    
      var ret
      switch (encoding) {
        case 'hex':
          ret = hexWrite(this, string, offset, length)
          break
        case 'utf8':
        case 'utf-8':
          ret = utf8Write(this, string, offset, length)
          break
        case 'ascii':
          ret = asciiWrite(this, string, offset, length)
          break
        case 'binary':
          ret = binaryWrite(this, string, offset, length)
          break
        case 'base64':
          ret = base64Write(this, string, offset, length)
          break
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          ret = utf16leWrite(this, string, offset, length)
          break
        default:
          throw new TypeError('Unknown encoding: ' + encoding)
      }
      return ret
    }
    
    Buffer.prototype.toJSON = function () {
      return {
        type: 'Buffer',
        data: Array.prototype.slice.call(this._arr || this, 0)
      }
    }
    
    function base64Slice (buf, start, end) {
      if (start === 0 && end === buf.length) {
        return base64.fromByteArray(buf)
      } else {
        return base64.fromByteArray(buf.slice(start, end))
      }
    }
    
    function utf8Slice (buf, start, end) {
      var res = ''
      var tmp = ''
      end = Math.min(buf.length, end)
    
      for (var i = start; i < end; i++) {
        if (buf[i] <= 0x7F) {
          res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
          tmp = ''
        } else {
          tmp += '%' + buf[i].toString(16)
        }
      }
    
      return res + decodeUtf8Char(tmp)
    }
    
    function asciiSlice (buf, start, end) {
      var ret = ''
      end = Math.min(buf.length, end)
    
      for (var i = start; i < end; i++) {
        ret += String.fromCharCode(buf[i])
      }
      return ret
    }
    
    function binarySlice (buf, start, end) {
      return asciiSlice(buf, start, end)
    }
    
    function hexSlice (buf, start, end) {
      var len = buf.length
    
      if (!start || start < 0) start = 0
      if (!end || end < 0 || end > len) end = len
    
      var out = ''
      for (var i = start; i < end; i++) {
        out += toHex(buf[i])
      }
      return out
    }
    
    function utf16leSlice (buf, start, end) {
      var bytes = buf.slice(start, end)
      var res = ''
      for (var i = 0; i < bytes.length; i += 2) {
        res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
      }
      return res
    }
    
    Buffer.prototype.slice = function (start, end) {
      var len = this.length
      start = ~~start
      end = end === undefined ? len : ~~end
    
      if (start < 0) {
        start += len;
        if (start < 0)
          start = 0
      } else if (start > len) {
        start = len
      }
    
      if (end < 0) {
        end += len
        if (end < 0)
          end = 0
      } else if (end > len) {
        end = len
      }
    
      if (end < start)
        end = start
    
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        return Buffer._augment(this.subarray(start, end))
      } else {
        var sliceLen = end - start
        var newBuf = new Buffer(sliceLen, undefined, true)
        for (var i = 0; i < sliceLen; i++) {
          newBuf[i] = this[i + start]
        }
        return newBuf
      }
    }
    
    /*
     * Need to make sure that buffer isn't trying to write out of bounds.
     */
    function checkOffset (offset, ext, length) {
      if ((offset % 1) !== 0 || offset < 0)
        throw new RangeError('offset is not uint')
      if (offset + ext > length)
        throw new RangeError('Trying to access beyond buffer length')
    }
    
    Buffer.prototype.readUInt8 = function (offset, noAssert) {
      if (!noAssert)
        checkOffset(offset, 1, this.length)
      return this[offset]
    }
    
    Buffer.prototype.readUInt16LE = function (offset, noAssert) {
      if (!noAssert)
        checkOffset(offset, 2, this.length)
      return this[offset] | (this[offset + 1] << 8)
    }
    
    Buffer.prototype.readUInt16BE = function (offset, noAssert) {
      if (!noAssert)
        checkOffset(offset, 2, this.length)
      return (this[offset] << 8) | this[offset + 1]
    }
    
    Buffer.prototype.readUInt32LE = function (offset, noAssert) {
      if (!noAssert)
        checkOffset(offset, 4, this.length)
    
      return ((this[offset]) |
          (this[offset + 1] << 8) |
          (this[offset + 2] << 16)) +
          (this[offset + 3] * 0x1000000)
    }
    
    Buffer.prototype.readUInt32BE = function (offset, noAssert) {
      if (!noAssert)
        checkOffset(offset, 4, this.length)
    
      return (this[offset] * 0x1000000) +
          ((this[offset + 1] << 16) |
          (this[offset + 2] << 8) |
          this[offset + 3])
    }
    
    Buffer.prototype.readInt8 = function (offset, noAssert) {
      if (!noAssert)
        checkOffset(offset, 1, this.length)
      if (!(this[offset] & 0x80))
        return (this[offset])
      return ((0xff - this[offset] + 1) * -1)
    }
    
    Buffer.prototype.readInt16LE = function (offset, noAssert) {
      if (!noAssert)
        checkOffset(offset, 2, this.length)
      var val = this[offset] | (this[offset + 1] << 8)
      return (val & 0x8000) ? val | 0xFFFF0000 : val
    }
    
    Buffer.prototype.readInt16BE = function (offset, noAssert) {
      if (!noAssert)
        checkOffset(offset, 2, this.length)
      var val = this[offset + 1] | (this[offset] << 8)
      return (val & 0x8000) ? val | 0xFFFF0000 : val
    }
    
    Buffer.prototype.readInt32LE = function (offset, noAssert) {
      if (!noAssert)
        checkOffset(offset, 4, this.length)
    
      return (this[offset]) |
          (this[offset + 1] << 8) |
          (this[offset + 2] << 16) |
          (this[offset + 3] << 24)
    }
    
    Buffer.prototype.readInt32BE = function (offset, noAssert) {
      if (!noAssert)
        checkOffset(offset, 4, this.length)
    
      return (this[offset] << 24) |
          (this[offset + 1] << 16) |
          (this[offset + 2] << 8) |
          (this[offset + 3])
    }
    
    Buffer.prototype.readFloatLE = function (offset, noAssert) {
      if (!noAssert)
        checkOffset(offset, 4, this.length)
      return ieee754.read(this, offset, true, 23, 4)
    }
    
    Buffer.prototype.readFloatBE = function (offset, noAssert) {
      if (!noAssert)
        checkOffset(offset, 4, this.length)
      return ieee754.read(this, offset, false, 23, 4)
    }
    
    Buffer.prototype.readDoubleLE = function (offset, noAssert) {
      if (!noAssert)
        checkOffset(offset, 8, this.length)
      return ieee754.read(this, offset, true, 52, 8)
    }
    
    Buffer.prototype.readDoubleBE = function (offset, noAssert) {
      if (!noAssert)
        checkOffset(offset, 8, this.length)
      return ieee754.read(this, offset, false, 52, 8)
    }
    
    function checkInt (buf, value, offset, ext, max, min) {
      if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
      if (value > max || value < min) throw new TypeError('value is out of bounds')
      if (offset + ext > buf.length) throw new TypeError('index out of range')
    }
    
    Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert)
        checkInt(this, value, offset, 1, 0xff, 0)
      if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
      this[offset] = value
      return offset + 1
    }
    
    function objectWriteUInt16 (buf, value, offset, littleEndian) {
      if (value < 0) value = 0xffff + value + 1
      for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
        buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
          (littleEndian ? i : 1 - i) * 8
      }
    }
    
    Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert)
        checkInt(this, value, offset, 2, 0xffff, 0)
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = value
        this[offset + 1] = (value >>> 8)
      } else objectWriteUInt16(this, value, offset, true)
      return offset + 2
    }
    
    Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert)
        checkInt(this, value, offset, 2, 0xffff, 0)
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value >>> 8)
        this[offset + 1] = value
      } else objectWriteUInt16(this, value, offset, false)
      return offset + 2
    }
    
    function objectWriteUInt32 (buf, value, offset, littleEndian) {
      if (value < 0) value = 0xffffffff + value + 1
      for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
        buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
      }
    }
    
    Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert)
        checkInt(this, value, offset, 4, 0xffffffff, 0)
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset + 3] = (value >>> 24)
        this[offset + 2] = (value >>> 16)
        this[offset + 1] = (value >>> 8)
        this[offset] = value
      } else objectWriteUInt32(this, value, offset, true)
      return offset + 4
    }
    
    Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert)
        checkInt(this, value, offset, 4, 0xffffffff, 0)
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value >>> 24)
        this[offset + 1] = (value >>> 16)
        this[offset + 2] = (value >>> 8)
        this[offset + 3] = value
      } else objectWriteUInt32(this, value, offset, false)
      return offset + 4
    }
    
    Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert)
        checkInt(this, value, offset, 1, 0x7f, -0x80)
      if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
      if (value < 0) value = 0xff + value + 1
      this[offset] = value
      return offset + 1
    }
    
    Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert)
        checkInt(this, value, offset, 2, 0x7fff, -0x8000)
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = value
        this[offset + 1] = (value >>> 8)
      } else objectWriteUInt16(this, value, offset, true)
      return offset + 2
    }
    
    Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert)
        checkInt(this, value, offset, 2, 0x7fff, -0x8000)
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value >>> 8)
        this[offset + 1] = value
      } else objectWriteUInt16(this, value, offset, false)
      return offset + 2
    }
    
    Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert)
        checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = value
        this[offset + 1] = (value >>> 8)
        this[offset + 2] = (value >>> 16)
        this[offset + 3] = (value >>> 24)
      } else objectWriteUInt32(this, value, offset, true)
      return offset + 4
    }
    
    Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
      value = +value
      offset = offset >>> 0
      if (!noAssert)
        checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
      if (value < 0) value = 0xffffffff + value + 1
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value >>> 24)
        this[offset + 1] = (value >>> 16)
        this[offset + 2] = (value >>> 8)
        this[offset + 3] = value
      } else objectWriteUInt32(this, value, offset, false)
      return offset + 4
    }
    
    function checkIEEE754 (buf, value, offset, ext, max, min) {
      if (value > max || value < min) throw new TypeError('value is out of bounds')
      if (offset + ext > buf.length) throw new TypeError('index out of range')
    }
    
    function writeFloat (buf, value, offset, littleEndian, noAssert) {
      if (!noAssert)
        checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
      ieee754.write(buf, value, offset, littleEndian, 23, 4)
      return offset + 4
    }
    
    Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
      return writeFloat(this, value, offset, true, noAssert)
    }
    
    Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
      return writeFloat(this, value, offset, false, noAssert)
    }
    
    function writeDouble (buf, value, offset, littleEndian, noAssert) {
      if (!noAssert)
        checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
      ieee754.write(buf, value, offset, littleEndian, 52, 8)
      return offset + 8
    }
    
    Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
      return writeDouble(this, value, offset, true, noAssert)
    }
    
    Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
      return writeDouble(this, value, offset, false, noAssert)
    }
    
    // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
    Buffer.prototype.copy = function (target, target_start, start, end) {
      var source = this
    
      if (!start) start = 0
      if (!end && end !== 0) end = this.length
      if (!target_start) target_start = 0
    
      // Copy 0 bytes; we're done
      if (end === start) return
      if (target.length === 0 || source.length === 0) return
    
      // Fatal error conditions
      if (end < start) throw new TypeError('sourceEnd < sourceStart')
      if (target_start < 0 || target_start >= target.length)
        throw new TypeError('targetStart out of bounds')
      if (start < 0 || start >= source.length) throw new TypeError('sourceStart out of bounds')
      if (end < 0 || end > source.length) throw new TypeError('sourceEnd out of bounds')
    
      // Are we oob?
      if (end > this.length)
        end = this.length
      if (target.length - target_start < end - start)
        end = target.length - target_start + start
    
      var len = end - start
    
      if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
        for (var i = 0; i < len; i++) {
          target[i + target_start] = this[i + start]
        }
      } else {
        target._set(this.subarray(start, start + len), target_start)
      }
    }
    
    // fill(value, start=0, end=buffer.length)
    Buffer.prototype.fill = function (value, start, end) {
      if (!value) value = 0
      if (!start) start = 0
      if (!end) end = this.length
    
      if (end < start) throw new TypeError('end < start')
    
      // Fill 0 bytes; we're done
      if (end === start) return
      if (this.length === 0) return
    
      if (start < 0 || start >= this.length) throw new TypeError('start out of bounds')
      if (end < 0 || end > this.length) throw new TypeError('end out of bounds')
    
      var i
      if (typeof value === 'number') {
        for (i = start; i < end; i++) {
          this[i] = value
        }
      } else {
        var bytes = utf8ToBytes(value.toString())
        var len = bytes.length
        for (i = start; i < end; i++) {
          this[i] = bytes[i % len]
        }
      }
    
      return this
    }
    
    /**
     * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
     * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
     */
    Buffer.prototype.toArrayBuffer = function () {
      if (typeof Uint8Array !== 'undefined') {
        if (Buffer.TYPED_ARRAY_SUPPORT) {
          return (new Buffer(this)).buffer
        } else {
          var buf = new Uint8Array(this.length)
          for (var i = 0, len = buf.length; i < len; i += 1) {
            buf[i] = this[i]
          }
          return buf.buffer
        }
      } else {
        throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
      }
    }
    
    // HELPER FUNCTIONS
    // ================
    
    var BP = Buffer.prototype
    
    /**
     * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
     */
    Buffer._augment = function (arr) {
      arr.constructor = Buffer
      arr._isBuffer = true
    
      // save reference to original Uint8Array get/set methods before overwriting
      arr._get = arr.get
      arr._set = arr.set
    
      // deprecated, will be removed in node 0.13+
      arr.get = BP.get
      arr.set = BP.set
    
      arr.write = BP.write
      arr.toString = BP.toString
      arr.toLocaleString = BP.toString
      arr.toJSON = BP.toJSON
      arr.equals = BP.equals
      arr.compare = BP.compare
      arr.copy = BP.copy
      arr.slice = BP.slice
      arr.readUInt8 = BP.readUInt8
      arr.readUInt16LE = BP.readUInt16LE
      arr.readUInt16BE = BP.readUInt16BE
      arr.readUInt32LE = BP.readUInt32LE
      arr.readUInt32BE = BP.readUInt32BE
      arr.readInt8 = BP.readInt8
      arr.readInt16LE = BP.readInt16LE
      arr.readInt16BE = BP.readInt16BE
      arr.readInt32LE = BP.readInt32LE
      arr.readInt32BE = BP.readInt32BE
      arr.readFloatLE = BP.readFloatLE
      arr.readFloatBE = BP.readFloatBE
      arr.readDoubleLE = BP.readDoubleLE
      arr.readDoubleBE = BP.readDoubleBE
      arr.writeUInt8 = BP.writeUInt8
      arr.writeUInt16LE = BP.writeUInt16LE
      arr.writeUInt16BE = BP.writeUInt16BE
      arr.writeUInt32LE = BP.writeUInt32LE
      arr.writeUInt32BE = BP.writeUInt32BE
      arr.writeInt8 = BP.writeInt8
      arr.writeInt16LE = BP.writeInt16LE
      arr.writeInt16BE = BP.writeInt16BE
      arr.writeInt32LE = BP.writeInt32LE
      arr.writeInt32BE = BP.writeInt32BE
      arr.writeFloatLE = BP.writeFloatLE
      arr.writeFloatBE = BP.writeFloatBE
      arr.writeDoubleLE = BP.writeDoubleLE
      arr.writeDoubleBE = BP.writeDoubleBE
      arr.fill = BP.fill
      arr.inspect = BP.inspect
      arr.toArrayBuffer = BP.toArrayBuffer
    
      return arr
    }
    
    var INVALID_BASE64_RE = /[^+\/0-9A-z]/g
    
    function base64clean (str) {
      // Node strips out invalid characters like \n and \t from the string, base64-js does not
      str = stringtrim(str).replace(INVALID_BASE64_RE, '')
      // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
      while (str.length % 4 !== 0) {
        str = str + '='
      }
      return str
    }
    
    function stringtrim (str) {
      if (str.trim) return str.trim()
      return str.replace(/^\s+|\s+$/g, '')
    }
    
    function isArrayish (subject) {
      return isArray(subject) || Buffer.isBuffer(subject) ||
          subject && typeof subject === 'object' &&
          typeof subject.length === 'number'
    }
    
    function toHex (n) {
      if (n < 16) return '0' + n.toString(16)
      return n.toString(16)
    }
    
    function utf8ToBytes (str) {
      var byteArray = []
      for (var i = 0; i < str.length; i++) {
        var b = str.charCodeAt(i)
        if (b <= 0x7F) {
          byteArray.push(b)
        } else {
          var start = i
          if (b >= 0xD800 && b <= 0xDFFF) i++
          var h = encodeURIComponent(str.slice(start, i+1)).substr(1).split('%')
          for (var j = 0; j < h.length; j++) {
            byteArray.push(parseInt(h[j], 16))
          }
        }
      }
      return byteArray
    }
    
    function asciiToBytes (str) {
      var byteArray = []
      for (var i = 0; i < str.length; i++) {
        // Node's code seems to be doing this and not & 0x7F..
        byteArray.push(str.charCodeAt(i) & 0xFF)
      }
      return byteArray
    }
    
    function utf16leToBytes (str) {
      var c, hi, lo
      var byteArray = []
      for (var i = 0; i < str.length; i++) {
        c = str.charCodeAt(i)
        hi = c >> 8
        lo = c % 256
        byteArray.push(lo)
        byteArray.push(hi)
      }
    
      return byteArray
    }
    
    function base64ToBytes (str) {
      return base64.toByteArray(str)
    }
    
    function blitBuffer (src, dst, offset, length, unitSize) {
      if (unitSize) length -= length % unitSize;
      for (var i = 0; i < length; i++) {
        if ((i + offset >= dst.length) || (i >= src.length))
          break
        dst[i + offset] = src[i]
      }
      return i
    }
    
    function decodeUtf8Char (str) {
      try {
        return decodeURIComponent(str)
      } catch (err) {
        return String.fromCharCode(0xFFFD) // UTF 8 invalid char
      }
    }
    
    },{"base64-js":1,"ieee754":37,"is-array":38}],3:[function(require,module,exports){
    ;(function (root, factory, undef) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"), require("./enc-base64"), require("./md5"), require("./evpkdf"), require("./cipher-core"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core", "./enc-base64", "./md5", "./evpkdf", "./cipher-core"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        (function () {
            // Shortcuts
            var C = CryptoJS;
            var C_lib = C.lib;
            var BlockCipher = C_lib.BlockCipher;
            var C_algo = C.algo;
    
            // Lookup tables
            var SBOX = [];
            var INV_SBOX = [];
            var SUB_MIX_0 = [];
            var SUB_MIX_1 = [];
            var SUB_MIX_2 = [];
            var SUB_MIX_3 = [];
            var INV_SUB_MIX_0 = [];
            var INV_SUB_MIX_1 = [];
            var INV_SUB_MIX_2 = [];
            var INV_SUB_MIX_3 = [];
    
            // Compute lookup tables
            (function () {
                // Compute double table
                var d = [];
                for (var i = 0; i < 256; i++) {
                    if (i < 128) {
                        d[i] = i << 1;
                    } else {
                        d[i] = (i << 1) ^ 0x11b;
                    }
                }
    
                // Walk GF(2^8)
                var x = 0;
                var xi = 0;
                for (var i = 0; i < 256; i++) {
                    // Compute sbox
                    var sx = xi ^ (xi << 1) ^ (xi << 2) ^ (xi << 3) ^ (xi << 4);
                    sx = (sx >>> 8) ^ (sx & 0xff) ^ 0x63;
                    SBOX[x] = sx;
                    INV_SBOX[sx] = x;
    
                    // Compute multiplication
                    var x2 = d[x];
                    var x4 = d[x2];
                    var x8 = d[x4];
    
                    // Compute sub bytes, mix columns tables
                    var t = (d[sx] * 0x101) ^ (sx * 0x1010100);
                    SUB_MIX_0[x] = (t << 24) | (t >>> 8);
                    SUB_MIX_1[x] = (t << 16) | (t >>> 16);
                    SUB_MIX_2[x] = (t << 8)  | (t >>> 24);
                    SUB_MIX_3[x] = t;
    
                    // Compute inv sub bytes, inv mix columns tables
                    var t = (x8 * 0x1010101) ^ (x4 * 0x10001) ^ (x2 * 0x101) ^ (x * 0x1010100);
                    INV_SUB_MIX_0[sx] = (t << 24) | (t >>> 8);
                    INV_SUB_MIX_1[sx] = (t << 16) | (t >>> 16);
                    INV_SUB_MIX_2[sx] = (t << 8)  | (t >>> 24);
                    INV_SUB_MIX_3[sx] = t;
    
                    // Compute next counter
                    if (!x) {
                        x = xi = 1;
                    } else {
                        x = x2 ^ d[d[d[x8 ^ x2]]];
                        xi ^= d[d[xi]];
                    }
                }
            }());
    
            // Precomputed Rcon lookup
            var RCON = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];
    
            /**
             * AES block cipher algorithm.
             */
            var AES = C_algo.AES = BlockCipher.extend({
                _doReset: function () {
                    // Skip reset of nRounds has been set before and key did not change
                    if (this._nRounds && this._keyPriorReset === this._key) {
                        return;
                    }
    
                    // Shortcuts
                    var key = this._keyPriorReset = this._key;
                    var keyWords = key.words;
                    var keySize = key.sigBytes / 4;
    
                    // Compute number of rounds
                    var nRounds = this._nRounds = keySize + 6;
    
                    // Compute number of key schedule rows
                    var ksRows = (nRounds + 1) * 4;
    
                    // Compute key schedule
                    var keySchedule = this._keySchedule = [];
                    for (var ksRow = 0; ksRow < ksRows; ksRow++) {
                        if (ksRow < keySize) {
                            keySchedule[ksRow] = keyWords[ksRow];
                        } else {
                            var t = keySchedule[ksRow - 1];
    
                            if (!(ksRow % keySize)) {
                                // Rot word
                                t = (t << 8) | (t >>> 24);
    
                                // Sub word
                                t = (SBOX[t >>> 24] << 24) | (SBOX[(t >>> 16) & 0xff] << 16) | (SBOX[(t >>> 8) & 0xff] << 8) | SBOX[t & 0xff];
    
                                // Mix Rcon
                                t ^= RCON[(ksRow / keySize) | 0] << 24;
                            } else if (keySize > 6 && ksRow % keySize == 4) {
                                // Sub word
                                t = (SBOX[t >>> 24] << 24) | (SBOX[(t >>> 16) & 0xff] << 16) | (SBOX[(t >>> 8) & 0xff] << 8) | SBOX[t & 0xff];
                            }
    
                            keySchedule[ksRow] = keySchedule[ksRow - keySize] ^ t;
                        }
                    }
    
                    // Compute inv key schedule
                    var invKeySchedule = this._invKeySchedule = [];
                    for (var invKsRow = 0; invKsRow < ksRows; invKsRow++) {
                        var ksRow = ksRows - invKsRow;
    
                        if (invKsRow % 4) {
                            var t = keySchedule[ksRow];
                        } else {
                            var t = keySchedule[ksRow - 4];
                        }
    
                        if (invKsRow < 4 || ksRow <= 4) {
                            invKeySchedule[invKsRow] = t;
                        } else {
                            invKeySchedule[invKsRow] = INV_SUB_MIX_0[SBOX[t >>> 24]] ^ INV_SUB_MIX_1[SBOX[(t >>> 16) & 0xff]] ^
                                                       INV_SUB_MIX_2[SBOX[(t >>> 8) & 0xff]] ^ INV_SUB_MIX_3[SBOX[t & 0xff]];
                        }
                    }
                },
    
                encryptBlock: function (M, offset) {
                    this._doCryptBlock(M, offset, this._keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX);
                },
    
                decryptBlock: function (M, offset) {
                    // Swap 2nd and 4th rows
                    var t = M[offset + 1];
                    M[offset + 1] = M[offset + 3];
                    M[offset + 3] = t;
    
                    this._doCryptBlock(M, offset, this._invKeySchedule, INV_SUB_MIX_0, INV_SUB_MIX_1, INV_SUB_MIX_2, INV_SUB_MIX_3, INV_SBOX);
    
                    // Inv swap 2nd and 4th rows
                    var t = M[offset + 1];
                    M[offset + 1] = M[offset + 3];
                    M[offset + 3] = t;
                },
    
                _doCryptBlock: function (M, offset, keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX) {
                    // Shortcut
                    var nRounds = this._nRounds;
    
                    // Get input, add round key
                    var s0 = M[offset]     ^ keySchedule[0];
                    var s1 = M[offset + 1] ^ keySchedule[1];
                    var s2 = M[offset + 2] ^ keySchedule[2];
                    var s3 = M[offset + 3] ^ keySchedule[3];
    
                    // Key schedule row counter
                    var ksRow = 4;
    
                    // Rounds
                    for (var round = 1; round < nRounds; round++) {
                        // Shift rows, sub bytes, mix columns, add round key
                        var t0 = SUB_MIX_0[s0 >>> 24] ^ SUB_MIX_1[(s1 >>> 16) & 0xff] ^ SUB_MIX_2[(s2 >>> 8) & 0xff] ^ SUB_MIX_3[s3 & 0xff] ^ keySchedule[ksRow++];
                        var t1 = SUB_MIX_0[s1 >>> 24] ^ SUB_MIX_1[(s2 >>> 16) & 0xff] ^ SUB_MIX_2[(s3 >>> 8) & 0xff] ^ SUB_MIX_3[s0 & 0xff] ^ keySchedule[ksRow++];
                        var t2 = SUB_MIX_0[s2 >>> 24] ^ SUB_MIX_1[(s3 >>> 16) & 0xff] ^ SUB_MIX_2[(s0 >>> 8) & 0xff] ^ SUB_MIX_3[s1 & 0xff] ^ keySchedule[ksRow++];
                        var t3 = SUB_MIX_0[s3 >>> 24] ^ SUB_MIX_1[(s0 >>> 16) & 0xff] ^ SUB_MIX_2[(s1 >>> 8) & 0xff] ^ SUB_MIX_3[s2 & 0xff] ^ keySchedule[ksRow++];
    
                        // Update state
                        s0 = t0;
                        s1 = t1;
                        s2 = t2;
                        s3 = t3;
                    }
    
                    // Shift rows, sub bytes, add round key
                    var t0 = ((SBOX[s0 >>> 24] << 24) | (SBOX[(s1 >>> 16) & 0xff] << 16) | (SBOX[(s2 >>> 8) & 0xff] << 8) | SBOX[s3 & 0xff]) ^ keySchedule[ksRow++];
                    var t1 = ((SBOX[s1 >>> 24] << 24) | (SBOX[(s2 >>> 16) & 0xff] << 16) | (SBOX[(s3 >>> 8) & 0xff] << 8) | SBOX[s0 & 0xff]) ^ keySchedule[ksRow++];
                    var t2 = ((SBOX[s2 >>> 24] << 24) | (SBOX[(s3 >>> 16) & 0xff] << 16) | (SBOX[(s0 >>> 8) & 0xff] << 8) | SBOX[s1 & 0xff]) ^ keySchedule[ksRow++];
                    var t3 = ((SBOX[s3 >>> 24] << 24) | (SBOX[(s0 >>> 16) & 0xff] << 16) | (SBOX[(s1 >>> 8) & 0xff] << 8) | SBOX[s2 & 0xff]) ^ keySchedule[ksRow++];
    
                    // Set output
                    M[offset]     = t0;
                    M[offset + 1] = t1;
                    M[offset + 2] = t2;
                    M[offset + 3] = t3;
                },
    
                keySize: 256/32
            });
    
            /**
             * Shortcut functions to the cipher's object interface.
             *
             * @example
             *
             *     var ciphertext = CryptoJS.AES.encrypt(message, key, cfg);
             *     var plaintext  = CryptoJS.AES.decrypt(ciphertext, key, cfg);
             */
            C.AES = BlockCipher._createHelper(AES);
        }());
    
    
        return CryptoJS.AES;
    
    }));
    },{"./cipher-core":4,"./core":5,"./enc-base64":6,"./evpkdf":8,"./md5":13}],4:[function(require,module,exports){
    ;(function (root, factory, undef) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"), require("./evpkdf"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core", "./evpkdf"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        /**
         * Cipher core components.
         */
        CryptoJS.lib.Cipher || (function (undefined) {
            // Shortcuts
            var C = CryptoJS;
            var C_lib = C.lib;
            var Base = C_lib.Base;
            var WordArray = C_lib.WordArray;
            var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm;
            var C_enc = C.enc;
            var Utf8 = C_enc.Utf8;
            var Base64 = C_enc.Base64;
            var C_algo = C.algo;
            var EvpKDF = C_algo.EvpKDF;
    
            /**
             * Abstract base cipher template.
             *
             * @property {number} keySize This cipher's key size. Default: 4 (128 bits)
             * @property {number} ivSize This cipher's IV size. Default: 4 (128 bits)
             * @property {number} _ENC_XFORM_MODE A constant representing encryption mode.
             * @property {number} _DEC_XFORM_MODE A constant representing decryption mode.
             */
            var Cipher = C_lib.Cipher = BufferedBlockAlgorithm.extend({
                /**
                 * Configuration options.
                 *
                 * @property {WordArray} iv The IV to use for this operation.
                 */
                cfg: Base.extend(),
    
                /**
                 * Creates this cipher in encryption mode.
                 *
                 * @param {WordArray} key The key.
                 * @param {Object} cfg (Optional) The configuration options to use for this operation.
                 *
                 * @return {Cipher} A cipher instance.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var cipher = CryptoJS.algo.AES.createEncryptor(keyWordArray, { iv: ivWordArray });
                 */
                createEncryptor: function (key, cfg) {
                    return this.create(this._ENC_XFORM_MODE, key, cfg);
                },
    
                /**
                 * Creates this cipher in decryption mode.
                 *
                 * @param {WordArray} key The key.
                 * @param {Object} cfg (Optional) The configuration options to use for this operation.
                 *
                 * @return {Cipher} A cipher instance.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var cipher = CryptoJS.algo.AES.createDecryptor(keyWordArray, { iv: ivWordArray });
                 */
                createDecryptor: function (key, cfg) {
                    return this.create(this._DEC_XFORM_MODE, key, cfg);
                },
    
                /**
                 * Initializes a newly created cipher.
                 *
                 * @param {number} xformMode Either the encryption or decryption transormation mode constant.
                 * @param {WordArray} key The key.
                 * @param {Object} cfg (Optional) The configuration options to use for this operation.
                 *
                 * @example
                 *
                 *     var cipher = CryptoJS.algo.AES.create(CryptoJS.algo.AES._ENC_XFORM_MODE, keyWordArray, { iv: ivWordArray });
                 */
                init: function (xformMode, key, cfg) {
                    // Apply config defaults
                    this.cfg = this.cfg.extend(cfg);
    
                    // Store transform mode and key
                    this._xformMode = xformMode;
                    this._key = key;
    
                    // Set initial values
                    this.reset();
                },
    
                /**
                 * Resets this cipher to its initial state.
                 *
                 * @example
                 *
                 *     cipher.reset();
                 */
                reset: function () {
                    // Reset data buffer
                    BufferedBlockAlgorithm.reset.call(this);
    
                    // Perform concrete-cipher logic
                    this._doReset();
                },
    
                /**
                 * Adds data to be encrypted or decrypted.
                 *
                 * @param {WordArray|string} dataUpdate The data to encrypt or decrypt.
                 *
                 * @return {WordArray} The data after processing.
                 *
                 * @example
                 *
                 *     var encrypted = cipher.process('data');
                 *     var encrypted = cipher.process(wordArray);
                 */
                process: function (dataUpdate) {
                    // Append
                    this._append(dataUpdate);
    
                    // Process available blocks
                    return this._process();
                },
    
                /**
                 * Finalizes the encryption or decryption process.
                 * Note that the finalize operation is effectively a destructive, read-once operation.
                 *
                 * @param {WordArray|string} dataUpdate The final data to encrypt or decrypt.
                 *
                 * @return {WordArray} The data after final processing.
                 *
                 * @example
                 *
                 *     var encrypted = cipher.finalize();
                 *     var encrypted = cipher.finalize('data');
                 *     var encrypted = cipher.finalize(wordArray);
                 */
                finalize: function (dataUpdate) {
                    // Final data update
                    if (dataUpdate) {
                        this._append(dataUpdate);
                    }
    
                    // Perform concrete-cipher logic
                    var finalProcessedData = this._doFinalize();
    
                    return finalProcessedData;
                },
    
                keySize: 128/32,
    
                ivSize: 128/32,
    
                _ENC_XFORM_MODE: 1,
    
                _DEC_XFORM_MODE: 2,
    
                /**
                 * Creates shortcut functions to a cipher's object interface.
                 *
                 * @param {Cipher} cipher The cipher to create a helper for.
                 *
                 * @return {Object} An object with encrypt and decrypt shortcut functions.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var AES = CryptoJS.lib.Cipher._createHelper(CryptoJS.algo.AES);
                 */
                _createHelper: (function () {
                    function selectCipherStrategy(key) {
                        if (typeof key == 'string') {
                            return PasswordBasedCipher;
                        } else {
                            return SerializableCipher;
                        }
                    }
    
                    return function (cipher) {
                        return {
                            encrypt: function (message, key, cfg) {
                                return selectCipherStrategy(key).encrypt(cipher, message, key, cfg);
                            },
    
                            decrypt: function (ciphertext, key, cfg) {
                                return selectCipherStrategy(key).decrypt(cipher, ciphertext, key, cfg);
                            }
                        };
                    };
                }())
            });
    
            /**
             * Abstract base stream cipher template.
             *
             * @property {number} blockSize The number of 32-bit words this cipher operates on. Default: 1 (32 bits)
             */
            var StreamCipher = C_lib.StreamCipher = Cipher.extend({
                _doFinalize: function () {
                    // Process partial blocks
                    var finalProcessedBlocks = this._process(!!'flush');
    
                    return finalProcessedBlocks;
                },
    
                blockSize: 1
            });
    
            /**
             * Mode namespace.
             */
            var C_mode = C.mode = {};
    
            /**
             * Abstract base block cipher mode template.
             */
            var BlockCipherMode = C_lib.BlockCipherMode = Base.extend({
                /**
                 * Creates this mode for encryption.
                 *
                 * @param {Cipher} cipher A block cipher instance.
                 * @param {Array} iv The IV words.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var mode = CryptoJS.mode.CBC.createEncryptor(cipher, iv.words);
                 */
                createEncryptor: function (cipher, iv) {
                    return this.Encryptor.create(cipher, iv);
                },
    
                /**
                 * Creates this mode for decryption.
                 *
                 * @param {Cipher} cipher A block cipher instance.
                 * @param {Array} iv The IV words.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var mode = CryptoJS.mode.CBC.createDecryptor(cipher, iv.words);
                 */
                createDecryptor: function (cipher, iv) {
                    return this.Decryptor.create(cipher, iv);
                },
    
                /**
                 * Initializes a newly created mode.
                 *
                 * @param {Cipher} cipher A block cipher instance.
                 * @param {Array} iv The IV words.
                 *
                 * @example
                 *
                 *     var mode = CryptoJS.mode.CBC.Encryptor.create(cipher, iv.words);
                 */
                init: function (cipher, iv) {
                    this._cipher = cipher;
                    this._iv = iv;
                }
            });
    
            /**
             * Cipher Block Chaining mode.
             */
            var CBC = C_mode.CBC = (function () {
                /**
                 * Abstract base CBC mode.
                 */
                var CBC = BlockCipherMode.extend();
    
                /**
                 * CBC encryptor.
                 */
                CBC.Encryptor = CBC.extend({
                    /**
                     * Processes the data block at offset.
                     *
                     * @param {Array} words The data words to operate on.
                     * @param {number} offset The offset where the block starts.
                     *
                     * @example
                     *
                     *     mode.processBlock(data.words, offset);
                     */
                    processBlock: function (words, offset) {
                        // Shortcuts
                        var cipher = this._cipher;
                        var blockSize = cipher.blockSize;
    
                        // XOR and encrypt
                        xorBlock.call(this, words, offset, blockSize);
                        cipher.encryptBlock(words, offset);
    
                        // Remember this block to use with next block
                        this._prevBlock = words.slice(offset, offset + blockSize);
                    }
                });
    
                /**
                 * CBC decryptor.
                 */
                CBC.Decryptor = CBC.extend({
                    /**
                     * Processes the data block at offset.
                     *
                     * @param {Array} words The data words to operate on.
                     * @param {number} offset The offset where the block starts.
                     *
                     * @example
                     *
                     *     mode.processBlock(data.words, offset);
                     */
                    processBlock: function (words, offset) {
                        // Shortcuts
                        var cipher = this._cipher;
                        var blockSize = cipher.blockSize;
    
                        // Remember this block to use with next block
                        var thisBlock = words.slice(offset, offset + blockSize);
    
                        // Decrypt and XOR
                        cipher.decryptBlock(words, offset);
                        xorBlock.call(this, words, offset, blockSize);
    
                        // This block becomes the previous block
                        this._prevBlock = thisBlock;
                    }
                });
    
                function xorBlock(words, offset, blockSize) {
                    // Shortcut
                    var iv = this._iv;
    
                    // Choose mixing block
                    if (iv) {
                        var block = iv;
    
                        // Remove IV for subsequent blocks
                        this._iv = undefined;
                    } else {
                        var block = this._prevBlock;
                    }
    
                    // XOR blocks
                    for (var i = 0; i < blockSize; i++) {
                        words[offset + i] ^= block[i];
                    }
                }
    
                return CBC;
            }());
    
            /**
             * Padding namespace.
             */
            var C_pad = C.pad = {};
    
            /**
             * PKCS #5/7 padding strategy.
             */
            var Pkcs7 = C_pad.Pkcs7 = {
                /**
                 * Pads data using the algorithm defined in PKCS #5/7.
                 *
                 * @param {WordArray} data The data to pad.
                 * @param {number} blockSize The multiple that the data should be padded to.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     CryptoJS.pad.Pkcs7.pad(wordArray, 4);
                 */
                pad: function (data, blockSize) {
                    // Shortcut
                    var blockSizeBytes = blockSize * 4;
    
                    // Count padding bytes
                    var nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;
    
                    // Create padding word
                    var paddingWord = (nPaddingBytes << 24) | (nPaddingBytes << 16) | (nPaddingBytes << 8) | nPaddingBytes;
    
                    // Create padding
                    var paddingWords = [];
                    for (var i = 0; i < nPaddingBytes; i += 4) {
                        paddingWords.push(paddingWord);
                    }
                    var padding = WordArray.create(paddingWords, nPaddingBytes);
    
                    // Add padding
                    data.concat(padding);
                },
    
                /**
                 * Unpads data that had been padded using the algorithm defined in PKCS #5/7.
                 *
                 * @param {WordArray} data The data to unpad.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     CryptoJS.pad.Pkcs7.unpad(wordArray);
                 */
                unpad: function (data) {
                    // Get number of padding bytes from last byte
                    var nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;
    
                    // Remove padding
                    data.sigBytes -= nPaddingBytes;
                }
            };
    
            /**
             * Abstract base block cipher template.
             *
             * @property {number} blockSize The number of 32-bit words this cipher operates on. Default: 4 (128 bits)
             */
            var BlockCipher = C_lib.BlockCipher = Cipher.extend({
                /**
                 * Configuration options.
                 *
                 * @property {Mode} mode The block mode to use. Default: CBC
                 * @property {Padding} padding The padding strategy to use. Default: Pkcs7
                 */
                cfg: Cipher.cfg.extend({
                    mode: CBC,
                    padding: Pkcs7
                }),
    
                reset: function () {
                    // Reset cipher
                    Cipher.reset.call(this);
    
                    // Shortcuts
                    var cfg = this.cfg;
                    var iv = cfg.iv;
                    var mode = cfg.mode;
    
                    // Reset block mode
                    if (this._xformMode == this._ENC_XFORM_MODE) {
                        var modeCreator = mode.createEncryptor;
                    } else /* if (this._xformMode == this._DEC_XFORM_MODE) */ {
                        var modeCreator = mode.createDecryptor;
                        // Keep at least one block in the buffer for unpadding
                        this._minBufferSize = 1;
                    }
    
                    if (this._mode && this._mode.__creator == modeCreator) {
                        this._mode.init(this, iv && iv.words);
                    } else {
                        this._mode = modeCreator.call(mode, this, iv && iv.words);
                        this._mode.__creator = modeCreator;
                    }
                },
    
                _doProcessBlock: function (words, offset) {
                    this._mode.processBlock(words, offset);
                },
    
                _doFinalize: function () {
                    // Shortcut
                    var padding = this.cfg.padding;
    
                    // Finalize
                    if (this._xformMode == this._ENC_XFORM_MODE) {
                        // Pad data
                        padding.pad(this._data, this.blockSize);
    
                        // Process final blocks
                        var finalProcessedBlocks = this._process(!!'flush');
                    } else /* if (this._xformMode == this._DEC_XFORM_MODE) */ {
                        // Process final blocks
                        var finalProcessedBlocks = this._process(!!'flush');
    
                        // Unpad data
                        padding.unpad(finalProcessedBlocks);
                    }
    
                    return finalProcessedBlocks;
                },
    
                blockSize: 128/32
            });
    
            /**
             * A collection of cipher parameters.
             *
             * @property {WordArray} ciphertext The raw ciphertext.
             * @property {WordArray} key The key to this ciphertext.
             * @property {WordArray} iv The IV used in the ciphering operation.
             * @property {WordArray} salt The salt used with a key derivation function.
             * @property {Cipher} algorithm The cipher algorithm.
             * @property {Mode} mode The block mode used in the ciphering operation.
             * @property {Padding} padding The padding scheme used in the ciphering operation.
             * @property {number} blockSize The block size of the cipher.
             * @property {Format} formatter The default formatting strategy to convert this cipher params object to a string.
             */
            var CipherParams = C_lib.CipherParams = Base.extend({
                /**
                 * Initializes a newly created cipher params object.
                 *
                 * @param {Object} cipherParams An object with any of the possible cipher parameters.
                 *
                 * @example
                 *
                 *     var cipherParams = CryptoJS.lib.CipherParams.create({
                 *         ciphertext: ciphertextWordArray,
                 *         key: keyWordArray,
                 *         iv: ivWordArray,
                 *         salt: saltWordArray,
                 *         algorithm: CryptoJS.algo.AES,
                 *         mode: CryptoJS.mode.CBC,
                 *         padding: CryptoJS.pad.PKCS7,
                 *         blockSize: 4,
                 *         formatter: CryptoJS.format.OpenSSL
                 *     });
                 */
                init: function (cipherParams) {
                    this.mixIn(cipherParams);
                },
    
                /**
                 * Converts this cipher params object to a string.
                 *
                 * @param {Format} formatter (Optional) The formatting strategy to use.
                 *
                 * @return {string} The stringified cipher params.
                 *
                 * @throws Error If neither the formatter nor the default formatter is set.
                 *
                 * @example
                 *
                 *     var string = cipherParams + '';
                 *     var string = cipherParams.toString();
                 *     var string = cipherParams.toString(CryptoJS.format.OpenSSL);
                 */
                toString: function (formatter) {
                    return (formatter || this.formatter).stringify(this);
                }
            });
    
            /**
             * Format namespace.
             */
            var C_format = C.format = {};
    
            /**
             * OpenSSL formatting strategy.
             */
            var OpenSSLFormatter = C_format.OpenSSL = {
                /**
                 * Converts a cipher params object to an OpenSSL-compatible string.
                 *
                 * @param {CipherParams} cipherParams The cipher params object.
                 *
                 * @return {string} The OpenSSL-compatible string.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var openSSLString = CryptoJS.format.OpenSSL.stringify(cipherParams);
                 */
                stringify: function (cipherParams) {
                    // Shortcuts
                    var ciphertext = cipherParams.ciphertext;
                    var salt = cipherParams.salt;
    
                    // Format
                    if (salt) {
                        var wordArray = WordArray.create([0x53616c74, 0x65645f5f]).concat(salt).concat(ciphertext);
                    } else {
                        var wordArray = ciphertext;
                    }
    
                    return wordArray.toString(Base64);
                },
    
                /**
                 * Converts an OpenSSL-compatible string to a cipher params object.
                 *
                 * @param {string} openSSLStr The OpenSSL-compatible string.
                 *
                 * @return {CipherParams} The cipher params object.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var cipherParams = CryptoJS.format.OpenSSL.parse(openSSLString);
                 */
                parse: function (openSSLStr) {
                    // Parse base64
                    var ciphertext = Base64.parse(openSSLStr);
    
                    // Shortcut
                    var ciphertextWords = ciphertext.words;
    
                    // Test for salt
                    if (ciphertextWords[0] == 0x53616c74 && ciphertextWords[1] == 0x65645f5f) {
                        // Extract salt
                        var salt = WordArray.create(ciphertextWords.slice(2, 4));
    
                        // Remove salt from ciphertext
                        ciphertextWords.splice(0, 4);
                        ciphertext.sigBytes -= 16;
                    }
    
                    return CipherParams.create({ ciphertext: ciphertext, salt: salt });
                }
            };
    
            /**
             * A cipher wrapper that returns ciphertext as a serializable cipher params object.
             */
            var SerializableCipher = C_lib.SerializableCipher = Base.extend({
                /**
                 * Configuration options.
                 *
                 * @property {Formatter} format The formatting strategy to convert cipher param objects to and from a string. Default: OpenSSL
                 */
                cfg: Base.extend({
                    format: OpenSSLFormatter
                }),
    
                /**
                 * Encrypts a message.
                 *
                 * @param {Cipher} cipher The cipher algorithm to use.
                 * @param {WordArray|string} message The message to encrypt.
                 * @param {WordArray} key The key.
                 * @param {Object} cfg (Optional) The configuration options to use for this operation.
                 *
                 * @return {CipherParams} A cipher params object.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key);
                 *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, { iv: iv });
                 *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, { iv: iv, format: CryptoJS.format.OpenSSL });
                 */
                encrypt: function (cipher, message, key, cfg) {
                    // Apply config defaults
                    cfg = this.cfg.extend(cfg);
    
                    // Encrypt
                    var encryptor = cipher.createEncryptor(key, cfg);
                    var ciphertext = encryptor.finalize(message);
    
                    // Shortcut
                    var cipherCfg = encryptor.cfg;
    
                    // Create and return serializable cipher params
                    return CipherParams.create({
                        ciphertext: ciphertext,
                        key: key,
                        iv: cipherCfg.iv,
                        algorithm: cipher,
                        mode: cipherCfg.mode,
                        padding: cipherCfg.padding,
                        blockSize: cipher.blockSize,
                        formatter: cfg.format
                    });
                },
    
                /**
                 * Decrypts serialized ciphertext.
                 *
                 * @param {Cipher} cipher The cipher algorithm to use.
                 * @param {CipherParams|string} ciphertext The ciphertext to decrypt.
                 * @param {WordArray} key The key.
                 * @param {Object} cfg (Optional) The configuration options to use for this operation.
                 *
                 * @return {WordArray} The plaintext.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var plaintext = CryptoJS.lib.SerializableCipher.decrypt(CryptoJS.algo.AES, formattedCiphertext, key, { iv: iv, format: CryptoJS.format.OpenSSL });
                 *     var plaintext = CryptoJS.lib.SerializableCipher.decrypt(CryptoJS.algo.AES, ciphertextParams, key, { iv: iv, format: CryptoJS.format.OpenSSL });
                 */
                decrypt: function (cipher, ciphertext, key, cfg) {
                    // Apply config defaults
                    cfg = this.cfg.extend(cfg);
    
                    // Convert string to CipherParams
                    ciphertext = this._parse(ciphertext, cfg.format);
    
                    // Decrypt
                    var plaintext = cipher.createDecryptor(key, cfg).finalize(ciphertext.ciphertext);
    
                    return plaintext;
                },
    
                /**
                 * Converts serialized ciphertext to CipherParams,
                 * else assumed CipherParams already and returns ciphertext unchanged.
                 *
                 * @param {CipherParams|string} ciphertext The ciphertext.
                 * @param {Formatter} format The formatting strategy to use to parse serialized ciphertext.
                 *
                 * @return {CipherParams} The unserialized ciphertext.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var ciphertextParams = CryptoJS.lib.SerializableCipher._parse(ciphertextStringOrParams, format);
                 */
                _parse: function (ciphertext, format) {
                    if (typeof ciphertext == 'string') {
                        return format.parse(ciphertext, this);
                    } else {
                        return ciphertext;
                    }
                }
            });
    
            /**
             * Key derivation function namespace.
             */
            var C_kdf = C.kdf = {};
    
            /**
             * OpenSSL key derivation function.
             */
            var OpenSSLKdf = C_kdf.OpenSSL = {
                /**
                 * Derives a key and IV from a password.
                 *
                 * @param {string} password The password to derive from.
                 * @param {number} keySize The size in words of the key to generate.
                 * @param {number} ivSize The size in words of the IV to generate.
                 * @param {WordArray|string} salt (Optional) A 64-bit salt to use. If omitted, a salt will be generated randomly.
                 *
                 * @return {CipherParams} A cipher params object with the key, IV, and salt.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var derivedParams = CryptoJS.kdf.OpenSSL.execute('Password', 256/32, 128/32);
                 *     var derivedParams = CryptoJS.kdf.OpenSSL.execute('Password', 256/32, 128/32, 'saltsalt');
                 */
                execute: function (password, keySize, ivSize, salt) {
                    // Generate random salt
                    if (!salt) {
                        salt = WordArray.random(64/8);
                    }
    
                    // Derive key and IV
                    var key = EvpKDF.create({ keySize: keySize + ivSize }).compute(password, salt);
    
                    // Separate key and IV
                    var iv = WordArray.create(key.words.slice(keySize), ivSize * 4);
                    key.sigBytes = keySize * 4;
    
                    // Return params
                    return CipherParams.create({ key: key, iv: iv, salt: salt });
                }
            };
    
            /**
             * A serializable cipher wrapper that derives the key from a password,
             * and returns ciphertext as a serializable cipher params object.
             */
            var PasswordBasedCipher = C_lib.PasswordBasedCipher = SerializableCipher.extend({
                /**
                 * Configuration options.
                 *
                 * @property {KDF} kdf The key derivation function to use to generate a key and IV from a password. Default: OpenSSL
                 */
                cfg: SerializableCipher.cfg.extend({
                    kdf: OpenSSLKdf
                }),
    
                /**
                 * Encrypts a message using a password.
                 *
                 * @param {Cipher} cipher The cipher algorithm to use.
                 * @param {WordArray|string} message The message to encrypt.
                 * @param {string} password The password.
                 * @param {Object} cfg (Optional) The configuration options to use for this operation.
                 *
                 * @return {CipherParams} A cipher params object.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(CryptoJS.algo.AES, message, 'password');
                 *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(CryptoJS.algo.AES, message, 'password', { format: CryptoJS.format.OpenSSL });
                 */
                encrypt: function (cipher, message, password, cfg) {
                    // Apply config defaults
                    cfg = this.cfg.extend(cfg);
    
                    // Derive key and other params
                    var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize);
    
                    // Add IV to config
                    cfg.iv = derivedParams.iv;
    
                    // Encrypt
                    var ciphertext = SerializableCipher.encrypt.call(this, cipher, message, derivedParams.key, cfg);
    
                    // Mix in derived params
                    ciphertext.mixIn(derivedParams);
    
                    return ciphertext;
                },
    
                /**
                 * Decrypts serialized ciphertext using a password.
                 *
                 * @param {Cipher} cipher The cipher algorithm to use.
                 * @param {CipherParams|string} ciphertext The ciphertext to decrypt.
                 * @param {string} password The password.
                 * @param {Object} cfg (Optional) The configuration options to use for this operation.
                 *
                 * @return {WordArray} The plaintext.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var plaintext = CryptoJS.lib.PasswordBasedCipher.decrypt(CryptoJS.algo.AES, formattedCiphertext, 'password', { format: CryptoJS.format.OpenSSL });
                 *     var plaintext = CryptoJS.lib.PasswordBasedCipher.decrypt(CryptoJS.algo.AES, ciphertextParams, 'password', { format: CryptoJS.format.OpenSSL });
                 */
                decrypt: function (cipher, ciphertext, password, cfg) {
                    // Apply config defaults
                    cfg = this.cfg.extend(cfg);
    
                    // Convert string to CipherParams
                    ciphertext = this._parse(ciphertext, cfg.format);
    
                    // Derive key and other params
                    var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize, ciphertext.salt);
    
                    // Add IV to config
                    cfg.iv = derivedParams.iv;
    
                    // Decrypt
                    var plaintext = SerializableCipher.decrypt.call(this, cipher, ciphertext, derivedParams.key, cfg);
    
                    return plaintext;
                }
            });
        }());
    
    
    }));
    },{"./core":5,"./evpkdf":8}],5:[function(require,module,exports){
    ;(function (root, factory) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory();
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define([], factory);
        }
        else {
            // Global (browser)
            root.CryptoJS = factory();
        }
    }(this, function () {
    
        /**
         * CryptoJS core components.
         */
        var CryptoJS = CryptoJS || (function (Math, undefined) {
            /*
             * Local polyfil of Object.create
             */
            var create = Object.create || (function () {
                function F() {};
    
                return function (obj) {
                    var subtype;
    
                    F.prototype = obj;
    
                    subtype = new F();
    
                    F.prototype = null;
    
                    return subtype;
                };
            }())
    
            /**
             * CryptoJS namespace.
             */
            var C = {};
    
            /**
             * Library namespace.
             */
            var C_lib = C.lib = {};
    
            /**
             * Base object for prototypal inheritance.
             */
            var Base = C_lib.Base = (function () {
    
    
                return {
                    /**
                     * Creates a new object that inherits from this object.
                     *
                     * @param {Object} overrides Properties to copy into the new object.
                     *
                     * @return {Object} The new object.
                     *
                     * @static
                     *
                     * @example
                     *
                     *     var MyType = CryptoJS.lib.Base.extend({
                     *         field: 'value',
                     *
                     *         method: function () {
                     *         }
                     *     });
                     */
                    extend: function (overrides) {
                        // Spawn
                        var subtype = create(this);
    
                        // Augment
                        if (overrides) {
                            subtype.mixIn(overrides);
                        }
    
                        // Create default initializer
                        if (!subtype.hasOwnProperty('init') || this.init === subtype.init) {
                            subtype.init = function () {
                                subtype.$super.init.apply(this, arguments);
                            };
                        }
    
                        // Initializer's prototype is the subtype object
                        subtype.init.prototype = subtype;
    
                        // Reference supertype
                        subtype.$super = this;
    
                        return subtype;
                    },
    
                    /**
                     * Extends this object and runs the init method.
                     * Arguments to create() will be passed to init().
                     *
                     * @return {Object} The new object.
                     *
                     * @static
                     *
                     * @example
                     *
                     *     var instance = MyType.create();
                     */
                    create: function () {
                        var instance = this.extend();
                        instance.init.apply(instance, arguments);
    
                        return instance;
                    },
    
                    /**
                     * Initializes a newly created object.
                     * Override this method to add some logic when your objects are created.
                     *
                     * @example
                     *
                     *     var MyType = CryptoJS.lib.Base.extend({
                     *         init: function () {
                     *             // ...
                     *         }
                     *     });
                     */
                    init: function () {
                    },
    
                    /**
                     * Copies properties into this object.
                     *
                     * @param {Object} properties The properties to mix in.
                     *
                     * @example
                     *
                     *     MyType.mixIn({
                     *         field: 'value'
                     *     });
                     */
                    mixIn: function (properties) {
                        for (var propertyName in properties) {
                            if (properties.hasOwnProperty(propertyName)) {
                                this[propertyName] = properties[propertyName];
                            }
                        }
    
                        // IE won't copy toString using the loop above
                        if (properties.hasOwnProperty('toString')) {
                            this.toString = properties.toString;
                        }
                    },
    
                    /**
                     * Creates a copy of this object.
                     *
                     * @return {Object} The clone.
                     *
                     * @example
                     *
                     *     var clone = instance.clone();
                     */
                    clone: function () {
                        return this.init.prototype.extend(this);
                    }
                };
            }());
    
            /**
             * An array of 32-bit words.
             *
             * @property {Array} words The array of 32-bit words.
             * @property {number} sigBytes The number of significant bytes in this word array.
             */
            var WordArray = C_lib.WordArray = Base.extend({
                /**
                 * Initializes a newly created word array.
                 *
                 * @param {Array} words (Optional) An array of 32-bit words.
                 * @param {number} sigBytes (Optional) The number of significant bytes in the words.
                 *
                 * @example
                 *
                 *     var wordArray = CryptoJS.lib.WordArray.create();
                 *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607]);
                 *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
                 */
                init: function (words, sigBytes) {
                    words = this.words = words || [];
    
                    if (sigBytes != undefined) {
                        this.sigBytes = sigBytes;
                    } else {
                        this.sigBytes = words.length * 4;
                    }
                },
    
                /**
                 * Converts this word array to a string.
                 *
                 * @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
                 *
                 * @return {string} The stringified word array.
                 *
                 * @example
                 *
                 *     var string = wordArray + '';
                 *     var string = wordArray.toString();
                 *     var string = wordArray.toString(CryptoJS.enc.Utf8);
                 */
                toString: function (encoder) {
                    return (encoder || Hex).stringify(this);
                },
    
                /**
                 * Concatenates a word array to this word array.
                 *
                 * @param {WordArray} wordArray The word array to append.
                 *
                 * @return {WordArray} This word array.
                 *
                 * @example
                 *
                 *     wordArray1.concat(wordArray2);
                 */
                concat: function (wordArray) {
                    // Shortcuts
                    var thisWords = this.words;
                    var thatWords = wordArray.words;
                    var thisSigBytes = this.sigBytes;
                    var thatSigBytes = wordArray.sigBytes;
    
                    // Clamp excess bits
                    this.clamp();
    
                    // Concat
                    if (thisSigBytes % 4) {
                        // Copy one byte at a time
                        for (var i = 0; i < thatSigBytes; i++) {
                            var thatByte = (thatWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                            thisWords[(thisSigBytes + i) >>> 2] |= thatByte << (24 - ((thisSigBytes + i) % 4) * 8);
                        }
                    } else {
                        // Copy one word at a time
                        for (var i = 0; i < thatSigBytes; i += 4) {
                            thisWords[(thisSigBytes + i) >>> 2] = thatWords[i >>> 2];
                        }
                    }
                    this.sigBytes += thatSigBytes;
    
                    // Chainable
                    return this;
                },
    
                /**
                 * Removes insignificant bits.
                 *
                 * @example
                 *
                 *     wordArray.clamp();
                 */
                clamp: function () {
                    // Shortcuts
                    var words = this.words;
                    var sigBytes = this.sigBytes;
    
                    // Clamp
                    words[sigBytes >>> 2] &= 0xffffffff << (32 - (sigBytes % 4) * 8);
                    words.length = Math.ceil(sigBytes / 4);
                },
    
                /**
                 * Creates a copy of this word array.
                 *
                 * @return {WordArray} The clone.
                 *
                 * @example
                 *
                 *     var clone = wordArray.clone();
                 */
                clone: function () {
                    var clone = Base.clone.call(this);
                    clone.words = this.words.slice(0);
    
                    return clone;
                },
    
                /**
                 * Creates a word array filled with random bytes.
                 *
                 * @param {number} nBytes The number of random bytes to generate.
                 *
                 * @return {WordArray} The random word array.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var wordArray = CryptoJS.lib.WordArray.random(16);
                 */
                random: function (nBytes) {
                    var words = [];
    
                    var r = (function (m_w) {
                        var m_w = m_w;
                        var m_z = 0x3ade68b1;
                        var mask = 0xffffffff;
    
                        return function () {
                            m_z = (0x9069 * (m_z & 0xFFFF) + (m_z >> 0x10)) & mask;
                            m_w = (0x4650 * (m_w & 0xFFFF) + (m_w >> 0x10)) & mask;
                            var result = ((m_z << 0x10) + m_w) & mask;
                            result /= 0x100000000;
                            result += 0.5;
                            return result * (Math.random() > .5 ? 1 : -1);
                        }
                    });
    
                    for (var i = 0, rcache; i < nBytes; i += 4) {
                        var _r = r((rcache || Math.random()) * 0x100000000);
    
                        rcache = _r() * 0x3ade67b7;
                        words.push((_r() * 0x100000000) | 0);
                    }
    
                    return new WordArray.init(words, nBytes);
                }
            });
    
            /**
             * Encoder namespace.
             */
            var C_enc = C.enc = {};
    
            /**
             * Hex encoding strategy.
             */
            var Hex = C_enc.Hex = {
                /**
                 * Converts a word array to a hex string.
                 *
                 * @param {WordArray} wordArray The word array.
                 *
                 * @return {string} The hex string.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var hexString = CryptoJS.enc.Hex.stringify(wordArray);
                 */
                stringify: function (wordArray) {
                    // Shortcuts
                    var words = wordArray.words;
                    var sigBytes = wordArray.sigBytes;
    
                    // Convert
                    var hexChars = [];
                    for (var i = 0; i < sigBytes; i++) {
                        var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                        hexChars.push((bite >>> 4).toString(16));
                        hexChars.push((bite & 0x0f).toString(16));
                    }
    
                    return hexChars.join('');
                },
    
                /**
                 * Converts a hex string to a word array.
                 *
                 * @param {string} hexStr The hex string.
                 *
                 * @return {WordArray} The word array.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var wordArray = CryptoJS.enc.Hex.parse(hexString);
                 */
                parse: function (hexStr) {
                    // Shortcut
                    var hexStrLength = hexStr.length;
    
                    // Convert
                    var words = [];
                    for (var i = 0; i < hexStrLength; i += 2) {
                        words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << (24 - (i % 8) * 4);
                    }
    
                    return new WordArray.init(words, hexStrLength / 2);
                }
            };
    
            /**
             * Latin1 encoding strategy.
             */
            var Latin1 = C_enc.Latin1 = {
                /**
                 * Converts a word array to a Latin1 string.
                 *
                 * @param {WordArray} wordArray The word array.
                 *
                 * @return {string} The Latin1 string.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var latin1String = CryptoJS.enc.Latin1.stringify(wordArray);
                 */
                stringify: function (wordArray) {
                    // Shortcuts
                    var words = wordArray.words;
                    var sigBytes = wordArray.sigBytes;
    
                    // Convert
                    var latin1Chars = [];
                    for (var i = 0; i < sigBytes; i++) {
                        var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                        latin1Chars.push(String.fromCharCode(bite));
                    }
    
                    return latin1Chars.join('');
                },
    
                /**
                 * Converts a Latin1 string to a word array.
                 *
                 * @param {string} latin1Str The Latin1 string.
                 *
                 * @return {WordArray} The word array.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
                 */
                parse: function (latin1Str) {
                    // Shortcut
                    var latin1StrLength = latin1Str.length;
    
                    // Convert
                    var words = [];
                    for (var i = 0; i < latin1StrLength; i++) {
                        words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
                    }
    
                    return new WordArray.init(words, latin1StrLength);
                }
            };
    
            /**
             * UTF-8 encoding strategy.
             */
            var Utf8 = C_enc.Utf8 = {
                /**
                 * Converts a word array to a UTF-8 string.
                 *
                 * @param {WordArray} wordArray The word array.
                 *
                 * @return {string} The UTF-8 string.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var utf8String = CryptoJS.enc.Utf8.stringify(wordArray);
                 */
                stringify: function (wordArray) {
                    try {
                        return decodeURIComponent(escape(Latin1.stringify(wordArray)));
                    } catch (e) {
                        throw new Error('Malformed UTF-8 data');
                    }
                },
    
                /**
                 * Converts a UTF-8 string to a word array.
                 *
                 * @param {string} utf8Str The UTF-8 string.
                 *
                 * @return {WordArray} The word array.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var wordArray = CryptoJS.enc.Utf8.parse(utf8String);
                 */
                parse: function (utf8Str) {
                    return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
                }
            };
    
            /**
             * Abstract buffered block algorithm template.
             *
             * The property blockSize must be implemented in a concrete subtype.
             *
             * @property {number} _minBufferSize The number of blocks that should be kept unprocessed in the buffer. Default: 0
             */
            var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
                /**
                 * Resets this block algorithm's data buffer to its initial state.
                 *
                 * @example
                 *
                 *     bufferedBlockAlgorithm.reset();
                 */
                reset: function () {
                    // Initial values
                    this._data = new WordArray.init();
                    this._nDataBytes = 0;
                },
    
                /**
                 * Adds new data to this block algorithm's buffer.
                 *
                 * @param {WordArray|string} data The data to append. Strings are converted to a WordArray using UTF-8.
                 *
                 * @example
                 *
                 *     bufferedBlockAlgorithm._append('data');
                 *     bufferedBlockAlgorithm._append(wordArray);
                 */
                _append: function (data) {
                    // Convert string to WordArray, else assume WordArray already
                    if (typeof data == 'string') {
                        data = Utf8.parse(data);
                    }
    
                    // Append
                    this._data.concat(data);
                    this._nDataBytes += data.sigBytes;
                },
    
                /**
                 * Processes available data blocks.
                 *
                 * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
                 *
                 * @param {boolean} doFlush Whether all blocks and partial blocks should be processed.
                 *
                 * @return {WordArray} The processed data.
                 *
                 * @example
                 *
                 *     var processedData = bufferedBlockAlgorithm._process();
                 *     var processedData = bufferedBlockAlgorithm._process(!!'flush');
                 */
                _process: function (doFlush) {
                    // Shortcuts
                    var data = this._data;
                    var dataWords = data.words;
                    var dataSigBytes = data.sigBytes;
                    var blockSize = this.blockSize;
                    var blockSizeBytes = blockSize * 4;
    
                    // Count blocks ready
                    var nBlocksReady = dataSigBytes / blockSizeBytes;
                    if (doFlush) {
                        // Round up to include partial blocks
                        nBlocksReady = Math.ceil(nBlocksReady);
                    } else {
                        // Round down to include only full blocks,
                        // less the number of blocks that must remain in the buffer
                        nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
                    }
    
                    // Count words ready
                    var nWordsReady = nBlocksReady * blockSize;
    
                    // Count bytes ready
                    var nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);
    
                    // Process blocks
                    if (nWordsReady) {
                        for (var offset = 0; offset < nWordsReady; offset += blockSize) {
                            // Perform concrete-algorithm logic
                            this._doProcessBlock(dataWords, offset);
                        }
    
                        // Remove processed words
                        var processedWords = dataWords.splice(0, nWordsReady);
                        data.sigBytes -= nBytesReady;
                    }
    
                    // Return processed words
                    return new WordArray.init(processedWords, nBytesReady);
                },
    
                /**
                 * Creates a copy of this object.
                 *
                 * @return {Object} The clone.
                 *
                 * @example
                 *
                 *     var clone = bufferedBlockAlgorithm.clone();
                 */
                clone: function () {
                    var clone = Base.clone.call(this);
                    clone._data = this._data.clone();
    
                    return clone;
                },
    
                _minBufferSize: 0
            });
    
            /**
             * Abstract hasher template.
             *
             * @property {number} blockSize The number of 32-bit words this hasher operates on. Default: 16 (512 bits)
             */
            var Hasher = C_lib.Hasher = BufferedBlockAlgorithm.extend({
                /**
                 * Configuration options.
                 */
                cfg: Base.extend(),
    
                /**
                 * Initializes a newly created hasher.
                 *
                 * @param {Object} cfg (Optional) The configuration options to use for this hash computation.
                 *
                 * @example
                 *
                 *     var hasher = CryptoJS.algo.SHA256.create();
                 */
                init: function (cfg) {
                    // Apply config defaults
                    this.cfg = this.cfg.extend(cfg);
    
                    // Set initial values
                    this.reset();
                },
    
                /**
                 * Resets this hasher to its initial state.
                 *
                 * @example
                 *
                 *     hasher.reset();
                 */
                reset: function () {
                    // Reset data buffer
                    BufferedBlockAlgorithm.reset.call(this);
    
                    // Perform concrete-hasher logic
                    this._doReset();
                },
    
                /**
                 * Updates this hasher with a message.
                 *
                 * @param {WordArray|string} messageUpdate The message to append.
                 *
                 * @return {Hasher} This hasher.
                 *
                 * @example
                 *
                 *     hasher.update('message');
                 *     hasher.update(wordArray);
                 */
                update: function (messageUpdate) {
                    // Append
                    this._append(messageUpdate);
    
                    // Update the hash
                    this._process();
    
                    // Chainable
                    return this;
                },
    
                /**
                 * Finalizes the hash computation.
                 * Note that the finalize operation is effectively a destructive, read-once operation.
                 *
                 * @param {WordArray|string} messageUpdate (Optional) A final message update.
                 *
                 * @return {WordArray} The hash.
                 *
                 * @example
                 *
                 *     var hash = hasher.finalize();
                 *     var hash = hasher.finalize('message');
                 *     var hash = hasher.finalize(wordArray);
                 */
                finalize: function (messageUpdate) {
                    // Final message update
                    if (messageUpdate) {
                        this._append(messageUpdate);
                    }
    
                    // Perform concrete-hasher logic
                    var hash = this._doFinalize();
    
                    return hash;
                },
    
                blockSize: 512/32,
    
                /**
                 * Creates a shortcut function to a hasher's object interface.
                 *
                 * @param {Hasher} hasher The hasher to create a helper for.
                 *
                 * @return {Function} The shortcut function.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
                 */
                _createHelper: function (hasher) {
                    return function (message, cfg) {
                        return new hasher.init(cfg).finalize(message);
                    };
                },
    
                /**
                 * Creates a shortcut function to the HMAC's object interface.
                 *
                 * @param {Hasher} hasher The hasher to use in this HMAC helper.
                 *
                 * @return {Function} The shortcut function.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
                 */
                _createHmacHelper: function (hasher) {
                    return function (message, key) {
                        return new C_algo.HMAC.init(hasher, key).finalize(message);
                    };
                }
            });
    
            /**
             * Algorithm namespace.
             */
            var C_algo = C.algo = {};
    
            return C;
        }(Math));
    
    
        return CryptoJS;
    
    }));
    },{}],6:[function(require,module,exports){
    ;(function (root, factory) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        (function () {
            // Shortcuts
            var C = CryptoJS;
            var C_lib = C.lib;
            var WordArray = C_lib.WordArray;
            var C_enc = C.enc;
    
            /**
             * Base64 encoding strategy.
             */
            var Base64 = C_enc.Base64 = {
                /**
                 * Converts a word array to a Base64 string.
                 *
                 * @param {WordArray} wordArray The word array.
                 *
                 * @return {string} The Base64 string.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var base64String = CryptoJS.enc.Base64.stringify(wordArray);
                 */
                stringify: function (wordArray) {
                    // Shortcuts
                    var words = wordArray.words;
                    var sigBytes = wordArray.sigBytes;
                    var map = this._map;
    
                    // Clamp excess bits
                    wordArray.clamp();
    
                    // Convert
                    var base64Chars = [];
                    for (var i = 0; i < sigBytes; i += 3) {
                        var byte1 = (words[i >>> 2]       >>> (24 - (i % 4) * 8))       & 0xff;
                        var byte2 = (words[(i + 1) >>> 2] >>> (24 - ((i + 1) % 4) * 8)) & 0xff;
                        var byte3 = (words[(i + 2) >>> 2] >>> (24 - ((i + 2) % 4) * 8)) & 0xff;
    
                        var triplet = (byte1 << 16) | (byte2 << 8) | byte3;
    
                        for (var j = 0; (j < 4) && (i + j * 0.75 < sigBytes); j++) {
                            base64Chars.push(map.charAt((triplet >>> (6 * (3 - j))) & 0x3f));
                        }
                    }
    
                    // Add padding
                    var paddingChar = map.charAt(64);
                    if (paddingChar) {
                        while (base64Chars.length % 4) {
                            base64Chars.push(paddingChar);
                        }
                    }
    
                    return base64Chars.join('');
                },
    
                /**
                 * Converts a Base64 string to a word array.
                 *
                 * @param {string} base64Str The Base64 string.
                 *
                 * @return {WordArray} The word array.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var wordArray = CryptoJS.enc.Base64.parse(base64String);
                 */
                parse: function (base64Str) {
                    // Shortcuts
                    var base64StrLength = base64Str.length;
                    var map = this._map;
                    var reverseMap = this._reverseMap;
    
                    if (!reverseMap) {
                            reverseMap = this._reverseMap = [];
                            for (var j = 0; j < map.length; j++) {
                                reverseMap[map.charCodeAt(j)] = j;
                            }
                    }
    
                    // Ignore padding
                    var paddingChar = map.charAt(64);
                    if (paddingChar) {
                        var paddingIndex = base64Str.indexOf(paddingChar);
                        if (paddingIndex !== -1) {
                            base64StrLength = paddingIndex;
                        }
                    }
    
                    // Convert
                    return parseLoop(base64Str, base64StrLength, reverseMap);
    
                },
    
                _map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
            };
    
            function parseLoop(base64Str, base64StrLength, reverseMap) {
              var words = [];
              var nBytes = 0;
              for (var i = 0; i < base64StrLength; i++) {
                  if (i % 4) {
                      var bits1 = reverseMap[base64Str.charCodeAt(i - 1)] << ((i % 4) * 2);
                      var bits2 = reverseMap[base64Str.charCodeAt(i)] >>> (6 - (i % 4) * 2);
                      words[nBytes >>> 2] |= (bits1 | bits2) << (24 - (nBytes % 4) * 8);
                      nBytes++;
                  }
              }
              return WordArray.create(words, nBytes);
            }
        }());
    
    
        return CryptoJS.enc.Base64;
    
    }));
    },{"./core":5}],7:[function(require,module,exports){
    ;(function (root, factory) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        (function () {
            // Shortcuts
            var C = CryptoJS;
            var C_lib = C.lib;
            var WordArray = C_lib.WordArray;
            var C_enc = C.enc;
    
            /**
             * UTF-16 BE encoding strategy.
             */
            var Utf16BE = C_enc.Utf16 = C_enc.Utf16BE = {
                /**
                 * Converts a word array to a UTF-16 BE string.
                 *
                 * @param {WordArray} wordArray The word array.
                 *
                 * @return {string} The UTF-16 BE string.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var utf16String = CryptoJS.enc.Utf16.stringify(wordArray);
                 */
                stringify: function (wordArray) {
                    // Shortcuts
                    var words = wordArray.words;
                    var sigBytes = wordArray.sigBytes;
    
                    // Convert
                    var utf16Chars = [];
                    for (var i = 0; i < sigBytes; i += 2) {
                        var codePoint = (words[i >>> 2] >>> (16 - (i % 4) * 8)) & 0xffff;
                        utf16Chars.push(String.fromCharCode(codePoint));
                    }
    
                    return utf16Chars.join('');
                },
    
                /**
                 * Converts a UTF-16 BE string to a word array.
                 *
                 * @param {string} utf16Str The UTF-16 BE string.
                 *
                 * @return {WordArray} The word array.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var wordArray = CryptoJS.enc.Utf16.parse(utf16String);
                 */
                parse: function (utf16Str) {
                    // Shortcut
                    var utf16StrLength = utf16Str.length;
    
                    // Convert
                    var words = [];
                    for (var i = 0; i < utf16StrLength; i++) {
                        words[i >>> 1] |= utf16Str.charCodeAt(i) << (16 - (i % 2) * 16);
                    }
    
                    return WordArray.create(words, utf16StrLength * 2);
                }
            };
    
            /**
             * UTF-16 LE encoding strategy.
             */
            C_enc.Utf16LE = {
                /**
                 * Converts a word array to a UTF-16 LE string.
                 *
                 * @param {WordArray} wordArray The word array.
                 *
                 * @return {string} The UTF-16 LE string.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var utf16Str = CryptoJS.enc.Utf16LE.stringify(wordArray);
                 */
                stringify: function (wordArray) {
                    // Shortcuts
                    var words = wordArray.words;
                    var sigBytes = wordArray.sigBytes;
    
                    // Convert
                    var utf16Chars = [];
                    for (var i = 0; i < sigBytes; i += 2) {
                        var codePoint = swapEndian((words[i >>> 2] >>> (16 - (i % 4) * 8)) & 0xffff);
                        utf16Chars.push(String.fromCharCode(codePoint));
                    }
    
                    return utf16Chars.join('');
                },
    
                /**
                 * Converts a UTF-16 LE string to a word array.
                 *
                 * @param {string} utf16Str The UTF-16 LE string.
                 *
                 * @return {WordArray} The word array.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var wordArray = CryptoJS.enc.Utf16LE.parse(utf16Str);
                 */
                parse: function (utf16Str) {
                    // Shortcut
                    var utf16StrLength = utf16Str.length;
    
                    // Convert
                    var words = [];
                    for (var i = 0; i < utf16StrLength; i++) {
                        words[i >>> 1] |= swapEndian(utf16Str.charCodeAt(i) << (16 - (i % 2) * 16));
                    }
    
                    return WordArray.create(words, utf16StrLength * 2);
                }
            };
    
            function swapEndian(word) {
                return ((word << 8) & 0xff00ff00) | ((word >>> 8) & 0x00ff00ff);
            }
        }());
    
    
        return CryptoJS.enc.Utf16;
    
    }));
    },{"./core":5}],8:[function(require,module,exports){
    ;(function (root, factory, undef) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"), require("./sha1"), require("./hmac"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core", "./sha1", "./hmac"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        (function () {
            // Shortcuts
            var C = CryptoJS;
            var C_lib = C.lib;
            var Base = C_lib.Base;
            var WordArray = C_lib.WordArray;
            var C_algo = C.algo;
            var MD5 = C_algo.MD5;
    
            /**
             * This key derivation function is meant to conform with EVP_BytesToKey.
             * www.openssl.org/docs/crypto/EVP_BytesToKey.html
             */
            var EvpKDF = C_algo.EvpKDF = Base.extend({
                /**
                 * Configuration options.
                 *
                 * @property {number} keySize The key size in words to generate. Default: 4 (128 bits)
                 * @property {Hasher} hasher The hash algorithm to use. Default: MD5
                 * @property {number} iterations The number of iterations to perform. Default: 1
                 */
                cfg: Base.extend({
                    keySize: 128/32,
                    hasher: MD5,
                    iterations: 1
                }),
    
                /**
                 * Initializes a newly created key derivation function.
                 *
                 * @param {Object} cfg (Optional) The configuration options to use for the derivation.
                 *
                 * @example
                 *
                 *     var kdf = CryptoJS.algo.EvpKDF.create();
                 *     var kdf = CryptoJS.algo.EvpKDF.create({ keySize: 8 });
                 *     var kdf = CryptoJS.algo.EvpKDF.create({ keySize: 8, iterations: 1000 });
                 */
                init: function (cfg) {
                    this.cfg = this.cfg.extend(cfg);
                },
    
                /**
                 * Derives a key from a password.
                 *
                 * @param {WordArray|string} password The password.
                 * @param {WordArray|string} salt A salt.
                 *
                 * @return {WordArray} The derived key.
                 *
                 * @example
                 *
                 *     var key = kdf.compute(password, salt);
                 */
                compute: function (password, salt) {
                    // Shortcut
                    var cfg = this.cfg;
    
                    // Init hasher
                    var hasher = cfg.hasher.create();
    
                    // Initial values
                    var derivedKey = WordArray.create();
    
                    // Shortcuts
                    var derivedKeyWords = derivedKey.words;
                    var keySize = cfg.keySize;
                    var iterations = cfg.iterations;
    
                    // Generate key
                    while (derivedKeyWords.length < keySize) {
                        if (block) {
                            hasher.update(block);
                        }
                        var block = hasher.update(password).finalize(salt);
                        hasher.reset();
    
                        // Iterations
                        for (var i = 1; i < iterations; i++) {
                            block = hasher.finalize(block);
                            hasher.reset();
                        }
    
                        derivedKey.concat(block);
                    }
                    derivedKey.sigBytes = keySize * 4;
    
                    return derivedKey;
                }
            });
    
            /**
             * Derives a key from a password.
             *
             * @param {WordArray|string} password The password.
             * @param {WordArray|string} salt A salt.
             * @param {Object} cfg (Optional) The configuration options to use for this computation.
             *
             * @return {WordArray} The derived key.
             *
             * @static
             *
             * @example
             *
             *     var key = CryptoJS.EvpKDF(password, salt);
             *     var key = CryptoJS.EvpKDF(password, salt, { keySize: 8 });
             *     var key = CryptoJS.EvpKDF(password, salt, { keySize: 8, iterations: 1000 });
             */
            C.EvpKDF = function (password, salt, cfg) {
                return EvpKDF.create(cfg).compute(password, salt);
            };
        }());
    
    
        return CryptoJS.EvpKDF;
    
    }));
    },{"./core":5,"./hmac":10,"./sha1":29}],9:[function(require,module,exports){
    ;(function (root, factory, undef) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"), require("./cipher-core"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core", "./cipher-core"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        (function (undefined) {
            // Shortcuts
            var C = CryptoJS;
            var C_lib = C.lib;
            var CipherParams = C_lib.CipherParams;
            var C_enc = C.enc;
            var Hex = C_enc.Hex;
            var C_format = C.format;
    
            var HexFormatter = C_format.Hex = {
                /**
                 * Converts the ciphertext of a cipher params object to a hexadecimally encoded string.
                 *
                 * @param {CipherParams} cipherParams The cipher params object.
                 *
                 * @return {string} The hexadecimally encoded string.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var hexString = CryptoJS.format.Hex.stringify(cipherParams);
                 */
                stringify: function (cipherParams) {
                    return cipherParams.ciphertext.toString(Hex);
                },
    
                /**
                 * Converts a hexadecimally encoded ciphertext string to a cipher params object.
                 *
                 * @param {string} input The hexadecimally encoded string.
                 *
                 * @return {CipherParams} The cipher params object.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var cipherParams = CryptoJS.format.Hex.parse(hexString);
                 */
                parse: function (input) {
                    var ciphertext = Hex.parse(input);
                    return CipherParams.create({ ciphertext: ciphertext });
                }
            };
        }());
    
    
        return CryptoJS.format.Hex;
    
    }));
    },{"./cipher-core":4,"./core":5}],10:[function(require,module,exports){
    ;(function (root, factory) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        (function () {
            // Shortcuts
            var C = CryptoJS;
            var C_lib = C.lib;
            var Base = C_lib.Base;
            var C_enc = C.enc;
            var Utf8 = C_enc.Utf8;
            var C_algo = C.algo;
    
            /**
             * HMAC algorithm.
             */
            var HMAC = C_algo.HMAC = Base.extend({
                /**
                 * Initializes a newly created HMAC.
                 *
                 * @param {Hasher} hasher The hash algorithm to use.
                 * @param {WordArray|string} key The secret key.
                 *
                 * @example
                 *
                 *     var hmacHasher = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, key);
                 */
                init: function (hasher, key) {
                    // Init hasher
                    hasher = this._hasher = new hasher.init();
    
                    // Convert string to WordArray, else assume WordArray already
                    if (typeof key == 'string') {
                        key = Utf8.parse(key);
                    }
    
                    // Shortcuts
                    var hasherBlockSize = hasher.blockSize;
                    var hasherBlockSizeBytes = hasherBlockSize * 4;
    
                    // Allow arbitrary length keys
                    if (key.sigBytes > hasherBlockSizeBytes) {
                        key = hasher.finalize(key);
                    }
    
                    // Clamp excess bits
                    key.clamp();
    
                    // Clone key for inner and outer pads
                    var oKey = this._oKey = key.clone();
                    var iKey = this._iKey = key.clone();
    
                    // Shortcuts
                    var oKeyWords = oKey.words;
                    var iKeyWords = iKey.words;
    
                    // XOR keys with pad constants
                    for (var i = 0; i < hasherBlockSize; i++) {
                        oKeyWords[i] ^= 0x5c5c5c5c;
                        iKeyWords[i] ^= 0x36363636;
                    }
                    oKey.sigBytes = iKey.sigBytes = hasherBlockSizeBytes;
    
                    // Set initial values
                    this.reset();
                },
    
                /**
                 * Resets this HMAC to its initial state.
                 *
                 * @example
                 *
                 *     hmacHasher.reset();
                 */
                reset: function () {
                    // Shortcut
                    var hasher = this._hasher;
    
                    // Reset
                    hasher.reset();
                    hasher.update(this._iKey);
                },
    
                /**
                 * Updates this HMAC with a message.
                 *
                 * @param {WordArray|string} messageUpdate The message to append.
                 *
                 * @return {HMAC} This HMAC instance.
                 *
                 * @example
                 *
                 *     hmacHasher.update('message');
                 *     hmacHasher.update(wordArray);
                 */
                update: function (messageUpdate) {
                    this._hasher.update(messageUpdate);
    
                    // Chainable
                    return this;
                },
    
                /**
                 * Finalizes the HMAC computation.
                 * Note that the finalize operation is effectively a destructive, read-once operation.
                 *
                 * @param {WordArray|string} messageUpdate (Optional) A final message update.
                 *
                 * @return {WordArray} The HMAC.
                 *
                 * @example
                 *
                 *     var hmac = hmacHasher.finalize();
                 *     var hmac = hmacHasher.finalize('message');
                 *     var hmac = hmacHasher.finalize(wordArray);
                 */
                finalize: function (messageUpdate) {
                    // Shortcut
                    var hasher = this._hasher;
    
                    // Compute HMAC
                    var innerHash = hasher.finalize(messageUpdate);
                    hasher.reset();
                    var hmac = hasher.finalize(this._oKey.clone().concat(innerHash));
    
                    return hmac;
                }
            });
        }());
    
    
    }));
    },{"./core":5}],11:[function(require,module,exports){
    ;(function (root, factory, undef) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"), require("./x64-core"), require("./lib-typedarrays"), require("./enc-utf16"), require("./enc-base64"), require("./md5"), require("./sha1"), require("./sha256"), require("./sha224"), require("./sha512"), require("./sha384"), require("./sha3"), require("./ripemd160"), require("./hmac"), require("./pbkdf2"), require("./evpkdf"), require("./cipher-core"), require("./mode-cfb"), require("./mode-ctr"), require("./mode-ctr-gladman"), require("./mode-ofb"), require("./mode-ecb"), require("./pad-ansix923"), require("./pad-iso10126"), require("./pad-iso97971"), require("./pad-zeropadding"), require("./pad-nopadding"), require("./format-hex"), require("./aes"), require("./tripledes"), require("./rc4"), require("./rabbit"), require("./rabbit-legacy"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core", "./x64-core", "./lib-typedarrays", "./enc-utf16", "./enc-base64", "./md5", "./sha1", "./sha256", "./sha224", "./sha512", "./sha384", "./sha3", "./ripemd160", "./hmac", "./pbkdf2", "./evpkdf", "./cipher-core", "./mode-cfb", "./mode-ctr", "./mode-ctr-gladman", "./mode-ofb", "./mode-ecb", "./pad-ansix923", "./pad-iso10126", "./pad-iso97971", "./pad-zeropadding", "./pad-nopadding", "./format-hex", "./aes", "./tripledes", "./rc4", "./rabbit", "./rabbit-legacy"], factory);
        }
        else {
            // Global (browser)
            root.CryptoJS = factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        return CryptoJS;
    
    }));
    },{"./aes":3,"./cipher-core":4,"./core":5,"./enc-base64":6,"./enc-utf16":7,"./evpkdf":8,"./format-hex":9,"./hmac":10,"./lib-typedarrays":12,"./md5":13,"./mode-cfb":14,"./mode-ctr":16,"./mode-ctr-gladman":15,"./mode-ecb":17,"./mode-ofb":18,"./pad-ansix923":19,"./pad-iso10126":20,"./pad-iso97971":21,"./pad-nopadding":22,"./pad-zeropadding":23,"./pbkdf2":24,"./rabbit":26,"./rabbit-legacy":25,"./rc4":27,"./ripemd160":28,"./sha1":29,"./sha224":30,"./sha256":31,"./sha3":32,"./sha384":33,"./sha512":34,"./tripledes":35,"./x64-core":36}],12:[function(require,module,exports){
    ;(function (root, factory) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        (function () {
            // Check if typed arrays are supported
            if (typeof ArrayBuffer != 'function') {
                return;
            }
    
            // Shortcuts
            var C = CryptoJS;
            var C_lib = C.lib;
            var WordArray = C_lib.WordArray;
    
            // Reference original init
            var superInit = WordArray.init;
    
            // Augment WordArray.init to handle typed arrays
            var subInit = WordArray.init = function (typedArray) {
                // Convert buffers to uint8
                if (typedArray instanceof ArrayBuffer) {
                    typedArray = new Uint8Array(typedArray);
                }
    
                // Convert other array views to uint8
                if (
                    typedArray instanceof Int8Array ||
                    (typeof Uint8ClampedArray !== "undefined" && typedArray instanceof Uint8ClampedArray) ||
                    typedArray instanceof Int16Array ||
                    typedArray instanceof Uint16Array ||
                    typedArray instanceof Int32Array ||
                    typedArray instanceof Uint32Array ||
                    typedArray instanceof Float32Array ||
                    typedArray instanceof Float64Array
                ) {
                    typedArray = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
                }
    
                // Handle Uint8Array
                if (typedArray instanceof Uint8Array) {
                    // Shortcut
                    var typedArrayByteLength = typedArray.byteLength;
    
                    // Extract bytes
                    var words = [];
                    for (var i = 0; i < typedArrayByteLength; i++) {
                        words[i >>> 2] |= typedArray[i] << (24 - (i % 4) * 8);
                    }
    
                    // Initialize this word array
                    superInit.call(this, words, typedArrayByteLength);
                } else {
                    // Else call normal init
                    superInit.apply(this, arguments);
                }
            };
    
            subInit.prototype = WordArray;
        }());
    
    
        return CryptoJS.lib.WordArray;
    
    }));
    },{"./core":5}],13:[function(require,module,exports){
    ;(function (root, factory) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        (function (Math) {
            // Shortcuts
            var C = CryptoJS;
            var C_lib = C.lib;
            var WordArray = C_lib.WordArray;
            var Hasher = C_lib.Hasher;
            var C_algo = C.algo;
    
            // Constants table
            var T = [];
    
            // Compute constants
            (function () {
                for (var i = 0; i < 64; i++) {
                    T[i] = (Math.abs(Math.sin(i + 1)) * 0x100000000) | 0;
                }
            }());
    
            /**
             * MD5 hash algorithm.
             */
            var MD5 = C_algo.MD5 = Hasher.extend({
                _doReset: function () {
                    this._hash = new WordArray.init([
                        0x67452301, 0xefcdab89,
                        0x98badcfe, 0x10325476
                    ]);
                },
    
                _doProcessBlock: function (M, offset) {
                    // Swap endian
                    for (var i = 0; i < 16; i++) {
                        // Shortcuts
                        var offset_i = offset + i;
                        var M_offset_i = M[offset_i];
    
                        M[offset_i] = (
                            (((M_offset_i << 8)  | (M_offset_i >>> 24)) & 0x00ff00ff) |
                            (((M_offset_i << 24) | (M_offset_i >>> 8))  & 0xff00ff00)
                        );
                    }
    
                    // Shortcuts
                    var H = this._hash.words;
    
                    var M_offset_0  = M[offset + 0];
                    var M_offset_1  = M[offset + 1];
                    var M_offset_2  = M[offset + 2];
                    var M_offset_3  = M[offset + 3];
                    var M_offset_4  = M[offset + 4];
                    var M_offset_5  = M[offset + 5];
                    var M_offset_6  = M[offset + 6];
                    var M_offset_7  = M[offset + 7];
                    var M_offset_8  = M[offset + 8];
                    var M_offset_9  = M[offset + 9];
                    var M_offset_10 = M[offset + 10];
                    var M_offset_11 = M[offset + 11];
                    var M_offset_12 = M[offset + 12];
                    var M_offset_13 = M[offset + 13];
                    var M_offset_14 = M[offset + 14];
                    var M_offset_15 = M[offset + 15];
    
                    // Working varialbes
                    var a = H[0];
                    var b = H[1];
                    var c = H[2];
                    var d = H[3];
    
                    // Computation
                    a = FF(a, b, c, d, M_offset_0,  7,  T[0]);
                    d = FF(d, a, b, c, M_offset_1,  12, T[1]);
                    c = FF(c, d, a, b, M_offset_2,  17, T[2]);
                    b = FF(b, c, d, a, M_offset_3,  22, T[3]);
                    a = FF(a, b, c, d, M_offset_4,  7,  T[4]);
                    d = FF(d, a, b, c, M_offset_5,  12, T[5]);
                    c = FF(c, d, a, b, M_offset_6,  17, T[6]);
                    b = FF(b, c, d, a, M_offset_7,  22, T[7]);
                    a = FF(a, b, c, d, M_offset_8,  7,  T[8]);
                    d = FF(d, a, b, c, M_offset_9,  12, T[9]);
                    c = FF(c, d, a, b, M_offset_10, 17, T[10]);
                    b = FF(b, c, d, a, M_offset_11, 22, T[11]);
                    a = FF(a, b, c, d, M_offset_12, 7,  T[12]);
                    d = FF(d, a, b, c, M_offset_13, 12, T[13]);
                    c = FF(c, d, a, b, M_offset_14, 17, T[14]);
                    b = FF(b, c, d, a, M_offset_15, 22, T[15]);
    
                    a = GG(a, b, c, d, M_offset_1,  5,  T[16]);
                    d = GG(d, a, b, c, M_offset_6,  9,  T[17]);
                    c = GG(c, d, a, b, M_offset_11, 14, T[18]);
                    b = GG(b, c, d, a, M_offset_0,  20, T[19]);
                    a = GG(a, b, c, d, M_offset_5,  5,  T[20]);
                    d = GG(d, a, b, c, M_offset_10, 9,  T[21]);
                    c = GG(c, d, a, b, M_offset_15, 14, T[22]);
                    b = GG(b, c, d, a, M_offset_4,  20, T[23]);
                    a = GG(a, b, c, d, M_offset_9,  5,  T[24]);
                    d = GG(d, a, b, c, M_offset_14, 9,  T[25]);
                    c = GG(c, d, a, b, M_offset_3,  14, T[26]);
                    b = GG(b, c, d, a, M_offset_8,  20, T[27]);
                    a = GG(a, b, c, d, M_offset_13, 5,  T[28]);
                    d = GG(d, a, b, c, M_offset_2,  9,  T[29]);
                    c = GG(c, d, a, b, M_offset_7,  14, T[30]);
                    b = GG(b, c, d, a, M_offset_12, 20, T[31]);
    
                    a = HH(a, b, c, d, M_offset_5,  4,  T[32]);
                    d = HH(d, a, b, c, M_offset_8,  11, T[33]);
                    c = HH(c, d, a, b, M_offset_11, 16, T[34]);
                    b = HH(b, c, d, a, M_offset_14, 23, T[35]);
                    a = HH(a, b, c, d, M_offset_1,  4,  T[36]);
                    d = HH(d, a, b, c, M_offset_4,  11, T[37]);
                    c = HH(c, d, a, b, M_offset_7,  16, T[38]);
                    b = HH(b, c, d, a, M_offset_10, 23, T[39]);
                    a = HH(a, b, c, d, M_offset_13, 4,  T[40]);
                    d = HH(d, a, b, c, M_offset_0,  11, T[41]);
                    c = HH(c, d, a, b, M_offset_3,  16, T[42]);
                    b = HH(b, c, d, a, M_offset_6,  23, T[43]);
                    a = HH(a, b, c, d, M_offset_9,  4,  T[44]);
                    d = HH(d, a, b, c, M_offset_12, 11, T[45]);
                    c = HH(c, d, a, b, M_offset_15, 16, T[46]);
                    b = HH(b, c, d, a, M_offset_2,  23, T[47]);
    
                    a = II(a, b, c, d, M_offset_0,  6,  T[48]);
                    d = II(d, a, b, c, M_offset_7,  10, T[49]);
                    c = II(c, d, a, b, M_offset_14, 15, T[50]);
                    b = II(b, c, d, a, M_offset_5,  21, T[51]);
                    a = II(a, b, c, d, M_offset_12, 6,  T[52]);
                    d = II(d, a, b, c, M_offset_3,  10, T[53]);
                    c = II(c, d, a, b, M_offset_10, 15, T[54]);
                    b = II(b, c, d, a, M_offset_1,  21, T[55]);
                    a = II(a, b, c, d, M_offset_8,  6,  T[56]);
                    d = II(d, a, b, c, M_offset_15, 10, T[57]);
                    c = II(c, d, a, b, M_offset_6,  15, T[58]);
                    b = II(b, c, d, a, M_offset_13, 21, T[59]);
                    a = II(a, b, c, d, M_offset_4,  6,  T[60]);
                    d = II(d, a, b, c, M_offset_11, 10, T[61]);
                    c = II(c, d, a, b, M_offset_2,  15, T[62]);
                    b = II(b, c, d, a, M_offset_9,  21, T[63]);
    
                    // Intermediate hash value
                    H[0] = (H[0] + a) | 0;
                    H[1] = (H[1] + b) | 0;
                    H[2] = (H[2] + c) | 0;
                    H[3] = (H[3] + d) | 0;
                },
    
                _doFinalize: function () {
                    // Shortcuts
                    var data = this._data;
                    var dataWords = data.words;
    
                    var nBitsTotal = this._nDataBytes * 8;
                    var nBitsLeft = data.sigBytes * 8;
    
                    // Add padding
                    dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
    
                    var nBitsTotalH = Math.floor(nBitsTotal / 0x100000000);
                    var nBitsTotalL = nBitsTotal;
                    dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = (
                        (((nBitsTotalH << 8)  | (nBitsTotalH >>> 24)) & 0x00ff00ff) |
                        (((nBitsTotalH << 24) | (nBitsTotalH >>> 8))  & 0xff00ff00)
                    );
                    dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = (
                        (((nBitsTotalL << 8)  | (nBitsTotalL >>> 24)) & 0x00ff00ff) |
                        (((nBitsTotalL << 24) | (nBitsTotalL >>> 8))  & 0xff00ff00)
                    );
    
                    data.sigBytes = (dataWords.length + 1) * 4;
    
                    // Hash final blocks
                    this._process();
    
                    // Shortcuts
                    var hash = this._hash;
                    var H = hash.words;
    
                    // Swap endian
                    for (var i = 0; i < 4; i++) {
                        // Shortcut
                        var H_i = H[i];
    
                        H[i] = (((H_i << 8)  | (H_i >>> 24)) & 0x00ff00ff) |
                               (((H_i << 24) | (H_i >>> 8))  & 0xff00ff00);
                    }
    
                    // Return final computed hash
                    return hash;
                },
    
                clone: function () {
                    var clone = Hasher.clone.call(this);
                    clone._hash = this._hash.clone();
    
                    return clone;
                }
            });
    
            function FF(a, b, c, d, x, s, t) {
                var n = a + ((b & c) | (~b & d)) + x + t;
                return ((n << s) | (n >>> (32 - s))) + b;
            }
    
            function GG(a, b, c, d, x, s, t) {
                var n = a + ((b & d) | (c & ~d)) + x + t;
                return ((n << s) | (n >>> (32 - s))) + b;
            }
    
            function HH(a, b, c, d, x, s, t) {
                var n = a + (b ^ c ^ d) + x + t;
                return ((n << s) | (n >>> (32 - s))) + b;
            }
    
            function II(a, b, c, d, x, s, t) {
                var n = a + (c ^ (b | ~d)) + x + t;
                return ((n << s) | (n >>> (32 - s))) + b;
            }
    
            /**
             * Shortcut function to the hasher's object interface.
             *
             * @param {WordArray|string} message The message to hash.
             *
             * @return {WordArray} The hash.
             *
             * @static
             *
             * @example
             *
             *     var hash = CryptoJS.MD5('message');
             *     var hash = CryptoJS.MD5(wordArray);
             */
            C.MD5 = Hasher._createHelper(MD5);
    
            /**
             * Shortcut function to the HMAC's object interface.
             *
             * @param {WordArray|string} message The message to hash.
             * @param {WordArray|string} key The secret key.
             *
             * @return {WordArray} The HMAC.
             *
             * @static
             *
             * @example
             *
             *     var hmac = CryptoJS.HmacMD5(message, key);
             */
            C.HmacMD5 = Hasher._createHmacHelper(MD5);
        }(Math));
    
    
        return CryptoJS.MD5;
    
    }));
    },{"./core":5}],14:[function(require,module,exports){
    ;(function (root, factory, undef) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"), require("./cipher-core"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core", "./cipher-core"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        /**
         * Cipher Feedback block mode.
         */
        CryptoJS.mode.CFB = (function () {
            var CFB = CryptoJS.lib.BlockCipherMode.extend();
    
            CFB.Encryptor = CFB.extend({
                processBlock: function (words, offset) {
                    // Shortcuts
                    var cipher = this._cipher;
                    var blockSize = cipher.blockSize;
    
                    generateKeystreamAndEncrypt.call(this, words, offset, blockSize, cipher);
    
                    // Remember this block to use with next block
                    this._prevBlock = words.slice(offset, offset + blockSize);
                }
            });
    
            CFB.Decryptor = CFB.extend({
                processBlock: function (words, offset) {
                    // Shortcuts
                    var cipher = this._cipher;
                    var blockSize = cipher.blockSize;
    
                    // Remember this block to use with next block
                    var thisBlock = words.slice(offset, offset + blockSize);
    
                    generateKeystreamAndEncrypt.call(this, words, offset, blockSize, cipher);
    
                    // This block becomes the previous block
                    this._prevBlock = thisBlock;
                }
            });
    
            function generateKeystreamAndEncrypt(words, offset, blockSize, cipher) {
                // Shortcut
                var iv = this._iv;
    
                // Generate keystream
                if (iv) {
                    var keystream = iv.slice(0);
    
                    // Remove IV for subsequent blocks
                    this._iv = undefined;
                } else {
                    var keystream = this._prevBlock;
                }
                cipher.encryptBlock(keystream, 0);
    
                // Encrypt
                for (var i = 0; i < blockSize; i++) {
                    words[offset + i] ^= keystream[i];
                }
            }
    
            return CFB;
        }());
    
    
        return CryptoJS.mode.CFB;
    
    }));
    },{"./cipher-core":4,"./core":5}],15:[function(require,module,exports){
    ;(function (root, factory, undef) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"), require("./cipher-core"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core", "./cipher-core"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        /** @preserve
         * Counter block mode compatible with  Dr Brian Gladman fileenc.c
         * derived from CryptoJS.mode.CTR
         * Jan Hruby jhruby.web@gmail.com
         */
        CryptoJS.mode.CTRGladman = (function () {
            var CTRGladman = CryptoJS.lib.BlockCipherMode.extend();
    
            function incWord(word)
            {
                if (((word >> 24) & 0xff) === 0xff) { //overflow
                var b1 = (word >> 16)&0xff;
                var b2 = (word >> 8)&0xff;
                var b3 = word & 0xff;
    
                if (b1 === 0xff) // overflow b1
                {
                b1 = 0;
                if (b2 === 0xff)
                {
                    b2 = 0;
                    if (b3 === 0xff)
                    {
                        b3 = 0;
                    }
                    else
                    {
                        ++b3;
                    }
                }
                else
                {
                    ++b2;
                }
                }
                else
                {
                ++b1;
                }
    
                word = 0;
                word += (b1 << 16);
                word += (b2 << 8);
                word += b3;
                }
                else
                {
                word += (0x01 << 24);
                }
                return word;
            }
    
            function incCounter(counter)
            {
                if ((counter[0] = incWord(counter[0])) === 0)
                {
                    // encr_data in fileenc.c from  Dr Brian Gladman's counts only with DWORD j < 8
                    counter[1] = incWord(counter[1]);
                }
                return counter;
            }
    
            var Encryptor = CTRGladman.Encryptor = CTRGladman.extend({
                processBlock: function (words, offset) {
                    // Shortcuts
                    var cipher = this._cipher
                    var blockSize = cipher.blockSize;
                    var iv = this._iv;
                    var counter = this._counter;
    
                    // Generate keystream
                    if (iv) {
                        counter = this._counter = iv.slice(0);
    
                        // Remove IV for subsequent blocks
                        this._iv = undefined;
                    }
    
                    incCounter(counter);
    
                    var keystream = counter.slice(0);
                    cipher.encryptBlock(keystream, 0);
    
                    // Encrypt
                    for (var i = 0; i < blockSize; i++) {
                        words[offset + i] ^= keystream[i];
                    }
                }
            });
    
            CTRGladman.Decryptor = Encryptor;
    
            return CTRGladman;
        }());
    
    
    
    
        return CryptoJS.mode.CTRGladman;
    
    }));
    },{"./cipher-core":4,"./core":5}],16:[function(require,module,exports){
    ;(function (root, factory, undef) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"), require("./cipher-core"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core", "./cipher-core"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        /**
         * Counter block mode.
         */
        CryptoJS.mode.CTR = (function () {
            var CTR = CryptoJS.lib.BlockCipherMode.extend();
    
            var Encryptor = CTR.Encryptor = CTR.extend({
                processBlock: function (words, offset) {
                    // Shortcuts
                    var cipher = this._cipher
                    var blockSize = cipher.blockSize;
                    var iv = this._iv;
                    var counter = this._counter;
    
                    // Generate keystream
                    if (iv) {
                        counter = this._counter = iv.slice(0);
    
                        // Remove IV for subsequent blocks
                        this._iv = undefined;
                    }
                    var keystream = counter.slice(0);
                    cipher.encryptBlock(keystream, 0);
    
                    // Increment counter
                    counter[blockSize - 1] = (counter[blockSize - 1] + 1) | 0
    
                    // Encrypt
                    for (var i = 0; i < blockSize; i++) {
                        words[offset + i] ^= keystream[i];
                    }
                }
            });
    
            CTR.Decryptor = Encryptor;
    
            return CTR;
        }());
    
    
        return CryptoJS.mode.CTR;
    
    }));
    },{"./cipher-core":4,"./core":5}],17:[function(require,module,exports){
    ;(function (root, factory, undef) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"), require("./cipher-core"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core", "./cipher-core"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        /**
         * Electronic Codebook block mode.
         */
        CryptoJS.mode.ECB = (function () {
            var ECB = CryptoJS.lib.BlockCipherMode.extend();
    
            ECB.Encryptor = ECB.extend({
                processBlock: function (words, offset) {
                    this._cipher.encryptBlock(words, offset);
                }
            });
    
            ECB.Decryptor = ECB.extend({
                processBlock: function (words, offset) {
                    this._cipher.decryptBlock(words, offset);
                }
            });
    
            return ECB;
        }());
    
    
        return CryptoJS.mode.ECB;
    
    }));
    },{"./cipher-core":4,"./core":5}],18:[function(require,module,exports){
    ;(function (root, factory, undef) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"), require("./cipher-core"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core", "./cipher-core"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        /**
         * Output Feedback block mode.
         */
        CryptoJS.mode.OFB = (function () {
            var OFB = CryptoJS.lib.BlockCipherMode.extend();
    
            var Encryptor = OFB.Encryptor = OFB.extend({
                processBlock: function (words, offset) {
                    // Shortcuts
                    var cipher = this._cipher
                    var blockSize = cipher.blockSize;
                    var iv = this._iv;
                    var keystream = this._keystream;
    
                    // Generate keystream
                    if (iv) {
                        keystream = this._keystream = iv.slice(0);
    
                        // Remove IV for subsequent blocks
                        this._iv = undefined;
                    }
                    cipher.encryptBlock(keystream, 0);
    
                    // Encrypt
                    for (var i = 0; i < blockSize; i++) {
                        words[offset + i] ^= keystream[i];
                    }
                }
            });
    
            OFB.Decryptor = Encryptor;
    
            return OFB;
        }());
    
    
        return CryptoJS.mode.OFB;
    
    }));
    },{"./cipher-core":4,"./core":5}],19:[function(require,module,exports){
    ;(function (root, factory, undef) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"), require("./cipher-core"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core", "./cipher-core"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        /**
         * ANSI X.923 padding strategy.
         */
        CryptoJS.pad.AnsiX923 = {
            pad: function (data, blockSize) {
                // Shortcuts
                var dataSigBytes = data.sigBytes;
                var blockSizeBytes = blockSize * 4;
    
                // Count padding bytes
                var nPaddingBytes = blockSizeBytes - dataSigBytes % blockSizeBytes;
    
                // Compute last byte position
                var lastBytePos = dataSigBytes + nPaddingBytes - 1;
    
                // Pad
                data.clamp();
                data.words[lastBytePos >>> 2] |= nPaddingBytes << (24 - (lastBytePos % 4) * 8);
                data.sigBytes += nPaddingBytes;
            },
    
            unpad: function (data) {
                // Get number of padding bytes from last byte
                var nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;
    
                // Remove padding
                data.sigBytes -= nPaddingBytes;
            }
        };
    
    
        return CryptoJS.pad.Ansix923;
    
    }));
    },{"./cipher-core":4,"./core":5}],20:[function(require,module,exports){
    ;(function (root, factory, undef) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"), require("./cipher-core"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core", "./cipher-core"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        /**
         * ISO 10126 padding strategy.
         */
        CryptoJS.pad.Iso10126 = {
            pad: function (data, blockSize) {
                // Shortcut
                var blockSizeBytes = blockSize * 4;
    
                // Count padding bytes
                var nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;
    
                // Pad
                data.concat(CryptoJS.lib.WordArray.random(nPaddingBytes - 1)).
                     concat(CryptoJS.lib.WordArray.create([nPaddingBytes << 24], 1));
            },
    
            unpad: function (data) {
                // Get number of padding bytes from last byte
                var nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;
    
                // Remove padding
                data.sigBytes -= nPaddingBytes;
            }
        };
    
    
        return CryptoJS.pad.Iso10126;
    
    }));
    },{"./cipher-core":4,"./core":5}],21:[function(require,module,exports){
    ;(function (root, factory, undef) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"), require("./cipher-core"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core", "./cipher-core"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        /**
         * ISO/IEC 9797-1 Padding Method 2.
         */
        CryptoJS.pad.Iso97971 = {
            pad: function (data, blockSize) {
                // Add 0x80 byte
                data.concat(CryptoJS.lib.WordArray.create([0x80000000], 1));
    
                // Zero pad the rest
                CryptoJS.pad.ZeroPadding.pad(data, blockSize);
            },
    
            unpad: function (data) {
                // Remove zero padding
                CryptoJS.pad.ZeroPadding.unpad(data);
    
                // Remove one more byte -- the 0x80 byte
                data.sigBytes--;
            }
        };
    
    
        return CryptoJS.pad.Iso97971;
    
    }));
    },{"./cipher-core":4,"./core":5}],22:[function(require,module,exports){
    ;(function (root, factory, undef) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"), require("./cipher-core"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core", "./cipher-core"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        /**
         * A noop padding strategy.
         */
        CryptoJS.pad.NoPadding = {
            pad: function () {
            },
    
            unpad: function () {
            }
        };
    
    
        return CryptoJS.pad.NoPadding;
    
    }));
    },{"./cipher-core":4,"./core":5}],23:[function(require,module,exports){
    ;(function (root, factory, undef) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"), require("./cipher-core"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core", "./cipher-core"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        /**
         * Zero padding strategy.
         */
        CryptoJS.pad.ZeroPadding = {
            pad: function (data, blockSize) {
                // Shortcut
                var blockSizeBytes = blockSize * 4;
    
                // Pad
                data.clamp();
                data.sigBytes += blockSizeBytes - ((data.sigBytes % blockSizeBytes) || blockSizeBytes);
            },
    
            unpad: function (data) {
                // Shortcut
                var dataWords = data.words;
    
                // Unpad
                var i = data.sigBytes - 1;
                while (!((dataWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff)) {
                    i--;
                }
                data.sigBytes = i + 1;
            }
        };
    
    
        return CryptoJS.pad.ZeroPadding;
    
    }));
    },{"./cipher-core":4,"./core":5}],24:[function(require,module,exports){
    ;(function (root, factory, undef) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"), require("./sha1"), require("./hmac"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core", "./sha1", "./hmac"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        (function () {
            // Shortcuts
            var C = CryptoJS;
            var C_lib = C.lib;
            var Base = C_lib.Base;
            var WordArray = C_lib.WordArray;
            var C_algo = C.algo;
            var SHA1 = C_algo.SHA1;
            var HMAC = C_algo.HMAC;
    
            /**
             * Password-Based Key Derivation Function 2 algorithm.
             */
            var PBKDF2 = C_algo.PBKDF2 = Base.extend({
                /**
                 * Configuration options.
                 *
                 * @property {number} keySize The key size in words to generate. Default: 4 (128 bits)
                 * @property {Hasher} hasher The hasher to use. Default: SHA1
                 * @property {number} iterations The number of iterations to perform. Default: 1
                 */
                cfg: Base.extend({
                    keySize: 128/32,
                    hasher: SHA1,
                    iterations: 1
                }),
    
                /**
                 * Initializes a newly created key derivation function.
                 *
                 * @param {Object} cfg (Optional) The configuration options to use for the derivation.
                 *
                 * @example
                 *
                 *     var kdf = CryptoJS.algo.PBKDF2.create();
                 *     var kdf = CryptoJS.algo.PBKDF2.create({ keySize: 8 });
                 *     var kdf = CryptoJS.algo.PBKDF2.create({ keySize: 8, iterations: 1000 });
                 */
                init: function (cfg) {
                    this.cfg = this.cfg.extend(cfg);
                },
    
                /**
                 * Computes the Password-Based Key Derivation Function 2.
                 *
                 * @param {WordArray|string} password The password.
                 * @param {WordArray|string} salt A salt.
                 *
                 * @return {WordArray} The derived key.
                 *
                 * @example
                 *
                 *     var key = kdf.compute(password, salt);
                 */
                compute: function (password, salt) {
                    // Shortcut
                    var cfg = this.cfg;
    
                    // Init HMAC
                    var hmac = HMAC.create(cfg.hasher, password);
    
                    // Initial values
                    var derivedKey = WordArray.create();
                    var blockIndex = WordArray.create([0x00000001]);
    
                    // Shortcuts
                    var derivedKeyWords = derivedKey.words;
                    var blockIndexWords = blockIndex.words;
                    var keySize = cfg.keySize;
                    var iterations = cfg.iterations;
    
                    // Generate key
                    while (derivedKeyWords.length < keySize) {
                        var block = hmac.update(salt).finalize(blockIndex);
                        hmac.reset();
    
                        // Shortcuts
                        var blockWords = block.words;
                        var blockWordsLength = blockWords.length;
    
                        // Iterations
                        var intermediate = block;
                        for (var i = 1; i < iterations; i++) {
                            intermediate = hmac.finalize(intermediate);
                            hmac.reset();
    
                            // Shortcut
                            var intermediateWords = intermediate.words;
    
                            // XOR intermediate with block
                            for (var j = 0; j < blockWordsLength; j++) {
                                blockWords[j] ^= intermediateWords[j];
                            }
                        }
    
                        derivedKey.concat(block);
                        blockIndexWords[0]++;
                    }
                    derivedKey.sigBytes = keySize * 4;
    
                    return derivedKey;
                }
            });
    
            /**
             * Computes the Password-Based Key Derivation Function 2.
             *
             * @param {WordArray|string} password The password.
             * @param {WordArray|string} salt A salt.
             * @param {Object} cfg (Optional) The configuration options to use for this computation.
             *
             * @return {WordArray} The derived key.
             *
             * @static
             *
             * @example
             *
             *     var key = CryptoJS.PBKDF2(password, salt);
             *     var key = CryptoJS.PBKDF2(password, salt, { keySize: 8 });
             *     var key = CryptoJS.PBKDF2(password, salt, { keySize: 8, iterations: 1000 });
             */
            C.PBKDF2 = function (password, salt, cfg) {
                return PBKDF2.create(cfg).compute(password, salt);
            };
        }());
    
    
        return CryptoJS.PBKDF2;
    
    }));
    },{"./core":5,"./hmac":10,"./sha1":29}],25:[function(require,module,exports){
    ;(function (root, factory, undef) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"), require("./enc-base64"), require("./md5"), require("./evpkdf"), require("./cipher-core"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core", "./enc-base64", "./md5", "./evpkdf", "./cipher-core"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        (function () {
            // Shortcuts
            var C = CryptoJS;
            var C_lib = C.lib;
            var StreamCipher = C_lib.StreamCipher;
            var C_algo = C.algo;
    
            // Reusable objects
            var S  = [];
            var C_ = [];
            var G  = [];
    
            /**
             * Rabbit stream cipher algorithm.
             *
             * This is a legacy version that neglected to convert the key to little-endian.
             * This error doesn't affect the cipher's security,
             * but it does affect its compatibility with other implementations.
             */
            var RabbitLegacy = C_algo.RabbitLegacy = StreamCipher.extend({
                _doReset: function () {
                    // Shortcuts
                    var K = this._key.words;
                    var iv = this.cfg.iv;
    
                    // Generate initial state values
                    var X = this._X = [
                        K[0], (K[3] << 16) | (K[2] >>> 16),
                        K[1], (K[0] << 16) | (K[3] >>> 16),
                        K[2], (K[1] << 16) | (K[0] >>> 16),
                        K[3], (K[2] << 16) | (K[1] >>> 16)
                    ];
    
                    // Generate initial counter values
                    var C = this._C = [
                        (K[2] << 16) | (K[2] >>> 16), (K[0] & 0xffff0000) | (K[1] & 0x0000ffff),
                        (K[3] << 16) | (K[3] >>> 16), (K[1] & 0xffff0000) | (K[2] & 0x0000ffff),
                        (K[0] << 16) | (K[0] >>> 16), (K[2] & 0xffff0000) | (K[3] & 0x0000ffff),
                        (K[1] << 16) | (K[1] >>> 16), (K[3] & 0xffff0000) | (K[0] & 0x0000ffff)
                    ];
    
                    // Carry bit
                    this._b = 0;
    
                    // Iterate the system four times
                    for (var i = 0; i < 4; i++) {
                        nextState.call(this);
                    }
    
                    // Modify the counters
                    for (var i = 0; i < 8; i++) {
                        C[i] ^= X[(i + 4) & 7];
                    }
    
                    // IV setup
                    if (iv) {
                        // Shortcuts
                        var IV = iv.words;
                        var IV_0 = IV[0];
                        var IV_1 = IV[1];
    
                        // Generate four subvectors
                        var i0 = (((IV_0 << 8) | (IV_0 >>> 24)) & 0x00ff00ff) | (((IV_0 << 24) | (IV_0 >>> 8)) & 0xff00ff00);
                        var i2 = (((IV_1 << 8) | (IV_1 >>> 24)) & 0x00ff00ff) | (((IV_1 << 24) | (IV_1 >>> 8)) & 0xff00ff00);
                        var i1 = (i0 >>> 16) | (i2 & 0xffff0000);
                        var i3 = (i2 << 16)  | (i0 & 0x0000ffff);
    
                        // Modify counter values
                        C[0] ^= i0;
                        C[1] ^= i1;
                        C[2] ^= i2;
                        C[3] ^= i3;
                        C[4] ^= i0;
                        C[5] ^= i1;
                        C[6] ^= i2;
                        C[7] ^= i3;
    
                        // Iterate the system four times
                        for (var i = 0; i < 4; i++) {
                            nextState.call(this);
                        }
                    }
                },
    
                _doProcessBlock: function (M, offset) {
                    // Shortcut
                    var X = this._X;
    
                    // Iterate the system
                    nextState.call(this);
    
                    // Generate four keystream words
                    S[0] = X[0] ^ (X[5] >>> 16) ^ (X[3] << 16);
                    S[1] = X[2] ^ (X[7] >>> 16) ^ (X[5] << 16);
                    S[2] = X[4] ^ (X[1] >>> 16) ^ (X[7] << 16);
                    S[3] = X[6] ^ (X[3] >>> 16) ^ (X[1] << 16);
    
                    for (var i = 0; i < 4; i++) {
                        // Swap endian
                        S[i] = (((S[i] << 8)  | (S[i] >>> 24)) & 0x00ff00ff) |
                               (((S[i] << 24) | (S[i] >>> 8))  & 0xff00ff00);
    
                        // Encrypt
                        M[offset + i] ^= S[i];
                    }
                },
    
                blockSize: 128/32,
    
                ivSize: 64/32
            });
    
            function nextState() {
                // Shortcuts
                var X = this._X;
                var C = this._C;
    
                // Save old counter values
                for (var i = 0; i < 8; i++) {
                    C_[i] = C[i];
                }
    
                // Calculate new counter values
                C[0] = (C[0] + 0x4d34d34d + this._b) | 0;
                C[1] = (C[1] + 0xd34d34d3 + ((C[0] >>> 0) < (C_[0] >>> 0) ? 1 : 0)) | 0;
                C[2] = (C[2] + 0x34d34d34 + ((C[1] >>> 0) < (C_[1] >>> 0) ? 1 : 0)) | 0;
                C[3] = (C[3] + 0x4d34d34d + ((C[2] >>> 0) < (C_[2] >>> 0) ? 1 : 0)) | 0;
                C[4] = (C[4] + 0xd34d34d3 + ((C[3] >>> 0) < (C_[3] >>> 0) ? 1 : 0)) | 0;
                C[5] = (C[5] + 0x34d34d34 + ((C[4] >>> 0) < (C_[4] >>> 0) ? 1 : 0)) | 0;
                C[6] = (C[6] + 0x4d34d34d + ((C[5] >>> 0) < (C_[5] >>> 0) ? 1 : 0)) | 0;
                C[7] = (C[7] + 0xd34d34d3 + ((C[6] >>> 0) < (C_[6] >>> 0) ? 1 : 0)) | 0;
                this._b = (C[7] >>> 0) < (C_[7] >>> 0) ? 1 : 0;
    
                // Calculate the g-values
                for (var i = 0; i < 8; i++) {
                    var gx = X[i] + C[i];
    
                    // Construct high and low argument for squaring
                    var ga = gx & 0xffff;
                    var gb = gx >>> 16;
    
                    // Calculate high and low result of squaring
                    var gh = ((((ga * ga) >>> 17) + ga * gb) >>> 15) + gb * gb;
                    var gl = (((gx & 0xffff0000) * gx) | 0) + (((gx & 0x0000ffff) * gx) | 0);
    
                    // High XOR low
                    G[i] = gh ^ gl;
                }
    
                // Calculate new state values
                X[0] = (G[0] + ((G[7] << 16) | (G[7] >>> 16)) + ((G[6] << 16) | (G[6] >>> 16))) | 0;
                X[1] = (G[1] + ((G[0] << 8)  | (G[0] >>> 24)) + G[7]) | 0;
                X[2] = (G[2] + ((G[1] << 16) | (G[1] >>> 16)) + ((G[0] << 16) | (G[0] >>> 16))) | 0;
                X[3] = (G[3] + ((G[2] << 8)  | (G[2] >>> 24)) + G[1]) | 0;
                X[4] = (G[4] + ((G[3] << 16) | (G[3] >>> 16)) + ((G[2] << 16) | (G[2] >>> 16))) | 0;
                X[5] = (G[5] + ((G[4] << 8)  | (G[4] >>> 24)) + G[3]) | 0;
                X[6] = (G[6] + ((G[5] << 16) | (G[5] >>> 16)) + ((G[4] << 16) | (G[4] >>> 16))) | 0;
                X[7] = (G[7] + ((G[6] << 8)  | (G[6] >>> 24)) + G[5]) | 0;
            }
    
            /**
             * Shortcut functions to the cipher's object interface.
             *
             * @example
             *
             *     var ciphertext = CryptoJS.RabbitLegacy.encrypt(message, key, cfg);
             *     var plaintext  = CryptoJS.RabbitLegacy.decrypt(ciphertext, key, cfg);
             */
            C.RabbitLegacy = StreamCipher._createHelper(RabbitLegacy);
        }());
    
    
        return CryptoJS.RabbitLegacy;
    
    }));
    },{"./cipher-core":4,"./core":5,"./enc-base64":6,"./evpkdf":8,"./md5":13}],26:[function(require,module,exports){
    ;(function (root, factory, undef) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"), require("./enc-base64"), require("./md5"), require("./evpkdf"), require("./cipher-core"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core", "./enc-base64", "./md5", "./evpkdf", "./cipher-core"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        (function () {
            // Shortcuts
            var C = CryptoJS;
            var C_lib = C.lib;
            var StreamCipher = C_lib.StreamCipher;
            var C_algo = C.algo;
    
            // Reusable objects
            var S  = [];
            var C_ = [];
            var G  = [];
    
            /**
             * Rabbit stream cipher algorithm
             */
            var Rabbit = C_algo.Rabbit = StreamCipher.extend({
                _doReset: function () {
                    // Shortcuts
                    var K = this._key.words;
                    var iv = this.cfg.iv;
    
                    // Swap endian
                    for (var i = 0; i < 4; i++) {
                        K[i] = (((K[i] << 8)  | (K[i] >>> 24)) & 0x00ff00ff) |
                               (((K[i] << 24) | (K[i] >>> 8))  & 0xff00ff00);
                    }
    
                    // Generate initial state values
                    var X = this._X = [
                        K[0], (K[3] << 16) | (K[2] >>> 16),
                        K[1], (K[0] << 16) | (K[3] >>> 16),
                        K[2], (K[1] << 16) | (K[0] >>> 16),
                        K[3], (K[2] << 16) | (K[1] >>> 16)
                    ];
    
                    // Generate initial counter values
                    var C = this._C = [
                        (K[2] << 16) | (K[2] >>> 16), (K[0] & 0xffff0000) | (K[1] & 0x0000ffff),
                        (K[3] << 16) | (K[3] >>> 16), (K[1] & 0xffff0000) | (K[2] & 0x0000ffff),
                        (K[0] << 16) | (K[0] >>> 16), (K[2] & 0xffff0000) | (K[3] & 0x0000ffff),
                        (K[1] << 16) | (K[1] >>> 16), (K[3] & 0xffff0000) | (K[0] & 0x0000ffff)
                    ];
    
                    // Carry bit
                    this._b = 0;
    
                    // Iterate the system four times
                    for (var i = 0; i < 4; i++) {
                        nextState.call(this);
                    }
    
                    // Modify the counters
                    for (var i = 0; i < 8; i++) {
                        C[i] ^= X[(i + 4) & 7];
                    }
    
                    // IV setup
                    if (iv) {
                        // Shortcuts
                        var IV = iv.words;
                        var IV_0 = IV[0];
                        var IV_1 = IV[1];
    
                        // Generate four subvectors
                        var i0 = (((IV_0 << 8) | (IV_0 >>> 24)) & 0x00ff00ff) | (((IV_0 << 24) | (IV_0 >>> 8)) & 0xff00ff00);
                        var i2 = (((IV_1 << 8) | (IV_1 >>> 24)) & 0x00ff00ff) | (((IV_1 << 24) | (IV_1 >>> 8)) & 0xff00ff00);
                        var i1 = (i0 >>> 16) | (i2 & 0xffff0000);
                        var i3 = (i2 << 16)  | (i0 & 0x0000ffff);
    
                        // Modify counter values
                        C[0] ^= i0;
                        C[1] ^= i1;
                        C[2] ^= i2;
                        C[3] ^= i3;
                        C[4] ^= i0;
                        C[5] ^= i1;
                        C[6] ^= i2;
                        C[7] ^= i3;
    
                        // Iterate the system four times
                        for (var i = 0; i < 4; i++) {
                            nextState.call(this);
                        }
                    }
                },
    
                _doProcessBlock: function (M, offset) {
                    // Shortcut
                    var X = this._X;
    
                    // Iterate the system
                    nextState.call(this);
    
                    // Generate four keystream words
                    S[0] = X[0] ^ (X[5] >>> 16) ^ (X[3] << 16);
                    S[1] = X[2] ^ (X[7] >>> 16) ^ (X[5] << 16);
                    S[2] = X[4] ^ (X[1] >>> 16) ^ (X[7] << 16);
                    S[3] = X[6] ^ (X[3] >>> 16) ^ (X[1] << 16);
    
                    for (var i = 0; i < 4; i++) {
                        // Swap endian
                        S[i] = (((S[i] << 8)  | (S[i] >>> 24)) & 0x00ff00ff) |
                               (((S[i] << 24) | (S[i] >>> 8))  & 0xff00ff00);
    
                        // Encrypt
                        M[offset + i] ^= S[i];
                    }
                },
    
                blockSize: 128/32,
    
                ivSize: 64/32
            });
    
            function nextState() {
                // Shortcuts
                var X = this._X;
                var C = this._C;
    
                // Save old counter values
                for (var i = 0; i < 8; i++) {
                    C_[i] = C[i];
                }
    
                // Calculate new counter values
                C[0] = (C[0] + 0x4d34d34d + this._b) | 0;
                C[1] = (C[1] + 0xd34d34d3 + ((C[0] >>> 0) < (C_[0] >>> 0) ? 1 : 0)) | 0;
                C[2] = (C[2] + 0x34d34d34 + ((C[1] >>> 0) < (C_[1] >>> 0) ? 1 : 0)) | 0;
                C[3] = (C[3] + 0x4d34d34d + ((C[2] >>> 0) < (C_[2] >>> 0) ? 1 : 0)) | 0;
                C[4] = (C[4] + 0xd34d34d3 + ((C[3] >>> 0) < (C_[3] >>> 0) ? 1 : 0)) | 0;
                C[5] = (C[5] + 0x34d34d34 + ((C[4] >>> 0) < (C_[4] >>> 0) ? 1 : 0)) | 0;
                C[6] = (C[6] + 0x4d34d34d + ((C[5] >>> 0) < (C_[5] >>> 0) ? 1 : 0)) | 0;
                C[7] = (C[7] + 0xd34d34d3 + ((C[6] >>> 0) < (C_[6] >>> 0) ? 1 : 0)) | 0;
                this._b = (C[7] >>> 0) < (C_[7] >>> 0) ? 1 : 0;
    
                // Calculate the g-values
                for (var i = 0; i < 8; i++) {
                    var gx = X[i] + C[i];
    
                    // Construct high and low argument for squaring
                    var ga = gx & 0xffff;
                    var gb = gx >>> 16;
    
                    // Calculate high and low result of squaring
                    var gh = ((((ga * ga) >>> 17) + ga * gb) >>> 15) + gb * gb;
                    var gl = (((gx & 0xffff0000) * gx) | 0) + (((gx & 0x0000ffff) * gx) | 0);
    
                    // High XOR low
                    G[i] = gh ^ gl;
                }
    
                // Calculate new state values
                X[0] = (G[0] + ((G[7] << 16) | (G[7] >>> 16)) + ((G[6] << 16) | (G[6] >>> 16))) | 0;
                X[1] = (G[1] + ((G[0] << 8)  | (G[0] >>> 24)) + G[7]) | 0;
                X[2] = (G[2] + ((G[1] << 16) | (G[1] >>> 16)) + ((G[0] << 16) | (G[0] >>> 16))) | 0;
                X[3] = (G[3] + ((G[2] << 8)  | (G[2] >>> 24)) + G[1]) | 0;
                X[4] = (G[4] + ((G[3] << 16) | (G[3] >>> 16)) + ((G[2] << 16) | (G[2] >>> 16))) | 0;
                X[5] = (G[5] + ((G[4] << 8)  | (G[4] >>> 24)) + G[3]) | 0;
                X[6] = (G[6] + ((G[5] << 16) | (G[5] >>> 16)) + ((G[4] << 16) | (G[4] >>> 16))) | 0;
                X[7] = (G[7] + ((G[6] << 8)  | (G[6] >>> 24)) + G[5]) | 0;
            }
    
            /**
             * Shortcut functions to the cipher's object interface.
             *
             * @example
             *
             *     var ciphertext = CryptoJS.Rabbit.encrypt(message, key, cfg);
             *     var plaintext  = CryptoJS.Rabbit.decrypt(ciphertext, key, cfg);
             */
            C.Rabbit = StreamCipher._createHelper(Rabbit);
        }());
    
    
        return CryptoJS.Rabbit;
    
    }));
    },{"./cipher-core":4,"./core":5,"./enc-base64":6,"./evpkdf":8,"./md5":13}],27:[function(require,module,exports){
    ;(function (root, factory, undef) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"), require("./enc-base64"), require("./md5"), require("./evpkdf"), require("./cipher-core"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core", "./enc-base64", "./md5", "./evpkdf", "./cipher-core"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        (function () {
            // Shortcuts
            var C = CryptoJS;
            var C_lib = C.lib;
            var StreamCipher = C_lib.StreamCipher;
            var C_algo = C.algo;
    
            /**
             * RC4 stream cipher algorithm.
             */
            var RC4 = C_algo.RC4 = StreamCipher.extend({
                _doReset: function () {
                    // Shortcuts
                    var key = this._key;
                    var keyWords = key.words;
                    var keySigBytes = key.sigBytes;
    
                    // Init sbox
                    var S = this._S = [];
                    for (var i = 0; i < 256; i++) {
                        S[i] = i;
                    }
    
                    // Key setup
                    for (var i = 0, j = 0; i < 256; i++) {
                        var keyByteIndex = i % keySigBytes;
                        var keyByte = (keyWords[keyByteIndex >>> 2] >>> (24 - (keyByteIndex % 4) * 8)) & 0xff;
    
                        j = (j + S[i] + keyByte) % 256;
    
                        // Swap
                        var t = S[i];
                        S[i] = S[j];
                        S[j] = t;
                    }
    
                    // Counters
                    this._i = this._j = 0;
                },
    
                _doProcessBlock: function (M, offset) {
                    M[offset] ^= generateKeystreamWord.call(this);
                },
    
                keySize: 256/32,
    
                ivSize: 0
            });
    
            function generateKeystreamWord() {
                // Shortcuts
                var S = this._S;
                var i = this._i;
                var j = this._j;
    
                // Generate keystream word
                var keystreamWord = 0;
                for (var n = 0; n < 4; n++) {
                    i = (i + 1) % 256;
                    j = (j + S[i]) % 256;
    
                    // Swap
                    var t = S[i];
                    S[i] = S[j];
                    S[j] = t;
    
                    keystreamWord |= S[(S[i] + S[j]) % 256] << (24 - n * 8);
                }
    
                // Update counters
                this._i = i;
                this._j = j;
    
                return keystreamWord;
            }
    
            /**
             * Shortcut functions to the cipher's object interface.
             *
             * @example
             *
             *     var ciphertext = CryptoJS.RC4.encrypt(message, key, cfg);
             *     var plaintext  = CryptoJS.RC4.decrypt(ciphertext, key, cfg);
             */
            C.RC4 = StreamCipher._createHelper(RC4);
    
            /**
             * Modified RC4 stream cipher algorithm.
             */
            var RC4Drop = C_algo.RC4Drop = RC4.extend({
                /**
                 * Configuration options.
                 *
                 * @property {number} drop The number of keystream words to drop. Default 192
                 */
                cfg: RC4.cfg.extend({
                    drop: 192
                }),
    
                _doReset: function () {
                    RC4._doReset.call(this);
    
                    // Drop
                    for (var i = this.cfg.drop; i > 0; i--) {
                        generateKeystreamWord.call(this);
                    }
                }
            });
    
            /**
             * Shortcut functions to the cipher's object interface.
             *
             * @example
             *
             *     var ciphertext = CryptoJS.RC4Drop.encrypt(message, key, cfg);
             *     var plaintext  = CryptoJS.RC4Drop.decrypt(ciphertext, key, cfg);
             */
            C.RC4Drop = StreamCipher._createHelper(RC4Drop);
        }());
    
    
        return CryptoJS.RC4;
    
    }));
    },{"./cipher-core":4,"./core":5,"./enc-base64":6,"./evpkdf":8,"./md5":13}],28:[function(require,module,exports){
    ;(function (root, factory) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        /** @preserve
        (c) 2012 by CÃ©dric Mesnil. All rights reserved.
    
        Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
    
            - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
            - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
    
        THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
        */
    
        (function (Math) {
            // Shortcuts
            var C = CryptoJS;
            var C_lib = C.lib;
            var WordArray = C_lib.WordArray;
            var Hasher = C_lib.Hasher;
            var C_algo = C.algo;
    
            // Constants table
            var _zl = WordArray.create([
                0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15,
                7,  4, 13,  1, 10,  6, 15,  3, 12,  0,  9,  5,  2, 14, 11,  8,
                3, 10, 14,  4,  9, 15,  8,  1,  2,  7,  0,  6, 13, 11,  5, 12,
                1,  9, 11, 10,  0,  8, 12,  4, 13,  3,  7, 15, 14,  5,  6,  2,
                4,  0,  5,  9,  7, 12,  2, 10, 14,  1,  3,  8, 11,  6, 15, 13]);
            var _zr = WordArray.create([
                5, 14,  7,  0,  9,  2, 11,  4, 13,  6, 15,  8,  1, 10,  3, 12,
                6, 11,  3,  7,  0, 13,  5, 10, 14, 15,  8, 12,  4,  9,  1,  2,
                15,  5,  1,  3,  7, 14,  6,  9, 11,  8, 12,  2, 10,  0,  4, 13,
                8,  6,  4,  1,  3, 11, 15,  0,  5, 12,  2, 13,  9,  7, 10, 14,
                12, 15, 10,  4,  1,  5,  8,  7,  6,  2, 13, 14,  0,  3,  9, 11]);
            var _sl = WordArray.create([
                 11, 14, 15, 12,  5,  8,  7,  9, 11, 13, 14, 15,  6,  7,  9,  8,
                7, 6,   8, 13, 11,  9,  7, 15,  7, 12, 15,  9, 11,  7, 13, 12,
                11, 13,  6,  7, 14,  9, 13, 15, 14,  8, 13,  6,  5, 12,  7,  5,
                  11, 12, 14, 15, 14, 15,  9,  8,  9, 14,  5,  6,  8,  6,  5, 12,
                9, 15,  5, 11,  6,  8, 13, 12,  5, 12, 13, 14, 11,  8,  5,  6 ]);
            var _sr = WordArray.create([
                8,  9,  9, 11, 13, 15, 15,  5,  7,  7,  8, 11, 14, 14, 12,  6,
                9, 13, 15,  7, 12,  8,  9, 11,  7,  7, 12,  7,  6, 15, 13, 11,
                9,  7, 15, 11,  8,  6,  6, 14, 12, 13,  5, 14, 13, 13,  7,  5,
                15,  5,  8, 11, 14, 14,  6, 14,  6,  9, 12,  9, 12,  5, 15,  8,
                8,  5, 12,  9, 12,  5, 14,  6,  8, 13,  6,  5, 15, 13, 11, 11 ]);
    
            var _hl =  WordArray.create([ 0x00000000, 0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xA953FD4E]);
            var _hr =  WordArray.create([ 0x50A28BE6, 0x5C4DD124, 0x6D703EF3, 0x7A6D76E9, 0x00000000]);
    
            /**
             * RIPEMD160 hash algorithm.
             */
            var RIPEMD160 = C_algo.RIPEMD160 = Hasher.extend({
                _doReset: function () {
                    this._hash  = WordArray.create([0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0]);
                },
    
                _doProcessBlock: function (M, offset) {
    
                    // Swap endian
                    for (var i = 0; i < 16; i++) {
                        // Shortcuts
                        var offset_i = offset + i;
                        var M_offset_i = M[offset_i];
    
                        // Swap
                        M[offset_i] = (
                            (((M_offset_i << 8)  | (M_offset_i >>> 24)) & 0x00ff00ff) |
                            (((M_offset_i << 24) | (M_offset_i >>> 8))  & 0xff00ff00)
                        );
                    }
                    // Shortcut
                    var H  = this._hash.words;
                    var hl = _hl.words;
                    var hr = _hr.words;
                    var zl = _zl.words;
                    var zr = _zr.words;
                    var sl = _sl.words;
                    var sr = _sr.words;
    
                    // Working variables
                    var al, bl, cl, dl, el;
                    var ar, br, cr, dr, er;
    
                    ar = al = H[0];
                    br = bl = H[1];
                    cr = cl = H[2];
                    dr = dl = H[3];
                    er = el = H[4];
                    // Computation
                    var t;
                    for (var i = 0; i < 80; i += 1) {
                        t = (al +  M[offset+zl[i]])|0;
                        if (i<16){
                        t +=  f1(bl,cl,dl) + hl[0];
                        } else if (i<32) {
                        t +=  f2(bl,cl,dl) + hl[1];
                        } else if (i<48) {
                        t +=  f3(bl,cl,dl) + hl[2];
                        } else if (i<64) {
                        t +=  f4(bl,cl,dl) + hl[3];
                        } else {// if (i<80) {
                        t +=  f5(bl,cl,dl) + hl[4];
                        }
                        t = t|0;
                        t =  rotl(t,sl[i]);
                        t = (t+el)|0;
                        al = el;
                        el = dl;
                        dl = rotl(cl, 10);
                        cl = bl;
                        bl = t;
    
                        t = (ar + M[offset+zr[i]])|0;
                        if (i<16){
                        t +=  f5(br,cr,dr) + hr[0];
                        } else if (i<32) {
                        t +=  f4(br,cr,dr) + hr[1];
                        } else if (i<48) {
                        t +=  f3(br,cr,dr) + hr[2];
                        } else if (i<64) {
                        t +=  f2(br,cr,dr) + hr[3];
                        } else {// if (i<80) {
                        t +=  f1(br,cr,dr) + hr[4];
                        }
                        t = t|0;
                        t =  rotl(t,sr[i]) ;
                        t = (t+er)|0;
                        ar = er;
                        er = dr;
                        dr = rotl(cr, 10);
                        cr = br;
                        br = t;
                    }
                    // Intermediate hash value
                    t    = (H[1] + cl + dr)|0;
                    H[1] = (H[2] + dl + er)|0;
                    H[2] = (H[3] + el + ar)|0;
                    H[3] = (H[4] + al + br)|0;
                    H[4] = (H[0] + bl + cr)|0;
                    H[0] =  t;
                },
    
                _doFinalize: function () {
                    // Shortcuts
                    var data = this._data;
                    var dataWords = data.words;
    
                    var nBitsTotal = this._nDataBytes * 8;
                    var nBitsLeft = data.sigBytes * 8;
    
                    // Add padding
                    dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
                    dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = (
                        (((nBitsTotal << 8)  | (nBitsTotal >>> 24)) & 0x00ff00ff) |
                        (((nBitsTotal << 24) | (nBitsTotal >>> 8))  & 0xff00ff00)
                    );
                    data.sigBytes = (dataWords.length + 1) * 4;
    
                    // Hash final blocks
                    this._process();
    
                    // Shortcuts
                    var hash = this._hash;
                    var H = hash.words;
    
                    // Swap endian
                    for (var i = 0; i < 5; i++) {
                        // Shortcut
                        var H_i = H[i];
    
                        // Swap
                        H[i] = (((H_i << 8)  | (H_i >>> 24)) & 0x00ff00ff) |
                               (((H_i << 24) | (H_i >>> 8))  & 0xff00ff00);
                    }
    
                    // Return final computed hash
                    return hash;
                },
    
                clone: function () {
                    var clone = Hasher.clone.call(this);
                    clone._hash = this._hash.clone();
    
                    return clone;
                }
            });
    
    
            function f1(x, y, z) {
                return ((x) ^ (y) ^ (z));
    
            }
    
            function f2(x, y, z) {
                return (((x)&(y)) | ((~x)&(z)));
            }
    
            function f3(x, y, z) {
                return (((x) | (~(y))) ^ (z));
            }
    
            function f4(x, y, z) {
                return (((x) & (z)) | ((y)&(~(z))));
            }
    
            function f5(x, y, z) {
                return ((x) ^ ((y) |(~(z))));
    
            }
    
            function rotl(x,n) {
                return (x<<n) | (x>>>(32-n));
            }
    
    
            /**
             * Shortcut function to the hasher's object interface.
             *
             * @param {WordArray|string} message The message to hash.
             *
             * @return {WordArray} The hash.
             *
             * @static
             *
             * @example
             *
             *     var hash = CryptoJS.RIPEMD160('message');
             *     var hash = CryptoJS.RIPEMD160(wordArray);
             */
            C.RIPEMD160 = Hasher._createHelper(RIPEMD160);
    
            /**
             * Shortcut function to the HMAC's object interface.
             *
             * @param {WordArray|string} message The message to hash.
             * @param {WordArray|string} key The secret key.
             *
             * @return {WordArray} The HMAC.
             *
             * @static
             *
             * @example
             *
             *     var hmac = CryptoJS.HmacRIPEMD160(message, key);
             */
            C.HmacRIPEMD160 = Hasher._createHmacHelper(RIPEMD160);
        }(Math));
    
    
        return CryptoJS.RIPEMD160;
    
    }));
    },{"./core":5}],29:[function(require,module,exports){
    ;(function (root, factory) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        (function () {
            // Shortcuts
            var C = CryptoJS;
            var C_lib = C.lib;
            var WordArray = C_lib.WordArray;
            var Hasher = C_lib.Hasher;
            var C_algo = C.algo;
    
            // Reusable object
            var W = [];
    
            /**
             * SHA-1 hash algorithm.
             */
            var SHA1 = C_algo.SHA1 = Hasher.extend({
                _doReset: function () {
                    this._hash = new WordArray.init([
                        0x67452301, 0xefcdab89,
                        0x98badcfe, 0x10325476,
                        0xc3d2e1f0
                    ]);
                },
    
                _doProcessBlock: function (M, offset) {
                    // Shortcut
                    var H = this._hash.words;
    
                    // Working variables
                    var a = H[0];
                    var b = H[1];
                    var c = H[2];
                    var d = H[3];
                    var e = H[4];
    
                    // Computation
                    for (var i = 0; i < 80; i++) {
                        if (i < 16) {
                            W[i] = M[offset + i] | 0;
                        } else {
                            var n = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16];
                            W[i] = (n << 1) | (n >>> 31);
                        }
    
                        var t = ((a << 5) | (a >>> 27)) + e + W[i];
                        if (i < 20) {
                            t += ((b & c) | (~b & d)) + 0x5a827999;
                        } else if (i < 40) {
                            t += (b ^ c ^ d) + 0x6ed9eba1;
                        } else if (i < 60) {
                            t += ((b & c) | (b & d) | (c & d)) - 0x70e44324;
                        } else /* if (i < 80) */ {
                            t += (b ^ c ^ d) - 0x359d3e2a;
                        }
    
                        e = d;
                        d = c;
                        c = (b << 30) | (b >>> 2);
                        b = a;
                        a = t;
                    }
    
                    // Intermediate hash value
                    H[0] = (H[0] + a) | 0;
                    H[1] = (H[1] + b) | 0;
                    H[2] = (H[2] + c) | 0;
                    H[3] = (H[3] + d) | 0;
                    H[4] = (H[4] + e) | 0;
                },
    
                _doFinalize: function () {
                    // Shortcuts
                    var data = this._data;
                    var dataWords = data.words;
    
                    var nBitsTotal = this._nDataBytes * 8;
                    var nBitsLeft = data.sigBytes * 8;
    
                    // Add padding
                    dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
                    dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = Math.floor(nBitsTotal / 0x100000000);
                    dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = nBitsTotal;
                    data.sigBytes = dataWords.length * 4;
    
                    // Hash final blocks
                    this._process();
    
                    // Return final computed hash
                    return this._hash;
                },
    
                clone: function () {
                    var clone = Hasher.clone.call(this);
                    clone._hash = this._hash.clone();
    
                    return clone;
                }
            });
    
            /**
             * Shortcut function to the hasher's object interface.
             *
             * @param {WordArray|string} message The message to hash.
             *
             * @return {WordArray} The hash.
             *
             * @static
             *
             * @example
             *
             *     var hash = CryptoJS.SHA1('message');
             *     var hash = CryptoJS.SHA1(wordArray);
             */
            C.SHA1 = Hasher._createHelper(SHA1);
    
            /**
             * Shortcut function to the HMAC's object interface.
             *
             * @param {WordArray|string} message The message to hash.
             * @param {WordArray|string} key The secret key.
             *
             * @return {WordArray} The HMAC.
             *
             * @static
             *
             * @example
             *
             *     var hmac = CryptoJS.HmacSHA1(message, key);
             */
            C.HmacSHA1 = Hasher._createHmacHelper(SHA1);
        }());
    
    
        return CryptoJS.SHA1;
    
    }));
    },{"./core":5}],30:[function(require,module,exports){
    ;(function (root, factory, undef) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"), require("./sha256"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core", "./sha256"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        (function () {
            // Shortcuts
            var C = CryptoJS;
            var C_lib = C.lib;
            var WordArray = C_lib.WordArray;
            var C_algo = C.algo;
            var SHA256 = C_algo.SHA256;
    
            /**
             * SHA-224 hash algorithm.
             */
            var SHA224 = C_algo.SHA224 = SHA256.extend({
                _doReset: function () {
                    this._hash = new WordArray.init([
                        0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939,
                        0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4
                    ]);
                },
    
                _doFinalize: function () {
                    var hash = SHA256._doFinalize.call(this);
    
                    hash.sigBytes -= 4;
    
                    return hash;
                }
            });
    
            /**
             * Shortcut function to the hasher's object interface.
             *
             * @param {WordArray|string} message The message to hash.
             *
             * @return {WordArray} The hash.
             *
             * @static
             *
             * @example
             *
             *     var hash = CryptoJS.SHA224('message');
             *     var hash = CryptoJS.SHA224(wordArray);
             */
            C.SHA224 = SHA256._createHelper(SHA224);
    
            /**
             * Shortcut function to the HMAC's object interface.
             *
             * @param {WordArray|string} message The message to hash.
             * @param {WordArray|string} key The secret key.
             *
             * @return {WordArray} The HMAC.
             *
             * @static
             *
             * @example
             *
             *     var hmac = CryptoJS.HmacSHA224(message, key);
             */
            C.HmacSHA224 = SHA256._createHmacHelper(SHA224);
        }());
    
    
        return CryptoJS.SHA224;
    
    }));
    },{"./core":5,"./sha256":31}],31:[function(require,module,exports){
    ;(function (root, factory) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        (function (Math) {
            // Shortcuts
            var C = CryptoJS;
            var C_lib = C.lib;
            var WordArray = C_lib.WordArray;
            var Hasher = C_lib.Hasher;
            var C_algo = C.algo;
    
            // Initialization and round constants tables
            var H = [];
            var K = [];
    
            // Compute constants
            (function () {
                function isPrime(n) {
                    var sqrtN = Math.sqrt(n);
                    for (var factor = 2; factor <= sqrtN; factor++) {
                        if (!(n % factor)) {
                            return false;
                        }
                    }
    
                    return true;
                }
    
                function getFractionalBits(n) {
                    return ((n - (n | 0)) * 0x100000000) | 0;
                }
    
                var n = 2;
                var nPrime = 0;
                while (nPrime < 64) {
                    if (isPrime(n)) {
                        if (nPrime < 8) {
                            H[nPrime] = getFractionalBits(Math.pow(n, 1 / 2));
                        }
                        K[nPrime] = getFractionalBits(Math.pow(n, 1 / 3));
    
                        nPrime++;
                    }
    
                    n++;
                }
            }());
    
            // Reusable object
            var W = [];
    
            /**
             * SHA-256 hash algorithm.
             */
            var SHA256 = C_algo.SHA256 = Hasher.extend({
                _doReset: function () {
                    this._hash = new WordArray.init(H.slice(0));
                },
    
                _doProcessBlock: function (M, offset) {
                    // Shortcut
                    var H = this._hash.words;
    
                    // Working variables
                    var a = H[0];
                    var b = H[1];
                    var c = H[2];
                    var d = H[3];
                    var e = H[4];
                    var f = H[5];
                    var g = H[6];
                    var h = H[7];
    
                    // Computation
                    for (var i = 0; i < 64; i++) {
                        if (i < 16) {
                            W[i] = M[offset + i] | 0;
                        } else {
                            var gamma0x = W[i - 15];
                            var gamma0  = ((gamma0x << 25) | (gamma0x >>> 7))  ^
                                          ((gamma0x << 14) | (gamma0x >>> 18)) ^
                                           (gamma0x >>> 3);
    
                            var gamma1x = W[i - 2];
                            var gamma1  = ((gamma1x << 15) | (gamma1x >>> 17)) ^
                                          ((gamma1x << 13) | (gamma1x >>> 19)) ^
                                           (gamma1x >>> 10);
    
                            W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
                        }
    
                        var ch  = (e & f) ^ (~e & g);
                        var maj = (a & b) ^ (a & c) ^ (b & c);
    
                        var sigma0 = ((a << 30) | (a >>> 2)) ^ ((a << 19) | (a >>> 13)) ^ ((a << 10) | (a >>> 22));
                        var sigma1 = ((e << 26) | (e >>> 6)) ^ ((e << 21) | (e >>> 11)) ^ ((e << 7)  | (e >>> 25));
    
                        var t1 = h + sigma1 + ch + K[i] + W[i];
                        var t2 = sigma0 + maj;
    
                        h = g;
                        g = f;
                        f = e;
                        e = (d + t1) | 0;
                        d = c;
                        c = b;
                        b = a;
                        a = (t1 + t2) | 0;
                    }
    
                    // Intermediate hash value
                    H[0] = (H[0] + a) | 0;
                    H[1] = (H[1] + b) | 0;
                    H[2] = (H[2] + c) | 0;
                    H[3] = (H[3] + d) | 0;
                    H[4] = (H[4] + e) | 0;
                    H[5] = (H[5] + f) | 0;
                    H[6] = (H[6] + g) | 0;
                    H[7] = (H[7] + h) | 0;
                },
    
                _doFinalize: function () {
                    // Shortcuts
                    var data = this._data;
                    var dataWords = data.words;
    
                    var nBitsTotal = this._nDataBytes * 8;
                    var nBitsLeft = data.sigBytes * 8;
    
                    // Add padding
                    dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
                    dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = Math.floor(nBitsTotal / 0x100000000);
                    dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = nBitsTotal;
                    data.sigBytes = dataWords.length * 4;
    
                    // Hash final blocks
                    this._process();
    
                    // Return final computed hash
                    return this._hash;
                },
    
                clone: function () {
                    var clone = Hasher.clone.call(this);
                    clone._hash = this._hash.clone();
    
                    return clone;
                }
            });
    
            /**
             * Shortcut function to the hasher's object interface.
             *
             * @param {WordArray|string} message The message to hash.
             *
             * @return {WordArray} The hash.
             *
             * @static
             *
             * @example
             *
             *     var hash = CryptoJS.SHA256('message');
             *     var hash = CryptoJS.SHA256(wordArray);
             */
            C.SHA256 = Hasher._createHelper(SHA256);
    
            /**
             * Shortcut function to the HMAC's object interface.
             *
             * @param {WordArray|string} message The message to hash.
             * @param {WordArray|string} key The secret key.
             *
             * @return {WordArray} The HMAC.
             *
             * @static
             *
             * @example
             *
             *     var hmac = CryptoJS.HmacSHA256(message, key);
             */
            C.HmacSHA256 = Hasher._createHmacHelper(SHA256);
        }(Math));
    
    
        return CryptoJS.SHA256;
    
    }));
    },{"./core":5}],32:[function(require,module,exports){
    ;(function (root, factory, undef) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"), require("./x64-core"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core", "./x64-core"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        (function (Math) {
            // Shortcuts
            var C = CryptoJS;
            var C_lib = C.lib;
            var WordArray = C_lib.WordArray;
            var Hasher = C_lib.Hasher;
            var C_x64 = C.x64;
            var X64Word = C_x64.Word;
            var C_algo = C.algo;
    
            // Constants tables
            var RHO_OFFSETS = [];
            var PI_INDEXES  = [];
            var ROUND_CONSTANTS = [];
    
            // Compute Constants
            (function () {
                // Compute rho offset constants
                var x = 1, y = 0;
                for (var t = 0; t < 24; t++) {
                    RHO_OFFSETS[x + 5 * y] = ((t + 1) * (t + 2) / 2) % 64;
    
                    var newX = y % 5;
                    var newY = (2 * x + 3 * y) % 5;
                    x = newX;
                    y = newY;
                }
    
                // Compute pi index constants
                for (var x = 0; x < 5; x++) {
                    for (var y = 0; y < 5; y++) {
                        PI_INDEXES[x + 5 * y] = y + ((2 * x + 3 * y) % 5) * 5;
                    }
                }
    
                // Compute round constants
                var LFSR = 0x01;
                for (var i = 0; i < 24; i++) {
                    var roundConstantMsw = 0;
                    var roundConstantLsw = 0;
    
                    for (var j = 0; j < 7; j++) {
                        if (LFSR & 0x01) {
                            var bitPosition = (1 << j) - 1;
                            if (bitPosition < 32) {
                                roundConstantLsw ^= 1 << bitPosition;
                            } else /* if (bitPosition >= 32) */ {
                                roundConstantMsw ^= 1 << (bitPosition - 32);
                            }
                        }
    
                        // Compute next LFSR
                        if (LFSR & 0x80) {
                            // Primitive polynomial over GF(2): x^8 + x^6 + x^5 + x^4 + 1
                            LFSR = (LFSR << 1) ^ 0x71;
                        } else {
                            LFSR <<= 1;
                        }
                    }
    
                    ROUND_CONSTANTS[i] = X64Word.create(roundConstantMsw, roundConstantLsw);
                }
            }());
    
            // Reusable objects for temporary values
            var T = [];
            (function () {
                for (var i = 0; i < 25; i++) {
                    T[i] = X64Word.create();
                }
            }());
    
            /**
             * SHA-3 hash algorithm.
             */
            var SHA3 = C_algo.SHA3 = Hasher.extend({
                /**
                 * Configuration options.
                 *
                 * @property {number} outputLength
                 *   The desired number of bits in the output hash.
                 *   Only values permitted are: 224, 256, 384, 512.
                 *   Default: 512
                 */
                cfg: Hasher.cfg.extend({
                    outputLength: 512
                }),
    
                _doReset: function () {
                    var state = this._state = []
                    for (var i = 0; i < 25; i++) {
                        state[i] = new X64Word.init();
                    }
    
                    this.blockSize = (1600 - 2 * this.cfg.outputLength) / 32;
                },
    
                _doProcessBlock: function (M, offset) {
                    // Shortcuts
                    var state = this._state;
                    var nBlockSizeLanes = this.blockSize / 2;
    
                    // Absorb
                    for (var i = 0; i < nBlockSizeLanes; i++) {
                        // Shortcuts
                        var M2i  = M[offset + 2 * i];
                        var M2i1 = M[offset + 2 * i + 1];
    
                        // Swap endian
                        M2i = (
                            (((M2i << 8)  | (M2i >>> 24)) & 0x00ff00ff) |
                            (((M2i << 24) | (M2i >>> 8))  & 0xff00ff00)
                        );
                        M2i1 = (
                            (((M2i1 << 8)  | (M2i1 >>> 24)) & 0x00ff00ff) |
                            (((M2i1 << 24) | (M2i1 >>> 8))  & 0xff00ff00)
                        );
    
                        // Absorb message into state
                        var lane = state[i];
                        lane.high ^= M2i1;
                        lane.low  ^= M2i;
                    }
    
                    // Rounds
                    for (var round = 0; round < 24; round++) {
                        // Theta
                        for (var x = 0; x < 5; x++) {
                            // Mix column lanes
                            var tMsw = 0, tLsw = 0;
                            for (var y = 0; y < 5; y++) {
                                var lane = state[x + 5 * y];
                                tMsw ^= lane.high;
                                tLsw ^= lane.low;
                            }
    
                            // Temporary values
                            var Tx = T[x];
                            Tx.high = tMsw;
                            Tx.low  = tLsw;
                        }
                        for (var x = 0; x < 5; x++) {
                            // Shortcuts
                            var Tx4 = T[(x + 4) % 5];
                            var Tx1 = T[(x + 1) % 5];
                            var Tx1Msw = Tx1.high;
                            var Tx1Lsw = Tx1.low;
    
                            // Mix surrounding columns
                            var tMsw = Tx4.high ^ ((Tx1Msw << 1) | (Tx1Lsw >>> 31));
                            var tLsw = Tx4.low  ^ ((Tx1Lsw << 1) | (Tx1Msw >>> 31));
                            for (var y = 0; y < 5; y++) {
                                var lane = state[x + 5 * y];
                                lane.high ^= tMsw;
                                lane.low  ^= tLsw;
                            }
                        }
    
                        // Rho Pi
                        for (var laneIndex = 1; laneIndex < 25; laneIndex++) {
                            // Shortcuts
                            var lane = state[laneIndex];
                            var laneMsw = lane.high;
                            var laneLsw = lane.low;
                            var rhoOffset = RHO_OFFSETS[laneIndex];
    
                            // Rotate lanes
                            if (rhoOffset < 32) {
                                var tMsw = (laneMsw << rhoOffset) | (laneLsw >>> (32 - rhoOffset));
                                var tLsw = (laneLsw << rhoOffset) | (laneMsw >>> (32 - rhoOffset));
                            } else /* if (rhoOffset >= 32) */ {
                                var tMsw = (laneLsw << (rhoOffset - 32)) | (laneMsw >>> (64 - rhoOffset));
                                var tLsw = (laneMsw << (rhoOffset - 32)) | (laneLsw >>> (64 - rhoOffset));
                            }
    
                            // Transpose lanes
                            var TPiLane = T[PI_INDEXES[laneIndex]];
                            TPiLane.high = tMsw;
                            TPiLane.low  = tLsw;
                        }
    
                        // Rho pi at x = y = 0
                        var T0 = T[0];
                        var state0 = state[0];
                        T0.high = state0.high;
                        T0.low  = state0.low;
    
                        // Chi
                        for (var x = 0; x < 5; x++) {
                            for (var y = 0; y < 5; y++) {
                                // Shortcuts
                                var laneIndex = x + 5 * y;
                                var lane = state[laneIndex];
                                var TLane = T[laneIndex];
                                var Tx1Lane = T[((x + 1) % 5) + 5 * y];
                                var Tx2Lane = T[((x + 2) % 5) + 5 * y];
    
                                // Mix rows
                                lane.high = TLane.high ^ (~Tx1Lane.high & Tx2Lane.high);
                                lane.low  = TLane.low  ^ (~Tx1Lane.low  & Tx2Lane.low);
                            }
                        }
    
                        // Iota
                        var lane = state[0];
                        var roundConstant = ROUND_CONSTANTS[round];
                        lane.high ^= roundConstant.high;
                        lane.low  ^= roundConstant.low;;
                    }
                },
    
                _doFinalize: function () {
                    // Shortcuts
                    var data = this._data;
                    var dataWords = data.words;
                    var nBitsTotal = this._nDataBytes * 8;
                    var nBitsLeft = data.sigBytes * 8;
                    var blockSizeBits = this.blockSize * 32;
    
                    // Add padding
                    dataWords[nBitsLeft >>> 5] |= 0x1 << (24 - nBitsLeft % 32);
                    dataWords[((Math.ceil((nBitsLeft + 1) / blockSizeBits) * blockSizeBits) >>> 5) - 1] |= 0x80;
                    data.sigBytes = dataWords.length * 4;
    
                    // Hash final blocks
                    this._process();
    
                    // Shortcuts
                    var state = this._state;
                    var outputLengthBytes = this.cfg.outputLength / 8;
                    var outputLengthLanes = outputLengthBytes / 8;
    
                    // Squeeze
                    var hashWords = [];
                    for (var i = 0; i < outputLengthLanes; i++) {
                        // Shortcuts
                        var lane = state[i];
                        var laneMsw = lane.high;
                        var laneLsw = lane.low;
    
                        // Swap endian
                        laneMsw = (
                            (((laneMsw << 8)  | (laneMsw >>> 24)) & 0x00ff00ff) |
                            (((laneMsw << 24) | (laneMsw >>> 8))  & 0xff00ff00)
                        );
                        laneLsw = (
                            (((laneLsw << 8)  | (laneLsw >>> 24)) & 0x00ff00ff) |
                            (((laneLsw << 24) | (laneLsw >>> 8))  & 0xff00ff00)
                        );
    
                        // Squeeze state to retrieve hash
                        hashWords.push(laneLsw);
                        hashWords.push(laneMsw);
                    }
    
                    // Return final computed hash
                    return new WordArray.init(hashWords, outputLengthBytes);
                },
    
                clone: function () {
                    var clone = Hasher.clone.call(this);
    
                    var state = clone._state = this._state.slice(0);
                    for (var i = 0; i < 25; i++) {
                        state[i] = state[i].clone();
                    }
    
                    return clone;
                }
            });
    
            /**
             * Shortcut function to the hasher's object interface.
             *
             * @param {WordArray|string} message The message to hash.
             *
             * @return {WordArray} The hash.
             *
             * @static
             *
             * @example
             *
             *     var hash = CryptoJS.SHA3('message');
             *     var hash = CryptoJS.SHA3(wordArray);
             */
            C.SHA3 = Hasher._createHelper(SHA3);
    
            /**
             * Shortcut function to the HMAC's object interface.
             *
             * @param {WordArray|string} message The message to hash.
             * @param {WordArray|string} key The secret key.
             *
             * @return {WordArray} The HMAC.
             *
             * @static
             *
             * @example
             *
             *     var hmac = CryptoJS.HmacSHA3(message, key);
             */
            C.HmacSHA3 = Hasher._createHmacHelper(SHA3);
        }(Math));
    
    
        return CryptoJS.SHA3;
    
    }));
    },{"./core":5,"./x64-core":36}],33:[function(require,module,exports){
    ;(function (root, factory, undef) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"), require("./x64-core"), require("./sha512"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core", "./x64-core", "./sha512"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        (function () {
            // Shortcuts
            var C = CryptoJS;
            var C_x64 = C.x64;
            var X64Word = C_x64.Word;
            var X64WordArray = C_x64.WordArray;
            var C_algo = C.algo;
            var SHA512 = C_algo.SHA512;
    
            /**
             * SHA-384 hash algorithm.
             */
            var SHA384 = C_algo.SHA384 = SHA512.extend({
                _doReset: function () {
                    this._hash = new X64WordArray.init([
                        new X64Word.init(0xcbbb9d5d, 0xc1059ed8), new X64Word.init(0x629a292a, 0x367cd507),
                        new X64Word.init(0x9159015a, 0x3070dd17), new X64Word.init(0x152fecd8, 0xf70e5939),
                        new X64Word.init(0x67332667, 0xffc00b31), new X64Word.init(0x8eb44a87, 0x68581511),
                        new X64Word.init(0xdb0c2e0d, 0x64f98fa7), new X64Word.init(0x47b5481d, 0xbefa4fa4)
                    ]);
                },
    
                _doFinalize: function () {
                    var hash = SHA512._doFinalize.call(this);
    
                    hash.sigBytes -= 16;
    
                    return hash;
                }
            });
    
            /**
             * Shortcut function to the hasher's object interface.
             *
             * @param {WordArray|string} message The message to hash.
             *
             * @return {WordArray} The hash.
             *
             * @static
             *
             * @example
             *
             *     var hash = CryptoJS.SHA384('message');
             *     var hash = CryptoJS.SHA384(wordArray);
             */
            C.SHA384 = SHA512._createHelper(SHA384);
    
            /**
             * Shortcut function to the HMAC's object interface.
             *
             * @param {WordArray|string} message The message to hash.
             * @param {WordArray|string} key The secret key.
             *
             * @return {WordArray} The HMAC.
             *
             * @static
             *
             * @example
             *
             *     var hmac = CryptoJS.HmacSHA384(message, key);
             */
            C.HmacSHA384 = SHA512._createHmacHelper(SHA384);
        }());
    
    
        return CryptoJS.SHA384;
    
    }));
    },{"./core":5,"./sha512":34,"./x64-core":36}],34:[function(require,module,exports){
    ;(function (root, factory, undef) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"), require("./x64-core"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core", "./x64-core"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        (function () {
            // Shortcuts
            var C = CryptoJS;
            var C_lib = C.lib;
            var Hasher = C_lib.Hasher;
            var C_x64 = C.x64;
            var X64Word = C_x64.Word;
            var X64WordArray = C_x64.WordArray;
            var C_algo = C.algo;
    
            function X64Word_create() {
                return X64Word.create.apply(X64Word, arguments);
            }
    
            // Constants
            var K = [
                X64Word_create(0x428a2f98, 0xd728ae22), X64Word_create(0x71374491, 0x23ef65cd),
                X64Word_create(0xb5c0fbcf, 0xec4d3b2f), X64Word_create(0xe9b5dba5, 0x8189dbbc),
                X64Word_create(0x3956c25b, 0xf348b538), X64Word_create(0x59f111f1, 0xb605d019),
                X64Word_create(0x923f82a4, 0xaf194f9b), X64Word_create(0xab1c5ed5, 0xda6d8118),
                X64Word_create(0xd807aa98, 0xa3030242), X64Word_create(0x12835b01, 0x45706fbe),
                X64Word_create(0x243185be, 0x4ee4b28c), X64Word_create(0x550c7dc3, 0xd5ffb4e2),
                X64Word_create(0x72be5d74, 0xf27b896f), X64Word_create(0x80deb1fe, 0x3b1696b1),
                X64Word_create(0x9bdc06a7, 0x25c71235), X64Word_create(0xc19bf174, 0xcf692694),
                X64Word_create(0xe49b69c1, 0x9ef14ad2), X64Word_create(0xefbe4786, 0x384f25e3),
                X64Word_create(0x0fc19dc6, 0x8b8cd5b5), X64Word_create(0x240ca1cc, 0x77ac9c65),
                X64Word_create(0x2de92c6f, 0x592b0275), X64Word_create(0x4a7484aa, 0x6ea6e483),
                X64Word_create(0x5cb0a9dc, 0xbd41fbd4), X64Word_create(0x76f988da, 0x831153b5),
                X64Word_create(0x983e5152, 0xee66dfab), X64Word_create(0xa831c66d, 0x2db43210),
                X64Word_create(0xb00327c8, 0x98fb213f), X64Word_create(0xbf597fc7, 0xbeef0ee4),
                X64Word_create(0xc6e00bf3, 0x3da88fc2), X64Word_create(0xd5a79147, 0x930aa725),
                X64Word_create(0x06ca6351, 0xe003826f), X64Word_create(0x14292967, 0x0a0e6e70),
                X64Word_create(0x27b70a85, 0x46d22ffc), X64Word_create(0x2e1b2138, 0x5c26c926),
                X64Word_create(0x4d2c6dfc, 0x5ac42aed), X64Word_create(0x53380d13, 0x9d95b3df),
                X64Word_create(0x650a7354, 0x8baf63de), X64Word_create(0x766a0abb, 0x3c77b2a8),
                X64Word_create(0x81c2c92e, 0x47edaee6), X64Word_create(0x92722c85, 0x1482353b),
                X64Word_create(0xa2bfe8a1, 0x4cf10364), X64Word_create(0xa81a664b, 0xbc423001),
                X64Word_create(0xc24b8b70, 0xd0f89791), X64Word_create(0xc76c51a3, 0x0654be30),
                X64Word_create(0xd192e819, 0xd6ef5218), X64Word_create(0xd6990624, 0x5565a910),
                X64Word_create(0xf40e3585, 0x5771202a), X64Word_create(0x106aa070, 0x32bbd1b8),
                X64Word_create(0x19a4c116, 0xb8d2d0c8), X64Word_create(0x1e376c08, 0x5141ab53),
                X64Word_create(0x2748774c, 0xdf8eeb99), X64Word_create(0x34b0bcb5, 0xe19b48a8),
                X64Word_create(0x391c0cb3, 0xc5c95a63), X64Word_create(0x4ed8aa4a, 0xe3418acb),
                X64Word_create(0x5b9cca4f, 0x7763e373), X64Word_create(0x682e6ff3, 0xd6b2b8a3),
                X64Word_create(0x748f82ee, 0x5defb2fc), X64Word_create(0x78a5636f, 0x43172f60),
                X64Word_create(0x84c87814, 0xa1f0ab72), X64Word_create(0x8cc70208, 0x1a6439ec),
                X64Word_create(0x90befffa, 0x23631e28), X64Word_create(0xa4506ceb, 0xde82bde9),
                X64Word_create(0xbef9a3f7, 0xb2c67915), X64Word_create(0xc67178f2, 0xe372532b),
                X64Word_create(0xca273ece, 0xea26619c), X64Word_create(0xd186b8c7, 0x21c0c207),
                X64Word_create(0xeada7dd6, 0xcde0eb1e), X64Word_create(0xf57d4f7f, 0xee6ed178),
                X64Word_create(0x06f067aa, 0x72176fba), X64Word_create(0x0a637dc5, 0xa2c898a6),
                X64Word_create(0x113f9804, 0xbef90dae), X64Word_create(0x1b710b35, 0x131c471b),
                X64Word_create(0x28db77f5, 0x23047d84), X64Word_create(0x32caab7b, 0x40c72493),
                X64Word_create(0x3c9ebe0a, 0x15c9bebc), X64Word_create(0x431d67c4, 0x9c100d4c),
                X64Word_create(0x4cc5d4be, 0xcb3e42b6), X64Word_create(0x597f299c, 0xfc657e2a),
                X64Word_create(0x5fcb6fab, 0x3ad6faec), X64Word_create(0x6c44198c, 0x4a475817)
            ];
    
            // Reusable objects
            var W = [];
            (function () {
                for (var i = 0; i < 80; i++) {
                    W[i] = X64Word_create();
                }
            }());
    
            /**
             * SHA-512 hash algorithm.
             */
            var SHA512 = C_algo.SHA512 = Hasher.extend({
                _doReset: function () {
                    this._hash = new X64WordArray.init([
                        new X64Word.init(0x6a09e667, 0xf3bcc908), new X64Word.init(0xbb67ae85, 0x84caa73b),
                        new X64Word.init(0x3c6ef372, 0xfe94f82b), new X64Word.init(0xa54ff53a, 0x5f1d36f1),
                        new X64Word.init(0x510e527f, 0xade682d1), new X64Word.init(0x9b05688c, 0x2b3e6c1f),
                        new X64Word.init(0x1f83d9ab, 0xfb41bd6b), new X64Word.init(0x5be0cd19, 0x137e2179)
                    ]);
                },
    
                _doProcessBlock: function (M, offset) {
                    // Shortcuts
                    var H = this._hash.words;
    
                    var H0 = H[0];
                    var H1 = H[1];
                    var H2 = H[2];
                    var H3 = H[3];
                    var H4 = H[4];
                    var H5 = H[5];
                    var H6 = H[6];
                    var H7 = H[7];
    
                    var H0h = H0.high;
                    var H0l = H0.low;
                    var H1h = H1.high;
                    var H1l = H1.low;
                    var H2h = H2.high;
                    var H2l = H2.low;
                    var H3h = H3.high;
                    var H3l = H3.low;
                    var H4h = H4.high;
                    var H4l = H4.low;
                    var H5h = H5.high;
                    var H5l = H5.low;
                    var H6h = H6.high;
                    var H6l = H6.low;
                    var H7h = H7.high;
                    var H7l = H7.low;
    
                    // Working variables
                    var ah = H0h;
                    var al = H0l;
                    var bh = H1h;
                    var bl = H1l;
                    var ch = H2h;
                    var cl = H2l;
                    var dh = H3h;
                    var dl = H3l;
                    var eh = H4h;
                    var el = H4l;
                    var fh = H5h;
                    var fl = H5l;
                    var gh = H6h;
                    var gl = H6l;
                    var hh = H7h;
                    var hl = H7l;
    
                    // Rounds
                    for (var i = 0; i < 80; i++) {
                        // Shortcut
                        var Wi = W[i];
    
                        // Extend message
                        if (i < 16) {
                            var Wih = Wi.high = M[offset + i * 2]     | 0;
                            var Wil = Wi.low  = M[offset + i * 2 + 1] | 0;
                        } else {
                            // Gamma0
                            var gamma0x  = W[i - 15];
                            var gamma0xh = gamma0x.high;
                            var gamma0xl = gamma0x.low;
                            var gamma0h  = ((gamma0xh >>> 1) | (gamma0xl << 31)) ^ ((gamma0xh >>> 8) | (gamma0xl << 24)) ^ (gamma0xh >>> 7);
                            var gamma0l  = ((gamma0xl >>> 1) | (gamma0xh << 31)) ^ ((gamma0xl >>> 8) | (gamma0xh << 24)) ^ ((gamma0xl >>> 7) | (gamma0xh << 25));
    
                            // Gamma1
                            var gamma1x  = W[i - 2];
                            var gamma1xh = gamma1x.high;
                            var gamma1xl = gamma1x.low;
                            var gamma1h  = ((gamma1xh >>> 19) | (gamma1xl << 13)) ^ ((gamma1xh << 3) | (gamma1xl >>> 29)) ^ (gamma1xh >>> 6);
                            var gamma1l  = ((gamma1xl >>> 19) | (gamma1xh << 13)) ^ ((gamma1xl << 3) | (gamma1xh >>> 29)) ^ ((gamma1xl >>> 6) | (gamma1xh << 26));
    
                            // W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16]
                            var Wi7  = W[i - 7];
                            var Wi7h = Wi7.high;
                            var Wi7l = Wi7.low;
    
                            var Wi16  = W[i - 16];
                            var Wi16h = Wi16.high;
                            var Wi16l = Wi16.low;
    
                            var Wil = gamma0l + Wi7l;
                            var Wih = gamma0h + Wi7h + ((Wil >>> 0) < (gamma0l >>> 0) ? 1 : 0);
                            var Wil = Wil + gamma1l;
                            var Wih = Wih + gamma1h + ((Wil >>> 0) < (gamma1l >>> 0) ? 1 : 0);
                            var Wil = Wil + Wi16l;
                            var Wih = Wih + Wi16h + ((Wil >>> 0) < (Wi16l >>> 0) ? 1 : 0);
    
                            Wi.high = Wih;
                            Wi.low  = Wil;
                        }
    
                        var chh  = (eh & fh) ^ (~eh & gh);
                        var chl  = (el & fl) ^ (~el & gl);
                        var majh = (ah & bh) ^ (ah & ch) ^ (bh & ch);
                        var majl = (al & bl) ^ (al & cl) ^ (bl & cl);
    
                        var sigma0h = ((ah >>> 28) | (al << 4))  ^ ((ah << 30)  | (al >>> 2)) ^ ((ah << 25) | (al >>> 7));
                        var sigma0l = ((al >>> 28) | (ah << 4))  ^ ((al << 30)  | (ah >>> 2)) ^ ((al << 25) | (ah >>> 7));
                        var sigma1h = ((eh >>> 14) | (el << 18)) ^ ((eh >>> 18) | (el << 14)) ^ ((eh << 23) | (el >>> 9));
                        var sigma1l = ((el >>> 14) | (eh << 18)) ^ ((el >>> 18) | (eh << 14)) ^ ((el << 23) | (eh >>> 9));
    
                        // t1 = h + sigma1 + ch + K[i] + W[i]
                        var Ki  = K[i];
                        var Kih = Ki.high;
                        var Kil = Ki.low;
    
                        var t1l = hl + sigma1l;
                        var t1h = hh + sigma1h + ((t1l >>> 0) < (hl >>> 0) ? 1 : 0);
                        var t1l = t1l + chl;
                        var t1h = t1h + chh + ((t1l >>> 0) < (chl >>> 0) ? 1 : 0);
                        var t1l = t1l + Kil;
                        var t1h = t1h + Kih + ((t1l >>> 0) < (Kil >>> 0) ? 1 : 0);
                        var t1l = t1l + Wil;
                        var t1h = t1h + Wih + ((t1l >>> 0) < (Wil >>> 0) ? 1 : 0);
    
                        // t2 = sigma0 + maj
                        var t2l = sigma0l + majl;
                        var t2h = sigma0h + majh + ((t2l >>> 0) < (sigma0l >>> 0) ? 1 : 0);
    
                        // Update working variables
                        hh = gh;
                        hl = gl;
                        gh = fh;
                        gl = fl;
                        fh = eh;
                        fl = el;
                        el = (dl + t1l) | 0;
                        eh = (dh + t1h + ((el >>> 0) < (dl >>> 0) ? 1 : 0)) | 0;
                        dh = ch;
                        dl = cl;
                        ch = bh;
                        cl = bl;
                        bh = ah;
                        bl = al;
                        al = (t1l + t2l) | 0;
                        ah = (t1h + t2h + ((al >>> 0) < (t1l >>> 0) ? 1 : 0)) | 0;
                    }
    
                    // Intermediate hash value
                    H0l = H0.low  = (H0l + al);
                    H0.high = (H0h + ah + ((H0l >>> 0) < (al >>> 0) ? 1 : 0));
                    H1l = H1.low  = (H1l + bl);
                    H1.high = (H1h + bh + ((H1l >>> 0) < (bl >>> 0) ? 1 : 0));
                    H2l = H2.low  = (H2l + cl);
                    H2.high = (H2h + ch + ((H2l >>> 0) < (cl >>> 0) ? 1 : 0));
                    H3l = H3.low  = (H3l + dl);
                    H3.high = (H3h + dh + ((H3l >>> 0) < (dl >>> 0) ? 1 : 0));
                    H4l = H4.low  = (H4l + el);
                    H4.high = (H4h + eh + ((H4l >>> 0) < (el >>> 0) ? 1 : 0));
                    H5l = H5.low  = (H5l + fl);
                    H5.high = (H5h + fh + ((H5l >>> 0) < (fl >>> 0) ? 1 : 0));
                    H6l = H6.low  = (H6l + gl);
                    H6.high = (H6h + gh + ((H6l >>> 0) < (gl >>> 0) ? 1 : 0));
                    H7l = H7.low  = (H7l + hl);
                    H7.high = (H7h + hh + ((H7l >>> 0) < (hl >>> 0) ? 1 : 0));
                },
    
                _doFinalize: function () {
                    // Shortcuts
                    var data = this._data;
                    var dataWords = data.words;
    
                    var nBitsTotal = this._nDataBytes * 8;
                    var nBitsLeft = data.sigBytes * 8;
    
                    // Add padding
                    dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
                    dataWords[(((nBitsLeft + 128) >>> 10) << 5) + 30] = Math.floor(nBitsTotal / 0x100000000);
                    dataWords[(((nBitsLeft + 128) >>> 10) << 5) + 31] = nBitsTotal;
                    data.sigBytes = dataWords.length * 4;
    
                    // Hash final blocks
                    this._process();
    
                    // Convert hash to 32-bit word array before returning
                    var hash = this._hash.toX32();
    
                    // Return final computed hash
                    return hash;
                },
    
                clone: function () {
                    var clone = Hasher.clone.call(this);
                    clone._hash = this._hash.clone();
    
                    return clone;
                },
    
                blockSize: 1024/32
            });
    
            /**
             * Shortcut function to the hasher's object interface.
             *
             * @param {WordArray|string} message The message to hash.
             *
             * @return {WordArray} The hash.
             *
             * @static
             *
             * @example
             *
             *     var hash = CryptoJS.SHA512('message');
             *     var hash = CryptoJS.SHA512(wordArray);
             */
            C.SHA512 = Hasher._createHelper(SHA512);
    
            /**
             * Shortcut function to the HMAC's object interface.
             *
             * @param {WordArray|string} message The message to hash.
             * @param {WordArray|string} key The secret key.
             *
             * @return {WordArray} The HMAC.
             *
             * @static
             *
             * @example
             *
             *     var hmac = CryptoJS.HmacSHA512(message, key);
             */
            C.HmacSHA512 = Hasher._createHmacHelper(SHA512);
        }());
    
    
        return CryptoJS.SHA512;
    
    }));
    },{"./core":5,"./x64-core":36}],35:[function(require,module,exports){
    ;(function (root, factory, undef) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"), require("./enc-base64"), require("./md5"), require("./evpkdf"), require("./cipher-core"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core", "./enc-base64", "./md5", "./evpkdf", "./cipher-core"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        (function () {
            // Shortcuts
            var C = CryptoJS;
            var C_lib = C.lib;
            var WordArray = C_lib.WordArray;
            var BlockCipher = C_lib.BlockCipher;
            var C_algo = C.algo;
    
            // Permuted Choice 1 constants
            var PC1 = [
                57, 49, 41, 33, 25, 17, 9,  1,
                58, 50, 42, 34, 26, 18, 10, 2,
                59, 51, 43, 35, 27, 19, 11, 3,
                60, 52, 44, 36, 63, 55, 47, 39,
                31, 23, 15, 7,  62, 54, 46, 38,
                30, 22, 14, 6,  61, 53, 45, 37,
                29, 21, 13, 5,  28, 20, 12, 4
            ];
    
            // Permuted Choice 2 constants
            var PC2 = [
                14, 17, 11, 24, 1,  5,
                3,  28, 15, 6,  21, 10,
                23, 19, 12, 4,  26, 8,
                16, 7,  27, 20, 13, 2,
                41, 52, 31, 37, 47, 55,
                30, 40, 51, 45, 33, 48,
                44, 49, 39, 56, 34, 53,
                46, 42, 50, 36, 29, 32
            ];
    
            // Cumulative bit shift constants
            var BIT_SHIFTS = [1,  2,  4,  6,  8,  10, 12, 14, 15, 17, 19, 21, 23, 25, 27, 28];
    
            // SBOXes and round permutation constants
            var SBOX_P = [
                {
                    0x0: 0x808200,
                    0x10000000: 0x8000,
                    0x20000000: 0x808002,
                    0x30000000: 0x2,
                    0x40000000: 0x200,
                    0x50000000: 0x808202,
                    0x60000000: 0x800202,
                    0x70000000: 0x800000,
                    0x80000000: 0x202,
                    0x90000000: 0x800200,
                    0xa0000000: 0x8200,
                    0xb0000000: 0x808000,
                    0xc0000000: 0x8002,
                    0xd0000000: 0x800002,
                    0xe0000000: 0x0,
                    0xf0000000: 0x8202,
                    0x8000000: 0x0,
                    0x18000000: 0x808202,
                    0x28000000: 0x8202,
                    0x38000000: 0x8000,
                    0x48000000: 0x808200,
                    0x58000000: 0x200,
                    0x68000000: 0x808002,
                    0x78000000: 0x2,
                    0x88000000: 0x800200,
                    0x98000000: 0x8200,
                    0xa8000000: 0x808000,
                    0xb8000000: 0x800202,
                    0xc8000000: 0x800002,
                    0xd8000000: 0x8002,
                    0xe8000000: 0x202,
                    0xf8000000: 0x800000,
                    0x1: 0x8000,
                    0x10000001: 0x2,
                    0x20000001: 0x808200,
                    0x30000001: 0x800000,
                    0x40000001: 0x808002,
                    0x50000001: 0x8200,
                    0x60000001: 0x200,
                    0x70000001: 0x800202,
                    0x80000001: 0x808202,
                    0x90000001: 0x808000,
                    0xa0000001: 0x800002,
                    0xb0000001: 0x8202,
                    0xc0000001: 0x202,
                    0xd0000001: 0x800200,
                    0xe0000001: 0x8002,
                    0xf0000001: 0x0,
                    0x8000001: 0x808202,
                    0x18000001: 0x808000,
                    0x28000001: 0x800000,
                    0x38000001: 0x200,
                    0x48000001: 0x8000,
                    0x58000001: 0x800002,
                    0x68000001: 0x2,
                    0x78000001: 0x8202,
                    0x88000001: 0x8002,
                    0x98000001: 0x800202,
                    0xa8000001: 0x202,
                    0xb8000001: 0x808200,
                    0xc8000001: 0x800200,
                    0xd8000001: 0x0,
                    0xe8000001: 0x8200,
                    0xf8000001: 0x808002
                },
                {
                    0x0: 0x40084010,
                    0x1000000: 0x4000,
                    0x2000000: 0x80000,
                    0x3000000: 0x40080010,
                    0x4000000: 0x40000010,
                    0x5000000: 0x40084000,
                    0x6000000: 0x40004000,
                    0x7000000: 0x10,
                    0x8000000: 0x84000,
                    0x9000000: 0x40004010,
                    0xa000000: 0x40000000,
                    0xb000000: 0x84010,
                    0xc000000: 0x80010,
                    0xd000000: 0x0,
                    0xe000000: 0x4010,
                    0xf000000: 0x40080000,
                    0x800000: 0x40004000,
                    0x1800000: 0x84010,
                    0x2800000: 0x10,
                    0x3800000: 0x40004010,
                    0x4800000: 0x40084010,
                    0x5800000: 0x40000000,
                    0x6800000: 0x80000,
                    0x7800000: 0x40080010,
                    0x8800000: 0x80010,
                    0x9800000: 0x0,
                    0xa800000: 0x4000,
                    0xb800000: 0x40080000,
                    0xc800000: 0x40000010,
                    0xd800000: 0x84000,
                    0xe800000: 0x40084000,
                    0xf800000: 0x4010,
                    0x10000000: 0x0,
                    0x11000000: 0x40080010,
                    0x12000000: 0x40004010,
                    0x13000000: 0x40084000,
                    0x14000000: 0x40080000,
                    0x15000000: 0x10,
                    0x16000000: 0x84010,
                    0x17000000: 0x4000,
                    0x18000000: 0x4010,
                    0x19000000: 0x80000,
                    0x1a000000: 0x80010,
                    0x1b000000: 0x40000010,
                    0x1c000000: 0x84000,
                    0x1d000000: 0x40004000,
                    0x1e000000: 0x40000000,
                    0x1f000000: 0x40084010,
                    0x10800000: 0x84010,
                    0x11800000: 0x80000,
                    0x12800000: 0x40080000,
                    0x13800000: 0x4000,
                    0x14800000: 0x40004000,
                    0x15800000: 0x40084010,
                    0x16800000: 0x10,
                    0x17800000: 0x40000000,
                    0x18800000: 0x40084000,
                    0x19800000: 0x40000010,
                    0x1a800000: 0x40004010,
                    0x1b800000: 0x80010,
                    0x1c800000: 0x0,
                    0x1d800000: 0x4010,
                    0x1e800000: 0x40080010,
                    0x1f800000: 0x84000
                },
                {
                    0x0: 0x104,
                    0x100000: 0x0,
                    0x200000: 0x4000100,
                    0x300000: 0x10104,
                    0x400000: 0x10004,
                    0x500000: 0x4000004,
                    0x600000: 0x4010104,
                    0x700000: 0x4010000,
                    0x800000: 0x4000000,
                    0x900000: 0x4010100,
                    0xa00000: 0x10100,
                    0xb00000: 0x4010004,
                    0xc00000: 0x4000104,
                    0xd00000: 0x10000,
                    0xe00000: 0x4,
                    0xf00000: 0x100,
                    0x80000: 0x4010100,
                    0x180000: 0x4010004,
                    0x280000: 0x0,
                    0x380000: 0x4000100,
                    0x480000: 0x4000004,
                    0x580000: 0x10000,
                    0x680000: 0x10004,
                    0x780000: 0x104,
                    0x880000: 0x4,
                    0x980000: 0x100,
                    0xa80000: 0x4010000,
                    0xb80000: 0x10104,
                    0xc80000: 0x10100,
                    0xd80000: 0x4000104,
                    0xe80000: 0x4010104,
                    0xf80000: 0x4000000,
                    0x1000000: 0x4010100,
                    0x1100000: 0x10004,
                    0x1200000: 0x10000,
                    0x1300000: 0x4000100,
                    0x1400000: 0x100,
                    0x1500000: 0x4010104,
                    0x1600000: 0x4000004,
                    0x1700000: 0x0,
                    0x1800000: 0x4000104,
                    0x1900000: 0x4000000,
                    0x1a00000: 0x4,
                    0x1b00000: 0x10100,
                    0x1c00000: 0x4010000,
                    0x1d00000: 0x104,
                    0x1e00000: 0x10104,
                    0x1f00000: 0x4010004,
                    0x1080000: 0x4000000,
                    0x1180000: 0x104,
                    0x1280000: 0x4010100,
                    0x1380000: 0x0,
                    0x1480000: 0x10004,
                    0x1580000: 0x4000100,
                    0x1680000: 0x100,
                    0x1780000: 0x4010004,
                    0x1880000: 0x10000,
                    0x1980000: 0x4010104,
                    0x1a80000: 0x10104,
                    0x1b80000: 0x4000004,
                    0x1c80000: 0x4000104,
                    0x1d80000: 0x4010000,
                    0x1e80000: 0x4,
                    0x1f80000: 0x10100
                },
                {
                    0x0: 0x80401000,
                    0x10000: 0x80001040,
                    0x20000: 0x401040,
                    0x30000: 0x80400000,
                    0x40000: 0x0,
                    0x50000: 0x401000,
                    0x60000: 0x80000040,
                    0x70000: 0x400040,
                    0x80000: 0x80000000,
                    0x90000: 0x400000,
                    0xa0000: 0x40,
                    0xb0000: 0x80001000,
                    0xc0000: 0x80400040,
                    0xd0000: 0x1040,
                    0xe0000: 0x1000,
                    0xf0000: 0x80401040,
                    0x8000: 0x80001040,
                    0x18000: 0x40,
                    0x28000: 0x80400040,
                    0x38000: 0x80001000,
                    0x48000: 0x401000,
                    0x58000: 0x80401040,
                    0x68000: 0x0,
                    0x78000: 0x80400000,
                    0x88000: 0x1000,
                    0x98000: 0x80401000,
                    0xa8000: 0x400000,
                    0xb8000: 0x1040,
                    0xc8000: 0x80000000,
                    0xd8000: 0x400040,
                    0xe8000: 0x401040,
                    0xf8000: 0x80000040,
                    0x100000: 0x400040,
                    0x110000: 0x401000,
                    0x120000: 0x80000040,
                    0x130000: 0x0,
                    0x140000: 0x1040,
                    0x150000: 0x80400040,
                    0x160000: 0x80401000,
                    0x170000: 0x80001040,
                    0x180000: 0x80401040,
                    0x190000: 0x80000000,
                    0x1a0000: 0x80400000,
                    0x1b0000: 0x401040,
                    0x1c0000: 0x80001000,
                    0x1d0000: 0x400000,
                    0x1e0000: 0x40,
                    0x1f0000: 0x1000,
                    0x108000: 0x80400000,
                    0x118000: 0x80401040,
                    0x128000: 0x0,
                    0x138000: 0x401000,
                    0x148000: 0x400040,
                    0x158000: 0x80000000,
                    0x168000: 0x80001040,
                    0x178000: 0x40,
                    0x188000: 0x80000040,
                    0x198000: 0x1000,
                    0x1a8000: 0x80001000,
                    0x1b8000: 0x80400040,
                    0x1c8000: 0x1040,
                    0x1d8000: 0x80401000,
                    0x1e8000: 0x400000,
                    0x1f8000: 0x401040
                },
                {
                    0x0: 0x80,
                    0x1000: 0x1040000,
                    0x2000: 0x40000,
                    0x3000: 0x20000000,
                    0x4000: 0x20040080,
                    0x5000: 0x1000080,
                    0x6000: 0x21000080,
                    0x7000: 0x40080,
                    0x8000: 0x1000000,
                    0x9000: 0x20040000,
                    0xa000: 0x20000080,
                    0xb000: 0x21040080,
                    0xc000: 0x21040000,
                    0xd000: 0x0,
                    0xe000: 0x1040080,
                    0xf000: 0x21000000,
                    0x800: 0x1040080,
                    0x1800: 0x21000080,
                    0x2800: 0x80,
                    0x3800: 0x1040000,
                    0x4800: 0x40000,
                    0x5800: 0x20040080,
                    0x6800: 0x21040000,
                    0x7800: 0x20000000,
                    0x8800: 0x20040000,
                    0x9800: 0x0,
                    0xa800: 0x21040080,
                    0xb800: 0x1000080,
                    0xc800: 0x20000080,
                    0xd800: 0x21000000,
                    0xe800: 0x1000000,
                    0xf800: 0x40080,
                    0x10000: 0x40000,
                    0x11000: 0x80,
                    0x12000: 0x20000000,
                    0x13000: 0x21000080,
                    0x14000: 0x1000080,
                    0x15000: 0x21040000,
                    0x16000: 0x20040080,
                    0x17000: 0x1000000,
                    0x18000: 0x21040080,
                    0x19000: 0x21000000,
                    0x1a000: 0x1040000,
                    0x1b000: 0x20040000,
                    0x1c000: 0x40080,
                    0x1d000: 0x20000080,
                    0x1e000: 0x0,
                    0x1f000: 0x1040080,
                    0x10800: 0x21000080,
                    0x11800: 0x1000000,
                    0x12800: 0x1040000,
                    0x13800: 0x20040080,
                    0x14800: 0x20000000,
                    0x15800: 0x1040080,
                    0x16800: 0x80,
                    0x17800: 0x21040000,
                    0x18800: 0x40080,
                    0x19800: 0x21040080,
                    0x1a800: 0x0,
                    0x1b800: 0x21000000,
                    0x1c800: 0x1000080,
                    0x1d800: 0x40000,
                    0x1e800: 0x20040000,
                    0x1f800: 0x20000080
                },
                {
                    0x0: 0x10000008,
                    0x100: 0x2000,
                    0x200: 0x10200000,
                    0x300: 0x10202008,
                    0x400: 0x10002000,
                    0x500: 0x200000,
                    0x600: 0x200008,
                    0x700: 0x10000000,
                    0x800: 0x0,
                    0x900: 0x10002008,
                    0xa00: 0x202000,
                    0xb00: 0x8,
                    0xc00: 0x10200008,
                    0xd00: 0x202008,
                    0xe00: 0x2008,
                    0xf00: 0x10202000,
                    0x80: 0x10200000,
                    0x180: 0x10202008,
                    0x280: 0x8,
                    0x380: 0x200000,
                    0x480: 0x202008,
                    0x580: 0x10000008,
                    0x680: 0x10002000,
                    0x780: 0x2008,
                    0x880: 0x200008,
                    0x980: 0x2000,
                    0xa80: 0x10002008,
                    0xb80: 0x10200008,
                    0xc80: 0x0,
                    0xd80: 0x10202000,
                    0xe80: 0x202000,
                    0xf80: 0x10000000,
                    0x1000: 0x10002000,
                    0x1100: 0x10200008,
                    0x1200: 0x10202008,
                    0x1300: 0x2008,
                    0x1400: 0x200000,
                    0x1500: 0x10000000,
                    0x1600: 0x10000008,
                    0x1700: 0x202000,
                    0x1800: 0x202008,
                    0x1900: 0x0,
                    0x1a00: 0x8,
                    0x1b00: 0x10200000,
                    0x1c00: 0x2000,
                    0x1d00: 0x10002008,
                    0x1e00: 0x10202000,
                    0x1f00: 0x200008,
                    0x1080: 0x8,
                    0x1180: 0x202000,
                    0x1280: 0x200000,
                    0x1380: 0x10000008,
                    0x1480: 0x10002000,
                    0x1580: 0x2008,
                    0x1680: 0x10202008,
                    0x1780: 0x10200000,
                    0x1880: 0x10202000,
                    0x1980: 0x10200008,
                    0x1a80: 0x2000,
                    0x1b80: 0x202008,
                    0x1c80: 0x200008,
                    0x1d80: 0x0,
                    0x1e80: 0x10000000,
                    0x1f80: 0x10002008
                },
                {
                    0x0: 0x100000,
                    0x10: 0x2000401,
                    0x20: 0x400,
                    0x30: 0x100401,
                    0x40: 0x2100401,
                    0x50: 0x0,
                    0x60: 0x1,
                    0x70: 0x2100001,
                    0x80: 0x2000400,
                    0x90: 0x100001,
                    0xa0: 0x2000001,
                    0xb0: 0x2100400,
                    0xc0: 0x2100000,
                    0xd0: 0x401,
                    0xe0: 0x100400,
                    0xf0: 0x2000000,
                    0x8: 0x2100001,
                    0x18: 0x0,
                    0x28: 0x2000401,
                    0x38: 0x2100400,
                    0x48: 0x100000,
                    0x58: 0x2000001,
                    0x68: 0x2000000,
                    0x78: 0x401,
                    0x88: 0x100401,
                    0x98: 0x2000400,
                    0xa8: 0x2100000,
                    0xb8: 0x100001,
                    0xc8: 0x400,
                    0xd8: 0x2100401,
                    0xe8: 0x1,
                    0xf8: 0x100400,
                    0x100: 0x2000000,
                    0x110: 0x100000,
                    0x120: 0x2000401,
                    0x130: 0x2100001,
                    0x140: 0x100001,
                    0x150: 0x2000400,
                    0x160: 0x2100400,
                    0x170: 0x100401,
                    0x180: 0x401,
                    0x190: 0x2100401,
                    0x1a0: 0x100400,
                    0x1b0: 0x1,
                    0x1c0: 0x0,
                    0x1d0: 0x2100000,
                    0x1e0: 0x2000001,
                    0x1f0: 0x400,
                    0x108: 0x100400,
                    0x118: 0x2000401,
                    0x128: 0x2100001,
                    0x138: 0x1,
                    0x148: 0x2000000,
                    0x158: 0x100000,
                    0x168: 0x401,
                    0x178: 0x2100400,
                    0x188: 0x2000001,
                    0x198: 0x2100000,
                    0x1a8: 0x0,
                    0x1b8: 0x2100401,
                    0x1c8: 0x100401,
                    0x1d8: 0x400,
                    0x1e8: 0x2000400,
                    0x1f8: 0x100001
                },
                {
                    0x0: 0x8000820,
                    0x1: 0x20000,
                    0x2: 0x8000000,
                    0x3: 0x20,
                    0x4: 0x20020,
                    0x5: 0x8020820,
                    0x6: 0x8020800,
                    0x7: 0x800,
                    0x8: 0x8020000,
                    0x9: 0x8000800,
                    0xa: 0x20800,
                    0xb: 0x8020020,
                    0xc: 0x820,
                    0xd: 0x0,
                    0xe: 0x8000020,
                    0xf: 0x20820,
                    0x80000000: 0x800,
                    0x80000001: 0x8020820,
                    0x80000002: 0x8000820,
                    0x80000003: 0x8000000,
                    0x80000004: 0x8020000,
                    0x80000005: 0x20800,
                    0x80000006: 0x20820,
                    0x80000007: 0x20,
                    0x80000008: 0x8000020,
                    0x80000009: 0x820,
                    0x8000000a: 0x20020,
                    0x8000000b: 0x8020800,
                    0x8000000c: 0x0,
                    0x8000000d: 0x8020020,
                    0x8000000e: 0x8000800,
                    0x8000000f: 0x20000,
                    0x10: 0x20820,
                    0x11: 0x8020800,
                    0x12: 0x20,
                    0x13: 0x800,
                    0x14: 0x8000800,
                    0x15: 0x8000020,
                    0x16: 0x8020020,
                    0x17: 0x20000,
                    0x18: 0x0,
                    0x19: 0x20020,
                    0x1a: 0x8020000,
                    0x1b: 0x8000820,
                    0x1c: 0x8020820,
                    0x1d: 0x20800,
                    0x1e: 0x820,
                    0x1f: 0x8000000,
                    0x80000010: 0x20000,
                    0x80000011: 0x800,
                    0x80000012: 0x8020020,
                    0x80000013: 0x20820,
                    0x80000014: 0x20,
                    0x80000015: 0x8020000,
                    0x80000016: 0x8000000,
                    0x80000017: 0x8000820,
                    0x80000018: 0x8020820,
                    0x80000019: 0x8000020,
                    0x8000001a: 0x8000800,
                    0x8000001b: 0x0,
                    0x8000001c: 0x20800,
                    0x8000001d: 0x820,
                    0x8000001e: 0x20020,
                    0x8000001f: 0x8020800
                }
            ];
    
            // Masks that select the SBOX input
            var SBOX_MASK = [
                0xf8000001, 0x1f800000, 0x01f80000, 0x001f8000,
                0x0001f800, 0x00001f80, 0x000001f8, 0x8000001f
            ];
    
            /**
             * DES block cipher algorithm.
             */
            var DES = C_algo.DES = BlockCipher.extend({
                _doReset: function () {
                    // Shortcuts
                    var key = this._key;
                    var keyWords = key.words;
    
                    // Select 56 bits according to PC1
                    var keyBits = [];
                    for (var i = 0; i < 56; i++) {
                        var keyBitPos = PC1[i] - 1;
                        keyBits[i] = (keyWords[keyBitPos >>> 5] >>> (31 - keyBitPos % 32)) & 1;
                    }
    
                    // Assemble 16 subkeys
                    var subKeys = this._subKeys = [];
                    for (var nSubKey = 0; nSubKey < 16; nSubKey++) {
                        // Create subkey
                        var subKey = subKeys[nSubKey] = [];
    
                        // Shortcut
                        var bitShift = BIT_SHIFTS[nSubKey];
    
                        // Select 48 bits according to PC2
                        for (var i = 0; i < 24; i++) {
                            // Select from the left 28 key bits
                            subKey[(i / 6) | 0] |= keyBits[((PC2[i] - 1) + bitShift) % 28] << (31 - i % 6);
    
                            // Select from the right 28 key bits
                            subKey[4 + ((i / 6) | 0)] |= keyBits[28 + (((PC2[i + 24] - 1) + bitShift) % 28)] << (31 - i % 6);
                        }
    
                        // Since each subkey is applied to an expanded 32-bit input,
                        // the subkey can be broken into 8 values scaled to 32-bits,
                        // which allows the key to be used without expansion
                        subKey[0] = (subKey[0] << 1) | (subKey[0] >>> 31);
                        for (var i = 1; i < 7; i++) {
                            subKey[i] = subKey[i] >>> ((i - 1) * 4 + 3);
                        }
                        subKey[7] = (subKey[7] << 5) | (subKey[7] >>> 27);
                    }
    
                    // Compute inverse subkeys
                    var invSubKeys = this._invSubKeys = [];
                    for (var i = 0; i < 16; i++) {
                        invSubKeys[i] = subKeys[15 - i];
                    }
                },
    
                encryptBlock: function (M, offset) {
                    this._doCryptBlock(M, offset, this._subKeys);
                },
    
                decryptBlock: function (M, offset) {
                    this._doCryptBlock(M, offset, this._invSubKeys);
                },
    
                _doCryptBlock: function (M, offset, subKeys) {
                    // Get input
                    this._lBlock = M[offset];
                    this._rBlock = M[offset + 1];
    
                    // Initial permutation
                    exchangeLR.call(this, 4,  0x0f0f0f0f);
                    exchangeLR.call(this, 16, 0x0000ffff);
                    exchangeRL.call(this, 2,  0x33333333);
                    exchangeRL.call(this, 8,  0x00ff00ff);
                    exchangeLR.call(this, 1,  0x55555555);
    
                    // Rounds
                    for (var round = 0; round < 16; round++) {
                        // Shortcuts
                        var subKey = subKeys[round];
                        var lBlock = this._lBlock;
                        var rBlock = this._rBlock;
    
                        // Feistel function
                        var f = 0;
                        for (var i = 0; i < 8; i++) {
                            f |= SBOX_P[i][((rBlock ^ subKey[i]) & SBOX_MASK[i]) >>> 0];
                        }
                        this._lBlock = rBlock;
                        this._rBlock = lBlock ^ f;
                    }
    
                    // Undo swap from last round
                    var t = this._lBlock;
                    this._lBlock = this._rBlock;
                    this._rBlock = t;
    
                    // Final permutation
                    exchangeLR.call(this, 1,  0x55555555);
                    exchangeRL.call(this, 8,  0x00ff00ff);
                    exchangeRL.call(this, 2,  0x33333333);
                    exchangeLR.call(this, 16, 0x0000ffff);
                    exchangeLR.call(this, 4,  0x0f0f0f0f);
    
                    // Set output
                    M[offset] = this._lBlock;
                    M[offset + 1] = this._rBlock;
                },
    
                keySize: 64/32,
    
                ivSize: 64/32,
    
                blockSize: 64/32
            });
    
            // Swap bits across the left and right words
            function exchangeLR(offset, mask) {
                var t = ((this._lBlock >>> offset) ^ this._rBlock) & mask;
                this._rBlock ^= t;
                this._lBlock ^= t << offset;
            }
    
            function exchangeRL(offset, mask) {
                var t = ((this._rBlock >>> offset) ^ this._lBlock) & mask;
                this._lBlock ^= t;
                this._rBlock ^= t << offset;
            }
    
            /**
             * Shortcut functions to the cipher's object interface.
             *
             * @example
             *
             *     var ciphertext = CryptoJS.DES.encrypt(message, key, cfg);
             *     var plaintext  = CryptoJS.DES.decrypt(ciphertext, key, cfg);
             */
            C.DES = BlockCipher._createHelper(DES);
    
            /**
             * Triple-DES block cipher algorithm.
             */
            var TripleDES = C_algo.TripleDES = BlockCipher.extend({
                _doReset: function () {
                    // Shortcuts
                    var key = this._key;
                    var keyWords = key.words;
    
                    // Create DES instances
                    this._des1 = DES.createEncryptor(WordArray.create(keyWords.slice(0, 2)));
                    this._des2 = DES.createEncryptor(WordArray.create(keyWords.slice(2, 4)));
                    this._des3 = DES.createEncryptor(WordArray.create(keyWords.slice(4, 6)));
                },
    
                encryptBlock: function (M, offset) {
                    this._des1.encryptBlock(M, offset);
                    this._des2.decryptBlock(M, offset);
                    this._des3.encryptBlock(M, offset);
                },
    
                decryptBlock: function (M, offset) {
                    this._des3.decryptBlock(M, offset);
                    this._des2.encryptBlock(M, offset);
                    this._des1.decryptBlock(M, offset);
                },
    
                keySize: 192/32,
    
                ivSize: 64/32,
    
                blockSize: 64/32
            });
    
            /**
             * Shortcut functions to the cipher's object interface.
             *
             * @example
             *
             *     var ciphertext = CryptoJS.TripleDES.encrypt(message, key, cfg);
             *     var plaintext  = CryptoJS.TripleDES.decrypt(ciphertext, key, cfg);
             */
            C.TripleDES = BlockCipher._createHelper(TripleDES);
        }());
    
    
        return CryptoJS.TripleDES;
    
    }));
    },{"./cipher-core":4,"./core":5,"./enc-base64":6,"./evpkdf":8,"./md5":13}],36:[function(require,module,exports){
    ;(function (root, factory) {
        if (typeof exports === "object") {
            // CommonJS
            module.exports = exports = factory(require("./core"));
        }
        else if (typeof define === "function" && define.amd) {
            // AMD
            define(["./core"], factory);
        }
        else {
            // Global (browser)
            factory(root.CryptoJS);
        }
    }(this, function (CryptoJS) {
    
        (function (undefined) {
            // Shortcuts
            var C = CryptoJS;
            var C_lib = C.lib;
            var Base = C_lib.Base;
            var X32WordArray = C_lib.WordArray;
    
            /**
             * x64 namespace.
             */
            var C_x64 = C.x64 = {};
    
            /**
             * A 64-bit word.
             */
            var X64Word = C_x64.Word = Base.extend({
                /**
                 * Initializes a newly created 64-bit word.
                 *
                 * @param {number} high The high 32 bits.
                 * @param {number} low The low 32 bits.
                 *
                 * @example
                 *
                 *     var x64Word = CryptoJS.x64.Word.create(0x00010203, 0x04050607);
                 */
                init: function (high, low) {
                    this.high = high;
                    this.low = low;
                }
    
                /**
                 * Bitwise NOTs this word.
                 *
                 * @return {X64Word} A new x64-Word object after negating.
                 *
                 * @example
                 *
                 *     var negated = x64Word.not();
                 */
                // not: function () {
                    // var high = ~this.high;
                    // var low = ~this.low;
    
                    // return X64Word.create(high, low);
                // },
    
                /**
                 * Bitwise ANDs this word with the passed word.
                 *
                 * @param {X64Word} word The x64-Word to AND with this word.
                 *
                 * @return {X64Word} A new x64-Word object after ANDing.
                 *
                 * @example
                 *
                 *     var anded = x64Word.and(anotherX64Word);
                 */
                // and: function (word) {
                    // var high = this.high & word.high;
                    // var low = this.low & word.low;
    
                    // return X64Word.create(high, low);
                // },
    
                /**
                 * Bitwise ORs this word with the passed word.
                 *
                 * @param {X64Word} word The x64-Word to OR with this word.
                 *
                 * @return {X64Word} A new x64-Word object after ORing.
                 *
                 * @example
                 *
                 *     var ored = x64Word.or(anotherX64Word);
                 */
                // or: function (word) {
                    // var high = this.high | word.high;
                    // var low = this.low | word.low;
    
                    // return X64Word.create(high, low);
                // },
    
                /**
                 * Bitwise XORs this word with the passed word.
                 *
                 * @param {X64Word} word The x64-Word to XOR with this word.
                 *
                 * @return {X64Word} A new x64-Word object after XORing.
                 *
                 * @example
                 *
                 *     var xored = x64Word.xor(anotherX64Word);
                 */
                // xor: function (word) {
                    // var high = this.high ^ word.high;
                    // var low = this.low ^ word.low;
    
                    // return X64Word.create(high, low);
                // },
    
                /**
                 * Shifts this word n bits to the left.
                 *
                 * @param {number} n The number of bits to shift.
                 *
                 * @return {X64Word} A new x64-Word object after shifting.
                 *
                 * @example
                 *
                 *     var shifted = x64Word.shiftL(25);
                 */
                // shiftL: function (n) {
                    // if (n < 32) {
                        // var high = (this.high << n) | (this.low >>> (32 - n));
                        // var low = this.low << n;
                    // } else {
                        // var high = this.low << (n - 32);
                        // var low = 0;
                    // }
    
                    // return X64Word.create(high, low);
                // },
    
                /**
                 * Shifts this word n bits to the right.
                 *
                 * @param {number} n The number of bits to shift.
                 *
                 * @return {X64Word} A new x64-Word object after shifting.
                 *
                 * @example
                 *
                 *     var shifted = x64Word.shiftR(7);
                 */
                // shiftR: function (n) {
                    // if (n < 32) {
                        // var low = (this.low >>> n) | (this.high << (32 - n));
                        // var high = this.high >>> n;
                    // } else {
                        // var low = this.high >>> (n - 32);
                        // var high = 0;
                    // }
    
                    // return X64Word.create(high, low);
                // },
    
                /**
                 * Rotates this word n bits to the left.
                 *
                 * @param {number} n The number of bits to rotate.
                 *
                 * @return {X64Word} A new x64-Word object after rotating.
                 *
                 * @example
                 *
                 *     var rotated = x64Word.rotL(25);
                 */
                // rotL: function (n) {
                    // return this.shiftL(n).or(this.shiftR(64 - n));
                // },
    
                /**
                 * Rotates this word n bits to the right.
                 *
                 * @param {number} n The number of bits to rotate.
                 *
                 * @return {X64Word} A new x64-Word object after rotating.
                 *
                 * @example
                 *
                 *     var rotated = x64Word.rotR(7);
                 */
                // rotR: function (n) {
                    // return this.shiftR(n).or(this.shiftL(64 - n));
                // },
    
                /**
                 * Adds this word with the passed word.
                 *
                 * @param {X64Word} word The x64-Word to add with this word.
                 *
                 * @return {X64Word} A new x64-Word object after adding.
                 *
                 * @example
                 *
                 *     var added = x64Word.add(anotherX64Word);
                 */
                // add: function (word) {
                    // var low = (this.low + word.low) | 0;
                    // var carry = (low >>> 0) < (this.low >>> 0) ? 1 : 0;
                    // var high = (this.high + word.high + carry) | 0;
    
                    // return X64Word.create(high, low);
                // }
            });
    
            /**
             * An array of 64-bit words.
             *
             * @property {Array} words The array of CryptoJS.x64.Word objects.
             * @property {number} sigBytes The number of significant bytes in this word array.
             */
            var X64WordArray = C_x64.WordArray = Base.extend({
                /**
                 * Initializes a newly created word array.
                 *
                 * @param {Array} words (Optional) An array of CryptoJS.x64.Word objects.
                 * @param {number} sigBytes (Optional) The number of significant bytes in the words.
                 *
                 * @example
                 *
                 *     var wordArray = CryptoJS.x64.WordArray.create();
                 *
                 *     var wordArray = CryptoJS.x64.WordArray.create([
                 *         CryptoJS.x64.Word.create(0x00010203, 0x04050607),
                 *         CryptoJS.x64.Word.create(0x18191a1b, 0x1c1d1e1f)
                 *     ]);
                 *
                 *     var wordArray = CryptoJS.x64.WordArray.create([
                 *         CryptoJS.x64.Word.create(0x00010203, 0x04050607),
                 *         CryptoJS.x64.Word.create(0x18191a1b, 0x1c1d1e1f)
                 *     ], 10);
                 */
                init: function (words, sigBytes) {
                    words = this.words = words || [];
    
                    if (sigBytes != undefined) {
                        this.sigBytes = sigBytes;
                    } else {
                        this.sigBytes = words.length * 8;
                    }
                },
    
                /**
                 * Converts this 64-bit word array to a 32-bit word array.
                 *
                 * @return {CryptoJS.lib.WordArray} This word array's data as a 32-bit word array.
                 *
                 * @example
                 *
                 *     var x32WordArray = x64WordArray.toX32();
                 */
                toX32: function () {
                    // Shortcuts
                    var x64Words = this.words;
                    var x64WordsLength = x64Words.length;
    
                    // Convert
                    var x32Words = [];
                    for (var i = 0; i < x64WordsLength; i++) {
                        var x64Word = x64Words[i];
                        x32Words.push(x64Word.high);
                        x32Words.push(x64Word.low);
                    }
    
                    return X32WordArray.create(x32Words, this.sigBytes);
                },
    
                /**
                 * Creates a copy of this word array.
                 *
                 * @return {X64WordArray} The clone.
                 *
                 * @example
                 *
                 *     var clone = x64WordArray.clone();
                 */
                clone: function () {
                    var clone = Base.clone.call(this);
    
                    // Clone "words" array
                    var words = clone.words = this.words.slice(0);
    
                    // Clone each X64Word object
                    var wordsLength = words.length;
                    for (var i = 0; i < wordsLength; i++) {
                        words[i] = words[i].clone();
                    }
    
                    return clone;
                }
            });
        }());
    
    
        return CryptoJS;
    
    }));
    },{"./core":5}],37:[function(require,module,exports){
    exports.read = function (buffer, offset, isLE, mLen, nBytes) {
      var e, m
      var eLen = nBytes * 8 - mLen - 1
      var eMax = (1 << eLen) - 1
      var eBias = eMax >> 1
      var nBits = -7
      var i = isLE ? (nBytes - 1) : 0
      var d = isLE ? -1 : 1
      var s = buffer[offset + i]
    
      i += d
    
      e = s & ((1 << (-nBits)) - 1)
      s >>= (-nBits)
      nBits += eLen
      for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}
    
      m = e & ((1 << (-nBits)) - 1)
      e >>= (-nBits)
      nBits += mLen
      for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}
    
      if (e === 0) {
        e = 1 - eBias
      } else if (e === eMax) {
        return m ? NaN : ((s ? -1 : 1) * Infinity)
      } else {
        m = m + Math.pow(2, mLen)
        e = e - eBias
      }
      return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
    }
    
    exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
      var e, m, c
      var eLen = nBytes * 8 - mLen - 1
      var eMax = (1 << eLen) - 1
      var eBias = eMax >> 1
      var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
      var i = isLE ? 0 : (nBytes - 1)
      var d = isLE ? 1 : -1
      var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0
    
      value = Math.abs(value)
    
      if (isNaN(value) || value === Infinity) {
        m = isNaN(value) ? 1 : 0
        e = eMax
      } else {
        e = Math.floor(Math.log(value) / Math.LN2)
        if (value * (c = Math.pow(2, -e)) < 1) {
          e--
          c *= 2
        }
        if (e + eBias >= 1) {
          value += rt / c
        } else {
          value += rt * Math.pow(2, 1 - eBias)
        }
        if (value * c >= 2) {
          e++
          c /= 2
        }
    
        if (e + eBias >= eMax) {
          m = 0
          e = eMax
        } else if (e + eBias >= 1) {
          m = (value * c - 1) * Math.pow(2, mLen)
          e = e + eBias
        } else {
          m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
          e = 0
        }
      }
    
      for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}
    
      e = (e << mLen) | m
      eLen += mLen
      for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}
    
      buffer[offset + i - d] |= s * 128
    }
    
    },{}],38:[function(require,module,exports){
    
    /**
     * isArray
     */
    
    var isArray = Array.isArray;
    
    /**
     * toString
     */
    
    var str = Object.prototype.toString;
    
    /**
     * Whether or not the given `val`
     * is an array.
     *
     * example:
     *
     *        isArray([]);
     *        // > true
     *        isArray(arguments);
     *        // > false
     *        isArray('');
     *        // > false
     *
     * @param {mixed} val
     * @return {bool}
     */
    
    module.exports = isArray || function (val) {
      return !! val && '[object Array]' == str.call(val);
    };
    
    },{}],39:[function(require,module,exports){
    (function (Buffer){
    
    var navigator = {};
    navigator.userAgent = false;
    
    var window = {};
    /*
     * jsrsasign(all) 8.0.3 (2017-07-11) (c) 2010-2017 Kenji Urushima | kjur.github.com/jsrsasign/license
     */
    
    /*!
    Copyright (c) 2011, Yahoo! Inc. All rights reserved.
    Code licensed under the BSD License:
    http://developer.yahoo.com/yui/license.html
    version: 2.9.0
    */
    if(YAHOO===undefined){var YAHOO={}}YAHOO.lang={extend:function(g,h,f){if(!h||!g){throw new Error("YAHOO.lang.extend failed, please check that all dependencies are included.")}var d=function(){};d.prototype=h.prototype;g.prototype=new d();g.prototype.constructor=g;g.superclass=h.prototype;if(h.prototype.constructor==Object.prototype.constructor){h.prototype.constructor=h}if(f){var b;for(b in f){g.prototype[b]=f[b]}var e=function(){},c=["toString","valueOf"];try{if(/MSIE/.test(navigator.userAgent)){e=function(j,i){for(b=0;b<c.length;b=b+1){var l=c[b],k=i[l];if(typeof k==="function"&&k!=Object.prototype[l]){j[l]=k}}}}}catch(a){}e(g.prototype,f)}}};
    
    /*! CryptoJS v3.1.2 core-fix.js
     * code.google.com/p/crypto-js
     * (c) 2009-2013 by Jeff Mott. All rights reserved.
     * code.google.com/p/crypto-js/wiki/License
     * THIS IS FIX of 'core.js' to fix Hmac issue.
     * https://code.google.com/p/crypto-js/issues/detail?id=84
     * https://crypto-js.googlecode.com/svn-history/r667/branches/3.x/src/core.js
     */
    var CryptoJS=CryptoJS||(function(e,g){var a={};var b=a.lib={};var j=b.Base=(function(){function n(){}return{extend:function(p){n.prototype=this;var o=new n();if(p){o.mixIn(p)}if(!o.hasOwnProperty("init")){o.init=function(){o.$super.init.apply(this,arguments)}}o.init.prototype=o;o.$super=this;return o},create:function(){var o=this.extend();o.init.apply(o,arguments);return o},init:function(){},mixIn:function(p){for(var o in p){if(p.hasOwnProperty(o)){this[o]=p[o]}}if(p.hasOwnProperty("toString")){this.toString=p.toString}},clone:function(){return this.init.prototype.extend(this)}}}());var l=b.WordArray=j.extend({init:function(o,n){o=this.words=o||[];if(n!=g){this.sigBytes=n}else{this.sigBytes=o.length*4}},toString:function(n){return(n||h).stringify(this)},concat:function(t){var q=this.words;var p=t.words;var n=this.sigBytes;var s=t.sigBytes;this.clamp();if(n%4){for(var r=0;r<s;r++){var o=(p[r>>>2]>>>(24-(r%4)*8))&255;q[(n+r)>>>2]|=o<<(24-((n+r)%4)*8)}}else{for(var r=0;r<s;r+=4){q[(n+r)>>>2]=p[r>>>2]}}this.sigBytes+=s;return this},clamp:function(){var o=this.words;var n=this.sigBytes;o[n>>>2]&=4294967295<<(32-(n%4)*8);o.length=e.ceil(n/4)},clone:function(){var n=j.clone.call(this);n.words=this.words.slice(0);return n},random:function(p){var o=[];for(var n=0;n<p;n+=4){o.push((e.random()*4294967296)|0)}return new l.init(o,p)}});var m=a.enc={};var h=m.Hex={stringify:function(p){var r=p.words;var o=p.sigBytes;var q=[];for(var n=0;n<o;n++){var s=(r[n>>>2]>>>(24-(n%4)*8))&255;q.push((s>>>4).toString(16));q.push((s&15).toString(16))}return q.join("")},parse:function(p){var n=p.length;var q=[];for(var o=0;o<n;o+=2){q[o>>>3]|=parseInt(p.substr(o,2),16)<<(24-(o%8)*4)}return new l.init(q,n/2)}};var d=m.Latin1={stringify:function(q){var r=q.words;var p=q.sigBytes;var n=[];for(var o=0;o<p;o++){var s=(r[o>>>2]>>>(24-(o%4)*8))&255;n.push(String.fromCharCode(s))}return n.join("")},parse:function(p){var n=p.length;var q=[];for(var o=0;o<n;o++){q[o>>>2]|=(p.charCodeAt(o)&255)<<(24-(o%4)*8)}return new l.init(q,n)}};var c=m.Utf8={stringify:function(n){try{return decodeURIComponent(escape(d.stringify(n)))}catch(o){throw new Error("Malformed UTF-8 data")}},parse:function(n){return d.parse(unescape(encodeURIComponent(n)))}};var i=b.BufferedBlockAlgorithm=j.extend({reset:function(){this._data=new l.init();this._nDataBytes=0},_append:function(n){if(typeof n=="string"){n=c.parse(n)}this._data.concat(n);this._nDataBytes+=n.sigBytes},_process:function(w){var q=this._data;var x=q.words;var n=q.sigBytes;var t=this.blockSize;var v=t*4;var u=n/v;if(w){u=e.ceil(u)}else{u=e.max((u|0)-this._minBufferSize,0)}var s=u*t;var r=e.min(s*4,n);if(s){for(var p=0;p<s;p+=t){this._doProcessBlock(x,p)}var o=x.splice(0,s);q.sigBytes-=r}return new l.init(o,r)},clone:function(){var n=j.clone.call(this);n._data=this._data.clone();return n},_minBufferSize:0});var f=b.Hasher=i.extend({cfg:j.extend(),init:function(n){this.cfg=this.cfg.extend(n);this.reset()},reset:function(){i.reset.call(this);this._doReset()},update:function(n){this._append(n);this._process();return this},finalize:function(n){if(n){this._append(n)}var o=this._doFinalize();return o},blockSize:512/32,_createHelper:function(n){return function(p,o){return new n.init(o).finalize(p)}},_createHmacHelper:function(n){return function(p,o){return new k.HMAC.init(n,o).finalize(p)}}});var k=a.algo={};return a}(Math));
    /*
    CryptoJS v3.1.2 x64-core-min.js
    code.google.com/p/crypto-js
    (c) 2009-2013 by Jeff Mott. All rights reserved.
    code.google.com/p/crypto-js/wiki/License
    */
    (function(g){var a=CryptoJS,f=a.lib,e=f.Base,h=f.WordArray,a=a.x64={};a.Word=e.extend({init:function(b,c){this.high=b;this.low=c}});a.WordArray=e.extend({init:function(b,c){b=this.words=b||[];this.sigBytes=c!=g?c:8*b.length},toX32:function(){for(var b=this.words,c=b.length,a=[],d=0;d<c;d++){var e=b[d];a.push(e.high);a.push(e.low)}return h.create(a,this.sigBytes)},clone:function(){for(var b=e.clone.call(this),c=b.words=this.words.slice(0),a=c.length,d=0;d<a;d++)c[d]=c[d].clone();return b}})})();
    
    /*
    CryptoJS v3.1.2 cipher-core.js
    code.google.com/p/crypto-js
    (c) 2009-2013 by Jeff Mott. All rights reserved.
    code.google.com/p/crypto-js/wiki/License
    */
    CryptoJS.lib.Cipher||function(u){var g=CryptoJS,f=g.lib,k=f.Base,l=f.WordArray,q=f.BufferedBlockAlgorithm,r=g.enc.Base64,v=g.algo.EvpKDF,n=f.Cipher=q.extend({cfg:k.extend(),createEncryptor:function(a,b){return this.create(this._ENC_XFORM_MODE,a,b)},createDecryptor:function(a,b){return this.create(this._DEC_XFORM_MODE,a,b)},init:function(a,b,c){this.cfg=this.cfg.extend(c);this._xformMode=a;this._key=b;this.reset()},reset:function(){q.reset.call(this);this._doReset()},process:function(a){this._append(a);
    return this._process()},finalize:function(a){a&&this._append(a);return this._doFinalize()},keySize:4,ivSize:4,_ENC_XFORM_MODE:1,_DEC_XFORM_MODE:2,_createHelper:function(a){return{encrypt:function(b,c,d){return("string"==typeof c?s:j).encrypt(a,b,c,d)},decrypt:function(b,c,d){return("string"==typeof c?s:j).decrypt(a,b,c,d)}}}});f.StreamCipher=n.extend({_doFinalize:function(){return this._process(!0)},blockSize:1});var m=g.mode={},t=function(a,b,c){var d=this._iv;d?this._iv=u:d=this._prevBlock;for(var e=
    0;e<c;e++)a[b+e]^=d[e]},h=(f.BlockCipherMode=k.extend({createEncryptor:function(a,b){return this.Encryptor.create(a,b)},createDecryptor:function(a,b){return this.Decryptor.create(a,b)},init:function(a,b){this._cipher=a;this._iv=b}})).extend();h.Encryptor=h.extend({processBlock:function(a,b){var c=this._cipher,d=c.blockSize;t.call(this,a,b,d);c.encryptBlock(a,b);this._prevBlock=a.slice(b,b+d)}});h.Decryptor=h.extend({processBlock:function(a,b){var c=this._cipher,d=c.blockSize,e=a.slice(b,b+d);c.decryptBlock(a,
    b);t.call(this,a,b,d);this._prevBlock=e}});m=m.CBC=h;h=(g.pad={}).Pkcs7={pad:function(a,b){for(var c=4*b,c=c-a.sigBytes%c,d=c<<24|c<<16|c<<8|c,e=[],f=0;f<c;f+=4)e.push(d);c=l.create(e,c);a.concat(c)},unpad:function(a){a.sigBytes-=a.words[a.sigBytes-1>>>2]&255}};f.BlockCipher=n.extend({cfg:n.cfg.extend({mode:m,padding:h}),reset:function(){n.reset.call(this);var a=this.cfg,b=a.iv,a=a.mode;if(this._xformMode==this._ENC_XFORM_MODE)var c=a.createEncryptor;else c=a.createDecryptor,this._minBufferSize=1;
    this._mode=c.call(a,this,b&&b.words)},_doProcessBlock:function(a,b){this._mode.processBlock(a,b)},_doFinalize:function(){var a=this.cfg.padding;if(this._xformMode==this._ENC_XFORM_MODE){a.pad(this._data,this.blockSize);var b=this._process(!0)}else b=this._process(!0),a.unpad(b);return b},blockSize:4});var p=f.CipherParams=k.extend({init:function(a){this.mixIn(a)},toString:function(a){return(a||this.formatter).stringify(this)}}),m=(g.format={}).OpenSSL={stringify:function(a){var b=a.ciphertext;a=a.salt;
    return(a?l.create([1398893684,1701076831]).concat(a).concat(b):b).toString(r)},parse:function(a){a=r.parse(a);var b=a.words;if(1398893684==b[0]&&1701076831==b[1]){var c=l.create(b.slice(2,4));b.splice(0,4);a.sigBytes-=16}return p.create({ciphertext:a,salt:c})}},j=f.SerializableCipher=k.extend({cfg:k.extend({format:m}),encrypt:function(a,b,c,d){d=this.cfg.extend(d);var e=a.createEncryptor(c,d);b=e.finalize(b);e=e.cfg;return p.create({ciphertext:b,key:c,iv:e.iv,algorithm:a,mode:e.mode,padding:e.padding,
    blockSize:a.blockSize,formatter:d.format})},decrypt:function(a,b,c,d){d=this.cfg.extend(d);b=this._parse(b,d.format);return a.createDecryptor(c,d).finalize(b.ciphertext)},_parse:function(a,b){return"string"==typeof a?b.parse(a,this):a}}),g=(g.kdf={}).OpenSSL={execute:function(a,b,c,d){d||(d=l.random(8));a=v.create({keySize:b+c}).compute(a,d);c=l.create(a.words.slice(b),4*c);a.sigBytes=4*b;return p.create({key:a,iv:c,salt:d})}},s=f.PasswordBasedCipher=j.extend({cfg:j.cfg.extend({kdf:g}),encrypt:function(a,
    b,c,d){d=this.cfg.extend(d);c=d.kdf.execute(c,a.keySize,a.ivSize);d.iv=c.iv;a=j.encrypt.call(this,a,b,c.key,d);a.mixIn(c);return a},decrypt:function(a,b,c,d){d=this.cfg.extend(d);b=this._parse(b,d.format);c=d.kdf.execute(c,a.keySize,a.ivSize,b.salt);d.iv=c.iv;return j.decrypt.call(this,a,b,c.key,d)}})}();
    
    /*
    CryptoJS v3.1.2 aes.js
    code.google.com/p/crypto-js
    (c) 2009-2013 by Jeff Mott. All rights reserved.
    code.google.com/p/crypto-js/wiki/License
    */
    (function(){for(var q=CryptoJS,x=q.lib.BlockCipher,r=q.algo,j=[],y=[],z=[],A=[],B=[],C=[],s=[],u=[],v=[],w=[],g=[],k=0;256>k;k++)g[k]=128>k?k<<1:k<<1^283;for(var n=0,l=0,k=0;256>k;k++){var f=l^l<<1^l<<2^l<<3^l<<4,f=f>>>8^f&255^99;j[n]=f;y[f]=n;var t=g[n],D=g[t],E=g[D],b=257*g[f]^16843008*f;z[n]=b<<24|b>>>8;A[n]=b<<16|b>>>16;B[n]=b<<8|b>>>24;C[n]=b;b=16843009*E^65537*D^257*t^16843008*n;s[f]=b<<24|b>>>8;u[f]=b<<16|b>>>16;v[f]=b<<8|b>>>24;w[f]=b;n?(n=t^g[g[g[E^t]]],l^=g[g[l]]):n=l=1}var F=[0,1,2,4,8,
    16,32,64,128,27,54],r=r.AES=x.extend({_doReset:function(){for(var c=this._key,e=c.words,a=c.sigBytes/4,c=4*((this._nRounds=a+6)+1),b=this._keySchedule=[],h=0;h<c;h++)if(h<a)b[h]=e[h];else{var d=b[h-1];h%a?6<a&&4==h%a&&(d=j[d>>>24]<<24|j[d>>>16&255]<<16|j[d>>>8&255]<<8|j[d&255]):(d=d<<8|d>>>24,d=j[d>>>24]<<24|j[d>>>16&255]<<16|j[d>>>8&255]<<8|j[d&255],d^=F[h/a|0]<<24);b[h]=b[h-a]^d}e=this._invKeySchedule=[];for(a=0;a<c;a++)h=c-a,d=a%4?b[h]:b[h-4],e[a]=4>a||4>=h?d:s[j[d>>>24]]^u[j[d>>>16&255]]^v[j[d>>>
    8&255]]^w[j[d&255]]},encryptBlock:function(c,e){this._doCryptBlock(c,e,this._keySchedule,z,A,B,C,j)},decryptBlock:function(c,e){var a=c[e+1];c[e+1]=c[e+3];c[e+3]=a;this._doCryptBlock(c,e,this._invKeySchedule,s,u,v,w,y);a=c[e+1];c[e+1]=c[e+3];c[e+3]=a},_doCryptBlock:function(c,e,a,b,h,d,j,m){for(var n=this._nRounds,f=c[e]^a[0],g=c[e+1]^a[1],k=c[e+2]^a[2],p=c[e+3]^a[3],l=4,t=1;t<n;t++)var q=b[f>>>24]^h[g>>>16&255]^d[k>>>8&255]^j[p&255]^a[l++],r=b[g>>>24]^h[k>>>16&255]^d[p>>>8&255]^j[f&255]^a[l++],s=
    b[k>>>24]^h[p>>>16&255]^d[f>>>8&255]^j[g&255]^a[l++],p=b[p>>>24]^h[f>>>16&255]^d[g>>>8&255]^j[k&255]^a[l++],f=q,g=r,k=s;q=(m[f>>>24]<<24|m[g>>>16&255]<<16|m[k>>>8&255]<<8|m[p&255])^a[l++];r=(m[g>>>24]<<24|m[k>>>16&255]<<16|m[p>>>8&255]<<8|m[f&255])^a[l++];s=(m[k>>>24]<<24|m[p>>>16&255]<<16|m[f>>>8&255]<<8|m[g&255])^a[l++];p=(m[p>>>24]<<24|m[f>>>16&255]<<16|m[g>>>8&255]<<8|m[k&255])^a[l++];c[e]=q;c[e+1]=r;c[e+2]=s;c[e+3]=p},keySize:8});q.AES=x._createHelper(r)})();
    
    /*
    CryptoJS v3.1.2 tripledes-min.js
    code.google.com/p/crypto-js
    (c) 2009-2013 by Jeff Mott. All rights reserved.
    code.google.com/p/crypto-js/wiki/License
    */
    (function(){function j(b,c){var a=(this._lBlock>>>b^this._rBlock)&c;this._rBlock^=a;this._lBlock^=a<<b}function l(b,c){var a=(this._rBlock>>>b^this._lBlock)&c;this._lBlock^=a;this._rBlock^=a<<b}var h=CryptoJS,e=h.lib,n=e.WordArray,e=e.BlockCipher,g=h.algo,q=[57,49,41,33,25,17,9,1,58,50,42,34,26,18,10,2,59,51,43,35,27,19,11,3,60,52,44,36,63,55,47,39,31,23,15,7,62,54,46,38,30,22,14,6,61,53,45,37,29,21,13,5,28,20,12,4],p=[14,17,11,24,1,5,3,28,15,6,21,10,23,19,12,4,26,8,16,7,27,20,13,2,41,52,31,37,47,
    55,30,40,51,45,33,48,44,49,39,56,34,53,46,42,50,36,29,32],r=[1,2,4,6,8,10,12,14,15,17,19,21,23,25,27,28],s=[{"0":8421888,268435456:32768,536870912:8421378,805306368:2,1073741824:512,1342177280:8421890,1610612736:8389122,1879048192:8388608,2147483648:514,2415919104:8389120,2684354560:33280,2952790016:8421376,3221225472:32770,3489660928:8388610,3758096384:0,4026531840:33282,134217728:0,402653184:8421890,671088640:33282,939524096:32768,1207959552:8421888,1476395008:512,1744830464:8421378,2013265920:2,
    2281701376:8389120,2550136832:33280,2818572288:8421376,3087007744:8389122,3355443200:8388610,3623878656:32770,3892314112:514,4160749568:8388608,1:32768,268435457:2,536870913:8421888,805306369:8388608,1073741825:8421378,1342177281:33280,1610612737:512,1879048193:8389122,2147483649:8421890,2415919105:8421376,2684354561:8388610,2952790017:33282,3221225473:514,3489660929:8389120,3758096385:32770,4026531841:0,134217729:8421890,402653185:8421376,671088641:8388608,939524097:512,1207959553:32768,1476395009:8388610,
    1744830465:2,2013265921:33282,2281701377:32770,2550136833:8389122,2818572289:514,3087007745:8421888,3355443201:8389120,3623878657:0,3892314113:33280,4160749569:8421378},{"0":1074282512,16777216:16384,33554432:524288,50331648:1074266128,67108864:1073741840,83886080:1074282496,100663296:1073758208,117440512:16,134217728:540672,150994944:1073758224,167772160:1073741824,184549376:540688,201326592:524304,218103808:0,234881024:16400,251658240:1074266112,8388608:1073758208,25165824:540688,41943040:16,58720256:1073758224,
    75497472:1074282512,92274688:1073741824,109051904:524288,125829120:1074266128,142606336:524304,159383552:0,176160768:16384,192937984:1074266112,209715200:1073741840,226492416:540672,243269632:1074282496,260046848:16400,268435456:0,285212672:1074266128,301989888:1073758224,318767104:1074282496,335544320:1074266112,352321536:16,369098752:540688,385875968:16384,402653184:16400,419430400:524288,436207616:524304,452984832:1073741840,469762048:540672,486539264:1073758208,503316480:1073741824,520093696:1074282512,
    276824064:540688,293601280:524288,310378496:1074266112,327155712:16384,343932928:1073758208,360710144:1074282512,377487360:16,394264576:1073741824,411041792:1074282496,427819008:1073741840,444596224:1073758224,461373440:524304,478150656:0,494927872:16400,511705088:1074266128,528482304:540672},{"0":260,1048576:0,2097152:67109120,3145728:65796,4194304:65540,5242880:67108868,6291456:67174660,7340032:67174400,8388608:67108864,9437184:67174656,10485760:65792,11534336:67174404,12582912:67109124,13631488:65536,
    14680064:4,15728640:256,524288:67174656,1572864:67174404,2621440:0,3670016:67109120,4718592:67108868,5767168:65536,6815744:65540,7864320:260,8912896:4,9961472:256,11010048:67174400,12058624:65796,13107200:65792,14155776:67109124,15204352:67174660,16252928:67108864,16777216:67174656,17825792:65540,18874368:65536,19922944:67109120,20971520:256,22020096:67174660,23068672:67108868,24117248:0,25165824:67109124,26214400:67108864,27262976:4,28311552:65792,29360128:67174400,30408704:260,31457280:65796,32505856:67174404,
    17301504:67108864,18350080:260,19398656:67174656,20447232:0,21495808:65540,22544384:67109120,23592960:256,24641536:67174404,25690112:65536,26738688:67174660,27787264:65796,28835840:67108868,29884416:67109124,30932992:67174400,31981568:4,33030144:65792},{"0":2151682048,65536:2147487808,131072:4198464,196608:2151677952,262144:0,327680:4198400,393216:2147483712,458752:4194368,524288:2147483648,589824:4194304,655360:64,720896:2147487744,786432:2151678016,851968:4160,917504:4096,983040:2151682112,32768:2147487808,
    98304:64,163840:2151678016,229376:2147487744,294912:4198400,360448:2151682112,425984:0,491520:2151677952,557056:4096,622592:2151682048,688128:4194304,753664:4160,819200:2147483648,884736:4194368,950272:4198464,1015808:2147483712,1048576:4194368,1114112:4198400,1179648:2147483712,1245184:0,1310720:4160,1376256:2151678016,1441792:2151682048,1507328:2147487808,1572864:2151682112,1638400:2147483648,1703936:2151677952,1769472:4198464,1835008:2147487744,1900544:4194304,1966080:64,2031616:4096,1081344:2151677952,
    1146880:2151682112,1212416:0,1277952:4198400,1343488:4194368,1409024:2147483648,1474560:2147487808,1540096:64,1605632:2147483712,1671168:4096,1736704:2147487744,1802240:2151678016,1867776:4160,1933312:2151682048,1998848:4194304,2064384:4198464},{"0":128,4096:17039360,8192:262144,12288:536870912,16384:537133184,20480:16777344,24576:553648256,28672:262272,32768:16777216,36864:537133056,40960:536871040,45056:553910400,49152:553910272,53248:0,57344:17039488,61440:553648128,2048:17039488,6144:553648256,
    10240:128,14336:17039360,18432:262144,22528:537133184,26624:553910272,30720:536870912,34816:537133056,38912:0,43008:553910400,47104:16777344,51200:536871040,55296:553648128,59392:16777216,63488:262272,65536:262144,69632:128,73728:536870912,77824:553648256,81920:16777344,86016:553910272,90112:537133184,94208:16777216,98304:553910400,102400:553648128,106496:17039360,110592:537133056,114688:262272,118784:536871040,122880:0,126976:17039488,67584:553648256,71680:16777216,75776:17039360,79872:537133184,
    83968:536870912,88064:17039488,92160:128,96256:553910272,100352:262272,104448:553910400,108544:0,112640:553648128,116736:16777344,120832:262144,124928:537133056,129024:536871040},{"0":268435464,256:8192,512:270532608,768:270540808,1024:268443648,1280:2097152,1536:2097160,1792:268435456,2048:0,2304:268443656,2560:2105344,2816:8,3072:270532616,3328:2105352,3584:8200,3840:270540800,128:270532608,384:270540808,640:8,896:2097152,1152:2105352,1408:268435464,1664:268443648,1920:8200,2176:2097160,2432:8192,
    2688:268443656,2944:270532616,3200:0,3456:270540800,3712:2105344,3968:268435456,4096:268443648,4352:270532616,4608:270540808,4864:8200,5120:2097152,5376:268435456,5632:268435464,5888:2105344,6144:2105352,6400:0,6656:8,6912:270532608,7168:8192,7424:268443656,7680:270540800,7936:2097160,4224:8,4480:2105344,4736:2097152,4992:268435464,5248:268443648,5504:8200,5760:270540808,6016:270532608,6272:270540800,6528:270532616,6784:8192,7040:2105352,7296:2097160,7552:0,7808:268435456,8064:268443656},{"0":1048576,
    16:33555457,32:1024,48:1049601,64:34604033,80:0,96:1,112:34603009,128:33555456,144:1048577,160:33554433,176:34604032,192:34603008,208:1025,224:1049600,240:33554432,8:34603009,24:0,40:33555457,56:34604032,72:1048576,88:33554433,104:33554432,120:1025,136:1049601,152:33555456,168:34603008,184:1048577,200:1024,216:34604033,232:1,248:1049600,256:33554432,272:1048576,288:33555457,304:34603009,320:1048577,336:33555456,352:34604032,368:1049601,384:1025,400:34604033,416:1049600,432:1,448:0,464:34603008,480:33554433,
    496:1024,264:1049600,280:33555457,296:34603009,312:1,328:33554432,344:1048576,360:1025,376:34604032,392:33554433,408:34603008,424:0,440:34604033,456:1049601,472:1024,488:33555456,504:1048577},{"0":134219808,1:131072,2:134217728,3:32,4:131104,5:134350880,6:134350848,7:2048,8:134348800,9:134219776,10:133120,11:134348832,12:2080,13:0,14:134217760,15:133152,2147483648:2048,2147483649:134350880,2147483650:134219808,2147483651:134217728,2147483652:134348800,2147483653:133120,2147483654:133152,2147483655:32,
    2147483656:134217760,2147483657:2080,2147483658:131104,2147483659:134350848,2147483660:0,2147483661:134348832,2147483662:134219776,2147483663:131072,16:133152,17:134350848,18:32,19:2048,20:134219776,21:134217760,22:134348832,23:131072,24:0,25:131104,26:134348800,27:134219808,28:134350880,29:133120,30:2080,31:134217728,2147483664:131072,2147483665:2048,2147483666:134348832,2147483667:133152,2147483668:32,2147483669:134348800,2147483670:134217728,2147483671:134219808,2147483672:134350880,2147483673:134217760,
    2147483674:134219776,2147483675:0,2147483676:133120,2147483677:2080,2147483678:131104,2147483679:134350848}],t=[4160749569,528482304,33030144,2064384,129024,8064,504,2147483679],m=g.DES=e.extend({_doReset:function(){for(var b=this._key.words,c=[],a=0;56>a;a++){var f=q[a]-1;c[a]=b[f>>>5]>>>31-f%32&1}b=this._subKeys=[];for(f=0;16>f;f++){for(var d=b[f]=[],e=r[f],a=0;24>a;a++)d[a/6|0]|=c[(p[a]-1+e)%28]<<31-a%6,d[4+(a/6|0)]|=c[28+(p[a+24]-1+e)%28]<<31-a%6;d[0]=d[0]<<1|d[0]>>>31;for(a=1;7>a;a++)d[a]>>>=
    4*(a-1)+3;d[7]=d[7]<<5|d[7]>>>27}c=this._invSubKeys=[];for(a=0;16>a;a++)c[a]=b[15-a]},encryptBlock:function(b,c){this._doCryptBlock(b,c,this._subKeys)},decryptBlock:function(b,c){this._doCryptBlock(b,c,this._invSubKeys)},_doCryptBlock:function(b,c,a){this._lBlock=b[c];this._rBlock=b[c+1];j.call(this,4,252645135);j.call(this,16,65535);l.call(this,2,858993459);l.call(this,8,16711935);j.call(this,1,1431655765);for(var f=0;16>f;f++){for(var d=a[f],e=this._lBlock,h=this._rBlock,g=0,k=0;8>k;k++)g|=s[k][((h^
    d[k])&t[k])>>>0];this._lBlock=h;this._rBlock=e^g}a=this._lBlock;this._lBlock=this._rBlock;this._rBlock=a;j.call(this,1,1431655765);l.call(this,8,16711935);l.call(this,2,858993459);j.call(this,16,65535);j.call(this,4,252645135);b[c]=this._lBlock;b[c+1]=this._rBlock},keySize:2,ivSize:2,blockSize:2});h.DES=e._createHelper(m);g=g.TripleDES=e.extend({_doReset:function(){var b=this._key.words;this._des1=m.createEncryptor(n.create(b.slice(0,2)));this._des2=m.createEncryptor(n.create(b.slice(2,4)));this._des3=
    m.createEncryptor(n.create(b.slice(4,6)))},encryptBlock:function(b,c){this._des1.encryptBlock(b,c);this._des2.decryptBlock(b,c);this._des3.encryptBlock(b,c)},decryptBlock:function(b,c){this._des3.decryptBlock(b,c);this._des2.encryptBlock(b,c);this._des1.decryptBlock(b,c)},keySize:6,ivSize:2,blockSize:2});h.TripleDES=e._createHelper(g)})();
    
    /*
    CryptoJS v3.1.2 enc-base64.js
    code.google.com/p/crypto-js
    (c) 2009-2013 by Jeff Mott. All rights reserved.
    code.google.com/p/crypto-js/wiki/License
    */
    (function(){var h=CryptoJS,j=h.lib.WordArray;h.enc.Base64={stringify:function(b){var e=b.words,f=b.sigBytes,c=this._map;b.clamp();b=[];for(var a=0;a<f;a+=3)for(var d=(e[a>>>2]>>>24-8*(a%4)&255)<<16|(e[a+1>>>2]>>>24-8*((a+1)%4)&255)<<8|e[a+2>>>2]>>>24-8*((a+2)%4)&255,g=0;4>g&&a+0.75*g<f;g++)b.push(c.charAt(d>>>6*(3-g)&63));if(e=c.charAt(64))for(;b.length%4;)b.push(e);return b.join("")},parse:function(b){var e=b.length,f=this._map,c=f.charAt(64);c&&(c=b.indexOf(c),-1!=c&&(e=c));for(var c=[],a=0,d=0;d<
    e;d++)if(d%4){var g=f.indexOf(b.charAt(d-1))<<2*(d%4),h=f.indexOf(b.charAt(d))>>>6-2*(d%4);c[a>>>2]|=(g|h)<<24-8*(a%4);a++}return j.create(c,a)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="}})();
    
    /*
    CryptoJS v3.1.2 md5.js
    code.google.com/p/crypto-js
    (c) 2009-2013 by Jeff Mott. All rights reserved.
    code.google.com/p/crypto-js/wiki/License
    */
    (function(E){function h(a,f,g,j,p,h,k){a=a+(f&g|~f&j)+p+k;return(a<<h|a>>>32-h)+f}function k(a,f,g,j,p,h,k){a=a+(f&j|g&~j)+p+k;return(a<<h|a>>>32-h)+f}function l(a,f,g,j,h,k,l){a=a+(f^g^j)+h+l;return(a<<k|a>>>32-k)+f}function n(a,f,g,j,h,k,l){a=a+(g^(f|~j))+h+l;return(a<<k|a>>>32-k)+f}for(var r=CryptoJS,q=r.lib,F=q.WordArray,s=q.Hasher,q=r.algo,a=[],t=0;64>t;t++)a[t]=4294967296*E.abs(E.sin(t+1))|0;q=q.MD5=s.extend({_doReset:function(){this._hash=new F.init([1732584193,4023233417,2562383102,271733878])},
    _doProcessBlock:function(m,f){for(var g=0;16>g;g++){var j=f+g,p=m[j];m[j]=(p<<8|p>>>24)&16711935|(p<<24|p>>>8)&4278255360}var g=this._hash.words,j=m[f+0],p=m[f+1],q=m[f+2],r=m[f+3],s=m[f+4],t=m[f+5],u=m[f+6],v=m[f+7],w=m[f+8],x=m[f+9],y=m[f+10],z=m[f+11],A=m[f+12],B=m[f+13],C=m[f+14],D=m[f+15],b=g[0],c=g[1],d=g[2],e=g[3],b=h(b,c,d,e,j,7,a[0]),e=h(e,b,c,d,p,12,a[1]),d=h(d,e,b,c,q,17,a[2]),c=h(c,d,e,b,r,22,a[3]),b=h(b,c,d,e,s,7,a[4]),e=h(e,b,c,d,t,12,a[5]),d=h(d,e,b,c,u,17,a[6]),c=h(c,d,e,b,v,22,a[7]),
    b=h(b,c,d,e,w,7,a[8]),e=h(e,b,c,d,x,12,a[9]),d=h(d,e,b,c,y,17,a[10]),c=h(c,d,e,b,z,22,a[11]),b=h(b,c,d,e,A,7,a[12]),e=h(e,b,c,d,B,12,a[13]),d=h(d,e,b,c,C,17,a[14]),c=h(c,d,e,b,D,22,a[15]),b=k(b,c,d,e,p,5,a[16]),e=k(e,b,c,d,u,9,a[17]),d=k(d,e,b,c,z,14,a[18]),c=k(c,d,e,b,j,20,a[19]),b=k(b,c,d,e,t,5,a[20]),e=k(e,b,c,d,y,9,a[21]),d=k(d,e,b,c,D,14,a[22]),c=k(c,d,e,b,s,20,a[23]),b=k(b,c,d,e,x,5,a[24]),e=k(e,b,c,d,C,9,a[25]),d=k(d,e,b,c,r,14,a[26]),c=k(c,d,e,b,w,20,a[27]),b=k(b,c,d,e,B,5,a[28]),e=k(e,b,
    c,d,q,9,a[29]),d=k(d,e,b,c,v,14,a[30]),c=k(c,d,e,b,A,20,a[31]),b=l(b,c,d,e,t,4,a[32]),e=l(e,b,c,d,w,11,a[33]),d=l(d,e,b,c,z,16,a[34]),c=l(c,d,e,b,C,23,a[35]),b=l(b,c,d,e,p,4,a[36]),e=l(e,b,c,d,s,11,a[37]),d=l(d,e,b,c,v,16,a[38]),c=l(c,d,e,b,y,23,a[39]),b=l(b,c,d,e,B,4,a[40]),e=l(e,b,c,d,j,11,a[41]),d=l(d,e,b,c,r,16,a[42]),c=l(c,d,e,b,u,23,a[43]),b=l(b,c,d,e,x,4,a[44]),e=l(e,b,c,d,A,11,a[45]),d=l(d,e,b,c,D,16,a[46]),c=l(c,d,e,b,q,23,a[47]),b=n(b,c,d,e,j,6,a[48]),e=n(e,b,c,d,v,10,a[49]),d=n(d,e,b,c,
    C,15,a[50]),c=n(c,d,e,b,t,21,a[51]),b=n(b,c,d,e,A,6,a[52]),e=n(e,b,c,d,r,10,a[53]),d=n(d,e,b,c,y,15,a[54]),c=n(c,d,e,b,p,21,a[55]),b=n(b,c,d,e,w,6,a[56]),e=n(e,b,c,d,D,10,a[57]),d=n(d,e,b,c,u,15,a[58]),c=n(c,d,e,b,B,21,a[59]),b=n(b,c,d,e,s,6,a[60]),e=n(e,b,c,d,z,10,a[61]),d=n(d,e,b,c,q,15,a[62]),c=n(c,d,e,b,x,21,a[63]);g[0]=g[0]+b|0;g[1]=g[1]+c|0;g[2]=g[2]+d|0;g[3]=g[3]+e|0},_doFinalize:function(){var a=this._data,f=a.words,g=8*this._nDataBytes,j=8*a.sigBytes;f[j>>>5]|=128<<24-j%32;var h=E.floor(g/
    4294967296);f[(j+64>>>9<<4)+15]=(h<<8|h>>>24)&16711935|(h<<24|h>>>8)&4278255360;f[(j+64>>>9<<4)+14]=(g<<8|g>>>24)&16711935|(g<<24|g>>>8)&4278255360;a.sigBytes=4*(f.length+1);this._process();a=this._hash;f=a.words;for(g=0;4>g;g++)j=f[g],f[g]=(j<<8|j>>>24)&16711935|(j<<24|j>>>8)&4278255360;return a},clone:function(){var a=s.clone.call(this);a._hash=this._hash.clone();return a}});r.MD5=s._createHelper(q);r.HmacMD5=s._createHmacHelper(q)})(Math);
    
    /*
    CryptoJS v3.1.2 sha1-min.js
    code.google.com/p/crypto-js
    (c) 2009-2013 by Jeff Mott. All rights reserved.
    code.google.com/p/crypto-js/wiki/License
    */
    (function(){var k=CryptoJS,b=k.lib,m=b.WordArray,l=b.Hasher,d=[],b=k.algo.SHA1=l.extend({_doReset:function(){this._hash=new m.init([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(n,p){for(var a=this._hash.words,e=a[0],f=a[1],h=a[2],j=a[3],b=a[4],c=0;80>c;c++){if(16>c)d[c]=n[p+c]|0;else{var g=d[c-3]^d[c-8]^d[c-14]^d[c-16];d[c]=g<<1|g>>>31}g=(e<<5|e>>>27)+b+d[c];g=20>c?g+((f&h|~f&j)+1518500249):40>c?g+((f^h^j)+1859775393):60>c?g+((f&h|f&j|h&j)-1894007588):g+((f^h^
    j)-899497514);b=j;j=h;h=f<<30|f>>>2;f=e;e=g}a[0]=a[0]+e|0;a[1]=a[1]+f|0;a[2]=a[2]+h|0;a[3]=a[3]+j|0;a[4]=a[4]+b|0},_doFinalize:function(){var b=this._data,d=b.words,a=8*this._nDataBytes,e=8*b.sigBytes;d[e>>>5]|=128<<24-e%32;d[(e+64>>>9<<4)+14]=Math.floor(a/4294967296);d[(e+64>>>9<<4)+15]=a;b.sigBytes=4*d.length;this._process();return this._hash},clone:function(){var b=l.clone.call(this);b._hash=this._hash.clone();return b}});k.SHA1=l._createHelper(b);k.HmacSHA1=l._createHmacHelper(b)})();
    
    /*
    CryptoJS v3.1.2 sha256-min.js
    code.google.com/p/crypto-js
    (c) 2009-2013 by Jeff Mott. All rights reserved.
    code.google.com/p/crypto-js/wiki/License
    */
    (function(k){for(var g=CryptoJS,h=g.lib,v=h.WordArray,j=h.Hasher,h=g.algo,s=[],t=[],u=function(q){return 4294967296*(q-(q|0))|0},l=2,b=0;64>b;){var d;a:{d=l;for(var w=k.sqrt(d),r=2;r<=w;r++)if(!(d%r)){d=!1;break a}d=!0}d&&(8>b&&(s[b]=u(k.pow(l,0.5))),t[b]=u(k.pow(l,1/3)),b++);l++}var n=[],h=h.SHA256=j.extend({_doReset:function(){this._hash=new v.init(s.slice(0))},_doProcessBlock:function(q,h){for(var a=this._hash.words,c=a[0],d=a[1],b=a[2],k=a[3],f=a[4],g=a[5],j=a[6],l=a[7],e=0;64>e;e++){if(16>e)n[e]=
    q[h+e]|0;else{var m=n[e-15],p=n[e-2];n[e]=((m<<25|m>>>7)^(m<<14|m>>>18)^m>>>3)+n[e-7]+((p<<15|p>>>17)^(p<<13|p>>>19)^p>>>10)+n[e-16]}m=l+((f<<26|f>>>6)^(f<<21|f>>>11)^(f<<7|f>>>25))+(f&g^~f&j)+t[e]+n[e];p=((c<<30|c>>>2)^(c<<19|c>>>13)^(c<<10|c>>>22))+(c&d^c&b^d&b);l=j;j=g;g=f;f=k+m|0;k=b;b=d;d=c;c=m+p|0}a[0]=a[0]+c|0;a[1]=a[1]+d|0;a[2]=a[2]+b|0;a[3]=a[3]+k|0;a[4]=a[4]+f|0;a[5]=a[5]+g|0;a[6]=a[6]+j|0;a[7]=a[7]+l|0},_doFinalize:function(){var d=this._data,b=d.words,a=8*this._nDataBytes,c=8*d.sigBytes;
    b[c>>>5]|=128<<24-c%32;b[(c+64>>>9<<4)+14]=k.floor(a/4294967296);b[(c+64>>>9<<4)+15]=a;d.sigBytes=4*b.length;this._process();return this._hash},clone:function(){var b=j.clone.call(this);b._hash=this._hash.clone();return b}});g.SHA256=j._createHelper(h);g.HmacSHA256=j._createHmacHelper(h)})(Math);
    
    /*
    CryptoJS v3.1.2 sha224-min.js
    code.google.com/p/crypto-js
    (c) 2009-2013 by Jeff Mott. All rights reserved.
    code.google.com/p/crypto-js/wiki/License
    */
    (function(){var b=CryptoJS,d=b.lib.WordArray,a=b.algo,c=a.SHA256,a=a.SHA224=c.extend({_doReset:function(){this._hash=new d.init([3238371032,914150663,812702999,4144912697,4290775857,1750603025,1694076839,3204075428])},_doFinalize:function(){var a=c._doFinalize.call(this);a.sigBytes-=4;return a}});b.SHA224=c._createHelper(a);b.HmacSHA224=c._createHmacHelper(a)})();
    
    /*
    CryptoJS v3.1.2 sha512-min.js
    code.google.com/p/crypto-js
    (c) 2009-2013 by Jeff Mott. All rights reserved.
    code.google.com/p/crypto-js/wiki/License
    */
    (function(){function a(){return d.create.apply(d,arguments)}for(var n=CryptoJS,r=n.lib.Hasher,e=n.x64,d=e.Word,T=e.WordArray,e=n.algo,ea=[a(1116352408,3609767458),a(1899447441,602891725),a(3049323471,3964484399),a(3921009573,2173295548),a(961987163,4081628472),a(1508970993,3053834265),a(2453635748,2937671579),a(2870763221,3664609560),a(3624381080,2734883394),a(310598401,1164996542),a(607225278,1323610764),a(1426881987,3590304994),a(1925078388,4068182383),a(2162078206,991336113),a(2614888103,633803317),
    a(3248222580,3479774868),a(3835390401,2666613458),a(4022224774,944711139),a(264347078,2341262773),a(604807628,2007800933),a(770255983,1495990901),a(1249150122,1856431235),a(1555081692,3175218132),a(1996064986,2198950837),a(2554220882,3999719339),a(2821834349,766784016),a(2952996808,2566594879),a(3210313671,3203337956),a(3336571891,1034457026),a(3584528711,2466948901),a(113926993,3758326383),a(338241895,168717936),a(666307205,1188179964),a(773529912,1546045734),a(1294757372,1522805485),a(1396182291,
    2643833823),a(1695183700,2343527390),a(1986661051,1014477480),a(2177026350,1206759142),a(2456956037,344077627),a(2730485921,1290863460),a(2820302411,3158454273),a(3259730800,3505952657),a(3345764771,106217008),a(3516065817,3606008344),a(3600352804,1432725776),a(4094571909,1467031594),a(275423344,851169720),a(430227734,3100823752),a(506948616,1363258195),a(659060556,3750685593),a(883997877,3785050280),a(958139571,3318307427),a(1322822218,3812723403),a(1537002063,2003034995),a(1747873779,3602036899),
    a(1955562222,1575990012),a(2024104815,1125592928),a(2227730452,2716904306),a(2361852424,442776044),a(2428436474,593698344),a(2756734187,3733110249),a(3204031479,2999351573),a(3329325298,3815920427),a(3391569614,3928383900),a(3515267271,566280711),a(3940187606,3454069534),a(4118630271,4000239992),a(116418474,1914138554),a(174292421,2731055270),a(289380356,3203993006),a(460393269,320620315),a(685471733,587496836),a(852142971,1086792851),a(1017036298,365543100),a(1126000580,2618297676),a(1288033470,
    3409855158),a(1501505948,4234509866),a(1607167915,987167468),a(1816402316,1246189591)],v=[],w=0;80>w;w++)v[w]=a();e=e.SHA512=r.extend({_doReset:function(){this._hash=new T.init([new d.init(1779033703,4089235720),new d.init(3144134277,2227873595),new d.init(1013904242,4271175723),new d.init(2773480762,1595750129),new d.init(1359893119,2917565137),new d.init(2600822924,725511199),new d.init(528734635,4215389547),new d.init(1541459225,327033209)])},_doProcessBlock:function(a,d){for(var f=this._hash.words,
    F=f[0],e=f[1],n=f[2],r=f[3],G=f[4],H=f[5],I=f[6],f=f[7],w=F.high,J=F.low,X=e.high,K=e.low,Y=n.high,L=n.low,Z=r.high,M=r.low,$=G.high,N=G.low,aa=H.high,O=H.low,ba=I.high,P=I.low,ca=f.high,Q=f.low,k=w,g=J,z=X,x=K,A=Y,y=L,U=Z,B=M,l=$,h=N,R=aa,C=O,S=ba,D=P,V=ca,E=Q,m=0;80>m;m++){var s=v[m];if(16>m)var j=s.high=a[d+2*m]|0,b=s.low=a[d+2*m+1]|0;else{var j=v[m-15],b=j.high,p=j.low,j=(b>>>1|p<<31)^(b>>>8|p<<24)^b>>>7,p=(p>>>1|b<<31)^(p>>>8|b<<24)^(p>>>7|b<<25),u=v[m-2],b=u.high,c=u.low,u=(b>>>19|c<<13)^(b<<
    3|c>>>29)^b>>>6,c=(c>>>19|b<<13)^(c<<3|b>>>29)^(c>>>6|b<<26),b=v[m-7],W=b.high,t=v[m-16],q=t.high,t=t.low,b=p+b.low,j=j+W+(b>>>0<p>>>0?1:0),b=b+c,j=j+u+(b>>>0<c>>>0?1:0),b=b+t,j=j+q+(b>>>0<t>>>0?1:0);s.high=j;s.low=b}var W=l&R^~l&S,t=h&C^~h&D,s=k&z^k&A^z&A,T=g&x^g&y^x&y,p=(k>>>28|g<<4)^(k<<30|g>>>2)^(k<<25|g>>>7),u=(g>>>28|k<<4)^(g<<30|k>>>2)^(g<<25|k>>>7),c=ea[m],fa=c.high,da=c.low,c=E+((h>>>14|l<<18)^(h>>>18|l<<14)^(h<<23|l>>>9)),q=V+((l>>>14|h<<18)^(l>>>18|h<<14)^(l<<23|h>>>9))+(c>>>0<E>>>0?1:
    0),c=c+t,q=q+W+(c>>>0<t>>>0?1:0),c=c+da,q=q+fa+(c>>>0<da>>>0?1:0),c=c+b,q=q+j+(c>>>0<b>>>0?1:0),b=u+T,s=p+s+(b>>>0<u>>>0?1:0),V=S,E=D,S=R,D=C,R=l,C=h,h=B+c|0,l=U+q+(h>>>0<B>>>0?1:0)|0,U=A,B=y,A=z,y=x,z=k,x=g,g=c+b|0,k=q+s+(g>>>0<c>>>0?1:0)|0}J=F.low=J+g;F.high=w+k+(J>>>0<g>>>0?1:0);K=e.low=K+x;e.high=X+z+(K>>>0<x>>>0?1:0);L=n.low=L+y;n.high=Y+A+(L>>>0<y>>>0?1:0);M=r.low=M+B;r.high=Z+U+(M>>>0<B>>>0?1:0);N=G.low=N+h;G.high=$+l+(N>>>0<h>>>0?1:0);O=H.low=O+C;H.high=aa+R+(O>>>0<C>>>0?1:0);P=I.low=P+D;
    I.high=ba+S+(P>>>0<D>>>0?1:0);Q=f.low=Q+E;f.high=ca+V+(Q>>>0<E>>>0?1:0)},_doFinalize:function(){var a=this._data,d=a.words,f=8*this._nDataBytes,e=8*a.sigBytes;d[e>>>5]|=128<<24-e%32;d[(e+128>>>10<<5)+30]=Math.floor(f/4294967296);d[(e+128>>>10<<5)+31]=f;a.sigBytes=4*d.length;this._process();return this._hash.toX32()},clone:function(){var a=r.clone.call(this);a._hash=this._hash.clone();return a},blockSize:32});n.SHA512=r._createHelper(e);n.HmacSHA512=r._createHmacHelper(e)})();
    
    /*
    CryptoJS v3.1.2 sha384-min.js
    code.google.com/p/crypto-js
    (c) 2009-2013 by Jeff Mott. All rights reserved.
    code.google.com/p/crypto-js/wiki/License
    */
    (function(){var c=CryptoJS,a=c.x64,b=a.Word,e=a.WordArray,a=c.algo,d=a.SHA512,a=a.SHA384=d.extend({_doReset:function(){this._hash=new e.init([new b.init(3418070365,3238371032),new b.init(1654270250,914150663),new b.init(2438529370,812702999),new b.init(355462360,4144912697),new b.init(1731405415,4290775857),new b.init(2394180231,1750603025),new b.init(3675008525,1694076839),new b.init(1203062813,3204075428)])},_doFinalize:function(){var a=d._doFinalize.call(this);a.sigBytes-=16;return a}});c.SHA384=
    d._createHelper(a);c.HmacSHA384=d._createHmacHelper(a)})();
    
    /*
    CryptoJS v3.1.2 ripemd160-min.js
    code.google.com/p/crypto-js
    (c) 2009-2013 by Jeff Mott. All rights reserved.
    code.google.com/p/crypto-js/wiki/License
    */
    /*
    
    (c) 2012 by Cedric Mesnil. All rights reserved.
    
    Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
    
        - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
        - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
    
    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
    */
    (function(){var q=CryptoJS,d=q.lib,n=d.WordArray,p=d.Hasher,d=q.algo,x=n.create([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,7,4,13,1,10,6,15,3,12,0,9,5,2,14,11,8,3,10,14,4,9,15,8,1,2,7,0,6,13,11,5,12,1,9,11,10,0,8,12,4,13,3,7,15,14,5,6,2,4,0,5,9,7,12,2,10,14,1,3,8,11,6,15,13]),y=n.create([5,14,7,0,9,2,11,4,13,6,15,8,1,10,3,12,6,11,3,7,0,13,5,10,14,15,8,12,4,9,1,2,15,5,1,3,7,14,6,9,11,8,12,2,10,0,4,13,8,6,4,1,3,11,15,0,5,12,2,13,9,7,10,14,12,15,10,4,1,5,8,7,6,2,13,14,0,3,9,11]),z=n.create([11,14,15,12,
    5,8,7,9,11,13,14,15,6,7,9,8,7,6,8,13,11,9,7,15,7,12,15,9,11,7,13,12,11,13,6,7,14,9,13,15,14,8,13,6,5,12,7,5,11,12,14,15,14,15,9,8,9,14,5,6,8,6,5,12,9,15,5,11,6,8,13,12,5,12,13,14,11,8,5,6]),A=n.create([8,9,9,11,13,15,15,5,7,7,8,11,14,14,12,6,9,13,15,7,12,8,9,11,7,7,12,7,6,15,13,11,9,7,15,11,8,6,6,14,12,13,5,14,13,13,7,5,15,5,8,11,14,14,6,14,6,9,12,9,12,5,15,8,8,5,12,9,12,5,14,6,8,13,6,5,15,13,11,11]),B=n.create([0,1518500249,1859775393,2400959708,2840853838]),C=n.create([1352829926,1548603684,1836072691,
    2053994217,0]),d=d.RIPEMD160=p.extend({_doReset:function(){this._hash=n.create([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(e,v){for(var b=0;16>b;b++){var c=v+b,f=e[c];e[c]=(f<<8|f>>>24)&16711935|(f<<24|f>>>8)&4278255360}var c=this._hash.words,f=B.words,d=C.words,n=x.words,q=y.words,p=z.words,w=A.words,t,g,h,j,r,u,k,l,m,s;u=t=c[0];k=g=c[1];l=h=c[2];m=j=c[3];s=r=c[4];for(var a,b=0;80>b;b+=1)a=t+e[v+n[b]]|0,a=16>b?a+((g^h^j)+f[0]):32>b?a+((g&h|~g&j)+f[1]):48>b?
    a+(((g|~h)^j)+f[2]):64>b?a+((g&j|h&~j)+f[3]):a+((g^(h|~j))+f[4]),a|=0,a=a<<p[b]|a>>>32-p[b],a=a+r|0,t=r,r=j,j=h<<10|h>>>22,h=g,g=a,a=u+e[v+q[b]]|0,a=16>b?a+((k^(l|~m))+d[0]):32>b?a+((k&m|l&~m)+d[1]):48>b?a+(((k|~l)^m)+d[2]):64>b?a+((k&l|~k&m)+d[3]):a+((k^l^m)+d[4]),a|=0,a=a<<w[b]|a>>>32-w[b],a=a+s|0,u=s,s=m,m=l<<10|l>>>22,l=k,k=a;a=c[1]+h+m|0;c[1]=c[2]+j+s|0;c[2]=c[3]+r+u|0;c[3]=c[4]+t+k|0;c[4]=c[0]+g+l|0;c[0]=a},_doFinalize:function(){var e=this._data,d=e.words,b=8*this._nDataBytes,c=8*e.sigBytes;
    d[c>>>5]|=128<<24-c%32;d[(c+64>>>9<<4)+14]=(b<<8|b>>>24)&16711935|(b<<24|b>>>8)&4278255360;e.sigBytes=4*(d.length+1);this._process();e=this._hash;d=e.words;for(b=0;5>b;b++)c=d[b],d[b]=(c<<8|c>>>24)&16711935|(c<<24|c>>>8)&4278255360;return e},clone:function(){var d=p.clone.call(this);d._hash=this._hash.clone();return d}});q.RIPEMD160=p._createHelper(d);q.HmacRIPEMD160=p._createHmacHelper(d)})(Math);
    
    /*
    CryptoJS v3.1.2 hmac.js
    code.google.com/p/crypto-js
    (c) 2009-2013 by Jeff Mott. All rights reserved.
    code.google.com/p/crypto-js/wiki/License
    */
    (function(){var c=CryptoJS,k=c.enc.Utf8;c.algo.HMAC=c.lib.Base.extend({init:function(a,b){a=this._hasher=new a.init;"string"==typeof b&&(b=k.parse(b));var c=a.blockSize,e=4*c;b.sigBytes>e&&(b=a.finalize(b));b.clamp();for(var f=this._oKey=b.clone(),g=this._iKey=b.clone(),h=f.words,j=g.words,d=0;d<c;d++)h[d]^=1549556828,j[d]^=909522486;f.sigBytes=g.sigBytes=e;this.reset()},reset:function(){var a=this._hasher;a.reset();a.update(this._iKey)},update:function(a){this._hasher.update(a);return this},finalize:function(a){var b=
    this._hasher;a=b.finalize(a);b.reset();return b.finalize(this._oKey.clone().concat(a))}})})();
    
    /*
    CryptoJS v3.1.2 pbkdf2-min.js
    code.google.com/p/crypto-js
    (c) 2009-2013 by Jeff Mott. All rights reserved.
    code.google.com/p/crypto-js/wiki/License
    */
    (function(){var b=CryptoJS,a=b.lib,d=a.Base,m=a.WordArray,a=b.algo,q=a.HMAC,l=a.PBKDF2=d.extend({cfg:d.extend({keySize:4,hasher:a.SHA1,iterations:1}),init:function(a){this.cfg=this.cfg.extend(a)},compute:function(a,b){for(var c=this.cfg,f=q.create(c.hasher,a),g=m.create(),d=m.create([1]),l=g.words,r=d.words,n=c.keySize,c=c.iterations;l.length<n;){var h=f.update(b).finalize(d);f.reset();for(var j=h.words,s=j.length,k=h,p=1;p<c;p++){k=f.finalize(k);f.reset();for(var t=k.words,e=0;e<s;e++)j[e]^=t[e]}g.concat(h);
    r[0]++}g.sigBytes=4*n;return g}});b.PBKDF2=function(a,b,c){return l.create(c).compute(a,b)}})();
    
    /*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
     */
    var b64map="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";var b64pad="=";function hex2b64(d){var b;var e;var a="";for(b=0;b+3<=d.length;b+=3){e=parseInt(d.substring(b,b+3),16);a+=b64map.charAt(e>>6)+b64map.charAt(e&63)}if(b+1==d.length){e=parseInt(d.substring(b,b+1),16);a+=b64map.charAt(e<<2)}else{if(b+2==d.length){e=parseInt(d.substring(b,b+2),16);a+=b64map.charAt(e>>2)+b64map.charAt((e&3)<<4)}}if(b64pad){while((a.length&3)>0){a+=b64pad}}return a}function b64tohex(f){var d="";var e;var b=0;var c;var a;for(e=0;e<f.length;++e){if(f.charAt(e)==b64pad){break}a=b64map.indexOf(f.charAt(e));if(a<0){continue}if(b==0){d+=int2char(a>>2);c=a&3;b=1}else{if(b==1){d+=int2char((c<<2)|(a>>4));c=a&15;b=2}else{if(b==2){d+=int2char(c);d+=int2char(a>>2);c=a&3;b=3}else{d+=int2char((c<<2)|(a>>4));d+=int2char(a&15);b=0}}}}if(b==1){d+=int2char(c<<2)}return d}function b64toBA(e){var d=b64tohex(e);var c;var b=new Array();for(c=0;2*c<d.length;++c){b[c]=parseInt(d.substring(2*c,2*c+2),16)}return b};
    /*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
     */
    var dbits;var canary=244837814094590;var j_lm=((canary&16777215)==15715070);function BigInteger(e,d,f){if(e!=null){if("number"==typeof e){this.fromNumber(e,d,f)}else{if(d==null&&"string"!=typeof e){this.fromString(e,256)}else{this.fromString(e,d)}}}}function nbi(){return new BigInteger(null)}function am1(f,a,b,e,h,g){while(--g>=0){var d=a*this[f++]+b[e]+h;h=Math.floor(d/67108864);b[e++]=d&67108863}return h}function am2(f,q,r,e,o,a){var k=q&32767,p=q>>15;while(--a>=0){var d=this[f]&32767;var g=this[f++]>>15;var b=p*d+g*k;d=k*d+((b&32767)<<15)+r[e]+(o&1073741823);o=(d>>>30)+(b>>>15)+p*g+(o>>>30);r[e++]=d&1073741823}return o}function am3(f,q,r,e,o,a){var k=q&16383,p=q>>14;while(--a>=0){var d=this[f]&16383;var g=this[f++]>>14;var b=p*d+g*k;d=k*d+((b&16383)<<14)+r[e]+o;o=(d>>28)+(b>>14)+p*g;r[e++]=d&268435455}return o}if(j_lm&&(navigator.appName=="Microsoft Internet Explorer")){BigInteger.prototype.am=am2;dbits=30}else{if(j_lm&&(navigator.appName!="Netscape")){BigInteger.prototype.am=am1;dbits=26}else{BigInteger.prototype.am=am3;dbits=28}}BigInteger.prototype.DB=dbits;BigInteger.prototype.DM=((1<<dbits)-1);BigInteger.prototype.DV=(1<<dbits);var BI_FP=52;BigInteger.prototype.FV=Math.pow(2,BI_FP);BigInteger.prototype.F1=BI_FP-dbits;BigInteger.prototype.F2=2*dbits-BI_FP;var BI_RM="0123456789abcdefghijklmnopqrstuvwxyz";var BI_RC=new Array();var rr,vv;rr="0".charCodeAt(0);for(vv=0;vv<=9;++vv){BI_RC[rr++]=vv}rr="a".charCodeAt(0);for(vv=10;vv<36;++vv){BI_RC[rr++]=vv}rr="A".charCodeAt(0);for(vv=10;vv<36;++vv){BI_RC[rr++]=vv}function int2char(a){return BI_RM.charAt(a)}function intAt(b,a){var d=BI_RC[b.charCodeAt(a)];return(d==null)?-1:d}function bnpCopyTo(b){for(var a=this.t-1;a>=0;--a){b[a]=this[a]}b.t=this.t;b.s=this.s}function bnpFromInt(a){this.t=1;this.s=(a<0)?-1:0;if(a>0){this[0]=a}else{if(a<-1){this[0]=a+this.DV}else{this.t=0}}}function nbv(a){var b=nbi();b.fromInt(a);return b}function bnpFromString(h,c){var e;if(c==16){e=4}else{if(c==8){e=3}else{if(c==256){e=8}else{if(c==2){e=1}else{if(c==32){e=5}else{if(c==4){e=2}else{this.fromRadix(h,c);return}}}}}}this.t=0;this.s=0;var g=h.length,d=false,f=0;while(--g>=0){var a=(e==8)?h[g]&255:intAt(h,g);if(a<0){if(h.charAt(g)=="-"){d=true}continue}d=false;if(f==0){this[this.t++]=a}else{if(f+e>this.DB){this[this.t-1]|=(a&((1<<(this.DB-f))-1))<<f;this[this.t++]=(a>>(this.DB-f))}else{this[this.t-1]|=a<<f}}f+=e;if(f>=this.DB){f-=this.DB}}if(e==8&&(h[0]&128)!=0){this.s=-1;if(f>0){this[this.t-1]|=((1<<(this.DB-f))-1)<<f}}this.clamp();if(d){BigInteger.ZERO.subTo(this,this)}}function bnpClamp(){var a=this.s&this.DM;while(this.t>0&&this[this.t-1]==a){--this.t}}function bnToString(c){if(this.s<0){return"-"+this.negate().toString(c)}var e;if(c==16){e=4}else{if(c==8){e=3}else{if(c==2){e=1}else{if(c==32){e=5}else{if(c==4){e=2}else{return this.toRadix(c)}}}}}var g=(1<<e)-1,l,a=false,h="",f=this.t;var j=this.DB-(f*this.DB)%e;if(f-->0){if(j<this.DB&&(l=this[f]>>j)>0){a=true;h=int2char(l)}while(f>=0){if(j<e){l=(this[f]&((1<<j)-1))<<(e-j);l|=this[--f]>>(j+=this.DB-e)}else{l=(this[f]>>(j-=e))&g;if(j<=0){j+=this.DB;--f}}if(l>0){a=true}if(a){h+=int2char(l)}}}return a?h:"0"}function bnNegate(){var a=nbi();BigInteger.ZERO.subTo(this,a);return a}function bnAbs(){return(this.s<0)?this.negate():this}function bnCompareTo(b){var d=this.s-b.s;if(d!=0){return d}var c=this.t;d=c-b.t;if(d!=0){return(this.s<0)?-d:d}while(--c>=0){if((d=this[c]-b[c])!=0){return d}}return 0}function nbits(a){var c=1,b;if((b=a>>>16)!=0){a=b;c+=16}if((b=a>>8)!=0){a=b;c+=8}if((b=a>>4)!=0){a=b;c+=4}if((b=a>>2)!=0){a=b;c+=2}if((b=a>>1)!=0){a=b;c+=1}return c}function bnBitLength(){if(this.t<=0){return 0}return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM))}function bnpDLShiftTo(c,b){var a;for(a=this.t-1;a>=0;--a){b[a+c]=this[a]}for(a=c-1;a>=0;--a){b[a]=0}b.t=this.t+c;b.s=this.s}function bnpDRShiftTo(c,b){for(var a=c;a<this.t;++a){b[a-c]=this[a]}b.t=Math.max(this.t-c,0);b.s=this.s}function bnpLShiftTo(j,e){var b=j%this.DB;var a=this.DB-b;var g=(1<<a)-1;var f=Math.floor(j/this.DB),h=(this.s<<b)&this.DM,d;for(d=this.t-1;d>=0;--d){e[d+f+1]=(this[d]>>a)|h;h=(this[d]&g)<<b}for(d=f-1;d>=0;--d){e[d]=0}e[f]=h;e.t=this.t+f+1;e.s=this.s;e.clamp()}function bnpRShiftTo(g,d){d.s=this.s;var e=Math.floor(g/this.DB);if(e>=this.t){d.t=0;return}var b=g%this.DB;var a=this.DB-b;var f=(1<<b)-1;d[0]=this[e]>>b;for(var c=e+1;c<this.t;++c){d[c-e-1]|=(this[c]&f)<<a;d[c-e]=this[c]>>b}if(b>0){d[this.t-e-1]|=(this.s&f)<<a}d.t=this.t-e;d.clamp()}function bnpSubTo(d,f){var e=0,g=0,b=Math.min(d.t,this.t);while(e<b){g+=this[e]-d[e];f[e++]=g&this.DM;g>>=this.DB}if(d.t<this.t){g-=d.s;while(e<this.t){g+=this[e];f[e++]=g&this.DM;g>>=this.DB}g+=this.s}else{g+=this.s;while(e<d.t){g-=d[e];f[e++]=g&this.DM;g>>=this.DB}g-=d.s}f.s=(g<0)?-1:0;if(g<-1){f[e++]=this.DV+g}else{if(g>0){f[e++]=g}}f.t=e;f.clamp()}function bnpMultiplyTo(c,e){var b=this.abs(),f=c.abs();var d=b.t;e.t=d+f.t;while(--d>=0){e[d]=0}for(d=0;d<f.t;++d){e[d+b.t]=b.am(0,f[d],e,d,0,b.t)}e.s=0;e.clamp();if(this.s!=c.s){BigInteger.ZERO.subTo(e,e)}}function bnpSquareTo(d){var a=this.abs();var b=d.t=2*a.t;while(--b>=0){d[b]=0}for(b=0;b<a.t-1;++b){var e=a.am(b,a[b],d,2*b,0,1);if((d[b+a.t]+=a.am(b+1,2*a[b],d,2*b+1,e,a.t-b-1))>=a.DV){d[b+a.t]-=a.DV;d[b+a.t+1]=1}}if(d.t>0){d[d.t-1]+=a.am(b,a[b],d,2*b,0,1)}d.s=0;d.clamp()}function bnpDivRemTo(n,h,g){var w=n.abs();if(w.t<=0){return}var k=this.abs();if(k.t<w.t){if(h!=null){h.fromInt(0)}if(g!=null){this.copyTo(g)}return}if(g==null){g=nbi()}var d=nbi(),a=this.s,l=n.s;var v=this.DB-nbits(w[w.t-1]);if(v>0){w.lShiftTo(v,d);k.lShiftTo(v,g)}else{w.copyTo(d);k.copyTo(g)}var p=d.t;var b=d[p-1];if(b==0){return}var o=b*(1<<this.F1)+((p>1)?d[p-2]>>this.F2:0);var A=this.FV/o,z=(1<<this.F1)/o,x=1<<this.F2;var u=g.t,s=u-p,f=(h==null)?nbi():h;d.dlShiftTo(s,f);if(g.compareTo(f)>=0){g[g.t++]=1;g.subTo(f,g)}BigInteger.ONE.dlShiftTo(p,f);f.subTo(d,d);while(d.t<p){d[d.t++]=0}while(--s>=0){var c=(g[--u]==b)?this.DM:Math.floor(g[u]*A+(g[u-1]+x)*z);if((g[u]+=d.am(0,c,g,s,0,p))<c){d.dlShiftTo(s,f);g.subTo(f,g);while(g[u]<--c){g.subTo(f,g)}}}if(h!=null){g.drShiftTo(p,h);if(a!=l){BigInteger.ZERO.subTo(h,h)}}g.t=p;g.clamp();if(v>0){g.rShiftTo(v,g)}if(a<0){BigInteger.ZERO.subTo(g,g)}}function bnMod(b){var c=nbi();this.abs().divRemTo(b,null,c);if(this.s<0&&c.compareTo(BigInteger.ZERO)>0){b.subTo(c,c)}return c}function Classic(a){this.m=a}function cConvert(a){if(a.s<0||a.compareTo(this.m)>=0){return a.mod(this.m)}else{return a}}function cRevert(a){return a}function cReduce(a){a.divRemTo(this.m,null,a)}function cMulTo(a,c,b){a.multiplyTo(c,b);this.reduce(b)}function cSqrTo(a,b){a.squareTo(b);this.reduce(b)}Classic.prototype.convert=cConvert;Classic.prototype.revert=cRevert;Classic.prototype.reduce=cReduce;Classic.prototype.mulTo=cMulTo;Classic.prototype.sqrTo=cSqrTo;function bnpInvDigit(){if(this.t<1){return 0}var a=this[0];if((a&1)==0){return 0}var b=a&3;b=(b*(2-(a&15)*b))&15;b=(b*(2-(a&255)*b))&255;b=(b*(2-(((a&65535)*b)&65535)))&65535;b=(b*(2-a*b%this.DV))%this.DV;return(b>0)?this.DV-b:-b}function Montgomery(a){this.m=a;this.mp=a.invDigit();this.mpl=this.mp&32767;this.mph=this.mp>>15;this.um=(1<<(a.DB-15))-1;this.mt2=2*a.t}function montConvert(a){var b=nbi();a.abs().dlShiftTo(this.m.t,b);b.divRemTo(this.m,null,b);if(a.s<0&&b.compareTo(BigInteger.ZERO)>0){this.m.subTo(b,b)}return b}function montRevert(a){var b=nbi();a.copyTo(b);this.reduce(b);return b}function montReduce(a){while(a.t<=this.mt2){a[a.t++]=0}for(var c=0;c<this.m.t;++c){var b=a[c]&32767;var d=(b*this.mpl+(((b*this.mph+(a[c]>>15)*this.mpl)&this.um)<<15))&a.DM;b=c+this.m.t;a[b]+=this.m.am(0,d,a,c,0,this.m.t);while(a[b]>=a.DV){a[b]-=a.DV;a[++b]++}}a.clamp();a.drShiftTo(this.m.t,a);if(a.compareTo(this.m)>=0){a.subTo(this.m,a)}}function montSqrTo(a,b){a.squareTo(b);this.reduce(b)}function montMulTo(a,c,b){a.multiplyTo(c,b);this.reduce(b)}Montgomery.prototype.convert=montConvert;Montgomery.prototype.revert=montRevert;Montgomery.prototype.reduce=montReduce;Montgomery.prototype.mulTo=montMulTo;Montgomery.prototype.sqrTo=montSqrTo;function bnpIsEven(){return((this.t>0)?(this[0]&1):this.s)==0}function bnpExp(h,j){if(h>4294967295||h<1){return BigInteger.ONE}var f=nbi(),a=nbi(),d=j.convert(this),c=nbits(h)-1;d.copyTo(f);while(--c>=0){j.sqrTo(f,a);if((h&(1<<c))>0){j.mulTo(a,d,f)}else{var b=f;f=a;a=b}}return j.revert(f)}function bnModPowInt(b,a){var c;if(b<256||a.isEven()){c=new Classic(a)}else{c=new Montgomery(a)}return this.exp(b,c)}BigInteger.prototype.copyTo=bnpCopyTo;BigInteger.prototype.fromInt=bnpFromInt;BigInteger.prototype.fromString=bnpFromString;BigInteger.prototype.clamp=bnpClamp;BigInteger.prototype.dlShiftTo=bnpDLShiftTo;BigInteger.prototype.drShiftTo=bnpDRShiftTo;BigInteger.prototype.lShiftTo=bnpLShiftTo;BigInteger.prototype.rShiftTo=bnpRShiftTo;BigInteger.prototype.subTo=bnpSubTo;BigInteger.prototype.multiplyTo=bnpMultiplyTo;BigInteger.prototype.squareTo=bnpSquareTo;BigInteger.prototype.divRemTo=bnpDivRemTo;BigInteger.prototype.invDigit=bnpInvDigit;BigInteger.prototype.isEven=bnpIsEven;BigInteger.prototype.exp=bnpExp;BigInteger.prototype.toString=bnToString;BigInteger.prototype.negate=bnNegate;BigInteger.prototype.abs=bnAbs;BigInteger.prototype.compareTo=bnCompareTo;BigInteger.prototype.bitLength=bnBitLength;BigInteger.prototype.mod=bnMod;BigInteger.prototype.modPowInt=bnModPowInt;BigInteger.ZERO=nbv(0);BigInteger.ONE=nbv(1);
    /*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
     */
    function bnClone(){var a=nbi();this.copyTo(a);return a}function bnIntValue(){if(this.s<0){if(this.t==1){return this[0]-this.DV}else{if(this.t==0){return -1}}}else{if(this.t==1){return this[0]}else{if(this.t==0){return 0}}}return((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0]}function bnByteValue(){return(this.t==0)?this.s:(this[0]<<24)>>24}function bnShortValue(){return(this.t==0)?this.s:(this[0]<<16)>>16}function bnpChunkSize(a){return Math.floor(Math.LN2*this.DB/Math.log(a))}function bnSigNum(){if(this.s<0){return -1}else{if(this.t<=0||(this.t==1&&this[0]<=0)){return 0}else{return 1}}}function bnpToRadix(c){if(c==null){c=10}if(this.signum()==0||c<2||c>36){return"0"}var f=this.chunkSize(c);var e=Math.pow(c,f);var i=nbv(e),j=nbi(),h=nbi(),g="";this.divRemTo(i,j,h);while(j.signum()>0){g=(e+h.intValue()).toString(c).substr(1)+g;j.divRemTo(i,j,h)}return h.intValue().toString(c)+g}function bnpFromRadix(m,h){this.fromInt(0);if(h==null){h=10}var f=this.chunkSize(h);var g=Math.pow(h,f),e=false,a=0,l=0;for(var c=0;c<m.length;++c){var k=intAt(m,c);if(k<0){if(m.charAt(c)=="-"&&this.signum()==0){e=true}continue}l=h*l+k;if(++a>=f){this.dMultiply(g);this.dAddOffset(l,0);a=0;l=0}}if(a>0){this.dMultiply(Math.pow(h,a));this.dAddOffset(l,0)}if(e){BigInteger.ZERO.subTo(this,this)}}function bnpFromNumber(f,e,h){if("number"==typeof e){if(f<2){this.fromInt(1)}else{this.fromNumber(f,h);if(!this.testBit(f-1)){this.bitwiseTo(BigInteger.ONE.shiftLeft(f-1),op_or,this)}if(this.isEven()){this.dAddOffset(1,0)}while(!this.isProbablePrime(e)){this.dAddOffset(2,0);if(this.bitLength()>f){this.subTo(BigInteger.ONE.shiftLeft(f-1),this)}}}}else{var d=new Array(),g=f&7;d.length=(f>>3)+1;e.nextBytes(d);if(g>0){d[0]&=((1<<g)-1)}else{d[0]=0}this.fromString(d,256)}}function bnToByteArray(){var b=this.t,c=new Array();c[0]=this.s;var e=this.DB-(b*this.DB)%8,f,a=0;if(b-->0){if(e<this.DB&&(f=this[b]>>e)!=(this.s&this.DM)>>e){c[a++]=f|(this.s<<(this.DB-e))}while(b>=0){if(e<8){f=(this[b]&((1<<e)-1))<<(8-e);f|=this[--b]>>(e+=this.DB-8)}else{f=(this[b]>>(e-=8))&255;if(e<=0){e+=this.DB;--b}}if((f&128)!=0){f|=-256}if(a==0&&(this.s&128)!=(f&128)){++a}if(a>0||f!=this.s){c[a++]=f}}}return c}function bnEquals(b){return(this.compareTo(b)==0)}function bnMin(b){return(this.compareTo(b)<0)?this:b}function bnMax(b){return(this.compareTo(b)>0)?this:b}function bnpBitwiseTo(c,h,e){var d,g,b=Math.min(c.t,this.t);for(d=0;d<b;++d){e[d]=h(this[d],c[d])}if(c.t<this.t){g=c.s&this.DM;for(d=b;d<this.t;++d){e[d]=h(this[d],g)}e.t=this.t}else{g=this.s&this.DM;for(d=b;d<c.t;++d){e[d]=h(g,c[d])}e.t=c.t}e.s=h(this.s,c.s);e.clamp()}function op_and(a,b){return a&b}function bnAnd(b){var c=nbi();this.bitwiseTo(b,op_and,c);return c}function op_or(a,b){return a|b}function bnOr(b){var c=nbi();this.bitwiseTo(b,op_or,c);return c}function op_xor(a,b){return a^b}function bnXor(b){var c=nbi();this.bitwiseTo(b,op_xor,c);return c}function op_andnot(a,b){return a&~b}function bnAndNot(b){var c=nbi();this.bitwiseTo(b,op_andnot,c);return c}function bnNot(){var b=nbi();for(var a=0;a<this.t;++a){b[a]=this.DM&~this[a]}b.t=this.t;b.s=~this.s;return b}function bnShiftLeft(b){var a=nbi();if(b<0){this.rShiftTo(-b,a)}else{this.lShiftTo(b,a)}return a}function bnShiftRight(b){var a=nbi();if(b<0){this.lShiftTo(-b,a)}else{this.rShiftTo(b,a)}return a}function lbit(a){if(a==0){return -1}var b=0;if((a&65535)==0){a>>=16;b+=16}if((a&255)==0){a>>=8;b+=8}if((a&15)==0){a>>=4;b+=4}if((a&3)==0){a>>=2;b+=2}if((a&1)==0){++b}return b}function bnGetLowestSetBit(){for(var a=0;a<this.t;++a){if(this[a]!=0){return a*this.DB+lbit(this[a])}}if(this.s<0){return this.t*this.DB}return -1}function cbit(a){var b=0;while(a!=0){a&=a-1;++b}return b}function bnBitCount(){var c=0,a=this.s&this.DM;for(var b=0;b<this.t;++b){c+=cbit(this[b]^a)}return c}function bnTestBit(b){var a=Math.floor(b/this.DB);if(a>=this.t){return(this.s!=0)}return((this[a]&(1<<(b%this.DB)))!=0)}function bnpChangeBit(c,b){var a=BigInteger.ONE.shiftLeft(c);this.bitwiseTo(a,b,a);return a}function bnSetBit(a){return this.changeBit(a,op_or)}function bnClearBit(a){return this.changeBit(a,op_andnot)}function bnFlipBit(a){return this.changeBit(a,op_xor)}function bnpAddTo(d,f){var e=0,g=0,b=Math.min(d.t,this.t);while(e<b){g+=this[e]+d[e];f[e++]=g&this.DM;g>>=this.DB}if(d.t<this.t){g+=d.s;while(e<this.t){g+=this[e];f[e++]=g&this.DM;g>>=this.DB}g+=this.s}else{g+=this.s;while(e<d.t){g+=d[e];f[e++]=g&this.DM;g>>=this.DB}g+=d.s}f.s=(g<0)?-1:0;if(g>0){f[e++]=g}else{if(g<-1){f[e++]=this.DV+g}}f.t=e;f.clamp()}function bnAdd(b){var c=nbi();this.addTo(b,c);return c}function bnSubtract(b){var c=nbi();this.subTo(b,c);return c}function bnMultiply(b){var c=nbi();this.multiplyTo(b,c);return c}function bnSquare(){var a=nbi();this.squareTo(a);return a}function bnDivide(b){var c=nbi();this.divRemTo(b,c,null);return c}function bnRemainder(b){var c=nbi();this.divRemTo(b,null,c);return c}function bnDivideAndRemainder(b){var d=nbi(),c=nbi();this.divRemTo(b,d,c);return new Array(d,c)}function bnpDMultiply(a){this[this.t]=this.am(0,a-1,this,0,0,this.t);++this.t;this.clamp()}function bnpDAddOffset(b,a){if(b==0){return}while(this.t<=a){this[this.t++]=0}this[a]+=b;while(this[a]>=this.DV){this[a]-=this.DV;if(++a>=this.t){this[this.t++]=0}++this[a]}}function NullExp(){}function nNop(a){return a}function nMulTo(a,c,b){a.multiplyTo(c,b)}function nSqrTo(a,b){a.squareTo(b)}NullExp.prototype.convert=nNop;NullExp.prototype.revert=nNop;NullExp.prototype.mulTo=nMulTo;NullExp.prototype.sqrTo=nSqrTo;function bnPow(a){return this.exp(a,new NullExp())}function bnpMultiplyLowerTo(b,f,e){var d=Math.min(this.t+b.t,f);e.s=0;e.t=d;while(d>0){e[--d]=0}var c;for(c=e.t-this.t;d<c;++d){e[d+this.t]=this.am(0,b[d],e,d,0,this.t)}for(c=Math.min(b.t,f);d<c;++d){this.am(0,b[d],e,d,0,f-d)}e.clamp()}function bnpMultiplyUpperTo(b,e,d){--e;var c=d.t=this.t+b.t-e;d.s=0;while(--c>=0){d[c]=0}for(c=Math.max(e-this.t,0);c<b.t;++c){d[this.t+c-e]=this.am(e-c,b[c],d,0,0,this.t+c-e)}d.clamp();d.drShiftTo(1,d)}function Barrett(a){this.r2=nbi();this.q3=nbi();BigInteger.ONE.dlShiftTo(2*a.t,this.r2);this.mu=this.r2.divide(a);this.m=a}function barrettConvert(a){if(a.s<0||a.t>2*this.m.t){return a.mod(this.m)}else{if(a.compareTo(this.m)<0){return a}else{var b=nbi();a.copyTo(b);this.reduce(b);return b}}}function barrettRevert(a){return a}function barrettReduce(a){a.drShiftTo(this.m.t-1,this.r2);if(a.t>this.m.t+1){a.t=this.m.t+1;a.clamp()}this.mu.multiplyUpperTo(this.r2,this.m.t+1,this.q3);this.m.multiplyLowerTo(this.q3,this.m.t+1,this.r2);while(a.compareTo(this.r2)<0){a.dAddOffset(1,this.m.t+1)}a.subTo(this.r2,a);while(a.compareTo(this.m)>=0){a.subTo(this.m,a)}}function barrettSqrTo(a,b){a.squareTo(b);this.reduce(b)}function barrettMulTo(a,c,b){a.multiplyTo(c,b);this.reduce(b)}Barrett.prototype.convert=barrettConvert;Barrett.prototype.revert=barrettRevert;Barrett.prototype.reduce=barrettReduce;Barrett.prototype.mulTo=barrettMulTo;Barrett.prototype.sqrTo=barrettSqrTo;function bnModPow(q,f){var o=q.bitLength(),h,b=nbv(1),v;if(o<=0){return b}else{if(o<18){h=1}else{if(o<48){h=3}else{if(o<144){h=4}else{if(o<768){h=5}else{h=6}}}}}if(o<8){v=new Classic(f)}else{if(f.isEven()){v=new Barrett(f)}else{v=new Montgomery(f)}}var p=new Array(),d=3,s=h-1,a=(1<<h)-1;p[1]=v.convert(this);if(h>1){var A=nbi();v.sqrTo(p[1],A);while(d<=a){p[d]=nbi();v.mulTo(A,p[d-2],p[d]);d+=2}}var l=q.t-1,x,u=true,c=nbi(),y;o=nbits(q[l])-1;while(l>=0){if(o>=s){x=(q[l]>>(o-s))&a}else{x=(q[l]&((1<<(o+1))-1))<<(s-o);if(l>0){x|=q[l-1]>>(this.DB+o-s)}}d=h;while((x&1)==0){x>>=1;--d}if((o-=d)<0){o+=this.DB;--l}if(u){p[x].copyTo(b);u=false}else{while(d>1){v.sqrTo(b,c);v.sqrTo(c,b);d-=2}if(d>0){v.sqrTo(b,c)}else{y=b;b=c;c=y}v.mulTo(c,p[x],b)}while(l>=0&&(q[l]&(1<<o))==0){v.sqrTo(b,c);y=b;b=c;c=y;if(--o<0){o=this.DB-1;--l}}}return v.revert(b)}function bnGCD(c){var b=(this.s<0)?this.negate():this.clone();var h=(c.s<0)?c.negate():c.clone();if(b.compareTo(h)<0){var e=b;b=h;h=e}var d=b.getLowestSetBit(),f=h.getLowestSetBit();if(f<0){return b}if(d<f){f=d}if(f>0){b.rShiftTo(f,b);h.rShiftTo(f,h)}while(b.signum()>0){if((d=b.getLowestSetBit())>0){b.rShiftTo(d,b)}if((d=h.getLowestSetBit())>0){h.rShiftTo(d,h)}if(b.compareTo(h)>=0){b.subTo(h,b);b.rShiftTo(1,b)}else{h.subTo(b,h);h.rShiftTo(1,h)}}if(f>0){h.lShiftTo(f,h)}return h}function bnpModInt(e){if(e<=0){return 0}var c=this.DV%e,b=(this.s<0)?e-1:0;if(this.t>0){if(c==0){b=this[0]%e}else{for(var a=this.t-1;a>=0;--a){b=(c*b+this[a])%e}}}return b}function bnModInverse(f){var j=f.isEven();if((this.isEven()&&j)||f.signum()==0){return BigInteger.ZERO}var i=f.clone(),h=this.clone();var g=nbv(1),e=nbv(0),l=nbv(0),k=nbv(1);while(i.signum()!=0){while(i.isEven()){i.rShiftTo(1,i);if(j){if(!g.isEven()||!e.isEven()){g.addTo(this,g);e.subTo(f,e)}g.rShiftTo(1,g)}else{if(!e.isEven()){e.subTo(f,e)}}e.rShiftTo(1,e)}while(h.isEven()){h.rShiftTo(1,h);if(j){if(!l.isEven()||!k.isEven()){l.addTo(this,l);k.subTo(f,k)}l.rShiftTo(1,l)}else{if(!k.isEven()){k.subTo(f,k)}}k.rShiftTo(1,k)}if(i.compareTo(h)>=0){i.subTo(h,i);if(j){g.subTo(l,g)}e.subTo(k,e)}else{h.subTo(i,h);if(j){l.subTo(g,l)}k.subTo(e,k)}}if(h.compareTo(BigInteger.ONE)!=0){return BigInteger.ZERO}if(k.compareTo(f)>=0){return k.subtract(f)}if(k.signum()<0){k.addTo(f,k)}else{return k}if(k.signum()<0){return k.add(f)}else{return k}}var lowprimes=[2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257,263,269,271,277,281,283,293,307,311,313,317,331,337,347,349,353,359,367,373,379,383,389,397,401,409,419,421,431,433,439,443,449,457,461,463,467,479,487,491,499,503,509,521,523,541,547,557,563,569,571,577,587,593,599,601,607,613,617,619,631,641,643,647,653,659,661,673,677,683,691,701,709,719,727,733,739,743,751,757,761,769,773,787,797,809,811,821,823,827,829,839,853,857,859,863,877,881,883,887,907,911,919,929,937,941,947,953,967,971,977,983,991,997];var lplim=(1<<26)/lowprimes[lowprimes.length-1];function bnIsProbablePrime(e){var d,b=this.abs();if(b.t==1&&b[0]<=lowprimes[lowprimes.length-1]){for(d=0;d<lowprimes.length;++d){if(b[0]==lowprimes[d]){return true}}return false}if(b.isEven()){return false}d=1;while(d<lowprimes.length){var a=lowprimes[d],c=d+1;while(c<lowprimes.length&&a<lplim){a*=lowprimes[c++]}a=b.modInt(a);while(d<c){if(a%lowprimes[d++]==0){return false}}}return b.millerRabin(e)}function bnpMillerRabin(f){var g=this.subtract(BigInteger.ONE);var c=g.getLowestSetBit();if(c<=0){return false}var h=g.shiftRight(c);f=(f+1)>>1;if(f>lowprimes.length){f=lowprimes.length}var b=nbi();for(var e=0;e<f;++e){b.fromInt(lowprimes[Math.floor(Math.random()*lowprimes.length)]);var l=b.modPow(h,this);if(l.compareTo(BigInteger.ONE)!=0&&l.compareTo(g)!=0){var d=1;while(d++<c&&l.compareTo(g)!=0){l=l.modPowInt(2,this);if(l.compareTo(BigInteger.ONE)==0){return false}}if(l.compareTo(g)!=0){return false}}}return true}BigInteger.prototype.chunkSize=bnpChunkSize;BigInteger.prototype.toRadix=bnpToRadix;BigInteger.prototype.fromRadix=bnpFromRadix;BigInteger.prototype.fromNumber=bnpFromNumber;BigInteger.prototype.bitwiseTo=bnpBitwiseTo;BigInteger.prototype.changeBit=bnpChangeBit;BigInteger.prototype.addTo=bnpAddTo;BigInteger.prototype.dMultiply=bnpDMultiply;BigInteger.prototype.dAddOffset=bnpDAddOffset;BigInteger.prototype.multiplyLowerTo=bnpMultiplyLowerTo;BigInteger.prototype.multiplyUpperTo=bnpMultiplyUpperTo;BigInteger.prototype.modInt=bnpModInt;BigInteger.prototype.millerRabin=bnpMillerRabin;BigInteger.prototype.clone=bnClone;BigInteger.prototype.intValue=bnIntValue;BigInteger.prototype.byteValue=bnByteValue;BigInteger.prototype.shortValue=bnShortValue;BigInteger.prototype.signum=bnSigNum;BigInteger.prototype.toByteArray=bnToByteArray;BigInteger.prototype.equals=bnEquals;BigInteger.prototype.min=bnMin;BigInteger.prototype.max=bnMax;BigInteger.prototype.and=bnAnd;BigInteger.prototype.or=bnOr;BigInteger.prototype.xor=bnXor;BigInteger.prototype.andNot=bnAndNot;BigInteger.prototype.not=bnNot;BigInteger.prototype.shiftLeft=bnShiftLeft;BigInteger.prototype.shiftRight=bnShiftRight;BigInteger.prototype.getLowestSetBit=bnGetLowestSetBit;BigInteger.prototype.bitCount=bnBitCount;BigInteger.prototype.testBit=bnTestBit;BigInteger.prototype.setBit=bnSetBit;BigInteger.prototype.clearBit=bnClearBit;BigInteger.prototype.flipBit=bnFlipBit;BigInteger.prototype.add=bnAdd;BigInteger.prototype.subtract=bnSubtract;BigInteger.prototype.multiply=bnMultiply;BigInteger.prototype.divide=bnDivide;BigInteger.prototype.remainder=bnRemainder;BigInteger.prototype.divideAndRemainder=bnDivideAndRemainder;BigInteger.prototype.modPow=bnModPow;BigInteger.prototype.modInverse=bnModInverse;BigInteger.prototype.pow=bnPow;BigInteger.prototype.gcd=bnGCD;BigInteger.prototype.isProbablePrime=bnIsProbablePrime;BigInteger.prototype.square=bnSquare;
    /*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
     */
    function Arcfour(){this.i=0;this.j=0;this.S=new Array()}function ARC4init(d){var c,a,b;for(c=0;c<256;++c){this.S[c]=c}a=0;for(c=0;c<256;++c){a=(a+this.S[c]+d[c%d.length])&255;b=this.S[c];this.S[c]=this.S[a];this.S[a]=b}this.i=0;this.j=0}function ARC4next(){var a;this.i=(this.i+1)&255;this.j=(this.j+this.S[this.i])&255;a=this.S[this.i];this.S[this.i]=this.S[this.j];this.S[this.j]=a;return this.S[(a+this.S[this.i])&255]}Arcfour.prototype.init=ARC4init;Arcfour.prototype.next=ARC4next;function prng_newstate(){return new Arcfour()}var rng_psize=256;
    /*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
     */
    var rng_state;var rng_pool;var rng_pptr;function rng_seed_int(a){rng_pool[rng_pptr++]^=a&255;rng_pool[rng_pptr++]^=(a>>8)&255;rng_pool[rng_pptr++]^=(a>>16)&255;rng_pool[rng_pptr++]^=(a>>24)&255;if(rng_pptr>=rng_psize){rng_pptr-=rng_psize}}function rng_seed_time(){rng_seed_int(new Date().getTime())}if(rng_pool==null){rng_pool=new Array();rng_pptr=0;var t;if(window!==undefined&&(window.crypto!==undefined||window.msCrypto!==undefined)){var crypto=window.crypto||window.msCrypto;if(crypto.getRandomValues){var ua=new Uint8Array(32);crypto.getRandomValues(ua);for(t=0;t<32;++t){rng_pool[rng_pptr++]=ua[t]}}else{if(navigator.appName=="Netscape"&&navigator.appVersion<"5"){var z=window.crypto.random(32);for(t=0;t<z.length;++t){rng_pool[rng_pptr++]=z.charCodeAt(t)&255}}}}while(rng_pptr<rng_psize){t=Math.floor(65536*Math.random());rng_pool[rng_pptr++]=t>>>8;rng_pool[rng_pptr++]=t&255}rng_pptr=0;rng_seed_time()}function rng_get_byte(){if(rng_state==null){rng_seed_time();rng_state=prng_newstate();rng_state.init(rng_pool);for(rng_pptr=0;rng_pptr<rng_pool.length;++rng_pptr){rng_pool[rng_pptr]=0}rng_pptr=0}return rng_state.next()}function rng_get_bytes(b){var a;for(a=0;a<b.length;++a){b[a]=rng_get_byte()}}function SecureRandom(){}SecureRandom.prototype.nextBytes=rng_get_bytes;
    /*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
     */
    function parseBigInt(b,a){return new BigInteger(b,a)}function linebrk(c,d){var a="";var b=0;while(b+d<c.length){a+=c.substring(b,b+d)+"\n";b+=d}return a+c.substring(b,c.length)}function byte2Hex(a){if(a<16){return"0"+a.toString(16)}else{return a.toString(16)}}function pkcs1pad2(e,h){if(h<e.length+11){alert("Message too long for RSA");return null}var g=new Array();var d=e.length-1;while(d>=0&&h>0){var f=e.charCodeAt(d--);if(f<128){g[--h]=f}else{if((f>127)&&(f<2048)){g[--h]=(f&63)|128;g[--h]=(f>>6)|192}else{g[--h]=(f&63)|128;g[--h]=((f>>6)&63)|128;g[--h]=(f>>12)|224}}}g[--h]=0;var b=new SecureRandom();var a=new Array();while(h>2){a[0]=0;while(a[0]==0){b.nextBytes(a)}g[--h]=a[0]}g[--h]=2;g[--h]=0;return new BigInteger(g)}function oaep_mgf1_arr(c,a,e){var b="",d=0;while(b.length<a){b+=e(String.fromCharCode.apply(String,c.concat([(d&4278190080)>>24,(d&16711680)>>16,(d&65280)>>8,d&255])));d+=1}return b}function oaep_pad(q,a,f,l){var c=KJUR.crypto.MessageDigest;var o=KJUR.crypto.Util;var b=null;if(!f){f="sha1"}if(typeof f==="string"){b=c.getCanonicalAlgName(f);l=c.getHashLength(b);f=function(i){return hextorstr(o.hashString(i,b))}}if(q.length+2*l+2>a){throw"Message too long for RSA"}var k="",e;for(e=0;e<a-q.length-2*l-2;e+=1){k+="\x00"}var h=f("")+k+"\x01"+q;var g=new Array(l);new SecureRandom().nextBytes(g);var j=oaep_mgf1_arr(g,h.length,f);var p=[];for(e=0;e<h.length;e+=1){p[e]=h.charCodeAt(e)^j.charCodeAt(e)}var m=oaep_mgf1_arr(p,g.length,f);var d=[0];for(e=0;e<g.length;e+=1){d[e+1]=g[e]^m.charCodeAt(e)}return new BigInteger(d.concat(p))}function RSAKey(){this.n=null;this.e=0;this.d=null;this.p=null;this.q=null;this.dmp1=null;this.dmq1=null;this.coeff=null}function RSASetPublic(b,a){this.isPublic=true;this.isPrivate=false;if(typeof b!=="string"){this.n=b;this.e=a}else{if(b!=null&&a!=null&&b.length>0&&a.length>0){this.n=parseBigInt(b,16);this.e=parseInt(a,16)}else{throw"Invalid RSA public key"}}}function RSADoPublic(a){return a.modPowInt(this.e,this.n)}function RSAEncrypt(d){var a=pkcs1pad2(d,(this.n.bitLength()+7)>>3);if(a==null){return null}var e=this.doPublic(a);if(e==null){return null}var b=e.toString(16);if((b.length&1)==0){return b}else{return"0"+b}}function RSAEncryptOAEP(f,e,b){var a=oaep_pad(f,(this.n.bitLength()+7)>>3,e,b);if(a==null){return null}var g=this.doPublic(a);if(g==null){return null}var d=g.toString(16);if((d.length&1)==0){return d}else{return"0"+d}}RSAKey.prototype.doPublic=RSADoPublic;RSAKey.prototype.setPublic=RSASetPublic;RSAKey.prototype.encrypt=RSAEncrypt;RSAKey.prototype.encryptOAEP=RSAEncryptOAEP;RSAKey.prototype.type="RSA";
    /*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
     */
    function pkcs1unpad2(g,j){var a=g.toByteArray();var f=0;while(f<a.length&&a[f]==0){++f}if(a.length-f!=j-1||a[f]!=2){return null}++f;while(a[f]!=0){if(++f>=a.length){return null}}var e="";while(++f<a.length){var h=a[f]&255;if(h<128){e+=String.fromCharCode(h)}else{if((h>191)&&(h<224)){e+=String.fromCharCode(((h&31)<<6)|(a[f+1]&63));++f}else{e+=String.fromCharCode(((h&15)<<12)|((a[f+1]&63)<<6)|(a[f+2]&63));f+=2}}}return e}function oaep_mgf1_str(c,a,e){var b="",d=0;while(b.length<a){b+=e(c+String.fromCharCode.apply(String,[(d&4278190080)>>24,(d&16711680)>>16,(d&65280)>>8,d&255]));d+=1}return b}function oaep_unpad(o,b,g,p){var e=KJUR.crypto.MessageDigest;var r=KJUR.crypto.Util;var c=null;if(!g){g="sha1"}if(typeof g==="string"){c=e.getCanonicalAlgName(g);p=e.getHashLength(c);g=function(d){return hextorstr(r.hashString(d,c))}}o=o.toByteArray();var h;for(h=0;h<o.length;h+=1){o[h]&=255}while(o.length<b){o.unshift(0)}o=String.fromCharCode.apply(String,o);if(o.length<2*p+2){throw"Cipher too short"}var f=o.substr(1,p);var s=o.substr(p+1);var q=oaep_mgf1_str(s,p,g);var k=[],h;for(h=0;h<f.length;h+=1){k[h]=f.charCodeAt(h)^q.charCodeAt(h)}var l=oaep_mgf1_str(String.fromCharCode.apply(String,k),o.length-p,g);var j=[];for(h=0;h<s.length;h+=1){j[h]=s.charCodeAt(h)^l.charCodeAt(h)}j=String.fromCharCode.apply(String,j);if(j.substr(0,p)!==g("")){throw"Hash mismatch"}j=j.substr(p);var a=j.indexOf("\x01");var m=(a!=-1)?j.substr(0,a).lastIndexOf("\x00"):-1;if(m+1!=a){throw"Malformed data"}return j.substr(a+1)}function RSASetPrivate(c,a,b){this.isPrivate=true;if(typeof c!=="string"){this.n=c;this.e=a;this.d=b}else{if(c!=null&&a!=null&&c.length>0&&a.length>0){this.n=parseBigInt(c,16);this.e=parseInt(a,16);this.d=parseBigInt(b,16)}else{alert("Invalid RSA private key")}}}function RSASetPrivateEx(g,d,e,c,b,a,h,f){this.isPrivate=true;this.isPublic=false;if(g==null){throw"RSASetPrivateEx N == null"}if(d==null){throw"RSASetPrivateEx E == null"}if(g.length==0){throw"RSASetPrivateEx N.length == 0"}if(d.length==0){throw"RSASetPrivateEx E.length == 0"}if(g!=null&&d!=null&&g.length>0&&d.length>0){this.n=parseBigInt(g,16);this.e=parseInt(d,16);this.d=parseBigInt(e,16);this.p=parseBigInt(c,16);this.q=parseBigInt(b,16);this.dmp1=parseBigInt(a,16);this.dmq1=parseBigInt(h,16);this.coeff=parseBigInt(f,16)}else{alert("Invalid RSA private key in RSASetPrivateEx")}}function RSAGenerate(b,i){var a=new SecureRandom();var f=b>>1;this.e=parseInt(i,16);var c=new BigInteger(i,16);for(;;){for(;;){this.p=new BigInteger(b-f,1,a);if(this.p.subtract(BigInteger.ONE).gcd(c).compareTo(BigInteger.ONE)==0&&this.p.isProbablePrime(10)){break}}for(;;){this.q=new BigInteger(f,1,a);if(this.q.subtract(BigInteger.ONE).gcd(c).compareTo(BigInteger.ONE)==0&&this.q.isProbablePrime(10)){break}}if(this.p.compareTo(this.q)<=0){var h=this.p;this.p=this.q;this.q=h}var g=this.p.subtract(BigInteger.ONE);var d=this.q.subtract(BigInteger.ONE);var e=g.multiply(d);if(e.gcd(c).compareTo(BigInteger.ONE)==0){this.n=this.p.multiply(this.q);this.d=c.modInverse(e);this.dmp1=this.d.mod(g);this.dmq1=this.d.mod(d);this.coeff=this.q.modInverse(this.p);break}}this.isPrivate=true}function RSADoPrivate(a){if(this.p==null||this.q==null){return a.modPow(this.d,this.n)}var c=a.mod(this.p).modPow(this.dmp1,this.p);var b=a.mod(this.q).modPow(this.dmq1,this.q);while(c.compareTo(b)<0){c=c.add(this.p)}return c.subtract(b).multiply(this.coeff).mod(this.p).multiply(this.q).add(b)}function RSADecrypt(b){var d=parseBigInt(b,16);var a=this.doPrivate(d);if(a==null){return null}return pkcs1unpad2(a,(this.n.bitLength()+7)>>3)}function RSADecryptOAEP(e,d,b){var f=parseBigInt(e,16);var a=this.doPrivate(f);if(a==null){return null}return oaep_unpad(a,(this.n.bitLength()+7)>>3,d,b)}RSAKey.prototype.doPrivate=RSADoPrivate;RSAKey.prototype.setPrivate=RSASetPrivate;RSAKey.prototype.setPrivateEx=RSASetPrivateEx;RSAKey.prototype.generate=RSAGenerate;RSAKey.prototype.decrypt=RSADecrypt;RSAKey.prototype.decryptOAEP=RSADecryptOAEP;
    /*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
     */
    function ECFieldElementFp(b,a){this.x=a;this.q=b}function feFpEquals(a){if(a==this){return true}return(this.q.equals(a.q)&&this.x.equals(a.x))}function feFpToBigInteger(){return this.x}function feFpNegate(){return new ECFieldElementFp(this.q,this.x.negate().mod(this.q))}function feFpAdd(a){return new ECFieldElementFp(this.q,this.x.add(a.toBigInteger()).mod(this.q))}function feFpSubtract(a){return new ECFieldElementFp(this.q,this.x.subtract(a.toBigInteger()).mod(this.q))}function feFpMultiply(a){return new ECFieldElementFp(this.q,this.x.multiply(a.toBigInteger()).mod(this.q))}function feFpSquare(){return new ECFieldElementFp(this.q,this.x.square().mod(this.q))}function feFpDivide(a){return new ECFieldElementFp(this.q,this.x.multiply(a.toBigInteger().modInverse(this.q)).mod(this.q))}ECFieldElementFp.prototype.equals=feFpEquals;ECFieldElementFp.prototype.toBigInteger=feFpToBigInteger;ECFieldElementFp.prototype.negate=feFpNegate;ECFieldElementFp.prototype.add=feFpAdd;ECFieldElementFp.prototype.subtract=feFpSubtract;ECFieldElementFp.prototype.multiply=feFpMultiply;ECFieldElementFp.prototype.square=feFpSquare;ECFieldElementFp.prototype.divide=feFpDivide;function ECPointFp(c,a,d,b){this.curve=c;this.x=a;this.y=d;if(b==null){this.z=BigInteger.ONE}else{this.z=b}this.zinv=null}function pointFpGetX(){if(this.zinv==null){this.zinv=this.z.modInverse(this.curve.q)}return this.curve.fromBigInteger(this.x.toBigInteger().multiply(this.zinv).mod(this.curve.q))}function pointFpGetY(){if(this.zinv==null){this.zinv=this.z.modInverse(this.curve.q)}return this.curve.fromBigInteger(this.y.toBigInteger().multiply(this.zinv).mod(this.curve.q))}function pointFpEquals(a){if(a==this){return true}if(this.isInfinity()){return a.isInfinity()}if(a.isInfinity()){return this.isInfinity()}var c,b;c=a.y.toBigInteger().multiply(this.z).subtract(this.y.toBigInteger().multiply(a.z)).mod(this.curve.q);if(!c.equals(BigInteger.ZERO)){return false}b=a.x.toBigInteger().multiply(this.z).subtract(this.x.toBigInteger().multiply(a.z)).mod(this.curve.q);return b.equals(BigInteger.ZERO)}function pointFpIsInfinity(){if((this.x==null)&&(this.y==null)){return true}return this.z.equals(BigInteger.ZERO)&&!this.y.toBigInteger().equals(BigInteger.ZERO)}function pointFpNegate(){return new ECPointFp(this.curve,this.x,this.y.negate(),this.z)}function pointFpAdd(l){if(this.isInfinity()){return l}if(l.isInfinity()){return this}var p=l.y.toBigInteger().multiply(this.z).subtract(this.y.toBigInteger().multiply(l.z)).mod(this.curve.q);var o=l.x.toBigInteger().multiply(this.z).subtract(this.x.toBigInteger().multiply(l.z)).mod(this.curve.q);if(BigInteger.ZERO.equals(o)){if(BigInteger.ZERO.equals(p)){return this.twice()}return this.curve.getInfinity()}var j=new BigInteger("3");var e=this.x.toBigInteger();var n=this.y.toBigInteger();var c=l.x.toBigInteger();var k=l.y.toBigInteger();var m=o.square();var i=m.multiply(o);var d=e.multiply(m);var g=p.square().multiply(this.z);var a=g.subtract(d.shiftLeft(1)).multiply(l.z).subtract(i).multiply(o).mod(this.curve.q);var h=d.multiply(j).multiply(p).subtract(n.multiply(i)).subtract(g.multiply(p)).multiply(l.z).add(p.multiply(i)).mod(this.curve.q);var f=i.multiply(this.z).multiply(l.z).mod(this.curve.q);return new ECPointFp(this.curve,this.curve.fromBigInteger(a),this.curve.fromBigInteger(h),f)}function pointFpTwice(){if(this.isInfinity()){return this}if(this.y.toBigInteger().signum()==0){return this.curve.getInfinity()}var g=new BigInteger("3");var c=this.x.toBigInteger();var h=this.y.toBigInteger();var e=h.multiply(this.z);var j=e.multiply(h).mod(this.curve.q);var i=this.curve.a.toBigInteger();var k=c.square().multiply(g);if(!BigInteger.ZERO.equals(i)){k=k.add(this.z.square().multiply(i))}k=k.mod(this.curve.q);var b=k.square().subtract(c.shiftLeft(3).multiply(j)).shiftLeft(1).multiply(e).mod(this.curve.q);var f=k.multiply(g).multiply(c).subtract(j.shiftLeft(1)).shiftLeft(2).multiply(j).subtract(k.square().multiply(k)).mod(this.curve.q);var d=e.square().multiply(e).shiftLeft(3).mod(this.curve.q);return new ECPointFp(this.curve,this.curve.fromBigInteger(b),this.curve.fromBigInteger(f),d)}function pointFpMultiply(b){if(this.isInfinity()){return this}if(b.signum()==0){return this.curve.getInfinity()}var g=b;var f=g.multiply(new BigInteger("3"));var l=this.negate();var d=this;var c;for(c=f.bitLength()-2;c>0;--c){d=d.twice();var a=f.testBit(c);var j=g.testBit(c);if(a!=j){d=d.add(a?this:l)}}return d}function pointFpMultiplyTwo(c,a,b){var d;if(c.bitLength()>b.bitLength()){d=c.bitLength()-1}else{d=b.bitLength()-1}var f=this.curve.getInfinity();var e=this.add(a);while(d>=0){f=f.twice();if(c.testBit(d)){if(b.testBit(d)){f=f.add(e)}else{f=f.add(this)}}else{if(b.testBit(d)){f=f.add(a)}}--d}return f}ECPointFp.prototype.getX=pointFpGetX;ECPointFp.prototype.getY=pointFpGetY;ECPointFp.prototype.equals=pointFpEquals;ECPointFp.prototype.isInfinity=pointFpIsInfinity;ECPointFp.prototype.negate=pointFpNegate;ECPointFp.prototype.add=pointFpAdd;ECPointFp.prototype.twice=pointFpTwice;ECPointFp.prototype.multiply=pointFpMultiply;ECPointFp.prototype.multiplyTwo=pointFpMultiplyTwo;function ECCurveFp(e,d,c){this.q=e;this.a=this.fromBigInteger(d);this.b=this.fromBigInteger(c);this.infinity=new ECPointFp(this,null,null)}function curveFpGetQ(){return this.q}function curveFpGetA(){return this.a}function curveFpGetB(){return this.b}function curveFpEquals(a){if(a==this){return true}return(this.q.equals(a.q)&&this.a.equals(a.a)&&this.b.equals(a.b))}function curveFpGetInfinity(){return this.infinity}function curveFpFromBigInteger(a){return new ECFieldElementFp(this.q,a)}function curveFpDecodePointHex(d){switch(parseInt(d.substr(0,2),16)){case 0:return this.infinity;case 2:case 3:return null;case 4:case 6:case 7:var a=(d.length-2)/2;var c=d.substr(2,a);var b=d.substr(a+2,a);return new ECPointFp(this,this.fromBigInteger(new BigInteger(c,16)),this.fromBigInteger(new BigInteger(b,16)));default:return null}}ECCurveFp.prototype.getQ=curveFpGetQ;ECCurveFp.prototype.getA=curveFpGetA;ECCurveFp.prototype.getB=curveFpGetB;ECCurveFp.prototype.equals=curveFpEquals;ECCurveFp.prototype.getInfinity=curveFpGetInfinity;ECCurveFp.prototype.fromBigInteger=curveFpFromBigInteger;ECCurveFp.prototype.decodePointHex=curveFpDecodePointHex;
    /*! (c) Stefan Thomas | https://github.com/bitcoinjs/bitcoinjs-lib
     */
    ECFieldElementFp.prototype.getByteLength=function(){return Math.floor((this.toBigInteger().bitLength()+7)/8)};ECPointFp.prototype.getEncoded=function(c){var d=function(h,f){var g=h.toByteArrayUnsigned();if(f<g.length){g=g.slice(g.length-f)}else{while(f>g.length){g.unshift(0)}}return g};var a=this.getX().toBigInteger();var e=this.getY().toBigInteger();var b=d(a,32);if(c){if(e.isEven()){b.unshift(2)}else{b.unshift(3)}}else{b.unshift(4);b=b.concat(d(e,32))}return b};ECPointFp.decodeFrom=function(g,c){var f=c[0];var e=c.length-1;var d=c.slice(1,1+e/2);var b=c.slice(1+e/2,1+e);d.unshift(0);b.unshift(0);var a=new BigInteger(d);var h=new BigInteger(b);return new ECPointFp(g,g.fromBigInteger(a),g.fromBigInteger(h))};ECPointFp.decodeFromHex=function(g,c){var f=c.substr(0,2);var e=c.length-2;var d=c.substr(2,e/2);var b=c.substr(2+e/2,e/2);var a=new BigInteger(d,16);var h=new BigInteger(b,16);return new ECPointFp(g,g.fromBigInteger(a),g.fromBigInteger(h))};ECPointFp.prototype.add2D=function(c){if(this.isInfinity()){return c}if(c.isInfinity()){return this}if(this.x.equals(c.x)){if(this.y.equals(c.y)){return this.twice()}return this.curve.getInfinity()}var g=c.x.subtract(this.x);var e=c.y.subtract(this.y);var a=e.divide(g);var d=a.square().subtract(this.x).subtract(c.x);var f=a.multiply(this.x.subtract(d)).subtract(this.y);return new ECPointFp(this.curve,d,f)};ECPointFp.prototype.twice2D=function(){if(this.isInfinity()){return this}if(this.y.toBigInteger().signum()==0){return this.curve.getInfinity()}var b=this.curve.fromBigInteger(BigInteger.valueOf(2));var e=this.curve.fromBigInteger(BigInteger.valueOf(3));var a=this.x.square().multiply(e).add(this.curve.a).divide(this.y.multiply(b));var c=a.square().subtract(this.x.multiply(b));var d=a.multiply(this.x.subtract(c)).subtract(this.y);return new ECPointFp(this.curve,c,d)};ECPointFp.prototype.multiply2D=function(b){if(this.isInfinity()){return this}if(b.signum()==0){return this.curve.getInfinity()}var g=b;var f=g.multiply(new BigInteger("3"));var l=this.negate();var d=this;var c;for(c=f.bitLength()-2;c>0;--c){d=d.twice();var a=f.testBit(c);var j=g.testBit(c);if(a!=j){d=d.add2D(a?this:l)}}return d};ECPointFp.prototype.isOnCurve=function(){var d=this.getX().toBigInteger();var i=this.getY().toBigInteger();var f=this.curve.getA().toBigInteger();var c=this.curve.getB().toBigInteger();var h=this.curve.getQ();var e=i.multiply(i).mod(h);var g=d.multiply(d).multiply(d).add(f.multiply(d)).add(c).mod(h);return e.equals(g)};ECPointFp.prototype.toString=function(){return"("+this.getX().toBigInteger().toString()+","+this.getY().toBigInteger().toString()+")"};ECPointFp.prototype.validate=function(){var c=this.curve.getQ();if(this.isInfinity()){throw new Error("Point is at infinity.")}var a=this.getX().toBigInteger();var b=this.getY().toBigInteger();if(a.compareTo(BigInteger.ONE)<0||a.compareTo(c.subtract(BigInteger.ONE))>0){throw new Error("x coordinate out of bounds")}if(b.compareTo(BigInteger.ONE)<0||b.compareTo(c.subtract(BigInteger.ONE))>0){throw new Error("y coordinate out of bounds")}if(!this.isOnCurve()){throw new Error("Point is not on the curve.")}if(this.multiply(c).isInfinity()){throw new Error("Point is not a scalar multiple of G.")}return true};
    /*! Mike Samuel (c) 2009 | code.google.com/p/json-sans-eval
     */
    var jsonParse=(function(){var e="(?:-?\\b(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?(?:[eE][+-]?[0-9]+)?\\b)";var j='(?:[^\\0-\\x08\\x0a-\\x1f"\\\\]|\\\\(?:["/\\\\bfnrt]|u[0-9A-Fa-f]{4}))';var i='(?:"'+j+'*")';var d=new RegExp("(?:false|true|null|[\\{\\}\\[\\]]|"+e+"|"+i+")","g");var k=new RegExp("\\\\(?:([^u])|u(.{4}))","g");var g={'"':'"',"/":"/","\\":"\\",b:"\b",f:"\f",n:"\n",r:"\r",t:"\t"};function h(l,m,n){return m?g[m]:String.fromCharCode(parseInt(n,16))}var c=new String("");var a="\\";var f={"{":Object,"[":Array};var b=Object.hasOwnProperty;return function(u,q){var p=u.match(d);var x;var v=p[0];var l=false;if("{"===v){x={}}else{if("["===v){x=[]}else{x=[];l=true}}var t;var r=[x];for(var o=1-l,m=p.length;o<m;++o){v=p[o];var w;switch(v.charCodeAt(0)){default:w=r[0];w[t||w.length]=+(v);t=void 0;break;case 34:v=v.substring(1,v.length-1);if(v.indexOf(a)!==-1){v=v.replace(k,h)}w=r[0];if(!t){if(w instanceof Array){t=w.length}else{t=v||c;break}}w[t]=v;t=void 0;break;case 91:w=r[0];r.unshift(w[t||w.length]=[]);t=void 0;break;case 93:r.shift();break;case 102:w=r[0];w[t||w.length]=false;t=void 0;break;case 110:w=r[0];w[t||w.length]=null;t=void 0;break;case 116:w=r[0];w[t||w.length]=true;t=void 0;break;case 123:w=r[0];r.unshift(w[t||w.length]={});t=void 0;break;case 125:r.shift();break}}if(l){if(r.length!==1){throw new Error()}x=x[0]}else{if(r.length){throw new Error()}}if(q){var s=function(C,B){var D=C[B];if(D&&typeof D==="object"){var n=null;for(var z in D){if(b.call(D,z)&&D!==C){var y=s(D,z);if(y!==void 0){D[z]=y}else{if(!n){n=[]}n.push(z)}}}if(n){for(var A=n.length;--A>=0;){delete D[n[A]]}}}return q.call(C,B,D)};x=s({"":x},"")}return x}})();
    if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.asn1=="undefined"||!KJUR.asn1){KJUR.asn1={}}KJUR.asn1.ASN1Util=new function(){this.integerToByteHex=function(a){var b=a.toString(16);if((b.length%2)==1){b="0"+b}return b};this.bigIntToMinTwosComplementsHex=function(j){var f=j.toString(16);if(f.substr(0,1)!="-"){if(f.length%2==1){f="0"+f}else{if(!f.match(/^[0-7]/)){f="00"+f}}}else{var a=f.substr(1);var e=a.length;if(e%2==1){e+=1}else{if(!f.match(/^[0-7]/)){e+=2}}var g="";for(var d=0;d<e;d++){g+="f"}var c=new BigInteger(g,16);var b=c.xor(j).add(BigInteger.ONE);f=b.toString(16).replace(/^-/,"")}return f};this.getPEMStringFromHex=function(a,b){return hextopem(a,b)};this.newObject=function(k){var D=KJUR,n=D.asn1,z=n.DERBoolean,e=n.DERInteger,s=n.DERBitString,h=n.DEROctetString,v=n.DERNull,w=n.DERObjectIdentifier,l=n.DEREnumerated,g=n.DERUTF8String,f=n.DERNumericString,y=n.DERPrintableString,u=n.DERTeletexString,p=n.DERIA5String,C=n.DERUTCTime,j=n.DERGeneralizedTime,m=n.DERSequence,c=n.DERSet,r=n.DERTaggedObject,o=n.ASN1Util.newObject;var t=Object.keys(k);if(t.length!=1){throw"key of param shall be only one."}var F=t[0];if(":bool:int:bitstr:octstr:null:oid:enum:utf8str:numstr:prnstr:telstr:ia5str:utctime:gentime:seq:set:tag:".indexOf(":"+F+":")==-1){throw"undefined key: "+F}if(F=="bool"){return new z(k[F])}if(F=="int"){return new e(k[F])}if(F=="bitstr"){return new s(k[F])}if(F=="octstr"){return new h(k[F])}if(F=="null"){return new v(k[F])}if(F=="oid"){return new w(k[F])}if(F=="enum"){return new l(k[F])}if(F=="utf8str"){return new g(k[F])}if(F=="numstr"){return new f(k[F])}if(F=="prnstr"){return new y(k[F])}if(F=="telstr"){return new u(k[F])}if(F=="ia5str"){return new p(k[F])}if(F=="utctime"){return new C(k[F])}if(F=="gentime"){return new j(k[F])}if(F=="seq"){var d=k[F];var E=[];for(var x=0;x<d.length;x++){var B=o(d[x]);E.push(B)}return new m({array:E})}if(F=="set"){var d=k[F];var E=[];for(var x=0;x<d.length;x++){var B=o(d[x]);E.push(B)}return new c({array:E})}if(F=="tag"){var A=k[F];if(Object.prototype.toString.call(A)==="[object Array]"&&A.length==3){var q=o(A[2]);return new r({tag:A[0],explicit:A[1],obj:q})}else{var b={};if(A.explicit!==undefined){b.explicit=A.explicit}if(A.tag!==undefined){b.tag=A.tag}if(A.obj===undefined){throw"obj shall be specified for 'tag'."}b.obj=o(A.obj);return new r(b)}}};this.jsonToASN1HEX=function(b){var a=this.newObject(b);return a.getEncodedHex()}};KJUR.asn1.ASN1Util.oidHexToInt=function(a){var j="";var k=parseInt(a.substr(0,2),16);var d=Math.floor(k/40);var c=k%40;var j=d+"."+c;var e="";for(var f=2;f<a.length;f+=2){var g=parseInt(a.substr(f,2),16);var h=("00000000"+g.toString(2)).slice(-8);e=e+h.substr(1,7);if(h.substr(0,1)=="0"){var b=new BigInteger(e,2);j=j+"."+b.toString(10);e=""}}return j};KJUR.asn1.ASN1Util.oidIntToHex=function(f){var e=function(a){var k=a.toString(16);if(k.length==1){k="0"+k}return k};var d=function(o){var n="";var k=new BigInteger(o,10);var a=k.toString(2);var l=7-a.length%7;if(l==7){l=0}var q="";for(var m=0;m<l;m++){q+="0"}a=q+a;for(var m=0;m<a.length-1;m+=7){var p=a.substr(m,7);if(m!=a.length-7){p="1"+p}n+=e(parseInt(p,2))}return n};if(!f.match(/^[0-9.]+$/)){throw"malformed oid string: "+f}var g="";var b=f.split(".");var j=parseInt(b[0])*40+parseInt(b[1]);g+=e(j);b.splice(0,2);for(var c=0;c<b.length;c++){g+=d(b[c])}return g};KJUR.asn1.ASN1Object=function(){var c=true;var b=null;var d="00";var e="00";var a="";this.getLengthHexFromValue=function(){if(typeof this.hV=="undefined"||this.hV==null){throw"this.hV is null or undefined."}if(this.hV.length%2==1){throw"value hex must be even length: n="+a.length+",v="+this.hV}var i=this.hV.length/2;var h=i.toString(16);if(h.length%2==1){h="0"+h}if(i<128){return h}else{var g=h.length/2;if(g>15){throw"ASN.1 length too long to represent by 8x: n = "+i.toString(16)}var f=128+g;return f.toString(16)+h}};this.getEncodedHex=function(){if(this.hTLV==null||this.isModified){this.hV=this.getFreshValueHex();this.hL=this.getLengthHexFromValue();this.hTLV=this.hT+this.hL+this.hV;this.isModified=false}return this.hTLV};this.getValueHex=function(){this.getEncodedHex();return this.hV};this.getFreshValueHex=function(){return""}};KJUR.asn1.DERAbstractString=function(c){KJUR.asn1.DERAbstractString.superclass.constructor.call(this);var b=null;var a=null;this.getString=function(){return this.s};this.setString=function(d){this.hTLV=null;this.isModified=true;this.s=d;this.hV=stohex(this.s)};this.setStringHex=function(d){this.hTLV=null;this.isModified=true;this.s=null;this.hV=d};this.getFreshValueHex=function(){return this.hV};if(typeof c!="undefined"){if(typeof c=="string"){this.setString(c)}else{if(typeof c.str!="undefined"){this.setString(c.str)}else{if(typeof c.hex!="undefined"){this.setStringHex(c.hex)}}}}};YAHOO.lang.extend(KJUR.asn1.DERAbstractString,KJUR.asn1.ASN1Object);KJUR.asn1.DERAbstractTime=function(c){KJUR.asn1.DERAbstractTime.superclass.constructor.call(this);var b=null;var a=null;this.localDateToUTC=function(f){utc=f.getTime()+(f.getTimezoneOffset()*60000);var e=new Date(utc);return e};this.formatDate=function(m,o,e){var g=this.zeroPadding;var n=this.localDateToUTC(m);var p=String(n.getFullYear());if(o=="utc"){p=p.substr(2,2)}var l=g(String(n.getMonth()+1),2);var q=g(String(n.getDate()),2);var h=g(String(n.getHours()),2);var i=g(String(n.getMinutes()),2);var j=g(String(n.getSeconds()),2);var r=p+l+q+h+i+j;if(e===true){var f=n.getMilliseconds();if(f!=0){var k=g(String(f),3);k=k.replace(/[0]+$/,"");r=r+"."+k}}return r+"Z"};this.zeroPadding=function(e,d){if(e.length>=d){return e}return new Array(d-e.length+1).join("0")+e};this.getString=function(){return this.s};this.setString=function(d){this.hTLV=null;this.isModified=true;this.s=d;this.hV=stohex(d)};this.setByDateValue=function(h,j,e,d,f,g){var i=new Date(Date.UTC(h,j-1,e,d,f,g,0));this.setByDate(i)};this.getFreshValueHex=function(){return this.hV}};YAHOO.lang.extend(KJUR.asn1.DERAbstractTime,KJUR.asn1.ASN1Object);KJUR.asn1.DERAbstractStructured=function(b){KJUR.asn1.DERAbstractString.superclass.constructor.call(this);var a=null;this.setByASN1ObjectArray=function(c){this.hTLV=null;this.isModified=true;this.asn1Array=c};this.appendASN1Object=function(c){this.hTLV=null;this.isModified=true;this.asn1Array.push(c)};this.asn1Array=new Array();if(typeof b!="undefined"){if(typeof b.array!="undefined"){this.asn1Array=b.array}}};YAHOO.lang.extend(KJUR.asn1.DERAbstractStructured,KJUR.asn1.ASN1Object);KJUR.asn1.DERBoolean=function(){KJUR.asn1.DERBoolean.superclass.constructor.call(this);this.hT="01";this.hTLV="0101ff"};YAHOO.lang.extend(KJUR.asn1.DERBoolean,KJUR.asn1.ASN1Object);KJUR.asn1.DERInteger=function(a){KJUR.asn1.DERInteger.superclass.constructor.call(this);this.hT="02";this.setByBigInteger=function(b){this.hTLV=null;this.isModified=true;this.hV=KJUR.asn1.ASN1Util.bigIntToMinTwosComplementsHex(b)};this.setByInteger=function(c){var b=new BigInteger(String(c),10);this.setByBigInteger(b)};this.setValueHex=function(b){this.hV=b};this.getFreshValueHex=function(){return this.hV};if(typeof a!="undefined"){if(typeof a.bigint!="undefined"){this.setByBigInteger(a.bigint)}else{if(typeof a["int"]!="undefined"){this.setByInteger(a["int"])}else{if(typeof a=="number"){this.setByInteger(a)}else{if(typeof a.hex!="undefined"){this.setValueHex(a.hex)}}}}}};YAHOO.lang.extend(KJUR.asn1.DERInteger,KJUR.asn1.ASN1Object);KJUR.asn1.DERBitString=function(b){if(b!==undefined&&typeof b.obj!=="undefined"){var a=KJUR.asn1.ASN1Util.newObject(b.obj);b.hex="00"+a.getEncodedHex()}KJUR.asn1.DERBitString.superclass.constructor.call(this);this.hT="03";this.setHexValueIncludingUnusedBits=function(c){this.hTLV=null;this.isModified=true;this.hV=c};this.setUnusedBitsAndHexValue=function(c,e){if(c<0||7<c){throw"unused bits shall be from 0 to 7: u = "+c}var d="0"+c;this.hTLV=null;this.isModified=true;this.hV=d+e};this.setByBinaryString=function(e){e=e.replace(/0+$/,"");var f=8-e.length%8;if(f==8){f=0}for(var g=0;g<=f;g++){e+="0"}var j="";for(var g=0;g<e.length-1;g+=8){var d=e.substr(g,8);var c=parseInt(d,2).toString(16);if(c.length==1){c="0"+c}j+=c}this.hTLV=null;this.isModified=true;this.hV="0"+f+j};this.setByBooleanArray=function(e){var d="";for(var c=0;c<e.length;c++){if(e[c]==true){d+="1"}else{d+="0"}}this.setByBinaryString(d)};this.newFalseArray=function(e){var c=new Array(e);for(var d=0;d<e;d++){c[d]=false}return c};this.getFreshValueHex=function(){return this.hV};if(typeof b!="undefined"){if(typeof b=="string"&&b.toLowerCase().match(/^[0-9a-f]+$/)){this.setHexValueIncludingUnusedBits(b)}else{if(typeof b.hex!="undefined"){this.setHexValueIncludingUnusedBits(b.hex)}else{if(typeof b.bin!="undefined"){this.setByBinaryString(b.bin)}else{if(typeof b.array!="undefined"){this.setByBooleanArray(b.array)}}}}}};YAHOO.lang.extend(KJUR.asn1.DERBitString,KJUR.asn1.ASN1Object);KJUR.asn1.DEROctetString=function(b){if(b!==undefined&&typeof b.obj!=="undefined"){var a=KJUR.asn1.ASN1Util.newObject(b.obj);b.hex=a.getEncodedHex()}KJUR.asn1.DEROctetString.superclass.constructor.call(this,b);this.hT="04"};YAHOO.lang.extend(KJUR.asn1.DEROctetString,KJUR.asn1.DERAbstractString);KJUR.asn1.DERNull=function(){KJUR.asn1.DERNull.superclass.constructor.call(this);this.hT="05";this.hTLV="0500"};YAHOO.lang.extend(KJUR.asn1.DERNull,KJUR.asn1.ASN1Object);KJUR.asn1.DERObjectIdentifier=function(c){var b=function(d){var e=d.toString(16);if(e.length==1){e="0"+e}return e};var a=function(k){var j="";var e=new BigInteger(k,10);var d=e.toString(2);var f=7-d.length%7;if(f==7){f=0}var m="";for(var g=0;g<f;g++){m+="0"}d=m+d;for(var g=0;g<d.length-1;g+=7){var l=d.substr(g,7);if(g!=d.length-7){l="1"+l}j+=b(parseInt(l,2))}return j};KJUR.asn1.DERObjectIdentifier.superclass.constructor.call(this);this.hT="06";this.setValueHex=function(d){this.hTLV=null;this.isModified=true;this.s=null;this.hV=d};this.setValueOidString=function(f){if(!f.match(/^[0-9.]+$/)){throw"malformed oid string: "+f}var g="";var d=f.split(".");var j=parseInt(d[0])*40+parseInt(d[1]);g+=b(j);d.splice(0,2);for(var e=0;e<d.length;e++){g+=a(d[e])}this.hTLV=null;this.isModified=true;this.s=null;this.hV=g};this.setValueName=function(e){var d=KJUR.asn1.x509.OID.name2oid(e);if(d!==""){this.setValueOidString(d)}else{throw"DERObjectIdentifier oidName undefined: "+e}};this.getFreshValueHex=function(){return this.hV};if(c!==undefined){if(typeof c==="string"){if(c.match(/^[0-2].[0-9.]+$/)){this.setValueOidString(c)}else{this.setValueName(c)}}else{if(c.oid!==undefined){this.setValueOidString(c.oid)}else{if(c.hex!==undefined){this.setValueHex(c.hex)}else{if(c.name!==undefined){this.setValueName(c.name)}}}}}};YAHOO.lang.extend(KJUR.asn1.DERObjectIdentifier,KJUR.asn1.ASN1Object);KJUR.asn1.DEREnumerated=function(a){KJUR.asn1.DEREnumerated.superclass.constructor.call(this);this.hT="0a";this.setByBigInteger=function(b){this.hTLV=null;this.isModified=true;this.hV=KJUR.asn1.ASN1Util.bigIntToMinTwosComplementsHex(b)};this.setByInteger=function(c){var b=new BigInteger(String(c),10);this.setByBigInteger(b)};this.setValueHex=function(b){this.hV=b};this.getFreshValueHex=function(){return this.hV};if(typeof a!="undefined"){if(typeof a["int"]!="undefined"){this.setByInteger(a["int"])}else{if(typeof a=="number"){this.setByInteger(a)}else{if(typeof a.hex!="undefined"){this.setValueHex(a.hex)}}}}};YAHOO.lang.extend(KJUR.asn1.DEREnumerated,KJUR.asn1.ASN1Object);KJUR.asn1.DERUTF8String=function(a){KJUR.asn1.DERUTF8String.superclass.constructor.call(this,a);this.hT="0c"};YAHOO.lang.extend(KJUR.asn1.DERUTF8String,KJUR.asn1.DERAbstractString);KJUR.asn1.DERNumericString=function(a){KJUR.asn1.DERNumericString.superclass.constructor.call(this,a);this.hT="12"};YAHOO.lang.extend(KJUR.asn1.DERNumericString,KJUR.asn1.DERAbstractString);KJUR.asn1.DERPrintableString=function(a){KJUR.asn1.DERPrintableString.superclass.constructor.call(this,a);this.hT="13"};YAHOO.lang.extend(KJUR.asn1.DERPrintableString,KJUR.asn1.DERAbstractString);KJUR.asn1.DERTeletexString=function(a){KJUR.asn1.DERTeletexString.superclass.constructor.call(this,a);this.hT="14"};YAHOO.lang.extend(KJUR.asn1.DERTeletexString,KJUR.asn1.DERAbstractString);KJUR.asn1.DERIA5String=function(a){KJUR.asn1.DERIA5String.superclass.constructor.call(this,a);this.hT="16"};YAHOO.lang.extend(KJUR.asn1.DERIA5String,KJUR.asn1.DERAbstractString);KJUR.asn1.DERUTCTime=function(a){KJUR.asn1.DERUTCTime.superclass.constructor.call(this,a);this.hT="17";this.setByDate=function(b){this.hTLV=null;this.isModified=true;this.date=b;this.s=this.formatDate(this.date,"utc");this.hV=stohex(this.s)};this.getFreshValueHex=function(){if(typeof this.date=="undefined"&&typeof this.s=="undefined"){this.date=new Date();this.s=this.formatDate(this.date,"utc");this.hV=stohex(this.s)}return this.hV};if(a!==undefined){if(a.str!==undefined){this.setString(a.str)}else{if(typeof a=="string"&&a.match(/^[0-9]{12}Z$/)){this.setString(a)}else{if(a.hex!==undefined){this.setStringHex(a.hex)}else{if(a.date!==undefined){this.setByDate(a.date)}}}}}};YAHOO.lang.extend(KJUR.asn1.DERUTCTime,KJUR.asn1.DERAbstractTime);KJUR.asn1.DERGeneralizedTime=function(a){KJUR.asn1.DERGeneralizedTime.superclass.constructor.call(this,a);this.hT="18";this.withMillis=false;this.setByDate=function(b){this.hTLV=null;this.isModified=true;this.date=b;this.s=this.formatDate(this.date,"gen",this.withMillis);this.hV=stohex(this.s)};this.getFreshValueHex=function(){if(this.date===undefined&&this.s===undefined){this.date=new Date();this.s=this.formatDate(this.date,"gen",this.withMillis);this.hV=stohex(this.s)}return this.hV};if(a!==undefined){if(a.str!==undefined){this.setString(a.str)}else{if(typeof a=="string"&&a.match(/^[0-9]{14}Z$/)){this.setString(a)}else{if(a.hex!==undefined){this.setStringHex(a.hex)}else{if(a.date!==undefined){this.setByDate(a.date)}}}}if(a.millis===true){this.withMillis=true}}};YAHOO.lang.extend(KJUR.asn1.DERGeneralizedTime,KJUR.asn1.DERAbstractTime);KJUR.asn1.DERSequence=function(a){KJUR.asn1.DERSequence.superclass.constructor.call(this,a);this.hT="30";this.getFreshValueHex=function(){var c="";for(var b=0;b<this.asn1Array.length;b++){var d=this.asn1Array[b];c+=d.getEncodedHex()}this.hV=c;return this.hV}};YAHOO.lang.extend(KJUR.asn1.DERSequence,KJUR.asn1.DERAbstractStructured);KJUR.asn1.DERSet=function(a){KJUR.asn1.DERSet.superclass.constructor.call(this,a);this.hT="31";this.sortFlag=true;this.getFreshValueHex=function(){var b=new Array();for(var c=0;c<this.asn1Array.length;c++){var d=this.asn1Array[c];b.push(d.getEncodedHex())}if(this.sortFlag==true){b.sort()}this.hV=b.join("");return this.hV};if(typeof a!="undefined"){if(typeof a.sortflag!="undefined"&&a.sortflag==false){this.sortFlag=false}}};YAHOO.lang.extend(KJUR.asn1.DERSet,KJUR.asn1.DERAbstractStructured);KJUR.asn1.DERTaggedObject=function(a){KJUR.asn1.DERTaggedObject.superclass.constructor.call(this);this.hT="a0";this.hV="";this.isExplicit=true;this.asn1Object=null;this.setASN1Object=function(b,c,d){this.hT=c;this.isExplicit=b;this.asn1Object=d;if(this.isExplicit){this.hV=this.asn1Object.getEncodedHex();this.hTLV=null;this.isModified=true}else{this.hV=null;this.hTLV=d.getEncodedHex();this.hTLV=this.hTLV.replace(/^../,c);this.isModified=false}};this.getFreshValueHex=function(){return this.hV};if(typeof a!="undefined"){if(typeof a.tag!="undefined"){this.hT=a.tag}if(typeof a.explicit!="undefined"){this.isExplicit=a.explicit}if(typeof a.obj!="undefined"){this.asn1Object=a.obj;this.setASN1Object(this.isExplicit,this.hT,this.asn1Object)}}};YAHOO.lang.extend(KJUR.asn1.DERTaggedObject,KJUR.asn1.ASN1Object);
    var ASN1HEX=new function(){};ASN1HEX.getLblen=function(c,a){if(c.substr(a+2,1)!="8"){return 1}var b=parseInt(c.substr(a+3,1));if(b==0){return -1}if(0<b&&b<10){return b+1}return -2};ASN1HEX.getL=function(c,b){var a=ASN1HEX.getLblen(c,b);if(a<1){return""}return c.substr(b+2,a*2)};ASN1HEX.getVblen=function(d,a){var c,b;c=ASN1HEX.getL(d,a);if(c==""){return -1}if(c.substr(0,1)==="8"){b=new BigInteger(c.substr(2),16)}else{b=new BigInteger(c,16)}return b.intValue()};ASN1HEX.getVidx=function(c,b){var a=ASN1HEX.getLblen(c,b);if(a<0){return a}return b+(a+1)*2};ASN1HEX.getV=function(d,a){var c=ASN1HEX.getVidx(d,a);var b=ASN1HEX.getVblen(d,a);return d.substr(c,b*2)};ASN1HEX.getTLV=function(b,a){return b.substr(a,2)+ASN1HEX.getL(b,a)+ASN1HEX.getV(b,a)};ASN1HEX.getNextSiblingIdx=function(d,a){var c=ASN1HEX.getVidx(d,a);var b=ASN1HEX.getVblen(d,a);return c+b*2};ASN1HEX.getChildIdx=function(e,f){var j=ASN1HEX;var g=new Array();var i=j.getVidx(e,f);if(e.substr(f,2)=="03"){g.push(i+2)}else{g.push(i)}var l=j.getVblen(e,f);var c=i;var d=0;while(1){var b=j.getNextSiblingIdx(e,c);if(b==null||(b-i>=(l*2))){break}if(d>=200){break}g.push(b);c=b;d++}return g};ASN1HEX.getNthChildIdx=function(d,b,e){var c=ASN1HEX.getChildIdx(d,b);return c[e]};ASN1HEX.getIdxbyList=function(e,d,c,i){var g=ASN1HEX;var f,b;if(c.length==0){if(i!==undefined){if(e.substr(d,2)!==i){throw"checking tag doesn't match: "+e.substr(d,2)+"!="+i}}return d}f=c.shift();b=g.getChildIdx(e,d);return g.getIdxbyList(e,b[f],c,i)};ASN1HEX.getTLVbyList=function(d,c,b,f){var e=ASN1HEX;var a=e.getIdxbyList(d,c,b);if(a===undefined){throw"can't find nthList object"}if(f!==undefined){if(d.substr(a,2)!=f){throw"checking tag doesn't match: "+d.substr(a,2)+"!="+f}}return e.getTLV(d,a)};ASN1HEX.getVbyList=function(e,c,b,g,i){var f=ASN1HEX;var a,d;a=f.getIdxbyList(e,c,b,g);if(a===undefined){throw"can't find nthList object"}d=f.getV(e,a);if(i===true){d=d.substr(2)}return d};ASN1HEX.hextooidstr=function(e){var h=function(b,a){if(b.length>=a){return b}return new Array(a-b.length+1).join("0")+b};var l=[];var o=e.substr(0,2);var f=parseInt(o,16);l[0]=new String(Math.floor(f/40));l[1]=new String(f%40);var m=e.substr(2);var k=[];for(var g=0;g<m.length/2;g++){k.push(parseInt(m.substr(g*2,2),16))}var j=[];var d="";for(var g=0;g<k.length;g++){if(k[g]&128){d=d+h((k[g]&127).toString(2),7)}else{d=d+h((k[g]&127).toString(2),7);j.push(new String(parseInt(d,2)));d=""}}var n=l.join(".");if(j.length>0){n=n+"."+j.join(".")}return n};ASN1HEX.dump=function(t,c,l,g){var p=ASN1HEX;var j=p.getV;var y=p.dump;var w=p.getChildIdx;var e=t;if(t instanceof KJUR.asn1.ASN1Object){e=t.getEncodedHex()}var q=function(A,i){if(A.length<=i*2){return A}else{var v=A.substr(0,i)+"..(total "+A.length/2+"bytes).."+A.substr(A.length-i,i);return v}};if(c===undefined){c={ommit_long_octet:32}}if(l===undefined){l=0}if(g===undefined){g=""}var x=c.ommit_long_octet;if(e.substr(l,2)=="01"){var h=j(e,l);if(h=="00"){return g+"BOOLEAN FALSE\n"}else{return g+"BOOLEAN TRUE\n"}}if(e.substr(l,2)=="02"){var h=j(e,l);return g+"INTEGER "+q(h,x)+"\n"}if(e.substr(l,2)=="03"){var h=j(e,l);return g+"BITSTRING "+q(h,x)+"\n"}if(e.substr(l,2)=="04"){var h=j(e,l);if(p.isASN1HEX(h)){var k=g+"OCTETSTRING, encapsulates\n";k=k+y(h,c,0,g+"  ");return k}else{return g+"OCTETSTRING "+q(h,x)+"\n"}}if(e.substr(l,2)=="05"){return g+"NULL\n"}if(e.substr(l,2)=="06"){var m=j(e,l);var a=KJUR.asn1.ASN1Util.oidHexToInt(m);var o=KJUR.asn1.x509.OID.oid2name(a);var b=a.replace(/\./g," ");if(o!=""){return g+"ObjectIdentifier "+o+" ("+b+")\n"}else{return g+"ObjectIdentifier ("+b+")\n"}}if(e.substr(l,2)=="0c"){return g+"UTF8String '"+hextoutf8(j(e,l))+"'\n"}if(e.substr(l,2)=="13"){return g+"PrintableString '"+hextoutf8(j(e,l))+"'\n"}if(e.substr(l,2)=="14"){return g+"TeletexString '"+hextoutf8(j(e,l))+"'\n"}if(e.substr(l,2)=="16"){return g+"IA5String '"+hextoutf8(j(e,l))+"'\n"}if(e.substr(l,2)=="17"){return g+"UTCTime "+hextoutf8(j(e,l))+"\n"}if(e.substr(l,2)=="18"){return g+"GeneralizedTime "+hextoutf8(j(e,l))+"\n"}if(e.substr(l,2)=="30"){if(e.substr(l,4)=="3000"){return g+"SEQUENCE {}\n"}var k=g+"SEQUENCE\n";var d=w(e,l);var f=c;if((d.length==2||d.length==3)&&e.substr(d[0],2)=="06"&&e.substr(d[d.length-1],2)=="04"){var o=p.oidname(j(e,d[0]));var r=JSON.parse(JSON.stringify(c));r.x509ExtName=o;f=r}for(var u=0;u<d.length;u++){k=k+y(e,f,d[u],g+"  ")}return k}if(e.substr(l,2)=="31"){var k=g+"SET\n";var d=w(e,l);for(var u=0;u<d.length;u++){k=k+y(e,c,d[u],g+"  ")}return k}var z=parseInt(e.substr(l,2),16);if((z&128)!=0){var n=z&31;if((z&32)!=0){var k=g+"["+n+"]\n";var d=w(e,l);for(var u=0;u<d.length;u++){k=k+y(e,c,d[u],g+"  ")}return k}else{var h=j(e,l);if(h.substr(0,8)=="68747470"){h=hextoutf8(h)}if(c.x509ExtName==="subjectAltName"&&n==2){h=hextoutf8(h)}var k=g+"["+n+"] "+h+"\n";return k}}return g+"UNKNOWN("+e.substr(l,2)+") "+j(e,l)+"\n"};ASN1HEX.isASN1HEX=function(e){var d=ASN1HEX;if(e.length%2==1){return false}var c=d.getVblen(e,0);var b=e.substr(0,2);var f=d.getL(e,0);var a=e.length-b.length-f.length;if(a==c*2){return true}return false};ASN1HEX.oidname=function(a){var c=KJUR.asn1;if(KJUR.lang.String.isHex(a)){a=c.ASN1Util.oidHexToInt(a)}var b=c.x509.OID.oid2name(a);if(b===""){b=a}return b};
    if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.asn1=="undefined"||!KJUR.asn1){KJUR.asn1={}}if(typeof KJUR.asn1.x509=="undefined"||!KJUR.asn1.x509){KJUR.asn1.x509={}}KJUR.asn1.x509.Certificate=function(e){KJUR.asn1.x509.Certificate.superclass.constructor.call(this);var a=null,j=null,h=null,k=null,i=null,b=KJUR,f=b.crypto,g=b.asn1,d=g.DERSequence,c=g.DERBitString;this.sign=function(){this.asn1SignatureAlg=this.asn1TBSCert.asn1SignatureAlg;var m=new KJUR.crypto.Signature({alg:this.asn1SignatureAlg.nameAlg});m.init(this.prvKey);m.updateHex(this.asn1TBSCert.getEncodedHex());this.hexSig=m.sign();this.asn1Sig=new c({hex:"00"+this.hexSig});var l=new d({array:[this.asn1TBSCert,this.asn1SignatureAlg,this.asn1Sig]});this.hTLV=l.getEncodedHex();this.isModified=false};this.setSignatureHex=function(l){this.asn1SignatureAlg=this.asn1TBSCert.asn1SignatureAlg;this.hexSig=l;this.asn1Sig=new c({hex:"00"+this.hexSig});var m=new d({array:[this.asn1TBSCert,this.asn1SignatureAlg,this.asn1Sig]});this.hTLV=m.getEncodedHex();this.isModified=false};this.getEncodedHex=function(){if(this.isModified==false&&this.hTLV!=null){return this.hTLV}throw"not signed yet"};this.getPEMString=function(){var l=hextob64nl(this.getEncodedHex());return"-----BEGIN CERTIFICATE-----\r\n"+l+"\r\n-----END CERTIFICATE-----\r\n"};if(e!==undefined){if(e.tbscertobj!==undefined){this.asn1TBSCert=e.tbscertobj}if(e.prvkeyobj!==undefined){this.prvKey=e.prvkeyobj}}};YAHOO.lang.extend(KJUR.asn1.x509.Certificate,KJUR.asn1.ASN1Object);KJUR.asn1.x509.TBSCertificate=function(e){KJUR.asn1.x509.TBSCertificate.superclass.constructor.call(this);var b=KJUR,i=b.asn1,f=i.DERSequence,h=i.DERInteger,c=i.DERTaggedObject,d=i.x509,g=d.Time,a=d.X500Name,j=d.SubjectPublicKeyInfo;this._initialize=function(){this.asn1Array=new Array();this.asn1Version=new c({obj:new h({"int":2})});this.asn1SerialNumber=null;this.asn1SignatureAlg=null;this.asn1Issuer=null;this.asn1NotBefore=null;this.asn1NotAfter=null;this.asn1Subject=null;this.asn1SubjPKey=null;this.extensionsArray=new Array()};this.setSerialNumberByParam=function(k){this.asn1SerialNumber=new h(k)};this.setSignatureAlgByParam=function(k){this.asn1SignatureAlg=new d.AlgorithmIdentifier(k)};this.setIssuerByParam=function(k){this.asn1Issuer=new a(k)};this.setNotBeforeByParam=function(k){this.asn1NotBefore=new g(k)};this.setNotAfterByParam=function(k){this.asn1NotAfter=new g(k)};this.setSubjectByParam=function(k){this.asn1Subject=new a(k)};this.setSubjectPublicKey=function(k){this.asn1SubjPKey=new j(k)};this.setSubjectPublicKeyByGetKey=function(l){var k=KEYUTIL.getKey(l);this.asn1SubjPKey=new j(k)};this.appendExtension=function(k){this.extensionsArray.push(k)};this.appendExtensionByName=function(l,k){KJUR.asn1.x509.Extension.appendByNameToArray(l,k,this.extensionsArray)};this.getEncodedHex=function(){if(this.asn1NotBefore==null||this.asn1NotAfter==null){throw"notBefore and/or notAfter not set"}var l=new f({array:[this.asn1NotBefore,this.asn1NotAfter]});this.asn1Array=new Array();this.asn1Array.push(this.asn1Version);this.asn1Array.push(this.asn1SerialNumber);this.asn1Array.push(this.asn1SignatureAlg);this.asn1Array.push(this.asn1Issuer);this.asn1Array.push(l);this.asn1Array.push(this.asn1Subject);this.asn1Array.push(this.asn1SubjPKey);if(this.extensionsArray.length>0){var m=new f({array:this.extensionsArray});var k=new c({explicit:true,tag:"a3",obj:m});this.asn1Array.push(k)}var n=new f({array:this.asn1Array});this.hTLV=n.getEncodedHex();this.isModified=false;return this.hTLV};this._initialize()};YAHOO.lang.extend(KJUR.asn1.x509.TBSCertificate,KJUR.asn1.ASN1Object);KJUR.asn1.x509.Extension=function(d){KJUR.asn1.x509.Extension.superclass.constructor.call(this);var f=null,a=KJUR,e=a.asn1,h=e.DERObjectIdentifier,i=e.DEROctetString,b=e.DERBitString,g=e.DERBoolean,c=e.DERSequence;this.getEncodedHex=function(){var m=new h({oid:this.oid});var l=new i({hex:this.getExtnValueHex()});var k=new Array();k.push(m);if(this.critical){k.push(new g())}k.push(l);var j=new c({array:k});return j.getEncodedHex()};this.critical=false;if(typeof d!="undefined"){if(typeof d.critical!="undefined"){this.critical=d.critical}}};YAHOO.lang.extend(KJUR.asn1.x509.Extension,KJUR.asn1.ASN1Object);KJUR.asn1.x509.Extension.appendByNameToArray=function(e,c,b){var g=e.toLowerCase(),f=KJUR.asn1.x509;if(g=="basicconstraints"){var d=new f.BasicConstraints(c);b.push(d)}else{if(g=="keyusage"){var d=new f.KeyUsage(c);b.push(d)}else{if(g=="crldistributionpoints"){var d=new f.CRLDistributionPoints(c);b.push(d)}else{if(g=="extkeyusage"){var d=new f.ExtKeyUsage(c);b.push(d)}else{if(g=="authoritykeyidentifier"){var d=new f.AuthorityKeyIdentifier(c);b.push(d)}else{if(g=="authorityinfoaccess"){var d=new f.AuthorityInfoAccess(c);b.push(d)}else{if(g=="subjectaltname"){var d=new f.SubjectAltName(c);b.push(d)}else{if(g=="issueraltname"){var d=new f.IssuerAltName(c);b.push(d)}else{throw"unsupported extension name: "+e}}}}}}}}};KJUR.asn1.x509.KeyUsage=function(a){KJUR.asn1.x509.KeyUsage.superclass.constructor.call(this,a);this.getExtnValueHex=function(){return this.asn1ExtnValue.getEncodedHex()};this.oid="2.5.29.15";if(typeof a!="undefined"){if(typeof a.bin!="undefined"){this.asn1ExtnValue=new KJUR.asn1.DERBitString(a)}}};YAHOO.lang.extend(KJUR.asn1.x509.KeyUsage,KJUR.asn1.x509.Extension);KJUR.asn1.x509.BasicConstraints=function(c){KJUR.asn1.x509.BasicConstraints.superclass.constructor.call(this,c);var a=false;var b=-1;this.getExtnValueHex=function(){var e=new Array();if(this.cA){e.push(new KJUR.asn1.DERBoolean())}if(this.pathLen>-1){e.push(new KJUR.asn1.DERInteger({"int":this.pathLen}))}var d=new KJUR.asn1.DERSequence({array:e});this.asn1ExtnValue=d;return this.asn1ExtnValue.getEncodedHex()};this.oid="2.5.29.19";this.cA=false;this.pathLen=-1;if(typeof c!="undefined"){if(typeof c.cA!="undefined"){this.cA=c.cA}if(typeof c.pathLen!="undefined"){this.pathLen=c.pathLen}}};YAHOO.lang.extend(KJUR.asn1.x509.BasicConstraints,KJUR.asn1.x509.Extension);KJUR.asn1.x509.CRLDistributionPoints=function(d){KJUR.asn1.x509.CRLDistributionPoints.superclass.constructor.call(this,d);var b=KJUR,a=b.asn1,c=a.x509;this.getExtnValueHex=function(){return this.asn1ExtnValue.getEncodedHex()};this.setByDPArray=function(e){this.asn1ExtnValue=new a.DERSequence({array:e})};this.setByOneURI=function(h){var e=new c.GeneralNames([{uri:h}]);var g=new c.DistributionPointName(e);var f=new c.DistributionPoint({dpobj:g});this.setByDPArray([f])};this.oid="2.5.29.31";if(typeof d!="undefined"){if(typeof d.array!="undefined"){this.setByDPArray(d.array)}else{if(typeof d.uri!="undefined"){this.setByOneURI(d.uri)}}}};YAHOO.lang.extend(KJUR.asn1.x509.CRLDistributionPoints,KJUR.asn1.x509.Extension);KJUR.asn1.x509.ExtKeyUsage=function(c){KJUR.asn1.x509.ExtKeyUsage.superclass.constructor.call(this,c);var b=KJUR,a=b.asn1;this.setPurposeArray=function(d){this.asn1ExtnValue=new a.DERSequence();for(var e=0;e<d.length;e++){var f=new a.DERObjectIdentifier(d[e]);this.asn1ExtnValue.appendASN1Object(f)}};this.getExtnValueHex=function(){return this.asn1ExtnValue.getEncodedHex()};this.oid="2.5.29.37";if(typeof c!="undefined"){if(typeof c.array!="undefined"){this.setPurposeArray(c.array)}}};YAHOO.lang.extend(KJUR.asn1.x509.ExtKeyUsage,KJUR.asn1.x509.Extension);KJUR.asn1.x509.AuthorityKeyIdentifier=function(d){KJUR.asn1.x509.AuthorityKeyIdentifier.superclass.constructor.call(this,d);var b=KJUR,a=b.asn1,c=a.DERTaggedObject;this.asn1KID=null;this.asn1CertIssuer=null;this.asn1CertSN=null;this.getExtnValueHex=function(){var f=new Array();if(this.asn1KID){f.push(new c({explicit:false,tag:"80",obj:this.asn1KID}))}if(this.asn1CertIssuer){f.push(new c({explicit:false,tag:"a1",obj:this.asn1CertIssuer}))}if(this.asn1CertSN){f.push(new c({explicit:false,tag:"82",obj:this.asn1CertSN}))}var e=new a.DERSequence({array:f});this.asn1ExtnValue=e;return this.asn1ExtnValue.getEncodedHex()};this.setKIDByParam=function(e){this.asn1KID=new KJUR.asn1.DEROctetString(e)};this.setCertIssuerByParam=function(e){this.asn1CertIssuer=new KJUR.asn1.x509.X500Name(e)};this.setCertSNByParam=function(e){this.asn1CertSN=new KJUR.asn1.DERInteger(e)};this.oid="2.5.29.35";if(typeof d!="undefined"){if(typeof d.kid!="undefined"){this.setKIDByParam(d.kid)}if(typeof d.issuer!="undefined"){this.setCertIssuerByParam(d.issuer)}if(typeof d.sn!="undefined"){this.setCertSNByParam(d.sn)}}};YAHOO.lang.extend(KJUR.asn1.x509.AuthorityKeyIdentifier,KJUR.asn1.x509.Extension);KJUR.asn1.x509.AuthorityInfoAccess=function(a){KJUR.asn1.x509.AuthorityInfoAccess.superclass.constructor.call(this,a);this.setAccessDescriptionArray=function(k){var j=new Array(),b=KJUR,g=b.asn1,d=g.DERSequence;for(var f=0;f<k.length;f++){var c=new g.DERObjectIdentifier(k[f].accessMethod);var e=new g.x509.GeneralName(k[f].accessLocation);var h=new d({array:[c,e]});j.push(h)}this.asn1ExtnValue=new d({array:j})};this.getExtnValueHex=function(){return this.asn1ExtnValue.getEncodedHex()};this.oid="1.3.6.1.5.5.7.1.1";if(typeof a!="undefined"){if(typeof a.array!="undefined"){this.setAccessDescriptionArray(a.array)}}};YAHOO.lang.extend(KJUR.asn1.x509.AuthorityInfoAccess,KJUR.asn1.x509.Extension);KJUR.asn1.x509.SubjectAltName=function(a){KJUR.asn1.x509.SubjectAltName.superclass.constructor.call(this,a);this.setNameArray=function(b){this.asn1ExtnValue=new KJUR.asn1.x509.GeneralNames(b)};this.getExtnValueHex=function(){return this.asn1ExtnValue.getEncodedHex()};this.oid="2.5.29.17";if(a!==undefined){if(a.array!==undefined){this.setNameArray(a.array)}}};YAHOO.lang.extend(KJUR.asn1.x509.SubjectAltName,KJUR.asn1.x509.Extension);KJUR.asn1.x509.IssuerAltName=function(a){KJUR.asn1.x509.IssuerAltName.superclass.constructor.call(this,a);this.setNameArray=function(b){this.asn1ExtnValue=new KJUR.asn1.x509.GeneralNames(b)};this.getExtnValueHex=function(){return this.asn1ExtnValue.getEncodedHex()};this.oid="2.5.29.18";if(a!==undefined){if(a.array!==undefined){this.setNameArray(a.array)}}};YAHOO.lang.extend(KJUR.asn1.x509.IssuerAltName,KJUR.asn1.x509.Extension);KJUR.asn1.x509.CRL=function(f){KJUR.asn1.x509.CRL.superclass.constructor.call(this);var b=null,d=null,e=null,c=null,a=null;this.sign=function(){this.asn1SignatureAlg=this.asn1TBSCertList.asn1SignatureAlg;sig=new KJUR.crypto.Signature({alg:"SHA1withRSA",prov:"cryptojs/jsrsa"});sig.initSign(this.prvKey);sig.updateHex(this.asn1TBSCertList.getEncodedHex());this.hexSig=sig.sign();this.asn1Sig=new KJUR.asn1.DERBitString({hex:"00"+this.hexSig});var g=new KJUR.asn1.DERSequence({array:[this.asn1TBSCertList,this.asn1SignatureAlg,this.asn1Sig]});this.hTLV=g.getEncodedHex();this.isModified=false};this.getEncodedHex=function(){if(this.isModified==false&&this.hTLV!=null){return this.hTLV}throw"not signed yet"};this.getPEMString=function(){var g=hextob64nl(this.getEncodedHex());return"-----BEGIN X509 CRL-----\r\n"+g+"\r\n-----END X509 CRL-----\r\n"};if(f!==undefined){if(f.tbsobj!==undefined){this.asn1TBSCertList=f.tbsobj}if(f.prvkeyobj!==undefined){this.prvKey=f.prvkeyobj}}};YAHOO.lang.extend(KJUR.asn1.x509.CRL,KJUR.asn1.ASN1Object);KJUR.asn1.x509.TBSCertList=function(g){KJUR.asn1.x509.TBSCertList.superclass.constructor.call(this);var e=null,d=KJUR,c=d.asn1,b=c.DERSequence,f=c.x509,a=f.Time;this.setSignatureAlgByParam=function(h){this.asn1SignatureAlg=new f.AlgorithmIdentifier(h)};this.setIssuerByParam=function(h){this.asn1Issuer=new f.X500Name(h)};this.setThisUpdateByParam=function(h){this.asn1ThisUpdate=new a(h)};this.setNextUpdateByParam=function(h){this.asn1NextUpdate=new a(h)};this.addRevokedCert=function(h,i){var k={};if(h!=undefined&&h!=null){k.sn=h}if(i!=undefined&&i!=null){k.time=i}var j=new f.CRLEntry(k);this.aRevokedCert.push(j)};this.getEncodedHex=function(){this.asn1Array=new Array();if(this.asn1Version!=null){this.asn1Array.push(this.asn1Version)}this.asn1Array.push(this.asn1SignatureAlg);this.asn1Array.push(this.asn1Issuer);this.asn1Array.push(this.asn1ThisUpdate);if(this.asn1NextUpdate!=null){this.asn1Array.push(this.asn1NextUpdate)}if(this.aRevokedCert.length>0){var h=new b({array:this.aRevokedCert});this.asn1Array.push(h)}var i=new b({array:this.asn1Array});this.hTLV=i.getEncodedHex();this.isModified=false;return this.hTLV};this._initialize=function(){this.asn1Version=null;this.asn1SignatureAlg=null;this.asn1Issuer=null;this.asn1ThisUpdate=null;this.asn1NextUpdate=null;this.aRevokedCert=new Array()};this._initialize()};YAHOO.lang.extend(KJUR.asn1.x509.TBSCertList,KJUR.asn1.ASN1Object);KJUR.asn1.x509.CRLEntry=function(e){KJUR.asn1.x509.CRLEntry.superclass.constructor.call(this);var d=null,c=null,b=KJUR,a=b.asn1;this.setCertSerial=function(f){this.sn=new a.DERInteger(f)};this.setRevocationDate=function(f){this.time=new a.x509.Time(f)};this.getEncodedHex=function(){var f=new a.DERSequence({array:[this.sn,this.time]});this.TLV=f.getEncodedHex();return this.TLV};if(e!==undefined){if(e.time!==undefined){this.setRevocationDate(e.time)}if(e.sn!==undefined){this.setCertSerial(e.sn)}}};YAHOO.lang.extend(KJUR.asn1.x509.CRLEntry,KJUR.asn1.ASN1Object);KJUR.asn1.x509.X500Name=function(f){KJUR.asn1.x509.X500Name.superclass.constructor.call(this);this.asn1Array=new Array();var d=KJUR,c=d.asn1,e=c.x509,b=pemtohex;this.setByString=function(g){var h=g.split("/");h.shift();for(var j=0;j<h.length;j++){this.asn1Array.push(new e.RDN({str:h[j]}))}};this.setByLdapString=function(g){var h=e.X500Name.ldapToOneline(g);this.setByString(h)};this.setByObject=function(i){for(var g in i){if(i.hasOwnProperty(g)){var h=new KJUR.asn1.x509.RDN({str:g+"="+i[g]});this.asn1Array?this.asn1Array.push(h):this.asn1Array=[h]}}};this.getEncodedHex=function(){if(typeof this.hTLV=="string"){return this.hTLV}var g=new c.DERSequence({array:this.asn1Array});this.hTLV=g.getEncodedHex();return this.hTLV};if(f!==undefined){if(f.str!==undefined){this.setByString(f.str)}else{if(f.ldapstr!==undefined){this.setByLdapString(f.ldapstr)}else{if(typeof f==="object"){this.setByObject(f)}}}if(f.certissuer!==undefined){var a=new X509();a.hex=b(f.certissuer);this.hTLV=a.getIssuerHex()}if(f.certsubject!==undefined){var a=new X509();a.hex=b(f.certsubject);this.hTLV=a.getSubjectHex()}}};YAHOO.lang.extend(KJUR.asn1.x509.X500Name,KJUR.asn1.ASN1Object);KJUR.asn1.x509.X500Name.onelineToLDAP=function(d){if(d.substr(0,1)!=="/"){throw"malformed input"}var b="";d=d.substr(1);var c=d.split("/");c.reverse();c=c.map(function(a){return a.replace(/,/,"\\,")});return c.join(",")};KJUR.asn1.x509.X500Name.ldapToOneline=function(g){var c=g.split(",");var e=false;var b=[];for(var f=0;c.length>0;f++){var h=c.shift();if(e===true){var d=b.pop();var j=(d+","+h).replace(/\\,/g,",");b.push(j);e=false}else{b.push(h)}if(h.substr(-1,1)==="\\"){e=true}}b=b.map(function(a){return a.replace("/","\\/")});b.reverse();return"/"+b.join("/")};KJUR.asn1.x509.RDN=function(a){KJUR.asn1.x509.RDN.superclass.constructor.call(this);this.asn1Array=new Array();this.addByString=function(b){this.asn1Array.push(new KJUR.asn1.x509.AttributeTypeAndValue({str:b}))};this.addByMultiValuedString=function(d){var b=KJUR.asn1.x509.RDN.parseString(d);for(var c=0;c<b.length;c++){this.addByString(b[c])}};this.getEncodedHex=function(){var b=new KJUR.asn1.DERSet({array:this.asn1Array});this.TLV=b.getEncodedHex();return this.TLV};if(typeof a!="undefined"){if(typeof a.str!="undefined"){this.addByMultiValuedString(a.str)}}};YAHOO.lang.extend(KJUR.asn1.x509.RDN,KJUR.asn1.ASN1Object);KJUR.asn1.x509.RDN.parseString=function(m){var j=m.split(/\+/);var h=false;var c=[];for(var g=0;j.length>0;g++){var k=j.shift();if(h===true){var f=c.pop();var d=(f+"+"+k).replace(/\\\+/g,"+");c.push(d);h=false}else{c.push(k)}if(k.substr(-1,1)==="\\"){h=true}}var l=false;var b=[];for(var g=0;c.length>0;g++){var k=c.shift();if(l===true){var e=b.pop();if(k.match(/"$/)){var d=(e+"+"+k).replace(/^([^=]+)="(.*)"$/,"$1=$2");b.push(d);l=false}else{b.push(e+"+"+k)}}else{b.push(k)}if(k.match(/^[^=]+="/)){l=true}}return b};KJUR.asn1.x509.AttributeTypeAndValue=function(d){KJUR.asn1.x509.AttributeTypeAndValue.superclass.constructor.call(this);var f=null,e=null,a="utf8",c=KJUR,b=c.asn1;this.setByString=function(h){var g=h.match(/^([^=]+)=(.+)$/);if(g){this.setByAttrTypeAndValueStr(g[1],g[2])}else{throw"malformed attrTypeAndValueStr: "+h}};this.setByAttrTypeAndValueStr=function(i,h){this.typeObj=KJUR.asn1.x509.OID.atype2obj(i);var g=a;if(i=="C"){g="prn"}this.valueObj=this.getValueObj(g,h)};this.getValueObj=function(h,g){if(h=="utf8"){return new b.DERUTF8String({str:g})}if(h=="prn"){return new b.DERPrintableString({str:g})}if(h=="tel"){return new b.DERTeletexString({str:g})}if(h=="ia5"){return new b.DERIA5String({str:g})}throw"unsupported directory string type: type="+h+" value="+g};this.getEncodedHex=function(){var g=new b.DERSequence({array:[this.typeObj,this.valueObj]});this.TLV=g.getEncodedHex();return this.TLV};if(typeof d!="undefined"){if(typeof d.str!="undefined"){this.setByString(d.str)}}};YAHOO.lang.extend(KJUR.asn1.x509.AttributeTypeAndValue,KJUR.asn1.ASN1Object);KJUR.asn1.x509.SubjectPublicKeyInfo=function(f){KJUR.asn1.x509.SubjectPublicKeyInfo.superclass.constructor.call(this);var l=null,k=null,a=KJUR,j=a.asn1,i=j.DERInteger,b=j.DERBitString,m=j.DERObjectIdentifier,e=j.DERSequence,h=j.ASN1Util.newObject,d=j.x509,o=d.AlgorithmIdentifier,g=a.crypto,n=g.ECDSA,c=g.DSA;this.getASN1Object=function(){if(this.asn1AlgId==null||this.asn1SubjPKey==null){throw"algId and/or subjPubKey not set"}var p=new e({array:[this.asn1AlgId,this.asn1SubjPKey]});return p};this.getEncodedHex=function(){var p=this.getASN1Object();this.hTLV=p.getEncodedHex();return this.hTLV};this.setPubKey=function(q){try{if(q instanceof RSAKey){var u=h({seq:[{"int":{bigint:q.n}},{"int":{"int":q.e}}]});var s=u.getEncodedHex();this.asn1AlgId=new o({name:"rsaEncryption"});this.asn1SubjPKey=new b({hex:"00"+s})}}catch(p){}try{if(q instanceof KJUR.crypto.ECDSA){var r=new m({name:q.curveName});this.asn1AlgId=new o({name:"ecPublicKey",asn1params:r});this.asn1SubjPKey=new b({hex:"00"+q.pubKeyHex})}}catch(p){}try{if(q instanceof KJUR.crypto.DSA){var r=new h({seq:[{"int":{bigint:q.p}},{"int":{bigint:q.q}},{"int":{bigint:q.g}}]});this.asn1AlgId=new o({name:"dsa",asn1params:r});var t=new i({bigint:q.y});this.asn1SubjPKey=new b({hex:"00"+t.getEncodedHex()})}}catch(p){}};if(f!==undefined){this.setPubKey(f)}};YAHOO.lang.extend(KJUR.asn1.x509.SubjectPublicKeyInfo,KJUR.asn1.ASN1Object);KJUR.asn1.x509.Time=function(f){KJUR.asn1.x509.Time.superclass.constructor.call(this);var e=null,a=null,d=KJUR,c=d.asn1,b=c.DERUTCTime,g=c.DERGeneralizedTime;this.setTimeParams=function(h){this.timeParams=h};this.getEncodedHex=function(){var h=null;if(this.timeParams!=null){if(this.type=="utc"){h=new b(this.timeParams)}else{h=new g(this.timeParams)}}else{if(this.type=="utc"){h=new b()}else{h=new g()}}this.TLV=h.getEncodedHex();return this.TLV};this.type="utc";if(f!==undefined){if(f.type!==undefined){this.type=f.type}else{if(f.str!==undefined){if(f.str.match(/^[0-9]{12}Z$/)){this.type="utc"}if(f.str.match(/^[0-9]{14}Z$/)){this.type="gen"}}}this.timeParams=f}};YAHOO.lang.extend(KJUR.asn1.x509.Time,KJUR.asn1.ASN1Object);KJUR.asn1.x509.AlgorithmIdentifier=function(d){KJUR.asn1.x509.AlgorithmIdentifier.superclass.constructor.call(this);this.nameAlg=null;this.asn1Alg=null;this.asn1Params=null;this.paramEmpty=false;var b=KJUR,a=b.asn1;this.getEncodedHex=function(){if(this.nameAlg===null&&this.asn1Alg===null){throw"algorithm not specified"}if(this.nameAlg!==null&&this.asn1Alg===null){this.asn1Alg=a.x509.OID.name2obj(this.nameAlg)}var e=[this.asn1Alg];if(this.asn1Params!==null){e.push(this.asn1Params)}var f=new a.DERSequence({array:e});this.hTLV=f.getEncodedHex();return this.hTLV};if(d!==undefined){if(d.name!==undefined){this.nameAlg=d.name}if(d.asn1params!==undefined){this.asn1Params=d.asn1params}if(d.paramempty!==undefined){this.paramEmpty=d.paramempty}}if(this.asn1Params===null&&this.paramEmpty===false&&this.nameAlg!==null){var c=this.nameAlg.toLowerCase();if(c.substr(-7,7)!=="withdsa"&&c.substr(-9,9)!=="withecdsa"){this.asn1Params=new a.DERNull()}}};YAHOO.lang.extend(KJUR.asn1.x509.AlgorithmIdentifier,KJUR.asn1.ASN1Object);KJUR.asn1.x509.GeneralName=function(e){KJUR.asn1.x509.GeneralName.superclass.constructor.call(this);var k=null,h=null,i={rfc822:"81",dns:"82",dn:"a4",uri:"86"},b=KJUR,f=b.asn1,d=f.DERIA5String,c=f.DERTaggedObject,j=f.ASN1Object,a=f.x509.X500Name,g=pemtohex;this.explicit=false;this.setByParam=function(r){var q=null;var n=null;if(r===undefined){return}if(r.rfc822!==undefined){this.type="rfc822";n=new d({str:r[this.type]})}if(r.dns!==undefined){this.type="dns";n=new d({str:r[this.type]})}if(r.uri!==undefined){this.type="uri";n=new d({str:r[this.type]})}if(r.dn!==undefined){this.type="dn";n=new a({str:r.dn})}if(r.ldapdn!==undefined){this.type="dn";n=new a({ldapstr:r.ldapdn})}if(r.certissuer!==undefined){this.type="dn";this.explicit=true;var o=r.certissuer;var m=null;if(o.match(/^[0-9A-Fa-f]+$/)){m==o}if(o.indexOf("-----BEGIN ")!=-1){m=g(o)}if(m==null){throw"certissuer param not cert"}var l=new X509();l.hex=m;var p=l.getIssuerHex();n=new j();n.hTLV=p}if(r.certsubj!==undefined){this.type="dn";this.explicit=true;var o=r.certsubj;var m=null;if(o.match(/^[0-9A-Fa-f]+$/)){m==o}if(o.indexOf("-----BEGIN ")!=-1){m=g(o)}if(m==null){throw"certsubj param not cert"}var l=new X509();l.hex=m;var p=l.getSubjectHex();n=new j();n.hTLV=p}if(this.type==null){throw"unsupported type in params="+r}this.asn1Obj=new c({explicit:this.explicit,tag:i[this.type],obj:n})};this.getEncodedHex=function(){return this.asn1Obj.getEncodedHex()};if(e!==undefined){this.setByParam(e)}};YAHOO.lang.extend(KJUR.asn1.x509.GeneralName,KJUR.asn1.ASN1Object);KJUR.asn1.x509.GeneralNames=function(d){KJUR.asn1.x509.GeneralNames.superclass.constructor.call(this);var a=null,c=KJUR,b=c.asn1;this.setByParamArray=function(g){for(var e=0;e<g.length;e++){var f=new b.x509.GeneralName(g[e]);this.asn1Array.push(f)}};this.getEncodedHex=function(){var e=new b.DERSequence({array:this.asn1Array});return e.getEncodedHex()};this.asn1Array=new Array();if(typeof d!="undefined"){this.setByParamArray(d)}};YAHOO.lang.extend(KJUR.asn1.x509.GeneralNames,KJUR.asn1.ASN1Object);KJUR.asn1.x509.DistributionPointName=function(b){KJUR.asn1.x509.DistributionPointName.superclass.constructor.call(this);var h=null,e=null,a=null,g=null,d=KJUR,c=d.asn1,f=c.DERTaggedObject;this.getEncodedHex=function(){if(this.type!="full"){throw"currently type shall be 'full': "+this.type}this.asn1Obj=new f({explicit:false,tag:this.tag,obj:this.asn1V});this.hTLV=this.asn1Obj.getEncodedHex();return this.hTLV};if(b!==undefined){if(c.x509.GeneralNames.prototype.isPrototypeOf(b)){this.type="full";this.tag="a0";this.asn1V=b}else{throw"This class supports GeneralNames only as argument"}}};YAHOO.lang.extend(KJUR.asn1.x509.DistributionPointName,KJUR.asn1.ASN1Object);KJUR.asn1.x509.DistributionPoint=function(d){KJUR.asn1.x509.DistributionPoint.superclass.constructor.call(this);var a=null,c=KJUR,b=c.asn1;this.getEncodedHex=function(){var e=new b.DERSequence();if(this.asn1DP!=null){var f=new b.DERTaggedObject({explicit:true,tag:"a0",obj:this.asn1DP});e.appendASN1Object(f)}this.hTLV=e.getEncodedHex();return this.hTLV};if(d!==undefined){if(d.dpobj!==undefined){this.asn1DP=d.dpobj}}};YAHOO.lang.extend(KJUR.asn1.x509.DistributionPoint,KJUR.asn1.ASN1Object);KJUR.asn1.x509.OID=new function(a){this.atype2oidList={CN:"2.5.4.3",L:"2.5.4.7",ST:"2.5.4.8",O:"2.5.4.10",OU:"2.5.4.11",C:"2.5.4.6",STREET:"2.5.4.9",DC:"0.9.2342.19200300.100.1.25",UID:"0.9.2342.19200300.100.1.1",SN:"2.5.4.4",DN:"2.5.4.49",E:"1.2.840.113549.1.9.1",businessCategory:"2.5.4.15",postalCode:"2.5.4.17",serialNumber:"2.5.4.5",jurisdictionOfIncorporationL:"1.3.6.1.4.1.311.60.2.1.1",jurisdictionOfIncorporationSP:"1.3.6.1.4.1.311.60.2.1.2",jurisdictionOfIncorporationC:"1.3.6.1.4.1.311.60.2.1.3"};this.name2oidList={sha1:"1.3.14.3.2.26",sha256:"2.16.840.1.101.3.4.2.1",sha384:"2.16.840.1.101.3.4.2.2",sha512:"2.16.840.1.101.3.4.2.3",sha224:"2.16.840.1.101.3.4.2.4",md5:"1.2.840.113549.2.5",md2:"1.3.14.7.2.2.1",ripemd160:"1.3.36.3.2.1",MD2withRSA:"1.2.840.113549.1.1.2",MD4withRSA:"1.2.840.113549.1.1.3",MD5withRSA:"1.2.840.113549.1.1.4",SHA1withRSA:"1.2.840.113549.1.1.5",SHA224withRSA:"1.2.840.113549.1.1.14",SHA256withRSA:"1.2.840.113549.1.1.11",SHA384withRSA:"1.2.840.113549.1.1.12",SHA512withRSA:"1.2.840.113549.1.1.13",SHA1withECDSA:"1.2.840.10045.4.1",SHA224withECDSA:"1.2.840.10045.4.3.1",SHA256withECDSA:"1.2.840.10045.4.3.2",SHA384withECDSA:"1.2.840.10045.4.3.3",SHA512withECDSA:"1.2.840.10045.4.3.4",dsa:"1.2.840.10040.4.1",SHA1withDSA:"1.2.840.10040.4.3",SHA224withDSA:"2.16.840.1.101.3.4.3.1",SHA256withDSA:"2.16.840.1.101.3.4.3.2",rsaEncryption:"1.2.840.113549.1.1.1",commonName:"2.5.4.3",localityName:"2.5.4.7",stateOrProvinceName:"2.5.4.8",organizationName:"2.5.4.10",organizationalUnitName:"2.5.4.11",countryName:"2.5.4.6",streetAddress:"2.5.4.9",domainComponent:"0.9.2342.19200300.100.1.25",userId:"0.9.2342.19200300.100.1.1",surname:"2.5.4.4",distinguishedName:"2.5.4.49",emailAddress:"1.2.840.113549.1.9.1",businessCategory:"2.5.4.15",postalCode:"2.5.4.17",jurisdictionOfIncorporationL:"1.3.6.1.4.1.311.60.2.1.1",jurisdictionOfIncorporationSP:"1.3.6.1.4.1.311.60.2.1.2",jurisdictionOfIncorporationC:"1.3.6.1.4.1.311.60.2.1.3",subjectKeyIdentifier:"2.5.29.14",keyUsage:"2.5.29.15",subjectAltName:"2.5.29.17",issuerAltName:"2.5.29.18",basicConstraints:"2.5.29.19",nameConstraints:"2.5.29.30",cRLDistributionPoints:"2.5.29.31",certificatePolicies:"2.5.29.32",authorityKeyIdentifier:"2.5.29.35",policyConstraints:"2.5.29.36",extKeyUsage:"2.5.29.37",authorityInfoAccess:"1.3.6.1.5.5.7.1.1",ocsp:"1.3.6.1.5.5.7.48.1",caIssuers:"1.3.6.1.5.5.7.48.2",anyExtendedKeyUsage:"2.5.29.37.0",serverAuth:"1.3.6.1.5.5.7.3.1",clientAuth:"1.3.6.1.5.5.7.3.2",codeSigning:"1.3.6.1.5.5.7.3.3",emailProtection:"1.3.6.1.5.5.7.3.4",timeStamping:"1.3.6.1.5.5.7.3.8",ocspSigning:"1.3.6.1.5.5.7.3.9",ecPublicKey:"1.2.840.10045.2.1",secp256r1:"1.2.840.10045.3.1.7",secp256k1:"1.3.132.0.10",secp384r1:"1.3.132.0.34",pkcs5PBES2:"1.2.840.113549.1.5.13",pkcs5PBKDF2:"1.2.840.113549.1.5.12","des-EDE3-CBC":"1.2.840.113549.3.7",data:"1.2.840.113549.1.7.1","signed-data":"1.2.840.113549.1.7.2","enveloped-data":"1.2.840.113549.1.7.3","digested-data":"1.2.840.113549.1.7.5","encrypted-data":"1.2.840.113549.1.7.6","authenticated-data":"1.2.840.113549.1.9.16.1.2",tstinfo:"1.2.840.113549.1.9.16.1.4",extensionRequest:"1.2.840.113549.1.9.14",};this.objCache={};this.name2obj=function(b){if(typeof this.objCache[b]!="undefined"){return this.objCache[b]}if(typeof this.name2oidList[b]=="undefined"){throw"Name of ObjectIdentifier not defined: "+b}var c=this.name2oidList[b];var d=new KJUR.asn1.DERObjectIdentifier({oid:c});this.objCache[b]=d;return d};this.atype2obj=function(b){if(typeof this.objCache[b]!="undefined"){return this.objCache[b]}if(typeof this.atype2oidList[b]=="undefined"){throw"AttributeType name undefined: "+b}var c=this.atype2oidList[b];var d=new KJUR.asn1.DERObjectIdentifier({oid:c});this.objCache[b]=d;return d}};KJUR.asn1.x509.OID.oid2name=function(b){var c=KJUR.asn1.x509.OID.name2oidList;for(var a in c){if(c[a]==b){return a}}return""};KJUR.asn1.x509.OID.oid2atype=function(b){var c=KJUR.asn1.x509.OID.atype2oidList;for(var a in c){if(c[a]==b){return a}}return b};KJUR.asn1.x509.OID.name2oid=function(a){var b=KJUR.asn1.x509.OID.name2oidList;if(b[a]===undefined){return""}return b[a]};KJUR.asn1.x509.X509Util={};KJUR.asn1.x509.X509Util.newCertPEM=function(h){var g=KJUR.asn1.x509,b=g.TBSCertificate,a=g.Certificate;var f=new b();if(h.serial!==undefined){f.setSerialNumberByParam(h.serial)}else{throw"serial number undefined."}if(typeof h.sigalg.name==="string"){f.setSignatureAlgByParam(h.sigalg)}else{throw"unproper signature algorithm name"}if(h.issuer!==undefined){f.setIssuerByParam(h.issuer)}else{throw"issuer name undefined."}if(h.notbefore!==undefined){f.setNotBeforeByParam(h.notbefore)}else{throw"notbefore undefined."}if(h.notafter!==undefined){f.setNotAfterByParam(h.notafter)}else{throw"notafter undefined."}if(h.subject!==undefined){f.setSubjectByParam(h.subject)}else{throw"subject name undefined."}if(h.sbjpubkey!==undefined){f.setSubjectPublicKeyByGetKey(h.sbjpubkey)}else{throw"subject public key undefined."}if(h.ext!==undefined&&h.ext.length!==undefined){for(var d=0;d<h.ext.length;d++){for(key in h.ext[d]){f.appendExtensionByName(key,h.ext[d][key])}}}if(h.cakey===undefined&&h.sighex===undefined){throw"param cakey and sighex undefined."}var e=null;var c=null;if(h.cakey){if(h.cakey.isPrivate===true){e=h.cakey}else{e=KEYUTIL.getKey.apply(null,h.cakey)}c=new a({tbscertobj:f,prvkeyobj:e});c.sign()}if(h.sighex){c=new a({tbscertobj:f});c.setSignatureHex(h.sighex)}return c.getPEMString()};
    if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.asn1=="undefined"||!KJUR.asn1){KJUR.asn1={}}if(typeof KJUR.asn1.cms=="undefined"||!KJUR.asn1.cms){KJUR.asn1.cms={}}KJUR.asn1.cms.Attribute=function(d){var a=[],c=KJUR,b=c.asn1;b.cms.Attribute.superclass.constructor.call(this);this.getEncodedHex=function(){var h,g,e;h=new b.DERObjectIdentifier({oid:this.attrTypeOid});g=new b.DERSet({array:this.valueList});try{g.getEncodedHex()}catch(f){throw"fail valueSet.getEncodedHex in Attribute(1)/"+f}e=new b.DERSequence({array:[h,g]});try{this.hTLV=e.getEncodedHex()}catch(f){throw"failed seq.getEncodedHex in Attribute(2)/"+f}return this.hTLV}};YAHOO.lang.extend(KJUR.asn1.cms.Attribute,KJUR.asn1.ASN1Object);KJUR.asn1.cms.ContentType=function(d){var c=KJUR,b=c.asn1;b.cms.ContentType.superclass.constructor.call(this);this.attrTypeOid="1.2.840.113549.1.9.3";var a=null;if(typeof d!="undefined"){var a=new b.DERObjectIdentifier(d);this.valueList=[a]}};YAHOO.lang.extend(KJUR.asn1.cms.ContentType,KJUR.asn1.cms.Attribute);KJUR.asn1.cms.MessageDigest=function(d){var b=KJUR,e=b.asn1,g=e.DEROctetString,i=e.cms;i.MessageDigest.superclass.constructor.call(this);this.attrTypeOid="1.2.840.113549.1.9.4";if(d!==undefined){if(d.eciObj instanceof i.EncapsulatedContentInfo&&typeof d.hashAlg==="string"){var h=d.eciObj.eContentValueHex;var c=d.hashAlg;var a=b.crypto.Util.hashHex(h,c);var f=new g({hex:a});f.getEncodedHex();this.valueList=[f]}else{var f=new g(d);f.getEncodedHex();this.valueList=[f]}}};YAHOO.lang.extend(KJUR.asn1.cms.MessageDigest,KJUR.asn1.cms.Attribute);KJUR.asn1.cms.SigningTime=function(e){var d=KJUR,c=d.asn1;c.cms.SigningTime.superclass.constructor.call(this);this.attrTypeOid="1.2.840.113549.1.9.5";if(e!==undefined){var a=new c.x509.Time(e);try{a.getEncodedHex()}catch(b){throw"SigningTime.getEncodedHex() failed/"+b}this.valueList=[a]}};YAHOO.lang.extend(KJUR.asn1.cms.SigningTime,KJUR.asn1.cms.Attribute);KJUR.asn1.cms.SigningCertificate=function(f){var c=KJUR,b=c.asn1,a=b.DERSequence,e=b.cms,d=c.crypto;e.SigningCertificate.superclass.constructor.call(this);this.attrTypeOid="1.2.840.113549.1.9.16.2.12";this.setCerts=function(n){var l=[];for(var k=0;k<n.length;k++){var h=pemtohex(n[k]);var g=c.crypto.Util.hashHex(h,"sha1");var o=new b.DEROctetString({hex:g});o.getEncodedHex();var m=new e.IssuerAndSerialNumber({cert:n[k]});m.getEncodedHex();var p=new a({array:[o,m]});p.getEncodedHex();l.push(p)}var j=new a({array:l});j.getEncodedHex();this.valueList=[j]};if(f!==undefined){if(typeof f.array=="object"){this.setCerts(f.array)}}};YAHOO.lang.extend(KJUR.asn1.cms.SigningCertificate,KJUR.asn1.cms.Attribute);KJUR.asn1.cms.SigningCertificateV2=function(h){var d=KJUR,c=d.asn1,b=c.DERSequence,g=c.x509,f=c.cms,e=d.crypto;f.SigningCertificateV2.superclass.constructor.call(this);this.attrTypeOid="1.2.840.113549.1.9.16.2.47";this.setCerts=function(r,k){var p=[];for(var n=0;n<r.length;n++){var l=pemtohex(r[n]);var t=[];if(k!=="sha256"){t.push(new g.AlgorithmIdentifier({name:k}))}var j=e.Util.hashHex(l,k);var s=new c.DEROctetString({hex:j});s.getEncodedHex();t.push(s);var o=new f.IssuerAndSerialNumber({cert:r[n]});o.getEncodedHex();t.push(o);var q=new b({array:t});q.getEncodedHex();p.push(q)}var m=new b({array:p});m.getEncodedHex();this.valueList=[m]};if(h!==undefined){if(typeof h.array=="object"){var a="sha256";if(typeof h.hashAlg=="string"){a=h.hashAlg}this.setCerts(h.array,a)}}};YAHOO.lang.extend(KJUR.asn1.cms.SigningCertificateV2,KJUR.asn1.cms.Attribute);KJUR.asn1.cms.IssuerAndSerialNumber=function(e){var b=KJUR,g=b.asn1,f=g.DERInteger,i=g.cms,d=g.x509,a=d.X500Name,c=X509;i.IssuerAndSerialNumber.superclass.constructor.call(this);var j=null;var h=null;this.setByCertPEM=function(n){var l=pemtohex(n);var k=new c();k.hex=l;var o=k.getIssuerHex();this.dIssuer=new a();this.dIssuer.hTLV=o;var m=k.getSerialNumberHex();this.dSerial=new f({hex:m})};this.getEncodedHex=function(){var k=new g.DERSequence({array:[this.dIssuer,this.dSerial]});this.hTLV=k.getEncodedHex();return this.hTLV};if(e!==undefined){if(typeof e=="string"&&e.indexOf("-----BEGIN ")!=-1){this.setByCertPEM(e)}if(e.issuer&&e.serial){if(e.issuer instanceof a){this.dIssuer=e.issuer}else{this.dIssuer=new a(e.issuer)}if(e.serial instanceof f){this.dSerial=e.serial}else{this.dSerial=new f(e.serial)}}if(typeof e.cert=="string"){this.setByCertPEM(e.cert)}}};YAHOO.lang.extend(KJUR.asn1.cms.IssuerAndSerialNumber,KJUR.asn1.ASN1Object);KJUR.asn1.cms.AttributeList=function(d){var b=KJUR,a=b.asn1,c=a.cms;c.AttributeList.superclass.constructor.call(this);this.list=new Array();this.sortFlag=true;this.add=function(e){if(e instanceof c.Attribute){this.list.push(e)}};this.length=function(){return this.list.length};this.clear=function(){this.list=new Array();this.hTLV=null;this.hV=null};this.getEncodedHex=function(){if(typeof this.hTLV=="string"){return this.hTLV}var e=new a.DERSet({array:this.list,sortflag:this.sortFlag});this.hTLV=e.getEncodedHex();return this.hTLV};if(d!==undefined){if(typeof d.sortflag!="undefined"&&d.sortflag==false){this.sortFlag=false}}};YAHOO.lang.extend(KJUR.asn1.cms.AttributeList,KJUR.asn1.ASN1Object);KJUR.asn1.cms.SignerInfo=function(e){var a=KJUR,h=a.asn1,b=h.DERTaggedObject,n=h.cms,j=n.AttributeList,g=n.ContentType,k=n.EncapsulatedContentInfo,c=n.MessageDigest,l=n.SignedData,d=h.x509,m=d.AlgorithmIdentifier,f=a.crypto,i=KEYUTIL;n.SignerInfo.superclass.constructor.call(this);this.dCMSVersion=new h.DERInteger({"int":1});this.dSignerIdentifier=null;this.dDigestAlgorithm=null;this.dSignedAttrs=new j();this.dSigAlg=null;this.dSig=null;this.dUnsignedAttrs=new j();this.setSignerIdentifier=function(p){if(typeof p=="string"&&p.indexOf("CERTIFICATE")!=-1&&p.indexOf("BEGIN")!=-1&&p.indexOf("END")!=-1){var o=p;this.dSignerIdentifier=new n.IssuerAndSerialNumber({cert:p})}};this.setForContentAndHash=function(o){if(o!==undefined){if(o.eciObj instanceof k){this.dSignedAttrs.add(new g({oid:"1.2.840.113549.1.7.1"}));this.dSignedAttrs.add(new c({eciObj:o.eciObj,hashAlg:o.hashAlg}))}if(o.sdObj!==undefined&&o.sdObj instanceof l){if(o.sdObj.digestAlgNameList.join(":").indexOf(o.hashAlg)==-1){o.sdObj.digestAlgNameList.push(o.hashAlg)}}if(typeof o.hashAlg=="string"){this.dDigestAlgorithm=new m({name:o.hashAlg})}}};this.sign=function(t,p){this.dSigAlg=new m({name:p});var q=this.dSignedAttrs.getEncodedHex();var o=i.getKey(t);var s=new f.Signature({alg:p});s.init(o);s.updateHex(q);var r=s.sign();this.dSig=new h.DEROctetString({hex:r})};this.addUnsigned=function(o){this.hTLV=null;this.dUnsignedAttrs.hTLV=null;this.dUnsignedAttrs.add(o)};this.getEncodedHex=function(){if(this.dSignedAttrs instanceof j&&this.dSignedAttrs.length()==0){throw"SignedAttrs length = 0 (empty)"}var o=new b({obj:this.dSignedAttrs,tag:"a0",explicit:false});var r=null;if(this.dUnsignedAttrs.length()>0){r=new b({obj:this.dUnsignedAttrs,tag:"a1",explicit:false})}var q=[this.dCMSVersion,this.dSignerIdentifier,this.dDigestAlgorithm,o,this.dSigAlg,this.dSig,];if(r!=null){q.push(r)}var p=new h.DERSequence({array:q});this.hTLV=p.getEncodedHex();return this.hTLV}};YAHOO.lang.extend(KJUR.asn1.cms.SignerInfo,KJUR.asn1.ASN1Object);KJUR.asn1.cms.EncapsulatedContentInfo=function(g){var c=KJUR,b=c.asn1,e=b.DERTaggedObject,a=b.DERSequence,h=b.DERObjectIdentifier,d=b.DEROctetString,f=b.cms;f.EncapsulatedContentInfo.superclass.constructor.call(this);this.dEContentType=new h({name:"data"});this.dEContent=null;this.isDetached=false;this.eContentValueHex=null;this.setContentType=function(i){if(i.match(/^[0-2][.][0-9.]+$/)){this.dEContentType=new h({oid:i})}else{this.dEContentType=new h({name:i})}};this.setContentValue=function(i){if(i!==undefined){if(typeof i.hex=="string"){this.eContentValueHex=i.hex}else{if(typeof i.str=="string"){this.eContentValueHex=utf8tohex(i.str)}}}};this.setContentValueHex=function(i){this.eContentValueHex=i};this.setContentValueStr=function(i){this.eContentValueHex=utf8tohex(i)};this.getEncodedHex=function(){if(typeof this.eContentValueHex!="string"){throw"eContentValue not yet set"}var k=new d({hex:this.eContentValueHex});this.dEContent=new e({obj:k,tag:"a0",explicit:true});var i=[this.dEContentType];if(!this.isDetached){i.push(this.dEContent)}var j=new a({array:i});this.hTLV=j.getEncodedHex();return this.hTLV}};YAHOO.lang.extend(KJUR.asn1.cms.EncapsulatedContentInfo,KJUR.asn1.ASN1Object);KJUR.asn1.cms.ContentInfo=function(f){var c=KJUR,b=c.asn1,d=b.DERTaggedObject,a=b.DERSequence,e=b.x509;KJUR.asn1.cms.ContentInfo.superclass.constructor.call(this);this.dContentType=null;this.dContent=null;this.setContentType=function(g){if(typeof g=="string"){this.dContentType=e.OID.name2obj(g)}};this.getEncodedHex=function(){var h=new d({obj:this.dContent,tag:"a0",explicit:true});var g=new a({array:[this.dContentType,h]});this.hTLV=g.getEncodedHex();return this.hTLV};if(f!==undefined){if(f.type){this.setContentType(f.type)}if(f.obj&&f.obj instanceof b.ASN1Object){this.dContent=f.obj}}};YAHOO.lang.extend(KJUR.asn1.cms.ContentInfo,KJUR.asn1.ASN1Object);KJUR.asn1.cms.SignedData=function(e){var a=KJUR,h=a.asn1,j=h.ASN1Object,g=h.DERInteger,m=h.DERSet,f=h.DERSequence,b=h.DERTaggedObject,l=h.cms,i=l.EncapsulatedContentInfo,d=l.SignerInfo,n=l.ContentInfo,c=h.x509,k=c.AlgorithmIdentifier;KJUR.asn1.cms.SignedData.superclass.constructor.call(this);this.dCMSVersion=new g({"int":1});this.dDigestAlgs=null;this.digestAlgNameList=[];this.dEncapContentInfo=new i();this.dCerts=null;this.certificateList=[];this.crlList=[];this.signerInfoList=[new d()];this.addCertificatesByPEM=function(p){var q=pemtohex(p);var r=new j();r.hTLV=q;this.certificateList.push(r)};this.getEncodedHex=function(){if(typeof this.hTLV=="string"){return this.hTLV}if(this.dDigestAlgs==null){var u=[];for(var t=0;t<this.digestAlgNameList.length;t++){var s=this.digestAlgNameList[t];var w=new k({name:s});u.push(w)}this.dDigestAlgs=new m({array:u})}var p=[this.dCMSVersion,this.dDigestAlgs,this.dEncapContentInfo];if(this.dCerts==null){if(this.certificateList.length>0){var v=new m({array:this.certificateList});this.dCerts=new b({obj:v,tag:"a0",explicit:false})}}if(this.dCerts!=null){p.push(this.dCerts)}var r=new m({array:this.signerInfoList});p.push(r);var q=new f({array:p});this.hTLV=q.getEncodedHex();return this.hTLV};this.getContentInfo=function(){this.getEncodedHex();var o=new n({type:"signed-data",obj:this});return o};this.getContentInfoEncodedHex=function(){var o=this.getContentInfo();var p=o.getEncodedHex();return p};this.getPEM=function(){return hextopem(this.getContentInfoEncodedHex(),"CMS")}};YAHOO.lang.extend(KJUR.asn1.cms.SignedData,KJUR.asn1.ASN1Object);KJUR.asn1.cms.CMSUtil=new function(){};KJUR.asn1.cms.CMSUtil.newSignedData=function(d){var b=KJUR,j=b.asn1,q=j.cms,f=q.SignerInfo,n=q.SignedData,o=q.SigningTime,a=q.SigningCertificate,p=q.SigningCertificateV2,c=j.cades,e=c.SignaturePolicyIdentifier;var m=new n();m.dEncapContentInfo.setContentValue(d.content);if(typeof d.certs=="object"){for(var h=0;h<d.certs.length;h++){m.addCertificatesByPEM(d.certs[h])}}m.signerInfoList=[];for(var h=0;h<d.signerInfos.length;h++){var k=d.signerInfos[h];var g=new f();g.setSignerIdentifier(k.signerCert);g.setForContentAndHash({sdObj:m,eciObj:m.dEncapContentInfo,hashAlg:k.hashAlg});for(attrName in k.sAttr){var r=k.sAttr[attrName];if(attrName=="SigningTime"){var l=new o(r);g.dSignedAttrs.add(l)}if(attrName=="SigningCertificate"){var l=new a(r);g.dSignedAttrs.add(l)}if(attrName=="SigningCertificateV2"){var l=new p(r);g.dSignedAttrs.add(l)}if(attrName=="SignaturePolicyIdentifier"){var l=new e(r);g.dSignedAttrs.add(l)}}g.sign(k.signerPrvKey,k.sigAlg);m.signerInfoList.push(g)}return m};
    if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.asn1=="undefined"||!KJUR.asn1){KJUR.asn1={}}if(typeof KJUR.asn1.tsp=="undefined"||!KJUR.asn1.tsp){KJUR.asn1.tsp={}}KJUR.asn1.tsp.Accuracy=function(f){var c=KJUR,b=c.asn1,e=b.DERInteger,a=b.DERSequence,d=b.DERTaggedObject;b.tsp.Accuracy.superclass.constructor.call(this);this.seconds=null;this.millis=null;this.micros=null;this.getEncodedHex=function(){var i=null;var k=null;var m=null;var g=[];if(this.seconds!=null){i=new e({"int":this.seconds});g.push(i)}if(this.millis!=null){var l=new e({"int":this.millis});k=new d({obj:l,tag:"80",explicit:false});g.push(k)}if(this.micros!=null){var j=new e({"int":this.micros});m=new d({obj:j,tag:"81",explicit:false});g.push(m)}var h=new a({array:g});this.hTLV=h.getEncodedHex();return this.hTLV};if(f!==undefined){if(typeof f.seconds=="number"){this.seconds=f.seconds}if(typeof f.millis=="number"){this.millis=f.millis}if(typeof f.micros=="number"){this.micros=f.micros}}};YAHOO.lang.extend(KJUR.asn1.tsp.Accuracy,KJUR.asn1.ASN1Object);KJUR.asn1.tsp.MessageImprint=function(g){var c=KJUR,b=c.asn1,a=b.DERSequence,d=b.DEROctetString,f=b.x509,e=f.AlgorithmIdentifier;b.tsp.MessageImprint.superclass.constructor.call(this);this.dHashAlg=null;this.dHashValue=null;this.getEncodedHex=function(){if(typeof this.hTLV=="string"){return this.hTLV}var h=new a({array:[this.dHashAlg,this.dHashValue]});return h.getEncodedHex()};if(g!==undefined){if(typeof g.hashAlg=="string"){this.dHashAlg=new e({name:g.hashAlg})}if(typeof g.hashValue=="string"){this.dHashValue=new d({hex:g.hashValue})}}};YAHOO.lang.extend(KJUR.asn1.tsp.MessageImprint,KJUR.asn1.ASN1Object);KJUR.asn1.tsp.TimeStampReq=function(c){var a=KJUR,f=a.asn1,d=f.DERSequence,e=f.DERInteger,g=f.DERBoolean,i=f.DERObjectIdentifier,h=f.tsp,b=h.MessageImprint;h.TimeStampReq.superclass.constructor.call(this);this.dVersion=new e({"int":1});this.dMessageImprint=null;this.dPolicy=null;this.dNonce=null;this.certReq=true;this.setMessageImprint=function(j){if(j instanceof b){this.dMessageImprint=j;return}if(typeof j=="object"){this.dMessageImprint=new b(j)}};this.getEncodedHex=function(){if(this.dMessageImprint==null){throw"messageImprint shall be specified"}var j=[this.dVersion,this.dMessageImprint];if(this.dPolicy!=null){j.push(this.dPolicy)}if(this.dNonce!=null){j.push(this.dNonce)}if(this.certReq){j.push(new g())}var k=new d({array:j});this.hTLV=k.getEncodedHex();return this.hTLV};if(c!==undefined){if(typeof c.mi=="object"){this.setMessageImprint(c.mi)}if(typeof c.policy=="object"){this.dPolicy=new i(c.policy)}if(typeof c.nonce=="object"){this.dNonce=new e(c.nonce)}if(typeof c.certreq=="boolean"){this.certReq=c.certreq}}};YAHOO.lang.extend(KJUR.asn1.tsp.TimeStampReq,KJUR.asn1.ASN1Object);KJUR.asn1.tsp.TSTInfo=function(e){var c=KJUR,i=c.asn1,f=i.DERSequence,h=i.DERInteger,k=i.DERBoolean,g=i.DERGeneralizedTime,l=i.DERObjectIdentifier,j=i.tsp,d=j.MessageImprint,b=j.Accuracy,a=i.x509.X500Name;j.TSTInfo.superclass.constructor.call(this);this.dVersion=new h({"int":1});this.dPolicy=null;this.dMessageImprint=null;this.dSerialNumber=null;this.dGenTime=null;this.dAccuracy=null;this.dOrdering=null;this.dNonce=null;this.dTsa=null;this.getEncodedHex=function(){var m=[this.dVersion];if(this.dPolicy==null){throw"policy shall be specified."}m.push(this.dPolicy);if(this.dMessageImprint==null){throw"messageImprint shall be specified."}m.push(this.dMessageImprint);if(this.dSerialNumber==null){throw"serialNumber shall be specified."}m.push(this.dSerialNumber);if(this.dGenTime==null){throw"genTime shall be specified."}m.push(this.dGenTime);if(this.dAccuracy!=null){m.push(this.dAccuracy)}if(this.dOrdering!=null){m.push(this.dOrdering)}if(this.dNonce!=null){m.push(this.dNonce)}if(this.dTsa!=null){m.push(this.dTsa)}var n=new f({array:m});this.hTLV=n.getEncodedHex();return this.hTLV};if(e!==undefined){if(typeof e.policy=="string"){if(!e.policy.match(/^[0-9.]+$/)){throw"policy shall be oid like 0.1.4.134"}this.dPolicy=new l({oid:e.policy})}if(e.messageImprint!==undefined){this.dMessageImprint=new d(e.messageImprint)}if(e.serialNumber!==undefined){this.dSerialNumber=new h(e.serialNumber)}if(e.genTime!==undefined){this.dGenTime=new g(e.genTime)}if(e.accuracy!==undefined){this.dAccuracy=new b(e.accuracy)}if(e.ordering!==undefined&&e.ordering==true){this.dOrdering=new k()}if(e.nonce!==undefined){this.dNonce=new h(e.nonce)}if(e.tsa!==undefined){this.dTsa=new a(e.tsa)}}};YAHOO.lang.extend(KJUR.asn1.tsp.TSTInfo,KJUR.asn1.ASN1Object);KJUR.asn1.tsp.TimeStampResp=function(g){var e=KJUR,d=e.asn1,c=d.DERSequence,f=d.ASN1Object,a=d.tsp,b=a.PKIStatusInfo;a.TimeStampResp.superclass.constructor.call(this);this.dStatus=null;this.dTST=null;this.getEncodedHex=function(){if(this.dStatus==null){throw"status shall be specified"}var h=[this.dStatus];if(this.dTST!=null){h.push(this.dTST)}var i=new c({array:h});this.hTLV=i.getEncodedHex();return this.hTLV};if(g!==undefined){if(typeof g.status=="object"){this.dStatus=new b(g.status)}if(g.tst!==undefined&&g.tst instanceof f){this.dTST=g.tst.getContentInfo()}}};YAHOO.lang.extend(KJUR.asn1.tsp.TimeStampResp,KJUR.asn1.ASN1Object);KJUR.asn1.tsp.PKIStatusInfo=function(h){var g=KJUR,f=g.asn1,e=f.DERSequence,a=f.tsp,d=a.PKIStatus,c=a.PKIFreeText,b=a.PKIFailureInfo;a.PKIStatusInfo.superclass.constructor.call(this);this.dStatus=null;this.dStatusString=null;this.dFailureInfo=null;this.getEncodedHex=function(){if(this.dStatus==null){throw"status shall be specified"}var i=[this.dStatus];if(this.dStatusString!=null){i.push(this.dStatusString)}if(this.dFailureInfo!=null){i.push(this.dFailureInfo)}var j=new e({array:i});this.hTLV=j.getEncodedHex();return this.hTLV};if(h!==undefined){if(typeof h.status=="object"){this.dStatus=new d(h.status)}if(typeof h.statstr=="object"){this.dStatusString=new c({array:h.statstr})}if(typeof h.failinfo=="object"){this.dFailureInfo=new b(h.failinfo)}}};YAHOO.lang.extend(KJUR.asn1.tsp.PKIStatusInfo,KJUR.asn1.ASN1Object);KJUR.asn1.tsp.PKIStatus=function(h){var d=KJUR,c=d.asn1,g=c.DERInteger,a=c.tsp,b=a.PKIStatus;a.PKIStatus.superclass.constructor.call(this);var f=null;this.getEncodedHex=function(){this.hTLV=this.dStatus.getEncodedHex();return this.hTLV};if(h!==undefined){if(h.name!==undefined){var e=b.valueList;if(e[h.name]===undefined){throw"name undefined: "+h.name}this.dStatus=new g({"int":e[h.name]})}else{this.dStatus=new g(h)}}};YAHOO.lang.extend(KJUR.asn1.tsp.PKIStatus,KJUR.asn1.ASN1Object);KJUR.asn1.tsp.PKIStatus.valueList={granted:0,grantedWithMods:1,rejection:2,waiting:3,revocationWarning:4,revocationNotification:5};KJUR.asn1.tsp.PKIFreeText=function(f){var e=KJUR,d=e.asn1,b=d.DERSequence,c=d.DERUTF8String,a=d.tsp;a.PKIFreeText.superclass.constructor.call(this);this.textList=[];this.getEncodedHex=function(){var g=[];for(var j=0;j<this.textList.length;j++){g.push(new c({str:this.textList[j]}))}var h=new b({array:g});this.hTLV=h.getEncodedHex();return this.hTLV};if(f!==undefined){if(typeof f.array=="object"){this.textList=f.array}}};YAHOO.lang.extend(KJUR.asn1.tsp.PKIFreeText,KJUR.asn1.ASN1Object);KJUR.asn1.tsp.PKIFailureInfo=function(g){var d=KJUR,c=d.asn1,f=c.DERBitString,a=c.tsp,b=a.PKIFailureInfo;b.superclass.constructor.call(this);this.value=null;this.getEncodedHex=function(){if(this.value==null){throw"value shall be specified"}var h=new Number(this.value).toString(2);var i=new f();i.setByBinaryString(h);this.hTLV=i.getEncodedHex();return this.hTLV};if(g!==undefined){if(typeof g.name=="string"){var e=b.valueList;if(e[g.name]===undefined){throw"name undefined: "+g.name}this.value=e[g.name]}else{if(typeof g["int"]=="number"){this.value=g["int"]}}}};YAHOO.lang.extend(KJUR.asn1.tsp.PKIFailureInfo,KJUR.asn1.ASN1Object);KJUR.asn1.tsp.PKIFailureInfo.valueList={badAlg:0,badRequest:2,badDataFormat:5,timeNotAvailable:14,unacceptedPolicy:15,unacceptedExtension:16,addInfoNotAvailable:17,systemFailure:25};KJUR.asn1.tsp.AbstractTSAAdapter=function(a){this.getTSTHex=function(c,b){throw"not implemented yet"}};KJUR.asn1.tsp.SimpleTSAAdapter=function(e){var d=KJUR,c=d.asn1,a=c.tsp,b=d.crypto.Util.hashHex;a.SimpleTSAAdapter.superclass.constructor.call(this);this.params=null;this.serial=0;this.getTSTHex=function(g,f){var i=b(g,f);this.params.tstInfo.messageImprint={hashAlg:f,hashValue:i};this.params.tstInfo.serialNumber={"int":this.serial++};var h=Math.floor(Math.random()*1000000000);this.params.tstInfo.nonce={"int":h};var j=a.TSPUtil.newTimeStampToken(this.params);return j.getContentInfoEncodedHex()};if(e!==undefined){this.params=e}};YAHOO.lang.extend(KJUR.asn1.tsp.SimpleTSAAdapter,KJUR.asn1.tsp.AbstractTSAAdapter);KJUR.asn1.tsp.FixedTSAAdapter=function(e){var d=KJUR,c=d.asn1,a=c.tsp,b=d.crypto.Util.hashHex;a.FixedTSAAdapter.superclass.constructor.call(this);this.params=null;this.getTSTHex=function(g,f){var h=b(g,f);this.params.tstInfo.messageImprint={hashAlg:f,hashValue:h};var i=a.TSPUtil.newTimeStampToken(this.params);return i.getContentInfoEncodedHex()};if(e!==undefined){this.params=e}};YAHOO.lang.extend(KJUR.asn1.tsp.FixedTSAAdapter,KJUR.asn1.tsp.AbstractTSAAdapter);KJUR.asn1.tsp.TSPUtil=new function(){};KJUR.asn1.tsp.TSPUtil.newTimeStampToken=function(c){var b=KJUR,h=b.asn1,m=h.cms,k=h.tsp,a=h.tsp.TSTInfo;var j=new m.SignedData();var g=new a(c.tstInfo);var f=g.getEncodedHex();j.dEncapContentInfo.setContentValue({hex:f});j.dEncapContentInfo.setContentType("tstinfo");if(typeof c.certs=="object"){for(var e=0;e<c.certs.length;e++){j.addCertificatesByPEM(c.certs[e])}}var d=j.signerInfoList[0];d.setSignerIdentifier(c.signerCert);d.setForContentAndHash({sdObj:j,eciObj:j.dEncapContentInfo,hashAlg:c.hashAlg});var l=new m.SigningCertificate({array:[c.signerCert]});d.dSignedAttrs.add(l);d.sign(c.signerPrvKey,c.sigAlg);return j};KJUR.asn1.tsp.TSPUtil.parseTimeStampReq=function(m){var l=ASN1HEX;var h=l.getChildIdx;var f=l.getV;var b=l.getTLV;var j={};j.certreq=false;var a=h(m,0);if(a.length<2){throw"TimeStampReq must have at least 2 items"}var e=b(m,a[1]);j.mi=KJUR.asn1.tsp.TSPUtil.parseMessageImprint(e);for(var d=2;d<a.length;d++){var g=a[d];var k=m.substr(g,2);if(k=="06"){var c=f(m,g);j.policy=l.hextooidstr(c)}if(k=="02"){j.nonce=f(m,g)}if(k=="01"){j.certreq=true}}return j};KJUR.asn1.tsp.TSPUtil.parseMessageImprint=function(c){var m=ASN1HEX;var j=m.getChildIdx;var i=m.getV;var g=m.getIdxbyList;var k={};if(c.substr(0,2)!="30"){throw"head of messageImprint hex shall be '30'"}var a=j(c,0);var l=g(c,0,[0,0]);var e=i(c,l);var d=m.hextooidstr(e);var h=KJUR.asn1.x509.OID.oid2name(d);if(h==""){throw"hashAlg name undefined: "+d}var b=h;var f=g(c,0,[1]);k.hashAlg=b;k.hashValue=i(c,f);return k};
    if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.asn1=="undefined"||!KJUR.asn1){KJUR.asn1={}}if(typeof KJUR.asn1.cades=="undefined"||!KJUR.asn1.cades){KJUR.asn1.cades={}}KJUR.asn1.cades.SignaturePolicyIdentifier=function(f){var b=KJUR,h=b.asn1,i=h.DERObjectIdentifier,g=h.DERSequence,e=h.cades,c=e.OtherHashAlgAndValue;e.SignaturePolicyIdentifier.superclass.constructor.call(this);this.attrTypeOid="1.2.840.113549.1.9.16.2.15";if(f!==undefined){if(typeof f.oid=="string"&&typeof f.hash=="object"){var d=new i({oid:f.oid});var a=new c(f.hash);var j=new g({array:[d,a]});this.valueList=[j]}}};YAHOO.lang.extend(KJUR.asn1.cades.SignaturePolicyIdentifier,KJUR.asn1.cms.Attribute);KJUR.asn1.cades.OtherHashAlgAndValue=function(e){var a=KJUR,g=a.asn1,f=g.DERSequence,h=g.DEROctetString,d=g.x509,i=d.AlgorithmIdentifier,c=g.cades,b=c.OtherHashAlgAndValue;b.superclass.constructor.call(this);this.dAlg=null;this.dHash=null;this.getEncodedHex=function(){var j=new f({array:[this.dAlg,this.dHash]});this.hTLV=j.getEncodedHex();return this.hTLV};if(e!==undefined){if(typeof e.alg=="string"&&typeof e.hash=="string"){this.dAlg=new i({name:e.alg});this.dHash=new h({hex:e.hash})}}};YAHOO.lang.extend(KJUR.asn1.cades.OtherHashAlgAndValue,KJUR.asn1.ASN1Object);KJUR.asn1.cades.SignatureTimeStamp=function(h){var c=KJUR,b=c.asn1,e=b.ASN1Object,g=b.x509,a=b.cades;a.SignatureTimeStamp.superclass.constructor.call(this);this.attrTypeOid="1.2.840.113549.1.9.16.2.14";this.tstHex=null;if(h!==undefined){if(h.res!==undefined){if(typeof h.res=="string"&&h.res.match(/^[0-9A-Fa-f]+$/)){}else{if(h.res instanceof e){}else{throw"res param shall be ASN1Object or hex string"}}}if(h.tst!==undefined){if(typeof h.tst=="string"&&h.tst.match(/^[0-9A-Fa-f]+$/)){var f=new e();this.tstHex=h.tst;f.hTLV=this.tstHex;f.getEncodedHex();this.valueList=[f]}else{if(h.tst instanceof e){}else{throw"tst param shall be ASN1Object or hex string"}}}}};YAHOO.lang.extend(KJUR.asn1.cades.SignatureTimeStamp,KJUR.asn1.cms.Attribute);KJUR.asn1.cades.CompleteCertificateRefs=function(d){var c=KJUR,b=c.asn1,a=b.cades;a.CompleteCertificateRefs.superclass.constructor.call(this);this.attrTypeOid="1.2.840.113549.1.9.16.2.21";this.setByArray=function(e){this.valueList=[];for(var f=0;f<e.length;f++){var g=new a.OtherCertID(e[f]);this.valueList.push(g)}};if(d!==undefined){if(typeof d=="object"&&typeof d.length=="number"){this.setByArray(d)}}};YAHOO.lang.extend(KJUR.asn1.cades.CompleteCertificateRefs,KJUR.asn1.cms.Attribute);KJUR.asn1.cades.OtherCertID=function(e){var c=KJUR,b=c.asn1,d=b.cms,a=b.cades;a.OtherCertID.superclass.constructor.call(this);this.hasIssuerSerial=true;this.dOtherCertHash=null;this.dIssuerSerial=null;this.setByCertPEM=function(f){this.dOtherCertHash=new a.OtherHash(f);if(this.hasIssuerSerial){this.dIssuerSerial=new d.IssuerAndSerialNumber(f)}};this.getEncodedHex=function(){if(this.hTLV!=null){return this.hTLV}if(this.dOtherCertHash==null){throw"otherCertHash not set"}var f=[this.dOtherCertHash];if(this.dIssuerSerial!=null){f.push(this.dIssuerSerial)}var g=new b.DERSequence({array:f});this.hTLV=g.getEncodedHex();return this.hTLV};if(e!==undefined){if(typeof e=="string"&&e.indexOf("-----BEGIN ")!=-1){this.setByCertPEM(e)}if(typeof e=="object"){if(e.hasis===false){this.hasIssuerSerial=false}if(typeof e.cert=="string"){this.setByCertPEM(e.cert)}}}};YAHOO.lang.extend(KJUR.asn1.cades.OtherCertID,KJUR.asn1.ASN1Object);KJUR.asn1.cades.OtherHash=function(f){var d=KJUR,c=d.asn1,e=c.cms,b=c.cades,g=b.OtherHashAlgAndValue,a=d.crypto.Util.hashHex;b.OtherHash.superclass.constructor.call(this);this.alg="sha256";this.dOtherHash=null;this.setByCertPEM=function(h){if(h.indexOf("-----BEGIN ")==-1){throw"certPEM not to seem PEM format"}var i=pemtohex(h);var j=a(i,this.alg);this.dOtherHash=new g({alg:this.alg,hash:j})};this.getEncodedHex=function(){if(this.dOtherHash==null){throw"OtherHash not set"}return this.dOtherHash.getEncodedHex()};if(f!==undefined){if(typeof f=="string"){if(f.indexOf("-----BEGIN ")!=-1){this.setByCertPEM(f)}else{if(f.match(/^[0-9A-Fa-f]+$/)){this.dOtherHash=new c.DEROctetString({hex:f})}else{throw"unsupported string value for params"}}}else{if(typeof f=="object"){if(typeof f.cert=="string"){if(typeof f.alg=="string"){this.alg=f.alg}this.setByCertPEM(f.cert)}else{this.dOtherHash=new g(f)}}}}};YAHOO.lang.extend(KJUR.asn1.cades.OtherHash,KJUR.asn1.ASN1Object);KJUR.asn1.cades.CAdESUtil=new function(){};KJUR.asn1.cades.CAdESUtil.addSigTS=function(c,b,a){};KJUR.asn1.cades.CAdESUtil.parseSignedDataForAddingUnsigned=function(e){var p=ASN1HEX,u=p.getChildIdx,b=p.getTLV,a=p.getTLVbyList,k=p.getIdxbyList,A=KJUR,g=A.asn1,l=g.ASN1Object,j=g.cms,h=j.SignedData,v=g.cades,z=v.CAdESUtil;var m={};if(a(e,0,[0])!="06092a864886f70d010702"){throw"hex is not CMS SignedData"}var y=k(e,0,[1,0]);var B=u(e,y);if(B.length<4){throw"num of SignedData elem shall be 4 at least"}var d=B.shift();m.version=b(e,d);var w=B.shift();m.algs=b(e,w);var c=B.shift();m.encapcontent=b(e,c);m.certs=null;m.revs=null;m.si=[];var o=B.shift();if(e.substr(o,2)=="a0"){m.certs=b(e,o);o=B.shift()}if(e.substr(o,2)=="a1"){m.revs=b(e,o);o=B.shift()}var t=o;if(e.substr(t,2)!="31"){throw"Can't find signerInfos"}var f=u(e,t);for(var q=0;q<f.length;q++){var s=f[q];var n=z.parseSignerInfoForAddingUnsigned(e,s,q);m.si[q]=n}var x=null;m.obj=new h();x=new l();x.hTLV=m.version;m.obj.dCMSVersion=x;x=new l();x.hTLV=m.algs;m.obj.dDigestAlgs=x;x=new l();x.hTLV=m.encapcontent;m.obj.dEncapContentInfo=x;x=new l();x.hTLV=m.certs;m.obj.dCerts=x;m.obj.signerInfoList=[];for(var q=0;q<m.si.length;q++){m.obj.signerInfoList.push(m.si[q].obj)}return m};KJUR.asn1.cades.CAdESUtil.parseSignerInfoForAddingUnsigned=function(g,q,c){var p=ASN1HEX,s=p.getChildIdx,a=p.getTLV,l=p.getV,v=KJUR,h=v.asn1,n=h.ASN1Object,j=h.cms,k=j.AttributeList,w=j.SignerInfo;var o={};var t=s(g,q);if(t.length!=6){throw"not supported items for SignerInfo (!=6)"}var d=t.shift();o.version=a(g,d);var e=t.shift();o.si=a(g,e);var m=t.shift();o.digalg=a(g,m);var f=t.shift();o.sattrs=a(g,f);var i=t.shift();o.sigalg=a(g,i);var b=t.shift();o.sig=a(g,b);o.sigval=l(g,b);var u=null;o.obj=new w();u=new n();u.hTLV=o.version;o.obj.dCMSVersion=u;u=new n();u.hTLV=o.si;o.obj.dSignerIdentifier=u;u=new n();u.hTLV=o.digalg;o.obj.dDigestAlgorithm=u;u=new n();u.hTLV=o.sattrs;o.obj.dSignedAttrs=u;u=new n();u.hTLV=o.sigalg;o.obj.dSigAlg=u;u=new n();u.hTLV=o.sig;o.obj.dSig=u;o.obj.dUnsignedAttrs=new k();return o};
    if(typeof KJUR.asn1.csr=="undefined"||!KJUR.asn1.csr){KJUR.asn1.csr={}}KJUR.asn1.csr.CertificationRequest=function(d){var a=KJUR,f=a.asn1,b=f.DERBitString,e=f.DERSequence,k=f.csr,c=f.x509;k.CertificationRequest.superclass.constructor.call(this);var l=null;var j=null;var h=null;var i=null;var g=null;this.sign=function(o,n){if(this.prvKey==null){this.prvKey=n}this.asn1SignatureAlg=new c.AlgorithmIdentifier({name:o});sig=new a.crypto.Signature({alg:o});sig.initSign(this.prvKey);sig.updateHex(this.asn1CSRInfo.getEncodedHex());this.hexSig=sig.sign();this.asn1Sig=new b({hex:"00"+this.hexSig});var m=new e({array:[this.asn1CSRInfo,this.asn1SignatureAlg,this.asn1Sig]});this.hTLV=m.getEncodedHex();this.isModified=false};this.getPEMString=function(){return hextopem(this.getEncodedHex(),"CERTIFICATE REQUEST")};this.getEncodedHex=function(){if(this.isModified==false&&this.hTLV!=null){return this.hTLV}throw"not signed yet"};if(d!==undefined&&d.csrinfo!==undefined){this.asn1CSRInfo=d.csrinfo}};YAHOO.lang.extend(KJUR.asn1.csr.CertificationRequest,KJUR.asn1.ASN1Object);KJUR.asn1.csr.CertificationRequestInfo=function(e){var b=KJUR,h=b.asn1,g=h.DERInteger,f=h.DERSequence,m=h.DERSet,j=h.DERNull,c=h.DERTaggedObject,k=h.DERObjectIdentifier,l=h.csr,d=h.x509,a=d.X500Name,n=d.Extension,i=KEYUTIL;l.CertificationRequestInfo.superclass.constructor.call(this);this._initialize=function(){this.asn1Array=new Array();this.asn1Version=new g({"int":0});this.asn1Subject=null;this.asn1SubjPKey=null;this.extensionsArray=new Array()};this.setSubjectByParam=function(o){this.asn1Subject=new a(o)};this.setSubjectPublicKeyByGetKey=function(p){var o=i.getKey(p);this.asn1SubjPKey=new d.SubjectPublicKeyInfo(o)};this.appendExtensionByName=function(p,o){n.appendByNameToArray(p,o,this.extensionsArray)};this.getEncodedHex=function(){this.asn1Array=new Array();this.asn1Array.push(this.asn1Version);this.asn1Array.push(this.asn1Subject);this.asn1Array.push(this.asn1SubjPKey);if(this.extensionsArray.length>0){var s=new f({array:this.extensionsArray});var r=new m({array:[s]});var q=new f({array:[new k({oid:"1.2.840.113549.1.9.14"}),r]});var p=new c({explicit:true,tag:"a0",obj:q});this.asn1Array.push(p)}else{var p=new c({explicit:false,tag:"a0",obj:new j()});this.asn1Array.push(p)}var t=new f({array:this.asn1Array});this.hTLV=t.getEncodedHex();this.isModified=false;return this.hTLV};this._initialize()};YAHOO.lang.extend(KJUR.asn1.csr.CertificationRequestInfo,KJUR.asn1.ASN1Object);KJUR.asn1.csr.CSRUtil=new function(){};KJUR.asn1.csr.CSRUtil.newCSRPEM=function(h){var c=KEYUTIL,b=KJUR.asn1.csr;if(h.subject===undefined){throw"parameter subject undefined"}if(h.sbjpubkey===undefined){throw"parameter sbjpubkey undefined"}if(h.sigalg===undefined){throw"parameter sigalg undefined"}if(h.sbjprvkey===undefined){throw"parameter sbjpubkey undefined"}var d=new b.CertificationRequestInfo();d.setSubjectByParam(h.subject);d.setSubjectPublicKeyByGetKey(h.sbjpubkey);if(h.ext!==undefined&&h.ext.length!==undefined){for(var e=0;e<h.ext.length;e++){for(key in h.ext[e]){d.appendExtensionByName(key,h.ext[e][key])}}}var f=new b.CertificationRequest({csrinfo:d});var a=c.getKey(h.sbjprvkey);f.sign(h.sigalg,a);var g=f.getPEMString();return g};KJUR.asn1.csr.CSRUtil.getInfo=function(b){var d=ASN1HEX;var e=d.getTLVbyList;var a={};a.subject={};a.pubkey={};if(b.indexOf("-----BEGIN CERTIFICATE REQUEST")==-1){throw"argument is not PEM file"}var c=pemtohex(b,"CERTIFICATE REQUEST");a.subject.hex=e(c,0,[0,1]);a.subject.name=X509.hex2dn(a.subject.hex);a.pubkey.hex=e(c,0,[0,2]);a.pubkey.obj=KEYUTIL.getKey(a.pubkey.hex,null,"pkcs8pub");return a};
    if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.asn1=="undefined"||!KJUR.asn1){KJUR.asn1={}}if(typeof KJUR.asn1.ocsp=="undefined"||!KJUR.asn1.ocsp){KJUR.asn1.ocsp={}}KJUR.asn1.ocsp.DEFAULT_HASH="sha1";KJUR.asn1.ocsp.CertID=function(g){var d=KJUR,k=d.asn1,m=k.DEROctetString,j=k.DERInteger,h=k.DERSequence,f=k.x509,n=f.AlgorithmIdentifier,o=k.ocsp,l=o.DEFAULT_HASH,i=d.crypto,e=i.Util.hashHex,c=X509,q=ASN1HEX;o.CertID.superclass.constructor.call(this);this.dHashAlg=null;this.dIssuerNameHash=null;this.dIssuerKeyHash=null;this.dSerialNumber=null;this.setByValue=function(t,s,p,r){if(r===undefined){r=l}this.dHashAlg=new n({name:r});this.dIssuerNameHash=new m({hex:t});this.dIssuerKeyHash=new m({hex:s});this.dSerialNumber=new j({hex:p})};this.setByCert=function(x,t,v){if(v===undefined){v=l}var p=new c();p.readCertPEM(t);var y=new c();y.readCertPEM(x);var z=y.getPublicKeyHex();var w=q.getTLVbyList(z,0,[1,0],"30");var r=p.getSerialNumberHex();var s=e(y.getSubjectHex(),v);var u=e(w,v);this.setByValue(s,u,r,v);this.hoge=p.getSerialNumberHex()};this.getEncodedHex=function(){if(this.dHashAlg===null&&this.dIssuerNameHash===null&&this.dIssuerKeyHash===null&&this.dSerialNumber===null){throw"not yet set values"}var p=[this.dHashAlg,this.dIssuerNameHash,this.dIssuerKeyHash,this.dSerialNumber];var r=new h({array:p});this.hTLV=r.getEncodedHex();return this.hTLV};if(g!==undefined){var b=g;if(b.issuerCert!==undefined&&b.subjectCert!==undefined){var a=l;if(b.alg===undefined){a=undefined}this.setByCert(b.issuerCert,b.subjectCert,a)}else{if(b.namehash!==undefined&&b.keyhash!==undefined&&b.serial!==undefined){var a=l;if(b.alg===undefined){a=undefined}this.setByValue(b.namehash,b.keyhash,b.serial,a)}else{throw"invalid constructor arguments"}}}};YAHOO.lang.extend(KJUR.asn1.ocsp.CertID,KJUR.asn1.ASN1Object);KJUR.asn1.ocsp.Request=function(f){var c=KJUR,b=c.asn1,a=b.DERSequence,d=b.ocsp;d.Request.superclass.constructor.call(this);this.dReqCert=null;this.dExt=null;this.getEncodedHex=function(){var g=[];if(this.dReqCert===null){throw"reqCert not set"}g.push(this.dReqCert);var h=new a({array:g});this.hTLV=h.getEncodedHex();return this.hTLV};if(typeof f!=="undefined"){var e=new d.CertID(f);this.dReqCert=e}};YAHOO.lang.extend(KJUR.asn1.ocsp.Request,KJUR.asn1.ASN1Object);KJUR.asn1.ocsp.TBSRequest=function(e){var c=KJUR,b=c.asn1,a=b.DERSequence,d=b.ocsp;d.TBSRequest.superclass.constructor.call(this);this.version=0;this.dRequestorName=null;this.dRequestList=[];this.dRequestExt=null;this.setRequestListByParam=function(h){var f=[];for(var g=0;g<h.length;g++){var j=new d.Request(h[0]);f.push(j)}this.dRequestList=f};this.getEncodedHex=function(){var f=[];if(this.version!==0){throw"not supported version: "+this.version}if(this.dRequestorName!==null){throw"requestorName not supported"}var h=new a({array:this.dRequestList});f.push(h);if(this.dRequestExt!==null){throw"requestExtensions not supported"}var g=new a({array:f});this.hTLV=g.getEncodedHex();return this.hTLV};if(e!==undefined){if(e.reqList!==undefined){this.setRequestListByParam(e.reqList)}}};YAHOO.lang.extend(KJUR.asn1.ocsp.TBSRequest,KJUR.asn1.ASN1Object);KJUR.asn1.ocsp.OCSPRequest=function(f){var c=KJUR,b=c.asn1,a=b.DERSequence,d=b.ocsp;d.OCSPRequest.superclass.constructor.call(this);this.dTbsRequest=null;this.dOptionalSignature=null;this.getEncodedHex=function(){var g=[];if(this.dTbsRequest!==null){g.push(this.dTbsRequest)}else{throw"tbsRequest not set"}if(this.dOptionalSignature!==null){throw"optionalSignature not supported"}var h=new a({array:g});this.hTLV=h.getEncodedHex();return this.hTLV};if(f!==undefined){if(f.reqList!==undefined){var e=new d.TBSRequest(f);this.dTbsRequest=e}}};YAHOO.lang.extend(KJUR.asn1.ocsp.OCSPRequest,KJUR.asn1.ASN1Object);KJUR.asn1.ocsp.OCSPUtil={};KJUR.asn1.ocsp.OCSPUtil.getRequestHex=function(a,b,h){var d=KJUR,c=d.asn1,e=c.ocsp;if(h===undefined){h=e.DEFAULT_HASH}var g={alg:h,issuerCert:a,subjectCert:b};var f=new e.OCSPRequest({reqList:[g]});return f.getEncodedHex()};KJUR.asn1.ocsp.OCSPUtil.getOCSPResponseInfo=function(b){var k=ASN1HEX;var c=k.getVbyList;var d=k.getIdxbyList;var c=k.getVbyList;var f=k.getV;var l={};try{var i=c(b,0,[0],"0a");l.responseStatus=parseInt(i,16)}catch(e){}if(l.responseStatus!==0){return l}try{var g=d(b,0,[1,0,1,0,0,2,0,1]);if(b.substr(g,2)==="80"){l.certStatus="good"}else{if(b.substr(g,2)==="a1"){l.certStatus="revoked";l.revocationTime=hextoutf8(c(b,g,[0]))}else{if(b.substr(g,2)==="82"){l.certStatus="unknown"}}}}catch(e){}try{var a=d(b,0,[1,0,1,0,0,2,0,2]);l.thisUpdate=hextoutf8(f(b,a))}catch(e){}try{var j=d(b,0,[1,0,1,0,0,2,0,3]);if(b.substr(j,2)==="a0"){l.nextUpdate=hextoutf8(c(b,j,[0]))}}catch(e){}return l};
    var KJUR;if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.lang=="undefined"||!KJUR.lang){KJUR.lang={}}KJUR.lang.String=function(){};function Base64x(){}function stoBA(d){var b=new Array();for(var c=0;c<d.length;c++){b[c]=d.charCodeAt(c)}return b}function BAtos(b){var d="";for(var c=0;c<b.length;c++){d=d+String.fromCharCode(b[c])}return d}function BAtohex(b){var e="";for(var d=0;d<b.length;d++){var c=b[d].toString(16);if(c.length==1){c="0"+c}e=e+c}return e}function stohex(a){return BAtohex(stoBA(a))}function stob64(a){return hex2b64(stohex(a))}function stob64u(a){return b64tob64u(hex2b64(stohex(a)))}function b64utos(a){return BAtos(b64toBA(b64utob64(a)))}function b64tob64u(a){a=a.replace(/\=/g,"");a=a.replace(/\+/g,"-");a=a.replace(/\//g,"_");return a}function b64utob64(a){if(a.length%4==2){a=a+"=="}else{if(a.length%4==3){a=a+"="}}a=a.replace(/-/g,"+");a=a.replace(/_/g,"/");return a}function hextob64u(a){if(a.length%2==1){a="0"+a}return b64tob64u(hex2b64(a))}function b64utohex(a){return b64tohex(b64utob64(a))}var utf8tob64u,b64utoutf8;if(typeof Buffer==="function"){utf8tob64u=function(a){return b64tob64u(new Buffer(a,"utf8").toString("base64"))};b64utoutf8=function(a){return new Buffer(b64utob64(a),"base64").toString("utf8")}}else{utf8tob64u=function(a){return hextob64u(uricmptohex(encodeURIComponentAll(a)))};b64utoutf8=function(a){return decodeURIComponent(hextouricmp(b64utohex(a)))}}function utf8tob64(a){return hex2b64(uricmptohex(encodeURIComponentAll(a)))}function b64toutf8(a){return decodeURIComponent(hextouricmp(b64tohex(a)))}function utf8tohex(a){return uricmptohex(encodeURIComponentAll(a))}function hextoutf8(a){return decodeURIComponent(hextouricmp(a))}function hextorstr(c){var b="";for(var a=0;a<c.length-1;a+=2){b+=String.fromCharCode(parseInt(c.substr(a,2),16))}return b}function rstrtohex(c){var a="";for(var b=0;b<c.length;b++){a+=("0"+c.charCodeAt(b).toString(16)).slice(-2)}return a}function hextob64(a){return hex2b64(a)}function hextob64nl(b){var a=hextob64(b);var c=a.replace(/(.{64})/g,"$1\r\n");c=c.replace(/\r\n$/,"");return c}function b64nltohex(b){var a=b.replace(/[^0-9A-Za-z\/+=]*/g,"");var c=b64tohex(a);return c}function hextopem(a,b){var c=hextob64nl(a);return"-----BEGIN "+b+"-----\r\n"+c+"\r\n-----END "+b+"-----\r\n"}function pemtohex(a,b){if(a.indexOf("-----BEGIN ")==-1){throw"can't find PEM header: "+b}if(b!==undefined){a=a.replace("-----BEGIN "+b+"-----","");a=a.replace("-----END "+b+"-----","")}else{a=a.replace(/-----BEGIN [^-]+-----/,"");a=a.replace(/-----END [^-]+-----/,"")}return b64nltohex(a)}function hextoArrayBuffer(d){if(d.length%2!=0){throw"input is not even length"}if(d.match(/^[0-9A-Fa-f]+$/)==null){throw"input is not hexadecimal"}var b=new ArrayBuffer(d.length/2);var a=new DataView(b);for(var c=0;c<d.length/2;c++){a.setUint8(c,parseInt(d.substr(c*2,2),16))}return b}function ArrayBuffertohex(b){var d="";var a=new DataView(b);for(var c=0;c<b.byteLength;c++){d+=("00"+a.getUint8(c).toString(16)).slice(-2)}return d}function zulutomsec(n){var l,j,m,e,f,i,b,k;var a,h,g,c;c=n.match(/^(\d{2}|\d{4})(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)(|\.\d+)Z$/);if(c){a=c[1];l=parseInt(a);if(a.length===2){if(50<=l&&l<100){l=1900+l}else{if(0<=l&&l<50){l=2000+l}}}j=parseInt(c[2])-1;m=parseInt(c[3]);e=parseInt(c[4]);f=parseInt(c[5]);i=parseInt(c[6]);b=0;h=c[7];if(h!==""){g=(h.substr(1)+"00").substr(0,3);b=parseInt(g)}return Date.UTC(l,j,m,e,f,i,b)}throw"unsupported zulu format: "+n}function zulutosec(a){var b=zulutomsec(a);return ~~(b/1000)}function zulutodate(a){return new Date(zulutomsec(a))}function datetozulu(g,e,f){var b;var a=g.getUTCFullYear();if(e){if(a<1950||2049<a){throw"not proper year for UTCTime: "+a}b=(""+a).slice(-2)}else{b=("000"+a).slice(-4)}b+=("0"+(g.getUTCMonth()+1)).slice(-2);b+=("0"+g.getUTCDate()).slice(-2);b+=("0"+g.getUTCHours()).slice(-2);b+=("0"+g.getUTCMinutes()).slice(-2);b+=("0"+g.getUTCSeconds()).slice(-2);if(f){var c=g.getUTCMilliseconds();if(c!==0){c=("00"+c).slice(-3);c=c.replace(/0+$/g,"");b+="."+c}}b+="Z";return b}function uricmptohex(a){return a.replace(/%/g,"")}function hextouricmp(a){return a.replace(/(..)/g,"%$1")}function encodeURIComponentAll(a){var d=encodeURIComponent(a);var b="";for(var c=0;c<d.length;c++){if(d[c]=="%"){b=b+d.substr(c,3);c=c+2}else{b=b+"%"+stohex(d[c])}}return b}function newline_toUnix(a){a=a.replace(/\r\n/mg,"\n");return a}function newline_toDos(a){a=a.replace(/\r\n/mg,"\n");a=a.replace(/\n/mg,"\r\n");return a}KJUR.lang.String.isInteger=function(a){if(a.match(/^[0-9]+$/)){return true}else{if(a.match(/^-[0-9]+$/)){return true}else{return false}}};KJUR.lang.String.isHex=function(a){if(a.length%2==0&&(a.match(/^[0-9a-f]+$/)||a.match(/^[0-9A-F]+$/))){return true}else{return false}};KJUR.lang.String.isBase64=function(a){a=a.replace(/\s+/g,"");if(a.match(/^[0-9A-Za-z+\/]+={0,3}$/)&&a.length%4==0){return true}else{return false}};KJUR.lang.String.isBase64URL=function(a){if(a.match(/[+/=]/)){return false}a=b64utob64(a);return KJUR.lang.String.isBase64(a)};KJUR.lang.String.isIntegerArray=function(a){a=a.replace(/\s+/g,"");if(a.match(/^\[[0-9,]+\]$/)){return true}else{return false}};function hextoposhex(a){if(a.length%2==1){return"0"+a}if(a.substr(0,1)>"7"){return"00"+a}return a}function intarystrtohex(b){b=b.replace(/^\s*\[\s*/,"");b=b.replace(/\s*\]\s*$/,"");b=b.replace(/\s*/g,"");try{var c=b.split(/,/).map(function(g,e,h){var f=parseInt(g);if(f<0||255<f){throw"integer not in range 0-255"}var d=("00"+f.toString(16)).slice(-2);return d}).join("");return c}catch(a){throw"malformed integer array string: "+a}}var strdiffidx=function(c,a){var d=c.length;if(c.length>a.length){d=a.length}for(var b=0;b<d;b++){if(c.charCodeAt(b)!=a.charCodeAt(b)){return b}}if(c.length!=a.length){return d}return -1};
    if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.crypto=="undefined"||!KJUR.crypto){KJUR.crypto={}}KJUR.crypto.Util=new function(){this.DIGESTINFOHEAD={sha1:"3021300906052b0e03021a05000414",sha224:"302d300d06096086480165030402040500041c",sha256:"3031300d060960864801650304020105000420",sha384:"3041300d060960864801650304020205000430",sha512:"3051300d060960864801650304020305000440",md2:"3020300c06082a864886f70d020205000410",md5:"3020300c06082a864886f70d020505000410",ripemd160:"3021300906052b2403020105000414",};this.DEFAULTPROVIDER={md5:"cryptojs",sha1:"cryptojs",sha224:"cryptojs",sha256:"cryptojs",sha384:"cryptojs",sha512:"cryptojs",ripemd160:"cryptojs",hmacmd5:"cryptojs",hmacsha1:"cryptojs",hmacsha224:"cryptojs",hmacsha256:"cryptojs",hmacsha384:"cryptojs",hmacsha512:"cryptojs",hmacripemd160:"cryptojs",MD5withRSA:"cryptojs/jsrsa",SHA1withRSA:"cryptojs/jsrsa",SHA224withRSA:"cryptojs/jsrsa",SHA256withRSA:"cryptojs/jsrsa",SHA384withRSA:"cryptojs/jsrsa",SHA512withRSA:"cryptojs/jsrsa",RIPEMD160withRSA:"cryptojs/jsrsa",MD5withECDSA:"cryptojs/jsrsa",SHA1withECDSA:"cryptojs/jsrsa",SHA224withECDSA:"cryptojs/jsrsa",SHA256withECDSA:"cryptojs/jsrsa",SHA384withECDSA:"cryptojs/jsrsa",SHA512withECDSA:"cryptojs/jsrsa",RIPEMD160withECDSA:"cryptojs/jsrsa",SHA1withDSA:"cryptojs/jsrsa",SHA224withDSA:"cryptojs/jsrsa",SHA256withDSA:"cryptojs/jsrsa",MD5withRSAandMGF1:"cryptojs/jsrsa",SHA1withRSAandMGF1:"cryptojs/jsrsa",SHA224withRSAandMGF1:"cryptojs/jsrsa",SHA256withRSAandMGF1:"cryptojs/jsrsa",SHA384withRSAandMGF1:"cryptojs/jsrsa",SHA512withRSAandMGF1:"cryptojs/jsrsa",RIPEMD160withRSAandMGF1:"cryptojs/jsrsa",};this.CRYPTOJSMESSAGEDIGESTNAME={md5:CryptoJS.algo.MD5,sha1:CryptoJS.algo.SHA1,sha224:CryptoJS.algo.SHA224,sha256:CryptoJS.algo.SHA256,sha384:CryptoJS.algo.SHA384,sha512:CryptoJS.algo.SHA512,ripemd160:CryptoJS.algo.RIPEMD160};this.getDigestInfoHex=function(a,b){if(typeof this.DIGESTINFOHEAD[b]=="undefined"){throw"alg not supported in Util.DIGESTINFOHEAD: "+b}return this.DIGESTINFOHEAD[b]+a};this.getPaddedDigestInfoHex=function(h,a,j){var c=this.getDigestInfoHex(h,a);var d=j/4;if(c.length+22>d){throw"key is too short for SigAlg: keylen="+j+","+a}var b="0001";var k="00"+c;var g="";var l=d-b.length-k.length;for(var f=0;f<l;f+=2){g+="ff"}var e=b+g+k;return e};this.hashString=function(a,c){var b=new KJUR.crypto.MessageDigest({alg:c});return b.digestString(a)};this.hashHex=function(b,c){var a=new KJUR.crypto.MessageDigest({alg:c});return a.digestHex(b)};this.sha1=function(a){var b=new KJUR.crypto.MessageDigest({alg:"sha1",prov:"cryptojs"});return b.digestString(a)};this.sha256=function(a){var b=new KJUR.crypto.MessageDigest({alg:"sha256",prov:"cryptojs"});return b.digestString(a)};this.sha256Hex=function(a){var b=new KJUR.crypto.MessageDigest({alg:"sha256",prov:"cryptojs"});return b.digestHex(a)};this.sha512=function(a){var b=new KJUR.crypto.MessageDigest({alg:"sha512",prov:"cryptojs"});return b.digestString(a)};this.sha512Hex=function(a){var b=new KJUR.crypto.MessageDigest({alg:"sha512",prov:"cryptojs"});return b.digestHex(a)}};KJUR.crypto.Util.md5=function(a){var b=new KJUR.crypto.MessageDigest({alg:"md5",prov:"cryptojs"});return b.digestString(a)};KJUR.crypto.Util.ripemd160=function(a){var b=new KJUR.crypto.MessageDigest({alg:"ripemd160",prov:"cryptojs"});return b.digestString(a)};KJUR.crypto.Util.SECURERANDOMGEN=new SecureRandom();KJUR.crypto.Util.getRandomHexOfNbytes=function(b){var a=new Array(b);KJUR.crypto.Util.SECURERANDOMGEN.nextBytes(a);return BAtohex(a)};KJUR.crypto.Util.getRandomBigIntegerOfNbytes=function(a){return new BigInteger(KJUR.crypto.Util.getRandomHexOfNbytes(a),16)};KJUR.crypto.Util.getRandomHexOfNbits=function(d){var c=d%8;var a=(d-c)/8;var b=new Array(a+1);KJUR.crypto.Util.SECURERANDOMGEN.nextBytes(b);b[0]=(((255<<c)&255)^255)&b[0];return BAtohex(b)};KJUR.crypto.Util.getRandomBigIntegerOfNbits=function(a){return new BigInteger(KJUR.crypto.Util.getRandomHexOfNbits(a),16)};KJUR.crypto.Util.getRandomBigIntegerZeroToMax=function(b){var a=b.bitLength();while(1){var c=KJUR.crypto.Util.getRandomBigIntegerOfNbits(a);if(b.compareTo(c)!=-1){return c}}};KJUR.crypto.Util.getRandomBigIntegerMinToMax=function(e,b){var c=e.compareTo(b);if(c==1){throw"biMin is greater than biMax"}if(c==0){return e}var a=b.subtract(e);var d=KJUR.crypto.Util.getRandomBigIntegerZeroToMax(a);return d.add(e)};KJUR.crypto.MessageDigest=function(c){var b=null;var a=null;var d=null;this.setAlgAndProvider=function(g,f){g=KJUR.crypto.MessageDigest.getCanonicalAlgName(g);if(g!==null&&f===undefined){f=KJUR.crypto.Util.DEFAULTPROVIDER[g]}if(":md5:sha1:sha224:sha256:sha384:sha512:ripemd160:".indexOf(g)!=-1&&f=="cryptojs"){try{this.md=KJUR.crypto.Util.CRYPTOJSMESSAGEDIGESTNAME[g].create()}catch(e){throw"setAlgAndProvider hash alg set fail alg="+g+"/"+e}this.updateString=function(h){this.md.update(h)};this.updateHex=function(h){var i=CryptoJS.enc.Hex.parse(h);this.md.update(i)};this.digest=function(){var h=this.md.finalize();return h.toString(CryptoJS.enc.Hex)};this.digestString=function(h){this.updateString(h);return this.digest()};this.digestHex=function(h){this.updateHex(h);return this.digest()}}if(":sha256:".indexOf(g)!=-1&&f=="sjcl"){try{this.md=new sjcl.hash.sha256()}catch(e){throw"setAlgAndProvider hash alg set fail alg="+g+"/"+e}this.updateString=function(h){this.md.update(h)};this.updateHex=function(i){var h=sjcl.codec.hex.toBits(i);this.md.update(h)};this.digest=function(){var h=this.md.finalize();return sjcl.codec.hex.fromBits(h)};this.digestString=function(h){this.updateString(h);return this.digest()};this.digestHex=function(h){this.updateHex(h);return this.digest()}}};this.updateString=function(e){throw"updateString(str) not supported for this alg/prov: "+this.algName+"/"+this.provName};this.updateHex=function(e){throw"updateHex(hex) not supported for this alg/prov: "+this.algName+"/"+this.provName};this.digest=function(){throw"digest() not supported for this alg/prov: "+this.algName+"/"+this.provName};this.digestString=function(e){throw"digestString(str) not supported for this alg/prov: "+this.algName+"/"+this.provName};this.digestHex=function(e){throw"digestHex(hex) not supported for this alg/prov: "+this.algName+"/"+this.provName};if(c!==undefined){if(c.alg!==undefined){this.algName=c.alg;if(c.prov===undefined){this.provName=KJUR.crypto.Util.DEFAULTPROVIDER[this.algName]}this.setAlgAndProvider(this.algName,this.provName)}}};KJUR.crypto.MessageDigest.getCanonicalAlgName=function(a){if(typeof a==="string"){a=a.toLowerCase();a=a.replace(/-/,"")}return a};KJUR.crypto.MessageDigest.getHashLength=function(c){var b=KJUR.crypto.MessageDigest;var a=b.getCanonicalAlgName(c);if(b.HASHLENGTH[a]===undefined){throw"not supported algorithm: "+c}return b.HASHLENGTH[a]};KJUR.crypto.MessageDigest.HASHLENGTH={md5:16,sha1:20,sha224:28,sha256:32,sha384:48,sha512:64,ripemd160:20};KJUR.crypto.Mac=function(d){var f=null;var c=null;var a=null;var e=null;var b=null;this.setAlgAndProvider=function(k,i){k=k.toLowerCase();if(k==null){k="hmacsha1"}k=k.toLowerCase();if(k.substr(0,4)!="hmac"){throw"setAlgAndProvider unsupported HMAC alg: "+k}if(i===undefined){i=KJUR.crypto.Util.DEFAULTPROVIDER[k]}this.algProv=k+"/"+i;var g=k.substr(4);if(":md5:sha1:sha224:sha256:sha384:sha512:ripemd160:".indexOf(g)!=-1&&i=="cryptojs"){try{var j=KJUR.crypto.Util.CRYPTOJSMESSAGEDIGESTNAME[g];this.mac=CryptoJS.algo.HMAC.create(j,this.pass)}catch(h){throw"setAlgAndProvider hash alg set fail hashAlg="+g+"/"+h}this.updateString=function(l){this.mac.update(l)};this.updateHex=function(l){var m=CryptoJS.enc.Hex.parse(l);this.mac.update(m)};this.doFinal=function(){var l=this.mac.finalize();return l.toString(CryptoJS.enc.Hex)};this.doFinalString=function(l){this.updateString(l);return this.doFinal()};this.doFinalHex=function(l){this.updateHex(l);return this.doFinal()}}};this.updateString=function(g){throw"updateString(str) not supported for this alg/prov: "+this.algProv};this.updateHex=function(g){throw"updateHex(hex) not supported for this alg/prov: "+this.algProv};this.doFinal=function(){throw"digest() not supported for this alg/prov: "+this.algProv};this.doFinalString=function(g){throw"digestString(str) not supported for this alg/prov: "+this.algProv};this.doFinalHex=function(g){throw"digestHex(hex) not supported for this alg/prov: "+this.algProv};this.setPassword=function(h){if(typeof h=="string"){var g=h;if(h.length%2==1||!h.match(/^[0-9A-Fa-f]+$/)){g=rstrtohex(h)}this.pass=CryptoJS.enc.Hex.parse(g);return}if(typeof h!="object"){throw"KJUR.crypto.Mac unsupported password type: "+h}var g=null;if(h.hex!==undefined){if(h.hex.length%2!=0||!h.hex.match(/^[0-9A-Fa-f]+$/)){throw"Mac: wrong hex password: "+h.hex}g=h.hex}if(h.utf8!==undefined){g=utf8tohex(h.utf8)}if(h.rstr!==undefined){g=rstrtohex(h.rstr)}if(h.b64!==undefined){g=b64tohex(h.b64)}if(h.b64u!==undefined){g=b64utohex(h.b64u)}if(g==null){throw"KJUR.crypto.Mac unsupported password type: "+h}this.pass=CryptoJS.enc.Hex.parse(g)};if(d!==undefined){if(d.pass!==undefined){this.setPassword(d.pass)}if(d.alg!==undefined){this.algName=d.alg;if(d.prov===undefined){this.provName=KJUR.crypto.Util.DEFAULTPROVIDER[this.algName]}this.setAlgAndProvider(this.algName,this.provName)}}};KJUR.crypto.Signature=function(o){var q=null;var n=null;var r=null;var c=null;var l=null;var d=null;var k=null;var h=null;var p=null;var e=null;var b=-1;var g=null;var j=null;var a=null;var i=null;var f=null;this._setAlgNames=function(){var s=this.algName.match(/^(.+)with(.+)$/);if(s){this.mdAlgName=s[1].toLowerCase();this.pubkeyAlgName=s[2].toLowerCase()}};this._zeroPaddingOfSignature=function(x,w){var v="";var t=w/4-x.length;for(var u=0;u<t;u++){v=v+"0"}return v+x};this.setAlgAndProvider=function(u,t){this._setAlgNames();if(t!="cryptojs/jsrsa"){throw"provider not supported: "+t}if(":md5:sha1:sha224:sha256:sha384:sha512:ripemd160:".indexOf(this.mdAlgName)!=-1){try{this.md=new KJUR.crypto.MessageDigest({alg:this.mdAlgName})}catch(s){throw"setAlgAndProvider hash alg set fail alg="+this.mdAlgName+"/"+s}this.init=function(w,x){var y=null;try{if(x===undefined){y=KEYUTIL.getKey(w)}else{y=KEYUTIL.getKey(w,x)}}catch(v){throw"init failed:"+v}if(y.isPrivate===true){this.prvKey=y;this.state="SIGN"}else{if(y.isPublic===true){this.pubKey=y;this.state="VERIFY"}else{throw"init failed.:"+y}}};this.updateString=function(v){this.md.updateString(v)};this.updateHex=function(v){this.md.updateHex(v)};this.sign=function(){this.sHashHex=this.md.digest();if(typeof this.ecprvhex!="undefined"&&typeof this.eccurvename!="undefined"){var v=new KJUR.crypto.ECDSA({curve:this.eccurvename});this.hSign=v.signHex(this.sHashHex,this.ecprvhex)}else{if(this.prvKey instanceof RSAKey&&this.pubkeyAlgName=="rsaandmgf1"){this.hSign=this.prvKey.signWithMessageHashPSS(this.sHashHex,this.mdAlgName,this.pssSaltLen)}else{if(this.prvKey instanceof RSAKey&&this.pubkeyAlgName=="rsa"){this.hSign=this.prvKey.signWithMessageHash(this.sHashHex,this.mdAlgName)}else{if(this.prvKey instanceof KJUR.crypto.ECDSA){this.hSign=this.prvKey.signWithMessageHash(this.sHashHex)}else{if(this.prvKey instanceof KJUR.crypto.DSA){this.hSign=this.prvKey.signWithMessageHash(this.sHashHex)}else{throw"Signature: unsupported public key alg: "+this.pubkeyAlgName}}}}}return this.hSign};this.signString=function(v){this.updateString(v);return this.sign()};this.signHex=function(v){this.updateHex(v);return this.sign()};this.verify=function(v){this.sHashHex=this.md.digest();if(typeof this.ecpubhex!="undefined"&&typeof this.eccurvename!="undefined"){var w=new KJUR.crypto.ECDSA({curve:this.eccurvename});return w.verifyHex(this.sHashHex,v,this.ecpubhex)}else{if(this.pubKey instanceof RSAKey&&this.pubkeyAlgName=="rsaandmgf1"){return this.pubKey.verifyWithMessageHashPSS(this.sHashHex,v,this.mdAlgName,this.pssSaltLen)}else{if(this.pubKey instanceof RSAKey&&this.pubkeyAlgName==="rsa"){return this.pubKey.verifyWithMessageHash(this.sHashHex,v)}else{if(KJUR.crypto.ECDSA!==undefined&&this.pubKey instanceof KJUR.crypto.ECDSA){return this.pubKey.verifyWithMessageHash(this.sHashHex,v)}else{if(KJUR.crypto.DSA!==undefined&&this.pubKey instanceof KJUR.crypto.DSA){return this.pubKey.verifyWithMessageHash(this.sHashHex,v)}else{throw"Signature: unsupported public key alg: "+this.pubkeyAlgName}}}}}}}};this.init=function(s,t){throw"init(key, pass) not supported for this alg:prov="+this.algProvName};this.updateString=function(s){throw"updateString(str) not supported for this alg:prov="+this.algProvName};this.updateHex=function(s){throw"updateHex(hex) not supported for this alg:prov="+this.algProvName};this.sign=function(){throw"sign() not supported for this alg:prov="+this.algProvName};this.signString=function(s){throw"digestString(str) not supported for this alg:prov="+this.algProvName};this.signHex=function(s){throw"digestHex(hex) not supported for this alg:prov="+this.algProvName};this.verify=function(s){throw"verify(hSigVal) not supported for this alg:prov="+this.algProvName};this.initParams=o;if(o!==undefined){if(o.alg!==undefined){this.algName=o.alg;if(o.prov===undefined){this.provName=KJUR.crypto.Util.DEFAULTPROVIDER[this.algName]}else{this.provName=o.prov}this.algProvName=this.algName+":"+this.provName;this.setAlgAndProvider(this.algName,this.provName);this._setAlgNames()}if(o.psssaltlen!==undefined){this.pssSaltLen=o.psssaltlen}if(o.prvkeypem!==undefined){if(o.prvkeypas!==undefined){throw"both prvkeypem and prvkeypas parameters not supported"}else{try{var q=KEYUTIL.getKey(o.prvkeypem);this.init(q)}catch(m){throw"fatal error to load pem private key: "+m}}}}};KJUR.crypto.Cipher=function(a){};KJUR.crypto.Cipher.encrypt=function(e,f,d){if(f instanceof RSAKey&&f.isPublic){var c=KJUR.crypto.Cipher.getAlgByKeyAndName(f,d);if(c==="RSA"){return f.encrypt(e)}if(c==="RSAOAEP"){return f.encryptOAEP(e,"sha1")}var b=c.match(/^RSAOAEP(\d+)$/);if(b!==null){return f.encryptOAEP(e,"sha"+b[1])}throw"Cipher.encrypt: unsupported algorithm for RSAKey: "+d}else{throw"Cipher.encrypt: unsupported key or algorithm"}};KJUR.crypto.Cipher.decrypt=function(e,f,d){if(f instanceof RSAKey&&f.isPrivate){var c=KJUR.crypto.Cipher.getAlgByKeyAndName(f,d);if(c==="RSA"){return f.decrypt(e)}if(c==="RSAOAEP"){return f.decryptOAEP(e,"sha1")}var b=c.match(/^RSAOAEP(\d+)$/);if(b!==null){return f.decryptOAEP(e,"sha"+b[1])}throw"Cipher.decrypt: unsupported algorithm for RSAKey: "+d}else{throw"Cipher.decrypt: unsupported key or algorithm"}};KJUR.crypto.Cipher.getAlgByKeyAndName=function(b,a){if(b instanceof RSAKey){if(":RSA:RSAOAEP:RSAOAEP224:RSAOAEP256:RSAOAEP384:RSAOAEP512:".indexOf(a)!=-1){return a}if(a===null||a===undefined){return"RSA"}throw"getAlgByKeyAndName: not supported algorithm name for RSAKey: "+a}throw"getAlgByKeyAndName: not supported algorithm name: "+a};KJUR.crypto.OID=new function(){this.oidhex2name={"2a864886f70d010101":"rsaEncryption","2a8648ce3d0201":"ecPublicKey","2a8648ce380401":"dsa","2a8648ce3d030107":"secp256r1","2b8104001f":"secp192k1","2b81040021":"secp224r1","2b8104000a":"secp256k1","2b81040023":"secp521r1","2b81040022":"secp384r1","2a8648ce380403":"SHA1withDSA","608648016503040301":"SHA224withDSA","608648016503040302":"SHA256withDSA",}};
    if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.crypto=="undefined"||!KJUR.crypto){KJUR.crypto={}}KJUR.crypto.ECDSA=function(h){var e="secp256r1";var g=null;var b=null;var f=null;var a=new SecureRandom();var d=null;this.type="EC";this.isPrivate=false;this.isPublic=false;function c(s,o,r,n){var j=Math.max(o.bitLength(),n.bitLength());var t=s.add2D(r);var q=s.curve.getInfinity();for(var p=j-1;p>=0;--p){q=q.twice2D();q.z=BigInteger.ONE;if(o.testBit(p)){if(n.testBit(p)){q=q.add2D(t)}else{q=q.add2D(s)}}else{if(n.testBit(p)){q=q.add2D(r)}}}return q}this.getBigRandom=function(i){return new BigInteger(i.bitLength(),a).mod(i.subtract(BigInteger.ONE)).add(BigInteger.ONE)};this.setNamedCurve=function(i){this.ecparams=KJUR.crypto.ECParameterDB.getByName(i);this.prvKeyHex=null;this.pubKeyHex=null;this.curveName=i};this.setPrivateKeyHex=function(i){this.isPrivate=true;this.prvKeyHex=i};this.setPublicKeyHex=function(i){this.isPublic=true;this.pubKeyHex=i};this.getPublicKeyXYHex=function(){var k=this.pubKeyHex;if(k.substr(0,2)!=="04"){throw"this method supports uncompressed format(04) only"}var j=this.ecparams.keylen/4;if(k.length!==2+j*2){throw"malformed public key hex length"}var i={};i.x=k.substr(2,j);i.y=k.substr(2+j);return i};this.getShortNISTPCurveName=function(){var i=this.curveName;if(i==="secp256r1"||i==="NIST P-256"||i==="P-256"||i==="prime256v1"){return"P-256"}if(i==="secp384r1"||i==="NIST P-384"||i==="P-384"){return"P-384"}return null};this.generateKeyPairHex=function(){var k=this.ecparams.n;var n=this.getBigRandom(k);var l=this.ecparams.G.multiply(n);var q=l.getX().toBigInteger();var o=l.getY().toBigInteger();var i=this.ecparams.keylen/4;var m=("0000000000"+n.toString(16)).slice(-i);var r=("0000000000"+q.toString(16)).slice(-i);var p=("0000000000"+o.toString(16)).slice(-i);var j="04"+r+p;this.setPrivateKeyHex(m);this.setPublicKeyHex(j);return{ecprvhex:m,ecpubhex:j}};this.signWithMessageHash=function(i){return this.signHex(i,this.prvKeyHex)};this.signHex=function(o,j){var t=new BigInteger(j,16);var l=this.ecparams.n;var q=new BigInteger(o,16);do{var m=this.getBigRandom(l);var u=this.ecparams.G;var p=u.multiply(m);var i=p.getX().toBigInteger().mod(l)}while(i.compareTo(BigInteger.ZERO)<=0);var v=m.modInverse(l).multiply(q.add(t.multiply(i))).mod(l);return KJUR.crypto.ECDSA.biRSSigToASN1Sig(i,v)};this.sign=function(m,u){var q=u;var j=this.ecparams.n;var p=BigInteger.fromByteArrayUnsigned(m);do{var l=this.getBigRandom(j);var t=this.ecparams.G;var o=t.multiply(l);var i=o.getX().toBigInteger().mod(j)}while(i.compareTo(BigInteger.ZERO)<=0);var v=l.modInverse(j).multiply(p.add(q.multiply(i))).mod(j);return this.serializeSig(i,v)};this.verifyWithMessageHash=function(j,i){return this.verifyHex(j,i,this.pubKeyHex)};this.verifyHex=function(m,i,p){var l,j;var o=KJUR.crypto.ECDSA.parseSigHex(i);l=o.r;j=o.s;var k;k=ECPointFp.decodeFromHex(this.ecparams.curve,p);var n=new BigInteger(m,16);return this.verifyRaw(n,l,j,k)};this.verify=function(o,p,j){var l,i;if(Bitcoin.Util.isArray(p)){var n=this.parseSig(p);l=n.r;i=n.s}else{if("object"===typeof p&&p.r&&p.s){l=p.r;i=p.s}else{throw"Invalid value for signature"}}var k;if(j instanceof ECPointFp){k=j}else{if(Bitcoin.Util.isArray(j)){k=ECPointFp.decodeFrom(this.ecparams.curve,j)}else{throw"Invalid format for pubkey value, must be byte array or ECPointFp"}}var m=BigInteger.fromByteArrayUnsigned(o);return this.verifyRaw(m,l,i,k)};this.verifyRaw=function(o,i,w,m){var l=this.ecparams.n;var u=this.ecparams.G;if(i.compareTo(BigInteger.ONE)<0||i.compareTo(l)>=0){return false}if(w.compareTo(BigInteger.ONE)<0||w.compareTo(l)>=0){return false}var p=w.modInverse(l);var k=o.multiply(p).mod(l);var j=i.multiply(p).mod(l);var q=u.multiply(k).add(m.multiply(j));var t=q.getX().toBigInteger().mod(l);return t.equals(i)};this.serializeSig=function(k,j){var l=k.toByteArraySigned();var i=j.toByteArraySigned();var m=[];m.push(2);m.push(l.length);m=m.concat(l);m.push(2);m.push(i.length);m=m.concat(i);m.unshift(m.length);m.unshift(48);return m};this.parseSig=function(n){var m;if(n[0]!=48){throw new Error("Signature not a valid DERSequence")}m=2;if(n[m]!=2){throw new Error("First element in signature must be a DERInteger")}var l=n.slice(m+2,m+2+n[m+1]);m+=2+n[m+1];if(n[m]!=2){throw new Error("Second element in signature must be a DERInteger")}var i=n.slice(m+2,m+2+n[m+1]);m+=2+n[m+1];var k=BigInteger.fromByteArrayUnsigned(l);var j=BigInteger.fromByteArrayUnsigned(i);return{r:k,s:j}};this.parseSigCompact=function(m){if(m.length!==65){throw"Signature has the wrong length"}var j=m[0]-27;if(j<0||j>7){throw"Invalid signature type"}var o=this.ecparams.n;var l=BigInteger.fromByteArrayUnsigned(m.slice(1,33)).mod(o);var k=BigInteger.fromByteArrayUnsigned(m.slice(33,65)).mod(o);return{r:l,s:k,i:j}};this.readPKCS5PrvKeyHex=function(l){var n=ASN1HEX;var m=KJUR.crypto.ECDSA.getName;var p=n.getVbyList;if(n.isASN1HEX(l)===false){throw"not ASN.1 hex string"}var i,k,o;try{i=p(l,0,[2,0],"06");k=p(l,0,[1],"04");try{o=p(l,0,[3,0],"03").substr(2)}catch(j){}}catch(j){throw"malformed PKCS#1/5 plain ECC private key"}this.curveName=m(i);if(this.curveName===undefined){throw"unsupported curve name"}this.setNamedCurve(this.curveName);this.setPublicKeyHex(o);this.setPrivateKeyHex(k);this.isPublic=false};this.readPKCS8PrvKeyHex=function(l){var q=ASN1HEX;var i=KJUR.crypto.ECDSA.getName;var n=q.getVbyList;if(q.isASN1HEX(l)===false){throw"not ASN.1 hex string"}var j,p,m,k;try{j=n(l,0,[1,0],"06");p=n(l,0,[1,1],"06");m=n(l,0,[2,0,1],"04");try{k=n(l,0,[2,0,2,0],"03").substr(2)}catch(o){}}catch(o){throw"malformed PKCS#8 plain ECC private key"}this.curveName=i(p);if(this.curveName===undefined){throw"unsupported curve name"}this.setNamedCurve(this.curveName);this.setPublicKeyHex(k);this.setPrivateKeyHex(m);this.isPublic=false};this.readPKCS8PubKeyHex=function(l){var n=ASN1HEX;var m=KJUR.crypto.ECDSA.getName;var p=n.getVbyList;if(n.isASN1HEX(l)===false){throw"not ASN.1 hex string"}var k,i,o;try{k=p(l,0,[0,0],"06");i=p(l,0,[0,1],"06");o=p(l,0,[1],"03").substr(2)}catch(j){throw"malformed PKCS#8 ECC public key"}this.curveName=m(i);if(this.curveName===null){throw"unsupported curve name"}this.setNamedCurve(this.curveName);this.setPublicKeyHex(o)};this.readCertPubKeyHex=function(k,p){if(p!==5){p=6}var m=ASN1HEX;var l=KJUR.crypto.ECDSA.getName;var o=m.getVbyList;if(m.isASN1HEX(k)===false){throw"not ASN.1 hex string"}var i,n;try{i=o(k,0,[0,p,0,1],"06");n=o(k,0,[0,p,1],"03").substr(2)}catch(j){throw"malformed X.509 certificate ECC public key"}this.curveName=l(i);if(this.curveName===null){throw"unsupported curve name"}this.setNamedCurve(this.curveName);this.setPublicKeyHex(n)};if(h!==undefined){if(h.curve!==undefined){this.curveName=h.curve}}if(this.curveName===undefined){this.curveName=e}this.setNamedCurve(this.curveName);if(h!==undefined){if(h.prv!==undefined){this.setPrivateKeyHex(h.prv)}if(h.pub!==undefined){this.setPublicKeyHex(h.pub)}}};KJUR.crypto.ECDSA.parseSigHex=function(a){var b=KJUR.crypto.ECDSA.parseSigHexInHexRS(a);var d=new BigInteger(b.r,16);var c=new BigInteger(b.s,16);return{r:d,s:c}};KJUR.crypto.ECDSA.parseSigHexInHexRS=function(f){var j=ASN1HEX;var i=j.getChildIdx;var g=j.getV;if(f.substr(0,2)!="30"){throw"signature is not a ASN.1 sequence"}var h=i(f,0);if(h.length!=2){throw"number of signature ASN.1 sequence elements seem wrong"}var e=h[0];var d=h[1];if(f.substr(e,2)!="02"){throw"1st item of sequene of signature is not ASN.1 integer"}if(f.substr(d,2)!="02"){throw"2nd item of sequene of signature is not ASN.1 integer"}var c=g(f,e);var b=g(f,d);return{r:c,s:b}};KJUR.crypto.ECDSA.asn1SigToConcatSig=function(c){var d=KJUR.crypto.ECDSA.parseSigHexInHexRS(c);var b=d.r;var a=d.s;if(b.substr(0,2)=="00"&&(((b.length/2)*8)%(16*8))==8){b=b.substr(2)}if(a.substr(0,2)=="00"&&(((a.length/2)*8)%(16*8))==8){a=a.substr(2)}if((((b.length/2)*8)%(16*8))!=0){throw"unknown ECDSA sig r length error"}if((((a.length/2)*8)%(16*8))!=0){throw"unknown ECDSA sig s length error"}return b+a};KJUR.crypto.ECDSA.concatSigToASN1Sig=function(a){if((((a.length/2)*8)%(16*8))!=0){throw"unknown ECDSA concatinated r-s sig  length error"}var c=a.substr(0,a.length/2);var b=a.substr(a.length/2);return KJUR.crypto.ECDSA.hexRSSigToASN1Sig(c,b)};KJUR.crypto.ECDSA.hexRSSigToASN1Sig=function(b,a){var d=new BigInteger(b,16);var c=new BigInteger(a,16);return KJUR.crypto.ECDSA.biRSSigToASN1Sig(d,c)};KJUR.crypto.ECDSA.biRSSigToASN1Sig=function(f,d){var c=KJUR.asn1;var b=new c.DERInteger({bigint:f});var a=new c.DERInteger({bigint:d});var e=new c.DERSequence({array:[b,a]});return e.getEncodedHex()};KJUR.crypto.ECDSA.getName=function(a){if(a==="2a8648ce3d030107"){return"secp256r1"}if(a==="2b8104000a"){return"secp256k1"}if(a==="2b81040022"){return"secp384r1"}if("|secp256r1|NIST P-256|P-256|prime256v1|".indexOf(a)!==-1){return"secp256r1"}if("|secp256k1|".indexOf(a)!==-1){return"secp256k1"}if("|secp384r1|NIST P-384|P-384|".indexOf(a)!==-1){return"secp384r1"}return null};
    if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.crypto=="undefined"||!KJUR.crypto){KJUR.crypto={}}KJUR.crypto.ECParameterDB=new function(){var b={};var c={};function a(d){return new BigInteger(d,16)}this.getByName=function(e){var d=e;if(typeof c[d]!="undefined"){d=c[e]}if(typeof b[d]!="undefined"){return b[d]}throw"unregistered EC curve name: "+d};this.regist=function(A,l,o,g,m,e,j,f,k,u,d,x){b[A]={};var s=a(o);var z=a(g);var y=a(m);var t=a(e);var w=a(j);var r=new ECCurveFp(s,z,y);var q=r.decodePointHex("04"+f+k);b[A]["name"]=A;b[A]["keylen"]=l;b[A]["curve"]=r;b[A]["G"]=q;b[A]["n"]=t;b[A]["h"]=w;b[A]["oid"]=d;b[A]["info"]=x;for(var v=0;v<u.length;v++){c[u[v]]=A}}};KJUR.crypto.ECParameterDB.regist("secp128r1",128,"FFFFFFFDFFFFFFFFFFFFFFFFFFFFFFFF","FFFFFFFDFFFFFFFFFFFFFFFFFFFFFFFC","E87579C11079F43DD824993C2CEE5ED3","FFFFFFFE0000000075A30D1B9038A115","1","161FF7528B899B2D0C28607CA52C5B86","CF5AC8395BAFEB13C02DA292DDED7A83",[],"","secp128r1 : SECG curve over a 128 bit prime field");KJUR.crypto.ECParameterDB.regist("secp160k1",160,"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFAC73","0","7","0100000000000000000001B8FA16DFAB9ACA16B6B3","1","3B4C382CE37AA192A4019E763036F4F5DD4D7EBB","938CF935318FDCED6BC28286531733C3F03C4FEE",[],"","secp160k1 : SECG curve over a 160 bit prime field");KJUR.crypto.ECParameterDB.regist("secp160r1",160,"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF7FFFFFFF","FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF7FFFFFFC","1C97BEFC54BD7A8B65ACF89F81D4D4ADC565FA45","0100000000000000000001F4C8F927AED3CA752257","1","4A96B5688EF573284664698968C38BB913CBFC82","23A628553168947D59DCC912042351377AC5FB32",[],"","secp160r1 : SECG curve over a 160 bit prime field");KJUR.crypto.ECParameterDB.regist("secp192k1",192,"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFEE37","0","3","FFFFFFFFFFFFFFFFFFFFFFFE26F2FC170F69466A74DEFD8D","1","DB4FF10EC057E9AE26B07D0280B7F4341DA5D1B1EAE06C7D","9B2F2F6D9C5628A7844163D015BE86344082AA88D95E2F9D",[]);KJUR.crypto.ECParameterDB.regist("secp192r1",192,"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFC","64210519E59C80E70FA7E9AB72243049FEB8DEECC146B9B1","FFFFFFFFFFFFFFFFFFFFFFFF99DEF836146BC9B1B4D22831","1","188DA80EB03090F67CBF20EB43A18800F4FF0AFD82FF1012","07192B95FFC8DA78631011ED6B24CDD573F977A11E794811",[]);KJUR.crypto.ECParameterDB.regist("secp224r1",224,"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF000000000000000000000001","FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFE","B4050A850C04B3ABF54132565044B0B7D7BFD8BA270B39432355FFB4","FFFFFFFFFFFFFFFFFFFFFFFFFFFF16A2E0B8F03E13DD29455C5C2A3D","1","B70E0CBD6BB4BF7F321390B94A03C1D356C21122343280D6115C1D21","BD376388B5F723FB4C22DFE6CD4375A05A07476444D5819985007E34",[]);KJUR.crypto.ECParameterDB.regist("secp256k1",256,"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F","0","7","FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141","1","79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798","483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8",[]);KJUR.crypto.ECParameterDB.regist("secp256r1",256,"FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF","FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFC","5AC635D8AA3A93E7B3EBBD55769886BC651D06B0CC53B0F63BCE3C3E27D2604B","FFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551","1","6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296","4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5",["NIST P-256","P-256","prime256v1"]);KJUR.crypto.ECParameterDB.regist("secp384r1",384,"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFF0000000000000000FFFFFFFF","FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFF0000000000000000FFFFFFFC","B3312FA7E23EE7E4988E056BE3F82D19181D9C6EFE8141120314088F5013875AC656398D8A2ED19D2A85C8EDD3EC2AEF","FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC7634D81F4372DDF581A0DB248B0A77AECEC196ACCC52973","1","AA87CA22BE8B05378EB1C71EF320AD746E1D3B628BA79B9859F741E082542A385502F25DBF55296C3A545E3872760AB7","3617de4a96262c6f5d9e98bf9292dc29f8f41dbd289a147ce9da3113b5f0b8c00a60b1ce1d7e819d7a431d7c90ea0e5f",["NIST P-384","P-384"]);KJUR.crypto.ECParameterDB.regist("secp521r1",521,"1FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF","1FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC","051953EB9618E1C9A1F929A21A0B68540EEA2DA725B99B315F3B8B489918EF109E156193951EC7E937B1652C0BD3BB1BF073573DF883D2C34F1EF451FD46B503F00","1FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFA51868783BF2F966B7FCC0148F709A5D03BB5C9B8899C47AEBB6FB71E91386409","1","C6858E06B70404E9CD9E3ECB662395B4429C648139053FB521F828AF606B4D3DBAA14B5E77EFE75928FE1DC127A2FFA8DE3348B3C1856A429BF97E7E31C2E5BD66","011839296a789a3bc0045c8a5fb42c7d1bd998f54449579b446817afbd17273e662c97ee72995ef42640c550b9013fad0761353c7086a272c24088be94769fd16650",["NIST P-521","P-521"]);
    if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.crypto=="undefined"||!KJUR.crypto){KJUR.crypto={}}KJUR.crypto.DSA=function(){this.p=null;this.q=null;this.g=null;this.y=null;this.x=null;this.type="DSA";this.isPrivate=false;this.isPublic=false;this.setPrivate=function(d,c,b,e,a){this.isPrivate=true;this.p=d;this.q=c;this.g=b;this.y=e;this.x=a};this.setPrivateHex=function(d,b,f,i,j){var c,a,e,g,h;c=new BigInteger(d,16);a=new BigInteger(b,16);e=new BigInteger(f,16);if(typeof i==="string"&&i.length>1){g=new BigInteger(i,16)}else{g=null}h=new BigInteger(j,16);this.setPrivate(c,a,e,g,h)};this.setPublic=function(c,b,a,d){this.isPublic=true;this.p=c;this.q=b;this.g=a;this.y=d;this.x=null};this.setPublicHex=function(f,e,d,g){var b,a,h,c;b=new BigInteger(f,16);a=new BigInteger(e,16);h=new BigInteger(d,16);c=new BigInteger(g,16);this.setPublic(b,a,h,c)};this.signWithMessageHash=function(d){var c=this.p;var b=this.q;var f=this.g;var i=this.y;var j=this.x;var e=KJUR.crypto.Util.getRandomBigIntegerMinToMax(BigInteger.ONE.add(BigInteger.ONE),b.subtract(BigInteger.ONE));var l=d.substr(0,b.bitLength()/4);var h=new BigInteger(l,16);var a=(f.modPow(e,c)).mod(b);var n=(e.modInverse(b).multiply(h.add(j.multiply(a)))).mod(b);var m=KJUR.asn1.ASN1Util.jsonToASN1HEX({seq:[{"int":{bigint:a}},{"int":{bigint:n}}]});return m};this.verifyWithMessageHash=function(h,f){var d=this.p;var b=this.q;var j=this.g;var l=this.y;var i=this.parseASN1Signature(f);var a=i[0];var t=i[1];var o=h.substr(0,b.bitLength()/4);var k=new BigInteger(o,16);if(BigInteger.ZERO.compareTo(a)>0||a.compareTo(b)>0){throw"invalid DSA signature"}if(BigInteger.ZERO.compareTo(t)>=0||t.compareTo(b)>0){throw"invalid DSA signature"}var m=t.modInverse(b);var e=k.multiply(m).mod(b);var c=a.multiply(m).mod(b);var n=j.modPow(e,d).multiply(l.modPow(c,d)).mod(d).mod(b);return n.compareTo(a)==0};this.parseASN1Signature=function(a){try{var d=new BigInteger(ASN1HEX.getVbyList(a,0,[0],"02"),16);var c=new BigInteger(ASN1HEX.getVbyList(a,0,[1],"02"),16);return[d,c]}catch(b){throw"malformed ASN.1 DSA signature"}};this.readPKCS5PrvKeyHex=function(c){var b,a,f,g,i;var j=ASN1HEX;var d=j.getVbyList;if(j.isASN1HEX(c)===false){throw"not ASN.1 hex string"}try{b=d(c,0,[1],"02");a=d(c,0,[2],"02");f=d(c,0,[3],"02");g=d(c,0,[4],"02");i=d(c,0,[5],"02")}catch(e){console.log("EXCEPTION:"+e);throw"malformed PKCS#1/5 plain DSA private key"}this.setPrivateHex(b,a,f,g,i)};this.readPKCS8PrvKeyHex=function(d){var f,c,b,g;var e=ASN1HEX;var i=e.getVbyList;if(e.isASN1HEX(d)===false){throw"not ASN.1 hex string"}try{f=i(d,0,[1,1,0],"02");c=i(d,0,[1,1,1],"02");b=i(d,0,[1,1,2],"02");g=i(d,0,[2,0],"02")}catch(a){console.log("EXCEPTION:"+a);throw"malformed PKCS#8 plain DSA private key"}this.setPrivateHex(f,c,b,null,g)};this.readPKCS8PubKeyHex=function(d){var f,c,b,g;var e=ASN1HEX;var i=e.getVbyList;if(e.isASN1HEX(d)===false){throw"not ASN.1 hex string"}try{f=i(d,0,[0,1,0],"02");c=i(d,0,[0,1,1],"02");b=i(d,0,[0,1,2],"02");g=i(d,0,[1,0],"02")}catch(a){console.log("EXCEPTION:"+a);throw"malformed PKCS#8 DSA public key"}this.setPublicHex(f,c,b,g)};this.readCertPubKeyHex=function(c,f){if(f!==5){f=6}var b,a,g,i;var j=ASN1HEX;var d=j.getVbyList;if(j.isASN1HEX(c)===false){throw"not ASN.1 hex string"}try{b=d(c,0,[0,f,0,1,0],"02");a=d(c,0,[0,f,0,1,1],"02");g=d(c,0,[0,f,0,1,2],"02");i=d(c,0,[0,f,1,0],"02")}catch(e){console.log("EXCEPTION:"+e);throw"malformed X.509 certificate DSA public key"}this.setPublicHex(b,a,g,i)}};
    var KEYUTIL=function(){var d=function(p,r,q){return k(CryptoJS.AES,p,r,q)};var e=function(p,r,q){return k(CryptoJS.TripleDES,p,r,q)};var a=function(p,r,q){return k(CryptoJS.DES,p,r,q)};var k=function(s,x,u,q){var r=CryptoJS.enc.Hex.parse(x);var w=CryptoJS.enc.Hex.parse(u);var p=CryptoJS.enc.Hex.parse(q);var t={};t.key=w;t.iv=p;t.ciphertext=r;var v=s.decrypt(t,w,{iv:p});return CryptoJS.enc.Hex.stringify(v)};var l=function(p,r,q){return g(CryptoJS.AES,p,r,q)};var o=function(p,r,q){return g(CryptoJS.TripleDES,p,r,q)};var f=function(p,r,q){return g(CryptoJS.DES,p,r,q)};var g=function(t,y,v,q){var s=CryptoJS.enc.Hex.parse(y);var x=CryptoJS.enc.Hex.parse(v);var p=CryptoJS.enc.Hex.parse(q);var w=t.encrypt(s,x,{iv:p});var r=CryptoJS.enc.Hex.parse(w.toString());var u=CryptoJS.enc.Base64.stringify(r);return u};var i={"AES-256-CBC":{proc:d,eproc:l,keylen:32,ivlen:16},"AES-192-CBC":{proc:d,eproc:l,keylen:24,ivlen:16},"AES-128-CBC":{proc:d,eproc:l,keylen:16,ivlen:16},"DES-EDE3-CBC":{proc:e,eproc:o,keylen:24,ivlen:8},"DES-CBC":{proc:a,eproc:f,keylen:8,ivlen:8}};var c=function(p){return i[p]["proc"]};var m=function(p){var r=CryptoJS.lib.WordArray.random(p);var q=CryptoJS.enc.Hex.stringify(r);return q};var n=function(v){var w={};var q=v.match(new RegExp("DEK-Info: ([^,]+),([0-9A-Fa-f]+)","m"));if(q){w.cipher=q[1];w.ivsalt=q[2]}var p=v.match(new RegExp("-----BEGIN ([A-Z]+) PRIVATE KEY-----"));if(p){w.type=p[1]}var u=-1;var x=0;if(v.indexOf("\r\n\r\n")!=-1){u=v.indexOf("\r\n\r\n");x=2}if(v.indexOf("\n\n")!=-1){u=v.indexOf("\n\n");x=1}var t=v.indexOf("-----END");if(u!=-1&&t!=-1){var r=v.substring(u+x*2,t-x);r=r.replace(/\s+/g,"");w.data=r}return w};var j=function(q,y,p){var v=p.substring(0,16);var t=CryptoJS.enc.Hex.parse(v);var r=CryptoJS.enc.Utf8.parse(y);var u=i[q]["keylen"]+i[q]["ivlen"];var x="";var w=null;for(;;){var s=CryptoJS.algo.MD5.create();if(w!=null){s.update(w)}s.update(r);s.update(t);w=s.finalize();x=x+CryptoJS.enc.Hex.stringify(w);if(x.length>=u*2){break}}var z={};z.keyhex=x.substr(0,i[q]["keylen"]*2);z.ivhex=x.substr(i[q]["keylen"]*2,i[q]["ivlen"]*2);return z};var b=function(p,v,r,w){var s=CryptoJS.enc.Base64.parse(p);var q=CryptoJS.enc.Hex.stringify(s);var u=i[v]["proc"];var t=u(q,r,w);return t};var h=function(p,s,q,u){var r=i[s]["eproc"];var t=r(p,q,u);return t};return{version:"1.0.0",parsePKCS5PEM:function(p){return n(p)},getKeyAndUnusedIvByPasscodeAndIvsalt:function(q,p,r){return j(q,p,r)},decryptKeyB64:function(p,r,q,s){return b(p,r,q,s)},getDecryptedKeyHex:function(y,x){var q=n(y);var t=q.type;var r=q.cipher;var p=q.ivsalt;var s=q.data;var w=j(r,x,p);var v=w.keyhex;var u=b(s,r,v,p);return u},getEncryptedPKCS5PEMFromPrvKeyHex:function(x,s,A,t,r){var p="";if(typeof t=="undefined"||t==null){t="AES-256-CBC"}if(typeof i[t]=="undefined"){throw"KEYUTIL unsupported algorithm: "+t}if(typeof r=="undefined"||r==null){var v=i[t]["ivlen"];var u=m(v);r=u.toUpperCase()}var z=j(t,A,r);var y=z.keyhex;var w=h(s,t,y,r);var q=w.replace(/(.{64})/g,"$1\r\n");var p="-----BEGIN "+x+" PRIVATE KEY-----\r\n";p+="Proc-Type: 4,ENCRYPTED\r\n";p+="DEK-Info: "+t+","+r+"\r\n";p+="\r\n";p+=q;p+="\r\n-----END "+x+" PRIVATE KEY-----\r\n";return p},parseHexOfEncryptedPKCS8:function(y){var B=ASN1HEX;var z=B.getChildIdx;var w=B.getV;var t={};var r=z(y,0);if(r.length!=2){throw"malformed format: SEQUENCE(0).items != 2: "+r.length}t.ciphertext=w(y,r[1]);var A=z(y,r[0]);if(A.length!=2){throw"malformed format: SEQUENCE(0.0).items != 2: "+A.length}if(w(y,A[0])!="2a864886f70d01050d"){throw"this only supports pkcs5PBES2"}var p=z(y,A[1]);if(A.length!=2){throw"malformed format: SEQUENCE(0.0.1).items != 2: "+p.length}var q=z(y,p[1]);if(q.length!=2){throw"malformed format: SEQUENCE(0.0.1.1).items != 2: "+q.length}if(w(y,q[0])!="2a864886f70d0307"){throw"this only supports TripleDES"}t.encryptionSchemeAlg="TripleDES";t.encryptionSchemeIV=w(y,q[1]);var s=z(y,p[0]);if(s.length!=2){throw"malformed format: SEQUENCE(0.0.1.0).items != 2: "+s.length}if(w(y,s[0])!="2a864886f70d01050c"){throw"this only supports pkcs5PBKDF2"}var x=z(y,s[1]);if(x.length<2){throw"malformed format: SEQUENCE(0.0.1.0.1).items < 2: "+x.length}t.pbkdf2Salt=w(y,x[0]);var u=w(y,x[1]);try{t.pbkdf2Iter=parseInt(u,16)}catch(v){throw"malformed format pbkdf2Iter: "+u}return t},getPBKDF2KeyHexFromParam:function(u,p){var t=CryptoJS.enc.Hex.parse(u.pbkdf2Salt);var q=u.pbkdf2Iter;var s=CryptoJS.PBKDF2(p,t,{keySize:192/32,iterations:q});var r=CryptoJS.enc.Hex.stringify(s);return r},_getPlainPKCS8HexFromEncryptedPKCS8PEM:function(x,y){var r=pemtohex(x,"ENCRYPTED PRIVATE KEY");var p=this.parseHexOfEncryptedPKCS8(r);var u=KEYUTIL.getPBKDF2KeyHexFromParam(p,y);var v={};v.ciphertext=CryptoJS.enc.Hex.parse(p.ciphertext);var t=CryptoJS.enc.Hex.parse(u);var s=CryptoJS.enc.Hex.parse(p.encryptionSchemeIV);var w=CryptoJS.TripleDES.decrypt(v,t,{iv:s});var q=CryptoJS.enc.Hex.stringify(w);return q},getKeyFromEncryptedPKCS8PEM:function(s,q){var p=this._getPlainPKCS8HexFromEncryptedPKCS8PEM(s,q);var r=this.getKeyFromPlainPrivatePKCS8Hex(p);return r},parsePlainPrivatePKCS8Hex:function(s){var v=ASN1HEX;var u=v.getChildIdx;var t=v.getV;var q={};q.algparam=null;if(s.substr(0,2)!="30"){throw"malformed plain PKCS8 private key(code:001)"}var r=u(s,0);if(r.length!=3){throw"malformed plain PKCS8 private key(code:002)"}if(s.substr(r[1],2)!="30"){throw"malformed PKCS8 private key(code:003)"}var p=u(s,r[1]);if(p.length!=2){throw"malformed PKCS8 private key(code:004)"}if(s.substr(p[0],2)!="06"){throw"malformed PKCS8 private key(code:005)"}q.algoid=t(s,p[0]);if(s.substr(p[1],2)=="06"){q.algparam=t(s,p[1])}if(s.substr(r[2],2)!="04"){throw"malformed PKCS8 private key(code:006)"}q.keyidx=v.getVidx(s,r[2]);return q},getKeyFromPlainPrivatePKCS8PEM:function(q){var p=pemtohex(q,"PRIVATE KEY");var r=this.getKeyFromPlainPrivatePKCS8Hex(p);return r},getKeyFromPlainPrivatePKCS8Hex:function(p){var q=this.parsePlainPrivatePKCS8Hex(p);var r;if(q.algoid=="2a864886f70d010101"){r=new RSAKey()}else{if(q.algoid=="2a8648ce380401"){r=new KJUR.crypto.DSA()}else{if(q.algoid=="2a8648ce3d0201"){r=new KJUR.crypto.ECDSA()}else{throw"unsupported private key algorithm"}}}r.readPKCS8PrvKeyHex(p);return r},_getKeyFromPublicPKCS8Hex:function(q){var p;var r=ASN1HEX.getVbyList(q,0,[0,0],"06");if(r==="2a864886f70d010101"){p=new RSAKey()}else{if(r==="2a8648ce380401"){p=new KJUR.crypto.DSA()}else{if(r==="2a8648ce3d0201"){p=new KJUR.crypto.ECDSA()}else{throw"unsupported PKCS#8 public key hex"}}}p.readPKCS8PubKeyHex(q);return p},parsePublicRawRSAKeyHex:function(r){var u=ASN1HEX;var t=u.getChildIdx;var s=u.getV;var p={};if(r.substr(0,2)!="30"){throw"malformed RSA key(code:001)"}var q=t(r,0);if(q.length!=2){throw"malformed RSA key(code:002)"}if(r.substr(q[0],2)!="02"){throw"malformed RSA key(code:003)"}p.n=s(r,q[0]);if(r.substr(q[1],2)!="02"){throw"malformed RSA key(code:004)"}p.e=s(r,q[1]);return p},parsePublicPKCS8Hex:function(t){var v=ASN1HEX;var u=v.getChildIdx;var s=v.getV;var q={};q.algparam=null;var r=u(t,0);if(r.length!=2){throw"outer DERSequence shall have 2 elements: "+r.length}var w=r[0];if(t.substr(w,2)!="30"){throw"malformed PKCS8 public key(code:001)"}var p=u(t,w);if(p.length!=2){throw"malformed PKCS8 public key(code:002)"}if(t.substr(p[0],2)!="06"){throw"malformed PKCS8 public key(code:003)"}q.algoid=s(t,p[0]);if(t.substr(p[1],2)=="06"){q.algparam=s(t,p[1])}else{if(t.substr(p[1],2)=="30"){q.algparam={};q.algparam.p=v.getVbyList(t,p[1],[0],"02");q.algparam.q=v.getVbyList(t,p[1],[1],"02");q.algparam.g=v.getVbyList(t,p[1],[2],"02")}}if(t.substr(r[1],2)!="03"){throw"malformed PKCS8 public key(code:004)"}q.key=s(t,r[1]).substr(2);return q},}}();KEYUTIL.getKey=function(l,k,n){var G=ASN1HEX,L=G.getChildIdx,v=G.getV,d=G.getVbyList,c=KJUR.crypto,i=c.ECDSA,C=c.DSA,w=RSAKey,M=pemtohex,F=KEYUTIL;if(typeof w!="undefined"&&l instanceof w){return l}if(typeof i!="undefined"&&l instanceof i){return l}if(typeof C!="undefined"&&l instanceof C){return l}if(l.curve!==undefined&&l.xy!==undefined&&l.d===undefined){return new i({pub:l.xy,curve:l.curve})}if(l.curve!==undefined&&l.d!==undefined){return new i({prv:l.d,curve:l.curve})}if(l.kty===undefined&&l.n!==undefined&&l.e!==undefined&&l.d===undefined){var P=new w();P.setPublic(l.n,l.e);return P}if(l.kty===undefined&&l.n!==undefined&&l.e!==undefined&&l.d!==undefined&&l.p!==undefined&&l.q!==undefined&&l.dp!==undefined&&l.dq!==undefined&&l.co!==undefined&&l.qi===undefined){var P=new w();P.setPrivateEx(l.n,l.e,l.d,l.p,l.q,l.dp,l.dq,l.co);return P}if(l.kty===undefined&&l.n!==undefined&&l.e!==undefined&&l.d!==undefined&&l.p===undefined){var P=new w();P.setPrivate(l.n,l.e,l.d);return P}if(l.p!==undefined&&l.q!==undefined&&l.g!==undefined&&l.y!==undefined&&l.x===undefined){var P=new C();P.setPublic(l.p,l.q,l.g,l.y);return P}if(l.p!==undefined&&l.q!==undefined&&l.g!==undefined&&l.y!==undefined&&l.x!==undefined){var P=new C();P.setPrivate(l.p,l.q,l.g,l.y,l.x);return P}if(l.kty==="RSA"&&l.n!==undefined&&l.e!==undefined&&l.d===undefined){var P=new w();P.setPublic(b64utohex(l.n),b64utohex(l.e));return P}if(l.kty==="RSA"&&l.n!==undefined&&l.e!==undefined&&l.d!==undefined&&l.p!==undefined&&l.q!==undefined&&l.dp!==undefined&&l.dq!==undefined&&l.qi!==undefined){var P=new w();P.setPrivateEx(b64utohex(l.n),b64utohex(l.e),b64utohex(l.d),b64utohex(l.p),b64utohex(l.q),b64utohex(l.dp),b64utohex(l.dq),b64utohex(l.qi));return P}if(l.kty==="RSA"&&l.n!==undefined&&l.e!==undefined&&l.d!==undefined){var P=new w();P.setPrivate(b64utohex(l.n),b64utohex(l.e),b64utohex(l.d));return P}if(l.kty==="EC"&&l.crv!==undefined&&l.x!==undefined&&l.y!==undefined&&l.d===undefined){var j=new i({curve:l.crv});var t=j.ecparams.keylen/4;var B=("0000000000"+b64utohex(l.x)).slice(-t);var z=("0000000000"+b64utohex(l.y)).slice(-t);var u="04"+B+z;j.setPublicKeyHex(u);return j}if(l.kty==="EC"&&l.crv!==undefined&&l.x!==undefined&&l.y!==undefined&&l.d!==undefined){var j=new i({curve:l.crv});var t=j.ecparams.keylen/4;var B=("0000000000"+b64utohex(l.x)).slice(-t);var z=("0000000000"+b64utohex(l.y)).slice(-t);var u="04"+B+z;var b=("0000000000"+b64utohex(l.d)).slice(-t);j.setPublicKeyHex(u);j.setPrivateKeyHex(b);return j}if(n==="pkcs5prv"){var J=l,G=ASN1HEX,N,P;N=L(J,0);if(N.length===9){P=new w();P.readPKCS5PrvKeyHex(J)}else{if(N.length===6){P=new C();P.readPKCS5PrvKeyHex(J)}else{if(N.length>2&&J.substr(N[1],2)==="04"){P=new i();P.readPKCS5PrvKeyHex(J)}else{throw"unsupported PKCS#1/5 hexadecimal key"}}}return P}if(n==="pkcs8prv"){var P=F.getKeyFromPlainPrivatePKCS8Hex(l);return P}if(n==="pkcs8pub"){return F._getKeyFromPublicPKCS8Hex(l)}if(n==="x509pub"){return X509.getPublicKeyFromCertHex(l)}if(l.indexOf("-END CERTIFICATE-",0)!=-1||l.indexOf("-END X509 CERTIFICATE-",0)!=-1||l.indexOf("-END TRUSTED CERTIFICATE-",0)!=-1){return X509.getPublicKeyFromCertPEM(l)}if(l.indexOf("-END PUBLIC KEY-")!=-1){var O=pemtohex(l,"PUBLIC KEY");return F._getKeyFromPublicPKCS8Hex(O)}if(l.indexOf("-END RSA PRIVATE KEY-")!=-1&&l.indexOf("4,ENCRYPTED")==-1){var m=M(l,"RSA PRIVATE KEY");return F.getKey(m,null,"pkcs5prv")}if(l.indexOf("-END DSA PRIVATE KEY-")!=-1&&l.indexOf("4,ENCRYPTED")==-1){var I=M(l,"DSA PRIVATE KEY");var E=d(I,0,[1],"02");var D=d(I,0,[2],"02");var K=d(I,0,[3],"02");var r=d(I,0,[4],"02");var s=d(I,0,[5],"02");var P=new C();P.setPrivate(new BigInteger(E,16),new BigInteger(D,16),new BigInteger(K,16),new BigInteger(r,16),new BigInteger(s,16));return P}if(l.indexOf("-END PRIVATE KEY-")!=-1){return F.getKeyFromPlainPrivatePKCS8PEM(l)}if(l.indexOf("-END RSA PRIVATE KEY-")!=-1&&l.indexOf("4,ENCRYPTED")!=-1){var o=F.getDecryptedKeyHex(l,k);var H=new RSAKey();H.readPKCS5PrvKeyHex(o);return H}if(l.indexOf("-END EC PRIVATE KEY-")!=-1&&l.indexOf("4,ENCRYPTED")!=-1){var I=F.getDecryptedKeyHex(l,k);var P=d(I,0,[1],"04");var f=d(I,0,[2,0],"06");var A=d(I,0,[3,0],"03").substr(2);var e="";if(KJUR.crypto.OID.oidhex2name[f]!==undefined){e=KJUR.crypto.OID.oidhex2name[f]}else{throw"undefined OID(hex) in KJUR.crypto.OID: "+f}var j=new i({curve:e});j.setPublicKeyHex(A);j.setPrivateKeyHex(P);j.isPublic=false;return j}if(l.indexOf("-END DSA PRIVATE KEY-")!=-1&&l.indexOf("4,ENCRYPTED")!=-1){var I=F.getDecryptedKeyHex(l,k);var E=d(I,0,[1],"02");var D=d(I,0,[2],"02");var K=d(I,0,[3],"02");var r=d(I,0,[4],"02");var s=d(I,0,[5],"02");var P=new C();P.setPrivate(new BigInteger(E,16),new BigInteger(D,16),new BigInteger(K,16),new BigInteger(r,16),new BigInteger(s,16));return P}if(l.indexOf("-END ENCRYPTED PRIVATE KEY-")!=-1){return F.getKeyFromEncryptedPKCS8PEM(l,k)}throw"not supported argument"};KEYUTIL.generateKeypair=function(a,c){if(a=="RSA"){var b=c;var h=new RSAKey();h.generate(b,"10001");h.isPrivate=true;h.isPublic=true;var f=new RSAKey();var e=h.n.toString(16);var i=h.e.toString(16);f.setPublic(e,i);f.isPrivate=false;f.isPublic=true;var k={};k.prvKeyObj=h;k.pubKeyObj=f;return k}else{if(a=="EC"){var d=c;var g=new KJUR.crypto.ECDSA({curve:d});var j=g.generateKeyPairHex();var h=new KJUR.crypto.ECDSA({curve:d});h.setPublicKeyHex(j.ecpubhex);h.setPrivateKeyHex(j.ecprvhex);h.isPrivate=true;h.isPublic=false;var f=new KJUR.crypto.ECDSA({curve:d});f.setPublicKeyHex(j.ecpubhex);f.isPrivate=false;f.isPublic=true;var k={};k.prvKeyObj=h;k.pubKeyObj=f;return k}else{throw"unknown algorithm: "+a}}};KEYUTIL.getPEM=function(b,D,y,m,q,j){var F=KJUR,k=F.asn1,z=k.DERObjectIdentifier,f=k.DERInteger,l=k.ASN1Util.newObject,a=k.x509,C=a.SubjectPublicKeyInfo,e=F.crypto,u=e.DSA,r=e.ECDSA,n=RSAKey;function A(s){var G=l({seq:[{"int":0},{"int":{bigint:s.n}},{"int":s.e},{"int":{bigint:s.d}},{"int":{bigint:s.p}},{"int":{bigint:s.q}},{"int":{bigint:s.dmp1}},{"int":{bigint:s.dmq1}},{"int":{bigint:s.coeff}}]});return G}function B(G){var s=l({seq:[{"int":1},{octstr:{hex:G.prvKeyHex}},{tag:["a0",true,{oid:{name:G.curveName}}]},{tag:["a1",true,{bitstr:{hex:"00"+G.pubKeyHex}}]}]});return s}function x(s){var G=l({seq:[{"int":0},{"int":{bigint:s.p}},{"int":{bigint:s.q}},{"int":{bigint:s.g}},{"int":{bigint:s.y}},{"int":{bigint:s.x}}]});return G}if(((n!==undefined&&b instanceof n)||(u!==undefined&&b instanceof u)||(r!==undefined&&b instanceof r))&&b.isPublic==true&&(D===undefined||D=="PKCS8PUB")){var E=new C(b);var w=E.getEncodedHex();return hextopem(w,"PUBLIC KEY")}if(D=="PKCS1PRV"&&n!==undefined&&b instanceof n&&(y===undefined||y==null)&&b.isPrivate==true){var E=A(b);var w=E.getEncodedHex();return hextopem(w,"RSA PRIVATE KEY")}if(D=="PKCS1PRV"&&r!==undefined&&b instanceof r&&(y===undefined||y==null)&&b.isPrivate==true){var i=new z({name:b.curveName});var v=i.getEncodedHex();var h=B(b);var t=h.getEncodedHex();var p="";p+=hextopem(v,"EC PARAMETERS");p+=hextopem(t,"EC PRIVATE KEY");return p}if(D=="PKCS1PRV"&&u!==undefined&&b instanceof u&&(y===undefined||y==null)&&b.isPrivate==true){var E=x(b);var w=E.getEncodedHex();return hextopem(w,"DSA PRIVATE KEY")}if(D=="PKCS5PRV"&&n!==undefined&&b instanceof n&&(y!==undefined&&y!=null)&&b.isPrivate==true){var E=A(b);var w=E.getEncodedHex();if(m===undefined){m="DES-EDE3-CBC"}return this.getEncryptedPKCS5PEMFromPrvKeyHex("RSA",w,y,m,j)}if(D=="PKCS5PRV"&&r!==undefined&&b instanceof r&&(y!==undefined&&y!=null)&&b.isPrivate==true){var E=B(b);var w=E.getEncodedHex();if(m===undefined){m="DES-EDE3-CBC"}return this.getEncryptedPKCS5PEMFromPrvKeyHex("EC",w,y,m,j)}if(D=="PKCS5PRV"&&u!==undefined&&b instanceof u&&(y!==undefined&&y!=null)&&b.isPrivate==true){var E=x(b);var w=E.getEncodedHex();if(m===undefined){m="DES-EDE3-CBC"}return this.getEncryptedPKCS5PEMFromPrvKeyHex("DSA",w,y,m,j)}var o=function(G,s){var I=c(G,s);var H=new l({seq:[{seq:[{oid:{name:"pkcs5PBES2"}},{seq:[{seq:[{oid:{name:"pkcs5PBKDF2"}},{seq:[{octstr:{hex:I.pbkdf2Salt}},{"int":I.pbkdf2Iter}]}]},{seq:[{oid:{name:"des-EDE3-CBC"}},{octstr:{hex:I.encryptionSchemeIV}}]}]}]},{octstr:{hex:I.ciphertext}}]});return H.getEncodedHex()};var c=function(N,O){var H=100;var M=CryptoJS.lib.WordArray.random(8);var L="DES-EDE3-CBC";var s=CryptoJS.lib.WordArray.random(8);var I=CryptoJS.PBKDF2(O,M,{keySize:192/32,iterations:H});var J=CryptoJS.enc.Hex.parse(N);var K=CryptoJS.TripleDES.encrypt(J,I,{iv:s})+"";var G={};G.ciphertext=K;G.pbkdf2Salt=CryptoJS.enc.Hex.stringify(M);G.pbkdf2Iter=H;G.encryptionSchemeAlg=L;G.encryptionSchemeIV=CryptoJS.enc.Hex.stringify(s);return G};if(D=="PKCS8PRV"&&n!=undefined&&b instanceof n&&b.isPrivate==true){var g=A(b);var d=g.getEncodedHex();var E=l({seq:[{"int":0},{seq:[{oid:{name:"rsaEncryption"}},{"null":true}]},{octstr:{hex:d}}]});var w=E.getEncodedHex();if(y===undefined||y==null){return hextopem(w,"PRIVATE KEY")}else{var t=o(w,y);return hextopem(t,"ENCRYPTED PRIVATE KEY")}}if(D=="PKCS8PRV"&&r!==undefined&&b instanceof r&&b.isPrivate==true){var g=new l({seq:[{"int":1},{octstr:{hex:b.prvKeyHex}},{tag:["a1",true,{bitstr:{hex:"00"+b.pubKeyHex}}]}]});var d=g.getEncodedHex();var E=l({seq:[{"int":0},{seq:[{oid:{name:"ecPublicKey"}},{oid:{name:b.curveName}}]},{octstr:{hex:d}}]});var w=E.getEncodedHex();if(y===undefined||y==null){return hextopem(w,"PRIVATE KEY")}else{var t=o(w,y);return hextopem(t,"ENCRYPTED PRIVATE KEY")}}if(D=="PKCS8PRV"&&u!==undefined&&b instanceof u&&b.isPrivate==true){var g=new f({bigint:b.x});var d=g.getEncodedHex();var E=l({seq:[{"int":0},{seq:[{oid:{name:"dsa"}},{seq:[{"int":{bigint:b.p}},{"int":{bigint:b.q}},{"int":{bigint:b.g}}]}]},{octstr:{hex:d}}]});var w=E.getEncodedHex();if(y===undefined||y==null){return hextopem(w,"PRIVATE KEY")}else{var t=o(w,y);return hextopem(t,"ENCRYPTED PRIVATE KEY")}}throw"unsupported object nor format"};KEYUTIL.getKeyFromCSRPEM=function(b){var a=pemtohex(b,"CERTIFICATE REQUEST");var c=KEYUTIL.getKeyFromCSRHex(a);return c};KEYUTIL.getKeyFromCSRHex=function(a){var c=KEYUTIL.parseCSRHex(a);var b=KEYUTIL.getKey(c.p8pubkeyhex,null,"pkcs8pub");return b};KEYUTIL.parseCSRHex=function(d){var i=ASN1HEX;var f=i.getChildIdx;var c=i.getTLV;var b={};var g=d;if(g.substr(0,2)!="30"){throw"malformed CSR(code:001)"}var e=f(g,0);if(e.length<1){throw"malformed CSR(code:002)"}if(g.substr(e[0],2)!="30"){throw"malformed CSR(code:003)"}var a=f(g,e[0]);if(a.length<3){throw"malformed CSR(code:004)"}b.p8pubkeyhex=c(g,a[2]);return b};KEYUTIL.getJWKFromKey=function(d){var b={};if(d instanceof RSAKey&&d.isPrivate){b.kty="RSA";b.n=hextob64u(d.n.toString(16));b.e=hextob64u(d.e.toString(16));b.d=hextob64u(d.d.toString(16));b.p=hextob64u(d.p.toString(16));b.q=hextob64u(d.q.toString(16));b.dp=hextob64u(d.dmp1.toString(16));b.dq=hextob64u(d.dmq1.toString(16));b.qi=hextob64u(d.coeff.toString(16));return b}else{if(d instanceof RSAKey&&d.isPublic){b.kty="RSA";b.n=hextob64u(d.n.toString(16));b.e=hextob64u(d.e.toString(16));return b}else{if(d instanceof KJUR.crypto.ECDSA&&d.isPrivate){var a=d.getShortNISTPCurveName();if(a!=="P-256"&&a!=="P-384"){throw"unsupported curve name for JWT: "+a}var c=d.getPublicKeyXYHex();b.kty="EC";b.crv=a;b.x=hextob64u(c.x);b.y=hextob64u(c.y);b.d=hextob64u(d.prvKeyHex);return b}else{if(d instanceof KJUR.crypto.ECDSA&&d.isPublic){var a=d.getShortNISTPCurveName();if(a!=="P-256"&&a!=="P-384"){throw"unsupported curve name for JWT: "+a}var c=d.getPublicKeyXYHex();b.kty="EC";b.crv=a;b.x=hextob64u(c.x);b.y=hextob64u(c.y);return b}}}}throw"not supported key object"};
    RSAKey.getPosArrayOfChildrenFromHex=function(a){return ASN1HEX.getChildIdx(a,0)};RSAKey.getHexValueArrayOfChildrenFromHex=function(f){var n=ASN1HEX;var i=n.getV;var k=RSAKey.getPosArrayOfChildrenFromHex(f);var e=i(f,k[0]);var j=i(f,k[1]);var b=i(f,k[2]);var c=i(f,k[3]);var h=i(f,k[4]);var g=i(f,k[5]);var m=i(f,k[6]);var l=i(f,k[7]);var d=i(f,k[8]);var k=new Array();k.push(e,j,b,c,h,g,m,l,d);return k};RSAKey.prototype.readPrivateKeyFromPEMString=function(d){var c=pemtohex(d);var b=RSAKey.getHexValueArrayOfChildrenFromHex(c);this.setPrivateEx(b[1],b[2],b[3],b[4],b[5],b[6],b[7],b[8])};RSAKey.prototype.readPKCS5PrvKeyHex=function(c){var b=RSAKey.getHexValueArrayOfChildrenFromHex(c);this.setPrivateEx(b[1],b[2],b[3],b[4],b[5],b[6],b[7],b[8])};RSAKey.prototype.readPKCS8PrvKeyHex=function(e){var c,j,l,b,a,f,d,k;var m=ASN1HEX;var g=m.getVbyList;if(m.isASN1HEX(e)===false){throw"not ASN.1 hex string"}try{c=g(e,0,[2,0,1],"02");j=g(e,0,[2,0,2],"02");l=g(e,0,[2,0,3],"02");b=g(e,0,[2,0,4],"02");a=g(e,0,[2,0,5],"02");f=g(e,0,[2,0,6],"02");d=g(e,0,[2,0,7],"02");k=g(e,0,[2,0,8],"02")}catch(i){throw"malformed PKCS#8 plain RSA private key"}this.setPrivateEx(c,j,l,b,a,f,d,k)};RSAKey.prototype.readPKCS5PubKeyHex=function(c){var e=ASN1HEX;var b=e.getV;if(e.isASN1HEX(c)===false){throw"keyHex is not ASN.1 hex string"}var a=e.getChildIdx(c,0);if(a.length!==2||c.substr(a[0],2)!=="02"||c.substr(a[1],2)!=="02"){throw"wrong hex for PKCS#5 public key"}var f=b(c,a[0]);var d=b(c,a[1]);this.setPublic(f,d)};RSAKey.prototype.readPKCS8PubKeyHex=function(b){var c=ASN1HEX;if(c.isASN1HEX(b)===false){throw"not ASN.1 hex string"}if(c.getTLVbyList(b,0,[0,0])!=="06092a864886f70d010101"){throw"not PKCS8 RSA public key"}var a=c.getTLVbyList(b,0,[1,0]);this.readPKCS5PubKeyHex(a)};RSAKey.prototype.readCertPubKeyHex=function(b,d){var a,c;a=new X509();a.readCertHex(b);c=a.getPublicKeyHex();this.readPKCS8PubKeyHex(c)};
    var _RE_HEXDECONLY=new RegExp("");_RE_HEXDECONLY.compile("[^0-9a-f]","gi");function _rsasign_getHexPaddedDigestInfoForString(d,e,a){var b=function(f){return KJUR.crypto.Util.hashString(f,a)};var c=b(d);return KJUR.crypto.Util.getPaddedDigestInfoHex(c,a,e)}function _zeroPaddingOfSignature(e,d){var c="";var a=d/4-e.length;for(var b=0;b<a;b++){c=c+"0"}return c+e}RSAKey.prototype.sign=function(d,a){var b=function(e){return KJUR.crypto.Util.hashString(e,a)};var c=b(d);return this.signWithMessageHash(c,a)};RSAKey.prototype.signWithMessageHash=function(e,c){var f=KJUR.crypto.Util.getPaddedDigestInfoHex(e,c,this.n.bitLength());var b=parseBigInt(f,16);var d=this.doPrivate(b);var a=d.toString(16);return _zeroPaddingOfSignature(a,this.n.bitLength())};function pss_mgf1_str(c,a,e){var b="",d=0;while(b.length<a){b+=hextorstr(e(rstrtohex(c+String.fromCharCode.apply(String,[(d&4278190080)>>24,(d&16711680)>>16,(d&65280)>>8,d&255]))));d+=1}return b}RSAKey.prototype.signPSS=function(e,a,d){var c=function(f){return KJUR.crypto.Util.hashHex(f,a)};var b=c(rstrtohex(e));if(d===undefined){d=-1}return this.signWithMessageHashPSS(b,a,d)};RSAKey.prototype.signWithMessageHashPSS=function(l,a,k){var b=hextorstr(l);var g=b.length;var m=this.n.bitLength()-1;var c=Math.ceil(m/8);var d;var o=function(i){return KJUR.crypto.Util.hashHex(i,a)};if(k===-1||k===undefined){k=g}else{if(k===-2){k=c-g-2}else{if(k<-2){throw"invalid salt length"}}}if(c<(g+k+2)){throw"data too long"}var f="";if(k>0){f=new Array(k);new SecureRandom().nextBytes(f);f=String.fromCharCode.apply(String,f)}var n=hextorstr(o(rstrtohex("\x00\x00\x00\x00\x00\x00\x00\x00"+b+f)));var j=[];for(d=0;d<c-k-g-2;d+=1){j[d]=0}var e=String.fromCharCode.apply(String,j)+"\x01"+f;var h=pss_mgf1_str(n,e.length,o);var q=[];for(d=0;d<e.length;d+=1){q[d]=e.charCodeAt(d)^h.charCodeAt(d)}var p=(65280>>(8*c-m))&255;q[0]&=~p;for(d=0;d<g;d++){q.push(n.charCodeAt(d))}q.push(188);return _zeroPaddingOfSignature(this.doPrivate(new BigInteger(q)).toString(16),this.n.bitLength())};function _rsasign_getDecryptSignatureBI(a,d,c){var b=new RSAKey();b.setPublic(d,c);var e=b.doPublic(a);return e}function _rsasign_getHexDigestInfoFromSig(a,c,b){var e=_rsasign_getDecryptSignatureBI(a,c,b);var d=e.toString(16).replace(/^1f+00/,"");return d}function _rsasign_getAlgNameAndHashFromHexDisgestInfo(f){for(var e in KJUR.crypto.Util.DIGESTINFOHEAD){var d=KJUR.crypto.Util.DIGESTINFOHEAD[e];var b=d.length;if(f.substring(0,b)==d){var c=[e,f.substring(b)];return c}}return[]}RSAKey.prototype.verify=function(f,j){j=j.replace(_RE_HEXDECONLY,"");j=j.replace(/[ \n]+/g,"");var b=parseBigInt(j,16);if(b.bitLength()>this.n.bitLength()){return 0}var i=this.doPublic(b);var e=i.toString(16).replace(/^1f+00/,"");var g=_rsasign_getAlgNameAndHashFromHexDisgestInfo(e);if(g.length==0){return false}var d=g[0];var h=g[1];var a=function(k){return KJUR.crypto.Util.hashString(k,d)};var c=a(f);return(h==c)};RSAKey.prototype.verifyWithMessageHash=function(e,a){a=a.replace(_RE_HEXDECONLY,"");a=a.replace(/[ \n]+/g,"");var b=parseBigInt(a,16);if(b.bitLength()>this.n.bitLength()){return 0}var h=this.doPublic(b);var g=h.toString(16).replace(/^1f+00/,"");var c=_rsasign_getAlgNameAndHashFromHexDisgestInfo(g);if(c.length==0){return false}var d=c[0];var f=c[1];return(f==e)};RSAKey.prototype.verifyPSS=function(c,b,a,f){var e=function(g){return KJUR.crypto.Util.hashHex(g,a)};var d=e(rstrtohex(c));if(f===undefined){f=-1}return this.verifyWithMessageHashPSS(d,b,a,f)};RSAKey.prototype.verifyWithMessageHashPSS=function(f,s,l,c){var k=new BigInteger(s,16);if(k.bitLength()>this.n.bitLength()){return false}var r=function(i){return KJUR.crypto.Util.hashHex(i,l)};var j=hextorstr(f);var h=j.length;var g=this.n.bitLength()-1;var m=Math.ceil(g/8);var q;if(c===-1||c===undefined){c=h}else{if(c===-2){c=m-h-2}else{if(c<-2){throw"invalid salt length"}}}if(m<(h+c+2)){throw"data too long"}var a=this.doPublic(k).toByteArray();for(q=0;q<a.length;q+=1){a[q]&=255}while(a.length<m){a.unshift(0)}if(a[m-1]!==188){throw"encoded message does not end in 0xbc"}a=String.fromCharCode.apply(String,a);var d=a.substr(0,m-h-1);var e=a.substr(d.length,h);var p=(65280>>(8*m-g))&255;if((d.charCodeAt(0)&p)!==0){throw"bits beyond keysize not zero"}var n=pss_mgf1_str(e,d.length,r);var o=[];for(q=0;q<d.length;q+=1){o[q]=d.charCodeAt(q)^n.charCodeAt(q)}o[0]&=~p;var b=m-h-c-2;for(q=0;q<b;q+=1){if(o[q]!==0){throw"leftmost octets not zero"}}if(o[b]!==1){throw"0x01 marker not found"}return e===hextorstr(r(rstrtohex("\x00\x00\x00\x00\x00\x00\x00\x00"+j+String.fromCharCode.apply(String,o.slice(-c)))))};RSAKey.SALT_LEN_HLEN=-1;RSAKey.SALT_LEN_MAX=-2;RSAKey.SALT_LEN_RECOVER=-2;
    function X509(){var k=ASN1HEX,j=k.getChildIdx,h=k.getV,b=k.getTLV,f=k.getVbyList,c=k.getTLVbyList,g=k.getIdxbyList,d=k.getVidx,i=k.oidname,a=X509,e=pemtohex;this.hex=null;this.version=0;this.foffset=0;this.aExtInfo=null;this.getVersion=function(){if(this.hex===null||this.version!==0){return this.version}if(c(this.hex,0,[0,0])!=="a003020102"){this.version=1;this.foffset=-1;return 1}this.version=3;return 3};this.getSerialNumberHex=function(){return f(this.hex,0,[0,1+this.foffset],"02")};this.getSignatureAlgorithmField=function(){return i(f(this.hex,0,[0,2+this.foffset,0],"06"))};this.getIssuerHex=function(){return c(this.hex,0,[0,3+this.foffset],"30")};this.getIssuerString=function(){return a.hex2dn(this.getIssuerHex())};this.getSubjectHex=function(){return c(this.hex,0,[0,5+this.foffset],"30")};this.getSubjectString=function(){return a.hex2dn(this.getSubjectHex())};this.getNotBefore=function(){var l=f(this.hex,0,[0,4+this.foffset,0]);l=l.replace(/(..)/g,"%$1");l=decodeURIComponent(l);return l};this.getNotAfter=function(){var l=f(this.hex,0,[0,4+this.foffset,1]);l=l.replace(/(..)/g,"%$1");l=decodeURIComponent(l);return l};this.getPublicKeyHex=function(){return k.getTLVbyList(this.hex,0,[0,6+this.foffset],"30")};this.getPublicKeyIdx=function(){return g(this.hex,0,[0,6+this.foffset],"30")};this.getPublicKeyContentIdx=function(){var l=this.getPublicKeyIdx();return g(this.hex,l,[1,0],"30")};this.getPublicKey=function(){return KEYUTIL.getKey(this.getPublicKeyHex(),null,"pkcs8pub")};this.getSignatureAlgorithmName=function(){return i(f(this.hex,0,[1,0],"06"))};this.getSignatureValueHex=function(){return f(this.hex,0,[2],"03",true)};this.verifySignature=function(n){var o=this.getSignatureAlgorithmName();var l=this.getSignatureValueHex();var m=c(this.hex,0,[0],"30");var p=new KJUR.crypto.Signature({alg:o});p.init(n);p.updateHex(m);return p.verify(l)};this.parseExt=function(){if(this.version!==3){return -1}var p=g(this.hex,0,[0,7,0],"30");var m=j(this.hex,p);this.aExtInfo=new Array();for(var n=0;n<m.length;n++){var q={};q.critical=false;var l=j(this.hex,m[n]);var r=0;if(l.length===3){q.critical=true;r=1}q.oid=k.hextooidstr(f(this.hex,m[n],[0],"06"));var o=g(this.hex,m[n],[1+r]);q.vidx=d(this.hex,o);this.aExtInfo.push(q)}};this.getExtInfo=function(n){var l=this.aExtInfo;var o=n;if(!n.match(/^[0-9.]+$/)){o=KJUR.asn1.x509.OID.name2oid(n)}if(o===""){return undefined}for(var m=0;m<l.length;m++){if(l[m].oid===o){return l[m]}}return undefined};this.getExtBasicConstraints=function(){var n=this.getExtInfo("basicConstraints");if(n===undefined){return n}var l=h(this.hex,n.vidx);if(l===""){return{}}if(l==="0101ff"){return{cA:true}}if(l.substr(0,8)==="0101ff02"){var o=h(l,6);var m=parseInt(o,16);return{cA:true,pathLen:m}}throw"basicConstraints parse error"};this.getExtKeyUsageBin=function(){var o=this.getExtInfo("keyUsage");if(o===undefined){return""}var m=h(this.hex,o.vidx);if(m.length%2!=0||m.length<=2){throw"malformed key usage value"}var l=parseInt(m.substr(0,2));var n=parseInt(m.substr(2),16).toString(2);return n.substr(0,n.length-l)};this.getExtKeyUsageString=function(){var n=this.getExtKeyUsageBin();var l=new Array();for(var m=0;m<n.length;m++){if(n.substr(m,1)=="1"){l.push(X509.KEYUSAGE_NAME[m])}}return l.join(",")};this.getExtSubjectKeyIdentifier=function(){var l=this.getExtInfo("subjectKeyIdentifier");if(l===undefined){return l}return h(this.hex,l.vidx)};this.getExtAuthorityKeyIdentifier=function(){var p=this.getExtInfo("authorityKeyIdentifier");if(p===undefined){return p}var l={};var o=b(this.hex,p.vidx);var m=j(o,0);for(var n=0;n<m.length;n++){if(o.substr(m[n],2)==="80"){l.kid=h(o,m[n])}}return l};this.getExtExtKeyUsageName=function(){var p=this.getExtInfo("extKeyUsage");if(p===undefined){return p}var l=new Array();var o=b(this.hex,p.vidx);if(o===""){return l}var m=j(o,0);for(var n=0;n<m.length;n++){l.push(i(h(o,m[n])))}return l};this.getExtSubjectAltName=function(){var m=this.getExtSubjectAltName2();var l=new Array();for(var n=0;n<m.length;n++){if(m[n][0]==="DNS"){l.push(m[n][1])}}return l};this.getExtSubjectAltName2=function(){var l,p,n;var m=this.getExtInfo("subjectAltName");if(m===undefined){return m}var t=new Array();var q=b(this.hex,m.vidx);var s=j(q,0);for(var o=0;o<s.length;o++){n=q.substr(s[o],2);l=h(q,s[o]);if(n==="81"){p=hextoutf8(l);t.push(["MAIL",p])}if(n==="82"){p=hextoutf8(l);t.push(["DNS",p])}if(n==="84"){p=X509.hex2dn(l,0);t.push(["DN",p])}if(n==="86"){p=hextoutf8(l);t.push(["URI",p])}if(n==="87"){try{p=parseInt(p.substr(0,2),16)+"."+parseInt(p.substr(2,2),16)+"."+parseInt(p.substr(4,2),16)+"."+parseInt(p.substr(6,2),16);t.push(["IP",p])}catch(r){}}}return t};this.getExtCRLDistributionPointsURI=function(){var q=this.getExtInfo("cRLDistributionPoints");if(q===undefined){return q}var l=new Array();var m=j(this.hex,q.vidx);for(var o=0;o<m.length;o++){try{var r=f(this.hex,m[o],[0,0,0],"86");var p=hextoutf8(r);l.push(p)}catch(n){}}return l};this.getExtAIAInfo=function(){var p=this.getExtInfo("authorityInfoAccess");if(p===undefined){return p}var l={ocsp:[],caissuer:[]};var m=j(this.hex,p.vidx);for(var n=0;n<m.length;n++){var q=f(this.hex,m[n],[0],"06");var o=f(this.hex,m[n],[1],"86");if(q==="2b06010505073001"){l.ocsp.push(hextoutf8(o))}if(q==="2b06010505073002"){l.caissuer.push(hextoutf8(o))}}return l};this.getExtCertificatePolicies=function(){var o=this.getExtInfo("certificatePolicies");if(o===undefined){return o}var l=b(this.hex,o.vidx);var u=[];var s=j(l,0);for(var r=0;r<s.length;r++){var t={};var n=j(l,s[r]);t.id=i(h(l,n[0]));if(n.length===2){var m=j(l,n[1]);for(var q=0;q<m.length;q++){var p=f(l,m[q],[0],"06");if(p==="2b06010505070201"){t.cps=hextoutf8(f(l,m[q],[1]))}else{if(p==="2b06010505070202"){t.unotice=hextoutf8(f(l,m[q],[1,0]))}}}}u.push(t)}return u};this.readCertPEM=function(l){this.readCertHex(e(l))};this.readCertHex=function(l){this.hex=l;this.getVersion();try{g(this.hex,0,[0,7],"a3");this.parseExt()}catch(m){}};this.getInfo=function(){var m=X509;var B,u,z;B="Basic Fields\n";B+="  serial number: "+this.getSerialNumberHex()+"\n";B+="  signature algorithm: "+this.getSignatureAlgorithmField()+"\n";B+="  issuer: "+this.getIssuerString()+"\n";B+="  notBefore: "+this.getNotBefore()+"\n";B+="  notAfter: "+this.getNotAfter()+"\n";B+="  subject: "+this.getSubjectString()+"\n";B+="  subject public key info: \n";u=this.getPublicKey();B+="    key algorithm: "+u.type+"\n";if(u.type==="RSA"){B+="    n="+hextoposhex(u.n.toString(16)).substr(0,16)+"...\n";B+="    e="+hextoposhex(u.e.toString(16))+"\n"}B+="X509v3 Extensions:\n";z=this.aExtInfo;for(var r=0;r<z.length;r++){var n=z[r];var A=KJUR.asn1.x509.OID.oid2name(n.oid);if(A===""){A=n.oid}var x="";if(n.critical===true){x="CRITICAL"}B+="  "+A+" "+x+":\n";if(A==="basicConstraints"){var v=this.getExtBasicConstraints();if(v.cA===undefined){B+="    {}\n"}else{B+="    cA=true";if(v.pathLen!==undefined){B+=", pathLen="+v.pathLen}B+="\n"}}else{if(A==="keyUsage"){B+="    "+this.getExtKeyUsageString()+"\n"}else{if(A==="subjectKeyIdentifier"){B+="    "+this.getExtSubjectKeyIdentifier()+"\n"}else{if(A==="authorityKeyIdentifier"){var l=this.getExtAuthorityKeyIdentifier();if(l.kid!==undefined){B+="    kid="+l.kid+"\n"}}else{if(A==="extKeyUsage"){var w=this.getExtExtKeyUsageName();B+="    "+w.join(", ")+"\n"}else{if(A==="subjectAltName"){var t=this.getExtSubjectAltName2();B+="    "+t+"\n"}else{if(A==="cRLDistributionPoints"){var y=this.getExtCRLDistributionPointsURI();B+="    "+y+"\n"}else{if(A==="authorityInfoAccess"){var p=this.getExtAIAInfo();if(p.ocsp!==undefined){B+="    ocsp: "+p.ocsp.join(",")+"\n"}if(p.caissuer!==undefined){B+="    caissuer: "+p.caissuer.join(",")+"\n"}}else{if(A==="certificatePolicies"){var o=this.getExtCertificatePolicies();for(var q=0;q<o.length;q++){if(o[q].id!==undefined){B+="    policy oid: "+o[q].id+"\n"}if(o[q].cps!==undefined){B+="    cps: "+o[q].cps+"\n"}}}}}}}}}}}}B+="signature algorithm: "+this.getSignatureAlgorithmName()+"\n";B+="signature: "+this.getSignatureValueHex().substr(0,16)+"...\n";return B}}X509.hex2dn=function(f,b){if(b===undefined){b=0}if(f.substr(b,2)!=="30"){throw"malformed DN"}var c=new Array();var d=ASN1HEX.getChildIdx(f,b);for(var e=0;e<d.length;e++){c.push(X509.hex2rdn(f,d[e]))}c=c.map(function(a){return a.replace("/","\\/")});return"/"+c.join("/")};X509.hex2rdn=function(f,b){if(b===undefined){b=0}if(f.substr(b,2)!=="31"){throw"malformed RDN"}var c=new Array();var d=ASN1HEX.getChildIdx(f,b);for(var e=0;e<d.length;e++){c.push(X509.hex2attrTypeValue(f,d[e]))}c=c.map(function(a){return a.replace("+","\\+")});return c.join("+")};X509.hex2attrTypeValue=function(d,i){var j=ASN1HEX;var h=j.getV;if(i===undefined){i=0}if(d.substr(i,2)!=="30"){throw"malformed attribute type and value"}var g=j.getChildIdx(d,i);if(g.length!==2||d.substr(g[0],2)!=="06"){"malformed attribute type and value"}var b=h(d,g[0]);var f=KJUR.asn1.ASN1Util.oidHexToInt(b);var e=KJUR.asn1.x509.OID.oid2atype(f);var a=h(d,g[1]);var c=hextorstr(a);return e+"="+c};X509.getPublicKeyFromCertHex=function(b){var a=new X509();a.readCertHex(b);return a.getPublicKey()};X509.getPublicKeyFromCertPEM=function(b){var a=new X509();a.readCertPEM(b);return a.getPublicKey()};X509.getPublicKeyInfoPropOfCertPEM=function(c){var e=ASN1HEX;var g=e.getVbyList;var b={};var a,f,d;b.algparam=null;a=new X509();a.readCertPEM(c);f=a.getPublicKeyHex();b.keyhex=g(f,0,[1],"03").substr(2);b.algoid=g(f,0,[0,0],"06");if(b.algoid==="2a8648ce3d0201"){b.algparam=g(f,0,[0,1],"06")}return b};X509.KEYUSAGE_NAME=["digitalSignature","nonRepudiation","keyEncipherment","dataEncipherment","keyAgreement","keyCertSign","cRLSign","encipherOnly","decipherOnly"];
    if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.jws=="undefined"||!KJUR.jws){KJUR.jws={}}KJUR.jws.JWS=function(){var b=KJUR,a=b.jws.JWS,c=a.isSafeJSONString;this.parseJWS=function(g,j){if((this.parsedJWS!==undefined)&&(j||(this.parsedJWS.sigvalH!==undefined))){return}var i=g.match(/^([^.]+)\.([^.]+)\.([^.]+)$/);if(i==null){throw"JWS signature is not a form of 'Head.Payload.SigValue'."}var k=i[1];var e=i[2];var l=i[3];var n=k+"."+e;this.parsedJWS={};this.parsedJWS.headB64U=k;this.parsedJWS.payloadB64U=e;this.parsedJWS.sigvalB64U=l;this.parsedJWS.si=n;if(!j){var h=b64utohex(l);var f=parseBigInt(h,16);this.parsedJWS.sigvalH=h;this.parsedJWS.sigvalBI=f}var d=b64utoutf8(k);var m=b64utoutf8(e);this.parsedJWS.headS=d;this.parsedJWS.payloadS=m;if(!c(d,this.parsedJWS,"headP")){throw"malformed JSON string for JWS Head: "+d}}};KJUR.jws.JWS.sign=function(i,v,y,z,a){var w=KJUR,m=w.jws,q=m.JWS,g=q.readSafeJSONString,p=q.isSafeJSONString,d=w.crypto,k=d.ECDSA,o=d.Mac,c=d.Signature,t=JSON;var s,j,n;if(typeof v!="string"&&typeof v!="object"){throw"spHeader must be JSON string or object: "+v}if(typeof v=="object"){j=v;s=t.stringify(j)}if(typeof v=="string"){s=v;if(!p(s)){throw"JWS Head is not safe JSON string: "+s}j=g(s)}n=y;if(typeof y=="object"){n=t.stringify(y)}if((i==""||i==null)&&j.alg!==undefined){i=j.alg}if((i!=""&&i!=null)&&j.alg===undefined){j.alg=i;s=t.stringify(j)}if(i!==j.alg){throw"alg and sHeader.alg doesn't match: "+i+"!="+j.alg}var r=null;if(q.jwsalg2sigalg[i]===undefined){throw"unsupported alg name: "+i}else{r=q.jwsalg2sigalg[i]}var e=utf8tob64u(s);var l=utf8tob64u(n);var b=e+"."+l;var x="";if(r.substr(0,4)=="Hmac"){if(z===undefined){throw"mac key shall be specified for HS* alg"}var h=new o({alg:r,prov:"cryptojs",pass:z});h.updateString(b);x=h.doFinal()}else{if(r.indexOf("withECDSA")!=-1){var f=new c({alg:r});f.init(z,a);f.updateString(b);hASN1Sig=f.sign();x=KJUR.crypto.ECDSA.asn1SigToConcatSig(hASN1Sig)}else{if(r!="none"){var f=new c({alg:r});f.init(z,a);f.updateString(b);x=f.sign()}}}var u=hextob64u(x);return b+"."+u};KJUR.jws.JWS.verify=function(w,B,n){var x=KJUR,q=x.jws,t=q.JWS,i=t.readSafeJSONString,e=x.crypto,p=e.ECDSA,s=e.Mac,d=e.Signature,m;if(typeof RSAKey!==undefined){m=RSAKey}var y=w.split(".");var f=y[0];var r=y[1];var c=f+"."+r;var A=b64utohex(y[2]);var l=i(b64utoutf8(y[0]));var k=null;var z=null;if(l.alg===undefined){throw"algorithm not specified in header"}else{k=l.alg;z=k.substr(0,2)}if(n!=null&&Object.prototype.toString.call(n)==="[object Array]"&&n.length>0){var b=":"+n.join(":")+":";if(b.indexOf(":"+k+":")==-1){throw"algorithm '"+k+"' not accepted in the list"}}if(k!="none"&&B===null){throw"key shall be specified to verify."}if(typeof B=="string"&&B.indexOf("-----BEGIN ")!=-1){B=KEYUTIL.getKey(B)}if(z=="RS"||z=="PS"){if(!(B instanceof m)){throw"key shall be a RSAKey obj for RS* and PS* algs"}}if(z=="ES"){if(!(B instanceof p)){throw"key shall be a ECDSA obj for ES* algs"}}if(k=="none"){}var u=null;if(t.jwsalg2sigalg[l.alg]===undefined){throw"unsupported alg name: "+k}else{u=t.jwsalg2sigalg[k]}if(u=="none"){throw"not supported"}else{if(u.substr(0,4)=="Hmac"){var o=null;if(B===undefined){throw"hexadecimal key shall be specified for HMAC"}var j=new s({alg:u,pass:B});j.updateString(c);o=j.doFinal();return A==o}else{if(u.indexOf("withECDSA")!=-1){var h=null;try{h=p.concatSigToASN1Sig(A)}catch(v){return false}var g=new d({alg:u});g.init(B);g.updateString(c);return g.verify(h)}else{var g=new d({alg:u});g.init(B);g.updateString(c);return g.verify(A)}}}};KJUR.jws.JWS.parse=function(g){var c=g.split(".");var b={};var f,e,d;if(c.length!=2&&c.length!=3){throw"malformed sJWS: wrong number of '.' splitted elements"}f=c[0];e=c[1];if(c.length==3){d=c[2]}b.headerObj=KJUR.jws.JWS.readSafeJSONString(b64utoutf8(f));b.payloadObj=KJUR.jws.JWS.readSafeJSONString(b64utoutf8(e));b.headerPP=JSON.stringify(b.headerObj,null,"  ");if(b.payloadObj==null){b.payloadPP=b64utoutf8(e)}else{b.payloadPP=JSON.stringify(b.payloadObj,null,"  ")}if(d!==undefined){b.sigHex=b64utohex(d)}return b};KJUR.jws.JWS.verifyJWT=function(e,l,r){var d=KJUR,j=d.jws,o=j.JWS,n=o.readSafeJSONString,p=o.inArray,f=o.includedArray;var k=e.split(".");var c=k[0];var i=k[1];var q=c+"."+i;var m=b64utohex(k[2]);var h=n(b64utoutf8(c));var g=n(b64utoutf8(i));if(h.alg===undefined){return false}if(r.alg===undefined){throw"acceptField.alg shall be specified"}if(!p(h.alg,r.alg)){return false}if(g.iss!==undefined&&typeof r.iss==="object"){if(!p(g.iss,r.iss)){return false}}if(g.sub!==undefined&&typeof r.sub==="object"){if(!p(g.sub,r.sub)){return false}}if(g.aud!==undefined&&typeof r.aud==="object"){if(typeof g.aud=="string"){if(!p(g.aud,r.aud)){return false}}else{if(typeof g.aud=="object"){if(!f(g.aud,r.aud)){return false}}}}var b=j.IntDate.getNow();if(r.verifyAt!==undefined&&typeof r.verifyAt==="number"){b=r.verifyAt}if(r.gracePeriod===undefined||typeof r.gracePeriod!=="number"){r.gracePeriod=0}if(g.exp!==undefined&&typeof g.exp=="number"){if(g.exp+r.gracePeriod<b){return false}}if(g.nbf!==undefined&&typeof g.nbf=="number"){if(b<g.nbf-r.gracePeriod){return false}}if(g.iat!==undefined&&typeof g.iat=="number"){if(b<g.iat-r.gracePeriod){return false}}if(g.jti!==undefined&&r.jti!==undefined){if(g.jti!==r.jti){return false}}if(!o.verify(e,l,r.alg)){return false}return true};KJUR.jws.JWS.includedArray=function(b,a){var c=KJUR.jws.JWS.inArray;if(b===null){return false}if(typeof b!=="object"){return false}if(typeof b.length!=="number"){return false}for(var d=0;d<b.length;d++){if(!c(b[d],a)){return false}}return true};KJUR.jws.JWS.inArray=function(d,b){if(b===null){return false}if(typeof b!=="object"){return false}if(typeof b.length!=="number"){return false}for(var c=0;c<b.length;c++){if(b[c]==d){return true}}return false};KJUR.jws.JWS.jwsalg2sigalg={HS256:"HmacSHA256",HS384:"HmacSHA384",HS512:"HmacSHA512",RS256:"SHA256withRSA",RS384:"SHA384withRSA",RS512:"SHA512withRSA",ES256:"SHA256withECDSA",ES384:"SHA384withECDSA",PS256:"SHA256withRSAandMGF1",PS384:"SHA384withRSAandMGF1",PS512:"SHA512withRSAandMGF1",none:"none",};KJUR.jws.JWS.isSafeJSONString=function(c,b,d){var e=null;try{e=jsonParse(c);if(typeof e!="object"){return 0}if(e.constructor===Array){return 0}if(b){b[d]=e}return 1}catch(a){return 0}};KJUR.jws.JWS.readSafeJSONString=function(b){var c=null;try{c=jsonParse(b);if(typeof c!="object"){return null}if(c.constructor===Array){return null}return c}catch(a){return null}};KJUR.jws.JWS.getEncodedSignatureValueFromJWS=function(b){var a=b.match(/^[^.]+\.[^.]+\.([^.]+)$/);if(a==null){throw"JWS signature is not a form of 'Head.Payload.SigValue'."}return a[1]};KJUR.jws.JWS.getJWKthumbprint=function(d){if(d.kty!=="RSA"&&d.kty!=="EC"&&d.kty!=="oct"){throw"unsupported algorithm for JWK Thumprint"}var a="{";if(d.kty==="RSA"){if(typeof d.n!="string"||typeof d.e!="string"){throw"wrong n and e value for RSA key"}a+='"e":"'+d.e+'",';a+='"kty":"'+d.kty+'",';a+='"n":"'+d.n+'"}'}else{if(d.kty==="EC"){if(typeof d.crv!="string"||typeof d.x!="string"||typeof d.y!="string"){throw"wrong crv, x and y value for EC key"}a+='"crv":"'+d.crv+'",';a+='"kty":"'+d.kty+'",';a+='"x":"'+d.x+'",';a+='"y":"'+d.y+'"}'}else{if(d.kty==="oct"){if(typeof d.k!="string"){throw"wrong k value for oct(symmetric) key"}a+='"kty":"'+d.kty+'",';a+='"k":"'+d.k+'"}'}}}var b=rstrtohex(a);var c=KJUR.crypto.Util.hashHex(b,"sha256");var e=hextob64u(c);return e};KJUR.jws.IntDate={};KJUR.jws.IntDate.get=function(c){var b=KJUR.jws.IntDate,d=b.getNow,a=b.getZulu;if(c=="now"){return d()}else{if(c=="now + 1hour"){return d()+60*60}else{if(c=="now + 1day"){return d()+60*60*24}else{if(c=="now + 1month"){return d()+60*60*24*30}else{if(c=="now + 1year"){return d()+60*60*24*365}else{if(c.match(/Z$/)){return a(c)}else{if(c.match(/^[0-9]+$/)){return parseInt(c)}}}}}}}throw"unsupported format: "+c};KJUR.jws.IntDate.getZulu=function(a){return zulutosec(a)};KJUR.jws.IntDate.getNow=function(){var a=~~(new Date()/1000);return a};KJUR.jws.IntDate.intDate2UTCString=function(a){var b=new Date(a*1000);return b.toUTCString()};KJUR.jws.IntDate.intDate2Zulu=function(e){var i=new Date(e*1000),h=("0000"+i.getUTCFullYear()).slice(-4),g=("00"+(i.getUTCMonth()+1)).slice(-2),b=("00"+i.getUTCDate()).slice(-2),a=("00"+i.getUTCHours()).slice(-2),c=("00"+i.getUTCMinutes()).slice(-2),f=("00"+i.getUTCSeconds()).slice(-2);return h+g+b+a+c+f+"Z"};
    if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.jws=="undefined"||!KJUR.jws){KJUR.jws={}}KJUR.jws.JWSJS=function(){var c=KJUR,b=c.jws,a=b.JWS,d=a.readSafeJSONString;this.aHeader=[];this.sPayload="";this.aSignature=[];this.init=function(){this.aHeader=[];this.sPayload=undefined;this.aSignature=[]};this.initWithJWS=function(f){this.init();var e=f.split(".");if(e.length!=3){throw"malformed input JWS"}this.aHeader.push(e[0]);this.sPayload=e[1];this.aSignature.push(e[2])};this.addSignature=function(e,h,m,k){if(this.sPayload===undefined||this.sPayload===null){throw"there's no JSON-JS signature to add."}var l=this.aHeader.length;if(this.aHeader.length!=this.aSignature.length){throw"aHeader.length != aSignature.length"}try{var f=KJUR.jws.JWS.sign(e,h,this.sPayload,m,k);var j=f.split(".");var n=j[0];var g=j[2];this.aHeader.push(j[0]);this.aSignature.push(j[2])}catch(i){if(this.aHeader.length>l){this.aHeader.pop()}if(this.aSignature.length>l){this.aSignature.pop()}throw"addSignature failed: "+i}};this.verifyAll=function(h){if(this.aHeader.length!==h.length||this.aSignature.length!==h.length){return false}for(var g=0;g<h.length;g++){var f=h[g];if(f.length!==2){return false}var e=this.verifyNth(g,f[0],f[1]);if(e===false){return false}}return true};this.verifyNth=function(f,j,g){if(this.aHeader.length<=f||this.aSignature.length<=f){return false}var h=this.aHeader[f];var k=this.aSignature[f];var l=h+"."+this.sPayload+"."+k;var e=false;try{e=a.verify(l,j,g)}catch(i){return false}return e};this.readJWSJS=function(g){if(typeof g==="string"){var f=d(g);if(f==null){throw"argument is not safe JSON object string"}this.aHeader=f.headers;this.sPayload=f.payload;this.aSignature=f.signatures}else{try{if(g.headers.length>0){this.aHeader=g.headers}else{throw"malformed header"}if(typeof g.payload==="string"){this.sPayload=g.payload}else{throw"malformed signatures"}if(g.signatures.length>0){this.signatures=g.signatures}else{throw"malformed signatures"}}catch(e){throw"malformed JWS-JS JSON object: "+e}}};this.getJSON=function(){return{headers:this.aHeader,payload:this.sPayload,signatures:this.aSignature}};this.isEmpty=function(){if(this.aHeader.length==0){return 1}return 0}};
    exports.SecureRandom = SecureRandom;
    exports.rng_seed_time = rng_seed_time;
    
    exports.BigInteger = BigInteger;
    exports.RSAKey = RSAKey;
    exports.ECDSA = KJUR.crypto.ECDSA;
    exports.DSA = KJUR.crypto.DSA;
    exports.Signature = KJUR.crypto.Signature;
    exports.MessageDigest = KJUR.crypto.MessageDigest;
    exports.Mac = KJUR.crypto.Mac;
    exports.Cipher = KJUR.crypto.Cipher;
    exports.KEYUTIL = KEYUTIL;
    exports.ASN1HEX = ASN1HEX;
    exports.X509 = X509;
    exports.CryptoJS = CryptoJS;
    
    // ext/base64.js
    exports.b64tohex = b64tohex;
    exports.b64toBA = b64toBA;
    
    // base64x.js
    exports.stoBA = stoBA;
    exports.BAtos = BAtos;
    exports.BAtohex = BAtohex;
    exports.stohex = stohex;
    exports.stob64 = stob64;
    exports.stob64u = stob64u;
    exports.b64utos = b64utos;
    exports.b64tob64u = b64tob64u;
    exports.b64utob64 = b64utob64;
    exports.hex2b64 = hex2b64;
    exports.hextob64u = hextob64u;
    exports.b64utohex = b64utohex;
    exports.utf8tob64u = utf8tob64u;
    exports.b64utoutf8 = b64utoutf8;
    exports.utf8tob64 = utf8tob64;
    exports.b64toutf8 = b64toutf8;
    exports.utf8tohex = utf8tohex;
    exports.hextoutf8 = hextoutf8;
    exports.hextorstr = hextorstr;
    exports.rstrtohex = rstrtohex;
    exports.hextob64 = hextob64;
    exports.hextob64nl = hextob64nl;
    exports.b64nltohex = b64nltohex;
    exports.hextopem = hextopem;
    exports.pemtohex = pemtohex;
    exports.hextoArrayBuffer = hextoArrayBuffer;
    exports.ArrayBuffertohex = ArrayBuffertohex;
    exports.zulutomsec = zulutomsec;
    exports.zulutosec = zulutosec;
    exports.zulutodate = zulutodate;
    exports.datetozulu = datetozulu;
    exports.uricmptohex = uricmptohex;
    exports.hextouricmp = hextouricmp;
    exports.encodeURIComponentAll = encodeURIComponentAll;
    exports.newline_toUnix = newline_toUnix;
    exports.newline_toDos = newline_toDos;
    exports.hextoposhex = hextoposhex;
    exports.intarystrtohex = intarystrtohex;
    exports.strdiffidx = strdiffidx;
    
    // name spaces
    exports.KJUR = KJUR;
    exports.crypto = KJUR.crypto;
    exports.asn1 = KJUR.asn1;
    exports.jws = KJUR.jws;
    exports.lang = KJUR.lang;
    
    
    
    }).call(this,require("buffer").Buffer)
    },{"buffer":2}],40:[function(require,module,exports){
    /**
     * flashçš„åº”ç”¨ä¿¡æ¯
     */
    module.exports = {
      // domain: 'g-assets.daily.taobao.net',
      domain: 'g.alicdn.com',
      // domain: 'common.qupai.me',
      flashVersion: '1.5.7',
      h5Version: '1.9.9',
      logReportTo: 'https://videocloud.cn-hangzhou.log.aliyuncs.com/logstores/newplayer/track'
    
    };
    
    },{}],41:[function(require,module,exports){
    /**
     * @fileoverview prismplayerçš„å…¥å£æ¨¡å—
     */
    
    var Player = require('./player/player');
    var FlashPlayer = require('./player/flashplayer');
    var Dom = require('./lib/dom');
    var UA = require('./lib/ua');
    var _ = require('./lib/object');
    var cfg = require('./config');
    
    var prism = function  (opt) {
        var id = opt.id,
            tag;
    
        //å¦‚æžœæ˜¯ä¸€ä¸ªå­—ç¬¦ä¸²ï¼Œæˆ‘ä»¬å°±è®¤ä¸ºæ˜¯å…ƒç´ çš„id
        if('string' === typeof id){
    
            // idä¸º#stringçš„æƒ…å†µ
            if (id.indexOf('#') === 0) {
                id = id.slice(1);
            }
    
            // å¦‚æžœåœ¨æ­¤idä¸Šåˆ›å»ºè¿‡prismplayerå®žä¾‹ï¼Œè¿”å›žè¯¥å®žä¾‹
            if (prism.players[id]) {
                return prism.players[id];
            } else {
                tag = Dom.el(id);
            }
    
        } else {
            //å¦åˆ™å°±è®¤ä¸ºæ˜¯dom å…ƒç´ 
            tag = id;
        }
    
        if(!tag || !tag.nodeName){
             throw new TypeError('æ²¡æœ‰ä¸ºæ’­æ”¾å™¨æŒ‡å®šå®¹å™¨');
        }
    
        var option = _.merge(_.copy(prism.defaultOpt), opt);
        //isLive åˆ¤æ–­
        if ((UA.IS_H5 || option.useH5Prism)&&opt.isLive) {
            option.skinLayout=[
                {name:"bigPlayButton", align:"blabs", x:30, y:80},
                {
                    name:"controlBar", align:"blabs", x:0, y:0,
                    children: [
                        {name:"liveDisplay", align:"tlabs", x: 15, y:25},
                        {name:"fullScreenButton", align:"tr", x:20, y:25},
                        {name:"volume", align:"tr", x:20, y:25}
                    ]
                }
            ]
        };
        var length = option.skinLayout.length,
        hasErrorDisplay = false;
        for(var i=0;i<length;i++)
        {
           if(option.skinLayout[i].name == "errorDisplay")
           {
                hasErrorDisplay = true;
           }
        }
        if(	 hasErrorDisplay == false)
        {
           option.skinLayout.push({name: "errorDisplay", align: 'tl', x:0, y:0});
        }
    
        if (UA.IS_IOS) {
            for(var i=0;i<option.skinLayout.length;i++){
                if(option.skinLayout[i].name=="controlBar"){
                    var children=option.skinLayout[i];
                    for(var c=0;c<children.children.length;c++){
                        if(children.children[c].name=="volume"){
                            children.children.splice(c,1);
                            break;
                        }
                    }
                }
            }
        };
    
        if (option.width) {
            tag.style.width = option.width;
        }
        if (option.height) {
            var per_idx = option.height.indexOf("%");
            if (per_idx > 0)
            {
                var screen_height = window.screen.height;
                var per_value = option.height.replace("%", "");
                if(!isNaN(per_value))
                {
                    var scale_value = screen_height * 9 * parseInt(per_value) / 1000;
                    tag.style.height = String(scale_value % 2 ? scale_value + 1: scale_value) + "px";
                }
                else
                {
                    tag.style.height = option.height;
                }
            }
            else
            {
                tag.style.height = option.height;
            }
        }
    
        //å¦‚æžœtagå·²æŒ‡å‘ä¸€ä¸ªå­˜åœ¨çš„playerï¼Œåˆ™è¿”å›žè¿™ä¸ªplayerå®žä¾‹
        //å¦åˆ™åˆå§‹åŒ–æ’­æ”¾å™¨
    
    
        if (opt.userH5Prism || opt.useH5Prism) {
            return tag['player'] || new Player(tag, option);
        }else if (opt.useFlashPrism) {
            return tag['player'] || new FlashPlayer(tag, option);
        }
        else{
            return tag['player'] ||
                (UA.IS_H5 ? new Player(tag, option) : new FlashPlayer(tag, option));
                //new Player(tag, option);
        };
    
    }
    
    var prismplayer = window['prismplayer'] = prism;
    
    //å…¨å±€å˜é‡ï¼Œè®°å½•æ‰€æœ‰çš„æ’­æ”¾å™¨
    prism.players = {};
    
    /**
     * é»˜è®¤çš„é…ç½®é¡¹
     */
    prism.defaultOpt = {
        preload: false,                     // æ˜¯å¦é¢„åŠ è½½
        autoplay: true,                    // æ˜¯å¦è‡ªåŠ¨æ’­æ”¾
        useNativeControls: false,           // æ˜¯å¦ä½¿ç”¨é»˜è®¤çš„æŽ§åˆ¶é¢æ¿
        width: '100%',                      // æ’­æ”¾å™¨å®½åº¦
        height: '300px',                    // æ’­æ”¾å™¨é«˜åº¦
        cover: '',                          // é»˜è®¤å°é¢å›¾
        from: '',               // æ¸ é“æ¥æº
        trackLog: true,                     // æ˜¯å¦éœ€è¦æ‰“ç‚¹
        waterMark:"",					// swfæ°´å°é…ç½® http://taobao.com/wm.swf||BR||11123 ä»¥||åˆ†å‰²url||å¯¹é½æ–¹å¼||å‚æ•°
        isLive:false,						//æ˜¯å¦ä¸ºç›´æ’­çŠ¶æ€(ç›´æ’­æš‚æ—¶åªæœ‰flashç‰ˆæœ¬æ”¯æŒ)
        /* vid æ·˜å®è§†é¢‘çš„è§†é¢‘idï¼Œå¿…å¡« */    // è§†é¢‘id
        showBarTime:5000,
        loadDataTimeout:30,////åŠ è½½æ•°æ®è¶…æ—¶s
        controlBarForOver:false, //overå‡ºçŽ°controlbar
        controlBarVisibility:'click', //hover, alwayse
        rePlay:false,
        skinRes: '//' + cfg.domain + '/de/prismplayer-flash/' + cfg.flashVersion + '/atlas/defaultSkin',  // String, uiçš®è‚¤å›¾ç‰‡åœ°å€ï¼Œéžå¿…å¡«ï¼Œä¸å¡«ä½¿ç”¨é»˜è®¤ï¼Œçº¯h5æ’­æ”¾å™¨å¯ä»¥ä¸è€ƒè™‘è¿™ä¸ªå­—æ®µ
        skinLayout: [                            // false | Array, æ’­æ”¾å™¨ä½¿ç”¨çš„uiç»„ä»¶ï¼Œéžå¿…å¡«ï¼Œä¸ä¼ ä½¿ç”¨é»˜è®¤ï¼Œä¼ falseæˆ–[]æ•´ä½“éšè—
            {name:"bigPlayButton", align:"blabs", x:30, y:80},
        {name: "H5Loading", align: "cc"},
            {
                name:"controlBar", align:"blabs", x:0, y:0,
                children: [
                    {name:"progress", align:"tlabs", x: 0, y:0},
                    {name:"playButton", align:"tl", x:15, y:26},
                    {name:"nextButton", align:"tl", x:10, y:26},
                    {name:"timeDisplay", align:"tl", x:10, y:24},
                    {name:"fullScreenButton", align:"tr", x:10, y:25},
                    //{name:"setButton", align:"tr", x:0, y:25},
                    {name:"streamButton", align:"tr", x:10, y:23},
                    {name:"volume", align:"tr", x:10, y:25}
                ]
            },
            {
                name:"fullControlBar", align:"tlabs", x:0, y:0,
                children: [
                    {name:"fullTitle", align:"tl", x:25, y:6},
                    {name:"fullNormalScreenButton", align:"tr", x:24, y:13},
                    {name:"fullTimeDisplay", align:"tr", x:10, y:12},
                    {name:"fullZoom", align:"cc"}
                ]
            }
        ]
    }
    
    // AMD
    if (typeof define === 'function' && define['amd']) {
          define([], function(){ return prismplayer; });
    // commonjs, æ”¯æŒbrowserify
    } else if (typeof exports === 'object' && typeof module === 'object') {
          module['exports'] = prismplayer;
    }
    
    },{"./config":40,"./lib/dom":45,"./lib/object":50,"./lib/ua":52,"./player/flashplayer":56,"./player/player":57}],42:[function(require,module,exports){
    module.exports.LOAD_START = 'loadstart';
    module.exports.LOADED_METADATA = 'loadedmetadata';
    module.exports.LOADED_DATA = 'loadeddata';
    module.exports.PROGRESS = 'progress';
    module.exports.CAN_PLAY = 'canplay';
    module.exports.CAN_PLYA_THROUGH = 'canplaythrough';
    module.exports.PLAY = 'play';
    module.exports.PAUSE = 'pause';
    module.exports.ENDED = 'ended';
    module.exports.PLAYING = 'playing';
    module.exports.WAITING = 'waiting';
    module.exports.ERROR = 'error';
    module.exports.SUSPEND = 'suspend';
    module.exports.STALLED = 'stalled';
    
    module.exports.AuthKeyExpiredEvent = "authkeyexpired";
    
    
    module.exports.ErrorCode = {
      InvalidParameter: 4001, //å‚æ•°ä¸åˆç†
      AuthKeyExpired: 4002, //é‰´æƒè¿‡æœŸ
      InvalidSourceURL: 4003, //æ— æ•ˆåœ°å€
      NotFoundSourceURL: 4004, //åœ°å€ä¸å­˜åœ¨
      StartLoadData: 4005, //å¼€å§‹ä¸‹è½½æ•°æ®é”™è¯¯
      LoadedMetadata: 4006, //å¼€å§‹ä¸‹è½½å…ƒæ•°æ®æ•°æ®é”™è¯¯
      PlayingError: 4007, //æ’­æ”¾æ—¶é”™è¯¯
      LoadingTimeout: 4008, //åŠ è½½è¶…æ—¶
      RequestDataError: 4009, //è¯·æ±‚æ•°æ®é”™è¯¯
      EncrptyVideoNotSupport: 4010, //ä¸æ”¯æŒåŠ å¯†è§†é¢‘æ’­æ”¾
      FormatNotSupport: 4011, //æ’­æ”¾æ ¼å¼ä¸æ”¯æŒ
      PlayauthDecode: 4012, //playauthè§£æžé”™è¯¯
      PlayDataDecode:4013,//æ’­æ”¾æ•°æ®è§£ç é”™è¯¯ MEDIA_ERR_DECODE
      NetworkUnavaiable: 4014, //ç½‘ç»œä¸å¯ç”¨ 
      UserAbort:4015, //èŽ·å–æ•°æ®è¿‡ç¨‹è¢«ä¸­æ­¢ MEDIA_ERR_ABORTED
      NetworkError:4016,//ç½‘ç»œé”™è¯¯åŠ è½½æ•°æ®å¤±è´¥MEDIA_ERR_NETWORK
      URLsIsEmpty: 4017,//è¿”å›žçš„æ’­æ”¾åœ°å€ä¸ºç©º
      OtherError:4400, //æœªçŸ¥é”™è¯¯
      ServerAPIError: 4500 //æœåŠ¡ç«¯è¯·æ±‚é”™è¯¯å“¦ 
    }
    
    module.exports.AuthKeyExpired = 1800;
    module.exports.AuthKeyRefreshExpired = 1600;
    
    module.exports.VideoErrorCodeText = {
      1:'èŽ·å–æ•°æ®è¿‡ç¨‹è¢«ä¸­æ­¢',
      2: 'ç½‘ç»œé”™è¯¯åŠ è½½æ•°æ®å¤±è´¥', //A network error caused the video download to fail part-way
      3: 'è§£ç é”™è¯¯', //due to a corruption problem or because the video used features your browser did not support.
      4: 'æœåŠ¡å™¨ã€ç½‘ç»œé”™è¯¯æˆ–æ ¼å¼ä¸æ”¯æŒ' //because the server or network failed or because the format is not supported.
    }
    
    module.exports.VideoErrorCode= {
      1:4015,
      2:4016, 
      3:4013,
      4:4400
    }
    
    module.exports.VideoLevels = {
          "0" : "åŽŸç”»",
          "640" : "æµç•…",
          "960" : "æ ‡æ¸…",
          "1280" : "é«˜æ¸…",
          "1920" : "è¶…æ¸…",
          "2580" : "2K",
          "3840" : "4K"
          
    }
    
    
    },{}],43:[function(require,module,exports){
    module.exports.get = function(cname) {
        var name = cname + '';
        var ca = document.cookie.split(';');
        for(var i = 0; i < ca.length; i++) {
            var c = ca[i].trim();
            if(c.indexOf(name) == 0) {
                return unescape(c.substring(name.length + 1,c.length));
            }
        }
        return '';
    };
    
    module.exports.set = function(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = 'expires=' + d.toGMTString();
        document.cookie = cname + '=' + escape(cvalue) + '; ' + expires;
    };
    
    },{}],44:[function(require,module,exports){
    var _ = require('./object');
    
    /**
     * Element Data Store. Allows for binding data to an element without putting it directly on the element.
     * Ex. Event listneres are stored here.
     * (also from jsninja.com, slightly modified and updated for closure compiler)
     * @type {Object}
     * @private
     */
    module.exports.cache = {};
    
    /**
     * Unique ID for an element or function
     * @type {Number}
     * @private
     */
    module.exports.guid = function(len, radix) {
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
        var uuid = [], i;
        radix = radix || chars.length;
    
        if (len) {
            for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random()*radix];
        } else {
            var r;
            uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
            uuid[14] = '4';
            for (i = 0; i < 36; i++) {
                if (!uuid[i]) {
                    r = 0 | Math.random()*16;
                    uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
                }
            }
        }
    
        return uuid.join('');
    };
    
    /**
     * Unique attribute name to store an element's guid in
     * @type {String}
     * @constant
     * @private
     */
    module.exports.expando = 'vdata' + (new Date()).getTime();
    
    /**
     * Returns the cache object where data for an element is stored
     * @param  {Element} el Element to store data for.
     * @return {Object}
     * @private
     */
    module.exports.getData = function(el){
      var id = el[module.exports.expando];
      if (!id) {
        id = el[module.exports.expando] = module.exports.guid();
        module.exports.cache[id] = {};
      }
      return module.exports.cache[id];
    };
    
    /**
     * Returns the cache object where data for an element is stored
     * @param  {Element} el Element to store data for.
     * @return {Object}
     * @private
     */
    module.exports.hasData = function(el){
      var id = el[module.exports.expando];
      return !(!id || _.isEmpty(module.exports.cache[id]));
    };
    
    /**
     * Delete data for the element from the cache and the guid attr from getElementById
     * @param  {Element} el Remove data for an element
     * @private
     */
    module.exports.removeData = function(el){
      var id = el[module.exports.expando];
      if (!id) { return; }
      // Remove all stored data
      // Changed to = null
      // http://coding.smashingmagazine.com/2012/11/05/writing-fast-memory-efficient-javascript/
      // module.exports.cache[id] = null;
      delete module.exports.cache[id];
    
      // Remove the expando property from the DOM node
      try {
        delete el[module.exports.expando];
      } catch(e) {
        if (el.removeAttribute) {
          el.removeAttribute(module.exports.expando);
        } else {
          // IE doesn't appear to support removeAttribute on the document element
          el[module.exports.expando] = null;
        }
      }
    };
    
    },{"./object":50}],45:[function(require,module,exports){
    /**
     * @fileoverview å°è£…å¯¹domå…ƒç´ çš„åŸºæœ¬æ“ä½œ
     */
    
    var _ = require('./object');
    
    /**
     * æ ¹æ®idèŽ·å–dom
     */
    module.exports.el = function(id){
      return document.getElementById(id);
    }
    
    /**
     * Creates an element and applies properties.
     * @param  {String=} tagName    Name of tag to be created.
     * @param  {Object=} properties Element properties to be applied.
     * @return {Element}
     * @private
     */
    module.exports.createEl = function(tagName, properties){
      var el;
    
      tagName = tagName || 'div';
      properties = properties || {};
    
      el = document.createElement(tagName);
    
      _.each(properties, function(propName, val){
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
     * Add a CSS class name to an element
     * @param {Element} element    Element to add class name to
     * @param {String} classToAdd Classname to add
     * @private
     */
    module.exports.addClass = function(element, classToAdd){
      if ((' '+element.className+' ').indexOf(' '+classToAdd+' ') == -1) {
        element.className = element.className === '' ? classToAdd : element.className + ' ' + classToAdd;
      }
    };
    
    /**
     * Remove a CSS class name from an element
     * @param {Element} element    Element to remove from class name
     * @param {String} classToAdd Classname to remove
     * @private
     */
    module.exports.removeClass = function(element, classToRemove){
      var classNames, i;
    
      if (element.className.indexOf(classToRemove) == -1) { return; }
    
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
     *
     */
    module.exports.getElementAttributes = function(tag){
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
    /*
    
    */
    module.exports.insertFirst = function(child, parent){
      if (parent.firstChild) {
        parent.insertBefore(child, parent.firstChild);
      } else {
        parent.appendChild(child);
      }
    };
    
    // Attempt to block the ability to select text while dragging controls
    module.exports.blockTextSelection = function(){
      document.body.focus();
      document.onselectstart = function () { return false; };
    };
    // Turn off text selection blocking
    module.exports.unblockTextSelection = function(){ document.onselectstart = function () { return true; }; };
    
    /**
     * è®¾ç½®æˆ–èŽ·å–csså±žæ€§
     */
    module.exports.css = function(el, cssName, cssVal) {
        if (!el.style) return false;
        
        if (cssName && cssVal) {
            el.style[cssName] = cssVal;
            return true;
        
        } else if (!cssVal && typeof cssName === 'string') {
            return el.style[cssName];
        
        } else if (!cssVal && typeof cssName === 'object') {
            _.each(cssName, function(k, v) {
                el.style[k] = v;
            });
            return true;
        }
    
        return false;
    };
    
    
    
    },{"./object":50}],46:[function(require,module,exports){
    var _ = require('./object');
    var Data = require('./data');
    
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
    module.exports.on = function(elem, type, fn){
      if (_.isArray(type)) {
        return _handleMultipleEvents(module.exports.on, elem, type, fn);
      }
    
      var data = Data.getData(elem);
    
      // We need a place to store all our handler data
      if (!data.handlers) data.handlers = {};
    
      if (!data.handlers[type]) data.handlers[type] = [];
    
      if (!fn.guid) fn.guid = Data.guid();
    
      data.handlers[type].push(fn);
    
      if (!data.dispatcher) {
        data.disabled = false;
    
        data.dispatcher = function (event){
    
          if (data.disabled) return;
          event = module.exports.fixEvent(event);
    
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
     * @param  {Function} fn   Specific listener to remove. Don't incldue to remove listeners for an event type.
     * @private
     */
    module.exports.off = function(elem, type, fn) {
      // Don't want to add a cache object through getData if not needed
      if (!Data.hasData(elem)) return;
    
      var data = Data.getData(elem);
    
      // If no events exist, nothing to unbind
      if (!data.handlers) { return; }
    
      if (_.isArray(type)) {
        return _handleMultipleEvents(module.exports.off, elem, type, fn);
      }
    
      // Utility function
      var removeType = function(t){
         data.handlers[t] = [];
         module.exports.cleanUpEvents(elem,t);
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
    
      module.exports.cleanUpEvents(elem, type);
    };
    
    /**
     * Clean up the listener cache and dispatchers
     * @param  {Element|Object} elem Element to clean up
     * @param  {String} type Type of event to clean up
     * @private
     */
    module.exports.cleanUpEvents = function(elem, type) {
      var data = Data.getData(elem);
    
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
      if (_.isEmpty(data.handlers)) {
        delete data.handlers;
        delete data.dispatcher;
        delete data.disabled;
    
        // data.handlers = null;
        // data.dispatcher = null;
        // data.disabled = null;
      }
    
      // Finally remove the expando if there is no data left
      if (_.isEmpty(data)) {
        Data.removeData(elem);
      }
    };
    
    /**
     * Fix a native event to have standard property values
     * @param  {Object} event Event object to fix
     * @return {Object}
     * @private
     */
    module.exports.fixEvent = function(event) {
    
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
          if (key !== 'layerX' && key !== 'layerY' && key !== 'keyboardEvent.keyLocation') {
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
    module.exports.trigger = function(elem, event) {
      // Fetches element data and a reference to the parent (for bubbling).
      // Don't want to add a data object to cache for every parent,
      // so checking hasData first.
    
      var elemData = (Data.hasData(elem)) ? Data.getData(elem) : {};
      var parent = elem.parentNode || elem.ownerDocument;
          // type = event.type || event,
          // handler;
    
      // If an event name was passed as a string, creates an event out of it
      if (typeof event === 'string') {
        var paramData = null;
        if(elem.paramData){
          paramData = elem.paramData;
          elem.paramData = null;
          elem.removeAttribute(paramData);
        }
        event = { type:event, target:elem, paramData:paramData };
      }
      // Normalizes the event properties.
      event = module.exports.fixEvent(event);
    
      // If the passed element has a dispatcher, executes the established handlers.
      if (elemData.dispatcher) {
        elemData.dispatcher.call(elem, event);
      }
    
      // Unless explicitly stopped or the event does not bubble (e.g. media events)
        // recursively calls this function to bubble the event up the DOM.
      if (parent && !event.isPropagationStopped() && event.bubbles !== false) {
        module.exports.trigger(parent, event);
    
      // If at the top of the DOM, triggers the default action unless disabled.
      } else if (!parent && !event.defaultPrevented) {
        var targetData = Data.getData(event.target);
    
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
    };
    
    /**
     * Trigger a listener only once for an event
     * @param  {Element|Object}   elem Element or object to
     * @param  {String|Array}   type
     * @param  {Function} fn
     * @private
     */
    module.exports.one = function(elem, type, fn) {
      if (_.isArray(type)) {
        return _handleMultipleEvents(module.exports.one, elem, type, fn);
      }
      var func = function(){
        module.exports.off(elem, type, func);
        fn.apply(this, arguments);
      };
      // copy the guid to the new function so it can removed using the original function's ID
      func.guid = fn.guid = fn.guid || Data.guid();
      module.exports.on(elem, type, func);
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
      _.each(type, function(type) {
        fn(elem, type, callback); //Call the event method for each one of the types
      });
    }
    
    },{"./data":44,"./object":50}],47:[function(require,module,exports){
    var Data = require('./data');
    
    module.exports.bind = function(context, fn, uid) {
      // Make sure the function has a unique ID
      if (!fn.guid) { fn.guid = Data.guid(); }
    
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
    
    },{"./data":44}],48:[function(require,module,exports){
    var Url = require('./url');
    
    /**
     * Simple http request for retrieving external files (e.g. text tracks)
     * @param  {String}    url             URL of resource
     * @param  {Function} onSuccess       Success callback
     * @param  {Function=} onError         Error callback
     * @param  {Boolean=}   withCredentials Flag which allow credentials
     * @private
     */
    module.exports.get = function(url, onSuccess, onError, withCredentials) {
      var fileUrl, request, urlInfo, winLoc, crossOrigin;
    
      onError = onError || function() {};
    
      if (typeof XMLHttpRequest === 'undefined') {
        // Shim XMLHttpRequest for older IEs
        window.XMLHttpRequest = function() {
          try {
            return new window.ActiveXObject('Msxml2.XMLHTTP.6.0');
          } catch (e) {}
          try {
            return new window.ActiveXObject('Msxml2.XMLHTTP.3.0');
          } catch (f) {}
          try {
            return new window.ActiveXObject('Msxml2.XMLHTTP');
          } catch (g) {}
          throw new Error('This browser does not support XMLHttpRequest.');
        };
      }
    
      request = new XMLHttpRequest();
    
      urlInfo = Url.parseUrl(url);
      winLoc = window.location;
      // check if url is for another domain/origin
      // ie8 doesn't know location.origin, so we won't rely on it here
      crossOrigin = (urlInfo.protocol + urlInfo.host) !== (winLoc.protocol + winLoc.host);
    
      // Use XDomainRequest for IE if XMLHTTPRequest2 isn't available
      // 'withCredentials' is only available in XMLHTTPRequest2
      // Also XDomainRequest has a lot of gotchas, so only use if cross domain
      if (crossOrigin && window.XDomainRequest && !('withCredentials' in request)) {
        request = new window.XDomainRequest();
        request.onload = function() {
          onSuccess(request.responseText);
        };
        request.onerror = onError;
        // these blank handlers need to be set to fix ie9 http://cypressnorth.com/programming/internet-explorer-aborting-ajax-requests-fixed/
        request.onprogress = function() {};
        request.ontimeout = onError;
    
        // XMLHTTPRequest
      } else {
        fileUrl = (urlInfo.protocol == 'file:' || winLoc.protocol == 'file:');
    
        request.onreadystatechange = function() {
          if (request.readyState === 4) {
            if (request.status === 200 || fileUrl && request.status === 0) {
              onSuccess(request.responseText);
            } else {
              onError(request.responseText);
            }
          }
        };
      }
    
      // open the connection
      try {
        // Third arg is async, or ignored by XDomainRequest
        request.open('GET', url, true);
        // withCredentials only supported by XMLHttpRequest2
        if (withCredentials) {
          request.withCredentials = true;
        }
      } catch (e) {
        onError(e);
        return;
      }
    
      // send the request
      try {
        request.send();
      } catch (e) {
        onError(e);
      }
    };
    
    /**
     * jsonpè¯·æ±‚
     */
    module.exports.jsonp = function(url, onSuccess, onError) {
      var callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
      var script = document.createElement('script');
    
      script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + callbackName + "&" + "cb=" + callbackName;
      script.onerror = function() {
        delete window[callbackName];
        document.body.removeChild(script);
        onError();
      };
      // é˜²æ­¢æŽ¥å£è¿”å›žä¸æ”¯æŒjsonpæ—¶çš„scriptæ ‡ç­¾å †ç§¯
      script.onload = function() {
        setTimeout(function() {
          if (window[callbackName]) {
            delete window[callbackName];
            document.body.removeChild(script);
          }
        }, 0);
      };
    
      window[callbackName] = function(data) {
        delete window[callbackName];
        document.body.removeChild(script);
        onSuccess(data);
      };
    
      document.body.appendChild(script);
    }
    
    },{"./url":53}],49:[function(require,module,exports){
    /**
     * @fileoverview æ ¹æ®é…ç½®æ¸²æŸ“uiç»„ä»¶åœ¨çˆ¶çº§ç»„ä»¶ä¸­çš„layout
     * @author é¦–ä½œ<aloysious.ld@taobao.com>
     * @date 2015-01-12
     *
     * uiç»„ä»¶ä¸Žlayoutç›¸å…³çš„é…ç½®é¡¹
     * align {String}   'cc'  ç»å¯¹å±…ä¸­
     *                | 'tl'  å·¦ä¸Šå¯¹é½ï¼Œç»„ä»¶å‘å·¦æµ®åŠ¨ï¼Œå¹¶ä»¥å·¦ä¸Šè§’ä½œä¸ºåç§»åŽŸç‚¹
     *                | 'tr'  å³ä¸Šå¯¹é½ï¼Œç»„ä»¶å‘å³æµ®åŠ¨ï¼Œå¹¶ä»¥å³ä¸Šè§’ä½œä¸ºåç§»åŽŸç‚¹
     *                | 'tlabs' ä»¥å·¦ä¸Šè§’åç§»ï¼Œç›¸å¯¹äºŽçˆ¶çº§ç»„ä»¶ç»å¯¹å®šä½ï¼Œä¸å—åŒçº§ç»„ä»¶çš„å ä½å½±å“
     *                | 'trabs' ä»¥å³ä¸Šè§’åç§»ï¼Œç›¸å¯¹äºŽçˆ¶çº§ç»„ä»¶ç»å¯¹å®šä½ï¼Œä¸å—åŒçº§ç»„ä»¶çš„å ä½å½±å“
     *                | 'blabs' ä»¥å·¦ä¸‹è§’åç§»ï¼Œç›¸å¯¹äºŽçˆ¶çº§ç»„ä»¶ç»å¯¹å®šä½ï¼Œä¸å—åŒçº§ç»„ä»¶çš„å ä½å½±å“
     *                | 'brabs' ä»¥å³ä¸‹è§’åç§»ï¼Œç›¸å¯¹äºŽçˆ¶çº§ç»„ä»¶ç»å¯¹å®šä½ï¼Œä¸å—åŒçº§ç»„ä»¶çš„å ä½å½±å“
     * x     {Number} xè½´çš„åç§»é‡ï¼Œalignä¸º'cc'æ—¶æ— æ•ˆ
     * y     {Number} yè½´çš„åç§»é‡ï¼Œalignä¸º'cc'æ—¶æ— æ•ˆ
     */
    
    var Dom = require('./dom');
    
    /**
     * æ ¹æ®é…ç½®æ¸²æŸ“domå…ƒç´ çš„layout
     * @param el  {HTMLElement} domå…ƒç´ 
     * @param opt {Object}      layouté…ç½®å¯¹è±¡
     */
    module.exports.render = function(el, opt) {
        var align = opt.align ? opt.align : 'tl',
            x = opt.x ? opt.x : 0,
            y = opt.y ? opt.y : 0;
    
        if (align === 'tl') {
            Dom.css(el, {
                'float': 'left',
                'margin-left': x + 'px',
                'margin-top': y+ 'px'
            });
        
        } else if (align === 'tr') {
            Dom.css(el, {
                'float': 'right',
                'margin-right': x + 'px',
                'margin-top': y+ 'px'
            });
        
        } else if (align === 'tlabs') {
            Dom.css(el, {
                'position': 'absolute',
                'left': x + 'px',
                'top': y + 'px'
            });
        
        } else if (align === 'trabs') {
            Dom.css(el, {
                'position': 'absolute',
                'right': x + 'px',
                'top': y + 'px'
            });
        
        } else if (align === 'blabs') {
            Dom.css(el, {
                'position': 'absolute',
                'left': x + 'px',
                'bottom': y + 'px'
            });
        
        } else if (align === 'brabs') {
            Dom.css(el, {
                'position': 'absolute',
                'right': x + 'px',
                'bottom': y + 'px'
            });
    
        } else if (align === 'cc') {
            Dom.css(el, {
                'position': 'absolute',
                'left': '50%',
                'top': '50%',
                'margin-top': ( el.offsetHeight / -2 ) + 'px',
                'margin-left': ( el.offsetWidth / -2 ) + 'px'
            });
        }
    };
    
    },{"./dom":45}],50:[function(require,module,exports){
    var hasOwnProp = Object.prototype.hasOwnProperty;
    /**
     * Object.create shim for prototypal inheritance
     *
     * https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/create
     *
     * @function
     * @param  {Object}   obj Object to use as prototype
     * @private
     */
    module.exports.create = Object.create || function(obj){
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
    
    module.exports.isArray = function(arr){
      return Object.prototype.toString.call(arg) === '[object Array]';
    }
    
    module.exports.isEmpty = function(obj) {
      for (var prop in obj) {
        // Inlude null properties as empty.
        if (obj[prop] !== null) {
          return false;
        }
      }
      return true;
    };
    
    
    module.exports.each = function(obj, fn, context){
      //
      if(module.exports.isArray(obj)){
        for (var i = 0, len = obj.length; i < len; ++i) {
          if (fn.call(context || this, obj[i], i) === false) {
              break;
          }
        }
      }else{
         for (var key in obj) {
          if (hasOwnProp.call(obj, key)) {
            // if (key=="code") {
            //   console.log(obj);
            // };
            // console.log(key);
            // console.log(obj[key]);
            if (fn.call(context || this, key, obj[key]) === false) {
                break;
            }
          }
         }   
      }
    
      return obj;
    };
    
    /**
     * Merge two objects together and return the original.
     * @param  {Object} obj1
     * @param  {Object} obj2
     * @return {Object}
     * @private
     */
    module.exports.merge = function(obj1, obj2){
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
    module.exports.deepMerge = function(obj1, obj2){
      var key, val1, val2;
    
      // make a copy of obj1 so we're not ovewriting original values.
      // like prototype.options_ and all sub options objects
      obj1 = module.exports.copy(obj1);
    
      for (key in obj2){
        if (hasOwnProp.call(obj2, key)) {
          val1 = obj1[key];
          val2 = obj2[key];
    
          // Check if both properties are pure objects and do a deep merge if so
          if (module.exports.isPlain(val1) && module.exports.isPlain(val2)) {
            obj1[key] = module.exports.deepMerge(val1, val2);
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
    module.exports.copy = function(obj){
      return module.exports.merge({}, obj);
    };
    
    /**
     * Check if an object is plain, and not a dom node or any object sub-instance
     * @param  {Object} obj Object to check
     * @return {Boolean}     True if plain, false otherwise
     * @private
     */
    module.exports.isPlain = function(obj){
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
    module.exports.isArray = Array.isArray || function(arr) {
      return Object.prototype.toString.call(arr) === '[object Array]';
    };
    
    module.exports.unescape = function(str) {
        return str.replace(/&([^;]+);/g, function(m,$1) {
            return {
                'amp': '&',
                'lt': '<',
                   'gt': '>',
                   'quot': '"',
                   '#x27': "'",
                   '#x60': '`'
            }[$1.toLowerCase()] || m;
        });
    };
    
    },{}],51:[function(require,module,exports){
    var _ = require('./object');
    
    var oo = function(){};
    // Manually exporting module.exports['oo'] here for Closure Compiler
    // because of the use of the extend/create class methods
    // If we didn't do this, those functions would get flattend to something like
    // `a = ...` and `this.prototype` would refer to the global object instead of
    // oo
    
    var oo = function() {};
    /**
     * Create a new object that inherits from this Object
     *
     *     var Animal = oo.extend();
     *     var Horse = Animal.extend();
     *
     * @param {Object} props Functions and properties to be applied to the
     *                       new object's prototype
     * @return {module.exports.oo} An object that inherits from oo
     * @this {*}
     */
    oo.extend = function(props){
      var init, subObj;
    
      props = props || {};
      // Set up the constructor using the supplied init method
      // or using the init of the parent object
      // Make sure to check the unobfuscated version for external libs
      init = props['init'] || props.init || this.prototype['init'] || this.prototype.init || function(){};
      // In Resig's simple class inheritance (previously used) the constructor
      //  is a function that calls `this.init.apply(arguments)`
      // However that would prevent us from using `ParentObject.call(this);`
      //  in a Child constuctor because the `this` in `this.init`
      //  would still refer to the Child and cause an inifinite loop.
      // We would instead have to do
      //    `ParentObject.prototype.init.apply(this, argumnents);`
      //  Bleh. We're not creating a _super() function, so it's good to keep
      //  the parent constructor reference simple.
      subObj = function(){
        init.apply(this, arguments);
      };
    
      // Inherit from this object's prototype
      subObj.prototype = _.create(this.prototype);
      // Reset the constructor property for subObj otherwise
      // instances of subObj would have the constructor of the parent Object
      subObj.prototype.constructor = subObj;
    
      // Make the class extendable
      subObj.extend = oo.extend;
      // Make a function for creating instances
      subObj.create = oo.create;
    
      // Extend subObj's prototype with functions and other properties from props
      for (var name in props) {
        if (props.hasOwnProperty(name)) {
          subObj.prototype[name] = props[name];
        }
      }
    
      return subObj;
    };
    
    /**
     * Create a new instace of this Object class
     *
     *     var myAnimal = Animal.create();
     *
     * @return {module.exports.oo} An instance of a oo subclass
     * @this {*}
     */
    oo.create = function(){
      // Create a new object that inherits from this object's prototype
      var inst = _.create(this.prototype);
    
      // Apply this constructor function to the new object
      this.apply(inst, arguments);
    
      // Return the new object
      return inst;
    };
    
    module.exports = oo;
    
    },{"./object":50}],52:[function(require,module,exports){
    module.exports.USER_AGENT = navigator.userAgent;
    
    /**
     * Device is an iPhone
     * @type {Boolean}
     * @constant
     * @private
     */
    module.exports.IS_IPHONE = (/iPhone/i).test(module.exports.USER_AGENT);
    module.exports.IS_IPAD = (/iPad/i).test(module.exports.USER_AGENT);
    module.exports.IS_IPOD = (/iPod/i).test(module.exports.USER_AGENT);
    module.exports.IS_MAC = (/mac/i).test(module.exports.USER_AGENT);
    module.exports.IS_SAFARI = (/Safari/i).test(module.exports.USER_AGENT);
    module.exports.IS_CHROME = (/Chrome/i).test(module.exports.USER_AGENT);
    module.exports.IS_FIREFOX = (/Firefox/i).test(module.exports.USER_AGENT);
    
    
    if(document.all){  // IE
        try
        {
          var swf = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');  
          if (swf){
              module.exports.HAS_FLASH = true;
          } else {
              module.exports.HAS_FLASH = false;
          }
        }catch(e)
        {
          module.exports.HAS_FLASH = false;
        }
    } else {  // others
        if (navigator.plugins && navigator.plugins.length > 0) {
            var swf = navigator.plugins["Shockwave Flash"];
            if (swf) {
                module.exports.HAS_FLASH = true;
            } else {
                module.exports.HAS_FLASH = false;
            }
        } else {
             module.exports.HAS_FLASH = false;
        }
    }
    
    module.exports.IS_MAC_SAFARI = module.exports.IS_MAC && module.exports.IS_SAFARI && (!module.exports.IS_CHROME) && (!module.exports.HAS_FLASH);
    module.exports.IS_IOS = module.exports.IS_IPHONE || module.exports.IS_IPAD || module.exports.IS_IPOD || module.exports.IS_MAC_SAFARI;
    
    module.exports.IOS_VERSION = (function(){
      var match = module.exports.USER_AGENT.match(/OS (\d+)_/i);
      if (match && match[1]) { return match[1]; }
    })();
    
    module.exports.IS_ANDROID = (/Android/i).test(module.exports.USER_AGENT);
    module.exports.ANDROID_VERSION = (function() {
      // This matches Android Major.Minor.Patch versions
      // ANDROID_VERSION is Major.Minor as a Number, if Minor isn't available, then only Major is returned
      var match = module.exports.USER_AGENT.match(/Android (\d+)(?:\.(\d+))?(?:\.(\d+))*/i),
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
    module.exports.IS_OLD_ANDROID = module.exports.IS_ANDROID && (/webkit/i).test(module.exports.USER_AGENT) && module.exports.ANDROID_VERSION < 2.3;
    
    module.exports.TOUCH_ENABLED = !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch);
    
    module.exports.IS_MOBILE = module.exports.IS_IOS || module.exports.IS_ANDROID;
    module.exports.IS_H5 = module.exports.IS_MOBILE || !module.exports.HAS_FLASH;
    module.exports.IS_PC = !module.exports.IS_H5;
    
    
    
    
    },{}],53:[function(require,module,exports){
    var Dom = require('./dom');
    
    /**
     * Get abosolute version of relative URL. Used to tell flash correct URL.
     * http://stackoverflow.com/questions/470832/getting-an-absolute-url-from-a-relative-one-ie6-issue
     * @param  {String} url URL to make absolute
     * @return {String}     Absolute URL
     * @private
     */
    module.exports.getAbsoluteURL = function(url){
    
      // Check if absolute URL
      if (!url.match(/^https?:\/\//)) {
        // Convert to absolute URL. Flash hosted off-site needs an absolute URL.
        url = Dom.createEl('div', {
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
    module.exports.parseUrl = function(url) {
      var div, a, addToBody, props, details;
    
      props = ['protocol', 'hostname', 'port', 'pathname', 'search', 'hash', 'host'];
    
      // add the url to an anchor and let the browser parse the URL
      a = Dom.createEl('a', { href: url });
    
      // IE8 (and 9?) Fix
      // ie8 doesn't parse the URL correctly until the anchor is actually
      // added to the body, and an innerHTML is needed to trigger the parsing
      addToBody = (a.host === '' && a.protocol !== 'file:');
      if (addToBody) {
        div = Dom.createEl('div');
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
    
      if (addToBody) {
        document.body.removeChild(div);
      }
    
      return details;
    };
    
    },{"./dom":45}],54:[function(require,module,exports){
    // å°†ç§’æ ¼å¼åŒ–ä¸º00:00:00æ ¼å¼
    module.exports.formatTime = function(seconds) {
        var raw = Math.round(seconds),
        hour,
        min,
        sec;
    
        hour = Math.floor(raw / 3600);
        raw = raw % 3600;
        min = Math.floor(raw / 60);
        sec = raw % 60;
    
        if (hour === Infinity || isNaN(hour)
            || min === Infinity || isNaN(min)
            || sec === Infinity || isNaN(sec)) {
            return false;
        }
    
        hour = hour >= 10 ? hour: '0' + hour;
        min = min >= 10 ? min: '0' + min;
        sec = sec >= 10 ? sec: '0' + sec;
    
        return (hour === '00' ? '': (hour + ':')) + min + ':' + sec;
    },
    
    // å°†00:00:00æ ¼å¼è§£æžä¸ºç§’
    module.exports.parseTime = function(timeStr) {
        var timeArr = timeStr.split(':'),
        h = 0,
        m = 0,
        s = 0;
    
        if (timeArr.length === 3) {
            h = timeArr[0];
            m = timeArr[1];
            s = timeArr[2];
        } else if (timeArr.length === 2) {
            m = timeArr[0];
            s = timeArr[1];
        } else if (timeArr.length === 1) {
            s = timeArr[0];
        }
    
        h = parseInt(h, 10);
        m = parseInt(m, 10);
        // ç§’å¯èƒ½æœ‰å°æ•°ä½ï¼Œéœ€è¦å‘ä¸Šå–æ•´
        s = Math.ceil(parseFloat(s));
    
        return h * 3600 + m * 60 + s;
    }
    
    module.exports.formatDate = function (date, fmt) { //author: meizz 
        var o = {
            "M+": date.getMonth() + 1, //æœˆä»½ 
            "d+": date.getDate(), //æ—¥ 
            "H+": date.getHours(), //å°æ—¶ 
            "m+": date.getMinutes(), //åˆ† 
            "s+": date.getSeconds(), //ç§’ 
            "q+": Math.floor((date.getMonth() + 3) / 3), //å­£åº¦ 
            "S": date.getMilliseconds() //æ¯«ç§’ 
        };
        if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    }
    
    },{}],55:[function(require,module,exports){
    var oo = require('../lib/oo');
    var _ = require('../lib/object');
    var Cookie = require('../lib/cookie');
    var Data = require('../lib/data');
    var IO = require('../lib/io');
    var UA = require('../lib/ua');
    var CONF = require('../config');
    
    var updateTime = 0;
    
    var EVENT = {
        'INIT': 1001, // åˆå§‹åŒ–
        'CLOSE': 1002, // å…³é—­æ’­æ”¾å™¨
        'STARTFETCHDATA': 1003, //å¼€å§‹èŽ·å–URL
        'COMPLETEFETCHDATA': 1004, //ç»“æŸèŽ·å–URL
        'PLAY': 2001, // å¼€å§‹æ’­æ”¾
        'STOP': 2002, // åœæ­¢ï¼Œh5ä¸‹æŒ‡æ’­æ”¾å®Œæ¯•
        'PAUSE': 2003, // æš‚åœ
        'SEEK': 2004, // æ‹–åŠ¨
        'FULLSREEM': 2005, // å…¨å±
        'QUITFULLSCREEM': 2006, // é€€å‡ºå…¨å±
        'RESOLUTION': 2007, // åˆ‡æ¢æ¸…æ™°åº¦ï¼Œh5æš‚æ—¶ä¸å®žçŽ°
        'RESOLUTION_DONE': 2009, // åˆ‡æ¢æ¸…æ™°åº¦å®Œæˆï¼Œh5æš‚æ—¶ä¸å®žçŽ°
        'RECOVER': 2010, // æš‚åœæ¢å¤
        'SEEK_END': 2011, // æ‹–åŠ¨ç»“æŸï¼Œh5æš‚æ—¶ä¸å®žçŽ°
        'LOADSTART': 2015, //å½“æµè§ˆå™¨å¼€å§‹å¯»æ‰¾æŒ‡å®šçš„éŸ³é¢‘/è§†é¢‘æ—¶ï¼Œä¼šå‘ç”Ÿ loadstart äº‹ä»¶ã€‚å³å½“åŠ è½½è¿‡ç¨‹å¼€å§‹æ—¶
        'LOADEDMETADATA': 2016, //å½“æŒ‡å®šçš„éŸ³é¢‘/è§†é¢‘çš„å…ƒæ•°æ®å·²åŠ è½½æ—¶
        'LOADEDDATA': 2017, //å½“å½“å‰å¸§çš„æ•°æ®å·²åŠ è½½ï¼Œä½†æ²¡æœ‰è¶³å¤Ÿçš„æ•°æ®æ¥æ’­æ”¾æŒ‡å®šéŸ³é¢‘/è§†é¢‘çš„ä¸‹ä¸€å¸§æ—¶
        'CANPLAY': 2018, //å½“æµè§ˆå™¨èƒ½å¤Ÿå¼€å§‹æ’­æ”¾æŒ‡å®šçš„éŸ³é¢‘/è§†é¢‘æ—¶ï¼Œå‘ç”Ÿ canplay äº‹ä»¶
        'CANPLAYTHROUGH': 2019, //æ’­æ”¾å™¨å®Œå…¨å¯ä»¥æ’­æ”¾
        'FETCHEDIP': 2020, //æˆåŠŸèŽ·å–IP
        'CDNDETECT': 2021, //CDNæ£€æµ‹
        'DETECT':2022, //æ£€æµ‹
        'UNDERLOAD': 3002, // å¡é¡¿
        'LOADED': 3001, // å¡é¡¿æ¢å¤
        'HEARTBEAT': 9001, // å¿ƒè·³ï¼Œ5ç§’é—´éš”ã€‚  20170425 -- 30ç§’
        'ERROR': 4001 // å‘ç”Ÿé”™è¯¯
    };
    
    //å®žæ—¶ç›‘æµ‹id
    var checkIntervalInt;
    var checkTimeUpdate;
    
    var Monitor = oo.extend({
        /**
         * @param player  {Player} æ’­æ”¾å™¨å®žä¾‹
         * @param options {Object} ç›‘æŽ§çš„é…ç½®å‚æ•°
         *     - lv      (log_version)     æ—¥å¿—ç‰ˆæœ¬ï¼Œåˆå§‹ç‰ˆæœ¬ä¸º1
         *     - b       (bussiness_id)    ä¸šåŠ¡æ–¹id, åˆå§‹ä¸ºprism_aliyun, è¾“å…¥å‚æ•°from
         *     - lm      (live_mode)       ç›´æ’­ç‚¹æ’­åŒºåˆ†ï¼šprism_live,prism_vod
         *     - t       (terminal_type)   ç»ˆç«¯ç±»åž‹
         *     - pv      (player_version)  æ’­æ”¾å™¨ç‰ˆæœ¬å·ï¼Œ1
         *     - uuid    (uuid)            è®¾å¤‡æˆ–æœºå™¨idï¼Œh5ä¿å­˜åœ¨cookieä¸­
         *     - v       (video_id)        è§†é¢‘id
         *     - u       (user_id)         ç”¨æˆ·id
         *     - s       (session_id)      æ’­æ”¾è¡Œä¸ºidï¼Œä¸€ä¸ªè§†é¢‘æ­£å¸¸æ’­æ”¾åŽéœ€è¦é‡ç½®ï¼ˆåŠ¨æ€ç”Ÿæˆï¼‰
         *     - e       (event_id)        äº‹ä»¶idï¼ˆåŠ¨æ€ç”Ÿæˆï¼‰
         *     - args    (args)            äº‹ä»¶æºå¸¦å‚æ•°
         *     - d       (definition)      æ¸…æ™°åº¦
         *     - cdn_ip  (cdn_ip)          ä¸‹è½½æ•°æ®çš„cdnåœ°å€ï¼Œh5æ— æ³•è®¾ç½®hostï¼Œè¿™ä¸ªå­—æ®µæ— ç”¨ï¼Œå†™æ­»ä¸º0.0.0.0
         *     - ct      (client_timestamp) å®¢æˆ·ç«¯äº‹ä»¶æˆ³
         */
    
        /**
         * 2017-04-18 æ—¥å¿—æ”¹ç‰ˆ
         * @param player  {Player} æ’­æ”¾å™¨å®žä¾‹
         * @param options {Object} ç›‘æŽ§çš„é…ç½®å‚æ•°
         *     - t       (time)             æ—¶é—´æˆ³ï¼Œæ¯«ç§’çº§
         *     - ll      (log_level)        æ—¥å¿—çº§åˆ«
         *     - lv      (log_version)      æ—¥å¿—ç‰ˆæœ¬ï¼Œåˆå§‹ç‰ˆæœ¬ä¸º1
         *     - pd      (product)          player,pusher,mixer
         *     - md      (module)           saas,paas,mixer,publisher
         *     - hn      (hostname)         ipåœ°å€
         *     - bi      (business_id)      é˜¿é‡Œäº‘è´¦å·
         *     - ri      (session_id)       uuid
         *     - e       (event_id)         äº‹ä»¶idï¼ˆåŠ¨æ€ç”Ÿæˆï¼‰
         *     - args    (args)             äº‹ä»¶æºå¸¦å‚æ•°
         *     - vt      (video_type)       ç›´æ’­ç‚¹æ’­åŒºåˆ†ï¼šprism_live,prism_vod
         *     - tt      (terminal_type)    ç»ˆç«¯ç±»åž‹
         *     - dm      (device_model)     è®¾å¤‡åž‹å·
         *     - av      (app_version)      æ’­æ”¾å™¨ç‰ˆæœ¬å·
         *     - uuid    (uuid)             è®¾å¤‡æˆ–æœºå™¨idï¼Œh5ä¿å­˜åœ¨cookieä¸­
         *     - vu      (video_url)        æŽ¨æµæˆ–æ’­æ”¾urlï¼Œä¸ºé¿å…urlä¸­æœ‰&ç­‰ç‰¹æ®Šå­—ç¬¦ï¼Œç¼–ç å‰è¦åšurlencode
         *     - ua       (user_id)         ç”¨æˆ·id
         *     - dn       (definition)      æ¸…æ™°åº¦
         *     - cdn_ip  (cdn_ip)           ä¸‹è½½æ•°æ®çš„cdnåœ°å€ï¼Œh5æ— æ³•è®¾ç½®hostï¼Œè¿™ä¸ªå­—æ®µæ— ç”¨ï¼Œå†™æ­»ä¸º0.0.0.0
         *     - r  (referer)               æ¥æºç½‘ç«™å’Œé“¾æŽ¥ä¿¡æ¯ ï¼/to do
         */
    
    
    
        init: function(player, options, isDebug) {
            if(typeof isDebug == 'undefined')
                isDebug = false;
            this.isDebug  = isDebug;
            this.player = player;
            this.requestId = "";
            this.sessionId = Data.guid();
            this.playId = 0;
            var po = this.player.getOptions();
    
            var h5_log_version = "1";
            var h5_bussiness_id = options.from ? options.from : "";
            var h5_live_mode = po.isLive ? "prism_live" : "prism_vod";
    
            var h5_product = po.isLive ? "pusher" : "player";
            var h5_video_type = po.isLive ? "live" : "vod";
    
            // default: pcweb
            var h5_terminal_type = "pc";
            if (UA.IS_IPAD) {
                h5_terminal_type = "pad";
            } else if (UA.IS_IPHONE) {
                h5_terminal_type = "iphone";
            } else if (UA.IS_ANDROID) {
                h5_terminal_type = "andorid";
            }
    
            var h5_device_model = UA.IS_PC ? 'pc_h5' : 'h5';
            var h5_player_version = CONF.h5Version;
            var h5_uuid = this._getUuid();
            var h5_video_id = po.source ? encodeURIComponent(po.source) : "";
            var h5_user_id = "0";
            var h5_session_id = this.sessionId;
            var h5_event_id = "0";
            var h5_args = "0";
            var h5_definition = "custom";
            var h5_cdn_ip = "0.0.0.0";
            var h5_local_ip = "0.0.0.0";
            var h5_client_timestamp = new Date().getTime();
            this._userNetInfo = {
                cdnIp: "",
                localIp: ""
            };
    
            var that = this;
            try {
                var reportError = function(err) {
                    that._log('FETCHEDIP', {
                        error: err || "èŽ·å–IPå‡ºé”™"
                    });
                };
                var getLDNS = function(cb) {
                    return IO.jsonp("https://cdn.dns-detect.alicdn.com/api/cdnDetectHttps?method=createDetectHttps", function(data) {
                        return IO.jsonp(data.content, cb, reportError);
                    }, reportError);
                }
    
                getLDNS(function(data) {
                    h5_cdn_ip = that._userNetInfo.cdnIp = data.content.ldns;
                    h5_local_ip = that._userNetInfo.localIp = data.content.localIp;
                    that._log('FETCHEDIP', {
                        cdn_ip: h5_cdn_ip,
                        local_ip: h5_local_ip
                    });
                });
    
            } catch (e) {
                console.log(e);
            }
    
            this.opt = {
                APIVersion: '0.6.0',
                t: h5_client_timestamp,
                ll: 'info',
                lv: '1.0',
                pd: h5_product,
                md: 'saas_player',
                hn: '0.0.0.0',
                bi: h5_bussiness_id,
                ri: h5_session_id,
                e: h5_event_id,
                args: h5_args,
                vt: h5_video_type,
                tt: h5_terminal_type,
                dm: h5_device_model,
                av: h5_player_version,
                uuid: h5_uuid,
                vu: h5_video_id,
                ua: h5_user_id,
                dn: h5_definition,
                cdn_ip: h5_cdn_ip,
                r: ''
    
            };
    
            // this.opt = {
            //     APIVersion: '0.6.0',
            //     lv: h5_log_version,           //log_version
            //     b: h5_bussiness_id,           //business_id
            //     lm: h5_live_mode,             //live_mode
            //     t: h5_terminal_type,          //terminal_type
            //     m: h5_device_model,           //device_model
            //     pv: h5_player_version,        //player_version
            //     uuid: h5_uuid,                //uuid
            //     v: h5_video_id,               //video_id
            //     u: h5_user_id,                //user_id
            //     s: h5_session_id,             //session_id
            //     e: h5_event_id,               //event_id
            //     args: h5_args,                //args
            //     d: h5_definition,             //definition
            //     cdn_ip: h5_cdn_ip,            //cdn_ip
            //     ct: h5_client_timestamp,      //client_timestamp
            // };
    
            this.bindEvent();
        },
        //æ›´æ–°è§†é¢‘ä¿¡æ¯,å½“æ’­æ”¾å™¨å®žä¾‹ä¸å˜,æ’­æ”¾å†…å®¹æ›´æ¢æ—¶ä½¿ç”¨
        updateVideoInfo: function(options) {
            var po = this.player.getOptions();
    
            var h5_log_version = "1";
            var h5_bussiness_id = options.from ? options.from : "";
            var h5_live_mode = po.isLive ? "prism_live" : "prism_vod";
    
            var h5_product = "player";
            var h5_video_type = po.isLive ? "live" : "vod";
    
            // default: pcweb
            var h5_terminal_type = "pc";
            if (UA.IS_IPAD) {
                h5_terminal_type = "pad";
            } else if (UA.IS_IPHONE) {
                h5_terminal_type = "iphone";
            } else if (UA.IS_ANDROID) {
                h5_terminal_type = "andorid";
            }
    
            var h5_device_model = UA.IS_PC ? 'pc_h5' : 'h5';
            var h5_player_version = CONF.h5Version;
            var h5_uuid = this._getUuid();
            var h5_video_id = po.source ? encodeURIComponent(po.source) : "";
            var h5_user_id = "0";
            var h5_session_id = this.sessionId;
            var h5_event_id = "0";
            var h5_args = "0";
            var h5_definition = "custom";
            var h5_cdn_ip = "0.0.0.0";
            var h5_client_timestamp = new Date().getTime();
    
            this.opt = {
                APIVersion: '0.6.0',
                t: h5_client_timestamp,
                ll: 'info',
                lv: '1.0',
                pd: h5_product,
                md: 'saas_player',
                hn: '0.0.0.0',
                bi: h5_bussiness_id,
                ri: h5_session_id,
                e: h5_event_id,
                args: h5_args,
                vt: h5_video_type,
                tt: h5_terminal_type,
                dm: h5_device_model,
                av: h5_player_version,
                uuid: h5_uuid,
                vu: h5_video_id,
                ua: h5_user_id,
                dn: h5_definition,
                cdn_ip: h5_cdn_ip,
                r: ""
            };
        },
    
    
    
        //event
        bindEvent: function() {
            var that = this;
            this.player.on('init', function() {
                that._onPlayerInit();
            });
            window.addEventListener('beforeunload', function() {
                that._onPlayerClose();
            });
            this.player.on('loadstart', function() {
                that._onPlayerloadstart();
            });
            this.player.on('loadedmetadata', function() {
                that._onPlayerLoadMetadata();
            });
            this.player.on('loadeddata', function() {
                that._onPlayerLoaddata();
            });
    
    
            this.player.on('play', function() {
                that._onPlayerPlay();
            });
            this.player.on('ready', function() {
                that._onPlayerReady();
            });
            this.player.on('ended', function() {
                that._onPlayerFinish();
            });
            this.player.on('play', function() {
                that._onPlayerPlay();
            });
            this.player.on('pause', function() {
                that._onPlayerPause();
            });
            //this.player.on('seeking',      function(e){that._onPlayerSeekStart(e);});
            //this.player.on('seeked',       function(e){that._onPlayerSeekEnd(e);});
            this.player.on('seekStart', function(e) {
                that._onPlayerSeekStart(e);
            });
            this.player.on('seekEnd', function(e) {
                that._onPlayerSeekEnd(e);
            });
            this.player.on('waiting', function() {
                that._onPlayerLoaded();
            });
            this.player.on('canplaythrough', function() {
                that._onPlayerUnderload();
            });
            this.player.on('canplay', function() {
                that._onPlayerCanplay();
            });
            //this.player.on('canplay',        function() {that._onPlayerUnderload();});
            //this.player.on('timeupdate',     function() {that._onPlayerHeartBeat();});
            this.player.on('error', function() {
                that._onPlayerError();
            });
            //this.player.on('fullscreenchange', function() {that._onFullscreenChange);});
            //this.player.on('qualitychange', function() {that._onPlayerSwitchResolution);});
    
            checkIntervalInt = setInterval(function() {
                // å¡é¡¿å¼€å§‹
                if (that.player.readyState() === 2 || that.player.readyState() === 3) {
                    that._onPlayerLoaded();
                    //alert("state_buffer");
                    // å¡é¡¿æ¢å¤
                } else if (that.player.readyState() === 4) {
                    that._onPlayerUnderload();
                }
            }, 100);
    
    
            checkTimeUpdate = setInterval(function() {
    
                if (!that.player.getCurrentTime()) {
                    return;
                };
    
                var currTime = Math.floor(that.player.getCurrentTime() * 1000);
                if (that.player.paused()) {
                    return;
                };
                updateTime++;
                if (updateTime >= 30) {
                    that._log('HEARTBEAT', {
                        vt: currTime,
                        interval: updateTime * 1000
                    });
                    updateTime = 0;
                };
    
            }, 1000);
    
    
        },
    
        removeEvent: function() {
            var that = this;
            this.player.off('init');
            this.player.off('ready');
            this.player.off('ended');
            this.player.off('play');
            this.player.off('pause');
            this.player.off('seekStart');
            this.player.off('seekEnd');
            this.player.off('canplaythrough');
            //this.player.off('timeupdate', function() {that._onPlayerHeartBeat();});
            this.player.off('error');
            //this.player.off('fullscreenchange');
            //this.player.off('qualitychange');
    
            clearInterval(checkIntervalInt);
        },
    
        _onPlayerloadstart: function() {
            this.playId = Data.guid();
            this._log('LOADSTART', {
                pt: new Date().getTime()
            });
        },
    
        _onPlayerLoadMetadata: function() {
            this._log('LOADEDMETADATA', {
                pt: new Date().getTime()
            });
        },
    
        _onPlayerLoaddata: function() {
            this._log('LOADEDDATA', {
                pt: new Date().getTime()
            });
        },
    
        _onPlayerCanplay: function() {
            this._log('CANPLAY', {
                pt: new Date().getTime()
            });
        },
    
        //init
        _onPlayerInit: function() {
            // é‡ç½®sessionId
            this._log('INIT', {
                pt: new Date().getTime()
            });
            this.buffer_flag = 0; //after first play, set 1
            this.pause_flag = 0; //pause status
        },
    
        //beforeunload
        _onPlayerClose: function() {
            this._log('CLOSE', {
                vt: Math.floor(this.player.getCurrentTime() * 1000)
            });
        },
    
        //ready
        _onPlayerReady: function() {
            //ä¿å­˜å¼€å§‹æ’­æ”¾æ—¶é—´æˆ³
            this.startTimePlay = new Date().getTime();
        },
    
        //end
        _onPlayerFinish: function() {
            // é‡ç½®sessionId
            // this.sessionId = Data.guid();
            this._log('STOP', {
                vt: Math.floor(this.player.getCurrentTime() * 1000)
            });
            this.playId = 0;
        },
    
        //play
        _onPlayerPlay: function() {
            if(this.playId==0)
            {
                this.playId = Data.guid();
            }
            //è‹¥ä¸ºautoplay,ç‚¹å‡»å¼€å§‹æ‰ä¸ŠæŠ¥2001
            if (!this.buffer_flag && this.player._options.autoplay) {
                this.first_play_time = new Date().getTime();
                this._log('PLAY', {
                    dsm: 'fix',
                    vt: 0,
                    start_cost: this.first_play_time - this.player.getReadyTime()
                });
                this.buffer_flag = 1;
                return;
            }
    
            //å¿½ç•¥æ’­æ”¾å‰çš„æš‚åœ
            if (!this.buffer_flag) return;
            //è‹¥éžæš‚åœåˆ™è¿”å›ž
            if (!this.pause_flag) return;
            this.pause_flag = 0;
            this.pauseEndTime = new Date().getTime();
            this._log('RECOVER', {
                vt: Math.floor(this.player.getCurrentTime() * 1000),
                cost: this.pauseEndTime - this.pauseTime
            });
        },
    
        //pause
        _onPlayerPause: function() {
            //å¿½ç•¥æ’­æ”¾å‰çš„æš‚åœ
            if (!this.buffer_flag) return;
            //æœªèµ‹å€¼ä¸è®°å½•æš‚åœ
            if (!this.startTimePlay) return;
            //å¿½ç•¥seekæ—¶çš„æš‚åœ
            if (this.seeking) return;
            this.pause_flag = 1;
            this.pauseTime = new Date().getTime();
            this._log('PAUSE', {
                vt: Math.floor(this.player.getCurrentTime() * 1000)
            });
        },
    
        //seekstart
        _onPlayerSeekStart: function(e) {
            this.seekStartTime = e.paramData.fromTime;
            this.seeking = true;
            this.seekStartStamp = new Date().getTime();
        },
    
        //seekend
        _onPlayerSeekEnd: function(e) {
            this.seekEndStamp = new Date().getTime();
            this._log('SEEK', {
                drag_from_timestamp: Math.floor(this.seekStartTime * 1000),
                drag_to_timestamp: Math.floor(e.paramData.toTime * 1000)
            });
            this._log('SEEK_END', {
                vt: Math.floor(this.player.getCurrentTime() * 1000),
                cost: this.seekEndStamp - this.seekStartStamp
            });
            this.seeking = false;
        },
    
        //waiting
        _onPlayerLoaded: function() {
            // ç¬¬ä¸€æ¬¡æ’­æ”¾å‰ä¸è®°å½•å¡é¡¿ï¼Œå¡é¡¿ä¸ç½®ä½ï¼Œä¸äº§ç”Ÿå¡é¡¿æ¢å¤
            if (!this.buffer_flag) return;
            //æœªèµ‹å€¼ä¸è®°å½•å¡é¡¿
            if (!this.startTimePlay) return;
            // å·²ç»å¤„äºŽå¡é¡¿æˆ–è€…æ‹–æ‹½è¿‡ç¨‹ä¸­ä¸åŽ»è®°å½•å¡é¡¿
            if (this.stucking || this.seeking) return;
    
            // å¦‚æžœå¡é¡¿åœ¨å¼€å§‹æ’­æ”¾1sä»¥å†…å‘ç”Ÿåˆ™å¿½ç•¥
            this.stuckStartTime = new Date().getTime();
            //console.log(this.stuckStartTime);
            //console.log(this.startTimePlay);
            if (this.stuckStartTime - this.startTimePlay <= 1000)
                return;
    
            //alert("load_buffer");
            this.stucking = true;
            this._log('UNDERLOAD', {
                vt: Math.floor(this.player.getCurrentTime() * 1000)
            });
            this.stuckStartTime = new Date().getTime();
        },
    
        //canplaythrough, canplay:æœ‰äº›æµè§ˆå™¨æ²¡æœ‰
        _onPlayerUnderload: function() { //å¡é¡¿æ¢å¤
            //ç¬¬ä¸€æ¬¡æ¢å¤,å¹¶ä¸”éžè‡ªåŠ¨æ’­æ”¾ï¼Œè®¤ä¸ºå¼€å§‹æ’­æ”¾,(è‡ªåŠ¨æ’­æ”¾ä¼šæèµ·loadæ•°æ®ï¼Œå¯¼è‡´ä¸ŠæŠ¥è¿‡æ—©)
            if (!this.buffer_flag && !this.player._options.autoplay) {
                this.first_play_time = new Date().getTime();
                this._log('PLAY', {
                    play_mode: 'fix',
                    vt: 0,
                    start_cost: this.first_play_time - this.player.getReadyTime()
                });
                this.buffer_flag = 1;
                return;
            }
    
            //è‹¥æœªå¼€æ’­ï¼Œä¸”autoplay,åˆ™è¿”å›ž
            if (!this.buffer_flag && this.player._options.autoplay) return;
    
            // å¦‚æžœå½“å‰ä¸åœ¨å¡é¡¿ä¸­ï¼Œæˆ–è€…åœ¨æ‹–æ‹½è¿‡ç¨‹ä¸­ï¼Œä¸åº”è¯¥è®°å½•å¡é¡¿æ¢å¤
            if (!this.stucking || this.seeking) return;
    
            var currTime = Math.floor(this.player.getCurrentTime() * 1000),
                startTime = this.stuckStartTime || new Date().getTime(),
                cost = Math.floor(new Date().getTime() - startTime);
    
            if (cost < 0) cost = 0;
            this._log('LOADED', {
                vt: currTime,
                cost: cost
            });
            this.stucking = false;
        },
    
        _onPlayerHeartBeat: function() {
            // æ‹–æ‹½è¿‡ç¨‹ä¸­ä¸åŽ»è®°å½•å¿ƒè·³
            if (this.seeking) return;
    
            var currTime = Math.floor(this.player.getCurrentTime() * 1000),
                that = this;
    
            if (!this.timer) {
                this.timer = setTimeout(function() {
                    !that.seeking && that._log('HEARTBEAT', {
                        progress: currTime
                    });
                    clearTimeout(that.timer);
                    that.timer = null;
                }, 60000);
            }
    
            console.log('timeupdate');
        },
    
        //error
        _onPlayerError: function() {
            // var trackerError = {
            //     'MEDIA_ERR_NETWORK': -1,
            //     'MEDIA_ERR_SRC_NOT_SUPPORTED': -2,
            //     'MEDIA_ERR_DECODE': -3
            // };
            // var errorObj = this.player.getError();
    
            // //errorObj == null
            // if (!errorObj) {
            //     return
            // };
    
            // var errorCode = errorObj.code;
            // var tMsg;
    
            // _.each(errorObj.__proto__, function(k, v) {
            //     if (v === errorCode) {
            //         tMsg = k;
            //         return false;
            //     }
            // });
            // tMsg = tMsg + ' || ' + errorObj.message;
            // if (trackerError[tMsg]) {
            //     this._log('ERROR', {
            //         vt: Math.floor(this.player.getCurrentTime() * 1000),
            //         error_code: trackerError[tMsg],
            //         error_msg: tMsg,
            //         roe: this.player.getRecentOccuredEvent()
            //     });
            // }
            this.playId = 0;
        },
    
        _log: function(eventType, extCfg) {
            var cfg = _.copy(this.opt);
            this.requestId = Data.guid();
            if (eventType == "ERROR" && eventType != 'FETCHEDIP' && eventType != 'CDNDETECT') {
                var that = this;
                IO.jsonp("https://cdn.dns-detect.alicdn.com/api/cdnDetectHttps?method=createDetectHttps", function(data) {
                    that._log('CDNDETECT', {
                        flag: 0,
                        error: "",
                        eri: that.requestId
                    });
                }, function(err) {
                    that._log('CDNDETECT', {
                        flag: 1,
                        error: err || "è®¿é—®CDNé”™è¯¯",
                        eri: that.requestId
                    });
                });
            }
    
            //var url='//log.video.taobao.com/stat/';
            //var url='//videocloud.cn-hangzhou.log.aliyuncs.com/logstores/player/track';
            var url = CONF.logReportTo;
    
            cfg.e = EVENT[eventType];
            // cfg.s = this.sessionId;
            // cfg.ct = new Date().getTime();
    
            //2017-04-18 æ–°ç‰ˆæ—¥å¿—
    
            cfg.ri = this.requestId; //æ¯æ¬¡è¯·æ±‚IDä¸ä¸€æ ·
            cfg.t = new Date().getTime();
            cfg.cdn_ip = this._userNetInfo.cdnIp;
            cfg.hn = this._userNetInfo.localIp;
            cfg.r = document.referrer ? document.referrer : "";
            cfg.s = this.playId;
    
            var args_params = [];
            _.each(extCfg, function(k, v) {
                args_params.push(k + '=' + v);
            });
            args_params.push('sri=' + this.player.getServerRequestId());
            args_params.push('ua=' + UA.USER_AGENT);
            args_params.push('sid=' + this.sessionId);
            var vid = "";
            var op = this.player.getOptions();
            if (op && op.vid)
            {
                vid = op.vid;
            }
            args_params.push('vid=' + vid);
            args_params = args_params.join('&');
    
            if (args_params == "") {
    
                args_params = "0";
            }
            cfg.args = encodeURIComponent(args_params);
    
            /*
            if (extCfg.vt) {
                extCfg.vt = Math.round(extCfg.vt);
            }
            if (extCfg.cost) {
                extCfg.cost = Math.round(extCfg.cost);
            }
    
            extCfg.systs = new Date().getTime();
    
            cfg = _.merge(cfg, extCfg);
            */
    
            var params = [];
            _.each(cfg, function(k, v) {
                params.push(k + '=' + v);
            });
            params = params.join('&');
            if(!this.isDebug)
            {
                IO.jsonp(url + '?' + params, function() {}, function() {});
            }
        },
    
        /**
         * å”¯ä¸€è¡¨ç¤ºæ’­æ”¾å™¨çš„idç¼“å­˜åœ¨cookieä¸­
         */
        _getUuid: function() {
            // p_h5_uè¡¨ç¤ºprism_h5_uuid
            var uuid = Cookie.get('p_h5_u');
    
            if (!uuid) {
                uuid = Data.guid();
                Cookie.set('p_h5_u', uuid, 7);
            }
    
            return uuid;
        }
    
    });
    
    module.exports = Monitor;
    
    },{"../config":40,"../lib/cookie":43,"../lib/data":44,"../lib/io":48,"../lib/object":50,"../lib/oo":51,"../lib/ua":52}],56:[function(require,module,exports){
    /*
     * flashæ’­æ”¾å™¨æ ¸å¿ƒç±»
     */
    var Component = require('../ui/component');
    var Data = require('../lib/data');
    var _ = require('../lib/object');
    var cfg = require('../config');
    //var swfobj=require('../lib/swfobject');
    
    var FlashPlayer = Component.extend({
    
      init: function(tag, options) {
        Component.call(this, this, options);
    
        // åœ¨windowä¸‹æŒ‚è½½å˜é‡,ä¾¿äºŽflashè°ƒç”¨
        this._id = this.id = 'prism-player-' + Data.guid();
        this.tag = tag;
        this._el = this.tag;
        window[this.id] = this;
    
        var width = '100%';
        var height = '100%';
        // TODO ä¸´æ—¶å…ˆç”¨æ—¥å¸¸çš„
        var swfUrl = '//' + cfg.domain + '/de/prismplayer-flash/' + cfg.flashVersion + '/PrismPlayer.swf';
        var flashVar = this._comboFlashVars();
        var wmode = this._options.wmode ? this._options.wmode : "opaque";
    
        tag.innerHTML = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" codebase="//download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=5,0,0,0" width="' + width + '" height="' + height + '" id="' + this.id + '">' +
          '<param name=movie value="' + swfUrl + '">' +
          '<param name=quality value=High>' +
          '<param name="FlashVars" value="' + flashVar + '">' +
          '<param name="WMode" value="' + wmode + '">' +
          '<param name="AllowScriptAccess" value="always">' +
          '<param name="AllowFullScreen" value="true">' +
          '<param name="AllowFullScreenInteractive" value="true">' +
          '<embed name="' + this.id + '" src="' + swfUrl + '" quality=high pluginspage="//www.macromedia.com/shockwave/download/index.cgi?P1_Prod_Version=ShockwaveFlash" type="application/x-shockwave-flash" width="' + width + '" height="' + height + '" AllowScriptAccess="always" AllowFullScreen="true" AllowFullScreenInteractive="true" WMode="' + wmode + '" FlashVars="' + flashVar + '">' +
          '</embed>' +
          '</object>';
    
        //swfobj.registerObject(this._id, "10.1.0");
      },
    
      _getPlayer: function(id) {
        if (navigator.appName.indexOf("Microsoft") != -1) {
          return document.getElementById(id);
        } else {
          return document[id];
        }
      },
    
      //å¢žåŠ å¯¹ domain,statisticService,videoInfoService,vurl(è°ƒæ•´ä¸º source) çš„è®¾ç½®æ”¯æŒ
      _comboFlashVars: function() {
        var opt = this._options,
          flashVarArr = {
            autoPlay: opt.autoplay ? 1 : 0,
    
            //20170419 æ—¥å¿—æ”¹ç‰ˆï¼Œä¸åœ¨è®©ç”¨æˆ·ä¼ from >=1.6.8
            // from: opt.from,
    
            isInner: 0,
            actRequest: 1,
            //ref: 'share',
            vid: opt.vid,
            domain: opt.domain ? opt.domain : '//tv.taobao.com',
            //statisticService: opt.statisticService ? opt.statisticService : '//log.video.taobao.com/stat/',
            //statisticService: opt.statisticService ? opt.statisticService : '//videocloud.cn-hangzhou.log.aliyuncs.com/logstores/player/track',
            statisticService: opt.statisticService ? opt.statisticService : cfg.logReportTo,
            videoInfoService: opt.videoInfoService ? opt.videoInfoService : '/player/json/getBaseVideoInfo.do',
            disablePing: opt.trackLog ? 0 : 1,
            namespace: this.id,
            barMode: opt.barMode != 0 ? 1 : 0,
            //ç›´æ’­çŠ¶æ€
            isLive: opt.isLive ? 1 : 0,
            //æ°´å°
            waterMark: opt.waterMark,
            environment: opt.environment,
            //ç›´æŽ¥æ’­æ”¾çš„åœ°å€
            vurl: opt.source ? encodeURIComponent(opt.source) : "",
            //æ’ä»¶
            plugins: opt.plugins ? opt.plugins : "",
            snapShotShow: opt.snapshot ? 1 : 0,
    
            accessId: opt.accId ? opt.accId : "",
            accessKey: opt.accSecret ? opt.accSecret : "",
            apiKey: opt.apiKey ? opt.apiKey : "",
    
            flashApiKey: opt.flashApiKey ? opt.flashApiKey : "",
            // fromAdress_taoTV : opt.fromAdress_taoTV ? opt.fromAdress_taoTV : "",
    
            disableSeek: opt.disableSeek ? 1 : 0, //ç¦æ­¢seekæŒ‰é’®
            disableFullScreen: opt.disableFullScreen ? 1 : 0, //ç¦æ­¢å…¨å±
    
    
            stsToken: opt.stsToken ? opt.stsToken : "",
            domainRegion: opt.domainRegion ? opt.domainRegion : "",
            authInfo: opt.authInfo ? encodeURIComponent(opt.authInfo) : "",
            playDomain: opt.playDomain ? opt.playDomain : "",
    
            stretcherZoomType: opt.stretcherZoomType ? opt.stretcherZoomType : "",
    
    
    
            playauth: opt.playauth ? opt.playauth.replace(/\+/g, '%2B') : "",
            prismType: opt.prismType ? opt.prismType : 0,
    
            formats: opt.formats ? opt.formats : "",
            notShowTips: opt.notShowTips ? 1 : 0,
            showBarTime: opt.showBarTime ? opt.showBarTime : 0,
            showBuffer: opt.showBuffer == 0 ? 0 : 1,
            rePlay: opt.rePlay ? 1 : 0,
            encryp: opt.encryp ? opt.encryp : "",
            secret: opt.secret ? opt.secret : ""
          },
          flashVar = [];
    
        if (opt.cover) {
          flashVarArr.cover = opt.cover;
        }
        if (opt.extraInfo) {
          flashVarArr.extraInfo = encodeURIComponent(JSON.stringify(opt.extraInfo));
        }
    
        _.each(flashVarArr, function(k, v) {
          flashVar.push(k + '=' + v);
        });
    
        return flashVar.join('&');
      },
    
      /************************ flashè°ƒç”¨jsçš„å‡½æ•° ***********************/
    
      /**
       * flashPlayeråˆå§‹åŒ–å®Œæ¯•
       */
      flashReady: function() {
        this.flashPlayer = this._getPlayer(this.id);
        this._isReady = true;
    
        // ä¼ é€’skinç›¸å…³
        var skinRes = this._options.skinRes,
          skinLayout = this._options.skinLayout,
          skin;
    
        // å¿…é¡»æ˜¯falseæˆ–è€…array
        if (skinLayout !== false && !_.isArray(skinLayout)) {
          throw new Error('PrismPlayer Error: skinLayout should be false or type of array!');
        }
        if (typeof skinRes !== 'string') {
          throw new Error('PrismPlayer Error: skinRes should be string!');
        }
    
        // å¦‚æžœæ˜¯falseæˆ–è€…[]ï¼Œéšè—uiç»„ä»¶
        if (skinLayout == false || skinLayout.length === 0) {
          skin = false;
    
        } else {
          skin = {
            skinRes: skinRes,
            skinLayout: skinLayout
          };
        }
        this.flashPlayer.setPlayerSkin(skin);
    
        this.trigger('ready');
    
        // å‘ŠçŸ¥flashæ’­æ”¾å™¨é¡µé¢å…³é—­
        var that = this;
        window.addEventListener('beforeunload', function() {
          try {
            that.flashPlayer.setPlayerCloseStatus();
          } catch (e) {
    
          }
        });
      },
    
      /**
       * flashè°ƒç”¨è¯¥å‡½æ•°ï¼Œè½®è¯¢jsçš„å‡½æ•°å£°æ˜Žæ˜¯å¦å®Œæˆ
       */
      jsReady: function() {
        return true;
      },
    
      uiReady: function() {
        this.trigger('uiReady');
      },
    
      loadedmetadata: function() {
        this.trigger('loadedmetadata');
      },
    
      onPlay: function() {
        this.trigger('play');
      },
    
      onEnded: function() {
        this.trigger('ended');
      },
    
      onPause: function() {
        this.trigger('pause');
      },
      //flashå¼¹å¹•æ’ä»¶åˆå§‹åŒ–å®Œæˆ
      onBulletScreenReady: function() {
        this.trigger('bSReady');
      },
      //flashå¼¹å¹•å‘é€å¼¹å¹•æ¶ˆæ¯
      onBulletScreenMsgSend: function(msg) {
        this.trigger('bSSendMsg', msg);
      },
    
      //flashè§†é¢‘å¼€å§‹æ¸²æŸ“æ’­æ”¾å™¨å†…é€»è¾‘åšäº†å•ä¸ªè§†é¢‘çš„å‘é€æ»¤é‡,å¯ä»¥ä½œä¸ºcanplayçš„ä¾èµ–
      onVideoRender: function(time) {
        this.trigger('videoRender');
        this.trigger('canplay', {
          loadtime: time
        });
      },
      //flashæ’­æ”¾å™¨æ•æ‰åˆ°é”™è¯¯æ—¶è°ƒç”¨
      onVideoError: function(type) {
        this.trigger('error', {
          errortype: type
        });
      },
      //flash catch m3u8 request error and retry
      onM3u8Retry: function() {
        this.trigger('m3u8Retry');
      },
      //send hide bar
      hideBar: function() {
        this.trigger('hideBar');
      },
      //send show bar: closed now
      showBar: function() {
        this.trigger('showBar');
      },
      //flash catch live stream stop
      liveStreamStop: function() {
        this.trigger('liveStreamStop');
      },
      //flash catch live stream stop
      stsTokenExpired: function() {
        this.trigger('stsTokenExpired');
      },
      //flashæ’­æ”¾å™¨æ•æ‰åˆ°ç¼“å†²
      onVideoBuffer: function() {
        this.trigger('waiting');
      },
    
      /**
       * jsè°ƒç”¨flashå‡½æ•°çš„åŸºç¡€æ–¹æ³•
       */
      _invoke: function() {
        var fnName = arguments[0],
          args = arguments;
    
        Array.prototype.shift.call(args);
    
        if (!this.flashPlayer) {
          throw new Error('PrismPlayer Error: flash player is not ready!');
        }
        if (typeof this.flashPlayer[fnName] !== 'function') {
          throw new Error('PrismPlayer Error: function ' + fnName + ' is not found!');
        }
    
        return this.flashPlayer[fnName].apply(this.flashPlayer, args);
      },
    
      /* ================ å…¬å…±æŽ¥å£ ====================== */
    
      play: function() {
        this._invoke('playVideo');
      },
      replay: function() {
        this._invoke('replayVideo');
      },
    
      pause: function() {
        this._invoke('pauseVideo');
      },
      stop: function() {
        this._invoke('stopVideo');
      },
      // ç§’
      seek: function(time) {
        this._invoke('seekVideo', time);
      },
    
      getCurrentTime: function() {
        return this._invoke('getCurrentTime');
      },
    
      getDuration: function() {
        return this._invoke('getDuration');
      },
    
      mute: function() {
        this.setVolume(0);
      },
    
      unMute: function() {
        this.setVolume(0.5);
      },
    
    
      // 0-1
      getVolume: function() {
        return this._invoke('getVolume');
      },
    
      // 0-1
      setVolume: function(vol) {
        this._invoke('setVolume', vol);
      },
      //æ–°å¢žæŽ¥å£============================
      //é€šè¿‡idåŠ è½½è§†é¢‘
      loadByVid: function(vid) {
        this._invoke('loadByVid', vid, false);
      },
      //é€šè¿‡urlåŠ è½½è§†é¢‘
      loadByUrl: function(url, seconds) {
        this._invoke('loadByUrl', url, seconds);
      },
      //é”€æ¯ æš‚åœè§†é¢‘,å…¶ä½™çš„ç”±ä¸šåŠ¡é€»è¾‘å¤„ç†
      dispose: function() {
        this._invoke('pauseVideo');
      },
      //æŽ¨é€å¼¹å¹•æ¶ˆæ¯,jsèŽ·å–åˆ°æ¶ˆæ¯åŽæŽ¨é€ç»™flashæ˜¾ç¤º
      showBSMsg: function(msg) {
        this._invoke('showBSMsg', msg);
      },
      //è®¾ç½®æ˜¯å¦å¯ç”¨toastä¿¡æ¯æç¤º
      setToastEnabled: function(enabled) {
        this._invoke('setToastEnabled', enabled);
      },
      //è®¾ç½®æ˜¯å¦æ˜¾ç¤ºloading
      setLoadingInvisible: function() {
        this._invoke('setLoadingInvisible');
      },
      //set player size
      setPlayerSize: function(input_w, input_h) {
        var that = this;
        this._el.style.width = input_w
    
        var per_idx = input_h.indexOf("%");
        if (per_idx > 0) {
          var screen_height = window.screen.height;
          var per_value = input_h.replace("%", "");
          if (!isNaN(per_value)) {
            var scale_value = screen_height * 9 * parseInt(per_value) / 1000;
            this._el.style.height = String(scale_value % 2 ? scale_value + 1 : scale_value) + "px";
          } else {
            this._el.style.height = input_h;
          }
        } else {
          this._el.style.height = input_h;
        }
        console.log(input_w + input_h);
      }
    });
    
    module.exports = FlashPlayer;
    
    },{"../config":40,"../lib/data":44,"../lib/object":50,"../ui/component":62}],57:[function(require,module,exports){
    /*
     * æ’­æ”¾å™¨æ ¸å¿ƒç±»
     *
     */
    var Component = require('../ui/component');
    var _ = require('../lib/object');
    var Dom = require('../lib/dom');
    var Event = require('../lib/event');
    var io = require('../lib/io');
    var UI = require('../ui/exports');
    var ErrorDisplay = require('../ui/component/error-display');
    var Monitor = require('../monitor/monitor');
    var UA = require('../lib/ua');
    var vod = require('./saas/vod');
    var signature = require('./saas/signature');
    var constants = require('../lib/constants.js');
    var AuthKeyExpiredHandle = require('./saas/authkeyexpiredhandle.js');
    var CryptoJS = require("crypto-js");
    
    var debug_flag = 0;
    
    var Player = Component.extend({
        init: function(tag, options) {
            this.tag = tag;
            this.loaded = false;
            this.played = false;
            this.waiting = false;
            this._urls = [];
            this._currentPlayIndex = 0;
            this._retrySwitchUrlCount = 0;
            this._serverRequestId = "";
            this._isError = false;
            this._authKeyExpiredHandle = new AuthKeyExpiredHandle(this);
    
            //è°ƒç”¨çˆ¶ç±»çš„æž„é€ å‡½æ•°
            Component.call(this, this, options);
    
            //åˆå§‹åŒ–æ‰€æœ‰æ’ä»¶
            if (options['plugins']) {
                _.each(options['plugins'], function(key, val) {
                    this[key](val);
                }, this);
            }
    
            // å¦‚æžœä¸ä½¿ç”¨é»˜è®¤çš„controlsï¼Œå¹¶ä¸”ä¸æ˜¯iphoneï¼Œæ‰åˆå§‹åŒ–uiç»„ä»¶
            this.UI = {};
            if (!options['useNativeControls'] /*&& !UA.IS_IPHONE*/ ) {
                // å°†æ‰€æœ‰å¯ç”¨çš„uiç»„ä»¶æŒ‚è½½åœ¨playerä¸‹ï¼Œä¾›åˆå§‹åŒ–ç»„ä»¶æ—¶ç´¢å¼•
                this.UI = UI;
                // å¦åˆ™è®¾ç½®controlså³å¯
            } else {
                this.tag.setAttribute('controls', 'controls');
            }
            this.UI.errorDisplay = ErrorDisplay;
            this.initChildren();
    
            //ç›‘å¬è§†é¢‘æ’­æ”¾å™¨çš„äº‹ä»¶
            this.bindVideoEvent();
    
            this._monitor = new Monitor(this, {
                video_id: 0,
                album_id: 0,
                from: this._options.from
            },this._options['trackLog']);
    
            if (!this.checkOnline()) {
                return;
            }
    
            // å¦‚æžœé‡‡ç”¨ç›´æŽ¥ä¼ å…¥è§†é¢‘æºçš„æ–¹å¼ï¼Œåˆ™ç›´æŽ¥æ’­æ”¾
            if (this._options.source) {
                // å¦åˆ™ï¼Œè°ƒç”¨æŽ¥å£åŠ è½½è§†é¢‘èµ„æº
                this.initPlay();
            } else if (this._options.vid) {
    
                //å¢žåŠ å‚æ•° æ¥ç¡®å®šç”¨æˆ·ä½¿ç”¨ ç‰ˆæœ¬å’Œé€»è¾‘   é»˜è®¤ vid + playauth æ’­æ”¾
                switch (this._options.prismType) { // é»˜è®¤åˆå§‹ 0
                    case 1: //taotv
                        //å…¼å®¹ taotvå’Œyouku
                        this.loadVideoInfo();
                        break;
                    case 2:
                    case 3:
                        this.reloadNewVideoInfo();
                        break;
                    default:
                        //20170419 vid playauth æ’­æ”¾åŠŸèƒ½
                        this.userPlayInfoAndVidRequestMts();
                }
            }
    
    
    
            if (this._options.extraInfo) {
                var dict = eval(this._options.extraInfo);
                if (dict.liveRetry)
                    this._options.liveRetry = dict.liveRetry;
            }
    
            //è¦æƒ³æ‹¿åˆ°videoçš„å…ƒæ•°æ®ï¼Œå¿…é¡»ç­‰åˆ°readyState > 0
            this.on('readyState', function() {
                //æ˜¯å¦å‡ºçŽ°æŽ§åˆ¶é¢æ¿
                //this.setControls();
                this.trigger('ready');
                if (debug_flag) {
                    console.log('ready');
                }
            });
    
        }
    });
    
    Player.prototype.initPlay = function(reload) {
            if(typeof reload == "undefined")
            {
                reload = false;
            }
            var msg = this._checkSupportVideoType();
            if(!msg)
            {
                if(!this._options.autoplay)
                {
                    this.trigger('play_btn_show');
                }
                // å¯ä»¥è®¤ä¸ºæ­¤æ—¶player init
                if (!this.loaded) {
                    this.trigger('init');
                }
    
                if (this._options.autoplay || this._options.preload || reload) {
                    this.getMetaData();
                    this.tag.setAttribute('src', this._options.source);
                    this.readyTime = new Date().getTime();
                    this.loaded = true;
                }
            }
        }
        /**
         * é‡å†™componentçš„initChildrenï¼Œ
         * playerçš„childrené€šè¿‡options.skinä¼ å…¥
         */
    Player.prototype.initChildren = function() {
            var opt = this.options(),
                skin = opt.skinLayout;
    
            // å¿…é¡»æ˜¯falseæˆ–è€…array
            if (skin !== false && !_.isArray(skin)) {
                throw new Error('PrismPlayer Error: skinLayout should be false or type of array!');
            }
    
            // å¦‚æžœæ˜¯falseæˆ–è€…[]ï¼Œéšè—uiç»„ä»¶
            if (skin !== false && skin.length !== 0) {
                this.options({
                    children: skin
                });
                Component.prototype.initChildren.call(this);
            }
    
            // æ‰€æœ‰uiç»„ä»¶è¢«æ­£å¼æ·»åŠ åˆ°domæ ‘åŽè§¦å‘
            this.trigger('uiH5Ready');
            if (debug_flag) {
                console.log('uiH5ready');
            }
        },
    
        Player.prototype.createEl = function() {
            if (this.tag.tagName !== 'VIDEO') {
                this._el = this.tag;
                this.tag = Component.prototype.createEl.call(this, 'video');
                //å¦‚æžœè®¾ç½®äº† inline æ’­æ”¾
                if (this._options.playsinline) {
                    this.tag.setAttribute('webkit-playsinline', '');
                    this.tag.setAttribute('playsinline', '');
                    this.tag.setAttribute('x-webkit-airplay', '');
                };
            }
    
            var el = this._el,
                tag = this.tag,
                that = this;
            // Event.on(tag,'contextmenu',function() { 
            //     return false; 
            // }); 
    
            if (tag.addEventListener) {
                tag.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                }, false);
            } else {
                tag.attachEvent('oncontextmenu', function() {
                    window.event.returnValue = false;
                });
            }
    
            //è¯¥videoå·²ç»è¢«åˆå§‹åŒ–ä¸ºæ’­æ”¾å™¨
            tag['player'] = this;
    
    
    
            //æŠŠvideoæ ‡ç­¾ä¸Šçš„å±žæ€§è½¬ç§»åˆ°å¤–å›´å®¹å™¨ä¸Š
            var attrs = Dom.getElementAttributes(tag);
    
            _.each(attrs, function(attr) {
                el.setAttribute(attr, attrs[attr]);
            });
    
            //è®¾ç½®videoæ ‡ç­¾å±žæ€§
            this.setVideoAttrs();
    
            // æŠŠvideoæ ‡ç­¾åŒ…è£¹åœ¨elè¿™ä¸ªå®¹å™¨ä¸­
            if (tag.parentNode) {
                tag.parentNode.insertBefore(el, tag);
            }
            Dom.insertFirst(tag, el); // Breaks iPhone, fixed in HTML5 setup.*''
    
            // ä¸ºäº†å±è”½å„ä¸ªæµè§ˆå™¨ä¸‹videoæ ‡ç­¾çš„é»˜è®¤æ ·å¼ï¼Œéœ€è¦åœ¨å…¶ä¸ŠåŠ ä¸€å±‚é®ç½©
            this.cover = Dom.createEl('div');
            Dom.addClass(this.cover, 'prism-cover');
            el.appendChild(this.cover);
    
            if (this.options().cover) {
                this.cover.style.backgroundImage = 'url(' + this.options().cover + ')';
            }
            if (UA.IS_IOS) {
                Dom.css(tag, 'display', 'none');
            }
    
            return el;
        };
    
    Player.prototype.setVideoAttrs = function() {
        var preload = this._options.preload,
            autoplay = this._options.autoplay;
    
        this.tag.style.width = '100%';
        this.tag.style.height = '100%';
    
        if (preload) {
            this.tag.setAttribute('preload', 'preload');
        }
    
        if (autoplay) {
            this.tag.setAttribute('autoplay', 'autoplay');
        }
    }
    
    Player.prototype.checkOnline = function() {
        var value = navigator.onLine;
        if (value == false) {
            var paramData = {
                statusValue: 4001,
                mediaId: this._options.vid ? this._options.vid : "",
                error_code: constants.ErrorCode.NetworkUnavaiable,
                error_msg: "ç½‘ç»œä¸å¯ç”¨",
                display_msg: "ç½‘ç»œä¸å¯ç”¨ï¼Œè¯·ç¡®å®š"
            };
            this.logError(paramData);
            this.trigger('error', paramData);
            return false;
        }
        return true;
    }
    
    /**
     * sleep function
     */
    function sleep(d) {
        for (var t = Date.now(); Date.now() - t <= d;);
    }
    
    /**
     * playerçš„idç›´æŽ¥è¿”å›žç»„ä»¶çš„id
     */
    Player.prototype.id = function() {
        return this.el().id;
    };
    
    Player.prototype.renderUI = function() {};
    
    
    Player.prototype.switchUrl = function() {
        if (this._urls.length == 0)
            return;
    
        this._currentPlayIndex = this._currentPlayIndex + 1;
        if (this._urls.length <= this._currentPlayIndex) {
            this._currentPlayIndex = 0;
            this._retrySwitchUrlCount++;
        }
        var currentTime = this.getCurrentTime();
        this._options.source = this._urls[this._currentPlayIndex].Url;
        this.tag.setAttribute('src', this._options.source);
        this.tag.play();
    }
    
    
    //mtsè¯·æ±‚é”™è¯¯æ—¶ æ—¥å¿—ä¸ŠæŠ¥
    function mtsError_message(playerObj, errorObjc, address) {
        var that = playerObj;
    
        var errorObjcCode = errorObjc.Code ? errorObjc.Code : 'OTHER_ERR_CODE';
        var errorObjcMsg = errorObjc.Message ? errorObjc.Message : "OTHER_ERR_MSG";
    
    
        var errorCode = constants.ErrorCode.ServerAPIError;
    
    
        //åˆ¤æ–­åŠ å¯†çš„åªèƒ½flashæ’­æ”¾
        if ('InvalidParameter.Rand' == errorObjc.Code) {
            errorCode = constants.ErrorCode.EncrptyVideoNotSupport;
            display_msg = "h5ä¸æ”¯æŒåŠ å¯†è§†é¢‘çš„æ’­æ”¾";
        }
    
        //mts request_error
    
        var playerVid = that._options.vid ? that._options.vid : '0';
        var playerFrom = that._options.from ? that._options.from : '0';
    
        var paramData = {
            statusValue: errorCode,
            mediaId: playerVid,
            error_code: errorObjcCode,
            error_msg: errorObjcCode + "||" + errorObjcMsg,
            display_msg: "èŽ·å–åœ°å€å‡ºé”™å•¦ï¼Œè¯·å°è¯•é€€å‡ºé‡è¯•æˆ–åˆ·æ–°"
        };
    
        // å¼€å§‹ç›‘æŽ§
        that.logError(paramData);
    
    
        that.trigger('error', paramData);
    
        console.log('PrismPlayer Error: ' + address + '! ' + 'error_msg :' + errorObjcMsg + ';');
    }
    
    Player.prototype.userPramaRequestMts = function(params) {
        this.log('STARTFETCHDATA', {
            pt: new Date().getTime()
        });
        var that = this;
        this._urls = [];
        this.currentPlayIndex = 0;
        this._retrySwitchUrlCount = 0;
        if (!params) {
            params = {
                vid: this._options.vid,
                accessId: this._options.accId,
                accessSecret: this._options.accSecret,
                stsToken: this._options.stsToken,
                domainRegion: this._options.domainRegion,
                authInfo: this._options.authInfo,
                playDomain: this._options.domainRegion
            }
        }
        this._authKeyExpiredHandle.clearTick();
    
        vod.getDataByAuthInfo(params, function(data) {
                that._serverRequestId = data.requestId;
                that.log('COMPLETEFETCHDATA', {
                    pt: new Date().getTime()
                });
                if (data.urls.length == 0) {
                    mtsError_message(that, {
                        Code: constants.ErrorCode.URLsIsEmpty,
                        Message: 'èŽ·å–æ’­æ”¾åœ°å€ä¸ºç©º'
                    }, "");
                    return;
                }
                that._urls = data.urls;
                var url = data.urls[that.currentPlayIndex];
                var src = url.Url;
                that._options.source = src;
                that._authKeyExpiredHandle.tick(constants.AuthKeyRefreshExpired);
                that.trigger('sourceloaded', url);
                that.initPlay();
    
            },
            function(errorData) {
                that.log('COMPLETEFETCHDATA', {
                    pt: new Date().getTime()
                });
                mtsError_message(that, errorData, "");
            });
    
    }
    
    
    //vid playInfo -> mts 2017-04-19  playauth
    Player.prototype.userPlayInfoAndVidRequestMts = function() {
    
        try {
            var playauth = signature.encPlayAuth(this._options.playauth);
        } catch (e) {
            var paramData = {
                Code: constants.ErrorCode.PlayauthDecode,
                Message: 'playauth decoded failed.',
                displayMessage: 'playauthè§£æžé”™è¯¯'
            };
            mtsError_message(this, paramData, this._options.playauth);
            return;
        }
    
        //buisness_id
        this._options.from = playauth.CustomerId ? playauth.CustomerId : '';
        var coverUrl = playauth.VideoMeta.CoverURL;
        if(this.cover && coverUrl && !this._options.cover)
        {
            this.cover.style.backgroundImage = 'url(' + coverUrl + ')';
        }
    
        var params = {
            vid: this._options.vid,
            accessId: playauth.AccessKeyId,
            accessSecret: playauth.AccessKeySecret,
            stsToken: playauth.SecurityToken,
            domainRegion: playauth.Region,
            authInfo: playauth.AuthInfo,
            playDomain: playauth.PlayDomain
        }
    
        this.userPramaRequestMts(params)
    }
    
    //ç”¨äºŽå¯¹å¤–æŽ¥å£ ï¼Œé‡æ–°æ’­æ”¾ playAuth
    Player.prototype.replayByVidAndPlayAuth = function(vid, playAuth) {
        this.trigger('error_hide');
        this._options.source = '';
        this._options.vid = vid;
        this._options.playauth = playAuth;
    
        this.userPlayInfoAndVidRequestMts();
    }
    
    Player.prototype.updateSourcesByVidAndPlayAuth = function(vid, playAuth) {
        if(vid != this._options.vid)
        {
            console.log('ä¸èƒ½æ›´æ–°åœ°å€ï¼Œvidå’Œæ’­æ”¾ä¸­çš„ä¸ä¸€è‡´');
            return;
        }
        this._options.vid = vid;
        this._options.playauth = playAuth;
        try {
            var playauth = signature.encPlayAuth(this._options.playauth);
        } catch (e) {
            console.log('playauthè§£æžé”™è¯¯');
            return;
        }
    
        var params = {
            vid: vid,
            accessId: playauth.AccessKeyId,
            accessSecret: playauth.AccessKeySecret,
            stsToken: playauth.SecurityToken,
            domainRegion: playauth.Region,
            authInfo: playauth.AuthInfo,
            playDomain: playauth.PlayDomain
        }
        this._authKeyExpiredHandle.clearTick();
        var that = this;
        vod.getDataByAuthInfo(params, function(data) {
            that._serverRequestId = data.requestId;
    
            if (data.urls.length != 0) {  
                that._urls = data.urls;      
            }
            that._authKeyExpiredHandle.tick(constants.AuthKeyRefreshExpired);
    
        },
        function(errorData) {
            console.log(errorData);
        });
    }
    
    
    
    
    //ç”¨äºŽå¯¹å¤–æŽ¥å£ ï¼Œé‡æ–°æ’­æ”¾ playAuth
    Player.prototype.reloaduserPlayInfoAndVidRequestMts = function(vid, playAuth) {
        this.replayByVidAndPlayAuth(vid, playAuth);
    }
    
    
    //ç”¨äºŽå¯¹å¤–æŽ¥å£ ï¼Œé‡æ–°æ’­æ”¾ authinfo
    Player.prototype.reloadNewVideoInfo = function(vid, accessId, accessSecret, apiSecretKey, user_stsToken, user_authInfo, user_domainRegion) {
            this.trigger('error_hide');
            this._options.source = '';
            if (vid) {
                this._options.vid = vid;
                this._options.accId = accessId;
                this._options.accessSecret = accessSecret;
                this._options.stsToken = user_stsToken;
                this._options.domainRegion = user_domainRegion;
                this._options.authInfo = user_authInfo;
            }
    
            this.userPramaRequestMts();
        }
        /**
         * å¼‚æ­¥èŽ·å–videoinfoï¼ŒæˆåŠŸåŽè§¦å‘readyStateçš„æ£€æµ‹hackï¼Œ
         * å› ä¸ºæœ‰å¾ˆå¤šuiç»„ä»¶çš„uiæ›´æ–°éœ€è¦ä¾èµ–äºŽmetadataï¼ˆæ—¶é•¿ã€bufferedç­‰ï¼‰
         */
    
    Player.prototype.loadVideoInfo = function() {
        this.trigger('error_hide');
        var vid = this._options.vid,
            that = this;
    
        if (!vid) {
            throw new Error('PrismPlayer Error: vid should not be null!');
        }
    
        // tv.taobao.com
        io.jsonp('//tv.taobao.com/player/json/getBaseVideoInfo.do?vid=' + vid + '&playerType=3', function(data) {
    
            // applewatch å’Œ new iphoneçš„ä¸´æ—¶ä¿®æ”¹ï¼Œç”±äºŽè¿™ä¸ªæ´»åŠ¨è®¿é—®é‡è¾ƒå¤§ï¼ŒæŽ¥å£è¯·æ±‚ä¸´æ—¶èµ°cdn
            //io.jsonp('//www.taobao.com/go/rgn/tv/ajax/applewatch-media.php?vid=' + vid + '&playerType=3', function(data) {
    
            if (data.status === 1 && data.data.source) {
                var src,
                    maxDef = -1;
                _.each(data.data.source, function(k, v) {
                    var def = +k.substring(1);
                    if (def > maxDef) maxDef = def;
                });
                src = data.data.source['v' + maxDef];
                src = _.unescape(src) /*.replace(/n\.videotest\.alikunlun\.com/g, 'd.tv.taobao.com')*/ ;
                that._options.source = src;
    
                that.initPlay();
    
            } else {
                throw new Error('PrismPlayer Error: #vid:' + vid + ' cannot find video resource!');
            }
    
        }, function() {
            throw new Error('PrismPlayer Error: network error!');
        });
    
    };
    
    
    Player.prototype.setControls = function() {
            var options = this.options();
            //å¦‚æžœæŒ‡å®šä½¿ç”¨ç³»ç»Ÿé»˜è®¤çš„æŽ§åˆ¶é¢æ¿
            if (options.useNativeControls) {
                this.tag.setAttribute('controls', 'controls');
            } else {
                //å¦åˆ™ä½¿ç”¨æˆ‘ä»¬è‡ªå®šä¹‰çš„æŽ§åˆ¶é¢æ¿
                // TODO
                if (typeof options.controls === 'object') {
                    //options.controlsä¸ºcontrobarçš„é…ç½®é¡¹
                    var controlBar = this._initControlBar(options.controls);
                    this.addChild(controlBar);
                }
            }
        }
        //
    Player.prototype._initControlBar = function(options) {
        var controlBar = new ControlBar(this, options);
        return controlBar;
    }
    
    /**
     * èŽ·å–è§†é¢‘å…ƒæ•°æ®ä¿¡æ¯
     */
    Player.prototype.getMetaData = function() {
        var that = this,
            timer = null,
            video = this.tag;
    
        timer = window.setInterval(function(t) {
            if(!that.tag)
            {
                clearInterval(timer);
                return;
            }
            if (video.readyState > 0) {
                var vid_duration = Math.round(video.duration);
                that.tag.duration = vid_duration;
                //that.readyTime = new Date().getTime() - that.readyTime;
                that.trigger('readyState');
                if (debug_flag) {
                    console.log('readystate');
                }
                clearInterval(timer);
            }
        }, 100);
    };
    
    Player.prototype.getReadyTime = function() {
        return this.readyTime;
    };
    
    Player.prototype.readyState = function() {
        return this.tag.readyState;
    };
    
    Player.prototype.getError = function() {
        return this.tag.error;
    };
    
    Player.prototype.getServerRequestId = function() {
        return this._serverRequestId;
    };
    
    Player.prototype.getRecentOccuredEvent = function() {
        return this._eventState;
    };
    
    Player.prototype.getSourceUrl = function() {
        return this._options ? this._options.source : "";
    };
    
    Player.prototype.getMonitorInfo = function() {
        if( this._monitor)
        {
          return this._monitor.opt;
        }
        return {};
    };
    
    
    
    /* æ ‡å‡†åŒ–æ’­æ”¾å™¨api
    ============================================================================= */
    //å¼€å§‹æ’­æ”¾è§†é¢‘
    Player.prototype.play = function() {
            var that = this;
            // if (!this._options.autoplay && !this._options.preload && !this.loaded) {
            if (!this._options.preload && !this.loaded) {
                this.getMetaData();
                this.tag.setAttribute('src', this._options.source);
                this.readyTime = new Date().getTime();
                this.loaded = true;
            }
            //if autoplay, canplaythrough delete cover; else play delete cover
            if (that.cover && (!that._options.autoplay)) {
                Dom.css(that.cover, 'display', 'none');
                delete that.cover;
            }
            this.tag.play();
    
            return this;
        }
        //replay
    Player.prototype.replay = function() {
            this.seek(0);
            this.tag.play();
            return this;
        }
        //æš‚åœè§†é¢‘
    Player.prototype.pause = function() {
            this.tag.pause();
            return this;
        }
        //åœæ­¢è§†é¢‘
    Player.prototype.stop = function() {
        this.tag.setAttribute('src', null);
        return this;
    }
    Player.prototype.paused = function() {
        // The initial state of paused should be true (in Safari it's actually false)
        return this.tag.paused === false ? false : true;
    };
    //èŽ·å–è§†é¢‘æ€»æ—¶é•¿
    Player.prototype.getDuration = function() {
        var totalDuration = 0;
        if(this.tag)
        {
            totalDuration = this.tag.duration;
        }
        return totalDuration;
    }
        //è®¾ç½®æˆ–è€…èŽ·å–å½“å‰æ’­æ”¾æ—¶é—´
    
    Player.prototype.getCurrentTime = function() {
    
        if (!this.tag) {
            return 0;
        };
        var currentTime = this.tag.currentTime;
        return currentTime;
    }
    
    Player.prototype.seek = function(time) {
        if (time === this.tag.duration) time--;
        try {
            this.tag.currentTime = time;
        } catch (e) {
            console.log(e);
        }
        return this;
    }
    
    
    
    //é€šè¿‡idåŠ è½½è§†é¢‘
    Player.prototype.loadByVid = function(vid) {
        this._options.vid = vid;
        var that = this;
    
        if (!vid) {
            throw new Error('PrismPlayer Error: vid should not be null!');
        }
    
    
    
        // tv.taobao.com
        io.jsonp('//tv.taobao.com/player/json/getBaseVideoInfo.do?vid=' + vid + '&playerType=3', function(data) {
    
            // applewatch å’Œ new iphoneçš„ä¸´æ—¶ä¿®æ”¹ï¼Œç”±äºŽè¿™ä¸ªæ´»åŠ¨è®¿é—®é‡è¾ƒå¤§ï¼ŒæŽ¥å£è¯·æ±‚ä¸´æ—¶èµ°cdn
            //io.jsonp('//www.taobao.com/go/rgn/tv/ajax/applewatch-media.php?vid=' + vid + '&playerType=3', function(data) {
    
            if (data.status === 1 && data.data.source) {
                var src,
                    maxDef = -1;
                _.each(data.data.source, function(k, v) {
                    var def = +k.substring(1);
                    if (def > maxDef) maxDef = def;
                });
                src = data.data.source['v' + maxDef];
                src = _.unescape(src) /*.replace(/n\.videotest\.alikunlun\.com/g, 'd.tv.taobao.com')*/ ;
                that._options.source = src;
    
                // å¼€å§‹ç›‘æŽ§
    
                if (that._monitor) {
                    that._monitor.updateVideoInfo({
                        video_id: vid,
                        album_id: data.data.baseInfo.aid,
                        from: that._options.from
                    });
                }
    
                that._options.autoplay = true;
    
    
                // å¯ä»¥è®¤ä¸ºæ­¤æ—¶player init
                that.initPlay();
    
                //if preload/autoplay, canplaythrough delete cover; else play delete cover
                if (that.cover && that._options.autoplay) {
                    Dom.css(that.cover, 'display', 'none');
                    delete that.cover;
                }
                that.tag.play();
    
            } else {
                throw new Error('PrismPlayer Error: #vid:' + vid + ' cannot find video resource!');
            }
    
        }, function() {
            throw new Error('PrismPlayer Error: network error!');
        });
    }
    
    
    //é€šè¿‡urlåŠ è½½è§†é¢‘,ç¬¬ä¸€æ¬¡è¯·æ±‚è§†é¢‘urlï¼Œä¸ç›´æŽ¥æ’­æ”¾ã€‚æ’­æ”¾ç”±ç”¨æˆ·æ‰‹åŠ¨æ“ä½œã€‚  2017-04-18
    Player.prototype.firstNewUrlloadByUrl = function(url, seconds) {
        this._options.vid = 0;
        this._options.source = url;
        // this._options.autoplay=true;
        // var test = this._options.autoplay;
        // å¼€å§‹ç›‘æŽ§
        if (this._monitor) {
            this._monitor.updateVideoInfo({
                video_id: 0,
                album_id: 0,
                from: this._options.from
            });
        }
    
        // å¯ä»¥è®¤ä¸ºæ­¤æ—¶player init
        this.initPlay();
    
        //if not preload/autoplay, canplaythrough delete cover; else play delete cover
        if (this.cover && (this._options.preload || this._options.autoplay)) {
            Dom.css(this.cover, 'display', 'none');
            delete this.cover;
        }
    
        //å¢žåŠ æ’­æ”¾æ—¶
        if (this._options.autoplay) {
            this.trigger('play');
        } else {
            this.trigger('pause');
        };
    
        // this.tag.play();
        if (seconds && !isNaN(seconds)) {
            this.seek(seconds);
        }
    }
    
    Player.prototype.loadByUrl = function(url, seconds) {
        this.trigger('error_hide');
        this._options.vid = 0;
        this._options.source = url;
        // this._options.autoplay=true;
        // å¼€å§‹ç›‘æŽ§
        if (this._monitor) {
            this._monitor.updateVideoInfo({
                video_id: 0,
                album_id: 0,
                from: this._options.from
            });
        }
    
        // å¯ä»¥è®¤ä¸ºæ­¤æ—¶player init
        this.initPlay(true);
    
        //if not preload/autoplay, canplaythrough delete cover; else play delete cover
        if (this.cover && (this._options.preload || this._options.autoplay)) {
            Dom.css(this.cover, 'display', 'none');
            delete this.cover;
        }
    
        //å¢žåŠ æ’­æ”¾æ—¶
        if (this._options.autoplay) {
            this.trigger('play');
        } else {
            this.trigger('pause');
        };
        var that = this;
        Event.one(this.tag, 'canplay', function(e) {
                // this.tag.play();
            if (seconds && !isNaN(seconds)) {
                that.seek(seconds);
            }
        });
    }
    
    //æ’­æ”¾å™¨é”€æ¯æ–¹æ³•åœ¨æ¸…é™¤èŠ‚ç‚¹å‰è°ƒç”¨
    Player.prototype.dispose = function() {
        this.tag.pause();
        //remove events
    
        var tag = this.tag,
            that = this;
        
        //æ’­æ”¾è¿‡ç¨‹è§¦å‘çš„äº‹ä»¶
        Event.off(tag, 'timeupdate');
        //å¼€å§‹æ’­æ”¾è§¦å‘äº‹ä»¶
        Event.off(tag, 'play');
        //æš‚åœè§¦å‘äº‹ä»¶
        Event.off(tag, 'pause');
        Event.off(tag, 'canplay');
        Event.off(tag, 'waiting');
    
        Event.off(tag, 'playing');
    
        Event.off(tag, 'ended');
    
        Event.off(tag, 'error');
    
        Event.off(tag, 'suspend');
    
        Event.off(tag, 'stalled');
    
        Event.off(tag, 'loadstart');
    
        Event.off(tag, 'durationchange');
        Event.off(tag, 'loadedmetadata');
        Event.off(tag, 'loadeddata');
        Event.off(tag, 'progress');
        Event.off(tag, 'canplaythrough');
        Event.off(tag, 'contextmenu');
        Event.off(tag, 'webkitfullscreenchange');
        this.off('timeupdate');
        this.off('durationchange');
        this.off('play_btn_show');
        this.off('init');
        this.off('ready');
        this.off('uiH5Ready');
        this.off('error_hide');
        this.off('error_show');
        this.off('h5_loading_show');
        this.off('h5_loading_hide');
        this.off('hideProgress');
        this.off('cancelHideProgress');
        this.off('requestFullScreen');
        this.off('cancelFullScreen');
        this.off('play');
        this.off('pause');
        this.off('click');
        this.off('mouseover');
        this.off('mouseout');
        this.off('hideBar');
        this.off('showBar');
        this.off('readyState');
        this.off('sourceloaded');
        this.tag = null;
        this._options = null;
    
        if (this._monitor) {
            this._monitor.removeEvent();
            this._monitor = null;
        };
    }
    
    //è®¾ç½®é™éŸ³æˆ–è€…èŽ·å–æ˜¯å¦é™éŸ³
    
    Player.prototype.mute = function() {
        this.tag.muted = true;
        return this;
    }
    
    Player.prototype.unMute = function() {
        this.tag.muted = false;
        return this;
    }
    
    Player.prototype.muted = function() {
        return this.tag.muted;
    };
    
    //è®¾ç½®æˆ–è€…èŽ·å–éŸ³é‡
    Player.prototype.getVolume = function() {
            return this.tag.volume;
        }
        //èŽ·å–é…ç½®
    Player.prototype.getOptions = function() {
            return this._options;
        }
        /*
        0-1åŒºé—´
        */
    Player.prototype.setVolume = function(volume) {
            this.tag.volume = volume;
        }
        //éšè—è¿›åº¦æ¡æŽ§åˆ¶   
    Player.prototype.hideProgress = function() {
            var that = this;
            that.trigger('hideProgress');
        }
        //å–æ¶ˆéšè—è¿›åº¦æ¡æŽ§åˆ¶
    Player.prototype.cancelHideProgress = function() {
        var that = this;
        that.trigger('cancelHideProgress');
    }
    
    //set player size when play
    Player.prototype.setPlayerSize = function(input_w, input_h) {
        var that = this;
        this._el.style.width = input_w
    
        if (input_h) {
            var per_idx = input_h.indexOf("%");
            if (per_idx > 0) {
                var screen_height = window.screen.height;
                var per_value = input_h.replace("%", "");
                if (!isNaN(per_value)) {
                    var scale_value = screen_height * 9 * parseInt(per_value) / 1000;
                    this._el.style.height = String(scale_value % 2 ? scale_value + 1 : scale_value) + "px";
                } else {
                    this._el.style.height = input_h;
                }
            } else {
                this._el.style.height = input_h;
            }
        }
    }
    
    
    
    // æ£€æµ‹fullscreençš„æ”¯æŒæƒ…å†µï¼Œå³æ—¶å‡½æ•°
    var __supportFullscreen = (function() {
        var prefix, requestFS, div;
    
        div = Dom.createEl('div');
        requestFS = {};
    
        var apiMap = [
            // Spec: https://dvcs.w3.org/hg/fullscreen/raw-file/tip/Overview.html
            [
                'requestFullscreen',
                'exitFullscreen',
                'fullscreenElement',
                'fullscreenEnabled',
                'fullscreenchange',
                'fullscreenerror',
                'fullScreen'
            ],
            // WebKit
            [
                'webkitRequestFullscreen',
                'webkitExitFullscreen',
                'webkitFullscreenElement',
                'webkitFullscreenEnabled',
                'webkitfullscreenchange',
                'webkitfullscreenerror',
                'webkitfullScreen'
            ],
            // Old WebKit(Safari 5.1)
            [
                'webkitRequestFullScreen',
                'webkitCancelFullScreen',
                'webkitCurrentFullScreenElement',
                'webkitFullscreenEnabled',
                'webkitfullscreenchange',
                'webkitfullscreenerror',
                'webkitIsFullScreen'
            ],
            // // safari iOS
            // [
            //   'webkitEnterFullscreen',
            //   'webkitExitFullscreen',
            //   'webkitCurrentFullScreenElement',
            //   'webkitCancelFullScreen',
            //   'webkitfullscreenchange',
            //   'webkitfullscreenerror',
            //   'webkitDisplayingFullscreen'
            // ],
            // Mozilla
            [
                'mozRequestFullScreen',
                'mozCancelFullScreen',
                'mozFullScreenElement',
                'mozFullScreenEnabled',
                'mozfullscreenchange',
                'mozfullscreenerror',
                'mozfullScreen'
            ],
            // Microsoft
            [
                'msRequestFullscreen',
                'msExitFullscreen',
                'msFullscreenElement',
                'msFullscreenEnabled',
                'MSFullscreenChange',
                'MSFullscreenError',
                'MSFullScreen'
            ]
        ];
    
        if (UA.IS_IOS) {
            //IOS ç‰¹æ®Šå¤„ç†
            requestFS.requestFn = "webkitEnterFullscreen";
            requestFS.cancelFn = "webkitExitFullscreen";
            requestFS.eventName = "webkitfullscreenchange";
            requestFS.isFullScreen = "webkitDisplayingFullscreen";
        } else {
            var l = 5;
            for (var i = 0; i < l; i++) {
                // check for exitFullscreen function
                if (apiMap[i][1] in document) {
                    requestFS.requestFn = apiMap[i][0];
                    requestFS.cancelFn = apiMap[i][1];
                    requestFS.eventName = apiMap[i][4];
                    requestFS.isFullScreen = apiMap[i][6];
                    break;
                }
            }
    
            //modify if has write fun
            //full screen
            if ('requestFullscreen' in document) {
                requestFS.requestFn = 'requestFullscreen';
            } else if ('webkitRequestFullscreen' in document) {
                requestFS.requestFn = 'webkitRequestFullscreen';
            } else if ('webkitRequestFullScreen' in document) {
                requestFS.requestFn = 'webkitRequestFullScreen';
            } else if ('webkitEnterFullscreen' in document) {
                requestFS.requestFn = 'webkitEnterFullscreen';
            } else if ('mozRequestFullScreen' in document) {
                requestFS.requestFn = 'mozRequestFullScreen';
            } else if ('msRequestFullscreen' in document) {
                requestFS.requestFn = 'msRequestFullscreen';
            }
    
            //full screen change
            if ('fullscreenchange' in document) {
                requestFS.eventName = 'fullscreenchange';
            } else if ('webkitfullscreenchange' in document) {
                requestFS.eventName = 'webkitfullscreenchange';
            } else if ('webkitfullscreenchange' in document) {
                requestFS.eventName = 'webkitfullscreenchange';
            } else if ('webkitfullscreenchange' in document) {
                requestFS.eventName = 'webkitfullscreenchange';
            } else if ('mozfullscreenchange' in document) {
                requestFS.eventName = 'mozfullscreenchange';
            } else if ('MSFullscreenChange' in document) {
                requestFS.eventName = 'MSFullscreenChange';
            }
    
            //full screen status
            if ('fullScreen' in document) {
                requestFS.isFullScreen = 'fullScreen';
            } else if ('webkitfullScreen' in document) {
                requestFS.isFullScreen = 'webkitfullScreen';
            } else if ('webkitIsFullScreen' in document) {
                requestFS.isFullScreen = 'webkitIsFullScreen';
            } else if ('webkitDisplayingFullscreen' in document) {
                requestFS.isFullScreen = 'webkitDisplayingFullscreen';
            } else if ('mozfullScreen' in document) {
                requestFS.isFullScreen = 'mozfullScreen';
            } else if ('MSFullScreen' in document) {
                requestFS.isFullScreen = 'MSFullScreen';
            }
    
        };
    
        if (requestFS.requestFn) {
            return requestFS;
        }
    
        // å¦‚æžœæµè§ˆå™¨ä¸æ”¯æŒå…¨å±æŽ¥å£ï¼Œè¿”å›žnull
        return null;
    })();
    // æ³¨æ„ï¼Œå³æ—¶å‡½æ•°
    
    /**
     * ä¸æ”¯æŒfullscreenAPIæ—¶çš„å…¨å±æ¨¡æ‹Ÿ
     *
     * @method _enterFullWindow
     * @private
     */
    Player.prototype._enterFullWindow = function() {
        var that = this;
    
        this.isFullWindow = true;
        this.docOrigOverflow = document.documentElement.style.overflow;
    
        document.documentElement.style.overflow = 'hidden';
        Dom.addClass(document.getElementsByTagName('body')[0], 'prism-full-window');
        //this.trigger('enterfullwindow');
    };
    
    /**
     * ä¸æ”¯æŒfullscreenAPIæ—¶çš„å–æ¶ˆå…¨å±æ¨¡æ‹Ÿ
     *
     * @method _exitFullWindow
     * @private
     */
    Player.prototype._exitFullWindow = function() {
        this.isFullWindow = false;
    
        document.documentElement.style.overflow = this.docOrigOverflow;
        Dom.removeClass(document.getElementsByTagName('body')[0], 'prism-full-window');
        //this.trigger('exitfullwindow');
    };
    
    /**
     * è®¾ç½®å…¨å±
     *
     * @method requestFullScreen
     */
    Player.prototype.requestFullScreen = function() {
        var requestFullScreen = __supportFullscreen,
            conTag = this.el(),
            that = this;
    
        if (UA.IS_IOS) {
            conTag = this.tag;
            conTag[requestFullScreen.requestFn]();
    
            return this;
        };
    
        this.isFullScreen = true;
        this.isFullScreenChanged = false;
        this._requestFullScreenTimer = null;
        if(!this._cancelFullScreenTimer)
        {
            clearTimeout(this._cancelFullScreenTimer);
        }
        var that = this;
        // å¦‚æžœæµè§ˆå™¨æ”¯æŒå…¨å±æŽ¥å£
        if (requestFullScreen) {
            conTag[requestFullScreen.requestFn]();
            this._requestFullScreenTimer =  setTimeout(function(){
               if(!that.isFullScreenChanged)
               {
                   that._enterFullWindow();
                   that.trigger('requestFullScreen');
                }
                that._requestFullScreenTimer = null;
            },500)
    
            // å¦‚æžœä¸æ”¯æŒå…¨å±æŽ¥å£ï¼Œåˆ™æ¨¡æ‹Ÿå®žçŽ°
        } else {
            this._enterFullWindow();
            this.trigger('requestFullScreen');
        }
    
        return this;
    };
    
    /**
     * å–æ¶ˆå…¨å±
     *
     * @method cancelFullScreen
     */
    Player.prototype.cancelFullScreen = function() {
        var requestFullScreen = __supportFullscreen,
            that = this;
    
        this.isFullScreen = false;
        this.isFullScreenChanged = false;
        this._cancelFullScreenTimer = null;
        if(!this._requestFullScreenTimer)
        {
            clearTimeout(this._requestFullScreenTimer);
        }
        var that = this;
        if (requestFullScreen) {
    
            document[requestFullScreen.cancelFn]();
            that._cancelFullScreenTimer  = setTimeout(function(){
               if(!that.isFullScreenChanged)
               {
                   that._exitFullWindow();
                   that.trigger('cancelFullScreen');
                }
                that._cancelFullScreenTimer = null;
            },500);
            this.trigger('play');
    
        } else {
            this._exitFullWindow();
            this.trigger('cancelFullScreen');
            this.trigger('play');
        }
    
        return this;
    };
    
    /**
     * æ˜¯å¦å¤„äºŽå…¨å±
     *
     * @method getIsFullScreen
     * @return {Boolean} æ˜¯å¦ä¸ºå…¨å±
     */
    Player.prototype.getIsFullScreen = function() {
        return this.isFullScreen;
    };
    
    /**
     * èŽ·å–å·²ç»ç¼“å­˜çš„æ—¶é—´åŒºé—´
     *
     * @method getBuffered
     * @return {Array} æ—¶é—´åŒºé—´æ•°ç»„timeRanges
     */
    Player.prototype.getBuffered = function() {
        return this.tag.buffered;
    };
    
    //è®¾ç½®æ˜¯å¦å¯ç”¨toastä¿¡æ¯æç¤º
    Player.prototype.setToastEnabled = function(enabled) {
        //for flash
        //this._invoke('setToastEnabled');
    };
    
    //è®¾ç½®æ˜¯å¦æ˜¾ç¤ºloading
    Player.prototype.setLoadingInvisible = function() {
        //for flash
        //this_invoke('setLoadingInvisible');
    }
    
    Player.prototype.bindVideoEvent = function() {
        var tag = this.tag,
            that = this;
    
    
        //(1)å¼€å§‹loadæ•°æ®
        Event.on(tag, 'loadstart', function(e) {
            that.trigger('loadstart');
            if (debug_flag) {
                console.log('loadstart');
            }
        });
    
        //(2)åŠ è½½è§†é¢‘æ—¶é•¿
        Event.on(tag, 'durationchange', function(e) {
            that.trigger('durationchange');
            if (debug_flag) {
                console.log('durationchange');
            }
        });
    
    
        //(3)æˆåŠŸèŽ·å–èµ„æºé•¿åº¦
        Event.on(tag, 'loadedmetadata', function(e) {
            that.trigger('loadedmetadata');
            if (debug_flag) {
                console.log('loadedmetadata');
            }
        });
    
        //(4)å·²åŠ è½½å½“å‰å¸§,ä½†æ— è¶³å¤Ÿæ•°æ®æ’­æ”¾
        Event.on(tag, 'loadeddata', function(e) {
            that.trigger('loadeddata');
            if (debug_flag) {
                console.log('loadeddata');
            }
        });
    
        //(5)å®¢æˆ·ç«¯æ­£åœ¨è¯·æ±‚æ•°æ®
        Event.on(tag, 'progress', function(e) {
            that.trigger('progress');
            if (debug_flag) {
                console.log('progress');
            }
        });
    
        //(6)å¯ä»¥æ’­æ”¾æ•°æ®
        Event.on(tag, 'canplay', function(e) {
            var time = (new Date().getTime()) - that.readyTime;
            that.trigger('canplay', {
                loadtime: time
            });
            if (debug_flag) {
                console.log('canplay');
            }
        });
    
        //(7)å¯ä»¥æ— ç¼“å†²æ’­æ”¾æ•°æ®
        Event.on(tag, 'canplaythrough', function(e) {
            //if (that.cover/* && !UA.IS_IOS*/) {
            //if autoplay, canplaythrough delete cover; else play delete cover
            if (that.cover && that._options.autoplay) {
                Dom.css(that.cover, 'display', 'none');
                delete that.cover;
            }
            /* else */
            if (tag.style.display === 'none' && UA.IS_IOS) {
                setTimeout(function() {
                    Dom.css(tag, 'display', 'block');
                }, 100);
            }
    
            that.trigger('canplaythrough');
    
            if (debug_flag) {
                console.log('canplaythrough');
            }
        });
    
        //å¼€å§‹æ’­æ”¾è§¦å‘äº‹ä»¶
        Event.on(tag, 'play', function(e) {
            that.trigger('play');
            that.trigger('error_hide');
            var cover = document.querySelector('.prism-cover');
            Dom.css(cover, 'display', 'none');
            that.waiting = false;
            if (debug_flag) {
                console.log('play');
            }
        });
    
        //none
        Event.on(tag, 'play', function(e) {
            that.trigger('videoRender');
            if (debug_flag) {
                console.log('videoRender');
            }
            that.waiting = true;
        });
    
        //æš‚åœè§¦å‘äº‹ä»¶
        Event.on(tag, 'pause', function(e) {
            that.trigger('pause');
            that.waiting = false;
            if (debug_flag) {
                console.log('pause');
            }
        });
    
        //ç»“æŸ
        Event.on(tag, 'ended', function(e) {
            that.waiting = false;
            if (that._options.rePlay) {
                that.seek(0);
                that.tag.play();
            }
            that.trigger('ended');
            if (debug_flag) {
                console.log('ended');
            }
        });
    
        //å®¢æˆ·ç«¯å°è¯•èŽ·å–æ•°æ® none
        Event.on(tag, 'stalled', function(e) {
            that.trigger('stalled');
            if (debug_flag) {
                console.log('stalled');
            }
        });
    
        //ç¼“å†²ç­‰å¾…æ•°æ®
        Event.on(tag, 'waiting', function(e) {
            that.trigger('waiting');
    
            that.trigger('h5_loading_show');
            that.waiting = true;
            that._checkTimeoutHandle = setTimeout(function(){
                if(!that.waiting)
                    return;
                var paramData = {
                    statusValue: '4001',
                    mediaId: that._options.vid || "",
                    error_code: constants.ErrorCode.LoadingTimeout,
                    error_msg: 'ç¼“å†²æ•°æ®è¶…æ—¶ï¼Œè¯·å°è¯•é€€å‡ºé‡è¯•æˆ–åˆ·æ–°'
                    };
                    that.logError(paramData);
                    that.trigger('error', paramData);
    
            },that._options.loadDataTimeout*1000)
    
            if (debug_flag) {
                console.log('waiting');
            }
        });
    
        //æ’­æ”¾ä¸­
        Event.on(tag, 'playing', function(e) {
            that.trigger('playing');
            that.trigger('h5_loading_hide');
            that.waiting = false;
            if(that._checkTimeoutHandle)
            {
                clearTimeout(that._checkTimeoutHandle);
            }
            if (debug_flag) {
                console.log('playing');
            }
        }); 
    
        Event.on(tag, 'error', function(e) {
            var cover = document.querySelector('.prism-cover');
            Dom.css(cover, 'display', 'none');
            that.waiting = false; 
            var errcode = '',
                innerErrorMsg = e.srcElement.error.message,
                code,
                errcode = 'OTHER_ERR_MSG';
            if (e.srcElement.error.code) {
                code = e.srcElement.error.code;
                errcode = constants.VideoErrorCode[e.srcElement.error.code]
            };
            innerErrorMsg = errcode + " || "+ innerErrorMsg;
            if (that._options.isLive) {
                if (that._options.liveRetry) {
                    sleep(2000);
                    that.tag.load(that._options.source);
                    that.tag.play();
                } else {
                    var paramData = {
                        statusValue: '4004',
                        mediaId: 'ISLIVE',
                        error_code: errcode,
                        error_msg: 'æµè§ˆå™¨ä¸æ”¯æŒæ­¤è§†é¢‘æ’­æ”¾ï¼å…¶ä»–ç›´æ’­æ“ä½œ'
                    };
                    that.logError(paramData);
                    that.trigger('error', paramData);
                }
    
                that.trigger('liveStreamStop');
            } else {
                var msg = 'è§†é¢‘æ’­æ”¾å¤±è´¥!',
                    isSwitch = false,
                    notPopError = false;
                if(code < 4)
                {
                    msg = constants.VideoErrorCodeText[code];
                    isSwitch = true;
                }
                else
                {
                    if (that._eventState == constants.SUSPEND) {
                        msg = "è¯·æ±‚è§†é¢‘æ•°æ®ç»ˆæ­¢";
                        errcode = constants.ErrorCode.RequestDataError;
                        isSwitch = true;
                    } else if (that._eventState == constants.LOAD_START) {
                        msg = "åŠ è½½è§†é¢‘æ•°æ®é”™è¯¯";
                        if (that._options.source.indexOf('auth_key') > 0) {
                            msg = msg + "ï¼Œå¯èƒ½é‰´æƒè¿‡æœŸã€åŸŸåä¸åœ¨ç™½åå•æˆ–è¯·æ±‚è¢«æ‹¦æˆª";
                        }
                        errcode = constants.ErrorCode.StartLoadData;
                        isSwitch = true;
                    } else if (that._eventState == constants.LOADED_METADATA) {
                        msg = "æ’­æ”¾å‡ºé”™å•¦";
                        errcode = constants.ErrorCode.PlayingError;
                        isSwitch = true;
                    }
                }
                msg = msg + "ï¼Œè¯·å°è¯•é€€å‡ºé‡è¯•æˆ–åˆ·æ–°"
                if (that._options.source && (that._options.source.indexOf("flv") > 0 || that._options.source.indexOf("m3u8") > 0) && !UA.IS_MOBILE) {
                    msg = "h5ä¸æ”¯æŒæ­¤æ ¼å¼ï¼Œè¯·ä½¿ç”¨flashæ’­æ”¾å™¨";
                    errcode = constants.ErrorCode.FormatNotSupport;
                } else if (isSwitch && that._urls.length > 1 && that._retrySwitchUrlCount < 3) {
                    that.switchUrl();
                    notPopError = true;
                }
    
                var paramData = {
                    statusValue: '4001',
                    mediaId: (that._options.vid ? that._options.vid : ""),
                    error_code: errcode,
                    error_msg: innerErrorMsg,
                    display_msg: msg
                };
    
                that.logError(paramData);
    
                if (!notPopError)
                    that.trigger('error', paramData);
    
            }
        });
    
        //not exist now
        Event.on(tag, 'onM3u8Retry', function(e) {
            that.trigger('m3u8Retry');
            if (debug_flag) {
                console.log('m3u8Retry');
            }
        });
    
        //not exist now
        Event.on(tag, 'liveStreamStop', function(e) {
            that.trigger('liveStreamStop');
            if (debug_flag) {
                console.log('liveStreamStop');
            }
        });
    
        //å¯»æ‰¾ä¸­
        Event.on(tag, 'seeking', function(e) {
            that.trigger('seeking');
            if (debug_flag) {
                console.log('seeking');
            }
        });
    
        //å¯»æ‰¾å®Œæ¯•
        Event.on(tag, 'seeked', function(e) {
            that.trigger('seeked');
            if (debug_flag) {
                console.log('seeked');
            }
        });
    
        //æ’­æ”¾é€ŸçŽ‡æ”¹å˜
        Event.on(tag, 'ratechange', function(e) {
            that.trigger('ratechange');
            if (debug_flag) {
                console.log('ratechange');
            }
        });
    
        //æ’­æ”¾è¿‡ç¨‹è§¦å‘çš„äº‹ä»¶
        Event.on(tag, 'timeupdate', function(e) {
            //var currentTime = e.target.currentTime;
            //that.currentTime(currentTime);
            that.trigger('timeupdate');
            if (debug_flag) {
                console.log('timeupdate');
            }
        });
    
        //å…¨å±ä¿®æ”¹
        Event.on(tag, 'webkitfullscreenchange', function(e) {
            that.trigger('fullscreenchange');
            if (debug_flag) {
                console.log('fullscreenchange');
            }
        });
    
    
    
        this.on('requestFullScreen', function() {
            Dom.addClass(that.el(), 'prism-fullscreen');
            if (debug_flag) {
                console.log('request-fullscreen');
            }
        });
        this.on('cancelFullScreen', function() {
            Dom.removeClass(that.el(), 'prism-fullscreen');
            if (debug_flag) {
                console.log('cancel-fullscreen');
            }
        });
    
        //may not used
        Event.on(tag, 'suspend', function(e) {
            that.trigger('suspend');
            if (debug_flag) {
                console.log('sudpend');
            }
        });
    
        Event.on(tag, 'abort', function(e) {
            that.trigger('abort');
            if (debug_flag) {
                console.log('abort');
            }
        });
    
        Event.on(tag, 'volumechange', function(e) {
            that.trigger('volumechange');
            if (debug_flag) {
                console.log('volumechange');
            }
        });
    
        Event.on(tag, 'drag', function(e) {
            that.trigger('drag');
            if (debug_flag) {
                console.log('drag');
            }
        });
    
        Event.on(tag, 'dragstart', function(e) {
            that.trigger('dragstart');
            if (debug_flag) {
                console.log('dragstart');
            }
        });
    
        Event.on(tag, 'dragover', function(e) {
            that.trigger('dragover');
            if (debug_flag) {
                console.log('dragover');
            }
        });
    
    
        Event.on(tag, 'dragenter', function(e) {
            that.trigger('dragenter');
            if (debug_flag) {
                console.log('dragenter');
            }
        });
    
        Event.on(tag, 'dragleave', function(e) {
            that.trigger('dragleave');
            if (debug_flag) {
                console.log('dragleave');
            }
        });
    
        Event.on(tag, 'ondrag', function(e) {
            that.trigger('ondrag');
            if (debug_flag) {
                console.log('ondrag');
            }
        });
    
        Event.on(tag, 'ondragstart', function(e) {
            that.trigger('ondragstart');
            if (debug_flag) {
                console.log('ondragstart');
            }
        });
    
        Event.on(tag, 'ondragover', function(e) {
            that.trigger('ondragover');
            if (debug_flag) {
                console.log('ondragover');
            }
        });
    
        Event.on(tag, 'ondragenter', function(e) {
            that.trigger('ondragenter');
            if (debug_flag) {
                console.log('ondragenter');
            }
        });
    
        Event.on(tag, 'ondragleave', function(e) {
            that.trigger('ondragleave');
            if (debug_flag) {
                console.log('ondragleave');
            }
        });
    
        Event.on(tag, 'drop', function(e) {
            that.trigger('drop');
            if (debug_flag) {
                console.log('drop');
            }
        });
    
        Event.on(tag, 'dragend', function(e) {
            that.trigger('dragend');
            if (debug_flag) {
                console.log('dragend');
            }
        });
    
        Event.on(tag, 'onscroll', function(e) {
            that.trigger('onscroll');
            if (debug_flag) {
                console.log('onscroll');
            }
        });
    
        this.on('error',function(e){
            var paramData = e.paramData;
            var prismLoading = document.querySelector("div.prism-loading");
            if (prismLoading) {
              Dom.css(prismLoading, 'display', 'none');
            };
    
            var prismCuror = document.querySelector("div.prism-progress-cursor");
            if (prismCuror) {
              Dom.css(prismCuror, 'display', 'none');
            };
            paramData = paramData || {};
            if (that._monitor) {
              paramData.uuid = that._monitor._getUuid();
              paramData.requestId = that._monitor.requestId;
              paramData.cdnIp = that._monitor._userNetInfo.cdnIp;
              paramData.localIp = that._monitor._userNetInfo.localIp;
            }
    
            that._isError = true;
    
            that.trigger('error_show',paramData);
        });
    
        var requestFullScreen = __supportFullscreen;
        if (requestFullScreen) {
            Event.on(document, requestFullScreen.eventName, function(e) {
    
                that.isFullScreen = document[requestFullScreen.isFullScreen];
                that.isFullScreenChanged = true;
                if (that.isFullScreen === true) {
                    that.trigger('requestFullScreen');
                }
                else
                {
                    that.trigger('cancelFullScreen');
                }
                
            });
        }
    
    }
    
    
    Player.prototype._checkSupportVideoType = function() {
        if(!this.tag.canPlayType || !this._options.source || !UA.IS_MOBILE)
        {
            return "";
        }
        var source = this._options.source;
        var msg = "";
        if(source.indexOf('m3u8')>0)
        {
            if(this.tag.canPlayType('application/x-mpegURL')=="")
            {
                msg = "æµè§ˆå™¨ä¸æ”¯æŒm3u8è§†é¢‘æ’­æ”¾";
            }
        }
        else if(source.indexOf('mp4')>0)
        {
            if(this.tag.canPlayType('video/mp4')=="")
            {
                msg = "æµè§ˆå™¨ä¸æ”¯æŒmp4è§†é¢‘æ’­æ”¾";
            }
        }
        if(msg)
        {
            var paramData = {
                statusValue: 4001,
                mediaId: this._options.vid ? this._options.vid : "",
                error_code: constants.ErrorCode.FormatNotSupport,
                error_msg: msg,
                display_msg: msg
              };
            this.logError(paramData);
            this.trigger('error', paramData);
        }
        return msg;
    }
    
    Player.prototype.logError = function(paramData) {
        if (!paramData) {
            paramData = {};
        }
        paramData.vt = Math.floor(this.getCurrentTime() * 1000);
        paramData.roe = this._eventState;
        this.log('ERROR', paramData);
    }
    
    Player.prototype.log = function(logType, logInfo) {
        var playerVid = 0,
            playerFrom = 0;
        if (this._monitor) {
            if (this._options) {
                playerVid = this._options.vid || '0';
                playerFrom = this._options.from || '0';
            }
            this._monitor.updateVideoInfo({
                video_id: playerVid,
                album_id: 0,
                from: playerFrom
            });
    
            this._monitor._log(logType, logInfo);
        }
    }
    
    module.exports = Player;
    
    },{"../lib/constants.js":42,"../lib/dom":45,"../lib/event":46,"../lib/io":48,"../lib/object":50,"../lib/ua":52,"../monitor/monitor":55,"../ui/component":62,"../ui/component/error-display":65,"../ui/exports":74,"./saas/authkeyexpiredhandle.js":58,"./saas/signature":59,"./saas/vod":61,"crypto-js":11}],58:[function(require,module,exports){
    var constants = require('../../lib/constants');
    var oo = require('../../lib/oo');
    
    var AuthkeyExpiredHandle = oo.extend({
       init: function(player) {
          this.player = player;
          this.tickhandle = null;
       }
    });
    
    AuthkeyExpiredHandle.prototype.tick = function(timeout,callback) 
    {
        var that = this;
        this.tickhandle = setTimeout(function(){
          if(that.player)
          {
            that.player.trigger(constants.AuthKeyExpiredEvent);
          }
          if(callback)
          {
            callback();
          }
        }, timeout*1000);
    }
    
    AuthkeyExpiredHandle.prototype.clearTick = function(tickhandle)
    {
      if(this.tickhandle)
      {
        clearTimeout(this.tickhandle);
      }
    }
    
    module.exports = AuthkeyExpiredHandle;
    
    },{"../../lib/constants":42,"../../lib/oo":51}],59:[function(require,module,exports){
    var CryptoJS = require("crypto-js");
    var jsrsasign = require('jsrsasign');
    
    module.exports.randomUUID = function() {
      var s = [];
      var hexDigits = "0123456789abcdef";
      for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
      }
      s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
      s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
      s[8] = s[13] = s[18] = s[23] = "-";
    
      var uuid = s.join("");
      return uuid;
    }
    
    //è¿”å›žutcæ—¶é—´
    module.exports.returnUTCDate = function() {
      var date = new Date();
      var y = date.getUTCFullYear();
      var m = date.getUTCMonth();
      var d = date.getUTCDate();
      var h = date.getUTCHours();
      var M = date.getUTCMinutes();
      var s = date.getUTCSeconds();
      var mms = date.getUTCMilliseconds();
      var utc = Date.UTC(y, m, d, h, M, s, mms);
      return utc;
    }
    
    //utf8
    module.exports.AliyunEncodeURI = function(input) {
      var output = encodeURIComponent(input);
      //(+)  --> %2B
      //(*)  --> %2A
      //%7E --> ~
      output = output.replace("+", "%2B");
      output = output.replace("*", "%2A");
      output = output.replace("%7E", "~");
    
      return output;
    }
    
    //å…¬å…±æ–¹æ³• æ‹¼æŽ¥å­—ç¬¦ä¸²çš„
    module.exports.makesort = function(ary, str1, str2) {
      if (!ary) {
        throw new Error('PrismPlayer Error: vid should not be null!');
      };
      var pbugramsdic = Object.keys(ary).sort(); //key
      var outputPub = "";
      for (var key in pbugramsdic) {
        if (outputPub == "") {
          outputPub = pbugramsdic[key] + str1 + ary[pbugramsdic[key]];
        } else {
          outputPub += str2 + pbugramsdic[key] + str1 + ary[pbugramsdic[key]];
        }
      }
      return outputPub;
    }
    
    //æ‹¼æŽ¥å­—ç¬¦ä¸² åšutf8
    module.exports.makeUTF8sort = function(ary, str1, str2) {
      if (!ary) {
        throw new Error('PrismPlayer Error: vid should not be null!');
      };
      var pbugramsdic = Object.keys(ary).sort(); //key
    
      var outputPub = "";
      for (var key in pbugramsdic) {
    
        var a3 = module.exports.AliyunEncodeURI(pbugramsdic[key]);
        var b3 = module.exports.AliyunEncodeURI(ary[pbugramsdic[key]]);
    
        if (outputPub == "") {
    
          outputPub = a3 + str1 + b3;
        } else {
          outputPub += str2 + a3 + str1 + b3;
        }
      }
      return outputPub;
    }
    
    //signature
    module.exports.makeChangeSiga = function(obj, secStr) {
      if (!obj) {
        throw new Error('PrismPlayer Error: vid should not be null!');
      };
      return CryptoJS.HmacSHA1('GET&' + module.exports.AliyunEncodeURI('/') + '&' + module.exports.AliyunEncodeURI(module.exports.makeUTF8sort(obj, '=', '&')), secStr + '&').toString(CryptoJS.enc.Base64);
    }
    
    module.exports.ISODateString = function(d) {
      function pad(n) {
        return n < 10 ? '0' + n : n
      }
      return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + 'Z'
    }
    
    module.exports.encPlayAuth = function(playauth) {
      var playauth = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(playauth));
      if (!playauth) {
        throw new Error('playuthå‚æ•°è§£æžä¸ºç©º');
      }
      return JSON.parse(playauth);
    }
    
    module.exports.encRsa = function() {
    
    }
    
    },{"crypto-js":11,"jsrsasign":39}],60:[function(require,module,exports){
    module.exports.createError = function(msg, code) {
      return {
        requestId: "",
        code: code || "",
        message: msg
      }
    }
    
    },{}],61:[function(require,module,exports){
    var io = require('../../lib/io');
    var constants = require('../../lib/constants');
    var signature = require('./signature');
    var util = require('./util');
    var CryptoJS = require("crypto-js");
    
    function getDataByAuthInfo(parame, callback, error) {
      var timemts = signature.returnUTCDate();
      var randNum = signature.randomUUID();
      var SignatureNonceNum = signature.randomUUID();
      // var Timestampmts = ISODateString(new Date());
      var SignatureMethodT = 'HMAC-SHA1';
      var newAry = {
        'AccessKeyId': parame.accessId,
        'Action': 'PlayInfo',
        'MediaId': parame.vid,
        'Formats': 'mp4', //|m3u8|flv
        'AuthInfo': parame.authInfo,
        'AuthTimeout': constants.AuthKeyExpired,
        'Rand': randNum,
        'SecurityToken': parame.stsToken,
        'PlayDomain': parame.playDomain,
        'Format': 'JSON',
        'Version': '2014-06-18',
        'SignatureMethod': SignatureMethodT,
        // 'Timestamp': Timestampmts,
        'SignatureVersion': '1.0',
        'SignatureNonce': SignatureNonceNum
      }
    
      var pbugramsdic = signature.makeUTF8sort(newAry, '=', '&') + '&Signature=' + signature.AliyunEncodeURI(signature.makeChangeSiga(newAry, parame.accessSecret));
    
      var httpUrlend = 'https://mts.' + parame.domainRegion + '.aliyuncs.com/?' + pbugramsdic;
    
      io.get(httpUrlend, function(data) {
          if (data) {
            var jsonData = JSON.parse(data);
            var playInfoAry = jsonData.PlayInfoList.PlayInfo;
            urls = objectPlayerMessageSort(playInfoAry);
            if (callback) {
              callback({
                requestId: jsonData.RequestId,
                urls: urls
              });
            }
          } else {
            if (error) {
              error(util.createError("MSTèŽ·å–å–æ•°å¤±è´¥"));
            }
          }
        },
        function(errorText) {
          if (error) {
            var arg = JSON.parse(errorText);
            error(arg);
          }
        })
    
    }
    
    function objectPlayerMessageSort(arrobj) {
      // body...
      var m3u8Urls = [],
        mp4Urls = [],
        previous = -1;
      
      for (var i = arrobj.length - 1; i >= 0; i--) {
        var b = arrobj[i];
        b.width = b.width*1;
        b.height = b.height *1;
        //å®½é«˜é—®é¢˜ï¼Œå¯èƒ½å‡ºçŽ° å®½<=é«˜ï¼Œç”±äºŽæ—‹è½¬å¼•èµ·çš„
        if (b.width <= b.height) {
          b.width = b.height;
        };
    
        if (b.format == 'mp4') {
          mp4Urls.push(b);
        } else {
          m3u8Urls.push(b);
        }
      }
    
    
      if (mp4Urls.length > 0) {
        mp4Urls.sort(function(a, b) {
          var s = parseInt(a.width);
          var t = parseInt(b.width);
          if (s < t) return -1;
          if (s > t) return 1;
        });
        var length = mp4Urls.length;
        for (var i = 0; i <length; i++) {
          var item = mp4Urls[i];
          var text = constants.VideoLevels[item.width];
          if(typeof item.width == 'undefined')
          {
            text = 'æœªçŸ¥';
          }
          else if(typeof text == 'undefined')
          {
            text = item.width;
          }
          else if(previous == item.width  )
          {
            text = text + item.width;
          } 
          item.desc = text;
    
          previous = item.width;
        }
    
        return mp4Urls;
    
      } else {
        m3u8Urls.sort(function(a, b) {
          var s = parseInt(a.width);
          var t = parseInt(b.width);
          if (s < t) return -1;
          if (s > t) return 1;
        });
        return m3u8Urls;
      };
    }
    
    module.exports.getDataByAuthInfo = getDataByAuthInfo;
    
    },{"../../lib/constants":42,"../../lib/io":48,"./signature":59,"./util":60,"crypto-js":11}],62:[function(require,module,exports){
    var oo = require('../lib/oo');
    var Data = require('../lib/data');
    var _ = require('../lib/object');
    var Dom = require('../lib/dom');
    var Event = require('../lib/event');
    var Fn = require('../lib/function');
    var Layout = require('../lib/layout');
    
    var Component = oo.extend({
      init: function(player, options) {
        var that = this;
    
        this._player = player;
        this._eventState = "";
    
        // Make a copy of prototype.options_ to protect against overriding global defaults
        this._options = _.copy(options);
        this._el = this.createEl();
        this._id = player.id() + '_component_' + Data.guid();
    
        this._children = [];
        this._childIndex = {};
    
        // åªæœ‰ç»„ä»¶çœŸæ­£è¢«æ·»åŠ åˆ°domæ ‘ä¸­åŽå†åŒæ­¥uiã€ç»‘å®šäº‹ä»¶
        // ä»Žè€Œé¿å…èŽ·å–ä¸åˆ°domå…ƒç´ 
        this._player.on('uiH5Ready', function() {
          that.renderUI();
          that.syncUI();
          that.bindEvent();
        });
      }
    });
    
    /**
     * æ¸²æŸ“ui
     */
    Component.prototype.renderUI = function() {
      // æ ¹æ®uiç»„ä»¶çš„é…ç½®æ¸²æŸ“layout
      Layout.render(this.el(), this.options());
      // è®¾ç½®id
      this.el().id = this.id();
    };
    
    /**
     * åŒæ­¥uiçŠ¶æ€ï¼Œå­ç±»ä¸­å®žçŽ°
     */
    Component.prototype.syncUI = function() {};
    
    /**
     * ç»‘å®šäº‹ä»¶ï¼Œå­ç±»ä¸­å®žçŽ°
     */
    Component.prototype.bindEvent = function() {};
    
    /**
     * ç”Ÿæˆcompoentçš„domå…ƒç´ 
     *
     */
    Component.prototype.createEl = function(tagName, attributes) {
      return Dom.createEl(tagName, attributes);
    };
    
    /**
     * èŽ·å–componentçš„æ‰€æœ‰é…ç½®é¡¹
     *
     */
    
    Component.prototype.options = function(obj) {
      if (obj === undefined) return this._options;
    
      return this._options = _.merge(this._options, obj);
    };
    
    /**
     * èŽ·å–componetçš„domå…ƒç´ 
     *
     */
    Component.prototype.el = function() {
      return this._el;
    };
    
    
    Component.prototype._contentEl;
    
    
    Component.prototype.player = function() {
      return this._player;
    }
    
    /**
     * Return the component's DOM element for embedding content.
     * Will either be el_ or a new element defined in createEl.
     *
     * @return {Element}
     */
    Component.prototype.contentEl = function() {
      return this._contentEl || this._el;
    };
    
    /**
     * è®¾ç½®å…ƒç´ id
     *
     */
    
    Component.prototype._id;
    
    /**
     * èŽ·å–å…ƒç´ id
     *
     */
    Component.prototype.id = function() {
      return this._id;
    };
    
    /* å­å…ƒç´ ç›¸å…³æ“ä½œ
    ============================================================================= */
    
    /**
     * æ·»åŠ æ‰€æœ‰å­å…ƒç´ 
     *
     */
    Component.prototype.addChild = function(child, options) {
      var component, componentClass, componentName, componentId;
    
      // å¦‚æžœchildæ˜¯ä¸€ä¸ªå­—ç¬¦ä¸²
      if (typeof child === 'string') {
        if (!this._player.UI[child]) return;
        component = new this._player.UI[child](this._player, options);
      } else {
        // childæ˜¯ä¸€ä¸ªcompnentå¯¹è±¡
        component = child;
      }
    
      //
      this._children.push(component);
    
      if (typeof component.id === 'function') {
        this._childIndex[component.id()] = component;
      }
    
      // æŠŠå­å…ƒç´ çš„domå…ƒç´ æ’å…¥çˆ¶å…ƒç´ ä¸­
      if (typeof component['el'] === 'function' && component['el']()) {
        var ele = component['el']();
        ele.id =  component['id']();
        this.contentEl().appendChild(ele);
      }
    
      // è¿”å›žæ·»åŠ çš„å­å…ƒç´ 
      return component;
    };
    /**
     * åˆ é™¤æŒ‡å®šçš„å­å…ƒç´ 
     *
     */
    Component.prototype.removeChild = function(component) {
    
      if (!component || !this._children) return;
    
      var childFound = false;
      for (var i = this._children.length - 1; i >= 0; i--) {
        if (this._children[i] === component) {
          childFound = true;
          this._children.splice(i, 1);
          break;
        }
      }
    
      if (!childFound) return;
    
      this._childIndex[component.id] = null;
    
      var compEl = component.el();
      if (compEl && compEl.parentNode === this.contentEl()) {
        this.contentEl().removeChild(component.el());
      }
    };
    /**
     * åˆå§‹åŒ–æ‰€æœ‰å­å…ƒç´ 
     *
     */
    Component.prototype.initChildren = function() {
      var parent, children, child, name, opts;
    
      parent = this;
      children = this.options()['children'];
    
      if (children) {
        // å¦‚æžœå¤šä¸ªå­å…ƒç´ æ˜¯ä¸€ä¸ªæ•°ç»„
        if (_.isArray(children)) {
          for (var i = 0; i < children.length; i++) {
            child = children[i];
    
            if (typeof child == 'string') {
              name = child;
              opts = {};
            } else {
              name = child.name;
              opts = child;
            }
    
            parent.addChild(name, opts);
          }
        } else {
          _.each(children, function(name, opts) {
            // Allow for disabling default components
            // e.g. vjs.options['children']['posterImage'] = false
            if (opts === false) return;
    
            parent.addChild(name, opts);
          });
        }
      }
    };
    
    
    /* äº‹ä»¶æ“ä½œ
    ============================================================================= */
    
    /**
     * åœ¨componentä¸Šçš„çš„domå…ƒç´ ä¸Šæ·»åŠ ä¸€ä¸ªäº‹ä»¶ç›‘å¬å™¨
     *
     *     var myFunc = function(){
     *       var myPlayer = this;
     *       // Do something when the event is fired
     *     };
     *
     *     myPlayer.on("eventName", myFunc);
     *
     * The context will be the component.
     *
     * @param  {String}   type The event type e.g. 'click'
     * @param  {Function} fn   The event listener
     * @return {Component} self
     */
    Component.prototype.on = function(type, fn) {
    
      Event.on(this._el, type, Fn.bind(this, fn));
      return this;
    };
    
    /**
     * ä»Žcomponentä¸Šåˆ é™¤æŒ‡å®šäº‹ä»¶çš„ç›‘å¬å™¨
     *
     *     myComponent.off("eventName", myFunc);
     *
     * @param  {String=}   type Event type. Without type it will remove all listeners.
     * @param  {Function=} fn   Event listener. Without fn it will remove all listeners for a type.
     * @return {Component}
     */
    Component.prototype.off = function(type, fn) {
      Event.off(this._el, type, fn);
      return this;
    };
    
    /**
     * åœ¨ç»„ä»¶çš„å…ƒç´ ä¸Šæ·»åŠ ä¸€ä¸ªåªæ‰§è¡Œä¸€æ¬¡çš„äº‹ä»¶ç›‘å¬å™¨
     *
     * @param  {String}   type Event type
     * @param  {Function} fn   Event listener
     * @return {Component}
     */
    Component.prototype.one = function(type, fn) {
      Event.one(this._el, type, Fn.bind(this, fn));
      return this;
    };
    
    /**
     * åœ¨ç»„ä»¶çš„å…ƒç´ ä¸Šè§¦å‘ä¸€ä¸ªäº‹ä»¶
     */
    Component.prototype.trigger = function(event, paramData) {
      //
      if (paramData) {
        this._el.paramData = paramData;
      }
    
      this._eventState = event;
    
      Event.trigger(this._el, event);
      return this;
    };
    
    Component.prototype.off = function(event) {
      //
       Event.off(this._el, event);
      return this;
    };
    
    /* ç»„ä»¶å±•çŽ°
    ============================================================================= */
    
    /**
     * åœ¨componentä¸Šæ·»åŠ æŒ‡å®šçš„className
     *
     * @param {String} classToAdd Classname to add
     * @return {Component}
     */
    Component.prototype.addClass = function(classToAdd) {
      Dom.addClass(this._el, classToAdd);
      return this;
    };
    
    /**
     * ä»Žcomponentåˆ é™¤æŒ‡å®šçš„className
     *
     * @param {String} classToRemove Classname to remove
     * @return {Component}
     */
    Component.prototype.removeClass = function(classToRemove) {
      Dom.removeClass(this._el, classToRemove);
      return this;
    };
    
    /**
     * æ˜¾ç¤ºç»„ä»¶
     *
     * @return {Component}
     */
    Component.prototype.show = function() {
      this._el.style.display = 'block';
      return this;
    };
    
    /**
     * éšè—ç»„ä»¶
     *
     * @return {Component}
     */
    Component.prototype.hide = function() {
      this._el.style.display = 'none';
      return this;
    };
    
    /**
     * é”€æ¯component
     *
     * @return
     */
    
    Component.prototype.destroy = function() {
      this.trigger({
        type: 'destroy',
        'bubbles': false
      });
    
      // é”€æ¯æ‰€æœ‰å­å…ƒç´ 
      if (this._children) {
        for (var i = this._children.length - 1; i >= 0; i--) {
          if (this._children[i].destroy) {
            this._children[i].destroy();
          }
        }
      }
    
      // åˆ é™¤æ‰€æœ‰childrenå¼•ç”¨
      this.children_ = null;
      this.childIndex_ = null;
    
      // åˆ é™¤æ‰€æœ‰äº‹ä»¶ç›‘å¬å™¨.
      this.off();
    
      // ä»Ždomä¸­åˆ é™¤æ‰€æœ‰å…ƒç´ 
      if (this._el.parentNode) {
        this._el.parentNode.removeChild(this._el);
      }
      // åˆ é™¤æ‰€æœ‰dataå¼•ç”¨
      Data.removeData(this._el);
      this._el = null;
    };
    
    module.exports = Component;
    
    },{"../lib/data":44,"../lib/dom":45,"../lib/event":46,"../lib/function":47,"../lib/layout":49,"../lib/object":50,"../lib/oo":51}],63:[function(require,module,exports){
    /**
     * @fileoverview å¤§æ’­æ”¾æŒ‰é’®
     */
    var Component = require('../component');
    var Dom = require('../../lib/dom');
    
    var BigPlayButton = Component.extend({
        init: function  (player, options) {
            var that = this;
            Component.call(this, player, options);
            this.addClass(options.className || 'prism-big-play-btn');
        },
        
        bindEvent: function() {
            var that = this;
    
            this._player.on('play', function(){
                that.addClass('playing');
                Dom.css(that.el(), 'display', 'none');
            });
    
            this._player.on('pause', function(){
                that.removeClass('playing');
                Dom.css(that.el(), 'display', 'block');
            });
    
            this.on('click', function() {
                if (that._player.paused()) {
                    that._player.play();
                    Dom.css(that.el(), 'display', 'none');
                }
            });
    
            this._player.on('play_btn_show', function(){
               that.removeClass('playing');
               Dom.css(that.el(), 'display', 'block');
            });
        }
    });
    
    module.exports = BigPlayButton;
    
    },{"../../lib/dom":45,"../component":62}],64:[function(require,module,exports){
    /**
     * @fileoverview æŽ§åˆ¶æ¡ç»„ä»¶
    */
    var Component = require('../component');
    
    var ControlBar = Component.extend({
        init: function(player,options) {
            Component.call(this, player, options);
            this.addClass(options.className || 'prism-controlbar');
            this.initChildren();
            this.onEvent();
        },
        createEl: function() {
            var el = Component.prototype.createEl.call(this);
            el.innerHTML = '<div class="prism-controlbar-bg"></div>'
            return el;
        },
        onEvent: function(){
            var player = this.player(),
            option = player.options();
            var that = this;
            
            this.timer = null;
            var controlBarVisibility = option.controlBarVisibility;
            if(option.controlBarForOver == true)
            {
              controlBarVisibility = 'hover';
            }
            if(controlBarVisibility == 'hover')
            {
                that.hide();
                player.on('mouseover', function(){
                    that._show();
                })
    
                player.on('mouseout', function(){
                    that.hide();
                    player.trigger('hideBar');
                })
            }
            else if(controlBarVisibility == 'click')
            {
                player.on('click',function(e){
                    if(!player._isError)
                    {
                        e.preventDefault();
                        e.stopPropagation();
                        that._show();
                        that._hide();
                    }
                });
                player.on('ready',function(){
                    that._hide();
                });
                this.on('touchstart', function() {
                    that._show();
                });
                this.on('touchmove', function() {
                    that._show();
                });
                this.on('touchend', function() {
                    that._hide();
                });
            }
            else
            {
               that._show();
            }
        },
        _show: function() {
            this.show();
            this._player.trigger('showBar');
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
            }
        },
        _hide: function(){
            var that = this;
            var player = this.player();
            var curOptions = player.options();
            var hideTime = curOptions.showBarTime;
            this.timer = setTimeout(function(){
                that.hide();
                that._player.trigger('hideBar');
            }, hideTime);
        }
    });
    
    module.exports = ControlBar;
    
    },{"../component":62}],65:[function(require,module,exports){
    /**
     * @fileoverview é”™è¯¯æ˜¾ç¤º
     */
    var Component = require('../component');
    var Util = require('../../lib/util');
    var Dom = require('../../lib/dom');
    var Event = require('../../lib/event');
    var UA = require('../../lib/ua');
    
    var ErrorDisplay = Component.extend({
      init: function(player, options) {
        var that = this;
        Component.call(this, player, options);
        this.className = options.className ? options.className : 'prism-ErrorMessage';
        this.addClass(this.className);
      },
    
      createEl: function() {
        var el = Component.prototype.createEl.call(this, 'div');
        el.innerHTML = "<div class='prism-error-content'><p></p></div><div class='prism-error-operation'><a class='prism-button-refresh' type='button' value='åˆ·æ–°'></a>"+
                       "<a class='prism-button prism-button-orange'  target='_blank'>è¯Šæ–­</a></div>"+
                       "<div class='prism-detect-info prism-center'><p class='errorCode'><span class='info-label'>codeï¼š</span><span class='info-content'></span></p>"+
                       "<p class='vid'><span class='info-label'>vidï¼š</span><span class='info-content'></span></p>"+
                       "<p class='uuid'><span class='info-label'>uuidï¼š</span><span class='info-content'></span></p>"+
                       "<p class='requestId'><span class='info-label'>requestIdï¼š</span><span class='info-content'></span></p>"+
                       "<p class='dateTime'><span class='info-label'>æ’­æ”¾æ—¶é—´ï¼š</span><span class='info-content'></span></p></div>";
    
        return el;
      },
    
      bindEvent: function() {
        var that = this;
        that._player.on('error_show', function(e){
          var monitorInfo = that._player.getMonitorInfo();
          that._show(e, monitorInfo);
        });
        that._player.on('error_hide', that._hide);
        var ele = document.querySelector('.prism-ErrorMessage .prism-error-operation .prism-button-refresh');
        Event.on(ele,'click',function(){
          location.reload(true);
        });
        if(UA.IS_MOBILE)
        {
          var ele = document.querySelector('.prism-ErrorMessage .prism-detect-info');
           Dom.addClass(ele,'prism-width90');
        }
      },
    
      _show: function(e,monitorInfo) {
        var errorData = e.paramData,
            vid = "",
            source = "";
          if(errorData.mediaId)
          {
            vid = errorData.mediaId;
          }
          if(monitorInfo.vu)
          {
            source = decodeURIComponent(monitorInfo.vu) ;
          }
        
        var ele = document.querySelector('.prism-ErrorMessage .prism-error-operation .prism-button-orange'),
        url = 'http://player.alicdn.com/detection.html?vid='+vid + "&source="+ source+
              "&pd="+monitorInfo.pd+"&vt="+monitorInfo.vt+"&tt="+monitorInfo.tt+"&uuid="+monitorInfo.uuid+"&av="+monitorInfo.av+
              "&bi="+monitorInfo.bi +"&md="+monitorInfo.md+"&vu="+source;
        // url = 'http://localhost:9030/build/detection/detection.html?vid='+vid + "&source="+ source+
        //       "&pd="+monitorInfo.pd+"&vt="+monitorInfo.vt+"&tt="+monitorInfo.tt+"&uuid="+monitorInfo.uuid+"&av="+monitorInfo.av+
        //       "&bi="+monitorInfo.bi +"&md="+monitorInfo.md;
    
        ele.href = url;
        var message = errorData.display_msg || errorData.error_msg;
        document.querySelector('.prism-ErrorMessage .prism-error-content p').innerText = message;
        document.querySelector('.prism-ErrorMessage .prism-detect-info .errorCode .info-content').innerText = errorData.error_code;
        document.querySelector('.prism-ErrorMessage .prism-detect-info .vid .info-content').innerText = errorData.mediaId;
        document.querySelector('.prism-ErrorMessage .prism-detect-info .uuid .info-content').innerText = errorData.uuid;
        document.querySelector('.prism-ErrorMessage .prism-detect-info .requestId .info-content').innerText = errorData.requestId;
        document.querySelector('.prism-ErrorMessage .prism-detect-info .dateTime .info-content').innerText = Util.formatDate(new Date(),'yyyy-MM-dd HH:mm:ss');
        var element = document.querySelector('.prism-ErrorMessage');
        Dom.css(element, 'display', 'block');
      },
    
      _hide: function() {
         var element = document.querySelector('.prism-ErrorMessage');
        Dom.css(element, 'display', 'none');
      }
    });
    
    module.exports = ErrorDisplay;
    
    },{"../../lib/dom":45,"../../lib/event":46,"../../lib/ua":52,"../../lib/util":54,"../component":62}],66:[function(require,module,exports){
    /**
     * @fileoverview å…¨å±æŒ‰é’®
     */
    var Component = require('../component');
    
    var FullScreenButton = Component.extend({
        init: function  (player,options) {
            var that = this;
            Component.call(this, player, options);
            this.addClass(options.className || 'prism-fullscreen-btn');
        },
    
        bindEvent: function() {
            var that = this;
    
            this._player.on('requestFullScreen', function() {
                that.addClass('fullscreen');
            });
    
            this._player.on('cancelFullScreen', function() {
                that.removeClass('fullscreen');
            });
    
            this.on('click', function() {
                //alert("click_full_status:" + this._player.getIsFullScreen());
                if (!this._player.getIsFullScreen()) {
                    this._player.requestFullScreen();	
                } else {
                    this._player.cancelFullScreen();
                }
            });
        }
    });
    
    module.exports = FullScreenButton;
    
    },{"../component":62}],67:[function(require,module,exports){
    /**
     * Created by yuyingjie on 2017/3/24.
     */
    "use strict";
    /**
     * @fileoverview å¤§æ’­æ”¾æŒ‰é’®
     */
    var Component = require('../component');
    var Dom = require('../../lib/dom');
    
    var H5_Loading = Component.extend({
      init: function (player, options) {
        var that = this;
        Component.call(this, player, options);
        this.addClass(options.className || 'prism-hide');
      },
    
      createEl: function () {
        var el = Component.prototype.createEl.call(this, 'div');
        el.innerHTML = '<div class="circle"></div> <div class="circle1"></div>';
        return el;
      },
      _loading_hide: function (e) {
        var that = this,
          loadingNode = document.querySelector('#' + that.id() + ' .prism-loading');
        if (loadingNode) {
          loadingNode.className = "prism-hide";
        }
      },
      _loading_show: function (e) {
        var that = this,
          loadingNode = document.querySelector('#' + that.id() + ' .prism-hide');
        if (loadingNode) {
          loadingNode.className = "prism-loading";
        }
      },
      bindEvent: function () {
        var that = this;
        that._player.on('h5_loading_show', that._loading_show);
        that._player.on('h5_loading_hide', that._loading_hide);
      }
    });
    
    module.exports = H5_Loading;
    
    },{"../../lib/dom":45,"../component":62}],68:[function(require,module,exports){
    /**
     * @fileoverview ç›´æ’­çŠ¶æ€ icon
     */
    var Component = require('../component');
    var Util = require('../../lib/util');
    
    var LiveDisplay = Component.extend({
        init: function  (player,options) {
            var that = this;
            Component.call(this, player, options);
    
            this.className = options.className ? options.className : 'prism-live-display';
            this.addClass(this.className);
        }
    });
    
    module.exports = LiveDisplay;
    },{"../../lib/util":54,"../component":62}],69:[function(require,module,exports){
    /**
     * @fileoverview æ’­æ”¾æŒ‰é’®
     */
    var Component = require('../component');
    
    var PlayButton = Component.extend({
        init: function  (player, options) {
            var that = this;
            Component.call(this, player, options);
            this.addClass(options.className || 'prism-play-btn');
        },
        
        bindEvent: function() {
            var that = this;
    
            this._player.on('play', function(){
                that.addClass('playing');
            });
            
            this._player.on('pause', function(){
                that.removeClass('playing');
            });
    
            this.on('click', function() {
                //alert("click_play:" + that._player.paused())
                if (that._player.paused()) {
                    that._player.play();
                    that.addClass('playing');
                } else {
                    that._player.pause();
                    that.removeClass('playing');
                }
            });
        }
    });
    
    module.exports = PlayButton;
    
    },{"../component":62}],70:[function(require,module,exports){
    /**
     * @fileoverview è¿›åº¦æ¡
     */
    var Component = require('../component');
    var Dom = require('../../lib/dom');
    var Event = require('../../lib/event');
    var UA = require('../../lib/ua');
    var Fn = require('../../lib/function');
    
    var Progress = Component.extend({
        init: function (player, options) {
            var that = this;
            Component.call(this, player, options);
    
            this.className = options.className ? options.className : 'prism-progress';
            this.addClass(this.className);
        },
    
        createEl: function() {
            var el = Component.prototype.createEl.call(this);
            el.innerHTML = '<div class="prism-progress-loaded"></div>'
                         + '<div class="prism-progress-played"></div>'
                            + '<div class="prism-progress-cursor"></div>';
            return el;
        },
    
        bindEvent: function() {
            var that = this;
            
            this.loadedNode = document.querySelector('#' + this.id() + ' .prism-progress-loaded');
            this.playedNode = document.querySelector('#' + this.id() + ' .prism-progress-played');
            this.cursorNode = document.querySelector('#' + this.id() + ' .prism-progress-cursor');
            this.controlNode = document.getElementsByClassName("prism-controlbar")[0];
    
            Event.on(this.cursorNode, 'mousedown', function(e) {that._onMouseDown(e);});
            Event.on(this.cursorNode, 'touchstart', function(e) {that._onMouseDown(e);});
            Event.on(this._el, 'click', function(e) {that._onMouseClick(e);});
            this._player.on('hideProgress', function(e) {that._hideProgress(e);});
            this._player.on('cancelHideProgress', function(e) {that._cancelHideProgress(e);});
            
            this.bindTimeupdate = Fn.bind(this, this._onTimeupdate);
            this._player.on('timeupdate', this.bindTimeupdate);
                
            // ipadä¸‹æ’­æ”¾æ— æ³•è§¦å‘progressäº‹ä»¶ï¼ŒåŽŸå› å¾…æŸ¥
            if (UA.IS_IPAD) {
                this.interval = setInterval(function() {
                    that._onProgress();
                }, 500);
            } else {
                this._player.on('progress', function() {that._onProgress();});
            }
        },
    
        //å–æ¶ˆæŽ§åˆ¶è¿›åº¦æ¡
        _hideProgress: function(e) {
            var that = this;
            Event.off(this.cursorNode, 'mousedown');
            Event.off(this.cursorNode, 'touchstart');
         },
    
        //æ‰“å¼€æŽ§åˆ¶è¿›åº¦æ¡
        _cancelHideProgress: function(e) {
            var that = this;
            Event.on(this.cursorNode, 'mousedown', function(e) {that._onMouseDown(e);});
            Event.on(this.cursorNode, 'touchstart', function(e) {that._onMouseDown(e);});
         },
    
    
        
    
        //handle click
        _onMouseClick: function(e) {
            var that = this;
            //è§£å†³é¼ æ ‡ å’Œ è¿›åº¦æ¡ ä¸ç»Ÿä¸€bug
            var x = this.el().offsetLeft;
            var b = this.el();
    
            while(b = b.offsetParent)
            {
                x += b.offsetLeft;
            }
            var pageX = e.touches? e.touches[0].pageX: e.pageX,
                distance = pageX - x,//,this.el().offsetLeft,
                width = this.el().offsetWidth,
                sec = (this._player.getDuration()) ? distance / width * this._player.getDuration(): 0;
    
            if (sec < 0) sec = 0;
            if (sec > this._player.getDuration()) sec = this._player.getDuration();
    
            this._player.trigger('seekStart', {fromTime: this._player.getCurrentTime()});
            this._player.seek(sec);
            
            this._player.play();
            this._player.trigger('seekEnd', {toTime: this._player.getCurrentTime()});
        },
    
        _onMouseDown: function(e) {
            var that = this;
    
            e.preventDefault();
            //e.stopPropagation();
    
            this._player.pause();
            this._player.trigger('seekStart', {fromTime: this._player.getCurrentTime()});
    
            Event.on(this.controlNode, 'mousemove', function(e) {that._onMouseMove(e);});
            //Event.on(this.cursorNode, 'mouseup', function(e) {that._onMouseUp(e);});
            Event.on(this.controlNode, 'touchmove', function(e) {that._onMouseMove(e);});
            //Event.on(this.cursorNode, 'touchend', function(e) {that._onMouseUp(e);});
    
            Event.on(this._player.tag, 'mouseup', function(e) {that._onPlayerMouseUp(e);});
            Event.on(this._player.tag, 'touchend', function(e) {that._onPlayerMouseUp(e);});
            Event.on(this.controlNode, 'mouseup', function(e) {that._onControlBarMouseUp(e);});
            Event.on(this.controlNode, 'touchend', function(e) {that._onControlBarMouseUp(e);});
        },
    
        _onMouseUp: function(e) {
            var that = this;
            e.preventDefault();
    
            Event.off(this.controlNode, 'mousemove');
            //Event.off(this.cursorNode, 'mouseup');
            Event.off(this.controlNode, 'touchmove');
            //Event.off(this.cursorNode, 'touchend');
            Event.off(this._player.tag, 'mouseup');
            Event.off(this._player.tag, 'touchend');
            Event.off(this.controlNode, 'mouseup');
            Event.off(this.controlNode, 'touchend');
            
            // è®¾ç½®å½“å‰æ—¶é—´ï¼Œæ’­æ”¾è§†é¢‘
            var sec = this.playedNode.offsetWidth / this.el().offsetWidth * this._player.getDuration();
            var sec_now = this._player.getDuration();
            this._player.seek(sec);
            this._player.play();
            this._player.trigger('seekEnd', {toTime: this._player.getCurrentTime()});
        },
    
        _onControlBarMouseUp: function(e) {
            var that = this;
            e.preventDefault();
    
            Event.off(this.controlNode, 'mousemove');
            //Event.off(this.cursorNode, 'mouseup');
            Event.off(this.controlNode, 'touchmove');
            //Event.off(this.cursorNode, 'touchend');
            Event.off(this._player.tag, 'mouseup');
            Event.off(this._player.tag, 'touchend');
            Event.off(this.controlNode, 'mouseup');
            Event.off(this.controlNode, 'touchend');
            
            // è®¾ç½®å½“å‰æ—¶é—´ï¼Œæ’­æ”¾è§†é¢‘
            var sec = this.playedNode.offsetWidth / this.el().offsetWidth * this._player.getDuration();
            var sec_now = this._player.getDuration();
            this._player.seek(sec);
            
            this._player.play();
            this._player.trigger('seekEnd', {toTime: this._player.getCurrentTime()});
        },
    
    
        _onPlayerMouseUp: function(e) {
            var that = this;
            e.preventDefault();
    
            Event.off(this.controlNode, 'mousemove');
            //Event.off(this.cursorNode, 'mouseup');
            Event.off(this.controlNode, 'touchmove');
            //Event.off(this.cursorNode, 'touchend');
            Event.off(this._player.tag, 'mouseup');
            Event.off(this._player.tag, 'touchend');
            Event.off(this.controlNode, 'mouseup');
            Event.off(this.controlNode, 'touchend');
            
            // è®¾ç½®å½“å‰æ—¶é—´ï¼Œæ’­æ”¾è§†é¢‘
            var sec = this.playedNode.offsetWidth / this.el().offsetWidth * this._player.getDuration();
            var sec_now = this._player.getDuration();
            if(!isNaN(sec))
            {
                this._player.seek(sec);
                this._player.play();
            }
    
            this._player.trigger('seekEnd', {toTime: this._player.getCurrentTime()});
        },
    
        _onMouseMove: function(e) {
            e.preventDefault();
            //e.stopPropagation();
    
            
            //è§£å†³é¼ æ ‡ å’Œ è¿›åº¦æ¡ ä¸ç»Ÿä¸€bug
            var x = this.el().offsetLeft;
            var b = this.el();
    
            while(b = b.offsetParent)
            {
                x += b.offsetLeft;
            }
    
            var pageX = e.touches? e.touches[0].pageX: e.pageX,
            distance = pageX - x,//this.el().offsetLeft,
            width = this.el().offsetWidth,
            sec = (this._player.getDuration()) ? distance / width * this._player.getDuration(): 0;
    
            if (sec < 0) sec = 0;
            if (sec > this._player.getDuration()) sec = this._player.getDuration();
    
            this._player.seek(sec);
            
            this._player.play();
            this._updateProgressBar(this.playedNode, sec);
            this._updateCursorPosition(sec);
        },
    
        _onTimeupdate: function(e) {
            // iosä¸‹
            // ä¸ºäº†è§£å†³seekä¼šè·³è½¬åˆ°åŽŸæ¥çš„ä½ç½®ï¼Œéœ€è¦è¿›å…¥lockçš„æœºåˆ¶ã€‚ã€‚ã€‚ä¸‘é™‹çš„ä»£ç 
            // åªæœ‰å½“å‰æ—¶åˆ»ä¸Žseektoçš„æ—¶åˆ»é—´éš”å°äºŽ1ç§’ï¼Œå¹¶ä¸”è¿žç»­ä¸‰æ¬¡ï¼Œæ‰æ”¾å¼€lock
            /*
            if (S.UA.ios) {
                var thre = Math.abs(this._player.getCurrentTime() - this._player.getLastSeekTime());
                if (this._player.getSeekLock()) {
                    if (thre < 1 && this.lockCount > 3) {
                        this._player.setSeekLock(false);
                        this.lockCount = 1;
                    } else if (thre < 1){
                        this.lockCount++;
                    }
                }
    
                if (!this._player.getSeekLock() ) {
                    this._updateProgressBar(this.playedNode, this._player.getCurrentTime());
                    this._updateCursorPosition(this._player.getCurrentTime());
                    this._updateTip(this._player.getCurrentTime());
                    
                    this._player.fire('updateProgressBar', {
                        time: this._player.getCurrentTime()
                    });
                }
            
            } else {
            */
            this._updateProgressBar(this.playedNode, this._player.getCurrentTime());
            this._updateCursorPosition(this._player.getCurrentTime());
            
            this._player.trigger('updateProgressBar', {
                time: this._player.getCurrentTime()
            });
            //}
        },
    
        _onProgress: function(e) {
            // æ­¤æ—¶bufferå¯èƒ½è¿˜æ²¡æœ‰å‡†å¤‡å¥½
            if (this._player.getDuration()) {
                if(this._player.getBuffered().length>=1)
                {
                    this._updateProgressBar(this.loadedNode, this._player.getBuffered().end(this._player.getBuffered().length - 1));
                }
            }
        },
    
        _updateProgressBar: function(node, sec) {
            if(this._player._switchSourcing == true)
                return;
            var percent = (this._player.getDuration()) ? sec / this._player.getDuration(): 0;
            if (node) {
                Dom.css(node, 'width', (percent * 100) + '%');
            };		
        },
    
        _updateCursorPosition: function(sec) {
            if(this._player._switchSourcing == true)
                return;
            var percent = (this._player.getDuration()) ? sec / this._player.getDuration(): 0;
            if (this.cursorNode) {
                Dom.css(this.cursorNode, 'left', (percent * 100) + '%');
            };
        }
    });
    
    module.exports = Progress;
    
    },{"../../lib/dom":45,"../../lib/event":46,"../../lib/function":47,"../../lib/ua":52,"../component":62}],71:[function(require,module,exports){
    /**
     * @fileoverview æ’­æ”¾æ—¶é—´
     */
    var Component = require('../component');
    var _ = require('../../lib/object');
    var Util = require('../../lib/util');
    var Dom = require('../../lib/dom');
    var Event = require('../../lib/event');
    var constants = require('../../lib/constants');
    
    var StreamSelector = Component.extend({
        init: function  (player,options) {
            var that = this;
            this._hasGeneratedList = false;
            this._previousSelection = null;
            this._isShown = false;
            Component.call(this, player, options);
    
            this.className = options.className ? options.className : 'prism-stream-selector';
            this.addClass(this.className);
        },
    
        createEl: function() {
            var el = Component.prototype.createEl.call(this,'div');
            el.innerHTML = '<div class="current-stream-selector">æ ‡æ¸…</div><ul class="stream-selector-list"></ul><p class="stream-selector-tip"></p>';
            return el;
        },
    
        bindEvent: function() {
            var that = this;
            var ele =  document.querySelector('#' + that.id() + ' .current-stream-selector');
            var list =  document.querySelector('#' + that.id() + ' .stream-selector-list');
            Event.on(list,'mouseleave',function(){
                Dom.css(list,'display','none');
                that._isShown = false;
            });
    
            this._player.on('sourceloaded',function(e){
                var desc = e.paramData.desc;
                var ele =  document.querySelector('#' + that.id() + ' .current-stream-selector');
                ele.innerText = desc;
                Dom.css(ele,'display','block');
            });
            Event.on(ele,'click',function(){
               if(that._hasGeneratedList)
               {
                    Dom.css(list,'display',(that._isShown == false?'block':'none'));
                    that._isShown = !that._isShown;
               }
               else
               {
                   var urls = that._player._urls;
                   if(urls.length > 0)
                   {  
                       _.each(urls, function(v, index) {
                          var liEle = Dom.createEl.call(that,'li',{
                              url:v.Url,
                              index:index,
                              text: v.desc
                          });
                          if(that._player._currentPlayIndex == index)
                          {
                             Dom.addClass(liEle,  'current');
                             that._previousSelection = liEle;
                          }
                          var span = Dom.createEl.call(that,'span',{
                              url:v.Url,
                              index:index,
                              text: v.desc
                          });
                          span.innerText = v.desc;
                          liEle.appendChild(span);
                          list.appendChild(liEle);
                          that._hasGeneratedList = true;
                          Dom.css(list,'display','block');
                      });
                   }  
                }
            });
    
            Event.on(list,'click',function(event){
                var obj = event.srcElement ? event.srcElement : event.target;
                Dom.getElementAttributes(obj);
                var url = obj.url, index = obj.index, text= obj.text;
                if(typeof text == 'undefined')
                {
                    return;
                }
                that._player._switchSourcing = true;
                if(that._previousSelection)
                {
                   Dom.removeClass(that._previousSelection, 'current');
                }
                that._previousSelection = obj;
                Dom.addClass(obj, 'current');
              
                that._player._currentPlayIndex = index;
                if(that._player._urls.length > index)
                {
                    url = that._player._urls[index].Url;
                }
                var ele =  document.querySelector('#' + that.id() + ' .current-stream-selector');
                ele.innerText = text;
                that._player.loadByUrl(url,that._player.getCurrentTime());
                Dom.css(list,'display','none');
                that._isShown = false;
                var tip =  document.querySelector('#' + that.id() + ' .stream-selector-tip');
                tip.innerText = 'åˆ‡æ¢ä¸º' + text;
                Dom.css(tip,'display','block');
                setTimeout(function(){
                    Dom.css(tip,'display','none');
                },2000);
                setTimeout(function(){
                    that._player._switchSourcing = false;
                });
            });
        }
    });
    
    module.exports = StreamSelector;
    
    },{"../../lib/constants":42,"../../lib/dom":45,"../../lib/event":46,"../../lib/object":50,"../../lib/util":54,"../component":62}],72:[function(require,module,exports){
    /**
     * @fileoverview æ’­æ”¾æ—¶é—´
     */
    var Component = require('../component');
    var Util = require('../../lib/util');
    
    var TimeDisplay = Component.extend({
        init: function  (player,options) {
            var that = this;
            Component.call(this, player, options);
    
            this.className = options.className ? options.className : 'prism-time-display';
            this.addClass(this.className);
        },
    
        createEl: function() {
            var el = Component.prototype.createEl.call(this,'div');
            el.innerHTML = '<span class="current-time">00:00</span> <span class="time-bound">/</span> <span class="duration">00:00</span>';
            return el;
        },
    
        bindEvent: function() {
            var that = this;
    
            this._player.on('durationchange', function() {
                var dur = Util.formatTime(that._player.getDuration());
                if (dur) {
                    document.querySelector('#' + that.id() + ' .time-bound').style.display = 'inline';
                    document.querySelector('#' + that.id() + ' .duration').style.display = 'inline';
                    document.querySelector('#' + that.id() + ' .duration').innerText = dur;
                } else {
                    document.querySelector('#' + that.id() + ' .duration').style.display = 'none';
                    document.querySelector('#' + that.id() + ' .time-bound').style.display = 'none';
                }
            });
    
            this._player.on('timeupdate', function() {
                //var curr_time = that._player.getCurrentTime();
                var curr = Util.formatTime(that._player.getCurrentTime());
    
                /*
                if (!this._player.last_curT) {
                    this._player.last_curT = curr_time;
                }
                else {
                    var diff = curr - this._player.last_curT;
                    console.log("diff_time" + diff);
                    this._player.last_curT = curr_time;
                }
                */
                var curTime = document.querySelector('#' + that.id() + ' .current-time');
                if (!curTime) {return };
                if (curr) {
    
                    document.querySelector('#' + that.id() + ' .current-time').style.display = 'inline';
                    document.querySelector('#' + that.id() + ' .current-time').innerText = curr;
                } else {
                    document.querySelector('#' + that.id() + ' .current-time').style.display = 'none';
                }
            });
        }
    });
    
    module.exports = TimeDisplay;
    
    },{"../../lib/util":54,"../component":62}],73:[function(require,module,exports){
    /**
     * @fileoverview éŸ³é‡æŒ‰é’®ï¼Œh5ä¸‹åªåšé™éŸ³éžé™éŸ³çš„æŽ§åˆ¶
     */
    var Component = require('../component');
    
    var Volume = Component.extend({
        init: function  (player, options) {
            var that = this;
            Component.call(this, player, options);
            this.addClass(options.className || 'prism-volume');
        },
        
        bindEvent: function() {
            var that = this;
            
            this.on('click', function() {
                if (that._player.muted()) {
                    that._player.unMute();
                    that.removeClass('mute');
                } else {
                    that._player.mute();
                    that.addClass('mute');
                }
            });
        }
    });
    
    module.exports = Volume;
    
    },{"../component":62}],74:[function(require,module,exports){
    /**
     * @fileoverview uiç»„ä»¶åˆ—è¡¨ï¼Œfullversionä¼šå°†å®šä¹‰çš„æ‰€æœ‰uiç»„ä»¶åˆ—äºŽæ­¤åšç»Ÿä¸€åŠ è½½
     *               åŽæœŸè¡¥ä¸Šæ ¹æ®å®žé™…éœ€æ±‚é…ç½®ç»„ä»¶åˆ—è¡¨ï¼Œä»Žè€Œä¸€å®šç¨‹åº¦ä¸Šå‡å°‘ä½“ç§¯
     * @author é¦–ä½œ<aloysious.ld@taobao.com>
     * @date 2015-01-05
     */
    module.exports = {
      'H5Loading': require('./component/h5-loading'),
      'bigPlayButton': require('./component/big-play-button'),
      'controlBar': require('./component/controlbar'),
      'progress': require('./component/progress'),
      'playButton': require('./component/play-button'),
      'liveDisplay': require('./component/live-display'),
      'timeDisplay': require('./component/time-display'),
      'fullScreenButton': require('./component/fullscreen-button'),
      'volume': require('./component/volume'),
      'streamButton': require('./component/stream-selector')
    };
    
    },{"./component/big-play-button":63,"./component/controlbar":64,"./component/fullscreen-button":66,"./component/h5-loading":67,"./component/live-display":68,"./component/play-button":69,"./component/progress":70,"./component/stream-selector":71,"./component/time-display":72,"./component/volume":73}]},{},[41]);
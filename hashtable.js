function NotFound (key) {
  var err = new Error('Not Found:'+key)
  err.notFound = true
  return err
}

module.exports = function (hash, matches, get) {
  return function (buffer, slots) {
    var self
    var size = 4
    var count = 0
    if(!buffer) {
      buffer = new Buffer(size*slots)
      buffer.fill(0)
    }
    else {
      slots = buffer.length/size
      //XXX reads count, but doesn't use update it later!!!
      count = buffer.readUInt32BE(0)
    }
    function _get (i) {
      return buffer.readUInt32BE((i%slots)*size)
    }
    function _set (i, v) {
      buffer.writeUInt32BE(v, (i%slots)*size)
    }

    return self = {
      count: count,
      slots: slots,
      get: function (key, cb) {
        ;(function next (i) {
          var k = _get(i)
          if(k === 0)
            cb(NotFound(key))
          else
            get(k, function (err, data) {
              if(err) cb(err)
              else if(matches(data, key)) cb(null, data)
              else next(i + 1)
            })
        })(hash(key))
      },
      _get: _get,
      add: function (key, value) {
        var i = hash(key)
        while(_get(i) !== 0) i++
        _set(i, value)
        //XXX what if you add exactly the same thing twice?
        self.count = ++count
        return i
      },
      buffer: buffer,
      load: function () {
        return count / slots
      }
    }
  }
}


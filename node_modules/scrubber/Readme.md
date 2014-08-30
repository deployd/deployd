# srcubber

Find and replace values in objects. Easily walk unkown structures and operate on its values. In-place updates by just returning whatever you want the new value to be.

## install

    npm install scrubber

## usage

Find and replace string ObjectIDs

    var query = {
      $or: [
        {
          _id: '4fc487cc0afe090000000048'
        },
        {
          name: 'foo',
          _id: {$in: [1, 2, 3, '4fc487cc0afe090000000048']}
        },
        {
          number: {$gt: 7}
        }
      ]
    }
    
    scrub(query, function (obj, key, parent, type) {
      // find any value that might be an ObjectID
      if(type == 'string' && obj.length === 24) {
        try {
          // try and create one
          var id = ObjectID.createFromHexString(obj)
        } catch() { }
        
        // replace the value with id
        return id
      }
    })
    
Sum all the numbers in an object.

    sum = {
      a: [1]
      b: {
        c: [2],
        d: {
          e: [3],
          f: {
            g: [4]
          }
        }
      }
    }
    
    total = 0
    
    scrub(sum, function(obj, key, parent, type) {
      if(type == number) {
        total += obj
      }
    })
    
    console.log(tota); // 10

Its also kinda cool that it can replace any other way of iterating. But don't use it unless you need to walk an unknown structure.

    function count(obj) {
      var c = 0;
      scrub(obj, function() { c++ });
      return c;
    }

    count([1,2,3]) // 3
    
    count({a: 1, b: 2, c:, 3}) // 3

    var crazy = {
      a: {
        b: {
          c: {
            d: {
              e: [1, 2, 3, 4, {
                f: 5,
                g: {
                  h: {i: 6, j: k: 7, l: 8, m: 9}
                }
              }]
            }
          }
        }
      }
    };

    count(crazy) // 9

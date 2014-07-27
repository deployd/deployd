# validation

Simple validation lib for checking types.

## install

npm install validation

## usage

### validation.isType(value, type)

Checks for a valid value of the given type.

    validation.isType(new Date(), 'date')         // true
    validation.isType([1,2,3], 'array')           // true
    validation.isType({}, 'object')               // true
    validation.isType('foobar', 'string')         // true
  
Opinionated to make input validation simple. For example `new Date(Infinity)` is a date, but an invalid type of date.
Also `NaN` is not a 'number' even though `typeof NaN === 'number'`.
  
    validation.isType(new Date(Infinity), 'date') // false
    validation.isType({length: 7}, 'array')       // false
    validation.isType(NaN, 'number')              // false
    validation.isType('123', 'number')            // false
    
See tests for more examples.

### validation.exists(value)

Checks if a value exists.

    validation.exists('foobar')                   // true
    validation.exists(function() {})              // true
    validation.exists(0)                          // true
    validation.exists(-1)                         // true
    validation.exists(null)                       // false
    validation.exists(undefined)                  // false
    validation.exists(NaN)                        // false

## license

Copyright (C) 2012 Ritchie Martori

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
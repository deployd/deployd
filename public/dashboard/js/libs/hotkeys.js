Zap.app.hotkeys = {

  // Keys in the `hotkeys` namespace in english.
  KEYS: {
    '16':  'shift',
    '17':  'command',
    '91':  'command',
    '93':  'command',
    '224': 'command',
    '13':  'enter',
    '37':  'left',
    '38':  'upArrow',
    '39':  'right',
    '40':  'downArrow',
    '46':  'delete',
    '8':   'backspace',
    '9':   'tab',
    '188': 'comma'
  },

  // Check a key from an event and return the common english name.
  key : function(e) {
    return this.KEYS[e.which];
  }

};
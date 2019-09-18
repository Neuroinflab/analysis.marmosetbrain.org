jest.dontMock('../Store');
jest.dontMock('object-assign');

describe('Store', function() {

  var AppDispatcher;
  var Store;
  var callback;

  // mock actions
  var actionCreate = {
    actionType: 'create',
    text: 'foo'
  };

  beforeEach(function() {
    AppDispatcher = require('../../dispatcher/AppDispatcher');
    Store = require('../Store');
    callback = AppDispatcher.register.mock.calls[0][0];
  });

  it('registers a callback with the dispatcher', function() {
    expect(AppDispatcher.register.mock.calls.length).toBe(1);
  });

  it('should initialize with no to-do items', function() {
    var all = Store.getAll();
    expect(all).toEqual({});
  });

  it('creates a to-do item', function() {
    callback(actionCreate);
    var all = Store.getAll();
    var keys = Object.keys(all);
    expect(keys.length).toBe(1);
    expect(all[keys[0]].text).toEqual('foo');
  });
});

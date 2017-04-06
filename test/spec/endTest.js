var test = require('tape');

test('Close server after testing done!', function (t) {
    // exit application
    t.end();
    process.exit(0);
});
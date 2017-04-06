module.exports = function (grunt) {

    // (*) load all npm tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    grunt.initConfig({
        copy: {
            appsettings: {
                files: [{

                    // Copy if file does not exist.
                    expand: true,
                    // Flatten means: remove parent folder,
                    // keep only filename in rename function
                    flatten: false,
                    cwd: './',
                    src: ['__*.json', 'config/__*.json'],
                    dest: './',
                    rename: function (dest, src) {
                        grunt.log.writeln('Preparing copy: ' + src);
                        let newFile = dest + src.replace(/(__)(.+[.]json)$/, '$2');
                        grunt.log.writeln('Please consider to config: ' + newFile);
                        return newFile;
                    },
                    // Copy if file does not exist.
                    filter: function (filepath) {
                        // Configures variables (these are documented for your convenience only)
                        let path = require('path');
                        let cwd = this.cwd;

                        // Construct the destination file path.
                        let src = filepath.replace(new RegExp('^' + cwd), '');
                        let dest = path.resolve(grunt.task.current.data.files[0].dest + src.replace(/(__)(.+[.]json)$/, '$2'));
                        let result = grunt.file.exists(dest);
                        grunt.log.writeln(`checking template config: src (${src}) dest (${dest}) (exists: ${result})`);
                        // Return false if the file exists.
                        return !result;
                    },
                }]
            }
        }
    });

    // setup tasks
    grunt.registerTask('default', ['copy']);
    grunt.registerTask('setup', ['copy']);

};
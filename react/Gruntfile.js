module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        watch: {
            sass: {
                files: ['css/scss/**/*.{scss,sass}','css/scss/_partials/**/*.{scss,sass}'],
                tasks: ['sass:dist'],
                options: {
                    //livereload: 35730,
                    livereloadOnError: false,
                    spawn: false
                }
            },
        },
        sass: {
            options: {
                sourceMap: true,
                outputStyle: 'compressed'
            },
            dist: {
                files: {
                    'css/styles.css': 'css/scss/styles.scss'
                }
            }
        },
        concat: {
            dist: {
                options: {
     
                },
                src: [
                    'node_modules/react-rangeslider/lib/index.css'
                ],
                dest: 'css/scss/_npm.scss',
            }
        }
    });
    grunt.registerTask('default', ['concat:dist', 'sass:dist', 'watch']);
    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
};


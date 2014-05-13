module.exports = function(grunt) {

    grunt.initConfig({
        
        js:     'build/retriever.js',
        minjs:  'build/retriever.min.js',

        pkg: grunt.file.readJSON('package.json'),

        sprockets: {
            build: {
                options: {
                    compare: ['browser'],
                },
                files: ['src/index.js'],
                dest: '<%= js %>'
            }
        },

        uglify: {
            dist: {
                files: {
                    '<%= minjs %>': ['<%= js %>']
                }
            }
        },

        mochacli: {
            options: {
                files: ['test/*.test.js']
            },
            spec: {
                options: {
                    reporter: 'spec'
                }
            }
        },

        watch: {
            tests: {
                files: ['src/*.js'],
                tasks: ['mochacli:spec']
            },
            js: {
                files: ['src/*.js'],
                tasks: ['sprockets']
            },
            doc: {
                files: ['src/js/*.js'],
                tasks: ['gendoc']
            }
        },

        yuidoc: {
            compile: {
                name: 'Retriever',
                description: 'A simple / lightweight JavaScript template engine',
                version: '<%= pkg.version %>',
                url: 'https://github.com/ysugimoto/Retriever',
                options: {
                    paths: 'src/',
                    themedir: 'etc/yuidoc-theme-blue/',
                    outdir: 'docs/'
                }
            }
        },

        plato: {
            options: {
                complexity: {
                    logicalor: true,
                    switchcase: true,
                    forin: true,
                    trycatch: true,
                    newmi: true
                },
                exclude: /src\/index\.js|src\/retriever\.js/
            },
            unit: {
                files: {
                    'reports/': ['src/*.js']
                }
            }
        }

    });

    grunt.loadNpmTasks('grunt-sprockets');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-mocha-cli');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-yuidoc');
    grunt.loadNpmTasks('grunt-plato');

    grunt.registerTask('gendoc', ['yuidoc']);
    grunt.registerTask('test', ['mochacli:spec']);
    grunt.registerTask('dev', ['watch:js']);
    grunt.registerTask('default', ['sprockets:build']);
    grunt.registerTask('build', ['sprockets:build', 'uglify']);
};

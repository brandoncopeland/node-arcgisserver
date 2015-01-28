module.exports = function (grunt) {
  grunt.initConfig({
    jshint: {
      src: ['bin/*.js', 'lib/**/*.js'],
      options: {
        jshintrc: '.jshintrc'
      }
    },
    jscs: {
      src: ['bin/*.js', 'lib/**/*.js'],
      options: {
        config: '.jscsrc'
      }
    },
    jasmine_node: {
      all: ['specs/']
    },
    release: {
      options: {
        tagName: '<%= version %>',
        commitMessage: 'release <%= version %>',
        tagMessage: 'tag <%= version %>' //default: 'Version <%= version %>'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jscs');
  grunt.loadNpmTasks('grunt-jasmine-node');
  grunt.loadNpmTasks('grunt-release');

  grunt.registerTask('test', ['jshint', 'jscs', 'jasmine_node']);
};
module.exports = function (grunt) {
  grunt.initConfig({
    jshint: {
      lib: {
        src: ['bin/*.js', 'lib/**/*.js']
      },
      options: {
        jshintrc: '.jshintrc'
      }
    },
    jasmine_node: {
      all: ['specs/']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jasmine-node');

  grunt.registerTask('test', ['jshint', 'jasmine_node']);
};
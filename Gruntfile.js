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
    },
    release: {
      options: {
        tagName: '<%= version %>',
        commitMessage: 'release <%= version %>',
        tagMessage: 'tag <%= version %>', //default: 'Version <%= version %>'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jasmine-node');
  grunt.loadNpmTasks('grunt-release');

  grunt.registerTask('test', ['jshint', 'jasmine_node']);
};